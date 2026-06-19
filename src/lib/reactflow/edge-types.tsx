// Phase 2: 统一的自定义 ReactFlow 边组件（5 种边类型）
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from '@xyflow/react';

// ── 通用工具：从外部 style 提取 opacity ──────────────────────────────────────
function extractOpacity(style?: React.CSSProperties): number | undefined {
  return style?.opacity as number | undefined;
}

// ── 通用边标签渲染 ─────────────────────────────────────────────────────────────
function EdgeLabel({ label, x, y, color, opacity }: { label?: string; x: number; y: number; color: string; opacity?: number }) {
  if (!label) return null;
  return (
    <EdgeLabelRenderer>
      <div
        style={{
          position: 'absolute',
          transform: `translate(-50%, -50%) translate(${x}px, ${y}px)`,
          fontSize: 9,
          color,
          background: '#fff',
          padding: '1px 4px',
          borderRadius: 3,
          pointerEvents: 'all',
          opacity,
        }}
        className="nodrag nopan"
      >
        {label}
      </div>
    </EdgeLabelRenderer>
  );
}

/** 顺序边 (causal) — 紫色实线 */
export function CausalEdge(props: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    sourcePosition: props.sourcePosition,
    targetX: props.targetX,
    targetY: props.targetY,
    targetPosition: props.targetPosition,
  });
  const opacity = extractOpacity(props.style as React.CSSProperties | undefined);

  return (
    <>
      <BaseEdge path={edgePath} style={{ stroke: '#7B5CF0', strokeWidth: 1.5, opacity }} />
      <EdgeLabel label={props.label as string | undefined} x={labelX} y={labelY} color="#7B5CF0" opacity={opacity} />
    </>
  );
}

/** 选择边 (exclusive) — 红色虚线 + 标签 */
export function ExclusiveEdge(props: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    sourcePosition: props.sourcePosition,
    targetX: props.targetX,
    targetY: props.targetY,
    targetPosition: props.targetPosition,
  });
  const opacity = extractOpacity(props.style as React.CSSProperties | undefined);

  return (
    <>
      <BaseEdge path={edgePath} style={{ stroke: '#EF4444', strokeWidth: 1.5, strokeDasharray: '4 3', opacity }} />
      <EdgeLabel label={props.label as string | undefined} x={labelX} y={labelY} color="#EF4444" opacity={opacity} />
    </>
  );
}

/** 条件边 (conditional) — 琥珀色虚线 + 标签 */
export function ConditionalEdge(props: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    sourcePosition: props.sourcePosition,
    targetX: props.targetX,
    targetY: props.targetY,
    targetPosition: props.targetPosition,
  });
  const opacity = extractOpacity(props.style as React.CSSProperties | undefined);

  return (
    <>
      <BaseEdge path={edgePath} style={{ stroke: '#F59E0B', strokeWidth: 1.5, strokeDasharray: '6 3', opacity }} />
      <EdgeLabel label={props.label as string | undefined} x={labelX} y={labelY} color="#F59E0B" opacity={opacity} />
    </>
  );
}

/** 并行边 (parallel) — 青色实线 */
export function ParallelEdge(props: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    sourcePosition: props.sourcePosition,
    targetX: props.targetX,
    targetY: props.targetY,
    targetPosition: props.targetPosition,
  });
  const opacity = extractOpacity(props.style as React.CSSProperties | undefined);

  return (
    <>
      <BaseEdge path={edgePath} style={{ stroke: '#00D4C8', strokeWidth: 1.5, opacity }} />
      <EdgeLabel label={props.label as string | undefined} x={labelX} y={labelY} color="#00D4C8" opacity={opacity} />
    </>
  );
}

/** 隐含边 (implied) — 灰色点线 */
export function ImpliedEdge(props: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    sourcePosition: props.sourcePosition,
    targetX: props.targetX,
    targetY: props.targetY,
    targetPosition: props.targetPosition,
  });
  const opacity = extractOpacity(props.style as React.CSSProperties | undefined);

  return (
    <>
      <BaseEdge path={edgePath} style={{ stroke: '#94A3B8', strokeWidth: 1, strokeDasharray: '2 4', opacity }} />
      <EdgeLabel label={props.label as string | undefined} x={labelX} y={labelY} color="#94A3B8" opacity={opacity} />
    </>
  );
}

/** 边类型注册映射 */
export const storyEdgeTypes = {
  causal: CausalEdge,
  exclusive: ExclusiveEdge,
  conditional: ConditionalEdge,
  parallel: ParallelEdge,
  implied: ImpliedEdge,
};
