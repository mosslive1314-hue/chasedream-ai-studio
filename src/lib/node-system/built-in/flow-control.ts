// ChaseDream 节点系统 — 流程控制节点（5 种）
import type { NodeRegistry } from '../node-registry';

export function registerFlowControlNodes(registry: NodeRegistry): void {
  // 入口节点：无输入引脚，一个 flow 输出
  registry.register({
    typeId: 'entry',
    name: '入口',
    category: 'flow_control',
    icon: 'play',
    color: '#22c55e',
    menuVisible: true,
    pins: [
      { key: 'out', name: '流出', typeId: 'flow', direction: 'output' },
    ],
    onExecute: (_ctx, _inputs) => ({
      nextPinKey: 'out',
      waitInteraction: false,
      finished: false,
    }),
  });

  // 分支判断：输入 flow + bool condition，输出 true_route + false_route
  registry.register({
    typeId: 'branch',
    name: '分支',
    category: 'flow_control',
    icon: 'git-branch',
    color: '#3b82f6',
    menuVisible: true,
    pins: [
      { key: 'in', name: '流入', typeId: 'flow', direction: 'input', required: true },
      { key: 'condition', name: '条件', typeId: 'bool', direction: 'input', defaultValue: false },
      { key: 'true_route', name: '真', typeId: 'flow', direction: 'output' },
      { key: 'false_route', name: '假', typeId: 'flow', direction: 'output' },
    ],
    onExecute: (_ctx, inputs) => {
      const condition = inputs.condition ?? false;
      return {
        nextPinKey: condition ? 'true_route' : 'false_route',
        waitInteraction: false,
        finished: false,
      };
    },
  });

  // 循环：输入 flow + int maxIterations，输出 loop_body + exit
  registry.register({
    typeId: 'loop',
    name: '循环',
    category: 'flow_control',
    icon: 'repeat',
    color: '#3b82f6',
    menuVisible: true,
    pins: [
      { key: 'in', name: '流入', typeId: 'flow', direction: 'input', required: true },
      { key: 'max_iterations', name: '最大次数', typeId: 'int', direction: 'input', defaultValue: 1 },
      { key: 'loop_body', name: '循环体', typeId: 'flow', direction: 'output' },
      { key: 'exit', name: '退出', typeId: 'flow', direction: 'output' },
    ],
    onExecute: (ctx, inputs) => {
      const max = Number(inputs.max_iterations ?? 1);
      const key = `__loop_count_${ctx.getCurrentNodeId()}`;
      const count = Number(ctx.getVariable(key) ?? 0);
      if (count < max) {
        ctx.setVariable(key, count + 1);
        return { nextPinKey: 'loop_body', waitInteraction: false, finished: false };
      }
      ctx.setVariable(key, 0);
      return { nextPinKey: 'exit', waitInteraction: false, finished: false };
    },
  });

  // 跳转：输入 flow + string targetLabel，输出 flow
  registry.register({
    typeId: 'jump',
    name: '跳转',
    category: 'flow_control',
    icon: 'corner-down-right',
    color: '#3b82f6',
    menuVisible: true,
    pins: [
      { key: 'in', name: '流入', typeId: 'flow', direction: 'input', required: true },
      { key: 'target_label', name: '目标标签', typeId: 'string', direction: 'input', defaultValue: '' },
      { key: 'out', name: '流出', typeId: 'flow', direction: 'output' },
    ],
    onExecute: (ctx, inputs) => {
      ctx.setVariable('__jump_target', String(inputs.target_label ?? ''));
      return { nextPinKey: 'out', waitInteraction: false, finished: false };
    },
  });

  // 切换场景：输入 flow + string sceneId，输出 flow
  registry.register({
    typeId: 'switch_scene',
    name: '切换场景',
    category: 'flow_control',
    icon: 'layers',
    color: '#3b82f6',
    menuVisible: true,
    pins: [
      { key: 'in', name: '流入', typeId: 'flow', direction: 'input', required: true },
      { key: 'scene_id', name: '场景ID', typeId: 'string', direction: 'input', defaultValue: '' },
      { key: 'out', name: '流出', typeId: 'flow', direction: 'output' },
    ],
    onExecute: (ctx, inputs) => {
      ctx.setVariable('__current_scene_id', String(inputs.scene_id ?? ''));
      return { nextPinKey: 'out', waitInteraction: false, finished: false };
    },
  });
}
