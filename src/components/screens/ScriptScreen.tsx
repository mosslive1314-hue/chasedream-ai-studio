"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GitBranch, Send, Bot, ChevronRight, X, Check, Edit2 } from "lucide-react";
import Link from "next/link";

const S = {
  bg:"#F5F6FA", card:"#FFFFFF", s2:"#F4F6FC",
  border:"#E8EAF2", primary:"#7C6CF5", accent:"#00A99D",
  text:"#1A1D2E", text2:"#4A5068", text3:"#8892B0",
  success:"#10B981", warning:"#F59E0B",
};

type BlockType = "scene"|"narr"|"dialog"|"choice"|"cond";
interface Block {
  id: string;
  type: BlockType;
  label: string;
  char?: string;
  content: string;
  options?: string[];
  color: string;
}

const INIT_BLOCKS: Block[] = [
  { id:"b1", type:"scene",  label:"场景", color:"#5E50E8",
    content:"霓虹街道 · 夜 · 外  |  2047年，积水路面，广告牌投影闪烁，艾拉穿过熙攘人群。" },
  { id:"b2", type:"narr",   label:"旁白", color:S.text3,
    content:"追踪信号在前方100米处中断。她停在一扇锈迹斑斑的门前，耳机里传来微弱杂音。" },
  { id:"b3", type:"dialog", label:"台词", char:"艾拉", color:S.accent,
    content:"线人在哪？已经等了整整20分钟了。" },
  { id:"b4", type:"choice", label:"选择", color:S.warning,
    content:"是否相信陌生来电？",
    options:["A. 相信，进地下酒吧","B. 拒绝接触，转身离开","C. 反向追踪来电来源"] },
  { id:"b5", type:"scene",  label:"场景", color:"#5E50E8",
    content:"地下酒吧 · 夜 · 内  |  昏暗灯光，嘈杂人群，空气中弥漫着廉价酒精的气味。" },
  { id:"b6", type:"dialog", label:"台词", char:"线人", color:S.accent,
    content:"你来了。那枚追踪芯片……他们已经发现了。你必须在他们找到我之前做出选择。" },
  { id:"b7", type:"cond",   label:"条件", color:S.warning,
    content:"检查变量：trust_lineman ≥ 40 → 进入N07  |  否则 → 进入N09" },
];

const AI_SUGGESTIONS: Record<string, string[]> = {
  write: ["AI 续写中……✨ 建议：「艾拉注意到线人手背上的追踪芯片切口——那是植入后的标记……」已插入下方。"],
  polish: ["AI 润色完成 ✨\n原文：「线人在哪？」\n优化为：「线人还没到？这已经是第三次失约了。」—— 更符合角色急迫情绪。"],
  branch: ["已为「进入路线」节点生成 2 个新分支：\n— C. 利用无人机侦察  → 触发条件 surveillance_drone > 0\n— D. 强行破门  → 触发 alert_level +20"],
};

export default function ScriptScreen() {
  const [blocks, setBlocks] = useState<Block[]>(INIT_BLOCKS);
  const [editId, setEditId] = useState<string|null>(null);
  const [editVal, setEditVal] = useState("");
  const [aiMsg, setAiMsg] = useState("");
  const [aiHistory, setAiHistory] = useState<{role:"ai"|"user";text:string}[]>([
    { role:"ai", text:"我是 AI 剧本助手。你可以：\n• 点击「AI润色」优化当前段落\n• 点击「AI续写」在末尾续写剧情\n• 直接在下方问我任何关于本章的问题" },
  ]);
  const [aiLoading, setAiLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior:"smooth" }); }, [aiHistory]);

  // 开始内联编辑
  const startEdit = (block: Block) => {
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
        reply = AI_SUGGESTIONS.polish[0];
      else if (msg.includes("续写") || msg.includes("继续"))
        reply = AI_SUGGESTIONS.write[0];
      else if (msg.includes("分支") || msg.includes("选项"))
        reply = AI_SUGGESTIONS.branch[0];
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

  return (
    <div className="h-svh flex overflow-hidden" style={{ background:S.bg }}>

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
              const nb: Block = { id:`b${Date.now()}`, type:"narr", label:"旁白",
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
    </div>
  );
}
