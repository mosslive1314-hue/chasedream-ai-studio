// ChaseDream 节点系统 — 变量节点（4 种）
import type { NodeRegistry } from '../node-registry';

export function registerVariableNodes(registry: NodeRegistry): void {
  // 获取变量
  registry.register({
    typeId: 'get_variable',
    name: '获取变量',
    category: 'variable',
    icon: 'variable',
    color: '#ec4899',
    menuVisible: true,
    pins: [
      { key: 'var_id', name: '变量ID', typeId: 'string', direction: 'input', defaultValue: '' },
      { key: 'value', name: '值', typeId: 'any', direction: 'output' },
    ],
    onExecute: (ctx, inputs) => ({
      waitInteraction: false,
      finished: false,
      outputs: { value: ctx.getVariable(String(inputs.var_id ?? '')) },
    }),
  });

  // 设置变量
  registry.register({
    typeId: 'set_variable',
    name: '设置变量',
    category: 'variable',
    icon: 'pencil',
    color: '#ec4899',
    menuVisible: true,
    pins: [
      { key: 'in', name: '流入', typeId: 'flow', direction: 'input', required: true },
      { key: 'var_id', name: '变量ID', typeId: 'string', direction: 'input', defaultValue: '' },
      { key: 'value', name: '值', typeId: 'any', direction: 'input' },
      { key: 'out', name: '流出', typeId: 'flow', direction: 'output' },
    ],
    onExecute: (ctx, inputs) => {
      const v = inputs.value;
      // SceneContext 仅支持 number | string | boolean
      if (typeof v === 'number' || typeof v === 'string' || typeof v === 'boolean') {
        ctx.setVariable(String(inputs.var_id ?? ''), v);
      }
      return { nextPinKey: 'out', waitInteraction: false, finished: false };
    },
  });

  // 获取全局变量
  registry.register({
    typeId: 'get_global',
    name: '获取全局变量',
    category: 'variable',
    icon: 'globe',
    color: '#ec4899',
    menuVisible: true,
    pins: [
      { key: 'key', name: '键', typeId: 'string', direction: 'input', defaultValue: '' },
      { key: 'value', name: '值', typeId: 'any', direction: 'output' },
    ],
    onExecute: (ctx, inputs) => ({
      waitInteraction: false,
      finished: false,
      outputs: { value: ctx.getVariable(`__global_${inputs.key}`) },
    }),
  });

  // 设置全局变量
  registry.register({
    typeId: 'set_global',
    name: '设置全局变量',
    category: 'variable',
    icon: 'globe-2',
    color: '#ec4899',
    menuVisible: true,
    pins: [
      { key: 'in', name: '流入', typeId: 'flow', direction: 'input', required: true },
      { key: 'key', name: '键', typeId: 'string', direction: 'input', defaultValue: '' },
      { key: 'value', name: '值', typeId: 'any', direction: 'input' },
      { key: 'out', name: '流出', typeId: 'flow', direction: 'output' },
    ],
    onExecute: (ctx, inputs) => {
      const v = inputs.value;
      if (typeof v === 'number' || typeof v === 'string' || typeof v === 'boolean') {
        ctx.setVariable(`__global_${inputs.key}`, v);
      }
      return { nextPinKey: 'out', waitInteraction: false, finished: false };
    },
  });
}
