import { useEffect, useRef } from "react";
import { useAuthStore } from "@/store/use-auth-store";

/**
 * Syncs the auth user on mount.
 * In the original version this synced the user profile to a server
 * via the Eazo mobile bridge. Now it just ensures the auth store is
 * bootstrapped on mount.
 */
export function UserSyncEffect() {
  const user = useAuthStore((s) => s.user);
  const syncedUserId = useRef<string | null>(null);

  useEffect(() => {
    if (!user) return;
    if (syncedUserId.current === user.id) return;

    syncedUserId.current = user.id;

    // TODO: In production, sync user profile to your backend here
    // e.g. await fetch("/api/user/profile", { method: "POST", body: JSON.stringify(user) });
  }, [user]);

  return null;
}
