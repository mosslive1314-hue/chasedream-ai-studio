import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  // Project settings
  projectName: string;
  workType: 'h5' | 'video' | 'text';
  aspectRatio: '9:16' | '16:9' | 'auto';
  payMode: 'free_trial' | 'paid' | 'free';

  // AI config
  aiModel: 'gpt4' | 'claude' | 'qwen';
  aiLang: 'zh' | 'en' | 'ja';
  aiAutoSave: boolean;
  aiFrequency: 'active' | 'moderate' | 'conservative';

  // Export & backup
  exportFormat: 'json' | 'webgal' | 'custom';
  autoBackup: boolean;
  backupInterval: 'hourly' | 'daily' | 'weekly';

  // Developer options
  debugInfo: boolean;
  experimentalFeatures: boolean;
  apiEndpoint: string;

  // Actions — Project
  setProjectName: (v: string) => void;
  setWorkType: (v: 'h5' | 'video' | 'text') => void;
  setAspectRatio: (v: '9:16' | '16:9' | 'auto') => void;
  setPayMode: (v: 'free_trial' | 'paid' | 'free') => void;

  // Actions — AI
  setAiModel: (v: 'gpt4' | 'claude' | 'qwen') => void;
  setAiLang: (v: 'zh' | 'en' | 'ja') => void;
  setAiAutoSave: (v: boolean) => void;
  setAiFrequency: (v: 'active' | 'moderate' | 'conservative') => void;

  // Actions — Export
  setExportFormat: (v: 'json' | 'webgal' | 'custom') => void;
  setAutoBackup: (v: boolean) => void;
  setBackupInterval: (v: 'hourly' | 'daily' | 'weekly') => void;

  // Actions — Developer
  setDebugInfo: (v: boolean) => void;
  setExperimentalFeatures: (v: boolean) => void;
  setApiEndpoint: (v: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      // Defaults
      projectName: '幽灵协议',
      workType: 'h5',
      aspectRatio: '9:16',
      payMode: 'free_trial',

      aiModel: 'gpt4',
      aiLang: 'zh',
      aiAutoSave: true,
      aiFrequency: 'moderate',

      exportFormat: 'json',
      autoBackup: false,
      backupInterval: 'daily',

      debugInfo: false,
      experimentalFeatures: false,
      apiEndpoint: 'https://api.zhuomeng.ai/v1',

      // Project actions
      setProjectName: (v) => set({ projectName: v }),
      setWorkType: (v) => set({ workType: v }),
      setAspectRatio: (v) => set({ aspectRatio: v }),
      setPayMode: (v) => set({ payMode: v }),

      // AI actions
      setAiModel: (v) => set({ aiModel: v }),
      setAiLang: (v) => set({ aiLang: v }),
      setAiAutoSave: (v) => set({ aiAutoSave: v }),
      setAiFrequency: (v) => set({ aiFrequency: v }),

      // Export actions
      setExportFormat: (v) => set({ exportFormat: v }),
      setAutoBackup: (v) => set({ autoBackup: v }),
      setBackupInterval: (v) => set({ backupInterval: v }),

      // Developer actions
      setDebugInfo: (v) => set({ debugInfo: v }),
      setExperimentalFeatures: (v) => set({ experimentalFeatures: v }),
      setApiEndpoint: (v) => set({ apiEndpoint: v }),
    }),
    {
      name: 'cd-settings',
    }
  )
);
