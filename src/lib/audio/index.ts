// 音频模块统一导出 + 全局单例
// SSR 安全：单例懒创建，仅在首次调用时实例化

export { AudioEngine, type AudioEngineState } from './audio-engine';
export {
  AudioManager,
  type VolumeType,
  type VolumeSettings,
  type AudioSerializableState,
} from './audio-manager';

import { AudioManager } from './audio-manager';

// 全局单例 — 浏览器端共享同一个 AudioManager 实例
let globalAudio: AudioManager | null = null;

/** 获取全局 AudioManager 单例 */
export function getAudioManager(): AudioManager {
  if (!globalAudio) globalAudio = new AudioManager();
  return globalAudio;
}

/** 重置全局单例（主要用于测试或销毁场景） */
export function resetAudioManager(): void {
  if (globalAudio) {
    globalAudio.getEngine().destroy();
    globalAudio = null;
  }
}
