/**
 * 样式系统统一导出
 * 提供 类型、管理器、默认样式 与 全局单例
 */

export * from "./style-types";
export { StyleManager } from "./style-manager";
export { registerDefaultStyles } from "./default-styles";

import { StyleManager } from "./style-manager";
import { registerDefaultStyles } from "./default-styles";

let globalManager: StyleManager | null = null;

/** 获取全局样式管理器单例（首次调用时注册默认样式） */
export function getStyleManager(): StyleManager {
  if (!globalManager) {
    globalManager = new StyleManager();
    registerDefaultStyles(globalManager);
  }
  return globalManager;
}
