import {
  createRouter as createTanStackRouter,
} from "@tanstack/react-router";
import { QueryClient } from "@tanstack/react-query";
import { routeTree } from "./routeTree.gen";

export function createRouter() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes
        refetchOnWindowFocus: false,
      },
    },
  });

  const router = createTanStackRouter({
    routeTree,
    context: {
      queryClient,
    },
    defaultPreload: "intent",
    scrollRestoration: true,
  });

  // Disable SSR for all routes — this app is 100% client-rendered
  // (no SEO benefit, all pages use browser-only APIs).
  // defaultSsr is not available in RouterConstructorOptions,
  // so we set it via router.update() after creation.
  router.update({
    defaultSsr: false,
  } as any);

  return router;
}

export function getRouter() {
  return createRouter();
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof createRouter>;
  }
}
