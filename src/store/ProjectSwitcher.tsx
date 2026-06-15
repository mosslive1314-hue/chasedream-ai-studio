import { useEffect, useRef } from "react";
import { useProjectStore, getCurrentProject } from "./use-project-store";
import { useNarrativeStore } from "./use-narrative-store";
import { useSettingsStore } from "./use-settings-store";
import { useProjectDataCacheStore } from "./use-project-data-cache-store";

/**
 * Extracts only the data fields (non-function properties) from the
 * narrative store state. This avoids persisting action methods.
 */
function extractNarrativeData(state: Record<string, unknown>): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  for (const key of Object.keys(state)) {
    if (typeof state[key] !== "function") {
      data[key] = state[key];
    }
  }
  return data;
}

/**
 * Watches currentProjectId from the project store.
 * When the user switches projects:
 *   1. Saves the current narrative data to the OLD project's cache
 *   2. Loads the NEW project's cached data (or keeps seed data for first visit)
 *   3. Syncs useSettingsStore.projectName with the new project's title
 *
 * Place once inside the root layout (after StoreHydrator).
 */
export function ProjectSwitcher() {
  const prevIdRef = useRef<string | null>(null);
  const isFirstRun = useRef(true);

  useEffect(() => {
    const unsub = useProjectStore.subscribe((state, prevState) => {
      const newId = state.currentProjectId;
      const oldId = prevState.currentProjectId;

      // Skip initial hydration
      if (isFirstRun.current) {
        isFirstRun.current = false;
        prevIdRef.current = newId;
        return;
      }

      // No change or null
      if (newId === oldId || !newId) return;

      // 1. Save current narrative data to the OLD project's cache
      const effectiveOldId = oldId ?? prevIdRef.current;
      if (effectiveOldId) {
        const narrativeState = useNarrativeStore.getState();
        const data = extractNarrativeData(narrativeState as unknown as Record<string, unknown>);
        useProjectDataCacheStore.getState().saveSnapshot(effectiveOldId, data);
      }

      // 2. Load the NEW project's cached data (if any)
      const cached = useProjectDataCacheStore.getState().getSnapshot(newId);
      if (cached) {
        useNarrativeStore.getState().loadProjectData(cached as any);
      } else {
        // First time visiting this project — reset to seed defaults
        useNarrativeStore.getState().resetToDefaults();
      }

      // 3. Sync settings store projectName with the new project title
      const project = getCurrentProject();
      if (project) {
        useSettingsStore.getState().setProjectName(project.title);
      }

      prevIdRef.current = newId;
    });

    return unsub;
  }, []);

  return null;
}
