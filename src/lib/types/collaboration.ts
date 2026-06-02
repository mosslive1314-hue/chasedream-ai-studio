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
