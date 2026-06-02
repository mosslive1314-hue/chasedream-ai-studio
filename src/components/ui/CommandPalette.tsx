"use client";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Network, Users, FileText, Activity,
  Package, ArrowRight, X, Command,
} from "lucide-react";
import { useNarrativeStore, useUIStore } from "@/store";

const S = {
  bg: "#FFFFFF", card: "#FFFFFF", s2: "#F4F6FC", s3: "#EDF0F8",
  border: "#E2E5F0", border2: "#CBD0E5",
  primary: "#5E50E8", primary10: "rgba(94,80,232,0.10)",
  text: "#1A1D2E", text2: "#4A5068", text3: "#8892B0",
  accent: "#00A99D",
};

interface SearchItem {
  id: string;
  type: "node" | "character" | "scene" | "asset" | "quality" | "variable";
  label: string;
  detail: string;
  href: string;
  icon: typeof Network;
}

const TYPE_CFG: Record<string, { icon: typeof Network; color: string; label: string }> = {
  node:      { icon: Network,   color: S.primary, label: "节点" },
  character: { icon: Users,     color: "#059669", label: "角色" },
  scene:     { icon: FileText,  color: "#D97706", label: "场景" },
  asset:     { icon: Package,   color: S.accent,  label: "资产" },
  quality:   { icon: Activity,  color: "#DC2626", label: "质检" },
  variable:  { icon: FileText,  color: S.text2,   label: "变量" },
};

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Store data
  const storyNodes = useNarrativeStore(s => s.storyNodes);
  const characters = useNarrativeStore(s => s.characters);
  const scenes = useNarrativeStore(s => s.scenes);
  const assetCards = useNarrativeStore(s => s.assetCards);
  const qualityChecks = useNarrativeStore(s => s.qualityChecks);
  const variables = useNarrativeStore(s => s.variables);
  const selectedNodeId = useUIStore(s => s.selectedNodeId);
  const setSelectedNodeId = useUIStore(s => s.setSelectedNodeId);

  // Build search index
  const allItems = useMemo<SearchItem[]>(() => {
    const items: SearchItem[] = [];
    storyNodes.forEach(n => items.push({
      id: `node-${n.id}`, type: "node", label: n.label || n.id,
      detail: `${n.type} · ${n.id}`, href: "/nodes", icon: Network,
    }));
    characters.forEach(c => items.push({
      id: `char-${c.id}`, type: "character", label: c.name,
      detail: `${c.role || '角色'} · ${c.description?.slice(0, 30) ?? ''}`, href: "/nodes", icon: Users,
    }));
    scenes.forEach(s => items.push({
      id: `scene-${s.id}`, type: "scene", label: s.name || s.id,
      detail: `${s.location} · ${s.atmosphere}`, href: "/nodes", icon: FileText,
    }));
    assetCards.forEach(a => items.push({
      id: `asset-${a.nodeId}`, type: "asset", label: a.nodeLabel || a.nodeId,
      detail: `节点资产 · ${a.nodeId}`, href: "/assets", icon: Package,
    }));
    qualityChecks.forEach(q => items.push({
      id: `qc-${q.id}`, type: "quality", label: q.label,
      detail: `${q.status} · ${q.categoryLabel}`, href: "/overview", icon: Activity,
    }));
    variables.forEach(v => items.push({
      id: `var-${v.id}`, type: "variable", label: v.name || v.id,
      detail: `${v.label} · 初始值: ${v.initialValue}`, href: "/interaction", icon: FileText,
    }));
    return items;
  }, [storyNodes, characters, scenes, assetCards, qualityChecks, variables]);

  // Filter by query
  const filtered = useMemo(() => {
    if (!query.trim()) return allItems.slice(0, 12);
    const q = query.toLowerCase();
    return allItems
      .filter(item =>
        item.label.toLowerCase().includes(q) ||
        item.detail.toLowerCase().includes(q) ||
        item.type.includes(q)
      )
      .slice(0, 12);
  }, [query, allItems]);

  // Navigate to item
  const navigateTo = useCallback((item: SearchItem) => {
    setOpen(false);
    setQuery("");
    if (item.type === "node") {
      setSelectedNodeId(item.id.replace("node-", ""));
    }
    router.push(item.href);
  }, [router, setSelectedNodeId]);

  // Cmd+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(prev => !prev);
      }
      if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Reset selected index when filtered results change
  useEffect(() => {
    setSelectedIdx(0);
  }, [filtered.length]);

  // Keyboard navigation within results
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIdx(i => Math.min(i + 1, filtered.length - 1));
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIdx(i => Math.max(i - 1, 0));
    }
    if (e.key === 'Enter' && filtered[selectedIdx]) {
      e.preventDefault();
      navigateTo(filtered[selectedIdx]);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[100] bg-black/30 backdrop-blur-sm"
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="fixed top-[15%] left-1/2 -translate-x-1/2 z-[101] w-[480px] max-w-[92vw] rounded-2xl overflow-hidden shadow-2xl"
            style={{ background: S.bg, border: `1px solid ${S.border}` }}
          >
            {/* Search input */}
            <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: S.border }}>
              <Search size={16} style={{ color: S.text3 }} />
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="搜索节点、角色、场景、资产、质检..."
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-[#8892B0]"
                style={{ color: S.text }}
              />
              <kbd className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                style={{ background: S.s3, color: S.text3, border: `1px solid ${S.border}` }}>
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div className="max-h-[320px] overflow-y-auto p-2">
              {filtered.length === 0 ? (
                <div className="text-center py-8 text-xs" style={{ color: S.text3 }}>
                  未找到匹配项
                </div>
              ) : (
                filtered.map((item, i) => {
                  const cfg = TYPE_CFG[item.type];
                  const Icon = cfg?.icon ?? Search;
                  const isSelected = i === selectedIdx;
                  return (
                    <button
                      key={item.id}
                      onClick={() => navigateTo(item)}
                      onMouseEnter={() => setSelectedIdx(i)}
                      className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors focus:outline-none"
                      style={{
                        background: isSelected ? S.primary10 : 'transparent',
                      }}
                    >
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: `${cfg?.color ?? S.text3}12` }}>
                        <Icon size={13} style={{ color: cfg?.color ?? S.text3 }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold truncate" style={{ color: S.text }}>
                          {item.label}
                        </div>
                        <div className="text-[9px] truncate" style={{ color: S.text3 }}>
                          {item.detail}
                        </div>
                      </div>
                      <span className="text-[8px] font-bold px-1.5 py-0.5 rounded shrink-0"
                        style={{ background: `${cfg?.color ?? S.text3}10`, color: cfg?.color ?? S.text3 }}>
                        {cfg?.label ?? item.type}
                      </span>
                      {isSelected && <ArrowRight size={12} style={{ color: S.primary }} />}
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-4 py-2 border-t"
              style={{ borderColor: S.border, background: S.s2 }}>
              <div className="flex items-center gap-2">
                <kbd className="text-[8px] font-mono px-1 py-0.5 rounded"
                  style={{ background: S.card, color: S.text3, border: `1px solid ${S.border}` }}>↑↓</kbd>
                <span className="text-[8px]" style={{ color: S.text3 }}>导航</span>
                <kbd className="text-[8px] font-mono px-1 py-0.5 rounded"
                  style={{ background: S.card, color: S.text3, border: `1px solid ${S.border}` }}>↵</kbd>
                <span className="text-[8px]" style={{ color: S.text3 }}>选择</span>
              </div>
              <span className="text-[8px]" style={{ color: S.text3 }}>
                {filtered.length} 个结果
              </span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
