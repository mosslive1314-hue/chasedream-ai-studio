// ChaseDream 节点系统 — 音频节点（4 种）
import type { NodeRegistry } from '../node-registry';

export function registerAudioNodes(registry: NodeRegistry): void {
  // 播放BGM
  registry.register({
    typeId: 'play_bgm',
    name: '播放BGM',
    category: 'audio',
    icon: 'music',
    color: '#f59e0b',
    menuVisible: true,
    pins: [
      { key: 'in', name: '流入', typeId: 'flow', direction: 'input', required: true },
      { key: 'url', name: '音频', typeId: 'audio', direction: 'input', defaultValue: '' },
      { key: 'volume', name: '音量', typeId: 'float', direction: 'input', defaultValue: 0.8 },
      { key: 'out', name: '流出', typeId: 'flow', direction: 'output' },
    ],
    onExecute: (ctx, inputs) => {
      ctx.playBgm(String(inputs.url ?? ''), Number(inputs.volume ?? 0.8));
      return { nextPinKey: 'out', waitInteraction: false, finished: false };
    },
  });

  // 停止BGM
  registry.register({
    typeId: 'stop_bgm',
    name: '停止BGM',
    category: 'audio',
    icon: 'music-2',
    color: '#f59e0b',
    menuVisible: true,
    pins: [
      { key: 'in', name: '流入', typeId: 'flow', direction: 'input', required: true },
      { key: 'fade_time', name: '淡出时间', typeId: 'float', direction: 'input', defaultValue: 0 },
      { key: 'out', name: '流出', typeId: 'flow', direction: 'output' },
    ],
    onExecute: (ctx, _inputs) => {
      ctx.stopBgm();
      return { nextPinKey: 'out', waitInteraction: false, finished: false };
    },
  });

  // 播放音效
  registry.register({
    typeId: 'play_sfx',
    name: '播放音效',
    category: 'audio',
    icon: 'volume-2',
    color: '#f59e0b',
    menuVisible: true,
    pins: [
      { key: 'in', name: '流入', typeId: 'flow', direction: 'input', required: true },
      { key: 'url', name: '音频', typeId: 'audio', direction: 'input', defaultValue: '' },
      { key: 'volume', name: '音量', typeId: 'float', direction: 'input', defaultValue: 1 },
      { key: 'out', name: '流出', typeId: 'flow', direction: 'output' },
    ],
    onExecute: (ctx, inputs) => {
      ctx.playSfx(String(inputs.url ?? ''));
      return { nextPinKey: 'out', waitInteraction: false, finished: false };
    },
  });

  // 停止所有音频
  registry.register({
    typeId: 'stop_all_audio',
    name: '停止所有音频',
    category: 'audio',
    icon: 'volume-x',
    color: '#f59e0b',
    menuVisible: true,
    pins: [
      { key: 'in', name: '流入', typeId: 'flow', direction: 'input', required: true },
      { key: 'out', name: '流出', typeId: 'flow', direction: 'output' },
    ],
    onExecute: (ctx, _inputs) => {
      ctx.stopBgm();
      return { nextPinKey: 'out', waitInteraction: false, finished: false };
    },
  });
}
