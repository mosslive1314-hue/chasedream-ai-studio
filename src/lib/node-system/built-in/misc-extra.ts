// ChaseDream 节点系统 — 杂项扩展节点（1 种）
// 补全 VoidNovelEngine 中缺失的调试输出节点
import type { NodeRegistry } from '../node-registry';

export function registerMiscExtraNodes(registry: NodeRegistry): void {
  // 打印到控制台（调试用）
  registry.register({
    typeId: 'print_console',
    name: '打印到控制台',
    category: 'misc',
    icon: 'terminal',
    color: '#94a3b8',
    menuVisible: true,
    pins: [
      { key: 'in', name: '流入', typeId: 'flow', direction: 'input', required: true },
      { key: 'value', name: '值', typeId: 'any', direction: 'input' },
      { key: 'out', name: '流出', typeId: 'flow', direction: 'output' },
    ],
    onExecute: (_ctx, inputs) => {
      console.log('[NodeGraph]', inputs.value);
      return { nextPinKey: 'out', waitInteraction: false, finished: false };
    },
  });
}
