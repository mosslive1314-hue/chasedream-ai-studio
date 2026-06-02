"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FACTORY_TASKS, type FactoryTask } from "@/lib/studio-data";
import { RefreshCw, CheckCircle, AlertCircle } from "lucide-react";

const MODE_CARDS = [
  {
    id: "faithful",
    label: "忠实还原",
    sublabel: "Faithful 1:1",
    desc: "严格按照文本场景100%提取，不做任何改动。",
    locked: false,
  },
  {
    id: "optimized",
    label: "AI优化",
    sublabel: "AI Optimized",
    desc: "自动修补叙事漏洞，强化冲突节奏。",
    locked: true,
  },
  {
    id: "interactive",
    label: "互动改编",
    sublabel: "Interactive",
    desc: "识别分支点，自动生成选择与条件节点。",
    locked: true,
  },
];

const AGENT_LABELS: Record<string, string> = {
  outline: "StoryManager",
  characters: "PersonaAgent",
  scenes: "SceneVisualist",
  props: "PropCataloguer",
  nodes: "FlowPlanner",
  choices: "LogicWeaver",
  endings: "EndingDirector",
  logic: "ConsistencyAI",
  assets_req: "AssetMapper",
  publish_check: "QAGuard",
};

function PipelineStep({ task, index }: { task: FactoryTask; index: number }) {
  const isDone = task.status === "done";
  const isRunning = task.status === "running";
  const isPending = task.status === "pending";

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04 }}
      className="relative z-10 flex items-start gap-4 w-full"
    >
      {/* Status circle */}
      <div
        className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center
          ${isDone ? "border-2" : isRunning ? "border-2 neon-border-primary" : "border-2"}`}
        style={{
          background: "var(--app-surface)",
          borderColor: isDone ? "var(--app-success)" : isRunning ? "var(--app-primary)" : "var(--app-border)",
          color: isDone ? "var(--app-success)" : isRunning ? "var(--app-primary)" : "var(--app-text-muted)",
        }}
      >
        {isDone ? (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} />
          </svg>
        ) : isRunning ? (
          <div className="w-2.5 h-2.5 rounded-full animate-ping" style={{ background: "var(--app-primary)" }} />
        ) : (
          <span className="text-[10px] font-bold">{index + 1}</span>
        )}
      </div>

      {/* Card */}
      <div
        className="flex-1 rounded-xl p-3 text-left"
        style={{
          background: "var(--app-surface)",
          border: `1px solid ${isRunning ? "var(--app-primary)" : "var(--app-border)"}`,
          opacity: isPending ? 0.6 : 1,
          boxShadow: isRunning ? "0 4px 14px rgba(123,92,240,0.1)" : undefined,
        }}
      >
        <div className="flex items-center justify-between mb-1">
          <span
            className="text-[9px] font-bold uppercase tracking-wider"
            style={{ color: isDone ? "var(--app-success)" : isRunning ? "var(--app-primary)" : "var(--app-text-muted)" }}
          >
            {AGENT_LABELS[task.id] ?? task.id}
          </span>
          {isDone && <span className="text-[9px]" style={{ color: "var(--app-text-muted)" }}>Done</span>}
          {isRunning && (
            <span className="text-[8px] rounded-full px-1.5 py-0.5 animate-pulse font-bold"
              style={{ background: "rgba(123,92,240,0.2)", color: "var(--app-primary)" }}>
              Running
            </span>
          )}
        </div>
        <h4 className="text-[11px] font-bold mb-0.5" style={{ color: isRunning ? "var(--app-text)" : "var(--app-text-secondary)" }}>
          {task.label}
        </h4>
        {isRunning && (
          <p className="text-[9px] leading-snug" style={{ color: "var(--app-text-secondary)" }}>
            提取主干 DAG 状态转换与逻辑变量映射...
          </p>
        )}
        {isDone && task.result && (
          <p className="text-[9px]" style={{ color: "var(--app-accent)" }}>{task.result}</p>
        )}
      </div>
    </motion.div>
  );
}

export default function FactoryScreen() {
  const [selectedMode, setSelectedMode] = useState("faithful");

  return (
    <div className="h-full flex flex-col overflow-y-auto" style={{ background: "var(--app-surface)" }}>

      {/* Header */}
      <div className="p-4 sticky top-0 z-10" style={{ borderBottom: "1px solid var(--app-border)", background: "var(--app-surface)" }}>
        <h2 className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: "var(--app-text)" }}>
          AI 智能工厂
        </h2>
        <p className="text-[10px] flex items-center gap-1" style={{ color: "var(--app-text-muted)" }}>
          目标剧本：
          <span className="font-bold" style={{ color: "var(--app-accent)" }}>幽灵协议_v4.txt</span>
        </p>
      </div>

      {/* Mode selector */}
      <div className="px-4 pt-4">
        <span className="text-[10px] font-medium block mb-2" style={{ color: "var(--app-text-secondary)" }}>
          制作模式
        </span>
        <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
          {MODE_CARDS.map((mode) => {
            const active = selectedMode === mode.id && !mode.locked;
            return (
              <motion.button
                key={mode.id}
                whileTap={{ scale: 0.97 }}
                disabled={mode.locked}
                onClick={() => !mode.locked && setSelectedMode(mode.id)}
                className="shrink-0 w-[140px] p-2.5 rounded-xl text-left focus:outline-none"
                style={{
                  background: "var(--app-surface)",
                  border: `1px solid ${active ? "var(--app-primary)" : "var(--app-border)"}`,
                  boxShadow: active ? "0 0 0 1px rgba(123,92,240,0.3), 0 0 12px rgba(123,92,240,0.1)" : undefined,
                  opacity: mode.locked ? 0.5 : 1,
                }}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: active ? "rgba(123,92,240,0.2)" : "transparent", border: `1px solid ${active ? "var(--app-primary)" : "var(--app-border)"}` }}>
                    {mode.locked ? (
                      <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
                      </svg>
                    ) : (
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: active ? "var(--app-primary)" : "var(--app-text-muted)" }}>
                        <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
                      </svg>
                    )}
                  </div>
                  <span className="text-[11px] font-bold" style={{ color: active ? "var(--app-text)" : "var(--app-text-secondary)" }}>
                    {mode.label}
                  </span>
                </div>
                <p className="text-[9px] leading-relaxed" style={{ color: "var(--app-text-muted)" }}>{mode.desc}</p>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Pipeline */}
      <div className="px-4 py-3 flex-1">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--app-text-muted)" }}>
            多智能体流水线
          </h3>
          <div className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded"
            style={{ border: "1px solid var(--app-border)", color: "var(--app-text-secondary)" }}>
            <RefreshCw size={10} style={{ color: "var(--app-accent)" }} />
            <span>运行中</span>
          </div>
        </div>

        {/* Vertical pipeline with connecting line */}
        <div className="relative space-y-3" style={{ paddingLeft: 0 }}>
          <div
            className="absolute left-[17px] top-4 bottom-4 w-[2px] z-0"
            style={{ background: "var(--app-border)" }}
          />
          {FACTORY_TASKS.map((task, i) => (
            <PipelineStep key={task.id} task={task} index={i} />
          ))}
        </div>
      </div>

      {/* Terminal Console */}
      <div className="px-4 pb-6 mt-2">
        <div className="rounded-xl p-3" style={{ background: "#030408", border: "1px solid var(--app-border)" }}>
          <div className="flex items-center justify-between mb-2 pb-2" style={{ borderBottom: "1px solid var(--app-border)" }}>
            <span className="text-[9px] font-bold uppercase" style={{ color: "var(--app-primary)" }}>Terminal Output</span>
          </div>
          <div className="space-y-1.5 text-[9px] leading-tight">
            <div style={{ color: "var(--app-text-muted)", opacity: 0.5 }}>[INFO] 剧本解析机制启动...</div>
            <div style={{ color: "var(--app-success)", opacity: 0.7 }}>[OK] StoryManager 创建了 40 个故事片段。</div>
            <div style={{ color: "var(--app-success)", opacity: 0.85 }}>[OK] SceneVisualist 映射了 24 个场景环境。</div>
            <div className="flex items-start gap-1" style={{ color: "var(--app-accent)" }}>
              <span className="animate-pulse">▌</span>
              <span>[RUNNING] FlowPlanner 同步变量...</span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 mt-3">
          <motion.button
            whileTap={{ scale: 0.97 }}
            className="flex-1 py-2.5 rounded-lg text-xs font-bold"
            style={{ background: "var(--app-primary)", color: "#fff", boxShadow: "0 0 12px rgba(123,92,240,0.25)" }}
          >
            继续执行
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            className="flex-1 py-2.5 rounded-lg text-xs font-medium"
            style={{ background: "transparent", border: "1px solid var(--app-border)", color: "var(--app-text-secondary)" }}
          >
            重新生成
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            className="flex-1 py-2.5 rounded-lg text-xs font-bold"
            style={{ background: "rgba(0,212,200,0.15)", border: "1px solid rgba(0,212,200,0.4)", color: "var(--app-accent)" }}
          >
            应用到工作台
          </motion.button>
        </div>
      </div>
    </div>
  );
}
