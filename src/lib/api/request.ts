/**
 * Drop-in replacement for `fetch` that automatically injects auth headers.
 *
 * Replaces the old @eazo/sdk auth.getSessionHeader() approach.
 * In development, no auth header is needed (dev user is auto-authenticated).
 * In production, attach your auth token (e.g. from cookie or localStorage).
 */

export async function request(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  // TODO: In production, read auth token from cookie or Authorization header
  // const token = getAuthToken(); // implement based on your auth provider
  // const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  return fetch(input, {
    ...init,
    headers: {
      ...init.headers,
      // ...authHeaders,
    },
  });
}
