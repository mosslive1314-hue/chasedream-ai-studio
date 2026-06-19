// Web Audio API 引擎封装 — 底层音频播放引擎
// SSR 安全：所有 AudioContext 访问都检查 typeof window

/** 活跃音效条目 */
interface ActiveSfxEntry {
  source: AudioBufferSourceNode;
  gain: GainNode;
}

/** 音频引擎状态 */
export interface AudioEngineState {
  bgmUrl: string | null;
  bgmVolume: number;
  sfxCount: number;
  masterVolume: number;
}

/**
 * AudioEngine — 封装 Web Audio API，提供 BGM/音效/语音播放能力
 * 懒加载 AudioContext，仅在浏览器端初始化
 */
export class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private bgmSource: AudioBufferSourceNode | null = null;
  private bgmGain: GainNode | null = null;
  private activeSfx: Map<string, ActiveSfxEntry> = new Map();
  private audioCache: Map<string, AudioBuffer> = new Map();
  private currentBgmUrl: string | null = null;
  private currentBgmVolume: number = 0.8;
  private masterVolumeValue: number = 1;

  /** 初始化 AudioContext（浏览器端懒加载） */
  init(): void {
    if (typeof window === 'undefined') return;
    if (this.ctx) return;
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    this.ctx = new Ctor();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this.masterVolumeValue;
    this.masterGain.connect(this.ctx.destination);
  }

  /** 加载音频文件并缓存 */
  async loadAudio(url: string): Promise<AudioBuffer> {
    this.init();
    const cached = this.audioCache.get(url);
    if (cached) return cached;
    if (!this.ctx) throw new Error('AudioContext 不可用');
    const res = await fetch(url);
    if (!res.ok) throw new Error(`音频加载失败: ${url} (${res.status})`);
    const arrayBuffer = await res.arrayBuffer();
    const buffer = await this.ctx.decodeAudioData(arrayBuffer);
    this.audioCache.set(url, buffer);
    return buffer;
  }

  /** 播放 BGM（循环、淡入）；先停止当前 BGM（淡出） */
  async playBgm(url: string, volume: number, fadeTime: number): Promise<void> {
    this.init();
    if (!this.ctx || !this.masterGain) return;
    // 先停止当前 BGM
    if (this.bgmSource) this.stopBgm(fadeTime);
    try {
      const buffer = await this.loadAudio(url);
      if (!this.ctx || !this.masterGain) return;
      const source = this.ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      const gain = this.ctx.createGain();
      // 淡入：从 0 线性渐变到目标音量
      gain.gain.setValueAtTime(0, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(volume, this.ctx.currentTime + fadeTime);
      source.connect(gain);
      gain.connect(this.masterGain);
      source.start();
      this.bgmSource = source;
      this.bgmGain = gain;
      this.currentBgmUrl = url;
      this.currentBgmVolume = volume;
    } catch {
      // 加载或播放失败时静默忽略，避免阻塞主流程
    }
  }

  /** 停止 BGM（淡出后断开） */
  stopBgm(fadeTime: number): void {
    if (!this.ctx || !this.bgmSource || !this.bgmGain) return;
    const { currentTime } = this.ctx;
    const gain = this.bgmGain;
    const source = this.bgmSource;
    // 淡出到 0 后停止并断开
    gain.gain.cancelScheduledValues(currentTime);
    gain.gain.setValueAtTime(gain.gain.value, currentTime);
    gain.gain.linearRampToValueAtTime(0, currentTime + fadeTime);
    const stopTime = (fadeTime + 0.05) * 1000;
    window.setTimeout(() => {
      try {
        source.stop();
      } catch {
        // 已停止则忽略
      }
      try {
        source.disconnect();
        gain.disconnect();
      } catch {
        // 忽略断开错误
      }
    }, stopTime);
    this.bgmSource = null;
    this.bgmGain = null;
    this.currentBgmUrl = null;
  }

  /** 播放音效（一次性，不循环），播放结束自动清理 */
  async playSfx(url: string, volume: number): Promise<void> {
    this.init();
    if (!this.ctx || !this.masterGain) return;
    try {
      const buffer = await this.loadAudio(url);
      if (!this.ctx || !this.masterGain) return;
      const source = this.ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = false;
      const gain = this.ctx.createGain();
      gain.gain.value = volume;
      source.connect(gain);
      gain.connect(this.masterGain);
      const id = `sfx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      this.activeSfx.set(id, { source, gain });
      source.onended = () => {
        try {
          source.disconnect();
          gain.disconnect();
        } catch {
          // 忽略
        }
        this.activeSfx.delete(id);
      };
      source.start();
    } catch {
      // 静默忽略
    }
  }

  /** 播放语音（同 SFX 但可中断当前语音） */
  async playVoice(url: string, volume: number): Promise<void> {
    // 中断已有语音：停止所有标记为 voice 的音效
    this.stopAllSfx();
    await this.playSfx(url, volume);
  }

  /** 停止所有音效 */
  stopAllSfx(): void {
    for (const [, entry] of this.activeSfx) {
      try {
        entry.source.stop();
        entry.source.disconnect();
        entry.gain.disconnect();
      } catch {
        // 忽略
      }
    }
    this.activeSfx.clear();
  }

  /** 设置主音量 */
  setMasterVolume(vol: number): void {
    this.masterVolumeValue = vol;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(vol, this.ctx.currentTime);
    }
  }

  /** 设置 BGM 音量（支持淡变） */
  setBgmVolume(vol: number, fadeTime: number = 0): void {
    this.currentBgmVolume = vol;
    if (!this.bgmGain || !this.ctx) return;
    if (fadeTime <= 0) {
      this.bgmGain.gain.setValueAtTime(vol, this.ctx.currentTime);
    } else {
      this.bgmGain.gain.linearRampToValueAtTime(vol, this.ctx.currentTime + fadeTime);
    }
  }

  /** 获取当前音频状态 */
  getAudioState(): AudioEngineState {
    return {
      bgmUrl: this.currentBgmUrl,
      bgmVolume: this.currentBgmVolume,
      sfxCount: this.activeSfx.size,
      masterVolume: this.masterVolumeValue,
    };
  }

  /** 挂起 AudioContext（页面不可见时） */
  suspend(): void {
    if (this.ctx && this.ctx.state === 'running') {
      void this.ctx.suspend();
    }
  }

  /** 恢复 AudioContext */
  resume(): void {
    if (this.ctx && this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
  }

  /** 清理所有资源 */
  destroy(): void {
    this.stopAllSfx();
    this.stopBgm(0);
    this.audioCache.clear();
    if (this.ctx) {
      void this.ctx.close();
      this.ctx = null;
      this.masterGain = null;
    }
  }
}
