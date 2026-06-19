/**
 * Auth module — server-side authentication.
 *
 * In development: returns a mock authenticated user.
 * In production: should be connected to your actual auth provider
 * (e.g. verify JWT token from cookies, check session in DB, etc.).
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
  name: "开发者",
  avatarUrl: null,
};

/**
 * Server-side auth guard.
 * - In development: always returns the mock dev user.
 * - In production: TODO — validate session token from request headers.
 */
export function requireAuth(_request: {
  headers: { get(name: string): string | null };
}): AuthResult {
  const isDev = !process.env.AUTH_SECRET;

  if (isDev) {
    return { ok: true, user: DEV_USER };
  }

  // TODO: Production auth — verify session token from _request.headers
  // Example: const token = _request.headers.get("authorization");
  //          const user = await verifyToken(token);
  //          if (!user) return { ok: false, response: new Response("Unauthorized", { status: 401 }) };

  // Fallback for now
  return { ok: true, user: DEV_USER };
}
