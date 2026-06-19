// 存档管理器 — 基于 IndexedDB 的持久化存档系统
// 纯逻辑类，不依赖 React；SSR 安全：所有 IndexedDB 操作均检查 window

import { get, set, del, keys, clear as idbClear } from 'idb-keyval';
import type { SceneContext } from '@/lib/runtime/scene-context';
import { getAudioManager } from '@/lib/audio';
import { getStyleManager } from '@/lib/style';
import {
  type SaveSlot, type SaveSlotMeta, type SaveSlotData, type SaveConfig,
  type SaveResult, type LoadResult, type SaveSystemState, DEFAULT_SAVE_CONFIG,
} from './save-types';

// IndexedDB 键前缀
const SLOT_PREFIX = 'save_slot_';
const QUICK_PREFIX = 'save_quick_';
const CONFIG_KEY = 'save_config';

/** 存档管理器 — 管理槽位存档、快速存档与自动存档 */
export class SaveManager {
  private config: SaveConfig;
  private slots: Map<string, SaveSlot> = new Map();
  private quickSaves: SaveSlotData[] = [];
  private lastAutoSave: number | null = null;
  private sessionStartTime: number;
  private saveTargetStack: string[] = [];

  constructor(config?: Partial<SaveConfig>) {
    this.config = { ...DEFAULT_SAVE_CONFIG, ...config };
    this.sessionStartTime = Date.now();
  }

  /** 初始化：从 IndexedDB 加载配置和所有存档 */
  async init(): Promise<void> {
    if (typeof window === 'undefined') return;
    try {
      const savedConfig = await get<SaveConfig>(CONFIG_KEY);
      if (savedConfig) this.config = { ...DEFAULT_SAVE_CONFIG, ...savedConfig };
      await this.loadAllSlots();
    } catch { /* 初始化失败时使用默认配置 */ }
  }

  /** 存档到指定槽位 */
  async saveToSlot(page: number, index: number, context: SceneContext, title?: string): Promise<SaveResult> {
    if (typeof window === 'undefined') return { success: false, message: 'SSR 环境不支持存档' };
    if (page < 1 || page > this.config.maxPages || index < 1 || index > this.config.slotsPerPage) {
      return { success: false, message: '槽位超出范围' };
    }
    try {
      const data = this.generateSaveData(context);
      const meta: SaveSlotMeta = {
        title: title || context.getCurrentNodeId() || '未命名存档',
        timestamp: Date.now(),
        playTime: this.formatPlayTime(),
        currentNodeId: context.getCurrentNodeId(),
      };
      const slot: SaveSlot = { page, index, exists: true, meta, data };
      await this.persistSlot(slot);
      this.slots.set(this.getSlotKey(page, index), slot);
      return { success: true, message: '存档成功', slot };
    } catch { return { success: false, message: '存档失败' }; }
  }

  /** 从槽位读档（仅返回数据，不自动应用） */
  async loadFromSlot(page: number, index: number): Promise<LoadResult> {
    if (typeof window === 'undefined') return { success: false, message: 'SSR 环境不支持读档' };
    const slot = await this.loadSlotFromDB(page, index);
    if (!slot?.exists || !slot.data) return { success: false, message: '该槽位无存档' };
    return { success: true, message: '读档成功', data: slot.data };
  }

  /** 删除指定槽位存档 */
  async deleteSlot(page: number, index: number): Promise<SaveResult> {
    if (typeof window === 'undefined') return { success: false, message: 'SSR 环境不支持删除' };
    try {
      await del(`${SLOT_PREFIX}${page}_${index}`);
      this.slots.delete(this.getSlotKey(page, index));
      return { success: true, message: '删除成功' };
    } catch { return { success: false, message: '删除失败' }; }
  }

  /** 快速存档（不占用槽位，独立存储） */
  async quickSave(context: SceneContext): Promise<SaveResult> {
    if (typeof window === 'undefined') return { success: false, message: 'SSR 环境不支持存档' };
    try {
      const data = this.generateSaveData(context);
      await set(`${QUICK_PREFIX}${Date.now()}`, data);
      this.quickSaves.unshift(data);
      while (this.quickSaves.length > this.config.maxQuickSaves) this.quickSaves.pop();
      await this.cleanupQuickSaves();
      return { success: true, message: '快速存档成功' };
    } catch { return { success: false, message: '快速存档失败' }; }
  }

  /** 快速读档（读取最新的快速存档） */
  async quickLoad(): Promise<LoadResult> {
    if (typeof window === 'undefined') return { success: false, message: 'SSR 环境不支持读档' };
    if (this.quickSaves.length === 0) return { success: false, message: '无快速存档' };
    return { success: true, message: '快速读档成功', data: this.quickSaves[0] };
  }

  /** 获取指定页的所有槽位（含空槽位） */
  getSlots(page: number): SaveSlot[] {
    const result: SaveSlot[] = [];
    for (let i = 1; i <= this.config.slotsPerPage; i++) {
      const slot = this.slots.get(this.getSlotKey(page, i));
      result.push(slot ?? { page, index: i, exists: false, meta: this.emptyMeta(), data: null });
    }
    return result;
  }

  /** 获取槽位元信息列表（不含数据，用于列表显示） */
  getSlotMetas(page: number): SaveSlotMeta[] {
    return this.getSlots(page).map((s) => s.meta);
  }

  /** 自动存档检查（按配置间隔触发） */
  async checkAutoSave(context: SceneContext): Promise<void> {
    if (this.config.autoSaveInterval <= 0) return;
    const now = Date.now();
    if (this.lastAutoSave !== null && now - this.lastAutoSave < this.config.autoSaveInterval * 1000) return;
    await this.saveToSlot(1, 1, context, '自动存档');
    this.lastAutoSave = now;
  }

  // ── 存档目标栈管理（借鉴 VoidNovelEngine，支持嵌套流程） ──

  pushSaveTarget(target: string): void { this.saveTargetStack.push(target); }
  popSaveTarget(): string | null { return this.saveTargetStack.pop() ?? null; }
  getCurrentSaveTarget(): string | null {
    return this.saveTargetStack.length > 0 ? this.saveTargetStack[this.saveTargetStack.length - 1] : null;
  }

  /** 获取存档统计信息 */
  getStats(): { totalSaves: number; totalPages: number; quickSaveCount: number; lastSaveTime: number | null } {
    let lastSaveTime: number | null = null;
    for (const s of this.slots.values()) {
      if (s.exists && (lastSaveTime === null || s.meta.timestamp > lastSaveTime)) lastSaveTime = s.meta.timestamp;
    }
    return {
      totalSaves: this.slots.size,
      totalPages: this.config.maxPages,
      quickSaveCount: this.quickSaves.length,
      lastSaveTime,
    };
  }

  /** 序列化整个存档系统为 JSON 字符串 */
  serialize(): string {
    const state: SaveSystemState = {
      config: this.config,
      slots: Array.from(this.slots.values()),
      quickSaves: this.quickSaves,
      lastAutoSave: this.lastAutoSave,
    };
    return JSON.stringify(state);
  }

  /** 从 JSON 字符串恢复存档系统状态 */
  deserialize(json: string): void {
    try {
      const state = JSON.parse(json) as SaveSystemState;
      this.config = { ...DEFAULT_SAVE_CONFIG, ...state.config };
      this.slots.clear();
      for (const s of state.slots) this.slots.set(this.getSlotKey(s.page, s.index), s);
      this.quickSaves = [...state.quickSaves];
      this.lastAutoSave = state.lastAutoSave;
    } catch { /* 反序列化失败时保持当前状态 */ }
  }

  /** 清空所有存档（槽位 + 快速存档 + 配置） */
  async clearAll(): Promise<void> {
    if (typeof window === 'undefined') return;
    await idbClear();
    this.slots.clear();
    this.quickSaves = [];
    this.lastAutoSave = null;
  }

  // ── 存档数据生成与应用 ──

  /** 生成存档数据：捕获运行时快照 + 序列化音频/样式状态 */
  private generateSaveData(context: SceneContext): SaveSlotData {
    return {
      runtime: context.captureSnapshot(),
      audioState: typeof window !== 'undefined' ? getAudioManager().serialize() : '',
      styleState: typeof window !== 'undefined' ? getStyleManager().serialize() : '',
      saveTargetStack: [...this.saveTargetStack],
    };
  }

  /** 应用存档数据到场景上下文（恢复运行时、音频、样式） */
  async applySaveData(data: SaveSlotData, context: SceneContext): Promise<void> {
    context.restoreSnapshot(data.runtime);
    if (typeof window !== 'undefined') {
      if (data.audioState) await getAudioManager().deserialize(data.audioState);
      if (data.styleState) getStyleManager().deserialize(data.styleState);
    }
    this.saveTargetStack = [...data.saveTargetStack];
  }

  // ── IndexedDB 持久化私有方法 ──

  private async persistSlot(slot: SaveSlot): Promise<void> {
    await set(`${SLOT_PREFIX}${slot.page}_${slot.index}`, slot);
  }

  private async loadSlotFromDB(page: number, index: number): Promise<SaveSlot | null> {
    return (await get<SaveSlot>(`${SLOT_PREFIX}${page}_${index}`)) ?? null;
  }

  /** 从 IndexedDB 加载所有槽位和快速存档 */
  private async loadAllSlots(): Promise<void> {
    const allKeys = await keys<string>();
    for (const key of allKeys) {
      if (typeof key !== 'string') continue;
      if (key.startsWith(SLOT_PREFIX)) {
        const slot = await get<SaveSlot>(key);
        if (slot) this.slots.set(this.getSlotKey(slot.page, slot.index), slot);
      } else if (key.startsWith(QUICK_PREFIX)) {
        const data = await get<SaveSlotData>(key);
        if (data) this.quickSaves.push(data);
      }
    }
    // 快速存档按时间戳倒序排列（最新在前）
    this.quickSaves.sort((a, b) => b.runtime.timestamp - a.runtime.timestamp);
    if (this.quickSaves.length > this.config.maxQuickSaves) {
      this.quickSaves = this.quickSaves.slice(0, this.config.maxQuickSaves);
    }
  }

  /** 清理 IndexedDB 中超出上限的旧快速存档 */
  private async cleanupQuickSaves(): Promise<void> {
    const allKeys = await keys<string>();
    const quickKeys = allKeys
      .filter((k): k is string => typeof k === 'string' && k.startsWith(QUICK_PREFIX))
      .sort();
    while (quickKeys.length > this.config.maxQuickSaves) {
      const oldKey = quickKeys.shift();
      if (oldKey) await del(oldKey);
    }
  }

  private getSlotKey(page: number, index: number): string { return `${page}_${index}`; }
  private formatPlayTime(): number { return Math.floor((Date.now() - this.sessionStartTime) / 1000); }
  private emptyMeta(): SaveSlotMeta { return { title: '空', timestamp: 0, playTime: 0, currentNodeId: '' }; }
}
