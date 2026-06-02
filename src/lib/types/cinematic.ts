// ChaseDream Creator Studio — Cinematic Types

// ── 电影化演出指导数据（P8-12）─────────────────────────────────────────────

export type CameraShotType = 'wide' | 'medium' | 'close_up' | 'tracking' | 'push_in' | 'pull_out' | 'handheld' | 'static';
export type CameraMovement = 'none' | 'pan_left' | 'pan_right' | 'tilt_up' | 'tilt_down' | 'dolly_in' | 'dolly_out' | 'crane_up' | 'crane_down' | 'orbit' | 'static' | 'push_in' | 'pull_out' | 'tracking';
export type TransitionType = 'cut' | 'fade' | 'dissolve' | 'wipe' | 'flash' | 'slow_motion';
export type EmotionIntensity = 'calm' | 'neutral' | 'tense' | 'intense' | 'climax';

export interface CameraDirection {
  shotType: CameraShotType;
  shotLabel: string;
  movement: CameraMovement;
  movementLabel: string;
  duration: number;        // seconds
  focusTarget?: string;    // what the camera focuses on
}

export interface PerformanceDirection {
  characterId: string;
  characterName: string;
  expression: string;       // e.g., "冷静", "愤怒", "恐惧"
  action: string;           // e.g., "缓慢转身", "握紧拳头"
  posture: string;          // e.g., "站姿笔直", "蜷缩"
  emotionIntensity: EmotionIntensity;
  emotionLabel: string;
}

export interface AudioDesign {
  bgmTrack: string;         // BGM description
  bgmMood: string;          // mood of the music
  ambientSound: string;     // environment sounds
  sfx?: string[];           // sound effects list
  voiceDirection?: string;  // voice acting direction
}

export interface CinematicDirection {
  nodeId: string;
  camera: CameraDirection;
  performances: PerformanceDirection[];
  audio: AudioDesign;
  transition: TransitionType;
  transitionLabel: string;
  pacing: string;           // e.g., "缓慢推进", "快速切换", "停顿3秒后转场"
  staging?: string;         // character positioning notes
}

// ── 引擎导出配置（P8-13）─────────────────────────────────────────────

export interface EngineExportConfig {
  id: string;
  name: string;
  icon: string;
  description: string;
  format: string;
  status: 'stable' | 'beta' | 'alpha';
  features: string[];
  estimatedSize: string;
  fieldMappings: { sourceField: string; targetField: string; mapped: boolean }[];
  customOptions: { key: string; label: string; type: 'boolean' | 'select'; defaultValue: boolean | string; options?: string[] }[];
}
