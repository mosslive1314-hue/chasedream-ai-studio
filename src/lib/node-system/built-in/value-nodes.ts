// ChaseDream 节点系统 — 值节点（6 种）
// 常量节点，输出值从实例 pinValues 读取（由执行引擎 resolveOutputPin 处理）
import type { NodeRegistry } from '../node-registry';

export function registerValueNodes(registry: NodeRegistry): void {
  // 布尔常量
  registry.register({
    typeId: 'bool_value',
    name: '布尔值',
    category: 'value',
    icon: 'toggle-left',
    color: '#0ea5e9',
    menuVisible: true,
    pins: [
      { key: 'value', name: '值', typeId: 'bool', direction: 'output' },
    ],
    onExecute: (_ctx, _inputs) => ({
      waitInteraction: false,
      finished: false,
    }),
  });

  // 整数常量
  registry.register({
    typeId: 'int_value',
    name: '整数',
    category: 'value',
    icon: 'hash',
    color: '#0ea5e9',
    menuVisible: true,
    pins: [
      { key: 'value', name: '值', typeId: 'int', direction: 'output' },
    ],
    onExecute: (_ctx, _inputs) => ({
      waitInteraction: false,
      finished: false,
    }),
  });

  // 浮点常量
  registry.register({
    typeId: 'float_value',
    name: '浮点数',
    category: 'value',
    icon: 'hash',
    color: '#0ea5e9',
    menuVisible: true,
    pins: [
      { key: 'value', name: '值', typeId: 'float', direction: 'output' },
    ],
    onExecute: (_ctx, _inputs) => ({
      waitInteraction: false,
      finished: false,
    }),
  });

  // 字符串常量
  registry.register({
    typeId: 'string_value',
    name: '字符串',
    category: 'value',
    icon: 'type',
    color: '#0ea5e9',
    menuVisible: true,
    pins: [
      { key: 'value', name: '值', typeId: 'string', direction: 'output' },
    ],
    onExecute: (_ctx, _inputs) => ({
      waitInteraction: false,
      finished: false,
    }),
  });

  // 颜色常量
  registry.register({
    typeId: 'color_value',
    name: '颜色',
    category: 'value',
    icon: 'palette',
    color: '#0ea5e9',
    menuVisible: true,
    pins: [
      { key: 'value', name: '值', typeId: 'rgba', direction: 'output' },
    ],
    onExecute: (_ctx, _inputs) => ({
      waitInteraction: false,
      finished: false,
    }),
  });

  // 二维向量常量
  registry.register({
    typeId: 'vec2_value',
    name: '二维向量',
    category: 'value',
    icon: 'move',
    color: '#0ea5e9',
    menuVisible: true,
    pins: [
      { key: 'value', name: '值', typeId: 'vec2', direction: 'output' },
    ],
    onExecute: (_ctx, _inputs) => ({
      waitInteraction: false,
      finished: false,
    }),
  });
}
