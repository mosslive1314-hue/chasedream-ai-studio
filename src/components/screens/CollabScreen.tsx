"use client";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, LayoutGrid, MessageCircle, Shield, Clock, User, UserPlus,
  Pencil, Upload, Rocket, Layers, Eye, CheckCircle2, ChevronDown, ChevronRight,
} from "lucide-react";
import { useNarrativeStore, useUIStore } from "@/store";

// ── Design System ──────────────────────────────────────────────────────────
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

// ── Constants ──────────────────────────────────────────────────────────────
const TABS = [
  { label: "团队成员", icon: Users },
  { label: "任务看板", icon: LayoutGrid },
  { label: "评论动态", icon: MessageCircle },
  { label: "审核流程", icon: Shield },
];

const ROLE_COLORS: Record<string, string> = {
  "Project Lead": "#5E50E8",
  "Script Editor": "#059669",
  "Asset Artist": "#D97706",
  "Interaction Designer": "#00A99D",
};

const ROLE_LABELS: Record<string, string> = {
  "Project Lead": "项目负责人",
  "Script Editor": "剧本编辑",
  "Asset Artist": "资产制作",
  "Interaction Designer": "互动设计",
};

const PRIORITY_CFG: Record<string, { label: string; bg: string; color: string }> = {
  urgent: { label: "紧急", bg: S.error10, color: S.error },
  high:   { label: "高",   bg: S.warning10, color: S.warning },
  normal: { label: "普通", bg: S.primary10, color: S.primary },
  low:    { label: "低",   bg: `${S.text3}15`, color: S.text3 },
};

const STATUS_CFG: Record<string, { label: string; bg: string; color: string }> = {
  todo:        { label: "待办",   bg: `${S.text3}15`, color: S.text3 },
  in_progress: { label: "进行中", bg: S.primary10, color: S.primary },
  review:      { label: "审核中", bg: S.warning10, color: S.warning },
  done:        { label: "已完成", bg: S.success10, color: S.success },
};

const CATEGORY_COLORS: Record<string, string> = {
  "节点编辑": S.primary, "资产制作": S.warning,
  "剧本编写": S.success, "质检修复": S.error,
  "UI设计": S.accent, "互动设计": S.accent,
};

const REVIEW_STAGES = [
  { key: "draft", label: "草稿" },
  { key: "submitted", label: "已提交" },
  { key: "editor_review", label: "编辑审核" },
  { key: "director_approved", label: "主管批准" },
  { key: "published", label: "已发布" },
];

const REVIEW_TYPE_ICONS: Record<string, typeof Pencil> = {
  script: Pencil, asset: Layers, node_graph: LayoutGrid, interaction: Rocket, full_build: Shield,
};

const PERMISSION_LEVELS = [
  { role: "项目负责人", permissions: ["全部权限", "发布管理", "成员管理", "版本回滚"] },
  { role: "剧本编辑", permissions: ["编辑剧本", "编辑对白", "审核 AI 产出"] },
  { role: "资产制作", permissions: ["上传资产", "编辑资产", "审核资产"] },
  { role: "互动设计", permissions: ["编辑节点图", "配置变量", "设计 QTE"] },
  { role: "审阅者", permissions: ["只读查看", "添加评论", "审核内容"] },
];

const KANBAN_COLS: { key: string; label: string }[] = [
  { key: "todo", label: "待办" },
  { key: "in_progress", label: "进行中" },
  { key: "review", label: "审核中" },
  { key: "done", label: "已完成" },
];

const ACTIVITY_ICONS: Record<string, typeof Pencil> = {
  "Project Lead": Shield, "Script Editor": Pencil,
  "Asset Artist": Upload, "Interaction Designer": Rocket,
};

// ── Helpers ────────────────────────────────────────────────────────────────
function stageIndex(stage: string) {
  return REVIEW_STAGES.findIndex(s => s.key === stage);
}

function isOverdue(due?: string) {
  if (!due) return false;
  return new Date(due) < new Date(new Date().toDateString());
}

function highlightMentions(text: string, mentions?: string[]) {
  if (!mentions?.length) return <>{text}</>;
  const parts: (string | { mention: string })[] = [];
  let remaining = text;
  while (remaining) {
    let earliest = -1;
    let matched = "";
    for (const m of mentions) {
      const idx = remaining.indexOf(`@${m}`);
      if (idx !== -1 && (earliest === -1 || idx < earliest)) {
        earliest = idx;
        matched = m;
      }
    }
    if (earliest === -1) { parts.push(remaining); break; }
    if (earliest > 0) parts.push(remaining.slice(0, earliest));
    parts.push({ mention: matched });
    remaining = remaining.slice(earliest + matched.length + 1);
  }
  return (
    <>
      {parts.map((p, i) =>
        typeof p === "string" ? <span key={i}>{p}</span> : (
          <span key={i} className="font-bold" style={{ color: S.primary }}>@{p.mention}</span>
        )
      )}
    </>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function CollabScreen() {
  const collabTasks = useNarrativeStore(s => s.collabTasks);
  const collabComments = useNarrativeStore(s => s.collabComments);
  const reviewItems = useNarrativeStore(s => s.reviewItems);
  const addToast = useUIStore(s => s.addToast);

  const [activeTab, setActiveTab] = useState(0);
  const [commentText, setCommentText] = useState("");
  const [expandedPerms, setExpandedPerms] = useState(false);

  // ── Derived: team members ──
  const members = useMemo(() => {
    const map = new Map<string, { name: string; role: string; taskCount: number; lastEdit: string }>();
    collabTasks.forEach(t => {
      const cur = map.get(t.assignee);
      if (!cur) map.set(t.assignee, { name: t.assignee, role: t.assigneeRole, taskCount: 1, lastEdit: t.dueDate ?? "" });
      else { cur.taskCount++; if ((t.dueDate ?? "") > cur.lastEdit) cur.lastEdit = t.dueDate ?? ""; }
    });
    collabComments.forEach(c => {
      if (!map.has(c.author)) map.set(c.author, { name: c.author, role: c.authorRole, taskCount: 0, lastEdit: c.timestamp.slice(0, 10) });
      else {
        const m = map.get(c.author)!;
        if (c.timestamp.slice(0, 10) > m.lastEdit) m.lastEdit = c.timestamp.slice(0, 10);
      }
    });
    return Array.from(map.values()).sort((a, b) => b.taskCount - a.taskCount);
  }, [collabTasks, collabComments]);

  // ── Tab 1: Kanban grouped ──
  const kanbanCols = useMemo(() =>
    KANBAN_COLS.map(col => ({
      ...col,
      tasks: collabTasks.filter(t => t.status === col.key),
    })),
    [collabTasks],
  );

  const handleSubmitComment = () => {
    if (!commentText.trim()) return;
    addToast({ type: "success", title: "评论已发送", message: commentText.slice(0, 30) });
    setCommentText("");
  };

  return (
    <div className="min-h-svh overflow-y-auto" style={{ background: S.bg }}>
      {/* ── Tab Bar ── */}
      <div className="flex items-center gap-2 px-4 pt-3">
        {TABS.map((tab, i) => {
          const Icon = tab.icon;
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
              <Icon size={12} />
              <span>{tab.label}</span>
            </motion.button>
          );
        })}
      </div>

      <div className="p-3">
        <AnimatePresence mode="wait">

          {/* ═══════════════════ TAB 0: 团队成员 ═══════════════════ */}
          {activeTab === 0 && (
            <motion.div key="t0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: S.primary10 }}>
                    <Users size={13} style={{ color: S.primary }} />
                  </div>
                  <span className="text-xs font-bold" style={{ color: S.text }}>{members.length} 位成员</span>
                </div>
                <motion.button whileTap={{ scale: 0.95 }}
                  onClick={() => addToast({ type: "info", title: "邀请链接已复制", message: "已发送邀请链接到剪贴板" })}
                  className="flex items-center gap-1 text-[10px] font-bold px-3 py-1.5 rounded-lg focus:outline-none"
                  style={{ background: S.primary10, color: S.primary }}>
                  <UserPlus size={11} /> 邀请成员
                </motion.button>
              </div>

              {/* Members Grid */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                {members.map(m => {
                  const rc = ROLE_COLORS[m.role] ?? S.text3;
                  return (
                    <div key={m.name} className="p-2.5 rounded-xl flex items-center gap-2.5"
                      style={{ background: S.card, border: `1px solid ${S.border}` }}>
                      {/* Avatar */}
                      <div className="relative shrink-0">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white"
                          style={{ background: rc }}>
                          {m.name[0]}
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white"
                          style={{ background: S.success }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[11px] font-bold truncate" style={{ color: S.text }}>{m.name}</div>
                        <span className="text-[8px] font-bold px-1.5 py-0.5 rounded inline-block mt-0.5"
                          style={{ background: `${rc}15`, color: rc }}>
                          {ROLE_LABELS[m.role] ?? m.role}
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[8px]" style={{ color: S.text3 }}>
                            <Clock size={8} className="inline mr-0.5" />{m.lastEdit || "—"}
                          </span>
                          <span className="text-[8px]" style={{ color: S.text3 }}>
                            {m.taskCount} 任务
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Activity Timeline */}
              <div className="rounded-xl p-3 mb-3" style={{ background: S.card, border: `1px solid ${S.border}` }}>
                <div className="flex items-center gap-2 mb-2">
                  <MessageCircle size={12} style={{ color: S.primary }} />
                  <span className="text-[11px] font-bold" style={{ color: S.text }}>协作动态</span>
                </div>
                <div className="space-y-1.5">
                  {collabComments.slice(0, 6).map(c => {
                    const AIcon = ACTIVITY_ICONS[c.authorRole] ?? Pencil;
                    const rc = ROLE_COLORS[c.authorRole] ?? S.text3;
                    return (
                      <div key={c.id} className="flex items-start gap-2 py-1.5 border-b last:border-0" style={{ borderColor: S.border }}>
                        <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                          style={{ background: `${rc}15` }}>
                          <AIcon size={10} style={{ color: rc }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-bold" style={{ color: S.text }}>{c.author}</span>
                            <span className="text-[8px]" style={{ color: S.text3 }}>{c.timestamp.slice(5, 16)}</span>
                          </div>
                          <p className="text-[9px] leading-relaxed" style={{ color: S.text2 }}>
                            {highlightMentions(c.content, c.mentions)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Permissions */}
              <div className="rounded-xl p-3" style={{ background: S.card, border: `1px solid ${S.border}` }}>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setExpandedPerms(p => !p)}
                  className="flex items-center justify-between w-full focus:outline-none">
                  <div className="flex items-center gap-2">
                    <Shield size={12} style={{ color: S.primary }} />
                    <span className="text-[11px] font-bold" style={{ color: S.text }}>权限管理</span>
                  </div>
                  {expandedPerms ? <ChevronDown size={14} style={{ color: S.text3 }} /> : <ChevronRight size={14} style={{ color: S.text3 }} />}
                </motion.button>
                <AnimatePresence>
                  {expandedPerms && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.15 }} className="overflow-hidden">
                      <div className="mt-2 space-y-1.5">
                        {PERMISSION_LEVELS.map(p => (
                          <div key={p.role} className="p-2 rounded-lg" style={{ background: S.s2 }}>
                            <span className="text-[10px] font-bold" style={{ color: S.text }}>{p.role}</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {p.permissions.map(perm => (
                                <span key={perm} className="text-[8px] px-1.5 py-0.5 rounded"
                                  style={{ background: S.primary10, color: S.primary }}>{perm}</span>
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

          {/* ═══════════════════ TAB 1: 任务看板 ═══════════════════ */}
          {activeTab === 1 && (
            <motion.div key="t1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                {kanbanCols.map(col => {
                  const stCfg = STATUS_CFG[col.key];
                  return (
                    <div key={col.key} className="rounded-xl p-2" style={{ background: S.card, border: `1px solid ${S.border}` }}>
                      {/* Column Header */}
                      <div className="flex items-center justify-between mb-2 pb-1.5 border-b" style={{ borderColor: S.border }}>
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full" style={{ background: stCfg.color }} />
                          <span className="text-[10px] font-bold" style={{ color: S.text }}>{col.label}</span>
                        </div>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                          style={{ background: stCfg.bg, color: stCfg.color }}>{col.tasks.length}</span>
                      </div>
                      {/* Cards */}
                      <div className="space-y-1.5">
                        {col.tasks.map(task => {
                          const priCfg = PRIORITY_CFG[task.priority] ?? PRIORITY_CFG.normal;
                          const catColor = CATEGORY_COLORS[task.category] ?? S.text3;
                          const overdue = isOverdue(task.dueDate);
                          return (
                            <div key={task.id} className="p-2 rounded-lg" style={{ background: S.s2, border: `1px solid ${S.border}` }}>
                              <div className="flex items-start justify-between mb-1">
                                <span className="text-[10px] font-bold leading-tight flex-1" style={{ color: S.text }}>
                                  {task.title}
                                </span>
                                <span className="text-[7px] font-bold px-1 py-0.5 rounded shrink-0 ml-1"
                                  style={{ background: priCfg.bg, color: priCfg.color }}>{priCfg.label}</span>
                              </div>
                              <div className="flex items-center gap-1 flex-wrap mb-1">
                                <span className="text-[7px] px-1 py-0.5 rounded"
                                  style={{ background: `${catColor}15`, color: catColor }}>{task.category}</span>
                                {task.linkedNodeId && (
                                  <span className="text-[7px] px-1 py-0.5 rounded font-mono"
                                    style={{ background: S.s3, color: S.text3 }}>{task.linkedNodeId}</span>
                                )}
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-[8px] truncate max-w-[60px]" style={{ color: S.text3 }}>
                                  <User size={7} className="inline mr-0.5" />{task.assignee}
                                </span>
                                <div className="flex items-center gap-1.5">
                                  {task.dueDate && (
                                    <span className="text-[7px] font-mono"
                                      style={{ color: overdue ? S.error : S.text3 }}>
                                      {overdue && "! "}{task.dueDate.slice(5)}
                                    </span>
                                  )}
                                  {task.comments > 0 && (
                                    <span className="text-[7px]" style={{ color: S.text3 }}>
                                      <MessageCircle size={7} className="inline mr-0.5" />{task.comments}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* ═══════════════════ TAB 2: 评论动态 ═══════════════════ */}
          {activeTab === 2 && (
            <motion.div key="t2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              {/* Comment Input */}
              <div className="rounded-xl p-3 mb-3" style={{ background: S.card, border: `1px solid ${S.border}` }}>
                <div className="flex items-center gap-2 mb-2">
                  <MessageCircle size={12} style={{ color: S.primary }} />
                  <span className="text-[11px] font-bold" style={{ color: S.text }}>发表评论</span>
                </div>
                <textarea
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  placeholder="输入评论内容，使用 @名字 提及其他成员..."
                  className="w-full p-2 rounded-lg text-[10px] resize-none focus:outline-none"
                  rows={2}
                  style={{ background: S.s2, border: `1px solid ${S.border}`, color: S.text }}
                />
                <div className="flex justify-end mt-2">
                  <motion.button whileTap={{ scale: 0.95 }}
                    onClick={handleSubmitComment}
                    disabled={!commentText.trim()}
                    className="px-4 py-1.5 rounded-lg text-[10px] font-bold text-white focus:outline-none disabled:opacity-40"
                    style={{ background: S.primary }}>
                    <Upload size={10} className="inline mr-1" style={{ verticalAlign: "-1px" }} />
                    发送
                  </motion.button>
                </div>
              </div>

              {/* Comments List */}
              <div className="space-y-2">
                {collabComments.map(c => {
                  const rc = ROLE_COLORS[c.authorRole] ?? S.text3;
                  return (
                    <div key={c.id} className="rounded-xl p-3" style={{ background: S.card, border: `1px solid ${S.border}` }}>
                      <div className="flex items-start gap-2.5">
                        {/* Avatar */}
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                          style={{ background: rc }}>
                          {c.author[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          {/* Header */}
                          <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                            <span className="text-[11px] font-bold" style={{ color: S.text }}>{c.author}</span>
                            <span className="text-[8px] font-bold px-1.5 py-0.5 rounded"
                              style={{ background: `${rc}15`, color: rc }}>
                              {ROLE_LABELS[c.authorRole] ?? c.authorRole}
                            </span>
                            <span className="text-[8px]" style={{ color: S.text3 }}>{c.timestamp.slice(5, 16)}</span>
                            <span className="text-[7px] font-bold px-1.5 py-0.5 rounded ml-auto shrink-0"
                              style={{
                                background: c.isResolved ? S.success10 : S.warning10,
                                color: c.isResolved ? S.success : S.warning,
                              }}>
                              {c.isResolved ? "已解决" : "待处理"}
                            </span>
                          </div>
                          {/* Content */}
                          <p className="text-[10px] leading-relaxed mb-1.5" style={{ color: S.text2 }}>
                            {highlightMentions(c.content, c.mentions)}
                          </p>
                          {/* Linked badges */}
                          <div className="flex items-center gap-1">
                            {c.taskId && (
                              <span className="text-[7px] px-1.5 py-0.5 rounded font-mono"
                                style={{ background: S.primary10, color: S.primary }}>
                                任务 {c.taskId}
                              </span>
                            )}
                            {c.nodeId && (
                              <span className="text-[7px] px-1.5 py-0.5 rounded font-mono"
                                style={{ background: S.accent10, color: S.accent }}>
                                节点 {c.nodeId}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* ═══════════════════ TAB 3: 审核流程 ═══════════════════ */}
          {activeTab === 3 && (
            <motion.div key="t3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              <div className="space-y-2">
                {reviewItems.map(item => {
                  const TypeIcon = REVIEW_TYPE_ICONS[item.type] ?? Pencil;
                  const si = stageIndex(item.stage);
                  return (
                    <div key={item.id} className="rounded-xl p-3" style={{ background: S.card, border: `1px solid ${S.border}` }}>
                      {/* Header */}
                      <div className="flex items-start gap-2.5 mb-2">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: S.primary10 }}>
                          <TypeIcon size={13} style={{ color: S.primary }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[11px] font-bold" style={{ color: S.text }}>{item.title}</div>
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            <span className="text-[8px] px-1.5 py-0.5 rounded" style={{ background: S.s2, color: S.text2 }}>
                              {item.submitter}
                            </span>
                            <ChevronRight size={8} style={{ color: S.text3 }} />
                            <span className="text-[8px] px-1.5 py-0.5 rounded" style={{ background: S.primary10, color: S.primary }}>
                              {item.reviewer}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 5-Stage Pipeline */}
                      <div className="flex items-center justify-between px-1 mb-2">
                        {REVIEW_STAGES.map((stage, idx) => {
                          const reached = idx <= si;
                          const current = idx === si;
                          return (
                            <div key={stage.key} className="flex items-center" style={{ flex: idx < REVIEW_STAGES.length - 1 ? 1 : "none" }}>
                              {/* Dot */}
                              <div className="flex flex-col items-center">
                                <div className="rounded-full flex items-center justify-center transition-all"
                                  style={{
                                    width: current ? 20 : 14,
                                    height: current ? 20 : 14,
                                    background: reached ? S.primary : S.s3,
                                    border: current ? `2px solid ${S.primary20}` : "none",
                                  }}>
                                  {reached && <CheckCircle2 size={current ? 11 : 8} color="#fff" />}
                                </div>
                                <span className="text-[7px] mt-0.5 whitespace-nowrap"
                                  style={{ color: current ? S.primary : S.text3, fontWeight: current ? 700 : 400 }}>
                                  {stage.label}
                                </span>
                              </div>
                              {/* Line */}
                              {idx < REVIEW_STAGES.length - 1 && (
                                <div className="flex-1 h-0.5 mx-0.5 rounded-full"
                                  style={{ background: idx < si ? S.primary : S.s3 }} />
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Meta info */}
                      <div className="flex items-center gap-3 flex-wrap">
                        {item.submittedAt && (
                          <span className="text-[8px]" style={{ color: S.text3 }}>
                            <Clock size={8} className="inline mr-0.5" />提交: {item.submittedAt.slice(5, 16)}
                          </span>
                        )}
                        {item.reviewedAt && (
                          <span className="text-[8px]" style={{ color: S.success }}>
                            <CheckCircle2 size={8} className="inline mr-0.5" />审核: {item.reviewedAt.slice(5, 16)}
                          </span>
                        )}
                      </div>
                      <p className="text-[9px] mt-1" style={{ color: S.text2 }}>{item.changeSummary}</p>
                      {item.comments && (
                        <p className="text-[8px] mt-0.5 italic" style={{ color: S.text3 }}>"{item.comments}"</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

        </AnimatePresence>
        <div className="h-3" />
      </div>
    </div>
  );
}
