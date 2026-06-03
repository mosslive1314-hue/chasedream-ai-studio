"use client";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, AlertTriangle, Copy, ExternalLink,
  ChevronRight, Camera, GitCompareArrows,
  Clock, Plus, Minus, Pencil, Rocket,
  History, ArrowLeftRight, Layers, Download,
  Upload, Globe, Package, GitBranch,
} from "lucide-react";
import { useNarrativeStore, useUIStore, useProjectStore } from "@/store";

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

// ── 快照状态配置 ─────────────────────────────────────────────────────────
const STATUS_CFG: Record<string, { label: string; bg: string; color: string }> = {
  current:   { label: "当前", bg: `${S.primary}12`, color: S.primary },
  published: { label: "已发布", bg: `${S.success}12`, color: S.success },
  draft:     { label: "草稿", bg: `${S.warning}12`, color: S.warning },
};

// ── 多端导出格式 ─────────────────────────────────────────────────────────
const EXPORT_FORMATS = [
  {
    id: 'webgal',
    name: 'WebGAL 脚本',
    icon: '\u{1F3AE}',
    description: '导出为 WebGAL 引擎可执行的脚本格式，支持在 WebGAL 平台上运行。',
    status: 'ready',
    estimatedSize: '2.4 MB',
    features: ['场景脚本', '对白系统', '选择分支', '变量条件', 'BGM/音效指令'],
  },
  {
    id: 'renpy',
    name: "Ren'Py 脚本",
    icon: '\u{1F40D}',
    description: "导出为 Ren'Py 引擎的 .rpy 格式，适用于 Python 生态的视觉小说开发。",
    status: 'ready',
    estimatedSize: '1.8 MB',
    features: ['Label 结构', 'Menu 选择', '条件跳转', '变量系统', '资源引用'],
  },
  {
    id: 'json',
    name: '自定义 JSON',
    icon: '\u{1F4CB}',
    description: '导出为结构化 JSON，包含完整的节点图、变量、资产引用等所有数据。',
    status: 'ready',
    estimatedSize: '856 KB',
    features: ['完整节点图', '变量定义', '资产清单', '叙事意图', '质检结果'],
  },
  {
    id: 'h5-package',
    name: '互动 H5 包',
    icon: '\u{1F4E6}',
    description: '打包为独立的 H5 应用，可直接部署到服务器或 CDN，玩家通过链接访问。',
    status: 'ready',
    estimatedSize: '12.6 MB',
    features: ['运行时引擎', '场景渲染器', '选择系统', '存档/读档', '资产打包'],
  },
  {
    id: 'ink',
    name: 'Inkle Ink 格式',
    icon: '\u{1F58A}\uFE0F',
    description: '导出为 Ink 互动小说格式，适用于 Unity 集成和文本冒险游戏。',
    status: 'beta',
    estimatedSize: '420 KB',
    features: ['Knot 结构', 'Stitch 子场景', '变量', '条件', 'Choice 选择'],
  },
  {
    id: 'pdf-script',
    name: 'PDF 剧本',
    icon: '\u{1F4C4}',
    description: '导出为格式化的 PDF 剧本文档，包含所有分支路径和注释，适合团队审阅。',
    status: 'ready',
    estimatedSize: '3.2 MB',
    features: ['分幕排版', '对白格式', '分支标注', '变量说明', '导演注释'],
  },
];

// ── 行业发布格式 ─────────────────────────────────────────────────────────
const INDUSTRY_TABS = ['游戏', '文旅', '教育', '衍生'];
const INDUSTRY_FORMATS: Record<string, { id: string; name: string; description: string; status: string; estimatedSize: string }[]> = {
  '游戏': [
    { id: 'game-webgal', name: 'WebGAL', description: '导出为 WebGAL 引擎脚本，支持 Web 平台运行', status: 'ready', estimatedSize: '2.4 MB' },
    { id: 'game-h5', name: 'H5 包', description: '打包为独立 H5 应用，可通过链接直接访问', status: 'ready', estimatedSize: '12.6 MB' },
    { id: 'game-json', name: 'JSON', description: '导出完整结构化 JSON 数据，便于二次开发', status: 'ready', estimatedSize: '856 KB' },
    { id: 'game-engine', name: '引擎导出', description: '导出至 Unity/Godot 等游戏引擎', status: 'beta', estimatedSize: '18.5 MB' },
  ],
  '文旅': [
    { id: 'tour-h5', name: 'H5 导览版', description: '适配移动端导览场景，支持 GPS 定位触发', status: 'ready', estimatedSize: '8.2 MB' },
    { id: 'tour-wechat', name: '微信小程序包', description: '打包为微信小程序，支持馆内扫码体验', status: 'ready', estimatedSize: '6.5 MB' },
    { id: 'tour-screen', name: '馆内屏幕版', description: '适配大屏触控交互，用于展厅固定设备', status: 'beta', estimatedSize: '15.3 MB' },
    { id: 'tour-ar', name: 'AR 标记版', description: '基于 AR 标记触发的增强现实互动体验', status: 'alpha', estimatedSize: '22.1 MB' },
    { id: 'tour-offline', name: '离线导览版', description: '支持离线运行的导览包，适用于无网络环境', status: 'ready', estimatedSize: '35.8 MB' },
  ],
  '教育': [
    { id: 'edu-classroom', name: '课堂演示包', description: '适配课堂投屏场景，教师控制进度', status: 'ready', estimatedSize: '5.4 MB' },
    { id: 'edu-scorm', name: 'SCORM 课件', description: '符合 SCORM 2004 标准，可导入主流 LMS', status: 'ready', estimatedSize: '7.8 MB' },
    { id: 'edu-lti', name: 'LTI 集成', description: '支持 LTI 1.3 协议，无缝对接学习平台', status: 'beta', estimatedSize: '1.2 MB' },
    { id: 'edu-report', name: '学习报告模板', description: '导出学习进度报告模板，支持数据分析', status: 'ready', estimatedSize: '320 KB' },
    { id: 'edu-selfstudy', name: '自学链接', description: '生成独立学习链接，学生自主完成互动课程', status: 'ready', estimatedSize: '4.6 MB' },
  ],
  '衍生': [
    { id: 'spin-player', name: '互动短剧播放器', description: '独立播放器应用，支持多平台分发', status: 'ready', estimatedSize: '9.8 MB' },
    { id: 'spin-h5', name: 'H5 互动播放', description: '轻量级 H5 互动播放页面，适合社交传播', status: 'ready', estimatedSize: '6.2 MB' },
    { id: 'spin-iframe', name: '平台嵌入 iframe', description: '生成可嵌入的 iframe 代码，适配第三方平台', status: 'ready', estimatedSize: '0.8 MB' },
    { id: 'spin-social', name: '社交媒体短版', description: '精简为 60 秒互动短片，适配短视频平台', status: 'beta', estimatedSize: '3.5 MB' },
    { id: 'spin-live', name: '互动直播版', description: '支持直播间互动投票和分支选择', status: 'alpha', estimatedSize: '11.2 MB' },
  ],
};

// ── 操作类型图标 ─────────────────────────────────────────────────────────
const ACTION_ICONS: Record<string, typeof Pencil> = {
  edit: Pencil,
  add: Plus,
  delete: Minus,
  publish: Rocket,
};

// ── 主页面 ────────────────────────────────────────────────────────────────
export default function PublishScreen() {
  // ── Store selectors ──
  const projectName = useProjectStore(s => s.currentProject()?.title) || "当前项目";
  const qualityChecks = useNarrativeStore(s => s.qualityChecks);
  const engineExportConfigs = useNarrativeStore(s => s.engineExportConfigs);
  const collabTasks = useNarrativeStore(s => s.collabTasks);
  const collabComments = useNarrativeStore(s => s.collabComments);
  const versionDiffs = useNarrativeStore(s => s.versionDiffs);
  const addToast = useUIStore(s => s.addToast);

  // ── Tab 状态 ──
  const [activeTab, setActiveTab] = useState(0);

  // ── 通用状态 ──
  const [copied, setCopied] = useState(false);
  const url = "https://play.zhuomeng.ai/ghost-protocol-v1";
  const pass = qualityChecks.filter((c) => c.status === 'ok').length;

  // ── 导出状态 ──
  const [exportStates, setExportStates] = useState<Record<string, { status: 'idle' | 'exporting' | 'done' }>>({});
  const [engineExportStates, setEngineExportStates] = useState<Record<string, { status: 'idle' | 'exporting' | 'done' }>>({});
  const [industryTab, setIndustryTab] = useState(0);

  // ── 快照状态 ──
  const [compareMode, setCompareMode] = useState(false);
  const [selectedSnapshots, setSelectedSnapshots] = useState<string[]>([]);
  const [snapshotToast, setSnapshotToast] = useState(false);

  // ── Handlers ──
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

  const handleExport = (formatId: string) => {
    setExportStates((prev) => ({ ...prev, [formatId]: { status: 'exporting' } }));
    setTimeout(() => {
      setExportStates((prev) => ({ ...prev, [formatId]: { status: 'done' } }));
      addToast({ type: 'success', title: '导出完成', message: `已成功导出 ${formatId} 格式` });
    }, 2000);
  };

  const handleEngineExport = (engineId: string) => {
    setEngineExportStates((prev) => ({ ...prev, [engineId]: { status: 'exporting' } }));
    setTimeout(() => {
      setEngineExportStates((prev) => ({ ...prev, [engineId]: { status: 'done' } }));
      addToast({ type: 'success', title: '引擎导出完成', message: `已成功导出 ${engineId} 引擎格式` });
    }, 2500);
  };

  // ── 动态数据：版本快照（from versionDiffs）──
  const snapshots = useMemo(() => {
    if (versionDiffs.length === 0) return [];
    const now = new Date();
    return versionDiffs.map((d, i) => ({
      version: d.toVersion,
      status: i === versionDiffs.length - 1 ? 'current' as const : 'published' as const,
      date: `${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate() - (versionDiffs.length - 1 - i)).padStart(2, '0')}`,
      changes: d.nodesAdded + d.nodesModified + d.nodesRemoved + d.variablesChanged + d.assetsUpdated + d.scriptChanges,
      summary: d.summary,
    }));
  }, [versionDiffs]);

  // ── 动态数据：变更记录（from collabTasks + collabComments）──
  const changeLog = useMemo(() => {
    const taskActionMap: Record<string, { action: string; actionLabel: string; color: string }> = {
      '节点编辑': { action: 'edit', actionLabel: '编辑', color: S.primary },
      '资产制作': { action: 'add', actionLabel: '新增', color: S.accent },
      '剧本编写': { action: 'edit', actionLabel: '编写', color: S.primary },
      '质检修复': { action: 'edit', actionLabel: '修复', color: S.warning },
      'UI设计':   { action: 'edit', actionLabel: '设计', color: S.primary },
      '互动设计': { action: 'edit', actionLabel: '设计', color: S.accent },
    };
    const taskEntries = collabTasks.map(t => {
      const cfg = taskActionMap[t.category] ?? { action: 'edit', actionLabel: '编辑', color: S.text2 };
      return {
        time: t.dueDate ? t.dueDate.slice(5) : '—',
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
      action: 'edit' as const,
      actionLabel: '评论',
      target: c.taskId ? `任务 ${c.taskId}` : `节点 ${c.nodeId}`,
      user: c.author,
      detail: c.content.slice(0, 50),
      color: S.text3,
    }));
    return [...taskEntries, ...commentEntries];
  }, [collabTasks, collabComments]);

  // ── 快照对比数据 ──
  const comparePair = useMemo(() => {
    if (selectedSnapshots.length !== 2) return null;
    const a = snapshots.find((s) => s.version === selectedSnapshots[0]);
    const b = snapshots.find((s) => s.version === selectedSnapshots[1]);
    if (!a || !b) return null;
    return a.changes <= b.changes ? { newer: b, older: a } : { newer: a, older: b };
  }, [selectedSnapshots, snapshots]);

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

      {/* ── Tab Bar ── */}
      <div className="flex items-center gap-2 px-4 pt-3">
        {[
          { label: "发布状态", icon: Rocket },
          { label: "导出配置", icon: Package },
          { label: "快照与记录", icon: GitBranch },
        ].map((tab, i) => {
          const TabIcon = tab.icon;
          return (
            <motion.button key={i} whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab(i)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all focus:outline-none"
              style={{
                background: activeTab === i ? S.primary : S.s2,
                color: activeTab === i ? "#fff" : S.text2,
                border: `1px solid ${activeTab === i ? S.primary : S.border}`,
                boxShadow: activeTab === i ? `0 2px 8px ${S.primary}30` : "none",
              }}>
              <TabIcon size={12} />
              <span>{tab.label}</span>
            </motion.button>
          );
        })}
      </div>

      <div className="p-3">

        {/* ════════════════════════════════════════════════════════════════
            TAB 0: 发布状态
           ════════════════════════════════════════════════════════════════ */}
        {activeTab === 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">

            {/* ── 发布状态卡片 ── */}
            <div className="rounded-xl p-3" style={{ background: S.card, border: `1px solid ${S.border}` }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: S.primary10 }}>
                    <ExternalLink size={13} style={{ color: S.primary }} />
                  </div>
                  <h3 className="text-xs font-bold" style={{ color: S.text }}>发布状态</h3>
                </div>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded"
                  style={{ background: `${S.success}12`, color: S.success }}>
                  已发布
                </span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-lg" style={{ background: S.s2 }}>
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
              <motion.button
                whileTap={{ scale: 0.97 }}
                className="w-full mt-2 py-2 rounded-lg text-xs font-bold text-white focus:outline-none"
                style={{ background: `linear-gradient(135deg,${S.primary},#7B6EF5)` }}
              >
                <Rocket size={12} className="inline mr-1" style={{ verticalAlign: "-1px" }} />
                更新发布
              </motion.button>
            </div>

            {/* ── 发布检查清单 ── */}
            <div className="rounded-xl p-3" style={{ background: S.card, border: `1px solid ${S.border}` }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: S.primary10 }}>
                    <CheckCircle2 size={13} style={{ color: S.primary }} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold" style={{ color: S.text }}>发布检查</h3>
                    <p className="text-[9px]" style={{ color: S.text3 }}>{pass}/{qualityChecks.length} 项通过</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-1.5 w-12 rounded-full overflow-hidden" style={{ background: S.s3 }}>
                    <div className="h-full rounded-full" style={{
                      width: `${Math.round((pass / qualityChecks.length) * 100)}%`,
                      background: pass === qualityChecks.length ? S.success : S.warning,
                    }} />
                  </div>
                  <span className="text-[9px] font-mono font-bold" style={{
                    color: pass === qualityChecks.length ? S.success : S.warning,
                  }}>
                    {Math.round((pass / qualityChecks.length) * 100)}%
                  </span>
                </div>
              </div>
              <div className="space-y-1">
                {qualityChecks.map((c) => (
                  <div key={c.id} className="flex items-center gap-2">
                    {c.status === 'ok'
                      ? <CheckCircle2 size={13} color={S.success} className="shrink-0" />
                      : <AlertTriangle size={13} color={S.warning} className="shrink-0" />}
                    <span className="text-[10px]" style={{ color: c.status === 'ok' ? S.text2 : S.warning }}>{c.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── 发布设置 ── */}
            <div className="rounded-xl p-3 lg:col-span-2" style={{ background: S.card, border: `1px solid ${S.border}` }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: S.primary10 }}>
                  <Layers size={13} style={{ color: S.primary }} />
                </div>
                <h3 className="text-xs font-bold" style={{ color: S.text }}>发布设置</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {([
                  ["作品类型", "互动 H5"],
                  ["画幅", "移动端竖屏 9:16"],
                  ["分享标题", projectName],
                  ["付费模式", "免费试玩"],
                ] as const).map(([k, v]) => (
                  <div key={k} className="p-2 rounded-lg" style={{ background: S.s2 }}>
                    <span className="text-[9px] block" style={{ color: S.text3 }}>{k}</span>
                    <span className="text-[10px] font-medium block mt-0.5" style={{ color: S.text }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════
            TAB 1: 导出配置
           ════════════════════════════════════════════════════════════════ */}
        {activeTab === 1 && (
          <div className="space-y-3">

            {/* ── 多端导出 ── */}
            <div className="rounded-xl p-3" style={{ background: S.card, border: `1px solid ${S.border}` }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: S.primary10 }}>
                  <Download size={13} style={{ color: S.primary }} />
                </div>
                <div>
                  <h3 className="text-xs font-bold" style={{ color: S.text }}>多端导出</h3>
                  <p className="text-[9px]" style={{ color: S.text3 }}>{EXPORT_FORMATS.length} 种导出格式</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {EXPORT_FORMATS.map((fmt) => {
                  const state = exportStates[fmt.id]?.status ?? 'idle';
                  return (
                    <div key={fmt.id} className="p-2.5 rounded-xl" style={{ background: S.s2, border: `1px solid ${S.border}` }}>
                      <div className="flex items-start justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{fmt.icon}</span>
                          <div>
                            <span className="text-[10px] font-bold" style={{ color: S.text }}>{fmt.name}</span>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className="text-[8px] font-bold px-1.5 py-0.5 rounded" style={{
                                background: fmt.status === 'ready' ? `${S.success}12` : `${S.warning}12`,
                                color: fmt.status === 'ready' ? S.success : S.warning,
                              }}>
                                {fmt.status === 'ready' ? '就绪' : 'Beta'}
                              </span>
                              <span className="text-[8px] font-mono" style={{ color: S.text3 }}>{fmt.estimatedSize}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <p className="text-[9px] mb-1.5 leading-relaxed" style={{ color: S.text2 }}>{fmt.description}</p>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {fmt.features.map((feat) => (
                          <span key={feat} className="text-[7px] px-1 py-0.5 rounded"
                            style={{ background: `${S.primary}08`, color: S.text3, border: `1px solid ${S.border}` }}>
                            {feat}
                          </span>
                        ))}
                      </div>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => state === 'idle' && handleExport(fmt.id)}
                        disabled={state !== 'idle'}
                        className="w-full py-1.5 rounded-lg text-[10px] font-bold focus:outline-none"
                        style={{
                          background: state === 'done' ? `${S.success}12` : state === 'exporting' ? `${S.primary}08` : `${S.primary}12`,
                          color: state === 'done' ? S.success : state === 'exporting' ? S.text3 : S.primary,
                          cursor: state === 'idle' ? 'pointer' : 'default',
                        }}
                      >
                        {state === 'exporting' && (
                          <>
                            <span className="inline-block animate-spin mr-1" style={{ fontSize: '10px' }}>&#8987;</span>
                            导出中...
                          </>
                        )}
                        {state === 'done' && <>&#x2705; 已导出</>}
                        {state === 'idle' && (
                          <>
                            <Download size={10} className="inline mr-1" style={{ verticalAlign: '-1px' }} />
                            导出
                          </>
                        )}
                      </motion.button>
                      {state === 'done' && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-1.5 p-1.5 rounded-lg text-[8px]"
                          style={{ background: `${S.success}06`, border: `1px solid ${S.success}15` }}
                        >
                          <div className="flex items-center justify-between">
                            <span style={{ color: S.text3 }}>
                              <CheckCircle2 size={8} className="inline mr-1" style={{ color: S.success }} />
                              ghost-protocol_{fmt.id}.{
                                fmt.id === 'json' ? 'json' :
                                fmt.id === 'webgal' ? 'txt' :
                                fmt.id === 'renpy' ? 'rpy' :
                                fmt.id === 'ink' ? 'ink' :
                                fmt.id === 'h5-package' ? 'zip' : 'pdf'
                              }
                            </span>
                            <span className="font-mono" style={{ color: S.text3 }}>{fmt.estimatedSize}</span>
                          </div>
                          <button className="text-[8px] font-bold mt-1 focus:outline-none" style={{ color: S.primary }}>
                            <Download size={7} className="inline mr-0.5" />
                            下载文件
                          </button>
                        </motion.div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── 行业发布格式 ── */}
            <div className="rounded-xl p-3" style={{ background: S.card, border: `1px solid ${S.border}` }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: S.primary10 }}>
                  <Globe size={13} style={{ color: S.primary }} />
                </div>
                <div>
                  <h3 className="text-xs font-bold" style={{ color: S.text }}>行业发布格式</h3>
                  <p className="text-[9px]" style={{ color: S.text3 }}>按行业定制发布输出</p>
                </div>
              </div>
              {/* Industry sub-tabs */}
              <div className="flex gap-1 mb-2 p-1 rounded-lg" style={{ background: S.s2 }}>
                {INDUSTRY_TABS.map((tab, idx) => (
                  <motion.button
                    key={tab}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIndustryTab(idx)}
                    className="flex-1 py-1.5 rounded-md text-[10px] font-bold focus:outline-none"
                    style={{
                      background: industryTab === idx ? S.card : 'transparent',
                      color: industryTab === idx ? S.primary : S.text3,
                      boxShadow: industryTab === idx ? `0 1px 3px ${S.border}` : 'none',
                    }}
                  >
                    {tab}
                  </motion.button>
                ))}
              </div>
              {/* Format cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {(INDUSTRY_FORMATS[INDUSTRY_TABS[industryTab]] ?? []).map((fmt) => {
                  const fmtState = exportStates[fmt.id]?.status ?? 'idle';
                  return (
                    <div key={fmt.id} className="p-2.5 rounded-xl" style={{ background: S.s2, border: `1px solid ${S.border}` }}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold" style={{ color: S.text }}>{fmt.name}</span>
                          <span className="text-[8px] font-bold px-1.5 py-0.5 rounded" style={{
                            background: fmt.status === 'ready' ? `${S.success}12` : fmt.status === 'beta' ? `${S.warning}12` : `${S.error}12`,
                            color: fmt.status === 'ready' ? S.success : fmt.status === 'beta' ? S.warning : S.error,
                          }}>
                            {fmt.status === 'ready' ? '就绪' : fmt.status === 'beta' ? 'Beta' : 'Alpha'}
                          </span>
                        </div>
                        <span className="text-[8px] font-mono" style={{ color: S.text3 }}>{fmt.estimatedSize}</span>
                      </div>
                      <p className="text-[9px] mb-1.5" style={{ color: S.text2 }}>{fmt.description}</p>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => fmtState === 'idle' && handleExport(fmt.id)}
                        disabled={fmtState !== 'idle'}
                        className="w-full py-1.5 rounded-lg text-[10px] font-bold focus:outline-none"
                        style={{
                          background: fmtState === 'done' ? `${S.success}12` : fmtState === 'exporting' ? `${S.primary}08` : `${S.primary}12`,
                          color: fmtState === 'done' ? S.success : fmtState === 'exporting' ? S.text3 : S.primary,
                          cursor: fmtState === 'idle' ? 'pointer' : 'default',
                        }}
                      >
                        {fmtState === 'exporting' && (
                          <>
                            <span className="inline-block animate-spin mr-1" style={{ fontSize: '10px' }}>&#8987;</span>
                            发布中...
                          </>
                        )}
                        {fmtState === 'done' && <>&#x2705; 已发布</>}
                        {fmtState === 'idle' && (
                          <>
                            <Upload size={10} className="inline mr-1" style={{ verticalAlign: '-1px' }} />
                            发布
                          </>
                        )}
                      </motion.button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── 引擎导出 (Beta) ── */}
            <div className="rounded-xl p-3" style={{ background: S.card, border: `1px solid ${S.border}` }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: S.primary10 }}>
                  <Rocket size={13} style={{ color: S.primary }} />
                </div>
                <div>
                  <h3 className="text-xs font-bold" style={{ color: S.text }}>引擎导出 (Beta)</h3>
                  <p className="text-[9px]" style={{ color: S.text3 }}>{engineExportConfigs.length} 个引擎目标</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {engineExportConfigs.map((engine) => {
                  const state = engineExportStates[engine.id]?.status ?? 'idle';
                  const statusColor = engine.status === 'stable' ? S.success : engine.status === 'beta' ? S.warning : S.error;
                  const statusLabel = engine.status === 'stable' ? 'Stable' : engine.status === 'beta' ? 'Beta' : 'Alpha';
                  const visibleMappings = engine.fieldMappings.slice(0, 3);
                  const remainingMappings = engine.fieldMappings.length - visibleMappings.length;
                  return (
                    <motion.div
                      key={engine.id}
                      whileHover={{ y: -1, boxShadow: `0 4px 12px ${S.primary}10` }}
                      transition={{ duration: 0.15 }}
                      className="p-2.5 rounded-xl"
                      style={{ background: S.s2, border: `1px solid ${S.border}` }}
                    >
                      <div className="flex items-start justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{engine.icon}</span>
                          <div>
                            <span className="text-[10px] font-bold" style={{ color: S.text }}>{engine.name}</span>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className="text-[8px] font-bold px-1.5 py-0.5 rounded"
                                style={{ background: `${statusColor}12`, color: statusColor }}>
                                {statusLabel}
                              </span>
                              <span className="text-[8px] font-mono" style={{ color: S.text3 }}>{engine.estimatedSize}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <p className="text-[9px] mb-1.5 leading-relaxed" style={{ color: S.text2 }}>{engine.description}</p>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {engine.features.map((feat) => (
                          <span key={feat} className="text-[7px] px-1 py-0.5 rounded"
                            style={{ background: `${S.primary}08`, color: S.text3, border: `1px solid ${S.border}` }}>
                            {feat}
                          </span>
                        ))}
                      </div>
                      {/* 字段映射预览 */}
                      <div className="mb-2">
                        <div className="text-[8px] font-bold mb-1" style={{ color: S.text3 }}>字段映射预览</div>
                        <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${S.border}` }}>
                          {visibleMappings.map((m, mi) => (
                            <div key={mi} className="flex items-center text-[8px] px-2 py-0.5"
                              style={{ background: mi % 2 === 0 ? S.card : S.s2, borderBottom: mi < visibleMappings.length - 1 ? `1px solid ${S.border}` : 'none' }}>
                              <span className="font-mono flex-1 truncate" style={{ color: S.text2 }}>{m.sourceField}</span>
                              <ChevronRight size={8} style={{ color: S.text3 }} className="mx-1 shrink-0" />
                              <span className="font-mono flex-1 truncate" style={{ color: m.mapped ? S.accent : S.warning }}>{m.targetField}</span>
                              {m.mapped && <CheckCircle2 size={8} style={{ color: S.success }} className="shrink-0 ml-1" />}
                            </div>
                          ))}
                          {remainingMappings > 0 && (
                            <div className="text-center py-0.5 text-[8px]" style={{ background: S.s2, color: S.text3, borderTop: `1px solid ${S.border}` }}>
                              +{remainingMappings} 更多映射
                            </div>
                          )}
                        </div>
                      </div>
                      {/* 导出选项 */}
                      {engine.customOptions.length > 0 && (
                        <div className="mb-2 space-y-1">
                          <div className="text-[8px] font-bold mb-0.5" style={{ color: S.text3 }}>导出选项</div>
                          {engine.customOptions.map((opt) => (
                            <div key={opt.key} className="flex items-center justify-between px-2 py-0.5 rounded-lg" style={{ background: S.card }}>
                              <span className="text-[9px]" style={{ color: S.text2 }}>{opt.label}</span>
                              {opt.type === 'boolean' ? (
                                <div className="w-7 h-4 rounded-full relative cursor-pointer" style={{ background: opt.defaultValue ? S.primary : S.s3 }}>
                                  <div className="w-3 h-3 rounded-full absolute top-0.5 transition-all" style={{
                                    background: '#fff', left: opt.defaultValue ? '14px' : '2px',
                                  }} />
                                </div>
                              ) : (
                                <span className="text-[8px] font-mono px-1.5 py-0.5 rounded" style={{ background: S.s2, color: S.text2, border: `1px solid ${S.border}` }}>
                                  {String(opt.defaultValue)}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => state === 'idle' && handleEngineExport(engine.id)}
                        disabled={state !== 'idle'}
                        className="w-full py-1.5 rounded-lg text-[10px] font-bold focus:outline-none"
                        style={{
                          background: state === 'done' ? `${S.success}12` : state === 'exporting' ? `${S.primary}08` : `${S.primary}12`,
                          color: state === 'done' ? S.success : state === 'exporting' ? S.text3 : S.primary,
                          cursor: state === 'idle' ? 'pointer' : 'default',
                        }}
                      >
                        {state === 'exporting' && (
                          <>
                            <span className="inline-block animate-spin mr-1" style={{ fontSize: '10px' }}>&#8987;</span>
                            导出中...
                          </>
                        )}
                        {state === 'done' && <>&#x2705; 已导出 {engine.format}</>}
                        {state === 'idle' && (
                          <>
                            <Download size={10} className="inline mr-1" style={{ verticalAlign: '-1px' }} />
                            导出 {engine.format}
                          </>
                        )}
                      </motion.button>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════
            TAB 2: 快照与记录
           ════════════════════════════════════════════════════════════════ */}
        {activeTab === 2 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">

            {/* ── 版本快照 ── */}
            <div className="rounded-xl p-3" style={{ background: S.card, border: `1px solid ${S.border}` }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: S.primary10 }}>
                    <Camera size={13} style={{ color: S.primary }} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold" style={{ color: S.text }}>版本快照</h3>
                    <p className="text-[9px]" style={{ color: S.text3 }}>当前 {snapshots[0]?.version ?? '—'} | {snapshots.length} 个版本</p>
                  </div>
                </div>
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
                    <>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setCompareMode(true)}
                        className="flex items-center gap-1 text-[9px] font-bold px-2 py-1 rounded focus:outline-none"
                        style={{ background: `${S.accent}12`, color: S.accent }}
                      >
                        <GitCompareArrows size={10} /> 对比
                      </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={handleCreateSnapshot}
                        className="flex items-center gap-1 text-[9px] font-bold px-2 py-1 rounded focus:outline-none"
                        style={{ background: `${S.primary}12`, color: S.primary }}
                      >
                        <Camera size={10} /> 新建
                      </motion.button>
                    </>
                  )}
                </div>
              </div>
              <div className="space-y-1.5">
                {snapshots.map((snap) => {
                  const cfg = STATUS_CFG[snap.status];
                  const isSelected = selectedSnapshots.includes(snap.version);
                  return (
                    <motion.button
                      key={snap.version}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        if (compareMode) toggleSnapshotSelect(snap.version);
                      }}
                      className="w-full text-left p-2.5 rounded-xl focus:outline-none"
                      style={{
                        background: isSelected ? `${S.accent}08` : S.s2,
                        border: `1px solid ${isSelected ? S.accent : S.border}`,
                        cursor: compareMode ? "pointer" : "default",
                      }}
                    >
                      <div className="flex items-center justify-between mb-0.5">
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
                      <div className="flex items-center gap-1 mt-0.5">
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
                    <div className="mt-2 p-2.5 rounded-xl" style={{ background: S.s2, border: `1px solid ${S.accent}30` }}>
                      <div className="flex items-center gap-2 mb-2">
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
                        <div className="p-2 rounded-lg" style={{ background: S.card, border: `1px solid ${S.border}` }}>
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-[10px] font-bold font-mono" style={{ color: S.text3 }}>
                              {comparePair.older.version}
                            </span>
                            <span className="text-[8px] px-1 py-0.5 rounded"
                              style={{ background: `${S.text3}15`, color: S.text3 }}>
                              旧
                            </span>
                          </div>
                          <p className="text-[9px] mb-0.5" style={{ color: S.text2 }}>{comparePair.older.summary}</p>
                          <div className="flex items-center gap-1">
                            <Clock size={8} style={{ color: S.text3 }} />
                            <span className="text-[8px]" style={{ color: S.text3 }}>{comparePair.older.date}</span>
                          </div>
                          <div className="flex items-center gap-1 mt-0.5">
                            <Minus size={8} style={{ color: S.error }} />
                            <span className="text-[8px]" style={{ color: S.text3 }}>{comparePair.older.changes} 项变更</span>
                          </div>
                        </div>
                        {/* 新版本 */}
                        <div className="p-2 rounded-lg" style={{ background: S.card, border: `1px solid ${S.accent}30` }}>
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-[10px] font-bold font-mono" style={{ color: S.text }}>
                              {comparePair.newer.version}
                            </span>
                            <span className="text-[8px] px-1 py-0.5 rounded"
                              style={{ background: `${S.accent}12`, color: S.accent }}>
                              新
                            </span>
                          </div>
                          <p className="text-[9px] mb-0.5" style={{ color: S.text2 }}>{comparePair.newer.summary}</p>
                          <div className="flex items-center gap-1">
                            <Clock size={8} style={{ color: S.text3 }} />
                            <span className="text-[8px]" style={{ color: S.text3 }}>{comparePair.newer.date}</span>
                          </div>
                          <div className="flex items-center gap-1 mt-0.5">
                            <Plus size={8} style={{ color: S.success }} />
                            <span className="text-[8px]" style={{ color: S.text3 }}>{comparePair.newer.changes} 项变更</span>
                          </div>
                        </div>
                      </div>
                      {/* 差异摘要 */}
                      <div className="mt-2 p-1.5 rounded-lg" style={{ background: `${S.accent}06`, border: `1px solid ${S.accent}15` }}>
                        <p className="text-[9px]" style={{ color: S.text2 }}>
                          净增 <span className="font-bold font-mono" style={{ color: S.accent }}>
                            {Math.abs(comparePair.newer.changes - comparePair.older.changes)}
                          </span> 项变更
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
            </div>

            {/* ── 变更记录 ── */}
            <div className="rounded-xl p-3" style={{ background: S.card, border: `1px solid ${S.border}` }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: S.primary10 }}>
                  <History size={13} style={{ color: S.primary }} />
                </div>
                <div>
                  <h3 className="text-xs font-bold" style={{ color: S.text }}>变更记录</h3>
                  <p className="text-[9px]" style={{ color: S.text3 }}>今日 {changeLog.length} 条编辑</p>
                </div>
              </div>
              <div className="space-y-0.5 max-h-[400px] overflow-y-auto">
                {changeLog.map((log, i) => {
                  const ActionIcon = ACTION_ICONS[log.action] ?? Pencil;
                  return (
                    <div key={i} className="flex items-start gap-2 py-1.5 border-b last:border-0"
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
            </div>
          </div>
        )}

        {/* 底部留白 */}
        <div className="h-3" />
      </div>
    </div>
  );
}
