"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Plus, MessageSquare, Key,
} from "lucide-react";
import { useCanvasAgentStore, useSettingsStore } from "@/store";

const S = {
  card: "#FFFFFF",
  border: "#E2E5F0",
  primary: "#5E50E8", primary10: "rgba(94,80,232,0.10)", primary20: "rgba(94,80,232,0.20)",
  text2: "#4A5068", text3: "#8892B0",
};

export function WorkbenchHeader() {
  const pathname = usePathname();
  const setPanelOpen = useCanvasAgentStore(s => s.setPanelOpen);
  const panelOpen = useCanvasAgentStore(s => s.panelOpen);
  const aiModel = useSettingsStore(s => s.aiModel);
  const apiKey = useSettingsStore(s => s.apiKeys?.[aiModel]);
  const hasKey = !!apiKey && apiKey.trim().length > 0;

  return (
    <header className="flex items-center h-11 px-4 gap-1 border-b shrink-0"
      style={{ background: S.card, borderColor: S.border }}>
      <nav className="flex items-center gap-0.5">
        {[
          { label: "我的作品", href: "/my-works" },
          { label: "我的资产", href: "/assets" },
        ].map(item => (
          <Link key={item.label} href={item.href}>
            <motion.span whileTap={{ scale: 0.97 }}
              className="px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer whitespace-nowrap hover:bg-gray-50 transition-colors"
              style={{
                color: isActive(item.href, pathname) ? S.primary : S.text2,
                background: isActive(item.href, pathname) ? S.primary10 : "transparent",
              }}>
              {item.label}
            </motion.span>
          </Link>
        ))}
      </nav>

      <Link href="/settings">
        <motion.span whileTap={{ scale: 0.97 }}
          className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg ml-1 cursor-pointer"
          style={{
            background: hasKey ? "rgba(5,150,105,0.10)" : "rgba(217,119,6,0.10)",
            color: hasKey ? "#059669" : "#D97706",
            border: `1px solid ${hasKey ? "rgba(5,150,105,0.20)" : "rgba(217,119,6,0.20)"}`,
          }}>
          <Key size={9} />
          {hasKey ? "Key已配置" : "配置Key"}
        </motion.span>
      </Link>

      <div className="flex-1" />

      {/* Agent 面板按钮 */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => setPanelOpen(!panelOpen)}
        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium focus:outline-none transition-colors mr-2"
        style={{
          color: panelOpen ? S.primary : S.text2,
          background: panelOpen ? S.primary10 : "transparent",
        }}
        title="AI 助手 (Cmd+J)"
      >
        <MessageSquare size={13} />
        <span>AI 助手</span>
      </motion.button>

      {/* 新建项目 — 主 CTA */}
      <Link href="/?action=new-project">
        <motion.button whileTap={{ scale: 0.97 }}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-white focus:outline-none"
          style={{ background: S.primary }}>
          <Plus size={12} /> 新建项目
        </motion.button>
      </Link>
    </header>
  );
}

function isActive(href: string, path: string): boolean {
  if (href === "/") return path === "/";
  return path.startsWith(href);
}
