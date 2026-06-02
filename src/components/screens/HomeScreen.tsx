"use client";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Plus, Play, Edit3, Users, MousePointer, Star,
  Search, Clapperboard, ChevronDown, Zap,
  X, ChevronLeft, ChevronRight, Check, Sparkles,
  Monitor, Smartphone, Gamepad2, Globe, Eye, Palette,
  Bot, ShieldCheck, Wand2, Trash2,
} from "lucide-react";
import {
  PROJECT_SPEC_TEMPLATES,
  INDUSTRY_TEMPLATES,
  type ProjectType,
  type ProjectSpecTemplate,
  type IndustryType,
} from "@/lib/studio-data";
import { useProjectStore, useUIStore } from "@/store";

// ── 设计 tokens（现有页面 + 向导共用基础色）─────────────────────────────
const S = {
  bg: "#FAFBFF", card: "#FFFFFF", s2: "#F4F6FC", s3: "#EDF0F8",
  border: "#E2E5F0", border2: "#CBD0E5",
  primary: "#5E50E8", primary10: "rgba(94,80,232,0.10)", primary20: "rgba(94,80,232,0.20)",
  accent: "#00A99D",
  text: "#1A1D2E", text2: "#4A5068", text3: "#8892B0",
  success: "#059669", warning: "#D97706", error: "#DC2626",
  // legacy aliases (header / stats area)
  purple2: "#A78BFA",
};

// ── 现有页面数据 ─────────────────────────────────────────────────────────
const STATS = [
  { icon: Play,         label: "总游玩次数", value: "12", note: "↑ 1 部作品", color: S.primary,  bg: S.primary10 },
  { icon: Users,        label: "独立玩家",   value: "0",  note: "暂无数据",   color: S.accent,   bg: "rgba(0,169,157,0.08)" },
  { icon: MousePointer, label: "选择总次数", value: "0",  note: "暂无数据",   color: S.warning,  bg: "rgba(217,119,6,0.08)" },
  { icon: Star,         label: "已发布作品", value: "1",  note: "↗ 正在运营", color: S.purple2,  bg: "rgba(167,139,250,0.08)" },
];

const STATUS_STYLE: Record<string, { label: string; bg: string; color: string }> = {
  published:   { label: "已发布",   bg: "rgba(5,150,105,0.12)",  color: S.success },
  in_progress: { label: "制作中",   bg: "rgba(94,80,232,0.12)",  color: S.primary },
  idle:        { label: "空闲",     bg: "rgba(100,116,139,0.12)", color: "#64748B" },
  draft:       { label: "草稿",     bg: "rgba(100,116,139,0.12)", color: "#64748B" },
};

// ── 向导常量 ─────────────────────────────────────────────────────────────
const WIZARD_STEPS = [
  { n: 1, label: "项目类型" },
  { n: 2, label: "基本设定" },
  { n: 3, label: "结构规格" },
  { n: 4, label: "高级设定" },
  { n: 5, label: "确认创建" },
];

const VISUAL_STYLES = [
  { value: "cyberpunk",  label: "赛博朋克", icon: "🌃" },
  { value: "ancient",    label: "古风",     icon: "🏯" },
  { value: "modern",     label: "现代",     icon: "🏙️" },
  { value: "fantasy",    label: "奇幻",     icon: "🧙" },
  { value: "realistic",  label: "写实",     icon: "📷" },
  { value: "cartoon",    label: "卡通",     icon: "🎨" },
];

const PLATFORMS = [
  { value: "web_h5",      label: "Web H5",      icon: Globe },
  { value: "ios",          label: "iOS",         icon: Smartphone },
  { value: "android",      label: "Android",     icon: Smartphone },
  { value: "steam",        label: "Steam",       icon: Monitor },
  { value: "wechat_mini",  label: "微信小游戏",  icon: Gamepad2 },
];

// ── 向导表单初始值 ──────────────────────────────────────────────────────
interface WizardForm {
  projectType: ProjectType | null;
  name: string;
  genres: string[];
  duration: string;
  chapters: number | null;
  density: string;
  endings: number | null;
  visualStyle: string;
  platforms: string[];
  aiAutoAssets: boolean;
  aiInteractionDesign: boolean;
  aiQualityCheck: boolean;
}
const INIT_FORM: WizardForm = {
  projectType: null, name: "", genres: [], duration: "",
  chapters: null, density: "", endings: null,
  visualStyle: "modern", platforms: ["web_h5"],
  aiAutoAssets: true, aiInteractionDesign: true, aiQualityCheck: false,
};

// ── 步骤切换动画 ────────────────────────────────────────────────────────
const stepVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:   (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
};

// ── 主组件 ───────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const [moreOpen, setMoreOpen] = useState(false);

  // 向导状态
  const [wizardOpen, setWizardOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [dir, setDir] = useState(1); // 1=前进，-1=后退
  const [form, setForm] = useState<WizardForm>(INIT_FORM);
  const [industryType, setIndustryType] = useState<IndustryType>('game');

  // ── 从 store 获取项目数据 ────────────────────────────────────────────────
  const projects = useProjectStore(state => state.projects);
  const currentProjectId = useProjectStore(state => state.currentProjectId);

  const openWizard = () => { setForm(INIT_FORM); setStep(1); setDir(1); setIndustryType('game'); setWizardOpen(true); useUIStore.getState().setIndustry('game'); };
  const closeWizard = () => setWizardOpen(false);

  // 当前选中行业模板
  const selectedIndustry = useMemo(
    () => INDUSTRY_TEMPLATES.find(t => t.industryType === industryType) ?? INDUSTRY_TEMPLATES[INDUSTRY_TEMPLATES.length - 1],
    [industryType],
  );

  const goNext = () => { if (step < 5) { setDir(1); setStep(s => s + 1); } };
  const goPrev = () => { if (step > 1) { setDir(-1); setStep(s => s - 1); } };

  const update = <K extends keyof WizardForm>(k: K, v: WizardForm[K]) =>
    setForm(f => ({ ...f, [k]: v }));

  const toggleArr = (key: "genres" | "platforms", val: string) =>
    setForm(f => ({
      ...f,
      [key]: f[key].includes(val) ? f[key].filter(x => x !== val) : [...f[key], val],
    }));

  // 当前选中模板
  const tpl = useMemo<ProjectSpecTemplate | null>(
    () => PROJECT_SPEC_TEMPLATES.find(t => t.projectType === form.projectType) ?? null,
    [form.projectType],
  );

  // 步骤可否前进（简单校验）
  const canNext = useMemo(() => {
    if (step === 1) return form.projectType !== null;
    if (step === 2) return form.name.trim().length > 0 && form.genres.length > 0 && form.duration !== "";
    if (step === 3) return form.chapters !== null && form.density !== "" && form.endings !== null;
    if (step === 4) return form.visualStyle !== "" && form.platforms.length > 0;
    return true;
  }, [step, form]);

  const handleCreate = () => {
    const title = form.name.trim();
    if (!title) return;

    const newProject = {
      title,
      genre: form.genres.join("、"),
      cover: "",
      status: "draft" as const,
      healthScore: 0,
      healthLabel: "DRAFT",
      healthType: "warning" as const,
      progress: 0,
      stage1: 0,
      stage2: 0,
      stage3: 0,
      chapters: form.chapters ?? 1,
      nodes: 0,
      branches: 0,
      endings: form.endings ?? 0,
      lastEdited: "刚刚",
    };

    useProjectStore.getState().createProject(newProject);
    useUIStore.getState().addToast({
      type: "success",
      title: "项目创建成功",
      message: `「${title}」已创建`,
      link: { href: "/pipeline", label: "前往制作管线" },
    });
    closeWizard();
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();
    useProjectStore.getState().deleteProject(id);
    useUIStore.getState().addToast({ type: "info", title: "项目已删除" });
  };

  // ── 渲染 ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-svh" style={{ background: S.bg }}>

      {/* ── 首页专属顶部导航栏 ── */}
      <header className="flex items-center h-11 px-4 gap-1 border-b"
        style={{ background: S.card, borderColor: S.border }}>
        <nav className="flex items-center gap-0.5">
          {[
            { label: "发现",     href: "/" },
            { label: "我的资产", href: "/assets" },
            { label: "素材市场", href: "/assets" },
            { label: "能力市场", href: "/overview" },
          ].map(item => (
            <Link key={item.label} href={item.href}>
              <motion.span whileTap={{ scale: 0.97 }}
                className="px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer whitespace-nowrap hover:bg-gray-50 transition-colors"
                style={{ color: S.text2 }}>
                {item.label}
              </motion.span>
            </Link>
          ))}
          <div className="relative">
            <motion.button whileTap={{ scale: 0.97 }}
              onClick={() => setMoreOpen(o => !o)}
              className="flex items-center gap-0.5 px-2.5 py-1 rounded-lg text-xs font-medium focus:outline-none"
              style={{ color: S.text3 }}>
              开发者设置 <ChevronDown size={10} />
            </motion.button>
            <AnimatePresence>
              {moreOpen && (
                <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }} transition={{ duration: 0.12 }}
                  className="absolute top-full left-0 mt-1 rounded-xl py-1 min-w-[120px] z-50"
                  style={{ background: S.card, border: `1px solid ${S.border}`, boxShadow: "0 4px 16px rgba(0,0,0,0.1)" }}>
                  <Link href="/settings">
                    <div className="px-3 py-1.5 text-xs cursor-pointer hover:bg-gray-50"
                      style={{ color: S.text2 }} onClick={() => setMoreOpen(false)}>
                      开发者设置
                    </div>
                  </Link>
                  <Link href="/settings">
                    <div className="px-3 py-1.5 text-xs cursor-pointer hover:bg-gray-50"
                      style={{ color: S.text2 }} onClick={() => setMoreOpen(false)}>
                      AI Key 管理
                    </div>
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </nav>

        <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg ml-1"
          style={{ background: S.primary10, color: S.primary, border: `1px solid ${S.primary20}` }}>
          Key已配置
        </span>

        <div className="flex-1" />

        <div className="flex items-center gap-1.5">
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
            style={{ background: S.s2, border: `1px solid ${S.border}`, minWidth: 130 }}>
            <Search size={12} style={{ color: S.text3 }} />
            <input placeholder="搜索项目…" className="text-xs bg-transparent focus:outline-none w-full"
              style={{ color: S.text }} />
          </div>
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg cursor-pointer"
            style={{ background: S.s2, border: `1px solid ${S.border}` }}>
            <div className="w-5 h-5 rounded-full flex items-center justify-center"
              style={{ background: S.primary }}>
              <span className="text-[8px] text-white font-bold">M</span>
            </div>
            <span className="text-[10px] font-medium" style={{ color: S.text2 }}>maiyiming</span>
          </div>
          <Link href="/parse">
            <motion.button whileTap={{ scale: 0.97 }}
              className="hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium focus:outline-none"
              style={{ background: S.s2, border: `1px solid ${S.border}`, color: S.text2 }}>
              <Clapperboard size={12} /> 短剧改编
            </motion.button>
          </Link>

          {/* 新建项目按钮 —— 打开向导 */}
          <motion.button whileTap={{ scale: 0.97 }}
            onClick={openWizard}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-white focus:outline-none"
            style={{ background: S.primary }}>
            <Plus size={12} /> 新建项目
          </motion.button>
        </div>
      </header>

      {/* ── 主内容 ── */}
      <main className="px-6 py-6 max-w-6xl mx-auto space-y-6">

        {/* 标题行 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color: S.text }}>创作台</h1>
            <p className="text-xs mt-0.5" style={{ color: S.text3 }}>{projects.length} 个项目</p>
          </div>
          <Link href="/parse">
            <motion.button whileTap={{ scale: 0.97 }}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold focus:outline-none"
              style={{ background: S.primary10, border: `1px solid ${S.primary20}`, color: S.primary }}>
              <Zap size={12} /> 剧本解构 · AI流水线
            </motion.button>
          </Link>
        </div>

        {/* 数据概览 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {STATS.map((stat, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-4 rounded-2xl" style={{ background: S.card, border: `1px solid ${S.border}` }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-2"
                style={{ background: stat.bg }}>
                <stat.icon size={15} style={{ color: stat.color }} />
              </div>
              <p className="text-xl font-bold font-mono" style={{ color: S.text }}>{stat.value}</p>
              <p className="text-[10px] mt-0.5" style={{ color: S.text3 }}>{stat.label}</p>
              <p className="text-[9px] mt-0.5" style={{ color: stat.color }}>{stat.note}</p>
            </motion.div>
          ))}
        </div>

        {/* 作品表现 */}
        <div className="p-4 rounded-2xl" style={{ background: S.card, border: `1px solid ${S.border}` }}>
          <h2 className="text-sm font-bold mb-2" style={{ color: S.text }}>作品表现</h2>
          <div className="flex items-center justify-between py-1.5"
            style={{ borderBottom: `1px solid ${S.border}` }}>
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono" style={{ color: S.text3 }}>1</span>
              <span className="text-xs font-medium" style={{ color: S.text }}>幽灵协议</span>
            </div>
            <span className="text-xs font-mono font-bold" style={{ color: S.primary }}>11 次</span>
          </div>
        </div>

        {/* 项目网格 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

          {/* 新建卡片 —— 点击打开向导 */}
          <motion.div whileTap={{ scale: 0.98 }}
            onClick={openWizard}
            className="rounded-2xl flex flex-col items-center justify-center cursor-pointer"
            style={{ background: S.card, border: `1.5px dashed ${S.border2}`, minHeight: 260 }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-2"
              style={{ background: S.primary10 }}>
              <Plus size={20} style={{ color: S.primary }} />
            </div>
            <span className="text-sm font-medium" style={{ color: S.text2 }}>新建项目</span>
            <span className="text-[10px] mt-1" style={{ color: S.text3 }}>使用创建向导</span>
          </motion.div>

          {/* 项目卡片 */}
          {projects.map((p, i) => {
            const st = STATUS_STYLE[p.status] ?? STATUS_STYLE.draft;
            const isCurrent = currentProjectId === p.id;
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                onClick={() => useProjectStore.getState().setCurrentProject(p.id)}
                className="group rounded-2xl overflow-hidden cursor-pointer transition-shadow duration-150"
                style={{
                  background: S.card,
                  border: isCurrent ? `2px solid ${S.primary}` : `1px solid ${S.border}`,
                  boxShadow: isCurrent ? `0 0 0 3px ${S.primary20}` : "none",
                }}
              >
                <div className="relative overflow-hidden" style={{ height: 160 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.cover || `https://placehold.co/400x160/${S.s3.slice(1)}/${S.text3.slice(1)}?text=${encodeURIComponent(p.title)}`}
                    alt={p.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0" style={{ background: "linear-gradient(to top,rgba(0,0,0,0.4),transparent)" }} />
                  <span className="absolute top-2 left-2 text-[9px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: st.bg, color: st.color }}>
                    {st.label}
                  </span>
                  {/* 删除按钮（悬停显示） */}
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => handleDelete(e, p.id)}
                    className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150 focus:outline-none z-10"
                    style={{ background: "rgba(220,38,38,0.85)", color: "#fff" }}
                    title="删除项目"
                  >
                    <Trash2 size={11} />
                  </motion.button>
                </div>
                <div className="p-3 space-y-2">
                  <h3 className="text-sm font-bold truncate" style={{ color: S.text }}>{p.title}</h3>
                  <p className="text-[10px]" style={{ color: S.text3 }}>{p.genre}</p>
                  {(p as any).desc && (
                    <p className="text-[10px] line-clamp-2" style={{ color: S.text3 }}>{(p as any).desc}</p>
                  )}
                  <p className="text-[9px] font-mono" style={{ color: S.text3 }}>
                    {p.chapters}章 · {p.nodes}节点 · {p.branches}分支
                  </p>
                  <div className="flex gap-2">
                    <Link href="/nodes" className="flex-1">
                      <motion.button whileTap={{ scale: 0.97 }}
                        className="w-full flex items-center justify-center gap-1 py-1.5 rounded-xl text-xs font-bold text-white focus:outline-none"
                        style={{ background: S.primary }}>
                        <Edit3 size={11} /> 编辑
                      </motion.button>
                    </Link>
                    {p.status === "published" && (
                      <Link href="/simulator">
                        <motion.button whileTap={{ scale: 0.97 }}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium focus:outline-none"
                          style={{ background: S.s2, border: `1px solid ${S.border}`, color: S.text2 }}>
                          <Play size={11} /> 试玩
                        </motion.button>
                      </Link>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </main>

      {/* ══════════════════════════════════════════════════════════════════
          项目创建向导弹窗
          ══════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {wizardOpen && (
          <motion.div
            key="wizard-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] flex items-center justify-center"
            style={{ background: "rgba(15,17,30,0.55)", backdropFilter: "blur(6px)" }}
            onClick={closeWizard}
          >
            <motion.div
              key="wizard-panel"
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 20 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full max-w-3xl mx-4 rounded-3xl overflow-hidden flex flex-col"
              style={{ background: S.card, border: `1px solid ${S.border}`, maxHeight: "92vh",
                       boxShadow: "0 24px 80px rgba(94,80,232,0.18), 0 4px 20px rgba(0,0,0,0.12)" }}
              onClick={e => e.stopPropagation()}
            >

              {/* ── 向导顶部栏 ── */}
              <div className="flex items-center justify-between px-6 pt-5 pb-3">
                <div>
                  <h2 className="text-base font-bold" style={{ color: S.text }}>新建项目</h2>
                  <p className="text-[11px] mt-0.5" style={{ color: S.text3 }}>
                    步骤 {step} / 5 — {WIZARD_STEPS[step - 1].label}
                  </p>
                </div>
                <motion.button whileTap={{ scale: 0.9 }}
                  onClick={closeWizard}
                  className="w-7 h-7 rounded-full flex items-center justify-center focus:outline-none"
                  style={{ background: S.s2, border: `1px solid ${S.border}` }}>
                  <X size={13} style={{ color: S.text3 }} />
                </motion.button>
              </div>

              {/* ── 步骤进度条 ── */}
              <div className="flex items-center gap-1.5 px-6 pb-4">
                {WIZARD_STEPS.map((s, i) => (
                  <div key={s.n} className="flex items-center gap-1.5 flex-1">
                    <div className="flex items-center gap-1.5 flex-1">
                      {/* 圆点 */}
                      <div className="flex items-center justify-center w-5 h-5 rounded-full text-[9px] font-bold shrink-0 transition-all duration-200"
                        style={{
                          background: step >= s.n ? S.primary : S.s3,
                          color: step >= s.n ? "#fff" : S.text3,
                          border: step === s.n ? `2px solid ${S.primary20}` : "2px solid transparent",
                        }}>
                        {step > s.n ? <Check size={9} /> : s.n}
                      </div>
                      {/* 连线 */}
                      {i < WIZARD_STEPS.length - 1 && (
                        <div className="flex-1 h-0.5 rounded-full transition-all duration-300"
                          style={{ background: step > s.n ? S.primary : S.s3 }} />
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* ── 步骤内容区 ── */}
              <div className="flex-1 overflow-y-auto px-6 pb-4" style={{ minHeight: 340 }}>
                <AnimatePresence mode="wait" custom={dir}>
                  <motion.div
                    key={step}
                    custom={dir}
                    variants={stepVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                  >
                    {/* ── Step 1: 行业 + 项目类型 ── */}
                    {step === 1 && (
                      <div className="space-y-3">
                        <p className="text-xs mb-1" style={{ color: S.text2 }}>
                          选择你的行业方向和项目类型，我们会为你推荐合适的创作流程和规格模板。
                        </p>

                        {/* ── 行业选择 ── */}
                        <div>
                          <label className="block text-xs font-semibold mb-2" style={{ color: S.text }}>
                            行业选择
                          </label>
                          <div className="grid grid-cols-4 gap-2">
                            {INDUSTRY_TEMPLATES.map(ind => {
                              const active = industryType === ind.industryType;
                              return (
                                <motion.button
                                  key={ind.industryType}
                                  whileTap={{ scale: 0.97 }}
                                  onClick={() => { setIndustryType(ind.industryType); useUIStore.getState().setIndustry(ind.industryType); }}
                                  className="text-left p-3 rounded-2xl transition-all duration-150 focus:outline-none flex flex-col"
                                  style={{
                                    background: active ? "rgba(94,80,232,0.06)" : S.card,
                                    border: `1.5px solid ${active ? S.primary : "#E2E5F0"}`,
                                    boxShadow: active ? `0 0 0 2px ${S.primary20}` : "none",
                                    minWidth: 0,
                                  }}
                                >
                                  <span className="text-[28px] leading-none mb-1.5">{ind.icon}</span>
                                  <span className="text-[11px] font-bold leading-tight" style={{ color: active ? S.primary : S.text }}>
                                    {ind.label}
                                  </span>
                                  <span className="text-[9px] leading-snug mt-1 line-clamp-2" style={{ color: S.text3 }}>
                                    {ind.description.length > 60 ? ind.description.slice(0, 60) + "..." : ind.description}
                                  </span>
                                  <span className="text-[8px] mt-1.5 leading-tight" style={{ color: S.text3, opacity: 0.75 }}>
                                    {ind.targetUsers}
                                  </span>
                                </motion.button>
                              );
                            })}
                          </div>

                          {/* ── 行业特征标签 ── */}
                          <div className="mt-2.5 space-y-1.5">
                            {/* 默认对象 */}
                            <div className="flex flex-wrap items-center gap-1">
                              <span className="text-[9px] font-semibold shrink-0 mr-0.5" style={{ color: S.text3 }}>常用对象</span>
                              {selectedIndustry.defaultObjects.slice(0, 6).map(tag => (
                                <span key={tag} className="px-2 py-0.5 rounded-full text-[9px] font-medium"
                                  style={{ background: "rgba(94,80,232,0.07)", color: S.primary }}>
                                  {tag}
                                </span>
                              ))}
                            </div>
                            {/* 默认互动 */}
                            <div className="flex flex-wrap items-center gap-1">
                              <span className="text-[9px] font-semibold shrink-0 mr-0.5" style={{ color: S.text3 }}>互动方式</span>
                              {selectedIndustry.defaultInteractions.slice(0, 5).map(tag => (
                                <span key={tag} className="px-2 py-0.5 rounded-full text-[9px] font-medium"
                                  style={{ background: "rgba(0,169,157,0.08)", color: S.accent }}>
                                  {tag}
                                </span>
                              ))}
                            </div>
                            {/* 发布格式 */}
                            <div className="flex flex-wrap items-center gap-1">
                              <span className="text-[9px] font-semibold shrink-0 mr-0.5" style={{ color: S.text3 }}>发布格式</span>
                              {selectedIndustry.defaultPublishFormats.slice(0, 5).map(tag => (
                                <span key={tag} className="px-2 py-0.5 rounded-full text-[9px] font-medium"
                                  style={{ background: "rgba(217,119,6,0.08)", color: S.warning }}>
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* ── 项目类型 ── */}
                        <div>
                          <label className="block text-xs font-semibold mb-2" style={{ color: S.text }}>
                            创建方式
                            <span className="font-normal ml-1.5 text-[10px]" style={{ color: S.text3 }}>
                              — 推荐用于{selectedIndustry.label}
                            </span>
                          </label>
                          <div className="grid grid-cols-2 gap-3">
                            {PROJECT_SPEC_TEMPLATES.map(t => {
                              const selected = form.projectType === t.projectType;
                              return (
                                <motion.button key={t.projectType}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={() => update("projectType", t.projectType)}
                                  className="text-left p-4 rounded-2xl transition-all duration-150 focus:outline-none"
                                  style={{
                                    background: selected ? S.primary10 : S.s2,
                                    border: `1.5px solid ${selected ? S.primary : S.border}`,
                                    boxShadow: selected ? `0 0 0 3px ${S.primary20}` : "none",
                                  }}>
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-2xl">{t.typeIcon}</span>
                                    <span className="text-[8px] font-semibold px-1.5 py-0.5 rounded-full"
                                      style={{ background: "rgba(94,80,232,0.08)", color: S.primary }}>
                                      {industryType === "tourism" && t.projectType === "interactive_import" ? "推荐" :
                                       industryType === "education" && t.projectType === "original_creation" ? "推荐" :
                                       industryType === "derivative" && t.projectType === "script_adaptation" ? "推荐" :
                                       industryType === "game" && t.projectType === "novel_adaptation" ? "推荐" : ""}
                                    </span>
                                  </div>
                                  <p className="text-sm font-bold" style={{ color: selected ? S.primary : S.text }}>
                                    {t.typeLabel}
                                  </p>
                                  <p className="text-[10px] mt-1 leading-relaxed" style={{ color: S.text3 }}>
                                    {t.typeDescription}
                                  </p>
                                </motion.button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ── Step 2: 基本设定 ── */}
                    {step === 2 && tpl && (
                      <div className="space-y-4">
                        {/* 项目名称 */}
                        <div>
                          <label className="block text-xs font-semibold mb-1.5" style={{ color: S.text }}>
                            项目名称 <span style={{ color: S.error }}>*</span>
                          </label>
                          <input
                            value={form.name}
                            onChange={e => update("name", e.target.value)}
                            placeholder="输入你的项目名称…"
                            className="w-full px-3 py-2 rounded-xl text-sm focus:outline-none transition-all"
                            style={{ background: S.s2, border: `1.5px solid ${S.border}`, color: S.text }}
                            onFocus={e => (e.target.style.borderColor = S.primary)}
                            onBlur={e => (e.target.style.borderColor = S.border)}
                          />
                        </div>
                        {/* 题材 */}
                        <div>
                          <label className="block text-xs font-semibold mb-1.5" style={{ color: S.text }}>
                            题材选择 <span style={{ color: S.error }}>*</span>
                            <span className="font-normal ml-1" style={{ color: S.text3 }}>（可多选）</span>
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {tpl.suggestedGenres.map(g => {
                              const on = form.genres.includes(g);
                              return (
                                <motion.button key={g} whileTap={{ scale: 0.95 }}
                                  onClick={() => toggleArr("genres", g)}
                                  className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all focus:outline-none"
                                  style={{
                                    background: on ? S.primary : S.s2,
                                    color: on ? "#fff" : S.text2,
                                    border: `1px solid ${on ? S.primary : S.border}`,
                                  }}>
                                  {g}
                                </motion.button>
                              );
                            })}
                          </div>
                        </div>
                        {/* 目标时长 */}
                        <div>
                          <label className="block text-xs font-semibold mb-1.5" style={{ color: S.text }}>
                            目标时长 <span style={{ color: S.error }}>*</span>
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {tpl.suggestedDurations.map(d => {
                              const on = form.duration === d.value;
                              return (
                                <motion.button key={d.value} whileTap={{ scale: 0.95 }}
                                  onClick={() => update("duration", d.value)}
                                  className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all focus:outline-none"
                                  style={{
                                    background: on ? S.primary : S.s2,
                                    color: on ? "#fff" : S.text2,
                                    border: `1px solid ${on ? S.primary : S.border}`,
                                  }}>
                                  {d.label}
                                </motion.button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ── Step 3: 结构规格 ── */}
                    {step === 3 && tpl && (
                      <div className="space-y-4">
                        {/* 章节数 */}
                        {tpl.suggestedChapters.length > 0 && (
                          <div>
                            <label className="block text-xs font-semibold mb-1.5" style={{ color: S.text }}>
                              章节数 <span style={{ color: S.error }}>*</span>
                            </label>
                            <div className="flex flex-wrap gap-2">
                              {tpl.suggestedChapters.map(c => {
                                const on = form.chapters === c;
                                return (
                                  <motion.button key={c} whileTap={{ scale: 0.95 }}
                                    onClick={() => update("chapters", c)}
                                    className="px-4 py-2 rounded-xl text-xs font-bold transition-all focus:outline-none"
                                    style={{
                                      background: on ? S.primary : S.s2,
                                      color: on ? "#fff" : S.text2,
                                      border: `1.5px solid ${on ? S.primary : S.border}`,
                                    }}>
                                    {c} 章
                                  </motion.button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        {/* 互动密度 */}
                        <div>
                          <label className="block text-xs font-semibold mb-1.5" style={{ color: S.text }}>
                            互动密度 <span style={{ color: S.error }}>*</span>
                          </label>
                          <div className="flex flex-col gap-2">
                            {tpl.suggestedInteractionDensity.map(d => {
                              const on = form.density === d.value;
                              return (
                                <motion.button key={d.value} whileTap={{ scale: 0.98 }}
                                  onClick={() => update("density", d.value)}
                                  className="text-left px-4 py-2.5 rounded-xl text-xs font-medium transition-all focus:outline-none"
                                  style={{
                                    background: on ? S.primary10 : S.s2,
                                    color: on ? S.primary : S.text2,
                                    border: `1.5px solid ${on ? S.primary : S.border}`,
                                  }}>
                                  {d.label}
                                </motion.button>
                              );
                            })}
                          </div>
                        </div>
                        {/* 结局数量 */}
                        {tpl.suggestedEndings.length > 0 && (
                          <div>
                            <label className="block text-xs font-semibold mb-1.5" style={{ color: S.text }}>
                              结局数量 <span style={{ color: S.error }}>*</span>
                            </label>
                            <div className="flex flex-wrap gap-2">
                              {tpl.suggestedEndings.map(e => {
                                const on = form.endings === e;
                                return (
                                  <motion.button key={e} whileTap={{ scale: 0.95 }}
                                    onClick={() => update("endings", e)}
                                    className="px-4 py-2 rounded-xl text-xs font-bold transition-all focus:outline-none"
                                    style={{
                                      background: on ? S.primary : S.s2,
                                      color: on ? "#fff" : S.text2,
                                      border: `1.5px solid ${on ? S.primary : S.border}`,
                                    }}>
                                    {e} 个结局
                                  </motion.button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* ── Step 4: 高级设定 ── */}
                    {step === 4 && (
                      <div className="space-y-4">
                        {/* 视觉风格 */}
                        <div>
                          <label className="block text-xs font-semibold mb-1.5" style={{ color: S.text }}>
                            <Palette size={11} className="inline mr-1" style={{ color: S.primary }} />
                            视觉风格
                          </label>
                          <div className="grid grid-cols-3 gap-2">
                            {VISUAL_STYLES.map(v => {
                              const on = form.visualStyle === v.value;
                              return (
                                <motion.button key={v.value} whileTap={{ scale: 0.96 }}
                                  onClick={() => update("visualStyle", v.value)}
                                  className="flex flex-col items-center gap-1 py-3 rounded-xl text-xs font-medium transition-all focus:outline-none"
                                  style={{
                                    background: on ? S.primary10 : S.s2,
                                    color: on ? S.primary : S.text2,
                                    border: `1.5px solid ${on ? S.primary : S.border}`,
                                  }}>
                                  <span className="text-xl">{v.icon}</span>
                                  {v.label}
                                </motion.button>
                              );
                            })}
                          </div>
                        </div>
                        {/* 目标平台 */}
                        <div>
                          <label className="block text-xs font-semibold mb-1.5" style={{ color: S.text }}>
                            <Monitor size={11} className="inline mr-1" style={{ color: S.primary }} />
                            目标平台
                            <span className="font-normal ml-1" style={{ color: S.text3 }}>（可多选）</span>
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {PLATFORMS.map(p => {
                              const on = form.platforms.includes(p.value);
                              const Icon = p.icon;
                              return (
                                <motion.button key={p.value} whileTap={{ scale: 0.95 }}
                                  onClick={() => toggleArr("platforms", p.value)}
                                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all focus:outline-none"
                                  style={{
                                    background: on ? S.primary : S.s2,
                                    color: on ? "#fff" : S.text2,
                                    border: `1px solid ${on ? S.primary : S.border}`,
                                  }}>
                                  <Icon size={12} /> {p.label}
                                </motion.button>
                              );
                            })}
                          </div>
                        </div>
                        {/* AI 辅助选项 */}
                        <div>
                          <label className="block text-xs font-semibold mb-1.5" style={{ color: S.text }}>
                            <Bot size={11} className="inline mr-1" style={{ color: S.primary }} />
                            AI 辅助选项
                          </label>
                          <div className="space-y-2">
                            {([
                              { key: "aiAutoAssets" as const,          label: "AI 自动生成资产",    desc: "自动为角色、场景生成配图和音效", icon: Sparkles },
                              { key: "aiInteractionDesign" as const,   label: "AI 辅助互动设计",    desc: "智能推荐分支剧情和选择节点",     icon: Wand2 },
                              { key: "aiQualityCheck" as const,        label: "AI 质量检查",        desc: "自动检测剧情逻辑漏洞和资产缺失", icon: ShieldCheck },
                            ]).map(opt => {
                              const on = form[opt.key] as boolean;
                              const Icon = opt.icon;
                              return (
                                <motion.button key={opt.key} whileTap={{ scale: 0.98 }}
                                  onClick={() => update(opt.key, !on as never)}
                                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all focus:outline-none"
                                  style={{
                                    background: on ? S.primary10 : S.s2,
                                    border: `1.5px solid ${on ? S.primary : S.border}`,
                                  }}>
                                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                                    style={{ background: on ? S.primary20 : S.s3 }}>
                                    <Icon size={14} style={{ color: on ? S.primary : S.text3 }} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold" style={{ color: on ? S.primary : S.text }}>{opt.label}</p>
                                    <p className="text-[10px]" style={{ color: S.text3 }}>{opt.desc}</p>
                                  </div>
                                  {/* toggle indicator */}
                                  <div className="w-9 h-5 rounded-full flex items-center px-0.5 transition-all shrink-0"
                                    style={{ background: on ? S.primary : S.border2 }}>
                                    <motion.div layout
                                      className="w-4 h-4 rounded-full bg-white shadow"
                                      style={{ marginLeft: on ? "auto" : 0 }} />
                                  </div>
                                </motion.button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ── Step 5: 确认与创建 ── */}
                    {step === 5 && (
                      <div className="space-y-4">
                        <p className="text-xs" style={{ color: S.text2 }}>
                          请确认以下项目规格，确认无误后点击「创建项目」。
                        </p>

                        {/* 规格摘要卡片 */}
                        <div className="rounded-2xl p-4 space-y-3" style={{ background: S.s2, border: `1px solid ${S.border}` }}>

                          {/* 行业类型 */}
                          <SummaryRow label="行业方向" value={`${selectedIndustry.icon} ${selectedIndustry.label}`} highlight />
                          <Divider />

                          {/* 项目类型 */}
                          <SummaryRow label="项目类型" value={tpl ? `${tpl.typeIcon} ${tpl.typeLabel}` : "—"} />
                          <Divider />

                          {/* 名称 */}
                          <SummaryRow label="项目名称" value={form.name || "—"} highlight />
                          <Divider />

                          {/* 题材 */}
                          <SummaryRow label="题材" value={form.genres.length ? form.genres.join("、") : "—"} />
                          <Divider />

                          {/* 时长 */}
                          <SummaryRow label="目标时长"
                            value={tpl?.suggestedDurations.find(d => d.value === form.duration)?.label ?? "—"} />
                          <Divider />

                          {/* 章节 */}
                          {form.chapters !== null && (
                            <>
                              <SummaryRow label="章节数" value={`${form.chapters} 章`} />
                              <Divider />
                            </>
                          )}

                          {/* 密度 */}
                          <SummaryRow label="互动密度"
                            value={tpl?.suggestedInteractionDensity.find(d => d.value === form.density)?.label ?? "—"} />
                          <Divider />

                          {/* 结局 */}
                          {form.endings !== null && (
                            <>
                              <SummaryRow label="结局数量" value={`${form.endings} 个`} />
                              <Divider />
                            </>
                          )}

                          {/* 视觉风格 */}
                          <SummaryRow label="视觉风格"
                            value={VISUAL_STYLES.find(v => v.value === form.visualStyle)?.label ?? "—"} />
                          <Divider />

                          {/* 平台 */}
                          <SummaryRow label="目标平台"
                            value={form.platforms.map(pv => PLATFORMS.find(p => p.value === pv)?.label).filter(Boolean).join("、") || "—"} />
                          <Divider />

                          {/* AI */}
                          <SummaryRow label="AI 辅助"
                            value={[
                              form.aiAutoAssets && "自动生成资产",
                              form.aiInteractionDesign && "辅助互动设计",
                              form.aiQualityCheck && "质量检查",
                            ].filter(Boolean).join("、") || "未启用"} />
                        </div>

                        {/* 操作按钮 */}
                        <div className="flex gap-3 pt-1">
                          <motion.button whileTap={{ scale: 0.97 }}
                            onClick={goPrev}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium focus:outline-none"
                            style={{ background: S.s2, border: `1.5px solid ${S.border}`, color: S.text2 }}>
                            <ChevronLeft size={14} /> 返回修改
                          </motion.button>
                          <motion.button whileTap={{ scale: 0.97 }}
                            onClick={handleCreate}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold text-white focus:outline-none"
                            style={{ background: S.primary, boxShadow: `0 4px 16px ${S.primary20}` }}>
                            <Check size={14} /> 创建项目
                          </motion.button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* ── 向导底部操作栏（Step 1-4） ── */}
              {step < 5 && (
                <div className="flex items-center justify-between px-6 py-4 border-t"
                  style={{ borderColor: S.border, background: S.s2 }}>
                  <motion.button whileTap={{ scale: 0.97 }}
                    onClick={step === 1 ? closeWizard : goPrev}
                    className="flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-medium focus:outline-none"
                    style={{ background: S.card, border: `1.5px solid ${S.border}`, color: S.text2 }}>
                    <ChevronLeft size={12} />
                    {step === 1 ? "取消" : "上一步"}
                  </motion.button>

                  <span className="text-[10px] font-mono" style={{ color: S.text3 }}>
                    {step} / 5
                  </span>

                  <motion.button whileTap={{ scale: 0.97 }}
                    onClick={goNext}
                    disabled={!canNext}
                    className="flex items-center gap-1 px-5 py-2 rounded-xl text-xs font-bold text-white focus:outline-none transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ background: S.primary, boxShadow: canNext ? `0 2px 8px ${S.primary20}` : "none" }}>
                    下一步 <ChevronRight size={12} />
                  </motion.button>
                </div>
              )}

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── 辅助子组件 ────────────────────────────────────────────────────────────
function SummaryRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[11px]" style={{ color: S.text3 }}>{label}</span>
      <span className="text-xs font-semibold" style={{ color: highlight ? S.primary : S.text }}>{value}</span>
    </div>
  );
}
function Divider() {
  return <div className="h-px" style={{ background: S.border }} />;
}
