/**
 * 样式系统类型定义
 * 借鉴 VoidNovelEngine 的 .style 系统，定义样式域、样式属性和编译产物
 */

import type { CSSProperties } from "react";

/** 样式域类型 — 每个域对应模拟器中的一类可视化元素 */
export type StyleDomainType =
  | "dialog_box" // 对话框样式
  | "subtitle" // 字幕样式
  | "choice_button" // 选项按钮样式
  | "name_tag" // 角色名牌样式
  | "letterboxing" // 遮幅样式
  | "background" // 背景样式
  | "foreground" // 立绘样式
  | "ui_panel" // UI面板样式
  | "menu" // 菜单样式
  | "shader"; // 着色器样式

/** 样式属性集合 — 覆盖通用、文字、布局、效果、动画、着色器 */
export interface StyleProperties {
  // 通用
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string;
  color?: string;
  backgroundColor?: string;
  backgroundImage?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  padding?: number | string;
  margin?: number | string;
  opacity?: number;
  // 文字
  lineHeight?: number;
  letterSpacing?: number;
  textShadow?: string;
  textAlign?: "left" | "center" | "right";
  // 布局
  width?: string;
  height?: string;
  maxWidth?: string;
  position?: "static" | "relative" | "absolute" | "fixed";
  top?: string;
  bottom?: string;
  left?: string;
  right?: string;
  // 效果
  boxShadow?: string;
  backdropFilter?: string;
  filter?: string;
  transition?: string;
  transform?: string;
  // 动画
  animationDuration?: number;
  animationDelay?: number;
  // 着色器专用
  shaderUrl?: string;
  shaderUniforms?: Record<string, number | number[] | string>;
}

/** 单个样式域定义 */
export interface StyleDomain {
  type: StyleDomainType;
  name: string;
  properties: StyleProperties;
}

/** 完整样式定义 — 由多个域组成，可携带全局变量 */
export interface StyleDefinition {
  id: string;
  name: string;
  description?: string;
  domains: StyleDomain[];
  /** 全局变量（可被域属性值以 ${varName} 形式引用） */
  variables?: Record<string, string>;
}

/** 着色器信息（编译后提取） */
export interface CompiledShader {
  domainType: string;
  shaderUrl: string;
  uniforms: Record<string, number | number[] | string>;
}

/** 编译后的样式表 — 同时提供 CSS 字符串与 React CSSProperties 两种形式 */
export interface CompiledStyleSheet {
  styleId: string;
  styleName: string;
  /** 域类型 → CSS 属性字符串 */
  cssMap: Record<string, string>;
  /** 域类型 → React CSSProperties 对象 */
  reactStyleMap: Record<string, CSSProperties>;
  /** 着色器信息列表 */
  shaders: CompiledShader[];
}

/** 样式状态（用于序列化与监听） */
export interface StyleState {
  activeStyleId: string | null;
  activeStyleName: string | null;
  compiledSheet: CompiledStyleSheet | null;
}
