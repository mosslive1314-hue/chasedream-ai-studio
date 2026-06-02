"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, SkipBack, RefreshCw, Trophy, Play, FlaskConical, Gamepad2, AlertTriangle, Clock, RotateCw } from "lucide-react";
import { PLAYABLE_GRAPH, INIT_VARIABLES, PATH_TEST_RESULTS, type PlayableNode, type PathTestResult } from "@/lib/studio-data";

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

  // P4-9: Test mode state
  const [testMode, setTestMode] = useState(false);
  const [testRunning, setTestRunning] = useState(false);
  const [testResults, setTestResults] = useState<PathTestResult[]>([]);
  const [testProgress, setTestProgress] = useState(0);

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

  // P4-9: Run all tests with progress animation
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
        setTestResults([...PATH_TEST_RESULTS]);
        setTestRunning(false);
      }
    }, 50);
  };

  const resetTests = () => {
    setTestResults([]);
    setTestProgress(0);
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

      {/* ── 左侧：沉浸式游戏区 / 测试面板 ── */}
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
              幽灵协议 · {testMode ? "自动测试" : "试玩模式"}
            </span>
            {/* P4-9: Mode toggle */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setTestMode(!testMode)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-bold focus:outline-none ml-2"
              style={{
                background: testMode ? "rgba(99,85,216,0.4)" : "rgba(0,169,157,0.3)",
                border: `1px solid ${testMode ? "rgba(99,85,216,0.6)" : "rgba(0,169,157,0.5)"}`,
                color: testMode ? "#a78bfa" : "#5EEAD4",
              }}
            >
              {testMode ? <FlaskConical size={10} /> : <Gamepad2 size={10} />}
              {testMode ? "自动测试" : "手动试玩"}
            </motion.button>
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

        {/* ── 手动试玩内容 ── */}
        {!testMode && (
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

        {/* ── P4-9: 自动测试面板 ── */}
        {testMode && (
          <div className="flex-1 relative z-10 overflow-y-auto px-4 pb-6 pt-2">

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
                      {result.nodes.map((n, ni) => (
                        <span key={ni} className="flex items-center gap-1">
                          <span className="flex items-center justify-center w-5 h-5 rounded-full text-[7px] font-mono font-bold" style={{
                            background: ni === result.nodes.length - 1
                              ? (result.endingType === "good" ? "rgba(74,222,128,0.25)" : "rgba(248,113,113,0.25)")
                              : "rgba(99,85,216,0.2)",
                            color: ni === result.nodes.length - 1
                              ? (result.endingType === "good" ? "#4ade80" : "#f87171")
                              : "#a78bfa",
                            border: `1px solid ${ni === result.nodes.length - 1
                              ? (result.endingType === "good" ? "rgba(74,222,128,0.4)" : "rgba(248,113,113,0.4)")
                              : "rgba(99,85,216,0.3)"}`,
                          }}>
                            {n}
                          </span>
                          {ni < result.nodes.length - 1 && (
                            <div className="w-2 h-px" style={{ background: "rgba(255,255,255,0.2)" }} />
                          )}
                        </span>
                      ))}
                    </div>

                    {/* Check items */}
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
