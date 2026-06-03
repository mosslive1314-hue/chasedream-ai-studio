/**
 * AG-UI 协议事件类型定义
 *
 * 基于 AG-UI (Agent-User Interaction Protocol) 开放标准。
 * 支持 16 种标准事件类型，分为四大类：
 *   - 生命周期事件 (Lifecycle)
 *   - 文本消息事件 (Text Messages)
 *   - 工具调用事件 (Tool Calls)
 *   - 状态管理事件 (State Management)
 */

// ─── 事件基础类型 ──────────────────────────────────────────

export enum AGUIEventType {
  // 生命周期事件
  RUN_STARTED = "run_started",
  RUN_FINISHED = "run_finished",
  RUN_ERROR = "run_error",
  STEP_STARTED = "step_started",
  STEP_FINISHED = "step_finished",

  // 文本消息事件
  TEXT_MESSAGE_START = "text_message_start",
  TEXT_MESSAGE_CONTENT = "text_message_content",
  TEXT_MESSAGE_END = "text_message_end",

  // 工具调用事件
  TOOL_CALL_START = "tool_call_start",
  TOOL_CALL_ARGS = "tool_call_args",
  TOOL_CALL_END = "tool_call_end",

  // 状态管理事件
  STATE_SNAPSHOT = "state_snapshot",
  STATE_DELTA = "state_delta",
  CUSTOM_EVENT = "custom_event",
  HUMAN_INPUT_REQUEST = "human_input_request",
  HUMAN_INPUT_RESPONSE = "human_input_response",
}

// ─── 事件负载类型 ──────────────────────────────────────────

export interface AGUIEvent {
  type: AGUIEventType;
  timestamp: string;
  /** 事件序列号（单调递增） */
  sequence: number;
}

// 生命周期

export interface RunStartedEvent extends AGUIEvent {
  type: AGUIEventType.RUN_STARTED;
  threadId: string;
  runId: string;
}

export interface RunFinishedEvent extends AGUIEvent {
  type: AGUIEventType.RUN_FINISHED;
  runId: string;
}

export interface RunErrorEvent extends AGUIEvent {
  type: AGUIEventType.RUN_ERROR;
  runId: string;
  error: string;
  code?: string;
}

export interface StepStartedEvent extends AGUIEvent {
  type: AGUIEventType.STEP_STARTED;
  stepName: string;
  /** 当前步骤在决策链中的位置（理解→规划→生成→组装） */
  stepIndex: number;
}

export interface StepFinishedEvent extends AGUIEvent {
  type: AGUIEventType.STEP_FINISHED;
  stepName: string;
  result?: string;
}

// 文本消息

export interface TextMessageStartEvent extends AGUIEvent {
  type: AGUIEventType.TEXT_MESSAGE_START;
  messageId: string;
  role: "assistant" | "system";
}

export interface TextMessageContentEvent extends AGUIEvent {
  type: AGUIEventType.TEXT_MESSAGE_CONTENT;
  messageId: string;
  delta: string;
}

export interface TextMessageEndEvent extends AGUIEvent {
  type: AGUIEventType.TEXT_MESSAGE_END;
  messageId: string;
}

// 工具调用

export interface ToolCallStartEvent extends AGUIEvent {
  type: AGUIEventType.TOOL_CALL_START;
  toolCallId: string;
  toolName: string;
  /** 在画布 Agent 场景下，工具名可以是 "add_node", "edit_script", "suggest_branch" 等 */
}

export interface ToolCallArgsEvent extends AGUIEvent {
  type: AGUIEventType.TOOL_CALL_ARGS;
  toolCallId: string;
  /** 增量参数 JSON */
  delta: string;
}

export interface ToolCallEndEvent extends AGUIEvent {
  type: AGUIEventType.TOOL_CALL_END;
  toolCallId: string;
  /** 工具执行结果 */
  result: unknown;
}

// 状态管理

export interface StateSnapshotEvent extends AGUIEvent {
  type: AGUIEventType.STATE_SNAPSHOT;
  snapshot: Record<string, unknown>;
}

export interface StateDeltaEvent extends AGUIEvent {
  type: AGUIEventType.STATE_DELTA;
  /** JSON Patch 格式的增量更新 */
  patches: { op: string; path: string; value?: unknown }[];
}

export interface CustomEventPayload extends AGUIEvent {
  type: AGUIEventType.CUSTOM_EVENT;
  name: string;
  value: unknown;
}

// Human-in-the-Loop

export interface HumanInputRequestEvent extends AGUIEvent {
  type: AGUIEventType.HUMAN_INPUT_REQUEST;
  requestId: string;
  /** 请求确认的操作描述 */
  description: string;
  /** 建议的操作 */
  suggestions?: string[];
  /** 操作影响范围 */
  scope?: string[];
}

export interface HumanInputResponseEvent extends AGUIEvent {
  type: AGUIEventType.HUMAN_INPUT_RESPONSE;
  requestId: string;
  /** 用户选择 */
  decision: "approve" | "reject" | "modify";
  /** 用户修改内容（仅 modify 时有值） */
  modification?: string;
}

// ─── 联合类型 ────────────────────────────────────────────

export type AGUIEventUnion =
  | RunStartedEvent
  | RunFinishedEvent
  | RunErrorEvent
  | StepStartedEvent
  | StepFinishedEvent
  | TextMessageStartEvent
  | TextMessageContentEvent
  | TextMessageEndEvent
  | ToolCallStartEvent
  | ToolCallArgsEvent
  | ToolCallEndEvent
  | StateSnapshotEvent
  | StateDeltaEvent
  | CustomEventPayload
  | HumanInputRequestEvent
  | HumanInputResponseEvent;

// ─── Agent 工具定义 ──────────────────────────────────────

/**
 * 画布原生 Agent 可用的内置工具。
 * 对应文档中的"节点级控制"能力。
 */
export const AGENT_TOOLS = {
  add_node: {
    name: "add_node",
    description: "在故事图谱中添加一个新节点",
    parameters: {
      type: "object",
      properties: {
        label: { type: "string", description: "节点标签" },
        nodeType: { type: "string", enum: ["scene", "choice", "condition", "qte", "ending_good", "ending_bad"] },
        content: { type: "string", description: "节点内容" },
      },
      required: ["label", "nodeType"],
    },
  },
  edit_script: {
    name: "edit_script",
    description: "编辑节点的剧本内容",
    parameters: {
      type: "object",
      properties: {
        nodeId: { type: "string" },
        blocks: { type: "array", description: "新的剧本块" },
      },
      required: ["nodeId", "blocks"],
    },
  },
  suggest_branch: {
    name: "suggest_branch",
    description: "在指定节点建议一个新的分支选择",
    parameters: {
      type: "object",
      properties: {
        nodeId: { type: "string" },
        theme: { type: "string", description: "分支主题" },
      },
      required: ["nodeId"],
    },
  },
  generate_feedback: {
    name: "generate_feedback",
    description: "为选择节点生成失败反馈文本",
    parameters: {
      type: "object",
      properties: {
        nodeId: { type: "string" },
        choiceLabel: { type: "string" },
      },
      required: ["nodeId"],
    },
  },
  check_consistency: {
    name: "check_consistency",
    description: "检查当前节点与上下游的一致性",
    parameters: {
      type: "object",
      properties: {
        nodeId: { type: "string" },
        checkType: { type: "string", enum: ["character", "variable", "structure", "narrative"] },
      },
      required: ["nodeId"],
    },
  },
  explain_variable: {
    name: "explain_variable",
    description: "解释某个变量在当前节点中的来源和影响",
    parameters: {
      type: "object",
      properties: {
        variableId: { type: "string" },
        nodeId: { type: "string" },
      },
      required: ["variableId"],
    },
  },
} as const;
