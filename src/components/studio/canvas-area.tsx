"use client";

import { useMemo, useRef, useState, useEffect, useCallback, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ReactFlow, Background, Controls, MiniMap,
  type Node, type Edge, type Connection,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Eye, Plus, Trash2, Layout as LayoutIcon, Play, RotateCcw, AlertTriangle, CheckCircle2, Route, Save, FolderOpen, X, Film, MapPin, Camera, Clapperboard, Users, Heart, Scale, Edit2, Check, Package, Upload, Sparkles, FileText, Loader2 } from "lucide-react";
import { useNarrativeStore, useWardrobeStore, useRelationshipStore, useMoralStore, usePipelineStore, useCanvasAgentStore, useVersionStore, useExportStore, STAGE_DEFS, RELATIONSHIP_TYPE_LABELS, ALIGNMENT_LABELS, computeAlignment, type RelationshipType, type MoralAlignment } from "@/store";
import { useRuntimeEngine } from "@/components/simulator/use-runtime-engine";
import { SceneRenderer } from "@/components/simulator/scene-renderer";
import { StyleProvider } from "@/components/simulator/style-provider";
import { AudioPlayer } from "@/components/simulator/audio-player";
import { UIRenderer } from "@/components/simulator/ui-renderer";
import { SavePanel } from "@/components/simulator/save-panel";
import type { SceneObject } from "@/lib/runtime";
import { WardrobeEditor } from "@/components/ui/WardrobeEditor";
import type { CameraShotType, CameraMovement, TransitionType, EmotionIntensity } from "@/lib/types/cinematic";
import {
  storeNodesToRFNodes, storeEdgesToRFEdges,
  createOnNodesChange, createOnEdgesChange, syncStoreToRF, X_OFFSET,
} from "@/lib/reactflow/sync";
import { storyNodeTypes } from "@/lib/reactflow/node-types";
import { computeAutoLayout } from "@/lib/reactflow/auto-layout";
import { runPathTest, type PathTestOutput } from "@/lib/path-test-engine";
import { runConsistencyChecks, type ConsistencyIssue } from "@/lib/consistency-engine";
import { useConsistencyChecker } from "./use-consistency-checker";
import { DeleteConfirmDialog } from "./delete-confirm-dialog";
import { ImportPanel } from "./import-panel";
import type { ViewTab } from "./studio-toolbar";

// 旧 Screen 组件（融入新 Studio，复用其完整功能逻辑）
// 仅保留 8 阶段工作流中仍需要的 4 个 Screen，其余已删除或移至 manage-modal.tsx
import ScriptScreen from "@/components/screens/ScriptScreen";
import InteractionScreen from "@/components/screens/InteractionScreen";
import AssetLibraryScreen from "@/components/screens/AssetLibraryScreen";
import PublishScreen from "@/components/screens/PublishScreen";

interface CanvasAreaProps {
  activeTab: ViewTab;
  selectedNodeId: string | null;
  onSelectNode: (id: string | null) => void;
  /** 当嵌入的旧 Screen 内部触发路由跳转时，转为 Studio tab 切换 */
  onTabChange?: (tab: ViewTab) => void;
}

// 节点类型 → 创建菜单
const NODE_CREATE_OPTIONS = [
  { type: "scene", label: "场景", color: "#6366f1" },
  { type: "dialogue", label: "对话", color: "#06b6d4" },
  { type: "choice", label: "选择", color: "#f59e0b" },
  { type: "condition", label: "条件", color: "#8b5cf6" },
  { type: "event", label: "事件", color: "#f97316" },
  { type: "qte", label: "QTE", color: "#ef4444" },
  { type: "ending_good", label: "好结局", color: "#22c55e" },
  { type: "ending_bad", label: "坏结局", color: "#dc2626" },
  { type: "ending_neutral", label: "中性结局", color: "#a3a3a3" },
  { type: "ending_secret", label: "隐藏结局", color: "#ec4899" },
];

// 自定义节点可选颜色
const CUSTOM_NODE_COLORS = ["#6366f1", "#06b6d4", "#f59e0b", "#8b5cf6", "#f97316", "#ef4444", "#22c55e", "#dc2626", "#a3a3a3", "#ec4899"];

// 节点图视图：完整编辑功能（拖拽/连接/创建/删除）
function GraphView({
  selectedNodeId,
  onSelectNode,
}: {
  selectedNodeId: string | null;
  onSelectNode: (id: string | null) => void;
}) {
  const storyNodes = useNarrativeStore((s) => s.storyNodes);
  const nodeEdges = useNarrativeStore((s) => s.nodeEdges);
  const addNode = useNarrativeStore((s) => s.addNode);
  const removeNode = useNarrativeStore((s) => s.removeNode);
  const updateNode = useNarrativeStore((s) => s.updateNode);
  const addEdge = useNarrativeStore((s) => s.addEdge);
  const removeEdge = useNarrativeStore((s) => s.removeEdge);
  const rebuildPlayableGraph = useNarrativeStore((s) => s.rebuildPlayableGraph);

  const prevIds = useRef<Set<string>>(new Set());
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [customNodeForm, setCustomNodeForm] = useState<{ name: string; color: string } | null>(null);

  // 自动一致性校验：节点增删改后自动检测，写入 hasError/errorMsg
  const consistencyIssues = useConsistencyChecker();

  // 路径测试结果
  const [pathTestResult, setPathTestResult] = useState<PathTestOutput | null>(null);
  const [showPathPanel, setShowPathPanel] = useState(false);

  const handleRunPathTest = useCallback(() => {
    const result = runPathTest(storyNodes, nodeEdges);
    setPathTestResult(result);
    setShowPathPanel(true);
  }, [storyNodes, nodeEdges]);

  // 新节点检测（用于脉冲高亮）
  const newIds = useMemo(() => {
    const cur = new Set(storyNodes.map((n) => n.id));
    const fresh = [...cur].filter((id) => !prevIds.current.has(id));
    prevIds.current = cur;
    return new Set(fresh);
  }, [storyNodes]);

  // Store → ReactFlow 数据转换
  const rfNodesFromStore = useMemo(
    () => storeNodesToRFNodes(storyNodes, {
      selectedId: selectedNodeId,
      onNodeClick: (id: string) => onSelectNode(id === selectedNodeId ? null : id),
    }),
    [storyNodes, selectedNodeId, onSelectNode]
  );

  const rfEdgesFromStore = useMemo(
    () => storeEdgesToRFEdges(nodeEdges),
    [nodeEdges]
  );

  // ReactFlow 内部状态（受控模式）
  const [internalNodes, setInternalNodes] = useState<Node[]>([]);
  const [internalEdges, setInternalEdges] = useState<Edge[]>([]);

  // Store 变更同步到 ReactFlow 内部状态
  useEffect(() => {
    syncStoreToRF(rfNodesFromStore, rfEdgesFromStore, setInternalNodes, setInternalEdges);
  }, [rfNodesFromStore, rfEdgesFromStore]);

  const onNodesChange = useCallback(
    (changes: Parameters<ReturnType<typeof createOnNodesChange>>[0]) => {
      createOnNodesChange(removeNode, setInternalNodes)(changes);
    },
    [removeNode]
  );
  const onEdgesChange = useCallback(
    (changes: Parameters<ReturnType<typeof createOnEdgesChange>>[0]) => {
      createOnEdgesChange(removeEdge, setInternalEdges)(changes);
    },
    [removeEdge]
  );

  // 拖拽结束 → 更新 store 坐标
  const handleNodeDragStop = useCallback(
    (_event: MouseEvent | TouchEvent, node: Node) => {
      updateNode(node.id, { x: node.position.x + X_OFFSET, y: node.position.y });
    },
    [updateNode]
  );

  // 连接节点 → 添加边
  const handleConnect = useCallback(
    (connection: Connection) => {
      if (connection.source && connection.target) {
        addEdge({ from: connection.source, to: connection.target, edgeType: "causal" });
        rebuildPlayableGraph();
      }
    },
    [addEdge, rebuildPlayableGraph]
  );

  // 创建节点
  const handleCreateNode = (type: string, label?: string) => {
    const opt = NODE_CREATE_OPTIONS.find((o) => o.type === type);
    const newNode = {
      id: `N${String(Date.now()).slice(-4)}`,
      label: label ?? opt?.label ?? "新节点",
      type: type as never,
      x: 300 + Math.random() * 200,
      y: 200 + Math.random() * 200,
    };
    addNode(newNode);
    rebuildPlayableGraph();
    onSelectNode(newNode.id);
    setCreateMenuOpen(false);
    setCustomNodeForm(null);
  };

  // 创建自定义节点
  const handleCreateCustomNode = () => {
    if (!customNodeForm || !customNodeForm.name.trim()) return;
    const type = `custom_${customNodeForm.name.trim().toLowerCase().replace(/\s+/g, "_")}`;
    handleCreateNode(type, customNodeForm.name.trim());
  };

  // 删除选中节点 — 先弹出级联影响确认对话框
  const handleDeleteSelected = useCallback(() => {
    if (selectedNodeId) {
      setDeleteTargetId(selectedNodeId);
    }
  }, [selectedNodeId]);

  // 确认删除：实际执行删除操作
  const handleConfirmDelete = useCallback(() => {
    if (deleteTargetId) {
      removeNode(deleteTargetId);
      rebuildPlayableGraph();
      onSelectNode(null);
      setDeleteTargetId(null);
    }
  }, [deleteTargetId, removeNode, rebuildPlayableGraph, onSelectNode]);

  // 自动布局
  const handleAutoLayout = () => {
    const positions = computeAutoLayout(storyNodes, nodeEdges);
    for (const [id, pos] of positions) {
      updateNode(id, pos);
    }
    rebuildPlayableGraph();
  };

  // 键盘删除
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === "Delete" || e.key === "Backspace") && selectedNodeId) {
        const target = e.target as HTMLElement;
        if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;
        e.preventDefault();
        handleDeleteSelected();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleDeleteSelected, selectedNodeId]);

  return (
    <div className="relative h-full w-full">
      {/* 底部操作提示条（轻量，不遮挡） */}
      <div className="pointer-events-none absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-full border border-zinc-800 bg-zinc-900/90 px-4 py-1.5 text-[11px] text-zinc-500 backdrop-blur">
        💡 拖动节点右侧手柄到另一节点可连线 · 点击 + 添加节点 · 选中后按 Delete 删除
      </div>
      {/* 顶部工具条 */}
      <div className="absolute right-3 top-3 z-20 flex gap-1.5">
        <button
          onClick={handleRunPathTest}
          className="flex items-center gap-1.5 rounded-md bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-300 border border-zinc-800 hover:bg-zinc-800"
          title="路径测试：检测死胡同、不可达节点、可达结局"
        >
          <Route className="h-3 w-3" /> 路径测试
        </button>
        <button
          onClick={handleAutoLayout}
          className="flex items-center gap-1.5 rounded-md bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-300 border border-zinc-800 hover:bg-zinc-800"
          title="自动整理布局"
        >
          <LayoutIcon className="h-3 w-3" /> 整理
        </button>
        {selectedNodeId && (
          <button
            onClick={handleDeleteSelected}
            className="flex items-center gap-1.5 rounded-md bg-red-950/50 px-2.5 py-1.5 text-xs text-red-300 border border-red-900/50 hover:bg-red-900/40"
            title="删除选中节点 (Delete)"
          >
            <Trash2 className="h-3 w-3" /> 删除
          </button>
        )}
        <div className="relative">
          <button
            onClick={() => setCreateMenuOpen((v) => !v)}
            className="flex items-center gap-1.5 rounded-md bg-orange-500 px-2.5 py-1.5 text-xs text-white hover:bg-orange-400"
            title="添加节点"
          >
            <Plus className="h-3 w-3" /> 添加节点
          </button>
          <AnimatePresence>
            {createMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="absolute right-0 top-full mt-1 w-40 rounded-md border border-zinc-800 bg-zinc-950 py-1 shadow-xl"
              >
                {NODE_CREATE_OPTIONS.map((opt) => (
                  <button
                    key={opt.type}
                    onClick={() => handleCreateNode(opt.type)}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-zinc-300 hover:bg-zinc-900"
                  >
                    <span className="h-2 w-2 rounded-full" style={{ background: opt.color }} />
                    {opt.label}
                  </button>
                ))}
                {/* 分隔线 */}
                <div className="my-1 border-t border-zinc-800" />
                {/* 自定义节点入口 */}
                <button
                  onClick={() => setCustomNodeForm({ name: "", color: CUSTOM_NODE_COLORS[0] })}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-orange-400 hover:bg-zinc-900"
                >
                  <Plus className="h-3 w-3" />
                  自定义节点...
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 自定义节点表单（条件渲染，非折叠） */}
          {customNodeForm && (
            <div className="absolute right-0 top-full mt-1 w-56 rounded-md border border-zinc-800 bg-zinc-950 p-3 shadow-xl">
              <p className="mb-2 text-xs font-medium text-zinc-200">创建自定义节点</p>
              <input
                autoFocus
                value={customNodeForm.name}
                onChange={(e) => setCustomNodeForm({ ...customNodeForm, name: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateCustomNode();
                  if (e.key === "Escape") setCustomNodeForm(null);
                }}
                placeholder="节点名称（如：彩蛋结局）"
                className="mb-2 w-full rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-200 outline-none focus:border-orange-500"
              />
              <div className="mb-2 flex flex-wrap gap-1">
                {CUSTOM_NODE_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCustomNodeForm({ ...customNodeForm, color: c })}
                    className={`h-4 w-4 rounded-full ${customNodeForm.color === c ? "ring-2 ring-white ring-offset-1 ring-offset-zinc-950" : ""}`}
                    style={{ background: c }}
                  />
                ))}
              </div>
              <div className="flex justify-end gap-1">
                <button
                  onClick={() => setCustomNodeForm(null)}
                  className="rounded px-2 py-1 text-[11px] text-zinc-500 hover:bg-zinc-900"
                >
                  取消
                </button>
                <button
                  onClick={handleCreateCustomNode}
                  disabled={!customNodeForm.name.trim()}
                  className="rounded bg-orange-500 px-2 py-1 text-[11px] text-white hover:bg-orange-400 disabled:opacity-40"
                >
                  创建
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 空状态提示 */}
      {storyNodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <p className="text-sm text-zinc-500">还没有节点</p>
            <p className="mt-1 text-xs text-zinc-600">点击右上角"添加节点"或左侧对话让 Agent 帮你创建</p>
          </div>
        </div>
      )}

      <ReactFlow
        nodes={internalNodes}
        edges={internalEdges}
        nodeTypes={storyNodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={handleNodeDragStop}
        onConnect={handleConnect}
        onPaneClick={() => onSelectNode(null)}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        proOptions={{ hideAttribution: true }}
        nodesDraggable
        nodesConnectable
        elementsSelectable
        panOnDrag
        zoomOnScroll
        minZoom={0.2}
        maxZoom={2}
        defaultEdgeOptions={{
          type: "smoothstep",
          style: { strokeWidth: 1.5, stroke: "#7C6CF5" },
        }}
        className="bg-zinc-950"
      >
        <Background color="#27272a" gap={20} />
        <Controls className="!bg-zinc-900 !border-zinc-800" />
        <MiniMap
          nodeColor={(n) => {
            const data = n.data as { nodeType?: string } | undefined;
            const cfg = NODE_CREATE_OPTIONS.find((o) => o.type === data?.nodeType);
            return cfg?.color ?? "#52525b";
          }}
          maskColor="rgba(9,9,11,0.8)"
          className="!bg-zinc-950 !border-zinc-800"
        />
      </ReactFlow>

      {/* 新节点脉冲高亮提示 */}
      <AnimatePresence>
        {newIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 rounded-full bg-orange-500/90 px-3 py-1 text-[11px] text-white shadow-lg"
          >
            ✨ 新增 {newIds.size} 个节点
          </motion.div>
        )}
      </AnimatePresence>

      {/* 一致性问题指示器 */}
      {consistencyIssues.length > 0 && (
        <ConsistencyBadge issues={consistencyIssues} />
      )}

      {/* 路径测试结果面板 */}
      <AnimatePresence>
        {showPathPanel && pathTestResult && (
          <PathTestPanel
            result={pathTestResult}
            onClose={() => setShowPathPanel(false)}
          />
        )}
      </AnimatePresence>

      {/* 删除确认对话框 — 显示级联影响 */}
      {deleteTargetId && (
        <DeleteConfirmDialog
          nodeId={deleteTargetId}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteTargetId(null)}
        />
      )}
    </div>
  );
}

// 一致性问题徽章：左下角显示问题数量
function ConsistencyBadge({ issues }: { issues: import("@/lib/consistency-engine").ConsistencyIssue[] }) {
  const [expanded, setExpanded] = useState(false);
  const errors = issues.filter((i) => i.severity === "error");
  const warnings = issues.filter((i) => i.severity === "warning");

  return (
    <div className="absolute bottom-3 left-3 z-20">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-1.5 rounded-md bg-zinc-900 px-2.5 py-1.5 text-xs border border-zinc-800 hover:bg-zinc-800"
      >
        {errors.length > 0 ? (
          <AlertTriangle className="h-3 w-3 text-red-400" />
        ) : (
          <CheckCircle2 className="h-3 w-3 text-emerald-400" />
        )}
        <span className="text-zinc-300">
          {errors.length > 0 ? `${errors.length} 错误` : "无错误"}
          {warnings.length > 0 && ` · ${warnings.length} 警告`}
        </span>
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="absolute bottom-full left-0 mb-1 max-h-64 w-80 overflow-y-auto rounded-md border border-zinc-800 bg-zinc-950 p-2 shadow-xl"
          >
            {issues.length === 0 ? (
              <p className="px-2 py-3 text-center text-xs text-zinc-500">✅ 未发现一致性问题</p>
            ) : (
              <div className="space-y-1.5">
                {issues.map((issue) => (
                  <div
                    key={issue.id}
                    className="rounded border border-zinc-800 bg-zinc-900/50 p-2"
                  >
                    <div className="flex items-center gap-1.5">
                      <span
                        className={
                          issue.severity === "error"
                            ? "text-red-400"
                            : issue.severity === "warning"
                            ? "text-amber-400"
                            : "text-blue-400"
                        }
                      >
                        {issue.severity === "error" ? "●" : issue.severity === "warning" ? "▲" : "ℹ"}
                      </span>
                      <span className="text-xs font-medium text-zinc-200">{issue.title}</span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-zinc-500">{issue.description}</p>
                    <p className="mt-0.5 text-[11px] text-orange-400">→ {issue.suggestion}</p>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// 路径测试结果面板：右下角显示路径分析
function PathTestPanel({ result, onClose }: { result: PathTestOutput; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="absolute bottom-3 right-3 z-20 w-72 rounded-md border border-zinc-800 bg-zinc-950 p-3 shadow-xl"
    >
      <div className="mb-2 flex items-center justify-between">
        <h4 className="flex items-center gap-1.5 text-xs font-bold text-zinc-200">
          <Route className="h-3 w-3 text-orange-400" /> 路径分析
        </h4>
        <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300">✕</button>
      </div>
      <div className="grid grid-cols-2 gap-1.5 text-[11px]">
        <div className="rounded bg-zinc-900 p-1.5">
          <div className="text-zinc-500">总路径</div>
          <div className="text-base font-bold text-zinc-200">{result.stats.totalPaths}</div>
        </div>
        <div className="rounded bg-zinc-900 p-1.5">
          <div className="text-zinc-500">好结局</div>
          <div className="text-base font-bold text-emerald-400">{result.stats.goodEndings}</div>
        </div>
        <div className="rounded bg-zinc-900 p-1.5">
          <div className="text-zinc-500">坏结局</div>
          <div className="text-base font-bold text-red-400">{result.stats.badEndings}</div>
        </div>
        <div className="rounded bg-zinc-900 p-1.5">
          <div className="text-zinc-500">平均长度</div>
          <div className="text-base font-bold text-zinc-200">{result.stats.avgPathLength}</div>
        </div>
      </div>
      {result.deadEnds.length > 0 && (
        <div className="mt-2 rounded border border-red-900/50 bg-red-950/30 p-1.5">
          <div className="flex items-center gap-1 text-[11px] font-bold text-red-300">
            <AlertTriangle className="h-3 w-3" /> 死路节点 ({result.deadEnds.length})
          </div>
          <p className="mt-0.5 text-[10px] text-zinc-500">{result.deadEnds.join(", ")}</p>
        </div>
      )}
      {result.unreachableNodes.length > 0 && (
        <div className="mt-1 rounded border border-amber-900/50 bg-amber-950/30 p-1.5">
          <div className="flex items-center gap-1 text-[11px] font-bold text-amber-300">
            <AlertTriangle className="h-3 w-3" /> 不可达节点 ({result.unreachableNodes.length})
          </div>
          <p className="mt-0.5 text-[10px] text-zinc-500">{result.unreachableNodes.join(", ")}</p>
        </div>
      )}
      {result.cycleNodes.length > 0 && (
        <div className="mt-1 rounded border border-blue-900/50 bg-blue-950/30 p-1.5">
          <div className="flex items-center gap-1 text-[11px] font-bold text-blue-300">
            <AlertTriangle className="h-3 w-3" /> 循环节点 ({result.cycleNodes.length})
          </div>
          <p className="mt-0.5 text-[10px] text-zinc-500">{result.cycleNodes.join(", ")}</p>
        </div>
      )}
      {result.deadEnds.length === 0 && result.unreachableNodes.length === 0 && (
        <div className="mt-2 flex items-center gap-1.5 rounded bg-emerald-950/30 p-1.5 text-[11px] text-emerald-300">
          <CheckCircle2 className="h-3 w-3" /> 图谱结构完整，无死路或不可达节点
        </div>
      )}
    </motion.div>
  );
}

// 预览视图：实际可交互的演出预览（完整 simulator 组件集成）
function PreviewView() {
  const storyNodes = useNarrativeStore((s) => s.storyNodes);
  const playableGraph = useNarrativeStore((s) => s.playableGraph);
  const initVariables = useNarrativeStore((s) => s.initVariables);
  const rebuildPlayableGraph = useNarrativeStore((s) => s.rebuildPlayableGraph);

  // 监听 storyNodes 变化，自动重建 playableGraph
  const prevKeyRef = useRef<string>("");
  useEffect(() => {
    const key = JSON.stringify(storyNodes);
    if (key !== prevKeyRef.current) {
      prevKeyRef.current = key;
      rebuildPlayableGraph();
    }
  }, [storyNodes, rebuildPlayableGraph]);

  // 找到起始节点
  const startNodeId = useMemo(() => {
    const startNode = storyNodes.find((n) => n.type === "start");
    if (startNode) return startNode.id;
    const keys = Object.keys(playableGraph);
    if (keys.length > 0) return keys[0];
    return null;
  }, [storyNodes, playableGraph]);

  const engine = useRuntimeEngine(playableGraph);
  const [started, setStarted] = useState(false);
  const [savePanelMode, setSavePanelMode] = useState<"save" | "load" | null>(null);

  // 自动启动
  useEffect(() => {
    if (!started && startNodeId && playableGraph[startNodeId]) {
      engine.reset(startNodeId, initVariables);
      setStarted(true);
    }
  }, [started, startNodeId, playableGraph, initVariables, engine]);

  // 过滤音频对象给 AudioPlayer
  const audioObjects = useMemo(() => {
    return engine.sceneObjects.filter((o) => o.type === "audio") as Extract<SceneObject, { type: "audio" }>[];
  }, [engine.sceneObjects]);

  // 图为空
  if (storyNodes.length === 0) {
    return (
      <div className="flex h-full items-center justify-center bg-zinc-950 p-6">
        <div className="text-center">
          <Eye className="mx-auto h-10 w-10 text-zinc-700" />
          <p className="mt-3 text-sm text-zinc-400">暂无场景可预览</p>
          <p className="mt-1 text-xs text-zinc-600">先在节点图中创建节点</p>
        </div>
      </div>
    );
  }

  const currentNode = engine.currentNode;
  const isFinished = engine.isFinished;

  return (
    <StyleProvider>
      <div className="flex h-full flex-col bg-zinc-950">
        {/* 预览容器：填满画布区 */}
        <div className="flex flex-1 items-center justify-center p-4">
          <div className="relative aspect-video w-full max-w-3xl overflow-hidden rounded-xl border border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-950">
            {/* 场景渲染区 */}
            <div className="absolute inset-0">
              <SceneRenderer objects={engine.sceneObjects} />
            </div>

            {/* 运行时 UI 系统（对话框/选项/菜单等，由 UIManager 驱动）*/}
            <UIRenderer />

            {/* 字幕/对话区（与 UIRenderer 互补：当 UIManager 无活跃实例时显示）*/}
            <div className="pointer-events-none absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              {isFinished ? (
                <div className="text-center">
                  <p className="text-sm font-medium text-white">
                    {engine.endingType === "good" ? "★ 好结局" : "✕ 坏结局"}
                  </p>
                  <p className="mt-1 text-xs text-zinc-400">故事结束</p>
                </div>
              ) : currentNode ? (
                <div>
                  {currentNode.char && (
                    <p className="text-[11px] uppercase tracking-wide text-orange-400">
                      {currentNode.char}
                    </p>
                  )}
                  <p className="mt-1 text-sm text-white">{currentNode.text || currentNode.id}</p>
                </div>
              ) : (
                <p className="text-center text-sm text-zinc-400">准备开始...</p>
              )}
            </div>

            {/* 选择按钮 */}
            {engine.waitingForChoice && currentNode?.choices && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/60 p-6">
                <p className="mb-2 text-sm text-white">请选择：</p>
                {currentNode.choices.map((choice, idx) => (
                  <button
                    key={idx}
                    onClick={() => engine.choose(idx)}
                    className="w-full max-w-md rounded-lg border border-zinc-700 bg-zinc-900/80 px-4 py-2 text-left text-sm text-zinc-200 hover:border-orange-500 hover:bg-zinc-800"
                  >
                    {choice.label || `选项 ${idx + 1}`}
                  </button>
                ))}
              </div>
            )}

            {/* 浮动控制条：悬浮在预览底部中央，不占独立行 */}
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-zinc-950/80 px-2 py-1 backdrop-blur">
              {!isFinished && !engine.waitingForChoice && (
                <button
                  onClick={() => engine.advance()}
                  disabled={!currentNode}
                  className="flex items-center gap-1 rounded-full bg-orange-500 px-3 py-1 text-xs text-white hover:bg-orange-400 disabled:opacity-40"
                >
                  <Play className="h-3 w-3" /> 继续
                </button>
              )}
              {engine.canRollback && (
                <button
                  onClick={() => engine.rollback()}
                  className="flex items-center gap-1 rounded-full bg-zinc-800 px-2.5 py-1 text-xs text-zinc-300 hover:bg-zinc-700"
                  title="回退"
                >
                  <RotateCcw className="h-3 w-3" />
                </button>
              )}
              <button
                onClick={() => startNodeId && engine.reset(startNodeId, initVariables)}
                className="flex items-center gap-1 rounded-full bg-zinc-800 px-2.5 py-1 text-xs text-zinc-300 hover:bg-zinc-700"
                title="重新开始"
              >
                <RotateCcw className="h-3 w-3" />
              </button>
              <div className="mx-0.5 h-3 w-px bg-zinc-700" />
              <button
                onClick={() => setSavePanelMode("save")}
                className="flex items-center gap-1 rounded-full bg-zinc-800 px-2.5 py-1 text-xs text-zinc-300 hover:bg-zinc-700"
                title="存档"
              >
                <Save className="h-3 w-3" />
              </button>
              <button
                onClick={() => setSavePanelMode("load")}
                className="flex items-center gap-1 rounded-full bg-zinc-800 px-2.5 py-1 text-xs text-zinc-300 hover:bg-zinc-700"
                title="读档"
              >
                <FolderOpen className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>

        {/* 不可见音频驱动组件 */}
        <AudioPlayer audioObjects={audioObjects} />

        {/* 存档/读档面板 */}
        <AnimatePresence>
          {savePanelMode && (
            <SavePanel
              mode={savePanelMode}
              context={engine.getContext()}
              onClose={() => setSavePanelMode(null)}
              onLoad={(_data) => {
                // 读档后同步引擎状态
                if (startNodeId) {
                  engine.reset(startNodeId, initVariables);
                }
                setSavePanelMode(null);
              }}
            />
          )}
        </AnimatePresence>
      </div>
    </StyleProvider>
  );
}

// 时间线视图：按节点顺序列表
function TimelineView({
  selectedNodeId,
  onSelectNode,
}: {
  selectedNodeId: string | null;
  onSelectNode: (id: string | null) => void;
}) {
  const storyNodes = useNarrativeStore((s) => s.storyNodes);
  const NODE_COLORS: Record<string, string> = {
    start: "#10b981", scene: "#6366f1", choice: "#f59e0b",
    condition: "#8b5cf6", qte: "#ef4444",
    ending_good: "#22c55e", ending_bad: "#dc2626",
  };
  return (
    <div className="h-full overflow-y-auto bg-zinc-950 p-4">
      <div className="mx-auto max-w-2xl space-y-2">
        {storyNodes.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <Clapperboard className="h-8 w-8 text-zinc-700" />
            <p className="text-sm text-zinc-500">暂无时间线节点</p>
            <p className="text-xs leading-relaxed text-zinc-600">在「节点图」中创建分支节点后，时间线将自动显示</p>
          </div>
        )}
        {storyNodes.map((n, i) => (
          <button
            key={n.id}
            onClick={() => onSelectNode(n.id === selectedNodeId ? null : n.id)}
            className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left transition-colors ${
              n.id === selectedNodeId
                ? "border-orange-500 bg-zinc-900"
                : "border-zinc-800 bg-zinc-900/40 hover:border-zinc-700"
            }`}
          >
            <span
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] text-zinc-300"
              style={{ backgroundColor: (NODE_COLORS[n.type] ?? "#52525b") + "22" }}
            >
              {i + 1}
            </span>
            <span className="flex-1 truncate text-sm text-zinc-200">{n.label}</span>
            <span className="text-[10px] text-zinc-500">{n.type}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// 角色表视图：角色卡片列表 + 点击展开换装编辑器
function CharactersView() {
  const characters = useNarrativeStore((s) => s.characters);
  const updateCharacter = useNarrativeStore((s) => s.updateCharacter);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // 换装 store
  const getWardrobe = useWardrobeStore((s) => s.getWardrobe);
  const addOutfit = useWardrobeStore((s) => s.addOutfit);
  const updateOutfit = useWardrobeStore((s) => s.updateOutfit);
  const removeOutfit = useWardrobeStore((s) => s.removeOutfit);
  const setDefaultOutfit = useWardrobeStore((s) => s.setDefaultOutfit);
  const bindOutfitToNodes = useWardrobeStore((s) => s.bindOutfitToNodes);
  const unbindOutfitFromNodes = useWardrobeStore((s) => s.unbindOutfitFromNodes);

  const selected = characters.find((c) => c.id === selectedId) ?? null;
  const selectedWardrobe = selected ? getWardrobe(selected.id) : undefined;

  return (
    <div className="relative h-full overflow-hidden bg-zinc-950">
      <div className="h-full overflow-y-auto p-4">
        <div className="mx-auto grid max-w-3xl grid-cols-1 gap-3 sm:grid-cols-2">
          {characters.length === 0 && (
            <div className="col-span-full flex flex-col items-center gap-2 py-12 text-center">
              <Users className="h-8 w-8 text-zinc-700" />
              <p className="text-sm text-zinc-500">暂无角色</p>
              <p className="text-xs leading-relaxed text-zinc-600">通过对话让 AI 基于剧本创建角色</p>
            </div>
          )}
          {characters.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedId(c.id)}
              className={`rounded-lg border p-3 text-left transition-colors ${
                c.id === selectedId
                  ? "border-orange-500 bg-zinc-900"
                  : "border-zinc-800 bg-zinc-900/60 hover:border-zinc-700"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">{c.emoji}</span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-zinc-100">{c.name}</p>
                  <p className="truncate text-[11px] text-zinc-500">{c.role}</p>
                </div>
              </div>
              <p className="mt-2 line-clamp-2 text-xs text-zinc-400">{c.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* 角色详情 + 换装编辑抽屉 */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="absolute right-0 top-0 z-30 h-full w-full max-w-md overflow-y-auto border-l border-zinc-800 bg-zinc-950 p-4"
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{selected.emoji}</span>
                <div>
                  <p className="text-sm font-medium text-zinc-100">{selected.name}</p>
                  <p className="text-[11px] text-zinc-500">{selected.role}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedId(null)}
                className="rounded-md p-1 text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* 角色基本信息编辑 */}
            <div className="mb-4 space-y-2 rounded-lg border border-zinc-800 bg-zinc-900/40 p-3">
              <label className="block text-[11px] text-zinc-500">角色描述</label>
              <textarea
                value={selected.description}
                onChange={(e) => updateCharacter(selected.id, { description: e.target.value })}
                rows={2}
                className="w-full resize-none rounded bg-zinc-950 px-2 py-1 text-xs text-zinc-200 outline-none ring-1 ring-zinc-800 focus:ring-orange-500"
              />
              <label className="block text-[11px] text-zinc-500">视觉提示词（用于 AI 生图）</label>
              <input
                value={selected.visualPrompt}
                onChange={(e) => updateCharacter(selected.id, { visualPrompt: e.target.value })}
                className="w-full rounded bg-zinc-950 px-2 py-1 text-xs text-zinc-200 outline-none ring-1 ring-zinc-800 focus:ring-orange-500"
              />
            </div>

            {/* 换装编辑器 */}
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-3">
              <h4 className="mb-2 flex items-center gap-1.5 text-xs font-medium text-zinc-300">
                <Clapperboard className="h-3 w-3 text-orange-400" /> 造型衣柜
              </h4>
              <WardrobeEditor
                character={selected}
                wardrobe={selectedWardrobe}
                onAddOutfit={addOutfit}
                onUpdateOutfit={updateOutfit}
                onRemoveOutfit={removeOutfit}
                onSetDefault={setDefaultOutfit}
                onBindNodes={bindOutfitToNodes}
                onUnbindNodes={unbindOutfitFromNodes}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// 场景设置视图：场景列表 + 编辑
function ScenesView() {
  const scenes = useNarrativeStore((s) => s.scenes);
  const storyNodes = useNarrativeStore((s) => s.storyNodes);
  const updateScene = useNarrativeStore((s) => s.updateScene);
  const removeScene = useNarrativeStore((s) => s.removeScene);
  const [selectedId, setSelectedId] = useState<string | null>(scenes[0]?.id ?? null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const selected = scenes.find((s) => s.id === selectedId) ?? null;
  const refNodeLabels = selected
    ? selected.refNodes
        .map((id) => storyNodes.find((n) => n.id === id)?.label ?? id)
        .join("、")
    : "";

  const confirmDelete = () => {
    if (!deleteTarget) return;
    removeScene(deleteTarget.id);
    if (selectedId === deleteTarget.id) {
      setSelectedId(scenes.find((s) => s.id !== deleteTarget.id)?.id ?? null);
    }
    setDeleteTarget(null);
  };

  return (
    <div className="flex h-full bg-zinc-950">
      {/* 左：场景列表 */}
      <div className="w-56 shrink-0 overflow-y-auto border-r border-zinc-800 p-2">
        {scenes.length === 0 && (
          <div className="flex flex-col items-center gap-1 px-2 py-8 text-center">
            <MapPin className="h-6 w-6 text-zinc-600" />
            <p className="text-xs text-zinc-500">暂无场景</p>
            <p className="text-[11px] text-zinc-700">通过对话让 AI 创建</p>
          </div>
        )}
        {scenes.map((s) => (
          <button
            key={s.id}
            onClick={() => setSelectedId(s.id)}
            className={`mb-1 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs ${
              s.id === selectedId ? "bg-zinc-800 text-zinc-100" : "text-zinc-400 hover:bg-zinc-900"
            }`}
          >
            <MapPin className="h-3 w-3 shrink-0 text-orange-400" />
            <span className="truncate">{s.name}</span>
          </button>
        ))}
      </div>

      {/* 右：场景详情编辑 */}
      <div className="flex-1 overflow-y-auto p-4">
        {!selected ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
            <MapPin className="h-8 w-8 text-zinc-600" />
            <p className="text-sm text-zinc-500">选择左侧场景查看详情</p>
            <p className="text-xs text-zinc-700">或通过对话让 AI 创建场景</p>
          </div>
        ) : (
          <div className="mx-auto max-w-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-orange-400" />
                <h3 className="text-sm font-medium text-zinc-100">{selected.name}</h3>
              </div>
              <button
                onClick={() => setDeleteTarget({ id: selected.id, name: selected.name })}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-zinc-400 hover:bg-red-900/40 hover:text-red-400"
                title="删除场景"
              >
                <Trash2 className="h-3.5 w-3.5" /> 删除
              </button>
            </div>

            <div className="space-y-2">
              <Field label="场景名称">
                <input
                  value={selected.name}
                  onChange={(e) => updateScene(selected.id, { name: e.target.value })}
                  className="input"
                />
              </Field>
              <Field label="地点">
                <input
                  value={selected.location}
                  onChange={(e) => updateScene(selected.id, { location: e.target.value })}
                  className="input"
                />
              </Field>
              <Field label="光照">
                <input
                  value={selected.lighting}
                  onChange={(e) => updateScene(selected.id, { lighting: e.target.value })}
                  className="input"
                />
              </Field>
              <Field label="氛围">
                <input
                  value={selected.atmosphere}
                  onChange={(e) => updateScene(selected.id, { atmosphere: e.target.value })}
                  className="input"
                />
              </Field>
              <Field label="视觉提示词（用于 AI 生图）">
                <textarea
                  value={selected.visualPrompt}
                  onChange={(e) => updateScene(selected.id, { visualPrompt: e.target.value })}
                  rows={3}
                  className="input resize-none"
                />
              </Field>
              <Field label="关联节点">
                <div className="rounded bg-zinc-900 px-2 py-1.5 text-xs text-zinc-400">
                  {refNodeLabels || "无关联节点"}
                </div>
              </Field>
            </div>
          </div>
        )}
      </div>

      {/* 删除确认对话框 */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70" onClick={() => setDeleteTarget(null)}>
          <div
            className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-950 p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center gap-1.5 text-sm font-medium text-zinc-100">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              确认删除场景
            </div>
            <div className="mb-4 rounded-md border border-zinc-800 bg-zinc-900/50 p-3">
              <div className="text-xs text-zinc-500">即将删除场景：</div>
              <div className="mt-1 text-sm font-medium text-zinc-100">{deleteTarget.name}</div>
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="rounded-md border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800"
              >
                取消
              </button>
              <button
                onClick={confirmDelete}
                className="flex items-center gap-1.5 rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-500"
              >
                <Trash2 className="h-3 w-3" /> 确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 镜头编辑视图：按节点编辑 CinematicDirection
function CinematicView() {
  const cinematicDirections = useNarrativeStore((s) => s.cinematicDirections);
  const storyNodes = useNarrativeStore((s) => s.storyNodes);
  const updateCinematicDirection = useNarrativeStore((s) => s.updateCinematicDirection);
  const removeCinematicDirection = useNarrativeStore((s) => s.removeCinematicDirection);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(
    cinematicDirections[0]?.nodeId ?? storyNodes[0]?.id ?? null,
  );
  const [deleteTarget, setDeleteTarget] = useState<{ nodeId: string; label: string } | null>(null);

  const selected = cinematicDirections.find((cd) => cd.nodeId === selectedNodeId) ?? null;
  const selectedNode = storyNodes.find((n) => n.id === selectedNodeId) ?? null;

  const confirmDelete = () => {
    if (!deleteTarget) return;
    removeCinematicDirection(deleteTarget.nodeId);
    if (selectedNodeId === deleteTarget.nodeId) setSelectedNodeId(null);
    setDeleteTarget(null);
  };

  return (
    <div className="flex h-full bg-zinc-950">
      {/* 左：节点列表 */}
      <div className="w-56 shrink-0 overflow-y-auto border-r border-zinc-800 p-2">
        {cinematicDirections.length === 0 && (
          <div className="flex flex-col items-center gap-2 px-2 py-8 text-center">
            <Film className="h-6 w-6 text-zinc-700" />
            <p className="text-xs text-zinc-500">暂无镜头指导</p>
            <p className="text-[11px] leading-relaxed text-zinc-600">通过对话让 AI 为每个节点设计镜头</p>
          </div>
        )}
        {cinematicDirections.map((cd) => {
          const node = storyNodes.find((n) => n.id === cd.nodeId);
          return (
            <button
              key={cd.nodeId}
              onClick={() => setSelectedNodeId(cd.nodeId)}
              className={`mb-1 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs ${
                cd.nodeId === selectedNodeId ? "bg-zinc-800 text-zinc-100" : "text-zinc-400 hover:bg-zinc-900"
              }`}
            >
              <Film className="h-3 w-3 shrink-0 text-orange-400" />
              <span className="truncate">{node?.label ?? cd.nodeId}</span>
            </button>
          );
        })}
      </div>

      {/* 右：镜头指导编辑 */}
      <div className="flex-1 overflow-y-auto p-4">
        {!selected ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
            <Film className="h-8 w-8 text-zinc-700" />
            <p className="text-xs text-zinc-500">
              {selectedNode ? `${selectedNode.label} 暂无镜头指导` : "选择左侧节点查看镜头指导"}
            </p>
            <p className="text-[11px] leading-relaxed text-zinc-600">或通过对话让 AI 批量生成</p>
          </div>
        ) : (
          <div className="mx-auto max-w-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="h-4 w-4 text-orange-400" />
                <h3 className="text-sm font-medium text-zinc-100">
                  {selectedNode?.label ?? selected.nodeId} · 镜头指导
                </h3>
              </div>
              <button
                onClick={() => setDeleteTarget({ nodeId: selected.nodeId, label: selectedNode?.label ?? selected.nodeId })}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-zinc-500 transition hover:bg-red-950/40 hover:text-red-400"
                title="删除此节点的镜头指导"
              >
                <Trash2 className="h-3 w-3" />
                <span>删除</span>
              </button>
            </div>

            {/* 镜头 */}
            <section className="space-y-2 rounded-lg border border-zinc-800 bg-zinc-900/40 p-3">
              <h4 className="text-[11px] font-medium text-zinc-400">镜头（Camera）</h4>
              <div className="grid grid-cols-2 gap-2">
                <Field label="景别">
                  <select
                    value={selected.camera.shotType}
                    onChange={(e) =>
                      updateCinematicDirection(selected.nodeId, {
                        camera: { ...selected.camera, shotType: e.target.value as CameraShotType, shotLabel: SHOT_LABELS[e.target.value as CameraShotType] ?? selected.camera.shotLabel },
                      })
                    }
                    className="input"
                  >
                    {Object.entries(SHOT_LABELS).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </Field>
                <Field label="运镜">
                  <select
                    value={selected.camera.movement}
                    onChange={(e) =>
                      updateCinematicDirection(selected.nodeId, {
                        camera: { ...selected.camera, movement: e.target.value as CameraMovement, movementLabel: MOVEMENT_LABELS[e.target.value as CameraMovement] ?? selected.camera.movementLabel },
                      })
                    }
                    className="input"
                  >
                    {Object.entries(MOVEMENT_LABELS).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </Field>
                <Field label="时长（秒）">
                  <input
                    type="number"
                    min={0.5}
                    step={0.5}
                    value={selected.camera.duration}
                    onChange={(e) =>
                      updateCinematicDirection(selected.nodeId, {
                        camera: { ...selected.camera, duration: Number(e.target.value) || 1 },
                      })
                    }
                    className="input"
                  />
                </Field>
                <Field label="焦点">
                  <input
                    value={selected.camera.focusTarget ?? ""}
                    onChange={(e) =>
                      updateCinematicDirection(selected.nodeId, {
                        camera: { ...selected.camera, focusTarget: e.target.value },
                      })
                    }
                    className="input"
                  />
                </Field>
              </div>
            </section>

            {/* 转场 + 节奏 */}
            <section className="grid grid-cols-2 gap-3">
              <Field label="转场">
                <select
                  value={selected.transition}
                  onChange={(e) =>
                    updateCinematicDirection(selected.nodeId, {
                      transition: e.target.value as TransitionType,
                      transitionLabel: TRANSITION_LABELS[e.target.value as TransitionType] ?? selected.transitionLabel,
                    })
                  }
                  className="input"
                >
                  {Object.entries(TRANSITION_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </Field>
              <Field label="节奏">
                <input
                  value={selected.pacing}
                  onChange={(e) => updateCinematicDirection(selected.nodeId, { pacing: e.target.value })}
                  className="input"
                />
              </Field>
            </section>

            {/* 调度备注 */}
            <Field label="调度备注（角色站位/走位）">
              <textarea
                value={selected.staging ?? ""}
                onChange={(e) => updateCinematicDirection(selected.nodeId, { staging: e.target.value })}
                rows={2}
                className="input resize-none"
              />
            </Field>

            {/* 表演指导 */}
            <section className="space-y-2 rounded-lg border border-zinc-800 bg-zinc-900/40 p-3">
              <h4 className="text-[11px] font-medium text-zinc-400">表演指导（Performances）</h4>
              {selected.performances.map((p, idx) => (
                <div key={idx} className="grid grid-cols-2 gap-2 rounded bg-zinc-950/60 p-2">
                  <Field label="角色">
                    <input value={p.characterName} disabled className="input opacity-60" />
                  </Field>
                  <Field label="表情">
                    <input
                      value={p.expression}
                      onChange={(e) => {
                        const performances = [...selected.performances];
                        performances[idx] = { ...p, expression: e.target.value };
                        updateCinematicDirection(selected.nodeId, { performances });
                      }}
                      className="input"
                    />
                  </Field>
                  <Field label="动作">
                    <input
                      value={p.action}
                      onChange={(e) => {
                        const performances = [...selected.performances];
                        performances[idx] = { ...p, action: e.target.value };
                        updateCinematicDirection(selected.nodeId, { performances });
                      }}
                      className="input"
                    />
                  </Field>
                  <Field label="情绪强度">
                    <select
                      value={p.emotionIntensity}
                      onChange={(e) => {
                        const performances = [...selected.performances];
                        const v = e.target.value as EmotionIntensity;
                        performances[idx] = { ...p, emotionIntensity: v, emotionLabel: EMOTION_LABELS[v] ?? p.emotionLabel };
                        updateCinematicDirection(selected.nodeId, { performances });
                      }}
                      className="input"
                    >
                      {Object.entries(EMOTION_LABELS).map(([v, l]) => (
                        <option key={v} value={v}>{l}</option>
                      ))}
                    </select>
                  </Field>
                </div>
              ))}
            </section>

            {/* 音频设计 */}
            <section className="space-y-2 rounded-lg border border-zinc-800 bg-zinc-900/40 p-3">
              <h4 className="text-[11px] font-medium text-zinc-400">音频设计（Audio）</h4>
              <Field label="BGM">
                <input
                  value={selected.audio.bgmTrack}
                  onChange={(e) =>
                    updateCinematicDirection(selected.nodeId, {
                      audio: { ...selected.audio, bgmTrack: e.target.value },
                    })
                  }
                  className="input"
                />
              </Field>
              <Field label="BGM 情绪">
                <input
                  value={selected.audio.bgmMood}
                  onChange={(e) =>
                    updateCinematicDirection(selected.nodeId, {
                      audio: { ...selected.audio, bgmMood: e.target.value },
                    })
                  }
                  className="input"
                />
              </Field>
              <Field label="环境音">
                <input
                  value={selected.audio.ambientSound}
                  onChange={(e) =>
                    updateCinematicDirection(selected.nodeId, {
                      audio: { ...selected.audio, ambientSound: e.target.value },
                    })
                  }
                  className="input"
                />
              </Field>
            </section>
          </div>
        )}
      </div>

      {/* 删除确认对话框 */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-80 rounded-lg border border-zinc-800 bg-zinc-900 p-4">
            <div className="mb-3 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-400" />
              <h3 className="text-sm font-medium text-zinc-100">确认删除</h3>
            </div>
            <p className="mb-4 text-xs leading-relaxed text-zinc-400">
              确定要删除「{deleteTarget.label}」的镜头指导吗？此操作不可撤销。
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="rounded-md px-3 py-1.5 text-xs text-zinc-400 transition hover:bg-zinc-800"
              >
                取消
              </button>
              <button
                onClick={confirmDelete}
                className="rounded-md bg-red-600 px-3 py-1.5 text-xs text-white transition hover:bg-red-500"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 字段包装组件
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="mb-0.5 block text-[11px] text-zinc-500">{label}</label>
      {children}
    </div>
  );
}

// 镜头/运镜/转场/情绪 中文标签映射
const SHOT_LABELS: Record<CameraShotType, string> = {
  wide: "远景", medium: "中景", close_up: "特写", tracking: "跟踪",
  push_in: "推镜", pull_out: "拉镜", handheld: "手持", static: "固定",
};
const MOVEMENT_LABELS: Record<CameraMovement, string> = {
  none: "无", pan_left: "左摇", pan_right: "右摇", tilt_up: "上摇", tilt_down: "下摇",
  dolly_in: "推车前进", dolly_out: "推车后退", crane_up: "升镜", crane_down: "降镜",
  orbit: "环绕", static: "静止", push_in: "推进", pull_out: "拉远", tracking: "跟踪",
};
const TRANSITION_LABELS: Record<TransitionType, string> = {
  cut: "硬切", fade: "淡入淡出", dissolve: "溶解", wipe: "擦除", flash: "闪白", slow_motion: "慢动作",
};
const EMOTION_LABELS: Record<EmotionIntensity, string> = {
  calm: "平静", neutral: "中性", tense: "紧张", intense: "激烈", climax: "高潮",
};

// 健康度视图：从真实项目数据计算质量指标（非 AI 非 mock）
function HealthView() {
  const storyNodes = useNarrativeStore((s) => s.storyNodes);
  const nodeEdges = useNarrativeStore((s) => s.nodeEdges);
  const characters = useNarrativeStore((s) => s.characters);
  const variables = useNarrativeStore((s) => s.variables);
  const cinematicDirections = useNarrativeStore((s) => s.cinematicDirections);

  // 真实计算路径分析
  const pathResult = useMemo(() => runPathTest(storyNodes, nodeEdges), [storyNodes, nodeEdges]);

  // 真实计算一致性检查
  const consistencyIssues = useConsistencyChecker();

  // 综合健康度评分（0-100，纯计算）
  const health = useMemo(() => {
    const nodeCount = storyNodes.length;
    const edgeCount = nodeEdges.length;
    const endingCount = storyNodes.filter((n) => n.type === "ending_good" || n.type === "ending_bad").length;
    const choiceCount = storyNodes.filter((n) => n.type === "choice").length;
    const deadEnds = pathResult.deadEnds.length;
    const unreachable = pathResult.unreachableNodes.length;
    const errors = consistencyIssues.filter((i) => i.severity === "error").length;
    const warnings = consistencyIssues.filter((i) => i.severity === "warning").length;

    // 评分维度
    let score = 100;
    // 死路扣分（每个 -5）
    score -= deadEnds * 5;
    // 不可达扣分（每个 -4）
    score -= unreachable * 4;
    // 错误扣分（每个 -8）
    score -= errors * 8;
    // 警告扣分（每个 -2）
    score -= warnings * 2;
    // 无结局扣分
    if (endingCount === 0 && nodeCount > 0) score -= 15;
    // 无选择扣分（线性故事）
    if (choiceCount === 0 && nodeCount > 3) score -= 10;
    // 无角色扣分
    if (characters.length === 0 && nodeCount > 0) score -= 10;
    // 镜头覆盖率
    const cinematicCoverage = nodeCount > 0 ? cinematicDirections.length / nodeCount : 0;
    if (cinematicCoverage < 0.3 && nodeCount > 0) score -= 5;

    score = Math.max(0, Math.min(100, score));

    return {
      score,
      nodeCount,
      edgeCount,
      endingCount,
      choiceCount,
      deadEnds,
      unreachable,
      errors,
      warnings,
      cinematicCoverage: Math.round(cinematicCoverage * 100),
      totalPaths: pathResult.stats.totalPaths,
      goodEndings: pathResult.stats.goodEndings,
      badEndings: pathResult.stats.badEndings,
      characterCount: characters.length,
      variableCount: variables.length,
    };
  }, [storyNodes, nodeEdges, characters, variables, cinematicDirections, pathResult, consistencyIssues]);

  const scoreColor = health.score >= 80 ? "text-emerald-400" : health.score >= 60 ? "text-amber-400" : "text-red-400";

  return (
    <div className="h-full overflow-y-auto bg-zinc-950 p-6">
      <div className="mx-auto max-w-3xl space-y-5">
        {/* 说明提示（常驻，非折叠） */}
        <div className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-xs text-zinc-500">
          <Heart className="h-3.5 w-3.5 shrink-0 text-rose-400" />
          <span>健康度评分基于当前项目数据自动计算（路径分析 + 一致性检查 + 覆盖率）</span>
        </div>
        {/* 总分 */}
        <div className="flex items-center gap-5 rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
          <div className="relative flex h-20 w-20 items-center justify-center">
            <svg className="h-20 w-20 -rotate-90" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="34" fill="none" stroke="rgb(39 39 42)" strokeWidth="6" />
              <circle
                cx="40" cy="40" r="34" fill="none" stroke="currentColor" strokeWidth="6"
                className={scoreColor}
                strokeDasharray={`${(health.score / 100) * 213.6} 213.6`}
                strokeLinecap="round"
              />
            </svg>
            <span className={`absolute text-xl font-bold ${scoreColor}`}>{health.score}</span>
          </div>
          <div>
            <h3 className="text-sm font-medium text-zinc-100">项目健康度</h3>
            <p className="mt-1 text-xs text-zinc-500">
              {health.score >= 80 ? "结构良好，可继续迭代" : health.score >= 60 ? "存在一些问题，建议修复" : "问题较多，需要重点改进"}
            </p>
          </div>
        </div>

        {/* 结构指标 */}
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
          <h4 className="mb-3 flex items-center gap-1.5 text-sm font-medium text-zinc-200">
            <Route className="h-4 w-4 text-orange-400" /> 结构指标
          </h4>
          <div className="grid grid-cols-4 gap-3">
            <Metric label="节点" value={health.nodeCount} />
            <Metric label="连接" value={health.edgeCount} />
            <Metric label="选择点" value={health.choiceCount} />
            <Metric label="结局" value={health.endingCount} />
            <Metric label="角色" value={health.characterCount} />
            <Metric label="变量" value={health.variableCount} />
            <Metric label="总路径" value={health.totalPaths} />
            <Metric label="镜头覆盖" value={`${health.cinematicCoverage}%`} />
          </div>
        </section>

        {/* 问题指标 */}
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
          <h4 className="mb-3 flex items-center gap-1.5 text-sm font-medium text-zinc-200">
            <AlertTriangle className="h-4 w-4 text-amber-400" /> 问题检测
          </h4>
          <div className="grid grid-cols-4 gap-3">
            <Metric label="死路节点" value={health.deadEnds} color={health.deadEnds > 0 ? "text-red-400" : "text-emerald-400"} />
            <Metric label="不可达" value={health.unreachable} color={health.unreachable > 0 ? "text-red-400" : "text-emerald-400"} />
            <Metric label="错误" value={health.errors} color={health.errors > 0 ? "text-red-400" : "text-emerald-400"} />
            <Metric label="警告" value={health.warnings} color={health.warnings > 0 ? "text-amber-400" : "text-emerald-400"} />
          </div>
          {health.deadEnds > 0 && (
            <p className="mt-3 text-xs text-zinc-500">
              死路节点：{pathResult.deadEnds.map((n) => n.label).join("、")}
            </p>
          )}
          {health.unreachable > 0 && (
            <p className="mt-1 text-xs text-zinc-500">
              不可达节点：{pathResult.unreachableNodes.map((n) => n.label).join("、")}
            </p>
          )}
        </section>

        {/* 结局分布 */}
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
          <h4 className="mb-3 flex items-center gap-1.5 text-sm font-medium text-zinc-200">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" /> 结局分布
          </h4>
          <div className="flex h-3 overflow-hidden rounded-full bg-zinc-800">
            {health.totalPaths > 0 && (
              <>
                <div className="bg-emerald-500" style={{ width: `${(health.goodEndings / health.totalPaths) * 100}%` }} />
                <div className="bg-red-500" style={{ width: `${(health.badEndings / health.totalPaths) * 100}%` }} />
              </>
            )}
          </div>
          <div className="mt-2 flex justify-between text-xs text-zinc-500">
            <span className="text-emerald-400">好结局 {health.goodEndings}</span>
            <span className="text-red-400">坏结局 {health.badEndings}</span>
          </div>
        </section>

        {/* 一致性问题列表 */}
        {consistencyIssues.length > 0 && (
          <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
            <h4 className="mb-3 flex items-center gap-1.5 text-sm font-medium text-zinc-200">
              <AlertTriangle className="h-4 w-4 text-amber-400" /> 一致性问题（{consistencyIssues.length}）
            </h4>
            <div className="space-y-2">
              {consistencyIssues.slice(0, 10).map((issue, idx) => (
                <div key={idx} className="flex items-start gap-2 rounded-md bg-zinc-900/60 p-2">
                  <span className={`mt-0.5 text-xs font-medium ${issue.severity === "error" ? "text-red-400" : "text-amber-400"}`}>
                    [{issue.severity}]
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs text-zinc-200">{issue.title}</p>
                    <p className="mt-0.5 text-[11px] text-zinc-500">{issue.suggestion}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function Metric({ label, value, color }: { label: string; value: number | string; color?: string }) {
  return (
    <div className="rounded-lg bg-zinc-900/60 p-2.5 text-center">
      <p className={`text-lg font-semibold ${color ?? "text-zinc-100"}`}>{value}</p>
      <p className="mt-0.5 text-[11px] text-zinc-500">{label}</p>
    </div>
  );
}

// 关系强度条：-100 到 100，负数红色（向左），正数绿色（向右），中线为 0
function StrengthBar({ value }: { value: number }) {
  // 计算填充百分比（相对于满偏 100）
  const absPercent = Math.min(100, Math.abs(value));
  const isPositive = value >= 0;
  return (
    <div className="relative h-2 w-full rounded-full bg-zinc-800">
      {/* 中线 */}
      <div className="absolute left-1/2 top-0 h-full w-px bg-zinc-600" />
      {/* 填充条 */}
      <div
        className={`absolute top-0 h-full rounded-full ${isPositive ? "bg-emerald-500" : "bg-red-500"}`}
        style={
          isPositive
            ? { left: "50%", width: `${absPercent / 2}%` }
            : { right: "50%", width: `${absPercent / 2}%` }
        }
      />
    </div>
  );
}

// 角色关系视图：展示所有角色关系，支持内联编辑和删除
function RelationshipsView() {
  const characters = useNarrativeStore((s) => s.characters);
  const relationships = useRelationshipStore((s) => s.relationships);
  const updateRelationship = useRelationshipStore((s) => s.updateRelationship);
  const removeRelationship = useRelationshipStore((s) => s.removeRelationship);

  // 正在编辑的关系 ID
  const [editingId, setEditingId] = useState<string | null>(null);
  // 编辑中的临时值
  const [editStrength, setEditStrength] = useState<number>(0);
  const [editType, setEditType] = useState<RelationshipType>("neutral");
  const [editDescription, setEditDescription] = useState<string>("");

  // 角色 ID → 名称映射
  const charNameMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of characters) m.set(c.id, c.name);
    return m;
  }, [characters]);

  // 开始编辑
  const startEdit = (id: string) => {
    const rel = relationships.find((r) => r.id === id);
    if (!rel) return;
    setEditingId(id);
    setEditStrength(rel.strength);
    setEditType(rel.type);
    setEditDescription(rel.description ?? "");
  };

  // 保存编辑
  const commitEdit = () => {
    if (!editingId) return;
    updateRelationship(editingId, {
      strength: editStrength,
      type: editType,
      description: editDescription.trim() || undefined,
    });
    setEditingId(null);
  };

  // 取消编辑
  const cancelEdit = () => {
    setEditingId(null);
  };

  // 空状态：无角色
  if (characters.length === 0) {
    return (
      <div className="flex h-full items-center justify-center bg-zinc-950 p-6">
        <div className="text-center">
          <Users className="mx-auto h-10 w-10 text-zinc-700" />
          <p className="mt-3 text-sm text-zinc-400">请先创建角色</p>
          <p className="mt-1 text-xs text-zinc-600">角色关系需要至少两个角色</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-zinc-950 p-4">
      <div className="mx-auto max-w-3xl space-y-3">
        {/* 标题 */}
        <div className="flex items-center gap-2">
          <Heart className="h-4 w-4 text-orange-400" />
          <h3 className="text-sm font-medium text-zinc-100">角色关系</h3>
          <span className="text-xs text-zinc-500">({relationships.length})</span>
        </div>

        {/* 空状态：无关系 */}
        {relationships.length === 0 && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-8 text-center">
            <Users className="mx-auto h-8 w-8 text-zinc-700" />
            <p className="mt-3 text-sm text-zinc-400">暂无角色关系</p>
            <p className="mt-1 text-xs text-zinc-600">可通过对话让 AI 添加</p>
          </div>
        )}

        {/* 关系列表 */}
        {relationships.map((rel) => {
          const fromName = charNameMap.get(rel.fromCharacterId) ?? rel.fromCharacterId;
          const toName = charNameMap.get(rel.toCharacterId) ?? rel.toCharacterId;
          const isEditing = editingId === rel.id;

          return (
            <div
              key={rel.id}
              className={`rounded-lg border p-3 transition-colors ${
                isEditing ? "border-orange-500 bg-zinc-900" : "border-zinc-800 bg-zinc-900/40"
              }`}
            >
              {/* 关系头部：角色 A ↔ 角色 B + 类型 + 操作按钮 */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <span className="truncate text-sm font-medium text-zinc-100">{fromName}</span>
                  <span className="text-zinc-600">↔</span>
                  <span className="truncate text-sm font-medium text-zinc-100">{toName}</span>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {!isEditing ? (
                    <>
                      <span className="rounded bg-zinc-800 px-2 py-0.5 text-[11px] text-zinc-300">
                        {RELATIONSHIP_TYPE_LABELS[rel.type]}
                      </span>
                      <button
                        onClick={() => startEdit(rel.id)}
                        className="rounded-md p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
                        title="编辑关系"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => removeRelationship(rel.id)}
                        className="rounded-md p-1 text-zinc-500 hover:bg-red-950/50 hover:text-red-300"
                        title="删除关系"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </>
                  ) : null}
                </div>
              </div>

              {/* 查看模式：强度条 + 描述 */}
              {!isEditing && (
                <div className="mt-2 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-8 text-[11px] text-zinc-500">敌对</span>
                    <div className="flex-1">
                      <StrengthBar value={rel.strength} />
                    </div>
                    <span className="w-8 text-right text-[11px] text-zinc-500">友好</span>
                    <span
                      className={`w-10 text-right text-xs font-medium ${
                        rel.strength >= 0 ? "text-emerald-400" : "text-red-400"
                      }`}
                    >
                      {rel.strength > 0 ? "+" : ""}
                      {rel.strength}
                    </span>
                  </div>
                  {rel.description && (
                    <p className="text-[11px] text-zinc-500">{rel.description}</p>
                  )}
                </div>
              )}

              {/* 编辑模式：内联编辑强度、类型、描述 */}
              {isEditing && (
                <div className="mt-3 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Field label="关系类型">
                      <select
                        value={editType}
                        onChange={(e) => setEditType(e.target.value as RelationshipType)}
                        className="input"
                      >
                        {(Object.entries(RELATIONSHIP_TYPE_LABELS) as [RelationshipType, string][]).map(
                          ([v, l]) => (
                            <option key={v} value={v}>
                              {l}
                            </option>
                          )
                        )}
                      </select>
                    </Field>
                    <Field label={`强度（${editStrength}）`}>
                      <input
                        type="range"
                        min={-100}
                        max={100}
                        value={editStrength}
                        onChange={(e) => setEditStrength(Number(e.target.value))}
                        className="w-full accent-orange-500"
                      />
                    </Field>
                  </div>
                  <Field label="关系描述">
                    <input
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      placeholder="可选，描述这段关系"
                      className="input"
                    />
                  </Field>
                  <div className="flex justify-end gap-1.5">
                    <button
                      onClick={cancelEdit}
                      className="flex items-center gap-1 rounded-md bg-zinc-800 px-2.5 py-1 text-xs text-zinc-300 hover:bg-zinc-700"
                    >
                      <X className="h-3 w-3" /> 取消
                    </button>
                    <button
                      onClick={commitEdit}
                      className="flex items-center gap-1 rounded-md bg-orange-500 px-2.5 py-1 text-xs text-white hover:bg-orange-400"
                    >
                      <Check className="h-3 w-3" /> 保存
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// 道德阵营九宫格：3x3 网格，高亮当前位置
function AlignmentGrid({ lawChaos, goodEvil }: { lawChaos: number; goodEvil: number }) {
  const currentAlignment = computeAlignment(lawChaos, goodEvil);

  // 九宫格布局：行=善良→邪恶（上到下），列=守序→混乱（左到右）
  const grid: { alignment: MoralAlignment; label: string }[][] = [
    [
      { alignment: "lawful_good", label: "守序善良" },
      { alignment: "neutral_good", label: "中立善良" },
      { alignment: "chaotic_good", label: "混乱善良" },
    ],
    [
      { alignment: "lawful_neutral", label: "守序中立" },
      { alignment: "true_neutral", label: "绝对中立" },
      { alignment: "chaotic_neutral", label: "混乱中立" },
    ],
    [
      { alignment: "lawful_evil", label: "守序邪恶" },
      { alignment: "neutral_evil", label: "中立邪恶" },
      { alignment: "chaotic_evil", label: "混乱邪恶" },
    ],
  ];

  return (
    <div className="grid grid-cols-3 gap-1.5">
      {grid.map((row, rowIdx) =>
        row.map((cell, colIdx) => {
          const isCurrent = cell.alignment === currentAlignment;
          // 根据善良/邪恶行着色
          const rowColor =
            rowIdx === 0
              ? "border-emerald-800/50"
              : rowIdx === 2
              ? "border-red-800/50"
              : "border-zinc-800";
          return (
            <div
              key={`${rowIdx}-${colIdx}`}
              className={`rounded-md border p-2 text-center transition-all ${
                isCurrent
                  ? "border-orange-500 bg-orange-500/20 ring-1 ring-orange-500"
                  : `${rowColor} bg-zinc-900/40`
              }`}
            >
              <p
                className={`text-[11px] font-medium ${
                  isCurrent ? "text-orange-200" : "text-zinc-400"
                }`}
              >
                {cell.label}
              </p>
            </div>
          );
        })
      )}
    </div>
  );
}

// 道德轴进度条：显示 -100 到 100 的值，带两端标签
function MoralAxisBar({
  value,
  leftLabel,
  rightLabel,
  leftColor,
  rightColor,
}: {
  value: number;
  leftLabel: string;
  rightLabel: string;
  leftColor: string;
  rightColor: string;
}) {
  // 计算填充：以中线为基准，负数向左，正数向右
  const absPercent = Math.min(100, Math.abs(value));
  const isPositive = value >= 0;
  return (
    <div>
      <div className="mb-1 flex justify-between text-[11px] text-zinc-500">
        <span className={leftColor}>{leftLabel}</span>
        <span className="text-zinc-300">{value > 0 ? "+" : ""}{value}</span>
        <span className={rightColor}>{rightLabel}</span>
      </div>
      <div className="relative h-3 rounded-full bg-zinc-800">
        <div className="absolute left-1/2 top-0 h-full w-px bg-zinc-600" />
        <div
          className={`absolute top-0 h-full rounded-full ${isPositive ? rightColor.replace("text-", "bg-") : leftColor.replace("text-", "bg-")}`}
          style={
            isPositive
              ? { left: "50%", width: `${absPercent / 2}%` }
              : { right: "50%", width: `${absPercent / 2}%` }
          }
        />
      </div>
    </div>
  );
}

// 道德视图：阵营九宫格 + 两轴进度条 + 行为历史
function MoralView() {
  const lawChaos = useMoralStore((s) => s.lawChaos);
  const goodEvil = useMoralStore((s) => s.goodEvil);
  const history = useMoralStore((s) => s.history);
  const reset = useMoralStore((s) => s.reset);

  const alignment = computeAlignment(lawChaos, goodEvil);

  // 最近 20 条历史（倒序，最新在前）
  const recentHistory = useMemo(() => {
    return [...history].slice(-20).reverse();
  }, [history]);

  // 格式化时间
  const formatTime = (iso: string) => {
    try {
      const d = new Date(iso);
      const h = String(d.getHours()).padStart(2, "0");
      const m = String(d.getMinutes()).padStart(2, "0");
      return `${h}:${m}`;
    } catch {
      return "";
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-zinc-950 p-4">
      <div className="mx-auto max-w-3xl space-y-4">
        {/* 标题 + 重置按钮 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale className="h-4 w-4 text-orange-400" />
            <h3 className="text-sm font-medium text-zinc-100">道德阵营</h3>
          </div>
          <button
            onClick={reset}
            className="flex items-center gap-1 rounded-md bg-zinc-900 px-2.5 py-1 text-xs text-zinc-400 border border-zinc-800 hover:bg-zinc-800 hover:text-zinc-200"
            title="重置道德状态"
          >
            <RotateCcw className="h-3 w-3" /> 重置
          </button>
        </div>

        {/* 当前阵营 + 九宫格 */}
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[11px] text-zinc-500">当前阵营</span>
            <span className="rounded bg-orange-500/20 px-2 py-0.5 text-sm font-medium text-orange-300 ring-1 ring-orange-500/40">
              {ALIGNMENT_LABELS[alignment]}
            </span>
          </div>
          <AlignmentGrid lawChaos={lawChaos} goodEvil={goodEvil} />
        </section>

        {/* 两轴进度条 */}
        <section className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
          <h4 className="text-[11px] font-medium text-zinc-400">道德倾向</h4>
          <MoralAxisBar
            value={lawChaos}
            leftLabel="守序"
            rightLabel="混乱"
            leftColor="text-blue-400"
            rightColor="text-amber-400"
          />
          <MoralAxisBar
            value={goodEvil}
            leftLabel="善良"
            rightLabel="邪恶"
            leftColor="text-emerald-400"
            rightColor="text-red-400"
          />
        </section>

        {/* 行为历史 */}
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
          <h4 className="mb-3 flex items-center gap-1.5 text-[11px] font-medium text-zinc-400">
            <CheckCircle2 className="h-3 w-3 text-orange-400" /> 行为历史（最近 {Math.min(20, history.length)} 条）
          </h4>
          {recentHistory.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <Scale className="h-6 w-6 text-zinc-700" />
              <p className="text-xs text-zinc-500">暂无道德行为记录</p>
              <p className="text-[11px] leading-relaxed text-zinc-600">当玩家在互动中做出道德选择后，行为记录将出现在这里</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {recentHistory.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-start gap-2 rounded-md bg-zinc-900/60 p-2"
                >
                  <span className="mt-0.5 shrink-0 text-[10px] text-zinc-600">
                    {formatTime(entry.timestamp)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs text-zinc-200">{entry.action}</p>
                    <div className="mt-0.5 flex gap-2 text-[10px]">
                      {entry.lawChaosDelta !== 0 && (
                        <span
                          className={
                            entry.lawChaosDelta > 0 ? "text-amber-400" : "text-blue-400"
                          }
                        >
                          混乱 {entry.lawChaosDelta > 0 ? "+" : ""}
                          {entry.lawChaosDelta}
                        </span>
                      )}
                      {entry.goodEvilDelta !== 0 && (
                        <span
                          className={
                            entry.goodEvilDelta > 0 ? "text-red-400" : "text-emerald-400"
                          }
                        >
                          邪恶 {entry.goodEvilDelta > 0 ? "+" : ""}
                          {entry.goodEvilDelta}
                        </span>
                      )}
                      {entry.nodeId && (
                        <span className="text-zinc-600">节点: {entry.nodeId}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

// ─── 旧 Screen 嵌入包装器 ──────────────────────────────────
// 将旧 Screen 组件嵌入新 Studio 画布，提供滚动容器
// 并拦截内部 <Link to="/xxx"> 点击，转为 Studio tab 切换（避免跳出 /studio 路由）

/** 旧路由 → 新 Studio tab 映射（仅保留 8 阶段工作流中有效的 tab） */
const ROUTE_TO_TAB: Record<string, ViewTab> = {
  "/script": "script",
  "/nodes": "graph",
  "/interaction": "interaction",
  "/simulator": "preview",
  "/cinematic": "cinematic",
  "/publish": "publish",
  "/assets": "assets",
  "/": "preview",
};

// 创作起点引导视图：导入 or 从零开始（对话驱动，不直接暴露专业界面）
function EntryView() {
  const [showImport, setShowImport] = useState(false);
  const addMessage = useCanvasAgentStore((s) => s.addMessage);
  const setEntryPath = usePipelineStore((s) => s.setEntryPath);

  const handleStartFromScratch = () => {
    setEntryPath("conversation");
    addMessage({
      role: "assistant",
      content: `太好了！告诉我你的创意想法吧——哪怕只是一句话也行。

比如：
- "一个侦探在调查案件时发现凶手是自己"
- "末日生存，玩家要决定救谁"
- "校园恋爱，根据选择走到不同结局"

我会帮你把想法扩展成完整的故事大纲。`,
      expertRole: usePipelineStore.getState().getActiveExpert()?.role,
      expertAvatar: usePipelineStore.getState().getActiveExpert()?.avatar,
    });
    // 聚焦左侧对话输入框，引导用户下一步
    setTimeout(() => {
      document.getElementById("studio-chat-input")?.focus();
    }, 200);
  };

  return (
    <div className="flex h-full items-center justify-center bg-zinc-950 p-6">
      <div className="w-full max-w-2xl">
        <div className="mb-8 text-center">
          <h2 className="mb-2 text-xl font-semibold text-zinc-100">开始你的互动影游创作</h2>
          <p className="text-sm text-zinc-500">选择一种方式开始，后续每一步我都会引导你</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* 导入已有剧本 */}
          <button
            onClick={() => setShowImport(true)}
            className="group flex flex-col items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 transition hover:border-orange-500 hover:bg-zinc-900"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-500/10 text-orange-400 transition group-hover:bg-orange-500/20">
              <Upload className="h-6 w-6" />
            </div>
            <div className="text-center">
              <p className="mb-1 text-sm font-medium text-zinc-100">导入已有剧本</p>
              <p className="text-xs text-zinc-500">上传剧本/小说文件，自动解析为互动结构</p>
              <p className="mt-1 text-[11px] text-zinc-600">支持 .txt / .md / .dfstory</p>
            </div>
          </button>

          {/* 从零开始创作 */}
          <button
            onClick={handleStartFromScratch}
            className="group flex flex-col items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 transition hover:border-emerald-600 hover:bg-zinc-900"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600/10 text-emerald-400 transition group-hover:bg-emerald-600/20">
              <Sparkles className="h-6 w-6" />
            </div>
            <div className="text-center">
              <p className="mb-1 text-sm font-medium text-zinc-100">从零开始创作</p>
              <p className="text-xs text-zinc-500">告诉我你的创意想法，我帮你扩展成故事</p>
              <p className="mt-1 text-[11px] text-zinc-600">在左侧对话框输入你的点子</p>
            </div>
          </button>
        </div>

        {/* 专业模式入口（轻量，不遮挡） */}
        <div className="mt-6 text-center">
          <button
            onClick={() => {
              // 切换到 script tab（专业剧本编辑器），供高级用户使用
              const event = new CustomEvent("studio-switch-tab", { detail: "script" });
              window.dispatchEvent(event);
            }}
            className="inline-flex items-center gap-1.5 text-xs text-zinc-600 transition hover:text-zinc-400"
          >
            <FileText className="h-3 w-3" />
            高级模式：剧本分层编辑器（章节/原始文本/线性/互动/可运行）
          </button>
        </div>
      </div>

      {/* 导入面板 */}
      {showImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="relative max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-950">
            <button
              onClick={() => setShowImport(false)}
              className="absolute right-3 top-3 z-10 rounded-md p-1 text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300"
            >
              <X className="h-4 w-4" />
            </button>
            <ImportPanel
              onClose={() => setShowImport(false)}
              onImported={() => {
                setEntryPath("import");
                const store = useNarrativeStore.getState();
                if (store.storyNodes.length > 0) {
                  addMessage({
                    role: "assistant",
                    content: `导入完成！已解析出 ${store.storyNodes.length} 个节点、${store.characters.length} 个角色。\n\n你可以让我基于这些节点总结故事大纲，或直接输入"下一阶段"进入叙事构建。`,
                    expertRole: usePipelineStore.getState().getActiveExpert()?.role,
                    expertAvatar: usePipelineStore.getState().getActiveExpert()?.avatar,
                  });
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// QA 质量校验视图：一致性检查 + 路径测试结果可视化
function QAView() {
  const storyNodes = useNarrativeStore((s) => s.storyNodes);
  const nodeEdges = useNarrativeStore((s) => s.nodeEdges);
  const characters = useNarrativeStore((s) => s.characters);
  const props = useNarrativeStore((s) => s.props);
  const variables = useNarrativeStore((s) => s.variables);
  const narrativeIntents = useNarrativeStore((s) => s.narrativeIntents);
  const setStageOutput = usePipelineStore((s) => s.setStageOutput);

  const [consistencyIssues, setConsistencyIssues] = useState<ConsistencyIssue[]>([]);
  const [pathResult, setPathResult] = useState<PathTestOutput | null>(null);
  const [checking, setChecking] = useState(false);

  const runAllChecks = useCallback(() => {
    setChecking(true);
    try {
      const issues = runConsistencyChecks({
        storyNodes,
        nodeEdges,
        characters,
        props,
        variables,
        narrativeIntents,
      });
      setConsistencyIssues(issues);
      const path = runPathTest(storyNodes, nodeEdges);
      setPathResult(path);
      // 同步 QA 报告到 pipeline context
      const errors = issues.filter((i) => i.severity === "error").length;
      const warnings = issues.filter((i) => i.severity === "warning").length;
      setStageOutput("qaReport", {
        errors,
        warnings,
        summary: `一致性检查：${errors} 错误, ${warnings} 警告；路径测试：${path.deadEnds.length} 死路, ${path.unreachableNodes.length} 不可达`,
      });
    } finally {
      setChecking(false);
    }
  }, [storyNodes, nodeEdges, characters, props, variables, narrativeIntents, setStageOutput]);

  // 首次进入自动检查
  useEffect(() => {
    runAllChecks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const errors = consistencyIssues.filter((i) => i.severity === "error");
  const warnings = consistencyIssues.filter((i) => i.severity === "warning");
  const infos = consistencyIssues.filter((i) => i.severity === "info");

  return (
    <div className="h-full overflow-y-auto bg-zinc-950 p-5">
      <div className="mx-auto max-w-3xl">
        {/* 标题 + 重新检查 */}
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-base font-semibold text-zinc-100">
              <CheckCircle2 className="h-4 w-4 text-orange-400" />
              质量校验报告
            </h2>
            <p className="mt-1 text-xs text-zinc-500">自动检查故事逻辑、路径可达性、数据一致性</p>
          </div>
          <button
            onClick={runAllChecks}
            disabled={checking}
            className="flex items-center gap-1.5 rounded-md bg-orange-500 px-3 py-1.5 text-xs text-white hover:bg-orange-400 disabled:opacity-50"
          >
            {checking ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />}
            重新检查
          </button>
        </div>

        {/* 概览卡片 */}
        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3">
            <p className="text-2xl font-bold text-red-400">{errors.length}</p>
            <p className="text-xs text-zinc-500">严重错误</p>
          </div>
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
            <p className="text-2xl font-bold text-amber-400">{warnings.length}</p>
            <p className="text-xs text-zinc-500">警告</p>
          </div>
          <div className="rounded-lg border border-zinc-700 bg-zinc-900/50 p-3">
            <p className="text-2xl font-bold text-zinc-300">{pathResult?.deadEnds.length ?? 0}</p>
            <p className="text-xs text-zinc-500">死路节点</p>
          </div>
          <div className="rounded-lg border border-zinc-700 bg-zinc-900/50 p-3">
            <p className="text-2xl font-bold text-zinc-300">{pathResult?.unreachableNodes.length ?? 0}</p>
            <p className="text-xs text-zinc-500">不可达节点</p>
          </div>
        </div>

        {/* 路径测试结果 */}
        {pathResult && (
          <div className="mb-5 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
            <h3 className="mb-3 flex items-center gap-1.5 text-sm font-medium text-zinc-200">
              <Route className="h-3.5 w-3.5 text-orange-400" />
              路径分析
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
              <div>
                <p className="text-zinc-500">总路径</p>
                <p className="text-lg font-semibold text-zinc-200">{pathResult.stats.totalPaths}</p>
              </div>
              <div>
                <p className="text-zinc-500">好结局</p>
                <p className="text-lg font-semibold text-emerald-400">{pathResult.stats.goodEndings}</p>
              </div>
              <div>
                <p className="text-zinc-500">坏结局</p>
                <p className="text-lg font-semibold text-red-400">{pathResult.stats.badEndings}</p>
              </div>
              <div>
                <p className="text-zinc-500">循环节点</p>
                <p className="text-lg font-semibold text-amber-400">{pathResult.cycles?.length ?? 0}</p>
              </div>
            </div>
          </div>
        )}

        {/* 问题列表 */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-zinc-200">问题详情</h3>
          {consistencyIssues.length === 0 && (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              未发现问题，结构完整！可以进入下一阶段。
            </div>
          )}
          {consistencyIssues.map((issue, i) => (
            <div
              key={i}
              className={`rounded-lg border p-3 ${
                issue.severity === "error"
                  ? "border-red-500/30 bg-red-500/5"
                  : issue.severity === "warning"
                  ? "border-amber-500/30 bg-amber-500/5"
                  : "border-zinc-700 bg-zinc-900/50"
              }`}
            >
              <div className="flex items-start gap-2">
                <AlertTriangle
                  className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${
                    issue.severity === "error" ? "text-red-400" : issue.severity === "warning" ? "text-amber-400" : "text-zinc-400"
                  }`}
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-zinc-200">{issue.title}</p>
                  {issue.suggestion && <p className="mt-1 text-xs text-zinc-500">{issue.suggestion}</p>}
                </div>
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                    issue.severity === "error"
                      ? "bg-red-950 text-red-400"
                      : issue.severity === "warning"
                      ? "bg-amber-950 text-amber-400"
                      : "bg-zinc-800 text-zinc-400"
                  }`}
                >
                  {issue.severity === "error" ? "错误" : issue.severity === "warning" ? "警告" : "信息"}
                </span>
              </div>
            </div>
          ))}
        </div>

        {infos.length > 0 && (
          <p className="mt-4 text-center text-xs text-zinc-600">
            另有 {infos.length} 条信息级提示
          </p>
        )}
      </div>
    </div>
  );
}

// 发布导出视图：Checklist + 导出预览 + 版本归档 + 分享入口
function ReleaseView() {
  const storyNodes = useNarrativeStore((s) => s.storyNodes);
  const characters = useNarrativeStore((s) => s.characters);
  const scenes = useNarrativeStore((s) => s.scenes);
  const context = usePipelineStore((s) => s.context);
  const createSnapshot = useVersionStore((s) => s.createSnapshot);
  const runExport = useExportStore((s) => s.runExport);
  const formats = useExportStore((s) => s.formats);

  const [selectedFormat, setSelectedFormat] = useState<string>("json");
  const [exporting, setExporting] = useState(false);
  const [exportResult, setExportResult] = useState<{ fileName: string; content: string } | null>(null);
  const [versionArchived, setVersionArchived] = useState(false);

  // 发布前 Checklist（基于各阶段产出）
  const checklist = [
    { label: "故事大纲", done: !!context.storyOutline, stage: "entry" },
    { label: "角色设定", done: (context.characters?.length ?? 0) > 0, stage: "narrative" },
    { label: "场景设定", done: (context.scenes?.length ?? 0) > 0, stage: "narrative" },
    { label: "剧本", done: !!context.script, stage: "narrative" },
    { label: "互动节点图", done: (context.nodeGraph?.nodeCount ?? 0) > 0, stage: "interaction" },
    { label: "结局设计", done: (context.endings?.length ?? 0) > 0, stage: "interaction" },
    { label: "质量校验", done: !!context.qaReport && context.qaReport.errors === 0, stage: "qa" },
  ];
  const completedCount = checklist.filter((c) => c.done).length;
  const allDone = completedCount === checklist.length;

  // 导出预览数据
  const endings = storyNodes.filter((n) => n.type.startsWith("ending"));
  const goodEndings = endings.filter((n) => n.type === "ending_good").length;
  const badEndings = endings.filter((n) => n.type === "ending_bad").length;

  const handleExport = async () => {
    setExporting(true);
    try {
      const result = await runExport(selectedFormat as never, {});
      setExportResult({
        fileName: result.fileName ?? `export-${selectedFormat}-${Date.now()}.dat`,
        content: result.content ?? "",
      });
      // 导出时自动创建版本快照
      createSnapshot(
        `发布快照 ${new Date().toLocaleString("zh-CN")}`,
        "milestone",
        `导出格式: ${selectedFormat}，节点 ${storyNodes.length}，角色 ${characters.length}`,
        ["release", selectedFormat],
      );
      setVersionArchived(true);
    } catch (err) {
      setExportResult({
        fileName: "导出失败",
        content: `错误: ${err instanceof Error ? err.message : String(err)}`,
      });
    } finally {
      setExporting(false);
    }
  };

  const handleDownload = () => {
    if (!exportResult) return;
    const blob = new Blob([exportResult.content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = exportResult.fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full overflow-y-auto bg-zinc-950 p-5">
      <div className="mx-auto max-w-3xl space-y-5">
        <div>
          <h2 className="flex items-center gap-2 text-base font-semibold text-zinc-100">
            <Package className="h-4 w-4 text-orange-400" />
            发布导出
          </h2>
          <p className="mt-1 text-xs text-zinc-500">完成最终检查、选择格式、导出项目文件</p>
        </div>

        {/* 发布前 Checklist */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-medium text-zinc-200">发布前检查清单</h3>
            <span className={`text-xs ${allDone ? "text-emerald-400" : "text-amber-400"}`}>
              {completedCount}/{checklist.length} 已完成
            </span>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {checklist.map((item) => (
              <div key={item.label} className="flex items-center gap-2 text-xs">
                {item.done ? (
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                ) : (
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                )}
                <span className={item.done ? "text-zinc-300" : "text-zinc-500"}>{item.label}</span>
                {!item.done && (
                  <button
                    onClick={() => {
                      const event = new CustomEvent("studio-switch-tab", {
                        detail: item.stage === "entry" ? "entry" : item.stage === "narrative" ? "characters" : item.stage === "interaction" ? "graph" : item.stage === "qa" ? "qa" : "script",
                      });
                      window.dispatchEvent(event);
                    }}
                    className="ml-auto text-[11px] text-orange-400 hover:text-orange-300"
                  >
                    去完成
                  </button>
                )}
              </div>
            ))}
          </div>
          {!allDone && (
            <p className="mt-3 rounded-md bg-amber-500/10 px-3 py-2 text-[11px] text-amber-400">
              ⚠️ 部分项目未完成，建议先补全再发布。你也可以强制导出当前状态。
            </p>
          )}
        </div>

        {/* 导出预览 */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
          <h3 className="mb-3 text-sm font-medium text-zinc-200">项目概览（导出预览）</h3>
          <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
            <div className="rounded-md bg-zinc-950/50 p-2.5">
              <p className="text-zinc-500">节点</p>
              <p className="text-lg font-semibold text-zinc-200">{storyNodes.length}</p>
            </div>
            <div className="rounded-md bg-zinc-950/50 p-2.5">
              <p className="text-zinc-500">角色</p>
              <p className="text-lg font-semibold text-zinc-200">{characters.length}</p>
            </div>
            <div className="rounded-md bg-zinc-950/50 p-2.5">
              <p className="text-zinc-500">场景</p>
              <p className="text-lg font-semibold text-zinc-200">{scenes?.length ?? 0}</p>
            </div>
            <div className="rounded-md bg-zinc-950/50 p-2.5">
              <p className="text-zinc-500">结局</p>
              <p className="text-lg font-semibold text-zinc-200">
                {endings.length}
                <span className="ml-1 text-[10px] text-emerald-400">好{goodEndings}</span>
                <span className="ml-1 text-[10px] text-red-400">坏{badEndings}</span>
              </p>
            </div>
          </div>
        </div>

        {/* 导出格式选择 */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
          <h3 className="mb-3 text-sm font-medium text-zinc-200">选择导出格式</h3>
          <div className="space-y-2">
            {formats.slice(0, 4).map((fmt) => (
              <button
                key={fmt.id}
                onClick={() => setSelectedFormat(fmt.id)}
                className={`flex w-full items-start gap-3 rounded-md border p-3 text-left transition ${
                  selectedFormat === fmt.id
                    ? "border-orange-500 bg-orange-500/10"
                    : "border-zinc-800 bg-zinc-950/50 hover:border-zinc-700"
                }`}
              >
                <div
                  className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                    selectedFormat === fmt.id ? "border-orange-500 bg-orange-500" : "border-zinc-600"
                  }`}
                >
                  {selectedFormat === fmt.id && <Check className="h-2.5 w-2.5 text-white" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-zinc-200">{fmt.name}</p>
                  <p className="mt-0.5 text-[11px] text-zinc-500">
                    {fmt.id === "json" && "结构化数据格式，适合开发者二次开发或导入其他工具"}
                    {fmt.id === "html5" && "可直接在浏览器中运行，分享链接即可游玩"}
                    {fmt.id === "unity" && "Unity 引擎适配格式，适合集成到 Unity 项目"}
                    {fmt.id === "twine" && "Twine 互动小说格式，适合导入 Twine 编辑器"}
                    {!["json", "html5", "unity", "twine"].includes(fmt.id) && fmt.description}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 导出操作 + 版本归档 */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex flex-1 items-center justify-center gap-2 rounded-md bg-orange-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-orange-400 disabled:opacity-50"
          >
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Package className="h-4 w-4" />}
            {exporting ? "导出中…" : "导出项目"}
          </button>
          {versionArchived && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
              已自动创建版本快照
            </div>
          )}
        </div>

        {/* 导出结果 + 分享入口 */}
        {exportResult && (
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
            <h3 className="mb-3 flex items-center gap-1.5 text-sm font-medium text-zinc-200">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              导出完成
            </h3>
            <p className="mb-3 text-xs text-zinc-400">文件名：{exportResult.fileName}</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 rounded-md bg-zinc-800 px-3 py-1.5 text-xs text-zinc-200 hover:bg-zinc-700"
              >
                <FolderOpen className="h-3 w-3" /> 下载文件
              </button>
              <button
                onClick={() => {
                  const event = new CustomEvent("studio-switch-tab", { detail: "preview" });
                  window.dispatchEvent(event);
                }}
                className="flex items-center gap-1.5 rounded-md bg-zinc-800 px-3 py-1.5 text-xs text-zinc-200 hover:bg-zinc-700"
              >
                <Play className="h-3 w-3" /> 预览试玩
              </button>
              <button
                onClick={() => {
                  const event = new CustomEvent("studio-open-manage", { detail: "versions" });
                  window.dispatchEvent(event);
                }}
                className="flex items-center gap-1.5 rounded-md bg-zinc-800 px-3 py-1.5 text-xs text-zinc-200 hover:bg-zinc-700"
              >
                <Save className="h-3 w-3" /> 查看版本历史
              </button>
            </div>
            {selectedFormat === "html5" && (
              <p className="mt-3 rounded-md bg-orange-500/10 px-3 py-2 text-[11px] text-orange-300">
                💡 HTML5 格式：下载后用浏览器打开即可游玩，也可上传到任意静态网站托管服务分享给他人。
              </p>
            )}
            {selectedFormat === "json" && (
              <p className="mt-3 rounded-md bg-orange-500/10 px-3 py-2 text-[11px] text-orange-300">
                💡 JSON 格式：适合开发者二次开发。可用任何编程语言解析，集成到游戏引擎或 Web 应用中。
              </p>
            )}
          </div>
        )}

        {/* 高级模式入口 */}
        <div className="text-center">
          <button
            onClick={() => {
              const event = new CustomEvent("studio-switch-tab", { detail: "publish" });
              window.dispatchEvent(event);
            }}
            className="inline-flex items-center gap-1.5 text-xs text-zinc-600 transition hover:text-zinc-400"
          >
            <FileText className="h-3 w-3" />
            高级模式：完整发布配置面板（发布设置 / 发布检查 / 导出配置）
          </button>
        </div>
      </div>
    </div>
  );
}

function ScreenEmbedView({
  children,
  onTabChange,
}: {
  children: ReactNode;
  onTabChange?: (tab: ViewTab) => void;
}) {
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!onTabChange) return;
      // 找到最近的 <a> 元素
      const target = e.target as HTMLElement;
      const anchor = target.closest("a") as HTMLAnchorElement | null;
      if (!anchor) return;
      // 读取 href（TanStack Router 的 <Link to="/xxx"> 会渲染为 <a href="/xxx">）
      const rawHref = anchor.getAttribute("href");
      if (!rawHref) return;
      // 只拦截内部路由（以 / 开头，非外部 URL）
      if (!rawHref.startsWith("/") || rawHref.startsWith("//")) return;
      // 标准化路径：取第一段，去掉 query/hash
      const path = rawHref.split("?")[0].split("#")[0];
      // 精确匹配 / 完整路径匹配 / 前缀匹配（取最长匹配）
      let matchedTab: ViewTab | undefined;
      if (ROUTE_TO_TAB[path]) {
        matchedTab = ROUTE_TO_TAB[path];
      } else {
        // 尝试前缀匹配（如 /nodes/123 → /nodes）
        const segments = path.split("/").filter(Boolean);
        if (segments.length > 0) {
          const prefix = `/${segments[0]}`;
          if (ROUTE_TO_TAB[prefix]) {
            matchedTab = ROUTE_TO_TAB[prefix];
          }
        }
      }
      if (matchedTab) {
        e.preventDefault();
        e.stopPropagation();
        onTabChange(matchedTab);
      }
      // 未匹配的内部路由放行（让浏览器/TanStack Router 处理）
    },
    [onTabChange]
  );

  return (
    <div
      className="h-full overflow-auto bg-zinc-950 text-zinc-200 studio-dark-embed [&_.bg-white]:bg-zinc-900 [&_.bg-gray-50]:bg-zinc-900 [&_.bg-gray-100]:bg-zinc-900 [&_.text-gray-900]:text-zinc-100 [&_.text-gray-800]:text-zinc-200 [&_.text-gray-700]:text-zinc-300 [&_.text-gray-600]:text-zinc-400 [&_.text-gray-500]:text-zinc-500 [&_.border-gray-200]:border-zinc-800 [&_.border-gray-300]:border-zinc-700"
      onClickCapture={handleClick}
    >
      {children}
    </div>
  );
}

// ─── 道具视图 ──────────────────────────────────────────────
function PropsView() {
  const props = useNarrativeStore((s) => s.props);
  const addProp = useNarrativeStore((s) => s.addProp);
  const updateProp = useNarrativeStore((s) => s.updateProp);
  const removeProp = useNarrativeStore((s) => s.removeProp);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProp, setNewProp] = useState({ name: "", type: "key_item" as const, description: "", gameplayEffect: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editProp, setEditProp] = useState({ name: "", type: "key_item" as const, description: "", gameplayEffect: "" });
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const PROP_TYPE_LABELS: Record<string, string> = {
    key_item: "关键道具", tool: "工具", weapon: "武器", consumable: "消耗品",
  };

  const startEdit = (prop: typeof props[0]) => {
    setEditingId(prop.id);
    setEditProp({ name: prop.name, type: prop.type, description: prop.description, gameplayEffect: prop.gameplayEffect });
  };

  const confirmEdit = () => {
    if (!editingId || !editProp.name.trim()) return;
    updateProp(editingId, editProp);
    setEditingId(null);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    removeProp(deleteTarget.id);
    setDeleteTarget(null);
  };

  return (
    <div className="h-full overflow-auto bg-zinc-950 p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">道具管理</h2>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-orange-400"
          >
            <Plus size={14} /> 添加道具
          </button>
        </div>

        {showAddForm && (
          <div className="mb-4 rounded-lg border border-zinc-800 bg-zinc-900 p-4">
            <input
              value={newProp.name}
              onChange={(e) => setNewProp({ ...newProp, name: e.target.value })}
              placeholder="道具名称"
              className="mb-2 w-full rounded-md bg-zinc-800 px-3 py-2 text-sm text-white outline-none"
            />
            <select
              value={newProp.type}
              onChange={(e) => setNewProp({ ...newProp, type: e.target.value as any })}
              className="mb-2 w-full rounded-md bg-zinc-800 px-3 py-2 text-sm text-white outline-none"
            >
              {Object.entries(PROP_TYPE_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
            <input
              value={newProp.description}
              onChange={(e) => setNewProp({ ...newProp, description: e.target.value })}
              placeholder="道具描述"
              className="mb-2 w-full rounded-md bg-zinc-800 px-3 py-2 text-sm text-white outline-none"
            />
            <input
              value={newProp.gameplayEffect}
              onChange={(e) => setNewProp({ ...newProp, gameplayEffect: e.target.value })}
              placeholder="玩法效果"
              className="mb-3 w-full rounded-md bg-zinc-800 px-3 py-2 text-sm text-white outline-none"
            />
            <button
              onClick={() => {
                if (!newProp.name.trim()) return;
                addProp({
                  id: `PROP${Date.now().toString().slice(-4)}`,
                  ...newProp,
                  refNodes: [],
                  hasImage: false,
                });
                setNewProp({ name: "", type: "key_item", description: "", gameplayEffect: "" });
                setShowAddForm(false);
              }}
              className="rounded-md bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-500"
            >
              确认添加
            </button>
          </div>
        )}

        {props.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 text-center">
            <Package className="h-8 w-8 text-zinc-600" />
            <p className="text-sm text-zinc-500">暂无道具</p>
            <p className="text-xs text-zinc-700">通过对话让 AI 创建，或点击上方"添加道具"</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {props.map((prop) => (
              <div key={prop.id} className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
                {editingId === prop.id ? (
                  <div className="space-y-2">
                    <input
                      value={editProp.name}
                      onChange={(e) => setEditProp({ ...editProp, name: e.target.value })}
                      placeholder="道具名称"
                      className="w-full rounded-md bg-zinc-800 px-3 py-2 text-sm text-white outline-none"
                    />
                    <select
                      value={editProp.type}
                      onChange={(e) => setEditProp({ ...editProp, type: e.target.value as any })}
                      className="w-full rounded-md bg-zinc-800 px-3 py-2 text-sm text-white outline-none"
                    >
                      {Object.entries(PROP_TYPE_LABELS).map(([v, l]) => (
                        <option key={v} value={v}>{l}</option>
                      ))}
                    </select>
                    <input
                      value={editProp.description}
                      onChange={(e) => setEditProp({ ...editProp, description: e.target.value })}
                      placeholder="道具描述"
                      className="w-full rounded-md bg-zinc-800 px-3 py-2 text-sm text-white outline-none"
                    />
                    <input
                      value={editProp.gameplayEffect}
                      onChange={(e) => setEditProp({ ...editProp, gameplayEffect: e.target.value })}
                      placeholder="玩法效果"
                      className="w-full rounded-md bg-zinc-800 px-3 py-2 text-sm text-white outline-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={confirmEdit}
                        className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-500"
                      >
                        保存
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="rounded-md bg-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-600"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-white">{prop.name}</h3>
                        <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
                          {PROP_TYPE_LABELS[prop.type] ?? prop.type}
                        </span>
                      </div>
                      {prop.description && (
                        <p className="mt-1 text-xs text-zinc-400">{prop.description}</p>
                      )}
                      {prop.gameplayEffect && (
                        <p className="mt-1 text-xs text-orange-400">玩法：{prop.gameplayEffect}</p>
                      )}
                      {prop.refNodes.length > 0 && (
                        <p className="mt-1 text-xs text-zinc-500">关联节点：{prop.refNodes.length} 个</p>
                      )}
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button
                        onClick={() => startEdit(prop)}
                        className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                        title="编辑"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget({ id: prop.id, name: prop.name })}
                        className="rounded-md p-1.5 text-zinc-400 hover:bg-red-900/40 hover:text-red-400"
                        title="删除"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 删除确认对话框 */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70" onClick={() => setDeleteTarget(null)}>
          <div
            className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-950 p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center gap-1.5 text-sm font-medium text-zinc-100">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              确认删除道具
            </div>
            <div className="mb-4 rounded-md border border-zinc-800 bg-zinc-900/50 p-3">
              <div className="text-xs text-zinc-500">即将删除道具：</div>
              <div className="mt-1 text-sm font-medium text-zinc-100">{deleteTarget.name}</div>
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="rounded-md border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800"
              >
                取消
              </button>
              <button
                onClick={confirmDelete}
                className="flex items-center gap-1.5 rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-500"
              >
                <Trash2 className="h-3 w-3" /> 确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── 画布顶部阶段状态条（常驻单行，非折叠） ──────────────────
function CanvasStageBar() {
  const currentStage = usePipelineStore((s) => s.currentStage);
  const stageDef = STAGE_DEFS.find((s) => s.id === currentStage)!;

  // 各阶段产出计数（从真实 store 读取）
  const characters = useNarrativeStore((s) => s.characters);
  const scenes = useNarrativeStore((s) => s.scenes);
  const props = useNarrativeStore((s) => s.props);
  const storyNodes = useNarrativeStore((s) => s.storyNodes);
  const cinematicDirections = useNarrativeStore((s) => s.cinematicDirections);
  const context = usePipelineStore((s) => s.context);

  const renderStageOutputs = () => {
    switch (currentStage) {
      case "entry":
        return <span>故事大纲：{context.storyOutline ? "✓ 已设置" : "未设置"}</span>;
      case "narrative":
        return <span>角色 {characters.length} · 场景 {scenes.length} · 道具 {props.length}</span>;
      case "interaction":
        return <span>节点 {storyNodes.length} · 变量 {context.variables?.length ?? 0} · 结局 {context.endings?.length ?? 0}</span>;
      case "cinematic":
        return <span>镜头指导 {cinematicDirections.length} 个</span>;
      case "asset":
        return <span>资产 {context.assetList?.length ?? 0} 项</span>;
      case "qa":
        return <span>QA 报告：{context.qaReport ? `${context.qaReport.errors ?? 0} 错误` : "未生成"}</span>;
      case "preview":
        return <span>试玩预览中</span>;
      case "release":
        return <span>准备导出发布</span>;
      default:
        return null;
    }
  };

  return (
    <div className="flex shrink-0 items-center gap-3 border-b border-zinc-800 bg-zinc-950 px-4 py-1.5 text-xs text-zinc-400">
      <span className="font-medium text-zinc-200">{stageDef.label}</span>
      <span className="text-zinc-600">·</span>
      <span className="text-zinc-500">{stageDef.description}</span>
      <span className="text-zinc-700">|</span>
      {renderStageOutputs()}
    </div>
  );
}

// 画布区：根据当前 tab 渲染不同视图（8 阶段工作流，14 个子视图）
export function CanvasArea({ activeTab, selectedNodeId, onSelectNode, onTabChange }: CanvasAreaProps) {
  return (
    <div className="relative flex h-full flex-col bg-zinc-950">
      {/* 常驻顶部阶段状态条（非折叠） */}
      <CanvasStageBar />

      <div className="relative min-h-0 flex-1">
        {/* 原生 Studio 视图 */}
        {activeTab === "entry" && <EntryView />}
        {activeTab === "graph" && (
          <GraphView selectedNodeId={selectedNodeId} onSelectNode={onSelectNode} />
        )}
        {activeTab === "preview" && <PreviewView />}
        {activeTab === "timeline" && (
          <TimelineView selectedNodeId={selectedNodeId} onSelectNode={onSelectNode} />
        )}
        {activeTab === "characters" && <CharactersView />}
        {activeTab === "scenes" && <ScenesView />}
        {activeTab === "relationships" && <RelationshipsView />}
        {activeTab === "moral" && <MoralView />}
        {activeTab === "cinematic" && (
          <div className="flex h-full flex-col">
            <div className="shrink-0 border-b border-zinc-800 bg-zinc-900/50 px-4 py-2 text-xs text-zinc-400">
              🎬 演出蓝图 — 产出镜头/表演/音频指导文档，可导出后导入外部视频工具（tpen/可灵/Runway）生成最终画面。ChaseDream 不直接生成视频。
            </div>
            <div className="min-h-0 flex-1">
              <CinematicView />
            </div>
          </div>
        )}
        {activeTab === "health" && <HealthView />}
        {activeTab === "qa" && <QAView />}
        {activeTab === "release" && <ReleaseView />}
        {activeTab === "props" && <PropsView />}

        {/* 旧 Screen 融入 — 复用完整功能逻辑，数据走同一套 store */}
        {activeTab === "script" && <ScreenEmbedView onTabChange={onTabChange}><ScriptScreen /></ScreenEmbedView>}
        {activeTab === "interaction" && <ScreenEmbedView onTabChange={onTabChange}><InteractionScreen /></ScreenEmbedView>}
        {activeTab === "assets" && (
          <div className="flex h-full flex-col">
            <div className="shrink-0 border-b border-zinc-800 bg-zinc-900/50 px-4 py-2 text-xs text-zinc-400">
              📦 资产中心 — 导入+管理素材（图片/音频/视频/UI模板）。不做生成，复制提示词到外部工具（tpen/可灵/Suno）生成后导入回来。
            </div>
            <div className="min-h-0 flex-1">
              <ScreenEmbedView onTabChange={onTabChange}><AssetLibraryScreen /></ScreenEmbedView>
            </div>
          </div>
        )}
        {activeTab === "publish" && <ScreenEmbedView onTabChange={onTabChange}><PublishScreen /></ScreenEmbedView>}
      </div>
    </div>
  );
}
