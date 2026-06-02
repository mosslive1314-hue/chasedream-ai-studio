"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye, Sparkles, Save, Rocket, AlertTriangle,
  CheckCircle2, ChevronDown, ChevronUp, Plus,
  ZoomIn, ZoomOut, Maximize2, AlignLeft,
  ExternalLink, Play, FileText, Flame, BookOpen,
  User, Package, Music, GitBranch, X, Loader2,
  Monitor, Star, Download, Wand2,
  Layout, Eye as EyeIcon, Search,
  Check, Trash2, Copy, RotateCcw, Settings
} from "lucide-react";
import Link from "next/link";
import { STORY_NODES, NODE_EDGES, UI_TEMPLATES, GAME_UI_SETTINGS, type UITemplate, type UITemplateCategory, type UIComponentDef } from "@/lib/studio-data";

const S = {
  bg:      "#F5F6FA",
  card:    "#FFFFFF",
  s2:      "#F4F6FC",
  border:  "#E8EAF2",
  primary: "#7C6CF5",
  accent:  "#00A99D",
  text:    "#1A1D2E",
  text2:   "#4A5068",
  text3:   "#8892B0",
  success: "#10B981",
  warning: "#F59E0B",
  error:   "#EF4444",
  canvas:  "#F0F1F8",
  cGrid:   "#E2E4EF",
};

// ── 顶部 Tab 定义（完全对齐截图：剧本/画布/热力图/故事/角色/资产）──────────
type TabId = "script"|"canvas"|"heatmap"|"story"|"character"|"assets"|"ui";
const TABS: { id:TabId; label:string; icon:any }[] = [
  { id:"script",    label:"剧本",   icon:FileText  },
  { id:"canvas",    label:"画布",   icon:AlignLeft },
  { id:"heatmap",   label:"热力图", icon:Flame     },
  { id:"story",     label:"故事",   icon:BookOpen  },
  { id:"character", label:"角色",   icon:User      },
  { id:"assets",    label:"资产",   icon:Package   },
  { id:"ui",        label:"用户界面", icon:Monitor },
];

// ── 左侧阶段检查项（完全对齐截图内容）─────────────────────────────────────
const CHECKS = [
  { label:"故事结构",   detail:"11 个节点，入口和结局已连通",           status:"ok"   },
  { label:"互动选择",   detail:"1 个选择节点，2 个玩家选项",             status:"ok"   },
  { label:"角色配置",   detail:"3 个角色已配置",                         status:"ok"   },
  { label:"节点资产",   detail:"8/9 个场景已有图片或视频，建议补齐",     status:"warn" },
  { label:"预览试玩",   detail:"已从玩家视角打开过预览",                 status:"ok"   },
  { label:"H5 发布",   detail:"H5 链接已发布，可分享给玩家",             status:"ok"   },
];

// ── 节点类型配色（对齐原站颜色风格）────────────────────────────────────────
const NODE_TYPE: Record<string, { label:string; color:string; bg:string; border:string }> = {
  start:       { label:"场景", color:"#7C6CF5", bg:"rgba(124,108,245,0.08)", border:"rgba(124,108,245,0.5)" },
  scene:       { label:"场景", color:"#7C6CF5", bg:"rgba(124,108,245,0.08)", border:"rgba(124,108,245,0.4)" },
  choice:      { label:"选择", color:"#F59E0B", bg:"rgba(245,158,11,0.08)",  border:"rgba(245,158,11,0.5)"  },
  condition:   { label:"条件", color:"#F59E0B", bg:"rgba(245,158,11,0.06)",  border:"rgba(245,158,11,0.4)"  },
  qte:         { label:"QTE",  color:"#EF4444", bg:"rgba(239,68,68,0.06)",   border:"rgba(239,68,68,0.4)"   },
  ending_good: { label:"结局", color:"#10B981", bg:"rgba(16,185,129,0.08)",  border:"rgba(16,185,129,0.5)"  },
  ending_bad:  { label:"结局", color:"#EF4444", bg:"rgba(239,68,68,0.08)",   border:"rgba(239,68,68,0.4)"   },
};

// ── 剧本 Tab 内容 ─────────────────────────────────────────────────────────
function ScriptContent() {
  return (
    <div className="p-4 space-y-3 overflow-y-auto h-full">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-bold" style={{ color:S.text }}>第一章：渗透行动</h3>
        <Link href="/parse">
          <motion.button whileTap={{ scale:0.97 }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold focus:outline-none"
            style={{ background:`${S.primary}12`, border:`1px solid ${S.primary}25`, color:S.primary }}>
            <Sparkles size={11} /> AI 剧本解构
          </motion.button>
        </Link>
      </div>
      {[
        { type:"scene",  label:"场景", content:"序章·霓虹夜幕  |  2047年，积水路面，广告牌投影" },
        { type:"dialog", label:"台词", char:"艾拉", content:"线人在哪？已经等了20分钟了。" },
        { type:"choice", label:"选择", content:"是否相信来电？",
          options:["A. 相信，进地下酒吧","B. 拒绝，离开现场"] },
        { type:"scene",  label:"场景", content:"地下酒吧  |  昏暗灯光，嘈杂人群" },
        { type:"dialog", label:"台词", char:"线人", content:"你来了。那枚追踪芯片……他们已经发现了。" },
      ].map((b,i) => (
        <div key={i} className="p-3 rounded-xl" style={{ background:S.card, border:`1px solid ${S.border}` }}>
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded"
              style={{ background: b.type==="choice" ? "rgba(245,158,11,0.12)" : "rgba(124,108,245,0.10)",
                color: b.type==="choice" ? S.warning : S.primary }}>
              {b.label}
            </span>
            {b.char && <span className="text-[10px] font-bold" style={{ color:S.primary }}>{b.char}</span>}
          </div>
          <p className="text-xs" style={{ color:S.text2 }}>{b.content}</p>
          {b.options && <div className="mt-1.5 space-y-1">
            {b.options.map((o,j) => (
              <div key={j} className="text-[10px] px-2 py-0.5 rounded"
                style={{ background:S.s2, color:S.text3 }}>{o}</div>
            ))}
          </div>}
        </div>
      ))}
    </div>
  );
}

// ── 热力图 Tab ────────────────────────────────────────────────────────────
function HeatmapContent() {
  return (
    <div className="flex-1 flex items-center justify-center flex-col gap-3 p-8">
      <Flame size={36} style={{ color:"rgba(245,158,11,0.3)" }} />
      <p className="text-sm font-bold" style={{ color:S.text2 }}>玩家热力图</p>
      <p className="text-xs text-center" style={{ color:S.text3 }}>
        发布后收集玩家数据，展示最受关注的节点和最常选择的路径
      </p>
      <div className="mt-2 space-y-1.5 w-full max-w-xs">
        {[
          { label:"进入路线（选择节点）", pct:78, color:S.warning },
          { label:"任务简报（场景节点）", pct:95, color:S.primary },
          { label:"数据到手（场景节点）", pct:42, color:S.accent },
        ].map(item => (
          <div key={item.label}>
            <div className="flex justify-between text-[9px] mb-0.5" style={{ color:S.text3 }}>
              <span>{item.label}</span><span>{item.pct}%</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background:S.s2 }}>
              <div className="h-full rounded-full" style={{ width:`${item.pct}%`, background:item.color }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 故事 Tab ──────────────────────────────────────────────────────────────
function StoryContent() {
  return (
    <div className="p-4 space-y-3 overflow-y-auto h-full">
      <h3 className="text-sm font-bold" style={{ color:S.text }}>故事设定</h3>
      {[
        { label:"世界观", value:"2047年，赛博朋克都市。信息战与人工智能渗透社会各层，侦探艾拉追踪神秘失踪线人，揭露幕后权力阴谋。" },
        { label:"主线",   value:"侦探追踪 → 线人现身 → 关键抉择 → 真相揭露 → 多重结局" },
        { label:"主题",   value:"信任与背叛、真相的代价、个人选择改变命运" },
      ].map(item => (
        <div key={item.label} className="p-3 rounded-xl" style={{ background:S.card, border:`1px solid ${S.border}` }}>
          <p className="text-[9px] font-bold uppercase tracking-wider mb-1" style={{ color:S.text3 }}>{item.label}</p>
          <p className="text-xs leading-relaxed" style={{ color:S.text2 }}>{item.value}</p>
        </div>
      ))}
    </div>
  );
}

// ── 角色 Tab ──────────────────────────────────────────────────────────────
function CharacterContent() {
  return (
    <div className="p-4 space-y-3 overflow-y-auto h-full">
      <h3 className="text-sm font-bold" style={{ color:S.text }}>角色配置</h3>
      {[
        { name:"艾拉",    role:"女主角·侦探", desc:"黑色短发，银色义眼，黑色风衣，冷静警觉",         nodes:11, color:S.primary },
        { name:"线人",    role:"关键NPC",     desc:"神秘男性，中年，隐藏身份，不可信任",              nodes:4,  color:S.warning },
        { name:"反派主管",role:"反派",        desc:"西装笔挺，冷峻表情，幕后操控者",                  nodes:3,  color:S.error   },
      ].map(c => (
        <div key={c.name} className="p-3 rounded-xl" style={{ background:S.card, border:`1px solid ${S.border}` }}>
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-7 h-7 rounded-full flex items-center justify-center"
              style={{ background:`${c.color}15` }}>
              <User size={13} style={{ color:c.color }} />
            </div>
            <div>
              <span className="text-xs font-bold" style={{ color:S.text }}>{c.name}</span>
              <span className="text-[9px] ml-1.5 px-1.5 py-0.5 rounded"
                style={{ background:`${c.color}12`, color:c.color }}>{c.role}</span>
            </div>
            <span className="ml-auto text-[9px]" style={{ color:S.text3 }}>出现 {c.nodes} 节点</span>
          </div>
          <p className="text-[10px]" style={{ color:S.text3 }}>{c.desc}</p>
        </div>
      ))}
    </div>
  );
}

// ── 资产 Tab ──────────────────────────────────────────────────────────────
function AssetsContent() {
  return (
    <div className="p-4 space-y-3 overflow-y-auto h-full">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-bold" style={{ color:S.text }}>节点资产</h3>
        <Link href="/assets">
          <span className="text-[10px] flex items-center gap-0.5 cursor-pointer" style={{ color:S.primary }}>
            完整管理 <ExternalLink size={9} />
          </span>
        </Link>
      </div>
      <div className="p-3 rounded-xl" style={{ background:"rgba(245,158,11,0.06)", border:`1px solid rgba(245,158,11,0.25)` }}>
        <div className="flex items-center gap-1.5 mb-1">
          <AlertTriangle size={12} style={{ color:S.warning }} />
          <span className="text-xs font-bold" style={{ color:S.warning }}>1 个节点缺少图片</span>
        </div>
        <p className="text-[10px]" style={{ color:S.text3 }}>N06 警卫逼近场景图片尚未生成</p>
        <Link href="/assets">
          <motion.button whileTap={{ scale:0.97 }}
            className="mt-2 flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-lg focus:outline-none"
            style={{ background:`${S.primary}12`, border:`1px solid ${S.primary}25`, color:S.primary }}>
            <ExternalLink size={9} /> 补充资产
          </motion.button>
        </Link>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[
          { label:"场景背景", ok:8,  total:9  },
          { label:"角色立绘", ok:6,  total:12 },
          { label:"BGM",     ok:0,  total:9  },
        ].map(a => (
          <div key={a.label} className="p-2.5 rounded-xl text-center"
            style={{ background:S.card, border:`1px solid ${S.border}` }}>
            <p className="text-[9px] mb-1" style={{ color:S.text3 }}>{a.label}</p>
            <p className="text-sm font-bold font-mono"
              style={{ color: a.ok === a.total ? S.success : a.ok === 0 ? S.error : S.warning }}>
              {a.ok}/{a.total}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 主节点画布（对齐原站 React Flow 风格）──────────────────────────────────
function CanvasContent({ sel, setSel }: { sel:string|null; setSel:(id:string|null)=>void }) {
  return (
    <div className="relative w-full h-full overflow-auto"
      style={{
        backgroundColor: S.canvas,
        backgroundImage: `linear-gradient(${S.cGrid} 1px,transparent 1px),linear-gradient(90deg,${S.cGrid} 1px,transparent 1px)`,
        backgroundSize: "24px 24px",
      }}>
      {/* 整理布局按钮（右上角，与原站一致）*/}
      <div className="absolute top-3 right-3 z-20">
        <motion.button whileTap={{ scale:0.97 }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium focus:outline-none"
          style={{ background:S.card, border:`1px solid ${S.border}`, color:S.text2,
            boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
          ≡ 整理布局
        </motion.button>
      </div>

      {/* 缩放控件 */}
      <div className="absolute bottom-4 left-4 z-20 flex flex-col gap-1">
        {[{ icon:ZoomIn },{ icon:ZoomOut },{ icon:Maximize2 }].map((btn,i) => (
          <motion.button key={i} whileTap={{ scale:0.9 }}
            className="w-7 h-7 rounded-lg flex items-center justify-center focus:outline-none"
            style={{ background:S.card, border:`1px solid ${S.border}`, color:S.text3 }}>
            <btn.icon size={12} />
          </motion.button>
        ))}
      </div>

      {/* 节点画布（SVG连线 + 节点卡片，布局与原站截图一致）*/}
      <div style={{ width:900, height:700, position:"relative", margin:"32px auto" }}>
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex:0 }}>
          <defs>
            <marker id="arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <path d="M0,0 L0,6 L6,3 Z" fill={S.primary} opacity="0.5" />
            </marker>
          </defs>
          {NODE_EDGES.map((edge,i) => {
            const fn = STORY_NODES.find(n=>n.id===edge.from);
            const tn = STORY_NODES.find(n=>n.id===edge.to);
            if (!fn||!tn) return null;
            const x1=fn.x, y1=fn.y+42, x2=tn.x, y2=tn.y;
            const cy = (y1+y2)/2;
            return (
              <path key={i}
                d={`M ${x1},${y1} C ${x1},${cy} ${x2},${cy} ${x2},${y2}`}
                fill="none" stroke={S.primary} strokeWidth={1.5} opacity={0.35}
                markerEnd="url(#arr)"
              />
            );
          })}
        </svg>

        {STORY_NODES.map(node => {
          const cfg = NODE_TYPE[node.type] ?? NODE_TYPE.scene;
          const isSelected = sel===node.id;
          return (
            <motion.button key={node.id} whileTap={{ scale:0.96 }}
              onClick={() => setSel(node.id===sel?null:node.id)}
              className="absolute rounded-xl text-left focus:outline-none"
              style={{
                left: node.x-70, top: node.y,
                width: 140, padding:"8px 10px",
                background: S.card,
                border: `1px solid ${isSelected ? S.primary : (node as any).hasError ? S.error : cfg.border}`,
                boxShadow: isSelected
                  ? `0 0 0 2px ${S.primary}30, 0 2px 12px rgba(124,108,245,0.15)`
                  : "0 1px 4px rgba(0,0,0,0.06)",
                zIndex: isSelected ? 20 : 10,
              }}>
              {/* 顶部类型标签（对齐原站节点样式）*/}
              <div className="flex items-center gap-1 mb-1">
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                  style={{ background:cfg.bg, color:cfg.color }}>
                  目 {cfg.label}
                </span>
                {(node as any).hasError && <AlertTriangle size={9} style={{ color:S.error }} />}
              </div>
              <p className="text-[11px] font-bold truncate" style={{ color:S.text }}>{node.label}</p>
              {(node as any).errorMsg && (
                <p className="text-[9px] mt-0.5 truncate" style={{ color:S.error }}>{(node as any).errorMsg}</p>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

// ── 用户界面 Tab（游戏内 UI 管理）────────────────────────────────────────
const UI_CATEGORIES: { id: UITemplateCategory | "all"; label: string }[] = [
  { id: "all",       label: "全部" },
  { id: "dialog",    label: "对话框" },
  { id: "choice",    label: "选项按钮" },
  { id: "hud",       label: "HUD" },
  { id: "menu",      label: "系统菜单" },
  { id: "qte",       label: "QTE" },
  { id: "system",    label: "系统面板" },
];

function UIContent() {
  const [catFilter, setCatFilter] = useState<UITemplateCategory | "all">("all");
  const [selectedTpl, setSelectedTpl] = useState<UITemplate | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [aiGenOpen, setAiGenOpen] = useState(false);
  const [aiGenLoading, setAiGenLoading] = useState(false);
  const [aiGenStyle, setAiGenStyle] = useState("赛博朋克");
  const [aiGenResult, setAiGenResult] = useState<UITemplate | null>(null);
  const [marketOpen, setMarketOpen] = useState(false);
  const [appliedTemplates, setAppliedTemplates] = useState<string[]>(
    UI_TEMPLATES.filter(t => t.isApplied).map(t => t.id)
  );
  const [editingComponent, setEditingComponent] = useState<UIComponentDef | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [globalTextSpeed, setGlobalTextSpeed] = useState(GAME_UI_SETTINGS.globalTextSpeed);
  const [showSkip, setShowSkip] = useState(GAME_UI_SETTINGS.showSkipButton);
  const [showAuto, setShowAuto] = useState(GAME_UI_SETTINGS.showAutoPlay);
  const [showSave, setShowSave] = useState(GAME_UI_SETTINGS.showSaveLoad);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const filteredTemplates = UI_TEMPLATES.filter(t => {
    if (catFilter !== "all" && t.category !== catFilter) return false;
    if (searchQuery && !t.name.includes(searchQuery) && !t.description.includes(searchQuery)) return false;
    return true;
  });

  const toggleApply = (tplId: string) => {
    setAppliedTemplates(prev => {
      if (prev.includes(tplId)) {
        showToast("已移除模板");
        return prev.filter(id => id !== tplId);
      } else {
        showToast("已应用模板到项目");
        return [...prev, tplId];
      }
    });
  };

  const duplicateTpl = (tpl: UITemplate) => {
    showToast(`已复制「${tpl.name}」为自定义模板`);
  };

  // ── 实时预览：对话框 ──
  function DialogPreview({ tpl }: { tpl: UITemplate }) {
    const comp = tpl.components.find(c => c.type === "dialog_box");
    const bg = (comp?.props.bg as string) || "rgba(0,0,0,0.85)";
    const border = (comp?.props.border as string) || "#7C6CF5";
    const radius = (comp?.props.borderRadius as number) || 12;
    return (
      <div className="rounded-xl overflow-hidden" style={{ background: bg, border: `2px solid ${border}`, borderRadius: radius }}>
        <div className="p-3">
          <div className="flex items-center gap-1.5 mb-1.5">
            <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: `${border}30` }}>
              <User size={9} style={{ color: border }} />
            </div>
            <span className="text-[10px] font-bold" style={{ color: border }}>艾拉 · 侦探</span>
          </div>
          <p className="text-xs leading-relaxed" style={{ color: "#e0e0e0" }}>
            枪声划过霓虹屋顶。线人倒在通风口旁。你有 1.5 秒决定逃生路线！
          </p>
        </div>
        <div className="flex items-center justify-end gap-2 px-3 pb-2">
          <span className="text-[8px]" style={{ color: "rgba(255,255,255,0.3)" }}>▼ 点击继续</span>
        </div>
      </div>
    );
  }

  // ── 实时预览：选项按钮 ──
  function ChoicePreview({ tpl }: { tpl: UITemplate }) {
    const comp = tpl.components.find(c => c.type === "choice_button");
    const bg = (comp?.props.bg as string) || "#7C6CF5";
    return (
      <div className="space-y-1.5">
        {["A. 相信，进地下酒吧", "B. 拒绝接触，转身离开"].map((opt, i) => (
          <motion.button key={i} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            className="w-full py-2 px-3 rounded-lg text-left text-[10px] font-bold text-white focus:outline-none"
            style={{ background: bg, border: `1px solid rgba(255,255,255,0.15)`, opacity: i === 0 ? 1 : 0.85 }}>
            {opt}
          </motion.button>
        ))}
      </div>
    );
  }

  // ── 实时预览：HUD ──
  function HudPreview({ tpl }: { tpl: UITemplate }) {
    const comp = tpl.components.find(c => c.type === "hud_bar");
    const bg = (comp?.props.bg as string) || "rgba(0,0,0,0.5)";
    return (
      <div className="rounded-lg px-3 py-2 flex items-center gap-3" style={{ background: bg }}>
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#34D399" }} />
          <span className="text-[9px] font-bold" style={{ color: "#34D399" }}>耐力: 90</span>
        </div>
        <div className="w-px h-3" style={{ background: "rgba(255,255,255,0.2)" }} />
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#A78BFA" }} />
          <span className="text-[9px] font-bold" style={{ color: "#A78BFA" }}>信任值: 40</span>
        </div>
        <div className="flex-1" />
        <span className="text-[8px]" style={{ color: "rgba(255,255,255,0.4)" }}>Ch.1</span>
      </div>
    );
  }

  // ── 实时预览：QTE ──
  function QtePreview({ tpl }: { tpl: UITemplate }) {
    return (
      <div className="rounded-xl p-4 text-center" style={{ background: "rgba(0,0,0,0.75)", border: `2px solid ${S.error}` }}>
        <div className="text-lg font-black mb-1" style={{ color: S.error }}>!!</div>
        <p className="text-[10px] font-bold text-white mb-2">警卫逼近！快速反应！</p>
        <div className="flex justify-center gap-2">
          {["←", "↑", "→"].map((k, i) => (
            <motion.div key={i} animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.2 }}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
              style={{ background: "rgba(255,255,255,0.1)", border: `1px solid ${S.error}`, color: "#fff" }}>
              {k}
            </motion.div>
          ))}
        </div>
        <div className="mt-2">
          <div className="h-1 rounded-full overflow-hidden mx-auto" style={{ background: "rgba(255,255,255,0.1)", maxWidth: 120 }}>
            <motion.div className="h-full rounded-full" style={{ background: S.error }}
              animate={{ width: ["100%", "0%"] }} transition={{ duration: 3, repeat: Infinity }} />
          </div>
        </div>
      </div>
    );
  }

  // ── 实时预览：菜单 ──
  function MenuPreview({ tpl }: { tpl: UITemplate }) {
    const comp = tpl.components.find(c => c.type === "menu_panel");
    const bg = (comp?.props.bg as string) || "#fff";
    const isDark = bg.includes("rgba(0") || bg.includes("#0") || bg.includes("#1");
    return (
      <div className="rounded-xl p-3 space-y-1.5" style={{ background: bg, border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : S.border}` }}>
        {["继续游戏", "存档", "读档", "设置", "返回主页"].map((item, i) => (
          <motion.button key={item} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            className="w-full py-1.5 rounded-lg text-[10px] font-medium focus:outline-none"
            style={{
              background: i === 0 ? (isDark ? "rgba(124,108,245,0.3)" : `${S.primary}15`) : "transparent",
              color: isDark ? "#fff" : S.text,
              border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : S.border}`,
            }}>
            {item}
          </motion.button>
        ))}
      </div>
    );
  }

  // ── 根据类型选择预览 ──
  function TemplatePreview({ tpl }: { tpl: UITemplate }) {
    const mainType = tpl.components[0]?.type;
    switch (mainType) {
      case "dialog_box": return <DialogPreview tpl={tpl} />;
      case "choice_button": return <ChoicePreview tpl={tpl} />;
      case "hud_bar": case "status_indicator": return <HudPreview tpl={tpl} />;
      case "qte_prompt": return <QtePreview tpl={tpl} />;
      case "menu_panel": case "save_slot": case "settings_panel": return <MenuPreview tpl={tpl} />;
      default: return <DialogPreview tpl={tpl} />;
    }
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Toast 通知 */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="absolute top-2 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl text-xs font-bold text-white"
            style={{ background: S.primary, boxShadow: `0 4px 16px ${S.primary}40` }}>
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 工具栏 ── */}
      <div className="flex items-center justify-between px-4 py-2 shrink-0"
        style={{ background: S.card, borderBottom: `1px solid ${S.border}` }}>
        <div className="flex items-center gap-2">
          <Monitor size={13} style={{ color: S.primary }} />
          <span className="text-xs font-bold" style={{ color: S.text }}>游戏用户界面</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: `${S.primary}12`, color: S.primary }}>
            已应用 {appliedTemplates.length} 套
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {/* 搜索框 */}
          <div className="flex items-center gap-1 rounded-lg px-2 py-1"
            style={{ background: S.s2, border: `1px solid ${S.border}` }}>
            <Search size={10} style={{ color: S.text3 }} />
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="搜索模板…" className="w-16 text-[9px] bg-transparent focus:outline-none" style={{ color: S.text }} />
          </div>
          {/* AI 生成 UI */}
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => setAiGenOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold focus:outline-none"
            style={{ background: `${S.primary}12`, border: `1px solid ${S.primary}25`, color: S.primary }}>
            <Sparkles size={10} /> AI 生成 UI
          </motion.button>
          {/* 素材市场 */}
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => setMarketOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold focus:outline-none"
            style={{ background: `${S.accent}12`, border: `1px solid ${S.accent}25`, color: S.accent }}>
            <Download size={10} /> 素材市场
          </motion.button>
          {/* 全局设置 */}
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => setPreviewMode(!previewMode)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-medium focus:outline-none"
            style={{ background: previewMode ? S.primary : S.s2, color: previewMode ? "#fff" : S.text2,
              border: `1px solid ${previewMode ? S.primary : S.border}` }}>
            <EyeIcon size={10} /> {previewMode ? "退出预览" : "游戏预览"}
          </motion.button>
        </div>
      </div>

      {/* ── 主体内容 ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* 模板列表 */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* 分类筛选 */}
          <div className="flex items-center gap-1 px-4 py-2 overflow-x-auto shrink-0"
            style={{ borderBottom: `1px solid ${S.border}` }}>
            {UI_CATEGORIES.map(cat => (
              <motion.button key={cat.id} whileTap={{ scale: 0.96 }}
                onClick={() => setCatFilter(cat.id)}
                className="px-2.5 py-1 rounded-lg text-[9px] font-medium whitespace-nowrap focus:outline-none"
                style={{
                  background: catFilter === cat.id ? S.primary : "transparent",
                  color: catFilter === cat.id ? "#fff" : S.text3,
                  border: `1px solid ${catFilter === cat.id ? S.primary : S.border}`,
                }}>
                {cat.label}
              </motion.button>
            ))}
          </div>

          {/* 模板网格 */}
          <div className="flex-1 overflow-y-auto p-4">
            {previewMode ? (
              /* ── 游戏预览模式 ── */
              <div className="max-w-lg mx-auto">
                <div className="relative rounded-2xl overflow-hidden" style={{ background: "#000", minHeight: 480 }}>
                  {/* 模拟游戏场景 */}
                  <div className="absolute inset-0">
                    <img alt="scene" className="w-full h-full object-cover brightness-50"
                      src="https://images.unsplash.com/photo-1515621061946-eff1c2a352bd?auto=format&fit=crop&w=800&q=80" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black opacity-80" />
                  </div>
                  {/* HUD */}
                  {appliedTemplates.includes("tpl-cyber-hud") && (
                    <div className="relative z-10 pt-3 px-3">
                      <HudPreview tpl={UI_TEMPLATES.find(t => t.id === "tpl-cyber-hud")!} />
                    </div>
                  )}
                  {/* 角色立绘占位 */}
                  <div className="relative z-10 flex items-end justify-center" style={{ minHeight: 180, paddingTop: 40 }}>
                    <div className="w-24 h-24 rounded-xl flex items-center justify-center text-4xl"
                      style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }}>
                      🕵️
                    </div>
                  </div>
                  {/* 对话框 */}
                  <div className="relative z-10 px-3 mt-2">
                    {appliedTemplates.includes("tpl-cyber-dialog") && (
                      <DialogPreview tpl={UI_TEMPLATES.find(t => t.id === "tpl-cyber-dialog")!} />
                    )}
                  </div>
                  {/* 选项按钮 */}
                  <div className="relative z-10 px-3 mt-2 pb-4">
                    {appliedTemplates.includes("tpl-cyber-dialog") && (
                      <ChoicePreview tpl={UI_TEMPLATES.find(t => t.id === "tpl-cyber-dialog")!} />
                    )}
                  </div>
                  {/* 底部操作栏 */}
                  <div className="relative z-10 px-3 pb-3 flex items-center justify-between">
                    <div className="flex gap-1.5">
                      {showSkip && (
                        <span className="text-[8px] px-2 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}>跳过</span>
                      )}
                      {showAuto && (
                        <span className="text-[8px] px-2 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}>自动</span>
                      )}
                    </div>
                    {showSave && (
                      <span className="text-[8px] px-2 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}>存档</span>
                    )}
                  </div>
                </div>
                <p className="text-center text-[9px] mt-2" style={{ color: S.text3 }}>
                  游戏预览 — 展示已应用的 UI 模板在实际游戏中的效果
                </p>
              </div>
            ) : (
              /* ── 模板列表模式 ── */
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {filteredTemplates.map(tpl => {
                  const isApplied = appliedTemplates.includes(tpl.id);
                  return (
                    <motion.div key={tpl.id} layout
                      className="rounded-xl overflow-hidden"
                      style={{ background: S.card, border: `1px solid ${isApplied ? S.primary : S.border}`,
                        boxShadow: isApplied ? `0 0 0 1px ${S.primary}20` : "none" }}>
                      {/* 预览区 */}
                      <div className="p-3" style={{ background: S.s2, minHeight: 100 }}>
                        <TemplatePreview tpl={tpl} />
                      </div>
                      {/* 信息区 */}
                      <div className="p-3">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold" style={{ color: S.text }}>{tpl.name}</span>
                            <span className="text-[8px] px-1.5 py-0.5 rounded"
                              style={{ background: `${S.primary}10`, color: S.primary }}>{tpl.style}</span>
                            {tpl.source === "marketplace" && (
                              <span className="text-[8px] px-1.5 py-0.5 rounded"
                                style={{ background: `${S.accent}10`, color: S.accent }}>市场</span>
                            )}
                            {tpl.source === "ai_generated" && (
                              <span className="text-[8px] px-1.5 py-0.5 rounded"
                                style={{ background: `${S.warning}10`, color: S.warning }}>AI</span>
                            )}
                          </div>
                          {isApplied && (
                            <span className="text-[8px] font-bold px-1.5 py-0.5 rounded"
                              style={{ background: `${S.primary}15`, color: S.primary }}>使用中</span>
                          )}
                        </div>
                        <p className="text-[9px] mb-2 line-clamp-2" style={{ color: S.text3 }}>{tpl.description}</p>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-0.5">
                              {[1,2,3,4,5].map(s => (
                                <Star key={s} size={8} fill={s <= Math.round(tpl.rating) ? S.warning : "none"}
                                  style={{ color: s <= Math.round(tpl.rating) ? S.warning : S.border }} />
                              ))}
                              <span className="text-[8px] ml-0.5" style={{ color: S.text3 }}>{tpl.rating}</span>
                            </div>
                            <span className="text-[8px]" style={{ color: S.text3 }}>
                              <Download size={7} className="inline" /> {tpl.downloads}
                            </span>
                            <span className="text-[8px]" style={{ color: S.text3 }}>by {tpl.author}</span>
                          </div>
                          <span className="text-[8px]" style={{ color: S.text3 }}>
                            {tpl.components.length} 组件
                          </span>
                        </div>
                        {/* 操作按钮 */}
                        <div className="flex gap-1.5">
                          <motion.button whileTap={{ scale: 0.96 }} onClick={() => toggleApply(tpl.id)}
                            className="flex-1 py-1.5 rounded-lg text-[9px] font-bold focus:outline-none flex items-center justify-center gap-1"
                            style={{
                              background: isApplied ? S.error : S.primary,
                              color: "#fff",
                            }}>
                            {isApplied ? <><Trash2 size={9} /> 移除</> : <><Check size={9} /> 应用</>}
                          </motion.button>
                          <motion.button whileTap={{ scale: 0.96 }} onClick={() => setSelectedTpl(tpl)}
                            className="px-2.5 py-1.5 rounded-lg text-[9px] font-medium focus:outline-none"
                            style={{ background: S.s2, border: `1px solid ${S.border}`, color: S.text2 }}>
                            详情
                          </motion.button>
                          <motion.button whileTap={{ scale: 0.96 }} onClick={() => duplicateTpl(tpl)}
                            className="px-2 py-1.5 rounded-lg text-[9px] font-medium focus:outline-none"
                            style={{ background: S.s2, border: `1px solid ${S.border}`, color: S.text3 }}>
                            <Copy size={9} />
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
                {filteredTemplates.length === 0 && (
                  <div className="col-span-2 flex flex-col items-center justify-center py-12 gap-2">
                    <Search size={24} style={{ color: S.text3, opacity: 0.4 }} />
                    <p className="text-sm font-bold" style={{ color: S.text3 }}>未找到匹配的模板</p>
                    <p className="text-[10px]" style={{ color: S.text3 }}>尝试更换分类或清除搜索关键词</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── 右侧面板：组件详情 / 全局设置 ── */}
        <div className="w-[220px] shrink-0 border-l overflow-y-auto"
          style={{ borderColor: S.border, background: S.card }}>

          {/* 全局设置 */}
          <div className="px-3 py-3 border-b" style={{ borderColor: S.border }}>
            <p className="text-[9px] font-bold uppercase tracking-wider mb-2" style={{ color: S.text3 }}>全局 UI 设置</p>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between mb-0.5">
                  <span className="text-[9px]" style={{ color: S.text2 }}>文字速度</span>
                  <span className="text-[9px] font-mono" style={{ color: S.primary }}>{globalTextSpeed}ms</span>
                </div>
                <input type="range" min={10} max={100} value={globalTextSpeed}
                  onChange={e => setGlobalTextSpeed(Number(e.target.value))}
                  className="w-full h-1 rounded-full appearance-none cursor-pointer"
                  style={{ accentColor: S.primary, background: S.s2 }} />
              </div>
              {[
                { label: "显示跳过按钮", val: showSkip, set: setShowSkip },
                { label: "显示自动播放", val: showAuto, set: setShowAuto },
                { label: "显示存档/读档", val: showSave, set: setShowSave },
              ].map(opt => (
                <div key={opt.label} className="flex items-center justify-between">
                  <span className="text-[9px]" style={{ color: S.text2 }}>{opt.label}</span>
                  <motion.button whileTap={{ scale: 0.9 }}
                    onClick={() => opt.set(!opt.val)}
                    className="w-8 h-4 rounded-full relative transition-colors focus:outline-none"
                    style={{ background: opt.val ? S.primary : S.s2 }}>
                    <motion.div className="w-3 h-3 rounded-full absolute top-0.5"
                      animate={{ left: opt.val ? 18 : 2 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      style={{ background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
                  </motion.button>
                </div>
              ))}
            </div>
          </div>

          {/* 已应用模板组件列表 */}
          <div className="px-3 py-3">
            <p className="text-[9px] font-bold uppercase tracking-wider mb-2" style={{ color: S.text3 }}>已应用组件</p>
            {appliedTemplates.length === 0 ? (
              <div className="py-4 text-center">
                <Layout size={18} style={{ color: S.text3, opacity: 0.4, margin: "0 auto 4px" }} />
                <p className="text-[9px]" style={{ color: S.text3 }}>暂未应用任何 UI 模板</p>
                <p className="text-[8px]" style={{ color: S.text3 }}>从左侧列表选择模板并应用</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {UI_TEMPLATES.filter(t => appliedTemplates.includes(t.id)).map(tpl => (
                  <div key={tpl.id}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-[9px] font-bold" style={{ color: S.text }}>{tpl.name}</span>
                    </div>
                    {tpl.components.map(comp => (
                      <motion.button key={comp.id} whileTap={{ scale: 0.97 }}
                        onClick={() => setEditingComponent(editingComponent?.id === comp.id ? null : comp)}
                        className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-left focus:outline-none mb-0.5"
                        style={{
                          background: editingComponent?.id === comp.id ? `${S.primary}10` : S.s2,
                          border: `1px solid ${editingComponent?.id === comp.id ? `${S.primary}30` : S.border}`,
                        }}>
                        <Settings size={9} style={{ color: S.text3 }} />
                        <span className="text-[9px]" style={{ color: S.text2 }}>{comp.label}</span>
                        <ChevronDown size={8} className="ml-auto" style={{ color: S.text3,
                          transform: editingComponent?.id === comp.id ? "rotate(180deg)" : "none", transition: "0.15s" }} />
                      </motion.button>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {/* 组件属性编辑 */}
            <AnimatePresence>
              {editingComponent && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.15 }} className="overflow-hidden">
                  <div className="mt-2 p-2.5 rounded-xl space-y-2" style={{ background: S.s2, border: `1px solid ${S.border}` }}>
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold" style={{ color: S.text }}>属性编辑</span>
                      <button onClick={() => setEditingComponent(null)} className="focus:outline-none">
                        <X size={10} style={{ color: S.text3 }} />
                      </button>
                    </div>
                    <p className="text-[8px] px-1.5 py-0.5 rounded inline-block"
                      style={{ background: `${S.primary}10`, color: S.primary }}>
                      {editingComponent.label}
                    </p>
                    {Object.entries(editingComponent.props).map(([key, val]) => (
                      <div key={key}>
                        <span className="text-[8px] font-medium" style={{ color: S.text3 }}>{key}</span>
                        {typeof val === "boolean" ? (
                          <motion.button whileTap={{ scale: 0.9 }}
                            className="block w-8 h-4 rounded-full relative mt-0.5 focus:outline-none"
                            style={{ background: val ? S.primary : S.border }}>
                            <motion.div className="w-3 h-3 rounded-full absolute top-0.5"
                              animate={{ left: val ? 18 : 2 }}
                              style={{ background: "#fff", boxShadow: "0 1px 2px rgba(0,0,0,0.15)" }} />
                          </motion.button>
                        ) : typeof val === "number" ? (
                          <input type="number" defaultValue={val}
                            className="w-full mt-0.5 px-2 py-1 rounded text-[9px] focus:outline-none"
                            style={{ background: S.card, border: `1px solid ${S.border}`, color: S.text }} />
                        ) : (
                          <input type="text" defaultValue={String(val)}
                            className="w-full mt-0.5 px-2 py-1 rounded text-[9px] focus:outline-none"
                            style={{ background: S.card, border: `1px solid ${S.border}`, color: S.text }} />
                        )}
                      </div>
                    ))}
                    <motion.button whileTap={{ scale: 0.96 }}
                      onClick={() => { showToast("属性已保存"); setEditingComponent(null); }}
                      className="w-full py-1.5 rounded-lg text-[9px] font-bold text-white focus:outline-none"
                      style={{ background: S.primary }}>
                      保存修改
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ── 模板详情弹窗 ── */}
      <AnimatePresence>
        {selectedTpl && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.4)" }} onClick={() => setSelectedTpl(null)}>
            <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }} transition={{ type: "spring", stiffness: 380, damping: 32 }}
              className="w-full max-w-md rounded-2xl overflow-hidden"
              style={{ background: S.card, border: `1px solid ${S.border}`, boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}
              onClick={e => e.stopPropagation()}>
              {/* 预览 */}
              <div className="p-4" style={{ background: S.s2 }}>
                <TemplatePreview tpl={selectedTpl} />
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold" style={{ color: S.text }}>{selectedTpl.name}</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: `${S.primary}10`, color: S.primary }}>
                        {selectedTpl.style}
                      </span>
                      <span className="text-[9px]" style={{ color: S.text3 }}>by {selectedTpl.author}</span>
                    </div>
                  </div>
                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => setSelectedTpl(null)}
                    className="w-7 h-7 rounded-full flex items-center justify-center focus:outline-none"
                    style={{ background: S.s2, color: S.text3 }}>
                    <X size={12} />
                  </motion.button>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: S.text2 }}>{selectedTpl.description}</p>
                {/* 组件列表 */}
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-wider mb-1.5" style={{ color: S.text3 }}>
                    包含 {selectedTpl.components.length} 个组件
                  </p>
                  <div className="space-y-1">
                    {selectedTpl.components.map(comp => (
                      <div key={comp.id} className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg"
                        style={{ background: S.s2, border: `1px solid ${S.border}` }}>
                        <Settings size={9} style={{ color: S.primary }} />
                        <span className="text-[9px] font-medium" style={{ color: S.text }}>{comp.label}</span>
                        <span className="text-[8px] px-1 py-0.5 rounded ml-auto"
                          style={{ background: `${S.primary}08`, color: S.text3 }}>{comp.type}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {/* 操作 */}
                <div className="flex gap-2">
                  <motion.button whileTap={{ scale: 0.96 }}
                    onClick={() => { toggleApply(selectedTpl.id); setSelectedTpl(null); }}
                    className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white focus:outline-none"
                    style={{ background: appliedTemplates.includes(selectedTpl.id) ? S.error : S.primary }}>
                    {appliedTemplates.includes(selectedTpl.id) ? "移除模板" : "应用到项目"}
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.96 }}
                    onClick={() => { duplicateTpl(selectedTpl); setSelectedTpl(null); }}
                    className="px-4 py-2.5 rounded-xl text-xs font-medium focus:outline-none"
                    style={{ background: S.s2, border: `1px solid ${S.border}`, color: S.text2 }}>
                    复制编辑
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── AI 生成 UI 弹窗 ── */}
      <AnimatePresence>
        {aiGenOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.4)" }} onClick={() => { setAiGenOpen(false); setAiGenResult(null); }}>
            <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }} transition={{ type: "spring", stiffness: 380, damping: 32 }}
              className="w-full max-w-lg rounded-2xl p-5 space-y-4"
              style={{ background: S.card, border: `1px solid ${S.border}`, boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}
              onClick={e => e.stopPropagation()}>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ background: `${S.primary}15` }}>
                    <Sparkles size={16} style={{ color: S.primary }} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold" style={{ color: S.text }}>AI 生成游戏 UI</h3>
                    <p className="text-[9px]" style={{ color: S.text3 }}>基于剧本内容和风格自动生成配套 UI</p>
                  </div>
                </div>
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => { setAiGenOpen(false); setAiGenResult(null); }}
                  className="w-7 h-7 rounded-full flex items-center justify-center focus:outline-none"
                  style={{ background: S.s2, color: S.text3 }}>
                  <X size={12} />
                </motion.button>
              </div>

              {aiGenResult ? (
                /* AI 生成结果 */
                <div className="space-y-3">
                  <div className="p-3 rounded-xl" style={{ background: `${S.success}08`, border: `1px solid ${S.success}25` }}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <CheckCircle2 size={12} style={{ color: S.success }} />
                      <span className="text-[10px] font-bold" style={{ color: S.success }}>生成完成</span>
                    </div>
                    <p className="text-[9px]" style={{ color: S.text3 }}>
                      已基于「{aiGenResult.style}」风格和剧本内容生成完整 UI 套件
                    </p>
                  </div>
                  <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${S.border}` }}>
                    <div className="p-3" style={{ background: S.s2 }}>
                      <TemplatePreview tpl={aiGenResult} />
                    </div>
                    <div className="p-3">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-xs font-bold" style={{ color: S.text }}>{aiGenResult.name}</span>
                        <span className="text-[8px] px-1.5 py-0.5 rounded" style={{ background: `${S.warning}10`, color: S.warning }}>AI</span>
                      </div>
                      <p className="text-[9px]" style={{ color: S.text3 }}>{aiGenResult.description}</p>
                      <p className="text-[8px] mt-1" style={{ color: S.text3 }}>
                        包含 {aiGenResult.components.length} 个组件: {aiGenResult.components.map(c => c.label).join("、")}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <motion.button whileTap={{ scale: 0.96 }}
                      onClick={() => { showToast("AI 生成的 UI 已应用到项目"); setAiGenOpen(false); setAiGenResult(null); }}
                      className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white focus:outline-none"
                      style={{ background: S.primary }}>
                      应用并保存
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.96 }}
                      onClick={() => { setAiGenResult(null); }}
                      className="px-4 py-2.5 rounded-xl text-xs font-medium focus:outline-none"
                      style={{ background: S.s2, border: `1px solid ${S.border}`, color: S.text2 }}>
                      <RotateCcw size={11} className="inline mr-1" /> 重新生成
                    </motion.button>
                  </div>
                </div>
              ) : aiGenLoading ? (
                /* 生成中 */
                <div className="flex flex-col items-center justify-center py-8 gap-3">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: `${S.primary}15` }}>
                    <Sparkles size={20} style={{ color: S.primary }} />
                  </motion.div>
                  <p className="text-xs font-bold" style={{ color: S.text }}>AI 正在生成 UI…</p>
                  <div className="space-y-1 w-full max-w-xs">
                    {["分析剧本风格", "匹配 UI 元素", "生成对话框", "生成 HUD", "生成系统菜单"].map((step, i) => (
                      <motion.div key={step} initial={{ opacity: 0.3 }}
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}>
                        <div className="flex items-center gap-1.5">
                          <Loader2 size={9} className="animate-spin" style={{ color: S.primary }} />
                          <span className="text-[9px]" style={{ color: S.text3 }}>{step}</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ) : (
                /* 生成配置 */
                <div className="space-y-3">
                  <div>
                    <p className="text-[10px] font-bold mb-1.5" style={{ color: S.text2 }}>UI 风格</p>
                    <div className="grid grid-cols-4 gap-1.5">
                      {["赛博朋克", "古风仙侠", "现代简约", "暗黑哥特", "日系动漫", "蒸汽朋克", "像素复古", "水彩手绘"].map(style => (
                        <motion.button key={style} whileTap={{ scale: 0.96 }}
                          onClick={() => setAiGenStyle(style)}
                          className="py-2 rounded-lg text-[9px] font-medium focus:outline-none"
                          style={{
                            background: aiGenStyle === style ? S.primary : S.s2,
                            color: aiGenStyle === style ? "#fff" : S.text2,
                            border: `1px solid ${aiGenStyle === style ? S.primary : S.border}`,
                          }}>
                          {style}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold mb-1.5" style={{ color: S.text2 }}>生成范围</p>
                    <div className="grid grid-cols-3 gap-1.5">
                      {["全套 UI（推荐）", "仅对话框", "仅系统菜单"].map((scope, i) => (
                        <motion.button key={scope} whileTap={{ scale: 0.96 }}
                          className="py-2 rounded-lg text-[9px] font-medium focus:outline-none"
                          style={{
                            background: i === 0 ? `${S.primary}12` : S.s2,
                            color: i === 0 ? S.primary : S.text3,
                            border: `1px solid ${i === 0 ? `${S.primary}30` : S.border}`,
                          }}>
                          {scope}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl" style={{ background: S.s2, border: `1px solid ${S.border}` }}>
                    <p className="text-[9px] leading-relaxed" style={{ color: S.text3 }}>
                      AI 将分析「幽灵协议」的赛博朋克·间谍惊悚题材，自动生成包含对话框、选项按钮、HUD 状态栏、
                      系统菜单等配套 UI，确保视觉风格与剧情内容高度统一。
                    </p>
                  </div>
                  <motion.button whileTap={{ scale: 0.96 }}
                    onClick={() => {
                      setAiGenLoading(true);
                      setTimeout(() => {
                        setAiGenLoading(false);
                        setAiGenResult({
                          id: `ai-gen-${Date.now()}`,
                          name: `AI·${aiGenStyle}风格 UI 套件`,
                          category: "dialog",
                          style: aiGenStyle,
                          author: "AI 生成",
                          downloads: 0,
                          rating: 0,
                          preview: "",
                          description: `基于「幽灵协议」剧本自动生成的${aiGenStyle}风格 UI 套件，包含对话框、选项按钮、HUD 和系统菜单。`,
                          source: "ai_generated",
                          isApplied: false,
                          components: [
                            { id: "ai-c1", type: "dialog_box", label: "AI 对话框", props: { bg: "rgba(0,10,30,0.9)", border: S.primary, borderRadius: 14, textSpeed: 35, showNameplate: true } },
                            { id: "ai-c2", type: "choice_button", label: "AI 选项按钮", props: { bg: `linear-gradient(90deg,${S.primary}80,${S.accent}60)`, hoverBg: S.primary, fontSize: 12, animated: true } },
                            { id: "ai-c3", type: "hud_bar", label: "AI HUD", props: { position: "top", bg: "rgba(0,0,0,0.6)", blur: true, showIcons: true } },
                            { id: "ai-c4", type: "menu_panel", label: "AI 系统菜单", props: { bg: "rgba(0,10,30,0.92)", blur: true, layout: "center", transition: "fade" } },
                          ],
                        });
                      }, 3000);
                    }}
                    className="w-full py-3 rounded-xl text-xs font-bold text-white focus:outline-none flex items-center justify-center gap-1.5"
                    style={{ background: `linear-gradient(135deg,${S.primary},${S.accent})`, boxShadow: `0 4px 16px ${S.primary}30` }}>
                    <Wand2 size={13} /> 开始 AI 生成
                  </motion.button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 素材市场弹窗 ── */}
      <AnimatePresence>
        {marketOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.4)" }} onClick={() => setMarketOpen(false)}>
            <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }} transition={{ type: "spring", stiffness: 380, damping: 32 }}
              className="w-full max-w-lg rounded-2xl overflow-hidden"
              style={{ background: S.card, border: `1px solid ${S.border}`, boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}
              onClick={e => e.stopPropagation()}>
              {/* 头部 */}
              <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${S.border}` }}>
                <div className="flex items-center gap-2">
                  <Download size={14} style={{ color: S.accent }} />
                  <h3 className="text-sm font-bold" style={{ color: S.text }}>UI 素材市场</h3>
                  <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: `${S.accent}10`, color: S.accent }}>
                    {UI_TEMPLATES.filter(t => t.source === "marketplace").length} 个可用
                  </span>
                </div>
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => setMarketOpen(false)}
                  className="w-7 h-7 rounded-full flex items-center justify-center focus:outline-none"
                  style={{ background: S.s2, color: S.text3 }}>
                  <X size={12} />
                </motion.button>
              </div>
              {/* 市场模板列表 */}
              <div className="max-h-[60vh] overflow-y-auto p-4 space-y-3">
                {UI_TEMPLATES.filter(t => t.source === "marketplace").map(tpl => (
                  <div key={tpl.id} className="rounded-xl overflow-hidden"
                    style={{ background: S.s2, border: `1px solid ${S.border}` }}>
                    <div className="p-3">
                      <TemplatePreview tpl={tpl} />
                    </div>
                    <div className="p-3" style={{ background: S.card }}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold" style={{ color: S.text }}>{tpl.name}</span>
                          <span className="text-[8px] px-1.5 py-0.5 rounded" style={{ background: `${S.primary}10`, color: S.primary }}>{tpl.style}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {[1,2,3,4,5].map(s => (
                            <Star key={s} size={8} fill={s <= Math.round(tpl.rating) ? S.warning : "none"}
                              style={{ color: s <= Math.round(tpl.rating) ? S.warning : S.border }} />
                          ))}
                        </div>
                      </div>
                      <p className="text-[9px] mb-2" style={{ color: S.text3 }}>{tpl.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[8px]" style={{ color: S.text3 }}>
                          <span>{tpl.author}</span>
                          <span><Download size={7} className="inline" /> {tpl.downloads}</span>
                          <span>{tpl.components.length} 组件</span>
                        </div>
                        <motion.button whileTap={{ scale: 0.96 }}
                          onClick={() => { toggleApply(tpl.id); showToast(`已导入「${tpl.name}」`); }}
                          className="px-3 py-1 rounded-lg text-[9px] font-bold text-white focus:outline-none"
                          style={{ background: S.accent }}>
                          导入应用
                        </motion.button>
                      </div>
                    </div>
                  </div>
                ))}
                {UI_TEMPLATES.filter(t => t.source === "marketplace").length === 0 && (
                  <div className="flex flex-col items-center py-8 gap-2">
                    <Package size={24} style={{ color: S.text3, opacity: 0.4 }} />
                    <p className="text-xs font-bold" style={{ color: S.text3 }}>市场暂无 UI 模板</p>
                    <p className="text-[9px]" style={{ color: S.text3 }}>更多模板即将上线</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── 主编辑器页面 ──────────────────────────────────────────────────────────
export default function NodesScreen() {
  const [activeTab, setActiveTab] = useState<TabId>("canvas");
  const [sel, setSel] = useState<string|null>(null);
  const [checkOpen, setCheckOpen] = useState(true);
  const [aiModal, setAiModal] = useState<"write"|"node"|"bgm"|"portrait"|null>(null);
  const [aiInput, setAiInput] = useState("");
  const [aiToolsOpen, setAiToolsOpen] = useState(false);

  const doneCount = CHECKS.filter(c=>c.status==="ok").length;
  const pct = Math.round((doneCount/CHECKS.length)*100);

  return (
    <div className="h-svh flex flex-col" style={{ background:S.bg }}>

      {/* ── 顶部标题栏（对齐截图：幽灵协议 · 赛博朋克·间谍惊悚 · ✓正常）── */}
      <div className="flex items-center justify-between px-4 py-2 shrink-0"
        style={{ background:S.card, borderBottom:`1px solid ${S.border}` }}>
        {/* 左：项目信息 */}
        <div className="flex items-center gap-3">
          <Link href="/">
            <motion.div whileTap={{ scale:0.95 }} className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer"
              style={{ background:`${S.primary}12` }}>
              <span className="text-[10px] font-black" style={{ color:S.primary }}>卓</span>
            </motion.div>
          </Link>
          <div className="w-px h-4" style={{ background:S.border }} />
          <span className="text-sm font-bold" style={{ color:S.text }}>幽灵协议</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background:S.s2, color:S.text3 }}>
            赛博朋克 · 间谍惊悚
          </span>
          <div className="flex items-center gap-1">
            <CheckCircle2 size={12} style={{ color:S.success }} />
            <span className="text-[10px]" style={{ color:S.success }}>正常</span>
          </div>
        </div>

        {/* 右：操作按钮——整合成紧凑图标组，减少视觉噪音 */}
        <div className="flex items-center gap-1.5">
          {/* 基础操作图标组 */}
          <div className="flex items-center rounded-xl overflow-hidden"
            style={{ border:`1px solid ${S.border}` }}>
            <Link href="/simulator">
              <motion.button whileTap={{ scale:0.97 }} title="预览"
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium focus:outline-none"
                style={{ background:S.s2, color:S.text2 }}>
                <Eye size={13} /> <span className="hidden lg:inline">预览</span>
              </motion.button>
            </Link>
            <div style={{ width:1, background:S.border, height:24 }} />
            <div className="flex items-center gap-1 px-2.5 py-1.5"
              style={{ background:S.s2, color:S.success }}>
              <Save size={12} />
              <span className="text-[10px] hidden lg:inline" style={{ color:S.success }}>已保存</span>
            </div>
          </div>

          {/* AI工具下拉 */}
          <div className="relative">
            <motion.button whileTap={{ scale:0.97 }}
              onClick={() => setAiToolsOpen(o=>!o)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold focus:outline-none"
              style={{ background:`${S.primary}12`, border:`1px solid ${S.primary}25`, color:S.primary }}>
              <Sparkles size={12} /> AI工具
              <ChevronDown size={10} />
            </motion.button>
            <AnimatePresence>
              {aiToolsOpen && (
                <motion.div initial={{ opacity:0, y:4 }} animate={{ opacity:1, y:0 }}
                  exit={{ opacity:0, y:4 }} transition={{ duration:0.12 }}
                  className="absolute right-0 top-full mt-1 rounded-xl py-1.5 w-40 z-50"
                  style={{ background:S.card, border:`1px solid ${S.border}`, boxShadow:"0 4px 16px rgba(0,0,0,0.1)" }}>
                  {[
                    { label:"AI续写故事",   icon:Sparkles,  action:()=>{ setAiModal("write");    setAiToolsOpen(false); } },
                    { label:"AI生成节点",   icon:GitBranch, action:()=>{ setAiModal("node");     setAiToolsOpen(false); } },
                    { label:"AI一键BGM",   icon:Music,     action:()=>{ setAiModal("bgm");      setAiToolsOpen(false); } },
                    { label:"AI生成立绘",   icon:User,      action:()=>{ setAiModal("portrait"); setAiToolsOpen(false); } },
                  ].map(item => (
                    <motion.button key={item.label} whileTap={{ scale:0.98 }}
                      onClick={item.action}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left focus:outline-none hover:bg-gray-50"
                      style={{ color:S.text2 }}>
                      <item.icon size={11} style={{ color:S.primary }} />
                      {item.label}
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 发布按钮 */}
          <Link href="/publish">
            <motion.button whileTap={{ scale:0.97 }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-white focus:outline-none"
              style={{ background:S.primary }}>
              <Rocket size={12} /> 发布
            </motion.button>
          </Link>
        </div>
      </div>

      {/* ── 6个Tab（完全对齐截图：剧本/画布/热力图/故事/角色/资产）── */}
      <div className="flex items-center border-b shrink-0"
        style={{ background:S.card, borderColor:S.border }}>
        {TABS.map(tab => (
          <motion.button key={tab.id} whileTap={{ scale:0.97 }}
            onClick={() => setActiveTab(tab.id)}
            className="relative flex items-center gap-1.5 px-5 py-2.5 text-xs font-medium focus:outline-none"
            style={{ color: activeTab===tab.id ? S.primary : S.text3 }}>
            <tab.icon size={13} />
            {tab.label}
            {activeTab===tab.id && (
              <motion.div layoutId="tab-line"
                className="absolute bottom-0 inset-x-0 h-0.5"
                style={{ background:S.primary }} />
            )}
          </motion.button>
        ))}
      </div>

      {/* ── 三栏主体 ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* 左侧面板（完全对齐截图：阶段检查 + 章节节点列表）*/}
        <div className="w-[190px] shrink-0 border-r overflow-y-auto"
          style={{ borderColor:S.border, background:S.card }}>

          {/* 阶段检查（对齐截图：第一阶段主线检查 83%）*/}
          <div className="px-3 pt-3 pb-2 border-b" style={{ borderColor:S.border }}>
            <button className="w-full flex items-center justify-between focus:outline-none"
              onClick={() => setCheckOpen(o=>!o)}>
              <div>
                <p className="text-[10px] font-bold" style={{ color:S.text }}>第一阶段主线检查</p>
                <p className="text-[9px]" style={{ color:S.text3 }}>生成、编辑、预览、发布 H5</p>
              </div>
              <div className="text-right">
                <p className="text-base font-bold font-mono" style={{ color:S.primary }}>{pct}%</p>
                <p className="text-[8px]" style={{ color:S.text3 }}>完成度</p>
              </div>
            </button>
            {/* 进度条 */}
            <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background:S.s2 }}>
              <div className="h-full rounded-full" style={{ width:`${pct}%`, background:S.primary }} />
            </div>
          </div>

          {/* 检查项列表 */}
          <AnimatePresence>
            {checkOpen && (
              <motion.div initial={{ height:0 }} animate={{ height:"auto" }} exit={{ height:0 }}
                className="overflow-hidden">
                <div className="px-3 py-2 space-y-1">
                  {CHECKS.map((c,i) => (
                    <div key={i} className="py-1.5"
                      style={{ borderBottom: i<CHECKS.length-1 ? `1px solid ${S.border}` : "none" }}>
                      <div className="flex items-start gap-1.5">
                        {c.status==="ok"
                          ? <CheckCircle2 size={12} style={{ color:S.success, marginTop:1, flexShrink:0 }} />
                          : <AlertTriangle size={12} style={{ color:S.warning, marginTop:1, flexShrink:0 }} />}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] font-bold" style={{ color:S.text }}>{c.label}</span>
                            <span className="text-[8px] font-bold px-1 rounded"
                              style={{ background: c.status==="ok" ? `${S.success}12` : `${S.warning}12`,
                                color: c.status==="ok" ? S.success : S.warning }}>
                              {c.status==="ok" ? "完成" : "建议"}
                            </span>
                          </div>
                          <p className="text-[9px] leading-snug mt-0.5" style={{ color:S.text3 }}>{c.detail}</p>
                          {/* 补充资产按钮（对齐截图中的警告项）*/}
                          {c.label==="节点资产" && (
                            <Link href="/assets">
                              <motion.span whileTap={{ scale:0.95 }}
                                className="inline-flex items-center gap-0.5 mt-1 text-[9px] font-bold cursor-pointer px-1.5 py-0.5 rounded"
                                style={{ background:`${S.primary}12`, color:S.primary, border:`1px solid ${S.primary}20` }}>
                                <ExternalLink size={8} /> 补充资产
                              </motion.span>
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 章节节点列表（对齐截图底部：第一章：渗透行动）*/}
          <div className="px-3 py-2" style={{ borderTop:`1px solid ${S.border}` }}>
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] font-bold" style={{ color:S.text }}>第一章：渗透行动</p>
              <p className="text-[9px]" style={{ color:S.text3 }}>11 节点</p>
            </div>
            <div className="mb-1.5">
              <p className="text-[9px] font-medium mb-1" style={{ color:S.text3 }}>节点列表</p>
              <motion.button whileTap={{ scale:0.97 }}
                className="flex items-center gap-1 w-full py-1 focus:outline-none"
                style={{ color:S.text3 }}>
                <Plus size={10} />
                <span className="text-[9px]">添加节点</span>
              </motion.button>
            </div>
            <div className="space-y-0.5">
              {STORY_NODES.slice(0,6).map(node => (
                <motion.button key={node.id} whileTap={{ scale:0.97 }}
                  onClick={() => setSel(node.id===sel?null:node.id)}
                  className="w-full text-left px-2 py-1 rounded text-[9px] truncate focus:outline-none"
                  style={{
                    background: sel===node.id ? `${S.primary}10` : "transparent",
                    color: sel===node.id ? S.primary : S.text3 }}>
                  {node.label}
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        {/* 中央主工作区 */}
        <div className="flex-1 overflow-hidden min-w-0">
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity:0 }} animate={{ opacity:1 }}
              exit={{ opacity:0 }} transition={{ duration:0.1 }} className="h-full">
              {activeTab==="canvas"    && <CanvasContent sel={sel} setSel={setSel} />}
              {activeTab==="script"    && <ScriptContent />}
              {activeTab==="heatmap"   && <HeatmapContent />}
              {activeTab==="story"     && <StoryContent />}
              {activeTab==="character" && <CharacterContent />}
              {activeTab==="assets"    && <AssetsContent />}
              {activeTab==="ui"        && <UIContent />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* ── AI 功能弹窗 ── */}
      <AnimatePresence>
        {aiModal && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4"
            style={{ background:"rgba(0,0,0,0.4)" }}
            onClick={() => setAiModal(null)}>
            <motion.div initial={{ y:40, opacity:0 }} animate={{ y:0, opacity:1 }}
              exit={{ y:40, opacity:0 }} transition={{ type:"spring", stiffness:380, damping:32 }}
              className="w-full max-w-md rounded-2xl p-5 space-y-4"
              style={{ background:S.card, border:`1px solid ${S.border}`, boxShadow:"0 8px 32px rgba(0,0,0,0.12)" }}
              onClick={e => e.stopPropagation()}>

              {/* 弹窗标题 */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold" style={{ color:S.text }}>
                    {aiModal==="write"   && "✍️ AI 续写故事"}
                    {aiModal==="node"    && "🔗 AI 生成节点"}
                    {aiModal==="bgm"     && "🎵 AI 一键生成 BGM"}
                    {aiModal==="portrait"&& "🎨 AI 生成立绘"}
                  </h3>
                  <p className="text-[10px] mt-0.5" style={{ color:S.text3 }}>
                    {aiModal==="write"   && "基于当前节点向后续续写剧情分支"}
                    {aiModal==="node"    && "AI 自动分析剧本，生成互动节点图"}
                    {aiModal==="bgm"     && "为每个场景节点一键生成背景音乐"}
                    {aiModal==="portrait"&& "上传参考图保持角色外貌一致性"}
                  </p>
                </div>
                <motion.button whileTap={{ scale:0.9 }} onClick={() => setAiModal(null)}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-sm focus:outline-none"
                  style={{ background:S.s2, color:S.text3 }}>×</motion.button>
              </div>

              {/* 续写：输入框 */}
              {aiModal==="write" && (
                <div className="space-y-3">
                  <div>
                    <p className="text-[10px] font-bold mb-1.5" style={{ color:S.text3 }}>续写方向（可选）</p>
                    <textarea value={aiInput} onChange={e=>setAiInput(e.target.value)}
                      rows={3} placeholder="留空则让 AI 自动判断最优续写方向……"
                      className="w-full resize-none rounded-xl px-3 py-2.5 text-xs focus:outline-none"
                      style={{ background:S.s2, border:`1px solid ${S.border}`, color:S.text }} />
                  </div>
                  <div className="flex gap-2">
                    {["续写主线","增加悬疑","加入反转","生成失败分支"].map(opt => (
                      <motion.button key={opt} whileTap={{ scale:0.96 }} onClick={() => setAiInput(opt)}
                        className="px-2.5 py-1 rounded-lg text-[9px] font-medium focus:outline-none"
                        style={{ background:`${S.primary}10`, border:`1px solid ${S.primary}20`, color:S.primary }}>
                        {opt}
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* 生成节点：参数 */}
              {aiModal==="node" && (
                <div className="space-y-2">
                  {[
                    { label:"节点生成模式", options:["互动改编","忠实还原","AI优化"] },
                    { label:"分支深度",    options:["1层","2层","3层"] },
                    { label:"结局数量",    options:["1个","2个","3个"] },
                  ].map(row => (
                    <div key={row.label} className="flex items-center justify-between">
                      <span className="text-xs" style={{ color:S.text2 }}>{row.label}</span>
                      <div className="flex gap-1">
                        {row.options.map((o,i) => (
                          <motion.button key={o} whileTap={{ scale:0.96 }}
                            className="px-2 py-0.5 rounded text-[9px] font-medium focus:outline-none"
                            style={{ background: i===0 ? S.primary : S.s2,
                              color: i===0 ? "#fff" : S.text3,
                              border: i===0 ? "none" : `1px solid ${S.border}` }}>
                            {o}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* BGM：服务配置 */}
              {aiModal==="bgm" && (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl" style={{ background:S.s2, border:`1px solid ${S.border}` }}>
                    <p className="text-[9px] font-bold mb-1" style={{ color:S.text3 }}>BGM 生成服务地址</p>
                    <input placeholder="https://your-bgm-service.com/api"
                      className="w-full text-xs bg-transparent focus:outline-none"
                      style={{ color:S.text }} />
                  </div>
                  <p className="text-[9px]" style={{ color:S.text3 }}>
                    将为项目中 9 个节点批量生成 BGM，生成后可在资产库中试听和替换。
                  </p>
                </div>
              )}

              {/* 立绘：上传参考图 */}
              {aiModal==="portrait" && (
                <div className="space-y-3">
                  <div className="rounded-xl border-2 border-dashed flex flex-col items-center justify-center py-6 gap-2 cursor-pointer"
                    style={{ borderColor:S.border, background:S.s2 }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background:`${S.primary}12` }}>
                      <span className="text-xl">🖼</span>
                    </div>
                    <p className="text-xs font-bold" style={{ color:S.text }}>上传角色参考图</p>
                    <p className="text-[9px]" style={{ color:S.text3 }}>支持 JPG / PNG，用于保持角色外貌一致性</p>
                  </div>
                  <div className="flex gap-2">
                    {["默认","愤怒","受伤","沉默"].map((s,i) => (
                      <div key={s} className="flex-1 aspect-square rounded-xl flex items-center justify-center text-xs"
                        style={{ background: i<2 ? "#1a1a2e" : S.s2,
                          border:`1px solid ${i<2 ? `${S.primary}30` : S.border}`,
                          color: i<2 ? S.primary : S.text3 }}>
                        {i<2 ? "✓" : s}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 执行按钮 */}
              <div className="flex gap-2">
                <motion.button whileTap={{ scale:0.97 }} onClick={() => setAiModal(null)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white focus:outline-none"
                  style={{ background:S.primary, boxShadow:`0 2px 8px ${S.primary}30` }}>
                  {aiModal==="write"   && "开始续写"}
                  {aiModal==="node"    && "立即生成节点图"}
                  {aiModal==="bgm"     && "批量生成 BGM"}
                  {aiModal==="portrait"&& "生成立绘"}
                </motion.button>
                <motion.button whileTap={{ scale:0.97 }} onClick={() => setAiModal(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-medium focus:outline-none"
                  style={{ background:S.s2, border:`1px solid ${S.border}`, color:S.text2 }}>
                  取消
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
