"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Plus, ChevronDown, MessageSquare,
} from "lucide-react";
import { useUIStore, useCanvasAgentStore } from "@/store";

const S = {
  card: "#FFFFFF",
  border: "#E2E5F0",
  primary: "#5E50E8", primary10: "rgba(94,80,232,0.10)", primary20: "rgba(94,80,232,0.20)",
  text2: "#4A5068", text3: "#8892B0",
};

export function WorkbenchHeader() {
  const [moreOpen, setMoreOpen] = useState(false);
  const addToast = useUIStore(s => s.addToast);
  const pathname = usePathname();
  const setPanelOpen = useCanvasAgentStore(s => s.setPanelOpen);
  const panelOpen = useCanvasAgentStore(s => s.panelOpen);

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

        {/* 开发者设置下拉 */}
        <div className="relative">
          <motion.button whileTap={{ scale: 0.97 }}
            onClick={() => setMoreOpen(o => !o)}
            className="flex items-center gap-0.5 px-2.5 py-1 rounded-lg text-xs font-medium focus:outline-none"
            style={{ color: S.text3 }}>
            开发者设置 <ChevronDown size={10} />
          </motion.button>
          <AnimatePresence>
            {moreOpen && (
              <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }} transition={{ duration: 0.12 }}
                className="absolute top-full left-0 mt-1 rounded-xl py-1 min-w-[120px] z-50"
                style={{ background: S.card, border: `1px solid ${S.border}`, boxShadow: "0 4px 16px rgba(0,0,0,0.1)" }}>
                <Link href="/settings">
                  <div className="px-3 py-1.5 text-xs cursor-pointer hover:bg-gray-50"
                    style={{ color: S.text2 }} onClick={() => setMoreOpen(false)}>
                    开发者设置
                  </div>
                </Link>
                <Link href="/settings">
                  <div className="px-3 py-1.5 text-xs cursor-pointer hover:bg-gray-50"
                    style={{ color: S.text2 }} onClick={() => setMoreOpen(false)}>
                    AI Key 管理
                  </div>
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>

      <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg ml-1"
        style={{ background: S.primary10, color: S.primary, border: `1px solid ${S.primary20}` }}>
        Key已配置
      </span>

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
