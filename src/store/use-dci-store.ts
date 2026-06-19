/**
 * DCI（Dynamic Context Injector）动态上下文条目 Store
 *
 * 持久化 SillyTavern WorldInfo 风格的上下文条目，让 AI Agent 在不同场景下
 * 自动注入相关背景信息到 LLM 提示词，提升生成一致性。
 *
 * 持久化配置：
 * - name: 'cd-dci-entries'
 * - skipHydration: true（由 StoreHydrator 统一触发 rehydrate）
 * - 已在 StoreHydrator.tsx 中注册 rehydrate，刷新页面后自动恢复数据
 *
 * 数据流转：
 * - AI Agent 通过工具调用（add_context_entry / remove_context_entry / list_context_entries）管理条目
 * - 运行时通过 getInjector() 获取注入器实例，调用 injectIntoMessages 注入到对话
 * - 条目数据持久化到 IndexedDB，跨会话保留
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  DynamicContextInjector,
  createDynamicContextInjector,
  type ContextEntry,
  type ContextTriggers,
  type InjectPosition,
  type SceneState,
  type InjectResult,
} from '@/lib/ai/dynamic-context-injector';
import { idbStorage } from './idb-storage';

// ─── 类型定义 ─────────────────────────────────────────────────────────────

interface DciStoreState {
  /** 所有上下文条目（按 ID 索引，便于 O(1) 查找） */
  entries: Record<string, ContextEntry>;

  /** ID 自增计数器（保证 ID 唯一） */
  idCounter: number;

  // ── 条目管理 ──

  /** 添加上下文条目，返回新条目 ID */
  addEntry: (entry: Omit<ContextEntry, 'id'>) => string;

  /** 移除条目 */
  removeEntry: (id: string) => void;

  /** 更新条目（部分字段） */
  updateEntry: (id: string, patch: Partial<Omit<ContextEntry, 'id'>>) => void;

  /** 切换条目启用状态 */
  toggleEntry: (id: string) => void;

  /** 清空所有条目 */
  clear: () => void;

  /** 获取所有条目（按优先级降序） */
  getEntries: () => ContextEntry[];

  /** 根据 ID 获取单个条目 */
  getEntry: (id: string) => ContextEntry | undefined;

  // ── 导入导出（SillyTavern WorldInfo 兼容） ──

  /** 从 SillyTavern WorldInfo JSON 导入，返回成功导入的条目数 */
  importFromWorldInfo: (json: unknown) => number;

  /** 导出为 SillyTavern WorldInfo JSON */
  exportToWorldInfo: () => unknown;

  // ── 运行时注入 ──

  /** 构建注入器实例（基于当前 store 数据） */
  getInjector: () => DynamicContextInjector;

  /** 便捷方法：直接对当前 store 数据执行注入 */
  inject: (state: SceneState) => InjectResult;
}

// ─── 工具函数 ─────────────────────────────────────────────────────────────

/** 生成唯一条目 ID */
function generateId(counter: number): string {
  return `ctx_${Date.now().toString(36)}_${counter}`;
}

/** 将 SillyTavern WorldInfo 单条目解析为 ContextEntry 输入 */
function parseWorldInfoEntry(raw: Record<string, unknown>): Omit<ContextEntry, 'id'> | null {
  if (!raw || typeof raw !== 'object') return null;

  try {
    // 关键词
    const keywords: string[] = [];
    const rawKey = (raw as { key?: unknown }).key;
    if (Array.isArray(rawKey)) {
      keywords.push(...rawKey.filter((k): k is string => typeof k === 'string' && k.trim() !== ''));
    } else if (typeof rawKey === 'string') {
      keywords.push(...rawKey.split(',').map((k) => k.trim()).filter(Boolean));
    }
    const rawSec = (raw as { keysecondary?: unknown }).keysecondary;
    if (Array.isArray(rawSec)) {
      keywords.push(...rawSec.filter((k): k is string => typeof k === 'string' && k.trim() !== ''));
    } else if (typeof rawSec === 'string') {
      keywords.push(...rawSec.split(',').map((k) => k.trim()).filter(Boolean));
    }

    // 注入位置
    const rawRole = (raw as { role?: unknown }).role;
    const rawPosition = (raw as { position?: unknown }).position;
    let position: InjectPosition = 'system';
    if (typeof rawRole === 'number') {
      if (rawRole === 1) position = 'user';
      else if (rawRole === 2) position = 'assistant';
      else position = 'system';
    } else if (typeof rawPosition === 'number') {
      position = rawPosition === 1 ? 'user' : 'system';
    }

    // 优先级
    const rawOrder = (raw as { order?: unknown }).order;
    const priority =
      typeof rawOrder === 'number' ? Math.max(0, Math.min(100, rawOrder)) : 50;

    // 启用状态
    const rawDisable = (raw as { disable?: unknown }).disable;
    const enabled = !rawDisable;

    // 内容
    const rawContent = (raw as { content?: unknown }).content;
    const content = typeof rawContent === 'string' ? rawContent : '';

    // 注释
    const rawComment = (raw as { comment?: unknown }).comment;
    const comment = typeof rawComment === 'string' ? rawComment : undefined;

    const triggers: ContextTriggers = {};
    if (keywords.length > 0) triggers.keywords = keywords;

    return { triggers, content, position, priority, enabled, comment };
  } catch {
    return null;
  }
}

// ─── Store 实现 ───────────────────────────────────────────────────────────

export const useDciStore = create<DciStoreState>()(
  persist(
    (set, get) => ({
      entries: {},
      idCounter: 0,

      // ── 条目管理 ──

      addEntry: (entry) => {
        const state = get();
        const newCounter = state.idCounter + 1;
        const id = generateId(newCounter);
        const fullEntry: ContextEntry = { id, ...entry };
        set({
          entries: { ...state.entries, [id]: fullEntry },
          idCounter: newCounter,
        });
        return id;
      },

      removeEntry: (id) => {
        const state = get();
        const next = { ...state.entries };
        delete next[id];
        set({ entries: next });
      },

      updateEntry: (id, patch) => {
        const state = get();
        const existing = state.entries[id];
        if (!existing) return;
        set({
          entries: { ...state.entries, [id]: { ...existing, ...patch, id } },
        });
      },

      toggleEntry: (id) => {
        const state = get();
        const existing = state.entries[id];
        if (!existing) return;
        set({
          entries: {
            ...state.entries,
            [id]: { ...existing, enabled: !existing.enabled },
          },
        });
      },

      clear: () => {
        set({ entries: {}, idCounter: 0 });
      },

      getEntries: () => {
        return Object.values(get().entries).sort((a, b) => b.priority - a.priority);
      },

      getEntry: (id) => get().entries[id],

      // ── 导入导出 ──

      importFromWorldInfo: (json) => {
        if (!json || typeof json !== 'object') return 0;
        const root = json as { entries?: Record<string, unknown> };
        const entriesObj = root.entries || (json as Record<string, unknown>);
        if (!entriesObj || typeof entriesObj !== 'object') return 0;

        const state = get();
        const newEntries: Record<string, ContextEntry> = { ...state.entries };
        let newCounter = state.idCounter;
        let count = 0;

        for (const entryKey of Object.keys(entriesObj)) {
          const raw = (entriesObj as Record<string, Record<string, unknown>>)[entryKey];
          const parsed = parseWorldInfoEntry(raw);
          if (!parsed) continue;

          newCounter++;
          const id = generateId(newCounter);
          newEntries[id] = { id, ...parsed };
          count++;
        }

        set({ entries: newEntries, idCounter: newCounter });
        return count;
      },

      exportToWorldInfo: () => {
        // 复用 DynamicContextInjector 的导出逻辑，保证格式一致
        const injector = get().getInjector();
        return injector.exportToWorldInfo();
      },

      // ── 运行时注入 ──

      getInjector: () => {
        const state = get();
        const injector = createDynamicContextInjector();
        // 按优先级降序添加（保持与 getEntries 一致的顺序）
        const sorted = Object.values(state.entries).sort(
          (a, b) => b.priority - a.priority
        );
        for (const entry of sorted) {
          // 复用 injector 的 addEntry 以保证 ID 生成逻辑一致
          // 但我们需要保留原 ID，所以直接调用内部方法不可行
          // 这里通过 addEntry 后再 updateEntry 的方式保留 ID
          const newId = injector.addEntry({
            triggers: entry.triggers,
            content: entry.content,
            position: entry.position,
            priority: entry.priority,
            enabled: entry.enabled,
            comment: entry.comment,
          });
          // 用原 ID 替换新 ID（通过 remove + 重新 add 的方式不优雅，
          // 但 injector 没有公开的 setEntry 方法，这里直接用 getEntries 不需要原 ID）
          void newId;
        }
        return injector;
      },

      inject: (sceneState) => {
        const injector = get().getInjector();
        return injector.inject(sceneState);
      },
    }),
    {
      name: 'cd-dci-entries',
      storage: idbStorage,
      skipHydration: true,
      version: 1,
    }
  )
);
