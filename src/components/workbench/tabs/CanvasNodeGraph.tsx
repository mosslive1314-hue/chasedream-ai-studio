// Tab: 节点图 — 嵌入工作台的 DAG 画布
"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, ChevronDown, Sparkles } from "lucide-react";
import { STORY_NODES, NODE_EDGES, type StoryNode } from "@/lib/studio-data";

const NODE_CONFIG: Record<string, { label: string; color: string; border: string }> = {
  start:       { label: "▶ 起始",  color: "#4F8EF7", border: "rgba(79,142,247,0.6)" },
  scene:       { label: "● 场景",  color: "#94A3B8", border: "rgba(148,163,184,0.35)" },
  choice:      { label: "⚖ 选择",  color: "#00D4C8", border: "rgba(0,212,200,0.6)" },
  condition:   { label: "◆ 条件",  color: "#F59E0B", border: "rgba(245,158,11,0.6)" },
  qte:         { label: "⚡ QTE",  color: "#FB923C", border: "rgba(251,146,60,0.6)" },
  ending_good: { label: "★ 结局A", color: "#F5A623", border: "rgba(245,166,35,0.6)" },
  ending_bad:  { label: "✕ 结局B", color: "#EF4444", border: "rgba(239,68,68,0.6)" },
};

function NodeCard({ node, selected, onClick }: { node: StoryNode; selected: boolean; onClick: () => void }) {
  const cfg = NODE_CONFIG[node.type] ?? NODE_CONFIG.scene;
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="absolute text-left focus:outline-none rounded-lg"
      style={{
        left: node.x - 80,
        top: node.y,
        width: 160,
        padding: "8px 10px",
        background: "var(--app-surface)",
        border: `1px solid ${selected ? "var(--app-primary)" : node.hasError ? "var(--app-error)" : cfg.border}`,
        borderStyle: node.hasError ? "dashed" : "solid",
        boxShadow: selected ? "0 0 0 1px rgba(123,92,240,0.4), 0 0 12px rgba(123,92,240,0.12)" : undefined,
        zIndex: selected ? 20 : 10,
      }}
    >
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-[8px] font-bold uppercase tracking-wider" style={{ color: node.hasError ? "var(--app-error)" : cfg.color }}>
          {cfg.label}
        </span>
        {node.hasError && <AlertTriangle size={8} style={{ color: "var(--app-error)" }} />}
        {selected && !node.hasError && <div className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--app-primary)" }} />}
      </div>
      <p className="text-[10px] font-bold truncate" style={{ color: node.hasError ? "var(--app-error)" : "var(--app-text)" }}>
        {node.label}
      </p>
    </motion.button>
  );
}

export default function CanvasNodeGraph() {
  const [selectedId, setSelectedId] = useState<string | null>("N07");
  const selectedNode = STORY_NODES.find(n => n.id === selectedId);

  return (
    <div className="flex h-full overflow-hidden">
      {/* DAG Canvas */}
      <div className="flex-1 dag-grid overflow-auto relative">
        {/* Toolbar */}
        <div className="sticky top-0 left-0 z-30 flex items-center gap-1.5 px-3 py-1.5 backdrop-blur"
          style={{ background: "rgba(10,11,17,0.9)", borderBottom: "1px solid var(--app-border)" }}>
          {["整理布局", "+ 节点", "+ 选择", "路径高亮", "检查连通"].map(btn => (
            <motion.button
              key={btn}
              whileTap={{ scale: 0.96 }}
              className="px-2 py-0.5 rounded text-[9px] font-medium focus:outline-none"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--app-border)", color: "var(--app-text-muted)" }}
            >
              {btn}
            </motion.button>
          ))}
          <div className="ml-auto flex items-center gap-1">
            {["全部", "主线", "分支", "结局"].map(f => (
              <span key={f} className="px-1.5 py-0.5 rounded text-[8px] cursor-pointer"
                style={{ color: "var(--app-text-muted)", border: "1px solid transparent" }}>
                {f}
              </span>
            ))}
            <span className="px-1.5 py-0.5 rounded text-[8px]"
              style={{ color: "var(--app-error)", border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.08)" }}>
              ⚠ 异常(1)
            </span>
          </div>
        </div>

        {/* Canvas */}
        <div style={{ width: 600, height: 760, position: "relative", margin: "16px auto" }}>
          {/* SVG edges */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
            <defs>
              <linearGradient id="cg" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#7B5CF0" />
                <stop offset="100%" stopColor="#00D4C8" />
              </linearGradient>
            </defs>
            {NODE_EDGES.map((edge, i) => {
              const from = STORY_NODES.find(n => n.id === edge.from);
              const to   = STORY_NODES.find(n => n.id === edge.to);
              if (!from || !to) return null;
              const x1 = from.x, y1 = from.y + 36;
              const x2 = to.x,   y2 = to.y;
              const midY = (y1 + y2) / 2;
              return (
                <path
                  key={i}
                  d={`M ${x1},${y1} C ${x1},${midY} ${x2},${midY} ${x2},${y2}`}
                  fill="none"
                  stroke={to.hasError ? "var(--app-error)" : "url(#cg)"}
                  strokeWidth={1.5}
                  strokeDasharray={to.hasError ? "4" : undefined}
                  opacity={0.65}
                />
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

      {/* Right Inspector (desktop only) */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div
            key="insp"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 220, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="hidden md:flex flex-col shrink-0 overflow-hidden"
            style={{ borderLeft: "1px solid var(--app-border)", background: "#0A0B11" }}
          >
            <div style={{ width: 220 }} className="h-full overflow-y-auto">
              {/* Header */}
              <div className="px-3 pt-3 pb-2" style={{ borderBottom: "1px solid var(--app-border)" }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded"
                    style={{ background: "rgba(245,158,11,0.12)", color: "var(--app-warning)" }}>
                    {NODE_CONFIG[selectedNode.type]?.label ?? "场景"}
                  </span>
                  <button onClick={() => setSelectedId(null)}>
                    <ChevronDown size={10} style={{ color: "var(--app-text-muted)" }} />
                  </button>
                </div>
                <h4 className="text-[12px] font-bold" style={{ color: "var(--app-text)" }}>{selectedNode.label}</h4>
              </div>

              {/* Error */}
              {selectedNode.hasError && (
                <div className="mx-2.5 mt-2 px-2 py-1.5 rounded-lg flex items-start gap-1.5"
                  style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)" }}>
                  <AlertTriangle size={9} style={{ color: "var(--app-error)", marginTop: 1, flexShrink: 0 }} />
                  <span className="text-[9px] leading-snug" style={{ color: "var(--app-error)" }}>{selectedNode.errorMsg}</span>
                </div>
              )}

              {/* Condition */}
              {selectedNode.type === "condition" && (
                <div className="px-3 pt-2 pb-2" style={{ borderBottom: "1px solid var(--app-border)" }}>
                  <p className="text-[8px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--app-text-muted)" }}>条件配置</p>
                  <div className="space-y-1">
                    {[["变量", "stealth_score"], ["运算符", "≥"], ["比较值", "60"]].map(([k, v]) => (
                      <div key={k} className="flex justify-between">
                        <span className="text-[9px]" style={{ color: "var(--app-text-secondary)" }}>{k}</span>
                        <span className="text-[9px] font-bold font-mono" style={{ color: "var(--app-accent)" }}>{v}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 space-y-1">
                    {[["真", "数据到手 N08", "var(--app-success)"], ["假", "身份暴露 N09", "var(--app-error)"]].map(([t, v, c]) => (
                      <div key={t} className="flex items-center gap-1.5 px-2 py-1 rounded"
                        style={{ background: `${c === "var(--app-success)" ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)"}`, border: `1px solid ${c === "var(--app-success)" ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}` }}>
                        <span className="text-[8px] font-bold" style={{ color: `${c}` }}>{t}</span>
                        <span className="text-[9px]" style={{ color: "var(--app-text-secondary)" }}>→ {v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI suggestions */}
              <div className="px-3 pt-2 pb-3">
                <div className="flex items-center gap-1 mb-2">
                  <Sparkles size={9} style={{ color: "var(--app-primary)" }} />
                  <span className="text-[8px] font-bold uppercase tracking-wider" style={{ color: "var(--app-primary)" }}>AI 节点助手</span>
                </div>
                <div className="space-y-1">
                  {["增加补救分支", "生成失败反馈", "解释变量源", "优化紧张感", "检查下游路径"].map(a => (
                    <motion.button
                      key={a}
                      whileTap={{ scale: 0.96 }}
                      className="w-full text-left px-2 py-1 rounded text-[9px] font-medium focus:outline-none"
                      style={{ background: "rgba(123,92,240,0.07)", border: "1px solid rgba(123,92,240,0.18)", color: "var(--app-primary)" }}
                    >
                      {a}
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
