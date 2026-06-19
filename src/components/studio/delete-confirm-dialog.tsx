"use client";

import { useMemo } from "react";
import { AlertTriangle, X, Trash2, Link2, Users, Film, Clapperboard } from "lucide-react";
import { checkNodeDeletionImpact } from "@/lib/cascade-validation";
import { useNarrativeStore } from "@/store";

interface DeleteConfirmDialogProps {
  nodeId: string;
  onConfirm: () => void;
  onCancel: () => void;
}

// 删除确认对话框 — 连接真实级联验证引擎
export function DeleteConfirmDialog({ nodeId, onConfirm, onCancel }: DeleteConfirmDialogProps) {
  const node = useNarrativeStore((s) => s.storyNodes.find((n) => n.id === nodeId));

  // 计算级联影响（仅在组件渲染时计算一次）
  const impact = useMemo(() => checkNodeDeletionImpact(nodeId), [nodeId]);

  if (!node) {
    // 节点不存在，直接确认（清理用）
    onConfirm();
    return null;
  }

  const isError = impact?.severity === "error";
  const inEdgeCount = impact?.message.match(/(\d+)\s*条入边/)?.[1] ?? "0";
  const outEdgeCount = impact?.message.match(/(\d+)\s*条出边/)?.[1] ?? "0";
  const charCount = impact?.message.match(/(\d+)\s*个角色/)?.[1] ?? "0";
  const sceneCount = impact?.message.match(/(\d+)\s*个场景/)?.[1] ?? "0";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70" onClick={onCancel}>
      <div
        className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-950 p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 标题栏 */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-1.5 text-sm font-medium text-zinc-100">
            <AlertTriangle className={`h-4 w-4 ${isError ? "text-red-400" : "text-amber-400"}`} />
            确认删除节点
          </h2>
          <button onClick={onCancel} className="text-zinc-500 hover:text-zinc-300">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* 节点信息 */}
        <div className="mb-3 rounded-md border border-zinc-800 bg-zinc-900/50 p-3">
          <div className="text-xs text-zinc-500">即将删除节点：</div>
          <div className="mt-1 text-sm font-medium text-zinc-100">{node.label}</div>
          <div className="mt-0.5 text-[10px] text-zinc-600">ID: {node.id} · 类型: {node.type}</div>
        </div>

        {/* 级联影响报告 */}
        {impact && (
          <div className={`mb-4 rounded-md border p-3 ${
            isError
              ? "border-red-500/30 bg-red-500/10"
              : "border-amber-500/30 bg-amber-500/10"
          }`}>
            <div className={`mb-2 text-[11px] font-semibold ${
              isError ? "text-red-400" : "text-amber-400"
            }`}>
              {isError ? "⚠ 高风险：此节点有关联连接" : "⚠ 注意：此节点有引用关系"}
            </div>
            <p className="mb-3 text-[10px] text-zinc-400">{impact.message}</p>

            {/* 影响详情 */}
            <div className="space-y-1.5">
              {(Number(inEdgeCount) > 0 || Number(outEdgeCount) > 0) && (
                <div className="flex items-center gap-2 text-[10px] text-zinc-400">
                  <Link2 className="h-3 w-3 text-zinc-500" />
                  <span>
                    {Number(inEdgeCount) > 0 && `${inEdgeCount} 条入边`}
                    {Number(inEdgeCount) > 0 && Number(outEdgeCount) > 0 && " · "}
                    {Number(outEdgeCount) > 0 && `${outEdgeCount} 条出边`}
                    <span className="ml-1 text-zinc-600">（将被移除）</span>
                  </span>
                </div>
              )}
              {Number(charCount) > 0 && (
                <div className="flex items-center gap-2 text-[10px] text-zinc-400">
                  <Users className="h-3 w-3 text-zinc-500" />
                  <span>{charCount} 个角色引用此节点<span className="ml-1 text-zinc-600">（将产生悬空引用）</span></span>
                </div>
              )}
              {Number(sceneCount) > 0 && (
                <div className="flex items-center gap-2 text-[10px] text-zinc-400">
                  <Film className="h-3 w-3 text-zinc-500" />
                  <span>{sceneCount} 个场景引用此节点<span className="ml-1 text-zinc-600">（将产生悬空引用）</span></span>
                </div>
              )}
              {impact.affectedCinematics.length > 0 && (
                <div className="flex items-center gap-2 text-[10px] text-zinc-400">
                  <Clapperboard className="h-3 w-3 text-zinc-500" />
                  <span>{impact.affectedCinematics.length} 个演出方向<span className="ml-1 text-zinc-600">（将变为孤立数据）</span></span>
                </div>
              )}
              {Number(inEdgeCount) === 0 && Number(outEdgeCount) === 0 &&
               Number(charCount) === 0 && Number(sceneCount) === 0 &&
               impact.affectedCinematics.length === 0 && (
                <div className="text-[10px] text-zinc-500">
                  此节点无关联连接和引用，可安全删除。
                </div>
              )}
            </div>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-md border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-800"
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-white transition-colors ${
              isError
                ? "bg-red-600 hover:bg-red-500"
                : "bg-red-600 hover:bg-red-500"
            }`}
          >
            <Trash2 className="h-3 w-3" />
            确认删除
          </button>
        </div>

        {/* 底部提示 */}
        <div className="mt-3 text-center text-[10px] text-zinc-600">
          删除操作不可撤销。建议先创建版本快照。
        </div>
      </div>
    </div>
  );
}
