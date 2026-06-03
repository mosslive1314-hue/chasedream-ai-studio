// ChaseDream Creator Studio — Detroit: Become Human 级叙事扩展类型
// 新增数据模型：POV系统、限时选择、子图锁死、动态关系、章节变体、对话树、调查推理、道德追踪、脚本DSL

import type { Condition } from '../condition-engine';

// ═══════════════════════════════════════════════════════════════════
// 1. POV 主角视角切换系统
// ═══════════════════════════════════════════════════════════════════

/** 每个章节的视角配置 */
export interface POVConfig {
  id: string;
  chapterId: string;
  characterId: string;
  characterName: string;
  /** 视角切换发生在本章的第几个事件之后 */
  switchAfterEvent?: number;
  /** 视角叙事风格：第一人称内心独白 / 第三人称观察 / 过肩视角 */
  narrativeStyle: 'first_person' | 'third_person' | 'over_shoulder';
  narrativeStyleLabel: string;
  /** 该视角下的独有内心独白/旁白 */
  innerMonologue?: string;
}

// ═══════════════════════════════════════════════════════════════════
// 2. 限时选择系统 (Timed Decisions)
// ═══════════════════════════════════════════════════════════════════

/** 限时选择配置 — 添加到 InteractionPoint 的扩展 */
export interface TimedDecisionConfig {
  interactionPointId: string;
  /** 决策时限（秒），0 表示无限时 */
  timeLimit: number;
  /** 超时后的默认选项 ID（不选择也是一种选择） */
  defaultOptionId?: string;
  /** 超时后果描述 */
  timeoutConsequence: string;
  /** 超时时是否播放特殊演出 */
  timeoutCinematic?: string;
  /** 倒计时显示方式 */
  displayStyle: 'bar' | 'circle' | 'hidden' | 'heartbeat';
  /** 是否在倒计时最后阶段加速BGM */
  urgencyAudio: boolean;
  /** "不选择"的叙事意义 */
  silenceMeaning?: string; // e.g., "犹豫不决", "拒绝回答", "沉默以对"
}

// ═══════════════════════════════════════════════════════════════════
// 3. 子图锁死机制 (Storyline Lockout / Subgraph Lock)
// ═══════════════════════════════════════════════════════════════════

export type LockoutTrigger = 'character_death' | 'variable_threshold' | 'choice_made' | 'time_expired' | 'custom';

export interface SubgraphLock {
  id: string;
  /** 锁死触发条件类型 */
  triggerType: LockoutTrigger;
  /** 触发条件的详细描述/表达式 */
  triggerCondition: Condition;
  /** 触发描述（人类可读） */
  triggerDescription: string;
  /** 被锁死的节点 ID 列表 */
  lockedNodeIds: string[];
  /** 被锁死的边（from→to）列表 */
  lockedEdges?: { from: string; to: string }[];
  /** 锁死后显示的替代节点（如"角色已死"的灰色提示节点） */
  replacementNodeId?: string;
  /** 是否可逆（某些条件下可以解锁） */
  reversible: boolean;
  /** 解锁条件（仅 reversible=true 时有效） */
  unlockCondition?: Condition;
  /** 关联角色ID（用于角色死亡触发） */
  linkedCharacterId?: string;
  /** 视觉标记颜色 */
  lockColor: string;
}

// ═══════════════════════════════════════════════════════════════════
// 4. 动态关系计量表 (Runtime Relationship Meters)
// ═══════════════════════════════════════════════════════════════════

export interface RelationshipDelta {
  /** 发生在哪个节点 */
  nodeId: string;
  /** 选择/事件描述 */
  triggerDescription: string;
  /** 变化量（正=增进，负=恶化） */
  delta: number;
  /** 变化原因标签 */
  reason: string;
}

export interface RelationshipMeter {
  id: string;
  /** 关系双方角色 ID */
  characterAId: string;
  characterAName: string;
  characterBId: string;
  characterBName: string;
  /** 关系类型标签 */
  relationshipLabel: string; // e.g., "信任度", "好感度", "恐惧值", "羁绊"
  /** 当前值（-100 到 100） */
  currentValue: number;
  /** 初始值 */
  initialValue: number;
  /** 最小值 */
  minValue: number;
  /** 最大值 */
  maxValue: number;
  /** 关系阶段阈值 */
  thresholds: RelationshipThreshold[];
  /** 变化历史记录 */
  history: RelationshipDelta[];
  /** 对应的变量ID（与变量系统联动） */
  linkedVariableId?: string;
  /** 视觉颜色 */
  color: string;
}

export interface RelationshipThreshold {
  /** 阈值（-100 到 100） */
  value: number;
  /** 阶段标签 e.g., "敌对", "陌生", "友好", "亲密", "至交" */
  label: string;
  /** 达到该阈值时触发的叙事效果 */
  narrativeEffect?: string;
  /** 解锁的对话选项或互动 */
  unlocksContent?: string[];
}

// ═══════════════════════════════════════════════════════════════════
// 5. 章节变体结构 (Chapter Variants)
// ═══════════════════════════════════════════════════════════════════

export interface ChapterVariant {
  id: string;
  /** 变体名称 e.g., "和平革命路线", "暴力革命路线" */
  name: string;
  /** 激活条件 — 满足此条件时，本章使用此变体 */
  activationCondition: Condition;
  /** 激活条件的人类可读描述 */
  activationDescription: string;
  /** 变体独有的事件列表（覆盖或追加默认事件） */
  events: { id: string; title: string; description: string }[];
  /** 变体的情绪弧线 */
  emotionArc: string;
  /** 变体的主题提问 */
  themeQuestion?: string;
  /** 变体的视觉风格提示 */
  visualTone?: string;
  /** 关联的后果链 ID */
  linkedConsequenceIds?: string[];
}

// ═══════════════════════════════════════════════════════════════════
// 6. 对话树模型 (Nested Dialogue Trees)
// ═══════════════════════════════════════════════════════════════════

export type DialogueTone = 'friendly' | 'hostile' | 'neutral' | 'sarcastic' | 'empathetic' | 'cold' | 'flirtatious' | 'intimidating';

export interface DialogueChoice {
  id: string;
  /** 选项文本 */
  text: string;
  /** 语气标签 */
  tone: DialogueTone;
  /** 选择后可见条件 */
  visibleCondition?: Condition;
  /** 选择后跳转到的对话节点 ID */
  nextNodeId: string;
  /** 选择触发的变量变化 */
  variableEffects?: { variableId: string; delta: number }[];
  /** 选择触发的关系变化 */
  relationshipEffects?: { meterId: string; delta: number }[];
  /** 是否是一次性选项（选过就消失） */
  oneTime: boolean;
  /** 选项的叙事意义 */
  narrativeSignificance?: string;
}

export interface DialogueNode {
  id: string;
  /** 说话角色 ID */
  speakerId: string;
  speakerName: string;
  /** 台词文本 */
  text: string;
  /** 表情/动作演出指示 */
  performance?: string;
  /** 可用选项 */
  choices: DialogueChoice[];
  /** 是否是终端节点（对话结束） */
  isTerminal: boolean;
  /** 终端时的后续节点ID（回到主故事流） */
  exitNodeId?: string;
  /** 被打断时的反应 */
  interruptResponse?: string;
}

export interface DialogueTree {
  id: string;
  /** 对话树所属的场景/节点 ID */
  parentNodeId: string;
  /** 对话树名称 */
  name: string;
  /** 对话对象（NPC）角色ID */
  npcId: string;
  npcName: string;
  /** 起始对话节点 ID */
  startNodeId: string;
  /** 所有对话节点 */
  nodes: DialogueNode[];
  /** 对话触发条件 */
  triggerCondition?: Condition;
  /** 对话状态追踪（记录已选择的选项） */
  trackChoices: boolean;
  /** 对话可重复触发 */
  repeatable: boolean;
  /** 对话结束时的整体叙事影响摘要 */
  outcomeSummary?: string;
}

// ═══════════════════════════════════════════════════════════════════
// 7. 调查/推理系统 (Investigation & Deduction)
// ═══════════════════════════════════════════════════════════════════

export type EvidenceType = 'physical' | 'testimonial' | 'documentary' | 'digital' | 'circumstantial';

export interface Evidence {
  id: string;
  /** 证据名称 */
  name: string;
  /** 证据类型 */
  type: EvidenceType;
  typeLabel: string;
  /** 证据描述 */
  description: string;
  /** 发现该证据的节点 ID */
  discoveredAtNodeId?: string;
  /** 发现条件 */
  discoveryCondition?: Condition;
  /** 关联角色 */
  relatedCharacterIds?: string[];
  /** 关联场景 */
  relatedSceneIds?: string[];
  /** 证据重要性（1-5） */
  importance: number;
  /** 视觉资源（图片URL） */
  imageUrl?: string;
  /** 是否已被玩家发现 */
  discovered: boolean;
  /** 发现时的叙事文本 */
  discoveryNarrative?: string;
}

export interface Clue {
  id: string;
  /** 线索名称 */
  name: string;
  /** 线索描述 */
  description: string;
  /** 组成该线索的证据 ID 列表（需要收集哪些证据才能形成此线索） */
  requiredEvidenceIds: string[];
  /** 线索指向的推理方向 */
  pointsTo?: string; // deductionId
  /** 线索形成后的叙事文本 */
  revelationText?: string;
  /** 是否已激活 */
  activated: boolean;
}

export type DeductionResult = 'correct' | 'partial' | 'wrong' | 'inconclusive';

export interface Deduction {
  id: string;
  /** 推理问题 e.g., "谁杀害了受害者？" */
  question: string;
  /** 推理描述 */
  description: string;
  /** 可选结论 */
  conclusions: {
    id: string;
    text: string;
    isCorrect: boolean;
    requiredClueIds: string[];
    /** 选择此结论后的叙事影响 */
    narrativeConsequence: string;
    variableEffects?: { variableId: string; delta: number }[];
  }[];
  /** 推理发生的位置节点 ID */
  locationNodeId: string;
  /** 推理结果 */
  result?: DeductionResult;
  /** 推理限时（秒，0=无限时） */
  timeLimit: number;
  /** 推理失败/放弃的后果 */
  failureConsequence: string;
}

// ═══════════════════════════════════════════════════════════════════
// 8. 道德/意识形态追踪器 (Moral Compass / Ideology Tracker)
// ═══════════════════════════════════════════════════════════════════

export interface MoralAxis {
  id: string;
  /** 轴名称 e.g., "偏离度", "道德立场", "人性指数" */
  name: string;
  /** 负极标签 e.g., "服从", "冷漠", "机械" */
  negativeLabel: string;
  /** 正极标签 e.g., "偏离", "同理心", "人性" */
  positiveLabel: string;
  /** 当前值（-100 到 100） */
  currentValue: number;
  /** 初始值 */
  initialValue: number;
  /** 阶段划分 */
  zones: MoralZone[];
  /** 影响哪些结局 */
  affectsEndings: string[];
  /** 影响的NPC态度 */
  affectsNPCAttitudes: { characterId: string; threshold: number; attitudeChange: string }[];
  /** 影响可用选择（超出某区间后某些选择消失/出现） */
  gatesChoices?: { choiceOptionId: string; requiredRange: { min: number; max: number } }[];
  /** 视觉渐变色（负→正） */
  gradientColors: [string, string];
  /** 描述 */
  description: string;
}

export interface MoralZone {
  /** 区间最小值 */
  min: number;
  /** 区间最大值 */
  max: number;
  /** 区间标签 e.g., "绝对服从", "开始动摇", "觉醒中", "完全偏离" */
  label: string;
  /** 处于该区间时的叙事基调 */
  narrativeTone: string;
  /** 处于该区间时解锁的特殊内容 */
  unlockedContent?: string[];
}

// ═══════════════════════════════════════════════════════════════════
// 9. 脚本 DSL 内嵌演出指令 (Script Directives)
// ═══════════════════════════════════════════════════════════════════

export type DirectiveType =
  | 'bg_change'      // 切换背景
  | 'figure_change'  // 切换立绘
  | 'bgm'            // 背景音乐
  | 'sfx'            // 音效
  | 'camera'         // 镜头指令
  | 'transition'     // 转场
  | 'hotspot'        // 热区交互
  | 'animation'      // 动画
  | 'text_effect'    // 文字特效（震动、渐显等）
  | 'wait'           // 等待（秒）
  | 'conditional';   // 条件分支

export interface ScriptDirective {
  id: string;
  type: DirectiveType;
  /** DSL 原始文本 e.g., "changeFigure:kara_angry.png -next" */
  rawCommand: string;
  /** 解析后的参数 */
  params: Record<string, string | number | boolean>;
  /** 执行时机：台词开始前 / 台词中 / 台词结束后 */
  timing: 'before' | 'during' | 'after';
  /** 条件执行（仅在满足条件时执行） */
  condition?: Condition;
  /** 关联的 ScriptBlock ID */
  blockId: string;
}

// ═══════════════════════════════════════════════════════════════════
// 10. 路径时间预估扩展 (Path Time Estimation)
// ═══════════════════════════════════════════════════════════════════

export interface PathTimeEstimate {
  pathId: string;
  /** 总预估游玩时间（秒） */
  totalDuration: number;
  /** 分段时长 */
  segments: {
    nodeId: string;
    nodeLabel: string;
    /** 预估阅读/对话时间（秒） */
    dialogueTime: number;
    /** 预估选择/互动时间（秒） */
    interactionTime: number;
    /** 预估QTE时间（秒） */
    qteTime: number;
    /** 小计 */
    totalTime: number;
  }[];
  /** 节奏标签：快节奏 / 适中 / 慢节奏 */
  pacingLabel: 'fast' | 'moderate' | 'slow';
}
