"use client";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { useUIStore } from "@/store";

const S = {
  success: "#059669",
  text3: "#8892B0",
  warning: "#D97706",
};

const CFG: Record<string, { icon: typeof CheckCircle2; color: string; label: string }> = {
  saved:   { icon: CheckCircle2, color: S.success, label: "已保存" },
  saving:  { icon: Loader2,      color: S.text3,   label: "保存中..." },
  unsaved: { icon: AlertCircle,  color: S.warning,  label: "未保存更改" },
};

export function SaveIndicator() {
  const saveStatus = useUIStore(s => s.saveStatus);
  const cfg = CFG[saveStatus] ?? CFG.saved;
  const Icon = cfg.icon;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={saveStatus}
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 4 }}
        transition={{ duration: 0.2 }}
        className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full"
        style={{ color: cfg.color, background: `${cfg.color}10` }}
      >
        <Icon size={10} className={saveStatus === 'saving' ? 'animate-spin' : ''} />
        {cfg.label}
      </motion.div>
    </AnimatePresence>
  );
}
