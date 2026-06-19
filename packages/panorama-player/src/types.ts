export type CharacterId = "lin" | "qi" | "su" | "xia" | "cheng" | "ruan";
export type SpeakerId = CharacterId | "narrator" | "you" | "system";
export type RouteId = CharacterId | "team" | "solo" | null;
export type ViewMode = "flat" | "panorama";

export type MetricKey = "spark" | "trust" | "boundary";
export type GlobalKey = "career" | "integrity" | "stress";

export interface CharacterProfile {
  id: CharacterId;
  name: string;
  shortName: string;
  role: string;
  theme: string;
  color: string;
  accent: string;
}

export interface RelationshipStats {
  spark: number;
  trust: number;
  boundary: number;
}

export interface GlobalStats {
  career: number;
  integrity: number;
  stress: number;
}

export interface AudioSettings {
  masterVolume: number;
  voiceVolume: number;
  bgmVolume: number;
  muted: boolean;
}

export interface GameSettings {
  autoDrift: boolean;
  reducedMotion: boolean;
  uiScale: "compact" | "comfortable";
  gyroscope: boolean;
  audio: AudioSettings;
}

export interface GameState {
  currentNodeId: string;
  lineIndex: number;
  relationships: Record<CharacterId, RelationshipStats>;
  globals: GlobalStats;
  flags: string[];
  memories: string[];
  visitedNodes: string[];
  seenHotspots: string[];
  route: RouteId;
  settings: GameSettings;
  lastSavedAt: number;
}

export interface Effect {
  relationships?: Partial<Record<CharacterId, Partial<RelationshipStats>>>;
  globals?: Partial<GlobalStats>;
  flags?: string[];
  memories?: string[];
  route?: RouteId;
}

export interface Condition {
  flags?: string[];
  missingFlags?: string[];
  route?: RouteId;
  minRelationship?: Array<{
    character: CharacterId;
    metric: MetricKey;
    value: number;
  }>;
  minGlobal?: Array<{
    key: GlobalKey;
    value: number;
  }>;
  maxGlobal?: Array<{
    key: GlobalKey;
    value: number;
  }>;
}

export interface DialogueLine {
  speaker: SpeakerId;
  text: string;
  mood?: string;
  voiceSrc?: string;
  focusYaw?: number;
  focusPitch?: number;
}

export interface Hotspot {
  id: string;
  label: string;
  description: string;
  yaw: number;
  pitch: number;
  effect?: Effect;
  gazeActivate?: boolean;
  gazeDelay?: number;
}

export interface Choice {
  id: string;
  label: string;
  caption?: string;
  next: string;
  effect?: Effect;
  condition?: Condition;
  major?: boolean;
}

export interface PanoramaPalette {
  from: string;
  via: string;
  to: string;
}

export interface VideoConfig {
  loop?: boolean;
  startTime?: number;
  playbackRate?: number;
}

export interface TextKeyword {
  keywords: string[];
  next: string;
  response: string;
  effect?: Effect;
}

export interface StoryNode {
  id: string;
  chapter: string;
  title: string;
  location: string;
  panorama: string;
  panoramaType?: "image" | "video";
  videoConfig?: VideoConfig;
  palette: PanoramaPalette;
  synopsis: string;
  lines: DialogueLine[];
  hotspots: Hotspot[];
  choices: Choice[];
  allowTextInput?: boolean;
  textKeywords?: TextKeyword[];
  ending?: {
    title: string;
    subtitle: string;
    type: "romance" | "growth" | "team" | "regret";
  };
}

