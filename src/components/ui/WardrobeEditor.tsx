import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shirt, Star, Check,
  Eye, ChevronDown, ChevronRight, Link2,
} from "lucide-react";
import type {
  CharacterWardrobe, CharacterOutfit,
} from "@/lib/types/wardrobe";
import type { GameCharacter } from "@/lib/types/game";
import { OutfitPreviewCanvas } from "./OutfitPreviewCanvas";
import { OutfitNodeBinder } from "./OutfitNodeBinder";

// ── Design tokens (shared with StoryOverviewScreen) ─────────────────────
const S = {
  bg: "#FAFBFF", card: "#FFFFFF", s2: "#F4F6FC", s3: "#EDF0F8",
  border: "#E2E5F0", border2: "#CBD0E5",
  primary: "#5E50E8", primary10: "rgba(94,80,232,0.10)", primary20: "rgba(94,80,232,0.20)",
  accent: "#00A99D", accent10: "rgba(0,169,157,0.10)",
  text: "#1A1D2E", text2: "#4A5068", text3: "#8892B0",
  success: "#059669", success10: "rgba(5,150,105,0.10)",
  warning: "#D97706", warning10: "rgba(217,119,6,0.10)",
  error: "#DC2626", error10: "rgba(220,38,38,0.10)",
};

const SLOT_CATEGORY_LABELS: Record<string, string> = {
  hair: "发型", face: "面部", top: "上装", bottom: "下装",
  shoes: "鞋子", accessory: "配饰", special: "特殊",
};

// ── Props ───────────────────────────────────────────────────────────────
interface WardrobeEditorProps {
  character: GameCharacter;
  wardrobe?: CharacterWardrobe;
  onAddOutfit?: (characterId: string, outfit: CharacterOutfit) => void;
  onUpdateOutfit?: (characterId: string, outfitId: string, updates: Partial<CharacterOutfit>) => void;
  onRemoveOutfit?: (characterId: string, outfitId: string) => void;
  onSetDefault?: (characterId: string, outfitId: string) => void;
  onBindNodes?: (characterId: string, outfitId: string, nodeIds: string[]) => void;
  onUnbindNodes?: (characterId: string, outfitId: string, nodeIds: string[]) => void;
}

// ── Sub-view types ──────────────────────────────────────────────────────
type SubView = "outfits" | "preview" | "binder";

// ── Component ───────────────────────────────────────────────────────────
export function WardrobeEditor({
  character, wardrobe, _onAddOutfit, _onUpdateOutfit, _onRemoveOutfit,
  onSetDefault, onBindNodes, onUnbindNodes,
}: WardrobeEditorProps) {
  const [selectedOutfitId, setSelectedOutfitId] = useState<string | null>(
    wardrobe?.defaultOutfitId ?? null,
  );
  const [subView, setSubView] = useState<SubView>("outfits");
  const [showAnchors, setShowAnchors] = useState(false);

  const outfits = useMemo(() => wardrobe?.outfits ?? [], [wardrobe]);
  const slots = useMemo(() => wardrobe?.slots ?? [], [wardrobe]);
  const pieces = useMemo(() => wardrobe?.pieces ?? [], [wardrobe]);
  const anchors = useMemo(() => wardrobe?.visualAnchors ?? [], [wardrobe]);

  const selectedOutfit = useMemo(
    () => outfits.find(o => o.id === selectedOutfitId),
    [outfits, selectedOutfitId],
  );

  if (!wardrobe) {
    return (
      <div className="rounded-2xl p-5" style={{ background: S.card, border: `1px solid ${S.border}` }}>
        <h3 className="text-xs font-bold mb-2 flex items-center gap-2" style={{ color: S.text }}>
          <Shirt size={13} style={{ color: S.primary }} /> 造型管理
        </h3>
        <p className="text-[9px]" style={{ color: S.text3 }}>
          该角色暂无造型数据。后续可从「资产总监」Expert 处自动生成造型配置。
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: S.card, border: `1px solid ${S.border}` }}>

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: `1px solid ${S.border}` }}>
        <h3 className="text-xs font-bold flex items-center gap-2" style={{ color: S.text }}>
          <Shirt size={13} style={{ color: S.primary }} /> 造型管理
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: S.primary10, color: S.primary }}>
            {outfits.length} 套
          </span>
        </h3>
        {/* Sub-view tabs */}
        <div className="flex items-center gap-1">
          {([
            { id: "outfits" as SubView, label: "造型列表" },
            { id: "preview" as SubView, label: "预览" },
            { id: "binder" as SubView, label: "节点绑定" },
          ]).map(tab => (
            <motion.button
              key={tab.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSubView(tab.id)}
              className="px-2.5 py-1 rounded-lg text-[9px] font-bold transition-colors focus:outline-none"
              style={{
                background: subView === tab.id ? S.primary10 : "transparent",
                color: subView === tab.id ? S.primary : S.text3,
              }}
            >
              {tab.label}
            </motion.button>
          ))}
        </div>
      </div>

      <div className="p-4">
        <AnimatePresence mode="wait">

          {/* ══════ Sub-view: Outfits List ══════ */}
          {subView === "outfits" && (
            <motion.div key="outfits" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>

              {/* Outfit cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                {outfits.map(outfit => {
                  const isSelected = outfit.id === selectedOutfitId;
                  const isDefault = outfit.id === wardrobe.defaultOutfitId;
                  const pieceCount = Object.keys(outfit.pieces).length;
                  return (
                    <motion.div
                      key={outfit.id}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => setSelectedOutfitId(outfit.id)}
                      className="relative p-3 rounded-xl cursor-pointer transition-colors"
                      style={{
                        background: isSelected ? S.primary10 : S.s2,
                        border: `1.5px solid ${isSelected ? S.primary : S.border}`,
                      }}
                    >
                      {/* Default badge */}
                      {isDefault && (
                        <span className="absolute top-2 right-2 text-[7px] font-bold px-1.5 py-0.5 rounded"
                          style={{ background: S.success10, color: S.success }}>
                          默认
                        </span>
                      )}

                      <p className="text-[10px] font-bold mb-1" style={{ color: S.text }}>
                        {outfit.name}
                      </p>
                      {outfit.description && (
                        <p className="text-[8px] mb-1.5 leading-relaxed" style={{ color: S.text3 }}>
                          {outfit.description}
                        </p>
                      )}

                      {/* Style tags */}
                      <div className="flex items-center gap-1 flex-wrap mb-1.5">
                        {outfit.styleTags.map(tag => (
                          <span key={tag} className="text-[7px] px-1.5 py-0.5 rounded" style={{ background: S.accent10, color: S.accent }}>
                            {tag}
                          </span>
                        ))}
                      </div>

                      {/* Piece count + node count */}
                      <div className="flex items-center gap-3">
                        <span className="text-[8px]" style={{ color: S.text3 }}>
                          {pieceCount}/{slots.length} 槽位
                        </span>
                        <span className="text-[8px]" style={{ color: S.text3 }}>
                          绑定 {outfit.sceneApplicability.length} 节点
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 mt-2">
                        {!isDefault && (
                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => { e.stopPropagation(); onSetDefault?.(character.id, outfit.id); }}
                            className="text-[8px] px-2 py-0.5 rounded-lg focus:outline-none"
                            style={{ background: S.success10, color: S.success }}
                          >
                            <Star size={8} className="inline mr-0.5" /> 设为默认
                          </motion.button>
                        )}
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => { e.stopPropagation(); setSelectedOutfitId(outfit.id); setSubView("preview"); }}
                          className="text-[8px] px-2 py-0.5 rounded-lg focus:outline-none"
                          style={{ background: S.primary10, color: S.primary }}
                        >
                          <Eye size={8} className="inline mr-0.5" /> 预览
                        </motion.button>
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => { e.stopPropagation(); setSelectedOutfitId(outfit.id); setSubView("binder"); }}
                          className="text-[8px] px-2 py-0.5 rounded-lg focus:outline-none"
                          style={{ background: S.accent10, color: S.accent }}
                        >
                          <Link2 size={8} className="inline mr-0.5" /> 绑定
                        </motion.button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Visual Anchors toggle */}
              {anchors.length > 0 && (
                <div className="mb-3">
                  <button
                    onClick={() => setShowAnchors(!showAnchors)}
                    className="flex items-center gap-1.5 text-[9px] font-bold focus:outline-none"
                    style={{ color: S.text2 }}
                  >
                    {showAnchors ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                    视觉锚点
                    <span className="text-[8px] font-mono px-1.5 py-0.5 rounded" style={{ background: S.warning10, color: S.warning }}>
                      {anchors.filter(a => a.mustMaintain).length} 必须保持
                    </span>
                  </button>
                  <AnimatePresence>
                    {showAnchors && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-2 space-y-1.5 pl-5">
                          {anchors.map(anchor => (
                            <div key={anchor.id} className="flex items-center gap-2 p-2 rounded-lg" style={{ background: S.s2 }}>
                              <span className="text-[7px] px-1.5 py-0.5 rounded font-bold shrink-0" style={{
                                background: anchor.mustMaintain ? S.warning10 : S.s3,
                                color: anchor.mustMaintain ? S.warning : S.text3,
                              }}>
                                {anchor.anchorType === "facial" ? "面部" : anchor.anchorType === "body" ? "体型" : anchor.anchorType === "color" ? "色彩" : "标志"}
                              </span>
                              <span className="text-[8px]" style={{ color: S.text2 }}>{anchor.description}</span>
                              {anchor.mustMaintain && <Check size={9} style={{ color: S.success }} />}
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Selected outfit detail: piece slots */}
              {selectedOutfit && (
                <div>
                  <p className="text-[9px] font-bold mb-2" style={{ color: S.text }}>
                    「{selectedOutfit.name}」槽位详情
                  </p>
                  <div className="space-y-1.5">
                    {slots.sort((a, b) => a.zOrder - b.zOrder).map(slot => {
                      const pieceId = selectedOutfit.pieces[slot.id];
                      const piece = pieces.find(p => p.id === pieceId);
                      return (
                        <div key={slot.id} className="flex items-center gap-2 p-2 rounded-lg" style={{ background: S.s2, border: `1px solid ${S.border}` }}>
                          <span className="text-[8px] font-mono w-5 text-center shrink-0" style={{ color: S.text3 }}>
                            z{slot.zOrder}
                          </span>
                          <span className="text-[8px] font-bold w-8 shrink-0" style={{ color: S.text2 }}>
                            {SLOT_CATEGORY_LABELS[slot.category] ?? slot.category}
                          </span>
                          {piece ? (
                            <>
                              <span className="text-[9px] font-bold flex-1" style={{ color: S.text }}>{piece.name}</span>
                              <div className="flex items-center gap-1">
                                {piece.tags.slice(0, 2).map(tag => (
                                  <span key={tag} className="text-[7px] px-1 py-0.5 rounded" style={{ background: S.primary10, color: S.primary }}>
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </>
                          ) : (
                            <span className="text-[8px] italic" style={{ color: S.text3 }}>未配置</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ══════ Sub-view: Preview ══════ */}
          {subView === "preview" && (
            <motion.div key="preview" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              {/* Outfit selector */}
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                {outfits.map(outfit => (
                  <motion.button
                    key={outfit.id}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedOutfitId(outfit.id)}
                    className="px-2.5 py-1 rounded-lg text-[9px] font-bold focus:outline-none"
                    style={{
                      background: outfit.id === selectedOutfitId ? S.primary : S.s2,
                      color: outfit.id === selectedOutfitId ? "#fff" : S.text3,
                    }}
                  >
                    {outfit.name}
                  </motion.button>
                ))}
              </div>

              {/* Preview canvas */}
              {selectedOutfit ? (
                <OutfitPreviewCanvas
                  outfit={selectedOutfit}
                  slots={slots}
                  pieces={pieces}
                  anchors={anchors}
                />
              ) : (
                <div className="flex items-center justify-center py-12">
                  <p className="text-[9px]" style={{ color: S.text3 }}>请先选择一套造型</p>
                </div>
              )}
            </motion.div>
          )}

          {/* ══════ Sub-view: Node Binder ══════ */}
          {subView === "binder" && (
            <motion.div key="binder" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              {/* Outfit selector */}
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                {outfits.map(outfit => (
                  <motion.button
                    key={outfit.id}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedOutfitId(outfit.id)}
                    className="px-2.5 py-1 rounded-lg text-[9px] font-bold focus:outline-none"
                    style={{
                      background: outfit.id === selectedOutfitId ? S.primary : S.s2,
                      color: outfit.id === selectedOutfitId ? "#fff" : S.text3,
                    }}
                  >
                    {outfit.name}
                    {outfit.sceneApplicability.length > 0 && (
                      <span className="ml-1 opacity-70">({outfit.sceneApplicability.length})</span>
                    )}
                  </motion.button>
                ))}
              </div>

              {selectedOutfit ? (
                <OutfitNodeBinder
                  outfit={selectedOutfit}
                  characterId={character.id}
                  onBind={(nodeIds) => onBindNodes?.(character.id, selectedOutfit.id, nodeIds)}
                  onUnbind={(nodeIds) => onUnbindNodes?.(character.id, selectedOutfit.id, nodeIds)}
                />
              ) : (
                <div className="flex items-center justify-center py-12">
                  <p className="text-[9px]" style={{ color: S.text3 }}>请先选择一套造型</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
