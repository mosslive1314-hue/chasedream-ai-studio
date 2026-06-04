"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, ChevronDown, ChevronUp, Zap, Star, Play,
  CheckCircle2, Clock, X,
} from "lucide-react";
import { useSkillStore } from "@/store";
import { getPageStage } from "@/lib/ai/agent-orchestrator";
import type { Skill, SkillExecution } from "@/lib/types/skill";

// ─── Design Tokens (matching other components) ─────────────
const S = {
  card: "#FFFFFF", bg: "#F5F6FA", s2: "#EDF0F8",
  border: "#E2E5F0",
  primary: "#5E50E8", primary10: "rgba(94,80,232,0.10)",
  accent: "#00A99D", accent10: "rgba(0,169,157,0.10)",
  text: "#1A1D2E", text2: "#4A5068", text3: "#8892B0",
  success: "#059669", success10: "rgba(5,150,105,0.10)",
  warning: "#D97706",
  error: "#DC2626",
};

// ─── Stage labels (matches PIPELINE_STAGES) ─────────────────
const STAGE_LABELS: Record<number, string> = {
  0: "项目创建", 1: "素材解构", 2: "叙事规则", 3: "章纲规划",
  4: "线性剧本", 5: "互动设计", 6: "变量机制", 7: "节点图谱",
  8: "资产管理", 9: "演出预览", 10: "质检修复", 11: "发布管理",
};

// ─── Skill chip ─────────────────────────────────────────────
function SkillChip({
  skill, isAutoLoad, isRunning, onRun, onRemove,
}: {
  skill: Skill;
  isAutoLoad: boolean;
  isRunning: boolean;
  onRun: () => void;
  onRemove?: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const color = skill.effectivenessScore >= 80 ? S.success : skill.effectivenessScore >= 60 ? S.warning : S.error;

  return (
    <div
      className="relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs cursor-pointer transition-all"
      style={{
        borderColor: hovered ? S.primary : S.border,
        background: isRunning ? `${S.accent}10` : S.card,
        boxShadow: hovered ? `0 2px 8px ${S.primary}15` : "none",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onRun}
    >
      {/* Effectiveness dot */}
      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />

      <span className="font-medium whitespace-nowrap" style={{ color: S.text }}>{skill.name}</span>

      {isAutoLoad && (
        <span className="text-xs px-1 py-0.5 rounded" style={{ background: S.accent10, color: S.accent, fontSize: 8, fontWeight: 600 }}>
          自动
        </span>
      )}

      {isRunning && (
        <Zap size={10} className="animate-pulse" style={{ color: S.accent }} />
      )}

      <span style={{ color: S.text3, fontSize: 9 }}>
        {skill.workflow.length}步 · {skill.effectivenessScore}%
      </span>

      {onRemove && !isAutoLoad && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="ml-0.5 p-0.5 rounded hover:bg-gray-100"
        >
          <X size={8} style={{ color: S.text3 }} />
        </button>
      )}

      {/* Hover tooltip */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 100 }}
            className="absolute top-full left-0 mt-1 z-50 w-64 p-3 rounded-xl border shadow-lg pointer-events-none"
            style={{ background: S.card, borderColor: S.border }}
          >
            <p className="text-xs leading-relaxed mb-2" style={{ color: S.text2 }}>{skill.description}</p>
            <div className="flex items-center gap-2 text-xs" style={{ color: S.text3, fontSize: 10 }}>
              <span>使用 {skill.usageCount} 次</span>
              <span>·</span>
              <span>v{skill.version}</span>
            </div>
            {skill.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {skill.tags.map(t => (
                  <span key={t} className="text-xs px-1.5 py-0.5 rounded" style={{ background: S.bg, color: S.text3, fontSize: 9 }}>
                    {t}
                  </span>
                ))}
              </div>
            )}
            <div className="mt-2 text-xs font-medium" style={{ color: S.primary, fontSize: 10 }}>
              点击查看工作流步骤 →
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Execution summary badge ────────────────────────────────
function ExecutionBadge({ execution }: { execution: SkillExecution }) {
  const completedSteps = execution.stepResults.filter(s => s.status === "completed").length;
  const totalSteps = execution.stepResults.length;
  const pct = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  const statusConfig = {
    running:   { color: S.accent, label: "执行中" },
    completed: { color: S.success, label: "已完成" },
    failed:    { color: S.error, label: "失败" },
    cancelled: { color: S.text3, label: "已取消" },
  };
  const cfg = statusConfig[execution.status];

  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg border text-xs" style={{ borderColor: `${cfg.color}40`, background: `${cfg.color}08` }}>
      <span style={{ color: cfg.color, fontSize: 10 }}>{cfg.label}</span>
      <span style={{ color: S.text3, fontSize: 9 }}>{completedSteps}/{totalSteps} ({pct}%)</span>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────

interface SkillContextBarProps {
  /** Current page pathname (used for auto-detection) */
  pathname?: string;
  /** Override: specific stage index (takes priority over pathname) */
  stageIndex?: number;
  /** Called when user clicks on a skill chip to view/run it */
  onViewSkill?: (skill: Skill) => void;
  /** Called when user clicks to open the full library */
  onOpenLibrary?: () => void;
}

export function SkillContextBar({ pathname, stageIndex: propStageIndex, onViewSkill, onOpenLibrary }: SkillContextBarProps) {
  const skills = useSkillStore(s => s.skills);
  const pipelineMappings = useSkillStore(s => s.pipelineMappings);
  const executions = useSkillStore(s => s.executions);
  const [expanded, setExpanded] = useState(false);

  const stageIndex = propStageIndex ?? getPageStage(pathname ?? "");
  const stageLabel = STAGE_LABELS[stageIndex] ?? "未知阶段";

  // Find pipeline mapping for this stage
  const mapping = pipelineMappings.find(m => m.stageIndex === stageIndex);
  const isAutoLoad = mapping?.autoLoad ?? false;

  // Get recommended skills for this stage
  const stageSkills = mapping?.recommendedSkillIds
    .map(id => skills.find(s => s.id === id))
    .filter((s): s is Skill => s !== undefined) ?? [];

  // Get recent executions
  const recentExecutions = executions
    .filter(e => e.status === "running")
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
    .slice(0, 3);

  // Check if any stage skill is currently running
  const runningSkillIds = new Set(recentExecutions.map(e => e.skillId));

  if (stageIndex < 0) return null;

  return (
    <div className="shrink-0" style={{ borderBottom: `1px solid ${S.border}` }}>
      {/* Compact bar */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-4 py-2 text-xs hover:bg-gray-50/50 transition-colors"
      >
        <BookOpen size={12} style={{ color: S.accent }} />
        <span className="font-medium" style={{ color: S.text }}>
          {stageLabel}
        </span>
        <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: S.accent10, color: S.accent, fontSize: 9 }}>
          阶段 {stageIndex}
        </span>

        {/* Skill count */}
        <span className="flex items-center gap-1 ml-1" style={{ color: S.text3 }}>
          <Zap size={9} />
          <span>{stageSkills.length} 个 Skill</span>
        </span>

        {/* Skill preview chips (first 3) */}
        <div className="flex items-center gap-1 ml-1">
          {stageSkills.slice(0, 3).map(skill => (
            <span
              key={skill.id}
              className="text-xs px-1.5 py-0.5 rounded-full whitespace-nowrap"
              style={{ background: S.primary10, color: S.primary, fontSize: 9 }}
            >
              {skill.name}
            </span>
          ))}
          {stageSkills.length > 3 && (
            <span style={{ color: S.text3, fontSize: 9 }}>+{stageSkills.length - 3}</span>
          )}
        </div>

        {/* Running executions indicator */}
        {recentExecutions.length > 0 && (
          <span className="flex items-center gap-1 ml-1 px-1.5 py-0.5 rounded-full" style={{ background: `${S.accent}15`, fontSize: 9 }}>
            <Zap size={8} className="animate-pulse" style={{ color: S.accent }} />
            <span style={{ color: S.accent }}>{recentExecutions.length} 执行中</span>
          </span>
        )}

        <div className="ml-auto">
          {expanded ? <ChevronUp size={12} style={{ color: S.text3 }} /> : <ChevronDown size={12} style={{ color: S.text3 }} />}
        </div>
      </button>

      {/* Expanded view */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 150 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3" style={{ borderTop: `1px solid ${S.border}` }}>
              {/* Loaded skills */}
              <div className="pt-2 mb-2">
                <div className="flex items-center gap-1.5 mb-1.5 text-xs font-medium" style={{ color: S.text2 }}>
                  <Zap size={10} />
                  <span>已加载的 Skill</span>
                  {isAutoLoad && (
                    <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: S.accent10, color: S.accent, fontSize: 8 }}>
                      自动加载
                    </span>
                  )}
                </div>

                {stageSkills.length === 0 ? (
                  <div className="text-xs py-2" style={{ color: S.text3 }}>
                    当前阶段没有推荐 Skill。
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {stageSkills.map(skill => (
                      <SkillChip
                        key={skill.id}
                        skill={skill}
                        isAutoLoad={isAutoLoad}
                        isRunning={runningSkillIds.has(skill.id)}
                        onRun={() => onViewSkill?.(skill)}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Active executions */}
              {recentExecutions.length > 0 && (
                <div className="mb-2">
                  <div className="flex items-center gap-1.5 mb-1.5 text-xs font-medium" style={{ color: S.text2 }}>
                    <Clock size={10} />
                    <span>进行中的执行</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {recentExecutions.map(exec => {
                      const skill = skills.find(s => s.id === exec.skillId);
                      return (
                        <div key={exec.id} className="flex items-center gap-1.5">
                          <span className="text-xs" style={{ color: S.text3, fontSize: 10 }}>
                            {skill?.name ?? exec.skillId}
                          </span>
                          <ExecutionBadge execution={exec} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Library link */}
              {onOpenLibrary && (
                <button
                  onClick={onOpenLibrary}
                  className="flex items-center gap-1 text-xs font-medium mt-1 transition-colors hover:underline"
                  style={{ color: S.primary }}
                >
                  <BookOpen size={10} />
                  浏览完整 Skill 知识库
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
