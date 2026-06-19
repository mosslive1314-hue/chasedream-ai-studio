/**
 * PlayableGraph Generator — dynamically converts StoryNode[] + NodeEdge[]
 * into a runtime-consumable PlayableNode graph.
 *
 * This is the core bridge between the authoring-time data model
 * (StoryNode + NodeEdge with conditions) and the runtime player
 * (PlayableNode with choices and effects).
 *
 * Design principles:
 * 1. Pure function — no side effects, no store access
 * 2. Composable — accepts all needed data as parameters
 * 3. Extensible — enrichment hooks for char/text/effects via InteractionPoints & NarrativeIntents
 */

import type { StoryNode, NodeEdge, NarrativeIntent, InteractionPoint } from '@/lib/types/narrative';
import type { GameCharacter, GameScene, PlayableNode, GameVariable } from '@/lib/types/game';
import { conditionToLabel } from '@/lib/condition-engine';

// ── Public API ──────────────────────────────────────────────────────────────

export interface BuildPlayableGraphInput {
  storyNodes: StoryNode[];
  nodeEdges: NodeEdge[];
  characters: GameCharacter[];
  scenes: GameScene[];
  narrativeIntents: NarrativeIntent[];
  interactionPoints: InteractionPoint[];
  variables: GameVariable[];
}

export interface BuildPlayableGraphOutput {
  /** The generated playable graph */
  graph: Record<string, PlayableNode>;
  /** Warnings encountered during generation (e.g. dangling edges, missing data) */
  warnings: string[];
}

/**
 * Build a complete PlayableNode graph from authoring-time data.
 *
 * Mapping rules:
 * - StoryNode → PlayableNode (1:1 for scene/start/qte, with type-specific enrichments)
 * - NodeEdge → PlayableNode.choices[] (outgoing edges become player choices)
 * - condition edges → choices with condition description as label
 * - exclusive edges → mutually exclusive choices
 * - causal edges → auto-advance (single choice with "继续")
 * - ending_good/bad → isEnding + endingType
 */
export function buildPlayableGraph(input: BuildPlayableGraphInput): BuildPlayableGraphOutput {
  const { storyNodes, nodeEdges, characters, scenes, narrativeIntents, interactionPoints, variables } = input;
  const warnings: string[] = [];

  // Pre-compute lookup maps
  const nodeMap = new Map(storyNodes.map(n => [n.id, n]));
  const edgesBySource = new Map<string, NodeEdge[]>();
  for (const edge of nodeEdges) {
    const list = edgesBySource.get(edge.from) ?? [];
    list.push(edge);
    edgesBySource.set(edge.from, list);
  }

  // Scene lookup: nodeId → GameScene (first scene referencing this node)
  const sceneByNode = new Map<string, GameScene>();
  for (const scene of scenes) {
    for (const nodeId of scene.refNodes) {
      if (!sceneByNode.has(nodeId)) {
        sceneByNode.set(nodeId, scene);
      }
    }
  }

  // Character lookup: nodeId → character name (first character appearing in this node)
  const charByNode = new Map<string, string>();
  for (const char of characters) {
    for (const nodeId of char.appearNodes) {
      if (!charByNode.has(nodeId)) {
        charByNode.set(nodeId, char.name);
      }
    }
  }

  // InteractionPoint lookup: nodeId → InteractionPoint
  const ipByNode = new Map<string, InteractionPoint>();
  for (const ip of interactionPoints) {
    ipByNode.set(ip.nodeId, ip);
  }

  // NarrativeIntent lookup: nodeId → NarrativeIntent
  const intentByNode = new Map<string, NarrativeIntent>();
  for (const intent of narrativeIntents) {
    intentByNode.set(intent.nodeId, intent);
  }

  // Variable name lookup: variableId → variable name (for effect string generation)
  const varNameById = new Map(variables.map(v => [v.id, v.name]));

  // Build playable nodes
  const graph: Record<string, PlayableNode> = {};

  for (const storyNode of storyNodes) {
    const playableNode = convertStoryNode(storyNode, {
      nodeMap,
      edgesBySource,
      sceneByNode,
      charByNode,
      ipByNode,
      intentByNode,
      varNameById,
      warnings,
    });
    graph[playableNode.id] = playableNode;
  }

  // Validate: check for dangling edge references
  for (const edge of nodeEdges) {
    if (!nodeMap.has(edge.to)) {
      warnings.push(`Edge ${edge.from}→${edge.to}: target node "${edge.to}" does not exist`);
    }
  }

  return { graph, warnings };
}

// ── Internal conversion logic ───────────────────────────────────────────────

interface ConversionContext {
  nodeMap: Map<string, StoryNode>;
  edgesBySource: Map<string, NodeEdge[]>;
  sceneByNode: Map<string, GameScene>;
  charByNode: Map<string, string>;
  ipByNode: Map<string, InteractionPoint>;
  intentByNode: Map<string, NarrativeIntent>;
  varNameById: Map<string, string>;
  warnings: string[];
}

function convertStoryNode(
  node: StoryNode,
  ctx: ConversionContext,
): PlayableNode {
  // Determine character name
  let char: string;
  if (node.povCharacterId) {
    // POV character takes priority — but we only have name in charByNode
    // If povCharacterId matches a character, we'd look it up
    char = ctx.charByNode.get(node.id) ?? '旁白';
  } else {
    char = ctx.charByNode.get(node.id) ?? '旁白';
  }

  // Determine text content
  // MVP: use node label. Future: enrich from ScriptBlock/DialogueTree data
  const text = buildNodeText(node, ctx);

  // Determine background image
  const scene = ctx.sceneByNode.get(node.id);
  const backgroundImage = scene?.imageUrl;

  // Determine choices from outgoing edges
  const outgoingEdges = ctx.edgesBySource.get(node.id) ?? [];
  const choices = buildChoices(node, outgoingEdges, ctx);

  // Determine ending status
  const isEnding = node.type === 'ending_good' || node.type === 'ending_bad';
  const endingType = node.type === 'ending_good' ? 'good' as const
    : node.type === 'ending_bad' ? 'bad' as const
    : undefined;

  const result: PlayableNode = {
    id: node.id,
    char,
    text,
  };

  // Only add optional fields if they have values
  if (backgroundImage) result.backgroundImage = backgroundImage;
  if (choices && choices.length > 0) result.choices = choices;
  if (isEnding) result.isEnding = true;
  if (endingType) result.endingType = endingType;

  return result;
}

/**
 * Build the display text for a playable node.
 * Tries to enrich from InteractionPoint narrative description,
 * falls back to StoryNode label.
 */
function buildNodeText(node: StoryNode, ctx: ConversionContext): string {
  // For ending nodes, use the label directly (it already contains the ending title)
  if (node.type === 'ending_good' || node.type === 'ending_bad') {
    return node.label;
  }

  // For condition nodes, add condition context
  if (node.type === 'condition') {
    const edges = ctx.edgesBySource.get(node.id) ?? [];
    const conditionEdges = edges.filter(e => e.condition);
    if (conditionEdges.length > 0) {
      const conditionLabels = conditionEdges.map(e =>
        e.condition ? conditionToLabel(e.condition, (id: string) => ctx.varNameById.get(id) ?? id) : ''
      ).filter(Boolean);
      return `${node.label}\n条件: ${conditionLabels.join(' / ')}`;
    }
  }

  // For QTE nodes, add urgency indicator
  if (node.type === 'qte') {
    return `⚡ ${node.label}`;
  }

  // Default: use label
  return node.label;
}

/**
 * Build choices array from outgoing edges.
 *
 * Edge type → choice mapping:
 * - causal → auto-advance (single choice "继续")
 * - exclusive → explicit mutually-exclusive choices
 * - conditional → choices with condition context
 * - parallel → explicit choices (player picks one)
 * - implied → explicit choices (e.g. success/failure from condition node)
 */
function buildChoices(
  node: StoryNode,
  edges: NodeEdge[],
  ctx: ConversionContext,
): PlayableNode['choices'] {
  if (edges.length === 0) {
    // Terminal node (ending) — no choices
    return [];
  }

  // For start/scene nodes with a single causal edge — auto-advance
  if (edges.length === 1 && edges[0].edgeType === 'causal') {
    const edge = edges[0];
    const effect = deriveEffect(node.id, edge, ctx);
    return [{
      label: '继续',
      next: edge.to,
      effect,
    }];
  }

  // For choice/condition/qte nodes — build explicit choices from edges
  const choices: NonNullable<PlayableNode['choices']>[number][] = [];

  for (const edge of edges) {
    const targetNode = ctx.nodeMap.get(edge.to);
    const label = buildChoiceLabel(edge, targetNode, ctx);
    const effect = deriveEffect(node.id, edge, ctx);

    choices.push({
      label,
      next: edge.to,
      effect,
    });
  }

  return choices;
}

/**
 * Build a human-readable label for a choice.
 */
function buildChoiceLabel(
  edge: NodeEdge,
  targetNode: StoryNode | undefined,
  ctx: ConversionContext,
): string {
  // 1. Use explicit edge label if available
  if (edge.label) return edge.label;

  // 2. For conditional edges, use condition description
  if (edge.condition) {
    return conditionToLabel(edge.condition, (id: string) => ctx.varNameById.get(id) ?? id);
  }

  // 3. For exclusive edges, use the target node's label
  if (edge.edgeType === 'exclusive' && targetNode) {
    return `→ ${targetNode.label}`;
  }

  // 4. Fallback: use target node label or edge target ID
  return targetNode?.label ?? edge.to;
}

/**
 * Derive the variable effect string for a choice.
 *
 * Priority:
 * 1. InteractionPoint.options[].variableEffect (e.g. "stealth_score +15")
 * 2. NarrativeIntent.variableChanges (e.g. [{variable: "stealth_score", operation: "+15", value: 15}])
 * 3. Default: "+0" (no effect)
 */
function deriveEffect(
  sourceNodeId: string,
  edge: NodeEdge,
  ctx: ConversionContext,
): string {
  // 1. Check InteractionPoint options for this node
  const ip = ctx.ipByNode.get(sourceNodeId);
  if (ip) {
    // Try to match edge to an option by target node
    const matchingOption = ip.options.find(opt => {
      // Check if the option's pathEffect or consequence mentions the target
      const mentionsTarget = opt.pathEffect?.includes(edge.to) ||
        opt.consequence?.includes(edge.to);
      return mentionsTarget;
    });
    if (matchingOption?.variableEffect) {
      return matchingOption.variableEffect;
    }

    // If only one option, use its effect directly
    if (ip.options.length === 1 && ip.options[0].variableEffect) {
      return ip.options[0].variableEffect;
    }
  }

  // 2. Check NarrativeIntent for variable changes
  const intent = ctx.intentByNode.get(sourceNodeId);
  if (intent?.variableChanges && intent.variableChanges.length > 0) {
    const changes = intent.variableChanges
      .map(vc => {
        const varName = ctx.varNameById.get(vc.variable) ?? vc.variable;
        return `${vc.operation === '-' ? '-' : '+'}${varName} ${vc.value}`;
      })
      .join('; ');
    if (changes) return changes;
  }

  // 3. Default: no effect
  return '+0';
}

// ── Utility: incremental rebuild ───────────────────────────────────────────

/**
 * Rebuild only the affected nodes in the playable graph.
 * Useful when a single node/edge changes and you don't want to rebuild everything.
 *
 * Returns a partial graph (only changed nodes) that should be merged into the existing graph.
 */
export function rebuildAffectedNodes(
  affectedNodeIds: string[],
  input: BuildPlayableGraphInput,
): { updated: Record<string, PlayableNode>; warnings: string[] } {
  const { storyNodes, nodeEdges, characters, scenes, narrativeIntents, interactionPoints, variables } = input;
  const warnings: string[] = [];

  // Build lookup maps
  const nodeMap = new Map(storyNodes.map(n => [n.id, n]));
  const edgesBySource = new Map<string, NodeEdge[]>();
  for (const edge of nodeEdges) {
    const list = edgesBySource.get(edge.from) ?? [];
    list.push(edge);
    edgesBySource.set(edge.from, list);
  }
  const sceneByNode = new Map<string, GameScene>();
  for (const scene of scenes) {
    for (const nodeId of scene.refNodes) {
      if (!sceneByNode.has(nodeId)) sceneByNode.set(nodeId, scene);
    }
  }
  const charByNode = new Map<string, string>();
  for (const char of characters) {
    for (const nodeId of char.appearNodes) {
      if (!charByNode.has(nodeId)) charByNode.set(nodeId, char.name);
    }
  }
  const ipByNode = new Map<string, InteractionPoint>();
  for (const ip of interactionPoints) ipByNode.set(ip.nodeId, ip);
  const intentByNode = new Map<string, NarrativeIntent>();
  for (const intent of narrativeIntents) intentByNode.set(intent.nodeId, intent);
  const varNameById = new Map(variables.map(v => [v.id, v.name]));

  const ctx: ConversionContext = {
    nodeMap, edgesBySource, sceneByNode, charByNode,
    ipByNode, intentByNode, varNameById, warnings,
  };

  // Also include source nodes of edges that point to affected nodes
  // (because their choices may change)
  const sourceNodesToUpdate = new Set<string>(affectedNodeIds);
  for (const edge of nodeEdges) {
    if (affectedNodeIds.includes(edge.to)) {
      sourceNodesToUpdate.add(edge.from);
    }
  }

  const updated: Record<string, PlayableNode> = {};
  for (const nodeId of sourceNodesToUpdate) {
    const storyNode = nodeMap.get(nodeId);
    if (storyNode) {
      updated[nodeId] = convertStoryNode(storyNode, ctx);
    }
  }

  return { updated, warnings };
}
