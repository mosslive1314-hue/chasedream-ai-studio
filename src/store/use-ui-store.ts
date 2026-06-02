import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { IndustryType } from '@/lib/studio-data';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  link?: { href: string; label: string };
  duration?: number;
}

interface UIState {
  // Industry
  industry: IndustryType;
  setIndustry: (industry: IndustryType) => void;

  // Sidebar
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;

  // Selected items
  selectedNodeId: string | null;
  setSelectedNodeId: (id: string | null) => void;

  // Toast notifications
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;

  // Auto-save status
  saveStatus: 'saved' | 'saving' | 'unsaved';
  setSaveStatus: (status: 'saved' | 'saving' | 'unsaved') => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      // --- Initial state ---
      industry: 'game' as IndustryType,
      sidebarCollapsed: false,
      selectedNodeId: null,
      toasts: [],
      saveStatus: 'saved' as const,

      // --- Industry ---
      setIndustry: (industry) => {
        set({ industry });
      },

      // --- Sidebar ---
      toggleSidebar: () => {
        set(state => ({ sidebarCollapsed: !state.sidebarCollapsed }));
      },

      // --- Selected items ---
      setSelectedNodeId: (id) => {
        set({ selectedNodeId: id });
      },

      // --- Toast notifications ---
      addToast: (toastData) => {
        const id = Date.now().toString(36);
        const toast: Toast = { ...toastData, id };
        const duration = toastData.duration ?? 4000;

        set(state => ({
          toasts: [...state.toasts, toast],
        }));

        // Auto-remove after duration
        setTimeout(() => {
          set(state => ({
            toasts: state.toasts.filter(t => t.id !== id),
          }));
        }, duration);
      },

      removeToast: (id) => {
        set(state => ({
          toasts: state.toasts.filter(t => t.id !== id),
        }));
      },

      // --- Auto-save status ---
      setSaveStatus: (status) => {
        set({ saveStatus: status });
      },
    }),
    {
      name: 'cd-ui',
    }
  )
);
