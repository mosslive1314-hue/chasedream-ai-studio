/**
 * 样式管理器 — 注册、激活、编译样式定义
 * 借鉴 VoidNovelEngine 的 .style 系统，提供纯逻辑的样式编译能力
 */

import type { CSSProperties } from "react";
import type {
  StyleDefinition, StyleDomain, StyleDomainType, StyleProperties,
  CompiledStyleSheet, CompiledShader, StyleState,
} from "./style-types";

/** camelCase → kebab-case */
const toKebab = (key: string): string => key.replace(/([A-Z])/g, "-$1").toLowerCase();

/** 需要追加 px 单位的数值属性 */
const PX_KEYS = new Set([
  "fontSize", "borderWidth", "borderRadius", "padding", "margin",
  "letterSpacing", "width", "height", "maxWidth", "top", "bottom", "left", "right",
]);

/** 需要追加 s 单位（秒）的数值属性 */
const SECOND_KEYS = new Set(["animationDuration", "animationDelay"]);

/** 替换 ${varName} 形式的变量引用 */
function replaceVars(value: unknown, variables: Record<string, string>): unknown {
  if (typeof value !== "string" || !value.includes("${")) return value;
  return value.replace(/\$\{(\w+)\}/g, (_, name: string) =>
    Object.prototype.hasOwnProperty.call(variables, name) ? variables[name] : `\${${name}}`,
  );
}

/** 格式化单个属性值（处理变量替换与单位追加） */
function formatValue(key: string, value: unknown, variables: Record<string, string>): string {
  const replaced = replaceVars(value, variables);
  if (typeof replaced === "number") {
    if (PX_KEYS.has(key)) return `${replaced}px`;
    if (SECOND_KEYS.has(key)) return `${replaced}s`;
    return String(replaced);
  }
  return String(replaced);
}

/** 把 StyleProperties 编译为 CSS 属性字符串 */
function toCSSString(props: StyleProperties, variables: Record<string, string>): string {
  return (Object.entries(props) as [string, unknown][])
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => `${toKebab(k)}: ${formatValue(k, v, variables)};`)
    .join(" ");
}

/** 把 StyleProperties 转换为 React CSSProperties 对象 */
function toReactStyle(props: StyleProperties, variables: Record<string, string>): CSSProperties {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props)) {
    if (value === undefined || value === null) continue;
    result[key] = replaceVars(value, variables);
  }
  return result as CSSProperties;
}

/** 提取域中的着色器信息 */
function extractShader(domain: StyleDomain, variables: Record<string, string>): CompiledShader | null {
  const { shaderUrl, shaderUniforms } = domain.properties;
  if (!shaderUrl) return null;
  const uniforms: Record<string, number | number[] | string> = {};
  if (shaderUniforms) {
    for (const [k, v] of Object.entries(shaderUniforms)) {
      uniforms[k] = replaceVars(v, variables) as number | number[] | string;
    }
  }
  return {
    domainType: domain.type,
    shaderUrl: replaceVars(shaderUrl, variables) as string,
    uniforms,
  };
}

export class StyleManager {
  private styles: Map<string, StyleDefinition> = new Map();
  private activeStyleId: string | null = null;
  private compiledSheet: CompiledStyleSheet | null = null;
  private listeners: Set<(state: StyleState) => void> = new Set();

  /** 注册一个样式定义 */
  register(style: StyleDefinition): void {
    this.styles.set(style.id, style);
  }

  /** 注销样式定义 */
  unregister(id: string): void {
    this.styles.delete(id);
    if (this.activeStyleId === id) this.deactivate();
  }

  /** 获取指定样式定义 */
  get(id: string): StyleDefinition | undefined {
    return this.styles.get(id);
  }

  /** 列出所有已注册样式 */
  listAll(): StyleDefinition[] {
    return Array.from(this.styles.values());
  }

  /** 激活指定样式（编译并切换） */
  activate(id: string): void {
    const style = this.styles.get(id);
    if (!style) return;
    this.activeStyleId = id;
    this.compiledSheet = this.compile(style);
    this.notify();
  }

  /** 停用当前样式 */
  deactivate(): void {
    this.activeStyleId = null;
    this.compiledSheet = null;
    this.notify();
  }

  /** 获取当前激活样式 ID */
  getActiveStyleId(): string | null {
    return this.activeStyleId;
  }

  /** 获取当前编译后的样式表 */
  getCompiledSheet(): CompiledStyleSheet | null {
    return this.compiledSheet;
  }

  /** 获取当前样式状态快照 */
  getState(): StyleState {
    const active = this.activeStyleId ? this.styles.get(this.activeStyleId) : undefined;
    return {
      activeStyleId: this.activeStyleId,
      activeStyleName: active?.name ?? null,
      compiledSheet: this.compiledSheet,
    };
  }

  /** 获取指定域的 React CSSProperties */
  getDomainStyle(domainType: StyleDomainType): CSSProperties | null {
    return this.compiledSheet?.reactStyleMap[domainType] ?? null;
  }

  /** 获取指定域的 CSS 字符串 */
  getDomainCSS(domainType: StyleDomainType): string | null {
    return this.compiledSheet?.cssMap[domainType] ?? null;
  }

  /** 编译样式定义为样式表 */
  compile(style: StyleDefinition): CompiledStyleSheet {
    const variables = style.variables ?? {};
    const cssMap: Record<string, string> = {};
    const reactStyleMap: Record<string, CSSProperties> = {};
    const shaders: CompiledShader[] = [];
    for (const domain of style.domains) {
      cssMap[domain.type] = toCSSString(domain.properties, variables);
      reactStyleMap[domain.type] = toReactStyle(domain.properties, variables);
      const shader = extractShader(domain, variables);
      if (shader) shaders.push(shader);
    }
    return { styleId: style.id, styleName: style.name, cssMap, reactStyleMap, shaders };
  }

  /** 序列化当前状态为 JSON 字符串 */
  serialize(): string {
    return JSON.stringify(this.getState());
  }

  /** 从 JSON 字符串恢复状态 */
  deserialize(json: string): void {
    try {
      const state = JSON.parse(json) as StyleState;
      if (state.activeStyleId) this.activate(state.activeStyleId);
      else this.deactivate();
    } catch {
      this.deactivate();
    }
  }

  /** 订阅状态变化，返回取消订阅函数 */
  subscribe(listener: (state: StyleState) => void): () => void {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  }

  /** 通知所有监听器 */
  private notify(): void {
    const state = this.getState();
    this.listeners.forEach((fn) => fn(state));
  }
}
