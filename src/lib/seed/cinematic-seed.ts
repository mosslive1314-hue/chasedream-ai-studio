// ChaseDream Creator Studio — Cinematic Seed Data

import type { CinematicDirection, EngineExportConfig } from '../types/cinematic';

// ── 电影化演出指导数据（P8-12）─────────────────────────────────────────────

export const CINEMATIC_DIRECTIONS: CinematicDirection[] = [
  {
    nodeId: 'N01',
    camera: { shotType: 'wide', shotLabel: '远景', movement: 'dolly_in', movementLabel: '缓慢推进', duration: 8, focusTarget: '霓虹街道全景' },
    performances: [
      { characterId: 'c1', characterName: '艾拉', expression: '警觉', action: '穿过人群，目光扫视四周', posture: '快步前行', emotionIntensity: 'neutral', emotionLabel: '冷静专注' },
    ],
    audio: { bgmTrack: 'Cyberpunk Ambient - 低沉合成器', bgmMood: '神秘紧张', ambientSound: '雨声、远处霓虹嗡嗡声、人群嘈杂', sfx: ['脚步声（湿地面）', '耳机静电声'] },
    transition: 'fade', transitionLabel: '淡入',
    pacing: '缓慢推进 8 秒，建立赛博朋克氛围后切入中景',
    staging: '艾拉从画面右侧 1/3 处进入，向中心移动',
  },
  {
    nodeId: 'N02',
    camera: { shotType: 'medium', shotLabel: '中景', movement: 'static', movementLabel: '固定机位', duration: 12, focusTarget: '艾拉与线人对话' },
    performances: [
      { characterId: 'c1', characterName: '艾拉', expression: '犹豫', action: '双臂交叉，微微侧头', posture: '防御性站姿', emotionIntensity: 'tense', emotionLabel: '紧张犹豫' },
      { characterId: 'c2', characterName: '线人', expression: '恐惧', action: '不自觉搓手，目光闪烁', posture: '身体前倾，压低声音', emotionIntensity: 'intense', emotionLabel: '恐惧急切' },
    ],
    audio: { bgmTrack: 'Tension Strings - 低沉弦乐', bgmMood: '不安', ambientSound: '酒吧低沉嘈杂、杯碟碰撞', sfx: ['椅子拖动声'] },
    transition: 'cut', transitionLabel: '硬切',
    pacing: '对话节奏中等，关键台词后停顿 1 秒',
    staging: '艾拉站在左侧面向右，线人站在右侧面向左，保持对话轴线',
  },
  {
    nodeId: 'N03',
    camera: { shotType: 'close_up', shotLabel: '特写', movement: 'push_in', movementLabel: '推近至面部', duration: 5, focusTarget: '艾拉面部特写（选择时刻）' },
    performances: [
      { characterId: 'c1', characterName: '艾拉', expression: '决断', action: '深吸一口气，眼神坚定', posture: '挺直身体', emotionIntensity: 'intense', emotionLabel: '关键抉择' },
    ],
    audio: { bgmTrack: 'Decision Moment - 单音钢琴 + 心跳', bgmMood: '凝重', ambientSound: '环境音渐弱至静音', sfx: ['心跳声', '深呼吸'] },
    transition: 'dissolve', transitionLabel: '溶解转场',
    pacing: '选择出现前停顿 2 秒，增强抉择重量感',
  },
  {
    nodeId: 'N06',
    camera: { shotType: 'handheld', shotLabel: '手持跟拍', movement: 'tracking', movementLabel: '快速跟拍', duration: 3, focusTarget: 'QTE 动作场景' },
    performances: [
      { characterId: 'c1', characterName: '艾拉', expression: '紧迫', action: '急速转身，手伸向 EMP 手雷', posture: '半蹲战斗姿态', emotionIntensity: 'climax', emotionLabel: '生死瞬间' },
    ],
    audio: { bgmTrack: 'Action Percussion - 激烈打击乐', bgmMood: '极度紧张', ambientSound: '警报声、脚步奔跑、金属碰撞', sfx: ['EMP 充电声', '警卫喊叫声', '倒计时蜂鸣'] },
    transition: 'flash', transitionLabel: '闪白转场',
    pacing: '极快节奏，QTE 倒计时 1.5 秒，画面轻微抖动增加紧迫感',
    staging: '艾拉在画面中心，警卫从两侧逼近',
  },
  {
    nodeId: 'N08',
    camera: { shotType: 'medium', shotLabel: '中景', movement: 'crane_up', movementLabel: '升降镜头上升', duration: 10, focusTarget: '数据中心全景 → 艾拉' },
    performances: [
      { characterId: 'c1', characterName: '艾拉', expression: '如释重负', action: '缓缓放下手，微微仰头', posture: '从紧张到放松', emotionIntensity: 'calm', emotionLabel: '紧张后的释然' },
    ],
    audio: { bgmTrack: 'Revelation Theme - 希望感合成器', bgmMood: '希望与沉重并存', ambientSound: '服务器低频嗡鸣、数据流声', sfx: ['数据下载完成提示音', 'U盘插入声'] },
    transition: 'dissolve', transitionLabel: '溶解转场',
    pacing: '先快后慢——数据获取的瞬间加速，随后放慢节奏让情感沉淀',
    staging: '艾拉在服务器阵列中央，蓝色灯光映照面部',
  },
  {
    nodeId: 'N10',
    camera: { shotType: 'wide', shotLabel: '远景', movement: 'pull_out', movementLabel: '缓慢拉远', duration: 15, focusTarget: '艾拉消失在人群中' },
    performances: [
      { characterId: 'c1', characterName: '艾拉', expression: '平静', action: '转身走入霓虹人群，背影渐远', posture: '从容步伐', emotionIntensity: 'calm', emotionLabel: '任务完成的平静' },
    ],
    audio: { bgmTrack: 'Ghost Protocol Theme - 主题曲完整版', bgmMood: '希望中带着孤独', ambientSound: '霓虹嗡鸣渐弱、城市声渐远', sfx: ['脚步声渐远'] },
    transition: 'fade', transitionLabel: '淡出至黑',
    pacing: '缓慢拉远 15 秒，配乐渐强后随画面一起淡出',
    staging: '艾拉从画面中心向远处走去，最终消失在霓虹灯光中',
  },
];

// ── 引擎导出配置（P8-13）─────────────────────────────────────────────

export const ENGINE_EXPORT_CONFIGS: EngineExportConfig[] = [
  {
    id: 'unity', name: 'Unity Package', icon: '🎮',
    description: '导出为 Unity 可用的 C# 脚本 + JSON 数据 + 资产清单。支持 Timeline 集成和 Addressables 资产管理。',
    format: '.unitypackage', status: 'beta',
    features: ['C# 对话系统', 'JSON 节点数据', '资产清单 XML', 'Timeline 标记', 'Addressables 配置'],
    estimatedSize: '~18.5 MB',
    fieldMappings: [
      { sourceField: 'story_nodes', targetField: 'DialogueNodes', mapped: true },
      { sourceField: 'node_edges', targetField: 'DialogueEdges', mapped: true },
      { sourceField: 'game_variables', targetField: 'GameStateVariables', mapped: true },
      { sourceField: 'game_characters', targetField: 'CharacterProfiles', mapped: true },
      { sourceField: 'qte_configs', targetField: 'QTESequences', mapped: true },
      { sourceField: 'cinematic_directions', targetField: 'CinematicTimeline', mapped: true },
    ],
    customOptions: [
      { key: 'include_assets', label: '包含资产引用', type: 'boolean', defaultValue: true },
      { key: 'timeline_integration', label: 'Timeline 集成', type: 'boolean', defaultValue: true },
      { key: 'script_backend', label: '脚本后端', type: 'select', defaultValue: 'Mono', options: ['Mono', 'IL2CPP'] },
    ],
  },
  {
    id: 'godot', name: 'Godot Project', icon: '🤖',
    description: '导出为 Godot 4.x 项目结构：GDScript 脚本 + 场景树 + 资源导入配置。',
    format: '.godot-project', status: 'beta',
    features: ['GDScript 对话控制器', '场景树 JSON', '资源导入器', '信号系统配置', '自动翻译支持'],
    estimatedSize: '~12.3 MB',
    fieldMappings: [
      { sourceField: 'story_nodes', targetField: 'dialogue_nodes', mapped: true },
      { sourceField: 'node_edges', targetField: 'dialogue_edges', mapped: true },
      { sourceField: 'game_variables', targetField: 'game_state', mapped: true },
      { sourceField: 'game_characters', targetField: 'characters', mapped: true },
      { sourceField: 'cinematic_directions', targetField: 'cinematic_data', mapped: true },
    ],
    customOptions: [
      { key: 'godot_version', label: 'Godot 版本', type: 'select', defaultValue: '4.x', options: ['4.x', '3.x'] },
      { key: 'i18n', label: '启用国际化', type: 'boolean', defaultValue: false },
    ],
  },
  {
    id: 'yarn', name: 'Yarn Spinner', icon: '🧶',
    description: '导出为 Yarn Spinner .yarn 格式，适配 Unity 叙事插件。支持标记语言和命令。',
    format: '.yarn', status: 'stable',
    features: ['Yarn 标记语言', '变量声明', '命令标签', '条件跳转', '本地化支持'],
    estimatedSize: '~680 KB',
    fieldMappings: [
      { sourceField: 'story_nodes', targetField: 'Nodes', mapped: true },
      { sourceField: 'node_edges', targetField: 'Links', mapped: true },
      { sourceField: 'game_variables', targetField: 'Variables', mapped: true },
      { sourceField: 'script_blocks', targetField: 'Lines', mapped: true },
    ],
    customOptions: [
      { key: 'include_commands', label: '包含自定义命令', type: 'boolean', defaultValue: true },
    ],
  },
  {
    id: 'lua', name: 'Lua Script', icon: '🌙',
    description: '导出为结构化 Lua 脚本，适配自研引擎或 Love2D/Defold 等框架。',
    format: '.lua', status: 'alpha',
    features: ['Lua 表结构', '对话函数', '状态机', '事件系统', '资产加载表'],
    estimatedSize: '~2.1 MB',
    fieldMappings: [
      { sourceField: 'story_nodes', targetField: 'nodes', mapped: true },
      { sourceField: 'node_edges', targetField: 'edges', mapped: true },
      { sourceField: 'game_variables', targetField: 'state', mapped: true },
    ],
    customOptions: [
      { key: 'module_style', label: '模块风格', type: 'select', defaultValue: 'return_table', options: ['return_table', 'global', 'require'] },
    ],
  },
  {
    id: 'api', name: '结构化 API (OpenAPI)', icon: '🔌',
    description: '生成 OpenAPI 3.0 规范文档，允许外部系统通过 REST API 拉取剧情数据。',
    format: 'openapi.yaml', status: 'beta',
    features: ['OpenAPI 3.0 规范', 'CRUD 端点定义', 'WebSocket 实时推送', '资产 CDN 配置', 'Webhook 通知'],
    estimatedSize: '~156 KB',
    fieldMappings: [
      { sourceField: 'all', targetField: '/api/v1/project', mapped: true },
      { sourceField: 'story_nodes', targetField: '/api/v1/nodes', mapped: true },
      { sourceField: 'game_variables', targetField: '/api/v1/state', mapped: true },
      { sourceField: 'assets', targetField: '/api/v1/assets', mapped: true },
    ],
    customOptions: [
      { key: 'auth', label: '认证方式', type: 'select', defaultValue: 'bearer', options: ['bearer', 'api_key', 'oauth2'] },
      { key: 'websocket', label: '包含 WebSocket', type: 'boolean', defaultValue: true },
    ],
  },
];
