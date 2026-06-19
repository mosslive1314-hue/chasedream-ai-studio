// ChaseDream Runtime — 场景上下文管理器
// 纯逻辑类，不依赖 React，可在任何环境使用

import type {
  SceneObject,
  SceneObjectType,
  BackgroundObject,
  ForegroundObject,
  SubtitleObject,
  LetterboxingObject,
  AudioObject,
} from './scene-objects';
import { getAudioManager } from '@/lib/audio';

// ── 运行时快照 ────────────────────────────────────────────────────────────

export interface RuntimeSnapshot {
  currentNodeId: string;
  variables: Record<string, number | string | boolean>;
  sceneObjects: SceneObject[];
  history: string[]; // 已访问节点 ID 列表
  timestamp: number;
}

// ── 场景上下文 ────────────────────────────────────────────────────────────

export class SceneContext {
  private objects: Map<string, SceneObject> = new Map();
  private history: string[] = [];
  private variables: Record<string, number | string | boolean> = {};
  private currentNodeId: string = '';
  private snapshotStack: RuntimeSnapshot[] = [];
  private readonly maxSnapshots = 64;

  // ── 对象管理 ────────────────────────────────────────────────────────────

  addObject(obj: SceneObject): void {
    this.objects.set(obj.id, obj);
  }

  removeObject(id: string): void {
    this.objects.delete(id);
  }

  getObject(id: string): SceneObject | undefined {
    return this.objects.get(id);
  }

  getObjectsByType(type: SceneObjectType): SceneObject[] {
    return this.getAllObjects().filter((o) => o.type === type);
  }

  getAllObjects(): SceneObject[] {
    return Array.from(this.objects.values());
  }

  clearObjects(): void {
    this.objects.clear();
  }

  private removeObjectsByType(type: SceneObjectType): void {
    for (const obj of this.getObjectsByType(type)) this.objects.delete(obj.id);
  }

  // ── 便捷方法 ────────────────────────────────────────────────────────────

  setBackground(imageUrl: string, fadeTime: number = 0.5): void {
    this.removeObjectsByType('background');
    this.addObject({
      id: '__background__', type: 'background', visible: true, opacity: 1,
      imageUrl, transitionFade: fadeTime,
    } as BackgroundObject);
  }

  addForeground(opts: {
    id: string; imageUrl: string; characterId?: string;
    x: number; y: number; scale?: number; expression?: string;
  }): void {
    this.addObject({
      id: opts.id, type: 'foreground', visible: true, opacity: 1,
      imageUrl: opts.imageUrl, characterId: opts.characterId,
      positionX: opts.x, positionY: opts.y,
      scale: opts.scale ?? 1, expression: opts.expression,
    } as ForegroundObject);
  }

  removeForeground(id: string): void {
    this.objects.delete(id);
  }

  setSubtitle(speaker: string, text: string, textColor?: string): void {
    this.removeObjectsByType('subtitle');
    this.addObject({
      id: '__subtitle__', type: 'subtitle', visible: true, opacity: 1,
      speakerName: speaker, text, textColor,
    } as SubtitleObject);
  }

  clearSubtitle(): void {
    this.removeObjectsByType('subtitle');
  }

  setLetterboxing(top: number, bottom: number): void {
    this.removeObjectsByType('letterboxing');
    this.addObject({
      id: '__letterboxing__', type: 'letterboxing', visible: true, opacity: 1,
      topHeight: top, bottomHeight: bottom,
    } as LetterboxingObject);
  }

  removeLetterboxing(): void {
    this.removeObjectsByType('letterboxing');
  }

  playBgm(url: string, volume: number = 0.8, fadeTime: number = 0.5): void {
    this.stopBgm(fadeTime);
    this.addObject({
      id: '__bgm__', type: 'audio', visible: true, opacity: 1,
      audioUrl: url, audioKind: 'bgm', loop: true, volume,
    } as AudioObject);
    // 桥接 AudioEngine 实际播放 BGM（SSR 安全 + 失败不阻断场景逻辑）
    if (typeof window !== 'undefined') {
      try {
        void getAudioManager().playBgm(url, { volume, fadeTime }).catch(() => {
          // 音频播放失败不阻断场景逻辑
        });
      } catch {
        // 音频管理器初始化失败时静默忽略
      }
    }
  }

  stopBgm(fadeTime: number = 0.5): void {
    for (const obj of this.getObjectsByType('audio')) {
      if (obj.audioKind === 'bgm') this.objects.delete(obj.id);
    }
    // 桥接 AudioEngine 实际停止 BGM（SSR 安全 + 失败不阻断场景逻辑）
    if (typeof window !== 'undefined') {
      try {
        getAudioManager().stopBgm(fadeTime);
      } catch {
        // 音频停止失败不阻断场景逻辑
      }
    }
  }

  playSfx(url: string): void {
    const volume = 1;
    this.addObject({
      id: `__sfx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}__`,
      type: 'audio', visible: true, opacity: 1,
      audioUrl: url, audioKind: 'sfx', loop: false, volume,
    } as AudioObject);
    // 桥接 AudioEngine 实际播放音效（SSR 安全 + 失败不阻断场景逻辑）
    if (typeof window !== 'undefined') {
      try {
        void getAudioManager().playSfx(url, volume).catch(() => {
          // 音频播放失败不阻断场景逻辑
        });
      } catch {
        // 音频管理器初始化失败时静默忽略
      }
    }
  }

  // ── 变量管理 ────────────────────────────────────────────────────────────

  setVariable(id: string, value: number | string | boolean): void {
    this.variables[id] = value;
  }

  getVariable(id: string): number | string | boolean | undefined {
    return this.variables[id];
  }

  // 解析效果字符串并更新变量
  // 支持: 变量名+值 / 变量名-值 / 变量名=值（中文变量名如 信任+5，英文如 trust-10）
  // 兼容旧格式: +变量名 值 / -变量名 值；多个效果用 ; 或 , 分隔
  applyEffect(effect: string): void {
    if (!effect) return;
    for (const part of effect.split(/[;,]/).map((s) => s.trim()).filter(Boolean)) {
      if (part === '+0' || part === '-0' || part === '0') continue;

      // 格式1: 变量名+值 / 变量名-值 / 变量名=值
      const m1 = part.match(/([\u4e00-\u9fa5\w]+)\s*([+-=])\s*(-?\d+(?:\.\d+)?)/);
      // 格式2: +变量名 值 / -变量名 值（兼容生成器旧格式）
      const m2 = !m1 ? part.match(/^([+-])\s*([\u4e00-\u9fa5\w]+)\s+(-?\d+(?:\.\d+)?)/) : null;
      const m = m1 ?? m2;
      if (!m) continue;

      const varName = m1 ? m[1] : m[2];
      const op = m1 ? m[2] : m[1];
      const value = parseFloat(m[3]);
      const current = this.variables[varName];

      if (op === '=') {
        this.variables[varName] = value;
      } else if (op === '+') {
        this.variables[varName] = (typeof current === 'number' ? current : 0) + value;
      } else if (op === '-') {
        this.variables[varName] = (typeof current === 'number' ? current : 0) - value;
      }
    }
  }

  getAllVariables(): Record<string, number | string | boolean> {
    return { ...this.variables };
  }

  // ── 历史与节点 ──────────────────────────────────────────────────────────

  visitNode(id: string): void {
    this.currentNodeId = id;
    this.history.push(id);
  }

  getCurrentNodeId(): string {
    return this.currentNodeId;
  }

  getHistory(): string[] {
    return [...this.history];
  }

  // ── 快照系统（借鉴 VoidNovelEngine 的 64 层回退）─────────────────────────

  captureSnapshot(): RuntimeSnapshot {
    return {
      currentNodeId: this.currentNodeId,
      variables: { ...this.variables },
      sceneObjects: this.getAllObjects().map((o) => ({ ...o })),
      history: [...this.history],
      timestamp: Date.now(),
    };
  }

  restoreSnapshot(snapshot: RuntimeSnapshot): void {
    this.currentNodeId = snapshot.currentNodeId;
    this.variables = { ...snapshot.variables };
    this.objects.clear();
    for (const obj of snapshot.sceneObjects) this.objects.set(obj.id, { ...obj });
    this.history = [...snapshot.history];
  }

  pushSnapshot(): void {
    this.snapshotStack.push(this.captureSnapshot());
    while (this.snapshotStack.length > this.maxSnapshots) this.snapshotStack.shift();
  }

  popSnapshot(): RuntimeSnapshot | null {
    if (this.snapshotStack.length === 0) return null;
    const snapshot = this.snapshotStack.pop()!;
    this.restoreSnapshot(snapshot);
    return snapshot;
  }

  canRollback(): boolean {
    return this.snapshotStack.length > 0;
  }

  getSnapshotCount(): number {
    return this.snapshotStack.length;
  }
}
