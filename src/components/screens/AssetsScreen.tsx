"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, AlertTriangle, ChevronRight, ChevronDown,
  User, MapPin, Package, Sparkles, Play, ArrowRight,
  Image, Music, Mic, Film, Plus, Edit2, Check
} from "lucide-react";
import Link from "next/link";
import { STORY_NODES, NODE_EDGES, GAME_SCENES, GAME_CHARACTERS, GAME_PROPS, ASSET_CARDS } from "@/lib/studio-data";

const S = {
  bg:"#F5F6FA", card:"#FFFFFF", s2:"#F4F6FC",
  border:"#E8EAF2", primary:"#7C6CF5", accent:"#00A99D",
  text:"#1A1D2E", text2:"#4A5068", text3:"#8892B0",
  success:"#10B981", warning:"#F59E0B", error:"#EF4444",
};

// ── 顶部步骤进度（角色→场景→道具→素材生产）─────────────────────────────
const PIPELINE_STEPS = [
  { id:"character", label:"角色",     icon:User,    done:true  },
  { id:"scene",     label:"场景",     icon:MapPin,  done:true  },
  { id:"prop",      label:"道具",     icon:Package, done:false },
  { id:"material",  label:"素材生产", icon:Image,   done:false },
];

// ── 角色数据 ──────────────────────────────────────────────────────────────
const CHARACTERS = [
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

// ── 场景数据 ──────────────────────────────────────────────────────────────
const SCENES = [
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

// ── 道具数据 ──────────────────────────────────────────────────────────────
const PROPS = [
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

// ── 节点素材生产状态 ───────────────────────────────────────────────────────
const NODE_ASSETS = [
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

export default function AssetsScreen() {
  const [activeStep, setActiveStep] = useState<string>("character");
  const [selectedChar, setSelectedChar] = useState(0);
  const [selectedScene, setSelectedScene] = useState(0);
  const [generating, setGenerating] = useState<string|null>(null);
  const [genDone, setGenDone] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"pipeline" | "by-node">("pipeline");

  const handleGenerate = (id: string) => {
    setGenerating(id);
    setTimeout(() => {
      setGenerating(null);
      setGenDone(prev => [...prev, id]);
    }, 1800);
  };

  const char = CHARACTERS[selectedChar];
  const scene = SCENES[selectedScene];

  return (
    <div className="h-svh flex flex-col" style={{ background:S.bg }}>

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
                {CHARACTERS.map((c,i) => (
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
                <motion.button whileTap={{ scale:0.97 }} onClick={() => setActiveStep("scene")}
                  className="w-full py-2.5 rounded-xl text-xs font-bold focus:outline-none flex items-center justify-center gap-2"
                  style={{ background:`${S.accent}15`, border:`1px solid ${S.accent}30`, color:S.accent }}>
                  角色配置完成，进入场景配置 <ChevronRight size={12} />
                </motion.button>
              </div>
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
                {SCENES.map((sc,i) => (
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
                <p className="text-xs" style={{ color:S.text3 }}>共 {PROPS.length} 件道具</p>
              </div>
              {PROPS.map(prop => (
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
                <p className="text-xs" style={{ color:S.text3 }}>为 {NODE_ASSETS.length} 个节点批量生成素材</p>
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
                  {NODE_ASSETS.map(node => {
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
            {/* Summary stats */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: "总节点", value: STORY_NODES.length, color: S.primary },
                { label: "有图片", value: ASSET_CARDS.filter(a => a.hasImage).length, color: S.success },
                { label: "缺 BGM", value: ASSET_CARDS.filter(a => !a.hasBgm).length, color: S.warning },
                { label: "缺配音", value: ASSET_CARDS.filter(a => !a.hasVoice).length, color: S.error },
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
                <h3 className="text-xs font-bold" style={{ color: S.text }}>资产生产看板</h3>
                <div className="flex gap-1.5">
                  <motion.button whileTap={{ scale: 0.97 }}
                    onClick={() => handleGenerate("batch-bgm")}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-bold focus:outline-none"
                    style={{ background: `${S.warning}12`, border: `1px solid ${S.warning}25`, color: S.warning }}>
                    <Music size={9} /> 一键生成全部 BGM
                  </motion.button>
                </div>
              </div>
              
              {/* Priority groups */}
              {[
                { 
                  priority: "阻塞发布", 
                  color: S.error, 
                  items: ASSET_CARDS.filter(a => !a.hasImage).map(a => ({
                    node: a, type: "场景图片", reason: "缺少核心视觉资产"
                  }))
                },
                { 
                  priority: "影响体验", 
                  color: S.warning, 
                  items: ASSET_CARDS.filter(a => !a.hasBgm).map(a => ({
                    node: a, type: "背景音乐", reason: "缺少 BGM 影响沉浸感"
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
                          <p className="text-[9px] font-bold truncate" style={{ color: S.text }}>{item.node.nodeLabel}</p>
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
              <h3 className="text-xs font-bold mb-3" style={{ color: S.text }}>节点资产依赖详情</h3>
              <div className="space-y-2">
                {ASSET_CARDS.map(asset => {
                  const node = STORY_NODES.find(n => n.id === asset.nodeId);
                  const scene = GAME_SCENES.find(s => s.refNodes.includes(asset.nodeId));
                  const chars = GAME_CHARACTERS.filter(c => c.appearNodes.includes(asset.nodeId));
                  const props = GAME_PROPS.filter(p => p.refNodes.includes(asset.nodeId));
                  const missing = [!asset.hasImage, !asset.hasBgm, !asset.hasVoice, !asset.hasVideo].filter(Boolean).length;
                  
                  return (
                    <div key={asset.nodeId} className="p-3 rounded-xl"
                      style={{ background: S.s2, border: `1px solid ${missing > 0 ? `${S.warning}30` : `${S.success}30`}` }}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold" style={{ color: S.text }}>{asset.nodeLabel}</span>
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
          </div>
        )}
      </div>
    </div>
  );
}
