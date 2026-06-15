import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { Link } from "@tanstack/react-router";

/**
 * Maps former Detroit feature tabs to their new home pages after restructure:
 *  - pov → /cinematic (演出设计)
 *  - timed → /interaction (互动设计)
 *  - lock → /nodes (剧情节点 - 画布)
 *  - relationship → /nodes (剧情节点 - 角色系统)
 *  - variant → /nodes (剧情节点 - 画布)
 *  - dialogue → /interaction (互动设计)
 *  - investigate → /interaction (互动设计 - 后果追踪)
 *  - moral → /nodes (剧情节点 - 角色系统)
 */
const TAB_ROUTE_MAP: Record<string, string> = {
  pov: "/cinematic",
  timed: "/interaction",
  lock: "/nodes",
  relationship: "/nodes",
  variant: "/nodes",
  dialogue: "/interaction",
  investigate: "/interaction",
  moral: "/nodes",
};

interface DetroitQuickNavProps {
  /** Which feature tab to deep-link to */
  targetTab: string;
  label: string;
}

export function DetroitQuickNav({ targetTab, label }: DetroitQuickNavProps) {
  const href = TAB_ROUTE_MAP[targetTab] || "/nodes";
  return (
    <Link to={href}>
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border cursor-pointer transition-colors"
        style={{
          color: "#5E50E8",
          borderColor: "rgba(94,80,232,0.25)",
          background: "rgba(94,80,232,0.05)",
        }}
      >
        <Sparkles size={11} />
        <span>{label}</span>
        <span style={{ color: "#8892B0" }}>→</span>
      </motion.div>
    </Link>
  );
}
