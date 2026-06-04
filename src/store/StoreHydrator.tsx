"use client";
import { useEffect } from "react";
import { useExportStore } from "./use-export-store";
import { useAnalyticsStore } from "./use-analytics-store";
import { useVersionStore } from "./use-version-store";
import { useSkillStore } from "./use-skill-store";
import { useWardrobeStore } from "./use-wardrobe-store";

/**
 * Client-only component that triggers Zustand persist rehydration
 * after mount. This prevents async IndexedDB hydration from running
 * during SSR (where IndexedDB is unavailable) and avoids the
 * "getServerSnapshot should be cached" React warning.
 *
 * Usage: Place once inside the root layout.
 */
export function StoreHydrator() {
  useEffect(() => {
    useExportStore.persist.rehydrate();
    useAnalyticsStore.persist.rehydrate();
    useVersionStore.persist.rehydrate();
    useSkillStore.persist.rehydrate();
    useWardrobeStore.persist.rehydrate();
  }, []);

  return null;
}
