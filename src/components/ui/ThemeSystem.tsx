import { useState } from "react";
import { motion } from "framer-motion";
import { Palette, Check, Sparkles, Monitor, Smartphone } from "lucide-react";
import { useUIStore, useNarrativeStore } from "@/store";

const S = {
  bg: "#FAFBFF", card: "#FFFFFF", s2: "#F4F6FC",
  border: "#E2E5F0", primary: "#5E50E8", accent: "#00A99D",
  text: "#1A1D2E", text2: "#4A5068", text3: "#8892B0",
  success: "#059669", warning: "#D97706", error: "#DC2626",
};

interface ThemePreset {
  id: string;
  name: string;
  description: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
  };
  font: { heading: string; body: string };
  borderRadius: string;
  preview: { gradient: string; icon: string };
}

const THEMES: ThemePreset[] = [
  {
    id: "cyberpunk",
    name: "赛博朋克",
    description: "霓虹灯光、暗黑底色、科技感",
    colors: { primary: "#00F0FF", secondary: "#FF00E5", accent: "#FFE600", background: "#0A0E1A", surface: "#141828", text: "#E0E6FF", textSecondary: "#7B83A6", border: "#2A3050" },
    font: { heading: "Orbitron", body: "Rajdhani" },
    borderRadius: "4px",
    preview: { gradient: "linear-gradient(135deg, #0A0E1A, #1A1040, #00F0FF20)", icon: "🌃" },
  },
  {
    id: "ancient",
    name: "古风仙侠",
    description: "水墨质感、古典配色、飘逸字体",
    colors: { primary: "#C4956A", secondary: "#8B4513", accent: "#D4AF37", background: "#F5F0E8", surface: "#FFFDF7", text: "#2C1810", textSecondary: "#6B5344", border: "#D4C4B0" },
    font: { heading: "Ma Shan Zheng", body: "Noto Serif SC" },
    borderRadius: "2px",
    preview: { gradient: "linear-gradient(135deg, #F5F0E8, #E8DCC8, #C4956A20)", icon: "🏯" },
  },
  {
    id: "modern",
    name: "现代简约",
    description: "清新配色、圆角卡片、干净利落",
    colors: { primary: "#4F46E5", secondary: "#06B6D4", accent: "#F59E0B", background: "#F8FAFC", surface: "#FFFFFF", text: "#0F172A", textSecondary: "#64748B", border: "#E2E8F0" },
    font: { heading: "Inter", body: "Inter" },
    borderRadius: "12px",
    preview: { gradient: "linear-gradient(135deg, #F8FAFC, #EEF2FF, #4F46E520)", icon: "🏙️" },
  },
  {
    id: "horror",
    name: "恐怖暗夜",
    description: "深红色调、阴影效果、紧张氛围",
    colors: { primary: "#DC2626", secondary: "#991B1B", accent: "#F59E0B", background: "#0C0A09", surface: "#1C1917", text: "#FAFAF9", textSecondary: "#A8A29E", border: "#292524" },
    font: { heading: "Creepster", body: "Source Sans Pro" },
    borderRadius: "0px",
    preview: { gradient: "linear-gradient(135deg, #0C0A09, #1C0A0A, #DC262620)", icon: "👻" },
  },
  {
    id: "romance",
    name: "浪漫温馨",
    description: "粉色系、柔和渐变、温馨字体",
    colors: { primary: "#EC4899", secondary: "#F472B6", accent: "#A855F7", background: "#FFF1F2", surface: "#FFFFFF", text: "#1F1225", textSecondary: "#9F7AEA", border: "#FECDD3" },
    font: { heading: "Quicksand", body: "Nunito" },
    borderRadius: "16px",
    preview: { gradient: "linear-gradient(135deg, #FFF1F2, #FCE7F3, #EC489920)", icon: "💕" },
  },
  {
    id: "scifi",
    name: "科幻未来",
    description: "蓝绿冷色、全息效果、几何线条",
    colors: { primary: "#06B6D4", secondary: "#22D3EE", accent: "#A78BFA", background: "#0F172A", surface: "#1E293B", text: "#F1F5F9", textSecondary: "#94A3B8", border: "#334155" },
    font: { heading: "Exo 2", body: "Roboto" },
    borderRadius: "8px",
    preview: { gradient: "linear-gradient(135deg, #0F172A, #1E293B, #06B6D420)", icon: "🚀" },
  },
];

export function ThemeSystem() {
  const proMode = useUIStore(s => s.proMode);
  const [selectedTheme, setSelectedTheme] = useState<string>("modern");
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");
  const updateGameUISettings = useNarrativeStore(s => s.updateGameUISettings);
  const addToast = useUIStore(s => s.addToast);

  const activeTheme = THEMES.find(t => t.id === selectedTheme) ?? THEMES[2];

  const applyTheme = (theme: ThemePreset) => {
    setSelectedTheme(theme.id);
    updateGameUISettings({ themeId: theme.id } as any);
    addToast({ type: "success", title: "主题已应用", message: `${theme.name} 主题已生效` });
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Palette size={14} style={{ color: S.primary }} />
          <h3 className="text-xs font-bold" style={{ color: S.text }}>主题系统</h3>
          <span className="text-[8px] px-2 py-0.5 rounded-full" style={{ background: `${S.accent}12`, color: S.accent }}>
            {THEMES.length} 套预设
          </span>
        </div>
        {/* Device toggle */}
        <div className="flex items-center gap-1 rounded-lg p-0.5" style={{ background: S.s2 }}>
          <motion.button whileTap={{ scale: 0.9 }}
            onClick={() => setPreviewDevice("desktop")}
            className="p-1.5 rounded focus:outline-none"
            style={{ background: previewDevice === "desktop" ? S.card : "transparent", color: previewDevice === "desktop" ? S.primary : S.text3 }}>
            <Monitor size={11} />
          </motion.button>
          <motion.button whileTap={{ scale: 0.9 }}
            onClick={() => setPreviewDevice("mobile")}
            className="p-1.5 rounded focus:outline-none"
            style={{ background: previewDevice === "mobile" ? S.card : "transparent", color: previewDevice === "mobile" ? S.primary : S.text3 }}>
            <Smartphone size={11} />
          </motion.button>
        </div>
      </div>

      {/* Theme grid */}
      <div className="grid grid-cols-3 gap-3">
        {THEMES.map(theme => {
          const isActive = selectedTheme === theme.id;
          return (
            <motion.button key={theme.id} whileTap={{ scale: 0.97 }} whileHover={{ y: -2 }}
              onClick={() => applyTheme(theme)}
              className="text-left rounded-xl overflow-hidden focus:outline-none"
              style={{
                border: `2px solid ${isActive ? S.primary : S.border}`,
                boxShadow: isActive ? `0 2px 12px ${S.primary}20` : "none",
              }}>
              {/* Preview area */}
              <div className="h-16 relative" style={{ background: theme.preview.gradient }}>
                <span className="absolute top-2 right-2 text-lg">{theme.preview.icon}</span>
                {isActive && (
                  <div className="absolute top-2 left-2 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: S.primary }}>
                    <Check size={10} color="#fff" />
                  </div>
                )}
                {/* Color dots */}
                <div className="absolute bottom-2 left-2 flex gap-1">
                  {[theme.colors.primary, theme.colors.secondary, theme.colors.accent].map((c, i) => (
                    <div key={i} className="w-3 h-3 rounded-full" style={{ background: c, border: "1px solid rgba(255,255,255,0.3)" }} />
                  ))}
                </div>
              </div>
              {/* Info */}
              <div className="p-2.5" style={{ background: S.card }}>
                <span className="text-[10px] font-bold" style={{ color: S.text }}>{theme.name}</span>
                <p className="text-[8px] mt-0.5" style={{ color: S.text3 }}>{theme.description}</p>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Active theme preview */}
      <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${S.border}` }}>
        <div className="px-4 py-2.5 flex items-center justify-between" style={{ background: S.s2, borderBottom: `1px solid ${S.border}` }}>
          <span className="text-[10px] font-bold" style={{ color: S.text }}>
            {activeTheme.preview.icon} {activeTheme.name} — 实时预览
          </span>
          <span className="text-[8px] font-mono" style={{ color: S.text3 }}>
            {previewDevice === "desktop" ? "1920×1080" : "375×812"}
          </span>
        </div>
        {/* Simulated game UI preview */}
        <div className="p-4" style={{
          background: activeTheme.colors.background,
          minHeight: previewDevice === "desktop" ? 200 : 280,
          maxWidth: previewDevice === "mobile" ? 200 : "100%",
          margin: previewDevice === "mobile" ? "0 auto" : undefined,
          borderRadius: previewDevice === "mobile" ? "20px" : undefined,
          border: previewDevice === "mobile" ? `3px solid ${activeTheme.colors.border}` : undefined,
        }}>
          {/* Dialog box preview */}
          <div className="mb-3 p-3" style={{
            background: activeTheme.colors.surface,
            border: `1px solid ${activeTheme.colors.border}`,
            borderRadius: activeTheme.borderRadius,
          }}>
            <p className="text-[10px] font-bold mb-1" style={{ color: activeTheme.colors.primary, fontFamily: activeTheme.font.heading }}>
              角色名称
            </p>
            <p className="text-[9px] leading-relaxed" style={{ color: activeTheme.colors.text, fontFamily: activeTheme.font.body }}>
              "这条线索指向一个我们从未想过的方向..."
            </p>
          </div>
          {/* Choice buttons preview */}
          <div className="space-y-1.5">
            {["调查线索", "询问证人", "离开现场"].map((choice, i) => (
              <div key={i} className="px-3 py-2 text-[9px]" style={{
                background: i === 0 ? `${activeTheme.colors.primary}20` : `${activeTheme.colors.surface}80`,
                color: activeTheme.colors.text,
                border: `1px solid ${i === 0 ? activeTheme.colors.primary : activeTheme.colors.border}`,
                borderRadius: activeTheme.borderRadius,
                fontFamily: activeTheme.font.body,
              }}>
                {String.fromCharCode(65 + i)}. {choice}
              </div>
            ))}
          </div>
          {/* HUD element */}
          <div className="mt-3 flex items-center gap-2">
            <div className="h-1.5 flex-1 rounded-full overflow-hidden" style={{ background: `${activeTheme.colors.border}` }}>
              <div className="h-full rounded-full" style={{ width: "65%", background: activeTheme.colors.primary }} />
            </div>
            <span className="text-[8px] font-mono" style={{ color: activeTheme.colors.textSecondary }}>HP 65%</span>
          </div>
        </div>
      </div>

      {/* Professional mode: Custom color editor */}
      {proMode && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
          className="rounded-xl p-4 space-y-3" style={{ background: S.card, border: `1px solid ${S.border}` }}>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={11} style={{ color: S.warning }} />
            <h4 className="text-[10px] font-bold" style={{ color: S.text }}>自定义颜色 (专业模式)</h4>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {Object.entries(activeTheme.colors).slice(0, 8).map(([key, value]) => (
              <div key={key}>
                <label className="text-[8px] font-bold block mb-1" style={{ color: S.text3 }}>{key}</label>
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded" style={{ background: value, border: `1px solid ${S.border}` }} />
                  <span className="text-[8px] font-mono" style={{ color: S.text2 }}>{value}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
