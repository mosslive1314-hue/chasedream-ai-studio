import {
  createRootRouteWithContext,
  Outlet,
} from "@tanstack/react-router";
import type { QueryClient } from "@tanstack/react-query";
import "@/app/globals.css";
import { ClientOnly } from "@/components/lib/ClientOnly";

interface RouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
});

/**
 * Root layout — SSR produces a minimal HTML shell. All interactive
 * content is wrapped in <ClientOnly> so it renders exclusively on
 * the client. This prevents SSR crashes from browser-only APIs
 * (window, localStorage, document, createPortal, IndexedDB, etc.).
 */
function RootLayout() {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <title>逐梦 Creator Studio</title>
        <meta name="description" content="AI 互动影游开发工作台 — 将剧本转化为可玩互动叙事结构" />
        <link rel="icon" href="/favicon.ico" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-svh flex flex-col" style={{ background: "var(--app-bg)", fontFamily: "Inter, 'PingFang SC', ui-sans-serif, system-ui, sans-serif" }}>
        <ClientOnly fallback={<div className="flex items-center justify-center h-screen text-sm text-gray-400">Loading...</div>}>
          <AppShell />
        </ClientOnly>
      </body>
    </html>
  );
}

/**
 * The full interactive app shell — only rendered on the client.
 * Lazy-loaded as a single chunk so SSR never touches browser APIs.
 */
function AppShell() {
  // These imports are safe inside <ClientOnly> because they only
  // run on the client where window/document/localStorage exist.
  const { StoreHydrator } = require("@/store/StoreHydrator");
  const { ProjectSwitcher } = require("@/store/ProjectSwitcher");
  const { UserSyncEffect } = require("@/components/user-profile/user-sync-effect");
  const { UndoRedoListener } = require("@/components/ui/UndoRedoListener");
  const { CommandPalette } = require("@/components/ui/CommandPalette");
  const { SideNav } = require("@/components/layout/nav");
  const { WorkbenchHeader } = require("@/components/layout/WorkbenchHeader");
  const { EmbeddedAdapter } = require("@/components/layout/EmbeddedAdapter");
  const { SaveIndicator } = require("@/components/ui/SaveIndicator");
  const { Breadcrumb } = require("@/components/ui/Breadcrumb");
  const { Toaster } = require("@/components/ui/sonner");
  const { ToastContainer } = require("@/components/ui/ToastContainer");
  const { OnboardingGate } = require("@/components/ui/OnboardingGate");
  const { AgentPanel } = require("@/components/ui/AgentPanel");
  const { SkillLibraryDrawer } = require("@/components/ui/SkillLibraryDrawer");
  const AIChatPanel = require("@/components/ui/AIChatPanel").default;
  const { ProModeToggle } = require("@/components/ui/ProModeToggle");
  const { AuthBootstrap } = require("@/components/lib/AuthBootstrap");

  return (
    <>
      <AuthBootstrap />
      <StoreHydrator />
      <ProjectSwitcher />
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
    </>
  );
}
