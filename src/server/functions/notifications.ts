import { createServerFn } from "@tanstack/react-start";

/**
 * sendTestNotification - Server Function
 * Notification stub — will be wired to a real push notification
 * provider in production.
 */
export const sendTestNotification = createServerFn({ method: "POST" }).handler(
  async () => {
    return { sent: true, message: "通知功能尚未配置。" };
  }
);

/**
 * dailyDigest - Server Function (cron-triggered)
 * Scheduled by Vercel Cron or equivalent. Authenticated via CRON_SECRET.
 *
 * TODO: Connect to your notification provider (e.g. FCM, APNs, email, etc.)
 */
export const dailyDigest = createServerFn({ method: "GET" }).handler(
  async () => {
    const expected = process.env.CRON_SECRET;
    if (!expected) {
      throw new Error("CRON_SECRET is not configured");
    }
    console.log("[dailyDigest] Cron job triggered");

    // TODO: Implement real notification delivery
    // e.g. await notificationProvider.publish({ title: "...", body: "..." })

    return { delivered: 0, message: "通知功能尚未配置" };
  }
);
