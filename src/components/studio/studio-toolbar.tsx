"use client";

import { useState } from "react";
import { Settings, Palette, Download, Music, Edit2, Check, Loader2, Users, FolderOpen, Save } from "lucide-react";
import { useSaveStatus } from "./use-save-status";
import { PipelineProgress } from "./pipeline-progress";
import type { ManageModalType } from "./manage-modal";
import type { PipelineStageId } from "@/store";

// 视图切换 tab 类型 — 按 8 阶段工作流归类（22 tab 精简为 14 个阶段子视图）
export type ViewTab =
  // entry 阶段
  | "entry" | "script" | "preview"
  // narrative 阶段
  | "characters" | "scenes" | "props" | "relationships" | "moral"
  // interaction 阶段
  | "graph" | "interaction" | "timeline"
  // cinematic 阶段
  | "cinematic"
  // asset 阶段
  | "assets"
  // qa 阶段
  | "qa" | "health"
  // release 阶段
  | "release" | "publish";

// 工具栏右侧可弹出的面板类型
export type ToolbarPanel = "none" | "settings" | "style" | "export" | "import" | "audio";

interface StudioToolbarProps {
  projectName: string;
  activePanel: ToolbarPanel;
  onPanelToggle: (panel: ToolbarPanel) => void;
  /** 项目名持久化回调：编辑完成（失焦/回车）时触发 */
  onProjectNameChange?: (newName: string) => void;
  /** 打开管理模态（协作/作品/版本） */
  onManageModal: (type: ManageModalType) => void;
  /** 点击进度条阶段点时触发（回看该阶段默认子视图） */
  onStageClick?: (stage: PipelineStageId) => void;
}

// 项目名 + 保存状态（嵌入工具栏左侧，不浮在画布上）
function ProjectInfo({
  projectName,
  onProjectNameChange,
}: {
  projectName: string;
  onProjectNameChange?: (newName: string) => void;
}) {
  const { status, lastSaved } = useSaveStatus();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(projectName);

  const formatTime = (date: Date) => {
    const h = String(date.getHours()).padStart(2, "0");
    const m = String(date.getMinutes()).padStart(2, "0");
    return `${h}:${m}`;
  };

  const commitEdit = () => {
    setEditing(false);
    const trimmed = name.trim();
    const finalName = trimmed || "未命名项目";
    if (finalName !== projectName && onProjectNameChange) onProjectNameChange(finalName);
  };

  return (
    <div className="flex items-center gap-2">
      {editing ? (
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitEdit();
            if (e.key === "Escape") {
              setName(projectName);
              setEditing(false);
            }
          }}
          className="w-40 rounded bg-zinc-900 px-2 py-0.5 text-sm text-zinc-200 outline-none ring-1 ring-zinc-700"
        />
      ) : (
        <button
          onClick={() => {
            setName(projectName);
            setEditing(true);
          }}
          className="flex items-center gap-1.5 text-zinc-200 hover:text-white"
          title="点击编辑项目名"
        >
          <span className="max-w-[160px] truncate text-sm font-medium">{projectName}</span>
          <Edit2 className="h-3 w-3 text-zinc-500" />
        </button>
      )}
      <span className="text-zinc-700">·</span>
      {status === "saving" ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-500" />
          <span className="text-xs text-amber-400">保存中</span>
        </>
      ) : status === "saved" && lastSaved ? (
        <>
          <Check className="h-3.5 w-3.5 text-emerald-500" />
          <span className="text-xs text-zinc-400">已保存 {formatTime(lastSaved)}</span>
        </>
      ) : null}
    </div>
  );
}

// 顶部极简工具栏：左 项目名+保存状态 / 中 8阶段进度条 / 右 管理图标+面板触发
export function StudioToolbar({
  projectName,
  activePanel,
  onPanelToggle,
  onProjectNameChange,
  onManageModal,
  onStageClick,
}: StudioToolbarProps) {
  return (
    <div className="flex h-12 shrink-0 items-center justify-between border-b border-zinc-800 bg-zinc-950 px-4">
      {/* 左：项目名 + 保存状态 */}
      <div className="flex shrink-0 items-center">
        <ProjectInfo projectName={projectName} onProjectNameChange={onProjectNameChange} />
      </div>

      {/* 中：8 阶段管线进度条（常驻，无折叠） */}
      <div className="mx-4 flex flex-1 items-center justify-center overflow-x-auto scrollbar-thin">
        <PipelineProgress onStageClick={onStageClick} />
      </div>

      {/* 右：管理入口 + 面板触发 */}
      <div className="flex shrink-0 items-center gap-1">
        {/* 管理入口（从原 22 tab 中移出，改为模态） */}
        <button
          onClick={() => onManageModal("collab")}
          className="rounded-md p-1.5 text-zinc-400 transition hover:bg-zinc-900 hover:text-zinc-200"
          title="协作管理"
        >
          <Users className="h-4 w-4" />
        </button>
        <button
          onClick={() => onManageModal("my-works")}
          className="rounded-md p-1.5 text-zinc-400 transition hover:bg-zinc-900 hover:text-zinc-200"
          title="我的作品"
        >
          <FolderOpen className="h-4 w-4" />
        </button>
        <button
          onClick={() => onManageModal("versions")}
          className="rounded-md p-1.5 text-zinc-400 transition hover:bg-zinc-900 hover:text-zinc-200"
          title="版本管理"
        >
          <Save className="h-4 w-4" />
        </button>

        {/* 分隔线 */}
        <div className="mx-1 h-5 w-px bg-zinc-800" />

        {/* 面板触发 */}
        <button
          onClick={() => onPanelToggle(activePanel === "audio" ? "none" : "audio")}
          className={`rounded-md p-1.5 hover:bg-zinc-900 ${
            activePanel === "audio" ? "bg-zinc-900 text-orange-400" : "text-zinc-400 hover:text-zinc-200"
          }`}
          title="音频预览"
        >
          <Music className="h-4 w-4" />
        </button>
        <button
          onClick={() => onPanelToggle(activePanel === "style" ? "none" : "style")}
          className={`rounded-md p-1.5 hover:bg-zinc-900 ${
            activePanel === "style" ? "bg-zinc-900 text-orange-400" : "text-zinc-400 hover:text-zinc-200"
          }`}
          title="样式选择"
        >
          <Palette className="h-4 w-4" />
        </button>
        <button
          onClick={() => onPanelToggle(activePanel === "export" ? "none" : "export")}
          className={`rounded-md p-1.5 hover:bg-zinc-900 ${
            activePanel === "export" ? "bg-zinc-900 text-orange-400" : "text-zinc-400 hover:text-zinc-200"
          }`}
          title="导出项目"
        >
          <Download className="h-4 w-4" />
        </button>
        <button
          onClick={() => onPanelToggle(activePanel === "settings" ? "none" : "settings")}
          className={`rounded-md p-1.5 hover:bg-zinc-900 ${
            activePanel === "settings" ? "bg-zinc-900 text-orange-400" : "text-zinc-400 hover:text-zinc-200"
          }`}
          title="设置"
        >
          <Settings className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
