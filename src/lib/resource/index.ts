// 资源索引系统统一导出
export * from './resource-index';

// 全局单例管理
import { ResourceIndex } from './resource-index';

let globalIndex: ResourceIndex | null = null;

// 获取全局资源索引单例（懒加载）
export function getResourceIndex(): ResourceIndex {
  if (!globalIndex) globalIndex = new ResourceIndex();
  return globalIndex;
}

// 重置全局资源索引（用于测试或切换项目）
export function resetResourceIndex(): void {
  globalIndex = null;
}
