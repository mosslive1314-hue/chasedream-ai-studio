"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

const S = {
  surface: "#080910", card: "#0F1017", border: "#1C1E2E",
  primary: "#7C6CF5", accent: "#00C8BE",
  text: "#E8EBF4", textSec: "#9499B0", textMuted: "#6B7080",
  error: "#E54646",
};

export default function NodeCanvasScreen() {
  const [selected, setSelected] = useState("n03");

  return (
    <div className="flex flex-col h-svh overflow-hidden" style={{ background: S.surface }}>

      {/* top bar */}
      <div className="flex items-center justify-between px-4 py-2 shrink-0"
        style={{ background: S.card, borderBottom: `1px solid ${S.border}` }}>
        <Link href="/">
          <motion.button whileTap={{ scale: 0.95 }}
            className="flex items-center gap-1 text-xs font-bold focus:outline-none"
            style={{ color: "#cbd5e1" }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            返回大盘
          </motion.button>
        </Link>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full animate-ping" style={{ background: S.accent }} />
          <span className="text-[10px] font-mono font-bold uppercase" style={{ color: S.text }}>
            N03 决策点已锚定
          </span>
        </div>
      </div>

      {/* canvas */}
      <div className="flex-1 relative overflow-hidden"
        style={{
          background: "#0A0B11",
          backgroundImage: "linear-gradient(#1A1B2510 1px,transparent 1px),linear-gradient(90deg,#1A1B2510 1px,transparent 1px)",
          backgroundSize: "24px 24px",
        }}>

        {/* legend badges */}
        <div className="absolute top-2.5 left-2.5 z-20 flex flex-wrap gap-1">
          {[
            { label: "▶ 起始点", bg: S.surface, color: S.textSec, border: S.border },
            { label: "🧬 事件",  bg: `${S.primary}33`, color: S.primary, border: `${S.primary}4D` },
            { label: "⚖️ 决策",  bg: `${S.accent}33`, color: S.accent,  border: `${S.accent}4D` },
            { label: "⚠️ 漏洞",  bg: "#450a0a", color: "#fca5a5", border: "#7f1d1d", pulse: true },
          ].map(b => (
            <span key={b.label}
              className={`text-[8px] px-1.5 py-0.5 rounded font-bold ${b.pulse ? "animate-pulse" : ""}`}
              style={{ background: b.bg, color: b.color, border: `1px solid ${b.border}` }}>
              {b.label}
            </span>
          ))}
        </div>

        <div className="absolute top-2.5 right-2.5 z-20">
          <span className="text-[9px] font-mono tracking-widest px-2 py-1 rounded"
            style={{ background: "rgba(10,11,17,0.8)", color: S.textMuted }}>
            ZOOM: 100% | GPU-3D
          </span>
        </div>

        {/* SVG edges */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
          <line stroke={S.primary} strokeWidth={2.5} x1="80" x2="220" y1="110" y2="110" strokeLinecap="round" />
          <line stroke={S.accent}  strokeWidth={2.5} x1="220" x2="160" y1="110" y2="200" strokeLinecap="round" />
          <path d="M 160,200 Q 80,210 80,310"   fill="none" stroke={S.primary} strokeWidth={2} />
          <path d="M 160,200 Q 240,210 245,310"  fill="none" stroke={S.accent}  strokeWidth={2} />
          <line stroke={S.error} strokeDasharray="4,4" strokeWidth={2} x1="160" x2="160" y1="200" y2="350" />
        </svg>

        {/* nodes layer */}
        <div className="absolute inset-0 z-10 flex flex-col justify-between py-4">
          {/* row 1 */}
          <div className="flex justify-between items-center px-4">
            {[
              { id: "n01", type: "accent", label: "Row #1 Start", title: "N01. 天台追踪" },
              { id: "n02", type: "primary", label: "🧬 Event",     title: "N02. 线人现身" },
            ].map(n => (
              <motion.div key={n.id} whileTap={{ scale: 0.96 }}
                onClick={() => setSelected(n.id)}
                className="p-2.5 rounded-lg cursor-pointer"
                style={{
                  background: S.card, maxWidth: 110,
                  border: `1px solid ${selected === n.id ? S.primary : S.border}`,
                  boxShadow: selected === n.id ? `0 0 10px ${S.primary}33` : undefined,
                }}>
                <span className="text-[8px] font-mono uppercase block mb-1"
                  style={{ color: n.type === "accent" ? S.accent : S.primary }}>
                  {n.label}
                </span>
                <h5 className="text-[10px] font-bold truncate" style={{ color: "#f1f5f9" }}>{n.title}</h5>
              </motion.div>
            ))}
          </div>

          {/* row 2 – selected focus node */}
          <div className="flex justify-center my-4">
            <motion.div
              onClick={() => setSelected("n03")}
              className="p-3 rounded-lg relative cursor-pointer"
              style={{
                background: S.card, maxWidth: 180,
                border: `2px solid ${S.accent}`,
                boxShadow: `0 0 16px ${S.accent}40`,
              }}>
              <span className="absolute -top-2 left-3 text-[8px] font-bold px-1.5 rounded uppercase tracking-wider font-mono"
                style={{ background: S.accent, color: "#07090E" }}>
                SELECTED FOCUS
              </span>
              <span className="text-[8px] font-mono uppercase block mb-1" style={{ color: S.accent }}>⚖️ Branch Choice</span>
              <h5 className="text-[10px] font-bold" style={{ color: "#fff" }}>N03. 是否采纳真话？</h5>
              <span className="text-[8px] mt-1 block" style={{ color: S.textSec }}>属性判度：意志/敏捷检定</span>
            </motion.div>
          </div>

          {/* row 3 */}
          <div className="flex justify-between items-end px-2 gap-2">
            {[
              { id: "n04", color: "#94a3b8", type: "⚔️ Fight",  title: "N04. 正面厮杀", bg: S.card, border: S.border },
              { id: "n07", color: "#fca5a5", type: "⚠️ ERROR",  title: "N07. 异常崩溃", bg: "rgba(69,10,10,0.3)", border: "#7f1d1d", dashed: true, error: true },
              { id: "n05", color: "#34d399", type: "💨 Dodge",  title: "N05. 横向闪避", bg: S.card, border: S.border },
            ].map(n => (
              <motion.div key={n.id} whileTap={{ scale: 0.96 }}
                onClick={() => setSelected(n.id)}
                className={`p-2 rounded-lg cursor-pointer ${n.dashed ? "text-center" : ""}`}
                style={{
                  background: n.bg, maxWidth: 95,
                  border: `1px ${n.dashed ? "dashed" : "solid"} ${selected === n.id ? S.primary : n.border}`,
                }}>
                <span className="text-[8px] font-mono uppercase block mb-0.5" style={{ color: n.color }}>{n.type}</span>
                <h5 className="text-[9px] font-bold truncate" style={{ color: n.error ? "#fda4af" : "#cbd5e1" }}>{n.title}</h5>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* inspector bottom sheet */}
      <div className="shrink-0 p-4 space-y-3" style={{ background: S.card, borderTop: `1px solid ${S.border}` }}>
        <div className="flex justify-between items-center">
          <div>
            <span className="text-[8px] tracking-widest font-mono block uppercase" style={{ color: S.textMuted }}>
              Interactive Inspector Panel
            </span>
            <h4 className="text-xs font-extrabold" style={{ color: S.text }}>节点 N03 决策属性编辑库</h4>
          </div>
          <span className="text-[9px] px-2 py-0.5 rounded-full font-mono font-bold"
            style={{ background: `${S.accent}1A`, border: `1px solid ${S.accent}33`, color: S.accent }}>
            2 Branches
          </span>
        </div>

        <div className="text-xs space-y-2.5">
          <div>
            <span className="text-[9px] block mb-1" style={{ color: S.textSec }}>故事逻辑大纲 (AI 提炼说明文本)</span>
            <div className="w-full px-2 py-1.5 rounded text-[10px] leading-snug"
              style={{ background: S.surface, border: `1px solid ${S.border}`, color: S.textSec }}>
              线人抛出带血的信息芯片，求执政官洛兰提供战术掩护，玩家需要秒级做出真伪意志检定，走向地下酒吧主线或面临直接围剿阻击。
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 rounded-lg space-y-1" style={{ background: S.surface, border: `1px solid ${S.border}` }}>
              <span className="text-[9px] font-bold block" style={{ color: "#E96B3E" }}>分支A: 拔枪擒拿</span>
              <p className="text-[8px]" style={{ color: S.textMuted }}>触发值: [意志值 &gt;= 14]</p>
            </div>
            <div className="p-2 rounded-lg space-y-1" style={{ background: S.surface, border: `1px solid ${S.border}` }}>
              <span className="text-[9px] font-bold block" style={{ color: S.accent }}>分支B: 管道滚翻</span>
              <p className="text-[8px]" style={{ color: S.textMuted }}>触发值: [敏捷值 &gt;= 12]</p>
            </div>
          </div>
        </div>

        <Link href="/simulator">
          <motion.button whileTap={{ scale: 0.97 }}
            className="w-full py-2 rounded-lg text-xs font-bold text-white flex items-center justify-center gap-1 focus:outline-none"
            style={{ background: S.primary }}>
            <svg className="w-3.5 h-3.5" style={{ color: S.accent }} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            启动真机模拟调试本决策
          </motion.button>
        </Link>
      </div>
    </div>
  );
}
