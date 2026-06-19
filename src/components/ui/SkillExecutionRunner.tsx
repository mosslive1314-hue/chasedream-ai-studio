import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Play, CheckCircle2, XCircle, SkipForward, Star, Clock,
  Trophy, ThumbsUp,
  ThumbsDown, Zap,
} from "lucide-react";
import { useSkillStore } from "@/store";
import type { Skill, SkillStep, SkillStepResult } from "@/lib/types/skill";

// ─── Design Tokens ──────────────────────────────────────────
const S = {
  card: "#FFFFFF", bg: "#F5F6FA", s2: "#EDF0F8",
  border: "#E2E5F0",
  primary: "#5E50E8", primary10: "rgba(94,80,232,0.10)", primary20: "rgba(94,80,232,0.20)",
  accent: "#00A99D", accent10: "rgba(0,169,157,0.10)",
  text: "#1A1D2E", text2: "#4A5068", text3: "#8892B0",
  success: "#059669", success10: "rgba(5,150,105,0.10)",
  warning: "#D97706", warning10: "rgba(217,119,6,0.10)",
  error: "#DC2626", error10: "rgba(220,38,38,0.10)",
};

// ─── Step status config ─────────────────────────────────────
const STEP_STATUS_CONFIG: Record<SkillStepResult["status"], { color: string; label: string }> = {
  pending:   { color: S.text3, label: "待执行" },
  running:   { color: S.accent, label: "执行中" },
  completed: { color: S.success, label: "已完成" },
  skipped:   { color: S.warning, label: "已跳过" },
  failed:    { color: S.error, label: "失败" },
};

// ─── Progress ring ──────────────────────────────────────────
function ProgressRing({ pct, size = 40, color = S.primary }: { pct: number; size?: number; color?: string }) {
  const r = (size - 6) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <svg width={size} height={size} className="shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={S.s2} strokeWidth={3} />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={color} strokeWidth={3}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{ transition: "stroke-dashoffset 0.3s ease", transform: "rotate(-90deg)", transformOrigin: "center" }}
      />
      <text
        x={size / 2} y={size / 2}
        textAnchor="middle" dominantBaseline="central"
        fill={color} fontSize={10} fontWeight={600}
      >
        {pct}%
      </text>
    </svg>
  );
}

// ─── Execution step row ─────────────────────────────────────
function ExecutionStepRow({
  step, result, isCurrent, onComplete, onSkip, onFail,
}: {
  step: SkillStep;
  result?: SkillStepResult;
  isCurrent: boolean;
  onComplete: (output?: string) => void;
  onSkip: () => void;
  onFail: () => void;
}) {
  const status = result?.status ?? "pending";
  const cfg = STEP_STATUS_CONFIG[status];
  const [note, setNote] = useState("");

  return (
    <motion.div
      layout
      className="rounded-xl border overflow-hidden transition-all"
      style={{
        borderColor: isCurrent ? S.accent : S.border,
        background: isCurrent ? `${S.accent}06` : S.card,
        boxShadow: isCurrent ? `0 0 0 1px ${S.accent}20` : "none",
      }}
    >
      <div className="px-3 py-2.5 flex items-start gap-2.5">
        {/* Step number / status icon */}
        <div className="shrink-0 mt-0.5">
          {status === "completed" ? (
            <CheckCircle2 size={18} style={{ color: cfg.color }} />
          ) : status === "failed" ? (
            <XCircle size={18} style={{ color: cfg.color }} />
          ) : status === "skipped" ? (
            <SkipForward size={18} style={{ color: cfg.color }} />
          ) : status === "running" ? (
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
              <Zap size={18} style={{ color: cfg.color }} />
            </motion.div>
          ) : (
            <span
              className="w-[18px] h-[18px] rounded-full flex items-center justify-center text-xs font-bold"
              style={{ background: S.s2, color: S.text3, fontSize: 10 }}
            >
              {step.order}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs font-semibold" style={{ color: isCurrent ? S.text : S.text2 }}>
              {step.action}
            </span>
            <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: `${cfg.color}15`, color: cfg.color, fontSize: 9 }}>
              {cfg.label}
            </span>
          </div>

          <div className="text-xs" style={{ color: S.text3, fontSize: 10 }}>
            预期产出：{step.expectedOutput}
          </div>

          {/* Tips */}
          {step.tips && step.tips.length > 0 && isCurrent && (
            <div className="mt-1.5 space-y-0.5">
              {step.tips.map((tip, i) => (
                <div key={i} className="flex items-start gap-1" style={{ color: S.accent, fontSize: 10 }}>
                  <Star size={8} className="mt-0.5 shrink-0" />
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          )}

          {/* Quality gate indicator */}
          {step.qualityGate && (
            <div className="mt-1 flex items-center gap-1 text-xs" style={{ color: S.warning, fontSize: 10 }}>
              <Trophy size={9} />
              <span>质量门禁：{step.qualityGate.dimension} ≥ {step.qualityGate.minScore}</span>
              {result?.qualityPassed !== undefined && (
                result.qualityPassed ? (
                  <CheckCircle2 size={9} style={{ color: S.success }} />
                ) : (
                  <XCircle size={9} style={{ color: S.error }} />
                )
              )}
            </div>
          )}

          {/* Duration */}
          {result?.duration !== undefined && (
            <div className="mt-0.5 flex items-center gap-1" style={{ color: S.text3, fontSize: 9 }}>
              <Clock size={8} />
              <span>耗时 {(result.duration / 1000).toFixed(1)}s</span>
            </div>
          )}

          {/* Actual output */}
          {result?.actualOutput && (
            <div className="mt-1 text-xs p-2 rounded-lg" style={{ background: S.bg, color: S.text2, fontSize: 10 }}>
              {result.actualOutput}
            </div>
          )}

          {/* Action buttons (only for current step) */}
          {isCurrent && (
            <div className="mt-2 space-y-2">
              {/* Note input */}
              <input
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="记录实际产出（可选）…"
                className="w-full text-xs px-2.5 py-1.5 rounded-lg border outline-none"
                style={{ borderColor: S.border, background: S.bg, color: S.text, fontSize: 11 }}
              />
              <div className="flex items-center gap-2">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onComplete(note || undefined)}
                  className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg text-white font-medium"
                  style={{ background: S.success }}
                >
                  <CheckCircle2 size={11} />
                  完成
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={onSkip}
                  className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border font-medium"
                  style={{ color: S.text3, borderColor: S.border, fontSize: 11 }}
                >
                  <SkipForward size={11} />
                  跳过
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={onFail}
                  className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border font-medium"
                  style={{ color: S.error, borderColor: `${S.error}30`, fontSize: 11 }}
                >
                  <XCircle size={11} />
                  标记失败
                </motion.button>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Component ─────────────────────────────────────────

interface SkillExecutionRunnerProps {
  skill: Skill;
  /** Existing execution (resume mode) */
  executionId?: string;
  /** Called when execution completes */
  onComplete?: (executionId: string) => void;
  /** Called when user closes the runner */
  onClose?: () => void;
}

export function SkillExecutionRunner({ skill, executionId: existingExecId, onComplete, onClose }: SkillExecutionRunnerProps) {
  const startExecution = useSkillStore(s => s.startExecution);
  const updateStepResult = useSkillStore(s => s.updateStepResult);
  const completeExecution = useSkillStore(s => s.completeExecution);
  const executions = useSkillStore(s => s.executions);
  const updateEffectiveness = useSkillStore(s => s.updateEffectiveness);

  // Create or resume execution
  const [execId] = useState<string>(() => {
    if (existingExecId) return existingExecId;
    return startExecution(skill.id);
  });

  const execution = executions.find(e => e.id === execId);
  const [stepStartTime, setStepStartTime] = useState<number>(Date.now());
  const [feedbackGiven, setFeedbackGiven] = useState(false);

  // Find current step
  const currentStepOrder = execution
    ? (execution.stepResults.find(sr => sr.status === "running")?.stepOrder
      ?? execution.stepResults.find(sr => sr.status === "pending")?.stepOrder
      ?? -1)
    : -1;

  // Progress
  const completedCount = execution?.stepResults.filter(s => s.status === "completed").length ?? 0;
  const totalCount = execution?.stepResults.length ?? skill.workflow.length;
  const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const isFinished = execution?.status !== "running" && execution?.status !== undefined;

  // Mark step as running when it becomes current
  const handleStepAction = useCallback((stepOrder: number, status: SkillStepResult["status"], output?: string) => {
    if (!execution) return;
    const duration = Date.now() - stepStartTime;

    // Mark current step as running first (if not already)
    const stepResult = execution.stepResults.find(sr => sr.stepOrder === stepOrder);
    if (stepResult?.status === "pending") {
      updateStepResult(execId, stepOrder, { status: "running", duration: 0 });
    }

    // Then mark with final status
    updateStepResult(execId, stepOrder, {
      status,
      actualOutput: output,
      duration,
      qualityPassed: status === "completed" ? true : status === "failed" ? false : undefined,
    });

    setStepStartTime(Date.now());

    // Check if all steps are done
    const allDone = execution.stepResults.every(sr =>
      sr.stepOrder === stepOrder
        ? (status === "completed" || status === "skipped" || status === "failed")
        : (sr.status === "completed" || sr.status === "skipped" || sr.status === "failed")
    );

    if (allDone) {
      const failedCount = execution.stepResults.filter(sr =>
        sr.stepOrder === stepOrder ? status === "failed" : sr.status === "failed"
      ).length;
      completeExecution(execId, failedCount > 0 ? "failed" : "completed");
      onComplete?.(execId);
    }
  }, [execution, execId, stepStartTime, updateStepResult, completeExecution, onComplete]);

  // Feedback handler
  const handleFeedback = useCallback((positive: boolean) => {
    updateEffectiveness(skill.id, positive ? 90 : 30);
    setFeedbackGiven(true);
  }, [skill.id, updateEffectiveness]);

  return (
    <div className="flex flex-col h-full">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="shrink-0 px-4 py-3" style={{ borderBottom: `1px solid ${S.border}` }}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Play size={14} style={{ color: S.accent }} />
            <span className="text-sm font-semibold" style={{ color: S.text }}>{skill.name}</span>
            <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: S.accent10, color: S.accent, fontSize: 10 }}>
              执行中
            </span>
          </div>
          {onClose && (
            <motion.button whileTap={{ scale: 0.92 }} onClick={onClose}>
              <XCircle size={16} style={{ color: S.text3 }} />
            </motion.button>
          )}
        </div>

        {/* Progress */}
        <div className="flex items-center gap-3">
          <ProgressRing pct={pct} color={isFinished ? (execution?.status === "completed" ? S.success : S.error) : S.accent} />
          <div className="flex-1">
            <div className="flex items-center gap-1 mb-1">
              <span className="text-xs font-medium" style={{ color: S.text }}>
                {completedCount} / {totalCount} 步骤完成
              </span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: S.s2 }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: S.accent }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 300 }}
              />
            </div>
            <p className="text-xs mt-1" style={{ color: S.text3, fontSize: 10 }}>
              {skill.description}
            </p>
          </div>
        </div>
      </div>

      {/* ── Steps ──────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2" style={{ background: S.bg }}>
        {skill.workflow.map(step => {
          const result = execution?.stepResults.find(sr => sr.stepOrder === step.order);
          const isCurrent = step.order === currentStepOrder;

          return (
            <ExecutionStepRow
              key={step.order}
              step={step}
              result={result}
              isCurrent={isCurrent}
              onComplete={(output) => handleStepAction(step.order, "completed", output)}
              onSkip={() => handleStepAction(step.order, "skipped")}
              onFail={() => handleStepAction(step.order, "failed")}
            />
          );
        })}

        {/* Completion / Feedback section */}
        {isFinished && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border p-4 text-center"
            style={{ borderColor: S.border, background: S.card }}
          >
            {execution?.status === "completed" ? (
              <>
                <CheckCircle2 size={32} style={{ color: S.success }} className="mx-auto mb-2" />
                <p className="text-sm font-semibold mb-1" style={{ color: S.text }}>Skill 执行完成</p>
                <p className="text-xs mb-3" style={{ color: S.text3 }}>
                  所有步骤已完成。这次 Skill 对你有帮助吗？
                </p>
              </>
            ) : (
              <>
                <XCircle size={32} style={{ color: S.error }} className="mx-auto mb-2" />
                <p className="text-sm font-semibold mb-1" style={{ color: S.text }}>执行中有步骤失败</p>
                <p className="text-xs mb-3" style={{ color: S.text3 }}>
                  部分步骤未通过质量门禁，建议检查后重试。
                </p>
              </>
            )}

            {!feedbackGiven && execution?.status === "completed" && (
              <div className="flex items-center justify-center gap-3">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleFeedback(true)}
                  className="flex items-center gap-1.5 text-xs px-4 py-2 rounded-lg text-white font-medium"
                  style={{ background: S.success }}
                >
                  <ThumbsUp size={12} />
                  有帮助
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleFeedback(false)}
                  className="flex items-center gap-1.5 text-xs px-4 py-2 rounded-lg border font-medium"
                  style={{ color: S.text3, borderColor: S.border }}
                >
                  <ThumbsDown size={12} />
                  需改进
                </motion.button>
              </div>
            )}

            {feedbackGiven && (
              <p className="text-xs" style={{ color: S.accent }}>感谢反馈！已更新 Skill 效能评分。</p>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
