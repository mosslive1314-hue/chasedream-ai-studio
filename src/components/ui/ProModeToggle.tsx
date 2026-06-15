import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Eye } from "lucide-react";
import { useUIStore } from "@/store";

const S = {
  primary: "#5E50E8", accent: "#00A99D",
  text: "#1A1D2E", text3: "#8892B0",
  card: "#FFFFFF", border: "#E2E5F0",
};

export function ProModeToggle() {
  const proMode = useUIStore(s => s.proMode);
  const toggleProMode = useUIStore(s => s.toggleProMode);

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.9 }}
      onClick={toggleProMode}
      title={proMode ? "切换到简洁模式" : "切换到专业模式"}
      className="fixed bottom-5 left-5 z-30 flex items-center gap-1.5 px-3 py-2 rounded-full shadow-lg focus:outline-none"
      style={{
        background: proMode ? S.primary : S.card,
        color: proMode ? "#fff" : S.text3,
        border: `1px solid ${proMode ? S.primary : S.border}`,
        boxShadow: proMode ? `0 2px 12px ${S.primary}30` : "0 2px 8px rgba(0,0,0,0.08)",
      }}
    >
      {proMode ? <Sparkles size={12} /> : <Eye size={12} />}
      <AnimatePresence mode="wait">
        <motion.span
          key={proMode ? "pro" : "simple"}
          initial={{ opacity: 0, width: 0 }}
          animate={{ opacity: 1, width: "auto" }}
          exit={{ opacity: 0, width: 0 }}
          className="text-[9px] font-bold whitespace-nowrap overflow-hidden"
        >
          {proMode ? "专业模式" : "简洁模式"}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
}
