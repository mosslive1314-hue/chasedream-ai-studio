/**
 * Export Store — 导出任务管理、适配器执行和结果存储
 *
 * 管理：
 * - 导出任务生命周期（创建 → 执行 → 完成/失败）
 * - 导出格式查询和筛选
 * - 导出结果缓存和下载
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { idbStorage } from './idb-storage';
import type {
  ExportFormat,
  ExportFormatId,
  ExportCategory,
  ExportJob,
  ExportJobStatus,
  ExportResult,
  ExportStats,
} from '@/lib/types/export-engine';
import {
  EXPORT_FORMATS,
  getFormatsByIndustry,
  getFormatsByCategory,
} from '@/lib/seed/export-formats-seed';

// ── Store interface ───────────────────────────────────────────────────────

interface ExportState {
  // ── 数据 ──
  formats: ExportFormat[];
  jobs: ExportJob[];
  /** 最近一次导出结果缓存 */
  lastResult: ExportResult | null;

  // ── 格式查询 ──
  getFormat: (formatId: ExportFormatId) => ExportFormat | undefined;
  getFormatsByIndustry: (industry: 'game' | 'tourism' | 'education' | 'derivative') => ExportFormat[];
  getFormatsByCategory: (category: ExportCategory) => ExportFormat[];

  // ── 导出任务 ──
  createExportJob: (formatId: ExportFormatId, options?: Record<string, string | boolean | number>) => string;
  updateJobProgress: (jobId: string, progress: number) => void;
  completeJob: (jobId: string, result: ExportResult) => void;
  failJob: (jobId: string, errorMessage: string) => void;
  cancelJob: (jobId: string) => void;
  getJob: (jobId: string) => ExportJob | undefined;
  getJobsByStatus: (status: ExportJobStatus) => ExportJob[];
  getRecentJobs: (limit?: number) => ExportJob[];

  // ── 导出执行 ──
  runExport: (formatId: ExportFormatId, options?: Record<string, string | boolean | number>) => Promise<ExportResult>;

  // ── 清理 ──
  clearCompletedJobs: () => void;
  clearAllJobs: () => void;
}

// ── Store ─────────────────────────────────────────────────────────────────

export const useExportStore = create<ExportState>()(
  persist(
    (set, get) => ({
      // ── Initial state ──
      formats: EXPORT_FORMATS,
      jobs: [],
      lastResult: null,

      // ── 格式查询 ──
      getFormat: (formatId) => get().formats.find(f => f.id === formatId),

      getFormatsByIndustry: (industry) => getFormatsByIndustry(industry),

      getFormatsByCategory: (category) => getFormatsByCategory(category),

      // ── 导出任务 ──
      createExportJob: (formatId, options = {}) => {
        const jobId = `export-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const job: ExportJob = {
          id: jobId,
          formatId,
          status: 'queued',
          progress: 0,
          options,
          createdAt: new Date().toISOString(),
        };
        set(state => ({ jobs: [...state.jobs, job] }));
        return jobId;
      },

      updateJobProgress: (jobId, progress) => {
        set(state => ({
          jobs: state.jobs.map(j =>
            j.id === jobId
              ? { ...j, progress: Math.min(100, progress), status: 'running' as ExportJobStatus }
              : j
          ),
        }));
      },

      completeJob: (jobId, result) => {
        set(state => ({
          jobs: state.jobs.map(j =>
            j.id === jobId
              ? { ...j, status: 'completed' as ExportJobStatus, progress: 100, result, completedAt: new Date().toISOString() }
              : j
          ),
          lastResult: result,
        }));
      },

      failJob: (jobId, errorMessage) => {
        set(state => ({
          jobs: state.jobs.map(j =>
            j.id === jobId
              ? { ...j, status: 'failed' as ExportJobStatus, errorMessage, completedAt: new Date().toISOString() }
              : j
          ),
        }));
      },

      cancelJob: (jobId) => {
        set(state => ({
          jobs: state.jobs.map(j =>
            j.id === jobId && (j.status === 'queued' || j.status === 'running')
              ? { ...j, status: 'cancelled' as ExportJobStatus, completedAt: new Date().toISOString() }
              : j
          ),
        }));
      },

      getJob: (jobId) => get().jobs.find(j => j.id === jobId),

      getJobsByStatus: (status) => get().jobs.filter(j => j.status === status),

      getRecentJobs: (limit = 10) => {
        const sorted = [...get().jobs].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        return sorted.slice(0, limit);
      },

      // ── 导出执行（模拟异步） ──
      runExport: async (formatId, options = {}) => {
        const jobId = get().createExportJob(formatId, options);
        const format = get().getFormat(formatId);
        const startTime = Date.now();

        try {
          // 模拟渐进式导出过程
          const steps = [10, 25, 45, 65, 80, 95, 100];
          for (const progress of steps) {
            await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
            get().updateJobProgress(jobId, progress);
          }

          // 动态加载适配器
          const { getAdapter } = await import('@/lib/export/adapters');
          const adapter = getAdapter(formatId);

          if (adapter) {
            // 使用真实适配器转换
            const narrativeStore = (await import('@/store')).useNarrativeStore.getState();
            const result = adapter(narrativeStore, options);
            get().completeJob(jobId, result);
            return result;
          }

          // Fallback: 生成模拟结果
          const duration = Date.now() - startTime;
          const result: ExportResult = {
            fileName: `export-${formatId}-${Date.now()}${format?.fileExtension ?? '.dat'}`,
            content: `// Exported ${formatId} format\n// Generated at ${new Date().toISOString()}\n// Format: ${format?.name ?? formatId}\n`,
            fileSize: Math.round(50000 + Math.random() * 200000),
            stats: {
              nodesExported: 10,
              variablesExported: 8,
              assetRefsExported: 12,
              skippedItems: [],
              duration,
            },
          };

          get().completeJob(jobId, result);
          return result;
        } catch (err) {
          const message = err instanceof Error ? err.message : '导出失败';
          get().failJob(jobId, message);
          throw err;
        }
      },

      // ── 清理 ──
      clearCompletedJobs: () => {
        set(state => ({
          jobs: state.jobs.filter(j => j.status !== 'completed' && j.status !== 'cancelled' && j.status !== 'failed'),
        }));
      },

      clearAllJobs: () => {
        set({ jobs: [], lastResult: null });
      },
    }),
    {
      name: 'cd-exports',
      storage: createJSONStorage(() => idbStorage),
      partialize: (state) => ({ jobs: state.jobs.slice(-20) }), // 只持久化最近 20 条任务
    }
  )
);
