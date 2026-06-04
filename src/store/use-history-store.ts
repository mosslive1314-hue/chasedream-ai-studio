import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface HistoryEntry {
  label: string;
  state: Record<string, unknown>;
  timestamp: number;
}

interface HistoryState {
  past: HistoryEntry[];
  future: HistoryEntry[];
  // Actions
  pushPast: (entry: HistoryEntry) => void;
  pushFuture: (entry: HistoryEntry) => void;
  popPast: () => HistoryEntry | undefined;
  popFuture: () => HistoryEntry | undefined;
  clearFuture: () => void;
  clearAll: () => void;
}

const MAX_HISTORY = 50;

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set, get) => ({
      past: [],
      future: [],

      pushPast: (entry) => {
        const past = get().past;
        set({
          past: [...past.slice(-(MAX_HISTORY - 1)), entry],
        });
      },

      pushFuture: (entry) => {
        const future = get().future;
        set({
          future: [...future.slice(-(MAX_HISTORY - 1)), entry],
        });
      },

      popPast: () => {
        const past = get().past;
        if (past.length === 0) return undefined;
        const entry = past[past.length - 1];
        set({ past: past.slice(0, -1) });
        return entry;
      },

      popFuture: () => {
        const future = get().future;
        if (future.length === 0) return undefined;
        const entry = future[future.length - 1];
        set({ future: future.slice(0, -1) });
        return entry;
      },

      clearFuture: () => set({ future: [] }),
      clearAll: () => set({ past: [], future: [] }),
    }),
    {
      name: 'cd-history',
      skipHydration: true,
      // Don't persist the actual stacks to avoid bloating localStorage
      partialize: () => ({} as HistoryState),
    }
  )
);
