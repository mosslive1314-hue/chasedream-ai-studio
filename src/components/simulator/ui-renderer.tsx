/**
 * UI 渲染器 — 渲染所有活跃的 UI 实例
 * 借鉴 VoidNovelEngine 的 UI 系统，用 React 组件树呈现
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  getUIManager,
  type UIInstance,
  type UIElement,
  type UIDefinition,
  type UIEvent,
} from "@/lib/ui-system";

export function UIRenderer() {
  const [instances, setInstances] = useState<UIInstance[]>([]);

  useEffect(() => {
    const manager = getUIManager();
    setInstances(manager.getActiveInstances());
    const unsub = manager.subscribe((active) => {
      setInstances([...active]);
    });
    return unsub;
  }, []);

  const handleEvent = useCallback(
    (instanceId: string, elementId: string, eventType: string, value?: any) => {
      const manager = getUIManager();
      const event: UIEvent = { instanceId, elementId, eventType: eventType as any, value };
      manager.dispatchEvent(event);
    },
    []
  );

  const handleClose = useCallback((instanceId: string) => {
    getUIManager().close(instanceId);
  }, []);

  const visibleInstances = instances.filter((i) => i.visible);

  return (
    <div className="absolute inset-0 pointer-events-none z-50">
      <AnimatePresence>
        {visibleInstances.map((instance) => {
          const manager = getUIManager();
          const def = manager.getDefinition(instance.definitionId);
          if (!def) return null;

          return (
            <UIInstanceView
              key={instance.id}
              instance={instance}
              definition={def}
              onEvent={handleEvent}
              onClose={handleClose}
            />
          );
        })}
      </AnimatePresence>
    </div>
  );
}

/** 单个 UI 实例的渲染容器 */
function UIInstanceView({
  instance,
  definition,
  onEvent,
  onClose,
}: {
  instance: UIInstance;
  definition: UIDefinition;
  onEvent: (instanceId: string, elementId: string, eventType: string, value?: any) => void;
  onClose: (instanceId: string) => void;
}) {
  const animVariants = {
    fade: { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } },
    slide: { initial: { y: 50, opacity: 0 }, animate: { y: 0, opacity: 1 }, exit: { y: 50, opacity: 0 } },
    scale: { initial: { scale: 0.9, opacity: 0 }, animate: { scale: 1, opacity: 1 }, exit: { scale: 0.9, opacity: 0 } },
    none: { initial: {}, animate: {}, exit: {} },
  };
  const anim = animVariants[definition.animation ?? "fade"];

  return (
    <motion.div
      {...anim}
      transition={{ duration: 0.25 }}
      className={`absolute inset-0 flex items-center justify-center ${instance.modal ? "pointer-events-auto" : "pointer-events-none"}`}
      style={{ zIndex: definition.zIndex ?? 100 }}
    >
      {/* 模态遮罩 */}
      {instance.modal && (
        <div
          className="absolute inset-0 bg-black/50"
          onClick={() => {
            if (definition.closable) onClose(instance.id);
          }}
        />
      )}

      {/* UI 内容 */}
      <div className="relative pointer-events-auto" style={{ zIndex: 1 }}>
        {definition.closable && (
          <button
            onClick={() => onClose(instance.id)}
            className="absolute -top-3 -right-3 w-6 h-6 rounded-full bg-black/70 text-white text-xs flex items-center justify-center hover:bg-black/90 z-10"
          >
            ✕
          </button>
        )}
        {renderElement(definition.root, instance, onEvent)}
      </div>
    </motion.div>
  );
}

/** 递归渲染 UI 元素 */
function renderElement(
  element: UIElement,
  instance: UIInstance,
  onEvent: (instanceId: string, elementId: string, eventType: string, value?: any) => void
): React.ReactNode {
  if (element.visible === false) return null;

  const elementState = instance.elementStates[element.id];
  const style = { ...element.style, ...(elementState?.style || {}) };
  const text = elementState?.text ?? element.text ?? "";
  const value = elementState?.value ?? element.value;

  const layoutClass = element.layout
    ? element.layout === "horizontal"
      ? "flex flex-row gap-2"
      : element.layout === "grid"
      ? `grid gap-2`
      : "flex flex-col gap-2"
    : "";

  const gridStyle =
    element.layout === "grid" && element.gridColumns
      ? { gridTemplateColumns: `repeat(${element.gridColumns}, 1fr)` }
      : {};

  switch (element.type) {
    case "panel":
      return (
        <div key={element.id} className={`${element.className ?? ""} ${layoutClass}`} style={{ ...style, ...gridStyle }}>
          {element.children?.map((child) => renderElement(child, instance, onEvent))}
        </div>
      );

    case "list":
      return (
        <div key={element.id} className={`${element.className ?? ""} flex flex-col gap-1`} style={style}>
          {element.children?.map((child) => renderElement(child, instance, onEvent))}
        </div>
      );

    case "button":
      return (
        <button
          key={element.id}
          className={element.className ?? "px-4 py-2 rounded-lg bg-white/10 text-white text-sm hover:bg-white/20 transition"}
          style={style}
          onClick={() => onEvent(instance.id, element.id, "click")}
        >
          {text}
        </button>
      );

    case "label":
      return (
        <span key={element.id} className={element.className ?? "text-white text-sm"} style={style}>
          {text}
        </span>
      );

    case "image":
      return element.imageUrl ? (
        <img key={element.id} src={element.imageUrl} alt={text} className={element.className ?? "max-w-full"} style={style} />
      ) : null;

    case "slider":
      return (
        <div key={element.id} className="flex items-center gap-2" style={style}>
          {text && <span className="text-white text-xs">{text}</span>}
          <input
            type="range"
            min={element.min ?? 0}
            max={element.max ?? 100}
            step={element.step ?? 1}
            value={Number(value ?? 0)}
            onChange={(e) => onEvent(instance.id, element.id, "change", Number(e.target.value))}
            className="flex-1"
          />
          <span className="text-white text-xs w-8 text-right">{value ?? 0}</span>
        </div>
      );

    case "checkbox":
      return (
        <label key={element.id} className="flex items-center gap-2 cursor-pointer" style={style}>
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => onEvent(instance.id, element.id, "change", e.target.checked)}
          />
          <span className="text-white text-sm">{text}</span>
        </label>
      );

    case "input":
      return (
        <input
          key={element.id}
          type="text"
          value={String(value ?? "")}
          placeholder={text}
          onChange={(e) => onEvent(instance.id, element.id, "change", e.target.value)}
          className={element.className ?? "px-3 py-1.5 rounded bg-white/10 text-white text-sm border border-white/20"}
          style={style}
        />
      );

    case "progress":
      return (
        <div key={element.id} className="w-full h-2 bg-white/10 rounded-full overflow-hidden" style={style}>
          <div className="h-full bg-white/60 rounded-full transition-all" style={{ width: `${Number(value ?? 0)}%` }} />
        </div>
      );

    case "divider":
      return <hr key={element.id} className="border-white/10" style={style} />;

    default:
      return null;
  }
}
