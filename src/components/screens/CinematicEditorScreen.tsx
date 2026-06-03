"use client";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera, Video, Mic, Music, Clock, ArrowRight, Play, Film,
  ChevronDown, Move, Eye, Volume2, Zap, Sparkles, Star,
  CircleDot, Scissors, Sun, Waves, Users, Crosshair,
  ZoomIn, ZoomOut, Aperture, BookOpen,
} from "lucide-react";
import {
  type CinematicDirection, type CameraShotType, type CameraMovement,
  type TransitionType, type EmotionIntensity, type POVConfig,
} from "@/lib/studio-data";
import { useNarrativeStore, useUIStore } from "@/store";
import { usePathname } from "next/navigation";
import { UpstreamReadiness } from "@/components/ui/UpstreamReadiness";

// ── Design System ────────────────────────────────────────────────────────
const S = {
  bg: "#FAFBFF", card: "#FFFFFF", s2: "#F4F6FC", s3: "#EDF0F8",
  border: "#E2E5F0", border2: "#CBD0E5",
  primary: "#5E50E8", primary10: "rgba(94,80,232,0.10)",
  accent: "#00A99D", accent10: "rgba(0,169,157,0.10)",
  text: "#1A1D2E", text2: "#4A5068", text3: "#8892B0",
  success: "#059669", warning: "#D97706", error: "#DC2626",
  purple: "#8B5CF6", purple10: "rgba(139,92,246,0.10)",
  rose: "#F43F5E", rose10: "rgba(244,63,94,0.10)",
  amber: "#F59E0B", amber10: "rgba(245,158,11,0.10)",
};

// ── Shot type icons/labels ────────────────────────────────────────────────
const SHOT_META: Record<CameraShotType, { icon: typeof Camera; label: string; color: string; bg: string }> = {
  wide:      { icon: Camera,   label: "远景",   color: "#0EA5E9", bg: "rgba(14,165,233,0.10)" },
  medium:    { icon: Camera,   label: "中景",   color: "#22C55E", bg: "rgba(34,197,94,0.10)" },
  close_up:  { icon: Eye,      label: "特写",   color: "#F43F5E", bg: "rgba(244,63,94,0.10)" },
  tracking:  { icon: Move,     label: "跟拍",   color: "#8B5CF6", bg: "rgba(139,92,246,0.10)" },
  push_in:   { icon: ZoomIn,   label: "推近",   color: "#EAB308", bg: "rgba(234,179,8,0.10)" },
  pull_out:  { icon: ZoomOut,  label: "拉远",   color: "#06B6D4", bg: "rgba(6,182,212,0.10)" },
  handheld:  { icon: Video,    label: "手持",   color: "#F97316", bg: "rgba(249,115,22,0.10)" },
  static:    { icon: Camera,   label: "固定",   color: "#64748B", bg: "rgba(100,116,139,0.10)" },
};

// ── Movement visual indicator ─────────────────────────────────────────────
const MOVEMENT_META: Record<CameraMovement, { icon: string; color: string }> = {
  none:       { icon: "—",   color: S.text3 },
  pan_left:   { icon: "←",  color: "#0EA5E9" },
  pan_right:  { icon: "→",  color: "#0EA5E9" },
  tilt_up:    { icon: "↑",  color: "#22C55E" },
  tilt_down:  { icon: "↓",  color: "#22C55E" },
  dolly_in:   { icon: "⊕",  color: "#8B5CF6" },
  dolly_out:  { icon: "⊖",  color: "#8B5CF6" },
  crane_up:   { icon: "⬆",  color: "#F59E0B" },
  crane_down: { icon: "⬇",  color: "#F59E0B" },
  orbit:      { icon: "↻",  color: "#EC4899" },
  static:     { icon: "◻",  color: S.text3 },
  push_in:    { icon: "▷",  color: "#EAB308" },
  pull_out:   { icon: "◁",  color: "#06B6D4" },
  tracking:   { icon: "⟿",  color: "#F97316" },
};

// ── Transition meta ───────────────────────────────────────────────────────
const TRANSITION_META: Record<TransitionType, { icon: typeof Scissors; label: string; color: string; bg: string }> = {
  cut:          { icon: Scissors,  label: "硬切",   color: "#EF4444", bg: "rgba(239,68,68,0.10)" },
  fade:         { icon: Sun,       label: "淡入淡出", color: "#6366F1", bg: "rgba(99,102,241,0.10)" },
  dissolve:     { icon: Waves,     label: "溶解",   color: "#8B5CF6", bg: "rgba(139,92,246,0.10)" },
  wipe:         { icon: ArrowRight, label: "擦除",  color: "#0EA5E9", bg: "rgba(14,165,233,0.10)" },
  flash:        { icon: Star,      label: "闪白",   color: "#F59E0B", bg: "rgba(245,158,11,0.10)" },
  slow_motion:  { icon: Clock,     label: "慢动作", color: "#EC4899", bg: "rgba(236,72,153,0.10)" },
};

// ── Emotion intensity levels ─────────────────────────────────────────────
const EMOTION_LEVELS: { key: EmotionIntensity; label: string; color: string }[] = [
  { key: "calm",    label: "平静", color: "#22C55E" },
  { key: "neutral", label: "中性", color: "#64748B" },
  { key: "tense",   label: "紧张", color: "#F59E0B" },
  { key: "intense", label: "强烈", color: "#F97316" },
  { key: "climax",  label: "高潮", color: "#EF4444" },
];

function emotionLevelIndex(e: EmotionIntensity): number {
  return EMOTION_LEVELS.findIndex((l) => l.key === e);
}

// ── Character color map ──────────────────────────────────────────────────
const CHAR_COLORS: Record<string, string> = {
  c1: "#5E50E8",
  c2: "#00A99D",
  c3: "#F43F5E",
};

// ── Node type labels ─────────────────────────────────────────────────────
const NODE_TYPE_LABELS: Record<string, string> = {
  start: "开始", scene: "场景", choice: "选择", condition: "条件",
  qte: "QTE", ending_good: "好结局", ending_bad: "坏结局",
};

// ── Section tab definitions ──────────────────────────────────────────────
type SectionTabId = "camera" | "performance" | "pacing" | "audio" | "pov" | "timeline" | "lens_preset";
const SECTION_TABS: { id: SectionTabId; label: string; icon: typeof Camera; color: string }[] = [
  { id: "camera",      label: "镜头设计",   icon: Camera, color: "#0EA5E9" },
  { id: "performance", label: "表演指导",   icon: Users,  color: "#8B5CF6" },
  { id: "pacing",      label: "节奏与转场", icon: Zap,    color: "#F59E0B" },
  { id: "audio",       label: "音频设计",   icon: Music,  color: "#00A99D" },
  { id: "pov",         label: "POV 视角",   icon: Eye,    color: "#06B6D4" },
  { id: "timeline",    label: "节点时间线", icon: Film,   color: "#8B5CF6" },
  { id: "lens_preset", label: "镜头预设库", icon: Aperture, color: "#E11D48" },
];

// ── Chapter filter options ─────────────────────────────────────────────
type ChapterFilter = "all" | "ch0" | "ch1" | "ch2";
const CHAPTER_FILTERS: { id: ChapterFilter; label: string }[] = [
  { id: "all", label: "全部" },
  { id: "ch0", label: "序章" },
  { id: "ch1", label: "第一章" },
  { id: "ch2", label: "第二章" },
];

// ── Chapter → nodeId mapping (derived from story structure) ────────────
const CHAPTER_NODE_MAP: Record<string, string[]> = {
  ch0: ["N01"],
  ch1: ["N02", "N03"],
  ch2: ["N04", "N05", "N06", "N07", "N08", "N09", "N10", "N11"],
};

// ══════════════════════════════════════════════════════════════════════════
export default function CinematicEditorScreen() {
  const pathname = usePathname();
  // ── Store selectors ──
  const cinematicDirections = useNarrativeStore(s => s.cinematicDirections);
  const storyNodes = useNarrativeStore(s => s.storyNodes);
  const characters = useNarrativeStore(s => s.characters);
  const povConfigs = useNarrativeStore(s => s.povConfigs);
  const chapterPlans = useNarrativeStore(s => s.chapterPlans);
  const updateCinematicDirection = useNarrativeStore(s => s.updateCinematicDirection);
  const addToast = useUIStore(s => s.addToast);

  // ── Edit handlers ──
  const updateDirection = (nodeId: string, updates: Partial<CinematicDirection>) => {
    updateCinematicDirection(nodeId, updates);
    addToast({
      type: "success",
      title: "演出方向已更新",
      message: `节点 ${nodeId} 的演出设置已保存`,
    });
  };

  const [selectedNodeId, setSelectedNodeId] = useState<string>(cinematicDirections[0]?.nodeId ?? "N01");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [sectionTab, setSectionTab] = useState<SectionTabId>("camera");
  const [chapterFilter, setChapterFilter] = useState<ChapterFilter>("all");

  // Map nodeId to its cinematic direction
  const directionMap = useMemo(() => {
    const m = new Map<string, CinematicDirection>();
    cinematicDirections.forEach((d) => m.set(d.nodeId, d));
    return m;
  }, [cinematicDirections]);

  // Map nodeId to story node info
  const nodeMap = useMemo(() => {
    const m = new Map<string, { id: string; label: string; type: string }>();
    storyNodes.forEach((n) => m.set(n.id, { id: n.id, label: n.label, type: n.type }));
    return m;
  }, [storyNodes]);

  // Filter directions by selected chapter
  const filteredDirections = useMemo(() => {
    if (chapterFilter === "all") return cinematicDirections;
    const nodeIds = new Set(CHAPTER_NODE_MAP[chapterFilter] ?? []);
    return cinematicDirections.filter((d) => nodeIds.has(d.nodeId));
  }, [cinematicDirections, chapterFilter]);

  const currentDirection = directionMap.get(selectedNodeId);
  const currentNode = nodeMap.get(selectedNodeId);

  return (
    <div className="min-h-screen" style={{ background: S.bg }}>
      <UpstreamReadiness currentPath={pathname} />
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">

        {/* ── A. Header ─────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: S.purple10 }}>
                <Film size={20} style={{ color: S.purple }} />
              </div>
              <div>
                <h1 className="text-xl font-bold" style={{ color: S.text }}>电影化演出设计器</h1>
                <p className="text-xs" style={{ color: S.text3 }}>配置镜头、表演、音频与节奏转场</p>
              </div>
            </div>

            {/* Node selector dropdown */}
            <div className="relative">
            <button
              onClick={() => setDropdownOpen((v) => !v)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all focus:outline-none"
              style={{
                background: S.card,
                border: `1px solid ${dropdownOpen ? S.purple : S.border}`,
                boxShadow: dropdownOpen ? `0 4px 16px ${S.purple10}` : "0 1px 3px rgba(0,0,0,0.04)",
                color: S.text,
              }}
            >
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold" style={{ background: S.purple10, color: S.purple }}>
                {selectedNodeId}
              </span>
              <span>{currentNode?.label ?? selectedNodeId}</span>
              {currentNode && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium" style={{ background: S.s3, color: S.text3 }}>
                  {NODE_TYPE_LABELS[currentNode.type] ?? currentNode.type}
                </span>
              )}
              <ChevronDown size={14} style={{ color: S.text3, transform: dropdownOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
            </button>

            <AnimatePresence>
              {dropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 z-50 py-1 rounded-xl shadow-lg min-w-[220px]"
                  style={{ background: S.card, border: `1px solid ${S.border}` }}
                >
                  {filteredDirections.map((d) => {
                    const node = nodeMap.get(d.nodeId);
                    const isSelected = d.nodeId === selectedNodeId;
                    return (
                      <button
                        key={d.nodeId}
                        onClick={() => { setSelectedNodeId(d.nodeId); setDropdownOpen(false); }}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-left transition-colors focus:outline-none"
                        style={{ background: isSelected ? S.purple10 : "transparent" }}
                      >
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold" style={{ background: isSelected ? S.purple : S.s3, color: isSelected ? "#fff" : S.text3 }}>
                          {d.nodeId}
                        </span>
                        <span className="text-sm font-medium" style={{ color: isSelected ? S.purple : S.text }}>{node?.label ?? d.nodeId}</span>
                        <span className="ml-auto text-[10px]" style={{ color: S.text3 }}>{NODE_TYPE_LABELS[node?.type ?? ""] ?? ""}</span>
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          </div>

          {/* Chapter/scene filter pills */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-medium mr-1" style={{ color: S.text3 }}>章节:</span>
            {CHAPTER_FILTERS.map((cf) => {
              const isActive = chapterFilter === cf.id;
              const chapterNodeCount = cf.id === "all"
                ? cinematicDirections.length
                : cinematicDirections.filter((d) => (CHAPTER_NODE_MAP[cf.id] ?? []).includes(d.nodeId)).length;
              return (
                <motion.button
                  key={cf.id}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setChapterFilter(cf.id)}
                  className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors focus:outline-none"
                  style={{
                    background: isActive ? S.purple10 : "transparent",
                    color: isActive ? S.purple : S.text3,
                    border: `1px solid ${isActive ? S.purple + "40" : "transparent"}`,
                  }}
                >
                  {cf.label}
                  <span className="text-[10px]" style={{ color: isActive ? S.purple : S.text3, opacity: 0.7 }}>
                    {chapterNodeCount}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* ── B. Section Tabs ───────────────────────────────────────────── */}
        <div className="flex items-center" style={{ borderBottom: `2px solid ${S.border}` }}>
          {SECTION_TABS.map((tab) => {
            const TabIcon = tab.icon;
            const isActive = sectionTab === tab.id;
            return (
              <motion.button
                key={tab.id}
                whileTap={{ scale: 0.97 }}
                onClick={() => setSectionTab(tab.id)}
                className="relative flex items-center gap-1.5 px-4 py-3 text-xs font-medium focus:outline-none transition-colors"
                style={{ color: isActive ? S.primary : S.text3 }}
              >
                <TabIcon size={13} style={{ color: isActive ? tab.color : S.text3 }} />
                {tab.label}
                {isActive && (
                  <motion.div
                    layoutId="cinematic-tab-underline"
                    className="absolute bottom-0 inset-x-0 h-0.5 rounded-full"
                    style={{ background: S.primary }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>

        {/* ── C. Tab Content ────────────────────────────────────────────── */}
        {currentDirection ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={`${selectedNodeId}-${sectionTab}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.22 }}
            >
              {sectionTab === "camera" && (
                <div className="rounded-2xl overflow-hidden" style={{ background: S.card, border: `1px solid ${S.border}`, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                  <div className="px-5 py-4 flex items-center gap-2" style={{ borderBottom: `1px solid ${S.border}`, background: "rgba(14,165,233,0.06)" }}>
                    <Camera size={15} style={{ color: "#0EA5E9" }} />
                    <h2 className="text-sm font-bold" style={{ color: S.text }}>镜头设计</h2>
                    <div className="flex-1 h-px" />
                  </div>
                  <div className="p-5">
                    <CameraSection direction={currentDirection} onUpdate={updateDirection} />
                  </div>
                </div>
              )}

              {sectionTab === "performance" && (
                <div className="rounded-2xl overflow-hidden" style={{ background: S.card, border: `1px solid ${S.border}`, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                  <div className="px-5 py-4 flex items-center gap-2" style={{ borderBottom: `1px solid ${S.border}`, background: "rgba(139,92,246,0.06)" }}>
                    <Users size={15} style={{ color: "#8B5CF6" }} />
                    <h2 className="text-sm font-bold" style={{ color: S.text }}>表演指导</h2>
                    <div className="flex-1 h-px" />
                  </div>
                  <div className="p-5">
                    <PerformanceSection direction={currentDirection} />
                  </div>
                </div>
              )}

              {sectionTab === "pacing" && (
                <div className="rounded-2xl overflow-hidden" style={{ background: S.card, border: `1px solid ${S.border}`, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                  <div className="px-5 py-4 flex items-center gap-2" style={{ borderBottom: `1px solid ${S.border}`, background: "rgba(245,158,11,0.06)" }}>
                    <Zap size={15} style={{ color: "#F59E0B" }} />
                    <h2 className="text-sm font-bold" style={{ color: S.text }}>节奏与转场</h2>
                    <div className="flex-1 h-px" />
                  </div>
                  <div className="p-5">
                    <PacingSection direction={currentDirection} />
                  </div>
                </div>
              )}

              {sectionTab === "audio" && (
                <div className="rounded-2xl overflow-hidden" style={{ background: S.card, border: `1px solid ${S.border}`, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                  <div className="px-5 py-4 flex items-center gap-2" style={{ borderBottom: `1px solid ${S.border}`, background: "rgba(0,169,157,0.06)" }}>
                    <Music size={15} style={{ color: "#00A99D" }} />
                    <h2 className="text-sm font-bold" style={{ color: S.text }}>音频设计</h2>
                    <div className="flex-1 h-px" />
                  </div>
                  <div className="p-5">
                    <AudioSection direction={currentDirection} />
                  </div>
                </div>
              )}

              {/* ── POV 视角系统 ─────────────────────────── */}
              {sectionTab === "pov" && (
                <div className="space-y-6">
                  {/* Header */}
                  <div>
                    <h2 className="text-lg font-bold" style={{ color: S.text }}>POV 视角系统</h2>
                    <p className="text-xs mt-0.5" style={{ color: S.text3 }}>管理多主角视角切换，支持第一人称/第三人称/过肩视角</p>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.2)" }}>
                      <Eye size={12} style={{ color: "#06B6D4" }} />
                      <span className="text-xs font-medium" style={{ color: "#0891B2" }}>视角配置 {povConfigs.length}</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ background: S.s3 }}>
                      <Users size={12} style={{ color: S.text3 }} />
                      <span className="text-xs font-medium" style={{ color: S.text2 }}>主角数量 {new Set(povConfigs.map(p => p.characterId)).size}</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ background: S.s3 }}>
                      <Film size={12} style={{ color: S.text3 }} />
                      <span className="text-xs font-medium" style={{ color: S.text2 }}>覆盖章节 {new Set(povConfigs.map(p => p.chapterId)).size}</span>
                    </div>
                  </div>

                  {/* POV Cards */}
                  {povConfigs.length === 0 ? (
                    <div className="rounded-2xl p-10 text-center" style={{ background: S.card, border: `1px solid ${S.border}` }}>
                      <Eye size={32} className="mx-auto mb-3" style={{ color: S.text3 }} />
                      <p className="text-sm font-bold" style={{ color: S.text3 }}>暂无视角配置</p>
                      <p className="text-xs mt-1" style={{ color: S.text3 }}>配置 POV 视角后，这里会展示视角切换方案</p>
                    </div>
                  ) : (
                    <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))" }}>
                      {povConfigs.map((pov, idx) => {
                        const char = characters.find(c => c.id === pov.characterId);
                        const charColor = char?.color || "#8B5CF6";
                        const charName = char?.name || pov.characterId;
                        const styleLabels: Record<string, { label: string; bg: string; color: string }> = {
                          first_person: { label: "第一人称", bg: "rgba(59,130,246,0.10)", color: "#3B82F6" },
                          third_person: { label: "第三人称", bg: "rgba(139,92,246,0.10)", color: "#8B5CF6" },
                          over_shoulder: { label: "过肩视角", bg: "rgba(6,182,212,0.10)", color: "#06B6D4" },
                        };
                        const styleMeta = styleLabels[pov.narrativeStyle] || styleLabels.third_person;
                        return (
                          <div key={idx} className="rounded-2xl p-5" style={{ background: S.card, border: `1px solid ${S.border}`, borderLeft: `4px solid ${charColor}` }}>
                            {/* Character header */}
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-3 h-3 rounded-full shrink-0" style={{ background: charColor }} />
                              <span className="text-sm font-bold" style={{ color: S.text }}>{charName}</span>
                              <span className="text-[10px] px-2 py-0.5 rounded-md font-medium" style={{ background: S.s3, color: S.text3 }}>{pov.chapterId}</span>
                            </div>
                            {/* Narrative style badge */}
                            <div className="flex items-center gap-2 mb-3">
                              <span className="text-[10px] px-2.5 py-1 rounded-md font-medium" style={{ background: styleMeta.bg, color: styleMeta.color }}>{styleMeta.label}</span>
                            </div>
                            {/* Switch trigger */}
                            {pov.switchAfterEvent != null && (
                              <p className="text-xs mb-3" style={{ color: S.text2 }}>
                                在第 <span className="font-bold" style={{ color: S.primary }}>{pov.switchAfterEvent}</span> 个事件后切换视角
                              </p>
                            )}
                            {/* Inner monologue */}
                            {pov.innerMonologue && (
                              <div className="pl-3 py-2" style={{ borderLeft: `2px solid ${charColor}` }}>
                                <p className="text-xs italic" style={{ color: S.text2 }}>&ldquo;{pov.innerMonologue}&rdquo;</p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {sectionTab === "timeline" && (
                <NodeTimeline
                  directions={filteredDirections}
                  nodeMap={nodeMap}
                  selectedNodeId={selectedNodeId}
                  onSelect={setSelectedNodeId}
                />
              )}

              {sectionTab === "lens_preset" && (
                <LensPresetLibrary characters={characters} />
              )}
            </motion.div>
          </AnimatePresence>
        ) : (
          <div className="rounded-2xl p-16 text-center" style={{ background: S.card, border: `1px solid ${S.border}` }}>
            <Film size={40} className="mx-auto mb-4" style={{ color: S.text3 }} />
            <p className="text-sm font-bold" style={{ color: S.text2 }}>该节点尚未配置电影化演出</p>
            <p className="text-xs mt-1" style={{ color: S.text3 }}>选择一个已配置的节点开始编辑</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// Section Card wrapper
// ══════════════════════════════════════════════════════════════════════════
function SectionCard({ icon, title, color, bg, children }: {
  icon: React.ReactNode; title: string; color: string; bg: string; children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      className="rounded-2xl overflow-hidden"
      style={{
        background: S.card,
        border: `1px solid ${S.border}`,
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      }}
    >
      {/* Section header */}
      <div className="px-5 py-4 flex items-center gap-2" style={{ borderBottom: `1px solid ${S.border}`, background: bg }}>
        <span style={{ color }}>{icon}</span>
        <h2 className="text-sm font-bold" style={{ color: S.text }}>{title}</h2>
        <div className="flex-1 h-px" />
      </div>
      <div className="p-5 space-y-4">
        {children}
      </div>
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// Camera Section
// ══════════════════════════════════════════════════════════════════════════
function CameraSection({ direction, onUpdate }: { direction: CinematicDirection; onUpdate: (nodeId: string, updates: Partial<CinematicDirection>) => void }) {
  const cam = direction.camera;
  const shotMeta = SHOT_META[cam.shotType] ?? SHOT_META.wide;
  const moveMeta = MOVEMENT_META[cam.movement] ?? MOVEMENT_META.none;
  const ShotIcon = shotMeta.icon;

  return (
    <div className="space-y-4">
      {/* Shot type + movement row */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold" style={{ background: shotMeta.bg, color: shotMeta.color }}>
          <ShotIcon size={13} /> {shotMeta.label}
        </span>
        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium" style={{ background: S.s2, color: moveMeta.color }}>
          <span style={{ fontSize: 14, lineHeight: 1 }}>{moveMeta.icon}</span>
          <span style={{ color: S.text2 }}>{cam.movementLabel}</span>
        </span>
      </div>

      {/* Duration */}
      <div className="flex items-center gap-3">
        <Clock size={13} style={{ color: S.text3 }} />
        <span className="text-xs font-medium" style={{ color: S.text3 }}>时长</span>
        <div className="flex-1 max-w-[180px] h-2 rounded-full overflow-hidden" style={{ background: S.s3 }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(cam.duration / 20 * 100, 100)}%` }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="h-full rounded-full"
            style={{ background: shotMeta.color }}
          />
        </div>
        <span className="text-sm font-bold" style={{ color: S.text }}>{cam.duration}s</span>
      </div>

      {/* Focus target */}
      {cam.focusTarget && (
        <div className="flex items-start gap-2">
          <Crosshair size={13} className="shrink-0 mt-0.5" style={{ color: S.accent }} />
          <div>
            <span className="text-[10px] font-medium" style={{ color: S.text3 }}>焦点目标</span>
            <p className="text-xs font-medium" style={{ color: S.text2 }}>{cam.focusTarget}</p>
          </div>
        </div>
      )}

      {/* Camera frame visualization */}
      <CameraFrameViz shotType={cam.shotType} focusTarget={cam.focusTarget} />

      {/* Editable: Duration slider */}
      <div className="flex items-center gap-3 pt-2" style={{ borderTop: `1px solid ${S.border}` }}>
        <span className="text-[10px] font-medium shrink-0" style={{ color: S.text3 }}>调整时长</span>
        <input
          type="range" min={1} max={30} value={cam.duration}
          onChange={e => onUpdate(direction.nodeId, { camera: { ...cam, duration: Number(e.target.value) } })}
          className="flex-1 h-1.5 accent-violet-500"
        />
        <span className="text-xs font-bold w-8 text-right" style={{ color: S.primary }}>{cam.duration}s</span>
      </div>
    </div>
  );
}

function CameraFrameViz({ shotType, focusTarget }: { shotType: CameraShotType; focusTarget?: string }) {
  // Focus point approximate position
  const focusX = shotType === "close_up" ? 120 : shotType === "medium" ? 100 : 90;
  const focusY = shotType === "close_up" ? 60 : shotType === "medium" ? 55 : 50;
  const frameW = shotType === "wide" ? 220 : shotType === "medium" ? 180 : 140;
  const frameH = shotType === "wide" ? 120 : shotType === "medium" ? 110 : 90;
  const offsetX = (260 - frameW) / 2;
  const offsetY = (120 - frameH) / 2;

  return (
    <div className="flex items-center justify-center pt-2">
      <svg width="260" height="130" viewBox="0 0 260 130" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Outer frame (viewport) */}
        <rect x="10" y="10" width="240" height="110" rx="8" fill={S.s2} stroke={S.border} strokeWidth="1" />
        {/* Camera frame */}
        <motion.rect
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          x={offsetX} y={offsetY} width={frameW} height={frameH} rx="4"
          fill="rgba(94,80,232,0.04)" stroke={S.purple} strokeWidth="1.5" strokeDasharray="4 2"
        />
        {/* Focus point */}
        <motion.circle
          initial={{ r: 0 }}
          animate={{ r: 5 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          cx={focusX} cy={focusY} fill={S.purple} opacity="0.7"
        />
        {/* Crosshair */}
        <line x1={focusX - 12} y1={focusY} x2={focusX - 6} y2={focusY} stroke={S.purple} strokeWidth="1" opacity="0.5" />
        <line x1={focusX + 6} y1={focusY} x2={focusX + 12} y2={focusY} stroke={S.purple} strokeWidth="1" opacity="0.5" />
        <line x1={focusX} y1={focusY - 12} x2={focusX} y2={focusY - 6} stroke={S.purple} strokeWidth="1" opacity="0.5" />
        <line x1={focusX} y1={focusY + 6} x2={focusX} y2={focusY + 12} stroke={S.purple} strokeWidth="1" opacity="0.5" />
        {/* Label */}
        <text x="130" y="125" textAnchor="middle" fill={S.text3} fontSize="9" fontWeight="500">
          {SHOT_META[shotType]?.label ?? shotType} 构图预览
        </text>
      </svg>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// Performance Section
// ══════════════════════════════════════════════════════════════════════════
function PerformanceSection({ direction }: { direction: CinematicDirection }) {
  return (
    <div className="space-y-3">
      {direction.performances.map((perf) => {
        const charColor = CHAR_COLORS[perf.characterId] ?? S.primary;
        const levelIdx = emotionLevelIndex(perf.emotionIntensity);
        return (
          <motion.div
            key={perf.characterId}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
            className="p-4 rounded-xl space-y-3"
            style={{ background: S.s2, border: `1px solid ${S.border}` }}
          >
            {/* Character header */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="w-3 h-3 rounded-full" style={{ background: charColor }} />
              <span className="text-sm font-bold" style={{ color: S.text }}>{perf.characterName}</span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold" style={{ background: `${charColor}18`, color: charColor }}>
                {perf.expression}
              </span>
            </div>

            {/* Action + posture */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] font-medium" style={{ color: S.text3 }}>动作</span>
                <p className="text-xs" style={{ color: S.text2 }}>{perf.action}</p>
              </div>
              <div>
                <span className="text-[10px] font-medium" style={{ color: S.text3 }}>姿态</span>
                <p className="text-xs" style={{ color: S.text2 }}>{perf.posture}</p>
              </div>
            </div>

            {/* Emotion intensity meter */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-medium" style={{ color: S.text3 }}>情绪强度</span>
                <span className="text-[10px] font-bold" style={{ color: EMOTION_LEVELS[levelIdx]?.color ?? S.text3 }}>
                  {perf.emotionLabel}
                </span>
              </div>
              <div className="flex items-center gap-1">
                {EMOTION_LEVELS.map((level, i) => (
                  <div key={level.key} className="flex-1 flex flex-col items-center gap-1">
                    <motion.div
                      initial={{ height: 4 }}
                      animate={{ height: i <= levelIdx ? 18 : 6 }}
                      transition={{ duration: 0.3, delay: i * 0.06 }}
                      className="w-full rounded-sm"
                      style={{
                        background: i <= levelIdx ? level.color : S.s3,
                        minHeight: 4,
                      }}
                    />
                    <span className="text-[8px]" style={{ color: i <= levelIdx ? level.color : S.text3 }}>
                      {level.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// Audio Section
// ══════════════════════════════════════════════════════════════════════════
function AudioSection({ direction }: { direction: CinematicDirection }) {
  const audio = direction.audio;
  return (
    <div className="space-y-4">
      {/* BGM track */}
      <div className="flex items-start gap-2">
        <Music size={13} className="shrink-0 mt-0.5" style={{ color: S.accent }} />
        <div>
          <span className="text-[10px] font-medium" style={{ color: S.text3 }}>BGM</span>
          <p className="text-xs font-medium" style={{ color: S.text2 }}>{audio.bgmTrack}</p>
          <span className="inline-block mt-1 px-2 py-0.5 rounded-md text-[10px] font-bold" style={{ background: S.accent10, color: S.accent }}>
            {audio.bgmMood}
          </span>
        </div>
      </div>

      {/* Ambient sound */}
      <div className="flex items-start gap-2">
        <Volume2 size={13} className="shrink-0 mt-0.5" style={{ color: "#64748B" }} />
        <div>
          <span className="text-[10px] font-medium" style={{ color: S.text3 }}>环境音</span>
          <p className="text-xs" style={{ color: S.text2 }}>{audio.ambientSound}</p>
        </div>
      </div>

      {/* SFX list */}
      {audio.sfx && audio.sfx.length > 0 && (
        <div className="space-y-1.5">
          <span className="text-[10px] font-medium" style={{ color: S.text3 }}>音效</span>
          <div className="flex items-center gap-2 flex-wrap">
            {audio.sfx.map((sfx, i) => (
              <span key={i} className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium" style={{ background: S.s3, color: S.text2 }}>
                <Zap size={10} style={{ color: S.warning }} /> {sfx}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Voice direction */}
      {audio.voiceDirection && (
        <div className="flex items-start gap-2">
          <Mic size={13} className="shrink-0 mt-0.5" style={{ color: S.rose }} />
          <div>
            <span className="text-[10px] font-medium" style={{ color: S.text3 }}>配音指导</span>
            <p className="text-xs" style={{ color: S.text2 }}>{audio.voiceDirection}</p>
          </div>
        </div>
      )}

      {/* Audio timeline visualization */}
      <AudioTimelineViz audio={audio} duration={direction.camera.duration} />
    </div>
  );
}

function AudioTimelineViz({ audio, duration }: { audio: { bgmTrack: string; bgmMood: string; ambientSound: string; sfx?: string[] }; duration: number }) {
  const sfxCount = audio.sfx?.length ?? 0;
  return (
    <div className="pt-2 space-y-1.5">
      <span className="text-[10px] font-medium" style={{ color: S.text3 }}>音频时间线 ({duration}s)</span>
      <div className="space-y-1">
        {/* BGM bar */}
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-medium w-8" style={{ color: S.accent }}>BGM</span>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="h-3 rounded-full"
            style={{ background: `linear-gradient(90deg, ${S.accent}, ${S.accent}80)` }}
          />
        </div>
        {/* Ambient bar */}
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-medium w-8" style={{ color: "#94A3B8" }}>AMB</span>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="h-2.5 rounded-full"
            style={{ background: `linear-gradient(90deg, #94A3B860, #94A3B830)` }}
          />
        </div>
        {/* SFX markers */}
        {sfxCount > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-medium w-8" style={{ color: S.warning }}>SFX</span>
            <div className="flex-1 relative h-4 flex items-center">
              {audio.sfx?.map((sfx, i) => {
                const pos = ((i + 1) / (sfxCount + 1)) * 100;
                return (
                  <motion.div
                    key={i}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.2, delay: 0.3 + i * 0.1 }}
                    className="absolute flex flex-col items-center"
                    style={{ left: `${pos}%`, transform: "translateX(-50%)" }}
                  >
                    <div className="w-1.5 h-4 rounded-full" style={{ background: S.warning }} />
                  </motion.div>
                );
              })}
              <div className="w-full h-px" style={{ background: S.border }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// Pacing & Transition Section
// ══════════════════════════════════════════════════════════════════════════
function PacingSection({ direction }: { direction: CinematicDirection }) {
  const transMeta = TRANSITION_META[direction.transition] ?? TRANSITION_META.cut;
  const TransIcon = transMeta.icon;

  return (
    <div className="space-y-4">
      {/* Transition type */}
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold" style={{ background: transMeta.bg, color: transMeta.color }}>
          <TransIcon size={13} /> {transMeta.label}
        </span>
        <span className="text-xs font-medium" style={{ color: S.text2 }}>{direction.transitionLabel}</span>
      </div>

      {/* Transition visual indicator */}
      <TransitionViz type={direction.transition} />

      {/* Pacing description */}
      <div className="space-y-1">
        <span className="text-[10px] font-medium" style={{ color: S.text3 }}>节奏说明</span>
        <p className="text-xs leading-relaxed" style={{ color: S.text2 }}>{direction.pacing}</p>
      </div>

      {/* Staging notes */}
      {direction.staging && (
        <div className="space-y-1">
          <span className="text-[10px] font-medium" style={{ color: S.text3 }}>场面调度</span>
          <div className="p-3 rounded-lg" style={{ background: S.s2, border: `1px solid ${S.border}` }}>
            <p className="text-xs leading-relaxed" style={{ color: S.text2 }}>{direction.staging}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function TransitionViz({ type }: { type: TransitionType }) {
  return (
    <div className="flex items-center justify-center py-2">
      <svg width="200" height="40" viewBox="0 0 200 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        {type === "cut" && (
          <>
            <rect x="10" y="10" width="80" height="20" rx="4" fill={S.purple10} stroke={S.purple} strokeWidth="1" />
            <line x1="100" y1="5" x2="100" y2="35" stroke="#EF4444" strokeWidth="2.5" />
            <rect x="110" y="10" width="80" height="20" rx="4" fill={S.s3} stroke={S.border} strokeWidth="1" />
          </>
        )}
        {type === "fade" && (
          <>
            <rect x="10" y="10" width="80" height="20" rx="4" fill={S.purple10} stroke={S.purple} strokeWidth="1" />
            <defs>
              <linearGradient id="fade-grad" x1="90" y1="0" x2="110" y2="0" gradientUnits="userSpaceOnUse">
                <stop stopColor={S.purple} stopOpacity="0.6" />
                <stop offset="1" stopColor={S.text3} stopOpacity="0.1" />
              </linearGradient>
            </defs>
            <rect x="90" y="10" width="20" height="20" fill="url(#fade-grad)" />
            <rect x="110" y="10" width="80" height="20" rx="4" fill={S.s3} stroke={S.border} strokeWidth="1" />
          </>
        )}
        {type === "dissolve" && (
          <>
            <rect x="10" y="10" width="80" height="20" rx="4" fill={S.purple10} stroke={S.purple} strokeWidth="1" />
            {[92, 96, 100, 104, 108].map((x, i) => (
              <circle key={i} cx={x} cy={20} r={2 - i * 0.2} fill={S.purple} opacity={1 - i * 0.2} />
            ))}
            <rect x="110" y="10" width="80" height="20" rx="4" fill={S.s3} stroke={S.border} strokeWidth="1" />
          </>
        )}
        {type === "wipe" && (
          <>
            <rect x="10" y="10" width="80" height="20" rx="4" fill={S.purple10} stroke={S.purple} strokeWidth="1" />
            <polygon points="90,10 110,20 90,30" fill={S.purple} opacity="0.5" />
            <rect x="110" y="10" width="80" height="20" rx="4" fill={S.s3} stroke={S.border} strokeWidth="1" />
          </>
        )}
        {type === "flash" && (
          <>
            <rect x="10" y="10" width="80" height="20" rx="4" fill={S.purple10} stroke={S.purple} strokeWidth="1" />
            <polygon points="100,6 103,16 113,16 105,22 108,32 100,26 92,32 95,22 87,16 97,16" fill="#F59E0B" opacity="0.8" />
            <rect x="110" y="10" width="80" height="20" rx="4" fill={S.s3} stroke={S.border} strokeWidth="1" />
          </>
        )}
        {type === "slow_motion" && (
          <>
            <rect x="10" y="10" width="80" height="20" rx="4" fill={S.purple10} stroke={S.purple} strokeWidth="1" />
            <text x="100" y="24" textAnchor="middle" fill={S.text3} fontSize="10" fontWeight="600">slow</text>
            <rect x="110" y="10" width="80" height="20" rx="4" fill={S.s3} stroke={S.border} strokeWidth="1" />
          </>
        )}
      </svg>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// Node Timeline (bottom strip)
// ══════════════════════════════════════════════════════════════════════════
function NodeTimeline({
  directions,
  nodeMap,
  selectedNodeId,
  onSelect,
}: {
  directions: CinematicDirection[];
  nodeMap: Map<string, { id: string; label: string; type: string }>;
  selectedNodeId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25, duration: 0.22 }}
      className="rounded-2xl overflow-hidden"
      style={{ background: S.card, border: `1px solid ${S.border}` }}
    >
      <div className="px-5 py-4 flex items-center gap-2" style={{ borderBottom: `1px solid ${S.border}` }}>
        <Film size={16} style={{ color: S.purple }} />
        <h2 className="text-sm font-bold" style={{ color: S.text }}>节点时间线</h2>
        <span className="text-[10px] px-2 py-0.5 rounded-md font-medium" style={{ background: S.s3, color: S.text3 }}>
          {directions.length} 个节点已配置
        </span>
      </div>
      <div className="p-5 overflow-x-auto">
        <div className="flex items-center gap-1 min-w-max">
          {directions.map((d, i) => {
            const node = nodeMap.get(d.nodeId);
            const isSelected = d.nodeId === selectedNodeId;
            const shotMeta = SHOT_META[d.camera.shotType] ?? SHOT_META.wide;
            const ShotIcon = shotMeta.icon;
            const transMeta = TRANSITION_META[d.transition] ?? TRANSITION_META.cut;

            return (
              <div key={d.nodeId} className="flex items-center gap-1">
                {/* Node card */}
                <motion.button
                  onClick={() => onSelect(d.nodeId)}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  className="rounded-xl p-3 text-left transition-all focus:outline-none min-w-[120px]"
                  style={{
                    background: isSelected ? S.purple10 : S.card,
                    border: `1.5px solid ${isSelected ? S.purple : S.border}`,
                    boxShadow: isSelected ? `0 4px 16px ${S.purple10}` : "0 1px 3px rgba(0,0,0,0.04)",
                  }}
                >
                  {/* Node label */}
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold" style={{ background: isSelected ? S.purple : S.s3, color: isSelected ? "#fff" : S.text3 }}>
                      {d.nodeId}
                    </span>
                    <span className="text-[11px] font-bold truncate" style={{ color: isSelected ? S.purple : S.text }}>
                      {node?.label ?? d.nodeId}
                    </span>
                  </div>
                  {/* Shot type + duration */}
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1" style={{ color: shotMeta.color }}>
                      <ShotIcon size={11} />
                      <span className="text-[10px] font-medium">{shotMeta.label}</span>
                    </span>
                    <span className="text-[10px]" style={{ color: S.text3 }}>{d.camera.duration}s</span>
                  </div>
                </motion.button>

                {/* Transition arrow (except after last) */}
                {i < directions.length - 1 && (
                  <div className="flex flex-col items-center gap-0.5 px-1">
                    <span className="text-[8px] font-medium" style={{ color: transMeta.color }}>
                      {transMeta.label}
                    </span>
                    <ArrowRight size={14} style={{ color: S.text3 }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// Lens Preset Library (镜头预设库)
// ══════════════════════════════════════════════════════════════════════════

interface LensPreset {
  id: string;
  name: string;
  focalLength: string;
  aperture: string;
  category: "standard" | "creative" | "action";
  description: string;
  shotTypes: CameraShotType[];
  movements: CameraMovement[];
  bestFor: string;
}

const LENS_PRESETS: LensPreset[] = [
  { id: "lp-35",  name: "35mm 标准广角",   focalLength: "35mm", aperture: "f/2.8", category: "standard",
    description: "适合交代环境全貌与角色空间关系，透视感自然", shotTypes: ["wide", "medium"], movements: ["pan_left", "pan_right", "static"],
    bestFor: "场景建立、群戏" },
  { id: "lp-50",  name: "50mm 标准镜头",   focalLength: "50mm", aperture: "f/1.8", category: "standard",
    description: "接近人眼视角，最适合对话与情感表达", shotTypes: ["medium", "close_up"], movements: ["static", "dolly_in"],
    bestFor: "对话场景、独白" },
  { id: "lp-85",  name: "85mm 人像镜头",   focalLength: "85mm", aperture: "f/1.4", category: "standard",
    description: "浅景深压缩空间，突出角色情绪与面部细节", shotTypes: ["close_up"], movements: ["static", "push_in"],
    bestFor: "特写、情感高潮" },
  { id: "lp-24",  name: "24mm 广角镜头",   focalLength: "24mm", aperture: "f/4.0", category: "creative",
    description: "夸大透视与空间纵深，制造压迫感或壮阔感", shotTypes: ["wide", "pull_out"], movements: ["crane_up", "crane_down", "dolly_out"],
    bestFor: "壮阔场景、恐惧感" },
  { id: "lp-135", name: "135mm 长焦压缩",  focalLength: "135mm", aperture: "f/2.0", category: "creative",
    description: "强烈背景压缩，角色仿佛被困在画面中", shotTypes: ["medium", "close_up"], movements: ["tracking", "static"],
    bestFor: "监视、跟踪、孤立感" },
  { id: "lp-anam", name: "变形宽银幕",     focalLength: "40mm", aperture: "f/2.39:1", category: "creative",
    description: "电影级宽幅画面，边缘畸变增添科幻质感", shotTypes: ["wide", "tracking"], movements: ["pan_left", "pan_right", "orbit"],
    bestFor: "赛博朋克、科幻" },
  { id: "lp-hand", name: "手持跟拍",        focalLength: "28mm", aperture: "f/2.8", category: "action",
    description: "手持晃动感增强临场感，适合追逐与紧张场景", shotTypes: ["tracking", "handheld"], movements: ["tracking", "push_in"],
    bestFor: "追逐、紧张对话" },
  { id: "lp-stab", name: "稳定器一镜到底",  focalLength: "35mm", aperture: "f/2.0", category: "action",
    description: "流畅运镜穿越场景，展现完整空间叙事", shotTypes: ["tracking", "wide"], movements: ["orbit", "crane_up", "dolly_in"],
    bestFor: "长镜头、空间探索" },
];

const LENS_CATEGORY_META: Record<string, { label: string; color: string; bg: string }> = {
  standard: { label: "标准",   color: "#0EA5E9", bg: "rgba(14,165,233,0.08)" },
  creative: { label: "创意",   color: "#8B5CF6", bg: "rgba(139,92,246,0.08)" },
  action:   { label: "动作",   color: "#F59E0B", bg: "rgba(245,158,11,0.08)" },
};

function LensPresetLibrary({ characters }: { characters: { id: string; name: string; role: string; color: string; emoji: string; appearNodes: string[]; emotionStates: { label: string; done: boolean }[]; visualPrompt: string }[] }) {
  const [lockedChars, setLockedChars] = useState<Record<string, boolean>>({});
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  const lockedCount = Object.values(lockedChars).filter(Boolean).length;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}
      className="space-y-6">

      {/* ── A. 镜头预设模板 ──────────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Aperture size={16} style={{ color: "#E11D48" }} />
          <h2 className="text-sm font-bold" style={{ color: S.text }}>镜头预设模板</h2>
          <span className="text-[10px] px-2 py-0.5 rounded-md font-medium" style={{ background: "rgba(225,29,72,0.08)", color: "#E11D48" }}>
            {LENS_PRESETS.length} 个预设
          </span>
        </div>

        {/* Category filter chips */}
        <div className="flex items-center gap-2 mb-4">
          {Object.entries(LENS_CATEGORY_META).map(([key, meta]) => (
            <span key={key} className="text-[10px] px-2.5 py-1 rounded-lg font-medium"
              style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.color}20` }}>
              {meta.label}
            </span>
          ))}
        </div>

        {/* Preset grid */}
        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
          {LENS_PRESETS.map(preset => {
            const catMeta = LENS_CATEGORY_META[preset.category];
            const isSelected = selectedPreset === preset.id;
            return (
              <motion.div key={preset.id}
                whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedPreset(isSelected ? null : preset.id)}
                className="rounded-xl p-4 cursor-pointer transition-all"
                style={{
                  background: isSelected ? `${catMeta.color}06` : S.card,
                  border: `1.5px solid ${isSelected ? catMeta.color : S.border}`,
                  boxShadow: isSelected ? `0 4px 16px ${catMeta.color}12` : "0 1px 3px rgba(0,0,0,0.04)",
                }}>
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: catMeta.bg }}>
                      <Aperture size={14} style={{ color: catMeta.color }} />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold block" style={{ color: S.text }}>{preset.name}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: catMeta.bg, color: catMeta.color }}>
                        {catMeta.label}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] font-mono font-bold block" style={{ color: catMeta.color }}>{preset.focalLength}</span>
                    <span className="text-[9px] font-mono" style={{ color: S.text3 }}>{preset.aperture}</span>
                  </div>
                </div>
                {/* Description */}
                <p className="text-[10px] leading-relaxed mb-2.5" style={{ color: S.text2 }}>{preset.description}</p>
                {/* Tags */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {preset.shotTypes.map(st => {
                    const meta = SHOT_META[st];
                    return meta ? (
                      <span key={st} className="flex items-center gap-0.5 text-[8px] px-1.5 py-0.5 rounded"
                        style={{ background: meta.bg, color: meta.color }}>
                        {meta.label}
                      </span>
                    ) : null;
                  })}
                  <span className="text-[8px] px-1.5 py-0.5 rounded" style={{ background: S.s3, color: S.text3 }}>
                    适用：{preset.bestFor}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ── B. 角色外貌锁定 ──────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BookOpen size={16} style={{ color: S.accent }} />
            <h2 className="text-sm font-bold" style={{ color: S.text }}>角色外貌提示词</h2>
            <span className="text-[10px] px-2 py-0.5 rounded-md font-medium" style={{ background: S.accent10, color: S.accent }}>
              {characters.length} 个角色
            </span>
          </div>
          <span className="text-[10px] font-medium" style={{ color: lockedCount > 0 ? S.success : S.text3 }}>
            {lockedCount > 0 ? `${lockedCount} 个已锁定` : "未锁定"}
          </span>
        </div>

        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))" }}>
          {characters.map(char => {
            const isLocked = lockedChars[char.id] ?? false;
            const doneStates = char.emotionStates.filter(s => s.done).length;
            return (
              <div key={char.id} className="rounded-xl overflow-hidden"
                style={{ background: S.card, border: `1px solid ${S.border}`, borderLeft: `4px solid ${char.color}` }}>
                {/* Character header */}
                <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${S.border}` }}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0"
                      style={{ background: `${char.color}15` }}>
                      <span>{char.emoji}</span>
                    </div>
                    <div>
                      <p className="text-xs font-bold" style={{ color: S.text }}>{char.name}</p>
                      <p className="text-[9px]" style={{ color: S.text3 }}>{char.role} · 出现 {char.appearNodes.length} 节点</p>
                    </div>
                  </div>
                  <motion.button whileTap={{ scale: 0.9 }}
                    onClick={() => setLockedChars(prev => ({ ...prev, [char.id]: !prev[char.id] }))}
                    className="text-[9px] px-2.5 py-1 rounded-full font-bold focus:outline-none"
                    style={{
                      background: isLocked ? "rgba(0,169,157,0.15)" : "rgba(245,158,11,0.12)",
                      color: isLocked ? S.accent : S.warning,
                      border: `1px solid ${isLocked ? "rgba(0,169,157,0.3)" : "rgba(245,158,11,0.25)"}`,
                    }}>
                    {isLocked ? "✓ 已锁定" : "锁定外貌"}
                  </motion.button>
                </div>
                {/* Prompt + emotion states */}
                <div className="px-4 py-3">
                  <p className="text-[9px] mb-1 font-medium" style={{ color: S.text3 }}>外貌提示词</p>
                  {char.visualPrompt ? (
                    <p className="text-[10px] leading-relaxed" style={{ color: isLocked ? S.text : S.text3 }}>
                      {char.visualPrompt}
                    </p>
                  ) : (
                    <p className="text-[10px] italic" style={{ color: S.border2 }}>尚未设置外貌提示词</p>
                  )}
                  {/* Emotion state chips */}
                  <div className="flex gap-1.5 mt-2.5 flex-wrap">
                    {char.emotionStates.map((state, j) => (
                      <span key={j} className="text-[8px] px-1.5 py-0.5 rounded font-medium"
                        style={{
                          background: state.done ? `${char.color}15` : S.s3,
                          color: state.done ? char.color : S.text3,
                          border: `1px solid ${state.done ? `${char.color}30` : "transparent"}`,
                        }}>
                        {state.done ? "✓ " : ""}{state.label}
                      </span>
                    ))}
                    <span className="text-[8px] font-mono" style={{ color: S.text3 }}>
                      {doneStates}/{char.emotionStates.length} 就绪
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}