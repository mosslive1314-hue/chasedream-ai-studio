import { useState } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2, AlertTriangle, ChevronRight, ChevronDown,
  BookOpen, GitBranch, Users, MapPin, Package,
  Film, Music, Mic2, Video, Layers
} from "lucide-react";
import { Link } from "@tanstack/react-router";

const S = {
  bg:"#FAFBFF", card:"#FFFFFF", s2:"#F4F6FC", s3:"#EDF0F8",
  border:"#E2E5F0", border2:"#CBD0E5",
  primary:"#5E50E8", accent:"#00A99D",
  text:"#1A1D2E", text2:"#4A5068", text3:"#8892B0",
  success:"#059669", warning:"#D97706", error:"#DC2626",
};

const CHAPTERS = [
  {
    id: 1, title: "第一章 渗透行动", nodeCount: 11, branchCount: 2, duration: "约14分钟",
    nodes: [
      { id:"N01", type:"start",   label:"序章·霓虹夜幕",  scene:"霓虹街道",   chars:["艾拉"],          status:"done" },
      { id:"N02", type:"scene",   label:"任务简报",       scene:"地下指挥室", chars:["艾拉","线人"],    status:"done" },
      { id:"N03", type:"choice",  label:"进入路线？",      scene:"建筑外围",   chars:["艾拉"],          status:"done" },
      { id:"N04", type:"scene",   label:"暗夜通道",       scene:"暗夜通道",   chars:["艾拉"],          status:"done" },
      { id:"N05", type:"scene",   label:"换装渗透",       scene:"更衣室",     chars:["艾拉"],          status:"done" },
      { id:"N06", type:"qte",     label:"警卫逼近",       scene:"走廊",       chars:["艾拉","警卫"],   status:"done" },
      { id:"N07", type:"cond",    label:"潜行判定",       scene:"走廊",       chars:["艾拉"],          status:"warn", warn:"缺少失败反馈" },
      { id:"N08", type:"scene",   label:"数据到手",       scene:"服务器室",   chars:["艾拉"],          status:"done" },
      { id:"N09", type:"scene",   label:"身份暴露",       scene:"走廊",       chars:["艾拉","反派"],   status:"done" },
      { id:"N10", type:"end",     label:"结局A 幽灵归来", scene:"撤退出口",   chars:["艾拉"],          status:"done" },
      { id:"N11", type:"end",     label:"结局B 今夜失败", scene:"审讯室",     chars:["艾拉","反派"],   status:"done" },
    ]
  }
];

const ASSETS = [
  { type:"scene_bg", label:"场景背景图", icon: Film,   total:9, done:8, color: S.primary },
  { type:"char",     label:"角色立绘",   icon: Users,  total:12, done:6, color: "#8B5CF6" },
  { type:"bgm",      label:"背景音乐",   icon: Music,  total:9,  done:0, color: S.error },
  { type:"voice",    label:"配音",       icon: Mic2,   total:9,  done:0, color: S.error },
  { type:"video",    label:"视频片段",   icon: Video,  total:9,  done:1, color: S.warning },
  { type:"ui",       label:"游戏UI",     icon: Layers, total:5,  done:0, color: "#6366F1" },
];

const CHARS = [
  { name:"艾拉",     role:"女主角·侦探",  nodes:9,  status:"done",  avatar:"艾" },
  { name:"线人",     role:"关键NPC",      nodes:4,  status:"done",  avatar:"线" },
  { name:"反派主管", role:"反派",         nodes:3,  status:"warn",  avatar:"反" },
];

const NODE_TYPE_STYLE: Record<string, { color: string; bg: string; label: string }> = {
  start: { color: "#4F8EF7", bg: "rgba(79,142,247,0.1)",  label: "起始" },
  scene: { color: S.text3,   bg: S.s2,                    label: "场景" },
  choice:{ color: "#00C8BE", bg: "rgba(0,200,190,0.1)",   label: "选择" },
  qte:   { color: "#F59E0B", bg: "rgba(245,158,11,0.1)",  label: "QTE" },
  cond:  { color: "#F97316", bg: "rgba(249,115,22,0.1)",  label: "条件" },
  end:   { color: "#F5A623", bg: "rgba(245,166,35,0.1)",  label: "结局" },
};

export default function OverviewTab() {
  const [expandedCh, setExpandedCh] = useState<number[]>([1]);
  const [selectedNode, setSelectedNode] = useState<string | null>("N07");

  const toggleChapter = (id: number) =>
    setExpandedCh(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const allNodes = CHAPTERS.flatMap(c => c.nodes);
  const selNode = allNodes.find(n => n.id === selectedNode);

  return (
    <div className="flex h-full overflow-hidden" style={{ background: S.bg }}>

      {/* 左侧：剧本结构树 */}
      <div className="w-[260px] shrink-0 flex flex-col border-r overflow-y-auto"
        style={{ borderColor: S.border, background: S.card }}>

        {/* 项目头部数据 */}
        <div className="px-3 py-3 border-b shrink-0" style={{ borderColor: S.border, background: S.s2 }}>
          <p className="text-[10px] font-bold mb-2" style={{ color: S.text }}>幽灵协议</p>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { label:"节点", val:"11", icon: GitBranch },
              { label:"分支", val:"2",  icon: BookOpen },
              { label:"结局", val:"2",  icon: Film },
            ].map(item => (
              <div key={item.label} className="rounded-lg p-1.5 text-center"
                style={{ background: S.card, border:`1px solid ${S.border}` }}>
                <p className="text-[13px] font-bold" style={{ color: S.primary }}>{item.val}</p>
                <p className="text-[8px]" style={{ color: S.text3 }}>{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 章节列表 */}
        <div className="flex-1 overflow-y-auto">
          {CHAPTERS.map(ch => (
            <div key={ch.id}>
              <button
                onClick={() => toggleChapter(ch.id)}
                className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-opacity-60"
                style={{ background: expandedCh.includes(ch.id) ? S.s2 : "transparent", borderBottom:`1px solid ${S.border}` }}>
                <div className="flex items-center gap-2 min-w-0">
                  <ChevronDown size={11} style={{
                    color: S.text3,
                    transform: expandedCh.includes(ch.id) ? "rotate(0deg)" : "rotate(-90deg)",
                    transition: "transform 0.2s"
                  }} />
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold truncate" style={{ color: S.text }}>{ch.title}</p>
                    <p className="text-[8px]" style={{ color: S.text3 }}>
                      {ch.nodeCount}节点 · {ch.branchCount}分支 · {ch.duration}
                    </p>
                  </div>
                </div>
              </button>

              {expandedCh.includes(ch.id) && (
                <div className="pb-1">
                  {ch.nodes.map(node => {
                    const cfg = NODE_TYPE_STYLE[node.type] ?? NODE_TYPE_STYLE.scene;
                    const isSelected = selectedNode === node.id;
                    return (
                      <motion.button key={node.id} whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedNode(node.id)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-left"
                        style={{
                          background: isSelected ? `${S.primary}08` : "transparent",
                          borderLeft: isSelected ? `2px solid ${S.primary}` : "2px solid transparent",
                        }}>
                        {/* 节点类型徽章 */}
                        <span className="text-[7px] font-bold px-1 py-0.5 rounded shrink-0"
                          style={{ background: cfg.bg, color: cfg.color }}>
                          {cfg.label}
                        </span>
                        <span className="text-[9px] font-mono shrink-0" style={{ color: S.text3 }}>
                          {node.id}
                        </span>
                        <span className="text-[10px] truncate flex-1" style={{ color: S.text }}>
                          {node.label}
                        </span>
                        {node.status === "warn" && (
                          <AlertTriangle size={10} style={{ color: S.warning, flexShrink: 0 }} />
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 角色快速列表 */}
        <div className="shrink-0 border-t px-3 py-2" style={{ borderColor: S.border }}>
          <p className="text-[8px] uppercase tracking-wider mb-1.5" style={{ color: S.text3 }}>角色</p>
          {CHARS.map(c => (
            <div key={c.name} className="flex items-center gap-2 py-1">
              <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold"
                style={{ background: `${S.primary}15`, color: S.primary }}>{c.avatar}</div>
              <div className="flex-1 min-w-0">
                <p className="text-[9px] font-bold truncate" style={{ color: S.text }}>{c.name}</p>
                <p className="text-[8px] truncate" style={{ color: S.text3 }}>{c.role} · {c.nodes}节点</p>
              </div>
              {c.status === "warn" && <AlertTriangle size={10} style={{ color: S.warning }} />}
            </div>
          ))}
        </div>
      </div>

      {/* 中央：节点详情 + 资产状态 */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* 资产完成度横条 */}
        <div className="shrink-0 px-4 py-3 border-b" style={{ borderColor: S.border, background: S.card }}>
          <p className="text-[9px] uppercase tracking-wider mb-2" style={{ color: S.text3 }}>资产完成度</p>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {ASSETS.map(a => {
              const pct = Math.round((a.done / a.total) * 100);
              const Icon = a.icon;
              return (
                <div key={a.type} className="flex-none flex flex-col items-center gap-1 min-w-[56px]">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: `${a.color}12`, border: `1px solid ${a.color}30` }}>
                    <Icon size={15} style={{ color: a.color }} />
                  </div>
                  <p className="text-[8px] text-center" style={{ color: S.text3 }}>{a.label}</p>
                  <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: S.s3 }}>
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, background: pct === 0 ? S.error : pct === 100 ? S.success : a.color }} />
                  </div>
                  <p className="text-[8px] font-mono" style={{ color: pct === 0 ? S.error : S.text3 }}>
                    {a.done}/{a.total}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* 节点详情 / 健康检查 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">

          {/* 选中节点详情 */}
          {selNode && (
            <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${S.border}`, background: S.card }}>
              <div className="px-3 py-2.5 border-b flex items-center justify-between"
                style={{ borderColor: S.border, background: S.s2 }}>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-bold font-mono px-1.5 py-0.5 rounded"
                    style={{ background: `${S.primary}12`, color: S.primary }}>{selNode.id}</span>
                  <span className="text-[11px] font-bold" style={{ color: S.text }}>{selNode.label}</span>
                  {(() => {
                    const cfg = NODE_TYPE_STYLE[selNode.type];
                    return (
                      <span className="text-[8px] px-1.5 py-0.5 rounded font-bold"
                        style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                    );
                  })()}
                </div>
                {selNode.status === "warn" && (
                  <span className="text-[9px] flex items-center gap-1 px-2 py-0.5 rounded-full"
                    style={{ background: `${S.warning}12`, color: S.warning }}>
                    <AlertTriangle size={9} /> {selNode.warn}
                  </span>
                )}
              </div>
              <div className="px-3 py-3 grid grid-cols-2 gap-2">
                <div>
                  <p className="text-[8px] mb-0.5" style={{ color: S.text3 }}>场景</p>
                  <p className="text-[10px] flex items-center gap-1" style={{ color: S.text }}>
                    <MapPin size={9} style={{ color: S.accent }} />{selNode.scene}
                  </p>
                </div>
                <div>
                  <p className="text-[8px] mb-0.5" style={{ color: S.text3 }}>出场角色</p>
                  <p className="text-[10px] flex items-center gap-1" style={{ color: S.text }}>
                    <Users size={9} style={{ color: S.accent }} />{selNode.chars.join("、")}
                  </p>
                </div>
              </div>
              <div className="px-3 pb-3 flex gap-2">
                <Link to="/nodes">
                  <motion.button whileTap={{ scale: 0.97 }}
                    className="px-3 py-1.5 rounded-lg text-[10px] font-bold focus:outline-none"
                    style={{ background: S.primary, color: "#fff" }}>
                    进入节点图编辑
                  </motion.button>
                </Link>
                <Link to="/simulator">
                  <motion.button whileTap={{ scale: 0.97 }}
                    className="px-3 py-1.5 rounded-lg text-[10px] font-bold focus:outline-none"
                    style={{ background: S.s2, border:`1px solid ${S.border}`, color: S.text2 }}>
                    从此节点试玩
                  </motion.button>
                </Link>
              </div>
            </div>
          )}

          {/* 健康检查 */}
          <div className="rounded-xl overflow-hidden" style={{ border:`1px solid ${S.border}`, background: S.card }}>
            <div className="px-3 py-2.5 border-b" style={{ borderColor: S.border, background: S.s2 }}>
              <p className="text-[10px] font-bold" style={{ color: S.text }}>项目健康检查</p>
            </div>
            <div className="divide-y" style={{ borderColor: S.border }}>
              {[
                { ok:true,  text:"主线已连通，入口→结局路径完整",          href: null },
                { ok:true,  text:"两个结局均可从主线到达",                  href: null },
                { ok:false, text:"N07「潜行判定」缺少失败反馈文案",          href:"/nodes" },
                { ok:false, text:"9个节点BGM全部缺失，影响试玩体验",         href:"/assets" },
                { ok:false, text:"游戏内UI尚未配置（用户界面）",             href:"/game-ui" },
              ].map((item, i) => (
                <div key={i}
                  className={`flex items-center justify-between px-3 py-2.5 ${item.href ? "cursor-pointer hover:bg-opacity-50" : ""}`}
                  style={item.href ? { background: "transparent" } : {}}
                  onClick={() => item.href && (window.location.href = item.href)}>
                  <div className="flex items-center gap-2">
                    {item.ok
                      ? <CheckCircle2 size={13} style={{ color: S.success, flexShrink: 0 }} />
                      : <AlertTriangle size={13} style={{ color: item.text.includes("UI") ? "#6366F1" : S.warning, flexShrink: 0 }} />
                    }
                    <span className="text-[10px]" style={{ color: S.text2 }}>{item.text}</span>
                  </div>
                  {item.href && <ChevronRight size={11} style={{ color: S.text3 }} />}
                </div>
              ))}
            </div>
          </div>

          {/* 下一步建议 */}
          <div className="rounded-xl overflow-hidden" style={{ border:`1px solid ${S.border}`, background: S.card }}>
            <div className="px-3 py-2.5 border-b" style={{ borderColor: S.border, background: S.s2 }}>
              <p className="text-[10px] font-bold" style={{ color: S.text }}>下一步建议</p>
            </div>
            <div className="divide-y" style={{ borderColor: S.border }}>
              {[
                { dot: S.error,   text:"补齐9个节点BGM",                href:"/assets" },
                { dot: S.warning, text:"为N07增加失败反馈文案",          href:"/nodes" },
                { dot:"#6366F1",  text:"配置游戏内用户界面（UI设计器）",  href:"/game-ui" },
                { dot: S.primary, text:"为「数据到手」增加道德抉择分支",   href:"/nodes" },
                { dot: S.primary, text:"运行完整路径试玩检查",             href:"/simulator" },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-2.5 cursor-pointer"
                  onClick={() => window.location.href = item.href}>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: item.dot }} />
                    <span className="text-[10px]" style={{ color: S.text2 }}>{item.text}</span>
                  </div>
                  <ChevronRight size={11} style={{ color: S.text3 }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
