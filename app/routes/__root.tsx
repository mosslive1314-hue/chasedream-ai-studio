import {
  createRootRouteWithContext,
  Link,
  Outlet,
} from "@tanstack/react-router";
import type { QueryClient } from "@tanstack/react-query";
import "@/app/globals.css";
import { EazoProvider } from "@eazo/sdk/react";
import { Toaster } from "@/components/ui/sonner";
import { UserSyncEffect } from "@/components/user-profile/user-sync-effect";
import { SideNav } from "@/components/layout/nav";
import { WorkbenchHeader } from "@/components/layout/WorkbenchHeader";
import { EmbeddedAdapter } from "@/components/layout/EmbeddedAdapter";
import { ToastContainer } from "@/components/ui/ToastContainer";
import { OnboardingGate } from "@/components/ui/OnboardingGate";
import { UndoRedoListener } from "@/components/ui/UndoRedoListener";
import { CommandPalette } from "@/components/ui/CommandPalette";
import { SaveIndicator } from "@/components/ui/SaveIndicator";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { EazoBannerHider } from "@/components/ui/EazoBannerHider";
import { AgentPanel } from "@/components/ui/AgentPanel";
import { SkillLibraryDrawer } from "@/components/ui/SkillLibraryDrawer";
import AIChatPanel from "@/components/ui/AIChatPanel";
import { ProModeToggle } from "@/components/ui/ProModeToggle";
import { StoreHydrator } from "@/store/StoreHydrator";
import { ProjectSwitcher } from "@/store/ProjectSwitcher";

interface RouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
});

function RootLayout() {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <title>逐梦 Creator Studio</title>
        <meta name="description" content="AI 互动影游开发工作台 — 将剧本转化为可玩互动叙事结构" />
        <link rel="icon" href="https://eazo.ai/favicon.ico" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-svh flex flex-col" style={{ background: "var(--app-bg)", fontFamily: "Inter, 'PingFang SC', ui-sans-serif, system-ui, sans-serif" }}>
        <EazoProvider>
          <StoreHydrator />
          <ProjectSwitcher />
          <EazoBannerHider />
          <UserSyncEffect />
          <UndoRedoListener />
          <CommandPalette />
          <SideNav />
          <main className="flex-1 flex flex-col md:ml-[200px]" style={{ transition: "margin-left 220ms ease" }}>
            <EmbeddedAdapter header={<WorkbenchHeader />}>
              <div className="flex items-center justify-between">
                <Breadcrumb />
                <div className="px-4 py-2">
                  <SaveIndicator />
                </div>
              </div>
              <Outlet />
            </EmbeddedAdapter>
          </main>
          <Toaster />
          <ToastContainer />
          <OnboardingGate />
          <AgentPanel />
          <SkillLibraryDrawer />
          <AIChatPanel />
          <ProModeToggle />
        </EazoProvider>
      </body>
    </html>
  );
}
