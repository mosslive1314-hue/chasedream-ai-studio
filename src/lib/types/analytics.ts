// ChaseDream Creator Studio — Analytics Types
// 数据分析：玩家行为追踪、选择分布、漏斗分析和留存指标

// ── 玩家会话 ──────────────────────────────────────────────────────────────

export interface PlayerSession {
  id: string;
  /** 匿名化的玩家标识 */
  playerId: string;
  /** 开始时间 */
  startedAt: string;
  /** 结束时间 */
  endedAt?: string;
  /** 会话时长（秒） */
  duration: number;
  /** 访问的节点序列 */
  nodePath: string[];
  /** 做出的选择序列 */
  choicesMade: PlayerChoice[];
  /** 最终到达的结局节点 ID */
  endingReached?: string;
  /** 设备类型 */
  deviceType: 'desktop' | 'mobile' | 'tablet';
  /** 浏览器/引擎 */
  platform: string;
  /** 会话完成度（0-100） */
  completionPct: number;
  /** 是否中途放弃 */
  abandoned: boolean;
  /** 放弃时的节点 ID */
  abandonedAtNode?: string;
}

export interface PlayerChoice {
  /** 选择点所在的节点 ID */
  nodeId: string;
  /** 选择的选项索引 */
  choiceIndex: number;
  /** 选择的文本 */
  choiceText: string;
  /** 选择时的时间戳 */
  timestamp: string;
  /** 选择前的犹豫时间（秒） */
  hesitationTime: number;
}

// ── 选择分布 ──────────────────────────────────────────────────────────────

export interface ChoiceDistribution {
  /** 节点 ID */
  nodeId: string;
  /** 节点名称 */
  nodeName: string;
  /** 各选项的选择次数 */
  optionStats: OptionStat[];
  /** 总选择次数 */
  totalChoices: number;
  /** 平均犹豫时间（秒） */
  avgHesitationTime: number;
}

export interface OptionStat {
  /** 选项索引 */
  choiceIndex: number;
  /** 选项文本 */
  choiceText: string;
  /** 选择次数 */
  count: number;
  /** 选择占比 (0-1) */
  ratio: number;
  /** 平均犹豫时间（秒） */
  avgHesitation: number;
}

// ── 漏斗分析 ──────────────────────────────────────────────────────────────

export interface FunnelAnalysis {
  /** 漏斗名称 */
  name: string;
  /** 漏斗步骤 */
  steps: FunnelStep[];
  /** 总进入人数 */
  totalEntries: number;
  /** 总完成人数 */
  totalCompleted: number;
  /** 整体转化率 (0-1) */
  conversionRate: number;
}

export interface FunnelStep {
  /** 步骤名称 */
  name: string;
  /** 对应的节点 ID */
  nodeId?: string;
  /** 到达此步骤的人数 */
  reached: number;
  /** 流失人数 */
  dropped: number;
  /** 步骤转化率 (0-1) */
  stepConversionRate: number;
  /** 平均停留时间（秒） */
  avgTimeSpent: number;
}

// ── 留存指标 ──────────────────────────────────────────────────────────────

export interface RetentionMetrics {
  /** 统计周期 */
  period: 'day' | 'week' | 'month';
  /** 各天的留存率 */
  cohorts: RetentionCohort[];
  /** D1 留存率 */
  d1Retention: number;
  /** D7 留存率 */
  d7Retention: number;
  /** D30 留存率 */
  d30Retention: number;
}

export interface RetentionCohort {
  /** 群组日期 (YYYY-MM-DD) */
  date: string;
  /** 当日新增玩家数 */
  newPlayers: number;
  /** 各天的回访率 */
  dayRetention: number[];
}

// ── 热力图数据 ────────────────────────────────────────────────────────────

export interface HeatmapData {
  /** 节点访问热力 */
  nodeHeatmap: NodeHeatEntry[];
  /** 选择热力 */
  choiceHeatmap: ChoiceHeatEntry[];
  /** 时间段热力（按小时 0-23） */
  hourlyActivity: number[];
}

export interface NodeHeatEntry {
  nodeId: string;
  nodeName: string;
  /** 访问次数 */
  visits: number;
  /** 流失率 (0-1) */
  dropoffRate: number;
  /** 平均停留时间（秒） */
  avgTimeSpent: number;
  /** 热度分数 (0-100) */
  heatScore: number;
}

export interface ChoiceHeatEntry {
  nodeId: string;
  choiceIndex: number;
  /** 选择次数 */
  count: number;
  /** 选择后续完成率 (0-1) */
  completionAfterChoice: number;
}

// ── A/B 测试 ──────────────────────────────────────────────────────────────

export interface ABTestConfig {
  id: string;
  name: string;
  description: string;
  /** 测试的节点 ID */
  targetNodeId: string;
  /** 变体配置 */
  variants: ABVariant[];
  /** 状态 */
  status: 'draft' | 'running' | 'completed' | 'cancelled';
  /** 开始时间 */
  startedAt?: string;
  /** 结束时间 */
  endedAt?: string;
  /** 所需样本量 */
  requiredSampleSize: number;
  /** 当前样本量 */
  currentSampleSize: number;
}

export interface ABVariant {
  id: string;
  name: string;
  /** 流量分配比例 (0-1) */
  trafficSplit: number;
  /** 变体的指标 */
  metrics?: ABVariantMetrics;
}

export interface ABVariantMetrics {
  /** 完成率 (0-1) */
  completionRate: number;
  /** 平均会话时长（秒） */
  avgSessionDuration: number;
  /** 选择点击率 (0-1) */
  choiceClickRate: number;
  /** 满意度评分 (0-100) */
  satisfactionScore: number;
}

// ── 聚合报告 ──────────────────────────────────────────────────────────────

export interface AnalyticsReport {
  id: string;
  projectId: string;
  generatedAt: string;
  /** 统计时间范围 */
  dateRange: { start: string; end: string };
  /** 总览指标 */
  summary: ReportSummary;
  /** 选择分布 */
  choiceDistributions: ChoiceDistribution[];
  /** 漏斗 */
  funnels: FunnelAnalysis[];
  /** 热力图 */
  heatmap: HeatmapData;
  /** 留存 */
  retention: RetentionMetrics;
}

export interface ReportSummary {
  totalSessions: number;
  avgSessionDuration: number;
  completionRate: number;
  abandonmentRate: number;
  uniqueEndings: number;
  avgChoicesPerSession: number;
  topEndingId?: string;
  topEndingName?: string;
}
