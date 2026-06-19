/**
 * 场景渲染器 — 把 SceneContext 中的场景对象渲染为可视化层
 * 借鉴 VoidNovelEngine 的场景对象渲染系统
 */

"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { SceneObject, BackgroundObject, ForegroundObject, SubtitleObject, LetterboxingObject } from "@/lib/runtime/scene-objects";
import { useDomainStyle } from "@/components/simulator/style-provider";

interface SceneRendererProps {
  objects: SceneObject[];
  /** 默认背景图（当没有 BackgroundObject 时使用） */
  fallbackBg?: string;
}

/** 渲染场景对象层 */
export function SceneRenderer({ objects, fallbackBg }: SceneRendererProps) {
  // 顶层调用各域样式 hook（hook 不能在循环/条件中调用）
  const bgStyle = useDomainStyle('background') ?? {};
  const fgStyle = useDomainStyle('foreground') ?? {};
  const subtitleStyle = useDomainStyle('subtitle') ?? {};
  const letterboxStyle = useDomainStyle('letterboxing') ?? {};

  const backgrounds = objects.filter(o => o.type === 'background' && o.visible) as BackgroundObject[];
  const foregrounds = objects.filter(o => o.type === 'foreground' && o.visible) as ForegroundObject[];
  const subtitles = objects.filter(o => o.type === 'subtitle' && o.visible) as SubtitleObject[];
  const letterboxings = objects.filter(o => o.type === 'letterboxing' && o.visible) as LetterboxingObject[];

  const bg = backgrounds[0];
  const subtitle = subtitles[0];
  const letterboxing = letterboxings[0];

  return (
    <div className="absolute inset-0 z-0 overflow-hidden">
      {/* 背景层 — 应用 background 域样式 */}
      <AnimatePresence mode="wait">
        {bg ? (
          <motion.div
            key={bg.imageUrl}
            initial={{ opacity: 0 }}
            animate={{ opacity: bg.opacity }}
            exit={{ opacity: 0 }}
            transition={{ duration: bg.transitionFade ?? 0.5 }}
            className="absolute inset-0"
            style={{ ...bgStyle }}
          >
            <img
              src={bg.imageUrl}
              alt="场景背景"
              className="w-full h-full object-cover"
            />
          </motion.div>
        ) : fallbackBg ? (
          <motion.div
            key="fallback"
            className="absolute inset-0"
            style={{ ...bgStyle }}
          >
            <img
              src={fallbackBg}
              alt="场景背景"
              className="w-full h-full object-cover brightness-50"
            />
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* 渐变遮罩 */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/70 opacity-90" />

      {/* 宽银幕遮幅 — 应用 letterboxing 域样式，对象自身高度优先 */}
      {letterboxing && (
        <>
          <div
            className="absolute top-0 left-0 right-0 bg-black z-10"
            style={{ ...letterboxStyle, height: `${letterboxing.topHeight}%` }}
          />
          <div
            className="absolute bottom-0 left-0 right-0 bg-black z-10"
            style={{ ...letterboxStyle, height: `${letterboxing.bottomHeight}%` }}
          />
        </>
      )}

      {/* 前景立绘层 — 应用 foreground 域样式，对象自身位置/变换优先 */}
      {foregrounds.map(fg => (
        <motion.div
          key={fg.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: fg.opacity, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="absolute z-5"
          style={{
            ...fgStyle,
            left: `${fg.positionX}%`,
            top: `${fg.positionY}%`,
            transform: `translate(-50%, -50%) scale(${fg.scale})`,
          }}
        >
          <img
            src={fg.imageUrl}
            alt={fg.characterId || "角色立绘"}
            className="max-h-[70vh] object-contain"
          />
        </motion.div>
      ))}

      {/* 字幕/对白层 — 应用 subtitle 域样式，对象自身文字颜色优先 */}
      {subtitle && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: subtitle.opacity, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="absolute bottom-[10%] left-1/2 -translate-x-1/2 z-20 text-center max-w-[80%]"
          style={{ ...subtitleStyle, color: subtitle.textColor ?? subtitleStyle.color }}
        >
          {subtitle.speakerName && (
            <div className="font-bold mb-1">{subtitle.speakerName}</div>
          )}
          <div>{subtitle.text}</div>
        </motion.div>
      )}
    </div>
  );
}
