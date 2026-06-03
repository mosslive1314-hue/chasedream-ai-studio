// ChaseDream Creator Studio — Industry Seed Data

import type { ProjectSpecTemplate, IndustryLabelMap, IndustryTemplate, IndustryQCRule, IndustryAssetType } from '../types/industry';

// ── 项目规格模板数据（P4-12）─────────────────────────────────────────────

export const PROJECT_SPEC_TEMPLATES: ProjectSpecTemplate[] = [
  {
    projectType: 'novel_adaptation',
    typeLabel: '小说改编',
    typeIcon: '📚',
    typeDescription: '将已有小说或故事改编为互动影视游戏。系统会辅助解构故事、提取角色和场景、生成互动设计。',
    suggestedGenres: ['悬疑推理', '言情恋爱', '科幻冒险', '奇幻史诗', '都市情感', '赛博朋克'],
    suggestedDurations: [
      { label: '短篇（15-30 分钟）', value: 'short' },
      { label: '中篇（30-60 分钟）', value: 'medium' },
      { label: '长篇（60-120 分钟）', value: 'long' },
    ],
    suggestedChapters: [3, 5, 8, 12],
    suggestedInteractionDensity: [
      { label: '轻度（每章 1-2 个选择）', value: 'light' },
      { label: '中度（每章 3-5 个选择）', value: 'medium' },
      { label: '重度（每章 5+ 个选择）', value: 'heavy' },
    ],
    suggestedEndings: [2, 3, 5, 8],
  },
  {
    projectType: 'original_creation',
    typeLabel: '全新创作',
    typeIcon: '✨',
    typeDescription: '从零开始创作一个互动故事。AI 会辅助你构建世界观、设计角色、生成剧情框架。',
    suggestedGenres: ['悬疑推理', '恐怖惊悚', '恋爱模拟', '冒险探索', '历史架空', '日常治愈'],
    suggestedDurations: [
      { label: '短篇（15-30 分钟）', value: 'short' },
      { label: '中篇（30-60 分钟）', value: 'medium' },
      { label: '长篇（60-120 分钟）', value: 'long' },
    ],
    suggestedChapters: [3, 5, 8, 12, 20],
    suggestedInteractionDensity: [
      { label: '轻度（每章 1-2 个选择）', value: 'light' },
      { label: '中度（每章 3-5 个选择）', value: 'medium' },
      { label: '重度（每章 5+ 个选择）', value: 'heavy' },
    ],
    suggestedEndings: [2, 3, 5, 8, 12],
  },
  {
    projectType: 'script_adaptation',
    typeLabel: '剧本改编',
    typeIcon: '🎬',
    typeDescription: '将已有的影视剧本或舞台剧本改编为互动版本。保留核心对白，增加互动分支。',
    suggestedGenres: ['都市情感', '职场悬疑', '古装宫廷', '青春校园', '谍战特工'],
    suggestedDurations: [
      { label: '单集（20-40 分钟）', value: 'short' },
      { label: '迷你剧（3-5 集）', value: 'medium' },
      { label: '连续剧（8-12 集）', value: 'long' },
    ],
    suggestedChapters: [5, 8, 12, 20],
    suggestedInteractionDensity: [
      { label: '轻度（关键剧情点选择）', value: 'light' },
      { label: '中度（每场戏有选择）', value: 'medium' },
    ],
    suggestedEndings: [2, 3, 5],
  },
  {
    projectType: 'interactive_import',
    typeLabel: '导入互动脚本',
    typeIcon: '📦',
    typeDescription: '导入已有的互动脚本文件（WebGAL、Ren\'Py、自定义 JSON 格式），在平台上进行可视化管理。',
    suggestedGenres: ['不限题材'],
    suggestedDurations: [{ label: '保持原有长度', value: 'keep' }],
    suggestedChapters: [],
    suggestedInteractionDensity: [{ label: '保持原有设计', value: 'keep' }],
    suggestedEndings: [],
  },
];

// ── 行业通用化数据（P6-1）─────────────────────────────────────────────

// Map of underlying object names to industry-specific display names
export const INDUSTRY_LABELS: IndustryLabelMap = {
  node: { game: '剧情节点', tourism: '体验点', education: '学习环节', derivative: '剧情片段' },
  edge: { game: '路径连线', tourism: '游览路线', education: '学习路径', derivative: '剧情跳转' },
  choice: { game: '玩家选择', tourism: '参观者选择', education: '学生决策', derivative: '观众选择' },
  variable: { game: '状态变量', tourism: '探索进度', education: '掌握度', derivative: '剧情状态' },
  ending: { game: '结局', tourism: '体验结果', education: '学习反馈', derivative: '分支结局' },
  asset: { game: '游戏资产', tourism: '展品素材', education: '教学素材', derivative: '影视素材' },
  worldRules: { game: '世界规则', tourism: '史实边界', education: '知识边界', derivative: '原作设定' },
  qte: { game: 'QTE 交互', tourism: '点击互动', education: '实验操作', derivative: '互动镜头' },
  hotspot: { game: '热区交互', tourism: '展品探索', education: '答题触发', derivative: '线索点击' },
  chapter: { game: '章节', tourism: '展区', education: '课程单元', derivative: '剧集片段' },
  character: { game: '角色', tourism: '人物', education: '知识角色', derivative: '剧中人物' },
  scene: { game: '场景', tourism: '地点', education: '学习环境', derivative: '拍摄场景' },
  prop: { game: '道具', tourism: '展品', education: '教学工具', derivative: '关键物件' },
  pipeline: { game: '制作管线', tourism: '导览制作', education: '课程制作', derivative: '衍生制作' },
  simulator: { game: '演出预览', tourism: '体验预览', education: '学习预览', derivative: '互动预览' },
  publish: { game: '发布', tourism: '发布导览', education: '发布课程', derivative: '发布互动版' },
  overview: { game: '质检总览', tourism: '质检总览', education: '质检总览', derivative: '质检总览' },
  interaction: { game: '互动设计', tourism: '互动点设计', education: '学习互动', derivative: '分支设计' },
  script: { game: '剧本编辑', tourism: '体验文案', education: '学习内容', derivative: '剧情编辑' },
  parse: { game: '剧本解构', tourism: '资料解构', education: '课程解构', derivative: '素材解构' },
  storyOverview: { game: '剧本总览', tourism: '体验总览', education: '课程总览', derivative: '剧情总览' },
};

// ── 行业模板（P6-1）─────────────────────────────────────────────

export const INDUSTRY_TEMPLATES: IndustryTemplate[] = [
  {
    industryType: 'tourism',
    label: '文旅互动体验',
    icon: '🏛️',
    description: '将景区、展馆、历史人物、展品变成可玩的参观体验。适用于博物馆、景区、城市文旅、展陈公司。',
    targetUsers: '景区、博物馆、城市文旅、展陈公司',
    defaultObjects: ['地点', '展品', '历史人物', '事件', '路线', '任务点', '线索'],
    defaultInteractions: ['点击展品', '选择调查对象', '路线选择', '解谜', '打卡收集', '线索拼合'],
    defaultPublishFormats: ['H5 互动页面', '微信小程序', '馆内屏幕', '导览模式', 'AR 标记版'],
    workflow: [
      { step: '导入资料', description: '导入景区/展馆资料、历史文献、展品说明' },
      { step: '提取要素', description: 'AI 提取地点、人物、展品、历史事件' },
      { step: '建立边界', description: '确定史实边界、文化约束、事实校验规则' },
      { step: '规划路线', description: '设计参观动线、体验节奏、任务分布' },
      { step: '设计体验', description: '设计互动点：展品探索、路线选择、解谜任务' },
      { step: '绑定资产', description: '关联展品图片、历史照片、音频讲解、地图' },
      { step: '测试路线', description: '模拟游客动线，检查路线断点和体验时长' },
      { step: '发布导览', description: '发布 H5/小程序/馆内屏幕版本' },
    ],
  },
  {
    industryType: 'education',
    label: '互动教育课程',
    icon: '🎓',
    description: '将课程、知识点、案例变成可交互学习内容。适用于学校、培训机构、科普机构、企业培训。',
    targetUsers: '学校、培训机构、科普机构、企业培训',
    defaultObjects: ['知识点', '案例', '问题', '答案', '学习目标', '评价标准'],
    defaultInteractions: ['选择题', '情境决策', '实验模拟', '角色扮演', '分步推理'],
    defaultPublishFormats: ['课堂演示', '自学链接', '训练任务', 'SCORM 课件', '学习报告'],
    workflow: [
      { step: '导入课程', description: '导入教材、教案、课程大纲、题库' },
      { step: '提取知识点', description: 'AI 提取知识点、学习目标、能力维度' },
      { step: '设计情境', description: '构建学习情境、案例场景、角色任务' },
      { step: '生成互动', description: '生成选择题、情境决策、实验模拟' },
      { step: '配置测评', description: '设置评估变量、掌握度追踪、反馈规则' },
      { step: '生成报告', description: '配置学习报告模板和能力画像' },
      { step: '测试验证', description: '验证知识点覆盖、难度均衡、反馈完整性' },
      { step: '发布课程', description: '发布课堂/自学/训练版本' },
    ],
  },
  {
    industryType: 'derivative',
    label: '互动短剧 / 内容衍生',
    icon: '🎬',
    description: '将已有短剧、真人剧、AI 视频资产改造成互动版本。适用于短剧公司、影视团队、AIGC 内容团队。',
    targetUsers: '短剧公司、影视团队、AIGC 内容团队',
    defaultObjects: ['剧集', '角色', '场景', '视频片段', '剧情转折', '结局'],
    defaultInteractions: ['观众选择', '分支插入', '隐藏剧情', '视角切换', '多结局'],
    defaultPublishFormats: ['互动短剧', 'H5 互动播放', '平台嵌入', '社交媒体短版'],
    workflow: [
      { step: '导入素材', description: '导入已有剧本、视频、分镜、角色素材' },
      { step: '识别结构', description: 'AI 识别剧情结构、关键转折、高潮点' },
      { step: '找互动点', description: '标记可插入互动选择的关键节点' },
      { step: '生成分支', description: '设计分支剧情和多结局' },
      { step: '复用资产', description: '评估现有素材覆盖率和新增资产需求' },
      { step: '补齐资产', description: '生成/拍摄新增分支所需素材' },
      { step: '测试路径', description: '测试所有分支路径和结局可达性' },
      { step: '发布互动版', description: '发布互动短剧/H5/平台嵌入版本' },
    ],
  },
  {
    industryType: 'game',
    label: '互动叙事游戏',
    icon: '🎮',
    description: '设计复杂剧情、任务线、变量、结局，并接入游戏引擎。适用于独立游戏、游戏工作室、专业编剧。',
    targetUsers: '独立游戏开发者、游戏工作室、专业编剧',
    defaultObjects: ['角色', '任务', '道具', '变量', '条件', '节点', '结局', '关卡'],
    defaultInteractions: ['选择', 'QTE', 'Hotspot', '解谜', '战斗剧情', '任务分支'],
    defaultPublishFormats: ['WebGAL 脚本', 'JSON 数据', 'Ren\'Py 脚本', '引擎导出', 'H5 包'],
    workflow: [
      { step: '项目创建', description: '设定项目类型、题材、目标时长与互动规格' },
      { step: '素材导入', description: '导入小说/故事，AI 提取角色、场景、道具' },
      { step: '世界规则', description: '确定世界观、角色约束、叙事规则' },
      { step: '章纲规划', description: '生成章节规划，定义主题、情绪弧、事件' },
      { step: '剧本编写', description: '编写完整线性剧本：对白、场景、旁白' },
      { step: '互动设计', description: '标记互动点：选择、分支、变量、结局' },
      { step: '变量配置', description: '配置变量系统、QTE、Hotspot 机制' },
      { step: '节点验证', description: '验证节点图连通性和路径完整性' },
      { step: '资产管理', description: '生成/管理图片、BGM、音效、视频' },
      { step: '演出预览', description: '以玩家视角试玩完整流程' },
      { step: '质检修复', description: '运行质检，修复阻塞发布的问题' },
      { step: '发布导出', description: '创建版本快照，发布/导出到目标平台' },
    ],
  },
];

// ── 行业质检规则（P6-1）─────────────────────────────────────────────

export const INDUSTRY_QC_RULES: IndustryQCRule[] = [
  // 文旅质检
  { id: 'tqc-01', industryType: 'tourism', category: '史实校验', label: '史实冲突检测', description: '检查体验文案是否与已知历史事实矛盾', severity: 'block' },
  { id: 'tqc-02', industryType: 'tourism', category: '路线完整性', label: '路线断点检测', description: '检查参观路线是否存在无法到达的展区', severity: 'block' },
  { id: 'tqc-03', industryType: 'tourism', category: '资产覆盖', label: '展品素材覆盖', description: '检查每个展品互动点是否都有关联素材', severity: 'warn' },
  { id: 'tqc-04', industryType: 'tourism', category: '体验时长', label: '讲解时长超标', description: '单个体验点文字量是否超过游客耐心阈值', severity: 'warn' },
  { id: 'tqc-05', industryType: 'tourism', category: '文化合规', label: '文化敏感词检测', description: '检查是否存在文化敏感或不当表达', severity: 'block' },
  { id: 'tqc-06', industryType: 'tourism', category: '地理校验', label: '地理位置冲突', description: '检查路线中的地理位置是否与实际一致', severity: 'warn' },
  // 教育质检
  { id: 'eqc-01', industryType: 'education', category: '知识覆盖', label: '知识点遗漏检测', description: '检查是否所有学习目标都有对应的互动环节', severity: 'block' },
  { id: 'eqc-02', industryType: 'education', category: '内容正确性', label: '答案正确性校验', description: '检查选择题答案是否准确无误', severity: 'block' },
  { id: 'eqc-03', industryType: 'education', category: '反馈完整性', label: '错误反馈缺失', description: '检查每个错误选项是否有解释性反馈', severity: 'warn' },
  { id: 'eqc-04', industryType: 'education', category: '难度均衡', label: '难度梯度检测', description: '检查知识点难度是否从低到高递进', severity: 'info' },
  { id: 'eqc-05', industryType: 'education', category: '评估维度', label: '评估维度覆盖', description: '检查是否覆盖知识/技能/判断力等多维评估', severity: 'info' },
  { id: 'eqc-06', industryType: 'education', category: '学习路径', label: '学习路径完整性', description: '检查所有学习路径是否都有明确的反馈结果', severity: 'warn' },
  // 衍生质检
  { id: 'dqc-01', industryType: 'derivative', category: '资产复用', label: '素材缺口率', description: '评估现有素材对新分支的覆盖率和新增成本', severity: 'warn' },
  { id: 'dqc-02', industryType: 'derivative', category: '叙事连贯', label: '分支连贯性', description: '检查分支剧情是否与主线叙事连贯', severity: 'block' },
  { id: 'dqc-03', industryType: 'derivative', category: '设定一致', label: '角色设定冲突', description: '检查分支中角色行为是否与原作设定矛盾', severity: 'block' },
  { id: 'dqc-04', industryType: 'derivative', category: '风格一致', label: '原作风格偏离', description: '检查新增内容是否与原作风格基调一致', severity: 'warn' },
  { id: 'dqc-05', industryType: 'derivative', category: '成本评估', label: '新增资产成本', description: '估算完成所有分支需要新增的素材数量和成本', severity: 'info' },
  { id: 'dqc-06', industryType: 'derivative', category: '视频覆盖', label: '视频素材缺口', description: '检查哪些分支节点缺少对应的视频片段', severity: 'warn' },
];

// ── 行业资产类型（P6-1）─────────────────────────────────────────────

export const INDUSTRY_ASSET_TYPES: IndustryAssetType[] = [
  {
    industryType: 'game',
    assetTypes: [
      { key: 'image', label: '场景图片', icon: '🖼️' },
      { key: 'character', label: '角色立绘', icon: '👤' },
      { key: 'bgm', label: 'BGM', icon: '🎵' },
      { key: 'sfx', label: '音效', icon: '🔊' },
      { key: 'voice', label: '语音', icon: '🎙️' },
      { key: 'video', label: '视频', icon: '🎬' },
      { key: 'ui', label: 'UI 素材', icon: '🎨' },
    ],
  },
  {
    industryType: 'tourism',
    assetTypes: [
      { key: 'exhibit_photo', label: '展品照片', icon: '🏺' },
      { key: 'history_photo', label: '历史照片', icon: '📜' },
      { key: 'map', label: '地图', icon: '🗺️' },
      { key: 'audio_guide', label: '音频讲解', icon: '🎧' },
      { key: 'qr_code', label: '二维码', icon: '📱' },
      { key: 'ar_marker', label: 'AR 标记', icon: '👓' },
      { key: 'video', label: '介绍视频', icon: '🎬' },
    ],
  },
  {
    industryType: 'education',
    assetTypes: [
      { key: 'courseware', label: '课件', icon: '📊' },
      { key: 'animation', label: '动画', icon: '🎞️' },
      { key: 'quiz_image', label: '题目截图', icon: '📝' },
      { key: 'experiment', label: '实验图', icon: '🔬' },
      { key: 'mindmap', label: '思维导图', icon: '🧠' },
      { key: 'knowledge_card', label: '知识卡片', icon: '🃏' },
      { key: 'video', label: '教学视频', icon: '🎬' },
    ],
  },
  {
    industryType: 'derivative',
    assetTypes: [
      { key: 'video_clip', label: '视频片段', icon: '🎞️' },
      { key: 'storyboard', label: '分镜图', icon: '🖼️' },
      { key: 'film_still', label: '成片截图', icon: '📸' },
      { key: 'character_poster', label: '角色海报', icon: '🎭' },
      { key: 'promo', label: '宣传物料', icon: '📢' },
      { key: 'bgm', label: '配乐', icon: '🎵' },
      { key: 'subtitle', label: '字幕文件', icon: '💬' },
    ],
  },
];
