"use client";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, ChevronDown, ChevronUp, AlertTriangle, CheckCircle2,
  ArrowRight, Target, Clock, MousePointer, Gamepad2, Crosshair,
  Sparkles, TestTube, MapPin, Timer, Eye, Repeat, Layers,
  CircleDot, Keyboard,
} from "lucide-react";
import Link from "next/link";
import type { QTEConfig, HotspotConfig } from "@/lib/studio-data";
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

// ── Operation type icons ─────────────────────────────────────────────────
const OP_ICONS: Record<string, string> = {
  tap: "\u{1F446}",
  swipe: "\u{1F44B}",
  hold: "\u{270A}",
  sequence: "\u{2328}\u{FE0F}",
};

// ── Difficulty styling ───────────────────────────────────────────────────
function difficultyStyle(d: QTEConfig["difficulty"]) {
  if (d === "easy") return { color: S.success, bg: "rgba(5,150,105,0.10)", label: "简单" };
  if (d === "normal") return { color: S.warning, bg: "rgba(217,119,6,0.10)", label: "普通" };
  return { color: S.error, bg: "rgba(220,38,38,0.10)", label: "困难" };
}

// ── Size styling ─────────────────────────────────────────────────────────
function sizeStyle(s: HotspotConfig["size"]) {
  if (s === "small") return { label: "小", px: 8 };
  if (s === "medium") return { label: "中", px: 14 };
  return { label: "大", px: 20 };
}

// ── Failure path labels ─────────────────────────────────────────────────
const FAILURE_PATH_LABELS: Record<string, string> = {
  bad_ending: "坏结局",
  alternate_path: "备用路线",
  retry: "重试",
};

// ── Tab type ─────────────────────────────────────────────────────────────
type TabKey = "qte" | "hotspot";

// ══════════════════════════════════════════════════════════════════════════
export default function QTEEditorScreen() {
  const qteConfigs = useNarrativeStore(s => s.qteConfigs);
  const hotspotConfigs = useNarrativeStore(s => s.hotspotConfigs);
  const storyNodes = useNarrativeStore(s => s.storyNodes);
  const [activeTab, setActiveTab] = useState<TabKey>("qte");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // ── Statistics ──────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const qteCount = qteConfigs.length;
    const hotspotCount = hotspotConfigs.length;
    const tested = qteConfigs.filter((q) => q.tested).length;
    const untested = qteCount - tested;

    // Nodes without hotspots (scene/start nodes)
    const sceneNodeIds = storyNodes
      .filter((n) => n.type === "scene" || n.type === "start")
      .map((n) => n.id);
    const hotspotNodeIds = new Set(hotspotConfigs.map((h) => h.nodeId));
    const missingHotspotNodes = storyNodes.filter(
      (n) => sceneNodeIds.includes(n.id) && !hotspotNodeIds.has(n.id)
    );

    // QTE time analysis
    const timeWarnings = qteConfigs.filter((q) => q.timeLimit < 1 || q.timeLimit > 10);

    return { qteCount, hotspotCount, tested, untested, missingHotspotNodes, timeWarnings };
  }, [qteConfigs, hotspotConfigs, storyNodes]);

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

        {/* ── A. Top Title Bar ───────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: S.primary10 }}>
              <Gamepad2 size={20} style={{ color: S.primary }} />
            </div>
            <div>
              <h1 className="text-xl font-bold" style={{ color: S.text }}>QTE / Hotspot 编辑器</h1>
              <p className="text-xs" style={{ color: S.text3 }}>配置快速反应事件与可点击热区</p>
            </div>
          </div>

          {/* Tab switcher */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center rounded-xl p-0.5" style={{ background: S.s2 }}>
              <TabButton
                active={activeTab === "qte"}
                onClick={() => setActiveTab("qte")}
                label="QTE 事件"
                count={stats.qteCount}
              />
              <TabButton
                active={activeTab === "hotspot"}
                onClick={() => setActiveTab("hotspot")}
                label="Hotspot 热区"
                count={stats.hotspotCount}
              />
            </div>
          </div>
        </div>

        {/* ── Stats row ──────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 flex-wrap">
          <StatBadge icon={<Zap size={13} />} label="QTE 数量" value={stats.qteCount} color={S.primary} bg={S.primary10} />
          <StatBadge icon={<Crosshair size={13} />} label="Hotspot 数量" value={stats.hotspotCount} color={S.accent} bg={S.accent10} />
          <StatBadge icon={<CheckCircle2 size={13} />} label="已测试" value={stats.tested} color={S.success} bg="rgba(5,150,105,0.10)" />
          <StatBadge icon={<AlertTriangle size={13} />} label="未测试" value={stats.untested} color={stats.untested > 0 ? S.warning : S.text3} bg={stats.untested > 0 ? "rgba(217,119,6,0.10)" : S.s3} />
        </div>

        {/* ── B. QTE Events Tab ──────────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          {activeTab === "qte" && (
            <motion.div
              key="qte"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {qteConfigs.map((qte) => {
                const expanded = expandedIds.has(qte.id);
                const diff = difficultyStyle(qte.difficulty);
                return (
                  <motion.div
                    key={qte.id}
                    layout
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.22 }}
                    className="rounded-2xl overflow-hidden"
                    style={{
                      background: S.card,
                      border: `1px solid ${expanded ? S.primary : S.border}`,
                      boxShadow: expanded ? `0 4px 24px ${S.primary10}` : "0 1px 3px rgba(0,0,0,0.04)",
                    }}
                  >
                    {/* Card Header */}
                    <button onClick={() => toggle(qte.id)} className="w-full text-left p-5 focus:outline-none">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1.5">
                            <span className="text-base font-bold" style={{ color: S.text }}>{qte.name}</span>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold" style={{ background: S.s3, color: S.text3 }}>{qte.nodeId}</span>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold" style={{ background: diff.bg, color: diff.color }}>
                              {diff.label}
                            </span>
                          </div>
                          <p className="text-xs leading-relaxed line-clamp-1" style={{ color: S.text2 }}>{qte.triggerMoment}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className="px-2.5 py-1 rounded-lg text-[10px] font-bold"
                            style={{
                              background: qte.tested ? "rgba(5,150,105,0.10)" : "rgba(217,119,6,0.10)",
                              color: qte.tested ? S.success : S.warning,
                            }}
                          >
                            {qte.tested ? "已测试" : "未测试"}
                          </span>
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: S.s2 }}>
                            {expanded ? <ChevronUp size={14} style={{ color: S.text3 }} /> : <ChevronDown size={14} style={{ color: S.text3 }} />}
                          </div>
                        </div>
                      </div>
                    </button>

                    {/* Card Body */}
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

                            {/* Trigger moment */}
                            <Section icon={<Target size={14} />} title="触发时机" color={S.primary}>
                              <p className="text-sm leading-relaxed" style={{ color: S.text2 }}>{qte.triggerMoment}</p>
                            </Section>

                            {/* Operation type */}
                            <Section icon={<MousePointer size={14} />} title="操作类型" color={S.accent}>
                              <div className="flex items-center gap-3">
                                <span className="text-2xl">{OP_ICONS[qte.operationType]}</span>
                                <div>
                                  <p className="text-sm font-bold" style={{ color: S.text }}>{qte.operationLabel}</p>
                                  <p className="text-xs" style={{ color: S.text3 }}>类型: {qte.operationType}</p>
                                </div>
                              </div>
                            </Section>

                            {/* Time limit */}
                            <Section icon={<Clock size={14} />} title="时间限制" color={S.warning}>
                              <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                  <span className="text-lg font-bold" style={{ color: S.warning }}>{qte.timeLimit}s</span>
                                  <div className="flex-1 max-w-[200px] h-3 rounded-full overflow-hidden" style={{ background: S.s3 }}>
                                    <motion.div
                                      initial={{ width: 0 }}
                                      animate={{ width: `${Math.min((qte.timeLimit / 10) * 100, 100)}%` }}
                                      transition={{ duration: 0.6, delay: 0.1 }}
                                      className="h-full rounded-full"
                                      style={{
                                        background: qte.timeLimit < 2 ? S.error : qte.timeLimit < 5 ? S.warning : S.success,
                                      }}
                                    />
                                  </div>
                                </div>
                                <p className="text-xs" style={{ color: S.text3 }}>
                                  {qte.timeLimit < 2 ? "极短时间，需要快速反应" : qte.timeLimit < 5 ? "中等时间，适度紧张感" : "较长时间，容错率高"}
                                </p>
                              </div>
                            </Section>

                            {/* Success / Failure feedback */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                              <div className="p-4 rounded-xl" style={{ background: "rgba(5,150,105,0.06)", border: "1px solid rgba(5,150,105,0.2)" }}>
                                <div className="flex items-center gap-2 mb-2">
                                  <CheckCircle2 size={14} style={{ color: S.success }} />
                                  <h3 className="text-xs font-bold" style={{ color: S.success }}>成功反馈</h3>
                                </div>
                                <p className="text-sm leading-relaxed" style={{ color: S.text2 }}>{qte.successFeedback}</p>
                              </div>
                              <div className="p-4 rounded-xl" style={{ background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.2)" }}>
                                <div className="flex items-center gap-2 mb-2">
                                  <AlertTriangle size={14} style={{ color: S.error }} />
                                  <h3 className="text-xs font-bold" style={{ color: S.error }}>失败反馈</h3>
                                </div>
                                <p className="text-sm leading-relaxed" style={{ color: S.text2 }}>{qte.failureFeedback}</p>
                              </div>
                            </div>

                            {/* Variable changes */}
                            <Section icon={<Layers size={14} />} title="变量变化" color={S.accent}>
                              <ul className="space-y-1.5">
                                {qte.variableChanges.map((v, i) => (
                                  <li key={i} className="flex items-center gap-2 text-xs" style={{ color: S.text2 }}>
                                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: S.accent }} />
                                    <code className="px-1.5 py-0.5 rounded-md text-[11px]" style={{ background: S.s2, color: S.accent }}>{v}</code>
                                  </li>
                                ))}
                              </ul>
                            </Section>

                            {/* Failure path */}
                            <Section icon={<AlertTriangle size={14} />} title="失败路径" color={S.error}>
                              <span
                                className="inline-block px-3 py-1 rounded-lg text-xs font-bold"
                                style={{
                                  background: qte.failurePath === "retry" ? "rgba(217,119,6,0.10)" : "rgba(220,38,38,0.10)",
                                  color: qte.failurePath === "retry" ? S.warning : S.error,
                                }}
                              >
                                {FAILURE_PATH_LABELS[qte.failurePath] ?? qte.failurePath}
                              </span>
                            </Section>

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

              {qteConfigs.length === 0 && (
                <div className="text-center py-16">
                  <Sparkles size={32} className="mx-auto mb-3" style={{ color: S.text3 }} />
                  <p className="text-sm" style={{ color: S.text3 }}>暂无 QTE 事件</p>
                </div>
              )}
            </motion.div>
          )}

          {/* ── C. Hotspot Tab ───────────────────────────────────────────── */}
          {activeTab === "hotspot" && (
            <motion.div
              key="hotspot"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {hotspotConfigs.map((hs) => {
                const expanded = expandedIds.has(hs.id);
                const sz = sizeStyle(hs.size);
                return (
                  <motion.div
                    key={hs.id}
                    layout
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.22 }}
                    className="rounded-2xl overflow-hidden"
                    style={{
                      background: S.card,
                      border: `1px solid ${expanded ? S.accent : S.border}`,
                      boxShadow: expanded ? `0 4px 24px ${S.accent10}` : "0 1px 3px rgba(0,0,0,0.04)",
                    }}
                  >
                    {/* Card Header */}
                    <button onClick={() => toggle(hs.id)} className="w-full text-left p-5 focus:outline-none">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1.5">
                            <span className="text-base font-bold" style={{ color: S.text }}>{hs.name}</span>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold" style={{ background: S.s3, color: S.text3 }}>{hs.nodeId}</span>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold" style={{ background: S.accent10, color: S.accent }}>
                              {sz.label}
                            </span>
                            {hs.timed && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold" style={{ background: "rgba(217,119,6,0.10)", color: S.warning }}>
                                限时
                              </span>
                            )}
                          </div>
                          <p className="text-xs leading-relaxed line-clamp-1" style={{ color: S.text2 }}>{hs.clickFeedback}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: S.s2 }}>
                            {expanded ? <ChevronUp size={14} style={{ color: S.text3 }} /> : <ChevronDown size={14} style={{ color: S.text3 }} />}
                          </div>
                        </div>
                      </div>
                    </button>

                    {/* Card Body */}
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

                            {/* Position preview */}
                            <Section icon={<MapPin size={14} />} title="位置坐标" color={S.primary}>
                              <div className="flex items-start gap-4">
                                {/* Position preview box */}
                                <div
                                  className="relative rounded-lg overflow-hidden shrink-0"
                                  style={{ width: 120, height: 68, background: S.s3, border: `1px solid ${S.border}` }}
                                >
                                  {/* Grid lines */}
                                  <div className="absolute inset-0" style={{ opacity: 0.3 }}>
                                    <div className="absolute left-1/2 top-0 bottom-0 w-px" style={{ background: S.border2 }} />
                                    <div className="absolute top-1/2 left-0 right-0 h-px" style={{ background: S.border2 }} />
                                  </div>
                                  {/* Hotspot dot */}
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", delay: 0.2 }}
                                    className="absolute rounded-full"
                                    style={{
                                      left: `${hs.positionX}%`,
                                      top: `${hs.positionY}%`,
                                      width: sz.px,
                                      height: sz.px,
                                      background: S.accent,
                                      transform: "translate(-50%, -50%)",
                                      boxShadow: `0 0 8px ${S.accent}`,
                                    }}
                                  />
                                  {/* Label */}
                                  <div className="absolute bottom-1 right-1 text-[8px]" style={{ color: S.text3 }}>16:9</div>
                                </div>
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2 text-xs">
                                    <span className="font-medium" style={{ color: S.text3, minWidth: 32 }}>X:</span>
                                    <span className="font-bold" style={{ color: S.text }}>{hs.positionX}%</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-xs">
                                    <span className="font-medium" style={{ color: S.text3, minWidth: 32 }}>Y:</span>
                                    <span className="font-bold" style={{ color: S.text }}>{hs.positionY}%</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-xs">
                                    <span className="font-medium" style={{ color: S.text3, minWidth: 32 }}>尺寸:</span>
                                    <span className="font-bold" style={{ color: S.accent }}>{sz.label}</span>
                                  </div>
                                </div>
                              </div>
                            </Section>

                            {/* Appear condition */}
                            {hs.appearCondition && (
                              <Section icon={<Eye size={14} />} title="出现条件" color={S.warning}>
                                <code className="px-2 py-1 rounded-lg text-xs" style={{ background: "rgba(217,119,6,0.10)", color: S.warning }}>
                                  {hs.appearCondition}
                                </code>
                              </Section>
                            )}

                            {/* Click feedback */}
                            <Section icon={<MousePointer size={14} />} title="点击反馈" color={S.accent}>
                              <p className="text-sm leading-relaxed" style={{ color: S.text2 }}>{hs.clickFeedback}</p>
                            </Section>

                            {/* Trigger script */}
                            <Section icon={<Keyboard size={14} />} title="触发脚本" color={S.primary}>
                              <code className="px-2 py-1 rounded-lg text-xs font-mono" style={{ background: S.s2, color: S.primary }}>
                                {hs.triggerScript}
                              </code>
                            </Section>

                            {/* Timed + time limit */}
                            <Section icon={<Timer size={14} />} title="限时设置" color={hs.timed ? S.warning : S.text3}>
                              <div className="flex items-center gap-3">
                                <span
                                  className="px-3 py-1 rounded-lg text-xs font-bold"
                                  style={{
                                    background: hs.timed ? "rgba(217,119,6,0.10)" : S.s3,
                                    color: hs.timed ? S.warning : S.text3,
                                  }}
                                >
                                  {hs.timed ? "限时" : "不限时"}
                                </span>
                                {hs.timed && hs.timeLimit && (
                                  <span className="text-sm font-bold" style={{ color: S.warning }}>{hs.timeLimit}s</span>
                                )}
                              </div>
                            </Section>

                            {/* Toggle states */}
                            <div className="grid grid-cols-2 gap-3 pt-2">
                              <div className="p-3 rounded-xl" style={{ background: S.s2, border: `1px solid ${S.border}` }}>
                                <div className="flex items-center gap-2 mb-1">
                                  <CircleDot size={12} style={{ color: hs.highlightOnHover ? S.accent : S.text3 }} />
                                  <span className="text-xs font-medium" style={{ color: S.text2 }}>悬停高亮</span>
                                </div>
                                <span
                                  className="text-[10px] font-bold"
                                  style={{ color: hs.highlightOnHover ? S.success : S.text3 }}
                                >
                                  {hs.highlightOnHover ? "开启" : "关闭"}
                                </span>
                              </div>
                              <div className="p-3 rounded-xl" style={{ background: S.s2, border: `1px solid ${S.border}` }}>
                                <div className="flex items-center gap-2 mb-1">
                                  <Repeat size={12} style={{ color: hs.repeatable ? S.accent : S.text3 }} />
                                  <span className="text-xs font-medium" style={{ color: S.text2 }}>可重复点击</span>
                                </div>
                                <span
                                  className="text-[10px] font-bold"
                                  style={{ color: hs.repeatable ? S.success : S.text3 }}
                                >
                                  {hs.repeatable ? "开启" : "关闭"}
                                </span>
                              </div>
                            </div>

                            {/* Navigate to node */}
                            <div className="flex justify-end pt-1">
                              <Link
                                href="/nodes"
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-colors"
                                style={{ background: S.accent10, color: S.accent }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = S.accent; e.currentTarget.style.color = "#fff"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = S.accent10; e.currentTarget.style.color = S.accent; }}
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

              {hotspotConfigs.length === 0 && (
                <div className="text-center py-16">
                  <Sparkles size={32} className="mx-auto mb-3" style={{ color: S.text3 }} />
                  <p className="text-sm" style={{ color: S.text3 }}>暂无 Hotspot 热区</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

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
            {/* Untested QTEs */}
            <SuggestionCard
              icon={<TestTube size={14} />}
              title="未测试的 QTE"
              color={S.warning}
              bg="rgba(217,119,6,0.06)"
              border="rgba(217,119,6,0.2)"
            >
              {stats.untested === 0 ? (
                <p className="text-xs" style={{ color: S.success }}>所有 QTE 均已测试</p>
              ) : (
                <ul className="space-y-1.5">
                  {qteConfigs.filter((q) => !q.tested).map((q) => (
                    <li key={q.id} className="flex items-center gap-2 text-xs" style={{ color: S.text2 }}>
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: S.warning }} />
                      <span className="font-medium">{q.name}</span>
                      <span style={{ color: S.text3 }}>({q.nodeId})</span>
                    </li>
                  ))}
                </ul>
              )}
            </SuggestionCard>

            {/* Nodes missing hotspots */}
            <SuggestionCard
              icon={<Crosshair size={14} />}
              title="缺少 Hotspot 的节点"
              color={S.error}
              bg="rgba(220,38,38,0.06)"
              border="rgba(220,38,38,0.2)"
            >
              {stats.missingHotspotNodes.length === 0 ? (
                <p className="text-xs" style={{ color: S.success }}>所有场景节点均有 Hotspot</p>
              ) : (
                <ul className="space-y-1.5">
                  {stats.missingHotspotNodes.map((n) => (
                    <li key={n.id} className="flex items-center gap-2 text-xs" style={{ color: S.text2 }}>
                      <AlertTriangle size={11} className="shrink-0" style={{ color: S.error }} />
                      <span className="font-medium">{n.label}</span>
                      <span style={{ color: S.text3 }}>({n.id})</span>
                    </li>
                  ))}
                </ul>
              )}
            </SuggestionCard>

            {/* QTE time distribution */}
            <SuggestionCard
              icon={<Clock size={14} />}
              title="QTE 时间分布"
              color={S.primary}
              bg={S.primary10}
              border="rgba(94,80,232,0.2)"
            >
              {stats.timeWarnings.length === 0 ? (
                <div className="space-y-2">
                  <p className="text-xs" style={{ color: S.success }}>所有 QTE 时间设置合理</p>
                  <div className="space-y-1.5 pt-1">
                    {qteConfigs.map((q) => (
                      <div key={q.id} className="flex items-center justify-between text-xs">
                        <span style={{ color: S.text2 }}>{q.name}</span>
                        <span className="font-bold" style={{ color: S.text }}>{q.timeLimit}s</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <ul className="space-y-1.5">
                  {stats.timeWarnings.map((q) => (
                    <li key={q.id} className="flex items-center gap-2 text-xs" style={{ color: S.text2 }}>
                      <AlertTriangle size={11} className="shrink-0" style={{ color: S.warning }} />
                      <span className="font-medium">{q.name}</span>
                      <span style={{ color: S.warning }}>{q.timeLimit}s {q.timeLimit < 1 ? "过短" : "过长"}</span>
                    </li>
                  ))}
                  {qteConfigs.filter((q) => !stats.timeWarnings.includes(q)).map((q) => (
                    <li key={q.id} className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-2" style={{ color: S.text2 }}>
                        <CheckCircle2 size={11} className="shrink-0" style={{ color: S.success }} />
                        <span className="font-medium">{q.name}</span>
                      </span>
                      <span style={{ color: S.success }}>{q.timeLimit}s</span>
                    </li>
                  ))}
                </ul>
              )}
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

function TabButton({ active, onClick, label, count }: {
  active: boolean; onClick: () => void; label: string; count: number;
}) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2 rounded-lg text-xs font-medium transition-all focus:outline-none flex items-center gap-1.5"
      style={{
        background: active ? S.card : "transparent",
        color: active ? S.primary : S.text3,
        boxShadow: active ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
      }}
    >
      {label}
      <span
        className="px-1.5 py-0.5 rounded-md text-[10px] font-bold"
        style={{
          background: active ? S.primary10 : S.s3,
          color: active ? S.primary : S.text3,
        }}
      >
        {count}
      </span>
    </button>
  );
}

function StatBadge({ icon, label, value, color, bg }: {
  icon: React.ReactNode; label: string; value: number; color: string; bg: string;
}) {
  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl" style={{ background: bg }}>
      <span style={{ color }}>{icon}</span>
      <span className="text-xs font-medium" style={{ color: S.text2 }}>{label}</span>
      <span className="text-sm font-bold" style={{ color }}>{value}</span>
    </div>
  );
}

function Section({ icon, title, color, children }: {
  icon: React.ReactNode; title: string; color: string; children: React.ReactNode;
}) {
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
