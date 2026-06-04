"use client";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Database, Search, Image, Video, Music, Monitor, FileText,
  Upload, Grid, List, ChevronLeft, ChevronRight,
  Filter, Download, Trash2, Eye, MoreHorizontal,
} from "lucide-react";
import { useNarrativeStore } from "@/store";

const S = {
  bg: "#F5F6FA", card: "#FFFFFF", s2: "#F4F6FC",
  border: "#E8EAF2", primary: "#7C6CF5", accent: "#00A99D",
  text: "#1A1D2E", text2: "#4A5068", text3: "#8892B0",
  success: "#10B981", warning: "#F59E0B", error: "#EF4444",
};

// ── Mock asset data ────────────────────────────────────────────────────────
type AssetType = "image" | "video" | "audio" | "ui" | "text";
type AssetStatus = "approved" | "pending" | "archived";

interface Asset {
  id: string;
  name: string;
  type: AssetType;
  size: string;
  date: string;
  status: AssetStatus;
  thumb?: string;
}

const SEED_ASSETS: Asset[] = [
  { id: "a01", name: "赛博朋克街道_背景.png",     type: "image", size: "2.4 MB",  date: "2025-05-28", status: "approved"  },
  { id: "a02", name: "主角_艾拉_立绘_默认.png",   type: "image", size: "1.8 MB",  date: "2025-05-27", status: "approved"  },
  { id: "a03", name: "序章_开场动画.mp4",          type: "video", size: "24.6 MB", date: "2025-05-26", status: "pending"   },
  { id: "a04", name: "BGM_霓虹夜幕_主题曲.mp3",   type: "audio", size: "4.2 MB",  date: "2025-05-25", status: "approved"  },
  { id: "a05", name: "UI_对话框_赛博风格.png",     type: "ui",    size: "0.6 MB",  date: "2025-05-24", status: "approved"  },
  { id: "a06", name: "地下酒吧_氛围音效.wav",      type: "audio", size: "8.1 MB",  date: "2025-05-23", status: "pending"   },
  { id: "a07", name: "追逐场景_视频片段.mp4",      type: "video", size: "31.2 MB", date: "2025-05-22", status: "archived"  },
  { id: "a08", name: "反派主管_立绘_愤怒.png",     type: "image", size: "1.9 MB",  date: "2025-05-21", status: "approved"  },
  { id: "a09", name: "UI_QTE界面_倒计时.png",      type: "ui",    size: "0.8 MB",  date: "2025-05-20", status: "pending"   },
  { id: "a10", name: "旁白_序章_女声.mp3",         type: "audio", size: "3.5 MB",  date: "2025-05-19", status: "approved"  },
  { id: "a11", name: "天台_月光_背景.png",         type: "image", size: "3.1 MB",  date: "2025-05-18", status: "archived"  },
  { id: "a12", name: "结局A_过场动画.mp4",         type: "video", size: "18.4 MB", date: "2025-05-17", status: "pending"   },
  { id: "seed-text-1", name: "主线剧本·第一章",       type: "text",  size: "2.4KB",   date: "2025-01-15", status: "approved"  },
  { id: "seed-text-2", name: "艾拉·对话台词集",       type: "text",  size: "1.8KB",   date: "2025-01-16", status: "approved"  },
];

// ── Type / status config ───────────────────────────────────────────────────
const TYPE_CONFIG: Record<AssetType, { label: string; icon: typeof Image; color: string }> = {
  image: { label: "图片",  icon: Image,   color: "#7C6CF5" },
  video: { label: "视频",  icon: Video,   color: "#F59E0B" },
  audio: { label: "音频",  icon: Music,   color: "#00A99D" },
  ui:    { label: "UI模板", icon: Monitor, color: "#EF4444" },
  text:  { label: "文字",   icon: FileText, color: "#8B5CF6" },
};

const STATUS_CONFIG: Record<AssetStatus, { label: string; bg: string; color: string }> = {
  approved: { label: "已审核", bg: `${S.success}14`, color: S.success },
  pending:  { label: "待审核", bg: `${S.warning}14`, color: S.warning },
  archived: { label: "已废弃", bg: `${S.error}14`,   color: S.error   },
};

// ── Filter pills config ────────────────────────────────────────────────────
const FILTERS: { key: AssetType | "all"; label: string }[] = [
  { key: "all",   label: "全部"    },
  { key: "image", label: "图片"    },
  { key: "video", label: "视频"    },
  { key: "audio", label: "音频"    },
  { key: "ui",    label: "UI模板"  },
  { key: "text",  label: "文字"    },
];

// ── Statistics config ──────────────────────────────────────────────────────
const STATS = [
  { label: "总资产",  value: 49,          color: S.primary },
  { label: "图片资产", value: 23,          color: "#7C6CF5" },
  { label: "视频资产", value: 8,           color: "#F59E0B" },
  { label: "音频资产", value: 12,          color: "#00A99D" },
  { label: "UI模板",   value: 4,           color: "#EF4444" },
  { label: "文字资产", value: 2,           color: "#8B5CF6" },
];

const STORAGE_USED = 128;
const STORAGE_TOTAL = 500;

export default function AssetLibraryScreen() {
  const [activeFilter, setActiveFilter] = useState<AssetType | "all">("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCard, setActiveCard] = useState<string | null>(null);

  // ── Store selectors ──
  const gameCharacters = useNarrativeStore(s => s.characters);
  const gameScenes = useNarrativeStore(s => s.scenes);
  const gameProps = useNarrativeStore(s => s.props);
  const assetCards = useNarrativeStore(s => s.assetCards);
  const scriptBlocks = useNarrativeStore(s => s.scriptBlocks);
  const storyNodes = useNarrativeStore(s => s.storyNodes);

  // ── Derive unified asset list from store (seed fallback) ──
  const allAssets = useMemo<Asset[]>(() => {
    const storeAssets: Asset[] = [];
    // Characters → image assets
    gameCharacters.forEach(c => {
      storeAssets.push({
        id: `char-${c.id}`, name: `${c.name}_立绘.png`, type: "image",
        size: "—", date: "—", status: c.visualPrompt ? "approved" : "pending",
      });
    });
    // Scenes → image assets
    gameScenes.forEach(s => {
      storeAssets.push({
        id: `scene-${s.id}`, name: `${s.name}_背景.png`, type: "image",
        size: "—", date: "—", status: s.hasImage ? "approved" : "pending",
      });
    });
    // Props → image assets
    gameProps.forEach(p => {
      storeAssets.push({
        id: `prop-${p.id}`, name: `${p.name}_道具图.png`, type: "image",
        size: "—", date: "—", status: p.hasImage ? "approved" : "pending",
      });
    });
    // Asset cards → typed requirements
    assetCards.forEach(ac => {
      storeAssets.push({
        id: `req-${ac.nodeId}`, name: ac.nodeLabel || ac.nodeId, type: "image",
        size: "—", date: "—", status: ac.hasImage ? "approved" : "pending",
      });
    });
    // Script blocks → text assets
    scriptBlocks.forEach(sb => {
      storeAssets.push({
        id: `script-${sb.id}`,
        name: `剧本·${sb.label || sb.id}`,
        type: "text" as const,
        size: `${(sb.content?.length || 0)}字`,
        date: "—",
        status: "approved" as const,
      });
    });
    // Story nodes → text assets (dialogue-bearing nodes)
    storyNodes.forEach(node => {
      storeAssets.push({
        id: `node-${node.id}`,
        name: `台词·${node.label}`,
        type: "text" as const,
        size: "—",
        date: "—",
        status: "approved" as const,
      });
    });
    return storeAssets.length > 0 ? storeAssets : SEED_ASSETS;
  }, [gameCharacters, gameScenes, gameProps, assetCards, scriptBlocks, storyNodes]);

  // ── Dynamic statistics ──
  const stats = useMemo(() => {
    const img = allAssets.filter(a => a.type === "image").length;
    const vid = allAssets.filter(a => a.type === "video").length;
    const aud = allAssets.filter(a => a.type === "audio").length;
    const ui = allAssets.filter(a => a.type === "ui").length;
    const txt = allAssets.filter(a => a.type === "text").length;
    return [
      { label: "总资产", value: allAssets.length, color: S.primary },
      { label: "图片资产", value: img, color: "#7C6CF5" },
      { label: "视频资产", value: vid, color: "#F59E0B" },
      { label: "音频资产", value: aud, color: "#00A99D" },
      { label: "UI模板", value: ui, color: "#EF4444" },
      { label: "文字资产", value: txt, color: "#8B5CF6" },
    ];
  }, [allAssets]);

  const filteredAssets = allAssets.filter(a => {
    const matchesFilter = activeFilter === "all" || a.type === activeFilter;
    const matchesSearch = !searchQuery || a.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const storagePercent = Math.round((STORAGE_USED / STORAGE_TOTAL) * 100);

  return (
    <div className="h-svh flex flex-col" style={{ background: S.bg }}>

      {/* ── Top header bar ── */}
      <div className="shrink-0" style={{ background: S.card, borderBottom: `1px solid ${S.border}` }}>
        {/* Row 1: title + search + actions */}
        <div className="flex items-center gap-3 px-4 pt-3 pb-2">
          {/* Title */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: `${S.primary}14` }}>
              <Database size={14} style={{ color: S.primary }} />
            </div>
            <h1 className="text-sm font-bold" style={{ color: S.text }}>资产库</h1>
          </div>

          {/* Search */}
          <div className="flex-1 max-w-xs relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2"
              style={{ color: S.text3 }} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="搜索资产名称..."
              className="w-full pl-7 pr-3 py-1.5 rounded-lg text-xs focus:outline-none"
              style={{
                background: S.s2,
                border: `1px solid ${S.border}`,
                color: S.text,
              }}
              onFocus={e => (e.currentTarget.style.borderColor = S.primary)}
              onBlur={e => (e.currentTarget.style.borderColor = S.border)}
            />
          </div>

          {/* Filter pills */}
          <div className="flex items-center gap-1">
            <Filter size={11} style={{ color: S.text3 }} />
            {FILTERS.map(f => (
              <motion.button key={f.key} whileTap={{ scale: 0.96 }}
                onClick={() => setActiveFilter(f.key)}
                className="px-2.5 py-1 rounded-full text-[10px] font-bold focus:outline-none transition-all"
                style={{
                  background: activeFilter === f.key ? S.primary : S.s2,
                  color: activeFilter === f.key ? "#fff" : S.text2,
                  border: activeFilter === f.key ? "none" : `1px solid ${S.border}`,
                }}>
                {f.label}
              </motion.button>
            ))}
          </div>

          {/* View toggle */}
          <div className="flex items-center rounded-lg overflow-hidden shrink-0"
            style={{ border: `1px solid ${S.border}` }}>
            <motion.button whileTap={{ scale: 0.97 }}
              onClick={() => setViewMode("grid")}
              className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-bold focus:outline-none"
              style={{
                background: viewMode === "grid" ? S.primary : S.s2,
                color: viewMode === "grid" ? "#fff" : S.text3,
              }}>
              <Grid size={10} /> 网格
            </motion.button>
            <motion.button whileTap={{ scale: 0.97 }}
              onClick={() => setViewMode("list")}
              className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-bold focus:outline-none"
              style={{
                background: viewMode === "list" ? S.primary : S.s2,
                color: viewMode === "list" ? "#fff" : S.text3,
              }}>
              <List size={10} /> 列表
            </motion.button>
          </div>

          {/* Import button */}
          <motion.button whileTap={{ scale: 0.97 }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white shrink-0 focus:outline-none"
            style={{ background: `linear-gradient(135deg, ${S.primary}, #A78BFA)` }}>
            <Upload size={12} /> 导入资产
          </motion.button>
        </div>

        {/* Row 2: statistics bar */}
        <div className="flex items-center gap-3 px-4 pb-2.5">
          {stats.map(stat => (
            <div key={stat.label} className="flex items-center gap-1.5">
              <span className="text-xs font-bold font-mono" style={{ color: stat.color }}>
                {stat.value}
              </span>
              <span className="text-[9px]" style={{ color: S.text3 }}>{stat.label}</span>
            </div>
          ))}

          {/* Divider */}
          <div className="w-px h-4 mx-1" style={{ background: S.border }} />

          {/* Storage */}
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-[9px]" style={{ color: S.text3 }}>存储空间</span>
            <div className="w-24 h-1.5 rounded-full overflow-hidden" style={{ background: S.s2 }}>
              <div className="h-full rounded-full transition-all"
                style={{
                  width: `${storagePercent}%`,
                  background: storagePercent > 80 ? S.warning : S.primary,
                }} />
            </div>
            <span className="text-[9px] font-mono" style={{ color: S.text2 }}>
              {STORAGE_USED} MB / {STORAGE_TOTAL} MB
            </span>
          </div>
        </div>
      </div>

      {/* ── Main content area ── */}
      <div className="flex-1 overflow-y-auto p-4">
        {viewMode === "grid" ? (
          <div className="grid grid-cols-3 gap-3">
            {filteredAssets.map(asset => {
              const typeConf = TYPE_CONFIG[asset.type];
              const statusConf = STATUS_CONFIG[asset.status];
              const TypeIcon = typeConf.icon;
              const isActive = activeCard === asset.id;
              return (
                <motion.div key={asset.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileTap={{ scale: 0.985 }}
                  onClick={() => setActiveCard(isActive ? null : asset.id)}
                  className="rounded-xl overflow-hidden cursor-pointer transition-all"
                  style={{
                    background: S.card,
                    border: `1px solid ${isActive ? S.primary : S.border}`,
                    boxShadow: isActive ? `0 0 0 2px ${S.primary}28` : "none",
                  }}>
                  {/* Thumbnail area */}
                  <div className="relative h-24 flex items-center justify-center"
                    style={{ background: `linear-gradient(135deg, ${typeConf.color}12, ${typeConf.color}06)` }}>
                    <TypeIcon size={28} style={{ color: `${typeConf.color}80` }} />
                    {/* Type badge */}
                    <span className="absolute top-2 left-2 text-[8px] font-bold px-1.5 py-0.5 rounded"
                      style={{ background: `${typeConf.color}18`, color: typeConf.color }}>
                      {typeConf.label}
                    </span>
                    {/* Hover overlay actions */}
                    <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 hover:opacity-100 transition-opacity"
                      style={{ background: "rgba(26,29,46,0.55)" }}>
                      <motion.button whileTap={{ scale: 0.9 }}
                        className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{ background: "rgba(255,255,255,0.2)" }}>
                        <Eye size={12} color="#fff" />
                      </motion.button>
                      <motion.button whileTap={{ scale: 0.9 }}
                        className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{ background: "rgba(255,255,255,0.2)" }}>
                        <Download size={12} color="#fff" />
                      </motion.button>
                      <motion.button whileTap={{ scale: 0.9 }}
                        className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{ background: "rgba(255,255,255,0.2)" }}>
                        <Trash2 size={12} color="#fff" />
                      </motion.button>
                      <motion.button whileTap={{ scale: 0.9 }}
                        className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{ background: "rgba(255,255,255,0.2)" }}>
                        <MoreHorizontal size={12} color="#fff" />
                      </motion.button>
                    </div>
                  </div>
                  {/* Card body */}
                  <div className="p-2.5">
                    <p className="text-[10px] font-bold truncate mb-1" style={{ color: S.text }}>
                      {asset.name}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[8px] px-1.5 py-0.5 rounded font-bold"
                          style={{ background: statusConf.bg, color: statusConf.color }}>
                          {statusConf.label}
                        </span>
                        <span className="text-[8px]" style={{ color: S.text3 }}>{asset.size}</span>
                      </div>
                      <span className="text-[8px]" style={{ color: S.text3 }}>{asset.date}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          /* List view */
          <div className="space-y-1.5">
            {filteredAssets.map(asset => {
              const typeConf = TYPE_CONFIG[asset.type];
              const statusConf = STATUS_CONFIG[asset.status];
              const TypeIcon = typeConf.icon;
              const isActive = activeCard === asset.id;
              return (
                <motion.div key={asset.id}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  whileTap={{ scale: 0.995 }}
                  onClick={() => setActiveCard(isActive ? null : asset.id)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all"
                  style={{
                    background: S.card,
                    border: `1px solid ${isActive ? S.primary : S.border}`,
                    boxShadow: isActive ? `0 0 0 2px ${S.primary}28` : "none",
                  }}>
                  {/* Icon */}
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: `${typeConf.color}14` }}>
                    <TypeIcon size={15} style={{ color: typeConf.color }} />
                  </div>
                  {/* Name */}
                  <p className="text-[10px] font-bold flex-1 truncate" style={{ color: S.text }}>
                    {asset.name}
                  </p>
                  {/* Type badge */}
                  <span className="text-[8px] font-bold px-1.5 py-0.5 rounded shrink-0"
                    style={{ background: `${typeConf.color}14`, color: typeConf.color }}>
                    {typeConf.label}
                  </span>
                  {/* Size */}
                  <span className="text-[9px] w-14 text-right shrink-0" style={{ color: S.text3 }}>
                    {asset.size}
                  </span>
                  {/* Date */}
                  <span className="text-[9px] w-20 text-right shrink-0" style={{ color: S.text3 }}>
                    {asset.date}
                  </span>
                  {/* Status */}
                  <span className="text-[8px] font-bold px-2 py-0.5 rounded shrink-0"
                    style={{ background: statusConf.bg, color: statusConf.color }}>
                    {statusConf.label}
                  </span>
                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <motion.button whileTap={{ scale: 0.9 }}
                      className="w-6 h-6 rounded flex items-center justify-center"
                      style={{ background: S.s2 }}>
                      <Eye size={10} style={{ color: S.text3 }} />
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.9 }}
                      className="w-6 h-6 rounded flex items-center justify-center"
                      style={{ background: S.s2 }}>
                      <Download size={10} style={{ color: S.text3 }} />
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.9 }}
                      className="w-6 h-6 rounded flex items-center justify-center"
                      style={{ background: S.s2 }}>
                      <MoreHorizontal size={10} style={{ color: S.text3 }} />
                    </motion.button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Bottom pagination bar ── */}
      <div className="shrink-0 flex items-center justify-between px-4 py-2.5"
        style={{ background: S.card, borderTop: `1px solid ${S.border}` }}>
        <span className="text-[10px]" style={{ color: S.text3 }}>
          显示 1-{filteredAssets.length} / 共 {allAssets.length} 个资产
        </span>
        <div className="flex items-center gap-1">
          <motion.button whileTap={{ scale: 0.94 }}
            className="w-7 h-7 rounded-lg flex items-center justify-center focus:outline-none"
            style={{ background: S.s2, border: `1px solid ${S.border}` }}>
            <ChevronLeft size={12} style={{ color: S.text3 }} />
          </motion.button>
          {[1, 2, 3, 4].map(page => (
            <motion.button key={page} whileTap={{ scale: 0.94 }}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold focus:outline-none"
              style={{
                background: page === 1 ? S.primary : S.s2,
                color: page === 1 ? "#fff" : S.text3,
                border: `1px solid ${page === 1 ? S.primary : S.border}`,
              }}>
              {page}
            </motion.button>
          ))}
          <motion.button whileTap={{ scale: 0.94 }}
            className="w-7 h-7 rounded-lg flex items-center justify-center focus:outline-none"
            style={{ background: S.s2, border: `1px solid ${S.border}` }}>
            <ChevronRight size={12} style={{ color: S.text3 }} />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
