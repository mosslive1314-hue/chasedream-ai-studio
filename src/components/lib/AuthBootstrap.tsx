/**
 * AuthBootstrap — initializes the local auth store on mount.
 */

import { useEffect } from "react";
import { useAuthStore } from "@/store/use-auth-store";

export function AuthBootstrap() {
  const bootstrap = useAuthStore((s) => s.bootstrap);
  const loading = useAuthStore((s) => s.loading);
  const authenticated = useAuthStore((s) => s.authenticated);

  useEffect(() => {
    // Auto-bootstrap on mount if not already authenticated
    if (loading && !authenticated) {
      bootstrap();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
