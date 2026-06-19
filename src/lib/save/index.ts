// 存档系统 — 统一导出 + 全局单例
// SSR 安全：单例懒创建，浏览器端自动初始化

export * from './save-types';
export { SaveManager } from './save-manager';

import { SaveManager } from './save-manager';

let globalSaveManager: SaveManager | null = null;

/** 获取全局存档管理器单例（浏览器端自动初始化） */
export function getSaveManager(): SaveManager {
  if (!globalSaveManager) {
    globalSaveManager = new SaveManager();
    if (typeof window !== 'undefined') {
      globalSaveManager.init().catch(() => {});
    }
  }
  return globalSaveManager;
}

/** 重置全局单例（主要用于测试或销毁场景） */
export function resetSaveManager(): void {
  globalSaveManager = null;
}
