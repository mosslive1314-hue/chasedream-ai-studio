/**
 * Character Card V2/V3 适配器
 *
 * 实现 GameCharacter 与 SillyTavern Character Card 格式（V2/V3）的双向转换，
 * 让 ChaseDream Creator Studio 的角色能够与 SillyTavern 生态互操作。
 *
 * - V2 规范：chara_card_v2 (spec_version 2.0)
 * - V3 规范：chara_card_v3 (spec_version 3.0)，在 V2 基础上扩展多语言/来源等字段
 *
 * 字段映射策略：
 * - name ↔ character.name
 * - description ↔ character.description
 * - personality ↔ character.visualPrompt（视觉特征可视为外在人格表现）
 * - scenario ↔ 由 character.role + description 拼装的场景描述
 * - first_mes ↔ 用户提供的开场白，否则从 description 生成
 * - tags ↔ [character.role, character.emoji]
 * - creator ↔ "ChaseDream Creator Studio"
 */

import type { GameCharacter } from '@/lib/types/game';

// ─── Character Card V2 类型定义 ───────────────────────────────────────────

/** SillyTavern Character Card V2 标准 */
export interface CharacterCardV2 {
  spec: 'chara_card_v2';
  spec_version: '2.0';
  data: {
    name: string;
    description: string;
    personality: string;
    scenario: string;
    first_mes: string;
    mes_example: string;
    creatorcomment: string;
    tags: string[];
    creator: string;
    character_version: string;
    alternate_greetings?: string[];
    extensions?: Record<string, unknown>;
  };
}

/** V3 在 V2 基础上扩展多语言注释、来源、群组问候等字段 */
export interface CharacterCardV3 extends CharacterCardV2 {
  spec: 'chara_card_v3';
  spec_version: '3.0';
  data: CharacterCardV2['data'] & {
    group_only_greetings?: string[];
    creator_notes_multilingual?: Record<string, string>;
    source?: string[];
  };
}

/** 任意版本的 Character Card 联合类型 */
export type CharacterCard = CharacterCardV2 | CharacterCardV3;

// ─── 导出选项 ─────────────────────────────────────────────────────────────

export interface ExportOptions {
  /** 目标版本，默认 2 */
  version?: 2 | 3;
  /** 创作者名称，默认 "ChaseDream Creator Studio" */
  creator?: string;
  /** 开场白，未提供则从角色描述生成 */
  firstMessage?: string;
  /** 场景描述，未提供则从角色信息拼装 */
  scenario?: string;
  /** 对话示例 */
  messageExample?: string;
  /** 备选开场白 */
  alternateGreetings?: string[];
  /** 角色版本号 */
  characterVersion?: string;
  /** 创作者备注 */
  creatorComment?: string;
  /** 额外扩展字段 */
  extensions?: Record<string, unknown>;
  /** V3 专属：群组问候 */
  groupOnlyGreetings?: string[];
  /** V3 专属：多语言注释 */
  creatorNotesMultilingual?: Record<string, string>;
  /** V3 专属：来源 URL 列表 */
  source?: string[];
}

// ─── 导入结果 ─────────────────────────────────────────────────────────────

export interface ImportResult {
  /** 不含 id 的角色数据，调用方负责生成 id */
  character: Omit<GameCharacter, 'id'>;
  /** 卡片元信息 */
  metadata: {
    creator: string;
    version: string;
    tags: string[];
    alternateGreetings: string[];
    /** V3 专属字段（V2 卡片为 undefined） */
    groupOnlyGreetings?: string[];
    creatorNotesMultilingual?: Record<string, string>;
    source?: string[];
  };
}

// ─── 默认值常量 ───────────────────────────────────────────────────────────

const DEFAULT_CREATOR = 'ChaseDream Creator Studio';
const DEFAULT_CHARACTER_VERSION = '1.0';

/**
 * 生成默认开场白：基于角色名与描述拼装一句自然开场
 */
function buildDefaultFirstMessage(character: GameCharacter): string {
  const { name, description, role } = character;
  if (description && description.trim().length > 0) {
    // 取描述的第一句作为开场白基础
    const firstSentence = description.split(/[。.！!？?\n]/)[0]?.trim();
    if (firstSentence) {
      return `（${name}出现）${firstSentence}`;
    }
  }
  return `（${name}${role ? `，${role}` : ''}出现）你好，我是${name}。`;
}

/**
 * 生成默认场景描述：由角色身份与出场信息拼装
 */
function buildDefaultScenario(character: GameCharacter): string {
  const parts: string[] = [];
  if (character.role) parts.push(`身份：${character.role}`);
  if (character.description) parts.push(character.description);
  if (character.appearNodes && character.appearNodes.length > 0) {
    parts.push(`出场节点数：${character.appearNodes.length}`);
  }
  return parts.length > 0 ? parts.join('；') : '未设定具体场景';
}

/**
 * 生成默认对话示例：基于角色情绪状态
 */
function buildDefaultMessageExample(character: GameCharacter): string {
  const emotions = character.emotionStates?.map((e) => e.label).filter(Boolean) ?? [];
  if (emotions.length === 0) return '';
  const sample = emotions.slice(0, 3).map((emo) => `{{user}}: 你现在感觉怎么样？\n{{char}}: 我感到${emo}。`).join('\n\n');
  return sample;
}

// ─── 导出函数 ─────────────────────────────────────────────────────────────

/**
 * 导出：GameCharacter → Character Card
 *
 * 将单个角色转换为 SillyTavern Character Card 格式。
 * version=2 返回 V2 卡片，version=3 返回 V3 卡片（包含扩展字段）。
 */
export function exportToCharacterCard(
  character: GameCharacter,
  options: ExportOptions = {},
): CharacterCard {
  const version = options.version ?? 2;
  const creator = options.creator ?? DEFAULT_CREATOR;
  const characterVersion = options.characterVersion ?? DEFAULT_CHARACTER_VERSION;

  const firstMes = options.firstMessage ?? buildDefaultFirstMessage(character);
  const scenario = options.scenario ?? buildDefaultScenario(character);
  const mesExample = options.messageExample ?? buildDefaultMessageExample(character);

  // tags 由角色身份与 emoji 组成，过滤空值
  const tags = [character.role, character.emoji].filter((t): t is string => Boolean(t && t.trim()));

  // creatorcomment：记录来源与原始字段，便于回溯
  const creatorcomment =
    options.creatorComment ??
    `从 ChaseDream Creator Studio 导出。原始角色 ID：${character.id}；颜色：${character.color}；情绪状态：${character.emotionStates?.length ?? 0} 个`;

  // V2 基础数据
  const baseData: CharacterCardV2['data'] = {
    name: character.name,
    description: character.description || '',
    // personality 字段：GameCharacter 没有独立 personality 字段，
    // 用 visualPrompt（视觉特征）作为外在人格表现，更贴近 SillyTavern 语义
    personality: character.visualPrompt || '',
    scenario,
    first_mes: firstMes,
    mes_example: mesExample,
    creatorcomment,
    tags,
    creator,
    character_version: characterVersion,
    alternate_greetings: options.alternateGreetings,
    extensions: {
      // 保留 ChaseDream 专属字段，便于往返导入时还原
      chasedream: {
        originalId: character.id,
        role: character.role,
        color: character.color,
        emoji: character.emoji,
        appearNodes: character.appearNodes,
        emotionStates: character.emotionStates,
        wardrobeId: character.wardrobeId,
        defaultOutfitId: character.defaultOutfitId,
      },
      ...(options.extensions ?? {}),
    },
  };

  if (version === 3) {
    const v3Card: CharacterCardV3 = {
      spec: 'chara_card_v3',
      spec_version: '3.0',
      data: {
        ...baseData,
        group_only_greetings: options.groupOnlyGreetings,
        creator_notes_multilingual: options.creatorNotesMultilingual,
        source: options.source ?? ['ChaseDream Creator Studio'],
      },
    };
    return v3Card;
  }

  const v2Card: CharacterCardV2 = {
    spec: 'chara_card_v2',
    spec_version: '2.0',
    data: baseData,
  };
  return v2Card;
}

/**
 * 批量导出：多个角色 → V2 卡片数组
 *
 * 批量场景默认使用 V2 以保证最大兼容性。
 */
export function exportBatchToCharacterCards(
  characters: GameCharacter[],
  options?: Omit<ExportOptions, 'firstMessage' | 'scenario'>,
): CharacterCardV2[] {
  return characters.map((c) => exportToCharacterCard(c, { ...options, version: 2 }) as CharacterCardV2);
}

/**
 * 导出为 JSON 字符串（可直接下载为 .png 嵌入或 .json 文件）
 */
export function exportToJson(character: GameCharacter, version: 2 | 3 = 2): string {
  const card = exportToCharacterCard(character, { version });
  return JSON.stringify(card, null, 2);
}

// ─── 导入函数 ─────────────────────────────────────────────────────────────

/**
 * 从 Character Card 还原为 GameCharacter（不含 id）
 *
 * 调用方需自行生成 id 后通过 narrativeStore.addCharacter 写入。
 * 若卡片包含 chasedream 扩展字段，则优先还原原始字段。
 */
export function importFromCharacterCard(card: CharacterCard): ImportResult {
  const data = card.data;
  const extensions = (data.extensions ?? {}) as Record<string, any>;
  const cdExt = (extensions.chasedream ?? {}) as Partial<GameCharacter>;

  // 还原角色基础字段，扩展字段优先
  const character: Omit<GameCharacter, 'id'> = {
    name: data.name || '未命名角色',
    role: cdExt.role ?? (data.tags?.[0] ?? '角色'),
    description: data.description || '',
    appearNodes: cdExt.appearNodes ?? [],
    color: cdExt.color ?? '#6366f1',
    emoji: cdExt.emoji ?? (data.tags?.[1] ?? '👤'),
    emotionStates: cdExt.emotionStates ?? [],
    // visualPrompt 优先用扩展字段，否则回退到 personality 字段
    visualPrompt: cdExt.visualPrompt ?? data.personality ?? '',
    wardrobeId: cdExt.wardrobeId,
    defaultOutfitId: cdExt.defaultOutfitId,
  };

  const metadata: ImportResult['metadata'] = {
    creator: data.creator || DEFAULT_CREATOR,
    version: data.character_version || DEFAULT_CHARACTER_VERSION,
    tags: data.tags ?? [],
    alternateGreetings: data.alternate_greetings ?? [],
  };

  // V3 专属字段
  if (card.spec === 'chara_card_v3') {
    const v3Data = card.data;
    metadata.groupOnlyGreetings = v3Data.group_only_greetings;
    metadata.creatorNotesMultilingual = v3Data.creator_notes_multilingual;
    metadata.source = v3Data.source;
  }

  return { character, metadata };
}

/**
 * 从 JSON 字符串导入（自动检测 V2/V3）
 *
 * 解析失败时抛出 Error，调用方需 try/catch。
 */
export function importFromJson(jsonString: string): ImportResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonString);
  } catch (e) {
    throw new Error(`JSON 解析失败：${e instanceof Error ? e.message : String(e)}`);
  }

  // 兼容两种结构：
  // 1. 标准 Character Card：{ spec: 'chara_card_v2', data: {...} }
  // 2. 扁平结构（旧版 V1 或简化导出）：{ name, description, ... }
  if (parsed && typeof parsed === 'object' && 'spec' in parsed && 'data' in parsed) {
    const card = parsed as CharacterCard;
    if (card.spec !== 'chara_card_v2' && card.spec !== 'chara_card_v3') {
      throw new Error(`不支持的 Character Card 规范：${card.spec}`);
    }
    return importFromCharacterCard(card);
  }

  // 扁平结构：包装成 V2 卡片再走统一导入流程
  if (parsed && typeof parsed === 'object') {
    const flat = parsed as Record<string, any>;
    const wrappedCard: CharacterCardV2 = {
      spec: 'chara_card_v2',
      spec_version: '2.0',
      data: {
        name: flat.name ?? '未命名角色',
        description: flat.description ?? '',
        personality: flat.personality ?? '',
        scenario: flat.scenario ?? '',
        first_mes: flat.first_mes ?? flat.firstMessage ?? '',
        mes_example: flat.mes_example ?? flat.messageExample ?? '',
        creatorcomment: flat.creatorcomment ?? '',
        tags: Array.isArray(flat.tags) ? flat.tags : [],
        creator: flat.creator ?? DEFAULT_CREATOR,
        character_version: flat.character_version ?? DEFAULT_CHARACTER_VERSION,
        alternate_greetings: flat.alternate_greetings,
        extensions: flat.extensions,
      },
    };
    return importFromCharacterCard(wrappedCard);
  }

  throw new Error('无法识别的 Character Card 格式：既不是标准卡片也不是扁平对象');
}

/**
 * 批量从 JSON 字符串数组导入
 *
 * 适用于一次性导入多个角色卡。任一卡片解析失败会跳过并收集错误，
 * 不影响其他卡片导入。
 */
export function importBatchFromJson(jsonStrings: string[]): {
  results: ImportResult[];
  errors: { index: number; error: string }[];
} {
  const results: ImportResult[] = [];
  const errors: { index: number; error: string }[] = [];

  jsonStrings.forEach((str, index) => {
    try {
      results.push(importFromJson(str));
    } catch (e) {
      errors.push({
        index,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  return { results, errors };
}
