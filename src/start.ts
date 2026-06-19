import { createStart } from "@tanstack/react-start";

/**
 * TanStack Start configuration.
 *
 * We keep SSR enabled (default) because the HTML document shell needs
 * to be server-rendered for TanStack Start's hydration to work correctly.
 * Instead of disabling SSR globally, we ensure the root layout's
 * interactive content is wrapped in <ClientGuard> so browser-only
 * code only runs on the client.
 */
export const startInstance = createStart(() => ({
  // Keep SSR enabled for document shell rendering.
  // defaultSsr: false breaks HTML output (empty body, no script tags).
}));
