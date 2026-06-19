// ChaseDream 节点系统 — 图执行引擎
// 负责加载节点图、解析引脚值、按 flow 引脚推进执行

import type { SceneContext } from '@/lib/runtime/scene-context';
import type {
  NodeExecuteResult,
  NodeInstance,
  PinConnection,
} from './types';
import type { NodeRegistry } from './node-registry';

export class GraphExecutor {
  private registry: NodeRegistry;
  private context: SceneContext;
  private nodes: Map<string, NodeInstance> = new Map();
  private connections: PinConnection[] = [];
  /** 节点输出缓存：nodeId → { pinKey → value } */
  private outputCache: Map<string, Record<string, any>> = new Map();
  /** 当前执行节点 ID */
  private currentNodeId: string | null = null;
  /** 上一次执行结果选中的输出引脚 */
  private lastNextPinKey: string | null = null;

  constructor(registry: NodeRegistry, context: SceneContext) {
    this.registry = registry;
    this.context = context;
  }

  /** 加载图数据 */
  loadGraph(nodes: NodeInstance[], connections: PinConnection[]): void {
    this.nodes.clear();
    this.connections = [];
    this.outputCache.clear();
    this.currentNodeId = null;
    this.lastNextPinKey = null;
    for (const n of nodes) this.nodes.set(n.id, n);
    this.connections = connections;
  }

  /** 从指定节点开始执行 */
  executeFrom(nodeId: string): NodeExecuteResult {
    return this.executeNode(nodeId);
  }

  /** 执行单个节点（流程节点，会访问节点并记录游标） */
  executeNode(nodeId: string): NodeExecuteResult {
    return this.runNode(nodeId, true);
  }

  /** 评估节点（值/逻辑节点，不访问节点、不移动游标） */
  private evaluateNode(nodeId: string): NodeExecuteResult {
    return this.runNode(nodeId, false);
  }

  /** 节点执行核心：解析输入 → 调用 onExecute → 缓存输出 */
  private runNode(nodeId: string, visit: boolean): NodeExecuteResult {
    const node = this.nodes.get(nodeId);
    if (!node) return { waitInteraction: false, finished: true };
    const def = this.registry.get(node.typeId);
    if (!def) return { waitInteraction: false, finished: true };

    // 流程节点：标记当前节点并写入访问历史
    if (visit) {
      this.currentNodeId = nodeId;
      this.context.visitNode(nodeId);
    }

    // 解析所有输入引脚的值
    const inputs: Record<string, any> = {};
    for (const pin of def.pins) {
      if (pin.direction === 'input') {
        inputs[pin.key] = this.resolveInputPin(nodeId, pin.key);
      }
    }

    // 执行节点逻辑
    const result = def.onExecute(this.context, inputs);

    // 缓存计算输出（值节点 / 逻辑节点）
    if (result.outputs) {
      this.outputCache.set(nodeId, { ...result.outputs });
    }
    if (visit) {
      this.lastNextPinKey = result.nextPinKey ?? null;
    }
    return result;
  }

  /** 获取连接到某输入引脚的值 */
  resolveInputPin(nodeId: string, pinKey: string): any {
    // 1. 查找连接到该输入引脚的连接
    const conn = this.connections.find(
      (c) => c.toNodeId === nodeId && c.toPinKey === pinKey,
    );
    if (conn) {
      return this.resolveOutputPin(conn.fromNodeId, conn.fromPinKey);
    }
    // 2. 无连接：从本节点 pinValues 读取本地值
    const node = this.nodes.get(nodeId);
    if (node && pinKey in node.pinValues) {
      return node.pinValues[pinKey];
    }
    // 3. 从引脚定义读取默认值
    const def = this.registry.get(node?.typeId ?? '');
    const pin = def?.pins.find((p) => p.key === pinKey);
    return pin?.defaultValue;
  }

  /** 解析某节点输出引脚的值（必要时评估源节点） */
  private resolveOutputPin(fromNodeId: string, fromPinKey: string): any {
    // 优先读取输出缓存（逻辑节点计算结果）
    const cached = this.outputCache.get(fromNodeId);
    if (cached && fromPinKey in cached) {
      return cached[fromPinKey];
    }
    // 读取源节点实例的 pinValues（值节点常量）
    const sourceNode = this.nodes.get(fromNodeId);
    if (sourceNode && fromPinKey in sourceNode.pinValues) {
      return sourceNode.pinValues[fromPinKey];
    }
    // 评估源节点以计算输出（递归解析其输入）
    this.evaluateNode(fromNodeId);
    const after = this.outputCache.get(fromNodeId);
    if (after && fromPinKey in after) {
      return after[fromPinKey];
    }
    return undefined;
  }

  /** 找到从某输出引脚连接的下一个节点 */
  findNextNode(nodeId: string, pinKey: string): string | null {
    const conn = this.connections.find(
      (c) => c.fromNodeId === nodeId && c.fromPinKey === pinKey,
    );
    return conn ? conn.toNodeId : null;
  }

  /** 执行下一个节点（通过引脚连接），返回下一节点 ID 或 null */
  advance(pinKey?: string): string | null {
    if (!this.currentNodeId) return null;
    const key = pinKey ?? this.lastNextPinKey;
    if (!key) return null;
    const nextId = this.findNextNode(this.currentNodeId, key);
    if (nextId) {
      this.executeNode(nextId);
      return nextId;
    }
    return null;
  }
}
