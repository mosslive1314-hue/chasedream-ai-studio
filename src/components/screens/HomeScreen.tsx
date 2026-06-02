"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Plus, Play, Edit3, Users, MousePointer, Star,
  Search, Clapperboard, Grid, ChevronDown, Zap
} from "lucide-react";

const S = {
  bg:"#F5F6FA", card:"#FFFFFF", s2:"#F4F6FC",
  border:"#E8EAF2", primary:"#7C6CF5",
  text:"#1A1D2E", text2:"#4A5068", text3:"#8892B0",
  success:"#10B981", warning:"#F59E0B", purple2:"#A78BFA",
};

const PROJECTS = [
  { id:"ghost",    title:"幽灵协议",           genre:"赛博朋克·间谍惊悚",
    desc:"城市的夜幕下，每一秒都是生死抉择",          status:"published",
    chapters:1, nodes:11, branches:2,
    cover:"https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=400&q=60" },
  { id:"nuclear",  title:"可控核聚变已经实现",  genre:"科幻未来",
    desc:"可控核聚变已经实现",                        status:"draft",
    chapters:1, nodes:7, branches:4,
    cover:"https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=400&q=60" },
  { id:"hospital", title:"废旧医院谜案",         genre:"悬疑惊悚",
    desc:"我无意中翻出了一份十年前的医院死亡档案……",   status:"draft",
    chapters:1, nodes:11, branches:6,
    cover:"https://images.unsplash.com/photo-1584432810601-6c7f27d2362b?w=400&q=60" },
];

const STATS = [
  { icon:Play,         label:"总游玩次数", value:"12", note:"↑ 1 部作品", color:S.primary,  bg:"rgba(124,108,245,0.08)" },
  { icon:Users,        label:"独立玩家",   value:"0",  note:"暂无数据",   color:"#00A99D",  bg:"rgba(0,169,157,0.08)" },
  { icon:MousePointer, label:"选择总次数", value:"0",  note:"暂无数据",   color:S.warning,  bg:"rgba(245,158,11,0.08)" },
  { icon:Star,         label:"已发布作品", value:"1",  note:"↗ 正在运营", color:S.purple2,  bg:"rgba(167,139,250,0.08)" },
];

const STATUS_STYLE: Record<string, {label:string;bg:string;color:string}> = {
  published:{ label:"已发布", bg:"rgba(16,185,129,0.12)", color:"#10B981" },
  draft:    { label:"草稿",   bg:"rgba(100,116,139,0.12)", color:"#64748B" },
};

export default function HomeScreen() {
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <div className="min-h-svh" style={{ background:S.bg }}>

      {/* ── 首页专属顶部导航栏（只在创作台首页显示）── */}
      <header className="flex items-center h-11 px-4 gap-1 border-b"
        style={{ background:S.card, borderColor:S.border }}>

        {/* 主导航链接 */}
        <nav className="flex items-center gap-0.5">
          {[
            { label:"发现",     href:"/" },
            { label:"我的资产", href:"/assets" },
            { label:"素材市场", href:"/assets" },
            { label:"能力市场", href:"/overview" },
          ].map(item => (
            <Link key={item.label} href={item.href}>
              <motion.span whileTap={{ scale:0.97 }}
                className="px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer whitespace-nowrap hover:bg-gray-50 transition-colors"
                style={{ color:S.text2 }}>
                {item.label}
              </motion.span>
            </Link>
          ))}
          {/* 更多 */}
          <div className="relative">
            <motion.button whileTap={{ scale:0.97 }}
              onClick={() => setMoreOpen(o=>!o)}
              className="flex items-center gap-0.5 px-2.5 py-1 rounded-lg text-xs font-medium focus:outline-none"
              style={{ color:S.text3 }}>
              开发者设置 <ChevronDown size={10} />
            </motion.button>
            <AnimatePresence>
              {moreOpen && (
                <motion.div initial={{ opacity:0, y:4 }} animate={{ opacity:1, y:0 }}
                  exit={{ opacity:0, y:4 }} transition={{ duration:0.12 }}
                  className="absolute top-full left-0 mt-1 rounded-xl py-1 min-w-[120px] z-50"
                  style={{ background:S.card, border:`1px solid ${S.border}`, boxShadow:"0 4px 16px rgba(0,0,0,0.1)" }}>
                  <Link href="/settings">
                    <div className="px-3 py-1.5 text-xs cursor-pointer hover:bg-gray-50"
                      style={{ color:S.text2 }} onClick={()=>setMoreOpen(false)}>
                      开发者设置
                    </div>
                  </Link>
                  <Link href="/settings">
                    <div className="px-3 py-1.5 text-xs cursor-pointer hover:bg-gray-50"
                      style={{ color:S.text2 }} onClick={()=>setMoreOpen(false)}>
                      AI Key 管理
                    </div>
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </nav>

        {/* Key 状态徽章 */}
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg ml-1"
          style={{ background:"rgba(124,108,245,0.1)", color:S.primary, border:`1px solid rgba(124,108,245,0.2)` }}>
          Key已配置
        </span>

        <div className="flex-1" />

        {/* 右侧：用户+操作 */}
        <div className="flex items-center gap-1.5">
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
            style={{ background:S.s2, border:`1px solid ${S.border}`, minWidth:130 }}>
            <Search size={12} style={{ color:S.text3 }} />
            <input placeholder="搜索项目…" className="text-xs bg-transparent focus:outline-none w-full"
              style={{ color:S.text }} />
          </div>
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg cursor-pointer"
            style={{ background:S.s2, border:`1px solid ${S.border}` }}>
            <div className="w-5 h-5 rounded-full flex items-center justify-center"
              style={{ background:S.primary }}>
              <span className="text-[8px] text-white font-bold">M</span>
            </div>
            <span className="text-[10px] font-medium" style={{ color:S.text2 }}>maiyiming</span>
          </div>
          <Link href="/parse">
            <motion.button whileTap={{ scale:0.97 }}
              className="hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium focus:outline-none"
              style={{ background:S.s2, border:`1px solid ${S.border}`, color:S.text2 }}>
              <Clapperboard size={12} /> 短剧改编
            </motion.button>
          </Link>
          <Link href="/parse">
            <motion.button whileTap={{ scale:0.97 }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-white focus:outline-none"
              style={{ background:S.primary }}>
              <Plus size={12} /> 新建影游
            </motion.button>
          </Link>
        </div>
      </header>

      {/* ── 主内容 ── */}
      <main className="px-6 py-6 max-w-6xl mx-auto space-y-6">

        {/* 标题 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color:S.text }}>创作台</h1>
            <p className="text-xs mt-0.5" style={{ color:S.text3 }}>{PROJECTS.length} 个项目</p>
          </div>
          {/* 快捷入口：剧本解构 */}
          <Link href="/parse">
            <motion.button whileTap={{ scale:0.97 }}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold focus:outline-none"
              style={{ background:`${S.primary}10`, border:`1px solid ${S.primary}25`, color:S.primary }}>
              <Zap size={12} /> 剧本解构 · AI流水线
            </motion.button>
          </Link>
        </div>

        {/* 数据概览 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {STATS.map((stat,i) => (
            <motion.div key={i} initial={{ opacity:0, y:4 }} animate={{ opacity:1, y:0 }}
              transition={{ delay:i*0.05 }}
              className="p-4 rounded-2xl" style={{ background:S.card, border:`1px solid ${S.border}` }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-2"
                style={{ background:stat.bg }}>
                <stat.icon size={15} style={{ color:stat.color }} />
              </div>
              <p className="text-xl font-bold font-mono" style={{ color:S.text }}>{stat.value}</p>
              <p className="text-[10px] mt-0.5" style={{ color:S.text3 }}>{stat.label}</p>
              <p className="text-[9px] mt-0.5" style={{ color:stat.color }}>{stat.note}</p>
            </motion.div>
          ))}
        </div>

        {/* 作品表现 */}
        <div className="p-4 rounded-2xl" style={{ background:S.card, border:`1px solid ${S.border}` }}>
          <h2 className="text-sm font-bold mb-2" style={{ color:S.text }}>作品表现</h2>
          <div className="flex items-center justify-between py-1.5"
            style={{ borderBottom:`1px solid ${S.border}` }}>
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono" style={{ color:S.text3 }}>1</span>
              <span className="text-xs font-medium" style={{ color:S.text }}>幽灵协议</span>
            </div>
            <span className="text-xs font-mono font-bold" style={{ color:S.primary }}>11 次</span>
          </div>
        </div>

        {/* 项目网格 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* 新建卡片 */}
          <Link href="/parse">
            <motion.div whileTap={{ scale:0.98 }}
              className="rounded-2xl flex flex-col items-center justify-center cursor-pointer"
              style={{ background:S.card, border:`1.5px dashed ${S.border}`, minHeight:260 }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-2"
                style={{ background:`${S.primary}12` }}>
                <Plus size={20} style={{ color:S.primary }} />
              </div>
              <span className="text-sm font-medium" style={{ color:S.text2 }}>新建影游</span>
            </motion.div>
          </Link>

          {/* 项目卡片 */}
          {PROJECTS.map((p,i) => {
            const st = STATUS_STYLE[p.status] ?? STATUS_STYLE.draft;
            return (
              <motion.div key={p.id} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
                transition={{ delay:i*0.06 }}
                className="rounded-2xl overflow-hidden"
                style={{ background:S.card, border:`1px solid ${S.border}` }}>
                {/* 封面 */}
                <div className="relative overflow-hidden" style={{ height:160 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.cover} alt={p.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0" style={{ background:"linear-gradient(to top,rgba(0,0,0,0.4),transparent)" }} />
                  <span className="absolute top-2 left-2 text-[9px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background:st.bg, color:st.color }}>
                    {st.label}
                  </span>
                </div>
                {/* 信息 */}
                <div className="p-3 space-y-2">
                  <h3 className="text-sm font-bold truncate" style={{ color:S.text }}>{p.title}</h3>
                  <p className="text-[10px]" style={{ color:S.text3 }}>{p.genre}</p>
                  <p className="text-[10px] line-clamp-2" style={{ color:S.text3 }}>{p.desc}</p>
                  <p className="text-[9px] font-mono" style={{ color:S.text3 }}>
                    {p.chapters}章 · {p.nodes}节点 · {p.branches}分支
                  </p>
                  <div className="flex gap-2">
                    <Link href="/nodes" className="flex-1">
                      <motion.button whileTap={{ scale:0.97 }}
                        className="w-full flex items-center justify-center gap-1 py-1.5 rounded-xl text-xs font-bold text-white focus:outline-none"
                        style={{ background:S.primary }}>
                        <Edit3 size={11} /> 编辑
                      </motion.button>
                    </Link>
                    {p.status === "published" && (
                      <Link href="/simulator">
                        <motion.button whileTap={{ scale:0.97 }}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium focus:outline-none"
                          style={{ background:S.s2, border:`1px solid ${S.border}`, color:S.text2 }}>
                          <Play size={11} /> 试玩
                        </motion.button>
                      </Link>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
