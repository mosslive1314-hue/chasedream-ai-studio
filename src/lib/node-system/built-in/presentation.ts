// ChaseDream 节点系统 — 演出节点（9 种）
import type { NodeRegistry } from '../node-registry';

export function registerPresentationNodes(registry: NodeRegistry): void {
  // 显示对白
  registry.register({
    typeId: 'say',
    name: '对白',
    category: 'presentation',
    icon: 'message-circle',
    color: '#a855f7',
    menuVisible: true,
    pins: [
      { key: 'in', name: '流入', typeId: 'flow', direction: 'input', required: true },
      { key: 'speaker', name: '说话人', typeId: 'string', direction: 'input', defaultValue: '' },
      { key: 'text', name: '文本', typeId: 'string', direction: 'input', defaultValue: '' },
      { key: 'out', name: '流出', typeId: 'flow', direction: 'output' },
    ],
    onExecute: (ctx, inputs) => {
      ctx.setSubtitle(String(inputs.speaker ?? ''), String(inputs.text ?? ''));
      return { nextPinKey: 'out', waitInteraction: true, finished: false };
    },
  });

  // 旁白
  registry.register({
    typeId: 'narrate',
    name: '旁白',
    category: 'presentation',
    icon: 'align-left',
    color: '#a855f7',
    menuVisible: true,
    pins: [
      { key: 'in', name: '流入', typeId: 'flow', direction: 'input', required: true },
      { key: 'text', name: '文本', typeId: 'string', direction: 'input', defaultValue: '' },
      { key: 'out', name: '流出', typeId: 'flow', direction: 'output' },
    ],
    onExecute: (ctx, inputs) => {
      ctx.setSubtitle('', String(inputs.text ?? ''));
      return { nextPinKey: 'out', waitInteraction: true, finished: false };
    },
  });

  // 切换背景
  registry.register({
    typeId: 'switch_background',
    name: '切换背景',
    category: 'presentation',
    icon: 'image',
    color: '#a855f7',
    menuVisible: true,
    pins: [
      { key: 'in', name: '流入', typeId: 'flow', direction: 'input', required: true },
      { key: 'image_url', name: '图片', typeId: 'texture', direction: 'input', defaultValue: '' },
      { key: 'fade_time', name: '淡入时间', typeId: 'float', direction: 'input', defaultValue: 0.5 },
      { key: 'out', name: '流出', typeId: 'flow', direction: 'output' },
    ],
    onExecute: (ctx, inputs) => {
      ctx.setBackground(String(inputs.image_url ?? ''), Number(inputs.fade_time ?? 0.5));
      return { nextPinKey: 'out', waitInteraction: false, finished: false };
    },
  });

  // 添加立绘
  registry.register({
    typeId: 'add_foreground',
    name: '添加立绘',
    category: 'presentation',
    icon: 'user',
    color: '#a855f7',
    menuVisible: true,
    pins: [
      { key: 'in', name: '流入', typeId: 'flow', direction: 'input', required: true },
      { key: 'image_url', name: '图片', typeId: 'texture', direction: 'input', defaultValue: '' },
      { key: 'character_id', name: '角色ID', typeId: 'string', direction: 'input', defaultValue: '' },
      { key: 'x', name: 'X', typeId: 'float', direction: 'input', defaultValue: 0 },
      { key: 'y', name: 'Y', typeId: 'float', direction: 'input', defaultValue: 0 },
      { key: 'scale', name: '缩放', typeId: 'float', direction: 'input', defaultValue: 1 },
      { key: 'out', name: '流出', typeId: 'flow', direction: 'output' },
    ],
    onExecute: (ctx, inputs) => {
      const characterId = String(inputs.character_id ?? '');
      ctx.addForeground({
        id: `fg_${characterId}`,
        imageUrl: String(inputs.image_url ?? ''),
        characterId,
        x: Number(inputs.x ?? 0),
        y: Number(inputs.y ?? 0),
        scale: Number(inputs.scale ?? 1),
      });
      return { nextPinKey: 'out', waitInteraction: false, finished: false };
    },
  });

  // 移除立绘
  registry.register({
    typeId: 'remove_foreground',
    name: '移除立绘',
    category: 'presentation',
    icon: 'user-minus',
    color: '#a855f7',
    menuVisible: true,
    pins: [
      { key: 'in', name: '流入', typeId: 'flow', direction: 'input', required: true },
      { key: 'foreground_id', name: '立绘ID', typeId: 'string', direction: 'input', defaultValue: '' },
      { key: 'out', name: '流出', typeId: 'flow', direction: 'output' },
    ],
    onExecute: (ctx, inputs) => {
      ctx.removeForeground(String(inputs.foreground_id ?? ''));
      return { nextPinKey: 'out', waitInteraction: false, finished: false };
    },
  });

  // 显示遮幅
  registry.register({
    typeId: 'show_letterboxing',
    name: '显示遮幅',
    category: 'presentation',
    icon: 'rectangle-horizontal',
    color: '#a855f7',
    menuVisible: true,
    pins: [
      { key: 'in', name: '流入', typeId: 'flow', direction: 'input', required: true },
      { key: 'top', name: '上', typeId: 'float', direction: 'input', defaultValue: 0 },
      { key: 'bottom', name: '下', typeId: 'float', direction: 'input', defaultValue: 0 },
      { key: 'out', name: '流出', typeId: 'flow', direction: 'output' },
    ],
    onExecute: (ctx, inputs) => {
      ctx.setLetterboxing(Number(inputs.top ?? 0), Number(inputs.bottom ?? 0));
      return { nextPinKey: 'out', waitInteraction: false, finished: false };
    },
  });

  // 隐藏遮幅
  registry.register({
    typeId: 'hide_letterboxing',
    name: '隐藏遮幅',
    category: 'presentation',
    icon: 'rectangle-horizontal',
    color: '#a855f7',
    menuVisible: true,
    pins: [
      { key: 'in', name: '流入', typeId: 'flow', direction: 'input', required: true },
      { key: 'out', name: '流出', typeId: 'flow', direction: 'output' },
    ],
    onExecute: (ctx, _inputs) => {
      ctx.removeLetterboxing();
      return { nextPinKey: 'out', waitInteraction: false, finished: false };
    },
  });

  // 播放视频
  registry.register({
    typeId: 'play_video',
    name: '播放视频',
    category: 'presentation',
    icon: 'video',
    color: '#a855f7',
    menuVisible: true,
    pins: [
      { key: 'in', name: '流入', typeId: 'flow', direction: 'input', required: true },
      { key: 'video_url', name: '视频', typeId: 'video', direction: 'input', defaultValue: '' },
      { key: 'loop', name: '循环', typeId: 'bool', direction: 'input', defaultValue: false },
      { key: 'out', name: '流出', typeId: 'flow', direction: 'output' },
    ],
    onExecute: (ctx, inputs) => {
      ctx.setVariable('__playing_video', String(inputs.video_url ?? ''));
      ctx.setVariable('__video_loop', Boolean(inputs.loop ?? false));
      return { nextPinKey: 'out', waitInteraction: true, finished: false };
    },
  });

  // 等待互动
  registry.register({
    typeId: 'wait_interact',
    name: '等待互动',
    category: 'presentation',
    icon: 'hand',
    color: '#a855f7',
    menuVisible: true,
    pins: [
      { key: 'in', name: '流入', typeId: 'flow', direction: 'input', required: true },
      { key: 'out', name: '流出', typeId: 'flow', direction: 'output' },
    ],
    onExecute: (_ctx, _inputs) => ({
      nextPinKey: 'out',
      waitInteraction: true,
      finished: false,
    }),
  });
}
