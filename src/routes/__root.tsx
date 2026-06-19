import {
  createRootRouteWithContext,
} from "@tanstack/react-router";
import type { QueryClient } from "@tanstack/react-query";
import React, { Suspense, lazy, useState, useEffect } from "react";
import "@/globals.css";

// Lazy-load the Studio layout (default entry for all routes)
const StudioLayout = lazy(() =>
  import("@/components/studio").then((m) => ({ default: m.StudioLayout }))
);

interface RouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
});

const loadingFallback = (
  <div className="flex items-center justify-center h-screen text-sm text-gray-400">
    Loading...
  </div>
);

/**
 * ClientGuard — renders fallback during SSR and the first client render,
 * then switches to children after mount. Uses suppressHydrationWarning
 * on the container to avoid React hydration mismatch errors.
 */
function ClientGuard({ children, fallback }: { children: React.ReactNode; fallback: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  return mounted ? children : fallback;
}

/**
 * Root layout — SSR produces a minimal HTML shell with the client entry
 * script injected in <head>. All interactive content is wrapped in
 * <ClientGuard> + <Suspense> so it renders exclusively on the client.
 */
function RootLayout() {
  return (
    <html lang="zh-CN" className="h-full antialiased" suppressHydrationWarning>
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
        <script type="module" src="/@id/virtual:tanstack-start-dev-client-entry" />
      </head>
      <body className="min-h-svh flex flex-col" style={{ background: "var(--app-bg)", fontFamily: "Inter, 'PingFang SC', ui-sans-serif, system-ui, sans-serif" }} suppressHydrationWarning>
        <ClientGuard fallback={loadingFallback}>
          <Suspense fallback={loadingFallback}>
            <StudioLayout />
          </Suspense>
        </ClientGuard>
      </body>
    </html>
  );
}
