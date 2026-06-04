// ChaseDream Creator Studio — Wardrobe / Costume Types
// 角色换装系统：管理角色在不同剧情场景中的造型变化

// ── 造型槽位定义 ──────────────────────────────────────────────────────────

export type WardrobeSlotCategory =
  | 'hair'
  | 'face'
  | 'top'
  | 'bottom'
  | 'shoes'
  | 'accessory'
  | 'special';

export interface WardrobeSlot {
  id: string;
  name: string;
  category: WardrobeSlotCategory;
  zOrder: number;
  /** 该槽位会遮挡哪些其他槽位（例如帽子遮挡某些发型） */
  occludes: string[];
  /** 该槽位必须保持的视觉锚点 ID 列表 */
  requiredAnchors: string[];
}

// ── 造型单品 ──────────────────────────────────────────────────────────────

export interface OutfitPiece {
  id: string;
  name: string;
  slotId: string;
  characterId: string;
  /** 风格标签："正式" / "休闲" / "战斗" / "回忆" 等 */
  tags: string[];
  /** AI 生图提示词 */
  visualPrompt: string;
  /** 已生成的资产图 */
  imageUrl?: string;
  /** 缩略图 */
  thumbnailUrl?: string;
  /** 兼容的其他 OutfitPiece id */
  compatibleWith: string[];
  /** 情绪变体 → imageUrl（复用现有情绪状态系统） */
  emotionVariants: Record<string, string>;
  /** 创建时间 */
  createdAt?: string;
}

// ── 造型组合 ──────────────────────────────────────────────────────────────

export interface CharacterOutfit {
  id: string;
  name: string;
  characterId: string;
  /** slotId → OutfitPiece.id */
  pieces: Record<string, string>;
  /** 风格标签 */
  styleTags: string[];
  /** 合成预览图 */
  previewUrl?: string;
  /** 适用的场景/节点 id */
  sceneApplicability: string[];
  /** 是否为默认造型 */
  isDefault?: boolean;
  /** 备注/描述 */
  description?: string;
  createdAt?: string;
}

// ── 视觉锚点 ──────────────────────────────────────────────────────────────

export type VisualAnchorType = 'facial' | 'body' | 'signature' | 'color';

export interface VisualAnchor {
  id: string;
  /** 锚点描述："左眼角的泪痣" / "银色短发" / "修长身形" */
  description: string;
  anchorType: VisualAnchorType;
  /** 是否必须在所有造型中保持 */
  mustMaintain: boolean;
  /** 视觉参考图 URL（可选） */
  referenceImageUrl?: string;
}

// ── 角色造型衣柜 ──────────────────────────────────────────────────────────

export interface CharacterWardrobe {
  characterId: string;
  /** 可用槽位定义 */
  slots: WardrobeSlot[];
  /** 所有单品 */
  pieces: OutfitPiece[];
  /** 所有造型组合 */
  outfits: CharacterOutfit[];
  /** 默认造型 ID */
  defaultOutfitId: string;
  /** 跨造型不变的角色识别特征 */
  visualAnchors: VisualAnchor[];
}
