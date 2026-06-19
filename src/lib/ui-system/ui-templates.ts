/**
 * 内置 UI 模板 — 6 个常用界面定义
 * 借鉴 VoidNovelEngine 的 .ui 系统，每个模板导出为 UIDefinition
 */

import type { UIDefinition, UIElement, UIElementType } from './ui-types';
import type { UIManager } from './ui-manager';

/** 快速构造 UI 元素的辅助函数 */
function el(
  id: string,
  type: UIElementType,
  extra: Partial<UIElement> = {},
): UIElement {
  return { id, type, ...extra };
}

/** 通用按钮样式 */
const btnStyle: Record<string, string | number> = {
  padding: '12px 24px', borderRadius: 8, backgroundColor: 'rgba(94, 80, 232, 0.2)',
  color: '#fff', border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer',
  fontSize: 16, minWidth: 200, backdropFilter: 'blur(10px)',
};

/** 主菜单 — 开始游戏、继续游戏、存档、设置、退出 */
export const mainMenu: UIDefinition = {
  id: 'main_menu', name: '主菜单', modal: false, closable: false, animation: 'fade',
  root: el('container', 'panel', {
    layout: 'vertical',
    className: 'flex flex-col items-center justify-center gap-3 min-h-screen bg-black/80',
    children: [
      el('title', 'label', { text: '游戏标题', style: { fontSize: 36, color: '#fff', marginBottom: 24, fontWeight: 700 } }),
      el('btn_start', 'button', { text: '开始游戏', onClick: 'start_game', style: btnStyle }),
      el('btn_continue', 'button', { text: '继续游戏', onClick: 'continue_game', style: btnStyle }),
      el('btn_save', 'button', { text: '存档', onClick: 'open_save', style: btnStyle }),
      el('btn_settings', 'button', { text: '设置', onClick: 'open_settings', style: btnStyle }),
      el('btn_exit', 'button', { text: '退出', onClick: 'exit_game', style: btnStyle }),
    ],
  }),
};

/** 存档/读档面板 — 分页槽位列表 */
export const saveLoadPanel: UIDefinition = {
  id: 'save_load_panel', name: '存档/读档面板', modal: true, closable: true, animation: 'scale', zIndex: 100,
  root: el('container', 'panel', {
    layout: 'vertical',
    className: 'flex flex-col gap-3 p-6 bg-zinc-900/90 rounded-2xl border border-white/10 max-w-2xl w-full',
    children: [
      el('header', 'panel', {
        layout: 'horizontal',
        style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
        children: [
          el('title', 'label', { text: '存档/读档', style: { fontSize: 22, color: '#fff', fontWeight: 600 } }),
          el('btn_close', 'button', { text: '✕', onClick: 'close_panel', style: { color: '#fff', fontSize: 18, cursor: 'pointer' } }),
        ],
      }),
      el('slot_list', 'list', {
        layout: 'vertical',
        dataBinding: 'save_slots',
        children: [
          el('slot_1', 'panel', {
            layout: 'horizontal',
            style: { display: 'flex', gap: 12, padding: 12, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.05)' },
            children: [
              el('slot_thumb_1', 'image', { imageUrl: '', style: { width: 80, height: 50, borderRadius: 4, backgroundColor: '#333' } }),
              el('slot_info_1', 'panel', {
                layout: 'vertical',
                children: [
                  el('slot_title_1', 'label', { text: '槽位 1', style: { color: '#fff', fontSize: 14 } }),
                  el('slot_time_1', 'label', { text: '—', style: { color: '#aaa', fontSize: 12 } }),
                ],
              }),
              el('btn_load_1', 'button', { text: '读取', onClick: 'load_slot', style: btnStyle }),
            ],
          }),
        ],
      }),
      el('footer', 'panel', {
        layout: 'horizontal',
        style: { display: 'flex', justifyContent: 'center', gap: 12 },
        children: [
          el('btn_prev', 'button', { text: '上一页', onClick: 'prev_page', style: btnStyle }),
          el('page_info', 'label', { text: '1 / 1', style: { color: '#aaa', alignSelf: 'center' } }),
          el('btn_next', 'button', { text: '下一页', onClick: 'next_page', style: btnStyle }),
        ],
      }),
    ],
  }),
};

/** 设置面板 — 音量滑块、文字速度、自动模式 */
export const settingsPanel: UIDefinition = {
  id: 'settings_panel', name: '设置面板', modal: true, closable: true, animation: 'slide', zIndex: 100,
  root: el('container', 'panel', {
    layout: 'vertical',
    className: 'flex flex-col gap-5 p-6 bg-zinc-900/90 rounded-2xl border border-white/10 max-w-md w-full',
    children: [
      el('title', 'label', { text: '设置', style: { fontSize: 22, color: '#fff', fontWeight: 600 } }),
      el('divider_1', 'divider', {}),
      el('row_bgm', 'panel', {
        layout: 'horizontal',
        style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
        children: [
          el('lbl_bgm', 'label', { text: 'BGM 音量', style: { color: '#fff' } }),
          el('slider_bgm', 'slider', { min: 0, max: 100, step: 1, value: 80, dataBinding: 'bgm_volume' }),
        ],
      }),
      el('row_sfx', 'panel', {
        layout: 'horizontal',
        style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
        children: [
          el('lbl_sfx', 'label', { text: '音效音量', style: { color: '#fff' } }),
          el('slider_sfx', 'slider', { min: 0, max: 100, step: 1, value: 90, dataBinding: 'sfx_volume' }),
        ],
      }),
      el('row_speed', 'panel', {
        layout: 'horizontal',
        style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
        children: [
          el('lbl_speed', 'label', { text: '文字速度', style: { color: '#fff' } }),
          el('slider_speed', 'slider', { min: 1, max: 50, step: 1, value: 25, dataBinding: 'text_speed' }),
        ],
      }),
      el('row_auto', 'panel', {
        layout: 'horizontal',
        style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
        children: [
          el('lbl_auto', 'label', { text: '自动模式', style: { color: '#fff' } }),
          el('chk_auto', 'checkbox', { value: false, dataBinding: 'auto_mode' }),
        ],
      }),
      el('divider_2', 'divider', {}),
      el('btn_close', 'button', { text: '关闭', onClick: 'close_settings', style: btnStyle }),
    ],
  }),
};

/** 对话框 — 角色名 + 文本 + 点击继续提示 */
export const dialogBox: UIDefinition = {
  id: 'dialog_box', name: '对话框', modal: false, closable: false, animation: 'fade',
  root: el('container', 'panel', {
    layout: 'vertical',
    style: {
      position: 'absolute', bottom: 0, left: 0, right: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)', padding: '20px 24px',
      backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(255,255,255,0.12)',
    },
    children: [
      el('name_tag', 'label', {
        text: '',
        dataBinding: 'speaker_name',
        style: { color: '#fff', fontSize: 16, fontWeight: 600, marginBottom: 8, padding: '2px 10px', backgroundColor: 'rgba(94,80,232,0.8)', borderRadius: '4px 4px 0 0', alignSelf: 'flex-start' },
      }),
      el('dialog_text', 'label', {
        text: '',
        dataBinding: 'dialog_text',
        style: { color: '#fff', fontSize: 18, lineHeight: 1.7, minHeight: 60, textShadow: '0 2px 4px rgba(0,0,0,0.6)' },
      }),
      el('continue_hint', 'label', {
        text: '▼',
        onClick: 'continue_dialog',
        style: { color: '#fff', fontSize: 14, alignSelf: 'flex-end', animation: 'blink 1s infinite', cursor: 'pointer' },
      }),
    ],
  }),
};

/** 选项按钮组 — 动态选项列表 */
export const choiceButtons: UIDefinition = {
  id: 'choice_buttons', name: '选项按钮组', modal: false, closable: false, animation: 'scale',
  root: el('container', 'panel', {
    layout: 'vertical',
    style: { display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center', justifyContent: 'center', padding: 24 },
    children: [
      el('choice_1', 'button', { text: '选项一', onClick: 'choose_0', dataBinding: 'choice_0', style: btnStyle }),
      el('choice_2', 'button', { text: '选项二', onClick: 'choose_1', dataBinding: 'choice_1', style: btnStyle }),
      el('choice_3', 'button', { text: '选项三', onClick: 'choose_2', dataBinding: 'choice_2', style: btnStyle }),
    ],
  }),
};

/** 暂停菜单 — 继续、存档、设置、返回标题 */
export const pauseMenu: UIDefinition = {
  id: 'pause_menu', name: '暂停菜单', modal: true, closable: true, animation: 'fade', zIndex: 200,
  root: el('container', 'panel', {
    layout: 'vertical',
    className: 'flex flex-col items-center gap-3 p-8 bg-zinc-900/90 rounded-2xl border border-white/10',
    children: [
      el('title', 'label', { text: '已暂停', style: { fontSize: 24, color: '#fff', fontWeight: 600, marginBottom: 16 } }),
      el('btn_resume', 'button', { text: '继续游戏', onClick: 'resume_game', style: btnStyle }),
      el('btn_save', 'button', { text: '存档', onClick: 'open_save', style: btnStyle }),
      el('btn_settings', 'button', { text: '设置', onClick: 'open_settings', style: btnStyle }),
      el('btn_title', 'button', { text: '返回标题', onClick: 'return_title', style: btnStyle }),
    ],
  }),
};

/** 所有内置 UI 模板 */
export const builtinUITemplates: UIDefinition[] = [
  mainMenu, saveLoadPanel, settingsPanel, dialogBox, choiceButtons, pauseMenu,
];

/** 将所有内置 UI 模板注册到管理器 */
export function registerBuiltinUITemplates(manager: UIManager): void {
  for (const tpl of builtinUITemplates) {
    manager.register(tpl);
  }
}
