/**
 * Persistence utilities for ChaseDream Creator Studio
 * Handles auto-save, data recovery, and storage management
 */

// Storage key constants
const STORAGE_KEYS = {
  PROJECTS: 'cd-projects',
  NARRATIVE: 'cd-narrative',
  UI: 'cd-ui',
  INDUSTRY: 'cd-industry',
  LAST_PROJECT: 'cd-last-project',
} as const;

/**
 * Auto-save hook utility.
 * Call this from layout.tsx to enable auto-save indicator.
 */
export function createAutoSaveHandler() {
  let saveTimeout: ReturnType<typeof setTimeout> | null = null;

  return {
    markUnsaved: (setSaveStatus: (s: 'saved' | 'saving' | 'unsaved') => void) => {
      setSaveStatus('unsaved');
      if (saveTimeout) clearTimeout(saveTimeout);
      saveTimeout = setTimeout(() => {
        setSaveStatus('saving');
        setTimeout(() => setSaveStatus('saved'), 500);
      }, 2000);
    },
    cleanup: () => {
      if (saveTimeout) clearTimeout(saveTimeout);
    }
  };
}

/**
 * Check if persisted data exists and is valid
 */
export function hasPersistedData(): boolean {
  try {
    const projects = localStorage.getItem(STORAGE_KEYS.PROJECTS);
    return projects !== null && JSON.parse(projects)?.state?.projects?.length > 0;
  } catch {
    return false;
  }
}

/**
 * Get the last active project ID
 */
export function getLastProjectId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEYS.LAST_PROJECT);
  } catch {
    return null;
  }
}

/**
 * Set the last active project ID
 */
export function setLastProjectId(id: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.LAST_PROJECT, id);
  } catch {}
}

/**
 * Calculate storage usage in KB
 */
export function getStorageUsage(): { used: number; label: string } {
  let total = 0;
  Object.values(STORAGE_KEYS).forEach(key => {
    try {
      const item = localStorage.getItem(key);
      if (item) total += item.length * 2; // UTF-16
    } catch {}
  });
  const kb = total / 1024;
  return { used: kb, label: kb < 1 ? '< 1 KB' : `${kb.toFixed(1)} KB` };
}

/**
 * Clear all persisted data (for reset/settings)
 */
export function clearAllData(): void {
  Object.values(STORAGE_KEYS).forEach(key => {
    try { localStorage.removeItem(key); } catch {}
  });
}

/**
 * Export all data as JSON string (for backup)
 */
export function exportAllData(): string {
  const data: Record<string, unknown> = {};
  Object.entries(STORAGE_KEYS).forEach(([name, key]) => {
    try {
      const item = localStorage.getItem(key);
      if (item) data[name] = JSON.parse(item);
    } catch {}
  });
  return JSON.stringify(data, null, 2);
}

/**
 * Import data from JSON string (for restore)
 */
export function importAllData(jsonString: string): boolean {
  try {
    const data = JSON.parse(jsonString);
    Object.entries(STORAGE_KEYS).forEach(([name, key]) => {
      if (data[name]) {
        localStorage.setItem(key, JSON.stringify(data[name]));
      }
    });
    return true;
  } catch {
    return false;
  }
}

export { STORAGE_KEYS };
