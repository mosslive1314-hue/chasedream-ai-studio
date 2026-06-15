import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, AlertTriangle, ChevronRight, ChevronDown,
  Package, Sparkles, ArrowRight, Users, MapPin, Wrench,
  Image, Music, Mic, Film, Edit2,
  Library, Search, FileText,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useLocation } from "@tanstack/react-router";
import { UpstreamReadiness } from "@/components/ui/UpstreamReadiness";
import ContextualActions from "@/components/ui/ContextualActions";
import UnifiedAssetCard from "@/components/ui/UnifiedAssetCard";
import { INDUSTRY_ASSET_TYPES, INDUSTRY_LABELS, type IndustryType, type AssetCard } from "@/lib/studio-data";
import { useNarrativeStore, useUIStore } from "@/store";

const S = {
  bg:"#F5F6FA", card:"#FFFFFF", s2:"#F4F6FC",
  border:"#E8EAF2", primary:"#7C6CF5", accent:"#00A99D",
  text:"#1A1D2E", text2:"#4A5068", text3:"#8892B0",
  success:"#10B981", warning:"#F59E0B", error:"#EF4444",
};

// ── UI 模板类型（对应节点类型）────────────────────────────────────────────
const UI_TEMPLATES = [
  { type:"scene",    label:"剧情播放",  desc:"全屏视频/图+旁白+继续按钮",       color:"#7C6CF5" },
  { type:"choice",   label:"玩家选择",  desc:"视频/图+底部2-4个选项按钮",       color:"#F59E0B" },
  { type:"qte",      label:"QTE反应",  desc:"视频+倒计时条+快速点击区",         color:"#EF4444" },
  { type:"condition",label:"条件判断",  desc:"无UI，后台自动算变量跳转",         color:"#8892B0" },
  { type:"ending",   label:"结局画面",  desc:"全屏结局画面+重玩/分享按钮",       color:"#10B981" },
];

// ── 行业配置（P6-6）───────────────────────────────────────────────
const INDUSTRY_OPTIONS: { type: IndustryType; icon: string; label: string }[] = [
  { type: 'game', icon: '🎮', label: '游戏' },
  { type: 'tourism', icon: '🏛️', label: '文旅' },
  { type: 'education', icon: '🎓', label: '教育' },
  { type: 'derivative', icon: '🎬', label: '衍生' },
];

const INDUSTRY_NODE_PREFIX: Record<IndustryType, string> = {
  game: '节点',
  tourism: '体验点',
  education: '学习环节',
  derivative: '剧情片段',
};

const INDUSTRY_SUGGESTIONS: Record<IndustryType, string[]> = {
  game: [
    'BGM 覆盖率需达到 100%',
    '角色立绘建议包含多表情状态',
    'QTE 节点需要专属 UI 素材',
  ],
  tourism: [
    '建议添加 AR 标记以提升互动体验',
    '展品照片建议使用统一白底背景',
    '音频讲解建议控制在 30 秒内',
  ],
  education: [
    '建议为每个知识点添加思维导图',
    '实验图建议使用矢量格式',
    '题目截图需包含解析',
  ],
  derivative: [
    '视频片段建议统一分辨率',
    '分镜图需与视频时间码对应',
    '建议添加字幕文件提升可访问性',
  ],
};

const ASSET_FILTER_MAP: Record<string, (a: AssetCard) => boolean> = {
  image: a => a.hasImage, character: a => a.hasImage, bgm: a => a.hasBgm,
  sfx: a => a.hasVoice, voice: a => a.hasVoice, video: a => a.hasVideo, ui: a => a.hasImage,
  exhibit_photo: a => a.hasImage, history_photo: a => a.hasImage, map: a => a.hasImage,
  audio_guide: a => a.hasVoice, qr_code: a => a.hasImage, ar_marker: a => a.hasImage,
  courseware: a => a.hasImage, animation: a => a.hasVideo, quiz_image: a => a.hasImage,
  experiment: a => a.hasImage, mindmap: a => a.hasImage, knowledge_card: a => a.hasImage,
  video_clip: a => a.hasVideo, storyboard: a => a.hasImage, film_still: a => a.hasImage,
  character_poster: a => a.hasImage, promo: a => a.hasImage, subtitle: a => a.hasVoice,
};

export default function AssetsScreen() {
  const location = useLocation();
  const pathname = location.pathname;
  // ── Store selectors ──
  const storyNodes = useNarrativeStore(s => s.storyNodes);
  const nodeEdges = useNarrativeStore(s => s.nodeEdges);
  const gameScenes = useNarrativeStore(s => s.scenes);
  const gameCharacters = useNarrativeStore(s => s.characters);
  const gameProps = useNarrativeStore(s => s.props);
  const assetCards = useNarrativeStore(s => s.assetCards);
  const scriptBlocks = useNarrativeStore(s => s.scriptBlocks);
  const industry = useUIStore(s => s.industry);
  const setIndustry = useUIStore(s => s.setIndustry);
  const addToast = useUIStore(s => s.addToast);
  const proMode = useUIStore(s => s.proMode);
  const searchParams = new URLSearchParams(location.search);
  const activeTab = searchParams.get("tab") || "image";

  const [viewMode, setViewMode] = useState<"pipeline" | "by-node">("pipeline");
  const [activeAssetFilter, setActiveAssetFilter] = useState<string | null>(null);
  const [mgmtPanelOpen, setMgmtPanelOpen] = useState(false);

  // ── Dynamic video pipeline data ─────────────────────────────────────────
  const videoPipeline = useMemo(() => {
    // Opening: first story node as opening sequence
    const openingItems = storyNodes.length > 0
      ? [{ name: storyNodes[0].label || storyNodes[0].id, duration: "01:30", status: "待渲染", statusColor: S.text3 }]
      : [];

    // Transitions: from nodeEdges
    const transitionItems = nodeEdges.length > 0
      ? nodeEdges.slice(0, 5).map(edge => {
          const fromNode = storyNodes.find(n => n.id === edge.from);
          const toNode = storyNodes.find(n => n.id === edge.to);
          const fromLabel = fromNode?.label || edge.from;
          const toLabel = toNode?.label || edge.to;
          const transTypes = ["淡入", "溶解", "硬切"];
          const t = transTypes[Math.floor(Math.random() * transTypes.length)];
          return { name: `${fromLabel}→${toLabel} ${t}`, duration: "00:04", status: "待渲染", statusColor: S.text3 };
        })
      : [];

    // QTE: nodes with qte type or QTE-related labels
    const qteNodes = storyNodes.filter(n => n.type === "qte" || n.label.includes("QTE"));
    const qteItems = qteNodes.length > 0
      ? qteNodes.map(n => ({ name: `${n.label} QTE`, duration: "00:45", status: "待渲染", statusColor: S.text3 }))
      : [];

    // Cutscene: ending nodes
    const endingNodes = storyNodes.filter(n => n.type.startsWith("ending"));
    const cutsceneItems = endingNodes.length > 0
      ? endingNodes.map(n => ({ name: `${n.label} CG`, duration: "00:25", status: "待渲染", statusColor: S.text3 }))
      : [];

    return [
      { id: "opening", icon: Film, label: "开场/结尾动画", desc: "序章和结局的标志性动画片段", items: openingItems },
      { id: "transition", icon: ArrowRight, label: "转场动画", desc: "节点之间的过渡动画与镜头运动", items: transitionItems },
      { id: "qte", icon: Sparkles, label: "QTE 动作片段", desc: "限时选择和快速反应的动作演出", items: qteItems },
      { id: "cutscene", icon: Sparkles, label: "过场 CG", desc: "关键剧情的高品质 CG 动画", items: cutsceneItems },
    ];
  }, [storyNodes, nodeEdges]);

  // ── Dynamic audio category data ─────────────────────────────────────────
  const audioCategories = useMemo(() => {
    // BGM: non-ending story nodes
    const nonEndingNodes = storyNodes.filter(n => !n.type.startsWith("ending"));
    const bgmItems = nonEndingNodes.length > 0
      ? nonEndingNodes.slice(0, 6).map(n => ({
          name: `BGM·${n.label}`, duration: "02:00", mood: "待定", status: "待混音", statusColor: S.text3,
        }))
      : [];

    // SFX: based on node types
    const typeSfxMap: Record<string, string> = {
      qte: "QTE 反馈音效", choice: "选择点击音效", condition: "条件触发音效",
      start: "开场音效", scene: "场景切换音效", ending_good: "胜利音效", ending_bad: "失败音效",
    };
    const seenTypes = new Set<string>();
    const sfxItems: { name: string; duration: string; mood: string; status: string; statusColor: string }[] = [];
    storyNodes.forEach(n => {
      const sfxName = typeSfxMap[n.type];
      if (sfxName && !seenTypes.has(n.type)) {
        seenTypes.add(n.type);
        sfxItems.push({ name: sfxName, duration: "00:03", mood: n.type, status: "待制作", statusColor: S.text3 });
      }
    });

    // Voice: one entry per character
    const voiceItems = gameCharacters.length > 0
      ? gameCharacters.map(c => ({
          name: `${c.name}·配音集`, duration: "05:00", mood: c.role, status: "待录制", statusColor: S.text3,
        }))
      : [];

    // Ambient: one entry per scene
    const ambientItems = gameScenes.length > 0
      ? gameScenes.map(sc => ({
          name: `${sc.name}·环境音`, duration: "03:00", mood: sc.atmosphere || "沉浸", status: "待录制", statusColor: S.text3,
        }))
      : [];

    return [
      { id: "bgm", label: "BGM 背景音乐", icon: Music, color: "#8B5CF6", items: bgmItems },
      { id: "sfx", label: "SFX 音效", icon: Music, color: "#F59E0B", items: sfxItems },
      { id: "voice", label: "Voice 配音", icon: Mic, color: S.accent, items: voiceItems },
      { id: "ambient", label: "Ambient 环境音", icon: Music, color: "#06B6D4", items: ambientItems },
    ];
  }, [storyNodes, gameCharacters, gameScenes]);

  // ── Empty state check ───────────────────────────────────────────────────
  if (assetCards.length === 0) {
    return (
      <div className="h-svh flex items-center justify-center" style={{ background: S.bg }}>
        <div className="text-center max-w-md p-8">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: '#F4F6FC' }}>
            <Package size={28} style={{ color: '#7C6CF5' }} />
          </div>
          <h3 className="text-base font-bold mb-2" style={{ color: '#1a1a2e' }}>还没有资产需求</h3>
          <p className="text-sm text-gray-500 mb-4">节点设计完成后，这里会自动生成资产需求</p>
          <Link to="/nodes" className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-bold text-white" style={{ background: '#7C6CF5' }}>
            前往节点设计 →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-svh flex flex-col" style={{ background:S.bg }}>
      <UpstreamReadiness currentPath={pathname} />

      {/* ── 顶层资产类型 Tab 栏 ── */}
      <div className="flex items-center gap-2 px-4 py-2 shrink-0"
        style={{ background: S.card, borderBottom: `1px solid ${S.border}` }}>
        {[
          { id: "text", label: "文本", icon: FileText },
          { id: "image", label: "图片", icon: Image },
          { id: "audio", label: "音频", icon: Music },
          { id: "video", label: "视频", icon: Film },
          { id: "library", label: "资产库", icon: Library },
        ].map(tab => (
          <Link key={tab.id} to="/assets">
            <motion.button whileTap={{ scale: 0.96 }}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold focus:outline-none transition-all"
              style={{
                background: activeTab === tab.id ? S.primary : "transparent",
                color: activeTab === tab.id ? "#fff" : S.text3,
                border: `1px solid ${activeTab === tab.id ? S.primary : S.border}`,
              }}>
              <tab.icon size={13} />
              {tab.label}
            </motion.button>
          </Link>
        ))}
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          IMAGE TAB — simplified: header stats + industry bar + by-type / by-node
          ════════════════════════════════════════════════════════════════════ */}
      {activeTab === "image" && (<>
        {/* ── Image header stats ── */}
        <div className="flex items-center gap-3 px-4 py-3 shrink-0"
          style={{ background: S.card, borderBottom: `1px solid ${S.border}` }}>
          <div className="flex items-center gap-2 flex-1">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${S.primary}12` }}>
              <Image size={16} style={{ color: S.primary }} />
            </div>
            <div>
              <h2 className="text-xs font-bold" style={{ color: S.text }}>图片资产</h2>
              <p className="text-[9px]" style={{ color: S.text3 }}>场景背景图、角色立绘、道具图</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {[
              { label: `${INDUSTRY_NODE_PREFIX[industry]}总数`, value: storyNodes.length, color: S.primary },
              { label: "需要图片", value: assetCards.filter(a => !a.hasImage).length, color: S.warning },
              { label: "已有图片", value: assetCards.filter(a => a.hasImage).length, color: S.success },
            ].map(stat => (
              <div key={stat.label} className="text-center px-3 py-1.5 rounded-lg" style={{ background: S.s2, border: `1px solid ${S.border}` }}>
                <span className="text-xs font-bold font-mono block" style={{ color: stat.color }}>{stat.value}</span>
                <span className="text-[8px]" style={{ color: S.text3 }}>{stat.label}</span>
              </div>
            ))}
          </div>
          {/* View mode toggle + link */}
          <div className="flex items-center gap-1.5">
            <div className="flex items-center rounded-lg overflow-hidden" style={{ border: `1px solid ${S.border}` }}>
              <motion.button whileTap={{ scale: 0.97 }}
                onClick={() => setViewMode("pipeline")}
                className="px-3 py-1.5 text-[10px] font-bold focus:outline-none"
                style={{ background: viewMode === "pipeline" ? S.primary : S.s2, color: viewMode === "pipeline" ? "#fff" : S.text3 }}>
                按类型
              </motion.button>
              <motion.button whileTap={{ scale: 0.97 }}
                onClick={() => setViewMode("by-node")}
                className="px-3 py-1.5 text-[10px] font-bold focus:outline-none"
                style={{ background: viewMode === "by-node" ? S.primary : S.s2, color: viewMode === "by-node" ? "#fff" : S.text3 }}>
                按节点
              </motion.button>
            </div>
            <Link to="/nodes">
              <motion.button whileTap={{ scale:0.97 }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white focus:outline-none"
                style={{ background:`linear-gradient(135deg,${S.primary},#A78BFA)` }}>
                进入节点图编辑 <ArrowRight size={11} />
              </motion.button>
            </Link>
          </div>
        </div>

        {/* ── 行业切换条（P6-6）── */}
        <div className="flex items-center gap-2 px-4 py-2 shrink-0"
          style={{ background: S.card, borderBottom: `1px solid ${S.border}` }}>
          <span className="text-[9px] font-bold" style={{ color: S.text3 }}>行业模式</span>
          <div className="flex items-center gap-1.5">
            {INDUSTRY_OPTIONS.map(opt => (
              <motion.button key={opt.type} whileTap={{ scale: 0.96 }}
                onClick={() => { setIndustry(opt.type); setActiveAssetFilter(null); }}
                className="px-3 py-1 rounded-full text-[10px] font-bold focus:outline-none transition-all"
                style={{
                  background: industry === opt.type ? '#5E50E8' : S.s2,
                  color: industry === opt.type ? '#fff' : S.text2,
                  border: industry === opt.type ? 'none' : `1px solid ${S.border}`,
                }}>
                {opt.icon} {opt.label}
              </motion.button>
            ))}
          </div>
          <div className="ml-auto text-[9px]" style={{ color: S.text3 }}>
            {INDUSTRY_LABELS.asset[industry]} · {INDUSTRY_LABELS.pipeline[industry]}
          </div>
        </div>

        {/* ── 资产管理面板（可折叠，仅专业模式）── */}
        {proMode && (
        <div className="shrink-0" style={{ borderBottom: `1px solid ${S.border}` }}>
          <motion.button whileTap={{ scale: 0.995 }}
            onClick={() => setMgmtPanelOpen(v => !v)}
            className="w-full flex items-center gap-2 px-4 py-2 focus:outline-none"
            style={{ background: `${S.primary}04` }}>
            <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: `${S.primary}12` }}>
              <Package size={11} style={{ color: S.primary }} />
            </div>
            <span className="text-[10px] font-bold" style={{ color: S.text }}>资产管理面板</span>
            <span className="text-[8px] px-1.5 py-0.5 rounded" style={{ background: `${S.primary}10`, color: S.primary }}>
              {gameCharacters.length + gameScenes.length + gameProps.length} 项
            </span>
            <div className="flex-1" />
            <motion.div animate={{ rotate: mgmtPanelOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown size={14} style={{ color: S.text3 }} />
            </motion.div>
          </motion.button>

          <AnimatePresence>
            {mgmtPanelOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-3 space-y-2.5">
                  {/* ── 角色管理 ── */}
                  <div className="rounded-xl p-3" style={{ background: S.card, border: `1px solid ${S.border}` }}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: `${S.accent}12` }}>
                        <Users size={11} style={{ color: S.accent }} />
                      </div>
                      <span className="text-[10px] font-bold" style={{ color: S.text }}>角色管理</span>
                      <span className="text-[8px] px-1.5 py-0.5 rounded font-bold" style={{ background: `${S.accent}12`, color: S.accent }}>
                        {gameCharacters.length} 位
                      </span>
                      <div className="flex-1" />
                      <Link to="/script">
                        <motion.button whileTap={{ scale: 0.96 }}
                          className="text-[8px] px-2 py-0.5 rounded-lg font-bold focus:outline-none"
                          style={{ background: `${S.accent}10`, color: S.accent, border: `1px solid ${S.accent}25` }}>
                          + 添加角色
                        </motion.button>
                      </Link>
                    </div>
                    {gameCharacters.length === 0 ? (
                      <p className="text-[9px] text-center py-2" style={{ color: S.text3 }}>暂无角色</p>
                    ) : (
                      <div className="grid grid-cols-4 gap-1.5">
                        {gameCharacters.map(c => (
                          <Link key={c.id} to="/script">
                            <div className="flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors hover:bg-gray-50"
                              style={{ background: S.s2, border: `1px solid ${S.border}` }}>
                              <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                                style={{ background: `${c.color}15` }}>
                                <span className="text-[10px]">{c.emoji}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[9px] font-bold truncate" style={{ color: S.text }}>{c.name}</p>
                                <div className="flex items-center gap-1">
                                  <span className="text-[7px]" style={{ color: S.text3 }}>{c.role}</span>
                                  <span className="text-[7px] px-1 rounded" style={{ background: `${S.primary}08`, color: S.primary }}>
                                    {c.appearNodes.length} 节点
                                  </span>
                                </div>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* ── 场景管理 ── */}
                  <div className="rounded-xl p-3" style={{ background: S.card, border: `1px solid ${S.border}` }}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: `${S.primary}12` }}>
                        <MapPin size={11} style={{ color: S.primary }} />
                      </div>
                      <span className="text-[10px] font-bold" style={{ color: S.text }}>场景管理</span>
                      <span className="text-[8px] px-1.5 py-0.5 rounded font-bold" style={{ background: `${S.primary}12`, color: S.primary }}>
                        {gameScenes.length} 个
                      </span>
                      <div className="flex-1" />
                      <Link to="/cinematic">
                        <motion.button whileTap={{ scale: 0.96 }}
                          className="text-[8px] px-2 py-0.5 rounded-lg font-bold focus:outline-none"
                          style={{ background: `${S.primary}10`, color: S.primary, border: `1px solid ${S.primary}25` }}>
                          + 添加场景
                        </motion.button>
                      </Link>
                    </div>
                    {gameScenes.length === 0 ? (
                      <p className="text-[9px] text-center py-2" style={{ color: S.text3 }}>暂无场景</p>
                    ) : (
                      <div className="grid grid-cols-4 gap-1.5">
                        {gameScenes.map(sc => (
                          <Link key={sc.id} to="/cinematic">
                            <div className="flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors hover:bg-gray-50"
                              style={{ background: S.s2, border: `1px solid ${S.border}` }}>
                              <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                                style={{ background: sc.hasImage && sc.imageUrl ? undefined : `${S.primary}10` }}>
                                {sc.hasImage && sc.imageUrl
                                  ? <img src={sc.imageUrl} className="w-full h-full object-cover rounded-md" alt="" />
                                  : <MapPin size={11} style={{ color: S.primary }} />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[9px] font-bold truncate" style={{ color: S.text }}>{sc.name}</p>
                                <div className="flex items-center gap-1">
                                  <span className="text-[7px]" style={{ color: S.text3 }}>{sc.atmosphere}</span>
                                  <span className="text-[7px] px-1 rounded" style={{ background: `${S.primary}08`, color: S.primary }}>
                                    {sc.refNodes.length} 节点
                                  </span>
                                </div>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* ── 道具管理 ── */}
                  <div className="rounded-xl p-3" style={{ background: S.card, border: `1px solid ${S.border}` }}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: `${S.warning}12` }}>
                        <Wrench size={11} style={{ color: S.warning }} />
                      </div>
                      <span className="text-[10px] font-bold" style={{ color: S.text }}>道具管理</span>
                      <span className="text-[8px] px-1.5 py-0.5 rounded font-bold" style={{ background: `${S.warning}12`, color: S.warning }}>
                        {gameProps.length} 件
                      </span>
                    </div>
                    {gameProps.length === 0 ? (
                      <p className="text-[9px] text-center py-2" style={{ color: S.text3 }}>暂无道具</p>
                    ) : (
                      <div className="grid grid-cols-4 gap-1.5">
                        {gameProps.map(p => (
                          <div key={p.id} className="flex items-center gap-2 p-2 rounded-lg"
                            style={{ background: S.s2, border: `1px solid ${S.border}` }}>
                            <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                              style={{ background: p.hasImage ? undefined : `${S.warning}10` }}>
                              {p.hasImage
                                ? <CheckCircle2 size={11} style={{ color: S.success }} />
                                : <Wrench size={11} style={{ color: S.warning }} />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[9px] font-bold truncate" style={{ color: S.text }}>{p.name}</p>
                              <div className="flex items-center gap-1">
                                <span className="text-[7px]" style={{ color: S.text3 }}>{p.type}</span>
                                <span className="text-[7px] px-1 rounded" style={{ background: `${S.warning}08`, color: S.warning }}>
                                  {p.refNodes.length} 节点
                                </span>
                              </div>
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
        )}

        {/* ── 主内容区 ── */}
        <div className="flex-1 overflow-hidden flex">
          {/* ── By-type view (simplified grid) ── */}
          {viewMode === "pipeline" && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <AnimatePresence mode="wait">
                <motion.div key="image-by-type" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="grid grid-cols-3 gap-3">
                    {assetCards.map(asset => (
                      <UnifiedAssetCard
                        key={asset.nodeId}
                        id={asset.nodeId}
                        title={asset.nodeLabel}
                        subtitle={asset.nodeId}
                        sourceNode={asset.nodeId}
                        sourceNodeLabel={asset.nodeLabel}
                        type="image"
                        status={asset.hasImage ? "ready" : "pending"}
                        statusLabel={asset.hasImage ? "图片就绪" : "待生成"}
                        onGenerate={!asset.hasImage ? () => {
                          addToast({ type: "success", title: "已提交生成", message: `${asset.nodeLabel} 图片生成任务已提交` });
                        } : undefined}
                        metaItems={[
                          { label: "类型", value: storyNodes.find(n => n.id === asset.nodeId)?.type || "scene", color: S.primary },
                        ]}
                      />
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          )}

          {/* ── By-node view — asset dependency board (kept as-is) ── */}
          {viewMode === "by-node" && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* 行业资产类型筛选（P6-6） */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[9px] font-bold shrink-0" style={{ color: S.text3 }}>
                  {INDUSTRY_LABELS.asset[industry]}类型
                </span>
                <motion.button whileTap={{ scale: 0.96 }}
                  onClick={() => setActiveAssetFilter(null)}
                  className="px-2.5 py-0.5 rounded-full text-[9px] font-bold focus:outline-none"
                  style={{
                    background: activeAssetFilter === null ? '#5E50E8' : S.s2,
                    color: activeAssetFilter === null ? '#fff' : S.text2,
                    border: activeAssetFilter === null ? 'none' : `1px solid ${S.border}`,
                  }}>
                  全部
                </motion.button>
                {INDUSTRY_ASSET_TYPES.find(t => t.industryType === industry)?.assetTypes.map(at => (
                  <motion.button key={at.key} whileTap={{ scale: 0.96 }}
                    onClick={() => setActiveAssetFilter(activeAssetFilter === at.key ? null : at.key)}
                    className="px-2.5 py-0.5 rounded-full text-[9px] font-bold focus:outline-none"
                    style={{
                      background: activeAssetFilter === at.key ? '#5E50E8' : S.s2,
                      color: activeAssetFilter === at.key ? '#fff' : S.text2,
                      border: activeAssetFilter === at.key ? 'none' : `1px solid ${S.border}`,
                    }}>
                    {at.icon} {at.label}
                  </motion.button>
                ))}
              </div>

              {/* Summary stats */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: `${INDUSTRY_LABELS.node[industry]}总数`, value: storyNodes.length, color: S.primary },
                  { label: `有${INDUSTRY_ASSET_TYPES.find(t => t.industryType === industry)?.assetTypes[0]?.label || '图片'}`, value: assetCards.filter(a => a.hasImage).length, color: S.success },
                  { label: `缺${INDUSTRY_ASSET_TYPES.find(t => t.industryType === industry)?.assetTypes[2]?.label || 'BGM'}`, value: assetCards.filter(a => !a.hasBgm).length, color: S.warning },
                  { label: `${INDUSTRY_LABELS.asset[industry]}覆盖率`, value: `${Math.round(assetCards.filter(a => a.hasImage).length / assetCards.length * 100)}%`, color: S.accent },
                ].map(stat => (
                  <div key={stat.label} className="p-3 rounded-xl text-center"
                    style={{ background: S.card, border: `1px solid ${S.border}` }}>
                    <p className="text-lg font-bold font-mono" style={{ color: stat.color }}>{stat.value}</p>
                    <p className="text-[9px]" style={{ color: S.text3 }}>{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Priority production board */}
              <div className="p-4 rounded-xl" style={{ background: S.card, border: `1px solid ${S.border}` }}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold" style={{ color: S.text }}>{INDUSTRY_LABELS.asset[industry]}生产看板</h3>
                  <div className="flex gap-1.5">
                    <motion.button whileTap={{ scale: 0.97 }}
                      onClick={() => {
                        addToast({ type: "success", title: "批量生成", message: `已提交全部 ${INDUSTRY_ASSET_TYPES.find(t => t.industryType === industry)?.assetTypes[2]?.label || 'BGM'} 生成任务` });
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-bold focus:outline-none"
                      style={{ background: `${S.warning}12`, border: `1px solid ${S.warning}25`, color: S.warning }}>
                      <Music size={9} /> 一键生成全部 {INDUSTRY_ASSET_TYPES.find(t => t.industryType === industry)?.assetTypes[2]?.label || 'BGM'}
                    </motion.button>
                  </div>
                </div>

                {/* Priority groups */}
                {[
                  {
                    priority: "阻塞发布",
                    color: S.error,
                    items: assetCards.filter(a => !a.hasImage && (!activeAssetFilter || (ASSET_FILTER_MAP[activeAssetFilter]?.(a) ?? true))).map(a => ({
                      node: a, type: INDUSTRY_ASSET_TYPES.find(t => t.industryType === industry)?.assetTypes[0]?.label || "场景图片", reason: `缺少核心${INDUSTRY_LABELS.asset[industry]}`
                    }))
                  },
                  {
                    priority: "影响体验",
                    color: S.warning,
                    items: assetCards.filter(a => !a.hasBgm && (!activeAssetFilter || (ASSET_FILTER_MAP[activeAssetFilter]?.(a) ?? true))).map(a => ({
                      node: a, type: INDUSTRY_ASSET_TYPES.find(t => t.industryType === industry)?.assetTypes[2]?.label || "背景音乐", reason: `缺少 ${INDUSTRY_ASSET_TYPES.find(t => t.industryType === industry)?.assetTypes[2]?.label || 'BGM'} 影响沉浸感`
                    }))
                  },
                ].map(group => group.items.length > 0 && (
                  <div key={group.priority} className="mb-3">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ background: group.color }} />
                      <span className="text-[9px] font-bold" style={{ color: group.color }}>{group.priority}</span>
                      <span className="text-[8px] px-1.5 py-0.5 rounded" style={{ background: `${group.color}10`, color: group.color }}>
                        {group.items.length} 项
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {group.items.map((item, i) => (
                        <div key={i} className="flex items-center gap-2 p-2 rounded-lg"
                          style={{ background: S.s2, border: `1px solid ${S.border}` }}>
                          <div className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center"
                            style={{ background: `${group.color}10` }}>
                            {item.node.hasImage && item.node.imageUrl
                              ? <img src={item.node.imageUrl} className="w-full h-full object-cover rounded-lg" alt="" />
                              : <Image size={14} style={{ color: group.color }} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[9px] font-bold truncate" style={{ color: S.text }}>{INDUSTRY_NODE_PREFIX[industry]}: {item.node.nodeLabel}</p>
                            <p className="text-[8px]" style={{ color: S.text3 }}>缺 {item.type}</p>
                          </div>
                          <motion.button whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              addToast({ type: "success", title: "已提交生成", message: `${item.node.nodeLabel} ${item.type} 生成任务已提交` });
                            }}
                            className="px-2 py-0.5 rounded text-[8px] font-bold shrink-0 focus:outline-none"
                            style={{ background: `${S.primary}10`, color: S.primary, border: `1px solid ${S.primary}20` }}>
                            生成
                          </motion.button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Node detail cards */}
              <div className="p-4 rounded-xl" style={{ background: S.card, border: `1px solid ${S.border}` }}>
                <h3 className="text-xs font-bold mb-3" style={{ color: S.text }}>{INDUSTRY_NODE_PREFIX[industry]}资产依赖详情</h3>
                <div className="space-y-2">
                  {assetCards.filter(a => !activeAssetFilter || (ASSET_FILTER_MAP[activeAssetFilter]?.(a) ?? true)).map(asset => {
                    const node = storyNodes.find(n => n.id === asset.nodeId);
                    const scene = gameScenes.find(s => s.refNodes.includes(asset.nodeId));
                    const chars = gameCharacters.filter(c => c.appearNodes.includes(asset.nodeId));
                    const props = gameProps.filter(p => p.refNodes.includes(asset.nodeId));
                    const missing = [!asset.hasImage, !asset.hasBgm, !asset.hasVoice, !asset.hasVideo].filter(Boolean).length;

                    return (
                      <div key={asset.nodeId} className="p-3 rounded-xl"
                        style={{ background: S.s2, border: `1px solid ${missing > 0 ? `${S.warning}30` : `${S.success}30`}` }}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold" style={{ color: S.text }}>{INDUSTRY_NODE_PREFIX[industry]}: {asset.nodeLabel}</span>
                            <span className="text-[8px] px-1.5 py-0.5 rounded"
                              style={{ background: node ? `${S.primary}10` : S.s2, color: S.primary }}>
                              {node?.type || "unknown"}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            {[
                              { label: "图", ok: asset.hasImage },
                              { label: "乐", ok: asset.hasBgm },
                              { label: "声", ok: asset.hasVoice },
                              { label: "视", ok: asset.hasVideo },
                            ].map(a => (
                              <span key={a.label} className="text-[7px] px-1 py-0.5 rounded font-bold"
                                style={{
                                  background: a.ok ? `${S.success}15` : `${S.error}10`,
                                  color: a.ok ? S.success : S.error
                                }}>
                                {a.label}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Dependencies */}
                        <div className="flex gap-3 text-[8px]" style={{ color: S.text3 }}>
                          {scene && (
                            <span>📍 {scene.name}</span>
                          )}
                          {chars.length > 0 && (
                            <span>👤 {chars.map(c => c.name).join(", ")}</span>
                          )}
                          {props.length > 0 && (
                            <span>🔧 {props.map(p => p.name).join(", ")}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 行业资产建议面板（P6-6） */}
              <div className="p-4 rounded-xl" style={{ background: '#F8F7FF', border: `1px solid ${S.border}` }}>
                <div className="flex items-center gap-1.5 mb-2">
                  <Sparkles size={12} style={{ color: '#5E50E8' }} />
                  <h3 className="text-[10px] font-bold" style={{ color: S.text }}>行业资产建议</h3>
                  <span className="text-[8px] px-1.5 py-0.5 rounded" style={{ background: `${S.primary}12`, color: S.primary }}>
                    {INDUSTRY_LABELS.asset[industry]}
                  </span>
                </div>
                <div className="space-y-1.5">
                  {INDUSTRY_SUGGESTIONS[industry].map((s, i) => (
                    <div key={i} className="flex items-start gap-2 p-2 rounded-lg" style={{ background: '#fff' }}>
                      <span className="text-[9px] mt-0.5">💡</span>
                      <span className="text-[9px] leading-relaxed" style={{ color: S.text2 }}>{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Next Step Navigation */}
        <div className="shrink-0 bg-white border-t border-gray-200 px-6 py-3 flex items-center justify-between"
          style={{ borderColor: S.border }}>
          <span className="text-xs text-gray-500">下一步：查看质检结果</span>
          <Link to="/overview" className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white" style={{ background: '#7C6CF5' }}>
            前往质检总览 →
          </Link>
        </div>
      </>)}

      {/* ════════════════════════════════════════════════════════════════════
          VIDEO TAB — UnifiedAssetCard grid
          ════════════════════════════════════════════════════════════════════ */}
      {activeTab === "video" && (<>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${S.primary}12` }}>
              <Film size={20} style={{ color: S.primary }} />
            </div>
            <div className="flex-1">
              <h2 className="text-sm font-bold" style={{ color: S.text }}>视频素材生产</h2>
              <p className="text-[10px]" style={{ color: S.text3 }}>开场动画、转场片段、QTE 动作与过场 CG</p>
            </div>
            <div className="flex items-center gap-2">
              {[
                { label: "节点总数", value: storyNodes.length, color: S.text2 },
                { label: "需要视频", value: assetCards.filter(a => !a.hasVideo).length, color: S.warning },
                { label: "已完成", value: assetCards.filter(a => a.hasVideo).length, color: S.success },
              ].map(stat => (
                <div key={stat.label} className="text-center px-3 py-1.5 rounded-lg" style={{ background: S.card, border: `1px solid ${S.border}` }}>
                  <span className="text-xs font-bold font-mono block" style={{ color: stat.color }}>{stat.value}</span>
                  <span className="text-[8px]" style={{ color: S.text3 }}>{stat.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── 视频统计摘要 ── */}
          {(() => {
            const openingCat = videoPipeline.find(p => p.id === 'opening');
            const transitionCat = videoPipeline.find(p => p.id === 'transition');
            const qteCat = videoPipeline.find(p => p.id === 'qte');
            const cutsceneCat = videoPipeline.find(p => p.id === 'cutscene');
            return (
              <div className="mx-0 mt-1 mb-2 p-3 rounded-xl flex items-center gap-3" style={{ background: `${S.primary}06`, border: `1px solid ${S.primary}15` }}>
                <Film size={16} style={{ color: S.primary }} />
                <div className="flex-1">
                  <p className="text-[10px] font-bold" style={{ color: S.text }}>视频概览</p>
                  <p className="text-[9px]" style={{ color: S.text3 }}>开场、转场、QTE、过场 CG 分类统计</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[8px] px-2 py-0.5 rounded font-bold" style={{ background: `${S.primary}12`, color: S.primary }}>
                    {openingCat?.items.length || 0} 开场
                  </span>
                  <span className="text-[8px] px-2 py-0.5 rounded font-bold" style={{ background: `#F59E0B12`, color: "#F59E0B" }}>
                    {transitionCat?.items.length || 0} 转场
                  </span>
                  <span className="text-[8px] px-2 py-0.5 rounded font-bold" style={{ background: `${S.error}12`, color: S.error }}>
                    {qteCat?.items.length || 0} QTE
                  </span>
                  <span className="text-[8px] px-2 py-0.5 rounded font-bold" style={{ background: `${S.success}12`, color: S.success }}>
                    {cutsceneCat?.items.length || 0} 过场CG
                  </span>
                </div>
              </div>
            );
          })()}

          {/* Video pipeline sections with UnifiedAssetCard */}
          {storyNodes.length === 0 && (
            <div className="text-center py-6">
              <Film size={20} className="mx-auto mb-2" style={{ color: S.text3 }} />
              <p className="text-xs" style={{ color: S.text3 }}>暂无视频资产，请先创建故事节点</p>
            </div>
          )}
          {videoPipeline.map(step => {
            const StepIcon = step.icon;
            return (
              <div key={step.id}>
                {/* Section header */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: `${S.primary}15` }}>
                    <StepIcon size={12} style={{ color: S.primary }} />
                  </div>
                  <h3 className="text-xs font-bold" style={{ color: S.text }}>{step.label}</h3>
                  <span className="text-[9px] px-2 py-0.5 rounded" style={{ background: `${S.primary}12`, color: S.primary }}>
                    {step.items.length} 个
                  </span>
                  <span className="text-[9px]" style={{ color: S.text3 }}>{step.desc}</span>
                </div>
                {step.items.length > 0 && (
                  <div className="grid grid-cols-3 gap-3">
                    {step.items.map((item, i) => (
                      <UnifiedAssetCard
                        key={`${step.id}-${i}`}
                        id={`${step.id}-${i}`}
                        title={item.name}
                        subtitle={item.duration}
                        type="video"
                        status={item.statusColor === S.success ? "ready" : "pending"}
                        statusLabel={item.status}
                        onGenerate={item.statusColor !== S.success ? () => {
                          addToast({ type: "success", title: "已提交生成", message: `${item.name} 视频生成任务已提交` });
                        } : undefined}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* 节点视频覆盖看板 */}
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: S.text3 }}>节点视频覆盖</h3>
            <div className="grid grid-cols-3 gap-2">
              {assetCards.map(card => {
                const node = storyNodes.find(n => n.id === card.nodeId);
                return (
                  <div key={card.nodeId} className="flex items-center gap-2 p-2.5 rounded-xl"
                    style={{ background: S.card, border: `1px solid ${S.border}`, borderLeft: `3px solid ${card.hasVideo ? S.success : S.warning}` }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: card.hasVideo ? `${S.success}10` : `${S.warning}10` }}>
                      {card.hasVideo
                        ? <CheckCircle2 size={14} style={{ color: S.success }} />
                        : <Film size={14} style={{ color: S.warning }} />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[9px] font-bold block truncate" style={{ color: S.text }}>
                        {card.nodeId} · {node?.label || card.nodeId}
                      </span>
                      <span className="text-[8px]" style={{ color: card.hasVideo ? S.success : S.warning }}>
                        {card.hasVideo ? "✓ 视频就绪" : "缺少视频"}
                      </span>
                    </div>
                    {!card.hasVideo && (
                      <motion.button whileTap={{ scale: 0.9 }}
                        onClick={() => {
                          addToast({ type: "success", title: "已提交生成", message: `${node?.label || card.nodeId} 视频生成任务已提交` });
                        }}
                        className="text-[8px] px-2 py-1 rounded font-bold shrink-0 focus:outline-none"
                        style={{ background: `${S.primary}10`, color: S.primary }}>
                        生成
                      </motion.button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 导出格式 */}
          <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: S.card, border: `1px solid ${S.border}` }}>
            <span className="text-[9px] font-bold" style={{ color: S.text2 }}>导出格式</span>
            {["MP4 (H.264)", "WebM (VP9)", "Lottie JSON"].map(fmt => (
              <span key={fmt} className="text-[8px] px-2 py-1 rounded-lg font-medium"
                style={{ background: S.s2, color: S.text3, border: `1px solid ${S.border}` }}>
                {fmt}
              </span>
            ))}
            <div className="flex-1" />
            <motion.button whileTap={{ scale: 0.97 }}
              onClick={() => {
                addToast({ type: "success", title: "批量生成", message: "视频批量生成任务已提交" });
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white focus:outline-none"
              style={{ background: `linear-gradient(135deg,${S.primary},#A78BFA)` }}>
              <Sparkles size={12} /> AI 批量生成视频
            </motion.button>
          </div>
        </div>
      </>)}

      {/* ════════════════════════════════════════════════════════════════════
          AUDIO TAB — UnifiedAssetCard grid
          ════════════════════════════════════════════════════════════════════ */}
      {activeTab === "audio" && (<>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${S.accent}12` }}>
              <Music size={20} style={{ color: S.accent }} />
            </div>
            <div className="flex-1">
              <h2 className="text-sm font-bold" style={{ color: S.text }}>音频素材管理</h2>
              <p className="text-[10px]" style={{ color: S.text3 }}>BGM、音效、配音、环境音四大分类管理</p>
            </div>
            <div className="flex items-center gap-2">
              {[
                { label: "有 BGM", value: assetCards.filter(a => a.hasBgm).length, total: assetCards.length, color: "#8B5CF6" },
                { label: "有配音", value: assetCards.filter(a => a.hasVoice).length, total: assetCards.length, color: S.accent },
              ].map(stat => (
                <div key={stat.label} className="text-center px-3 py-1.5 rounded-lg" style={{ background: S.card, border: `1px solid ${S.border}` }}>
                  <span className="text-xs font-bold font-mono block" style={{ color: stat.color }}>
                    {stat.value}<span className="text-[9px] font-normal" style={{ color: S.text3 }}>/{stat.total}</span>
                  </span>
                  <span className="text-[8px]" style={{ color: S.text3 }}>{stat.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── 音频统计摘要 ── */}
          {(() => {
            const bgmCat = audioCategories.find(c => c.id === 'bgm');
            const sfxCat = audioCategories.find(c => c.id === 'sfx');
            const voiceCat = audioCategories.find(c => c.id === 'voice');
            const ambientCat = audioCategories.find(c => c.id === 'ambient');
            const audioCoverage = assetCards.length > 0
              ? Math.round(assetCards.filter(a => a.hasBgm || a.hasVoice).length / assetCards.length * 100)
              : 0;
            return (
              <div className="mx-0 mt-1 mb-2 p-3 rounded-xl flex items-center gap-3" style={{ background: `${S.accent}06`, border: `1px solid ${S.accent}15` }}>
                <Music size={16} style={{ color: S.accent }} />
                <div className="flex-1">
                  <p className="text-[10px] font-bold" style={{ color: S.text }}>音频概览</p>
                  <p className="text-[9px]" style={{ color: S.text3 }}>BGM、音效、配音、环境音覆盖率</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[8px] px-2 py-0.5 rounded font-bold" style={{ background: `#8B5CF612`, color: "#8B5CF6" }}>
                    {bgmCat?.items.length || 0} BGM
                  </span>
                  <span className="text-[8px] px-2 py-0.5 rounded font-bold" style={{ background: `${S.warning}12`, color: S.warning }}>
                    {sfxCat?.items.length || 0} SFX
                  </span>
                  <span className="text-[8px] px-2 py-0.5 rounded font-bold" style={{ background: `${S.accent}12`, color: S.accent }}>
                    {voiceCat?.items.length || 0} 配音
                  </span>
                  <span className="text-[8px] px-2 py-0.5 rounded font-bold" style={{ background: `#06B6D412`, color: "#06B6D4" }}>
                    {ambientCat?.items.length || 0} 环境音
                  </span>
                  <span className="text-[8px] px-2 py-0.5 rounded font-bold" style={{ background: `${S.success}12`, color: S.success }}>
                    {audioCoverage}% 覆盖
                  </span>
                </div>
              </div>
            );
          })()}

          {/* Audio category sections with UnifiedAssetCard */}
          {storyNodes.length === 0 && gameCharacters.length === 0 && gameScenes.length === 0 && (
            <div className="text-center py-6">
              <Music size={20} className="mx-auto mb-2" style={{ color: S.text3 }} />
              <p className="text-xs" style={{ color: S.text3 }}>暂无音频资产，请先创建故事节点、角色和场景</p>
            </div>
          )}
          {audioCategories.map(cat => {
            const CatIcon = cat.icon;
            return (
              <div key={cat.id}>
                {/* Section header */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: `${cat.color}15` }}>
                    <CatIcon size={12} style={{ color: cat.color }} />
                  </div>
                  <h3 className="text-xs font-bold" style={{ color: S.text }}>{cat.label}</h3>
                  <span className="text-[9px] px-2 py-0.5 rounded" style={{ background: `${cat.color}15`, color: cat.color }}>
                    {cat.items.length} 个
                  </span>
                  {/* Progress */}
                  {cat.items.length > 0 && (
                    <div className="flex items-center gap-2 ml-auto">
                      <div className="w-16 h-1 rounded-full overflow-hidden" style={{ background: S.s2 }}>
                        <div className="h-full rounded-full" style={{
                          background: cat.color,
                          width: `${(cat.items.filter(i => i.statusColor === S.success).length / cat.items.length) * 100}%`,
                        }} />
                      </div>
                      <span className="text-[8px] font-mono font-bold" style={{ color: S.text3 }}>
                        {cat.items.filter(i => i.statusColor === S.success).length}/{cat.items.length}
                      </span>
                    </div>
                  )}
                </div>
                {cat.items.length > 0 && (
                  <div className="grid grid-cols-3 gap-3">
                    {cat.items.map((item, i) => (
                      <UnifiedAssetCard
                        key={`${cat.id}-${i}`}
                        id={`${cat.id}-${i}`}
                        title={item.name}
                        subtitle={`${item.duration} · ${item.mood}`}
                        type="audio"
                        status={item.statusColor === S.success ? "ready" : "pending"}
                        statusLabel={item.status}
                        onGenerate={item.statusColor !== S.success ? () => {
                          addToast({ type: "success", title: "已提交生成", message: `${item.name} 音频生成任务已提交` });
                        } : undefined}
                        metaItems={[
                          { label: "分类", value: cat.label.split(" ")[0], color: cat.color },
                        ]}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* 节点音频覆盖看板 */}
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: S.text3 }}>节点音频覆盖</h3>
            <div className="grid grid-cols-3 gap-2">
              {assetCards.map(card => {
                const node = storyNodes.find(n => n.id === card.nodeId);
                const bgmOk = card.hasBgm;
                const voiceOk = card.hasVoice;
                return (
                  <div key={card.nodeId} className="p-2.5 rounded-xl" style={{ background: S.card, border: `1px solid ${S.border}` }}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[9px] font-bold" style={{ color: S.text }}>{card.nodeId}</span>
                      <span className="text-[8px] truncate" style={{ color: S.text3 }}>{node?.label || card.nodeId}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[7px] px-1.5 py-0.5 rounded font-bold"
                        style={{ background: bgmOk ? `${S.success}12` : `${S.warning}10`, color: bgmOk ? S.success : S.warning }}>
                        {bgmOk ? "✓ BGM" : "✗ BGM"}
                      </span>
                      <span className="text-[7px] px-1.5 py-0.5 rounded font-bold"
                        style={{ background: voiceOk ? `${S.success}12` : `${S.warning}10`, color: voiceOk ? S.success : S.warning }}>
                        {voiceOk ? "✓ 配音" : "✗ 配音"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 音量混合面板 */}
          <div className="rounded-xl p-4" style={{ background: S.card, border: `1px solid ${S.border}` }}>
            <h3 className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: S.text3 }}>音量混合 — 默认混音预设</h3>
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: "BGM (默认)", level: 65, color: "#8B5CF6" },
                { label: "SFX (默认)", level: 80, color: "#F59E0B" },
                { label: "Voice (默认)", level: 100, color: S.accent },
                { label: "Ambient (默认)", level: 40, color: "#06B6D4" },
              ].map(ch => (
                <div key={ch.label} className="text-center">
                  <div className="h-20 rounded-lg flex items-end justify-center p-1.5 mb-1.5" style={{ background: S.s2 }}>
                    <div className="w-full rounded-sm" style={{
                      background: `linear-gradient(to top, ${ch.color}, ${ch.color}60)`,
                      height: `${ch.level}%`,
                    }} />
                  </div>
                  <span className="text-[9px] font-bold block" style={{ color: S.text }}>{ch.label}</span>
                  <span className="text-[8px] font-mono" style={{ color: S.text3 }}>{ch.level}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Batch actions */}
          <div className="flex items-center gap-2">
            <motion.button whileTap={{ scale: 0.97 }}
              onClick={() => {
                addToast({ type: "success", title: "批量生成", message: "BGM 生成任务已提交" });
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white focus:outline-none"
              style={{ background: `linear-gradient(135deg,${S.primary},#A78BFA)` }}>
              <Sparkles size={12} /> AI 生成 BGM
            </motion.button>
            <motion.button whileTap={{ scale: 0.97 }}
              onClick={() => {
                addToast({ type: "success", title: "批量配音", message: "配音任务已提交" });
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold focus:outline-none"
              style={{ background: `${S.accent}12`, border: `1px solid ${S.accent}30`, color: S.accent }}>
              <Mic size={12} /> 批量配音
            </motion.button>
          </div>
        </div>
      </>)}

      {/* ════════════════════════════════════════════════════════════════════
          LIBRARY TAB — kept as-is
          ════════════════════════════════════════════════════════════════════ */}
      {activeTab === "library" && (<>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Header + Search */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${S.primary}12` }}>
              <Library size={20} style={{ color: S.primary }} />
            </div>
            <div className="flex-1">
              <h2 className="text-sm font-bold" style={{ color: S.text }}>统一资产库</h2>
              <p className="text-[10px]" style={{ color: S.text3 }}>所有导入和生成的素材集中管理</p>
            </div>
          </div>

          {/* Search + Filter */}
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{ background: S.card, border: `1px solid ${S.border}` }}>
              <Search size={14} style={{ color: S.text3 }} />
              <input type="text" placeholder="搜索资产名称、标签..."
                className="flex-1 text-xs bg-transparent outline-none"
                style={{ color: S.text }} />
            </div>
          </div>

          {/* Type filter pills */}
          <div className="flex items-center gap-2">
            {[
              { id: "all", label: "全部", count: assetCards.length * 3, color: S.text2 },
              { id: "image", label: "图片", count: assetCards.filter(a => a.hasImage).length, color: "#0EA5E9" },
              { id: "video", label: "视频", count: assetCards.filter(a => a.hasVideo).length, color: S.primary },
              { id: "audio", label: "音频", count: assetCards.filter(a => a.hasBgm || a.hasVoice).length, color: S.accent },
            ].map(filter => (
              <span key={filter.id} className="text-[9px] px-3 py-1.5 rounded-lg font-bold cursor-pointer"
                style={{
                  background: `${filter.color}10`, color: filter.color,
                  border: `1px solid ${filter.color}25`,
                }}>
                {filter.label}
                <span className="ml-1 font-mono">{filter.count}</span>
              </span>
            ))}
            <div className="flex-1" />
            <motion.button whileTap={{ scale: 0.97 }}
              className="text-[9px] px-3 py-1.5 rounded-lg font-bold focus:outline-none"
              style={{ background: `${S.primary}10`, color: S.primary, border: `1px solid ${S.primary}25` }}>
              + 导入资产
            </motion.button>
          </div>

          {/* Asset grid from store data */}
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: S.text3 }}>节点资产 ({assetCards.length})</h3>
            <div className="grid grid-cols-3 gap-3">
              {assetCards.map(card => {
                const node = storyNodes.find(n => n.id === card.nodeId);
                const assets = [
                  { type: "图片", has: card.hasImage, color: "#0EA5E9" },
                  { type: "BGM", has: card.hasBgm, color: "#8B5CF6" },
                  { type: "配音", has: card.hasVoice, color: S.accent },
                  { type: "视频", has: card.hasVideo, color: S.primary },
                ];
                const readyCount = assets.filter(a => a.has).length;
                return (
                  <div key={card.nodeId} className="rounded-xl overflow-hidden" style={{ background: S.card, border: `1px solid ${S.border}` }}>
                    {/* Thumbnail */}
                    <div className="h-20 flex items-center justify-center relative"
                      style={{ background: card.hasImage
                        ? "linear-gradient(135deg,#667eea,#764ba2)"
                        : "linear-gradient(135deg,#1a1a2e,#16213e)" }}>
                      {card.hasImage
                        ? <Image size={24} style={{ color: "#ffffff60" }} />
                        : <Package size={24} style={{ color: "#ffffff30" }} />
                      }
                      <span className="absolute top-2 right-2 text-[7px] px-1.5 py-0.5 rounded font-bold"
                        style={{ background: "rgba(0,0,0,0.4)", color: "#fff" }}>
                        {readyCount}/4 就绪
                      </span>
                    </div>
                    {/* Info */}
                    <div className="p-3 space-y-2">
                      <div>
                        <p className="text-[10px] font-bold" style={{ color: S.text }}>{node?.label || card.nodeId}</p>
                        <p className="text-[8px]" style={{ color: S.text3 }}>{card.nodeId} · {node?.type || "scene"}</p>
                      </div>
                      {/* Asset status row */}
                      <div className="flex items-center gap-1.5">
                        {assets.map(a => (
                          <span key={a.type} className="text-[7px] px-1.5 py-0.5 rounded font-bold"
                            style={{
                              background: a.has ? `${a.color}15` : S.s2,
                              color: a.has ? a.color : S.text3,
                              border: `1px solid ${a.has ? `${a.color}30` : S.border}`,
                            }}>
                            {a.has ? "✓" : "✗"} {a.type}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Storage usage */}
          <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: S.card, border: `1px solid ${S.border}` }}>
            <span className="text-[9px] font-bold" style={{ color: S.text2 }}>存储空间</span>
            <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: S.s2 }}>
              <div className="h-full rounded-full" style={{
                background: `linear-gradient(90deg, ${S.primary}, ${S.accent})`,
                width: "34%",
              }} />
            </div>
            <span className="text-[9px] font-mono" style={{ color: S.text3 }}>340 MB / 1 GB</span>
          </div>
        </div>
      </>)}

      {/* ════════════════════════════════════════════════════════════════════
          TEXT TAB — UnifiedAssetCard grid
          ════════════════════════════════════════════════════════════════════ */}
      {activeTab === "text" && (<>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${S.primary}12` }}>
              <FileText size={20} style={{ color: S.primary }} />
            </div>
            <div className="flex-1">
              <h2 className="text-sm font-bold" style={{ color: S.text }}>文本资产管理</h2>
              <p className="text-[10px]" style={{ color: S.text3 }}>剧本、台词、节点文案三大分类管理</p>
            </div>
            <div className="flex items-center gap-2">
              {[
                { label: "剧本块", value: scriptBlocks.length, color: S.primary },
                { label: "角色", value: gameCharacters.length, color: S.accent },
                { label: "节点", value: storyNodes.length, color: "#F59E0B" },
              ].map(stat => (
                <div key={stat.label} className="text-center px-3 py-1.5 rounded-lg" style={{ background: S.card, border: `1px solid ${S.border}` }}>
                  <span className="text-xs font-bold font-mono block" style={{ color: stat.color }}>{stat.value}</span>
                  <span className="text-[8px]" style={{ color: S.text3 }}>{stat.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── 文本统计摘要 ── */}
          {(() => {
            const dialogueCount = scriptBlocks.filter(b => b.type === 'dialog').length;
            const nodesWithCopy = storyNodes.filter(n => scriptBlocks.some(b => b.label.includes(n.label) || b.id.includes(n.id)));
            const textCoverage = storyNodes.length > 0 ? Math.round(nodesWithCopy.length / storyNodes.length * 100) : 0;
            return (
              <div className="mx-0 mt-1 mb-2 p-3 rounded-xl flex items-center gap-3" style={{ background: `${S.primary}06`, border: `1px solid ${S.primary}15` }}>
                <FileText size={16} style={{ color: S.primary }} />
                <div className="flex-1">
                  <p className="text-[10px] font-bold" style={{ color: S.text }}>文本概览</p>
                  <p className="text-[9px]" style={{ color: S.text3 }}>剧本块、台词、节点文案覆盖率</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[8px] px-2 py-0.5 rounded font-bold" style={{ background: `${S.primary}12`, color: S.primary }}>
                    {scriptBlocks.length} 剧本块
                  </span>
                  <span className="text-[8px] px-2 py-0.5 rounded font-bold" style={{ background: `${S.accent}12`, color: S.accent }}>
                    {dialogueCount} 台词
                  </span>
                  <span className="text-[8px] px-2 py-0.5 rounded font-bold" style={{ background: `#F59E0B12`, color: "#F59E0B" }}>
                    {storyNodes.length} 节点文案
                  </span>
                  <span className="text-[8px] px-2 py-0.5 rounded font-bold" style={{ background: `${S.success}12`, color: S.success }}>
                    {textCoverage}% 覆盖
                  </span>
                </div>
              </div>
            );
          })()}

          {/* 剧本 (Script) section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: `${S.primary}15` }}>
                <FileText size={12} style={{ color: S.primary }} />
              </div>
              <h3 className="text-xs font-bold" style={{ color: S.text }}>剧本 (Script)</h3>
              <span className="text-[9px] px-2 py-0.5 rounded" style={{ background: `${S.primary}12`, color: S.primary }}>
                {scriptBlocks.length} 个剧本块
              </span>
            </div>
            {scriptBlocks.length === 0 ? (
              <p className="text-xs text-center py-4" style={{ color: S.text3 }}>暂无剧本块，请先在剧本编辑器中创建</p>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {scriptBlocks.map(block => (
                  <UnifiedAssetCard
                    key={block.id}
                    id={block.id}
                    title={block.label}
                    subtitle={block.content.length > 50 ? block.content.slice(0, 50) + "..." : block.content}
                    type="text"
                    status="ready"
                    onEdit={() => {}}
                    metaItems={[
                      { label: "类型", value: block.type, color: block.color },
                      ...(block.char ? [{ label: "角色", value: block.char, color: S.accent }] : []),
                    ]}
                  />
                ))}
              </div>
            )}
          </div>

          {/* 台词 (Dialogue Lines) section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: `${S.accent}15` }}>
                <Mic size={12} style={{ color: S.accent }} />
              </div>
              <h3 className="text-xs font-bold" style={{ color: S.text }}>台词 (Dialogue Lines)</h3>
              <span className="text-[9px] px-2 py-0.5 rounded" style={{ background: `${S.accent}12`, color: S.accent }}>
                {gameCharacters.length} 个角色
              </span>
            </div>
            {gameCharacters.length === 0 ? (
              <p className="text-xs text-center py-4" style={{ color: S.text3 }}>暂无角色，请先创建角色</p>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {gameCharacters.map(c => (
                  <UnifiedAssetCard
                    key={c.id}
                    id={c.id}
                    title={c.name}
                    subtitle={c.role}
                    type="text"
                    status={c.emotionStates.length > 0 ? "ready" : "pending"}
                    statusLabel={c.emotionStates.length > 0 ? `${c.emotionStates.length} 情感` : "待设置"}
                    onEdit={() => {}}
                    metaItems={[
                      { label: "情感", value: `${c.emotionStates.length} 个`, color: c.emotionStates.length > 0 ? S.success : S.warning },
                    ]}
                  />
                ))}
              </div>
            )}
          </div>

          {/* 节点文案 (Node Copy) section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: `#F59E0B15` }}>
                <Library size={12} style={{ color: "#F59E0B" }} />
              </div>
              <h3 className="text-xs font-bold" style={{ color: S.text }}>节点文案 (Node Copy)</h3>
              <span className="text-[9px] px-2 py-0.5 rounded" style={{ background: `#F59E0B12`, color: "#F59E0B" }}>
                {storyNodes.length} 个节点
              </span>
            </div>
            {storyNodes.length === 0 ? (
              <p className="text-xs text-center py-4" style={{ color: S.text3 }}>暂无故事节点，请先在节点编辑器中创建</p>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {storyNodes.map(node => {
                  const hasScript = scriptBlocks.some(b => b.label.includes(node.label) || b.id.includes(node.id));
                  const hasDialogue = gameCharacters.some(c => c.appearNodes.includes(node.id));
                  const bothReady = hasScript && hasDialogue;
                  return (
                    <UnifiedAssetCard
                      key={node.id}
                      id={node.id}
                      title={node.label}
                      type="text"
                      status={bothReady ? "ready" : "pending"}
                      statusLabel={bothReady ? "文案就绪" : "待补充"}
                      sourceNode={node.id}
                      onEdit={() => {}}
                      metaItems={[
                        { label: "剧本", value: hasScript ? "✓" : "✗", color: hasScript ? S.success : S.error },
                        { label: "台词", value: hasDialogue ? "✓" : "✗", color: hasDialogue ? S.success : S.error },
                      ]}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </>)}

      {/* Contextual Quick Actions — always visible */}
      <ContextualActions
        actions={[
          { icon: Library, label: "资产库", href: "/asset-library" },
          { icon: Film, label: "演出预览", href: "/cinematic" },
          { icon: CheckCircle2, label: "质检总览", href: "/overview" },
        ]}
      />
    </div>
  );
}
