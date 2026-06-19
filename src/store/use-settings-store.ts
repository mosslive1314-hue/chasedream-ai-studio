import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// AI 提供商类型：预设 + 自定义（兼容任意 OpenAI 兼容接口）
export type AiProvider = 'openai' | 'qwen' | 'hunyuan' | 'deepseek' | 'custom';

// 媒体生成类型
export type MediaModelType = 'image' | 'video' | 'audio' | 'tts';

// 媒体模型配置
export interface MediaModelConfig {
  enabled: boolean;
  provider: string;      // 提供商标识，如 "dalle" / "stable-diffusion" / "runway" / "suno" / "openai-tts"
  modelName: string;     // 模型名，如 "dall-e-3" / "stable-diffusion-xl" / "runway-gen3-alpha"
  apiKey: string;
  baseUrl: string;       // API 端点，留空则使用提供商默认
}

// 媒体模型预设
export const MEDIA_PROVIDER_PRESETS: Record<MediaModelType, { label: string; providers: { id: string; label: string; defaultBaseUrl: string; defaultModel: string; keyLabel: string }[] }> = {
  image: {
    label: '图像生成',
    providers: [
      { id: 'dalle', label: 'DALL·E (OpenAI)', defaultBaseUrl: 'https://api.openai.com/v1', defaultModel: 'dall-e-3', keyLabel: 'OpenAI API Key' },
      { id: 'stable-diffusion', label: 'Stable Diffusion', defaultBaseUrl: 'https://api.stability.ai/v1', defaultModel: 'stable-diffusion-xl', keyLabel: 'Stability API Key' },
      { id: 'wanxiang', label: '通义万相', defaultBaseUrl: 'https://dashscope.aliyuncs.com/api/v1', defaultModel: 'wanxiang-v1', keyLabel: 'DashScope API Key' },
      { id: 'custom', label: '自定义', defaultBaseUrl: '', defaultModel: '', keyLabel: 'API Key' },
    ],
  },
  video: {
    label: '视频生成',
    providers: [
      { id: 'runway', label: 'Runway Gen-3', defaultBaseUrl: 'https://api.runwayml.com/v1', defaultModel: 'gen3-alpha', keyLabel: 'Runway API Key' },
      { id: 'kling', label: '可灵 AI', defaultBaseUrl: 'https://api.klingai.com/v1', defaultModel: 'kling-v1', keyLabel: '可灵 API Key' },
      { id: 'pika', label: 'Pika Labs', defaultBaseUrl: 'https://api.pika.art/v1', defaultModel: 'pika-v1', keyLabel: 'Pika API Key' },
      { id: 'custom', label: '自定义', defaultBaseUrl: '', defaultModel: '', keyLabel: 'API Key' },
    ],
  },
  audio: {
    label: '音频生成',
    providers: [
      { id: 'suno', label: 'Suno AI', defaultBaseUrl: 'https://api.suno.ai/v1', defaultModel: 'suno-v3', keyLabel: 'Suno API Key' },
      { id: 'elevenlabs', label: 'ElevenLabs', defaultBaseUrl: 'https://api.elevenlabs.io/v1', defaultModel: 'eleven-v2', keyLabel: 'ElevenLabs API Key' },
      { id: 'custom', label: '自定义', defaultBaseUrl: '', defaultModel: '', keyLabel: 'API Key' },
    ],
  },
  tts: {
    label: '语音合成 (TTS)',
    providers: [
      { id: 'openai-tts', label: 'OpenAI TTS', defaultBaseUrl: 'https://api.openai.com/v1', defaultModel: 'tts-1', keyLabel: 'OpenAI API Key' },
      { id: 'azure-tts', label: 'Azure TTS', defaultBaseUrl: 'https://eastus.tts.speech.microsoft.com', defaultModel: 'azure-tts', keyLabel: 'Azure API Key' },
      { id: 'custom', label: '自定义', defaultBaseUrl: '', defaultModel: '', keyLabel: 'API Key' },
    ],
  },
};

interface SettingsState {
  // Project settings
  projectName: string;
  workType: 'h5' | 'video' | 'text';
  aspectRatio: '9:16' | '16:9' | 'auto';
  payMode: 'free_trial' | 'paid' | 'free';
  // 行业/题材模式（影响 AI 创作倾向）
  genre: 'suspense' | 'romance' | 'horror' | 'scifi' | 'fantasy' | 'daily' | 'custom';
  genreCustom?: string;

  // AI config — LLM
  aiProvider: AiProvider;
  aiModelName: string; // 具体模型名，如 gpt-4o / qwen-max / deepseek-chat / 自定义
  /** @deprecated 旧字段，兼容旧 Screen，优先用 aiProvider + aiModelName */
  aiModel: 'gpt4' | 'claude' | 'qwen';
  aiLang: 'zh' | 'en' | 'ja';
  aiAutoSave: boolean;
  aiFrequency: 'active' | 'moderate' | 'conservative';
  apiKeys: Record<string, string>;
  apiBaseUrl: string;

  // AI config — 媒体生成（图像/视频/音频/TTS）
  mediaModels: Record<MediaModelType, MediaModelConfig>;

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
  setGenre: (v: 'suspense' | 'romance' | 'horror' | 'scifi' | 'fantasy' | 'daily' | 'custom') => void;
  setGenreCustom: (v: string) => void;

  // Actions — AI (LLM)
  setAiProvider: (v: AiProvider) => void;
  setAiModelName: (v: string) => void;
  /** @deprecated 兼容旧 Screen */
  setAiModel: (v: 'gpt4' | 'claude' | 'qwen') => void;
  setAiLang: (v: 'zh' | 'en' | 'ja') => void;
  setAiAutoSave: (v: boolean) => void;
  setAiFrequency: (v: 'active' | 'moderate' | 'conservative') => void;
  setApiKey: (model: string, key: string) => void;
  setApiBaseUrl: (v: string) => void;

  // Actions — AI (媒体生成)
  setMediaModel: (type: MediaModelType, config: Partial<MediaModelConfig>) => void;

  // Actions — Export
  setExportFormat: (v: 'json' | 'webgal' | 'custom') => void;
  setAutoBackup: (v: boolean) => void;
  setBackupInterval: (v: 'hourly' | 'daily' | 'weekly') => void;

  // Actions — Developer
  setDebugInfo: (v: boolean) => void;
  setExperimentalFeatures: (v: boolean) => void;
  setApiEndpoint: (v: string) => void;
}

// 预设提供商默认配置
export const PROVIDER_PRESETS: Record<AiProvider, { label: string; defaultBaseUrl: string; defaultModel: string; keyLabel: string }> = {
  openai: { label: 'OpenAI 兼容', defaultBaseUrl: 'https://api.openai.com/v1', defaultModel: 'gpt-4o', keyLabel: 'API Key' },
  qwen: { label: '通义千问', defaultBaseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', defaultModel: 'qwen-max', keyLabel: 'DashScope API Key' },
  hunyuan: { label: '腾讯混元', defaultBaseUrl: 'https://api.hunyuan.cloud.tencent.com/v1', defaultModel: 'hunyuan-pro', keyLabel: '混元 API Key' },
  deepseek: { label: 'DeepSeek', defaultBaseUrl: 'https://api.deepseek.com/v1', defaultModel: 'deepseek-chat', keyLabel: 'DeepSeek API Key' },
  custom: { label: '自定义', defaultBaseUrl: '', defaultModel: '', keyLabel: 'API Key' },
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      // Defaults
      projectName: '幽灵协议',
      workType: 'h5',
      aspectRatio: '9:16',
      payMode: 'free_trial',
      genre: 'suspense',

      aiProvider: 'openai',
      aiModelName: 'gpt-4o',
      aiModel: 'gpt4', // legacy
      aiLang: 'zh',
      aiAutoSave: true,
      aiFrequency: 'moderate',
      apiKeys: {},
      apiBaseUrl: '',

      // 媒体模型默认配置（全部禁用，用户按需开启）
      mediaModels: {
        image: { enabled: false, provider: 'dalle', modelName: 'dall-e-3', apiKey: '', baseUrl: '' },
        video: { enabled: false, provider: 'runway', modelName: 'gen3-alpha', apiKey: '', baseUrl: '' },
        audio: { enabled: false, provider: 'suno', modelName: 'suno-v3', apiKey: '', baseUrl: '' },
        tts: { enabled: false, provider: 'openai-tts', modelName: 'tts-1', apiKey: '', baseUrl: '' },
      },

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
      setGenre: (v) => set({ genre: v }),
      setGenreCustom: (v) => set({ genreCustom: v }),

      // AI actions
      setAiProvider: (v) => set((state) => ({
        aiProvider: v,
        // 同步 legacy aiModel
        aiModel: v === 'qwen' ? 'qwen' : 'gpt4' as const,
        // 切换提供商时同步默认模型名
        aiModelName: state.aiModelName || PROVIDER_PRESETS[v].defaultModel || state.aiModelName,
      })),
      setAiModelName: (v) => set({ aiModelName: v }),
      setAiModel: (v) => set((state) => ({
        aiModel: v,
        aiProvider: v === 'qwen' ? 'qwen' : 'openai',
        aiModelName: v === 'qwen' ? 'qwen-max' : (state.aiModelName || 'gpt-4o'),
      })),
      setAiLang: (v) => set({ aiLang: v }),
      setAiAutoSave: (v) => set({ aiAutoSave: v }),
      setAiFrequency: (v) => set({ aiFrequency: v }),
      setApiKey: (model, key) => set((state) => ({ apiKeys: { ...state.apiKeys, [model]: key } })),
      setApiBaseUrl: (v) => set({ apiBaseUrl: v }),

      // 媒体模型 actions
      setMediaModel: (type, config) => set((state) => ({
        mediaModels: {
          ...state.mediaModels,
          [type]: { ...state.mediaModels[type], ...config },
        },
      })),

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
      skipHydration: true,
      // 迁移旧字段 aiModel -> aiProvider + aiModelName，并补全 mediaModels
      migrate: (persisted: any) => {
        if (persisted && persisted.aiModel && !persisted.aiProvider) {
          const oldModel = persisted.aiModel as string;
          if (oldModel === 'qwen') {
            persisted.aiProvider = 'qwen';
            persisted.aiModelName = 'qwen-max';
          } else {
            persisted.aiProvider = 'openai';
            persisted.aiModelName = 'gpt-4o';
          }
          delete persisted.aiModel;
        }
        // v3: 补全 mediaModels（旧数据没有此字段）
        if (persisted && !persisted.mediaModels) {
          persisted.mediaModels = {
            image: { enabled: false, provider: 'dalle', modelName: 'dall-e-3', apiKey: '', baseUrl: '' },
            video: { enabled: false, provider: 'runway', modelName: 'gen3-alpha', apiKey: '', baseUrl: '' },
            audio: { enabled: false, provider: 'suno', modelName: 'suno-v3', apiKey: '', baseUrl: '' },
            tts: { enabled: false, provider: 'openai-tts', modelName: 'tts-1', apiKey: '', baseUrl: '' },
          };
        }
        return persisted as SettingsState;
      },
      version: 3,
    }
  )
);
