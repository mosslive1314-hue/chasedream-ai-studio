// ChaseDream Creator Studio — UI Types

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

// Asset data
export interface AssetCard {
  nodeId: string;
  nodeLabel: string;
  hasImage: boolean;
  hasBgm: boolean;
  hasVoice: boolean;
  hasVideo: boolean;
  hasScript?: boolean;
  imageUrl?: string;
}
