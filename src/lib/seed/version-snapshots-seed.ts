// ChaseDream Creator Studio — Version Snapshots Seed Data
// 快照、分支和版本历史的种子数据

import type { Snapshot, Branch, VersionHistoryEntry, RestorePoint } from '@/lib/types/version-control';

// ── Mock 快照 ────────────────────────────────────────────────────────────

export const MOCK_SNAPSHOTS: Snapshot[] = [
  {
    id: 'snap-001',
    projectId: 'proj-ghost-protocol',
    name: '初始版本',
    description: '完成基础节点图和核心变量定义',
    createdAt: '2026-05-20T10:00:00Z',
    createdBy: '张导演',
    type: 'milestone',
    data: {
      storyNodes: [],
      variables: [],
      characters: [],
      scenes: [],
      chapterPlans: [],
      interactionPoints: [],
      pipelineStages: [],
      qualityChecks: [],
      schemaVersion: 2,
    },
    sizeBytes: 45200,
    tags: ['初始', 'v1.0'],
  },
  {
    id: 'snap-002',
    projectId: 'proj-ghost-protocol',
    name: '剧本初稿完成',
    description: '完成全部 10 个节点的剧本内容',
    createdAt: '2026-05-22T16:30:00Z',
    createdBy: '李编剧',
    type: 'manual',
    data: {
      storyNodes: [],
      variables: [],
      characters: [],
      scenes: [],
      chapterPlans: [],
      interactionPoints: [],
      pipelineStages: [],
      qualityChecks: [],
      schemaVersion: 2,
    },
    sizeBytes: 128400,
    tags: ['剧本', '初稿'],
  },
  {
    id: 'snap-003',
    projectId: 'proj-ghost-protocol',
    name: '资产制作完成',
    description: '场景图片、BGM、音效全部就位',
    createdAt: '2026-05-25T14:00:00Z',
    createdBy: '王美术',
    type: 'manual',
    data: {
      storyNodes: [],
      variables: [],
      characters: [],
      scenes: [],
      chapterPlans: [],
      interactionPoints: [],
      pipelineStages: [],
      qualityChecks: [],
      schemaVersion: 2,
    },
    sizeBytes: 2456000,
    tags: ['资产', '完成'],
  },
  {
    id: 'snap-004',
    projectId: 'proj-ghost-protocol',
    name: '互动分支扩展',
    description: '增加 N04、N06 支线节点和 QTE 配置',
    createdAt: '2026-05-27T11:20:00Z',
    createdBy: '赵策划',
    type: 'auto',
    data: {
      storyNodes: [],
      variables: [],
      characters: [],
      scenes: [],
      chapterPlans: [],
      interactionPoints: [],
      pipelineStages: [],
      qualityChecks: [],
      schemaVersion: 2,
    },
    sizeBytes: 312800,
    tags: ['分支', 'QTE'],
  },
  {
    id: 'snap-005',
    projectId: 'proj-ghost-protocol',
    name: '发布前快照',
    description: '质检通过，准备发布 v1.0',
    createdAt: '2026-05-30T18:00:00Z',
    createdBy: '张导演',
    type: 'pre_publish',
    data: {
      storyNodes: [],
      variables: [],
      characters: [],
      scenes: [],
      chapterPlans: [],
      interactionPoints: [],
      pipelineStages: [],
      qualityChecks: [],
      schemaVersion: 2,
    },
    sizeBytes: 498200,
    tags: ['发布', 'v1.0'],
  },
];

// ── Mock 分支 ────────────────────────────────────────────────────────────

export const MOCK_BRANCHES: Branch[] = [
  {
    id: 'branch-main',
    projectId: 'proj-ghost-protocol',
    name: 'main',
    baseSnapshotId: 'snap-001',
    latestSnapshotId: 'snap-005',
    status: 'active',
    createdAt: '2026-05-20T10:00:00Z',
    createdBy: '张导演',
    snapshotCount: 5,
  },
  {
    id: 'branch-branching-exp',
    projectId: 'proj-ghost-protocol',
    name: '支线实验',
    parentBranchId: 'branch-main',
    baseSnapshotId: 'snap-002',
    latestSnapshotId: 'snap-002',
    status: 'merged',
    createdAt: '2026-05-23T09:00:00Z',
    createdBy: '赵策划',
    snapshotCount: 1,
  },
];

// ── Mock 版本历史 ────────────────────────────────────────────────────────

export const MOCK_VERSION_HISTORY: VersionHistoryEntry[] = [
  {
    snapshotId: 'snap-001',
    summary: '项目初始化，建立基础节点框架',
    timestamp: '2026-05-20T10:00:00Z',
    author: '张导演',
    changeCount: 12,
    typeLabel: '里程碑',
  },
  {
    snapshotId: 'snap-002',
    summary: '完成全部剧本内容，10 个节点均有对白和描述',
    timestamp: '2026-05-22T16:30:00Z',
    author: '李编剧',
    changeCount: 28,
    typeLabel: '手动',
  },
  {
    snapshotId: 'snap-003',
    summary: '所有场景图片、BGM 和音效资产制作完成',
    timestamp: '2026-05-25T14:00:00Z',
    author: '王美术',
    changeCount: 45,
    typeLabel: '手动',
  },
  {
    snapshotId: 'snap-004',
    summary: '新增支线节点 N04/N06，添加 QTE 配置和变量',
    timestamp: '2026-05-27T11:20:00Z',
    author: '赵策划',
    changeCount: 18,
    typeLabel: '自动',
  },
  {
    snapshotId: 'snap-005',
    summary: '全部质检项通过，准备首次发布',
    timestamp: '2026-05-30T18:00:00Z',
    author: '张导演',
    changeCount: 8,
    typeLabel: '发布前',
  },
];

// ── Mock 恢复点 ──────────────────────────────────────────────────────────

export const MOCK_RESTORE_POINTS: RestorePoint[] = [
  {
    id: 'restore-001',
    snapshotId: 'snap-001',
    name: '初始版本恢复点',
    reason: '项目创建时的基线',
    createdAt: '2026-05-20T10:00:00Z',
    restorable: true,
  },
  {
    id: 'restore-002',
    snapshotId: 'snap-003',
    name: '资产完成恢复点',
    reason: '重大资产制作完成节点',
    createdAt: '2026-05-25T14:00:00Z',
    restorable: true,
  },
  {
    id: 'restore-003',
    snapshotId: 'snap-005',
    name: '发布前恢复点',
    reason: '首次发布前的完整快照',
    createdAt: '2026-05-30T18:00:00Z',
    restorable: true,
  },
];
