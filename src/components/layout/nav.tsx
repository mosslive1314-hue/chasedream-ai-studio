"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Scissors, FileText, GitBranch, MousePointer,
  Network, Package, Play, Activity, Rocket, Users, Film,
  Settings, ChevronLeft, ChevronRight
} from "lucide-react";
import { INDUSTRY_LABELS, type IndustryType } from "@/lib/studio-data";

const W_OPEN = 200;
const W_CLOSED = 56;

const INDUSTRY_ICONS: { type: IndustryType; icon: string }[] = [
  { type: 'game', icon: '🎮' },
  { type: 'tourism', icon: '🏛️' },
  { type: 'education', icon: '🎓' },
  { type: 'derivative', icon: '🎬' },
];

type NavItem = { href: string; icon: typeof LayoutDashboard; label: string; labelKey?: string; disabled?: boolean };

const NAV: NavItem[] = [
  { href: "/",           icon: LayoutDashboard, label: "工作台"   },
  { href: "/pipeline",   icon: GitBranch,       label: "制作管线", labelKey: "pipeline" },
  { href: "/parse",      icon: Scissors,        label: "剧本解构", labelKey: "parse" },
  { href: "/script",     icon: FileText,        label: "剧本编辑", labelKey: "script" },
  { href: "/interaction",icon: MousePointer,    label: "互动设计", labelKey: "interaction" },
  { href: "/nodes",      icon: Network,         label: "节点图谱", labelKey: "node" },
  { href: "/assets",     icon: Package,         label: "资产库",   labelKey: "asset" },
  { href: "/simulator",  icon: Play,            label: "演出预览", labelKey: "simulator" },
  { href: "/cinematic",  icon: Film,            label: "演出设计", labelKey: "cinematic" },
  { href: "/overview",   icon: Activity,        label: "质检总览", labelKey: "overview" },
  { href: "/publish",    icon: Rocket,          label: "发布",     labelKey: "publish" },
  { href: "/collab",     icon: Users,           label: "协作", disabled: true },
];

function isActive(href: string, path: string) {
  if (href === "/") return path === "/";
  return path.startsWith(href);
}

function getLabel(item: NavItem, industry: IndustryType): string {
  if (!item.labelKey) return item.label;
  const industryLabel = INDUSTRY_LABELS[item.labelKey]?.[industry];
  if (!industryLabel) return item.label;
  if (item.labelKey === 'asset') return industryLabel + '库';
  return industryLabel;
}

/* ── 移动端底部导航 ─────────────────────────────────────────── */
export function BottomNav() {
  const path = usePathname();
  const [industry, setIndustry] = useState<IndustryType>('game');

  useEffect(() => {
    const stored = localStorage.getItem('cd-industry') as IndustryType | null;
    if (stored && ['game', 'tourism', 'education', 'derivative'].includes(stored)) {
      setIndustry(stored);
    }
  }, []);

  const visible = [NAV[0], NAV[1], NAV[4], NAV[5], NAV[7]];
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 flex md:hidden"
      style={{ background:"#fff", borderTop:"1px solid #E2E5F0", paddingBottom:"env(safe-area-inset-bottom)" }}>
      {visible.map(item => {
        const active = isActive(item.href, path);
        return (
          <Link key={item.href} href={item.href}
            className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 relative focus:outline-none">
            <motion.div whileTap={{ scale:0.85 }} className="flex flex-col items-center gap-0.5">
              {active && (
                <motion.div layoutId="bot-tab"
                  className="absolute -top-[1px] left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full"
                  style={{ background:"#5E50E8" }} />
              )}
              <item.icon size={19} strokeWidth={active ? 2.5 : 1.8}
                style={{ color: active ? "#5E50E8" : "#9198B5" }} />
              <AnimatePresence mode="wait">
                <motion.span
                  key={`${item.labelKey || item.label}-${industry}`}
                  initial={{ opacity: 0, y: 2 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -2 }}
                  transition={{ duration: 0.15 }}
                  className="text-[8px] font-medium"
                  style={{ color: active ? "#5E50E8" : "#9198B5" }}>
                  {getLabel(item, industry)}
                </motion.span>
              </AnimatePresence>
            </motion.div>
          </Link>
        );
      })}
    </nav>
  );
}

/* ── 桌面端侧边栏（可收起/展开）─────────────────────────────── */
export function SideNav() {
  const path = usePathname();
  const [open, setOpen] = useState(true);
  const [tooltip, setTooltip] = useState<string | null>(null);
  const [industry, setIndustry] = useState<IndustryType>('game');
  const [showIndustryPicker, setShowIndustryPicker] = useState(false);
  const w = open ? W_OPEN : W_CLOSED;

  useEffect(() => {
    const stored = localStorage.getItem('cd-industry') as IndustryType | null;
    if (stored && ['game', 'tourism', 'education', 'derivative'].includes(stored)) {
      setIndustry(stored);
    }
  }, []);

  const handleIndustryChange = (newIndustry: IndustryType) => {
    setIndustry(newIndustry);
    localStorage.setItem('cd-industry', newIndustry);
    setShowIndustryPicker(false);
  };

  const currentIndustryIcon = INDUSTRY_ICONS.find(i => i.type === industry)?.icon || '🎮';

  return (
    <>
      <motion.aside
        animate={{ width: w }}
        transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
        className="hidden md:flex flex-col min-h-svh fixed left-0 top-0 z-30 overflow-hidden"
        style={{ background:"#F8F9FC", borderRight:"1px solid #E2E5F0" }}
      >
        {/* Logo 区 */}
        <div className="flex items-center gap-2.5 px-3 py-4 border-b shrink-0"
          style={{ borderColor:"#E2E5F0", minHeight:60 }}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            style={{ background:"linear-gradient(135deg,#5E50E8,#A78BFA)" }}>
            <span className="text-white text-sm font-black">逐</span>
          </div>
          <AnimatePresence>
            {open && (
              <motion.span
                initial={{ opacity:0, width:0 }} animate={{ opacity:1, width:"auto" }}
                exit={{ opacity:0, width:0 }}
                transition={{ duration:0.18 }}
                className="text-xs font-bold truncate overflow-hidden whitespace-nowrap"
                style={{ color:"#1A1D2E" }}>
                逐梦 Creator
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* 导航项 */}
        <nav className="flex-1 py-2 px-2 space-y-0.5 overflow-y-auto">
          {NAV.map(item => {
            const active = isActive(item.href, path);
            const displayLabel = getLabel(item, industry);

            /* disabled 占位项 —— 渲染为 div + tooltip 提示 */
            if (item.disabled) {
              return (
                <div key={item.href} className="relative">
                  <motion.div whileTap={{ scale:0.97 }}
                    onClick={() => setTooltip(tooltip === item.href ? null : item.href)}
                    className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl cursor-pointer transition-colors"
                    style={{
                      background: "transparent",
                      border: "1px solid transparent",
                      opacity: 0.5,
                    }}>
                    <item.icon size={16} strokeWidth={1.8}
                      style={{ color: "#9198B5", flexShrink:0 }} />
                    <AnimatePresence>
                      {open && (
                        <motion.span
                          initial={{ opacity:0, width:0 }} animate={{ opacity:1, width:"auto" }}
                          exit={{ opacity:0, width:0 }}
                          transition={{ duration:0.16 }}
                          className="text-xs font-medium truncate overflow-hidden whitespace-nowrap"
                          style={{ color: "#9198B5" }}>
                          {displayLabel}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.div>
                  {tooltip === item.href && (
                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 z-50 px-2 py-1 rounded-lg text-[10px] font-medium whitespace-nowrap shadow-md"
                      style={{ background:"#1A1D2E", color:"#fff" }}>
                      即将上线
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link key={item.href} href={item.href} title={displayLabel} className="block">
                <motion.div whileTap={{ scale:0.97 }}
                  className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl cursor-pointer transition-colors"
                  style={{
                    background: active ? "rgba(94,80,232,0.1)" : "transparent",
                    border: active ? "1px solid rgba(94,80,232,0.2)" : "1px solid transparent",
                  }}>
                  <item.icon size={16} strokeWidth={active ? 2.5 : 1.8}
                    style={{ color: active ? "#5E50E8" : "#9198B5", flexShrink:0 }} />
                  <AnimatePresence>
                    {open && (
                      <AnimatePresence mode="wait">
                        <motion.span
                          key={`${item.labelKey || item.label}-${industry}`}
                          initial={{ opacity:0, x: -4 }}
                          animate={{ opacity:1, x: 0 }}
                          exit={{ opacity:0, x: 4 }}
                          transition={{ duration:0.16 }}
                          className="text-xs font-medium truncate overflow-hidden whitespace-nowrap"
                          style={{ color: active ? "#5E50E8" : "#1A1D2E" }}>
                          {displayLabel}
                        </motion.span>
                      </AnimatePresence>
                    )}
                  </AnimatePresence>
                </motion.div>
              </Link>
            );
          })}
        </nav>

        {/* 设置 */}
        <div className="px-2 py-2 border-t shrink-0" style={{ borderColor:"#E2E5F0" }}>
          <Link href="/settings" title="设置">
            <motion.div whileTap={{ scale:0.97 }}
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl cursor-pointer">
              <Settings size={15} strokeWidth={1.8} style={{ color:"#9198B5", flexShrink:0 }} />
              <AnimatePresence>
                {open && (
                  <motion.span
                    initial={{ opacity:0, width:0 }} animate={{ opacity:1, width:"auto" }}
                    exit={{ opacity:0, width:0 }}
                    transition={{ duration:0.16 }}
                    className="text-xs font-medium overflow-hidden whitespace-nowrap"
                    style={{ color:"#9198B5" }}>
                    设置
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.div>
          </Link>

          {/* 行业选择器 */}
          <div className="relative mt-1">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => open && setShowIndustryPicker(!showIndustryPicker)}
              className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl cursor-pointer w-full transition-colors"
              style={{ background: showIndustryPicker ? "rgba(94,80,232,0.06)" : "transparent" }}
            >
              <span className="text-sm shrink-0">{currentIndustryIcon}</span>
              <AnimatePresence>
                {open && (
                  <motion.span
                    initial={{ opacity:0, width:0 }} animate={{ opacity:1, width:"auto" }}
                    exit={{ opacity:0, width:0 }}
                    transition={{ duration:0.16 }}
                    className="text-[10px] font-medium truncate overflow-hidden whitespace-nowrap"
                    style={{ color: "#9198B5" }}>
                    {INDUSTRY_LABELS.pipeline[industry]}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>

            {/* 行业选择弹出框 */}
            <AnimatePresence>
              {showIndustryPicker && open && (
                <motion.div
                  initial={{ opacity: 0, y: 4, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 bottom-full mb-1 z-50 p-1 rounded-xl shadow-lg"
                  style={{ background: "#fff", border: "1px solid #E2E5F0", minWidth: 140 }}
                >
                  {INDUSTRY_ICONS.map(item => {
                    const active = industry === item.type;
                    return (
                      <motion.button
                        key={item.type}
                        whileHover={{ x: 2 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => handleIndustryChange(item.type)}
                        className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-left transition-colors"
                        style={{
                          background: active ? "rgba(94,80,232,0.1)" : "transparent",
                        }}
                      >
                        <span className="text-sm">{item.icon}</span>
                        <span className="text-[10px] font-medium"
                          style={{ color: active ? "#5E50E8" : "#1A1D2E" }}>
                          {INDUSTRY_LABELS.pipeline[item.type]}
                        </span>
                      </motion.button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>

            {/* 收起状态下的迷你图标行 */}
            {!open && (
              <div className="flex flex-col items-center gap-0.5 mt-1">
                {INDUSTRY_ICONS.map(item => {
                  const active = industry === item.type;
                  return (
                    <motion.button
                      key={item.type}
                      whileTap={{ scale: 0.85 }}
                      onClick={() => handleIndustryChange(item.type)}
                      className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] transition-colors"
                      style={{
                        background: active ? "rgba(94,80,232,0.15)" : "transparent",
                        border: active ? "1px solid rgba(94,80,232,0.3)" : "1px solid transparent",
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

        {/* 收起/展开按钮 */}
        <motion.button
          whileTap={{ scale:0.9 }}
          onClick={() => setOpen(o => !o)}
          className="absolute bottom-16 right-[-12px] w-6 h-6 rounded-full flex items-center justify-center focus:outline-none z-40 shadow-sm"
          style={{ background:"#fff", border:"1px solid #E2E5F0" }}>
          {open
            ? <ChevronLeft size={12} style={{ color:"#9198B5" }} />
            : <ChevronRight size={12} style={{ color:"#9198B5" }} />}
        </motion.button>
      </motion.aside>
    </>
  );
}
