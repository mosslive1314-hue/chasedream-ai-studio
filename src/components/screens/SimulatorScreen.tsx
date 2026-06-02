"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, SkipBack, RefreshCw, Trophy } from "lucide-react";
import { PLAYABLE_GRAPH, INIT_VARIABLES, type PlayableNode } from "@/lib/studio-data";

const S = {
  primary: "#6355D8",
  accent: "#00A99D",
  text: "#1A1D2E",
  text2: "#4A5068",
  text3: "#8892B0",
  success: "#059669",
  warning: "#D97706",
  error: "#DC2626",
};

export default function SimulatorScreen() {
  const router = useRouter();
  const [nodeId, setNodeId] = useState("N01");
  const [vars, setVars] = useState<Record<string, number>>({ ...INIT_VARIABLES });
  const [path, setPath] = useState<string[]>(["N01"]);
  const [history, setHistory] = useState<{ nodeId: string; vars: Record<string, number>; path: string[] }[]>([]);

  const node = PLAYABLE_GRAPH[nodeId];

  const choose = (c: { label: string; next: string; effect: string }) => {
    // Save current state to history
    setHistory(h => [...h, { nodeId, vars: { ...vars }, path: [...path] }]);
    // Apply effect
    const nv = { ...vars };
    const m = c.effect.match(/([+-])(\w+)\s+(\d+)/);
    if (m) {
      const k = m[2];
      if (k in nv) {
        (nv as any)[k] = (nv as any)[k] + (m[1] === "+" ? 1 : -1) * parseInt(m[3]);
      }
    }
    setVars(nv);
    setNodeId(c.next);
    setPath(p => [...p, c.next]);
  };

  const reset = () => {
    setNodeId("N01");
    setVars({ ...INIT_VARIABLES });
    setPath(["N01"]);
    setHistory([]);
  };

  const undo = () => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setNodeId(prev.nodeId);
    setVars(prev.vars);
    setPath(prev.path);
    setHistory(h => h.slice(0, -1));
  };

  if (!node) {
    return (
      <div className="h-svh flex items-center justify-center" style={{ background: "#000" }}>
        <p className="text-white text-sm">节点 {nodeId} 不存在</p>
        <motion.button whileTap={{ scale: 0.95 }} onClick={reset}
          className="ml-4 px-3 py-1.5 rounded-lg text-xs text-white"
          style={{ background: S.primary }}>重新开始</motion.button>
      </div>
    );
  }

  const isEnding = !!node.isEnding;
  const isGood = node.endingType === "good";

  return (
    <div className="h-svh flex overflow-hidden" style={{ background: "#000" }}>

      {/* ── 左侧：沉浸式游戏区 ── */}
      <div className="flex-1 flex flex-col relative">

        {/* 沉浸式背景 */}
        <div className="absolute inset-0 z-0">
          <img alt="Scene" className="w-full h-full object-cover brightness-50"
            src={node.backgroundImage || "https://images.unsplash.com/photo-1515621061946-eff1c2a352bd?auto=format&fit=crop&w=800&q=80"} />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/70 opacity-90" />
        </div>

        {/* 顶部栏 */}
        <div className="relative z-10 pt-4 px-4 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <motion.button whileTap={{ scale: 0.85 }} onClick={() => router.back()}
              className="p-1.5 rounded-full backdrop-blur focus:outline-none"
              style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)", color: "#fff" }}>
              <ChevronLeft size={16} />
            </motion.button>
            <span className="text-[9px] font-bold" style={{ color: "rgba(255,255,255,0.5)" }}>
              幽灵协议 · 试玩模式
            </span>
          </div>
          {/* HUD 变量显示 */}
          <div className="flex gap-2 px-2.5 py-1 rounded-lg backdrop-blur text-[8px] font-bold"
            style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.15)" }}>
            {Object.entries(vars).map(([k, v]) => (
              <span key={k} className="flex items-center gap-1" style={{
                color: k === "stealth_score" && v < 60 ? "#FCA5A5" :
                  k === "alert_level" && v > 60 ? "#FCD34D" : "#34D399"
              }}>
                <div className="w-1.5 h-1.5 rounded-full" style={{
                  background: k === "stealth_score" && v < 60 ? "#FCA5A5" :
                    k === "alert_level" && v > 60 ? "#FCD34D" : "#34D399"
                }} />
                {k === "stealth_score" ? "潜行" : k === "alert_level" ? "警戒" :
                  k === "trust_lineman" ? "信任" : "真相"}: {v}
              </span>
            ))}
          </div>
        </div>

        {/* 角色标识 */}
        <div className="flex-1 relative z-10 flex items-end justify-center pb-4">
          <motion.div key={nodeId}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl"
            style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }}>
            {isEnding ? (isGood ? "🌟" : "💀") :
              node.char === "旁白" ? "🌃" : node.char === "艾拉" ? "🕵️" :
              node.char === "线人" ? "🕴️" : "👔"}
          </motion.div>
        </div>

        {/* 对话 + 选择 */}
        <div className="relative z-20 px-4 pb-6 space-y-3">
          <AnimatePresence mode="wait">
            <motion.div key={nodeId}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}>

              {/* 对话卡 */}
              <div className="rounded-2xl p-4 backdrop-blur shadow-xl"
                style={{
                  background: isEnding
                    ? (isGood ? "rgba(5,150,105,0.2)" : "rgba(220,38,38,0.2)")
                    : "rgba(0,0,0,0.7)",
                  border: isEnding
                    ? `1px solid ${isGood ? "rgba(5,150,105,0.3)" : "rgba(220,38,38,0.3)"}`
                    : "1px solid rgba(255,255,255,0.12)"
                }}>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-bold tracking-wide" style={{
                    color: isEnding ? (isGood ? "#4ade80" : "#f87171") : "#5EEAD4"
                  }}>
                    【{node.char}】
                  </span>
                  {isEnding && (
                    <span className="text-[8px] px-1.5 py-0.5 rounded" style={{
                      background: isGood ? "rgba(74,222,128,0.2)" : "rgba(248,113,113,0.2)",
                      color: isGood ? "#4ade80" : "#f87171"
                    }}>
                      {isGood ? "好结局" : "坏结局"}
                    </span>
                  )}
                </div>
                <p className="text-[12px] leading-relaxed whitespace-pre-line" style={{ color: "rgba(255,255,255,0.9)" }}>
                  {node.text}
                </p>
              </div>

              {/* 选择按钮 */}
              {!isEnding && node.choices && (
                <div className="space-y-2 mt-3">
                  {node.choices.map((c, i) => (
                    <motion.button key={i}
                      initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + i * 0.08 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => choose(c)}
                      className="w-full py-3 px-4 rounded-xl font-bold text-[11px] flex items-center justify-between text-white focus:outline-none"
                      style={{
                        background: "linear-gradient(90deg, rgba(99,85,216,0.4), rgba(0,169,157,0.3))",
                        border: `1px solid rgba(99,85,216,0.5)`,
                        boxShadow: "0 4px 10px rgba(0,0,0,0.5)",
                      }}>
                      <span className="flex items-center gap-2">{c.label}</span>
                      <div className="flex items-center gap-2">
                        {c.effect !== "+0" && (
                          <span className="text-[8px] font-normal opacity-60">{c.effect}</span>
                        )}
                        <ChevronRight size={12} />
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}

              {/* 结局操作 */}
              {isEnding && (
                <div className="flex gap-2 mt-4">
                  <motion.button whileTap={{ scale: 0.96 }} onClick={reset}
                    className="flex-1 py-3 rounded-xl text-xs font-bold text-white focus:outline-none flex items-center justify-center gap-1.5"
                    style={{ background: `linear-gradient(135deg,${S.primary},${S.accent})` }}>
                    <RefreshCw size={13} /> 重新试玩
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.96 }} onClick={() => router.back()}
                    className="px-4 py-3 rounded-xl text-xs font-medium focus:outline-none"
                    style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)",
                      border: "1px solid rgba(255,255,255,0.15)" }}>
                    返回编辑
                  </motion.button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* 底部操作栏 */}
          {!isEnding && (
            <div className="flex items-center justify-between pt-2">
              <div className="flex gap-2">
                <motion.button whileTap={{ scale: 0.92 }} onClick={undo}
                  disabled={history.length === 0}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[9px] focus:outline-none"
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    color: history.length > 0 ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.2)"
                  }}>
                  <SkipBack size={10} /> 撤销
                </motion.button>
                <motion.button whileTap={{ scale: 0.92 }} onClick={reset}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[9px] focus:outline-none"
                  style={{ background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    color: "rgba(255,255,255,0.6)" }}>
                  <RefreshCw size={10} /> 重新开始
                </motion.button>
              </div>
              <span className="text-[8px] font-mono" style={{ color: "rgba(255,255,255,0.3)" }}>
                第 {path.length} 步
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── 右侧：调试面板 ── */}
      <div className="w-[220px] shrink-0 border-l overflow-y-auto hidden md:flex flex-col"
        style={{ borderColor: "rgba(255,255,255,0.1)", background: "rgba(10,10,20,0.95)" }}>

        {/* 标题 */}
        <div className="px-3 py-2.5 border-b flex items-center gap-1.5"
          style={{ borderColor: "rgba(255,255,255,0.1)" }}>
          <div className="w-2 h-2 rounded-full" style={{ background: "#34D399" }} />
          <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: "#5EEAD4" }}>调试面板</p>
        </div>

        {/* 当前节点 */}
        <div className="px-3 py-2.5 border-b" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
          <p className="text-[8px] mb-1 font-bold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.4)" }}>当前节点</p>
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-bold font-mono" style={{ color: "#fff" }}>{nodeId}</span>
            {isEnding && (
              <span className="text-[8px] px-1.5 py-0.5 rounded" style={{
                background: isGood ? "rgba(74,222,128,0.15)" : "rgba(248,113,113,0.15)",
                color: isGood ? "#4ade80" : "#f87171"
              }}>
                {isGood ? "好结局" : "坏结局"}
              </span>
            )}
          </div>
          <p className="text-[9px] mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>{node.char}</p>
        </div>

        {/* 路径 */}
        <div className="px-3 py-2.5 border-b" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
          <p className="text-[8px] mb-1.5 font-bold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.4)" }}>游玩路径</p>
          <div className="flex flex-wrap gap-0.5">
            {path.map((p, i) => {
              const pNode = PLAYABLE_GRAPH[p];
              return (
                <span key={i} className="text-[8px] font-mono px-1 py-0.5 rounded"
                  style={{
                    background: i === path.length - 1 ? "rgba(99,85,216,0.2)" : "rgba(255,255,255,0.05)",
                    color: i === path.length - 1 ? "#a78bfa" : "rgba(255,255,255,0.4)"
                  }}>
                  {p}{i < path.length - 1 ? "→" : ""}
                </span>
              );
            })}
          </div>
        </div>

        {/* 变量状态 */}
        <div className="px-3 py-2.5 border-b" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
          <p className="text-[8px] mb-1.5 font-bold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.4)" }}>变量状态</p>
          <div className="space-y-1.5">
            {Object.entries(vars).map(([k, v]) => {
              const label = k === "stealth_score" ? "潜行值" : k === "alert_level" ? "警戒值" :
                k === "trust_lineman" ? "信任值" : "真相值";
              const isWarn = (k === "stealth_score" && v < 60) || (k === "alert_level" && v > 60);
              return (
                <div key={k}>
                  <div className="flex justify-between mb-0.5">
                    <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.5)" }}>{label}</span>
                    <span className="text-[9px] font-mono font-bold" style={{
                      color: isWarn ? "#FCA5A5" : "#34D399"
                    }}>
                      {v}{isWarn ? " ⚠" : ""}
                    </span>
                  </div>
                  <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                    <div className="h-full rounded-full transition-all" style={{
                      width: `${Math.min(100, Math.max(0, v))}%`,
                      background: isWarn ? "#EF4444" : "#34D399"
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 操作历史 */}
        <div className="px-3 py-2.5 flex-1">
          <p className="text-[8px] mb-1.5 font-bold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.4)" }}>
            操作记录 ({history.length} 步)
          </p>
          <div className="space-y-1">
            {history.map((h, i) => (
              <div key={i} className="flex items-center gap-1.5 py-0.5">
                <span className="text-[8px] font-mono shrink-0" style={{ color: "rgba(255,255,255,0.3)" }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-[8px] truncate" style={{ color: "rgba(255,255,255,0.5)" }}>
                  {h.nodeId}
                </span>
              </div>
            ))}
            {history.length === 0 && (
              <p className="text-[8px]" style={{ color: "rgba(255,255,255,0.2)" }}>尚无操作记录</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
