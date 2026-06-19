// ChaseDream 节点系统 — 界面逻辑节点（5 种）
// UI 事件触发节点，作为事件入口监听界面交互
import type { NodeRegistry } from '../node-registry';

export function registerUiLogicNodes(registry: NodeRegistry): void {
  // 界面打开后（事件触发节点，无 flow 输入）
  registry.register({
    typeId: 'on_ui_opened',
    name: '界面打开后',
    category: 'ui',
    icon: 'panel-top-open',
    color: '#8b5cf6',
    menuVisible: true,
    pins: [
      { key: 'ui_id', name: 'UI ID', typeId: 'string', direction: 'input', defaultValue: '' },
      { key: 'out', name: '流出', typeId: 'flow', direction: 'output' },
    ],
    onExecute: (_ctx, _inputs) => ({
      nextPinKey: 'out',
      waitInteraction: false,
      finished: false,
    }),
  });

  // 界面关闭后
  registry.register({
    typeId: 'on_ui_closed',
    name: '界面关闭后',
    category: 'ui',
    icon: 'panel-bottom-close',
    color: '#8b5cf6',
    menuVisible: true,
    pins: [
      { key: 'ui_id', name: 'UI ID', typeId: 'string', direction: 'input', defaultValue: '' },
      { key: 'out', name: '流出', typeId: 'flow', direction: 'output' },
    ],
    onExecute: (_ctx, _inputs) => ({
      nextPinKey: 'out',
      waitInteraction: false,
      finished: false,
    }),
  });

  // 组件被点击
  registry.register({
    typeId: 'on_component_clicked',
    name: '组件被点击',
    category: 'ui',
    icon: 'mouse-pointer-click',
    color: '#8b5cf6',
    menuVisible: true,
    pins: [
      { key: 'ui_id', name: 'UI ID', typeId: 'string', direction: 'input', defaultValue: '' },
      { key: 'component_name', name: '组件名', typeId: 'string', direction: 'input', defaultValue: '' },
      { key: 'out', name: '流出', typeId: 'flow', direction: 'output' },
    ],
    onExecute: (_ctx, _inputs) => ({
      nextPinKey: 'out',
      waitInteraction: false,
      finished: false,
    }),
  });

  // 组件被悬停
  registry.register({
    typeId: 'on_component_hover',
    name: '组件被悬停',
    category: 'ui',
    icon: 'mouse-pointer',
    color: '#8b5cf6',
    menuVisible: true,
    pins: [
      { key: 'ui_id', name: 'UI ID', typeId: 'string', direction: 'input', defaultValue: '' },
      { key: 'component_name', name: '组件名', typeId: 'string', direction: 'input', defaultValue: '' },
      { key: 'out', name: '流出', typeId: 'flow', direction: 'output' },
    ],
    onExecute: (_ctx, _inputs) => ({
      nextPinKey: 'out',
      waitInteraction: false,
      finished: false,
    }),
  });

  // 组件结束悬停
  registry.register({
    typeId: 'on_component_hover_end',
    name: '组件结束悬停',
    category: 'ui',
    icon: 'mouse-pointer-off',
    color: '#8b5cf6',
    menuVisible: true,
    pins: [
      { key: 'ui_id', name: 'UI ID', typeId: 'string', direction: 'input', defaultValue: '' },
      { key: 'component_name', name: '组件名', typeId: 'string', direction: 'input', defaultValue: '' },
      { key: 'out', name: '流出', typeId: 'flow', direction: 'output' },
    ],
    onExecute: (_ctx, _inputs) => ({
      nextPinKey: 'out',
      waitInteraction: false,
      finished: false,
    }),
  });
}
