import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, Info } from "lucide-react";
import type { CharacterOutfit, WardrobeSlot, OutfitPiece, VisualAnchor } from "@/lib/types/wardrobe";

// ── Design tokens ───────────────────────────────────────────────────────
const S = {
  bg: "#FAFBFF", card: "#FFFFFF", s2: "#F4F6FC", s3: "#EDF0F8",
  border: "#E2E5F0", border2: "#CBD0E5",
  primary: "#5E50E8", primary10: "rgba(94,80,232,0.10)",
  accent: "#00A99D", accent10: "rgba(0,169,157,0.10)",
  text: "#1A1D2E", text2: "#4A5068", text3: "#8892B0",
  warning: "#D97706", warning10: "rgba(217,119,6,0.10)",
};

const SLOT_COLORS: Record<string, string> = {
  hair: "#E879F9",
  face: "#F472B6",
  top: "#60A5FA",
  bottom: "#34D399",
  shoes: "#FBBF24",
  accessory: "#A78BFA",
  special: "#F97316",
};

// ── Props ───────────────────────────────────────────────────────────────
interface OutfitPreviewCanvasProps {
  outfit: CharacterOutfit;
  slots: WardrobeSlot[];
  pieces: OutfitPiece[];
  anchors: VisualAnchor[];
}

// ── Component ───────────────────────────────────────────────────────────
export function OutfitPreviewCanvas({ outfit, slots, pieces, anchors }: OutfitPreviewCanvasProps) {
  const [hiddenLayers, setHiddenLayers] = useState<Set<string>>(new Set());
  const [hoveredSlot, setHoveredSlot] = useState<string | null>(null);

  // Build sorted layers
  const layers = useMemo(() => {
    return slots
      .map(slot => {
        const pieceId = outfit.pieces[slot.id];
        const piece = pieces.find(p => p.id === pieceId);
        return { slot, piece };
      })
      .filter((_entry): _entry is { slot: WardrobeSlot; piece: OutfitPiece | undefined } => true)
      .sort((a, b) => a.slot.zOrder - b.slot.zOrder);
  }, [outfit, slots, pieces]);

  const toggleLayer = (slotId: string) => {
    setHiddenLayers(prev => {
      const next = new Set(prev);
      if (next.has(slotId)) next.delete(slotId);
      else next.add(slotId);
      return next;
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-4">

      {/* ── Preview area ────────────────────────────────────────────── */}
      <div className="relative rounded-xl overflow-hidden" style={{
        background: `linear-gradient(135deg, ${S.s2}, ${S.s3})`,
        border: `1px solid ${S.border}`,
        minHeight: 320,
      }}>
        {/* Checkerboard pattern (transparent background indicator) */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `repeating-conic-gradient(#000 0% 25%, transparent 0% 50%)`,
          backgroundSize: "16px 16px",
        }} />

        {/* Layered outfit rendering */}
        <div className="relative w-full h-full flex items-center justify-center p-6">
          <div className="relative" style={{ width: 200, height: 280 }}>
            {layers.map(({ slot, piece }) => {
              const isHidden = hiddenLayers.has(slot.id);
              const isHovered = hoveredSlot === slot.id;
              const color = SLOT_COLORS[slot.category] ?? S.text3;

              return (
                <motion.div
                  key={slot.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{
                    opacity: isHidden ? 0.1 : isHovered ? 1 : 0.85,
                    scale: isHovered ? 1.02 : 1,
                  }}
                  transition={{ duration: 0.2 }}
                  className="absolute inset-0 flex items-center justify-center"
                  style={{ zIndex: slot.zOrder }}
                >
                  {/* Layer representation */}
                  <div className="relative w-full h-full rounded-xl flex items-center justify-center" style={{
                    background: `${color}12`,
                    border: `${isHovered ? 2 : 1}px solid ${isHovered ? color : `${color}40`}`,
                    boxShadow: isHovered ? `0 0 20px ${color}25` : "none",
                  }}>
                    {/* Slot label */}
                    <div className="absolute top-2 left-2 flex items-center gap-1">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                      <span className="text-[8px] font-bold" style={{ color }}>{slot.name}</span>
                    </div>

                    {/* Piece info */}
                    {piece && !isHidden && (
                      <div className="text-center px-4">
                        <p className="text-[11px] font-bold mb-1" style={{ color: S.text }}>
                          {piece.name}
                        </p>
                        <p className="text-[8px] leading-relaxed" style={{ color: S.text3 }}>
                          {piece.visualPrompt.slice(0, 60)}...
                        </p>
                        {piece.imageUrl && (
                          <div className="mt-2 w-16 h-16 rounded-lg mx-auto overflow-hidden" style={{ border: `1px solid ${S.border}` }}>
                            <img src={piece.imageUrl} alt={piece.name} className="w-full h-full object-cover" />
                          </div>
                        )}
                      </div>
                    )}
                    {!piece && !isHidden && (
                      <span className="text-[8px] italic" style={{ color: S.text3 }}>空</span>
                    )}
                  </div>
                </motion.div>
              );
            })}

            {/* Center silhouette placeholder */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 0 }}>
              <div className="w-24 h-40 rounded-full opacity-[0.04]" style={{ background: S.text }} />
            </div>
          </div>
        </div>

        {/* Bottom info bar */}
        <div className="absolute bottom-0 left-0 right-0 px-4 py-2 flex items-center justify-between"
          style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(8px)", borderTop: `1px solid ${S.border}` }}>
          <span className="text-[8px]" style={{ color: S.text3 }}>
            {outfit.name} · {Object.keys(outfit.pieces).length} 件单品 · {layers.length} 层
          </span>
          <span className="text-[8px] flex items-center gap-1" style={{ color: S.text3 }}>
            <Info size={9} /> 点击右侧图层控制可见性
          </span>
        </div>
      </div>

      {/* ── Layer panel ─────────────────────────────────────────────── */}
      <div className="rounded-xl p-3 space-y-1.5" style={{ background: S.s2, border: `1px solid ${S.border}` }}>
        <p className="text-[9px] font-bold mb-2 flex items-center gap-1.5" style={{ color: S.text }}>
          图层面板
          <span className="text-[8px] font-mono px-1 py-0.5 rounded" style={{ background: S.primary10, color: S.primary }}>
            {layers.length}
          </span>
        </p>

        {/* Layers sorted by z-order (top first) */}
        {[...layers].reverse().map(({ slot, piece }) => {
          const isHidden = hiddenLayers.has(slot.id);
          const isHovered = hoveredSlot === slot.id;
          const color = SLOT_COLORS[slot.category] ?? S.text3;

          return (
            <motion.div
              key={slot.id}
              onHoverStart={() => setHoveredSlot(slot.id)}
              onHoverEnd={() => setHoveredSlot(null)}
              className="flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors"
              style={{
                background: isHovered ? `${color}10` : "transparent",
                border: `1px solid ${isHovered ? `${color}30` : "transparent"}`,
              }}
            >
              {/* Visibility toggle */}
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={() => toggleLayer(slot.id)}
                className="shrink-0 focus:outline-none"
              >
                {isHidden
                  ? <EyeOff size={12} style={{ color: S.text3 }} />
                  : <Eye size={12} style={{ color }} />
                }
              </motion.button>

              {/* Color dot */}
              <div className="w-2 h-2 rounded-full shrink-0" style={{ background: color, opacity: isHidden ? 0.3 : 1 }} />

              {/* Slot + piece name */}
              <div className="flex-1 min-w-0">
                <p className="text-[8px] font-bold truncate" style={{ color: isHidden ? S.text3 : S.text }}>
                  {slot.name}
                </p>
                <p className="text-[7px] truncate" style={{ color: S.text3 }}>
                  {piece?.name ?? "—"}
                </p>
              </div>

              {/* Z-order label */}
              <span className="text-[7px] font-mono shrink-0" style={{ color: S.text3 }}>
                z{slot.zOrder}
              </span>
            </motion.div>
          );
        })}

        {/* Visual anchors summary */}
        {anchors.length > 0 && (
          <div className="mt-3 pt-2" style={{ borderTop: `1px solid ${S.border}` }}>
            <p className="text-[8px] font-bold mb-1.5 flex items-center gap-1" style={{ color: S.text2 }}>
              视觉锚点
              <span className="text-[7px] font-mono px-1 py-0.5 rounded" style={{ background: S.warning10, color: S.warning }}>
                {anchors.filter(a => a.mustMaintain).length}
              </span>
            </p>
            {anchors.filter(a => a.mustMaintain).map(anchor => (
              <div key={anchor.id} className="flex items-center gap-1 mb-1">
                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: S.warning }} />
                <span className="text-[7px] truncate" style={{ color: S.text3 }}>{anchor.description}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
