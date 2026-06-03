"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCanvasAgentStore } from "@/store";
import type { AgentMessage, AgentRunStatus } from "@/store";

const S = {
  surface: "#080910",
  card: "#0F1017",
  border: "#1C1E2E",
  primary: "#7C6CF5",
  accent: "#00C8BE",
  text: "#E8EBF4",
  textSec: "#9499B0",
  textMuted: "#6B7080",
  error: "#E54646",
};

// ── 状态颜色映射 ──

const STATUS_CONFIG: Record<AgentRunStatus, { label: string; color: string; pulse: boolean }> = {
  idle: { label: "就绪", color: S.accent, pulse: false },
  thinking: { label: "理解上下文…", color: S.primary, pulse: true },
  planning: { label: "规划操作…", color: "#F59E0B", pulse: true },
  generating: { label: "生成内容…", color: "#3B82F6", pulse: true },
  assembling: { label: "组装结果…", color: "#10B981", pulse: true },
  waiting: { label: "等待确认", color: "#F59E0B", pulse: false },
  error: { label: "出错", color: S.error, pulse: false },
};

const STEP_LABELS: Record<string, string> = {
  understand: "理解",
  plan: "规划",
  generate: "生成",
  assemble: "组装",
};

const QUICK_ACTIONS = [
  { label: "建议新分支", icon: "🌿", prompt: "请为当前节点建议一条新的分支路线" },
  { label: "生成失败反馈", icon: "💥", prompt: "为当前选择节点生成失败反馈" },
  { label: "检查一致性", icon: "🔍", prompt: "检查当前节点与上下游的一致性" },
  { label: "优化张力曲线", icon: "📈", prompt: "分析并优化当前节点的张力曲线" },
];

export default function AgentPanel({ nodeId }: { nodeId: string | null }) {
  const messages = useCanvasAgentStore((s) => s.messages);
  const runStatus = useCanvasAgentStore((s) => s.runStatus);
  const currentStep = useCanvasAgentStore((s) => s.currentStep);
  const pendingConfirmation = useCanvasAgentStore((s) => s.pendingConfirmation);
  const panelOpen = useCanvasAgentStore((s) => s.panelOpen);
  const setPanelOpen = useCanvasAgentStore((s) => s.setPanelOpen);
  const addMessage = useCanvasAgentStore((s) => s.addMessage);
  const setRunStatus = useCanvasAgentStore((s) => s.setRunStatus);
  const setCurrentStep = useCanvasAgentStore((s) => s.setCurrentStep);
  const appendToLastMessage = useCanvasAgentStore((s) => s.appendToLastMessage);
  const setPendingConfirmation = useCanvasAgentStore((s) => s.setPendingConfirmation);
  const setActiveNodeId = useCanvasAgentStore((s) => s.setActiveNodeId);
  const clearMessages = useCanvasAgentStore((s) => s.clearMessages);

  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // 同步选中的节点
  useEffect(() => {
    setActiveNodeId(nodeId);
  }, [nodeId, setActiveNodeId]);

  // 自动滚动到底部
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // 模拟 Agent 响应（在没有后端时的演示模式）
  const simulateAgentResponse = useCallback(
    async (userText: string) => {
      const runId = `run_${Date.now().toString(36)}`;

      // Step 1: 理解
      setRunStatus("thinking");
      setCurrentStep("understand");
      await delay(600);

      // Step 2: 规划
      setRunStatus("planning");
      setCurrentStep("plan");
      await delay(500);

      // Step 3: 生成
      setRunStatus("generating");
      setCurrentStep("generate");

      addMessage({ role: "assistant", content: "", nodeId: nodeId ?? undefined, decisionStep: "generate" });

      // 模拟流式输出
      const response = generateMockResponse(userText, nodeId);
      for (let i = 0; i < response.length; i += 3) {
        appendToLastMessage(response.slice(i, i + 3));
        await delay(20);
      }

      await delay(300);

      // Step 4: 组装
      setRunStatus("assembling");
      setCurrentStep("assemble");
      await delay(400);

      // 完成
      setRunStatus("idle");
      setCurrentStep("");
    },
    [nodeId, setRunStatus, setCurrentStep, addMessage, appendToLastMessage]
  );

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || runStatus !== "idle") return;
    addMessage({ role: "user", content: text, nodeId: nodeId ?? undefined });
    setInput("");
    simulateAgentResponse(text);
  }, [input, runStatus, nodeId, addMessage, simulateAgentResponse]);

  const handleQuickAction = useCallback(
    (prompt: string) => {
      if (runStatus !== "idle") return;
      addMessage({ role: "user", content: prompt, nodeId: nodeId ?? undefined });
      simulateAgentResponse(prompt);
    },
    [runStatus, nodeId, addMessage, simulateAgentResponse]
  );

  const handleConfirm = useCallback(
    (decision: "approve" | "reject") => {
      addMessage({
        role: "user",
        content: decision === "approve" ? "✅ 确认执行" : "❌ 拒绝",
      });
      setPendingConfirmation(null);
      setRunStatus("idle");
    },
    [addMessage, setPendingConfirmation, setRunStatus]
  );

  const statusConfig = STATUS_CONFIG[runStatus];

  return (
    <>
      {/* 开关按钮 */}
      <motion.button
        onClick={() => setPanelOpen(!panelOpen)}
        whileTap={{ scale: 0.93 }}
        className="fixed top-3 right-3 z-50 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold"
        style={{
          background: panelOpen ? S.primary : S.card,
          color: panelOpen ? "#fff" : S.textSec,
          border: `1px solid ${panelOpen ? S.primary : S.border}`,
        }}
      >
        <span className="text-sm">{panelOpen ? "✕" : "🤖"}</span>
        Agent
      </motion.button>

      {/* 面板 */}
      <AnimatePresence>
        {panelOpen && (
          <motion.div
            initial={{ x: 320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 320, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            className="fixed top-0 right-0 bottom-0 z-40 flex flex-col"
            style={{
              width: 320,
              background: S.surface,
              borderLeft: `1px solid ${S.border}`,
            }}
          >
            {/* 头部 */}
            <div className="shrink-0 px-3 py-2.5" style={{ borderBottom: `1px solid ${S.border}` }}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold" style={{ color: S.text }}>
                  画布原生 Agent
                </span>
                <div className="flex items-center gap-1.5">
                  {runStatus !== "idle" && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${statusConfig.pulse ? "animate-pulse" : ""}`}
                      style={{ background: statusConfig.color }}
                    />
                  )}
                  <span className="text-[9px] font-mono" style={{ color: statusConfig.color }}>
                    {statusConfig.label}
                  </span>
                </div>
              </div>

              {/* 决策链指示器 */}
              {runStatus !== "idle" && currentStep && (
                <div className="flex items-center gap-0.5 mt-1">
                  {["understand", "plan", "generate", "assemble"].map((step, i) => (
                    <div key={step} className="flex items-center gap-0.5">
                      <div
                        className="px-1.5 py-0.5 rounded text-[7px] font-bold"
                        style={{
                          background:
                            step === currentStep
                              ? STATUS_CONFIG[runStatus].color + "33"
                              : "transparent",
                          color:
                            step === currentStep
                              ? STATUS_CONFIG[runStatus].color
                              : S.textMuted,
                          border: `1px solid ${step === currentStep ? STATUS_CONFIG[runStatus].color + "55" : S.border}`,
                        }}
                      >
                        {STEP_LABELS[step]}
                      </div>
                      {i < 3 && (
                        <span className="text-[7px]" style={{ color: S.textMuted }}>
                          →
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {nodeId && (
                <span className="text-[8px] font-mono mt-1 block" style={{ color: S.textMuted }}>
                  锚定节点: {nodeId.toUpperCase()}
                </span>
              )}
            </div>

            {/* 消息列表 */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
              {messages.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-[10px]" style={{ color: S.textMuted }}>
                    Agent 住在画布里，理解你的创作上下文
                  </p>
                  <p className="text-[9px] mt-1" style={{ color: S.textMuted }}>
                    选择节点后发消息，或直接点击快捷操作
                  </p>
                </div>
              )}

              {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}

              {/* HITL 确认 */}
              {pendingConfirmation && (
                <div
                  className="p-2.5 rounded-lg space-y-2"
                  style={{ background: "#F59E0B11", border: `1px solid #F59E0B33` }}
                >
                  <p className="text-[10px] font-bold" style={{ color: "#F59E0B" }}>
                    ⚠️ 需要确认
                  </p>
                  <p className="text-[9px]" style={{ color: S.textSec }}>
                    {pendingConfirmation.description}
                  </p>
                  {pendingConfirmation.suggestions && (
                    <div className="flex flex-wrap gap-1">
                      {pendingConfirmation.suggestions.map((s, i) => (
                        <span
                          key={i}
                          className="text-[8px] px-1.5 py-0.5 rounded"
                          style={{ background: S.card, color: S.textSec, border: `1px solid ${S.border}` }}
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleConfirm("approve")}
                      className="flex-1 py-1 rounded text-[9px] font-bold"
                      style={{ background: "#10B98133", color: "#10B981", border: "1px solid #10B98144" }}
                    >
                      ✅ 确认
                    </button>
                    <button
                      onClick={() => handleConfirm("reject")}
                      className="flex-1 py-1 rounded text-[9px] font-bold"
                      style={{ background: "#EF444433", color: "#EF4444", border: "1px solid #EF444444" }}
                    >
                      ❌ 拒绝
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 快捷操作 */}
            {messages.length === 0 && (
              <div className="shrink-0 px-3 py-2 space-y-1" style={{ borderTop: `1px solid ${S.border}` }}>
                <span className="text-[8px] font-mono block mb-1" style={{ color: S.textMuted }}>
                  快捷操作
                </span>
                <div className="grid grid-cols-2 gap-1">
                  {QUICK_ACTIONS.map((action) => (
                    <button
                      key={action.label}
                      onClick={() => handleQuickAction(action.prompt)}
                      disabled={runStatus !== "idle"}
                      className="text-left p-1.5 rounded text-[8px] font-bold transition-colors"
                      style={{
                        background: S.card,
                        color: runStatus !== "idle" ? S.textMuted : S.textSec,
                        border: `1px solid ${S.border}`,
                      }}
                    >
                      <span className="mr-1">{action.icon}</span>
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 输入框 */}
            <div className="shrink-0 p-2" style={{ borderTop: `1px solid ${S.border}` }}>
              <div className="flex gap-1.5">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="向 Agent 提问或发出指令…"
                  disabled={runStatus !== "idle" && runStatus !== "waiting"}
                  className="flex-1 px-2.5 py-1.5 rounded-lg text-[10px] focus:outline-none"
                  style={{
                    background: S.card,
                    color: S.text,
                    border: `1px solid ${S.border}`,
                  }}
                />
                <motion.button
                  whileTap={{ scale: 0.92 }}
                  onClick={handleSend}
                  disabled={!input.trim() || (runStatus !== "idle" && runStatus !== "waiting")}
                  className="px-2.5 rounded-lg text-[10px] font-bold"
                  style={{
                    background: input.trim() ? S.primary : S.card,
                    color: input.trim() ? "#fff" : S.textMuted,
                    border: `1px solid ${input.trim() ? S.primary : S.border}`,
                  }}
                >
                  发送
                </motion.button>
              </div>
              {messages.length > 0 && (
                <button
                  onClick={clearMessages}
                  className="text-[7px] mt-1 font-mono"
                  style={{ color: S.textMuted }}
                >
                  清空对话
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ── 消息气泡 ──

function MessageBubble({ message }: { message: AgentMessage }) {
  const isUser = message.role === "user";
  const isTool = message.role === "tool";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className="max-w-[85%] px-2.5 py-1.5 rounded-lg"
        style={{
          background: isUser
            ? `${S.primary}22`
            : isTool
              ? `${S.accent}11`
              : S.card,
          border: `1px solid ${isUser ? `${S.primary}33` : isTool ? `${S.accent}22` : S.border}`,
        }}
      >
        {/* 角色标签 */}
        <div className="flex items-center gap-1 mb-0.5">
          <span
            className="text-[7px] font-bold uppercase tracking-wider"
            style={{ color: isUser ? S.primary : isTool ? S.accent : S.textMuted }}
          >
            {isUser ? "You" : isTool ? "Tool" : "Agent"}
          </span>
          {message.decisionStep && (
            <span
              className="text-[6px] px-1 rounded"
              style={{
                background: S.primary + "22",
                color: S.primary,
                border: `1px solid ${S.primary}33`,
              }}
            >
              {STEP_LABELS[message.decisionStep] ?? message.decisionStep}
            </span>
          )}
          {message.nodeId && (
            <span className="text-[6px] font-mono" style={{ color: S.textMuted }}>
              @{message.nodeId.toUpperCase()}
            </span>
          )}
        </div>

        {/* 内容 */}
        <p className="text-[9px] leading-relaxed whitespace-pre-wrap" style={{ color: S.textSec }}>
          {message.content}
        </p>

        {/* 工具调用状态 */}
        {message.toolCall && (
          <div
            className="mt-1 px-2 py-1 rounded text-[7px] font-mono"
            style={{ background: S.surface, border: `1px solid ${S.border}` }}
          >
            <span style={{ color: S.accent }}>⚙ {message.toolCall.toolName}</span>
            {message.toolCall.status === "done" && (
              <span className="ml-1" style={{ color: "#10B981" }}>
                ✓
              </span>
            )}
            {message.toolCall.status === "executing" && (
              <span className="ml-1 animate-pulse" style={{ color: "#F59E0B" }}>
                ⋯
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── 辅助 ──

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function generateMockResponse(userText: string, nodeId: string | null): string {
  const node = nodeId ? nodeId.toUpperCase() : "当前节点";

  if (userText.includes("分支") || userText.includes("路线")) {
    return `基于 ${node} 的上下文分析，我建议增加一条"暗线分支"：

**分支C: 暗中跟踪**
触发条件: [隐匿值 >= 10] 且 [已发现芯片]

这条分支让玩家选择放弃正面对抗，转而利用环境优势跟踪线人到秘密据点。叙事上，这增加了信息差——玩家会比正面路线多获知一段关键背景故事，但会错过战斗场景中的角色成长。

从张力曲线看，这条分支能在当前节点后提供一个"舒缓→紧张"的节奏变化，避免连续高强度场景导致的玩家疲劳。

需要我把这个分支添加到图谱中吗？`;
  }

  if (userText.includes("失败") || userText.includes("反馈")) {
    return `为 ${node} 生成失败反馈：

当玩家选择"拔枪擒拿"但意志值不足时：

> 你的手指扣上扳机的瞬间，一阵眩晕袭来。芯片里的神经干扰信号正在侵蚀你的意志。线人的身影在你眼中分裂成三个，每一个都在冷笑。
>
> "看来你的意志力还不够，执政官。"
>
> 枪从手中滑落，金属撞击地面的声音在巷子里回荡。当你重新聚焦时，线人已经消失在管道深处。

变量变化: 意志值 -3, 声望 -2
后续影响: 解锁"复仇"支线（第三章）`;
  }

  if (userText.includes("一致性") || userText.includes("检查")) {
    return `对 ${node} 进行一致性检查：

✅ **结构一致性**: 通过 — 所有入边和出边引用的节点均存在
✅ **变量一致性**: 通过 — "意志值"在本节点读写平衡
⚠️ **角色一致性**: 警告 — 角色"线人·卡尔"在 N02 出场但在本节点缺少出场标记
✅ **叙事一致性**: 通过 — 选择后的两条分支都有明确的后果展示

建议: 在 N03 的角色出场列表中添加"线人·卡尔"，确保角色追踪的完整性。`;
  }

  if (userText.includes("张力") || userText.includes("优化")) {
    return `分析 ${node} 的张力曲线：

当前张力值: **7.2/10** (紧张)
- 情绪因子: 6/10 (选择压力)
- 后果因子: 8/10 (重大分支影响)
- 变量因子: 5/10 (中等变量变更)

📈 优化建议:
1. 在选择前增加一段 3-5 秒的"倒计时"提示，提升时间压力
2. 给失败分支增加一个"挽回机会"节点（需要消耗某个道具），降低挫败感
3. 在 N03 前一个节点增加一条暗示信息，让玩家有更充分的决策依据

调整后预估张力: **8.1/10**`;
  }

  return `我已理解你的问题。基于 ${node} 及其上下游节点的分析：

当前节点是一个**选择节点**，有两条分支路线。从叙事设计角度看，这个选择点的"有意义率"较高——两条分支分别导向战斗和潜行两种截然不同的游戏体验。

如果你需要我帮忙做具体的修改，可以试试：
- 🌿 建议新分支
- 💥 生成失败反馈
- 🔍 检查一致性
- 📈 优化张力曲线

或者直接告诉我你的想法，我会根据上下文给出建议。`;
}
