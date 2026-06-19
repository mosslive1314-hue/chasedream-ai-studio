import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// 角色关系类型
export type RelationshipType =
  | 'ally'
  | 'rival'
  | 'lover'
  | 'family'
  | 'mentor'
  | 'enemy'
  | 'neutral';

// 角色关系
export interface CharacterRelationship {
  /** 关系唯一 ID */
  id: string;
  /** 角色 A */
  fromCharacterId: string;
  /** 角色 B */
  toCharacterId: string;
  /** 关系类型 */
  type: RelationshipType;
  /** 关系强度 -100 到 100（负数=敌对，正数=友好） */
  strength: number;
  /** 关系描述 */
  description?: string;
}

// 关系类型中文标签
export const RELATIONSHIP_TYPE_LABELS: Record<RelationshipType, string> = {
  ally: '盟友',
  rival: '对手',
  lover: '恋人',
  family: '家人',
  mentor: '师徒',
  enemy: '敌人',
  neutral: '中立',
};

interface RelationshipStoreState {
  /** 关系列表 */
  relationships: CharacterRelationship[];
  /** 添加角色关系 */
  addRelationship: (rel: Omit<CharacterRelationship, 'id'>) => void;
  /** 更新角色关系 */
  updateRelationship: (id: string, patch: Partial<CharacterRelationship>) => void;
  /** 删除角色关系 */
  removeRelationship: (id: string) => void;
  /** 获取某角色的所有关系（非响应式，用于工具/handler） */
  getCharacterRelationships: (characterId: string) => CharacterRelationship[];
  /** 调整关系强度（自动 clamp -100~100） */
  adjustStrength: (id: string, delta: number) => void;
}

/** 生成关系唯一 ID */
function genRelationshipId(): string {
  return `REL${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

/** 将强度限制在 -100 到 100 之间 */
function clampStrength(value: number): number {
  return Math.max(-100, Math.min(100, value));
}

export const useRelationshipStore = create<RelationshipStoreState>()(
  persist(
    (set, get) => ({
      relationships: [],

      addRelationship: (rel) => {
        const newRel: CharacterRelationship = {
          ...rel,
          id: genRelationshipId(),
          strength: clampStrength(rel.strength),
        };
        set((state) => ({ relationships: [...state.relationships, newRel] }));
      },

      updateRelationship: (id, patch) => {
        set((state) => ({
          relationships: state.relationships.map((r) =>
            r.id === id
              ? { ...r, ...patch, strength: patch.strength !== undefined ? clampStrength(patch.strength) : r.strength }
              : r
          ),
        }));
      },

      removeRelationship: (id) => {
        set((state) => ({
          relationships: state.relationships.filter((r) => r.id !== id),
        }));
      },

      getCharacterRelationships: (characterId) => {
        return get().relationships.filter(
          (r) => r.fromCharacterId === characterId || r.toCharacterId === characterId
        );
      },

      adjustStrength: (id, delta) => {
        set((state) => ({
          relationships: state.relationships.map((r) =>
            r.id === id ? { ...r, strength: clampStrength(r.strength + delta) } : r
          ),
        }));
      },
    }),
    {
      name: 'cd-relationships',
      skipHydration: true,
    }
  )
);
