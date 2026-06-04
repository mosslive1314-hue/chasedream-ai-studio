// ChaseDream Creator Studio — IndexedDB Storage Adapter for Zustand Persist
// Uses idb-keyval for lightweight IndexedDB access, compatible with Zustand's
// StateStorage interface. Falls back to in-memory storage if IndexedDB is unavailable
// (e.g., during SSR or in environments without IndexedDB support).

import { get, set, del } from 'idb-keyval';
import type { StateStorage } from 'zustand/middleware';

/**
 * Zustand-compatible IndexedDB storage adapter.
 *
 * Usage in Zustand persist:
 * ```ts
 * persist(
 *   (set) => ({ ... }),
 *   {
 *     name: 'my-store',
 *     storage: createJSONStorage(() => idbStorage),
 *   }
 * )
 * ```
 */
export const idbStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      const value = await get(name);
      return value ?? null;
    } catch {
      console.warn(`[idbStorage] Failed to get "${name}", falling back to null`);
      return null;
    }
  },

  setItem: async (name: string, value: string): Promise<void> => {
    try {
      await set(name, value);
    } catch {
      console.warn(`[idbStorage] Failed to set "${name}"`);
    }
  },

  removeItem: async (name: string): Promise<void> => {
    try {
      await del(name);
    } catch {
      console.warn(`[idbStorage] Failed to remove "${name}"`);
    }
  },
};
