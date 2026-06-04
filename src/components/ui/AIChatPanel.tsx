"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare, X, Send, Sparkles, Bot, User, Loader2,
  ArrowRight, Lightbulb, Zap, Target, FileText,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useUIStore, useNarrativeStore, getCurrentProject, useSettingsStore } from "@/store";
import { AIService } from "@/lib/ai";

const S = {
  bg: "#FAFBFF", card: "#FFFFFF", s2: "#F4F6FC",
  border: "#E2E5F0", primary: "#5E50E8", accent: "#00A99D",
  text: "#1A1D2E", text2: "#4A5068", text3: "#8892B0",
  success: "#059669", warning: "#D97706", error: "#DC2626",
};

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  actions?: { label: string; href?: string; onClick?: string }[];
  timestamp: number;
}

// 意图识别关键词映射
const INTENT_MAP: { keywords: string[]; action: string; href: string; icon: typeof Sparkles }[] = [
  { keywords: ["角色", "人物", "设定角色", "新角色"], action: "角色管理", href: "/parse", icon: User },
  { keywords: ["场景", "地点", "环境"], action: "场景管理", href: "/parse", icon: Target },
  { keywords: ["节点", "分支", "路线", "路径"], action: "节点设计", href: "/nodes", icon: Zap },
  { keywords: ["剧本", "故事", "大纲", "续写", "对白"], action: "剧本编辑", href: "/script", icon: FileText },
  { keywords: ["资产", "图片", "音频", "视频", "素材"], action: "资产管理", href: "/assets", icon: Sparkles },
  { keywords: ["互动", "选择", "变量", "条件"], action: "互动设计", href: "/interaction", icon: Zap },
  { keywords: ["演出", "镜头", "分镜", "节奏"], action: "演出设计", href: "/cinematic", icon: Target },
  { keywords: ["预览", "测试", "试玩"], action: "预览测试", href: "/simulator", icon: Sparkles },
  { keywords: ["总览", "进度", "健康", "报告"], action: "项目总览", href: "/overview", icon: Target },
  { keywords: ["检查", "一致性", "质量"], action: "质量检查", href: "/overview", icon: Target },
];

const SUGGESTIONS = [
  "分析我的项目当前进度",
  "帮我添加一个新的角色设定",
  "检查故事一致性",
  "建议下一步该做什么",
];

export default function AIChatPanel() {
  const router = useRouter();
  const aiChatOpen = useUIStore(s => s.aiChatOpen);
  const toggleAiChat = useUIStore(s => s.toggleAiChat);
  const addToast = useUIStore(s => s.addToast);
  const projectName = getCurrentProject()?.title ?? "当前项目";
  const characters = useNarrativeStore(s => s.characters);
  const storyNodes = useNarrativeStore(s => s.storyNodes);
  const scenes = useNarrativeStore(s => s.scenes);
  const apiKeys = useSettingsStore(s => s.apiKeys);
  const aiModel = useSettingsStore(s => s.aiModel);
  const apiBaseUrl = useSettingsStore(s => s.apiBaseUrl);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `你好！我是逐梦 AI 助手。你可以用自然语言告诉我你想做什么，比如"帮我添加一个新角色"或"分析项目进度"。`,
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when panel opens
  useEffect(() => {
    if (aiChatOpen) setTimeout(() => inputRef.current?.focus(), 300);
  }, [aiChatOpen]);

  // Keyboard shortcut: Cmd+L to toggle
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "l") {
        e.preventDefault();
        toggleAiChat();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [toggleAiChat]);

  // 本地意图识别（无需 API 也能工作）
  const detectIntent = useCallback((text: string) => {
    const lower = text.toLowerCase();
    for (const intent of INTENT_MAP) {
      if (intent.keywords.some(kw => lower.includes(kw))) {
        return intent;
      }
    }
    return null;
  }, []);

  // 生成项目摘要（本地）
  const generateLocalSummary = useCallback(() => {
    const charCount = characters.length;
    const nodeCount = storyNodes.length;
    const sceneCount = scenes.length;
    const endingCount = storyNodes.filter(n => n.type === "ending_good" || n.type === "ending_bad").length;

    return `📊 **${projectName}** 当前状态：\n\n• ${charCount} 个角色\n• ${sceneCount} 个场景\n• ${nodeCount} 个故事节点\n• ${endingCount} 个结局\n\n${
      charCount < 3 ? "⚠️ 角色偏少，建议添加更多角色丰富故事。\n" : "✅ 角色数量充足。\n"
    }${
      nodeCount < 5 ? "⚠️ 节点偏少，建议设计更多故事分支。\n" : "✅ 节点结构较完整。\n"
    }${
      endingCount < 2 ? "⚠️ 结局不足，互动叙事建议至少 2 个结局。\n" : "✅ 结局设计合理。\n"
    }\n💡 **建议下一步**：${
      charCount < 3 ? "前往解构页添加角色" :
      nodeCount < 5 ? "前往节点页设计分支" :
      endingCount < 2 ? "添加更多结局节点" :
      "进入资产生成阶段"
    }`;
  }, [projectName, characters, storyNodes, scenes]);

  // 发送消息
  const handleSend = useCallback(async (text?: string) => {
    const msg = text ?? input.trim();
    if (!msg || isLoading) return;

    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: "user", content: msg, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    // 本地意图识别
    const intent = detectIntent(msg);
    const lower = msg.toLowerCase();

    // 特殊命令处理
    if (lower.includes("进度") || lower.includes("分析") || lower.includes("状态") || lower.includes("报告")) {
      const summary = generateLocalSummary();
      setMessages(prev => [...prev, {
        id: `a-${Date.now()}`,
        role: "assistant",
        content: summary,
        actions: [
          { label: "查看总览", href: "/overview" },
          { label: "节点设计", href: "/nodes" },
        ],
        timestamp: Date.now(),
      }]);
      setIsLoading(false);
      return;
    }

    if (lower.includes("下一步") || lower.includes("建议")) {
      const suggestions = [
        "1. 完善角色设定 → 前往解构页",
        "2. 设计故事节点图 → 前往节点页",
        "3. 添加互动分支 → 前往互动设计",
        "4. 配置演出镜头 → 前往演出设计",
        "5. 生成多模态资产 → 前往资产页",
      ];
      setMessages(prev => [...prev, {
        id: `a-${Date.now()}`,
        role: "assistant",
        content: `💡 **推荐工作流顺序**：\n\n${suggestions.join("\n")}\n\n根据你的项目进度，建议先完成前序步骤再进入下一阶段。`,
        actions: [
          { label: "查看管线", href: "/pipeline" },
        ],
        timestamp: Date.now(),
      }]);
      setIsLoading(false);
      return;
    }

    if (intent) {
      setMessages(prev => [...prev, {
        id: `a-${Date.now()}`,
        role: "assistant",
        content: `我理解你想要进行 **${intent.action}**。我已为你定位到对应页面，点击下方按钮即可跳转。\n\n如果你需要 AI 自动生成内容，请确保已在设置中配置 API Key。`,
        actions: [{ label: `前往${intent.action}`, href: intent.href }],
        timestamp: Date.now(),
      }]);
      setIsLoading(false);
      return;
    }

    // 尝试调用 AI API
    const hasApiKey = apiKeys[aiModel];
    if (hasApiKey) {
      try {
        const service = AIService.fromSettings({ apiKeys, aiModel, apiBaseUrl });
        const response = await service.complete(
          "你是逐梦 Creator Studio 的 AI 互动叙事设计助手。请用中文回答，简洁专业。",
          msg
        );
        setMessages(prev => [...prev, {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: response.success ? (response.data ?? "抱歉，我没有理解你的请求。") : `AI 返回错误: ${response.error}`,
          timestamp: Date.now(),
        }]);
      } catch {
        setMessages(prev => [...prev, {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: "AI 服务暂时不可用。你可以告诉我具体想做什么，我会帮你导航到对应页面。",
          timestamp: Date.now(),
        }]);
      }
    } else {
      setMessages(prev => [...prev, {
        id: `a-${Date.now()}`,
        role: "assistant",
        content: "我目前可以根据关键词帮你导航到对应页面。\n\n如需 AI 深度交互（剧本续写、一致性检查等），请先在 **设置 → API 密钥** 中配置你的 API Key。",
        actions: [{ label: "前往设置", href: "/settings" }],
        timestamp: Date.now(),
      }]);
    }
    setIsLoading(false);
  }, [input, isLoading, detectIntent, generateLocalSummary, apiKeys, aiModel, apiBaseUrl]);

  return (
    <AnimatePresence>
      {aiChatOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={toggleAiChat}
            className="fixed inset-0 z-40"
            style={{ background: "rgba(0,0,0,0.15)" }}
          />
          {/* Panel */}
          <motion.div
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 bottom-0 z-50 flex flex-col"
            style={{ width: 400, background: S.bg, borderLeft: `1px solid ${S.border}`, boxShadow: "-4px 0 24px rgba(0,0,0,0.08)" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 shrink-0" style={{ borderBottom: `1px solid ${S.border}`, background: S.card }}>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: `${S.primary}15` }}>
                  <Bot size={14} style={{ color: S.primary }} />
                </div>
                <div>
                  <h3 className="text-xs font-bold" style={{ color: S.text }}>AI 制作助手</h3>
                  <p className="text-[8px]" style={{ color: S.text3 }}>Cmd+L 快捷切换</p>
                </div>
              </div>
              <motion.button whileTap={{ scale: 0.9 }} onClick={toggleAiChat}
                className="p-1.5 rounded-lg focus:outline-none" style={{ color: S.text3 }}>
                <X size={14} />
              </motion.button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {messages.map(msg => (
                <motion.div key={msg.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                  {/* Avatar */}
                  <div className="w-6 h-6 rounded-lg shrink-0 flex items-center justify-center"
                    style={{ background: msg.role === "user" ? `${S.accent}15` : `${S.primary}15` }}>
                    {msg.role === "user" ? <User size={11} style={{ color: S.accent }} /> : <Bot size={11} style={{ color: S.primary }} />}
                  </div>
                  {/* Content */}
                  <div className={`max-w-[85%] rounded-xl px-3 py-2.5 ${msg.role === "user" ? "" : ""}`}
                    style={{
                      background: msg.role === "user" ? `${S.accent}08` : S.card,
                      border: `1px solid ${msg.role === "user" ? `${S.accent}20` : S.border}`,
                    }}>
                    <p className="text-[10px] leading-relaxed whitespace-pre-wrap" style={{ color: S.text }}>{msg.content}</p>
                    {/* Action buttons */}
                    {msg.actions && msg.actions.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {msg.actions.map((action, i) => (
                          <motion.button key={i} whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              if (action.href) { router.push(action.href); toggleAiChat(); }
                            }}
                            className="text-[9px] px-2.5 py-1 rounded-lg font-bold focus:outline-none flex items-center gap-1"
                            style={{ background: `${S.primary}10`, color: S.primary, border: `1px solid ${S.primary}25` }}>
                            {action.label} <ArrowRight size={8} />
                          </motion.button>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <div className="flex gap-2.5">
                  <div className="w-6 h-6 rounded-lg shrink-0 flex items-center justify-center" style={{ background: `${S.primary}15` }}>
                    <Bot size={11} style={{ color: S.primary }} />
                  </div>
                  <div className="rounded-xl px-3 py-2.5" style={{ background: S.card, border: `1px solid ${S.border}` }}>
                    <Loader2 size={12} className="animate-spin" style={{ color: S.primary }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Suggestions */}
            {messages.length <= 2 && (
              <div className="px-4 py-2 shrink-0" style={{ borderTop: `1px solid ${S.border}` }}>
                <div className="flex items-center gap-1.5 mb-2">
                  <Lightbulb size={10} style={{ color: S.warning }} />
                  <span className="text-[8px] font-bold uppercase tracking-wider" style={{ color: S.text3 }}>试试这些</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {SUGGESTIONS.map((s, i) => (
                    <motion.button key={i} whileTap={{ scale: 0.95 }}
                      onClick={() => handleSend(s)}
                      className="text-[9px] px-2.5 py-1 rounded-full font-medium focus:outline-none"
                      style={{ background: S.s2, color: S.text2, border: `1px solid ${S.border}` }}>
                      {s}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="shrink-0 p-3" style={{ borderTop: `1px solid ${S.border}`, background: S.card }}>
              <div className="flex items-center gap-2 rounded-xl px-3 py-2"
                style={{ background: S.s2, border: `1px solid ${S.border}` }}>
                <MessageSquare size={12} style={{ color: S.text3 }} />
                <input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder="告诉我你想做什么..."
                  className="flex-1 text-[10px] bg-transparent focus:outline-none"
                  style={{ color: S.text }}
                />
                <motion.button whileTap={{ scale: 0.9 }}
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isLoading}
                  className="p-1.5 rounded-lg focus:outline-none"
                  style={{ background: input.trim() ? S.primary : S.s2, color: input.trim() ? "#fff" : S.text3 }}>
                  <Send size={10} />
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
