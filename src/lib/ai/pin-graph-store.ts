/**
 * Pin Graph Store — 引脚图状态管理（Zustand）
 *
 * 管理引脚图的节点（NodeInstance）和连接（PinConnection）。
 * 使用不可变更新触发 React 重渲染：每次变更都生成新的 Map / 数组。
 */

import { create } from "zustand";
import type { NodeInstance, PinConnection } from "@/lib/node-system";

// ─── Store 类型定义 ──────────────────────────────────────

export interface PinGraphStore {
  /** 节点表：nodeId → NodeInstance */
  nodes: Map<string, NodeInstance>;
  /** 引脚连接列表 */
  connections: PinConnection[];

  // ── 写操作 ──────────────────────────────────────────

  /** 添加节点，返回新生成的节点 ID */
  addNode(typeId: string, x?: number, y?: number, pinValues?: Record<string, unknown>): string;
  /** 删除节点（同时清理相关连接） */
  removeNode(nodeId: string): void;
  /** 连接两个引脚（已存在则忽略） */
  connectPins(fromNodeId: string, fromPinKey: string, toNodeId: string, toPinKey: string): void;
  /** 断开两个引脚的连接 */
  disconnectPins(fromNodeId: string, fromPinKey: string, toNodeId: string, toPinKey: string): void;
  /** 设置节点引脚值 */
  setPinValue(nodeId: string, pinKey: string, value: unknown): void;
  /** 清空所有节点和连接 */
  clear(): void;

  // ── 读操作 ──────────────────────────────────────────

  /** 获取单个节点 */
  getNode(nodeId: string): NodeInstance | undefined;
  /** 获取所有节点（数组形式） */
  getAllNodes(): NodeInstance[];
  /** 获取所有连接 */
  getConnections(): PinConnection[];
}

// ─── 辅助函数 ────────────────────────────────────────────

/** 生成唯一节点 ID */
function genNodeId(): string {
  return `PN${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

// ─── Store 实现 ──────────────────────────────────────────

export const usePinGraphStore = create<PinGraphStore>((set, get) => ({
  nodes: new Map(),
  connections: [],

  // ── 写操作 ──────────────────────────────────────────

  addNode(typeId, x = 0, y = 0, pinValues = {}) {
    const id = genNodeId();
    const node: NodeInstance = {
      id,
      typeId,
      position: { x, y },
      pinValues: { ...pinValues },
    };
    set((state) => {
      const nodes = new Map(state.nodes);
      nodes.set(id, node);
      return { nodes };
    });
    return id;
  },

  removeNode(nodeId) {
    set((state) => {
      if (!state.nodes.has(nodeId)) return state;
      const nodes = new Map(state.nodes);
      nodes.delete(nodeId);
      // 同时清理与该节点相关的所有连接
      const connections = state.connections.filter(
        (c) => c.fromNodeId !== nodeId && c.toNodeId !== nodeId,
      );
      return { nodes, connections };
    });
  },

  connectPins(fromNodeId, fromPinKey, toNodeId, toPinKey) {
    set((state) => {
      // 避免重复连接
      const exists = state.connections.some(
        (c) =>
          c.fromNodeId === fromNodeId &&
          c.fromPinKey === fromPinKey &&
          c.toNodeId === toNodeId &&
          c.toPinKey === toPinKey,
      );
      if (exists) return state;
      return {
        connections: [
          ...state.connections,
          { fromNodeId, fromPinKey, toNodeId, toPinKey },
        ],
      };
    });
  },

  disconnectPins(fromNodeId, fromPinKey, toNodeId, toPinKey) {
    set((state) => ({
      connections: state.connections.filter(
        (c) =>
          !(
            c.fromNodeId === fromNodeId &&
            c.fromPinKey === fromPinKey &&
            c.toNodeId === toNodeId &&
            c.toPinKey === toPinKey
          ),
      ),
    }));
  },

  setPinValue(nodeId, pinKey, value) {
    set((state) => {
      const node = state.nodes.get(nodeId);
      if (!node) return state;
      const nodes = new Map(state.nodes);
      nodes.set(nodeId, {
        ...node,
        pinValues: { ...node.pinValues, [pinKey]: value },
      });
      return { nodes };
    });
  },

  clear() {
    set({ nodes: new Map(), connections: [] });
  },

  // ── 读操作 ──────────────────────────────────────────

  getNode(nodeId) {
    return get().nodes.get(nodeId);
  },

  getAllNodes() {
    return Array.from(get().nodes.values());
  },

  getConnections() {
    return [...get().connections];
  },
}));
