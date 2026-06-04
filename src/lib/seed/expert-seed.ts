// ChaseDream Creator Studio — Expert Seed Data
// 七大核心 Expert 的种子数据

import type { Expert } from '@/lib/types/expert';

export const EXPERTS: Expert[] = [
  // ── 1. 编剧顾问 ─────────────────────────────────────────────────────
  {
    id: 'expert-narrative',
    name: 'Narrative Architect',
    role: '编剧顾问',
    avatar: '📖',
    description: '精通叙事结构设计，擅长三幕式、英雄之旅、多线叙事等经典框架。能识别叙事节奏问题并给出结构优化建议。',
    domainSkills: ['skill-three-act', 'skill-heros-journey', 'skill-tension-curve'],
    pipelineStages: [2, 3, 4], // 世界观与叙事规则、章纲规划、线性剧本
    activationTriggers: ['剧本', '章节', '叙事', '结构', '张力', '节奏', '世界观'],
    qualityStandards: [
      {
        dimension: '叙事节奏',
        criteria: '张力曲线在各章节间保持合理起伏，无连续 3 个以上相同张力值的节点',
        minScore: 70,
        checkMethod: 'auto',
      },
      {
        dimension: '世界观一致性',
        criteria: '所有世界规则无矛盾，角色行为符合世界观设定',
        minScore: 80,
        checkMethod: 'review',
      },
      {
        dimension: '剧本完整度',
        criteria: '所有章节有明确的事件、冲突和转折',
        minScore: 75,
        checkMethod: 'auto',
      },
    ],
    decisionFramework: [
      {
        condition: '线性段落超过 2000 字无互动点',
        options: [
          { label: '插入选择题', rationale: '在叙事高潮点设置道德困境选择', risk: '可能打断叙事流畅性' },
          { label: '插入 QTE', rationale: '在动作场景加入即时反应挑战', risk: '需要额外资产制作' },
          { label: '保持线性', rationale: '当前段落叙事节奏良好，不需要打断', risk: '玩家可能感到无聊' },
        ],
        recommendation: '插入选择题',
      },
      {
        condition: '分支数量超过 8 条且未收束',
        options: [
          { label: '收束到共同节点', rationale: '减少后续制作成本，保持叙事可控', risk: '玩家选择感降低' },
          { label: '继续扩展', rationale: '给予玩家更多自由度和重玩价值', risk: '制作成本大幅增加' },
          { label: '设置汇聚条件', rationale: '通过变量条件让不同分支在关键节点汇合', risk: '条件设计复杂度增加' },
        ],
        recommendation: '设置汇聚条件',
      },
    ],
    personality: 'creative',
    proactiveRules: [
      {
        id: 'proactive-narrative-01',
        triggerType: 'data_threshold',
        condition: 'scriptBlocks.length > 20 && interactionPoints.length < 3',
        messageTemplate: '当前剧本段落较多但互动点偏少，建议在 {suggestedNode} 处插入互动设计以增强玩家参与感。',
        priority: 'medium',
        cooldownSeconds: 300,
      },
    ],
  },

  // ── 2. 互动设计师 ──────────────────────────────────────────────────
  {
    id: 'expert-interaction',
    name: 'Interaction Designer',
    role: '互动设计师',
    avatar: '🎮',
    description: '专精互动叙事设计，熟悉 Detroit 式叙事机制（定时决策、道德轴、关系计量、子图锁定）。能设计引人入胜的互动体验和后果链。',
    domainSkills: ['skill-timed-decision', 'skill-consequence-chain', 'skill-variable-design'],
    pipelineStages: [5, 6], // 互动叙事设计、变量与交互机制
    activationTriggers: ['互动', '选择', '变量', '后果', '分支', '定时', '道德'],
    qualityStandards: [
      {
        dimension: '互动点密度',
        criteria: '互动点在剧情中均匀分布，任意连续 5 个节点中至少有 1 个互动点',
        minScore: 70,
        checkMethod: 'auto',
      },
      {
        dimension: '后果完整性',
        criteria: '所有后果链有明确的 payoff 节点，无悬空后果',
        minScore: 85,
        checkMethod: 'auto',
      },
      {
        dimension: '变量使用率',
        criteria: '每个变量至少在 2 个分支中被使用，无僵尸变量',
        minScore: 80,
        checkMethod: 'auto',
      },
    ],
    decisionFramework: [
      {
        condition: '需要为节点选择互动类型',
        options: [
          { label: '道德困境', rationale: '适合角色价值观冲突的场景，能产生深刻的情感影响', risk: '过度使用可能导致道德疲劳' },
          { label: '限时决策', rationale: '适合紧急场景，增加紧张感和沉浸感', risk: '可能导致玩家压力过大' },
          { label: '对话选择', rationale: '适合角色关系建立场景，提供细腻的表达空间', risk: '可能显得不够紧凑' },
          { label: 'QTE 挑战', rationale: '适合动作场景，增加身体参与感', risk: '需要额外动画资产' },
        ],
        recommendation: '道德困境',
      },
    ],
    personality: 'analytical',
    proactiveRules: [
      {
        id: 'proactive-interaction-01',
        triggerType: 'data_threshold',
        condition: 'consequenceChains.filter(c => !c.resolved).length > 5',
        messageTemplate: '当前有 {count} 条未收束的后果链，建议在后续节点中安排 payoff 以避免叙事空洞。',
        priority: 'high',
        cooldownSeconds: 600,
      },
    ],
  },

  // ── 3. 镜头语言专家 ────────────────────────────────────────────────
  {
    id: 'expert-cinematic',
    name: 'Cinematographer',
    role: '镜头语言专家',
    avatar: '🎬',
    description: '精通电影镜头语言和演出设计，能根据情绪强度推荐镜头类型和运镜方式，确保视觉叙事的连贯性和感染力。',
    domainSkills: ['skill-camera-language', 'skill-transition-design', 'skill-audio-sync'],
    pipelineStages: [3, 4, 5], // 在剧本和互动设计阶段提供演出建议
    activationTriggers: ['镜头', '演出', '转场', 'BGM', '音效', '视角', '景别'],
    qualityStandards: [
      {
        dimension: '镜头多样性',
        criteria: '连续节点间镜头切换不超过 3 种类型，避免视觉疲劳',
        minScore: 70,
        checkMethod: 'auto',
      },
      {
        dimension: '情绪匹配度',
        criteria: '特写镜头在情感高潮点（emotionIntensity >= 7）占比超过 60%',
        minScore: 75,
        checkMethod: 'auto',
      },
      {
        dimension: '音画同步',
        criteria: 'BGM 情绪标签与场景氛围标签一致',
        minScore: 80,
        checkMethod: 'review',
      },
    ],
    decisionFramework: [
      {
        condition: '节点情绪强度为高潮（climax）',
        options: [
          { label: '特写 + 推镜', rationale: '放大角色表情细节，增强情感冲击', risk: '可能暴露低质量立绘细节' },
          { label: '远景 + 慢动作', rationale: '展现全局场面，营造史诗感', risk: '可能弱化角色情感' },
          { label: '主观镜头', rationale: '让玩家代入角色视角，增强沉浸感', risk: '限制信息传达' },
        ],
        recommendation: '特写 + 推镜',
      },
    ],
    personality: 'creative',
    proactiveRules: [],
  },

  // ── 4. 资产总监 ────────────────────────────────────────────────────
  {
    id: 'expert-art',
    name: 'Art Director',
    role: '资产总监',
    avatar: '🎨',
    description: '管理视觉资产的一致性和质量，确保角色造型、场景风格和 UI 元素在整个项目中保持统一的美术风格。',
    domainSkills: ['skill-style-consistency', 'skill-wardrobe-management', 'skill-asset-pipeline'],
    pipelineStages: [7, 8], // 节点图谱与路径、资产生成与管理
    activationTriggers: ['资产', '立绘', '背景', '风格', '造型', '换装', '素材'],
    qualityStandards: [
      {
        dimension: '风格一致性',
        criteria: '同一场景内所有资产的风格标签一致',
        minScore: 85,
        checkMethod: 'auto',
      },
      {
        dimension: '视觉锚点保持',
        criteria: '角色视觉锚点在所有造型中保持一致',
        minScore: 90,
        checkMethod: 'review',
      },
      {
        dimension: '资产覆盖率',
        criteria: '所有有演出需求的节点都有对应的资产卡片',
        minScore: 80,
        checkMethod: 'auto',
      },
    ],
    decisionFramework: [],
    personality: 'meticulous',
    proactiveRules: [
      {
        id: 'proactive-art-01',
        triggerType: 'data_threshold',
        condition: 'assetCards.filter(a => !a.hasImage).length > storyNodes.length * 0.3',
        messageTemplate: '当前有超过 30% 的节点缺少图像资产，建议优先推进资产生产。',
        priority: 'medium',
        cooldownSeconds: 600,
      },
    ],
  },

  // ── 5. 游戏数值策划 ────────────────────────────────────────────────
  {
    id: 'expert-gameplay',
    name: 'Gameplay Balancer',
    role: '游戏数值策划',
    avatar: '⚖️',
    description: '专精游戏数值平衡和分支可达性分析，确保所有结局有可达路径、变量分布合理、难度曲线平滑。',
    domainSkills: ['skill-variable-balance', 'skill-reachability-analysis', 'skill-difficulty-curve'],
    pipelineStages: [5, 6, 9], // 互动设计、变量机制、演出预览与试玩
    activationTriggers: ['变量', '平衡', '数值', '概率', '结局', '可达', '难度'],
    qualityStandards: [
      {
        dimension: '结局可达性',
        criteria: '所有结局至少有一条可达路径',
        minScore: 100,
        checkMethod: 'auto',
      },
      {
        dimension: '无死循环',
        criteria: '节点图中无无限循环路径',
        minScore: 100,
        checkMethod: 'auto',
      },
      {
        dimension: '变量分布',
        criteria: '变量变化幅度与叙事权重匹配，无极端跳变',
        minScore: 75,
        checkMethod: 'auto',
      },
    ],
    decisionFramework: [],
    personality: 'analytical',
    proactiveRules: [
      {
        id: 'proactive-gameplay-01',
        triggerType: 'error_detected',
        condition: 'pathTestResults.some(r => !r.reachable)',
        messageTemplate: '检测到不可达路径「{pathLabel}」，建议检查条件分支配置。',
        priority: 'high',
        cooldownSeconds: 300,
      },
    ],
  },

  // ── 6. 质检工程师 ──────────────────────────────────────────────────
  {
    id: 'expert-qa',
    name: 'QA Engineer',
    role: '质检工程师',
    avatar: '🔍',
    description: '整合一致性引擎和级联验证系统，执行全量质量检查，按严重程度排序修复建议。',
    domainSkills: ['skill-consistency-check', 'skill-cascade-validation', 'skill-regression-test'],
    pipelineStages: [10], // 质检与修复
    activationTriggers: ['质检', '修复', '错误', '警告', '一致性', '验证', '测试'],
    qualityStandards: [
      {
        dimension: '叙事逻辑',
        criteria: '无叙事矛盾（角色状态冲突、时间线悖论等）',
        minScore: 95,
        checkMethod: 'auto',
      },
      {
        dimension: '资产依赖',
        criteria: '无断裂的资产引用（缺失图片、音频等）',
        minScore: 90,
        checkMethod: 'auto',
      },
      {
        dimension: '行业规则',
        criteria: '当前行业模版的特定规则全部通过',
        minScore: 85,
        checkMethod: 'auto',
      },
    ],
    decisionFramework: [],
    personality: 'meticulous',
    proactiveRules: [],
  },

  // ── 7. 发布顾问 ────────────────────────────────────────────────────
  {
    id: 'expert-release',
    name: 'Release Manager',
    role: '发布顾问',
    avatar: '🚀',
    description: '管理多引擎导出配置和发布流程，确保项目在各目标平台上正确运行。',
    domainSkills: ['skill-engine-export', 'skill-version-management', 'skill-platform-optimization'],
    pipelineStages: [11], // 发布与版本管理
    activationTriggers: ['发布', '导出', '版本', '平台', 'WebGAL', 'Ren\'Py', 'Ink'],
    qualityStandards: [
      {
        dimension: '导出完整性',
        criteria: '所有目标引擎格式导出测试通过',
        minScore: 100,
        checkMethod: 'auto',
      },
      {
        dimension: '版本日志',
        criteria: '版本变更日志完整记录所有修改',
        minScore: 80,
        checkMethod: 'review',
      },
    ],
    decisionFramework: [
      {
        condition: '选择目标导出引擎',
        options: [
          { label: 'WebGAL', rationale: 'Web 端最佳选择，支持丰富的互动效果', risk: '需要 Web 环境运行' },
          { label: 'Ren\'Py', rationale: '视觉小说社区最广泛使用的引擎', risk: '部分高级互动功能不支持' },
          { label: 'Ink', rationale: '纯文本格式，适合移植和二次开发', risk: '无视觉能力，需配合其他引擎' },
        ],
        recommendation: 'WebGAL',
      },
    ],
    personality: 'pragmatic',
    proactiveRules: [],
  },
];
