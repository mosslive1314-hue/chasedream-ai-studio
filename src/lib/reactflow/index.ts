// ReactFlow 统一模块导出
export {
  NODE_WIDTH,
  NODE_HEIGHT,
  X_OFFSET,
  storeNodesToRFNodes,
  storeEdgesToRFEdges,
  createOnNodesChange,
  createOnEdgesChange,
  syncStoreToRF,
} from './sync';

export type { StoryNodeRFData } from './sync';

export { StoryNodeRF, storyNodeTypes } from './node-types';

export {
  CausalEdge,
  ExclusiveEdge,
  ConditionalEdge,
  ParallelEdge,
  ImpliedEdge,
  storyEdgeTypes,
} from './edge-types';

export { computeAutoLayout } from './auto-layout';
export type { LayoutOptions } from './auto-layout';
