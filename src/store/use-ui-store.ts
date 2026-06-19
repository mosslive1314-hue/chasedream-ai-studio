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

/** Workbench tab type for Agent-First layout */
export type WorkbenchTab = 'canvas' | 'simulator' | 'assets' | 'settings';

interface UIState {
  // Industry
  industry: IndustryType;
  setIndustry: (industry: IndustryType) => void;

  // Sidebar (legacy — kept for backward compat, no longer primary navigation)
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;

  // ── Agent-First Layout ──
  activeTab: WorkbenchTab;
  setActiveTab: (tab: WorkbenchTab) => void;
  agentPanelCollapsed: boolean;
  toggleAgentPanel: () => void;
  contextPanelCollapsed: boolean;
  toggleContextPanel: () => void;

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

  // ── Phase E: Progressive Disclosure + Pro Mode ──
  viewMode: 'simple' | 'expanded';
  setViewMode: (mode: 'simple' | 'expanded') => void;
  proMode: boolean;
  toggleProMode: () => void;

  // ── Phase E: AI Chat Panel ──
  aiChatOpen: boolean;
  toggleAiChat: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      // --- Initial state ---
      industry: 'game' as IndustryType,
      sidebarCollapsed: false,
      activeTab: 'canvas' as WorkbenchTab,
      agentPanelCollapsed: false,
      contextPanelCollapsed: false,
      selectedNodeId: null,
      toasts: [],
      saveStatus: 'saved' as const,
      viewMode: 'simple' as const,
      proMode: false,
      aiChatOpen: false,

      // --- Industry ---
      setIndustry: (industry) => {
        set({ industry });
      },

      // --- Sidebar ---
      toggleSidebar: () => {
        set(state => ({ sidebarCollapsed: !state.sidebarCollapsed }));
      },

      // --- Agent-First Layout ---
      setActiveTab: (tab) => {
        set({ activeTab: tab });
      },
      toggleAgentPanel: () => {
        set(state => ({ agentPanelCollapsed: !state.agentPanelCollapsed }));
      },
      toggleContextPanel: () => {
        set(state => ({ contextPanelCollapsed: !state.contextPanelCollapsed }));
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

      // --- Phase E: View mode + Pro mode ---
      setViewMode: (mode) => {
        set({ viewMode: mode });
      },
      toggleProMode: () => {
        set(state => ({ proMode: !state.proMode }));
      },

      // --- Phase E: AI Chat ---
      toggleAiChat: () => {
        set(state => ({ aiChatOpen: !state.aiChatOpen }));
      },
    }),
    {
      name: 'cd-ui',
      skipHydration: true,
    }
  )
);
