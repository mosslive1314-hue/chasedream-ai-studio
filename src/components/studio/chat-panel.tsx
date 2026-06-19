"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, Bot, User, Loader2, RotateCcw, Check, X, Shield, Plus,
} from "lucide-react";
import { useCanvasAgentStore, useSettingsStore, useNarrativeStore, usePipelineStore, STAGE_DEFS } from "@/store";
import type { AgentMessage } from "@/store";
import { AIService } from "@/lib/ai/ai-service";
import { createDefaultToolRegistry } from "@/lib/ai/tool-registry";
import { AgentChatLoop, type ChatLoopCallbacks } from "@/lib/ai/agent-chat-loop";
import type { ChatMessage } from "@/lib/ai/model-router";
import { runConsistencyChecks } from "@/lib/consistency-engine";
import { runPathTest } from "@/lib/path-test-engine";
import { ImportPanel } from "./import-panel";

// 工具调用可视化卡片（可折叠）
function ToolCallCard({ msg }: { msg: AgentMessage }) {
  const [open, setOpen] = useState(false);
  const tc = msg.toolCall!;
  return (
    <div className="rounded border border-zinc-800 bg-zinc-950/60">
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center gap-1.5 px-2 py-1 text-left">
        <span className="font-mono text-xs text-violet-300">+ {tc.toolName}</span>
        <span className={`ml-auto text-xs ${tc.status === "done" ? "text-emerald-400" : "text-amber-400"}`}>{tc.status}</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-zinc-800 px-2 py-1.5"
          >
            <pre className="whitespace-pre-wrap break-all text-xs text-zinc-400">
              {JSON.stringify(tc.args, null, 2)}
            </pre>
            {tc.result && (
              <pre className="mt-1 whitespace-pre-wrap break-all text-xs text-zinc-500">{tc.result}</pre>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// 单条消息渲染
function MessageItem({ msg }: { msg: AgentMessage }) {
  const isUser = msg.role === "user";
  const expertAvatar = msg.expertAvatar;
  const expertRole = msg.expertRole;
  return (
    <div className={`flex gap-2 ${isUser ? "flex-row-reverse" : ""}`}>
      <div
        className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm ${
          isUser ? "bg-zinc-700" : "bg-violet-600"
        }`}
        title={expertRole ?? undefined}
      >
        {isUser ? (
          <User className="h-3.5 w-3.5 text-zinc-300" />
        ) : expertAvatar ? (
          <span>{expertAvatar}</span>
        ) : (
          <Bot className="h-3.5 w-3.5 text-white" />
        )}
      </div>
      <div
        className={`max-w-[85%] rounded-lg px-3 py-2 text-sm leading-relaxed ${
          isUser ? "bg-zinc-700 text-zinc-100" : "bg-zinc-900 text-zinc-200"
        }`}
      >
        {!isUser && expertRole && (
          <div className="mb-1 text-xs font-medium text-violet-400">{expertRole}</div>
        )}
        {msg.toolCall ? <ToolCallCard msg={msg} /> : <span className="whitespace-pre-wrap">{msg.content}</span>}
      </div>
    </div>
  );
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 演示模式响应（无 API Key 时）
function generateContextualResponse(userText: string): string {
  // 演示模式文本响应（无 API Key 时降级使用）
  // 注意：工具调用（一致性检查、路径测试、创建节点等）仍走真实逻辑，不经过这里
  if (userText.includes("节点") || userText.includes("场景") || userText.includes("创建")) {
    return `【演示响应 · 未接入真实 AI】配置 API Key 后可获得真实创作能力。

你可以通过对话让我：
- 创建场景、选择、结局等节点
- 修改节点内容或连接关系
- 检查故事一致性（真实执行）
- 分析叙事路径（真实执行）

请告诉我具体想做什么？`;
  }
  return `【演示响应 · 未接入真实 AI】你好，我是逐梦 AI 助手。

当前未配置 API Key，文本对话为演示模式。但工具调用（如"检查一致性""分析路径"）仍会真实执行。

配置 API Key 后，我将获得真实的剧本创作、角色生成、分支建议等能力。`;
}

// HITL 确认面板
function ConfirmationPanel() {
  const pendingConfirmation = useCanvasAgentStore((s) => s.pendingConfirmation);
  const setPendingConfirmation = useCanvasAgentStore((s) => s.setPendingConfirmation);

  if (!pendingConfirmation) return null;

  const resolver = (pendingConfirmation as unknown as { __resolve?: (v: boolean) => void }).__resolve;

  const handle = (approved: boolean) => {
    resolver?.(approved);
    setPendingConfirmation(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="mx-2 mb-2 rounded-lg border border-orange-700/50 bg-orange-950/40 p-3"
    >
      <div className="mb-2 flex items-center gap-1.5 text-sm font-medium text-orange-300">
        <Shield className="h-4 w-4" />
        <span>需要确认操作</span>
      </div>
      <p className="mb-3 text-sm leading-relaxed text-zinc-300">
        {pendingConfirmation.description}
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => handle(true)}
          className="flex flex-1 items-center justify-center gap-1 rounded-md bg-emerald-600 px-3 py-1.5 text-sm text-white hover:bg-emerald-500"
        >
          <Check className="h-3.5 w-3.5" /> 确认
        </button>
        <button
          onClick={() => handle(false)}
          className="flex flex-1 items-center justify-center gap-1 rounded-md bg-zinc-700 px-3 py-1.5 text-sm text-zinc-200 hover:bg-zinc-600"
        >
          <X className="h-3.5 w-3.5" /> 拒绝
        </button>
      </div>
    </motion.div>
  );
}

// 从 narrative store 同步数据到 pipeline context
function syncNarrativeToPipeline() {
  const store = useNarrativeStore.getState();
  const pipeline = usePipelineStore.getState();

  // 同步角色
  if (store.characters.length > 0) {
    pipeline.setStageOutput("characters", store.characters.map((c) => ({
      id: c.id, name: c.name, emoji: c.emoji, role: c.role, description: c.description,
    })));
  }
  // 同步场景
  if (store.scenes && store.scenes.length > 0) {
    pipeline.setStageOutput("scenes", store.scenes.map((s) => ({
      id: s.id, name: s.name, location: s.location ?? "", mood: s.atmosphere ?? "", visualPrompt: s.visualPrompt ?? "",
    })));
  }
  // 同步道具
  if (store.props && store.props.length > 0) {
    pipeline.setStageOutput("props", store.props.map((p) => ({
      id: p.id, name: p.name, type: p.type, description: p.description, gameplayEffect: p.gameplayEffect,
    })));
  }
  // 同步节点图
  if (store.storyNodes.length > 0) {
    pipeline.setStageOutput("nodeGraph", {
      nodeCount: store.storyNodes.length,
      edgeCount: store.nodeEdges.length,
    });
  }
  // 同步变量
  if (store.variables.length > 0) {
    pipeline.setStageOutput("variables", store.variables.map((v) => ({
      id: v.id, label: v.label, initialValue: String(v.initialValue),
    })));
  }
  // 同步镜头指导
  if (store.cinematicDirections && store.cinematicDirections.length > 0) {
    pipeline.setStageOutput("cinematicDirections", store.cinematicDirections.map((cd) => ({
      nodeId: cd.nodeId, shotType: cd.camera.shotType, duration: cd.camera.duration,
    })));
  }
  // 同步结局
  if (store.storyNodes.length > 0) {
    const endings = store.storyNodes.filter((n) => n.type === "ending_good" || n.type === "ending_bad");
    if (endings.length > 0) {
      pipeline.setStageOutput("endings", endings.map((n) => ({
        id: n.id, type: n.type, label: n.label,
      })));
    }
    // 同步选择点
    const choices = store.storyNodes.filter((n) => n.type === "choice");
    if (choices.length > 0) {
      pipeline.setStageOutput("choices", choices.map((n) => ({
        nodeId: n.id, options: store.nodeEdges.filter((e) => e.from === n.id).map((e) => e.label ?? ""),
      })));
    }
  }
}

// Agent 对话面板：管线驱动 + 极简布局
export function ChatPanel() {
  const messages = useCanvasAgentStore((s) => s.messages);
  const runStatus = useCanvasAgentStore((s) => s.runStatus);
  const addMessage = useCanvasAgentStore((s) => s.addMessage);
  const appendToLastMessage = useCanvasAgentStore((s) => s.appendToLastMessage);
  const setRunStatus = useCanvasAgentStore((s) => s.setRunStatus);
  const setCurrentStep = useCanvasAgentStore((s) => s.setCurrentStep);
  const clearMessages = useCanvasAgentStore((s) => s.clearMessages);
  const setErrorMessage = useCanvasAgentStore((s) => s.setErrorMessage);
  const setPendingConfirmation = useCanvasAgentStore((s) => s.setPendingConfirmation);
  const pendingConfirmation = useCanvasAgentStore((s) => s.pendingConfirmation);

  // 管线 store
  const advance = usePipelineStore((s) => s.advance);
  const setEntryPath = usePipelineStore((s) => s.setEntryPath);
  const currentStage = usePipelineStore((s) => s.currentStage);
  const prevStageRef = useRef(currentStage);

  // 阶段切换时发送系统消息（产出清单 + 下一阶段指令）— 替代折叠式阶段摘要条
  useEffect(() => {
    if (prevStageRef.current === currentStage) return;
    const prevDef = STAGE_DEFS.find((s) => s.id === prevStageRef.current)!;
    const newDef = STAGE_DEFS.find((s) => s.id === currentStage)!;
    const pipeline = usePipelineStore.getState();

    // 格式化上一阶段产出清单
    const formatOutputs = (stageId: string): string => {
      const ctx = pipeline.context;
      switch (stageId) {
        case "entry":
          return `故事大纲：${ctx.storyOutline ? "✓ " + ctx.storyOutline.slice(0, 60) : "未设置"}`;
        case "narrative": {
          const chars = ctx.characters?.length ?? 0;
          const scenes = ctx.scenes?.length ?? 0;
          const props = ctx.props?.length ?? 0;
          return `角色 ${chars} 个 · 场景 ${scenes} 个 · 道具 ${props} 个`;
        }
        case "interaction": {
          const nodes = ctx.nodeGraph?.length ?? 0;
          const vars = ctx.variables?.length ?? 0;
          const endings = ctx.endings?.length ?? 0;
          return `节点 ${nodes} 个 · 变量 ${vars} 个 · 结局 ${endings} 个`;
        }
        case "cinematic":
          return `镜头指导 ${ctx.cinematicDirections?.length ?? 0} 个`;
        case "asset":
          return `资产 ${ctx.assetList?.length ?? 0} 项`;
        case "qa":
          return ctx.qaReport
            ? `QA 报告：${ctx.qaReport.errors ?? 0} 错误, ${ctx.qaReport.warnings ?? 0} 警告`
            : "QA 报告未生成";
        default:
          return "本阶段已完成";
      }
    };

    addMessage({
      role: "assistant",
      content: `✓ 已完成「${prevDef.label}」阶段\n\n本阶段产出：\n${formatOutputs(prevStageRef.current)}\n\n▶ 进入「${newDef.label}」阶段\n\n${newDef.sop.intro}`,
      expertId: newDef.expertId,
      expertRole: usePipelineStore.getState().getActiveExpert()?.role,
      expertAvatar: usePipelineStore.getState().getActiveExpert()?.avatar,
    });
    prevStageRef.current = currentStage;
  }, [currentStage, addMessage]);

  const [input, setInput] = useState("");
  const [showImport, setShowImport] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const chatLoopRef = useRef<AgentChatLoop | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // @提及机制 — 借鉴 AltFlow 的 @模块引用，让用户在对话中引用角色/场景/道具
  const [mentionQuery, setMentionQuery] = useState<{ query: string; startIndex: number } | null>(null);
  const [mentionIndex, setMentionIndex] = useState(0);
  const characters = useNarrativeStore((s) => s.characters);
  const scenes = useNarrativeStore((s) => s.scenes);
  const props = useNarrativeStore((s) => s.props);

  // 可提及实体列表（角色 + 场景 + 道具）
  const mentionItems = useMemo(() => [
    ...characters.map((c) => ({ id: c.id, name: c.name, type: "角色", desc: c.role, emoji: c.emoji })),
    ...scenes.map((s) => ({ id: s.id, name: s.name, type: "场景", desc: s.location, emoji: "📍" })),
    ...props.map((p) => ({ id: p.id, name: p.name, type: "道具", desc: p.description, emoji: "道具" })),
  ], [characters, scenes, props]);

  // 按查询过滤
  const filteredMentions = useMemo(() => {
    if (!mentionQuery) return [];
    const q = mentionQuery.query.toLowerCase();
    return mentionItems
      .filter((item) => item.name.toLowerCase().includes(q))
      .slice(0, 8);
  }, [mentionQuery, mentionItems]);

  // 检测输入文本中光标位置的 @提及
  const detectMention = useCallback((text: string, caretPos: number): { query: string; startIndex: number } | null => {
    const beforeCaret = text.slice(0, caretPos);
    const atIdx = beforeCaret.lastIndexOf("@");
    if (atIdx === -1) return null;
    // @ 必须在开头或前面是空白
    if (atIdx > 0 && !/\s/.test(text[atIdx - 1])) return null;
    // @ 后到光标的文本不能含空格/换行
    const query = text.slice(atIdx + 1, caretPos);
    if (query.includes(" ") || query.includes("\n")) return null;
    return { query, startIndex: atIdx };
  }, []);

  // 插入提及：把 @query 替换为 @实体名
  const insertMention = useCallback((item: { id: string; name: string }) => {
    if (!mentionQuery) return;
    const before = input.slice(0, mentionQuery.startIndex);
    const after = input.slice(mentionQuery.startIndex + 1 + mentionQuery.query.length);
    const newText = `${before}@${item.name} ${after}`;
    setInput(newText);
    setMentionQuery(null);
    setMentionIndex(0);
    const newCaretPos = before.length + item.name.length + 2;
    setTimeout(() => {
      const ta = textareaRef.current;
      if (ta) {
        ta.focus();
        ta.setSelectionRange(newCaretPos, newCaretPos);
      }
    }, 0);
  }, [mentionQuery, input]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, pendingConfirmation]);

  // 检测用户是否要切换阶段
  const checkStageAdvancement = useCallback((text: string): boolean => {
    const lower = text.toLowerCase();
    if (lower.includes("下一阶段") || lower.includes("下一步") || lower.includes("进入互动") ||
        lower.includes("进入演出") || lower.includes("进入质量") || lower.includes("进入预览") ||
        lower.includes("进入发布")) {
      const next = advance();
      if (next) {
        const stageDef = usePipelineStore.getState().getStageDef();
        addMessage({
          role: "assistant",
          content: `已进入【${stageDef.label}】阶段。\n\n${stageDef.description}。你可以开始描述你的需求，或输入"下一阶段"继续推进。`,
          expertId: stageDef.expertId,
          expertRole: usePipelineStore.getState().getActiveExpert()?.role,
          expertAvatar: usePipelineStore.getState().getActiveExpert()?.avatar,
        });
        return true;
      }
    }
    return false;
  }, [advance, addMessage]);

  // 真实 AI 调用
  const agentSendMessage = useCallback(async (userText: string) => {
    const settings = useSettingsStore.getState();
    const aiService = AIService.fromSettings({
      apiKeys: settings.apiKeys,
      aiProvider: settings.aiProvider,
      aiModelName: settings.aiModelName,
      apiBaseUrl: settings.apiBaseUrl,
    });
    const router = aiService.getRouter();

    const registry = createDefaultToolRegistry(
      () => useNarrativeStore.getState() as unknown as Record<string, unknown>
    );

    const chatLoop = new AgentChatLoop(router, registry);
    chatLoopRef.current = chatLoop;

    // 从管线 store 获取当前阶段 Expert + 上下文
    const pipeline = usePipelineStore.getState();
    const expert = pipeline.getActiveExpert();
    const stageDef = pipeline.getStageDef();
    const previousContext = pipeline.getPreviousContext();
    let hadError = false;

    const callbacks: ChatLoopCallbacks = {
      onStatusChange: (status) => setRunStatus(status),
      onStepChange: (step) => setCurrentStep(step),
      onTextDelta: (delta) => appendToLastMessage(delta),
      onToolCallStart: (toolName, args) => {
        addMessage({
          role: "tool",
          content: `调用工具: ${toolName}`,
          toolCall: { toolName, args, status: "executing" },
        });
      },
      onToolCallEnd: (_toolName, result) => {
        const msgs = useCanvasAgentStore.getState().messages;
        const lastToolMsg = [...msgs].reverse().find((m) => m.toolCall && m.toolCall.status === "executing");
        if (lastToolMsg) {
          useCanvasAgentStore.getState().updateToolResult(
            lastToolMsg.id,
            JSON.stringify(result),
            result.success ? "done" : "rejected"
          );
        }
        // 工具执行后同步 narrative store 到 pipeline context
        syncNarrativeToPipeline();
      },
      onRequestConfirmation: (description) => {
        return new Promise<boolean>((resolve) => {
          setPendingConfirmation({
            id: `conf-${Date.now().toString(36)}`,
            description,
            timestamp: new Date().toISOString(),
            ...({ __resolve: resolve } as object),
          } as unknown as Parameters<typeof setPendingConfirmation>[0]);
        });
      },
      onError: (error) => {
        hadError = true;
        setErrorMessage(error);
        // 显示错误给用户（避免静默失败 — 之前 bug：错误只存 store，UI 看不到）
        const msgs = useCanvasAgentStore.getState().messages;
        const lastMsg = msgs[msgs.length - 1];
        const errorText = `【AI 调用失败】${error}\n\n请检查：\n1. API Key 是否正确\n2. API Base URL 是否可达\n3. 网络连接 / CORS 是否正常\n\n配置路径：右上角设置 → AI 配置`;
        if (lastMsg && lastMsg.role === "assistant" && !lastMsg.content) {
          appendToLastMessage(errorText);
        } else {
          addMessage({ role: "assistant", content: errorText });
        }
      },
      onComplete: () => {
        chatLoopRef.current = null;
        // 完成后同步数据 + 检查阶段完成度
        syncNarrativeToPipeline();
        // 检查空回复（API 返回空内容但未触发 onError 的情况）
        if (!hadError) {
          const msgs = useCanvasAgentStore.getState().messages;
          const lastMsg = msgs[msgs.length - 1];
          if (lastMsg && lastMsg.role === "assistant" && !lastMsg.content) {
            appendToLastMessage("【未收到响应】AI 返回了空内容。请检查 API 配置或重试。");
          }
        }
        // 如果当前阶段产出已满足，提示用户可以进入下一阶段
        const pipeline = usePipelineStore.getState();
        if (pipeline.isStageComplete()) {
          const stageDef = pipeline.getStageDef();
          const stageIdx = pipeline.getStageIndex();
          // 只在前 6 个阶段提示（preview/release 无 expectedOutputs）
          if (stageIdx < 6) {
            setTimeout(() => {
              addMessage({
                role: "assistant",
                content: `【${stageDef.label}】阶段的核心产出已完成。\n\n输入"下一阶段"进入下一阶段，或继续当前阶段的调整。`,
                expertRole: pipeline.getActiveExpert()?.role,
                expertAvatar: pipeline.getActiveExpert()?.avatar,
              });
            }, 500);
          }
        }
      },
    };

    addMessage({
      role: "assistant",
      content: "",
      decisionStep: "generate",
      expertId: expert?.id,
      expertRole: expert?.role,
      expertAvatar: expert?.avatar,
    });

    const currentMessages = useCanvasAgentStore.getState().messages;
    const history: ChatMessage[] = currentMessages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .slice(0, -1)
      .map((m) => ({ role: m.role as "user" | "assistant", content: m.content || "" }));

    // 透传管线上下文 + 题材模式到系统提示词
    await chatLoop.sendMessage(userText, history, callbacks, {
      currentPage: "/studio",
      expert,
      pipelineStageLabel: stageDef.label,
      pipelineInstructions: stageDef.instructions,
      pipelineSop: stageDef.sop,
      pipelinePreviousContext: previousContext,
      genre: settings.genre,
      genreCustom: settings.genreCustom,
    });
  }, [addMessage, appendToLastMessage, setRunStatus, setCurrentStep, setErrorMessage, setPendingConfirmation]);

  // 演示模式
  const simulateAgentResponse = useCallback(async (userText: string) => {
    setRunStatus("thinking");
    setCurrentStep("understand");
    await delay(500);
    setRunStatus("generating");
    setCurrentStep("generate");

    const pipeline = usePipelineStore.getState();
    const expert = pipeline.getActiveExpert();

    addMessage({
      role: "assistant",
      content: "",
      decisionStep: "generate",
      expertId: expert?.id,
      expertRole: expert?.role,
      expertAvatar: expert?.avatar,
    });

    if (userText.includes("一致性") || userText.includes("检查")) {
      const store = useNarrativeStore.getState();
      const issues = runConsistencyChecks({
        storyNodes: store.storyNodes,
        nodeEdges: store.nodeEdges,
        characters: store.characters,
        props: store.props,
        variables: store.variables,
        narrativeIntents: store.narrativeIntents,
      });
      const errors = issues.filter((i) => i.severity === "error");
      const response = `一致性检查完成：

错误 ${errors.length} 项，警告 ${issues.length - errors.length} 项。

${issues.length === 0 ? "未发现问题，结构完整。" : issues.slice(0, 5).map((i, idx) => `${idx + 1}. [${i.severity}] ${i.title} — ${i.suggestion}`).join("\n")}`;
      for (let i = 0; i < response.length; i += 3) {
        appendToLastMessage(response.slice(i, i + 3));
        await delay(15);
      }
    } else if (userText.includes("路径") || userText.includes("死路")) {
      const store = useNarrativeStore.getState();
      const result = runPathTest(store.storyNodes, store.nodeEdges);
      const response = `路径分析完成：

总路径 ${result.stats.totalPaths} 条，好结局 ${result.stats.goodEndings} 条，坏结局 ${result.stats.badEndings} 条。
死路节点 ${result.deadEnds.length} 个，不可达节点 ${result.unreachableNodes.length} 个。`;
      for (let i = 0; i < response.length; i += 3) {
        appendToLastMessage(response.slice(i, i + 3));
        await delay(15);
      }
    } else {
      if (userText.includes("创建") && userText.includes("场景")) {
        const store = useNarrativeStore.getState();
        const newNode = {
          id: `N${String(Date.now()).slice(-4)}`,
          label: "新场景",
          type: "scene" as const,
          x: 300 + Math.random() * 200,
          y: 200 + Math.random() * 200,
        };
        store.addNode(newNode);
        store.rebuildPlayableGraph();
        syncNarrativeToPipeline();
      }
      const response = generateContextualResponse(userText);
      for (let i = 0; i < response.length; i += 3) {
        appendToLastMessage(response.slice(i, i + 3));
        await delay(15);
      }
    }

    await delay(200);
    setRunStatus("idle");
    setCurrentStep("");

    // 演示模式也检查阶段完成度（复用上方已声明的 pipeline）
    syncNarrativeToPipeline();
    if (pipeline.isStageComplete()) {
      const stageDef = pipeline.getStageDef();
      const stageIdx = pipeline.getStageIndex();
      if (stageIdx < 6) {
        addMessage({
          role: "assistant",
          content: `【${stageDef.label}】阶段的核心产出已完成。\n\n输入"下一阶段"进入下一阶段，或继续当前阶段的调整。`,
          expertRole: pipeline.getActiveExpert()?.role,
          expertAvatar: pipeline.getActiveExpert()?.avatar,
        });
      }
    }
  }, [addMessage, appendToLastMessage, setRunStatus, setCurrentStep]);

  const send = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed || runStatus !== "idle") return;

    // 标记入口路径（首次发送时）
    const pipeline = usePipelineStore.getState();
    if (!pipeline.entryPath) {
      setEntryPath("conversation");
    }

    // 检测阶段切换
    if (checkStageAdvancement(trimmed)) return;

    addMessage({ role: "user", content: trimmed });
    setInput("");

    const settings = useSettingsStore.getState();
    const hasApiKey =
      Object.keys(settings.apiKeys).length > 0 &&
      Object.values(settings.apiKeys).some((k) => k && k.trim() !== "");

    if (hasApiKey) {
      agentSendMessage(trimmed).catch(() => simulateAgentResponse(trimmed));
    } else {
      simulateAgentResponse(trimmed);
    }
  }, [runStatus, addMessage, agentSendMessage, simulateAgentResponse, checkStageAdvancement, setEntryPath]);

  const busy = runStatus !== "idle" && runStatus !== "error";

  // 当前阶段信息（用于轻量指示器）
  const stageDef = usePipelineStore.getState().getStageDef();

  return (
    <div className="flex h-full flex-col bg-zinc-950">
      {/* 消息列表 */}
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-3 py-4">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-sm text-zinc-600">
            <Bot className="h-10 w-10" />
            <p>和 Agent 对话开始创作</p>
            <p className="text-xs text-zinc-700">输入你的创意，或点击 + 导入剧本</p>
          </div>
        )}
        {messages.map((m) => (
          <MessageItem key={m.id} msg={m} />
        ))}
        {busy && (
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <Loader2 className="h-4 w-4 animate-spin" /> 思考中…
          </div>
        )}
        {messages.length > 0 && !busy && (
          <div className="flex justify-center pt-2">
            <button
              onClick={clearMessages}
              className="flex items-center gap-1 text-xs text-zinc-600 hover:text-zinc-400"
            >
              <RotateCcw className="h-3 w-3" /> 清空对话
            </button>
          </div>
        )}
      </div>

      {/* HITL 确认面板 */}
      <AnimatePresence>
        {pendingConfirmation && <ConfirmationPanel />}
      </AnimatePresence>

      {/* 输入框：阶段标签 + 导入 + textarea + 发送 */}
      <div className="shrink-0 border-t border-zinc-800 p-3">
        <div className="relative flex items-end gap-2 rounded-lg bg-zinc-900 p-2">
          {/* @提及下拉列表 */}
          {mentionQuery && filteredMentions.length > 0 && (
            <div className="absolute bottom-full left-0 mb-1 max-h-48 w-64 overflow-y-auto rounded-lg border border-zinc-700 bg-zinc-900 shadow-xl">
              {filteredMentions.map((item, idx) => (
                <button
                  key={item.id}
                  onClick={() => insertMention(item)}
                  className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs transition ${
                    idx === mentionIndex ? "bg-orange-500/20 text-orange-300" : "text-zinc-300 hover:bg-zinc-800"
                  }`}
                >
                  <span className="text-violet-400">@</span>
                  <span className="font-medium text-zinc-100">{item.name}</span>
                  <span className="text-zinc-500">{item.type}</span>
                </button>
              ))}
            </div>
          )}
          <button
            onClick={() => setShowImport(true)}
            className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
            title="导入剧本/素材"
          >
            <Plus className="h-4 w-4" />
          </button>
          <textarea
            ref={textareaRef}
            id="studio-chat-input"
            value={input}
            onChange={(e) => {
              const newText = e.target.value;
              setInput(newText);
              const caretPos = e.target.selectionStart ?? newText.length;
              const mention = detectMention(newText, caretPos);
              setMentionQuery(mention);
              setMentionIndex(0);
            }}
            onKeyDown={(e) => {
              // @提及键盘导航
              if (mentionQuery && filteredMentions.length > 0) {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setMentionIndex((i) => (i + 1) % filteredMentions.length);
                  return;
                }
                if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setMentionIndex((i) => (i - 1 + filteredMentions.length) % filteredMentions.length);
                  return;
                }
                if (e.key === "Enter" || e.key === "Tab") {
                  e.preventDefault();
                  insertMention(filteredMentions[mentionIndex]);
                  return;
                }
                if (e.key === "Escape") {
                  e.preventDefault();
                  setMentionQuery(null);
                  return;
                }
              }
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            rows={1}
            placeholder={`[${stageDef.label}] 输入指令…（@ 引用角色/场景/道具）`}
            className="max-h-24 flex-1 resize-none bg-transparent text-sm text-zinc-100 placeholder:text-zinc-600 outline-none"
          />
          <button
            onClick={() => send(input)}
            disabled={!input.trim() || busy}
            className="rounded-md bg-orange-500 p-2 text-white disabled:opacity-40 hover:bg-orange-400"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 导入面板（模态） */}
      <AnimatePresence>
        {showImport && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="relative max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-950">
              <button
                onClick={() => setShowImport(false)}
                className="absolute right-3 top-3 z-10 rounded-md p-1 text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300"
              >
                <X className="h-4 w-4" />
              </button>
              <ImportPanel
                onClose={() => setShowImport(false)}
                onImported={() => {
                  // 仅在真正导入成功后执行：标记入口路径 + 同步数据 + 发送提示消息
                  setEntryPath("import");
                  syncNarrativeToPipeline();
                  const store = useNarrativeStore.getState();
                  const pipeline = usePipelineStore.getState();
                  const assetList = pipeline.context.assetList ?? [];
                  if (store.storyNodes.length > 0) {
                    addMessage({
                      role: "assistant",
                      content: `导入完成！已解析出 ${store.storyNodes.length} 个节点、${store.characters.length} 个角色。\n\n你可以让我基于这些节点总结故事大纲，或直接输入"下一阶段"进入叙事构建。`,
                      expertRole: pipeline.getActiveExpert()?.role,
                      expertAvatar: pipeline.getActiveExpert()?.avatar,
                    });
                  } else if (assetList.length > 0) {
                    const latest = assetList[assetList.length - 1];
                    const typeLabel = { image: "图片", audio: "音频", video: "视频", ui: "UI模板", script: "剧本" }[latest.type] ?? latest.type;
                    addMessage({
                      role: "assistant",
                      content: `资产导入成功！\n\n📄 ${latest.fileName}（${typeLabel}）\n\n已添加到资产中心。你可以继续导入更多资产，或输入"下一阶段"继续创作。`,
                      expertRole: pipeline.getActiveExpert()?.role,
                      expertAvatar: pipeline.getActiveExpert()?.avatar,
                    });
                  }
                }}
              />
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
