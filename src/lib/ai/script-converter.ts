/**
 * N-18 万物转剧本引擎 — 将任意文本（小说/影视剧本/游戏脚本）转换为互动叙事结构
 *
 * 设计文档对应组件：N-18 万物转剧本引擎
 * 核心职责：调用 LLM 分析输入文本，提取角色、场景、故事节点和节点边，
 *           输出符合 ChaseDream Creator Studio 数据模型的 StoryNode[] / NodeEdge[] / GameCharacter[] / GameScene[]。
 *
 * 使用方式：
 * ```ts
 * import { convertTextToScript } from '@/lib/ai/script-converter';
 * const result = await convertTextToScript(novelText, { title: '夜色', genre: 'suspense', maxNodes: 20 });
 * // result.characters / result.scenes / result.storyNodes / result.nodeEdges / result.summary
 * ```
 */

import { AIService } from './ai-service';
import { useSettingsStore } from '@/store/use-settings-store';
import type { StoryNode, NodeEdge, NodeType, EdgeType } from '@/lib/types/narrative';
import type { GameCharacter, GameScene } from '@/lib/types/game';

// ─── 对外类型 ────────────────────────────────────────────

/** 转换选项 */
export interface ConvertOptions {
  /** 作品标题（影响 AI 创作倾向，可选） */
  title?: string;
  /** 题材类型（如 suspense / romance / scifi，可选） */
  genre?: string;
  /** 最大节点数（控制生成规模，默认 15） */
  maxNodes?: number;
}

/** 转换结果 */
export interface ConvertResult {
  /** 提取的角色列表 */
  characters: GameCharacter[];
  /** 提取的场景列表 */
  scenes: GameScene[];
  /** 生成的故事节点 */
  storyNodes: StoryNode[];
  /** 生成的节点边（连接关系） */
  nodeEdges: NodeEdge[];
  /** 故事摘要 */
  summary: string;
}

// ─── AI 返回的中间 JSON 结构（用于解析校验）──────────────

/** AI 返回的原始角色结构 */
interface AIRawCharacter {
  id?: string;
  name: string;
  role: string;
  description: string;
  appearNodes?: string[];
  color?: string;
  emoji?: string;
  emotionStates?: { label: string; done: boolean }[];
  visualPrompt?: string;
}

/** AI 返回的原始场景结构 */
interface AIRawScene {
  id?: string;
  name: string;
  location: string;
  lighting: string;
  atmosphere: string;
  refNodes?: string[];
  visualPrompt?: string;
}

/** AI 返回的原始节点结构 */
interface AIRawNode {
  id: string;
  label: string;
  type?: string;
  x?: number;
  y?: number;
}

/** AI 返回的原始边结构 */
interface AIRawEdge {
  from: string;
  to: string;
  label?: string;
  edgeType?: string;
}

/** AI 返回的完整 JSON 结构 */
interface AIRawConvertResult {
  characters: AIRawCharacter[];
  scenes: AIRawScene[];
  storyNodes: AIRawNode[];
  nodeEdges: AIRawEdge[];
  summary: string;
}

// ─── 常量 ────────────────────────────────────────────────

/** 合法的节点类型 */
const VALID_NODE_TYPES: NodeType[] = [
  'start', 'scene', 'choice', 'condition', 'qte', 'ending_good', 'ending_bad',
];

/** 合法的边类型 */
const VALID_EDGE_TYPES: EdgeType[] = [
  'causal', 'conditional', 'parallel', 'exclusive', 'implied',
];

/** 默认最大节点数 */
const DEFAULT_MAX_NODES = 15;

/** 角色调色板（按出现顺序循环分配） */
const CHARACTER_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
  '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52BE80',
];

/** 角色 emoji 候选（按角色定位匹配） */
const ROLE_EMOJI_MAP: Record<string, string> = {
  主角: '🦸',
  主角2: '🦸‍♀️',
  女主: '👩',
  男主: '👨',
  反派: '😈',
  配角: '🧑',
  导师: '🧙',
  朋友: '🤝',
  神秘: '🎭',
};

// ─── 内部工具函数 ────────────────────────────────────────

/**
 * 从设置存储创建 AIService 实例。
 * 如果未配置 API Key，抛出明确错误。
 */
function createAIServiceFromSettings(): AIService {
  const settings = useSettingsStore.getState();
  const hasApiKey =
    settings.apiKeys &&
    Object.values(settings.apiKeys).some((k) => k && k.trim().length > 0);

  if (!hasApiKey) {
    throw new Error(
      '万物转剧本引擎需要 AI 能力，但未检测到 API Key。请在「设置」中配置 AI 提供商的 API Key 后重试。'
    );
  }

  return AIService.fromSettings({
    apiKeys: settings.apiKeys,
    aiProvider: settings.aiProvider,
    aiModelName: settings.aiModelName,
    apiBaseUrl: settings.apiBaseUrl,
    aiModel: settings.aiModel,
  });
}

/**
 * 生成唯一 ID（带前缀）
 */
function generateId(prefix: string, index: number): string {
  return `${prefix}_${Date.now().toString(36)}_${index}`;
}

/**
 * 规范化节点类型，非法值回退为 'scene'
 */
function normalizeNodeType(raw?: string): NodeType {
  if (raw && VALID_NODE_TYPES.includes(raw as NodeType)) {
    return raw as NodeType;
  }
  return 'scene';
}

/**
 * 规范化边类型，非法值回退为 'causal'
 */
function normalizeEdgeType(raw?: string): EdgeType {
  if (raw && VALID_EDGE_TYPES.includes(raw as EdgeType)) {
    return raw as EdgeType;
  }
  return 'causal';
}

/**
 * 根据角色定位推导 emoji
 */
function inferEmoji(role: string): string {
  for (const [key, emoji] of Object.entries(ROLE_EMOJI_MAP)) {
    if (role.includes(key)) return emoji;
  }
  return '🧑';
}

/**
 * 根据索引分配角色颜色
 */
function pickColor(index: number): string {
  return CHARACTER_COLORS[index % CHARACTER_COLORS.length];
}

/**
 * 将 AI 返回的原始角色转换为 GameCharacter
 */
function toGameCharacter(raw: AIRawCharacter, index: number): GameCharacter {
  const id = raw.id && raw.id.trim() ? raw.id : generateId('char', index);
  return {
    id,
    name: raw.name || `角色${index + 1}`,
    role: raw.role || '配角',
    description: raw.description || '',
    appearNodes: Array.isArray(raw.appearNodes) ? raw.appearNodes : [],
    color: raw.color || pickColor(index),
    emoji: raw.emoji || inferEmoji(raw.role || ''),
    emotionStates: Array.isArray(raw.emotionStates) ? raw.emotionStates : [],
    visualPrompt: raw.visualPrompt || raw.description || '',
  };
}

/**
 * 将 AI 返回的原始场景转换为 GameScene
 */
function toGameScene(raw: AIRawScene, index: number): GameScene {
  const id = raw.id && raw.id.trim() ? raw.id : generateId('scene', index);
  return {
    id,
    name: raw.name || `场景${index + 1}`,
    location: raw.location || '',
    lighting: raw.lighting || '自然光',
    atmosphere: raw.atmosphere || '',
    refNodes: Array.isArray(raw.refNodes) ? raw.refNodes : [],
    hasImage: false,
    visualPrompt: raw.visualPrompt || `${raw.location} ${raw.atmosphere}`,
  };
}

/**
 * 将 AI 返回的原始节点转换为 StoryNode
 * 自动为节点分配网格坐标（避免重叠）
 */
function toStoryNode(raw: AIRawNode, index: number): StoryNode {
  const id = raw.id && raw.id.trim() ? raw.id : generateId('node', index);
  // 网格布局：每行 4 个节点，间距 250px
  const col = index % 4;
  const row = Math.floor(index / 4);
  return {
    id,
    label: raw.label || `节点${index + 1}`,
    type: normalizeNodeType(raw.type),
    x: raw.x ?? col * 250,
    y: raw.y ?? row * 200,
  };
}

/**
 * 将 AI 返回的原始边转换为 NodeEdge
 */
function toNodeEdge(raw: AIRawEdge): NodeEdge {
  return {
    from: raw.from,
    to: raw.to,
    label: raw.label,
    edgeType: normalizeEdgeType(raw.edgeType),
  };
}

/**
 * 安全解析 JSON，支持从 Markdown 代码块中提取
 */
function parseJSON<T>(text: string): T | null {
  try {
    return JSON.parse(text) as T;
  } catch {
    // 尝试从 Markdown 代码块中提取
    const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      try {
        return JSON.parse(codeBlockMatch[1].trim()) as T;
      } catch {
        return null;
      }
    }
    // 尝试提取第一个 { 到最后一个 } 之间的内容
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      try {
        return JSON.parse(text.slice(start, end + 1)) as T;
      } catch {
        return null;
      }
    }
    return null;
  }
}

/**
 * 校验并修复 AI 返回的数据完整性
 * - 确保至少有一个 start 节点
 * - 过滤引用不存在节点的边
 * - 限制节点数量
 */
function sanitizeResult(raw: AIRawConvertResult, maxNodes: number): ConvertResult {
  // 限制节点数量
  const limitedNodes = raw.storyNodes.slice(0, maxNodes);
  const nodeIds = new Set(limitedNodes.map((n) => n.id));

  // 确保至少有一个 start 节点
  const hasStart = limitedNodes.some((n) => n.type === 'start');
  if (!hasStart && limitedNodes.length > 0) {
    limitedNodes[0] = { ...limitedNodes[0], type: 'start' as NodeType };
  }

  // 过滤引用不存在节点的边
  const validEdges = raw.nodeEdges.filter(
    (e) => nodeIds.has(e.from) && nodeIds.has(e.to)
  );

  // 收集所有节点 ID 用于角色/场景的 refNodes 过滤
  const allNodeIds = new Set(limitedNodes.map((n) => n.id));

  const characters = (raw.characters || []).map((c, i) => {
    const converted = toGameCharacter(c, i);
    // 过滤掉引用不存在节点的 appearNodes
    converted.appearNodes = converted.appearNodes.filter((id) => allNodeIds.has(id));
    return converted;
  });

  const scenes = (raw.scenes || []).map((s, i) => {
    const converted = toGameScene(s, i);
    // 过滤掉引用不存在节点的 refNodes
    converted.refNodes = converted.refNodes.filter((id) => allNodeIds.has(id));
    return converted;
  });

  const storyNodes = limitedNodes.map((n, i) => toStoryNode(n, i));
  const nodeEdges = validEdges.map((e) => toNodeEdge(e));

  return {
    characters,
    scenes,
    storyNodes,
    nodeEdges,
    summary: raw.summary || '（未生成摘要）',
  };
}

// ─── 提示词构建 ──────────────────────────────────────────

/**
 * 构建系统提示词
 */
function buildSystemPrompt(): string {
  return [
    '你是一位资深的互动叙事设计师，专精于将小说、影视剧本、游戏脚本等各类叙事文本转换为可玩的互动叙事结构。',
    '你熟悉分支叙事、状态机、QTE、多结局等互动影游设计模式，能够准确识别文本中的角色、场景、关键情节节点和分支关系。',
    '',
    '你的输出必须是严格的 JSON 格式，包含以下字段：',
    '{',
    '  "characters": [{ "name": string, "role": string, "description": string, "appearNodes": string[], "visualPrompt": string, "emoji": string }],',
    '  "scenes": [{ "name": string, "location": string, "lighting": string, "atmosphere": string, "refNodes": string[], "visualPrompt": string }],',
    '  "storyNodes": [{ "id": string, "label": string, "type": "start"|"scene"|"choice"|"condition"|"qte"|"ending_good"|"ending_bad", "x": number, "y": number }],',
    '  "nodeEdges": [{ "from": string, "to": string, "label": string, "edgeType": "causal"|"conditional"|"parallel"|"exclusive"|"implied" }],',
    '  "summary": string',
    '}',
    '',
    '节点类型说明：',
    '- start: 故事起点（必须有且仅有一个）',
    '- scene: 普通场景节点',
    '- choice: 玩家选择分支点',
    '- condition: 条件判断节点',
    '- qte: 快速反应事件节点',
    '- ending_good: 好结局',
    '- ending_bad: 坏结局',
    '',
    '边类型说明：',
    '- causal: 因果关系（A 发生后 B 发生）',
    '- conditional: 条件分支（满足条件才走这条边）',
    '- parallel: 平行叙事',
    '- exclusive: 互斥分支（选了 A 就不能选 B）',
    '- implied: 隐含联系',
    '',
    '设计要求：',
    '1. 节点 ID 使用 "node_1", "node_2" 等格式，确保唯一',
    '2. 角色出现节点（appearNodes）和场景引用节点（refNodes）必须引用实际存在的节点 ID',
    '3. 边的 from 和 to 必须引用实际存在的节点 ID',
    '4. 节点坐标 x/y 用于画布布局，按从左到右、从上到下的阅读顺序排列',
    '5. 确保从 start 节点出发能到达至少一个结局节点',
    '6. summary 用中文概括故事主线和核心冲突',
    '7. 所有文本内容使用中文',
  ].join('\n');
}

/**
 * 构建用户提示词
 */
function buildUserPrompt(text: string, options: ConvertOptions): string {
  const maxNodes = options.maxNodes ?? DEFAULT_MAX_NODES;
  const lines = [
    '请将以下文本转换为互动叙事结构。',
    '',
  ];
  if (options.title) {
    lines.push(`作品标题：${options.title}`);
  }
  if (options.genre) {
    lines.push(`题材类型：${options.genre}`);
  }
  lines.push(`目标节点数：不超过 ${maxNodes} 个`);
  lines.push('');
  lines.push('【待转换文本】');
  lines.push(text);
  lines.push('');
  lines.push('【输出要求】');
  lines.push('请直接输出 JSON，不要包含任何解释性文字或 Markdown 标记。');
  lines.push('JSON 必须包含 characters、scenes、storyNodes、nodeEdges、summary 五个字段。');

  return lines.join('\n');
}

// ─── 主函数 ──────────────────────────────────────────────

/**
 * 将文本转换为互动叙事结构
 *
 * @param text 待转换的文本（小说/影视剧本/游戏脚本）
 * @param options 转换选项（标题、题材、最大节点数）
 * @param aiService 可选的 AIService 实例（用于依赖注入，未提供时从设置存储创建）
 * @returns 转换结果，包含角色、场景、故事节点、节点边和摘要
 * @throws 未配置 API Key 时抛出明确错误
 */
export async function convertTextToScript(
  text: string,
  options: ConvertOptions = {},
  aiService?: AIService
): Promise<ConvertResult> {
  // 输入校验
  if (!text || text.trim().length === 0) {
    throw new Error('转换文本不能为空');
  }

  const maxNodes = options.maxNodes ?? DEFAULT_MAX_NODES;
  if (maxNodes < 1 || maxNodes > 100) {
    throw new Error('maxNodes 必须在 1-100 之间');
  }

  // 获取或创建 AIService
  const service = aiService ?? createAIServiceFromSettings();

  // 构建提示词并调用 AI
  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt(text, options);

  const response = await service.complete(
    systemPrompt,
    userPrompt,
    'convert_to_script'
  );

  if (!response.success || !response.data) {
    throw new Error(
      `AI 调用失败：${response.error || '未返回有效内容'}`
    );
  }

  // 解析 AI 返回的 JSON
  const parsed = parseJSON<AIRawConvertResult>(response.data);
  if (!parsed) {
    throw new Error(
      'AI 返回内容解析失败：无法识别为有效 JSON。请检查 AI 模型是否支持 JSON 输出，或重试。'
    );
  }

  // 校验必要字段
  if (!Array.isArray(parsed.storyNodes) || parsed.storyNodes.length === 0) {
    throw new Error('AI 返回数据不完整：缺少 storyNodes 或为空');
  }

  // 校验并修复数据完整性
  return sanitizeResult(parsed, maxNodes);
}

/**
 * 批量转换：将多段文本分别转换后合并
 *
 * 适用于长篇文本分段处理的场景。每段文本独立转换，
 * 最后将所有角色、场景、节点合并，并自动连接各段末尾节点到下一段起始节点。
 *
 * @param segments 文本段数组
 * @param options 转换选项
 * @param aiService 可选的 AIService 实例
 * @returns 合并后的转换结果
 */
export async function convertTextSegmentsToScript(
  segments: string[],
  options: ConvertOptions = {},
  aiService?: AIService
): Promise<ConvertResult> {
  if (segments.length === 0) {
    throw new Error('文本段数组不能为空');
  }

  if (segments.length === 1) {
    return convertTextToScript(segments[0], options, aiService);
  }

  const service = aiService ?? createAIServiceFromSettings();
  const perSegmentMaxNodes = Math.floor((options.maxNodes ?? DEFAULT_MAX_NODES) / segments.length);

  // 逐段转换
  const results = await Promise.all(
    segments.map((seg) =>
      convertTextToScript(
        seg,
        { ...options, maxNodes: Math.max(3, perSegmentMaxNodes) },
        service
      )
    )
  );

  // 合并结果
  const allCharacters: GameCharacter[] = [];
  const allScenes: GameScene[] = [];
  const allNodes: StoryNode[] = [];
  const allEdges: NodeEdge[] = [];
  const summaries: string[] = [];

  // 用于 ID 去重和重映射
  const characterIdMap = new Map<string, string>();
  const sceneIdMap = new Map<string, string>();
  const nodeIdMap = new Map<string, string>();

  let charIndex = 0;
  let sceneIndex = 0;
  let nodeIndex = 0;
  let lastNodeOfPrevSegment: string | null = null;

  for (let segIdx = 0; segIdx < results.length; segIdx++) {
    const result = results[segIdx];

    // 合并角色（按名称去重）
    for (const char of result.characters) {
      const existing = allCharacters.find((c) => c.name === char.name);
      if (existing) {
        characterIdMap.set(char.id, existing.id);
        // 合并出现节点
        existing.appearNodes = [...new Set([...existing.appearNodes, ...char.appearNodes])];
      } else {
        const newId = generateId('char', charIndex++);
        characterIdMap.set(char.id, newId);
        allCharacters.push({ ...char, id: newId });
      }
    }

    // 合并场景（按名称去重）
    for (const scene of result.scenes) {
      const existing = allScenes.find((s) => s.name === scene.name);
      if (existing) {
        sceneIdMap.set(scene.id, existing.id);
        existing.refNodes = [...new Set([...existing.refNodes, ...scene.refNodes])];
      } else {
        const newId = generateId('scene', sceneIndex++);
        sceneIdMap.set(scene.id, newId);
        allScenes.push({ ...scene, id: newId });
      }
    }

    // 合并节点（重映射 ID 避免冲突）
    const segmentNodeIds: string[] = [];
    for (const node of result.storyNodes) {
      const newId = generateId('node', nodeIndex++);
      nodeIdMap.set(node.id, newId);
      // 调整坐标：每段向右偏移
      const xOffset = segIdx * 1200;
      allNodes.push({ ...node, id: newId, x: node.x + xOffset, y: node.y });
      segmentNodeIds.push(newId);
    }

    // 合并边（重映射 from/to）
    for (const edge of result.nodeEdges) {
      const newFrom = nodeIdMap.get(edge.from);
      const newTo = nodeIdMap.get(edge.to);
      if (newFrom && newTo) {
        allEdges.push({
          ...edge,
          from: newFrom,
          to: newTo,
        });
      }
    }

    // 连接上一段末尾节点到当前段首个节点
    if (lastNodeOfPrevSegment && segmentNodeIds.length > 0) {
      allEdges.push({
        from: lastNodeOfPrevSegment,
        to: segmentNodeIds[0],
        label: '衔接',
        edgeType: 'causal',
      });
    }

    // 更新上一段末尾节点（取当前段最后一个非结局节点，否则取最后一个节点）
    const lastNonEnding = [...segmentNodeIds].reverse().find((id) => {
      const node = allNodes.find((n) => n.id === id);
      return node && node.type !== 'ending_good' && node.type !== 'ending_bad';
    });
    lastNodeOfPrevSegment = lastNonEnding ?? segmentNodeIds[segmentNodeIds.length - 1] ?? null;

    summaries.push(result.summary);
  }

  return {
    characters: allCharacters,
    scenes: allScenes,
    storyNodes: allNodes,
    nodeEdges: allEdges,
    summary: summaries.join('\n\n---\n\n'),
  };
}
