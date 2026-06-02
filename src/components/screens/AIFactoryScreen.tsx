"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Send, CheckCircle2, Loader2, Circle, User, Bot, ChevronRight, Tag } from "lucide-react";
import Link from "next/link";

const S = {
  bg:"#FAFBFF", card:"#FFFFFF", s2:"#F4F6FC", s3:"#EDF0F8",
  border:"#E2E5F0", border2:"#CBD0E5",
  primary:"#5E50E8", accent:"#00A99D",
  text:"#1A1D2E", text2:"#4A5068", text3:"#8892B0",
  success:"#059669", warning:"#D97706", error:"#DC2626",
};

const TABS = ["全部","场景","角色","道具","节点","变量"];

const STEPS = [
  { n:1, label:"提取故事结构大纲",  agent:"StoryManager",    status:"done",    result:"赛博都市·追踪任务·三条分支路线·2个结局" },
  { n:2, label:"提炼角色性格画像",  agent:"PersonaAgent",    status:"done",    result:"艾拉 / 线人 / 反派主管 · 3位角色完成" },
  { n:3, label:"关联场景与视觉提示词",agent:"SceneVisualist", status:"running", result:undefined },
  { n:4, label:"部署道具及逻辑变量", agent:"PropTracker",    status:"pending", result:undefined },
  { n:5, label:"生成互动节点(DAG)", agent:"FlowPlanner",     status:"pending", result:undefined },
  { n:6, label:"生成选择项与变量",  agent:"ChoiceBuilder",   status:"pending", result:undefined },
  { n:7, label:"生成结局系统",      agent:"EndingWeaver",    status:"pending", result:undefined },
  { n:8, label:"逻辑连通性检查",    agent:"LogicChecker",    status:"pending", result:undefined },
  { n:9, label:"生成素材需求清单",  agent:"AssetPlanner",    status:"pending", result:undefined },
  { n:10,label:"发布前完整校验",    agent:"PublishGuard",    status:"pending", result:undefined },
];

const MESSAGES = [
  { role:"ai",  text:"已分析剧本「幽灵协议」，检测到 1章·8场·4角色·6场景·9道具。建议使用「互动改编」模式，自动识别关键决策点。" },
  { role:"user",text:"好的，按推荐流程开始" },
  { role:"ai",  text:"正在执行第3步——关联场景与视觉提示词。SceneVisualist 正在分析每个场景的光线、色调和氛围特征，预计完成时间：约30秒。" },
];

function StepDot({ status }: { status: string }) {
  if (status === "done")    return <CheckCircle2 size={20} color={S.success} />;
  if (status === "running") return <Loader2 size={20} color={S.primary} className="animate-spin" />;
  return <Circle size={20} color={S.border2} />;
}

export default function AIFactoryScreen() {
  const [activeTab, setActiveTab] = useState("全部");
  const [msgInput, setMsgInput] = useState("");

  return (
    <div className="h-svh flex flex-col" style={{ background: S.bg }}>

      {/* 顶部面包屑 */}
      <div className="flex items-center justify-between px-4 py-2.5"
        style={{ background: S.card, borderBottom:`1px solid ${S.border}` }}>
        <div className="flex items-center gap-2">
          <Link href="/">
            <motion.button whileTap={{ scale:0.95 }} className="flex items-center gap-1 text-xs font-medium focus:outline-none"
              style={{ color: S.primary }}>
              <ChevronLeft size={14} /> 返回
            </motion.button>
          </Link>
          <span style={{ color: S.border2 }}>›</span>
          <span className="text-xs" style={{ color: S.text2 }}>幽灵协议</span>
          <span style={{ color: S.border2 }}>›</span>
          <span className="text-xs font-bold" style={{ color: S.text }}>AI 智能工厂</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-mono px-2 py-0.5 rounded"
            style={{ background: S.s2, border:`1px solid ${S.border}`, color: S.text3 }}>
            CHATGPT-4O + MIDJOURNEY V6
          </span>
        </div>
      </div>

      {/* 主体：左右两栏 */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── 左侧：Agent 对话面板 ── */}
        <div className="w-[38%] min-w-0 flex flex-col border-r" style={{ borderColor: S.border, background: S.card }}>

          {/* 文件信息 */}
          <div className="px-4 py-3 border-b" style={{ borderColor: S.border }}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] uppercase tracking-wider font-bold" style={{ color: S.text3 }}>项目原始数据源</span>
              <motion.button whileTap={{ scale:0.96 }}
                className="text-[9px] font-bold px-2 py-0.5 rounded focus:outline-none"
                style={{ background:`${S.primary}10`, color:S.primary, border:`1px solid ${S.primary}20` }}>
                更换
              </motion.button>
            </div>
            <p className="text-xs font-bold" style={{ color: S.text }}>True_Believer_Lorraine_V4.txt</p>
            <p className="text-[10px]" style={{ color: S.accent }}>85KB · 24场 · 4角色 · 6场景 · 9道具</p>
          </div>

          {/* 制作模式 */}
          <div className="px-4 py-2.5 border-b" style={{ borderColor: S.border }}>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg"
              style={{ background:`${S.primary}08`, border:`1px solid ${S.primary}20` }}>
              <CheckCircle2 size={13} color={S.primary} />
              <div>
                <span className="text-[10px] font-bold block" style={{ color: S.text }}>互动改编模式 — 已锁定</span>
                <span className="text-[9px]" style={{ color: S.text3 }}>自动识别关键决策点，生成分支节点</span>
              </div>
            </div>
          </div>

          {/* Agent 对话标题 */}
          <div className="px-4 py-2 border-b flex items-center gap-1.5" style={{ borderColor: S.border }}>
            <Bot size={13} color={S.primary} />
            <span className="text-xs font-bold" style={{ color: S.text }}>AI 项目导演</span>
          </div>

          {/* 消息列表 */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {MESSAGES.map((msg, i) => (
              <motion.div key={i} initial={{ opacity:0, y:4 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.05 }}
                className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: msg.role === "ai" ? `${S.primary}15` : S.s2 }}>
                  {msg.role === "ai"
                    ? <Bot size={11} color={S.primary} />
                    : <User size={11} color={S.text3} />}
                </div>
                <div className="max-w-[80%] px-3 py-2 rounded-xl text-[11px] leading-relaxed"
                  style={{
                    background: msg.role === "ai" ? S.s2 : `${S.primary}12`,
                    color: S.text2,
                    border: `1px solid ${msg.role === "ai" ? S.border : `${S.primary}20`}`,
                  }}>
                  {msg.text}
                </div>
              </motion.div>
            ))}
            {/* AI 正在思考 */}
            <div className="flex gap-2">
              <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                style={{ background:`${S.primary}15` }}>
                <Bot size={11} color={S.primary} />
              </div>
              <div className="px-3 py-2 rounded-xl flex items-center gap-1"
                style={{ background: S.s2, border:`1px solid ${S.border}` }}>
                {[0,1,2].map(j => (
                  <motion.div key={j} className="w-1 h-1 rounded-full"
                    style={{ background: S.primary }}
                    animate={{ opacity:[0.3,1,0.3] }}
                    transition={{ duration:1, repeat:Infinity, delay:j*0.2 }} />
                ))}
              </div>
            </div>
          </div>

          {/* 输入框 */}
          <div className="px-4 py-3 border-t" style={{ borderColor: S.border }}>
            <div className="flex gap-2 items-center rounded-xl px-3 py-2"
              style={{ background: S.s2, border:`1.5px solid ${msgInput ? S.primary : S.border}` }}>
              <input value={msgInput} onChange={e => setMsgInput(e.target.value)}
                placeholder="向 AI 导演提问或下指令…"
                className="flex-1 text-xs bg-transparent focus:outline-none"
                style={{ color: S.text }} />
              <motion.button whileTap={{ scale:0.9 }} className="focus:outline-none">
                <Send size={13} color={msgInput ? S.primary : S.text3} />
              </motion.button>
            </div>
          </div>
        </div>

        {/* ── 右侧：流水线可视化 ── */}
        <div className="flex-1 flex flex-col min-w-0" style={{ background: S.s2 }}>

          {/* 资产类型快切 Tab */}
          <div className="px-4 py-2.5 border-b flex items-center gap-2 overflow-x-auto"
            style={{ borderColor: S.border, background: S.card }}>
            {TABS.map(tab => (
              <motion.button key={tab} whileTap={{ scale:0.96 }}
                onClick={() => setActiveTab(tab)}
                className="shrink-0 px-3 py-1 rounded-full text-xs font-bold focus:outline-none transition-colors"
                style={{
                  background: activeTab === tab ? S.primary : "transparent",
                  color: activeTab === tab ? "#fff" : S.text3,
                  border: activeTab === tab ? "none" : `1px solid ${S.border}`,
                }}>
                {tab}
              </motion.button>
            ))}
          </div>

          {/* 流水线标题 */}
          <div className="px-4 py-2.5 border-b" style={{ borderColor: S.border, background: S.card }}>
            <h3 className="text-xs font-extrabold uppercase tracking-widest" style={{ color: S.text3 }}>
              10阶段多智能体协作流（CONVEYOR PIPELINE）
            </h3>
          </div>

          {/* 流水线步骤 */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
            {STEPS.map((step, i) => (
              <motion.div key={i}
                initial={{ opacity:0, x:4 }} animate={{ opacity:1, x:0 }}
                transition={{ delay:i*0.03 }}
                className="rounded-xl p-3"
                style={{
                  background: step.status === "running" ? `${S.primary}06` : S.card,
                  border:`1px solid ${step.status === "done" ? `${S.success}30` : step.status === "running" ? `${S.primary}40` : S.border}`,
                  opacity: step.status === "pending" ? 0.55 : 1,
                }}>
                <div className="flex items-start gap-3">
                  <StepDot status={step.status} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold" style={{ color: step.status === "pending" ? S.text3 : S.text }}>
                        {step.n}. {step.label}
                      </span>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded ml-2 shrink-0"
                        style={{
                          background: step.status === "done" ? `${S.success}12` : step.status === "running" ? `${S.primary}12` : S.s2,
                          color: step.status === "done" ? S.success : step.status === "running" ? S.primary : S.text3,
                        }}>
                        {step.status === "done" ? "DONE" : step.status === "running" ? "RUNNING" : "PENDING"}
                      </span>
                    </div>
                    <span className="text-[10px]" style={{ color: S.text3 }}>{step.agent}</span>

                    {/* 产物卡片 */}
                    {step.result && (
                      <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:"auto" }}
                        className="mt-2 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5"
                        style={{ background: S.s2, border:`1px solid ${S.border}` }}>
                        <Tag size={9} color={S.accent} />
                        <span className="text-[10px]" style={{ color: S.text2 }}>{step.result}</span>
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* 底部操作栏 */}
          <div className="px-4 py-3 border-t flex items-center gap-2"
            style={{ borderColor: S.border, background: S.card }}>
            <motion.button whileTap={{ scale:0.97 }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white focus:outline-none"
              style={{ background: S.primary, boxShadow:`0 2px 8px ${S.primary}30` }}>
              ▶ 继续执行
            </motion.button>
            <motion.button whileTap={{ scale:0.97 }}
              className="px-3 py-2 rounded-lg text-xs font-medium focus:outline-none"
              style={{ background: S.s2, border:`1px solid ${S.border}`, color: S.text2 }}>
              ↺ 重新生成
            </motion.button>
            <div className="flex-1" />
            <Link href="/canvas">
              <motion.button whileTap={{ scale:0.97 }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold focus:outline-none"
                style={{ background:`${S.accent}15`, border:`1px solid ${S.accent}30`, color: S.accent }}>
                ✓ 应用到工作台 <ChevronRight size={11} />
              </motion.button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
