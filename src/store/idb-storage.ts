// ChaseDream Creator Studio — IndexedDB Storage Adapter for Zustand Persist
// Uses idb-keyval for lightweight IndexedDB access, compatible with Zustand's
// StateStorage interface. Falls back to in-memory storage if IndexedDB is unavailable
// (e.g., during SSR, in sandboxed iframes, or when the browser blocks storage access).

import type { StateStorage } from 'zustand/middleware';

/**
 * Cached availability flag — once we know IndexedDB is unavailable,
 * we skip all future checks to avoid repeated errors in the console.
 */
let idbAvailable: boolean | null = null;

/**
 * Check if IndexedDB is available in the current context.
 * Returns false during SSR, in sandboxed iframes, or when
 * the browser blocks storage access (privacy mode, CSP, etc.).
 *
 * This does a real probe (open + delete a test DB) rather than
 * just checking `typeof indexedDB`, because some environments
 * define the global but throw when you actually use it.
 */
function isIndexedDBAvailable(): boolean {
  // Return cached result if we've already checked
  if (idbAvailable !== null) return idbAvailable;

  try {
    if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
      idbAvailable = false;
      return false;
    }

    // Probe: try to open a test database. If the browser blocks
    // storage access, this will throw (e.g., "Access to storage
    // is not allowed from this context").
    const testReq = indexedDB.open('__cd_idb_probe__', 1);
    testReq.onerror = () => {
      idbAvailable = false;
    };
    testReq.onsuccess = () => {
      // Clean up the probe DB
      try {
        indexedDB.deleteDatabase('__cd_idb_probe__');
      } catch { /* ignore */ }
      idbAvailable = true;
    };

    // Optimistic: assume available until the probe fails.
    // The probe is async so we'll still try the first time.
    // If it fails, subsequent calls will use the cached false.
    idbAvailable = true;
    return true;
  } catch {
    idbAvailable = false;
    return false;
  }
}

/**
 * In-memory fallback storage — used when IndexedDB is not available.
 */
const memoryStore = new Map<string, string>();

/**
 * Zustand-compatible IndexedDB storage adapter.
 *
 * Automatically falls back to in-memory storage if IndexedDB is
 * unavailable (SSR, sandboxed contexts, storage blocked, etc.).
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
    if (!isIndexedDBAvailable()) {
      return memoryStore.get(name) ?? null;
    }
    try {
      const { get } = await import('idb-keyval');
      const value = await get(name);
      return value ?? null;
    } catch {
      console.warn(`[idbStorage] Failed to get "${name}", falling back to memory`);
      idbAvailable = false; // Cache the failure
      return memoryStore.get(name) ?? null;
    }
  },

  setItem: async (name: string, value: string): Promise<void> => {
    memoryStore.set(name, value); // Always keep memory in sync
    if (!isIndexedDBAvailable()) return;
    try {
      const { set } = await import('idb-keyval');
      await set(name, value);
    } catch {
      console.warn(`[idbStorage] Failed to set "${name}"`);
      idbAvailable = false; // Cache the failure
    }
  },

  removeItem: async (name: string): Promise<void> => {
    memoryStore.delete(name); // Always keep memory in sync
    if (!isIndexedDBAvailable()) return;
    try {
      const { del } = await import('idb-keyval');
      await del(name);
    } catch {
      console.warn(`[idbStorage] Failed to remove "${name}"`);
      idbAvailable = false; // Cache the failure
    }
  },
};
