// ChaseDream Creator Studio — Skill Store
// Skill 经验沉淀系统状态管理：Skill 定义、执行记录、管线映射

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { idbStorage } from './idb-storage';
import type {
  Skill,
  SkillExecution,
  SkillPipelineMapping,
  SkillExecutionStatus,
  SkillStepResult,
} from '@/lib/types/skill';
import { SKILLS as SEED_SKILLS, SKILL_PIPELINE_MAPPINGS } from '@/lib/seed/skill-seed';

// ── Seed state ────────────────────────────────────────────────────────────

const seedState = {
  skills: SEED_SKILLS,
  executions: [] as SkillExecution[],
  pipelineMappings: SKILL_PIPELINE_MAPPINGS,
};

// ── Store interface ───────────────────────────────────────────────────────

interface SkillState {
  // ── 数据 ──
  skills: Skill[];
  executions: SkillExecution[];
  pipelineMappings: SkillPipelineMapping[];

  // ── Skill CRUD ──
  addSkill: (skill: Skill) => void;
  updateSkill: (skillId: string, updates: Partial<Skill>) => void;
  removeSkill: (skillId: string) => void;
  incrementUsage: (skillId: string) => void;
  updateEffectiveness: (skillId: string, score: number) => void;

  // ── Skill Execution ──
  startExecution: (skillId: string, expertId?: string, pipelineStage?: number) => string;
  updateStepResult: (executionId: string, stepOrder: number, result: Partial<SkillStepResult>) => void;
  completeExecution: (executionId: string, status: SkillExecutionStatus, producedDataIds?: string[]) => void;

  // ── Pipeline Mappings ──
  updatePipelineMapping: (stageIndex: number, mapping: Partial<SkillPipelineMapping>) => void;
  getSkillsForStage: (stageIndex: number) => Skill[];
  getAutoLoadSkillsForStage: (stageIndex: number) => Skill[];

  // ── 查询 ──
  getSkill: (skillId: string) => Skill | undefined;
  getSkillsByDomain: (domain: string) => Skill[];
  getSkillsByTag: (tag: string) => Skill[];
  getRecentExecutions: (skillId: string, limit?: number) => SkillExecution[];
}

// ── Store ─────────────────────────────────────────────────────────────────

export const useSkillStore = create<SkillState>()(
  persist(
    (set, get) => ({
      // ── Initial state ──
      skills: seedState.skills,
      executions: seedState.executions,
      pipelineMappings: seedState.pipelineMappings,

      // ── Skill CRUD ──
      addSkill: (skill) => {
        set(state => ({
          skills: [...state.skills, skill],
        }));
      },

      updateSkill: (skillId, updates) => {
        set(state => ({
          skills: state.skills.map(s =>
            s.id === skillId ? { ...s, ...updates, version: s.version + 1 } : s,
          ),
        }));
      },

      removeSkill: (skillId) => {
        set(state => ({
          skills: state.skills.filter(s => s.id !== skillId),
        }));
      },

      incrementUsage: (skillId) => {
        set(state => ({
          skills: state.skills.map(s =>
            s.id === skillId
              ? { ...s, usageCount: s.usageCount + 1, lastUsedAt: new Date().toISOString() }
              : s,
          ),
        }));
      },

      updateEffectiveness: (skillId, score) => {
        set(state => ({
          skills: state.skills.map(s => {
            if (s.id !== skillId) return s;
            // Weighted average: 80% old score, 20% new score
            const newScore = Math.round(s.effectivenessScore * 0.8 + score * 0.2);
            return { ...s, effectivenessScore: newScore };
          }),
        }));
      },

      // ── Skill Execution ──
      startExecution: (skillId, expertId, pipelineStage) => {
        const id = `exec-${Date.now().toString(36)}`;
        const skill = get().skills.find(s => s.id === skillId);
        const stepResults: SkillStepResult[] = (skill?.workflow ?? []).map(step => ({
          stepOrder: step.order,
          status: 'pending' as const,
        }));

        const execution: SkillExecution = {
          id,
          skillId,
          expertId,
          pipelineStage,
          stepResults,
          status: 'running',
          startedAt: new Date().toISOString(),
          producedDataIds: [],
        };

        set(state => ({
          executions: [...state.executions, execution],
        }));

        // Auto-increment usage
        get().incrementUsage(skillId);

        return id;
      },

      updateStepResult: (executionId, stepOrder, result) => {
        set(state => ({
          executions: state.executions.map(e => {
            if (e.id !== executionId) return e;
            return {
              ...e,
              stepResults: e.stepResults.map(sr =>
                sr.stepOrder === stepOrder ? { ...sr, ...result } : sr,
              ),
            };
          }),
        }));
      },

      completeExecution: (executionId, status, producedDataIds) => {
        set(state => ({
          executions: state.executions.map(e => {
            if (e.id !== executionId) return e;
            return {
              ...e,
              status,
              completedAt: new Date().toISOString(),
              producedDataIds: producedDataIds ?? e.producedDataIds,
            };
          }),
        }));
      },

      // ── Pipeline Mappings ──
      updatePipelineMapping: (stageIndex, mapping) => {
        set(state => ({
          pipelineMappings: state.pipelineMappings.map(m =>
            m.stageIndex === stageIndex ? { ...m, ...mapping } : m,
          ),
        }));
      },

      getSkillsForStage: (stageIndex) => {
        const mapping = get().pipelineMappings.find(m => m.stageIndex === stageIndex);
        if (!mapping) return [];
        return mapping.recommendedSkillIds
          .map(id => get().skills.find(s => s.id === id))
          .filter((s): s is Skill => s !== undefined);
      },

      getAutoLoadSkillsForStage: (stageIndex) => {
        const mapping = get().pipelineMappings.find(m => m.stageIndex === stageIndex);
        if (!mapping || !mapping.autoLoad) return [];
        return mapping.recommendedSkillIds
          .map(id => get().skills.find(s => s.id === id))
          .filter((s): s is Skill => s !== undefined);
      },

      // ── 查询 ──
      getSkill: (skillId) => {
        return get().skills.find(s => s.id === skillId);
      },

      getSkillsByDomain: (domain) => {
        return get().skills.filter(s => s.domain === domain);
      },

      getSkillsByTag: (tag) => {
        return get().skills.filter(s => s.tags.includes(tag));
      },

      getRecentExecutions: (skillId, limit = 10) => {
        return get()
          .executions
          .filter(e => e.skillId === skillId)
          .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
          .slice(0, limit);
      },
    }),
    {
      name: 'cd-skills',
      version: 1,
      storage: createJSONStorage(() => idbStorage),
      skipHydration: true,
      migrate: () => seedState as any,
    },
  ),
);
