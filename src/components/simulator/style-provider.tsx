/**
 * 样式 Provider 组件 — 让 SimulatorScreen 内的子组件获取当前激活样式
 * 通过 React Context 向下分发编译后的样式表
 */

"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { getStyleManager } from "@/lib/style";
import type { CompiledStyleSheet, StyleDomainType } from "@/lib/style";

const StyleContext = createContext<CompiledStyleSheet | null>(null);

interface StyleProviderProps {
  children: React.ReactNode;
}

/** 样式 Provider — 订阅管理器状态并向下分发 */
export function StyleProvider({ children }: StyleProviderProps) {
  const [sheet, setSheet] = useState<CompiledStyleSheet | null>(null);

  useEffect(() => {
    const manager = getStyleManager();
    // 初始化为当前编译样式表
    setSheet(manager.getCompiledSheet());
    // 订阅后续变化
    const unsub = manager.subscribe((state) => {
      setSheet(state.compiledSheet);
    });
    return unsub;
  }, []);

  return (
    <StyleContext.Provider value={sheet}>{children}</StyleContext.Provider>
  );
}

/** 获取当前编译样式表 */
export function useStyle(): CompiledStyleSheet | null {
  return useContext(StyleContext);
}

/** 获取指定域的 React CSSProperties */
export function useDomainStyle(
  domainType: StyleDomainType,
): CSSProperties | null {
  const sheet = useStyle();
  return sheet?.reactStyleMap[domainType] ?? null;
}
