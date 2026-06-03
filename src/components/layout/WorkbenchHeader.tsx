"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Plus, ChevronDown, Home,
} from "lucide-react";
import { useUIStore } from "@/store";

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
  const isHome = pathname === "/";

  return (
    <header className="flex items-center h-11 px-4 gap-1 border-b shrink-0"
      style={{ background: S.card, borderColor: S.border }}>
      <nav className="flex items-center gap-0.5">
        {/* 首页按钮 — 回到工作台 */}
        <Link href="/">
          <motion.span whileTap={{ scale: 0.97 }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer whitespace-nowrap hover:bg-gray-50 transition-colors"
            style={{
              color: isHome ? S.primary : S.text2,
              background: isHome ? S.primary10 : "transparent",
            }}>
            <Home size={12} /> 工作台
          </motion.span>
        </Link>

        {[
          { label: "我的作品", href: "/my-works", comingSoon: false },
          { label: "我的资产", href: "/assets", comingSoon: false },
          { label: "素材市场", href: "#", comingSoon: true },
          { label: "能力市场", href: "#", comingSoon: true },
        ].map(item =>
          item.comingSoon ? (
            <motion.button key={item.label} whileTap={{ scale: 0.97 }}
              onClick={() => addToast({ type: "info", title: "功能规划中", message: `${item.label}将在后续版本上线，敬请期待` })}
              className="relative px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer whitespace-nowrap hover:bg-gray-50 transition-colors focus:outline-none"
              style={{ color: S.text3 }}>
              {item.label}
              <span className="ml-1 text-[8px] px-1 py-0.5 rounded-full font-bold"
                style={{ background: S.primary10, color: S.primary, border: `1px solid ${S.primary20}` }}>
                即将上线
              </span>
            </motion.button>
          ) : (
            <Link key={item.label} href={item.href}>
              <motion.span whileTap={{ scale: 0.97 }}
                className="px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer whitespace-nowrap hover:bg-gray-50 transition-colors"
                style={{ color: S.text2 }}>
                {item.label}
              </motion.span>
            </Link>
          )
        )}

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
