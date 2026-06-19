// 存档系统 — 类型定义
// 纯类型文件，不依赖 React，可在任何环境使用

import type { RuntimeSnapshot } from '@/lib/runtime/scene-context';

/** 存档槽位 */
export interface SaveSlot {
  page: number;          // 页码（1开始）
  index: number;         // 槽位序号（1开始）
  exists: boolean;       // 是否有存档
  meta: SaveSlotMeta;    // 存档元数据
  data: SaveSlotData | null; // 存档数据
}

/** 存档元数据 */
export interface SaveSlotMeta {
  title: string;           // 存档标题（当前节点名或自定义标题）
  timestamp: number;       // 存档时间戳
  playTime: number;        // 游玩时长（秒）
  currentNodeId: string;   // 当前节点 ID
  thumbnail?: string;      // 缩略图（背景图 URL）
  chapter?: string;        // 章节名
}

/** 存档数据（实际保存的运行时状态） */
export interface SaveSlotData {
  runtime: RuntimeSnapshot;       // 运行时快照
  audioState: string;             // 音频状态（序列化字符串）
  styleState: string;             // 样式状态（序列化字符串）
  saveTargetStack: string[];      // 存档目标栈（支持嵌套流程）
  customData?: Record<string, unknown>; // 自定义数据
}

/** 存档配置 */
export interface SaveConfig {
  maxPages: number;         // 最大页数
  slotsPerPage: number;     // 每页槽位数
  autoSaveInterval: number; // 自动存档间隔（秒，0=禁用）
  maxQuickSaves: number;    // 最大快速存档数
}

/** 存档操作结果 */
export interface SaveResult {
  success: boolean;
  message: string;
  slot?: SaveSlot;
}

/** 读档操作结果 */
export interface LoadResult {
  success: boolean;
  message: string;
  data?: SaveSlotData;
}

/** 完整存档状态（用于序列化整个存档系统） */
export interface SaveSystemState {
  config: SaveConfig;
  slots: SaveSlot[];
  quickSaves: SaveSlotData[];
  lastAutoSave: number | null;
}

/** 默认存档配置 */
export const DEFAULT_SAVE_CONFIG: SaveConfig = {
  maxPages: 10,
  slotsPerPage: 6,
  autoSaveInterval: 300,
  maxQuickSaves: 10,
};
