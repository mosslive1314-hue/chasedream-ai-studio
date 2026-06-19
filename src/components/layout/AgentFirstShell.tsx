/**
 * AgentFirstShell — Agent-First 三区布局
 *
 * 布局结构：Chat(左) + Canvas(中) + Context(右)
 * - 左侧：Agent 对话面板，常驻，可折叠 (320px)
 * - 中间：主画布区，顶部 tab 切换路由 + <Outlet /> 渲染
 * - 右侧：上下文面板，动态显示属性，可折叠 (280px)
 */

import { Suspense, lazy, useCallback, useEffect, useRef } from "react";
import { Outlet, useNavigate, useLocation } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  GitBranch, Play, Package, Settings,
  PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen,
} from "lucide-react";
import { StoreHydrator } from "@/store/StoreHydrator";
import { ProjectSwitcher } from "@/store/ProjectSwitcher";
import { UserSyncEffect } from "@/components/user-profile/user-sync-effect";
import { UndoRedoListener } from "@/components/ui/UndoRedoListener";
import { CommandPalette } from "@/components/ui/CommandPalette";
import { SaveIndicator } from "@/components/ui/SaveIndicator";
import { Toaster } from "@/components/ui/sonner";
import { ToastContainer } from "@/components/ui/ToastContainer";
import { OnboardingGate } from "@/components/ui/OnboardingGate";
import { AuthBootstrap } from "@/components/lib/AuthBootstrap";
import { AgentPanel } from "@/components/ui/AgentPanel";
import { ContextPanel } from "@/components/layout/ContextPanel";
import { useUIStore, type WorkbenchTab } from "@/store/use-ui-store";

const SkillLibraryDrawer = lazy(() =>
  import("@/components/ui/SkillLibraryDrawer").then(m => ({ default: m.SkillLibraryDrawer }))
);
const ProModeToggle = lazy(() =>
  import("@/components/ui/ProModeToggle").then(m => ({ default: m.ProModeToggle }))
);

// ─── Tab → Route mapping ─────────────────────────────────────

const TAB_ROUTE_MAP: Record<WorkbenchTab, string> = {
  canvas: "/nodes",
  simulator: "/simulator",
  assets: "/assets",
  settings: "/settings",
};

const ROUTE_TAB_MAP: Record<string, WorkbenchTab> = {
  "/nodes": "canvas",
  "/simulator": "simulator",
  "/assets": "assets",
  "/settings": "settings",
  "/story-overview": "canvas",
  "/parse": "canvas",
  "/script": "canvas",
  "/interaction": "canvas",
  "/cinematic": "canvas",
  "/overview": "canvas",
  "/publish": "simulator",
  "/version": "canvas",
  "/collab": "canvas",
  "/asset-library": "assets",
  "/my-works": "canvas",
  "/pipeline": "canvas",
};

// ─── Tab Config ──────────────────────────────────────────────

const TABS: { id: WorkbenchTab; label: string; icon: typeof GitBranch }[] = [
  { id: "canvas",    label: "节点画布", icon: GitBranch },
  { id: "simulator", label: "演出预览", icon: Play },
  { id: "assets",    label: "资产工坊", icon: Package },
  { id: "settings",  label: "设置",     icon: Settings },
];

// ─── Design Tokens ───────────────────────────────────────────

const S = {
  bg: "#F5F6FA",
  card: "#FFFFFF",
  border: "#E2E5F0",
  primary: "#5E50E8",
  primary10: "rgba(94,80,232,0.10)",
  text3: "#8892B0",
};

// ─── Component ───────────────────────────────────────────────

export function AgentFirstShell() {
  const agentPanelCollapsed = useUIStore(s => s.agentPanelCollapsed);
  const toggleAgentPanel = useUIStore(s => s.toggleAgentPanel);
  const contextPanelCollapsed = useUIStore(s => s.contextPanelCollapsed);
  const toggleContextPanel = useUIStore(s => s.toggleContextPanel);
  const activeTab = useUIStore(s => s.activeTab);
  const setActiveTab = useUIStore(s => s.setActiveTab);

  const navigate = useNavigate();
  const location = useLocation();

  // Sync activeTab from route (one-way: route → tab)
  const prevPathnameRef = useRef("");
  useEffect(() => {
    if (location.pathname !== prevPathnameRef.current) {
      prevPathnameRef.current = location.pathname;
      const tabFromRoute = ROUTE_TAB_MAP[location.pathname];
      if (tabFromRoute) {
        setActiveTab(tabFromRoute);
      }
    }
  }, [location.pathname, setActiveTab]);

  // Initialize activeTab from route on first mount
  useEffect(() => {
    const tabFromRoute = ROUTE_TAB_MAP[location.pathname];
    if (tabFromRoute) {
      setActiveTab(tabFromRoute);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Tab click → navigate to route
  const handleTabClick = useCallback((tab: WorkbenchTab) => {
    setActiveTab(tab);
    const route = TAB_ROUTE_MAP[tab];
    if (route && location.pathname !== route) {
      navigate({ to: route });
    }
  }, [setActiveTab, navigate, location.pathname]);

  return (
    <>
      <AuthBootstrap />
      <StoreHydrator />
      <ProjectSwitcher />
      <UserSyncEffect />
      <UndoRedoListener />
      <CommandPalette />

      {/* Main three-zone layout */}
      <div className="flex h-screen w-screen overflow-hidden" style={{ background: S.bg }}>
        {/* Zone A: Agent Chat Panel (left, 320px, collapsible) */}
        <div
          className="h-full shrink-0 transition-all duration-200"
          style={{ width: agentPanelCollapsed ? 0 : 320, overflow: "hidden" }}
        >
          <AgentPanel embedded />
        </div>

        {/* Zone B: Main Content (center, flex-1) */}
        <div className="flex-1 flex flex-col min-w-0 h-full">
          {/* Top Toolbar with Tab Bar */}
          <div
            className="flex items-center justify-between px-3 h-11 shrink-0 border-b"
            style={{ background: S.card, borderColor: S.border }}
          >
            <div className="flex items-center gap-1">
              <button
                onClick={toggleAgentPanel}
                className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
                title={agentPanelCollapsed ? "展开 AI 助手" : "收起 AI 助手"}
              >
                {agentPanelCollapsed
                  ? <PanelLeftOpen size={15} style={{ color: S.text3 }} />
                  : <PanelLeftClose size={15} style={{ color: S.text3 }} />
                }
              </button>
            </div>

            <div className="flex items-center gap-0.5 px-2">
              {TABS.map(tab => {
                const isActive = activeTab === tab.id;
                const Icon = tab.icon;
                return (
                  <motion.button
                    key={tab.id}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => handleTabClick(tab.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                    style={{
                      background: isActive ? S.primary10 : "transparent",
                      color: isActive ? S.primary : S.text3,
                    }}
                  >
                    <Icon size={13} />
                    <span>{tab.label}</span>
                  </motion.button>
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              <SaveIndicator />
              <button
                onClick={toggleContextPanel}
                className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
                title={contextPanelCollapsed ? "展开属性面板" : "收起属性面板"}
              >
                {contextPanelCollapsed
                  ? <PanelRightOpen size={15} style={{ color: S.text3 }} />
                  : <PanelRightClose size={15} style={{ color: S.text3 }} />
                }
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-hidden">
            <Outlet />
          </div>
        </div>

        {/* Zone C: Context Panel (right, 280px, collapsible) */}
        <div
          className="h-full shrink-0 transition-all duration-200 border-l"
          style={{
            width: contextPanelCollapsed ? 40 : 280,
            borderColor: S.border,
            overflow: "hidden",
          }}
        >
          <ContextPanel />
        </div>
      </div>

      <Toaster />
      <ToastContainer />
      <OnboardingGate />
      <Suspense fallback={null}>
        <SkillLibraryDrawer />
        <ProModeToggle />
      </Suspense>
    </>
  );
}
