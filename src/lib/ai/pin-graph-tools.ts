/**
 * Pin Graph Agent Tools — 引脚图 Agent 工具集
 * 9 个操作 NodeInstance / PinConnection 的工具，供 Agent 通过
 * function-calling 操作引脚图。工具直接操作传入的 PinGraphState 可变对象。
 */

import type { ToolResult } from "./tool-registry";
import type { NodeInstance, PinConnection, NodeCategory } from "@/lib/node-system";
import { getGlobalRegistry, GraphExecutor } from "@/lib/node-system";
import { SceneContext } from "@/lib/runtime/scene-context";

/** 引脚图状态（工具直接操作此可变对象） */
export interface PinGraphState {
  nodes: Map<string, NodeInstance>;
  connections: PinConnection[];
}

/** 引脚图工具定义（扁平结构，含 handler） */
export interface PinGraphTool {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  handler: (params: Record<string, unknown>) => Promise<ToolResult>;
}

function genNodeId(): string {
  return `PN${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

/** 判断连接是否已存在 */
function connExists(list: PinConnection[], c: PinConnection): boolean {
  return list.some(
    (x) => x.fromNodeId === c.fromNodeId && x.fromPinKey === c.fromPinKey
       && x.toNodeId === c.toNodeId && x.toPinKey === c.toPinKey,
  );
}

/** 创建引脚图工具集（9 个工具，直接操作传入的 state） */
export function createPinGraphTools(state: PinGraphState): PinGraphTool[] {
  return [
    {
      name: "add_pin_node",
      description: "在引脚图中添加一个节点",
      parameters: {
        type: "object",
        properties: {
          typeId: { type: "string", description: "节点类型 ID" },
          x: { type: "number", description: "X 坐标（默认 0）" },
          y: { type: "number", description: "Y 坐标（默认 0）" },
          pinValues: { type: "object", description: "引脚初始值（可选）" },
        },
        required: ["typeId"],
      },
      handler: async (p) => {
        const id = genNodeId();
        state.nodes.set(id, {
          id, typeId: p.typeId as string,
          position: { x: (p.x as number) ?? 0, y: (p.y as number) ?? 0 },
          pinValues: { ...((p.pinValues as Record<string, unknown>) ?? {}) },
        });
        return { success: true, data: { nodeId: id } };
      },
    },
    {
      name: "remove_pin_node",
      description: "删除引脚图中的一个节点（同时清理相关连接）",
      parameters: {
        type: "object",
        properties: { nodeId: { type: "string", description: "要删除的节点 ID" } },
        required: ["nodeId"],
      },
      handler: async (p) => {
        const nodeId = p.nodeId as string;
        if (!state.nodes.delete(nodeId)) return { success: false, error: `节点不存在: ${nodeId}` };
        state.connections = state.connections.filter(
          (c) => c.fromNodeId !== nodeId && c.toNodeId !== nodeId,
        );
        return { success: true };
      },
    },
    {
      name: "connect_pins",
      description: "连接两个引脚（从源节点输出引脚到目标节点输入引脚）",
      parameters: {
        type: "object",
        properties: {
          fromNodeId: { type: "string", description: "源节点 ID" },
          fromPinKey: { type: "string", description: "源引脚 key" },
          toNodeId: { type: "string", description: "目标节点 ID" },
          toPinKey: { type: "string", description: "目标引脚 key" },
        },
        required: ["fromNodeId", "fromPinKey", "toNodeId", "toPinKey"],
      },
      handler: async (p) => {
        const conn: PinConnection = {
          fromNodeId: p.fromNodeId as string, fromPinKey: p.fromPinKey as string,
          toNodeId: p.toNodeId as string, toPinKey: p.toPinKey as string,
        };
        if (!connExists(state.connections, conn)) state.connections.push(conn);
        return { success: true };
      },
    },
    {
      name: "disconnect_pins",
      description: "断开两个引脚之间的连接",
      parameters: {
        type: "object",
        properties: {
          fromNodeId: { type: "string", description: "源节点 ID" },
          fromPinKey: { type: "string", description: "源引脚 key" },
          toNodeId: { type: "string", description: "目标节点 ID" },
          toPinKey: { type: "string", description: "目标引脚 key" },
        },
        required: ["fromNodeId", "fromPinKey", "toNodeId", "toPinKey"],
      },
      handler: async (p) => {
        const f = p.fromNodeId as string, fp = p.fromPinKey as string;
        const t = p.toNodeId as string, tp = p.toPinKey as string;
        state.connections = state.connections.filter(
          (c) => !(c.fromNodeId === f && c.fromPinKey === fp && c.toNodeId === t && c.toPinKey === tp),
        );
        return { success: true };
      },
    },
    {
      name: "set_pin_value",
      description: "设置节点某个引脚的值",
      parameters: {
        type: "object",
        properties: {
          nodeId: { type: "string", description: "节点 ID" },
          pinKey: { type: "string", description: "引脚 key" },
          value: { description: "引脚值（任意类型）" },
        },
        required: ["nodeId", "pinKey", "value"],
      },
      handler: async (p) => {
        const node = state.nodes.get(p.nodeId as string);
        if (!node) return { success: false, error: `节点不存在: ${p.nodeId}` };
        node.pinValues[p.pinKey as string] = p.value;
        return { success: true };
      },
    },
    {
      name: "list_pin_nodes",
      description: "列出引脚图中的所有节点",
      parameters: { type: "object", properties: {} },
      handler: async () => ({ success: true, data: { nodes: Array.from(state.nodes.values()) } }),
    },
    {
      name: "list_node_types",
      description: "列出所有可用的节点类型（可按类别筛选）",
      parameters: {
        type: "object",
        properties: { category: { type: "string", description: "按类别筛选（可选）" } },
      },
      handler: async (p) => {
        const reg = getGlobalRegistry();
        const defs = p.category ? reg.listByCategory(p.category as NodeCategory) : reg.listAll();
        return {
          success: true,
          data: { types: defs.map((d) => ({ typeId: d.typeId, name: d.name, category: d.category, pins: d.pins })) },
        };
      },
    },
    {
      name: "get_node_type_detail",
      description: "获取指定节点类型的详细信息（含引脚定义）",
      parameters: {
        type: "object",
        properties: { typeId: { type: "string", description: "节点类型 ID" } },
        required: ["typeId"],
      },
      handler: async (p) => {
        const def = getGlobalRegistry().get(p.typeId as string);
        if (!def) return { success: false, error: `未知节点类型: ${p.typeId}` };
        return { success: true, data: { typeId: def.typeId, name: def.name, category: def.category, pins: def.pins } };
      },
    },
    {
      name: "execute_pin_graph",
      description: "从指定节点开始执行引脚图",
      parameters: {
        type: "object",
        properties: { startNodeId: { type: "string", description: "起始节点 ID" } },
        required: ["startNodeId"],
      },
      handler: async (p) => {
        const startNodeId = p.startNodeId as string;
        if (!state.nodes.has(startNodeId)) return { success: false, error: `起始节点不存在: ${startNodeId}` };
        const executor = new GraphExecutor(getGlobalRegistry(), new SceneContext());
        executor.loadGraph(Array.from(state.nodes.values()), state.connections);
        return { success: true, data: { result: executor.executeFrom(startNodeId) } };
      },
    },
  ];
}
