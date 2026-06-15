import { useState } from "react";
import { motion } from "framer-motion";
import { Compass, AlertTriangle, Lock, Unlock, ChevronDown, ChevronUp } from "lucide-react";
import { useNarrativeStore } from "@/store";
import type { MoralAxis, MoralZone } from "@/lib/studio-data";

// ── Design Tokens ────────────────────────────────────────────────
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

// ── Helpers ──────────────────────────────────────────────────────

/** Map a value in [-100, 100] to a percentage [0, 100] */
function valueToPercent(value: number): number {
  return ((value + 100) / 200) * 100;
}

/** Find which zone the current value falls into */
function getCurrentZone(zones: MoralZone[], value: number): MoralZone | undefined {
  return zones.find((z) => value >= z.min && value <= z.max);
}

/** Check if a gated choice is unlocked at the current value */
function isChoiceUnlocked(
  requiredRange: { min: number; max: number },
  value: number,
): boolean {
  return value >= requiredRange.min && value <= requiredRange.max;
}

// ── Sub-components ───────────────────────────────────────────────

function GradientBar({ axis }: { axis: MoralAxis }) {
  const percent = valueToPercent(axis.currentValue);
  const [negColor, posColor] = axis.gradientColors;

  return (
    <div className="w-full mt-1 mb-1">
      {/* Current value centered above the bar */}
      <div className="text-center mb-1.5">
        <span className="text-lg font-bold tabular-nums" style={{ color: S.text }}>
          {axis.currentValue > 0 ? `+${axis.currentValue}` : axis.currentValue}
        </span>
        <span className="text-[10px] ml-1" style={{ color: S.text3 }}>/ 100</span>
      </div>

      {/* Bar container with markers and diamond */}
      <div className="relative w-full">
        {/* Zone threshold markers */}
        {axis.zones.map((zone, i) => {
          if (i === 0) return null;
          const markerPercent = valueToPercent(zone.min);
          return (
            <div
              key={`marker-${zone.min}`}
              className="absolute top-0 w-[1px] z-10"
              style={{
                left: `${markerPercent}%`,
                height: 10,
                background: `${S.text3}66`,
              }}
            />
          );
        })}

        {/* The gradient bar */}
        <div
          className="w-full rounded-full"
          style={{
            height: 10,
            background: `linear-gradient(to right, ${negColor}, ${posColor})`,
          }}
        />

        {/* Diamond marker at current position */}
        <div
          className="absolute z-20"
          style={{
            left: `${percent}%`,
            top: "50%",
            transform: "translate(-50%, -50%) rotate(45deg)",
            width: 16,
            height: 16,
            background: S.card,
            border: `2px solid ${S.primary}`,
            boxShadow: `0 0 0 2px ${S.primary}33, 0 2px 6px rgba(0,0,0,0.18)`,
            borderRadius: 2,
          }}
        />
      </div>
    </div>
  );
}

function ZoneList({
  zones,
  currentValue,
}: {
  zones: MoralZone[];
  currentValue: number;
}) {
  return (
    <div className="flex flex-col gap-1 mt-2">
      {zones.map((zone) => {
        const isCurrent = currentValue >= zone.min && currentValue <= zone.max;
        return (
          <div
            key={zone.label}
            className="flex items-center gap-2 px-2 py-1 rounded text-xs"
            style={{
              background: isCurrent ? `${S.primary}10` : "transparent",
              borderLeft: isCurrent ? `3px solid ${S.primary}` : "3px solid transparent",
              color: isCurrent ? S.text : S.text2,
              fontWeight: isCurrent ? 600 : 400,
            }}
          >
            <span className="shrink-0" style={{ color: S.text3, fontSize: 10, minWidth: 64 }}>
              [{zone.min} ~ {zone.max}]
            </span>
            <span className="font-medium">{zone.label}</span>
            {isCurrent && (
              <span
                className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full"
                style={{ background: `${S.primary}18`, color: S.primary }}
              >
                当前
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function NPCAttitudeList({ axis }: { axis: MoralAxis }) {
  if (!axis.affectsNPCAttitudes.length) return null;

  return (
    <div className="mt-3">
      <div className="text-[11px] font-semibold mb-1" style={{ color: S.text2 }}>
        NPC 态度影响
      </div>
      <div className="flex flex-col gap-1">
        {axis.affectsNPCAttitudes.map((npc, i) => {
          const triggered = axis.currentValue >= npc.threshold;
          return (
            <div
              key={`${npc.characterId}-${npc.threshold}-${i}`}
              className="flex items-start gap-2 text-[11px] px-2 py-1 rounded"
              style={{
                background: triggered ? `${S.success}08` : `${S.text3}06`,
                color: triggered ? S.text : S.text3,
              }}
            >
              <AlertTriangle
                size={11}
                className="shrink-0 mt-px"
                style={{ color: triggered ? S.warning : S.text3 }}
              />
              <div>
                <span className="font-medium">
                  {npc.characterId.replace("char-", "").replace(/-/g, " ")}
                </span>
                <span className="mx-1" style={{ color: S.text3 }}>
                  (阈值 {npc.threshold > 0 ? `+${npc.threshold}` : npc.threshold}):
                </span>
                <span>{npc.attitudeChange}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function GatedChoicesList({ axis }: { axis: MoralAxis }) {
  const gates = axis.gatesChoices;
  if (!gates || !gates.length) return null;

  return (
    <div className="mt-3">
      <div className="text-[11px] font-semibold mb-1" style={{ color: S.text2 }}>
        门控选项
      </div>
      <div className="flex flex-col gap-1">
        {gates.map((gate) => {
          const unlocked = isChoiceUnlocked(gate.requiredRange, axis.currentValue);
          return (
            <div
              key={gate.choiceOptionId}
              className="flex items-center gap-2 text-[11px] px-2 py-1 rounded"
              style={{
                background: unlocked ? `${S.success}08` : `${S.error}06`,
                color: unlocked ? S.text : S.text3,
              }}
            >
              {unlocked ? (
                <Unlock size={12} className="shrink-0" style={{ color: S.success }} />
              ) : (
                <Lock size={12} className="shrink-0" style={{ color: S.error }} />
              )}
              <span className="font-medium">{gate.choiceOptionId}</span>
              <span style={{ color: S.text3, fontSize: 10 }}>
                [{gate.requiredRange.min} ~ {gate.requiredRange.max}]
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Axis Card ────────────────────────────────────────────────────

function AxisCard({ axis }: { axis: MoralAxis }) {
  const [expanded, setExpanded] = useState(false);
  const currentZone = getCurrentZone(axis.zones, axis.currentValue);

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{
        background: S.card,
        border: `1px solid ${S.border}`,
      }}
    >
      {/* Card Header */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-center mb-1">
          <span className="text-sm font-semibold" style={{ color: S.text }}>
            {axis.name}
          </span>
        </div>

        {/* Negative / Positive labels */}
        <div className="flex items-center justify-between text-[11px]" style={{ color: S.text3 }}>
          <span>{axis.negativeLabel}</span>
          <span>{axis.positiveLabel}</span>
        </div>

        {/* Gradient bar with marker */}
        <GradientBar axis={axis} />

        {/* Current zone highlight */}
        {currentZone && (
          <div
            className="mt-2 px-2 py-1.5 rounded text-[11px]"
            style={{ background: `${S.primary}08`, border: `1px solid ${S.primary}20` }}
          >
            <div className="font-semibold" style={{ color: S.primary }}>
              {currentZone.label}
            </div>
            <div className="mt-0.5" style={{ color: S.text2 }}>
              {currentZone.narrativeTone}
            </div>
          </div>
        )}
      </div>

      {/* Expand / Collapse toggle */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-center gap-1 py-1.5 text-[11px] cursor-pointer"
        style={{
          borderTop: `1px solid ${S.border}`,
          color: S.text3,
          background: `${S.bg}80`,
        }}
      >
        {expanded ? "收起详情" : "展开详情"}
        {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>

      {/* Expandable details */}
      <motion.div
        initial={false}
        animate={{
          height: expanded ? "auto" : 0,
          opacity: expanded ? 1 : 0,
        }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        className="overflow-hidden"
      >
        <div className="px-4 pb-3">
          {/* Zone list */}
          <div className="text-[11px] font-semibold mb-1 mt-2" style={{ color: S.text2 }}>
            阶段划分
          </div>
          <ZoneList zones={axis.zones} currentValue={axis.currentValue} />

          {/* NPC attitudes */}
          <NPCAttitudeList axis={axis} />

          {/* Gated choices */}
          <GatedChoicesList axis={axis} />
        </div>
      </motion.div>
    </div>
  );
}

// ── Main Panel ───────────────────────────────────────────────────

export function MoralCompassPanel() {
  const moralAxes = useNarrativeStore((s) => s.moralAxes);

  // Collect all unique affected endings across every axis
  const allAffectedEndings = Array.from(
    new Set(moralAxes.flatMap((a) => a.affectsEndings)),
  );

  return (
    <div className="flex flex-col gap-3 p-4" style={{ background: S.bg, minHeight: "100%" }}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <Compass size={18} style={{ color: S.primary }} />
        <span className="text-base font-bold" style={{ color: S.text }}>
          道德追踪
        </span>
        <span className="text-[11px] ml-auto" style={{ color: S.text3 }}>
          {moralAxes.length} 条道德轴
        </span>
      </div>

      {/* Axis cards */}
      <div className="flex flex-col gap-3">
        {moralAxes.map((axis) => (
          <AxisCard key={axis.id} axis={axis} />
        ))}
      </div>

      {/* Summary — affected endings */}
      {allAffectedEndings.length > 0 && (
        <div
          className="rounded-lg px-4 py-3"
          style={{ background: S.card, border: `1px solid ${S.border}` }}
        >
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={14} style={{ color: S.warning }} />
            <span className="text-xs font-semibold" style={{ color: S.text }}>
              结局影响概览
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {allAffectedEndings.map((endingId) => (
              <span
                key={endingId}
                className="text-[10px] px-2 py-0.5 rounded-full"
                style={{ background: `${S.warning}14`, color: S.warning, border: `1px solid ${S.warning}30` }}
              >
                {endingId}
              </span>
            ))}
          </div>
          <div className="text-[10px] mt-2" style={{ color: S.text3 }}>
            共 {allAffectedEndings.length} 个结局受道德轴影响
          </div>
        </div>
      )}
    </div>
  );
}
