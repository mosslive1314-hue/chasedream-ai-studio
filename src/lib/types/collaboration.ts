// ChaseDream Creator Studio — Collaboration Types

// ── 协作系统数据（P8-15）─────────────────────────────────────────────

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';
export type TaskPriority = 'urgent' | 'high' | 'normal' | 'low';
export type ReviewStage = 'draft' | 'submitted' | 'editor_review' | 'director_approved' | 'published';

export interface CollabTask {
  id: string;
  title: string;
  assignee: string;         // member name
  assigneeRole: string;
  status: TaskStatus;
  priority: TaskPriority;
  category: string;         // '节点编辑' | '资产制作' | '剧本编写' | '质检修复' | 'UI设计'
  description: string;
  linkedNodeId?: string;
  linkedAssetId?: string;
  dueDate?: string;
  completedAt?: string;
  comments: number;
}

export interface CollabComment {
  id: string;
  taskId?: string;
  nodeId?: string;
  author: string;
  authorRole: string;
  content: string;
  mentions?: string[];      // mentioned user names
  timestamp: string;
  isResolved: boolean;
}

export interface ReviewItem {
  id: string;
  type: 'script' | 'asset' | 'node_graph' | 'interaction' | 'full_build';
  title: string;
  submitter: string;
  reviewer: string;
  stage: ReviewStage;
  submittedAt: string;
  reviewedAt?: string;
  comments: string;
  changeSummary: string;
}

export interface VersionDiff {
  fromVersion: string;
  toVersion: string;
  nodesAdded: number;
  nodesModified: number;
  nodesRemoved: number;
  variablesChanged: number;
  assetsUpdated: number;
  scriptChanges: number;
  summary: string;
}

// ── 团队成员 ──────────────────────────────────────────────────────────────

export type TeamRole = 'director' | 'writer' | 'artist' | 'developer' | 'tester' | 'editor';

export interface TeamMember {
  id: string;
  name: string;
  role: TeamRole;
  avatar: string;
  email?: string;
  /** 成员是否在线 */
  online: boolean;
  /** 最后活跃时间 */
  lastActiveAt: string;
  /** 当前正在编辑的节点 ID */
  editingNodeId?: string;
  /** 专长标签 */
  specialties: string[];
  /** 累计贡献统计 */
  stats: {
    tasksCompleted: number;
    reviewsDone: number;
    commentsCount: number;
  };
}

// ── 在线状态 ──────────────────────────────────────────────────────────────

export type PresenceStatus = 'active' | 'idle' | 'away' | 'offline';

export interface PresenceState {
  memberId: string;
  status: PresenceStatus;
  /** 当前正在查看的页面路径 */
  viewingPath: string;
  /** 当前正在编辑的实体 */
  editingEntity?: {
    type: 'node' | 'variable' | 'character' | 'scene' | 'asset';
    id: string;
    label: string;
  };
  /** 光标位置（协同编辑时） */
  cursorPosition?: {
    nodeId: string;
    field: string;
    offset: number;
  };
  /** 最后心跳时间 */
  heartbeatAt: string;
}

// ── 审阅动作 ──────────────────────────────────────────────────────────────

export type ReviewActionType =
  | 'approve'
  | 'request_changes'
  | 'comment'
  | 'assign_reviewer'
  | 'escalate'
  | 'rollback'
  | 'merge';

export interface ReviewAction {
  id: string;
  /** 关联的审阅项 ID */
  reviewItemId: string;
  /** 执行者 */
  actorId: string;
  actorName: string;
  /** 动作类型 */
  action: ReviewActionType;
  /** 附带的评论 */
  comment?: string;
  /** 标记为需修改的字段 */
  flaggedFields?: string[];
  /** 执行时间 */
  executedAt: string;
}
