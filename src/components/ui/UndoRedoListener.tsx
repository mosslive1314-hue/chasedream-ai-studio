import { useEffect, useRef } from "react";
import { useNarrativeStore } from "@/store";
import { useHistoryStore } from "@/store/use-history-store";
import { useUIStore } from "@/store";

// Data-only keys to snapshot (exclude functions and UI state)
const DATA_KEYS: string[] = [
  "storyNodes", "nodeEdges", "characters", "scenes", "props",
  "variables", "scriptBlocks", "assetCards", "branchPaths",
  "qualityChecks", "interactionPoints", "chapterPlans", "worldRules",
  "narrativeIntents", "playableGraph", "initVariables",
  "characterTimelines", "crossCharacterEffects", "narrativeStates",
  "consequenceChains", "cinematicDirections", "collabTasks",
  "collabComments", "reviewItems", "versionDiffs", "qteConfigs",
  "hotspotConfigs", "entityRelations", "characterSceneAppearances",
];

function captureSnapshot(): Record<string, unknown> {
  const state = useNarrativeStore.getState() as unknown as Record<string, unknown>;
  const snap: Record<string, unknown> = {};
  for (const key of DATA_KEYS) {
    if (key in state) snap[key] = state[key];
  }
  return snap;
}

function applySnapshot(snap: Record<string, unknown>) {
  useNarrativeStore.setState(snap as never);
}

// Debounce helper
function debounce<T extends (...args: unknown[]) => void>(fn: T, ms: number) {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

export function UndoRedoListener() {
  const lastSnapshot = useRef<Record<string, unknown> | null>(null);
  const isUndoRedo = useRef(false);

  useEffect(() => {
    // Initialize snapshot on mount
    lastSnapshot.current = captureSnapshot();

    const debouncedSetSaved = debounce(() => {
      useUIStore.getState().setSaveStatus('saved');
    }, 1500);

    // Subscribe to narrative store changes
    const unsub = useNarrativeStore.subscribe((state, prevState) => {
      if (isUndoRedo.current) {
        isUndoRedo.current = false;
        lastSnapshot.current = captureSnapshot();
        return;
      }

      // Check if any data key actually changed
      let changed = false;
      for (const key of DATA_KEYS) {
        if ((state as unknown as Record<string, unknown>)[key] !== (prevState as unknown as Record<string, unknown>)[key]) {
          changed = true;
          break;
        }
      }
      if (!changed) return;

      // Push old snapshot to past
      if (lastSnapshot.current) {
        useHistoryStore.getState().pushPast({
          label: 'edit',
          state: lastSnapshot.current,
          timestamp: Date.now(),
        });
        useHistoryStore.getState().clearFuture();
      }
      lastSnapshot.current = captureSnapshot();

      // Update auto-save status
      useUIStore.getState().setSaveStatus('saving');
      debouncedSetSaved();
    });

    // Keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrlZ = (e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'z';
      const isCtrlShiftZ = (e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z';
      const isCtrlY = (e.ctrlKey || e.metaKey) && e.key === 'y';

      // Don't capture undo/redo in input/textarea fields
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable) {
        return;
      }

      if (isCtrlZ) {
        e.preventDefault();
        const entry = useHistoryStore.getState().popPast();
        if (entry) {
          // Push current state to future for redo
          useHistoryStore.getState().pushFuture({
            label: 'redo',
            state: captureSnapshot(),
            timestamp: Date.now(),
          });
          isUndoRedo.current = true;
          applySnapshot(entry.state);
        }
      }

      if (isCtrlShiftZ || isCtrlY) {
        e.preventDefault();
        const entry = useHistoryStore.getState().popFuture();
        if (entry) {
          // Push current state to past for undo
          useHistoryStore.getState().pushPast({
            label: 'undo',
            state: captureSnapshot(),
            timestamp: Date.now(),
          });
          isUndoRedo.current = true;
          applySnapshot(entry.state);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      unsub();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return null;
}
