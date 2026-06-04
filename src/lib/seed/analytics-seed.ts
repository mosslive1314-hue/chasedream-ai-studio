// ChaseDream Creator Studio — Analytics Seed Data
// Mock 分析数据：玩家会话、选择分布、漏斗和留存

import type {
  PlayerSession,
  ChoiceDistribution,
  FunnelAnalysis,
  RetentionMetrics,
  HeatmapData,
  AnalyticsReport,
} from '@/lib/types/analytics';

// ── Mock 玩家会话 ────────────────────────────────────────────────────────

export const MOCK_SESSIONS: PlayerSession[] = [
  {
    id: 'session-001',
    playerId: 'player-alpha',
    startedAt: '2026-05-28T10:15:00Z',
    endedAt: '2026-05-28T10:42:00Z',
    duration: 1620,
    nodePath: ['N01', 'N02', 'N03', 'N05', 'N07', 'N08', 'N10'],
    choicesMade: [
      { nodeId: 'N03', choiceIndex: 0, choiceText: '接受任务', timestamp: '2026-05-28T10:22:00Z', hesitationTime: 4.2 },
      { nodeId: 'N05', choiceIndex: 1, choiceText: '潜行接近', timestamp: '2026-05-28T10:28:00Z', hesitationTime: 6.8 },
      { nodeId: 'N07', choiceIndex: 0, choiceText: '信任线人', timestamp: '2026-05-28T10:35:00Z', hesitationTime: 3.1 },
    ],
    endingReached: 'ending_good',
    deviceType: 'desktop',
    platform: 'Chrome 126',
    completionPct: 100,
    abandoned: false,
  },
  {
    id: 'session-002',
    playerId: 'player-beta',
    startedAt: '2026-05-28T14:30:00Z',
    endedAt: '2026-05-28T14:48:00Z',
    duration: 1080,
    nodePath: ['N01', 'N02', 'N04', 'N06', 'N09'],
    choicesMade: [
      { nodeId: 'N04', choiceIndex: 1, choiceText: '拒绝合作', timestamp: '2026-05-28T14:36:00Z', hesitationTime: 8.5 },
      { nodeId: 'N06', choiceIndex: 0, choiceText: '正面突破', timestamp: '2026-05-28T14:42:00Z', hesitationTime: 2.3 },
    ],
    endingReached: 'ending_bad',
    deviceType: 'mobile',
    platform: 'Safari iOS 19',
    completionPct: 72,
    abandoned: false,
  },
  {
    id: 'session-003',
    playerId: 'player-gamma',
    startedAt: '2026-05-29T09:00:00Z',
    endedAt: '2026-05-29T09:12:00Z',
    duration: 720,
    nodePath: ['N01', 'N02', 'N03'],
    choicesMade: [
      { nodeId: 'N03', choiceIndex: 1, choiceText: '拒绝任务', timestamp: '2026-05-29T09:08:00Z', hesitationTime: 12.1 },
    ],
    deviceType: 'desktop',
    platform: 'Firefox 128',
    completionPct: 28,
    abandoned: true,
    abandonedAtNode: 'N03',
  },
  {
    id: 'session-004',
    playerId: 'player-delta',
    startedAt: '2026-05-29T16:45:00Z',
    endedAt: '2026-05-29T17:15:00Z',
    duration: 1800,
    nodePath: ['N01', 'N02', 'N03', 'N05', 'N07', 'N08', 'N10'],
    choicesMade: [
      { nodeId: 'N03', choiceIndex: 0, choiceText: '接受任务', timestamp: '2026-05-29T16:52:00Z', hesitationTime: 3.0 },
      { nodeId: 'N05', choiceIndex: 0, choiceText: '正面潜入', timestamp: '2026-05-29T16:58:00Z', hesitationTime: 5.4 },
      { nodeId: 'N07', choiceIndex: 1, choiceText: '不信任线人', timestamp: '2026-05-29T17:05:00Z', hesitationTime: 7.2 },
    ],
    endingReached: 'ending_good',
    deviceType: 'tablet',
    platform: 'Chrome Android',
    completionPct: 100,
    abandoned: false,
  },
  {
    id: 'session-005',
    playerId: 'player-epsilon',
    startedAt: '2026-05-30T20:00:00Z',
    endedAt: '2026-05-30T20:25:00Z',
    duration: 1500,
    nodePath: ['N01', 'N02', 'N04', 'N06', 'N07', 'N08', 'N10'],
    choicesMade: [
      { nodeId: 'N04', choiceIndex: 0, choiceText: '接受合作', timestamp: '2026-05-30T20:08:00Z', hesitationTime: 5.5 },
      { nodeId: 'N06', choiceIndex: 1, choiceText: '绕行潜入', timestamp: '2026-05-30T20:14:00Z', hesitationTime: 4.0 },
      { nodeId: 'N07', choiceIndex: 0, choiceText: '信任线人', timestamp: '2026-05-30T20:20:00Z', hesitationTime: 2.8 },
    ],
    endingReached: 'ending_good',
    deviceType: 'desktop',
    platform: 'Edge 126',
    completionPct: 100,
    abandoned: false,
  },
];

// ── Mock 选择分布 ────────────────────────────────────────────────────────

export const MOCK_CHOICE_DISTRIBUTIONS: ChoiceDistribution[] = [
  {
    nodeId: 'N03',
    nodeName: '任务接受',
    optionStats: [
      { choiceIndex: 0, choiceText: '接受任务', count: 3, ratio: 0.75, avgHesitation: 3.6 },
      { choiceIndex: 1, choiceText: '拒绝任务', count: 1, ratio: 0.25, avgHesitation: 12.1 },
    ],
    totalChoices: 4,
    avgHesitationTime: 5.73,
  },
  {
    nodeId: 'N05',
    nodeName: '潜入策略',
    optionStats: [
      { choiceIndex: 0, choiceText: '正面潜入', count: 1, ratio: 0.5, avgHesitation: 5.4 },
      { choiceIndex: 1, choiceText: '潜行接近', count: 1, ratio: 0.5, avgHesitation: 6.8 },
    ],
    totalChoices: 2,
    avgHesitationTime: 6.1,
  },
  {
    nodeId: 'N07',
    nodeName: '线人信任',
    optionStats: [
      { choiceIndex: 0, choiceText: '信任线人', count: 2, ratio: 0.67, avgHesitation: 2.95 },
      { choiceIndex: 1, choiceText: '不信任线人', count: 1, ratio: 0.33, avgHesitation: 7.2 },
    ],
    totalChoices: 3,
    avgHesitationTime: 4.37,
  },
  {
    nodeId: 'N04',
    nodeName: '合作选择',
    optionStats: [
      { choiceIndex: 0, choiceText: '接受合作', count: 1, ratio: 0.5, avgHesitation: 5.5 },
      { choiceIndex: 1, choiceText: '拒绝合作', count: 1, ratio: 0.5, avgHesitation: 8.5 },
    ],
    totalChoices: 2,
    avgHesitationTime: 7.0,
  },
  {
    nodeId: 'N06',
    nodeName: '战斗策略',
    optionStats: [
      { choiceIndex: 0, choiceText: '正面突破', count: 1, ratio: 0.5, avgHesitation: 2.3 },
      { choiceIndex: 1, choiceText: '绕行潜入', count: 1, ratio: 0.5, avgHesitation: 4.0 },
    ],
    totalChoices: 2,
    avgHesitationTime: 3.15,
  },
];

// ── Mock 漏斗分析 ────────────────────────────────────────────────────────

export const MOCK_FUNNELS: FunnelAnalysis[] = [
  {
    name: '主线路完成率',
    steps: [
      { name: '进入故事', nodeId: 'N01', reached: 5, dropped: 0, stepConversionRate: 1.0, avgTimeSpent: 45 },
      { name: '接受任务', nodeId: 'N03', reached: 5, dropped: 1, stepConversionRate: 0.8, avgTimeSpent: 120 },
      { name: '潜入关卡', nodeId: 'N05', reached: 4, dropped: 0, stepConversionRate: 1.0, avgTimeSpent: 180 },
      { name: '线人抉择', nodeId: 'N07', reached: 4, dropped: 0, stepConversionRate: 1.0, avgTimeSpent: 95 },
      { name: '最终对峙', nodeId: 'N08', reached: 4, dropped: 0, stepConversionRate: 1.0, avgTimeSpent: 150 },
      { name: '达成结局', nodeId: 'N10', reached: 4, dropped: 0, stepConversionRate: 1.0, avgTimeSpent: 60 },
    ],
    totalEntries: 5,
    totalCompleted: 4,
    conversionRate: 0.8,
  },
  {
    name: '支线探索率',
    steps: [
      { name: '主线分叉点', nodeId: 'N02', reached: 5, dropped: 1, stepConversionRate: 0.8, avgTimeSpent: 60 },
      { name: '支线节点', nodeId: 'N04', reached: 2, dropped: 0, stepConversionRate: 1.0, avgTimeSpent: 90 },
      { name: '支线深入', nodeId: 'N06', reached: 2, dropped: 0, stepConversionRate: 1.0, avgTimeSpent: 120 },
    ],
    totalEntries: 5,
    totalCompleted: 2,
    conversionRate: 0.4,
  },
];

// ── Mock 留存指标 ────────────────────────────────────────────────────────

export const MOCK_RETENTION: RetentionMetrics = {
  period: 'day',
  cohorts: [
    { date: '2026-05-25', newPlayers: 12, dayRetention: [1.0, 0.58, 0.42, 0.33, 0.25, 0.17, 0.17] },
    { date: '2026-05-26', newPlayers: 18, dayRetention: [1.0, 0.61, 0.50, 0.39, 0.28, 0.22, 0.17] },
    { date: '2026-05-27', newPlayers: 15, dayRetention: [1.0, 0.53, 0.40, 0.33, 0.27, 0.20, 0.13] },
    { date: '2026-05-28', newPlayers: 22, dayRetention: [1.0, 0.68, 0.55, 0.41, 0.32, 0.23, 0.18] },
    { date: '2026-05-29', newPlayers: 19, dayRetention: [1.0, 0.63, 0.47, 0.37, 0.26, 0.21, 0.16] },
    { date: '2026-05-30', newPlayers: 25, dayRetention: [1.0, 0.72, 0.56, 0.44, 0.36, 0.28, 0.20] },
    { date: '2026-05-31', newPlayers: 20, dayRetention: [1.0, 0.60, 0.45, 0.35, 0.30, 0.20, 0.15] },
  ],
  d1Retention: 0.62,
  d7Retention: 0.17,
  d30Retention: 0.08,
};

// ── Mock 热力图 ──────────────────────────────────────────────────────────

export const MOCK_HEATMAP: HeatmapData = {
  nodeHeatmap: [
    { nodeId: 'N01', nodeName: '序章', visits: 5, dropoffRate: 0, avgTimeSpent: 45, heatScore: 95 },
    { nodeId: 'N02', nodeName: '情报中心', visits: 5, dropoffRate: 0, avgTimeSpent: 60, heatScore: 90 },
    { nodeId: 'N03', nodeName: '任务接受', visits: 4, dropoffRate: 0.2, avgTimeSpent: 120, heatScore: 85 },
    { nodeId: 'N05', nodeName: '潜入策略', visits: 3, dropoffRate: 0, avgTimeSpent: 180, heatScore: 78 },
    { nodeId: 'N07', nodeName: '线人信任', visits: 4, dropoffRate: 0, avgTimeSpent: 95, heatScore: 82 },
    { nodeId: 'N08', nodeName: '最终对峙', visits: 4, dropoffRate: 0, avgTimeSpent: 150, heatScore: 88 },
    { nodeId: 'N10', nodeName: '结局', visits: 4, dropoffRate: 0, avgTimeSpent: 60, heatScore: 92 },
  ],
  choiceHeatmap: [
    { nodeId: 'N03', choiceIndex: 0, count: 3, completionAfterChoice: 1.0 },
    { nodeId: 'N03', choiceIndex: 1, count: 1, completionAfterChoice: 0 },
    { nodeId: 'N07', choiceIndex: 0, count: 2, completionAfterChoice: 1.0 },
    { nodeId: 'N07', choiceIndex: 1, count: 1, completionAfterChoice: 1.0 },
  ],
  hourlyActivity: [
    0, 0, 0, 0, 0, 0, 2,    // 0-6
    5, 8, 12, 15, 10, 8, 6, // 7-13
    9, 14, 18, 22, 25, 20, 15, // 14-20
    10, 5, 2, 0,              // 21-23 (next day would be 24)
  ],
};

// ── Mock 聚合报告 ────────────────────────────────────────────────────────

export const MOCK_ANALYTICS_REPORT: AnalyticsReport = {
  id: 'report-001',
  projectId: 'proj-ghost-protocol',
  generatedAt: '2026-05-31T23:00:00Z',
  dateRange: { start: '2026-05-25', end: '2026-05-31' },
  summary: {
    totalSessions: 5,
    avgSessionDuration: 1344,
    completionRate: 0.8,
    abandonmentRate: 0.2,
    uniqueEndings: 2,
    avgChoicesPerSession: 2.6,
    topEndingId: 'ending_good',
    topEndingName: '好结局',
  },
  choiceDistributions: MOCK_CHOICE_DISTRIBUTIONS,
  funnels: MOCK_FUNNELS,
  heatmap: MOCK_HEATMAP,
  retention: MOCK_RETENTION,
};
