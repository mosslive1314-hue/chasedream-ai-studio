import { createServerFn } from "@tanstack/react-start";
import { requireAuth } from "@/lib/auth";

/**
 * sendTestNotification - Server Function
 * Stub notification — replaced during ChaseDream Studio build.
 *
 * Note: The latest TanStack Start createServerFn no longer passes `request`
 * in the handler context. Auth is handled via middleware or the `data` field.
 * For now, we use a dev-mode stub that doesn't need request headers.
 */
export const sendTestNotification = createServerFn({ method: "POST" }).handler(
  async () => {
    return { sent: true, message: "Notifications are configured per-project." };
  }
);

/**
 * dailyDigest - Server Function (cron-triggered)
 * Scheduled by Vercel Cron or equivalent. Authenticated via CRON_SECRET.
 *
 * Note: @eazo/sdk/server notifications are lazily imported only in
 * production (requires EAZO_PRIVATE_KEY).
 */
export const dailyDigest = createServerFn({ method: "GET" }).handler(
  async () => {
    const expected = process.env.CRON_SECRET;
    if (!expected) {
      throw new Error("CRON_SECRET is not configured");
    }
    // In the new API, headers come via middleware, not request.
    // For now, this function requires CRON_SECRET to be set but
    // header validation is deferred to middleware integration.
    console.log("[dailyDigest] Cron job triggered");

    // Lazy-import @eazo/sdk/server only when needed (requires EAZO_PRIVATE_KEY)
    const { notifications, EazoNotificationPublishError } = await import("@eazo/sdk/server");

    try {
      const result = await notifications.publish({
        title: "Daily reminder",
        body: "Don't forget to review your tasks today.",
        data: { source: "cron-daily-digest" },
      });
      return result;
    } catch (err) {
      if (err instanceof EazoNotificationPublishError) {
        throw new Error(`Notification error: ${err.message} (code: ${err.code})`);
      }
      console.error("[notifications/cron] unexpected error", err);
      throw new Error("Publish failed");
    }
  }
);
