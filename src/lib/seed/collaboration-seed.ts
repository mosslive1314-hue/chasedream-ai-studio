// ChaseDream Creator Studio — Collaboration Seed Data

import type { CollabTask, CollabComment, ReviewItem, VersionDiff } from '../types/collaboration';

// ── 协作系统数据（P8-15）─────────────────────────────────────────────

export const COLLAB_TASKS: CollabTask[] = [
  { id: 'task-01', title: '修复 N07 失败反馈文案', assignee: '编剧小王', assigneeRole: 'Script Editor', status: 'in_progress', priority: 'urgent', category: '质检修复', description: 'N07 潜行判定节点失败路径缺少文案，需补充 200 字以内失败叙事', linkedNodeId: 'N07', dueDate: '2026-06-03', comments: 3 },
  { id: 'task-02', title: '制作 N06 警卫场景背景', assignee: '美术小李', assigneeRole: 'Asset Artist', status: 'todo', priority: 'high', category: '资产制作', description: 'N06 警卫逼近场景缺少背景图片，需要赛博朋克风格的安保走廊', linkedNodeId: 'N06', dueDate: '2026-06-04', comments: 1 },
  { id: 'task-03', title: '设计 QTE 失败分支演出', assignee: '互动设计师', assigneeRole: 'Interaction Designer', status: 'review', priority: 'high', category: '互动设计', description: 'N06 QTE 失败后需要完整的演出设计：镜头、表演、音频、转场', linkedNodeId: 'N06', comments: 5 },
  { id: 'task-04', title: '补齐全部 BGM', assignee: '美术小李', assigneeRole: 'Asset Artist', status: 'todo', priority: 'normal', category: '资产制作', description: '11 个节点均缺少 BGM，需要根据每个节点的情绪配置背景音乐', comments: 2 },
  { id: 'task-05', title: '优化第一章对白节奏', assignee: '编剧小王', assigneeRole: 'Script Editor', status: 'done', priority: 'normal', category: '剧本编写', description: '第一章线人对话过长，需要精简并增加更多互动节奏', completedAt: '2026-06-01', comments: 4 },
  { id: 'task-06', title: 'UI 模板应用到全部节点', assignee: '互动设计师', assigneeRole: 'Interaction Designer', status: 'in_progress', priority: 'normal', category: 'UI设计', description: '将赛博朋克 UI 模板应用到所有对话框和选项按钮', comments: 1 },
  { id: 'task-07', title: '路径 C 分支过短问题', assignee: '编剧小王', assigneeRole: 'Script Editor', status: 'todo', priority: 'low', category: '节点编辑', description: '路径 C（QTE失败→暴露路线）只有 2 个节点，需要增加中间环节', linkedNodeId: 'N07F', comments: 0 },
];

export const COLLAB_COMMENTS: CollabComment[] = [
  { id: 'comment-01', taskId: 'task-01', author: '项目负责人', authorRole: 'Project Lead', content: '这个是最紧急的，质检直接报错了。建议优先处理。', timestamp: '2026-06-02 09:30:00', isResolved: false },
  { id: 'comment-02', taskId: 'task-01', author: '编剧小王', authorRole: 'Script Editor', content: '收到，我今天下午写完初稿后 @互动设计师 帮忙看一下叙事连贯性。', mentions: ['互动设计师'], timestamp: '2026-06-02 10:15:00', isResolved: false },
  { id: 'comment-03', taskId: 'task-01', author: '互动设计师', authorRole: 'Interaction Designer', content: '好的，我这边同步更新失败路径的变量变化。', timestamp: '2026-06-02 10:45:00', isResolved: false },
  { id: 'comment-04', taskId: 'task-03', author: '互动设计师', authorRole: 'Interaction Designer', content: 'QTE 失败演出方案已提交审核：手持镜头 + 警报闪红 + 角色跌倒动作。@项目负责人 请确认。', mentions: ['项目负责人'], timestamp: '2026-06-02 14:00:00', isResolved: false },
  { id: 'comment-05', nodeId: 'N07', author: '项目负责人', authorRole: 'Project Lead', content: '这个节点的失败反馈是质检里反复报的问题，必须在下一个版本修复。', timestamp: '2026-06-01 16:00:00', isResolved: false },
];

export const REVIEW_ITEMS: ReviewItem[] = [
  { id: 'review-01', type: 'script', title: '第一章对白修订 v3', submitter: '编剧小王', reviewer: '项目负责人', stage: 'editor_review', submittedAt: '2026-06-02 11:00:00', comments: '精简了线人对话，增加了 1 个互动选择点', changeSummary: '修改 7 行对白，新增 1 个选择节点' },
  { id: 'review-02', type: 'asset', title: 'N01-N05 场景图片更新', submitter: '美术小李', reviewer: '项目负责人', stage: 'director_approved', submittedAt: '2026-06-01 15:00:00', reviewedAt: '2026-06-02 09:00:00', comments: '统一为赛博朋克风格，提高了一致性', changeSummary: '更新 5 张场景图，统一色调' },
  { id: 'review-03', type: 'interaction', title: 'QTE 失败演出方案', submitter: '互动设计师', reviewer: '项目负责人', stage: 'submitted', submittedAt: '2026-06-02 14:00:00', comments: '完整演出设计：手持镜头 + 警报 + 跌倒', changeSummary: '新增 N07F 演出指导' },
  { id: 'review-04', type: 'node_graph', title: '新增 N04→N06 中间节点', submitter: '互动设计师', reviewer: '编剧小王', stage: 'draft', submittedAt: '', comments: '草稿阶段，需要编剧确认叙事合理性', changeSummary: '新增 1 个场景节点，延长潜行路线' },
];

export const VERSION_DIFFS: VersionDiff[] = [
  { fromVersion: 'v1.1.0', toVersion: 'v1.2.0', nodesAdded: 2, nodesModified: 5, nodesRemoved: 0, variablesChanged: 1, assetsUpdated: 8, scriptChanges: 15, summary: '新增 QTE 系统，优化第一章对白节奏' },
  { fromVersion: 'v1.2.0', toVersion: 'v1.2.3', nodesAdded: 0, nodesModified: 3, nodesRemoved: 0, variablesChanged: 0, assetsUpdated: 3, scriptChanges: 7, summary: '修复 N03 选择分支不平衡，更新场景图片' },
  { fromVersion: 'v1.0.0', toVersion: 'v1.2.3', nodesAdded: 4, nodesModified: 9, nodesRemoved: 1, variablesChanged: 2, assetsUpdated: 14, scriptChanges: 32, summary: '从初始版本到当前版本的累计变更' },
];
