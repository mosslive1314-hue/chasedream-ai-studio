"use client";
import { useState, useMemo } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Play, Users, MousePointer, Star, Edit3, Trash2,
  Plus, BarChart3, BookOpen, Clapperboard,
} from "lucide-react";
import { useProjectStore, useNarrativeStore, useUIStore, useSettingsStore, useAnalyticsStore } from "@/store";
import { UpstreamReadiness } from "@/components/ui/UpstreamReadiness";

// ── Design System ──────────────────────────────────────────────────────────
const S = {
  bg: "#FAFBFF", card: "#FFFFFF", s2: "#F4F6FC", s3: "#EDF0F8",
  border: "#E2E5F0", border2: "#CBD0E5",
  primary: "#5E50E8", primary10: "rgba(94,80,232,0.10)", primary20: "rgba(94,80,232,0.20)",
  accent: "#00A99D", accent10: "rgba(0,169,157,0.08)",
  text: "#1A1D2E", text2: "#4A5068", text3: "#8892B0",
  success: "#059669", warning: "#D97706", error: "#DC2626",
  purple2: "#A78BFA",
};

// ── Tab config ─────────────────────────────────────────────────────────────
const TABS = [
  { label: "数据看板", icon: BarChart3 },
  { label: "作品管理", icon: BookOpen },
  { label: "作品表现", icon: Star },
];

// ── Dashboard stats are now derived from store data (see component) ───

// ── Status badge config ────────────────────────────────────────────────────
const STATUS_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  published:   { label: "已发布", bg: `${S.success}14`, color: S.success },
  in_progress: { label: "制作中", bg: S.primary10,      color: S.primary },
  idle:        { label: "闲置",   bg: S.s3,             color: S.text3 },
  draft:       { label: "草稿",   bg: S.s3,             color: S.text3 },
};

// ── Fade transition ────────────────────────────────────────────────────────
const FADE = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -4 },
  transition: { duration: 0.18 },
};

// ── Component ──────────────────────────────────────────────────────────────
export default function MyWorksScreen() {
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState(0);

  const projects       = useProjectStore(s => s.projects);
  const currentProjectId = useProjectStore(s => s.currentProjectId);
  const storyNodes     = useNarrativeStore(s => s.storyNodes);
  const nodeEdges      = useNarrativeStore(s => s.nodeEdges);
  const characters     = useNarrativeStore(s => s.characters);
  const branchPaths    = useNarrativeStore(s => s.branchPaths);
  const projectName    = useSettingsStore(s => s.projectName);
  const addToast       = useUIStore(s => s.addToast);
  const analyticsSessions = useAnalyticsStore(s => s.sessions);

  // ── Derived dashboard stats (from analytics + project store) ─────────────
  const STATS = useMemo(() => {
    const totalSessions = analyticsSessions.length;
    const totalChoices = analyticsSessions.reduce((sum, s) => sum + (s.choicesMade?.length ?? 0), 0);
    const publishedCount = projects.filter(p => p.status === "published").length;
    return [
      { icon: Play,         label: "总游玩次数", value: String(totalSessions),  note: totalSessions > 0 ? `来自 ${totalSessions} 次测试` : "暂无测试数据", color: S.primary,  bg: S.primary10 },
      { icon: Users,        label: "独立玩家",   value: String(totalSessions),  note: totalSessions > 0 ? "测试会话数" : "暂无数据",   color: S.accent,   bg: S.accent10 },
      { icon: MousePointer, label: "选择总次数", value: String(totalChoices),   note: totalChoices > 0 ? `平均 ${Math.round(totalChoices / Math.max(totalSessions, 1))} 次/局` : "暂无数据",   color: S.warning,  bg: "rgba(217,119,6,0.08)" },
      { icon: Star,         label: "已发布作品", value: String(publishedCount), note: publishedCount > 0 ? "↗ 正在运营" : "尚未发布", color: S.purple2,  bg: "rgba(167,139,250,0.08)" },
    ];
  }, [analyticsSessions, projects]);

  // ── Per-project performance metrics (from analytics sessions) ────────────
  const performanceMetrics = useMemo(() => {
    const sessions = analyticsSessions;
    const totalPlays = sessions.length;
    const uniquePlayers = new Set(sessions.map(s => s.playerId)).size;
    const avgDuration = sessions.length > 0
      ? `${Math.round(sessions.reduce((sum, s) => sum + s.duration, 0) / sessions.length / 60)}min`
      : "--";
    return { totalPlays, uniquePlayers, avgDuration };
  }, [analyticsSessions]);

  // ── Core metrics (from live store) ────────────────────────────────────────
  const CORE_METRICS = [
    { label: "故事节点", value: storyNodes.length,  color: S.primary },
    { label: "分支路径", value: branchPaths.length, color: S.warning },
    { label: "角色数量", value: characters.length,  color: S.accent },
    { label: "连线数量", value: nodeEdges.length,   color: S.purple2 },
  ];

  // ── Delete handler ────────────────────────────────────────────────────────
  const handleDelete = (id: string, title: string) => {
    useProjectStore.getState().deleteProject(id);
    addToast({ type: "success", title: `已删除「${title}」` });
  };

  // ── Select project ────────────────────────────────────────────────────────
  const handleSelect = (id: string) => {
    useProjectStore.getState().setCurrentProject(id);
  };

  // ── Published projects (for Tab 2) ────────────────────────────────────────
  const publishedProjects = projects.filter(p => p.status === "published");

  return (
    <div className="min-h-svh overflow-y-auto" style={{ background: S.bg }}>
      <UpstreamReadiness currentPath={pathname} />

      {/* ── Pill tabs ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-4 pt-3">
        {TABS.map((tab, i) => {
          const TabIcon = tab.icon;
          const active = activeTab === i;
          return (
            <motion.button
              key={i}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab(i)}
              className="flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors"
              style={{
                background: active ? S.primary : S.s2,
                color: active ? "#fff" : S.text2,
                border: `1px solid ${active ? S.primary : S.border}`,
                boxShadow: active ? `0 2px 8px ${S.primary}30` : "none",
              }}
            >
              <TabIcon size={12} /> {tab.label}
            </motion.button>
          );
        })}
      </div>

      {/* ── Tab content ───────────────────────────────────────────────────── */}
      <div className="p-3">
        <AnimatePresence mode="wait">

          {/* ── Tab 0: 数据看板 ─────────────────────────────────────────────── */}
          {activeTab === 0 && (
            <motion.div key="tab0" {...FADE}>

              {/* Section title */}
              <div className="mb-3 flex items-center gap-2">
                <Clapperboard size={14} style={{ color: S.primary }} />
                <span className="text-sm font-semibold" style={{ color: S.text }}>
                  {projectName || "我的作品"} · 数据看板
                </span>
              </div>

              {/* Big stat cards */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                {STATS.map((stat, i) => {
                  const Icon = stat.icon;
                  return (
                    <motion.div
                      key={i}
                      whileHover={{ y: -2 }}
                      className="rounded-2xl p-3.5"
                      style={{ background: S.card, border: `1px solid ${S.border}` }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className="flex h-7 w-7 items-center justify-center rounded-lg"
                          style={{ background: stat.bg }}
                        >
                          <Icon size={14} style={{ color: stat.color }} />
                        </div>
                        <span className="text-xs" style={{ color: S.text3 }}>{stat.label}</span>
                      </div>
                      <div className="text-2xl font-bold" style={{ color: S.text }}>
                        {stat.value}
                      </div>
                      <div className="mt-1 text-xs" style={{ color: S.text3 }}>
                        {stat.note}
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Core metrics */}
              <div className="mb-2">
                <span className="text-xs font-semibold" style={{ color: S.text2 }}>核心指标</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {CORE_METRICS.map((m, i) => (
                  <div
                    key={i}
                    className="rounded-xl px-3 py-2.5 text-center"
                    style={{ background: S.card, border: `1px solid ${S.border}` }}
                  >
                    <div className="text-lg font-bold" style={{ color: m.color }}>{m.value}</div>
                    <div className="text-xs" style={{ color: S.text3 }}>{m.label}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── Tab 1: 作品管理 ─────────────────────────────────────────────── */}
          {activeTab === 1 && (
            <motion.div key="tab1" {...FADE}>

              {/* Header row */}
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-semibold" style={{ color: S.text }}>全部作品</span>
                <Link
                  href="/?action=new-project"
                  className="flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90"
                  style={{ background: S.primary }}
                >
                  <Plus size={12} /> 新建项目
                </Link>
              </div>

              {/* Project grid */}
              {projects.length === 0 ? (
                <div
                  className="flex flex-col items-center justify-center rounded-2xl py-14"
                  style={{ background: S.card, border: `1px solid ${S.border}` }}
                >
                  <BookOpen size={32} style={{ color: S.text3 }} />
                  <p className="mt-3 text-sm" style={{ color: S.text3 }}>暂无作品，点击「新建项目」开始创作</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {projects.map(p => {
                    const badge = STATUS_BADGE[p.status] || STATUS_BADGE.draft;
                    const isActive = p.id === currentProjectId;
                    return (
                      <motion.div
                        key={p.id}
                        whileHover={{ y: -3 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleSelect(p.id)}
                        className="group relative cursor-pointer rounded-2xl overflow-hidden"
                        style={{
                          background: S.card,
                          border: `1.5px solid ${isActive ? S.primary : S.border}`,
                          boxShadow: isActive ? `0 0 0 2px ${S.primary20}` : "none",
                        }}
                      >
                        {/* Cover */}
                        <div
                          className="relative h-24 w-full"
                          style={{ background: p.cover ? `url(${p.cover}) center/cover` : `linear-gradient(135deg, ${S.primary10}, ${S.accent10})` }}
                        >
                          {!p.cover && (
                            <div className="flex h-full w-full items-center justify-center">
                              <Clapperboard size={22} style={{ color: S.primary, opacity: 0.5 }} />
                            </div>
                          )}
                          {/* Status badge */}
                          <span
                            className="absolute top-2 right-2 rounded-full px-2 py-0.5 text-xs font-medium"
                            style={{ background: badge.bg, color: badge.color }}
                          >
                            {badge.label}
                          </span>
                        </div>

                        {/* Body */}
                        <div className="p-2.5">
                          <p className="text-xs font-semibold leading-tight truncate" style={{ color: S.text }}>
                            {p.title}
                          </p>
                          <p className="mt-0.5 text-xs truncate" style={{ color: S.text3 }}>{p.genre}</p>

                          {/* Stats row */}
                          <div className="mt-2 flex items-center gap-2 text-xs" style={{ color: S.text3 }}>
                            <span>{p.chapters}章</span>
                            <span>·</span>
                            <span>{p.nodes}节点</span>
                            <span>·</span>
                            <span>{p.branches}分支</span>
                          </div>
                        </div>

                        {/* Action buttons (hover reveal) */}
                        <div
                          className="absolute bottom-2 right-2 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100"
                        >
                          <Link
                            href="/nodes"
                            onClick={e => { e.stopPropagation(); handleSelect(p.id); }}
                            className="flex h-6 w-6 items-center justify-center rounded-full"
                            style={{ background: S.primary10 }}
                            title="编辑"
                          >
                            <Edit3 size={11} style={{ color: S.primary }} />
                          </Link>
                          <button
                            onClick={e => { e.stopPropagation(); handleDelete(p.id, p.title); }}
                            className="flex h-6 w-6 items-center justify-center rounded-full"
                            style={{ background: "rgba(220,38,38,0.08)" }}
                            title="删除"
                          >
                            <Trash2 size={11} style={{ color: S.error }} />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* ── Tab 2: 作品表现 ─────────────────────────────────────────────── */}
          {activeTab === 2 && (
            <motion.div key="tab2" {...FADE}>

              <div className="mb-3 flex items-center gap-2">
                <Star size={14} style={{ color: S.warning }} />
                <span className="text-sm font-semibold" style={{ color: S.text }}>作品表现</span>
              </div>

              {publishedProjects.length === 0 ? (
                <div
                  className="flex flex-col items-center justify-center rounded-2xl py-14"
                  style={{ background: S.card, border: `1px solid ${S.border}` }}
                >
                  <Star size={32} style={{ color: S.text3 }} />
                  <p className="mt-3 text-sm" style={{ color: S.text3 }}>
                    暂无已发布作品，发布后可在此查看表现数据
                  </p>
                  <Link
                    href="/publish"
                    className="mt-3 rounded-full px-4 py-1.5 text-xs font-medium text-white"
                    style={{ background: S.primary }}
                  >
                    前往发布
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {publishedProjects.map(p => {
                    const maxPlays = Math.max(...publishedProjects.map(pp => pp.nodes || 1), 1);
                    const barPct = Math.min(((p.nodes || 0) / maxPlays) * 100, 100);
                    const badge = STATUS_BADGE[p.status] || STATUS_BADGE.draft;
                    return (
                      <div
                        key={p.id}
                        className="rounded-2xl p-4"
                        style={{ background: S.card, border: `1px solid ${S.border}` }}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="text-sm font-semibold" style={{ color: S.text }}>{p.title}</p>
                            <p className="text-xs mt-0.5" style={{ color: S.text3 }}>{p.genre}</p>
                          </div>
                          <span
                            className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                            style={{ background: badge.bg, color: badge.color }}
                          >
                            {badge.label}
                          </span>
                        </div>

                        {/* Performance metrics */}
                        <div className="grid grid-cols-3 gap-3 mb-3">
                          <div className="rounded-xl py-2 text-center" style={{ background: S.s2 }}>
                            <div className="text-base font-bold" style={{ color: S.primary }}>{performanceMetrics.totalPlays}</div>
                            <div className="text-xs" style={{ color: S.text3 }}>游玩次数</div>
                          </div>
                          <div className="rounded-xl py-2 text-center" style={{ background: S.s2 }}>
                            <div className="text-base font-bold" style={{ color: S.accent }}>{performanceMetrics.uniquePlayers}</div>
                            <div className="text-xs" style={{ color: S.text3 }}>独立玩家</div>
                          </div>
                          <div className="rounded-xl py-2 text-center" style={{ background: S.s2 }}>
                            <div className="text-base font-bold" style={{ color: S.warning }}>{performanceMetrics.avgDuration}</div>
                            <div className="text-xs" style={{ color: S.text3 }}>平均时长</div>
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs" style={{ color: S.text3 }}>相对表现</span>
                            <span className="text-xs font-medium" style={{ color: S.primary }}>{Math.round(barPct)}%</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: S.s3 }}>
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${barPct}%` }}
                              transition={{ duration: 0.5, ease: "easeOut" }}
                              className="h-full rounded-full"
                              style={{ background: `linear-gradient(90deg, ${S.primary}, ${S.accent})` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
