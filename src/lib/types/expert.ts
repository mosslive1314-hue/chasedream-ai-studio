// ChaseDream Creator Studio — Expert System Types
// 专家系统：封装领域知识、质量标准和决策框架

// ── Expert 人格类型 ──────────────────────────────────────────────────────

export type ExpertPersonality = 'analytical' | 'creative' | 'pragmatic' | 'meticulous';

// ── 质量标准 ──────────────────────────────────────────────────────────────

export type QualityCheckMethod = 'auto' | 'review' | 'playtest';

export interface ExpertQualityStandard {
  /** 评估维度："叙事节奏" / "分支覆盖度" / "视觉一致性" */
  dimension: string;
  criteria: string;
  /** 最低通过分数 0-100 */
  minScore: number;
  checkMethod: QualityCheckMethod;
}

// ── 决策规则 ──────────────────────────────────────────────────────────────

export interface DecisionOption {
  label: string;
  rationale: string;
  risk: string;
}

export interface DecisionRule {
  /** 触发条件描述 */
  condition: string;
  options: DecisionOption[];
  /** 推荐选项的 label */
  recommendation: string;
}

// ── Expert 定义 ───────────────────────────────────────────────────────────

export interface Expert {
  id: string;
  name: string;
  /** 角色名称："编剧顾问" / "镜头语言专家" / "互动设计师" 等 */
  role: string;
  avatar: string;
  description: string;
  /** 关联的 Skill id 列表 */
  domainSkills: string[];
  /** 在哪些管线阶段主动介入（0-based index） */
  pipelineStages: number[];
  /** 自动激活的触发条件关键词 */
  activationTriggers: string[];
  /** 质量标准集 */
  qualityStandards: ExpertQualityStandard[];
  /** 决策框架 */
  decisionFramework: DecisionRule[];
  personality: ExpertPersonality;
  /** Expert 主动建议的触发规则 */
  proactiveRules: ProactiveRule[];
}

// ── 主动建议规则 ──────────────────────────────────────────────────────────

export type ProactiveTriggerType =
  | 'page_enter'
  | 'data_threshold'
  | 'pipeline_stage'
  | 'error_detected'
  | 'idle_timeout';

export interface ProactiveRule {
  id: string;
  triggerType: ProactiveTriggerType;
  /** 触发条件（JSONPath 或自定义表达式） */
  condition: string;
  /** 建议消息模版 */
  messageTemplate: string;
  /** 优先级：high 会弹出提醒，low 只在面板内显示 */
  priority: 'high' | 'medium' | 'low';
  /** 冷却时间（秒），避免重复提醒 */
  cooldownSeconds: number;
}

// ── Expert 实例（运行时状态） ─────────────────────────────────────────────

export type ExpertRunStatus =
  | 'idle'
  | 'thinking'
  | 'planning'
  | 'generating'
  | 'reviewing'
  | 'waiting_confirmation';

export interface ExpertInstance {
  expertId: string;
  status: ExpertRunStatus;
  /** 当前 Expert 上下文中加载的 Skill ID */
  loadedSkillIds: string[];
  /** 本次会话中 Expert 已推送的建议数量 */
  proactiveCount: number;
  /** 上次主动建议的时间戳 */
  lastProactiveAt?: string;
}

// ── Expert Handoff（专家间协作） ──────────────────────────────────────────

export interface ExpertHandoff {
  id: string;
  fromExpertId: string;
  toExpertId: string;
  /** 交接数据摘要 */
  contextSummary: string;
  /** 交接的数据 ID 列表（节点、变量、资产等） */
  dataRefs: string[];
  timestamp: string;
}
