"use client";

import { useState, useRef, useCallback, useEffect, Suspense, lazy, type MouseEvent } from "react";
import { GripVertical } from "lucide-react";
import { StudioToolbar, type ViewTab, type ToolbarPanel } from "./studio-toolbar";
import { ChatPanel } from "./chat-panel";
import { CanvasArea } from "./canvas-area";
import { SettingsPanel } from "./settings-panel";
import { StylePanel } from "./style-panel";
import { ExportPanel } from "./export-panel";
import { AudioPanel } from "./audio-panel";
import { ManageModal, type ManageModalType } from "./manage-modal";
import {
  useProjectStore,
  usePipelineStore,
  StoreHydrator, ProjectSwitcher,
  type PipelineStageId,
} from "@/store";
import { AuthBootstrap } from "@/components/lib/AuthBootstrap";
import { UserSyncEffect } from "@/components/user-profile/user-sync-effect";
import { UndoRedoListener } from "@/components/ui/UndoRedoListener";
import { CommandPalette } from "@/components/ui/CommandPalette";
import { Toaster } from "@/components/ui/sonner";
import { ToastContainer } from "@/components/ui/ToastContainer";
import { OnboardingGate } from "@/components/ui/OnboardingGate";

const SkillLibraryDrawer = lazy(() =>
  import("@/components/ui/SkillLibraryDrawer").then((m) => ({ default: m.SkillLibraryDrawer }))
);

// 可拖拽分隔条
function ResizeHandle({ onDrag }: { onDrag: (deltaX: number) => void }) {
  const draggingRef = useRef(false);
  const lastXRef = useRef(0);

  const handleMouseDown = useCallback((e: MouseEvent) => {
    e.preventDefault();
    draggingRef.current = true;
    lastXRef.current = e.clientX;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    const handleMove = (ev: globalThis.MouseEvent) => {
      if (!draggingRef.current) return;
      const delta = ev.clientX - lastXRef.current;
      lastXRef.current = ev.clientX;
      onDrag(delta);
    };

    const handleUp = () => {
      draggingRef.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
  }, [onDrag]);

  return (
    <div
      onMouseDown={handleMouseDown}
      className="group relative w-1 shrink-0 cursor-col-resize bg-zinc-800 transition-colors hover:bg-orange-500"
      title="拖拽调整宽度"
    >
      <div className="absolute left-1/2 top-1/2 flex h-8 w-4 -translate-x-1/2 -translate-y-1/2 items-center justify-center">
        <GripVertical className="h-3 w-3 text-zinc-600 group-hover:text-orange-300" />
      </div>
    </div>
  );
}

// 极简布局：对话区(左 可调宽) + 画布区(右 flex-1)
// 阶段+对话双驱动：activeTab 随 currentStage 自动切换到阶段默认子视图
const STAGE_DEFAULT_TAB: Record<PipelineStageId, ViewTab> = {
  entry: "entry",
  narrative: "characters",
  interaction: "graph",
  cinematic: "cinematic",
  asset: "assets",
  qa: "qa",
  preview: "preview",
  release: "release",
};

export function StudioLayout() {
  const [activeTab, setActiveTab] = useState<ViewTab>("script");
  const [activePanel, setActivePanel] = useState<ToolbarPanel>("none");
  const [chatWidthPct, setChatWidthPct] = useState(42);
  const [manageModal, setManageModal] = useState<ManageModalType>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentProjectId = useProjectStore((s) => s.currentProjectId);
  const projectName = useProjectStore(
    (s) => s.projects.find((p) => p.id === s.currentProjectId)?.title ?? "未命名项目"
  );
  const updateProject = useProjectStore((s) => s.updateProject);
  const currentStage = usePipelineStore((s) => s.currentStage);

  // 阶段切换时自动切换到该阶段的默认子视图
  useEffect(() => {
    setActiveTab(STAGE_DEFAULT_TAB[currentStage]);
  }, [currentStage]);

  // 监听 EntryView 等组件发出的 tab 切换事件（如"高级模式"入口）
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as ViewTab;
      if (detail) setActiveTab(detail);
    };
    window.addEventListener("studio-switch-tab", handler);
    return () => window.removeEventListener("studio-switch-tab", handler);
  }, []);

  // 监听 ReleaseView 等组件发出的管理模态打开事件
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as ManageModalType;
      if (detail) setManageModal(detail);
    };
    window.addEventListener("studio-open-manage", handler);
    return () => window.removeEventListener("studio-open-manage", handler);
  }, []);

  const handlePanelToggle = (panel: ToolbarPanel) => {
    setActivePanel((prev) => (prev === panel ? "none" : panel));
  };

  const handleProjectNameChange = (newName: string) => {
    if (currentProjectId) {
      updateProject(currentProjectId, { title: newName });
    }
  };

  // 点击进度条阶段点 → 回看该阶段默认子视图（不回退进度）
  const handleStageClick = (stage: PipelineStageId) => {
    setActiveTab(STAGE_DEFAULT_TAB[stage]);
  };

  const handleResize = useCallback((deltaX: number) => {
    const container = containerRef.current;
    if (!container) return;
    const containerWidth = container.clientWidth;
    if (containerWidth === 0) return;
    const deltaPct = (deltaX / containerWidth) * 100;
    setChatWidthPct((prev) => Math.min(60, Math.max(28, prev + deltaPct)));
  }, []);

  return (
    <div className="flex h-svh flex-col bg-zinc-950 text-zinc-100">
      {/* 基础设施 */}
      <AuthBootstrap />
      <StoreHydrator />
      <ProjectSwitcher />
      <UserSyncEffect />
      <UndoRedoListener />
      <CommandPalette />

      {/* 顶部工具栏（含项目名+保存状态+8阶段进度条+管理入口） */}
      <StudioToolbar
        projectName={projectName}
        activePanel={activePanel}
        onPanelToggle={handlePanelToggle}
        onProjectNameChange={handleProjectNameChange}
        onManageModal={setManageModal}
        onStageClick={handleStageClick}
      />

      {/* 主体：对话区 + 画布区 */}
      <div ref={containerRef} className="flex min-h-0 flex-1">
        <div className="shrink-0 border-r border-zinc-800" style={{ width: `${chatWidthPct}%` }}>
          <ChatPanel />
        </div>
        <ResizeHandle onDrag={handleResize} />
        <div className="relative min-w-0 flex-1">
          <CanvasArea
            activeTab={activeTab}
            selectedNodeId={null}
            onSelectNode={() => {}}
            onTabChange={setActiveTab}
          />
        </div>
      </div>

      {/* 弹出面板 */}
      {activePanel === "audio" && <AudioPanel onClose={() => setActivePanel("none")} />}
      {activePanel === "settings" && <SettingsPanel onClose={() => setActivePanel("none")} />}
      {activePanel === "style" && <StylePanel onClose={() => setActivePanel("none")} />}
      {activePanel === "export" && <ExportPanel onClose={() => setActivePanel("none")} />}

      {/* 管理模态（协作/作品/版本） */}
      <ManageModal type={manageModal} onClose={() => setManageModal(null)} />

      {/* Overlay */}
      <Toaster />
      <ToastContainer />
      <OnboardingGate />
      <Suspense fallback={null}>
        <SkillLibraryDrawer />
      </Suspense>
    </div>
  );
}
