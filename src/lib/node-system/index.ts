// ChaseDream 节点系统 — 统一导出 + 全局注册表
// 纯逻辑模块，不依赖 React

export * from './types';
export { NodeRegistry } from './node-registry';
export { GraphExecutor } from './executor';

import { NodeRegistry } from './node-registry';
import { registerFlowControlNodes } from './built-in/flow-control';
import { registerPresentationNodes } from './built-in/presentation';
import { registerPresentationExtraNodes } from './built-in/presentation-extra';
import { registerAudioNodes } from './built-in/audio-nodes';
import { registerSaveNodes } from './built-in/save-nodes';
import { registerLogicNodes } from './built-in/logic-nodes';
import { registerMathExtraNodes } from './built-in/math-extra';
import { registerValueNodes } from './built-in/value-nodes';
import { registerValueExtraNodes } from './built-in/value-extra';
import { registerVariableNodes } from './built-in/variable-nodes';
import { registerUiNodes } from './built-in/ui-nodes';
import { registerUiLogicNodes } from './built-in/ui-logic';
import { registerStyleNodes } from './built-in/style-nodes';
import { registerMiscNodes } from './built-in/misc-nodes';
import { registerMiscExtraNodes } from './built-in/misc-extra';

let globalRegistry: NodeRegistry | null = null;

/** 获取全局注册表（懒加载，自动注册所有内置节点） */
export function getGlobalRegistry(): NodeRegistry {
  if (!globalRegistry) {
    globalRegistry = new NodeRegistry();
    registerFlowControlNodes(globalRegistry);
    registerPresentationNodes(globalRegistry);
    registerPresentationExtraNodes(globalRegistry);
    registerAudioNodes(globalRegistry);
    registerSaveNodes(globalRegistry);
    registerLogicNodes(globalRegistry);
    registerMathExtraNodes(globalRegistry);
    registerValueNodes(globalRegistry);
    registerValueExtraNodes(globalRegistry);
    registerVariableNodes(globalRegistry);
    registerUiNodes(globalRegistry);
    registerUiLogicNodes(globalRegistry);
    registerStyleNodes(globalRegistry);
    registerMiscNodes(globalRegistry);
    registerMiscExtraNodes(globalRegistry);
  }
  return globalRegistry;
}
