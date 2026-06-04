/**
 * Analytics Store — 数据分析状态管理
 *
 * 管理：
 * - 玩家会话数据
 * - 选择分布计算
 * - 漏斗分析
 * - 热力图生成
 * - 留存指标
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { idbStorage } from './idb-storage';
import type {
  PlayerSession,
  ChoiceDistribution,
  FunnelAnalysis,
  RetentionMetrics,
  HeatmapData,
  AnalyticsReport,
  ABTestConfig,
} from '@/lib/types/analytics';
import {
  MOCK_SESSIONS,
  MOCK_CHOICE_DISTRIBUTIONS,
  MOCK_FUNNELS,
  MOCK_RETENTION,
  MOCK_HEATMAP,
  MOCK_ANALYTICS_REPORT,
} from '@/lib/seed/analytics-seed';

// ── Store interface ───────────────────────────────────────────────────────

interface AnalyticsState {
  // ── 数据 ──
  sessions: PlayerSession[];
  choiceDistributions: ChoiceDistribution[];
  funnels: FunnelAnalysis[];
  retention: RetentionMetrics;
  heatmap: HeatmapData;
  report: AnalyticsReport;
  abTests: ABTestConfig[];

  // ── 会话管理 ──
  addSession: (session: PlayerSession) => void;
  getSession: (sessionId: string) => PlayerSession | undefined;
  getSessionsByDateRange: (start: string, end: string) => PlayerSession[];

  // ── 分析计算 ──
  recomputeChoiceDistributions: () => void;
  recomputeFunnels: () => void;
  recomputeHeatmap: () => void;
  recomputeAll: () => void;

  // ── 指标查询 ──
  getCompletionRate: () => number;
  getAbandonmentRate: () => number;
  getAvgSessionDuration: () => number;
  getTopEnding: () => { id: string; name: string; count: number } | null;

  // ── A/B 测试 ──
  addABTest: (test: ABTestConfig) => void;
  updateABTest: (testId: string, updates: Partial<ABTestConfig>) => void;
  getABTest: (testId: string) => ABTestConfig | undefined;
}

// ── Store ─────────────────────────────────────────────────────────────────

export const useAnalyticsStore = create<AnalyticsState>()(
  persist(
    (set, get) => ({
      // ── Initial state ──
      sessions: MOCK_SESSIONS,
      choiceDistributions: MOCK_CHOICE_DISTRIBUTIONS,
      funnels: MOCK_FUNNELS,
      retention: MOCK_RETENTION,
      heatmap: MOCK_HEATMAP,
      report: MOCK_ANALYTICS_REPORT,
      abTests: [],

      // ── 会话管理 ──
      addSession: (session) => {
        set(state => ({ sessions: [...state.sessions, session] }));
      },

      getSession: (sessionId) => get().sessions.find(s => s.id === sessionId),

      getSessionsByDateRange: (start, end) => {
        const startTime = new Date(start).getTime();
        const endTime = new Date(end).getTime();
        return get().sessions.filter(s => {
          const t = new Date(s.startedAt).getTime();
          return t >= startTime && t <= endTime;
        });
      },

      // ── 分析计算 ──
      recomputeChoiceDistributions: () => {
        const sessions = get().sessions;
        const nodeChoiceMap = new Map<string, { text: string; hesitation: number }[]>();

        for (const session of sessions) {
          for (const choice of session.choicesMade) {
            const key = choice.nodeId;
            if (!nodeChoiceMap.has(key)) nodeChoiceMap.set(key, []);
            nodeChoiceMap.get(key)!.push({
              text: choice.choiceText,
              hesitation: choice.hesitationTime,
            });
          }
        }

        const distributions: ChoiceDistribution[] = [];
        for (const [nodeId, choices] of nodeChoiceMap) {
          // Group by choice text
          const optionMap = new Map<string, { index: number; count: number; hesitations: number[] }>();
          choices.forEach((c, i) => {
            const existing = optionMap.get(c.text);
            if (existing) {
              existing.count++;
              existing.hesitations.push(c.hesitation);
            } else {
              optionMap.set(c.text, { index: i, count: 1, hesitations: [c.hesitation] });
            }
          });

          const total = choices.length;
          const avgHes = choices.reduce((s, c) => s + c.hesitation, 0) / total;

          distributions.push({
            nodeId,
            nodeName: nodeId,
            totalChoices: total,
            avgHesitationTime: avgHes,
            optionStats: Array.from(optionMap.entries()).map(([text, data]) => ({
              choiceIndex: data.index,
              choiceText: text,
              count: data.count,
              ratio: data.count / total,
              avgHesitation: data.hesitations.reduce((s, h) => s + h, 0) / data.hesitations.length,
            })),
          });
        }

        set({ choiceDistributions: distributions });
      },

      recomputeFunnels: () => {
        const sessions = get().sessions;
        if (sessions.length === 0) return;

        // 主线路漏斗
        const mainPath = ['N01', 'N03', 'N05', 'N07', 'N08', 'N10'];
        const mainSteps = mainPath.map(nodeId => {
          const reached = sessions.filter(s => s.nodePath.includes(nodeId)).length;
          return {
            name: nodeId,
            nodeId,
            reached,
            dropped: 0,
            stepConversionRate: 0,
            avgTimeSpent: 60,
          };
        });

        for (let i = 0; i < mainSteps.length; i++) {
          if (i === 0) {
            mainSteps[i].stepConversionRate = 1;
          } else {
            mainSteps[i].stepConversionRate = mainSteps[i - 1].reached > 0
              ? mainSteps[i].reached / mainSteps[i - 1].reached
              : 0;
            mainSteps[i - 1].dropped = mainSteps[i - 1].reached - mainSteps[i].reached;
          }
        }

        const totalEntries = mainSteps[0]?.reached ?? 0;
        const totalCompleted = mainSteps[mainSteps.length - 1]?.reached ?? 0;

        set({
          funnels: [{
            name: '主线路完成率',
            steps: mainSteps,
            totalEntries,
            totalCompleted,
            conversionRate: totalEntries > 0 ? totalCompleted / totalEntries : 0,
          }],
        });
      },

      recomputeHeatmap: () => {
        const sessions = get().sessions;
        const nodeVisits = new Map<string, number>();
        const hourlyActivity = new Array(24).fill(0);

        for (const session of sessions) {
          for (const nodeId of session.nodePath) {
            nodeVisits.set(nodeId, (nodeVisits.get(nodeId) ?? 0) + 1);
          }
          const hour = new Date(session.startedAt).getHours();
          hourlyActivity[hour]++;
        }

        const maxVisits = Math.max(...nodeVisits.values(), 1);
        const nodeHeatmap = Array.from(nodeVisits.entries()).map(([nodeId, visits]) => ({
          nodeId,
          nodeName: nodeId,
          visits,
          dropoffRate: 0,
          avgTimeSpent: 60,
          heatScore: Math.round((visits / maxVisits) * 100),
        }));

        set({
          heatmap: {
            nodeHeatmap,
            choiceHeatmap: get().heatmap.choiceHeatmap,
            hourlyActivity,
          },
        });
      },

      recomputeAll: () => {
        get().recomputeChoiceDistributions();
        get().recomputeFunnels();
        get().recomputeHeatmap();
      },

      // ── 指标查询 ──
      getCompletionRate: () => {
        const sessions = get().sessions;
        if (sessions.length === 0) return 0;
        const completed = sessions.filter(s => !s.abandoned).length;
        return completed / sessions.length;
      },

      getAbandonmentRate: () => {
        const sessions = get().sessions;
        if (sessions.length === 0) return 0;
        const abandoned = sessions.filter(s => s.abandoned).length;
        return abandoned / sessions.length;
      },

      getAvgSessionDuration: () => {
        const sessions = get().sessions;
        if (sessions.length === 0) return 0;
        return sessions.reduce((s, sess) => s + sess.duration, 0) / sessions.length;
      },

      getTopEnding: () => {
        const sessions = get().sessions;
        const endingCounts = new Map<string, number>();
        for (const s of sessions) {
          if (s.endingReached) {
            endingCounts.set(s.endingReached, (endingCounts.get(s.endingReached) ?? 0) + 1);
          }
        }
        let topId: string | null = null;
        let topCount = 0;
        for (const [id, count] of endingCounts) {
          if (count > topCount) { topId = id; topCount = count; }
        }
        return topId ? { id: topId, name: topId, count: topCount } : null;
      },

      // ── A/B 测试 ──
      addABTest: (test) => {
        set(state => ({ abTests: [...state.abTests, test] }));
      },

      updateABTest: (testId, updates) => {
        set(state => ({
          abTests: state.abTests.map(t => t.id === testId ? { ...t, ...updates } : t),
        }));
      },

      getABTest: (testId) => get().abTests.find(t => t.id === testId),
    }),
    {
      name: 'cd-analytics',
      storage: createJSONStorage(() => idbStorage),
      partialize: (state) => ({
        sessions: state.sessions,
        choiceDistributions: state.choiceDistributions,
        funnels: state.funnels,
        abTests: state.abTests,
      }),
    }
  )
);
