// Shared mock data for ChaseDream Creator Studio

export type ProjectStatus = 'published' | 'in_progress' | 'idle' | 'draft';

export interface Project {
  id: string;
  title: string;
  genre: string;
  cover: string;
  status: ProjectStatus;
  healthScore: number;
  healthLabel: string;
  healthType: 'success' | 'warning' | 'error';
  progress: number; // 0-100
  stage1: number; // structure extraction %
  stage2: number; // node graph %
  stage3: number; // assets %
  chapters: number;
  nodes: number;
  branches: number;
  endings: number;
  lastEdited: string;
  errors?: number;
}

export const PROJECTS: Project[] = [
  {
    id: 'ghost-protocol',
    title: '幽灵协议',
    genre: 'Cyberpunk · 间谍惊悚',
    cover: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80',
    status: 'in_progress',
    healthScore: 100,
    healthLabel: 'HEALTH: 100%',
    healthType: 'success',
    progress: 74,
    stage1: 100,
    stage2: 100,
    stage3: 60,
    chapters: 1,
    nodes: 11,
    branches: 2,
    endings: 2,
    lastEdited: '10m ago',
  },
  {
    id: 'cabinet-absurdity',
    title: '荒诞内阁',
    genre: 'Mystery · 心理悬疑',
    cover: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=800&q=80',
    status: 'idle',
    healthScore: 62,
    healthLabel: 'WARN: 3 ERR',
    healthType: 'error',
    progress: 46,
    stage1: 100,
    stage2: 40,
    stage3: 0,
    chapters: 1,
    nodes: 7,
    branches: 4,
    endings: 0,
    lastEdited: 'Yesterday',
    errors: 3,
  },
  {
    id: 'fusion-frontier',
    title: '聚变边疆',
    genre: 'Sci-Fi · 硬科幻',
    cover: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=800&q=80',
    status: 'draft',
    healthScore: 20,
    healthLabel: 'DRAFT',
    healthType: 'warning',
    progress: 20,
    stage1: 100,
    stage2: 0,
    stage3: 0,
    chapters: 1,
    nodes: 5,
    branches: 0,
    endings: 0,
    lastEdited: '3d ago',
  },
];

// AI Factory task steps
export interface FactoryTask {
  id: string;
  label: string;
  sublabel?: string;
  status: 'done' | 'running' | 'pending' | 'failed';
  result?: string;
}

export const FACTORY_TASKS: FactoryTask[] = [
  { id: 'outline', label: '提取故事大纲', status: 'done', result: '1章·8场·主线确认' },
  { id: 'characters', label: '提取角色设定', status: 'done', result: '艾拉·线人·反派主管' },
  { id: 'scenes', label: '提取场景设定', status: 'done', result: '霓虹街道·地下酒吧等6处' },
  { id: 'props', label: '提取道具设定', status: 'done', result: '追踪芯片·变声器等9件' },
  { id: 'nodes', label: '生成互动节点', status: 'running', result: undefined },
  { id: 'choices', label: '生成选择项与变量', status: 'pending' },
  { id: 'endings', label: '生成结局', status: 'pending' },
  { id: 'logic', label: '逻辑检查', status: 'pending' },
  { id: 'assets_req', label: '生成素材需求', status: 'pending' },
  { id: 'publish_check', label: '发布前检查', status: 'pending' },
];

// Node graph data
export type NodeType = 'start' | 'scene' | 'choice' | 'condition' | 'qte' | 'ending_good' | 'ending_bad';

export interface StoryNode {
  id: string;
  label: string;
  type: NodeType;
  x: number;
  y: number;
  hasError?: boolean;
  errorMsg?: string;
}

export interface NodeEdge {
  from: string;
  to: string;
  label?: string;
}

export const STORY_NODES: StoryNode[] = [
  { id: 'N01', label: '序章·霓虹夜幕', type: 'start', x: 300, y: 30 },
  { id: 'N02', label: '任务简报', type: 'scene', x: 300, y: 110 },
  { id: 'N03', label: '进入路线？', type: 'choice', x: 300, y: 190 },
  { id: 'N04', label: '暗夜通道', type: 'scene', x: 160, y: 280 },
  { id: 'N05', label: '换装渗透', type: 'scene', x: 440, y: 280 },
  { id: 'N06', label: '警卫逼近', type: 'qte', x: 300, y: 370 },
  { id: 'N07', label: '潜行判定', type: 'condition', x: 300, y: 450, hasError: true, errorMsg: '缺少失败反馈文案' },
  { id: 'N08', label: '数据到手', type: 'scene', x: 160, y: 540 },
  { id: 'N09', label: '身份暴露', type: 'scene', x: 440, y: 540 },
  { id: 'N10', label: '结局A 幽灵归来', type: 'ending_good', x: 160, y: 630 },
  { id: 'N11', label: '今夜失败', type: 'ending_bad', x: 440, y: 630 },
];

export const NODE_EDGES: NodeEdge[] = [
  { from: 'N01', to: 'N02' },
  { from: 'N02', to: 'N03' },
  { from: 'N03', to: 'N04', label: 'A' },
  { from: 'N03', to: 'N05', label: 'B' },
  { from: 'N04', to: 'N06' },
  { from: 'N05', to: 'N06' },
  { from: 'N06', to: 'N07' },
  { from: 'N07', to: 'N08', label: '成功' },
  { from: 'N07', to: 'N09', label: '失败' },
  { from: 'N08', to: 'N10' },
  { from: 'N09', to: 'N11' },
];

// ── 游戏 UI 模板数据 ──────────────────────────────────────────────────────

export type UITemplateCategory = 'dialog' | 'choice' | 'hud' | 'menu' | 'qte' | 'system';

export interface UITemplate {
  id: string;
  name: string;
  category: UITemplateCategory;
  style: string;       // 风格标签 e.g. 赛博朋克, 古风, 现代
  author: string;
  downloads: number;
  rating: number;      // 0-5
  preview: string;     // 预览截图 URL
  description: string;
  source: 'builtin' | 'marketplace' | 'ai_generated';
  isApplied: boolean;  // 当前项目是否使用中
  components: UIComponentDef[];
}

export interface UIComponentDef {
  id: string;
  type: 'dialog_box' | 'choice_button' | 'hud_bar' | 'status_indicator' | 'qte_prompt' | 'menu_panel' | 'save_slot' | 'settings_panel';
  label: string;
  props: Record<string, string | number | boolean>;
}

export const UI_TEMPLATES: UITemplate[] = [
  {
    id: 'tpl-cyber-dialog',
    name: '赛博对话框',
    category: 'dialog',
    style: '赛博朋克',
    author: '逐梦官方',
    downloads: 3842,
    rating: 4.8,
    preview: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=400&q=80',
    description: '霓虹光效对话框，适配赛博朋克、科幻题材。支持角色立绘展示和打字机效果。',
    source: 'builtin',
    isApplied: true,
    components: [
      { id: 'c1', type: 'dialog_box', label: '主对话框', props: { bg: 'rgba(0,0,0,0.85)', border: '#7C6CF5', borderRadius: 16, textSpeed: 40, showNameplate: true } },
      { id: 'c2', type: 'choice_button', label: '选项按钮', props: { bg: 'linear-gradient(90deg,#450a0a,#7f1d1d)', hoverBg: '#7C6CF5', fontSize: 12, animated: true } },
    ],
  },
  {
    id: 'tpl-cyber-hud',
    name: '赛博 HUD',
    category: 'hud',
    style: '赛博朋克',
    author: '逐梦官方',
    downloads: 2156,
    rating: 4.5,
    preview: 'https://images.unsplash.com/photo-1515621061946-eff1c2a352bd?auto=format&fit=crop&w=400&q=80',
    description: '科幻风格顶部状态栏，支持耐力值、信任度等自定义变量显示。',
    source: 'builtin',
    isApplied: true,
    components: [
      { id: 'c3', type: 'hud_bar', label: '顶部状态栏', props: { position: 'top', bg: 'rgba(0,0,0,0.5)', blur: true, showIcons: true } },
      { id: 'c4', type: 'status_indicator', label: '变量指示器', props: { shape: 'pill', animated: true, colorScheme: 'neon' } },
    ],
  },
  {
    id: 'tpl-cyber-qte',
    name: '赛博 QTE 面板',
    category: 'qte',
    style: '赛博朋克',
    author: '逐梦官方',
    downloads: 1520,
    rating: 4.3,
    preview: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=400&q=80',
    description: '快速反应事件面板，倒计时、按键提示、成功率显示一体化。',
    source: 'builtin',
    isApplied: false,
    components: [
      { id: 'c5', type: 'qte_prompt', label: 'QTE 提示', props: { countdown: true, shakeOnFail: true, overlay: 'rgba(0,0,0,0.6)' } },
    ],
  },
  {
    id: 'tpl-ancient-dialog',
    name: '古风对话框',
    category: 'dialog',
    style: '古风',
    author: '素材达人',
    downloads: 5210,
    rating: 4.9,
    preview: 'https://images.unsplash.com/photo-1528181304800-259b3f870d0f?auto=format&fit=crop&w=400&q=80',
    description: '水墨画风格对话框，适配古风、仙侠题材。宣纸底纹+毛笔字体。',
    source: 'marketplace',
    isApplied: false,
    components: [
      { id: 'c6', type: 'dialog_box', label: '水墨对话框', props: { bg: 'rgba(245,240,225,0.95)', border: '#8B7355', borderRadius: 4, textSpeed: 50, showNameplate: true } },
      { id: 'c7', type: 'choice_button', label: '竹简选项', props: { bg: 'linear-gradient(180deg,#D4C5A0,#B8A878)', hoverBg: '#8B7355', fontSize: 14, animated: false } },
    ],
  },
  {
    id: 'tpl-modern-menu',
    name: '现代系统菜单',
    category: 'system',
    style: '现代',
    author: 'UI大师',
    downloads: 3100,
    rating: 4.6,
    preview: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=400&q=80',
    description: '极简现代风格系统菜单，含存档、读档、设置、返回主页等功能。',
    source: 'marketplace',
    isApplied: false,
    components: [
      { id: 'c8', type: 'menu_panel', label: '主菜单', props: { bg: '#FFFFFF', blur: true, layout: 'center', transition: 'fade' } },
      { id: 'c9', type: 'save_slot', label: '存档槽位', props: { slots: 12, thumbnailSize: 'medium', autoSave: true } },
      { id: 'c10', type: 'settings_panel', label: '设置面板', props: { textSpeed: true, bgmVolume: true, fullscreen: true, language: false } },
    ],
  },
  {
    id: 'tpl-cyber-menu',
    name: '赛博系统菜单',
    category: 'menu',
    style: '赛博朋克',
    author: '逐梦官方',
    downloads: 1890,
    rating: 4.4,
    preview: 'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?auto=format&fit=crop&w=400&q=80',
    description: '赛博朋克风格系统菜单，全息投影质感，与赛博对话框配套使用。',
    source: 'builtin',
    isApplied: false,
    components: [
      { id: 'c11', type: 'menu_panel', label: '全息菜单', props: { bg: 'rgba(0,10,30,0.9)', blur: true, layout: 'grid', transition: 'glitch' } },
      { id: 'c12', type: 'save_slot', label: '数据存档', props: { slots: 8, thumbnailSize: 'large', autoSave: false } },
      { id: 'c13', type: 'settings_panel', label: '系统设置', props: { textSpeed: true, bgmVolume: true, fullscreen: true, language: true } },
    ],
  },
];

// 游戏 UI 全局配置（项目级别）
export interface GameUISettings {
  dialogTheme: string;   // 引用的模板 ID
  hudTheme: string;
  menuTheme: string;
  qteTheme: string;
  globalFont: string;
  globalTextSpeed: number;
  showSkipButton: boolean;
  showAutoPlay: boolean;
  showSaveLoad: boolean;
}

export const GAME_UI_SETTINGS: GameUISettings = {
  dialogTheme: 'tpl-cyber-dialog',
  hudTheme: 'tpl-cyber-hud',
  menuTheme: 'tpl-cyber-menu',
  qteTheme: 'tpl-cyber-qte',
  globalFont: '默认字体',
  globalTextSpeed: 40,
  showSkipButton: true,
  showAutoPlay: true,
  showSaveLoad: true,
};

// Asset data
export interface AssetCard {
  nodeId: string;
  nodeLabel: string;
  hasImage: boolean;
  hasBgm: boolean;
  hasVoice: boolean;
  hasVideo: boolean;
  imageUrl?: string;
}

export const ASSET_CARDS: AssetCard[] = [
  { nodeId: 'N01', nodeLabel: '序章·霓虹夜幕', hasImage: true, hasBgm: false, hasVoice: false, hasVideo: false, imageUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=200&q=60' },
  { nodeId: 'N02', nodeLabel: '任务简报', hasImage: true, hasBgm: false, hasVoice: false, hasVideo: false, imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=200&q=60' },
  { nodeId: 'N03', nodeLabel: '进入路线？', hasImage: true, hasBgm: false, hasVoice: false, hasVideo: false, imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=200&q=60' },
  { nodeId: 'N04', nodeLabel: '暗夜通道', hasImage: true, hasBgm: false, hasVoice: false, hasVideo: false, imageUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=200&q=60' },
  { nodeId: 'N05', nodeLabel: '换装渗透', hasImage: true, hasBgm: false, hasVoice: false, hasVideo: false, imageUrl: 'https://images.unsplash.com/photo-1520295187453-cd239786490c?auto=format&fit=crop&w=200&q=60' },
  { nodeId: 'N06', nodeLabel: '警卫逼近', hasImage: false, hasBgm: false, hasVoice: false, hasVideo: false },
  { nodeId: 'N07', nodeLabel: '潜行判定', hasImage: true, hasBgm: false, hasVoice: false, hasVideo: false, imageUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=200&q=60' },
  { nodeId: 'N08', nodeLabel: '数据到手', hasImage: true, hasBgm: false, hasVoice: false, hasVideo: false, imageUrl: 'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?auto=format&fit=crop&w=200&q=60' },
  { nodeId: 'N09', nodeLabel: '身份暴露', hasImage: false, hasBgm: false, hasVoice: false, hasVideo: false },
];

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

export const GAME_CHARACTERS: GameCharacter[] = [
  {
    id: 'c1', name: '艾拉', role: '女主角 · 侦探', color: '#5E50E8', emoji: '🕵️',
    description: '黑色短发，银色义眼，黑色风衣，冷静警觉',
    appearNodes: ['N01','N02','N03','N04','N05','N06','N07','N08','N10'],
    emotionStates: [
      { label: '默认', done: true }, { label: '愤怒', done: true },
      { label: '受伤', done: false }, { label: '沉默', done: false },
    ],
    visualPrompt: '黑色短发，银色义眼，黑色风衣，赛博朋克都市，4K高清',
  },
  {
    id: 'c2', name: '线人', role: '关键 NPC', color: '#D97706', emoji: '🕴️',
    description: '神秘男性，中年，隐藏身份，掌握关键情报',
    appearNodes: ['N02','N03','N08'],
    emotionStates: [
      { label: '默认', done: true }, { label: '紧张', done: false },
      { label: '受伤', done: false }, { label: '死亡', done: false },
    ],
    visualPrompt: '中年男性，破旧夹克，背光站立，霓虹反射',
  },
  {
    id: 'c3', name: '反派主管', role: '反派', color: '#DC2626', emoji: '👔',
    description: '西装笔挺，冷峻表情，幕后操控者',
    appearNodes: ['N05','N09','N11'],
    emotionStates: [
      { label: '默认', done: false }, { label: '愤怒', done: false },
    ],
    visualPrompt: '西装革履，冷峻表情，企业高层，摩天楼背景',
  },
];

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

export const GAME_SCENES: GameScene[] = [
  { id: 's1', name: '霓虹街道', location: '城市中心·外', lighting: '霓虹灯+路灯', atmosphere: '喧嚣、潮湿、赛博朋克', refNodes: ['N01'], hasImage: true, imageUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=400&q=80', visualPrompt: '2047年赛博朋克街道，积水路面，霓虹广告牌，人群' },
  { id: 's2', name: '地下酒吧', location: '贫民区·内', lighting: '昏暗暖光', atmosphere: '嘈杂、危险、地下世界', refNodes: ['N02','N03'], hasImage: true, imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=400&q=80', visualPrompt: '地下酒吧，昏暗灯光，烟雾，赛博朋克装饰' },
  { id: 's3', name: '暗夜通道', location: '地下管道·内', lighting: '应急灯', atmosphere: '压抑、紧张、密闭空间', refNodes: ['N04'], hasImage: true, imageUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=400&q=80', visualPrompt: '地下管道通道，应急红灯，水渍墙壁' },
  { id: 's4', name: '企业大厦', location: '商业区·内/外', lighting: '冷白荧光灯', atmosphere: '高科技、秩序、危险', refNodes: ['N05','N06','N07'], hasImage: true, imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=400&q=80', visualPrompt: '赛博朋克企业大厦内部，全息投影，安保系统' },
  { id: 's5', name: '数据中心', location: '大厦B3层·内', lighting: '蓝色服务器灯光', atmosphere: '冰冷、信息密集、核心机密', refNodes: ['N08','N10'], hasImage: true, imageUrl: 'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?auto=format&fit=crop&w=400&q=80', visualPrompt: '大型数据中心，蓝色LED，服务器阵列' },
  { id: 's6', name: '逃生暗巷', location: '城市边缘·外', lighting: '月光+远处霓虹', atmosphere: '紧张、绝望、最后机会', refNodes: ['N09','N11'], hasImage: false, visualPrompt: '狭窄暗巷，月光，远处城市霓虹，潮湿地面' },
];

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

export const GAME_PROPS: GameProp[] = [
  { id: 'p1', name: '追踪芯片', type: 'key_item', description: '植入体内的微型追踪器', gameplayEffect: '决定潜行路线选择', refNodes: ['N01','N02'], hasImage: false },
  { id: 'p2', name: '变声器', type: 'tool', description: '可模仿任何人声音的设备', gameplayEffect: '+渗透值 15', refNodes: ['N05'], hasImage: false },
  { id: 'p3', name: '加密U盘', type: 'key_item', description: '存储核心证据的加密存储设备', gameplayEffect: '决定结局分支', refNodes: ['N08','N10'], hasImage: false },
  { id: 'p4', name: '无人机', type: 'tool', description: '小型侦察无人机', gameplayEffect: '+侦察值 20', refNodes: ['N04'], hasImage: false },
  { id: 'p5', name: 'EMP手雷', type: 'weapon', description: '电磁脉冲手雷，可瘫痪电子设备', gameplayEffect: 'QTE成功关键道具', refNodes: ['N06'], hasImage: false },
  { id: 'p6', name: '全息投影仪', type: 'tool', description: '可投射虚假影像的便携设备', gameplayEffect: '+欺骗值 25', refNodes: ['N05','N07'], hasImage: false },
  { id: 'p7', name: '神经接口', type: 'key_item', description: '直连数据网络的神经接口', gameplayEffect: '解锁隐藏路径', refNodes: ['N08'], hasImage: false },
  { id: 'p8', name: '伪造ID', type: 'tool', description: '企业员工伪造身份卡', gameplayEffect: '+渗透值 10', refNodes: ['N05'], hasImage: false },
  { id: 'p9', name: '信号屏蔽器', type: 'tool', description: '屏蔽周围追踪信号的装置', gameplayEffect: '+潜行值 20', refNodes: ['N04','N06'], hasImage: false },
];

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

export const GAME_VARIABLES: GameVariable[] = [
  { id: 'stealth_score', name: 'stealth_score', label: '潜行值', initialValue: 55, description: '衡量玩家潜行能力', modifiedBy: ['N04','N05'], readBy: ['N07'] },
  { id: 'alert_level', name: 'alert_level', label: '警戒值', initialValue: 30, description: '敌人警戒程度', modifiedBy: ['N06'], readBy: ['N07'] },
  { id: 'trust_lineman', name: 'trust_lineman', label: '信任值', initialValue: 20, description: '对线人的信任程度', modifiedBy: ['N02','N03'], readBy: ['N07','N08'] },
  { id: 'truth', name: 'truth', label: '真相值', initialValue: 0, description: '已揭露的真相碎片', modifiedBy: ['N08'], readBy: ['N10'] },
];

export const INIT_VARIABLES: Record<string, number> = {
  stealth_score: 55,
  alert_level: 30,
  trust_lineman: 20,
  truth: 0,
};

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

export const PLAYABLE_GRAPH: Record<string, PlayableNode> = {
  N01: { id: 'N01', char: '旁白', text: '2047年，深夜。霓虹灯光把积水的城市街道染成猩红。艾拉站在一扇锈门前，追踪信号在此中断。', backgroundImage: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80', choices: [{ label: '推门进入', next: 'N02', effect: '+0' }, { label: '先观察环境', next: 'N02', effect: '+trust_lineman 5' }] },
  N02: { id: 'N02', char: '线人', text: '你来了。那枚追踪芯片，他们已经发现了。你必须在他们找到我之前做出选择。', backgroundImage: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80', choices: [{ label: '相信线人，一起行动', next: 'N03A', effect: '+trust_lineman 20' }, { label: '保持怀疑，独自调查', next: 'N03B', effect: '-trust_lineman 10' }] },
  N03: { id: 'N03', char: '旁白', text: '艾拉面临关键抉择——是走安全的暗巷通道，还是冒险换装渗入企业大厦？', backgroundImage: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80', choices: [{ label: 'A. 暗夜通道潜行', next: 'N04', effect: '+stealth_score 15' }, { label: 'B. 换装渗透大厦', next: 'N05', effect: '+alert_level 10' }] },
  N04: { id: 'N04', char: '艾拉', text: '你跟着线人穿过地下通道，抵达企业大厦后方。这里有一条通风管道直通数据中心。', backgroundImage: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80', choices: [{ label: '继续潜行', next: 'N06', effect: '+stealth_score 10' }] },
  N05: { id: 'N05', char: '旁白', text: '你换上企业制服，刷伪造ID进入大厦。走廊尽头，两名警卫正在巡逻。', backgroundImage: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80', choices: [{ label: '避开警卫', next: 'N06', effect: '+stealth_score 5' }, { label: '利用变声器欺骗', next: 'N06', effect: '+stealth_score 15' }] },
  N06: { id: 'N06', char: '旁白', text: '警卫逼近！你只有1.5秒做出反应！', backgroundImage: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80', choices: [{ label: '使用EMP手雷', next: 'N07S', effect: '+stealth_score 20' }, { label: '强行突破', next: 'N07F', effect: '-stealth_score 30' }] },
  N07S: { id: 'N07S', char: '旁白', text: 'EMP手雷成功瘫痪了警卫的通讯设备。你安全通过了检查点。', backgroundImage: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80', choices: [{ label: '前往数据中心', next: 'N08', effect: '+truth 20' }] },
  N07F: { id: 'N07F', char: '旁白', text: '强行突破触发了警报。整栋大厦进入封锁状态。', backgroundImage: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80', choices: [{ label: '试图逃跑', next: 'N09', effect: '+alert_level 50' }] },
  N08: { id: 'N08', char: '艾拉', text: '数据到手了。加密U盘里记录了所有证据——企业非法追踪全民的完整日志。', backgroundImage: 'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?auto=format&fit=crop&w=800&q=80', choices: [{ label: '安全撤离', next: 'GOOD', effect: '+truth 50' }] },
  N09: { id: 'N09', char: '旁白', text: '你被困在暗巷中，企业安保部队包围了所有出口。反派主管出现在全息投影中。', backgroundImage: 'https://images.unsplash.com/photo-1515621061946-eff1c2a352bd?auto=format&fit=crop&w=800&q=80', choices: [{ label: '接受命运', next: 'BAD', effect: '+0' }] },
  GOOD: { id: 'GOOD', char: '结局A', text: '【幽灵归来】\n艾拉带着证据安全撤离。真相终将浮出水面，而她已消失在霓虹夜幕中。城市的暗处多了一个守护者。', isEnding: true, endingType: 'good' },
  BAD: { id: 'BAD', char: '结局B', text: '【今夜失败】\n艾拉被捕，证据湮没。但她记住了这条路，还有下一次机会。', isEnding: true, endingType: 'bad' },
};

// ── 叙事设计意图（P0-3）─────────────────────────────────────────────────────

export interface NarrativeIntent {
  nodeId: string;
  purpose: 'push_conflict' | 'reveal_info' | 'choice_pressure' | 'emotional_climax' | 'setup_payoff' | 'resolution';
  purposeLabel: string;
  choiceImpact?: string;
  variableChanges?: { variable: string; operation: string; value: number }[];
  emotionValue: number; // 1-10 tension
  failFeedback?: string;
}

export const NARRATIVE_INTENTS: NarrativeIntent[] = [
  { nodeId: 'N01', purpose: 'setup_payoff', purposeLabel: '建立世界观与角色', emotionValue: 3 },
  { nodeId: 'N02', purpose: 'reveal_info', purposeLabel: '揭示核心冲突', emotionValue: 5, choiceImpact: '影响后续信任判定' },
  { nodeId: 'N03', purpose: 'choice_pressure', purposeLabel: '关键路线选择', emotionValue: 6, choiceImpact: '决定渗透路线（暗巷 vs 大厦）', variableChanges: [{ variable: 'stealth_score', operation: '+15', value: 15 }] },
  { nodeId: 'N04', purpose: 'push_conflict', purposeLabel: '推进潜行冲突', emotionValue: 5, variableChanges: [{ variable: 'stealth_score', operation: '+10', value: 10 }] },
  { nodeId: 'N05', purpose: 'push_conflict', purposeLabel: '渗透紧张感', emotionValue: 6, variableChanges: [{ variable: 'alert_level', operation: '+10', value: 10 }] },
  { nodeId: 'N06', purpose: 'emotional_climax', purposeLabel: 'QTE 高潮时刻', emotionValue: 9, failFeedback: 'EMP失败导致警报触发，进入暴露路线' },
  { nodeId: 'N07', purpose: 'choice_pressure', purposeLabel: '条件判定·命运转折', emotionValue: 8, choiceImpact: '根据潜行值判定成功/失败，决定结局走向', variableChanges: [{ variable: 'stealth_score', operation: 'check', value: 60 }], failFeedback: '潜行值不足→身份暴露→坏结局' },
  { nodeId: 'N08', purpose: 'reveal_info', purposeLabel: '核心信息获取', emotionValue: 7, variableChanges: [{ variable: 'truth', operation: '+50', value: 50 }] },
  { nodeId: 'N09', purpose: 'emotional_climax', purposeLabel: '绝望与暴露', emotionValue: 8 },
  { nodeId: 'N10', purpose: 'resolution', purposeLabel: '好结局·真相揭露', emotionValue: 4 },
  { nodeId: 'N11', purpose: 'resolution', purposeLabel: '坏结局·遗憾收场', emotionValue: 6 },
];

// ── 质量检查系统（P0-4）─────────────────────────────────────────────────────

export type QCCategory = 'structure' | 'narrative' | 'assets' | 'publish';

export interface QualityCheck {
  id: string;
  category: QCCategory;
  categoryLabel: string;
  label: string;
  status: 'ok' | 'warn' | 'error';
  detail: string;
  fixLink?: string;
}

export const QUALITY_CHECKS: QualityCheck[] = [
  // 结构完整性
  { id: 'qc01', category: 'structure', categoryLabel: '结构完整性', label: '主线连通', status: 'ok', detail: '入口到所有结局路径已连通' },
  { id: 'qc02', category: 'structure', categoryLabel: '结构完整性', label: '所有结局可达', status: 'ok', detail: '2 个结局均可通过正常游玩触发' },
  { id: 'qc03', category: 'structure', categoryLabel: '结构完整性', label: '无孤立节点', status: 'ok', detail: '所有 11 个节点均在至少一条路径上' },
  { id: 'qc04', category: 'structure', categoryLabel: '结构完整性', label: '无死路', status: 'ok', detail: '所有非结局节点都有出路' },
  { id: 'qc05', category: 'structure', categoryLabel: '结构完整性', label: '无循环错误', status: 'ok', detail: '未检测到异常循环' },
  // 叙事质量
  { id: 'qc06', category: 'narrative', categoryLabel: '叙事质量', label: '选择有意义', status: 'ok', detail: 'N03 路线选择导致不同路径和结局' },
  { id: 'qc07', category: 'narrative', categoryLabel: '叙事质量', label: '分支不过短', status: 'ok', detail: '最短分支 4 个节点，满足最低要求' },
  { id: 'qc08', category: 'narrative', categoryLabel: '叙事质量', label: '失败反馈完整', status: 'error', detail: 'N07 潜行判定节点失败路径缺少文案', fixLink: '/nodes' },
  { id: 'qc09', category: 'narrative', categoryLabel: '叙事质量', label: '变量均被使用', status: 'ok', detail: '4 个变量均在条件判定中读取' },
  { id: 'qc10', category: 'narrative', categoryLabel: '叙事质量', label: '角色出场连贯', status: 'warn', detail: '反派主管在 N01-N04 连续 4 个节点未出场' },
  // 资产完整性
  { id: 'qc11', category: 'assets', categoryLabel: '资产完整性', label: '场景图片覆盖', status: 'warn', detail: '8/9 节点有图片，N06 和 N09 缺失' },
  { id: 'qc12', category: 'assets', categoryLabel: '资产完整性', label: 'BGM 覆盖', status: 'error', detail: '9 个节点 BGM 全部缺失', fixLink: '/assets' },
  { id: 'qc13', category: 'assets', categoryLabel: '资产完整性', label: 'UI 模板覆盖', status: 'warn', detail: 'QTE 面板和系统菜单尚未应用' },
  // 发布风险
  { id: 'qc14', category: 'publish', categoryLabel: '发布风险', label: '无未审核资产', status: 'ok', detail: '所有已生成资产已通过审核' },
  { id: 'qc15', category: 'publish', categoryLabel: '发布风险', label: '试玩已通过', status: 'warn', detail: '尚未完成至少一条完整路径试玩', fixLink: '/simulator' },
  { id: 'qc16', category: 'publish', categoryLabel: '发布风险', label: '体验时长合理', status: 'ok', detail: '预估 15 分钟，在目标范围内' },
];

// ── 世界观设定（统一）─────────────────────────────────────────────────────

export interface WorldBuildingEntry {
  category: string;
  content: string;
}

export const WORLD_BUILDING: WorldBuildingEntry[] = [
  { category: '时代背景', content: '2047年，信息战与人工智能渗透社会各层。城市被霓虹灯与数据流覆盖，贫富差距加剧，隐私成为稀缺资源。' },
  { category: '核心冲突', content: '企业权力与个人隐私的终极博弈。追踪芯片技术使公民无所遁形，反抗者转入地下。' },
  { category: '主要场景', content: '霓虹街道 · 地下酒吧 · 企业大厦 · 数据中心 · 暗巷通道 — 共6个关键场景。' },
  { category: '关键道具', content: '追踪芯片 · 变声器 · 加密U盘 · 无人机 · EMP手雷 · 全息投影仪 · 神经接口 · 伪造ID · 信号屏蔽器' },
  { category: '故事主题', content: '信任与背叛、真相的代价、个人选择改变命运' },
];

// ── 分支路径（统一）─────────────────────────────────────────────────────────

export interface BranchPath {
  id: string;
  label: string;
  nodes: string[];
  ending: string;
  type: 'good' | 'bad';
}

export const BRANCH_PATHS: BranchPath[] = [
  { id: 'main', label: '主线 A（成功路线）', nodes: ['N01','N02','N03','N04','N06','N07','N08','N10'], ending: '幽灵归来', type: 'good' },
  { id: 'alt', label: '主线 B（暴露路线）', nodes: ['N01','N02','N03','N05','N06','N07','N09','N11'], ending: '今夜失败', type: 'bad' },
];

// ── 阶段检查（NodesScreen 侧边栏）─────────────────────────────────────────

export interface StageCheck {
  label: string;
  detail: string;
  status: 'ok' | 'warn';
}

export const STAGE_CHECKS: StageCheck[] = [
  { label: '故事结构', detail: '11 个节点，入口和结局已连通', status: 'ok' },
  { label: '互动选择', detail: '1 个选择节点，2 个玩家选项', status: 'ok' },
  { label: '角色配置', detail: '3 个角色已配置', status: 'ok' },
  { label: '节点资产', detail: '8/9 个场景已有图片或视频，建议补齐', status: 'warn' },
  { label: '预览试玩', detail: '已从玩家视角打开过预览', status: 'ok' },
  { label: 'H5 发布', detail: 'H5 链接已发布，可分享给玩家', status: 'ok' },
];

// ── 剧本 Blocks（ScriptScreen）─────────────────────────────────────────────

export type ScriptBlockType = 'scene' | 'narr' | 'dialog' | 'choice' | 'cond';

export interface ScriptBlock {
  id: string;
  type: ScriptBlockType;
  label: string;
  char?: string;
  content: string;
  options?: string[];
  color: string;
}

export const SCRIPT_BLOCKS: ScriptBlock[] = [
  { id: 'b1', type: 'scene', label: '场景', color: '#5E50E8', content: '霓虹街道 · 夜 · 外  |  2047年，积水路面，广告牌投影闪烁，艾拉穿过熙攘人群。' },
  { id: 'b2', type: 'narr', label: '旁白', color: '#8892B0', content: '追踪信号在前方100米处中断。她停在一扇锈迹斑斑的门前，耳机里传来微弱杂音。' },
  { id: 'b3', type: 'dialog', label: '台词', char: '艾拉', color: '#00A99D', content: '线人在哪？已经等了整整20分钟了。' },
  { id: 'b4', type: 'choice', label: '选择', color: '#D97706', content: '是否相信陌生来电？', options: ['A. 相信，进地下酒吧', 'B. 拒绝接触，转身离开', 'C. 反向追踪来电来源'] },
  { id: 'b5', type: 'scene', label: '场景', color: '#5E50E8', content: '地下酒吧 · 夜 · 内  |  昏暗灯光，嘈杂人群，空气中弥漫着廉价酒精的气味。' },
  { id: 'b6', type: 'dialog', label: '台词', char: '线人', color: '#00A99D', content: '你来了。那枚追踪芯片……他们已经发现了。你必须在他们找到我之前做出选择。' },
  { id: 'b7', type: 'cond', label: '条件', color: '#D97706', content: '检查变量：trust_lineman ≥ 40 → 进入N07  |  否则 → 进入N09' },
];

export const AI_SUGGESTIONS: Record<string, string[]> = {
  write: ['AI 续写中……✨ 建议：「艾拉注意到线人手背上的追踪芯片切口——那是植入后的标记……」已插入下方。'],
  polish: ['AI 润色完成 ✨\n原文：「线人在哪？」\n优化为：「线人还没到？这已经是第三次失约了。」—— 更符合角色急迫情绪。'],
  branch: ['已为「进入路线」节点生成 2 个新分支：\n— C. 利用无人机侦察  → 触发条件 surveillance_drone > 0\n— D. 强行破门  → 触发 alert_level +20'],
};

// ── 热力图模拟数据（P2-13）─────────────────────────────────────────────

export interface HeatmapEntry {
  nodeId: string;
  visitRate: number;       // 0-100, 玩家到达率
  avgTimeSpent: number;    // 秒, 平均停留时间
  choiceDistribution?: number[]; // 选择分布百分比（仅选择节点）
  dropOffRate: number;     // 0-100, 玩家流失率
  heatLevel: 'hot' | 'warm' | 'cool' | 'cold';
  playCount: number;       // 总游玩次数
  completionRate: number;  // 0-100, 从该节点到结局的完成率
}

export const HEATMAP_DATA: HeatmapEntry[] = [
  { nodeId: 'N01', visitRate: 100, avgTimeSpent: 45, dropOffRate: 2, heatLevel: 'hot', playCount: 234, completionRate: 78 },
  { nodeId: 'N02', visitRate: 98, avgTimeSpent: 62, dropOffRate: 3, heatLevel: 'hot', playCount: 229, completionRate: 76 },
  { nodeId: 'N03', visitRate: 95, avgTimeSpent: 38, choiceDistribution: [58, 42], dropOffRate: 5, heatLevel: 'hot', playCount: 222, completionRate: 74 },
  { nodeId: 'N04', visitRate: 55, avgTimeSpent: 71, dropOffRate: 8, heatLevel: 'warm', playCount: 129, completionRate: 72 },
  { nodeId: 'N05', visitRate: 40, avgTimeSpent: 55, dropOffRate: 12, heatLevel: 'warm', playCount: 94, completionRate: 65 },
  { nodeId: 'N06', visitRate: 88, avgTimeSpent: 22, dropOffRate: 15, heatLevel: 'hot', playCount: 206, completionRate: 60 },
  { nodeId: 'N07', visitRate: 82, avgTimeSpent: 18, choiceDistribution: [68, 32], dropOffRate: 22, heatLevel: 'warm', playCount: 192, completionRate: 58 },
  { nodeId: 'N08', visitRate: 52, avgTimeSpent: 85, dropOffRate: 4, heatLevel: 'warm', playCount: 122, completionRate: 92 },
  { nodeId: 'N09', visitRate: 30, avgTimeSpent: 48, dropOffRate: 35, heatLevel: 'cold', playCount: 70, completionRate: 15 },
  { nodeId: 'N10', visitRate: 48, avgTimeSpent: 95, dropOffRate: 0, heatLevel: 'warm', playCount: 112, completionRate: 100 },
  { nodeId: 'N11', visitRate: 28, avgTimeSpent: 42, dropOffRate: 0, heatLevel: 'cold', playCount: 65, completionRate: 100 },
];

// ── 章节规划数据（P3-2）─────────────────────────────────────────────

export interface ChapterEvent {
  id: string;
  title: string;
  description: string;
  isBranchPoint: boolean;
  branchOptions?: { label: string; consequence: string }[];
  variableHints?: string[];
}

export interface ChapterPlan {
  id: string;
  chapterNumber: number;
  title: string;
  themeQuestion: string;
  emotionArc: string;
  events: ChapterEvent[];
  keyDialogue?: string;
  characterStates?: string;
  suspenseHook?: string;
  chapterEndHook?: string;
  estimatedDuration: string;
}

export const CHAPTER_PLANS: ChapterPlan[] = [
  {
    id: 'ch0',
    chapterNumber: 0,
    title: '序章：霓虹夜幕',
    themeQuestion: '在一个没有隐私的世界里，一个人还能隐藏什么？',
    emotionArc: '平静 → 紧张 → 好奇',
    events: [
      { id: 'e0-1', title: '夜幕降临', description: '2047年深夜，霓虹灯光把积水路面染成猩红。艾拉穿过熙攘人群，追踪一个中断的信号。', isBranchPoint: false },
      { id: 'e0-2', title: '信号中断', description: '追踪信号在一扇锈迹斑斑的门前消失。耳机里传来微弱杂音，似乎在等待回应。', isBranchPoint: true, branchOptions: [
        { label: '推门进入', consequence: '直接进入任务简报，节奏更快' },
        { label: '先观察环境', consequence: '获取额外信息，增加信任值' },
      ], variableHints: ['trust_lineman +5'] },
    ],
    keyDialogue: '（无对白，纯环境叙事）',
    characterStates: '艾拉：警觉、专注、略带疲惫',
    suspenseHook: '线人为什么没有按约定出现？',
    chapterEndHook: '锈门后传来脚步声——有人在等她。',
    estimatedDuration: '2 分钟',
  },
  {
    id: 'ch1',
    chapterNumber: 1,
    title: '第一章：线人接头',
    themeQuestion: '信任是奢侈品还是必需品？',
    emotionArc: '紧张 → 犹豫 → 决断',
    events: [
      { id: 'e1-1', title: '线人现身', description: '线人从暗处走出，神情紧张。他手背上有追踪芯片的切口——那是植入后被取出的痕迹。', isBranchPoint: false },
      { id: 'e1-2', title: '关键情报', description: '线人告知追踪芯片已被发现，必须在被找到之前做出选择。', isBranchPoint: false },
      { id: 'e1-3', title: '信任抉择', description: '艾拉需要决定是否信任这个反复失约的线人。', isBranchPoint: true, branchOptions: [
        { label: 'A. 相信线人，一起行动', consequence: '信任值大幅提升，进入合作路线' },
        { label: 'B. 保持怀疑，独自调查', consequence: '信任值下降，进入独行路线' },
        { label: 'C. 假装相信，暗中观察', consequence: '信任值不变，获得额外观察信息' },
      ], variableHints: ['trust_lineman ±20'] },
    ],
    keyDialogue: '"你来了。那枚追踪芯片……他们已经发现了。"',
    characterStates: '艾拉：犹豫但冷静 / 线人：恐惧、急切',
    suspenseHook: '线人是否真的可信？他手背上的伤口意味着什么？',
    chapterEndHook: '无论选择什么，艾拉必须在今夜找到答案。',
    estimatedDuration: '3 分钟',
  },
  {
    id: 'ch2',
    chapterNumber: 2,
    title: '第二章：渗透行动',
    themeQuestion: '为了真相，你愿意冒多大的险？',
    emotionArc: '决断 → 紧张 → 高潮 → 转折',
    events: [
      { id: 'e2-1', title: '路线选择', description: '艾拉面临关键抉择——走安全的暗巷通道，还是冒险换装渗入企业大厦。', isBranchPoint: true, branchOptions: [
        { label: 'A. 暗夜通道潜行', consequence: '低警戒路线，潜行值增加' },
        { label: 'B. 换装渗透大厦', consequence: '高警戒路线，风险更大但信息更丰富' },
      ], variableHints: ['stealth_score +15 / alert_level +10'] },
      { id: 'e2-2', title: '警卫逼近', description: '无论走哪条路线，都遭遇了巡逻警卫。必须在 1.5 秒内做出反应。', isBranchPoint: false },
      { id: 'e2-3', title: 'QTE 判定', description: '系统根据潜行值判定是否成功通过警卫区域。', isBranchPoint: true, branchOptions: [
        { label: '潜行值 ≥ 60 → 成功', consequence: '安全通过，进入数据获取路线' },
        { label: '潜行值 < 60 → 失败', consequence: '身份暴露，进入逃亡路线' },
      ], variableHints: ['stealth_score 条件检查'] },
      { id: 'e2-4', title: '数据到手 / 身份暴露', description: '根据判定结果进入完全不同的剧情走向。', isBranchPoint: false },
      { id: 'e2-5', title: '结局分支', description: '好结局：艾拉带着证据安全撤离。坏结局：艾拉被捕，证据湮没。', isBranchPoint: false },
    ],
    keyDialogue: '"数据到手了。加密U盘里记录了所有证据。"',
    characterStates: '艾拉：高度紧张、决绝 / 反派主管：冷酷、掌控全局',
    suspenseHook: '艾拉的潜行能力能否让她安全通过？',
    chapterEndHook: '霓虹夜幕中，幽灵消失在人群里——或者被铁链锁住。',
    estimatedDuration: '5 分钟',
  },
];

// ── 世界规则数据（P3-4）─────────────────────────────────────────────

export type WorldRuleType = 'setting' | 'character_constraint' | 'permanent_rule' | 'narrative_taboo' | 'tension_check';

export interface WorldRule {
  id: string;
  type: WorldRuleType;
  typeLabel: string;
  title: string;
  description: string;
  severity: 'hard' | 'soft' | 'suggestion';
  relatedCharacters?: string[];
  relatedScenes?: string[];
  validated: boolean;
}

export const WORLD_RULES: WorldRule[] = [
  {
    id: 'wr-01', type: 'setting', typeLabel: '背景设定',
    title: '2047 年信息战时代',
    description: '人工智能渗透社会各层，城市被霓虹灯与数据流覆盖。追踪芯片技术使公民无所遁形，隐私成为稀缺资源。贫富差距加剧，反抗者转入地下。',
    severity: 'hard', validated: true,
    relatedScenes: ['s1', 's2', 's3', 's4', 's5', 's6'],
  },
  {
    id: 'wr-02', type: 'setting', typeLabel: '背景设定',
    title: '企业极权与地下世界',
    description: '大型企业掌握核心监控技术，实质上控制城市运转。地下酒吧和暗巷是反抗者的聚集地。两个世界通过数据黑市连接。',
    severity: 'hard', validated: true,
    relatedScenes: ['s2', 's3', 's6'],
  },
  {
    id: 'wr-03', type: 'character_constraint', typeLabel: '角色约束',
    title: '艾拉——冷静专业的侦探',
    description: '艾拉始终保持冷静和理性，即使在极端压力下也不会情绪失控。她的银色义眼是她唯一的身体改造，其余保持人类原貌。她绝不主动伤害无辜。',
    severity: 'hard', validated: true,
    relatedCharacters: ['c1'],
  },
  {
    id: 'wr-04', type: 'character_constraint', typeLabel: '角色约束',
    title: '线人——不可靠的情报源',
    description: '线人的信息永远不是 100% 准确的。他有自己的目的，会在关键时刻根据自身利益做出选择，而非帮助艾拉。他的真实身份在主线中不会完全揭露。',
    severity: 'hard', validated: true,
    relatedCharacters: ['c2'],
  },
  {
    id: 'wr-05', type: 'permanent_rule', typeLabel: '永久规则',
    title: '选择必须有代价',
    description: '每个重要选择都必须有实质性的后果差异。不允许出现"选择 A 和选择 B 最终到达同一个结果"的情况。每条分支路径必须提供独特的叙事体验。',
    severity: 'hard', validated: true,
  },
  {
    id: 'wr-06', type: 'permanent_rule', typeLabel: '永久规则',
    title: '潜行值决定命运',
    description: '潜行值是贯穿全剧的核心变量。玩家的每一次潜行相关选择都会影响最终判定。潜行值低于 60 时触发暴露路线，这是不可逆的命运转折。',
    severity: 'hard', validated: true,
  },
  {
    id: 'wr-07', type: 'narrative_taboo', typeLabel: '叙事禁忌',
    title: '禁止廉价反转',
    description: '不允许在最后一章引入之前从未铺垫的新角色或新设定来制造反转。所有反转必须在前面章节中有伏笔。伏笔回收率必须 ≥ 80%。',
    severity: 'hard', validated: true,
  },
  {
    id: 'wr-08', type: 'narrative_taboo', typeLabel: '叙事禁忌',
    title: '禁止 OOC（Out of Character）',
    description: '角色行为必须符合其已建立的性格特征。如果角色需要在特定情境下做出反常行为，必须给出充分的叙事理由（如极端压力、信息误导、被操控等）。',
    severity: 'hard', validated: true,
    relatedCharacters: ['c1', 'c2', 'c3'],
  },
  {
    id: 'wr-09', type: 'tension_check', typeLabel: '张力校验',
    title: '情绪节奏不能持续高张力',
    description: '连续两个以上高张力节点（情绪值 ≥ 8）后，必须安排一个缓冲节点（情绪值 ≤ 5），让玩家有喘息空间。否则会导致情绪疲劳。',
    severity: 'soft', validated: true,
  },
  {
    id: 'wr-10', type: 'tension_check', typeLabel: '张力校验',
    title: '每个结局必须有情感收束',
    description: '好结局不能纯粹是"成功"，必须包含代价或遗憾。坏结局不能纯粹是"失败"，必须包含希望或教训。避免情绪单一化。',
    severity: 'soft', validated: false,
  },
];

// ── 互动点设计数据（P3-3）─────────────────────────────────────────────

export interface InteractionOption {
  label: string;
  consequence: string;
  variableEffect?: string;
  pathEffect?: string;
  longTermImpact?: string;
  visibleCondition?: string;
}

export interface InteractionPoint {
  id: string;
  name: string;
  nodeId: string;
  chapterId: string;
  playerIntent: string;
  options: InteractionOption[];
  feedback: string;
  failureFeedback?: string;
  emotionIntensity: number;   // 1-10
  narrativePurpose: string;
  tested: boolean;
  visibleCondition?: string;
}

export const INTERACTION_POINTS: InteractionPoint[] = [
  {
    id: 'ip-01', name: '门前抉择', nodeId: 'N01', chapterId: 'ch0',
    playerIntent: '决定艾拉接近目标的方式——直接行动还是谨慎观察',
    options: [
      { label: '推门进入', consequence: '直接进入任务简报，节奏紧凑', pathEffect: '主路线' },
      { label: '先观察环境', consequence: '获取线人位置信息，建立初步信任', variableEffect: 'trust_lineman +5', longTermImpact: '后续线人对话中多一条信息线索' },
    ],
    feedback: '艾拉做出选择，向锈迹斑斑的门走去。',
    emotionIntensity: 3,
    narrativePurpose: '建立玩家与角色的第一次互动，定义玩家风格（冲动型 vs 谨慎型）',
    tested: true,
  },
  {
    id: 'ip-02', name: '信任判定', nodeId: 'N02', chapterId: 'ch1',
    playerIntent: '决定是否信任反复失约的线人——这是全剧核心信任体系的起点',
    options: [
      { label: '相信线人，一起行动', consequence: '信任值大幅提升，进入合作路线', variableEffect: 'trust_lineman +20', pathEffect: '合作路线', longTermImpact: '线人在关键时刻会回报信任' },
      { label: '保持怀疑，独自调查', consequence: '信任值下降，进入独行路线', variableEffect: 'trust_lineman -10', pathEffect: '独行路线', longTermImpact: '线人可能在后期背叛或消失' },
    ],
    feedback: '艾拉注视着线人的眼睛，试图从他的表情中读出真相。',
    emotionIntensity: 5,
    narrativePurpose: '核心信任体系的起点，影响后续所有与线人相关的剧情走向',
    tested: true,
  },
  {
    id: 'ip-03', name: '路线选择', nodeId: 'N03', chapterId: 'ch2',
    playerIntent: '选择渗透方式——潜行（低风险低回报）还是伪装渗透（高风险高回报）',
    options: [
      { label: '暗夜通道潜行', consequence: '通过地下管道接近目标，安全但缓慢', variableEffect: 'stealth_score +15', pathEffect: '路线A' },
      { label: '换装渗透大厦', consequence: '伪装成企业员工直接渗入，快速但危险', variableEffect: 'alert_level +10', pathEffect: '路线B', longTermImpact: '路线B会触发更多后续遭遇' },
    ],
    feedback: '艾拉确认了路线，深吸一口气，开始行动。',
    emotionIntensity: 6,
    narrativePurpose: '决定第二幕的核心体验风格——潜行 vs 渗透',
    tested: true,
  },
  {
    id: 'ip-04', name: 'QTE 反应', nodeId: 'N06', chapterId: 'ch2',
    playerIntent: '在警卫逼近的紧急时刻快速反应——用道具智取还是强行突破',
    options: [
      { label: '使用 EMP 手雷', consequence: '瘫痪警卫通讯，安全通过', variableEffect: 'stealth_score +20', longTermImpact: 'EMP 使用后不可再用' },
      { label: '强行突破', consequence: '触发警报，进入高风险逃亡', variableEffect: 'stealth_score -30', pathEffect: '进入暴露路线' },
    ],
    feedback: '时间仿佛凝固——艾拉必须在 1.5 秒内做出决定。',
    failureFeedback: '反应过慢！警卫已经发现异常，警报声刺耳响起。',
    emotionIntensity: 9,
    narrativePurpose: '全剧情绪高潮点，QTE 机制的紧张体验',
    tested: false,
  },
  {
    id: 'ip-05', name: '潜行条件判定', nodeId: 'N07', chapterId: 'ch2',
    playerIntent: '系统根据累积的潜行值自动判定——命运由之前的选择决定',
    options: [
      { label: '潜行值 ≥ 60 → 成功通过', consequence: '安全进入数据中心，获取核心证据', pathEffect: '进入好结局路线' },
      { label: '潜行值 < 60 → 暴露被捕', consequence: '警报触发，进入逃亡路线', pathEffect: '进入坏结局路线' },
    ],
    feedback: '系统扫描通过——身份未被识别。',
    failureFeedback: '（待补充——当前缺失失败反馈文案）',
    visibleCondition: 'stealth_score 累计值',
    emotionIntensity: 8,
    narrativePurpose: '命运转折点——之前所有选择的汇总检验',
    tested: false,
  },
];

// ── 制作管线阶段数据（P3-1）─────────────────────────────────────────────

export interface PipelineStage {
  id: string;
  order: number;
  name: string;
  description: string;
  icon: string;           // emoji
  status: 'completed' | 'active' | 'upcoming' | 'blocked';
  progress: number;       // 0-100
  artifacts: string[];    // 已产出物
  issues: string[];       // 当前问题
  nextAction: string;     // 下一步操作提示
  requiresHumanConfirm: boolean;
  linkedPage?: string;    // 关联页面路由
}

export const PIPELINE_STAGES: PipelineStage[] = [
  {
    id: 'stage-01', order: 1, name: '项目创建',
    description: '设定项目类型、题材、目标时长与互动规格',
    icon: '📋', status: 'completed', progress: 100,
    artifacts: ['项目配置', '基础信息'],
    issues: [],
    nextAction: '已完成',
    requiresHumanConfirm: false,
    linkedPage: '/settings',
  },
  {
    id: 'stage-02', order: 2, name: '素材导入与解构',
    description: '导入小说/故事，AI 提取角色、场景、道具、事件',
    icon: '📥', status: 'completed', progress: 100,
    artifacts: ['故事大纲', '角色设定 3 位', '场景设定 6 处', '道具设定 9 件'],
    issues: [],
    nextAction: '已完成',
    requiresHumanConfirm: true,
    linkedPage: '/parse',
  },
  {
    id: 'stage-03', order: 3, name: '世界观与叙事规则',
    description: '确定故事主题、角色约束、世界规则与叙事禁忌',
    icon: '🌍', status: 'completed', progress: 100,
    artifacts: ['时代背景', '核心冲突', '主要场景', '关键道具', '故事主题'],
    issues: [],
    nextAction: '已完成',
    requiresHumanConfirm: true,
    linkedPage: '/parse',
  },
  {
    id: 'stage-04', order: 4, name: '章纲规划',
    description: '生成线性章节规划，定义每章主题、情绪弧与事件',
    icon: '📝', status: 'completed', progress: 85,
    artifacts: ['7 个剧本 Block', '章节事件列表'],
    issues: ['分支点标记待完善'],
    nextAction: '进入剧本编辑页面完善章节细节',
    requiresHumanConfirm: true,
    linkedPage: '/script',
  },
  {
    id: 'stage-05', order: 5, name: '线性剧本',
    description: '将章纲扩写为完整线性剧本：对白、场景、旁白、动作',
    icon: '📖', status: 'completed', progress: 100,
    artifacts: ['场景描述 7 段', '对白 7 段', '旁白 7 段'],
    issues: [],
    nextAction: '已完成',
    requiresHumanConfirm: false,
    linkedPage: '/script',
  },
  {
    id: 'stage-06', order: 6, name: '互动叙事设计',
    description: '在剧本中标记互动点：选择、分支、变量、结局',
    icon: '🎭', status: 'active', progress: 65,
    artifacts: ['叙事意图 11 个', '情绪曲线', '变量关联 4 个'],
    issues: ['N07 潜行判定缺少失败反馈', 'QTE 节点缺详细配置'],
    nextAction: '前往节点图完善互动设计意图与失败反馈',
    requiresHumanConfirm: true,
    linkedPage: '/nodes',
  },
  {
    id: 'stage-07', order: 7, name: '变量与交互机制',
    description: '配置变量系统、QTE、Hotspot 等交互机制',
    icon: '⚙️', status: 'active', progress: 50,
    artifacts: ['潜行值', '警戒值', '信任值', '真相值'],
    issues: ['变量未配置详细范围', 'QTE 缺可视化编辑器', '无 Hotspot 配置'],
    nextAction: '完善变量范围和 QTE 交互配置',
    requiresHumanConfirm: false,
    linkedPage: '/nodes',
  },
  {
    id: 'stage-08', order: 8, name: '节点图谱与路径',
    description: '生成节点图，验证路径连通性与结构完整性',
    icon: '🗺️', status: 'active', progress: 75,
    artifacts: ['11 个节点', '11 条连线', '2 条分支路径', '2 个结局'],
    issues: ['节点类型筛选已完成，高级诊断模式待开发'],
    nextAction: '验证所有路径可达性',
    requiresHumanConfirm: false,
    linkedPage: '/nodes',
  },
  {
    id: 'stage-09', order: 9, name: '资产生成与管理',
    description: '按节点需求生成图片、BGM、音效、视频等资产',
    icon: '🎨', status: 'active', progress: 40,
    artifacts: ['场景图片 7/9', '角色立绘 1/3'],
    issues: ['9 个节点 BGM 全部缺失', 'N06/N09 缺图片', '反派主管立绘缺失'],
    nextAction: '前往资产库补齐缺失 BGM 和图片',
    requiresHumanConfirm: false,
    linkedPage: '/assets',
  },
  {
    id: 'stage-10', order: 10, name: '演出预览与试玩',
    description: '以玩家视角试玩完整流程，验证体验质量',
    icon: '🎬', status: 'upcoming', progress: 20,
    artifacts: ['可玩预览已就绪'],
    issues: ['尚未完成完整路径试玩'],
    nextAction: '前往试玩页面跑完至少一条完整路径',
    requiresHumanConfirm: false,
    linkedPage: '/simulator',
  },
  {
    id: 'stage-11', order: 11, name: '质检与修复',
    description: '运行 16 项质检，修复阻塞发布的问题',
    icon: '🔍', status: 'upcoming', progress: 60,
    artifacts: ['16 项质检已完成', '结构维度 5/5 通过', '叙事维度 4/5 通过'],
    issues: ['N07 失败反馈缺失', 'BGM 全覆盖未达标', '试玩未通过'],
    nextAction: '修复 3 项阻塞发布的质检问题',
    requiresHumanConfirm: false,
    linkedPage: '/overview',
  },
  {
    id: 'stage-12', order: 12, name: '发布与版本管理',
    description: '创建版本快照，发布 H5 链接，管理版本历史',
    icon: '🚀', status: 'upcoming', progress: 30,
    artifacts: ['H5 链接已发布', 'v1.2.3 当前版本'],
    issues: ['BGM 缺失阻塞完整发布', '体验时长待验证'],
    nextAction: '补齐资产后创建发布版本',
    requiresHumanConfirm: true,
    linkedPage: '/publish',
  },
];

// ── 路径自动测试数据（P4-9）─────────────────────────────────────────────

export interface PathTestResult {
  pathId: string;
  pathLabel: string;
  nodes: string[];
  ending: string;
  endingType: 'good' | 'bad' | 'unknown';
  reachable: boolean;
  stuck: boolean;
  missingAssets: string[];
  variableErrors: string[];
  emptyDialogues: string[];
  totalDuration: number;  // 秒
  testTime: string;
  passed: boolean;
}

export const PATH_TEST_RESULTS: PathTestResult[] = [
  {
    pathId: 'path-a',
    pathLabel: '路线 A：暗夜潜行 → 成功',
    nodes: ['N01', 'N02', 'N03', 'N04', 'N06', 'N07', 'N08', 'N10'],
    ending: '幽灵归来',
    endingType: 'good',
    reachable: true,
    stuck: false,
    missingAssets: ['N06 缺少背景图片', 'N01-N10 全部缺少 BGM'],
    variableErrors: [],
    emptyDialogues: [],
    totalDuration: 480,
    testTime: '2026-06-02 15:30:00',
    passed: false,
  },
  {
    pathId: 'path-b',
    pathLabel: '路线 B：换装渗透 → 暴露',
    nodes: ['N01', 'N02', 'N03', 'N05', 'N06', 'N07', 'N09', 'N11'],
    ending: '今夜失败',
    endingType: 'bad',
    reachable: true,
    stuck: false,
    missingAssets: ['N06 缺少背景图片', 'N09 缺少背景图片', 'N01-N11 全部缺少 BGM'],
    variableErrors: ['N07 潜行值判定条件可能导致意外分支'],
    emptyDialogues: [],
    totalDuration: 420,
    testTime: '2026-06-02 15:30:00',
    passed: false,
  },
  {
    pathId: 'path-c',
    pathLabel: '路线 C：暗夜潜行 → QTE失败 → 暴露',
    nodes: ['N01', 'N02', 'N03', 'N04', 'N06', 'N07F', 'N09', 'N11'],
    ending: '今夜失败',
    endingType: 'bad',
    reachable: true,
    stuck: false,
    missingAssets: ['N06 缺少背景图片', 'N09 缺少背景图片'],
    variableErrors: [],
    emptyDialogues: ['N07F 失败反馈文案缺失'],
    totalDuration: 390,
    testTime: '2026-06-02 15:30:00',
    passed: false,
  },
  {
    pathId: 'path-d',
    pathLabel: '路线 D：换装渗透 → QTE成功 → 数据到手',
    nodes: ['N01', 'N02', 'N03', 'N05', 'N06', 'N07S', 'N08', 'N10'],
    ending: '幽灵归来',
    endingType: 'good',
    reachable: true,
    stuck: false,
    missingAssets: ['N06 缺少背景图片'],
    variableErrors: [],
    emptyDialogues: [],
    totalDuration: 510,
    testTime: '2026-06-02 15:30:00',
    passed: false,
  },
];

// ── QTE/Hotspot 配置数据（P4-11）─────────────────────────────────────────────

export type QTEOperationType = 'tap' | 'swipe' | 'hold' | 'sequence';

export interface QTEConfig {
  id: string;
  nodeId: string;
  name: string;
  triggerMoment: string;
  operationType: QTEOperationType;
  operationLabel: string;
  timeLimit: number;          // 秒
  successFeedback: string;
  failureFeedback: string;
  variableChanges: string[];
  failurePath: 'bad_ending' | 'alternate_path' | 'retry';
  difficulty: 'easy' | 'normal' | 'hard';
  tested: boolean;
}

export interface HotspotConfig {
  id: string;
  nodeId: string;
  name: string;
  positionX: number;          // 0-100 百分比
  positionY: number;
  size: 'small' | 'medium' | 'large';
  appearCondition?: string;
  clickFeedback: string;
  triggerScript: string;
  timed: boolean;
  timeLimit?: number;
  highlightOnHover: boolean;
  repeatable: boolean;
}

export const QTE_CONFIGS: QTEConfig[] = [
  {
    id: 'qte-01', nodeId: 'N06', name: '警卫逼近 QTE',
    triggerMoment: '警卫发现异常，开始搜查',
    operationType: 'tap', operationLabel: '快速点击',
    timeLimit: 1.5,
    successFeedback: 'EMP 手雷成功瘫痪警卫通讯，安全通过',
    failureFeedback: '反应过慢，警报触发',
    variableChanges: ['stealth_score +20（成功）', 'alert_level +50（失败）'],
    failurePath: 'alternate_path',
    difficulty: 'hard', tested: false,
  },
  {
    id: 'qte-02', nodeId: 'N07', name: '潜行判定',
    triggerMoment: '系统自动检查累积潜行值',
    operationType: 'hold', operationLabel: '长按蓄力',
    timeLimit: 3.0,
    successFeedback: '身份未被识别，安全进入数据中心',
    failureFeedback: '扫描器发现异常，身份暴露',
    variableChanges: ['stealth_score ≥ 60 → 成功'],
    failurePath: 'alternate_path',
    difficulty: 'normal', tested: false,
  },
  {
    id: 'qte-03', nodeId: 'N04', name: '通风管道潜入',
    triggerMoment: '进入狭窄通风管道',
    operationType: 'sequence', operationLabel: '按键序列',
    timeLimit: 5.0,
    successFeedback: '成功穿过通风管道，抵达目标区域',
    failureFeedback: '发出声响，引起警卫注意',
    variableChanges: ['stealth_score +10（成功）', 'alert_level +15（失败）'],
    failurePath: 'retry',
    difficulty: 'easy', tested: true,
  },
];

export const HOTSPOT_CONFIGS: HotspotConfig[] = [
  {
    id: 'hs-01', nodeId: 'N01', name: '锈门把手',
    positionX: 50, positionY: 60, size: 'medium',
    clickFeedback: '艾拉转动门把手，门缓缓打开',
    triggerScript: 'transition_to_N02',
    timed: false, highlightOnHover: true, repeatable: false,
  },
  {
    id: 'hs-02', nodeId: 'N02', name: '线人手中文件',
    positionX: 35, positionY: 45, size: 'small',
    clickFeedback: '线人递过一份加密文件，上面印着企业标志',
    triggerScript: 'show_clue_document',
    timed: false, highlightOnHover: true, repeatable: false,
  },
  {
    id: 'hs-03', nodeId: 'N05', name: '企业制服',
    positionX: 70, positionY: 30, size: 'large',
    appearCondition: 'alert_level < 50',
    clickFeedback: '艾拉换上企业制服，混入员工队伍',
    triggerScript: 'change_outfit_enterprise',
    timed: true, timeLimit: 10,
    highlightOnHover: true, repeatable: false,
  },
  {
    id: 'hs-04', nodeId: 'N08', name: '服务器终端',
    positionX: 50, positionY: 50, size: 'large',
    clickFeedback: '数据开始下载，进度条缓缓推进',
    triggerScript: 'download_evidence',
    timed: true, timeLimit: 8,
    highlightOnHover: true, repeatable: false,
  },
];

// ── 项目规格模板数据（P4-12）─────────────────────────────────────────────

export type ProjectType = 'novel_adaptation' | 'original_creation' | 'script_adaptation' | 'interactive_import';
export type TargetFormat = 'interactive_h5' | 'visual_novel' | 'interactive_drama' | 'narrative_game' | 'webgal' | 'mobile_h5';

export interface ProjectSpecTemplate {
  projectType: ProjectType;
  typeLabel: string;
  typeIcon: string;
  typeDescription: string;
  suggestedGenres: string[];
  suggestedDurations: { label: string; value: string }[];
  suggestedChapters: number[];
  suggestedInteractionDensity: { label: string; value: string }[];
  suggestedEndings: number[];
}

export const PROJECT_SPEC_TEMPLATES: ProjectSpecTemplate[] = [
  {
    projectType: 'novel_adaptation',
    typeLabel: '小说改编',
    typeIcon: '📚',
    typeDescription: '将已有小说或故事改编为互动影视游戏。系统会辅助解构故事、提取角色和场景、生成互动设计。',
    suggestedGenres: ['悬疑推理', '言情恋爱', '科幻冒险', '奇幻史诗', '都市情感', '赛博朋克'],
    suggestedDurations: [
      { label: '短篇（15-30 分钟）', value: 'short' },
      { label: '中篇（30-60 分钟）', value: 'medium' },
      { label: '长篇（60-120 分钟）', value: 'long' },
    ],
    suggestedChapters: [3, 5, 8, 12],
    suggestedInteractionDensity: [
      { label: '轻度（每章 1-2 个选择）', value: 'light' },
      { label: '中度（每章 3-5 个选择）', value: 'medium' },
      { label: '重度（每章 5+ 个选择）', value: 'heavy' },
    ],
    suggestedEndings: [2, 3, 5, 8],
  },
  {
    projectType: 'original_creation',
    typeLabel: '全新创作',
    typeIcon: '✨',
    typeDescription: '从零开始创作一个互动故事。AI 会辅助你构建世界观、设计角色、生成剧情框架。',
    suggestedGenres: ['悬疑推理', '恐怖惊悚', '恋爱模拟', '冒险探索', '历史架空', '日常治愈'],
    suggestedDurations: [
      { label: '短篇（15-30 分钟）', value: 'short' },
      { label: '中篇（30-60 分钟）', value: 'medium' },
      { label: '长篇（60-120 分钟）', value: 'long' },
    ],
    suggestedChapters: [3, 5, 8, 12, 20],
    suggestedInteractionDensity: [
      { label: '轻度（每章 1-2 个选择）', value: 'light' },
      { label: '中度（每章 3-5 个选择）', value: 'medium' },
      { label: '重度（每章 5+ 个选择）', value: 'heavy' },
    ],
    suggestedEndings: [2, 3, 5, 8, 12],
  },
  {
    projectType: 'script_adaptation',
    typeLabel: '剧本改编',
    typeIcon: '🎬',
    typeDescription: '将已有的影视剧本或舞台剧本改编为互动版本。保留核心对白，增加互动分支。',
    suggestedGenres: ['都市情感', '职场悬疑', '古装宫廷', '青春校园', '谍战特工'],
    suggestedDurations: [
      { label: '单集（20-40 分钟）', value: 'short' },
      { label: '迷你剧（3-5 集）', value: 'medium' },
      { label: '连续剧（8-12 集）', value: 'long' },
    ],
    suggestedChapters: [5, 8, 12, 20],
    suggestedInteractionDensity: [
      { label: '轻度（关键剧情点选择）', value: 'light' },
      { label: '中度（每场戏有选择）', value: 'medium' },
    ],
    suggestedEndings: [2, 3, 5],
  },
  {
    projectType: 'interactive_import',
    typeLabel: '导入互动脚本',
    typeIcon: '📦',
    typeDescription: '导入已有的互动脚本文件（WebGAL、Ren\'Py、自定义 JSON 格式），在平台上进行可视化管理。',
    suggestedGenres: ['不限题材'],
    suggestedDurations: [{ label: '保持原有长度', value: 'keep' }],
    suggestedChapters: [],
    suggestedInteractionDensity: [{ label: '保持原有设计', value: 'keep' }],
    suggestedEndings: [],
  },
];

// ── 行业通用化数据（P6-1）─────────────────────────────────────────────

export type IndustryType = 'game' | 'tourism' | 'education' | 'derivative';

export interface IndustryLabelMap {
  [key: string]: {
    game: string;
    tourism: string;
    education: string;
    derivative: string;
  };
}

// Map of underlying object names to industry-specific display names
export const INDUSTRY_LABELS: IndustryLabelMap = {
  node: { game: '剧情节点', tourism: '体验点', education: '学习环节', derivative: '剧情片段' },
  edge: { game: '路径连线', tourism: '游览路线', education: '学习路径', derivative: '剧情跳转' },
  choice: { game: '玩家选择', tourism: '参观者选择', education: '学生决策', derivative: '观众选择' },
  variable: { game: '状态变量', tourism: '探索进度', education: '掌握度', derivative: '剧情状态' },
  ending: { game: '结局', tourism: '体验结果', education: '学习反馈', derivative: '分支结局' },
  asset: { game: '游戏资产', tourism: '展品素材', education: '教学素材', derivative: '影视素材' },
  worldRules: { game: '世界规则', tourism: '史实边界', education: '知识边界', derivative: '原作设定' },
  qte: { game: 'QTE 交互', tourism: '点击互动', education: '实验操作', derivative: '互动镜头' },
  hotspot: { game: '热区交互', tourism: '展品探索', education: '答题触发', derivative: '线索点击' },
  chapter: { game: '章节', tourism: '展区', education: '课程单元', derivative: '剧集片段' },
  character: { game: '角色', tourism: '人物', education: '知识角色', derivative: '剧中人物' },
  scene: { game: '场景', tourism: '地点', education: '学习环境', derivative: '拍摄场景' },
  prop: { game: '道具', tourism: '展品', education: '教学工具', derivative: '关键物件' },
  pipeline: { game: '制作管线', tourism: '导览制作', education: '课程制作', derivative: '衍生制作' },
  simulator: { game: '演出预览', tourism: '体验预览', education: '学习预览', derivative: '互动预览' },
  publish: { game: '发布', tourism: '发布导览', education: '发布课程', derivative: '发布互动版' },
  overview: { game: '质检总览', tourism: '质检总览', education: '质检总览', derivative: '质检总览' },
  interaction: { game: '互动设计', tourism: '互动点设计', education: '学习互动', derivative: '分支设计' },
  script: { game: '剧本编辑', tourism: '体验文案', education: '学习内容', derivative: '剧情编辑' },
  parse: { game: '剧本解构', tourism: '资料解构', education: '课程解构', derivative: '素材解构' },
};

// ── 行业模板（P6-1）─────────────────────────────────────────────

export interface IndustryTemplate {
  industryType: IndustryType;
  label: string;
  icon: string;
  description: string;
  targetUsers: string;
  defaultObjects: string[];       // What objects this industry works with
  defaultInteractions: string[];  // What interaction types are common
  defaultPublishFormats: string[]; // How projects are published
  workflow: { step: string; description: string }[]; // Industry-specific workflow steps
}

export const INDUSTRY_TEMPLATES: IndustryTemplate[] = [
  {
    industryType: 'tourism',
    label: '文旅互动体验',
    icon: '🏛️',
    description: '将景区、展馆、历史人物、展品变成可玩的参观体验。适用于博物馆、景区、城市文旅、展陈公司。',
    targetUsers: '景区、博物馆、城市文旅、展陈公司',
    defaultObjects: ['地点', '展品', '历史人物', '事件', '路线', '任务点', '线索'],
    defaultInteractions: ['点击展品', '选择调查对象', '路线选择', '解谜', '打卡收集', '线索拼合'],
    defaultPublishFormats: ['H5 互动页面', '微信小程序', '馆内屏幕', '导览模式', 'AR 标记版'],
    workflow: [
      { step: '导入资料', description: '导入景区/展馆资料、历史文献、展品说明' },
      { step: '提取要素', description: 'AI 提取地点、人物、展品、历史事件' },
      { step: '建立边界', description: '确定史实边界、文化约束、事实校验规则' },
      { step: '规划路线', description: '设计参观动线、体验节奏、任务分布' },
      { step: '设计体验', description: '设计互动点：展品探索、路线选择、解谜任务' },
      { step: '绑定资产', description: '关联展品图片、历史照片、音频讲解、地图' },
      { step: '测试路线', description: '模拟游客动线，检查路线断点和体验时长' },
      { step: '发布导览', description: '发布 H5/小程序/馆内屏幕版本' },
    ],
  },
  {
    industryType: 'education',
    label: '互动教育课程',
    icon: '🎓',
    description: '将课程、知识点、案例变成可交互学习内容。适用于学校、培训机构、科普机构、企业培训。',
    targetUsers: '学校、培训机构、科普机构、企业培训',
    defaultObjects: ['知识点', '案例', '问题', '答案', '学习目标', '评价标准'],
    defaultInteractions: ['选择题', '情境决策', '实验模拟', '角色扮演', '分步推理'],
    defaultPublishFormats: ['课堂演示', '自学链接', '训练任务', 'SCORM 课件', '学习报告'],
    workflow: [
      { step: '导入课程', description: '导入教材、教案、课程大纲、题库' },
      { step: '提取知识点', description: 'AI 提取知识点、学习目标、能力维度' },
      { step: '设计情境', description: '构建学习情境、案例场景、角色任务' },
      { step: '生成互动', description: '生成选择题、情境决策、实验模拟' },
      { step: '配置测评', description: '设置评估变量、掌握度追踪、反馈规则' },
      { step: '生成报告', description: '配置学习报告模板和能力画像' },
      { step: '测试验证', description: '验证知识点覆盖、难度均衡、反馈完整' },
      { step: '发布课程', description: '发布课堂/自学/训练版本' },
    ],
  },
  {
    industryType: 'derivative',
    label: '互动短剧 / 内容衍生',
    icon: '🎬',
    description: '将已有短剧、真人剧、AI 视频资产改造成互动版本。适用于短剧公司、影视团队、AIGC 内容团队。',
    targetUsers: '短剧公司、影视团队、AIGC 内容团队',
    defaultObjects: ['剧集', '角色', '场景', '视频片段', '剧情转折', '结局'],
    defaultInteractions: ['观众选择', '分支插入', '隐藏剧情', '视角切换', '多结局'],
    defaultPublishFormats: ['互动短剧', 'H5 互动播放', '平台嵌入', '社交媒体短版'],
    workflow: [
      { step: '导入素材', description: '导入已有剧本、视频、分镜、角色素材' },
      { step: '识别结构', description: 'AI 识别剧情结构、关键转折、高潮点' },
      { step: '找互动点', description: '标记可插入互动选择的关键节点' },
      { step: '生成分支', description: '设计分支剧情和多结局' },
      { step: '复用资产', description: '评估现有素材覆盖率和新增资产需求' },
      { step: '补齐资产', description: '生成/拍摄新增分支所需素材' },
      { step: '测试路径', description: '测试所有分支路径和结局可达性' },
      { step: '发布互动版', description: '发布互动短剧/H5/平台嵌入版本' },
    ],
  },
  {
    industryType: 'game',
    label: '互动叙事游戏',
    icon: '🎮',
    description: '设计复杂剧情、任务线、变量、结局，并接入游戏引擎。适用于独立游戏、游戏工作室、专业编剧。',
    targetUsers: '独立游戏开发者、游戏工作室、专业编剧',
    defaultObjects: ['角色', '任务', '道具', '变量', '条件', '节点', '结局', '关卡'],
    defaultInteractions: ['选择', 'QTE', 'Hotspot', '解谜', '战斗剧情', '任务分支'],
    defaultPublishFormats: ['WebGAL 脚本', 'JSON 数据', 'Ren\'Py 脚本', '引擎导出', 'H5 包'],
    workflow: [
      { step: '项目创建', description: '设定项目类型、题材、目标时长与互动规格' },
      { step: '素材导入', description: '导入小说/故事，AI 提取角色、场景、道具' },
      { step: '世界规则', description: '确定世界观、角色约束、叙事规则' },
      { step: '章纲规划', description: '生成章节规划，定义主题、情绪弧、事件' },
      { step: '剧本编写', description: '编写完整线性剧本：对白、场景、旁白' },
      { step: '互动设计', description: '标记互动点：选择、分支、变量、结局' },
      { step: '变量配置', description: '配置变量系统、QTE、Hotspot 机制' },
      { step: '节点验证', description: '验证节点图连通性和路径完整性' },
      { step: '资产管理', description: '生成/管理图片、BGM、音效、视频' },
      { step: '演出预览', description: '以玩家视角试玩完整流程' },
      { step: '质检修复', description: '运行质检，修复阻塞发布的问题' },
      { step: '发布导出', description: '创建版本快照，发布/导出到目标平台' },
    ],
  },
];

// ── 行业质检规则（P6-1）─────────────────────────────────────────────

export interface IndustryQCRule {
  id: string;
  industryType: IndustryType;
  category: string;
  label: string;
  description: string;
  severity: 'block' | 'warn' | 'info';
}

export const INDUSTRY_QC_RULES: IndustryQCRule[] = [
  // 文旅质检
  { id: 'tqc-01', industryType: 'tourism', category: '史实校验', label: '史实冲突检测', description: '检查体验文案是否与已知历史事实矛盾', severity: 'block' },
  { id: 'tqc-02', industryType: 'tourism', category: '路线完整性', label: '路线断点检测', description: '检查参观路线是否存在无法到达的展区', severity: 'block' },
  { id: 'tqc-03', industryType: 'tourism', category: '资产覆盖', label: '展品素材覆盖', description: '检查每个展品互动点是否都有关联素材', severity: 'warn' },
  { id: 'tqc-04', industryType: 'tourism', category: '体验时长', label: '讲解时长超标', description: '单个体验点文字量是否超过游客耐心阈值', severity: 'warn' },
  { id: 'tqc-05', industryType: 'tourism', category: '文化合规', label: '文化敏感词检测', description: '检查是否存在文化敏感或不当表达', severity: 'block' },
  { id: 'tqc-06', industryType: 'tourism', category: '地理校验', label: '地理位置冲突', description: '检查路线中的地理位置是否与实际一致', severity: 'warn' },
  // 教育质检
  { id: 'eqc-01', industryType: 'education', category: '知识覆盖', label: '知识点遗漏检测', description: '检查是否所有学习目标都有对应的互动环节', severity: 'block' },
  { id: 'eqc-02', industryType: 'education', category: '内容正确性', label: '答案正确性校验', description: '检查选择题答案是否准确无误', severity: 'block' },
  { id: 'eqc-03', industryType: 'education', category: '反馈完整性', label: '错误反馈缺失', description: '检查每个错误选项是否有解释性反馈', severity: 'warn' },
  { id: 'eqc-04', industryType: 'education', category: '难度均衡', label: '难度梯度检测', description: '检查知识点难度是否从低到高递进', severity: 'info' },
  { id: 'eqc-05', industryType: 'education', category: '评估维度', label: '评估维度覆盖', description: '检查是否覆盖知识/技能/判断力等多维评估', severity: 'info' },
  { id: 'eqc-06', industryType: 'education', category: '学习路径', label: '学习路径完整性', description: '检查所有学习路径是否都有明确的反馈结果', severity: 'warn' },
  // 衍生质检
  { id: 'dqc-01', industryType: 'derivative', category: '资产复用', label: '素材缺口率', description: '评估现有素材对新分支的覆盖率和新增成本', severity: 'warn' },
  { id: 'dqc-02', industryType: 'derivative', category: '叙事连贯', label: '分支连贯性', description: '检查分支剧情是否与主线叙事连贯', severity: 'block' },
  { id: 'dqc-03', industryType: 'derivative', category: '设定一致', label: '角色设定冲突', description: '检查分支中角色行为是否与原作设定矛盾', severity: 'block' },
  { id: 'dqc-04', industryType: 'derivative', category: '风格一致', label: '原作风格偏离', description: '检查新增内容是否与原作风格基调一致', severity: 'warn' },
  { id: 'dqc-05', industryType: 'derivative', category: '成本评估', label: '新增资产成本', description: '估算完成所有分支需要新增的素材数量和成本', severity: 'info' },
  { id: 'dqc-06', industryType: 'derivative', category: '视频覆盖', label: '视频素材缺口', description: '检查哪些分支节点缺少对应的视频片段', severity: 'warn' },
];

// ── 行业资产类型（P6-1）─────────────────────────────────────────────

export interface IndustryAssetType {
  industryType: IndustryType;
  assetTypes: { key: string; label: string; icon: string }[];
}

export const INDUSTRY_ASSET_TYPES: IndustryAssetType[] = [
  {
    industryType: 'game',
    assetTypes: [
      { key: 'image', label: '场景图片', icon: '🖼️' },
      { key: 'character', label: '角色立绘', icon: '👤' },
      { key: 'bgm', label: 'BGM', icon: '🎵' },
      { key: 'sfx', label: '音效', icon: '🔊' },
      { key: 'voice', label: '语音', icon: '🎙️' },
      { key: 'video', label: '视频', icon: '🎬' },
      { key: 'ui', label: 'UI 素材', icon: '🎨' },
    ],
  },
  {
    industryType: 'tourism',
    assetTypes: [
      { key: 'exhibit_photo', label: '展品照片', icon: '🏺' },
      { key: 'history_photo', label: '历史照片', icon: '📜' },
      { key: 'map', label: '地图', icon: '🗺️' },
      { key: 'audio_guide', label: '音频讲解', icon: '🎧' },
      { key: 'qr_code', label: '二维码', icon: '📱' },
      { key: 'ar_marker', label: 'AR 标记', icon: '👓' },
      { key: 'video', label: '介绍视频', icon: '🎬' },
    ],
  },
  {
    industryType: 'education',
    assetTypes: [
      { key: 'courseware', label: '课件', icon: '📊' },
      { key: 'animation', label: '动画', icon: '🎞️' },
      { key: 'quiz_image', label: '题目截图', icon: '📝' },
      { key: 'experiment', label: '实验图', icon: '🔬' },
      { key: 'mindmap', label: '思维导图', icon: '🧠' },
      { key: 'knowledge_card', label: '知识卡片', icon: '🃏' },
      { key: 'video', label: '教学视频', icon: '🎬' },
    ],
  },
  {
    industryType: 'derivative',
    assetTypes: [
      { key: 'video_clip', label: '视频片段', icon: '🎞️' },
      { key: 'storyboard', label: '分镜图', icon: '🖼️' },
      { key: 'film_still', label: '成片截图', icon: '📸' },
      { key: 'character_poster', label: '角色海报', icon: '🎭' },
      { key: 'promo', label: '宣传物料', icon: '📢' },
      { key: 'bgm', label: '配乐', icon: '🎵' },
      { key: 'subtitle', label: '字幕文件', icon: '💬' },
    ],
  },
];

// ── 多主角叙事时间线（P7-7）─────────────────────────────────────────────

export type CharacterStatus = 'alive' | 'injured' | 'missing' | 'captured' | 'betrayed' | 'dead';

export interface CharacterTimelineEvent {
  id: string;
  chapterId: string;
  nodeIds: string[];
  eventTitle: string;
  description: string;
  statusChange?: { from: CharacterStatus; to: CharacterStatus };
  choiceMade?: string;
  impactOnOthers?: { characterId: string; effect: string }[];
}

export interface CharacterTimeline {
  characterId: string;
  characterName: string;
  color: string;
  status: CharacterStatus;
  storyArc: string;           // e.g., "从怀疑到信任的救赎之路"
  chapters: string[];          // which chapters this character appears in
  events: CharacterTimelineEvent[];
  relationships: { targetId: string; type: string; strength: number }[]; // -100 to 100
}

export const CHARACTER_TIMELINES: CharacterTimeline[] = [
  {
    characterId: 'c1', characterName: '艾拉', color: '#5E50E8',
    status: 'alive',
    storyArc: '从疲惫的侦探到真相的守护者',
    chapters: ['ch0', 'ch1', 'ch2'],
    events: [
      { id: 'ct-e1', chapterId: 'ch0', nodeIds: ['N01', 'N02'], eventTitle: '深夜接头', description: '追踪中断信号抵达接头地点，与线人会面', statusChange: undefined, choiceMade: '推门进入' },
      { id: 'ct-e2', chapterId: 'ch1', nodeIds: ['N02', 'N03'], eventTitle: '信任抉择', description: '面对线人的警告，决定是否信任这个反复失约的人', choiceMade: '相信线人', impactOnOthers: [{ characterId: 'c2', effect: '线人获得信任，后续提供更多情报' }] },
      { id: 'ct-e3', chapterId: 'ch2', nodeIds: ['N04', 'N06'], eventTitle: '潜入行动', description: '选择暗夜通道潜入企业大厦，遭遇警卫巡逻', statusChange: { from: 'alive', to: 'alive' } },
      { id: 'ct-e4', chapterId: 'ch2', nodeIds: ['N07', 'N08'], eventTitle: '命运判定', description: '根据累积潜行值判定是否成功潜入数据中心', choiceMade: '由系统变量决定' },
      { id: 'ct-e5', chapterId: 'ch2', nodeIds: ['N10'], eventTitle: '幽灵归来', description: '带着核心证据安全撤离，消失在霓虹夜幕中' },
    ],
    relationships: [
      { targetId: 'c2', type: '信任/合作', strength: 65 },
      { targetId: 'c3', type: '对抗/追踪', strength: -80 },
    ],
  },
  {
    characterId: 'c2', characterName: '线人', color: '#D97706',
    status: 'alive',
    storyArc: '在自保与良知之间摇摆的灰色角色',
    chapters: ['ch0', 'ch1'],
    events: [
      { id: 'ct-f1', chapterId: 'ch0', nodeIds: ['N02'], eventTitle: '传递警告', description: '告知艾拉追踪芯片已被发现，催促她做出选择' },
      { id: 'ct-f2', chapterId: 'ch1', nodeIds: ['N02', 'N03'], eventTitle: '接受或失去信任', description: '根据艾拉的选择，获得更多的信任或被疏远', choiceMade: '取决于玩家选择', impactOnOthers: [{ characterId: 'c1', effect: '影响艾拉后续可获得的情报量' }] },
    ],
    relationships: [
      { targetId: 'c1', type: '被信任/被怀疑', strength: 40 },
      { targetId: 'c3', type: '恐惧/隐藏', strength: -60 },
    ],
  },
  {
    characterId: 'c3', characterName: '反派主管', color: '#DC2626',
    status: 'alive',
    storyArc: '冷酷的企业权力代言人，真相的守门人',
    chapters: ['ch2'],
    events: [
      { id: 'ct-g1', chapterId: 'ch2', nodeIds: ['N05', 'N06'], eventTitle: '安保部署', description: '发现异常后加强大厦安保巡逻，部署警卫力量', impactOnOthers: [{ characterId: 'c1', effect: '增加艾拉潜入难度' }] },
      { id: 'ct-g2', chapterId: 'ch2', nodeIds: ['N09'], eventTitle: '全息现身', description: '在艾拉被捕后通过全息投影出现，宣告胜利' },
    ],
    relationships: [
      { targetId: 'c1', type: '追捕/对抗', strength: -90 },
      { targetId: 'c2', type: '搜寻/威胁', strength: -70 },
    ],
  },
];

// Cross-character impact matrix
export interface CrossCharacterEffect {
  id: string;
  sourceCharacterId: string;
  sourceEvent: string;       // event description
  sourceNodeId: string;
  targetCharacterId: string;
  effectType: 'help' | 'harm' | 'info' | 'betrayal' | 'ignore';
  effectDescription: string;
  delayed: boolean;          // whether effect is immediate or delayed
  triggerChapter?: string;   // if delayed, when does it trigger
}

export const CROSS_CHARACTER_EFFECTS: CrossCharacterEffect[] = [
  { id: 'cce-01', sourceCharacterId: 'c1', sourceEvent: '选择信任线人', sourceNodeId: 'N02', targetCharacterId: 'c2', effectType: 'help', effectDescription: '线人获得信任，在 N08 主动提供关键情报', delayed: true, triggerChapter: 'ch2' },
  { id: 'cce-02', sourceCharacterId: 'c1', sourceEvent: '怀疑线人', sourceNodeId: 'N02', targetCharacterId: 'c2', effectType: 'harm', effectDescription: '线人信任降低，在关键时刻可能不提供帮助', delayed: true, triggerChapter: 'ch2' },
  { id: 'cce-03', sourceCharacterId: 'c3', sourceEvent: '加强安保部署', sourceNodeId: 'N05', targetCharacterId: 'c1', effectType: 'harm', effectDescription: '警卫密度增加，潜行判定难度提升', delayed: false },
  { id: 'cce-04', sourceCharacterId: 'c2', sourceEvent: '提供EMP手雷情报', sourceNodeId: 'N02', targetCharacterId: 'c1', effectType: 'info', effectDescription: '获得EMP手雷使用方法，QTE成功率提升', delayed: true, triggerChapter: 'ch2' },
  { id: 'cce-05', sourceCharacterId: 'c1', sourceEvent: '成功获取数据', sourceNodeId: 'N08', targetCharacterId: 'c3', effectType: 'harm', effectDescription: '反派主管的监控计划被揭露，权力基础动摇', delayed: true },
];

// ── 叙事状态机（P7-8）─────────────────────────────────────────────

export type StateCategory = 'character' | 'relationship' | 'world' | 'plot';
export type StateValueType = 'enum' | 'numeric' | 'boolean';

export interface NarrativeState {
  id: string;
  category: StateCategory;
  categoryLabel: string;
  name: string;
  valueType: StateValueType;
  // For enum type
  enumValues?: string[];
  currentValue?: string;
  // For numeric type
  minValue?: number;
  maxValue?: number;
  numericValue?: number;
  // For boolean type
  boolValue?: boolean;
  description: string;
  modifiedAt: string[];     // nodeIds where this state changes
  readAt: string[];         // nodeIds where this state is checked
  dependsOn?: string[];     // other state IDs this state depends on
  affectsEndings?: string[]; // which endings this state can influence
}

export const NARRATIVE_STATES: NarrativeState[] = [
  // 角色状态
  { id: 'ns-01', category: 'character', categoryLabel: '角色状态', name: '艾拉存活状态', valueType: 'enum', enumValues: ['存活', '受伤', '失踪', '被捕', '死亡'], currentValue: '存活', description: '艾拉当前的身体和自由状态', modifiedAt: ['N06', 'N07', 'N09'], readAt: ['N07', 'N10', 'N11'], affectsEndings: ['GOOD', 'BAD'] },
  { id: 'ns-02', category: 'character', categoryLabel: '角色状态', name: '线人存活状态', valueType: 'enum', enumValues: ['活跃', '隐藏', '被捕', '死亡'], currentValue: '活跃', description: '线人当前的状态', modifiedAt: ['N03'], readAt: ['N08'], dependsOn: ['ns-04'] },
  { id: 'ns-03', category: 'character', categoryLabel: '角色状态', name: '反派主管警觉度', valueType: 'numeric', minValue: 0, maxValue: 100, numericValue: 30, description: '反派主管对异常情况的警觉程度', modifiedAt: ['N05', 'N06'], readAt: ['N07', 'N09'] },
  // 关系状态
  { id: 'ns-04', category: 'relationship', categoryLabel: '关系状态', name: '艾拉-线人信任', valueType: 'enum', enumValues: ['完全信任', '基本信任', '怀疑', '敌对', '断绝'], currentValue: '基本信任', description: '艾拉对线人的信任程度', modifiedAt: ['N02', 'N03'], readAt: ['N07', 'N08'], affectsEndings: ['GOOD'] },
  { id: 'ns-05', category: 'relationship', categoryLabel: '关系状态', name: '艾拉-反派对立', valueType: 'enum', enumValues: ['未知', '暗中对抗', '公开对抗', '追捕中'], currentValue: '暗中对抗', description: '艾拉与反派主管的关系状态', modifiedAt: ['N05', 'N09'], readAt: ['N09', 'N11'] },
  // 世界状态
  { id: 'ns-06', category: 'world', categoryLabel: '世界状态', name: '城市安保等级', valueType: 'enum', enumValues: ['正常', '加强', '戒严', '封锁'], currentValue: '加强', description: '企业控制下的城市安保状态', modifiedAt: ['N05', 'N06', 'N07'], readAt: ['N07', 'N09'] },
  { id: 'ns-07', category: 'world', categoryLabel: '世界状态', name: '舆论态势', valueType: 'enum', enumValues: ['平静', '暗流涌动', '发酵', '爆发'], currentValue: '平静', description: '公众对企业监控的态度', modifiedAt: ['N08'], readAt: ['N10'], affectsEndings: ['GOOD'] },
  { id: 'ns-08', category: 'world', categoryLabel: '世界状态', name: 'EMP 可用状态', valueType: 'boolean', boolValue: true, description: 'EMP手雷是否仍然可用（一次性道具）', modifiedAt: ['N06'], readAt: ['N06'] },
  // 剧情状态
  { id: 'ns-09', category: 'plot', categoryLabel: '剧情状态', name: '证据链完整度', valueType: 'numeric', minValue: 0, maxValue: 100, numericValue: 20, description: '已收集的企业非法证据完整程度', modifiedAt: ['N02', 'N08'], readAt: ['N10'], affectsEndings: ['GOOD'] },
  { id: 'ns-10', category: 'plot', categoryLabel: '剧情状态', name: '身份暴露', valueType: 'boolean', boolValue: false, description: '艾拉的潜入身份是否已被识破', modifiedAt: ['N06', 'N07'], readAt: ['N07', 'N09'], dependsOn: ['ns-01', 'ns-06'], affectsEndings: ['BAD'] },
  { id: 'ns-11', category: 'plot', categoryLabel: '剧情状态', name: '隐藏路线开启', valueType: 'boolean', boolValue: false, description: '是否存在隐藏的第三条路线（高难度解锁）', modifiedAt: [], readAt: [], dependsOn: ['ns-04', 'ns-09'] },
];

// ── 选择后果追踪链（P7-9）─────────────────────────────────────────────

export type ConsequenceTiming = 'immediate' | 'delayed' | 'ending';

export interface ConsequenceChain {
  id: string;
  sourceNodeId: string;
  sourceChoiceLabel: string;
  timing: ConsequenceTiming;
  timingLabel: string;        // human-readable timing description
  affectedNodeIds: string[];  // where the consequence manifests
  affectedStates: string[];   // which narrative states are affected
  affectedCharacters: string[]; // which characters are impacted
  description: string;        // what happens as a result
  visualColor: string;        // for UI: green=immediate, yellow=delayed, red=ending
  resolved: boolean;          // whether this consequence has been "paid off" in the story
  payoffNodeId?: string;      // where the consequence is finally resolved
}

export const CONSEQUENCE_CHAINS: ConsequenceChain[] = [
  { id: 'cc-01', sourceNodeId: 'N01', sourceChoiceLabel: '推门进入', timing: 'immediate', timingLabel: '即时反馈', affectedNodeIds: ['N02'], affectedStates: [], affectedCharacters: ['c1'], description: '艾拉直接进入酒吧，节奏更快，错过额外情报', visualColor: '#22C55E', resolved: true, payoffNodeId: 'N02' },
  { id: 'cc-02', sourceNodeId: 'N01', sourceChoiceLabel: '先观察环境', timing: 'immediate', timingLabel: '即时反馈', affectedNodeIds: ['N02'], affectedStates: ['ns-04'], affectedCharacters: ['c1', 'c2'], description: '获得线人位置信息，信任值 +5，后续对话多一条线索', visualColor: '#22C55E', resolved: true, payoffNodeId: 'N02' },
  { id: 'cc-03', sourceNodeId: 'N02', sourceChoiceLabel: '相信线人', timing: 'delayed', timingLabel: '延迟影响（第二章回收）', affectedNodeIds: ['N08'], affectedStates: ['ns-04', 'ns-09'], affectedCharacters: ['c2'], description: '线人在 N08 主动提供核心情报，证据链完整度大幅提升', visualColor: '#EAB308', resolved: true, payoffNodeId: 'N08' },
  { id: 'cc-04', sourceNodeId: 'N02', sourceChoiceLabel: '保持怀疑', timing: 'delayed', timingLabel: '延迟影响（第二章回收）', affectedNodeIds: ['N07', 'N08'], affectedStates: ['ns-04'], affectedCharacters: ['c2'], description: '线人信任降低，可能在关键时刻不提供帮助或消失', visualColor: '#EAB308', resolved: false },
  { id: 'cc-05', sourceNodeId: 'N03', sourceChoiceLabel: '暗夜通道潜行', timing: 'delayed', timingLabel: '延迟影响（QTE 前回收）', affectedNodeIds: ['N06', 'N07'], affectedStates: ['ns-01', 'ns-06'], affectedCharacters: ['c1'], description: '低警戒路线，潜行值 +15，城市安保等级不变', visualColor: '#EAB308', resolved: true, payoffNodeId: 'N07' },
  { id: 'cc-06', sourceNodeId: 'N03', sourceChoiceLabel: '换装渗透大厦', timing: 'delayed', timingLabel: '延迟影响（QTE 前回收）', affectedNodeIds: ['N05', 'N06', 'N07'], affectedStates: ['ns-03', 'ns-06'], affectedCharacters: ['c1', 'c3'], description: '高警戒路线，反派警觉度提升，安保等级加强', visualColor: '#EAB308', resolved: true, payoffNodeId: 'N07' },
  { id: 'cc-07', sourceNodeId: 'N06', sourceChoiceLabel: '使用 EMP 手雷', timing: 'immediate', timingLabel: '即时反馈', affectedNodeIds: ['N07S'], affectedStates: ['ns-08', 'ns-01'], affectedCharacters: ['c1'], description: 'EMP 瘫痪警卫通讯，安全通过，但道具不可再用', visualColor: '#22C55E', resolved: true, payoffNodeId: 'N07S' },
  { id: 'cc-08', sourceNodeId: 'N06', sourceChoiceLabel: '强行突破', timing: 'immediate', timingLabel: '即时反馈', affectedNodeIds: ['N07F', 'N09'], affectedStates: ['ns-01', 'ns-10'], affectedCharacters: ['c1'], description: '警报触发，进入暴露路线，身份暴露风险急剧上升', visualColor: '#22C55E', resolved: true, payoffNodeId: 'N07F' },
  { id: 'cc-09', sourceNodeId: 'N07', sourceChoiceLabel: '潜行值 ≥ 60', timing: 'ending', timingLabel: '结局影响', affectedNodeIds: ['N08', 'N10'], affectedStates: ['ns-09', 'ns-07'], affectedCharacters: ['c1', 'c3'], description: '成功获取证据 → 证据链完整 → 舆论爆发 → 好结局：幽灵归来', visualColor: '#EF4444', resolved: true, payoffNodeId: 'N10' },
  { id: 'cc-10', sourceNodeId: 'N07', sourceChoiceLabel: '潜行值 < 60', timing: 'ending', timingLabel: '结局影响', affectedNodeIds: ['N09', 'N11'], affectedStates: ['ns-10', 'ns-01'], affectedCharacters: ['c1', 'c3'], description: '身份暴露 → 被捕 → 证据湮没 → 坏结局：今夜失败', visualColor: '#EF4444', resolved: true, payoffNodeId: 'N11' },
];

// ── 玩家探索图数据（P7-11）─────────────────────────────────────────────

export interface PlayerExplorationSession {
  id: string;
  sessionLabel: string;
  playthroughNumber: number;   // 第几次游玩
  visitedNodeIds: string[];    // 本次游玩访问的节点
  discoveredBranchIds: string[]; // 本次发现的分支
  reachedEndingIds: string[];   // 本次到达的结局
  choicesMade: { nodeId: string; choiceLabel: string }[];
  duration: number;            // seconds
  timestamp: string;
}

export interface PlayerExplorationMap {
  allNodeIds: string[];        // all nodes in the project
  allEndingIds: string[];      // all possible endings
  allBranchCount: number;      // total number of branches
  sessions: PlayerExplorationSession[];
  // Aggregated stats
  totalPlaythroughs: number;
  nodeCoverage: number;        // 0-100, % of all nodes visited across all sessions
  endingCoverage: number;      // 0-100, % of all endings reached
  branchCoverage: number;      // 0-100, % of all branches explored
  undiscoveredNodes: string[]; // nodes never visited
  undiscoveredEndings: string[]; // endings never reached
}

export const PLAYER_EXPLORATION: PlayerExplorationMap = {
  allNodeIds: ['N01', 'N02', 'N03', 'N04', 'N05', 'N06', 'N07S', 'N07F', 'N08', 'N09', 'N10', 'N11'],
  allEndingIds: ['N10', 'N11'],
  allBranchCount: 4,
  sessions: [
    {
      id: 'session-1', sessionLabel: '第 1 次游玩', playthroughNumber: 1,
      visitedNodeIds: ['N01', 'N02', 'N03', 'N04', 'N06', 'N07S', 'N08', 'N10'],
      discoveredBranchIds: ['path-a'],
      reachedEndingIds: ['N10'],
      choicesMade: [
        { nodeId: 'N01', choiceLabel: '推门进入' },
        { nodeId: 'N02', choiceLabel: '相信线人' },
        { nodeId: 'N03', choiceLabel: '暗夜通道潜行' },
        { nodeId: 'N06', choiceLabel: '使用 EMP 手雷' },
      ],
      duration: 480, timestamp: '2026-06-01 20:30:00',
    },
    {
      id: 'session-2', sessionLabel: '第 2 次游玩', playthroughNumber: 2,
      visitedNodeIds: ['N01', 'N02', 'N03', 'N05', 'N06', 'N07F', 'N09', 'N11'],
      discoveredBranchIds: ['path-b'],
      reachedEndingIds: ['N11'],
      choicesMade: [
        { nodeId: 'N01', choiceLabel: '先观察环境' },
        { nodeId: 'N02', choiceLabel: '保持怀疑' },
        { nodeId: 'N03', choiceLabel: '换装渗透大厦' },
        { nodeId: 'N06', choiceLabel: '强行突破' },
      ],
      duration: 420, timestamp: '2026-06-01 21:15:00',
    },
    {
      id: 'session-3', sessionLabel: '第 3 次游玩', playthroughNumber: 3,
      visitedNodeIds: ['N01', 'N02', 'N03', 'N05', 'N06', 'N07S', 'N08', 'N10'],
      discoveredBranchIds: ['path-d'],
      reachedEndingIds: ['N10'],
      choicesMade: [
        { nodeId: 'N01', choiceLabel: '推门进入' },
        { nodeId: 'N02', choiceLabel: '相信线人' },
        { nodeId: 'N03', choiceLabel: '换装渗透大厦' },
        { nodeId: 'N06', choiceLabel: '使用 EMP 手雷' },
      ],
      duration: 510, timestamp: '2026-06-02 10:00:00',
    },
  ],
  totalPlaythroughs: 3,
  nodeCoverage: 92,            // N07 (original condition node) treated as visited via N07S/N07F
  endingCoverage: 100,         // Both endings reached
  branchCoverage: 75,          // 3 out of 4 paths explored
  undiscoveredNodes: [],       // All nodes visited across sessions
  undiscoveredEndings: [],     // Both endings reached
};

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

export const CINEMATIC_DIRECTIONS: CinematicDirection[] = [
  {
    nodeId: 'N01',
    camera: { shotType: 'wide', shotLabel: '远景', movement: 'dolly_in', movementLabel: '缓慢推进', duration: 8, focusTarget: '霓虹街道全景' },
    performances: [
      { characterId: 'c1', characterName: '艾拉', expression: '警觉', action: '穿过人群，目光扫视四周', posture: '快步前行', emotionIntensity: 'neutral', emotionLabel: '冷静专注' },
    ],
    audio: { bgmTrack: 'Cyberpunk Ambient - 低沉合成器', bgmMood: '神秘紧张', ambientSound: '雨声、远处霓虹嗡嗡声、人群嘈杂', sfx: ['脚步声（湿地面）', '耳机静电声'] },
    transition: 'fade', transitionLabel: '淡入',
    pacing: '缓慢推进 8 秒，建立赛博朋克氛围后切入中景',
    staging: '艾拉从画面右侧 1/3 处进入，向中心移动',
  },
  {
    nodeId: 'N02',
    camera: { shotType: 'medium', shotLabel: '中景', movement: 'static', movementLabel: '固定机位', duration: 12, focusTarget: '艾拉与线人对话' },
    performances: [
      { characterId: 'c1', characterName: '艾拉', expression: '犹豫', action: '双臂交叉，微微侧头', posture: '防御性站姿', emotionIntensity: 'tense', emotionLabel: '紧张犹豫' },
      { characterId: 'c2', characterName: '线人', expression: '恐惧', action: '不自觉搓手，目光闪烁', posture: '身体前倾，压低声音', emotionIntensity: 'intense', emotionLabel: '恐惧急切' },
    ],
    audio: { bgmTrack: 'Tension Strings - 低沉弦乐', bgmMood: '不安', ambientSound: '酒吧低沉嘈杂、杯碟碰撞', sfx: ['椅子拖动声'] },
    transition: 'cut', transitionLabel: '硬切',
    pacing: '对话节奏中等，关键台词后停顿 1 秒',
    staging: '艾拉站在左侧面向右，线人站在右侧面向左，保持对话轴线',
  },
  {
    nodeId: 'N03',
    camera: { shotType: 'close_up', shotLabel: '特写', movement: 'push_in', movementLabel: '推近至面部', duration: 5, focusTarget: '艾拉面部特写（选择时刻）' },
    performances: [
      { characterId: 'c1', characterName: '艾拉', expression: '决断', action: '深吸一口气，眼神坚定', posture: '挺直身体', emotionIntensity: 'intense', emotionLabel: '关键抉择' },
    ],
    audio: { bgmTrack: 'Decision Moment - 单音钢琴 + 心跳', bgmMood: '凝重', ambientSound: '环境音渐弱至静音', sfx: ['心跳声', '深呼吸'] },
    transition: 'dissolve', transitionLabel: '溶解转场',
    pacing: '选择出现前停顿 2 秒，增强抉择重量感',
  },
  {
    nodeId: 'N06',
    camera: { shotType: 'handheld', shotLabel: '手持跟拍', movement: 'tracking', movementLabel: '快速跟拍', duration: 3, focusTarget: 'QTE 动作场景' },
    performances: [
      { characterId: 'c1', characterName: '艾拉', expression: '紧迫', action: '急速转身，手伸向 EMP 手雷', posture: '半蹲战斗姿态', emotionIntensity: 'climax', emotionLabel: '生死瞬间' },
    ],
    audio: { bgmTrack: 'Action Percussion - 激烈打击乐', bgmMood: '极度紧张', ambientSound: '警报声、脚步奔跑、金属碰撞', sfx: ['EMP 充电声', '警卫喊叫声', '倒计时蜂鸣'] },
    transition: 'flash', transitionLabel: '闪白转场',
    pacing: '极快节奏，QTE 倒计时 1.5 秒，画面轻微抖动增加紧迫感',
    staging: '艾拉在画面中心，警卫从两侧逼近',
  },
  {
    nodeId: 'N08',
    camera: { shotType: 'medium', shotLabel: '中景', movement: 'crane_up', movementLabel: '升降镜头上升', duration: 10, focusTarget: '数据中心全景 → 艾拉' },
    performances: [
      { characterId: 'c1', characterName: '艾拉', expression: '如释重负', action: '缓缓放下手，微微仰头', posture: '从紧张到放松', emotionIntensity: 'calm', emotionLabel: '紧张后的释然' },
    ],
    audio: { bgmTrack: 'Revelation Theme - 希望感合成器', bgmMood: '希望与沉重并存', ambientSound: '服务器低频嗡鸣、数据流声', sfx: ['数据下载完成提示音', 'U盘插入声'] },
    transition: 'dissolve', transitionLabel: '溶解转场',
    pacing: '先快后慢——数据获取的瞬间加速，随后放慢节奏让情感沉淀',
    staging: '艾拉在服务器阵列中央，蓝色灯光映照面部',
  },
  {
    nodeId: 'N10',
    camera: { shotType: 'wide', shotLabel: '远景', movement: 'pull_out', movementLabel: '缓慢拉远', duration: 15, focusTarget: '艾拉消失在人群中' },
    performances: [
      { characterId: 'c1', characterName: '艾拉', expression: '平静', action: '转身走入霓虹人群，背影渐远', posture: '从容步伐', emotionIntensity: 'calm', emotionLabel: '任务完成的平静' },
    ],
    audio: { bgmTrack: 'Ghost Protocol Theme - 主题曲完整版', bgmMood: '希望中带着孤独', ambientSound: '霓虹嗡鸣渐弱、城市声渐远', sfx: ['脚步声渐远'] },
    transition: 'fade', transitionLabel: '淡出至黑',
    pacing: '缓慢拉远 15 秒，配乐渐强后随画面一起淡出',
    staging: '艾拉从画面中心向远处走去，最终消失在霓虹灯光中',
  },
];

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

export const ENGINE_EXPORT_CONFIGS: EngineExportConfig[] = [
  {
    id: 'unity', name: 'Unity Package', icon: '🎮',
    description: '导出为 Unity 可用的 C# 脚本 + JSON 数据 + 资产清单。支持 Timeline 集成和 Addressables 资产管理。',
    format: '.unitypackage', status: 'beta',
    features: ['C# 对话系统', 'JSON 节点数据', '资产清单 XML', 'Timeline 标记', 'Addressables 配置'],
    estimatedSize: '~18.5 MB',
    fieldMappings: [
      { sourceField: 'story_nodes', targetField: 'DialogueNodes', mapped: true },
      { sourceField: 'node_edges', targetField: 'DialogueEdges', mapped: true },
      { sourceField: 'game_variables', targetField: 'GameStateVariables', mapped: true },
      { sourceField: 'game_characters', targetField: 'CharacterProfiles', mapped: true },
      { sourceField: 'qte_configs', targetField: 'QTESequences', mapped: true },
      { sourceField: 'cinematic_directions', targetField: 'CinematicTimeline', mapped: true },
    ],
    customOptions: [
      { key: 'include_assets', label: '包含资产引用', type: 'boolean', defaultValue: true },
      { key: 'timeline_integration', label: 'Timeline 集成', type: 'boolean', defaultValue: true },
      { key: 'script_backend', label: '脚本后端', type: 'select', defaultValue: 'Mono', options: ['Mono', 'IL2CPP'] },
    ],
  },
  {
    id: 'godot', name: 'Godot Project', icon: '🤖',
    description: '导出为 Godot 4.x 项目结构：GDScript 脚本 + 场景树 + 资源导入配置。',
    format: '.godot-project', status: 'beta',
    features: ['GDScript 对话控制器', '场景树 JSON', '资源导入器', '信号系统配置', '自动翻译支持'],
    estimatedSize: '~12.3 MB',
    fieldMappings: [
      { sourceField: 'story_nodes', targetField: 'dialogue_nodes', mapped: true },
      { sourceField: 'node_edges', targetField: 'dialogue_edges', mapped: true },
      { sourceField: 'game_variables', targetField: 'game_state', mapped: true },
      { sourceField: 'game_characters', targetField: 'characters', mapped: true },
      { sourceField: 'cinematic_directions', targetField: 'cinematic_data', mapped: true },
    ],
    customOptions: [
      { key: 'godot_version', label: 'Godot 版本', type: 'select', defaultValue: '4.x', options: ['4.x', '3.x'] },
      { key: 'i18n', label: '启用国际化', type: 'boolean', defaultValue: false },
    ],
  },
  {
    id: 'yarn', name: 'Yarn Spinner', icon: '🧶',
    description: '导出为 Yarn Spinner .yarn 格式，适配 Unity 叙事插件。支持标记语言和命令。',
    format: '.yarn', status: 'stable',
    features: ['Yarn 标记语言', '变量声明', '命令标签', '条件跳转', '本地化支持'],
    estimatedSize: '~680 KB',
    fieldMappings: [
      { sourceField: 'story_nodes', targetField: 'Nodes', mapped: true },
      { sourceField: 'node_edges', targetField: 'Links', mapped: true },
      { sourceField: 'game_variables', targetField: 'Variables', mapped: true },
      { sourceField: 'script_blocks', targetField: 'Lines', mapped: true },
    ],
    customOptions: [
      { key: 'include_commands', label: '包含自定义命令', type: 'boolean', defaultValue: true },
    ],
  },
  {
    id: 'lua', name: 'Lua Script', icon: '🌙',
    description: '导出为结构化 Lua 脚本，适配自研引擎或 Love2D/Defold 等框架。',
    format: '.lua', status: 'alpha',
    features: ['Lua 表结构', '对话函数', '状态机', '事件系统', '资产加载表'],
    estimatedSize: '~2.1 MB',
    fieldMappings: [
      { sourceField: 'story_nodes', targetField: 'nodes', mapped: true },
      { sourceField: 'node_edges', targetField: 'edges', mapped: true },
      { sourceField: 'game_variables', targetField: 'state', mapped: true },
    ],
    customOptions: [
      { key: 'module_style', label: '模块风格', type: 'select', defaultValue: 'return_table', options: ['return_table', 'global', 'require'] },
    ],
  },
  {
    id: 'api', name: '结构化 API (OpenAPI)', icon: '🔌',
    description: '生成 OpenAPI 3.0 规范文档，允许外部系统通过 REST API 拉取剧情数据。',
    format: 'openapi.yaml', status: 'beta',
    features: ['OpenAPI 3.0 规范', 'CRUD 端点定义', 'WebSocket 实时推送', '资产 CDN 配置', 'Webhook 通知'],
    estimatedSize: '~156 KB',
    fieldMappings: [
      { sourceField: 'all', targetField: '/api/v1/project', mapped: true },
      { sourceField: 'story_nodes', targetField: '/api/v1/nodes', mapped: true },
      { sourceField: 'game_variables', targetField: '/api/v1/state', mapped: true },
      { sourceField: 'assets', targetField: '/api/v1/assets', mapped: true },
    ],
    customOptions: [
      { key: 'auth', label: '认证方式', type: 'select', defaultValue: 'bearer', options: ['bearer', 'api_key', 'oauth2'] },
      { key: 'websocket', label: '包含 WebSocket', type: 'boolean', defaultValue: true },
    ],
  },
];

// ── 协作系统数据（P8-15）─────────────────────────────────────────────

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';
export type TaskPriority = 'urgent' | 'high' | 'normal' | 'low';
export type ReviewStage = 'draft' | 'submitted' | 'editor_review' | 'director_approved' | 'published';

export interface CollabTask {
  id: string;
  title: string;
  assignee: string;         // member name
  assigneeRole: string;
  status: TaskStatus;
  priority: TaskPriority;
  category: string;         // '节点编辑' | '资产制作' | '剧本编写' | '质检修复' | 'UI设计'
  description: string;
  linkedNodeId?: string;
  linkedAssetId?: string;
  dueDate?: string;
  completedAt?: string;
  comments: number;
}

export interface CollabComment {
  id: string;
  taskId?: string;
  nodeId?: string;
  author: string;
  authorRole: string;
  content: string;
  mentions?: string[];      // mentioned user names
  timestamp: string;
  isResolved: boolean;
}

export interface ReviewItem {
  id: string;
  type: 'script' | 'asset' | 'node_graph' | 'interaction' | 'full_build';
  title: string;
  submitter: string;
  reviewer: string;
  stage: ReviewStage;
  submittedAt: string;
  reviewedAt?: string;
  comments: string;
  changeSummary: string;
}

export interface VersionDiff {
  fromVersion: string;
  toVersion: string;
  nodesAdded: number;
  nodesModified: number;
  nodesRemoved: number;
  variablesChanged: number;
  assetsUpdated: number;
  scriptChanges: number;
  summary: string;
}

export const COLLAB_TASKS: CollabTask[] = [
  { id: 'task-01', title: '修复 N07 失败反馈文案', assignee: '编剧小王', assigneeRole: 'Script Editor', status: 'in_progress', priority: 'urgent', category: '质检修复', description: 'N07 潜行判定节点失败路径缺少文案，需补充 200 字以内失败叙事', linkedNodeId: 'N07', dueDate: '2026-06-03', comments: 3 },
  { id: 'task-02', title: '制作 N06 警卫场景背景', assignee: '美术小李', assigneeRole: 'Asset Artist', status: 'todo', priority: 'high', category: '资产制作', description: 'N06 警卫逼近场景缺少背景图片，需要赛博朋克风格的安保走廊', linkedNodeId: 'N06', dueDate: '2026-06-04', comments: 1 },
  { id: 'task-03', title: '设计 QTE 失败分支演出', assignee: '互动设计师', assigneeRole: 'Interaction Designer', status: 'review', priority: 'high', category: '互动设计', description: 'N06 QTE 失败后需要完整的演出设计：镜头、表演、音频、转场', linkedNodeId: 'N06', comments: 5 },
  { id: 'task-04', title: '补齐全部 BGM', assignee: '美术小李', assigneeRole: 'Asset Artist', status: 'todo', priority: 'normal', category: '资产制作', description: '11 个节点均缺少 BGM，需要根据每个节点的情绪配置背景音乐', comments: 2 },
  { id: 'task-05', title: '优化第一章对白节奏', assignee: '编剧小王', assigneeRole: 'Script Editor', status: 'done', priority: 'normal', category: '剧本编写', description: '第一章线人对话过长，需要精简并增加更多互动节奏', completedAt: '2026-06-01', comments: 4 },
  { id: 'task-06', title: 'UI 模板应用到全部节点', assignee: '互动设计师', assigneeRole: 'Interaction Designer', status: 'in_progress', priority: 'normal', category: 'UI设计', description: '将赛博朋克 UI 模板应用到所有对话框和选项按钮', comments: 1 },
  { id: 'task-07', title: '路径 C 分支过短问题', assignee: '编剧小王', assigneeRole: 'Script Editor', status: 'todo', priority: 'low', category: '节点编辑', description: '路径 C（QTE失败→暴露路线）只有 2 个节点，需要增加中间环节', linkedNodeId: 'N07F', comments: 0 },
];

export const COLLAB_COMMENTS: CollabComment[] = [
  { id: 'comment-01', taskId: 'task-01', author: '项目负责人', authorRole: 'Project Lead', content: '这个是最紧急的，质检直接报错了。建议优先处理。', timestamp: '2026-06-02 09:30:00', isResolved: false },
  { id: 'comment-02', taskId: 'task-01', author: '编剧小王', authorRole: 'Script Editor', content: '收到，我今天下午写完初稿后 @互动设计师 帮忙看一下叙事连贯性。', mentions: ['互动设计师'], timestamp: '2026-06-02 10:15:00', isResolved: false },
  { id: 'comment-03', taskId: 'task-01', author: '互动设计师', authorRole: 'Interaction Designer', content: '好的，我这边同步更新失败路径的变量变化。', timestamp: '2026-06-02 10:45:00', isResolved: false },
  { id: 'comment-04', taskId: 'task-03', author: '互动设计师', authorRole: 'Interaction Designer', content: 'QTE 失败演出方案已提交审核：手持镜头 + 警报闪红 + 角色跌倒动作。@项目负责人 请确认。', mentions: ['项目负责人'], timestamp: '2026-06-02 14:00:00', isResolved: false },
  { id: 'comment-05', nodeId: 'N07', author: '项目负责人', authorRole: 'Project Lead', content: '这个节点的失败反馈是质检里反复报的问题，必须在下一个版本修复。', timestamp: '2026-06-01 16:00:00', isResolved: false },
];

export const REVIEW_ITEMS: ReviewItem[] = [
  { id: 'review-01', type: 'script', title: '第一章对白修订 v3', submitter: '编剧小王', reviewer: '项目负责人', stage: 'editor_review', submittedAt: '2026-06-02 11:00:00', comments: '精简了线人对话，增加了 1 个互动选择点', changeSummary: '修改 7 行对白，新增 1 个选择节点' },
  { id: 'review-02', type: 'asset', title: 'N01-N05 场景图片更新', submitter: '美术小李', reviewer: '项目负责人', stage: 'director_approved', submittedAt: '2026-06-01 15:00:00', reviewedAt: '2026-06-02 09:00:00', comments: '统一为赛博朋克风格，提高了一致性', changeSummary: '更新 5 张场景图，统一色调' },
  { id: 'review-03', type: 'interaction', title: 'QTE 失败演出方案', submitter: '互动设计师', reviewer: '项目负责人', stage: 'submitted', submittedAt: '2026-06-02 14:00:00', comments: '完整演出设计：手持镜头 + 警报 + 跌倒', changeSummary: '新增 N07F 演出指导' },
  { id: 'review-04', type: 'node_graph', title: '新增 N04→N06 中间节点', submitter: '互动设计师', reviewer: '编剧小王', stage: 'draft', submittedAt: '', comments: '草稿阶段，需要编剧确认叙事合理性', changeSummary: '新增 1 个场景节点，延长潜行路线' },
];

export const VERSION_DIFFS: VersionDiff[] = [
  { fromVersion: 'v1.1.0', toVersion: 'v1.2.0', nodesAdded: 2, nodesModified: 5, nodesRemoved: 0, variablesChanged: 1, assetsUpdated: 8, scriptChanges: 15, summary: '新增 QTE 系统，优化第一章对白节奏' },
  { fromVersion: 'v1.2.0', toVersion: 'v1.2.3', nodesAdded: 0, nodesModified: 3, nodesRemoved: 0, variablesChanged: 0, assetsUpdated: 3, scriptChanges: 7, summary: '修复 N03 选择分支不平衡，更新场景图片' },
  { fromVersion: 'v1.0.0', toVersion: 'v1.2.3', nodesAdded: 4, nodesModified: 9, nodesRemoved: 1, variablesChanged: 2, assetsUpdated: 14, scriptChanges: 32, summary: '从初始版本到当前版本的累计变更' },
];
