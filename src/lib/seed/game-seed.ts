// ChaseDream Creator Studio — Game Seed Data

import type { GameCharacter, GameScene, GameProp, GameVariable, PlayableNode, EntityRelation, CharacterSceneAppearance } from '../types/game';

// ── 角色数据（统一）────────────────────────────────────────────────────────

export const GAME_CHARACTERS: GameCharacter[] = [
  {
    id: 'c1', name: '艾拉', role: '女主角 · 侦探', color: '#5E50E8', emoji: '🕵️',
    description: '黑色短发，银色义眼，黑色风衣，冷静警觉',
    appearNodes: ['N01','N02','N03','N04','N05','N06','N07','N08','N10'],
    emotionStates: [
      { label: '默认', done: true }, { label: '愤怒', done: true },
      { label: '受伤', done: false }, { label: '沉默', done: false },
    ],
    visualPrompt: '黑色短发，银色义眼，黑色风衣，赛博朋克都市，4K高清',
  },
  {
    id: 'c2', name: '线人', role: '关键 NPC', color: '#D97706', emoji: '🕴️',
    description: '神秘男性，中年，隐藏身份，掌握关键情报',
    appearNodes: ['N02','N03','N08'],
    emotionStates: [
      { label: '默认', done: true }, { label: '紧张', done: false },
      { label: '受伤', done: false }, { label: '死亡', done: false },
    ],
    visualPrompt: '中年男性，破旧夹克，背光站立，霓虹反射',
  },
  {
    id: 'c3', name: '反派主管', role: '反派', color: '#DC2626', emoji: '👔',
    description: '西装笔挺，冷峻表情，幕后操控者',
    appearNodes: ['N05','N09','N11'],
    emotionStates: [
      { label: '默认', done: false }, { label: '愤怒', done: false },
    ],
    visualPrompt: '西装革履，冷峻表情，企业高层，摩天楼背景',
  },
];

// ── 场景数据（统一）────────────────────────────────────────────────────────

export const GAME_SCENES: GameScene[] = [
  { id: 's1', name: '霓虹街道', location: '城市中心·外', lighting: '霓虹灯+路灯', atmosphere: '喧嚣、潮湿、赛博朋克', refNodes: ['N01'], hasImage: true, imageUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=400&q=80', visualPrompt: '2047年赛博朋克街道，积水路面，霓虹广告牌，人群' },
  { id: 's2', name: '地下酒吧', location: '贫民区·内', lighting: '昏暗暖光', atmosphere: '嘈杂、危险、地下世界', refNodes: ['N02','N03'], hasImage: true, imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=400&q=80', visualPrompt: '地下酒吧，昏暗灯光，烟雾，赛博朋克装饰' },
  { id: 's3', name: '暗夜通道', location: '地下管道·内', lighting: '应急灯', atmosphere: '压抑、紧张、密闭空间', refNodes: ['N04'], hasImage: true, imageUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=400&q=80', visualPrompt: '地下管道通道，应急红灯，水渍墙壁' },
  { id: 's4', name: '企业大厦', location: '商业区·内/外', lighting: '冷白荧光灯', atmosphere: '高科技、秩序、危险', refNodes: ['N05','N06','N07'], hasImage: true, imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=400&q=80', visualPrompt: '赛博朋克企业大厦内部，全息投影，安保系统' },
  { id: 's5', name: '数据中心', location: '大厦B3层·内', lighting: '蓝色服务器灯光', atmosphere: '冰冷、信息密集、核心机密', refNodes: ['N08','N10'], hasImage: true, imageUrl: 'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?auto=format&fit=crop&w=400&q=80', visualPrompt: '大型数据中心，蓝色LED，服务器阵列' },
  { id: 's6', name: '逃生暗巷', location: '城市边缘·外', lighting: '月光+远处霓虹', atmosphere: '紧张、绝望、最后机会', refNodes: ['N09','N11'], hasImage: false, visualPrompt: '狭窄暗巷，月光，远处城市霓虹，潮湿地面' },
];

// ── 道具数据（统一）────────────────────────────────────────────────────────

export const GAME_PROPS: GameProp[] = [
  { id: 'p1', name: '追踪芯片', type: 'key_item', description: '植入体内的微型追踪器', gameplayEffect: '决定潜行路线选择', refNodes: ['N01','N02'], hasImage: false },
  { id: 'p2', name: '变声器', type: 'tool', description: '可模仿任何人声音的设备', gameplayEffect: '+渗透值 15', refNodes: ['N05'], hasImage: false },
  { id: 'p3', name: '加密U盘', type: 'key_item', description: '存储核心证据的加密存储设备', gameplayEffect: '决定结局分支', refNodes: ['N08','N10'], hasImage: false },
  { id: 'p4', name: '无人机', type: 'tool', description: '小型侦察无人机', gameplayEffect: '+侦察值 20', refNodes: ['N04'], hasImage: false },
  { id: 'p5', name: 'EMP手雷', type: 'weapon', description: '电磁脉冲手雷，可瘫痪电子设备', gameplayEffect: 'QTE成功关键道具', refNodes: ['N06'], hasImage: false },
  { id: 'p6', name: '全息投影仪', type: 'tool', description: '可投射虚假影像的便携设备', gameplayEffect: '+欺骗值 25', refNodes: ['N05','N07'], hasImage: false },
  { id: 'p7', name: '神经接口', type: 'key_item', description: '直连数据网络的神经接口', gameplayEffect: '解锁隐藏路径', refNodes: ['N08'], hasImage: false },
  { id: 'p8', name: '伪造ID', type: 'tool', description: '企业员工伪造身份卡', gameplayEffect: '+渗透值 10', refNodes: ['N05'], hasImage: false },
  { id: 'p9', name: '信号屏蔽器', type: 'tool', description: '屏蔽周围追踪信号的装置', gameplayEffect: '+潜行值 20', refNodes: ['N04','N06'], hasImage: false },
];

// ── 变量系统（统一）────────────────────────────────────────────────────────

export const GAME_VARIABLES: GameVariable[] = [
  { id: 'stealth_score', name: 'stealth_score', label: '潜行值', initialValue: 55, description: '衡量玩家潜行能力', modifiedBy: ['N04','N05'], readBy: ['N07'] },
  { id: 'alert_level', name: 'alert_level', label: '警戒值', initialValue: 30, description: '敌人警戒程度', modifiedBy: ['N06'], readBy: ['N07'] },
  { id: 'trust_lineman', name: 'trust_lineman', label: '信任值', initialValue: 20, description: '对线人的信任程度', modifiedBy: ['N02','N03'], readBy: ['N07','N08'] },
  { id: 'truth', name: 'truth', label: '真相值', initialValue: 0, description: '已揭露的真相碎片', modifiedBy: ['N08'], readBy: ['N10'] },
];

export const INIT_VARIABLES: Record<string, number> = {
  stealth_score: 55,
  alert_level: 30,
  trust_lineman: 20,
  truth: 0,
};

// ── 可玩故事图（统一）─────────────────────────────────────────────────────

export const PLAYABLE_GRAPH: Record<string, PlayableNode> = {
  N01: { id: 'N01', char: '旁白', text: '2047年，深夜。霓虹灯光把积水的城市街道染成猩红。艾拉站在一扇锈门前，追踪信号在此中断。', backgroundImage: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80', choices: [{ label: '推门进入', next: 'N02', effect: '+0' }, { label: '先观察环境', next: 'N02', effect: '+trust_lineman 5' }] },
  N02: { id: 'N02', char: '线人', text: '你来了。那枚追踪芯片，他们已经发现了。你必须在他们找到我之前做出选择。', backgroundImage: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80', choices: [{ label: '相信线人，一起行动', next: 'N03A', effect: '+trust_lineman 20' }, { label: '保持怀疑，独自调查', next: 'N03B', effect: '-trust_lineman 10' }] },
  N03: { id: 'N03', char: '旁白', text: '艾拉面临关键抉择——是走安全的暗巷通道，还是冒险换装渗入企业大厦？', backgroundImage: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80', choices: [{ label: 'A. 暗夜通道潜行', next: 'N04', effect: '+stealth_score 15' }, { label: 'B. 换装渗透大厦', next: 'N05', effect: '+alert_level 10' }] },
  N04: { id: 'N04', char: '艾拉', text: '你跟着线人穿过地下通道，抵达企业大厦后方。这里有一条通风管道直通数据中心。', backgroundImage: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80', choices: [{ label: '继续潜行', next: 'N06', effect: '+stealth_score 10' }] },
  N05: { id: 'N05', char: '旁白', text: '你换上企业制服，刷伪造ID进入大厦。走廊尽头，两名警卫正在巡逻。', backgroundImage: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80', choices: [{ label: '避开警卫', next: 'N06', effect: '+stealth_score 5' }, { label: '利用变声器欺骗', next: 'N06', effect: '+stealth_score 15' }] },
  N06: { id: 'N06', char: '旁白', text: '警卫逼近！你只有1.5秒做出反应！', backgroundImage: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80', choices: [{ label: '使用EMP手雷', next: 'N07S', effect: '+stealth_score 20' }, { label: '强行突破', next: 'N07F', effect: '-stealth_score 30' }] },
  N07S: { id: 'N07S', char: '旁白', text: 'EMP手雷成功瘫痪了警卫的通讯设备。你安全通过了检查点。', backgroundImage: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80', choices: [{ label: '前往数据中心', next: 'N08', effect: '+truth 20' }] },
  N07F: { id: 'N07F', char: '旁白', text: '强行突破触发了警报。整栋大厦进入封锁状态。', backgroundImage: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80', choices: [{ label: '试图逃跑', next: 'N09', effect: '+alert_level 50' }] },
  N08: { id: 'N08', char: '艾拉', text: '数据到手了。加密U盘里记录了所有证据——企业非法追踪全民的完整日志。', backgroundImage: 'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?auto=format&fit=crop&w=800&q=80', choices: [{ label: '安全撤离', next: 'GOOD', effect: '+truth 50' }] },
  N09: { id: 'N09', char: '旁白', text: '你被困在暗巷中，企业安保部队包围了所有出口。反派主管出现在全息投影中。', backgroundImage: 'https://images.unsplash.com/photo-1515621061946-eff1c2a352bd?auto=format&fit=crop&w=800&q=80', choices: [{ label: '接受命运', next: 'BAD', effect: '+0' }] },
  GOOD: { id: 'GOOD', char: '结局A', text: '【幽灵归来】\n艾拉带着证据安全撤离。真相终将浮出水面，而她已消失在霓虹夜幕中。城市的暗处多了一个守护者。', isEnding: true, endingType: 'good' },
  BAD: { id: 'BAD', char: '结局B', text: '【今夜失败】\n艾拉被捕，证据湮没。但她记住了这条路，还有下一次机会。', isEnding: true, endingType: 'bad' },
};

// ── 实体关系图谱（P11-⑳）────────────────────────────────────────────────────

export const ENTITY_RELATIONS: EntityRelation[] = [
  { sourceId: 'c1', targetId: 'c2', relationType: 'stranger', strength: 40, description: '艾拉与线人：利益交换关系，信任尚未建立', changesAtNodes: ['N02', 'N03', 'N08'] },
  { sourceId: 'c1', targetId: 'c3', relationType: 'enemy', strength: 80, description: '艾拉与反派主管：对立阵营，核心冲突', changesAtNodes: ['N05', 'N09'] },
  { sourceId: 'c2', targetId: 'c3', relationType: 'rival', strength: 60, description: '线人与反派主管：线人是对方的卧底目标' },
];

export const CHARACTER_SCENE_APPEARANCES: CharacterSceneAppearance[] = [
  { characterId: 'c1', sceneId: 's1', role: 'main', nodeIds: ['N01'] },
  { characterId: 'c1', sceneId: 's2', role: 'main', nodeIds: ['N02', 'N03'] },
  { characterId: 'c1', sceneId: 's3', role: 'main', nodeIds: ['N04'] },
  { characterId: 'c1', sceneId: 's4', role: 'main', nodeIds: ['N05', 'N06', 'N07'] },
  { characterId: 'c1', sceneId: 's5', role: 'main', nodeIds: ['N08', 'N10'] },
  { characterId: 'c2', sceneId: 's2', role: 'main', nodeIds: ['N02', 'N03'] },
  { characterId: 'c2', sceneId: 's5', role: 'supporting', nodeIds: ['N08'] },
  { characterId: 'c3', sceneId: 's4', role: 'supporting', nodeIds: ['N05'] },
  { characterId: 'c3', sceneId: 's6', role: 'main', nodeIds: ['N09', 'N11'] },
];
