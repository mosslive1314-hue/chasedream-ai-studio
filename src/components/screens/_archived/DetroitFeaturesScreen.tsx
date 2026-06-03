"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  Eye, Timer, Lock, Heart, GitBranch, MessageCircle,
  Search, Compass, Clock, Users, Shield, Brain,
  ChevronRight, AlertTriangle, CheckCircle2, XCircle,
} from "lucide-react";
import { useNarrativeStore } from "@/store";
import { RelationshipMeterPanel } from "@/components/ui/RelationshipMeterPanel";
import { MoralCompassPanel } from "@/components/ui/MoralCompassPanel";
import { InvestigationPanel } from "@/components/ui/InvestigationPanel";
import { DialogueTreeEditor } from "@/components/ui/DialogueTreeEditor";
import type { POVConfig, SubgraphLock, TimedDecisionConfig, ChapterVariant, PathTimeEstimate } from "@/lib/studio-data";

// ── Design Tokens ──────────────────────────────────────────────────────────────
const S = {
  card: "#FFFFFF", bg: "#F5F6FA", border: "#E2E5F0",
  primary: "#5E50E8", primary10: "rgba(94,80,232,0.10)", primary20: "rgba(94,80,232,0.20)",
  text: "#1A1D2E", text2: "#4A5068", text3: "#8892B0",
  success: "#10B981", error: "#EF4444", warning: "#F59E0B", accent: "#F97316",
};

// ── Tab definitions ────────────────────────────────────────────────────────────
const TABS = [
  { id: "pov",          label: "POV 视角系统", icon: Eye },
  { id: "timed",        label: "限时选择",     icon: Timer },
  { id: "lock",         label: "子图锁死",     icon: Lock },
  { id: "relationship", label: "关系计量表",   icon: Heart },
  { id: "variant",      label: "章节变体",     icon: GitBranch },
  { id: "dialogue",     label: "对话树",       icon: MessageCircle },
  { id: "investigate",  label: "调查推理",     icon: Search },
  { id: "moral",        label: "道德追踪",     icon: Compass },
] as const;
type TabId = (typeof TABS)[number]["id"];

// ── Shared styles ──────────────────────────────────────────────────────────────
const cardBase: React.CSSProperties = {
  background: S.card, borderRadius: 12, border: `1px solid ${S.border}`, padding: 20,
};
const badgeBase: React.CSSProperties = {
  fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 6, display: "inline-block",
};
const statBox: React.CSSProperties = {
  background: S.primary10, borderRadius: 10, padding: "12px 18px", textAlign: "center", flex: 1,
};
const sectionGap: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 20 };

// ── Lookup maps ────────────────────────────────────────────────────────────────
const CHAR_COLORS: Record<string, string> = {
  "char-agent-ling": "#3b82f6", "char-hacker-kai": "#f59e0b",
  "char-corporate-mei": "#ec4899", "char-director-wu": "#ef4444",
  "char-informant-ghost": "#8b5cf6",
};
const TRIGGER_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  character_death:    { bg: "rgba(220,38,38,0.10)",  color: "#DC2626", label: "角色死亡" },
  variable_threshold: { bg: "rgba(245,158,11,0.10)", color: "#D97706", label: "变量阈值" },
  choice_made:        { bg: "rgba(94,80,232,0.10)",  color: "#5E50E8", label: "选择触发" },
  time_expired:       { bg: "rgba(239,68,68,0.10)",  color: "#EF4444", label: "超时触发" },
  custom:             { bg: "rgba(139,92,246,0.10)", color: "#8B5CF6", label: "自定义" },
};
const DISPLAY_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  bar:       { bg: "rgba(59,130,246,0.10)",  color: "#3B82F6", label: "进度条" },
  circle:    { bg: "rgba(16,185,129,0.10)", color: "#10B981", label: "环形" },
  hidden:    { bg: "rgba(107,114,128,0.10)", color: "#6B7280", label: "隐藏" },
  heartbeat: { bg: "rgba(239,68,68,0.10)",  color: "#EF4444", label: "心跳" },
};
const NARRATIVE_COLORS: Record<string, { bg: string; color: string }> = {
  first_person:  { bg: "rgba(59,130,246,0.12)",  color: "#2563EB" },
  third_person:  { bg: "rgba(16,185,129,0.12)",  color: "#059669" },
  over_shoulder: { bg: "rgba(245,158,11,0.12)",  color: "#D97706" },
};

// ── Reusable sub-components ────────────────────────────────────────────────────
function StatRow({ items }: { items: { value: number | string; label: string; danger?: boolean }[] }) {
  return (
    <div style={{ display: "flex", gap: 12 }}>
      {items.map((it, i) => (
        <div key={i} style={{ ...statBox, ...(it.danger ? { background: "rgba(239,68,68,0.08)" } : {}) }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: it.danger ? S.error : S.primary }}>
            {it.value}
          </div>
          <div style={{ fontSize: 11, color: S.text3, marginTop: 2 }}>{it.label}</div>
        </div>
      ))}
    </div>
  );
}

function SectionHeader({ title, desc }: { title: string; desc: string }) {
  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: S.text, margin: 0 }}>{title}</h2>
      <p style={{ fontSize: 13, color: S.text3, margin: "4px 0 0" }}>{desc}</p>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// Main Component
// ════════════════════════════════════════════════════════════════════════════════
export default function DetroitFeaturesScreen() {
  const [activeTab, setActiveTab] = useState<TabId>("pov");
  const povConfigs = useNarrativeStore((s) => s.povConfigs);
  const timedDecisions = useNarrativeStore((s) => s.timedDecisions);
  const subgraphLocks = useNarrativeStore((s) => s.subgraphLocks);
  const chapterVariants = useNarrativeStore((s) => s.chapterVariants);

  const counts: Record<string, number> = {
    pov: povConfigs.length, timed: timedDecisions.length,
    lock: subgraphLocks.length, variant: chapterVariants.length,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: S.bg }}>
      {/* ── Tab Bar ─────────────────────────────────────────────────── */}
      <div style={{
        flexShrink: 0, display: "flex", gap: 4, padding: "12px 24px 0",
        overflowX: "auto", borderBottom: `1px solid ${S.border}`, background: S.card,
      }}>
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          const count = counts[tab.id];
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              display: "flex", alignItems: "center", gap: 6, padding: "10px 16px", border: "none",
              borderBottom: `2px solid ${active ? S.primary : "transparent"}`,
              background: active ? S.primary10 : "transparent", borderRadius: "8px 8px 0 0",
              cursor: "pointer", whiteSpace: "nowrap", fontSize: 13,
              fontWeight: active ? 700 : 500, color: active ? S.primary : S.text2,
            }}>
              <Icon size={15} />
              {tab.label}
              {count !== undefined && count > 0 && (
                <span style={{
                  fontSize: 10, fontWeight: 700, background: active ? S.primary : S.border,
                  color: active ? "#FFF" : S.text3, borderRadius: 8, padding: "1px 6px",
                  minWidth: 16, textAlign: "center",
                }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Content ─────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
        <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          {activeTab === "pov" && <POVTab configs={povConfigs} />}
          {activeTab === "timed" && <TimedTab decisions={timedDecisions} />}
          {activeTab === "lock" && <LockTab locks={subgraphLocks} />}
          {activeTab === "relationship" && <RelationshipMeterPanel />}
          {activeTab === "variant" && <VariantTab variants={chapterVariants} />}
          {activeTab === "dialogue" && <DialogueTreeEditor />}
          {activeTab === "investigate" && <InvestigationPanel />}
          {activeTab === "moral" && <MoralCompassPanel />}
        </motion.div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// Tab 1: POV 视角系统
// ════════════════════════════════════════════════════════════════════════════════
function POVTab({ configs }: { configs: POVConfig[] }) {
  const uniqueChars = new Set(configs.map((c) => c.characterId));
  const uniqueChapters = new Set(configs.map((c) => c.chapterId));

  return (
    <div style={sectionGap}>
      <SectionHeader title="POV 视角系统" desc="管理多主角视角切换，支持第一人称/第三人称/过肩视角" />
      <StatRow items={[
        { value: configs.length, label: "视角配置" },
        { value: uniqueChars.size, label: "主角数量" },
        { value: uniqueChapters.size, label: "覆盖章节" },
      ]} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
        {configs.map((cfg) => {
          const ns = NARRATIVE_COLORS[cfg.narrativeStyle] ?? { bg: S.bg, color: S.text3 };
          const cc = CHAR_COLORS[cfg.characterId] ?? S.text3;
          return (
            <div key={cfg.id} style={cardBase}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: cc, flexShrink: 0 }} />
                <span style={{ fontSize: 15, fontWeight: 700, color: S.text }}>{cfg.characterName}</span>
                <span style={{ fontSize: 11, color: S.text3 }}>{cfg.chapterId.toUpperCase()}</span>
                <div style={{ marginLeft: "auto" }}>
                  <span style={{ ...badgeBase, background: ns.bg, color: ns.color }}>{cfg.narrativeStyleLabel}</span>
                </div>
              </div>
              {cfg.switchAfterEvent !== undefined && (
                <div style={{ fontSize: 11, color: S.text3, marginBottom: 8 }}>
                  在第 {cfg.switchAfterEvent} 个事件后切换视角
                </div>
              )}
              {cfg.innerMonologue && (
                <div style={{
                  fontSize: 12, color: S.text2, lineHeight: 1.6, fontStyle: "italic",
                  background: S.bg, borderRadius: 8, padding: "10px 14px", borderLeft: `3px solid ${cc}`,
                }}>
                  &ldquo;{cfg.innerMonologue}&rdquo;
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// Tab 2: 限时选择
// ════════════════════════════════════════════════════════════════════════════════
function TimedTab({ decisions }: { decisions: TimedDecisionConfig[] }) {
  const avgTime = decisions.length
    ? Math.round(decisions.reduce((sum, d) => sum + d.timeLimit, 0) / decisions.length) : 0;

  return (
    <div style={sectionGap}>
      <SectionHeader title="限时选择" desc="设计限时决策点——沉默也是一种选择" />
      <StatRow items={[
        { value: decisions.length, label: "限时决策点" },
        { value: `${avgTime}s`, label: "平均时限" },
      ]} />
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {decisions.map((d) => {
          const ds = DISPLAY_STYLES[d.displayStyle] ?? DISPLAY_STYLES.bar;
          const timerColor = d.timeLimit <= 5 ? S.error : d.timeLimit <= 10 ? S.warning : S.primary;
          return (
            <div key={d.interactionPointId} style={cardBase}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <Timer size={16} color={S.primary} />
                <span style={{ fontSize: 14, fontWeight: 700, color: S.text }}>
                  {d.interactionPointId.toUpperCase()}
                </span>
                <span style={{ ...badgeBase, background: ds.bg, color: ds.color }}>{ds.label}</span>
                <span style={{ marginLeft: "auto", fontSize: 20, fontWeight: 800, color: timerColor, fontVariantNumeric: "tabular-nums" }}>
                  {d.timeLimit}s
                </span>
              </div>
              {/* Animated timer preview */}
              <div style={{ height: 4, borderRadius: 2, background: S.bg, marginBottom: 12, overflow: "hidden" }}>
                <motion.div style={{ height: "100%", borderRadius: 2, background: d.timeLimit <= 5 ? S.error : S.primary }}
                  initial={{ width: "100%" }} animate={{ width: "0%" }}
                  transition={{ duration: d.timeLimit, ease: "linear", repeat: Infinity }} />
              </div>
              {d.silenceMeaning && (
                <div style={{ fontSize: 12, color: S.text2, marginBottom: 8, display: "flex", gap: 6, alignItems: "flex-start" }}>
                  <Clock size={13} style={{ flexShrink: 0, marginTop: 1 }} color={S.text3} />
                  <span><strong style={{ color: S.text }}>沉默意义：</strong>{d.silenceMeaning}</span>
                </div>
              )}
              <div style={{
                fontSize: 12, color: S.text2, background: "rgba(239,68,68,0.06)",
                borderRadius: 8, padding: "8px 12px", lineHeight: 1.6,
              }}>
                <AlertTriangle size={12} style={{ marginRight: 6, verticalAlign: "middle" }} color={S.error} />
                {d.timeoutConsequence}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// Tab 3: 子图锁死
// ════════════════════════════════════════════════════════════════════════════════
function LockTab({ locks }: { locks: SubgraphLock[] }) {
  const irreversible = locks.filter((l) => !l.reversible).length;
  const linkedChars = new Set(locks.filter((l) => l.linkedCharacterId).map((l) => l.linkedCharacterId!));

  return (
    <div style={sectionGap}>
      <SectionHeader title="子图锁死" desc="角色死亡/条件触发时锁死整个故事子图" />
      <StatRow items={[
        { value: locks.length, label: "锁死规则" },
        { value: irreversible, label: "不可逆锁", danger: true },
        { value: linkedChars.size, label: "关联角色" },
      ]} />
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {locks.map((lock) => {
          const ts = TRIGGER_STYLES[lock.triggerType] ?? TRIGGER_STYLES.custom;
          const cc = lock.linkedCharacterId ? CHAR_COLORS[lock.linkedCharacterId] ?? S.text3 : undefined;
          return (
            <div key={lock.id} style={{ ...cardBase, borderLeft: `4px solid ${lock.lockColor}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <Lock size={15} color={lock.lockColor} />
                <span style={{ fontSize: 14, fontWeight: 700, color: S.text }}>{lock.id.toUpperCase()}</span>
                <span style={{ ...badgeBase, background: ts.bg, color: ts.color }}>{ts.label}</span>
                <span style={{
                  ...badgeBase,
                  background: lock.reversible ? "rgba(16,185,129,0.10)" : "rgba(239,68,68,0.10)",
                  color: lock.reversible ? S.success : S.error,
                }}>
                  {lock.reversible ? "可逆" : "不可逆"}
                </span>
              </div>
              <div style={{ fontSize: 13, color: S.text2, lineHeight: 1.6, marginBottom: 10 }}>
                {lock.triggerDescription}
              </div>
              <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <XCircle size={14} color={S.error} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: S.error }}>
                    {lock.lockedNodeIds.length} 个节点被锁死
                  </span>
                </div>
                {lock.linkedCharacterId && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Users size={13} color={cc ?? S.text3} />
                    <span style={{ fontSize: 12, color: S.text2 }}>
                      关联: {lock.linkedCharacterId.replace("char-", "")}
                    </span>
                  </div>
                )}
                {lock.reversible && lock.unlockCondition && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <CheckCircle2 size={13} color={S.success} />
                    <span style={{ fontSize: 12, color: S.success }}>存在解锁条件</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// Tab 5: 章节变体
// ════════════════════════════════════════════════════════════════════════════════
function VariantTab({ variants }: { variants: ChapterVariant[] }) {
  const chaptersCount = variants.length > 0 ? 1 : 0;

  return (
    <div style={sectionGap}>
      <SectionHeader title="章节变体" desc="同一章节根据前置选择激活不同版本" />
      <StatRow items={[
        { value: variants.length, label: "变体总数" },
        { value: chaptersCount, label: "含变体章节" },
      ]} />
      {variants.length > 0 && (
        <div style={{ fontSize: 12, fontWeight: 700, color: S.primary, textTransform: "uppercase", letterSpacing: 1, marginTop: 4 }}>
          Chapter Variants
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {variants.map((v) => (
          <div key={v.id} style={cardBase}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <GitBranch size={15} color={S.primary} />
              <span style={{ fontSize: 15, fontWeight: 700, color: S.text }}>{v.name}</span>
            </div>
            {/* Activation condition */}
            <div style={{ fontSize: 12, color: S.text2, lineHeight: 1.6, marginBottom: 10 }}>
              <Shield size={12} style={{ marginRight: 6, verticalAlign: "middle" }} color={S.text3} />
              <strong style={{ color: S.text }}>激活条件：</strong>{v.activationDescription}
            </div>
            {/* Meta row */}
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Brain size={13} color={S.primary} />
                <span style={{ fontSize: 12, color: S.text2 }}>{v.events.length} 个事件</span>
              </div>
              {v.visualTone && (
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Eye size={13} color={S.text3} />
                  <span style={{ fontSize: 12, color: S.text2 }}>{v.visualTone}</span>
                </div>
              )}
            </div>
            {/* Emotion arc */}
            <div style={{
              fontSize: 12, color: S.text2, background: S.bg, borderRadius: 8, padding: "8px 12px", lineHeight: 1.6,
            }}>
              <ChevronRight size={12} style={{ marginRight: 4, verticalAlign: "middle" }} color={S.primary} />
              <strong style={{ color: S.text }}>情绪弧线：</strong>{v.emotionArc}
            </div>
            {/* Theme question */}
            {v.themeQuestion && (
              <div style={{
                fontSize: 12, color: S.text2, fontStyle: "italic", marginTop: 8,
                padding: "6px 12px", borderLeft: `3px solid ${S.primary}`,
              }}>
                &ldquo;{v.themeQuestion}&rdquo;
              </div>
            )}
            {/* Event list */}
            {v.events.length > 0 && (
              <div style={{ marginTop: 10 }}>
                {v.events.map((evt, idx) => (
                  <div key={evt.id} style={{
                    display: "flex", gap: 8, alignItems: "flex-start", fontSize: 12, color: S.text2, padding: "4px 0",
                  }}>
                    <span style={{
                      flexShrink: 0, width: 20, height: 20, borderRadius: "50%", background: S.primary10,
                      color: S.primary, fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {idx + 1}
                    </span>
                    <div>
                      <strong style={{ color: S.text }}>{evt.title}</strong>
                      <span style={{ marginLeft: 6 }}>{evt.description}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
