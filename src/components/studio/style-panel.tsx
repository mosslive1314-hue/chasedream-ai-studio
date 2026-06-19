"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Palette, Check, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getStyleManager } from "@/lib/style";
import type { StyleDefinition, StyleDomain, StyleState } from "@/lib/style";

interface StylePanelProps {
  onClose: () => void;
}

/** localStorage 键名 — 持久化激活的样式 ID */
const ACTIVE_STYLE_KEY = "chasedream:active-style-id";

/** 把域属性对象格式化为可读键值对数组 */
function formatDomainProps(domain: StyleDomain): { key: string; value: string }[] {
  const entries = Object.entries(domain.properties) as [string, unknown][];
  return entries
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => ({
      key: k.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase()),
      value: typeof v === "object" ? JSON.stringify(v) : String(v),
    }));
}

/** 从样式定义中提取代表性配色（用于色卡预览） */
function extractPalette(style: StyleDefinition): { primary: string; surface: string; text: string } {
  const vars = style.variables ?? {};
  const dialogBg = style.domains.find((d) => d.type === "dialog_box")?.properties.backgroundColor;
  const subtitleColor = style.domains.find((d) => d.type === "subtitle")?.properties.color;
  return {
    primary: vars.primary ?? "#5E50E8",
    surface: dialogBg ?? vars.surface ?? "#18181b",
    text: subtitleColor ?? vars.text ?? "#e4e4e7",
  };
}

// 样式选择面板 — 连接真实 StyleManager 单例
export function StylePanel({ onClose }: StylePanelProps) {
  const [styles, setStyles] = useState<StyleDefinition[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // 订阅管理器状态变化
  const syncState = useCallback((state: StyleState) => {
    setActiveId(state.activeStyleId);
  }, []);

  useEffect(() => {
    const manager = getStyleManager();
    setStyles(manager.listAll());

    // 从 localStorage 恢复之前激活的样式（仅当管理器尚未激活任何样式时）
    if (!manager.getActiveStyleId()) {
      try {
        const saved = localStorage.getItem(ACTIVE_STYLE_KEY);
        if (saved && manager.get(saved)) {
          manager.activate(saved);
        }
      } catch {
        // localStorage 不可用时静默忽略
      }
    }
    setActiveId(manager.getActiveStyleId());

    const unsub = manager.subscribe(syncState);
    return unsub;
  }, [syncState]);

  /** 切换激活样式 — 同步持久化到 localStorage */
  const handleActivate = (id: string) => {
    const manager = getStyleManager();
    if (id === activeId) {
      // 再次点击当前激活样式 → 停用
      manager.deactivate();
      try { localStorage.removeItem(ACTIVE_STYLE_KEY); } catch { /* ignore */ }
    } else {
      manager.activate(id);
      try { localStorage.setItem(ACTIVE_STYLE_KEY, id); } catch { /* ignore */ }
    }
  };

  /** 切换展开 */
  const handleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-xl border border-zinc-800 bg-zinc-950 p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-1.5 text-sm font-medium text-zinc-100">
            <Palette className="h-4 w-4" /> 样式选择
          </h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300">
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mb-4 text-xs text-zinc-500">
          选择一个样式预设来改变预览界面的视觉风格。激活的样式会通过 StyleProvider 实时分发到模拟器渲染层，并自动持久化到本地。
        </p>

        {/* 样式列表 */}
        <div className="flex flex-col gap-2">
          {styles.map((style) => {
            const isActive = style.id === activeId;
            const isExpanded = style.id === expandedId;
            const palette = extractPalette(style);
            return (
              <div
                key={style.id}
                className="rounded-lg overflow-hidden border transition-colors"
                style={{ borderColor: isActive ? "#6366f1" : "#27272a" }}
              >
                {/* 样式条目 */}
                <div
                  className="flex items-center gap-2 p-3 cursor-pointer transition-colors"
                  style={{ background: isActive ? "rgba(99,102,241,0.10)" : "#18181b" }}
                  onClick={() => handleActivate(style.id)}
                >
                  {/* 色卡预览 */}
                  <div className="flex gap-1 shrink-0">
                    <span className="h-4 w-4 rounded" style={{ background: palette.primary }} />
                    <span className="h-4 w-4 rounded" style={{ background: palette.surface }} />
                    <span className="h-4 w-4 rounded" style={{ background: palette.text }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-zinc-100">{style.name}</span>
                      {isActive && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400">
                          已激活
                        </span>
                      )}
                    </div>
                    {style.description && (
                      <p className="text-[10px] mt-0.5 text-zinc-500">{style.description}</p>
                    )}
                  </div>

                  {isActive && <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />}

                  {/* 展开按钮 */}
                  <button
                    className="w-6 h-6 rounded flex items-center justify-center bg-zinc-900 hover:bg-zinc-800 shrink-0"
                    onClick={(e) => { e.stopPropagation(); handleExpand(style.id); }}
                    title={isExpanded ? "收起详情" : "展开域详情"}
                  >
                    <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                      <ChevronDown className="h-3 w-3 text-zinc-400" />
                    </motion.div>
                  </button>
                </div>

                {/* 展开内容：域属性 */}
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="p-3 flex flex-col gap-2 bg-zinc-900/50">
                        {style.domains.map((domain) => {
                          const props = formatDomainProps(domain);
                          return (
                            <div
                              key={domain.type}
                              className="rounded-md p-2 bg-zinc-950 border border-zinc-800"
                            >
                              <div className="text-[10px] font-semibold mb-1 text-orange-400">
                                {domain.name}{" "}
                                <span className="text-zinc-600">({domain.type})</span>
                              </div>
                              <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
                                {props.map(({ key, value }) => (
                                  <div key={key} className="flex items-center gap-1 text-[9px]">
                                    <span className="text-zinc-600">{key}:</span>
                                    <span className="truncate text-zinc-400" title={value}>{value}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* 底部提示 */}
        <div className="mt-4 rounded-md border border-zinc-800 bg-zinc-900/50 p-3">
          <p className="text-[11px] text-zinc-500">
            💡 样式系统基于域（dialog_box / subtitle / choice_button / letterboxing 等）的细粒度控制。
            激活后通过 <code className="text-orange-400">StyleProvider</code> 实时分发到模拟器渲染层，
            选择会自动持久化到 localStorage，刷新页面后保留。
          </p>
        </div>
      </div>
    </div>
  );
}
