import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Image,
  Music,
  Film,
  Sparkles,
  Edit2,
  Link2,
  CheckCircle2,
  AlertTriangle,
  Loader2,
} from "lucide-react";

// ─── Design Tokens ───────────────────────────────────────────────────────────
const S = {
  bg: "#F5F6FA",
  card: "#FFFFFF",
  s2: "#F4F6FC",
  border: "#E8EAF2",
  primary: "#7C6CF5",
  accent: "#00A99D",
  text: "#1A1D2E",
  text2: "#4A5068",
  text3: "#8892B0",
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
};

// ─── Types ───────────────────────────────────────────────────────────────────
export type AssetType = "text" | "image" | "audio" | "video";
export type AssetStatus = "ready" | "pending" | "generating" | "error";

export interface UnifiedAssetCardProps {
  id: string;
  title: string;
  subtitle?: string;
  sourceNode?: string;
  sourceNodeLabel?: string;
  type: AssetType;
  status: AssetStatus;
  statusLabel?: string;
  /** Preview content rendered in the preview area */
  previewContent?: React.ReactNode;
  /** Action callbacks */
  onGenerate?: () => void;
  onEdit?: () => void;
  onBind?: () => void;
  /** Extra meta items shown after source node */
  metaItems?: { label: string; value: string; color?: string }[];
}

// ─── Status configuration ────────────────────────────────────────────────────
export interface StatusConfig {
  label: string;
  color: string;
  bg: string;
  border: string;
  Icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;
  spinning?: boolean;
}

export function getStatusConfig(status: AssetStatus, statusLabel?: string): StatusConfig {
  switch (status) {
    case "ready":
      return {
        label: statusLabel ?? "就绪",
        color: S.success,
        bg: `${S.success}12`,
        border: `${S.success}25`,
        Icon: CheckCircle2,
      };
    case "pending":
      return {
        label: statusLabel ?? "待处理",
        color: S.warning,
        bg: `${S.warning}10`,
        border: `${S.warning}20`,
        Icon: AlertTriangle,
      };
    case "generating":
      return {
        label: statusLabel ?? "生成中",
        color: S.primary,
        bg: `${S.primary}10`,
        border: `${S.primary}20`,
        Icon: Loader2,
        spinning: true,
      };
    case "error":
      return {
        label: statusLabel ?? "异常",
        color: S.error,
        bg: `${S.error}10`,
        border: `${S.error}20`,
        Icon: AlertTriangle,
      };
  }
}

// ─── Type icon mapping ───────────────────────────────────────────────────────
const TYPE_ICON_MAP: Record<AssetType, React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>> = {
  text: FileText,
  image: Image,
  audio: Music,
  video: Film,
};

export function TypeIcon({
  type,
  size = 16,
  style,
}: {
  type: AssetType;
  size?: number;
  style?: React.CSSProperties;
}) {
  const Icon = TYPE_ICON_MAP[type];
  return <Icon size={size} style={style} />;
}

// ─── Preview gradient per type ───────────────────────────────────────────────
const TYPE_GRADIENT: Record<AssetType, string> = {
  text: "linear-gradient(135deg, #6366F1 0%, #818CF8 50%, #A5B4FC 100%)",
  image: "linear-gradient(135deg, #8B5CF6 0%, #A78BFA 50%, #C4B5FD 100%)",
  audio: "linear-gradient(135deg, #0D9488 0%, #14B8A6 50%, #5EEAD4 100%)",
  video: "linear-gradient(135deg, #D97706 0%, #F59E0B 50%, #FCD34D 100%)",
};

const TYPE_ICON_COLOR: Record<AssetType, string> = {
  text: "rgba(255,255,255,0.70)",
  image: "rgba(255,255,255,0.70)",
  audio: "rgba(255,255,255,0.70)",
  video: "rgba(255,255,255,0.70)",
};

// ─── Action pill button ──────────────────────────────────────────────────────
function ActionPill({
  icon: Icon,
  label,
  color,
  onClick,
}: {
  icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;
  label: string;
  color: string;
  onClick?: () => void;
}) {
  if (!onClick) return null;
  return (
    <motion.button
      whileTap={{ scale: 0.93 }}
      whileHover={{ scale: 1.04 }}
      onClick={onClick}
      className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-bold focus:outline-none transition-colors cursor-pointer"
      style={{
        background: `${color}0A`,
        border: `1px solid ${color}22`,
        color,
      }}
    >
      <Icon size={10} />
      {label}
    </motion.button>
  );
}

// ─── Status badge ────────────────────────────────────────────────────────────
function StatusBadge({ status, statusLabel }: { status: AssetStatus; statusLabel?: string }) {
  const cfg = getStatusConfig(status, statusLabel);
  const { Icon, spinning } = cfg;

  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={status}
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.85 }}
        transition={{ duration: 0.18 }}
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-bold whitespace-nowrap shrink-0"
        style={{
          background: cfg.bg,
          border: `1px solid ${cfg.border}`,
          color: cfg.color,
        }}
      >
        <Icon
          size={9}
          className={spinning ? "animate-spin" : undefined}
        />
        {cfg.label}
      </motion.span>
    </AnimatePresence>
  );
}

// ─── UnifiedAssetCard ────────────────────────────────────────────────────────
export default function UnifiedAssetCard({
  id,
  title,
  subtitle,
  sourceNode,
  sourceNodeLabel,
  type,
  status,
  statusLabel,
  previewContent,
  onGenerate,
  onEdit,
  onBind,
  metaItems,
}: UnifiedAssetCardProps) {
  const hasActions = onGenerate || onEdit || onBind;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.22 }}
      className="flex flex-col rounded-xl overflow-hidden transition-shadow duration-200 hover:shadow-lg"
      style={{
        background: S.card,
        border: `1px solid ${S.border}`,
      }}
    >
      {/* ── Preview area ── */}
      <div
        className="relative flex items-center justify-center shrink-0"
        style={{
          height: 80,
          background: TYPE_GRADIENT[type],
        }}
      >
        {previewContent ?? (
          <TypeIcon type={type} size={28} style={{ color: TYPE_ICON_COLOR[type] }} />
        )}

        {/* Type label chip (top-left) */}
        <span
          className="absolute top-2 left-2 text-[7px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
          style={{
            background: "rgba(0,0,0,0.25)",
            color: "rgba(255,255,255,0.85)",
            backdropFilter: "blur(4px)",
          }}
        >
          {type}
        </span>
      </div>

      {/* ── Body ── */}
      <div className="flex flex-col gap-1.5 p-3">
        {/* Title row + status */}
        <div className="flex items-start justify-between gap-2">
          <h4
            className="text-[11px] font-bold leading-tight truncate"
            style={{ color: S.text }}
            title={title}
          >
            {title}
          </h4>
          <StatusBadge status={status} statusLabel={statusLabel} />
        </div>

        {/* Meta row */}
        {(sourceNode || subtitle || (metaItems && metaItems.length > 0)) && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {sourceNode && (
              <span
                className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded shrink-0"
                style={{ background: `${S.primary}10`, color: S.primary }}
                title={sourceNodeLabel}
              >
                {sourceNode}
              </span>
            )}
            {sourceNodeLabel && (
              <span
                className="text-[8px] truncate"
                style={{ color: S.text3 }}
              >
                {sourceNodeLabel}
              </span>
            )}
            {sourceNode && subtitle && (
              <span className="text-[8px]" style={{ color: S.text3 }}>
                {"\u00B7"}
              </span>
            )}
            {subtitle && (
              <span
                className="text-[8px] truncate"
                style={{ color: S.text2 }}
              >
                {subtitle}
              </span>
            )}
            {metaItems?.map((item, i) => (
              <span
                key={i}
                className="text-[8px] px-1.5 py-0.5 rounded shrink-0"
                style={{
                  background: `${item.color ?? S.text3}10`,
                  color: item.color ?? S.text3,
                }}
              >
                {item.label}: {item.value}
              </span>
            ))}
          </div>
        )}

        {/* Action buttons row */}
        {hasActions && (
          <div className="flex items-center gap-1.5 pt-1">
            <ActionPill
              icon={Sparkles}
              label="生成"
              color={S.primary}
              onClick={onGenerate}
            />
            <ActionPill
              icon={Edit2}
              label="编辑"
              color={S.accent}
              onClick={onEdit}
            />
            <ActionPill
              icon={Link2}
              label="绑定"
              color={S.text2}
              onClick={onBind}
            />
          </div>
        )}
      </div>
    </motion.div>
  );
}
