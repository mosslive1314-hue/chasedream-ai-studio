import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  StoryNode,
  NodeEdge,
  GameCharacter,
  GameScene,
  GameProp,
  GameVariable,
  PlayableNode,
  NarrativeIntent,
  QualityCheck,
  WorldBuildingEntry,
  BranchPath,
  ScriptBlock,
  HeatmapEntry,
  ChapterPlan,
  WorldRule,
  InteractionPoint,
  QTEConfig,
  HotspotConfig,
  StageCheck,
  AssetCard,
  UITemplate,
  GameUISettings,
  CharacterTimeline,
  CrossCharacterEffect,
  NarrativeState,
  ConsequenceChain,
  PlayerExplorationMap,
  CinematicDirection,
  EngineExportConfig,
  CollabTask,
  CollabComment,
  ReviewItem,
  VersionDiff,
  IndustryQCRule,
  IndustryAssetType,
  IndustryTemplate,
  ProjectSpecTemplate,
  FactoryTask,
  PathTestResult,
  PipelineStage,
} from '@/lib/studio-data';

// Import seed data - these will be created as part of the studio-data split
import {
  STORY_NODES as SEED_STORY_NODES,
  NODE_EDGES as SEED_NODE_EDGES,
  GAME_CHARACTERS as SEED_GAME_CHARACTERS,
  GAME_SCENES as SEED_GAME_SCENES,
  GAME_PROPS as SEED_GAME_PROPS,
  GAME_VARIABLES as SEED_GAME_VARIABLES,
  INIT_VARIABLES as SEED_INIT_VARIABLES,
  PLAYABLE_GRAPH as SEED_PLAYABLE_GRAPH,
  NARRATIVE_INTENTS as SEED_NARRATIVE_INTENTS,
  QUALITY_CHECKS as SEED_QUALITY_CHECKS,
  WORLD_BUILDING as SEED_WORLD_BUILDING,
  WORLD_RULES as SEED_WORLD_RULES,
  BRANCH_PATHS as SEED_BRANCH_PATHS,
  SCRIPT_BLOCKS as SEED_SCRIPT_BLOCKS,
  AI_SUGGESTIONS as SEED_AI_SUGGESTIONS,
  CHAPTER_PLANS as SEED_CHAPTER_PLANS,
  HEATMAP_DATA as SEED_HEATMAP_DATA,
  INTERACTION_POINTS as SEED_INTERACTION_POINTS,
  STAGE_CHECKS as SEED_STAGE_CHECKS,
  ASSET_CARDS as SEED_ASSET_CARDS,
  UI_TEMPLATES as SEED_UI_TEMPLATES,
  GAME_UI_SETTINGS as SEED_GAME_UI_SETTINGS,
  PIPELINE_STAGES as SEED_PIPELINE_STAGES,
  PATH_TEST_RESULTS as SEED_PATH_TEST_RESULTS,
  QTE_CONFIGS as SEED_QTE_CONFIGS,
  HOTSPOT_CONFIGS as SEED_HOTSPOT_CONFIGS,
  PROJECT_SPEC_TEMPLATES as SEED_PROJECT_SPEC_TEMPLATES,
  INDUSTRY_QC_RULES as SEED_INDUSTRY_QC_RULES,
  INDUSTRY_ASSET_TYPES as SEED_INDUSTRY_ASSET_TYPES,
  INDUSTRY_TEMPLATES as SEED_INDUSTRY_TEMPLATES,
  FACTORY_TASKS as SEED_FACTORY_TASKS,
  CHARACTER_TIMELINES as SEED_CHARACTER_TIMELINES,
  CROSS_CHARACTER_EFFECTS as SEED_CROSS_CHARACTER_EFFECTS,
  NARRATIVE_STATES as SEED_NARRATIVE_STATES,
  CONSEQUENCE_CHAINS as SEED_CONSEQUENCE_CHAINS,
  PLAYER_EXPLORATION as SEED_PLAYER_EXPLORATION,
  CINEMATIC_DIRECTIONS as SEED_CINEMATIC_DIRECTIONS,
  ENGINE_EXPORT_CONFIGS as SEED_ENGINE_EXPORT_CONFIGS,
  COLLAB_TASKS as SEED_COLLAB_TASKS,
  COLLAB_COMMENTS as SEED_COLLAB_COMMENTS,
  REVIEW_ITEMS as SEED_REVIEW_ITEMS,
  VERSION_DIFFS as SEED_VERSION_DIFFS,
} from '@/lib/seed/narrative-seed';

// Using NarrativeStoreState to avoid naming collision with the NarrativeState type from studio-data
interface NarrativeStoreState {
  // --- Node Graph ---
  storyNodes: StoryNode[];
  nodeEdges: NodeEdge[];

  // --- Characters & World ---
  characters: GameCharacter[];
  scenes: GameScene[];
  props: GameProp[];
  worldBuilding: WorldBuildingEntry[];
  worldRules: WorldRule[];

  // --- Variables ---
  variables: GameVariable[];
  initVariables: Record<string, number>;

  // --- Script ---
  scriptBlocks: ScriptBlock[];
  aiSuggestions: Record<string, string[]>;
  chapterPlans: ChapterPlan[];

  // --- Interaction ---
  interactionPoints: InteractionPoint[];

  // --- Playable ---
  playableGraph: Record<string, PlayableNode>;

  // --- Narrative Analysis ---
  narrativeIntents: NarrativeIntent[];
  heatmapData: HeatmapEntry[];
  branchPaths: BranchPath[];
  pathTestResults: PathTestResult[];

  // --- Quality ---
  qualityChecks: QualityCheck[];

  // --- Assets ---
  assetCards: AssetCard[];

  // --- UI Templates ---
  uiTemplates: UITemplate[];
  gameUISettings: GameUISettings;
  stageChecks: StageCheck[];

  // --- Advanced Narrative (P7) ---
  characterTimelines: CharacterTimeline[];
  crossCharacterEffects: CrossCharacterEffect[];
  narrativeStates: NarrativeState[];
  consequenceChains: ConsequenceChain[];
  playerExploration: PlayerExplorationMap;

  // --- Cinematic (P8) ---
  cinematicDirections: CinematicDirection[];

  // --- Engine Export (P8) ---
  engineExportConfigs: EngineExportConfig[];

  // --- Collaboration (P8) ---
  collabTasks: CollabTask[];
  collabComments: CollabComment[];
  reviewItems: ReviewItem[];
  versionDiffs: VersionDiff[];

  // --- Pipeline ---
  pipelineStages: PipelineStage[];

  // --- QTE ---
  qteConfigs: QTEConfig[];
  hotspotConfigs: HotspotConfig[];

  // --- Factory ---
  factoryTasks: FactoryTask[];

  // --- Node Actions ---
  updateNode: (id: string, updates: Partial<StoryNode>) => void;
  addNode: (node: StoryNode) => void;
  removeNode: (id: string) => void;

  // --- Edge Actions ---
  addEdge: (edge: NodeEdge) => void;
  removeEdge: (from: string, to: string) => void;

  // --- Variable Actions ---
  updateVariable: (id: string, updates: Partial<GameVariable>) => void;
  addVariable: (variable: GameVariable) => void;

  // --- Quality Actions ---
  updateQualityCheck: (id: string, updates: Partial<QualityCheck>) => void;

  // --- Interaction Actions ---
  updateInteractionPoint: (id: string, updates: Partial<InteractionPoint>) => void;

  // --- Character Actions ---
  updateCharacter: (id: string, updates: Partial<GameCharacter>) => void;

  // --- World Rule Actions ---
  updateWorldRule: (id: string, updates: Partial<WorldRule>) => void;

  // --- Chapter Plan Actions ---
  updateChapterPlan: (id: string, updates: Partial<ChapterPlan>) => void;

  // --- Collaboration Actions ---
  updateCollabTask: (id: string, updates: Partial<CollabTask>) => void;
  addCollabComment: (comment: CollabComment) => void;

  // --- Bulk Load ---
  loadProjectData: (data: Partial<NarrativeStoreState>) => void;
  resetToDefaults: () => void;
}

/** Default seed state - used for initialization and reset */
const seedState = {
  // --- Node Graph ---
  storyNodes: SEED_STORY_NODES,
  nodeEdges: SEED_NODE_EDGES,

  // --- Characters & World ---
  characters: SEED_GAME_CHARACTERS,
  scenes: SEED_GAME_SCENES,
  props: SEED_GAME_PROPS,
  worldBuilding: SEED_WORLD_BUILDING,
  worldRules: SEED_WORLD_RULES,

  // --- Variables ---
  variables: SEED_GAME_VARIABLES,
  initVariables: SEED_INIT_VARIABLES,

  // --- Script ---
  scriptBlocks: SEED_SCRIPT_BLOCKS,
  aiSuggestions: SEED_AI_SUGGESTIONS,
  chapterPlans: SEED_CHAPTER_PLANS,

  // --- Interaction ---
  interactionPoints: SEED_INTERACTION_POINTS,

  // --- Playable ---
  playableGraph: SEED_PLAYABLE_GRAPH,

  // --- Narrative Analysis ---
  narrativeIntents: SEED_NARRATIVE_INTENTS,
  heatmapData: SEED_HEATMAP_DATA,
  branchPaths: SEED_BRANCH_PATHS,
  pathTestResults: SEED_PATH_TEST_RESULTS,

  // --- Quality ---
  qualityChecks: SEED_QUALITY_CHECKS,

  // --- Assets ---
  assetCards: SEED_ASSET_CARDS,

  // --- UI Templates ---
  uiTemplates: SEED_UI_TEMPLATES,
  gameUISettings: SEED_GAME_UI_SETTINGS,
  stageChecks: SEED_STAGE_CHECKS,

  // --- Advanced Narrative (P7) ---
  characterTimelines: SEED_CHARACTER_TIMELINES,
  crossCharacterEffects: SEED_CROSS_CHARACTER_EFFECTS,
  narrativeStates: SEED_NARRATIVE_STATES,
  consequenceChains: SEED_CONSEQUENCE_CHAINS,
  playerExploration: SEED_PLAYER_EXPLORATION,

  // --- Cinematic (P8) ---
  cinematicDirections: SEED_CINEMATIC_DIRECTIONS,

  // --- Engine Export (P8) ---
  engineExportConfigs: SEED_ENGINE_EXPORT_CONFIGS,

  // --- Collaboration (P8) ---
  collabTasks: SEED_COLLAB_TASKS,
  collabComments: SEED_COLLAB_COMMENTS,
  reviewItems: SEED_REVIEW_ITEMS,
  versionDiffs: SEED_VERSION_DIFFS,

  // --- Pipeline ---
  pipelineStages: SEED_PIPELINE_STAGES,

  // --- QTE ---
  qteConfigs: SEED_QTE_CONFIGS,
  hotspotConfigs: SEED_HOTSPOT_CONFIGS,

  // --- Factory ---
  factoryTasks: SEED_FACTORY_TASKS,
};

export const useNarrativeStore = create<NarrativeStoreState>()(
  persist(
    (set) => ({
      // --- Initialize from seed ---
      ...seedState,

      // --- Node Actions ---
      updateNode: (id, updates) => {
        set(state => ({
          storyNodes: state.storyNodes.map(node =>
            node.id === id ? { ...node, ...updates } : node
          ),
        }));
      },

      addNode: (node) => {
        set(state => ({
          storyNodes: [...state.storyNodes, node],
        }));
      },

      removeNode: (id) => {
        set(state => ({
          storyNodes: state.storyNodes.filter(node => node.id !== id),
          nodeEdges: state.nodeEdges.filter(edge => edge.from !== id && edge.to !== id),
        }));
      },

      // --- Edge Actions ---
      addEdge: (edge) => {
        set(state => ({
          nodeEdges: [...state.nodeEdges, edge],
        }));
      },

      removeEdge: (from, to) => {
        set(state => ({
          nodeEdges: state.nodeEdges.filter(
            edge => !(edge.from === from && edge.to === to)
          ),
        }));
      },

      // --- Variable Actions ---
      updateVariable: (id, updates) => {
        set(state => ({
          variables: state.variables.map(v =>
            v.id === id ? { ...v, ...updates } : v
          ),
        }));
      },

      addVariable: (variable) => {
        set(state => ({
          variables: [...state.variables, variable],
        }));
      },

      // --- Quality Actions ---
      updateQualityCheck: (id, updates) => {
        set(state => ({
          qualityChecks: state.qualityChecks.map(qc =>
            qc.id === id ? { ...qc, ...updates } : qc
          ),
        }));
      },

      // --- Interaction Actions ---
      updateInteractionPoint: (id, updates) => {
        set(state => ({
          interactionPoints: state.interactionPoints.map(ip =>
            ip.id === id ? { ...ip, ...updates } : ip
          ),
        }));
      },

      // --- Character Actions ---
      updateCharacter: (id, updates) => {
        set(state => ({
          characters: state.characters.map(c =>
            c.id === id ? { ...c, ...updates } : c
          ),
        }));
      },

      // --- World Rule Actions ---
      updateWorldRule: (id, updates) => {
        set(state => ({
          worldRules: state.worldRules.map(wr =>
            wr.id === id ? { ...wr, ...updates } : wr
          ),
        }));
      },

      // --- Chapter Plan Actions ---
      updateChapterPlan: (id, updates) => {
        set(state => ({
          chapterPlans: state.chapterPlans.map(cp =>
            cp.id === id ? { ...cp, ...updates } : cp
          ),
        }));
      },

      // --- Collaboration Actions ---
      updateCollabTask: (id, updates) => {
        set(state => ({
          collabTasks: state.collabTasks.map(ct =>
            ct.id === id ? { ...ct, ...updates } : ct
          ),
        }));
      },

      addCollabComment: (comment) => {
        set(state => ({
          collabComments: [...state.collabComments, comment],
        }));
      },

      // --- Bulk Load ---
      loadProjectData: (data) => {
        set(data as Partial<NarrativeStoreState>);
      },

      resetToDefaults: () => {
        set(seedState);
      },
    }),
    {
      name: 'cd-narrative',
    }
  )
);
