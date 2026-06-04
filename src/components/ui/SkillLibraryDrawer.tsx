"use client";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, BookOpen } from "lucide-react";
import { SkillLibraryPanel } from "./SkillLibraryPanel";
import { SkillExecutionRunner } from "./SkillExecutionRunner";
import { SkillCrystallizer } from "./SkillCrystallizer";
import type { Skill, SkillDomain } from "@/lib/types/skill";

// ─── Design Tokens ──────────────────────────────────────────
const S = {
  card: "#FFFFFF",
  bg: "#F5F6FA",
  border: "#E2E5F0",
  primary: "#5E50E8",
  text: "#1A1D2E",
  text3: "#8892B0",
};

type View = "library" | "runner" | "crystallizer";

// ─── Main Component ─────────────────────────────────────────

export function SkillLibraryDrawer() {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>("library");
  const [activeSkill, setActiveSkill] = useState<Skill | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Keyboard shortcut: Cmd+Shift+K to toggle
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "k") {
        e.preventDefault();
        setOpen(prev => !prev);
      }
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  // View transitions
  const handleRunSkill = (skill: Skill) => {
    setActiveSkill(skill);
    setView("runner");
  };

  const handleCrystallize = () => {
    setView("crystallizer");
  };

  const handleBackToLibrary = () => {
    setView("library");
    setActiveSkill(null);
  };

  const handleSkillCreated = (_skill: Skill) => {
    setView("library");
  };

  const handleClose = () => {
    setOpen(false);
    // Reset to library after animation
    setTimeout(() => {
      setView("library");
      setActiveSkill(null);
    }, 300);
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 200 }}
            onClick={handleClose}
            className="fixed inset-0"
            style={{ zIndex: 9990, background: "rgba(0,0,0,0.15)" }}
          />

          {/* Drawer */}
          <motion.aside
            initial={{ x: 480, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 480, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 bottom-0 flex flex-col shadow-2xl"
            style={{
              zIndex: 9992,
              width: 480,
              maxWidth: "100vw",
              background: S.card,
              borderLeft: `1px solid ${S.border}`,
            }}
          >
            {/* Drawer header */}
            <div
              className="flex items-center justify-between px-4 h-11 shrink-0 border-b"
              style={{ borderColor: S.border }}
            >
              <div className="flex items-center gap-2">
                <BookOpen size={14} style={{ color: S.primary }} />
                <span className="text-sm font-semibold" style={{ color: S.text }}>
                  {view === "library" && "Skill 知识库"}
                  {view === "runner" && "Skill 执行器"}
                  {view === "crystallizer" && "结晶新 Skill"}
                </span>
              </div>
              <div className="flex items-center gap-1">
                {view !== "library" && (
                  <motion.button
                    whileTap={{ scale: 0.92 }}
                    onClick={handleBackToLibrary}
                    className="p-1.5 rounded-md hover:bg-gray-100 transition-colors text-xs"
                    style={{ color: S.primary }}
                  >
                    返回知识库
                  </motion.button>
                )}
                <motion.button
                  whileTap={{ scale: 0.92 }}
                  onClick={handleClose}
                  className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
                >
                  <X size={14} style={{ color: S.text3 }} />
                </motion.button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
              <AnimatePresence mode="wait">
                {view === "library" && (
                  <motion.div
                    key="library"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="h-full"
                  >
                    <SkillLibraryPanel
                      onRunSkill={handleRunSkill}
                      onCrystallize={handleCrystallize}
                    />
                  </motion.div>
                )}

                {view === "runner" && activeSkill && (
                  <motion.div
                    key="runner"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="h-full"
                  >
                    <SkillExecutionRunner
                      skill={activeSkill}
                      onComplete={handleBackToLibrary}
                      onClose={handleBackToLibrary}
                    />
                  </motion.div>
                )}

                {view === "crystallizer" && (
                  <motion.div
                    key="crystallizer"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="h-full"
                  >
                    <SkillCrystallizer
                      onCreated={handleSkillCreated}
                      onClose={handleBackToLibrary}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer shortcut hint */}
            <div
              className="shrink-0 px-4 py-1.5 border-t text-center"
              style={{ borderColor: S.border }}
            >
              <span style={{ color: S.text3, fontSize: 9 }}>
                Cmd+Shift+K 切换 · Esc 关闭
              </span>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}
