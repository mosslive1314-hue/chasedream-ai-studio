"use client";
import { motion } from "framer-motion";
import Link from "next/link";

const S = {
  surface: "#080910", card: "#0F1017", border: "#1C1E2E",
  primary: "#7C6CF5", accent: "#00C8BE",
  text: "#E8EBF4", textSec: "#9499B0", textMuted: "#6B7080",
};

export default function DebuggerScreen() {
  return (
    <div className="flex flex-col h-svh overflow-hidden" style={{ background: S.surface }}>

      {/* top bar */}
      <div className="flex items-center justify-between px-4 py-2 shrink-0"
        style={{ background: S.card, borderBottom: `1px solid ${S.border}` }}>
        <Link href="/canvas">
          <motion.button whileTap={{ scale: 0.95 }}
            className="flex items-center gap-1 text-xs font-bold text-slate-300 focus:outline-none">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            退出真机模拟
          </motion.button>
        </Link>
        <span className="text-[9px] font-mono px-2 py-0.5 rounded"
          style={{ background: "#030405", border: `1px solid ${S.border}`, color: S.textMuted }}>
          SIMULATING
        </span>
      </div>

      {/* scroll body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">

        {/* phone mock */}
        <div className="max-w-[280px] h-[380px] mx-auto rounded-[32px] overflow-hidden relative flex flex-col shrink-0"
          style={{
            border: "6px solid #1e293b",
            background: "#000",
            boxShadow: `0 0 0 4px ${S.primary}1A, 0 20px 40px rgba(0,0,0,0.8)`,
          }}>
          {/* notch */}
          <div className="absolute top-0 inset-x-0 h-4 z-30 flex items-center justify-center"
            style={{ background: "#000" }}>
            <div className="w-16 h-2 rounded-full" style={{ background: "#1e293b" }} />
          </div>

          {/* scene bg */}
          <div className="absolute inset-0 z-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="Cinematic background" className="w-full h-full object-cover"
              style={{ filter: "brightness(0.4)" }}
              src="https://images.unsplash.com/photo-1515621061946-eff1c2a352bd?auto=format&fit=crop&w=300&q=80" />
            <div className="absolute inset-0" style={{
              background: "linear-gradient(to top, #000 0%, transparent 50%, rgba(0,0,0,0.6) 100%)"
            }} />
          </div>

          {/* content */}
          <div className="relative z-10 flex flex-col justify-between flex-1 p-3.5 pt-6 pb-4">
            {/* avatar */}
            <div className="flex-1 flex items-end justify-center py-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img alt="Detective Lorraine" className="w-24 h-24 object-cover rounded-lg"
                style={{ border: "1px solid #334155", boxShadow: "0 10px 30px rgba(0,0,0,0.8)" }}
                src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80" />
            </div>

            {/* dialogue + choices */}
            <div className="space-y-2">
              <div className="rounded-xl p-2.5 text-[9px] leading-relaxed"
                style={{ background: "rgba(0,0,0,0.8)", border: "1px solid #1e293b", color: "#e2e8f0" }}>
                <strong className="block mb-0.5" style={{ color: S.accent }}>【洛兰 · 执政官侦探】</strong>
                突发：夜幕天台闪过枪影，线人倒在通风管旁。你必须在1.5秒内做出求生路线部署！
              </div>

              <div className="space-y-1.5">
                <motion.button whileTap={{ scale: 0.97 }}
                  className="w-full py-1.5 rounded-lg text-[9px] font-bold flex items-center justify-between px-2 focus:outline-none"
                  style={{
                    background: "linear-gradient(90deg,#450a0a,#7f1d1d)",
                    border: "1px solid #b91c1c", color: "#fff",
                  }}>
                  <span>🔫 正面厮杀较量 (需意志≥14)</span>
                  <span className="text-[7.5px] font-mono" style={{ color: "#fca5a5" }}>成功率 24%</span>
                </motion.button>
                <motion.button whileTap={{ scale: 0.97 }}
                  className="w-full py-1.5 rounded-lg text-[9px] font-bold flex items-center justify-between px-2 focus:outline-none"
                  style={{
                    background: `linear-gradient(90deg,${S.surface},${S.border})`,
                    border: `1px solid ${S.primary}`, color: "#f1f5f9",
                    boxShadow: `0 0 8px ${S.primary}33`,
                  }}>
                  <span>💨 极速闪过通风口 (需敏捷≥12)</span>
                  <span className="text-[7.5px] font-mono" style={{ color: S.accent }}>成功率 100%</span>
                </motion.button>
              </div>
            </div>
          </div>
        </div>

        {/* telemetry panel */}
        <div className="rounded-2xl p-4 space-y-3"
          style={{ background: S.card, border: `1px solid ${S.border}` }}>
          <div className="flex justify-between items-center pb-2"
            style={{ borderBottom: `1px solid #1e293b` }}>
            <div>
              <span className="text-[8px] font-mono uppercase block" style={{ color: S.primary }}>
                TELEMETRY MONITOR
              </span>
              <h4 className="text-xs font-extrabold" style={{ color: S.text }}>变量/技能判定解析大底</h4>
            </div>
            <motion.button whileTap={{ scale: 0.96 }}
              className="px-2 py-0.5 text-[9px] font-mono rounded focus:outline-none"
              style={{ background: "#030405", border: `1px solid #1e293b`, color: S.textSec }}>
              重置属性
            </motion.button>
          </div>

          {/* stats */}
          <div className="rounded-xl p-3 space-y-3"
            style={{ background: S.surface, border: `1px solid ${S.border}` }}>
            <span className="text-[9px] font-mono uppercase block"
              style={{ color: S.textMuted, letterSpacing: "0.08em" }}>
              角色内心人格判定状态值
            </span>
            {[
              { label: "洛兰体力值 HP", val: 90, color: S.accent },
              { label: "接头线人信任感 (Trust Level)", val: 40, color: S.primary },
            ].map(s => (
              <div key={s.label} className="space-y-1">
                <div className="flex justify-between text-[10px]">
                  <span style={{ color: S.textSec }}>{s.label}</span>
                  <span className="font-mono font-bold" style={{ color: s.color }}>{s.val} / 100</span>
                </div>
                <div className="h-1 rounded-full overflow-hidden" style={{ background: "#030405" }}>
                  <div className="h-full rounded-full" style={{ width: `${s.val}%`, background: s.color }} />
                </div>
              </div>
            ))}
          </div>

          {/* log */}
          <div className="rounded-xl p-3 font-mono text-[9px] space-y-1"
            style={{ background: "rgba(0,0,0,0.6)" }}>
            <p style={{ color: "#64748b" }}>[INITIAL] Loaded system attributes dynamically...</p>
            <p style={{ color: "#cbd5e1" }}>[NODE] Running player step tracker targeting N03 Choice node.</p>
            <p style={{ color: "#34d399" }}>[SUCCESS] Active run path validates perfect synchronization.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
