"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Fingerprint, FileText, Lightbulb, Brain, CheckCircle2, XCircle, AlertCircle, Link2, Monitor, Eye, HelpCircle, Clock, Star, ChevronDown } from "lucide-react";
import { useNarrativeStore } from "@/store";
import type { Evidence, Clue, Deduction } from "@/lib/studio-data";

const S = {
  card: "#FFFFFF", bg: "#F5F6FA", border: "#E2E5F0", primary: "#5E50E8",
  primary10: "rgba(94,80,232,0.10)", text: "#1A1D2E", text2: "#4A5068", text3: "#8892B0",
  success: "#10B981", error: "#EF4444", warning: "#F59E0B", accent: "#F97316",
};

type TabKey = "evidence" | "clues" | "deductions";
const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: "evidence", label: "证据库", icon: <Search size={15} /> },
  { key: "clues", label: "线索链", icon: <Link2 size={15} /> },
  { key: "deductions", label: "推理板", icon: <Brain size={15} /> },
];

const EV_META: Record<Evidence["type"], { icon: React.ReactNode; color: string }> = {
  physical: { icon: <Fingerprint size={16} />, color: "#3B82F6" },
  testimonial: { icon: <Eye size={16} />, color: "#10B981" },
  documentary: { icon: <FileText size={16} />, color: "#F59E0B" },
  digital: { icon: <Monitor size={16} />, color: "#8B5CF6" },
  circumstantial: { icon: <HelpCircle size={16} />, color: "#F97316" },
};

const RESULT_BADGE: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  correct: { icon: <CheckCircle2 size={14} />, color: S.success, label: "正确" },
  partial: { icon: <AlertCircle size={14} />, color: S.warning, label: "部分正确" },
  wrong: { icon: <XCircle size={14} />, color: S.error, label: "错误" },
  inconclusive: { icon: <HelpCircle size={14} />, color: S.text3, label: "无结论" },
};

function Stars({ count }: { count: number }) {
  return (
    <span style={{ display: "inline-flex", gap: 1 }}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} size={11} fill={i < count ? S.warning : "none"} stroke={i < count ? S.warning : S.border} />
      ))}
    </span>
  );
}

function Tag({ text, color }: { text: string; color: string }) {
  return (
    <span style={{ display: "inline-block", fontSize: 10, color, background: color + "14", padding: "1px 7px", borderRadius: 8, border: `1px solid ${color}30`, whiteSpace: "nowrap", maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis" }}>
      {text}
    </span>
  );
}

const collapse = { initial: { height: 0, opacity: 0 }, animate: { height: "auto" as const, opacity: 1 }, exit: { height: 0, opacity: 0 }, transition: { duration: 0.22 } };
const fade = { initial: { opacity: 0, y: 6 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -6 }, transition: { duration: 0.2 } };

// ═══════════════════════════════════════════════════════════════
export function InvestigationPanel() {
  const [tab, setTab] = useState<TabKey>("evidence");
  const evidence = useNarrativeStore((s) => s.evidence);
  const clues = useNarrativeStore((s) => s.clues);
  const deductions = useNarrativeStore((s) => s.deductions);

  return (
    <div style={{ background: S.bg, minHeight: "100%", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ display: "flex", borderBottom: `1px solid ${S.border}`, background: S.card, position: "sticky", top: 0, zIndex: 10 }}>
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <button key={t.key} onClick={() => setTab(t.key)} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "12px 0", border: "none", background: "transparent", cursor: "pointer", color: active ? S.primary : S.text3, fontWeight: active ? 600 : 400, fontSize: 13, position: "relative", transition: "color 0.2s" }}>
              {t.icon}{t.label}
              {active && <motion.div layoutId="inv-tab" style={{ position: "absolute", bottom: -1, left: "15%", right: "15%", height: 2, borderRadius: 1, background: S.primary }} transition={{ type: "spring", stiffness: 400, damping: 30 }} />}
            </button>
          );
        })}
      </div>
      <div style={{ padding: 16 }}>
        <AnimatePresence mode="wait">
          {tab === "evidence" && <motion.div key="ev" {...fade}><EvidenceBoard evidence={evidence} /></motion.div>}
          {tab === "clues" && <motion.div key="cl" {...fade}><ClueChain clues={clues} evidence={evidence} /></motion.div>}
          {tab === "deductions" && <motion.div key="dd" {...fade}><DeductionBoard deductions={deductions} clues={clues} /></motion.div>}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Tab 1: Evidence Board (证据库)
// ═══════════════════════════════════════════════════════════════
function EvidenceBoard({ evidence }: { evidence: Evidence[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
      {evidence.map((ev) => {
        const m = EV_META[ev.type], open = expandedId === ev.id, found = ev.discovered;
        return (
          <motion.div key={ev.id} layout onClick={() => found && setExpandedId(open ? null : ev.id)}
            style={{ background: S.card, borderRadius: 10, border: `1px solid ${S.border}`, borderLeft: `3px solid ${found ? m.color : S.border}`, padding: 14, cursor: found ? "pointer" : "default", opacity: found ? 1 : 0.5, overflow: "hidden", boxShadow: open ? `0 2px 12px ${m.color}22` : "none", transition: "box-shadow 0.2s" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{ width: 28, height: 28, borderRadius: 6, background: found ? `${m.color}18` : S.bg, display: "flex", alignItems: "center", justifyContent: "center", color: found ? m.color : S.text3, flexShrink: 0 }}>
                {found ? m.icon : <HelpCircle size={16} />}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: found ? S.text : S.text3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {found ? ev.name : "???"}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                  <span style={{ fontSize: 10, color: S.text3 }}>{ev.typeLabel}</span>
                  <Stars count={ev.importance} />
                </div>
              </div>
              {found && <ChevronDown size={14} color={S.text3} style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s", flexShrink: 0 }} />}
            </div>
            <AnimatePresence>
              {open && found && (
                <motion.div {...collapse} style={{ overflow: "hidden" }}>
                  <p style={{ fontSize: 12, color: S.text2, lineHeight: 1.6, margin: "8px 0 0" }}>{ev.description}</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 8 }}>
                    {ev.relatedCharacterIds?.map((c) => <Tag key={c} text={c} color={S.primary} />)}
                    {ev.relatedSceneIds?.map((s) => <Tag key={s} text={s} color={S.accent} />)}
                  </div>
                  {ev.discoveryNarrative && (
                    <div style={{ marginTop: 10, padding: 10, background: S.bg, borderRadius: 6, fontSize: 11, color: S.text2, lineHeight: 1.65, fontStyle: "italic", borderLeft: `2px solid ${m.color}` }}>
                      {ev.discoveryNarrative}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Tab 2: Clue Chain (线索链)
// ═══════════════════════════════════════════════════════════════
function ClueChain({ clues, evidence }: { clues: Clue[]; evidence: Evidence[] }) {
  const evMap = new Map(evidence.map((e) => [e.id, e]));
  const discIds = new Set(evidence.filter((e) => e.discovered).map((e) => e.id));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {clues.map((clue) => {
        const active = clue.activated || clue.requiredEvidenceIds.every((id) => discIds.has(id));
        const foundN = clue.requiredEvidenceIds.filter((id) => discIds.has(id)).length;
        return (
          <div key={clue.id} style={{ background: S.card, borderRadius: 10, border: `1px solid ${active ? S.success + "55" : S.border}`, padding: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <Lightbulb size={16} color={active ? S.success : S.text3} fill={active ? S.success + "30" : "none"} />
              <span style={{ fontSize: 14, fontWeight: 600, color: active ? S.text : S.text3 }}>{clue.name}</span>
              <span style={{ marginLeft: "auto", fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 10, background: active ? S.success + "18" : S.bg, color: active ? S.success : S.text3 }}>
                {foundN}/{clue.requiredEvidenceIds.length}
              </span>
            </div>
            <p style={{ fontSize: 12, color: S.text2, lineHeight: 1.6, margin: "0 0 12px" }}>{clue.description}</p>
            {/* Evidence chain circles connected by lines */}
            <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap" }}>
              {clue.requiredEvidenceIds.map((eid, idx) => {
                const ev = evMap.get(eid), found = discIds.has(eid), em = ev ? EV_META[ev.type] : null;
                return (
                  <span key={eid} style={{ display: "flex", alignItems: "center" }}>
                    <div title={found ? ev?.name : "未发现"} style={{ width: 30, height: 30, borderRadius: "50%", border: `2px solid ${found ? em?.color ?? S.success : S.border}`, background: found ? (em?.color ?? S.primary) + "18" : S.bg, display: "flex", alignItems: "center", justifyContent: "center", color: found ? em?.color ?? S.success : S.text3, transition: "all 0.3s" }}>
                      {found ? em?.icon ?? <CheckCircle2 size={12} /> : <span style={{ fontSize: 10, fontWeight: 700 }}>?</span>}
                    </div>
                    {idx < clue.requiredEvidenceIds.length - 1 && (
                      <div style={{ width: 20, height: 2, background: found && discIds.has(clue.requiredEvidenceIds[idx + 1]) ? S.success : S.border, transition: "background 0.3s" }} />
                    )}
                  </span>
                );
              })}
            </div>
            <AnimatePresence>
              {active && clue.revelationText && (
                <motion.div {...collapse} style={{ overflow: "hidden" }}>
                  <div style={{ marginTop: 12, padding: 10, background: `${S.success}08`, borderRadius: 6, fontSize: 11, color: S.text2, lineHeight: 1.65, fontStyle: "italic", borderLeft: `2px solid ${S.success}` }}>
                    {clue.revelationText}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Tab 3: Deduction Board (推理板)
// ═══════════════════════════════════════════════════════════════
function DeductionBoard({ deductions, clues }: { deductions: Deduction[]; clues: Clue[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const clueMap = new Map(clues.map((c) => [c.id, c]));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {deductions.map((ded) => {
        const open = expandedId === ded.id, badge = ded.result ? RESULT_BADGE[ded.result] : null;
        return (
          <div key={ded.id} style={{ background: S.card, borderRadius: 10, border: `1px solid ${S.border}`, overflow: "hidden" }}>
            <div onClick={() => setExpandedId(open ? null : ded.id)} style={{ padding: 14, cursor: "pointer", display: "flex", alignItems: "flex-start", gap: 10 }}>
              <Brain size={18} color={S.primary} style={{ marginTop: 1, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: S.text }}>{ded.question}</span>
                  {badge && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 10, background: badge.color + "18", color: badge.color }}>
                      {badge.icon}{badge.label}
                    </span>
                  )}
                </div>
                <p style={{ fontSize: 12, color: S.text3, margin: "4px 0 0", lineHeight: 1.5 }}>{ded.description}</p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                {ded.timeLimit > 0 && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 10, color: S.warning, background: S.warning + "15", padding: "2px 7px", borderRadius: 8 }}>
                    <Clock size={10} />{ded.timeLimit}s
                  </span>
                )}
                <ChevronDown size={14} color={S.text3} style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
              </div>
            </div>
            <AnimatePresence>
              {open && (
                <motion.div {...collapse} style={{ overflow: "hidden" }}>
                  <div style={{ padding: "0 14px 14px" }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: S.text3, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>可选结论</div>
                    {ded.conclusions.map((conc) => {
                      const showRes = !!ded.result, correct = showRes && conc.isCorrect, wrong = showRes && !conc.isCorrect;
                      const bColor = correct ? S.success : wrong ? S.error : S.border;
                      return (
                        <div key={conc.id} style={{ display: "flex", gap: 10, padding: 10, marginBottom: 8, background: S.bg, borderRadius: 8, border: `1px solid ${correct ? S.success + "55" : wrong ? S.error + "33" : S.border}` }}>
                          <div style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${bColor}`, background: correct ? S.success + "25" : wrong ? S.error + "15" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                            {correct && <CheckCircle2 size={10} color={S.success} />}
                            {wrong && <XCircle size={10} color={S.error} />}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 12, color: S.text, lineHeight: 1.55 }}>{conc.text}</div>
                            {conc.requiredClueIds.length > 0 && (
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
                                {conc.requiredClueIds.map((cid) => {
                                  const cl = clueMap.get(cid);
                                  return <Tag key={cid} text={cl?.name ?? cid} color={cl?.activated ? S.success : S.text3} />;
                                })}
                              </div>
                            )}
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: showRes ? 1 : 0.4 }} transition={{ duration: 0.4 }} style={{ marginTop: 8, fontSize: 11, color: S.text2, lineHeight: 1.6, fontStyle: "italic" }}>
                              {conc.narrativeConsequence}
                            </motion.div>
                          </div>
                        </div>
                      );
                    })}
                    {ded.failureConsequence && (
                      <div style={{ marginTop: 4, padding: 10, background: S.error + "08", borderRadius: 6, fontSize: 11, color: S.text2, lineHeight: 1.6, borderLeft: `2px solid ${S.error}` }}>
                        <span style={{ fontWeight: 600, color: S.error }}>失败后果：</span> {ded.failureConsequence}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
