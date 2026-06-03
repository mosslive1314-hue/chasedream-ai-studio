// ChaseDream Creator Studio — Advanced Narrative Types

// ── 多主角叙事时间线（P7-7）─────────────────────────────────────────────

export type CharacterStatus = 'alive' | 'injured' | 'missing' | 'captured' | 'betrayed' | 'dead';

export interface CharacterTimelineEvent {
  id: string;
  chapterId: string;
  nodeIds: string[];
  eventTitle: string;
  description: string;
  statusChange?: { from: CharacterStatus; to: CharacterStatus };
  choiceMade?: string;
  impactOnOthers?: { characterId: string; effect: string }[];
}

export interface CharacterTimeline {
  characterId: string;
  characterName: string;
  color: string;
  status: CharacterStatus;
  storyArc: string;           // e.g., "从怀疑到信任的救赎之路"
  chapters: string[];          // which chapters this character appears in
  events: CharacterTimelineEvent[];
  relationships: { targetId: string; type: string; strength: number }[]; // -100 to 100
  /** 角色死亡/退出时锁死的子图配置 ID */
  subgraphLockId?: string;
  /** 角色是否可被玩家操控 */
  isPlayable?: boolean;
}

// Cross-character impact matrix
export interface CrossCharacterEffect {
  id: string;
  sourceCharacterId: string;
  sourceEvent: string;       // event description
  sourceNodeId: string;
  targetCharacterId: string;
  effectType: 'help' | 'harm' | 'info' | 'betrayal' | 'ignore';
  effectDescription: string;
  delayed: boolean;          // whether effect is immediate or delayed
  triggerChapter?: string;   // if delayed, when does it trigger
}

// ── 叙事状态机（P7-8）─────────────────────────────────────────────

export type StateCategory = 'character' | 'relationship' | 'world' | 'plot';
export type StateValueType = 'enum' | 'numeric' | 'boolean';

export interface NarrativeState {
  id: string;
  category: StateCategory;
  categoryLabel: string;
  name: string;
  valueType: StateValueType;
  // For enum type
  enumValues?: string[];
  currentValue?: string;
  // For numeric type
  minValue?: number;
  maxValue?: number;
  numericValue?: number;
  // For boolean type
  boolValue?: boolean;
  description: string;
  modifiedAt: string[];     // nodeIds where this state changes
  readAt: string[];         // nodeIds where this state is checked
  dependsOn?: string[];     // other state IDs this state depends on
  affectsEndings?: string[]; // which endings this state can influence
}

// ── 选择后果追踪链（P7-9）─────────────────────────────────────────────

export type ConsequenceTiming = 'immediate' | 'delayed' | 'ending';

export interface ConsequenceChain {
  id: string;
  sourceNodeId: string;
  sourceChoiceLabel: string;
  timing: ConsequenceTiming;
  timingLabel: string;        // human-readable timing description
  affectedNodeIds: string[];  // where the consequence manifests
  affectedStates: string[];   // which narrative states are affected
  affectedCharacters: string[]; // which characters are impacted
  description: string;        // what happens as a result
  visualColor: string;        // for UI: green=immediate, yellow=delayed, red=ending
  resolved: boolean;          // whether this consequence has been "paid off" in the story
  payoffNodeId?: string;      // where the consequence is finally resolved
}

// ── 玩家探索图数据（P7-11）─────────────────────────────────────────────

export interface PlayerExplorationSession {
  id: string;
  sessionLabel: string;
  playthroughNumber: number;   // 第几次游玩
  visitedNodeIds: string[];    // 本次游玩访问的节点
  discoveredBranchIds: string[]; // 本次发现的分支
  reachedEndingIds: string[];   // 本次到达的结局
  choicesMade: { nodeId: string; choiceLabel: string }[];
  duration: number;            // seconds
  timestamp: string;
}

export interface PlayerExplorationMap {
  allNodeIds: string[];        // all nodes in the project
  allEndingIds: string[];      // all possible endings
  allBranchCount: number;      // total number of branches
  sessions: PlayerExplorationSession[];
  // Aggregated stats
  totalPlaythroughs: number;
  nodeCoverage: number;        // 0-100, % of all nodes visited across all sessions
  endingCoverage: number;      // 0-100, % of all endings reached
  branchCoverage: number;      // 0-100, % of all branches explored
  undiscoveredNodes: string[]; // nodes never visited
  undiscoveredEndings: string[]; // endings never reached
}
