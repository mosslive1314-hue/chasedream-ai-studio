/**
 * 协作 Store — 团队协作状态管理
 *
 * 持久化团队成员、任务看板、评论动态、审核流程、协作动态。
 * 所有数据真实持久化到 IndexedDB，空数据从零开始。
 *
 * 持久化配置：
 * - name: 'cd-collab'
 * - skipHydration: true（由 StoreHydrator 统一触发 rehydrate）
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { idbStorage } from './idb-storage';
import type {
  CollabTask,
  CollabComment,
  ReviewItem,
  TeamMember,
  ReviewAction,
  TaskStatus,
  ReviewStage,
} from '@/lib/types/collaboration';

// ── 协作动态类型（本 store 内定义） ─────────────────────────────────────

export interface CollabActivity {
  id: string;
  actorId: string;
  actorName: string;
  action: string;       // '创建了任务' / '完成了审核' / '添加了评论' 等
  targetType: 'task' | 'review' | 'comment' | 'member' | 'node' | 'asset';
  targetId: string;
  targetLabel: string;
  timestamp: string;
}

// ── 角色权限矩阵（业务逻辑常量，非 mock 数据） ──────────────────────────

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  director: ['全部权限', '发布管理', '成员管理', '版本回滚'],
  writer: ['编辑剧本', '编辑对白', '审核 AI 产出'],
  artist: ['上传资产', '编辑资产', '审核资产'],
  developer: ['编辑节点图', '配置变量', '设计 QTE'],
  editor: ['只读查看', '添加评论', '审核内容'],
  tester: ['只读查看', '添加评论', '提交 Bug'],
};

export const ROLE_LABELS: Record<string, string> = {
  director: '项目负责人',
  writer: '剧本编辑',
  artist: '资产制作',
  developer: '互动设计',
  editor: '审阅者',
  tester: '测试员',
};

// ── Store 接口 ───────────────────────────────────────────────────────────

interface CollabStoreState {
  // ── 数据 ──
  members: TeamMember[];
  tasks: CollabTask[];
  comments: CollabComment[];
  reviews: ReviewItem[];
  reviewActions: ReviewAction[];
  activities: CollabActivity[];

  // ── 成员管理 ──
  addMember: (member: TeamMember) => void;
  updateMember: (id: string, updates: Partial<TeamMember>) => void;
  removeMember: (id: string) => void;

  // ── 任务管理 ──
  addTask: (task: CollabTask) => void;
  updateTask: (id: string, updates: Partial<CollabTask>) => void;
  removeTask: (id: string) => void;
  setTaskStatus: (id: string, status: TaskStatus) => void;

  // ── 评论管理 ──
  addComment: (comment: CollabComment) => void;
  resolveComment: (id: string) => void;
  removeComment: (id: string) => void;

  // ── 审核管理 ──
  submitForReview: (review: ReviewItem) => void;
  updateReviewStage: (id: string, stage: ReviewStage) => void;
  addReviewAction: (action: ReviewAction) => void;

  // ── 动态管理 ──
  addActivity: (activity: CollabActivity) => void;

  // ── 工具方法 ──
  getMemberById: (id: string) => TeamMember | undefined;
  getTasksByAssignee: (assignee: string) => CollabTask[];
  getCommentsByTask: (taskId: string) => CollabComment[];
  getReviewsByStage: (stage: ReviewStage) => ReviewItem[];
}

// ── 辅助函数 ─────────────────────────────────────────────────────────────

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

// ── Store 实现 ───────────────────────────────────────────────────────────

export const useCollabStore = create<CollabStoreState>()(
  persist(
    (set, get) => ({
      // ── 初始数据（空，从零开始） ──
      members: [],
      tasks: [],
      comments: [],
      reviews: [],
      reviewActions: [],
      activities: [],

      // ── 成员管理 ──

      addMember: (member) => {
        set(state => ({ members: [...state.members, member] }));
        get().addActivity({
          id: generateId('act'),
          actorId: member.id,
          actorName: member.name,
          action: '加入了团队',
          targetType: 'member',
          targetId: member.id,
          targetLabel: member.name,
          timestamp: new Date().toISOString(),
        });
      },

      updateMember: (id, updates) => {
        set(state => ({
          members: state.members.map(m => m.id === id ? { ...m, ...updates } : m),
        }));
      },

      removeMember: (id) => {
        set(state => ({
          members: state.members.filter(m => m.id !== id),
        }));
      },

      // ── 任务管理 ──

      addTask: (task) => {
        set(state => ({ tasks: [...state.tasks, task] }));
        get().addActivity({
          id: generateId('act'),
          actorId: 'current-user',
          actorName: '当前用户',
          action: '创建了任务',
          targetType: 'task',
          targetId: task.id,
          targetLabel: task.title,
          timestamp: new Date().toISOString(),
        });
      },

      updateTask: (id, updates) => {
        set(state => ({
          tasks: state.tasks.map(t => t.id === id ? { ...t, ...updates } : t),
        }));
      },

      removeTask: (id) => {
        set(state => ({
          tasks: state.tasks.filter(t => t.id !== id),
          comments: state.comments.filter(c => c.taskId !== id),
        }));
      },

      setTaskStatus: (id, status) => {
        const task = get().tasks.find(t => t.id === id);
        set(state => ({
          tasks: state.tasks.map(t =>
            t.id === id
              ? {
                  ...t,
                  status,
                  completedAt: status === 'done' ? new Date().toISOString() : undefined,
                }
              : t
          ),
        }));
        if (task) {
          get().addActivity({
            id: generateId('act'),
            actorId: 'current-user',
            actorName: '当前用户',
            action: `将任务状态改为 "${status}"`,
            targetType: 'task',
            targetId: id,
            targetLabel: task.title,
            timestamp: new Date().toISOString(),
          });
        }
      },

      // ── 评论管理 ──

      addComment: (comment) => {
        set(state => ({ comments: [...state.comments, comment] }));
        // 更新关联任务的评论计数
        if (comment.taskId) {
          set(state => ({
            tasks: state.tasks.map(t =>
              t.id === comment.taskId ? { ...t, comments: t.comments + 1 } : t
            ),
          }));
        }
      },

      resolveComment: (id) => {
        set(state => ({
          comments: state.comments.map(c =>
            c.id === id ? { ...c, isResolved: true } : c
          ),
        }));
      },

      removeComment: (id) => {
        const comment = get().comments.find(c => c.id === id);
        set(state => ({ comments: state.comments.filter(c => c.id !== id) }));
        // 更新关联任务的评论计数
        if (comment?.taskId) {
          set(state => ({
            tasks: state.tasks.map(t =>
              t.id === comment.taskId ? { ...t, comments: Math.max(0, t.comments - 1) } : t
            ),
          }));
        }
      },

      // ── 审核管理 ──

      submitForReview: (review) => {
        set(state => ({ reviews: [...state.reviews, review] }));
        get().addActivity({
          id: generateId('act'),
          actorId: review.submitter,
          actorName: review.submitter,
          action: `提交了审核: ${review.title}`,
          targetType: 'review',
          targetId: review.id,
          targetLabel: review.title,
          timestamp: new Date().toISOString(),
        });
      },

      updateReviewStage: (id, stage) => {
        const review = get().reviews.find(r => r.id === id);
        set(state => ({
          reviews: state.reviews.map(r =>
            r.id === id
              ? {
                  ...r,
                  stage,
                  reviewedAt: stage === 'published' ? new Date().toISOString() : r.reviewedAt,
                }
              : r
          ),
        }));
        if (review) {
          get().addActivity({
            id: generateId('act'),
            actorId: 'current-user',
            actorName: '当前用户',
            action: `将审核状态改为 "${stage}"`,
            targetType: 'review',
            targetId: id,
            targetLabel: review.title,
            timestamp: new Date().toISOString(),
          });
        }
      },

      addReviewAction: (action) => {
        set(state => ({ reviewActions: [...state.reviewActions, action] }));
      },

      // ── 动态管理 ──

      addActivity: (activity) => {
        set(state => ({
          // 只保留最近 100 条动态
          activities: [activity, ...state.activities].slice(0, 100),
        }));
      },

      // ── 工具方法 ──

      getMemberById: (id) => get().members.find(m => m.id === id),

      getTasksByAssignee: (assignee) =>
        get().tasks.filter(t => t.assignee === assignee),

      getCommentsByTask: (taskId) =>
        get().comments.filter(c => c.taskId === taskId),

      getReviewsByStage: (stage) =>
        get().reviews.filter(r => r.stage === stage),
    }),
    {
      name: 'cd-collab',
      storage: idbStorage,
      skipHydration: true,
      version: 1,
    }
  )
);
