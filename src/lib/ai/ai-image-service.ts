/**
 * AI 图像生成服务 — 对接 DALL-E / Stable Diffusion / 通义万象
 *
 * 提供统一的图像生成接口，支持：
 * - 角色立绘生成（基于 visualPrompt）
 * - 场景背景图生成（基于 scene description）
 * - 道具图生成（基于 prop description）
 * - 风格锁定（确保同一项目内风格一致）
 * - 批量生成队列
 */

// ─── 类型定义 ────────────────────────────────────────────

export type ImageProvider = 'dalle' | 'stable-diffusion' | 'wanxiang' | 'mock';

export interface ImageGenRequest {
  prompt: string;
  negativePrompt?: string;
  style?: string;
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
  quality?: 'standard' | 'hd';
  provider?: ImageProvider;
}

export interface ImageGenResult {
  success: boolean;
  imageUrl?: string;
  revisedPrompt?: string;
  error?: string;
  provider?: ImageProvider;
  model?: string;
  seed?: number;
}

export interface ImageGenQueueItem {
  id: string;
  type: 'character' | 'scene' | 'prop' | 'custom';
  entityId: string;
  entityName: string;
  request: ImageGenRequest;
  status: 'pending' | 'generating' | 'done' | 'failed';
  result?: ImageGenResult;
  createdAt: number;
}

export interface StylePreset {
  id: string;
  name: string;
  description: string;
  promptSuffix: string;
  negativePrompt?: string;
  preview: string;
}

// ─── 风格预设库 ──────────────────────────────────────────

export const STYLE_PRESETS: StylePreset[] = [
  {
    id: 'anime',
    name: '日系动漫',
    description: '赛璐璐风格、大眼睛、鲜艳配色',
    promptSuffix: 'anime style, cel shading, vibrant colors, detailed illustration, studio ghibli quality',
    negativePrompt: 'photorealistic, 3d render, low quality, blurry',
    preview: 'linear-gradient(135deg, #FF6B9D, #C44569, #F8B500)',
  },
  {
    id: 'realistic',
    name: '写实风格',
    description: '照片级写实、光影细腻',
    promptSuffix: 'photorealistic, highly detailed, cinematic lighting, 8k quality, professional photography',
    negativePrompt: 'cartoon, anime, illustration, painting, low quality',
    preview: 'linear-gradient(135deg, #2C3E50, #4CA1AF, #C4E0E5)',
  },
  {
    id: 'watercolor',
    name: '水彩手绘',
    description: '柔和水彩、艺术感强',
    promptSuffix: 'watercolor painting, soft edges, pastel colors, artistic, hand-painted, delicate brushstrokes',
    negativePrompt: 'digital art, photorealistic, sharp edges, 3d',
    preview: 'linear-gradient(135deg, #F8E9A1, #F7D794, #E8A87C)',
  },
  {
    id: 'pixel',
    name: '像素复古',
    description: '8-bit/16-bit 像素风格',
    promptSuffix: 'pixel art, 16-bit, retro game style, clean pixels, limited color palette',
    negativePrompt: 'photorealistic, 3d, smooth, blurry, high resolution',
    preview: 'linear-gradient(135deg, #6C5CE7, #00B894, #FDCB6E)',
  },
  {
    id: 'ink',
    name: '水墨国风',
    description: '中国传统水墨画风格',
    promptSuffix: 'chinese ink painting, sumi-e, traditional chinese art, flowing brushwork, minimalist, rice paper texture',
    negativePrompt: 'digital art, photorealistic, anime, vibrant colors',
    preview: 'linear-gradient(135deg, #2C3E50, #95A5A6, #ECF0F1)',
  },
  {
    id: 'cyberpunk',
    name: '赛博朋克',
    description: '霓虹灯光、科技感、暗色调',
    promptSuffix: 'cyberpunk style, neon lights, futuristic, dark atmosphere, rain, holographic, sci-fi, blade runner aesthetic',
    negativePrompt: 'natural, bright, daylight, medieval, fantasy',
    preview: 'linear-gradient(135deg, #0A0E1A, #FF00FF, #00FFFF)',
  },
];

// ─── 图像生成核心函数 ────────────────────────────────────

/**
 * 通过 DALL-E API 生成图像
 */
async function generateViaDalle(request: ImageGenRequest, apiKey: string, baseUrl?: string): Promise<ImageGenResult> {
  const endpoint = baseUrl || 'https://api.openai.com/v1';
  const sizeMap: Record<string, string> = {
    '1:1': '1024x1024', '16:9': '1792x1024', '9:16': '1024x1792',
    '4:3': '1024x1024', '3:4': '1024x1024',
  };

  try {
    const response = await fetch(`${endpoint}/images/generations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: request.prompt,
        n: 1,
        size: sizeMap[request.aspectRatio || '1:1'] || '1024x1024',
        quality: request.quality || 'standard',
        response_format: 'url',
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      return { success: false, error: `DALL-E API 错误: ${(errData as any).error?.message || response.statusText}`, provider: 'dalle' };
    }

    const data = await response.json() as any;
    const image = data.data?.[0];
    return {
      success: true,
      imageUrl: image?.url,
      revisedPrompt: image?.revised_prompt,
      provider: 'dalle',
      model: 'dall-e-3',
    };
  } catch (err: any) {
    return { success: false, error: `网络错误: ${err.message}`, provider: 'dalle' };
  }
}

/**
 * 通过 Stable Diffusion API 生成图像
 */
async function generateViaSD(request: ImageGenRequest, apiKey: string, baseUrl?: string): Promise<ImageGenResult> {
  const endpoint = baseUrl || 'https://api.stability.ai';

  const sizeMap: Record<string, { width: number; height: number }> = {
    '1:1': { width: 1024, height: 1024 },
    '16:9': { width: 1344, height: 768 },
    '9:16': { width: 768, height: 1344 },
    '4:3': { width: 1152, height: 896 },
    '3:4': { width: 896, height: 1152 },
  };

  const size = sizeMap[request.aspectRatio || '1:1'] || { width: 1024, height: 1024 };

  try {
    const response = await fetch(`${endpoint}/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        text_prompts: [
          { text: request.prompt, weight: 1 },
          ...(request.negativePrompt ? [{ text: request.negativePrompt, weight: -1 }] : []),
        ],
        cfg_scale: 7,
        width: size.width,
        height: size.height,
        steps: 30,
        samples: 1,
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      return { success: false, error: `SD API 错误: ${(errData as any).message || response.statusText}`, provider: 'stable-diffusion' };
    }

    const data = await response.json() as any;
    const artifact = data.artifacts?.[0];
    const imageUrl = artifact?.base64 ? `data:image/png;base64,${artifact.base64}` : artifact?.url;

    return {
      success: true,
      imageUrl,
      provider: 'stable-diffusion',
      model: 'stable-diffusion-xl-1024',
      seed: artifact?.seed,
    };
  } catch (err: any) {
    return { success: false, error: `网络错误: ${err.message}`, provider: 'stable-diffusion' };
  }
}

/**
 * 模拟图像生成（无 API Key 时使用）
 */
async function generateMock(request: ImageGenRequest): Promise<ImageGenResult> {
  // Simulate generation delay
  await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 2000));

  // Return a placeholder image URL from Unsplash based on prompt keywords
  const keywords = request.prompt.split(' ').slice(0, 3).join(',');
  const placeholderUrl = `https://source.unsplash.com/800x800/?${encodeURIComponent(keywords)}`;

  return {
    success: true,
    imageUrl: placeholderUrl,
    revisedPrompt: `[模拟生成] ${request.prompt}`,
    provider: 'mock',
    model: 'mock-generator',
    seed: Math.floor(Math.random() * 999999),
  };
}

// ─── 统一生成入口 ────────────────────────────────────────

export interface ImageGenConfig {
  apiKey?: string;
  baseUrl?: string;
  provider?: ImageProvider;
  stylePresetId?: string;
}

/**
 * 统一图像生成函数 — 根据配置自动路由到对应 provider
 */
export async function generateImage(
  request: ImageGenRequest,
  config: ImageGenConfig = {},
): Promise<ImageGenResult> {
  const provider = request.provider || config.provider || (config.apiKey ? 'dalle' : 'mock');
  const stylePreset = config.stylePresetId
    ? STYLE_PRESETS.find(p => p.id === config.stylePresetId)
    : undefined;

  // Apply style preset to prompt
  let enhancedPrompt = request.prompt;
  if (stylePreset) {
    enhancedPrompt = `${request.prompt}, ${stylePreset.promptSuffix}`;
  }

  const enhancedRequest = { ...request, prompt: enhancedPrompt };

  switch (provider) {
    case 'dalle':
      if (!config.apiKey) return generateMock(enhancedRequest);
      return generateViaDalle(enhancedRequest, config.apiKey, config.baseUrl);

    case 'stable-diffusion':
      if (!config.apiKey) return generateMock(enhancedRequest);
      return generateViaSD(enhancedRequest, config.apiKey, config.baseUrl);

    case 'mock':
    default:
      return generateMock(enhancedRequest);
  }
}

// ─── 业务级生成函数 ──────────────────────────────────────

/**
 * 为角色生成立绘
 */
export async function generateCharacterPortrait(
  characterName: string,
  visualPrompt: string,
  stylePresetId?: string,
  config?: ImageGenConfig,
): Promise<ImageGenResult> {
  const prompt = `character portrait of ${characterName}, ${visualPrompt}, full body, concept art, high quality illustration`;
  return generateImage(
    { prompt, aspectRatio: '3:4', quality: 'hd' },
    { ...config, stylePresetId },
  );
}

/**
 * 为场景生成背景图
 */
export async function generateSceneBackground(
  sceneName: string,
  atmosphere: string,
  stylePresetId?: string,
  config?: ImageGenConfig,
): Promise<ImageGenResult> {
  const prompt = `scene background, ${sceneName}, ${atmosphere}, wide angle, establishing shot, no characters, detailed environment`;
  return generateImage(
    { prompt, aspectRatio: '16:9', quality: 'hd' },
    { ...config, stylePresetId },
  );
}

/**
 * 为道具生成图片
 */
export async function generatePropImage(
  propName: string,
  description: string,
  stylePresetId?: string,
  config?: ImageGenConfig,
): Promise<ImageGenResult> {
  const prompt = `game prop item, ${propName}, ${description}, centered on clean background, detailed object illustration`;
  return generateImage(
    { prompt, aspectRatio: '1:1', quality: 'standard' },
    { ...config, stylePresetId },
  );
}

// ─── 批量生成队列 ────────────────────────────────────────

export class ImageGenQueue {
  private queue: ImageGenQueueItem[] = [];
  private running = false;
  private config: ImageGenConfig;
  private onProgress?: (item: ImageGenQueueItem, index: number, total: number) => void;
  private onComplete?: (results: ImageGenQueueItem[]) => void;

  constructor(config: ImageGenConfig = {}) {
    this.config = config;
  }

  /** 添加生成任务到队列 */
  addItem(
    type: ImageGenQueueItem['type'],
    entityId: string,
    entityName: string,
    request: ImageGenRequest,
  ): string {
    const id = `img-gen-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    this.queue.push({
      id, type, entityId, entityName, request,
      status: 'pending',
      createdAt: Date.now(),
    });
    return id;
  }

  /** 设置进度回调 */
  onProgressUpdate(cb: (item: ImageGenQueueItem, index: number, total: number) => void) {
    this.onProgress = cb;
  }

  /** 设置完成回调 */
  onQueueComplete(cb: (results: ImageGenQueueItem[]) => void) {
    this.onComplete = cb;
  }

  /** 开始执行队列 */
  async start(): Promise<ImageGenQueueItem[]> {
    if (this.running) return [];
    this.running = true;

    for (let i = 0; i < this.queue.length; i++) {
      const item = this.queue[i];
      item.status = 'generating';
      this.onProgress?.(item, i, this.queue.length);

      try {
        const result = await generateImage(item.request, this.config);
        item.result = result;
        item.status = result.success ? 'done' : 'failed';
      } catch (err: any) {
        item.result = { success: false, error: err.message, provider: 'mock' };
        item.status = 'failed';
      }

      this.onProgress?.(item, i, this.queue.length);
    }

    this.running = false;
    this.onComplete?.(this.queue);
    return this.queue;
  }

  /** 获取队列状态 */
  getStatus() {
    return {
      total: this.queue.length,
      pending: this.queue.filter(i => i.status === 'pending').length,
      generating: this.queue.filter(i => i.status === 'generating').length,
      done: this.queue.filter(i => i.status === 'done').length,
      failed: this.queue.filter(i => i.status === 'failed').length,
      isRunning: this.running,
    };
  }

  /** 清空队列 */
  clear() {
    this.queue = [];
    this.running = false;
  }
}
