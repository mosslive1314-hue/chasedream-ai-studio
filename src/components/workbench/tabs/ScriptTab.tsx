import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, GitBranch } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

const S = {
  bg:"#FAFBFF", card:"#FFFFFF", s2:"#F4F6FC",
  border:"#E2E5F0", primary:"#5E50E8", accent:"#00A99D",
  text:"#1A1D2E", text2:"#4A5068", text3:"#8892B0",
  success:"#059669", warning:"#D97706",
};

const SCRIPT_BLOCKS = [
  { type:"scene",  content:"霓虹街道 · 夜 · 外  |  2047年，积水路面，广告牌投影" },
  { type:"narr",   content:"艾拉穿过人群，追踪信号。她停在一扇锈迹斑斑的门前。" },
  { type:"dialog", char:"艾拉", content:"线人在哪？已经等了20分钟了。" },
  { type:"choice", content:"是否相信来电？", options:["A. 相信，进地下酒吧", "B. 拒绝，离开现场", "C. 反向追踪来源"] },
  { type:"scene",  content:"地下酒吧 · 夜 · 内  |  昏暗灯光，嘈杂人群" },
  { type:"dialog", char:"线人", content:"你来了。那枚追踪芯片……他们已经发现了。" },
  { type:"cond",   content:"检查变量：trust_lineman ≥ 40 → 进入N07 | 否则 → 进入N09" },
];

export default function ScriptTab() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<number | null>(null);

  const blockColor: Record<string,string> = {
    scene:"#5E50E8", narr:S.text3, dialog:S.accent, choice:S.warning, cond:S.warning
  };
  const blockLabel: Record<string,string> = {
    scene:"场景", narr:"旁白", dialog:"台词", choice:"选择", cond:"条件"
  };

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ background: S.bg }}>
      {/* toolbar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b" style={{ borderColor: S.border, background: S.card }}>
        <span className="text-xs font-bold" style={{ color: S.text }}>第一章 渗透行动</span>
        <div className="flex-1" />
        <motion.button whileTap={{ scale:0.97 }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold focus:outline-none"
          style={{ background:`${S.primary}10`, border:`1px solid ${S.primary}20`, color:S.primary }}>
          <Sparkles size={11} /> AI 润色本章
        </motion.button>
        <motion.button whileTap={{ scale:0.97 }}
          onClick={() => navigate({ to: "/canvas" })}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold focus:outline-none"
          style={{ background:`${S.accent}12`, border:`1px solid ${S.accent}25`, color:S.accent }}>
          <GitBranch size={11} /> 转为节点图
        </motion.button>
      </div>

      {/* script blocks */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {SCRIPT_BLOCKS.map((block, i) => (
          <motion.div key={i} whileTap={{ scale:0.995 }}
            onClick={() => setSelected(selected === i ? null : i)}
            className="rounded-xl p-3 cursor-pointer transition-all"
            style={{ background: selected === i ? `${S.primary}06` : S.card,
              border:`1px solid ${selected === i ? `${S.primary}30` : S.border}` }}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                style={{ background:`${blockColor[block.type]}15`, color: blockColor[block.type] }}>
                {blockLabel[block.type]}
              </span>
              {block.char && <span className="text-[10px] font-bold" style={{ color:S.primary }}>{block.char}</span>}
            </div>
            <p className="text-xs leading-relaxed" style={{ color: S.text2 }}>{block.content}</p>
            {block.options && (
              <div className="mt-2 space-y-1">
                {block.options.map((opt, j) => (
                  <div key={j} className="text-[10px] px-2 py-1 rounded"
                    style={{ background: S.s2, color: S.text2, border:`1px solid ${S.border}` }}>{opt}</div>
                ))}
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
