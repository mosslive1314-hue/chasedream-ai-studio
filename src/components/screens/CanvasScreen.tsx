"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Play, AlertTriangle, ChevronDown } from "lucide-react";
import { STORY_NODES, NODE_EDGES, type StoryNode } from "@/lib/studio-data";

// ── 浅色极简 tokens ──
const S = {
  surface:"#F8F9FC", card:"#FFFFFF", cardAlt:"#F3F4F8",
  dagBg:"#EEF0F6", dagGrid:"#D8DCE8", border:"#E4E7EF",
  primary:"#6355D8", accent:"#00A99D",
  text:"#1A1D2E", textSec:"#555B7A", textMuted:"#9198B5",
  success:"#059669", warning:"#D97706", error:"#DC2626",
};

const NODE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  start:        { label: "▶ 起始",   color: "#4A6CF7", bg: "rgba(74,108,247,0.06)" },
  scene:        { label: "● 场景",   color: S.textSec,  bg: "transparent" },
  choice:       { label: "⚖ 选择",   color: S.accent,   bg: "rgba(0,169,157,0.05)" },
  condition:    { label: "◆ 条件",   color: S.warning,  bg: "rgba(217,119,6,0.05)" },
  qte:          { label: "⚡ QTE",   color: "#EA580C",  bg: "rgba(234,88,12,0.05)" },
  ending_good:  { label: "★ 结局A",  color: S.success,  bg: "rgba(5,150,105,0.06)" },
  ending_bad:   { label: "✕ 结局B",  color: S.error,    bg: "rgba(220,38,38,0.05)" },
};

function NodeCard({ node, selected, onClick }: { node: StoryNode; selected: boolean; onClick: () => void }) {
  const cfg = NODE_CONFIG[node.type] ?? NODE_CONFIG.scene;
  const isError = node.hasError;
  const isEnding = node.type === 'ending_good' || node.type === 'ending_bad';

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="absolute text-left focus:outline-none rounded-xl"
      style={{
        left: node.x - 90,
        top: node.y,
        width: 180,
        background: isError ? "rgba(220,38,38,0.05)" : cfg.bg || S.card,
        border: `1px solid ${selected ? S.primary : isError ? S.error : isEnding ? cfg.color : S.border}`,
        borderStyle: isError ? "dashed" : "solid",
        boxShadow: selected
          ? `0 0 0 2px ${S.primary}40, 0 2px 8px rgba(99,85,216,0.12)`
          : "0 1px 3px rgba(0,0,0,0.06)",
        zIndex: selected ? 20 : 10,
        padding: "10px 12px",
      }}
    >
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-[8px] font-bold uppercase tracking-widest" style={{ color: isError ? "var(--app-error)" : cfg.color }}>
          {cfg.label}
        </span>
        {isError && (
          <AlertTriangle size={10} style={{ color: "var(--app-error)" }} />
        )}
        {selected && !isError && (
          <div className="w-1.5 h-1.5 rounded-full animate-ping" style={{ background: "var(--app-primary)" }} />
        )}
      </div>
      <h4 className="text-[11px] font-bold truncate" style={{ color: isError ? "var(--app-error)" : "var(--app-text)" }}>
        {node.label}
      </h4>
    </motion.button>
  );
}

export default function CanvasScreen() {
  const [selectedId, setSelectedId] = useState<string | null>("N07");
  const selectedNode = STORY_NODES.find(n => n.id === selectedId);

  return (
    <div className="h-svh flex flex-col relative overflow-hidden" style={{ background: "var(--app-surface)" }}>

      {/* Top bar */}
      <div
        className="absolute top-0 inset-x-0 z-30 p-3 flex justify-between items-center backdrop-blur"
        style={{ background: "rgba(20,22,31,0.92)", borderBottom: "1px solid var(--app-border)" }}
      >
        <div>
          <h2 className="text-xs font-bold" style={{ color: "var(--app-text)" }}>幽灵协议 — 第一章</h2>
          <span className="text-[9px]" style={{ color: "var(--app-text-muted)" }}>互动节点拓扑图（只读）</span>
        </div>
        <Link href="/simulator">
          <motion.button
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] font-bold uppercase"
            style={{
              background: "transparent",
              border: "1px solid var(--app-primary)",
              color: "var(--app-primary)",
              boxShadow: "0 0 8px rgba(123,92,240,0.25)",
            }}
          >
            <Play size={11} />
            试玩
          </motion.button>
        </Link>
      </div>

      {/* Canvas area */}
      <div className="flex-1 overflow-auto pt-14 pb-56 dag-grid" style={{ position: "relative" }}>
        <div style={{ width: 600, height: 750, position: "relative", margin: "0 auto" }}>

          {/* SVG Edges */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
            <defs>
              <linearGradient id="edgeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#7B5CF0" />
                <stop offset="100%" stopColor="#00D4C8" />
              </linearGradient>
            </defs>
            {NODE_EDGES.map((edge, i) => {
              const from = STORY_NODES.find(n => n.id === edge.from);
              const to = STORY_NODES.find(n => n.id === edge.to);
              if (!from || !to) return null;
              const x1 = from.x;
              const y1 = from.y + 36;
              const x2 = to.x;
              const y2 = to.y;
              const isError = to.hasError;
              const midY = (y1 + y2) / 2;
              return (
                <g key={i}>
                  <path
                    d={`M ${x1},${y1} C ${x1},${midY} ${x2},${midY} ${x2},${y2}`}
                    fill="none"
                    stroke={isError ? "var(--app-error)" : "url(#edgeGrad)"}
                    strokeWidth={1.5}
                    strokeDasharray={isError ? "4" : undefined}
                    opacity={0.7}
                  />
                  {edge.label && (
                    <text
                      x={(x1 + x2) / 2 + 4}
                      y={(y1 + y2) / 2}
                      fontSize={8}
                      fill="var(--app-text-muted)"
                      textAnchor="middle"
                    >
                      {edge.label}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Nodes */}
          {STORY_NODES.map(node => (
            <NodeCard
              key={node.id}
              node={node}
              selected={selectedId === node.id}
              onClick={() => setSelectedId(node.id === selectedId ? null : node.id)}
            />
          ))}
        </div>
      </div>

      {/* Inspector Drawer */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div
            key="inspector"
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            className="absolute bottom-0 inset-x-0 z-40 rounded-t-2xl p-4"
            style={{
              background: "var(--app-surface)",
              borderTop: "1px solid var(--app-primary)",
              boxShadow: "0 -10px 30px rgba(0,0,0,0.6)",
            }}
          >
            {/* Drag handle */}
            <div className="flex justify-center mb-3">
              <div className="w-10 h-1 rounded-full" style={{ background: "var(--app-border)" }} />
            </div>

            <div className="flex items-start justify-between mb-2">
              <div>
                <span className="text-[8px] font-bold uppercase tracking-widest block mb-0.5" style={{ color: "var(--app-primary)" }}>
                  Inspector
                  <span className="font-normal ml-1" style={{ color: "var(--app-text-muted)" }}>— 当前节点</span>
                </span>
                <h3 className="text-sm font-bold truncate" style={{ color: "var(--app-text)" }}>
                  {selectedNode.label}
                </h3>
              </div>
              <button onClick={() => setSelectedId(null)}>
                <ChevronDown size={16} style={{ color: "var(--app-text-muted)" }} />
              </button>
            </div>

            {/* Error warning */}
            {selectedNode.hasError && (
              <div className="mb-3 px-3 py-2 rounded-lg flex items-center gap-2"
                style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}>
                <AlertTriangle size={12} style={{ color: "var(--app-error)" }} />
                <span className="text-[10px]" style={{ color: "var(--app-error)" }}>{selectedNode.errorMsg}</span>
              </div>
            )}

            {/* Condition config for N07 */}
            {selectedNode.type === 'condition' && (
              <div className="space-y-2">
                <div className="p-2.5 rounded-lg" style={{ background: "var(--app-surface)", border: "1px solid var(--app-border)" }}>
                  <span className="text-[10px] font-bold block mb-0.5" style={{ color: "var(--app-accent)" }}>
                    条件：stealth_score ≥ 60
                  </span>
                  <div className="flex justify-between text-[8px]" style={{ color: "var(--app-text-muted)" }}>
                    <span>真 → 数据到手 (N08)</span>
                    <span>假 → 身份暴露 (N09)</span>
                  </div>
                </div>
              </div>
            )}

            {/* Choice config for other choice nodes */}
            {selectedNode.type === 'choice' && (
              <div className="space-y-2">
                <div className="p-2.5 rounded-lg" style={{ background: "var(--app-surface)", border: "1px solid var(--app-border)" }}>
                  <span className="text-[10px] font-bold block mb-0.5" style={{ color: "var(--app-accent)" }}>选项 A：暗夜通道</span>
                  <div className="flex justify-between text-[8px]" style={{ color: "var(--app-text-muted)" }}>
                    <span>目标：N04</span><span>影响：stealth_score +5</span>
                  </div>
                </div>
                <div className="p-2.5 rounded-lg" style={{ background: "var(--app-surface)", border: "1px solid var(--app-border)" }}>
                  <span className="text-[10px] font-bold block mb-0.5" style={{ color: "var(--app-text-secondary)" }}>选项 B：换装渗透</span>
                  <div className="flex justify-between text-[8px]" style={{ color: "var(--app-text-muted)" }}>
                    <span>目标：N05</span><span>影响：alert_level -10</span>
                  </div>
                </div>
              </div>
            )}

            {/* AI suggestions */}
            <div className="flex gap-2 mt-3 flex-wrap">
              {["增加补救分支", "生成失败反馈", "解释变量源", "优化紧张感"].map(label => (
                <motion.button
                  key={label}
                  whileTap={{ scale: 0.95 }}
                  className="text-[9px] font-medium px-2 py-1 rounded-lg"
                  style={{ background: "rgba(123,92,240,0.1)", border: "1px solid rgba(123,92,240,0.25)", color: "var(--app-primary)" }}
                >
                  {label}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
