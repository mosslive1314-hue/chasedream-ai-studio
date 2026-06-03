"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, TrendingUp, TrendingDown, Users, ChevronDown, ChevronUp, Plus } from "lucide-react";
import { useNarrativeStore } from "@/store";
import type { RelationshipMeter, RelationshipDelta } from "@/lib/studio-data";

// ─── Design Tokens ──────────────────────────────────────────
const S = {
  card: "#FFFFFF",
  bg: "#F5F6FA",
  border: "#E2E5F0",
  primary: "#5E50E8",
  text: "#1A1D2E",
  text2: "#4A5068",
  text3: "#8892B0",
  success: "#10B981",
  error: "#EF4444",
  warning: "#F59E0B",
};

// ─── Shared inline styles ────────────────────────────────────
const dotBase = { width: 8, height: 8, borderRadius: "50%" as const, flexShrink: 0 };
const nameStyle = {
  fontSize: 13, fontWeight: 700, color: S.text,
  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const,
};
const pillBase = { fontSize: 10, fontWeight: 600, padding: "1px 6px", borderRadius: 4 };

// ─── Helpers ────────────────────────────────────────────────

/** Determine which threshold zone the current value falls in. */
function getCurrentZone(meter: RelationshipMeter): string {
  const sorted = [...meter.thresholds].sort((a, b) => a.value - b.value);
  let label = sorted[0]?.label ?? "--";
  for (const t of sorted) {
    if (meter.currentValue >= t.value) label = t.label;
  }
  return label;
}

function formatValue(v: number): string {
  return v >= 0 ? `+${v}` : `${v}`;
}

function valueColor(v: number): string {
  if (v > 0) return S.success;
  if (v < 0) return S.error;
  return S.text3;
}

function meterPercent(m: RelationshipMeter): number {
  const range = m.maxValue - m.minValue;
  if (range === 0) return 50;
  return ((m.currentValue - m.minValue) / range) * 100;
}

function thresholdPct(m: RelationshipMeter, v: number): number {
  const range = m.maxValue - m.minValue;
  if (range === 0) return 0;
  return ((v - m.minValue) / range) * 100;
}

// ─── Sub-components ─────────────────────────────────────────

function MeterBar({ meter }: { meter: RelationshipMeter }) {
  const pct = meterPercent(meter);
  const zone = getCurrentZone(meter);
  const sorted = [...meter.thresholds].sort((a, b) => a.value - b.value);

  return (
    <div style={{ marginTop: 8, marginBottom: 4 }}>
      {/* Gradient track */}
      <div style={{
        position: "relative", height: 8, borderRadius: 4,
        background: "linear-gradient(90deg, #EF4444 0%, #F59E0B 40%, #10B981 100%)",
        boxShadow: "inset 0 1px 2px rgba(0,0,0,0.10)",
      }}>
        {/* Marker dot */}
        <div style={{
          position: "absolute", top: -3,
          left: `${Math.max(0, Math.min(100, pct))}%`,
          transform: "translateX(-50%)",
          width: 14, height: 14, borderRadius: "50%",
          background: S.card, border: `2.5px solid ${meter.color}`,
          boxShadow: "0 1px 4px rgba(0,0,0,0.18)",
          transition: "left 0.35s cubic-bezier(.4,0,.2,1)",
        }} />
      </div>
      {/* Threshold labels */}
      <div style={{ position: "relative", height: 18, marginTop: 4 }}>
        {sorted.map((t) => {
          const active = zone === t.label;
          return (
            <span key={t.value} style={{
              position: "absolute",
              left: `${Math.max(0, Math.min(100, thresholdPct(meter, t.value)))}%`,
              transform: "translateX(-50%)",
              fontSize: 10, fontWeight: active ? 700 : 400,
              color: active ? meter.color : S.text3,
              whiteSpace: "nowrap", transition: "color 0.2s",
            }}>
              {t.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function HistoryRow({ delta }: { delta: RelationshipDelta }) {
  const pos = delta.delta >= 0;
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: 8,
      padding: "6px 0", borderBottom: `1px solid ${S.border}`,
    }}>
      <span style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        width: 20, height: 20, borderRadius: 4, flexShrink: 0, marginTop: 1,
        background: pos ? "rgba(16,185,129,0.10)" : "rgba(239,68,68,0.10)",
        color: pos ? S.success : S.error,
      }}>
        {pos ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, color: S.text2, lineHeight: 1.4 }}>
          {delta.triggerDescription}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
          <span style={{ ...pillBase, color: S.text3, background: S.bg, padding: "1px 5px", borderRadius: 3 }}>
            {delta.nodeId}
          </span>
          <span style={{
            ...pillBase, padding: "1px 5px", borderRadius: 3,
            color: pos ? S.success : S.error,
            background: pos ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)",
          }}>
            {delta.reason}
          </span>
          <span style={{ marginLeft: "auto", fontSize: 12, fontWeight: 700, color: valueColor(delta.delta) }}>
            {formatValue(delta.delta)}
          </span>
        </div>
      </div>
    </div>
  );
}

function MeterCard({ meter }: { meter: RelationshipMeter }) {
  const [expanded, setExpanded] = useState(false);
  const zone = getCurrentZone(meter);
  const recentHistory = meter.history.slice(-5).reverse();

  return (
    <motion.div layout style={{
      background: S.card, borderRadius: 10, border: `1px solid ${S.border}`,
      boxShadow: "0 1px 4px rgba(0,0,0,0.04)", overflow: "hidden", transition: "box-shadow 0.2s",
    }} whileHover={{ boxShadow: "0 2px 10px rgba(0,0,0,0.08)" }}>

      {/* Collapsible header */}
      <button onClick={() => setExpanded((e) => !e)} style={{
        width: "100%", display: "flex", flexDirection: "column",
        padding: "12px 14px 8px", background: "none", border: "none", cursor: "pointer", textAlign: "left",
      }}>
        {/* Character pair */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1, minWidth: 0 }}>
            <span style={{ ...dotBase, background: meter.color }} />
            <span style={nameStyle}>{meter.characterAName}</span>
            <span style={{ fontSize: 11, color: S.text3, flexShrink: 0 }}>&harr;</span>
            <span style={{ ...dotBase, background: meter.color }} />
            <span style={nameStyle}>{meter.characterBName}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
            <span style={{
              fontSize: 16, fontWeight: 800, color: valueColor(meter.currentValue),
              fontVariantNumeric: "tabular-nums",
            }}>
              {formatValue(meter.currentValue)}
            </span>
            {expanded ? <ChevronUp size={14} color={S.text3} /> : <ChevronDown size={14} color={S.text3} />}
          </div>
        </div>

        {/* Label + zone badge */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
          <Heart size={11} color={meter.color} fill={meter.color} />
          <span style={{ fontSize: 11, color: S.text2, fontWeight: 500 }}>{meter.relationshipLabel}</span>
          <span style={{ ...pillBase, color: meter.color, background: `${meter.color}14` }}>{zone}</span>
        </div>

        <MeterBar meter={meter} />
      </button>

      {/* Expandable history */}
      <AnimatePresence initial={false}>
        {expanded && recentHistory.length > 0 && (
          <motion.div key="history"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            style={{ overflow: "hidden",
          }}>
            <div style={{ padding: "4px 14px 12px", borderTop: `1px solid ${S.border}` }}>
              <div style={{
                fontSize: 10, fontWeight: 600, color: S.text3,
                textTransform: "uppercase", letterSpacing: 0.5, margin: "8px 0 4px",
              }}>
                {"\u53D8\u5316\u5386\u53F2"}
              </div>
              {recentHistory.map((d, i) => (
                <HistoryRow key={`${d.nodeId}-${i}`} delta={d} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Main Panel ─────────────────────────────────────────────

export function RelationshipMeterPanel() {
  const meters = useNarrativeStore((s) => s.relationshipMeters);

  return (
    <div style={{
      display: "flex", flexDirection: "column", gap: 10,
      padding: 12, background: S.bg, minHeight: "100%",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 2px 8px" }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          width: 28, height: 28, borderRadius: 7, background: `${S.primary}14`,
        }}>
          <Users size={15} color={S.primary} />
        </div>
        <span style={{ fontSize: 14, fontWeight: 700, color: S.text, flex: 1 }}>
          {"\u5173\u7CFB\u8BA1\u91CF\u8868"}
        </span>
        <span style={{
          fontSize: 10, fontWeight: 600, color: S.text3,
          background: S.card, border: `1px solid ${S.border}`, padding: "2px 7px", borderRadius: 5,
        }}>
          {meters.length}
        </span>
      </div>

      {/* Meter cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {meters.map((m) => <MeterCard key={m.id} meter={m} />)}
        {meters.length === 0 && (
          <div style={{ padding: 24, textAlign: "center", color: S.text3, fontSize: 12 }}>
            {"\u6682\u65E0\u5173\u7CFB\u8BA1\u91CF\u8868\u3002\u70B9\u51FB\u4E0B\u65B9\u6309\u94AE\u6DFB\u52A0\u3002"}
          </div>
        )}
      </div>

      {/* Add new meter — placeholder */}
      <button
        onClick={() => {/* placeholder */}}
        style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          width: "100%", padding: "10px 0",
          border: `1.5px dashed ${S.border}`, borderRadius: 8,
          background: "transparent", cursor: "pointer",
          color: S.text3, fontSize: 12, fontWeight: 600,
          transition: "border-color 0.2s, color 0.2s", marginTop: 2,
        }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = S.primary; e.currentTarget.style.color = S.primary; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = S.border; e.currentTarget.style.color = S.text3; }}
      >
        <Plus size={14} />
        {"\u6DFB\u52A0\u5173\u7CFB\u8BA1\u91CF\u8868"}
      </button>
    </div>
  );
}
