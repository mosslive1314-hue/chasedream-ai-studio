// ChaseDream Creator Studio — QTE/Hotspot Seed Data

import type { QTEConfig, HotspotConfig } from '../types/qte';

// ── QTE/Hotspot 配置数据（P4-11）─────────────────────────────────────────────

export const QTE_CONFIGS: QTEConfig[] = [
  {
    id: 'qte-01', nodeId: 'N06', name: '警卫逼近 QTE',
    triggerMoment: '警卫发现异常，开始搜查',
    operationType: 'tap', operationLabel: '快速点击',
    timeLimit: 1.5,
    successFeedback: 'EMP 手雷成功瘫痪警卫通讯，安全通过',
    failureFeedback: '反应过慢，警报触发',
    variableChanges: ['stealth_score +20（成功）', 'alert_level +50（失败）'],
    failurePath: 'alternate_path',
    difficulty: 'hard', tested: false,
  },
  {
    id: 'qte-02', nodeId: 'N07', name: '潜行判定',
    triggerMoment: '系统自动检查累积潜行值',
    operationType: 'hold', operationLabel: '长按蓄力',
    timeLimit: 3.0,
    successFeedback: '身份未被识别，安全进入数据中心',
    failureFeedback: '扫描器发现异常，身份暴露',
    variableChanges: ['stealth_score ≥ 60 → 成功'],
    failurePath: 'alternate_path',
    difficulty: 'normal', tested: false,
  },
  {
    id: 'qte-03', nodeId: 'N04', name: '通风管道潜入',
    triggerMoment: '进入狭窄通风管道',
    operationType: 'sequence', operationLabel: '按键序列',
    timeLimit: 5.0,
    successFeedback: '成功穿过通风管道，抵达目标区域',
    failureFeedback: '发出声响，引起警卫注意',
    variableChanges: ['stealth_score +10（成功）', 'alert_level +15（失败）'],
    failurePath: 'retry',
    difficulty: 'easy', tested: true,
  },
];

export const HOTSPOT_CONFIGS: HotspotConfig[] = [
  {
    id: 'hs-01', nodeId: 'N01', name: '锈门把手',
    positionX: 50, positionY: 60, size: 'medium',
    clickFeedback: '艾拉转动门把手，门缓缓打开',
    triggerScript: 'transition_to_N02',
    timed: false, highlightOnHover: true, repeatable: false,
  },
  {
    id: 'hs-02', nodeId: 'N02', name: '线人手中文件',
    positionX: 35, positionY: 45, size: 'small',
    clickFeedback: '线人递过一份加密文件，上面印着企业标志',
    triggerScript: 'show_clue_document',
    timed: false, highlightOnHover: true, repeatable: false,
  },
  {
    id: 'hs-03', nodeId: 'N05', name: '企业制服',
    positionX: 70, positionY: 30, size: 'large',
    appearCondition: 'alert_level < 50',
    clickFeedback: '艾拉换上企业制服，混入员工队伍',
    triggerScript: 'change_outfit_enterprise',
    timed: true, timeLimit: 10,
    highlightOnHover: true, repeatable: false,
  },
  {
    id: 'hs-04', nodeId: 'N08', name: '服务器终端',
    positionX: 50, positionY: 50, size: 'large',
    clickFeedback: '数据开始下载，进度条缓缓推进',
    triggerScript: 'download_evidence',
    timed: true, timeLimit: 8,
    highlightOnHover: true, repeatable: false,
  },
];
