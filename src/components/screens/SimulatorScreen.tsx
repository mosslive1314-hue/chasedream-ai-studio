"use client";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  ChevronLeft, ChevronRight, SkipBack, RefreshCw, Trophy, Play,
  FlaskConical, Gamepad2, AlertTriangle, Clock, RotateCw,
  Map, Star, GitBranch, Eye, ArrowRight,
  Target, Users, Package, GitMerge, Ruler, Zap,
} from "lucide-react";
import {
  type PlayableNode, type PathTestResult, type PlayerExplorationMap,
} from "@/lib/studio-data";
import { useNarrativeStore } from "@/store";

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

// ── P7-11: Exploration map layout ────────────────────────────────────────────
const SESSION_COLORS = ["#5E50E8", "#D97706", "#00A99D"];

const EXPLORE_EDGES: { from: string; to: string }[] = [
  { from: "N01", to: "N02" },
  { from: "N02", to: "N03" },
  { from: "N03", to: "N04" },
  { from: "N03", to: "N05" },
  { from: "N04", to: "N06" },
  { from: "N05", to: "N06" },
  { from: "N06", to: "N07S" },
  { from: "N06", to: "N07F" },
  { from: "N07S", to: "N08" },
  { from: "N07F", to: "N09" },
  { from: "N08", to: "N10" },
  { from: "N09", to: "N11" },
];

const NODE_POS: Record<string, { x: number; y: number }> = {
  N01:  { x: 140, y: 32 },
  N02:  { x: 140, y: 88 },
  N03:  { x: 140, y: 144 },
  N04:  { x: 58,  y: 200 },
  N05:  { x: 222, y: 200 },
  N06:  { x: 140, y: 256 },
  N07S: { x: 58,  y: 312 },
  N07F: { x: 222, y: 312 },
  N08:  { x: 58,  y: 368 },
  N09:  { x: 222, y: 368 },
  N10:  { x: 58,  y: 428 },
  N11:  { x: 222, y: 428 },
};

const NODE_LABEL: Record<string, string> = {
  N01: "N01", N02: "N02", N03: "N03", N04: "N04", N05: "N05", N06: "N06",
  N07S: "07S", N07F: "07F", N08: "N08", N09: "N09", N10: "N10", N11: "N11",
};

// ── P7-11: Circular progress component ───────────────────────────────────────
function CircularProgress({ value, label, color, size = 52 }: {
  value: number; label: string; color: string; size?: number;
}) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - value / 100);
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} className="block">
        <circle cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={4} />
        <motion.circle cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={color} strokeWidth={4} strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
          transform={`rotate(-90 ${size / 2} ${size / 2})`} />
        <text x={size / 2} y={size / 2 + 1} textAnchor="middle" dominantBaseline="middle"
          fill="#fff" fontSize={11} fontWeight="bold" fontFamily="monospace">
          {value}{value <= 100 && value > 3 ? "%" : ""}
        </text>
      </svg>
      <span className="text-[8px] font-bold text-center" style={{ color: "rgba(255,255,255,0.55)" }}>
        {label}
      </span>
    </div>
  );
}

// ── P7-10: Coverage color helper ─────────────────────────────────────────────
function coverageColor(v: number): string {
  if (v > 80) return "#4ade80";
  if (v >= 50) return "#fbbf24";
  return "#f87171";
}

// ── P7-10: Advanced diagnostic type ──────────────────────────────────────────
interface AdvDiag {
  label: string; passed: boolean; detail: string; icon: React.ReactNode;
}

export default function SimulatorScreen() {
  const router = useRouter();

  // ── Store selectors ──
  const playableGraph = useNarrativeStore(s => s.playableGraph);
  const initVariables = useNarrativeStore(s => s.initVariables);
  const pathTestResults = useNarrativeStore(s => s.pathTestResults);
  const playerExploration = useNarrativeStore(s => s.playerExploration);

  const [nodeId, setNodeId] = useState("N01");
  const [vars, setVars] = useState<Record<string, number>>({ ...initVariables });
  const [path, setPath] = useState<string[]>(["N01"]);
  const [history, setHistory] = useState<{ nodeId: string; vars: Record<string, number>; path: string[] }[]>([]);

  // P4-9: Test mode state
  const [testMode, setTestMode] = useState(false);
  const [testRunning, setTestRunning] = useState(false);
  const [testResults, setTestResults] = useState<PathTestResult[]>([]);
  const [testProgress, setTestProgress] = useState(0);

  // P7-10 / P7-11: Main tab (play | test | explore)
  const [mainTab, setMainTab] = useState<"play" | "test" | "explore">("play");

  // P7-11: Exploration session filter (0 = all overlaid, 1/2/3 = specific session)
  const [exploreSession, setExploreSession] = useState(0);

  const node = playableGraph[nodeId];

  // ── Sync tab → testMode ───────────────────────────────────────────────────
  const switchTab = (t: "play" | "test" | "explore") => {
    setMainTab(t);
    setTestMode(t === "test");
  };

  // ── Actions ──────────────────────────────────────────────────────────────
  const choose = (c: { label: string; next: string; effect: string }) => {
    setHistory(h => [...h, { nodeId, vars: { ...vars }, path: [...path] }]);
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
    setVars({ ...initVariables });
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

  const runTests = () => {
    setTestRunning(true);
    setTestResults([]);
    setTestProgress(0);
    const startTime = Date.now();
    const duration = 2000;
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.round((elapsed / duration) * 100));
      setTestProgress(pct);
      if (elapsed >= duration) {
        clearInterval(interval);
        setTestProgress(100);
        setTestResults([...pathTestResults]);
        setTestRunning(false);
      }
    }, 50);
  };

  const resetTests = () => {
    setTestResults([]);
    setTestProgress(0);
  };

  // ── P7-10: Advanced diagnostics (computed when test results available) ─────
  const advDiagnostics: AdvDiag[] = testResults.length > 0 ? [
    {
      label: "条件可满足性", passed: true,
      detail: "所有分支条件均可满足",
      icon: <Target size={10} />,
    },
    {
      label: "角色一致性", passed: true,
      detail: "未发现角色出场冲突",
      icon: <Users size={10} />,
    },
    {
      label: "道具可用性", passed: true,
      detail: "所有道具使用时均已获取",
      icon: <Package size={10} />,
    },
    {
      label: "变量冲突", passed: false,
      detail: "N06 存在互斥变量修改 (stealth +20 / -30)",
      icon: <GitMerge size={10} />,
    },
    {
      label: "分支长度", passed: false,
      detail: "N04→N06 分支仅 2 节点 (<3)",
      icon: <Ruler size={10} />,
    },
    {
      label: "选择影响力", passed: false,
      detail: "N01 两个选择均导向同一节点 N02",
      icon: <Zap size={10} />,
    },
  ] : [];

  const advPassCount = advDiagnostics.filter(d => d.passed).length;
  const advFailCount = advDiagnostics.filter(d => !d.passed).length;

  // ── P7-10: Failed check nodes (for 问题路径 highlight) ────────────────────
  const failedNodes = testResults.length > 0
    ? [...new Set(testResults.filter(r => !r.passed).flatMap(r => r.nodes))]
    : [];

  // ── P7-11: Exploration computed state ─────────────────────────────────────
  const exploration = playerExploration as PlayerExplorationMap;
  const currentSession = exploreSession > 0
    ? exploration.sessions.find(s => s.playthroughNumber === exploreSession) ?? null
    : null;

  const visitedSet = new Set<string>(
    exploreSession === 0
      ? exploration.sessions.flatMap(s => s.visitedNodeIds)
      : currentSession?.visitedNodeIds ?? []
  );

  const reachedEndSet = new Set<string>(
    exploreSession === 0
      ? exploration.sessions.flatMap(s => s.reachedEndingIds)
      : currentSession?.reachedEndingIds ?? []
  );

  // Edge taken check
  const isEdgeTaken = (from: string, to: string): boolean => {
    const sessions = exploreSession === 0
      ? exploration.sessions
      : [currentSession!].filter(Boolean);
    return sessions.some(s => {
      const v = s.visitedNodeIds;
      for (let i = 0; i < v.length - 1; i++) {
        if (v[i] === from && v[i + 1] === to) return true;
      }
      return false;
    });
  };

  // ── Error boundary ───────────────────────────────────────────────────────
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

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="h-svh flex overflow-hidden" style={{ background: "#000" }}>

      {/* ── 左侧：沉浸式游戏区 / 测试面板 / 探索图 ── */}
      <div className="flex-1 flex flex-col relative">

        {/* 沉浸式背景 */}
        <div className="absolute inset-0 z-0">
          <img alt="Scene" className="w-full h-full object-cover brightness-50"
            src={node.backgroundImage || "https://images.unsplash.com/photo-1515621061946-eff1c2a352bd?auto=format&fit=crop&w=800&q=80"} />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/70 opacity-90" />
        </div>

        {/* ── 顶部栏 (含 Tab 切换器) ── */}
        <div className="relative z-10 pt-4 px-4 pb-2">
          <div className="flex items-center gap-2 mb-2">
            <motion.button whileTap={{ scale: 0.85 }} onClick={() => router.back()}
              className="p-1.5 rounded-full backdrop-blur focus:outline-none"
              style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)", color: "#fff" }}>
              <ChevronLeft size={16} />
            </motion.button>
            <span className="text-[9px] font-bold" style={{ color: "rgba(255,255,255,0.5)" }}>
              幽灵协议 · {mainTab === "play" ? "试玩模式" : mainTab === "test" ? "自动测试" : "探索图"}
            </span>
          </div>

          {/* P7-10/11: Tab switcher */}
          <div className="flex gap-4 border-b" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
            {([
              { key: "play" as const, icon: <Gamepad2 size={12} />, label: "试玩模式" },
              { key: "test" as const, icon: <FlaskConical size={12} />, label: "自动测试" },
              { key: "explore" as const, icon: <Map size={12} />, label: "探索图" },
            ]).map(tab => (
              <motion.button
                key={tab.key}
                whileTap={{ scale: 0.95 }}
                onClick={() => switchTab(tab.key)}
                className="flex items-center gap-1.5 pb-2 pt-1 text-[10px] font-bold focus:outline-none relative"
                style={{
                  color: mainTab === tab.key ? "#a78bfa" : "rgba(255,255,255,0.35)",
                  transition: "color 0.2s",
                }}
              >
                {tab.icon}
                {tab.label}
                {mainTab === tab.key && (
                  <motion.div
                    layoutId="sim-tab-indicator"
                    className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full"
                    style={{ background: S.primary }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </motion.button>
            ))}
          </div>

          {/* HUD 变量显示 (play mode only) */}
          {mainTab === "play" && (
            <div className="flex gap-2 px-2.5 py-1 rounded-lg backdrop-blur text-[8px] font-bold mt-2"
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
          )}
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            TAB 1: 手动试玩内容 (existing)
           ════════════════════════════════════════════════════════════════════ */}
        {mainTab === "play" && (
          <>
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
          </>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            TAB 2: 自动测试面板 (P4-9 + P7-10 enhancements)
           ════════════════════════════════════════════════════════════════════ */}
        {mainTab === "test" && (
          <div className="flex-1 relative z-10 overflow-y-auto px-4 pb-6 pt-2">

            {/* ── P7-10: Coverage Statistics Panel ── */}
            <AnimatePresence>
              {testResults.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl p-4 backdrop-blur mb-4"
                  style={{ background: "rgba(0,0,0,0.7)", border: "1px solid rgba(255,255,255,0.12)" }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Target size={12} style={{ color: "#a78bfa" }} />
                    <span className="text-[10px] font-bold" style={{ color: "#fff" }}>覆盖率统计</span>
                    <span className="text-[8px] px-1.5 py-0.5 rounded" style={{
                      background: "rgba(99,85,216,0.2)", color: "#a78bfa",
                    }}>P7-10</span>
                  </div>
                  <div className="flex justify-around">
                    <CircularProgress
                      value={exploration.nodeCoverage}
                      label="节点覆盖率"
                      color={coverageColor(exploration.nodeCoverage)}
                    />
                    <CircularProgress
                      value={exploration.endingCoverage}
                      label="结局覆盖率"
                      color={coverageColor(exploration.endingCoverage)}
                    />
                    <CircularProgress
                      value={exploration.branchCoverage}
                      label="分支覆盖率"
                      color={coverageColor(exploration.branchCoverage)}
                    />
                    <CircularProgress
                      value={exploration.totalPlaythroughs}
                      label="总游玩次数"
                      color="#a78bfa"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 测试控制区 */}
            <div className="rounded-2xl p-4 backdrop-blur mb-4"
              style={{ background: "rgba(0,0,0,0.7)", border: "1px solid rgba(255,255,255,0.12)" }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FlaskConical size={14} style={{ color: "#a78bfa" }} />
                  <span className="text-[11px] font-bold" style={{ color: "#fff" }}>路径自动测试</span>
                  <span className="text-[8px] px-1.5 py-0.5 rounded" style={{
                    background: "rgba(99,85,216,0.2)", color: "#a78bfa"
                  }}>P4-9</span>
                </div>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={testResults.length > 0 ? resetTests : runTests}
                  disabled={testRunning}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold text-white focus:outline-none"
                  style={{
                    background: testRunning
                      ? "rgba(99,85,216,0.2)"
                      : `linear-gradient(135deg,${S.primary},${S.accent})`,
                    opacity: testRunning ? 0.6 : 1,
                    cursor: testRunning ? "not-allowed" : "pointer",
                  }}
                >
                  {testRunning ? (
                    <>
                      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                        <Clock size={11} />
                      </motion.div>
                      测试中...
                    </>
                  ) : testResults.length > 0 ? (
                    <><RotateCw size={11} /> 重新测试</>
                  ) : (
                    <><Play size={11} /> 运行全部测试</>
                  )}
                </motion.button>
              </div>

              {/* 进度条 */}
              <AnimatePresence>
                {testRunning && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[8px]" style={{ color: "rgba(255,255,255,0.5)" }}>正在遍历所有路径...</span>
                      <span className="text-[8px] font-mono font-bold" style={{ color: "#a78bfa" }}>{testProgress}%</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: `linear-gradient(90deg, ${S.primary}, ${S.accent})`, width: `${testProgress}%` }}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* 摘要 */}
              <AnimatePresence>
                {testResults.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="mt-3 flex gap-3">
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#a78bfa" }} />
                      <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.6)" }}>
                        总路径 <span className="font-bold text-white">{testResults.length}</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: S.success }} />
                      <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.6)" }}>
                        通过 <span className="font-bold" style={{ color: "#4ade80" }}>{testResults.filter(r => r.passed).length}</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: S.error }} />
                      <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.6)" }}>
                        失败 <span className="font-bold" style={{ color: "#f87171" }}>{testResults.filter(r => !r.passed).length}</span>
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 路径测试结果列表 */}
            <div className="space-y-3 mb-4">
              <AnimatePresence>
                {testResults.map((result, idx) => (
                  <motion.div
                    key={result.pathId}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="rounded-2xl p-4 backdrop-blur"
                    style={{
                      background: "rgba(0,0,0,0.7)",
                      border: `1px solid ${result.passed ? "rgba(5,150,105,0.3)" : "rgba(220,38,38,0.3)"}`,
                    }}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-[11px] font-bold truncate" style={{ color: "#fff" }}>{result.pathLabel}</span>
                        <span className="text-[8px] px-1.5 py-0.5 rounded shrink-0" style={{
                          background: result.endingType === "good" ? "rgba(74,222,128,0.15)" : "rgba(248,113,113,0.15)",
                          color: result.endingType === "good" ? "#4ade80" : "#f87171",
                        }}>
                          {result.endingType === "good" ? "好结局" : "坏结局"}
                        </span>
                      </div>
                      <span className="text-[9px] px-2 py-0.5 rounded-lg font-bold shrink-0 ml-2" style={{
                        background: result.passed ? "rgba(5,150,105,0.2)" : "rgba(220,38,38,0.2)",
                        color: result.passed ? "#4ade80" : "#f87171",
                      }}>
                        {result.passed ? "PASS" : "FAIL"}
                      </span>
                    </div>

                    {/* Node path visualization */}
                    <div className="flex items-center gap-1 flex-wrap mb-3">
                      {result.nodes.map((n, ni) => {
                        const isFailedNode = !result.passed && failedNodes.includes(n);
                        return (
                          <span key={ni} className="flex items-center gap-1">
                            <span className="flex items-center justify-center w-5 h-5 rounded-full text-[7px] font-mono font-bold" style={{
                              background: isFailedNode
                                ? "rgba(220,38,38,0.35)"
                                : ni === result.nodes.length - 1
                                  ? (result.endingType === "good" ? "rgba(74,222,128,0.25)" : "rgba(248,113,113,0.25)")
                                  : "rgba(99,85,216,0.2)",
                              color: isFailedNode
                                ? "#fca5a5"
                                : ni === result.nodes.length - 1
                                  ? (result.endingType === "good" ? "#4ade80" : "#f87171")
                                  : "#a78bfa",
                              border: `1px solid ${isFailedNode
                                ? "rgba(220,38,38,0.6)"
                                : ni === result.nodes.length - 1
                                  ? (result.endingType === "good" ? "rgba(74,222,128,0.4)" : "rgba(248,113,113,0.4)")
                                  : "rgba(99,85,216,0.3)"}`,
                            }}>
                              {n}
                            </span>
                            {ni < result.nodes.length - 1 && (
                              <div className="w-2 h-px" style={{ background: "rgba(255,255,255,0.2)" }} />
                            )}
                          </span>
                        );
                      })}
                    </div>

                    {/* Check items (original 5) */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px]">{result.reachable ? "✅" : "❌"}</span>
                        <span className="text-[9px]" style={{ color: result.reachable ? "#4ade80" : "#f87171" }}>
                          可达性
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px]">{!result.stuck ? "✅" : "❌"}</span>
                        <span className="text-[9px]" style={{ color: !result.stuck ? "#4ade80" : "#f87171" }}>
                          无卡死
                        </span>
                      </div>

                      {result.missingAssets.length > 0 && (
                        <div className="flex items-start gap-1.5">
                          <AlertTriangle size={10} className="mt-0.5 shrink-0" style={{ color: "#f87171" }} />
                          <div>
                            <span className="text-[9px] font-bold" style={{ color: "#f87171" }}>缺失资产:</span>
                            {result.missingAssets.map((a, ai) => (
                              <span key={ai} className="text-[8px] block ml-2" style={{ color: "rgba(248,113,113,0.8)" }}>
                                - {a}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {result.variableErrors.length > 0 && (
                        <div className="flex items-start gap-1.5">
                          <AlertTriangle size={10} className="mt-0.5 shrink-0" style={{ color: "#fbbf24" }} />
                          <div>
                            <span className="text-[9px] font-bold" style={{ color: "#fbbf24" }}>变量错误:</span>
                            {result.variableErrors.map((v, vi) => (
                              <span key={vi} className="text-[8px] block ml-2" style={{ color: "rgba(251,191,36,0.8)" }}>
                                - {v}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {result.emptyDialogues.length > 0 && (
                        <div className="flex items-start gap-1.5">
                          <AlertTriangle size={10} className="mt-0.5 shrink-0" style={{ color: "#fbbf24" }} />
                          <div>
                            <span className="text-[9px] font-bold" style={{ color: "#fbbf24" }}>空白对白:</span>
                            {result.emptyDialogues.map((d, di) => (
                              <span key={di} className="text-[8px] block ml-2" style={{ color: "rgba(251,191,36,0.8)" }}>
                                - {d}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* P7-10: 问题路径 highlight for failed results */}
                    {!result.passed && failedNodes.length > 0 && (
                      <div className="flex items-center gap-2 mt-3 pt-2" style={{ borderTop: "1px solid rgba(220,38,38,0.15)" }}>
                        <AlertTriangle size={9} style={{ color: "#f87171" }} />
                        <span className="text-[8px]" style={{ color: "#f87171" }}>
                          问题路径: {failedNodes.slice(0, 4).join(" → ")}
                        </span>
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            // Switch to explore tab and set session to "all"
                            setMainTab("explore");
                            setTestMode(false);
                            setExploreSession(0);
                          }}
                          className="ml-auto text-[8px] px-2 py-0.5 rounded font-bold focus:outline-none"
                          style={{
                            background: "rgba(220,38,38,0.15)",
                            color: "#f87171",
                            border: "1px solid rgba(220,38,38,0.3)",
                          }}
                        >
                          跳转到问题节点
                        </motion.button>
                      </div>
                    )}

                    {/* Duration */}
                    <div className="flex items-center gap-1.5 mt-3 pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                      <Clock size={9} style={{ color: "rgba(255,255,255,0.3)" }} />
                      <span className="text-[8px]" style={{ color: "rgba(255,255,255,0.4)" }}>
                        预估体验时长: {Math.floor(result.totalDuration / 60)}分{result.totalDuration % 60}秒
                      </span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* ── P7-10: Advanced Diagnostics Panel ── */}
            <AnimatePresence>
              {testResults.length > 0 && advDiagnostics.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: testResults.length * 0.1 + 0.1 }}
                  className="rounded-2xl p-4 backdrop-blur mb-4"
                  style={{ background: "rgba(0,0,0,0.7)", border: "1px solid rgba(99,85,216,0.3)" }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <GitBranch size={13} style={{ color: "#a78bfa" }} />
                    <span className="text-[11px] font-bold" style={{ color: "#a78bfa" }}>高级诊断</span>
                    <span className="text-[8px] px-1.5 py-0.5 rounded" style={{
                      background: "rgba(99,85,216,0.2)", color: "#a78bfa",
                    }}>P7-10</span>
                    <div className="ml-auto flex gap-2">
                      <span className="text-[8px] font-bold" style={{ color: "#4ade80" }}>
                        {advPassCount} 通过
                      </span>
                      <span className="text-[8px] font-bold" style={{ color: "#f87171" }}>
                        {advFailCount} 警告
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {advDiagnostics.map((d, i) => (
                      <motion.div
                        key={d.label}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-start gap-2 rounded-lg p-2"
                        style={{
                          background: d.passed ? "rgba(5,150,105,0.08)" : "rgba(217,119,6,0.1)",
                          border: `1px solid ${d.passed ? "rgba(5,150,105,0.15)" : "rgba(217,119,6,0.2)"}`,
                        }}
                      >
                        <span className="text-[10px] mt-0.5 shrink-0" style={{ color: d.passed ? "#4ade80" : "#fbbf24" }}>
                          {d.icon}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-bold" style={{ color: d.passed ? "#4ade80" : "#fbbf24" }}>
                              {d.label}
                            </span>
                            <span className="text-[8px] px-1.5 py-0.5 rounded font-bold" style={{
                              background: d.passed ? "rgba(5,150,105,0.2)" : "rgba(217,119,6,0.2)",
                              color: d.passed ? "#4ade80" : "#fbbf24",
                            }}>
                              {d.passed ? "PASS" : "WARN"}
                            </span>
                          </div>
                          <p className="text-[8px] mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>
                            {d.detail}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 问题汇总 */}
            <AnimatePresence>
              {testResults.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: testResults.length * 0.1 + 0.2 }}
                  className="rounded-2xl p-4 backdrop-blur"
                  style={{ background: "rgba(0,0,0,0.7)", border: "1px solid rgba(217,119,6,0.3)" }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle size={13} style={{ color: "#fbbf24" }} />
                    <span className="text-[11px] font-bold" style={{ color: "#fbbf24" }}>问题汇总</span>
                  </div>

                  {(() => {
                    const allAssets = Array.from(new Set(testResults.flatMap(r => r.missingAssets)));
                    const allVarErrors = Array.from(new Set(testResults.flatMap(r => r.variableErrors)));
                    const allEmptyDialogues = Array.from(new Set(testResults.flatMap(r => r.emptyDialogues)));
                    const totalIssues = allAssets.length + allVarErrors.length + allEmptyDialogues.length;

                    return (
                      <div className="space-y-3">
                        {allAssets.length > 0 && (
                          <div>
                            <div className="flex items-center gap-1.5 mb-1">
                              <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#f87171" }} />
                              <span className="text-[9px] font-bold" style={{ color: "#f87171" }}>
                                缺失资产 ({allAssets.length} 项)
                              </span>
                            </div>
                            {allAssets.map((a, i) => (
                              <span key={i} className="text-[8px] block ml-3" style={{ color: "rgba(248,113,113,0.8)" }}>
                                - {a}
                              </span>
                            ))}
                          </div>
                        )}

                        {allVarErrors.length > 0 && (
                          <div>
                            <div className="flex items-center gap-1.5 mb-1">
                              <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#fbbf24" }} />
                              <span className="text-[9px] font-bold" style={{ color: "#fbbf24" }}>
                                变量错误 ({allVarErrors.length} 项)
                              </span>
                            </div>
                            {allVarErrors.map((v, i) => (
                              <span key={i} className="text-[8px] block ml-3" style={{ color: "rgba(251,191,36,0.8)" }}>
                                - {v}
                              </span>
                            ))}
                          </div>
                        )}

                        {allEmptyDialogues.length > 0 && (
                          <div>
                            <div className="flex items-center gap-1.5 mb-1">
                              <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#fbbf24" }} />
                              <span className="text-[9px] font-bold" style={{ color: "#fbbf24" }}>
                                空白对白 ({allEmptyDialogues.length} 项)
                              </span>
                            </div>
                            {allEmptyDialogues.map((d, i) => (
                              <span key={i} className="text-[8px] block ml-3" style={{ color: "rgba(251,191,36,0.8)" }}>
                                - {d}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* 建议修复优先级 */}
                        <div className="pt-2 mt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                          <span className="text-[9px] font-bold" style={{ color: "rgba(255,255,255,0.6)" }}>
                            建议修复优先级
                          </span>
                          <div className="space-y-1 mt-1.5">
                            {allAssets.length > 0 && (
                              <div className="flex items-center gap-1.5">
                                <span className="text-[8px] px-1.5 py-0.5 rounded font-bold" style={{
                                  background: "rgba(220,38,38,0.2)", color: "#f87171"
                                }}>P0</span>
                                <span className="text-[8px]" style={{ color: "rgba(255,255,255,0.5)" }}>
                                  补齐缺失的场景图片和 BGM 资源
                                </span>
                              </div>
                            )}
                            {allVarErrors.length > 0 && (
                              <div className="flex items-center gap-1.5">
                                <span className="text-[8px] px-1.5 py-0.5 rounded font-bold" style={{
                                  background: "rgba(217,119,6,0.2)", color: "#fbbf24"
                                }}>P1</span>
                                <span className="text-[8px]" style={{ color: "rgba(255,255,255,0.5)" }}>
                                  修复变量判定条件逻辑
                                </span>
                              </div>
                            )}
                            {allEmptyDialogues.length > 0 && (
                              <div className="flex items-center gap-1.5">
                                <span className="text-[8px] px-1.5 py-0.5 rounded font-bold" style={{
                                  background: "rgba(217,119,6,0.2)", color: "#fbbf24"
                                }}>P1</span>
                                <span className="text-[8px]" style={{ color: "rgba(255,255,255,0.5)" }}>
                                  补充空白对白和失败反馈文案
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="text-[8px] pt-1" style={{ color: "rgba(255,255,255,0.3)" }}>
                          共发现 {totalIssues} 个问题，建议优先修复 P0 级别问题后再发布
                        </div>
                      </div>
                    );
                  })()}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            TAB 3: P7-11 探索图 (Player Exploration Flowchart)
           ════════════════════════════════════════════════════════════════════ */}
        {mainTab === "explore" && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex-1 relative z-10 overflow-y-auto px-4 pb-6 pt-2"
          >
            {/* ── Session selector pills ── */}
            <div className="flex gap-2 mb-4 flex-wrap">
              {exploration.sessions.map(s => (
                <motion.button
                  key={s.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setExploreSession(s.playthroughNumber)}
                  className="px-3 py-1.5 rounded-full text-[10px] font-bold focus:outline-none"
                  style={{
                    background: exploreSession === s.playthroughNumber
                      ? SESSION_COLORS[s.playthroughNumber - 1]
                      : "rgba(255,255,255,0.06)",
                    border: `1px solid ${
                      exploreSession === s.playthroughNumber
                        ? SESSION_COLORS[s.playthroughNumber - 1]
                        : "rgba(255,255,255,0.12)"
                    }`,
                    color: exploreSession === s.playthroughNumber ? "#fff" : "rgba(255,255,255,0.5)",
                  }}
                >
                  <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{
                    background: SESSION_COLORS[s.playthroughNumber - 1],
                    opacity: exploreSession === s.playthroughNumber ? 1 : 0.5,
                  }} />
                  第 {s.playthroughNumber} 次
                </motion.button>
              ))}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setExploreSession(0)}
                className="px-3 py-1.5 rounded-full text-[10px] font-bold focus:outline-none"
                style={{
                  background: exploreSession === 0
                    ? "rgba(99,85,216,0.3)" : "rgba(255,255,255,0.06)",
                  border: `1px solid ${
                    exploreSession === 0 ? S.primary : "rgba(255,255,255,0.12)"
                  }`,
                  color: exploreSession === 0 ? "#a78bfa" : "rgba(255,255,255,0.5)",
                }}
              >
                全部叠加
              </motion.button>
            </div>

            {/* ── SVG Node Graph ── */}
            <div className="rounded-2xl p-3 backdrop-blur mb-4"
              style={{ background: "rgba(0,0,0,0.7)", border: "1px solid rgba(255,255,255,0.12)" }}>
              <div className="flex items-center gap-2 mb-2">
                <Eye size={11} style={{ color: "#a78bfa" }} />
                <span className="text-[10px] font-bold" style={{ color: "#fff" }}>探索路径图</span>
              </div>

              <svg viewBox="0 0 280 465" className="w-full" style={{ maxHeight: 340 }}>
                <defs>
                  <marker id="arr-taken" viewBox="0 0 10 8" refX="9" refY="4"
                    markerWidth="7" markerHeight="6" orient="auto">
                    <path d="M0 0 L10 4 L0 8z" fill="rgba(255,255,255,0.45)" />
                  </marker>
                  <marker id="arr-gray" viewBox="0 0 10 8" refX="9" refY="4"
                    markerWidth="7" markerHeight="6" orient="auto">
                    <path d="M0 0 L10 4 L0 8z" fill="rgba(255,255,255,0.12)" />
                  </marker>
                  {SESSION_COLORS.map((c, i) => (
                    <marker key={i} id={`arr-s${i + 1}`} viewBox="0 0 10 8" refX="9" refY="4"
                      markerWidth="7" markerHeight="6" orient="auto">
                      <path d="M0 0 L10 4 L0 8z" fill={c} />
                    </marker>
                  ))}
                </defs>

                {/* Edges */}
                {EXPLORE_EDGES.map(({ from, to }, ei) => {
                  const a = NODE_POS[from];
                  const b = NODE_POS[to];
                  if (!a || !b) return null;
                  const taken = isEdgeTaken(from, to);

                  // Determine edge color for per-session view
                  let edgeColor = "rgba(255,255,255,0.12)";
                  let markerEnd = "url(#arr-gray)";
                  if (taken) {
                    if (exploreSession > 0) {
                      edgeColor = SESSION_COLORS[exploreSession - 1];
                      markerEnd = `url(#arr-s${exploreSession})`;
                    } else {
                      edgeColor = "rgba(255,255,255,0.45)";
                      markerEnd = "url(#arr-taken)";
                    }
                  }

                  // Offset start/end to not overlap node circles
                  const dx = b.x - a.x;
                  const dy = b.y - a.y;
                  const len = Math.sqrt(dx * dx + dy * dy) || 1;
                  const nodeR = 16;
                  const x1 = a.x + (dx / len) * nodeR;
                  const y1 = a.y + (dy / len) * nodeR;
                  const x2 = b.x - (dx / len) * (nodeR + 4);
                  const y2 = b.y - (dy / len) * (nodeR + 4);

                  return (
                    <line key={ei} x1={x1} y1={y1} x2={x2} y2={y2}
                      stroke={edgeColor}
                      strokeWidth={taken ? 2 : 1}
                      strokeDasharray={taken ? undefined : "4 3"}
                      markerEnd={markerEnd}
                    />
                  );
                })}

                {/* Nodes */}
                {exploration.allNodeIds.map(nid => {
                  const pos = NODE_POS[nid];
                  if (!pos) return null;
                  const isVisited = visitedSet.has(nid);
                  const isEnd = exploration.allEndingIds.includes(nid);
                  const isReached = isEnd && reachedEndSet.has(nid);
                  const isChoiceNode = ["N03", "N06"].includes(nid);

                  // Determine fill / stroke
                  let fill = "rgba(255,255,255,0.04)";
                  let stroke = "rgba(255,255,255,0.15)";
                  let textColor = "rgba(255,255,255,0.3)";
                  let strokeDash = "4 3";
                  let strokeW = 1;

                  if (isVisited) {
                    strokeDash = "";
                    strokeW = 2;
                    if (exploreSession > 0) {
                      const c = SESSION_COLORS[exploreSession - 1];
                      fill = c + "30";
                      stroke = c;
                      textColor = c;
                    } else {
                      // All overlaid: find which sessions visited this node
                      const sessIdxs = exploration.sessions
                        .filter(s => s.visitedNodeIds.includes(nid))
                        .map(s => s.playthroughNumber - 1);
                      const primaryIdx = sessIdxs[0] ?? 0;
                      const c = SESSION_COLORS[primaryIdx];
                      fill = c + "25";
                      stroke = c;
                      textColor = c;
                    }
                  }

                  if (isEnd && isReached) {
                    fill = "rgba(255,215,0,0.2)";
                    stroke = "#FFD700";
                    textColor = "#FFD700";
                    strokeDash = "";
                    strokeW = 2;
                  }

                  const r = 16;

                  return (
                    <g key={nid}>
                      {/* Node shape */}
                      {isChoiceNode ? (
                        /* Diamond for choice nodes */
                        <polygon
                          points={`${pos.x},${pos.y - r} ${pos.x + r},${pos.y} ${pos.x},${pos.y + r} ${pos.x - r},${pos.y}`}
                          fill={fill} stroke={stroke} strokeWidth={strokeW}
                          strokeDasharray={strokeDash}
                        />
                      ) : (
                        <circle cx={pos.x} cy={pos.y} r={r}
                          fill={fill} stroke={stroke} strokeWidth={strokeW}
                          strokeDasharray={strokeDash}
                        />
                      )}

                      {/* Ending star / question mark */}
                      {isEnd && isReached && (
                        <Star size={10} x={pos.x - 5} y={pos.y - r - 14}
                          fill="#FFD700" stroke="none" />
                      )}
                      {isEnd && !isReached && (
                        <text x={pos.x} y={pos.y - r - 6} textAnchor="middle"
                          fill="rgba(255,255,255,0.25)" fontSize={11}>?</text>
                      )}

                      {/* Node label */}
                      <text x={pos.x} y={pos.y + 1} textAnchor="middle" dominantBaseline="middle"
                        fill={textColor} fontSize={9} fontFamily="monospace" fontWeight="bold">
                        {NODE_LABEL[nid] ?? nid}
                      </text>
                    </g>
                  );
                })}

                {/* Legend */}
                <g transform="translate(4, 450)">
                  <circle cx={4} cy={0} r={3} fill="rgba(94,80,232,0.5)" stroke="#5E50E8" strokeWidth={1} />
                  <text x={12} y={3} fill="rgba(255,255,255,0.35)" fontSize={7}>已访问</text>
                  <circle cx={54} cy={0} r={3} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={1} strokeDasharray="2 1" />
                  <text x={62} y={3} fill="rgba(255,255,255,0.35)" fontSize={7}>未访问</text>
                  <polygon points="114,0 117,-3 120,0 117,3" fill="rgba(255,215,0,0.3)" stroke="#FFD700" strokeWidth={1} />
                  <text x={125} y={3} fill="rgba(255,255,255,0.35)" fontSize={7}>结局</text>
                </g>
              </svg>
            </div>

            {/* ── Exploration Stats Panel ── */}
            <div className="rounded-2xl p-4 backdrop-blur mb-4"
              style={{ background: "rgba(0,0,0,0.7)", border: "1px solid rgba(255,255,255,0.12)" }}>
              <div className="flex items-center gap-2 mb-3">
                <Trophy size={12} style={{ color: "#a78bfa" }} />
                <span className="text-[10px] font-bold" style={{ color: "#fff" }}>探索统计</span>
              </div>

              {/* Session-by-session summary */}
              <div className="space-y-2 mb-3">
                {exploration.sessions.map(s => {
                  const sColor = SESSION_COLORS[s.playthroughNumber - 1];
                  return (
                    <div key={s.id} className="flex items-center gap-2 rounded-lg p-2"
                      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ background: sColor }} />
                      <span className="text-[9px] font-bold shrink-0" style={{ color: sColor }}>
                        {s.sessionLabel}
                      </span>
                      <span className="text-[8px]" style={{ color: "rgba(255,255,255,0.45)" }}>
                        {s.choicesMade.length} 个选择
                      </span>
                      <span className="text-[8px]" style={{ color: "rgba(255,255,255,0.45)" }}>
                        {Math.floor(s.duration / 60)}:{String(s.duration % 60).padStart(2, "0")}
                      </span>
                      <span className="text-[8px] ml-auto font-bold" style={{
                        color: s.reachedEndingIds[0] === "N10" ? "#4ade80" : "#f87171"
                      }}>
                        {s.reachedEndingIds[0] === "N10" ? "好结局" : "坏结局"}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Discovered / Undiscovered nodes */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <span className="text-[8px] font-bold" style={{ color: "rgba(255,255,255,0.45)" }}>
                    已发现 ({visitedSet.size}/{exploration.allNodeIds.length})
                  </span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {exploration.allNodeIds.filter(n => visitedSet.has(n)).map(n => (
                      <span key={n} className="text-[7px] font-mono px-1.5 py-0.5 rounded"
                        style={{ background: "rgba(5,150,105,0.15)", color: "#4ade80" }}>
                        {n}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-[8px] font-bold" style={{ color: "rgba(255,255,255,0.45)" }}>
                    未发现 ({exploration.allNodeIds.length - visitedSet.size})
                  </span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {exploration.allNodeIds.filter(n => !visitedSet.has(n)).length === 0
                      ? <span className="text-[8px]" style={{ color: "rgba(255,255,255,0.3)" }}>全部已发现</span>
                      : exploration.allNodeIds.filter(n => !visitedSet.has(n)).map(n => (
                        <span key={n} className="text-[7px] font-mono px-1.5 py-0.5 rounded"
                          style={{ background: "rgba(220,38,38,0.12)", color: "#f87171" }}>
                          {n}
                        </span>
                      ))}
                  </div>
                </div>
              </div>

              {/* Exploration completion progress bar */}
              <div className="mb-2">
                <div className="flex justify-between mb-1">
                  <span className="text-[8px] font-bold" style={{ color: "rgba(255,255,255,0.5)" }}>
                    探索完成度
                  </span>
                  <span className="text-[9px] font-mono font-bold" style={{
                    color: coverageColor(exploration.nodeCoverage)
                  }}>
                    {exploration.nodeCoverage}%
                  </span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                  <motion.div
                    className="h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${exploration.nodeCoverage}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    style={{ background: `linear-gradient(90deg, ${S.primary}, ${coverageColor(exploration.nodeCoverage)})` }}
                  />
                </div>
              </div>

              {/* Suggestion */}
              {exploration.branchCoverage < 100 && (
                <div className="flex items-center gap-2 mt-3 p-2 rounded-lg"
                  style={{ background: "rgba(217,119,6,0.1)", border: "1px solid rgba(217,119,6,0.2)" }}>
                  <AlertTriangle size={10} style={{ color: "#fbbf24" }} />
                  <span className="text-[8px]" style={{ color: "#fbbf24" }}>
                    尝试不同选择以发现更多分支 (还有 {exploration.allBranchCount - Math.round(exploration.allBranchCount * exploration.branchCoverage / 100)} 条未探索)
                  </span>
                </div>
              )}
            </div>

            {/* ── Choice History for selected session ── */}
            {currentSession && (
              <div className="rounded-2xl p-4 backdrop-blur"
                style={{ background: "rgba(0,0,0,0.7)", border: "1px solid rgba(255,255,255,0.12)" }}>
                <div className="flex items-center gap-2 mb-3">
                  <GitBranch size={12} style={{ color: SESSION_COLORS[currentSession.playthroughNumber - 1] }} />
                  <span className="text-[10px] font-bold" style={{ color: "#fff" }}>
                    选择历史 — {currentSession.sessionLabel}
                  </span>
                </div>

                <div className="space-y-2">
                  {currentSession.choicesMade.map((ch, ci) => {
                    const graphNode = playableGraph[ch.nodeId];
                    const allChoices = graphNode?.choices ?? [];
                    const altChoices = allChoices.filter(c => c.label !== ch.choiceLabel);

                    return (
                      <motion.div
                        key={ci}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: ci * 0.08 }}
                        className="rounded-lg p-2.5"
                        style={{
                          background: "rgba(255,255,255,0.03)",
                          border: "1px solid rgba(255,255,255,0.06)",
                        }}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded shrink-0"
                            style={{
                              background: SESSION_COLORS[currentSession.playthroughNumber - 1] + "30",
                              color: SESSION_COLORS[currentSession.playthroughNumber - 1],
                            }}>
                            {ch.nodeId}
                          </span>
                          <ArrowRight size={9} style={{ color: "rgba(255,255,255,0.25)" }} />
                          <span className="text-[9px] font-bold" style={{ color: "#fff" }}>
                            {ch.choiceLabel}
                          </span>
                        </div>
                        {altChoices.length > 0 && (
                          <div className="mt-1 pl-4">
                            {altChoices.map((alt, ai) => (
                              <span key={ai} className="text-[8px] block" style={{ color: "rgba(255,255,255,0.25)" }}>
                                未选: {alt.label}
                              </span>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* No session selected hint */}
            {exploreSession === 0 && (
              <div className="rounded-2xl p-4 backdrop-blur text-center"
                style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.35)" }}>
                  选择上方具体游玩次数查看该次的选择历史
                </span>
              </div>
            )}
          </motion.div>
        )}
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
