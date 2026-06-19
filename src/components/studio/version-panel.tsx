"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Camera, RotateCcw, Trash2, X, GitBranch, Clock } from "lucide-react";
import { useVersionStore } from "@/store";
import type { Snapshot } from "@/lib/types/version-control";

/**
 * VersionPanel — 版本快照面板
 *
 * 功能：
 * - 创建快照（捕获当前 narrative store 状态）
 * - 查看所有快照列表
 * - 恢复到指定快照
 * - 删除快照
 */
export function VersionPanel({ onClose }: { onClose: () => void }) {
  const snapshots = useVersionStore((s) => s.snapshots);
  const createSnapshot = useVersionStore((s) => s.createSnapshot);
  const restoreFromSnapshot = useVersionStore((s) => s.restoreFromSnapshot);
  const deleteSnapshot = useVersionStore((s) => s.deleteSnapshot);
  const activeBranch = useVersionStore((s) => s.getActiveBranch?.());
  const [snapshotName, setSnapshotName] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [restoredId, setRestoredId] = useState<string | null>(null);

  const handleCreate = () => {
    const name = snapshotName.trim() || `快照 ${new Date().toLocaleString("zh-CN")}`;
    createSnapshot(name, "manual", `手动创建于 ${new Date().toISOString()}`);
    setSnapshotName("");
    setShowCreateForm(false);
  };

  const handleRestore = (snapshot: Snapshot) => {
    const ok = restoreFromSnapshot(snapshot.id);
    if (ok) {
      setRestoredId(snapshot.id);
      setTimeout(() => setRestoredId(null), 2000);
    }
  };

  const sortedSnapshots = [...snapshots].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="absolute bottom-10 right-0 top-0 z-30 w-80 border-l border-zinc-800 bg-zinc-950"
    >
      {/* 头部 */}
      <div className="flex h-9 shrink-0 items-center justify-between border-b border-zinc-800 px-3">
        <div className="flex items-center gap-1.5">
          <GitBranch className="h-3.5 w-3.5 text-orange-400" />
          <span className="text-xs font-medium text-zinc-200">版本快照</span>
          {activeBranch && (
            <span className="rounded bg-zinc-900 px-1.5 py-0.5 text-[10px] text-zinc-500">
              {activeBranch.name}
            </span>
          )}
        </div>
        <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* 创建快照区 */}
      <div className="shrink-0 border-b border-zinc-800 p-2">
        {showCreateForm ? (
          <div className="space-y-1.5">
            <input
              value={snapshotName}
              onChange={(e) => setSnapshotName(e.target.value)}
              placeholder="快照名称（可选）"
              className="w-full rounded-md bg-zinc-900 px-2 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-600 outline-none border border-zinc-800 focus:border-orange-500"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate();
                if (e.key === "Escape") setShowCreateForm(false);
              }}
            />
            <div className="flex gap-1.5">
              <button
                onClick={handleCreate}
                className="flex-1 rounded-md bg-orange-500 px-2 py-1.5 text-xs text-white hover:bg-orange-400"
              >
                创建快照
              </button>
              <button
                onClick={() => setShowCreateForm(false)}
                className="rounded-md bg-zinc-900 px-2 py-1.5 text-xs text-zinc-400 hover:bg-zinc-800"
              >
                取消
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex w-full items-center justify-center gap-1.5 rounded-md bg-zinc-900 px-2 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800"
          >
            <Camera className="h-3 w-3" /> 创建快照
          </button>
        )}
      </div>

      {/* 快照列表 */}
      <div className="flex-1 overflow-y-auto p-2">
        {sortedSnapshots.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Clock className="h-8 w-8 text-zinc-700" />
            <p className="mt-2 text-xs text-zinc-600">暂无快照</p>
            <p className="mt-0.5 text-[10px] text-zinc-700">创建快照以保存当前进度</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {sortedSnapshots.map((snap) => (
              <div
                key={snap.id}
                className={`rounded-md border p-2 transition-colors ${
                  restoredId === snap.id
                    ? "border-emerald-600 bg-emerald-950/30"
                    : "border-zinc-800 bg-zinc-900/40 hover:border-zinc-700"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-zinc-200">{snap.name}</p>
                    {snap.description && (
                      <p className="mt-0.5 truncate text-[10px] text-zinc-500">{snap.description}</p>
                    )}
                  </div>
                  <span className="shrink-0 rounded bg-zinc-800 px-1.5 py-0.5 text-[9px] text-zinc-400">
                    {snap.type === "manual" ? "手动" : snap.type === "auto" ? "自动" : snap.type === "milestone" ? "里程碑" : snap.type}
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-[10px] text-zinc-600">
                    {new Date(snap.createdAt).toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleRestore(snap)}
                      className="rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-orange-400"
                      title="恢复到此快照"
                    >
                      <RotateCcw className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => deleteSnapshot(snap.id)}
                      className="rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-red-400"
                      title="删除快照"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
                {restoredId === snap.id && (
                  <p className="mt-1 text-[10px] text-emerald-400">✓ 已创建恢复点</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
