// ChaseDream Runtime — 场景对象模型
// 借鉴 VoidNovelEngine 的场景对象系统，定义 6 类运行时场景对象

// ── 场景对象类型 ──────────────────────────────────────────────────────────

export type SceneObjectType =
  | 'background'
  | 'foreground'
  | 'subtitle'
  | 'letterboxing'
  | 'audio'
  | 'video';

// ── 场景对象基类 ──────────────────────────────────────────────────────────

export interface BaseSceneObject {
  id: string;
  type: SceneObjectType;
  visible: boolean;
  opacity: number; // 0-1
}

// ── 背景对象 ──────────────────────────────────────────────────────────────

export interface BackgroundObject extends BaseSceneObject {
  type: 'background';
  imageUrl: string;
  transitionFade?: number; // 淡入淡出时间(秒)
}

// ── 前景立绘对象 ──────────────────────────────────────────────────────────

export interface ForegroundObject extends BaseSceneObject {
  type: 'foreground';
  imageUrl: string;
  characterId?: string;
  positionX: number; // 0-100 百分比
  positionY: number; // 0-100 百分比
  scale: number; // 1 = 原始大小
  expression?: string; // 表情
}

// ── 字幕/对白对象 ──────────────────────────────────────────────────────────

export interface SubtitleObject extends BaseSceneObject {
  type: 'subtitle';
  speakerName: string;
  text: string;
  textColor?: string;
}

// ── 宽银幕遮幅对象 ──────────────────────────────────────────────────────────

export interface LetterboxingObject extends BaseSceneObject {
  type: 'letterboxing';
  topHeight: number; // 0-50 百分比
  bottomHeight: number;
}

// ── 音频对象 ──────────────────────────────────────────────────────────────

export interface AudioObject extends BaseSceneObject {
  type: 'audio';
  audioUrl: string;
  audioKind: 'bgm' | 'sfx' | 'voice';
  loop: boolean;
  volume: number; // 0-1
}

// ── 视频对象 ──────────────────────────────────────────────────────────────

export interface VideoObject extends BaseSceneObject {
  type: 'video';
  videoUrl: string;
  loop: boolean;
}

// ── 联合类型 ──────────────────────────────────────────────────────────────

export type SceneObject =
  | BackgroundObject
  | ForegroundObject
  | SubtitleObject
  | LetterboxingObject
  | AudioObject
  | VideoObject;
