import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Lightweight cache that stores per-project narrative snapshots.
 * Each project's data is saved as a partial NarrativeStoreState when
 * the user switches away from it, and restored when they switch back.
 */
interface ProjectDataCacheState {
  /** Map of projectId → serialized narrative data */
  cache: Record<string, Record<string, unknown>>;

  /** Save a project's narrative snapshot to cache */
  saveSnapshot: (projectId: string, data: Record<string, unknown>) => void;

  /** Retrieve a project's cached snapshot (or null if never saved) */
  getSnapshot: (projectId: string) => Record<string, unknown> | null;
}

export const useProjectDataCacheStore = create<ProjectDataCacheState>()(
  persist(
    (set, get) => ({
      cache: {},

      saveSnapshot: (projectId, data) => {
        set((state) => ({
          cache: { ...state.cache, [projectId]: data },
        }));
      },

      getSnapshot: (projectId) => {
        return get().cache[projectId] ?? null;
      },
    }),
    {
      name: 'cd-project-data-cache',
      version: 1,
      skipHydration: true,
    }
  )
);
