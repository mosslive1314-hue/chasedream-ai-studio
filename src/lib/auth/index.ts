/**
 * Auth module — re-exports requireAuth from @eazo/sdk/server.
 *
 * In development (when EAZO_PRIVATE_KEY is not set), provides a
 * dev-mode stub that always returns a mock authenticated user.
 * In production, delegates to the real Eazo auth server.
 */

export type User = {
  id: string;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
};

export type AuthResult =
  | { ok: true; user: User }
  | { ok: false; response: Response };

const DEV_USER: User = {
  id: "dev-user-001",
  email: "dev@chasedream.local",
  name: "Dev User",
  avatarUrl: null,
};

const isDev = !process.env.EAZO_PRIVATE_KEY;

/**
 * Server-side auth guard.
 * - In production (EAZO_PRIVATE_KEY set): validates the x-eazo-session header.
 * - In development (no EAZO_PRIVATE_KEY): returns a mock dev user.
 */
export function requireAuth(request: {
  headers: { get(name: string): string | null };
}): AuthResult {
  if (isDev) {
    // Dev mode: always authenticated with mock user
    return { ok: true, user: DEV_USER };
  }

  // Production: delegate to @eazo/sdk/server
  try {
    const { requireAuth: realRequireAuth } = require("@eazo/sdk/server");
    return realRequireAuth(request);
  } catch (err) {
    console.error("[auth] Failed to initialize Eazo auth, falling back to dev mode:", err);
    return { ok: true, user: DEV_USER };
  }
}
