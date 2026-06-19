// ChaseDream 节点系统 — 值节点扩展（2 种）
// 补全 VoidNovelEngine 中缺失的随机数与向量拼装节点
import type { NodeRegistry } from '../node-registry';

export function registerValueExtraNodes(registry: NodeRegistry): void {
  // 随机整数：返回 [min, max] 区间内的随机整数
  registry.register({
    typeId: 'random_int',
    name: '随机整数',
    category: 'value',
    icon: 'dices',
    color: '#0ea5e9',
    menuVisible: true,
    pins: [
      { key: 'min', name: '最小值', typeId: 'int', direction: 'input', defaultValue: 0 },
      { key: 'max', name: '最大值', typeId: 'int', direction: 'input', defaultValue: 100 },
      { key: 'value', name: '值', typeId: 'int', direction: 'output' },
    ],
    onExecute: (_ctx, inputs) => {
      const min = Math.floor(Number(inputs.min ?? 0));
      const max = Math.floor(Number(inputs.max ?? 0));
      // Math.random() 返回 [0, 1)，+1 保证 max 能被取到
      const value = Math.floor(Math.random() * (max - min + 1)) + min;
      return { waitInteraction: false, finished: false, outputs: { value } };
    },
  });

  // 拼装二维向量：将两个浮点数组合成 vec2
  registry.register({
    typeId: 'make_vec2',
    name: '拼装二维向量',
    category: 'value',
    icon: 'move',
    color: '#0ea5e9',
    menuVisible: true,
    pins: [
      { key: 'x', name: 'X', typeId: 'float', direction: 'input', defaultValue: 0 },
      { key: 'y', name: 'Y', typeId: 'float', direction: 'input', defaultValue: 0 },
      { key: 'value', name: '值', typeId: 'vec2', direction: 'output' },
    ],
    onExecute: (_ctx, inputs) => {
      const x = Number(inputs.x ?? 0);
      const y = Number(inputs.y ?? 0);
      return { waitInteraction: false, finished: false, outputs: { value: { x, y } } };
    },
  });
}
