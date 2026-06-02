// ChaseDream Creator Studio — UI Seed Data

import type { UITemplate, GameUISettings, AssetCard } from '../types/ui';

// ── 游戏 UI 模板数据 ──────────────────────────────────────────────────────

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
