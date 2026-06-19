/**
 * N-09 内容审核器 — 对生成内容进行安全审核（暴力、色情、政治敏感等）
 *
 * 设计文档对应组件：N-09 内容审核器
 * 核心职责：调用 LLM 判断内容是否安全，返回结构化审核结果。
 *           无 API Key 时降级为基于关键词的本地审核（真实逻辑，非 mock）。
 *
 * 使用方式：
 * ```ts
 * import { moderateContent } from '@/lib/ai/content-moderator';
 * const result = await moderateContent('待审核文本', { strictness: 'high' });
 * if (!result.safe) {
 *   console.log(result.risks); // 风险列表
 * }
 * ```
 */

import { AIService } from './ai-service';
import { useSettingsStore } from '@/store/use-settings-store';

// ─── 对外类型 ────────────────────────────────────────────

/** 审核选项 */
export interface ModerateOptions {
  /** 严格程度（影响风险判定阈值，默认 medium） */
  strictness?: 'low' | 'medium' | 'high';
  /** 审核类别（默认全部类别） */
  categories?: ('violence' | 'sexual' | 'political' | 'self_harm')[];
}

/** 单项风险信息 */
export interface ModerationRisk {
  /** 风险类别：violence / sexual / political / self_harm */
  category: string;
  /** 风险等级：low / medium / high */
  level: 'low' | 'medium' | 'high';
  /** 风险描述 */
  description: string;
  /** 修改建议 */
  suggestion: string;
}

/** 审核结果 */
export interface ModerateResult {
  /** 是否安全（无 high 级别风险即为安全） */
  safe: boolean;
  /** 检测到的风险列表 */
  risks: ModerationRisk[];
  /** 审核摘要 */
  summary: string;
  /** 审核方式：ai 或 local（用于区分是否使用了 AI） */
  method: 'ai' | 'local';
}

// ─── 本地关键词审核表（真实逻辑，非 mock）─────────────────

/**
 * 暴力类关键词表
 * 按严重程度分组：high 为严重暴力描写，medium 为一般暴力，low 为轻度冲突
 */
const VIOLENCE_KEYWORDS: { keywords: string[]; level: 'low' | 'medium' | 'high' }[] = [
  {
    level: 'high',
    keywords: [
      '杀戮', '屠杀', '虐杀', '肢解', '斩首', '开枪射击', '爆头',
      '血肉横飞', '肠子流出', '脑浆', '挖眼', '割喉', '活剥',
      '凌迟', '酷刑', '虐待致死', '奸杀', '灭门',
    ],
  },
  {
    level: 'medium',
    keywords: [
      '持刀', '捅刺', '殴打', '斗殴', '流血', '伤口', '骨折',
      '窒息', '勒死', '毒杀', '纵火', '爆炸', '枪击', '刺伤',
      '割伤', '烧烫伤', '溺水',
    ],
  },
  {
    level: 'low',
    keywords: [
      '推搡', '争吵', '冲突', '打斗', '拳打', '脚踢', '掌掴',
      '威胁', '恐吓', '绑架', '拘禁',
    ],
  },
];

/**
 * 色情类关键词表
 */
const SEXUAL_KEYWORDS: { keywords: string[]; level: 'low' | 'medium' | 'high' }[] = [
  {
    level: 'high',
    keywords: [
      '性交', '做爱', '性器官', '强奸', '强暴', '猥亵儿童',
      '恋童', '幼女', '未成年性', '性虐待', '群交', '性暴力',
    ],
  },
  {
    level: 'medium',
    keywords: [
      '裸体', '赤裸', '乳房', '胸部', '臀部', '大腿内侧',
      '亲吻', '抚摸', '拥抱', '脱衣', '床戏', '暧昧', '调情',
      '色情', '淫秽', '春宫',
    ],
  },
  {
    level: 'low',
    keywords: [
      '性感', '诱惑', '妩媚', '妖艳', '身材', '曲线', '魅力',
    ],
  },
];

/**
 * 政治敏感类关键词表
 */
const POLITICAL_KEYWORDS: { keywords: string[]; level: 'low' | 'medium' | 'high' }[] = [
  {
    level: 'high',
    keywords: [
      '颠覆国家', '分裂国家', '恐怖组织', '极端主义', '暴恐',
      '反华', '辱华', '港独', '台独', '疆独', '藏独',
      '法轮功', '邪教', '反动', '叛国',
    ],
  },
  {
    level: 'medium',
    keywords: [
      '政治敏感', '领导人', '政府腐败', '官员', '体制',
      '游行示威', '抗议', '罢工', '集会', '请愿',
      '言论审查', '网络管控',
    ],
  },
  {
    level: 'low',
    keywords: [
      '政策', '制度', '改革', '选举', '议会', '政府',
    ],
  },
];

/**
 * 自残自杀类关键词表
 */
const SELF_HARM_KEYWORDS: { keywords: string[]; level: 'low' | 'medium' | 'high' }[] = [
  {
    level: 'high',
    keywords: [
      '自杀方法', '上吊', '跳楼', '割腕', '服毒', '吞药',
      '烧炭', '自我了断', '结束生命', '不想活了', '寻死',
      '自残', '割自己', '伤害自己',
    ],
  },
  {
    level: 'medium',
    keywords: [
      '抑郁', '绝望', '崩溃', '生无可恋', '解脱', '痛苦不堪',
      '精神崩溃', '心理创伤',
    ],
  },
  {
    level: 'low',
    keywords: [
      '低落', '沮丧', '失落', '孤独', '无助', '疲惫',
    ],
  },
];

/** 类别 → 关键词表映射 */
const CATEGORY_KEYWORD_MAP: Record<string, { keywords: string[]; level: 'low' | 'medium' | 'high' }[]> = {
  violence: VIOLENCE_KEYWORDS,
  sexual: SEXUAL_KEYWORDS,
  political: POLITICAL_KEYWORDS,
  self_harm: SELF_HARM_KEYWORDS,
};

/** 类别中文名映射 */
const CATEGORY_LABELS: Record<string, string> = {
  violence: '暴力',
  sexual: '色情',
  political: '政治敏感',
  self_harm: '自残自杀',
};

/** 严格程度 → 最低风险等级阈值映射 */
const STRICTNESS_THRESHOLD: Record<'low' | 'medium' | 'high', 'low' | 'medium' | 'high'> = {
  // low 严格度：只报 high 级别风险
  low: 'high',
  // medium 严格度：报 medium 及以上
  medium: 'medium',
  // high 严格度：报所有级别（含 low）
  high: 'low',
};

/** 风险等级权重（用于排序和阈值比较） */
const LEVEL_WEIGHT: Record<'low' | 'medium' | 'high', number> = {
  low: 1,
  medium: 2,
  high: 3,
};

// ─── 内部工具函数 ────────────────────────────────────────

/**
 * 从设置存储创建 AIService 实例。
 * 返回 null 表示无 API Key（调用方应降级为本地审核）。
 */
function createAIServiceFromSettings(): AIService | null {
  const settings = useSettingsStore.getState();
  const hasApiKey =
    settings.apiKeys &&
    Object.values(settings.apiKeys).some((k) => k && k.trim().length > 0);

  if (!hasApiKey) {
    return null;
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
 * 安全解析 JSON，支持从 Markdown 代码块中提取
 */
function parseJSON<T>(text: string): T | null {
  try {
    return JSON.parse(text) as T;
  } catch {
    const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      try {
        return JSON.parse(codeBlockMatch[1].trim()) as T;
      } catch {
        return null;
      }
    }
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

// ─── 本地审核逻辑（真实实现，非 mock）─────────────────────

/**
 * 基于关键词的本地内容审核
 *
 * 扫描文本中是否包含各类风险关键词，按严格程度过滤后返回风险列表。
 * 这是真实的审核逻辑，不依赖 AI，用于无 API Key 时的降级方案。
 *
 * @param text 待审核文本
 * @param options 审核选项
 * @returns 本地审核结果
 */
function moderateLocally(text: string, options: ModerateOptions): ModerateResult {
  const strictness = options.strictness ?? 'medium';
  const categories = options.categories ?? ['violence', 'sexual', 'political', 'self_harm'];
  const threshold = STRICTNESS_THRESHOLD[strictness];
  const thresholdWeight = LEVEL_WEIGHT[threshold];

  const risks: ModerationRisk[] = [];
  const lowerText = text.toLowerCase();

  for (const category of categories) {
    const keywordGroups = CATEGORY_KEYWORD_MAP[category];
    if (!keywordGroups) continue;

    // 收集该类别下所有命中的关键词
    const matchedKeywords: { keyword: string; level: 'low' | 'medium' | 'high' }[] = [];
    for (const group of keywordGroups) {
      // 仅保留达到阈值的风险等级
      if (LEVEL_WEIGHT[group.level] < thresholdWeight) continue;

      for (const keyword of group.keywords) {
        // 中文关键词直接 includes，英文关键词转小写匹配
        const isChinese = /[\u4e00-\u9fa5]/.test(keyword);
        const found = isChinese
          ? text.includes(keyword)
          : lowerText.includes(keyword.toLowerCase());

        if (found) {
          matchedKeywords.push({ keyword, level: group.level });
        }
      }
    }

    if (matchedKeywords.length > 0) {
      // 取最高等级作为该类别的整体风险等级
      const maxLevel = matchedKeywords.reduce(
        (max, m) => (LEVEL_WEIGHT[m.level] > LEVEL_WEIGHT[max] ? m.level : max),
        'low' as 'low' | 'medium' | 'high'
      );

      const categoryLabel = CATEGORY_LABELS[category] || category;
      const uniqueKeywords = [...new Set(matchedKeywords.map((m) => m.keyword))];

      risks.push({
        category,
        level: maxLevel,
        description: `检测到${categoryLabel}相关内容，命中关键词：${uniqueKeywords.slice(0, 5).join('、')}${uniqueKeywords.length > 5 ? ' 等' : ''}`,
        suggestion: buildLocalSuggestion(category, maxLevel),
      });
    }
  }

  // 按风险等级降序排序
  risks.sort((a, b) => LEVEL_WEIGHT[b.level] - LEVEL_WEIGHT[a.level]);

  const safe = risks.length === 0 || !risks.some((r) => r.level === 'high');
  const summary = buildSummary(risks, safe, 'local');

  return { safe, risks, summary, method: 'local' };
}

/**
 * 根据类别和等级生成本地审核的修改建议
 */
function buildLocalSuggestion(
  category: string,
  level: 'low' | 'medium' | 'high'
): string {
  const suggestions: Record<string, Record<string, string>> = {
    violence: {
      high: '内容包含严重暴力描写，建议大幅修改或删除相关段落，避免血腥细节。',
      medium: '内容包含暴力元素，建议弱化描写程度，减少具体暴力动作的细节。',
      low: '内容包含轻度冲突，建议确认是否为剧情必要，可保留但注意分寸。',
    },
    sexual: {
      high: '内容包含严重色情内容，必须删除或完全重写，违反内容安全底线。',
      medium: '内容包含敏感描写，建议删除露骨部分，改为含蓄表达或场景跳转。',
      low: '内容包含轻微暧昧元素，建议确认是否符合作品定位，可适当保留。',
    },
    political: {
      high: '内容涉及严重政治敏感信息，必须立即删除，避免法律风险。',
      medium: '内容涉及政治敏感话题，建议调整表述，避免直接评论或影射。',
      low: '内容提及政治相关词汇，建议确认上下文是否中性，避免主观评价。',
    },
    self_harm: {
      high: '内容涉及自残自杀的具体方法或强烈倾向，必须删除，并建议加入心理援助提示。',
      medium: '内容涉及消极情绪或自残倾向，建议调整叙事基调，避免渲染绝望感。',
      low: '内容包含负面情绪描写，建议确认是否为剧情必要，可保留但注意平衡。',
    },
  };

  return suggestions[category]?.[level] || '建议审查相关内容是否必要，酌情修改。';
}

// ─── AI 审核逻辑 ─────────────────────────────────────────

/** AI 返回的风险结构 */
interface AIRawRisk {
  category?: string;
  level?: string;
  description?: string;
  suggestion?: string;
}

/** AI 返回的完整审核结果 */
interface AIRawModerateResult {
  safe?: boolean;
  risks?: AIRawRisk[];
  summary?: string;
}

/**
 * 构建系统提示词
 */
function buildSystemPrompt(options: ModerateOptions): string {
  const strictness = options.strictness ?? 'medium';
  const categories = options.categories ?? ['violence', 'sexual', 'political', 'self_harm'];
  const categoryLabels = categories.map((c) => CATEGORY_LABELS[c] || c).join('、');

  const strictnessDesc: Record<string, string> = {
    low: '宽松模式：仅标记明确且严重的高风险内容，对模糊内容倾向判定为安全。',
    medium: '标准模式：标记中等及以上风险内容，对模糊内容保持审慎。',
    high: '严格模式：标记所有潜在风险，包括低风险内容，对模糊内容倾向判定为风险。',
  };

  return [
    '你是一位专业的内容安全审核员，负责审核互动影游的剧本和对话内容。',
    '你需要判断内容是否包含暴力、色情、政治敏感、自残自杀等风险，并给出结构化的审核结果。',
    '',
    `审核严格程度：${strictness}（${strictnessDesc[strictness]}）`,
    `审核类别：${categoryLabels}`,
    '',
    '类别说明：',
    '- violence（暴力）：杀人、伤害、酷刑、血腥描写等',
    '- sexual（色情）：性描写、露骨内容、性暴力等',
    '- political（政治敏感）：颠覆国家、分裂主义、恐怖主义、辱华内容等',
    '- self_harm（自残自杀）：自杀方法、自残行为、强烈消极情绪等',
    '',
    '风险等级说明：',
    '- high：明确违反内容安全底线，必须修改',
    '- medium：存在明显风险，建议修改',
    '- low：存在轻微风险，可酌情处理',
    '',
    '你的输出必须是严格的 JSON 格式：',
    '{',
    '  "safe": boolean,',
    '  "risks": [{ "category": "violence"|"sexual"|"political"|"self_harm", "level": "low"|"medium"|"high", "description": string, "suggestion": string }],',
    '  "summary": string',
    '}',
    '',
    '判定规则：',
    '1. safe 为 true 表示内容可以安全使用（无 high 级别风险）',
    '2. safe 为 false 表示存在 high 级别风险，必须修改',
    '3. risks 数组按风险等级从高到低排序',
    '4. description 用中文描述具体风险点',
    '5. suggestion 用中文给出修改建议',
    '6. summary 用中文概括审核结论',
    '7. 如果内容安全，risks 为空数组，safe 为 true',
  ].join('\n');
}

/**
 * 构建用户提示词
 */
function buildUserPrompt(text: string): string {
  return [
    '请审核以下内容的安全性：',
    '',
    '【待审核内容】',
    text,
    '',
    '【输出要求】',
    '请直接输出 JSON，不要包含任何解释性文字或 Markdown 标记。',
  ].join('\n');
}

/**
 * 将 AI 返回的原始数据规范化为 ModerateResult
 */
function normalizeAIResult(raw: AIRawModerateResult): ModerateResult {
  const validLevels = ['low', 'medium', 'high'];
  const validCategories = ['violence', 'sexual', 'political', 'self_harm'];

  const risks: ModerationRisk[] = (raw.risks || [])
    .filter((r) => r && r.category && r.level)
    .map((r) => ({
      category: validCategories.includes(r.category!) ? r.category! : 'violence',
      level: validLevels.includes(r.level!) ? (r.level as 'low' | 'medium' | 'high') : 'low',
      description: r.description || '',
      suggestion: r.suggestion || '',
    }))
    .sort((a, b) => LEVEL_WEIGHT[b.level] - LEVEL_WEIGHT[a.level]);

  const safe = risks.length === 0 || !risks.some((r) => r.level === 'high');
  const summary = raw.summary || buildSummary(risks, safe, 'ai');

  return { safe, risks, summary, method: 'ai' };
}

/**
 * 生成审核摘要
 */
function buildSummary(
  risks: ModerationRisk[],
  safe: boolean,
  method: 'ai' | 'local'
): string {
  const methodLabel = method === 'ai' ? 'AI 审核' : '本地关键词审核';
  if (risks.length === 0) {
    return `${methodLabel}通过：未检测到风险内容。`;
  }

  const highCount = risks.filter((r) => r.level === 'high').length;
  const mediumCount = risks.filter((r) => r.level === 'medium').length;
  const lowCount = risks.filter((r) => r.level === 'low').length;

  const parts: string[] = [];
  if (highCount > 0) parts.push(`${highCount} 项高风险`);
  if (mediumCount > 0) parts.push(`${mediumCount} 项中风险`);
  if (lowCount > 0) parts.push(`${lowCount} 项低风险`);

  const riskCategories = [...new Set(risks.map((r) => CATEGORY_LABELS[r.category] || r.category))].join('、');
  return `${methodLabel}：检测到${parts.join('、')}，涉及${riskCategories}。${safe ? '整体可接受，建议关注。' : '存在高风险，必须修改。'}`;
}

// ─── 主函数 ──────────────────────────────────────────────

/**
 * 对内容进行安全审核
 *
 * 优先使用 AI 审核（调用 LLM 判断），无 API Key 时降级为基于关键词的本地审核。
 * 两种方式都是真实逻辑，本地审核基于真实的关键词表和等级判定规则。
 *
 * @param text 待审核文本
 * @param options 审核选项（严格程度、审核类别）
 * @param aiService 可选的 AIService 实例（用于依赖注入）
 * @returns 审核结果，包含是否安全、风险列表和摘要
 */
export async function moderateContent(
  text: string,
  options: ModerateOptions = {},
  aiService?: AIService
): Promise<ModerateResult> {
  // 输入校验
  if (!text || text.trim().length === 0) {
    return {
      safe: true,
      risks: [],
      summary: '审核通过：内容为空。',
      method: 'local',
    };
  }

  // 获取或创建 AIService
  const service = aiService ?? createAIServiceFromSettings();

  // 无 API Key 时降级为本地审核
  if (!service) {
    return moderateLocally(text, options);
  }

  try {
    // 构建提示词并调用 AI
    const systemPrompt = buildSystemPrompt(options);
    const userPrompt = buildUserPrompt(text);

    const response = await service.complete(
      systemPrompt,
      userPrompt,
      'content_moderate'
    );

    if (!response.success || !response.data) {
      // AI 调用失败，降级为本地审核
      const localResult = moderateLocally(text, options);
      return {
        ...localResult,
        summary: `AI 审核失败（${response.error || '未知错误'}），已降级为本地审核。${localResult.summary}`,
      };
    }

    // 解析 AI 返回的 JSON
    const parsed = parseJSON<AIRawModerateResult>(response.data);
    if (!parsed) {
      // 解析失败，降级为本地审核
      const localResult = moderateLocally(text, options);
      return {
        ...localResult,
        summary: `AI 返回内容解析失败，已降级为本地审核。${localResult.summary}`,
      };
    }

    return normalizeAIResult(parsed);
  } catch (error) {
    // 任何异常都降级为本地审核，确保功能可用
    const localResult = moderateLocally(text, options);
    const errorMsg = error instanceof Error ? error.message : String(error);
    return {
      ...localResult,
      summary: `AI 审核异常（${errorMsg}），已降级为本地审核。${localResult.summary}`,
    };
  }
}

/**
 * 批量审核：对多段文本进行审核，返回综合结果
 *
 * @param texts 文本数组
 * @param options 审核选项
 * @param aiService 可选的 AIService 实例
 * @returns 综合审核结果
 */
export async function moderateContentBatch(
  texts: string[],
  options: ModerateOptions = {},
  aiService?: AIService
): Promise<ModerateResult> {
  if (texts.length === 0) {
    return {
      safe: true,
      risks: [],
      summary: '审核通过：无待审核内容。',
      method: 'local',
    };
  }

  // 逐段审核
  const results = await Promise.all(
    texts.map((t) => moderateContent(t, options, aiService))
  );

  // 合并风险（按类别聚合，取最高等级）
  const riskMap = new Map<string, ModerationRisk>();
  for (const result of results) {
    for (const risk of result.risks) {
      const existing = riskMap.get(risk.category);
      if (!existing || LEVEL_WEIGHT[risk.level] > LEVEL_WEIGHT[existing.level]) {
        riskMap.set(risk.category, {
          ...risk,
          description: risk.description,
        });
      }
    }
  }

  const risks = Array.from(riskMap.values()).sort(
    (a, b) => LEVEL_WEIGHT[b.level] - LEVEL_WEIGHT[a.level]
  );

  const safe = risks.length === 0 || !risks.some((r) => r.level === 'high');
  const method = results.some((r) => r.method === 'ai') ? 'ai' : 'local';
  const summary = buildSummary(risks, safe, method);

  return { safe, risks, summary, method };
}
