import { useState } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/store/use-auth-store";

/**
 * Notification preferences toggle.
 * Currently a UI stub — notification backend is not yet connected.
 * Will be wired to a real push notification service in production.
 */
export function NotificationsToggle() {
  const user = useAuthStore((s) => s.user);
  const [subscribed, setSubscribed] = useState(false);
  const [toggling, setToggling] = useState(false);

  if (!user) return null;

  async function handleToggle() {
    if (toggling) return;
    setToggling(true);
    const wantOn = !subscribed;
    setSubscribed(wantOn);
    try {
      // TODO: Wire to real notification subscription API
      if (wantOn) {
        toast.success("通知已开启");
      } else {
        toast.success("通知已关闭");
      }
    } catch {
      setSubscribed(!wantOn);
      toast.error("通知设置更新失败，请重试");
    } finally {
      setToggling(false);
    }
  }

  return (
    <div className="mb-4 flex flex-col gap-2 rounded-[14px] border border-white/70 bg-white/60 p-3 shadow-[0_8px_20px_rgba(15,23,42,0.06)]">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-slate-950/5">
          {subscribed ? (
            <Bell className="h-4 w-4 text-[#EE5C2A]" />
          ) : (
            <BellOff className="h-4 w-4 text-slate-950/40" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-slate-950/80">
            推送通知
          </p>
          <p className="text-[12px] text-slate-950/45">
            {subscribed
              ? "已开启 — 你将收到系统推送通知"
              : "已关闭 — 开启后可接收系统推送通知"}
          </p>
        </div>
        <button
          onClick={handleToggle}
          disabled={toggling}
          className={`flex h-8 items-center justify-center rounded-[10px] px-3 text-[12px] font-semibold transition-all duration-200 ${
            subscribed
              ? "bg-[linear-gradient(180deg,#F47A42_0%,#EE5C2A_100%)] text-white shadow-[0_4px_10px_rgba(238,92,42,0.32)] hover:brightness-105"
              : "border border-white/70 bg-white/72 text-slate-950/60 shadow-[0_2px_8px_rgba(15,23,42,0.06)] hover:bg-white/86"
          } disabled:opacity-50`}
        >
          {toggling ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : subscribed ? (
            "已开启"
          ) : (
            "已关闭"
          )}
        </button>
      </div>
    </div>
  );
}
