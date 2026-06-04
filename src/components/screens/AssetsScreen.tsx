"use client";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, AlertTriangle, ChevronRight, ChevronDown,
  User, MapPin, Package, Sparkles, Play, ArrowRight,
  Image, Music, Mic, Film, Plus, Edit2, Check, Headphones,
  Volume2, Waves, Radio, Library, Search, Shirt, FileText,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams, usePathname } from "next/navigation";
import { UpstreamReadiness } from "@/components/ui/UpstreamReadiness";
import { INDUSTRY_ASSET_TYPES, INDUSTRY_LABELS, type IndustryType, type AssetCard } from "@/lib/studio-data";
import { useNarrativeStore, useUIStore } from "@/store";

const S = {
  bg:"#F5F6FA", card:"#FFFFFF", s2:"#F4F6FC",
  border:"#E8EAF2", primary:"#7C6CF5", accent:"#00A99D",
  text:"#1A1D2E", text2:"#4A5068", text3:"#8892B0",
  success:"#10B981", warning:"#F59E0B", error:"#EF4444",
};

// ── 顶部步骤进度（角色→造型→场景→道具→素材生产）─────────────────────────
const PIPELINE_STEPS = [
  { id:"character", label:"角色",     icon:User,    done:true  },
  { id:"wardrobe",  label:"造型",     icon:Shirt,   done:true  },
  { id:"scene",     label:"场景",     icon:MapPin,  done:true  },
  { id:"prop",      label:"道具",     icon:Package, done:false },
  { id:"material",  label:"素材生产", icon:Image,   done:false },
];

// ── 角色数据（Seed fallback — 当 store 为空时使用）────────────────────────
const SEED_CHARACTERS_UI = [
  {
    id:"ella", name:"艾拉", role:"女主角·侦探",
    appearance:"黑色短发，银色义眼，黑色风衣，赛博朋克风格",
    personality:"冷静·警觉·强控制欲·不信任他人",
    vars:"stealth_score, trust_lineman, truth_progress",
    nodes:11,
    prompt:"cyberpunk female detective, black short hair, silver mechanical eye, black trench coat, neon city background, cinematic lighting",
    portraits:{ default:true, angry:true, hurt:false, silent:false },
  },
  {
    id:"mole", name:"线人", role:"关键NPC",
    appearance:"中年男性，破旧外套，神秘气质，隐藏帽檐",
    personality:"不可信任·知晓真相·双面人",
    vars:"trust_lineman",
    nodes:4,
    prompt:"mysterious middle-aged man, worn jacket, shadowy face, cyberpunk alley, dramatic lighting",
    portraits:{ default:true, angry:false, hurt:false, silent:false },
  },
  {
    id:"boss", name:"反派主管", role:"反派",
    appearance:"西装笔挺，冷峻表情，强权象征",
    personality:"冷酷·权谋·幕后操控者",
    vars:"alert_level",
    nodes:3,
    prompt:"powerful antagonist in suit, cold expression, modern office background, authority aura",
    portraits:{ default:false, angry:false, hurt:false, silent:false },
  },
];

// ── 场景数据（Seed fallback）─────────────────────────────────────────────
const SEED_SCENES_UI = [
  {
    id:"street", name:"霓虹街道", location:"城市·夜·外",
    desc:"赛博朋克都市，积水路面，广告牌投影，霓虹灯光",
    light:"低调蓝紫色，高对比度霓虹", atmosphere:"紧张·压抑·科技感",
    prompt:"cyberpunk city street at night, neon reflections on wet pavement, rain, cinematic",
    nodes:5, hasImg:true,
  },
  {
    id:"bar", name:"地下酒吧", location:"室内·夜·内",
    desc:"昏暗灯光，嘈杂人群，秘密交易地点，烟雾弥漫",
    light:"琥珀色暖光，局部阴影", atmosphere:"危险·神秘·地下感",
    prompt:"underground bar, dim amber lighting, crowded, smoky atmosphere, cyberpunk setting",
    nodes:3, hasImg:true,
  },
  {
    id:"rooftop", name:"天台", location:"城市制高点·夜·外",
    desc:"俯视都市全景，强风，追逐场景",
    light:"冷蓝月光+远处霓虹", atmosphere:"紧张·开阔·对抗感",
    prompt:"rooftop overlooking cyberpunk city at night, strong wind, dramatic chase scene",
    nodes:2, hasImg:false,
  },
];

// ── 道具数据（Seed fallback）─────────────────────────────────────────────
const SEED_PROPS_UI = [
  {
    id:"chip", name:"追踪芯片", type:"关键道具",
    desc:"植入皮肤下，持续发送位置信号，核心剧情物品",
    effect:"影响3个节点的跳转条件", hasImg:false,
  },
  {
    id:"voicechanger", name:"变声器", type:"可选道具",
    desc:"小型设备，改变声音用于伪装通话",
    effect:"触发2个隐藏对话节点", hasImg:false,
  },
  {
    id:"harddisk", name:"加密硬盘", type:"目标道具",
    desc:"存储核心证据，需要密钥才能打开",
    effect:"影响5个节点，决定结局A/B", hasImg:false,
  },
];

// ── 节点素材生产状态（Seed fallback）─────────────────────────────────────
const SEED_NODE_ASSETS = [
  { nodeId:"N01", label:"序章·霓虹夜幕", hasImg:true,  hasBgm:false, hasVoice:false, hasVideo:false },
  { nodeId:"N02", label:"任务简报",       hasImg:true,  hasBgm:false, hasVoice:false, hasVideo:false },
  { nodeId:"N03", label:"进入路线",       hasImg:true,  hasBgm:false, hasVoice:false, hasVideo:false },
  { nodeId:"N04", label:"暗夜通道",       hasImg:true,  hasBgm:false, hasVoice:false, hasVideo:false },
  { nodeId:"N05", label:"换装渗透",       hasImg:true,  hasBgm:false, hasVoice:false, hasVideo:false },
  { nodeId:"N06", label:"警卫逼近",       hasImg:false, hasBgm:false, hasVoice:false, hasVideo:false },
  { nodeId:"N07", label:"潜行判定",       hasImg:true,  hasBgm:false, hasVoice:false, hasVideo:false },
  { nodeId:"N08", label:"数据到手",       hasImg:true,  hasBgm:false, hasVoice:false, hasVideo:false },
  { nodeId:"N09", label:"身份暴露",       hasImg:false, hasBgm:false, hasVoice:false, hasVideo:false },
];

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
  const pathname = usePathname();
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
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "image";

  const [activeStep, setActiveStep] = useState<string>("character");
  const [selectedChar, setSelectedChar] = useState(0);
  const [selectedScene, setSelectedScene] = useState(0);
  const [generating, setGenerating] = useState<string|null>(null);
  const [genDone, setGenDone] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"pipeline" | "by-node">("pipeline");
  const [activeAssetFilter, setActiveAssetFilter] = useState<string | null>(null);

  // Store write actions for persisting generation results
  const addScene = useNarrativeStore(s => s.addScene);
  const addToast = useUIStore(s => s.addToast);

  // ── Derived UI data from store (with seed fallback) ─────────────────────
  const characters = useMemo(() => {
    if (gameCharacters.length === 0) return SEED_CHARACTERS_UI;
    return gameCharacters.map(c => ({
      id: c.id,
      name: c.name,
      role: c.role,
      appearance: c.description || "暂无描述",
      personality: c.emotionStates?.map(e => e.label).join("·") || "未设置",
      vars: c.appearNodes?.join(", ") || "",
      nodes: c.appearNodes?.length ?? 0,
      prompt: c.visualPrompt || "",
      portraits: { default: true, angry: false, hurt: false, silent: false } as Record<string, boolean>,
    }));
  }, [gameCharacters]);

  const scenes = useMemo(() => {
    if (gameScenes.length === 0) return SEED_SCENES_UI;
    return gameScenes.map(s => ({
      id: s.id,
      name: s.name,
      location: s.location,
      desc: s.atmosphere || s.lighting || "",
      light: s.lighting,
      atmosphere: s.atmosphere,
      prompt: s.visualPrompt || "",
      nodes: s.refNodes?.length ?? 0,
      hasImg: s.hasImage,
    }));
  }, [gameScenes]);

  const props = useMemo(() => {
    if (gameProps.length === 0) return SEED_PROPS_UI;
    return gameProps.map(p => ({
      id: p.id,
      name: p.name,
      type: p.type === "key_item" ? "关键道具" : p.type === "tool" ? "可选道具" : p.type === "weapon" ? "武器装备" : "消耗品",
      desc: p.description,
      effect: p.gameplayEffect || "无效果",
      hasImg: p.hasImage,
    }));
  }, [gameProps]);

  const nodeAssets = useMemo(() => {
    if (storyNodes.length === 0) return SEED_NODE_ASSETS;
    return storyNodes.map(n => ({
      nodeId: n.id,
      label: n.label || n.id,
      hasImg: false,
      hasBgm: false,
      hasVoice: false,
      hasVideo: false,
    }));
  }, [storyNodes]);

  const handleGenerate = (id: string) => {
    setGenerating(id);
    setTimeout(() => {
      setGenerating(null);
      setGenDone(prev => [...prev, id]);

      // Persist generation result to store
      if (id.startsWith("scene-")) {
        const sceneId = id.replace("scene-", "");
        const sceneData = scenes.find(s => s.id === sceneId);
        if (sceneData) {
          addScene({
            id: sceneId, name: sceneData.name, location: sceneData.location,
            lighting: sceneData.light, atmosphere: sceneData.atmosphere,
            refNodes: [], hasImage: true, visualPrompt: sceneData.prompt,
          });
        }
      }

      addToast({
        type: "success",
        title: "资产生成完成",
        message: `${id.includes("char") ? "立绘" : id.includes("scene") ? "背景图" : id.includes("prop") ? "道具图" : "素材"}已成功生成并绑定`,
      });
    }, 1800);
  };

  // ── Dynamic video pipeline data (Task 2) ─────────────────────────────────────
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
      { id: "qte", icon: Play, label: "QTE 动作片段", desc: "限时选择和快速反应的动作演出", items: qteItems },
      { id: "cutscene", icon: Sparkles, label: "过场 CG", desc: "关键剧情的高品质 CG 动画", items: cutsceneItems },
    ];
  }, [storyNodes, nodeEdges]);

  // ── Dynamic audio category data (Task 3) ───────────────────────────────────
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
      { id: "sfx", label: "SFX 音效", icon: Waves, color: "#F59E0B", items: sfxItems },
      { id: "voice", label: "Voice 配音", icon: Mic, color: S.accent, items: voiceItems },
      { id: "ambient", label: "Ambient 环境音", icon: Radio, color: "#06B6D4", items: ambientItems },
    ];
  }, [storyNodes, gameCharacters, gameScenes]);

  const char = characters[selectedChar];
  const scene = scenes[selectedScene];

  // ── Empty state check ─────────────────────────────────────────────────────
  if (assetCards.length === 0) {
    return (
      <div className="h-svh flex items-center justify-center" style={{ background: S.bg }}>
        <div className="text-center max-w-md p-8">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: '#F4F6FC' }}>
            <Package size={28} style={{ color: '#7C6CF5' }} />
          </div>
          <h3 className="text-base font-bold mb-2" style={{ color: '#1a1a2e' }}>还没有资产需求</h3>
          <p className="text-sm text-gray-500 mb-4">节点设计完成后，这里会自动生成资产需求</p>
          <Link href="/nodes" className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-bold text-white" style={{ background: '#7C6CF5' }}>
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
          { id: "image", label: "图片", icon: Image },
          { id: "video", label: "视频", icon: Film },
          { id: "audio", label: "音频", icon: Music },
          { id: "library", label: "资产库", icon: Library },
          { id: "text", label: "文字", icon: FileText },
        ].map(tab => (
          <Link key={tab.id} href={`/assets?tab=${tab.id}`}>
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

      {activeTab === "image" && (<>
      {/* ── 顶部步骤进度条 ── */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0"
        style={{ background:S.card, borderBottom:`1px solid ${S.border}` }}>
        <div className="flex items-center gap-1">
          {PIPELINE_STEPS.map((step, i) => (
            <div key={step.id} className="flex items-center gap-1">
              <motion.button whileTap={{ scale:0.96 }}
                onClick={() => setActiveStep(step.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold focus:outline-none transition-all"
                style={{
                  background: activeStep===step.id ? S.primary : step.done ? `${S.success}12` : S.s2,
                  color: activeStep===step.id ? "#fff" : step.done ? S.success : S.text3,
                  border: activeStep===step.id ? "none" : `1px solid ${step.done ? `${S.success}30` : S.border}`,
                }}>
                {step.done
                  ? <CheckCircle2 size={12} />
                  : <step.icon size={12} />}
                {step.label}
              </motion.button>
              {i < PIPELINE_STEPS.length-1 && (
                <ChevronRight size={12} style={{ color:S.text3 }} />
              )}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          {/* View mode toggle */}
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
          <Link href="/nodes">
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

      {/* ── 主内容区 ── */}
      <div className="flex-1 overflow-hidden flex">
        {viewMode === "pipeline" && (
        <AnimatePresence mode="wait">

          {/* ══ 角色配置 ══ */}
          {activeStep === "character" && (
            <motion.div key="char" initial={{ opacity:0 }} animate={{ opacity:1 }}
              className="flex-1 flex overflow-hidden">
              {/* 左：角色列表 */}
              <div className="w-[160px] shrink-0 border-r overflow-y-auto"
                style={{ borderColor:S.border, background:S.card }}>
                <p className="text-[9px] font-bold uppercase tracking-wider px-3 py-2 border-b"
                  style={{ borderColor:S.border, color:S.text3 }}>角色列表</p>
                {characters.map((c,i) => (
                  <motion.button key={c.id} whileTap={{ scale:0.98 }}
                    onClick={() => setSelectedChar(i)}
                    className="w-full text-left px-3 py-2.5 border-b focus:outline-none"
                    style={{ borderColor:S.border,
                      background: selectedChar===i ? `${S.primary}08` : "transparent",
                      borderLeft: selectedChar===i ? `3px solid ${S.primary}` : "3px solid transparent" }}>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                        style={{ background:`${S.primary}15` }}>
                        <User size={11} style={{ color:S.primary }} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold" style={{ color:S.text }}>{c.name}</p>
                        <p className="text-[8px]" style={{ color:S.text3 }}>{c.role}</p>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>

              {/* 右：角色详情 + 立绘生成 */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold" style={{ color:S.text }}>{char.name}</h2>
                    <p className="text-xs" style={{ color:S.text3 }}>{char.role} · 出现 {char.nodes} 个节点</p>
                  </div>
                  <span className="text-[9px] px-2 py-0.5 rounded"
                    style={{ background:`${S.primary}12`, color:S.primary }}>
                    变量绑定：{char.vars.split(",").length} 个
                  </span>
                </div>

                {/* 设定卡片 */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label:"外貌特征", value:char.appearance },
                    { label:"性格标签", value:char.personality },
                    { label:"关联变量", value:char.vars },
                    { label:"视觉提示词（可编辑）", value:char.prompt },
                  ].map(item => (
                    <div key={item.label} className="p-3 rounded-xl"
                      style={{ background:S.card, border:`1px solid ${S.border}` }}>
                      <p className="text-[9px] font-bold uppercase tracking-wider mb-1" style={{ color:S.text3 }}>
                        {item.label}
                      </p>
                      <p className="text-xs leading-relaxed" style={{ color:S.text2 }}>{item.value}</p>
                    </div>
                  ))}
                </div>

                {/* 立绘生成 */}
                <div className="p-4 rounded-xl" style={{ background:S.card, border:`1px solid ${S.border}` }}>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-bold" style={{ color:S.text }}>角色立绘（4种状态）</p>
                    <span className="text-[9px]" style={{ color:S.text3 }}>
                      后续AI生图将以此为参考，保持角色外貌一致
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {["默认","愤怒","受伤","沉默"].map((state) => {
                      const isDone = (char.portraits as any)[state === "默认" ? "default" : state === "愤怒" ? "angry" : state === "受伤" ? "hurt" : "silent"] || genDone.includes(`${char.id}-${state}`);
                      const isGen = generating === `${char.id}-${state}`;
                      return (
                        <div key={state} className="rounded-xl overflow-hidden"
                          style={{ border:`1px solid ${isDone ? `${S.success}30` : S.border}` }}>
                          <div className="h-20 flex items-center justify-center"
                            style={{ background: isDone ? "linear-gradient(135deg,#1a1a2e,#16213e)" : S.s2 }}>
                            {isGen
                              ? <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
                                  style={{ borderColor:S.primary }} />
                              : isDone
                                ? <CheckCircle2 size={16} color={S.success} />
                                : <User size={16} style={{ color:S.text3 }} />}
                          </div>
                          <div className="p-1.5">
                            <p className="text-[9px] font-medium text-center mb-1" style={{ color:S.text }}>{state}</p>
                            {!isDone && !isGen && (
                              <motion.button whileTap={{ scale:0.96 }}
                                onClick={() => handleGenerate(`${char.id}-${state}`)}
                                className="w-full py-0.5 rounded text-[8px] font-bold focus:outline-none"
                                style={{ background:`${S.primary}12`, color:S.primary, border:`1px solid ${S.primary}20` }}>
                                <Sparkles size={8} className="inline mr-0.5" /> 生成
                              </motion.button>
                            )}
                            {isDone && (
                              <p className="text-[8px] text-center" style={{ color:S.success }}>已生成</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <motion.button whileTap={{ scale:0.97 }}
                    onClick={() => {
                      ["默认","愤怒","受伤","沉默"].forEach(s => {
                        setTimeout(() => handleGenerate(`${char.id}-${s}`), Math.random()*500);
                      });
                    }}
                    className="w-full mt-3 py-2 rounded-xl text-xs font-bold text-white focus:outline-none"
                    style={{ background:`linear-gradient(135deg,${S.primary},#A78BFA)` }}>
                    <Sparkles size={12} className="inline mr-1" /> AI 一键生成全部立绘
                  </motion.button>
                </div>

                {/* 下一步 */}
                <motion.button whileTap={{ scale:0.97 }} onClick={() => setActiveStep("wardrobe")}
                  className="w-full py-2.5 rounded-xl text-xs font-bold focus:outline-none flex items-center justify-center gap-2"
                  style={{ background:`${S.accent}15`, border:`1px solid ${S.accent}30`, color:S.accent }}>
                  角色配置完成，进入造型配置 <ChevronRight size={12} />
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ══ 造型配置 ══ */}
          {activeStep === "wardrobe" && (
            <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} className="space-y-4">
              <div className="rounded-2xl p-5" style={{ background:S.card, border:`1px solid ${S.border}` }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold flex items-center gap-2" style={{ color:S.text }}>
                    <Shirt size={14} style={{ color:S.primary }} /> 角色造型管理
                  </h3>
                  <span className="text-[9px] px-2 py-1 rounded-lg" style={{ background:`${S.primary}12`, color:S.primary }}>
                    在「剧本总览 → 角色与世界」中管理造型
                  </span>
                </div>

                {/* Wardrobe overview cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                  {characters.map(char => (
                    <div key={char.id} className="p-4 rounded-xl" style={{ background:S.s2, border:`1px solid ${S.border}` }}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold"
                          style={{ background:`${S.primary}12`, color:S.primary }}>
                          {char.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-[10px] font-bold" style={{ color:S.text }}>{char.name}</p>
                          <p className="text-[8px]" style={{ color:S.text3 }}>{char.role}</p>
                        </div>
                      </div>

                      {/* Portrait states */}
                      <div className="grid grid-cols-4 gap-1 mb-2">
                        {Object.entries(char.portraits).map(([state, done]) => (
                          <div key={state} className="aspect-square rounded-lg flex items-center justify-center"
                            style={{ background: done ? `${S.success}12` : S.s2, border:`1px solid ${done ? `${S.success}30` : S.border}` }}>
                            {done
                              ? <Check size={10} style={{ color: S.success }} />
                              : <span className="text-[7px]" style={{ color:S.text3 }}>{state === "default" ? "默认" : state === "angry" ? "愤怒" : state === "hurt" ? "受伤" : "沉默"}</span>
                            }
                          </div>
                        ))}
                      </div>

                      <p className="text-[8px]" style={{ color:S.text3 }}>
                        造型管理请前往 <Link href="/story-overview" className="font-bold" style={{ color:S.primary }}>剧本总览</Link> 的「角色与世界」标签页
                      </p>
                    </div>
                  ))}
                </div>

                {/* Quick actions */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Link href="/story-overview">
                    <motion.button whileTap={{ scale:0.97 }}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-bold text-white focus:outline-none"
                      style={{ background:`linear-gradient(135deg,${S.primary},#A78BFA)`, boxShadow:`0 2px 8px ${S.primary}30` }}>
                      <Shirt size={12} /> 前往造型管理
                    </motion.button>
                  </Link>
                  <motion.button whileTap={{ scale:0.97 }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-bold focus:outline-none"
                    style={{ background:`${S.primary}12`, color:S.primary, border:`1px solid ${S.primary}30` }}>
                    <Sparkles size={12} /> AI 生成造型建议
                  </motion.button>
                </div>
              </div>

              {/* 下一步 */}
              <motion.button whileTap={{ scale:0.97 }} onClick={() => setActiveStep("scene")}
                className="w-full py-2.5 rounded-xl text-xs font-bold focus:outline-none flex items-center justify-center gap-2"
                style={{ background:`${S.accent}15`, border:`1px solid ${S.accent}30`, color:S.accent }}>
                造型配置完成，进入场景配置 <ChevronRight size={12} />
              </motion.button>
            </motion.div>
          )}

          {/* ══ 场景配置 ══ */}
          {activeStep === "scene" && (
            <motion.div key="scene" initial={{ opacity:0 }} animate={{ opacity:1 }}
              className="flex-1 flex overflow-hidden">
              {/* 左：场景列表 */}
              <div className="w-[160px] shrink-0 border-r overflow-y-auto"
                style={{ borderColor:S.border, background:S.card }}>
                <p className="text-[9px] font-bold uppercase tracking-wider px-3 py-2 border-b"
                  style={{ borderColor:S.border, color:S.text3 }}>场景列表</p>
                {scenes.map((sc,i) => (
                  <motion.button key={sc.id} whileTap={{ scale:0.98 }}
                    onClick={() => setSelectedScene(i)}
                    className="w-full text-left px-3 py-2.5 border-b focus:outline-none"
                    style={{ borderColor:S.border,
                      background: selectedScene===i ? `${S.primary}08` : "transparent",
                      borderLeft: selectedScene===i ? `3px solid ${S.primary}` : "3px solid transparent" }}>
                    <div className="flex items-center gap-2">
                      <MapPin size={11} style={{ color: sc.hasImg ? S.success : S.text3 }} />
                      <div>
                        <p className="text-[10px] font-bold" style={{ color:S.text }}>{sc.name}</p>
                        <p className="text-[8px]" style={{ color:S.text3 }}>{sc.location}</p>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>

              {/* 右：场景详情 */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold" style={{ color:S.text }}>{scene.name}</h2>
                    <p className="text-xs" style={{ color:S.text3 }}>{scene.location} · 出现 {scene.nodes} 个节点</p>
                  </div>
                  <span className="text-[9px] px-2 py-0.5 rounded"
                    style={{ background: scene.hasImg ? `${S.success}12` : `${S.warning}12`,
                      color: scene.hasImg ? S.success : S.warning }}>
                    {scene.hasImg ? "背景图已生成" : "背景图待生成"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label:"场景描述", value:scene.desc },
                    { label:"光线设计", value:scene.light },
                    { label:"氛围标签", value:scene.atmosphere },
                    { label:"AI生图提示词（可编辑）", value:scene.prompt },
                  ].map(item => (
                    <div key={item.label} className="p-3 rounded-xl"
                      style={{ background:S.card, border:`1px solid ${S.border}` }}>
                      <p className="text-[9px] font-bold uppercase tracking-wider mb-1" style={{ color:S.text3 }}>
                        {item.label}
                      </p>
                      <p className="text-xs leading-relaxed" style={{ color:S.text2 }}>{item.value}</p>
                    </div>
                  ))}
                </div>

                {/* 背景图生成 */}
                <div className="p-4 rounded-xl" style={{ background:S.card, border:`1px solid ${S.border}` }}>
                  <p className="text-xs font-bold mb-3" style={{ color:S.text }}>背景图生成</p>
                  <div className="rounded-xl overflow-hidden mb-3"
                    style={{ background:"linear-gradient(135deg,#0d1117,#1a1f2e)", height:120, display:"flex", alignItems:"center", justifyContent:"center" }}>
                    {scene.hasImg || genDone.includes(`scene-${scene.id}`)
                      ? <p className="text-[10px] text-white opacity-60">背景图已生成 ✓</p>
                      : generating === `scene-${scene.id}`
                        ? <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor:"#fff" }} />
                        : <p className="text-[10px] text-white opacity-40">点击生成背景图</p>}
                  </div>
                  {!scene.hasImg && !genDone.includes(`scene-${scene.id}`) && (
                    <motion.button whileTap={{ scale:0.97 }}
                      onClick={() => handleGenerate(`scene-${scene.id}`)}
                      className="w-full py-2 rounded-xl text-xs font-bold text-white focus:outline-none"
                      style={{ background:S.primary }}>
                      <Sparkles size={12} className="inline mr-1" /> AI 生成背景图
                    </motion.button>
                  )}
                </div>

                <motion.button whileTap={{ scale:0.97 }} onClick={() => setActiveStep("prop")}
                  className="w-full py-2.5 rounded-xl text-xs font-bold focus:outline-none flex items-center justify-center gap-2"
                  style={{ background:`${S.accent}15`, border:`1px solid ${S.accent}30`, color:S.accent }}>
                  场景配置完成，进入道具配置 <ChevronRight size={12} />
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ══ 道具配置 ══ */}
          {activeStep === "prop" && (
            <motion.div key="prop" initial={{ opacity:0 }} animate={{ opacity:1 }}
              className="flex-1 overflow-y-auto p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold" style={{ color:S.text }}>道具设定</h2>
                <p className="text-xs" style={{ color:S.text3 }}>共 {props.length} 件道具</p>
              </div>
              {props.map(prop => (
                <div key={prop.id} className="p-4 rounded-xl"
                  style={{ background:S.card, border:`1px solid ${S.border}` }}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{ background:`${S.primary}12` }}>
                        <Package size={13} style={{ color:S.primary }} />
                      </div>
                      <div>
                        <p className="text-xs font-bold" style={{ color:S.text }}>{prop.name}</p>
                        <span className="text-[9px] px-1.5 py-0.5 rounded"
                          style={{ background:`${S.accent}12`, color:S.accent }}>{prop.type}</span>
                      </div>
                    </div>
                    <span className="text-[9px] px-2 py-0.5 rounded"
                      style={{ background: prop.hasImg ? `${S.success}12` : `${S.warning}12`,
                        color: prop.hasImg ? S.success : S.warning }}>
                      {prop.hasImg ? "图片已生成" : "图片待生成"}
                    </span>
                  </div>
                  <p className="text-xs mb-1" style={{ color:S.text2 }}>{prop.desc}</p>
                  <p className="text-[10px]" style={{ color:S.primary }}>剧情影响：{prop.effect}</p>
                  {!prop.hasImg && (
                    <motion.button whileTap={{ scale:0.97 }}
                      onClick={() => handleGenerate(`prop-${prop.id}`)}
                      className="mt-2 flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-bold focus:outline-none"
                      style={{ background:`${S.primary}10`, border:`1px solid ${S.primary}20`, color:S.primary }}>
                      {genDone.includes(`prop-${prop.id}`)
                        ? <><CheckCircle2 size={9} /> 已生成</>
                        : generating === `prop-${prop.id}`
                          ? "生成中..."
                          : <><Sparkles size={9} /> AI 生成道具图</>}
                    </motion.button>
                  )}
                </div>
              ))}
              <motion.button whileTap={{ scale:0.97 }} onClick={() => setActiveStep("material")}
                className="w-full py-2.5 rounded-xl text-xs font-bold focus:outline-none flex items-center justify-center gap-2"
                style={{ background:`linear-gradient(135deg,${S.primary},#A78BFA)`, color:"#fff" }}>
                道具配置完成，进入素材生产 <ArrowRight size={12} />
              </motion.button>
            </motion.div>
          )}

          {/* ══ 素材生产 ══ */}
          {activeStep === "material" && (
            <motion.div key="material" initial={{ opacity:0 }} animate={{ opacity:1 }}
              className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold" style={{ color:S.text }}>素材生产台</h2>
                <p className="text-xs" style={{ color:S.text3 }}>为 {nodeAssets.length} 个节点批量生成素材</p>
              </div>

              {/* UI 模板说明 */}
              <div className="p-4 rounded-xl" style={{ background:S.card, border:`1px solid ${S.border}` }}>
                <p className="text-xs font-bold mb-2" style={{ color:S.text }}>节点 UI 模板（系统自动套用）</p>
                <div className="grid grid-cols-5 gap-2">
                  {UI_TEMPLATES.map(t => (
                    <div key={t.type} className="p-2 rounded-lg text-center"
                      style={{ background:`${t.color}10`, border:`1px solid ${t.color}25` }}>
                      <p className="text-[10px] font-bold mb-0.5" style={{ color:t.color }}>{t.label}</p>
                      <p className="text-[8px] leading-snug" style={{ color:S.text3 }}>{t.desc}</p>
                    </div>
                  ))}
                </div>
                <p className="text-[9px] mt-2" style={{ color:S.text3 }}>
                  💡 AI 根据节点类型自动套用对应 UI 模板，无需手动配置
                </p>
              </div>

              {/* 批量操作 */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { icon:Image, label:"批量生成场景背景图", count:"1/9 待补", color:S.primary },
                  { icon:Music, label:"AI 一键生成 BGM",   count:"0/9 待补", color:"#F59E0B" },
                  { icon:Mic,   label:"批量生成配音",       count:"0/9 待补", color:S.accent  },
                  { icon:Film,  label:"生成视频素材需求清单", count:"8/9 待补", color:"#8B7CF8" },
                ].map(item => (
                  <motion.button key={item.label} whileTap={{ scale:0.97 }}
                    onClick={() => handleGenerate(item.label)}
                    className="flex items-center gap-2 p-3 rounded-xl text-left focus:outline-none"
                    style={{ background: genDone.includes(item.label) ? `${S.success}08` : S.card,
                      border:`1px solid ${genDone.includes(item.label) ? `${S.success}30` : S.border}` }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background:`${item.color}15` }}>
                      {generating === item.label
                        ? <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin"
                            style={{ borderColor:item.color }} />
                        : genDone.includes(item.label)
                          ? <CheckCircle2 size={15} color={S.success} />
                          : <item.icon size={15} style={{ color:item.color }} />}
                    </div>
                    <div>
                      <p className="text-[10px] font-bold" style={{ color:S.text }}>{item.label}</p>
                      <p className="text-[9px]"
                        style={{ color: genDone.includes(item.label) ? S.success : S.text3 }}>
                        {genDone.includes(item.label) ? "✓ 已完成" : item.count}
                      </p>
                    </div>
                  </motion.button>
                ))}
              </div>

              {/* 节点素材状态网格 */}
              <div className="p-4 rounded-xl" style={{ background:S.card, border:`1px solid ${S.border}` }}>
                <p className="text-xs font-bold mb-3" style={{ color:S.text }}>节点素材状态</p>
                <div className="grid grid-cols-3 gap-2">
                  {nodeAssets.map(node => {
                    const missing = [!node.hasImg,!node.hasBgm,!node.hasVoice,!node.hasVideo].filter(Boolean).length;
                    return (
                      <div key={node.nodeId} className="p-2.5 rounded-xl"
                        style={{ background:S.s2, border:`1px solid ${missing===0 ? `${S.success}30` : S.border}` }}>
                        <p className="text-[9px] font-bold mb-1 truncate" style={{ color:S.text }}>{node.label}</p>
                        <div className="flex gap-0.5">
                          {[
                            { label:"图", ok:node.hasImg },
                            { label:"乐", ok:node.hasBgm },
                            { label:"声", ok:node.hasVoice },
                            { label:"视", ok:node.hasVideo },
                          ].map(a => (
                            <span key={a.label} className="text-[7px] px-1 py-0.5 rounded"
                              style={{ background: a.ok ? `${S.success}15` : `${S.error}08`,
                                color: a.ok ? S.success : S.error }}>
                              {a.label}{a.ok ? "✓":"⚠"}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 进入发布 */}
              <div className="grid grid-cols-2 gap-2">
                <Link href="/simulator">
                  <motion.button whileTap={{ scale:0.97 }}
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold focus:outline-none"
                    style={{ background:`${S.primary}12`, border:`1px solid ${S.primary}25`, color:S.primary }}>
                    <Play size={12} /> 试玩调试
                  </motion.button>
                </Link>
                <Link href="/publish">
                  <motion.button whileTap={{ scale:0.97 }}
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold text-white focus:outline-none"
                    style={{ background:`linear-gradient(135deg,${S.primary},#A78BFA)` }}>
                    进入发布中心 <ArrowRight size={12} />
                  </motion.button>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        )}

        {/* 按节点查看 - 资产依赖看板 */}
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
                    onClick={() => handleGenerate("batch-bgm")}
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
                          onClick={() => handleGenerate(`node-${item.node.nodeId}-${item.type}`)}
                          className="px-2 py-0.5 rounded text-[8px] font-bold shrink-0 focus:outline-none"
                          style={{ background: `${S.primary}10`, color: S.primary, border: `1px solid ${S.primary}20` }}>
                          {genDone.includes(`node-${item.node.nodeId}-${item.type}`) ? "✓" : "生成"}
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
        <Link href="/overview" className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white" style={{ background: '#7C6CF5' }}>
          前往质检总览 →
        </Link>
      </div>
      </>)}

      {/* ── 视频 Tab ── */}
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

          {/* 视频生产流水线 4 步 */}
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: S.text3 }}>视频生产流水线</h3>
            <div className="grid grid-cols-4 gap-3">
              {storyNodes.length === 0 && (
              <div className="text-center py-6 col-span-4">
                <Film size={20} className="mx-auto mb-2" style={{ color: S.text3 }} />
                <p className="text-xs" style={{ color: S.text3 }}>暂无视频资产，请先创建故事节点</p>
              </div>
            )}
            {storyNodes.length > 0 && videoPipeline.map(step => {
                const doneCount = step.items.filter(i => i.statusColor === S.success).length;
                return (
                  <div key={step.id} className="rounded-xl overflow-hidden" style={{ background: S.card, border: `1px solid ${S.border}` }}>
                    {/* Step header */}
                    <div className="p-3" style={{ borderBottom: `1px solid ${S.border}` }}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${S.primary}10` }}>
                          <step.icon size={14} style={{ color: S.primary }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-[10px] font-bold block" style={{ color: S.text }}>{step.label}</span>
                          <span className="text-[8px]" style={{ color: S.text3 }}>{step.desc}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: S.s2 }}>
                          <div className="h-full rounded-full" style={{
                            background: doneCount === step.items.length ? S.success : S.primary,
                            width: `${step.items.length > 0 ? (doneCount / step.items.length) * 100 : 0}%`,
                          }} />
                        </div>
                        <span className="text-[8px] font-mono font-bold" style={{ color: doneCount === step.items.length ? S.success : S.text3 }}>
                          {doneCount}/{step.items.length}
                        </span>
                      </div>
                    </div>
                    {/* Items */}
                    <div className="p-2 space-y-1.5">
                      {step.items.map((item, i) => (
                        <div key={i} className="flex items-center gap-2 p-2 rounded-lg" style={{ background: S.s2 }}>
                          <div className="w-10 h-7 rounded flex items-center justify-center shrink-0"
                            style={{ background: "linear-gradient(135deg,#1a1a2e,#16213e)" }}>
                            <Film size={10} style={{ color: "#ffffff40" }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-[9px] font-bold block truncate" style={{ color: S.text }}>{item.name}</span>
                            <span className="text-[8px] font-mono" style={{ color: S.text3 }}>{item.duration}</span>
                          </div>
                          <span className="text-[8px] px-1.5 py-0.5 rounded font-bold shrink-0"
                            style={{ background: `${item.statusColor}12`, color: item.statusColor }}>
                            {item.status}
                          </span>
                        </div>
                      ))}
                    </div>
                    {/* Generate button */}
                    {doneCount < step.items.length && (
                      <div className="px-2 pb-2">
                        <motion.button whileTap={{ scale: 0.97 }}
                          className="w-full flex items-center justify-center gap-1 py-1.5 rounded-lg text-[9px] font-bold focus:outline-none"
                          style={{ background: `${S.primary}08`, border: `1px solid ${S.primary}20`, color: S.primary }}>
                          <Sparkles size={10} /> 生成剩余 {step.items.length - doneCount} 个
                        </motion.button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 节点视频需求看板 */}
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
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white focus:outline-none"
              style={{ background: `linear-gradient(135deg,${S.primary},#A78BFA)` }}>
              <Sparkles size={12} /> AI 批量生成视频
            </motion.button>
          </div>
        </div>
      </>)}

      {/* ── 音频 Tab ── */}
      {activeTab === "audio" && (<>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${S.accent}12` }}>
              <Headphones size={20} style={{ color: S.accent }} />
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

          {/* 4 分类筛选 + 内容 */}
          <div className="flex items-center gap-2">
            {storyNodes.length === 0 && gameCharacters.length === 0 && gameScenes.length === 0 && (
              <div className="flex-1 text-center py-6">
                <Headphones size={20} className="mx-auto mb-2" style={{ color: S.text3 }} />
                <p className="text-xs" style={{ color: S.text3 }}>暂无音频资产，请先创建故事节点、角色和场景</p>
              </div>
            )}
            {(storyNodes.length > 0 || gameCharacters.length > 0 || gameScenes.length > 0) && audioCategories.map(cat => {
              const doneCount = cat.items.filter(i => i.statusColor === S.success).length;
              const CatIcon = cat.icon;
              return (
                <div key={cat.id} className="flex-1 rounded-xl overflow-hidden" style={{ background: S.card, border: `1px solid ${S.border}` }}>
                  {/* Category header */}
                  <div className="p-3" style={{ borderBottom: `1px solid ${S.border}`, background: `${cat.color}04` }}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: `${cat.color}15` }}>
                        <CatIcon size={12} style={{ color: cat.color }} />
                      </div>
                      <span className="text-[10px] font-bold" style={{ color: S.text }}>{cat.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: S.s2 }}>
                        <div className="h-full rounded-full" style={{
                          background: doneCount === cat.items.length ? S.success : cat.color,
                          width: `${cat.items.length > 0 ? (doneCount / cat.items.length) * 100 : 0}%`,
                        }} />
                      </div>
                      <span className="text-[8px] font-mono font-bold" style={{ color: doneCount === cat.items.length ? S.success : S.text3 }}>
                        {doneCount}/{cat.items.length}
                      </span>
                    </div>
                  </div>
                  {/* Items */}
                  <div className="p-2 space-y-1">
                    {cat.items.map((item, i) => (
                      <div key={i} className="flex items-center gap-2 p-2 rounded-lg" style={{ background: S.s2 }}>
                        <div className="w-6 h-6 rounded flex items-center justify-center shrink-0" style={{ background: `${cat.color}10` }}>
                          <Music size={10} style={{ color: cat.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-[9px] font-bold block truncate" style={{ color: S.text }}>{item.name}</span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[7px] font-mono" style={{ color: S.text3 }}>{item.duration}</span>
                            <span className="text-[7px] px-1 py-px rounded" style={{ background: `${cat.color}08`, color: cat.color }}>{item.mood}</span>
                          </div>
                        </div>
                        <span className="text-[7px] px-1.5 py-0.5 rounded font-bold shrink-0"
                          style={{ background: `${item.statusColor}12`, color: item.statusColor }}>
                          {item.status}
                        </span>
                      </div>
                    ))}
                  </div>
                  {/* Batch generate */}
                  {doneCount < cat.items.length && (
                    <div className="px-2 pb-2">
                      <motion.button whileTap={{ scale: 0.97 }}
                        className="w-full flex items-center justify-center gap-1 py-1.5 rounded-lg text-[9px] font-bold focus:outline-none"
                        style={{ background: `${cat.color}08`, border: `1px solid ${cat.color}20`, color: cat.color }}>
                        <Sparkles size={10} /> 生成剩余 {cat.items.length - doneCount} 个
                      </motion.button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

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
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white focus:outline-none"
              style={{ background: `linear-gradient(135deg,${S.primary},#A78BFA)` }}>
              <Sparkles size={12} /> AI 生成 BGM
            </motion.button>
            <motion.button whileTap={{ scale: 0.97 }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold focus:outline-none"
              style={{ background: `${S.accent}12`, border: `1px solid ${S.accent}30`, color: S.accent }}>
              <Mic size={12} /> 批量配音
            </motion.button>
          </div>
        </div>
      </>)}

      {/* ── 资产库 Tab ── */}
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

      {/* ── 文字 Tab ── */}
      {activeTab === "text" && (<>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${S.primary}12` }}>
              <FileText size={20} style={{ color: S.primary }} />
            </div>
            <div className="flex-1">
              <h2 className="text-sm font-bold" style={{ color: S.text }}>文字资产管理</h2>
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

          {/* 剧本 (Script) */}
          <div className="p-4 rounded-xl" style={{ background: S.card, border: `1px solid ${S.border}` }}>
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
              <div className="space-y-1.5">
                {scriptBlocks.map(block => (
                  <div key={block.id} className="flex items-center gap-2 p-2.5 rounded-lg" style={{ background: S.s2, border: `1px solid ${S.border}` }}>
                    <span className="text-[8px] px-1.5 py-0.5 rounded font-bold shrink-0"
                      style={{ background: `${block.color}20`, color: block.color }}>
                      {block.type}
                    </span>
                    <div className="flex-1 min-w-0">
                      <span className="text-[9px] font-bold block truncate" style={{ color: S.text }}>{block.label}</span>
                      <span className="text-[8px] block truncate" style={{ color: S.text3 }}>
                        {block.content.length > 50 ? block.content.slice(0, 50) + "..." : block.content}
                      </span>
                    </div>
                    {block.char && (
                      <span className="text-[8px] px-1.5 py-0.5 rounded shrink-0" style={{ background: `${S.accent}12`, color: S.accent }}>
                        {block.char}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 台词 (Dialogue Lines) */}
          <div className="p-4 rounded-xl" style={{ background: S.card, border: `1px solid ${S.border}` }}>
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
              <div className="space-y-2">
                {gameCharacters.map(char => (
                  <div key={char.id} className="p-3 rounded-lg" style={{ background: S.s2, border: `1px solid ${S.border}` }}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: `${char.color}20` }}>
                        <User size={10} style={{ color: char.color }} />
                      </div>
                      <span className="text-[10px] font-bold" style={{ color: S.text }}>{char.name}</span>
                      <span className="text-[8px]" style={{ color: S.text3 }}>{char.role}</span>
                    </div>
                    <div className="flex gap-1.5 flex-wrap">
                      {char.emotionStates.length > 0 ? char.emotionStates.map((emotion, i) => (
                        <span key={i} className="text-[8px] px-2 py-0.5 rounded-lg"
                          style={{ background: emotion.done ? `${S.success}12` : `${S.warning}10`, color: emotion.done ? S.success : S.warning, border: `1px solid ${emotion.done ? `${S.success}25` : `${S.warning}20`}` }}>
                          {emotion.label} {emotion.done ? "✓" : ""}
                        </span>
                      )) : (
                        <span className="text-[8px]" style={{ color: S.text3 }}>未设置情感状态</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 节点文案 (Node Copy) */}
          <div className="p-4 rounded-xl" style={{ background: S.card, border: `1px solid ${S.border}` }}>
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
              <div className="grid grid-cols-2 gap-2">
                {storyNodes.map(node => {
                  const hasScript = scriptBlocks.some(b => b.label.includes(node.label) || b.id.includes(node.id));
                  const hasDialogue = gameCharacters.some(c => c.appearNodes.includes(node.id));
                  return (
                    <div key={node.id} className="p-2.5 rounded-xl" style={{ background: S.s2, border: `1px solid ${S.border}` }}>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[9px] font-bold" style={{ color: S.text }}>{node.label}</span>
                        <span className="text-[7px] px-1.5 py-0.5 rounded" style={{ background: `${S.primary}10`, color: S.primary }}>
                          {node.type}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <span className="text-[7px] px-1.5 py-0.5 rounded font-bold"
                          style={{ background: hasScript ? `${S.success}12` : `${S.error}08`, color: hasScript ? S.success : S.error }}>
                          {hasScript ? "✓ 剧本" : "✗ 剧本"}
                        </span>
                        <span className="text-[7px] px-1.5 py-0.5 rounded font-bold"
                          style={{ background: hasDialogue ? `${S.success}12` : `${S.error}08`, color: hasDialogue ? S.success : S.error }}>
                          {hasDialogue ? "✓ 台词" : "✗ 台词"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </>)}
    </div>
  );
}
