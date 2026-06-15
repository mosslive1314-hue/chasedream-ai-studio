import { createServerFn } from "@tanstack/react-start";
import { requireAuth } from "@/lib/auth";
import { upsertUser } from "@/lib/db/queries";

/**
 * getUserProfile - Server Function
 * Returns the authenticated user's profile.
 * In dev mode, returns the mock dev user without requiring request headers.
 *
 * Note: The latest TanStack Start createServerFn no longer passes `request`
 * in the handler context. Auth validation via headers will be handled via
 * middleware once fully integrated.
 */
export const getUserProfile = createServerFn({ method: "GET" }).handler(
  async () => {
    // Dev-mode auth: no request headers needed
    const auth = requireAuth({ headers: { get: () => null } });
    if (!auth.ok) {
      throw new Error("Unauthorized");
    }

    const { user } = auth;

    // Upsert in the background
    upsertUser({
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
    }).catch((err) => {
      console.error("[profile] upsertUser failed", err);
    });

    return { ok: true, user };
  }
);
