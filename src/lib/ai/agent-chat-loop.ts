/**
 * AgentChatLoop — 对话循环控制器
 *
 * 实现 OpenAI 标准的 tool calling 循环：
 * 1. 发送 messages + tools 到 LLM
 * 2. LLM 返回 tool_calls → 暂停文本流，执行工具
 * 3. HITL 检查 → 危险操作触发确认 UI
 * 4. 工具结果追加为 role: "tool" 消息
 * 5. 重新调用 LLM（带工具结果）直到无 tool_calls
 *
 * 上下文窗口：最近 10 轮 + 4K token 给工具调用结果
 */

import { ModelRouter } from './model-router';
import type { ChatMessage, ToolCall } from './model-router';
import { ToolRegistry } from './tool-registry';
import { ToolExecutor, type ExecutionResult } from './tool-executor';
import { buildSystemPrompt, type SystemPromptContext } from './agent-system-prompt';
import type { AgentRunStatus } from '@/store/use-canvas-agent-store';

// ─── 回调接口 ────────────────────────────────────────────

/** 对话循环回调 */
export interface ChatLoopCallbacks {
  /** 运行状态变化 */
  onStatusChange: (status: AgentRunStatus) => void;
  /** 决策步骤变化 */
  onStepChange: (step: string) => void;
  /** 文本增量（流式输出） */
  onTextDelta: (delta: string) => void;
  /** 工具调用开始 */
  onToolCallStart: (toolName: string, args: Record<string, unknown>) => void;
  /** 工具调用结束 */
  onToolCallEnd: (toolName: string, result: ExecutionResult['result']) => void;
  /** HITL 确认请求 */
  onRequestConfirmation: (description: string) => Promise<boolean>;
  /** 错误回调 */
  onError: (error: string) => void;
  /** 对话循环完成 */
  onComplete: () => void;
}

/** 对话循环配置 */
export interface AgentChatLoopOptions {
  /** 消息上下文窗口轮数（默认 10） */
  contextWindowTurns?: number;
  /** 工具调用结果最大 token 数（默认 4000） */
  toolResultMaxTokens?: number;
  /** 是否启用 HITL（默认 true） */
  hitlEnabled?: boolean;
  /** 最大工具调用循环次数（默认 5，防止无限循环） */
  maxToolLoops?: number;
}

// ─── AgentChatLoop 类 ───────────────────────────────────

/**
 * AgentChatLoop — 对话循环控制器
 *
 * 管理完整的 LLM 对话循环，包括流式响应、工具调用、HITL 确认和上下文窗口。
 */
export class AgentChatLoop {
  private abortController: AbortController | null = null;

  private readonly router: ModelRouter;
  private readonly registry: ToolRegistry;
  private readonly executor: ToolExecutor;
  private readonly options: Required<AgentChatLoopOptions>;

  constructor(
    router: ModelRouter,
    registry: ToolRegistry,
    options?: AgentChatLoopOptions
  ) {
    this.router = router;
    this.registry = registry;
    this.executor = new ToolExecutor(registry);
    this.options = {
      contextWindowTurns: options?.contextWindowTurns ?? 10,
      toolResultMaxTokens: options?.toolResultMaxTokens ?? 4000,
      hitlEnabled: options?.hitlEnabled ?? true,
      maxToolLoops: options?.maxToolLoops ?? 5,
    };
  }

  /**
   * 发送用户消息并执行完整对话循环
   *
   * @param userMessage - 用户输入文本
   * @param history - 历史消息（用于上下文窗口）
   * @param callbacks - UI 回调函数
   * @param context - 系统提示词上下文
   */
  async sendMessage(
    userMessage: string,
    history: ChatMessage[],
    callbacks: ChatLoopCallbacks,
    context?: SystemPromptContext
  ): Promise<void> {
    this.abortController = new AbortController();

    try {
      callbacks.onStatusChange('thinking');
      callbacks.onStepChange('understand');

      // 构建系统提示词
      const systemMsg = buildSystemPrompt(context ?? { currentPage: '/' });

      // 构建上下文窗口（最近 N 轮）
      const contextMessages = this.buildContext(history, this.options.contextWindowTurns);

      const messages: ChatMessage[] = [
        systemMsg,
        ...contextMessages,
        { role: 'user', content: userMessage },
      ];

      // 工具调用循环
      let continueLoop = true;
      let loopCount = 0;

      while (continueLoop && loopCount < this.options.maxToolLoops) {
        loopCount++;

        // 调用 LLM（流式）
        callbacks.onStepChange('generate');
        callbacks.onStatusChange('generating');

        const stream = await this.router.routeStream('general', {
          messages,
          tools: this.registry.getToolDefinitions(),
          tool_choice: 'auto',
          temperature: 0.7,
          max_tokens: 2000,
        }, { signal: this.abortController?.signal });

        // 处理流式响应
        let fullContent = '';
        const currentToolCalls: Map<number, { id: string; name: string; args: string }> = new Map();

        const reader = stream.getReader();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            for (const choice of value.choices) {
              // 文本内容
              if (choice.delta?.content) {
                fullContent += choice.delta.content;
                callbacks.onTextDelta(choice.delta.content);
              }

              // 工具调用（增量累积）
              if (choice.delta?.tool_calls) {
                for (const tc of choice.delta.tool_calls) {
                  const idx = tc.index ?? 0;
                  if (!currentToolCalls.has(idx)) {
                    currentToolCalls.set(idx, { id: tc.id ?? '', name: tc.function?.name ?? '', args: '' });
                  }
                  const existing = currentToolCalls.get(idx)!;
                  if (tc.id) existing.id = tc.id;
                  if (tc.function?.name) existing.name = tc.function.name;
                  if (tc.function?.arguments) existing.args += tc.function.arguments;
                }
              }
            }
          }
        } finally {
          reader.releaseLock();
        }

        // 转换累积的工具调用
        const toolCalls: ToolCall[] = Array.from(currentToolCalls.entries()).map(
          ([idx, tc]) => ({
            id: tc.id || `tc_${idx}`,
            type: 'function' as const,
            function: { name: tc.name, arguments: tc.args },
          })
        );

        // 添加 assistant 消息到对话
        const assistantMsg: ChatMessage = {
          role: 'assistant',
          content: fullContent || null,
          ...(toolCalls.length > 0 ? { tool_calls: toolCalls } : {}),
        };
        messages.push(assistantMsg);

        // 没有工具调用，循环结束
        if (toolCalls.length === 0) {
          // 如果内容为空，报错而非静默完成
          if (!fullContent) {
            throw new Error(
              'AI 返回了空内容。可能原因：\n' +
              '1. API 不支持 stream:true（检查控制台 [ModelRouter] 日志）\n' +
              '2. API 不支持 tools 参数（尝试关闭工具调用）\n' +
              '3. 模型名错误或 API Key 无效\n' +
              '4. SSE 格式不兼容\n' +
              '请按 F12 打开浏览器控制台查看 [ModelRouter] 诊断日志'
            );
          }
          continueLoop = false;
          break;
        }

        // 执行工具调用
        callbacks.onStatusChange('assembling');
        callbacks.onStepChange('assemble');

        for (const tc of toolCalls) {
          // 解析参数
          let args: Record<string, unknown> = {};
          try {
            args = JSON.parse(tc.function.arguments);
          } catch {
            // 参数解析失败，跳过
          }

          callbacks.onToolCallStart(tc.function.name, args);

          // HITL 检查
          const registeredTool = this.registry.getTool(tc.function.name);
          if (registeredTool?.dangerous && this.options.hitlEnabled) {
            callbacks.onStatusChange('waiting');
            const description = `确定要执行「${registeredTool.definition.function.description}」吗？此操作不可撤销。`;
            const approved = await callbacks.onRequestConfirmation(description);

            if (!approved) {
              callbacks.onToolCallEnd(tc.function.name, { success: false, error: '用户拒绝执行' });
              messages.push({
                role: 'tool',
                content: JSON.stringify({ success: false, error: 'User rejected this operation' }),
                tool_call_id: tc.id,
              });
              continue;
            }
          }

          // 执行工具
          const result = await this.executor.executeToolCall(tc);
          callbacks.onToolCallEnd(result.toolName, result.result);

          // 截断过长的工具结果
          let resultContent = JSON.stringify(result.result);
          if (resultContent.length > this.options.toolResultMaxTokens) {
            resultContent = resultContent.slice(0, this.options.toolResultMaxTokens) + '...[truncated]';
          }

          // 添加工具结果到对话
          messages.push({
            role: 'tool',
            content: resultContent,
            tool_call_id: tc.id,
          });
        }

        // 继续循环 — LLM 将看到工具结果并决定下一步
      }

      callbacks.onStatusChange('idle');
      callbacks.onStepChange('');
      callbacks.onComplete();
    } catch (err: unknown) {
      // 用户取消
      if (err instanceof DOMException && err.name === 'AbortError') {
        callbacks.onStatusChange('idle');
        callbacks.onStepChange('');
        callbacks.onComplete();
        return;
      }
      // 路由器错误
      const errorMessage = err instanceof Error ? err.message : '未知错误';
      callbacks.onError(errorMessage);
      callbacks.onStatusChange('error');
      callbacks.onComplete();
    } finally {
      this.abortController = null;
    }
  }

  /**
   * 中止当前对话循环
   */
  abort(): void {
    this.abortController?.abort();
  }

  /**
   * 构建上下文窗口
   *
   * 保留最近 maxTurns 轮的对话（1 轮 = 1 user + 1 assistant）。
   * 只取 role 为 user/assistant/tool 的消息，跳过 system 消息。
   */
  private buildContext(history: ChatMessage[], maxTurns: number): ChatMessage[] {
    // 过滤出对话消息（排除 system）
    const dialogMessages = history.filter((m) => m.role !== 'system');
    // 每轮约 2 条消息（user + assistant），保留最近 maxTurns * 2 条
    const maxMessages = maxTurns * 2;
    return dialogMessages.slice(-maxMessages);
  }
}
