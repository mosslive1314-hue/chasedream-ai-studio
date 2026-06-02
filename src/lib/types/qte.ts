// ChaseDream Creator Studio — QTE/Hotspot Types

// ── QTE/Hotspot 配置数据（P4-11）─────────────────────────────────────────────

export type QTEOperationType = 'tap' | 'swipe' | 'hold' | 'sequence';

export interface QTEConfig {
  id: string;
  nodeId: string;
  name: string;
  triggerMoment: string;
  operationType: QTEOperationType;
  operationLabel: string;
  timeLimit: number;          // 秒
  successFeedback: string;
  failureFeedback: string;
  variableChanges: string[];
  failurePath: 'bad_ending' | 'alternate_path' | 'retry';
  difficulty: 'easy' | 'normal' | 'hard';
  tested: boolean;
}

export interface HotspotConfig {
  id: string;
  nodeId: string;
  name: string;
  positionX: number;          // 0-100 百分比
  positionY: number;
  size: 'small' | 'medium' | 'large';
  appearCondition?: string;
  clickFeedback: string;
  triggerScript: string;
  timed: boolean;
  timeLimit?: number;
  highlightOnHover: boolean;
  repeatable: boolean;
}
