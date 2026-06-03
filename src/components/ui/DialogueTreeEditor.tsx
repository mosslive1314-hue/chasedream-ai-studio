"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  ChevronRight,
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  User,
  Bot,
  ArrowRight,
} from "lucide-react";
import { useNarrativeStore } from "@/store";
import type {
  DialogueTree,
  DialogueNode,
  DialogueChoice,
  DialogueTone,
} from "@/lib/studio-data";

// ── Design Tokens ─────────────────────────────────────────────────────────
const S = {
  card: "#FFFFFF",
  bg: "#F5F6FA",
  border: "#E2E5F0",
  primary: "#5E50E8",
  primary10: "rgba(94,80,232,0.10)",
  primary20: "rgba(94,80,232,0.20)",
  text: "#1A1D2E",
  text2: "#4A5068",
  text3: "#8892B0",
  success: "#10B981",
  error: "#EF4444",
  warning: "#F59E0B",
  accent: "#F97316",
};

const TONE_COLORS: Record<DialogueTone, string> = {
  friendly: "#10B981",
  hostile: "#EF4444",
  neutral: "#8892B0",
  sarcastic: "#F59E0B",
  empathetic: "#8B5CF6",
  cold: "#3B82F6",
  flirtatious: "#EC4899",
  intimidating: "#DC2626",
};

const TONE_LABELS: Record<DialogueTone, string> = {
  friendly: "友好",
  hostile: "敌对",
  neutral: "中立",
  sarcastic: "讽刺",
  empathetic: "共情",
  cold: "冷漠",
  flirtatious: "暧昧",
  intimidating: "威压",
};

// ── Helpers ───────────────────────────────────────────────────────────────
function speakerColor(name: string, isPlayer: boolean): string {
  if (isPlayer) return S.primary;
  // Deterministic hash-based hue for NPC speakers
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 55%, 50%)`;
}

function conditionSummary(tree: DialogueTree): string {
  const c = tree.triggerCondition;
  if (!c) return "无条件触发";
  if (c.type === "atomic") return `${c.targetId} ${c.operator} ${String(c.value)}`;
  return `${c.operator} (${c.conditions.length} 条件)`;
}

// ══════════════════════════════════════════════════════════════════════════
export function DialogueTreeEditor() {
  const dialogueTrees = useNarrativeStore((s) => s.dialogueTrees);

  const [selectedTreeId, setSelectedTreeId] = useState<string | null>(
    dialogueTrees.length > 0 ? dialogueTrees[0].id : null
  );
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const activeTree = dialogueTrees.find((t) => t.id === selectedTreeId) ?? null;
  const activeNode =
    activeTree?.nodes.find((n) => n.id === selectedNodeId) ?? null;

  // Build an ordered node traversal starting from startNodeId
  const orderedNodes = activeTree ? traverseTree(activeTree) : [];

  return (
    <div style={{ display: "flex", height: "100%", background: S.bg, borderRadius: 12, overflow: "hidden" }}>
      {/* ─── Left Panel: Tree List ───────────────────────────────────── */}
      <div
        style={{
          width: 200,
          minWidth: 200,
          borderRight: `1px solid ${S.border}`,
          background: S.card,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            padding: "14px 16px 10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: `1px solid ${S.border}`,
          }}
        >
          <span style={{ fontWeight: 700, fontSize: 13, color: S.text }}>
            对话树列表
          </span>
          <button
            style={{
              width: 24,
              height: 24,
              borderRadius: 6,
              border: `1px solid ${S.border}`,
              background: S.bg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
            title="新建对话树"
          >
            <Plus size={14} color={S.primary} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "6px 0" }}>
          {dialogueTrees.map((tree) => {
            const isActive = tree.id === selectedTreeId;
            return (
              <motion.button
                key={tree.id}
                onClick={() => {
                  setSelectedTreeId(tree.id);
                  setSelectedNodeId(null);
                }}
                whileHover={{ backgroundColor: isActive ? undefined : S.bg }}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  border: "none",
                  borderLeft: isActive ? `3px solid ${S.primary}` : "3px solid transparent",
                  background: isActive ? S.primary10 : "transparent",
                  cursor: "pointer",
                  textAlign: "left",
                  display: "flex",
                  flexDirection: "column",
                  gap: 3,
                }}
              >
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? S.primary : S.text,
                    lineHeight: 1.3,
                  }}
                >
                  {tree.name}
                </span>
                <span style={{ fontSize: 11, color: S.text3 }}>
                  {tree.npcName} &middot; {tree.nodes.length} 节点
                </span>
              </motion.button>
            );
          })}

          {dialogueTrees.length === 0 && (
            <div style={{ padding: 20, textAlign: "center", color: S.text3, fontSize: 12 }}>
              暂无对话树
            </div>
          )}
        </div>
      </div>

      {/* ─── Right Panel: Tree Editor ────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <AnimatePresence mode="wait">
          {activeTree ? (
            <motion.div
              key={activeTree.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}
            >
              {/* ── Tree Header ──────────────────────────────────────── */}
              <TreeHeader tree={activeTree} />

              {/* ── Body: Node Flow + Detail Split ──────────────────── */}
              <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
                {/* ── Node Flow View ────────────────────────────────── */}
                <div
                  style={{
                    flex: 1,
                    overflowY: "auto",
                    padding: "16px 20px",
                  }}
                >
                  {orderedNodes.map((node, idx) => (
                    <NodeCard
                      key={node.id}
                      node={node}
                      tree={activeTree}
                      isSelected={node.id === selectedNodeId}
                      isFirst={idx === 0}
                      isLast={idx === orderedNodes.length - 1}
                      onSelect={() =>
                        setSelectedNodeId(
                          node.id === selectedNodeId ? null : node.id
                        )
                      }
                    />
                  ))}
                </div>

                {/* ── Node Detail Panel ─────────────────────────────── */}
                <AnimatePresence>
                  {activeNode && (
                    <motion.div
                      key={activeNode.id}
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: 320, opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      style={{
                        borderLeft: `1px solid ${S.border}`,
                        background: S.card,
                        overflowY: "auto",
                        overflowX: "hidden",
                      }}
                    >
                      <NodeDetail node={activeNode} tree={activeTree} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
                gap: 12,
              }}
            >
              <MessageCircle size={40} color={S.text3} strokeWidth={1.5} />
              <span style={{ color: S.text3, fontSize: 14 }}>
                选择一棵对话树以查看
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// Sub-components
// ══════════════════════════════════════════════════════════════════════════

// ── Tree Header ──────────────────────────────────────────────────────────
function TreeHeader({ tree }: { tree: DialogueTree }) {
  return (
    <div
      style={{
        padding: "14px 20px",
        borderBottom: `1px solid ${S.border}`,
        background: S.card,
        display: "flex",
        alignItems: "center",
        gap: 16,
        flexWrap: "wrap",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <MessageCircle size={18} color={S.primary} />
        <span style={{ fontWeight: 700, fontSize: 15, color: S.text }}>
          {tree.name}
        </span>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 5,
          padding: "3px 10px",
          borderRadius: 6,
          background: S.primary10,
          fontSize: 12,
          color: S.primary,
          fontWeight: 500,
        }}
      >
        <Bot size={13} />
        NPC: {tree.npcName}
      </div>

      <div
        style={{
          fontSize: 11,
          color: S.text3,
          padding: "3px 10px",
          borderRadius: 6,
          background: S.bg,
        }}
      >
        触发: {conditionSummary(tree)}
      </div>

      <div
        style={{
          fontSize: 11,
          padding: "3px 10px",
          borderRadius: 6,
          fontWeight: 500,
          background: tree.repeatable ? "rgba(16,185,129,0.10)" : "rgba(239,68,68,0.08)",
          color: tree.repeatable ? S.success : S.error,
        }}
      >
        {tree.repeatable ? "可重复" : "一次性"}
      </div>

      {tree.trackChoices && (
        <div
          style={{
            fontSize: 11,
            padding: "3px 10px",
            borderRadius: 6,
            background: "rgba(245,158,11,0.10)",
            color: S.warning,
            fontWeight: 500,
          }}
        >
          追踪选择
        </div>
      )}
    </div>
  );
}

// ── Node Card (in flow view) ─────────────────────────────────────────────
function NodeCard({
  node,
  tree,
  isSelected,
  isFirst,
  isLast,
  onSelect,
}: {
  node: DialogueNode;
  tree: DialogueTree;
  isSelected: boolean;
  isFirst: boolean;
  isLast: boolean;
  onSelect: () => void;
}) {
  const isPlayer = node.speakerId !== tree.npcId;
  const color = speakerColor(node.speakerName, isPlayer);
  const initial = node.speakerName.charAt(0);

  return (
    <div style={{ display: "flex", gap: 0 }}>
      {/* ── Connector line column ─────────────────────────────────── */}
      <div
        style={{
          width: 32,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          position: "relative",
        }}
      >
        {/* top line */}
        {!isFirst && (
          <div
            style={{
              width: 2,
              flex: 1,
              background: isSelected ? S.primary : S.border,
            }}
          />
        )}
        {/* dot */}
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: isSelected ? S.primary : S.border,
            border: `2px solid ${isSelected ? S.primary : "#CBD0E5"}`,
            zIndex: 1,
            flexShrink: 0,
          }}
        />
        {/* bottom line */}
        {!isLast && (
          <div
            style={{
              width: 2,
              flex: 1,
              background: node.isTerminal ? S.accent : isSelected ? S.primary : S.border,
            }}
          />
        )}
      </div>

      {/* ── Card body ─────────────────────────────────────────────── */}
      <motion.div
        onClick={onSelect}
        whileHover={{ scale: 1.005 }}
        transition={{ duration: 0.15 }}
        style={{
          flex: 1,
          background: S.card,
          borderRadius: 10,
          padding: "12px 16px",
          marginBottom: 8,
          cursor: "pointer",
          border: isSelected
            ? `2px solid ${S.primary}`
            : `1px solid ${S.border}`,
          boxShadow: isSelected
            ? `0 0 0 3px ${S.primary10}`
            : "0 1px 3px rgba(0,0,0,0.04)",
          transition: "border 0.15s, box-shadow 0.15s",
        }}
      >
        {/* Speaker row */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: color,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {initial}
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: S.text }}>
            {node.speakerName}
          </span>
          {isPlayer && (
            <span
              style={{
                fontSize: 10,
                color: S.primary,
                background: S.primary10,
                padding: "1px 7px",
                borderRadius: 4,
                fontWeight: 600,
              }}
            >
              玩家
            </span>
          )}
          {node.isTerminal && (
            <span
              style={{
                fontSize: 10,
                color: S.accent,
                background: "rgba(249,115,22,0.10)",
                padding: "1px 7px",
                borderRadius: 4,
                fontWeight: 600,
                marginLeft: "auto",
              }}
            >
              结束
            </span>
          )}
          {tree.startNodeId === node.id && (
            <span
              style={{
                fontSize: 10,
                color: S.success,
                background: "rgba(16,185,129,0.10)",
                padding: "1px 7px",
                borderRadius: 4,
                fontWeight: 600,
                marginLeft: tree.startNodeId === node.id && node.isTerminal ? 4 : "auto",
              }}
            >
              起始
            </span>
          )}
        </div>

        {/* Dialogue text */}
        <p
          style={{
            fontSize: 13,
            lineHeight: 1.65,
            color: S.text2,
            margin: 0,
            fontStyle: isPlayer ? "normal" : "italic",
          }}
        >
          "{node.text}"
        </p>

        {/* Performance note */}
        {node.performance && (
          <p
            style={{
              fontSize: 11,
              color: S.text3,
              margin: "6px 0 0",
              fontStyle: "italic",
              lineHeight: 1.5,
            }}
          >
            [{node.performance}]
          </p>
        )}

        {/* Choices */}
        {node.choices.length > 0 && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 6,
              marginTop: 10,
            }}
          >
            {node.choices.map((choice) => (
              <ChoicePill key={choice.id} choice={choice} />
            ))}
          </div>
        )}

        {/* Terminal exit indicator */}
        {node.isTerminal && node.exitNodeId && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              marginTop: 8,
              fontSize: 11,
              color: S.accent,
            }}
          >
            <ArrowRight size={12} />
            <span>
              退出至 <strong>{node.exitNodeId}</strong>
            </span>
          </div>
        )}
      </motion.div>
    </div>
  );
}

// ── Choice Pill ──────────────────────────────────────────────────────────
function ChoicePill({ choice }: { choice: DialogueChoice }) {
  const toneColor = TONE_COLORS[choice.tone] ?? S.text3;

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "3px 10px",
        borderRadius: 20,
        background: `${toneColor}14`,
        border: `1px solid ${toneColor}30`,
        fontSize: 11,
        color: toneColor,
        fontWeight: 500,
        maxWidth: 280,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: toneColor,
          flexShrink: 0,
        }}
      />
      <span
        style={{
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {choice.text}
      </span>
      <ArrowRight size={10} style={{ flexShrink: 0, opacity: 0.6 }} />
      <span style={{ fontSize: 10, opacity: 0.7, flexShrink: 0 }}>
        {choice.nextNodeId.slice(-6)}
      </span>
      {choice.oneTime && (
        <span
          style={{
            fontSize: 9,
            background: "rgba(239,68,68,0.10)",
            color: S.error,
            padding: "0 5px",
            borderRadius: 3,
            fontWeight: 600,
            flexShrink: 0,
          }}
        >
          1x
        </span>
      )}
    </div>
  );
}

// ── Node Detail Panel ────────────────────────────────────────────────────
function NodeDetail({ node, tree }: { node: DialogueNode; tree: DialogueTree }) {
  const isPlayer = node.speakerId !== tree.npcId;
  const color = speakerColor(node.speakerName, isPlayer);

  return (
    <div style={{ padding: 16 }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: color,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            {node.speakerName.charAt(0)}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: S.text }}>
              {node.speakerName}
            </div>
            <div style={{ fontSize: 10, color: S.text3 }}>
              {isPlayer ? "玩家角色" : "NPC"} &middot; {node.id}
            </div>
          </div>
        </div>
        <button
          style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            border: `1px solid ${S.border}`,
            background: S.bg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
          title="编辑节点"
        >
          <Edit3 size={13} color={S.text3} />
        </button>
      </div>

      {/* Dialogue text field */}
      <DetailSection label="台词文本">
        <div
          style={{
            padding: "10px 12px",
            borderRadius: 8,
            border: `1px solid ${S.border}`,
            background: S.bg,
            fontSize: 13,
            lineHeight: 1.65,
            color: S.text2,
            fontStyle: isPlayer ? "normal" : "italic",
            minHeight: 60,
          }}
        >
          {node.text}
        </div>
      </DetailSection>

      {/* Performance note */}
      {node.performance && (
        <DetailSection label="演出指示">
          <div
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: `1px solid ${S.border}`,
              background: S.bg,
              fontSize: 12,
              lineHeight: 1.5,
              color: S.text3,
              fontStyle: "italic",
            }}
          >
            {node.performance}
          </div>
        </DetailSection>
      )}

      {/* Interrupt response */}
      {node.interruptResponse && (
        <DetailSection label="被打断反应">
          <div
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: `1px solid ${S.border}`,
              background: S.bg,
              fontSize: 12,
              color: S.text3,
              lineHeight: 1.5,
            }}
          >
            {node.interruptResponse}
          </div>
        </DetailSection>
      )}

      {/* Terminal info */}
      {node.isTerminal && (
        <DetailSection label="终端节点">
          <div
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: `1px solid rgba(249,115,22,0.25)`,
              background: "rgba(249,115,22,0.06)",
              fontSize: 12,
              color: S.accent,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <ArrowRight size={13} />
            {node.exitNodeId ? (
              <span>
                退出至节点 <strong>{node.exitNodeId}</strong>
              </span>
            ) : (
              <span>无退出目标</span>
            )}
          </div>
        </DetailSection>
      )}

      {/* Choices list */}
      {node.choices.length > 0 && (
        <DetailSection label={`选项 (${node.choices.length})`}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {node.choices.map((choice) => (
              <ChoiceDetail key={choice.id} choice={choice} />
            ))}
          </div>
        </DetailSection>
      )}

      {node.choices.length === 0 && !node.isTerminal && (
        <div
          style={{
            padding: "12px",
            borderRadius: 8,
            border: `1px dashed ${S.border}`,
            textAlign: "center",
            fontSize: 12,
            color: S.text3,
          }}
        >
          此节点无选项且非终端节点
        </div>
      )}
    </div>
  );
}

// ── Choice Detail (in detail panel) ──────────────────────────────────────
function ChoiceDetail({ choice }: { choice: DialogueChoice }) {
  const toneColor = TONE_COLORS[choice.tone] ?? S.text3;

  return (
    <div
      style={{
        padding: "10px 12px",
        borderRadius: 8,
        border: `1px solid ${S.border}`,
        background: S.bg,
      }}
    >
      {/* Tone + one-time badge */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          marginBottom: 6,
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            color: "#fff",
            background: toneColor,
            padding: "1px 8px",
            borderRadius: 4,
          }}
        >
          {TONE_LABELS[choice.tone] ?? choice.tone}
        </span>
        {choice.oneTime && (
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: S.error,
              background: "rgba(239,68,68,0.10)",
              padding: "1px 8px",
              borderRadius: 4,
            }}
          >
            一次性
          </span>
        )}
        <span style={{ fontSize: 10, color: S.text3, marginLeft: "auto" }}>
          {choice.id}
        </span>
      </div>

      {/* Choice text */}
      <div style={{ fontSize: 12, color: S.text2, lineHeight: 1.55, marginBottom: 6 }}>
        {choice.text}
      </div>

      {/* Target + effects */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: 11,
          color: S.text3,
          flexWrap: "wrap",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
          <ArrowRight size={11} />
          {choice.nextNodeId}
        </span>
        {choice.variableEffects?.map((ve) => (
          <span
            key={ve.variableId}
            style={{
              padding: "0 6px",
              borderRadius: 3,
              background: "rgba(94,80,232,0.08)",
              color: S.primary,
              fontSize: 10,
            }}
          >
            {ve.variableId} {ve.delta > 0 ? "+" : ""}
            {ve.delta}
          </span>
        ))}
        {choice.relationshipEffects?.map((re) => (
          <span
            key={re.meterId}
            style={{
              padding: "0 6px",
              borderRadius: 3,
              background: "rgba(236,72,153,0.08)",
              color: "#EC4899",
              fontSize: 10,
            }}
          >
            {re.meterId} {re.delta > 0 ? "+" : ""}
            {re.delta}
          </span>
        ))}
      </div>

      {/* Narrative significance */}
      {choice.narrativeSignificance && (
        <div
          style={{
            fontSize: 11,
            color: S.text3,
            marginTop: 6,
            paddingTop: 6,
            borderTop: `1px dashed ${S.border}`,
            fontStyle: "italic",
            lineHeight: 1.45,
          }}
        >
          {choice.narrativeSignificance}
        </div>
      )}
    </div>
  );
}

// ── Detail Section wrapper ───────────────────────────────────────────────
function DetailSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: S.text3,
          textTransform: "uppercase",
          letterSpacing: "0.5px",
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}

// ── Tree traversal helper ────────────────────────────────────────────────
function traverseTree(tree: DialogueTree): DialogueNode[] {
  const nodeMap = new Map<string, DialogueNode>();
  for (const n of tree.nodes) nodeMap.set(n.id, n);

  const visited = new Set<string>();
  const result: DialogueNode[] = [];
  const queue: string[] = [tree.startNodeId];

  while (queue.length > 0) {
    const id = queue.shift()!;
    if (visited.has(id)) continue;
    visited.add(id);

    const node = nodeMap.get(id);
    if (!node) continue;
    result.push(node);

    for (const choice of node.choices) {
      if (!visited.has(choice.nextNodeId)) {
        queue.push(choice.nextNodeId);
      }
    }
  }

  // Append any orphan nodes not reached by traversal
  for (const n of tree.nodes) {
    if (!visited.has(n.id)) result.push(n);
  }

  return result;
}
