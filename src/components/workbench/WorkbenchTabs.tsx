// WorkbenchTabs — 7个Tab的标签栏组件
"use client";
import { motion } from "framer-motion";

export type WorkbenchTab =
  | "overview"
  | "factory"
  | "script"
  | "canvas"
  | "assets"
  | "simulator"
  | "publish";

const TABS: { id: WorkbenchTab; label: string }[] = [
  { id: "overview",  label: "总览" },
  { id: "factory",   label: "AI制作" },
  { id: "script",    label: "剧本" },
  { id: "canvas",    label: "节点图" },
  { id: "assets",    label: "资产库" },
  { id: "simulator", label: "试玩" },
  { id: "publish",   label: "发布" },
];

interface Props {
  active: WorkbenchTab;
  onChange: (tab: WorkbenchTab) => void;
}

export function WorkbenchTabs({ active, onChange }: Props) {
  return (
    <div
      className="flex items-end gap-0 px-3 overflow-x-auto"
      style={{ borderBottom: "1px solid var(--app-border)", background: "var(--app-surface)", scrollbarWidth: "none" }}
    >
      {TABS.map((tab) => {
        const isActive = tab.id === active;
        return (
          <motion.button
            key={tab.id}
            whileTap={{ scale: 0.97 }}
            onClick={() => onChange(tab.id)}
            className="relative shrink-0 px-3 py-2.5 text-[11px] font-semibold transition-colors focus:outline-none"
            style={{ color: isActive ? "var(--app-primary)" : "var(--app-text-muted)" }}
          >
            {tab.label}
            {isActive && (
              <motion.div
                layoutId="workbench-tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-[2px] rounded-t-full"
                style={{ background: "linear-gradient(90deg, var(--app-primary), var(--app-accent))" }}
              />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
