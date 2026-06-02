"use client";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, AlertTriangle, Copy, ExternalLink,
  ChevronDown, ChevronRight, Camera, GitCompareArrows,
  Clock, User, Plus, Minus, Pencil, Trash2, Rocket,
  History, ArrowLeftRight, X, Layers,
} from "lucide-react";

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

// ── 发布检查（本地定义，不导入 studio-data）────────────────────────────────
const QUALITY_CHECKS = [
  { id: "qc01", label: "主线连通", ok: true },
  { id: "qc02", label: "所有结局可达", ok: true },
  { id: "qc03", label: "无孤立节点", ok: true },
  { id: "qc04", label: "无死路", ok: true },
  { id: "qc05", label: "选择有意义", ok: true },
  { id: "qc06", label: "分支不过短", ok: true },
  { id: "qc07", label: "失败反馈完整", ok: false },
  { id: "qc08", label: "BGM 覆盖", ok: false },
  { id: "qc09", label: "场景图片覆盖", ok: false },
  { id: "qc10", label: "试玩已通过", ok: false },
];

// ── 版本快照数据 ─────────────────────────────────────────────────────────
const SNAPSHOTS = [
  { version: "v1.2.3", date: "2026-06-02 14:30", summary: "修复 N07 潜行判定失败反馈文案", status: "current" as const, changes: 3 },
  { version: "v1.2.2", date: "2026-06-01 10:15", summary: "添加 QTE 节点 UI 模板配置", status: "published" as const, changes: 7 },
  { version: "v1.2.1", date: "2026-05-30 16:45", summary: "更新角色立绘和场景背景图", status: "published" as const, changes: 12 },
  { version: "v1.2.0", date: "2026-05-28 09:00", summary: "新增分支路线 B（暴露路线）", status: "published" as const, changes: 24 },
];

// ── 变更记录数据 ─────────────────────────────────────────────────────────
const CHANGE_LOG = [
  { time: "14:32", user: "你", action: "edit", actionLabel: "编辑", target: "N07 潜行判定", detail: "补充失败反馈文案", color: "#5E50E8" },
  { time: "14:20", user: "你", action: "edit", actionLabel: "编辑", target: "N06 警卫逼近", detail: "调整 QTE 时间限制 2s→1.5s", color: "#5E50E8" },
  { time: "13:55", user: "AI助手", action: "add", actionLabel: "新增", target: "N05 换装渗透", detail: "AI 生成场景描述", color: "#00A99D" },
  { time: "13:40", user: "你", action: "edit", actionLabel: "编辑", target: "变量系统", detail: "修改潜行值初始值 50→55", color: "#5E50E8" },
  { time: "11:15", user: "你", action: "add", actionLabel: "新增", target: "N10 结局A", detail: "添加好结局文案", color: "#00A99D" },
  { time: "10:30", user: "AI助手", action: "add", actionLabel: "新增", target: "角色设定", detail: "AI 提取反派主管角色卡", color: "#00A99D" },
  { time: "09:45", user: "你", action: "publish", actionLabel: "发布", target: "H5 链接", detail: "更新发布版本 v1.2.2", color: "#059669" },
  { time: "09:00", user: "系统", action: "delete", actionLabel: "删除", target: "废弃节点 N12", detail: "清理未连接的孤立节点", color: "#DC2626" },
];

// ── 快照状态配置 ─────────────────────────────────────────────────────────
const STATUS_CFG: Record<string, { label: string; bg: string; color: string }> = {
  current:   { label: "当前", bg: `${S.primary}12`, color: S.primary },
  published: { label: "已发布", bg: `${S.success}12`, color: S.success },
  draft:     { label: "草稿", bg: `${S.warning}12`, color: S.warning },
};

// ── 操作类型图标 ─────────────────────────────────────────────────────────
const ACTION_ICONS: Record<string, typeof Pencil> = {
  edit: Pencil,
  add: Plus,
  delete: Trash2,
  publish: Rocket,
};

// ── 展开/收起 Hook ───────────────────────────────────────────────────────
function useSectionToggle(init = true) {
  const [open, setOpen] = useState(init);
  return { open, toggle: () => setOpen((o) => !o) };
}

// ── 区块标题组件 ─────────────────────────────────────────────────────────
function SectionHeader({ icon: Icon, title, subtitle, open, onToggle, action }: {
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  title: string; subtitle?: string; open: boolean; onToggle: () => void;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <button onClick={onToggle} className="flex items-center gap-2 focus:outline-none">
        <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: S.primary10 }}>
          <Icon size={13} style={{ color: S.primary }} />
        </div>
        <div>
          <h3 className="text-xs font-bold" style={{ color: S.text }}>{title}</h3>
          {subtitle && <p className="text-[9px]" style={{ color: S.text3 }}>{subtitle}</p>}
        </div>
        <motion.div animate={{ rotate: open ? 0 : -90 }} transition={{ duration: 0.15 }}>
          <ChevronDown size={12} style={{ color: S.text3 }} />
        </motion.div>
      </button>
      {action}
    </div>
  );
}

// ── 主页面 ────────────────────────────────────────────────────────────────
export default function PublishScreen() {
  const [copied, setCopied] = useState(false);
  const url = "https://play.zhuomeng.ai/ghost-protocol-v1";
  const pass = QUALITY_CHECKS.filter((c) => c.ok).length;

  // 区块折叠状态
  const secStatus = useSectionToggle(true);
  const secChecks = useSectionToggle(true);
  const secSnapshots = useSectionToggle(true);
  const secChangelog = useSectionToggle(true);
  const secSettings = useSectionToggle(true);

  // 快照对比状态
  const [compareMode, setCompareMode] = useState(false);
  const [selectedSnapshots, setSelectedSnapshots] = useState<string[]>([]);

  // 快照创建提示
  const [snapshotToast, setSnapshotToast] = useState(false);

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleSnapshotSelect = (version: string) => {
    setSelectedSnapshots((prev) => {
      if (prev.includes(version)) return prev.filter((v) => v !== version);
      if (prev.length >= 2) return [prev[1], version];
      return [...prev, version];
    });
  };

  const exitCompareMode = () => {
    setCompareMode(false);
    setSelectedSnapshots([]);
  };

  const handleCreateSnapshot = () => {
    setSnapshotToast(true);
    setTimeout(() => setSnapshotToast(false), 2500);
  };

  // 快照对比数据
  const comparePair = useMemo(() => {
    if (selectedSnapshots.length !== 2) return null;
    const a = SNAPSHOTS.find((s) => s.version === selectedSnapshots[0]);
    const b = SNAPSHOTS.find((s) => s.version === selectedSnapshots[1]);
    if (!a || !b) return null;
    // 确保 a 是较新版本
    return a.changes <= b.changes ? { newer: b, older: a } : { newer: a, older: b };
  }, [selectedSnapshots]);

  return (
    <div className="min-h-svh overflow-y-auto" style={{ background: S.bg }}>

      {/* ── Toast 通知 ── */}
      <AnimatePresence>
        {snapshotToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl text-xs font-bold text-white"
            style={{ background: S.primary, boxShadow: `0 4px 16px ${S.primary}40` }}
          >
            快照 v1.2.4 已创建
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-4 space-y-4">

        {/* ── 发布状态卡片 ── */}
        <div className="rounded-xl p-4" style={{ background: S.card, border: `1px solid ${S.border}` }}>
          <SectionHeader
            icon={ExternalLink}
            title="发布状态"
            open={secStatus.open}
            onToggle={secStatus.toggle}
            action={
              <span className="text-[9px] font-bold px-2 py-0.5 rounded"
                style={{ background: `${S.success}12`, color: S.success }}>
                已发布
              </span>
            }
          />
          <AnimatePresence>
            {secStatus.open && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="flex items-center gap-2 p-2.5 rounded-lg mt-3" style={{ background: S.s2 }}>
                  <ExternalLink size={12} style={{ color: S.accent }} />
                  <span className="text-[10px] font-mono flex-1 truncate" style={{ color: S.text2 }}>{url}</span>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={handleCopy}
                    className="text-[9px] font-bold px-2 py-1 rounded focus:outline-none"
                    style={{
                      background: copied ? `${S.success}15` : `${S.primary}12`,
                      color: copied ? S.success : S.primary,
                    }}
                  >
                    {copied ? "已复制" : <><Copy size={9} className="inline mr-0.5" />复制</>}
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── 发布检查卡片 ── */}
        <div className="rounded-xl p-4" style={{ background: S.card, border: `1px solid ${S.border}` }}>
          <SectionHeader
            icon={CheckCircle2}
            title="发布检查"
            subtitle={`${pass}/${QUALITY_CHECKS.length} 项通过`}
            open={secChecks.open}
            onToggle={secChecks.toggle}
            action={
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-12 rounded-full overflow-hidden" style={{ background: S.s3 }}>
                  <div className="h-full rounded-full" style={{
                    width: `${Math.round((pass / QUALITY_CHECKS.length) * 100)}%`,
                    background: pass === QUALITY_CHECKS.length ? S.success : S.warning,
                  }} />
                </div>
                <span className="text-[9px] font-mono font-bold" style={{
                  color: pass === QUALITY_CHECKS.length ? S.success : S.warning,
                }}>
                  {Math.round((pass / QUALITY_CHECKS.length) * 100)}%
                </span>
              </div>
            }
          />
          <AnimatePresence>
            {secChecks.open && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="space-y-1.5 mt-3">
                  {QUALITY_CHECKS.map((c) => (
                    <div key={c.id} className="flex items-center gap-2">
                      {c.ok
                        ? <CheckCircle2 size={13} color={S.success} className="shrink-0" />
                        : <AlertTriangle size={13} color={S.warning} className="shrink-0" />}
                      <span className="text-[10px]" style={{ color: c.ok ? S.text2 : S.warning }}>{c.label}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── 版本快照卡片 ── */}
        <div className="rounded-xl p-4" style={{ background: S.card, border: `1px solid ${S.border}` }}>
          <SectionHeader
            icon={Camera}
            title="版本快照"
            subtitle={`当前 ${SNAPSHOTS[0].version} · ${SNAPSHOTS.length} 个版本`}
            open={secSnapshots.open}
            onToggle={secSnapshots.toggle}
            action={
              <div className="flex items-center gap-1.5">
                {compareMode ? (
                  <>
                    <span className="text-[9px]" style={{ color: S.text3 }}>
                      已选 {selectedSnapshots.length}/2
                    </span>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={exitCompareMode}
                      className="text-[9px] font-bold px-2 py-1 rounded focus:outline-none"
                      style={{ background: `${S.error}12`, color: S.error }}
                    >
                      取消
                    </motion.button>
                  </>
                ) : (
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setCompareMode(true)}
                    className="flex items-center gap-1 text-[9px] font-bold px-2 py-1 rounded focus:outline-none"
                    style={{ background: `${S.accent}12`, color: S.accent }}
                  >
                    <GitCompareArrows size={10} /> 对比
                  </motion.button>
                )}
              </div>
            }
          />
          <AnimatePresence>
            {secSnapshots.open && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="space-y-2 mt-3">
                  {SNAPSHOTS.map((snap) => {
                    const cfg = STATUS_CFG[snap.status];
                    const isSelected = selectedSnapshots.includes(snap.version);
                    return (
                      <motion.button
                        key={snap.version}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          if (compareMode) toggleSnapshotSelect(snap.version);
                        }}
                        className="w-full text-left p-3 rounded-xl focus:outline-none"
                        style={{
                          background: isSelected ? `${S.accent}08` : S.s2,
                          border: `1px solid ${isSelected ? S.accent : S.border}`,
                          cursor: compareMode ? "pointer" : "default",
                        }}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            {compareMode && (
                              <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                                style={{
                                  background: isSelected ? S.accent : S.s3,
                                  border: `1.5px solid ${isSelected ? S.accent : S.border2}`,
                                }}>
                                {isSelected && <CheckCircle2 size={10} color="#fff" />}
                              </div>
                            )}
                            <span className="text-[11px] font-bold font-mono" style={{ color: S.text }}>
                              {snap.version}
                            </span>
                            <span className="text-[8px] font-bold px-1.5 py-0.5 rounded"
                              style={{ background: cfg.bg, color: cfg.color }}>
                              {cfg.label}
                            </span>
                          </div>
                          <span className="text-[9px] font-mono" style={{ color: S.text3 }}>{snap.date}</span>
                        </div>
                        <p className="text-[10px]" style={{ color: S.text2 }}>{snap.summary}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Layers size={9} style={{ color: S.text3 }} />
                          <span className="text-[8px]" style={{ color: S.text3 }}>{snap.changes} 项变更</span>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>

                {/* 快照对比面板 */}
                <AnimatePresence>
                  {compareMode && comparePair && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-3 p-3 rounded-xl" style={{ background: S.s2, border: `1px solid ${S.accent}30` }}>
                        <div className="flex items-center gap-2 mb-3">
                          <ArrowLeftRight size={12} style={{ color: S.accent }} />
                          <span className="text-[10px] font-bold" style={{ color: S.text }}>
                            版本对比
                          </span>
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                            style={{ background: `${S.accent}12`, color: S.accent }}>
                            {comparePair.older.version} → {comparePair.newer.version}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {/* 旧版本 */}
                          <div className="p-2.5 rounded-lg" style={{ background: S.card, border: `1px solid ${S.border}` }}>
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <span className="text-[10px] font-bold font-mono" style={{ color: S.text3 }}>
                                {comparePair.older.version}
                              </span>
                              <span className="text-[8px] px-1 py-0.5 rounded"
                                style={{ background: `${S.text3}15`, color: S.text3 }}>
                                旧
                              </span>
                            </div>
                            <p className="text-[9px] mb-1" style={{ color: S.text2 }}>{comparePair.older.summary}</p>
                            <div className="flex items-center gap-1">
                              <Clock size={8} style={{ color: S.text3 }} />
                              <span className="text-[8px]" style={{ color: S.text3 }}>{comparePair.older.date}</span>
                            </div>
                            <div className="flex items-center gap-1 mt-1">
                              <Minus size={8} style={{ color: S.error }} />
                              <span className="text-[8px]" style={{ color: S.text3 }}>{comparePair.older.changes} 项变更</span>
                            </div>
                          </div>
                          {/* 新版本 */}
                          <div className="p-2.5 rounded-lg" style={{ background: S.card, border: `1px solid ${S.accent}30` }}>
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <span className="text-[10px] font-bold font-mono" style={{ color: S.text }}>
                                {comparePair.newer.version}
                              </span>
                              <span className="text-[8px] px-1 py-0.5 rounded"
                                style={{ background: `${S.accent}12`, color: S.accent }}>
                                新
                              </span>
                            </div>
                            <p className="text-[9px] mb-1" style={{ color: S.text2 }}>{comparePair.newer.summary}</p>
                            <div className="flex items-center gap-1">
                              <Clock size={8} style={{ color: S.text3 }} />
                              <span className="text-[8px]" style={{ color: S.text3 }}>{comparePair.newer.date}</span>
                            </div>
                            <div className="flex items-center gap-1 mt-1">
                              <Plus size={8} style={{ color: S.success }} />
                              <span className="text-[8px]" style={{ color: S.text3 }}>{comparePair.newer.changes} 项变更</span>
                            </div>
                          </div>
                        </div>
                        {/* 差异摘要 */}
                        <div className="mt-2 p-2 rounded-lg" style={{ background: `${S.accent}06`, border: `1px solid ${S.accent}15` }}>
                          <p className="text-[9px]" style={{ color: S.text2 }}>
                            净增 <span className="font-bold font-mono" style={{ color: S.accent }}>
                              {Math.abs(comparePair.newer.changes - comparePair.older.changes)}
                            </span> 项变更 · 从「{comparePair.older.summary}」到「{comparePair.newer.summary}」
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {compareMode && selectedSnapshots.length < 2 && (
                  <p className="text-[9px] text-center mt-2" style={{ color: S.text3 }}>
                    请选择两个版本进行对比
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── 变更记录卡片 ── */}
        <div className="rounded-xl p-4" style={{ background: S.card, border: `1px solid ${S.border}` }}>
          <SectionHeader
            icon={History}
            title="变更记录"
            subtitle={`今日 ${CHANGE_LOG.length} 条编辑`}
            open={secChangelog.open}
            onToggle={secChangelog.toggle}
          />
          <AnimatePresence>
            {secChangelog.open && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="space-y-1 mt-3">
                  {CHANGE_LOG.map((log, i) => {
                    const ActionIcon = ACTION_ICONS[log.action] ?? Pencil;
                    return (
                      <div key={i} className="flex items-start gap-2.5 py-2 border-b last:border-0"
                        style={{ borderColor: S.border }}>
                        {/* 时间 */}
                        <div className="shrink-0 w-10 text-right pt-0.5">
                          <span className="text-[9px] font-mono" style={{ color: S.text3 }}>{log.time}</span>
                        </div>
                        {/* 时间线圆点 */}
                        <div className="flex flex-col items-center shrink-0 pt-0.5">
                          <div className="w-5 h-5 rounded-full flex items-center justify-center"
                            style={{ background: `${log.color}12` }}>
                            <ActionIcon size={10} style={{ color: log.color }} />
                          </div>
                        </div>
                        {/* 内容 */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                            <span className="text-[8px] font-bold px-1.5 py-0.5 rounded"
                              style={{ background: `${log.color}12`, color: log.color }}>
                              {log.actionLabel}
                            </span>
                            <span className="text-[10px] font-bold truncate" style={{ color: S.text }}>
                              {log.target}
                            </span>
                            <span className="text-[8px] px-1 py-0.5 rounded shrink-0"
                              style={{ background: S.s2, color: S.text3 }}>
                              {log.user}
                            </span>
                          </div>
                          <p className="text-[9px]" style={{ color: S.text3 }}>{log.detail}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── 发布设置卡片 ── */}
        <div className="rounded-xl p-4" style={{ background: S.card, border: `1px solid ${S.border}` }}>
          <SectionHeader
            icon={Layers}
            title="发布设置"
            open={secSettings.open}
            onToggle={secSettings.toggle}
          />
          <AnimatePresence>
            {secSettings.open && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="space-y-2 mt-3">
                  {([
                    ["作品类型", "互动 H5"],
                    ["画幅", "移动端竖屏 9:16"],
                    ["分享标题", "幽灵协议"],
                    ["付费模式", "免费试玩"],
                  ] as const).map(([k, v]) => (
                    <div key={k} className="flex justify-between py-1.5 border-b last:border-0"
                      style={{ borderColor: S.border }}>
                      <span className="text-[10px]" style={{ color: S.text3 }}>{k}</span>
                      <span className="text-[10px] font-medium" style={{ color: S.text }}>{v}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── 操作按钮网格 ── */}
        <div className="grid grid-cols-2 gap-2">
          <motion.button
            whileTap={{ scale: 0.97 }}
            className="py-2.5 rounded-xl text-xs font-bold text-white focus:outline-none"
            style={{ background: `linear-gradient(135deg,${S.primary},#7B6EF5)` }}
          >
            <Rocket size={12} className="inline mr-1" style={{ verticalAlign: "-1px" }} />
            更新发布
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleCreateSnapshot}
            className="py-2.5 rounded-xl text-xs font-bold focus:outline-none"
            style={{ background: `${S.accent}12`, border: `1px solid ${S.accent}30`, color: S.accent }}
          >
            <Camera size={12} className="inline mr-1" style={{ verticalAlign: "-1px" }} />
            创建快照
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            className="py-2.5 rounded-xl text-xs font-bold focus:outline-none"
            style={{ background: S.s2, border: `1px solid ${S.border}`, color: S.text2 }}
          >
            <Layers size={12} className="inline mr-1" style={{ verticalAlign: "-1px" }} />
            导出 JSON
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            className="py-2.5 rounded-xl text-xs font-bold focus:outline-none"
            style={{ background: S.s2, border: `1px solid ${S.border}`, color: S.text2 }}
          >
            <Copy size={12} className="inline mr-1" style={{ verticalAlign: "-1px" }} />
            复制分享链接
          </motion.button>
        </div>

        {/* 底部留白 */}
        <div className="h-4" />
      </div>
    </div>
  );
}
