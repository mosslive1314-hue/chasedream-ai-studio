"use client";
import { useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  BookOpen, Scissors, FileText, MousePointer,
  GitBranch, Layers, Zap, Trophy, ArrowRight,
  Sparkles, Target,
} from "lucide-react";
import { useNarrativeStore, useSettingsStore } from "@/store";

// ── Design tokens (same as OverviewScreen) ──────────────────────────────
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

// ── Pipeline stage labels (10-step deconstruction) ──────────────────────
const PARSE_STEPS = [
  "项目创建", "素材导入", "要素提取", "世界规则",
  "章纲规划", "线性剧本", "互动设计", "变量配置",
  "节点验证", "资产管理",
];

// ── Animation variants ──────────────────────────────────────────────────
const fadeInUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35 },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.08 } },
};

// ── Stat pill ───────────────────────────────────────────────────────────
function StatPill({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div className="flex flex-col items-center p-3 rounded-xl" style={{ background: S.s2, border: `1px solid ${S.border}` }}>
      <span className="text-lg font-bold font-mono" style={{ color }}>{value}</span>
      <span className="text-[9px] mt-0.5" style={{ color: S.text3 }}>{label}</span>
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────
export default function StoryOverviewScreen() {
  const projectName = useSettingsStore(s => s.projectName);

  // ── Store selectors ───────────────────────────────────────────────────
  const chapterPlans = useNarrativeStore(s => s.chapterPlans);
  const scriptBlocks = useNarrativeStore(s => s.scriptBlocks);
  const interactionPoints = useNarrativeStore(s => s.interactionPoints);
  const branchPaths = useNarrativeStore(s => s.branchPaths);
  const variables = useNarrativeStore(s => s.variables);
  const consequenceChains = useNarrativeStore(s => s.consequenceChains);
  const qteConfigs = useNarrativeStore(s => s.qteConfigs);
  const worldRules = useNarrativeStore(s => s.worldRules);
  const worldBuilding = useNarrativeStore(s => s.worldBuilding);
  const pipelineStages = useNarrativeStore(s => s.pipelineStages);

  // ── Derived data ──────────────────────────────────────────────────────
  const eventsPerChapter = useMemo(() =>
    chapterPlans.map(cp => ({ title: cp.title, count: cp.events.length })),
    [chapterPlans],
  );

  const maxEvents = useMemo(() =>
    Math.max(1, ...eventsPerChapter.map(e => e.count)),
    [eventsPerChapter],
  );

  return (
    <div className="min-h-svh overflow-y-auto" style={{ background: S.bg }}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 px-5 py-3 flex items-center justify-between"
        style={{ background: "rgba(250,251,255,0.92)", backdropFilter: "blur(12px)", borderBottom: `1px solid ${S.border}` }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: `linear-gradient(135deg,${S.primary},#A78BFA)` }}>
            <BookOpen size={15} style={{ color: "#fff" }} />
          </div>
          <div>
            <h2 className="text-sm font-bold" style={{ color: S.text }}>
              剧本总览
              <span className="ml-1.5 text-[10px] font-medium" style={{ color: S.text3 }}>{projectName}</span>
            </h2>
            <p className="text-[9px]" style={{ color: S.text3 }}>创作进度与叙事结构全景</p>
          </div>
        </div>
        <Link href="/parse">
          <motion.button whileTap={{ scale: 0.95 }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white focus:outline-none"
            style={{ background: S.primary, boxShadow: `0 2px 8px ${S.primary}30` }}>
            <Scissors size={11} /> 进入解构
          </motion.button>
        </Link>
      </div>

      <motion.div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 space-y-5"
        variants={stagger} initial="initial" animate="animate">

        {/* ── Three Core Cards ──────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

          {/* ── Card A: 解构进度 ──────────────────────────────────────── */}
          <motion.div variants={fadeInUp}
            className="rounded-2xl p-5"
            style={{ background: S.card, border: `1px solid ${S.border}`, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: S.primary10 }}>
                <Layers size={14} style={{ color: S.primary }} />
              </div>
              <div>
                <h3 className="text-xs font-bold" style={{ color: S.text }}>解构进度</h3>
                <p className="text-[9px]" style={{ color: S.text3 }}>10 步解构流水线</p>
              </div>
            </div>

            {/* Pipeline step progress bars */}
            <div className="space-y-1.5 mb-4">
              {PARSE_STEPS.map((step, i) => {
                const stage = pipelineStages[i];
                const progress = stage?.progress ?? 0;
                const isComplete = progress >= 100;
                const isActive = stage?.status === "active";
                return (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-[8px] font-mono w-4 shrink-0 text-right" style={{ color: S.text3 }}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="text-[9px] w-16 shrink-0 truncate" style={{ color: S.text2 }}>{step}</span>
                    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: S.s3 }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.5, delay: i * 0.05 }}
                        className="h-full rounded-full"
                        style={{
                          background: isComplete ? S.success : isActive ? S.primary : S.s3,
                        }}
                      />
                    </div>
                    <span className="text-[8px] font-mono w-7 shrink-0 text-right" style={{
                      color: isComplete ? S.success : isActive ? S.primary : S.text3,
                    }}>
                      {progress}%
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Key metrics */}
            <div className="grid grid-cols-3 gap-2">
              <StatPill label="已规划章节" value={chapterPlans.length} color={S.primary} />
              <StatPill label="世界规则" value={worldRules.length} color={S.warning} />
              <StatPill label="世界观条目" value={worldBuilding.length} color={S.accent} />
            </div>
          </motion.div>

          {/* ── Card B: 叙事结构 ──────────────────────────────────────── */}
          <motion.div variants={fadeInUp}
            className="rounded-2xl p-5"
            style={{ background: S.card, border: `1px solid ${S.border}`, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: S.accent10 }}>
                <BookOpen size={14} style={{ color: S.accent }} />
              </div>
              <div>
                <h3 className="text-xs font-bold" style={{ color: S.text }}>叙事结构</h3>
                <p className="text-[9px]" style={{ color: S.text3 }}>剧本与章节数据</p>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <StatPill label="章节数" value={chapterPlans.length} color={S.primary} />
              <StatPill label="剧本块" value={scriptBlocks.length} color={S.accent} />
              <StatPill label="互动点" value={interactionPoints.length} color={S.warning} />
            </div>

            {/* Bar chart: events per chapter */}
            {eventsPerChapter.length > 0 && (
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wider mb-2" style={{ color: S.text3 }}>
                  章节事件分布
                </p>
                <div className="flex items-end gap-1.5" style={{ height: 80 }}>
                  {eventsPerChapter.map((ch, i) => {
                    const h = Math.max(8, (ch.count / maxEvents) * 72);
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: h }}
                          transition={{ duration: 0.4, delay: i * 0.06 }}
                          className="w-full rounded-t-md"
                          style={{
                            background: `linear-gradient(to top, ${S.primary}, ${S.accent})`,
                            opacity: 0.85,
                            minHeight: 8,
                          }}
                        />
                        <span className="text-[7px] font-mono truncate w-full text-center" style={{ color: S.text3 }}>
                          第{ch.title.replace(/\D/g, "") || i + 1}章
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>

          {/* ── Card C: 互动设计 ──────────────────────────────────────── */}
          <motion.div variants={fadeInUp}
            className="rounded-2xl p-5"
            style={{ background: S.card, border: `1px solid ${S.border}`, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: S.warning10 }}>
                <GitBranch size={14} style={{ color: S.warning }} />
              </div>
              <div>
                <h3 className="text-xs font-bold" style={{ color: S.text }}>互动设计</h3>
                <p className="text-[9px]" style={{ color: S.text3 }}>分支、变量与互动机制</p>
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="p-3 rounded-xl flex items-center gap-2.5" style={{ background: S.s2, border: `1px solid ${S.border}` }}>
                <GitBranch size={16} style={{ color: S.primary }} />
                <div>
                  <p className="text-lg font-bold font-mono" style={{ color: S.primary }}>{branchPaths.length}</p>
                  <p className="text-[8px]" style={{ color: S.text3 }}>分支路径</p>
                </div>
              </div>
              <div className="p-3 rounded-xl flex items-center gap-2.5" style={{ background: S.s2, border: `1px solid ${S.border}` }}>
                <Zap size={16} style={{ color: S.accent }} />
                <div>
                  <p className="text-lg font-bold font-mono" style={{ color: S.accent }}>{variables.length}</p>
                  <p className="text-[8px]" style={{ color: S.text3 }}>变量</p>
                </div>
              </div>
              <div className="p-3 rounded-xl flex items-center gap-2.5" style={{ background: S.s2, border: `1px solid ${S.border}` }}>
                <Target size={16} style={{ color: S.warning }} />
                <div>
                  <p className="text-lg font-bold font-mono" style={{ color: S.warning }}>{consequenceChains.length}</p>
                  <p className="text-[8px]" style={{ color: S.text3 }}>后果链</p>
                </div>
              </div>
              <div className="p-3 rounded-xl flex items-center gap-2.5" style={{ background: S.s2, border: `1px solid ${S.border}` }}>
                <Trophy size={16} style={{ color: S.error }} />
                <div>
                  <p className="text-lg font-bold font-mono" style={{ color: S.error }}>{qteConfigs.length}</p>
                  <p className="text-[8px]" style={{ color: S.text3 }}>QTE 配置</p>
                </div>
              </div>
            </div>

            {/* Branch summary */}
            {branchPaths.length > 0 && (
              <div className="space-y-1">
                <p className="text-[9px] font-bold uppercase tracking-wider mb-1" style={{ color: S.text3 }}>
                  路径概览
                </p>
                {branchPaths.map(path => (
                  <div key={path.id} className="flex items-center justify-between px-3 py-1.5 rounded-lg"
                    style={{ background: S.s2, border: `1px solid ${S.border}` }}>
                    <div className="flex items-center gap-1.5">
                      <Trophy size={9} style={{ color: path.type === "good" ? S.success : S.error }} />
                      <span className="text-[9px] font-bold" style={{ color: S.text }}>{path.label}</span>
                    </div>
                    <span className="text-[8px] font-mono" style={{ color: S.text3 }}>{path.nodes.length} 节点</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* ── 创作流程指引 ──────────────────────────────────────────────── */}
        <motion.div variants={fadeInUp}
          className="rounded-2xl p-5"
          style={{ background: `linear-gradient(135deg,${S.primary}06,${S.accent}06)`, border: `1px solid ${S.primary}15` }}>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={14} style={{ color: S.primary }} />
            <h3 className="text-xs font-bold" style={{ color: S.text }}>创作流程指引</h3>
            <span className="text-[9px]" style={{ color: S.text3 }}>按顺序完成以下步骤</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Step 1 */}
            <div className="rounded-2xl p-4" style={{ background: S.card, border: `1px solid ${S.border}`, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-xl flex items-center justify-center"
                  style={{ background: S.primary10 }}>
                  <span className="text-xs font-black" style={{ color: S.primary }}>1</span>
                </div>
                <Scissors size={14} style={{ color: S.primary }} />
                <h4 className="text-xs font-bold" style={{ color: S.text }}>剧本解构</h4>
              </div>
              <p className="text-[9px] mb-3 leading-relaxed" style={{ color: S.text3 }}>
                导入素材，AI 自动提取角色、场景、道具，建立世界规则与章纲规划。
              </p>
              <Link href="/parse">
                <motion.div whileTap={{ scale: 0.97 }}
                  className="flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer"
                  style={{ background: S.primary10, border: `1px solid ${S.primary}20` }}>
                  <span className="text-[10px] font-bold" style={{ color: S.primary }}>前往</span>
                  <ArrowRight size={12} style={{ color: S.primary }} />
                </motion.div>
              </Link>
            </div>

            {/* Step 2 */}
            <div className="rounded-2xl p-4" style={{ background: S.card, border: `1px solid ${S.border}`, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-xl flex items-center justify-center"
                  style={{ background: S.accent10 }}>
                  <span className="text-xs font-black" style={{ color: S.accent }}>2</span>
                </div>
                <FileText size={14} style={{ color: S.accent }} />
                <h4 className="text-xs font-bold" style={{ color: S.text }}>剧本编辑</h4>
              </div>
              <p className="text-[9px] mb-3 leading-relaxed" style={{ color: S.text3 }}>
                编写完整线性剧本，包含对白、场景描述、旁白与动作指引，完善章节细节。
              </p>
              <Link href="/script">
                <motion.div whileTap={{ scale: 0.97 }}
                  className="flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer"
                  style={{ background: S.accent10, border: `1px solid ${S.accent}20` }}>
                  <span className="text-[10px] font-bold" style={{ color: S.accent }}>前往</span>
                  <ArrowRight size={12} style={{ color: S.accent }} />
                </motion.div>
              </Link>
            </div>

            {/* Step 3 */}
            <div className="rounded-2xl p-4" style={{ background: S.card, border: `1px solid ${S.border}`, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-xl flex items-center justify-center"
                  style={{ background: S.warning10 }}>
                  <span className="text-xs font-black" style={{ color: S.warning }}>3</span>
                </div>
                <MousePointer size={14} style={{ color: S.warning }} />
                <h4 className="text-xs font-bold" style={{ color: S.text }}>互动设计</h4>
              </div>
              <p className="text-[9px] mb-3 leading-relaxed" style={{ color: S.text3 }}>
                设计分支路径、玩家选择、变量系统与 QTE 互动机制，构建多结局叙事。
              </p>
              <Link href="/interaction">
                <motion.div whileTap={{ scale: 0.97 }}
                  className="flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer"
                  style={{ background: S.warning10, border: `1px solid ${S.warning}20` }}>
                  <span className="text-[10px] font-bold" style={{ color: S.warning }}>前往</span>
                  <ArrowRight size={12} style={{ color: S.warning }} />
                </motion.div>
              </Link>
            </div>
          </div>
        </motion.div>

        <div className="h-6" />
      </motion.div>
    </div>
  );
}
