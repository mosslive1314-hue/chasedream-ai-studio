/**
 * DCI 动态上下文注入器 — 基于 SillyTavern WorldInfo 技术的动态上下文管理系统
 *
 * 核心职责：在叙事运行时根据场景状态（变量值、角色关系、已发生事件）动态注入
 *           相关背景信息到 LLM 提示词，提升 AI 生成的上下文一致性。
 *
 * 架构：
 *   DynamicContextInjector (主类)
 *     ├─ Entry Library（上下文条目库）— 管理条目的增删改查
 *     ├─ Scanner（扫描器）— 实时扫描当前场景状态
 *     ├─ Matcher（匹配器）— 将场景状态与条目触发条件匹配
 *     └─ Injector（注入器）— 将匹配的条目按优先级排序后注入提示词
 *
 * 使用方式：
 * ```ts
 * const injector = new DynamicContextInjector();
 * injector.addEntry({
 *   triggers: { keywords: ['森林', '夜晚'], variables: { 'trust_level': '>50' } },
 *   content: '森林在夜晚充满危险，狼群出没。',
 *   position: 'system',
 *   priority: 80,
 *   enabled: true,
 * });
 *
 * const result = injector.inject({
 *   variables: { trust_level: 75 },
 *   currentNodeId: 'node_forest_night',
 *   characterIds: ['char_hero'],
 *   history: ['node_start', 'node_forest_night'],
 * });
 * // result.systemContext 包含匹配的条目内容
 * ```
 */

// ─── 对外类型 ────────────────────────────────────────────

/** 上下文条目的触发条件 */
export interface ContextTriggers {
  /** 关键词触发：当前节点文本/对话包含任一关键词时触发 */
  keywords?: string[];
  /** 变量条件：如 { "trust_level": ">50", "has_met_npc": "==true" } */
  variables?: Record<string, string>;
  /** 场景 ID 触发：当前场景 ID 在列表中时触发 */
  scenes?: string[];
  /** 节点 ID 触发：当前节点 ID 在列表中时触发 */
  nodeIds?: string[];
}

/** 注入位置 */
export type InjectPosition = 'system' | 'user' | 'assistant';

/** 上下文条目 */
export interface ContextEntry {
  /** 条目唯一 ID */
  id: string;
  /** 触发条件 */
  triggers: ContextTriggers;
  /** 注入的内容 */
  content: string;
  /** 注入位置：system / user / assistant */
  position: InjectPosition;
  /** 优先级：0-100，越高越优先（同位置内按优先级降序排列） */
  priority: number;
  /** 是否启用 */
  enabled: boolean;
  /** 条目注释/描述（可选，用于管理） */
  comment?: string;
}

/** 场景状态（扫描器的输入） */
export interface SceneState {
  /** 当前变量值映射 */
  variables: Record<string, number | string | boolean>;
  /** 当前场景 ID */
  currentSceneId?: string;
  /** 当前节点 ID */
  currentNodeId?: string;
  /** 当前场景中的角色 ID 列表 */
  characterIds: string[];
  /** 已访问的节点 ID 历史（按时间顺序） */
  history: string[];
  /** 当前节点的文本内容（用于关键词匹配） */
  currentText?: string;
  /** 当前对话内容（用于关键词匹配） */
  currentDialogue?: string;
}

/** 注入结果 */
export interface InjectResult {
  /** 注入到 system 提示词的内容（多条目用换行分隔） */
  systemContext: string;
  /** 注入到 user 提示词的内容 */
  userContext: string;
  /** 注入到 assistant 提示词的内容 */
  assistantContext: string;
  /** 匹配的条目 ID 列表（按优先级降序） */
  matchedEntries: string[];
}

// ─── 变量条件解析 ────────────────────────────────────────

/** 变量条件的操作符 */
type VarOperator = '>' | '>=' | '<' | '<=' | '==' | '!=' | 'contains' | 'not_contains';

/** 解析后的变量条件 */
interface ParsedVarCondition {
  operator: VarOperator;
  value: number | string | boolean;
}

/**
 * 解析变量条件字符串
 *
 * 支持的格式：
 * - ">50"：大于 50
 * - ">=50"：大于等于 50
 * - "<50"：小于 50
 * - "<=50"：小于等于 50
 * - "==50"：等于 50
 * - "!=50"：不等于 50
 * - "==true" / "==false"：布尔值比较
 * "==hello"：字符串等于
 * - "contains:hello"：包含子串
 * - "not_contains:hello"：不包含子串
 *
 * @param condition 条件字符串
 * @returns 解析后的条件，解析失败返回 null
 */
function parseVarCondition(condition: string): ParsedVarCondition | null {
  const trimmed = condition.trim();

  // 按优先级匹配操作符（先匹配双字符操作符）
  const operators: { op: VarOperator; prefix: string }[] = [
    { op: '>=', prefix: '>=' },
    { op: '<=', prefix: '<=' },
    { op: '==', prefix: '==' },
    { op: '!=', prefix: '!=' },
    { op: '>', prefix: '>' },
    { op: '<', prefix: '<' },
  ];

  // 尝试匹配数值/布尔/字符串比较操作符
  for (const { op, prefix } of operators) {
    if (trimmed.startsWith(prefix)) {
      const valueStr = trimmed.slice(prefix.length).trim();
      return { operator: op, value: parseValue(valueStr) };
    }
  }

  // 尝试匹配 contains / not_contains
  if (trimmed.startsWith('contains:')) {
    return { operator: 'contains', value: trimmed.slice('contains:'.length).trim() };
  }
  if (trimmed.startsWith('not_contains:')) {
    return { operator: 'not_contains', value: trimmed.slice('not_contains:'.length).trim() };
  }

  // 无操作符时默认为 == 比较
  return { operator: '==', value: parseValue(trimmed) };
}

/**
 * 将字符串值解析为合适的类型（number / boolean / string）
 */
function parseValue(valueStr: string): number | string | boolean {
  const lower = valueStr.toLowerCase();
  if (lower === 'true') return true;
  if (lower === 'false') return false;
  const num = Number(valueStr);
  if (!isNaN(num) && valueStr.trim() !== '') return num;
  // 去除引号
  if (
    (valueStr.startsWith('"') && valueStr.endsWith('"')) ||
    (valueStr.startsWith("'") && valueStr.endsWith("'"))
  ) {
    return valueStr.slice(1, -1);
  }
  return valueStr;
}

/**
 * 评估单个变量条件是否满足
 *
 * @param currentValue 当前变量值
 * @param condition 解析后的条件
 * @returns 是否满足条件
 */
function evaluateVarCondition(
  currentValue: number | string | boolean | undefined,
  condition: ParsedVarCondition
): boolean {
  if (currentValue === undefined) {
    return false;
  }

  const { operator, value } = condition;

  switch (operator) {
    case '>':
      return Number(currentValue) > Number(value);
    case '>=':
      return Number(currentValue) >= Number(value);
    case '<':
      return Number(currentValue) < Number(value);
    case '<=':
      return Number(currentValue) <= Number(value);
    case '==':
      // 布尔值比较
      if (typeof value === 'boolean') {
        return Boolean(currentValue) === value;
      }
      // 数值比较
      if (typeof value === 'number') {
        return Number(currentValue) === value;
      }
      // 字符串比较
      return String(currentValue) === String(value);
    case '!=':
      if (typeof value === 'boolean') {
        return Boolean(currentValue) !== value;
      }
      if (typeof value === 'number') {
        return Number(currentValue) !== value;
      }
      return String(currentValue) !== String(value);
    case 'contains':
      return String(currentValue).includes(String(value));
    case 'not_contains':
      return !String(currentValue).includes(String(value));
    default:
      return false;
  }
}

// ─── 主类 ────────────────────────────────────────────────

/**
 * DynamicContextInjector — 动态上下文注入器
 *
 * 管理上下文条目库，根据场景状态匹配并注入相关背景信息到 LLM 提示词。
 * 支持 SillyTavern WorldInfo 格式的导入导出。
 */
export class DynamicContextInjector {
  /** 上下文条目库（按 ID 索引） */
  private entries: Map<string, ContextEntry> = new Map();
  /** ID 自增计数器 */
  private idCounter: number = 0;

  /**
   * 生成唯一条目 ID
   */
  private generateId(): string {
    this.idCounter++;
    return `ctx_${Date.now().toString(36)}_${this.idCounter}`;
  }

  // ── Entry Library：条目管理 ──

  /**
   * 添加上下文条目
   *
   * @param entry 条目数据（不含 id）
   * @returns 新建条目的 ID
   */
  addEntry(entry: Omit<ContextEntry, 'id'>): string {
    const id = this.generateId();
    const fullEntry: ContextEntry = { id, ...entry };
    this.entries.set(id, fullEntry);
    return id;
  }

  /**
   * 移除上下文条目
   *
   * @param id 条目 ID
   */
  removeEntry(id: string): void {
    this.entries.delete(id);
  }

  /**
   * 更新上下文条目
   *
   * @param id 条目 ID
   * @param patch 要更新的字段
   */
  updateEntry(id: string, patch: Partial<ContextEntry>): void {
    const existing = this.entries.get(id);
    if (!existing) return;
    this.entries.set(id, { ...existing, ...patch, id });
  }

  /**
   * 获取所有上下文条目
   *
   * @returns 条目数组（按优先级降序排列）
   */
  getEntries(): ContextEntry[] {
    return Array.from(this.entries.values()).sort((a, b) => b.priority - a.priority);
  }

  /**
   * 根据 ID 获取单个条目
   */
  getEntry(id: string): ContextEntry | undefined {
    return this.entries.get(id);
  }

  /**
   * 清空所有条目
   */
  clear(): void {
    this.entries.clear();
    this.idCounter = 0;
  }

  /**
   * 获取条目总数
   */
  size(): number {
    return this.entries.size;
  }

  // ── Scanner & Matcher：扫描与匹配 ──

  /**
   * 检查关键词是否命中
   *
   * 关键词匹配逻辑：检查当前节点文本和对话内容是否包含任一关键词。
   * 支持中文和英文关键词，英文不区分大小写。
   *
   * @param keywords 关键词列表
   * @param state 场景状态
   * @returns 是否命中
   */
  private matchKeywords(
    keywords: string[] | undefined,
    state: SceneState
  ): boolean {
    if (!keywords || keywords.length === 0) {
      return true; // 无关键词条件视为始终匹配
    }

    // 合并当前文本和对话作为搜索目标
    const searchText = [
      state.currentText || '',
      state.currentDialogue || '',
    ].join('\n').toLowerCase();

    if (!searchText.trim()) {
      return false;
    }

    return keywords.some((keyword) => {
      const isChinese = /[\u4e00-\u9fa5]/.test(keyword);
      return isChinese
        ? searchText.includes(keyword)
        : searchText.includes(keyword.toLowerCase());
    });
  }

  /**
   * 检查变量条件是否满足
   *
   * 解析 "key:>value" 等条件字符串，与当前变量值比较。
   * 所有条件必须全部满足（AND 逻辑）。
   *
   * @param variables 变量条件映射
   * @param state 场景状态
   * @returns 是否全部满足
   */
  private matchVariables(
    variables: Record<string, string> | undefined,
    state: SceneState
  ): boolean {
    if (!variables || Object.keys(variables).length === 0) {
      return true; // 无变量条件视为始终匹配
    }

    return Object.entries(variables).every(([key, conditionStr]) => {
      const condition = parseVarCondition(conditionStr);
      if (!condition) return false;
      const currentValue = state.variables[key];
      return evaluateVarCondition(currentValue, condition);
    });
  }

  /**
   * 检查场景 ID 是否匹配
   *
   * @param scenes 场景 ID 列表
   * @param state 场景状态
   * @returns 是否匹配
   */
  private matchScenes(
    scenes: string[] | undefined,
    state: SceneState
  ): boolean {
    if (!scenes || scenes.length === 0) {
      return true; // 无场景条件视为始终匹配
    }
    if (!state.currentSceneId) return false;
    return scenes.includes(state.currentSceneId);
  }

  /**
   * 检查节点 ID 是否匹配
   *
   * 支持两种匹配模式：
   * 1. 当前节点 ID 直接匹配
   * 2. 历史中访问过的节点 ID 匹配
   *
   * @param nodeIds 节点 ID 列表
   * @param state 场景状态
   * @returns 是否匹配
   */
  private matchNodeIds(
    nodeIds: string[] | undefined,
    state: SceneState
  ): boolean {
    if (!nodeIds || nodeIds.length === 0) {
      return true; // 无节点条件视为始终匹配
    }

    // 当前节点匹配
    if (state.currentNodeId && nodeIds.includes(state.currentNodeId)) {
      return true;
    }

    // 历史节点匹配
    if (state.history && state.history.length > 0) {
      return nodeIds.some((id) => state.history.includes(id));
    }

    return false;
  }

  /**
   * 检查单个条目是否匹配当前场景状态
   *
   * 所有触发条件（keywords / variables / scenes / nodeIds）之间是 AND 逻辑，
   * 即所有非空条件都必须满足才视为匹配。
   *
   * @param entry 上下文条目
   * @param state 场景状态
   * @returns 是否匹配
   */
  private matchEntry(entry: ContextEntry, state: SceneState): boolean {
    if (!entry.enabled) return false;

    const { triggers } = entry;
    return (
      this.matchKeywords(triggers.keywords, state) &&
      this.matchVariables(triggers.variables, state) &&
      this.matchScenes(triggers.scenes, state) &&
      this.matchNodeIds(triggers.nodeIds, state)
    );
  }

  // ── Injector：注入逻辑 ──

  /**
   * 扫描场景状态，匹配条目，返回按优先级排序的注入内容
   *
   * 匹配流程：
   * 1. 遍历所有启用的条目
   * 2. 对每个条目检查触发条件（keywords / variables / scenes / nodeIds）
   * 3. 收集所有匹配的条目
   * 4. 按 priority 降序排序
   * 5. 按 position（system / user / assistant）分组拼接内容
   *
   * @param state 当前场景状态
   * @returns 注入结果，包含各位置的注入内容和匹配的条目 ID
   */
  inject(state: SceneState): InjectResult {
    // 匹配所有条目
    const matched: ContextEntry[] = [];
    for (const entry of this.entries.values()) {
      if (this.matchEntry(entry, state)) {
        matched.push(entry);
      }
    }

    // 按优先级降序排序（priority 相同时保持插入顺序）
    matched.sort((a, b) => b.priority - a.priority);

    // 按 position 分组拼接内容
    const systemParts: string[] = [];
    const userParts: string[] = [];
    const assistantParts: string[] = [];
    const matchedIds: string[] = [];

    for (const entry of matched) {
      matchedIds.push(entry.id);
      const content = entry.content.trim();
      if (!content) continue;

      switch (entry.position) {
        case 'system':
          systemParts.push(content);
          break;
        case 'user':
          userParts.push(content);
          break;
        case 'assistant':
          assistantParts.push(content);
          break;
      }
    }

    return {
      systemContext: systemParts.join('\n\n'),
      userContext: userParts.join('\n\n'),
      assistantContext: assistantParts.join('\n\n'),
      matchedEntries: matchedIds,
    };
  }

  /**
   * 便捷方法：将注入结果应用到已有的提示词消息
   *
   * @param messages 原始消息列表
   * @param state 当前场景状态
   * @returns 注入上下文后的消息列表（不修改原始数组）
   */
  injectIntoMessages(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    state: SceneState
  ): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> {
    const result = this.inject(state);
    if (result.matchedEntries.length === 0) {
      return messages;
    }

    return messages.map((msg) => {
      if (msg.role === 'system' && result.systemContext) {
        return { ...msg, content: `${msg.content}\n\n${result.systemContext}` };
      }
      if (msg.role === 'user' && result.userContext) {
        return { ...msg, content: `${msg.content}\n\n${result.userContext}` };
      }
      if (msg.role === 'assistant' && result.assistantContext) {
        return { ...msg, content: `${msg.content}\n\n${result.assistantContext}` };
      }
      return msg;
    });
  }

  // ── SillyTavern WorldInfo 导入导出 ──

  /**
   * 导入 SillyTavern WorldInfo JSON 格式
   *
   * SillyTavern WorldInfo 格式参考：
   * {
   *   "entries": {
   *     "0": {
   *       "uid": 0,
   *       "key": ["keyword1", "keyword2"],        // 主关键词
   *       "keysecondary": ["sec1"],                 // 次关键词（可选）
   *       "comment": "条目描述",
   *       "content": "注入内容",
   *       "constant": false,                        // 是否常驻注入
   *       "selective": true,                         // 是否选择性触发
   *       "order": 100,                              // 优先级（数值越大越优先）
   *       "position": 0,                             // 0=before main prompt(system), 1=after main prompt(user)
   *       "disable": false,                          // 是否禁用
   *       "depth": 4,                                // 注入深度
   *       "role": null,                              // 0=system, 1=user, 2=assistant
   *       "probability": 100                         // 触发概率
   *     }
   *   }
   * }
   *
   * @param json SillyTavern WorldInfo JSON 对象
   * @returns 成功导入的条目数量
   */
  importFromWorldInfo(json: any): number {
    if (!json || typeof json !== 'object') {
      return 0;
    }

    // 兼容两种结构：{ entries: {...} } 或直接 { "0": {...}, "1": {...} }
    const entriesObj = json.entries || json;
    if (!entriesObj || typeof entriesObj !== 'object') {
      return 0;
    }

    let count = 0;
    for (const entryKey of Object.keys(entriesObj)) {
      const raw = entriesObj[entryKey];
      if (!raw || typeof raw !== 'object') continue;

      try {
        // 解析关键词：key 可能是字符串或数组
        const keywords: string[] = [];
        if (raw.key) {
          if (Array.isArray(raw.key)) {
            keywords.push(...raw.key.filter((k: any) => typeof k === 'string' && k.trim()));
          } else if (typeof raw.key === 'string') {
            // SillyTavern 中关键词可能用逗号分隔
            keywords.push(
              ...raw.key.split(',').map((k: string) => k.trim()).filter(Boolean)
            );
          }
        }
        // 合并次关键词
        if (raw.keysecondary) {
          if (Array.isArray(raw.keysecondary)) {
            keywords.push(
              ...raw.keysecondary.filter((k: any) => typeof k === 'string' && k.trim())
            );
          } else if (typeof raw.keysecondary === 'string') {
            keywords.push(
              ...raw.keysecondary.split(',').map((k: string) => k.trim()).filter(Boolean)
            );
          }
        }

        // 解析注入位置
        // SillyTavern: position 0 = before main prompt (system), 1 = after main prompt (user)
        // role: 0 = system, 1 = user, 2 = assistant（role 优先于 position）
        let position: InjectPosition = 'system';
        if (typeof raw.role === 'number') {
          if (raw.role === 1) position = 'user';
          else if (raw.role === 2) position = 'assistant';
          else position = 'system';
        } else if (typeof raw.position === 'number') {
          position = raw.position === 1 ? 'user' : 'system';
        }

        // 解析优先级（SillyTavern 的 order 范围通常 0-100）
        const priority = typeof raw.order === 'number'
          ? Math.max(0, Math.min(100, raw.order))
          : 50;

        // 解析是否启用
        const enabled = !raw.disable;

        // 解析内容
        const content = typeof raw.content === 'string' ? raw.content : '';

        // 构建触发条件
        const triggers: ContextTriggers = {};
        if (keywords.length > 0) {
          triggers.keywords = keywords;
        }
        // constant 为 true 时表示常驻注入（无触发条件，始终匹配）
        // 我们通过留空所有触发条件来实现（matchEntry 中无条件视为匹配）

        this.addEntry({
          triggers,
          content,
          position,
          priority,
          enabled,
          comment: typeof raw.comment === 'string' ? raw.comment : undefined,
        });
        count++;
      } catch {
        // 跳过无法解析的条目
        continue;
      }
    }

    return count;
  }

  /**
   * 导出为 SillyTavern WorldInfo JSON 格式
   *
   * @returns WorldInfo JSON 对象
   */
  exportToWorldInfo(): any {
    const entries: Record<string, any> = {};
    let index = 0;

    for (const entry of this.entries.values()) {
      const uid = index;
      const entryObj: any = {
        uid,
        key: entry.triggers.keywords || [],
        keysecondary: null,
        comment: entry.comment || '',
        content: entry.content,
        constant:
          !entry.triggers.keywords?.length &&
          !entry.triggers.variables &&
          !entry.triggers.scenes?.length &&
          !entry.triggers.nodeIds?.length,
        vectorized: false,
        selective: true,
        selectiveLogic: 0,
        addMemo: true,
        order: entry.priority,
        position: entry.position === 'user' ? 1 : 0,
        disable: !entry.enabled,
        excludeRecursion: false,
        preventRecursion: false,
        delayUntilRecursion: false,
        probability: 100,
        useProbability: true,
        depth: 4,
        group: '',
        groupOverride: false,
        groupWeight: 100,
        scanDepth: null,
        caseSensitive: null,
        matchWholeWords: null,
        automationId: '',
        role: entry.position === 'system' ? 0 : entry.position === 'user' ? 1 : 2,
        sticky: null,
        cooldown: null,
        delay: null,
      };

      // 将变量条件编码到 comment 中（SillyTavern 不直接支持变量条件）
      if (entry.triggers.variables) {
        const varStr = Object.entries(entry.triggers.variables)
          .map(([k, v]) => `${k}${v}`)
          .join('; ');
        entryObj.comment = entryObj.comment
          ? `${entryObj.comment} [变量条件: ${varStr}]`
          : `[变量条件: ${varStr}]`;
      }

      // 将场景/节点条件编码到 comment 中
      if (entry.triggers.scenes?.length) {
        entryObj.comment = entryObj.comment
          ? `${entryObj.comment} [场景: ${entry.triggers.scenes.join(',')}]`
          : `[场景: ${entry.triggers.scenes.join(',')}]`;
      }
      if (entry.triggers.nodeIds?.length) {
        entryObj.comment = entryObj.comment
          ? `${entryObj.comment} [节点: ${entry.triggers.nodeIds.join(',')}]`
          : `[节点: ${entry.triggers.nodeIds.join(',')}]`;
      }

      entries[String(uid)] = entryObj;
      index++;
    }

    return { entries };
  }
}

// ─── 工厂函数 ────────────────────────────────────────────

/**
 * 创建动态上下文注入器实例
 */
export function createDynamicContextInjector(): DynamicContextInjector {
  return new DynamicContextInjector();
}

/**
 * 从 SillyTavern WorldInfo JSON 创建注入器
 *
 * @param json WorldInfo JSON 对象
 * @returns 包含导入条目的注入器实例
 */
export function createFromWorldInfo(json: any): DynamicContextInjector {
  const injector = new DynamicContextInjector();
  injector.importFromWorldInfo(json);
  return injector;
}
