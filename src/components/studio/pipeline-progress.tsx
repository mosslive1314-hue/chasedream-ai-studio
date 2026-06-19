"use client";

import { Check } from "lucide-react";
import { usePipelineStore, STAGE_DEFS, STAGE_ORDER, type PipelineStageId } from "@/store";
import { cn } from "@/utils/utils";

/**
 * 管线阶段步骤指示器 — AltFlow 式横向 ①②③④⑤⑥⑦⑧。
 *
 * 设计借鉴 AltFlow 顶部 Step 指示器：
 * - 所有阶段以编号圆点常驻显示，当前阶段高亮（橙色），已完成（翠绿打勾），未到（暗灰描边）
 * - 点击任意阶段可回看其默认子视图（不回退进度，仅切换视图）
 * - 当前阶段名在指示器右侧显示，避免信息过载
 * - 连接线表示阶段流转方向
 *
 * 保留原有"完成本阶段"按钮（仅当 isStageComplete() 为 true 时可点击），
 * 放在指示器右侧，作为正式推进进度的入口。
 */
export function PipelineProgress({ onStageClick }: { onStageClick?: (stage: PipelineStageId) => void }) {
  const currentStage = usePipelineStore((s) => s.currentStage);
  const stageStatuses = usePipelineStore((s) => s.stageStatuses);
  const advance = usePipelineStore((s) => s.advance);
  const setStage = usePipelineStore((s) => s.setStage);
  const isStageComplete = usePipelineStore((s) => s.isStageComplete);

  const canAdvance = isStageComplete();
  const isLastStage = currentStage === "release";
  const currentIdx = STAGE_ORDER.indexOf(currentStage);
  const currentDef = STAGE_DEFS.find((s) => s.id === currentStage)!;

  return (
    <div className="flex items-center gap-3">
      {/* 横向步骤指示器 ①──②──③... */}
      <div className="flex items-center">
        {STAGE_DEFS.map((def, idx) => {
          const status = stageStatuses[def.id];
          const isCurrent = def.id === currentStage;
          const isComplete = status === "complete";
          const isPast = idx < currentIdx;
          const reachable = isPast || isCurrent || isComplete;

          return (
            <div key={def.id} className="flex items-center">
              {/* 编号圆点 */}
              <button
                onClick={() => {
                  if (reachable) {
                    setStage(def.id);
                    onStageClick?.(def.id);
                  }
                }}
                disabled={!reachable}
                title={`${idx + 1}. ${def.label}`}
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold transition",
                  isCurrent && "bg-orange-500 text-white ring-2 ring-orange-500/30 ring-offset-2 ring-offset-zinc-950",
                  isComplete && "bg-emerald-600 text-white hover:bg-emerald-500",
                  !isCurrent && !isComplete && reachable && "border border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200",
                  !reachable && "cursor-not-allowed border border-zinc-800 bg-zinc-900 text-zinc-700",
                )}
              >
                {isComplete ? <Check className="h-3 w-3" /> : idx + 1}
              </button>

              {/* 连接线（最后一个不显示） */}
              {idx < STAGE_DEFS.length - 1 && (
                <div
                  className={cn(
                    "h-px w-4",
                    isComplete || isPast ? "bg-emerald-600/50" : "bg-zinc-800",
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* 当前阶段名（仅显示当前，避免信息过载） */}
      <div className="flex items-center gap-1.5 border-l border-zinc-800 pl-3">
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            stageStatuses[currentStage] === "complete" && "bg-emerald-500",
            stageStatuses[currentStage] === "active" && "animate-pulse bg-orange-500",
            stageStatuses[currentStage] === "pending" && "bg-zinc-600",
          )}
        />
        <span className="whitespace-nowrap text-xs font-medium text-zinc-200">{currentDef.label}</span>
      </div>

      {/* 完成本阶段按钮（仅非最后阶段显示） */}
      {!isLastStage && (
        <button
          onClick={() => {
            if (canAdvance) advance();
          }}
          disabled={!canAdvance}
          className={cn(
            "flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition",
            canAdvance
              ? "bg-orange-500 text-white hover:bg-orange-400"
              : "cursor-not-allowed bg-zinc-800 text-zinc-600",
          )}
          title={canAdvance ? "锁定本阶段产出，正式进入下一阶段" : "本阶段产出未完成，无法正式推进"}
        >
          <Check className="h-3 w-3" />
          <span>完成</span>
        </button>
      )}
    </div>
  );
}
