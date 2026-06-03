// ChaseDream Creator Studio — Narrative Seed Data

import type {
  StoryNode, NodeEdge, NarrativeIntent, QualityCheck,
  WorldBuildingEntry, BranchPath, StageCheck, ScriptBlock,
  HeatmapEntry, ChapterPlan, WorldRule, InteractionPoint,
  PipelineStage, PathTestResult,
} from '../types/narrative';
import type {
  CharacterTimeline, CrossCharacterEffect,
  NarrativeState, ConsequenceChain, PlayerExplorationMap,
} from '../types/advanced-narrative';

// Node graph data
export const STORY_NODES: StoryNode[] = [
  { id: 'N01', label: '序章·霓虹夜幕', type: 'start', x: 300, y: 30 },
  { id: 'N02', label: '任务简报', type: 'scene', x: 300, y: 110 },
  { id: 'N03', label: '进入路线？', type: 'choice', x: 300, y: 190 },
  { id: 'N04', label: '暗夜通道', type: 'scene', x: 160, y: 280 },
  { id: 'N05', label: '换装渗透', type: 'scene', x: 440, y: 280 },
  { id: 'N06', label: '警卫逼近', type: 'qte', x: 300, y: 370 },
  { id: 'N07', label: '潜行判定', type: 'condition', x: 300, y: 450, hasError: true, errorMsg: '缺少失败反馈文案' },
  { id: 'N08', label: '数据到手', type: 'scene', x: 160, y: 540 },
  { id: 'N09', label: '身份暴露', type: 'scene', x: 440, y: 540 },
  { id: 'N10', label: '结局A 幽灵归来', type: 'ending_good', x: 160, y: 630 },
  { id: 'N11', label: '今夜失败', type: 'ending_bad', x: 440, y: 630 },
];

export const NODE_EDGES: NodeEdge[] = [
  { from: 'N01', to: 'N02', edgeType: 'causal' },
  { from: 'N02', to: 'N03', edgeType: 'causal' },
  { from: 'N03', to: 'N04', label: 'A', edgeType: 'exclusive' },
  { from: 'N03', to: 'N05', label: 'B', edgeType: 'exclusive' },
  { from: 'N04', to: 'N06', edgeType: 'causal' },
  { from: 'N05', to: 'N06', edgeType: 'causal' },
  { from: 'N06', to: 'N07', edgeType: 'conditional', condition: { type: 'atomic', targetId: 'stealth_score', targetType: 'variable', operator: 'gte', value: 50 } },
  { from: 'N07', to: 'N08', label: '\u6210\u529f', edgeType: 'implied' },
  { from: 'N07', to: 'N09', label: '\u5931\u8d25', edgeType: 'implied' },
  { from: 'N08', to: 'N10', edgeType: 'causal' },
  { from: 'N09', to: 'N11', edgeType: 'causal' },
];

// ── 叙事设计意图（P0-3）─────────────────────────────────────────────────────

export const NARRATIVE_INTENTS: NarrativeIntent[] = [
  { nodeId: 'N01', purpose: 'setup_payoff', purposeLabel: '建立世界观与角色', emotionValue: 3 },
  { nodeId: 'N02', purpose: 'reveal_info', purposeLabel: '揭示核心冲突', emotionValue: 5, choiceImpact: '影响后续信任判定' },
  { nodeId: 'N03', purpose: 'choice_pressure', purposeLabel: '关键路线选择', emotionValue: 6, choiceImpact: '决定渗透路线（暗巷 vs 大厦）', variableChanges: [{ variable: 'stealth_score', operation: '+15', value: 15 }] },
  { nodeId: 'N04', purpose: 'push_conflict', purposeLabel: '推进潜行冲突', emotionValue: 5, variableChanges: [{ variable: 'stealth_score', operation: '+10', value: 10 }] },
  { nodeId: 'N05', purpose: 'push_conflict', purposeLabel: '渗透紧张感', emotionValue: 6, variableChanges: [{ variable: 'alert_level', operation: '+10', value: 10 }] },
  { nodeId: 'N06', purpose: 'emotional_climax', purposeLabel: 'QTE 高潮时刻', emotionValue: 9, failFeedback: 'EMP失败导致警报触发，进入暴露路线' },
  { nodeId: 'N07', purpose: 'choice_pressure', purposeLabel: '条件判定·命运转折', emotionValue: 8, choiceImpact: '根据潜行值判定成功/失败，决定结局走向', variableChanges: [{ variable: 'stealth_score', operation: 'check', value: 60 }], failFeedback: '潜行值不足→身份暴露→坏结局' },
  { nodeId: 'N08', purpose: 'reveal_info', purposeLabel: '核心信息获取', emotionValue: 7, variableChanges: [{ variable: 'truth', operation: '+50', value: 50 }] },
  { nodeId: 'N09', purpose: 'emotional_climax', purposeLabel: '绝望与暴露', emotionValue: 8 },
  { nodeId: 'N10', purpose: 'resolution', purposeLabel: '好结局·真相揭露', emotionValue: 4 },
  { nodeId: 'N11', purpose: 'resolution', purposeLabel: '坏结局·遗憾收场', emotionValue: 6 },
];

// ── 质量检查系统（P0-4）─────────────────────────────────────────────────────

export const QUALITY_CHECKS: QualityCheck[] = [
  // 结构完整性
  { id: 'qc01', category: 'structure', categoryLabel: '结构完整性', label: '主线连通', status: 'ok', detail: '入口到所有结局路径已连通' },
  { id: 'qc02', category: 'structure', categoryLabel: '结构完整性', label: '所有结局可达', status: 'ok', detail: '2 个结局均可通过正常游玩触发' },
  { id: 'qc03', category: 'structure', categoryLabel: '结构完整性', label: '无孤立节点', status: 'ok', detail: '所有 11 个节点均在至少一条路径上' },
  { id: 'qc04', category: 'structure', categoryLabel: '结构完整性', label: '无死路', status: 'ok', detail: '所有非结局节点都有出路' },
  { id: 'qc05', category: 'structure', categoryLabel: '结构完整性', label: '无循环错误', status: 'ok', detail: '未检测到异常循环' },
  // 叙事质量
  { id: 'qc06', category: 'narrative', categoryLabel: '叙事质量', label: '选择有意义', status: 'ok', detail: 'N03 路线选择导致不同路径和结局' },
  { id: 'qc07', category: 'narrative', categoryLabel: '叙事质量', label: '分支不过短', status: 'ok', detail: '最短分支 4 个节点，满足最低要求' },
  { id: 'qc08', category: 'narrative', categoryLabel: '叙事质量', label: '失败反馈完整', status: 'error', detail: 'N07 潜行判定节点失败路径缺少文案', fixLink: '/nodes' },
  { id: 'qc09', category: 'narrative', categoryLabel: '叙事质量', label: '变量均被使用', status: 'ok', detail: '4 个变量均在条件判定中读取' },
  { id: 'qc10', category: 'narrative', categoryLabel: '叙事质量', label: '角色出场连贯', status: 'warn', detail: '反派主管在 N01-N04 连续 4 个节点未出场' },
  // 资产完整性
  { id: 'qc11', category: 'assets', categoryLabel: '资产完整性', label: '场景图片覆盖', status: 'warn', detail: '8/9 节点有图片，N06 和 N09 缺失' },
  { id: 'qc12', category: 'assets', categoryLabel: '资产完整性', label: 'BGM 覆盖', status: 'error', detail: '9 个节点 BGM 全部缺失', fixLink: '/assets' },
  { id: 'qc13', category: 'assets', categoryLabel: '资产完整性', label: 'UI 模板覆盖', status: 'warn', detail: 'QTE 面板和系统菜单尚未应用' },
  // 发布风险
  { id: 'qc14', category: 'publish', categoryLabel: '发布风险', label: '无未审核资产', status: 'ok', detail: '所有已生成资产已通过审核' },
  { id: 'qc15', category: 'publish', categoryLabel: '发布风险', label: '试玩已通过', status: 'warn', detail: '尚未完成至少一条完整路径试玩', fixLink: '/simulator' },
  { id: 'qc16', category: 'publish', categoryLabel: '发布风险', label: '体验时长合理', status: 'ok', detail: '预估 15 分钟，在目标范围内' },
];

// ── 世界观设定（统一）─────────────────────────────────────────────────────

export const WORLD_BUILDING: WorldBuildingEntry[] = [
  { category: '时代背景', content: '2047年，信息战与人工智能渗透社会各层。城市被霓虹灯与数据流覆盖，贫富差距加剧，隐私成为稀缺资源。' },
  { category: '核心冲突', content: '企业权力与个人隐私的终极博弈。追踪芯片技术使公民无所遁形，反抗者转入地下。' },
  { category: '主要场景', content: '霓虹街道 · 地下酒吧 · 企业大厦 · 数据中心 · 暗巷通道 — 共6个关键场景。' },
  { category: '关键道具', content: '追踪芯片 · 变声器 · 加密U盘 · 无人机 · EMP手雷 · 全息投影仪 · 神经接口 · 伪造ID · 信号屏蔽器' },
  { category: '故事主题', content: '信任与背叛、真相的代价、个人选择改变命运' },
];

// ── 世界规则数据（P3-4）─────────────────────────────────────────────

export const WORLD_RULES: WorldRule[] = [
  {
    id: 'wr-01', type: 'setting', typeLabel: '背景设定',
    title: '2047 年信息战时代',
    description: '人工智能渗透社会各层，城市被霓虹灯与数据流覆盖。追踪芯片技术使公民无所遁形，隐私成为稀缺资源。贫富差距加剧，反抗者转入地下。',
    severity: 'hard', validated: true,
    relatedScenes: ['s1', 's2', 's3', 's4', 's5', 's6'],
  },
  {
    id: 'wr-02', type: 'setting', typeLabel: '背景设定',
    title: '企业极权与地下世界',
    description: '大型企业掌握核心监控技术，实质上控制城市运转。地下酒吧和暗巷是反抗者的聚集地。两个世界通过数据黑市连接。',
    severity: 'hard', validated: true,
    relatedScenes: ['s2', 's3', 's6'],
  },
  {
    id: 'wr-03', type: 'character_constraint', typeLabel: '角色约束',
    title: '艾拉——冷静专业的侦探',
    description: '艾拉始终保持冷静和理性，即使在极端压力下也不会情绪失控。她的银色义眼是她唯一的身体改造，其余保持人类原貌。她绝不主动伤害无辜。',
    severity: 'hard', validated: true,
    relatedCharacters: ['c1'],
  },
  {
    id: 'wr-04', type: 'character_constraint', typeLabel: '角色约束',
    title: '线人——不可靠的情报源',
    description: '线人的信息永远不是 100% 准确的。他有自己的目的，会在关键时刻根据自身利益做出选择，而非帮助艾拉。他的真实身份在主线中不会完全揭露。',
    severity: 'hard', validated: true,
    relatedCharacters: ['c2'],
  },
  {
    id: 'wr-05', type: 'permanent_rule', typeLabel: '永久规则',
    title: '选择必须有代价',
    description: '每个重要选择都必须有实质性的后果差异。不允许出现"选择 A 和选择 B 最终到达同一个结果"的情况。每条分支路径必须提供独特的叙事体验。',
    severity: 'hard', validated: true,
  },
  {
    id: 'wr-06', type: 'permanent_rule', typeLabel: '永久规则',
    title: '潜行值决定命运',
    description: '潜行值是贯穿全剧的核心变量。玩家的每一次潜行相关选择都会影响最终判定。潜行值低于 60 时触发暴露路线，这是不可逆的命运转折。',
    severity: 'hard', validated: true,
  },
  {
    id: 'wr-07', type: 'narrative_taboo', typeLabel: '叙事禁忌',
    title: '禁止廉价反转',
    description: '不允许在最后一章引入之前从未铺垫的新角色或新设定来制造反转。所有反转必须在前面章节中有伏笔。伏笔回收率必须 ≥ 80%。',
    severity: 'hard', validated: true,
  },
  {
    id: 'wr-08', type: 'narrative_taboo', typeLabel: '叙事禁忌',
    title: '禁止 OOC（Out of Character）',
    description: '角色行为必须符合其已建立的性格特征。如果角色需要在特定情境下做出反常行为，必须给出充分的叙事理由（如极端压力、信息误导、被操控等）。',
    severity: 'hard', validated: true,
    relatedCharacters: ['c1', 'c2', 'c3'],
  },
  {
    id: 'wr-09', type: 'tension_check', typeLabel: '张力校验',
    title: '情绪节奏不能持续高张力',
    description: '连续两个以上高张力节点（情绪值 ≥ 8）后，必须安排一个缓冲节点（情绪值 ≤ 5），让玩家有喘息空间。否则会导致情绪疲劳。',
    severity: 'soft', validated: true,
  },
  {
    id: 'wr-10', type: 'tension_check', typeLabel: '张力校验',
    title: '每个结局必须有情感收束',
    description: '好结局不能纯粹是"成功"，必须包含代价或遗憾。坏结局不能纯粹是"失败"，必须包含希望或教训。避免情绪单一化。',
    severity: 'soft', validated: false,
  },
];

// ── 分支路径（统一）─────────────────────────────────────────────────────────

export const BRANCH_PATHS: BranchPath[] = [
  { id: 'main', label: '主线 A（成功路线）', nodes: ['N01','N02','N03','N04','N06','N07','N08','N10'], ending: '幽灵归来', type: 'good' },
  { id: 'alt', label: '主线 B（暴露路线）', nodes: ['N01','N02','N03','N05','N06','N07','N09','N11'], ending: '今夜失败', type: 'bad' },
];

// ── 阶段检查（NodesScreen 侧边栏）─────────────────────────────────────────

export const STAGE_CHECKS: StageCheck[] = [
  { label: '故事结构', detail: '11 个节点，入口和结局已连通', status: 'ok' },
  { label: '互动选择', detail: '1 个选择节点，2 个玩家选项', status: 'ok' },
  { label: '角色配置', detail: '3 个角色已配置', status: 'ok' },
  { label: '节点资产', detail: '8/9 个场景已有图片或视频，建议补齐', status: 'warn' },
  { label: '预览试玩', detail: '已从玩家视角打开过预览', status: 'ok' },
  { label: 'H5 发布', detail: 'H5 链接已发布，可分享给玩家', status: 'ok' },
];

// ── 剧本 Blocks（ScriptScreen）─────────────────────────────────────────────

export const SCRIPT_BLOCKS: ScriptBlock[] = [
  { id: 'b1', type: 'scene', label: '场景', color: '#5E50E8', content: '霓虹街道 · 夜 · 外  |  2047年，积水路面，广告牌投影闪烁，艾拉穿过熙攘人群。' },
  { id: 'b2', type: 'narr', label: '旁白', color: '#8892B0', content: '追踪信号在前方100米处中断。她停在一扇锈迹斑斑的门前，耳机里传来微弱杂音。' },
  { id: 'b3', type: 'dialog', label: '台词', char: '艾拉', color: '#00A99D', content: '线人在哪？已经等了整整20分钟了。' },
  { id: 'b4', type: 'choice', label: '选择', color: '#D97706', content: '是否相信陌生来电？', options: ['A. 相信，进地下酒吧', 'B. 拒绝接触，转身离开', 'C. 反向追踪来电来源'] },
  { id: 'b5', type: 'scene', label: '场景', color: '#5E50E8', content: '地下酒吧 · 夜 · 内  |  昏暗灯光，嘈杂人群，空气中弥漫着廉价酒精的气味。' },
  { id: 'b6', type: 'dialog', label: '台词', char: '线人', color: '#00A99D', content: '你来了。那枚追踪芯片……他们已经发现了。你必须在他们找到我之前做出选择。' },
  { id: 'b7', type: 'cond', label: '条件', color: '#D97706', content: '检查变量：trust_lineman ≥ 40 → 进入N07  |  否则 → 进入N09' },
];

export const AI_SUGGESTIONS: Record<string, string[]> = {
  write: ['AI 续写中……✨ 建议：「艾拉注意到线人手背上的追踪芯片切口——那是植入后的标记……」已插入下方。'],
  polish: ['AI 润色完成 ✨\n原文：「线人在哪？」\n优化为：「线人还没到？这已经是第三次失约了。」—— 更符合角色急迫情绪。'],
  branch: ['已为「进入路线」节点生成 2 个新分支：\n— C. 利用无人机侦察  → 触发条件 surveillance_drone > 0\n— D. 强行破门  → 触发 alert_level +20'],
};

// ── 热力图模拟数据（P2-13）─────────────────────────────────────────────

export const HEATMAP_DATA: HeatmapEntry[] = [
  { nodeId: 'N01', visitRate: 100, avgTimeSpent: 45, dropOffRate: 2, heatLevel: 'hot', playCount: 234, completionRate: 78 },
  { nodeId: 'N02', visitRate: 98, avgTimeSpent: 62, dropOffRate: 3, heatLevel: 'hot', playCount: 229, completionRate: 76 },
  { nodeId: 'N03', visitRate: 95, avgTimeSpent: 38, choiceDistribution: [58, 42], dropOffRate: 5, heatLevel: 'hot', playCount: 222, completionRate: 74 },
  { nodeId: 'N04', visitRate: 55, avgTimeSpent: 71, dropOffRate: 8, heatLevel: 'warm', playCount: 129, completionRate: 72 },
  { nodeId: 'N05', visitRate: 40, avgTimeSpent: 55, dropOffRate: 12, heatLevel: 'warm', playCount: 94, completionRate: 65 },
  { nodeId: 'N06', visitRate: 88, avgTimeSpent: 22, dropOffRate: 15, heatLevel: 'hot', playCount: 206, completionRate: 60 },
  { nodeId: 'N07', visitRate: 82, avgTimeSpent: 18, choiceDistribution: [68, 32], dropOffRate: 22, heatLevel: 'warm', playCount: 192, completionRate: 58 },
  { nodeId: 'N08', visitRate: 52, avgTimeSpent: 85, dropOffRate: 4, heatLevel: 'warm', playCount: 122, completionRate: 92 },
  { nodeId: 'N09', visitRate: 30, avgTimeSpent: 48, dropOffRate: 35, heatLevel: 'cold', playCount: 70, completionRate: 15 },
  { nodeId: 'N10', visitRate: 48, avgTimeSpent: 95, dropOffRate: 0, heatLevel: 'warm', playCount: 112, completionRate: 100 },
  { nodeId: 'N11', visitRate: 28, avgTimeSpent: 42, dropOffRate: 0, heatLevel: 'cold', playCount: 65, completionRate: 100 },
];

// ── 章节规划数据（P3-2）─────────────────────────────────────────────

export const CHAPTER_PLANS: ChapterPlan[] = [
  {
    id: 'ch0',
    chapterNumber: 0,
    title: '序章：霓虹夜幕',
    themeQuestion: '在一个没有隐私的世界里，一个人还能隐藏什么？',
    emotionArc: '平静 → 紧张 → 好奇',
    events: [
      { id: 'e0-1', title: '夜幕降临', description: '2047年深夜，霓虹灯光把积水路面染成猩红。艾拉穿过熙攘人群，追踪一个中断的信号。', isBranchPoint: false },
      { id: 'e0-2', title: '信号中断', description: '追踪信号在一扇锈迹斑斑的门前消失。耳机里传来微弱杂音，似乎在等待回应。', isBranchPoint: true, branchOptions: [
        { label: '推门进入', consequence: '直接进入任务简报，节奏更快' },
        { label: '先观察环境', consequence: '获取额外信息，增加信任值' },
      ], variableHints: ['trust_lineman +5'] },
    ],
    keyDialogue: '（无对白，纯环境叙事）',
    characterStates: '艾拉：警觉、专注、略带疲惫',
    suspenseHook: '线人为什么没有按约定出现？',
    chapterEndHook: '锈门后传来脚步声——有人在等她。',
    estimatedDuration: '2 分钟',
  },
  {
    id: 'ch1',
    chapterNumber: 1,
    title: '第一章：线人接头',
    themeQuestion: '信任是奢侈品还是必需品？',
    emotionArc: '紧张 → 犹豫 → 决断',
    events: [
      { id: 'e1-1', title: '线人现身', description: '线人从暗处走出，神情紧张。他手背上有追踪芯片的切口——那是植入后被取出的痕迹。', isBranchPoint: false },
      { id: 'e1-2', title: '关键情报', description: '线人告知追踪芯片已被发现，必须在被找到之前做出选择。', isBranchPoint: false },
      { id: 'e1-3', title: '信任抉择', description: '艾拉需要决定是否信任这个反复失约的线人。', isBranchPoint: true, branchOptions: [
        { label: 'A. 相信线人，一起行动', consequence: '信任值大幅提升，进入合作路线' },
        { label: 'B. 保持怀疑，独自调查', consequence: '信任值下降，进入独行路线' },
        { label: 'C. 假装相信，暗中观察', consequence: '信任值不变，获得额外观察信息' },
      ], variableHints: ['trust_lineman ±20'] },
    ],
    keyDialogue: '"你来了。那枚追踪芯片……他们已经发现了。"',
    characterStates: '艾拉：犹豫但冷静 / 线人：恐惧、急切',
    suspenseHook: '线人是否真的可信？他手背上的伤口意味着什么？',
    chapterEndHook: '无论选择什么，艾拉必须在今夜找到答案。',
    estimatedDuration: '3 分钟',
  },
  {
    id: 'ch2',
    chapterNumber: 2,
    title: '第二章：渗透行动',
    themeQuestion: '为了真相，你愿意冒多大的险？',
    emotionArc: '决断 → 紧张 → 高潮 → 转折',
    events: [
      { id: 'e2-1', title: '路线选择', description: '艾拉面临关键抉择——走安全的暗巷通道，还是冒险换装渗入企业大厦。', isBranchPoint: true, branchOptions: [
        { label: 'A. 暗夜通道潜行', consequence: '低警戒路线，潜行值增加' },
        { label: 'B. 换装渗透大厦', consequence: '高警戒路线，风险更大但信息更丰富' },
      ], variableHints: ['stealth_score +15 / alert_level +10'] },
      { id: 'e2-2', title: '警卫逼近', description: '无论走哪条路线，都遭遇了巡逻警卫。必须在 1.5 秒内做出反应。', isBranchPoint: false },
      { id: 'e2-3', title: 'QTE 判定', description: '系统根据潜行值判定是否成功通过警卫区域。', isBranchPoint: true, branchOptions: [
        { label: '潜行值 ≥ 60 → 成功', consequence: '安全通过，进入数据获取路线' },
        { label: '潜行值 < 60 → 失败', consequence: '身份暴露，进入逃亡路线' },
      ], variableHints: ['stealth_score 条件检查'] },
      { id: 'e2-4', title: '数据到手 / 身份暴露', description: '根据判定结果进入完全不同的剧情走向。', isBranchPoint: false },
      { id: 'e2-5', title: '结局分支', description: '好结局：艾拉带着证据安全撤离。坏结局：艾拉被捕，证据湮没。', isBranchPoint: false },
    ],
    keyDialogue: '"数据到手了。加密U盘里记录了所有证据。"',
    characterStates: '艾拉：高度紧张、决绝 / 反派主管：冷酷、掌控全局',
    suspenseHook: '艾拉的潜行能力能否让她安全通过？',
    chapterEndHook: '霓虹夜幕中，幽灵消失在人群里——或者被铁链锁住。',
    estimatedDuration: '5 分钟',
  },
];

// ── 互动点设计数据（P3-3）─────────────────────────────────────────────

export const INTERACTION_POINTS: InteractionPoint[] = [
  {
    id: 'ip-01', name: '\u95e8\u524d\u6296\u62e9', nodeId: 'N01', chapterId: 'ch0',
    playerIntent: '\u51b3\u5b9a\u827e\u62c9\u63a5\u8fd1\u76ee\u6807\u7684\u65b9\u5f0f\u2014\u2014\u76f4\u63a5\u884c\u52a8\u8fd8\u662f\u8c28\u614e\u89c2\u5bdf',
    options: [
      { label: '\u63a8\u95e8\u8fdb\u5165', consequence: '\u76f4\u63a5\u8fdb\u5165\u4efb\u52a1\u7b80\u62a5\uff0c\u8282\u594f\u7d27\u51d1', pathEffect: '\u4e3b\u8def\u7ebf' },
      { label: '\u5148\u89c2\u5bdf\u73af\u5883', consequence: '\u83b7\u53d6\u7ebf\u4eba\u4f4d\u7f6e\u4fe1\u606f\uff0c\u5efa\u7acb\u521d\u6b65\u4fe1\u4efb', variableEffect: 'trust_lineman +5', longTermImpact: '\u540e\u7eed\u7ebf\u4eba\u5bf9\u8bdd\u4e2d\u591a\u4e00\u6761\u4fe1\u606f\u7ebf\u7d22' },
    ],
    feedback: '\u827e\u62c9\u505a\u51fa\u9009\u62e9\uff0c\u5411\u9508\u8ff9\u6591\u6591\u7684\u95e8\u8d70\u53bb\u3002',
    emotionIntensity: 3,
    narrativePurpose: '\u5efa\u7acb\u73a9\u5bb6\u4e0e\u89d2\u8272\u7684\u7b2c\u4e00\u6b21\u4e92\u52a8\uff0c\u5b9a\u4e49\u73a9\u5bb6\u98ce\u683c\uff08\u51b2\u52a8\u578b vs \u8c28\u614e\u578b\uff09',
    tested: true,
    interactionType: 'exploration',
  },
  {
    id: 'ip-02', name: '\u4fe1\u4efb\u5224\u5b9a', nodeId: 'N02', chapterId: 'ch1',
    playerIntent: '\u51b3\u5b9a\u662f\u5426\u4fe1\u4efb\u53cd\u590d\u5931\u7ea6\u7684\u7ebf\u4eba\u2014\u2014\u8fd9\u662f\u5168\u5267\u6838\u5fc3\u4fe1\u4efb\u4f53\u7cfb\u7684\u8d77\u70b9',
    options: [
      { label: '\u76f8\u4fe1\u7ebf\u4eba\uff0c\u4e00\u8d77\u884c\u52a8', consequence: '\u4fe1\u4efb\u503c\u5927\u5e45\u63d0\u5347\uff0c\u8fdb\u5165\u5408\u4f5c\u8def\u7ebf', variableEffect: 'trust_lineman +20', pathEffect: '\u5408\u4f5c\u8def\u7ebf', longTermImpact: '\u7ebf\u4eba\u5728\u5173\u952e\u65f6\u523b\u4f1a\u56de\u62a5\u4fe1\u4efb' },
      { label: '\u4fdd\u6301\u6000\u7591\uff0c\u72ec\u81ea\u8c03\u67e5', consequence: '\u4fe1\u4efb\u503c\u4e0b\u964d\uff0c\u8fdb\u5165\u72ec\u884c\u8def\u7ebf', variableEffect: 'trust_lineman -10', pathEffect: '\u72ec\u884c\u8def\u7ebf', longTermImpact: '\u7ebf\u4eba\u53ef\u80fd\u5728\u540e\u671f\u80cc\u53db\u6216\u6d88\u5931' },
    ],
    feedback: '\u827e\u62c9\u6ce8\u89c6\u7740\u7ebf\u4eba\u7684\u773c\u775b\uff0c\u8bd5\u56fe\u4ece\u4ed6\u7684\u8868\u60c5\u4e2d\u8bfb\u51fa\u771f\u76f8\u3002',
    emotionIntensity: 5,
    narrativePurpose: '\u6838\u5fc3\u4fe1\u4efb\u4f53\u7cfb\u7684\u8d77\u70b9\uff0c\u5f71\u54cd\u540e\u7eed\u6240\u6709\u4e0e\u7ebf\u4eba\u76f8\u5173\u7684\u5267\u60c5\u8d70\u5411',
    tested: true,
    interactionType: 'dialogue',
  },
  {
    id: 'ip-03', name: '\u8def\u7ebf\u9009\u62e9', nodeId: 'N03', chapterId: 'ch2',
    playerIntent: '\u9009\u62e9\u6e17\u900f\u65b9\u5f0f\u2014\u2014\u6f5c\u884c\uff08\u4f4e\u98ce\u9669\u4f4e\u56de\u62a5\uff09\u8fd8\u662f\u4f2a\u88c5\u6e17\u900f\uff08\u9ad8\u98ce\u9669\u9ad8\u56de\u62a5\uff09',
    options: [
      { label: '\u6697\u591c\u901a\u9053\u6f5c\u884c', consequence: '\u901a\u8fc7\u5730\u4e0b\u7ba1\u9053\u63a5\u8fd1\u76ee\u6807\uff0c\u5b89\u5168\u4f46\u7f13\u6162', variableEffect: 'stealth_score +15', pathEffect: '\u8def\u7ebfA' },
      { label: '\u6362\u88c5\u6e17\u900f\u5927\u53a6', consequence: '\u4f2a\u88c5\u6210\u4f01\u4e1a\u5458\u5de5\u76f4\u63a5\u6e17\u5165\uff0c\u5feb\u901f\u4f46\u5371\u9669', variableEffect: 'alert_level +10', pathEffect: '\u8def\u7ebfB', longTermImpact: '\u8def\u7ebfB\u4f1a\u89e6\u53d1\u66f4\u591a\u540e\u7eed\u906d\u9047' },
    ],
    feedback: '\u827e\u62c9\u786e\u8ba4\u4e86\u8def\u7ebf\uff0c\u6df1\u5438\u4e00\u53e3\u6c14\uff0c\u5f00\u59cb\u884c\u52a8\u3002',
    emotionIntensity: 6,
    narrativePurpose: '\u51b3\u5b9a\u7b2c\u4e8c\u5e55\u7684\u6838\u5fc3\u4f53\u9a8c\u98ce\u683c\u2014\u2014\u6f5c\u884c vs \u6e17\u900f',
    tested: true,
    interactionType: 'decision',
  },
  {
    id: 'ip-04', name: 'QTE \u53cd\u5e94', nodeId: 'N06', chapterId: 'ch2',
    playerIntent: '\u5728\u8b66\u536b\u903c\u8fd1\u7684\u7d27\u6025\u65f6\u523b\u5feb\u901f\u53cd\u5e94\u2014\u2014\u7528\u9053\u5177\u667a\u53d6\u8fd8\u662f\u5f3a\u884c\u7a81\u7834',
    options: [
      { label: '\u4f7f\u7528 EMP \u624b\u96f7', consequence: '\u762b\u75ea\u8b66\u536b\u901a\u8baf\uff0c\u5b89\u5168\u901a\u8fc7', variableEffect: 'stealth_score +20', longTermImpact: 'EMP \u4f7f\u7528\u540e\u4e0d\u53ef\u518d\u7528' },
      { label: '\u5f3a\u884c\u7a81\u7834', consequence: '\u89e6\u53d1\u8b66\u62a5\uff0c\u8fdb\u5165\u9ad8\u98ce\u9669\u9003\u4ea1', variableEffect: 'stealth_score -30', pathEffect: '\u8fdb\u5165\u66b4\u9732\u8def\u7ebf' },
    ],
    feedback: '\u65f6\u95f4\u4eff\u4f5b\u51dd\u56fa\u2014\u2014\u827e\u62c9\u5fc5\u987b\u5728 1.5 \u79d2\u5185\u505a\u51fa\u51b3\u5b9a\u3002',
    failureFeedback: '\u53cd\u5e94\u8fc7\u6162\uff01\u8b66\u536b\u5df2\u7ecf\u53d1\u73b0\u5f02\u5e38\uff0c\u8b66\u62a5\u58f0\u523a\u8033\u54cd\u8d77\u3002',
    emotionIntensity: 9,
    narrativePurpose: '\u5168\u5267\u60c5\u7eea\u9ad8\u6f6e\u70b9\uff0cQTE \u673a\u5236\u7684\u7d27\u5f20\u4f53\u9a8c',
    tested: false,
    interactionType: 'confrontation',
  },
  {
    id: 'ip-05', name: '\u6f5c\u884c\u6761\u4ef6\u5224\u5b9a', nodeId: 'N07', chapterId: 'ch2',
    playerIntent: '\u7cfb\u7edf\u6839\u636e\u7d2f\u79ef\u7684\u6f5c\u884c\u503c\u81ea\u52a8\u5224\u5b9a\u2014\u2014\u547d\u8fd0\u7531\u4e4b\u524d\u7684\u9009\u62e9\u51b3\u5b9a',
    options: [
      { label: '\u6f5c\u884c\u503c \u2265 60 \u2192 \u6210\u529f\u901a\u8fc7', consequence: '\u5b89\u5168\u8fdb\u5165\u6570\u636e\u4e2d\u5fc3\uff0c\u83b7\u53d6\u6838\u5fc3\u8bc1\u636e', pathEffect: '\u8fdb\u5165\u597d\u7ed3\u5c40\u8def\u7ebf' },
      { label: '\u6f5c\u884c\u503c < 60 \u2192 \u66b4\u9732\u88ab\u6355', consequence: '\u8b66\u62a5\u89e6\u53d1\uff0c\u8fdb\u5165\u9003\u4ea1\u8def\u7ebf', pathEffect: '\u8fdb\u5165\u574f\u7ed3\u5c40\u8def\u7ebf' },
    ],
    feedback: '\u7cfb\u7edf\u626b\u63cf\u901a\u8fc7\u2014\u2014\u8eab\u4efd\u672a\u88ab\u8bc6\u522b\u3002',
    failureFeedback: '\uff08\u5f85\u8865\u5145\u2014\u2014\u5f53\u524d\u7f3a\u5931\u5931\u8d25\u53cd\u9988\u6587\u6848\uff09',
    visibleCondition: 'stealth_score \u7d2f\u8ba1\u503c',
    emotionIntensity: 8,
    narrativePurpose: '\u547d\u8fd0\u8f6c\u6298\u70b9\u2014\u2014\u4e4b\u524d\u6240\u6709\u9009\u62e9\u7684\u6c47\u603b\u68c0\u9a8c',
    tested: false,
    interactionType: 'confrontation',
  },
];

// ── 制作管线阶段数据（P3-1）─────────────────────────────────────────────

export const PIPELINE_STAGES: PipelineStage[] = [
  {
    id: 'stage-01', order: 1, name: '项目创建',
    description: '设定项目类型、题材、目标时长与互动规格',
    icon: '📋', status: 'completed', progress: 100,
    artifacts: ['项目配置', '基础信息'],
    issues: [],
    nextAction: '已完成',
    requiresHumanConfirm: false,
    linkedPage: '/settings',
  },
  {
    id: 'stage-02', order: 2, name: '素材导入与解构',
    description: '导入小说/故事，AI 提取角色、场景、道具、事件',
    icon: '📥', status: 'completed', progress: 100,
    artifacts: ['故事大纲', '角色设定 3 位', '场景设定 6 处', '道具设定 9 件'],
    issues: [],
    nextAction: '已完成',
    requiresHumanConfirm: true,
    linkedPage: '/parse',
  },
  {
    id: 'stage-03', order: 3, name: '世界观与叙事规则',
    description: '确定故事主题、角色约束、世界规则与叙事禁忌',
    icon: '🌍', status: 'completed', progress: 100,
    artifacts: ['时代背景', '核心冲突', '主要场景', '关键道具', '故事主题'],
    issues: [],
    nextAction: '已完成',
    requiresHumanConfirm: true,
    linkedPage: '/story-overview',
  },
  {
    id: 'stage-04', order: 4, name: '章纲规划',
    description: '生成线性章节规划，定义每章主题、情绪弧与事件',
    icon: '📝', status: 'completed', progress: 85,
    artifacts: ['7 个剧本 Block', '章节事件列表'],
    issues: ['分支点标记待完善'],
    nextAction: '进入剧本编辑页面完善章节细节',
    requiresHumanConfirm: true,
    linkedPage: '/script',
  },
  {
    id: 'stage-05', order: 5, name: '线性剧本',
    description: '将章纲扩写为完整线性剧本：对白、场景、旁白、动作',
    icon: '📖', status: 'completed', progress: 100,
    artifacts: ['场景描述 7 段', '对白 7 段', '旁白 7 段'],
    issues: [],
    nextAction: '已完成',
    requiresHumanConfirm: false,
    linkedPage: '/script',
  },
  {
    id: 'stage-06', order: 6, name: '互动叙事设计',
    description: '在剧本中标记互动点：选择、分支、变量、结局',
    icon: '🎭', status: 'active', progress: 65,
    artifacts: ['叙事意图 11 个', '情绪曲线', '变量关联 4 个'],
    issues: ['N07 潜行判定缺少失败反馈', 'QTE 节点缺详细配置'],
    nextAction: '前往互动设计页面完善互动意图与失败反馈',
    requiresHumanConfirm: true,
    linkedPage: '/interaction',
  },
  {
    id: 'stage-07', order: 7, name: '变量与交互机制',
    description: '配置变量系统、QTE、Hotspot 等交互机制',
    icon: '⚙️', status: 'active', progress: 50,
    artifacts: ['潜行值', '警戒值', '信任值', '真相值'],
    issues: ['变量未配置详细范围', 'QTE 缺可视化编辑器', '无 Hotspot 配置'],
    nextAction: '完善变量范围和 QTE 交互配置',
    requiresHumanConfirm: false,
    linkedPage: '/interaction',
  },
  {
    id: 'stage-08', order: 8, name: '节点图谱与路径',
    description: '生成节点图，验证路径连通性与结构完整性',
    icon: '🗺️', status: 'active', progress: 75,
    artifacts: ['11 个节点', '11 条连线', '2 条分支路径', '2 个结局'],
    issues: ['节点类型筛选已完成，高级诊断模式待开发'],
    nextAction: '验证所有路径可达性',
    requiresHumanConfirm: false,
    linkedPage: '/nodes',
  },
  {
    id: 'stage-09', order: 9, name: '资产生成与管理',
    description: '按节点需求生成图片、BGM、音效、视频等资产',
    icon: '🎨', status: 'active', progress: 40,
    artifacts: ['场景图片 7/9', '角色立绘 1/3'],
    issues: ['9 个节点 BGM 全部缺失', 'N06/N09 缺图片', '反派主管立绘缺失'],
    nextAction: '前往资产库补齐缺失 BGM 和图片',
    requiresHumanConfirm: false,
    linkedPage: '/assets',
  },
  {
    id: 'stage-10', order: 10, name: '演出预览与试玩',
    description: '以玩家视角试玩完整流程，验证体验质量',
    icon: '🎬', status: 'upcoming', progress: 20,
    artifacts: ['可玩预览已就绪'],
    issues: ['尚未完成完整路径试玩'],
    nextAction: '前往试玩页面跑完至少一条完整路径',
    requiresHumanConfirm: false,
    linkedPage: '/simulator',
  },
  {
    id: 'stage-11', order: 11, name: '质检与修复',
    description: '运行 16 项质检，修复阻塞发布的问题',
    icon: '🔍', status: 'upcoming', progress: 60,
    artifacts: ['16 项质检已完成', '结构维度 5/5 通过', '叙事维度 4/5 通过'],
    issues: ['N07 失败反馈缺失', 'BGM 全覆盖未达标', '试玩未通过'],
    nextAction: '修复 3 项阻塞发布的质检问题',
    requiresHumanConfirm: false,
    linkedPage: '/overview',
  },
  {
    id: 'stage-12', order: 12, name: '发布与版本管理',
    description: '创建版本快照，发布 H5 链接，管理版本历史',
    icon: '🚀', status: 'upcoming', progress: 30,
    artifacts: ['H5 链接已发布', 'v1.2.3 当前版本'],
    issues: ['BGM 缺失阻塞完整发布', '体验时长待验证'],
    nextAction: '补齐资产后创建发布版本',
    requiresHumanConfirm: true,
    linkedPage: '/publish',
  },
];

// ── 路径自动测试数据（P4-9）─────────────────────────────────────────────

export const PATH_TEST_RESULTS: PathTestResult[] = [
  {
    pathId: 'path-a',
    pathLabel: '路线 A：暗夜潜行 → 成功',
    nodes: ['N01', 'N02', 'N03', 'N04', 'N06', 'N07', 'N08', 'N10'],
    ending: '幽灵归来',
    endingType: 'good',
    reachable: true,
    stuck: false,
    missingAssets: ['N06 缺少背景图片', 'N01-N10 全部缺少 BGM'],
    variableErrors: [],
    emptyDialogues: [],
    totalDuration: 480,
    testTime: '2026-06-02 15:30:00',
    passed: false,
  },
  {
    pathId: 'path-b',
    pathLabel: '路线 B：换装渗透 → 暴露',
    nodes: ['N01', 'N02', 'N03', 'N05', 'N06', 'N07', 'N09', 'N11'],
    ending: '今夜失败',
    endingType: 'bad',
    reachable: true,
    stuck: false,
    missingAssets: ['N06 缺少背景图片', 'N09 缺少背景图片', 'N01-N11 全部缺少 BGM'],
    variableErrors: ['N07 潜行值判定条件可能导致意外分支'],
    emptyDialogues: [],
    totalDuration: 420,
    testTime: '2026-06-02 15:30:00',
    passed: false,
  },
  {
    pathId: 'path-c',
    pathLabel: '路线 C：暗夜潜行 → QTE失败 → 暴露',
    nodes: ['N01', 'N02', 'N03', 'N04', 'N06', 'N07F', 'N09', 'N11'],
    ending: '今夜失败',
    endingType: 'bad',
    reachable: true,
    stuck: false,
    missingAssets: ['N06 缺少背景图片', 'N09 缺少背景图片'],
    variableErrors: [],
    emptyDialogues: ['N07F 失败反馈文案缺失'],
    totalDuration: 390,
    testTime: '2026-06-02 15:30:00',
    passed: false,
  },
  {
    pathId: 'path-d',
    pathLabel: '路线 D：换装渗透 → QTE成功 → 数据到手',
    nodes: ['N01', 'N02', 'N03', 'N05', 'N06', 'N07S', 'N08', 'N10'],
    ending: '幽灵归来',
    endingType: 'good',
    reachable: true,
    stuck: false,
    missingAssets: ['N06 缺少背景图片'],
    variableErrors: [],
    emptyDialogues: [],
    totalDuration: 510,
    testTime: '2026-06-02 15:30:00',
    passed: false,
  },
];

// ── 多主角叙事时间线（P7-7）─────────────────────────────────────────────

export const CHARACTER_TIMELINES: CharacterTimeline[] = [
  {
    characterId: 'c1', characterName: '艾拉', color: '#5E50E8',
    status: 'alive',
    storyArc: '从疲惫的侦探到真相的守护者',
    chapters: ['ch0', 'ch1', 'ch2'],
    events: [
      { id: 'ct-e1', chapterId: 'ch0', nodeIds: ['N01', 'N02'], eventTitle: '深夜接头', description: '追踪中断信号抵达接头地点，与线人会面', statusChange: undefined, choiceMade: '推门进入' },
      { id: 'ct-e2', chapterId: 'ch1', nodeIds: ['N02', 'N03'], eventTitle: '信任抉择', description: '面对线人的警告，决定是否信任这个反复失约的人', choiceMade: '相信线人', impactOnOthers: [{ characterId: 'c2', effect: '线人获得信任，后续提供更多情报' }] },
      { id: 'ct-e3', chapterId: 'ch2', nodeIds: ['N04', 'N06'], eventTitle: '潜入行动', description: '选择暗夜通道潜入企业大厦，遭遇警卫巡逻', statusChange: { from: 'alive', to: 'alive' } },
      { id: 'ct-e4', chapterId: 'ch2', nodeIds: ['N07', 'N08'], eventTitle: '命运判定', description: '根据累积潜行值判定是否成功潜入数据中心', choiceMade: '由系统变量决定' },
      { id: 'ct-e5', chapterId: 'ch2', nodeIds: ['N10'], eventTitle: '幽灵归来', description: '带着核心证据安全撤离，消失在霓虹夜幕中' },
    ],
    relationships: [
      { targetId: 'c2', type: '信任/合作', strength: 65 },
      { targetId: 'c3', type: '对抗/追踪', strength: -80 },
    ],
  },
  {
    characterId: 'c2', characterName: '线人', color: '#D97706',
    status: 'alive',
    storyArc: '在自保与良知之间摇摆的灰色角色',
    chapters: ['ch0', 'ch1'],
    events: [
      { id: 'ct-f1', chapterId: 'ch0', nodeIds: ['N02'], eventTitle: '传递警告', description: '告知艾拉追踪芯片已被发现，催促她做出选择' },
      { id: 'ct-f2', chapterId: 'ch1', nodeIds: ['N02', 'N03'], eventTitle: '接受或失去信任', description: '根据艾拉的选择，获得更多的信任或被疏远', choiceMade: '取决于玩家选择', impactOnOthers: [{ characterId: 'c1', effect: '影响艾拉后续可获得的情报量' }] },
    ],
    relationships: [
      { targetId: 'c1', type: '被信任/被怀疑', strength: 40 },
      { targetId: 'c3', type: '恐惧/隐藏', strength: -60 },
    ],
  },
  {
    characterId: 'c3', characterName: '反派主管', color: '#DC2626',
    status: 'alive',
    storyArc: '冷酷的企业权力代言人，真相的守门人',
    chapters: ['ch2'],
    events: [
      { id: 'ct-g1', chapterId: 'ch2', nodeIds: ['N05', 'N06'], eventTitle: '安保部署', description: '发现异常后加强大厦安保巡逻，部署警卫力量', impactOnOthers: [{ characterId: 'c1', effect: '增加艾拉潜入难度' }] },
      { id: 'ct-g2', chapterId: 'ch2', nodeIds: ['N09'], eventTitle: '全息现身', description: '在艾拉被捕后通过全息投影出现，宣告胜利' },
    ],
    relationships: [
      { targetId: 'c1', type: '追捕/对抗', strength: -90 },
      { targetId: 'c2', type: '搜寻/威胁', strength: -70 },
    ],
  },
];

// Cross-character impact matrix
export const CROSS_CHARACTER_EFFECTS: CrossCharacterEffect[] = [
  { id: 'cce-01', sourceCharacterId: 'c1', sourceEvent: '选择信任线人', sourceNodeId: 'N02', targetCharacterId: 'c2', effectType: 'help', effectDescription: '线人获得信任，在 N08 主动提供关键情报', delayed: true, triggerChapter: 'ch2' },
  { id: 'cce-02', sourceCharacterId: 'c1', sourceEvent: '怀疑线人', sourceNodeId: 'N02', targetCharacterId: 'c2', effectType: 'harm', effectDescription: '线人信任降低，在关键时刻可能不提供帮助', delayed: true, triggerChapter: 'ch2' },
  { id: 'cce-03', sourceCharacterId: 'c3', sourceEvent: '加强安保部署', sourceNodeId: 'N05', targetCharacterId: 'c1', effectType: 'harm', effectDescription: '警卫密度增加，潜行判定难度提升', delayed: false },
  { id: 'cce-04', sourceCharacterId: 'c2', sourceEvent: '提供EMP手雷情报', sourceNodeId: 'N02', targetCharacterId: 'c1', effectType: 'info', effectDescription: '获得EMP手雷使用方法，QTE成功率提升', delayed: true, triggerChapter: 'ch2' },
  { id: 'cce-05', sourceCharacterId: 'c1', sourceEvent: '成功获取数据', sourceNodeId: 'N08', targetCharacterId: 'c3', effectType: 'harm', effectDescription: '反派主管的监控计划被揭露，权力基础动摇', delayed: true },
];

// ── 叙事状态机（P7-8）─────────────────────────────────────────────

export const NARRATIVE_STATES: NarrativeState[] = [
  // 角色状态
  { id: 'ns-01', category: 'character', categoryLabel: '角色状态', name: '艾拉存活状态', valueType: 'enum', enumValues: ['存活', '受伤', '失踪', '被捕', '死亡'], currentValue: '存活', description: '艾拉当前的身体和自由状态', modifiedAt: ['N06', 'N07', 'N09'], readAt: ['N07', 'N10', 'N11'], affectsEndings: ['GOOD', 'BAD'] },
  { id: 'ns-02', category: 'character', categoryLabel: '角色状态', name: '线人存活状态', valueType: 'enum', enumValues: ['活跃', '隐藏', '被捕', '死亡'], currentValue: '活跃', description: '线人当前的状态', modifiedAt: ['N03'], readAt: ['N08'], dependsOn: ['ns-04'] },
  { id: 'ns-03', category: 'character', categoryLabel: '角色状态', name: '反派主管警觉度', valueType: 'numeric', minValue: 0, maxValue: 100, numericValue: 30, description: '反派主管对异常情况的警觉程度', modifiedAt: ['N05', 'N06'], readAt: ['N07', 'N09'] },
  // 关系状态
  { id: 'ns-04', category: 'relationship', categoryLabel: '关系状态', name: '艾拉-线人信任', valueType: 'enum', enumValues: ['完全信任', '基本信任', '怀疑', '敌对', '断绝'], currentValue: '基本信任', description: '艾拉对线人的信任程度', modifiedAt: ['N02', 'N03'], readAt: ['N07', 'N08'], affectsEndings: ['GOOD'] },
  { id: 'ns-05', category: 'relationship', categoryLabel: '关系状态', name: '艾拉-反派对立', valueType: 'enum', enumValues: ['未知', '暗中对抗', '公开对抗', '追捕中'], currentValue: '暗中对抗', description: '艾拉与反派主管的关系状态', modifiedAt: ['N05', 'N09'], readAt: ['N09', 'N11'] },
  // 世界状态
  { id: 'ns-06', category: 'world', categoryLabel: '世界状态', name: '城市安保等级', valueType: 'enum', enumValues: ['正常', '加强', '戒严', '封锁'], currentValue: '加强', description: '企业控制下的城市安保状态', modifiedAt: ['N05', 'N06', 'N07'], readAt: ['N07', 'N09'] },
  { id: 'ns-07', category: 'world', categoryLabel: '世界状态', name: '舆论态势', valueType: 'enum', enumValues: ['平静', '暗流涌动', '发酵', '爆发'], currentValue: '平静', description: '公众对企业监控的态度', modifiedAt: ['N08'], readAt: ['N10'], affectsEndings: ['GOOD'] },
  { id: 'ns-08', category: 'world', categoryLabel: '世界状态', name: 'EMP 可用状态', valueType: 'boolean', boolValue: true, description: 'EMP手雷是否仍然可用（一次性道具）', modifiedAt: ['N06'], readAt: ['N06'] },
  // 剧情状态
  { id: 'ns-09', category: 'plot', categoryLabel: '剧情状态', name: '证据链完整度', valueType: 'numeric', minValue: 0, maxValue: 100, numericValue: 20, description: '已收集的企业非法证据完整程度', modifiedAt: ['N02', 'N08'], readAt: ['N10'], affectsEndings: ['GOOD'] },
  { id: 'ns-10', category: 'plot', categoryLabel: '剧情状态', name: '身份暴露', valueType: 'boolean', boolValue: false, description: '艾拉的潜入身份是否已被识破', modifiedAt: ['N06', 'N07'], readAt: ['N07', 'N09'], dependsOn: ['ns-01', 'ns-06'], affectsEndings: ['BAD'] },
  { id: 'ns-11', category: 'plot', categoryLabel: '剧情状态', name: '隐藏路线开启', valueType: 'boolean', boolValue: false, description: '是否存在隐藏的第三条路线（高难度解锁）', modifiedAt: [], readAt: [], dependsOn: ['ns-04', 'ns-09'] },
];

// ── 选择后果追踪链（P7-9）─────────────────────────────────────────────

export const CONSEQUENCE_CHAINS: ConsequenceChain[] = [
  { id: 'cc-01', sourceNodeId: 'N01', sourceChoiceLabel: '推门进入', timing: 'immediate', timingLabel: '即时反馈', affectedNodeIds: ['N02'], affectedStates: [], affectedCharacters: ['c1'], description: '艾拉直接进入酒吧，节奏更快，错过额外情报', visualColor: '#22C55E', resolved: true, payoffNodeId: 'N02' },
  { id: 'cc-02', sourceNodeId: 'N01', sourceChoiceLabel: '先观察环境', timing: 'immediate', timingLabel: '即时反馈', affectedNodeIds: ['N02'], affectedStates: ['ns-04'], affectedCharacters: ['c1', 'c2'], description: '获得线人位置信息，信任值 +5，后续对话多一条线索', visualColor: '#22C55E', resolved: true, payoffNodeId: 'N02' },
  { id: 'cc-03', sourceNodeId: 'N02', sourceChoiceLabel: '相信线人', timing: 'delayed', timingLabel: '延迟影响（第二章回收）', affectedNodeIds: ['N08'], affectedStates: ['ns-04', 'ns-09'], affectedCharacters: ['c2'], description: '线人在 N08 主动提供核心情报，证据链完整度大幅提升', visualColor: '#EAB308', resolved: true, payoffNodeId: 'N08' },
  { id: 'cc-04', sourceNodeId: 'N02', sourceChoiceLabel: '保持怀疑', timing: 'delayed', timingLabel: '延迟影响（第二章回收）', affectedNodeIds: ['N07', 'N08'], affectedStates: ['ns-04'], affectedCharacters: ['c2'], description: '线人信任降低，可能在关键时刻不提供帮助或消失', visualColor: '#EAB308', resolved: false },
  { id: 'cc-05', sourceNodeId: 'N03', sourceChoiceLabel: '暗夜通道潜行', timing: 'delayed', timingLabel: '延迟影响（QTE 前回收）', affectedNodeIds: ['N06', 'N07'], affectedStates: ['ns-01', 'ns-06'], affectedCharacters: ['c1'], description: '低警戒路线，潜行值 +15，城市安保等级不变', visualColor: '#EAB308', resolved: true, payoffNodeId: 'N07' },
  { id: 'cc-06', sourceNodeId: 'N03', sourceChoiceLabel: '换装渗透大厦', timing: 'delayed', timingLabel: '延迟影响（QTE 前回收）', affectedNodeIds: ['N05', 'N06', 'N07'], affectedStates: ['ns-03', 'ns-06'], affectedCharacters: ['c1', 'c3'], description: '高警戒路线，反派警觉度提升，安保等级加强', visualColor: '#EAB308', resolved: true, payoffNodeId: 'N07' },
  { id: 'cc-07', sourceNodeId: 'N06', sourceChoiceLabel: '使用 EMP 手雷', timing: 'immediate', timingLabel: '即时反馈', affectedNodeIds: ['N07S'], affectedStates: ['ns-08', 'ns-01'], affectedCharacters: ['c1'], description: 'EMP 瘫痪警卫通讯，安全通过，但道具不可再用', visualColor: '#22C55E', resolved: true, payoffNodeId: 'N07S' },
  { id: 'cc-08', sourceNodeId: 'N06', sourceChoiceLabel: '强行突破', timing: 'immediate', timingLabel: '即时反馈', affectedNodeIds: ['N07F', 'N09'], affectedStates: ['ns-01', 'ns-10'], affectedCharacters: ['c1'], description: '警报触发，进入暴露路线，身份暴露风险急剧上升', visualColor: '#22C55E', resolved: true, payoffNodeId: 'N07F' },
  { id: 'cc-09', sourceNodeId: 'N07', sourceChoiceLabel: '潜行值 ≥ 60', timing: 'ending', timingLabel: '结局影响', affectedNodeIds: ['N08', 'N10'], affectedStates: ['ns-09', 'ns-07'], affectedCharacters: ['c1', 'c3'], description: '成功获取证据 → 证据链完整 → 舆论爆发 → 好结局：幽灵归来', visualColor: '#EF4444', resolved: true, payoffNodeId: 'N10' },
  { id: 'cc-10', sourceNodeId: 'N07', sourceChoiceLabel: '潜行值 < 60', timing: 'ending', timingLabel: '结局影响', affectedNodeIds: ['N09', 'N11'], affectedStates: ['ns-10', 'ns-01'], affectedCharacters: ['c1', 'c3'], description: '身份暴露 → 被捕 → 证据湮没 → 坏结局：今夜失败', visualColor: '#EF4444', resolved: true, payoffNodeId: 'N11' },
];

// ── 玩家探索图数据（P7-11）─────────────────────────────────────────────

export const PLAYER_EXPLORATION: PlayerExplorationMap = {
  allNodeIds: ['N01', 'N02', 'N03', 'N04', 'N05', 'N06', 'N07S', 'N07F', 'N08', 'N09', 'N10', 'N11'],
  allEndingIds: ['N10', 'N11'],
  allBranchCount: 4,
  sessions: [
    {
      id: 'session-1', sessionLabel: '第 1 次游玩', playthroughNumber: 1,
      visitedNodeIds: ['N01', 'N02', 'N03', 'N04', 'N06', 'N07S', 'N08', 'N10'],
      discoveredBranchIds: ['path-a'],
      reachedEndingIds: ['N10'],
      choicesMade: [
        { nodeId: 'N01', choiceLabel: '推门进入' },
        { nodeId: 'N02', choiceLabel: '相信线人' },
        { nodeId: 'N03', choiceLabel: '暗夜通道潜行' },
        { nodeId: 'N06', choiceLabel: '使用 EMP 手雷' },
      ],
      duration: 480, timestamp: '2026-06-01 20:30:00',
    },
    {
      id: 'session-2', sessionLabel: '第 2 次游玩', playthroughNumber: 2,
      visitedNodeIds: ['N01', 'N02', 'N03', 'N05', 'N06', 'N07F', 'N09', 'N11'],
      discoveredBranchIds: ['path-b'],
      reachedEndingIds: ['N11'],
      choicesMade: [
        { nodeId: 'N01', choiceLabel: '先观察环境' },
        { nodeId: 'N02', choiceLabel: '保持怀疑' },
        { nodeId: 'N03', choiceLabel: '换装渗透大厦' },
        { nodeId: 'N06', choiceLabel: '强行突破' },
      ],
      duration: 420, timestamp: '2026-06-01 21:15:00',
    },
    {
      id: 'session-3', sessionLabel: '第 3 次游玩', playthroughNumber: 3,
      visitedNodeIds: ['N01', 'N02', 'N03', 'N05', 'N06', 'N07S', 'N08', 'N10'],
      discoveredBranchIds: ['path-d'],
      reachedEndingIds: ['N10'],
      choicesMade: [
        { nodeId: 'N01', choiceLabel: '推门进入' },
        { nodeId: 'N02', choiceLabel: '相信线人' },
        { nodeId: 'N03', choiceLabel: '换装渗透大厦' },
        { nodeId: 'N06', choiceLabel: '使用 EMP 手雷' },
      ],
      duration: 510, timestamp: '2026-06-02 10:00:00',
    },
  ],
  totalPlaythroughs: 3,
  nodeCoverage: 92,            // N07 (original condition node) treated as visited via N07S/N07F
  endingCoverage: 100,         // Both endings reached
  branchCoverage: 75,          // 3 out of 4 paths explored
  undiscoveredNodes: [],       // All nodes visited across sessions
  undiscoveredEndings: [],     // Both endings reached
};

// ── Re-export sibling seed data for backward compatibility ──
// Some consumers (e.g. use-narrative-store) import all seed data from this file.
export * from './project-seed';
export * from './game-seed';
export * from './ui-seed';
export * from './qte-seed';
export * from './industry-seed';
export * from './cinematic-seed';
export * from './collaboration-seed';
