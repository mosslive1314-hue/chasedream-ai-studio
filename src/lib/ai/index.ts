export { ModelRouter, RouterError, createOpenAIProvider, createQwenProvider, createHunyuanProvider } from "./model-router";
export type {
  CapabilityComponent,
  ComponentMetadata,
  CostEstimate,
  HealthStatus,
  AITaskType,
  ChatMessage,
  ChatCompletionRequest,
  ChatCompletionResponse,
  ToolCall,
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
