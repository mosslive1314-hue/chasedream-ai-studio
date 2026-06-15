import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, XCircle, Eye, Loader2, ArrowRight, RotateCcw,
  User, MapPin, Package, GitBranch, Sliders, FileText,
  Network, CheckSquare, List, Rocket,
  Settings, Terminal,
  Pencil, Plus, Save, CheckCheck,
} from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useLocation } from "@tanstack/react-router";
import { useNarrativeStore, getCurrentProject, useUIStore } from "@/store";
import { UpstreamReadiness } from "@/components/ui/UpstreamReadiness";
import ContextualActions from "@/components/ui/ContextualActions";

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
  9: '等待所有步骤完成',
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
function StepArtifact({ stepN, artifact, reviewItems, onApprove, onReject, reviewMode,
  onEditItem, onSaveItem, onAddItem, onConfirmAll }: {
  stepN: number;
  artifact: { heading: string; summary: string; items: ArtifactItem[] };
  reviewItems?: Record<string, "approved" | "rejected" | "pending">;
  onApprove?: (key: string) => void;
  onReject?: (key: string) => void;
  reviewMode?: boolean;
  onEditItem?: (index: number, field: string, newValue: string) => void;
  onSaveItem?: (index: number, editingItems: Record<number, ArtifactItem>) => void;
  onAddItem?: () => void;
  onConfirmAll?: () => void;
}) {
  const step = STEPS.find(s => s.n === stepN)!;
  const art  = artifact;

  // Whether this step supports inline editing in review mode
  const editable = !!reviewMode && stepN >= 1 && stepN <= 4;

  // Local state for tracking in-progress edits
  const [editingItems, setEditingItems] = useState<Record<number, ArtifactItem>>({});
  const [editedIndices, setEditedIndices] = useState<Set<number>>(new Set());

  // Initialize editingItems from artifact items when step or item count changes
  useEffect(() => {
    if (stepN >= 1 && stepN <= 4) {
      setEditingItems(prev => {
        const init: Record<number, ArtifactItem> = { ...prev };
        art.items.forEach((item, i) => {
          // Only initialize items that don't already have edits
          if (!init[i]) {
            init[i] = { ...item };
          }
        });
        return init;
      });
    }
  }, [stepN, art.items.length]);

  const getEditItem = (i: number): ArtifactItem => {
    return editingItems[i] || art.items[i];
  };

  const handleFieldChange = (i: number, field: string, val: string) => {
    setEditingItems(prev => ({
      ...prev,
      [i]: { ...(prev[i] || art.items[i]), [field]: val },
    }));
    setEditedIndices(prev => new Set(prev).add(i));
    onEditItem?.(i, field, val);
  };

  const handleSave = (i: number) => {
    onSaveItem?.(i, editingItems);
    setEditedIndices(prev => {
      const next = new Set(prev);
      next.delete(i);
      return next;
    });
  };

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
            🔍 审核模式 — 逐条确认 AI 产出{editable ? "（可编辑）" : ""}
          </span>
          <span className="text-[8px] font-mono" style={{ color: S.text3 }}>
            {art.items.filter(item => reviewItems?.[`${stepN}-${item.label}`] === "approved").length}/{art.items.length} 已通过
          </span>
        </div>
      )}
      {/* Confirm All button — shown for editable steps 2-4 in review mode */}
      {editable && stepN >= 2 && stepN <= 4 && art.items.length > 1 && onConfirmAll && (
        <motion.button
          initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
          whileTap={{ scale: 0.97 }}
          onClick={onConfirmAll}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[9px] font-bold focus:outline-none"
          style={{ background: `${S.success}08`, border: `1px solid ${S.success}25`, color: S.success }}>
          <CheckCheck size={12} /> 全部确认
        </motion.button>
      )}
      {/* Artifact items */}
      <div className="space-y-1.5">
        {art.items.map((item, i) => {
          const editItem = getEditItem(i);
          const isEdited = editedIndices.has(i);
          const key = `${stepN}-${item.label}`;

          return (
            <motion.div key={`${key}-${i}`} initial={{ opacity:0, y:3 }} animate={{ opacity:1, y:0 }}
              transition={{ delay: i * 0.05 }}
              className="p-3 rounded-xl" style={{
                background: S.card,
                border: isEdited ? `1.5px solid ${S.accent}50` : `1px solid ${S.border}`,
              }}>
              {editable ? (
                <>
                  {/* Editable label (name) + sub field + save button */}
                  <div className="flex items-start justify-between gap-2">
                    <input
                      className="text-[10px] font-bold bg-transparent border-b w-full min-w-0 focus:outline-none py-0.5"
                      style={{ color: S.text, borderColor: isEdited ? S.accent : 'transparent' }}
                      value={editItem.label}
                      onChange={e => handleFieldChange(i, 'label', e.target.value)}
                    />
                    {editItem.sub !== undefined && (
                      <input
                        className="text-[8px] px-1.5 py-0.5 rounded shrink-0 max-w-[140px] focus:outline-none"
                        style={{
                          background: isEdited ? `${S.accent}08` : `${S.primary}10`,
                          color: S.primary,
                          border: `1px solid ${isEdited ? `${S.accent}30` : 'transparent'}`,
                        }}
                        value={editItem.sub}
                        onChange={e => handleFieldChange(i, 'sub', e.target.value)}
                      />
                    )}
                    {/* Save button */}
                    <motion.button
                      whileTap={{ scale: 0.85 }}
                      onClick={() => handleSave(i)}
                      className="shrink-0 p-1 rounded focus:outline-none"
                      title="保存修改"
                      style={{
                        background: isEdited ? `${S.accent}15` : `${S.text3}08`,
                        color: isEdited ? S.accent : S.text3,
                        border: `1px solid ${isEdited ? `${S.accent}30` : S.border}`,
                      }}>
                      <Save size={10} />
                    </motion.button>
                  </div>
                  {/* Editable value (description) */}
                  <textarea
                    className="text-[10px] mt-1 w-full bg-transparent resize-none focus:outline-none rounded py-1 px-1 -mx-1"
                    style={{
                      color: S.text,
                      border: isEdited ? `1px solid ${S.accent}25` : '1px solid transparent',
                    }}
                    value={editItem.value}
                    rows={2}
                    onChange={e => handleFieldChange(i, 'value', e.target.value)}
                  />
                  {/* Edited indicator */}
                  {isEdited && (
                    <p className="text-[8px] mt-0.5 flex items-center gap-0.5" style={{ color: S.accent }}>
                      <Pencil size={8} /> 已修改 — 点击保存图标确认
                    </p>
                  )}
                </>
              ) : (
                <>
                  {/* Non-editable display */}
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-bold" style={{ color: S.text2 }}>{item.label}</span>
                    {item.sub && <span className="text-[8px] px-1.5 py-0.5 rounded shrink-0"
                      style={{ background:`${S.primary}10`, color: S.primary }}>{item.sub}</span>}
                  </div>
                  <p className="text-[10px] mt-1" style={{ color: S.text }}>{item.value}</p>
                </>
              )}
              {/* Review buttons */}
              {reviewMode && onApprove && onReject && (
                <div className="flex items-center gap-1.5 mt-1.5">
                  {(() => {
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
          );
        })}
      </div>
      {/* Add item button — shown for editable steps 2-4 in review mode */}
      {editable && stepN >= 2 && stepN <= 4 && onAddItem && (
        <motion.button
          initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
          whileTap={{ scale: 0.97 }}
          onClick={onAddItem}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-[9px] font-bold focus:outline-none"
          style={{
            background: `${S.accent}06`,
            border: `1.5px dashed ${S.accent}40`,
            color: S.accent,
          }}>
          <Plus size={12} /> 手动添加
        </motion.button>
      )}
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
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;
  const projectName = getCurrentProject()?.title || "当前项目";
  const worldRules = useNarrativeStore(s => s.worldRules);
  const updateWorldRule = useNarrativeStore(s => s.updateWorldRule);
  const addToast = useUIStore(s => s.addToast);

  // ── Store actions for inline editing ────────────────────────────────────
  const updateCharacter = useNarrativeStore(s => s.updateCharacter);
  const updateScene = useNarrativeStore(s => s.updateScene);
  const updateProp = useNarrativeStore(s => s.updateProp);
  const addCharacter = useNarrativeStore(s => s.addCharacter);
  const addScene = useNarrativeStore(s => s.addScene);
  const addProp = useNarrativeStore(s => s.addProp);

  // ── Store data for artifact derivation ─────────────────────────────────
  const currentProject = getCurrentProject();
  const characters = useNarrativeStore(s => s.characters);
  const scenes = useNarrativeStore(s => s.scenes);
  const props = useNarrativeStore(s => s.props);
  const branchPaths = useNarrativeStore(s => s.branchPaths);
  const variables = useNarrativeStore(s => s.variables);
  const storyNodes = useNarrativeStore(s => s.storyNodes);
  const chapterPlans = useNarrativeStore(s => s.chapterPlans);
  const nodeEdges = useNarrativeStore(s => s.nodeEdges);

  // ── Dynamic analysis artifacts derived from store data ─────────────────
  const ARTIFACTS: Record<number, { heading:string; summary:string; items: ArtifactItem[] }> = useMemo(() => {
    const project = currentProject;
    const title = project?.title || projectName;
    const genre = project?.genre || "互动叙事";

    // Step 1: Story Outline
    const endingNodes = storyNodes.filter(n => n.type === 'ending_good' || n.type === 'ending_bad');
    const goodEndings = endingNodes.filter(n => n.type === 'ending_good');
    const badEndings = endingNodes.filter(n => n.type === 'ending_bad');
    const firstChapter = chapterPlans[0];
    const totalEvents = chapterPlans.reduce((sum, cp) => sum + cp.events.length, 0);
    const endingNames = endingNodes.length > 0
      ? endingNodes.map(n => n.label).join(' / ')
      : "待生成";

    // Step 2: Characters
    const coreVarNames = variables.length > 0
      ? variables.slice(0, 3).map(v => v.name).join(' · ')
      : "待生成";

    // Type labels for props
    const propTypeLabels: Record<string, string> = {
      key_item: "关键道具", tool: "工具", weapon: "武器", consumable: "消耗品",
    };

    return {
      1: {
        heading: "故事大纲",
        summary: `已从剧本中提炼出主线框架、核心冲突与${branchPaths.length || 0}条分支路线。`,
        items: [
          { label: "主线标题",  value: title,                              sub: genre },
          { label: "章节结构",  value: firstChapter
              ? `${firstChapter.title}（共${firstChapter.events.length}场）`
              : "待生成",        sub: `${chapterPlans.length}章 · ${totalEvents}场` },
          { label: "分支路线",  value: branchPaths.length > 0
              ? branchPaths.slice(0, 2).map(bp => bp.label).join(' / ')
              : "待生成" },
          { label: "结局数量",  value: `${endingNodes.length}个结局（${endingNames}）`,
              sub: `${goodEndings.length}好/${badEndings.length}坏` },
        ],
      },
      2: {
        heading: "角色设定",
        summary: `已提炼${characters.length}位角色的性格、外貌与关系网络。`,
        items: [
          ...characters.map(c => ({
            label: c.name,
            value: c.description,
            sub: `出现${c.appearNodes.length}节点 · ${c.role}`,
          })),
          { label: "核心变量", value: coreVarNames, sub: "关联角色行为" },
        ],
      },
      3: {
        heading: "场景设定",
        summary: `已分析${scenes.length}个场景的空间结构、光线与氛围特征。`,
        items: scenes.map(sc => ({
          label: sc.name,
          value: `${sc.location}·${sc.atmosphere}`,
          sub: `${sc.lighting}·出现${sc.refNodes.length}节点`,
        })),
      },
      4: {
        heading: "道具设定",
        summary: `已提取${props.length}个关键道具与变量绑定关系。`,
        items: props.map(p => ({
          label: p.name,
          value: p.description,
          sub: `${propTypeLabels[p.type] || p.type}·影响${p.refNodes.length}节点`,
        })),
      },
      5:  { heading: "互动节点图", summary: `共${storyNodes.length}个节点、${nodeEdges.length}条连线。`, items: [] },
      6:  { heading: "选择项与变量", summary: `已定义${variables.length}个追踪变量。`, items: [] },
      7:  { heading: "多结局系统", summary: `已规划${endingNodes.length}个结局节点。`, items: [] },
      8:  { heading: "逻辑连通性检查", summary: "等待结局系统完成后，LogicAgent 将检查所有路径连通性。", items: [] },
      9:  { heading: "素材需求清单", summary: "等待逻辑检查完成后，AssetAgent 将生成各节点素材需求。", items: [] },
      10: { heading: "发布前完整校验", summary: "等待所有步骤完成后，PublishAgent 将执行最终校验。", items: [] },
    };
  }, [currentProject, projectName, characters, scenes, props, branchPaths, variables, storyNodes, chapterPlans, nodeEdges]);

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

  // ── Handlers for inline editing ─────────────────────────────────────────

  /** Save an edited item to the store (steps 2-4) or show a toast (step 1) */
  const handleSaveItem = (step: number, index: number, editingItems: Record<number, ArtifactItem>) => {
    const editItem = editingItems[index];
    if (!editItem) return;

    if (step === 1) {
      // Step 1 is just local edits with a toast confirmation
      addToast({ type: "success", title: "已保存修改", message: "大纲编辑已保存" });
      return;
    }

    if (step === 2) {
      // Characters: index maps to characters array; last item is "core variables" (not a character)
      if (index < characters.length) {
        const charId = characters[index].id;
        // sub format: "出现N节点 · role" — extract role after the "·"
        const roleMatch = editItem.sub?.match(/·\s*(.+)$/);
        updateCharacter(charId, {
          name: editItem.label,
          description: editItem.value,
          ...(roleMatch ? { role: roleMatch[1].trim() } : {}),
        });
        addToast({ type: "success", title: "角色已更新", message: editItem.label });
      } else {
        // "Core variables" item — no store action
        addToast({ type: "success", title: "已保存修改" });
      }
      return;
    }

    if (step === 3) {
      // Scenes: value format = "location·atmosphere"; sub format = "lighting·出现N节点"
      if (index < scenes.length) {
        const sceneId = scenes[index].id;
        const parts = editItem.value.split('·');
        const lightingMatch = editItem.sub?.match(/^(.+?)·/);
        updateScene(sceneId, {
          name: editItem.label,
          location: parts[0] || editItem.value,
          atmosphere: parts.slice(1).join('·') || '',
          ...(lightingMatch ? { lighting: lightingMatch[1] } : {}),
        });
        addToast({ type: "success", title: "场景已更新", message: editItem.label });
      }
      return;
    }

    if (step === 4) {
      // Props: sub format = "typeLabel·影响N节点"
      if (index < props.length) {
        const propId = props[index].id;
        const typeMatch = editItem.sub?.match(/^(.+?)·/);
        const reverseTypeLabels: Record<string, string> = {
          "关键道具": "key_item", "工具": "tool", "武器": "weapon", "消耗品": "consumable",
        };
        updateProp(propId, {
          name: editItem.label,
          description: editItem.value,
          ...(typeMatch ? { type: (reverseTypeLabels[typeMatch[1]] || typeMatch[1]) as 'key_item' | 'tool' | 'weapon' | 'consumable' } : {}),
        });
        addToast({ type: "success", title: "道具已更新", message: editItem.label });
      }
      return;
    }
  };

  /** Add a new placeholder item to the store (steps 2-4) */
  const handleAddItem = (step: number) => {
    if (step === 2) {
      addCharacter({
        id: `char-new-${Date.now()}`,
        name: "新角色",
        role: "配角",
        description: "请编辑角色描述...",
        appearNodes: [],
        color: S.primary,
        emoji: "👤",
        emotionStates: [],
        visualPrompt: "",
      });
      addToast({ type: "info", title: "已添加新角色", message: "请在列表中编辑角色信息" });
    } else if (step === 3) {
      addScene({
        id: `scene-new-${Date.now()}`,
        name: "新场景",
        location: "未设定",
        lighting: "自然光",
        atmosphere: "未设定",
        refNodes: [],
        hasImage: false,
        visualPrompt: "",
      });
      addToast({ type: "info", title: "已添加新场景", message: "请在列表中编辑场景信息" });
    } else if (step === 4) {
      addProp({
        id: `prop-new-${Date.now()}`,
        name: "新道具",
        type: "key_item",
        description: "请编辑道具描述...",
        gameplayEffect: "",
        refNodes: [],
        hasImage: false,
      });
      addToast({ type: "info", title: "已添加新道具", message: "请在列表中编辑道具信息" });
    }
  };

  /** Approve a single item AND write to Store */
  const handleApproveItem = (step: number, index: number, key: string) => {
    setReviewItems(prev => ({ ...prev, [key]: "approved" }));
    // Write approved data to Store based on step
    if (step === 2 && index < characters.length) {
      const c = characters[index];
      updateCharacter(c.id, { name: c.name, description: c.description });
    } else if (step === 3 && index < scenes.length) {
      const sc = scenes[index];
      updateScene(sc.id, { name: sc.name });
    } else if (step === 4 && index < props.length) {
      const p = props[index];
      updateProp(p.id, { name: p.name, description: p.description });
    }
  };

  /** Approve all items in a given step AND write to Store */
  const handleConfirmAll = (step: number) => {
    const items = ARTIFACTS[step]?.items || [];
    items.forEach((item, index) => {
      const key = `${step}-${item.label}`;
      setReviewItems(prev => ({ ...prev, [key]: "approved" }));
      // Write each item to Store
      if (step === 2 && index < characters.length) {
        updateCharacter(characters[index].id, { name: characters[index].name });
      } else if (step === 3 && index < scenes.length) {
        updateScene(scenes[index].id, { name: scenes[index].name });
      } else if (step === 4 && index < props.length) {
        updateProp(props[index].id, { name: props[index].name, description: props[index].description });
      }
    });
    addToast({ type: "success", title: "全部确认并写入", message: `第 ${step} 步的 ${items.length} 项产出已写入 Store` });
  };

  return (
    <div className="h-svh flex flex-col" style={{ background: S.bg }}>
      <UpstreamReadiness currentPath={pathname} />

      {/* ── 放大管线进度条 ─────────────────────────────────────────────── */}
      <div className="shrink-0 px-4 py-3 border-b" style={{ borderColor: S.border, background: S.card }}>
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[10px] uppercase tracking-wider font-bold" style={{ color: S.text3 }}>
            制作进度
          </span>
          <button
            onClick={() => setShowExecLog(!showExecLog)}
            className="flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-lg border transition-colors focus:outline-none"
            style={{
              color: showExecLog ? "#5E50E8" : "#8892B0",
              borderColor: showExecLog ? "#5E50E8" : "#E2E5F0",
              background: showExecLog ? "rgba(94,80,232,0.08)" : "transparent",
            }}
          >
            <Terminal size={10} />
            执行日志
          </button>
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
              <button onClick={() => setShowExecLog(false)} className="ml-auto text-xs focus:outline-none" style={{ color: "#64748B" }}>✕</button>
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
                onApprove={(key) => {
                  const stepN = parseInt(key.split("-")[0]);
                  const items = ARTIFACTS[stepN]?.items || [];
                  const idx = items.findIndex(it => `${stepN}-${it.label}` === key);
                  handleApproveItem(stepN, idx >= 0 ? idx : 0, key);
                }}
                onReject={(key) => setReviewItems(prev => ({ ...prev, [key]: "rejected" }))}
                reviewMode={reviewMode}
                onEditItem={(index, field, newValue) => {
                  // Edit tracking is handled internally by StepArtifact via its local state.
                  // This callback allows the parent to react to individual field changes if needed.
                }}
                onSaveItem={(index, editingItems) => {
                  handleSaveItem(viewStep, index, editingItems);
                }}
                onAddItem={() => handleAddItem(viewStep)}
                onConfirmAll={() => handleConfirmAll(viewStep)}
              />
            </motion.div>
          </AnimatePresence>

          {/* ── 底部操作栏 ──────────────────────────────────────────── */}
          <div className="shrink-0 px-4 py-3 border-t flex items-center gap-2"
            style={{ borderColor: S.border, background: S.card }}>
            <motion.button whileTap={{ scale:0.97 }}
              onClick={() => {
                if (viewStep < 10) { setViewStep(viewStep + 1); }
                else { addToast({ type: "success", title: "管线完成", message: "所有步骤已完成" }); }
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white focus:outline-none"
              style={{ background: S.primary, boxShadow:`0 2px 8px ${S.primary}30` }}>
              ▶ 继续执行
            </motion.button>
            <motion.button whileTap={{ scale:0.97 }}
              onClick={() => {
                addToast({ type: "info", title: "AI 重新解构", message: "正在基于最新剧本重新分析，请稍候..." });
                setTimeout(() => addToast({ type: "success", title: "解构完成", message: "已更新角色/场景/道具分析结果" }), 2000);
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium focus:outline-none"
              style={{ background: S.s2, border:`1px solid ${S.border}`, color: S.text2 }}>
              <RotateCcw size={11}/> 重新生成
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
        </div>
      </div>
      <ContextualActions actions={[
        { icon: Eye, label: reviewMode ? "退出审核" : "审核产出", onClick: () => setReviewMode(!reviewMode) },
        { icon: Plus, label: "手动添加", onClick: () => handleAddItem(viewStep) },
        { icon: ArrowRight, label: "前往剧本编辑", href: "/script" },
      ]} />
    </div>
  );
}
