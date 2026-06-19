/**
 * NPC 灵魂状态 Store
 *
 * 管理所有角色的灵魂状态（人格向量 + 记忆 + 情绪）。
 *
 * 持久化配置：
 * - name: 'cd-npc-souls'
 * - skipHydration: true（由 StoreHydrator 统一触发 rehydrate）
 * - 已在 StoreHydrator.tsx 中注册 rehydrate，刷新页面后自动恢复数据
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  PersonalityVector,
  MemoryEntry,
  CurrentMood,
  NpcSoul,
} from '@/lib/npc-soul-engine';

// ─── 类型定义 ─────────────────────────────────────────────────────────────

interface NpcStoreState {
  /** characterId → 灵魂状态 */
  souls: Record<string, NpcSoul>;

  /** 初始化灵魂（若已存在则不覆盖） */
  initSoul: (characterId: string, personality?: PersonalityVector) => void;

  /** 设置/更新人格向量 */
  setPersonality: (characterId: string, personality: PersonalityVector) => void;

  /** 添加记忆（完整 MemoryEntry，含 id/timestamp） */
  addMemory: (characterId: string, memory: MemoryEntry) => void;

  /** 更新当前情绪状态 */
  updateMood: (
    characterId: string,
    emotion: string,
    intensity: number,
    trigger?: string,
  ) => void;

  /** 记忆衰减：降低 importance，清理低权重记忆 */
  decayMemories: (characterId: string) => void;

  /** 获取灵魂状态（非响应式，用于工具/handler） */
  getSoul: (characterId: string) => NpcSoul | undefined;

  /** 移除灵魂状态 */
  removeSoul: (characterId: string) => void;
}

// ─── 工具函数 ─────────────────────────────────────────────────────────────

/** 默认人格向量（空灵魂的初始值） */
function createDefaultPersonality(): PersonalityVector {
  return {
    core_motivation: [],
    info_boundaries: {
      knows: [],
      unknown: [],
      uncertain: [],
    },
    emotional_response: [],
    language_style: {
      formality: 50,
      verbosity: 50,
      tone: '中性',
    },
    relationship_weights: {},
  };
}

/** 默认情绪状态（平静） */
function createDefaultMood(): CurrentMood {
  return {
    emotion: '平静',
    intensity: 20,
  };
}

/** 创建空灵魂 */
function createEmptySoul(characterId: string, personality?: PersonalityVector): NpcSoul {
  return {
    characterId,
    personality: personality ?? createDefaultPersonality(),
    memories: [],
    currentMood: createDefaultMood(),
  };
}

/** 记忆衰减比例：每次调用 decayMemories，importance 乘以此系数 */
const DECAY_FACTOR = 0.85;
/** importance 低于此阈值的记忆将被清理 */
const CLEANUP_THRESHOLD = 5;

// ─── Store 创建 ───────────────────────────────────────────────────────────

export const useNpcStore = create<NpcStoreState>()(
  persist(
    (set, get) => ({
      souls: {},

      initSoul: (characterId, personality) => {
        // 已存在则不覆盖，避免重置已有数据
        if (get().souls[characterId]) return;
        set((state) => ({
          souls: {
            ...state.souls,
            [characterId]: createEmptySoul(characterId, personality),
          },
        }));
      },

      setPersonality: (characterId, personality) => {
        set((state) => {
          const existing = state.souls[characterId];
          // 若灵魂不存在，先创建再设置人格
          const soul = existing ?? createEmptySoul(characterId);
          return {
            souls: {
              ...state.souls,
              [characterId]: { ...soul, personality },
            },
          };
        });
      },

      addMemory: (characterId, memory) => {
        set((state) => {
          const existing = state.souls[characterId];
          const soul = existing ?? createEmptySoul(characterId);
          return {
            souls: {
              ...state.souls,
              [characterId]: {
                ...soul,
                memories: [...soul.memories, memory],
              },
            },
          };
        });
      },

      updateMood: (characterId, emotion, intensity, trigger) => {
        set((state) => {
          const existing = state.souls[characterId];
          const soul = existing ?? createEmptySoul(characterId);
          return {
            souls: {
              ...state.souls,
              [characterId]: {
                ...soul,
                currentMood: { emotion, intensity, trigger },
              },
            },
          };
        });
      },

      decayMemories: (characterId) => {
        set((state) => {
          const soul = state.souls[characterId];
          if (!soul || soul.memories.length === 0) return state;

          // 衰减每条记忆的 importance，并清理低于阈值的
          const decayedMemories = soul.memories
            .map((m) => ({
              ...m,
              importance: Math.round(m.importance * DECAY_FACTOR),
            }))
            .filter((m) => m.importance >= CLEANUP_THRESHOLD);

          return {
            souls: {
              ...state.souls,
              [characterId]: { ...soul, memories: decayedMemories },
            },
          };
        });
      },

      getSoul: (characterId) => get().souls[characterId],

      removeSoul: (characterId) => {
        set((state) => {
          const newSouls = { ...state.souls };
          delete newSouls[characterId];
          return { souls: newSouls };
        });
      },
    }),
    {
      name: 'cd-npc-souls',
      skipHydration: true,
    },
  ),
);
