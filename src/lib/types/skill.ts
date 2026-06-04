// ChaseDream Creator Studio — Skill Accumulation Types
// Skill 经验沉淀系统：将创作工作流结晶为可复用的专业知识包

import type { ExpertQualityStandard, DecisionRule } from './expert';

// ── Skill 领域分类 ───────────────────────────────────────────────────────

export type SkillDomain =
  | 'narrative'
  | 'interaction'
  | 'cinematic'
  | 'asset'
  | 'gameplay'
  | 'qa'
  | 'publish';

// ── Skill 来源 ───────────────────────────────────────────────────────────

export type SkillSource = 'system' | 'expert' | 'user';

// ── Skill 工作流步骤 ─────────────────────────────────────────────────────

export interface SkillStep {
  order: number;
  /** 步骤描述 */
  action: string;
  /** 使用的工具/功能模块 */
  tools?: string[];
  /** 预期产出 */
  expectedOutput: string;
  /** 该步骤的质量门禁 */
  qualityGate?: ExpertQualityStandard;
  /** 专家经验提示 */
  tips?: string[];
}

// ── 工具使用模式 ─────────────────────────────────────────────────────────

export interface ToolPattern {
  /** 工具名称："AI 润色" / "热力图分析" / "一致性引擎" */
  toolName: string;
  /** 何时使用 */
  whenToUse: string;
  /** 使用要点 */
  howToUse: string;
  /** 常见误区 */
  commonMistakes: string[];
}

// ── Skill 定义 ───────────────────────────────────────────────────────────

export interface Skill {
  id: string;
  name: string;
  description: string;
  domain: SkillDomain;
  tags: string[];

  // ── 知识包核心 ──
  /** 工作流步骤序列 */
  workflow: SkillStep[];
  /** 质量标准集 */
  qualityCriteria: ExpertQualityStandard[];
  /** 决策规则集 */
  decisionRules: DecisionRule[];
  /** 工具使用模式 */
  toolPatterns: ToolPattern[];

  // ── 元数据 ──
  createdBy: SkillSource;
  /** 由哪个 Expert 沉淀（仅 expert 来源） */
  sourceExpertId?: string;
  /** 来自哪次创作会话（仅 expert 来源） */
  sourceSessionId?: string;
  /** 被调用次数 */
  usageCount: number;
  /** 用户反馈累积评分 0-100 */
  effectivenessScore: number;
  version: number;

  // ── 组合能力 ──
  /** 可与哪些 Skill 组合（Skill id 列表） */
  composableWith: string[];
  /** 前置依赖 Skill（Skill id 列表） */
  requires: string[];

  /** 创建时间 */
  createdAt?: string;
  /** 最后使用时间 */
  lastUsedAt?: string;
}

// ── Skill 执行记录 ───────────────────────────────────────────────────────

export type SkillExecutionStatus = 'running' | 'completed' | 'failed' | 'cancelled';

export interface SkillExecution {
  id: string;
  skillId: string;
  /** 执行者 Expert ID */
  expertId?: string;
  /** 管线阶段（触发时的阶段 index） */
  pipelineStage?: number;
  /** 各步骤的执行状态 */
  stepResults: SkillStepResult[];
  status: SkillExecutionStatus;
  startedAt: string;
  completedAt?: string;
  /** 执行过程中创建/修改的数据 ID */
  producedDataIds: string[];
}

export interface SkillStepResult {
  stepOrder: number;
  status: 'pending' | 'running' | 'completed' | 'skipped' | 'failed';
  /** 实际产出描述 */
  actualOutput?: string;
  /** 质量门禁是否通过 */
  qualityPassed?: boolean;
  /** 耗时（毫秒） */
  duration?: number;
}

// ── Skill 管线关联配置 ───────────────────────────────────────────────────

export interface SkillPipelineMapping {
  /** 管线阶段 index（0-based） */
  stageIndex: number;
  /** 推荐 Skill id 列表 */
  recommendedSkillIds: string[];
  /** 自动加载（true）还是手动选择（false） */
  autoLoad: boolean;
}
