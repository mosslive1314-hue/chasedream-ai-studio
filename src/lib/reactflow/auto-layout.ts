// Phase 2: dagre 自动布局算法
import dagre from 'dagre';
import type { StoryNode, NodeEdge } from '@/lib/types/narrative';
import { NODE_HEIGHT } from './sync';

export interface LayoutOptions {
  /** 布局方向，默认 TB（上→下） */
  rankdir?: 'TB' | 'LR';
  /** 同层节点间距，默认 60 */
  nodesep?: number;
  /** 层间间距，默认 100 */
  ranksep?: number;
  /** 节点宽度，默认 140 */
  nodeWidth?: number;
  /** 节点高度，默认 60 */
  nodeHeight?: number;
}

/**
 * 使用 dagre 算法计算自动布局
 *
 * 坐标映射约定：
 *   - ReactFlow position = 节点左上角坐标
 *   - dagre pos = 节点中心坐标
 *   - store.x = ReactFlow position.x + X_OFFSET (70)
 *   - store.y = ReactFlow position.y
 *
 * 因此：
 *   - store.x = dagre 中心 x（因为 RF pos.x = dagre.x - width/2, store.x = RF pos.x + 70 = dagre.x）
 *   - store.y = dagre 中心 y - height/2
 *
 * 返回每个节点的新位置 {x, y}（store 坐标系）
 */
export function computeAutoLayout(
  nodes: StoryNode[],
  edges: NodeEdge[],
  options: LayoutOptions = {},
): Map<string, { x: number; y: number }> {
  const {
    rankdir = 'TB',
    nodesep = 60,
    ranksep = 100,
    nodeWidth = 140,
    nodeHeight = NODE_HEIGHT,
  } = options;

  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir, nodesep, ranksep });

  for (const n of nodes) {
    g.setNode(n.id, { width: nodeWidth, height: nodeHeight });
  }

  for (const e of edges) {
    g.setEdge(e.from, e.to);
  }

  dagre.layout(g);

  const positions = new Map<string, { x: number; y: number }>();
  for (const n of nodes) {
    const pos = g.node(n.id);
    if (pos) {
      positions.set(n.id, {
        x: pos.x,                     // store.x = dagre 中心 x
        y: pos.y - nodeHeight / 2,    // store.y = dagre 中心 y - 半高
      });
    }
  }
  return positions;
}
