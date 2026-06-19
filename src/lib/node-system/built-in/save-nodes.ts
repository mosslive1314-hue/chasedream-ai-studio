/**
 * ChaseDream 节点系统 — 存档节点（5 种）
 * 真正调用 SaveManager 执行存档/读档操作
 */
import type { NodeRegistry } from '../node-registry';
import { getSaveManager } from '@/lib/save';

export function registerSaveNodes(registry: NodeRegistry): void {
  // 存档到槽位
  registry.register({
    typeId: 'save_slot',
    name: '存档',
    category: 'save',
    icon: 'save',
    color: '#10b981',
    menuVisible: true,
    pins: [
      { key: 'in', name: '流入', typeId: 'flow', direction: 'input', required: true },
      { key: 'page', name: '页', typeId: 'int', direction: 'input', defaultValue: 1 },
      { key: 'index', name: '索引', typeId: 'int', direction: 'input', defaultValue: 1 },
      { key: 'success', name: '成功', typeId: 'flow', direction: 'output' },
      { key: 'failed', name: '失败', typeId: 'flow', direction: 'output' },
    ],
    onExecute: async (ctx, inputs) => {
      try {
        const page = Number(inputs.page ?? 1);
        const index = Number(inputs.index ?? 1);
        const sm = getSaveManager();
        const result = await sm.saveToSlot(page, index, ctx);
        return {
          nextPinKey: result.success ? 'success' : 'failed',
          waitInteraction: false,
          finished: false,
        };
      } catch {
        return { nextPinKey: 'failed', waitInteraction: false, finished: false };
      }
    },
  });

  // 快速存档
  registry.register({
    typeId: 'quick_save',
    name: '快速存档',
    category: 'save',
    icon: 'bookmark',
    color: '#10b981',
    menuVisible: true,
    pins: [
      { key: 'in', name: '流入', typeId: 'flow', direction: 'input', required: true },
      { key: 'out', name: '流出', typeId: 'flow', direction: 'output' },
    ],
    onExecute: async (ctx, _inputs) => {
      try {
        const sm = getSaveManager();
        await sm.quickSave(ctx);
        return { nextPinKey: 'out', waitInteraction: false, finished: false };
      } catch {
        return { nextPinKey: 'out', waitInteraction: false, finished: false };
      }
    },
  });

  // 读档
  registry.register({
    typeId: 'load_slot',
    name: '读档',
    category: 'save',
    icon: 'folder-open',
    color: '#10b981',
    menuVisible: true,
    pins: [
      { key: 'in', name: '流入', typeId: 'flow', direction: 'input', required: true },
      { key: 'page', name: '页', typeId: 'int', direction: 'input', defaultValue: 1 },
      { key: 'index', name: '索引', typeId: 'int', direction: 'input', defaultValue: 1 },
      { key: 'success', name: '成功', typeId: 'flow', direction: 'output' },
      { key: 'failed', name: '失败', typeId: 'flow', direction: 'output' },
    ],
    onExecute: async (ctx, inputs) => {
      try {
        const page = Number(inputs.page ?? 1);
        const index = Number(inputs.index ?? 1);
        const sm = getSaveManager();
        const result = await sm.loadFromSlot(page, index);
        if (result.success && result.data) {
          await sm.applySaveData(result.data, ctx);
          return { nextPinKey: 'success', waitInteraction: false, finished: false };
        }
        return { nextPinKey: 'failed', waitInteraction: false, finished: false };
      } catch {
        return { nextPinKey: 'failed', waitInteraction: false, finished: false };
      }
    },
  });

  // 快速读档
  registry.register({
    typeId: 'quick_load',
    name: '快速读档',
    category: 'save',
    icon: 'bookmark-check',
    color: '#10b981',
    menuVisible: true,
    pins: [
      { key: 'in', name: '流入', typeId: 'flow', direction: 'input', required: true },
      { key: 'out', name: '流出', typeId: 'flow', direction: 'output' },
    ],
    onExecute: async (ctx, _inputs) => {
      try {
        const sm = getSaveManager();
        const result = await sm.quickLoad();
        if (result.success && result.data) {
          await sm.applySaveData(result.data, ctx);
        }
        return { nextPinKey: 'out', waitInteraction: false, finished: false };
      } catch {
        return { nextPinKey: 'out', waitInteraction: false, finished: false };
      }
    },
  });

  // 删除存档
  registry.register({
    typeId: 'delete_slot',
    name: '删除存档',
    category: 'save',
    icon: 'trash-2',
    color: '#10b981',
    menuVisible: true,
    pins: [
      { key: 'in', name: '流入', typeId: 'flow', direction: 'input', required: true },
      { key: 'page', name: '页', typeId: 'int', direction: 'input', defaultValue: 1 },
      { key: 'index', name: '索引', typeId: 'int', direction: 'input', defaultValue: 1 },
      { key: 'out', name: '流出', typeId: 'flow', direction: 'output' },
    ],
    onExecute: async (_ctx, inputs) => {
      try {
        const page = Number(inputs.page ?? 1);
        const index = Number(inputs.index ?? 1);
        const sm = getSaveManager();
        await sm.deleteSlot(page, index);
        return { nextPinKey: 'out', waitInteraction: false, finished: false };
      } catch {
        return { nextPinKey: 'out', waitInteraction: false, finished: false };
      }
    },
  });
}
