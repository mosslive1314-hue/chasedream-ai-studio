/**
 * NPC 灵魂引擎
 *
 * 管理角色的人格向量、记忆和行为。
 *
 * 核心原则：「灵魂不能凌驾于逻辑之上」
 * 灵魂引擎只影响「如何表达」（语气、措辞、情绪色彩），
 * 不影响「什么表达」（剧情走向、关键信息、逻辑判断）。
 * 即：灵魂引擎生成的是 style prompt，注入到 AI 提示词中，
 * 让 AI 在保持剧情逻辑的前提下，用符合角色人格的方式表达。
 *
 * 设计要点：
 * 1. 人格向量五维度：核心动机 / 信息边界 / 情绪反应 / 语言风格 / 关系权重
 * 2. 记忆系统：短期/长期/情景三类，带衰减机制
 * 3. 记忆检索：按重要度 × 时间衰减 × 相关性综合排序
 * 4. 情绪状态：当前情绪可被事件触发，影响表达风格
 */

import type { GameCharacter } from '@/lib/types/game';
import type { AIService } from '@/lib/ai/ai-service';
import { useNpcStore } from '@/store/use-npc-store';

// ─── 类型定义 ─────────────────────────────────────────────────────────────

/** 人格向量五维度 */
export interface PersonalityVector {
  /** 核心动机：驱动角色行动的根本目的 */
  core_motivation: string[];
  /** 信息边界：角色知道什么、不知道什么、不确定什么 */
  info_boundaries: {
    knows: string[];
    unknown: string[];
    uncertain: string[];
  };
  /** 情绪反应模式：什么触发什么情绪，强度如何 */
  emotional_response: {
    trigger: string;
    response: string;
    intensity: number; // 0-100
  }[];
  /** 语言风格特征 */
  language_style: {
    formality: number;   // 0-100，0=随意，100=正式
    verbosity: number;   // 0-100，0=简洁，100=啰嗦
    tone: string;        // 如"冷静"、"热情"、"讽刺"
  };
  /** 与其他角色的关系权重 -100~100（-100=敌对，100=亲密） */
  relationship_weights: Record<string, number>;
}

/** 记忆类型 */
export type MemoryType = 'short_term' | 'long_term' | 'episodic';

/** 单条记忆条目 */
export interface MemoryEntry {
  id: string;
  type: MemoryType;
  content: string;
  timestamp: string;
  importance: number; // 0-100
  relatedCharacterIds?: string[];
  relatedNodeId?: string;
  /** 遗忘速率：短期高、长期低。每调用一次 decayMemories，importance 按此比例衰减 */
  decayRate: number;
}

/** 当前情绪状态 */
export interface CurrentMood {
  emotion: string;
  intensity: number; // 0-100
  trigger?: string;
}

/** NPC 完整灵魂状态 */
export interface NpcSoul {
  characterId: string;
  personality: PersonalityVector;
  memories: MemoryEntry[];
  currentMood: CurrentMood;
}

// ─── 工具函数 ─────────────────────────────────────────────────────────────

/** 生成记忆唯一 ID */
function genMemoryId(): string {
  return `MEM${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

/** 将数值限制在 [min, max] 区间 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * 计算记忆的当前权重（用于检索排序）
 *
 * 权重 = importance × (1 - decayRate × timeElapsedHours / 24)
 *
 * - importance 越高权重越高
 * - decayRate 越高衰减越快（短期记忆 decayRate 高）
 * - 时间越久权重越低，但不会降到 0 以下
 */
function computeMemoryWeight(memory: MemoryEntry, now: number = Date.now()): number {
  const createdTime = new Date(memory.timestamp).getTime();
  const elapsedHours = Math.max(0, (now - createdTime) / (1000 * 60 * 60));
  // 衰减因子：每经过 decayRate × 24 小时，importance 衰减 decayRate 比例
  // 这里用线性衰减，保证长期记忆（decayRate 低）衰减慢
  const decayFactor = Math.max(0, 1 - (memory.decayRate * elapsedHours) / 24);
  return memory.importance * decayFactor;
}

// ─── 默认人格向量生成 ─────────────────────────────────────────────────────

/**
 * 基于角色描述推断默认人格向量（无 AI 时使用）
 *
 * 通过角色 role / description / emoji 等字段做启发式推断，
 * 生成一个合理的初始人格向量，后续可由 AI 细化。
 */
function inferDefaultPersonality(character: GameCharacter): PersonalityVector {
  const desc = character.description || '';
  const role = character.role || '';

  // 根据 role 推断语言正式度
  let formality = 50;
  const formalRoles = ['国王', '女王', '将军', '导师', '长老', '法官', '贵族', '骑士'];
  const casualRoles = ['少年', '少女', '盗贼', '流浪者', '酒鬼', '小偷'];
  if (formalRoles.some((r) => role.includes(r))) formality = 80;
  else if (casualRoles.some((r) => role.includes(r))) formality = 25;

  // 根据 emoji 推断语气基调
  const toneMap: Record<string, string> = {
    '😎': '自信',
    '😊': '温和',
    '😠': '暴躁',
    '😢': '忧郁',
    '🤔': '深思',
    '😈': '阴险',
    '😇': '圣洁',
    '🥷': '冷静',
    '🧙': '神秘',
    '👑': '威严',
  };
  const tone = toneMap[character.emoji] ?? '中性';

  return {
    core_motivation: desc
      ? [desc.split(/[。.！!？?\n]/)[0]?.trim() || '生存与自我实现']
      : ['生存与自我实现'],
    info_boundaries: {
      knows: [role ? `作为${role}的常识` : '基本常识'],
      unknown: ['其他角色的私密信息'],
      uncertain: ['未来的走向'],
    },
    emotional_response: [
      { trigger: '被威胁', response: '警惕防御', intensity: 70 },
      { trigger: '被信任', response: '回报信任', intensity: 50 },
      { trigger: '遭遇不公', response: '愤怒', intensity: 60 },
    ],
    language_style: {
      formality,
      verbosity: 50,
      tone,
    },
    relationship_weights: {},
  };
}

/**
 * 构建 AI 推断人格向量的提示词
 */
function buildPersonalityPrompt(character: GameCharacter): { system: string; user: string } {
  const system = `你是一位角色人格分析专家。根据给定的角色信息，推断其人格向量。
请严格返回 JSON 格式，包含以下字段：
- core_motivation: string[]（核心动机，2-4 条）
- info_boundaries: { knows: string[], unknown: string[], uncertain: string[] }
- emotional_response: { trigger: string, response: string, intensity: number }[]（3-5 条，intensity 0-100）
- language_style: { formality: number, verbosity: number, tone: string }（formality/verbosity 0-100）
- relationship_weights: Record<string, number>（可为空对象）

只返回 JSON，不要任何解释文字。`;

  const user = `角色信息：
- 姓名：${character.name}
- 身份：${character.role}
- 描述：${character.description}
- 视觉特征：${character.visualPrompt}
- 情绪状态：${character.emotionStates?.map((e) => e.label).join('、') || '无'}

请分析这个角色的人格向量。`;

  return { system, user };
}

// ─── NPC 灵魂引擎主类 ─────────────────────────────────────────────────────

/**
 * NpcSoulEngine — NPC 灵魂引擎
 *
 * 所有状态读写都委托给 useNpcStore（Zustand persist），
 * 引擎本身是无状态的，便于在任意上下文调用。
 *
 * 核心原则：灵魂引擎只影响「如何表达」，不影响「什么表达」。
 * generateStylePrompt 生成的提示词应注入到 AI 对话的 system prompt 中，
 * 让 AI 在保持剧情逻辑的前提下用符合人格的方式表达。
 */
export class NpcSoulEngine {
  /**
   * 生成人格向量
   *
   * - 若提供 aiService，则调用 AI 进行深度推断
   * - 若未提供 aiService 或 AI 调用失败，则回退到启发式推断
   *
   * 生成后自动写入 store（通过 initSoul / setPersonality）。
   */
  async generatePersonality(
    character: GameCharacter,
    aiService?: AIService,
  ): Promise<PersonalityVector> {
    // 无 AI 服务时直接走启发式推断
    if (!aiService) {
      return inferDefaultPersonality(character);
    }

    try {
      const { system, user } = buildPersonalityPrompt(character);
      const response = await aiService.complete(system, user, 'character_generate');

      if (!response.success || !response.data) {
        // AI 调用失败，回退到启发式
        return inferDefaultPersonality(character);
      }

      // 尝试解析 AI 返回的 JSON
      const parsed = this.parsePersonalityJson(response.data);
      if (!parsed) {
        return inferDefaultPersonality(character);
      }

      // 规范化数值范围
      return this.normalizePersonality(parsed);
    } catch {
      // 任何异常都回退到启发式，保证可用性
      return inferDefaultPersonality(character);
    }
  }

  /**
   * 解析 AI 返回的人格向量 JSON
   * 支持 Markdown 代码块包裹的 JSON
   */
  private parsePersonalityJson(text: string): PersonalityVector | null {
    const tryParse = (s: string): PersonalityVector | null => {
      try {
        return JSON.parse(s) as PersonalityVector;
      } catch {
        return null;
      }
    };

    // 直接解析
    const direct = tryParse(text.trim());
    if (direct) return direct;

    // 从 Markdown 代码块提取
    const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      return tryParse(codeBlockMatch[1].trim());
    }

    // 尝试提取第一个 { ... } 块
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return tryParse(jsonMatch[0]);
    }

    return null;
  }

  /**
   * 规范化人格向量：确保数值在合法范围
   */
  private normalizePersonality(p: PersonalityVector): PersonalityVector {
    return {
      core_motivation: Array.isArray(p.core_motivation) ? p.core_motivation : [],
      info_boundaries: {
        knows: Array.isArray(p.info_boundaries?.knows) ? p.info_boundaries.knows : [],
        unknown: Array.isArray(p.info_boundaries?.unknown) ? p.info_boundaries.unknown : [],
        uncertain: Array.isArray(p.info_boundaries?.uncertain) ? p.info_boundaries.uncertain : [],
      },
      emotional_response: Array.isArray(p.emotional_response)
        ? p.emotional_response.map((e) => ({
            trigger: e.trigger || '',
            response: e.response || '',
            intensity: clamp(Number(e.intensity) || 50, 0, 100),
          }))
        : [],
      language_style: {
        formality: clamp(Number(p.language_style?.formality) || 50, 0, 100),
        verbosity: clamp(Number(p.language_style?.verbosity) || 50, 0, 100),
        tone: p.language_style?.tone || '中性',
      },
      relationship_weights: p.relationship_weights ?? {},
    };
  }

  /**
   * 添加记忆
   *
   * 根据 type 自动设置 decayRate：
   * - short_term: 0.3（衰减快，约 3 天后权重降至一半）
   * - long_term: 0.05（衰减慢，约 20 天后权重降至一半）
   * - episodic: 0.1（情景记忆，中等衰减）
   */
  addMemory(
    characterId: string,
    memory: Omit<MemoryEntry, 'id' | 'timestamp'>,
  ): void {
    const decayRateByType: Record<MemoryType, number> = {
      short_term: 0.3,
      long_term: 0.05,
      episodic: 0.1,
    };

    const fullMemory: MemoryEntry = {
      ...memory,
      id: genMemoryId(),
      timestamp: new Date().toISOString(),
      // 若调用方未指定 decayRate，则按 type 默认值
      decayRate: memory.decayRate ?? decayRateByType[memory.type],
    };

    useNpcStore.getState().addMemory(characterId, fullMemory);
  }

  /**
   * 检索相关记忆
   *
   * 排序逻辑：
   * 1. 按 relatedNodeId / relatedCharacterIds 过滤（若提供）
   * 2. 按 query 关键词匹配 content（若提供）
   * 3. 按综合权重降序排序：importance × (1 - decayRate × timeElapsed)
   * 4. 取 limit 条（默认 10）
   *
   * 注意：此方法只读不写，不会修改记忆状态。
   */
  retrieveMemories(
    characterId: string,
    context: {
      currentNodeId?: string;
      relatedCharacterIds?: string[];
      query?: string;
      limit?: number;
    } = {},
  ): MemoryEntry[] {
    const soul = useNpcStore.getState().getSoul(characterId);
    if (!soul || soul.memories.length === 0) return [];

    const limit = context.limit ?? 10;
    const now = Date.now();

    let candidates = [...soul.memories];

    // 1. 按节点 ID 过滤：优先返回与当前节点相关的记忆
    if (context.currentNodeId) {
      const nodeMatched = candidates.filter((m) => m.relatedNodeId === context.currentNodeId);
      // 若有节点匹配的记忆，优先返回这些；否则保留全部（节点上下文不应硬性排除其他记忆）
      if (nodeMatched.length > 0) {
        candidates = nodeMatched;
      }
    }

    // 2. 按关联角色过滤
    if (context.relatedCharacterIds && context.relatedCharacterIds.length > 0) {
      const charMatched = candidates.filter(
        (m) =>
          m.relatedCharacterIds?.some((id) => context.relatedCharacterIds!.includes(id)),
      );
      if (charMatched.length > 0) {
        candidates = charMatched;
      }
    }

    // 3. 按 query 关键词匹配（模糊匹配，不区分大小写）
    if (context.query && context.query.trim().length > 0) {
      const queryLower = context.query.toLowerCase();
      const queryMatched = candidates.filter((m) =>
        m.content.toLowerCase().includes(queryLower),
      );
      // 关键词匹配的记忆优先，但若全部不匹配则保留原候选（避免空结果）
      if (queryMatched.length > 0) {
        candidates = queryMatched;
      }
    }

    // 4. 按综合权重排序并取 top N
    return candidates
      .map((m) => ({ memory: m, weight: computeMemoryWeight(m, now) }))
      .sort((a, b) => b.weight - a.weight)
      .slice(0, limit)
      .map((item) => item.memory);
  }

  /**
   * 更新情绪状态
   *
   * 情绪会影响 generateStylePrompt 的输出，但不会改变记忆或人格向量。
   */
  updateMood(
    characterId: string,
    emotion: string,
    intensity: number,
    trigger?: string,
  ): void {
    useNpcStore.getState().updateMood(
      characterId,
      emotion,
      clamp(intensity, 0, 100),
      trigger,
    );
  }

  /**
   * 生成对话风格提示词
   *
   * ⚠️ 核心方法：这是灵魂引擎影响 AI 表达的唯一出口。
   *
   * 生成的提示词应注入到 AI 对话的 system prompt 中，
   * 让 AI 在保持剧情逻辑的前提下，用符合角色人格的方式表达。
   *
   * 提示词只描述「如何表达」，不包含任何剧情/逻辑指令，
   * 严格遵守「灵魂不能凌驾于逻辑之上」原则。
   */
  generateStylePrompt(characterId: string): string {
    const soul = useNpcStore.getState().getSoul(characterId);
    if (!soul) return '';

    const { personality, currentMood } = soul;
    const parts: string[] = [];

    // ── 语言风格 ──
    const ls = personality.language_style;
    const formalityDesc =
      ls.formality > 66 ? '正式、礼貌' : ls.formality < 33 ? '随意、口语化' : '适中';
    const verbosityDesc =
      ls.verbosity > 66 ? '详细、啰嗦' : ls.verbosity < 33 ? '简洁、精炼' : '适中';
    parts.push(
      `【表达风格】语气${ls.tone}；用词${formalityDesc}；篇幅${verbosityDesc}。`,
    );

    // ── 当前情绪 ──
    if (currentMood.emotion && currentMood.intensity > 0) {
      const moodDesc =
        currentMood.intensity > 66
          ? '强烈'
          : currentMood.intensity > 33
            ? '明显'
            : '轻微';
      parts.push(
        `【当前情绪】${moodDesc}的${currentMood.emotion}${currentMood.trigger ? `（由${currentMood.trigger}引发）` : ''}，表达中应体现这一情绪色彩。`,
      );
    }

    // ── 信息边界（关键：只影响「说什么不知道」，不影响剧情逻辑）──
    const { info_boundaries } = personality;
    if (info_boundaries.unknown.length > 0) {
      parts.push(
        `【信息边界】此角色不知道以下内容，对话中不应主动提及或表现出知晓：${info_boundaries.unknown.join('、')}。`,
      );
    }
    if (info_boundaries.uncertain.length > 0) {
      parts.push(
        `【不确定信息】对此角色而言以下内容是模糊的，表达时应体现犹豫：${info_boundaries.uncertain.join('、')}。`,
      );
    }

    // ── 情绪反应模式（影响对特定触发词的反应方式）──
    if (personality.emotional_response.length > 0) {
      const patterns = personality.emotional_response
        .map((e) => `当遇到「${e.trigger}」时，反应为「${e.response}」`)
        .join('；');
      parts.push(`【情绪反应模式】${patterns}。`);
    }

    // ── 近期记忆（影响表达的连贯性，只取最相关的 3 条）──
    const recentMemories = this.retrieveMemories(characterId, { limit: 3 });
    if (recentMemories.length > 0) {
      const memDesc = recentMemories.map((m) => m.content).join('；');
      parts.push(`【近期记忆】${memDesc}。表达时可自然呼应这些经历，但不要生硬复述。`);
    }

    // ── 关系权重（影响对其他角色的称呼和态度）──
    const relations = Object.entries(personality.relationship_weights);
    if (relations.length > 0) {
      const relDesc = relations
        .map(([id, weight]) => {
          const attitude =
            weight > 50 ? '亲近' : weight > 0 ? '友善' : weight > -50 ? '疏远' : '敌对';
          return `对角色${id}态度${attitude}(${weight})`;
        })
        .join('；');
      parts.push(`【人际关系】${relDesc}。`);
    }

    // 核心约束声明：确保灵魂只影响表达，不影响逻辑
    parts.push(
      `【重要约束】以上风格指引仅影响「如何表达」（语气、措辞、情绪色彩），不得改变剧情走向、关键事实或逻辑判断。当风格指引与剧情逻辑冲突时，以剧情逻辑为准。`,
    );

    return parts.join('\n');
  }

  /**
   * 记忆衰减
   *
   * 定期调用（如每次场景切换时）。对每条记忆：
   * - 按 decayRate 降低 importance
   * - importance 降至 5 以下的记忆标记为可清理（这里直接移除，避免无限堆积）
   *
   * 注意：长期记忆 decayRate 低，衰减慢，能保留很久；
   * 短期记忆 decayRate 高，会较快被遗忘。
   */
  decayMemories(characterId: string): void {
    useNpcStore.getState().decayMemories(characterId);
  }

  /**
   * 获取 NPC 完整灵魂状态
   */
  getSoul(characterId: string): NpcSoul | null {
    return useNpcStore.getState().getSoul(characterId) ?? null;
  }

  /**
   * 初始化灵魂（若不存在则创建）
   *
   * 若未提供 personality，使用空人格向量，后续可通过 setPersonality 设置。
   */
  initSoul(characterId: string, personality?: PersonalityVector): void {
    const existing = useNpcStore.getState().getSoul(characterId);
    if (existing) return; // 已存在不重复初始化

    useNpcStore.getState().initSoul(characterId, personality);
  }
}

// ─── 单例导出 ─────────────────────────────────────────────────────────────

/**
 * NPC 灵魂引擎单例
 *
 * 全局共享一个实例，所有状态读写都走 useNpcStore。
 */
export const npcSoulEngine = new NpcSoulEngine();
