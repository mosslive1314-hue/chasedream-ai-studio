// ChaseDream Creator Studio — Game Types

// ── 角色数据（统一）────────────────────────────────────────────────────────

export interface GameCharacter {
  id: string;
  name: string;
  role: string;
  description: string;
  appearNodes: string[];
  color: string;
  emoji: string;
  emotionStates: { label: string; done: boolean }[];
  visualPrompt: string;
}

// ── 场景数据（统一）────────────────────────────────────────────────────────

export interface GameScene {
  id: string;
  name: string;
  location: string;
  lighting: string;
  atmosphere: string;
  refNodes: string[];
  hasImage: boolean;
  imageUrl?: string;
  visualPrompt: string;
}

// ── 道具数据（统一）────────────────────────────────────────────────────────

export interface GameProp {
  id: string;
  name: string;
  type: 'key_item' | 'tool' | 'weapon' | 'consumable';
  description: string;
  gameplayEffect: string;
  refNodes: string[];
  hasImage: boolean;
}

// ── 变量系统（统一）────────────────────────────────────────────────────────

export interface GameVariable {
  id: string;
  name: string;
  label: string;
  initialValue: number;
  description: string;
  modifiedBy: string[];  // nodeIds
  readBy: string[];      // nodeIds
}

// ── 可玩故事图（统一）─────────────────────────────────────────────────────

export interface PlayableNode {
  id: string;
  char: string;
  text: string;
  backgroundImage?: string;
  choices?: { label: string; next: string; effect: string }[];
  isEnding?: boolean;
  endingType?: 'good' | 'bad';
}

// ── 实体关系图谱（P11-⑳）────────────────────────────────────────────────────

export type EntityRelationType = 'ally' | 'enemy' | 'family' | 'mentor' | 'lover' | 'stranger' | 'rival';

export interface EntityRelation {
  sourceId: string;       // character ID
  targetId: string;       // character ID
  relationType: EntityRelationType;
  strength: number;       // 0-100
  description: string;
  changesAtNodes?: string[];  // nodes where relationship changes
  /** 关联的动态关系计量表 ID */
  linkedMeterId?: string;
  /** 运行时当前强度（从 EntityRelation.strength 初始化，游玩过程中动态变化） */
  runtimeStrength?: number;
}

export interface CharacterSceneAppearance {
  characterId: string;
  sceneId: string;
  role: 'main' | 'supporting' | 'background';
  nodeIds: string[];
}
