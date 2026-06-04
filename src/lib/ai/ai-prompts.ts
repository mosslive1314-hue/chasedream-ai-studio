/**
 * AI 提示词模板库
 *
 * 提供标准化的提示词构建函数，用于 ChaseDream Creator Studio 的各类 AI 辅助功能。
 * 每个函数返回 system + user 消息对，供 Chat Completion API 使用。
 *
 * 所有提示词均以中文撰写，使用专业游戏设计术语。
 */

// ─── 返回类型 ────────────────────────────────────────────

/** 提示词构建结果：包含系统消息和用户消息 */
export interface PromptResult {
  system: string;
  user: string;
}

// ─── 1. 剧本续写 ──────────────────────────────────────────

/**
 * 构建剧本续写提示词。
 *
 * 根据已有剧本片段、角色设定和世界观规则，让 AI 继续创作后续内容。
 * 支持三种模式：续写（continue）、扩写（expand）、重写（rewrite）。
 */
export function buildScriptContinuationPrompt(params: {
  projectName: string;
  genre: string;
  existingContent: string;
  characters: { name: string; role: string; description: string }[];
  worldRules: string[];
  continuationType: 'continue' | 'expand' | 'rewrite';
}): PromptResult {
  const { projectName, genre, existingContent, characters, worldRules, continuationType } = params;

  // 续写类型指令映射
  const typeInstructions: Record<string, string> = {
    continue:
      '请基于现有内容的结尾，自然地延续故事。保持叙事节奏和角色性格的一致性，推动情节向下一个冲突点或转折点发展。',
    expand:
      '请对现有内容进行扩写，在保留核心情节的前提下，补充细节描写、角色内心活动和环境氛围渲染，使场景更加丰满。',
    rewrite:
      '请对现有内容进行重写优化，改善叙事节奏、对话质量和戏剧张力，同时保留核心情节走向和角色关系。',
  };

  const system = [
    '你是一位资深的互动叙事设计顾问，专精于互动影视剧本和分支叙事游戏的创作。',
    '你熟悉各类叙事结构模型（三幕式、英雄之旅、起承转合）和游戏叙事设计模式（分支树、状态机、平行叙事）。',
    '你的创作风格注重角色弧光、情感节奏和玩家代入感，善于通过对话和行为细节塑造角色。',
    '请始终使用中文进行创作，保持专业游戏设计领域的术语准确性。',
  ].join('\n');

  const characterList = characters
    .map((c) => `- ${c.name}（${c.role}）：${c.description}`)
    .join('\n');

  const rulesList =
    worldRules.length > 0
      ? worldRules.map((r, i) => `${i + 1}. ${r}`).join('\n')
      : '（暂无特殊世界观规则）';

  const user = [
    `项目：《${projectName}》`,
    `题材类型：${genre}`,
    `任务类型：${continuationType === 'continue' ? '续写' : continuationType === 'expand' ? '扩写' : '重写'}`,
    '',
    '【角色设定】',
    characterList,
    '',
    '【世界观规则】',
    rulesList,
    '',
    '【现有剧本内容】',
    existingContent,
    '',
    '【创作要求】',
    typeInstructions[continuationType],
    '',
    '【输出格式】',
    '请直接输出剧本内容，使用以下格式标记：',
    '- 场景描写用 [场景] 标记',
    '- 旁白用 [旁白] 标记',
    '- 对话用 角色名：对话内容 的格式',
    '- 选择分支用 [选择] 标记，列出各选项',
  ].join('\n');

  return { system, user };
}

// ─── 2. 对话生成 ──────────────────────────────────────────

/**
 * 构建对话选项生成提示词。
 *
 * 根据角色设定和当前场景情境，生成多条可选对话，
 * 每条对话附带情感标签和建议的变量影响。
 */
export function buildDialoguePrompt(params: {
  characterName: string;
  characterRole: string;
  characterDescription: string;
  situation: string;
  otherCharacters: { name: string; role: string }[];
  dialogueCount: number;
}): PromptResult {
  const {
    characterName,
    characterRole,
    characterDescription,
    situation,
    otherCharacters,
    dialogueCount,
  } = params;

  const system = [
    '你是一位资深的互动叙事设计顾问，专精于互动对话系统的设计。',
    '你擅长根据角色性格、情境和玩家心理设计多层次的对话选项，',
    '能够精准把握角色的语言风格、口头禅和情感表达方式。',
    '每条对话选项应体现不同的情感倾向和叙事策略，为玩家提供有意义的选择。',
    '请以 JSON 数组格式输出，确保可被程序直接解析。',
  ].join('\n');

  const otherCharsList =
    otherCharacters.length > 0
      ? otherCharacters.map((c) => `- ${c.name}（${c.role}）`).join('\n')
      : '（当前场景无其他角色）';

  const user = [
    '【目标角色】',
    `姓名：${characterName}`,
    `角色定位：${characterRole}`,
    `角色描述：${characterDescription}`,
    '',
    '【当前场景情境】',
    situation,
    '',
    '【在场其他角色】',
    otherCharsList,
    '',
    `【任务】`,
    `请为「${characterName}」生成 ${dialogueCount} 条可选对话。`,
    '每条对话需要：',
    '1. 体现不同的情感倾向（如愤怒、同情、冷漠、幽默、谨慎等）',
    '2. 符合角色的性格和语言风格',
    '3. 附带可能触发的变量变化建议（如好感度、信任度等）',
    '',
    '【输出格式】',
    '请输出严格的 JSON 数组，格式如下：',
    '```json',
    '[',
    '  {',
    '    "text": "对话内容",',
    '    "emotion": "情感标签",',
    '    "suggestedVariable": { "name": "变量名", "change": 数值变化 }',
    '  }',
    ']',
    '```',
    `请生成恰好 ${dialogueCount} 条对话选项。`,
  ].join('\n');

  return { system, user };
}

// ─── 3. 分支建议 ──────────────────────────────────────────

/**
 * 构建分支路径建议提示词。
 *
 * 分析当前故事节点的结构和上下文，建议可能的分支方向和变量设计。
 */
export function buildBranchSuggestionPrompt(params: {
  projectName: string;
  currentNodeLabel: string;
  currentNodeType: string;
  connectedNodes: string[];
  existingVariables: { name: string; description: string }[];
  genre: string;
}): PromptResult {
  const {
    projectName,
    currentNodeLabel,
    currentNodeType,
    connectedNodes,
    existingVariables,
    genre,
  } = params;

  const system = [
    '你是一位资深的互动叙事设计顾问，专精于分支叙事结构和玩家选择设计。',
    '你熟悉各类分支设计模式（二叉分支、多路分支、汇聚节点、延迟后果）和',
    '玩家心理学（选择悖论、沉没成本、损失厌恶），能够设计出既有意义又不至于过载的分支选项。',
    '你善于通过变量系统量化玩家的选择后果，实现叙事状态的精确控制。',
    '请以 JSON 数组格式输出分支建议，确保可被程序直接解析。',
  ].join('\n');

  const connectedList =
    connectedNodes.length > 0
      ? connectedNodes.map((n) => `- ${n}`).join('\n')
      : '（当前节点尚无出边连接）';

  const variablesList =
    existingVariables.length > 0
      ? existingVariables.map((v) => `- ${v.name}：${v.description}`).join('\n')
      : '（项目暂无已定义的变量）';

  const user = [
    `项目：《${projectName}》`,
    `题材类型：${genre}`,
    '',
    '【当前节点信息】',
    `节点名称：${currentNodeLabel}`,
    `节点类型：${currentNodeType}`,
    '',
    '【已连接的后续节点】',
    connectedList,
    '',
    '【已定义的变量系统】',
    variablesList,
    '',
    '【任务】',
    '请分析当前节点的叙事功能，并建议 2-4 条可能的分支路径。每条分支应：',
    '1. 具有明确的叙事目的和玩家动机',
    '2. 体现不同的策略或价值观选择',
    '3. 产生有意义的短期或长期后果',
    '4. 可关联到现有变量或建议新增变量',
    '',
    '【输出格式】',
    '请输出严格的 JSON 数组，格式如下：',
    '```json',
    '[',
    '  {',
    '    "label": "分支标签",',
    '    "description": "分支描述和叙事目的",',
    '    "targetType": "建议目标节点类型（scene/choice/condition/ending_good/ending_bad）",',
    '    "suggestedVariables": [{ "name": "变量名", "change": 数值变化 }]',
    '  }',
    ']',
    '```',
  ].join('\n');

  return { system, user };
}

// ─── 4. 世界观一致性检查 ──────────────────────────────────

/**
 * 构建世界观一致性检查提示词。
 *
 * 检查新创作的内容是否与已建立的世界观规则和角色设定产生矛盾。
 */
export function buildConsistencyCheckPrompt(params: {
  projectName: string;
  worldRules: string[];
  newContent: string;
  characters: { name: string; role: string; description: string }[];
  existingNodes: string[];
}): PromptResult {
  const { projectName, worldRules, newContent, characters, existingNodes } = params;

  const system = [
    '你是一位资深的互动叙事设计顾问，专精于叙事一致性审查和世界观管理。',
    '你的职责是像"叙事 QA 工程师"一样，逐条检查新内容是否与已建立的世界观规则、',
    '角色设定和已有情节产生矛盾。你需要关注以下维度的不一致：',
    '- 角色行为与性格设定的矛盾',
    '- 时间线或因果关系的逻辑错误',
    '- 世界观设定的违反（如魔法体系、社会规则）',
    '- 信息揭示的时序错误（角色不应知道某信息）',
    '- 叙事基调或风格的不统一',
    '请以 JSON 数组格式输出检查结果，按严重程度排序。',
  ].join('\n');

  const rulesList =
    worldRules.length > 0
      ? worldRules.map((r, i) => `${i + 1}. ${r}`).join('\n')
      : '（暂无已定义的世界观规则）';

  const characterList = characters
    .map((c) => `- ${c.name}（${c.role}）：${c.description}`)
    .join('\n');

  const nodesList =
    existingNodes.length > 0
      ? existingNodes.slice(-20).map((n) => `- ${n}`).join('\n')
      : '（暂无已有节点）';

  const user = [
    `项目：《${projectName}》`,
    '',
    '【世界观规则】',
    rulesList,
    '',
    '【角色设定】',
    characterList,
    '',
    '【已有故事节点（最近）】',
    nodesList,
    '',
    '【待检查的新内容】',
    newContent,
    '',
    '【任务】',
    '请逐条审查上述新内容，识别所有可能的不一致问题。对每个问题：',
    '1. 标注严重程度（high = 严重矛盾、medium = 潜在问题、low = 建议优化）',
    '2. 清晰描述问题所在',
    '3. 给出具体的修改建议',
    '4. 列出受影响的元素（角色名、节点名等）',
    '',
    '【输出格式】',
    '请输出严格的 JSON 数组，格式如下：',
    '```json',
    '[',
    '  {',
    '    "severity": "high/medium/low",',
    '    "description": "问题描述",',
    '    "suggestion": "修改建议",',
    '    "affectedElements": ["受影响元素1", "受影响元素2"]',
    '  }',
    ']',
    '```',
    '如果没有发现问题，请返回空数组 []。',
  ].join('\n');

  return { system, user };
}

// ─── 5. 项目健康度分析 ──────────────────────────────────

/**
 * 构建项目健康度分析提示词。
 *
 * 根据项目的统计数据和已知问题，生成综合评估报告和改善建议。
 */
export function buildProjectHealthPrompt(params: {
  projectName: string;
  genre: string;
  stats: {
    characterCount: number;
    sceneCount: number;
    nodeCount: number;
    edgeCount: number;
    variableCount: number;
    branchPathCount: number;
    endingCount: number;
  };
  issues: string[];
}): PromptResult {
  const { projectName, genre, stats, issues } = params;

  const system = [
    '你是一位资深的互动叙事设计顾问，专精于互动叙事项目的质量评估和流程优化。',
    '你需要从以下维度评估项目健康度：',
    '- 结构完整性：节点连通性、分支覆盖率、结局可达性',
    '- 内容丰富度：角色深度、场景多样性、对话密度',
    '- 系统设计：变量系统的合理性、分支的有意义程度',
    '- 玩家体验：选择密度、节奏控制、重玩价值',
    '请给出 0-100 分的综合评分，并提供可操作的改善建议。',
    '请以 JSON 格式输出完整报告，确保可被程序直接解析。',
  ].join('\n');

  const issuesList =
    issues.length > 0
      ? issues.map((issue, i) => `${i + 1}. ${issue}`).join('\n')
      : '（暂未检测到明确问题）';

  // 计算一些衍生指标
  const avgEdgesPerNode =
    stats.nodeCount > 0 ? (stats.edgeCount / stats.nodeCount).toFixed(1) : 'N/A';
  const endingRatio =
    stats.branchPathCount > 0
      ? `${stats.endingCount} 个结局 / ${stats.branchPathCount} 条路径`
      : 'N/A';

  const user = [
    `项目：《${projectName}》`,
    `题材类型：${genre}`,
    '',
    '【项目统计】',
    `- 角色数量：${stats.characterCount}`,
    `- 场景数量：${stats.sceneCount}`,
    `- 故事节点数：${stats.nodeCount}`,
    `- 连接边数：${stats.edgeCount}（平均每节点 ${avgEdgesPerNode} 条出边）`,
    `- 变量数量：${stats.variableCount}`,
    `- 分支路径数：${stats.branchPathCount}`,
    `- 结局数量：${stats.endingCount}（${endingRatio}）`,
    '',
    '【已检测到的问题】',
    issuesList,
    '',
    '【任务】',
    '请基于以上数据，生成完整的项目健康度报告。报告需要包含：',
    '1. 综合评分（0-100 分）',
    '2. 项目优势（2-4 条）',
    '3. 项目薄弱环节（2-4 条）',
    '4. 改善建议（按优先级排序，每条标注 high/medium/low）',
    '',
    '【评分参考基准】',
    '- 90-100：结构完整、内容丰富、分支设计合理，可进入制作阶段',
    '- 70-89：核心框架健全，部分环节需补充完善',
    '- 50-69：存在结构性缺陷，需要重点优化',
    '- 0-49：项目框架需要重新规划',
    '',
    '【输出格式】',
    '请输出严格的 JSON 对象，格式如下：',
    '```json',
    '{',
    '  "score": 75,',
    '  "strengths": ["优势1", "优势2"],',
    '  "weaknesses": ["薄弱环节1", "薄弱环节2"],',
    '  "suggestions": [',
    '    { "priority": "high/medium/low", "description": "建议描述" }',
    '  ]',
    '}',
    '```',
  ].join('\n');

  return { system, user };
}
