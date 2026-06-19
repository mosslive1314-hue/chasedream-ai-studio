// 音频播放组件 — 不可见组件，挂载在 SimulatorScreen 内
// 监听 SceneContext 中的 AudioObject 变化，驱动 AudioManager 播放
// 同时处理页面可见性变化（suspend/resume）

"use client";

import { useEffect, useRef } from "react";
import { getAudioManager } from "@/lib/audio";
import type { AudioObject } from "@/lib/runtime/scene-objects";

interface AudioPlayerProps {
  /** 当前场景中的所有音频对象 */
  audioObjects: AudioObject[];
}

/**
 * AudioPlayer — 不可见的音频驱动组件
 * - BGM：跟踪 URL 变化，仅在变化时播放/停止
 * - SFX/Voice：一次性播放，每次新增即触发
 * - 页面可见性：隐藏时 suspend，可见时 resume
 */
export function AudioPlayer({ audioObjects }: AudioPlayerProps) {
  // 上一次的 BGM URL，用于检测变化
  const prevBgmUrlRef = useRef<string | null>(null);
  // 已播放过的 SFX/Voice 对象 ID 集合，避免重复播放
  const playedSfxIdsRef = useRef<Set<string>>(new Set());

  // 监听音频对象变化
  useEffect(() => {
    const manager = getAudioManager();

    // 查找当前 BGM 对象（取第一个 bgm 类型）
    const bgmObj = audioObjects.find((o) => o.audioKind === "bgm" && o.visible);
    const currentBgmUrl = bgmObj?.audioUrl ?? null;

    // BGM 变化时才操作
    if (currentBgmUrl !== prevBgmUrlRef.current) {
      if (currentBgmUrl) {
        // 新 BGM 或切换 BGM
        void manager.playBgm(currentBgmUrl, {
          volume: bgmObj?.volume,
          fadeTime: 0.5,
        });
      } else {
        // BGM 被移除 → 停止
        manager.stopBgm(0.5);
      }
      prevBgmUrlRef.current = currentBgmUrl;
    }

    // 处理 SFX 和 Voice（一次性播放）
    for (const obj of audioObjects) {
      if (obj.audioKind === "bgm") continue;
      if (!obj.visible) continue;
      // 跳过已播放过的
      if (playedSfxIdsRef.current.has(obj.id)) continue;
      playedSfxIdsRef.current.add(obj.id);

      if (obj.audioKind === "voice") {
        void manager.playVoice(obj.audioUrl, obj.volume);
      } else {
        void manager.playSfx(obj.audioUrl, obj.volume);
      }
    }
  }, [audioObjects]);

  // 页面可见性变化 — suspend/resume AudioContext
  useEffect(() => {
    if (typeof document === "undefined") return;
    const manager = getAudioManager();
    const engine = manager.getEngine();

    const handleVisibilityChange = () => {
      if (document.hidden) {
        engine.suspend();
      } else {
        engine.resume();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // 组件卸载时停止所有音频
  useEffect(() => {
    const playedSfxIds = playedSfxIdsRef.current;
    return () => {
      const manager = getAudioManager();
      manager.stopAll();
      playedSfxIds.clear();
    };
  }, []);

  // 不可见组件 — 不渲染任何 DOM
  return null;
}
