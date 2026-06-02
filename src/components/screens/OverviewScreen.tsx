"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, AlertTriangle, ChevronRight, ChevronDown,
  GitBranch, User, Users, MapPin, Clock, BookOpen, Zap,
  Film, HelpCircle, Trophy, Activity,
  ArrowRight, Layers, Target, Play,
  ExternalLink, BarChart3, Sparkles, X,
  Package, Rocket, Palette, Shield
} from "lucide-react";
import Link from "next/link";
import { STORY_NODES, NODE_EDGES, GAME_CHARACTERS, WORLD_BUILDING as WB_DATA, BRANCH_PATHS, QUALITY_CHECKS, INDUSTRY_LABELS, INDUSTRY_TEMPLATES, INDUSTRY_QC_RULES, type IndustryType, type StoryNode } from "@/lib/studio-data";

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

// ── 节点类型配置 ──────────────────────────────────────────────────────────
const NODE_CFG: Record<string, { label: string; color: string; icon: any }> = {
  start:       { label: "场景",  color: S.primary, icon: Film },
  scene:       { label: "场景",  color: S.primary, icon: Film },
  choice:      { label: "选择",  color: S.warning, icon: HelpCircle },
  condition:   { label: "条件",  color: S.warning, icon: Zap },
  qte:         { label: "QTE",   color: S.error,   icon: Target },
  ending_good: { label: "好结局", color: S.success,  icon: Trophy },
  ending_bad:  { label: "坏结局", color: S.error,    icon: Trophy },
};

// ── 角色详情 ──────────────────────────────────────────────────────────────
const CHARACTERS = GAME_CHARACTERS.map(c => ({
  name: c.name, role: c.role, desc: c.description, appearNodes: c.appearNodes, color: c.color, emoji: c.emoji
}));

// ── 世界观设定 ────────────────────────────────────────────────────────────
const WORLD_BUILDING = WB_DATA;

// ── 分支路径分析 ──────────────────────────────────────────────────────────
const PATHS = BRANCH_PATHS;

// ── 统计摘要 ──────────────────────────────────────────────────────────────
const STATS = [
  { key: "chapter", value: 1, icon: BookOpen, color: S.primary },
  { key: "node", value: 11, icon: Layers, color: S.primary },
  { key: "edge", value: 2, icon: GitBranch, color: S.warning },
  { key: "ending", value: 2, icon: Trophy, color: S.accent },
  { key: "character", value: 3, icon: User, color: S.primary },
  { key: "scene", value: 6, icon: MapPin, color: S.accent },
  { key: "prop", value: 9, icon: Zap, color: S.warning },
  { key: "_duration", value: "15min", icon: Clock, color: S.text3 },
];

// ── 项目健康度 ────────────────────────────────────────────────────────────
const QC_CATEGORIES = [
  { key: "structure", label: "结构完整性", icon: Layers },
  { key: "narrative", label: "叙事质量", icon: BookOpen },
  { key: "assets", label: "资产完整性", icon: Package },
  { key: "publish", label: "发布风险", icon: Rocket },
];

// ── 叙事质量评分数据 ──────────────────────────────────────────────────────
const NARRATIVE_SCORES = [
  {
    dimension: '选择意义度',
    score: 85,
    maxScore: 100,
    detail: '2 个选择节点，每个选择导致不同的路径和结局，选择具有实质性影响',
    strengths: ['N03 路线选择直接决定后续路径', 'N07 判定结果影响结局走向'],
    improvements: ['建议在中间章节增加更多有意义的选择点'],
  },
  {
    dimension: '分支平衡性',
    score: 72,
    maxScore: 100,
    detail: '路线 A（8 节点）vs 路线 B（8 节点），长度均衡，但结局概率不均',
    strengths: ['两条主线路径长度一致', '均有独特体验'],
    improvements: ['好结局概率偏高（约 68%），建议调整潜行值阈值平衡概率'],
  },
  {
    dimension: '变量使用率',
    score: 100,
    maxScore: 100,
    detail: '4 个变量全部在条件判定中使用，无死变量',
    strengths: ['每个变量至少被 2 个节点引用', '潜行值为核心判定变量'],
    improvements: [],
  },
  {
    dimension: '失败反馈完整度',
    score: 60,
    maxScore: 100,
    detail: '2 个条件/QTE 节点中，1 个缺少失败反馈文案',
    strengths: ['N06 QTE 有成功反馈'],
    improvements: ['N07 潜行判定节点缺少失败反馈文案', '建议为所有失败路径补充叙事反馈'],
  },
  {
    dimension: '情绪节奏',
    score: 78,
    maxScore: 100,
    detail: '情绪曲线整体合理，N06 达到峰值 9，但连续高张力后缺少缓冲',
    strengths: ['序章低张力建立世界观', 'N06 QTE 高潮点设计合理'],
    improvements: ['N06(9)→N07(8)→N08(7) 连续三个高张力节点，建议在中间插入缓冲'],
  },
  {
    dimension: '伏笔回收率',
    score: 80,
    maxScore: 100,
    detail: '5 条伏笔中回收 4 条，1 条未在结局中明确收束',
    strengths: ['追踪芯片伏笔在 N01 植入，N08 回收', '线人身份悬念贯穿全剧'],
    improvements: ['反派主管动机在坏结局中未充分解释'],
  },
];

const totalScore = Math.round(NARRATIVE_SCORES.reduce((s, n) => s + n.score, 0) / NARRATIVE_SCORES.length);

// ── 行业切换配置 ────────────────────────────────────────────────────────────
const INDUSTRY_OPTIONS: { type: IndustryType; icon: string; label: string }[] = [
  { type: 'game', icon: '🎮', label: '游戏' },
  { type: 'tourism', icon: '🏛️', label: '文旅' },
  { type: 'education', icon: '🎓', label: '教育' },
  { type: 'derivative', icon: '🎬', label: '衍生' },
];

// ── 素材风格一致性数据 ────────────────────────────────────────────────────
const STYLE_CONSISTENCY = [
  { nodeId: 'N01', assetType: '场景图片', style: '赛博朋克', consistent: true },
  { nodeId: 'N02', assetType: '场景图片', style: '赛博朋克', consistent: true },
  { nodeId: 'N03', assetType: '场景图片', style: '赛博朋克', consistent: true },
  { nodeId: 'N04', assetType: '场景图片', style: '赛博朋克', consistent: true },
  { nodeId: 'N05', assetType: '场景图片', style: '赛博朋克', consistent: true },
  { nodeId: 'N07', assetType: '场景图片', style: '赛博朋克', consistent: true },
  { nodeId: 'N08', assetType: '场景图片', style: '赛博朋克', consistent: true },
  { nodeId: 'N01', assetType: '角色立绘', style: '赛博朋克', consistent: true },
  { nodeId: 'N02', assetType: '角色立绘', style: '现代写实', consistent: false, warning: '线人立绘风格偏写实，与赛博朋克主题不完全匹配' },
  { nodeId: 'N05', assetType: '角色立绘', style: '赛博朋克', consistent: true },
];

const styleSummary = {
  dominant: '赛博朋克',
  totalAssets: STYLE_CONSISTENCY.length,
  consistentCount: STYLE_CONSISTENCY.filter(s => s.consistent).length,
  inconsistentCount: STYLE_CONSISTENCY.filter(s => !s.consistent).length,
  consistencyRate: Math.round(STYLE_CONSISTENCY.filter(s => s.consistent).length / STYLE_CONSISTENCY.length * 100),
};

// ── 展开/收起区块 Hook ────────────────────────────────────────────────────
function useSectionToggle(init = true) {
  const [open, setOpen] = useState(init);
  return { open, toggle: () => setOpen(o => !o) };
}

// ── 区块标题组件 ──────────────────────────────────────────────────────────
function SectionHeader({ icon: Icon, title, subtitle, open, onToggle, action }: {
  icon: any; title: string; subtitle?: string; open: boolean; onToggle: () => void;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <button onClick={onToggle} className="flex items-center gap-2 focus:outline-none">
        <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: S.primary10 }}>
          <Icon size={13} style={{ color: S.primary }} />
        </div>
        <div>
          <h3 className="text-xs font-bold" style={{ color: S.text }}>{title}</h3>
          {subtitle && <p className="text-[9px]" style={{ color: S.text3 }}>{subtitle}</p>}
        </div>
        <motion.div animate={{ rotate: open ? 0 : -90 }} transition={{ duration: 0.15 }}>
          <ChevronDown size={12} style={{ color: S.text3 }} />
        </motion.div>
      </button>
      {action}
    </div>
  );
}

// ── 迷你节点地图 ──────────────────────────────────────────────────────────
function MiniNodeMap({ highlightPath }: { highlightPath?: string[] }) {
  const scaleX = 0.38;
  const scaleY = 0.22;
  const padX = 20;
  const padY = 10;
  const w = 380;
  const h = 170;

  return (
    <div className="relative w-full overflow-hidden rounded-xl" style={{ background: S.s2, border: `1px solid ${S.border}`, height: h }}>
      <svg className="w-full h-full" viewBox={`0 0 ${w} ${h}`}>
        {/* 连线 */}
        {NODE_EDGES.map((edge, i) => {
          const fn = STORY_NODES.find(n => n.id === edge.from);
          const tn = STORY_NODES.find(n => n.id === edge.to);
          if (!fn || !tn) return null;
          const x1 = fn.x * scaleX + padX, y1 = (fn.y + 20) * scaleY + padY;
          const x2 = tn.x * scaleX + padX, y2 = tn.y * scaleY + padY;
          const cy = (y1 + y2) / 2;
          const isHighlight = highlightPath && highlightPath.includes(edge.from) && highlightPath.includes(edge.to);
          return (
            <path key={i}
              d={`M ${x1},${y1} C ${x1},${cy} ${x2},${cy} ${x2},${y2}`}
              fill="none" stroke={isHighlight ? S.primary : S.border2}
              strokeWidth={isHighlight ? 2 : 1} opacity={isHighlight ? 0.8 : 0.5}
            />
          );
        })}
        {/* 节点 */}
        {STORY_NODES.map(node => {
          const cfg = NODE_CFG[node.type] ?? NODE_CFG.scene;
          const x = node.x * scaleX + padX;
          const y = node.y * scaleY + padY;
          const isHL = highlightPath?.includes(node.id);
          return (
            <g key={node.id}>
              <circle cx={x} cy={y} r={isHL ? 5 : 3.5}
                fill={cfg.color} opacity={isHL ? 1 : 0.5}
                stroke={isHL ? "#fff" : "none"} strokeWidth={1.5}
              />
              {isHL && (
                <text x={x} y={y - 8} textAnchor="middle"
                  fontSize={7} fill={S.text2} fontWeight="bold">
                  {node.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ── 主页面 ────────────────────────────────────────────────────────────────
export default function OverviewScreen() {
  const secStats   = useSectionToggle(true);
  const secStory   = useSectionToggle(true);
  const secNodes   = useSectionToggle(true);
  const secChars   = useSectionToggle(true);
  const secBranch  = useSectionToggle(true);
  const secWorld   = useSectionToggle(true);
  const secHealth  = useSectionToggle(true);
  const secNarrative = useSectionToggle(true);
  const secStyle = useSectionToggle(true);

  const [hoveredPath, setHoveredPath] = useState<string[] | undefined>(undefined);
  const [selectedNode, setSelectedNode] = useState<StoryNode | null>(null);
  const [industry, setIndustry] = useState<IndustryType>('game');

  function t(key: string): string {
    const map = INDUSTRY_LABELS[key];
    return map ? map[industry] : key;
  }

  function dimLabel(dimension: string): string {
    // Industry-specific overrides for narrative quality dimensions
    const overrides: Record<string, Record<IndustryType, string>> = {
      '选择意义度': { game: '选择意义度', tourism: '选择体验价值', education: '选择意义度', derivative: '选择意义度' },
      '分支平衡性': { game: '分支平衡性', tourism: '路线均衡性', education: '分支平衡性', derivative: '分支平衡性' },
    };
    const override = overrides[dimension];
    if (override) return override[industry];
    return dimension;
  }
  const doneCount = QUALITY_CHECKS.filter(h => h.status === "ok").length;
  const healthPct = Math.round((doneCount / QUALITY_CHECKS.length) * 100);

  return (
    <div className="min-h-svh overflow-y-auto" style={{ background: S.bg }}>

      {/* ── 顶部项目信息 ── */}
      <div className="sticky top-0 z-20 px-5 py-3 flex items-center justify-between"
        style={{ background: "rgba(250,251,255,0.92)", backdropFilter: "blur(12px)", borderBottom: `1px solid ${S.border}` }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: `linear-gradient(135deg,${S.primary},${S.accent})` }}>
            <span className="text-white text-xs font-black">幽</span>
          </div>
          <div>
            <h2 className="text-sm font-bold" style={{ color: S.text }}>幽灵协议</h2>
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
                <div className="h-full rounded-full" style={{ width: "74%", background: `linear-gradient(to right,${S.primary},${S.accent})` }} />
              </div>
              <span className="text-xs font-mono font-bold" style={{ color: S.primary }}>74%</span>
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

        {/* ── 项目统计 ── */}
        <div className="rounded-xl p-4" style={{ background: S.card, border: `1px solid ${S.border}` }}>
          <SectionHeader icon={BarChart3} title="项目统计" subtitle="互动叙事核心数据"
            open={secStats.open} onToggle={secStats.toggle} />
          <AnimatePresence>
            {secStats.open && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                <div className="grid grid-cols-4 gap-2 mt-3">
                  {STATS.map(s => (
                    <div key={s.key} className="p-2.5 rounded-xl text-center"
                      style={{ background: S.s2, border: `1px solid ${S.border}` }}>
                      <s.icon size={14} style={{ color: s.color, margin: "0 auto 4px" }} />
                      <p className="text-sm font-bold font-mono" style={{ color: S.text }}>{s.value}</p>
                      <p className="text-[8px]" style={{ color: S.text3 }}>{s.key === '_duration' ? '预估时长' : t(s.key)}</p>
                    </div>
                  ))}
                </div>
                {/* 三段进度 */}
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {[
                    { label: t('parse'), detail: `${t('character')}3 · ${t('scene')}6 · ${t('prop')}9`, pct: 100, done: true },
                    { label: t('interaction'), detail: `11${t('node')} · 2${t('edge')} · 2${t('ending')}`, pct: 100, done: true },
                    { label: t('asset') + '生成', detail: "图8/9 · BGM 0/9 · 视频待补", pct: 60, done: false },
                  ].map((s, i) => (
                    <div key={i} className="p-2.5 rounded-xl" style={{ background: S.s2, border: `1px solid ${s.done ? `${S.success}30` : `${S.primary}20`}` }}>
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
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── 故事结构 ── */}
        <div className="rounded-xl p-4" style={{ background: S.card, border: `1px solid ${S.border}` }}>
          <SectionHeader icon={BookOpen} title="故事结构" subtitle="第一章：渗透行动"
            open={secStory.open} onToggle={secStory.toggle}
            action={
              <Link href="/script">
                <span className="text-[9px] flex items-center gap-0.5" style={{ color: S.primary }}>
                  编辑剧本 <ExternalLink size={9} />
                </span>
              </Link>
            } />
          <AnimatePresence>
            {secStory.open && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                {/* 故事时间线 */}
                <div className="mt-3 space-y-1.5">
                  {[
                    { time: "2047 · 夜", event: "序章：霓虹夜幕", desc: "艾拉在霓虹街道追踪失踪线人", node: "N01" },
                    { time: "→", event: "任务简报", desc: "获取线人最后位置和关键情报", node: "N02" },
                    { time: "→", event: "关键选择：进入路线", desc: "玩家选择A.暗夜通道 或 B.换装渗透", node: "N03", isChoice: true },
                    { time: "→", event: "渗透行动", desc: "根据选择进入不同潜行路线", node: "N04/N05" },
                    { time: "→", event: "QTE：警卫逼近", desc: "限时操作——躲避或对抗警卫", node: "N06", isQte: true },
                    { time: "→", event: "条件判定：潜行分数", desc: "根据累计表现判定成功/失败", node: "N07", isCond: true },
                    { time: "→", event: "结局分支", desc: "成功→数据到手→幽灵归来 / 失败→身份暴露→今夜失败", node: "N08-N11", isEnding: true },
                  ].map((item, i) => (
                    <div key={i} className="flex gap-2 items-start">
                      <div className="flex flex-col items-center">
                        <div className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                          style={{ background: item.isChoice ? S.warning : item.isQte ? S.error : item.isCond ? S.warning : item.isEnding ? S.accent : S.primary }} />
                        {i < 6 && <div className="w-px flex-1 min-h-[16px]" style={{ background: S.border }} />}
                      </div>
                      <div className="flex-1 pb-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[8px] font-mono" style={{ color: S.text3 }}>{item.time}</span>
                          <span className="text-[10px] font-bold" style={{ color: S.text }}>{item.event}</span>
                          {item.isChoice && <span className="text-[8px] px-1 py-0.5 rounded" style={{ background: `${S.warning}15`, color: S.warning }}>选择</span>}
                          {item.isQte && <span className="text-[8px] px-1 py-0.5 rounded" style={{ background: `${S.error}15`, color: S.error }}>QTE</span>}
                          {item.isCond && <span className="text-[8px] px-1 py-0.5 rounded" style={{ background: `${S.warning}15`, color: S.warning }}>条件</span>}
                        </div>
                        <p className="text-[9px]" style={{ color: S.text3 }}>{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── 节点图概览 ── */}
        <div className="rounded-xl p-4" style={{ background: S.card, border: `1px solid ${S.border}` }}>
          <SectionHeader icon={Layers} title="节点图概览" subtitle={`${STORY_NODES.length} 个节点 · ${NODE_EDGES.length} 条连线`}
            open={secNodes.open} onToggle={secNodes.toggle}
            action={
              <Link href="/nodes">
                <span className="text-[9px] flex items-center gap-0.5" style={{ color: S.primary }}>
                  打开编辑器 <ExternalLink size={9} />
                </span>
              </Link>
            } />
          <AnimatePresence>
            {secNodes.open && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                <div className="mt-3">
                  <MiniNodeMap highlightPath={hoveredPath} />
                  {/* 图例 */}
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    {Object.entries(NODE_CFG).filter(([k]) => !["start"].includes(k)).map(([key, cfg]) => (
                      <div key={key} className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full" style={{ background: cfg.color }} />
                        <span className="text-[8px]" style={{ color: S.text3 }}>{cfg.label}</span>
                      </div>
                    ))}
                  </div>
                  {/* 节点列表 */}
                  <div className="mt-3 grid grid-cols-2 gap-1.5">
                    {STORY_NODES.map(node => {
                      const cfg = NODE_CFG[node.type] ?? NODE_CFG.scene;
                      return (
                        <motion.button key={node.id} whileTap={{ scale: 0.97 }}
                          onClick={() => setSelectedNode(selectedNode?.id === node.id ? null : node)}
                          className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-left focus:outline-none"
                          style={{
                            background: selectedNode?.id === node.id ? S.primary10 : S.s2,
                            border: `1px solid ${selectedNode?.id === node.id ? S.primary20 : S.border}`,
                          }}>
                          <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: cfg.color }} />
                          <span className="text-[9px] font-bold truncate" style={{ color: S.text }}>{node.id}</span>
                          <span className="text-[9px] truncate" style={{ color: S.text3 }}>{node.label}</span>
                          {node.hasError && <AlertTriangle size={8} style={{ color: S.error, flexShrink: 0 }} />}
                        </motion.button>
                      );
                    })}
                  </div>
                  {/* 选中节点详情 */}
                  <AnimatePresence>
                    {selectedNode && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.15 }}
                        className="overflow-hidden">
                        <div className="mt-2 p-3 rounded-xl" style={{ background: S.s2, border: `1px solid ${S.border}` }}>
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-bold" style={{ color: S.text }}>{selectedNode.label}</span>
                              <span className="text-[8px] px-1.5 py-0.5 rounded"
                                style={{ background: `${NODE_CFG[selectedNode.type]?.color}15`, color: NODE_CFG[selectedNode.type]?.color }}>
                                {NODE_CFG[selectedNode.type]?.label}
                              </span>
                            </div>
                            <button onClick={() => setSelectedNode(null)} className="focus:outline-none">
                              <X size={12} style={{ color: S.text3 }} />
                            </button>
                          </div>
                          <div className="space-y-1 text-[9px]" style={{ color: S.text3 }}>
                            <div>节点ID: {selectedNode.id}</div>
                            <div>连接入: {NODE_EDGES.filter(e => e.to === selectedNode.id).map(e => e.from).join(", ") || "无（入口节点）"}</div>
                            <div>连接出: {NODE_EDGES.filter(e => e.from === selectedNode.id).map(e => `${e.to}${e.label ? `(${e.label})` : ""}`).join(", ") || "无（终点节点）"}</div>
                            {selectedNode.hasError && (
                              <div className="flex items-center gap-1 mt-1 px-2 py-1 rounded" style={{ background: S.error10 }}>
                                <AlertTriangle size={9} style={{ color: S.error }} />
                                <span style={{ color: S.error }}>{selectedNode.errorMsg}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── 分支路径分析 ── */}
        <div className="rounded-xl p-4" style={{ background: S.card, border: `1px solid ${S.border}` }}>
          <SectionHeader icon={GitBranch} title="分支路径分析" subtitle="2 条可玩路径 · 2 个结局"
            open={secBranch.open} onToggle={secBranch.toggle} />
          <AnimatePresence>
            {secBranch.open && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                <div className="mt-3 space-y-2">
                  {PATHS.map(path => (
                    <motion.div key={path.id}
                      onMouseEnter={() => setHoveredPath(path.nodes)}
                      onMouseLeave={() => setHoveredPath(undefined)}
                      className="p-3 rounded-xl cursor-pointer"
                      style={{ background: S.s2, border: `1px solid ${S.border}` }}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <Trophy size={11} style={{ color: path.type === "good" ? S.success : S.error }} />
                          <span className="text-[10px] font-bold" style={{ color: S.text }}>{path.label}</span>
                          <span className="text-[8px] px-1.5 py-0.5 rounded"
                            style={{ background: path.type === "good" ? S.success10 : S.error10, color: path.type === "good" ? S.success : S.error }}>
                            {path.ending}
                          </span>
                        </div>
                        <span className="text-[8px] font-mono" style={{ color: S.text3 }}>{path.nodes.length} 节点</span>
                      </div>
                      {/* 路径节点流 */}
                      <div className="flex items-center gap-0.5 flex-wrap">
                        {path.nodes.map((nid, i) => {
                          const node = STORY_NODES.find(n => n.id === nid);
                          const cfg = NODE_CFG[node?.type ?? "scene"];
                          return (
                            <div key={nid} className="flex items-center gap-0.5">
                              <div className="px-1.5 py-0.5 rounded text-[8px] font-medium"
                                style={{ background: `${cfg.color}12`, color: cfg.color, border: `1px solid ${cfg.color}25` }}>
                                {node?.label ?? nid}
                              </div>
                              {i < path.nodes.length - 1 && <ArrowRight size={8} style={{ color: S.text3 }} />}
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  ))}
                  <p className="text-[8px] text-center" style={{ color: S.text3 }}>
                    鼠标悬停路径可在上方节点图中高亮显示
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── 角色总览 ── */}
        <div className="rounded-xl p-4" style={{ background: S.card, border: `1px solid ${S.border}` }}>
          <SectionHeader icon={User} title="角色总览" subtitle="3 个核心角色"
            open={secChars.open} onToggle={secChars.toggle} />
          <AnimatePresence>
            {secChars.open && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                <div className="mt-3 space-y-2">
                  {CHARACTERS.map(char => (
                    <div key={char.name} className="p-3 rounded-xl" style={{ background: S.s2, border: `1px solid ${S.border}` }}>
                      <div className="flex items-start gap-2.5">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-lg"
                          style={{ background: `${char.color}12` }}>
                          {char.emoji}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-xs font-bold" style={{ color: S.text }}>{char.name}</span>
                            <span className="text-[8px] px-1.5 py-0.5 rounded" style={{ background: `${char.color}12`, color: char.color }}>
                              {char.role}
                            </span>
                          </div>
                          <p className="text-[9px] mb-1.5" style={{ color: S.text3 }}>{char.desc}</p>
                          <div className="flex items-center gap-1 flex-wrap">
                            <span className="text-[8px]" style={{ color: S.text3 }}>出场节点:</span>
                            {char.appearNodes.map(nid => {
                              const node = STORY_NODES.find(n => n.id === nid);
                              return (
                                <span key={nid} className="text-[8px] px-1 py-0.5 rounded font-mono"
                                  style={{ background: `${char.color}08`, color: char.color, border: `1px solid ${char.color}20` }}>
                                  {node?.label ?? nid}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                        <span className="text-[9px] font-mono shrink-0" style={{ color: S.text3 }}>
                          {char.appearNodes.length} 次
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── 世界观设定 ── */}
        <div className="rounded-xl p-4" style={{ background: S.card, border: `1px solid ${S.border}` }}>
          <SectionHeader icon={Activity} title="世界观设定" subtitle="故事背景与核心要素"
            open={secWorld.open} onToggle={secWorld.toggle} />
          <AnimatePresence>
            {secWorld.open && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                <div className="mt-3 grid grid-cols-1 gap-1.5">
                  {WORLD_BUILDING.map(wb => (
                    <div key={wb.category} className="p-2.5 rounded-lg" style={{ background: S.s2, border: `1px solid ${S.border}` }}>
                      <p className="text-[8px] font-bold uppercase tracking-wider mb-0.5" style={{ color: S.text3 }}>
                        {wb.category}
                      </p>
                      <p className="text-[10px] leading-relaxed" style={{ color: S.text2 }}>{wb.content}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── 项目健康度 ── */}
        <div className="rounded-xl p-4" style={{ background: S.card, border: `1px solid ${S.border}` }}>
          <SectionHeader icon={Activity} title="项目健康度" subtitle={`完成 ${doneCount}/${QUALITY_CHECKS.length} 项检查`}
            open={secHealth.open} onToggle={secHealth.toggle}
            action={
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-12 rounded-full overflow-hidden" style={{ background: S.s3 }}>
                  <div className="h-full rounded-full" style={{ width: `${healthPct}%`, background: healthPct > 70 ? S.success : S.warning }} />
                </div>
                <span className="text-[9px] font-mono font-bold" style={{ color: healthPct > 70 ? S.success : S.warning }}>
                  {healthPct}%
                </span>
              </div>
            } />
          <AnimatePresence>
            {secHealth.open && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                <div className="mt-3">
                  {QC_CATEGORIES.map(cat => {
                    const items = QUALITY_CHECKS.filter(qc => qc.category === cat.key);
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
                                <p className="text-[9px] font-bold" style={{ color: qc.status === "ok" ? S.success : qc.status === "warn" ? S.warning : S.error }}>
                                  {qc.label}
                                </p>
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
                  {/* 行业专属检查 */}
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
                            style={{
                              background: rule.severity === 'block' ? S.error10 : rule.severity === 'warn' ? S.warning10 : `${S.primary}08`,
                            }}>
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
          </AnimatePresence>
        </div>

        {/* ── 叙事质量评分 ── */}
        <div className="rounded-xl p-4" style={{ background: S.card, border: `1px solid ${S.border}` }}>
          <SectionHeader icon={Shield} title="叙事质量评分" subtitle={`${NARRATIVE_SCORES.length} 个维度综合评估`}
            open={secNarrative.open} onToggle={secNarrative.toggle}
            action={
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-mono font-black" style={{
                  color: totalScore >= 80 ? S.success : totalScore >= 60 ? S.warning : S.error
                }}>{totalScore}</span>
                <span className="text-[9px]" style={{ color: S.text3 }}>/100</span>
              </div>
            } />
          <AnimatePresence>
            {secNarrative.open && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                {/* 综合评分圆 */}
                <div className="flex items-center justify-center mt-4 mb-4">
                  <div className="relative flex items-center justify-center" style={{ width: 100, height: 100 }}>
                    <svg width="100" height="100" viewBox="0 0 100 100" className="absolute">
                      <circle cx="50" cy="50" r="42" fill="none" stroke={S.s3} strokeWidth="8" />
                      <circle cx="50" cy="50" r="42" fill="none"
                        stroke={totalScore >= 80 ? S.success : totalScore >= 60 ? S.warning : S.error}
                        strokeWidth="8" strokeLinecap="round"
                        strokeDasharray={`${totalScore * 2.64} 264`}
                        transform="rotate(-90 50 50)"
                        style={{ transition: 'stroke-dasharray 0.6s ease' }}
                      />
                    </svg>
                    <div className="text-center z-10">
                      <span className="text-2xl font-black font-mono" style={{
                        color: totalScore >= 80 ? S.success : totalScore >= 60 ? S.warning : S.error
                      }}>{totalScore}</span>
                      <span className="text-[10px] font-bold" style={{ color: S.text3 }}>/100</span>
                      <p className="text-[8px]" style={{ color: S.text3 }}>
                        {totalScore >= 80 ? '优秀' : totalScore >= 60 ? '良好' : '需改进'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 维度评分列表 */}
                <div className="space-y-2.5">
                  {NARRATIVE_SCORES.map((ns, i) => {
                    const pct = Math.round((ns.score / ns.maxScore) * 100);
                    const barColor = pct >= 80 ? S.success : pct >= 60 ? S.warning : S.error;
                    return (
                      <div key={i} className="p-3 rounded-xl" style={{ background: S.s2, border: `1px solid ${S.border}` }}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-bold" style={{ color: S.text }}>{dimLabel(ns.dimension)}</span>
                          <span className="text-[10px] font-mono font-bold" style={{ color: barColor }}>
                            {ns.score}/{ns.maxScore}
                          </span>
                        </div>
                        {/* 进度条 */}
                        <div className="h-1.5 rounded-full overflow-hidden mb-2" style={{ background: S.s3 }}>
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: barColor, transition: 'width 0.4s ease' }} />
                        </div>
                        <p className="text-[9px] mb-2" style={{ color: S.text3 }}>{ns.detail}</p>
                        {/* 优势 */}
                        {ns.strengths.length > 0 && (
                          <div className="mb-1.5">
                            {ns.strengths.map((s, j) => (
                              <div key={j} className="flex items-start gap-1 mb-0.5">
                                <CheckCircle2 size={9} style={{ color: S.success, marginTop: 2, flexShrink: 0 }} />
                                <span className="text-[8px]" style={{ color: S.success }}>{s}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {/* 改进建议 */}
                        {ns.improvements.length > 0 && (
                          <div>
                            {ns.improvements.map((imp, j) => (
                              <div key={j} className="flex items-start gap-1 mb-0.5">
                                <AlertTriangle size={9} style={{ color: S.warning, marginTop: 2, flexShrink: 0 }} />
                                <span className="text-[8px]" style={{ color: S.warning }}>{imp}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* 改进优先级建议 */}
                <div className="mt-3 p-3 rounded-xl" style={{ background: `${S.warning}08`, border: `1px solid ${S.warning}20` }}>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Target size={11} style={{ color: S.warning }} />
                    <span className="text-[10px] font-bold" style={{ color: S.warning }}>改进优先级</span>
                  </div>
                  <div className="space-y-1">
                    {[...NARRATIVE_SCORES]
                      .sort((a, b) => a.score - b.score)
                      .slice(0, 3)
                      .map((ns, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span className="text-[8px] font-mono font-bold shrink-0 mt-0.5" style={{ color: S.warning }}>
                            P{i + 1}
                          </span>
                          <div>
                            <span className="text-[9px] font-bold" style={{ color: S.text }}>{dimLabel(ns.dimension)}</span>
                            <span className="text-[8px] ml-1" style={{ color: S.text3 }}>
                              ({ns.score}分) — {ns.improvements[0]}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── 素材风格一致性 ── */}
        <div className="rounded-xl p-4" style={{ background: S.card, border: `1px solid ${S.border}` }}>
          <SectionHeader icon={Palette} title="素材风格一致性" subtitle={`${styleSummary.consistentCount}/${styleSummary.totalAssets} 项资产风格统一`}
            open={secStyle.open} onToggle={secStyle.toggle}
            action={
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-12 rounded-full overflow-hidden" style={{ background: S.s3 }}>
                  <div className="h-full rounded-full" style={{
                    width: `${styleSummary.consistencyRate}%`,
                    background: styleSummary.consistencyRate >= 80 ? S.success : styleSummary.consistencyRate >= 60 ? S.warning : S.error,
                  }} />
                </div>
                <span className="text-[9px] font-mono font-bold" style={{
                  color: styleSummary.consistencyRate >= 80 ? S.success : styleSummary.consistencyRate >= 60 ? S.warning : S.error,
                }}>{styleSummary.consistencyRate}%</span>
              </div>
            } />
          <AnimatePresence>
            {secStyle.open && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                {/* 摘要统计 */}
                <div className="grid grid-cols-4 gap-2 mt-3 mb-3">
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

                {/* 主风格标签 */}
                <div className="flex items-center gap-1.5 mb-3">
                  <span className="text-[9px]" style={{ color: S.text3 }}>主导风格:</span>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{
                    background: S.primary10, color: S.primary, border: `1px solid ${S.primary}20`,
                  }}>{styleSummary.dominant}</span>
                </div>

                {/* 资产风格表格 */}
                <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${S.border}` }}>
                  {/* 表头 */}
                  <div className="grid grid-cols-4 gap-1 px-3 py-2" style={{ background: S.s3 }}>
                    <span className="text-[8px] font-bold" style={{ color: S.text3 }}>节点</span>
                    <span className="text-[8px] font-bold" style={{ color: S.text3 }}>资产类型</span>
                    <span className="text-[8px] font-bold" style={{ color: S.text3 }}>风格</span>
                    <span className="text-[8px] font-bold text-right" style={{ color: S.text3 }}>状态</span>
                  </div>
                  {/* 行 */}
                  {STYLE_CONSISTENCY.map((item, i) => (
                    <div key={i} className="grid grid-cols-4 gap-1 px-3 py-2 items-center" style={{
                      background: item.consistent ? 'transparent' : `${S.error}06`,
                      borderTop: `1px solid ${S.border}`,
                    }}>
                      <span className="text-[9px] font-mono font-bold" style={{ color: S.text }}>{item.nodeId}</span>
                      <span className="text-[9px]" style={{ color: S.text2 }}>{item.assetType}</span>
                      <span className="text-[8px] px-1.5 py-0.5 rounded-full w-fit" style={{
                        background: item.consistent ? S.primary10 : `${S.error}12`,
                        color: item.consistent ? S.primary : S.error,
                        border: `1px solid ${item.consistent ? `${S.primary}20` : `${S.error}20`}`,
                      }}>{item.style}</span>
                      <div className="flex items-center justify-end gap-1">
                        {item.consistent
                          ? <CheckCircle2 size={10} style={{ color: S.success }} />
                          : <AlertTriangle size={10} style={{ color: S.error }} />}
                        <span className="text-[8px]" style={{ color: item.consistent ? S.success : S.error }}>
                          {item.consistent ? '一致' : '不一致'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 不一致项警告详情 */}
                {styleSummary.inconsistentCount > 0 && (
                  <div className="mt-3 space-y-2">
                    {STYLE_CONSISTENCY.filter(s => !s.consistent && s.warning).map((item, i) => (
                      <div key={i} className="flex items-start gap-2 p-3 rounded-xl" style={{
                        background: `${S.warning}08`, border: `1px solid ${S.warning}20`,
                      }}>
                        <AlertTriangle size={12} style={{ color: S.warning, marginTop: 1, flexShrink: 0 }} />
                        <div>
                          <p className="text-[9px] font-bold" style={{ color: S.warning }}>
                            {item.nodeId} · {item.assetType}
                          </p>
                          <p className="text-[8px] mt-0.5" style={{ color: S.text3 }}>{item.warning}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 改进建议 */}
                <div className="mt-3 p-3 rounded-xl" style={{ background: S.s2, border: `1px solid ${S.border}` }}>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Sparkles size={11} style={{ color: S.primary }} />
                    <span className="text-[10px] font-bold" style={{ color: S.text }}>风格统一建议</span>
                  </div>
                  <p className="text-[9px] leading-relaxed" style={{ color: S.text2 }}>
                    建议将线人立绘统一为赛博朋克风格，或调整角色设定以兼容写实风格。保持视觉风格一致性有助于提升玩家的沉浸感和整体体验品质。
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── 下一步建议 ── */}
        <div className="rounded-xl p-4" style={{ background: `linear-gradient(135deg,${S.primary}08,${S.accent}08)`, border: `1px solid ${S.primary}20` }}>
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

        {/* ── 协作成员（占位）────────────────────────────────────────────── */}
        <div className="p-4 rounded-xl" style={{ background:S.card, border:`1px solid ${S.border}` }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Users size={14} style={{ color:S.primary }} />
              <h2 className="text-xs font-bold" style={{ color:S.text }}>协作成员</h2>
            </div>
            <span className="text-[9px] font-bold px-2 py-0.5 rounded"
              style={{ background:`${S.text3}12`, color:S.text3 }}>即将上线</span>
          </div>
          <div className="flex items-center justify-center py-6 rounded-lg" style={{ background:S.s2, border:`1px dashed ${S.border}` }}>
            <div className="text-center">
              <Users size={24} style={{ color:`${S.text3}40` }} />
              <p className="text-[10px] mt-2" style={{ color:S.text3 }}>邀请团队成员共同编辑项目</p>
              <p className="text-[9px] mt-1" style={{ color:`${S.text3}80` }}>版本管理与实时协作功能正在开发中</p>
            </div>
          </div>
        </div>

        <div className="h-6" />
      </div>
    </div>
  );
}
