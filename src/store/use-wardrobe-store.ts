// ChaseDream Creator Studio — Wardrobe Store
// 角色换装系统状态管理：造型衣柜、单品、造型组合的 CRUD

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { idbStorage } from './idb-storage';
import type {
  CharacterWardrobe,
  WardrobeSlot,
  OutfitPiece,
  CharacterOutfit,
  VisualAnchor,
} from '@/lib/types/wardrobe';
import { CHARACTER_WARDROBES } from '@/lib/seed/wardrobe-seed';

// ── Seed state ────────────────────────────────────────────────────────────

const seedState = {
  wardrobes: CHARACTER_WARDROBES,
};

// ── Store interface ───────────────────────────────────────────────────────

interface WardrobeState {
  // ── 数据 ──
  wardrobes: CharacterWardrobe[];

  // ── Wardrobe CRUD ──
  addWardrobe: (wardrobe: CharacterWardrobe) => void;
  removeWardrobe: (characterId: string) => void;

  // ── Slot CRUD ──
  addSlot: (characterId: string, slot: WardrobeSlot) => void;
  updateSlot: (characterId: string, slotId: string, updates: Partial<WardrobeSlot>) => void;
  removeSlot: (characterId: string, slotId: string) => void;

  // ── Piece CRUD ──
  addPiece: (characterId: string, piece: OutfitPiece) => void;
  updatePiece: (characterId: string, pieceId: string, updates: Partial<OutfitPiece>) => void;
  removePiece: (characterId: string, pieceId: string) => void;

  // ── Outfit CRUD ──
  addOutfit: (characterId: string, outfit: CharacterOutfit) => void;
  updateOutfit: (characterId: string, outfitId: string, updates: Partial<CharacterOutfit>) => void;
  removeOutfit: (characterId: string, outfitId: string) => void;
  setDefaultOutfit: (characterId: string, outfitId: string) => void;

  // ── Visual Anchor CRUD ──
  addVisualAnchor: (characterId: string, anchor: VisualAnchor) => void;
  updateVisualAnchor: (characterId: string, anchorId: string, updates: Partial<VisualAnchor>) => void;
  removeVisualAnchor: (characterId: string, anchorId: string) => void;

  // ── 查询 ──
  getWardrobe: (characterId: string) => CharacterWardrobe | undefined;
  getOutfit: (characterId: string, outfitId: string) => CharacterOutfit | undefined;
  getDefaultOutfit: (characterId: string) => CharacterOutfit | undefined;
  getOutfitsForNode: (characterId: string, nodeId: string) => CharacterOutfit[];

  // ── 造型-节点绑定 ──
  bindOutfitToNodes: (characterId: string, outfitId: string, nodeIds: string[]) => void;
  unbindOutfitFromNodes: (characterId: string, outfitId: string, nodeIds: string[]) => void;
}

// ── Helper: update wardrobe by characterId ────────────────────────────────

function updateWardrobe(
  wardrobes: CharacterWardrobe[],
  characterId: string,
  updater: (w: CharacterWardrobe) => CharacterWardrobe,
): CharacterWardrobe[] {
  return wardrobes.map(w =>
    w.characterId === characterId ? updater(w) : w,
  );
}

// ── Store ─────────────────────────────────────────────────────────────────

export const useWardrobeStore = create<WardrobeState>()(
  persist(
    (set, get) => ({
      // ── Initial state ──
      wardrobes: seedState.wardrobes,

      // ── Wardrobe CRUD ──
      addWardrobe: (wardrobe) => {
        set(state => ({
          wardrobes: [...state.wardrobes, wardrobe],
        }));
      },

      removeWardrobe: (characterId) => {
        set(state => ({
          wardrobes: state.wardrobes.filter(w => w.characterId !== characterId),
        }));
      },

      // ── Slot CRUD ──
      addSlot: (characterId, slot) => {
        set(state => ({
          wardrobes: updateWardrobe(state.wardrobes, characterId, w => ({
            ...w,
            slots: [...w.slots, slot],
          })),
        }));
      },

      updateSlot: (characterId, slotId, updates) => {
        set(state => ({
          wardrobes: updateWardrobe(state.wardrobes, characterId, w => ({
            ...w,
            slots: w.slots.map(s => s.id === slotId ? { ...s, ...updates } : s),
          })),
        }));
      },

      removeSlot: (characterId, slotId) => {
        set(state => ({
          wardrobes: updateWardrobe(state.wardrobes, characterId, w => ({
            ...w,
            slots: w.slots.filter(s => s.id !== slotId),
          })),
        }));
      },

      // ── Piece CRUD ──
      addPiece: (characterId, piece) => {
        set(state => ({
          wardrobes: updateWardrobe(state.wardrobes, characterId, w => ({
            ...w,
            pieces: [...w.pieces, piece],
          })),
        }));
      },

      updatePiece: (characterId, pieceId, updates) => {
        set(state => ({
          wardrobes: updateWardrobe(state.wardrobes, characterId, w => ({
            ...w,
            pieces: w.pieces.map(p => p.id === pieceId ? { ...p, ...updates } : p),
          })),
        }));
      },

      removePiece: (characterId, pieceId) => {
        set(state => ({
          wardrobes: updateWardrobe(state.wardrobes, characterId, w => ({
            ...w,
            pieces: w.pieces.filter(p => p.id !== pieceId),
          })),
        }));
      },

      // ── Outfit CRUD ──
      addOutfit: (characterId, outfit) => {
        set(state => ({
          wardrobes: updateWardrobe(state.wardrobes, characterId, w => ({
            ...w,
            outfits: [...w.outfits, outfit],
          })),
        }));
      },

      updateOutfit: (characterId, outfitId, updates) => {
        set(state => ({
          wardrobes: updateWardrobe(state.wardrobes, characterId, w => ({
            ...w,
            outfits: w.outfits.map(o => o.id === outfitId ? { ...o, ...updates } : o),
          })),
        }));
      },

      removeOutfit: (characterId, outfitId) => {
        set(state => ({
          wardrobes: updateWardrobe(state.wardrobes, characterId, w => ({
            ...w,
            outfits: w.outfits.filter(o => o.id !== outfitId),
            defaultOutfitId: w.defaultOutfitId === outfitId
              ? (w.outfits.find(o => o.id !== outfitId)?.id ?? '')
              : w.defaultOutfitId,
          })),
        }));
      },

      setDefaultOutfit: (characterId, outfitId) => {
        set(state => ({
          wardrobes: updateWardrobe(state.wardrobes, characterId, w => ({
            ...w,
            defaultOutfitId: outfitId,
            outfits: w.outfits.map(o => ({
              ...o,
              isDefault: o.id === outfitId,
            })),
          })),
        }));
      },

      // ── Visual Anchor CRUD ──
      addVisualAnchor: (characterId, anchor) => {
        set(state => ({
          wardrobes: updateWardrobe(state.wardrobes, characterId, w => ({
            ...w,
            visualAnchors: [...w.visualAnchors, anchor],
          })),
        }));
      },

      updateVisualAnchor: (characterId, anchorId, updates) => {
        set(state => ({
          wardrobes: updateWardrobe(state.wardrobes, characterId, w => ({
            ...w,
            visualAnchors: w.visualAnchors.map(a =>
              a.id === anchorId ? { ...a, ...updates } : a,
            ),
          })),
        }));
      },

      removeVisualAnchor: (characterId, anchorId) => {
        set(state => ({
          wardrobes: updateWardrobe(state.wardrobes, characterId, w => ({
            ...w,
            visualAnchors: w.visualAnchors.filter(a => a.id !== anchorId),
          })),
        }));
      },

      // ── 查询 ──
      getWardrobe: (characterId) => {
        return get().wardrobes.find(w => w.characterId === characterId);
      },

      getOutfit: (characterId, outfitId) => {
        const wardrobe = get().wardrobes.find(w => w.characterId === characterId);
        return wardrobe?.outfits.find(o => o.id === outfitId);
      },

      getDefaultOutfit: (characterId) => {
        const wardrobe = get().wardrobes.find(w => w.characterId === characterId);
        return wardrobe?.outfits.find(o => o.id === wardrobe.defaultOutfitId);
      },

      getOutfitsForNode: (characterId, nodeId) => {
        const wardrobe = get().wardrobes.find(w => w.characterId === characterId);
        if (!wardrobe) return [];
        return wardrobe.outfits.filter(o => o.sceneApplicability.includes(nodeId));
      },

      // ── 造型-节点绑定 ──
      bindOutfitToNodes: (characterId, outfitId, nodeIds) => {
        set(state => ({
          wardrobes: updateWardrobe(state.wardrobes, characterId, w => ({
            ...w,
            outfits: w.outfits.map(o =>
              o.id === outfitId
                ? {
                    ...o,
                    sceneApplicability: [
                      ...new Set([...o.sceneApplicability, ...nodeIds]),
                    ],
                  }
                : o,
            ),
          })),
        }));
      },

      unbindOutfitFromNodes: (characterId, outfitId, nodeIds) => {
        const nodeSet = new Set(nodeIds);
        set(state => ({
          wardrobes: updateWardrobe(state.wardrobes, characterId, w => ({
            ...w,
            outfits: w.outfits.map(o =>
              o.id === outfitId
                ? {
                    ...o,
                    sceneApplicability: o.sceneApplicability.filter(id => !nodeSet.has(id)),
                  }
                : o,
            ),
          })),
        }));
      },
    }),
    {
      name: 'cd-wardrobe',
      version: 1,
      storage: createJSONStorage(() => idbStorage),
      migrate: () => seedState as any,
    },
  ),
);
