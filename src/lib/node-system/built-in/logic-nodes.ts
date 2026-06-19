// ChaseDream 节点系统 — 逻辑节点（8 种）
// 纯计算节点，通过 outputs 返回结果供下游引脚读取
import type { NodeRegistry } from '../node-registry';

export function registerLogicNodes(registry: NodeRegistry): void {
  // 比较
  registry.register({
    typeId: 'compare',
    name: '比较',
    category: 'logic',
    icon: 'equal',
    color: '#64748b',
    menuVisible: true,
    pins: [
      { key: 'a', name: 'A', typeId: 'any', direction: 'input' },
      { key: 'b', name: 'B', typeId: 'any', direction: 'input' },
      { key: 'op', name: '运算符', typeId: 'string', direction: 'input', defaultValue: '==' },
      { key: 'result', name: '结果', typeId: 'bool', direction: 'output' },
    ],
    onExecute: (_ctx, inputs) => {
      const a = inputs.a;
      const b = inputs.b;
      const op = String(inputs.op ?? '==');
      let result = false;
      switch (op) {
        case '==': result = a === b; break;
        case '!=': result = a !== b; break;
        case '>': result = Number(a) > Number(b); break;
        case '<': result = Number(a) < Number(b); break;
        case '>=': result = Number(a) >= Number(b); break;
        case '<=': result = Number(a) <= Number(b); break;
      }
      return { waitInteraction: false, finished: false, outputs: { result } };
    },
  });

  // 逻辑与
  registry.register({
    typeId: 'and',
    name: '与',
    category: 'logic',
    icon: 'ampersand',
    color: '#64748b',
    menuVisible: true,
    pins: [
      { key: 'a', name: 'A', typeId: 'bool', direction: 'input', defaultValue: false },
      { key: 'b', name: 'B', typeId: 'bool', direction: 'input', defaultValue: false },
      { key: 'result', name: '结果', typeId: 'bool', direction: 'output' },
    ],
    onExecute: (_ctx, inputs) => ({
      waitInteraction: false,
      finished: false,
      outputs: { result: Boolean(inputs.a) && Boolean(inputs.b) },
    }),
  });

  // 逻辑或
  registry.register({
    typeId: 'or',
    name: '或',
    category: 'logic',
    icon: 'separator-vertical',
    color: '#64748b',
    menuVisible: true,
    pins: [
      { key: 'a', name: 'A', typeId: 'bool', direction: 'input', defaultValue: false },
      { key: 'b', name: 'B', typeId: 'bool', direction: 'input', defaultValue: false },
      { key: 'result', name: '结果', typeId: 'bool', direction: 'output' },
    ],
    onExecute: (_ctx, inputs) => ({
      waitInteraction: false,
      finished: false,
      outputs: { result: Boolean(inputs.a) || Boolean(inputs.b) },
    }),
  });

  // 逻辑非
  registry.register({
    typeId: 'not',
    name: '非',
    category: 'logic',
    icon: 'ban',
    color: '#64748b',
    menuVisible: true,
    pins: [
      { key: 'a', name: 'A', typeId: 'bool', direction: 'input', defaultValue: false },
      { key: 'result', name: '结果', typeId: 'bool', direction: 'output' },
    ],
    onExecute: (_ctx, inputs) => ({
      waitInteraction: false,
      finished: false,
      outputs: { result: !Boolean(inputs.a) },
    }),
  });

  // 加法
  registry.register({
    typeId: 'add',
    name: '加法',
    category: 'logic',
    icon: 'plus',
    color: '#64748b',
    menuVisible: true,
    pins: [
      { key: 'a', name: 'A', typeId: 'float', direction: 'input', defaultValue: 0 },
      { key: 'b', name: 'B', typeId: 'float', direction: 'input', defaultValue: 0 },
      { key: 'result', name: '结果', typeId: 'float', direction: 'output' },
    ],
    onExecute: (_ctx, inputs) => ({
      waitInteraction: false,
      finished: false,
      outputs: { result: Number(inputs.a) + Number(inputs.b) },
    }),
  });

  // 减法
  registry.register({
    typeId: 'subtract',
    name: '减法',
    category: 'logic',
    icon: 'minus',
    color: '#64748b',
    menuVisible: true,
    pins: [
      { key: 'a', name: 'A', typeId: 'float', direction: 'input', defaultValue: 0 },
      { key: 'b', name: 'B', typeId: 'float', direction: 'input', defaultValue: 0 },
      { key: 'result', name: '结果', typeId: 'float', direction: 'output' },
    ],
    onExecute: (_ctx, inputs) => ({
      waitInteraction: false,
      finished: false,
      outputs: { result: Number(inputs.a) - Number(inputs.b) },
    }),
  });

  // 乘法
  registry.register({
    typeId: 'multiply',
    name: '乘法',
    category: 'logic',
    icon: 'x',
    color: '#64748b',
    menuVisible: true,
    pins: [
      { key: 'a', name: 'A', typeId: 'float', direction: 'input', defaultValue: 0 },
      { key: 'b', name: 'B', typeId: 'float', direction: 'input', defaultValue: 0 },
      { key: 'result', name: '结果', typeId: 'float', direction: 'output' },
    ],
    onExecute: (_ctx, inputs) => ({
      waitInteraction: false,
      finished: false,
      outputs: { result: Number(inputs.a) * Number(inputs.b) },
    }),
  });

  // 除法
  registry.register({
    typeId: 'divide',
    name: '除法',
    category: 'logic',
    icon: 'divide',
    color: '#64748b',
    menuVisible: true,
    pins: [
      { key: 'a', name: 'A', typeId: 'float', direction: 'input', defaultValue: 0 },
      { key: 'b', name: 'B', typeId: 'float', direction: 'input', defaultValue: 1 },
      { key: 'result', name: '结果', typeId: 'float', direction: 'output' },
    ],
    onExecute: (_ctx, inputs) => {
      const b = Number(inputs.b);
      const result = b === 0 ? 0 : Number(inputs.a) / b;
      return { waitInteraction: false, finished: false, outputs: { result } };
    },
  });
}
