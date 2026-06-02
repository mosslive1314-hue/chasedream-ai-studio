"use client";
import { motion } from "framer-motion";
import Link from "next/link";

const S = {
  surface:  "#F8F9FC",
  card:     "#FFFFFF",
  cardAlt:  "#F3F4F8",
  border:   "#E4E7EF",
  primary:  "#6355D8",
  accent:   "#00A99D",
  text:     "#1A1D2E",
  textSec:  "#555B7A",
  textMuted:"#9198B5",
  success:  "#059669",
  warning:  "#D97706",
  error:    "#DC2626",
  gold:     "#B45309",
};

export default function DashboardScreen() {
  return (
    <div className="p-4 space-y-6 flex-1 flex flex-col" style={{ background: S.surface, minHeight: "100svh" }}>

      {/* ── Hero Banner ─────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
        className="relative rounded-xl p-5 overflow-hidden"
        style={{ background: S.card, border: `1px solid ${S.border}`, boxShadow: "0 2px 16px rgba(99,85,216,0.08)" }}
      >
        {/* subtle glow */}
        <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full pointer-events-none"
          style={{ background: S.primary, opacity: 0.06, filter: "blur(40px)" }} />
        <div className="relative z-10 space-y-3">
          {/* badge */}
          <div className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5"
            style={{ background: `${S.accent}12`, border: `1px solid ${S.accent}30` }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: S.accent }} />
            <span className="text-[9px] font-semibold tracking-wider uppercase font-mono" style={{ color: S.accent }}>
              AI-Native Game Generation Engine
            </span>
          </div>

          <h2 className="text-base font-extrabold leading-tight tracking-tight" style={{ color: S.text }}>
            文字大纲一键生成多节点互动影游
          </h2>
          <p className="text-[11px] leading-relaxed" style={{ color: S.textSec }}>
            将繁琐复杂的分支剧情、原画设定、数值QTE判定托付给400+专业专家智能体。让创意顺畅流转。
          </p>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <Link href="/factory">
              <motion.button whileTap={{ scale: 0.97 }}
                className="w-full flex justify-center items-center gap-1.5 text-[11px] font-bold text-white py-2.5 px-3 rounded-lg focus:outline-none"
                style={{ background: S.primary, boxShadow: `0 2px 10px ${S.primary}30` }}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                导入全本剧本
              </motion.button>
            </Link>
            <Link href="/canvas">
              <motion.button whileTap={{ scale: 0.97 }}
                className="w-full text-[11px] font-bold py-2.5 px-3 rounded-lg text-center focus:outline-none"
                style={{ background: S.cardAlt, border: `1px solid ${S.border}`, color: S.text }}>
                直接进入编辑器
              </motion.button>
            </Link>
          </div>
        </div>
      </motion.div>

      {/* ── Stats ─────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-2.5">
        {[
          { label: "活跃项目",  value: "03",  color: S.text },
          { label: "注册节点",  value: "172", color: S.primary },
          { label: "分支逻辑",  value: "45",  color: S.accent },
        ].map(stat => (
          <motion.div key={stat.label}
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="p-3 rounded-xl"
            style={{ background: S.card, border: `1px solid ${S.border}`, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <span className="text-[9px] uppercase tracking-wider block font-mono" style={{ color: S.textMuted }}>
              {stat.label}
            </span>
            <strong className="text-lg font-bold font-mono block mt-0.5" style={{ color: stat.color }}>
              {stat.value}
            </strong>
          </motion.div>
        ))}
      </div>

      {/* ── Project List ─────────────────────────── */}
      <div className="space-y-3.5 flex-1 flex flex-col">
        <div className="flex items-center justify-between pb-1.5" style={{ borderBottom: `1px solid ${S.border}` }}>
          <h3 className="text-[11px] font-extrabold tracking-widest uppercase" style={{ color: S.textMuted }}>
            执行中的互动工程
          </h3>
          <span className="text-[9px] font-mono cursor-pointer" style={{ color: S.primary }}>ALL PROJECTS ➔</span>
        </div>

        {/* Card 1: Daybreak Matrix */}
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}
          className="rounded-xl p-4 space-y-3.5 relative overflow-hidden"
          style={{
            background: S.card,
            border: `1px solid ${S.primary}40`,
            boxShadow: `0 2px 16px ${S.primary}0A`,
          }}>
          {/* top accent line */}
          <div className="absolute right-0 top-0 h-1.5 w-1/3 rounded-bl"
            style={{ background: `linear-gradient(to right, ${S.primary}, #8B7CF8)` }} />

          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[9px] uppercase font-mono tracking-widest px-2 py-0.5 rounded-full"
                style={{ background: `${S.primary}10`, color: S.primary }}>
                赛博谍战 / 科幻交互
              </span>
              <h4 className="text-xs font-bold mt-1" style={{ color: S.text }}>
                真理之曜：追击指令 (Daybreak Matrix)
              </h4>
              <p className="text-[9px]" style={{ color: S.textMuted }}>更新于: 10分钟前 | 主编解构流程</p>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded shrink-0"
              style={{ background: `${S.accent}12`, color: S.accent }}>制作中</span>
          </div>

          {/* stats grid */}
          <div className="grid grid-cols-3 gap-2 p-2 rounded-lg text-center text-[10px]"
            style={{ background: S.cardAlt }}>
            {[["场景事件", "42"], ["概率检定", "12"], ["解锁结局", "06"]].map(([l, v]) => (
              <div key={l}>
                <span className="block text-[9px]" style={{ color: S.textMuted }}>{l}</span>
                <span className="font-bold font-mono" style={{ color: S.text }}>{v}</span>
              </div>
            ))}
          </div>

          {/* progress */}
          <div className="space-y-1">
            <div className="flex justify-between text-[9px] font-mono" style={{ color: S.textSec }}>
              <span>AI原画 & 素材开发进度</span>
              <span className="font-bold" style={{ color: S.accent }}>74%</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: S.cardAlt }}>
              <div className="h-full rounded-full"
                style={{ width: "74%", background: `linear-gradient(to right, ${S.primary}, #8B7CF8)` }} />
            </div>
          </div>

          {/* footer */}
          <div className="flex items-center justify-between pt-1 text-[10px]"
            style={{ borderTop: `1px solid ${S.border}` }}>
            <Link href="/canvas">
              <span className="flex items-center gap-1 font-mono cursor-pointer" style={{ color: S.warning }}>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                1 处逻辑异常待查(N07)
              </span>
            </Link>
            <div className="flex gap-1.5">
              <Link href="/factory">
                <motion.button whileTap={{ scale: 0.95 }}
                  className="px-2 py-1 text-[10px] font-bold rounded focus:outline-none"
                  style={{ background: `${S.primary}10`, color: S.primary, border: `1px solid ${S.primary}25` }}>
                  AI工厂
                </motion.button>
              </Link>
              <Link href="/canvas">
                <motion.button whileTap={{ scale: 0.95 }}
                  className="px-2 py-1 text-[10px] text-white font-bold rounded focus:outline-none"
                  style={{ background: S.primary }}>
                  编排画布
                </motion.button>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Card 2: Cabinet */}
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.25 }}
          className="rounded-xl p-4 space-y-3 relative overflow-hidden"
          style={{
            background: S.card,
            border: `1px solid ${S.border}`,
            boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
          }}>
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[9px] uppercase font-mono tracking-widest px-2 py-0.5 rounded-full"
                style={{ background: S.cardAlt, color: S.textSec }}>
                心理学 / 极乐式探案
              </span>
              <h4 className="text-xs font-bold mt-1" style={{ color: S.text }}>
                极乐梦境：思想内阁 (Cabinet)
              </h4>
              <p className="text-[9px]" style={{ color: S.textMuted }}>更新于: 3小时前 | 24个技能人格化解算中</p>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded shrink-0"
              style={{ background: "#FEF3C7", color: "#92400E" }}>联动调试</span>
          </div>
          <div className="flex items-center justify-between pt-1 text-[10px]"
            style={{ borderTop: `1px solid ${S.border}` }}>
            <span className="flex items-center gap-1 font-mono" style={{ color: S.error }}>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              3 处致命循环错误
            </span>
            <Link href="/simulator">
              <motion.button whileTap={{ scale: 0.95 }}
                className="px-2 py-1 text-[10px] font-semibold rounded focus:outline-none"
                style={{ background: S.cardAlt, color: S.text, border: `1px solid ${S.border}` }}>
                模拟联调
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
