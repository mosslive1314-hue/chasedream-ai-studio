
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUIStore } from "@/store";
import type { IndustryType } from "@/lib/studio-data";
import { useNavigate } from "@tanstack/react-router";
import {
  X,
  ArrowRight,
  ArrowLeft,
  Gamepad2,
  Building2,
  GraduationCap,
  Film,
  BookOpen,
  Sparkles,
  Clapperboard,
  ChevronRight,
  Check,
} from "lucide-react";

interface OnboardingOverlayProps {
  onClose: () => void;
}

/* ── Industry cards data ─────────────────────────────────────────────── */

const INDUSTRIES = [
  {
    type: "game" as IndustryType,
    icon: Gamepad2,
    emoji: "\u{1F3AE}",
    name: "\u4E92\u52A8\u53D9\u4E8B\u6E38\u620F",
    desc: "\u5206\u652F\u5267\u60C5\u3001\u591A\u7ED3\u5C40\u3001QTE \u4E92\u52A8",
  },
  {
    type: "tourism" as IndustryType,
    icon: Building2,
    emoji: "\u{1F3DB}\uFE0F",
    name: "\u6587\u65C5\u4E92\u52A8\u4F53\u9A8C",
    desc: "\u5BFC\u89C8\u8DEF\u7EBF\u3001\u5C55\u54C1\u4E92\u52A8\u3001AR \u4F53\u9A8C",
  },
  {
    type: "education" as IndustryType,
    icon: GraduationCap,
    emoji: "\u{1F393}",
    name: "\u4E92\u52A8\u6559\u80B2\u8BFE\u7A0B",
    desc: "\u60C5\u5883\u51B3\u7B56\u3001\u77E5\u8BC6\u6D4B\u8BC4\u3001\u63A2\u7A76\u5B66\u4E60",
  },
  {
    type: "derivative" as IndustryType,
    icon: Film,
    emoji: "\u{1F3AC}",
    name: "\u5F71\u89C6\u5185\u5BB9\u884D\u751F",
    desc: "\u4E92\u52A8\u77ED\u5267\u3001\u591A\u7ED3\u5C40\u89C6\u9891\u3001\u89C2\u4F17\u9009\u62E9",
  },
];

/* ── Project type cards ──────────────────────────────────────────────── */

const PROJECT_TYPES = [
  {
    key: "novel_adaptation",
    icon: BookOpen,
    label: "\u4ECE\u5C0F\u8BF4\u6539\u7F16",
    desc: "\u5BFC\u5165\u5C0F\u8BF4\u6587\u672C\uFF0CAI \u81EA\u52A8\u63D0\u53D6\u89D2\u8272\u3001\u573A\u666F\u4E0E\u7ED3\u6784",
  },
  {
    key: "original_creation",
    icon: Sparkles,
    label: "\u5168\u65B0\u521B\u4F5C",
    desc: "\u4ECE\u96F6\u5F00\u59CB\uFF0CAI \u8F85\u52A9\u4F60\u6784\u5EFA\u4E16\u754C\u89C2\u3001\u89D2\u8272\u4E0E\u5267\u60C5",
  },
  {
    key: "script_adaptation",
    icon: Clapperboard,
    label: "\u4ECE\u5267\u672C\u6539\u7F16",
    desc: "\u5BFC\u5165\u5F71\u89C6\u5267\u672C\u6216\u821E\u53F0\u5267\u672C\uFF0C\u589E\u52A0\u4E92\u52A8\u5206\u652F",
  },
];

/* ── Workflow steps for the tour ─────────────────────────────────────── */

const WORKFLOW_STEPS = [
  {
    label: "\u89E3\u6784",
    desc: "\u5BFC\u5165\u7D20\u6750\uFF0CAI \u81EA\u52A8\u63D0\u53D6\u7ED3\u6784",
    color: "#7C6CF5",
  },
  {
    label: "\u7F16\u8F91",
    desc: "\u7F16\u8F91\u5267\u672C\uFF0C\u8BBE\u8BA1\u5BF9\u767D\u4E0E\u573A\u666F",
    color: "#00A99D",
  },
  {
    label: "\u4E92\u52A8\u8BBE\u8BA1",
    desc: "\u8BBE\u8BA1\u9009\u62E9\u3001\u540E\u679C\u4E0E\u53D8\u91CF",
    color: "#D97706",
  },
  {
    label: "\u8282\u70B9\u56FE\u8C31",
    desc: "\u53EF\u89C6\u5316\u6545\u4E8B\u7ED3\u6784\u4E0E\u5206\u652F",
    color: "#5E50E8",
  },
  {
    label: "\u8D44\u4EA7",
    desc: "\u7BA1\u7406\u56FE\u7247\u3001\u97F3\u9891\u3001\u89C6\u9891\u8D44\u4EA7",
    color: "#EC4899",
  },
  {
    label: "\u9884\u89C8",
    desc: "\u8BD5\u73A9\u5E76\u6D4B\u8BD5\u6240\u6709\u8DEF\u5F84",
    color: "#10B981",
  },
  {
    label: "\u8D28\u68C0",
    desc: "\u81EA\u52A8\u68C0\u6D4B\u903B\u8F91\u4E0E\u8D28\u91CF\u95EE\u9898",
    color: "#F59E0B",
  },
  {
    label: "\u53D1\u5E03",
    desc: "\u5BFC\u51FA\u5230\u76EE\u6807\u5E73\u53F0",
    color: "#EF4444",
  },
];

/* ── Animation variants ──────────────────────────────────────────────── */

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 80 : -80,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({
    x: direction > 0 ? -80 : 80,
    opacity: 0,
  }),
};

const TRANSITION = { type: "spring" as const, stiffness: 300, damping: 30 };

/* ════════════════════════════════════════════════════════════════════════
   Component
   ════════════════════════════════════════════════════════════════════════ */

export function OnboardingOverlay({ onClose }: OnboardingOverlayProps) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [selectedIndustry, setSelectedIndustry] = useState<IndustryType | null>(
    null,
  );
  const navigate = useNavigate();

  /* ── Keyboard: ESC to close, arrow keys ───────────────────────────── */

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === "ArrowRight" && step < 3) {
        goNext();
      }
      if (e.key === "ArrowLeft" && step > 0) {
        goBack();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [step, selectedIndustry, onClose],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  /* ── Navigation helpers ───────────────────────────────────────────── */

  const canGoNext =
    (step === 0 && selectedIndustry) || (step === 1) || (step === 2) || false;

  const goNext = () => {
    if (step === 0 && !selectedIndustry) return;
    if (step >= 3) return;
    setDirection(1);
    setStep((s) => s + 1);
  };

  const goBack = () => {
    if (step <= 0) return;
    setDirection(-1);
    setStep((s) => s - 1);
  };

  /* ── Actions ──────────────────────────────────────────────────────── */

  const handleSelectIndustry = (type: IndustryType) => {
    setSelectedIndustry(type);
    useUIStore.getState().setIndustry(type);
  };

  const handleSelectProjectType = (_key: string) => {
    // Go directly to the workflow tour step
    setDirection(1);
    setStep(2);
  };

  const handleFinish = () => {
    onClose();
    navigate({ to: "/pipeline" });
  };

  /* ══════════════════════════════════════════════════════════════════════
     Render
     ══════════════════════════════════════════════════════════════════════ */

  return (
    <motion.div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Card */}
      <motion.div
        className="relative z-10 w-full max-w-lg mx-4 rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 overflow-hidden"
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        transition={TRANSITION}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          aria-label="关闭"
        >
          <X className="size-4" />
        </button>

        {/* Step content */}
        <div className="relative min-h-[420px] flex flex-col">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={TRANSITION}
              className="flex-1 flex flex-col px-8 pt-8 pb-6"
            >
              {/* ── Step 0: Welcome + Industry Selection ────────────── */}
              {step === 0 && (
                <>
                  <div className="mb-6 text-center">
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">
                      {"\u6B22\u8FCE\u4F7F\u7528\u9010\u68A6 Creator Studio"}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {"\u9009\u62E9\u4F60\u7684\u521B\u4F5C\u9886\u57DF\uFF0C\u6211\u4EEC\u5C06\u4E3A\u4F60\u5B9A\u5236\u4E13\u5C5E\u5DE5\u4F5C\u6D41"}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 flex-1">
                    {INDUSTRIES.map((ind) => {
                      const Icon = ind.icon;
                      const isSelected = selectedIndustry === ind.type;
                      return (
                        <button
                          key={ind.type}
                          onClick={() => handleSelectIndustry(ind.type)}
                          className={`
                            group relative flex flex-col items-start rounded-xl border-2 p-4 text-left transition-all duration-200
                            ${
                              isSelected
                                ? "border-[#5E50E8] bg-[#5E50E8]/5 shadow-sm"
                                : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
                            }
                          `}
                        >
                          {isSelected && (
                            <motion.div
                              layoutId="industry-check"
                              className="absolute top-2.5 right-2.5 flex size-5 items-center justify-center rounded-full bg-[#5E50E8]"
                            >
                              <Check className="size-3 text-white" />
                            </motion.div>
                          )}
                          <span className="mb-2 text-2xl">{ind.emoji}</span>
                          <span className="text-sm font-medium text-gray-900 mb-1 flex items-center gap-1.5">
                            <Icon className="size-3.5 text-gray-400" />
                            {ind.name}
                          </span>
                          <span className="text-xs leading-relaxed text-gray-500">
                            {ind.desc}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              {/* ── Step 1: Project Type ────────────────────────────── */}
              {step === 1 && (
                <>
                  <div className="mb-6 text-center">
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">
                      {"\u5F00\u59CB\u4F60\u7684\u7B2C\u4E00\u4E2A\u9879\u76EE"}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {"\u9009\u62E9\u521B\u5EFA\u65B9\u5F0F"}
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 flex-1">
                    {PROJECT_TYPES.map((pt) => {
                      const Icon = pt.icon;
                      return (
                        <button
                          key={pt.key}
                          onClick={() => handleSelectProjectType(pt.key)}
                          className="group flex items-center gap-4 rounded-xl border-2 border-gray-200 bg-white p-4 text-left transition-all duration-200 hover:border-[#5E50E8]/40 hover:bg-[#5E50E8]/[0.03] hover:shadow-sm"
                        >
                          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-gray-50 text-gray-600 group-hover:bg-[#5E50E8]/10 group-hover:text-[#5E50E8] transition-colors">
                            <Icon className="size-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900">
                              {pt.label}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              {pt.desc}
                            </div>
                          </div>
                          <ChevronRight className="size-4 text-gray-300 group-hover:text-[#5E50E8] transition-colors shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              {/* ── Step 2: Workflow Tour ───────────────────────────── */}
              {step === 2 && (
                <>
                  <div className="mb-5 text-center">
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">
                      {"\u4F60\u7684\u521B\u4F5C\u6D41\u7A0B"}
                    </h2>
                  </div>

                  <div className="flex-1 flex flex-col">
                    {/* Pipeline visual */}
                    <div className="flex flex-wrap items-center justify-center gap-x-1 gap-y-2 mb-5">
                      {WORKFLOW_STEPS.map((ws, i) => (
                        <motion.div
                          key={ws.label}
                          className="flex items-center"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{
                            delay: i * 0.07,
                            type: "spring",
                            stiffness: 400,
                            damping: 25,
                          }}
                        >
                          <div
                            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-white shadow-sm"
                            style={{ backgroundColor: ws.color }}
                          >
                            <span className="opacity-60 text-[10px]">
                              {String(i + 1).padStart(2, "0")}
                            </span>
                            {ws.label}
                          </div>
                          {i < WORKFLOW_STEPS.length - 1 && (
                            <ChevronRight className="size-3 text-gray-300 mx-0.5 shrink-0" />
                          )}
                        </motion.div>
                      ))}
                    </div>

                    {/* Detail list */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                      {WORKFLOW_STEPS.map((ws, i) => (
                        <motion.div
                          key={ws.label}
                          className="flex items-start gap-2 text-xs"
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 + i * 0.06 }}
                        >
                          <span
                            className="mt-0.5 size-2 shrink-0 rounded-full"
                            style={{ backgroundColor: ws.color }}
                          />
                          <span className="text-gray-600">
                            <span className="font-medium text-gray-800">
                              {ws.label}
                            </span>
                            {" \u2014 "}
                            {ws.desc}
                          </span>
                        </motion.div>
                      ))}
                    </div>

                    <p className="mt-5 text-center text-xs text-gray-400">
                      {"\u5DE6\u4FA7\u5BFC\u822A\u5DF2\u6309\u4F60\u7684\u884C\u4E1A\u5B9A\u5236\uFF0C\u6BCF\u4E00\u6B65\u90FD\u6709\u6E05\u6670\u6307\u5F15"}
                    </p>
                  </div>
                </>
              )}

              {/* ── Step 3: Get Started ─────────────────────────────── */}
              {step === 3 && (
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 15,
                      delay: 0.1,
                    }}
                    className="mb-6 flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#5E50E8] to-[#7C6CF5] shadow-lg"
                  >
                    <Sparkles className="size-7 text-white" />
                  </motion.div>

                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    {"\u51C6\u5907\u5C31\u7EEA\uFF01"}
                  </h2>
                  <p className="text-sm text-gray-500 mb-8 max-w-xs">
                    {"\u73B0\u5728\u5C31\u5F00\u59CB\u4F60\u7684\u4E92\u52A8\u53D9\u4E8B\u4E4B\u65C5"}
                  </p>

                  <motion.button
                    onClick={handleFinish}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#5E50E8] to-[#7C6CF5] px-8 py-3 text-sm font-medium text-white shadow-lg shadow-[#5E50E8]/25 transition-all hover:shadow-xl hover:shadow-[#5E50E8]/30"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {"\u8FDB\u5165\u5DE5\u4F5C\u53F0"}
                    <ArrowRight className="size-4" />
                  </motion.button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── Footer: dots + navigation ──────────────────────────────── */}
        {step < 3 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-6 py-3">
            {/* Back / spacer */}
            <div>
              {step > 0 ? (
                <button
                  onClick={goBack}
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                >
                  <ArrowLeft className="size-3.5" />
                  {"\u4E0A\u4E00\u6B65"}
                </button>
              ) : (
                <div />
              )}
            </div>

            {/* Step dots */}
            <div className="flex items-center gap-1.5">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`rounded-full transition-all duration-300 ${
                    i === step
                      ? "size-2 bg-[#5E50E8]"
                      : i < step
                        ? "size-1.5 bg-[#5E50E8]/40"
                        : "size-1.5 bg-gray-300"
                  }`}
                />
              ))}
            </div>

            {/* Next */}
            <div>
              {step < 2 ? (
                <button
                  onClick={goNext}
                  disabled={step === 0 && !selectedIndustry}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#5E50E8] px-4 py-1.5 text-xs font-medium text-white shadow-sm transition-all hover:bg-[#5248C8] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {"\u4E0B\u4E00\u6B65"}
                  <ArrowRight className="size-3.5" />
                </button>
              ) : (
                <button
                  onClick={goNext}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#5E50E8] px-4 py-1.5 text-xs font-medium text-white shadow-sm transition-all hover:bg-[#5248C8]"
                >
                  {"\u5F00\u59CB\u4F53\u9A8C"}
                  <ArrowRight className="size-3.5" />
                </button>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
