// ChaseDream 节点系统 — 核心类型定义
// 纯逻辑模块，不依赖 React，借鉴 VoidNovelEngine 节点架构

import type { SceneContext } from '@/lib/runtime/scene-context';

// ── 引脚类型 ──────────────────────────────────────────────────────────────

/** 引脚类型 ID */
export type PinTypeId =
  | 'flow' | 'bool' | 'int' | 'float' | 'string'
  | 'texture' | 'audio' | 'video'
  | 'vec2' | 'rgba' | 'any';

/** 引脚方向 */
export type PinDirection = 'input' | 'output';

/** 引脚值（运行时承载的数据） */
export type PinValue = number | string | boolean | null;

// ── 引脚定义 ──────────────────────────────────────────────────────────────

/** 引脚定义（节点类型上的静态描述） */
export interface PinDefinition {
  /** 引脚唯一标识（在节点内唯一） */
  key: string;
  /** 显示名 */
  name: string;
  /** 引脚类型 */
  typeId: PinTypeId;
  /** 引脚方向 */
  direction: PinDirection;
  /** 是否必须连接（默认 false） */
  required?: boolean;
  /** 默认值（未连接时使用） */
  defaultValue?: any;
}

// ── 节点类别 ──────────────────────────────────────────────────────────────

/** 节点类别 */
export type NodeCategory =
  | 'flow_control' | 'presentation' | 'audio' | 'save'
  | 'logic' | 'value' | 'ui' | 'variable' | 'style' | 'misc';

// ── 执行结果 ──────────────────────────────────────────────────────────────

/** 节点执行结果 */
export interface NodeExecuteResult {
  /** 通过哪个输出引脚继续（flow 引脚） */
  nextPinKey?: string;
  /** 是否等待玩家互动 */
  waitInteraction: boolean;
  /** 是否结束（结局节点） */
  finished: boolean;
  /** 计算输出值（值节点 / 逻辑节点使用，供下游引脚读取） */
  outputs?: Record<string, any>;
}

// ── 节点定义 ──────────────────────────────────────────────────────────────

/** 节点定义（类型注册项） */
export interface NodeDefinition {
  /** 唯一类型 ID */
  typeId: string;
  /** 显示名 */
  name: string;
  /** 类别 */
  category: NodeCategory;
  /** 图标名（lucide） */
  icon?: string;
  /** 节点颜色 */
  color?: string;
  /** 引脚定义列表 */
  pins: PinDefinition[];
  /** 是否在右键菜单可见 */
  menuVisible: boolean;
  /** 执行函数：接收 SceneContext 和引脚值，返回执行结果 */
  onExecute: (ctx: SceneContext, inputs: Record<string, any>) => NodeExecuteResult;
}

// ── 节点实例 ──────────────────────────────────────────────────────────────

/** 节点实例（运行时图中的一个节点） */
export interface NodeInstance {
  /** 实例 ID */
  id: string;
  /** 节点类型 ID */
  typeId: string;
  /** 位置 */
  position: { x: number; y: number };
  /** 引脚值（输入引脚的本地值 / 值节点的常量） */
  pinValues: Record<string, any>;
}

// ── 引脚连接 ──────────────────────────────────────────────────────────────

/** 引脚连接（从某节点的输出引脚连到另一节点的输入引脚） */
export interface PinConnection {
  fromNodeId: string;
  fromPinKey: string;
  toNodeId: string;
  toPinKey: string;
}
