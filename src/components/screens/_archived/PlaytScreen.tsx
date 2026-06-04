"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { SkipBack, RefreshCw, ChevronRight } from "lucide-react";
import { getCurrentProject } from "@/store";

const S = {
  card:"#FFFFFF", s2:"#F4F6FC", border:"#E2E5F0",
  primary:"#5E50E8", accent:"#00A99D",
  text:"#1A1D2E", text2:"#4A5068", text3:"#8892B0",
  success:"#059669", warning:"#D97706", error:"#DC2626",
};

const NODES: Record<string,{text:string;char:string;choices?:{label:string;next:string;effect:string}[];isEnding?:boolean;endingType?:"good"|"bad"}> = {
  N01:{ char:"旁白",   text:"2047年，深夜。霓虹灯光把积水的城市街道染成猩红。艾拉站在一扇锈门前，追踪信号在此中断。", choices:[{label:"推门进入",next:"N02",effect:"+0"},{label:"先观察环境",next:"N02",effect:"+trust 5"}] },
  N02:{ char:"线人",   text:"你来了。那枚追踪芯片，他们已经发现了。你必须在他们找到我之前做出选择。", choices:[{label:"相信线人，一起行动",next:"N03A",effect:"+trust_lineman 20"},{label:"保持怀疑，独自调查",next:"N03B",effect:"-trust_lineman 10"}] },
  N03A:{ char:"艾拉",  text:"你跟着线人穿过地下通道，抵达藏匿地点。这里存放着所有证据。", choices:[{label:"取走证据，立即撤离",next:"GOOD",effect:"+truth 50"},{label:"设置陷阱等待敌人",next:"GOOD",effect:"+stealth 30"}] },
  N03B:{ char:"旁白",  text:"你选择单独行动，却在追踪过程中暴露了位置。警卫迅速包围了这片区域。", choices:[{label:"强行突破",next:"BAD",effect:"-hp 40"},{label:"立即撤退",next:"N02",effect:"-stealth 20"}] },
  GOOD:{ char:"结局A", text:"【幽灵归来】\n艾拉带着证据安全撤离。真相终将浮出水面，而她已消失在霓虹夜幕中。", isEnding:true, endingType:"good" },
  BAD: { char:"结局B", text:"【今夜失败】\n艾拉被捕，证据湮没。但她记住了这条路，还有下一次机会。", isEnding:true, endingType:"bad" },
};

const INIT = { stealth_score:55, alert_level:30, trust_lineman:20, truth:0 };

export default function PlaytScreen() {
  const projectName = getCurrentProject()?.title || "当前项目";
  const [nodeId, setNodeId] = useState("N01");
  const [vars, setVars] = useState({...INIT});
  const [path, setPath] = useState(["N01"]);
  const node = NODES[nodeId];

  const choose = (c: {label:string;next:string;effect:string}) => {
    const nv = {...vars};
    const m = c.effect.match(/([+-])(\w+)\s+(\d+)/);
    if(m){ const k=m[2] as keyof typeof nv; if(k in nv) nv[k]=nv[k]+(m[1]==="+"?1:-1)*parseInt(m[3]); }
    setVars(nv); setNodeId(c.next); setPath(p=>[...p,c.next]);
  };
  const reset = () => { setNodeId("N01"); setVars({...INIT}); setPath(["N01"]); };

  return (
    <div className="h-svh flex overflow-hidden" style={{ background:"#F8F9FC" }}>
      {/* 左：播放器 */}
      <div className="flex-1 flex flex-col items-center justify-between p-4 overflow-y-auto">
        <div className="w-full max-w-xs rounded-2xl overflow-hidden"
          style={{ background: node.isEnding ? (node.endingType==="good" ? "linear-gradient(160deg,#0f4c2a,#1a6b3a)" : "linear-gradient(160deg,#4c0f0f,#6b1a1a)") : "linear-gradient(160deg,#0d1117,#1a1f2e)" }}>
          <div className="px-4 pt-4 pb-2 flex items-center justify-between">
            <span className="text-[9px] font-bold uppercase tracking-wider"
              style={{ color: node.isEnding ? (node.endingType==="good"?"#4ade80":"#f87171") : "#a78bfa" }}>
              {node.isEnding ? (node.endingType==="good"?"✦ 结局A":"✕ 结局B") : `节点 ${nodeId}`}
            </span>
            <span className="text-[8px] font-mono" style={{ color:"rgba(255,255,255,0.3)" }}>{projectName}</span>
          </div>
          <div className="flex justify-center py-4">
            <div className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl"
              style={{ background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.12)" }}>
              {node.isEnding ? (node.endingType==="good"?"🌟":"💀") : (node.char==="旁白"?"🌃":"👤")}
            </div>
          </div>
          <div className="mx-3 mb-3 px-3 py-2.5 rounded-xl" style={{ background:"rgba(0,0,0,0.5)" }}>
            <span className="text-[9px] font-bold block mb-1"
              style={{ color: node.char==="旁白"?"#a78bfa":node.char.includes("结局")?"#4ade80":"#5eead4" }}>
              【{node.char}】
            </span>
            <p className="text-[11px] leading-relaxed whitespace-pre-line" style={{ color:"rgba(255,255,255,0.9)" }}>
              {node.text}
            </p>
          </div>
          {!node.isEnding && node.choices && (
            <div className="px-3 pb-4 space-y-2">
              {node.choices.map((c,i)=>(
                <motion.button key={i} whileTap={{ scale:0.97 }} onClick={()=>choose(c)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-white focus:outline-none"
                  style={{ background:"rgba(94,80,232,0.35)", border:"1px solid rgba(94,80,232,0.5)" }}>
                  <span>{c.label}</span><ChevronRight size={12}/>
                </motion.button>
              ))}
            </div>
          )}
          {node.isEnding && (
            <div className="px-3 pb-4">
              <motion.button whileTap={{ scale:0.97 }} onClick={reset}
                className="w-full py-2 rounded-xl text-xs font-bold text-white focus:outline-none"
                style={{ background:"rgba(255,255,255,0.15)" }}>重新开始</motion.button>
            </div>
          )}
        </div>
        <div className="flex gap-2 mt-3">
          <motion.button whileTap={{ scale:0.92 }} onClick={reset}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs focus:outline-none"
            style={{ background:S.card, border:`1px solid ${S.border}`, color:S.text3 }}>
            <SkipBack size={11}/> 从头开始
          </motion.button>
          <motion.button whileTap={{ scale:0.92 }} onClick={()=>{setNodeId("N01");setPath(["N01"])}}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs focus:outline-none"
            style={{ background:S.card, border:`1px solid ${S.border}`, color:S.text3 }}>
            <RefreshCw size={11}/> 重置变量
          </motion.button>
        </div>
      </div>

      {/* 右：调试面板 */}
      <div className="w-[200px] shrink-0 border-l overflow-y-auto hidden md:block"
        style={{ borderColor:S.border, background:S.card }}>
        <div className="px-3 py-2 border-b" style={{ borderColor:S.border }}>
          <p className="text-[8px] font-bold uppercase tracking-wider" style={{ color:S.primary }}>调试面板</p>
        </div>
        <div className="px-3 py-2 border-b" style={{ borderColor:S.border }}>
          <p className="text-[8px] mb-1 font-bold" style={{ color:S.text3 }}>当前节点</p>
          <span className="text-xs font-bold" style={{ color:S.text }}>{nodeId}</span>
          {node.isEnding && (
            <span className="ml-2 text-[8px] px-1.5 py-0.5 rounded"
              style={{ background: node.endingType==="good"?"#d1fae5":"#fee2e2",
                color: node.endingType==="good" ? S.success : S.error }}>
              {node.endingType==="good"?"结局A":"结局B"}
            </span>
          )}
        </div>
        <div className="px-3 py-2 border-b" style={{ borderColor:S.border }}>
          <p className="text-[8px] mb-1.5 font-bold" style={{ color:S.text3 }}>当前路径</p>
          <div className="flex flex-wrap gap-0.5">
            {path.map((p,i)=>(
              <span key={i} className="text-[8px] font-mono px-1 py-0.5 rounded"
                style={{ background: i===path.length-1 ? `${S.primary}15` : S.s2,
                  color: i===path.length-1 ? S.primary : S.text3 }}>
                {p}{i<path.length-1?"→":""}
              </span>
            ))}
          </div>
        </div>
        <div className="px-3 py-2">
          <p className="text-[8px] mb-1.5 font-bold" style={{ color:S.text3 }}>变量状态</p>
          <div className="space-y-1.5">
            {Object.entries(vars).map(([k,v])=>(
              <div key={k} className="flex justify-between">
                <span className="text-[9px] font-mono" style={{ color:S.text3 }}>{k}</span>
                <span className="text-[9px] font-mono font-bold"
                  style={{ color: k==="stealth_score"&&v<60 ? S.error : k==="alert_level"&&v>60 ? S.warning : S.accent }}>
                  {v}{k==="stealth_score"&&v<60?" ⚠":""}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
