// ChaseDream Creator Studio — Version Control Types
// 版本控制引擎：快照、分支、变更集和恢复点

// ── 快照 ──────────────────────────────────────────────────────────────────

export interface Snapshot {
  id: string;
  /** 快照所属项目 */
  projectId: string;
  /** 快照名称（用户自定义或自动生成） */
  name: string;
  /** 快照描述 */
  description?: string;
  /** 创建时间 */
  createdAt: string;
  /** 创建者 */
  createdBy: string;
  /** 快照类型 */
  type: SnapshotType;
  /** 快照数据（序列化的 store 状态） */
  data: SnapshotData;
  /** 快照大小（字节） */
  sizeBytes: number;
  /** 关联的标签 */
  tags: string[];
}

export type SnapshotType = 'manual' | 'auto' | 'pre_publish' | 'milestone' | 'pre_merge';

/** 快照包含的核心数据子集 */
export interface SnapshotData {
  /** 节点图谱 */
  storyNodes: unknown[];
  /** 变量系统 */
  variables: unknown[];
  /** 角色列表 */
  characters: unknown[];
  /** 场景列表 */
  scenes: unknown[];
  /** 章节计划 */
  chapterPlans: unknown[];
  /** 互动点 */
  interactionPoints: unknown[];
  /** 管线阶段 */
  pipelineStages: unknown[];
  /** 质检结果 */
  qualityChecks: unknown[];
  /** 元数据版本号 */
  schemaVersion: number;
}

// ── 变更集 ────────────────────────────────────────────────────────────────

export interface ChangeSet {
  /** 基准快照 ID */
  fromSnapshotId: string;
  /** 目标快照 ID */
  toSnapshotId: string;
  /** 变更统计 */
  stats: ChangeStats;
  /** 详细变更列表 */
  changes: ChangeEntry[];
  /** 计算时间 */
  computedAt: string;
}

export interface ChangeStats {
  /** 新增的节点数 */
  nodesAdded: number;
  /** 修改的节点数 */
  nodesModified: number;
  /** 删除的节点数 */
  nodesRemoved: number;
  /** 新增的变量数 */
  variablesAdded: number;
  /** 修改的变量数 */
  variablesModified: number;
  /** 变量值变化概要 */
  variablesSummary: string[];
  /** 资产变更数 */
  assetsChanged: number;
  /** 剧本变更数 */
  scriptChanges: number;
  /** 互动点变更数 */
  interactionChanges: number;
}

export type ChangeAction = 'added' | 'modified' | 'removed';

export interface ChangeEntry {
  /** 变更动作 */
  action: ChangeAction;
  /** 变更的实体类型 */
  entityType: 'node' | 'variable' | 'character' | 'scene' | 'interaction' | 'asset' | 'pipeline';
  /** 实体 ID */
  entityId: string;
  /** 实体名称 */
  entityName: string;
  /** 变更描述 */
  description: string;
  /** 字段级变更（仅 modified） */
  fieldChanges?: FieldChange[];
}

export interface FieldChange {
  /** 字段名 */
  field: string;
  /** 旧值 */
  oldValue: unknown;
  /** 新值 */
  newValue: unknown;
}

// ── 分支 ──────────────────────────────────────────────────────────────────

export interface Branch {
  id: string;
  projectId: string;
  /** 分支名称 */
  name: string;
  /** 父分支 ID（main 分支没有父） */
  parentBranchId?: string;
  /** 分支创建时的快照 ID */
  baseSnapshotId: string;
  /** 分支当前最新快照 ID */
  latestSnapshotId: string;
  /** 分支状态 */
  status: 'active' | 'merged' | 'abandoned';
  /** 创建时间 */
  createdAt: string;
  /** 创建者 */
  createdBy: string;
  /** 快照计数 */
  snapshotCount: number;
}

export interface MergeResult {
  /** 源分支 ID */
  sourceBranchId: string;
  /** 目标分支 ID */
  targetBranchId: string;
  /** 合并状态 */
  status: 'success' | 'conflicts' | 'error';
  /** 合并产生的快照 ID */
  mergeSnapshotId?: string;
  /** 冲突列表 */
  conflicts: MergeConflict[];
  /** 合并时间 */
  mergedAt: string;
}

export interface MergeConflict {
  /** 冲突的实体类型 */
  entityType: 'node' | 'variable' | 'character' | 'scene';
  /** 冲突的实体 ID */
  entityId: string;
  /** 实体名称 */
  entityName: string;
  /** 冲突字段 */
  conflictingFields: string[];
  /** 解决方式 */
  resolution?: 'ours' | 'theirs' | 'manual';
}

// ── 恢复点 ────────────────────────────────────────────────────────────────

export interface RestorePoint {
  id: string;
  /** 关联的快照 ID */
  snapshotId: string;
  /** 恢复点名称 */
  name: string;
  /** 创建原因 */
  reason: string;
  /** 创建时间 */
  createdAt: string;
  /** 是否可恢复 */
  restorable: boolean;
}

// ── 版本历史 ──────────────────────────────────────────────────────────────

export interface VersionHistoryEntry {
  /** 快照 ID */
  snapshotId: string;
  /** 简短描述 */
  summary: string;
  /** 时间 */
  timestamp: string;
  /** 操作者 */
  author: string;
  /** 变更数 */
  changeCount: number;
  /** 快照类型图标标签 */
  typeLabel: string;
}
