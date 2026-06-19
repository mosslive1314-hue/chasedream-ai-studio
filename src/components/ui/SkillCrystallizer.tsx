import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, ChevronRight, ChevronLeft, Sparkles, BookOpen,
  Layers, Tag, Trophy, Zap, CheckCircle2, X, Trash2,
} from "lucide-react";
import { useSkillStore } from "@/store";
import type {
  Skill, SkillDomain, SkillStep,
  ToolPattern,
} from "@/lib/types/skill";
import type { ExpertQualityStandard } from "@/lib/types/expert";

// ─── Design Tokens ──────────────────────────────────────────
const S = {
  card: "#FFFFFF", bg: "#F5F6FA", s2: "#EDF0F8",
  border: "#E2E5F0",
  primary: "#5E50E8", primary10: "rgba(94,80,232,0.10)", primary20: "rgba(94,80,232,0.20)",
  accent: "#00A99D", accent10: "rgba(0,169,157,0.10)",
  text: "#1A1D2E", text2: "#4A5068", text3: "#8892B0",
  success: "#059669", success10: "rgba(5,150,105,0.10)",
  warning: "#D97706", warning10: "rgba(217,119,6,0.10)",
  error: "#DC2626",
};

// ─── Domain options ─────────────────────────────────────────
const DOMAIN_OPTIONS: { value: SkillDomain; label: string; icon: string }[] = [
  { value: "narrative", label: "叙事", icon: "📖" },
  { value: "interaction", label: "互动", icon: "🎮" },
  { value: "cinematic", label: "演出", icon: "🎬" },
  { value: "asset", label: "资产", icon: "🎨" },
  { value: "gameplay", label: "数值", icon: "⚖️" },
  { value: "qa", label: "质检", icon: "🔍" },
  { value: "publish", label: "发布", icon: "🚀" },
];

// ─── Wizard step type ───────────────────────────────────────
type WizardStep = "basics" | "workflow" | "quality" | "tools" | "review";

const WIZARD_STEPS: { id: WizardStep; label: string; icon: typeof BookOpen }[] = [
  { id: "basics", label: "基本信息", icon: BookOpen },
  { id: "workflow", label: "工作流步骤", icon: Layers },
  { id: "quality", label: "质量标准", icon: Trophy },
  { id: "tools", label: "工具模式", icon: Zap },
  { id: "review", label: "审核创建", icon: CheckCircle2 },
];

// ─── Step editor ────────────────────────────────────────────
function StepEditor({
  step, index, onUpdate, onRemove,
}: {
  step: Partial<SkillStep>;
  index: number;
  onUpdate: (updates: Partial<SkillStep>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="p-3 rounded-xl border" style={{ borderColor: S.border, background: S.card }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold flex items-center gap-1.5" style={{ color: S.text }}>
          <span
            className="w-5 h-5 rounded-full flex items-center justify-center"
            style={{ background: S.primary10, color: S.primary, fontSize: 10, fontWeight: 700 }}
          >
            {index + 1}
          </span>
          步骤 {index + 1}
        </span>
        <button onClick={onRemove} className="p-1 rounded hover:bg-gray-100">
          <Trash2 size={11} style={{ color: S.text3 }} />
        </button>
      </div>
      <div className="space-y-2">
        <input
          value={step.action ?? ""}
          onChange={e => onUpdate({ action: e.target.value })}
          placeholder="步骤描述（做什么）…"
          className="w-full text-xs px-2.5 py-1.5 rounded-lg border outline-none"
          style={{ borderColor: S.border, background: S.bg, color: S.text }}
        />
        <input
          value={step.expectedOutput ?? ""}
          onChange={e => onUpdate({ expectedOutput: e.target.value })}
          placeholder="预期产出…"
          className="w-full text-xs px-2.5 py-1.5 rounded-lg border outline-none"
          style={{ borderColor: S.border, background: S.bg, color: S.text }}
        />
        <input
          value={(step.tips ?? [])[0] ?? ""}
          onChange={e => onUpdate({ tips: e.target.value ? [e.target.value] : [] })}
          placeholder="经验提示（可选）…"
          className="w-full text-xs px-2.5 py-1.5 rounded-lg border outline-none"
          style={{ borderColor: S.border, background: S.bg, color: S.text }}
        />
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────

interface SkillCrystallizerProps {
  /** Pre-fill from Expert context */
  sourceExpertId?: string;
  /** Pre-fill domain */
  initialDomain?: SkillDomain;
  /** Called after Skill is created */
  onCreated?: (skill: Skill) => void;
  /** Close handler */
  onClose: () => void;
}

export function SkillCrystallizer({ sourceExpertId, initialDomain, onCreated, onClose }: SkillCrystallizerProps) {
  const addSkill = useSkillStore(s => s.addSkill);

  // Wizard state
  const [currentStep, setCurrentStep] = useState<WizardStep>("basics");
  const currentStepIndex = WIZARD_STEPS.findIndex(s => s.id === currentStep);

  // Form data
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [domain, setDomain] = useState<SkillDomain>(initialDomain ?? "narrative");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  const [steps, setSteps] = useState<Partial<SkillStep>[]>([
    { order: 1, action: "", expectedOutput: "", tips: [] },
  ]);

  const [qualityCriteria, setQualityCriteria] = useState<Partial<ExpertQualityStandard>[]>([]);
  const [toolPatterns, setToolPatterns] = useState<Partial<ToolPattern>[]>([]);

  // Navigation
  const goNext = () => {
    const idx = currentStepIndex;
    if (idx < WIZARD_STEPS.length - 1) setCurrentStep(WIZARD_STEPS[idx + 1].id);
  };
  const goPrev = () => {
    const idx = currentStepIndex;
    if (idx > 0) setCurrentStep(WIZARD_STEPS[idx - 1].id);
  };

  // Step management
  const addStep = () => {
    setSteps([...steps, { order: steps.length + 1, action: "", expectedOutput: "", tips: [] }]);
  };
  const updateStep = (idx: number, updates: Partial<SkillStep>) => {
    setSteps(steps.map((s, i) => i === idx ? { ...s, ...updates } : s));
  };
  const removeStep = (idx: number) => {
    setSteps(steps.filter((_, i) => i !== idx).map((s, i) => ({ ...s, order: i + 1 })));
  };

  // Tag management
  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  // Quality criteria
  const addCriterion = () => {
    setQualityCriteria([...qualityCriteria, { dimension: "", criteria: "", minScore: 70, checkMethod: "auto" }]);
  };
  const updateCriterion = (idx: number, updates: Partial<ExpertQualityStandard>) => {
    setQualityCriteria(qualityCriteria.map((c, i) => i === idx ? { ...c, ...updates } : c));
  };
  const removeCriterion = (idx: number) => {
    setQualityCriteria(qualityCriteria.filter((_, i) => i !== idx));
  };

  // Tool patterns
  const addToolPattern = () => {
    setToolPatterns([...toolPatterns, { toolName: "", whenToUse: "", howToUse: "", commonMistakes: [] }]);
  };
  const updateToolPattern = (idx: number, updates: Partial<ToolPattern>) => {
    setToolPatterns(toolPatterns.map((t, i) => i === idx ? { ...t, ...updates } : t));
  };
  const removeToolPattern = (idx: number) => {
    setToolPatterns(toolPatterns.filter((_, i) => i !== idx));
  };

  // Create skill
  const handleCreate = useCallback(() => {
    const skill: Skill = {
      id: `skill-${Date.now().toString(36)}`,
      name,
      description,
      domain,
      tags,
      workflow: steps
        .filter(s => s.action?.trim())
        .map((s, i) => ({
          order: i + 1,
          action: s.action ?? "",
          expectedOutput: s.expectedOutput ?? "",
          tools: s.tools,
          tips: s.tips,
          qualityGate: s.qualityGate,
        })),
      qualityCriteria: qualityCriteria
        .filter(c => c.dimension?.trim())
        .map(c => ({
          dimension: c.dimension ?? "",
          criteria: c.criteria ?? "",
          minScore: c.minScore ?? 70,
          checkMethod: c.checkMethod ?? "auto",
        })),
      decisionRules: [],
      toolPatterns: toolPatterns
        .filter(t => t.toolName?.trim())
        .map(t => ({
          toolName: t.toolName ?? "",
          whenToUse: t.whenToUse ?? "",
          howToUse: t.howToUse ?? "",
          commonMistakes: t.commonMistakes ?? [],
        })),
      createdBy: sourceExpertId ? "expert" : "user",
      sourceExpertId,
      usageCount: 0,
      effectivenessScore: 50,
      version: 1,
      composableWith: [],
      requires: [],
      createdAt: new Date().toISOString(),
    };

    addSkill(skill);
    onCreated?.(skill);
    onClose();
  }, [name, description, domain, tags, steps, qualityCriteria, toolPatterns, sourceExpertId, addSkill, onCreated, onClose]);

  // Validation
  const canProceed = (() => {
    switch (currentStep) {
      case "basics": return name.trim().length > 0 && description.trim().length > 0;
      case "workflow": return steps.filter(s => s.action?.trim()).length > 0;
      case "quality": return true;
      case "tools": return true;
      case "review": return true;
    }
  })();

  return (
    <div className="flex flex-col h-full">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="shrink-0 px-4 py-3" style={{ borderBottom: `1px solid ${S.border}` }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles size={14} style={{ color: S.accent }} />
            <span className="text-sm font-semibold" style={{ color: S.text }}>结晶新 Skill</span>
          </div>
          <motion.button whileTap={{ scale: 0.92 }} onClick={onClose}>
            <X size={16} style={{ color: S.text3 }} />
          </motion.button>
        </div>

        {/* Step indicators */}
        <div className="flex items-center gap-1">
          {WIZARD_STEPS.map((ws, i) => {
            const Icon = ws.icon;
            const isActive = ws.id === currentStep;
            const isDone = i < currentStepIndex;
            return (
              <div key={ws.id} className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentStep(ws.id)}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-colors"
                  style={{
                    background: isActive ? S.primary : isDone ? S.success10 : S.bg,
                    color: isActive ? "#fff" : isDone ? S.success : S.text3,
                  }}
                >
                  <Icon size={10} />
                  <span className="font-medium" style={{ fontSize: 10 }}>{ws.label}</span>
                </button>
                {i < WIZARD_STEPS.length - 1 && (
                  <ChevronRight size={10} style={{ color: S.text3 }} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Content ────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-4" style={{ background: S.bg }}>
        <AnimatePresence mode="wait">
          {/* Step 1: Basics */}
          {currentStep === "basics" && (
            <motion.div key="basics" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} className="space-y-3">
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: S.text2 }}>Skill 名称</label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="例如：分支收敛策略"
                  className="w-full text-sm px-3 py-2 rounded-lg border outline-none"
                  style={{ borderColor: S.border, background: S.card, color: S.text }}
                />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: S.text2 }}>描述</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="描述这个 Skill 解决什么问题…"
                  rows={3}
                  className="w-full text-xs px-3 py-2 rounded-lg border outline-none resize-none"
                  style={{ borderColor: S.border, background: S.card, color: S.text }}
                />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: S.text2 }}>领域</label>
                <div className="flex flex-wrap gap-1.5">
                  {DOMAIN_OPTIONS.map(d => (
                    <button
                      key={d.value}
                      onClick={() => setDomain(d.value)}
                      className="text-xs px-2.5 py-1.5 rounded-lg border font-medium transition-colors"
                      style={{
                        borderColor: domain === d.value ? S.primary : S.border,
                        background: domain === d.value ? S.primary10 : S.card,
                        color: domain === d.value ? S.primary : S.text3,
                      }}
                    >
                      {d.icon} {d.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: S.text2 }}>标签</label>
                <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                  {tags.map(tag => (
                    <span key={tag} className="flex items-center gap-1 text-xs px-2 py-1 rounded-full" style={{ background: S.primary10, color: S.primary }}>
                      <Tag size={8} />
                      {tag}
                      <button onClick={() => setTags(tags.filter(t => t !== tag))}>
                        <X size={8} />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                    placeholder="添加标签…"
                    className="flex-1 text-xs px-2.5 py-1.5 rounded-lg border outline-none"
                    style={{ borderColor: S.border, background: S.card, color: S.text }}
                  />
                  <motion.button whileTap={{ scale: 0.95 }} onClick={addTag} className="text-xs px-2.5 py-1.5 rounded-lg" style={{ background: S.bg, color: S.text3 }}>
                    添加
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 2: Workflow */}
          {currentStep === "workflow" && (
            <motion.div key="workflow" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} className="space-y-2">
              <p className="text-xs mb-2" style={{ color: S.text3 }}>定义这个 Skill 的工作流步骤序列：</p>
              {steps.map((step, i) => (
                <StepEditor
                  key={i}
                  step={step}
                  index={i}
                  onUpdate={(updates) => updateStep(i, updates)}
                  onRemove={() => removeStep(i)}
                />
              ))}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={addStep}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-dashed text-xs font-medium transition-colors hover:bg-white"
                style={{ borderColor: S.accent, color: S.accent }}
              >
                <Plus size={12} />
                添加步骤
              </motion.button>
            </motion.div>
          )}

          {/* Step 3: Quality */}
          {currentStep === "quality" && (
            <motion.div key="quality" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} className="space-y-2">
              <p className="text-xs mb-2" style={{ color: S.text3 }}>定义质量标准（可选）：</p>
              {qualityCriteria.map((qc, i) => (
                <div key={i} className="p-3 rounded-xl border" style={{ borderColor: S.border, background: S.card }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold" style={{ color: S.text }}>标准 {i + 1}</span>
                    <button onClick={() => removeCriterion(i)} className="p-1 rounded hover:bg-gray-100">
                      <Trash2 size={11} style={{ color: S.text3 }} />
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    <input
                      value={qc.dimension ?? ""}
                      onChange={e => updateCriterion(i, { dimension: e.target.value })}
                      placeholder="维度（如：结构完整性）"
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border outline-none"
                      style={{ borderColor: S.border, background: S.bg, color: S.text }}
                    />
                    <input
                      value={qc.criteria ?? ""}
                      onChange={e => updateCriterion(i, { criteria: e.target.value })}
                      placeholder="评估标准描述"
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border outline-none"
                      style={{ borderColor: S.border, background: S.bg, color: S.text }}
                    />
                    <div className="flex items-center gap-2">
                      <label className="text-xs" style={{ color: S.text3, fontSize: 10 }}>最低分</label>
                      <input
                        type="number"
                        value={qc.minScore ?? 70}
                        onChange={e => updateCriterion(i, { minScore: parseInt(e.target.value) || 70 })}
                        className="w-16 text-xs px-2 py-1 rounded-lg border outline-none"
                        style={{ borderColor: S.border, background: S.bg, color: S.text }}
                        min={0}
                        max={100}
                      />
                      <select
                        value={qc.checkMethod ?? "auto"}
                        onChange={e => updateCriterion(i, { checkMethod: e.target.value as "auto" | "review" | "playtest" })}
                        className="text-xs px-2 py-1 rounded-lg border outline-none"
                        style={{ borderColor: S.border, background: S.bg, color: S.text }}
                      >
                        <option value="auto">自动检查</option>
                        <option value="review">人工审核</option>
                        <option value="playtest">试玩验证</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={addCriterion}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-dashed text-xs font-medium transition-colors hover:bg-white"
                style={{ borderColor: S.accent, color: S.accent }}
              >
                <Plus size={12} />
                添加质量标准
              </motion.button>
            </motion.div>
          )}

          {/* Step 4: Tool Patterns */}
          {currentStep === "tools" && (
            <motion.div key="tools" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} className="space-y-2">
              <p className="text-xs mb-2" style={{ color: S.text3 }}>记录工具使用模式（可选）：</p>
              {toolPatterns.map((tp, i) => (
                <div key={i} className="p-3 rounded-xl border" style={{ borderColor: S.border, background: S.card }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold" style={{ color: S.text }}>模式 {i + 1}</span>
                    <button onClick={() => removeToolPattern(i)} className="p-1 rounded hover:bg-gray-100">
                      <Trash2 size={11} style={{ color: S.text3 }} />
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    <input
                      value={tp.toolName ?? ""}
                      onChange={e => updateToolPattern(i, { toolName: e.target.value })}
                      placeholder="工具名称（如：ScriptScreen 章纲规划）"
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border outline-none"
                      style={{ borderColor: S.border, background: S.bg, color: S.text }}
                    />
                    <input
                      value={tp.whenToUse ?? ""}
                      onChange={e => updateToolPattern(i, { whenToUse: e.target.value })}
                      placeholder="何时使用"
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border outline-none"
                      style={{ borderColor: S.border, background: S.bg, color: S.text }}
                    />
                    <input
                      value={tp.howToUse ?? ""}
                      onChange={e => updateToolPattern(i, { howToUse: e.target.value })}
                      placeholder="使用要点"
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border outline-none"
                      style={{ borderColor: S.border, background: S.bg, color: S.text }}
                    />
                  </div>
                </div>
              ))}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={addToolPattern}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-dashed text-xs font-medium transition-colors hover:bg-white"
                style={{ borderColor: S.accent, color: S.accent }}
              >
                <Plus size={12} />
                添加工具模式
              </motion.button>
            </motion.div>
          )}

          {/* Step 5: Review */}
          {currentStep === "review" && (
            <motion.div key="review" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} className="space-y-3">
              <div className="p-4 rounded-xl border" style={{ borderColor: S.border, background: S.card }}>
                <h3 className="text-sm font-semibold mb-3" style={{ color: S.text }}>Skill 预览</h3>
                <div className="space-y-2 text-xs">
                  <div><span className="font-medium" style={{ color: S.text2 }}>名称：</span><span style={{ color: S.text }}>{name}</span></div>
                  <div><span className="font-medium" style={{ color: S.text2 }}>描述：</span><span style={{ color: S.text2 }}>{description}</span></div>
                  <div><span className="font-medium" style={{ color: S.text2 }}>领域：</span>{DOMAIN_OPTIONS.find(d => d.value === domain)?.icon} {DOMAIN_OPTIONS.find(d => d.value === domain)?.label}</div>
                  {tags.length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="font-medium" style={{ color: S.text2 }}>标签：</span>
                      {tags.map(t => (
                        <span key={t} className="px-1.5 py-0.5 rounded" style={{ background: S.primary10, color: S.primary, fontSize: 10 }}>{t}</span>
                      ))}
                    </div>
                  )}
                  <div><span className="font-medium" style={{ color: S.text2 }}>工作流：</span><span style={{ color: S.text }}>{steps.filter(s => s.action?.trim()).length} 个步骤</span></div>
                  <div><span className="font-medium" style={{ color: S.text2 }}>质量标准：</span><span style={{ color: S.text }}>{qualityCriteria.filter(c => c.dimension?.trim()).length} 条</span></div>
                  <div><span className="font-medium" style={{ color: S.text2 }}>工具模式：</span><span style={{ color: S.text }}>{toolPatterns.filter(t => t.toolName?.trim()).length} 个</span></div>
                  <div><span className="font-medium" style={{ color: S.text2 }}>来源：</span><span style={{ color: S.text }}>{sourceExpertId ? "Expert 沉淀" : "用户创建"}</span></div>
                </div>
              </div>

              {/* Workflow preview */}
              <div className="p-3 rounded-xl border" style={{ borderColor: S.border, background: S.card }}>
                <h4 className="text-xs font-semibold mb-2" style={{ color: S.text2 }}>工作流预览</h4>
                <div className="space-y-1">
                  {steps.filter(s => s.action?.trim()).map((step, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs">
                      <span
                        className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                        style={{ background: S.primary10, color: S.primary, fontSize: 8, fontWeight: 700 }}
                      >
                        {i + 1}
                      </span>
                      <span style={{ color: S.text2 }}>{step.action}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Footer ─────────────────────────────────────────── */}
      <div className="shrink-0 flex items-center justify-between px-4 py-3" style={{ borderTop: `1px solid ${S.border}`, background: S.card }}>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={goPrev}
          disabled={currentStepIndex === 0}
          className="flex items-center gap-1 text-xs px-3 py-2 rounded-lg border font-medium disabled:opacity-40"
          style={{ color: S.text2, borderColor: S.border }}
        >
          <ChevronLeft size={12} />
          上一步
        </motion.button>

        {currentStep === "review" ? (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleCreate}
            className="flex items-center gap-1.5 text-xs px-4 py-2 rounded-lg text-white font-semibold"
            style={{ background: S.accent }}
          >
            <Sparkles size={12} />
            结晶 Skill
          </motion.button>
        ) : (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={goNext}
            disabled={!canProceed}
            className="flex items-center gap-1 text-xs px-3 py-2 rounded-lg text-white font-medium disabled:opacity-40"
            style={{ background: S.primary }}
          >
            下一步
            <ChevronRight size={12} />
          </motion.button>
        )}
      </div>
    </div>
  );
}
