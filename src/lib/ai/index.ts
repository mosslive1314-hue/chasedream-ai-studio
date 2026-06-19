export { ModelRouter, RouterError, createOpenAIProvider, createQwenProvider, createHunyuanProvider } from "./model-router";
export type {
  ChatMessage,
  ChatCompletionRequest,
  ChatCompletionResponse,
  ToolCall,
  StreamToolCallDelta,
  ToolDefinition,
  StreamChunk,
  ModelProviderConfig,
  ModelConfig,
  RoutingStrategy,
  RoutingDecision,
  RouterCallLog,
  CostSummary,
} from "./model-router";

export {
  buildScriptContinuationPrompt,
  buildDialoguePrompt,
  buildBranchSuggestionPrompt,
  buildConsistencyCheckPrompt,
  buildProjectHealthPrompt,
} from "./ai-prompts";
export type { PromptResult } from "./ai-prompts";

export { AIService } from "./ai-service";
export type {
  AIResponse,
  DialogueOption,
  BranchSuggestion,
  ConsistencyIssue,
  HealthReport,
} from "./ai-service";

export { AGUIEventType, AGENT_TOOLS } from "./ag-ui-events";
export type {
  AGUIEvent,
  AGUIEventUnion,
  RunStartedEvent,
  RunFinishedEvent,
  RunErrorEvent,
  StepStartedEvent,
  StepFinishedEvent,
  TextMessageStartEvent,
  TextMessageContentEvent,
  TextMessageEndEvent,
  ToolCallStartEvent,
  ToolCallArgsEvent,
  ToolCallEndEvent,
  StateSnapshotEvent,
  StateDeltaEvent,
  CustomEventPayload,
  HumanInputRequestEvent,
  HumanInputResponseEvent,
} from "./ag-ui-events";

export {
  generateImage,
  generateCharacterPortrait,
  generateSceneBackground,
  generatePropImage,
  ImageGenQueue,
  STYLE_PRESETS,
} from "./ai-image-service";
export type {
  ImageProvider,
  ImageGenRequest,
  ImageGenResult,
  ImageGenQueueItem,
  ImageGenConfig,
  StylePreset,
} from "./ai-image-service";

// ─── Agent System (Phase 1) ──────────────────────────────

export { buildSystemPrompt } from "./agent-system-prompt";
export type { SystemPromptContext } from "./agent-system-prompt";

export { ToolRegistry, createDefaultToolRegistry } from "./tool-registry";
export type {
  ToolResult,
  ToolHandler,
  ToolCategory,
  RegisteredTool,
} from "./tool-registry";

export { ToolExecutor } from "./tool-executor";
export type { ExecutionResult } from "./tool-executor";

export { AgentChatLoop } from "./agent-chat-loop";
export type { ChatLoopCallbacks, AgentChatLoopOptions } from "./agent-chat-loop";
