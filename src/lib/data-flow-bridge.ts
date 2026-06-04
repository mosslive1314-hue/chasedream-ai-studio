/**
 * 页面间数据流桥接服务
 * 
 * 支持创作管线的跨页面数据传递：
 * ParseScreen → ScriptScreen → InteractionScreen → AssetsScreen → CinematicEditor → OverviewScreen
 * 
 * 基于 sessionStorage 的瞬态传递 + Zustand store 写入回调
 */

import type { ScriptBlock, StoryNode, AssetCard, QualityCheck } from '@/lib/studio-data';

// ── 传输类型定义 ──────────────────────────────────────────────────────────

export type BridgeSource = 'parse' | 'script' | 'interaction' | 'assets' | 'cinematic' | 'overview';

export interface BridgeTransfer {
  id: string;
  source: BridgeSource;
  target: BridgeSource;
  label: string;
  createdAt: number;
  consumed: boolean;
  payload: Record<string, unknown>;
}

// 每种传输方向的载荷类型
export interface BridgePayloads {
  'parse→script': {
    scriptBlocks: Partial<ScriptBlock>[];
    characterNames: string[];
    sceneNames: string[];
  };
  'script→interaction': {
    selectedBlockIds: string[];
    blockTexts: string[];
    suggestedNodeTypes: ('choice' | 'branch' | 'qte' | 'check')[];
  };
  'interaction→assets': {
    nodeIds: string[];
    assetRequirements: {
      nodeId: string;
      type: 'image' | 'audio' | 'video' | 'text';
      description: string;
      priority: 'high' | 'medium' | 'low';
    }[];
  };
  'assets→cinematic': {
    readyNodeIds: string[];
    assetIds: string[];
    previewMode: 'single' | 'sequence';
  };
  'cinematic→overview': {
    issues: {
      nodeId: string;
      type: 'visual' | 'audio' | 'pacing' | 'logic' | 'consistency';
      severity: 'error' | 'warning' | 'info';
      description: string;
    }[];
    timestamp: string;
  };
}

type BridgeKey = keyof BridgePayloads;

// ── 管线阶段映射 ──────────────────────────────────────────────────────────

export const PIPELINE_FLOW: { from: BridgeSource; to: BridgeSource; key: BridgeKey; label: string; icon: string }[] = [
  { from: 'parse', to: 'script', key: 'parse→script', label: '解构结果 → 剧本块', icon: '📝' },
  { from: 'script', to: 'interaction', key: 'script→interaction', label: '剧本段落 → 互动节点', icon: '🔀' },
  { from: 'interaction', to: 'assets', key: 'interaction→assets', label: '互动节点 → 资产需求', icon: '🎨' },
  { from: 'assets', to: 'cinematic', key: 'assets→cinematic', label: '资产就绪 → 演出预览', icon: '🎬' },
  { from: 'cinematic', to: 'overview', key: 'cinematic→overview', label: '预览问题 → 质检清单', icon: '✅' },
];

const STORAGE_KEY = 'cdream_bridge_queue';

// ── 存储操作 ──────────────────────────────────────────────────────────────

function getQueue(): BridgeTransfer[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setQueue(queue: BridgeTransfer[]) {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
}

/** 推送一个跨页面传输 */
export function pushTransfer<K extends BridgeKey>(
  source: BridgeSource,
  target: BridgeSource,
  key: K,
  payload: BridgePayloads[K],
  label: string,
): BridgeTransfer {
  const transfer: BridgeTransfer = {
    id: `bridge_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    source,
    target,
    label,
    createdAt: Date.now(),
    consumed: false,
    payload: payload as Record<string, unknown>,
  };
  const queue = getQueue();
  queue.push(transfer);
  setQueue(queue);
  return transfer;
}

/** 消费（读取并标记已消费）指定目标页的传输 */
export function consumeTransfers(target: BridgeSource): BridgeTransfer[] {
  const queue = getQueue();
  const matched = queue.filter(t => t.target === target && !t.consumed);
  queue.forEach(t => {
    if (t.target === target && !t.consumed) t.consumed = true;
  });
  setQueue(queue);
  return matched;
}

/** 获取指定目标页的待消费传输数量 */
export function getPendingCount(target: BridgeSource): number {
  return getQueue().filter(t => t.target === target && !t.consumed).length;
}

/** 清理所有已消费的传输 */
export function clearConsumed(): void {
  const queue = getQueue().filter(t => !t.consumed);
  setQueue(queue);
}

/** 获取当前页面的流入/流出配置 */
export function getFlowConfig(page: BridgeSource) {
  const incoming = PIPELINE_FLOW.find(f => f.to === page);
  const outgoing = PIPELINE_FLOW.find(f => f.from === page);
  return { incoming, outgoing };
}

/** 获取目标页面路由 */
export function getTargetRoute(target: BridgeSource): string {
  const routeMap: Record<BridgeSource, string> = {
    parse: '/parse',
    script: '/script',
    interaction: '/interaction',
    assets: '/assets',
    cinematic: '/cinematic',
    overview: '/overview',
  };
  return routeMap[target];
}
