// ChaseDream Runtime — 快照序列化
// 用于存档导出/导入

import type { RuntimeSnapshot } from './scene-context';

/**
 * 序列化快照为 JSON 字符串（用于存档导出）
 */
export function serializeSnapshot(snapshot: RuntimeSnapshot): string {
  return JSON.stringify(snapshot);
}

/**
 * 从 JSON 字符串反序列化
 * 如果数据不合法会抛出错误
 */
export function deserializeSnapshot(json: string): RuntimeSnapshot {
  const parsed = JSON.parse(json);
  const { valid, errors } = validateSnapshot(parsed);
  if (!valid) {
    throw new Error(`无效的快照数据: ${errors.join('; ')}`);
  }
  return parsed as RuntimeSnapshot;
}

/**
 * 验证快照完整性
 */
export function validateSnapshot(snapshot: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!snapshot || typeof snapshot !== 'object') {
    return { valid: false, errors: ['快照必须是对象'] };
  }

  const s = snapshot as Record<string, unknown>;

  if (typeof s.currentNodeId !== 'string') {
    errors.push('currentNodeId 必须是字符串');
  }

  if (typeof s.variables !== 'object' || s.variables === null) {
    errors.push('variables 必须是对象');
  }

  if (!Array.isArray(s.sceneObjects)) {
    errors.push('sceneObjects 必须是数组');
  }

  if (!Array.isArray(s.history)) {
    errors.push('history 必须是数组');
  }

  if (typeof s.timestamp !== 'number') {
    errors.push('timestamp 必须是数字');
  }

  return { valid: errors.length === 0, errors };
}
