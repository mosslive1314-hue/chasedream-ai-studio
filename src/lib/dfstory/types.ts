/**
 * .dfstory 协议规范 v1.0
 *
 * 逐梦平台的原生故事格式，是所有表现形式（文字游戏、视觉小说、互动影游）的共同基础。
 * 基于现有 Zustand store 类型扩展，加上版本号和元信息，支持 JSON 序列化/反序列化。
 */

import type {
  StoryNode,
  NodeEdge,
  GameCharacter,
  GameScene,
  GameProp,
  GameVariable,
  ScriptBlock,
  NarrativeIntent,
  InteractionPoint,
  BranchPath,
  QualityCheck,
  ChapterPlan,
  WorldRule,
  WorldBuildingEntry,
  QTEConfig,
  HotspotConfig,
  AssetCard,
  GameUISettings,
  CharacterTimeline,
  NarrativeState,
  ConsequenceChain,
  CinematicDirection,
  EntityRelation,
  CharacterSceneAppearance,
} from "@/lib/studio-data";

// ─── 协议元数据 ────────────────────────────────────────

export interface DfStoryMeta {
  /** 协议版本号 */
  version: "1.0";
  /** 故事唯一 ID */
  id: string;
  /** 故事标题 */
  title: string;
  /** 题材/类型（如"赛博朋克·间谍惊悚"） */
  genre: string;
  /** 作者 */
  author: string;
  /** 目标格式 */
  targetFormat: "interactive_h5" | "visual_novel" | "interactive_drama" | "narrative_game" | "webgal";
  /** 行业类型 */
  industry: "game" | "tourism" | "education" | "derivative";
  /** 画布比例 */
  aspectRatio: "9:16" | "16:9" | "auto";
  /** 创建时间 ISO 8601 */
  createdAt: string;
  /** 最后修改时间 */
  updatedAt: string;
  /** 章节总数 */
  chapterCount: number;
  /** 预估时长（分钟） */
  estimatedDuration: number;
  /** 标签 */
  tags: string[];
  /** 封面图 URL */
  cover?: string;
  /** 简介 */
  description?: string;
}

// ─── 叙事图谱数据 ────────────────────────────────────────

export interface DfStoryGraph {
  /** 故事节点 */
  nodes: StoryNode[];
  /** 节点连线 */
  edges: NodeEdge[];
  /** 叙事意图（每个节点的设计目的） */
  intents: NarrativeIntent[];
  /** 分支路径 */
  branches: BranchPath[];
}

// ─── 世界观与角色 ────────────────────────────────────────

export interface DfStoryWorld {
  /** 角色列表 */
  characters: GameCharacter[];
  /** 场景列表 */
  scenes: GameScene[];
  /** 道具列表 */
  props: GameProp[];
  /** 世界观设定 */
  worldBuilding: WorldBuildingEntry[];
  /** 世界规则 */
  worldRules: WorldRule[];
  /** 角色关系图谱 */
  entityRelations: EntityRelation[];
  /** 角色出场映射 */
  characterAppearances: CharacterSceneAppearance[];
}

// ─── 剧本与互动 ────────────────────────────────────────────

export interface DfStoryScript {
  /** 剧本块 */
  blocks: ScriptBlock[];
  /** 互动点 */
  interactionPoints: InteractionPoint[];
  /** QTE 配置 */
  qteConfigs: QTEConfig[];
  /** 热点配置 */
  hotspotConfigs: HotspotConfig[];
}

// ─── 变量与状态 ────────────────────────────────────────────

export interface DfStoryVariables {
  /** 变量定义 */
  definitions: GameVariable[];
  /** 初始变量值 */
  initialValues: Record<string, number>;
  /** 叙事状态 */
  narrativeStates: NarrativeState[];
  /** 后果链 */
  consequenceChains: ConsequenceChain[];
}

// ─── 角色时间线 ────────────────────────────────────────────

export interface DfStoryTimelines {
  /** 角色时间线 */
  characterTimelines: CharacterTimeline[];
}

// ─── 资产与 UI ────────────────────────────────────────────

export interface DfStoryAssets {
  /** 资产卡片 */
  cards: AssetCard[];
  /** UI 设置 */
  uiSettings: GameUISettings;
}

// ─── 影视化指令 ────────────────────────────────────────────

export interface DfStoryCinematic {
  /** 镜头/表演/音频指令 */
  directions: CinematicDirection[];
}

// ─── 章节规划 ────────────────────────────────────────────

export interface DfStoryChapters {
  /** 章节计划列表 */
  plans: ChapterPlan[];
}

// ─── 质量保障 ────────────────────────────────────────────

export interface DfStoryQuality {
  /** 质量检查项 */
  checks: QualityCheck[];
}

// ─── .dfstory 顶层结构 ──────────────────────────────────

export interface DfStory {
  meta: DfStoryMeta;
  graph: DfStoryGraph;
  world: DfStoryWorld;
  script: DfStoryScript;
  variables: DfStoryVariables;
  timelines: DfStoryTimelines;
  assets: DfStoryAssets;
  cinematic: DfStoryCinematic;
  chapters: DfStoryChapters;
  quality: DfStoryQuality;
}

// ─── 序列化（Store → .dfstory JSON）─────────────────────

/**
 * 从 narrative store 的原始数据中提取并组装 .dfstory 对象。
 * 接受 store state 的部分字段即可，不需要完整 store。
 */
export function serializeDfStory(input: DfStorySerializeInput): DfStory {
  const now = new Date().toISOString();
  return {
    meta: {
      version: "1.0",
      id: input.projectId ?? generateId(),
      title: input.title ?? "未命名故事",
      genre: input.genre ?? "",
      author: input.author ?? "",
      targetFormat: (input.targetFormat as DfStoryMeta["targetFormat"]) ?? "interactive_h5",
      industry: (input.industry as DfStoryMeta["industry"]) ?? "game",
      aspectRatio: (input.aspectRatio as DfStoryMeta["aspectRatio"]) ?? "9:16",
      createdAt: input.createdAt ?? now,
      updatedAt: now,
      chapterCount: input.chapterPlans?.length ?? 0,
      estimatedDuration: estimateDuration(input.storyNodes?.length ?? 0),
      tags: input.tags ?? [],
      cover: input.cover,
      description: input.description,
    },
    graph: {
      nodes: input.storyNodes ?? [],
      edges: input.nodeEdges ?? [],
      intents: input.narrativeIntents ?? [],
      branches: input.branchPaths ?? [],
    },
    world: {
      characters: input.characters ?? [],
      scenes: input.scenes ?? [],
      props: input.props ?? [],
      worldBuilding: input.worldBuilding ?? [],
      worldRules: input.worldRules ?? [],
      entityRelations: input.entityRelations ?? [],
      characterAppearances: input.characterSceneAppearances ?? [],
    },
    script: {
      blocks: input.scriptBlocks ?? [],
      interactionPoints: input.interactionPoints ?? [],
      qteConfigs: input.qteConfigs ?? [],
      hotspotConfigs: input.hotspotConfigs ?? [],
    },
    variables: {
      definitions: input.variables ?? [],
      initialValues: input.initVariables ?? {},
      narrativeStates: input.narrativeStates ?? [],
      consequenceChains: input.consequenceChains ?? [],
    },
    timelines: {
      characterTimelines: input.characterTimelines ?? [],
    },
    assets: {
      cards: input.assetCards ?? [],
      uiSettings: input.gameUISettings ?? {
        dialogTheme: "default",
        hudTheme: "default",
        menuTheme: "default",
        qteTheme: "default",
        globalFont: "system-ui",
        globalTextSpeed: 50,
        showSkipButton: true,
        showAutoPlay: true,
        showSaveLoad: true,
      },
    },
    cinematic: {
      directions: input.cinematicDirections ?? [],
    },
    chapters: {
      plans: input.chapterPlans ?? [],
    },
    quality: {
      checks: input.qualityChecks ?? [],
    },
  };
}

// ─── 反序列化（.dfstory JSON → Store 兼容数据）─────────

/**
 * 将 .dfstory 对象还原为 narrative store 可加载的扁平结构。
 * 可直接传给 useNarrativeStore.loadProjectData()。
 */
export function deserializeDfStory(story: DfStory): DfStoryStoreData {
  return {
    storyNodes: story.graph.nodes,
    nodeEdges: story.graph.edges,
    narrativeIntents: story.graph.intents,
    branchPaths: story.graph.branches,
    characters: story.world.characters,
    scenes: story.world.scenes,
    props: story.world.props,
    worldBuilding: story.world.worldBuilding,
    worldRules: story.world.worldRules,
    entityRelations: story.world.entityRelations,
    characterSceneAppearances: story.world.characterAppearances,
    scriptBlocks: story.script.blocks,
    interactionPoints: story.script.interactionPoints,
    qteConfigs: story.script.qteConfigs,
    hotspotConfigs: story.script.hotspotConfigs,
    variables: story.variables.definitions,
    initVariables: story.variables.initialValues,
    narrativeStates: story.variables.narrativeStates,
    consequenceChains: story.variables.consequenceChains,
    characterTimelines: story.timelines.characterTimelines,
    assetCards: story.assets.cards,
    gameUISettings: story.assets.uiSettings,
    cinematicDirections: story.cinematic.directions,
    chapterPlans: story.chapters.plans,
    qualityChecks: story.quality.checks,
  };
}

// ─── 文件 I/O ────────────────────────────────────────────

/**
 * 将 .dfstory 对象导出为 JSON 字符串（美化格式）。
 */
export function dfStoryToJson(story: DfStory): string {
  return JSON.stringify(story, null, 2);
}

/**
 * 从 JSON 字符串解析 .dfstory 对象，含基础校验。
 */
export function jsonToDfStory(json: string): DfStory {
  const parsed = JSON.parse(json);
  if (!parsed || typeof parsed !== "object") {
    throw new DfStoryError("无效的 JSON 对象");
  }
  if (!parsed.meta?.version) {
    throw new DfStoryError("缺少 meta.version 字段");
  }
  if (!parsed.graph) {
    throw new DfStoryError("缺少 graph 数据段");
  }
  // 兼容未来版本：只校验大版本号
  const majorVersion = parsed.meta.version.split(".")[0];
  if (majorVersion !== "1") {
    console.warn(
      `[dfstory] 文件版本 ${parsed.meta.version} 与当前解析器 v1.x 可能不完全兼容`
    );
  }
  return parsed as DfStory;
}

/**
 * 浏览器环境下载 .dfstory 文件。
 */
export function downloadDfStory(story: DfStory, filename?: string): void {
  const json = dfStoryToJson(story);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename ?? `${story.meta.title || "story"}.dfstory.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── 校验工具 ────────────────────────────────────────────

export interface DfStoryValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  stats: DfStoryStats;
}

export interface DfStoryStats {
  nodeCount: number;
  edgeCount: number;
  characterCount: number;
  sceneCount: number;
  branchCount: number;
  variableCount: number;
  interactionPointCount: number;
  scriptBlockCount: number;
  chapterCount: number;
}

/**
 * 校验 .dfstory 数据的完整性和一致性。
 */
export function validateDfStory(story: DfStory): DfStoryValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const stats: DfStoryStats = {
    nodeCount: story.graph.nodes.length,
    edgeCount: story.graph.edges.length,
    characterCount: story.world.characters.length,
    sceneCount: story.world.scenes.length,
    branchCount: story.graph.branches.length,
    variableCount: story.variables.definitions.length,
    interactionPointCount: story.script.interactionPoints.length,
    scriptBlockCount: story.script.blocks.length,
    chapterCount: story.chapters.plans.length,
  };

  // 必须有起始节点
  const hasStart = story.graph.nodes.some((n) => n.type === "start");
  if (!hasStart) {
    errors.push("缺少起始节点（type: 'start'）");
  }

  // 必须有至少一个结局
  const hasEnding = story.graph.nodes.some(
    (n) => n.type === "ending_good" || n.type === "ending_bad"
  );
  if (!hasEnding && stats.nodeCount > 0) {
    warnings.push("缺少结局节点（ending_good 或 ending_bad）");
  }

  // 边引用的节点必须存在
  const nodeIds = new Set(story.graph.nodes.map((n) => n.id));
  for (const edge of story.graph.edges) {
    if (!nodeIds.has(edge.from)) {
      errors.push(`边引用了不存在的源节点: ${edge.from}`);
    }
    if (!nodeIds.has(edge.to)) {
      errors.push(`边引用了不存在的目标节点: ${edge.to}`);
    }
  }

  // 变量引用检查
  const varIds = new Set(story.variables.definitions.map((v) => v.id));
  for (const state of story.variables.narrativeStates) {
    if (state.dependsOn) {
      for (const dep of state.dependsOn) {
        if (!varIds.has(dep)) {
          warnings.push(`叙事状态 "${state.name}" 依赖不存在的变量: ${dep}`);
        }
      }
    }
  }

  // 角色出场检查
  const charIds = new Set(story.world.characters.map((c) => c.id));
  for (const rel of story.world.entityRelations) {
    if (!charIds.has(rel.sourceId)) {
      warnings.push(`角色关系引用了不存在的角色: ${rel.sourceId}`);
    }
    if (!charIds.has(rel.targetId)) {
      warnings.push(`角色关系引用了不存在的角色: ${rel.targetId}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    stats,
  };
}

// ─── 工具函数 ────────────────────────────────────────────

function generateId(): string {
  return `story_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function estimateDuration(nodeCount: number): number {
  // 粗略估算：每个节点约 30 秒
  return Math.round((nodeCount * 30) / 60);
}

// ─── 错误类 ────────────────────────────────────────────

export class DfStoryError extends Error {
  constructor(message: string) {
    super(`[dfstory] ${message}`);
    this.name = "DfStoryError";
  }
}

// ─── 类型辅助 ────────────────────────────────────────────

/** serializeDfStory 接受的输入类型，所有字段均可选 */
export interface DfStorySerializeInput {
  // 元信息
  projectId?: string;
  title?: string;
  genre?: string;
  author?: string;
  targetFormat?: string;
  industry?: string;
  aspectRatio?: string;
  createdAt?: string;
  tags?: string[];
  cover?: string;
  description?: string;
  // 图谱
  storyNodes?: StoryNode[];
  nodeEdges?: NodeEdge[];
  narrativeIntents?: NarrativeIntent[];
  branchPaths?: BranchPath[];
  // 世界观
  characters?: GameCharacter[];
  scenes?: GameScene[];
  props?: GameProp[];
  worldBuilding?: WorldBuildingEntry[];
  worldRules?: WorldRule[];
  entityRelations?: EntityRelation[];
  characterSceneAppearances?: CharacterSceneAppearance[];
  // 剧本
  scriptBlocks?: ScriptBlock[];
  interactionPoints?: InteractionPoint[];
  qteConfigs?: QTEConfig[];
  hotspotConfigs?: HotspotConfig[];
  // 变量
  variables?: GameVariable[];
  initVariables?: Record<string, number>;
  narrativeStates?: NarrativeState[];
  consequenceChains?: ConsequenceChain[];
  // 时间线
  characterTimelines?: CharacterTimeline[];
  // 资产
  assetCards?: AssetCard[];
  gameUISettings?: GameUISettings;
  // 影视化
  cinematicDirections?: CinematicDirection[];
  // 章节
  chapterPlans?: ChapterPlan[];
  // 质量
  qualityChecks?: QualityCheck[];
}

/** deserializeDfStory 返回的扁平 store 数据 */
export interface DfStoryStoreData {
  storyNodes: StoryNode[];
  nodeEdges: NodeEdge[];
  narrativeIntents: NarrativeIntent[];
  branchPaths: BranchPath[];
  characters: GameCharacter[];
  scenes: GameScene[];
  props: GameProp[];
  worldBuilding: WorldBuildingEntry[];
  worldRules: WorldRule[];
  entityRelations: EntityRelation[];
  characterSceneAppearances: CharacterSceneAppearance[];
  scriptBlocks: ScriptBlock[];
  interactionPoints: InteractionPoint[];
  qteConfigs: QTEConfig[];
  hotspotConfigs: HotspotConfig[];
  variables: GameVariable[];
  initVariables: Record<string, number>;
  narrativeStates: NarrativeState[];
  consequenceChains: ConsequenceChain[];
  characterTimelines: CharacterTimeline[];
  assetCards: AssetCard[];
  gameUISettings: GameUISettings;
  cinematicDirections: CinematicDirection[];
  chapterPlans: ChapterPlan[];
  qualityChecks: QualityCheck[];
}
