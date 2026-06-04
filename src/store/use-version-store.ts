/**
 * Version Store — 版本控制状态管理
 *
 * 管理：
 * - 快照创建（从 narrative store 提取状态）
 * - 变更集计算（两个快照间的 diff）
 * - 分支管理
 * - 快照恢复
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { idbStorage } from './idb-storage';
import type {
  Snapshot,
  SnapshotType,
  SnapshotData,
  ChangeSet,
  ChangeEntry,
  ChangeAction,
  ChangeStats,
  Branch,
  MergeResult,
  RestorePoint,
  VersionHistoryEntry,
} from '@/lib/types/version-control';
import {
  MOCK_SNAPSHOTS,
  MOCK_BRANCHES,
  MOCK_VERSION_HISTORY,
  MOCK_RESTORE_POINTS,
} from '@/lib/seed/version-snapshots-seed';

// ── Store interface ───────────────────────────────────────────────────────

interface VersionState {
  // ── 数据 ──
  snapshots: Snapshot[];
  branches: Branch[];
  history: VersionHistoryEntry[];
  restorePoints: RestorePoint[];
  /** 活跃的分支 ID */
  activeBranchId: string;

  // ── 快照管理 ──
  createSnapshot: (name: string, type: SnapshotType, description?: string, tags?: string[]) => string;
  getSnapshot: (snapshotId: string) => Snapshot | undefined;
  getSnapshotsByType: (type: SnapshotType) => Snapshot[];
  deleteSnapshot: (snapshotId: string) => void;

  // ── 变更集 ──
  computeChangeSet: (fromSnapshotId: string, toSnapshotId: string) => ChangeSet;

  // ── 分支管理 ──
  createBranch: (name: string, baseSnapshotId: string) => string;
  getBranch: (branchId: string) => Branch | undefined;
  getActiveBranch: () => Branch | undefined;
  mergeBranch: (sourceBranchId: string, targetBranchId: string) => MergeResult;
  abandonBranch: (branchId: string) => void;

  // ── 恢复点 ──
  createRestorePoint: (snapshotId: string, name: string, reason: string) => string;
  restoreFromSnapshot: (snapshotId: string) => boolean;
  getRestorePoints: () => RestorePoint[];

  // ── 历史 ──
  getHistory: () => VersionHistoryEntry[];
  addHistoryEntry: (entry: VersionHistoryEntry) => void;
}

// ── 辅助函数：提取 store 快照数据 ────────────────────────────────────────

async function captureSnapshotData(): Promise<SnapshotData> {
  try {
    const { useNarrativeStore } = await import('@/store');
    const state = useNarrativeStore.getState();
    return {
      storyNodes: state.storyNodes ?? [],
      variables: state.variables ?? [],
      characters: state.characters ?? [],
      scenes: state.scenes ?? [],
      chapterPlans: state.chapterPlans ?? [],
      interactionPoints: state.interactionPoints ?? [],
      pipelineStages: [],
      qualityChecks: state.qualityChecks ?? [],
      schemaVersion: 2,
    };
  } catch {
    return {
      storyNodes: [],
      variables: [],
      characters: [],
      scenes: [],
      chapterPlans: [],
      interactionPoints: [],
      pipelineStages: [],
      qualityChecks: [],
      schemaVersion: 2,
    };
  }
}

// ── 辅助函数：计算 diff ──────────────────────────────────────────────────

function computeDiff(fromData: SnapshotData, toData: SnapshotData): { stats: ChangeStats; changes: ChangeEntry[] } {
  const changes: ChangeEntry[] = [];

  // 节点 diff
  const fromNodeIds = new Set(fromData.storyNodes.map((n: any) => n.id));
  const toNodeIds = new Set(toData.storyNodes.map((n: any) => n.id));

  let nodesAdded = 0, nodesModified = 0, nodesRemoved = 0;

  for (const id of toNodeIds) {
    if (!fromNodeIds.has(id)) {
      nodesAdded++;
      const node = toData.storyNodes.find((n: any) => n.id === id);
      changes.push({
        action: 'added',
        entityType: 'node',
        entityId: id,
        entityName: (node as any)?.label ?? id,
        description: `新增节点 ${id}`,
      });
    }
  }

  for (const id of fromNodeIds) {
    if (!toNodeIds.has(id)) {
      nodesRemoved++;
      const node = fromData.storyNodes.find((n: any) => n.id === id);
      changes.push({
        action: 'removed',
        entityType: 'node',
        entityId: id,
        entityName: (node as any)?.label ?? id,
        description: `删除节点 ${id}`,
      });
    }
  }

  // 检查修改的节点
  for (const id of toNodeIds) {
    if (fromNodeIds.has(id)) {
      const fromNode = fromData.storyNodes.find((n: any) => n.id === id);
      const toNode = toData.storyNodes.find((n: any) => n.id === id);
      if (JSON.stringify(fromNode) !== JSON.stringify(toNode)) {
        nodesModified++;
        changes.push({
          action: 'modified',
          entityType: 'node',
          entityId: id,
          entityName: (toNode as any)?.label ?? id,
          description: `修改节点 ${id}`,
        });
      }
    }
  }

  // 变量 diff
  const fromVarIds = new Set(fromData.variables.map((v: any) => v.id));
  const toVarIds = new Set(toData.variables.map((v: any) => v.id));
  let variablesAdded = 0, variablesModified = 0;

  for (const id of toVarIds) {
    if (!fromVarIds.has(id)) variablesAdded++;
  }

  // 资产变更估算
  const assetsChanged = Math.abs(toData.scenes.length - fromData.scenes.length);

  const stats: ChangeStats = {
    nodesAdded,
    nodesModified,
    nodesRemoved,
    variablesAdded,
    variablesModified,
    variablesSummary: [],
    assetsChanged,
    scriptChanges: nodesModified,
    interactionChanges: Math.abs(toData.interactionPoints.length - fromData.interactionPoints.length),
  };

  return { stats, changes };
}

// ── Store ─────────────────────────────────────────────────────────────────

export const useVersionStore = create<VersionState>()(
  persist(
    (set, get) => ({
      // ── Initial state ──
      snapshots: MOCK_SNAPSHOTS,
      branches: MOCK_BRANCHES,
      history: MOCK_VERSION_HISTORY,
      restorePoints: MOCK_RESTORE_POINTS,
      activeBranchId: 'branch-main',

      // ── 快照管理 ──
      createSnapshot: (name, type, description, tags = []) => {
        const id = `snap-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

        // 异步捕获数据
        captureSnapshotData().then(data => {
          const snapshot: Snapshot = {
            id,
            projectId: 'proj-ghost-protocol',
            name,
            description,
            createdAt: new Date().toISOString(),
            createdBy: '当前用户',
            type,
            data,
            sizeBytes: JSON.stringify(data).length,
            tags,
          };

          set(state => {
            const newSnapshots = [...state.snapshots, snapshot];
            // 更新活跃分支的最新快照
            const newBranches = state.branches.map(b =>
              b.id === state.activeBranchId
                ? { ...b, latestSnapshotId: id, snapshotCount: b.snapshotCount + 1 }
                : b
            );
            return { snapshots: newSnapshots, branches: newBranches };
          });

          // 添加历史条目
          get().addHistoryEntry({
            snapshotId: id,
            summary: description ?? `创建${type === 'manual' ? '手动' : type === 'auto' ? '自动' : type}快照: ${name}`,
            timestamp: new Date().toISOString(),
            author: '当前用户',
            changeCount: 0,
            typeLabel: type === 'manual' ? '手动' : type === 'auto' ? '自动' : type === 'pre_publish' ? '发布前' : type === 'milestone' ? '里程碑' : type,
          });
        });

        return id;
      },

      getSnapshot: (snapshotId) => get().snapshots.find(s => s.id === snapshotId),

      getSnapshotsByType: (type) => get().snapshots.filter(s => s.type === type),

      deleteSnapshot: (snapshotId) => {
        set(state => ({
          snapshots: state.snapshots.filter(s => s.id !== snapshotId),
          history: state.history.filter(h => h.snapshotId !== snapshotId),
          restorePoints: state.restorePoints.filter(r => r.snapshotId !== snapshotId),
        }));
      },

      // ── 变更集 ──
      computeChangeSet: (fromSnapshotId, toSnapshotId) => {
        const fromSnap = get().getSnapshot(fromSnapshotId);
        const toSnap = get().getSnapshot(toSnapshotId);

        if (!fromSnap || !toSnap) {
          return {
            fromSnapshotId,
            toSnapshotId,
            stats: {
              nodesAdded: 0, nodesModified: 0, nodesRemoved: 0,
              variablesAdded: 0, variablesModified: 0,
              variablesSummary: [], assetsChanged: 0,
              scriptChanges: 0, interactionChanges: 0,
            },
            changes: [],
            computedAt: new Date().toISOString(),
          };
        }

        const { stats, changes } = computeDiff(fromSnap.data, toSnap.data);

        return {
          fromSnapshotId,
          toSnapshotId,
          stats,
          changes,
          computedAt: new Date().toISOString(),
        };
      },

      // ── 分支管理 ──
      createBranch: (name, baseSnapshotId) => {
        const id = `branch-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        const branch: Branch = {
          id,
          projectId: 'proj-ghost-protocol',
          name,
          parentBranchId: get().activeBranchId,
          baseSnapshotId,
          latestSnapshotId: baseSnapshotId,
          status: 'active',
          createdAt: new Date().toISOString(),
          createdBy: '当前用户',
          snapshotCount: 0,
        };
        set(state => ({ branches: [...state.branches, branch] }));
        return id;
      },

      getBranch: (branchId) => get().branches.find(b => b.id === branchId),

      getActiveBranch: () => get().branches.find(b => b.id === get().activeBranchId),

      mergeBranch: (sourceBranchId, targetBranchId) => {
        const result: MergeResult = {
          sourceBranchId,
          targetBranchId,
          status: 'success',
          conflicts: [],
          mergedAt: new Date().toISOString(),
        };

        set(state => ({
          branches: state.branches.map(b =>
            b.id === sourceBranchId ? { ...b, status: 'merged' as const } : b
          ),
        }));

        return result;
      },

      abandonBranch: (branchId) => {
        set(state => ({
          branches: state.branches.map(b =>
            b.id === branchId ? { ...b, status: 'abandoned' as const } : b
          ),
        }));
      },

      // ── 恢复点 ──
      createRestorePoint: (snapshotId, name, reason) => {
        const id = `restore-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        const point: RestorePoint = {
          id,
          snapshotId,
          name,
          reason,
          createdAt: new Date().toISOString(),
          restorable: true,
        };
        set(state => ({ restorePoints: [...state.restorePoints, point] }));
        return id;
      },

      restoreFromSnapshot: (snapshotId) => {
        const snapshot = get().getSnapshot(snapshotId);
        if (!snapshot) return false;

        // 在实际实现中，这里应该将 narrative store 的状态恢复到快照时的状态
        // 目前作为占位，创建一个自动快照记录当前状态后再"恢复"
        get().createSnapshot(
          `恢复前自动快照 (${new Date().toLocaleString('zh-CN')})`,
          'auto',
          `恢复到 "${snapshot.name}" 前的自动备份`
        );

        return true;
      },

      getRestorePoints: () => get().restorePoints,

      // ── 历史 ──
      getHistory: () => {
        return [...get().history].sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
      },

      addHistoryEntry: (entry) => {
        set(state => ({ history: [...state.history, entry] }));
      },
    }),
    {
      name: 'cd-versions',
      storage: createJSONStorage(() => idbStorage),
      partialize: (state) => ({
        snapshots: state.snapshots,
        branches: state.branches,
        history: state.history,
        restorePoints: state.restorePoints,
        activeBranchId: state.activeBranchId,
      }),
    }
  )
);
