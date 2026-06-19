/**
 * 媒体生成服务
 *
 * 统一管理图像 / 视频 / 音频 / TTS 四种媒体生成能力。
 *
 * 设计原则：
 * 1. 图像生成复用 ai-image-service.ts 已有实现（DALL-E / SD / 通义万象）
 * 2. 视频/音频/TTS 构建真实的 API 调用结构，未配置对应 API 时返回明确错误
 * 3. 所有函数参数清晰、返回结构化，可被 AI 工具直接调用
 * 4. 禁止 mock：要么真实调用，要么返回明确的「未配置」错误
 *
 * API Key 读取策略：
 * - 优先从 useSettingsStore.getState().apiKeys 读取
 * - 图像：使用 'dalle' / 'stable-diffusion' / 'wanxiang' / 'openai' key
 * - 视频：使用 'video' / 'runway' / 'kling' key（需用户额外配置）
 * - 音频：使用 'audio' / 'suno' / 'elevenlabs' key（需用户额外配置）
 * - TTS：使用 'tts' / 'openai' key
 */

import type { AIService } from '@/lib/ai/ai-service';
import {
  generateImage as generateImageInternal,
  type ImageGenRequest,
  type ImageGenConfig,
  type ImageGenResult,
} from '@/lib/ai/ai-image-service';
import { useSettingsStore, MEDIA_PROVIDER_PRESETS } from '@/store/use-settings-store';

// ─── 类型定义 ─────────────────────────────────────────────────────────────

/** 媒体类型 */
export type MediaType = 'image' | 'video' | 'audio' | 'tts';

/** 媒体生成请求 */
export interface MediaGenRequest {
  type: MediaType;
  prompt: string;
  options?: {
    /** 图像/视频宽度 */
    width?: number;
    /** 图像/视频高度 */
    height?: number;
    /** 视频时长（秒） */
    duration?: number;
    /** TTS 音色 */
    voice?: string;
    /** TTS 情感 */
    emotion?: string;
    /** 图像风格 */
    style?: string;
    /** 负面提示词 */
    negativePrompt?: string;
    /** 音频类型：BGM / 音效 / 环境音 */
    audioType?: 'bgm' | 'sfx' | 'ambient';
    /** TTS 语速（0.5-2.0） */
    speed?: number;
  };
}

/** 媒体生成结果 */
export interface MediaGenResult {
  success: boolean;
  /** 生成内容的 URL */
  url?: string;
  /** 本地缓存路径（若下载到本地） */
  localPath?: string;
  metadata: {
    type: MediaType;
    model: string;
    cost?: number;
    duration?: number;
  };
  error?: string;
}

// ─── 配置读取工具 ─────────────────────────────────────────────────────────

/**
 * 从 settings store 读取指定媒体类型的配置
 *
 * 优先使用 mediaModels 中的配置（新架构），
 * 如果未配置则回退到旧的 apiKeys 查找（兼容旧数据）。
 */
function getMediaConfig(type: MediaType): { apiKey: string; baseUrl: string; modelName: string; provider: string } | null {
  const settings = useSettingsStore.getState();
  const mediaConfig = settings.mediaModels?.[type];

  // 新架构：mediaModels 配置
  if (mediaConfig?.enabled && mediaConfig.apiKey?.trim()) {
    const preset = MEDIA_PROVIDER_PRESETS[type].providers.find(p => p.id === mediaConfig.provider);
    return {
      apiKey: mediaConfig.apiKey,
      baseUrl: mediaConfig.baseUrl || preset?.defaultBaseUrl || 'https://api.openai.com/v1',
      modelName: mediaConfig.modelName || preset?.defaultModel || '',
      provider: mediaConfig.provider,
    };
  }

  // 旧架构回退：从 apiKeys 中查找
  const fallbackKeys: Record<MediaType, string[]> = {
    image: ['dalle', 'stable-diffusion', 'wanxiang', 'openai'],
    video: ['video', 'runway', 'kling', 'pika'],
    audio: ['audio', 'suno', 'elevenlabs'],
    tts: ['tts', 'openai', 'azure-tts'],
  };
  for (const key of fallbackKeys[type]) {
    const value = settings.apiKeys[key];
    if (value && value.trim().length > 0) {
      return {
        apiKey: value,
        baseUrl: settings.apiBaseUrl || 'https://api.openai.com/v1',
        modelName: '',
        provider: key,
      };
    }
  }

  return null;
}

/**
 * 构建未配置错误结果
 */
function buildNotConfiguredResult(type: MediaType, requiredKey: string): MediaGenResult {
  return {
    success: false,
    metadata: {
      type,
      model: 'unconfigured',
    },
    error: `${type === 'tts' ? 'TTS 语音合成' : type === 'image' ? '图像' : type === 'video' ? '视频' : '音频'}生成服务未配置。请在设置中配置 ${requiredKey} API Key。`,
  };
}

// ─── 图像生成 ─────────────────────────────────────────────────────────────

/**
 * 图像生成
 *
 * 调用 ai-image-service.ts 的 generateImage，支持 DALL-E / SD / 通义万象。
 * 自动从 settings 读取 API Key 和 BaseUrl。
 */
export async function generateImage(
  prompt: string,
  options?: {
    width?: number;
    height?: number;
    style?: string;
    negativePrompt?: string;
  },
  _aiService?: AIService,
): Promise<MediaGenResult> {
  // 读取图像生成配置
  const config = getMediaConfig('image');
  if (!config) {
    return buildNotConfiguredResult('image', '图像生成（dalle / stable-diffusion / wanxiang）');
  }
  const { apiKey, baseUrl } = config;

  // 根据 width/height 推断 aspectRatio
  let aspectRatio: ImageGenRequest['aspectRatio'] = '1:1';
  if (options?.width && options?.height) {
    const ratio = options.width / options.height;
    if (ratio > 1.5) aspectRatio = '16:9';
    else if (ratio < 0.7) aspectRatio = '9:16';
    else if (ratio > 1.1) aspectRatio = '4:3';
    else if (ratio < 0.9) aspectRatio = '3:4';
  }

  const request: ImageGenRequest = {
    prompt,
    negativePrompt: options?.negativePrompt,
    aspectRatio,
    quality: 'hd',
  };

  const imageConfig: ImageGenConfig = {
    apiKey,
    baseUrl,
    // 若有 style，尝试匹配预设
    stylePresetId: options?.style,
  };

  // 调用现有图像生成服务
  const result: ImageGenResult = await generateImageInternal(request, imageConfig);

  return {
    success: result.success,
    url: result.imageUrl,
    metadata: {
      type: 'image',
      model: result.model || (result.provider === 'dalle' ? 'dall-e-3' : result.provider || 'unknown'),
    },
    error: result.error,
  };
}

// ─── 视频生成 ─────────────────────────────────────────────────────────────

/**
 * 视频生成
 *
 * 构建真实的视频生成 API 调用结构（兼容 Runway / 可灵 / Pika 等主流服务）。
 * 当前未配置视频生成 API Key 时返回明确错误，不进行 mock。
 *
 * 支持的视频生成服务（需用户在 settings.apiKeys 中配置对应 key）：
 * - runway: 使用 'video' 或 'runway' key，调用 Runway Gen-2 API
 * - kling: 使用 'kling' key，调用可灵 AI API
 */
export async function generateVideo(
  prompt: string,
  options?: {
    duration?: number;
    width?: number;
    height?: number;
  },
  _aiService?: AIService,
): Promise<MediaGenResult> {
  const config = getMediaConfig('video');
  if (!config) {
    return buildNotConfiguredResult('video', '视频生成（runway / kling / pika）');
  }
  const { apiKey, baseUrl } = config;

  const duration = options?.duration ?? 5;
  const width = options?.width ?? 1280;
  const height = options?.height ?? 720;

  // 真实的 Runway Gen-2 API 调用结构
  // 文档参考：https://docs.runwayml.com/
  const endpoint = baseUrl.includes('runway')
    ? `${baseUrl}/v1/image_to_video`
    : `${baseUrl}/video/generations`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'X-Runway-Version': '2024-11-06',
      },
      body: JSON.stringify({
        promptText: prompt,
        model: 'gen3a_turbo',
        duration: duration,
        ratio: width > height ? '16:9' : width < height ? '9:16' : '1:1',
        // 可选参数
        seed: Math.floor(Math.random() * 1000000),
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const errMsg = (errData as any)?.error?.message || (errData as any)?.message || response.statusText;
      return {
        success: false,
        metadata: { type: 'video', model: 'runway-gen3' },
        error: `视频生成 API 错误: ${errMsg}`,
      };
    }

    const data = await response.json() as any;

    // Runway 返回任务 ID，视频生成是异步的
    // 实际使用时需要轮询任务状态获取最终视频 URL
    const taskId = data.id || data.taskId;
    const videoUrl = data.output?.[0]?.url || data.url;

    return {
      success: true,
      url: videoUrl,
      metadata: {
        type: 'video',
        model: 'runway-gen3',
        duration,
      },
      // 若返回的是任务 ID 而非直接 URL，提示需要轮询
      ...(taskId && !videoUrl
        ? { error: `视频生成任务已提交（任务 ID: ${taskId}），需轮询获取结果。请配置任务状态查询逻辑。` }
        : {}),
    };
  } catch (err: any) {
    return {
      success: false,
      metadata: { type: 'video', model: 'runway-gen3' },
      error: `视频生成网络错误: ${err.message}`,
    };
  }
}

// ─── 音频生成 ─────────────────────────────────────────────────────────────

/**
 * 音频生成（BGM / 音效 / 环境音）
 *
 * 构建真实的音频生成 API 调用结构（兼容 Suno / ElevenLabs 等）。
 * 当前未配置音频生成 API Key 时返回明确错误，不进行 mock。
 *
 * 支持的音频生成服务（需用户在 settings.apiKeys 中配置对应 key）：
 * - suno: 使用 'audio' 或 'suno' key，调用 Suno API
 * - elevenlabs: 使用 'elevenlabs' key，调用 ElevenLabs 音效 API
 */
export async function generateAudio(
  prompt: string,
  options?: {
    duration?: number;
    type?: 'bgm' | 'sfx' | 'ambient';
  },
  _aiService?: AIService,
): Promise<MediaGenResult> {
  const config = getMediaConfig('audio');
  if (!config) {
    return buildNotConfiguredResult('audio', '音频生成（suno / elevenlabs）');
  }
  const { apiKey, baseUrl } = config;

  const duration = options?.duration ?? 30;
  const audioType = options?.type ?? 'bgm';

  // 根据 audioType 构建不同的提示词前缀
  const typePrefix: Record<string, string> = {
    bgm: 'background music, instrumental, ',
    sfx: 'sound effect, ',
    ambient: 'ambient soundscape, ',
  };
  const enhancedPrompt = `${typePrefix[audioType]}${prompt}`;

  // 真实的 Suno API 调用结构
  // 文档参考：https://docs.suno.ai/
  const endpoint = baseUrl.includes('suno')
    ? `${baseUrl}/v1/generate`
    : `${baseUrl}/audio/generations`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        prompt: enhancedPrompt,
        // Suno 参数
        make_instrumental: audioType !== 'sfx',
        model: 'chirp-v3.5',
        // 自定义参数
        duration: duration,
        tags: [audioType],
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const errMsg = (errData as any)?.error?.message || (errData as any)?.message || response.statusText;
      return {
        success: false,
        metadata: { type: 'audio', model: 'suno-chirp-v3.5' },
        error: `音频生成 API 错误: ${errMsg}`,
      };
    }

    const data = await response.json() as any;

    // Suno 返回任务 ID，音频生成是异步的
    const taskId = data.id || data.taskId || data.clip_id;
    const audioUrl = data.output?.[0]?.audio_url || data.audio_url || data.url;

    return {
      success: true,
      url: audioUrl,
      metadata: {
        type: 'audio',
        model: 'suno-chirp-v3.5',
        duration,
      },
      ...(taskId && !audioUrl
        ? { error: `音频生成任务已提交（任务 ID: ${taskId}），需轮询获取结果。请配置任务状态查询逻辑。` }
        : {}),
    };
  } catch (err: any) {
    return {
      success: false,
      metadata: { type: 'audio', model: 'suno-chirp-v3.5' },
      error: `音频生成网络错误: ${err.message}`,
    };
  }
}

// ─── TTS 语音合成 ─────────────────────────────────────────────────────────

/**
 * TTS 语音合成
 *
 * 调用 OpenAI 兼容的 TTS API（/audio/speech 端点）。
 * 支持 OpenAI TTS、Azure TTS、字节火山引擎等兼容接口。
 *
 * 支持的 TTS 服务（需用户在 settings.apiKeys 中配置对应 key）：
 * - openai: 使用 'tts' 或 'openai' key，调用 OpenAI TTS API
 * - azure: 使用 'azure-tts' key
 */
export async function generateTTS(
  text: string,
  options?: {
    voice?: string;
    emotion?: string;
    speed?: number;
  },
  _aiService?: AIService,
): Promise<MediaGenResult> {
  const config = getMediaConfig('tts');
  if (!config) {
    return buildNotConfiguredResult('tts', 'TTS 语音合成（openai-tts / azure-tts）');
  }
  const { apiKey, baseUrl } = config;

  const voice = options?.voice ?? 'alloy';
  const speed = options?.speed ?? 1.0;

  // 构建 OpenAI TTS API 请求调用结构
  // 文档参考：https://platform.openai.com/docs/api-reference/audio/createSpeech
  const endpoint = `${baseUrl}/audio/speech`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'tts-1-hd',
        input: text,
        voice: voice,
        speed: speed,
        response_format: 'url',
        // 情感参数（部分兼容服务支持，如火山引擎）
        ...(options?.emotion ? { emotion: options.emotion } : {}),
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const errMsg = (errData as any)?.error?.message || (errData as any)?.message || response.statusText;
      return {
        success: false,
        metadata: { type: 'tts', model: 'tts-1-hd' },
        error: `TTS API 错误: ${errMsg}`,
      };
    }

    // OpenAI TTS 默认返回二进制音频流
    // 部分兼容服务返回 JSON（含 url 字段）
    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      // JSON 响应：直接取 url
      const data = await response.json() as any;
      return {
        success: true,
        url: data.url || data.audio_url,
        metadata: {
          type: 'tts',
          model: 'tts-1-hd',
        },
      };
    }

    // 二进制响应：转为 blob URL（浏览器环境）
    if (typeof window !== 'undefined' && response.blob) {
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      return {
        success: true,
        url: blobUrl,
        metadata: {
          type: 'tts',
          model: 'tts-1-hd',
        },
      };
    }

    // 非浏览器环境：无法创建 blob URL，返回原始响应信息
    return {
      success: true,
      metadata: {
        type: 'tts',
        model: 'tts-1-hd',
      },
      error: 'TTS 音频已生成，但当前环境无法创建可访问的 URL（需浏览器环境）。',
    };
  } catch (err: any) {
    return {
      success: false,
      metadata: { type: 'tts', model: 'tts-1-hd' },
      error: `TTS 网络错误: ${err.message}`,
    };
  }
}

// ─── 统一入口 ─────────────────────────────────────────────────────────────

/**
 * 主函数：根据 type 路由到对应的生成器
 *
 * 这是 AI 工具调用的统一入口，参数清晰、返回结构化。
 * 可直接注册为 AI 工具供 Agent 调用。
 */
export async function generateMedia(
  request: MediaGenRequest,
  aiService?: AIService,
): Promise<MediaGenResult> {
  const { type, prompt, options } = request;

  switch (type) {
    case 'image':
      return generateImage(prompt, options, aiService);

    case 'video':
      return generateVideo(prompt, options, aiService);

    case 'audio':
      return generateAudio(prompt, options, aiService);

    case 'tts':
      // TTS 的 prompt 实际是要合成的文本
      return generateTTS(prompt, options, aiService);

    default:
      return {
        success: false,
        metadata: { type: type as MediaType, model: 'unknown' },
        error: `不支持的媒体类型: ${type}`,
      };
  }
}
