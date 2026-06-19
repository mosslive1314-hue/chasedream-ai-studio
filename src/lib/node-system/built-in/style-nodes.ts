// ChaseDream 节点系统 — 样式节点（2 种）
import type { NodeRegistry } from '../node-registry';

export function registerStyleNodes(registry: NodeRegistry): void {
  // 设置样式
  registry.register({
    typeId: 'set_style',
    name: '设置样式',
    category: 'style',
    icon: 'paintbrush',
    color: '#14b8a6',
    menuVisible: true,
    pins: [
      { key: 'in', name: '流入', typeId: 'flow', direction: 'input', required: true },
      { key: 'style_id', name: '样式ID', typeId: 'string', direction: 'input', defaultValue: '' },
      { key: 'out', name: '流出', typeId: 'flow', direction: 'output' },
    ],
    onExecute: (ctx, inputs) => {
      ctx.setVariable('__current_style', String(inputs.style_id ?? ''));
      return { nextPinKey: 'out', waitInteraction: false, finished: false };
    },
  });

  // 清除样式
  registry.register({
    typeId: 'clear_style',
    name: '清除样式',
    category: 'style',
    icon: 'eraser',
    color: '#14b8a6',
    menuVisible: true,
    pins: [
      { key: 'in', name: '流入', typeId: 'flow', direction: 'input', required: true },
      { key: 'out', name: '流出', typeId: 'flow', direction: 'output' },
    ],
    onExecute: (ctx, _inputs) => {
      ctx.setVariable('__current_style', '');
      return { nextPinKey: 'out', waitInteraction: false, finished: false };
    },
  });
}
