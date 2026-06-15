import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, AlertTriangle, Zap } from "lucide-react";

const S = {
  bg:"#FAFBFF", card:"#FFFFFF", s2:"#F4F6FC",
  border:"#E2E5F0", primary:"#5E50E8", accent:"#00A99D",
  text:"#1A1D2E", text2:"#4A5068", text3:"#8892B0",
  success:"#059669", warning:"#D97706", error:"#DC2626",
};

const ASSET_TABS = ["场景背景","角色立绘","BGM","配音","视频"];

const SCENE_NODES = [
  { id:"N01", label:"序章·霓虹夜幕", hasImg:true,  hasBgm:false, hasVoice:false, hasVideo:false },
  { id:"N02", label:"任务简报",       hasImg:true,  hasBgm:false, hasVoice:false, hasVideo:false },
  { id:"N03", label:"进入路线",       hasImg:true,  hasBgm:false, hasVoice:false, hasVideo:false },
  { id:"N04", label:"暗夜通道",       hasImg:true,  hasBgm:false, hasVoice:false, hasVideo:false },
  { id:"N05", label:"换装渗透",       hasImg:true,  hasBgm:false, hasVoice:false, hasVideo:false },
  { id:"N06", label:"警卫逼近",       hasImg:false, hasBgm:false, hasVoice:false, hasVideo:false },
  { id:"N07", label:"潜行判定",       hasImg:true,  hasBgm:false, hasVoice:false, hasVideo:false },
  { id:"N08", label:"数据到手",       hasImg:true,  hasBgm:false, hasVoice:false, hasVideo:false },
  { id:"N09", label:"身份暴露",       hasImg:false, hasBgm:false, hasVoice:false, hasVideo:false },
];

const CHARS = [
  { id:"ella",  name:"艾拉",   role:"女主角", states:["默认","愤怒","受伤","沉默"], done:[true,true,false,false] },
  { id:"mole",  name:"线人",   role:"神秘NPC", states:["默认","警惕"], done:[true,false] },
  { id:"boss",  name:"反派主管", role:"反派",   states:["默认"], done:[false] },
];

function SceneGrid() {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px]" style={{ color:S.text3 }}>共9个场景节点 · 8已生成图片 · BGM/配音/视频全部待补</p>
        <motion.button whileTap={{ scale:0.97 }}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-white focus:outline-none"
          style={{ background:S.primary }}>
          <Zap size={11} /> 一键补齐缺失
        </motion.button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {SCENE_NODES.map(node => {
          const missing = [!node.hasImg,!node.hasBgm,!node.hasVoice,!node.hasVideo].filter(Boolean).length;
          return (
            <motion.div key={node.id} whileTap={{ scale:0.98 }}
              className="rounded-xl overflow-hidden cursor-pointer"
              style={{ background:S.card, border:`1px solid ${missing>2 ? `${S.error}35` : S.border}` }}>
              <div className="h-16 flex items-center justify-center"
                style={{ background: node.hasImg ? "linear-gradient(135deg,#1a1a2e,#16213e)" : S.s2 }}>
                {node.hasImg
                  ? <span className="text-[9px] text-white/60 font-mono">{node.id}</span>
                  : <AlertTriangle size={14} style={{ color:S.warning }} />}
              </div>
              <div className="p-2">
                <p className="text-[9px] font-bold mb-1 truncate" style={{ color:S.text }}>{node.label}</p>
                <div className="flex gap-1">
                  {[
                    { label:"图", ok:node.hasImg },
                    { label:"乐", ok:node.hasBgm },
                    { label:"声", ok:node.hasVoice },
                    { label:"视", ok:node.hasVideo },
                  ].map(a => (
                    <span key={a.label} className="text-[8px] px-1 py-0.5 rounded"
                      style={{ background: a.ok ? `${S.success}15` : `${S.error}10`,
                        color: a.ok ? S.success : S.error }}>
                      {a.label}{a.ok ? "✓" : "⚠"}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function CharGrid() {
  const [active, setActive] = useState(0);
  const char = CHARS[active];
  return (
    <div>
      <div className="flex gap-2 mb-3">
        {CHARS.map((c,i) => (
          <motion.button key={c.id} whileTap={{ scale:0.97 }} onClick={() => setActive(i)}
            className="px-3 py-1.5 rounded-lg text-xs font-bold focus:outline-none"
            style={{ background: active===i ? S.primary : S.s2, color: active===i ? "#fff" : S.text2,
              border:`1px solid ${active===i ? S.primary : S.border}` }}>
            {c.name}
          </motion.button>
        ))}
      </div>
      <div className="p-3 rounded-xl" style={{ background:S.card, border:`1px solid ${S.border}` }}>
        <p className="text-xs font-bold mb-1" style={{ color:S.text }}>{char.name} · {char.role}</p>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {char.states.map((s,i) => (
            <div key={s} className="rounded-lg p-2 flex items-center gap-2"
              style={{ background:S.s2, border:`1px solid ${char.done[i] ? `${S.success}30` : `${S.warning}30`}` }}>
              <div className="w-8 h-8 rounded flex items-center justify-center shrink-0"
                style={{ background: char.done[i] ? "#1a1a2e" : S.s2 }}>
                {char.done[i] ? <CheckCircle2 size={12} color={S.success} /> : <AlertTriangle size={12} color={S.warning} />}
              </div>
              <div>
                <p className="text-[9px] font-bold" style={{ color:S.text }}>{s}</p>
                <p className="text-[8px]" style={{ color: char.done[i] ? S.success : S.warning }}>
                  {char.done[i] ? "已生成" : "待生成"}
                </p>
              </div>
            </div>
          ))}
        </div>
        <motion.button whileTap={{ scale:0.97 }}
          className="w-full mt-3 py-2 rounded-lg text-xs font-bold text-white focus:outline-none"
          style={{ background: S.primary }}>
          批量生成 {char.name} 全部立绘
        </motion.button>
      </div>
    </div>
  );
}

function BatchTab({ label, count }: { label:string; count:number }) {
  return (
    <div className="p-4 rounded-xl text-center space-y-3" style={{ background:S.card, border:`1px solid ${S.border}` }}>
      <AlertTriangle size={24} color={S.warning} className="mx-auto" />
      <p className="text-xs font-bold" style={{ color:S.text }}>{count} 个节点缺少 {label}</p>
      <motion.button whileTap={{ scale:0.97 }}
        className="px-4 py-2 rounded-lg text-xs font-bold text-white focus:outline-none"
        style={{ background: S.primary }}>
        批量生成所有 {label}
      </motion.button>
    </div>
  );
}

export default function AssetsTab() {
  const [tab, setTab] = useState(0);
  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ background:S.bg }}>
      {/* 统计条 */}
      <div className="flex items-center gap-3 px-4 py-2 border-b overflow-x-auto"
        style={{ borderColor:S.border, background:S.card }}>
        {[
          { label:"场景背景", val:"8/9", ok:true },
          { label:"角色立绘", val:"2/6", ok:false },
          { label:"BGM",     val:"0/9", ok:false },
          { label:"配音",    val:"0/9", ok:false },
          { label:"视频",    val:"1/9", ok:false },
        ].map(s => (
          <div key={s.label} className="flex items-center gap-1 shrink-0">
            <span className="text-[9px]" style={{ color:S.text3 }}>{s.label}</span>
            <span className="text-[9px] font-bold" style={{ color: s.ok ? S.success : S.error }}>{s.val}</span>
          </div>
        ))}
      </div>

      {/* 资产类型Tab */}
      <div className="flex gap-1 px-3 py-2 border-b overflow-x-auto" style={{ borderColor:S.border, background:S.card }}>
        {ASSET_TABS.map((t,i) => (
          <motion.button key={t} whileTap={{ scale:0.97 }} onClick={() => setTab(i)}
            className="shrink-0 px-3 py-1 rounded-full text-xs font-bold focus:outline-none"
            style={{ background: tab===i ? S.primary : "transparent",
              color: tab===i ? "#fff" : S.text3,
              border: tab===i ? "none" : `1px solid ${S.border}` }}>
            {t}
          </motion.button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        {tab === 0 && <SceneGrid />}
        {tab === 1 && <CharGrid />}
        {tab === 2 && <BatchTab label="BGM" count={9} />}
        {tab === 3 && <BatchTab label="配音" count={9} />}
        {tab === 4 && <BatchTab label="视频" count={8} />}
      </div>
    </div>
  );
}
