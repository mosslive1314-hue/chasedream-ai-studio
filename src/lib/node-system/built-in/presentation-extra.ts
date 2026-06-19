// ChaseDream 节点系统 — 演出扩展节点（8 种）
// 补全 VoidNovelEngine 中缺失的演出控制节点
import type { NodeRegistry } from '../node-registry';

export function registerPresentationExtraNodes(registry: NodeRegistry): void {
  // 移动前景图片
  registry.register({
    typeId: 'move_foreground',
    name: '移动前景',
    category: 'presentation',
    icon: 'move',
    color: '#a855f7',
    menuVisible: true,
    pins: [
      { key: 'in', name: '流入', typeId: 'flow', direction: 'input', required: true },
      { key: 'foreground_id', name: '前景ID', typeId: 'string', direction: 'input', defaultValue: '' },
      { key: 'position', name: '位置', typeId: 'vec2', direction: 'input', defaultValue: { x: 0, y: 0 } },
      { key: 'duration', name: '时长', typeId: 'float', direction: 'input', defaultValue: 0.5 },
      { key: 'out', name: '流出', typeId: 'flow', direction: 'output' },
    ],
    onExecute: (ctx, inputs) => {
      const foregroundId = String(inputs.foreground_id ?? '');
      const position = inputs.position ?? { x: 0, y: 0 };
      const duration = Number(inputs.duration ?? 0.5);
      // 存储移动指令供运行时渲染层消费（对象值需 as any 绕过类型限制）
      ctx.setVariable(`__fg_move_${foregroundId}`, { position, duration } as any);
      return { nextPinKey: 'out', waitInteraction: false, finished: false };
    },
  });

  // 淡入转场
  registry.register({
    typeId: 'fade_in',
    name: '淡入',
    category: 'presentation',
    icon: 'arrow-down-to-line',
    color: '#a855f7',
    menuVisible: true,
    pins: [
      { key: 'in', name: '流入', typeId: 'flow', direction: 'input', required: true },
      { key: 'duration', name: '时长', typeId: 'float', direction: 'input', defaultValue: 0.5 },
      { key: 'wait_interaction', name: '等待互动', typeId: 'bool', direction: 'input', defaultValue: false },
      { key: 'out', name: '流出', typeId: 'flow', direction: 'output' },
    ],
    onExecute: (ctx, inputs) => {
      ctx.applyEffect('fade_in');
      return { nextPinKey: 'out', waitInteraction: Boolean(inputs.wait_interaction ?? false), finished: false };
    },
  });

  // 淡出转场
  registry.register({
    typeId: 'fade_out',
    name: '淡出',
    category: 'presentation',
    icon: 'arrow-up-from-line',
    color: '#a855f7',
    menuVisible: true,
    pins: [
      { key: 'in', name: '流入', typeId: 'flow', direction: 'input', required: true },
      { key: 'duration', name: '时长', typeId: 'float', direction: 'input', defaultValue: 0.5 },
      { key: 'wait_interaction', name: '等待互动', typeId: 'bool', direction: 'input', defaultValue: false },
      { key: 'out', name: '流出', typeId: 'flow', direction: 'output' },
    ],
    onExecute: (ctx, inputs) => {
      ctx.applyEffect('fade_out');
      return { nextPinKey: 'out', waitInteraction: Boolean(inputs.wait_interaction ?? false), finished: false };
    },
  });

  // 显示字幕
  registry.register({
    typeId: 'show_subtitle',
    name: '显示字幕',
    category: 'presentation',
    icon: 'subtitles',
    color: '#a855f7',
    menuVisible: true,
    pins: [
      { key: 'in', name: '流入', typeId: 'flow', direction: 'input', required: true },
      { key: 'text', name: '文本', typeId: 'string', direction: 'input', defaultValue: '' },
      { key: 'char_interval', name: '字间隔', typeId: 'float', direction: 'input', defaultValue: 0.05 },
      { key: 'bottom_distance', name: '底部距离', typeId: 'float', direction: 'input', defaultValue: 100 },
      { key: 'font', name: '字体', typeId: 'string', direction: 'input', defaultValue: '' },
      { key: 'font_size', name: '字号', typeId: 'int', direction: 'input', defaultValue: 24 },
      { key: 'color', name: '颜色', typeId: 'rgba', direction: 'input', defaultValue: { r: 255, g: 255, b: 255, a: 1 } },
      { key: 'out', name: '流出', typeId: 'flow', direction: 'output' },
    ],
    onExecute: (ctx, inputs) => {
      // 复用 setSubtitle，speaker 留空，text 即字幕内容
      ctx.setSubtitle('', String(inputs.text ?? ''));
      return { nextPinKey: 'out', waitInteraction: false, finished: false };
    },
  });

  // 隐藏字幕
  registry.register({
    typeId: 'hide_subtitle',
    name: '隐藏字幕',
    category: 'presentation',
    icon: 'subtitles-off',
    color: '#a855f7',
    menuVisible: true,
    pins: [
      { key: 'in', name: '流入', typeId: 'flow', direction: 'input', required: true },
      { key: 'out', name: '流出', typeId: 'flow', direction: 'output' },
    ],
    onExecute: (ctx, _inputs) => {
      ctx.clearSubtitle();
      return { nextPinKey: 'out', waitInteraction: false, finished: false };
    },
  });

  // 显示对话框
  registry.register({
    typeId: 'show_dialog_box',
    name: '显示对话框',
    category: 'presentation',
    icon: 'square-message',
    color: '#a855f7',
    menuVisible: true,
    pins: [
      { key: 'in', name: '流入', typeId: 'flow', direction: 'input', required: true },
      { key: 'role', name: '角色', typeId: 'string', direction: 'input', defaultValue: '' },
      { key: 'text', name: '文本', typeId: 'string', direction: 'input', defaultValue: '' },
      { key: 'position', name: '位置', typeId: 'vec2', direction: 'input', defaultValue: { x: 0, y: 0 } },
      { key: 'width', name: '宽度', typeId: 'float', direction: 'input', defaultValue: 400 },
      { key: 'fade_time', name: '淡入时间', typeId: 'float', direction: 'input', defaultValue: 0.3 },
      { key: 'out', name: '流出', typeId: 'flow', direction: 'output' },
      { key: 'dialog_box', name: '对话框', typeId: 'string', direction: 'output' },
    ],
    onExecute: (ctx, inputs) => {
      // 复用 setSubtitle，role 作为说话人，text 为对白内容
      ctx.setSubtitle(String(inputs.role ?? ''), String(inputs.text ?? ''));
      return { nextPinKey: 'out', waitInteraction: false, finished: false };
    },
  });

  // 隐藏对话框
  registry.register({
    typeId: 'hide_dialog_box',
    name: '隐藏对话框',
    category: 'presentation',
    icon: 'square-x',
    color: '#a855f7',
    menuVisible: true,
    pins: [
      { key: 'in', name: '流入', typeId: 'flow', direction: 'input', required: true },
      { key: 'dialog_box_id', name: '对话框ID', typeId: 'string', direction: 'input', defaultValue: '' },
      { key: 'out', name: '流出', typeId: 'flow', direction: 'output' },
    ],
    onExecute: (ctx, _inputs) => {
      ctx.clearSubtitle();
      return { nextPinKey: 'out', waitInteraction: false, finished: false };
    },
  });

  // 显示分支按钮
  registry.register({
    typeId: 'show_choice_button',
    name: '分支选择',
    category: 'presentation',
    icon: 'list-choice',
    color: '#a855f7',
    menuVisible: true,
    pins: [
      { key: 'in', name: '流入', typeId: 'flow', direction: 'input', required: true },
      { key: 'choice_text_1', name: '选项1', typeId: 'string', direction: 'input', defaultValue: '' },
      { key: 'choice_text_2', name: '选项2', typeId: 'string', direction: 'input', defaultValue: '' },
      { key: 'choice_text_3', name: '选项3', typeId: 'string', direction: 'input', defaultValue: '' },
      { key: 'choice_text_4', name: '选项4', typeId: 'string', direction: 'input', defaultValue: '' },
      { key: 'choice_text_5', name: '选项5', typeId: 'string', direction: 'input', defaultValue: '' },
      { key: 'choice1', name: '选项1', typeId: 'flow', direction: 'output' },
      { key: 'choice2', name: '选项2', typeId: 'flow', direction: 'output' },
      { key: 'choice3', name: '选项3', typeId: 'flow', direction: 'output' },
      { key: 'choice4', name: '选项4', typeId: 'flow', direction: 'output' },
      { key: 'choice5', name: '选项5', typeId: 'flow', direction: 'output' },
    ],
    onExecute: (_ctx, _inputs) => {
      // 等待玩家选择，nextPinKey 由运行时根据玩家选择设置
      return { waitInteraction: true, finished: false };
    },
  });
}
