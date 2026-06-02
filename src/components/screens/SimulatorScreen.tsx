"use client";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

const S = {
  primary: "#6355D8", accent: "#00A99D",
  text: "#1A1D2E", textSec: "#555B7A", textMuted: "#9198B5",
  success: "#059669", warning: "#D97706", error: "#DC2626",
};

export default function SimulatorScreen() {
  const router = useRouter();

  return (
    <div className="h-svh flex flex-col relative" style={{ background: "#000" }}>

      {/* 沉浸式背景 */}
      <div className="absolute inset-0 z-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt="Scene"
          className="w-full h-full object-cover brightness-50"
          src="https://images.unsplash.com/photo-1515621061946-eff1c2a352bd?auto=format&fit=crop&w=800&q=80"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black opacity-90" />
      </div>

      {/* 顶部栏 */}
      <div className="relative z-10 pt-4 px-4 pb-2 flex items-center justify-between">
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={() => router.back()}
          className="p-1.5 rounded-full backdrop-blur focus:outline-none"
          style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)", color: "#fff" }}
        >
          <ChevronLeft size={16} />
        </motion.button>
        <div
          className="flex gap-2 px-2 py-0.5 rounded backdrop-blur text-[8px] font-bold"
          style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.15)" }}
        >
          <span className="flex items-center gap-1" style={{ color: "#34D399" }}>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            耐力: 90
          </span>
          <span style={{ color: "rgba(255,255,255,0.3)" }}>|</span>
          <span className="flex items-center gap-1" style={{ color: "#A78BFA" }}>
            信任值: 40
          </span>
        </div>
      </div>

      {/* 角色立绘 */}
      <div className="flex-1 relative z-10 flex items-end justify-center pb-2">
        <motion.img
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          alt="Lorraine"
          className="w-[180px] h-[180px] object-cover rounded-xl border shadow-2xl"
          style={{ borderColor: "rgba(255,255,255,0.2)" }}
          src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80"
        />
      </div>

      {/* 对话 + 选择 */}
      <div className="relative z-20 px-4 pb-6 space-y-4">

        {/* 对话卡 */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl p-4 backdrop-blur shadow-xl"
          style={{ background: "rgba(0,0,0,0.7)", border: "1px solid rgba(255,255,255,0.12)" }}
        >
          <div className="text-[10px] font-bold tracking-wide mb-1" style={{ color: "#5EEAD4" }}>
            【艾拉 · 侦探】
          </div>
          <p className="text-[12px] leading-relaxed text-white">
            枪声划过霓虹屋顶。线人倒在通风口旁。你有 1.5 秒决定逃生路线！
          </p>
        </motion.div>

        {/* 选择按钮 */}
        <div className="space-y-2.5">
          <motion.button
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            whileTap={{ scale: 0.96 }}
            className="w-full py-3 px-4 rounded-xl font-bold text-[11px] flex items-center justify-between text-white focus:outline-none"
            style={{
              background: "linear-gradient(90deg, #450a0a, #7f1d1d)",
              border: "1px solid rgba(153,27,27,0.5)",
              boxShadow: "0 4px 10px rgba(0,0,0,0.5)",
            }}
          >
            <span className="flex items-center gap-2">
              🔫 正面开火
              <span className="text-[8px] font-normal opacity-70">(意志 ≥ 14)</span>
            </span>
            <span className="text-[9px] text-red-300">成功率 24%</span>
          </motion.button>

          <motion.button
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.28 }}
            whileTap={{ scale: 0.96 }}
            className="w-full py-3 px-4 rounded-xl font-bold text-[11px] flex items-center justify-between text-white focus:outline-none"
            style={{
              background: "linear-gradient(90deg, rgba(99,85,216,0.4), rgba(0,169,157,0.3))",
              border: `1px solid ${S.primary}`,
              boxShadow: `0 4px 10px rgba(0,0,0,0.5), 0 0 12px rgba(99,85,216,0.2)`,
            }}
          >
            <span className="flex items-center gap-2">
              💨 闪避到通风口
              <span className="text-[8px] font-normal opacity-70">(敏捷 ≥ 12)</span>
            </span>
            <span className="text-[9px]" style={{ color: "#5EEAD4" }}>成功率 100%</span>
          </motion.button>
        </div>

        {/* 调试面板 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="px-3 py-2 rounded-lg text-[9px] leading-snug"
          style={{ background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}
        >
          <div className="font-bold mb-1" style={{ color: "#5EEAD4" }}>调试面板</div>
          <div>当前节点：N07 · 潜行判定</div>
          <div>变量：stealth_score = 55
            <span style={{ color: "#FCA5A5" }}> ⚠ 低于阈值</span>
          </div>
          <div>路径：N01 → N02 → N03 → N04 → N06 → N07</div>
        </motion.div>
      </div>
    </div>
  );
}
