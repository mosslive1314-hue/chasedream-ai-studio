/**
 * Expert Store — Expert 系统运行时状态管理
 *
 * 管理：
 * - 当前活跃的 Expert（自动/手动选择）
 * - Expert 实例状态（运行状态、加载的 Skill、主动建议计数）
 * - 主动建议队列
 * - 路由策略
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Expert, ExpertInstance, ExpertHandoff, ExpertRunStatus } from "@/lib/types/expert";
import type { Skill } from "@/lib/types/skill";
import { EXPERTS } from "@/lib/seed/expert-seed";
import {
  getRecommendedExpert,
  getExpertsForStage,
  getPageStage,
  matchExpertByKeywords,
  loadSkillsForContext,
  evaluateProactiveRules,
  type RoutingStrategy,
} from "@/lib/ai/agent-orchestrator";

// ── 主动建议 ─────────────────────────────────────────────────────────────

export interface ProactiveSuggestion {
  id: string;
  expertId: string;
  expertName: string;
  expertAvatar: string;
  message: string;
  priority: "high" | "medium" | "low";
  timestamp: string;
  dismissed: boolean;
}

// ── Store 接口 ───────────────────────────────────────────────────────────

interface ExpertState {
  /** 当前活跃的 Expert ID */
  activeExpertId: string | null;
  /** 路由策略 */
  routingStrategy: RoutingStrategy;
  /** Expert 实例状态 Map (expertId → ExpertInstance) */
  instances: Record<string, ExpertInstance>;
  /** 主动建议队列 */
  suggestions: ProactiveSuggestion[];
  /** Expert 间协作历史 */
  handoffs: ExpertHandoff[];
  /** 当前加载的 Skill IDs */
  loadedSkillIds: string[];

  // ── Actions ──

  /** 设置活跃 Expert */
  setActiveExpert: (expertId: string | null) => void;
  /** 设置路由策略 */
  setRoutingStrategy: (strategy: RoutingStrategy) => void;
  /** 根据页面自动路由 Expert */
  autoRouteByPage: (pathname: string) => void;
  /** 根据用户输入关键词路由 Expert */
  routeByKeywords: (text: string) => void;
  /** 获取当前 Expert 定义 */
  getActiveExpert: () => Expert | null;
  /** 获取当前 Expert 实例 */
  getActiveInstance: () => ExpertInstance | null;
  /** 更新 Expert 运行状态 */
  setExpertStatus: (expertId: string, status: ExpertRunStatus) => void;
  /** 为当前 Expert 加载 Skill */
  loadSkillsForExpert: (pathname: string) => Skill[];
  /** 添加主动建议 */
  addSuggestion: (suggestion: Omit<ProactiveSuggestion, "id" | "timestamp" | "dismissed">) => void;
  /** 关闭建议 */
  dismissSuggestion: (id: string) => void;
  /** 清空已关闭建议 */
  clearDismissedSuggestions: () => void;
  /** 评估主动建议（由外部调用，传入 store 数据快照） */
  evaluateSuggestions: (pathname: string, context: Record<string, unknown>) => void;
  /** 记录 Expert 协作 handoff */
  addHandoff: (fromId: string, toId: string, summary: string, dataRefs: string[]) => void;
  /** 重置 */
  reset: () => void;
}

// ── 初始状态 ─────────────────────────────────────────────────────────────

const initialState = {
  activeExpertId: null as string | null,
  routingStrategy: "auto" as RoutingStrategy,
  instances: {} as Record<string, ExpertInstance>,
  suggestions: [] as ProactiveSuggestion[],
  handoffs: [] as ExpertHandoff[],
  loadedSkillIds: [] as string[],
};

// ── Store ────────────────────────────────────────────────────────────────

export const useExpertStore = create<ExpertState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setActiveExpert: (expertId) => {
        set({ activeExpertId: expertId });
        // 初始化实例（如果不存在）
        if (expertId && !get().instances[expertId]) {
          set(state => ({
            instances: {
              ...state.instances,
              [expertId]: {
                expertId,
                status: "idle",
                loadedSkillIds: [],
                proactiveCount: 0,
              },
            },
          }));
        }
      },

      setRoutingStrategy: (strategy) => {
        set({ routingStrategy: strategy });
      },

      autoRouteByPage: (pathname) => {
        const strategy = get().routingStrategy;
        if (strategy === "manual") return; // 手动模式不自动路由

        const expert = getRecommendedExpert(pathname);
        if (expert) {
          const currentId = get().activeExpertId;
          if (currentId !== expert.id) {
            set({
              activeExpertId: expert.id,
              instances: {
                ...get().instances,
                [expert.id]: {
                  expertId: expert.id,
                  status: "idle",
                  loadedSkillIds: [],
                  proactiveCount: 0,
                },
              },
            });
          }
        }
      },

      routeByKeywords: (text) => {
        const expert = matchExpertByKeywords(text);
        if (expert) {
          set({
            activeExpertId: expert.id,
            instances: {
              ...get().instances,
              [expert.id]: {
                expertId: expert.id,
                status: "idle",
                loadedSkillIds: [],
                proactiveCount: 0,
              },
            },
          });
        }
      },

      getActiveExpert: () => {
        const id = get().activeExpertId;
        if (!id) return null;
        return EXPERTS.find(e => e.id === id) ?? null;
      },

      getActiveInstance: () => {
        const id = get().activeExpertId;
        if (!id) return null;
        return get().instances[id] ?? null;
      },

      setExpertStatus: (expertId, status) => {
        set(state => ({
          instances: {
            ...state.instances,
            [expertId]: {
              ...(state.instances[expertId] ?? {
                expertId,
                loadedSkillIds: [],
                proactiveCount: 0,
              }),
              status,
            },
          },
        }));
      },

      loadSkillsForExpert: (pathname) => {
        const expert = get().getActiveExpert();
        if (!expert) return [];

        const stageIndex = getPageStage(pathname);
        const skills = loadSkillsForContext(expert, stageIndex);
        const skillIds = skills.map(s => s.id);

        // 更新实例的 loadedSkillIds
        set(state => ({
          loadedSkillIds: skillIds,
          instances: {
            ...state.instances,
            [expert.id]: {
              ...(state.instances[expert.id] ?? {
                expertId: expert.id,
                status: "idle" as const,
                proactiveCount: 0,
              }),
              loadedSkillIds: skillIds,
            },
          },
        }));

        return skills;
      },

      addSuggestion: (suggestion) => {
        const id = `sug-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
        const fullSuggestion: ProactiveSuggestion = {
          ...suggestion,
          id,
          timestamp: new Date().toISOString(),
          dismissed: false,
        };
        set(state => ({
          suggestions: [...state.suggestions, fullSuggestion],
        }));
      },

      dismissSuggestion: (id) => {
        set(state => ({
          suggestions: state.suggestions.map(s =>
            s.id === id ? { ...s, dismissed: true } : s,
          ),
        }));
      },

      clearDismissedSuggestions: () => {
        set(state => ({
          suggestions: state.suggestions.filter(s => !s.dismissed),
        }));
      },

      evaluateSuggestions: (pathname, context) => {
        const stage = getPageStage(pathname);
        const experts = getExpertsForStage(stage);
        const evaluations = evaluateProactiveRules(experts, context);

        for (const eval_ of evaluations) {
          get().addSuggestion({
            expertId: eval_.expert.id,
            expertName: eval_.expert.role,
            expertAvatar: eval_.expert.avatar,
            message: eval_.message,
            priority: eval_.priority,
          });
        }
      },

      addHandoff: (fromId, toId, summary, dataRefs) => {
        const handoff: ExpertHandoff = {
          id: `handoff-${Date.now().toString(36)}`,
          fromExpertId: fromId,
          toExpertId: toId,
          contextSummary: summary,
          dataRefs,
          timestamp: new Date().toISOString(),
        };
        set(state => ({
          handoffs: [...state.handoffs, handoff],
        }));
      },

      reset: () => set(initialState),
    }),
    {
      name: "cd-experts",
      skipHydration: true,
      partialize: (state) => ({
        routingStrategy: state.routingStrategy,
        // 不持久化运行时状态（instances, suggestions, handoffs）
      }),
    },
  ),
);
