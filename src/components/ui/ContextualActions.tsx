import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap } from "lucide-react";
import { Link } from "@tanstack/react-router";

const S = {
  bg: "#FAFBFF",
  card: "#FFFFFF",
  s2: "#F4F6FC",
  border: "#E2E5F0",
  border2: "#CBD0E5",
  primary: "#5E50E8",
  accent: "#00A99D",
  text: "#1A1D2E",
  text2: "#4A5068",
  text3: "#8892B0",
  success: "#059669",
  warning: "#D97706",
  error: "#DC2626",
};

export interface ContextualAction {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  badge?: string;
}

export interface ContextualActionsProps {
  actions: ContextualAction[];
  position?: "bottom-right" | "bottom-left";
}

export default function ContextualActions({ actions, position = "bottom-right" }: ContextualActionsProps) {
  const [expanded, setExpanded] = useState(false);

  const positionClasses = position === "bottom-right" ? "right-6 bottom-6" : "left-6 bottom-6";

  return (
    <div className={`fixed ${positionClasses} z-50 flex flex-col items-end gap-2`}>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-1.5 items-end"
          >
            {actions.map((action, i) => {
              const Icon = action.icon;
              const content = (
                <motion.button
                  key={i}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={action.disabled}
                  onClick={() => {
                    if (action.onClick) {
                      action.onClick();
                      setExpanded(false);
                    }
                  }}
                  className="flex items-center gap-2 px-3 py-2 rounded-full focus:outline-none transition-all"
                  style={{
                    background: S.card,
                    border: `1px solid ${S.border}`,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                    opacity: action.disabled ? 0.5 : 1,
                    cursor: action.disabled ? "not-allowed" : "pointer",
                  }}
                >
                  <span className="shrink-0" style={{ color: S.primary, display: 'inline-flex' }}>
                    <Icon size={14} />
                  </span>
                  <span className="text-[10px] font-semibold whitespace-nowrap" style={{ color: S.text }}>
                    {action.label}
                  </span>
                  {action.badge && (
                    <span
                      className="text-[8px] font-bold px-1.5 py-0.5 rounded-full ml-1"
                      style={{ background: S.error, color: "#fff" }}
                    >
                      {action.badge}
                    </span>
                  )}
                </motion.button>
              );

              if (action.href && !action.disabled) {
                return (
                  <Link key={i} to={action.href} onClick={() => setExpanded(false)}>
                    {content}
                  </Link>
                );
              }

              return content;
            })}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setExpanded(!expanded)}
        className="w-11 h-11 rounded-full flex items-center justify-center focus:outline-none shadow-lg"
        style={{
          background: S.primary,
          boxShadow: `0 4px 16px ${S.primary}40`,
        }}
      >
        <motion.div animate={{ rotate: expanded ? 45 : 0 }} transition={{ duration: 0.2 }}>
          <Zap size={20} style={{ color: "#fff" }} />
        </motion.div>
      </motion.button>
    </div>
  );
}
