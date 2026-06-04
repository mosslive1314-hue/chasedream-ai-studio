"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  X,
  Upload,
  FileText,
  BookOpen,
  Film,
  BookMarked,
  Wand2,
  Settings,
  CheckCircle2,
  Gamepad2,
  Globe,
  Clock,
} from "lucide-react";
import { useProjectStore, useUIStore, useSettingsStore } from "@/store";

/* ── Design tokens ───────────────────────────────────────────────────── */

const S = {
  bg: "#FAFBFF",
  card: "#FFFFFF",
  s2: "#F4F6FC",
  border: "#E2E5F0",
  border2: "#CBD0E5",
  primary: "#5E50E8",
  accent: "#00A99D",
  text: "#1A1D2E",
  text2: "#4A5068",
  text3: "#8892B0",
  success: "#059669",
  warning: "#D97706",
  error: "#DC2626",
} as const;

/* ── Data constants ──────────────────────────────────────────────────── */

const TEMPLATES = [
  {
    key: "interactive_film",
    icon: Film,
    label: "互动影游",
    desc: "多分支剧情，多结局设计",
  },
  {
    key: "visual_novel",
    icon: BookOpen,
    label: "视觉小说",
    desc: "线性叙事，精美演出",
  },
  {
    key: "text_adventure",
    icon: Gamepad2,
    label: "文字冒险",
    desc: "纯文字互动，快速原型",
  },
] as const;

const GENRES = [
  "悬疑推理",
  "赛博朋克",
  "古风仙侠",
  "现代都市",
  "科幻冒险",
  "恋爱养成",
  "恐怖生存",
  "历史架空",
] as const;

const DURATIONS = [
  { key: "short", label: "短篇", detail: "1-2小时" },
  { key: "medium", label: "中篇", detail: "3-5小时" },
  { key: "long", label: "长篇", detail: "10小时+" },
] as const;

const IMPORT_OPTIONS = [
  {
    key: "upload",
    icon: Upload,
    label: "上传剧本文件",
    desc: "支持 .txt / .docx / .pdf 格式",
  },
  {
    key: "paste",
    icon: FileText,
    label: "粘贴文本大纲",
    desc: "直接粘贴故事大纲或剧本",
  },
  {
    key: "blank",
    icon: BookMarked,
    label: "从空白开始",
    desc: "跳过此步，稍后手动添加",
  },
] as const;

const AI_MODELS = [
  {
    key: "gpt4",
    label: "GPT-4",
    desc: "OpenAI 旗舰模型，综合能力强",
  },
  {
    key: "claude",
    label: "Claude",
    desc: "Anthropic 模型，擅长长文本与创意",
  },
  {
    key: "qwen",
    label: "通义千问",
    desc: "阿里模型，中文理解优秀",
  },
] as const;

const AI_FREQUENCIES = [
  {
    key: "active",
    label: "主动建议",
    desc: "AI 实时分析并主动提供创作建议",
  },
  {
    key: "moderate",
    label: "按需建议",
    desc: "在你需要时给出建议，不打断创作",
  },
  {
    key: "conservative",
    label: "仅手动触发",
    desc: "仅在你主动请求时 AI 才参与",
  },
] as const;

/* ── Form state type ─────────────────────────────────────────────────── */

interface WizardFormData {
  // Step 1
  startMode: "new" | "template" | null;
  templateKey: string;
  // Step 2
  projectTitle: string;
  genre: string;
  duration: string;
  description: string;
  // Step 3
  importMode: string;
  pastedText: string;
  // Step 4
  aiModel: string;
  aiFrequency: string;
}

const INITIAL_FORM: WizardFormData = {
  startMode: null,
  templateKey: "",
  projectTitle: "",
  genre: "",
  duration: "medium",
  description: "",
  importMode: "blank",
  pastedText: "",
  aiModel: "gpt4",
  aiFrequency: "moderate",
};

/* ── Animation variants ──────────────────────────────────────────────── */

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 60 : -60,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({
    x: direction > 0 ? -60 : 60,
    opacity: 0,
  }),
};

const SPRING = { type: "spring" as const, stiffness: 300, damping: 30 };

const TOTAL_STEPS = 5;

/* ════════════════════════════════════════════════════════════════════════
   OnboardingWizard Component
   ════════════════════════════════════════════════════════════════════════ */

interface OnboardingWizardProps {
  onClose: () => void;
}

function OnboardingWizard({ onClose }: OnboardingWizardProps) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [form, setForm] = useState<WizardFormData>(INITIAL_FORM);

  const router = useRouter();
  const createProject = useProjectStore((s) => s.createProject);
  const setCurrentProject = useProjectStore((s) => s.setCurrentProject);
  const projects = useProjectStore((s) => s.projects);
  const addToast = useUIStore((s) => s.addToast);
  const setAiModel = useSettingsStore((s) => s.setAiModel);
  const setAiFrequency = useSettingsStore((s) => s.setAiFrequency);

  /* ── Keyboard navigation ──────────────────────────────────────────── */

  const goNext = useCallback(() => {
    if (step >= TOTAL_STEPS - 1) return;
    setDirection(1);
    setStep((s) => s + 1);
  }, [step]);

  const goBack = useCallback(() => {
    if (step <= 0) return;
    setDirection(-1);
    setStep((s) => s - 1);
  }, [step]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  /* ── Form helper ──────────────────────────────────────────────────── */

  const update = <K extends keyof WizardFormData>(
    key: K,
    value: WizardFormData[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  /* ── Finish handler ───────────────────────────────────────────────── */

  const handleFinish = () => {
    const now = new Date().toISOString();
    const title = form.projectTitle.trim() || "未命名项目";

    // Create the project
    createProject({
      title,
      genre: form.genre || "未分类",
      cover:
        "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80",
      status: "draft",
      healthScore: 100,
      healthLabel: "NEW",
      healthType: "success",
      progress: 0,
      stage1: 0,
      stage2: 0,
      stage3: 0,
      chapters: 0,
      nodes: 0,
      branches: 0,
      endings: 0,
      lastEdited: "Just now",
    });

    // Set the new project as current (it will be the first in the list)
    // After createProject, the new project's id is generated by Date.now().toString(36)
    // We need to read the latest state
    const latestProjects = useProjectStore.getState().projects;
    const newest = latestProjects[0];
    if (newest) {
      setCurrentProject(newest.id);
    }

    // Apply AI settings
    setAiModel(form.aiModel as "gpt4" | "claude" | "qwen");
    setAiFrequency(
      form.aiFrequency as "active" | "moderate" | "conservative",
    );

    // Close the wizard
    onClose();

    // Show toast
    addToast({
      type: "success",
      title: "项目创建成功",
      message: `"${title}" 已准备就绪，开始你的创作之旅！`,
    });

    // Navigate
    router.push("/story-overview");
  };

  /* ── Upload handler (UI only) ─────────────────────────────────────── */

  const handleUpload = () => {
    addToast({
      type: "info",
      title: "文件上传",
      message: "文件解析功能将在后续版本中上线，敬请期待。",
    });
  };

  /* ════════════════════════════════════════════════════════════════════
     Step renderers
     ════════════════════════════════════════════════════════════════════ */

  /* ── Step 1: Welcome ──────────────────────────────────────────────── */

  const renderStep1 = () => (
    <div className="flex flex-col flex-1">
      {/* Header */}
      <div className="text-center mb-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.05 }}
          className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
          style={{ background: `linear-gradient(135deg, ${S.primary}, #7C6CF5)` }}
        >
          <Sparkles className="w-6 h-6 text-white" />
        </motion.div>
        <h2 className="text-xl font-semibold mb-1.5" style={{ color: S.text }}>
          欢迎使用逐梦 Creator Studio
        </h2>
        <p className="text-sm" style={{ color: S.text3 }}>
          将你的故事转化为互动叙事体验
        </p>
      </div>

      {/* Mode selection */}
      {form.startMode === null && (
        <div className="flex flex-col gap-3 flex-1">
          <motion.button
            onClick={() => update("startMode", "new")}
            className="flex items-center gap-4 rounded-xl border-2 p-4 text-left transition-all duration-200 focus:outline-none"
            style={{
              borderColor: S.border,
              background: S.card,
            }}
            whileHover={{
              borderColor: S.primary,
              backgroundColor: `${S.primary}08`,
            }}
          >
            <div
              className="flex w-10 h-10 shrink-0 items-center justify-center rounded-lg"
              style={{ background: S.s2, color: S.primary }}
            >
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium" style={{ color: S.text }}>
                创建新项目
              </div>
              <div className="text-xs mt-0.5" style={{ color: S.text3 }}>
                从头开始，自定义你的互动叙事
              </div>
            </div>
            <ArrowRight className="w-4 h-4 shrink-0" style={{ color: S.border2 }} />
          </motion.button>

          <motion.button
            onClick={() => update("startMode", "template")}
            className="flex items-center gap-4 rounded-xl border-2 p-4 text-left transition-all duration-200 focus:outline-none"
            style={{
              borderColor: S.border,
              background: S.card,
            }}
            whileHover={{
              borderColor: S.primary,
              backgroundColor: `${S.primary}08`,
            }}
          >
            <div
              className="flex w-10 h-10 shrink-0 items-center justify-center rounded-lg"
              style={{ background: S.s2, color: S.accent }}
            >
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium" style={{ color: S.text }}>
                从模板开始
              </div>
              <div className="text-xs mt-0.5" style={{ color: S.text3 }}>
                选择预设模板，快速启动项目
              </div>
            </div>
            <ArrowRight className="w-4 h-4 shrink-0" style={{ color: S.border2 }} />
          </motion.button>
        </div>
      )}

      {/* Template cards */}
      {form.startMode === "template" && (
        <motion.div
          className="flex flex-col gap-3 flex-1"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <button
            onClick={() => update("startMode", null)}
            className="inline-flex items-center gap-1 text-xs mb-1 focus:outline-none"
            style={{ color: S.text3 }}
          >
            <ArrowLeft className="w-3 h-3" />
            返回
          </button>
          {TEMPLATES.map((tpl) => {
            const Icon = tpl.icon;
            const isSelected = form.templateKey === tpl.key;
            return (
              <motion.button
                key={tpl.key}
                onClick={() => update("templateKey", tpl.key)}
                className="flex items-center gap-4 rounded-xl border-2 p-4 text-left transition-all duration-200 focus:outline-none"
                style={{
                  borderColor: isSelected ? S.primary : S.border,
                  background: isSelected ? `${S.primary}08` : S.card,
                }}
                whileHover={{
                  borderColor: S.primary,
                  backgroundColor: `${S.primary}08`,
                }}
              >
                <div
                  className="flex w-10 h-10 shrink-0 items-center justify-center rounded-lg transition-colors"
                  style={{
                    background: isSelected ? `${S.primary}18` : S.s2,
                    color: isSelected ? S.primary : S.text2,
                  }}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium" style={{ color: S.text }}>
                    {tpl.label}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: S.text3 }}>
                    {tpl.desc}
                  </div>
                </div>
                {isSelected && (
                  <CheckCircle2 className="w-5 h-5 shrink-0" style={{ color: S.primary }} />
                )}
              </motion.button>
            );
          })}
        </motion.div>
      )}
    </div>
  );

  /* ── Step 2: Project Settings ─────────────────────────────────────── */

  const renderStep2 = () => (
    <div className="flex flex-col flex-1 gap-5">
      <div className="text-center mb-1">
        <h2 className="text-xl font-semibold mb-1" style={{ color: S.text }}>
          项目设定
        </h2>
        <p className="text-sm" style={{ color: S.text3 }}>
          定义你的项目基本信息
        </p>
      </div>

      {/* Title */}
      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: S.text2 }}>
          项目名称
        </label>
        <input
          type="text"
          value={form.projectTitle}
          onChange={(e) => update("projectTitle", e.target.value)}
          placeholder="输入项目名称..."
          className="w-full rounded-lg border px-3 py-2 text-sm transition-colors focus:outline-none"
          style={{
            borderColor: S.border,
            background: S.s2,
            color: S.text,
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = S.primary)}
          onBlur={(e) => (e.currentTarget.style.borderColor = S.border)}
        />
      </div>

      {/* Genre */}
      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: S.text2 }}>
          题材类型
        </label>
        <div className="flex flex-wrap gap-2">
          {GENRES.map((g) => {
            const isSelected = form.genre === g;
            return (
              <button
                key={g}
                onClick={() => update("genre", isSelected ? "" : g)}
                className="rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-150 focus:outline-none"
                style={{
                  background: isSelected ? S.primary : S.s2,
                  color: isSelected ? "#FFFFFF" : S.text2,
                  border: `1px solid ${isSelected ? S.primary : S.border}`,
                }}
              >
                {g}
              </button>
            );
          })}
        </div>
      </div>

      {/* Duration */}
      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: S.text2 }}>
          目标时长
        </label>
        <div className="grid grid-cols-3 gap-2">
          {DURATIONS.map((d) => {
            const isSelected = form.duration === d.key;
            return (
              <button
                key={d.key}
                onClick={() => update("duration", d.key)}
                className="flex flex-col items-center rounded-xl border-2 py-2.5 px-2 transition-all duration-150 focus:outline-none"
                style={{
                  borderColor: isSelected ? S.primary : S.border,
                  background: isSelected ? `${S.primary}08` : S.card,
                }}
              >
                <Clock
                  className="w-4 h-4 mb-1"
                  style={{ color: isSelected ? S.primary : S.text3 }}
                />
                <span
                  className="text-xs font-medium"
                  style={{ color: isSelected ? S.primary : S.text }}
                >
                  {d.label}
                </span>
                <span className="text-[10px] mt-0.5" style={{ color: S.text3 }}>
                  {d.detail}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: S.text2 }}>
          项目简介
        </label>
        <textarea
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
          placeholder="简要描述你的故事..."
          rows={2}
          className="w-full rounded-lg border px-3 py-2 text-sm resize-none transition-colors focus:outline-none"
          style={{
            borderColor: S.border,
            background: S.s2,
            color: S.text,
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = S.primary)}
          onBlur={(e) => (e.currentTarget.style.borderColor = S.border)}
        />
      </div>
    </div>
  );

  /* ── Step 3: Content Import ───────────────────────────────────────── */

  const renderStep3 = () => (
    <div className="flex flex-col flex-1 gap-4">
      <div className="text-center mb-1">
        <h2 className="text-xl font-semibold mb-1" style={{ color: S.text }}>
          内容导入
        </h2>
        <p className="text-sm" style={{ color: S.text3 }}>
          选择如何开始你的故事内容
        </p>
      </div>

      {IMPORT_OPTIONS.map((opt) => {
        const Icon = opt.icon;
        const isSelected = form.importMode === opt.key;
        return (
          <motion.button
            key={opt.key}
            onClick={() => update("importMode", opt.key)}
            className="flex items-center gap-4 rounded-xl border-2 p-4 text-left transition-all duration-200 focus:outline-none"
            style={{
              borderColor: isSelected ? S.primary : S.border,
              background: isSelected ? `${S.primary}08` : S.card,
            }}
            whileHover={{
              borderColor: S.primary,
              backgroundColor: `${S.primary}08`,
            }}
          >
            <div
              className="flex w-10 h-10 shrink-0 items-center justify-center rounded-lg transition-colors"
              style={{
                background: isSelected ? `${S.primary}18` : S.s2,
                color: isSelected ? S.primary : S.text2,
              }}
            >
              <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium" style={{ color: S.text }}>
                {opt.label}
              </div>
              <div className="text-xs mt-0.5" style={{ color: S.text3 }}>
                {opt.desc}
              </div>
            </div>
            {isSelected && (
              <CheckCircle2 className="w-5 h-5 shrink-0" style={{ color: S.primary }} />
            )}
          </motion.button>
        );
      })}

      {/* Upload area (show when upload is selected) */}
      {form.importMode === "upload" && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-colors"
          style={{ borderColor: S.border, background: S.s2 }}
          onClick={handleUpload}
        >
          <Upload className="w-8 h-8 mx-auto mb-2" style={{ color: S.text3 }} />
          <p className="text-sm font-medium" style={{ color: S.text2 }}>
            点击或拖拽文件到此处上传
          </p>
          <p className="text-xs mt-1" style={{ color: S.text3 }}>
            支持 .txt, .docx, .pdf 格式，最大 10MB
          </p>
        </motion.div>
      )}

      {/* Paste textarea (show when paste is selected) */}
      {form.importMode === "paste" && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
        >
          <textarea
            value={form.pastedText}
            onChange={(e) => update("pastedText", e.target.value)}
            placeholder="在此粘贴你的故事大纲或剧本..."
            rows={5}
            className="w-full rounded-lg border px-3 py-2 text-sm resize-none transition-colors focus:outline-none"
            style={{
              borderColor: S.border,
              background: S.s2,
              color: S.text,
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = S.primary)}
            onBlur={(e) => (e.currentTarget.style.borderColor = S.border)}
          />
        </motion.div>
      )}
    </div>
  );

  /* ── Step 4: AI Configuration ─────────────────────────────────────── */

  const renderStep4 = () => (
    <div className="flex flex-col flex-1 gap-5">
      <div className="text-center mb-1">
        <h2 className="text-xl font-semibold mb-1" style={{ color: S.text }}>
          AI 辅助配置
        </h2>
        <p className="text-sm" style={{ color: S.text3 }}>
          配置 AI 助手的行为方式
        </p>
      </div>

      {/* AI Model */}
      <div>
        <label className="flex items-center gap-1.5 text-xs font-medium mb-2" style={{ color: S.text2 }}>
          <Wand2 className="w-3.5 h-3.5" />
          AI 模型
        </label>
        <div className="flex flex-col gap-2">
          {AI_MODELS.map((m) => {
            const isSelected = form.aiModel === m.key;
            return (
              <button
                key={m.key}
                onClick={() => update("aiModel", m.key)}
                className="flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-all duration-150 focus:outline-none"
                style={{
                  borderColor: isSelected ? S.primary : S.border,
                  background: isSelected ? `${S.primary}08` : S.card,
                }}
              >
                {/* Radio dot */}
                <div
                  className="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors"
                  style={{
                    borderColor: isSelected ? S.primary : S.border2,
                  }}
                >
                  {isSelected && (
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ background: S.primary }}
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium" style={{ color: S.text }}>
                    {m.label}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: S.text3 }}>
                    {m.desc}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* AI Frequency */}
      <div>
        <label className="flex items-center gap-1.5 text-xs font-medium mb-2" style={{ color: S.text2 }}>
          <Settings className="w-3.5 h-3.5" />
          建议频率
        </label>
        <div className="flex flex-col gap-2">
          {AI_FREQUENCIES.map((f) => {
            const isSelected = form.aiFrequency === f.key;
            return (
              <button
                key={f.key}
                onClick={() => update("aiFrequency", f.key)}
                className="flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-all duration-150 focus:outline-none"
                style={{
                  borderColor: isSelected ? S.primary : S.border,
                  background: isSelected ? `${S.primary}08` : S.card,
                }}
              >
                <div
                  className="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors"
                  style={{
                    borderColor: isSelected ? S.primary : S.border2,
                  }}
                >
                  {isSelected && (
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ background: S.primary }}
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium" style={{ color: S.text }}>
                    {f.label}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: S.text3 }}>
                    {f.desc}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  /* ── Step 5: Summary & Finish ─────────────────────────────────────── */

  const renderStep5 = () => {
    const templateLabel =
      TEMPLATES.find((t) => t.key === form.templateKey)?.label ?? "-";
    const durationLabel =
      DURATIONS.find((d) => d.key === form.duration)?.label ?? "-";
    const importLabel =
      IMPORT_OPTIONS.find((o) => o.key === form.importMode)?.label ?? "-";
    const modelLabel =
      AI_MODELS.find((m) => m.key === form.aiModel)?.label ?? "-";
    const freqLabel =
      AI_FREQUENCIES.find((f) => f.key === form.aiFrequency)?.label ?? "-";

    const summaryRows = [
      { label: "项目名称", value: form.projectTitle || "未命名项目" },
      ...(form.startMode === "template"
        ? [{ label: "模板", value: templateLabel }]
        : []),
      { label: "题材", value: form.genre || "未选择" },
      { label: "目标时长", value: durationLabel },
      { label: "内容导入", value: importLabel },
      { label: "AI 模型", value: modelLabel },
      { label: "AI 频率", value: freqLabel },
    ];

    return (
      <div className="flex flex-col flex-1">
        <div className="text-center mb-5">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.05 }}
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
            style={{ background: `linear-gradient(135deg, ${S.accent}, #2DD4BF)` }}
          >
            <CheckCircle2 className="w-6 h-6 text-white" />
          </motion.div>
          <h2 className="text-xl font-semibold mb-1" style={{ color: S.text }}>
            确认项目设定
          </h2>
          <p className="text-sm" style={{ color: S.text3 }}>
            检查以下信息，确认无误后开始创作
          </p>
        </div>

        {/* Summary card */}
        <div
          className="rounded-xl border p-4 flex-1"
          style={{ background: S.s2, borderColor: S.border }}
        >
          <div className="flex flex-col gap-3">
            {summaryRows.map((row) => (
              <div key={row.label} className="flex items-center justify-between">
                <span className="text-xs" style={{ color: S.text3 }}>
                  {row.label}
                </span>
                <span className="text-sm font-medium" style={{ color: S.text }}>
                  {row.value}
                </span>
              </div>
            ))}
            {form.description && (
              <div>
                <span className="text-xs block mb-1" style={{ color: S.text3 }}>
                  项目简介
                </span>
                <p className="text-xs leading-relaxed" style={{ color: S.text2 }}>
                  {form.description}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* CTA */}
        <motion.button
          onClick={handleFinish}
          className="mt-5 w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium text-white shadow-lg transition-all focus:outline-none"
          style={{
            background: `linear-gradient(to right, ${S.primary}, #7C6CF5)`,
            boxShadow: `0 8px 24px -4px ${S.primary}40`,
          }}
          whileHover={{ scale: 1.015 }}
          whileTap={{ scale: 0.98 }}
        >
          <Globe className="w-4 h-4" />
          开始创作
        </motion.button>
      </div>
    );
  };

  /* ════════════════════════════════════════════════════════════════════
     Main render
     ════════════════════════════════════════════════════════════════════ */

  const stepRenderers = [renderStep1, renderStep2, renderStep3, renderStep4, renderStep5];

  // Determine if "next" button should be disabled
  const isNextDisabled =
    step === 0 &&
    (form.startMode === null ||
      (form.startMode === "template" && !form.templateKey));

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

      {/* Modal card */}
      <motion.div
        className="relative z-10 w-full max-w-[560px] mx-4 rounded-2xl shadow-2xl overflow-hidden"
        style={{
          background: S.card,
          border: `1px solid ${S.border}`,
        }}
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        transition={SPRING}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 rounded-lg p-1.5 transition-colors focus:outline-none"
          style={{ color: S.text3 }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = S.s2;
            e.currentTarget.style.color = S.text2;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = S.text3;
          }}
          aria-label="关闭"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Step content area */}
        <div className="relative min-h-[460px] flex flex-col">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={SPRING}
              className="flex-1 flex flex-col px-8 pt-8 pb-6"
            >
              {stepRenderers[step]()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer: navigation + progress dots */}
        {step < TOTAL_STEPS - 1 && (
          <div
            className="flex items-center justify-between px-6 py-3"
            style={{ borderTop: `1px solid ${S.border}` }}
          >
            {/* Back button / spacer */}
            <div>
              {step > 0 ? (
                <button
                  onClick={goBack}
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors focus:outline-none"
                  style={{ color: S.text2 }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = S.s2;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  上一步
                </button>
              ) : (
                <div />
              )}
            </div>

            {/* Progress dots */}
            <div className="flex items-center gap-1.5">
              {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-full transition-all duration-300"
                  style={{
                    width: i === step ? 8 : 6,
                    height: i === step ? 8 : 6,
                    background:
                      i === step
                        ? S.primary
                        : i < step
                          ? `${S.primary}66`
                          : S.border,
                  }}
                />
              ))}
            </div>

            {/* Next / Skip button */}
            <div>
              {step === 2 && form.importMode === "blank" ? (
                <button
                  onClick={goNext}
                  className="inline-flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-medium transition-colors focus:outline-none"
                  style={{ color: S.text3 }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = S.s2;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  跳过
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  onClick={goNext}
                  disabled={isNextDisabled}
                  className="inline-flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-medium text-white shadow-sm transition-all focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: S.primary }}
                  onMouseEnter={(e) => {
                    if (!isNextDisabled)
                      e.currentTarget.style.background = "#5248C8";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = S.primary;
                  }}
                >
                  下一步
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

export default OnboardingWizard;
