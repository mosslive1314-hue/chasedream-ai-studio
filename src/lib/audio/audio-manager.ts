// 音频管理器 — 封装 AudioEngine，提供高层 API
// 支持音量分类控制、状态序列化/反序列化、预加载

import { AudioEngine } from './audio-engine';

/** 音量类型 */
export type VolumeType = 'master' | 'bgm' | 'sfx' | 'voice';

/** 音量设置 */
export interface VolumeSettings {
  master: number;
  bgm: number;
  sfx: number;
  voice: number;
}

/** 可序列化的音频状态（用于存档/读档） */
export interface AudioSerializableState {
  currentBgm: string | null;
  volumes: VolumeSettings;
}

/**
 * AudioManager — 高层音频管理，封装 AudioEngine
 * 提供分类音量控制、BGM 队列、状态序列化
 */
export class AudioManager {
  private engine: AudioEngine = new AudioEngine();
  private bgmQueue: string[] = [];
  private currentBgm: string | null = null;
  private volumeSettings: VolumeSettings = {
    master: 1,
    bgm: 0.8,
    sfx: 1,
    voice: 1,
  };

  /** 播放 BGM */
  async playBgm(url: string, options?: { volume?: number; fadeTime?: number }): Promise<void> {
    const fadeTime = options?.fadeTime ?? 0.5;
    // 若已在播放同一首 BGM，则仅调整音量
    if (this.currentBgm === url) {
      const vol = options?.volume ?? this.volumeSettings.bgm;
      this.engine.setBgmVolume(vol, fadeTime);
      return;
    }
    const vol = options?.volume ?? this.volumeSettings.bgm;
    this.currentBgm = url;
    await this.engine.playBgm(url, vol, fadeTime);
  }

  /** 停止 BGM */
  stopBgm(fadeTime: number = 0.5): void {
    this.engine.stopBgm(fadeTime);
    this.currentBgm = null;
    this.bgmQueue = [];
  }

  /** 播放音效 */
  async playSfx(url: string, volume?: number): Promise<void> {
    const vol = volume ?? this.volumeSettings.sfx;
    await this.engine.playSfx(url, vol);
  }

  /** 播放语音（可中断当前语音） */
  async playVoice(url: string, volume?: number): Promise<void> {
    const vol = volume ?? this.volumeSettings.voice;
    await this.engine.playVoice(url, vol);
  }

  /** 停止所有音频 */
  stopAll(): void {
    this.engine.stopAllSfx();
    this.stopBgm(0.3);
  }

  /** 设置指定类型的音量 */
  setVolume(type: VolumeType, value: number): void {
    this.volumeSettings[type] = value;
    switch (type) {
      case 'master':
        this.engine.setMasterVolume(value);
        break;
      case 'bgm':
        this.engine.setBgmVolume(value, 0.2);
        break;
      case 'sfx':
      case 'voice':
        // SFX/Voice 音量在播放时应用，无需即时调整引擎
        break;
    }
  }

  /** 获取指定类型的音量 */
  getVolume(type: VolumeType): number {
    return this.volumeSettings[type];
  }

  /** 获取完整音频状态（用于存档序列化） */
  getState(): AudioSerializableState {
    return {
      currentBgm: this.currentBgm,
      volumes: { ...this.volumeSettings },
    };
  }

  /** 恢复音频状态（用于读档） */
  async setState(state: AudioSerializableState): Promise<void> {
    this.volumeSettings = { ...state.volumes };
    this.engine.setMasterVolume(this.volumeSettings.master);
    if (state.currentBgm) {
      await this.playBgm(state.currentBgm, { fadeTime: 0.5 });
    } else {
      this.stopBgm(0.3);
    }
  }

  /** 序列化为 JSON 字符串 */
  serialize(): string {
    return JSON.stringify(this.getState());
  }

  /** 反序列化并恢复状态 */
  async deserialize(json: string): Promise<void> {
    try {
      const state = JSON.parse(json) as AudioSerializableState;
      await this.setState(state);
    } catch {
      // 反序列化失败时静默忽略，保持当前状态
    }
  }

  /** 预加载多个音频文件 */
  async preload(urls: string[]): Promise<void> {
    await Promise.all(
      urls.map((url) =>
        this.engine.loadAudio(url).catch(() => {
          // 单个预加载失败不影响其他
        }),
      ),
    );
  }

  /** 获取底层引擎（供高级用途，如 suspend/resume） */
  getEngine(): AudioEngine {
    return this.engine;
  }
}
