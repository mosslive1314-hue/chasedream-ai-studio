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
