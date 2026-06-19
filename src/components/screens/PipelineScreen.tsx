import { useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, AlertTriangle, ChevronRight,
  ArrowRight, AlertCircle, ExternalLink, Clock, Zap,
  Shield, Eye, ChevronLeft, Sparkles, CircleDot,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import {
  INDUSTRY_TEMPLATES, INDUSTRY_LABELS, PIPELINE_STAGES,
  type PipelineStage, type IndustryType,
} from "@/lib/studio-data";
import { useNarrativeStore, useUIStore } from "@/store";
import { SkillContextBar } from "@/components/ui/SkillContextBar";
import { PipelineStatus, usePipelineStages, type StageInfo } from "@/components/ui/PipelineStatus";

const S = {
  bg: "#FAFBFF", card: "#FFFFFF", s2: "#F4F6FC", s3: "#EDF0F8",
  border: "#E2E5F0", border2: "#CBD0E5",
  primary: "#5E50E8", primary10: "rgba(94,80,232,0.10)", primary20: "rgba(94,80,232,0.20)",
  accent: "#00A99D", accent10: "rgba(0,169,157,0.10)",
  text: "#1A1D2E", text2: "#4A5068", text3: "#8892B0",
  success: "#059669", success10: "rgba(5,150,105,0.10)",
  warning: "#D97706", warning10: "rgba(217,119,6,0.10)",
  error: "#DC2626", error10: "rgba(220,38,38,0.10)",
};

const STATUS_CFG: Record<PipelineStage['status'], { color: string; bg: string; label: string }> = {
  completed: { color: S.success, bg: `${S.success}10`, label: '已完成' },
  active:    { color: S.primary, bg: `${S.primary}10`, label: '进行中' },
  upcoming:  { color: S.text3, bg: S.s2, label: '待开始' },
  blocked:   { color: S.error, bg: `${S.error}10`, label: '阻塞' },
};

const LINK_LABELS: Record<string, string> = {
  '/settings': '项目设置',
  '/parse': '素材解构',
  '/script': '剧本编辑',
  '/nodes': '节点图谱',
  '/assets': '资产管理',
  '/simulator': '试玩预览',
  '/overview': '项目概览',
  '/publish': '发布管理',
};

const INDUSTRY_SWITCHER: { type: IndustryType; icon: string; label: string }[] = [
  { type: 'game', icon: '🎮', label: '游戏' },
  { type: 'tourism', icon: '🏛️', label: '文旅' },
  { type: 'education', icon: '🎓', label: '教育' },
  { type: 'derivative', icon: '🎬', label: '衍生' },
];

const STEP_ICONS = ['📋', '📥', '🔍', '🗺️', '✏️', '🎨', '⚙️', '🔧', '🎵', '▶️', '✅', '🚀'];

// ── 根据行业模板生成管线阶段 ──────────────────────────────────────────
function generateIndustryStages(
  industry: IndustryType,
  pipelineStages: PipelineStage[],
  stageProgress: number[],
): PipelineStage[] {
  if (industry === 'game') return pipelineStages;
  const template = INDUSTRY_TEMPLATES.find(t => t.industryType === industry);
  if (!template) return pipelineStages;

  const steps = template.workflow;

  return steps.map((step, i) => {
    const progress = stageProgress[i] ?? 0;
    let status: PipelineStage['status'];
    if (progress >= 100) {
      status = 'completed';
    } else if (progress > 0) {
      status = 'active';
    } else {
      status = 'upcoming';
    }

    return {
      id: `ind-${industry}-${i}`,
      order: i + 1,
      name: step.step,
      description: step.description,
      icon: STEP_ICONS[i % STEP_ICONS.length],
      status,
      progress,
      artifacts: status === 'completed' ? [`${step.step}产出`] : [],
      issues: [],
      nextAction: status === 'completed' ? '已完成' : status === 'active' ? `继续${step.step}` : `等待${step.step}`,
      requiresHumanConfirm: false,
    };
  });
}

// ── 阶段卡片组件 ────────────────────────────────────────────────────────
function StageCard({ stage, isSelected, onClick }: {
  stage: PipelineStage;
  isSelected: boolean;
  onClick: () => void;
}) {
  const cfg = STATUS_CFG[stage.status];
  const isDone = stage.status === 'completed';
  const isActive = stage.status === 'active';

  return (
    <motion.button
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="shrink-0 w-[160px] rounded-xl p-3 text-left focus:outline-none transition-shadow"
      style={{
        background: S.card,
        border: `1.5px solid ${isSelected ? S.primary : S.border}`,
        boxShadow: isSelected ? `0 0 0 3px ${S.primary10}` : '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      {/* Header: order + icon + status */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded"
            style={{ background: S.s2, color: S.text3 }}>
            {String(stage.order).padStart(2, '0')}
          </span>
          <span className="text-base">{stage.icon}</span>
        </div>
        <div className="flex items-center gap-1">
          {stage.requiresHumanConfirm && (
            <span className="text-[7px] font-bold px-1 py-0.5 rounded"
              style={{ background: S.warning10, color: S.warning }}>
              需确认
            </span>
          )}
          <span className="text-[8px] font-bold px-1.5 py-0.5 rounded"
            style={{ background: cfg.bg, color: cfg.color }}>
            {cfg.label}
          </span>
        </div>
      </div>

      {/* Name */}
      <h4 className="text-[11px] font-bold mb-1.5 leading-tight" style={{ color: S.text }}>
        {stage.name}
      </h4>

      {/* Progress bar */}
      <div className="flex items-center gap-1.5">
        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: S.s3 }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${stage.progress}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="h-full rounded-full"
            style={{
              background: isDone ? S.success : isActive ? S.primary : stage.status === 'blocked' ? S.error : S.border2,
            }}
          />
        </div>
        <span className="text-[9px] font-mono font-bold" style={{ color: cfg.color }}>
          {stage.progress}%
        </span>
      </div>

      {/* Active pulse indicator */}
      {isActive && (
        <div className="flex items-center gap-1 mt-1.5">
          <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: S.primary }} />
          <span className="text-[8px]" style={{ color: S.text3 }}>进行中</span>
        </div>
      )}
    </motion.button>
  );
}

// ── 详情面板组件 ────────────────────────────────────────────────────────
function StageDetail({ stage }: { stage: PipelineStage }) {
  const cfg = STATUS_CFG[stage.status];

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className="overflow-hidden"
    >
      <div className="p-4 rounded-xl" style={{ background: S.card, border: `1px solid ${S.border}` }}>
        {/* Header */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
            style={{ background: cfg.bg }}>
            {stage.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded"
                style={{ background: S.s2, color: S.text3 }}>
                阶段 {String(stage.order).padStart(2, '0')}
              </span>
              <h3 className="text-sm font-bold" style={{ color: S.text }}>{stage.name}</h3>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded"
                style={{ background: cfg.bg, color: cfg.color }}>
                {cfg.label}
              </span>
              {stage.requiresHumanConfirm && (
                <span className="text-[9px] font-bold px-2 py-0.5 rounded flex items-center gap-0.5"
                  style={{ background: S.warning10, color: S.warning }}>
                  <Shield size={9} /> 需人工确认
                </span>
              )}
            </div>
            <p className="text-[10px] mt-0.5" style={{ color: S.text2 }}>{stage.description}</p>
          </div>
          <div className="text-right shrink-0">
            <span className="text-lg font-mono font-black" style={{ color: cfg.color }}>{stage.progress}%</span>
            <div className="h-1.5 w-20 rounded-full overflow-hidden mt-1" style={{ background: S.s3 }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${stage.progress}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{ background: cfg.color }}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Artifacts */}
          <div className="p-3 rounded-lg" style={{ background: S.s2, border: `1px solid ${S.border}` }}>
            <div className="flex items-center gap-1.5 mb-2">
              <CheckCircle2 size={11} style={{ color: S.success }} />
              <span className="text-[10px] font-bold" style={{ color: S.text }}>已产出物</span>
              <span className="text-[8px] font-mono px-1 py-0.5 rounded"
                style={{ background: S.success10, color: S.success }}>
                {stage.artifacts.length}
              </span>
            </div>
            <div className="space-y-1">
              {stage.artifacts.map((a, i) => (
                <div key={i} className="flex items-center gap-1.5 text-[9px]" style={{ color: S.text2 }}>
                  <div className="w-1 h-1 rounded-full shrink-0" style={{ background: S.success }} />
                  {a}
                </div>
              ))}
            </div>
          </div>

          {/* Issues */}
          <div className="p-3 rounded-lg" style={{ background: S.s2, border: `1px solid ${S.border}` }}>
            <div className="flex items-center gap-1.5 mb-2">
              <AlertTriangle size={11} style={{ color: stage.issues.length > 0 ? S.warning : S.success }} />
              <span className="text-[10px] font-bold" style={{ color: S.text }}>当前问题</span>
              <span className="text-[8px] font-mono px-1 py-0.5 rounded"
                style={{
                  background: stage.issues.length > 0 ? S.warning10 : S.success10,
                  color: stage.issues.length > 0 ? S.warning : S.success,
                }}>
                {stage.issues.length}
              </span>
            </div>
            {stage.issues.length === 0 ? (
              <div className="flex items-center gap-1.5 text-[9px]" style={{ color: S.success }}>
                <CheckCircle2 size={9} />
                无阻塞问题
              </div>
            ) : (
              <div className="space-y-1">
                {stage.issues.map((issue, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-[9px]" style={{ color: S.warning }}>
                    <AlertCircle size={9} className="shrink-0 mt-0.5" />
                    <span style={{ color: S.text2 }}>{issue}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Next action + link */}
        <div className="flex items-center justify-between mt-3 p-3 rounded-lg"
          style={{ background: `linear-gradient(135deg,${S.primary}06,${S.accent}06)`, border: `1px solid ${S.primary}15` }}>
          <div className="flex items-center gap-2">
            <Sparkles size={12} style={{ color: S.primary }} />
            <div>
              <span className="text-[8px] font-bold uppercase tracking-wider" style={{ color: S.text3 }}>下一步操作</span>
              <p className="text-[10px] font-bold" style={{ color: S.text }}>{stage.nextAction}</p>
            </div>
          </div>
          {stage.linkedPage && stage.status !== 'completed' && (
            <Link to={stage.linkedPage}>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold text-white shrink-0 focus:outline-none"
                style={{ background: S.primary, boxShadow: `0 2px 8px ${S.primary}30` }}
              >
                前往{LINK_LABELS[stage.linkedPage] || stage.linkedPage} <ArrowRight size={11} />
              </motion.button>
            </Link>
          )}
          {stage.linkedPage && stage.status === 'completed' && (
            <Link to={stage.linkedPage}>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold shrink-0 focus:outline-none"
                style={{ background: S.s2, color: S.text2, border: `1px solid ${S.border}` }}
              >
                查看{LINK_LABELS[stage.linkedPage] || stage.linkedPage} <ExternalLink size={10} />
              </motion.button>
            </Link>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ── 6-Stage Pipeline Detail Row ─────────────────────────────────────────
function SixStageDetail({ stages }: { stages: StageInfo[] }) {
  const completedCount = stages.filter(s => s.status === "completed").length;
  const blockedStages = stages.filter(s => s.status === "blocked");

  return (
    <>
      {/* ── PipelineStatus Widget (6-stage overview) ── */}
      <PipelineStatus compact={false} showNextStep={true} />

      {/* ── 详细进度 — 6 core stages with metrics ── */}
      <div className="rounded-xl p-4" style={{ background: S.card, border: `1px solid ${S.border}` }}>
        <div className="flex items-center gap-2 mb-4">
          <Eye size={14} style={{ color: S.primary }} />
          <h3 className="text-xs font-bold" style={{ color: S.text }}>详细进度</h3>
          <span className="text-[9px]" style={{ color: S.text3 }}>
            {completedCount}/{stages.length} 核心阶段已完成
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {stages.map((stage, i) => {
            const isCompleted = stage.status === "completed";
            const isBlocked = stage.status === "blocked";
            const isActive = stage.status === "active";
            const Icon = stage.icon;
            const stageColor = isCompleted ? S.success : isBlocked ? S.warning : isActive ? S.primary : S.text3;
            const progressPct = isCompleted ? 100 : isBlocked ? 0 : isActive ? 50 : 0;

            return (
              <motion.div
                key={stage.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, duration: 0.25 }}
                className="p-3 rounded-lg"
                style={{
                  background: S.s2,
                  border: `1px solid ${isCompleted ? `${S.success}20` : isBlocked ? `${S.warning}20` : isActive ? `${S.primary}20` : S.border}`,
                }}
              >
                {/* Stage header */}
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: `${stageColor}12` }}>
                    <Icon size={14} style={{ color: stageColor }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold" style={{ color: S.text }}>{stage.name}</span>
                      <span className="text-[7px] font-bold px-1 py-0.5 rounded"
                        style={{ background: `${stageColor}15`, color: stageColor }}>
                        {isCompleted ? "已完成" : isBlocked ? "阻塞" : isActive ? "进行中" : "待开始"}
                      </span>
                    </div>
                    <span className="text-[8px]" style={{ color: S.text3 }}>{stage.metrics}</span>
                  </div>
                  <Link to={stage.link}>
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className="flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-bold text-white shrink-0 focus:outline-none"
                      style={{
                        background: isCompleted ? S.text3 : S.primary,
                        boxShadow: isCompleted ? "none" : `0 2px 6px ${S.primary}25`,
                      }}
                    >
                      前往 <ArrowRight size={9} />
                    </motion.button>
                  </Link>
                </div>

                {/* Progress bar */}
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: `${S.border}80` }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPct}%` }}
                    transition={{ duration: 0.6, ease: "easeOut", delay: i * 0.06 }}
                    className="h-full rounded-full"
                    style={{
                      background: isCompleted
                        ? S.success
                        : isBlocked
                          ? S.warning
                          : isActive
                            ? `linear-gradient(to right,${S.primary},${S.accent})`
                            : S.border2,
                    }}
                  />
                </div>

                {/* Blocked reason */}
                {stage.blockedReason && (
                  <div className="flex items-center gap-1 mt-1.5">
                    <AlertTriangle size={8} style={{ color: S.warning }} />
                    <span className="text-[8px]" style={{ color: S.warning }}>{stage.blockedReason}</span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ── 阻塞诊断 ── */}
      {blockedStages.length > 0 && (
        <div className="rounded-xl p-4" style={{ background: S.card, border: `1px solid ${S.border}` }}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center"
              style={{ background: `${S.warning}12` }}>
              <AlertTriangle size={13} style={{ color: S.warning }} />
            </div>
            <div>
              <h3 className="text-xs font-bold" style={{ color: S.text }}>阻塞诊断</h3>
              <p className="text-[9px]" style={{ color: S.text3 }}>
                {blockedStages.length} 个阶段被前置依赖阻塞
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {blockedStages.map((stage) => (
              <motion.div
                key={stage.id}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-start gap-3 px-3 py-2.5 rounded-lg"
                style={{
                  background: `${S.warning}06`,
                  border: `1px solid ${S.warning}18`,
                }}
              >
                <AlertTriangle size={12} style={{ color: S.warning, marginTop: 1, flexShrink: 0 }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold" style={{ color: S.text }}>
                      {stage.emoji} {stage.name}
                    </span>
                    <span className="text-[8px] font-bold px-1.5 py-0.5 rounded"
                      style={{ background: `${S.warning}15`, color: S.warning }}>
                      阻塞
                    </span>
                  </div>
                  <p className="text-[9px] mt-0.5" style={{ color: S.text2 }}>
                    {stage.blockedReason}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Link to={stage.link}>
                      <motion.span
                        whileHover={{ x: 2 }}
                        className="text-[9px] font-bold cursor-pointer flex items-center gap-0.5 focus:outline-none"
                        style={{ color: S.primary }}
                      >
                        前往处理 <ArrowRight size={8} />
                      </motion.span>
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

// ── 阻塞问题汇总组件 ──────────────────────────────────────────────────
function BlockingIssuesSummary({ stages }: { stages: PipelineStage[] }) {
  const stagesWithIssues = stages.filter(s => s.issues.length > 0);
  if (stagesWithIssues.length === 0) return null;

  // Flatten and sort: blocked stages first, then active, then upcoming
  const severityOrder: Record<PipelineStage['status'], number> = {
    blocked: 0, active: 1, upcoming: 2, completed: 3,
  };

  const allIssues: { issue: string; stage: PipelineStage; severity: number }[] = [];
  stagesWithIssues.forEach(stage => {
    stage.issues.forEach(issue => {
      allIssues.push({ issue, stage, severity: severityOrder[stage.status] });
    });
  });
  allIssues.sort((a, b) => a.severity - b.severity);

  return (
    <div className="rounded-xl p-4" style={{ background: S.card, border: `1px solid ${S.border}` }}>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-lg flex items-center justify-center"
          style={{ background: S.warning10 }}>
          <AlertTriangle size={13} style={{ color: S.warning }} />
        </div>
        <div>
          <h3 className="text-xs font-bold" style={{ color: S.text }}>阻塞与建议</h3>
          <p className="text-[9px]" style={{ color: S.text3 }}>
            {allIssues.length} 项待处理问题，按严重程度排序
          </p>
        </div>
      </div>

      <div className="space-y-1.5">
        {allIssues.map((item, i) => {
          const cfg = STATUS_CFG[item.stage.status];
          return (
            <div key={i} className="flex items-start gap-2 px-3 py-2 rounded-lg"
              style={{
                background: item.severity === 0 ? S.error10 : item.severity === 1 ? S.warning10 : S.s2,
                border: `1px solid ${item.severity === 0 ? `${S.error}20` : item.severity === 1 ? `${S.warning}20` : S.border}`,
              }}>
              {item.severity === 0
                ? <AlertCircle size={11} style={{ color: S.error, marginTop: 1, flexShrink: 0 }} />
                : <AlertTriangle size={11} style={{ color: S.warning, marginTop: 1, flexShrink: 0 }} />}
              <div className="flex-1 min-w-0">
                <p className="text-[9px] font-bold" style={{ color: S.text }}>{item.issue}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[8px] px-1 py-0.5 rounded"
                    style={{ background: cfg.bg, color: cfg.color }}>
                    {item.stage.icon} {item.stage.name}
                  </span>
                  {item.stage.linkedPage && (
                    <Link to={item.stage.linkedPage} className="text-[8px] flex items-center gap-0.5"
                      style={{ color: S.primary }}>
                      前往处理 <ExternalLink size={7} />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── 主页面 ──────────────────────────────────────────────────────────────
export default function PipelineScreen() {
  const [selectedId, setSelectedId] = useState<string | null>('stage-06');
  const industry = useUIStore(state => state.industry);
  const setIndustry = useUIStore(state => state.setIndustry);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Narrative store selectors for pipeline data and progress calculation
  const pipelineStages = useNarrativeStore(state => state.pipelineStages);
  const storyNodes = useNarrativeStore(state => state.storyNodes);
  const variables = useNarrativeStore(state => state.variables);
  const characters = useNarrativeStore(state => state.characters);
  const qualityChecks = useNarrativeStore(state => state.qualityChecks);
  const chapterPlans = useNarrativeStore(state => state.chapterPlans);
  const scenes = useNarrativeStore(state => state.scenes);
  const worldBuilding = useNarrativeStore(state => state.worldBuilding);

  // 6-stage core pipeline status
  const { stages: sixStages } = usePipelineStages();

  // Deterministic stage progress based on actual data availability
  const stageProgress = useMemo(() => {
    const hasNodes = storyNodes.length > 0;
    const hasVars = variables.length > 0;
    const hasChars = characters.length > 0;
    const hasQuality = qualityChecks.length > 0;
    const hasPlans = chapterPlans.length > 0;
    const hasScenes = scenes.length > 0;
    const hasWorld = worldBuilding.length > 0;

    // Map each template workflow step to a data-completeness check.
    // Step names come from INDUSTRY_TEMPLATES workflow definitions.
    return INDUSTRY_TEMPLATES
      .find(t => t.industryType === industry)
      ?.workflow.map((step) => {
        const name = step.step;
        if (name.includes('解构') || name.includes('素材')) return hasNodes ? 100 : 0;
        if (name.includes('角色') || name.includes('人物')) return hasChars ? 100 : 0;
        if (name.includes('世界观') || name.includes('世界')) return hasWorld ? 100 : 0;
        if (name.includes('场景') || name.includes('空间')) return hasScenes ? 100 : 0;
        if (name.includes('剧本') || name.includes('叙事')) return hasPlans ? 100 : 0;
        if (name.includes('变量') || name.includes('逻辑')) return hasVars ? 100 : 0;
        if (name.includes('质检') || name.includes('测试')) return hasQuality ? 100 : 0;
        // Default: stages not yet mapped to data show as 0
        return 0;
      }) ?? [];
  }, [industry, storyNodes, variables, characters, qualityChecks, chapterPlans, scenes, worldBuilding]);

  const currentStages = useMemo(
    () => generateIndustryStages(industry, pipelineStages, stageProgress),
    [industry, pipelineStages, stageProgress]
  );
  const currentTemplate = INDUSTRY_TEMPLATES.find(t => t.industryType === industry);

  const selected = currentStages.find(s => s.id === selectedId) ?? null;

  const completedCount = currentStages.filter(s => s.status === 'completed').length;
  const activeCount = currentStages.filter(s => s.status === 'active').length;
  const upcomingCount = currentStages.filter(s => s.status === 'upcoming').length;
  const blockedCount = currentStages.filter(s => s.status === 'blocked').length;

  const totalProgress = Math.round(
    currentStages.reduce((sum, s) => sum + s.progress, 0) / currentStages.length
  );

  const handleScroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = dir === 'left' ? -200 : 200;
    scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
  };

  const handleIndustryChange = (newIndustry: IndustryType) => {
    setIndustry(newIndustry);
    setSelectedId(null);
  };

  const pipelineLabel = industry === 'game'
    ? '制作管线'
    : INDUSTRY_LABELS.pipeline[industry];

  return (
    <div className="min-h-svh overflow-y-auto" style={{ background: S.bg }}>

      {/* ── 顶部概览条 ── */}
      <div className="sticky top-0 z-20 px-5 py-3"
        style={{ background: 'rgba(250,251,255,0.92)', backdropFilter: 'blur(12px)', borderBottom: `1px solid ${S.border}` }}>
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: `linear-gradient(135deg,${S.primary},${S.accent})` }}>
                <Zap size={15} className="text-white" />
              </div>
              <div>
                <h2 className="text-sm font-bold" style={{ color: S.text }}>{pipelineLabel}</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[9px] flex items-center gap-0.5" style={{ color: S.success }}>
                    <CheckCircle2 size={9} /> {completedCount} 已完成
                  </span>
                  <span className="text-[9px] flex items-center gap-0.5" style={{ color: S.primary }}>
                    <CircleDot size={9} /> {activeCount} 进行中
                  </span>
                  <span className="text-[9px] flex items-center gap-0.5" style={{ color: S.text3 }}>
                    <Clock size={9} /> {upcomingCount} 待开始
                  </span>
                  {blockedCount > 0 && (
                    <span className="text-[9px] flex items-center gap-0.5" style={{ color: S.error }}>
                      <AlertCircle size={9} /> {blockedCount} 阻塞
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="flex items-center gap-2">
                  <span className="text-[9px]" style={{ color: S.text3 }}>总进度</span>
                  <div className="h-2 w-32 rounded-full overflow-hidden" style={{ background: S.s3 }}>
                    <motion.div
                      key={`progress-${industry}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${totalProgress}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className="h-full rounded-full"
                      style={{ background: `linear-gradient(to right,${S.primary},${S.accent})` }}
                    />
                  </div>
                  <span className="text-xs font-mono font-black" style={{ color: S.primary }}>{totalProgress}%</span>
                </div>
                <span className="text-[8px]" style={{ color: S.text3 }}>
                  {currentStages.length} 阶段 / {completedCount} 完成 / {activeCount} 活跃
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Skill Context Bar ── */}
      {selected && (
        <SkillContextBar
          stageIndex={selected.order - 1}
          onViewSkill={() => {}}
          onOpenLibrary={() => {}}
        />
      )}

      <div className="max-w-5xl mx-auto px-5 py-5 space-y-5">

        {/* ── 6-Stage Core Pipeline Overview ── */}
        <SixStageDetail stages={sixStages} />

        {/* ── 行业切换栏 ── */}
        <div className="flex items-center gap-2">
          {INDUSTRY_SWITCHER.map(item => {
            const active = industry === item.type;
            return (
              <motion.button
                key={item.type}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleIndustryChange(item.type)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-bold transition-colors focus:outline-none"
                style={{
                  background: active ? S.primary : S.s2,
                  color: active ? '#fff' : S.text2,
                  border: `1.5px solid ${active ? S.primary : S.border}`,
                  boxShadow: active ? `0 2px 8px ${S.primary}30` : 'none',
                }}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </motion.button>
            );
          })}
          <AnimatePresence>
            {industry !== 'game' && currentTemplate && (
              <motion.span
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                className="text-[9px] ml-2"
                style={{ color: S.text3 }}
              >
                {currentTemplate.description}
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* ── 管线流程图 ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Eye size={14} style={{ color: S.primary }} />
              <h3 className="text-xs font-bold" style={{ color: S.text }}>
                {currentStages.length} 阶段{industry === 'game' ? '生产管线' : '制作流程'}
              </h3>
              <span className="text-[9px]" style={{ color: S.text3 }}>点击阶段查看详情</span>
            </div>
            <div className="flex items-center gap-1">
              <motion.button whileTap={{ scale: 0.9 }}
                onClick={() => handleScroll('left')}
                className="w-7 h-7 rounded-lg flex items-center justify-center focus:outline-none"
                style={{ background: S.s2, border: `1px solid ${S.border}` }}>
                <ChevronLeft size={14} style={{ color: S.text3 }} />
              </motion.button>
              <motion.button whileTap={{ scale: 0.9 }}
                onClick={() => handleScroll('right')}
                className="w-7 h-7 rounded-lg flex items-center justify-center focus:outline-none"
                style={{ background: S.s2, border: `1px solid ${S.border}` }}>
                <ChevronRight size={14} style={{ color: S.text3 }} />
              </motion.button>
            </div>
          </div>

          {/* Scrollable card row */}
          <div className="relative">
            {/* Connection line */}
            <div className="absolute top-1/2 left-0 right-0 h-px -translate-y-1/2 pointer-events-none z-0"
              style={{ background: `linear-gradient(to right,${S.success},${S.primary},${S.text3}40)` }} />

            <AnimatePresence mode="wait">
              <motion.div
                key={industry}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="relative z-10"
              >
                <div
                  ref={scrollRef}
                  className="flex gap-3 overflow-x-auto pb-3 pt-1 px-1"
                  style={{ scrollbarWidth: 'thin', scrollbarColor: `${S.border2} transparent` }}
                >
                  {currentStages.map((stage, i) => (
                    <div key={stage.id} className="flex items-center gap-1.5">
                      <StageCard
                        stage={stage}
                        isSelected={selectedId === stage.id}
                        onClick={() => setSelectedId(selectedId === stage.id ? null : stage.id)}
                      />
                      {i < currentStages.length - 1 && (
                        <ArrowRight size={12} className="shrink-0" style={{ color: S.border2 }} />
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Status legend */}
          <div className="flex items-center gap-4 mt-2 justify-center">
            {Object.entries(STATUS_CFG).map(([key, cfg]) => (
              <div key={key} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: cfg.color }} />
                <span className="text-[9px]" style={{ color: S.text3 }}>{cfg.label}</span>
              </div>
            ))}
            {industry === 'game' && (
              <div className="flex items-center gap-1.5">
                <span className="text-[8px] font-bold px-1.5 py-0.5 rounded"
                  style={{ background: S.warning10, color: S.warning }}>需确认</span>
                <span className="text-[9px]" style={{ color: S.text3 }}>需人工审核</span>
              </div>
            )}
          </div>
        </div>

        {/* ── 展开的详情面板 ── */}
        <AnimatePresence mode="wait">
          {selected && (
            <div key={selected.id}>
              <StageDetail stage={selected} />
            </div>
          )}
        </AnimatePresence>

        {/* ── 底部阻塞问题汇总 ── */}
        <BlockingIssuesSummary stages={currentStages} />

        {/* ── 管线快速导航 ── */}
        {industry === 'game' ? (
          <div className="rounded-xl p-4"
            style={{ background: `linear-gradient(135deg,${S.primary}08,${S.accent}08)`, border: `1px solid ${S.primary}20` }}>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={14} style={{ color: S.primary }} />
              <h3 className="text-xs font-bold" style={{ color: S.text }}>快速导航</h3>
              <span className="text-[9px]" style={{ color: S.text3 }}>各阶段关联页面</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {PIPELINE_STAGES.filter(s => s.linkedPage).map(stage => {
                const cfg = STATUS_CFG[stage.status];
                return (
                  <Link key={stage.id} to={stage.linkedPage!}>
                    <motion.div
                      whileHover={{ y: -1 }}
                      whileTap={{ scale: 0.97 }}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer"
                      style={{ background: S.card, border: `1px solid ${S.border}` }}
                    >
                      <span className="text-sm">{stage.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="text-[9px] font-bold truncate" style={{ color: S.text }}>
                            {LINK_LABELS[stage.linkedPage!] || stage.linkedPage}
                          </span>
                          <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: cfg.color }} />
                        </div>
                        <span className="text-[8px]" style={{ color: S.text3 }}>{stage.name}</span>
                      </div>
                      <ExternalLink size={9} style={{ color: S.text3 }} />
                    </motion.div>
                  </Link>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="rounded-xl p-4"
            style={{ background: `linear-gradient(135deg,${S.primary}08,${S.accent}08)`, border: `1px solid ${S.primary}20` }}>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={14} style={{ color: S.primary }} />
              <h3 className="text-xs font-bold" style={{ color: S.text }}>工作流步骤</h3>
              <span className="text-[9px]" style={{ color: S.text3 }}>{currentTemplate?.label}</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {currentStages.map(stage => {
                const cfg = STATUS_CFG[stage.status];
                return (
                  <motion.div
                    key={stage.id}
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      setSelectedId(stage.id);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer"
                    style={{ background: S.card, border: `1px solid ${S.border}` }}
                  >
                    <span className="text-sm">{stage.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] font-bold truncate" style={{ color: S.text }}>
                          {stage.name}
                        </span>
                        <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: cfg.color }} />
                      </div>
                      <span className="text-[8px] line-clamp-1" style={{ color: S.text3 }}>{stage.description}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        <div className="h-6" />
      </div>
    </div>
  );
}
