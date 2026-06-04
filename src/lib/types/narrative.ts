// ChaseDream Creator Studio — Narrative Types

import type { Condition } from '../condition-engine';

// Node graph data
export type NodeType = 'start' | 'scene' | 'choice' | 'condition' | 'qte' | 'ending_good' | 'ending_bad';

export type EdgeType = 'causal' | 'conditional' | 'parallel' | 'exclusive' | 'implied';

export type InteractionType = 'exploration' | 'dialogue' | 'decision' | 'confrontation';

export interface StoryNode {
  id: string;
  label: string;
  type: NodeType;
  x: number;
  y: number;
  hasError?: boolean;
  errorMsg?: string;
  /** POV 视角角色 ID（Detroit 多主角系统） */
  povCharacterId?: string;
  /** POV 叙事风格 */
  povStyle?: 'first_person' | 'third_person' | 'over_shoulder';
  /** 该节点的角色造型覆盖（换装系统）：characterId → outfitId */
  characterOutfitOverrides?: Record<string, string>;
}

export interface NodeEdge {
  from: string;
  to: string;
  label?: string;
  edgeType?: EdgeType;    // typed edge relationship
  condition?: Condition;   // optional condition for conditional edges
}

// ── 叙事设计意图（P0-3）─────────────────────────────────────────────────────

export interface NarrativeIntent {
  nodeId: string;
  purpose: 'push_conflict' | 'reveal_info' | 'choice_pressure' | 'emotional_climax' | 'setup_payoff' | 'resolution';
  purposeLabel: string;
  choiceImpact?: string;
  variableChanges?: { variable: string; operation: string; value: number }[];
  emotionValue: number; // 1-10 tension
  failFeedback?: string;
}

// ── 质量检查系统（P0-4）─────────────────────────────────────────────────────

export type QCCategory = 'structure' | 'narrative' | 'assets' | 'publish';

export interface QualityCheck {
  id: string;
  category: QCCategory;
  categoryLabel: string;
  label: string;
  status: 'ok' | 'warn' | 'error';
  detail: string;
  fixLink?: string;
}

// ── 世界观设定（统一）─────────────────────────────────────────────────────

export interface WorldBuildingEntry {
  category: string;
  content: string;
}

// ── 分支路径（统一）─────────────────────────────────────────────────────────

export interface BranchPath {
  id: string;
  label: string;
  nodes: string[];
  ending: string;
  type: 'good' | 'bad';
}

// ── 阶段检查（NodesScreen 侧边栏）─────────────────────────────────────────

export interface StageCheck {
  label: string;
  detail: string;
  status: 'ok' | 'warn';
}

// ── 剧本 Blocks（ScriptScreen）─────────────────────────────────────────────

export type ScriptBlockType = 'scene' | 'narr' | 'dialog' | 'choice' | 'cond';

export interface ScriptBlock {
  id: string;
  type: ScriptBlockType;
  label: string;
  char?: string;
  content: string;
  options?: string[];
  color: string;
  /** 内嵌演出指令（脚本 DSL） */
  directives?: import('./detroit-features').ScriptDirective[];
}

// ── 热力图模拟数据（P2-13）─────────────────────────────────────────────

export interface HeatmapEntry {
  nodeId: string;
  visitRate: number;       // 0-100, 玩家到达率
  avgTimeSpent: number;    // 秒, 平均停留时间
  choiceDistribution?: number[]; // 选择分布百分比（仅选择节点）
  dropOffRate: number;     // 0-100, 玩家流失率
  heatLevel: 'hot' | 'warm' | 'cool' | 'cold';
  playCount: number;       // 总游玩次数
  completionRate: number;  // 0-100, 从该节点到结局的完成率
}

// ── 章节规划数据（P3-2）─────────────────────────────────────────────

export interface ChapterEvent {
  id: string;
  title: string;
  description: string;
  isBranchPoint: boolean;
  branchOptions?: { label: string; consequence: string }[];
  variableHints?: string[];
}

export interface ChapterPlan {
  id: string;
  chapterNumber: number;
  title: string;
  themeQuestion: string;
  emotionArc: string;
  events: ChapterEvent[];
  keyDialogue?: string;
  characterStates?: string;
  suspenseHook?: string;
  chapterEndHook?: string;
  estimatedDuration: string;
  /** 章节变体（根据前置选择激活不同版本） */
  variants?: import('./detroit-features').ChapterVariant[];
}

// ── 世界规则数据（P3-4）─────────────────────────────────────────────

export type WorldRuleType = 'setting' | 'character_constraint' | 'permanent_rule' | 'narrative_taboo' | 'tension_check';

export interface WorldRule {
  id: string;
  type: WorldRuleType;
  typeLabel: string;
  title: string;
  description: string;
  severity: 'hard' | 'soft' | 'suggestion';
  relatedCharacters?: string[];
  relatedScenes?: string[];
  validated: boolean;
}

// ── 互动点设计数据（P3-3）─────────────────────────────────────────────

export interface InteractionOption {
  label: string;
  consequence: string;
  variableEffect?: string;
  pathEffect?: string;
  longTermImpact?: string;
  visibleCondition?: string;
}

export interface InteractionPoint {
  id: string;
  name: string;
  nodeId: string;
  chapterId: string;
  playerIntent: string;
  options: InteractionOption[];
  feedback: string;
  failureFeedback?: string;
  emotionIntensity: number;   // 1-10
  narrativePurpose: string;
  tested: boolean;
  visibleCondition?: string;
  interactionType?: InteractionType;  // exploration | dialogue | decision | confrontation
  /** 限时选择配置（Detroit 限时决策系统） */
  timedDecision?: import('./detroit-features').TimedDecisionConfig;
}

// ── 制作管线阶段数据（P3-1）─────────────────────────────────────────────

export interface PipelineStage {
  id: string;
  order: number;
  name: string;
  description: string;
  icon: string;           // emoji
  status: 'completed' | 'active' | 'upcoming' | 'blocked';
  progress: number;       // 0-100
  artifacts: string[];    // 已产出物
  issues: string[];       // 当前问题
  nextAction: string;     // 下一步操作提示
  requiresHumanConfirm: boolean;
  linkedPage?: string;    // 关联页面路由
}

// ── 路径自动测试数据（P4-9）─────────────────────────────────────────────

export interface PathTestResult {
  pathId: string;
  pathLabel: string;
  nodes: string[];
  ending: string;
  endingType: 'good' | 'bad' | 'unknown';
  reachable: boolean;
  stuck: boolean;
  missingAssets: string[];
  variableErrors: string[];
  emptyDialogues: string[];
  totalDuration: number;  // 秒
  testTime: string;
  passed: boolean;
}
