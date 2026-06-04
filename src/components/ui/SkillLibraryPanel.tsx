"use client";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, Filter, ChevronDown, ChevronRight, Star, Zap,
  Play, Tag, Layers, ArrowRight, CheckCircle2, XCircle,
  Plus, Search, X, Trophy, Clock, AlertTriangle,
} from "lucide-react";
import { useSkillStore } from "@/store";
import type {
  Skill, SkillDomain, SkillStep, ToolPattern, SkillExecution,
} from "@/lib/types/skill";

// ─── Design Tokens ──────────────────────────────────────────
const S = {
  card: "#FFFFFF", bg: "#F5F6FA", s2: "#EDF0F8",
  border: "#E2E5F0", border2: "#CBD0E5",
  primary: "#5E50E8", primary10: "rgba(94,80,232,0.10)", primary20: "rgba(94,80,232,0.20)",
  text: "#1A1D2E", text2: "#4A5068", text3: "#8892B0",
  accent: "#00A99D", accent10: "rgba(0,169,157,0.10)",
  success: "#059669", success10: "rgba(5,150,105,0.10)",
  warning: "#D97706", warning10: "rgba(217,119,6,0.10)",
  error: "#DC2626", error10: "rgba(220,38,38,0.10)",
};

// ─── Domain config ──────────────────────────────────────────
const DOMAIN_CONFIG: Record<SkillDomain, { label: string; icon: string; color: string }> = {
  narrative:   { label: "叙事", icon: "📖", color: "#8B5CF6" },
  interaction: { label: "互动", icon: "🎮", color: "#3B82F6" },
  cinematic:   { label: "演出", icon: "🎬", color: "#EC4899" },
  asset:       { label: "资产", icon: "🎨", color: "#F59E0B" },
  gameplay:    { label: "数值", icon: "⚖️", color: "#10B981" },
  qa:          { label: "质检", icon: "🔍", color: "#6366F1" },
  publish:     { label: "发布", icon: "🚀", color: "#EF4444" },
};

const ALL_DOMAINS: SkillDomain[] = [
  "narrative", "interaction", "cinematic", "asset", "gameplay", "qa", "publish",
];

const SOURCE_LABELS: Record<string, string> = {
  system: "系统内置",
  expert: "Expert 沉淀",
  user: "用户创建",
};

// ─── Effectiveness bar ──────────────────────────────────────
function EffectivenessBar({ score }: { score: number }) {
  const color = score >= 80 ? S.success : score >= 60 ? S.warning : S.error;
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: S.s2 }}>
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${score}%`, background: color }}
        />
      </div>
      <span className="text-xs font-medium" style={{ color, fontSize: 10, minWidth: 24, textAlign: "right" }}>
        {score}
      </span>
    </div>
  );
}

// ─── Skill Card ─────────────────────────────────────────────
function SkillCard({
  skill, expanded, onToggle, onRun,
}: {
  skill: Skill;
  expanded: boolean;
  onToggle: () => void;
  onRun: () => void;
}) {
  const domain = DOMAIN_CONFIG[skill.domain];
  return (
    <motion.div
      layout
      className="rounded-xl border overflow-hidden transition-shadow"
      style={{ background: S.card, borderColor: expanded ? S.primary20 : S.border }}
    >
      {/* Card header */}
      <motion.button
        onClick={onToggle}
        className="w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-gray-50/50 transition-colors"
      >
        <span className="text-lg mt-0.5 shrink-0">{domain.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm font-semibold" style={{ color: S.text }}>{skill.name}</span>
            <span
              className="text-xs px-1.5 py-0.5 rounded-full font-medium"
              style={{ background: `${domain.color}15`, color: domain.color, fontSize: 10 }}
            >
              {domain.label}
            </span>
            <span
              className="text-xs px-1.5 py-0.5 rounded-full"
              style={{
                background: skill.createdBy === "system" ? S.success10 : S.primary10,
                color: skill.createdBy === "system" ? S.success : S.primary,
                fontSize: 10,
              }}
            >
              {SOURCE_LABELS[skill.createdBy] ?? skill.createdBy}
            </span>
          </div>
          <p className="text-xs leading-relaxed mb-2" style={{ color: S.text3 }}>
            {skill.description}
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            {/* Tags */}
            <div className="flex items-center gap-1">
              {skill.tags.slice(0, 3).map(tag => (
                <span key={tag} className="text-xs px-1.5 py-0.5 rounded" style={{ background: S.bg, color: S.text3, fontSize: 9 }}>
                  {tag}
                </span>
              ))}
            </div>
            {/* Stats */}
            <div className="flex items-center gap-2.5 ml-auto">
              <span className="flex items-center gap-0.5" style={{ color: S.text3, fontSize: 10 }}>
                <Zap size={9} /> {skill.usageCount}次使用
              </span>
              <span className="flex items-center gap-0.5" style={{ color: S.text3, fontSize: 10 }}>
                v{skill.version}
              </span>
              <EffectivenessBar score={skill.effectivenessScore} />
            </div>
          </div>
        </div>
        <ChevronDown
          size={14}
          className="shrink-0 mt-1 transition-transform"
          style={{ color: S.text3, transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </motion.button>

      {/* Expanded detail */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 200 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4" style={{ borderTop: `1px solid ${S.border}` }}>
              {/* Workflow steps */}
              <div className="pt-3">
                <div className="flex items-center gap-1.5 mb-2 text-xs font-semibold" style={{ color: S.text }}>
                  <Layers size={12} />
                  <span>工作流步骤 ({skill.workflow.length})</span>
                </div>
                <div className="space-y-1">
                  {skill.workflow.map((step) => (
                    <WorkflowStepRow key={step.order} step={step} />
                  ))}
                </div>
              </div>

              {/* Quality criteria */}
              {skill.qualityCriteria.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-2 text-xs font-semibold" style={{ color: S.text }}>
                    <Trophy size={12} />
                    <span>质量标准</span>
                  </div>
                  <div className="space-y-1">
                    {skill.qualityCriteria.map((qc, i) => (
                      <div key={i} className="flex items-start gap-2 p-2 rounded-lg text-xs" style={{ background: S.bg }}>
                        <CheckCircle2 size={11} className="mt-0.5 shrink-0" style={{ color: S.success }} />
                        <div>
                          <div className="font-medium" style={{ color: S.text }}>{qc.dimension}</div>
                          <div style={{ color: S.text3, fontSize: 10 }}>{qc.criteria} (≥{qc.minScore}分)</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tool patterns */}
              {skill.toolPatterns.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-2 text-xs font-semibold" style={{ color: S.text }}>
                    <Zap size={12} />
                    <span>工具使用模式</span>
                  </div>
                  <div className="space-y-1.5">
                    {skill.toolPatterns.map((tp, i) => (
                      <div key={i} className="p-2 rounded-lg text-xs" style={{ background: S.bg }}>
                        <div className="font-medium mb-0.5" style={{ color: S.accent }}>{tp.toolName}</div>
                        <div style={{ color: S.text2, fontSize: 10 }}>
                          <span className="font-medium">时机：</span>{tp.whenToUse}
                        </div>
                        <div style={{ color: S.text2, fontSize: 10 }}>
                          <span className="font-medium">方法：</span>{tp.howToUse}
                        </div>
                        {tp.commonMistakes.length > 0 && (
                          <div className="mt-1 flex items-start gap-1" style={{ color: S.warning, fontSize: 10 }}>
                            <AlertTriangle size={9} className="mt-0.5 shrink-0" />
                            <span>{tp.commonMistakes.join("；")}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Decision rules */}
              {skill.decisionRules.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-2 text-xs font-semibold" style={{ color: S.text }}>
                    <Filter size={12} />
                    <span>决策规则</span>
                  </div>
                  <div className="space-y-1.5">
                    {skill.decisionRules.map((rule, i) => (
                      <div key={i} className="p-2 rounded-lg text-xs" style={{ background: S.bg }}>
                        <div className="font-medium mb-1" style={{ color: S.text }}>条件：{rule.condition}</div>
                        <div className="space-y-0.5">
                          {rule.options.map((opt, j) => (
                            <div key={j} className="flex items-center gap-1.5" style={{ color: S.text2, fontSize: 10 }}>
                              {opt.label === rule.recommendation ? (
                                <Star size={9} style={{ color: S.warning }} />
                              ) : (
                                <span className="w-[9px]" />
                              )}
                              <span className="font-medium">{opt.label}</span>
                              <span style={{ color: S.text3 }}>— {opt.rationale}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Composability */}
              {(skill.composableWith.length > 0 || skill.requires.length > 0) && (
                <div className="flex items-center gap-3 flex-wrap text-xs">
                  {skill.composableWith.length > 0 && (
                    <span className="flex items-center gap-1" style={{ color: S.text3 }}>
                      <ArrowRight size={10} />
                      可组合：{skill.composableWith.join(", ")}
                    </span>
                  )}
                  {skill.requires.length > 0 && (
                    <span className="flex items-center gap-1" style={{ color: S.warning }}>
                      <Lock size={10} />
                      依赖：{skill.requires.join(", ")}
                    </span>
                  )}
                </div>
              )}

              {/* Action button */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={(e) => { e.stopPropagation(); onRun(); }}
                className="flex items-center gap-1.5 text-xs px-4 py-2 rounded-lg text-white font-medium"
                style={{ background: S.primary }}
              >
                <Play size={12} />
                开始执行此 Skill
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Workflow Step Row ──────────────────────────────────────
function WorkflowStepRow({ step }: { step: SkillStep }) {
  return (
    <div className="flex items-start gap-2 p-2 rounded-lg text-xs" style={{ background: S.bg }}>
      <span
        className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
        style={{ background: S.primary10, color: S.primary, fontSize: 10 }}
      >
        {step.order}
      </span>
      <div className="flex-1 min-w-0">
        <div className="font-medium" style={{ color: S.text }}>{step.action}</div>
        <div className="mt-0.5" style={{ color: S.text3, fontSize: 10 }}>
          预期产出：{step.expectedOutput}
        </div>
        {step.tips && step.tips.length > 0 && (
          <div className="mt-1 space-y-0.5">
            {step.tips.map((tip, i) => (
              <div key={i} className="flex items-start gap-1" style={{ color: S.accent, fontSize: 10 }}>
                <Star size={8} className="mt-0.5 shrink-0" />
                <span>{tip}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Lock icon (inline since lucide doesn't have it) ────────
function Lock({ size, className, style }: { size: number; className?: string; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

// ─── Main Panel ─────────────────────────────────────────────

interface SkillLibraryPanelProps {
  /** Optional: filter by specific domain */
  initialDomain?: SkillDomain;
  /** Called when user clicks "Run" on a Skill */
  onRunSkill?: (skill: Skill) => void;
  /** Called when user wants to crystallize a new Skill */
  onCrystallize?: () => void;
}

export function SkillLibraryPanel({ initialDomain, onRunSkill, onCrystallize }: SkillLibraryPanelProps) {
  const skills = useSkillStore(s => s.skills);

  const [activeDomain, setActiveDomain] = useState<SkillDomain | "all">(initialDomain ?? "all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredSkills = useMemo(() => {
    let result = skills;
    if (activeDomain !== "all") {
      result = result.filter(s => s.domain === activeDomain);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.tags.some(t => t.toLowerCase().includes(q))
      );
    }
    return result;
  }, [skills, activeDomain, searchQuery]);

  // Stats
  const totalSkills = skills.length;
  const avgEffectiveness = totalSkills > 0
    ? Math.round(skills.reduce((sum, s) => sum + s.effectivenessScore, 0) / totalSkills)
    : 0;

  return (
    <div className="flex flex-col h-full">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="shrink-0 px-4 py-3" style={{ borderBottom: `1px solid ${S.border}` }}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <BookOpen size={16} style={{ color: S.primary }} />
            <span className="text-sm font-semibold" style={{ color: S.text }}>Skill 知识库</span>
            <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: S.primary10, color: S.primary, fontSize: 10 }}>
              {totalSkills} 个 Skill
            </span>
          </div>
          {onCrystallize && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onCrystallize}
              className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg text-white font-medium"
              style={{ background: S.accent }}
            >
              <Plus size={11} />
              结晶新 Skill
            </motion.button>
          )}
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 mb-2">
          <div className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-lg border" style={{ background: S.bg, borderColor: S.border }}>
            <Search size={12} style={{ color: S.text3 }} />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="搜索 Skill…"
              className="flex-1 bg-transparent text-xs outline-none"
              style={{ color: S.text }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="p-0.5">
                <X size={10} style={{ color: S.text3 }} />
              </button>
            )}
          </div>
        </div>

        {/* Domain filter tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
          <button
            onClick={() => setActiveDomain("all")}
            className="text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap transition-colors"
            style={{
              background: activeDomain === "all" ? S.primary : S.bg,
              color: activeDomain === "all" ? "#fff" : S.text3,
            }}
          >
            全部
          </button>
          {ALL_DOMAINS.map(d => {
            const cfg = DOMAIN_CONFIG[d];
            const count = skills.filter(s => s.domain === d).length;
            return (
              <button
                key={d}
                onClick={() => setActiveDomain(d)}
                className="text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap transition-colors flex items-center gap-1"
                style={{
                  background: activeDomain === d ? cfg.color : S.bg,
                  color: activeDomain === d ? "#fff" : S.text3,
                }}
              >
                <span style={{ fontSize: 10 }}>{cfg.icon}</span>
                {cfg.label}
                <span style={{ fontSize: 9, opacity: 0.7 }}>{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Stats summary ──────────────────────────────────── */}
      <div className="shrink-0 flex items-center gap-4 px-4 py-2 text-xs" style={{ background: S.bg, borderBottom: `1px solid ${S.border}` }}>
        <span style={{ color: S.text3 }}>
          显示 <span style={{ color: S.text, fontWeight: 600 }}>{filteredSkills.length}</span> / {totalSkills}
        </span>
        <span style={{ color: S.text3 }}>
          平均效能 <span style={{ color: avgEffectiveness >= 80 ? S.success : S.warning, fontWeight: 600 }}>{avgEffectiveness}%</span>
        </span>
      </div>

      {/* ── Skill list ─────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2" style={{ background: S.bg }}>
        {filteredSkills.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <BookOpen size={32} style={{ color: S.text3, opacity: 0.4 }} />
            <p className="text-sm mt-3" style={{ color: S.text3 }}>
              {searchQuery ? "没有匹配的 Skill" : "该领域暂无 Skill"}
            </p>
          </div>
        )}

        {filteredSkills.map(skill => (
          <SkillCard
            key={skill.id}
            skill={skill}
            expanded={expandedId === skill.id}
            onToggle={() => setExpandedId(expandedId === skill.id ? null : skill.id)}
            onRun={() => onRunSkill?.(skill)}
          />
        ))}
      </div>
    </div>
  );
}
