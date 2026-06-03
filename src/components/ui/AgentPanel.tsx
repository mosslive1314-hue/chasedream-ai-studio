"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import {
  X, Send, AlertCircle, Loader2, CheckCircle2, XCircle,
  Sparkles, MessageSquare, ChevronRight, RotateCcw,
} from "lucide-react";
import { useCanvasAgentStore } from "@/store";
import type { AgentMessage, AgentRunStatus } from "@/store";

// ─── Design Tokens ──────────────────────────────────────────
const S = {
  card: "#FFFFFF",
  bg: "#F5F6FA",
  border: "#E2E5F0",
  primary: "#5E50E8",
  primary10: "rgba(94,80,232,0.10)",
  primary20: "rgba(94,80,232,0.20)",
  text: "#1A1D2E",
  text2: "#4A5068",
  text3: "#8892B0",
  accent: "#F97316",
  success: "#10B981",
  error: "#EF4444",
  warning: "#F59E0B",
};

// ─── Page Label Map ─────────────────────────────────────────
const PAGE_LABELS: Record<string, string> = {
  "/": "工作台",
  "/story-overview": "剧本总览",
  "/parse": "剧本解构",
  "/script": "剧本编辑",
  "/interaction": "互动设计",
  "/nodes": "节点图谱",
  "/assets": "资产工坊",
  "/cinematic": "演出设计",
  "/simulator": "演出预览",
  "/overview": "质检总览",
  "/publish": "发布",
  "/collab": "协作",
  "/version": "版本管理",
  "/settings": "设置",
};

// ─── Status Config ──────────────────────────────────────────
const STATUS_CONFIG: Record<AgentRunStatus, { label: string; color: string; pulse: boolean }> = {
  idle:       { label: "就绪",      color: S.success, pulse: false },
  thinking:   { label: "理解中…",   color: S.primary, pulse: true },
  planning:   { label: "规划中…",   color: S.warning, pulse: true },
  generating: { label: "生成中…",   color: "#3B82F6", pulse: true },
  assembling: { label: "组装中…",   color: S.success, pulse: true },
  waiting:    { label: "等待确认",  color: S.warning, pulse: false },
  error:      { label: "出错",      color: S.error,   pulse: false },
};

// ─── Decision Step Labels ───────────────────────────────────
const STEP_LABELS: Record<string, string> = {
  understand: "理解",
  plan: "规划",
  generate: "生成",
  assemble: "组装",
};

// ─── Quick Actions (context-aware) ──────────────────────────
function getQuickActions(page: string) {
  if (page.includes("nodes")) return [
    { label: "检查节点覆盖度", prompt: "检查当前节点图谱的覆盖度，是否有孤立节点" },
    { label: "建议新分支", prompt: "为当前节点图谱建议一条新的分支路线" },
    { label: "检查一致性", prompt: "检查节点间的变量引用和角色出场一致性" },
  ];
  if (page.includes("script") || page.includes("parse")) return [
    { label: "分析剧本结构", prompt: "分析当前剧本的结构、节奏和分支密度" },
    { label: "补充场景描述", prompt: "为当前剧本中缺少描述的章节补充场景描述" },
    { label: "检查世界观规则", prompt: "检查剧本中是否有违反世界观规则的设定" },
  ];
  if (page.includes("interaction")) return [
    { label: "检查互动覆盖度", prompt: "检查互动点的覆盖度和QTE难度曲线" },
    { label: "优化分支后果", prompt: "分析并优化各选择节点的后果设计" },
  ];
  if (page.includes("assets")) return [
    { label: "检查资产绑定", prompt: "检查资产与节点的绑定关系是否完整" },
    { label: "生成资产需求", prompt: "根据剧本内容为缺失资产生成需求描述" },
  ];
  if (page.includes("cinematic") || page.includes("simulator")) return [
    { label: "推荐镜头语言", prompt: "根据剧本情感曲线推荐镜头语言" },
    { label: "优化转场效果", prompt: "分析并优化场景间的转场效果" },
  ];
  if (page.includes("overview")) return [
    { label: "分析质检报告", prompt: "分析质检报告中得分最低的环节" },
    { label: "提供改进建议", prompt: "根据当前质检数据提供具体改进建议" },
  ];
  return [
    { label: "检查项目完整性", prompt: "检查项目各模块的完整性和数据一致性" },
    { label: "创作建议", prompt: "根据当前项目状态提供创作建议" },
    { label: "快速入门", prompt: "介绍你可以让我帮你做什么" },
  ];
}

// ─── Main Component ─────────────────────────────────────────

export function AgentPanel() {
  const pathname = usePathname();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [input, setInput] = useState("");
  const [mounted, setMounted] = useState(false);

  // 只在客户端渲染后挂载 portal
  useEffect(() => { setMounted(true); }, []);

  // Store selectors
  const panelOpen         = useCanvasAgentStore(s => s.panelOpen);
  const setPanelOpen      = useCanvasAgentStore(s => s.setPanelOpen);
  const messages          = useCanvasAgentStore(s => s.messages);
  const runStatus         = useCanvasAgentStore(s => s.runStatus);
  const currentStep       = useCanvasAgentStore(s => s.currentStep);
  const pendingConfirm    = useCanvasAgentStore(s => s.pendingConfirmation);
  const setPendingConf    = useCanvasAgentStore(s => s.setPendingConfirmation);
  const setRunStatus      = useCanvasAgentStore(s => s.setRunStatus);
  const setCurrentStep    = useCanvasAgentStore(s => s.setCurrentStep);
  const addMessage        = useCanvasAgentStore(s => s.addMessage);
  const appendToLast      = useCanvasAgentStore(s => s.appendToLastMessage);
  const clearMessages     = useCanvasAgentStore(s => s.clearMessages);
  const errorMessage      = useCanvasAgentStore(s => s.errorMessage);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Cmd+J / Ctrl+J toggle + Escape to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "j") {
        e.preventDefault();
        setPanelOpen(!panelOpen);
      }
      if (e.key === "Escape" && panelOpen) {
        setPanelOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [panelOpen, setPanelOpen]);

  // Focus input when panel opens
  useEffect(() => {
    if (panelOpen) setTimeout(() => inputRef.current?.focus(), 200);
  }, [panelOpen]);

  // ─── Simulate Agent Response (demo mode) ──────────────────
  const simulateAgentResponse = useCallback(async (userText: string) => {
    // Step 1: Understand
    setRunStatus("thinking");
    setCurrentStep("understand");
    await delay(500);

    // Step 2: Plan
    setRunStatus("planning");
    setCurrentStep("plan");
    await delay(400);

    // Step 3: Generate
    setRunStatus("generating");
    setCurrentStep("generate");

    addMessage({ role: "assistant", content: "", decisionStep: "generate" });

    const response = generateContextualResponse(userText, pathname);
    for (let i = 0; i < response.length; i += 3) {
      appendToLast(response.slice(i, i + 3));
      await delay(15);
    }

    await delay(200);

    // Step 4: Assemble
    setRunStatus("assembling");
    setCurrentStep("assemble");
    await delay(300);

    // Done
    setRunStatus("idle");
    setCurrentStep("");
  }, [pathname, setRunStatus, setCurrentStep, addMessage, appendToLast]);

  // ─── Send Handler ─────────────────────────────────────────
  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || runStatus !== "idle") return;
    addMessage({ role: "user", content: text });
    setInput("");
    simulateAgentResponse(text);
  }, [input, runStatus, addMessage, simulateAgentResponse]);

  // ─── Quick Action Handler ─────────────────────────────────
  const handleQuickAction = useCallback((prompt: string) => {
    if (runStatus !== "idle") return;
    addMessage({ role: "user", content: prompt });
    simulateAgentResponse(prompt);
  }, [runStatus, addMessage, simulateAgentResponse]);

  // ─── HITL Confirm/Reject ──────────────────────────────────
  const handleConfirm = useCallback((approved: boolean) => {
    if (!pendingConfirm) return;
    addMessage({
      role: "system",
      content: approved
        ? `✅ 已确认: ${pendingConfirm.description}`
        : `❌ 已拒绝: ${pendingConfirm.description}`,
    });
    if (approved) {
      addMessage({
        role: "assistant",
        content: "已按方案执行，变更已写入暂存区。你可以继续编辑或撤销。",
      });
    }
    setPendingConf(null);
    setRunStatus("idle");
  }, [pendingConfirm, addMessage, setPendingConf, setRunStatus]);

  const quickActions = getQuickActions(pathname);
  const statusCfg = STATUS_CONFIG[runStatus];

  // ─── Render (createPortal 脱离 EazoProvider 层叠上下文) ──────────────
  if (!mounted) return null;
  return createPortal(
    <>
      {panelOpen && (
        <>
          {/* 半透明遮罩 — 纯视觉蒙版，不拦截任何点击事件 */}
          <div
            className="fixed inset-0"
            style={{
              zIndex: 9998,
              background: "rgba(0,0,0,0.08)",
              pointerEvents: "none",
            }}
          />
          {/* Panel — 纯 CSS 定位，不依赖 framer-motion 动画 */}
          <aside
            className="fixed right-0 top-0 bottom-0 flex flex-col shadow-2xl"
            style={{
              zIndex: 10000,
              width: 360,
              background: S.card,
              borderLeft: `1px solid ${S.border}`,
              pointerEvents: "auto",
            }}
          >
            {/* ── Header ─────────────────────────────────────── */}
            <div
              className="flex items-center justify-between px-4 h-11 shrink-0 border-b"
              style={{ borderColor: S.border }}
            >
              <div className="flex items-center gap-2">
                <Sparkles size={14} style={{ color: S.primary }} />
                <span className="text-sm font-semibold" style={{ color: S.text }}>
                  AI 助手
                </span>
                {/* Status badge */}
                <span
                  className="flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full font-medium"
                  style={{
                    color: statusCfg.color,
                    background: `${statusCfg.color}15`,
                  }}
                >
                  {statusCfg.pulse && (
                    <span
                      className="w-1.5 h-1.5 rounded-full animate-pulse"
                      style={{ background: statusCfg.color }}
                    />
                  )}
                  {statusCfg.label}
                </span>
              </div>
              <div className="flex items-center gap-1">
                {messages.length > 0 && (
                  <motion.button
                    whileTap={{ scale: 0.92 }}
                    onClick={clearMessages}
                    className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
                    title="清空对话"
                  >
                    <RotateCcw size={13} style={{ color: S.text3 }} />
                  </motion.button>
                )}
                <motion.button
                  whileTap={{ scale: 0.92 }}
                  onClick={() => setPanelOpen(false)}
                  className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
                >
                  <X size={14} style={{ color: S.text3 }} />
                </motion.button>
              </div>
            </div>

            {/* ── Decision Chain Indicator ───────────────────── */}
            {runStatus !== "idle" && currentStep && (
              <div
                className="flex items-center gap-1 px-4 py-1.5 border-b shrink-0"
                style={{ borderColor: S.border, background: S.bg }}
              >
                {(["understand", "plan", "generate", "assemble"] as const).map((step, i) => (
                  <div key={step} className="flex items-center gap-1">
                    <div
                      className="px-2 py-0.5 rounded text-xs font-medium transition-all"
                      style={{
                        background: step === currentStep ? `${statusCfg.color}20` : "transparent",
                        color: step === currentStep ? statusCfg.color : S.text3,
                        border: `1px solid ${step === currentStep ? `${statusCfg.color}40` : "transparent"}`,
                      }}
                    >
                      {STEP_LABELS[step]}
                    </div>
                    {i < 3 && (
                      <ChevronRight size={10} style={{ color: S.text3 }} />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* ── Context Bar ────────────────────────────────── */}
            <div
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs border-b shrink-0"
              style={{ color: S.text3, borderColor: S.border, background: S.bg }}
            >
              <MessageSquare size={11} />
              <span>当前页面：</span>
              <span style={{ color: S.text2, fontWeight: 500 }}>
                {PAGE_LABELS[pathname] ?? pathname}
              </span>
            </div>

            {/* ── Messages ───────────────────────────────────── */}
            <div
              className="flex-1 overflow-y-auto px-4 py-3 space-y-3"
              style={{ background: S.bg }}
            >
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center px-4">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                    style={{ background: S.primary10 }}
                  >
                    <Sparkles size={24} style={{ color: S.primary }} />
                  </div>
                  <p className="text-sm font-semibold mb-1.5" style={{ color: S.text }}>
                    逐梦 AI 助手
                  </p>
                  <p className="text-xs leading-relaxed max-w-[240px] mb-5" style={{ color: S.text3 }}>
                    我可以帮你分析剧本结构、检查节点逻辑、推荐资产绑定方案，或者解答创作问题。
                  </p>
                  {/* Quick actions */}
                  <div className="w-full space-y-1.5">
                    <span className="text-xs font-medium block text-left" style={{ color: S.text2 }}>
                      快捷操作
                    </span>
                    {quickActions.map(action => (
                      <motion.button
                        key={action.label}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => handleQuickAction(action.prompt)}
                        className="w-full text-left text-xs px-3 py-2 rounded-lg border transition-colors hover:bg-white"
                        style={{ color: S.text2, borderColor: S.border, background: S.card }}
                      >
                        {action.label}
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map(msg => (
                <MessageBubble key={msg.id} msg={msg} />
              ))}

              {/* Thinking indicator */}
              {(runStatus === "thinking" || runStatus === "planning" || runStatus === "generating" || runStatus === "assembling") && messages.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 text-xs py-2 px-3"
                  style={{ color: S.primary }}
                >
                  <Loader2 size={12} className="animate-spin" />
                  <span>{statusCfg.label}</span>
                </motion.div>
              )}

              {/* Error banner */}
              {runStatus === "error" && errorMessage && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-2 text-xs p-3 rounded-lg border"
                  style={{ color: S.error, borderColor: `${S.error}30`, background: `${S.error}08` }}
                >
                  <AlertCircle size={13} className="mt-0.5 shrink-0" />
                  <span>{errorMessage}</span>
                </motion.div>
              )}

              {/* HITL Confirmation */}
              {runStatus === "waiting" && pendingConfirm && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border p-3 space-y-2.5"
                  style={{ background: S.card, borderColor: S.warning }}
                >
                  <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: S.warning }}>
                    <AlertCircle size={13} />
                    <span>需要你的确认</span>
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: S.text2 }}>
                    {pendingConfirm.description}
                  </p>
                  {pendingConfirm.scope && (
                    <p className="text-xs" style={{ color: S.text3 }}>
                      影响范围：{pendingConfirm.scope.join("、")}
                    </p>
                  )}
                  <div className="flex gap-2 pt-0.5">
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleConfirm(true)}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg text-white font-medium"
                      style={{ background: S.success }}
                    >
                      <CheckCircle2 size={12} />
                      确认执行
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleConfirm(false)}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border font-medium"
                      style={{ color: S.text2, borderColor: S.border }}
                    >
                      <XCircle size={12} />
                      拒绝
                    </motion.button>
                  </div>
                  {pendingConfirm.suggestions && pendingConfirm.suggestions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {pendingConfirm.suggestions.map((s, i) => (
                        <span
                          key={i}
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{ background: S.primary10, color: S.primary }}
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* ── Input Bar ──────────────────────────────────── */}
            <div
              className="shrink-0 px-3 py-2.5 border-t"
              style={{ borderColor: S.border, background: S.card }}
            >
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder={runStatus !== "idle" ? "AI 正在工作…" : "输入你的问题…"}
                  disabled={runStatus !== "idle" && runStatus !== "waiting"}
                  className="flex-1 text-xs px-3 py-2 rounded-lg border outline-none transition-colors"
                  style={{
                    borderColor: input ? S.primary20 : S.border,
                    background: S.bg,
                    color: S.text,
                  }}
                />
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={handleSend}
                  disabled={!input.trim() || (runStatus !== "idle" && runStatus !== "waiting")}
                  className="p-2 rounded-lg transition-colors disabled:opacity-40"
                  style={{
                    background: input.trim() && runStatus === "idle" ? S.primary : S.primary10,
                    color: input.trim() && runStatus === "idle" ? "#fff" : S.primary,
                  }}
                >
                  <Send size={13} />
                </motion.button>
              </div>
              <div className="mt-1.5 flex items-center justify-between px-1">
                <span className="text-xs" style={{ color: S.text3, fontSize: 10 }}>
                  Cmd+J 切换 · Esc 关闭
                </span>
                <span className="text-xs" style={{ color: S.text3, fontSize: 10 }}>
                  Demo 模式 — 待接入 AI
                </span>
              </div>
            </div>
          </aside>
        </>
      )}
    </>,
    document.body
  );
}

// ─── Message Bubble ─────────────────────────────────────────

function MessageBubble({ msg }: { msg: AgentMessage }) {
  const isUser = msg.role === "user";
  const isSystem = msg.role === "system";
  const isTool = msg.role === "tool";

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 180 }}
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className="max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed"
        style={{
          background: isUser
            ? S.primary
            : isTool
              ? `${S.accent}08`
              : isSystem
                ? `${S.success}08`
                : S.card,
          color: isUser ? "#fff" : S.text2,
          border: isUser ? "none" : `1px solid ${S.border}`,
        }}
      >
        {/* Role badge */}
        {!isUser && (
          <div className="flex items-center gap-1.5 mb-1">
            {isTool ? (
              <span className="text-xs font-medium" style={{ color: S.accent }}>
                工具调用
              </span>
            ) : isSystem ? (
              <span className="text-xs font-medium" style={{ color: S.success }}>
                系统
              </span>
            ) : (
              <span className="flex items-center gap-1" style={{ color: S.primary }}>
                <Sparkles size={10} />
                <span className="font-medium">AI</span>
              </span>
            )}
            {msg.decisionStep && (
              <span
                className="text-xs px-1.5 py-0.5 rounded"
                style={{ background: S.primary10, color: S.primary, fontSize: 10 }}
              >
                {STEP_LABELS[msg.decisionStep] ?? msg.decisionStep}
              </span>
            )}
          </div>
        )}

        {/* Tool call details */}
        {msg.toolCall && (
          <div className="mb-1.5">
            <div className="flex items-center gap-1.5">
              <code
                className="text-xs px-1.5 py-0.5 rounded font-mono"
                style={{ background: "rgba(0,0,0,0.04)", fontSize: 10 }}
              >
                {msg.toolCall.toolName}
              </code>
              <span
                className="text-xs px-1.5 py-0.5 rounded-full"
                style={{
                  fontSize: 10,
                  background:
                    msg.toolCall.status === "done" ? `${S.success}15` :
                    msg.toolCall.status === "rejected" ? `${S.error}15` :
                    `${S.warning}15`,
                  color:
                    msg.toolCall.status === "done" ? S.success :
                    msg.toolCall.status === "rejected" ? S.error :
                    S.warning,
                }}
              >
                {msg.toolCall.status === "done" ? "完成" :
                 msg.toolCall.status === "executing" ? "执行中" :
                 msg.toolCall.status === "rejected" ? "已拒绝" : "待处理"}
              </span>
            </div>
            {msg.toolCall.result && (
              <pre
                className="mt-1 text-xs p-2 rounded overflow-x-auto"
                style={{ background: "rgba(0,0,0,0.03)", fontSize: 10, maxHeight: 80 }}
              >
                {msg.toolCall.result}
              </pre>
            )}
          </div>
        )}

        {/* Message content */}
        <span className="whitespace-pre-wrap">{msg.content}</span>

        {/* Timestamp */}
        <div
          className="mt-1 text-right"
          style={{ color: isUser ? "rgba(255,255,255,0.5)" : S.text3, fontSize: 9 }}
        >
          {new Date(msg.timestamp).toLocaleTimeString("zh-CN", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Helpers ────────────────────────────────────────────────

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function generateContextualResponse(userText: string, page: string): string {
  const pageLabel = PAGE_LABELS[page] ?? "当前页面";

  if (userText.includes("节点") || userText.includes("覆盖") || page.includes("nodes")) {
    return `基于「${pageLabel}」的分析，我检查了节点图谱的覆盖度：

✅ 起始节点: 正常连接
✅ 主要分支: 3 条活跃路径
⚠️ 发现 1 个孤立节点: N07 ("废弃工厂") 没有出边
⚠️ 发现 2 个死端节点: N04, N09 没有后续分支

建议:
1. 为 N07 添加连接到主线或侧线的出边
2. N04 和 N09 可以添加"返回"选择或"特殊结局"分支
3. 总体覆盖度约 78%，建议补充 2-3 条次要分支提升重玩性

需要我自动生成修复方案吗？`;
  }

  if (userText.includes("剧本") || userText.includes("结构") || page.includes("script") || page.includes("parse")) {
    return `对「${pageLabel}」的剧本结构分析：

📊 结构概览:
- 总章节数: 5 章
- 分支密度: 中等 (每章平均 2.3 个选择点)
- 节奏曲线: 前半段较平缓，第 3 章后加速

💡 建议:
1. 第 1-2 章可以增加 1-2 个小选择，让玩家更早建立参与感
2. 第 4 章的连续高张力场景间建议插入一个"喘息"节点
3. 部分场景描述可以更具体，有助于后续资产生成

需要我帮你调整具体章节吗？`;
  }

  if (userText.includes("资产") || userText.includes("绑定") || page.includes("assets")) {
    return `在「${pageLabel}」中检查了资产绑定关系：

📦 资产统计:
- 已绑定: 12 个资产
- 未绑定: 5 个资产（2 个场景、2 个角色、1 个道具）
- 缺失: 3 个节点引用了不存在的资产 ID

⚠️ 问题:
1. N03 的"暗巷"场景缺少背景图资产
2. 角色"线人·卡尔"在 N02、N05 出场但没有立绘资产
3. 道具"芯片"在剧本中被提及但没有 3D 模型

需要我为缺失资产生成需求描述吗？`;
  }

  if (userText.includes("互动") || userText.includes("QTE") || page.includes("interaction")) {
    return `对「${pageLabel}」的互动设计分析：

🎮 互动覆盖:
- 互动点总数: 8 个
- QTE 事件: 3 个
- 选择事件: 5 个

📈 难度曲线:
当前 QTE 难度分布较为平均，建议：
1. 第一个 QTE 适当降低难度，让玩家适应
2. 最终章的 QTE 可以提升难度，增加紧张感
3. 部分选择节点的"后果描述"可以更加具体

需要我优化难度曲线吗？`;
  }

  if (userText.includes("演出") || userText.includes("镜头") || userText.includes("转场") || page.includes("cinematic") || page.includes("simulator")) {
    return `在「${pageLabel}」中的镜头语言分析：

🎬 镜头配置:
- 已配置: 8 个场景
- 未配置: 4 个场景（使用默认镜头）

📈 情感曲线匹配度: 72%

建议:
1. 高张力场景建议使用特写镜头 + 快速切换
2. 对话场景可以加入过肩镜头增加沉浸感
3. 场景转换处建议添加 0.5-1s 的淡出过渡

需要我为未配置的场景推荐镜头方案吗？`;
  }

  if (userText.includes("质检") || userText.includes("报告") || page.includes("overview")) {
    return `对「${pageLabel}」的质检数据分析：

📊 当前质量分: 72/100

薄弱环节:
1. 资产完整度 (58分) — 主要扣分在缺失资产
2. 分支覆盖度 (65分) — 存在孤立和死端节点
3. 互动丰富度 (70分) — 部分章节互动点偏少

优势环节:
1. 剧本结构 (85分) — 叙事逻辑清晰
2. 演出设计 (80分) — 镜头配置合理

优先改进建议: 先补齐缺失资产，再修复节点图谱问题。需要我生成详细的改进清单吗？`;
  }

  return `你好，我是逐梦 AI 助手，正在「${pageLabel}」为你服务。

目前我处于 Demo 模式，可以根据你的问题提供结构化的分析和建议。后续接入真实 AI 后，我将能够直接执行修改操作。

你可以试试让我：
- 分析当前页面的数据状态
- 检查项目完整性
- 提供创作或优化建议

请告诉我你想了解什么？`;
}
