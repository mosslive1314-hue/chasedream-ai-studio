// ChaseDream 节点系统 — 节点注册表
// 管理所有节点类型定义，支持按类别查询与统计

import type { NodeCategory, NodeDefinition } from './types';

export class NodeRegistry {
  /** 类型 ID → 定义 */
  private definitions: Map<string, NodeDefinition> = new Map();

  /** 注册一个节点定义（已存在则覆盖，支持热更新） */
  register(def: NodeDefinition): void {
    this.definitions.set(def.typeId, def);
  }

  /** 注销一个节点类型 */
  unregister(typeId: string): void {
    this.definitions.delete(typeId);
  }

  /** 获取节点定义 */
  get(typeId: string): NodeDefinition | undefined {
    return this.definitions.get(typeId);
  }

  /** 是否存在某节点类型 */
  has(typeId: string): boolean {
    return this.definitions.has(typeId);
  }

  /** 列出全部节点定义 */
  listAll(): NodeDefinition[] {
    return Array.from(this.definitions.values());
  }

  /** 按类别列出节点定义 */
  listByCategory(category: NodeCategory): NodeDefinition[] {
    return this.listAll().filter((d) => d.category === category);
  }

  /** 获取所有已注册类别（去重） */
  getCategories(): NodeCategory[] {
    const set = new Set<NodeCategory>();
    for (const def of this.definitions.values()) set.add(def.category);
    return Array.from(set);
  }

  /** 获取节点类型统计 */
  getStats(): { total: number; byCategory: Record<string, number> } {
    const byCategory: Record<string, number> = {};
    for (const def of this.definitions.values()) {
      byCategory[def.category] = (byCategory[def.category] ?? 0) + 1;
    }
    return { total: this.definitions.size, byCategory };
  }
}
