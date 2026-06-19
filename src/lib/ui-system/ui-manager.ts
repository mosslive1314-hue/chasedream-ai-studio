/**
 * UI 管理器 — 注册、显示、关闭 UI 实例的纯逻辑核心
 * 借鉴 VoidNovelEngine 的 .ui 系统，不依赖 React（渲染由 UIRenderer 负责）
 */

import type {
  UIDefinition, UIInstance, UIEvent, UISystemState, UIElement,
} from './ui-types';

/** 元素可见性状态在 elementStates 中的键名前缀 */
const VISIBLE_KEY = '__visible__:';

export class UIManager {
  /** 已注册的 UI 定义 */
  private definitions: Map<string, UIDefinition> = new Map();
  /** 活跃的 UI 实例 */
  private instances: Map<string, UIInstance> = new Map();
  /** 实例 ID 自增计数器 */
  private instanceCounter = 0;
  /** 状态订阅者 */
  private listeners: Set<(instances: UIInstance[]) => void> = new Set();
  /** 事件处理器（handlerId → 处理函数） */
  private eventHandlers: Map<string, (event: UIEvent) => void> = new Map();

  // ── 定义管理 ──────────────────────────────────────────────

  /** 注册一个 UI 定义 */
  register(def: UIDefinition): void {
    this.definitions.set(def.id, def);
  }

  /** 注销 UI 定义 */
  unregister(id: string): void {
    this.definitions.delete(id);
  }

  /** 获取指定 UI 定义 */
  getDefinition(id: string): UIDefinition | undefined {
    return this.definitions.get(id);
  }

  /** 列出所有已注册的 UI 定义 */
  listDefinitions(): UIDefinition[] {
    return Array.from(this.definitions.values());
  }

  // ── 实例生命周期 ──────────────────────────────────────────

  /** 显示 UI（创建实例），返回实例 ID */
  show(definitionId: string): string {
    return this.createInstance(definitionId, false);
  }

  /** 调用 UI（模态方式），返回实例 ID */
  call(definitionId: string): string {
    return this.createInstance(definitionId, true);
  }

  /** 内部：创建实例 */
  private createInstance(definitionId: string, forceModal: boolean): string {
    const def = this.definitions.get(definitionId);
    if (!def) throw new Error(`UI 定义不存在: ${definitionId}`);
    const id = `ui-${++this.instanceCounter}`;
    const instance: UIInstance = {
      id,
      definitionId,
      visible: true,
      elementStates: {},
      createdAt: Date.now(),
      modal: forceModal || def.modal,
    };
    this.instances.set(id, instance);
    this.notify();
    return id;
  }

  /** 关闭指定实例 */
  close(instanceId: string): void {
    if (this.instances.delete(instanceId)) this.notify();
  }

  /** 关闭所有实例 */
  closeAll(): void {
    if (this.instances.size === 0) return;
    this.instances.clear();
    this.notify();
  }

  /** 关闭指定定义的所有实例 */
  closeByDefinition(definitionId: string): void {
    let changed = false;
    for (const [id, inst] of this.instances) {
      if (inst.definitionId === definitionId) {
        this.instances.delete(id);
        changed = true;
      }
    }
    if (changed) this.notify();
  }

  // ── 实例查询 ──────────────────────────────────────────────

  /** 获取指定实例 */
  getInstance(instanceId: string): UIInstance | undefined {
    return this.instances.get(instanceId);
  }

  /** 获取所有活跃实例 */
  getActiveInstances(): UIInstance[] {
    return Array.from(this.instances.values());
  }

  /** 获取所有可见实例 */
  getVisibleInstances(): UIInstance[] {
    return this.getActiveInstances().filter((i) => i.visible);
  }

  // ── 元素状态管理 ──────────────────────────────────────────

  /** 设置元素状态值 */
  setElementState(instanceId: string, elementId: string, value: any): void {
    const inst = this.instances.get(instanceId);
    if (!inst) return;
    inst.elementStates[elementId] = value;
    this.notify();
  }

  /** 获取元素状态值 */
  getElementState(instanceId: string, elementId: string): any {
    return this.instances.get(instanceId)?.elementStates[elementId];
  }

  /** 切换元素可见性（存储在 elementStates 的命名空间键下） */
  toggleElementVisibility(instanceId: string, elementId: string): void {
    const inst = this.instances.get(instanceId);
    if (!inst) return;
    const key = VISIBLE_KEY + elementId;
    inst.elementStates[key] = !inst.elementStates[key];
    this.notify();
  }

  /** 读取元素可见性（未设置时返回 true） */
  getElementVisibility(instanceId: string, elementId: string): boolean {
    const inst = this.instances.get(instanceId);
    if (!inst) return true;
    const v = inst.elementStates[VISIBLE_KEY + elementId];
    return v === undefined ? true : v;
  }

  // ── 事件处理 ──────────────────────────────────────────────

  /** 注册事件处理器 */
  registerEventHandler(handlerId: string, handler: (event: UIEvent) => void): void {
    this.eventHandlers.set(handlerId, handler);
  }

  /** 注销事件处理器 */
  unregisterEventHandler(handlerId: string): void {
    this.eventHandlers.delete(handlerId);
  }

  /** 派发事件 — 路由到元素 onClick 指定的处理器，若无则忽略 */
  dispatchEvent(event: UIEvent): void {
    const inst = this.instances.get(event.instanceId);
    if (!inst) return;
    // 查找元素上绑定的 onClick handlerId
    const def = this.definitions.get(inst.definitionId);
    const handlerId = def ? this.findElementOnClick(def.root, event.elementId) : undefined;
    const target = handlerId ?? event.elementId;
    const handler = this.eventHandlers.get(target);
    if (handler) handler(event);
  }

  /** 递归查找元素的 onClick 绑定 */
  private findElementOnClick(el: UIElement, elementId: string): string | undefined {
    if (el.id === elementId) return el.onClick;
    if (el.children) {
      for (const child of el.children) {
        const found = this.findElementOnClick(child, elementId);
        if (found) return found;
      }
    }
    return undefined;
  }

  // ── 序列化 ────────────────────────────────────────────────

  /** 序列化当前系统状态为 JSON 字符串 */
  serialize(): string {
    const state: UISystemState = {
      activeInstances: this.getActiveInstances(),
      registeredDefinitions: Array.from(this.definitions.keys()),
    };
    return JSON.stringify(state);
  }

  /** 从 JSON 字符串恢复状态（仅恢复实例，定义需重新注册） */
  deserialize(json: string): void {
    try {
      const state = JSON.parse(json) as UISystemState;
      this.instances.clear();
      for (const inst of state.activeInstances) {
        this.instances.set(inst.id, inst);
      }
      this.notify();
    } catch {
      // 反序列化失败时保持当前状态不变
    }
  }

  // ── 订阅 ──────────────────────────────────────────────────

  /** 订阅实例列表变化，返回取消订阅函数 */
  subscribe(listener: (instances: UIInstance[]) => void): () => void {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  }

  /** 通知所有订阅者 */
  private notify(): void {
    const snapshot = this.getActiveInstances();
    this.listeners.forEach((fn) => fn(snapshot));
  }
}
