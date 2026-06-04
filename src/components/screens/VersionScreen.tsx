"use client";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GitCompareArrows, Camera, History, ArrowLeftRight,
  Clock, Plus, Minus, Pencil, Rocket,
  CheckCircle2, Layers, ChevronRight, GitBranch, Sparkles, BookOpen,
} from "lucide-react";
import { useNarrativeStore, useUIStore, useVersionStore } from "@/store";
import type { VersionDiff } from "@/lib/types/collaboration";

// ── 设计系统 ──────────────────────────────────────────────────────────────
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

// ── Tab 定义 ─────────────────────────────────────────────────────────────
const TABS = [
  { label: "版本差异", icon: GitCompareArrows },
  { label: "版本快照", icon: Camera },
  { label: "变更记录", icon: History },
  { label: "版本历史", icon: BookOpen },
];

// ── 状态配置 ─────────────────────────────────────────────────────────────
const STATUS_CFG: Record<string, { label: string; bg: string; color: string }> = {
  current:   { label: "当前", bg: `${S.primary}12`, color: S.primary },
  published: { label: "已发布", bg: `${S.success}12`, color: S.success },
  draft:     { label: "草稿", bg: `${S.warning}12`, color: S.warning },
};

// ── Diff 指标配置 ─────────────────────────────────────────────────────────
type MetricKey = "nodesAdded" | "nodesModified" | "nodesRemoved" | "variablesChanged" | "assetsUpdated" | "scriptChanges";

const METRICS: { key: MetricKey; label: string; color: string }[] = [
  { key: "nodesAdded",       label: "节点新增", color: S.success },
  { key: "nodesModified",    label: "节点修改", color: S.primary },
  { key: "nodesRemoved",     label: "节点删除", color: S.error },
  { key: "variablesChanged", label: "变量变更", color: S.warning },
  { key: "assetsUpdated",    label: "资产更新", color: S.accent },
  { key: "scriptChanges",    label: "脚本变更", color: "#8B5CF6" },
];

const getMetric = (d: VersionDiff, key: MetricKey): number => d[key] ?? 0;

// ── 操作图标映射 ─────────────────────────────────────────────────────────
const ACTION_ICONS: Record<string, typeof Pencil> = {
  edit: Pencil, add: Plus, delete: Minus, publish: Rocket,
};

// ── 动画配置 ─────────────────────────────────────────────────────────────
const fadeIn = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.18 },
};

// ── 组件 ─────────────────────────────────────────────────────────────────
export default function VersionScreen() {
  const versionDiffs  = useNarrativeStore(s => s.versionDiffs);
  const collabTasks   = useNarrativeStore(s => s.collabTasks);
  const collabComments = useNarrativeStore(s => s.collabComments);
  const addToast      = useUIStore(s => s.addToast);

  // ── Version Store selectors ──
  const vSnapshots    = useVersionStore(s => s.snapshots);
  const vBranches     = useVersionStore(s => s.branches);
  const vHistory      = useVersionStore(s => s.getHistory());
  const createSnapshot = useVersionStore(s => s.createSnapshot);
  const computeChangeSet = useVersionStore(s => s.computeChangeSet);
  const activeBranch  = useVersionStore(s => s.getActiveBranch());

  const [activeTab, setActiveTab]   = useState(0);
  const [fromIdx, setFromIdx]       = useState(0);
  const [toIdx, setToIdx]           = useState(Math.max(0, versionDiffs.length - 1));
  const [compareMode, setCompareMode] = useState(false);
  const [selectedSnapshots, setSelectedSnapshots] = useState<number[]>([]);

  // ── 快照列表 ───────────────────────────────────────────────────────────
  const snapshots = useMemo(() => {
    if (versionDiffs.length === 0) return [];
    const now = new Date();
    return versionDiffs.map((d, i) => ({
      version: d.toVersion,
      status: i === versionDiffs.length - 1 ? "current" as const : "published" as const,
      date: `${String(now.getMonth() + 1).padStart(2, "0")}/${String(now.getDate() - (versionDiffs.length - 1 - i)).padStart(2, "0")}`,
      changes: d.nodesAdded + d.nodesModified + d.nodesRemoved + d.variablesChanged + d.assetsUpdated + d.scriptChanges,
      summary: d.summary,
    }));
  }, [versionDiffs]);

  // ── 变更日志 ───────────────────────────────────────────────────────────
  const changeLog = useMemo(() => {
    const taskActionMap: Record<string, { action: string; actionLabel: string; color: string }> = {
      "节点编辑": { action: "edit", actionLabel: "编辑", color: S.primary },
      "资产制作": { action: "add",  actionLabel: "新增", color: S.accent },
      "剧本编写": { action: "edit", actionLabel: "编写", color: S.primary },
      "质检修复": { action: "edit", actionLabel: "修复", color: S.warning },
      "UI设计":   { action: "edit", actionLabel: "设计", color: S.primary },
      "互动设计": { action: "edit", actionLabel: "设计", color: S.accent },
    };
    const taskEntries = collabTasks.map(t => {
      const cfg = taskActionMap[t.category] ?? { action: "edit", actionLabel: "编辑", color: S.text2 };
      return {
        time: t.dueDate ? t.dueDate.slice(5) : "—",
        action: cfg.action,
        actionLabel: cfg.actionLabel,
        target: t.title,
        user: t.assignee,
        detail: t.description,
        color: cfg.color,
      };
    });
    const commentEntries = collabComments.map(c => ({
      time: c.timestamp.slice(5, 16),
      action: "edit" as const,
      actionLabel: "评论",
      target: c.taskId ? `任务 ${c.taskId}` : `节点 ${c.nodeId}`,
      user: c.author,
      detail: c.content.slice(0, 50),
      color: S.text3,
    }));
    return [...taskEntries, ...commentEntries];
  }, [collabTasks, collabComments]);

  // ── 当前 diff ─────────────────────────────────────────────────────────
  const currentDiff = versionDiffs[toIdx] ?? null;

  // ── 快照对比切换 ────────────────────────────────────────────────────────
  const toggleSnapshot = (idx: number) => {
    if (!compareMode) return;
    setSelectedSnapshots(prev => {
      if (prev.includes(idx)) return prev.filter(i => i !== idx);
      if (prev.length >= 2) return [prev[1], idx];
      return [...prev, idx];
    });
  };

  // ── 对比数据 ───────────────────────────────────────────────────────────
  const compareData = useMemo(() => {
    if (selectedSnapshots.length !== 2) return null;
    const [a, b] = selectedSnapshots.sort((x, y) => x - y);
    const oldDiff = versionDiffs[a];
    const newDiff = versionDiffs[b];
    if (!oldDiff || !newDiff) return null;
    return { oldDiff, newDiff, oldSnap: snapshots[a], newSnap: snapshots[b] };
  }, [selectedSnapshots, versionDiffs, snapshots]);

  return (
    <div className="min-h-svh overflow-y-auto" style={{ background: S.bg }}>
      {/* ── Tab 导航 ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-4 pt-3">
        {activeBranch && (
          <div className="flex items-center gap-1 mr-2 px-2 py-1 rounded-lg" style={{ background: S.s2, border: `1px solid ${S.border}` }}>
            <GitBranch size={10} style={{ color: S.accent }} />
            <span className="text-[9px] font-bold" style={{ color: S.accent }}>{activeBranch.name}</span>
            <span className="text-[8px]" style={{ color: S.text3 }}>{activeBranch.snapshotCount} 快照</span>
          </div>
        )}
        {TABS.map((tab, i) => (
          <motion.button
            key={i}
            whileTap={{ scale: 0.95 }}
            onClick={() => { setActiveTab(i); setCompareMode(false); setSelectedSnapshots([]); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
            style={{
              background: activeTab === i ? S.primary : S.s2,
              color: activeTab === i ? "#fff" : S.text2,
              border: `1px solid ${activeTab === i ? S.primary : S.border}`,
            }}
          >
            <tab.icon size={13} />
            {tab.label}
          </motion.button>
        ))}
      </div>

      {/* ── 内容区 ──────────────────────────────────────────────────── */}
      <div className="p-3">
        <AnimatePresence mode="wait">

          {/* ── Tab 0: 版本差异 ─────────────────────────────────────── */}
          {activeTab === 0 && (
            <motion.div key="diff" {...fadeIn} className="space-y-3">
              {/* 版本选择器 */}
              <div className="flex items-center gap-2">
                <select
                  value={fromIdx}
                  onChange={e => setFromIdx(Number(e.target.value))}
                  className="flex-1 text-xs rounded-lg px-2 py-1.5 outline-none"
                  style={{ background: S.s2, border: `1px solid ${S.border}`, color: S.text }}
                >
                  {versionDiffs.map((d, i) => (
                    <option key={i} value={i}>{d.fromVersion} → {d.toVersion}</option>
                  ))}
                </select>
                <ArrowLeftRight size={14} style={{ color: S.text3, flexShrink: 0 }} />
                <select
                  value={toIdx}
                  onChange={e => setToIdx(Number(e.target.value))}
                  className="flex-1 text-xs rounded-lg px-2 py-1.5 outline-none"
                  style={{ background: S.s2, border: `1px solid ${S.border}`, color: S.text }}
                >
                  {versionDiffs.map((d, i) => (
                    <option key={i} value={i}>{d.fromVersion} → {d.toVersion}</option>
                  ))}
                </select>
              </div>

              {currentDiff && (
                <>
                  {/* 版本徽章 */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ background: S.warning10, color: S.warning }}>
                      {currentDiff.fromVersion}
                    </span>
                    <ChevronRight size={12} style={{ color: S.text3 }} />
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ background: S.success10, color: S.success }}>
                      {currentDiff.toVersion}
                    </span>
                  </div>

                  {/* Diff 指标卡片 */}
                  <div className="rounded-xl p-3 space-y-2.5"
                    style={{ background: S.card, border: `1px solid ${S.border}` }}>
                    {METRICS.map(m => {
                      const val = getMetric(currentDiff, m.key);
                      const maxVal = Math.max(
                        ...METRICS.map(mt => getMetric(currentDiff, mt.key)),
                        1
                      );
                      const pct = (val / maxVal) * 100;
                      return (
                        <div key={m.key} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium" style={{ color: S.text2 }}>{m.label}</span>
                            <span className="text-xs font-semibold" style={{ color: m.color }}>{val}</span>
                          </div>
                          <div className="h-4 rounded-full overflow-hidden" style={{ background: S.s2 }}>
                            <motion.div
                              className="h-full rounded-full flex items-center justify-end pr-1.5"
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.max(pct, 8)}%` }}
                              transition={{ duration: 0.5, ease: "easeOut" }}
                              style={{ background: `${m.color}22` }}
                            >
                              <span className="text-[9px] font-semibold" style={{ color: m.color }}>{val}</span>
                            </motion.div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* 摘要 */}
                  <div className="rounded-lg px-3 py-2 text-xs" style={{ background: S.s2, color: S.text2 }}>
                    {currentDiff.summary}
                  </div>
                </>
              )}
            </motion.div>
          )}

          {/* ── Tab 1: 版本快照 ─────────────────────────────────────── */}
          {activeTab === 1 && (
            <motion.div key="snap" {...fadeIn} className="space-y-3">
              {/* 操作栏 */}
              <div className="flex items-center gap-2">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    createSnapshot(
                      `快照 ${new Date().toLocaleString('zh-CN')}`,
                      'manual',
                      '手动创建的快照'
                    );
                    addToast({ type: "success", title: "快照已创建", message: "新版本快照已保存" });
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium"
                  style={{ background: S.primary, color: "#fff" }}
                >
                  <Plus size={12} />
                  新建快照
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { setCompareMode(!compareMode); setSelectedSnapshots([]); }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium"
                  style={{
                    background: compareMode ? S.primary10 : S.s2,
                    color: compareMode ? S.primary : S.text2,
                    border: `1px solid ${compareMode ? S.primary20 : S.border}`,
                  }}
                >
                  <GitCompareArrows size={12} />
                  {compareMode ? "退出对比" : "对比"}
                </motion.button>
              </div>

              {/* 快照列表 */}
              <div className="space-y-2">
                {snapshots.map((snap, i) => {
                  const cfg = STATUS_CFG[snap.status] ?? STATUS_CFG.published;
                  const isSelected = selectedSnapshots.includes(i);
                  return (
                    <motion.div
                      key={i}
                      whileTap={compareMode ? { scale: 0.98 } : undefined}
                      onClick={() => toggleSnapshot(i)}
                      className="rounded-xl p-3 cursor-pointer transition-all"
                      style={{
                        background: S.card,
                        border: `1.5px solid ${isSelected ? S.primary : S.border}`,
                        boxShadow: isSelected ? `0 0 0 2px ${S.primary20}` : "none",
                      }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold" style={{ color: S.text }}>{snap.version}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                            style={{ background: cfg.bg, color: cfg.color }}>
                            {cfg.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px]" style={{ color: S.text3 }}>
                          <Clock size={10} />
                          {snap.date}
                        </div>
                      </div>
                      <p className="text-xs mb-1.5" style={{ color: S.text2 }}>{snap.summary}</p>
                      <div className="flex items-center gap-1 text-[10px]" style={{ color: S.text3 }}>
                        <Layers size={10} />
                        {snap.changes} 项变更
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* 对比面板 */}
              <AnimatePresence>
                {compareMode && compareData && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="rounded-xl p-3 space-y-2"
                      style={{ background: S.card, border: `1px solid ${S.primary20}` }}>
                      <div className="text-xs font-semibold mb-2" style={{ color: S.primary }}>
                        版本对比: {compareData.oldDiff.fromVersion} → {compareData.newDiff.toVersion}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {/* 旧版本 */}
                        <div className="rounded-lg p-2" style={{ background: S.s2 }}>
                          <div className="text-[10px] font-medium mb-1.5" style={{ color: S.warning }}>
                            {compareData.oldSnap?.version} (旧)
                          </div>
                          {METRICS.map(m => {
                            const val = getMetric(compareData.oldDiff, m.key);
                            return (
                              <div key={m.key} className="flex justify-between text-[10px] py-0.5">
                                <span style={{ color: S.text3 }}>{m.label}</span>
                                <span style={{ color: m.color }}>{val}</span>
                              </div>
                            );
                          })}
                        </div>
                        {/* 新版本 */}
                        <div className="rounded-lg p-2" style={{ background: S.s2 }}>
                          <div className="text-[10px] font-medium mb-1.5" style={{ color: S.success }}>
                            {compareData.newSnap?.version} (新)
                          </div>
                          {METRICS.map(m => {
                            const val = getMetric(compareData.newDiff, m.key);
                            return (
                              <div key={m.key} className="flex justify-between text-[10px] py-0.5">
                                <span style={{ color: S.text3 }}>{m.label}</span>
                                <span style={{ color: m.color }}>{val}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      {/* 净变化 */}
                      <div className="rounded-lg p-2 mt-1" style={{ background: S.primary10 }}>
                        <div className="text-[10px] font-medium mb-1" style={{ color: S.primary }}>净变化</div>
                        <div className="flex flex-wrap gap-2">
                          {METRICS.map(m => {
                            const oldVal = getMetric(compareData.oldDiff, m.key);
                            const newVal = getMetric(compareData.newDiff, m.key);
                            const delta = newVal - oldVal;
                            return (
                              <span key={m.key} className="text-[10px]" style={{ color: delta >= 0 ? S.success : S.error }}>
                                {m.label}: {delta >= 0 ? "+" : ""}{delta}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* ── Tab 2: 变更记录 ─────────────────────────────────────── */}
          {activeTab === 2 && (
            <motion.div key="log" {...fadeIn} className="space-y-2">
              <div className="text-xs font-medium mb-1" style={{ color: S.text2 }}>
                共 {changeLog.length} 条记录
              </div>
              <div className="space-y-0 overflow-y-auto" style={{ maxHeight: "calc(100svh - 140px)" }}>
                {changeLog.map((entry, i) => {
                  const Icon = ACTION_ICONS[entry.action] ?? Pencil;
                  return (
                    <div key={i} className="flex gap-2.5 group">
                      {/* 时间列 */}
                      <div className="w-14 flex-shrink-0 pt-2.5 text-right">
                        <span className="text-[10px] font-mono" style={{ color: S.text3 }}>{entry.time}</span>
                      </div>
                      {/* 时间线 */}
                      <div className="flex flex-col items-center flex-shrink-0">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center mt-1.5"
                          style={{ background: `${entry.color}18` }}>
                          <Icon size={11} style={{ color: entry.color }} />
                        </div>
                        {i < changeLog.length - 1 && (
                          <div className="w-px flex-1 my-1" style={{ background: S.border }} />
                        )}
                      </div>
                      {/* 内容 */}
                      <div className="flex-1 pb-3 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                            style={{ background: `${entry.color}14`, color: entry.color }}>
                            {entry.actionLabel}
                          </span>
                          <span className="text-xs font-medium truncate" style={{ color: S.text }}>
                            {entry.target}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full"
                            style={{ background: S.s2, color: S.text3 }}>
                            {entry.user}
                          </span>
                        </div>
                        <p className="text-[11px] mt-1 leading-snug" style={{ color: S.text3 }}>
                          {entry.detail}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* ── Tab 3: 版本历史 ─────────────────────────────────────── */}
          {activeTab === 3 && (
            <motion.div key="history" {...fadeIn} className="space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <BookOpen size={14} style={{ color: S.primary }} />
                <span className="text-xs font-bold" style={{ color: S.text }}>版本历史</span>
                {vHistory.length > 0 && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: S.primary10, color: S.primary }}>
                    {vHistory.length} 条记录
                  </span>
                )}
              </div>

              {/* 版本时间线 */}
              {vHistory.length > 0 ? (
                <div className="space-y-2">
                  {vHistory.map((entry, i) => (
                    <div key={entry.snapshotId} className="flex gap-3 group">
                      {/* 时间线 */}
                      <div className="flex flex-col items-center flex-shrink-0">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center"
                          style={{ background: i === 0 ? S.success10 : S.primary10 }}>
                          {i === 0
                            ? <CheckCircle2 size={13} style={{ color: S.success }} />
                            : <Clock size={11} style={{ color: S.primary }} />}
                        </div>
                        {i < vHistory.length - 1 && (
                          <div className="w-px flex-1 my-1" style={{ background: S.border }} />
                        )}
                      </div>
                      {/* 内容 */}
                      <div className="flex-1 pb-3 min-w-0">
                        <div className="rounded-xl p-3" style={{ background: S.card, border: `1px solid ${S.border}` }}>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold" style={{ color: S.text }}>{entry.author}</span>
                              <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
                                style={{ background: S.primary10, color: S.primary }}>
                                {entry.typeLabel}
                              </span>
                            </div>
                            <span className="text-[9px] font-mono" style={{ color: S.text3 }}>
                              {new Date(entry.timestamp).toLocaleDateString('zh-CN')}
                            </span>
                          </div>
                          <p className="text-[10px] leading-relaxed" style={{ color: S.text2 }}>{entry.summary}</p>
                          <div className="flex items-center gap-1.5 mt-1.5 text-[9px]" style={{ color: S.text3 }}>
                            <Layers size={9} />
                            {entry.changeCount} 项变更
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : snapshots.length > 0 ? (
                <div className="space-y-2">
                  {snapshots.map((snap, i) => {
                    const cfg = STATUS_CFG[snap.status] ?? STATUS_CFG.published;
                    return (
                      <div key={i} className="flex gap-3 group">
                        {/* 时间线 */}
                        <div className="flex flex-col items-center flex-shrink-0">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center"
                            style={{ background: cfg.bg }}>
                            {i === snapshots.length - 1
                              ? <CheckCircle2 size={13} style={{ color: cfg.color }} />
                              : <Clock size={11} style={{ color: cfg.color }} />}
                          </div>
                          {i < snapshots.length - 1 && (
                            <div className="w-px flex-1 my-1" style={{ background: S.border }} />
                          )}
                        </div>
                        {/* 内容 */}
                        <div className="flex-1 pb-3 min-w-0">
                          <div className="rounded-xl p-3" style={{ background: S.card, border: `1px solid ${S.border}` }}>
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold" style={{ color: S.text }}>{snap.version}</span>
                                <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
                                  style={{ background: cfg.bg, color: cfg.color }}>
                                  {cfg.label}
                                </span>
                              </div>
                              <span className="text-[9px] font-mono" style={{ color: S.text3 }}>{snap.date}</span>
                            </div>
                            <p className="text-[10px] leading-relaxed" style={{ color: S.text2 }}>{snap.summary}</p>
                            <div className="flex items-center gap-1.5 mt-1.5 text-[9px]" style={{ color: S.text3 }}>
                              <Layers size={9} />
                              {snap.changes} 项变更
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 rounded-xl"
                  style={{ background: S.s2, border: `1px dashed ${S.border}` }}>
                  <Sparkles size={20} style={{ color: S.text3, marginBottom: 8 }} />
                  <span className="text-[11px] font-bold" style={{ color: S.text3 }}>即将上线</span>
                  <span className="text-[9px] mt-1" style={{ color: S.text3 }}>
                    版本历史功能正在开发中，敬请期待
                  </span>
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
