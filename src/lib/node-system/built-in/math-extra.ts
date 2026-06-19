// ChaseDream 节点系统 — 数学扩展节点（3 种）
// 补全 VoidNovelEngine 中缺失的取整运算节点
import type { NodeRegistry } from '../node-registry';

export function registerMathExtraNodes(registry: NodeRegistry): void {
  // 向下取整
  registry.register({
    typeId: 'floor',
    name: '向下取整',
    category: 'logic',
    icon: 'chevrons-down',
    color: '#64748b',
    menuVisible: true,
    pins: [
      { key: 'a', name: 'A', typeId: 'float', direction: 'input', defaultValue: 0 },
      { key: 'result', name: '结果', typeId: 'int', direction: 'output' },
    ],
    onExecute: (_ctx, inputs) => ({
      waitInteraction: false,
      finished: false,
      outputs: { result: Math.floor(Number(inputs.a ?? 0)) },
    }),
  });

  // 向上取整
  registry.register({
    typeId: 'ceil',
    name: '向上取整',
    category: 'logic',
    icon: 'chevrons-up',
    color: '#64748b',
    menuVisible: true,
    pins: [
      { key: 'a', name: 'A', typeId: 'float', direction: 'input', defaultValue: 0 },
      { key: 'result', name: '结果', typeId: 'int', direction: 'output' },
    ],
    onExecute: (_ctx, inputs) => ({
      waitInteraction: false,
      finished: false,
      outputs: { result: Math.ceil(Number(inputs.a ?? 0)) },
    }),
  });

  // 四舍五入
  registry.register({
    typeId: 'round',
    name: '四舍五入',
    category: 'logic',
    icon: 'circle-dot',
    color: '#64748b',
    menuVisible: true,
    pins: [
      { key: 'a', name: 'A', typeId: 'float', direction: 'input', defaultValue: 0 },
      { key: 'result', name: '结果', typeId: 'int', direction: 'output' },
    ],
    onExecute: (_ctx, inputs) => ({
      waitInteraction: false,
      finished: false,
      outputs: { result: Math.round(Number(inputs.a ?? 0)) },
    }),
  });
}
