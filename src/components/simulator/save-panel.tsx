"use client";

// 存档/读档 UI 面板 — 提供可视化的存档管理界面
// 支持存档/读档两种模式、分页浏览、快速存档/读档、删除

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Save, FolderOpen, Trash2, X, ChevronLeft, ChevronRight, Zap, Clock } from "lucide-react";
import { getSaveManager, type SaveSlot, type SaveSlotData } from "@/lib/save";
import type { SceneContext } from "@/lib/runtime";

interface SavePanelProps {
  mode: 'save' | 'load';
  context: SceneContext | null;
  onClose: () => void;
  onLoad?: (data: SaveSlotData) => void;
}

/** 格式化游玩时长（秒 → 可读字符串） */
function formatPlayTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}时${m}分`;
  if (m > 0) return `${m}分${s}秒`;
  return `${s}秒`;
}

/** 格式化时间戳为简短日期字符串 */
function formatDate(ts: number): string {
  if (!ts) return "--";
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function SavePanel({ mode, context, onClose, onLoad }: SavePanelProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [slots, setSlots] = useState<SaveSlot[]>([]);
  const [confirmIndex, setConfirmIndex] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const manager = getSaveManager();
  const maxPage = manager.getStats().totalPages;

  // 刷新当前页槽位列表
  const refresh = useCallback(() => {
    setSlots(manager.getSlots(currentPage));
  }, [manager, currentPage]);

  useEffect(() => { refresh(); }, [refresh]);

  // 处理槽位点击：存档模式存档/覆盖确认，读档模式读档
  const handleSlotClick = useCallback(async (slot: SaveSlot) => {
    if (busy) return;
    setBusy(true);
    try {
      if (mode === 'save') {
        if (!context) return;
        // 已有存档需二次确认覆盖
        if (slot.exists && confirmIndex !== slot.index) {
          setConfirmIndex(slot.index);
          return;
        }
        const result = await manager.saveToSlot(slot.page, slot.index, context);
        setConfirmIndex(null);
        if (result.success) refresh();
      } else {
        if (!slot.exists) return;
        const result = await manager.loadFromSlot(slot.page, slot.index);
        if (result.success && result.data) {
          if (context) await manager.applySaveData(result.data, context);
          onLoad?.(result.data);
          onClose();
        }
      }
    } finally { setBusy(false); }
  }, [mode, context, manager, confirmIndex, busy, refresh, onLoad, onClose]);

  // 删除存档
  const handleDelete = useCallback(async (slot: SaveSlot, e: React.MouseEvent) => {
    e.stopPropagation();
    if (busy || !slot.exists) return;
    setBusy(true);
    try { await manager.deleteSlot(slot.page, slot.index); refresh(); }
    finally { setBusy(false); }
  }, [manager, busy, refresh]);

  // 快速存档/读档
  const handleQuick = useCallback(async () => {
    if (busy || !context) return;
    setBusy(true);
    try {
      if (mode === 'save') {
        await manager.quickSave(context);
      } else {
        const result = await manager.quickLoad();
        if (result.success && result.data) {
          await manager.applySaveData(result.data, context);
          onLoad?.(result.data);
          onClose();
        }
      }
    } finally { setBusy(false); }
  }, [mode, context, manager, busy, onLoad, onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
        className="w-full max-w-3xl rounded-2xl bg-zinc-900 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部：标题 + 快捷按钮 + 关闭 */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {mode === 'save' ? <Save className="h-5 w-5 text-emerald-400" /> : <FolderOpen className="h-5 w-5 text-sky-400" />}
            <h2 className="text-lg font-semibold text-white">{mode === 'save' ? "存档" : "读档"}</h2>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleQuick} disabled={busy || !context}
              className="flex items-center gap-1 rounded-lg bg-amber-500/20 px-3 py-1.5 text-sm text-amber-300 hover:bg-amber-500/30 disabled:opacity-40">
              <Zap className="h-4 w-4" />{mode === 'save' ? "快存" : "快读"}
            </button>
            <button onClick={onClose} className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* 槽位网格 */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {slots.map((slot) => (
            <div
              key={slot.index}
              role="button"
              tabIndex={0}
              onClick={() => handleSlotClick(slot)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSlotClick(slot); } }}
              className={`group relative flex flex-col overflow-hidden rounded-xl border transition-all ${
                slot.exists ? 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600'
                  : 'border-dashed border-zinc-700 bg-zinc-800/20 hover:border-zinc-600'
              } ${mode === 'load' && !slot.exists ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'}`}
            >
              {/* 缩略图区域 */}
              <div className="aspect-video w-full bg-zinc-950">
                {slot.meta.thumbnail ? (
                  <img src={slot.meta.thumbnail} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-zinc-600">
                    {slot.exists ? <Clock className="h-6 w-6" /> : <span className="text-sm">空</span>}
                  </div>
                )}
              </div>
              {/* 信息区域 */}
              <div className="p-2">
                <p className="truncate text-sm font-medium text-white">{slot.meta.title}</p>
                <p className="text-xs text-zinc-500">{formatDate(slot.meta.timestamp)}</p>
                {slot.exists && <p className="text-xs text-zinc-500">{formatPlayTime(slot.meta.playTime)}</p>}
              </div>
              {/* 删除按钮 */}
              {slot.exists && (
                <button
                  onClick={(e) => handleDelete(slot, e)}
                  className="absolute right-1 top-1 rounded-md bg-black/50 p-1 text-zinc-400 opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
              {/* 覆盖确认遮罩 */}
              <AnimatePresence>
                {confirmIndex === slot.index && (
                  <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onClick={(e) => { e.stopPropagation(); handleSlotClick(slot); }}
                    className="absolute inset-0 flex cursor-pointer flex-col items-center justify-center bg-black/80 p-2 text-center"
                  >
                    <p className="mb-2 text-xs text-white">覆盖此存档？</p>
                    <div className="flex gap-2">
                      <span className="rounded bg-emerald-500 px-2 py-0.5 text-xs text-white">确认</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); setConfirmIndex(null); }}
                        className="rounded bg-zinc-600 px-2 py-0.5 text-xs text-white"
                      >取消</button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

        {/* 分页控制 */}
        <div className="mt-4 flex items-center justify-center gap-4">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white disabled:opacity-30"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="text-sm text-zinc-400">{currentPage} / {maxPage}</span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(maxPage, p + 1))}
            disabled={currentPage >= maxPage}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white disabled:opacity-30"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
