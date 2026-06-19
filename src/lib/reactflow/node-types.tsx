// Phase 2: 统一的自定义 ReactFlow 节点组件
import { type NodeProps, Handle, Position } from '@xyflow/react';
import type { StoryNodeRFData } from './sync';

// ── Node type visual config ──────────────────────────────────────────────────
const NODE_CONFIG: Record<string, { label: string; color: string; border: string }> = {
  start:       { label: '▶ 起始',  color: '#7C6CF5', border: 'rgba(124,108,245,0.6)' },
  scene:       { label: '● 场景',  color: '#7C6CF5', border: 'rgba(124,108,245,0.4)' },
  choice:      { label: '⚖ 选择',  color: '#F59E0B', border: 'rgba(245,158,11,0.6)' },
  condition:   { label: '◆ 条件',  color: '#F59E0B', border: 'rgba(245,158,11,0.4)' },
  qte:         { label: '⚡ QTE',  color: '#EF4444', border: 'rgba(239,68,68,0.4)' },
  ending_good: { label: '★ 好结局', color: '#10B981', border: 'rgba(16,185,129,0.6)' },
  ending_bad:  { label: '✕ 坏结局', color: '#EF4444', border: 'rgba(239,68,68,0.6)' },
};

/** 统一的自定义节点组件（替代 NodesScreen 和 CanvasNodeGraph 各自的版本） */
export function StoryNodeRF({ id, data }: NodeProps) {
  const d = data as StoryNodeRFData;
  const cfg = NODE_CONFIG[d.nodeType] ?? NODE_CONFIG.scene;

  return (
    <>
      <Handle type="target" position={Position.Top} className="!w-1.5 !h-1.5 !bg-gray-400" />
      <div
        onClick={() => d.onNodeClick?.(id)}
        className="cursor-grab active:cursor-grabbing rounded-lg transition-shadow duration-150"
        style={{
          width: 140,
          padding: '8px 10px',
          background: '#fff',
          border: `1.5px solid ${d.isSelected ? '#7C6CF5' : d.hasError ? '#EF4444' : cfg.border}`,
          borderStyle: d.hasError ? 'dashed' : 'solid',
          boxShadow: d.isSelected
            ? '0 0 0 1px rgba(124,108,245,0.4), 0 0 12px rgba(124,108,245,0.12)'
            : undefined,
        }}
      >
        <div className="flex items-center justify-between mb-0.5">
          <span
            className="text-[8px] font-bold uppercase tracking-wider"
            style={{ color: d.hasError ? '#EF4444' : cfg.color }}
          >
            {cfg.label}
          </span>
          {d.isLocked && (
            <span className="text-[8px] text-gray-400">🔒</span>
          )}
        </div>
        <p
          className="text-[11px] font-semibold truncate"
          style={{ color: d.hasError ? '#EF4444' : '#1A1D2E' }}
        >
          {d.label}
        </p>
        {d.hasError && d.errorMsg && (
          <p className="text-[8px] text-red-500 mt-0.5 truncate">{d.errorMsg}</p>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} className="!w-1.5 !h-1.5 !bg-gray-400" />
    </>
  );
}

/** 注册映射 */
export const storyNodeTypes = { storyNode: StoryNodeRF };
