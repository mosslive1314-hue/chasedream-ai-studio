"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GitBranch, Send, Bot, ChevronRight, X, Check, Edit2 } from "lucide-react";
import Link from "next/link";
import { SCRIPT_BLOCKS as STUDIO_BLOCKS, AI_SUGGESTIONS as STUDIO_AI, PLAYABLE_GRAPH, INIT_VARIABLES, type ScriptBlock } from "@/lib/studio-data";

const S = {
  bg:"#F5F6FA", card:"#FFFFFF", s2:"#F4F6FC",
  border:"#E8EAF2", primary:"#7C6CF5", accent:"#00A99D",
  text:"#1A1D2E", text2:"#4A5068", text3:"#8892B0",
  success:"#10B981", warning:"#F59E0B",
};

type LayerId = "original" | "linear" | "interactive" | "playable";
const LAYERS: { id: LayerId; label: string; desc: string }[] = [
  { id: "original", label: "原始文本", desc: "小说/原始剧本" },
  { id: "linear", label: "线性剧本", desc: "结构化分场剧本" },
  { id: "interactive", label: "互动剧本", desc: "含分支和变量的互动叙事" },
  { id: "playable", label: "可运行脚本", desc: "可在模拟器中游玩" },
];

export default function ScriptScreen() {
  const [blocks, setBlocks] = useState<ScriptBlock[]>(STUDIO_BLOCKS);
  const [editId, setEditId] = useState<string|null>(null);
  const [editVal, setEditVal] = useState("");
  const [aiMsg, setAiMsg] = useState("");
  const [aiHistory, setAiHistory] = useState<{role:"ai"|"user";text:string}[]>([
    { role:"ai", text:"我是 AI 剧本助手。你可以：\n• 点击「AI润色」优化当前段落\n• 点击「AI续写」在末尾续写剧情\n• 直接在下方问我任何关于本章的问题" },
  ]);
  const [aiLoading, setAiLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const [activeLayer, setActiveLayer] = useState<LayerId>("interactive");

  useEffect(() => { endRef.current?.scrollIntoView({ behavior:"smooth" }); }, [aiHistory]);

  // 开始内联编辑
  const startEdit = (block: ScriptBlock) => {
    setEditId(block.id);
    setEditVal(block.content);
  };

  // 保存内联编辑
  const saveEdit = (id: string) => {
    setBlocks(bs => bs.map(b => b.id === id ? { ...b, content: editVal } : b));
    setEditId(null);
  };

  // AI 发送消息
  const sendAi = (text?: string) => {
    const msg = text || aiMsg;
    if (!msg.trim()) return;
    setAiHistory(h => [...h, { role:"user", text:msg }]);
    setAiMsg("");
    setAiLoading(true);

    // 根据关键词决定回复
    setTimeout(() => {
      let reply = "收到！正在分析本章剧情结构……";
      if (msg.includes("润色") || msg.includes("优化"))
        reply = STUDIO_AI.polish[0];
      else if (msg.includes("续写") || msg.includes("继续"))
        reply = STUDIO_AI.write[0];
      else if (msg.includes("分支") || msg.includes("选项"))
        reply = STUDIO_AI.branch[0];
      else if (msg.includes("节奏"))
        reply = "当前章节节奏分析：\n✓ 开场钩子（霓虹街道）情绪张力良好\n⚠ 第3段台词过短，建议扩充艾拉的心理描写\n✓ 选择节点位置合理，出现在冲突高点";
      else if (msg.includes("角色") || msg.includes("艾拉"))
        reply = "艾拉在本章的行为弧线：\n① 主动追踪（专业感）→ ② 遭遇信息中断（压力）→ ③ 面对选择（玩家代入点）\n建议在B3台词后增加一句内心独白，强化她的不安情绪。";
      else
        reply = `关于「${msg}」：\n本章当前有 7 个内容块，共约 280 字。互动密度偏低（只有 1 个选择节点），建议在「获得芯片」场景后增加一个「是否信任线人」的道德抉择节点。`;

      setAiHistory(h => [...h, { role:"ai", text:reply }]);
      setAiLoading(false);
    }, 900);
  };

  // ── PlayablePreview (P0-2) ──
  const PlayablePreview = () => {
    const [pNode, setPNode] = useState("N01");
    const [pVars, setPVars] = useState({...INIT_VARIABLES});
    const [pPath, setPPath] = useState(["N01"]);
    const cur = PLAYABLE_GRAPH[pNode];

    const pChoose = (c: {label:string;next:string;effect:string}) => {
      const nv = {...pVars};
      const m = c.effect.match(/([+-])(\w+)\s+(\d+)/);
      if (m) { const k = m[2]; if (k in nv) (nv as any)[k] = (nv as any)[k] + (m[1]==="+"?1:-1)*parseInt(m[3]); }
      setPVars(nv); setPNode(c.next); setPPath(p => [...p, c.next]);
    };

    const pReset = () => { setPNode("N01"); setPVars({...INIT_VARIABLES}); setPPath(["N01"]); };

    if (!cur) return <div className="p-8 text-center text-xs" style={{ color: S.text3 }}>节点不存在</div>;

    return (
      <div className="flex-1 overflow-y-auto px-4 py-3">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[9px] font-bold px-2 py-0.5 rounded" style={{ background: `${S.primary}12`, color: S.primary }}>
              可运行预览
            </span>
            <motion.button whileTap={{ scale: 0.95 }} onClick={pReset}
              className="text-[9px] px-2 py-1 rounded-lg focus:outline-none"
              style={{ background: S.s2, color: S.text3 }}>
              重新开始
            </motion.button>
          </div>

          <div className="rounded-2xl overflow-hidden mb-3"
            style={{ background: cur.isEnding ? (cur.endingType==="good" ? "linear-gradient(160deg,#0f4c2a,#1a6b3a)" : "linear-gradient(160deg,#4c0f0f,#6b1a1a)") : "linear-gradient(160deg,#0d1117,#1a1f2e)" }}>
            <div className="px-4 pt-3 pb-1 flex items-center justify-between">
              <span className="text-[9px] font-bold" style={{ color: cur.isEnding ? "#4ade80" : "#a78bfa" }}>
                {cur.isEnding ? (cur.endingType==="good"?"✦ 好结局":"✕ 坏结局") : `${pNode}`}
              </span>
              <span className="text-[8px] font-mono" style={{ color: "rgba(255,255,255,0.3)" }}>{cur.char}</span>
            </div>
            <div className="mx-3 mb-3 px-3 py-2.5 rounded-xl" style={{ background: "rgba(0,0,0,0.5)" }}>
              <p className="text-[11px] leading-relaxed whitespace-pre-line" style={{ color: "rgba(255,255,255,0.9)" }}>
                {cur.text}
              </p>
            </div>
            {!cur.isEnding && cur.choices && (
              <div className="px-3 pb-3 space-y-1.5">
                {cur.choices.map((c, i) => (
                  <motion.button key={i} whileTap={{ scale: 0.97 }} onClick={() => pChoose(c)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-[10px] font-bold text-white focus:outline-none"
                    style={{ background: "rgba(94,80,232,0.35)", border: "1px solid rgba(94,80,232,0.5)" }}>
                    <span>{c.label}</span>
                    <ChevronRight size={11} />
                  </motion.button>
                ))}
              </div>
            )}
            {cur.isEnding && (
              <div className="px-3 pb-3">
                <motion.button whileTap={{ scale: 0.97 }} onClick={pReset}
                  className="w-full py-2 rounded-xl text-[10px] font-bold text-white focus:outline-none"
                  style={{ background: "rgba(255,255,255,0.15)" }}>重新试玩</motion.button>
              </div>
            )}
          </div>

          {/* Debug info */}
          <div className="p-3 rounded-xl" style={{ background: S.card, border: `1px solid ${S.border}` }}>
            <p className="text-[8px] font-bold mb-1.5" style={{ color: S.text3 }}>调试信息</p>
            <div className="flex flex-wrap gap-1 mb-1.5">
              {pPath.map((p, i) => (
                <span key={i} className="text-[8px] font-mono px-1 py-0.5 rounded"
                  style={{ background: i === pPath.length-1 ? `${S.primary}15` : S.s2,
                    color: i === pPath.length-1 ? S.primary : S.text3 }}>
                  {p}{i < pPath.length-1 ? "→" : ""}
                </span>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-1">
              {Object.entries(pVars).map(([k, v]) => (
                <div key={k} className="flex justify-between px-2 py-1 rounded" style={{ background: S.s2 }}>
                  <span className="text-[8px] font-mono" style={{ color: S.text3 }}>{k}</span>
                  <span className="text-[8px] font-mono font-bold" style={{ color: S.accent }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-svh flex flex-col overflow-hidden" style={{ background:S.bg }}>
      {/* 四层导航 (P0-2) */}
      <div className="flex items-center border-b shrink-0"
        style={{ background: S.card, borderColor: S.border }}>
        {LAYERS.map(layer => (
          <motion.button key={layer.id} whileTap={{ scale: 0.97 }}
            onClick={() => setActiveLayer(layer.id)}
            className="relative flex items-center gap-1.5 px-4 py-2 text-xs font-medium focus:outline-none"
            style={{ color: activeLayer === layer.id ? S.primary : S.text3 }}>
            {layer.label}
            <span className="text-[8px]" style={{ color: activeLayer === layer.id ? `${S.primary}80` : S.text3 }}>
              {layer.desc}
            </span>
            {activeLayer === layer.id && (
              <motion.div layoutId="layer-line"
                className="absolute bottom-0 inset-x-0 h-0.5"
                style={{ background: S.primary }} />
            )}
          </motion.button>
        ))}
      </div>

      {/* Content wrapper */}
      <div className="flex-1 flex overflow-hidden">
        {(activeLayer === "linear" || activeLayer === "interactive") && (
          <>
            {/* ── 左侧：剧本编辑区 ── */}
            <div className="flex-1 flex flex-col overflow-hidden">
        {/* 工具栏 */}
        <div className="flex items-center justify-between px-4 py-2 shrink-0"
          style={{ background:S.card, borderBottom:`1px solid ${S.border}` }}>
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-bold" style={{ color:S.text }}>第一章 · 渗透行动</h2>
            <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background:S.s2, color:S.text3 }}>
              {blocks.length} 段 · 约 {blocks.reduce((a,b) => a+b.content.length, 0)} 字
            </span>
          </div>
          <div className="flex gap-2">
            {/* AI润色按钮——真实可用 */}
            <motion.button whileTap={{ scale:0.97 }}
              onClick={() => sendAi("帮我润色本章全部内容，优化语言表达和情绪节奏")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold focus:outline-none"
              style={{ background:`${S.primary}12`, border:`1px solid ${S.primary}25`, color:S.primary }}>
              ✨ AI润色本章
            </motion.button>
            <Link href="/nodes">
              <motion.button whileTap={{ scale:0.97 }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold focus:outline-none"
                style={{ background:`${S.accent}12`, border:`1px solid ${S.accent}25`, color:S.accent }}>
                <GitBranch size={11} /> 转为节点图
              </motion.button>
            </Link>
          </div>
        </div>

        {/* 剧本块列表（支持内联编辑）*/}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {blocks.map((block) => (
            <motion.div key={block.id}
              initial={{ opacity:0, y:4 }} animate={{ opacity:1, y:0 }}
              className="rounded-xl overflow-hidden group"
              style={{ background:S.card, border:`1px solid ${S.border}` }}>
              {/* 块头部 */}
              <div className="flex items-center justify-between px-3 pt-2.5 pb-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded"
                    style={{ background:`${block.color}15`, color:block.color }}>
                    {block.label}
                  </span>
                  {block.char && (
                    <span className="text-[10px] font-bold" style={{ color:S.primary }}>{block.char}</span>
                  )}
                </div>
                {/* 编辑按钮（hover 时出现）*/}
                <motion.button whileTap={{ scale:0.9 }}
                  onClick={() => editId === block.id ? saveEdit(block.id) : startEdit(block)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded focus:outline-none transition-opacity"
                  style={{ color: editId === block.id ? S.success : S.text3 }}>
                  {editId === block.id ? <Check size={12} /> : <Edit2 size={12} />}
                </motion.button>
              </div>

              {/* 内容区——点击进入编辑模式 */}
              <div className="px-3 pb-2.5">
                {editId === block.id ? (
                  <div className="space-y-1.5">
                    <textarea
                      autoFocus
                      value={editVal}
                      onChange={e => setEditVal(e.target.value)}
                      className="w-full text-xs leading-relaxed resize-none rounded-lg px-2.5 py-2 focus:outline-none"
                      rows={Math.max(2, editVal.split('\n').length + 1)}
                      style={{ background:S.s2, border:`1.5px solid ${S.primary}`, color:S.text }}
                    />
                    <div className="flex gap-1.5">
                      <motion.button whileTap={{ scale:0.95 }} onClick={() => saveEdit(block.id)}
                        className="flex items-center gap-1 px-2 py-1 rounded text-[9px] font-bold text-white focus:outline-none"
                        style={{ background:S.success }}>
                        <Check size={9} /> 保存
                      </motion.button>
                      <motion.button whileTap={{ scale:0.95 }} onClick={() => setEditId(null)}
                        className="flex items-center gap-1 px-2 py-1 rounded text-[9px] font-medium focus:outline-none"
                        style={{ background:S.s2, color:S.text3 }}>
                        取消
                      </motion.button>
                      <motion.button whileTap={{ scale:0.95 }}
                        onClick={() => sendAi(`帮我优化以下这段${block.label}：\n${editVal}`)}
                        className="flex items-center gap-1 px-2 py-1 rounded text-[9px] font-bold focus:outline-none"
                        style={{ background:`${S.primary}12`, border:`1px solid ${S.primary}25`, color:S.primary }}>
                        ✨ AI润色
                      </motion.button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs leading-relaxed cursor-text"
                    style={{ color:S.text2 }}
                    onClick={() => startEdit(block)}>
                    {block.content}
                  </p>
                )}

                {/* 选项列表 */}
                {block.options && !editId && (
                  <div className="mt-2 space-y-1">
                    {block.options.map((opt,j) => (
                      <div key={j} className="text-[10px] px-2 py-1 rounded flex items-center gap-1.5"
                        style={{ background:S.s2, color:S.text2, border:`1px solid ${S.border}` }}>
                        <span style={{ color:S.warning }}>›</span> {opt}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}

          {/* 添加新块 */}
          <motion.button whileTap={{ scale:0.98 }}
            onClick={() => {
              const nb: ScriptBlock = { id:`b${Date.now()}`, type:"narr", label:"旁白",
                color:S.text3, content:"点击此处输入新内容…" };
              setBlocks(bs => [...bs, nb]);
              setTimeout(() => startEdit(nb), 50);
            }}
            className="w-full py-2.5 rounded-xl text-xs font-medium border-dashed focus:outline-none"
            style={{ border:`1.5px dashed ${S.border}`, color:S.text3 }}>
            + 添加内容块
          </motion.button>

          <div className="h-4" />
        </div>
      </div>

      {/* ── 右侧：AI 剧本助手面板 ── */}
      <div className="w-[260px] shrink-0 border-l flex flex-col"
        style={{ borderColor:S.border, background:S.card }}>
        {/* 标题 */}
        <div className="px-3 py-2.5 border-b flex items-center gap-1.5 shrink-0"
          style={{ borderColor:S.border }}>
          <Bot size={13} style={{ color:S.primary }} />
          <span className="text-xs font-bold" style={{ color:S.text }}>AI 剧本助手</span>
        </div>

        {/* 快捷操作 */}
        <div className="px-3 py-2.5 border-b shrink-0" style={{ borderColor:S.border }}>
          <p className="text-[9px] font-bold uppercase tracking-wider mb-1.5" style={{ color:S.text3 }}>
            快捷操作
          </p>
          <div className="grid grid-cols-2 gap-1">
            {[
              { label:"AI续写",  q:"帮我续写本章后续剧情" },
              { label:"润色全章", q:"帮我润色本章全部内容，优化语言表达和情绪节奏" },
              { label:"加分支",  q:"帮我为当前选择节点增加新的分支选项" },
              { label:"节奏检查", q:"分析本章节奏，指出薄弱段落" },
            ].map(item => (
              <motion.button key={item.label} whileTap={{ scale:0.96 }}
                onClick={() => sendAi(item.q)}
                className="px-2 py-1.5 rounded-lg text-[10px] font-medium text-center focus:outline-none"
                style={{ background:`${S.primary}08`, border:`1px solid ${S.primary}18`, color:S.primary }}>
                {item.label}
              </motion.button>
            ))}
          </div>
        </div>

        {/* 对话区 */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5">
          {aiHistory.map((msg, i) => (
            <motion.div key={i} initial={{ opacity:0, y:4 }} animate={{ opacity:1, y:0 }}
              className={`flex gap-1.5 ${msg.role==="user" ? "flex-row-reverse" : ""}`}>
              <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: msg.role==="ai" ? `${S.primary}15` : S.s2 }}>
                <span className="text-[8px] font-bold" style={{ color: msg.role==="ai" ? S.primary : S.text3 }}>
                  {msg.role==="ai" ? "AI" : "我"}
                </span>
              </div>
              <div className="max-w-[85%] px-2.5 py-2 rounded-xl text-[10px] leading-relaxed whitespace-pre-wrap"
                style={{ background: msg.role==="ai" ? S.s2 : `${S.primary}10`,
                  color:S.text2, border:`1px solid ${msg.role==="ai" ? S.border : `${S.primary}20`}` }}>
                {msg.text}
              </div>
            </motion.div>
          ))}
          {aiLoading && (
            <div className="flex gap-1.5">
              <div className="w-5 h-5 rounded-full flex items-center justify-center"
                style={{ background:`${S.primary}15` }}>
                <span className="text-[8px] font-bold" style={{ color:S.primary }}>AI</span>
              </div>
              <div className="px-3 py-2 rounded-xl flex items-center gap-1"
                style={{ background:S.s2, border:`1px solid ${S.border}` }}>
                {[0,1,2].map(j => (
                  <motion.div key={j} className="w-1 h-1 rounded-full" style={{ background:S.primary }}
                    animate={{ opacity:[0.3,1,0.3] }} transition={{ duration:1, repeat:Infinity, delay:j*0.2 }} />
                ))}
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* 输入框 */}
        <div className="px-3 py-2.5 border-t shrink-0" style={{ borderColor:S.border }}>
          <div className="flex gap-1.5 items-center rounded-xl px-2.5 py-2"
            style={{ background:S.s2, border:`1.5px solid ${aiMsg ? S.primary : S.border}` }}>
            <input value={aiMsg} onChange={e => setAiMsg(e.target.value)}
              onKeyDown={e => e.key==="Enter" && !e.shiftKey && sendAi()}
              placeholder="问问AI助手…"
              className="flex-1 text-[10px] bg-transparent focus:outline-none" style={{ color:S.text }} />
            <motion.button whileTap={{ scale:0.9 }} onClick={() => sendAi()}
              className="focus:outline-none">
              <Send size={11} style={{ color: aiMsg ? S.primary : S.text3 }} />
            </motion.button>
          </div>
        </div>
            </div>
          </>
        )}

        {activeLayer === "original" && (
          <div className="flex-1 overflow-y-auto px-4 py-3">
            <div className="max-w-2xl mx-auto">
              <p className="text-[9px] font-bold uppercase tracking-wider mb-2" style={{ color: S.text3 }}>原始文本</p>
              <div className="p-4 rounded-xl text-xs leading-loose whitespace-pre-wrap"
                style={{ background: S.card, border: `1px solid ${S.border}`, color: S.text2 }}>
                {`2047年，深夜。霓虹灯光把积水的城市街道染成猩红。艾拉站在一扇锈门前，追踪信号在此中断。

线人在地下酒吧等她。他说那枚追踪芯片已经被发现了，她必须在他们找到他之前做出选择。

艾拉面临关键抉择——是走安全的暗巷通道，还是冒险换装渗入企业大厦？

如果选择暗夜通道，她跟着线人穿过地下管道，抵达企业大厦后方。如果选择换装渗透，她换上企业制服，刷伪造ID进入大厦。

无论哪条路，她都将在警卫逼近时面临生死考验。只有1.5秒做出反应！

最终，根据她一路上的表现——潜行能力、警觉程度、对线人的信任——将决定她是带着证据安全撤离（幽灵归来），还是被困在暗巷中身份暴露（今夜失败）。`}
              </div>
              <p className="text-[9px] text-center mt-3" style={{ color: S.text3 }}>
                原始文本为 AI 从原著中提取的线性叙事，不含互动元素
              </p>
            </div>
          </div>
        )}

        {activeLayer === "playable" && <PlayablePreview />}
      </div>
    </div>
  );
}
