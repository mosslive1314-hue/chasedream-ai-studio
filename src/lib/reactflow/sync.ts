// Phase 2: ReactFlow ↔ Store 双向同步核心模块
import {
  type Node,
  type Edge,
  type NodeChange,
  type EdgeChange,
  applyNodeChanges,
  applyEdgeChanges,
} from '@xyflow/react';
import type { StoryNode, NodeEdge } from '@/lib/types/narrative';
import { edgeId, parseEdgeId } from '@/lib/types/narrative';

// ── 统一节点数据类型 ──────────────────────────────────────────────────────────
// 使用 Record<string, unknown> 以满足 @xyflow/react 的 NodeProps 约束
export type StoryNodeRFData = {
  label: string;
  nodeType: string;
  hasError: boolean;
  errorMsg?: string;
  isLocked?: boolean;
  isSelected?: boolean;
  isMultiSelected?: boolean;
  variantCount?: number;
  onNodeClick?: (id: string) => void;
  [key: string]: unknown;
};

// ── 节点尺寸常量 ──────────────────────────────────────────────────────────────
export const NODE_WIDTH = 140;
export const NODE_HEIGHT = 60;
/** x 偏移：使 140px 宽节点居中（RF position = store.x - 70） */
export const X_OFFSET = NODE_WIDTH / 2; // 70

// ── Store StoryNode[] → ReactFlow Node[] ──────────────────────────────────────
export function storeNodesToRFNodes(
  nodes: StoryNode[],
  options: {
    selectedId: string | null;
    multiSelectedIds?: string[];
    onNodeClick?: (id: string) => void;
  }
): Node<StoryNodeRFData>[] {
  return nodes.map(node => ({
    id: node.id,
    type: 'storyNode',
    position: { x: node.x - X_OFFSET, y: node.y },
    data: {
      label: node.label,
      nodeType: node.type,
      hasError: node.hasError ?? false,
      errorMsg: node.errorMsg,
      isLocked: (node as unknown as Record<string, unknown>).isLocked as boolean | undefined,
      isSelected: node.id === options.selectedId,
      isMultiSelected: options.multiSelectedIds?.includes(node.id) ?? false,
      variantCount: 0,
      onNodeClick: options.onNodeClick,
    },
    draggable: !((node as unknown as Record<string, unknown>).isLocked),
  }));
}

// ── Store NodeEdge[] → ReactFlow Edge[] ───────────────────────────────────────
export function storeEdgesToRFEdges(edges: NodeEdge[]): Edge[] {
  return edges.map(e => ({
    id: edgeId(e.from, e.to),
    source: e.from,
    target: e.to,
    label: e.label,
    type: e.edgeType ?? 'smoothstep',
    data: { edgeType: e.edgeType ?? 'causal' },
  }));
}

// ── onNodesChange 处理器 ──────────────────────────────────────────────────────
/** 创建 onNodesChange 回调：remove→store, 其余→内部状态 */
export function createOnNodesChange(
  removeNode: (id: string) => void,
  setInternalNodes: (updater: (nds: Node[]) => Node[]) => void,
) {
  return (changes: NodeChange[]) => {
    // 对 remove 类型变更，调用 store action
    for (const change of changes) {
      if (change.type === 'remove') {
        removeNode(change.id);
      }
    }
    // 所有变更（包括 remove）应用到内部状态
    setInternalNodes(nds => applyNodeChanges(changes, nds));
  };
}

// ── onEdgesChange 处理器 ──────────────────────────────────────────────────────
/** 创建 onEdgesChange 回调：remove→store, 其余→内部状态 */
export function createOnEdgesChange(
  removeEdge: (from: string, to: string) => void,
  setInternalEdges: (updater: (eds: Edge[]) => Edge[]) => void,
) {
  return (changes: EdgeChange[]) => {
    for (const change of changes) {
      if (change.type === 'remove') {
        const { from, to } = parseEdgeId(change.id);
        removeEdge(from, to);
      }
    }
    setInternalEdges(eds => applyEdgeChanges(changes, eds));
  };
}

// ── Store 变更同步到 ReactFlow 内部状态 ────────────────────────────────────────
/** 当 store 数据变更时，将转换后的 rfNodes/rfEdges 同步到 ReactFlow 内部状态 */
export function syncStoreToRF(
  rfNodesFromStore: Node[],
  rfEdgesFromStore: Edge[],
  setInternalNodes: (nodes: Node[]) => void,
  setInternalEdges: (edges: Edge[]) => void,
) {
  setInternalNodes(rfNodesFromStore);
  setInternalEdges(rfEdgesFromStore);
}
