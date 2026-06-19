/**
 * UI 系统统一导出
 * 提供 类型、管理器、内置模板 与 全局单例
 */

export * from './ui-types';
export { UIManager } from './ui-manager';
export { registerBuiltinUITemplates, builtinUITemplates } from './ui-templates';

import { UIManager } from './ui-manager';
import { registerBuiltinUITemplates } from './ui-templates';

let globalManager: UIManager | null = null;

/** 获取全局 UI 管理器单例（首次调用时注册内置模板） */
export function getUIManager(): UIManager {
  if (!globalManager) {
    globalManager = new UIManager();
    registerBuiltinUITemplates(globalManager);
  }
  return globalManager;
}
