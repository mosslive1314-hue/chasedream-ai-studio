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
  EntityRelation,
  CharacterSceneAppearance,
  POVConfig,
  TimedDecisionConfig,
  SubgraphLock,
  RelationshipMeter,
  RelationshipDelta,
  ChapterVariant,
  DialogueTree,
  Evidence,
  Clue,
  Deduction,
  MoralAxis,
  PathTimeEstimate,
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
import {
  ENTITY_RELATIONS as SEED_ENTITY_RELATIONS,
  CHARACTER_SCENE_APPEARANCES as SEED_CHARACTER_SCENE_APPEARANCES,
} from '@/lib/seed/game-seed';
import {
  SEED_POV_CONFIGS,
  SEED_TIMED_DECISIONS,
  SEED_SUBGRAPH_LOCKS,
  SEED_RELATIONSHIP_METERS,
  SEED_CHAPTER_VARIANTS,
  SEED_DIALOGUE_TREES,
  SEED_EVIDENCE,
  SEED_CLUES,
  SEED_DEDUCTIONS,
  SEED_MORAL_AXES,
  SEED_PATH_TIME_ESTIMATES,
} from '@/lib/studio-data';

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

  // --- Entity Relations (P11) ---
  entityRelations: EntityRelation[];
  characterSceneAppearances: CharacterSceneAppearance[];

  // --- Detroit: Become Human Features ---
  povConfigs: POVConfig[];
  timedDecisions: TimedDecisionConfig[];
  subgraphLocks: SubgraphLock[];
  relationshipMeters: RelationshipMeter[];
  chapterVariants: ChapterVariant[];
  dialogueTrees: DialogueTree[];
  evidence: Evidence[];
  clues: Clue[];
  deductions: Deduction[];
  moralAxes: MoralAxis[];
  pathTimeEstimates: PathTimeEstimate[];

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

  // --- Script Block Actions ---
  updateScriptBlock: (id: string, updates: Partial<ScriptBlock>) => void;
  addScriptBlock: (block: ScriptBlock) => void;
  removeScriptBlock: (id: string) => void;

  // --- UI Template Actions ---
  updateUITemplate: (id: string, updates: Partial<UITemplate>) => void;
  addUITemplate: (template: UITemplate) => void;

  // --- Game UI Settings ---
  updateGameUISettings: (updates: Partial<GameUISettings>) => void;

  // --- Scene/Prop/Character Add Actions ---
  addScene: (scene: GameScene) => void;
  addProp: (prop: GameProp) => void;
  addCharacter: (character: GameCharacter) => void;

  // --- Cinematic Direction Actions ---
  updateCinematicDirection: (id: string, updates: Partial<CinematicDirection>) => void;

  // --- Collaboration Actions ---
  updateCollabTask: (id: string, updates: Partial<CollabTask>) => void;
  addCollabComment: (comment: CollabComment) => void;

  // --- POV Config Actions ---
  updatePOVConfig: (id: string, updates: Partial<POVConfig>) => void;
  addPOVConfig: (config: POVConfig) => void;

  // --- Timed Decision Actions ---
  updateTimedDecision: (interactionPointId: string, config: TimedDecisionConfig | undefined) => void;

  // --- Subgraph Lock Actions ---
  addSubgraphLock: (lock: SubgraphLock) => void;
  updateSubgraphLock: (id: string, updates: Partial<SubgraphLock>) => void;
  removeSubgraphLock: (id: string) => void;

  // --- Relationship Meter Actions ---
  addRelationshipMeter: (meter: RelationshipMeter) => void;
  updateRelationshipMeter: (id: string, updates: Partial<RelationshipMeter>) => void;
  addRelationshipDelta: (meterId: string, delta: RelationshipDelta) => void;

  // --- Chapter Variant Actions ---
  addChapterVariant: (chapterPlanId: string, variant: ChapterVariant) => void;
  updateChapterVariant: (chapterPlanId: string, variantId: string, updates: Partial<ChapterVariant>) => void;

  // --- Dialogue Tree Actions ---
  addDialogueTree: (tree: DialogueTree) => void;
  updateDialogueTree: (id: string, updates: Partial<DialogueTree>) => void;
  removeDialogueTree: (id: string) => void;

  // --- Evidence/Clue/Deduction Actions ---
  addEvidence: (evidence: Evidence) => void;
  updateEvidence: (id: string, updates: Partial<Evidence>) => void;
  addClue: (clue: Clue) => void;
  updateClue: (id: string, updates: Partial<Clue>) => void;
  addDeduction: (deduction: Deduction) => void;
  updateDeduction: (id: string, updates: Partial<Deduction>) => void;

  // --- Moral Axis Actions ---
  addMoralAxis: (axis: MoralAxis) => void;
  updateMoralAxis: (id: string, updates: Partial<MoralAxis>) => void;

  // --- Path Time Estimate Actions ---
  updatePathTimeEstimate: (pathId: string, estimate: PathTimeEstimate) => void;

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

  // --- Entity Relations (P11) ---
  entityRelations: SEED_ENTITY_RELATIONS,
  characterSceneAppearances: SEED_CHARACTER_SCENE_APPEARANCES,

  // --- Detroit: Become Human Features ---
  povConfigs: SEED_POV_CONFIGS,
  timedDecisions: SEED_TIMED_DECISIONS,
  subgraphLocks: SEED_SUBGRAPH_LOCKS,
  relationshipMeters: SEED_RELATIONSHIP_METERS,
  chapterVariants: SEED_CHAPTER_VARIANTS,
  dialogueTrees: SEED_DIALOGUE_TREES,
  evidence: SEED_EVIDENCE,
  clues: SEED_CLUES,
  deductions: SEED_DEDUCTIONS,
  moralAxes: SEED_MORAL_AXES,
  pathTimeEstimates: SEED_PATH_TIME_ESTIMATES,
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

      // --- Script Block Actions ---
      updateScriptBlock: (id, updates) => {
        set(state => ({
          scriptBlocks: state.scriptBlocks.map(sb =>
            sb.id === id ? { ...sb, ...updates } : sb
          ),
        }));
      },

      addScriptBlock: (block) => {
        set(state => ({
          scriptBlocks: [...state.scriptBlocks, block],
        }));
      },

      removeScriptBlock: (id) => {
        set(state => ({
          scriptBlocks: state.scriptBlocks.filter(sb => sb.id !== id),
        }));
      },

      // --- UI Template Actions ---
      updateUITemplate: (id, updates) => {
        set(state => ({
          uiTemplates: state.uiTemplates.map(t =>
            t.id === id ? { ...t, ...updates } : t
          ),
        }));
      },

      addUITemplate: (template) => {
        set(state => ({
          uiTemplates: [...state.uiTemplates, template],
        }));
      },

      // --- Game UI Settings ---
      updateGameUISettings: (updates) => {
        set(state => ({
          gameUISettings: { ...state.gameUISettings, ...updates },
        }));
      },

      // --- Scene/Prop/Character Add Actions ---
      addScene: (scene) => {
        set(state => ({
          scenes: [...state.scenes, scene],
        }));
      },

      addProp: (prop) => {
        set(state => ({
          props: [...state.props, prop],
        }));
      },

      addCharacter: (character) => {
        set(state => ({
          characters: [...state.characters, character],
        }));
      },

      // --- Cinematic Direction Actions ---
      updateCinematicDirection: (id, updates) => {
        set(state => ({
          cinematicDirections: state.cinematicDirections.map(cd =>
            cd.nodeId === id ? { ...cd, ...updates } : cd
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

      // --- POV Config Actions ---
      updatePOVConfig: (id, updates) => {
        set(state => ({
          povConfigs: state.povConfigs.map(c =>
            c.id === id ? { ...c, ...updates } : c
          ),
        }));
      },

      addPOVConfig: (config) => {
        set(state => ({
          povConfigs: [...state.povConfigs, config],
        }));
      },

      // --- Timed Decision Actions ---
      updateTimedDecision: (interactionPointId, config) => {
        set(state => ({
          timedDecisions: config
            ? state.timedDecisions.some(td => td.interactionPointId === interactionPointId)
              ? state.timedDecisions.map(td => td.interactionPointId === interactionPointId ? config : td)
              : [...state.timedDecisions, config]
            : state.timedDecisions.filter(td => td.interactionPointId !== interactionPointId),
        }));
      },

      // --- Subgraph Lock Actions ---
      addSubgraphLock: (lock) => {
        set(state => ({
          subgraphLocks: [...state.subgraphLocks, lock],
        }));
      },

      updateSubgraphLock: (id, updates) => {
        set(state => ({
          subgraphLocks: state.subgraphLocks.map(l =>
            l.id === id ? { ...l, ...updates } : l
          ),
        }));
      },

      removeSubgraphLock: (id) => {
        set(state => ({
          subgraphLocks: state.subgraphLocks.filter(l => l.id !== id),
        }));
      },

      // --- Relationship Meter Actions ---
      addRelationshipMeter: (meter) => {
        set(state => ({
          relationshipMeters: [...state.relationshipMeters, meter],
        }));
      },

      updateRelationshipMeter: (id, updates) => {
        set(state => ({
          relationshipMeters: state.relationshipMeters.map(m =>
            m.id === id ? { ...m, ...updates } : m
          ),
        }));
      },

      addRelationshipDelta: (meterId, delta) => {
        set(state => ({
          relationshipMeters: state.relationshipMeters.map(m =>
            m.id === meterId
              ? { ...m, currentValue: Math.max(m.minValue, Math.min(m.maxValue, m.currentValue + delta.delta)), history: [...m.history, delta] }
              : m
          ),
        }));
      },

      // --- Chapter Variant Actions ---
      addChapterVariant: (chapterPlanId, variant) => {
        set(state => ({
          chapterVariants: [...state.chapterVariants, variant],
        }));
      },

      updateChapterVariant: (chapterPlanId, variantId, updates) => {
        set(state => ({
          chapterVariants: state.chapterVariants.map(v =>
            v.id === variantId ? { ...v, ...updates } : v
          ),
        }));
      },

      // --- Dialogue Tree Actions ---
      addDialogueTree: (tree) => {
        set(state => ({
          dialogueTrees: [...state.dialogueTrees, tree],
        }));
      },

      updateDialogueTree: (id, updates) => {
        set(state => ({
          dialogueTrees: state.dialogueTrees.map(t =>
            t.id === id ? { ...t, ...updates } : t
          ),
        }));
      },

      removeDialogueTree: (id) => {
        set(state => ({
          dialogueTrees: state.dialogueTrees.filter(t => t.id !== id),
        }));
      },

      // --- Evidence/Clue/Deduction Actions ---
      addEvidence: (evidence) => {
        set(state => ({
          evidence: [...state.evidence, evidence],
        }));
      },

      updateEvidence: (id, updates) => {
        set(state => ({
          evidence: state.evidence.map(e =>
            e.id === id ? { ...e, ...updates } : e
          ),
        }));
      },

      addClue: (clue) => {
        set(state => ({
          clues: [...state.clues, clue],
        }));
      },

      updateClue: (id, updates) => {
        set(state => ({
          clues: state.clues.map(c =>
            c.id === id ? { ...c, ...updates } : c
          ),
        }));
      },

      addDeduction: (deduction) => {
        set(state => ({
          deductions: [...state.deductions, deduction],
        }));
      },

      updateDeduction: (id, updates) => {
        set(state => ({
          deductions: state.deductions.map(d =>
            d.id === id ? { ...d, ...updates } : d
          ),
        }));
      },

      // --- Moral Axis Actions ---
      addMoralAxis: (axis) => {
        set(state => ({
          moralAxes: [...state.moralAxes, axis],
        }));
      },

      updateMoralAxis: (id, updates) => {
        set(state => ({
          moralAxes: state.moralAxes.map(a =>
            a.id === id ? { ...a, ...updates } : a
          ),
        }));
      },

      // --- Path Time Estimate Actions ---
      updatePathTimeEstimate: (pathId, estimate) => {
        set(state => ({
          pathTimeEstimates: state.pathTimeEstimates.some(p => p.pathId === pathId)
            ? state.pathTimeEstimates.map(p => p.pathId === pathId ? estimate : p)
            : [...state.pathTimeEstimates, estimate],
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
