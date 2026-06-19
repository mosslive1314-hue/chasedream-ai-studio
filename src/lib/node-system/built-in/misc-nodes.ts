// ChaseDream 节点系统 — 杂项节点（3 种）
import type { NodeRegistry } from '../node-registry';

export function registerMiscNodes(registry: NodeRegistry): void {
  // 延迟
  registry.register({
    typeId: 'delay',
    name: '延迟',
    category: 'misc',
    icon: 'clock',
    color: '#94a3b8',
    menuVisible: true,
    pins: [
      { key: 'in', name: '流入', typeId: 'flow', direction: 'input', required: true },
      { key: 'seconds', name: '秒数', typeId: 'float', direction: 'input', defaultValue: 1 },
      { key: 'out', name: '流出', typeId: 'flow', direction: 'output' },
    ],
    onExecute: (ctx, inputs) => {
      ctx.setVariable('__delay_seconds', Number(inputs.seconds ?? 1));
      return { nextPinKey: 'out', waitInteraction: true, finished: false };
    },
  });

  // 注释节点
  registry.register({
    typeId: 'comment',
    name: '注释',
    category: 'misc',
    icon: 'message-square',
    color: '#94a3b8',
    menuVisible: true,
    pins: [
      { key: 'in', name: '流入', typeId: 'flow', direction: 'input', required: true },
      { key: 'out', name: '流出', typeId: 'flow', direction: 'output' },
    ],
    onExecute: (_ctx, _inputs) => ({
      nextPinKey: 'out',
      waitInteraction: false,
      finished: false,
    }),
  });

  // 结局
  registry.register({
    typeId: 'ending',
    name: '结局',
    category: 'misc',
    icon: 'flag',
    color: '#ef4444',
    menuVisible: true,
    pins: [
      { key: 'in', name: '流入', typeId: 'flow', direction: 'input', required: true },
      { key: 'ending_type', name: '结局类型', typeId: 'string', direction: 'input', defaultValue: 'good' },
      { key: 'out', name: '流出', typeId: 'flow', direction: 'output' },
    ],
    onExecute: (ctx, inputs) => {
      ctx.setVariable('__ending_type', String(inputs.ending_type ?? 'good'));
      return { nextPinKey: 'out', waitInteraction: false, finished: true };
    },
  });
}
