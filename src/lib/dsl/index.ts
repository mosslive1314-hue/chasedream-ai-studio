/**
 * DSL 模块统一导出 + 高层 API
 */

export { tokenize } from './tokenizer';
export { parse } from './parser';
export { compile, type CompileResult } from './compiler';
export type * from './types';

import { tokenize } from './tokenizer';
import { parse } from './parser';
import { compile, type CompileResult } from './compiler';
import { useNarrativeStore } from '@/store';

/**
 * 高层 API：一步到位编译 DSL 源代码
 */
export function compileScript(source: string): CompileResult {
  const tokens = tokenize(source);
  const ast = parse(tokens);
  return compile(ast);
}

/**
 * 把编译结果写入 store
 * 先清除旧的 DSL 节点（id 以 dsl_ 开头），再写入新节点和边
 */
export function applyToStore(result: CompileResult): void {
  const store = useNarrativeStore.getState();

  // 清除旧的 DSL 节点
  const oldDslNodes = store.storyNodes.filter(n => n.id.startsWith('dsl_'));
  oldDslNodes.forEach(n => store.removeNode(n.id));

  // 清除相关边
  store.nodeEdges
    .filter(e => e.from.startsWith('dsl_') || e.to.startsWith('dsl_'))
    .forEach(e => store.removeEdge(e.from, e.to));

  // 写入新节点和边
  result.nodes.forEach(n => store.addNode(n));
  result.edges.forEach(e => store.addEdge(e));

  // 重建可玩图
  store.rebuildPlayableGraph();
}
