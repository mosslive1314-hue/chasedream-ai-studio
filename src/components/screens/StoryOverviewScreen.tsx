"use client";
import { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen, Scissors, GitBranch, Layers, Zap,
  Trophy, Target, Users, MapPin, Package,
  Shield, BarChart3, MessageCircle, Timer, Activity,
  Eye, Clock, Flame, Upload, FileText, Clipboard,
} from "lucide-react";
import { useNarrativeStore, getCurrentProject, useUIStore, useWardrobeStore } from "@/store";
import { calculateTensionCurve, getTensionStats, TENSION_COLORS } from "@/lib/tension-curve";
import { UpstreamReadiness } from "@/components/ui/UpstreamReadiness";
import { WardrobeEditor } from "@/components/ui/WardrobeEditor";

// ── Design tokens ───────────────────────────────────────────────────────
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

// ── Tab definitions ─────────────────────────────────────────────────────
type TabId = "progress" | "narrative" | "interaction" | "world" | "stats";
const TABS: { id: TabId; label: string; icon: typeof BookOpen }[] = [
  { id: "progress",    label: "创作进度", icon: Layers },
  { id: "narrative",   label: "叙事结构", icon: BookOpen },
  { id: "interaction", label: "互动设计", icon: GitBranch },
  { id: "world",       label: "角色与世界", icon: Users },
  { id: "stats",       label: "项目统计", icon: BarChart3 },
];

// ── Animation variants ──────────────────────────────────────────────────
const fadeInUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35 },
};
const stagger = { animate: { transition: { staggerChildren: 0.08 } } };

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
  const pathname = usePathname();
  const projectName = getCurrentProject()?.title || "当前项目";
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const displayName = mounted ? projectName : "当前项目";
  const [activeTab, setActiveTab] = useState<TabId>("progress");
  const addToast = useUIStore(s => s.addToast);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importOpen, setImportOpen] = useState(false);

  // ── Store selectors ───────────────────────────────────────────────────
  const storyNodes = useNarrativeStore(s => s.storyNodes);
  const nodeEdges = useNarrativeStore(s => s.nodeEdges);
  const chapterPlans = useNarrativeStore(s => s.chapterPlans);
  const scriptBlocks = useNarrativeStore(s => s.scriptBlocks);
  const interactionPoints = useNarrativeStore(s => s.interactionPoints);
  const branchPaths = useNarrativeStore(s => s.branchPaths);
  const variables = useNarrativeStore(s => s.variables);
  const consequenceChains = useNarrativeStore(s => s.consequenceChains);
  const qteConfigs = useNarrativeStore(s => s.qteConfigs);
  const worldRules = useNarrativeStore(s => s.worldRules);
  const worldBuilding = useNarrativeStore(s => s.worldBuilding);
  const characters = useNarrativeStore(s => s.characters);
  const scenes = useNarrativeStore(s => s.scenes);
  const props = useNarrativeStore(s => s.props);
  const narrativeIntents = useNarrativeStore(s => s.narrativeIntents);
  const dialogueTrees = useNarrativeStore(s => s.dialogueTrees);
  const timedDecisions = useNarrativeStore(s => s.timedDecisions);
  const qualityChecks = useNarrativeStore(s => s.qualityChecks);
  const assetCards = useNarrativeStore(s => s.assetCards);
  const relationshipMeters = useNarrativeStore(s => s.relationshipMeters);
  const moralAxes = useNarrativeStore(s => s.moralAxes);

  // ── Wardrobe store ───────────────────────────────────────────────────
  const wardrobes = useWardrobeStore(s => s.wardrobes);
  const addOutfit = useWardrobeStore(s => s.addOutfit);
  const updateOutfit = useWardrobeStore(s => s.updateOutfit);
  const removeOutfit = useWardrobeStore(s => s.removeOutfit);
  const setDefaultOutfit = useWardrobeStore(s => s.setDefaultOutfit);
  const bindOutfitToNodes = useWardrobeStore(s => s.bindOutfitToNodes);
  const unbindOutfitFromNodes = useWardrobeStore(s => s.unbindOutfitFromNodes);

  // ── Wardrobe selected character ──────────────────────────────────────
  const [wardrobeCharId, setWardrobeCharId] = useState<string | null>(null);

  // ── Derived data ──────────────────────────────────────────────────────
  const eventsPerChapter = useMemo(() =>
    chapterPlans.map(cp => ({ title: cp.title, count: cp.events.length })), [chapterPlans]);
  const maxEvents = useMemo(() =>
    Math.max(1, ...eventsPerChapter.map(e => e.count)), [eventsPerChapter]);

  const tensionCurve = useMemo(() => calculateTensionCurve({
    storyNodes, narrativeIntents, consequenceChains, variables,
  }), [storyNodes, narrativeIntents, consequenceChains, variables]);
  const tensionStats = useMemo(() => getTensionStats(tensionCurve), [tensionCurve]);

  const qcPassed = qualityChecks.filter(q => q.status === "ok").length;
  const qcTotal = qualityChecks.length;

  return (
    <div className="h-svh flex flex-col overflow-hidden" style={{ background: S.bg }}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="shrink-0 px-5 py-3 flex items-center justify-between"
        style={{ background: "rgba(250,251,255,0.92)", backdropFilter: "blur(12px)", borderBottom: `1px solid ${S.border}` }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: `linear-gradient(135deg,${S.primary},#A78BFA)` }}>
            <BookOpen size={15} style={{ color: "#fff" }} />
          </div>
          <div>
            <h2 className="text-sm font-bold" style={{ color: S.text }}>
              剧本总览
              <span className="ml-1.5 text-[10px] font-medium" style={{ color: S.text3 }}>{displayName}</span>
            </h2>
            <p className="text-[9px]" style={{ color: S.text3 }}>创作进度 · 叙事结构 · 互动设计 · 角色世界 · 项目统计</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <motion.button whileTap={{ scale: 0.95 }}
              onClick={() => setImportOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold focus:outline-none"
              style={{ background: S.primary10, color: S.primary, border: `1px solid ${S.primary20}` }}>
              <Upload size={11} /> 导入素材
            </motion.button>
          <Link href="/parse">
            <motion.button whileTap={{ scale: 0.95 }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white focus:outline-none"
              style={{ background: S.primary, boxShadow: `0 2px 8px ${S.primary}30` }}>
              <Scissors size={11} /> 进入解构
            </motion.button>
          </Link>
        </div>
      </div>

      {/* ── Pipeline Nav ──────────────────────────────────────────────── */}
      <UpstreamReadiness currentPath={pathname} />

      {/* ── Tab Bar ────────────────────────────────────────────────────── */}
      <div className="shrink-0 flex items-center gap-1 px-5 pt-2 pb-0" style={{ borderBottom: `1px solid ${S.border}`, background: S.card }}>
        {TABS.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <motion.button key={tab.id} whileTap={{ scale: 0.97 }}
              onClick={() => setActiveTab(tab.id)}
              className="relative flex items-center gap-1.5 px-3 py-2 text-[10px] font-bold focus:outline-none"
              style={{ color: isActive ? S.primary : S.text3 }}>
              <tab.icon size={12} />
              {tab.label}
              {isActive && (
                <motion.div layoutId="story-tab-line"
                  className="absolute bottom-0 inset-x-0 h-0.5 rounded-full"
                  style={{ background: S.primary }} />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* ── Tab Content ────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div key={activeTab}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="max-w-5xl mx-auto px-4 sm:px-6 py-5">

            {/* ── Tab 1: 创作进度 ──────────────────────────────────────── */}
            {activeTab === "progress" && (
              <div className="space-y-5">

                {/* Quick metrics */}
                <div className="grid grid-cols-4 gap-3">
                  <StatPill label="已规划章节" value={chapterPlans.length} color={S.primary} />
                  <StatPill label="剧本块" value={scriptBlocks.length} color={S.accent} />
                  <StatPill label="世界规则" value={worldRules.length} color={S.warning} />
                  <StatPill label="世界观条目" value={worldBuilding.length} color={S.primary} />
                </div>
              </div>
            )}

            {/* ── Tab 2: 叙事结构 ──────────────────────────────────────── */}
            {activeTab === "narrative" && (
              <div className="space-y-5">
                {/* AI Analysis action */}
                <div className="rounded-2xl px-4 py-3 flex items-center justify-between"
                  style={{ background: `linear-gradient(135deg, ${S.primary}08, ${S.accent}06)`, border: `1px solid ${S.primary}15` }}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: S.primary10 }}>
                      <Zap size={14} style={{ color: S.primary }} />
                    </div>
                    <div>
                      <p className="text-xs font-bold" style={{ color: S.text }}>AI 智能分析</p>
                      <p className="text-[9px]" style={{ color: S.text3 }}>使用 AI 自动分析剧本结构、情绪弧线与叙事节奏</p>
                    </div>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => addToast({ type: "success", title: "AI 分析已启动", message: "正在分析剧本结构，预计需要 1-2 分钟" })}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold text-white shrink-0 focus:outline-none"
                    style={{ background: S.primary, boxShadow: `0 2px 8px ${S.primary}30` }}
                  >
                    <Activity size={11} /> AI 分析剧本
                  </motion.button>
                </div>

                {/* Tension curve */}
                {tensionCurve.length > 0 && (
                  <div className="rounded-2xl p-5" style={{ background: S.card, border: `1px solid ${S.border}` }}>
                    <h3 className="text-xs font-bold mb-3 flex items-center gap-2" style={{ color: S.text }}>
                      <Flame size={13} style={{ color: S.error }} /> 故事弧光 · 情绪张力曲线
                    </h3>
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-[8px] font-mono" style={{ color: S.text3 }}>峰 <b style={{ color: S.error }}>{tensionStats.max}</b></span>
                      <span className="text-[8px] font-mono" style={{ color: S.text3 }}>均 <b style={{ color: S.text2 }}>{tensionStats.avg}</b></span>
                      <span className="text-[8px] font-mono" style={{ color: S.text3 }}>谷 <b style={{ color: S.success }}>{tensionStats.min}</b></span>
                      <div className="flex items-center gap-2 ml-auto">
                        {[
                          { label: "平缓", color: TENSION_COLORS.calm },
                          { label: "渐进", color: TENSION_COLORS.building },
                          { label: "紧张", color: TENSION_COLORS.tense },
                          { label: "高潮", color: TENSION_COLORS.climax },
                          { label: "收束", color: TENSION_COLORS.resolution },
                        ].map(item => (
                          <div key={item.label} className="flex items-center gap-0.5">
                            <div className="w-1.5 h-1.5 rounded-full" style={{ background: item.color }} />
                            <span className="text-[7px]" style={{ color: S.text3 }}>{item.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-end gap-1" style={{ height: 64 }}>
                      {tensionCurve.map((tp) => (
                        <div key={tp.nodeId} className="flex-1 flex flex-col items-center gap-0.5 group relative">
                          <motion.div initial={{ height: 0 }} animate={{ height: Math.max(4, tp.tension * 5.5) }}
                            transition={{ duration: 0.3 }} className="w-full rounded-t-sm"
                            style={{ background: TENSION_COLORS[tp.category], opacity: 0.85 }} />
                          <span className="text-[6px] font-mono" style={{ color: S.text3 }}>{tp.nodeId.replace("N", "")}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Chapter events distribution */}
                {eventsPerChapter.length > 0 && (
                  <div className="rounded-2xl p-5" style={{ background: S.card, border: `1px solid ${S.border}` }}>
                    <h3 className="text-xs font-bold mb-3 flex items-center gap-2" style={{ color: S.text }}>
                      <BookOpen size={13} style={{ color: S.accent }} /> 章节事件分布
                    </h3>
                    <div className="flex items-end gap-2" style={{ height: 80 }}>
                      {eventsPerChapter.map((ch, i) => {
                        const h = Math.max(8, (ch.count / maxEvents) * 72);
                        return (
                          <div key={i} className="flex-1 flex flex-col items-center gap-1">
                            <motion.div initial={{ height: 0 }} animate={{ height: h }}
                              transition={{ duration: 0.4, delay: i * 0.06 }}
                              className="w-full rounded-t-md"
                              style={{ background: `linear-gradient(to top, ${S.primary}, ${S.accent})`, opacity: 0.85, minHeight: 8 }} />
                            <span className="text-[8px] font-bold" style={{ color: S.text2 }}>{ch.count}</span>
                            <span className="text-[7px] font-mono truncate w-full text-center" style={{ color: S.text3 }}>
                              {ch.title.length > 6 ? ch.title.slice(0, 6) + ".." : ch.title}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Branch paths */}
                {branchPaths.length > 0 && (
                  <div className="rounded-2xl p-5" style={{ background: S.card, border: `1px solid ${S.border}` }}>
                    <h3 className="text-xs font-bold mb-3 flex items-center gap-2" style={{ color: S.text }}>
                      <GitBranch size={13} style={{ color: S.primary }} /> 分支路径总览
                    </h3>
                    <div className="space-y-1.5">
                      {branchPaths.map(path => (
                        <div key={path.id} className="flex items-center justify-between px-3 py-2 rounded-xl"
                          style={{ background: S.s2, border: `1px solid ${S.border}` }}>
                          <div className="flex items-center gap-2">
                            <Trophy size={10} style={{ color: path.type === "good" ? S.success : S.error }} />
                            <span className="text-[10px] font-bold" style={{ color: S.text }}>{path.label}</span>
                            <span className="text-[8px] px-1.5 py-0.5 rounded" style={{
                              background: path.type === "good" ? S.success10 : S.error10,
                              color: path.type === "good" ? S.success : S.error,
                            }}>{path.type === "good" ? "好结局" : "坏结局"}</span>
                          </div>
                          <span className="text-[9px] font-mono" style={{ color: S.text3 }}>{path.nodes.length} 节点</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* World rules */}
                {worldRules.length > 0 && (
                  <div className="rounded-2xl p-5" style={{ background: S.card, border: `1px solid ${S.border}` }}>
                    <h3 className="text-xs font-bold mb-3 flex items-center gap-2" style={{ color: S.text }}>
                      <Shield size={13} style={{ color: S.warning }} /> 世界规则
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: S.warning10, color: S.warning }}>{worldRules.length}</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {worldRules.map((rule, i) => (
                        <div key={i} className="p-3 rounded-xl" style={{ background: S.s2, border: `1px solid ${S.border}` }}>
                          <div className="flex items-center gap-1.5 mb-1">
                            <div className="w-2 h-2 rounded-full" style={{
                              background: rule.type === "setting" ? S.primary : rule.type === "character_constraint" ? S.accent : rule.type === "narrative_taboo" ? S.error : S.warning,
                            }} />
                            <span className="text-[9px] font-bold" style={{ color: S.text }}>{rule.title}</span>
                            <span className="text-[7px] px-1 py-0.5 rounded ml-auto" style={{
                              background: rule.severity === "hard" ? S.error10 : rule.severity === "soft" ? S.warning10 : S.accent10,
                              color: rule.severity === "hard" ? S.error : rule.severity === "soft" ? S.warning : S.accent,
                            }}>{rule.severity === "hard" ? "强制" : rule.severity === "soft" ? "建议" : "提示"}</span>
                          </div>
                          <p className="text-[8px] leading-relaxed" style={{ color: S.text3 }}>{rule.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* World building */}
                {worldBuilding.length > 0 && (
                  <div className="rounded-2xl p-5" style={{ background: S.card, border: `1px solid ${S.border}` }}>
                    <h3 className="text-xs font-bold mb-3 flex items-center gap-2" style={{ color: S.text }}>
                      <Activity size={13} style={{ color: S.accent }} /> 世界观设定
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: S.accent10, color: S.accent }}>{worldBuilding.length}</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {worldBuilding.map((wb, i) => (
                        <div key={i} className="p-3 rounded-xl" style={{ background: S.s2, border: `1px solid ${S.border}` }}>
                          <span className="text-[8px] font-bold uppercase tracking-wider" style={{ color: S.primary }}>{wb.category}</span>
                          <p className="text-[9px] mt-1 leading-relaxed" style={{ color: S.text2 }}>{wb.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Tab 3: 互动设计概览 ──────────────────────────────────── */}
            {activeTab === "interaction" && (
              <div className="space-y-5">
                {/* Stats grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { icon: GitBranch, label: "分支路径", value: branchPaths.length, color: S.primary },
                    { icon: Zap, label: "变量", value: variables.length, color: S.accent },
                    { icon: Target, label: "后果链", value: consequenceChains.length, color: S.warning },
                    { icon: Trophy, label: "QTE 配置", value: qteConfigs.length, color: S.error },
                    { icon: MessageCircle, label: "对话树", value: dialogueTrees.length, color: S.primary },
                    { icon: Timer, label: "限时选择", value: timedDecisions.length, color: S.accent },
                    { icon: Layers, label: "互动点", value: interactionPoints.length, color: S.warning },
                    { icon: Eye, label: "关系计量", value: relationshipMeters.length, color: S.error },
                  ].map((item, i) => (
                    <div key={i} className="p-3 rounded-xl flex items-center gap-2.5" style={{ background: S.card, border: `1px solid ${S.border}` }}>
                      <item.icon size={16} style={{ color: item.color }} />
                      <div>
                        <p className="text-lg font-bold font-mono" style={{ color: item.color }}>{item.value}</p>
                        <p className="text-[8px]" style={{ color: S.text3 }}>{item.label}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Variable usage */}
                {variables.length > 0 && (
                  <div className="rounded-2xl p-5" style={{ background: S.card, border: `1px solid ${S.border}` }}>
                    <h3 className="text-xs font-bold mb-3 flex items-center gap-2" style={{ color: S.text }}>
                      <Zap size={13} style={{ color: S.accent }} /> 变量使用率
                    </h3>
                    {(() => {
                      const used = variables.filter(v => v.modifiedBy.length > 0 || v.readBy.length > 0).length;
                      const pct = variables.length > 0 ? Math.round((used / variables.length) * 100) : 0;
                      return (
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-2xl font-bold font-mono" style={{ color: pct >= 70 ? S.success : S.warning }}>{pct}%</span>
                            <span className="text-[9px]" style={{ color: S.text3 }}>{used}/{variables.length} 变量已使用</span>
                          </div>
                          <div className="h-2 rounded-full overflow-hidden" style={{ background: S.s3 }}>
                            <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6 }}
                              className="h-full rounded-full" style={{ background: pct >= 70 ? S.success : S.warning }} />
                          </div>
                          <div className="mt-3 flex flex-wrap gap-1">
                            {variables.slice(0, 12).map(v => {
                              const isUsed = v.modifiedBy.length > 0 || v.readBy.length > 0;
                              return (
                                <span key={v.id} className="text-[8px] px-1.5 py-0.5 rounded font-mono" style={{
                                  background: isUsed ? S.success10 : S.error10,
                                  color: isUsed ? S.success : S.error,
                                }}>{v.name}</span>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Consequence coverage */}
                <div className="rounded-2xl p-5" style={{ background: S.card, border: `1px solid ${S.border}` }}>
                  <h3 className="text-xs font-bold mb-3 flex items-center gap-2" style={{ color: S.text }}>
                    <Target size={13} style={{ color: S.warning }} /> 后果链覆盖
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    <StatPill label="总后果链" value={consequenceChains.length} color={S.primary} />
                    <StatPill label="延迟型" value={consequenceChains.filter(c => c.timing === "delayed").length} color={S.warning} />
                    <StatPill label="结局型" value={consequenceChains.filter(c => c.timing === "ending").length} color={S.error} />
                  </div>
                </div>
              </div>
            )}

            {/* ── Tab 4: 角色与世界 ────────────────────────────────────── */}
            {activeTab === "world" && (
              <div className="space-y-5">

                {/* AI Extraction actions */}
                <div className="rounded-2xl px-4 py-3 flex items-center justify-between flex-wrap gap-3"
                  style={{ background: `linear-gradient(135deg, ${S.accent}08, ${S.primary}06)`, border: `1px solid ${S.accent}15` }}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: S.accent10 }}>
                      <Zap size={14} style={{ color: S.accent }} />
                    </div>
                    <div>
                      <p className="text-xs font-bold" style={{ color: S.text }}>AI 智能提取</p>
                      <p className="text-[9px]" style={{ color: S.text3 }}>从已导入的素材中自动提取角色、场景与道具信息</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => addToast({ type: "success", title: "AI 提取角色已启动", message: "正在从素材中识别并提取角色信息" })}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold text-white focus:outline-none"
                      style={{ background: S.primary, boxShadow: `0 2px 8px ${S.primary}30` }}
                    >
                      <Users size={11} /> AI 提取角色
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => addToast({ type: "success", title: "AI 提取场景已启动", message: "正在从素材中识别并提取场景信息" })}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold text-white focus:outline-none"
                      style={{ background: S.accent, boxShadow: `0 2px 8px ${S.accent}30` }}
                    >
                      <MapPin size={11} /> AI 提取场景
                    </motion.button>
                  </div>
                </div>

                {/* Characters */}
                {characters.length > 0 && (
                  <div className="rounded-2xl p-5" style={{ background: S.card, border: `1px solid ${S.border}` }}>
                    <h3 className="text-xs font-bold mb-3 flex items-center gap-2" style={{ color: S.text }}>
                      <Users size={13} style={{ color: S.primary }} /> 角色一览
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: S.primary10, color: S.primary }}>{characters.length}</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {characters.map(char => {
                        const hasWardrobe = wardrobes.some(w => w.characterId === char.id);
                        const isWardrobeOpen = wardrobeCharId === char.id;
                        return (
                          <div key={char.id}>
                            <div className="p-3 rounded-xl" style={{ background: S.s2, border: `1px solid ${isWardrobeOpen ? S.primary : S.border}` }}>
                              <div className="flex items-center gap-2 mb-1.5">
                                <div className="w-6 h-6 rounded-lg flex items-center justify-center text-xs"
                                  style={{ background: `${char.color}15`, color: char.color }}>
                                  {char.name.charAt(0)}
                                </div>
                                <span className="text-[10px] font-bold" style={{ color: S.text }}>{char.name}</span>
                                <span className="text-[7px] px-1.5 py-0.5 rounded ml-auto" style={{
                                  background: char.role === "protagonist" ? S.primary10 : char.role === "antagonist" ? S.error10 : S.accent10,
                                  color: char.role === "protagonist" ? S.primary : char.role === "antagonist" ? S.error : S.accent,
                                }}>{char.role === "protagonist" ? "主角" : char.role === "antagonist" ? "反派" : "配角"}</span>
                              </div>
                              <p className="text-[8px] leading-relaxed mb-1.5" style={{ color: S.text3 }}>{char.description}</p>
                              <div className="flex items-center gap-2">
                                <span className="text-[7px]" style={{ color: S.text3 }}>出场: {char.appearNodes.length} 节点</span>
                                {hasWardrobe && (
                                  <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setWardrobeCharId(isWardrobeOpen ? null : char.id)}
                                    className="text-[8px] font-bold px-2 py-0.5 rounded-lg focus:outline-none ml-auto"
                                    style={{
                                      background: isWardrobeOpen ? S.primary10 : S.accent10,
                                      color: isWardrobeOpen ? S.primary : S.accent,
                                    }}
                                  >
                                    {isWardrobeOpen ? "收起造型" : "造型管理"}
                                  </motion.button>
                                )}
                              </div>
                            </div>

                            {/* Wardrobe Editor (inline expand) */}
                            <AnimatePresence>
                              {isWardrobeOpen && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.3 }}
                                  className="overflow-hidden"
                                >
                                  <div className="mt-2">
                                    <WardrobeEditor
                                      character={char}
                                      wardrobe={wardrobes.find(w => w.characterId === char.id)}
                                      onAddOutfit={addOutfit}
                                      onUpdateOutfit={updateOutfit}
                                      onRemoveOutfit={removeOutfit}
                                      onSetDefault={setDefaultOutfit}
                                      onBindNodes={bindOutfitToNodes}
                                      onUnbindNodes={unbindOutfitFromNodes}
                                    />
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Relationship meters */}
                {relationshipMeters.length > 0 && (
                  <div className="rounded-2xl p-5" style={{ background: S.card, border: `1px solid ${S.border}` }}>
                    <h3 className="text-xs font-bold mb-3 flex items-center gap-2" style={{ color: S.text }}>
                      <Eye size={13} style={{ color: S.accent }} /> 关系计量
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: S.accent10, color: S.accent }}>{relationshipMeters.length}</span>
                    </h3>
                    <div className="space-y-2">
                      {relationshipMeters.map((meter, i) => {
                        const pct = ((meter.currentValue - meter.minValue) / (meter.maxValue - meter.minValue)) * 100;
                        return (
                          <div key={i} className="p-3 rounded-xl" style={{ background: S.s2, border: `1px solid ${S.border}` }}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[9px] font-bold" style={{ color: S.text }}>{meter.characterAName} ↔ {meter.characterBName}</span>
                              <span className="text-[8px] font-mono font-bold" style={{ color: S.primary }}>{meter.currentValue}</span>
                            </div>
                            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: S.s3 }}>
                              <div className="h-full rounded-full" style={{
                                width: `${Math.max(0, Math.min(100, pct))}%`,
                                background: `linear-gradient(90deg, ${S.error}, ${S.warning}, ${S.success})`,
                              }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Moral axes */}
                {moralAxes.length > 0 && (
                  <div className="rounded-2xl p-5" style={{ background: S.card, border: `1px solid ${S.border}` }}>
                    <h3 className="text-xs font-bold mb-3 flex items-center gap-2" style={{ color: S.text }}>
                      <Activity size={13} style={{ color: S.warning }} /> 道德轴追踪
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: S.warning10, color: S.warning }}>{moralAxes.length}</span>
                    </h3>
                    <div className="space-y-2">
                      {moralAxes.map((axis, i) => {
                        const pos = ((axis.currentValue + 100) / 200) * 100;
                        return (
                          <div key={i} className="p-3 rounded-xl" style={{ background: S.s2, border: `1px solid ${S.border}` }}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[9px] font-bold" style={{ color: S.text }}>{axis.name}</span>
                              <span className="text-[8px] font-mono font-bold" style={{ color: Math.abs(axis.currentValue) > 70 ? S.error : S.text2 }}>{axis.currentValue}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[7px]" style={{ color: S.text3 }}>{axis.negativeLabel}</span>
                              <div className="flex-1 h-1.5 rounded-full relative" style={{ background: axis.gradientColors ? `linear-gradient(90deg, ${axis.gradientColors.join(", ")})` : S.s3 }}>
                                <div className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rotate-45 border"
                                  style={{ left: `${pos}%`, background: S.card, borderColor: S.text }} />
                              </div>
                              <span className="text-[7px]" style={{ color: S.text3 }}>{axis.positiveLabel}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Scenes */}
                {scenes.length > 0 && (
                  <div className="rounded-2xl p-5" style={{ background: S.card, border: `1px solid ${S.border}` }}>
                    <h3 className="text-xs font-bold mb-3 flex items-center gap-2" style={{ color: S.text }}>
                      <MapPin size={13} style={{ color: S.accent }} /> 场景列表
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: S.accent10, color: S.accent }}>{scenes.length}</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {scenes.map((sc, i) => (
                        <div key={i} className="p-3 rounded-xl" style={{ background: S.s2, border: `1px solid ${S.border}` }}>
                          <span className="text-[9px] font-bold" style={{ color: S.text }}>{sc.name}</span>
                          <p className="text-[8px] mt-0.5" style={{ color: S.text3 }}>{sc.location}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Props */}
                {props.length > 0 && (
                  <div className="rounded-2xl p-5" style={{ background: S.card, border: `1px solid ${S.border}` }}>
                    <h3 className="text-xs font-bold mb-3 flex items-center gap-2" style={{ color: S.text }}>
                      <Package size={13} style={{ color: S.warning }} /> 道具列表
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: S.warning10, color: S.warning }}>{props.length}</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      {props.map((p, i) => (
                        <div key={i} className="p-3 rounded-xl" style={{ background: S.s2, border: `1px solid ${S.border}` }}>
                          <span className="text-[9px] font-bold" style={{ color: S.text }}>{p.name}</span>
                          <p className="text-[8px] mt-0.5" style={{ color: S.text3 }}>{p.type}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Tab 5: 项目统计 ──────────────────────────────────────── */}
            {activeTab === "stats" && (
              <div className="space-y-5">
                {/* Core data */}
                <div className="rounded-2xl p-5" style={{ background: S.card, border: `1px solid ${S.border}` }}>
                  <h3 className="text-xs font-bold mb-4 flex items-center gap-2" style={{ color: S.text }}>
                    <BarChart3 size={13} style={{ color: S.primary }} /> 核心数据
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <StatPill label="章节" value={chapterPlans.length} color={S.primary} />
                    <StatPill label="节点" value={storyNodes.length} color={S.accent} />
                    <StatPill label="连线" value={nodeEdges.length} color={S.warning} />
                    <StatPill label="结局" value={storyNodes.filter(n => n.type === "ending_good" || n.type === "ending_bad").length} color={S.error} />
                    <StatPill label="角色" value={characters.length} color={S.primary} />
                    <StatPill label="场景" value={scenes.length} color={S.accent} />
                    <StatPill label="道具" value={props.length} color={S.warning} />
                    <StatPill label="预估时长" value={`${Math.round(storyNodes.length * 1.5)}min`} color={S.error} />
                  </div>
                </div>

                {/* Asset coverage */}
                <div className="rounded-2xl p-5" style={{ background: S.card, border: `1px solid ${S.border}` }}>
                  <h3 className="text-xs font-bold mb-4 flex items-center gap-2" style={{ color: S.text }}>
                    <Layers size={13} style={{ color: S.accent }} /> 资产覆盖率
                  </h3>
                  {(() => {
                    const total = storyNodes.length;
                    if (total === 0) return <p className="text-[9px]" style={{ color: S.text3 }}>暂无节点数据</p>;
                    const withImages = assetCards.filter(a => a.hasImage).length;
                    const withBgm = assetCards.filter(a => a.hasBgm).length;
                    const withVoice = assetCards.filter(a => a.hasVoice).length;
                    const items = [
                      { label: "图片素材", count: withImages, total, color: S.primary },
                      { label: "BGM", count: withBgm, total, color: S.accent },
                      { label: "配音", count: withVoice, total, color: S.warning },
                    ];
                    return (
                      <div className="space-y-3">
                        {items.map((item, i) => {
                          const pct = item.total > 0 ? Math.round((item.count / item.total) * 100) : 0;
                          return (
                            <div key={i}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[9px] font-bold" style={{ color: S.text2 }}>{item.label}</span>
                                <span className="text-[9px] font-mono font-bold" style={{ color: item.color }}>{pct}%</span>
                              </div>
                              <div className="h-2 rounded-full overflow-hidden" style={{ background: S.s3 }}>
                                <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.5 }}
                                  className="h-full rounded-full" style={{ background: item.color }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>

                {/* QC summary */}
                {qcTotal > 0 && (
                  <div className="rounded-2xl p-5" style={{ background: S.card, border: `1px solid ${S.border}` }}>
                    <h3 className="text-xs font-bold mb-4 flex items-center gap-2" style={{ color: S.text }}>
                      <Shield size={13} style={{ color: S.success }} /> 质量检查通过率
                    </h3>
                    <div className="flex items-center gap-4 mb-3">
                      <span className="text-3xl font-bold font-mono" style={{ color: qcPassed === qcTotal ? S.success : S.warning }}>
                        {Math.round((qcPassed / qcTotal) * 100)}%
                      </span>
                      <span className="text-[9px]" style={{ color: S.text3 }}>通过 {qcPassed}/{qcTotal} 项</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: S.s3 }}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${(qcPassed / qcTotal) * 100}%` }} transition={{ duration: 0.6 }}
                        className="h-full rounded-full" style={{ background: qcPassed === qcTotal ? S.success : S.warning }} />
                    </div>
                  </div>
                )}

                {/* Narrative scoring summary */}
                {tensionCurve.length > 0 && (
                  <div className="rounded-2xl p-5" style={{ background: S.card, border: `1px solid ${S.border}` }}>
                    <h3 className="text-xs font-bold mb-3 flex items-center gap-2" style={{ color: S.text }}>
                      <Clock size={13} style={{ color: S.primary }} /> 叙事节奏评估
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                      <StatPill label="峰值张力" value={tensionStats.max} color={S.error} />
                      <StatPill label="均值张力" value={tensionStats.avg} color={S.primary} />
                      <StatPill label="节奏方差" value={(() => {
                        const vals = tensionCurve.map(t => t.tension);
                        const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
                        const variance = vals.reduce((s, v) => s + (v - avg) ** 2, 0) / vals.length;
                        return Math.round(Math.sqrt(variance) * 10) / 10;
                      })()} color={S.accent} />
                    </div>
                    <div className="mt-3 flex items-center gap-2 flex-wrap">
                      {(["calm", "building", "tense", "climax", "resolution"] as const).map(cat => {
                        const count = tensionCurve.filter(t => t.category === cat).length;
                        const labels: Record<string, string> = { calm: "平缓", building: "渐进", tense: "紧张", climax: "高潮", resolution: "收束" };
                        return (
                          <span key={cat} className="text-[8px] px-2 py-1 rounded-lg font-medium" style={{
                            background: `${TENSION_COLORS[cat]}15`, color: TENSION_COLORS[cat],
                          }}>
                            {labels[cat]}: {count}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Import Materials Modal ────────────────────────────────────── */}
      <AnimatePresence>
        {importOpen && (
          <motion.div
            key="import-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(6px)" }}
            onClick={() => setImportOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.25 }}
              className="relative w-full max-w-lg mx-4 rounded-2xl p-5"
              style={{ background: S.card, border: `1px solid ${S.border}`, boxShadow: "0 24px 48px rgba(0,0,0,0.15)" }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setImportOpen(false)}
                className="absolute top-3 right-3 w-7 h-7 rounded-lg flex items-center justify-center focus:outline-none"
                style={{ background: S.s2, color: S.text3 }}
              >
                ✕
              </motion.button>

              <h3 className="text-xs font-bold mb-3 flex items-center gap-2" style={{ color: S.text }}>
                <Upload size={13} style={{ color: S.primary }} /> 导入素材
              </h3>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.docx,.pdf,.epub"
                multiple
                className="hidden"
                onChange={(e) => {
                  const files = e.target.files;
                  if (files && files.length > 0) {
                    const names = Array.from(files).map(f => f.name).join(", ");
                    addToast({ type: "success", title: "素材导入成功", message: `已导入: ${names}` });
                    e.target.value = "";
                  }
                }}
              />

              {/* Drag-and-drop zone */}
              <div className="relative mb-3">
                <motion.div
                  whileHover={{ borderColor: S.primary }}
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer transition-colors"
                  style={{ background: S.s2, border: `2px dashed ${S.border2}`, minHeight: 100 }}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-2"
                    style={{ background: S.primary10 }}>
                    <Upload size={18} style={{ color: S.primary }} />
                  </div>
                  <p className="text-xs font-bold mb-0.5" style={{ color: S.text }}>
                    拖放文件到此处，或点击选择文件
                  </p>
                  <p className="text-[9px]" style={{ color: S.text3 }}>
                    支持格式：.txt, .docx, .pdf, .epub
                  </p>
                </motion.div>
              </div>

              {/* Quick import buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => addToast({ type: "info", title: "导入小说/IP", message: "请选择要导入的小说或 IP 文件" })}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold focus:outline-none"
                  style={{ background: S.primary10, color: S.primary, border: `1px solid ${S.primary20}` }}
                >
                  <BookOpen size={11} /> 导入小说/IP
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => addToast({ type: "info", title: "导入大纲", message: "请选择要导入的大纲文件" })}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold focus:outline-none"
                  style={{ background: S.accent10, color: S.accent, border: `1px solid ${S.accent}20` }}
                >
                  <FileText size={11} /> 导入大纲
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => addToast({ type: "info", title: "粘贴文本", message: "请在弹出的对话框中粘贴您的文本内容" })}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold focus:outline-none"
                  style={{ background: S.warning10, color: S.warning, border: `1px solid ${S.warning}20` }}
                >
                  <Clipboard size={11} /> 粘贴文本
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
