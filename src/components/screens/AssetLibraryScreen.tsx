import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Database, Search, Image, Video, Music, Monitor, FileText,
  Upload, Grid, List, ChevronLeft, ChevronRight,
  Filter, Download, Trash2, Eye, MoreHorizontal,
  ArrowUpDown, CheckSquare, XSquare, Share2, Layers, Check, X,
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
  text:  { label: "文本",   icon: FileText, color: "#8B5CF6" },
};

const STATUS_CONFIG: Record<AssetStatus, { label: string; bg: string; color: string }> = {
  approved: { label: "已审核", bg: `${S.success}14`, color: S.success },
  pending:  { label: "待审核", bg: `${S.warning}14`, color: S.warning },
  archived: { label: "已废弃", bg: `${S.error}14`,   color: S.error   },
};

// ── Filter pills config ────────────────────────────────────────────────────
const FILTERS: { key: AssetType | "all"; label: string }[] = [
  { key: "all",   label: "全部"    },
  { key: "text",  label: "文本"    },
  { key: "image", label: "图片"    },
  { key: "audio", label: "音频"    },
  { key: "video", label: "视频"    },
  { key: "ui",    label: "UI模板"  },
];

// ── Statistics are computed dynamically via useMemo from allAssets ─────────

// ── Sort options ─────────────────────────────────────────────────────────
type SortField = "name" | "type" | "status" | "date";
const SORT_OPTIONS: { key: SortField; label: string }[] = [
  { key: "name",   label: "名称" },
  { key: "type",   label: "类型" },
  { key: "status", label: "状态" },
  { key: "date",   label: "日期" },
];

const STATUS_ORDER: Record<AssetStatus, number> = { pending: 0, approved: 1, archived: 2 };

export default function AssetLibraryScreen() {
  const [activeFilter, setActiveFilter] = useState<AssetType | "all">("all");
  const [viewMode, setViewMode] = useState<"grid" | "list" | "dependency">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCard, setActiveCard] = useState<string | null>(null);

  // ── New: sorting state ──
  const [sortBy, setSortBy] = useState<SortField>("date");
  const [sortAsc, setSortAsc] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);

  // ── New: selection mode ──
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // ── New: preview panel ──
  const [previewId, setPreviewId] = useState<string | null>(null);

  // ── New: toast notification ──
  const [toast, setToast] = useState<string | null>(null);

  // ── New: delete confirmation ──
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // ── Cross-filter state ──
  const [filterByCharacter, setFilterByCharacter] = useState<string>("all");
  const [filterByScene, setFilterByScene] = useState<string>("all");
  const [filterByNode, setFilterByNode] = useState<string>("all");

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
      { label: "文本资产", value: txt, color: "#8B5CF6" },
      { label: "图片资产", value: img, color: "#7C6CF5" },
      { label: "音频资产", value: aud, color: "#00A99D" },
      { label: "视频资产", value: vid, color: "#F59E0B" },
      { label: "UI模板", value: ui, color: "#EF4444" },
    ];
  }, [allAssets]);

  // ── Filter + sort assets ──
  const filteredAssets = useMemo(() => {
    const filtered = allAssets.filter(a => {
      const matchesFilter = activeFilter === "all" || a.type === activeFilter;
      const matchesSearch = !searchQuery || a.name.toLowerCase().includes(searchQuery.toLowerCase());
      // Cross-filters by character/scene/node
      const matchesChar = filterByCharacter === "all" || a.id.startsWith(`char-${filterByCharacter}`);
      const matchesScene = filterByScene === "all" || a.id.startsWith(`scene-${filterByScene}`);
      const matchesNode = filterByNode === "all" || a.id.startsWith(`node-${filterByNode}`) || a.id.includes(filterByNode);
      return matchesFilter && matchesSearch && matchesChar && matchesScene && matchesNode;
    });
    return filtered.sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case "name":   cmp = a.name.localeCompare(b.name, "zh-CN"); break;
        case "type":   cmp = a.type.localeCompare(b.type); break;
        case "status": cmp = STATUS_ORDER[a.status] - STATUS_ORDER[b.status]; break;
        case "date":   cmp = a.date.localeCompare(b.date); break;
      }
      return sortAsc ? cmp : -cmp;
    });
  }, [allAssets, activeFilter, searchQuery, sortBy, sortAsc]);

  // ── Dependency grouping (group assets by source node prefix) ──
  const dependencyGroups = useMemo(() => {
    const groups: Record<string, { label: string; assets: Asset[] }> = {};
    filteredAssets.forEach(asset => {
      let groupKey = "other";
      let groupLabel = "其他资产";
      if (asset.id.startsWith("char-"))   { groupKey = "characters"; groupLabel = "角色 (Characters)"; }
      else if (asset.id.startsWith("scene-"))  { groupKey = "scenes";     groupLabel = "场景 (Scenes)"; }
      else if (asset.id.startsWith("prop-"))   { groupKey = "props";      groupLabel = "道具 (Props)"; }
      else if (asset.id.startsWith("req-"))    { groupKey = "requirements"; groupLabel = "需求节点 (Requirements)"; }
      else if (asset.id.startsWith("script-")) { groupKey = "scripts";    groupLabel = "剧本 (Scripts)"; }
      else if (asset.id.startsWith("node-"))   { groupKey = "storyNodes"; groupLabel = "故事节点 (Story Nodes)"; }
      else if (asset.id.startsWith("a"))       { groupKey = "seed";       groupLabel = "种子资产 (Seed)"; }
      if (!groups[groupKey]) groups[groupKey] = { label: groupLabel, assets: [] };
      groups[groupKey].assets.push(asset);
    });
    return groups;
  }, [filteredAssets]);

  // ── Dynamic storage calculation ──
  const storageUsedMB = useMemo(() => +(allAssets.length * 2.5).toFixed(1), [allAssets]);
  const storageTotalMB = 500;
  const storagePercent = Math.round((storageUsedMB / storageTotalMB) * 100);

  // ── Selection helpers ──
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(filteredAssets.map(a => a.id)));
  }, [filteredAssets]);

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const exitSelectionMode = useCallback(() => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  }, []);

  // ── Toast helper ──
  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }, []);

  // ── Delete handler ──
  const handleDelete = useCallback((id: string) => {
    setSelectedIds(prev => { const n = new Set(prev); n.delete(id); return n; });
    setDeleteConfirmId(null);
    showToast("资产已删除");
  }, [showToast]);

  // ── Bulk delete handler ──
  const handleBulkDelete = useCallback(() => {
    const count = selectedIds.size;
    setSelectedIds(new Set());
    setSelectionMode(false);
    showToast(`已删除 ${count} 个资产`);
  }, [selectedIds, showToast]);

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
            <motion.button whileTap={{ scale: 0.97 }}
              onClick={() => setViewMode("dependency")}
              className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-bold focus:outline-none"
              style={{
                background: viewMode === "dependency" ? S.primary : S.s2,
                color: viewMode === "dependency" ? "#fff" : S.text3,
              }}>
              <Layers size={10} /> 依赖
            </motion.button>
          </div>

          {/* Sort dropdown */}
          <div className="relative shrink-0">
            <motion.button whileTap={{ scale: 0.97 }}
              onClick={() => setShowSortMenu(v => !v)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold focus:outline-none"
              style={{ background: S.s2, border: `1px solid ${S.border}`, color: S.text2 }}>
              <ArrowUpDown size={10} />
              {SORT_OPTIONS.find(o => o.key === sortBy)?.label}
              {sortAsc ? " ↑" : " ↓"}
            </motion.button>
            <AnimatePresence>
              {showSortMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="absolute right-0 top-full mt-1 z-50 rounded-xl overflow-hidden"
                  style={{ background: S.card, border: `1px solid ${S.border}`, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", minWidth: 120 }}>
                  {SORT_OPTIONS.map(opt => (
                    <motion.button key={opt.key} whileTap={{ scale: 0.97 }}
                      onClick={() => {
                        if (sortBy === opt.key) setSortAsc(v => !v);
                        else { setSortBy(opt.key); setSortAsc(true); }
                        setShowSortMenu(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 text-[10px] font-bold focus:outline-none hover:bg-opacity-80 transition-colors"
                      style={{
                        background: sortBy === opt.key ? `${S.primary}14` : "transparent",
                        color: sortBy === opt.key ? S.primary : S.text2,
                      }}>
                      <span>{opt.label}</span>
                      {sortBy === opt.key && (
                        <span style={{ color: S.primary }}>{sortAsc ? "↑" : "↓"}</span>
                      )}
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Selection mode toggle */}
          <motion.button whileTap={{ scale: 0.97 }}
            onClick={() => {
              setSelectionMode(v => !v);
              if (selectionMode) { setSelectedIds(new Set()); }
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold shrink-0 focus:outline-none"
            style={{
              background: selectionMode ? S.accent : S.s2,
              color: selectionMode ? "#fff" : S.text2,
              border: `1px solid ${selectionMode ? S.accent : S.border}`,
            }}>
            <CheckSquare size={10} /> 选择
          </motion.button>

          {/* Import button */}
          <motion.button whileTap={{ scale: 0.97 }}
            onClick={() => showToast("导入功能即将上线")}
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

          {/* Cross-filter dropdowns */}
          <div className="flex items-center gap-1.5">
            <select value={filterByCharacter} onChange={e => setFilterByCharacter(e.target.value)}
              className="text-[9px] px-2 py-1 rounded-lg font-bold focus:outline-none cursor-pointer"
              style={{ background: filterByCharacter !== "all" ? `${S.accent}12` : S.s2, color: filterByCharacter !== "all" ? S.accent : S.text3, border: `1px solid ${filterByCharacter !== "all" ? `${S.accent}30` : S.border}` }}>
              <option value="all">全部角色</option>
              {gameCharacters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select value={filterByScene} onChange={e => setFilterByScene(e.target.value)}
              className="text-[9px] px-2 py-1 rounded-lg font-bold focus:outline-none cursor-pointer"
              style={{ background: filterByScene !== "all" ? `${S.primary}12` : S.s2, color: filterByScene !== "all" ? S.primary : S.text3, border: `1px solid ${filterByScene !== "all" ? `${S.primary}30` : S.border}` }}>
              <option value="all">全部场景</option>
              {gameScenes.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <select value={filterByNode} onChange={e => setFilterByNode(e.target.value)}
              className="text-[9px] px-2 py-1 rounded-lg font-bold focus:outline-none cursor-pointer"
              style={{ background: filterByNode !== "all" ? `${S.warning}12` : S.s2, color: filterByNode !== "all" ? S.warning : S.text3, border: `1px solid ${filterByNode !== "all" ? `${S.warning}30` : S.border}` }}>
              <option value="all">全部节点</option>
              {storyNodes.slice(0, 20).map(n => <option key={n.id} value={n.id}>{n.label}</option>)}
            </select>
            {(filterByCharacter !== "all" || filterByScene !== "all" || filterByNode !== "all") && (
              <motion.button whileTap={{ scale: 0.95 }}
                onClick={() => { setFilterByCharacter("all"); setFilterByScene("all"); setFilterByNode("all"); }}
                className="text-[8px] px-1.5 py-0.5 rounded font-bold focus:outline-none"
                style={{ color: S.error, background: `${S.error}10` }}>
                清除筛选
              </motion.button>
            )}
          </div>

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
              {storageUsedMB} MB / {storageTotalMB} MB
            </span>
          </div>
        </div>
      </div>

      {/* ── Main content area ── */}
      <div className="flex-1 overflow-y-auto p-4">

        {/* ── Selection mode header ── */}
        <AnimatePresence>
          {selectionMode && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex items-center justify-between mb-3 px-3 py-2 rounded-xl"
              style={{ background: `${S.accent}0A`, border: `1px solid ${S.accent}30` }}>
              <div className="flex items-center gap-2">
                <CheckSquare size={12} style={{ color: S.accent }} />
                <span className="text-[10px] font-bold" style={{ color: S.accent }}>
                  选择模式 · 已选 {selectedIds.size} 项
                </span>
              </div>
              <div className="flex items-center gap-2">
                <motion.button whileTap={{ scale: 0.96 }}
                  onClick={selectAll}
                  className="text-[9px] font-bold px-2 py-1 rounded-lg focus:outline-none"
                  style={{ background: `${S.accent}18`, color: S.accent }}>
                  全选
                </motion.button>
                <motion.button whileTap={{ scale: 0.96 }}
                  onClick={deselectAll}
                  className="text-[9px] font-bold px-2 py-1 rounded-lg focus:outline-none"
                  style={{ background: S.s2, color: S.text3 }}>
                  取消全选
                </motion.button>
                <motion.button whileTap={{ scale: 0.96 }}
                  onClick={exitSelectionMode}
                  className="text-[9px] font-bold px-2 py-1 rounded-lg focus:outline-none"
                  style={{ background: S.s2, color: S.text3 }}>
                  退出
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Grid view ── */}
        {viewMode === "grid" && (
          <div className="grid grid-cols-3 gap-3">
            {filteredAssets.map(asset => {
              const typeConf = TYPE_CONFIG[asset.type];
              const statusConf = STATUS_CONFIG[asset.status];
              const TypeIcon = typeConf.icon;
              const isActive = activeCard === asset.id;
              const isSelected = selectedIds.has(asset.id);
              const isPreview = previewId === asset.id;
              const isDeleteConfirm = deleteConfirmId === asset.id;
              return (
                <div key={asset.id}>
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileTap={{ scale: 0.985 }}
                    onClick={() => {
                      if (selectionMode) { toggleSelect(asset.id); }
                      else { setActiveCard(isActive ? null : asset.id); }
                    }}
                    className="rounded-xl overflow-hidden cursor-pointer transition-all"
                    style={{
                      background: S.card,
                      border: `1px solid ${isSelected ? S.accent : isActive ? S.primary : S.border}`,
                      boxShadow: isSelected ? `0 0 0 2px ${S.accent}28` : isActive ? `0 0 0 2px ${S.primary}28` : "none",
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
                      {/* Selection checkbox */}
                      <AnimatePresence>
                        {selectionMode && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.5 }}
                            className="absolute top-2 right-2 w-5 h-5 rounded-md flex items-center justify-center"
                            style={{
                              background: isSelected ? S.accent : "rgba(255,255,255,0.85)",
                              border: isSelected ? "none" : `1.5px solid ${S.border}`,
                            }}>
                            {isSelected && <Check size={10} color="#fff" strokeWidth={3} />}
                          </motion.div>
                        )}
                      </AnimatePresence>
                      {/* Hover overlay actions */}
                      <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 hover:opacity-100 transition-opacity"
                        style={{ background: "rgba(26,29,46,0.55)" }}>
                        <motion.button whileTap={{ scale: 0.9 }}
                          onClick={e => { e.stopPropagation(); setPreviewId(isPreview ? null : asset.id); }}
                          className="w-7 h-7 rounded-lg flex items-center justify-center"
                          style={{ background: "rgba(255,255,255,0.2)" }}>
                          <Eye size={12} color="#fff" />
                        </motion.button>
                        <motion.button whileTap={{ scale: 0.9 }}
                          onClick={e => { e.stopPropagation(); showToast("导入功能即将上线"); }}
                          className="w-7 h-7 rounded-lg flex items-center justify-center"
                          style={{ background: "rgba(255,255,255,0.2)" }}>
                          <Download size={12} color="#fff" />
                        </motion.button>
                        <motion.button whileTap={{ scale: 0.9 }}
                          onClick={e => { e.stopPropagation(); setDeleteConfirmId(isDeleteConfirm ? null : asset.id); }}
                          className="w-7 h-7 rounded-lg flex items-center justify-center"
                          style={{ background: "rgba(255,255,255,0.2)" }}>
                          <Trash2 size={12} color="#fff" />
                        </motion.button>
                        <motion.button whileTap={{ scale: 0.9 }}
                          onClick={e => e.stopPropagation()}
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

                  {/* Delete confirmation */}
                  <AnimatePresence>
                    {isDeleteConfirm && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-1 p-2 rounded-lg overflow-hidden"
                        style={{ background: `${S.error}0A`, border: `1px solid ${S.error}30` }}>
                        <p className="text-[9px] font-bold mb-1.5" style={{ color: S.error }}>确认删除此资产？</p>
                        <div className="flex gap-1.5">
                          <motion.button whileTap={{ scale: 0.95 }}
                            onClick={() => handleDelete(asset.id)}
                            className="px-2 py-1 rounded text-[8px] font-bold text-white"
                            style={{ background: S.error }}>
                            删除
                          </motion.button>
                          <motion.button whileTap={{ scale: 0.95 }}
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-2 py-1 rounded text-[8px] font-bold"
                            style={{ background: S.s2, color: S.text3 }}>
                            取消
                          </motion.button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Preview detail panel */}
                  <AnimatePresence>
                    {isPreview && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-1 p-2.5 rounded-lg overflow-hidden"
                        style={{ background: S.s2, border: `1px solid ${S.border}` }}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[9px] font-bold" style={{ color: S.text }}>资产详情</span>
                          <motion.button whileTap={{ scale: 0.9 }}
                            onClick={() => setPreviewId(null)}
                            className="w-4 h-4 rounded flex items-center justify-center"
                            style={{ background: S.border }}>
                            <X size={8} style={{ color: S.text3 }} />
                          </motion.button>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span className="text-[8px]" style={{ color: S.text3 }}>名称</span>
                            <span className="text-[8px] font-bold" style={{ color: S.text }}>{asset.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[8px]" style={{ color: S.text3 }}>类型</span>
                            <span className="text-[8px] font-bold" style={{ color: typeConf.color }}>{typeConf.label}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[8px]" style={{ color: S.text3 }}>状态</span>
                            <span className="text-[8px] font-bold" style={{ color: statusConf.color }}>{statusConf.label}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[8px]" style={{ color: S.text3 }}>大小</span>
                            <span className="text-[8px] font-mono" style={{ color: S.text2 }}>{asset.size}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[8px]" style={{ color: S.text3 }}>日期</span>
                            <span className="text-[8px] font-mono" style={{ color: S.text2 }}>{asset.date}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[8px]" style={{ color: S.text3 }}>ID</span>
                            <span className="text-[8px] font-mono" style={{ color: S.text3 }}>{asset.id}</span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}

        {/* ── List view ── */}
        {viewMode === "list" && (
          <div className="space-y-1.5">
            {filteredAssets.map(asset => {
              const typeConf = TYPE_CONFIG[asset.type];
              const statusConf = STATUS_CONFIG[asset.status];
              const TypeIcon = typeConf.icon;
              const isActive = activeCard === asset.id;
              const isSelected = selectedIds.has(asset.id);
              const isPreview = previewId === asset.id;
              const isDeleteConfirm = deleteConfirmId === asset.id;
              return (
                <div key={asset.id}>
                  <motion.div
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    whileTap={{ scale: 0.995 }}
                    onClick={() => {
                      if (selectionMode) { toggleSelect(asset.id); }
                      else { setActiveCard(isActive ? null : asset.id); }
                    }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all"
                    style={{
                      background: S.card,
                      border: `1px solid ${isSelected ? S.accent : isActive ? S.primary : S.border}`,
                      boxShadow: isSelected ? `0 0 0 2px ${S.accent}28` : isActive ? `0 0 0 2px ${S.primary}28` : "none",
                    }}>
                    {/* Selection checkbox */}
                    <AnimatePresence>
                      {selectionMode && (
                        <motion.div
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: 20 }}
                          exit={{ opacity: 0, width: 0 }}
                          className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 overflow-hidden"
                          style={{
                            background: isSelected ? S.accent : "transparent",
                            border: isSelected ? "none" : `1.5px solid ${S.border}`,
                          }}>
                          {isSelected && <Check size={10} color="#fff" strokeWidth={3} />}
                        </motion.div>
                      )}
                    </AnimatePresence>
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
                        onClick={e => { e.stopPropagation(); setPreviewId(isPreview ? null : asset.id); }}
                        className="w-6 h-6 rounded flex items-center justify-center"
                        style={{ background: isPreview ? `${S.primary}18` : S.s2 }}>
                        <Eye size={10} style={{ color: isPreview ? S.primary : S.text3 }} />
                      </motion.button>
                      <motion.button whileTap={{ scale: 0.9 }}
                        onClick={e => { e.stopPropagation(); showToast("导入功能即将上线"); }}
                        className="w-6 h-6 rounded flex items-center justify-center"
                        style={{ background: S.s2 }}>
                        <Download size={10} style={{ color: S.text3 }} />
                      </motion.button>
                      <motion.button whileTap={{ scale: 0.9 }}
                        onClick={e => { e.stopPropagation(); setDeleteConfirmId(isDeleteConfirm ? null : asset.id); }}
                        className="w-6 h-6 rounded flex items-center justify-center"
                        style={{ background: isDeleteConfirm ? `${S.error}18` : S.s2 }}>
                        <Trash2 size={10} style={{ color: isDeleteConfirm ? S.error : S.text3 }} />
                      </motion.button>
                    </div>
                  </motion.div>

                  {/* Inline delete confirmation (list) */}
                  <AnimatePresence>
                    {isDeleteConfirm && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-1 ml-11 p-2 rounded-lg overflow-hidden"
                        style={{ background: `${S.error}0A`, border: `1px solid ${S.error}30` }}>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-bold" style={{ color: S.error }}>确认删除此资产？</span>
                          <motion.button whileTap={{ scale: 0.95 }}
                            onClick={() => handleDelete(asset.id)}
                            className="px-2 py-1 rounded text-[8px] font-bold text-white"
                            style={{ background: S.error }}>
                            删除
                          </motion.button>
                          <motion.button whileTap={{ scale: 0.95 }}
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-2 py-1 rounded text-[8px] font-bold"
                            style={{ background: S.s2, color: S.text3 }}>
                            取消
                          </motion.button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Inline preview panel (list) */}
                  <AnimatePresence>
                    {isPreview && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-1 ml-11 p-2.5 rounded-lg overflow-hidden"
                        style={{ background: S.s2, border: `1px solid ${S.border}` }}>
                        <div className="flex items-center gap-4">
                          <div className="flex gap-3">
                            <div className="flex items-center gap-1">
                              <span className="text-[8px]" style={{ color: S.text3 }}>类型</span>
                              <span className="text-[8px] font-bold" style={{ color: typeConf.color }}>{typeConf.label}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-[8px]" style={{ color: S.text3 }}>状态</span>
                              <span className="text-[8px] font-bold" style={{ color: statusConf.color }}>{statusConf.label}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-[8px]" style={{ color: S.text3 }}>大小</span>
                              <span className="text-[8px] font-mono" style={{ color: S.text2 }}>{asset.size}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-[8px]" style={{ color: S.text3 }}>日期</span>
                              <span className="text-[8px] font-mono" style={{ color: S.text2 }}>{asset.date}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-[8px]" style={{ color: S.text3 }}>ID</span>
                              <span className="text-[8px] font-mono" style={{ color: S.text3 }}>{asset.id}</span>
                            </div>
                          </div>
                          <motion.button whileTap={{ scale: 0.9 }}
                            onClick={() => setPreviewId(null)}
                            className="ml-auto w-4 h-4 rounded flex items-center justify-center shrink-0"
                            style={{ background: S.border }}>
                            <X size={8} style={{ color: S.text3 }} />
                          </motion.button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Dependency view ── */}
        {viewMode === "dependency" && (
          <div className="space-y-4">
            {Object.entries(dependencyGroups).map(([groupKey, group]) => (
              <motion.div key={groupKey}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl overflow-hidden"
                style={{ background: S.card, border: `1px solid ${S.border}` }}>
                {/* Group header */}
                <div className="flex items-center gap-2 px-3 py-2.5"
                  style={{ background: S.s2, borderBottom: `1px solid ${S.border}` }}>
                  <Layers size={12} style={{ color: S.primary }} />
                  <span className="text-[10px] font-bold" style={{ color: S.text }}>{group.label}</span>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                    style={{ background: `${S.primary}14`, color: S.primary }}>
                    {group.assets.length} 个资产
                  </span>
                </div>
                {/* Group assets */}
                <div className="divide-y" style={{ borderColor: S.border }}>
                  {group.assets.map(asset => {
                    const typeConf = TYPE_CONFIG[asset.type];
                    const statusConf = STATUS_CONFIG[asset.status];
                    const TypeIcon = typeConf.icon;
                    return (
                      <div key={asset.id}
                        className="flex items-center gap-3 px-3 py-2 hover:bg-opacity-50 transition-colors"
                        style={{ borderColor: S.border }}>
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: `${typeConf.color}14` }}>
                          <TypeIcon size={13} style={{ color: typeConf.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-bold truncate" style={{ color: S.text }}>{asset.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[8px] px-1.5 py-0.5 rounded font-bold"
                              style={{ background: statusConf.bg, color: statusConf.color }}>
                              {statusConf.label}
                            </span>
                            <span className="text-[8px]" style={{ color: S.text3 }}>{asset.size}</span>
                          </div>
                        </div>
                        {/* Reference info */}
                        <div className="shrink-0 flex items-center gap-1">
                          <Share2 size={9} style={{ color: S.text3 }} />
                          <span className="text-[8px]" style={{ color: S.text3 }}>
                            {group.label.split(" ")[0]}
                          </span>
                        </div>
                        <span className="text-[8px] font-mono shrink-0" style={{ color: S.text3 }}>{asset.date}</span>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* ── Floating bulk action bar (when items selected) ── */}
      <AnimatePresence>
        {selectionMode && selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            className="shrink-0 flex items-center justify-between px-4 py-2.5"
            style={{ background: `${S.accent}`, boxShadow: `0 -4px 16px ${S.accent}40` }}>
            <span className="text-xs font-bold text-white">已选 {selectedIds.size} 项</span>
            <div className="flex items-center gap-2">
              <motion.button whileTap={{ scale: 0.96 }}
                onClick={() => { showToast(`已批量审核 ${selectedIds.size} 个资产`); exitSelectionMode(); }}
                className="px-3 py-1.5 rounded-lg text-[10px] font-bold focus:outline-none"
                style={{ background: "rgba(255,255,255,0.2)", color: "#fff" }}>
                <Check size={10} className="inline mr-1" /> 批量审核
              </motion.button>
              <motion.button whileTap={{ scale: 0.96 }}
                onClick={() => { showToast(`已导出 ${selectedIds.size} 个资产`); exitSelectionMode(); }}
                className="px-3 py-1.5 rounded-lg text-[10px] font-bold focus:outline-none"
                style={{ background: "rgba(255,255,255,0.2)", color: "#fff" }}>
                <Download size={10} className="inline mr-1" /> 批量导出
              </motion.button>
              <motion.button whileTap={{ scale: 0.96 }}
                onClick={() => { handleBulkDelete(); }}
                className="px-3 py-1.5 rounded-lg text-[10px] font-bold focus:outline-none"
                style={{ background: S.error, color: "#fff" }}>
                <Trash2 size={10} className="inline mr-1" /> 批量删除
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Bottom pagination bar ── */}
      <div className="shrink-0 flex items-center justify-between px-4 py-2.5"
        style={{ background: S.card, borderTop: `1px solid ${S.border}` }}>
        <span className="text-[10px]" style={{ color: S.text3 }}>
          显示 {filteredAssets.length > 0 ? 1 : 0}-{filteredAssets.length} / 共 {allAssets.length} 个资产
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
