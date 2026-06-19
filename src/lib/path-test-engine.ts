// ChaseDream Creator Studio — Path Auto-Test Engine
// BFS-based path analysis: find all reachable endings, detect dead ends, detect unreachable nodes

import type { StoryNode, NodeEdge } from '@/lib/types/narrative';

export interface PathTestOutput {
  /** All distinct paths from start to each ending node */
  paths: StoryPath[];
  /** Nodes with no outgoing edges that aren't endings (dead ends) */
  deadEnds: string[];
  /** Nodes that are never reachable from any start node */
  unreachableNodes: string[];
  /** Nodes that create cycles (path exceeds max depth) */
  cycleNodes: string[];
  /** Summary stats */
  stats: {
    totalPaths: number;
    goodEndings: number;
    badEndings: number;
    deadEnds: number;
    unreachableNodes: number;
    maxPathLength: number;
    avgPathLength: number;
  };
}

export interface StoryPath {
  /** Ordered list of node IDs from start to end */
  nodeIds: string[];
  /** The ending node type (good/bad) */
  endingType: 'good' | 'bad' | 'neutral';
  /** Human-readable labels for each step */
  labels: string[];
}

const MAX_DEPTH = 50; // prevent infinite loops in cyclic graphs

/**
 * Run BFS path analysis on the story graph.
 * Finds all distinct paths from start nodes to ending nodes.
 * Also detects dead ends, unreachable nodes, and cycles.
 */
export function runPathTest(
  storyNodes: StoryNode[],
  nodeEdges: NodeEdge[],
): PathTestOutput {
  const nodeMap = new Map(storyNodes.map(n => [n.id, n]));

  // Build adjacency list
  const adjacency = new Map<string, string[]>();
  for (const node of storyNodes) {
    adjacency.set(node.id, []);
  }
  for (const edge of nodeEdges) {
    const list = adjacency.get(edge.from);
    if (list) list.push(edge.to);
  }

  // Find start nodes
  const startNodes = storyNodes.filter(n => n.type === 'start');
  if (startNodes.length === 0) {
    // If no explicit start node, use first node
    if (storyNodes.length > 0) {
      startNodes.push(storyNodes[0]);
    } else {
      return emptyResult();
    }
  }

  // BFS to find all paths to endings
  const paths: StoryPath[] = [];
  const cycleNodes: Set<string> = new Set();

  for (const startNode of startNodes) {
    // Stack-based DFS to enumerate all paths (not shortest path)
    const stack: { nodeId: string; path: string[]; depth: number }[] = [
      { nodeId: startNode.id, path: [startNode.id], depth: 0 },
    ];

    while (stack.length > 0) {
      const { nodeId, path, depth } = stack.pop()!;

      if (depth >= MAX_DEPTH) {
        cycleNodes.add(nodeId);
        continue;
      }

      const node = nodeMap.get(nodeId);
      if (!node) continue;

      // Check if this is an ending node
      if (node.type === 'ending_good' || node.type === 'ending_bad') {
        const endingType = node.type === 'ending_good' ? 'good' : 'bad';
        paths.push({
          nodeIds: [...path],
          endingType,
          labels: path.map(id => nodeMap.get(id)?.label ?? id),
        });
        continue;
      }

      // Get outgoing edges
      const neighbors = adjacency.get(nodeId) ?? [];

      if (neighbors.length === 0 && !node.type.startsWith('ending')) {
        // Dead end (no outgoing edges, not an ending)
        // Don't push to paths — it's captured in deadEnds
        continue;
      }

      // Continue traversal
      for (const nextId of neighbors) {
        // Avoid revisiting nodes in the current path (simple cycle detection)
        if (path.includes(nextId)) {
          cycleNodes.add(nextId);
          continue;
        }
        stack.push({ nodeId: nextId, path: [...path, nextId], depth: depth + 1 });
      }
    }
  }

  // Detect dead ends: nodes with no outgoing edges that aren't ending nodes
  const deadEnds = storyNodes
    .filter(n => {
      if (n.type.startsWith('ending')) return false;
      const neighbors = adjacency.get(n.id) ?? [];
      return neighbors.length === 0;
    })
    .map(n => n.id);

  // Detect unreachable nodes: not reachable from any start node
  const reachable = new Set<string>();
  const visited = new Set<string>();
  const bfsQueue = [...startNodes.map(n => n.id)];

  while (bfsQueue.length > 0) {
    const current = bfsQueue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);
    reachable.add(current);

    const neighbors = adjacency.get(current) ?? [];
    for (const next of neighbors) {
      if (!visited.has(next)) {
        bfsQueue.push(next);
      }
    }
  }

  const unreachableNodes = storyNodes
    .filter(n => !reachable.has(n.id))
    .map(n => n.id);

  // Compute stats
  const goodEndings = paths.filter(p => p.endingType === 'good').length;
  const badEndings = paths.filter(p => p.endingType === 'bad').length;
  const pathLengths = paths.map(p => p.nodeIds.length);
  const maxPathLength = pathLengths.length > 0 ? Math.max(...pathLengths) : 0;
  const avgPathLength = pathLengths.length > 0
    ? Math.round(pathLengths.reduce((a, b) => a + b, 0) / pathLengths.length)
    : 0;

  return {
    paths,
    deadEnds,
    unreachableNodes,
    cycleNodes: [...cycleNodes],
    stats: {
      totalPaths: paths.length,
      goodEndings,
      badEndings,
      deadEnds: deadEnds.length,
      unreachableNodes: unreachableNodes.length,
      maxPathLength,
      avgPathLength,
    },
  };
}

function emptyResult(): PathTestOutput {
  return {
    paths: [],
    deadEnds: [],
    unreachableNodes: [],
    cycleNodes: [],
    stats: { totalPaths: 0, goodEndings: 0, badEndings: 0, deadEnds: 0, unreachableNodes: 0, maxPathLength: 0, avgPathLength: 0 },
  };
}
