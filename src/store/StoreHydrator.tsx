import { useEffect } from "react";
import { useExportStore } from "./use-export-store";
import { useAnalyticsStore } from "./use-analytics-store";
import { useVersionStore } from "./use-version-store";
import { useSkillStore } from "./use-skill-store";
import { useWardrobeStore } from "./use-wardrobe-store";
import { useProjectStore } from "./use-project-store";
import { useNarrativeStore } from "./use-narrative-store";
import { useUIStore } from "./use-ui-store";
import { useSettingsStore } from "./use-settings-store";
import { useCanvasAgentStore } from "./use-canvas-agent-store";
import { useExpertStore } from "./use-expert-store";
import { usePipelineStore } from "./use-pipeline-store";
import { useHistoryStore } from "./use-history-store";
import { useProjectDataCacheStore } from "./use-project-data-cache-store";
import { useAuthStore } from "./use-auth-store";
import { useRelationshipStore } from "./use-relationship-store";
import { useMoralStore } from "./use-moral-store";
import { useNpcStore } from "./use-npc-store";
import { useDciStore } from "./use-dci-store";
import { useCollabStore } from "./use-collab-store";

/**
 * Client-only component that triggers Zustand persist rehydration
 * after mount. This prevents async IndexedDB hydration from running
 * during SSR (where IndexedDB is unavailable) and avoids the
 * "getServerSnapshot should be cached" React warning.
 *
 * ALL persist stores must have `skipHydration: true` and be
 * listed here so hydration only happens after the component mounts
 * on the client (where IndexedDB/localStorage are available).
 *
 * Usage: Place once inside the root layout.
 */
export function StoreHydrator() {
  useEffect(() => {
    useAuthStore.persist.rehydrate();
    useNarrativeStore.persist.rehydrate();
    useProjectStore.persist.rehydrate();
    useExportStore.persist.rehydrate();
    useAnalyticsStore.persist.rehydrate();
    useVersionStore.persist.rehydrate();
    useSkillStore.persist.rehydrate();
    useWardrobeStore.persist.rehydrate();
    useUIStore.persist.rehydrate();
    useSettingsStore.persist.rehydrate();
    useCanvasAgentStore.persist.rehydrate();
    useExpertStore.persist.rehydrate();
    usePipelineStore.persist.rehydrate();
    useHistoryStore.persist.rehydrate();
    useProjectDataCacheStore.persist.rehydrate();
    useRelationshipStore.persist.rehydrate();
    useMoralStore.persist.rehydrate();
    useNpcStore.persist.rehydrate();
    useDciStore.persist.rehydrate();
    useCollabStore.persist.rehydrate();
  }, []);

  return null;
}
