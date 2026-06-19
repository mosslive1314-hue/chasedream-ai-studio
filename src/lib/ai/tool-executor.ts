/**
 * ToolExecutor — 接收 ToolCall，解析参数，执行 store action
 *
 * 负责将 LLM 返回的 ToolCall 转换为实际的 store 操作，
 * 并返回标准化的 ExecutionResult。
 */

import type { ToolCall } from './model-router';
import type { ToolRegistry, ToolResult } from './tool-registry';

// ─── 执行结果 ────────────────────────────────────────────

/** 单个工具调用的执行结果 */
export interface ExecutionResult {
  /** 工具调用 ID（与 LLM 返回的 tool_call.id 对应） */
  toolCallId: string;
  /** 工具名称 */
  toolName: string;
  /** 执行结果 */
  result: ToolResult;
}

// ─── ToolExecutor 类 ────────────────────────────────────

/**
 * ToolExecutor — 工具执行器
 *
 * 接收 LLM 返回的 ToolCall，解析 JSON 参数，
 * 调用 ToolRegistry 中对应的 handler，返回执行结果。
 */
export class ToolExecutor {
  private registry: ToolRegistry;

  constructor(registry: ToolRegistry) {
    this.registry = registry;
  }

  /**
   * 执行单个工具调用
   *
   * 解析 ToolCall 的 arguments JSON，调用对应 handler，
   * 捕获异常并返回标准化的 ExecutionResult。
   */
  async executeToolCall(toolCall: ToolCall): Promise<ExecutionResult> {
    // 解析参数 JSON
    let args: Record<string, unknown> = {};
    try {
      args = JSON.parse(toolCall.function.arguments);
    } catch {
      return {
        toolCallId: toolCall.id,
        toolName: toolCall.function.name,
        result: {
          success: false,
          error: `无效的 JSON 参数: ${toolCall.function.arguments}`,
        },
      };
    }

    // 执行工具
    try {
      const result = await this.registry.execute(toolCall.function.name, args);
      return {
        toolCallId: toolCall.id,
        toolName: toolCall.function.name,
        result,
      };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      return {
        toolCallId: toolCall.id,
        toolName: toolCall.function.name,
        result: {
          success: false,
          error: `工具执行异常: ${errorMessage}`,
        },
      };
    }
  }

  /**
   * 批量执行工具调用
   *
   * 并行执行所有 ToolCall，返回结果数组。
   */
  async executeToolCalls(toolCalls: ToolCall[]): Promise<ExecutionResult[]> {
    return Promise.all(toolCalls.map((tc) => this.executeToolCall(tc)));
  }
}
