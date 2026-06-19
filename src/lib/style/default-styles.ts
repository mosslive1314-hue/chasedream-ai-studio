/**
 * 默认样式集 — 4 套内置风格
 * 借鉴 VoidNovelEngine 的 .style 系统，覆盖全部样式域
 */

import type { StyleDefinition, StyleDomain, StyleDomainType, StyleProperties } from "./style-types";
import type { StyleManager } from "./style-manager";

/** 快速构造样式域 */
function d(
  type: StyleDomainType,
  name: string,
  properties: StyleProperties,
): StyleDomain {
  return { type, name, properties };
}

/** 现代风格 — 圆角、半透明、毛玻璃 */
const modernStyle: StyleDefinition = {
  id: "default-modern",
  name: "现代风格",
  description: "圆角、半透明、毛玻璃质感",
  variables: {
    primary: "#5E50E8",
    text: "#FFFFFF",
    surface: "rgba(0, 0, 0, 0.75)",
    border: "rgba(255, 255, 255, 0.12)",
  },
  domains: [
    d("dialog_box", "对话框", {
      backgroundColor: "${surface}", borderRadius: 16, padding: 20,
      borderWidth: 1, borderColor: "${border}", backdropFilter: "blur(20px)",
      boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)", maxWidth: "600px",
    }),
    d("subtitle", "字幕", {
      fontSize: 18, color: "${text}", lineHeight: 1.6,
      textShadow: "0 2px 4px rgba(0,0,0,0.6)", textAlign: "center",
    }),
    d("choice_button", "选项按钮", {
      backgroundColor: "rgba(94, 80, 232, 0.15)", color: "${text}",
      borderRadius: 12, padding: "12px 20px", borderWidth: 1,
      borderColor: "${border}", backdropFilter: "blur(10px)",
      transition: "all 0.2s ease",
    }),
    d("name_tag", "角色名牌", {
      backgroundColor: "${primary}", color: "${text}",
      borderRadius: "8px 8px 0 0", padding: "4px 12px", fontSize: 14,
      fontWeight: "600",
    }),
    d("letterboxing", "遮幅", { backgroundColor: "#000000", height: "120px" }),
    d("background", "背景", { filter: "brightness(0.85)" }),
    d("foreground", "立绘", { filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.4))" }),
    d("ui_panel", "UI面板", {
      backgroundColor: "rgba(20, 20, 30, 0.85)", borderRadius: 12,
      padding: 16, backdropFilter: "blur(16px)", borderColor: "${border}",
      borderWidth: 1,
    }),
    d("menu", "菜单", {
      backgroundColor: "rgba(0, 0, 0, 0.9)", backdropFilter: "blur(24px)",
      padding: 24, borderRadius: 16,
    }),
    d("shader", "着色器", { shaderUrl: "", shaderUniforms: {} }),
  ],
};

/** 经典风格 — 直角、实色、边框 */
const classicStyle: StyleDefinition = {
  id: "default-classic",
  name: "经典风格",
  description: "直角、实色、清晰边框",
  variables: {
    primary: "#4A5068", text: "#1A1D2E", surface: "#FFFFFF",
    border: "#CBD0E5",
  },
  domains: [
    d("dialog_box", "对话框", {
      backgroundColor: "${surface}", borderRadius: 0, padding: 16,
      borderWidth: 2, borderColor: "${border}", maxWidth: "600px",
      boxShadow: "0 4px 0 rgba(0,0,0,0.1)",
    }),
    d("subtitle", "字幕", {
      fontSize: 16, color: "${text}", lineHeight: 1.5, textAlign: "left",
    }),
    d("choice_button", "选项按钮", {
      backgroundColor: "${surface}", color: "${text}", borderRadius: 0,
      padding: "10px 16px", borderWidth: 1, borderColor: "${border}",
      transition: "background 0.15s",
    }),
    d("name_tag", "角色名牌", {
      backgroundColor: "${primary}", color: "#FFFFFF",
      borderRadius: 0, padding: "4px 10px", fontSize: 13, fontWeight: "700",
    }),
    d("letterboxing", "遮幅", { backgroundColor: "#000000", height: "80px" }),
    d("background", "背景", { filter: "none" }),
    d("foreground", "立绘", { filter: "none" }),
    d("ui_panel", "UI面板", {
      backgroundColor: "${surface}", borderRadius: 0, padding: 12,
      borderWidth: 1, borderColor: "${border}",
    }),
    d("menu", "菜单", {
      backgroundColor: "${surface}", padding: 16, borderRadius: 0,
      borderWidth: 2, borderColor: "${border}",
    }),
    d("shader", "着色器", { shaderUrl: "", shaderUniforms: {} }),
  ],
};

/** 电影风格 — 宽遮幅、大字、暗色 */
const cinematicStyle: StyleDefinition = {
  id: "default-cinematic",
  name: "电影风格",
  description: "宽遮幅、大字号、暗色调",
  variables: {
    primary: "#D4AF37", text: "#F5F5F5", surface: "rgba(0, 0, 0, 0.85)",
    border: "rgba(212, 175, 55, 0.3)",
  },
  domains: [
    d("dialog_box", "对话框", {
      backgroundColor: "${surface}", borderRadius: 4, padding: 24,
      borderWidth: 1, borderColor: "${border}", maxWidth: "720px",
      boxShadow: "0 0 40px rgba(0,0,0,0.6)",
    }),
    d("subtitle", "字幕", {
      fontSize: 22, color: "${text}", lineHeight: 1.4, letterSpacing: 1,
      textShadow: "0 2px 8px rgba(0,0,0,0.8)", textAlign: "center",
      fontWeight: "500",
    }),
    d("choice_button", "选项按钮", {
      backgroundColor: "rgba(0, 0, 0, 0.6)", color: "${text}",
      borderRadius: 2, padding: "14px 24px", borderWidth: 1,
      borderColor: "${border}", transition: "all 0.3s ease",
    }),
    d("name_tag", "角色名牌", {
      backgroundColor: "transparent", color: "${primary}",
      borderRadius: 0, padding: "4px 0", fontSize: 16,
      fontWeight: "700", letterSpacing: 2,
    }),
    d("letterboxing", "遮幅", { backgroundColor: "#000000", height: "150px" }),
    d("background", "背景", { filter: "contrast(1.1) saturate(0.9)" }),
    d("foreground", "立绘", { filter: "drop-shadow(0 8px 20px rgba(0,0,0,0.6))" }),
    d("ui_panel", "UI面板", {
      backgroundColor: "rgba(0, 0, 0, 0.7)", borderRadius: 4, padding: 20,
      borderWidth: 1, borderColor: "${border}",
    }),
    d("menu", "菜单", {
      backgroundColor: "rgba(0, 0, 0, 0.95)", padding: 32, borderRadius: 4,
      borderColor: "${border}", borderWidth: 1,
    }),
    d("shader", "着色器", { shaderUrl: "", shaderUniforms: {} }),
  ],
};

/** 极简风格 — 无装饰、纯文字 */
const minimalStyle: StyleDefinition = {
  id: "default-minimal",
  name: "极简风格",
  description: "无装饰、纯文字、留白",
  variables: {
    primary: "#1A1D2E", text: "#1A1D2E", surface: "transparent",
    border: "transparent",
  },
  domains: [
    d("dialog_box", "对话框", {
      backgroundColor: "${surface}", borderRadius: 0, padding: 16,
      borderWidth: 0, borderColor: "${border}", maxWidth: "560px",
    }),
    d("subtitle", "字幕", {
      fontSize: 17, color: "${text}", lineHeight: 1.7, textAlign: "left",
    }),
    d("choice_button", "选项按钮", {
      backgroundColor: "transparent", color: "${text}", borderRadius: 0,
      padding: "8px 0", borderWidth: 0, transition: "opacity 0.2s",
    }),
    d("name_tag", "角色名牌", {
      backgroundColor: "transparent", color: "${text}", borderRadius: 0,
      padding: "2px 0", fontSize: 13, fontWeight: "600", opacity: 0.6,
    }),
    d("letterboxing", "遮幅", { backgroundColor: "#FFFFFF", height: "60px" }),
    d("background", "背景", { filter: "none" }),
    d("foreground", "立绘", { filter: "none" }),
    d("ui_panel", "UI面板", {
      backgroundColor: "transparent", borderRadius: 0, padding: 12,
      borderWidth: 0,
    }),
    d("menu", "菜单", {
      backgroundColor: "transparent", padding: 16, borderRadius: 0,
      borderWidth: 0,
    }),
    d("shader", "着色器", { shaderUrl: "", shaderUniforms: {} }),
  ],
};

/** 向管理器注册全部默认样式 */
export function registerDefaultStyles(manager: StyleManager): void {
  manager.register(modernStyle);
  manager.register(classicStyle);
  manager.register(cinematicStyle);
  manager.register(minimalStyle);
}
