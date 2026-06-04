"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Scissors, FileText, GitBranch, MousePointer,
  Network, Play, Activity, Rocket, Users, Film,
  Settings, ChevronLeft, ChevronRight, ChevronDown, BookOpen,
  Package, GitCompare, LogOut, UserRound,
  Image as ImageIcon, Video, Music, Database,
} from "lucide-react";
import { INDUSTRY_LABELS, type IndustryType } from "@/lib/studio-data";
import { useUIStore } from "@/store";
import { useNarrativeStore } from "@/store";
import { PipelineStatus } from "@/components/ui/PipelineStatus";
import { auth } from "@eazo/sdk";
import { useEazo } from "@eazo/sdk/react";

const W_OPEN = 200;
const W_CLOSED = 56;

const INDUSTRY_ICONS: { type: IndustryType; icon: string }[] = [
  { type: "game", icon: "\u{1F3AE}" },
  { type: "tourism", icon: "\u{1F3DB}\uFE0F" },
  { type: "education", icon: "\u{1F393}" },
  { type: "derivative", icon: "\u{1F3AC}" },
];

type NavItem = {
  href: string;
  icon: typeof Scissors;
  label: string;
  labelKey?: string;
  disabled?: boolean;
};

const NAV: NavItem[] = [
  // 创作 (indices 0-2)
  { href: "/story-overview", icon: BookOpen,     label: "剧本总览", labelKey: "storyOverview" },  // 0
  { href: "/parse",          icon: Scissors,     label: "剧本解构", labelKey: "parse" },          // 1
  { href: "/script",         icon: FileText,     label: "剧本编辑", labelKey: "script" },         // 2
  // 设计 (indices 3-5)
  { href: "/interaction",    icon: MousePointer, label: "互动设计", labelKey: "interaction" },    // 3
  { href: "/cinematic",      icon: Film,         label: "演出设计", labelKey: "cinematic" },      // 4
  { href: "/nodes",          icon: Network,      label: "剧情节点", labelKey: "node" },           // 5
  // 资产 (indices 6-9) — 文本置首
  { href: "/assets?tab=text",  icon: FileText,   label: "文本" },                                 // 6
  { href: "/assets?tab=image", icon: ImageIcon,  label: "图片" },                                 // 7
  { href: "/assets?tab=audio", icon: Music,      label: "音频" },                                 // 8
  { href: "/assets?tab=video", icon: Video,      label: "视频" },                                 // 9
  // 交付 (indices 10-12)
  { href: "/simulator",      icon: Play,         label: "演出预览", labelKey: "simulator" },      // 10
  { href: "/overview",       icon: Activity,     label: "质检总览", labelKey: "overview" },       // 11
  { href: "/publish",        icon: Rocket,       label: "发布",     labelKey: "publish" },        // 12
];

// ── Navigation Groups ──────────────────────────────────────────────────
type NavGroup = {
  label: string;
  labelKey: string;
  icon: typeof Scissors;
  items: NavItem[];
  industryLabels: Record<IndustryType, string>;
};

const NAV_GROUPS: NavGroup[] = [
  {
    label: "创作", labelKey: "creation", icon: FileText,
    industryLabels: { game: "创作", tourism: "体验设计", education: "课程设计", derivative: "剧情设计" },
    items: [NAV[0], NAV[1], NAV[2]],
  },
  {
    label: "设计", labelKey: "design", icon: Network,
    industryLabels: { game: "设计", tourism: "路线设计", education: "素材设计", derivative: "演出设计" },
    items: [NAV[3], NAV[4], NAV[5]],  // 互动设计, 演出设计, 剧情节点
  },
  {
    label: "资产", labelKey: "asset", icon: Package,
    industryLabels: { game: "资产", tourism: "资产", education: "资产", derivative: "资产" },
    items: [NAV[6], NAV[7], NAV[8], NAV[9],
      { href: "/asset-library", icon: Database, label: "资产库" }],  // 文本, 图片, 音频, 视频, 资产库
  },
  {
    label: "交付", labelKey: "delivery", icon: Rocket,
    industryLabels: { game: "交付", tourism: "交付", education: "交付", derivative: "交付" },
    items: [NAV[10], NAV[11], NAV[12]],  // 演出预览, 质检总览, 发布
  },
];

// ── Bottom utility tools (below main nav groups) ────────────────────────
const BOTTOM_TOOLS: NavItem[] = [
  { href: "/collab",        icon: Users,      label: "协作" },
  { href: "/version",       icon: GitCompare, label: "版本管理" },
];

// ── P10-13: Orphan Page Integration ─────────────────────────────────────
// The following routes exist as pages but are intentionally excluded from
// navigation. They will be integrated INTO their parent pages:
//
//   /node-canvas      -> merges into /nodes       as "fullscreen canvas mode"
//   /interaction-canvas -> merges into /interaction as "fullscreen canvas mode"
//   /asset-canvas     -> merges into /assets      as "fullscreen canvas mode"
//   /settings         -> remains accessible via gear icon at sidebar bottom
//
// TODO (P10-13): Implement the actual page merges when building out each
// parent screen. No nav entries needed for these routes.

/* ── Helpers ────────────────────────────────────────────────────────────── */

function isActive(href: string, path: string) {
  if (href === "/") return path === "/";
  // Handle query params: /assets?tab=image should only match that exact query
  if (href.includes("?")) {
    return path === href || path.startsWith(href + "&");
  }
  // For routes without query, check that we don't accidentally match query-param routes
  if (path.includes("?")) {
    const basePath = path.split("?")[0];
    return basePath === href || basePath.startsWith(href + "/");
  }
  return path.startsWith(href);
}

function getLabel(item: NavItem, industry: IndustryType): string {
  if (!item.labelKey) return item.label;
  const industryLabel = INDUSTRY_LABELS[item.labelKey]?.[industry];
  if (!industryLabel) return item.label;
  return industryLabel;
}

function getGroupLabel(group: NavGroup, industry: IndustryType): string {
  return group.industryLabels[industry] || group.label;
}

/* ── Pipeline progress helpers ──────────────────────────────────────────── */

// Map sidebar nav group keys → pipeline stage linkedPage routes
const GROUP_STAGE_ROUTES: Record<string, string[]> = {
  creation: ["/my-works", "/parse", "/script", "/story-overview"],
  design:   ["/interaction", "/cinematic", "/nodes"],
  asset:    ["/assets", "/asset-library"],
  delivery: ["/simulator", "/overview", "/publish"],
};

type GroupProgress = { pct: number; status: "done" | "active" | "upcoming" };

function calcGroupProgress(
  stages: { linkedPage?: string; status: string; progress: number }[],
  groupKey: string,
): GroupProgress {
  const routes = GROUP_STAGE_ROUTES[groupKey];
  if (!routes) return { pct: 0, status: "upcoming" };
  const matched = stages.filter(s => s.linkedPage && routes.includes(s.linkedPage));
  if (matched.length === 0) return { pct: 0, status: "upcoming" };
  const avgPct = Math.round(matched.reduce((sum, s) => sum + s.progress, 0) / matched.length);
  const hasActive = matched.some(s => s.status === "active");
  const allDone = matched.every(s => s.status === "completed");
  return { pct: avgPct, status: allDone ? "done" : hasActive ? "active" : "upcoming" };
}

/* ── Pipeline Mini Nav ──────────────────────────────────────────────────── */

function PipelineMiniNav({
  stages,
  open,
}: {
  stages: { id: string; order: number; name: string; icon: string; status: string; progress: number; linkedPage?: string }[];
  open: boolean;
}) {
  const industry = useUIStore(s => s.industry);
  const setIndustry = useUIStore(s => s.setIndustry);
  const [industryDropdownOpen, setIndustryDropdownOpen] = useState(false);

  const INDUSTRY_ICONS_LOCAL: { type: IndustryType; icon: string }[] = [
    { type: "game", icon: "\u{1F3AE}" },
    { type: "tourism", icon: "\u{1F3DB}\uFE0F" },
    { type: "education", icon: "\u{1F393}" },
    { type: "derivative", icon: "\u{1F3AC}" },
  ];
  const currentIcon = INDUSTRY_ICONS_LOCAL.find(i => i.type === industry)?.icon || "\u{1F3AE}";

  const overallPct = stages.length > 0
    ? Math.round(stages.reduce((sum, s) => sum + s.progress, 0) / stages.length)
    : 0;

  // 4 group progress
  const GROUPS = [
    { key: "creation", label: "创作", routes: ["/my-works", "/parse", "/script", "/story-overview"] },
    { key: "design",   label: "设计", routes: ["/interaction", "/cinematic", "/nodes"] },
    { key: "asset",    label: "资产", routes: ["/assets", "/asset-library"] },
    { key: "delivery", label: "交付", routes: ["/simulator", "/overview", "/publish"] },
  ];
  const groupProgress = GROUPS.map(g => {
    const matched = stages.filter(s => s.linkedPage && g.routes.includes(s.linkedPage));
    if (matched.length === 0) return { ...g, pct: 0, color: "#CBD0E5" };
    const avg = Math.round(matched.reduce((s, st) => s + st.progress, 0) / matched.length);
    const allDone = matched.every(s => s.status === "completed");
    const hasActive = matched.some(s => s.status === "active");
    const color = allDone ? "#059669" : hasActive ? "#5E50E8" : "#CBD0E5";
    return { ...g, pct: avg, color };
  });

  if (!open) {
    return (
      <div className="flex flex-col items-center py-2" title={`管线进度 ${overallPct}%`}>
        <div className="w-[3px] h-8 rounded-full overflow-hidden" style={{ background: "#E2E5F0" }}>
          <motion.div
            initial={{ height: 0 }} animate={{ height: `${overallPct}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="w-full rounded-full" style={{ background: "#5E50E8" }}
          />
        </div>
        <span className="text-[7px] font-bold mt-0.5 tabular-nums" style={{ color: "#5E50E8" }}>
          {overallPct}
        </span>
      </div>
    );
  }

  return (
    <div className="px-1 py-1.5">
      {/* Header */}
      <div className="flex items-center gap-1.5 w-full px-2 py-1.5 rounded-lg">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <div className="w-4 h-4 rounded-md flex items-center justify-center shrink-0"
            style={{ background: "rgba(94,80,232,0.12)" }}>
            <span className="text-[8px]">🎬</span>
          </div>
          <span className="text-[10px] font-semibold truncate" style={{ color: "#1A1D2E" }}>
            制作管线
          </span>
        </div>

        {/* Industry switcher */}
        <div className="relative shrink-0">
          <motion.button
            whileTap={{ scale: 0.93 }}
            onClick={() => setIndustryDropdownOpen(v => !v)}
            className="flex items-center gap-0.5 px-1 py-0.5 rounded text-[8px] font-medium focus:outline-none"
            style={{ color: "#5E50E8", background: "rgba(94,80,232,0.08)" }}
            title={`当前场景：${INDUSTRY_LABELS.pipeline[industry]}`}
          >
            <span className="text-[9px]">{currentIcon}</span>
            <ChevronDown size={7} />
          </motion.button>
          <AnimatePresence>
            {industryDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 4, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.96 }}
                transition={{ duration: 0.12 }}
                className="absolute right-0 top-full mt-1 z-50 p-0.5 rounded-lg shadow-lg"
                style={{ background: "#fff", border: "1px solid #E2E5F0", minWidth: 100 }}
              >
                {INDUSTRY_ICONS_LOCAL.map(item => (
                  <motion.button
                    key={item.type}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => { setIndustry(item.type); setIndustryDropdownOpen(false); }}
                    className="flex items-center gap-1.5 w-full px-2 py-1 rounded text-left"
                    style={{ background: industry === item.type ? "rgba(94,80,232,0.1)" : "transparent" }}
                  >
                    <span className="text-[10px]">{item.icon}</span>
                    <span className="text-[9px] font-medium" style={{ color: industry === item.type ? "#5E50E8" : "#1A1D2E" }}>
                      {INDUSTRY_LABELS.pipeline[item.type]}
                    </span>
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <div className="w-10 h-[3px] rounded-full overflow-hidden" style={{ background: "#E2E5F0" }}>
            <motion.div
              initial={{ width: 0 }} animate={{ width: `${overallPct}%` }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="h-full rounded-full" style={{ background: "#5E50E8" }}
            />
          </div>
          <span className="text-[8px] font-bold tabular-nums" style={{ color: "#5E50E8" }}>
            {overallPct}%
          </span>
        </div>
      </div>

      {/* 4 group progress bars */}
      <div className="space-y-1 px-2 pt-1 pb-1.5">
        {groupProgress.map(g => (
          <div key={g.key} className="flex items-center gap-1.5">
            <span className="text-[8px] font-medium w-5 shrink-0" style={{ color: "#4A5068" }}>
              {g.label}
            </span>
            <div className="flex-1 h-[3px] rounded-full overflow-hidden" style={{ background: "#E2E5F0" }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${g.pct}%` }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="h-full rounded-full"
                style={{ background: g.color }}
              />
            </div>
            <span className="text-[7px] font-bold tabular-nums w-6 text-right" style={{ color: g.color }}>
              {g.pct}%
            </span>
          </div>
        ))}
      </div>

      {/* Link to full pipeline */}
      <Link href="/pipeline">
        <motion.div
          whileTap={{ scale: 0.97 }}
          className="flex items-center justify-center gap-1 px-2 py-1 rounded-md cursor-pointer transition-colors mx-1"
          style={{ background: "rgba(94,80,232,0.06)", color: "#5E50E8" }}
        >
          <span className="text-[8px] font-medium">查看详细管线</span>
          <ChevronRight size={8} />
        </motion.div>
      </Link>
    </div>
  );
}

/* ── Mobile Bottom Nav (P10-14) ─────────────────────────────────────────── */

export function BottomNav() {
  const path = usePathname();
  const industry = useUIStore((s) => s.industry);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  // Find which group contains the current active item
  const activeGroupKey = NAV_GROUPS.find((g) =>
    g.items.some((item) => isActive(item.href, path))
  )?.labelKey ?? null;

  // Auto-collapse expand bar when navigating to a different group
  useEffect(() => {
    if (activeGroupKey !== expandedGroup) {
      setExpandedGroup(null);
    }
  }, [path]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleGroup = (key: string) => {
    setExpandedGroup((prev) => (prev === key ? null : key));
  };

  const activeGroupItems =
    NAV_GROUPS.find((g) => g.labelKey === expandedGroup)?.items ?? [];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-20 md:hidden">
      {/* Expandable items bar above the bottom nav */}
      <AnimatePresence>
        {expandedGroup && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
            style={{
              background: "#fff",
              borderTop: "1px solid #E2E5F0",
            }}
          >
            <div className="flex overflow-x-auto gap-1 px-2 py-2">
              {activeGroupItems.map((item) => {
                const active = isActive(item.href, path);
                if (item.disabled) {
                  return (
                    <div
                      key={item.href}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full shrink-0 opacity-50"
                      style={{
                        background: "#F0F1F6",
                      }}
                    >
                      <item.icon
                        size={13}
                        strokeWidth={1.6}
                        style={{ color: "#9198B5" }}
                      />
                      <span
                        className="text-[10px] font-medium whitespace-nowrap"
                        style={{ color: "#9198B5" }}
                      >
                        {getLabel(item, industry)}
                      </span>
                    </div>
                  );
                }
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full shrink-0 transition-colors"
                    style={{
                      background: active
                        ? "rgba(94,80,232,0.12)"
                        : "#F0F1F6",
                    }}
                    onClick={() => setExpandedGroup(null)}
                  >
                    <item.icon
                      size={13}
                      strokeWidth={active ? 2.2 : 1.6}
                      style={{
                        color: active ? "#5E50E8" : "#5A5F7A",
                      }}
                    />
                    <span
                      className="text-[10px] font-medium whitespace-nowrap"
                      style={{
                        color: active ? "#5E50E8" : "#5A5F7A",
                      }}
                    >
                      {getLabel(item, industry)}
                    </span>
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3 group icon tabs */}
      <nav
        className="flex"
        style={{
          background: "#fff",
          borderTop: "1px solid #E2E5F0",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        {NAV_GROUPS.map((group) => {
          const isGroupActive =
            group.labelKey === activeGroupKey ||
            group.labelKey === expandedGroup;
          const isExpanded = expandedGroup === group.labelKey;
          return (
            <motion.button
              key={group.labelKey}
              whileTap={{ scale: 0.85 }}
              onClick={() => toggleGroup(group.labelKey)}
              className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 relative focus:outline-none"
            >
              {isGroupActive && (
                <motion.div
                  layoutId="bot-group-tab"
                  className="absolute -top-[1px] left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full"
                  style={{ background: "#5E50E8" }}
                />
              )}
              <group.icon
                size={19}
                strokeWidth={isGroupActive ? 2.5 : 1.8}
                style={{ color: isGroupActive ? "#5E50E8" : "#9198B5" }}
              />
              <motion.span
                key={`${group.labelKey}-${industry}`}
                initial={{ opacity: 0, y: 2 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15 }}
                className="text-[8px] font-medium"
                style={{ color: isGroupActive ? "#5E50E8" : "#9198B5" }}
              >
                {getGroupLabel(group, industry)}
              </motion.span>
              {isExpanded && (
                <motion.div
                  layoutId="bot-group-expand"
                  className="absolute -bottom-[1px] left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                  style={{ background: "#5E50E8" }}
                />
              )}
            </motion.button>
          );
        })}
      </nav>
    </div>
  );
}

/* ── Desktop Sidebar (P10-8) ───────────────────────────────────────────── */

export function SideNav() {
  const path = usePathname();
  const { sidebarCollapsed, toggleSidebar, industry } =
    useUIStore();
  const pipelineStages = useNarrativeStore(s => s.pipelineStages);
  const open = !sidebarCollapsed;

  const [tooltip, setTooltip] = useState<string | null>(null);

  // Track which groups are expanded; auto-expand group containing active route
  const [expandedGroups, setExpandedGroups] = useState<string[]>(() => {
    const initial: string[] = [];
    NAV_GROUPS.forEach((group) => {
      if (group.items.some((item) => isActive(item.href, path))) {
        initial.push(group.labelKey);
      }
    });
    return initial.length > 0 ? initial : [NAV_GROUPS[0].labelKey];
  });

  // Auto-expand group when path changes to a new group
  useEffect(() => {
    const activeGroup = NAV_GROUPS.find((group) =>
      group.items.some((item) => isActive(item.href, path))
    );
    if (activeGroup && !expandedGroups.includes(activeGroup.labelKey)) {
      setExpandedGroups((prev) => [...prev, activeGroup.labelKey]);
    }
  }, [path]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleGroup = (labelKey: string) => {
    setExpandedGroups((prev) =>
      prev.includes(labelKey)
        ? prev.filter((k) => k !== labelKey)
        : [...prev, labelKey]
    );
  };

  const w = open ? W_OPEN : W_CLOSED;

  return (
    <>
      <motion.aside
        animate={{ width: w }}
        transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
        className="hidden md:flex flex-col min-h-svh fixed left-0 top-0 z-30 overflow-hidden"
        style={{ background: "#F8F9FC", borderRight: "1px solid #E2E5F0" }}
      >
        {/* Logo */}
        <div
          className="flex items-center gap-2.5 px-3 py-4 border-b shrink-0"
          style={{ borderColor: "#E2E5F0", minHeight: 60 }}
        >
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: "linear-gradient(135deg,#5E50E8,#A78BFA)",
            }}
          >
            <span className="text-white text-sm font-black">
              {"\u9010"}
            </span>
          </div>
          <AnimatePresence>
            {open && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.18 }}
                className="text-xs font-bold truncate overflow-hidden whitespace-nowrap"
                style={{ color: "#1A1D2E" }}
              >
                {"\u9010\u68A6 Creator"}
              </motion.span>
            )}
          </AnimatePresence>
          {/* Alternative collapse button in header */}
          <AnimatePresence>
            {open && (
              <motion.button
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.18 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleSidebar}
                className="ml-auto shrink-0 w-6 h-6 rounded-lg flex items-center justify-center focus:outline-none transition-colors hover:bg-gray-100 overflow-hidden"
                title="收起侧边栏"
              >
                <ChevronLeft size={14} style={{ color: "#9198B5" }} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Pipeline Mini Nav — compact 12-stage progress */}
        <PipelineMiniNav stages={pipelineStages} open={open} />

        {/* Navigation groups */}
        <nav className="flex-1 py-2 px-2 space-y-1 overflow-y-auto">
          {NAV_GROUPS.map((group) => {
            const isExpanded = expandedGroups.includes(group.labelKey);
            const hasActiveItem = group.items.some((item) =>
              isActive(item.href, path)
            );

            return (
              <div key={group.labelKey}>
                {/* Group header */}
                {open ? (
                  <button
                    onClick={() => toggleGroup(group.labelKey)}
                    className="flex items-center gap-1.5 w-full px-2 py-1 rounded-lg text-left transition-colors focus:outline-none"
                    style={{
                      background: "transparent",
                    }}
                  >
                    <group.icon
                      size={12}
                      strokeWidth={hasActiveItem ? 2.5 : 1.6}
                      style={{
                        color: hasActiveItem ? "#5E50E8" : "#9198B5",
                        flexShrink: 0,
                      }}
                    />
                    <span
                      className="text-[10px] font-semibold uppercase tracking-wider flex-1"
                      style={{
                        color: hasActiveItem ? "#5E50E8" : "#9198B5",
                      }}
                    >
                      {getGroupLabel(group, industry)}
                    </span>
                    {/* Pipeline micro progress */}
                    {(() => {
                      const gp = calcGroupProgress(pipelineStages, group.labelKey);
                      const barColor = gp.status === "done" ? "#059669" : gp.status === "active" ? "#5E50E8" : "#CBD0E5";
                      return (
                        <div className="flex items-center gap-1 shrink-0" title={`进度 ${gp.pct}%`}>
                          <div className="w-8 h-[3px] rounded-full overflow-hidden" style={{ background: "#E2E5F0" }}>
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${gp.pct}%` }}
                              transition={{ duration: 0.4, ease: "easeOut" }}
                              className="h-full rounded-full"
                              style={{ background: barColor }}
                            />
                          </div>
                          <span className="text-[8px] font-bold tabular-nums" style={{ color: barColor, minWidth: 18, textAlign: "right" }}>
                            {gp.pct}%
                          </span>
                        </div>
                      );
                    })()}
                    <motion.div
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown
                        size={10}
                        style={{ color: "#9198B5" }}
                      />
                    </motion.div>
                  </button>
                ) : null}

                {/* Group items (expanded sidebar) */}
                <AnimatePresence initial={false}>
                  {open && isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{
                        duration: 0.2,
                        ease: [0.4, 0, 0.2, 1],
                      }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-0.5 pl-0.5">
                        {group.items.map((item) => {
                          const active = isActive(item.href, path);
                          const displayLabel = getLabel(
                            item,
                            industry
                          );

                          /* disabled placeholder with tooltip */
                          if (item.disabled) {
                            return (
                              <div
                                key={item.href}
                                className="relative"
                              >
                                <motion.div
                                  whileTap={{ scale: 0.97 }}
                                  onClick={() =>
                                    setTooltip(
                                      tooltip === item.href
                                        ? null
                                        : item.href
                                    )
                                  }
                                  className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl cursor-pointer transition-colors"
                                  style={{
                                    background: "transparent",
                                    border: "1px solid transparent",
                                    opacity: 0.5,
                                  }}
                                >
                                  <item.icon
                                    size={16}
                                    strokeWidth={1.8}
                                    style={{
                                      color: "#9198B5",
                                      flexShrink: 0,
                                    }}
                                  />
                                  <AnimatePresence>
                                    {open && (
                                      <motion.span
                                        initial={{
                                          opacity: 0,
                                          width: 0,
                                        }}
                                        animate={{
                                          opacity: 1,
                                          width: "auto",
                                        }}
                                        exit={{
                                          opacity: 0,
                                          width: 0,
                                        }}
                                        transition={{
                                          duration: 0.16,
                                        }}
                                        className="text-xs font-medium truncate overflow-hidden whitespace-nowrap"
                                        style={{ color: "#9198B5" }}
                                      >
                                        {displayLabel}
                                      </motion.span>
                                    )}
                                  </AnimatePresence>
                                </motion.div>
                                {tooltip === item.href && (
                                  <div
                                    className="absolute left-full top-1/2 -translate-y-1/2 ml-2 z-50 px-2 py-1 rounded-lg text-[10px] font-medium whitespace-nowrap shadow-md"
                                    style={{
                                      background: "#1A1D2E",
                                      color: "#fff",
                                    }}
                                  >
                                    {"\u5373\u5C06\u4E0A\u7EBF"}
                                  </div>
                                )}
                              </div>
                            );
                          }

                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              title={displayLabel}
                              className="block"
                            >
                              <motion.div
                                whileTap={{ scale: 0.97 }}
                                className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl cursor-pointer transition-colors"
                                style={{
                                  background: active
                                    ? "rgba(94,80,232,0.1)"
                                    : "transparent",
                                  border: active
                                    ? "1px solid rgba(94,80,232,0.2)"
                                    : "1px solid transparent",
                                }}
                              >
                                <item.icon
                                  size={16}
                                  strokeWidth={active ? 2.5 : 1.8}
                                  style={{
                                    color: active
                                      ? "#5E50E8"
                                      : "#9198B5",
                                    flexShrink: 0,
                                  }}
                                />
                                <AnimatePresence>
                                  {open && (
                                    <AnimatePresence mode="wait">
                                      <motion.span
                                        key={`${item.labelKey || item.label}-${industry}`}
                                        initial={{
                                          opacity: 0,
                                          x: -4,
                                        }}
                                        animate={{
                                          opacity: 1,
                                          x: 0,
                                        }}
                                        exit={{
                                          opacity: 0,
                                          x: 4,
                                        }}
                                        transition={{
                                          duration: 0.16,
                                        }}
                                        className="text-xs font-medium truncate overflow-hidden whitespace-nowrap"
                                        style={{
                                          color: active
                                            ? "#5E50E8"
                                            : "#1A1D2E",
                                        }}
                                      >
                                        {displayLabel}
                                      </motion.span>
                                    </AnimatePresence>
                                  )}
                                </AnimatePresence>
                              </motion.div>
                            </Link>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Collapsed: group icon only */}
                {!open && (
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      toggleSidebar();
                      if (!expandedGroups.includes(group.labelKey)) {
                        setExpandedGroups((prev) => [
                          ...prev,
                          group.labelKey,
                        ]);
                      }
                    }}
                    className="w-full flex flex-col items-center justify-center py-2.5 rounded-xl cursor-pointer transition-colors focus:outline-none"
                    style={{
                      background: hasActiveItem
                        ? "rgba(94,80,232,0.1)"
                        : "transparent",
                      border: hasActiveItem
                        ? "1px solid rgba(94,80,232,0.15)"
                        : "1px solid transparent",
                    }}
                    title={getGroupLabel(group, industry)}
                  >
                    <group.icon
                      size={16}
                      strokeWidth={hasActiveItem ? 2.5 : 1.8}
                      style={{
                        color: hasActiveItem ? "#5E50E8" : "#9198B5",
                      }}
                    />
                    {/* Collapsed pipeline progress dot */}
                    {(() => {
                      const gp = calcGroupProgress(pipelineStages, group.labelKey);
                      const dotColor = gp.status === "done" ? "#059669" : gp.status === "active" ? "#5E50E8" : "transparent";
                      if (gp.status === "upcoming") return null;
                      return (
                        <div className="w-1.5 h-1.5 rounded-full mt-0.5" style={{ background: dotColor }} />
                      );
                    })()}
                  </motion.button>
                )}
              </div>
            );
          })}

          {/* Collapsed bottom tools */}
          {!open && (
            <div className="flex flex-col gap-1 mt-2 pt-2" style={{ borderTop: "1px solid #E2E5F0" }}>
              {BOTTOM_TOOLS.map((item) => (
                <motion.button
                  key={item.href}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    if (!item.disabled) {
                      window.location.href = item.href;
                    } else {
                      setTooltip(tooltip === item.href ? null : item.href);
                    }
                  }}
                  className="w-full flex items-center justify-center py-2 rounded-xl cursor-pointer transition-colors focus:outline-none relative"
                  style={{
                    background: "transparent",
                    opacity: item.disabled ? 0.5 : 1,
                  }}
                  title={item.label}
                >
                  <item.icon size={14} strokeWidth={1.8} style={{ color: "#9198B5" }} />
                  {tooltip === item.href && item.disabled && (
                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 z-50 px-2 py-1 rounded-lg text-[10px] font-medium whitespace-nowrap shadow-md"
                      style={{ background: "#1A1D2E", color: "#fff" }}>
                      即将上线
                    </div>
                  )}
                </motion.button>
              ))}
              {/* Settings icon (collapsed) */}
              <Link href="/settings" title="设置">
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className="w-full flex items-center justify-center py-2 rounded-xl cursor-pointer transition-colors"
                  style={{
                    background: isActive("/settings", path) ? "rgba(94,80,232,0.1)" : "transparent",
                  }}
                >
                  <Settings size={14} strokeWidth={1.8} style={{ color: isActive("/settings", path) ? "#5E50E8" : "#9198B5" }} />
                </motion.div>
              </Link>
            </div>
          )}
        </nav>

        {/* Bottom tools + Settings */}
        <div
          className="px-2 py-2 border-t shrink-0 space-y-0.5"
          style={{ borderColor: "#E2E5F0" }}
        >
          {/* Bottom utility tools */}
          {BOTTOM_TOOLS.map((item) => {
            const active = isActive(item.href, path);
            const displayLabel = getLabel(item, industry);

            if (item.disabled) {
              return (
                <div key={item.href} className="relative">
                  <motion.div
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setTooltip(tooltip === item.href ? null : item.href)}
                    className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl cursor-pointer transition-colors"
                    style={{ background: "transparent", border: "1px solid transparent", opacity: 0.5 }}
                  >
                    <item.icon size={14} strokeWidth={1.8} style={{ color: "#9198B5", flexShrink: 0 }} />
                    <AnimatePresence>
                      {open && (
                        <motion.span
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: "auto" }}
                          exit={{ opacity: 0, width: 0 }}
                          transition={{ duration: 0.16 }}
                          className="text-[11px] font-medium truncate overflow-hidden whitespace-nowrap"
                          style={{ color: "#9198B5" }}
                        >
                          {displayLabel}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.div>
                  {tooltip === item.href && (
                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 z-50 px-2 py-1 rounded-lg text-[10px] font-medium whitespace-nowrap shadow-md"
                      style={{ background: "#1A1D2E", color: "#fff" }}>
                      {"\u5373\u5C06\u4E0A\u7EBF"}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link key={item.href} href={item.href} title={displayLabel} className="block">
                <motion.div
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl cursor-pointer transition-colors"
                  style={{
                    background: active ? "rgba(94,80,232,0.1)" : "transparent",
                    border: active ? "1px solid rgba(94,80,232,0.2)" : "1px solid transparent",
                  }}
                >
                  <item.icon size={14} strokeWidth={active ? 2.5 : 1.8}
                    style={{ color: active ? "#5E50E8" : "#9198B5", flexShrink: 0 }} />
                  <AnimatePresence>
                    {open && (
                      <AnimatePresence mode="wait">
                        <motion.span
                          key={`${item.labelKey || item.label}-${industry}`}
                          initial={{ opacity: 0, x: -4 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 4 }}
                          transition={{ duration: 0.16 }}
                          className="text-[11px] font-medium truncate overflow-hidden whitespace-nowrap"
                          style={{ color: active ? "#5E50E8" : "#1A1D2E" }}
                        >
                          {displayLabel}
                        </motion.span>
                      </AnimatePresence>
                    )}
                  </AnimatePresence>
                </motion.div>
              </Link>
            );
          })}

          {/* Separator */}
          <div className="my-1.5 mx-2" style={{ height: 1, background: "#E2E5F0" }} />

          {/* Pipeline Status Widget (compact) */}
          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                className="overflow-hidden"
              >
                <PipelineStatus compact={true} showNextStep={true} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Separator after pipeline status */}
          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="my-1.5 mx-2"
                style={{ height: 1, background: "#E2E5F0" }}
              />
            )}
          </AnimatePresence>

          {/* Settings link */}
          <Link href="/settings" title={"设置"}>
            <motion.div
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl cursor-pointer transition-colors"
              style={{
                background: isActive("/settings", path) ? "rgba(94,80,232,0.1)" : "transparent",
                border: isActive("/settings", path) ? "1px solid rgba(94,80,232,0.2)" : "1px solid transparent",
              }}
            >
              <Settings
                size={14}
                strokeWidth={isActive("/settings", path) ? 2.5 : 1.8}
                style={{ color: isActive("/settings", path) ? "#5E50E8" : "#9198B5", flexShrink: 0 }}
              />
              <AnimatePresence>
                {open && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.16 }}
                    className="text-[11px] font-medium overflow-hidden whitespace-nowrap"
                    style={{ color: isActive("/settings", path) ? "#5E50E8" : "#9198B5" }}
                  >
                    设置
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.div>
          </Link>

          {/* User profile */}
          <SidebarUserProfile open={open} />
        </div>

        {/* Collapse / expand toggle */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={toggleSidebar}
          className="group absolute bottom-16 right-[-14px] w-7 h-7 rounded-full flex items-center justify-center focus:outline-none z-40 shadow-md hover:shadow-lg transition-shadow"
          style={{ background: "#fff", border: "1.5px solid #D0D4E4" }}
          title={open ? "收起侧边栏" : "展开侧边栏"}
        >
          {open ? (
            <ChevronLeft size={16} strokeWidth={2.5} style={{ color: "#7C7FA0" }} />
          ) : (
            <ChevronRight size={16} strokeWidth={2.5} style={{ color: "#7C7FA0" }} />
          )}
          {/* Hover tooltip */}
          {open && (
            <span className="absolute left-full ml-2 px-2 py-1 rounded-lg text-[10px] font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-md"
              style={{ background: "#1A1D2E", color: "#fff" }}>
              收起侧边栏
            </span>
          )}
        </motion.button>
      </motion.aside>
    </>
  );
}

/* ── Sidebar User Profile (compact) ───────────────────────────────────── */

function SidebarUserProfile({ open }: { open: boolean }) {
  const user = useEazo((s) => s.auth.user);
  const loading = useEazo((s) => s.auth.loading);
  const [menuOpen, setMenuOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-2.5 py-2">
        <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: "#E2E5F0", borderTopColor: "#5E50E8" }} />
      </div>
    );
  }

  if (!user) {
    return (
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => auth.login().catch(() => undefined)}
        className="flex items-center gap-2 px-2.5 py-2 rounded-xl w-full transition-colors hover:bg-gray-50"
      >
        <UserRound size={14} style={{ color: "#9198B5" }} />
        <AnimatePresence>
          {open && (
            <motion.span
              initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: "auto" }} exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.16 }}
              className="text-[11px] font-medium overflow-hidden whitespace-nowrap"
              style={{ color: "#9198B5" }}
            >
              登录
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    );
  }

  const displayName = user.name ?? user.email ?? user.id;
  const initial = (displayName ?? "?")[0].toUpperCase();
  const avatarSrc = user.avatarUrl
    ? user.avatarUrl.startsWith("//") ? `https:${user.avatarUrl}` : user.avatarUrl
    : null;

  return (
    <div className="relative">
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => open && setMenuOpen(o => !o)}
        className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl cursor-pointer w-full transition-colors hover:bg-gray-50"
      >
        {avatarSrc ? (
          <Image src={avatarSrc} alt={displayName ?? "avatar"} width={20} height={20}
            className="rounded-full object-cover shrink-0" style={{ width: 20, height: 20 }} />
        ) : (
          <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
            style={{ background: "rgba(94,80,232,0.15)" }}>
            <span className="text-[9px] font-bold" style={{ color: "#5E50E8" }}>{initial}</span>
          </div>
        )}
        <AnimatePresence>
          {open && (
            <motion.span
              initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: "auto" }} exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.16 }}
              className="text-[11px] font-medium truncate overflow-hidden whitespace-nowrap flex-1 text-left"
              style={{ color: "#1A1D2E" }}
            >
              {displayName}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* User dropdown menu */}
      <AnimatePresence>
        {menuOpen && open && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 bottom-full mb-1 z-50 p-1 rounded-xl shadow-lg w-[180px]"
            style={{ background: "#fff", border: "1px solid #E2E5F0" }}
          >
            <div className="px-2.5 py-2 border-b" style={{ borderColor: "#E2E5F0" }}>
              <p className="text-xs font-semibold truncate" style={{ color: "#1A1D2E" }}>{user.name ?? "—"}</p>
              {user.email && <p className="text-[10px] truncate mt-0.5" style={{ color: "#8892B0" }}>{user.email}</p>}
            </div>
            <button
              onClick={() => { auth.logout(); setMenuOpen(false); }}
              className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-left transition-colors hover:bg-gray-50"
            >
              <LogOut size={12} style={{ color: "#9198B5" }} />
              <span className="text-[11px] font-medium" style={{ color: "#4A5068" }}>退出登录</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
