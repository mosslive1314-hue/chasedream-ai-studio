/**
 * 模型路由器 N-10 — 统一 AI 能力入口
 *
 * 设计文档对应组件：N-10 模型路由器
 * 核心职责：智能选择最优模型，平衡成本和质量；提供标准组件接口
 *
 * 架构：
 *   ModelRouter (路由器)
 *     ├─ OpenAICompatibleProvider (OpenAI 兼容提供商)
 *     ├─ CapabilityComponent (标准组件接口)
 *     └─ CostEstimator (成本估算器)
 */

// ─── 标准组件接口（文档 2.2.5）──────────────────────────

/**
 * 每个能力组件必须实现的标准接口。
 * 对应文档中 register() / execute() / estimateCost() / healthCheck()。
 */
export interface CapabilityComponent<TInput = unknown, TOutput = unknown> {
  /** 组件唯一 ID（如 "N-01"） */
  id: string;
  /** 组件名称 */
  name: string;
  /** 组件版本 */
  version: string;
  /** 能力描述 */
  description: string;

  /** 注册组件，返回元数据 */
  register(): ComponentMetadata;
  /** 执行组件功能 */
  execute(input: TInput): Promise<TOutput>;
  /** 估算本次调用的成本（单位：美分） */
  estimateCost(input: TInput): Promise<CostEstimate>;
  /** 健康检查 */
  healthCheck(): Promise<HealthStatus>;
}

export interface ComponentMetadata {
  id: string;
  name: string;
  version: string;
  description: string;
  capabilities: string[];
  supportedModels: string[];
  inputSchema?: Record<string, unknown>;
}

export interface CostEstimate {
  /** 估算成本（美分） */
  costCents: number;
  /** 估算 token 数 */
  estimatedTokens: number;
  /** 使用的模型 */
  model: string;
  /** 货币单位 */
  currency: "USD" | "CNY";
}

export interface HealthStatus {
  healthy: boolean;
  latency: number;
  message?: string;
  lastChecked: string;
}

// ─── 任务类型 ────────────────────────────────────────────

/**
 * AI 任务类型枚举，对应文档中的 AI 层组件 ID。
 */
export type AITaskType =
  | "story_generate"     // N-01 故事生成器
  | "character_generate" // N-02 角色生成器
  | "branch_generate"    // N-03 分支剧本生成器
  | "image_generate"     // N-04 图像生成器
  | "video_generate"     // N-05 视频生成器
  | "audio_generate"     // N-06 音频生成器
  | "tts"                // N-07 TTS 配音器
  | "continue_write"     // N-08 AI 续写接口
  | "content_moderate"   // N-09 内容审核器
  | "soul_engine"        // N-15 NPC 灵魂引擎
  | "convert_to_script"  // N-18 万物转剧本引擎
  | "general";           // 通用对话

// ─── OpenAI 兼容接口 ────────────────────────────────────

/**
 * OpenAI Chat Completion 请求格式。
 * 支持 OpenAI / 通义千问 / 混元 等兼容此接口的所有模型。
 */
export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  name?: string;
  tool_call_id?: string;
  /** 工具调用列表（assistant 消息中使用 tool calling 时） */
  tool_calls?: ToolCall[];
}

export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stop?: string | string[];
  stream?: boolean;
  /** 工具定义（用于 Agent 场景） */
  tools?: ToolDefinition[];
  tool_choice?: "auto" | "none" | { type: "function"; function: { name: string } };
}

export interface ToolDefinition {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export interface ChatCompletionResponse {
  id: string;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string | null;
      tool_calls?: ToolCall[];
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface ToolCall {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
}

/** 流式响应中的增量工具调用（包含 index 字段） */
export interface StreamToolCallDelta {
  index?: number;
  id?: string;
  type?: "function";
  function?: {
    name?: string;
    arguments?: string;
  };
}

// ─── 流式响应（SSE）────────────────────────────────────

export interface StreamChunk {
  id: string;
  choices: {
    index: number;
    delta: {
      role?: string;
      content?: string;
      tool_calls?: StreamToolCallDelta[];
    };
    finish_reason: string | null;
  }[];
}

// ─── 模型提供商配置 ────────────────────────────────────

export interface ModelProviderConfig {
  /** 提供商 ID */
  id: string;
  /** 提供商名称 */
  name: string;
  /** API 基础 URL */
  baseUrl: string;
  /** API Key */
  apiKey: string;
  /** 支持的模型列表 */
  models: ModelConfig[];
  /** 默认模型 */
  defaultModel: string;
  /** 是否为默认提供商 */
  isDefault?: boolean;
}

export interface ModelConfig {
  /** 模型 ID（如 "gpt-4o", "qwen-max"） */
  id: string;
  /** 模型名称 */
  name: string;
  /** 每千输入 token 成本（美分） */
  inputCostPer1k: number;
  /** 每千输出 token 成本（美分） */
  outputCostPer1k: number;
  /** 最大上下文窗口 */
  maxContextTokens: number;
  /** 擅长任务类型 */
  strengths: AITaskType[];
  /** 是否支持流式输出 */
  supportsStream: boolean;
  /** 是否支持工具调用 */
  supportsTools: boolean;
}

// ─── 路由策略 ────────────────────────────────────────────

export type RoutingStrategy =
  | "best_quality"    // 选择质量最高的模型
  | "lowest_cost"    // 选择成本最低的模型
  | "fastest"         // 选择延迟最低的模型
  | "balanced"        // 平衡质量和成本（默认）
  | "manual";         // 手动指定模型

export interface RoutingDecision {
  providerId: string;
  modelId: string;
  reason: string;
  estimatedCost: CostEstimate;
}

// ─── 路由器主类 ──────────────────────────────────────────

/**
 * ModelRouter — 模型路由器，统一 AI 能力调用入口。
 *
 * 使用方式：
 * ```ts
 * const router = new ModelRouter();
 * router.addProvider(openaiConfig);
 *
 * const response = await router.route("story_generate", {
 *   messages: [
 *     { role: "system", content: "你是一个互动叙事作家..." },
 *     { role: "user", content: "请为赛博朋克题材生成一个故事大纲" }
 *   ]
 * });
 * ```
 */
export class ModelRouter {
  private providers: Map<string, ModelProviderConfig> = new Map();
  private strategy: RoutingStrategy = "balanced";
  private budgetCents: number = 1000; // 默认预算 $10
  private spentCents: number = 0;
  private callLog: RouterCallLog[] = [];

  constructor(options?: { strategy?: RoutingStrategy; budgetCents?: number }) {
    if (options?.strategy) this.strategy = options.strategy;
    if (options?.budgetCents) this.budgetCents = options.budgetCents;
  }

  // ── 提供商管理 ──

  addProvider(config: ModelProviderConfig): void {
    this.providers.set(config.id, config);
    if (config.isDefault && this.providers.size === 1) {
      // 第一个默认提供商
    }
  }

  removeProvider(id: string): void {
    this.providers.delete(id);
  }

  getProvider(id: string): ModelProviderConfig | undefined {
    return this.providers.get(id);
  }

  listProviders(): ModelProviderConfig[] {
    return Array.from(this.providers.values());
  }

  // ── 策略与预算 ──

  setStrategy(strategy: RoutingStrategy): void {
    this.strategy = strategy;
  }

  setBudget(cents: number): void {
    this.budgetCents = cents;
  }

  getSpent(): number {
    return this.spentCents;
  }

  getRemainingBudget(): number {
    return Math.max(0, this.budgetCents - this.spentCents);
  }

  // ── 路由决策 ──

  /**
   * 根据任务类型和策略选择最优模型。
   */
  decideRouting(taskType: AITaskType, estimatedTokens: number = 2000): RoutingDecision {
    const candidates: { provider: ModelProviderConfig; model: ModelConfig; score: number }[] = [];

    for (const provider of this.providers.values()) {
      for (const model of provider.models) {
        let score = 0;

        // 任务匹配度
        if (model.strengths.includes(taskType)) score += 40;

        // 成本因子（越低越好）
        const cost =
          (model.inputCostPer1k * (estimatedTokens * 0.6)) / 1000 +
          (model.outputCostPer1k * (estimatedTokens * 0.4)) / 1000;
        score += Math.max(0, 30 - cost * 10);

        // 上下文窗口（越大越好）
        score += Math.min(20, model.maxContextTokens / 10000);

        // 工具支持加分
        if (model.supportsTools) score += 10;

        candidates.push({ provider, model, score });
      }
    }

    if (candidates.length === 0) {
      throw new RouterError("没有可用的模型提供商，请先 addProvider()");
    }

    // 根据策略排序
    candidates.sort((a, b) => {
      switch (this.strategy) {
        case "lowest_cost":
          return a.model.inputCostPer1k - b.model.inputCostPer1k;
        case "best_quality":
          return b.score - a.score;
        case "balanced":
        default:
          return b.score - a.score;
      }
    });

    const best = candidates[0];
    const estimatedCost: CostEstimate = {
      costCents:
        (best.model.inputCostPer1k * (estimatedTokens * 0.6)) / 1000 +
        (best.model.outputCostPer1k * (estimatedTokens * 0.4)) / 1000,
      estimatedTokens,
      model: best.model.id,
      currency: "USD",
    };

    return {
      providerId: best.provider.id,
      modelId: best.model.id,
      reason: `策略 "${this.strategy}" → ${best.provider.name}/${best.model.name} (score: ${best.score.toFixed(1)})`,
      estimatedCost,
    };
  }

  // ── 核心调用 ──

  /**
   * 路由并执行 AI 请求。
   * 自动选择模型、发送请求、记录日志。
   */
  async route(
    taskType: AITaskType,
    request: Omit<ChatCompletionRequest, "model">,
    options?: { forceModel?: string; forceProvider?: string }
  ): Promise<ChatCompletionResponse> {
    // 预算检查
    if (this.spentCents >= this.budgetCents) {
      throw new RouterError(
        `预算已用尽（${this.spentCents.toFixed(1)} / ${this.budgetCents} 美分）`
      );
    }

    // 路由决策
    let decision: RoutingDecision;
    if (options?.forceModel && options?.forceProvider) {
      const provider = this.providers.get(options.forceProvider);
      if (!provider) throw new RouterError(`提供商 "${options.forceProvider}" 不存在`);
      decision = {
        providerId: provider.id,
        modelId: options.forceModel,
        reason: "手动指定",
        estimatedCost: { costCents: 0, estimatedTokens: 0, model: options.forceModel, currency: "USD" },
      };
    } else {
      decision = this.decideRouting(taskType);
    }

    const provider = this.providers.get(decision.providerId);
    if (!provider) throw new RouterError(`提供商 "${decision.providerId}" 不存在`);

    // 构建请求
    const fullRequest: ChatCompletionRequest = {
      ...request,
      model: decision.modelId,
    };

    // 执行请求
    const startTime = Date.now();
    const response = await this.callProvider(provider, fullRequest);
    const latency = Date.now() - startTime;

    // 计算实际成本
    const model = provider.models.find((m) => m.id === decision.modelId);
    if (model && response.usage) {
      const actualCost =
        (model.inputCostPer1k * response.usage.prompt_tokens) / 1000 +
        (model.outputCostPer1k * response.usage.completion_tokens) / 1000;
      this.spentCents += actualCost;
      decision.estimatedCost.costCents = actualCost;
      decision.estimatedCost.estimatedTokens = response.usage.total_tokens;
    }

    // 记录日志
    this.callLog.push({
      taskType,
      providerId: decision.providerId,
      modelId: decision.modelId,
      latency,
      tokensUsed: response.usage?.total_tokens ?? 0,
      costCents: decision.estimatedCost.costCents,
      timestamp: new Date().toISOString(),
      success: true,
    });

    return response;
  }

  /**
   * 流式路由，返回 ReadableStream。
   */
  async routeStream(
    taskType: AITaskType,
    request: Omit<ChatCompletionRequest, "model">,
    options?: { signal?: AbortSignal }
  ): Promise<ReadableStream<StreamChunk>> {
    const decision = this.decideRouting(taskType);
    const provider = this.providers.get(decision.providerId);
    if (!provider) throw new RouterError(`提供商 "${decision.providerId}" 不存在`);

    console.log(`[ModelRouter] routeStream → provider: ${provider.id}, model: ${decision.modelId}, baseUrl: ${provider.baseUrl}`);
    console.log(`[ModelRouter] 请求: messages=${request.messages?.length}条, tools=${request.tools?.length ?? 0}个, stream=true`);

    const fullRequest: ChatCompletionRequest = {
      ...request,
      model: decision.modelId,
      stream: true,
    };

    return this.callProviderStream(provider, fullRequest, options?.signal);
  }

  // ── 内部调用 ──

  private async callProvider(
    provider: ModelProviderConfig,
    request: ChatCompletionRequest
  ): Promise<ChatCompletionResponse> {
    const url = `${provider.baseUrl.replace(/\/$/, "")}/chat/completions`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${provider.apiKey}`,
      },
      body: JSON.stringify(request),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new RouterError(
        `API 请求失败 [${res.status}]: ${errorText}`,
        res.status
      );
    }

    return res.json() as Promise<ChatCompletionResponse>;
  }

  private async callProviderStream(
    provider: ModelProviderConfig,
    request: ChatCompletionRequest,
    signal?: AbortSignal
  ): Promise<ReadableStream<StreamChunk>> {
    const url = `${provider.baseUrl.replace(/\/$/, "")}/chat/completions`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${provider.apiKey}`,
      },
      body: JSON.stringify(request),
      signal,
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new RouterError(`流式请求失败 [${res.status}]: ${errorText}`, res.status);
    }

    if (!res.body) {
      throw new RouterError("响应体为空");
    }

    const contentType = res.headers.get("content-type") || "";
    console.log(`[ModelRouter] SSE 响应 content-type: ${contentType}, url: ${url}`);

    // 如果 API 不支持流式（返回 application/json 而非 text/event-stream），
    // 直接解析 JSON 并包装为单 chunk 流
    if (contentType.includes("application/json")) {
      console.warn("[ModelRouter] API 返回 JSON 而非 SSE 流，可能不支持 stream:true，降级为非流式解析");
      const jsonBody = await res.json() as ChatCompletionResponse;
      const chunk: StreamChunk = {
        id: jsonBody.id,
        choices: jsonBody.choices.map((c) => ({
          index: c.index,
          delta: { role: c.message.role, content: c.message.content },
          finish_reason: c.finish_reason,
        })),
      };
      return new ReadableStream<StreamChunk>({
        start(controller) {
          controller.enqueue(chunk);
          controller.close();
        },
      });
    }

    // 解析 SSE 流 — 用缓冲区处理跨 chunk 截断
    const decoder = new TextDecoder();
    const reader = res.body.getReader();
    let buffer = "";
    let chunkCount = 0;
    let firstRawChunk = "";

    return new ReadableStream<StreamChunk>({
      async pull(controller) {
        try {
          const { done, value } = await reader.read();
          if (done) {
            // 处理缓冲区中剩余的不完整行
            if (buffer.trim()) {
              const trimmed = buffer.trim();
              if (trimmed.startsWith("data:")) {
                const data = trimmed.slice(5).trim();
                if (data && data !== "[DONE]") {
                  try {
                    const chunk = JSON.parse(data) as StreamChunk;
                    chunkCount++;
                    controller.enqueue(chunk);
                  } catch {
                    console.warn("[ModelRouter] SSE 剩余行 JSON 解析失败:", data.slice(0, 200));
                  }
                }
              }
            }
            console.log(`[ModelRouter] SSE 流结束，共解析 ${chunkCount} 个 chunk`);
            if (chunkCount === 0) {
              console.error("[ModelRouter] ⚠️ SSE 流完成但未解析出任何 chunk！原始首块内容（前500字符）:", firstRawChunk.slice(0, 500));
            }
            controller.close();
            return;
          }
          const rawText = decoder.decode(value, { stream: true });
          if (chunkCount === 0) {
            firstRawChunk = rawText;
            console.log("[ModelRouter] SSE 首块原始内容（前300字符）:", rawText.slice(0, 300));
          }
          // 累积到缓冲区
          buffer += rawText;
          // 按换行分割，保留最后一个可能不完整的行在缓冲区
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            // 兼容 "data: {...}" 和 "data:{...}" 两种格式
            if (!trimmed.startsWith("data:")) continue;
            const data = trimmed.slice(5).trim();
            if (data === "[DONE]") {
              console.log(`[ModelRouter] SSE 收到 [DONE]，共解析 ${chunkCount} 个 chunk`);
              controller.close();
              return;
            }
            try {
              const chunk = JSON.parse(data) as StreamChunk;
              chunkCount++;
              controller.enqueue(chunk);
            } catch {
              console.warn("[ModelRouter] SSE 行 JSON 解析失败，跳过:", data.slice(0, 200));
            }
          }
        } catch (error) {
          controller.error(error);
        }
      },
    });
  }

  // ── 健康检查 ──

  async healthCheck(providerId?: string): Promise<Record<string, HealthStatus>> {
    const results: Record<string, HealthStatus> = {};
    const targets = providerId
      ? [this.providers.get(providerId)].filter(Boolean)
      : this.providers.values();

    for (const provider of targets) {
      if (!provider) continue;
      const start = Date.now();
      try {
        const url = `${provider.baseUrl.replace(/\/$/, "")}/models`;
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${provider.apiKey}` },
          signal: AbortSignal.timeout(5000),
        });
        results[provider.id] = {
          healthy: res.ok,
          latency: Date.now() - start,
          lastChecked: new Date().toISOString(),
          message: res.ok ? "正常" : `HTTP ${res.status}`,
        };
      } catch (e) {
        results[provider.id] = {
          healthy: false,
          latency: Date.now() - start,
          lastChecked: new Date().toISOString(),
          message: e instanceof Error ? e.message : "未知错误",
        };
      }
    }
    return results;
  }

  // ── 调用日志 ──

  getCallLog(): RouterCallLog[] {
    return [...this.callLog];
  }

  getCostSummary(): CostSummary {
    const byModel: Record<string, { calls: number; tokens: number; costCents: number }> = {};
    for (const log of this.callLog) {
      if (!byModel[log.modelId]) {
        byModel[log.modelId] = { calls: 0, tokens: 0, costCents: 0 };
      }
      byModel[log.modelId].calls++;
      byModel[log.modelId].tokens += log.tokensUsed;
      byModel[log.modelId].costCents += log.costCents;
    }
    return {
      totalCalls: this.callLog.length,
      totalTokens: this.callLog.reduce((sum, l) => sum + l.tokensUsed, 0),
      totalCostCents: this.spentCents,
      budgetCents: this.budgetCents,
      byModel,
    };
  }
}

// ─── 辅助类型 ────────────────────────────────────────────

export interface RouterCallLog {
  taskType: AITaskType;
  providerId: string;
  modelId: string;
  latency: number;
  tokensUsed: number;
  costCents: number;
  timestamp: string;
  success: boolean;
}

export interface CostSummary {
  totalCalls: number;
  totalTokens: number;
  totalCostCents: number;
  budgetCents: number;
  byModel: Record<string, { calls: number; tokens: number; costCents: number }>;
}

export class RouterError extends Error {
  statusCode?: number;
  constructor(message: string, statusCode?: number) {
    super(`[ModelRouter] ${message}`);
    this.name = "RouterError";
    this.statusCode = statusCode;
  }
}

// ─── 预设配置 ────────────────────────────────────────────

/**
 * 创建 OpenAI 兼容提供商的便捷工厂函数。
 */
export function createOpenAIProvider(
  apiKey: string,
  baseUrl: string = "https://api.openai.com/v1"
): ModelProviderConfig {
  return {
    id: "openai",
    name: "OpenAI",
    baseUrl,
    apiKey,
    isDefault: true,
    defaultModel: "gpt-4o",
    models: [
      {
        id: "gpt-4o",
        name: "GPT-4o",
        inputCostPer1k: 0.25,
        outputCostPer1k: 1.0,
        maxContextTokens: 128000,
        strengths: ["story_generate", "branch_generate", "character_generate", "continue_write", "convert_to_script", "general"],
        supportsStream: true,
        supportsTools: true,
      },
      {
        id: "gpt-4o-mini",
        name: "GPT-4o Mini",
        inputCostPer1k: 0.015,
        outputCostPer1k: 0.06,
        maxContextTokens: 128000,
        strengths: ["content_moderate", "general", "continue_write"],
        supportsStream: true,
        supportsTools: true,
      },
    ],
  };
}

/**
 * 创建通义千问（DashScope）兼容提供商。
 */
export function createQwenProvider(apiKey: string): ModelProviderConfig {
  return {
    id: "qwen",
    name: "通义千问",
    baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    apiKey,
    defaultModel: "qwen-max",
    models: [
      {
        id: "qwen-max",
        name: "通义千问 Max",
        inputCostPer1k: 0.28,
        outputCostPer1k: 0.84,
        maxContextTokens: 32000,
        strengths: ["story_generate", "character_generate", "branch_generate", "soul_engine", "general"],
        supportsStream: true,
        supportsTools: true,
      },
      {
        id: "qwen-plus",
        name: "通义千问 Plus",
        inputCostPer1k: 0.11,
        outputCostPer1k: 0.28,
        maxContextTokens: 131072,
        strengths: ["continue_write", "content_moderate", "general"],
        supportsStream: true,
        supportsTools: true,
      },
    ],
  };
}

/**
 * 创建腾讯混元提供商。
 */
export function createHunyuanProvider(apiKey: string): ModelProviderConfig {
  return {
    id: "hunyuan",
    name: "腾讯混元",
    baseUrl: "https://api.hunyuan.cloud.tencent.com/v1",
    apiKey,
    defaultModel: "hunyuan-pro",
    models: [
      {
        id: "hunyuan-pro",
        name: "混元 Pro",
        inputCostPer1k: 0.43,
        outputCostPer1k: 1.43,
        maxContextTokens: 32000,
        strengths: ["story_generate", "character_generate", "soul_engine", "general"],
        supportsStream: true,
        supportsTools: true,
      },
    ],
  };
}
