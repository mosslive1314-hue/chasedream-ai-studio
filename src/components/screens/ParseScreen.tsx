"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, XCircle, Eye, Loader2, ArrowRight, RotateCcw,
  User, MapPin, Package, GitBranch, Sliders, FileText,
  Network, CheckSquare, List, Rocket,
  BookOpen, Settings, Terminal,
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useNarrativeStore, useProjectStore, useUIStore } from "@/store";
import { UpstreamReadiness } from "@/components/ui/UpstreamReadiness";

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

// -- 右侧产物渲染 --------------------------------------------------------------
function StepArtifact({ stepN, artifact, reviewItems, onApprove, onReject, reviewMode }: { 
  stepN: number;
  artifact: { heading: string; summary: string; items: ArtifactItem[] };
  reviewItems?: Record<string, "approved" | "rejected" | "pending">;
  onApprove?: (key: string) => void;
  onReject?: (key: string) => void;
  reviewMode?: boolean;
}) {
  const step = STEPS.find(s => s.n === stepN)!;
  const art  = artifact;

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

// -- Agent 执行日志生成 --------------------------------------------------------
function generateAgentLogs(stepIndex: number) {
  const stepNames = ['故事解构', '角色提取', '场景识别', '道具梳理', '节点图谱', '选择设计', '结局规划', '逻辑校验', '资产清单', '发布检查'];
  const stepName = stepNames[stepIndex] || '当前步骤';
  const now = new Date();
  const timeStr = (offset: number) => {
    const t = new Date(now.getTime() - (5 - offset) * 1000);
    return t.toTimeString().substring(0, 8);
  };
  return [
    { time: timeStr(0), type: 'info', prefix: '[Init]', message: `启动 Agent: ${stepName}-agent v2.1` },
    { time: timeStr(1), type: 'command', prefix: 'SHELL', message: `ls /narrative/chapters/ → 发现 8 个章节文件` },
    { time: timeStr(2), type: 'info', prefix: '[SCAN]', message: `扫描原始文本... 共 12,847 字符` },
    { time: timeStr(3), type: 'success', prefix: '✓', message: `前置检查通过 — 所有依赖数据已就绪` },
    { time: timeStr(4), type: 'command', prefix: 'LLM', message: `调用 qwen-max 进行${stepName}分析...` },
    { time: timeStr(5), type: 'success', prefix: '✓', message: `${stepName}完成 — 生成 ${3 + stepIndex} 个结构化产出物` },
  ];
}

// -- 主组件 --------------------------------------------------------------------
export default function ParseScreen() {
  const router = useRouter();
  const pathname = usePathname();
  const projectName = useProjectStore(s => s.currentProject()?.title) || "当前项目";
  const worldRules = useNarrativeStore(s => s.worldRules);
  const updateWorldRule = useNarrativeStore(s => s.updateWorldRule);
  const addToast = useUIStore(s => s.addToast);

  const ARTIFACTS: Record<number, { heading:string; summary:string; items: ArtifactItem[] }> = {
    1: {
      heading:"故事大纲",
      summary:"已从剧本中提炼出主线框架、核心冲突与2条分支路线。",
      items:[
        { label:"主线标题",  value:`${projectName}：追击指令`,            sub:"赛博朋克·间谍惊悚" },
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

  const [viewStep, setViewStep] = useState(3);
  const [reviewItems, setReviewItems] = useState<Record<string, "approved" | "rejected" | "pending">>({});
  const [reviewMode, setReviewMode] = useState(false);
  const [showExecLog, setShowExecLog] = useState(false);

  const pipelineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // scroll active step into view in pipeline bar
    const el = pipelineRef.current?.querySelector(`[data-step="${viewStep}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [viewStep]);

  const doneCount = STEPS.filter(s => s.status === "done").length;
  const activeStep = STEPS.find(s => s.status === "running") ?? STEPS.find(s => s.status === "done" && s.n === doneCount);


  return (
    <div className="h-svh flex flex-col" style={{ background: S.bg }}>
      <UpstreamReadiness currentPath={pathname} />

      {/* ── 顶部面包屑 ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-2.5 shrink-0"
        style={{ background: S.card, borderBottom:`1px solid ${S.border}` }}>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold" style={{ color: S.text }}>剧本解构</span>
          <span className="text-[9px] px-2 py-0.5 rounded-full"
            style={{ background:`${S.accent}12`, color: S.accent }}>{projectName}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-mono px-2 py-0.5 rounded"
            style={{ background: S.s2, border:`1px solid ${S.border}`, color: S.text3 }}>
            {doneCount}/10 完成
          </span>
        </div>
      </div>

      {/* ── 放大管线进度条 ─────────────────────────────────────────────── */}
      <div className="shrink-0 px-4 py-3 border-b" style={{ borderColor: S.border, background: S.card }}>
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wider font-bold" style={{ color: S.text3 }}>
              制作进度
            </span>
            {activeStep && (
              <span className="text-[9px] px-2 py-0.5 rounded-full animate-pulse"
                style={{ background: `${S.primary}12`, color: S.primary }}>
                {activeStep.label} — 处理中
              </span>
            )}
          </div>
          <span className="text-[10px] font-bold font-mono" style={{ color: S.primary }}>
            {doneCount}/10
          </span>
        </div>
        <div ref={pipelineRef} className="flex items-center gap-1 overflow-x-auto pb-1">
          {STEPS.map((step, i) => {
            const isDone = step.status === "done";
            const isRun  = step.status === "running";
            const isViewing = viewStep === step.n;
            return (
              <div key={i} className="flex items-center shrink-0" data-step={step.n}>
                <motion.button
                  whileTap={{ scale:0.95 }}
                  onClick={() => setViewStep(step.n)}
                  title={`${step.label} — ${STATUS_TEXT[step.status]}`}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl focus:outline-none"
                  style={{
                    background: isViewing ? `${S.primary}12` : isDone ? `${S.success}06` : isRun ? `${S.primary}06` : "transparent",
                    border: `1.5px solid ${isViewing ? S.primary : isDone ? `${S.success}40` : isRun ? `${S.primary}40` : S.border}`,
                  }}>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold shrink-0 ${isRun ? "animate-pulse" : ""}`}
                    style={{
                      background: isViewing ? S.primary : isDone ? `${S.success}15` : isRun ? `${S.primary}15` : S.s2,
                      color: isViewing ? "#fff" : isDone ? S.success : isRun ? S.primary : S.text3,
                    }}>
                    {isDone ? "✓" : step.n}
                  </div>
                  <span className="text-[9px] font-medium whitespace-nowrap"
                    style={{ color: isViewing ? S.primary : isDone ? S.success : isRun ? S.primary : S.text3 }}>
                    {step.label}
                  </span>
                </motion.button>
                {i < STEPS.length - 1 && (
                  <div className="w-3 h-px shrink-0 mx-0.5"
                    style={{ background: isDone ? `${S.success}40` : S.border }} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 执行日志切换按钮 ─────────────────────────────────────────────── */}
      <div className="shrink-0 px-4 py-2 border-b" style={{ borderColor: S.border, background: S.card }}>
        <button
          onClick={() => setShowExecLog(!showExecLog)}
          className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border transition-colors"
          style={{
            color: showExecLog ? "#5E50E8" : "#8892B0",
            borderColor: showExecLog ? "#5E50E8" : "#E2E5F0",
            background: showExecLog ? "rgba(94,80,232,0.08)" : "transparent",
          }}
        >
          <Terminal size={12} />
          执行日志
        </button>
      </div>

      {/* ── 执行日志面板 ─────────────────────────────────────────────────── */}
      {showExecLog && (
        <div className="shrink-0 px-4 py-3 border-b" style={{ borderColor: S.border, background: S.card }}>
          <div className="rounded-xl border overflow-hidden" style={{ borderColor: "#1E293B", background: "#0F172A" }}>
            <div className="flex items-center gap-2 px-3 py-2 border-b" style={{ borderColor: "#1E293B" }}>
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#EF4444" }} />
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#F59E0B" }} />
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#10B981" }} />
              </div>
              <span className="text-xs font-mono" style={{ color: "#94A3B8" }}>Agent 执行日志</span>
              <button onClick={() => setShowExecLog(false)} className="ml-auto text-xs" style={{ color: "#64748B" }}>✕</button>
            </div>
            <div className="p-3 max-h-[300px] overflow-y-auto font-mono text-xs space-y-1" style={{ color: "#E2E8F0" }}>
              {generateAgentLogs(activeStep?.n ?? viewStep).map((log, i) => (
                <div key={i} className="flex gap-2">
                  <span style={{ color: "#64748B" }}>{log.time}</span>
                  <span style={{ color: log.type === 'success' ? '#10B981' : log.type === 'error' ? '#EF4444' : log.type === 'command' ? '#60A5FA' : '#E2E8F0' }}>
                    {log.prefix && <span className="font-bold">{log.prefix} </span>}
                    {log.message}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── 主体：主内容 + 上下文侧栏 ──────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── 主内容区 (~70%) ──────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0" style={{ background: S.s2 }}>
          <AnimatePresence mode="wait">
            <motion.div key={`step-${viewStep}`}
              initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }}
              exit={{ opacity:0 }} transition={{ duration:0.15 }}
              className="flex-1 overflow-hidden flex flex-col">
              <StepArtifact stepN={viewStep}
                artifact={ARTIFACTS[viewStep]}
                reviewItems={reviewItems}
                onApprove={(key) => setReviewItems(prev => ({ ...prev, [key]: "approved" }))}
                onReject={(key) => setReviewItems(prev => ({ ...prev, [key]: "rejected" }))}
                reviewMode={reviewMode}
              />
            </motion.div>
          </AnimatePresence>

          {/* ── 底部操作栏 ──────────────────────────────────────────── */}
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
            <motion.button whileTap={{ scale:0.97 }}
              onClick={() => {
                worldRules.forEach(r => {
                  if (r.validated) updateWorldRule(r.id, { validated: true });
                });
                addToast({ type: "success", title: "已应用到工作台", message: "解构结果已保存，可在剧本编辑中继续使用" });
                router.push("/script");
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold focus:outline-none"
              style={{ background:`${S.accent}15`, border:`1px solid ${S.accent}30`, color: S.accent }}>
              ✓ 应用到工作台 <ArrowRight size={11}/>
            </motion.button>
          </div>
        </div>

        {/* ── 上下文侧栏 (~30%) ──────────────────────────────────────── */}
        <div className="w-[280px] shrink-0 flex flex-col border-l overflow-y-auto"
          style={{ borderColor: S.border, background: S.card }}>

          {/* ── 文件信息 ────────────────────────────────────────────── */}
          <div className="p-3 border-b" style={{ borderColor: S.border }}>
            <div className="flex items-center gap-1.5 mb-2">
              <Settings size={12} style={{ color: S.text3 }} />
              <span className="text-[10px] font-bold" style={{ color: S.text }}>项目信息</span>
            </div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className="w-5 h-5 rounded flex items-center justify-center shrink-0"
                style={{ background: `${S.primary}15` }}>
                <span className="text-[7px] font-bold" style={{ color: S.primary }}>TXT</span>
              </div>
              <span className="text-[10px] font-bold truncate" style={{ color: S.text }}>{projectName}.txt</span>
              <span className="text-[9px] shrink-0" style={{ color: S.accent }}>85KB</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[8px] px-1.5 py-0.5 rounded"
                style={{ background: `${S.primary}10`, color: S.primary }}>互动改编</span>
              <span className="text-[8px] px-1.5 py-0.5 rounded"
                style={{ background: `${S.success}12`, color: S.success }}>已锁定</span>
            </div>
          </div>

          {/* ── 当前步骤信息 ────────────────────────────────────────── */}
          <div className="p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <BookOpen size={12} style={{ color: S.primary }} />
              <span className="text-[10px] font-bold" style={{ color: S.text }}>当前查看</span>
            </div>
            <p className="text-[10px] font-bold" style={{ color: S.primary }}>
              第 {viewStep} 步 · {STEPS.find(s => s.n === viewStep)?.label}
            </p>
            <p className="text-[9px] mt-0.5" style={{ color: S.text3 }}>
              {STATUS_TEXT[STEPS.find(s => s.n === viewStep)?.status ?? "pending"]}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
