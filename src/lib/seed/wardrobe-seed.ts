// ChaseDream Creator Studio — Wardrobe Seed Data
// 角色换装系统的示例种子数据

import type {
  WardrobeSlot,
  OutfitPiece,
  CharacterWardrobe,
  VisualAnchor,
  CharacterOutfit,
} from '@/lib/types/wardrobe';

// ── 标准造型槽位 ──────────────────────────────────────────────────────────

export const DEFAULT_WARDROBE_SLOTS: WardrobeSlot[] = [
  {
    id: 'slot-hair',
    name: '发型',
    category: 'hair',
    zOrder: 10,
    occludes: ['slot-face'],
    requiredAnchors: ['anchor-hair-color'],
  },
  {
    id: 'slot-face',
    name: '面部',
    category: 'face',
    zOrder: 20,
    occludes: [],
    requiredAnchors: ['anchor-face-shape'],
  },
  {
    id: 'slot-top',
    name: '上装',
    category: 'top',
    zOrder: 30,
    occludes: [],
    requiredAnchors: ['anchor-body-proportion'],
  },
  {
    id: 'slot-bottom',
    name: '下装',
    category: 'bottom',
    zOrder: 35,
    occludes: [],
    requiredAnchors: ['anchor-body-proportion'],
  },
  {
    id: 'slot-shoes',
    name: '鞋子',
    category: 'shoes',
    zOrder: 40,
    occludes: [],
    requiredAnchors: [],
  },
  {
    id: 'slot-accessory',
    name: '配饰',
    category: 'accessory',
    zOrder: 50,
    occludes: [],
    requiredAnchors: ['anchor-signature-item'],
  },
];

// ── Ella 角色造型数据 ────────────────────────────────────────────────────

const ELLA_VISUAL_ANCHORS: VisualAnchor[] = [
  {
    id: 'anchor-hair-color',
    description: '银灰色短发，微卷',
    anchorType: 'color',
    mustMaintain: true,
  },
  {
    id: 'anchor-face-shape',
    description: '左眼角的泪痣，尖下巴',
    anchorType: 'facial',
    mustMaintain: true,
  },
  {
    id: 'anchor-body-proportion',
    description: '修长身形，约 170cm',
    anchorType: 'body',
    mustMaintain: true,
  },
  {
    id: 'anchor-signature-item',
    description: '左耳的银色耳钉',
    anchorType: 'signature',
    mustMaintain: true,
  },
];

const ELLA_PIECES: OutfitPiece[] = [
  {
    id: 'ella-hair-default',
    name: '银灰短发（默认）',
    slotId: 'slot-hair',
    characterId: 'char-ella',
    tags: ['通用'],
    visualPrompt: 'silver-grey short wavy hair, slightly messy, anime style',
    compatibleWith: ['ella-face-default', 'ella-top-detective', 'ella-top-formal', 'ella-bottom-detective', 'ella-bottom-formal'],
    emotionVariants: {},
  },
  {
    id: 'ella-face-default',
    name: '标准面容',
    slotId: 'slot-face',
    characterId: 'char-ella',
    tags: ['通用'],
    visualPrompt: 'sharp features, grey-blue eyes, small mole under left eye, determined expression',
    compatibleWith: [],
    emotionVariants: {
      angry: 'angry expression, furrowed brows',
      hurt: 'pained expression, tears forming',
      silent: 'neutral, unreadable expression',
    },
  },
  {
    id: 'ella-top-detective',
    name: '侦探风衣',
    slotId: 'slot-top',
    characterId: 'char-ella',
    tags: ['正式', '侦探'],
    visualPrompt: 'dark beige trench coat, rolled-up sleeves, detective attire',
    compatibleWith: ['ella-bottom-detective'],
    emotionVariants: {},
  },
  {
    id: 'ella-bottom-detective',
    name: '侦探长裤',
    slotId: 'slot-bottom',
    characterId: 'char-ella',
    tags: ['正式', '侦探'],
    visualPrompt: 'dark navy tailored trousers, slim fit',
    compatibleWith: ['ella-top-detective'],
    emotionVariants: {},
  },
  {
    id: 'ella-shoes-boots',
    name: '侦探短靴',
    slotId: 'slot-shoes',
    characterId: 'char-ella',
    tags: ['正式', '侦探'],
    visualPrompt: 'black leather ankle boots, low heel',
    compatibleWith: [],
    emotionVariants: {},
  },
  {
    id: 'ella-accessory-badge',
    name: '侦探徽章',
    slotId: 'slot-accessory',
    characterId: 'char-ella',
    tags: ['侦探'],
    visualPrompt: 'small silver detective badge pinned to coat lapel',
    compatibleWith: ['ella-top-detective'],
    emotionVariants: {},
  },
  {
    id: 'ella-top-formal',
    name: '晚宴礼服',
    slotId: 'slot-top',
    characterId: 'char-ella',
    tags: ['正式', '晚宴'],
    visualPrompt: 'elegant black evening gown, off-shoulder, silk fabric',
    compatibleWith: ['ella-bottom-formal'],
    emotionVariants: {},
  },
  {
    id: 'ella-bottom-formal',
    name: '晚宴裙装（连体）',
    slotId: 'slot-bottom',
    characterId: 'char-ella',
    tags: ['正式', '晚宴'],
    visualPrompt: 'continuation of black evening gown, flowing hem',
    compatibleWith: ['ella-top-formal'],
    emotionVariants: {},
  },
  {
    id: 'ella-shoes-heels',
    name: '晚宴高跟',
    slotId: 'slot-shoes',
    characterId: 'char-ella',
    tags: ['正式', '晚宴'],
    visualPrompt: 'black stiletto heels, elegant',
    compatibleWith: [],
    emotionVariants: {},
  },
  {
    id: 'ella-accessory-necklace',
    name: '银链项链',
    slotId: 'slot-accessory',
    characterId: 'char-ella',
    tags: ['晚宴'],
    visualPrompt: 'delicate silver chain necklace with small pendant',
    compatibleWith: ['ella-top-formal'],
    emotionVariants: {},
  },
];

const ELLA_OUTFITS: CharacterOutfit[] = [
  {
    id: 'ella-outfit-detective',
    name: '侦探日常',
    characterId: 'char-ella',
    pieces: {
      'slot-hair': 'ella-hair-default',
      'slot-face': 'ella-face-default',
      'slot-top': 'ella-top-detective',
      'slot-bottom': 'ella-bottom-detective',
      'slot-shoes': 'ella-shoes-boots',
      'slot-accessory': 'ella-accessory-badge',
    },
    styleTags: ['侦探', '日常', '正式'],
    sceneApplicability: ['node-001', 'node-002', 'node-003', 'node-004', 'node-005'],
    isDefault: true,
    description: 'Ella 的标准侦探装扮，适合日常调查和案件现场',
  },
  {
    id: 'ella-outfit-formal',
    name: '晚宴礼服',
    characterId: 'char-ella',
    pieces: {
      'slot-hair': 'ella-hair-default',
      'slot-face': 'ella-face-default',
      'slot-top': 'ella-top-formal',
      'slot-bottom': 'ella-bottom-formal',
      'slot-shoes': 'ella-shoes-heels',
      'slot-accessory': 'ella-accessory-necklace',
    },
    styleTags: ['晚宴', '正式', '优雅'],
    sceneApplicability: ['node-007'],
    description: '潜入上流社会晚宴时的华丽装扮',
  },
];

// ── Mole 角色造型数据 ────────────────────────────────────────────────────

const MOLE_VISUAL_ANCHORS: VisualAnchor[] = [
  {
    id: 'anchor-mole-hair',
    description: '深棕色背头，略显凌乱',
    anchorType: 'color',
    mustMaintain: true,
  },
  {
    id: 'anchor-mole-build',
    description: '中等身材，略显瘦削',
    anchorType: 'body',
    mustMaintain: true,
  },
  {
    id: 'anchor-mole-scar',
    description: '右眉上方的旧伤疤',
    anchorType: 'facial',
    mustMaintain: true,
  },
];

const MOLE_PIECES: OutfitPiece[] = [
  {
    id: 'mole-hair-default',
    name: '深棕背头（默认）',
    slotId: 'slot-hair',
    characterId: 'char-mole',
    tags: ['通用'],
    visualPrompt: 'dark brown slicked-back hair, slightly messy, anime style',
    compatibleWith: [],
    emotionVariants: {},
  },
  {
    id: 'mole-face-default',
    name: '标准面容',
    slotId: 'slot-face',
    characterId: 'char-mole',
    tags: ['通用'],
    visualPrompt: 'thin face, sharp eyes, old scar above right eyebrow, cautious expression',
    compatibleWith: [],
    emotionVariants: {
      angry: 'clenched jaw, intense stare',
      hurt: 'wincing, holding side',
      silent: 'averted gaze, guarded look',
    },
  },
  {
    id: 'mole-top-casual',
    name: '旧皮夹克',
    slotId: 'slot-top',
    characterId: 'char-mole',
    tags: ['休闲', '街头'],
    visualPrompt: 'worn brown leather jacket, dark t-shirt underneath',
    compatibleWith: ['mole-bottom-casual'],
    emotionVariants: {},
  },
  {
    id: 'mole-bottom-casual',
    name: '牛仔裤',
    slotId: 'slot-bottom',
    characterId: 'char-mole',
    tags: ['休闲', '街头'],
    visualPrompt: 'faded blue jeans, slightly torn at knees',
    compatibleWith: ['mole-top-casual'],
    emotionVariants: {},
  },
  {
    id: 'mole-shoes-sneakers',
    name: '旧球鞋',
    slotId: 'slot-shoes',
    characterId: 'char-mole',
    tags: ['休闲'],
    visualPrompt: 'worn grey sneakers',
    compatibleWith: [],
    emotionVariants: {},
  },
];

const MOLE_OUTFITS: CharacterOutfit[] = [
  {
    id: 'mole-outfit-casual',
    name: '街头线人',
    characterId: 'char-mole',
    pieces: {
      'slot-hair': 'mole-hair-default',
      'slot-face': 'mole-face-default',
      'slot-top': 'mole-top-casual',
      'slot-bottom': 'mole-bottom-casual',
      'slot-shoes': 'mole-shoes-sneakers',
    },
    styleTags: ['休闲', '街头', '低调'],
    sceneApplicability: ['node-002', 'node-004', 'node-006'],
    isDefault: true,
    description: 'Mole 的标准街头装扮，不引人注目',
  },
];

// ── 角色衣柜汇总 ──────────────────────────────────────────────────────────

export const CHARACTER_WARDROBES: CharacterWardrobe[] = [
  {
    characterId: 'char-ella',
    slots: DEFAULT_WARDROBE_SLOTS,
    pieces: ELLA_PIECES,
    outfits: ELLA_OUTFITS,
    defaultOutfitId: 'ella-outfit-detective',
    visualAnchors: ELLA_VISUAL_ANCHORS,
  },
  {
    characterId: 'char-mole',
    slots: DEFAULT_WARDROBE_SLOTS,
    pieces: MOLE_PIECES,
    outfits: MOLE_OUTFITS,
    defaultOutfitId: 'mole-outfit-casual',
    visualAnchors: MOLE_VISUAL_ANCHORS,
  },
];
