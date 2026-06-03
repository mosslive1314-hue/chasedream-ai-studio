"use client";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, TestTube, TestTube2, Filter, ChevronDown, ChevronUp,
  AlertTriangle, CheckCircle2, ArrowRight, Target, Layers,
  BarChart3, ShieldAlert, TrendingUp, TrendingDown, Minus,
  Eye, GitBranch, FlaskConical, BookOpen, Sparkles,
  Clock, AlertCircle, CircleCheck, CircleX, Link2,
} from "lucide-react";
import Link from "next/link";
import {
  type InteractionPoint, type InteractionOption,
  type ConsequenceChain, type ConsequenceTiming,
} from "@/lib/studio-data";
import { useNarrativeStore } from "@/store";

// ── Design System ────────────────────────────────────────────────────────
const S = {
  bg: "#FAFBFF", card: "#FFFFFF", s2: "#F4F6FC", s3: "#EDF0F8",
  border: "#E2E5F0", border2: "#CBD0E5",
  primary: "#5E50E8", primary10: "rgba(94,80,232,0.10)",
  accent: "#00A99D", accent10: "rgba(0,169,157,0.10)",
  text: "#1A1D2E", text2: "#4A5068", text3: "#8892B0",
  success: "#059669", warning: "#D97706", error: "#DC2626",
};

// ── Emotion intensity color mapping ──────────────────────────────────────
function emotionColor(v: number): { color: string; bg: string; label: string } {
  if (v <= 3) return { color: S.success, bg: "rgba(5,150,105,0.10)", label: "低紧张" };
  if (v <= 6) return { color: S.primary, bg: S.primary10, label: "中等" };
  if (v <= 9) return { color: S.warning, bg: "rgba(217,119,6,0.10)", label: "高紧张" };
  return { color: S.error, bg: "rgba(220,38,38,0.10)", label: "极限" };
}

// ── Tab types ────────────────────────────────────────────────────────────
type ViewTab = "interactions" | "consequences" | "suggestions";

// ── Timing color helpers ─────────────────────────────────────────────────
function timingColor(t: ConsequenceTiming): { color: string; bg: string; label: string } {
  if (t === "immediate") return { color: "#22C55E", bg: "rgba(34,197,94,0.10)", label: "即时" };
  if (t === "delayed") return { color: "#EAB308", bg: "rgba(234,179,8,0.10)", label: "延迟" };
  return { color: "#EF4444", bg: "rgba(239,68,68,0.10)", label: "结局" };
}

// ── Filter types ─────────────────────────────────────────────────────────
type ChapterFilter = "all" | "ch0" | "ch1" | "ch2";
type TestFilter = "all" | "tested" | "untested";

// ══════════════════════════════════════════════════════════════════════════
export default function InteractionScreen() {
  const [activeTab, setActiveTab] = useState<ViewTab>("interactions");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [chapterFilter, setChapterFilter] = useState<ChapterFilter>("all");
  const [testFilter, setTestFilter] = useState<TestFilter>("all");
  const [hoveredChainId, setHoveredChainId] = useState<string | null>(null);

  // ── Store selectors ───────────────────────────────────────────────────
  const interactionPoints = useNarrativeStore(s => s.interactionPoints);
  const characters = useNarrativeStore(s => s.characters);
  const chapterPlans = useNarrativeStore(s => s.chapterPlans);
  const narrativeStates = useNarrativeStore(s => s.narrativeStates);
  const consequenceChains = useNarrativeStore(s => s.consequenceChains);

  // ── Derived lookup maps ────────────────────────────────────────────────
  const chapterLabels = useMemo(() => {
    const map: Record<string, string> = {};
    chapterPlans.forEach((cp, i) => { map[cp.id] = cp.title ?? `第${i}章`; });
    return map;
  }, [chapterPlans]);

  const charNames = useMemo(() => {
    const map: Record<string, string> = {};
    characters.forEach(c => { map[c.id] = c.name; });
    return map;
  }, [characters]);

  const stateNames = useMemo(() => {
    const map: Record<string, string> = {};
    narrativeStates.forEach(ns => { map[ns.id] = ns.name; });
    return map;
  }, [narrativeStates]);

  // ── Statistics ──────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = interactionPoints.length;
    const totalOptions = interactionPoints.reduce((s, ip) => s + ip.options.length, 0);
    const tested = interactionPoints.filter((ip) => ip.tested).length;
    const untested = total - tested;
    const intensities = interactionPoints.map((ip) => ip.emotionIntensity);
    const maxIntensity = Math.max(...intensities);
    const minIntensity = Math.min(...intensities);
    const avgIntensity = intensities.reduce((a, b) => a + b, 0) / intensities.length;
    const missingFailFeedback = interactionPoints.filter(
      (ip) => !ip.failureFeedback && ip.options.some((o) => o.consequence.toLowerCase().includes("失败") || o.consequence.toLowerCase().includes("暴露") || o.consequence.toLowerCase().includes("警报"))
    );
    const untestedList = interactionPoints.filter((ip) => !ip.tested);
    return { total, totalOptions, tested, untested, maxIntensity, minIntensity, avgIntensity, missingFailFeedback, untestedList };
  }, [interactionPoints]);

  // ── Filtered list ──────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return interactionPoints.filter((ip) => {
      if (chapterFilter !== "all" && ip.chapterId !== chapterFilter) return false;
      if (testFilter === "tested" && !ip.tested) return false;
      if (testFilter === "untested" && ip.tested) return false;
      return true;
    });
  }, [interactionPoints, chapterFilter, testFilter]);

  // ── Consequence stats ───────────────────────────────────────────────────
  const conseqStats = useMemo(() => {
    const total = consequenceChains.length;
    const immediate = consequenceChains.filter((c) => c.timing === "immediate").length;
    const delayed = consequenceChains.filter((c) => c.timing === "delayed").length;
    const ending = consequenceChains.filter((c) => c.timing === "ending").length;
    const resolved = consequenceChains.filter((c) => c.resolved).length;
    const unresolved = consequenceChains.filter((c) => !c.resolved);
    // Group by source node
    const bySource = new Map<string, ConsequenceChain[]>();
    consequenceChains.forEach((c) => {
      const list = bySource.get(c.sourceNodeId) ?? [];
      list.push(c);
      bySource.set(c.sourceNodeId, list);
    });
    return { total, immediate, delayed, ending, resolved, unresolved, bySource };
  }, [consequenceChains]);

  // ── Toggle expand ──────────────────────────────────────────────────────
  const toggle = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // ── Empty state check ─────────────────────────────────────────────────────
  if (interactionPoints.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: S.bg }}>
        <div className="text-center max-w-md p-8">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: '#F4F6FC' }}>
            <Zap size={28} style={{ color: '#7C6CF5' }} />
          </div>
          <h3 className="text-base font-bold mb-2" style={{ color: '#1a1a2e' }}>还没有互动设计</h3>
          <p className="text-sm text-gray-500 mb-4">请先完成剧本编辑，再进入互动设计工作台</p>
          <Link href="/script" className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-bold text-white" style={{ background: '#7C6CF5' }}>
            前往剧本编辑 →
          </Link>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen" style={{ background: S.bg }}>
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">

        {/* ── A. Top Stats Bar ───────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: S.primary10 }}>
              <Zap size={20} style={{ color: S.primary }} />
            </div>
            <div>
              <h1 className="text-xl font-bold" style={{ color: S.text }}>互动设计工作台</h1>
              <p className="text-xs" style={{ color: S.text3 }}>管理互动点卡片、分支选项与设计意图</p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <StatBadge icon={<Layers size={13} />} label="总互动点" value={stats.total} color={S.primary} bg={S.primary10} />
            <StatBadge icon={<GitBranch size={13} />} label="分支选项" value={stats.totalOptions} color={S.accent} bg={S.accent10} />
            <StatBadge icon={<CheckCircle2 size={13} />} label="已测试" value={stats.tested} color={S.success} bg="rgba(5,150,105,0.10)" />
            <StatBadge icon={<AlertTriangle size={13} />} label="未测试" value={stats.untested} color={stats.untested > 0 ? S.warning : S.text3} bg={stats.untested > 0 ? "rgba(217,119,6,0.10)" : S.s3} />
          </div>
        </div>

        {/* ── Tab Switcher ──────────────────────────────────────────────── */}
        <div className="flex items-center gap-1" style={{ borderBottom: `2px solid ${S.border}` }}>
          <TabButton active={activeTab === "interactions"} onClick={() => setActiveTab("interactions")} label="互动点设计" icon={<Zap size={14} />} />
          <TabButton active={activeTab === "consequences"} onClick={() => setActiveTab("consequences")} label="后果追踪" icon={<GitBranch size={14} />} badge={conseqStats.unresolved.length > 0 ? conseqStats.unresolved.length : undefined} />
          <TabButton active={activeTab === "suggestions"} onClick={() => setActiveTab("suggestions")} label="设计建议" icon={<Sparkles size={14} />} />
        </div>

        {/* ════════════ TAB: Interaction Points ════════════ */}
        <AnimatePresence mode="wait">
          {activeTab === "interactions" && (
            <motion.div key="interactions" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }} transition={{ duration: 0.2 }} className="space-y-6">

              {/* ── B. Filters ─────────────────────────────────────────── */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="flex items-center gap-2">
                  <Filter size={14} style={{ color: S.text3 }} />
                  <span className="text-xs font-medium" style={{ color: S.text3 }}>章节:</span>
                  <FilterGroup
                    items={[
                      { key: "all", label: "全部" },
                      { key: "ch0", label: "序章" },
                      { key: "ch1", label: "第一章" },
                      { key: "ch2", label: "第二章" },
                    ]}
                    active={chapterFilter}
                    onChange={(k) => setChapterFilter(k as ChapterFilter)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <FlaskConical size={14} style={{ color: S.text3 }} />
                  <span className="text-xs font-medium" style={{ color: S.text3 }}>测试:</span>
                  <FilterGroup
                    items={[
                      { key: "all", label: "全部" },
                      { key: "tested", label: "已测试" },
                      { key: "untested", label: "未测试" },
                    ]}
                    active={testFilter}
                    onChange={(k) => setTestFilter(k as TestFilter)}
                  />
                </div>
              </div>

              {/* ── C. Interaction Point Cards ─────────────────────────── */}
              <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                  {filtered.map((ip) => {
                    const expanded = expandedIds.has(ip.id);
                    const emo = emotionColor(ip.emotionIntensity);
                    return (
                      <motion.div
                        key={ip.id}
                        layout
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.22 }}
                        className="rounded-2xl overflow-hidden"
                        style={{ background: S.card, border: `1px solid ${expanded ? S.primary : S.border}`, boxShadow: expanded ? `0 4px 24px ${S.primary10}` : "0 1px 3px rgba(0,0,0,0.04)" }}
                      >
                        {/* ── Card Header (always visible) ────────────── */}
                        <button
                          onClick={() => toggle(ip.id)}
                          className="w-full text-left p-5 focus:outline-none"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              {/* Row 1: name + node + chapter */}
                              <div className="flex items-center gap-2 flex-wrap mb-1.5">
                                <span className="text-base font-bold" style={{ color: S.text }}>{ip.name}</span>
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold" style={{ background: S.s3, color: S.text3 }}>{ip.nodeId}</span>
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold" style={{ background: S.primary10, color: S.primary }}>{chapterLabels[ip.chapterId] ?? ip.chapterId}</span>
                              </div>
                              {/* Row 2: emotion intensity bar */}
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-[10px] font-medium" style={{ color: S.text3 }}>情绪强度</span>
                                <div className="flex-1 max-w-[160px] h-2 rounded-full overflow-hidden" style={{ background: S.s3 }}>
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${ip.emotionIntensity * 10}%` }}
                                    transition={{ duration: 0.5, delay: 0.1 }}
                                    className="h-full rounded-full"
                                    style={{ background: emo.color }}
                                  />
                                </div>
                                <span className="text-[10px] font-bold" style={{ color: emo.color }}>{ip.emotionIntensity}/10</span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded-md font-medium" style={{ background: emo.bg, color: emo.color }}>{emo.label}</span>
                              </div>
                              {/* Row 3: narrative purpose */}
                              <p className="text-xs leading-relaxed line-clamp-1" style={{ color: S.text2 }}>{ip.narrativePurpose}</p>
                            </div>
                            {/* Right: test badge + expand icon */}
                            <div className="flex items-center gap-2 shrink-0">
                              <span
                                className="px-2.5 py-1 rounded-lg text-[10px] font-bold"
                                style={{
                                  background: ip.tested ? "rgba(5,150,105,0.10)" : "rgba(217,119,6,0.10)",
                                  color: ip.tested ? S.success : S.warning,
                                }}
                              >
                                {ip.tested ? "已测试" : "未测试"}
                              </span>
                              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: S.s2 }}>
                                {expanded ? <ChevronUp size={14} style={{ color: S.text3 }} /> : <ChevronDown size={14} style={{ color: S.text3 }} />}
                              </div>
                            </div>
                          </div>
                        </button>

                        {/* ── Card Body (expandable) ─────────────────── */}
                        <AnimatePresence>
                          {expanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.25 }}
                              className="overflow-hidden"
                            >
                              <div className="px-5 pb-5 space-y-5" style={{ borderTop: `1px solid ${S.border}` }}>
                                {/* Player Intent */}
                                <Section icon={<Target size={14} />} title="玩家意图" color={S.primary}>
                                  <p className="text-sm leading-relaxed" style={{ color: S.text2 }}>{ip.playerIntent}</p>
                                </Section>

                                {/* Options */}
                                <Section icon={<GitBranch size={14} />} title={`选项列表 (${ip.options.length})`} color={S.accent}>
                                  <div className="space-y-3">
                                    {ip.options.map((opt, idx) => (
                                      <OptionCard key={idx} option={opt} index={idx} />
                                    ))}
                                  </div>
                                </Section>

                                {/* Feedback */}
                                <Section icon={<BookOpen size={14} />} title="选择反馈文案" color={S.text2}>
                                  <p className="text-sm italic leading-relaxed" style={{ color: S.text2 }}>"{ip.feedback}"</p>
                                </Section>

                                {/* Failure Feedback */}
                                {ip.failureFeedback && (
                                  <Section icon={<AlertTriangle size={14} />} title="失败反馈" color={S.error}>
                                    <p className="text-sm italic leading-relaxed" style={{ color: S.error }}>"{ip.failureFeedback}"</p>
                                  </Section>
                                )}

                                {/* Visible Condition (from any option) */}
                                {ip.options.some((o) => o.visibleCondition) && (
                                  <Section icon={<Eye size={14} />} title="可见条件" color={S.warning}>
                                    {ip.options.filter((o) => o.visibleCondition).map((o, i) => (
                                      <p key={i} className="text-sm" style={{ color: S.text2 }}>
                                        <span className="font-medium" style={{ color: S.warning }}>{o.label}</span>: {o.visibleCondition}
                                      </p>
                                    ))}
                                  </Section>
                                )}

                                {/* visibleCondition on the interaction point itself (top-level) */}
                                {ip.visibleCondition && (
                                  <Section icon={<Eye size={14} />} title="可见条件" color={S.warning}>
                                    <p className="text-sm" style={{ color: S.text2 }}>
                                      {ip.visibleCondition}
                                    </p>
                                  </Section>
                                )}

                                {/* Navigate to node */}
                                <div className="flex justify-end pt-1">
                                  <Link
                                    href="/nodes"
                                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-colors"
                                    style={{ background: S.primary10, color: S.primary }}
                                    onMouseEnter={(e) => { e.currentTarget.style.background = S.primary; e.currentTarget.style.color = "#fff"; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = S.primary10; e.currentTarget.style.color = S.primary; }}
                                  >
                                    前往节点 <ArrowRight size={12} />
                                  </Link>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {filtered.length === 0 && (
                  <div className="text-center py-16">
                    <Sparkles size={32} className="mx-auto mb-3" style={{ color: S.text3 }} />
                    <p className="text-sm" style={{ color: S.text3 }}>没有匹配的互动点</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ════════════ TAB: Consequence Tracking ════════════ */}
          {activeTab === "consequences" && (
            <motion.div key="consequences" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.2 }} className="space-y-6">

              {/* ── Summary Bar ──────────────────────────────────────── */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <ConseqStatCard icon={<Link2 size={14} />} label="总后果" value={conseqStats.total} color={S.primary} bg={S.primary10} />
                <ConseqStatCard icon={<Zap size={14} />} label="即时" value={conseqStats.immediate} color="#22C55E" bg="rgba(34,197,94,0.10)" />
                <ConseqStatCard icon={<Clock size={14} />} label="延迟" value={conseqStats.delayed} color="#EAB308" bg="rgba(234,179,8,0.10)" />
                <ConseqStatCard icon={<Target size={14} />} label="结局" value={conseqStats.ending} color="#EF4444" bg="rgba(239,68,68,0.10)" />
                <ConseqStatCard icon={<CircleCheck size={14} />} label="已回收" value={`${conseqStats.resolved}/${conseqStats.total}`} color={S.success} bg="rgba(5,150,105,0.10)" />
              </div>

              {/* ── Consequence Timeline (by source node) ───────────── */}
              <div className="rounded-2xl overflow-hidden" style={{ background: S.card, border: `1px solid ${S.border}` }}>
                <div className="px-5 py-4 flex items-center gap-2" style={{ borderBottom: `1px solid ${S.border}` }}>
                  <GitBranch size={16} style={{ color: S.primary }} />
                  <h2 className="text-sm font-bold" style={{ color: S.text }}>后果时间线</h2>
                  <span className="text-[10px] px-2 py-0.5 rounded-md font-medium" style={{ background: S.s3, color: S.text3 }}>按来源节点分组</span>
                </div>
                <div className="p-5 space-y-6">
                  {Array.from(conseqStats.bySource.entries()).map(([sourceId, chains]) => (
                    <div key={sourceId}>
                      {/* Source node header */}
                      <div className="flex items-center gap-2 mb-3">
                        <span className="px-2.5 py-1 rounded-lg text-xs font-bold text-white" style={{ background: S.primary }}>{sourceId}</span>
                        <span className="text-xs font-medium" style={{ color: S.text2 }}>
                          {chains[0]?.sourceChoiceLabel ? `"${chains[0].sourceChoiceLabel}" 等 ${chains.length} 个选择` : `${chains.length} 个后果`}
                        </span>
                        <div className="flex-1 h-px" style={{ background: S.border }} />
                      </div>
                      {/* Consequence cards for this source */}
                      <div className="space-y-2 pl-2">
                        {chains.map((chain) => {
                          const tc = timingColor(chain.timing);
                          const isHovered = hoveredChainId === chain.id;
                          return (
                            <motion.div
                              key={chain.id}
                              onMouseEnter={() => setHoveredChainId(chain.id)}
                              onMouseLeave={() => setHoveredChainId(null)}
                              whileHover={{ x: 4 }}
                              className="rounded-xl p-4 transition-shadow"
                              style={{
                                background: isHovered ? S.s2 : S.card,
                                border: `1px solid ${isHovered ? tc.color : S.border}`,
                                borderLeft: `4px solid ${tc.color}`,
                                boxShadow: isHovered ? `0 2px 12px ${tc.bg}` : "none",
                              }}
                            >
                              {/* Top row: choice label + timing badge + resolved */}
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <span className="text-sm font-bold" style={{ color: S.text }}>{chain.sourceChoiceLabel}</span>
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold" style={{ background: tc.bg, color: tc.color }}>{tc.label}</span>
                                <span className="text-[10px] font-medium" style={{ color: S.text3 }}>{chain.timingLabel}</span>
                                <span className="ml-auto flex items-center gap-1">
                                  {chain.resolved ? (
                                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold" style={{ background: "rgba(5,150,105,0.10)", color: S.success }}>
                                      <CircleCheck size={11} /> 已回收
                                    </span>
                                  ) : (
                                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold" style={{ background: "rgba(217,119,6,0.10)", color: S.warning }}>
                                      <AlertCircle size={11} /> 未回收
                                    </span>
                                  )}
                                </span>
                              </div>
                              {/* Description */}
                              <p className="text-xs leading-relaxed mb-2" style={{ color: S.text2 }}>{chain.description}</p>
                              {/* Bottom row: affected states + characters + payoff */}
                              <div className="flex items-center gap-2 flex-wrap">
                                {chain.affectedStates.map((st) => (
                                  <span key={st} className="px-2 py-0.5 rounded-md text-[10px] font-medium" style={{ background: S.primary10, color: S.primary }}>
                                    {stateNames[st] ?? st}
                                  </span>
                                ))}
                                {chain.affectedCharacters.map((ch) => (
                                  <span key={ch} className="px-2 py-0.5 rounded-md text-[10px] font-medium" style={{ background: S.accent10, color: S.accent }}>
                                    {charNames[ch] ?? ch}
                                  </span>
                                ))}
                                {chain.payoffNodeId && (
                                  <span className="ml-auto flex items-center gap-1 text-[10px] font-medium" style={{ color: S.text3 }}>
                                    <ArrowRight size={10} /> 回收于 <span className="font-bold" style={{ color: S.text2 }}>{chain.payoffNodeId}</span>
                                  </span>
                                )}
                              </div>
                              {/* Connector arrow to affected nodes */}
                              <div className="flex items-center gap-1 mt-2 pt-2" style={{ borderTop: `1px dashed ${S.border}` }}>
                                <span className="text-[10px] font-medium" style={{ color: S.text3 }}>影响节点:</span>
                                {chain.affectedNodeIds.map((nid) => (
                                  <span key={nid} className="px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ background: S.s3, color: S.text2 }}>{nid}</span>
                                ))}
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Consequence Chain Flow Diagram ──────────────────── */}
              <div className="rounded-2xl overflow-hidden" style={{ background: S.card, border: `1px solid ${S.border}` }}>
                <div className="px-5 py-4 flex items-center gap-2" style={{ borderBottom: `1px solid ${S.border}` }}>
                  <ArrowRight size={16} style={{ color: S.accent }} />
                  <h2 className="text-sm font-bold" style={{ color: S.text }}>后果流向图</h2>
                  <span className="text-[10px] px-2 py-0.5 rounded-md font-medium" style={{ background: S.s3, color: S.text3 }}>选择 → 后果</span>
                </div>
                <div className="p-5 overflow-x-auto">
                  <svg width="720" height="320" viewBox="0 0 720 320" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto">
                    {/* Left column: source nodes */}
                    {(() => {
                      const sources = Array.from(conseqStats.bySource.keys()).sort();
                      const yStep = 56;
                      const yStart = 30;
                      return sources.map((src, i) => {
                        const y = yStart + i * yStep;
                        return (
                          <g key={src}>
                            <rect x="10" y={y} width="64" height="32" rx="8" fill={S.primary10} stroke={S.primary} strokeWidth="1.5" />
                            <text x="42" y={y + 20} textAnchor="middle" fill={S.primary} fontSize="12" fontWeight="700">{src}</text>
                          </g>
                        );
                      });
                    })()}
                    {/* Right column: outcome nodes */}
                    {(() => {
                      const allTargets = new Set<string>();
                      consequenceChains.forEach((c) => c.affectedNodeIds.forEach((n) => allTargets.add(n)));
                      const targets = Array.from(allTargets).sort();
                      const yStep = 26;
                      const yStart = 14;
                      return targets.map((tgt, i) => {
                        const y = yStart + i * yStep;
                        return (
                          <g key={tgt}>
                            <rect x="646" y={y} width="64" height="24" rx="6" fill={S.accent10} stroke={S.accent} strokeWidth="1" />
                            <text x="678" y={y + 16} textAnchor="middle" fill={S.accent} fontSize="10" fontWeight="600">{tgt}</text>
                          </g>
                        );
                      });
                    })()}
                    {/* Arrows */}
                    {(() => {
                      const sources = Array.from(conseqStats.bySource.keys()).sort();
                      const allTargets = new Set<string>();
                      consequenceChains.forEach((c) => c.affectedNodeIds.forEach((n) => allTargets.add(n)));
                      const targets = Array.from(allTargets).sort();
                      const srcYStep = 56;
                      const srcYStart = 30;
                      const tgtYStep = 26;
                      const tgtYStart = 14;
                      return consequenceChains.map((chain) => {
                        const srcIdx = sources.indexOf(chain.sourceNodeId);
                        if (srcIdx < 0) return null;
                        const srcY = srcYStart + srcIdx * srcYStep + 16;
                        const isHov = hoveredChainId === chain.id;
                        const tc = timingColor(chain.timing);
                        return chain.affectedNodeIds.map((nid, ai) => {
                          const tgtIdx = targets.indexOf(nid);
                          if (tgtIdx < 0) return null;
                          const tgtY = tgtYStart + tgtIdx * tgtYStep + 12;
                          const dashArray = chain.timing === "immediate" ? "none" : chain.timing === "delayed" ? "6 3" : "3 3";
                          return (
                            <g key={`${chain.id}-${nid}`}>
                              <line
                                x1="74" y1={srcY} x2="646" y2={tgtY}
                                stroke={tc.color}
                                strokeWidth={isHov ? 3 : 1.5}
                                strokeDasharray={dashArray}
                                opacity={hoveredChainId && !isHov ? 0.15 : isHov ? 1 : 0.5}
                                style={{ transition: "opacity 0.2s, stroke-width 0.2s" }}
                              />
                              {isHov && (
                                <text x="360" y={(srcY + tgtY) / 2 - 6} textAnchor="middle" fill={tc.color} fontSize="9" fontWeight="600">
                                  {chain.sourceChoiceLabel} → {nid} ({tc.label})
                                </text>
                              )}
                            </g>
                          );
                        });
                      });
                    })()}
                    {/* Legend */}
                    <g transform="translate(180, 290)">
                      <line x1="0" y1="8" x2="30" y2="8" stroke="#22C55E" strokeWidth="2" />
                      <text x="36" y="12" fill={S.text3} fontSize="10">即时</text>
                      <line x1="80" y1="8" x2="110" y2="8" stroke="#EAB308" strokeWidth="2" strokeDasharray="6 3" />
                      <text x="116" y="12" fill={S.text3} fontSize="10">延迟</text>
                      <line x1="160" y1="8" x2="190" y2="8" stroke="#EF4444" strokeWidth="2" strokeDasharray="3 3" />
                      <text x="196" y="12" fill={S.text3} fontSize="10">结局</text>
                    </g>
                  </svg>
                </div>
              </div>

              {/* ── Unresolved Consequences Panel ───────────────────── */}
              {conseqStats.unresolved.length > 0 && (
                <div className="rounded-2xl overflow-hidden" style={{ background: S.card, border: `1px solid rgba(217,119,6,0.3)` }}>
                  <div className="px-5 py-4 flex items-center gap-2" style={{ borderBottom: `1px solid rgba(217,119,6,0.2)`, background: "rgba(217,119,6,0.04)" }}>
                    <AlertCircle size={16} style={{ color: S.warning }} />
                    <h2 className="text-sm font-bold" style={{ color: S.warning }}>未回收的后果 ({conseqStats.unresolved.length})</h2>
                    <span className="text-[10px] px-2 py-0.5 rounded-md font-medium" style={{ background: "rgba(217,119,6,0.10)", color: S.warning }}>需要后续章节处理</span>
                  </div>
                  <div className="p-5 space-y-3">
                    {conseqStats.unresolved.map((chain) => {
                      const tc = timingColor(chain.timing);
                      return (
                        <motion.div
                          key={chain.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="rounded-xl p-4"
                          style={{
                            background: "rgba(217,119,6,0.03)",
                            border: `1px solid rgba(217,119,6,0.15)`,
                            borderLeft: `4px solid ${tc.color}`,
                          }}
                        >
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold text-white" style={{ background: S.primary }}>{chain.sourceNodeId}</span>
                            <span className="text-sm font-bold" style={{ color: S.text }}>{chain.sourceChoiceLabel}</span>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold" style={{ background: tc.bg, color: tc.color }}>{tc.label}</span>
                          </div>
                          <p className="text-xs leading-relaxed mb-3" style={{ color: S.text2 }}>{chain.description}</p>
                          <div className="flex items-center gap-2 flex-wrap mb-3">
                            {chain.affectedStates.map((st) => (
                              <span key={st} className="px-2 py-0.5 rounded-md text-[10px] font-medium" style={{ background: S.primary10, color: S.primary }}>
                                {stateNames[st] ?? st}
                              </span>
                            ))}
                            {chain.affectedCharacters.map((ch) => (
                              <span key={ch} className="px-2 py-0.5 rounded-md text-[10px] font-medium" style={{ background: S.accent10, color: S.accent }}>
                                {charNames[ch] ?? ch}
                              </span>
                            ))}
                          </div>
                          <div className="flex items-center gap-2 p-2.5 rounded-lg" style={{ background: "rgba(217,119,6,0.06)" }}>
                            <AlertTriangle size={12} style={{ color: S.warning }} />
                            <span className="text-[11px] font-medium" style={{ color: S.warning }}>建议在后续章节中回收此后果线</span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}

              {conseqStats.unresolved.length === 0 && (
                <div className="rounded-2xl p-8 text-center" style={{ background: S.card, border: `1px solid ${S.border}` }}>
                  <CircleCheck size={32} className="mx-auto mb-3" style={{ color: S.success }} />
                  <p className="text-sm font-bold" style={{ color: S.success }}>所有后果线均已回收</p>
                  <p className="text-xs mt-1" style={{ color: S.text3 }}>没有未解决的后果悬念</p>
                </div>
              )}

            </motion.div>
          )}

          {/* ════════════ TAB: Design Suggestions ════════════ */}
          {activeTab === "suggestions" && (
            <motion.div key="suggestions" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.2 }} className="space-y-6">

              {/* Summary stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-xl p-4 text-center" style={{ background: "rgba(217,119,6,0.06)", border: "1px solid rgba(217,119,6,0.2)" }}>
                  <FlaskConical size={18} className="mx-auto mb-2" style={{ color: S.warning }} />
                  <p className="text-lg font-bold" style={{ color: S.warning }}>{stats.untested}</p>
                  <p className="text-[10px] font-medium" style={{ color: S.text3 }}>未测试互动点</p>
                </div>
                <div className="rounded-xl p-4 text-center" style={{ background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.2)" }}>
                  <ShieldAlert size={18} className="mx-auto mb-2" style={{ color: S.error }} />
                  <p className="text-lg font-bold" style={{ color: S.error }}>{stats.missingFailFeedback.length}</p>
                  <p className="text-[10px] font-medium" style={{ color: S.text3 }}>缺少失败反馈</p>
                </div>
                <div className="rounded-xl p-4 text-center" style={{ background: S.primary10, border: "1px solid rgba(94,80,232,0.2)" }}>
                  <BarChart3 size={18} className="mx-auto mb-2" style={{ color: S.primary }} />
                  <p className="text-lg font-bold" style={{ color: S.primary }}>{stats.avgIntensity.toFixed(1)}</p>
                  <p className="text-[10px] font-medium" style={{ color: S.text3 }}>平均情绪强度</p>
                </div>
              </div>

              {/* Detailed suggestions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Untested interactions */}
                <div className="rounded-2xl p-5 space-y-4" style={{ background: S.card, border: `1px solid ${S.border}` }}>
                  <div className="flex items-center gap-2">
                    <FlaskConical size={14} style={{ color: S.warning }} />
                    <h3 className="text-sm font-bold" style={{ color: S.text }}>未测试的互动点</h3>
                  </div>
                  {stats.untestedList.length === 0 ? (
                    <div className="text-center py-6">
                      <CheckCircle2 size={24} className="mx-auto mb-2" style={{ color: S.success }} />
                      <p className="text-xs font-medium" style={{ color: S.success }}>所有互动点均已测试</p>
                    </div>
                  ) : (
                    <ul className="space-y-2">
                      {stats.untestedList.map((ip) => {
                        const emo = emotionColor(ip.emotionIntensity);
                        return (
                          <li key={ip.id} className="flex items-center gap-2 p-2.5 rounded-lg" style={{ background: S.s2 }}>
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: S.warning }} />
                            <div className="flex-1 min-w-0">
                              <span className="text-xs font-bold block" style={{ color: S.text }}>{ip.name}</span>
                              <span className="text-[10px]" style={{ color: S.text3 }}>{ip.nodeId} · {chapterLabels[ip.chapterId] ?? ip.chapterId}</span>
                            </div>
                            <span className="text-[9px] px-1.5 py-0.5 rounded font-medium" style={{ background: emo.bg, color: emo.color }}>
                              {ip.emotionIntensity}/10
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>

                {/* Missing failure feedback */}
                <div className="rounded-2xl p-5 space-y-4" style={{ background: S.card, border: `1px solid ${S.border}` }}>
                  <div className="flex items-center gap-2">
                    <ShieldAlert size={14} style={{ color: S.error }} />
                    <h3 className="text-sm font-bold" style={{ color: S.text }}>缺少失败反馈</h3>
                  </div>
                  {stats.missingFailFeedback.length === 0 ? (
                    <div className="text-center py-6">
                      <CheckCircle2 size={24} className="mx-auto mb-2" style={{ color: S.success }} />
                      <p className="text-xs font-medium" style={{ color: S.success }}>所有互动点均有失败反馈</p>
                    </div>
                  ) : (
                    <ul className="space-y-2">
                      {stats.missingFailFeedback.map((ip) => (
                        <li key={ip.id} className="flex items-center gap-2 p-2.5 rounded-lg" style={{ background: "rgba(220,38,38,0.04)" }}>
                          <AlertTriangle size={12} className="shrink-0" style={{ color: S.error }} />
                          <div className="flex-1 min-w-0">
                            <span className="text-xs font-bold block" style={{ color: S.text }}>{ip.name}</span>
                            <span className="text-[10px]" style={{ color: S.text3 }}>{ip.nodeId}</span>
                          </div>
                          <Link href={`/interaction`} className="text-[9px] font-bold px-2 py-1 rounded-lg" style={{ background: "rgba(220,38,38,0.10)", color: S.error }}>
                            补充
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Emotion intensity distribution */}
                <div className="rounded-2xl p-5 space-y-4" style={{ background: S.card, border: `1px solid ${S.border}` }}>
                  <div className="flex items-center gap-2">
                    <BarChart3 size={14} style={{ color: S.primary }} />
                    <h3 className="text-sm font-bold" style={{ color: S.text }}>情绪强度分布</h3>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1" style={{ color: S.text3 }}>
                        <TrendingUp size={11} /> 最高
                      </span>
                      <span className="font-bold" style={{ color: emotionColor(stats.maxIntensity).color }}>{stats.maxIntensity}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1" style={{ color: S.text3 }}>
                        <TrendingDown size={11} /> 最低
                      </span>
                      <span className="font-bold" style={{ color: emotionColor(stats.minIntensity).color }}>{stats.minIntensity}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1" style={{ color: S.text3 }}>
                        <Minus size={11} /> 平均
                      </span>
                      <span className="font-bold" style={{ color: S.text }}>{stats.avgIntensity.toFixed(1)}</span>
                    </div>
                  </div>
                  {/* Bar chart */}
                  <div className="flex items-end gap-1 pt-2 h-16">
                    {interactionPoints.map((ip) => {
                      const ec = emotionColor(ip.emotionIntensity);
                      return (
                        <div key={ip.id} className="flex-1 flex flex-col items-center gap-0.5">
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${ip.emotionIntensity * 10}%` }}
                            transition={{ duration: 0.4, delay: 0.1 }}
                            className="w-full rounded-t-sm"
                            style={{ background: ec.color, minHeight: 4, maxHeight: 56 }}
                          />
                          <span className="text-[8px]" style={{ color: S.text3 }}>{ip.id.replace("ip-", "")}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* Next Step Navigation */}
      <div className="sticky bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 flex items-center justify-between" style={{ borderTopColor: S.border }}>
        <span className="text-xs text-gray-500">下一步：生成节点图谱</span>
        <Link href="/nodes" className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white" style={{ background: '#7C6CF5' }}>
          进入节点图谱 →
        </Link>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// Sub-components
// ══════════════════════════════════════════════════════════════════════════

function StatBadge({ icon, label, value, color, bg }: { icon: React.ReactNode; label: string; value: number; color: string; bg: string }) {
  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl" style={{ background: bg }}>
      <span style={{ color }}>{icon}</span>
      <span className="text-xs font-medium" style={{ color: S.text2 }}>{label}</span>
      <span className="text-sm font-bold" style={{ color }}>{value}</span>
    </div>
  );
}

function FilterGroup({ items, active, onChange }: { items: { key: string; label: string }[]; active: string; onChange: (key: string) => void }) {
  return (
    <div className="flex items-center rounded-xl p-0.5" style={{ background: S.s2 }}>
      {items.map((it) => (
        <button
          key={it.key}
          onClick={() => onChange(it.key)}
          className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all focus:outline-none"
          style={{
            background: active === it.key ? S.card : "transparent",
            color: active === it.key ? S.primary : S.text3,
            boxShadow: active === it.key ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
          }}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}

function Section({ icon, title, color, children }: { icon: React.ReactNode; title: string; color: string; children: React.ReactNode }) {
  return (
    <div className="pt-4">
      <div className="flex items-center gap-2 mb-2">
        <span style={{ color }}>{icon}</span>
        <h3 className="text-xs font-bold uppercase tracking-wide" style={{ color }}>{title}</h3>
      </div>
      <div className="pl-1">{children}</div>
    </div>
  );
}

function OptionCard({ option, index }: { option: InteractionOption; index: number }) {
  const tagColors = [S.primary, S.accent, S.warning, S.error];
  const tagColor = tagColors[index % tagColors.length];
  return (
    <div className="p-3 rounded-xl" style={{ background: S.s2, border: `1px solid ${S.border}` }}>
      <div className="flex items-start gap-2 mb-2">
        <span className="shrink-0 w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold text-white" style={{ background: tagColor }}>
          {String.fromCharCode(65 + index)}
        </span>
        <span className="text-sm font-bold" style={{ color: S.text }}>{option.label}</span>
      </div>
      <div className="ml-7 space-y-1.5">
        <DetailRow label="后果" value={option.consequence} />
        {option.variableEffect && <DetailRow label="变量效果" value={option.variableEffect} color={S.accent} />}
        {option.pathEffect && <DetailRow label="路径效果" value={option.pathEffect} color={S.primary} />}
        {option.longTermImpact && <DetailRow label="长期影响" value={option.longTermImpact} color={S.warning} />}
        {option.visibleCondition && <DetailRow label="可见条件" value={option.visibleCondition} color={S.error} />}
      </div>
    </div>
  );
}

function DetailRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex items-start gap-2 text-xs">
      <span className="shrink-0 font-medium" style={{ color: color ?? S.text3, minWidth: 56 }}>{label}:</span>
      <span style={{ color: S.text2 }}>{value}</span>
    </div>
  );
}

function SuggestionCard({ icon, title, color, bg, border, children }: {
  icon: React.ReactNode; title: string; color: string; bg: string; border: string; children: React.ReactNode;
}) {
  return (
    <div className="p-4 rounded-xl space-y-3" style={{ background: bg, border: `1px solid ${border}` }}>
      <div className="flex items-center gap-2">
        <span style={{ color }}>{icon}</span>
        <h3 className="text-xs font-bold" style={{ color }}>{title}</h3>
      </div>
      {children}
    </div>
  );
}

function TabButton({ active, onClick, label, icon, badge }: {
  active: boolean; onClick: () => void; label: string; icon: React.ReactNode; badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      className="relative flex items-center gap-1.5 px-4 py-3 text-sm font-medium transition-colors focus:outline-none"
      style={{ color: active ? S.primary : S.text3 }}
    >
      {icon}
      {label}
      {badge !== undefined && badge > 0 && (
        <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold text-white" style={{ background: S.warning }}>
          {badge}
        </span>
      )}
      {/* Underline indicator */}
      {active && (
        <motion.div
          layoutId="tab-underline"
          className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
          style={{ background: S.primary }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      )}
    </button>
  );
}

function ConseqStatCard({ icon, label, value, color, bg }: {
  icon: React.ReactNode; label: string; value: number | string; color: string; bg: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl p-4 flex flex-col items-center gap-1"
      style={{ background: bg }}
    >
      <span style={{ color }}>{icon}</span>
      <span className="text-lg font-bold" style={{ color }}>{value}</span>
      <span className="text-[10px] font-medium" style={{ color: S.text3 }}>{label}</span>
    </motion.div>
  );
}
