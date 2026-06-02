"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, XCircle, Eye, Loader2, Send, ArrowRight, RotateCcw,
  User, MapPin, Package, GitBranch, Sliders, FileText,
  Network, CheckSquare, List, Rocket, Shield, AlertTriangle, Lightbulb
} from "lucide-react";
import { useRouter } from "next/navigation";
import { WORLD_RULES, WorldRule, WorldRuleType, GAME_CHARACTERS, GAME_SCENES } from "@/lib/studio-data";

const S = {
  bg:"#FAFBFF", card:"#FFFFFF", s2:"#F4F6FC",
  border:"#E2E5F0", border2:"#CBD0E5",
  primary:"#5E50E8", accent:"#00A99D",
  text:"#1A1D2E", text2:"#4A5068", text3:"#8892B0",
  success:"#059669", warning:"#D97706", error:"#DC2626",
};

// -- 用户友好状态文本 ----------------------------------------------------------
const STATUS_TEXT: Record<string, string> = {
  done: '已完成',
  running: 'AI 处理中...',
  pending: '等待中',
  failed: '处理失败',
};

// -- 步骤用户友好描述（弱化 agent 技术名） --------------------------------------
const STEP_DESC: Record<number, string> = {
  1: '故事大纲提取完成',
  2: '角色设定提取完成',
  3: '正在分析场景空间与氛围特征',
  4: '等待场景设定完成',
  5: '等待道具设定完成',
  6: '等待节点图完成',
  7: '等待选择项完成',
  8: '等待结局系统完成',
  9: '等待逻辑检查完成',
  10: '等待所有步骤完成',
};

// -- 世界规则类型配色 ----------------------------------------------------------
const RULE_TYPE_CFG: Record<WorldRuleType, { color: string; label: string }> = {
  setting:              { color: S.primary, label: '背景设定' },
  character_constraint: { color: S.accent,  label: '角色约束' },
  permanent_rule:       { color: S.warning, label: '永久规则' },
  narrative_taboo:      { color: S.error,   label: '叙事禁忌' },
  tension_check:        { color: '#6366F1', label: '张力校验' },
};

// -- 10步定义 -----------------------------------------------------------------
const STEPS = [
  { n:1,  label:"提取故事大纲",     agent:"StoryAgent",   status:"done"    as const, icon: FileText   },
  { n:2,  label:"提炼角色设定",     agent:"PersonaAgent", status:"done"    as const, icon: User       },
  { n:3,  label:"提取场景设定",     agent:"SceneAgent",   status:"running" as const, icon: MapPin     },
  { n:4,  label:"提取道具设定",     agent:"PropAgent",    status:"pending" as const, icon: Package    },
  { n:5,  label:"生成互动节点图",   agent:"FlowAgent",    status:"pending" as const, icon: GitBranch  },
  { n:6,  label:"生成选择项与变量", agent:"ChoiceAgent",  status:"pending" as const, icon: Sliders    },
  { n:7,  label:"生成多结局系统",   agent:"EndingAgent",  status:"pending" as const, icon: Network    },
  { n:8,  label:"逻辑连通性检查",   agent:"LogicAgent",   status:"pending" as const, icon: CheckSquare},
  { n:9,  label:"生成素材需求清单", agent:"AssetAgent",   status:"pending" as const, icon: List       },
  { n:10, label:"发布前完整校验",   agent:"PublishAgent", status:"pending" as const, icon: Rocket     },
];

// -- 各步骤产物数据 ----------------------------------------------------------
type ArtifactItem = { label:string; value:string; sub?:string };
const ARTIFACTS: Record<number, { heading:string; summary:string; items: ArtifactItem[] }> = {
  1: {
    heading:"故事大纲",
    summary:"已从剧本中提炼出主线框架、核心冲突与2条分支路线。",
    items:[
      { label:"主线标题",  value:"幽灵协议：追击指令",            sub:"赛博朋克·间谍惊悚" },
      { label:"核心冲突",  value:"线人出卖·身份暴露·真相追踪",     sub:"3个主要冲突节点" },
      { label:"章节结构",  value:"第一章 渗透行动（共8场）",        sub:"线性→分支" },
      { label:"分支路线",  value:"主线A：地下酒吧 / 主线B：天台追踪" },
      { label:"结局数量",  value:"2个结局（幽灵归来 / 今夜失败）",  sub:"均可达" },
    ],
  },
  2: {
    heading:"角色设定",
    summary:"已提炼3位核心角色的性格、外貌与关系网络。",
    items:[
      { label:"艾拉",     value:"女主·侦探·黑色短发·银色义眼",    sub:"出现11节点 · 主角" },
      { label:"线人",     value:"神秘男性·中年·隐藏身份",          sub:"出现4节点 · 关键NPC" },
      { label:"反派主管", value:"西装·冷峻·幕后操控者",             sub:"出现3节点 · 反派" },
      { label:"核心变量", value:"trust_lineman · stress · truth",   sub:"关联角色行为" },
    ],
  },
  3: {
    heading:"场景设定",
    summary:"SceneAgent 正在分析6个场景的空间结构、光线与氛围特征……",
    items:[
      { label:"霓虹街道", value:"赛博都市夜晚·积水路面·广告牌投影", sub:"主要场景·出现5节点" },
      { label:"地下酒吧", value:"昏暗灯光·嘈杂人群·秘密交易地点",  sub:"关键场景·出现3节点" },
      { label:"天台",     value:"城市制高点·强风·俯视整个都市",     sub:"对抗场景·出现2节点" },
    ],
  },
  4: {
    heading:"道具设定",
    summary:"等待场景设定完成后，PropAgent 将提取关键道具与变量绑定关系。",
    items:[
      { label:"追踪芯片", value:"待提取", sub:"影响3节点" },
      { label:"变声器",   value:"待提取", sub:"影响2节点" },
      { label:"加密硬盘", value:"待提取", sub:"影响5节点" },
    ],
  },
  5: { heading:"互动节点图", summary:"等待道具设定完成后，FlowAgent 将生成完整DAG节点图。", items:[] },
  6: { heading:"选择项与变量", summary:"等待节点图完成后，ChoiceAgent 将生成玩家选项与变量定义。", items:[] },
  7: { heading:"多结局系统", summary:"等待选择项完成后，EndingAgent 将生成结局触发条件。", items:[] },
  8: { heading:"逻辑连通性检查", summary:"等待结局系统完成后，LogicAgent 将检查所有路径连通性。", items:[] },
  9: { heading:"素材需求清单", summary:"等待逻辑检查完成后，AssetAgent 将生成各节点素材需求。", items:[] },
  10: { heading:"发布前完整校验", summary:"等待所有步骤完成后，PublishAgent 将执行最终校验。", items:[] },
};

// -- Agent 初始消息 ------------------------------------------------------------
const INIT_MSGS = [
  { role:"ai" as const,   text:"已分析剧本「幽灵协议」，检测到 1章·8场·4角色·6场景·9道具。建议使用「互动改编」模式。" },
  { role:"user" as const, text:"好的，按推荐流程开始" },
  { role:"ai" as const,   text:"✓ 前两步已完成。正在执行第3步——提取场景设定，分析光线·色调·氛围特征，预计约30秒。" },
];

// -- 右侧产物渲染 --------------------------------------------------------------
function StepArtifact({ stepN, reviewItems, onApprove, onReject, reviewMode }: { 
  stepN: number; 
  reviewItems?: Record<string, "approved" | "rejected" | "pending">;
  onApprove?: (key: string) => void;
  onReject?: (key: string) => void;
  reviewMode?: boolean;
}) {
  const step = STEPS.find(s => s.n === stepN)!;
  const art  = ARTIFACTS[stepN];

  if (step.status === "pending") return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6">
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
        style={{ background: S.s2 }}>
        <step.icon size={20} style={{ color: S.border2 }} />
      </div>
      <div className="text-center">
        <p className="text-xs font-bold" style={{ color: S.text3 }}>{art.heading}</p>
        <p className="text-[10px] mt-1 leading-relaxed max-w-[200px]" style={{ color: S.text3 }}>等待前序步骤</p>
        <p className="text-[9px] mt-1" style={{ color: S.text3 }}>⏳ {STATUS_TEXT.pending}</p>
      </div>
    </div>
  );

  if (step.status === "running") return (
    <div className="flex-1 flex flex-col p-4 gap-4">
      {/* Running header */}
      <div className="p-3 rounded-xl flex items-center gap-3"
        style={{ background:`${S.primary}06`, border:`1px solid ${S.primary}30` }}>
        <Loader2 size={16} color={S.primary} className="animate-spin shrink-0" />
        <div>
          <p className="text-xs font-bold" style={{ color: S.primary }}>
            AI 处理中...
          </p>
          <p className="text-[9px]" style={{ color: S.text3 }}>{STEP_DESC[stepN]}</p>
        </div>
      </div>
      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-[9px]" style={{ color: S.text3 }}>
          <span>分析进度</span>
          <span style={{ color: S.primary }}>进行中</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: S.s2 }}>
          <motion.div className="h-full rounded-full" style={{ background: S.primary }}
            animate={{ width:["15%","55%","30%","70%"] }}
            transition={{ duration:3, repeat:Infinity, ease:"easeInOut" }} />
        </div>
      </div>
      {/* 已部分提取的产物（预览态） */}
      {art.items.length > 0 && (
        <div>
          <p className="text-[9px] font-bold mb-2 uppercase tracking-wider" style={{ color: S.text3 }}>
            已提取（预览）
          </p>
          <div className="space-y-1.5">
            {art.items.map((item, i) => (
              <motion.div key={i} initial={{ opacity:0, x:4 }} animate={{ opacity:1, x:0 }}
                transition={{ delay: i * 0.08 }}
                className="flex items-start gap-2 p-2.5 rounded-xl"
                style={{ background: S.card, border:`1px solid ${S.border}` }}>
                <div className="w-1.5 h-1.5 rounded-full mt-1 shrink-0" style={{ background: S.accent }} />
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-bold block" style={{ color: S.text }}>{item.label}</span>
                  <span className="text-[9px]" style={{ color: S.text2 }}>{item.value}</span>
                  {item.sub && <span className="text-[8px] block" style={{ color: S.text3 }}>{item.sub}</span>}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // done
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      {/* Done header */}
      <div className="p-3 rounded-xl flex items-center gap-2.5"
        style={{ background:`${S.success}08`, border:`1px solid ${S.success}25` }}>
        <CheckCircle2 size={15} color={S.success} className="shrink-0" />
        <div className="flex-1">
          <p className="text-xs font-bold" style={{ color: S.success }}>已完成：{art.heading}</p>
          <p className="text-[9px]" style={{ color: S.text3 }}>{art.summary}</p>
        </div>
        <motion.button whileTap={{ scale: 0.95 }}
          className="flex items-center gap-1 px-2 py-1 rounded text-[8px] font-bold shrink-0 focus:outline-none"
          style={{ background: `${S.success}10`, color: S.success, border: `1px solid ${S.success}25` }}>
          <Eye size={9} /> 查看产物
        </motion.button>
      </div>
      {/* Review mode banner */}
      {reviewMode && art.items.length > 0 && (
        <div className="p-2.5 rounded-xl flex items-center justify-between"
          style={{ background: `${S.primary}06`, border: `1px solid ${S.primary}20` }}>
          <span className="text-[9px] font-bold" style={{ color: S.primary }}>
            🔍 审核模式 — 逐条确认 AI 产出
          </span>
          <span className="text-[8px] font-mono" style={{ color: S.text3 }}>
            {art.items.filter(item => reviewItems?.[`${stepN}-${item.label}`] === "approved").length}/{art.items.length} 已通过
          </span>
        </div>
      )}
      {/* Artifact items */}
      <div className="space-y-1.5">
        {art.items.map((item, i) => (
          <motion.div key={i} initial={{ opacity:0, y:3 }} animate={{ opacity:1, y:0 }}
            transition={{ delay: i * 0.05 }}
            className="p-3 rounded-xl" style={{ background: S.card, border:`1px solid ${S.border}` }}>
            <div className="flex items-start justify-between gap-2">
              <span className="text-[10px] font-bold" style={{ color: S.text2 }}>{item.label}</span>
              {item.sub && <span className="text-[8px] px-1.5 py-0.5 rounded shrink-0"
                style={{ background:`${S.primary}10`, color: S.primary }}>{item.sub}</span>}
            </div>
            <p className="text-[10px] mt-1" style={{ color: S.text }}>{item.value}</p>
            {/* Review buttons */}
            {reviewMode && onApprove && onReject && (
              <div className="flex items-center gap-1.5 mt-1.5">
                {(() => {
                  const key = `${stepN}-${item.label}`;
                  const status = reviewItems?.[key];
                  return (
                    <>
                      <motion.button whileTap={{ scale: 0.95 }}
                        onClick={() => onApprove(key)}
                        className="flex items-center gap-0.5 px-2 py-0.5 rounded text-[8px] font-bold focus:outline-none"
                        style={{
                          background: status === "approved" ? `${S.success}15` : S.s2,
                          color: status === "approved" ? S.success : S.text3,
                          border: `1px solid ${status === "approved" ? `${S.success}30` : S.border}`,
                        }}>
                        <CheckCircle2 size={9} /> 通过
                      </motion.button>
                      <motion.button whileTap={{ scale: 0.95 }}
                        onClick={() => onReject(key)}
                        className="flex items-center gap-0.5 px-2 py-0.5 rounded text-[8px] font-bold focus:outline-none"
                        style={{
                          background: status === "rejected" ? `${S.error}15` : S.s2,
                          color: status === "rejected" ? S.error : S.text3,
                          border: `1px solid ${status === "rejected" ? `${S.error}30` : S.border}`,
                        }}>
                        <XCircle size={9} /> 拒绝
                      </motion.button>
                      {status === "rejected" && (
                        <span className="text-[8px] px-1.5 py-0.5 rounded" style={{ background: `${S.warning}10`, color: S.warning }}>
                          需 AI 重新生成
                        </span>
                      )}
                    </>
                  );
                })()}
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// -- 主组件 --------------------------------------------------------------------
export default function ParseScreen() {
  const router = useRouter();
  const [mode, setMode]         = useState<"faithful"|"optimize"|"interactive">("interactive");
  const [viewStep, setViewStep] = useState(3);
  const [msgs, setMsgs]         = useState(INIT_MSGS);
  const [input, setInput]       = useState("");
  const [agentModal, setAgentModal] = useState(false);
  const [agentConfig, setAgentConfig] = useState(false);
  const [reviewItems, setReviewItems] = useState<Record<string, "approved" | "rejected" | "pending">>({});
  const [reviewMode, setReviewMode] = useState(false);
  const [rightTab, setRightTab] = useState<"artifact"|"rules">("artifact");
  const [rules, setRules] = useState<WorldRule[]>(WORLD_RULES);
  const endRef                  = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior:"smooth" }); }, [msgs]);

  const send = () => {
    if (!input.trim()) return;
    const reply = { role:"ai" as const, text:`收到：「${input}」，正在分析并调整制作计划……` };
    setMsgs(m => [...m, { role:"user" as const, text:input }, reply]);
    setInput("");
  };

  const doneCount = STEPS.filter(s => s.status === "done").length;
  const activeStep = STEPS.find(s => s.status === "running") ?? STEPS.find(s => s.status === "done" && s.n === doneCount);

  const MODES = [
    { id:"faithful"    as const, short:"忠实" },
    { id:"optimize"    as const, short:"优化" },
    { id:"interactive" as const, short:"互动" },
  ];


  return (
    <div className="h-svh flex flex-col" style={{ background: S.bg }}>

      {/* 顶部面包屑 */}
      <div className="flex items-center justify-between px-4 py-2.5 shrink-0"
        style={{ background: S.card, borderBottom:`1px solid ${S.border}` }}>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold" style={{ color: S.text }}>剧本解构</span>
          <span className="text-[9px] px-2 py-0.5 rounded-full"
            style={{ background:`${S.accent}12`, color: S.accent }}>幽灵协议</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-mono px-2 py-0.5 rounded"
            style={{ background: S.s2, border:`1px solid ${S.border}`, color: S.text3 }}>
            {doneCount}/10 完成
          </span>
          <motion.button whileTap={{ scale:0.97 }}
            onClick={() => setAgentConfig(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold focus:outline-none"
            style={{ background:`${S.primary}10`, border:`1px solid ${S.primary}25`, color: S.primary }}>
            ⚙ Agent配置
          </motion.button>
          <motion.button whileTap={{ scale:0.97 }}
            onClick={() => setAgentModal(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold focus:outline-none"
            style={{ background:`${S.accent}10`, border:`1px solid ${S.accent}25`, color: S.accent }}>
            🎬 镜头库
          </motion.button>
        </div>
      </div>

      {/* 主体：左右两栏 */}
      <div className="flex-1 flex overflow-hidden">

        {/* 左侧：AI项目导演对话 */}
        <div className="w-[38%] min-w-0 flex flex-col border-r" style={{ borderColor: S.border, background: S.card }}>

          {/* 文件信息 + 模式 */}
          <div className="px-3 py-2 shrink-0" style={{ borderBottom:`1px solid ${S.border}`, background: S.s2 }}>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5 min-w-0">
                <div className="w-5 h-5 rounded flex items-center justify-center shrink-0"
                  style={{ background:`${S.primary}15` }}>
                  <span className="text-[7px] font-bold" style={{ color: S.primary }}>TXT</span>
                </div>
                <span className="text-[10px] font-bold truncate" style={{ color: S.text }}>幽灵协议.txt</span>
                <span className="text-[9px] shrink-0" style={{ color: S.accent }}>85KB</span>
              </div>
              <button className="text-[8px] font-bold px-1.5 py-0.5 rounded focus:outline-none"
                style={{ color: S.primary, border:`1px solid ${S.primary}20` }}>更换</button>
            </div>
            <div className="flex gap-1 items-center">
              {MODES.map(m => (
                <motion.button key={m.id} whileTap={{ scale:0.97 }} onClick={() => setMode(m.id)}
                  className="flex-1 py-1 rounded text-[9px] font-bold focus:outline-none"
                  style={{
                    background: mode===m.id ? S.primary : "transparent",
                    color: mode===m.id ? "#fff" : S.text3,
                    border: mode===m.id ? "none" : `1px solid ${S.border}`,
                  }}>
                  {m.short}
                </motion.button>
              ))}
              <span className="text-[8px] shrink-0 px-1 py-0.5 rounded ml-1"
                style={{ background:`${S.success}12`, color: S.success }}>已锁定</span>
            </div>
          </div>

          {/* AI对话主体 */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
            {msgs.map((msg, i) => (
              <motion.div key={i} initial={{ opacity:0, y:4 }} animate={{ opacity:1, y:0 }}
                className={`flex gap-2 ${msg.role==="user" ? "flex-row-reverse" : ""}`}>
                <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: msg.role==="ai" ? `${S.primary}15` : S.s2 }}>
                  <span className="text-[7px] font-bold"
                    style={{ color: msg.role==="ai" ? S.primary : S.text3 }}>
                    {msg.role==="ai" ? "AI" : "我"}
                  </span>
                </div>
                <div className="max-w-[80%] px-2.5 py-2 rounded-xl text-[10px] leading-relaxed"
                  style={{
                    background: msg.role==="ai" ? S.s2 : `${S.primary}10`,
                    color: S.text2,
                    border:`1px solid ${msg.role==="ai" ? S.border : `${S.primary}20`}`,
                  }}>
                  {msg.text}
                </div>
              </motion.div>
            ))}
            <div className="flex gap-2">
              <div className="w-5 h-5 rounded-full flex items-center justify-center"
                style={{ background:`${S.primary}15` }}>
                <span className="text-[7px] font-bold" style={{ color: S.primary }}>AI</span>
              </div>
              <div className="px-3 py-2 rounded-xl flex items-center gap-1"
                style={{ background: S.s2, border:`1px solid ${S.border}` }}>
                {[0,1,2].map(j => (
                  <motion.div key={j} className="w-1 h-1 rounded-full" style={{ background: S.primary }}
                    animate={{ opacity:[0.3,1,0.3] }}
                    transition={{ duration:1, repeat:Infinity, delay:j*0.2 }} />
                ))}
              </div>
            </div>
            <div ref={endRef} />
          </div>

          {/* 输入框 */}
          <div className="shrink-0 px-3 py-2.5 border-t" style={{ borderColor: S.border }}>
            <div className="flex gap-2 items-center rounded-xl px-3 py-2"
              style={{ background: S.s2, border:`1.5px solid ${input ? S.primary : S.border}` }}>
              <input value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key==="Enter" && send()}
                placeholder="向 AI 导演提问或下指令…"
                className="flex-1 text-xs bg-transparent focus:outline-none" style={{ color: S.text }} />
              <motion.button whileTap={{ scale:0.9 }} onClick={send} className="focus:outline-none">
                <Send size={12} color={input ? S.primary : S.text3} />
              </motion.button>
            </div>
          </div>
        </div>

        {/* 右侧：进度轨道 + 动态产物 */}
        <div className="flex-1 flex flex-col min-w-0" style={{ background: S.s2 }}>

          {/* 10步进度轨道 */}
          <div className="shrink-0 px-4 py-3 border-b" style={{ borderColor: S.border, background: S.card }}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[9px] uppercase tracking-wider font-bold" style={{ color: S.text3 }}>
                制作进度
              </span>
              <div className="flex items-center gap-1">
                <motion.button whileTap={{ scale: 0.95 }}
                  onClick={() => setRightTab("artifact")}
                  className="flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold focus:outline-none"
                  style={{
                    background: rightTab === "artifact" ? `${S.primary}12` : "transparent",
                    color: rightTab === "artifact" ? S.primary : S.text3,
                    border: `1px solid ${rightTab === "artifact" ? `${S.primary}25` : "transparent"}`,
                  }}>
                  <FileText size={9} /> 步骤产物
                </motion.button>
                <motion.button whileTap={{ scale: 0.95 }}
                  onClick={() => setRightTab("rules")}
                  className="flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold focus:outline-none"
                  style={{
                    background: rightTab === "rules" ? `${S.primary}12` : "transparent",
                    color: rightTab === "rules" ? S.primary : S.text3,
                    border: `1px solid ${rightTab === "rules" ? `${S.primary}25` : "transparent"}`,
                  }}>
                  <Shield size={9} /> 世界规则
                </motion.button>
              </div>
            </div>
            <div className="flex items-center gap-0.5 overflow-x-auto">
              {STEPS.map((step, i) => {
                const isDone = step.status === "done";
                const isRun  = step.status === "running";
                const isViewing = viewStep === step.n;
                return (
                  <div key={i} className="flex items-center shrink-0">
                    <div className="relative">
                      <motion.button
                        whileTap={{ scale:0.9 }}
                        onClick={() => { setViewStep(step.n); setRightTab("artifact"); }}
                        title={`${step.label} — ${STATUS_TEXT[step.status]}`}
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-bold focus:outline-none ${isRun ? "animate-pulse":""}`}
                        style={{
                          background: isViewing ? S.primary : isDone ? `${S.success}15` : isRun ? `${S.primary}15` : S.s2,
                          border:`1.5px solid ${isViewing ? S.primary : isDone ? S.success : isRun ? S.primary : S.border2}`,
                          color: isViewing ? "#fff" : isDone ? S.success : isRun ? S.primary : S.text3,
                        }}>
                        {isDone ? "✓" : step.n}
                      </motion.button>
                      {reviewMode && rightTab === "artifact" && isDone && (
                        <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full flex items-center justify-center"
                          style={{ background: S.accent }}>
                          <span className="text-[5px] text-white font-bold">!</span>
                        </div>
                      )}
                      {isRun && (
                        <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap">
                          <span className="text-[6px] font-bold" style={{ color: S.primary }}>处理中</span>
                        </div>
                      )}
                    </div>
                    {i < STEPS.length-1 && (
                      <div className="w-1.5 h-px shrink-0"
                        style={{ background: isDone ? `${S.success}40` : S.border }} />
                    )}
                  </div>
                );
              })}
              <span className="text-[9px] ml-1 shrink-0" style={{ color: S.text3 }}>{doneCount}/10</span>
            </div>
            <p className="text-[9px] mt-1" style={{ color: S.text3 }}>
              点击数字查看步骤产物 ·
              <span style={{ color: S.primary }} className="ml-0.5">
                {STEPS.find(s=>s.n===viewStep)?.label}
              </span>
            </p>
          </div>

          {/* 动态产物区 / 世界规则面板 */}
          <AnimatePresence mode="wait">
            {rightTab === "artifact" ? (
            <motion.div key={`step-${viewStep}`} initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }}
              exit={{ opacity:0 }} transition={{ duration:0.15 }}
              className="flex-1 overflow-hidden flex flex-col">
              <StepArtifact stepN={viewStep} 
                reviewItems={reviewItems}
                onApprove={(key) => setReviewItems(prev => ({ ...prev, [key]: "approved" }))}
                onReject={(key) => setReviewItems(prev => ({ ...prev, [key]: "rejected" }))}
                reviewMode={reviewMode}
              />
            </motion.div>
            ) : (
            <motion.div key="world-rules" initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }}
              exit={{ opacity:0 }} transition={{ duration:0.15 }}
              className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Header */}
              <div className="p-3 rounded-xl flex items-center justify-between"
                style={{ background: `${S.primary}06`, border: `1px solid ${S.primary}20` }}>
                <div className="flex items-center gap-2.5">
                  <Shield size={15} color={S.primary} className="shrink-0" />
                  <div>
                    <p className="text-xs font-bold" style={{ color: S.text }}>世界观与叙事规则</p>
                    <p className="text-[9px]" style={{ color: S.text3 }}>
                      共 {rules.length} 条规则 · {rules.filter(r => r.validated).length} 条已校验
                    </p>
                  </div>
                </div>
                <motion.button whileTap={{ scale: 0.95 }}
                  onClick={() => setRules(prev => prev.map(r => ({ ...r, validated: true })))}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[9px] font-bold focus:outline-none"
                  style={{ background: `${S.primary}12`, color: S.primary, border: `1px solid ${S.primary}25` }}>
                  <CheckCircle2 size={10} /> 校验全部
                </motion.button>
              </div>

              {/* Rules grouped by type */}
              {(() => {
                const groups: WorldRuleType[] = ['setting', 'character_constraint', 'permanent_rule', 'narrative_taboo', 'tension_check'];
                const grouped = groups.map(type => ({
                  type,
                  cfg: RULE_TYPE_CFG[type],
                  rules: rules.filter(r => r.type === type),
                })).filter(g => g.rules.length > 0);

                return grouped.map(group => (
                  <div key={group.type}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2.5 h-2.5 rounded-sm" style={{ background: group.cfg.color }} />
                      <span className="text-[10px] font-bold" style={{ color: S.text }}>{group.cfg.label}</span>
                      <span className="text-[8px] px-1.5 py-0.5 rounded" style={{ background: S.s2, color: S.text3 }}>
                        {group.rules.length}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {group.rules.map(rule => (
                        <motion.div key={rule.id} layout
                          className="p-3 rounded-xl"
                          style={{
                            background: S.card,
                            border: `1px solid ${rule.validated ? S.border : `${S.warning}40`}`,
                            opacity: rule.validated ? 1 : 0.85,
                          }}>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[10px] font-bold" style={{ color: S.text }}>{rule.title}</span>
                                <span className="text-[8px] px-1.5 py-0.5 rounded font-bold"
                                  style={{
                                    background: rule.severity === 'hard' ? `${S.error}12` : rule.severity === 'soft' ? `${S.warning}12` : `${S.primary}12`,
                                    color: rule.severity === 'hard' ? S.error : rule.severity === 'soft' ? S.warning : S.primary,
                                  }}>
                                  {rule.severity === 'hard' ? '强制' : rule.severity === 'soft' ? '建议' : '可选'}
                                </span>
                              </div>
                              <p className="text-[9px] mt-1 leading-relaxed" style={{ color: S.text2 }}>{rule.description}</p>
                            </div>
                            <div className="shrink-0 flex items-center gap-1">
                              {rule.validated ? (
                                <span className="flex items-center gap-0.5 text-[8px] font-bold" style={{ color: S.success }}>
                                  <CheckCircle2 size={9} /> 已校验
                                </span>
                              ) : (
                                <span className="flex items-center gap-0.5 text-[8px] font-bold" style={{ color: S.warning }}>
                                  <AlertTriangle size={9} /> 未校验
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Relations */}
                          {(rule.relatedCharacters?.length || rule.relatedScenes?.length) && (
                            <div className="flex gap-1.5 mt-2 flex-wrap">
                              {rule.relatedCharacters?.map(cId => {
                                const ch = GAME_CHARACTERS.find(c => c.id === cId);
                                return ch ? (
                                  <span key={cId} className="text-[8px] px-1.5 py-0.5 rounded"
                                    style={{ background: `${ch.color}10`, color: ch.color, border: `1px solid ${ch.color}25` }}>
                                    {ch.name}
                                  </span>
                                ) : null;
                              })}
                              {rule.relatedScenes?.map(sId => {
                                const sc = GAME_SCENES.find(s => s.id === sId);
                                return sc ? (
                                  <span key={sId} className="text-[8px] px-1.5 py-0.5 rounded"
                                    style={{ background: `${S.accent}10`, color: S.accent, border: `1px solid ${S.accent}25` }}>
                                    {sc.name}
                                  </span>
                                ) : null;
                              })}
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ));
              })()}
            </motion.div>
            )}
          </AnimatePresence>

          {/* 底部操作栏 */}
          <div className="shrink-0 px-4 py-3 border-t flex items-center gap-2"
            style={{ borderColor: S.border, background: S.card }}>
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => setReviewMode(!reviewMode)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold focus:outline-none"
              style={{ 
                background: reviewMode ? `${S.accent}15` : S.s2, 
                border: `1px solid ${reviewMode ? `${S.accent}30` : S.border}`, 
                color: reviewMode ? S.accent : S.text2 
              }}>
              <Eye size={11} /> {reviewMode ? "退出审核" : "审核产出"}
            </motion.button>
            <motion.button whileTap={{ scale:0.97 }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white focus:outline-none"
              style={{ background: S.primary, boxShadow:`0 2px 8px ${S.primary}30` }}>
              ▶ 继续执行
            </motion.button>
            <motion.button whileTap={{ scale:0.97 }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium focus:outline-none"
              style={{ background: S.s2, border:`1px solid ${S.border}`, color: S.text2 }}>
              <RotateCcw size={11}/> 重新生成
            </motion.button>
            <div className="flex-1" />
            <motion.button whileTap={{ scale:0.97 }} onClick={() => router.push("/overview")}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold focus:outline-none"
              style={{ background:`${S.accent}15`, border:`1px solid ${S.accent}30`, color: S.accent }}>
              ✓ 应用到工作台 <ArrowRight size={11}/>
            </motion.button>
          </div>
        </div>
      </div>

      {/* Agent技能配置弹窗 */}
      <AnimatePresence>
        {agentConfig && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background:"rgba(0,0,0,0.5)" }}
            onClick={() => setAgentConfig(false)}>
            <motion.div initial={{ scale:0.96, opacity:0 }} animate={{ scale:1, opacity:1 }}
              exit={{ scale:0.96, opacity:0 }}
              className="w-full max-w-2xl rounded-2xl overflow-hidden max-h-[80vh] flex flex-col"
              style={{ background:"#1A1D2E", border:"1px solid rgba(255,255,255,0.08)" }}
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-5 py-4 border-b"
                style={{ borderColor:"rgba(255,255,255,0.08)" }}>
                <div>
                  <h3 className="text-sm font-bold text-white">Agent 技能配置</h3>
                  <p className="text-[10px] mt-0.5" style={{ color:"rgba(255,255,255,0.45)" }}>
                    应用于后续各环节生成任务
                  </p>
                </div>
                <motion.button whileTap={{ scale:0.9 }} onClick={() => setAgentConfig(false)}
                  className="w-7 h-7 rounded-full flex items-center justify-center focus:outline-none text-sm"
                  style={{ background:"rgba(255,255,255,0.08)", color:"rgba(255,255,255,0.5)" }}>
                  x
                </motion.button>
              </div>
              <div className="overflow-y-auto p-5 space-y-3">
                {[
                  { icon:"⚙", iconBg:"rgba(94,80,232,0.3)",  title:"基础参数配置",       desc:"项目整体风格、剧集时长、比例等",                 tags:[{label:"通用写实"},{label:"9:16"},{label:"自动"}] },
                  { icon:"≡", iconBg:"rgba(59,130,246,0.4)",  title:"镜头提示词生成技能",  desc:"按时长将剧本扩写为详细镜头提示词",               tags:[{label:"通用叙事拆解"},{label:"Chat 5.2"}] },
                  { icon:"▦", iconBg:"rgba(245,158,11,0.4)",  title:"视频任务规划技能",    desc:"将镜头编排为视频生成任务",                       tags:[{label:"按剧情连贯拆分"},{label:"多宫格Pro"}] },
                  { icon:"✦", iconBg:"rgba(16,185,129,0.35)", title:"互动节点生成技能",    desc:"识别关键决策点，生成选择分支与变量系统",          tags:[{label:"互动改编"},{label:"自动识别"}], extra:true },
                  { icon:"≋", iconBg:"rgba(0,169,157,0.35)",  title:"单视频提示词润色技能", desc:"优化提示词，保证角色跨场景一致性",                tags:[{label:"通用模板"},{label:"Gem 3.0"}] },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-3.5 rounded-xl"
                    style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)" }}>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm shrink-0"
                        style={{ background: item.iconBg }}>
                        <span className="text-white">{item.icon}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">{item.title}</span>
                          {item.extra && (
                            <span className="text-[8px] px-1.5 py-0.5 rounded font-bold"
                              style={{ background:"rgba(0,169,157,0.3)", color:"#00A99D" }}>逐梦专属</span>
                          )}
                        </div>
                        <p className="text-[10px] mt-0.5" style={{ color:"rgba(255,255,255,0.4)" }}>{item.desc}</p>
                      </div>
                    </div>
                    <div className="flex gap-1.5 flex-wrap justify-end ml-3">
                      {item.tags.map((tag, j) => (
                        <span key={j} className="text-[9px] px-2 py-0.5 rounded-lg"
                          style={{ background:"rgba(255,255,255,0.08)", color:"rgba(255,255,255,0.6)" }}>
                          {tag.label}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-5 pb-5 flex justify-end border-t pt-4"
                style={{ borderColor:"rgba(255,255,255,0.08)" }}>
                <motion.button whileTap={{ scale:0.97 }} onClick={() => setAgentConfig(false)}
                  className="px-6 py-2 rounded-xl text-xs font-bold text-white focus:outline-none"
                  style={{ background: S.primary }}>
                  保存
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 智能镜头库弹窗 */}
      <AnimatePresence>
        {agentModal && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background:"rgba(0,0,0,0.6)" }}
            onClick={() => setAgentModal(false)}>
            <motion.div initial={{ y:20, opacity:0 }} animate={{ y:0, opacity:1 }}
              exit={{ y:20, opacity:0 }}
              className="w-full max-w-2xl rounded-2xl overflow-hidden max-h-[80vh] flex flex-col"
              style={{ background:"#16182A", border:"1px solid rgba(255,255,255,0.08)" }}
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-5 py-4 border-b"
                style={{ borderColor:"rgba(255,255,255,0.08)" }}>
                <div>
                  <h3 className="text-sm font-bold text-white">智能镜头库</h3>
                  <p className="text-[10px] mt-0.5" style={{ color:"rgba(255,255,255,0.4)" }}>
                    锁定角色外貌提示词，保持跨节点视觉一致性
                  </p>
                </div>
                <motion.button whileTap={{ scale:0.9 }} onClick={() => setAgentModal(false)}
                  className="w-7 h-7 rounded-full flex items-center justify-center focus:outline-none text-sm"
                  style={{ background:"rgba(255,255,255,0.08)", color:"rgba(255,255,255,0.5)" }}>
                  x
                </motion.button>
              </div>
              <div className="overflow-y-auto p-5 space-y-3">
                {[
                  { name:"艾拉", role:"女主角·侦探", locked:true, nodes:11,
                    prompt:"cyberpunk female detective, black short hair, silver eye, black trench coat",
                    frames:["默认","愤怒","受伤","沉默"] },
                  { name:"线人", role:"关键NPC", locked:true, nodes:4,
                    prompt:"mysterious middle-aged man, worn jacket, shadowy face",
                    frames:["默认","警惕"] },
                  { name:"反派主管", role:"反派", locked:false, nodes:3,
                    prompt:"", frames:["默认"] },
                ].map((char, i) => (
                  <div key={i} className="rounded-xl overflow-hidden"
                    style={{ border:"1px solid rgba(255,255,255,0.08)", background:"rgba(255,255,255,0.03)" }}>
                    <div className="flex items-center justify-between px-4 py-3 border-b"
                      style={{ borderColor:"rgba(255,255,255,0.06)" }}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center"
                          style={{ background:"rgba(94,80,232,0.3)" }}>
                          <span className="text-white text-sm">{char.name[0]}</span>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">{char.name}</p>
                          <p className="text-[9px]" style={{ color:"rgba(255,255,255,0.4)" }}>
                            {char.role} · 出现 {char.nodes} 节点
                          </p>
                        </div>
                      </div>
                      <span className="text-[9px] px-2 py-0.5 rounded-full"
                        style={{ background: char.locked ? "rgba(0,169,157,0.2)" : "rgba(245,158,11,0.15)",
                          color: char.locked ? "#00A99D" : "#F59E0B" }}>
                        {char.locked ? "✓ 已锁定" : "未锁定"}
                      </span>
                    </div>
                    <div className="px-4 py-3">
                      <p className="text-[9px] mb-1.5" style={{ color:"rgba(255,255,255,0.35)" }}>外貌提示词</p>
                      {char.locked
                        ? <p className="text-[10px]" style={{ color:"rgba(255,255,255,0.65)" }}>{char.prompt}</p>
                        : <p className="text-[10px] italic" style={{ color:"rgba(255,255,255,0.25)" }}>尚未设置</p>}
                      <div className="flex gap-1.5 mt-2">
                        {char.frames.map((f,j) => (
                          <span key={j} className="text-[8px] px-1.5 py-0.5 rounded"
                            style={{ background: j===0 ? "rgba(94,80,232,0.25)" : "rgba(255,255,255,0.06)",
                              color: j===0 ? "#A78BFA" : "rgba(255,255,255,0.4)" }}>
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between px-5 py-4 border-t"
                style={{ borderColor:"rgba(255,255,255,0.08)" }}>
                <span className="text-[10px]" style={{ color:"rgba(255,255,255,0.3)" }}>3 个角色 · 2 个已锁定</span>
                <div className="flex gap-2">
                  <motion.button whileTap={{ scale:0.97 }} onClick={() => setAgentModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-medium focus:outline-none"
                    style={{ background:"rgba(255,255,255,0.06)", color:"rgba(255,255,255,0.6)" }}>
                    关闭
                  </motion.button>
                  <motion.button whileTap={{ scale:0.97 }} onClick={() => setAgentModal(false)}
                    className="px-5 py-2 rounded-xl text-xs font-bold text-white focus:outline-none"
                    style={{ background: S.primary }}>
                    应用外貌锁定
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
