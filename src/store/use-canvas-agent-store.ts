/**
 * 画布原生 Agent Store
 *
 * 管理 Agent 的消息历史、运行状态、工具调用和 Human-in-the-Loop 流程。
 * 对应文档中"画布原生Agent"设计：
 *   - 决策链透明：理解→规划→生成提示词→组装节点，每步可见可改
 *   - Detect + Suggest 模式：Agent 只建议，不自动执行
 *   - Human-in-the-Loop：关键创作决策需人工确认
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AGUIEventType } from "@/lib/ai";

// ─── Agent 消息类型 ────────────────────────────────────────

export type AgentRole = "assistant" | "system" | "user" | "tool";

export interface AgentMessage {
  id: string;
  role: AgentRole;
  content: string;
  timestamp: string;
  /** 关联的节点 ID（如果消息是针对特定节点的） */
  nodeId?: string;
  /** 工具调用信息 */
  toolCall?: {
    toolName: string;
    args: Record<string, unknown>;
    result?: string;
    status: "pending" | "executing" | "done" | "rejected";
  };
  /** 决策链步骤标记 */
  decisionStep?: "understand" | "plan" | "generate" | "assemble";
  /** Expert 身份标识（由 Expert 系统注入） */
  expertId?: string;
  expertRole?: string;
  expertAvatar?: string;
}

// ─── Agent 运行状态 ──────────────────────────────────────────

export type AgentRunStatus =
  | "idle"        // 等待用户输入
  | "thinking"    // 正在理解上下文
  | "planning"    // 正在规划操作
  | "generating"  // 正在生成内容
  | "assembling"  // 正在组装结果
  | "waiting"     // 等待用户确认 (Human-in-the-Loop)
  | "error";      // 出错

// ─── Human-in-the-Loop 请求 ────────────────────────────────

export interface PendingConfirmation {
  id: string;
  description: string;
  suggestions?: string[];
  scope?: string[];
  timestamp: string;
}

// ─── Store 接口 ────────────────────────────────────────────

interface CanvasAgentState {
  /** 消息历史 */
  messages: AgentMessage[];
  /** 当前运行状态 */
  runStatus: AgentRunStatus;
  /** 当前激活的决策步骤 */
  currentStep: string;
  /** 待确认的 HITL 请求 */
  pendingConfirmation: PendingConfirmation | null;
  /** Agent 面板是否展开 */
  panelOpen: boolean;
  /** 当前关联的节点 ID */
  activeNodeId: string | null;
  /** 运行 ID */
  currentRunId: string | null;
  /** 错误信息 */
  errorMessage: string | null;
  /** 中止控制器（用于取消正在进行的 LLM 请求） */
  abortController: AbortController | null;

  // ── Actions ──

  /** 添加一条消息 */
  addMessage: (msg: Omit<AgentMessage, "id" | "timestamp">) => string;
  /** 追加内容到最后一条 assistant 消息 */
  appendToLastMessage: (delta: string) => void;
  /** 更新消息内容 */
  updateMessage: (id: string, content: string) => void;
  /** 更新工具调用结果 */
  updateToolResult: (msgId: string, result: string, status: AgentMessage["toolCall"] extends undefined ? never : NonNullable<AgentMessage["toolCall"]>["status"]) => void;
  /** 设置运行状态 */
  setRunStatus: (status: AgentRunStatus) => void;
  /** 设置决策步骤 */
  setCurrentStep: (step: string) => void;
  /** 设置待确认请求 */
  setPendingConfirmation: (conf: PendingConfirmation | null) => void;
  /** 开关面板 */
  setPanelOpen: (open: boolean) => void;
  /** 设置关联节点 */
  setActiveNodeId: (nodeId: string | null) => void;
  /** 设置运行 ID */
  setCurrentRunId: (id: string | null) => void;
  /** 设置错误信息 */
  setErrorMessage: (msg: string | null) => void;
  /** 设置中止控制器 */
  setAbortController: (controller: AbortController | null) => void;
  /** 清空消息 */
  clearMessages: () => void;
  /** 重置整个 Agent 状态 */
  reset: () => void;
}

// ─── 初始状态 ────────────────────────────────────────────

const initialState = {
  messages: [] as AgentMessage[],
  runStatus: "idle" as AgentRunStatus,
  currentStep: "",
  pendingConfirmation: null as PendingConfirmation | null,
  panelOpen: false,
  activeNodeId: null as string | null,
  currentRunId: null as string | null,
  errorMessage: null as string | null,
  abortController: null as AbortController | null,
};

// ─── 工具函数 ────────────────────────────────────────────

let msgCounter = 0;
function genMsgId(): string {
  return `msg_${Date.now().toString(36)}_${++msgCounter}`;
}

// ─── Store 定义 ──────────────────────────────────────────

export const useCanvasAgentStore = create<CanvasAgentState>()(
  persist(
    (set, _get) => ({
      ...initialState,

      addMessage: (msg) => {
        const id = genMsgId();
        const fullMsg: AgentMessage = {
          ...msg,
          id,
          timestamp: new Date().toISOString(),
        };
        set((state) => ({
          messages: [...state.messages, fullMsg],
        }));
        return id;
      },

      appendToLastMessage: (delta) => {
        set((state) => {
          if (state.messages.length === 0) return state;
          const msgs = [...state.messages];
          const last = { ...msgs[msgs.length - 1] };
          last.content += delta;
          msgs[msgs.length - 1] = last;
          return { messages: msgs };
        });
      },

      updateMessage: (id, content) => {
        set((state) => ({
          messages: state.messages.map((m) =>
            m.id === id ? { ...m, content } : m
          ),
        }));
      },

      updateToolResult: (msgId, result, status) => {
        set((state) => ({
          messages: state.messages.map((m) =>
            m.id === msgId && m.toolCall
              ? { ...m, toolCall: { ...m.toolCall, result, status } }
              : m
          ),
        }));
      },

      setRunStatus: (status) => set({ runStatus: status }),
      setCurrentStep: (step) => set({ currentStep: step }),
      setPendingConfirmation: (conf) => set({ pendingConfirmation: conf }),
      setPanelOpen: (open) => set({ panelOpen: open }),
      setActiveNodeId: (nodeId) => set({ activeNodeId: nodeId }),
      setCurrentRunId: (id) => set({ currentRunId: id }),
      setErrorMessage: (msg) => set({ errorMessage: msg }),
      setAbortController: (controller) => set({ abortController: controller }),
      clearMessages: () => set({ messages: [] }),
      reset: () => set(initialState),
    }),
    {
      name: "cd-canvas-agent",
      skipHydration: true,
      partialize: (state) => ({
        // 持久化消息历史，不持久化运行时状态
        messages: state.messages.slice(-50), // 只保留最近 50 条
        // panelOpen 不持久化 — 每次刷新页面默认关闭
      }),
    }
  )
);

// ─── AG-UI 事件处理器 ──────────────────────────────────────

/**
 * 处理 AG-UI 事件流，更新 Agent store 状态。
 * 用于接收来自 AI 后端的事件流并驱动 UI 更新。
 */
export function handleAGUIEvent(event: { type: string; [key: string]: unknown }): void {
  const store = useCanvasAgentStore.getState();

  switch (event.type) {
    case AGUIEventType.RUN_STARTED:
      store.setRunStatus("thinking");
      store.setCurrentRunId(event.runId as string);
      break;

    case AGUIEventType.STEP_STARTED:
      store.setCurrentStep(event.stepName as string);
      // 映射步骤到运行状态
      switch (event.stepName) {
        case "understand":
          store.setRunStatus("thinking");
          break;
        case "plan":
          store.setRunStatus("planning");
          break;
        case "generate":
          store.setRunStatus("generating");
          break;
        case "assemble":
          store.setRunStatus("assembling");
          break;
      }
      break;

    case AGUIEventType.STEP_FINISHED:
      break;

    case AGUIEventType.TEXT_MESSAGE_START:
      store.addMessage({
        role: "assistant",
        content: "",
        nodeId: store.activeNodeId ?? undefined,
      });
      break;

    case AGUIEventType.TEXT_MESSAGE_CONTENT:
      store.appendToLastMessage(event.delta as string);
      break;

    case AGUIEventType.TEXT_MESSAGE_END:
      break;

    case AGUIEventType.TOOL_CALL_START:
      store.addMessage({
        role: "tool",
        content: `调用工具: ${event.toolName}`,
        toolCall: {
          toolName: event.toolName as string,
          args: (event.args as Record<string, unknown>) ?? {},
          status: "executing",
        },
      });
      break;

    case AGUIEventType.TOOL_CALL_ARGS:
      // 更新最后一个工具调用消息的 args
      {
        const msgs = useCanvasAgentStore.getState().messages;
        const lastToolMsg = [...msgs].reverse().find((m) => m.toolCall && m.toolCall.status === "executing");
        if (lastToolMsg && lastToolMsg.toolCall) {
          try {
            const deltaArgs = JSON.parse(event.delta as string);
            const mergedArgs = { ...lastToolMsg.toolCall.args, ...deltaArgs };
            useCanvasAgentStore.getState().updateToolResult(lastToolMsg.id, JSON.stringify(mergedArgs), "executing");
            // Also update the args field directly via setState
            useCanvasAgentStore.setState((state) => ({
              messages: state.messages.map((m) =>
                m.id === lastToolMsg.id && m.toolCall
                  ? { ...m, toolCall: { ...m.toolCall, args: mergedArgs } }
                  : m
              ),
            }));
          } catch {
            // Delta is not valid JSON, ignore
          }
        }
      }
      break;

    case AGUIEventType.TOOL_CALL_END:
      // 更新最后一个工具调用的结果
      {
        const msgs = useCanvasAgentStore.getState().messages;
        const lastToolMsg = [...msgs].reverse().find((m) => m.toolCall);
        if (lastToolMsg) {
          store.updateToolResult(
            lastToolMsg.id,
            JSON.stringify(event.result),
            "done"
          );
        }
      }
      break;

    case AGUIEventType.HUMAN_INPUT_REQUEST:
      store.setRunStatus("waiting");
      store.setPendingConfirmation({
        id: event.requestId as string,
        description: event.description as string,
        suggestions: event.suggestions as string[] | undefined,
        scope: event.scope as string[] | undefined,
        timestamp: new Date().toISOString(),
      });
      break;

    case AGUIEventType.RUN_FINISHED:
      store.setRunStatus("idle");
      store.setCurrentRunId(null);
      store.setCurrentStep("");
      break;

    case AGUIEventType.RUN_ERROR:
      store.setRunStatus("error");
      store.setErrorMessage(event.error as string);
      store.setCurrentRunId(null);
      break;
  }
}
