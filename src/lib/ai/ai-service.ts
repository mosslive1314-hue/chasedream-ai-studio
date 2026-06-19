/**
 * AI 服务层 — 封装 ModelRouter，提供高层业务 API
 *
 * 为 ChaseDream Creator Studio 提供统一的 AI 能力调用接口。
 * 自动处理提示词构建、JSON 解析、错误处理和流式输出。
 */

import { ModelRouter, createOpenAIProvider } from './model-router';
import type { ChatMessage, ChatCompletionResponse, StreamChunk } from './model-router';
import {
  buildScriptContinuationPrompt,
  buildDialoguePrompt,
  buildBranchSuggestionPrompt,
  buildConsistencyCheckPrompt,
  buildProjectHealthPrompt,
} from './ai-prompts';

// ─── 响应类型 ────────────────────────────────────────────

/** AI 服务统一响应格式 */
export interface AIResponse<T = string> {
  success: boolean;
  data?: T;
  error?: string;
  usage?: { promptTokens: number; completionTokens: number };
  model?: string;
}

/** 对话选项 */
export interface DialogueOption {
  text: string;
  emotion: string;
  suggestedVariable?: { name: string; change: number };
}

/** 分支建议 */
export interface BranchSuggestion {
  label: string;
  description: string;
  targetType: string;
  suggestedVariables?: { name: string; change: number }[];
}

/** 一致性问题 */
export interface ConsistencyIssue {
  severity: 'high' | 'medium' | 'low';
  description: string;
  suggestion: string;
  affectedElements: string[];
}

/** 项目健康度报告 */
export interface HealthReport {
  score: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: { priority: 'high' | 'medium' | 'low'; description: string }[];
}

// ─── AI 服务主类 ──────────────────────────────────────────

/**
 * AIService — 高层 AI 服务接口
 *
 * 封装 ModelRouter，提供剧本续写、对话生成、分支建议、一致性检查等业务功能。
 * 自动处理提示词构建、JSON 解析和错误处理。
 */
export class AIService {
  private router: ModelRouter;

  constructor(router: ModelRouter) {
    this.router = router;
  }

  /**
   * 获取底层 ModelRouter 实例
   *
   * 用于 Agent 系统直接访问路由器，支持流式调用和工具调用。
   */
  getRouter(): ModelRouter {
    return this.router;
  }

  /**
   * 从设置存储创建 AIService 实例
   *
   * 根据用户配置的 AI 提供商、模型名和 API Key，自动创建并配置 ModelRouter。
   * 支持任意 OpenAI 兼容接口（OpenAI / Qwen / Hunyuan / DeepSeek / 自定义）。
   */
  static fromSettings(settings: {
    apiKeys: Record<string, string>;
    aiProvider?: string;
    aiModelName?: string;
    apiBaseUrl?: string;
    // 兼容旧字段
    aiModel?: string;
  }): AIService {
    const router = new ModelRouter({ strategy: 'balanced', budgetCents: 1000 });

    const provider = settings.aiProvider ?? 'openai';
    const modelName = settings.aiModelName ?? 'gpt-4o';
    const apiKey = settings.apiKeys[provider] || settings.apiKeys['openai'] || settings.apiKeys['gpt4'] || settings.apiKeys['qwen'];

    if (apiKey) {
      // 统一用 createOpenAIProvider 构造 OpenAI 兼容提供商
      // baseUrl 优先用用户配置，否则用预设默认
      let baseUrl = settings.apiBaseUrl || '';
      if (!baseUrl) {
        if (provider === 'qwen') baseUrl = 'https://dashscope.aliyuncs.com/compatible-mode/v1';
        else if (provider === 'hunyuan') baseUrl = 'https://api.hunyuan.cloud.tencent.com/v1';
        else if (provider === 'deepseek') baseUrl = 'https://api.deepseek.com/v1';
        else baseUrl = 'https://api.openai.com/v1';
      }

      const providerConfig = createOpenAIProvider(apiKey, baseUrl);
      // 关键修复：用用户配置的模型名替换默认模型列表
      // 之前只改了 defaultModel，但 decideRouting 从 models 数组选模型，
      // 导致用户配了 deepseek-chat 却仍用 gpt-4o 发请求
      providerConfig.defaultModel = modelName;
      providerConfig.id = provider;
      providerConfig.name = provider;
      providerConfig.models = [{
        id: modelName,
        name: modelName,
        inputCostPer1k: 0.5,
        outputCostPer1k: 1.5,
        maxContextTokens: 128000,
        strengths: ['story_generate', 'character_generate', 'branch_generate', 'continue_write', 'convert_to_script', 'general'],
        supportsStream: true,
        supportsTools: true,
      }];
      router.addProvider(providerConfig);
    }

    return new AIService(router);
  }

  // ── 1. 剧本续写 ──────────────────────────────────────────

  /**
   * 续写、扩写或重写剧本内容
   *
   * 根据已有剧本片段、角色设定和世界观规则，让 AI 继续创作后续内容。
   */
  async continueScript(params: {
    projectName: string;
    genre: string;
    existingContent: string;
    characters: { name: string; role: string; description: string }[];
    worldRules: string[];
    continuationType: 'continue' | 'expand' | 'rewrite';
  }): Promise<AIResponse<string>> {
    try {
      const { system, user } = buildScriptContinuationPrompt(params);
      return await this.complete(system, user, 'continue_write');
    } catch (error) {
      return this.handleError(error, '剧本续写');
    }
  }

  // ── 2. 对话生成 ──────────────────────────────────────────

  /**
   * 生成角色对话选项
   *
   * 根据角色设定和当前场景情境，生成多条可选对话，
   * 每条对话附带情感标签和建议的变量影响。
   */
  async generateDialogue(params: {
    characterName: string;
    characterRole: string;
    characterDescription: string;
    situation: string;
    otherCharacters: { name: string; role: string }[];
    dialogueCount?: number;
  }): Promise<AIResponse<DialogueOption[]>> {
    try {
      const dialogueCount = params.dialogueCount || 3;
      const { system, user } = buildDialoguePrompt({ ...params, dialogueCount });
      const response = await this.complete(system, user, 'character_generate');

      if (!response.success || !response.data) {
        return { success: false, error: response.error, usage: response.usage, model: response.model };
      }

      // 解析 JSON 格式的对话选项
      const parsed = this.parseJSON<DialogueOption[]>(response.data);
      if (!parsed) {
        return {
          success: false,
          error: '对话生成结果解析失败，AI 返回格式不正确',
          usage: response.usage,
          model: response.model,
        };
      }

      return {
        success: true,
        data: parsed,
        usage: response.usage,
        model: response.model,
      };
    } catch (error) {
      return this.handleError(error, '对话生成');
    }
  }

  // ── 3. 分支建议 ──────────────────────────────────────────

  /**
   * 生成分支路径建议
   *
   * 分析当前故事节点的结构和上下文，建议可能的分支方向和变量设计。
   */
  async suggestBranches(params: {
    projectName: string;
    currentNodeLabel: string;
    currentNodeType: string;
    connectedNodes: string[];
    existingVariables: { name: string; description: string }[];
    genre: string;
  }): Promise<AIResponse<BranchSuggestion[]>> {
    try {
      const { system, user } = buildBranchSuggestionPrompt(params);
      const response = await this.complete(system, user, 'branch_generate');

      if (!response.success || !response.data) {
        return { success: false, error: response.error, usage: response.usage, model: response.model };
      }

      // 解析 JSON 格式的分支建议
      const parsed = this.parseJSON<BranchSuggestion[]>(response.data);
      if (!parsed) {
        return {
          success: false,
          error: '分支建议结果解析失败，AI 返回格式不正确',
          usage: response.usage,
          model: response.model,
        };
      }

      return {
        success: true,
        data: parsed,
        usage: response.usage,
        model: response.model,
      };
    } catch (error) {
      return this.handleError(error, '分支建议');
    }
  }

  // ── 4. 一致性检查 ──────────────────────────────────────────

  /**
   * 检查内容一致性
   *
   * 检查新创作的内容是否与已建立的世界观规则和角色设定产生矛盾。
   */
  async checkConsistency(params: {
    projectName: string;
    worldRules: string[];
    newContent: string;
    characters: { name: string; role: string; description: string }[];
    existingNodes: string[];
  }): Promise<AIResponse<ConsistencyIssue[]>> {
    try {
      const { system, user } = buildConsistencyCheckPrompt(params);
      const response = await this.complete(system, user, 'content_moderate');

      if (!response.success || !response.data) {
        return { success: false, error: response.error, usage: response.usage, model: response.model };
      }

      // 解析 JSON 格式的一致性问题
      const parsed = this.parseJSON<ConsistencyIssue[]>(response.data);
      if (!parsed) {
        return {
          success: false,
          error: '一致性检查结果解析失败，AI 返回格式不正确',
          usage: response.usage,
          model: response.model,
        };
      }

      return {
        success: true,
        data: parsed,
        usage: response.usage,
        model: response.model,
      };
    } catch (error) {
      return this.handleError(error, '一致性检查');
    }
  }

  // ── 5. 项目健康度分析 ──────────────────────────────────────────

  /**
   * 分析项目健康度
   *
   * 根据项目的统计数据和已知问题，生成综合评估报告和改善建议。
   */
  async analyzeProjectHealth(params: {
    projectName: string;
    genre: string;
    stats: {
      characterCount: number;
      sceneCount: number;
      nodeCount: number;
      edgeCount: number;
      variableCount: number;
      branchPathCount: number;
      endingCount: number;
    };
    issues: string[];
  }): Promise<AIResponse<HealthReport>> {
    try {
      const { system, user } = buildProjectHealthPrompt(params);
      const response = await this.complete(system, user, 'general');

      if (!response.success || !response.data) {
        return { success: false, error: response.error, usage: response.usage, model: response.model };
      }

      // 解析 JSON 格式的健康报告
      const parsed = this.parseJSON<HealthReport>(response.data);
      if (!parsed) {
        return {
          success: false,
          error: '项目健康度报告解析失败，AI 返回格式不正确',
          usage: response.usage,
          model: response.model,
        };
      }

      return {
        success: true,
        data: parsed,
        usage: response.usage,
        model: response.model,
      };
    } catch (error) {
      return this.handleError(error, '项目健康度分析');
    }
  }

  // ── 通用完成接口 ──────────────────────────────────────────

  /**
   * 通用文本完成（非流式）
   *
   * 直接传入 system 和 user 提示词，返回 AI 生成的文本。
   */
  async complete(
    systemPrompt: string,
    userPrompt: string,
    taskType: 'story_generate' | 'character_generate' | 'branch_generate' | 'continue_write' | 'content_moderate' | 'general' = 'general'
  ): Promise<AIResponse<string>> {
    try {
      const messages: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ];

      const response: ChatCompletionResponse = await this.router.route(taskType, {
        messages,
        temperature: 0.7,
        max_tokens: 4000,
      });

      const content = response.choices[0]?.message?.content || '';

      return {
        success: true,
        data: content,
        usage: response.usage
          ? {
              promptTokens: response.usage.prompt_tokens,
              completionTokens: response.usage.completion_tokens,
            }
          : undefined,
        model: response.model,
      };
    } catch (error) {
      return this.handleError(error, '通用完成');
    }
  }

  /**
   * 流式文本完成
   *
   * 直接传入 system 和 user 提示词，通过回调函数逐步返回生成的文本片段。
   */
  async completeStream(
    systemPrompt: string,
    userPrompt: string,
    onChunk: (text: string) => void,
    taskType: 'story_generate' | 'character_generate' | 'branch_generate' | 'continue_write' | 'content_moderate' | 'general' = 'general'
  ): Promise<AIResponse<string>> {
    try {
      const messages: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ];

      const stream: ReadableStream<StreamChunk> = await this.router.routeStream(taskType, {
        messages,
        temperature: 0.7,
        max_tokens: 4000,
      });

      const reader = stream.getReader();
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = value;
        const delta = chunk.choices[0]?.delta?.content || '';
        if (delta) {
          fullContent += delta;
          onChunk(delta);
        }
      }

      return {
        success: true,
        data: fullContent,
      };
    } catch (error) {
      return this.handleError(error, '流式完成');
    }
  }

  // ── 内部工具方法 ──────────────────────────────────────────

  /**
   * 安全解析 JSON，支持从 Markdown 代码块中提取
   */
  private parseJSON<T>(text: string): T | null {
    try {
      // 尝试直接解析
      return JSON.parse(text) as T;
    } catch {
      // 尝试从 Markdown 代码块中提取
      const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (codeBlockMatch) {
        try {
          return JSON.parse(codeBlockMatch[1].trim()) as T;
        } catch {
          return null;
        }
      }
      return null;
    }
  }

  /**
   * 统一错误处理
   */
  private handleError<T>(error: unknown, operation: string): AIResponse<T> {
    const errorMessage =
      error instanceof Error ? error.message : `未知错误：${String(error)}`;
    return {
      success: false,
      error: `${operation}失败：${errorMessage}`,
    };
  }
}
