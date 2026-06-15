import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Link2, Unlink, Check, Search } from "lucide-react";
import { useNarrativeStore } from "@/store";
import type { CharacterOutfit } from "@/lib/types/wardrobe";

// ── Design tokens ───────────────────────────────────────────────────────
const S = {
  bg: "#FAFBFF", card: "#FFFFFF", s2: "#F4F6FC", s3: "#EDF0F8",
  border: "#E2E5F0", border2: "#CBD0E5",
  primary: "#5E50E8", primary10: "rgba(94,80,232,0.10)", primary20: "rgba(94,80,232,0.20)",
  accent: "#00A99D", accent10: "rgba(0,169,157,0.10)",
  text: "#1A1D2E", text2: "#4A5068", text3: "#8892B0",
  success: "#059669", success10: "rgba(5,150,105,0.10)",
  error: "#DC2626", error10: "rgba(220,38,38,0.10)",
};

// ── Props ───────────────────────────────────────────────────────────────
interface OutfitNodeBinderProps {
  outfit: CharacterOutfit;
  characterId: string;
  onBind: (nodeIds: string[]) => void;
  onUnbind: (nodeIds: string[]) => void;
}

// ── Component ───────────────────────────────────────────────────────────
export function OutfitNodeBinder({ outfit, characterId, onBind, onUnbind }: OutfitNodeBinderProps) {
  const storyNodes = useNarrativeStore(s => s.storyNodes);
  const characters = useNarrativeStore(s => s.characters);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "bound" | "unbound">("all");

  const character = characters.find(c => c.id === characterId);
  const boundNodeIds = useMemo(() => new Set(outfit.sceneApplicability), [outfit.sceneApplicability]);

  // Filter nodes that this character appears in
  const characterNodeIds = useMemo(() => {
    if (!character) return new Set<string>();
    return new Set(character.appearNodes);
  }, [character]);

  // All available nodes (character's appearance nodes + already bound nodes)
  const availableNodes = useMemo(() => {
    const relevantIds = new Set([...characterNodeIds, ...boundNodeIds]);
    return storyNodes
      .filter(n => relevantIds.has(n.id))
      .map(n => ({
        ...n,
        isBound: boundNodeIds.has(n.id),
        isCharacterNode: characterNodeIds.has(n.id),
      }));
  }, [storyNodes, characterNodeIds, boundNodeIds]);

  // Filtered nodes
  const filteredNodes = useMemo(() => {
    let nodes = availableNodes;
    if (filter === "bound") nodes = nodes.filter(n => n.isBound);
    if (filter === "unbound") nodes = nodes.filter(n => !n.isBound);
    if (search.trim()) {
      const q = search.toLowerCase();
      nodes = nodes.filter(n => n.label.toLowerCase().includes(q) || n.id.toLowerCase().includes(q));
    }
    return nodes;
  }, [availableNodes, filter, search]);

  // Batch operations
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelect = (nodeId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(filteredNodes.map(n => n.id)));
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const bindSelected = () => {
    const toBind = [...selectedIds].filter(id => !boundNodeIds.has(id));
    if (toBind.length > 0) onBind(toBind);
    clearSelection();
  };

  const unbindSelected = () => {
    const toUnbind = [...selectedIds].filter(id => boundNodeIds.has(id));
    if (toUnbind.length > 0) onUnbind(toUnbind);
    clearSelection();
  };

  const NODE_TYPE_LABELS: Record<string, string> = {
    start: "起始", scene: "场景", choice: "选择",
    condition: "条件", qte: "QTE", ending_good: "好结局", ending_bad: "坏结局",
  };

  return (
    <div>
      {/* ── Search + Filter bar ─────────────────────────────────────── */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[180px]">
          <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: S.text3 }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="搜索节点名称或 ID..."
            className="w-full pl-7 pr-3 py-1.5 rounded-lg text-[9px] focus:outline-none"
            style={{ background: S.s2, border: `1px solid ${S.border}`, color: S.text }}
          />
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-1">
          {([
            { id: "all" as const, label: "全部", count: availableNodes.length },
            { id: "bound" as const, label: "已绑定", count: availableNodes.filter(n => n.isBound).length },
            { id: "unbound" as const, label: "未绑定", count: availableNodes.filter(n => !n.isBound).length },
          ]).map(tab => (
            <motion.button
              key={tab.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => setFilter(tab.id)}
              className="px-2 py-1 rounded-lg text-[8px] font-bold focus:outline-none"
              style={{
                background: filter === tab.id ? S.primary10 : "transparent",
                color: filter === tab.id ? S.primary : S.text3,
              }}
            >
              {tab.label}
              <span className="ml-0.5 font-mono opacity-70">{tab.count}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* ── Batch actions ───────────────────────────────────────────── */}
      {selectedIds.size > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 mb-3 p-2 rounded-lg"
          style={{ background: S.primary10, border: `1px solid ${S.primary20}` }}
        >
          <span className="text-[9px] font-bold" style={{ color: S.primary }}>
            已选 {selectedIds.size} 项
          </span>
          <motion.button whileTap={{ scale: 0.95 }} onClick={bindSelected}
            className="flex items-center gap-1 px-2 py-0.5 rounded text-[8px] font-bold text-white focus:outline-none"
            style={{ background: S.success }}>
            <Link2 size={9} /> 绑定
          </motion.button>
          <motion.button whileTap={{ scale: 0.95 }} onClick={unbindSelected}
            className="flex items-center gap-1 px-2 py-0.5 rounded text-[8px] font-bold text-white focus:outline-none"
            style={{ background: S.error }}>
            <Unlink size={9} /> 解绑
          </motion.button>
          <motion.button whileTap={{ scale: 0.95 }} onClick={clearSelection}
            className="text-[8px] font-bold focus:outline-none"
            style={{ color: S.text3 }}>
            取消选择
          </motion.button>
        </motion.div>
      )}

      {/* ── Select all ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[8px]" style={{ color: S.text3 }}>
          {character?.name ?? "角色"} 的出场节点 · 共 {filteredNodes.length} 个
        </span>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={selectedIds.size === filteredNodes.length ? clearSelection : selectAll}
          className="text-[8px] font-bold focus:outline-none"
          style={{ color: S.primary }}
        >
          {selectedIds.size === filteredNodes.length ? "取消全选" : "全选"}
        </motion.button>
      </div>

      {/* ── Node list ───────────────────────────────────────────────── */}
      <div className="space-y-1 max-h-[320px] overflow-y-auto pr-1" style={{ scrollbarWidth: "thin" }}>
        {filteredNodes.map(node => {
          const isSelected = selectedIds.has(node.id);
          const typeLabel = NODE_TYPE_LABELS[node.type] ?? node.type;
          return (
            <motion.div
              key={node.id}
              whileHover={{ scale: 1.005 }}
              onClick={() => toggleSelect(node.id)}
              className="flex items-center gap-2 p-2.5 rounded-lg cursor-pointer transition-colors"
              style={{
                background: isSelected ? S.primary10 : node.isBound ? S.accent10 : S.s2,
                border: `1px solid ${isSelected ? S.primary : node.isBound ? `${S.accent}30` : S.border}`,
              }}
            >
              {/* Checkbox */}
              <div className="w-4 h-4 rounded flex items-center justify-center shrink-0" style={{
                background: isSelected ? S.primary : "transparent",
                border: `1.5px solid ${isSelected ? S.primary : S.border2}`,
              }}>
                {isSelected && <Check size={10} style={{ color: "#fff" }} />}
              </div>

              {/* Node info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-bold truncate" style={{ color: S.text }}>{node.label}</span>
                  <span className="text-[7px] px-1 py-0.5 rounded shrink-0" style={{
                    background: node.type === "choice" ? S.primary10 : node.type === "ending_good" ? S.success10 : node.type === "ending_bad" ? S.error10 : S.s3,
                    color: node.type === "choice" ? S.primary : node.type === "ending_good" ? S.success : node.type === "ending_bad" ? S.error : S.text3,
                  }}>
                    {typeLabel}
                  </span>
                </div>
                <span className="text-[7px] font-mono" style={{ color: S.text3 }}>{node.id}</span>
              </div>

              {/* Bound status */}
              {node.isBound && (
                <span className="text-[7px] font-bold px-1.5 py-0.5 rounded shrink-0" style={{ background: S.accent10, color: S.accent }}>
                  已绑定
                </span>
              )}
            </motion.div>
          );
        })}

        {filteredNodes.length === 0 && (
          <div className="flex items-center justify-center py-8">
            <p className="text-[9px]" style={{ color: S.text3 }}>
              {search ? "未找到匹配节点" : "暂无可用节点"}
            </p>
          </div>
        )}
      </div>

      {/* ── Summary ─────────────────────────────────────────────────── */}
      <div className="mt-3 pt-2 flex items-center justify-between" style={{ borderTop: `1px solid ${S.border}` }}>
        <span className="text-[8px]" style={{ color: S.text3 }}>
          造型「{outfit.name}」已绑定 {boundNodeIds.size} 个节点
        </span>
        {boundNodeIds.size > 0 && (
          <div className="flex items-center gap-1 flex-wrap">
            {[...boundNodeIds].slice(0, 5).map(nodeId => {
              const node = storyNodes.find(n => n.id === nodeId);
              return (
                <span key={nodeId} className="text-[7px] px-1 py-0.5 rounded" style={{ background: S.accent10, color: S.accent }}>
                  {node?.label ?? nodeId}
                </span>
              );
            })}
            {boundNodeIds.size > 5 && (
              <span className="text-[7px]" style={{ color: S.text3 }}>+{boundNodeIds.size - 5}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
