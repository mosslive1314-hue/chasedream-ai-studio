// ChaseDream Creator Studio — Skill Seed Data
// Skill 经验沉淀系统的预置 Skill 和管线映射

import type { Skill, SkillPipelineMapping } from '@/lib/types/skill';

// ── 系统内置 Skill ───────────────────────────────────────────────────────

export const SKILLS: Skill[] = [
  // ── 叙事领域 ────────────────────────────────────────────────────────
  {
    id: 'skill-three-act',
    name: '三幕式剧本结构',
    description: '经典三幕式叙事框架：设定 → 对抗 → 解决。适用于大多数线性或轻度分支的互动叙事项目。',
    domain: 'narrative',
    tags: ['叙事结构', '三幕式', '经典框架'],
    workflow: [
      { order: 1, action: '设定日常世界：建立角色、环境和基本冲突', expectedOutput: '开篇 1-2 个节点，展示主角的日常', tools: ['ScriptScreen'], tips: ['用具体细节而非叙述来展现角色性格'] },
      { order: 2, action: '触发事件：打破平衡的事件发生', expectedOutput: '1 个关键选择节点', tips: ['触发事件应与主角的核心缺陷相关'] },
      { order: 3, action: '第一转折点：主角被迫进入新情境', expectedOutput: '分支节点，至少 2 条路径', tips: ['转折点之后不应该有回头的可能'] },
      { order: 4, action: '上升动作：冲突逐步升级', expectedOutput: '3-5 个递进节点', tips: ['每个节点应比前一个有更高的赌注'] },
      { order: 5, action: '中点反转：重大信息揭示或立场改变', expectedOutput: '1 个高张力节点', tips: ['中点反转应改变玩家对故事的理解'] },
      { order: 6, action: '坏人逼近：反派/对抗力量达到最强', expectedOutput: '2-3 个高压节点', tips: ['让玩家感到一切都可能失去'] },
      { order: 7, action: '一切失去：主角陷入最低谷', expectedOutput: '1 个情感低谷节点', tips: ['这里的绝望应该是真实的'] },
      { order: 8, action: '灵魂黑夜：主角面对内心最大恐惧', expectedOutput: '1 个内心选择节点', tips: ['给玩家一个关于角色内心的选择'] },
      { order: 9, action: '第二转折点：主角获得新的力量/洞察', expectedOutput: '转折节点', tips: ['解决方案的种子应在前面章节已埋下'] },
      { order: 10, action: '高潮：最终对决', expectedOutput: '2-3 个高张力节点', tips: ['高潮应该考验主角在第 8 步学到的东西'] },
      { order: 11, action: '结局：冲突解决', expectedOutput: '结局节点', tips: ['结局应回答故事提出的核心问题'] },
      { order: 12, action: '新常态：展示变化后的世界', expectedOutput: '1-2 个收尾节点', tips: ['新常态应与开篇的日常形成对比'] },
    ],
    qualityCriteria: [
      { dimension: '结构完整性', criteria: '12 个步骤全部有对应节点', minScore: 80, checkMethod: 'auto' },
      { dimension: '张力曲线', criteria: '张力值呈波浪式上升', minScore: 70, checkMethod: 'auto' },
    ],
    decisionRules: [],
    toolPatterns: [
      { toolName: 'ScriptScreen 章纲规划', whenToUse: '规划整体结构时', howToUse: '选择「三幕式」叙事模版自动生成章节框架', commonMistakes: ['不要在第二幕塞入过多事件'] },
      { toolName: 'TensionCurve', whenToUse: '验证节奏时', howToUse: '检查张力曲线是否有合理的起伏', commonMistakes: ['避免持续高张力或持续低张力'] },
    ],
    createdBy: 'system',
    usageCount: 0,
    effectivenessScore: 85,
    version: 1,
    composableWith: ['skill-tension-curve'],
    requires: [],
  },

  // ── 互动领域 ────────────────────────────────────────────────────────
  {
    id: 'skill-consequence-chain',
    name: '后果链设计方法论',
    description: '设计有意义的选择后果：即时反馈 → 延迟影响 → 结局分化。确保每个选择都有可感知的长期影响。',
    domain: 'interaction',
    tags: ['后果链', '选择设计', '长期影响'],
    workflow: [
      { order: 1, action: '识别关键选择点', expectedOutput: '标记为 important 的互动点列表', tips: ['不是所有选择都需要后果链，聚焦于叙事关键节点'] },
      { order: 2, action: '设计即时反馈', expectedOutput: '每个选择的 immediate 后果描述', tips: ['即时反馈应在选择后 1-2 个节点内呈现'] },
      { order: 3, action: '设计延迟影响', expectedOutput: 'delayed 后果链配置', tips: ['延迟影响应在 3-5 个节点后显现，让玩家能回忆起来'] },
      { order: 4, action: '设计结局分化', expectedOutput: 'ending 后果链配置', tips: ['结局后果应该让玩家感到自己的选择是有意义的'] },
      { order: 5, action: '验证后果完整性', expectedOutput: '所有后果链有 payoff 节点', tools: ['NodesScreen'], tips: ['使用后果追踪面板检查悬空后果'] },
    ],
    qualityCriteria: [
      { dimension: '后果覆盖率', criteria: '所有重要选择至少有 2 层后果（即时 + 延迟或结局）', minScore: 80, checkMethod: 'auto' },
      { dimension: '无悬空后果', criteria: '所有后果链都有 payoff 节点', minScore: 100, checkMethod: 'auto' },
    ],
    decisionRules: [],
    toolPatterns: [
      { toolName: 'InteractionScreen 后果追踪', whenToUse: '设计和验证后果链时', howToUse: '在后果追踪面板中可视化所有后果链的状态', commonMistakes: ['不要忘记为延迟后果设置触发条件'] },
    ],
    createdBy: 'system',
    usageCount: 0,
    effectivenessScore: 80,
    version: 1,
    composableWith: ['skill-variable-design'],
    requires: [],
  },

  // ── 演出领域 ────────────────────────────────────────────────────────
  {
    id: 'skill-camera-language',
    name: '镜头语言基础',
    description: '掌握基本镜头类型与情绪映射：远景建立空间、中景展现互动、特写放大情感。',
    domain: 'cinematic',
    tags: ['镜头', '景别', '情绪映射'],
    workflow: [
      { order: 1, action: '确定节点情绪基调', expectedOutput: '每个节点的 emotionIntensity 评分', tips: ['先完成剧本和互动设计，再设计镜头'] },
      { order: 2, action: '选择基础景别', expectedOutput: '每个节点的 shotType 配置', tips: ['远景用于建立、中景用于叙事、特写用于情感'] },
      { order: 3, action: '添加运镜动作', expectedOutput: '每个节点的 camera.movement 配置', tips: ['推镜增强紧张感、拉镜揭示全景、轨道增加优雅感'] },
      { order: 4, action: '设计转场', expectedOutput: '每个节点的 transition 配置', tips: ['硬切适合快节奏、淡出适合时间流逝、闪白适合回忆'] },
    ],
    qualityCriteria: [
      { dimension: '情绪匹配', criteria: '景别选择与情绪强度匹配', minScore: 75, checkMethod: 'auto' },
    ],
    decisionRules: [
      {
        condition: '节点情绪强度 <= 3（平静）',
        options: [
          { label: '远景 + 静态', rationale: '展现环境氛围', risk: '可能显得单调' },
          { label: '中景 + 轻推', rationale: '缓慢引入叙事', risk: '无' },
        ],
        recommendation: '中景 + 轻推',
      },
      {
        condition: '节点情绪强度 >= 7（紧张/高潮）',
        options: [
          { label: '特写 + 推镜', rationale: '放大情感冲击', risk: '暴露低质量资产' },
          { label: '主观镜头', rationale: '增强代入感', risk: '限制信息传达' },
        ],
        recommendation: '特写 + 推镜',
      },
    ],
    toolPatterns: [
      { toolName: 'CinematicEditorScreen', whenToUse: '设计每个节点的镜头参数时', howToUse: '使用镜头预设库快速应用常见镜头组合', commonMistakes: ['不要在相邻节点使用超过 3 种不同的景别'] },
    ],
    createdBy: 'system',
    usageCount: 0,
    effectivenessScore: 82,
    version: 1,
    composableWith: ['skill-transition-design', 'skill-audio-sync'],
    requires: [],
  },

  // ── 换装领域 ────────────────────────────────────────────────────────
  {
    id: 'skill-wardrobe-management',
    name: '角色造型管理',
    description: '管理角色在不同剧情场景中的造型变化，确保视觉一致性和叙事合理性。',
    domain: 'asset',
    tags: ['换装', '造型', '视觉一致性'],
    workflow: [
      { order: 1, action: '定义角色视觉锚点', expectedOutput: '每个主要角色的 visualAnchors 列表', tips: ['锚点应是跨造型不变的识别特征'] },
      { order: 2, action: '创建默认造型', expectedOutput: '每个角色的 default outfit', tips: ['默认造型应代表角色最核心的视觉形象'] },
      { order: 3, action: '识别换装需求', expectedOutput: '需要换装的节点列表', tips: ['不是所有节点都需要不同造型，只在叙事需要时换装'] },
      { order: 4, action: '设计新造型', expectedOutput: '新的 CharacterOutfit 定义', tips: ['确保新造型保持所有 mustMaintain 锚点'] },
      { order: 5, action: '绑定造型到节点', expectedOutput: '节点的 characterOutfitOverrides 配置', tips: ['在造型管理面板中拖拽绑定'] },
    ],
    qualityCriteria: [
      { dimension: '锚点保持', criteria: '所有造型保持角色的 mustMaintain 视觉锚点', minScore: 100, checkMethod: 'review' },
      { dimension: '造型覆盖', criteria: '有换装需求的节点都有造型配置', minScore: 90, checkMethod: 'auto' },
    ],
    decisionRules: [],
    toolPatterns: [],
    createdBy: 'system',
    usageCount: 0,
    effectivenessScore: 78,
    version: 1,
    composableWith: ['skill-style-consistency'],
    requires: [],
  },
];

// ── Skill 与管线阶段的映射 ────────────────────────────────────────────────

export const SKILL_PIPELINE_MAPPINGS: SkillPipelineMapping[] = [
  { stageIndex: 0, recommendedSkillIds: [], autoLoad: false },                     // 项目创建
  { stageIndex: 1, recommendedSkillIds: [], autoLoad: false },                     // 素材导入与解构
  { stageIndex: 2, recommendedSkillIds: ['skill-three-act'], autoLoad: true },     // 世界观与叙事规则
  { stageIndex: 3, recommendedSkillIds: ['skill-three-act'], autoLoad: true },     // 章纲规划
  { stageIndex: 4, recommendedSkillIds: ['skill-three-act'], autoLoad: true },     // 线性剧本
  { stageIndex: 5, recommendedSkillIds: ['skill-consequence-chain'], autoLoad: true }, // 互动叙事设计
  { stageIndex: 6, recommendedSkillIds: ['skill-consequence-chain'], autoLoad: true }, // 变量与交互机制
  { stageIndex: 7, recommendedSkillIds: ['skill-camera-language'], autoLoad: false },  // 节点图谱与路径
  { stageIndex: 8, recommendedSkillIds: ['skill-wardrobe-management'], autoLoad: true }, // 资产生成与管理
  { stageIndex: 9, recommendedSkillIds: [], autoLoad: false },                     // 演出预览与试玩
  { stageIndex: 10, recommendedSkillIds: [], autoLoad: false },                    // 质检与修复
  { stageIndex: 11, recommendedSkillIds: [], autoLoad: false },                    // 发布与版本管理
];
