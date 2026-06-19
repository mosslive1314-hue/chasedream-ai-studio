import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// 道德阵营（D&D 风格简化版）
export type MoralAlignment =
  | 'lawful_good'
  | 'neutral_good'
  | 'chaotic_good'
  | 'lawful_neutral'
  | 'true_neutral'
  | 'chaotic_neutral'
  | 'lawful_evil'
  | 'neutral_evil'
  | 'chaotic_evil';

// 道德行为历史记录
export interface MoralHistoryEntry {
  /** 记录唯一 ID */
  id: string;
  /** 时间戳 ISO 字符串 */
  timestamp: string;
  /** 行为描述 */
  action: string;
  /** 守序混乱变化 */
  lawChaosDelta: number;
  /** 善恶变化 */
  goodEvilDelta: number;
  /** 关联的节点 */
  nodeId?: string;
}

interface MoralStoreState {
  /** 守序(-100) ↔ 混乱(100) */
  lawChaos: number;
  /** 善良(-100) ↔ 邪恶(100) */
  goodEvil: number;
  /** 历史记录 */
  history: MoralHistoryEntry[];
  /** 记录道德行为，更新数值并写入历史 */
  recordAction: (
    action: string,
    lawChaosDelta: number,
    goodEvilDelta: number,
    nodeId?: string
  ) => void;
  /** 根据当前数值计算阵营（非响应式，用于工具/handler） */
  getAlignment: () => MoralAlignment;
  /** 重置道德状态 */
  reset: () => void;
}

/** 生成历史记录唯一 ID */
function genHistoryId(): string {
  return `MORAL${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

/** 将数值限制在 -100 到 100 之间 */
function clampAxis(value: number): number {
  return Math.max(-100, Math.min(100, value));
}

/**
 * 根据两个轴的数值计算阵营
 * - lawChaos < -33 → lawful, > 33 → chaotic, else neutral
 * - goodEvil < -33 → good, > 33 → evil, else neutral
 */
export function computeAlignment(lawChaos: number, goodEvil: number): MoralAlignment {
  const lawChaosAxis: 'lawful' | 'neutral' | 'chaotic' =
    lawChaos < -33 ? 'lawful' : lawChaos > 33 ? 'chaotic' : 'neutral';
  const goodEvilAxis: 'good' | 'neutral' | 'evil' =
    goodEvil < -33 ? 'good' : goodEvil > 33 ? 'evil' : 'neutral';

  // 组合阵营：lawful/neutral/chaotic + good/neutral/evil
  // 两个轴都为 neutral 时为 true_neutral
  if (lawChaosAxis === 'neutral' && goodEvilAxis === 'neutral') return 'true_neutral';
  return `${lawChaosAxis}_${goodEvilAxis}` as MoralAlignment;
}

// 阵营中文标签
export const ALIGNMENT_LABELS: Record<MoralAlignment, string> = {
  lawful_good: '守序善良',
  neutral_good: '中立善良',
  chaotic_good: '混乱善良',
  lawful_neutral: '守序中立',
  true_neutral: '绝对中立',
  chaotic_neutral: '混乱中立',
  lawful_evil: '守序邪恶',
  neutral_evil: '中立邪恶',
  chaotic_evil: '混乱邪恶',
};

export const useMoralStore = create<MoralStoreState>()(
  persist(
    (set, get) => ({
      lawChaos: 0,
      goodEvil: 0,
      history: [],

      recordAction: (action, lawChaosDelta, goodEvilDelta, nodeId) => {
        const entry: MoralHistoryEntry = {
          id: genHistoryId(),
          timestamp: new Date().toISOString(),
          action,
          lawChaosDelta,
          goodEvilDelta,
          nodeId,
        };
        set((state) => ({
          lawChaos: clampAxis(state.lawChaos + lawChaosDelta),
          goodEvil: clampAxis(state.goodEvil + goodEvilDelta),
          history: [...state.history, entry],
        }));
      },

      getAlignment: () => {
        const { lawChaos, goodEvil } = get();
        return computeAlignment(lawChaos, goodEvil);
      },

      reset: () => {
        set({ lawChaos: 0, goodEvil: 0, history: [] });
      },
    }),
    {
      name: 'cd-moral',
      skipHydration: true,
    }
  )
);
