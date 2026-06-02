"use client";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, AlertTriangle, Copy, ExternalLink,
  ChevronDown, ChevronRight, Camera, GitCompareArrows,
  Clock, User, Plus, Minus, Pencil, Trash2, Rocket,
  History, ArrowLeftRight, X, Layers, Download, UserPlus,
  Shield, Upload, Eye, Globe, MessageCircle, GitCompare, LayoutGrid,
} from "lucide-react";
import {
  ENGINE_EXPORT_CONFIGS, COLLAB_TASKS, COLLAB_COMMENTS, REVIEW_ITEMS, VERSION_DIFFS,
} from "../../lib/studio-data";

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

// ── 团队协作数据 ─────────────────────────────────────────────────────────
const TEAM_MEMBERS = [
  { name: '你', role: '项目负责人', avatar: '\u{1F464}', color: '#5E50E8', online: true, lastEdit: '刚刚' },
  { name: '编剧小王', role: '剧本编辑', avatar: '\u270D\uFE0F', color: '#00A99D', online: true, lastEdit: '10 分钟前' },
  { name: '美术小李', role: '资产制作', avatar: '\u{1F3A8}', color: '#D97706', online: false, lastEdit: '2 小时前' },
  { name: '策划小张', role: '互动设计', avatar: '\u{1F9E9}', color: '#DC2626', online: false, lastEdit: '昨天' },
];

const COLLAB_ACTIVITIES = [
  { user: '编剧小王', action: '编辑了 N05 对白文案', time: '10 分钟前', type: 'edit' },
  { user: '美术小李', action: '上传了 N03 场景图片', time: '2 小时前', type: 'upload' },
  { user: '你', action: '创建了版本快照 v1.2.3', time: '3 小时前', type: 'publish' },
  { user: '策划小张', action: '添加了 N07 互动设计意图', time: '昨天', type: 'design' },
  { user: '编剧小王', action: '审核通过了 AI 生成的角色设定', time: '昨天', type: 'review' },
];

const PERMISSION_LEVELS = [
  { role: '项目负责人', permissions: ['全部权限', '发布管理', '成员管理', '版本回滚'] },
  { role: '剧本编辑', permissions: ['编辑剧本', '编辑对白', '审核 AI 产出'] },
  { role: '资产制作', permissions: ['上传资产', '编辑资产', '审核资产'] },
  { role: '互动设计', permissions: ['编辑节点图', '配置变量', '设计 QTE'] },
  { role: '审阅者', permissions: ['只读查看', '添加评论', '审核内容'] },
];

// ── 协作动态类型图标 ─────────────────────────────────────────────────────
const COLLAB_TYPE_ICONS: Record<string, typeof Pencil> = {
  edit: Pencil,
  upload: Upload,
  publish: Rocket,
  design: Layers,
  review: Eye,
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

// ── 行业发布格式（P8-14）────────────────────────────────────────────────
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

// ── 审核阶段配置 ─────────────────────────────────────────────────────────
const REVIEW_STAGES: { key: string; label: string }[] = [
  { key: 'draft', label: '草稿' },
  { key: 'submitted', label: '已提交' },
  { key: 'editor_review', label: '编辑审核' },
  { key: 'director_approved', label: '主管批准' },
  { key: 'published', label: '已发布' },
];

// ── 优先级配置 ───────────────────────────────────────────────────────────
const PRIORITY_CFG: Record<string, { label: string; bg: string; color: string }> = {
  urgent: { label: '紧急', bg: `${S.error}12`, color: S.error },
  high:   { label: '高', bg: `${S.warning}12`, color: S.warning },
  normal: { label: '普通', bg: `${S.primary}12`, color: S.primary },
  low:    { label: '低', bg: `${S.text3}12`, color: S.text3 },
};

// ── 审核类型图标 ─────────────────────────────────────────────────────────
const REVIEW_TYPE_ICONS: Record<string, typeof Pencil> = {
  script: Pencil, asset: Layers, node_graph: LayoutGrid, interaction: Rocket, full_build: Shield,
};

// ── 提及高亮辅助函数 ─────────────────────────────────────────────────────
function renderWithMentions(text: string, mentions?: string[]) {
  if (!mentions || mentions.length === 0) return text;
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let keyIdx = 0;
  for (const mention of mentions) {
    const pattern = `@${mention}`;
    const idx = remaining.indexOf(pattern);
    if (idx >= 0) {
      if (idx > 0) parts.push(<span key={`t${keyIdx++}`}>{remaining.slice(0, idx)}</span>);
      parts.push(<span key={`m${keyIdx++}`} style={{ color: S.primary, fontWeight: 600 }}>{pattern}</span>);
      remaining = remaining.slice(idx + pattern.length);
    }
  }
  if (remaining) parts.push(<span key={`t${keyIdx++}`}>{remaining}</span>);
  return <>{parts}</>;
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
  const secExport = useSectionToggle(true);
  const secCollab = useSectionToggle(true);
  const secEngineExport = useSectionToggle(true);
  const secIndustry = useSectionToggle(true);
  const secTaskBoard = useSectionToggle(true);
  const secCommentsFeed = useSectionToggle(true);
  const secReviewWorkflow = useSectionToggle(true);
  const secVersionDiff = useSectionToggle(true);
  const [permissionsOpen, setPermissionsOpen] = useState(false);
  const [engineExportStates, setEngineExportStates] = useState<Record<string, { status: 'idle' | 'exporting' | 'done' }>>({});
  const [industryTab, setIndustryTab] = useState(0);
  const [diffFromIdx, setDiffFromIdx] = useState(0);
  const [diffToIdx, setDiffToIdx] = useState(1);

  // 导出状态
  const [exportStates, setExportStates] = useState<Record<string, { status: 'idle' | 'exporting' | 'done' }>>({});

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

  const handleExport = (formatId: string) => {
    setExportStates((prev) => ({ ...prev, [formatId]: { status: 'exporting' } }));
    setTimeout(() => {
      setExportStates((prev) => ({ ...prev, [formatId]: { status: 'done' } }));
    }, 2000);
  };

  const handleEngineExport = (engineId: string) => {
    setEngineExportStates((prev) => ({ ...prev, [engineId]: { status: 'exporting' } }));
    setTimeout(() => {
      setEngineExportStates((prev) => ({ ...prev, [engineId]: { status: 'done' } }));
    }, 2500);
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

        {/* ── 多端导出卡片 ── */}
        <div className="rounded-xl p-4" style={{ background: S.card, border: `1px solid ${S.border}` }}>
          <SectionHeader
            icon={Download}
            title="多端导出"
            subtitle={`${EXPORT_FORMATS.length} 种导出格式`}
            open={secExport.open}
            onToggle={secExport.toggle}
          />
          <AnimatePresence>
            {secExport.open && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  {EXPORT_FORMATS.map((fmt) => {
                    const state = exportStates[fmt.id]?.status ?? 'idle';
                    return (
                      <div key={fmt.id} className="p-3 rounded-xl" style={{ background: S.s2, border: `1px solid ${S.border}` }}>
                        {/* Header: icon + name + status */}
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{fmt.icon}</span>
                            <div>
                              <span className="text-[11px] font-bold" style={{ color: S.text }}>{fmt.name}</span>
                              <div className="flex items-center gap-1.5 mt-0.5">
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
                        {/* Description */}
                        <p className="text-[9px] mb-2 leading-relaxed" style={{ color: S.text2 }}>{fmt.description}</p>
                        {/* Feature tags */}
                        <div className="flex flex-wrap gap-1 mb-3">
                          {fmt.features.map((feat) => (
                            <span key={feat} className="text-[8px] px-1.5 py-0.5 rounded"
                              style={{ background: `${S.primary}08`, color: S.text3, border: `1px solid ${S.border}` }}>
                              {feat}
                            </span>
                          ))}
                        </div>
                        {/* Export button & result */}
                        <div>
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
                            {state === 'done' && <>✅ 已导出</>}
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
                              className="mt-1.5 p-2 rounded-lg text-[8px]"
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
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── 团队协作卡片 ── */}
        <div className="rounded-xl p-4" style={{ background: S.card, border: `1px solid ${S.border}` }}>
          <SectionHeader
            icon={User}
            title="团队协作"
            subtitle={`${TEAM_MEMBERS.filter((m) => m.online).length}/${TEAM_MEMBERS.length} 人在线`}
            open={secCollab.open}
            onToggle={secCollab.toggle}
            action={
              <motion.button
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-1 text-[9px] font-bold px-2 py-1 rounded focus:outline-none"
                style={{ background: `${S.accent}12`, color: S.accent }}
              >
                <UserPlus size={10} /> 邀请成员
              </motion.button>
            }
          />
          <AnimatePresence>
            {secCollab.open && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                {/* 团队成员面板 */}
                <div className="mt-3">
                  <div className="text-[9px] font-bold mb-2" style={{ color: S.text3 }}>团队成员</div>
                  <div className="space-y-2">
                    {TEAM_MEMBERS.map((member) => (
                      <div key={member.name} className="flex items-center gap-2.5 p-2.5 rounded-xl"
                        style={{ background: S.s2, border: `1px solid ${S.border}` }}>
                        {/* Avatar with online indicator */}
                        <div className="relative shrink-0">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                            style={{ background: `${member.color}15`, border: `2px solid ${member.color}30` }}>
                            {member.avatar}
                          </div>
                          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
                            style={{
                              background: member.online ? S.success : S.text3,
                              borderColor: S.s2,
                            }} />
                        </div>
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold" style={{ color: S.text }}>{member.name}</span>
                            <span className="text-[8px] px-1.5 py-0.5 rounded"
                              style={{ background: `${member.color}12`, color: member.color }}>
                              {member.role}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 mt-0.5">
                            <Clock size={8} style={{ color: S.text3 }} />
                            <span className="text-[8px]" style={{ color: S.text3 }}>
                              {member.online ? '在线' : '离线'} · 最后编辑: {member.lastEdit}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 协作动态流 */}
                <div className="mt-4">
                  <div className="text-[9px] font-bold mb-2" style={{ color: S.text3 }}>协作动态</div>
                  <div className="space-y-0">
                    {COLLAB_ACTIVITIES.map((act, i) => {
                      const ActIcon = COLLAB_TYPE_ICONS[act.type] ?? Pencil;
                      const member = TEAM_MEMBERS.find((m) => m.name === act.user);
                      const iconColor = member?.color ?? S.text3;
                      return (
                        <div key={i} className="flex items-start gap-2.5 py-2 border-b last:border-0"
                          style={{ borderColor: S.border }}>
                          {/* Timeline icon */}
                          <div className="flex flex-col items-center shrink-0 pt-0.5">
                            <div className="w-5 h-5 rounded-full flex items-center justify-center"
                              style={{ background: `${iconColor}12` }}>
                              <ActIcon size={10} style={{ color: iconColor }} />
                            </div>
                            {i < COLLAB_ACTIVITIES.length - 1 && (
                              <div className="w-px flex-1 mt-1" style={{ background: S.border, minHeight: '12px' }} />
                            )}
                          </div>
                          {/* Content */}
                          <div className="flex-1 min-w-0 pb-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[8px] font-bold px-1.5 py-0.5 rounded"
                                style={{ background: `${iconColor}12`, color: iconColor }}>
                                {act.user}
                              </span>
                              <span className="text-[10px]" style={{ color: S.text }}>{act.action}</span>
                            </div>
                            <span className="text-[8px] mt-0.5" style={{ color: S.text3 }}>{act.time}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 权限管理（折叠面板） */}
                <div className="mt-4">
                  <button
                    onClick={() => setPermissionsOpen((o) => !o)}
                    className="flex items-center gap-2 w-full text-left focus:outline-none"
                  >
                    <div className="w-5 h-5 rounded-lg flex items-center justify-center"
                      style={{ background: `${S.warning}12` }}>
                      <Shield size={10} style={{ color: S.warning }} />
                    </div>
                    <span className="text-[10px] font-bold" style={{ color: S.text }}>权限管理</span>
                    <motion.div animate={{ rotate: permissionsOpen ? 0 : -90 }} transition={{ duration: 0.15 }}>
                      <ChevronDown size={10} style={{ color: S.text3 }} />
                    </motion.div>
                  </button>
                  <AnimatePresence>
                    {permissionsOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-2 mt-2">
                          {PERMISSION_LEVELS.map((level) => (
                            <div key={level.role} className="p-2.5 rounded-lg"
                              style={{ background: S.s2, border: `1px solid ${S.border}` }}>
                              <div className="text-[10px] font-bold mb-1.5" style={{ color: S.text }}>{level.role}</div>
                              <div className="flex flex-wrap gap-1">
                                {level.permissions.map((perm) => (
                                  <span key={perm} className="text-[8px] px-1.5 py-0.5 rounded"
                                    style={{ background: `${S.primary}08`, color: S.primary, border: `1px solid ${S.primary}15` }}>
                                    {perm}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── P8-13: 引擎导出 (Beta) ── */}
        <div className="rounded-xl p-4" style={{ background: S.card, border: `1px solid ${S.border}` }}>
          <SectionHeader
            icon={Rocket}
            title="引擎导出 (Beta)"
            subtitle={`${ENGINE_EXPORT_CONFIGS.length} 个引擎目标`}
            open={secEngineExport.open}
            onToggle={secEngineExport.toggle}
          />
          <AnimatePresence>
            {secEngineExport.open && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  {ENGINE_EXPORT_CONFIGS.map((engine) => {
                    const state = engineExportStates[engine.id]?.status ?? 'idle';
                    const statusColor = engine.status === 'stable' ? S.success : engine.status === 'beta' ? S.warning : S.error;
                    const statusLabel = engine.status === 'stable' ? 'Stable' : engine.status === 'beta' ? 'Beta' : 'Alpha';
                    const visibleMappings = engine.fieldMappings.slice(0, 4);
                    const remainingMappings = engine.fieldMappings.length - visibleMappings.length;
                    return (
                      <motion.div
                        key={engine.id}
                        whileHover={{ y: -2, boxShadow: `0 4px 12px ${S.primary}10` }}
                        transition={{ duration: 0.15 }}
                        className="p-3 rounded-xl"
                        style={{ background: S.s2, border: `1px solid ${S.border}` }}
                      >
                        {/* Header */}
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{engine.icon}</span>
                            <div>
                              <span className="text-[11px] font-bold" style={{ color: S.text }}>{engine.name}</span>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[8px] font-bold px-1.5 py-0.5 rounded"
                                  style={{ background: `${statusColor}12`, color: statusColor }}>
                                  {statusLabel}
                                </span>
                                <span className="text-[8px] font-mono" style={{ color: S.text3 }}>{engine.estimatedSize}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        {/* Description */}
                        <p className="text-[9px] mb-2 leading-relaxed" style={{ color: S.text2 }}>{engine.description}</p>
                        {/* Feature tags */}
                        <div className="flex flex-wrap gap-1 mb-3">
                          {engine.features.map((feat) => (
                            <span key={feat} className="text-[8px] px-1.5 py-0.5 rounded"
                              style={{ background: `${S.primary}08`, color: S.text3, border: `1px solid ${S.border}` }}>
                              {feat}
                            </span>
                          ))}
                        </div>
                        {/* Field mapping preview */}
                        <div className="mb-3">
                          <div className="text-[8px] font-bold mb-1" style={{ color: S.text3 }}>字段映射预览</div>
                          <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${S.border}` }}>
                            {visibleMappings.map((m, mi) => (
                              <div key={mi} className="flex items-center text-[8px] px-2 py-1"
                                style={{ background: mi % 2 === 0 ? S.card : S.s2, borderBottom: mi < visibleMappings.length - 1 ? `1px solid ${S.border}` : 'none' }}>
                                <span className="font-mono flex-1 truncate" style={{ color: S.text2 }}>{m.sourceField}</span>
                                <ChevronRight size={8} style={{ color: S.text3 }} className="mx-1 shrink-0" />
                                <span className="font-mono flex-1 truncate" style={{ color: m.mapped ? S.accent : S.warning }}>{m.targetField}</span>
                                {m.mapped && <CheckCircle2 size={8} style={{ color: S.success }} className="shrink-0 ml-1" />}
                              </div>
                            ))}
                            {remainingMappings > 0 && (
                              <div className="text-center py-1 text-[8px]" style={{ background: S.s2, color: S.text3, borderTop: `1px solid ${S.border}` }}>
                                +{remainingMappings} 更多映射
                              </div>
                            )}
                          </div>
                        </div>
                        {/* Custom options */}
                        {engine.customOptions.length > 0 && (
                          <div className="mb-3 space-y-1.5">
                            <div className="text-[8px] font-bold mb-1" style={{ color: S.text3 }}>导出选项</div>
                            {engine.customOptions.map((opt) => (
                              <div key={opt.key} className="flex items-center justify-between px-2 py-1 rounded-lg" style={{ background: S.card }}>
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
                        {/* Export button */}
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
                          {state === 'done' && <>✅ 已导出 {engine.format}</>}
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
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── P8-14: 行业发布格式 ── */}
        <div className="rounded-xl p-4" style={{ background: S.card, border: `1px solid ${S.border}` }}>
          <SectionHeader
            icon={Globe}
            title="行业发布格式"
            subtitle="按行业定制发布输出"
            open={secIndustry.open}
            onToggle={secIndustry.toggle}
          />
          <AnimatePresence>
            {secIndustry.open && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                {/* Industry tabs */}
                <div className="flex gap-1 mt-3 mb-3 p-1 rounded-lg" style={{ background: S.s2 }}>
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
                <div className="space-y-2">
                  {(INDUSTRY_FORMATS[INDUSTRY_TABS[industryTab]] ?? []).map((fmt) => {
                    const fmtState = exportStates[fmt.id]?.status ?? 'idle';
                    return (
                      <div key={fmt.id} className="p-3 rounded-xl" style={{ background: S.s2, border: `1px solid ${S.border}` }}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold" style={{ color: S.text }}>{fmt.name}</span>
                            <span className="text-[8px] font-bold px-1.5 py-0.5 rounded" style={{
                              background: fmt.status === 'ready' ? `${S.success}12` : fmt.status === 'beta' ? `${S.warning}12` : `${S.error}12`,
                              color: fmt.status === 'ready' ? S.success : fmt.status === 'beta' ? S.warning : S.error,
                            }}>
                              {fmt.status === 'ready' ? '就绪' : fmt.status === 'beta' ? 'Beta' : 'Alpha'}
                            </span>
                          </div>
                          <span className="text-[8px] font-mono" style={{ color: S.text3 }}>{fmt.estimatedSize}</span>
                        </div>
                        <p className="text-[9px] mb-2" style={{ color: S.text2 }}>{fmt.description}</p>
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
                          {fmtState === 'done' && <>✅ 已发布</>}
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
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── P8-15: 协作系统深化 ── */}

        {/* 任务看板 */}
        <div className="rounded-xl p-4" style={{ background: S.card, border: `1px solid ${S.border}` }}>
          <SectionHeader
            icon={LayoutGrid}
            title="任务看板"
            subtitle={`${COLLAB_TASKS.length} 个任务`}
            open={secTaskBoard.open}
            onToggle={secTaskBoard.toggle}
          />
          <AnimatePresence>
            {secTaskBoard.open && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-4 gap-2 mt-3">
                  {([
                    { key: 'todo', label: '待办', color: S.text3 },
                    { key: 'in_progress', label: '进行中', color: S.primary },
                    { key: 'review', label: '审核中', color: S.warning },
                    { key: 'done', label: '已完成', color: S.success },
                  ] as const).map((col) => {
                    const colTasks = COLLAB_TASKS.filter((t) => t.status === col.key);
                    return (
                      <div key={col.key} className="rounded-lg p-2" style={{ background: S.s2, minHeight: '80px' }}>
                        <div className="flex items-center gap-1 mb-2">
                          <span className="text-[9px] font-bold" style={{ color: col.color }}>{col.label}</span>
                          <span className="text-[8px] font-mono px-1 py-0.5 rounded" style={{ background: `${col.color}12`, color: col.color }}>
                            {colTasks.length}
                          </span>
                        </div>
                        <div className="space-y-2">
                          {colTasks.map((task) => {
                            const prioCfg = PRIORITY_CFG[task.priority];
                            return (
                              <motion.div
                                key={task.id}
                                whileHover={{ scale: 1.02 }}
                                className="p-2 rounded-lg cursor-grab"
                                style={{ background: S.card, border: `1px solid ${S.border}` }}
                              >
                                {/* Drag handle */}
                                <div className="flex items-center gap-1 mb-1">
                                  <div className="flex flex-col items-center opacity-30">
                                    <div className="w-3 h-0.5 rounded-full" style={{ background: S.text3, marginBottom: '2px' }} />
                                    <div className="w-3 h-0.5 rounded-full" style={{ background: S.text3, marginBottom: '2px' }} />
                                    <div className="w-3 h-0.5 rounded-full" style={{ background: S.text3 }} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="text-[9px] font-bold truncate" style={{ color: S.text }}>{task.title}</div>
                                  </div>
                                </div>
                                {/* Badges row */}
                                <div className="flex items-center gap-1 flex-wrap mb-1">
                                  <span className="text-[7px] font-bold px-1 py-0.5 rounded" style={{ background: prioCfg.bg, color: prioCfg.color }}>
                                    {prioCfg.label}
                                  </span>
                                  <span className="text-[7px] px-1 py-0.5 rounded" style={{ background: `${S.accent}10`, color: S.accent }}>
                                    {task.category}
                                  </span>
                                </div>
                                {/* Assignee */}
                                <div className="flex items-center gap-1 mb-1">
                                  <User size={7} style={{ color: S.text3 }} />
                                  <span className="text-[8px]" style={{ color: S.text3 }}>{task.assignee}</span>
                                  <span className="text-[7px]" style={{ color: S.text3 }}>({task.assigneeRole})</span>
                                </div>
                                {/* Bottom row */}
                                <div className="flex items-center gap-1.5">
                                  {task.dueDate && (
                                    <span className="text-[7px] flex items-center gap-0.5" style={{ color: new Date(task.dueDate) < new Date('2026-06-02') ? S.error : S.text3 }}>
                                      <Clock size={7} />
                                      {task.dueDate}
                                      {new Date(task.dueDate) < new Date('2026-06-02') && <span style={{ color: S.error }}> (逾期)</span>}
                                    </span>
                                  )}
                                  {task.comments > 0 && (
                                    <span className="text-[7px] flex items-center gap-0.5" style={{ color: S.text3 }}>
                                      <MessageCircle size={7} />
                                      {task.comments}
                                    </span>
                                  )}
                                  {task.linkedNodeId && (
                                    <span className="text-[7px] px-1 py-0.5 rounded font-mono" style={{ background: `${S.primary}08`, color: S.primary }}>
                                      {task.linkedNodeId}
                                    </span>
                                  )}
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 评论动态 */}
        <div className="rounded-xl p-4" style={{ background: S.card, border: `1px solid ${S.border}` }}>
          <SectionHeader
            icon={MessageCircle}
            title="评论动态"
            subtitle={`${COLLAB_COMMENTS.length} 条评论`}
            open={secCommentsFeed.open}
            onToggle={secCommentsFeed.toggle}
          />
          <AnimatePresence>
            {secCommentsFeed.open && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="space-y-0 mt-3">
                  {COLLAB_COMMENTS.map((comment, i) => (
                    <div key={comment.id} className="p-3 rounded-xl"
                      style={{ background: i % 2 === 0 ? S.s2 : S.card, border: `1px solid ${S.border}`, marginBottom: '4px' }}>
                      {/* Header */}
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[10px] font-bold" style={{ color: S.text }}>{comment.author}</span>
                        <span className="text-[8px] px-1.5 py-0.5 rounded" style={{ background: `${S.primary}12`, color: S.primary }}>
                          {comment.authorRole}
                        </span>
                        <span className="text-[8px] ml-auto" style={{ color: S.text3 }}>{comment.timestamp}</span>
                      </div>
                      {/* Content with mentions */}
                      <div className="text-[10px] leading-relaxed mb-1.5" style={{ color: S.text2 }}>
                        {renderWithMentions(comment.content, comment.mentions)}
                      </div>
                      {/* Footer */}
                      <div className="flex items-center gap-2">
                        {comment.taskId && (
                          <span className="text-[7px] px-1.5 py-0.5 rounded" style={{ background: `${S.accent}10`, color: S.accent }}>
                            {comment.taskId}
                          </span>
                        )}
                        {comment.nodeId && (
                          <span className="text-[7px] px-1.5 py-0.5 rounded font-mono" style={{ background: `${S.primary}08`, color: S.primary }}>
                            {comment.nodeId}
                          </span>
                        )}
                        <span className="text-[7px] px-1.5 py-0.5 rounded ml-auto" style={{
                          background: comment.isResolved ? `${S.success}12` : `${S.warning}12`,
                          color: comment.isResolved ? S.success : S.warning,
                        }}>
                          {comment.isResolved ? '已解决' : '待处理'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 审核流程 */}
        <div className="rounded-xl p-4" style={{ background: S.card, border: `1px solid ${S.border}` }}>
          <SectionHeader
            icon={Shield}
            title="审核流程"
            subtitle={`${REVIEW_ITEMS.length} 个审核项`}
            open={secReviewWorkflow.open}
            onToggle={secReviewWorkflow.toggle}
          />
          <AnimatePresence>
            {secReviewWorkflow.open && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="space-y-3 mt-3">
                  {REVIEW_ITEMS.map((item) => {
                    const TypeIcon = REVIEW_TYPE_ICONS[item.type] ?? Pencil;
                    const currentStageIdx = REVIEW_STAGES.findIndex((s) => s.key === item.stage);
                    return (
                      <div key={item.id} className="p-3 rounded-xl" style={{ background: S.s2, border: `1px solid ${S.border}` }}>
                        {/* Header */}
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-5 h-5 rounded-lg flex items-center justify-center" style={{ background: `${S.primary}12` }}>
                            <TypeIcon size={10} style={{ color: S.primary }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[10px] font-bold" style={{ color: S.text }}>{item.title}</div>
                            <div className="text-[8px]" style={{ color: S.text3 }}>
                              {item.submitter} → {item.reviewer}
                            </div>
                          </div>
                        </div>
                        {/* Stage pipeline */}
                        <div className="flex items-center justify-between mb-2 px-1">
                          {REVIEW_STAGES.map((stage, si) => {
                            const isActive = si <= currentStageIdx;
                            const isCurrent = si === currentStageIdx;
                            return (
                              <div key={stage.key} className="flex items-center" style={{ flex: si < REVIEW_STAGES.length - 1 ? 1 : 'none' }}>
                                <div className="flex flex-col items-center">
                                  <div className="w-3 h-3 rounded-full flex items-center justify-center" style={{
                                    background: isCurrent ? S.primary : isActive ? `${S.primary}30` : S.s3,
                                    border: isCurrent ? `2px solid ${S.primary}` : `2px solid ${isActive ? S.primary : S.border}`,
                                  }}>
                                    {isCurrent && <CheckCircle2 size={7} color="#fff" />}
                                  </div>
                                  <span className="text-[7px] mt-0.5" style={{ color: isCurrent ? S.primary : isActive ? S.text2 : S.text3 }}>
                                    {stage.label}
                                  </span>
                                </div>
                                {si < REVIEW_STAGES.length - 1 && (
                                  <div className="flex-1 h-px mx-1" style={{ background: isActive ? S.primary : S.border }} />
                                )}
                              </div>
                            );
                          })}
                        </div>
                        {/* Details */}
                        <div className="flex items-center gap-2 mb-1 text-[8px]" style={{ color: S.text3 }}>
                          {item.submittedAt && <span>提交: {item.submittedAt}</span>}
                          {item.reviewedAt && <span>· 审核: {item.reviewedAt}</span>}
                        </div>
                        <div className="text-[9px] mb-1" style={{ color: S.text2 }}>{item.changeSummary}</div>
                        <div className="text-[9px]" style={{ color: S.text3 }}>{item.comments}</div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 版本差异对比 */}
        <div className="rounded-xl p-4" style={{ background: S.card, border: `1px solid ${S.border}` }}>
          <SectionHeader
            icon={GitCompare}
            title="版本差异对比"
            subtitle={`${VERSION_DIFFS.length} 组对比数据`}
            open={secVersionDiff.open}
            onToggle={secVersionDiff.toggle}
          />
          <AnimatePresence>
            {secVersionDiff.open && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                {/* Version selectors */}
                <div className="flex items-center gap-2 mt-3 mb-3">
                  <select
                    value={diffFromIdx}
                    onChange={(e) => setDiffFromIdx(Number(e.target.value))}
                    className="flex-1 text-[10px] px-2 py-1.5 rounded-lg focus:outline-none"
                    style={{ background: S.s2, border: `1px solid ${S.border}`, color: S.text }}
                  >
                    {VERSION_DIFFS.map((d, i) => (
                      <option key={i} value={i}>{d.fromVersion} → {d.toVersion}</option>
                    ))}
                  </select>
                  <ArrowLeftRight size={12} style={{ color: S.text3 }} className="shrink-0" />
                  <select
                    value={diffToIdx}
                    onChange={(e) => setDiffToIdx(Number(e.target.value))}
                    className="flex-1 text-[10px] px-2 py-1.5 rounded-lg focus:outline-none"
                    style={{ background: S.s2, border: `1px solid ${S.border}`, color: S.text }}
                  >
                    {VERSION_DIFFS.map((d, i) => (
                      <option key={i} value={i}>{d.fromVersion} → {d.toVersion}</option>
                    ))}
                  </select>
                </div>
                {/* Diff summary card */}
                {(() => {
                  const diff = VERSION_DIFFS[diffFromIdx] ?? VERSION_DIFFS[0];
                  const metrics = [
                    { label: '节点新增', value: diff.nodesAdded, color: S.success },
                    { label: '节点修改', value: diff.nodesModified, color: S.primary },
                    { label: '节点删除', value: diff.nodesRemoved, color: S.error },
                    { label: '变量变更', value: diff.variablesChanged, color: S.warning },
                    { label: '资产更新', value: diff.assetsUpdated, color: S.accent },
                    { label: '脚本变更', value: diff.scriptChanges, color: '#8B5CF6' },
                  ];
                  const maxVal = Math.max(...metrics.map((m) => m.value), 1);
                  return (
                    <div className="p-3 rounded-xl" style={{ background: S.s2, border: `1px solid ${S.border}` }}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: `${S.warning}12`, color: S.warning }}>
                          {diff.fromVersion}
                        </span>
                        <ChevronRight size={10} style={{ color: S.text3 }} />
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: `${S.success}12`, color: S.success }}>
                          {diff.toVersion}
                        </span>
                      </div>
                      <div className="space-y-2 mb-2">
                        {metrics.map((m) => (
                          <div key={m.label} className="flex items-center gap-2">
                            <span className="text-[8px] w-14 shrink-0" style={{ color: S.text3 }}>{m.label}</span>
                            <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ background: S.s3 }}>
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.max((m.value / maxVal) * 100, m.value > 0 ? 8 : 0)}%` }}
                                transition={{ duration: 0.4 }}
                                className="h-full rounded-full flex items-center justify-end pr-1"
                                style={{ background: m.color }}
                              >
                                {m.value > 0 && (
                                  <span className="text-[7px] font-bold font-mono" style={{ color: '#fff' }}>{m.value}</span>
                                )}
                              </motion.div>
                            </div>
                            <span className="text-[9px] font-mono font-bold w-5 text-right" style={{ color: m.color }}>{m.value}</span>
                          </div>
                        ))}
                      </div>
                      <p className="text-[9px] pt-2" style={{ color: S.text2, borderTop: `1px solid ${S.border}` }}>
                        {diff.summary}
                      </p>
                    </div>
                  );
                })()}
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
