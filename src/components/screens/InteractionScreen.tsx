"use client";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, TestTube, TestTube2, Filter, ChevronDown, ChevronUp,
  AlertTriangle, CheckCircle2, ArrowRight, Target, Layers,
  BarChart3, ShieldAlert, TrendingUp, TrendingDown, Minus,
  Eye, GitBranch, FlaskConical, BookOpen, Sparkles,
} from "lucide-react";
import Link from "next/link";
import { INTERACTION_POINTS, type InteractionPoint, type InteractionOption } from "@/lib/studio-data";

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

// ── Chapter label helper ─────────────────────────────────────────────────
const CHAPTER_LABELS: Record<string, string> = {
  ch0: "序章",
  ch1: "第一章",
  ch2: "第二章",
};

// ── Filter types ─────────────────────────────────────────────────────────
type ChapterFilter = "all" | "ch0" | "ch1" | "ch2";
type TestFilter = "all" | "tested" | "untested";

// ══════════════════════════════════════════════════════════════════════════
export default function InteractionScreen() {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [chapterFilter, setChapterFilter] = useState<ChapterFilter>("all");
  const [testFilter, setTestFilter] = useState<TestFilter>("all");

  // ── Statistics ──────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = INTERACTION_POINTS.length;
    const totalOptions = INTERACTION_POINTS.reduce((s, ip) => s + ip.options.length, 0);
    const tested = INTERACTION_POINTS.filter((ip) => ip.tested).length;
    const untested = total - tested;
    const intensities = INTERACTION_POINTS.map((ip) => ip.emotionIntensity);
    const maxIntensity = Math.max(...intensities);
    const minIntensity = Math.min(...intensities);
    const avgIntensity = intensities.reduce((a, b) => a + b, 0) / intensities.length;
    const missingFailFeedback = INTERACTION_POINTS.filter(
      (ip) => !ip.failureFeedback && ip.options.some((o) => o.consequence.toLowerCase().includes("失败") || o.consequence.toLowerCase().includes("暴露") || o.consequence.toLowerCase().includes("警报"))
    );
    const untestedList = INTERACTION_POINTS.filter((ip) => !ip.tested);
    return { total, totalOptions, tested, untested, maxIntensity, minIntensity, avgIntensity, missingFailFeedback, untestedList };
  }, []);

  // ── Filtered list ──────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return INTERACTION_POINTS.filter((ip) => {
      if (chapterFilter !== "all" && ip.chapterId !== chapterFilter) return false;
      if (testFilter === "tested" && !ip.tested) return false;
      if (testFilter === "untested" && ip.tested) return false;
      return true;
    });
  }, [chapterFilter, testFilter]);

  // ── Toggle expand ──────────────────────────────────────────────────────
  const toggle = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

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

        {/* ── B. Filters ─────────────────────────────────────────────────── */}
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

        {/* ── C. Interaction Point Cards ─────────────────────────────────── */}
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
                  {/* ── Card Header (always visible) ────────────────────── */}
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
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold" style={{ background: S.primary10, color: S.primary }}>{CHAPTER_LABELS[ip.chapterId] ?? ip.chapterId}</span>
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

                  {/* ── Card Body (expandable) ─────────────────────────── */}
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

        {/* ── D. Design Suggestions Panel ────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl p-6 space-y-5"
          style={{ background: S.card, border: `1px solid ${S.border}` }}
        >
          <div className="flex items-center gap-2">
            <Sparkles size={16} style={{ color: S.primary }} />
            <h2 className="text-sm font-bold" style={{ color: S.text }}>设计建议</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Untested interactions */}
            <SuggestionCard
              icon={<FlaskConical size={14} />}
              title="未测试的互动点"
              color={S.warning}
              bg="rgba(217,119,6,0.06)"
              border="rgba(217,119,6,0.2)"
            >
              {stats.untestedList.length === 0 ? (
                <p className="text-xs" style={{ color: S.success }}>所有互动点均已测试</p>
              ) : (
                <ul className="space-y-1.5">
                  {stats.untestedList.map((ip) => (
                    <li key={ip.id} className="flex items-center gap-2 text-xs" style={{ color: S.text2 }}>
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: S.warning }} />
                      <span className="font-medium">{ip.name}</span>
                      <span style={{ color: S.text3 }}>({ip.nodeId})</span>
                    </li>
                  ))}
                </ul>
              )}
            </SuggestionCard>

            {/* Missing failure feedback */}
            <SuggestionCard
              icon={<ShieldAlert size={14} />}
              title="缺少失败反馈"
              color={S.error}
              bg="rgba(220,38,38,0.06)"
              border="rgba(220,38,38,0.2)"
            >
              {stats.missingFailFeedback.length === 0 ? (
                <p className="text-xs" style={{ color: S.success }}>所有互动点均有失败反馈</p>
              ) : (
                <ul className="space-y-1.5">
                  {stats.missingFailFeedback.map((ip) => (
                    <li key={ip.id} className="flex items-center gap-2 text-xs" style={{ color: S.text2 }}>
                      <AlertTriangle size={11} className="shrink-0" style={{ color: S.error }} />
                      <span className="font-medium">{ip.name}</span>
                      <span style={{ color: S.text3 }}>({ip.nodeId})</span>
                    </li>
                  ))}
                </ul>
              )}
            </SuggestionCard>

            {/* Emotion intensity summary */}
            <SuggestionCard
              icon={<BarChart3 size={14} />}
              title="情绪强度分布"
              color={S.primary}
              bg={S.primary10}
              border="rgba(94,80,232,0.2)"
            >
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
                {/* Mini bar chart */}
                <div className="flex items-end gap-1 pt-2 h-12">
                  {INTERACTION_POINTS.map((ip) => {
                    const ec = emotionColor(ip.emotionIntensity);
                    return (
                      <div key={ip.id} className="flex-1 flex flex-col items-center gap-0.5">
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${ip.emotionIntensity * 10}%` }}
                          transition={{ duration: 0.4, delay: 0.3 }}
                          className="w-full rounded-t-sm"
                          style={{ background: ec.color, minHeight: 4, maxHeight: 40 }}
                        />
                        <span className="text-[8px]" style={{ color: S.text3 }}>{ip.id.replace("ip-", "")}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </SuggestionCard>
          </div>
        </motion.div>

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
