"use client";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, AlertTriangle, ChevronRight,
  GitBranch, User, MapPin, Clock, BookOpen, Zap,
  Trophy,
  Layers, Play,
  ExternalLink, BarChart3, Sparkles,
  Package, Rocket, Shield, Heart
} from "lucide-react";
import Link from "next/link";
import { INDUSTRY_LABELS, INDUSTRY_QC_RULES, type IndustryType } from "@/lib/studio-data";
import { useNarrativeStore, useUIStore, useSettingsStore, useProjectStore, useAnalyticsStore } from "@/store";
import { usePathname } from "next/navigation";
import { UpstreamReadiness } from "@/components/ui/UpstreamReadiness";

const S = {
  bg: "#FAFBFF", card: "#FFFFFF", s2: "#F4F6FC", s3: "#EDF0F8",
  border: "#E2E5F0", border2: "#CBD0E5",
  primary: "#5E50E8", primary10: "rgba(94,80,232,0.10)", primary20: "rgba(94,80,232,0.20)",
  accent: "#00A99D", accent10: "rgba(0,169,157,0.10)",
  text: "#1A1D2E", text2: "#4A5068", text3: "#8892B0",
  success: "#059669", success10: "rgba(5,150,105,0.10)",
  warning: "#D97706", warning10: "rgba(217,119,6,0.10)",
  error: "#DC2626", error10: "rgba(220,38,38,0.10)",
};



// ── 项目健康度 ────────────────────────────────────────────────────────────
const QC_CATEGORIES = [
  { key: "structure", label: "结构完整性", icon: Layers },
  { key: "narrative", label: "叙事质量", icon: BookOpen },
  { key: "assets", label: "资产完整性", icon: Package },
  { key: "publish", label: "发布风险", icon: Rocket },
];



// ── 行业切换配置 ────────────────────────────────────────────────────────────
const INDUSTRY_OPTIONS: { type: IndustryType; icon: string; label: string }[] = [
  { type: 'game', icon: '🎮', label: '游戏' },
  { type: 'tourism', icon: '🏛️', label: '文旅' },
  { type: 'education', icon: '🎓', label: '教育' },
  { type: 'derivative', icon: '🎬', label: '衍生' },
];

// ── 素材风格一致性 — 动态从 store 计算（P12-#22）──────────────────────────


// ── 主页面 ────────────────────────────────────────────────────────────────
export default function OverviewScreen() {
  const pathname = usePathname();
  const [activeSubTab, setActiveSubTab] = useState<Record<number, number>>({ 0: 0, 1: 0, 2: 0, 3: 0 });

  const [activeTab, setActiveTab] = useState(0);
  const industry = useUIStore(s => s.industry);
  const setIndustry = useUIStore(s => s.setIndustry);

  // ── Store selectors ───────────────────────────────────────────────────
  const storyNodes = useNarrativeStore(s => s.storyNodes);
  const nodeEdges = useNarrativeStore(s => s.nodeEdges);
  const characters = useNarrativeStore(s => s.characters);
  const branchPaths = useNarrativeStore(s => s.branchPaths);
  const qualityChecks = useNarrativeStore(s => s.qualityChecks);
  const scenes = useNarrativeStore(s => s.scenes);
  const props = useNarrativeStore(s => s.props);
  const variables = useNarrativeStore(s => s.variables);
  const assetCards = useNarrativeStore(s => s.assetCards);
  const chapterPlans = useNarrativeStore(s => s.chapterPlans);
  const narrativeIntents = useNarrativeStore(s => s.narrativeIntents);
  const projectName = useProjectStore(s => s.currentProject()?.title) || "当前项目";

  // ── Analytics Store selectors (avoid method-style selectors — they cause infinite re-renders) ──
  const analyticsSessions = useAnalyticsStore(s => s.sessions);
  const choiceDistributions = useAnalyticsStore(s => s.choiceDistributions);
  const funnels = useAnalyticsStore(s => s.funnels);

  // Compute analytics metrics locally from raw state (prevents infinite re-render loop)
  const completionRate = useMemo(() => {
    if (analyticsSessions.length === 0) return 0;
    const completed = analyticsSessions.filter(s => !s.abandoned).length;
    return completed / analyticsSessions.length;
  }, [analyticsSessions]);

  const avgDuration = useMemo(() => {
    if (analyticsSessions.length === 0) return 0;
    return analyticsSessions.reduce((sum, s) => sum + s.duration, 0) / analyticsSessions.length;
  }, [analyticsSessions]);

  const topEnding = useMemo(() => {
    if (analyticsSessions.length === 0) return null;
    const endingCounts = new Map<string, number>();
    analyticsSessions.forEach(s => {
      if (s.endingReached) endingCounts.set(s.endingReached, (endingCounts.get(s.endingReached) ?? 0) + 1);
    });
    if (endingCounts.size === 0) return null;
    const [id, count] = [...endingCounts.entries()].sort((a, b) => b[1] - a[1])[0];
    return { id, name: id, count };
  }, [analyticsSessions]);

  // ── P12-#22: Dynamic STATS from store ──────────────────────────────────
  const stats = useMemo(() => {
    const endingCount = storyNodes.filter(n => n.type === 'ending_good' || n.type === 'ending_bad').length;
    const durationMin = Math.max(1, Math.round(storyNodes.length * 1.5));
    return [
      { key: "chapter", value: 1, icon: BookOpen, color: S.primary },
      { key: "node", value: storyNodes.length, icon: Layers, color: S.primary },
      { key: "edge", value: nodeEdges.length, icon: GitBranch, color: S.warning },
      { key: "ending", value: endingCount, icon: Trophy, color: S.accent },
      { key: "character", value: characters.length, icon: User, color: S.primary },
      { key: "scene", value: scenes.length, icon: MapPin, color: S.accent },
      { key: "prop", value: props.length, icon: Zap, color: S.warning },
      { key: "_duration", value: `${durationMin}min`, icon: Clock, color: S.text3 },
    ];
  }, [storyNodes, nodeEdges, characters, scenes, props]);

  // ── P12-#22: Dynamic NARRATIVE_SCORES from store ───────────────────────
  const narrativeScores = useMemo(() => {
    const choiceNodes = storyNodes.filter(n => n.type === 'choice');
    const conditionNodes = storyNodes.filter(n => n.type === 'condition');
    const qteNodes = storyNodes.filter(n => n.type === 'qte');
    const endingNodes = storyNodes.filter(n => n.type === 'ending_good' || n.type === 'ending_bad');
    const goodEndings = endingNodes.filter(n => n.type === 'ending_good').length;

    // 选择意义度
    const choiceScore = Math.min(100, choiceNodes.length * 30 + 25);
    // 分支平衡性
    const pathLengths = branchPaths.map(p => p.nodes.length);
    const avgLen = pathLengths.length > 0 ? pathLengths.reduce((a, b) => a + b, 0) / pathLengths.length : 0;
    const maxDev = pathLengths.length > 0 ? Math.max(...pathLengths.map(l => Math.abs(l - avgLen))) : 0;
    const balanceScore = Math.max(0, Math.round(100 - maxDev * 10));
    // 变量使用率
    const usedVarCount = variables.filter(v =>
      nodeEdges.some(e => e.condition && JSON.stringify(e.condition).includes(v.id))
    ).length;
    const varScore = variables.length > 0 ? Math.round((usedVarCount / variables.length) * 100) : 0;
    // 失败反馈完整度
    const feedbackNodes = [...conditionNodes, ...qteNodes];
    const errNodes = feedbackNodes.filter(n => (n as any).hasError);
    const feedbackScore = feedbackNodes.length > 0 ? Math.round(((feedbackNodes.length - errNodes.length) / feedbackNodes.length) * 100) : 100;

    // 情绪节奏 — dynamically computed from narrativeIntents emotion values
    const emotionValues = narrativeIntents.map(ni => ni.emotionValue ?? 0).filter(v => v > 0);
    let emotionScore = 78; // fallback
    let emotionAvg = 0;
    let emotionStdDev = 0;
    if (emotionValues.length >= 3) {
      // Check variance: good pacing has a mix of low and high tension
      emotionAvg = emotionValues.reduce((a, b) => a + b, 0) / emotionValues.length;
      const variance = emotionValues.reduce((s, v) => s + (v - emotionAvg) ** 2, 0) / emotionValues.length;
      emotionStdDev = Math.sqrt(variance);
      // Ideal: stdDev between 2-4 (good variance), penalize monotone or extreme variance
      if (emotionStdDev >= 1.5 && emotionStdDev <= 4.5) {
        emotionScore = Math.min(100, Math.round(60 + emotionStdDev * 10));
      } else if (emotionStdDev < 1.5) {
        emotionScore = Math.round(40 + emotionStdDev * 20); // too flat
      } else {
        emotionScore = Math.round(60 + Math.max(0, 5 - (emotionStdDev - 4.5)) * 8); // too spiky
      }
      // Bonus for having both low and high tension nodes
      const hasLow = emotionValues.some(v => v <= 3);
      const hasHigh = emotionValues.some(v => v >= 7);
      if (hasLow && hasHigh) emotionScore = Math.min(100, emotionScore + 10);
    }

    // 伏笔回收率 — dynamically computed from narrativeStates + consequenceChains
    const consequenceChains = useNarrativeStore.getState().consequenceChains;
    const narrativeStates = useNarrativeStore.getState().narrativeStates;
    let foreshadowScore = 80; // fallback
    if (narrativeStates.length > 0) {
      // A "planted" state is one that is modified at some node and read at a different node
      const plantedStates = narrativeStates.filter(ns =>
        ns.modifiedAt.length > 0 && ns.readAt.length > 0
      );
      // A "resolved" state is one whose readAt includes nodes near endings or has affectsEndings
      const resolvedStates = plantedStates.filter(ns =>
        (ns.affectsEndings && ns.affectsEndings.length > 0) ||
        ns.readAt.some(nodeId => storyNodes.find(n => n.id === nodeId && (n.type === 'ending_good' || n.type === 'ending_bad')))
      );
      if (plantedStates.length > 0) {
        foreshadowScore = Math.round(
          Math.min(100, (resolvedStates.length / plantedStates.length) * 100 + 10)
        );
      }
    }

    return [
      {
        dimension: '选择意义度', score: choiceScore, maxScore: 100,
        detail: `${choiceNodes.length} 个选择节点，每个选择导致不同的路径和结局`,
        strengths: choiceNodes.map(n => `${n.id} ${n.label}影响后续路径`),
        improvements: choiceNodes.length < 3 ? ['建议增加更多有意义的选择点'] : [],
      },
      {
        dimension: '分支平衡性', score: balanceScore, maxScore: 100,
        detail: `${branchPaths.length} 条路径，长度分别为 ${pathLengths.join(' / ')} 节点`,
        strengths: ['路径设计各有独特体验'],
        improvements: endingNodes.length > 0 && goodEndings / endingNodes.length > 0.7 ? ['好结局概率偏高，建议调整平衡'] : [],
      },
      {
        dimension: '变量使用率', score: varScore, maxScore: 100,
        detail: `${variables.length} 个变量中 ${usedVarCount} 个被使用`,
        strengths: varScore === 100 ? ['所有变量均被引用'] : [],
        improvements: varScore < 100 ? ['存在未使用的变量'] : [],
      },
      {
        dimension: '失败反馈完整度', score: feedbackScore, maxScore: 100,
        detail: `${feedbackNodes.length} 个条件/QTE 节点中 ${feedbackNodes.length - errNodes.length} 个有完整反馈`,
        strengths: feedbackScore >= 80 ? ['失败反馈较完整'] : [],
        improvements: feedbackScore < 100 ? errNodes.map(n => `${n.id} 缺少失败反馈文案`) : [],
      },
      {
        dimension: '情绪节奏', score: emotionScore, maxScore: 100,
        detail: emotionValues.length > 0
          ? `${emotionValues.length} 个节点有情感标记，均值 ${emotionAvg.toFixed(1)}，标准差 ${emotionStdDev.toFixed(1)}`
          : '情感数据不足，使用默认评分',
        strengths: emotionScore >= 75 ? ['情绪曲线有合理的起伏变化'] : [],
        improvements: emotionScore < 75 ? ['建议在高张力场景间增加缓冲节点'] : [],
      },
      {
        dimension: '伏笔回收率', score: foreshadowScore, maxScore: 100,
        detail: narrativeStates.length > 0
          ? `${narrativeStates.length} 个叙事状态中已追踪回收情况`
          : '叙事状态数据不足，使用默认评分',
        strengths: foreshadowScore >= 80 ? ['核心伏笔已在结局中回收'] : [],
        improvements: foreshadowScore < 80 ? ['部分支线伏笔尚未在结局中收束'] : [],
      },
    ];
  }, [storyNodes, nodeEdges, branchPaths, variables, narrativeIntents]);

  const totalScore = useMemo(() =>
    Math.round(narrativeScores.reduce((s, n) => s + n.score, 0) / narrativeScores.length),
    [narrativeScores]
  );

  // ── P12-#22: Dynamic STYLE_CONSISTENCY from store ──────────────────────
  const styleConsistency = useMemo(() => {
    if (assetCards.length > 0) {
      return assetCards.map(card => ({
        nodeId: card.nodeId,
        assetType: card.hasImage ? '场景图片' : card.hasBgm ? 'BGM' : card.hasVoice ? '配音' : '资产',
        style: '赛博朋克',
        consistent: card.hasImage,
        warning: !card.hasImage ? '缺少图片资产' : !card.hasBgm ? '缺少 BGM' : undefined,
      }));
    }
    // Fallback: generate from storyNodes (non-ending nodes)
    return storyNodes
      .filter(n => n.type !== 'ending_good' && n.type !== 'ending_bad')
      .map(n => ({
        nodeId: n.id, assetType: '场景图片', style: '赛博朋克', consistent: true, warning: undefined,
      }));
  }, [assetCards, storyNodes]);

  const styleSummary = useMemo(() => {
    const totalAssets = styleConsistency.length;
    const consistentCount = styleConsistency.filter(s => s.consistent).length;
    const inconsistentCount = totalAssets - consistentCount;
    const consistencyRate = totalAssets > 0 ? Math.round((consistentCount / totalAssets) * 100) : 100;
    return { dominant: '赛博朋克', totalAssets, consistentCount, inconsistentCount, consistencyRate };
  }, [styleConsistency]);

  // ── Derived data ────────────────────────────────────────────────────────
  function t(key: string): string {
    const map = INDUSTRY_LABELS[key];
    return map ? map[industry] : key;
  }

  const doneCount = qualityChecks.filter(h => h.status === "ok").length;
  const healthPct = Math.round((doneCount / qualityChecks.length) * 100);

  // ── Empty state check ─────────────────────────────────────────────────────
  if (qualityChecks.length === 0) {
    return (
      <div className="min-h-svh flex items-center justify-center" style={{ background: S.bg }}>
        <div className="text-center max-w-md p-8">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: '#F4F6FC' }}>
            <Shield size={28} style={{ color: '#7C6CF5' }} />
          </div>
          <h3 className="text-base font-bold mb-2" style={{ color: '#1a1a2e' }}>还没有质检结果</h3>
          <p className="text-sm text-gray-500 mb-4">完成更多创作步骤后，质检结果将自动更新</p>
          <Link href="/pipeline" className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-bold text-white" style={{ background: '#7C6CF5' }}>
            前往创作流程 →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-svh overflow-y-auto" style={{ background: S.bg }}>
      <UpstreamReadiness currentPath={pathname} />

      {/* ── 顶部项目信息 ── */}
      <div className="sticky top-0 z-20 px-5 py-3 flex items-center justify-between"
        style={{ background: "rgba(250,251,255,0.92)", backdropFilter: "blur(12px)", borderBottom: `1px solid ${S.border}` }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: `linear-gradient(135deg,${S.primary},${S.accent})` }}>
            <span className="text-white text-xs font-black">幽</span>
          </div>
          <div>
            <h2 className="text-sm font-bold" style={{ color: S.text }}>{projectName}</h2>
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: S.s2, color: S.text3 }}>
                赛博朋克 · 间谍惊悚
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: S.success10, color: S.success }}>
                已发布
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-16 rounded-full overflow-hidden" style={{ background: S.s3 }}>
                <div className="h-full rounded-full" style={{ width: `${Math.round((totalScore + healthPct) / 2)}%`, background: `linear-gradient(to right,${S.primary},${S.accent})` }} />
              </div>
              <span className="text-xs font-mono font-bold" style={{ color: S.primary }}>{Math.round((totalScore + healthPct) / 2)}%</span>
            </div>
            <span className="text-[8px]" style={{ color: S.text3 }}>总完成度</span>
          </div>
          <Link href="/simulator">
            <motion.button whileTap={{ scale: 0.95 }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white focus:outline-none"
              style={{ background: S.primary, boxShadow: `0 2px 8px ${S.primary}30` }}>
              <Play size={11} /> 试玩预览
            </motion.button>
          </Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-5 py-4 space-y-4">

        {/* ── 行业模式切换 ── */}
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-bold" style={{ color: S.text3 }}>行业模式</span>
          <div className="flex items-center gap-2">
            {INDUSTRY_OPTIONS.map(opt => (
              <button
                key={opt.type}
                onClick={() => setIndustry(opt.type)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors focus:outline-none"
                style={{
                  background: industry === opt.type ? S.primary : S.s2,
                  color: industry === opt.type ? '#fff' : S.text2,
                  border: `1px solid ${industry === opt.type ? S.primary : S.border}`,
                  fontSize: '12px',
                }}
              >
                <span>{opt.icon}</span>
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── 标签页切换 ── */}
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { label: "项目概览", icon: BarChart3 },
            { label: "质量检查", icon: Shield },
            { label: "风格一致性", icon: Heart },
            { label: "数据分析", icon: BarChart3 },
          ].map((tab, i) => {
            const TabIcon = tab.icon;
            return (
              <motion.button
                key={i}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab(i)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all focus:outline-none"
                style={{
                  background: activeTab === i ? S.primary : S.s2,
                  color: activeTab === i ? "#fff" : S.text2,
                  border: `1px solid ${activeTab === i ? S.primary : S.border}`,
                  boxShadow: activeTab === i ? `0 2px 8px ${S.primary}30` : "none",
                }}
              >
                <TabIcon size={12} />
                <span>{tab.label}</span>
              </motion.button>
            );
          })}
        </div>

        {/* ═══════════════════ TAB 0: 项目概览 ═══════════════════ */}
        <AnimatePresence mode="wait">
          {activeTab === 0 && (
            <motion.div key="tab-0" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
              {/* Sub-tab bar */}
              <div className="flex items-center gap-1.5 mb-3">
                {["核心数据", "剧本概览"].map((label, i) => (
                  <button key={i}
                    onClick={() => setActiveSubTab(prev => ({ ...prev, 0: i }))}
                    className="px-3 py-1 rounded-lg text-[10px] font-bold transition-colors focus:outline-none"
                    style={{
                      background: activeSubTab[0] === i ? S.primary10 : "transparent",
                      color: activeSubTab[0] === i ? S.primary : S.text3,
                      border: `1px solid ${activeSubTab[0] === i ? S.primary20 : "transparent"}`,
                    }}>
                    {label}
                  </button>
                ))}
              </div>
              <AnimatePresence mode="wait">
                {activeSubTab[0] === 0 && (
                  <motion.div key="sub-0-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                    <div className="rounded-xl p-3" style={{ background: S.card, border: `1px solid ${S.border}` }}>
                      <div className="grid grid-cols-4 gap-2">
                        {stats.map(s => (
                          <div key={s.key} className="p-2 rounded-xl text-center"
                            style={{ background: S.s2, border: `1px solid ${S.border}` }}>
                            <s.icon size={14} style={{ color: s.color, margin: "0 auto 4px" }} />
                            <p className="text-sm font-bold font-mono" style={{ color: S.text }}>{s.value}</p>
                            <p className="text-[8px]" style={{ color: S.text3 }}>{s.key === '_duration' ? '预估时长' : t(s.key)}</p>
                          </div>
                        ))}
                      </div>
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        {[
                          { label: t('parse'), detail: `${t('character')}${characters.length} · ${t('scene')}${scenes.length} · ${t('prop')}${props.length}`, pct: 100, done: true },
                          { label: t('interaction'), detail: `${storyNodes.length}${t('node')} · ${nodeEdges.length}${t('edge')} · ${storyNodes.filter(n => n.type === 'ending_good' || n.type === 'ending_bad').length}${t('ending')}`, pct: 100, done: true },
                          { label: t('asset') + '生成', detail: `图${assetCards.filter(c => c.hasImage).length}/${storyNodes.length} · BGM ${assetCards.filter(c => c.hasBgm).length}/${storyNodes.length} · ${assetCards.filter(c => c.hasVoice).length > 0 ? '配音中' : '配音待补'}`, pct: assetCards.length > 0 ? Math.round(((assetCards.filter(c => c.hasImage).length + assetCards.filter(c => c.hasBgm).length + assetCards.filter(c => c.hasVoice).length) / (assetCards.length * 3)) * 100) : 0, done: false },
                        ].map((s, i) => (
                          <div key={i} className="p-2 rounded-xl" style={{ background: S.s2, border: `1px solid ${s.done ? `${S.success}30` : `${S.primary}20`}` }}>
                            <div className="flex items-center gap-1 mb-1">
                              {s.done
                                ? <CheckCircle2 size={10} style={{ color: S.success }} />
                                : <div className="w-2.5 h-2.5 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: S.primary }} />}
                              <span className="text-[9px] font-bold" style={{ color: s.done ? S.success : S.primary }}>{s.label}</span>
                            </div>
                            <div className="h-1 rounded-full overflow-hidden mb-0.5" style={{ background: S.s3 }}>
                              <div className="h-full rounded-full" style={{ width: `${s.pct}%`, background: s.done ? S.success : S.primary }} />
                            </div>
                            <span className="text-[8px]" style={{ color: S.text3 }}>{s.detail}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
                {activeSubTab[0] === 1 && (
                  <motion.div key="sub-0-1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                    <div className="rounded-xl p-3 space-y-3" style={{ background: S.card, border: `1px solid ${S.border}` }}>
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-wider mb-2" style={{ color: S.text3 }}>故事基础</p>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-bold" style={{ color: S.primary }}>{projectName}</span>
                        </div>
                        <div className="grid grid-cols-5 gap-2">
                          {[
                            { label: "故事节点", value: storyNodes.length, color: S.primary },
                            { label: "连线", value: nodeEdges.length, color: S.warning },
                            { label: "角色", value: characters.length, color: S.accent },
                            { label: "场景", value: scenes.length, color: S.primary },
                            { label: "分支路径", value: branchPaths.length, color: S.accent },
                          ].map((item, i) => (
                            <div key={i} className="p-2 rounded-lg text-center" style={{ background: S.s2, border: `1px solid ${S.border}` }}>
                              <p className="text-sm font-bold font-mono" style={{ color: item.color }}>{item.value}</p>
                              <p className="text-[8px]" style={{ color: S.text3 }}>{item.label}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                      {chapterPlans.length > 0 && (
                        <div>
                          <p className="text-[9px] font-bold uppercase tracking-wider mb-2" style={{ color: S.text3 }}>章节概览</p>
                          <div className="space-y-1.5">
                            {chapterPlans.map(cp => (
                              <div key={cp.id} className="flex items-center justify-between px-3 py-2 rounded-lg"
                                style={{ background: S.s2, border: `1px solid ${S.border}` }}>
                                <div className="flex items-center gap-2">
                                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded"
                                    style={{ background: S.primary10, color: S.primary }}>第{cp.chapterNumber}章</span>
                                  <span className="text-[10px] font-bold" style={{ color: S.text }}>{cp.title}</span>
                                </div>
                                <span className="text-[8px] font-mono" style={{ color: S.text3 }}>{cp.events.length} 个事件</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {narrativeIntents.length > 0 && (
                        <div>
                          <p className="text-[9px] font-bold uppercase tracking-wider mb-2" style={{ color: S.text3 }}>故事弧光 · 情绪张力</p>
                          <div className="space-y-1">
                            {narrativeIntents.map((ni, i) => {
                              const node = storyNodes.find(n => n.id === ni.nodeId);
                              const pct = Math.round((ni.emotionValue / 10) * 100);
                              const barColor = ni.emotionValue >= 7 ? S.error : ni.emotionValue >= 4 ? S.warning : S.accent;
                              return (
                                <div key={i} className="flex items-center gap-2">
                                  <span className="text-[8px] font-mono w-8 shrink-0 text-right" style={{ color: S.text3 }}>{node?.id ?? ni.nodeId}</span>
                                  <span className="text-[8px] w-16 shrink-0 truncate" style={{ color: S.text2 }}>{node?.label ?? ni.nodeId}</span>
                                  <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: S.s3 }}>
                                    <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.4, delay: i * 0.04 }}
                                      className="h-full rounded-full" style={{ background: barColor }} />
                                  </div>
                                  <span className="text-[8px] font-mono w-4 shrink-0 text-right" style={{ color: barColor }}>{ni.emotionValue}</span>
                                </div>
                              );
                            })}
                          </div>
                          <div className="flex items-center gap-3 mt-2">
                            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full" style={{ background: S.accent }} /><span className="text-[7px]" style={{ color: S.text3 }}>低张力 (1-3)</span></div>
                            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full" style={{ background: S.warning }} /><span className="text-[7px]" style={{ color: S.text3 }}>中张力 (4-6)</span></div>
                            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full" style={{ background: S.error }} /><span className="text-[7px]" style={{ color: S.text3 }}>高张力 (7-10)</span></div>
                          </div>
                        </div>
                      )}
                      {branchPaths.length > 0 && (
                        <div>
                          <p className="text-[9px] font-bold uppercase tracking-wider mb-2" style={{ color: S.text3 }}>分支结构摘要</p>
                          <div className="space-y-1.5">
                            {branchPaths.map(path => (
                              <div key={path.id} className="flex items-center justify-between px-3 py-2 rounded-lg"
                                style={{ background: S.s2, border: `1px solid ${S.border}` }}>
                                <div className="flex items-center gap-2">
                                  <Trophy size={10} style={{ color: path.type === "good" ? S.success : S.error }} />
                                  <span className="text-[10px] font-bold" style={{ color: S.text }}>{path.label}</span>
                                  <span className="text-[8px] px-1.5 py-0.5 rounded"
                                    style={{ background: path.type === "good" ? S.success10 : S.error10, color: path.type === "good" ? S.success : S.error }}>{path.ending}</span>
                                </div>
                                <span className="text-[8px] font-mono" style={{ color: S.text3 }}>{path.nodes.length} 节点</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═══════════════════ TAB 2: 风格一致性 ═══════════════════ */}
        <AnimatePresence mode="wait">
          {activeTab === 2 && (
            <motion.div key="tab-2" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                    <div className="rounded-xl p-3" style={{ background: S.card, border: `1px solid ${S.border}` }}>
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-[9px] font-bold" style={{ color: S.text }}>{styleSummary.consistentCount}/{styleSummary.totalAssets} 项资产风格统一</p>
                        <div className="flex items-center gap-1.5">
                          <div className="h-1.5 w-12 rounded-full overflow-hidden" style={{ background: S.s3 }}>
                            <div className="h-full rounded-full" style={{ width: `${styleSummary.consistencyRate}%`, background: styleSummary.consistencyRate >= 80 ? S.success : styleSummary.consistencyRate >= 60 ? S.warning : S.error }} />
                          </div>
                          <span className="text-[9px] font-mono font-bold" style={{ color: styleSummary.consistencyRate >= 80 ? S.success : styleSummary.consistencyRate >= 60 ? S.warning : S.error }}>{styleSummary.consistencyRate}%</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-2 mb-3">
                        {[
                          { label: '主风格', value: styleSummary.dominant, color: S.primary },
                          { label: '总资产', value: styleSummary.totalAssets, color: S.text2 },
                          { label: '一致', value: styleSummary.consistentCount, color: S.success },
                          { label: '不一致', value: styleSummary.inconsistentCount, color: styleSummary.inconsistentCount > 0 ? S.error : S.success },
                        ].map((item, i) => (
                          <div key={i} className="p-2 rounded-lg text-center" style={{ background: S.s2, border: `1px solid ${S.border}` }}>
                            <p className="text-sm font-bold font-mono" style={{ color: item.color }}>{item.value}</p>
                            <p className="text-[8px]" style={{ color: S.text3 }}>{item.label}</p>
                          </div>
                        ))}
                      </div>
                      <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${S.border}` }}>
                        <div className="grid grid-cols-4 gap-1 px-3 py-2" style={{ background: S.s3 }}>
                          <span className="text-[8px] font-bold" style={{ color: S.text3 }}>节点</span>
                          <span className="text-[8px] font-bold" style={{ color: S.text3 }}>资产类型</span>
                          <span className="text-[8px] font-bold" style={{ color: S.text3 }}>风格</span>
                          <span className="text-[8px] font-bold text-right" style={{ color: S.text3 }}>状态</span>
                        </div>
                        {styleConsistency.map((item, i) => (
                          <div key={i} className="grid grid-cols-4 gap-1 px-3 py-2 items-center" style={{ background: item.consistent ? 'transparent' : `${S.error}06`, borderTop: `1px solid ${S.border}` }}>
                            <span className="text-[9px] font-mono font-bold" style={{ color: S.text }}>{item.nodeId}</span>
                            <span className="text-[9px]" style={{ color: S.text2 }}>{item.assetType}</span>
                            <span className="text-[8px] px-1.5 py-0.5 rounded-full w-fit" style={{ background: item.consistent ? S.primary10 : `${S.error}12`, color: item.consistent ? S.primary : S.error, border: `1px solid ${item.consistent ? `${S.primary}20` : `${S.error}20`}` }}>{item.style}</span>
                            <div className="flex items-center justify-end gap-1">
                              {item.consistent ? <CheckCircle2 size={10} style={{ color: S.success }} /> : <AlertTriangle size={10} style={{ color: S.error }} />}
                              <span className="text-[8px]" style={{ color: item.consistent ? S.success : S.error }}>{item.consistent ? '一致' : '不一致'}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      {styleSummary.inconsistentCount > 0 && (
                        <div className="mt-3 space-y-2">
                          {styleConsistency.filter(s => !s.consistent && s.warning).map((item, i) => (
                            <div key={i} className="flex items-start gap-2 p-3 rounded-xl" style={{ background: `${S.warning}08`, border: `1px solid ${S.warning}20` }}>
                              <AlertTriangle size={12} style={{ color: S.warning, marginTop: 1, flexShrink: 0 }} />
                              <div>
                                <p className="text-[9px] font-bold" style={{ color: S.warning }}>{item.nodeId} · {item.assetType}</p>
                                <p className="text-[8px] mt-0.5" style={{ color: S.text3 }}>{item.warning}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="mt-3 p-3 rounded-xl" style={{ background: S.s2, border: `1px solid ${S.border}` }}>
                        <div className="flex items-center gap-1.5 mb-2">
                          <Sparkles size={11} style={{ color: S.primary }} />
                          <span className="text-[10px] font-bold" style={{ color: S.text }}>风格统一建议</span>
                        </div>
                        <p className="text-[9px] leading-relaxed" style={{ color: S.text2 }}>
                          建议将线人立绘统一为赛博朋克风格，或调整角色设定以兼容写实风格。保持视觉风格一致性有助于提升玩家的沉浸感和整体体验品质。
                        </p>
                      </div>
                    </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═══════════════════ TAB 1: 质量检查 ═══════════════════ */}
        <AnimatePresence mode="wait">
          {activeTab === 1 && (
            <motion.div key="tab-1" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
              {/* Sub-tab bar */}
              <div className="flex items-center gap-1.5 mb-3">
                {["健康检查", "改进建议"].map((label, i) => (
                  <button key={i}
                    onClick={() => setActiveSubTab(prev => ({ ...prev, 1: i }))}
                    className="px-3 py-1 rounded-lg text-[10px] font-bold transition-colors focus:outline-none"
                    style={{
                      background: activeSubTab[1] === i ? S.primary10 : "transparent",
                      color: activeSubTab[1] === i ? S.primary : S.text3,
                      border: `1px solid ${activeSubTab[1] === i ? S.primary20 : "transparent"}`,
                    }}>
                    {label}
                  </button>
                ))}
              </div>
              <AnimatePresence mode="wait">
                {activeSubTab[1] === 0 && (
                  <motion.div key="sub-1-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                    <div className="rounded-xl p-3" style={{ background: S.card, border: `1px solid ${S.border}` }}>
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-[9px] font-bold" style={{ color: S.text }}>完成 {doneCount}/{qualityChecks.length} 项检查</p>
                        <div className="flex items-center gap-1.5">
                          <div className="h-1.5 w-12 rounded-full overflow-hidden" style={{ background: S.s3 }}>
                            <div className="h-full rounded-full" style={{ width: `${healthPct}%`, background: healthPct > 70 ? S.success : S.warning }} />
                          </div>
                          <span className="text-[9px] font-mono font-bold" style={{ color: healthPct > 70 ? S.success : S.warning }}>{healthPct}%</span>
                        </div>
                      </div>
                      {QC_CATEGORIES.map(cat => {
                        const items = qualityChecks.filter(qc => qc.category === cat.key);
                        const catOk = items.every(qc => qc.status === "ok");
                        return (
                          <div key={cat.key} className="mb-3">
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <cat.icon size={10} style={{ color: catOk ? S.success : S.warning }} />
                              <span className="text-[9px] font-bold" style={{ color: S.text }}>{cat.label}</span>
                              <span className="text-[8px] px-1 py-0.5 rounded font-mono"
                                style={{ background: catOk ? S.success10 : S.warning10, color: catOk ? S.success : S.warning }}>
                                {items.filter(q => q.status === "ok").length}/{items.length}
                              </span>
                            </div>
                            <div className="space-y-1">
                              {items.map(qc => (
                                <div key={qc.id} className="flex items-start gap-2 px-2.5 py-1.5 rounded-lg"
                                  style={{ background: qc.status === "ok" ? S.success10 : qc.status === "warn" ? S.warning10 : S.error10 }}>
                                  {qc.status === "ok"
                                    ? <CheckCircle2 size={11} style={{ color: S.success, marginTop: 1, flexShrink: 0 }} />
                                    : qc.status === "warn"
                                    ? <AlertTriangle size={11} style={{ color: S.warning, marginTop: 1, flexShrink: 0 }} />
                                    : <AlertTriangle size={11} style={{ color: S.error, marginTop: 1, flexShrink: 0 }} />}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[9px] font-bold" style={{ color: qc.status === "ok" ? S.success : qc.status === "warn" ? S.warning : S.error }}>{qc.label}</p>
                                    <p className="text-[8px]" style={{ color: S.text3 }}>{qc.detail}</p>
                                  </div>
                                  {qc.status !== "ok" && qc.fixLink && (
                                    <Link href={qc.fixLink} className="ml-auto shrink-0">
                                      <motion.span whileTap={{ scale: 0.95 }}
                                        className="text-[8px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5"
                                        style={{ background: `${S.primary}12`, color: S.primary, border: `1px solid ${S.primary}20` }}>
                                        修复 <ExternalLink size={7} />
                                      </motion.span>
                                    </Link>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                      <div className="mb-3">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <Shield size={10} style={{ color: industry === 'game' ? S.text3 : S.primary }} />
                          <span className="text-[9px] font-bold" style={{ color: S.text }}>
                            {INDUSTRY_OPTIONS.find(o => o.type === industry)?.icon} 行业专属检查
                          </span>
                        </div>
                        {industry === 'game' ? (
                          <div className="px-3 py-2.5 rounded-lg text-[9px]" style={{ background: S.s2, color: S.text3, border: `1px solid ${S.border}` }}>
                            游戏行业使用上方通用质检规则
                          </div>
                        ) : (
                          <div className="space-y-1">
                            {INDUSTRY_QC_RULES.filter(r => r.industryType === industry).map(rule => (
                              <div key={rule.id} className="flex items-start gap-2 px-2.5 py-1.5 rounded-lg"
                                style={{ background: rule.severity === 'block' ? S.error10 : rule.severity === 'warn' ? S.warning10 : `${S.primary}08` }}>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5 mb-0.5">
                                    <p className="text-[9px] font-bold" style={{ color: S.text }}>{rule.label}</p>
                                    <span className="text-[7px] px-1 py-0.5 rounded-full font-bold" style={{
                                      background: rule.severity === 'block' ? S.error10 : rule.severity === 'warn' ? S.warning10 : `${S.primary}10`,
                                      color: rule.severity === 'block' ? S.error : rule.severity === 'warn' ? S.warning : S.primary,
                                    }}>
                                      {rule.severity === 'block' ? '阻断' : rule.severity === 'warn' ? '警告' : '提示'}
                                    </span>
                                  </div>
                                  <p className="text-[8px]" style={{ color: S.text3 }}>{rule.description}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
                {activeSubTab[1] === 1 && (
                  <motion.div key="sub-1-1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                    <div className="space-y-3">
                      <div className="rounded-xl p-3" style={{ background: `linear-gradient(135deg,${S.primary}08,${S.accent}08)`, border: `1px solid ${S.primary}20` }}>
                        <div className="flex items-center gap-2 mb-3">
                          <Sparkles size={14} style={{ color: S.primary }} />
                          <h3 className="text-xs font-bold" style={{ color: S.text }}>下一步建议</h3>
                        </div>
                        <div className="space-y-1.5">
                          {[
                            { label: "补齐 9 个节点 BGM", href: "/assets", priority: "high", desc: "当前所有场景均无背景音乐" },
                            { label: "N07 增加失败反馈文案", href: "/nodes", priority: "high", desc: "潜行判定节点失败路径缺少文案" },
                            { label: "配置游戏用户界面", href: "/nodes", priority: "mid", desc: "设置对话框、HUD、系统菜单等游戏内UI" },
                            { label: "增加道德抉择分支", href: "/nodes", priority: "low", desc: "丰富叙事深度，增加玩家代入感" },
                            { label: "运行完整路径试玩", href: "/simulator", priority: "low", desc: "从玩家视角验证全部路径可达性" },
                          ].map((item, i) => (
                            <Link key={i} href={item.href}>
                              <motion.div whileTap={{ scale: 0.98 }}
                                className="flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer mt-1.5"
                                style={{ background: S.card, border: `1px solid ${S.border}` }}>
                                <div className="flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 rounded-full" style={{
                                    background: item.priority === "high" ? S.error : item.priority === "mid" ? S.warning : S.primary
                                  }} />
                                  <div>
                                    <span className="text-[10px] font-bold" style={{ color: S.text }}>{item.label}</span>
                                    <p className="text-[8px]" style={{ color: S.text3 }}>{item.desc}</p>
                                  </div>
                                </div>
                                <ChevronRight size={12} style={{ color: S.text3 }} />
                              </motion.div>
                            </Link>
                          ))}
                        </div>
                      </div>

                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="h-6" />
      </div>

      {/* ═══════════════════ TAB 3: 数据分析 ═══════════════════ */}
      <AnimatePresence mode="wait">
        {activeTab === 3 && (
          <motion.div key="tab-3" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}
            className="max-w-3xl mx-auto px-5 pb-4 space-y-3">

            {/* 核心指标 */}
            <div className="rounded-xl p-3" style={{ background: S.card, border: `1px solid ${S.border}` }}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: S.primary10 }}>
                  <BarChart3 size={13} style={{ color: S.primary }} />
                </div>
                <div>
                  <h3 className="text-xs font-bold" style={{ color: S.text }}>玩家行为指标</h3>
                  <p className="text-[9px]" style={{ color: S.text3 }}>基于 {analyticsSessions.length} 个测试会话</p>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: '测试会话', value: analyticsSessions.length, color: S.primary },
                  { label: '完成率', value: `${Math.round(completionRate * 100)}%`, color: completionRate >= 0.8 ? S.success : S.warning },
                  { label: '平均时长', value: `${Math.round(avgDuration / 60)}min`, color: S.accent },
                  { label: '热门结局', value: topEnding?.name ?? '无', color: S.primary },
                ].map((item, i) => (
                  <div key={i} className="p-2 rounded-xl text-center" style={{ background: S.s2, border: `1px solid ${S.border}` }}>
                    <p className="text-sm font-bold font-mono" style={{ color: item.color }}>{item.value}</p>
                    <p className="text-[8px]" style={{ color: S.text3 }}>{item.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 选择分布 */}
            {choiceDistributions.length > 0 && (
              <div className="rounded-xl p-3" style={{ background: S.card, border: `1px solid ${S.border}` }}>
                <h3 className="text-xs font-bold mb-2" style={{ color: S.text }}>选择分布</h3>
                <div className="space-y-2">
                  {choiceDistributions.slice(0, 4).map(dist => (
                    <div key={dist.nodeId} className="p-2 rounded-lg" style={{ background: S.s2 }}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold" style={{ color: S.text }}>{dist.nodeName}</span>
                        <span className="text-[8px] font-mono" style={{ color: S.text3 }}>{dist.totalChoices} 次选择</span>
                      </div>
                      <div className="space-y-1">
                        {dist.optionStats.map((opt, oi) => (
                          <div key={oi} className="flex items-center gap-2">
                            <span className="text-[9px] flex-1 truncate" style={{ color: S.text2 }}>{opt.choiceText}</span>
                            <div className="w-20 h-2 rounded-full overflow-hidden" style={{ background: S.s3 }}>
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${opt.ratio * 100}%` }}
                                transition={{ duration: 0.5, delay: oi * 0.1 }}
                                className="h-full rounded-full"
                                style={{ background: opt.ratio >= 0.6 ? S.primary : S.accent }}
                              />
                            </div>
                            <span className="text-[8px] font-mono w-8 text-right" style={{ color: S.text3 }}>
                              {Math.round(opt.ratio * 100)}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 漏斗 */}
            {funnels.length > 0 && (
              <div className="rounded-xl p-3" style={{ background: S.card, border: `1px solid ${S.border}` }}>
                <h3 className="text-xs font-bold mb-2" style={{ color: S.text }}>转化漏斗</h3>
                {funnels.map((funnel, fi) => (
                  <div key={fi} className="mb-2">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-bold" style={{ color: S.text }}>{funnel.name}</span>
                      <span className="text-[9px] font-mono font-bold" style={{ color: S.primary }}>
                        {Math.round(funnel.conversionRate * 100)}% 转化
                      </span>
                    </div>
                    <div className="space-y-1">
                      {funnel.steps.map((step, si) => {
                        const maxReached = funnel.totalEntries || 1;
                        const widthPct = (step.reached / maxReached) * 100;
                        return (
                          <div key={si} className="flex items-center gap-2">
                            <span className="text-[9px] w-16 shrink-0 truncate" style={{ color: S.text2 }}>{step.name}</span>
                            <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ background: S.s3 }}>
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.max(widthPct, 5)}%` }}
                                transition={{ duration: 0.4, delay: si * 0.08 }}
                                className="h-full rounded-full flex items-center justify-end pr-1"
                                style={{ background: `${S.primary}40` }}
                              >
                                <span className="text-[7px] font-bold" style={{ color: S.primary }}>{step.reached}</span>
                              </motion.div>
                            </div>
                            {step.dropped > 0 && (
                              <span className="text-[8px] shrink-0" style={{ color: S.error }}>-{step.dropped}</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Next Step Navigation */}
      <div className="sticky bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 flex items-center justify-between"
        style={{ borderTopColor: S.border }}>
        <span className="text-xs text-gray-500">质检通过？准备发布</span>
        <Link href="/publish" className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white" style={{ background: '#7C6CF5' }}>
          前往发布 →
        </Link>
      </div>
    </div>
  );
}
