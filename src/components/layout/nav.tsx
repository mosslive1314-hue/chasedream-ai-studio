"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Scissors, FileText, GitBranch, MousePointer,
  Network, Package, Play, Activity, Rocket, Users, Film,
  Settings, ChevronLeft, ChevronRight, ChevronDown,
} from "lucide-react";
import { INDUSTRY_LABELS, type IndustryType } from "@/lib/studio-data";
import { useUIStore } from "@/store";

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
  icon: typeof LayoutDashboard;
  label: string;
  labelKey?: string;
  disabled?: boolean;
};

const NAV: NavItem[] = [
  { href: "/",           icon: LayoutDashboard, label: "\u5DE5\u4F5C\u53F0" },
  { href: "/pipeline",   icon: GitBranch,       label: "\u5236\u4F5C\u7BA1\u7EBF", labelKey: "pipeline" },
  { href: "/parse",      icon: Scissors,        label: "\u5267\u672C\u89E3\u6784", labelKey: "parse" },
  { href: "/script",     icon: FileText,        label: "\u5267\u672C\u7F16\u8F91", labelKey: "script" },
  { href: "/interaction",icon: MousePointer,    label: "\u4E92\u52A8\u8BBE\u8BA1", labelKey: "interaction" },
  { href: "/nodes",      icon: Network,         label: "\u8282\u70B9\u56FE\u8C31", labelKey: "node" },
  { href: "/assets",     icon: Package,         label: "\u8D44\u4EA7\u5E93",   labelKey: "asset" },
  { href: "/simulator",  icon: Play,            label: "\u6F14\u51FA\u9884\u89C8", labelKey: "simulator" },
  { href: "/cinematic",  icon: Film,            label: "\u6F14\u51FA\u8BBE\u8BA1", labelKey: "cinematic" },
  { href: "/overview",   icon: Activity,        label: "\u8D28\u68C0\u603B\u89C8", labelKey: "overview" },
  { href: "/publish",    icon: Rocket,          label: "\u53D1\u5E03",     labelKey: "publish" },
  { href: "/collab",     icon: Users,           label: "\u534F\u4F5C", disabled: true },
];

// ── P10-8: Navigation Groups ────────────────────────────────────────────
// Reorganize flat NAV into 4 collapsible groups.
// Group labels adapt to industry (game / tourism / education / derivative).
type NavGroup = {
  label: string;
  labelKey: string;
  icon: typeof LayoutDashboard;
  items: NavItem[];
  industryLabels: Record<IndustryType, string>;
};

const NAV_GROUPS: NavGroup[] = [
  {
    label: "\u5185\u5BB9", labelKey: "content", icon: LayoutDashboard,
    industryLabels: { game: "\u5185\u5BB9", tourism: "\u5185\u5BB9", education: "\u5185\u5BB9", derivative: "\u5185\u5BB9" },
    items: [NAV[0], NAV[1]],
  },
  {
    label: "\u521B\u4F5C", labelKey: "creation", icon: FileText,
    industryLabels: { game: "\u521B\u4F5C", tourism: "\u4F53\u9A8C\u8BBE\u8BA1", education: "\u8BFE\u7A0B\u8BBE\u8BA1", derivative: "\u5267\u60C5\u8BBE\u8BA1" },
    items: [NAV[2], NAV[3], NAV[4]],
  },
  {
    label: "\u8BBE\u8BA1", labelKey: "design", icon: Network,
    industryLabels: { game: "\u8BBE\u8BA1", tourism: "\u8DEF\u7EBF\u8BBE\u8BA1", education: "\u7D20\u6750\u8BBE\u8BA1", derivative: "\u6F14\u51FA\u8BBE\u8BA1" },
    items: [NAV[5], NAV[6], NAV[7], NAV[8]],
  },
  {
    label: "\u4EA4\u4ED8", labelKey: "delivery", icon: Rocket,
    industryLabels: { game: "\u4EA4\u4ED8", tourism: "\u4EA4\u4ED8", education: "\u4EA4\u4ED8", derivative: "\u4EA4\u4ED8" },
    items: [NAV[9], NAV[10], NAV[11]],
  },
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
  return path.startsWith(href);
}

function getLabel(item: NavItem, industry: IndustryType): string {
  if (!item.labelKey) return item.label;
  const industryLabel = INDUSTRY_LABELS[item.labelKey]?.[industry];
  if (!industryLabel) return item.label;
  if (item.labelKey === "asset") return industryLabel + "\u5E93";
  return industryLabel;
}

function getGroupLabel(group: NavGroup, industry: IndustryType): string {
  return group.industryLabels[industry] || group.label;
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

      {/* 4 group icon tabs */}
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
  const { sidebarCollapsed, toggleSidebar, industry, setIndustry } =
    useUIStore();
  const open = !sidebarCollapsed;

  const [tooltip, setTooltip] = useState<string | null>(null);
  const [showIndustryPicker, setShowIndustryPicker] = useState(false);

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

  const handleIndustryChange = (newIndustry: IndustryType) => {
    setIndustry(newIndustry);
    setShowIndustryPicker(false);
  };

  const currentIndustryIcon =
    INDUSTRY_ICONS.find((i) => i.type === industry)?.icon || "\u{1F3AE}";

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
        </div>

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
                  </motion.button>
                )}
              </div>
            );
          })}
        </nav>

        {/* Settings */}
        <div
          className="px-2 py-2 border-t shrink-0"
          style={{ borderColor: "#E2E5F0" }}
        >
          <Link href="/settings" title={"\u8BBE\u7F6E"}>
            <motion.div
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl cursor-pointer"
            >
              <Settings
                size={15}
                strokeWidth={1.8}
                style={{ color: "#9198B5", flexShrink: 0 }}
              />
              <AnimatePresence>
                {open && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.16 }}
                    className="text-xs font-medium overflow-hidden whitespace-nowrap"
                    style={{ color: "#9198B5" }}
                  >
                    {"\u8BBE\u7F6E"}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.div>
          </Link>

          {/* Industry picker */}
          <div className="relative mt-1">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() =>
                open && setShowIndustryPicker(!showIndustryPicker)
              }
              className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl cursor-pointer w-full transition-colors"
              style={{
                background: showIndustryPicker
                  ? "rgba(94,80,232,0.06)"
                  : "transparent",
              }}
            >
              <span className="text-sm shrink-0">
                {currentIndustryIcon}
              </span>
              <AnimatePresence>
                {open && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.16 }}
                    className="text-[10px] font-medium truncate overflow-hidden whitespace-nowrap"
                    style={{ color: "#9198B5" }}
                  >
                    {INDUSTRY_LABELS.pipeline[industry]}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>

            {/* Industry picker popup (expanded) */}
            <AnimatePresence>
              {showIndustryPicker && open && (
                <motion.div
                  initial={{ opacity: 0, y: 4, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 bottom-full mb-1 z-50 p-1 rounded-xl shadow-lg"
                  style={{
                    background: "#fff",
                    border: "1px solid #E2E5F0",
                    minWidth: 140,
                  }}
                >
                  {INDUSTRY_ICONS.map((item) => {
                    const active = industry === item.type;
                    return (
                      <motion.button
                        key={item.type}
                        whileHover={{ x: 2 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => handleIndustryChange(item.type)}
                        className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-left transition-colors"
                        style={{
                          background: active
                            ? "rgba(94,80,232,0.1)"
                            : "transparent",
                        }}
                      >
                        <span className="text-sm">{item.icon}</span>
                        <span
                          className="text-[10px] font-medium"
                          style={{
                            color: active ? "#5E50E8" : "#1A1D2E",
                          }}
                        >
                          {INDUSTRY_LABELS.pipeline[item.type]}
                        </span>
                      </motion.button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Collapsed: mini industry icons */}
            {!open && (
              <div className="flex flex-col items-center gap-0.5 mt-1">
                {INDUSTRY_ICONS.map((item) => {
                  const active = industry === item.type;
                  return (
                    <motion.button
                      key={item.type}
                      whileTap={{ scale: 0.85 }}
                      onClick={() => handleIndustryChange(item.type)}
                      className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] transition-colors"
                      style={{
                        background: active
                          ? "rgba(94,80,232,0.15)"
                          : "transparent",
                        border: active
                          ? "1px solid rgba(94,80,232,0.3)"
                          : "1px solid transparent",
                      }}
                    >
                      {item.icon}
                    </motion.button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Collapse / expand toggle */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={toggleSidebar}
          className="absolute bottom-16 right-[-12px] w-6 h-6 rounded-full flex items-center justify-center focus:outline-none z-40 shadow-sm"
          style={{ background: "#fff", border: "1px solid #E2E5F0" }}
        >
          {open ? (
            <ChevronLeft size={12} style={{ color: "#9198B5" }} />
          ) : (
            <ChevronRight size={12} style={{ color: "#9198B5" }} />
          )}
        </motion.button>
      </motion.aside>
    </>
  );
}
