import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, AlertTriangle, Circle, ArrowRight,
  FileText, GitBranch, Image as ImageIcon, Film, Play, Rocket,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useNarrativeStore } from "@/store";

const S = {
  bg: "#FAFBFF", card: "#FFFFFF", s2: "#F4F6FC",
  border: "#E2E5F0", border2: "#CBD0E5",
  primary: "#5E50E8", accent: "#00A99D",
  text: "#1A1D2E", text2: "#4A5068", text3: "#8892B0",
  success: "#059669", warning: "#D97706", error: "#DC2626",
};

// ── Stage definition types ──────────────────────────────────────────────

type StageStatus = "completed" | "active" | "blocked" | "pending";

interface StageInfo {
  id: string;
  name: string;
  icon: typeof FileText;
  emoji: string;
  status: StageStatus;
  blockedReason?: string;
  link: string;
  metrics: string;
}

interface NextStep {
  label: string;
  link: string;
}

// ── Props ────────────────────────────────────────────────────────────────

export interface PipelineStatusProps {
  compact?: boolean;
  showNextStep?: boolean;
}

// ── Stage computation hook ───────────────────────────────────────────────

function usePipelineStages(): { stages: StageInfo[]; nextStep: NextStep | null } {
  const characters = useNarrativeStore(s => s.characters);
  const chapterPlans = useNarrativeStore(s => s.chapterPlans);
  const storyNodes = useNarrativeStore(s => s.storyNodes);
  const nodeEdges = useNarrativeStore(s => s.nodeEdges);
  const variables = useNarrativeStore(s => s.variables);
  const cinematicDirections = useNarrativeStore(s => s.cinematicDirections);
  const scenes = useNarrativeStore(s => s.scenes);

  return useMemo(() => {
    // Stage 1: 文本导入/解构
    const s1Complete = characters.length > 0 && chapterPlans.length > 0;
    const s1: StageInfo = {
      id: "ps-1",
      name: "文本导入/解构",
      icon: FileText,
      emoji: "📥",
      status: s1Complete ? "completed" : "active",
      link: "/parse",
      metrics: `${characters.length} 个角色 · ${chapterPlans.length} 个章纲`,
    };

    // Stage 2: 互动设计
    const s2Complete = storyNodes.length > 3 && nodeEdges.length > 2;
    const s2Blocked = !s1Complete;
    const s2: StageInfo = {
      id: "ps-2",
      name: "互动设计",
      icon: GitBranch,
      emoji: "🗺️",
      status: s2Complete ? "completed" : s2Blocked ? "blocked" : "active",
      blockedReason: s2Blocked ? "需要先完成文本导入/解构" : undefined,
      link: "/nodes",
      metrics: `${storyNodes.length} 个节点 · ${nodeEdges.length} 条连线`,
    };

    // Stage 3: 多模态资产
    const s3Complete = variables.length > 0 && scenes.length > 0;
    const s3Blocked = !s2Complete;
    const s3: StageInfo = {
      id: "ps-3",
      name: "多模态资产",
      icon: ImageIcon,
      emoji: "🎨",
      status: s3Complete ? "completed" : s3Blocked ? "blocked" : "active",
      blockedReason: s3Blocked ? "需要先完成互动设计" : undefined,
      link: "/assets",
      metrics: `${variables.length} 个变量 · ${scenes.length} 个场景`,
    };

    // Stage 4: 演出设计
    const s4Complete = cinematicDirections.length > 0;
    const s4Blocked = !s3Complete;
    const s4: StageInfo = {
      id: "ps-4",
      name: "演出设计",
      icon: Film,
      emoji: "🎬",
      status: s4Complete ? "completed" : s4Blocked ? "blocked" : "active",
      blockedReason: s4Blocked ? "需要先完成多模态资产" : undefined,
      link: "/cinematic",
      metrics: `${cinematicDirections.length} 个演出指令`,
    };

    // Stage 5: 试玩/调试
    const endingNodes = storyNodes.filter(
      n => n.type === "ending_good" || n.type === "ending_bad"
    );
    const s5Complete = endingNodes.length > 0 && s4Complete;
    const s5Blocked = !s4Complete;
    const s5: StageInfo = {
      id: "ps-5",
      name: "试玩/调试",
      icon: Play,
      emoji: "▶️",
      status: s5Complete ? "completed" : s5Blocked ? "blocked" : "active",
      blockedReason: s5Blocked ? "需要先完成演出设计" : undefined,
      link: "/simulator",
      metrics: `${endingNodes.length} 个结局节点`,
    };

    // Stage 6: 发布/打包
    const allAboveComplete = s1Complete && s2Complete && s3Complete && s4Complete && s5Complete;
    const s6: StageInfo = {
      id: "ps-6",
      name: "发布/打包",
      icon: Rocket,
      emoji: "🚀",
      status: allAboveComplete ? "active" : "pending",
      link: "/publish",
      metrics: allAboveComplete ? "所有阶段已完成，可以发布" : "等待所有阶段完成",
    };

    const stages = [s1, s2, s3, s4, s5, s6];

    // Compute next step: first incomplete stage
    const firstIncomplete = stages.find(s => s.status !== "completed");
    let nextStep: NextStep | null = null;
    if (firstIncomplete) {
      const stepMap: Record<string, NextStep> = {
        "ps-1": { label: "导入剧本并开始解构", link: "/parse" },
        "ps-2": { label: "设计故事节点与分支", link: "/nodes" },
        "ps-3": { label: "生成并绑定多模态资产", link: "/assets" },
        "ps-4": { label: "设计演出镜头与节奏", link: "/cinematic" },
        "ps-5": { label: "测试并调试互动体验", link: "/simulator" },
        "ps-6": { label: "准备发布", link: "/publish" },
      };
      nextStep = stepMap[firstIncomplete.id] ?? null;
    }

    return { stages, nextStep };
  }, [characters, chapterPlans, storyNodes, nodeEdges, variables, cinematicDirections, scenes]);
}

// ── Status icon helper ───────────────────────────────────────────────────

function StatusIcon({ status, size = 14 }: { status: StageStatus; size?: number }) {
  switch (status) {
    case "completed":
      return <CheckCircle2 size={size} style={{ color: S.success }} />;
    case "active":
      return <Circle size={size} style={{ color: S.primary }} strokeWidth={2.5} />;
    case "blocked":
      return <AlertTriangle size={size} style={{ color: S.warning }} />;
    case "pending":
    default:
      return <Circle size={size} style={{ color: S.border2 }} />;
  }
}

function statusLabel(status: StageStatus): string {
  switch (status) {
    case "completed": return "已完成";
    case "active": return "进行中";
    case "blocked": return "阻塞";
    case "pending": return "待开始";
  }
}

function statusColor(status: StageStatus): string {
  switch (status) {
    case "completed": return S.success;
    case "active": return S.primary;
    case "blocked": return S.warning;
    case "pending": return S.text3;
  }
}

// ── Compact view ─────────────────────────────────────────────────────────

function CompactView({ stages, nextStep, showNextStep }: {
  stages: StageInfo[];
  nextStep: NextStep | null;
  showNextStep: boolean;
}) {
  const completedCount = stages.filter(s => s.status === "completed").length;
  const pct = Math.round((completedCount / stages.length) * 100);

  return (
    <div className="px-2 py-2">
      {/* Header */}
      <div className="flex items-center gap-1.5 mb-2 px-1">
        <span className="text-[10px]">📊</span>
        <span className="text-[10px] font-bold" style={{ color: S.text }}>制作管线</span>
        <div className="flex-1" />
        <span className="text-[8px] font-mono font-bold" style={{ color: S.primary }}>
          {pct}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1 rounded-full overflow-hidden mb-2 mx-1" style={{ background: S.s2 }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ background: `linear-gradient(to right,${S.primary},${S.accent})` }}
        />
      </div>

      {/* Stage dots row */}
      <div className="flex items-center justify-between px-1 mb-1.5">
        {stages.map((stage, i) => (
          <div key={stage.id} className="flex items-center">
            <Link to={stage.link} title={`${stage.name}: ${statusLabel(stage.status)}`}>
              <motion.div
                whileTap={{ scale: 0.85 }}
                className="flex items-center justify-center w-5 h-5 rounded-full focus:outline-none"
                style={{
                  background: stage.status === "completed"
                    ? `${S.success}15`
                    : stage.status === "blocked"
                      ? `${S.warning}15`
                      : S.s2,
                }}
              >
                <StatusIcon status={stage.status} size={11} />
              </motion.div>
            </Link>
            {i < stages.length - 1 && (
              <div className="w-2.5 h-px mx-0.5" style={{
                background: stage.status === "completed" ? S.success : S.border,
              }} />
            )}
          </div>
        ))}
      </div>

      {/* Stage labels */}
      <div className="flex items-center justify-between px-0.5">
        {stages.map(stage => (
          <span key={stage.id} className="text-[7px] text-center w-7 truncate" style={{ color: S.text3 }}>
            {stage.emoji}
          </span>
        ))}
      </div>

      {/* Next step */}
      <AnimatePresence>
        {showNextStep && nextStep && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Link to={nextStep.link}>
              <motion.div
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-1.5 mt-2 px-2 py-1.5 rounded-lg focus:outline-none"
                style={{
                  background: `linear-gradient(135deg,${S.primary}08,${S.accent}08)`,
                  border: `1px solid ${S.primary}15`,
                }}
              >
                <ArrowRight size={9} style={{ color: S.primary }} />
                <span className="text-[8px] font-bold truncate" style={{ color: S.primary }}>
                  {nextStep.label}
                </span>
              </motion.div>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Full view ────────────────────────────────────────────────────────────

function FullView({ stages, nextStep, showNextStep }: {
  stages: StageInfo[];
  nextStep: NextStep | null;
  showNextStep: boolean;
}) {
  const completedCount = stages.filter(s => s.status === "completed").length;
  const pct = Math.round((completedCount / stages.length) * 100);

  return (
    <div className="rounded-xl p-4" style={{ background: S.card, border: `1px solid ${S.border}` }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: `linear-gradient(135deg,${S.primary},${S.accent})` }}>
            <span className="text-xs">📊</span>
          </div>
          <div>
            <h3 className="text-xs font-bold" style={{ color: S.text }}>制作管线</h3>
            <span className="text-[9px]" style={{ color: S.text3 }}>
              {completedCount}/{stages.length} 阶段完成
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-24 rounded-full overflow-hidden" style={{ background: S.s2 }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full rounded-full"
              style={{ background: `linear-gradient(to right,${S.primary},${S.accent})` }}
            />
          </div>
          <span className="text-xs font-mono font-black" style={{ color: S.primary }}>{pct}%</span>
        </div>
      </div>

      {/* Stage list */}
      <div className="space-y-1">
        {stages.map((stage, i) => {
          const Icon = stage.icon;
          return (
            <motion.div
              key={stage.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05, duration: 0.2 }}
            >
              <Link to={stage.link}>
                <motion.div
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.99 }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors focus:outline-none"
                  style={{
                    background: stage.status === "completed"
                      ? `${S.success}06`
                      : stage.status === "blocked"
                        ? `${S.warning}06`
                        : stage.status === "active"
                          ? `${S.primary}06`
                          : "transparent",
                    border: `1px solid ${
                      stage.status === "completed"
                        ? `${S.success}20`
                        : stage.status === "blocked"
                          ? `${S.warning}20`
                          : stage.status === "active"
                            ? `${S.primary}20`
                            : S.border
                    }`,
                  }}
                >
                  {/* Status icon */}
                  <StatusIcon status={stage.status} size={16} />

                  {/* Emoji + name */}
                  <div className="flex items-center gap-2 w-32 shrink-0">
                    <span className="text-sm">{stage.emoji}</span>
                    <span className="text-[11px] font-bold" style={{ color: S.text }}>
                      {stage.name}
                    </span>
                  </div>

                  {/* Status badge */}
                  <span className="text-[8px] font-bold px-1.5 py-0.5 rounded shrink-0"
                    style={{
                      background: `${statusColor(stage.status)}15`,
                      color: statusColor(stage.status),
                    }}>
                    {statusLabel(stage.status)}
                  </span>

                  {/* Metrics */}
                  <span className="text-[9px] flex-1 min-w-0 truncate" style={{ color: S.text3 }}>
                    {stage.metrics}
                  </span>

                  {/* Blocked reason */}
                  {stage.blockedReason && (
                    <span className="text-[8px] shrink-0" style={{ color: S.warning }}>
                      {stage.blockedReason}
                    </span>
                  )}

                  {/* Arrow */}
                  <ArrowRight size={12} className="shrink-0" style={{ color: S.border2 }} />
                </motion.div>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* Next step suggestion */}
      <AnimatePresence>
        {showNextStep && nextStep && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-4 p-3 rounded-lg"
              style={{
                background: `linear-gradient(135deg,${S.primary}08,${S.accent}08)`,
                border: `1px solid ${S.primary}15`,
              }}>
              <div className="flex items-center gap-2">
                <ArrowRight size={12} style={{ color: S.primary }} />
                <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: S.text3 }}>
                  下一步
                </span>
                <Link to={nextStep.link}>
                  <motion.span
                    whileHover={{ x: 2 }}
                    className="text-[11px] font-bold cursor-pointer focus:outline-none"
                    style={{ color: S.primary }}
                  >
                    {nextStep.label} →
                  </motion.span>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────

export function PipelineStatus({ compact = false, showNextStep = true }: PipelineStatusProps) {
  const { stages, nextStep } = usePipelineStages();

  if (compact) {
    return <CompactView stages={stages} nextStep={nextStep} showNextStep={showNextStep} />;
  }

  return <FullView stages={stages} nextStep={nextStep} showNextStep={showNextStep} />;
}

// Export hook for use in PipelineScreen
export { usePipelineStages };
export type { StageInfo, StageStatus, NextStep };
