import { useState, useEffect, type ReactNode } from "react";

/**
 * Renders children only on the client. During SSR, returns the optional
 * `fallback` (default: null). This is the standard escape hatch for
 * components that use browser-only APIs (window, localStorage, document,
 * createPortal, IndexedDB, etc.).
 *
 * Usage:
 *   <ClientOnly>
 *     <EazoProvider>...</EazoProvider>
 *   </ClientOnly>
 *
 *   <ClientOnly fallback={<div>Loading...</div>}>
 *     <ChartThatUsesCanvas />
 *   </ClientOnly>
 */
export function ClientOnly({
  children,
  fallback = null,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <>{fallback}</>;
  return <>{children}</>;
}
