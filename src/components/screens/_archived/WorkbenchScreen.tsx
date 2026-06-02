"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, AlertTriangle, ChevronRight,
  Sparkles, Play, Send, ChevronDown, ChevronUp, Bot
} from "lucide-react";
import Link from "next/link";

import OverviewTab  from "@/components/workbench/tabs/OverviewTab";
import ScriptTab    from "@/components/workbench/tabs/ScriptTab";
import PlaytestTab  from "@/components/workbench/tabs/PlaytestTab";
import AssetsTab    from "@/components/workbench/tabs/AssetsTab";
import PublishTab   from "@/components/workbench/tabs/PublishTab";

const S = {
  bg:"#FAFBFF", card:"#FFFFFF", s2:"#F4F6FC",
  border:"#E2E5F0", border2:"#CBD0E5",
  primary:"#5E50E8", accent:"#00A99D",
  text:"#1A1D2E", text2:"#4A5068", text3:"#8892B0",
  success:"#059669", warning:"#D97706", error:"#DC2626",
};

const TABS = ["总览","剧本","节点图","试玩","发布"];

// ─── 上下文感知 Agent 消息（随 Tab 变化）────────────────────────────────────
const TAB_CONTEXT: Record<string, { label:string; msgs:string[] }> = {
  "总览":   { label:"项目整体状态", msgs:[
    "项目完成度83%，主线结构良好。",
    "⚠ 9个节点BGM全部缺失，建议进入资产库批量补齐。",
    "建议增加2-3个选择节点提升互动密度。",
  ]},
  "AI制作": { label:"AI制作流程", msgs:[
    "互动改编模式已锁定，第3步正在执行。",
    "SceneAgent 正在分析6个场景的光线和氛围特征。",
    "完成后点「应用到工作台」将结果写入项目工程。",
  ]},
  "剧本":   { label:"当前剧本章节", msgs:[
    "第一章共7个场景块，3个选择分支。",
    "💡 可以用「转为节点图」一键把当前剧本结构转换成DAG节点图。",
    "发现1处条件块变量引用未定义，建议在资产库添加变量。",
  ]},
  "节点图": { label:"选中节点：N07 潜行判定", msgs:[
    "⚠ N07 缺少判定失败的反馈文案，玩家失败后没有明确提示。",
    "建议增加一个「失败→补救」的分支，提升容错体验。",
    "当前条件：stealth_score ≥ 60，可以考虑增加技能检定说明。",
  ]},
  "资产库": { label:"素材缺失状态", msgs:[
    "共9个节点，BGM全部缺失（0/9），是当前最高优先级任务。",
    "角色立绘：艾拉2/4状态已生成，「受伤」和「沉默」待补。",
    "💡 点「批量生成BGM」可一次性提交所有节点的配乐生成任务。",
  ]},
  "试玩":   { label:"调试模式", msgs:[
    "当前变量 stealth_score=55，低于N07判定阈值60。",
    "玩家将走向「身份暴露(N09)→今夜失败」结局路径。",
    "💡 调整初始变量或修改N07条件值可以改变分支走向。",
  ]},
  "发布":   { label:"发布检查", msgs:[
    "6/8项检查通过，BGM缺失和场景图片缺失需处理。",
    "H5已发布，当前版本可分享。更新发布后链接不变。",
    "💡 导出JSON可用于开发同学对接后端节点数据。",
  ]},
};

// ─── 通用 Agent 对话面板 ─────────────────────────────────────────────────────
function AgentPanel({ tabName, extraTop }: { tabName: string; extraTop?: React.ReactNode }) {
  const ctx = TAB_CONTEXT[tabName] ?? TAB_CONTEXT["总览"];
  const [msgs, setMsgs] = useState<{ role:"ai"|"user"; text:string }[]>(ctx.msgs.map(t => ({ role:"ai" as const, text:t })));
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMsgs(ctx.msgs.map(t => ({ role:"ai" as const, text:t })));
  }, [tabName]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior:"smooth" }); }, [msgs]);

  const send = () => {
    if (!input.trim()) return;
    const userMsg = { role:"user" as const, text: input };
    const aiReply = { role:"ai" as const, text:`针对「${input}」，正在分析当前${ctx.label}上下文……` };
    setMsgs(m => [...m, userMsg, aiReply]);
    setInput("");
  };

  return (
    <div className="w-[200px] shrink-0 border-l flex flex-col overflow-hidden"
      style={{ borderColor:S.border, background:S.card }}>
      {/* 标题栏 */}
      <div className="px-3 py-2 border-b flex items-center gap-1.5 shrink-0" style={{ borderColor:S.border }}>
        <Bot size={11} color={S.primary} />
        <div className="flex-1 min-w-0">
          <span className="text-[9px] font-bold block" style={{ color:S.text }}>AI 项目导演</span>
          <span className="text-[8px] truncate block" style={{ color:S.text3 }}>{ctx.label}</span>
        </div>
      </div>

      {/* 额外顶部区域（试玩Tab传入调试信息） */}
      {extraTop}

      {/* 消息区 */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
        {msgs.map((msg,i) => (
          <motion.div key={i} initial={{ opacity:0, y:3 }} animate={{ opacity:1, y:0 }}
            className={`flex gap-1.5 ${msg.role==="user" ? "flex-row-reverse" : ""}`}>
            <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
              style={{ background: msg.role==="ai" ? `${S.primary}15` : S.s2 }}>
              <span className="text-[7px] font-bold" style={{ color: msg.role==="ai" ? S.primary : S.text3 }}>
                {msg.role==="ai" ? "AI" : "我"}
              </span>
            </div>
            <div className="max-w-[80%] px-2 py-1.5 rounded-xl text-[9px] leading-relaxed"
              style={{ background: msg.role==="ai" ? S.s2 : `${S.primary}10`,
                color:S.text2, border:`1px solid ${msg.role==="ai" ? S.border : `${S.primary}20`}` }}>
              {msg.text}
            </div>
          </motion.div>
        ))}
        <div ref={endRef} />
      </div>

      {/* 输入框 */}
      <div className="px-2.5 py-2 border-t shrink-0" style={{ borderColor:S.border }}>
        <div className="flex gap-1.5 items-center rounded-lg px-2.5 py-1.5"
          style={{ background:S.s2, border:`1.5px solid ${input ? S.primary : S.border}` }}>
          <input value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key==="Enter" && send()}
            placeholder="问项目导演…"
            className="flex-1 text-[9px] bg-transparent focus:outline-none" style={{ color:S.text }} />
          <motion.button whileTap={{ scale:0.9 }} onClick={send} className="focus:outline-none">
            <Send size={10} color={input ? S.primary : S.text3} />
          </motion.button>
        </div>
      </div>
    </div>
  );
}

// ─── AI制作Tab ────────────────────────────────────────────────────────────────
const AI_STEPS = [
  { n:1,  label:"提取故事大纲",     agent:"StoryAgent",   st:"done"    },
  { n:2,  label:"提炼角色设定",     agent:"PersonaAgent", st:"done"    },
  { n:3,  label:"提取场景设定",     agent:"SceneAgent",   st:"running" },
  { n:4,  label:"提取道具设定",     agent:"PropAgent",    st:"pending" },
  { n:5,  label:"生成互动节点图",   agent:"FlowAgent",    st:"pending" },
  { n:6,  label:"生成选择项与变量", agent:"ChoiceAgent",  st:"pending" },
  { n:7,  label:"生成多结局系统",   agent:"EndingAgent",  st:"pending" },
  { n:8,  label:"逻辑连通性检查",   agent:"LogicAgent",   st:"pending" },
  { n:9,  label:"生成素材需求清单", agent:"AssetAgent",   st:"pending" },
  { n:10, label:"发布前完整校验",   agent:"PublishAgent", st:"pending" },
];

function AIProductionTab() {
  const doneCount = AI_STEPS.filter(s => s.st==="done").length;
  const runningStep = AI_STEPS.find(s => s.st==="running");

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ background:S.bg }}>
      {/* ── 顶部进度轨道（48px，紧凑）── */}
      <div className="shrink-0 px-4 py-2.5 border-b" style={{ borderColor:S.border, background:S.card }}>
        <div className="flex items-center gap-0.5 overflow-x-auto">
          {AI_STEPS.map((step, i) => (
            <div key={i} className="flex items-center shrink-0">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-bold ${step.st==="running" ? "animate-pulse" : ""}`}
                style={{
                  background: step.st==="done" ? `${S.success}15` : step.st==="running" ? `${S.primary}15` : S.s2,
                  border:`1.5px solid ${step.st==="done" ? S.success : step.st==="running" ? S.primary : S.border2}`,
                  color: step.st==="done" ? S.success : step.st==="running" ? S.primary : S.text3,
                }}>
                {step.st==="done" ? "✓" : step.n}
              </div>
              {i < AI_STEPS.length-1 && (
                <div className="w-2.5 h-px shrink-0" style={{ background: step.st==="done" ? `${S.success}50` : S.border }} />
              )}
            </div>
          ))}
          <span className="text-[9px] ml-2 shrink-0" style={{ color:S.text3 }}>{doneCount}/10</span>
        </div>
      </div>

      {/* ── 当前执行步骤产物 ── */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {/* 已完成产物 */}
        <div>
          <p className="text-[9px] font-bold uppercase tracking-wider mb-2" style={{ color:S.text3 }}>已完成产物</p>
          {AI_STEPS.filter(s => s.st==="done").map((s,i) => (
            <div key={i} className="mb-1.5 p-2.5 rounded-xl" style={{ background:S.card, border:`1px solid ${S.success}25` }}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold" style={{ color:S.text }}>{s.n}. {s.label}</span>
                <CheckCircle2 size={12} color={S.success} />
              </div>
              <span className="text-[9px]" style={{ color:S.text3 }}>{s.agent}</span>
              {s.n===1 && <p className="text-[9px] mt-1 px-2 py-1 rounded" style={{ background:S.s2, color:S.text2 }}>赛博都市·追踪任务·三条分支·2个结局</p>}
              {s.n===2 && <p className="text-[9px] mt-1 px-2 py-1 rounded" style={{ background:S.s2, color:S.text2 }}>艾拉（女主）/ 线人 / 反派主管 · 3角色完成</p>}
            </div>
          ))}
        </div>

        {/* 进行中 */}
        {runningStep && (
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wider mb-2" style={{ color:S.primary }}>⟳ 正在执行</p>
            <div className="p-3 rounded-xl animate-pulse" style={{ background:`${S.primary}06`, border:`1px solid ${S.primary}40` }}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold" style={{ color:S.primary }}>{runningStep.n}. {runningStep.label}</span>
                <span className="text-[8px] px-1.5 py-0.5 rounded font-mono" style={{ background:`${S.primary}15`, color:S.primary }}>执行中</span>
              </div>
              <span className="text-[9px]" style={{ color:S.text3 }}>{runningStep.agent} · 分析场景光线/色调/氛围…</span>
              <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ background:S.s2 }}>
                <motion.div className="h-full rounded-full" style={{ background:S.primary }}
                  animate={{ width:["20%","60%","35%"] }} transition={{ duration:2, repeat:Infinity }} />
              </div>
            </div>
          </div>
        )}

        {/* 底部操作 */}
        <div className="flex gap-2 pt-1">
          <motion.button whileTap={{ scale:0.97 }}
            className="flex-1 py-2 rounded-lg text-xs font-bold text-white focus:outline-none"
            style={{ background:S.primary }}>▶ 继续执行</motion.button>
          <Link href="/parse" className="flex-1">
            <motion.button whileTap={{ scale:0.97 }}
              className="w-full py-2 rounded-lg text-xs font-bold focus:outline-none"
              style={{ background:`${S.accent}15`, border:`1px solid ${S.accent}30`, color:S.accent }}>
              完整工厂 →
            </motion.button>
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── 节点图Tab（含Inspector，右侧不再显示静态按钮）─────────────────────────────
function NodeGraphTab() {
  const [selId, setSelId] = useState<string|null>("N07");
  const NODES = [
    { id:"N01", label:"序章·霓虹夜幕",  type:"start",        x:160, y:30  },
    { id:"N02", label:"任务简报",        type:"scene",        x:160, y:110 },
    { id:"N03", label:"进入路线？",      type:"choice",       x:160, y:190 },
    { id:"N04", label:"暗夜通道",        type:"scene",        x:70,  y:280 },
    { id:"N05", label:"换装渗透",        type:"scene",        x:250, y:280 },
    { id:"N06", label:"警卫逼近",        type:"qte",          x:160, y:370 },
    { id:"N07", label:"潜行判定",        type:"condition",    x:160, y:450, hasError:true },
    { id:"N08", label:"数据到手",        type:"scene",        x:70,  y:540 },
    { id:"N09", label:"身份暴露",        type:"scene",        x:250, y:540 },
    { id:"N10", label:"幽灵归来",        type:"ending_good",  x:70,  y:630 },
    { id:"N11", label:"今夜失败",        type:"ending_bad",   x:250, y:630 },
  ];
  const EDGES=[["N01","N02"],["N02","N03"],["N03","N04"],["N03","N05"],["N04","N06"],["N05","N06"],["N06","N07"],["N07","N08"],["N07","N09"],["N08","N10"],["N09","N11"]];
  const TYPE_COLOR: Record<string,string> = {
    start:"#4A6CF7", scene:S.text3, choice:S.accent, condition:S.warning, qte:"#EA580C", ending_good:S.success, ending_bad:S.error,
  };
  const selNode = NODES.find(n=>n.id===selId);
  return (
    <div className="h-full flex overflow-hidden">
      <div className="flex-1 relative overflow-auto"
        style={{ background:"#EEF1F8", backgroundImage:"linear-gradient(#D5DAEA 1px,transparent 1px),linear-gradient(90deg,#D5DAEA 1px,transparent 1px)", backgroundSize:"24px 24px" }}>
        <div style={{ width:360, height:700, position:"relative", margin:"12px auto" }}>
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            <defs><linearGradient id="ngeg" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor={S.primary}/><stop offset="100%" stopColor={S.accent}/></linearGradient></defs>
            {EDGES.map(([f,t],i)=>{const fn=NODES.find(n=>n.id===f),tn=NODES.find(n=>n.id===t);if(!fn||!tn)return null;const m=(fn.y+36+tn.y)/2;return<path key={i} d={`M ${fn.x},${fn.y+36} C ${fn.x},${m} ${tn.x},${m} ${tn.x},${tn.y}`} fill="none" stroke={(tn as any).hasError?"#DC2626":"url(#ngeg)"} strokeWidth={1.5} strokeDasharray={(tn as any).hasError?"4":undefined} opacity={0.65}/>;} )}
          </svg>
          {NODES.map(node=>(
            <motion.button key={node.id} whileTap={{scale:0.97}} onClick={()=>setSelId(node.id===selId?null:node.id)}
              className="absolute rounded-lg text-left focus:outline-none"
              style={{left:node.x-70,top:node.y,width:140,padding:"6px 10px",background:S.card,
                border:`1px solid ${selId===node.id?S.primary:(node as any).hasError?"#DC2626":TYPE_COLOR[node.type]}`,
                borderStyle:(node as any).hasError?"dashed":"solid",
                boxShadow:selId===node.id?`0 0 0 2px ${S.primary}25`:"0 1px 4px rgba(0,0,0,0.06)",zIndex:selId===node.id?20:10}}>
              <span className="text-[8px] font-bold uppercase block mb-0.5" style={{color:(node as any).hasError?"#DC2626":TYPE_COLOR[node.type]}}>
                {node.type==="ending_good"?"★ 结局A":node.type==="ending_bad"?"✕ 结局B":node.type==="choice"?"⚖ 选择":node.type==="condition"?"◆ 条件":node.type==="qte"?"⚡ QTE":node.type==="start"?"▶ 起始":"● 场景"}{(node as any).hasError?" ⚠":""}
              </span>
              <p className="text-[10px] font-bold truncate" style={{color:(node as any).hasError?"#DC2626":S.text}}>{node.label}</p>
            </motion.button>
          ))}
        </div>
      </div>
      {/* 节点Inspector（选中时显示，无选中时空） */}
      {selNode && (
        <div className="w-[160px] shrink-0 border-l overflow-y-auto" style={{borderColor:S.border,background:S.card}}>
          <div className="px-3 py-2 border-b" style={{borderColor:S.border}}>
            <p className="text-[8px] font-bold uppercase tracking-wider" style={{color:S.primary}}>Inspector</p>
            <p className="text-[10px] font-bold mt-0.5" style={{color:S.text}}>{selNode.label}</p>
          </div>
          {(selNode as any).hasError&&(
            <div className="mx-2.5 mt-2 px-2 py-1.5 rounded-lg" style={{background:"#FEF2F2",border:"1px solid rgba(220,38,38,0.25)"}}>
              <p className="text-[9px]" style={{color:"#DC2626"}}>⚠ 缺少失败反馈文案</p>
            </div>
          )}
          {selNode.type==="condition"&&(
            <div className="px-3 py-2">
              <p className="text-[8px] font-bold mb-1.5" style={{color:S.text3}}>条件配置</p>
              {[["变量","stealth_score"],["运算符","≥"],["比较值","60"]].map(([k,v])=>(
                <div key={k} className="flex justify-between text-[9px] mb-0.5"><span style={{color:S.text3}}>{k}</span><span className="font-mono font-bold" style={{color:S.accent}}>{v}</span></div>
              ))}
              <div className="mt-1.5 space-y-1">
                {[["真","→N08 数据到手","#059669"],["假","→N09 身份暴露","#DC2626"]].map(([t,v,c])=>(
                  <div key={t} className="flex items-center gap-1 px-2 py-0.5 rounded text-[9px]" style={{background:`${c}10`,border:`1px solid ${c}25`}}>
                    <span className="font-bold" style={{color:c}}>{t}</span><span style={{color:S.text2}}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {selNode.type==="choice"&&(
            <div className="px-3 py-2 space-y-1.5">
              {[{label:"A 暗夜通道",detail:"→N04 · stealth+5"},{label:"B 换装渗透",detail:"→N05 · alert-10"}].map(o=>(
                <div key={o.label} className="p-2 rounded-lg" style={{background:S.s2,border:`1px solid ${S.border}`}}>
                  <p className="text-[9px] font-bold" style={{color:S.accent}}>{o.label}</p>
                  <p className="text-[8px]" style={{color:S.text3}}>{o.detail}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── 主工作台 ─────────────────────────────────────────────────────────────────
export default function WorkbenchScreen() {
  const [tab, setTab] = useState(0);
  const [treeOpen, setTreeOpen] = useState(true);
  const tabName = TABS[tab];

  // 试玩Tab右侧：调试信息（上）+ Agent（下）
  const playtestDebug = tab===5 ? (
    <div className="px-3 py-2 border-b shrink-0" style={{ borderColor:S.border }}>
      <p className="text-[8px] font-bold uppercase tracking-wider mb-1.5" style={{ color:S.text3 }}>调试信息</p>
      <div className="space-y-1 text-[9px]">
        <div className="flex justify-between"><span style={{color:S.text3}}>当前节点</span><span className="font-bold font-mono" style={{color:S.text}}>N07</span></div>
        <div className="flex justify-between"><span style={{color:S.text3}}>stealth_score</span><span className="font-bold font-mono" style={{color:S.error}}>55 ⚠</span></div>
        <div className="flex justify-between"><span style={{color:S.text3}}>alert_level</span><span className="font-bold font-mono" style={{color:S.warning}}>70</span></div>
        <div className="flex justify-between"><span style={{color:S.text3}}>判定结果</span><span className="font-bold" style={{color:S.error}}>失败</span></div>
        <div className="flex justify-between"><span style={{color:S.text3}}>下一节点</span><span className="font-bold font-mono" style={{color:S.text}}>N09</span></div>
      </div>
    </div>
  ) : undefined;

  const renderTab = () => {
    switch(tab) {
      case 0: return <OverviewTab />;
      case 1: return <ScriptTab />;
      case 2: return <NodeGraphTab />;
      case 3: return <PlaytestTab />;
      case 4: return <PublishTab />;
      default: return null;
    }
  };

  return (
    <div className="h-svh flex flex-col" style={{ background:S.bg }}>
      {/* 顶部项目状态栏 */}
      <div className="flex items-center justify-between px-4 py-2 shrink-0"
        style={{ background:S.card, borderBottom:`1px solid ${S.border}` }}>
        <div className="flex items-center gap-2">
          <Link href="/"><span className="text-xs cursor-pointer" style={{ color:S.primary }}>← 创作台</span></Link>
          <span style={{ color:S.border2 }}>›</span>
          <span className="text-xs font-bold" style={{ color:S.text }}>幽灵协议</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background:`${S.accent}12`, color:S.accent }}>赛博朋克</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <div className="h-1.5 w-14 rounded-full overflow-hidden" style={{ background:S.s2 }}>
              <div className="h-full rounded-full" style={{ width:"83%", background:`linear-gradient(to right,${S.primary},${S.accent})` }} />
            </div>
            <span className="text-[9px] font-mono font-bold" style={{ color:S.primary }}>83%</span>
          </div>
          <motion.button whileTap={{ scale:0.95 }} onClick={() => setTab(5)}
            className="flex items-center gap-1 px-2 py-1 rounded text-[9px] font-bold focus:outline-none"
            style={{ background:`${S.primary}10`, border:`1px solid ${S.primary}20`, color:S.primary }}>
            <Play size={9} /> 试玩
          </motion.button>
          <motion.button whileTap={{ scale:0.95 }} onClick={() => setTab(6)}
            className="flex items-center gap-1 px-2 py-1 rounded text-[9px] font-bold text-white focus:outline-none"
            style={{ background:S.primary }}>
            🚀 发布
          </motion.button>
        </div>
      </div>

      {/* 7个Tab */}
      <div className="flex shrink-0 overflow-x-auto border-b" style={{ background:S.card, borderColor:S.border }}>
        {TABS.map((t,i) => (
          <motion.button key={t} whileTap={{ scale:0.97 }} onClick={() => setTab(i)}
            className="relative shrink-0 px-3 py-2 text-[11px] font-bold focus:outline-none whitespace-nowrap"
            style={{ color:tab===i ? S.primary : S.text3 }}>
            {t}
            {tab===i && <motion.div layoutId="wb-ul" className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t"
              style={{ background:`linear-gradient(to right,${S.primary},${S.accent})` }} />}
          </motion.button>
        ))}
      </div>

      {/* 三栏主体 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左栏：项目结构树（试玩Tab隐藏） */}
        {tab !== 5 && (
          <div className="w-[180px] shrink-0 border-r overflow-y-auto" style={{ borderColor:S.border, background:S.card }}>
            <button className="w-full flex items-center justify-between px-3 py-2 text-[9px] font-bold uppercase tracking-wider border-b focus:outline-none"
              style={{ color:S.text3, borderColor:S.border }} onClick={() => setTreeOpen(o=>!o)}>
              项目结构 {treeOpen ? <ChevronUp size={10}/> : <ChevronDown size={10}/>}
            </button>
            {treeOpen && (
              <div className="px-2 py-2">
                {[
                  { label:"▾ 第一章 渗透行动", children:["N01 序章·霓虹夜幕","N02 任务简报","N03 进入路线","N04 暗夜通道","N05 换装渗透","N06 警卫逼近","N07 潜行判定 ⚠","N08 数据到手","N09 身份暴露","N10 幽灵归来","N11 今夜失败"] },
                  { label:"▾ 角色 (3)", children:["艾拉","线人","反派主管"] },
                  { label:"▾ 场景 (6)", children:["霓虹街道","地下酒吧","天台"] },
                  { label:"▾ 道具 (9)", children:["追踪芯片","变声器","加密硬盘"] },
                ].map(sec=>(
                  <div key={sec.label} className="mb-2">
                    <p className="text-[9px] font-bold px-1 mb-1" style={{ color:S.text3 }}>{sec.label}</p>
                    {sec.children.map(c=>(
                      <motion.div key={c} whileTap={{ scale:0.98 }}
                        className="text-[9px] px-2 py-0.5 rounded cursor-pointer"
                        style={{ color:c.includes("⚠") ? S.warning : S.text2 }}>{c}</motion.div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 中央主区 */}
        <div className="flex-1 overflow-hidden min-w-0">
          <AnimatePresence mode="wait">
            <motion.div key={tab} initial={{ opacity:0, y:4 }} animate={{ opacity:1, y:0 }}
              exit={{ opacity:0 }} transition={{ duration:0.12 }} className="h-full">
              {renderTab()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* 右侧：始终是Agent对话面板（所有Tab，包括节点图和试玩） */}
        <AgentPanel tabName={tabName} extraTop={playtestDebug} />
      </div>
    </div>
  );
}
