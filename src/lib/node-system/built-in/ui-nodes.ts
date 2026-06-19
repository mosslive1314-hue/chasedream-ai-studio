// ChaseDream 节点系统 — UI 节点（3 种）
import type { NodeRegistry } from '../node-registry';

export function registerUiNodes(registry: NodeRegistry): void {
  // 显示UI
  registry.register({
    typeId: 'show_ui',
    name: '显示UI',
    category: 'ui',
    icon: 'panel-top',
    color: '#8b5cf6',
    menuVisible: true,
    pins: [
      { key: 'in', name: '流入', typeId: 'flow', direction: 'input', required: true },
      { key: 'ui_id', name: 'UI ID', typeId: 'string', direction: 'input', defaultValue: '' },
      { key: 'out', name: '流出', typeId: 'flow', direction: 'output' },
    ],
    onExecute: (ctx, inputs) => {
      ctx.setVariable(`__ui_visible_${inputs.ui_id}`, true);
      return { nextPinKey: 'out', waitInteraction: false, finished: false };
    },
  });

  // 调用UI（模态）
  registry.register({
    typeId: 'call_ui',
    name: '调用UI',
    category: 'ui',
    icon: 'app-window',
    color: '#8b5cf6',
    menuVisible: true,
    pins: [
      { key: 'in', name: '流入', typeId: 'flow', direction: 'input', required: true },
      { key: 'ui_id', name: 'UI ID', typeId: 'string', direction: 'input', defaultValue: '' },
      { key: 'out', name: '流出', typeId: 'flow', direction: 'output' },
    ],
    onExecute: (ctx, inputs) => {
      ctx.setVariable(`__ui_modal_${inputs.ui_id}`, true);
      return { nextPinKey: 'out', waitInteraction: true, finished: false };
    },
  });

  // 关闭UI
  registry.register({
    typeId: 'close_ui',
    name: '关闭UI',
    category: 'ui',
    icon: 'panel-bottom-close',
    color: '#8b5cf6',
    menuVisible: true,
    pins: [
      { key: 'in', name: '流入', typeId: 'flow', direction: 'input', required: true },
      { key: 'ui_id', name: 'UI ID', typeId: 'string', direction: 'input', defaultValue: '' },
      { key: 'out', name: '流出', typeId: 'flow', direction: 'output' },
    ],
    onExecute: (ctx, inputs) => {
      ctx.setVariable(`__ui_visible_${inputs.ui_id}`, false);
      ctx.setVariable(`__ui_modal_${inputs.ui_id}`, false);
      return { nextPinKey: 'out', waitInteraction: false, finished: false };
    },
  });
}
