"use client";

import { useEffect, useRef, useState } from "react";
import { useNarrativeStore } from "@/store";

export type SaveStatus = "idle" | "saving" | "saved";

/**
 * useSaveStatus — 真实保存状态追踪 Hook
 *
 * 监听 narrative store 的数据变化，反映真实的持久化状态。
 * Zustand persist 中间件使用 localStorage（同步写入），
 * 所以每次状态变更都会立即持久化。
 *
 * 状态流：数据变更 → "saving"（500ms 视觉反馈）→ "saved"（带时间戳）
 */
export function useSaveStatus(): { status: SaveStatus; lastSaved: Date | null } {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevSnapshotRef = useRef<string>("");
  const initializedRef = useRef(false);

  useEffect(() => {
    // 初始化：如果 store 已有数据（从 localStorage rehydration），标记为已保存
    if (!initializedRef.current) {
      initializedRef.current = true;
      const state = useNarrativeStore.getState();
      if (state.storyNodes.length > 0) {
        setStatus("saved");
        setLastSaved(new Date());
      }
      // 记录初始快照
      prevSnapshotRef.current = JSON.stringify({
        n: state.storyNodes.length,
        e: state.nodeEdges.length,
        c: state.characters.length,
        lastNode: state.storyNodes[state.storyNodes.length - 1]?.id ?? "",
        lastEdge: state.nodeEdges[state.nodeEdges.length - 1]?.id ?? "",
      });
    }

    // 订阅 store 变化
    const unsubscribe = useNarrativeStore.subscribe((state) => {
      // 只关心影响持久化的核心数据
      const snapshot = JSON.stringify({
        n: state.storyNodes.length,
        e: state.nodeEdges.length,
        c: state.characters.length,
        // 最后一个节点的 id + label 作为变更指纹
        lastNode: state.storyNodes[state.storyNodes.length - 1]?.id ?? "",
        lastEdge: state.nodeEdges[state.nodeEdges.length - 1]?.id ?? "",
      });

      if (snapshot !== prevSnapshotRef.current) {
        prevSnapshotRef.current = snapshot;
        setStatus("saving");

        // 清除之前的定时器
        if (timerRef.current) clearTimeout(timerRef.current);

        // 500ms 后标记为已保存（localStorage 写入是同步的，这里只是视觉反馈）
        timerRef.current = setTimeout(() => {
          setStatus("saved");
          setLastSaved(new Date());
        }, 500);
      }
    });

    return () => {
      unsubscribe();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { status, lastSaved };
}
