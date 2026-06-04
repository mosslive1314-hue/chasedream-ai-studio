"use client";
import { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye, Sparkles, Save, Rocket, AlertTriangle,
  CheckCircle2, ChevronDown, ChevronUp, Plus,
  ZoomIn, ZoomOut, Maximize2, AlignLeft,
  ExternalLink, Play, FileText, Flame, Edit2,
  User, Package, Music, GitBranch, X, Loader2,
  Monitor, Star, Download, Wand2, Image as ImageIcon,
  Layout, Eye as EyeIcon, Search,
  Check, Trash2, Copy, RotateCcw, Settings, Link2, MapPin, MessageSquare,
  Shield, Layers, Film, HelpCircle, Zap, Target, Trophy, BarChart3,
  Users, Clock, Lock, Palette
} from "lucide-react";
import Link from "next/link";
import { type UITemplate, type UITemplateCategory, type UIComponentDef, type NarrativeIntent, type CharacterTimeline, type CharacterStatus, type CrossCharacterEffect, type NarrativeState, type StateCategory } from "@/lib/studio-data";
import { useNarrativeStore, useUIStore, useProjectStore } from "@/store";
import { usePathname } from "next/navigation";
import { UpstreamReadiness } from "@/components/ui/UpstreamReadiness";
import { calculateTensionCurve, getTensionStats, TENSION_COLORS } from "@/lib/tension-curve";
import ContextualActions from "@/components/ui/ContextualActions";
import { ThemeSystem } from "@/components/ui/ThemeSystem";

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

// ── 顶部 Tab 定义（保留独特功能标签页，移除与 /script /assets 重叠项）──────────
type TabId = "canvas"|"heatmap"|"ui"|"variables"|"timeline";
const TABS: { id:TabId; label:string; icon:any }[] = [
  { id:"canvas",    label:"画布",   icon:AlignLeft },
  { id:"heatmap",   label:"热力图", icon:Flame     },
  { id:"ui",        label:"用户界面", icon:Monitor },
  { id:"variables", label:"变量",   icon:BarChart3 },
  { id:"timeline",  label:"角色系统", icon:Users     },
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


// ── 热力图 Tab ────────────────────────────────────────────────────────────
function HeatmapContent() {
  const [viewMode, setViewMode] = useState<"overview"|"detail">("overview");
  const heatmapData = useNarrativeStore(state => state.heatmapData);
  const storyNodes = useNarrativeStore(state => state.storyNodes);
  const hmMap = Object.fromEntries(heatmapData.map(h => [h.nodeId, h]));
  
  const heatColor = (level: string) => {
    switch(level) {
      case 'hot':  return { bg: 'rgba(239,68,68,0.12)', color: '#EF4444', label: '🔥 热门' };
      case 'warm': return { bg: 'rgba(245,158,11,0.12)', color: '#F59E0B', label: '☀️ 活跃' };
      case 'cool': return { bg: 'rgba(59,130,246,0.12)', color: '#3B82F6', label: '💧 一般' };
      case 'cold': return { bg: 'rgba(107,114,128,0.12)', color: '#6B7280', label: '❄️ 冷门' };
      default: return { bg: S.s2, color: S.text3, label: '—' };
    }
  };

  // 汇总统计
  const totalPlays = heatmapData.reduce((s,h) => s+h.playCount, 0);
  const avgDropOff = Math.round(heatmapData.reduce((s,h) => s+h.dropOffRate, 0) / heatmapData.length);
  const hotNodes = heatmapData.filter(h => h.heatLevel === 'hot');
  const coldNodes = heatmapData.filter(h => h.heatLevel === 'cold' || h.heatLevel === 'cool');
  const highestDrop = [...heatmapData].sort((a,b) => b.dropOffRate - a.dropOffRate)[0];

  const choiceNode = storyNodes.find(n => n.type === 'choice');
  const choiceHm = choiceNode ? hmMap[choiceNode.id] : null;

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ background: S.bg }}>
      {/* 视图切换 */}
      <div className="flex items-center gap-2 mb-2">
        <div className="flex rounded-lg overflow-hidden" style={{ border:`1px solid ${S.border}` }}>
          {(["overview","detail"] as const).map(m => (
            <motion.button key={m} whileTap={{ scale:0.95 }}
              onClick={() => setViewMode(m)}
              className="px-3 py-1.5 text-[10px] font-bold focus:outline-none"
              style={{
                background: viewMode===m ? S.primary : S.card,
                color: viewMode===m ? '#fff' : S.text2,
              }}>
              {m === 'overview' ? '📊 总览' : '📋 详细'}
            </motion.button>
          ))}
        </div>
        <span className="text-[9px] ml-auto" style={{ color:S.text3 }}>基于 234 次模拟游玩数据</span>
      </div>

      {/* 总览模式 */}
      {viewMode === 'overview' && <>
        {/* 汇总卡片 */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label:'总游玩次数', value:totalPlays, icon:'🎮', color:S.primary },
            { label:'平均流失率', value:`${avgDropOff}%`, icon:'📉', color:S.warning },
            { label:'热门节点', value:hotNodes.length, icon:'🔥', color:S.error },
            { label:'冷门节点', value:coldNodes.length, icon:'❄️', color:'#6B7280' },
          ].map(s => (
            <div key={s.label} className="p-3 rounded-xl text-center" style={{ background:S.card, border:`1px solid ${S.border}` }}>
              <div className="text-lg mb-1">{s.icon}</div>
              <div className="text-sm font-black" style={{ color:s.color }}>{s.value}</div>
              <div className="text-[8px] mt-0.5" style={{ color:S.text3 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* 节点到达率热力图 */}
        <div className="p-4 rounded-xl" style={{ background:S.card, border:`1px solid ${S.border}` }}>
          <h3 className="text-xs font-bold mb-3" style={{ color:S.text }}>节点到达率</h3>
          <div className="space-y-2">
            {storyNodes.map(node => {
              const hm = hmMap[node.id];
              if (!hm) return null;
              const hc = heatColor(hm.heatLevel);
              return (
                <div key={node.id} className="flex items-center gap-2">
                  <span className="text-[9px] w-6 font-mono shrink-0" style={{ color:S.text3 }}>{node.id}</span>
                  <span className="text-[10px] w-28 truncate shrink-0" style={{ color:S.text2 }}>{node.label}</span>
                  <div className="flex-1 h-4 rounded-full overflow-hidden relative" style={{ background:S.s2 }}>
                    <motion.div initial={{ width:0 }} animate={{ width:`${hm.visitRate}%` }}
                      transition={{ duration:0.8, delay: storyNodes.indexOf(node) * 0.05 }}
                      className="h-full rounded-full" style={{ background: hc.color, opacity:0.7 }} />
                    <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold"
                      style={{ color: hm.visitRate > 50 ? '#fff' : S.text2 }}>
                      {hm.visitRate}%
                    </span>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.5 rounded shrink-0" style={{ background:hc.bg, color:hc.color }}>{hm.playCount}次</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 流失预警 */}
        <div className="p-4 rounded-xl" style={{ background:`rgba(239,68,68,0.04)`, border:`1px solid rgba(239,68,68,0.15)` }}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm">⚠️</span>
            <h3 className="text-xs font-bold" style={{ color:S.error }}>流失预警</h3>
          </div>
          <p className="text-[10px] mb-3" style={{ color:S.text2 }}>
            「{highestDrop?.nodeId} {storyNodes.find(n=>n.id===highestDrop?.nodeId)?.label}」节点流失率最高（{highestDrop?.dropOffRate}%），建议检查该节点难度和文案吸引力。
          </p>
          <div className="space-y-1.5">
            {[...heatmapData].sort((a,b) => b.dropOffRate - a.dropOffRate).slice(0, 3).map(h => {
              const node = storyNodes.find(n => n.id === h.nodeId);
              return (
                <div key={h.nodeId} className="flex items-center gap-2">
                  <span className="text-[9px] font-mono w-6" style={{ color:S.error }}>{h.nodeId}</span>
                  <span className="text-[10px] flex-1 truncate" style={{ color:S.text2 }}>{node?.label}</span>
                  <span className="text-[10px] font-bold" style={{ color:S.error }}>{h.dropOffRate}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </>}

      {/* 详细模式 */}
      {viewMode === 'detail' && (
        <div className="space-y-2">
          {storyNodes.map(node => {
            const hm = hmMap[node.id];
            if (!hm) return null;
            const hc = heatColor(hm.heatLevel);
            return (
              <motion.div key={node.id} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
                className="p-3 rounded-xl" style={{ background:S.card, border:`1px solid ${S.border}` }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded" style={{ background:`${S.primary}12`, color:S.primary }}>{node.id}</span>
                  <span className="text-xs font-bold" style={{ color:S.text }}>{node.label}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded ml-auto" style={{ background:hc.bg, color:hc.color }}>{hc.label}</span>
                </div>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {[
                    { label:'到达率', value:`${hm.visitRate}%` },
                    { label:'停留时间', value:`${hm.avgTimeSpent}秒` },
                    { label:'流失率', value:`${hm.dropOffRate}%` },
                    { label:'完成率', value:`${hm.completionRate}%` },
                  ].map(m => (
                    <div key={m.label} className="text-center p-1.5 rounded-lg" style={{ background:S.s2 }}>
                      <div className="text-[10px] font-bold" style={{ color:S.text }}>{m.value}</div>
                      <div className="text-[8px]" style={{ color:S.text3 }}>{m.label}</div>
                    </div>
                  ))}
                </div>
                {hm.choiceDistribution && (
                  <div className="mt-1">
                    <span className="text-[9px]" style={{ color:S.text3 }}>选择分布：</span>
                    <div className="flex gap-1 mt-0.5">
                      {hm.choiceDistribution.map((pct, i) => (
                        <div key={i} className="flex items-center gap-1">
                          <span className="text-[9px]" style={{ color:S.text3 }}>{String.fromCharCode(65+i)}</span>
                          <div className="w-16 h-2 rounded-full overflow-hidden" style={{ background:S.s2 }}>
                            <div className="h-full rounded-full" style={{ width:`${pct}%`, background: i===0 ? S.primary : S.accent }} />
                          </div>
                          <span className="text-[9px] font-bold" style={{ color:S.text2 }}>{pct}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── 诊断视图类型 ──────────────────────────────────────────────────────────────
type DiagView = 'all' | 'mainline' | 'branch' | 'ending' | 'problem' | 'variable' | 'character' | 'dependency';

// ── 主节点画布（对齐原站 React Flow 风格）──────────────────────────────────
function CanvasContent({ sel, setSel, nodeFilter, diagView }: { sel:string|null; setSel:(id:string|null)=>void; nodeFilter:string; diagView:DiagView }) {
  const storyNodes = useNarrativeStore(state => state.storyNodes);
  const nodeEdges = useNarrativeStore(state => state.nodeEdges);
  const variables = useNarrativeStore(state => state.variables);
  const characters = useNarrativeStore(state => state.characters);
  const scenes = useNarrativeStore(state => state.scenes);
  const narrativeIntents = useNarrativeStore(state => state.narrativeIntents);
  const subgraphLocks = useNarrativeStore(state => state.subgraphLocks);
  const chapterVariants = useNarrativeStore(state => state.chapterVariants);
  const narrativeStates = useNarrativeStore(state => state.narrativeStates);
  const addNode = useNarrativeStore(state => state.addNode);
  const removeNode = useNarrativeStore(state => state.removeNode);
  const updateNode = useNarrativeStore(state => state.updateNode);
  const addEdge = useNarrativeStore(state => state.addEdge);
  const removeEdge = useNarrativeStore(state => state.removeEdge);

  const filteredNodes = storyNodes.filter(node => {
    if (nodeFilter === "all") return true;
    if (nodeFilter === "error") return (node as any).hasError;
    if (nodeFilter === "ending") return node.type === "ending_good" || node.type === "ending_bad";
    return node.type === nodeFilter;
  });

  // 诊断视图高亮节点计算
  const highlightedNodeIds = ((): Set<string> => {
    if (diagView === 'all') return new Set(storyNodes.map(n => n.id));
    switch (diagView) {
      case 'mainline':
        return new Set(['N01','N02','N03','N04','N06','N07','N08','N10']);
      case 'branch': {
        const ids = new Set(['N03','N07']);
        nodeEdges.filter(e => e.from === 'N03' || e.from === 'N07').forEach(e => ids.add(e.to));
        return ids;
      }
      case 'ending': {
        const ids = new Set(['N08','N09','N10','N11']);
        nodeEdges.filter(e => e.to === 'N10' || e.to === 'N11').forEach(e => ids.add(e.from));
        return ids;
      }
      case 'problem':
        return new Set(storyNodes.filter(n => (n as any).hasError).map(n => n.id));
      case 'variable': {
        const ids = new Set<string>();
        variables.forEach(v => { v.modifiedBy.forEach(id => ids.add(id)); v.readBy.forEach(id => ids.add(id)); });
        return ids;
      }
      case 'character': {
        const ids = new Set<string>();
        characters.forEach(c => c.appearNodes.forEach(id => ids.add(id)));
        return ids;
      }
      case 'dependency': {
        const ids = new Set<string>();
        narrativeStates.forEach(ns => {
          if (ns.dependsOn && ns.dependsOn.length > 0) {
            ids.add(ns.id);
            ns.dependsOn.forEach(depId => ids.add(depId));
          }
        });
        // Also add nodes that modify states with dependencies
        narrativeStates.forEach(ns => {
          if (ns.dependsOn && ns.dependsOn.length > 0) {
            variables.forEach(v => {
              if (v.name === ns.name || v.id === ns.id) {
                v.modifiedBy.forEach(id => ids.add(id));
                v.readBy.forEach(id => ids.add(id));
              }
            });
          }
        });
        return ids;
      }
      default:
        return new Set(storyNodes.map(n => n.id));
    }
  })();

  const getNodeLabel = (id: string) => storyNodes.find(n => n.id === id)?.label || id;

  // ── Local canvas editing state ──
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const [dragState, setDragState] = useState<{ nodeId: string; offsetX: number; offsetY: number } | null>(null);
  const [connectFrom, setConnectFrom] = useState<string | null>(null);
  const [connectMouse, setConnectMouse] = useState<{ x: number; y: number } | null>(null);
  const [detailPanelOpen, setDetailPanelOpen] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragMoveRef = useRef<((e: MouseEvent) => void) | null>(null);
  const dragEndRef = useRef<((e: MouseEvent) => void) | null>(null);
  const connectMoveRef = useRef<((e: MouseEvent) => void) | null>(null);
  const connectEndRef = useRef<((e: MouseEvent) => void) | null>(null);

  const NODE_TYPE_LABELS: Record<string, string> = {
    scene: "新场景", choice: "新选择", condition: "新条件",
    qte: "新QTE", ending_good: "新好结局", ending_bad: "新坏结局",
  };

  const getCanvasPos = (clientX: number, clientY: number) => {
    const inner = canvasRef.current?.querySelector("[data-canvas-inner]") as HTMLElement | null;
    if (!inner) return { x: 0, y: 0 };
    const rect = inner.getBoundingClientRect();
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const handleCreateNode = (type: string) => {
    const containerEl = canvasRef.current;
    const centerX = containerEl ? containerEl.scrollLeft + containerEl.clientWidth / 2 : 450;
    const centerY = containerEl ? containerEl.scrollTop + containerEl.clientHeight / 2 : 350;
    const inner = containerEl?.querySelector("[data-canvas-inner]") as HTMLElement | null;
    const rect = inner?.getBoundingClientRect();
    const containerRect = containerEl?.getBoundingClientRect();
    const offsetX = rect && containerRect ? rect.left - containerRect.left : 0;
    const offsetY = rect && containerRect ? rect.top - containerRect.top : 0;
    const newNode = {
      id: `N${String(Date.now()).slice(-4)}`,
      label: NODE_TYPE_LABELS[type] || "新节点",
      type: type as any,
      x: centerX - offsetX,
      y: centerY - offsetY,
    };
    addNode(newNode);
    setSel(newNode.id);
    setCreateMenuOpen(false);
  };

  const handleDeleteNode = (id: string) => {
    removeNode(id);
    if (sel === id) { setSel(null); setDetailPanelOpen(false); }
  };

  const handleStartDrag = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    e.preventDefault();
    const pos = getCanvasPos(e.clientX, e.clientY);
    const node = storyNodes.find(n => n.id === nodeId);
    if (!node) return;
    setDragState({ nodeId, offsetX: pos.x - node.x, offsetY: pos.y - node.y });
  };

  const handleStartConnect = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    e.preventDefault();
    setConnectFrom(nodeId);
    const pos = getCanvasPos(e.clientX, e.clientY);
    setConnectMouse(pos);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (dragState && dragMoveRef.current) dragMoveRef.current(e);
      if (connectFrom && connectMoveRef.current) connectMoveRef.current(e);
    };
    const handleMouseUp = (e: MouseEvent) => {
      if (dragState && dragEndRef.current) dragEndRef.current(e);
      if (connectFrom && connectEndRef.current) connectEndRef.current(e);
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragState, connectFrom]);

  dragMoveRef.current = (e: MouseEvent) => {
    if (!dragState) return;
    const pos = getCanvasPos(e.clientX, e.clientY);
    updateNode(dragState.nodeId, { x: pos.x - dragState.offsetX, y: pos.y - dragState.offsetY });
  };
  dragEndRef.current = () => { setDragState(null); };
  connectMoveRef.current = (e: MouseEvent) => {
    const pos = getCanvasPos(e.clientX, e.clientY);
    setConnectMouse(pos);
  };
  connectEndRef.current = (e: MouseEvent) => {
    const pos = getCanvasPos(e.clientX, e.clientY);
    const target = storyNodes.find(n => {
      if (n.id === connectFrom) return false;
      return Math.abs(n.x - pos.x) < 70 && Math.abs(n.y - pos.y) < 30;
    });
    if (target) {
      addEdge({ from: connectFrom!, to: target.id, edgeType: "causal" });
    }
    setConnectFrom(null);
    setConnectMouse(null);
  };

  const selectedNode = storyNodes.find(n => n.id === sel);
  const selectedEdges = sel ? nodeEdges.filter(e => e.from === sel || e.to === sel) : [];

  // Derive ending nodes and their paths dynamically from the story graph
  const endingPaths = useMemo(() => {
    return storyNodes
      .filter(n => n.type.startsWith('ending'))
      .map(node => {
        const incoming = nodeEdges.filter(e => e.to === node.id);
        const parentNode = incoming.length > 0 ? storyNodes.find(n => n.id === incoming[0].from) : null;
        const isGood = node.type === 'ending_good';
        return {
          node,
          isGood,
          pathLabel: parentNode ? `${parentNode.id} ${parentNode.label} → ${node.id}` : `→ ${node.id}`,
          conditionLabel: isGood ? '成功路径' : '失败路径',
        };
      });
  }, [storyNodes, nodeEdges]);

  return (
    <div ref={canvasRef} className="relative w-full h-full overflow-auto"
      onClick={() => { setSel(null); setDetailPanelOpen(false); }}
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

      {/* 诊断信息面板 */}
      {diagView !== 'all' && (
        <div className="absolute top-3 left-3 z-20 w-[260px] p-3 rounded-xl"
          style={{ background: S.card, border: `1px solid ${S.border}`, boxShadow: "0 2px 12px rgba(0,0,0,0.08)", maxHeight: 220, overflowY: 'auto' }}>
          <p className="text-[10px] font-bold mb-2" style={{ color: S.primary }}>
            {diagView === 'mainline' && '📍 主线路径'}
            {diagView === 'branch' && '🔀 分支视图'}
            {diagView === 'ending' && '🏁 结局视图'}
            {diagView === 'problem' && '⚠️ 问题视图'}
            {diagView === 'variable' && '📊 变量视图'}
            {diagView === 'character' && '👤 角色视图'}
            {diagView === 'dependency' && '🔗 依赖视图'}
          </p>
          {diagView === 'mainline' && (
            <div className="space-y-1">
              {['N01','N02','N03','N04','N06','N07','N08','N10'].map((id, i) => (
                <div key={id} className="flex items-center gap-1.5">
                  <span className="text-[8px] font-mono w-4 text-right" style={{ color: S.text3 }}>{i+1}</span>
                  <span className="text-[9px] font-mono px-1 py-0.5 rounded" style={{ background: `${S.primary}10`, color: S.primary }}>{id}</span>
                  <span className="text-[9px]" style={{ color: S.text2 }}>{getNodeLabel(id)}</span>
                </div>
              ))}
              <div className="mt-1 pt-1" style={{ borderTop: `1px solid ${S.border}` }}>
                <span className="text-[8px]" style={{ color: S.success }}>✓ 主线 8 节点连通正常</span>
              </div>
            </div>
          )}
          {diagView === 'branch' && (
            <div className="space-y-1.5">
              {[{ id: 'N03', options: ['N04 暗夜通道', 'N05 换装渗透'] }, { id: 'N07', options: ['N08 数据到手 (成功)', 'N09 身份暴露 (失败)'] }].map(bp => (
                <div key={bp.id} className="p-1.5 rounded-lg" style={{ background: S.s2 }}>
                  <span className="text-[9px] font-bold" style={{ color: S.text }}>
                    {bp.id} {getNodeLabel(bp.id)}
                  </span>
                  <div className="mt-0.5 space-y-0.5">
                    {bp.options.map((opt, i) => (
                      <div key={i} className="text-[8px] flex items-center gap-1" style={{ color: S.text3 }}>
                        <span style={{ color: S.warning }}>→</span> {opt}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          {diagView === 'ending' && (
            <div className="space-y-1.5">
              {endingPaths.map(ep => (
                <div key={ep.node.id} className="p-1.5 rounded-lg"
                  style={{
                    background: ep.isGood ? `${S.success}08` : `${S.error}08`,
                    border: `1px solid ${ep.isGood ? `${S.success}20` : `${S.error}20`}`,
                  }}>
                  <span className="text-[9px] font-bold" style={{ color: ep.isGood ? S.success : S.error }}>
                    {ep.node.id} {ep.node.label} {ep.isGood ? '(好)' : '(坏)'}
                  </span>
                  <p className="text-[8px] mt-0.5" style={{ color: S.text3 }}>路径: {ep.pathLabel}</p>
                  <p className="text-[8px]" style={{ color: S.text3 }}>条件: {ep.conditionLabel}</p>
                </div>
              ))}
              {endingPaths.length === 0 && (
                <span className="text-[9px]" style={{ color: S.text3 }}>暂无结局节点</span>
              )}
            </div>
          )}
          {diagView === 'problem' && (
            <div className="space-y-1.5">
              {storyNodes.filter(n => (n as any).hasError).map(node => (
                <div key={node.id} className="p-1.5 rounded-lg" style={{ background: `${S.error}08`, border: `1px solid ${S.error}20` }}>
                  <div className="flex items-center gap-1">
                    <AlertTriangle size={9} style={{ color: S.error }} />
                    <span className="text-[9px] font-bold" style={{ color: S.error }}>{node.id} {node.label}</span>
                  </div>
                  <p className="text-[8px] mt-0.5" style={{ color: S.text3 }}>{(node as any).errorMsg || '未知错误'}</p>
                </div>
              ))}
              {storyNodes.filter(n => (n as any).hasError).length === 0 && (
                <span className="text-[9px]" style={{ color: S.success }}>✓ 暂无问题节点</span>
              )}
            </div>
          )}
          {diagView === 'variable' && (
            <div className="space-y-1.5">
              {variables.map(v => (
                <div key={v.id} className="p-1.5 rounded-lg" style={{ background: S.s2 }}>
                  <span className="text-[9px] font-bold" style={{ color: S.text }}>{v.label}</span>
                  <div className="text-[8px] mt-0.5" style={{ color: S.text3 }}>
                    修改: {v.modifiedBy.map(id => getNodeLabel(id)).join(', ')}
                  </div>
                  <div className="text-[8px]" style={{ color: S.text3 }}>
                    读取: {v.readBy.map(id => getNodeLabel(id)).join(', ')}
                  </div>
                </div>
              ))}
            </div>
          )}
          {diagView === 'character' && (
            <div className="space-y-1.5">
              {characters.map(c => (
                <div key={c.id} className="p-1.5 rounded-lg" style={{ background: S.s2 }}>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px]">{c.emoji}</span>
                    <span className="text-[9px] font-bold" style={{ color: S.text }}>{c.name}</span>
                    <span className="text-[8px] px-1 py-0.5 rounded" style={{ background: `${c.color}15`, color: c.color }}>{c.role}</span>
                  </div>
                  <div className="text-[8px] mt-0.5 flex flex-wrap gap-0.5">
                    {c.appearNodes.map(id => (
                      <span key={id} className="font-mono px-1 py-0.5 rounded" style={{ background: `${c.color}10`, color: c.color }}>{id}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          {diagView === 'dependency' && (
            <div className="space-y-2">
              {/* Independent states */}
              {narrativeStates.filter(ns => !ns.dependsOn || ns.dependsOn.length === 0).length > 0 && (
                <div>
                  <p className="text-[8px] font-bold mb-1" style={{ color: S.text3 }}>独立状态（无依赖）</p>
                  <div className="flex flex-wrap gap-0.5">
                    {narrativeStates.filter(ns => !ns.dependsOn || ns.dependsOn.length === 0).map(ns => (
                      <span key={ns.id} className="text-[8px] px-1.5 py-0.5 rounded-full" style={{ background: `${S.accent}15`, color: S.accent }}>{ns.name}</span>
                    ))}
                  </div>
                </div>
              )}
              {/* Dependent states */}
              {narrativeStates.filter(ns => ns.dependsOn && ns.dependsOn.length > 0).map(ns => (
                <div key={ns.id} className="p-1.5 rounded-lg" style={{ background: S.s2 }}>
                  <div className="flex items-center gap-1 mb-0.5">
                    <span className="text-[9px] font-bold" style={{ color: S.primary }}>{ns.name}</span>
                    <span className="text-[7px] px-1 py-0.5 rounded" style={{ background: `${S.warning}15`, color: S.warning }}>有依赖</span>
                  </div>
                  <div className="flex items-center gap-0.5 flex-wrap">
                    {ns.dependsOn!.map(depId => {
                      const depState = narrativeStates.find(s => s.id === depId);
                      return (
                        <span key={depId} className="text-[8px] font-mono px-1 py-0.5 rounded" style={{ background: `${S.error}10`, color: S.error }}>
                          ← {depState?.name || depId}
                        </span>
                      );
                    })}
                  </div>
                </div>
              ))}
              {narrativeStates.filter(ns => ns.dependsOn && ns.dependsOn.length > 0).length === 0 && (
                <p className="text-[8px]" style={{ color: S.text3 }}>暂无状态依赖关系</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── 创建节点浮动工具栏 ── */}
      <div className="absolute z-20" style={{ top: diagView !== "all" ? 260 : 12, left: 12 }}>
        <div className="relative">
          <motion.button whileTap={{ scale: 0.93 }}
            onClick={() => setCreateMenuOpen(!createMenuOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[10px] font-bold focus:outline-none"
            style={{ background: S.card, border: `1px solid ${S.border}`, color: S.primary, boxShadow: "0 1px 6px rgba(0,0,0,0.08)" }}>
            <Plus size={12} /> 新建节点
          </motion.button>
          <AnimatePresence>
            {createMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.96 }}
                transition={{ duration: 0.12 }}
                className="absolute top-full left-0 mt-1 w-[140px] rounded-xl overflow-hidden"
                style={{ background: S.card, border: `1px solid ${S.border}`, boxShadow: "0 4px 20px rgba(0,0,0,0.12)", zIndex: 50 }}>
                {Object.entries(NODE_TYPE_LABELS).map(([type, label]) => {
                  const cfg = NODE_TYPE[type] ?? NODE_TYPE.scene;
                  return (
                    <motion.button key={type} whileTap={{ scale: 0.97 }}
                      onClick={() => handleCreateNode(type)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left text-[10px] font-medium focus:outline-none hover:bg-opacity-50"
                      style={{ color: S.text, borderBottom: `1px solid ${S.border}` }}>
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: cfg.color }} />
                      {label}
                    </motion.button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
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
      <div data-canvas-inner style={{ width:900, height:700, position:"relative", margin:"32px auto" }}>
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex:0 }}>
          <defs>
            <marker id="arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <path d="M0,0 L0,6 L6,3 Z" fill={S.primary} opacity="0.5" />
            </marker>
          </defs>
          {nodeEdges.map((edge,i) => {
            const fn = storyNodes.find(n=>n.id===edge.from);
            const tn = storyNodes.find(n=>n.id===edge.to);
            if (!fn||!tn) return null;
            const x1=fn.x, y1=fn.y+42, x2=tn.x, y2=tn.y;
            const cy = (y1+y2)/2;
            return (
              <path key={i}
                d={`M ${x1},${y1} C ${x1},${cy} ${x2},${cy} ${x2},${y2}`}
                fill="none" stroke={S.primary} strokeWidth={1.5}
                opacity={diagView !== 'all' && (!highlightedNodeIds.has(edge.from) || !highlightedNodeIds.has(edge.to)) ? 0.08 : 0.35}
                markerEnd="url(#arr)"
              />
            );
          })}
          {/* Temporary connection line while dragging */}
          {connectFrom && connectMouse && (() => {
            const fromNode = storyNodes.find(n => n.id === connectFrom);
            if (!fromNode) return null;
            return (
              <line x1={fromNode.x} y1={fromNode.y + 42} x2={connectMouse.x} y2={connectMouse.y}
                stroke={S.primary} strokeWidth={2} strokeDasharray="6 3" opacity={0.6} />
            );
          })()}
        </svg>

        {/* ── 选中节点操作栏 ── */}
        <AnimatePresence>
          {sel && selectedNode && (() => {
            const cfg = NODE_TYPE[selectedNode.type] ?? NODE_TYPE.scene;
            return (
              <motion.div
                key="node-action-bar"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.12 }}
                className="absolute z-30 flex items-center gap-1 px-1.5 py-1 rounded-lg"
                style={{
                  left: selectedNode.x - 20,
                  top: selectedNode.y - 32,
                  background: S.card,
                  border: `1px solid ${S.border}`,
                  boxShadow: "0 2px 12px rgba(0,0,0,0.1)",
                }}>
                <span className="text-[8px] font-bold px-1.5 py-0.5 rounded mr-0.5"
                  style={{ background: cfg.bg, color: cfg.color }}>
                  {selectedNode.id}
                </span>
                <motion.button whileTap={{ scale: 0.9 }}
                  onClick={() => setDetailPanelOpen(true)}
                  className="w-5 h-5 rounded flex items-center justify-center focus:outline-none"
                  style={{ background: S.s2, color: S.text3 }}
                  title="编辑节点">
                  <Edit2 size={9} />
                </motion.button>
                <motion.button whileTap={{ scale: 0.9 }}
                  onClick={() => handleDeleteNode(sel)}
                  className="w-5 h-5 rounded flex items-center justify-center focus:outline-none"
                  style={{ background: `${S.error}10`, color: S.error }}
                  title="删除节点">
                  <Trash2 size={9} />
                </motion.button>
              </motion.div>
            );
          })()}
        </AnimatePresence>

        {filteredNodes.map(node => {
          const cfg = NODE_TYPE[node.type] ?? NODE_TYPE.scene;
          const isSelected = sel===node.id;
          const isHighlighted = highlightedNodeIds.has(node.id);
          const isLocked = subgraphLocks.some(lock => lock.lockedNodeIds.includes(node.id));
          const nodeOpacity = isLocked ? 0.35 : (diagView !== 'all' && !isHighlighted) ? 0.3 : 1;
          const isDragging = dragState?.nodeId === node.id;
          return (
            <motion.div key={node.id}
              className="absolute"
              animate={isDragging ? { scale: 1.04 } : { scale: 1 }}
              transition={{ duration: 0.1 }}
              style={{
                left: node.x-70, top: node.y,
                width: 140, zIndex: isSelected || isDragging ? 20 : 10,
                opacity: nodeOpacity,
                cursor: isDragging ? "grabbing" : "grab",
              }}>
              <motion.button
                onMouseDown={(e) => handleStartDrag(e, node.id)}
                onClick={(e) => { e.stopPropagation(); if (node.id === sel) { setSel(null); setDetailPanelOpen(false); } else { setSel(node.id); setDetailPanelOpen(true); } }}
                className="w-full rounded-xl text-left focus:outline-none"
                style={{
                  padding:"8px 10px",
                  background: S.card,
                  border: `1px solid ${isSelected ? S.primary : (node as any).hasError ? S.error : cfg.border}`,
                  boxShadow: isSelected
                    ? `0 0 0 2px ${S.primary}30, 0 2px 12px rgba(124,108,245,0.15)`
                    : isDragging
                    ? `0 4px 20px rgba(124,108,245,0.25)`
                    : "0 1px 4px rgba(0,0,0,0.06)",
                }}>
                <div className="flex items-center gap-1 mb-1">
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                    style={{ background:cfg.bg, color:cfg.color }}>
                    目 {cfg.label}
                  </span>
                  {(node as any).hasError && <AlertTriangle size={9} style={{ color:S.error }} />}
                  {(node as any).povCharacterId && (() => {
                    const povChar = characters.find(c => c.id === (node as any).povCharacterId);
                    return povChar ? (
                      <span
                        className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full font-medium"
                        style={{ background: `${povChar.color}20`, color: povChar.color }}
                        title={`POV: ${povChar.name}`}
                      >
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: povChar.color }} />
                        {povChar.name}
                      </span>
                    ) : null;
                  })()}
                </div>
                <p className="text-[11px] font-bold truncate" style={{ color:S.text }}>{node.label}</p>
                {(node as any).errorMsg && (
                  <p className="text-[9px] mt-0.5 truncate" style={{ color:S.error }}>{(node as any).errorMsg}</p>
                )}
                {/* Subgraph lock indicator */}
                {isLocked && (
                  <div className="flex items-center gap-0.5 mt-1">
                    <Lock size={8} style={{ color: "#F59E0B" }} />
                    <span className="text-[8px]" style={{ color: "#D97706" }}>已锁定</span>
                  </div>
                )}
                {/* Chapter variant indicator */}
                {chapterVariants.length > 0 && (() => {
                  return (
                    <div className="flex items-center gap-0.5 mt-1" title={`${chapterVariants.length} 个章节变体已配置`}>
                      <GitBranch size={8} style={{ color: "#8B5CF6" }} />
                      <span className="text-[8px]" style={{ color: "#7C3AED" }}>{chapterVariants.length} 变体</span>
                    </div>
                  );
                })()}
              </motion.button>
              {/* Connection point at bottom */}
              <motion.div
                onMouseDown={(e) => handleStartConnect(e, node.id)}
                className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full cursor-crosshair focus:outline-none"
                whileHover={{ scale: 1.5 }}
                style={{
                  background: connectFrom === node.id ? S.primary : S.card,
                  border: `2px solid ${connectFrom === node.id ? S.primary : cfg.color}`,
                  zIndex: 25,
                  boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
                }}
                title="拖拽到另一个节点以创建连线"
              />
            </motion.div>
          );
        })}
      </div>

      {/* ── 节点属性侧面板（右侧滑入，320px）── */}
      <AnimatePresence>
        {sel && detailPanelOpen && selectedNode && (() => {
          const cfg = NODE_TYPE[selectedNode.type] ?? NODE_TYPE.scene;
          const incomingEdges = nodeEdges.filter(e => e.to === sel);
          const outgoingEdges = nodeEdges.filter(e => e.from === sel);
          const nodeCharacters = characters.filter(c => c.appearNodes.includes(sel!));
          const nodeVars = variables.filter(v => v.modifiedBy.includes(sel!) || v.readBy.includes(sel!));
          // Find variables referenced in edge conditions for this node
          const edgeConditionVars = nodeEdges
            .filter(e => e.from === sel || e.to === sel)
            .filter(e => e.condition)
            .map(e => {
              const condStr = JSON.stringify(e.condition);
              return variables.filter(v => condStr.includes(v.name) || condStr.includes(v.id));
            })
            .flat()
            .filter((v, i, arr) => arr.findIndex(x => x.id === v.id) === i);
          const nodeScene = scenes.find(sc => sc.refNodes.includes(sel!));
          return (
            <>
              {/* Semi-transparent backdrop */}
              <motion.div
                key="node-panel-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 z-20"
                style={{ background: "rgba(0,0,0,0.08)" }}
                onClick={() => { setDetailPanelOpen(false); }}
              />
              {/* Panel */}
              <motion.div
                key="node-detail-panel"
                initial={{ x: 340, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 340, opacity: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 34 }}
                className="absolute top-0 right-0 h-full z-30 flex flex-col"
                style={{ width: 320, background: S.card, borderLeft: `1px solid ${S.border}`, boxShadow: "-4px 0 24px rgba(0,0,0,0.08)" }}>
                {/* ── Panel Header ── */}
                <div className="shrink-0 px-4 pt-4 pb-3" style={{ borderBottom: `1px solid ${S.border}` }}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0 mr-2">
                      <h3 className="text-xs font-bold truncate" style={{ color: S.text }}>{selectedNode.label}</h3>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[8px] font-bold px-1.5 py-0.5 rounded"
                          style={{ background: cfg.bg, color: cfg.color }}>
                          {cfg.label}
                        </span>
                        <span className="text-[8px] font-mono" style={{ color: S.text3 }}>{selectedNode.id}</span>
                      </div>
                    </div>
                    <motion.button whileTap={{ scale: 0.9 }}
                      onClick={() => setDetailPanelOpen(false)}
                      className="w-6 h-6 rounded-lg flex items-center justify-center focus:outline-none shrink-0"
                      style={{ background: S.s2, color: S.text3 }}>
                      <X size={11} />
                    </motion.button>
                  </div>
                </div>

                {/* ── Scrollable Content ── */}
                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
                  {/* ── 基本属性 ── */}
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <Edit2 size={9} style={{ color: S.primary }} />
                      <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: S.primary }}>基本属性</span>
                    </div>
                    <div className="space-y-2.5">
                      {/* Label */}
                      <div>
                        <label className="text-[8px] font-bold tracking-wider block mb-1" style={{ color: S.text3 }}>标签</label>
                        <input
                          key={`label-${sel}`}
                          defaultValue={selectedNode.label}
                          onBlur={(e) => updateNode(selectedNode.id, { label: e.target.value })}
                          onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
                          className="w-full px-2.5 py-1.5 rounded-lg text-[10px] font-medium focus:outline-none"
                          style={{ background: S.s2, border: `1px solid ${S.border}`, color: S.text }}
                        />
                      </div>
                      {/* Type */}
                      <div>
                        <label className="text-[8px] font-bold tracking-wider block mb-1" style={{ color: S.text3 }}>类型</label>
                        <select
                          value={selectedNode.type}
                          onChange={(e) => updateNode(selectedNode.id, { type: e.target.value as any })}
                          className="w-full px-2.5 py-1.5 rounded-lg text-[10px] font-medium focus:outline-none appearance-none"
                          style={{ background: S.s2, border: `1px solid ${S.border}`, color: S.text }}>
                          {Object.entries(NODE_TYPE).map(([t, c]) => (
                            <option key={t} value={t}>{c.label} ({t})</option>
                          ))}
                        </select>
                      </div>
                      {/* Description */}
                      <div>
                        <label className="text-[8px] font-bold tracking-wider block mb-1" style={{ color: S.text3 }}>描述</label>
                        <textarea
                          key={`desc-${sel}`}
                          defaultValue={(selectedNode as any).description ?? ""}
                          onBlur={(e) => updateNode(selectedNode.id, { description: e.target.value } as any)}
                          rows={3}
                          className="w-full px-2.5 py-1.5 rounded-lg text-[10px] font-medium focus:outline-none resize-none"
                          style={{ background: S.s2, border: `1px solid ${S.border}`, color: S.text }}
                          placeholder="输入节点描述..."
                        />
                      </div>
                    </div>
                  </div>

                  {/* ── 关联数据 ── */}
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <Link2 size={9} style={{ color: S.accent }} />
                      <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: S.accent }}>关联数据</span>
                    </div>
                    <div className="space-y-2.5">
                      {/* Characters */}
                      <div>
                        <label className="text-[8px] font-bold tracking-wider block mb-1.5" style={{ color: S.text3 }}>
                          <User size={8} className="inline mr-0.5" style={{ verticalAlign: "-1px" }} /> 出场角色
                        </label>
                        {nodeCharacters.length === 0 ? (
                          <p className="text-[9px] py-1.5 text-center rounded-lg" style={{ background: S.s2, color: S.text3 }}>暂无关联角色</p>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {nodeCharacters.map(c => (
                              <span key={c.id}
                                className="inline-flex items-center gap-1 text-[8px] font-medium px-1.5 py-0.5 rounded-full"
                                style={{ background: `${c.color}12`, color: c.color, border: `1px solid ${c.color}25` }}>
                                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: c.color }} />
                                {c.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      {/* Scene */}
                      <div>
                        <label className="text-[8px] font-bold tracking-wider block mb-1" style={{ color: S.text3 }}>
                          <MapPin size={8} className="inline mr-0.5" style={{ verticalAlign: "-1px" }} /> 关联场景
                        </label>
                        <select
                          value={nodeScene?.id ?? ""}
                          onChange={(e) => {
                            /* Scene linking is display-only for now */
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg text-[10px] font-medium focus:outline-none appearance-none"
                          style={{ background: S.s2, border: `1px solid ${S.border}`, color: S.text }}>
                          <option value="">无关联场景</option>
                          {scenes.map(sc => (
                            <option key={sc.id} value={sc.id}>{sc.name} — {sc.location}</option>
                          ))}
                        </select>
                      </div>
                      {/* Variables */}
                      <div>
                        <label className="text-[8px] font-bold tracking-wider block mb-1.5" style={{ color: S.text3 }}>
                          <Zap size={8} className="inline mr-0.5" style={{ verticalAlign: "-1px" }} /> 关联变量
                        </label>
                        {nodeVars.length === 0 && edgeConditionVars.length === 0 ? (
                          <p className="text-[9px] py-1.5 text-center rounded-lg" style={{ background: S.s2, color: S.text3 }}>暂无关联变量</p>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {nodeVars.map(v => (
                              <span key={v.id}
                                className="inline-flex items-center gap-0.5 text-[8px] font-mono px-1.5 py-0.5 rounded"
                                style={{ background: `${S.accent}10`, color: S.accent, border: `1px solid ${S.accent}20` }}>
                                {v.label}
                                <span className="text-[7px]" style={{ color: S.text3 }}>
                                  ({v.modifiedBy.includes(sel!) ? "改" : "读"})
                                </span>
                              </span>
                            ))}
                            {edgeConditionVars.filter(v => !nodeVars.find(nv => nv.id === v.id)).map(v => (
                              <span key={v.id}
                                className="inline-flex items-center gap-0.5 text-[8px] font-mono px-1.5 py-0.5 rounded"
                                style={{ background: `${S.warning}10`, color: S.warning, border: `1px solid ${S.warning}20` }}>
                                {v.label}
                                <span className="text-[7px]" style={{ color: S.text3 }}>(条件)</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ── 连接线 ── */}
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <GitBranch size={9} style={{ color: S.primary }} />
                      <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: S.primary }}>连接线</span>
                    </div>
                    <div className="space-y-2">
                      {/* Incoming */}
                      <div>
                        <label className="text-[8px] font-bold tracking-wider block mb-1" style={{ color: S.text3 }}>
                          入口 ({incomingEdges.length})
                        </label>
                        {incomingEdges.length === 0 ? (
                          <p className="text-[8px] py-1 text-center rounded-lg" style={{ background: S.s2, color: S.text3 }}>无入口连接</p>
                        ) : (
                          <div className="space-y-0.5">
                            {incomingEdges.map((edge, i) => (
                              <div key={`in-${i}`} className="flex items-center gap-1.5 px-2 py-1 rounded-lg"
                                style={{ background: S.s2, border: `1px solid ${S.border}` }}>
                                <span className="text-[8px] font-bold px-1 py-0.5 rounded shrink-0"
                                  style={{ background: `${S.primary}15`, color: S.primary }}>
                                  ←
                                </span>
                                <span className="text-[8px] font-mono shrink-0" style={{ color: S.text3 }}>{edge.from}</span>
                                <span className="text-[9px] flex-1 truncate" style={{ color: S.text2 }}>
                                  {getNodeLabel(edge.from)}
                                </span>
                                {edge.label && (
                                  <span className="text-[7px] px-1 py-0.5 rounded shrink-0" style={{ background: `${S.primary}08`, color: S.primary }}>
                                    {edge.label}
                                  </span>
                                )}
                                <motion.button whileTap={{ scale: 0.9 }}
                                  onClick={() => removeEdge(edge.from, edge.to)}
                                  className="shrink-0 w-4 h-4 rounded flex items-center justify-center focus:outline-none"
                                  style={{ color: S.text3 }}>
                                  <X size={7} />
                                </motion.button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      {/* Outgoing */}
                      <div>
                        <label className="text-[8px] font-bold tracking-wider block mb-1" style={{ color: S.text3 }}>
                          出口 ({outgoingEdges.length})
                        </label>
                        {outgoingEdges.length === 0 ? (
                          <p className="text-[8px] py-1 text-center rounded-lg" style={{ background: S.s2, color: S.text3 }}>无出口连接</p>
                        ) : (
                          <div className="space-y-0.5">
                            {outgoingEdges.map((edge, i) => (
                              <div key={`out-${i}`} className="flex items-center gap-1.5 px-2 py-1 rounded-lg"
                                style={{ background: S.s2, border: `1px solid ${S.border}` }}>
                                <span className="text-[8px] font-bold px-1 py-0.5 rounded shrink-0"
                                  style={{ background: `${S.success}15`, color: S.success }}>
                                  →
                                </span>
                                <span className="text-[8px] font-mono shrink-0" style={{ color: S.text3 }}>{edge.to}</span>
                                <span className="text-[9px] flex-1 truncate" style={{ color: S.text2 }}>
                                  {getNodeLabel(edge.to)}
                                </span>
                                {edge.label && (
                                  <span className="text-[7px] px-1 py-0.5 rounded shrink-0" style={{ background: `${S.success}08`, color: S.success }}>
                                    {edge.label}
                                  </span>
                                )}
                                <motion.button whileTap={{ scale: 0.9 }}
                                  onClick={() => removeEdge(edge.from, edge.to)}
                                  className="shrink-0 w-4 h-4 rounded flex items-center justify-center focus:outline-none"
                                  style={{ color: S.text3 }}>
                                  <X size={7} />
                                </motion.button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      {/* Add connection hint */}
                      <p className="text-[8px] text-center py-1" style={{ color: S.text3 }}>
                        从节点底部圆点拖拽到目标节点可创建连接
                      </p>
                    </div>
                  </div>

                  {/* ── POV 视角角色 ── */}
                  <div>
                    <label className="text-[8px] font-bold tracking-wider block mb-1" style={{ color: S.text3 }}>POV 视角角色</label>
                    <select
                      value={(selectedNode as any).povCharacterId ?? ""}
                      onChange={(e) => updateNode(selectedNode.id, { povCharacterId: e.target.value || undefined } as any)}
                      className="w-full px-2.5 py-1.5 rounded-lg text-[10px] font-medium focus:outline-none appearance-none"
                      style={{ background: S.s2, border: `1px solid ${S.border}`, color: S.text }}>
                      <option value="">无 (None)</option>
                      {characters.map(c => (
                        <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>
                      ))}
                    </select>
                    {(selectedNode as any).povCharacterId && (() => {
                      const povChar = characters.find(c => c.id === (selectedNode as any).povCharacterId);
                      return povChar ? (
                        <div className="flex items-center gap-1.5 mt-1.5 px-2 py-1 rounded-lg" style={{ background: `${povChar.color}10` }}>
                          <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: povChar.color }} />
                          <span className="text-[9px] font-medium" style={{ color: povChar.color }}>{povChar.name}</span>
                          <span className="text-[8px]" style={{ color: S.text3 }}>— {povChar.role}</span>
                        </div>
                      ) : null;
                    })()}
                  </div>

                  {/* ── 对白内容 ── */}
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <MessageSquare size={9} style={{ color: S.warning }} />
                      <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: S.warning }}>对白内容</span>
                    </div>
                    <textarea
                      key={`dialogue-${sel}`}
                      defaultValue={(selectedNode as any).dialogue ?? ""}
                      onBlur={(e) => updateNode(selectedNode.id, { dialogue: e.target.value } as any)}
                      rows={4}
                      className="w-full px-2.5 py-1.5 rounded-lg text-[10px] font-medium focus:outline-none resize-none"
                      style={{ background: S.s2, border: `1px solid ${S.border}`, color: S.text }}
                      placeholder="输入该节点的对白或旁白内容..."
                    />
                  </div>

                  {/* ── 叙事设计意图 ── */}
                  {sel && (() => {
                    const intent = narrativeIntents.find(ni => ni.nodeId === sel);
                    if (!intent && nodeVars.length === 0) return null;
                    return (
                      <div>
                        <div className="flex items-center gap-1.5 mb-2">
                          <Sparkles size={9} style={{ color: S.primary }} />
                          <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: S.primary }}>叙事设计意图</span>
                        </div>
                        {intent && (
                          <div className="p-2.5 rounded-xl space-y-1.5" style={{ background: S.s2, border: `1px solid ${S.border}` }}>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[8px] px-1.5 py-0.5 rounded font-bold"
                                style={{ background: `${S.primary}12`, color: S.primary }}>
                                {intent.purposeLabel}
                              </span>
                              <span className="text-[8px] px-1.5 py-0.5 rounded"
                                style={{
                                  background: intent.emotionValue >= 7 ? "rgba(239,68,68,0.1)" : intent.emotionValue >= 5 ? "rgba(245,158,11,0.1)" : S.s2,
                                  color: intent.emotionValue >= 7 ? S.error : intent.emotionValue >= 5 ? S.warning : S.text3,
                                }}>
                                张力 {intent.emotionValue}/10
                              </span>
                            </div>
                            {intent.choiceImpact && (
                              <div>
                                <span className="text-[8px] font-medium" style={{ color: S.text3 }}>选择影响: </span>
                                <span className="text-[8px]" style={{ color: S.text2 }}>{intent.choiceImpact}</span>
                              </div>
                            )}
                            {intent.failFeedback && (
                              <div className="flex items-start gap-1">
                                <span className="text-[8px]" style={{ color: S.warning }}>!</span>
                                <span className="text-[8px]" style={{ color: S.text3 }}>{intent.failFeedback}</span>
                              </div>
                            )}
                            {intent.variableChanges && intent.variableChanges.length > 0 && (
                              <div>
                                <span className="text-[8px] font-medium block mb-0.5" style={{ color: S.text3 }}>变量变化:</span>
                                {intent.variableChanges.map((vc, i) => (
                                  <span key={i} className="text-[8px] font-mono px-1 py-0.5 rounded mr-1"
                                    style={{ background: `${S.accent}10`, color: S.accent }}>
                                    {vc.variable} {vc.operation}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* ── Error Status ── */}
                  {(selectedNode as any).hasError && (
                    <div className="p-2.5 rounded-lg" style={{ background: `${S.error}08`, border: `1px solid ${S.error}20` }}>
                      <div className="flex items-center gap-1 mb-1">
                        <AlertTriangle size={9} style={{ color: S.error }} />
                        <span className="text-[9px] font-bold" style={{ color: S.error }}>错误</span>
                      </div>
                      <p className="text-[9px]" style={{ color: S.text2 }}>{(selectedNode as any).errorMsg || "未知错误"}</p>
                    </div>
                  )}

                  {/* ── Position ── */}
                  <div>
                    <label className="text-[8px] font-bold tracking-wider block mb-1" style={{ color: S.text3 }}>位置</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <div className="px-2 py-1 rounded-lg text-center" style={{ background: S.s2 }}>
                        <span className="text-[7px] block" style={{ color: S.text3 }}>X</span>
                        <span className="text-[10px] font-bold font-mono" style={{ color: S.text }}>{Math.round(selectedNode.x)}</span>
                      </div>
                      <div className="px-2 py-1 rounded-lg text-center" style={{ background: S.s2 }}>
                        <span className="text-[7px] block" style={{ color: S.text3 }}>Y</span>
                        <span className="text-[10px] font-bold font-mono" style={{ color: S.text }}>{Math.round(selectedNode.y)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Link to script */}
                  <Link href="/script"
                    className="flex items-center justify-center gap-1.5 py-2 rounded-lg text-[10px] font-bold focus:outline-none"
                    style={{ background: `${S.primary}10`, color: S.primary, border: `1px solid ${S.primary}25` }}>
                    <ExternalLink size={10} />
                    查看剧本
                  </Link>
                </div>

                {/* ── Panel Footer Actions ── */}
                <div className="shrink-0 px-4 py-3 flex gap-2" style={{ borderTop: `1px solid ${S.border}` }}>
                  <motion.button whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      /* Save is auto via onBlur; this is a visual confirmation */
                      setDetailPanelOpen(false);
                    }}
                    className="flex-1 py-2 rounded-lg text-[10px] font-bold text-white focus:outline-none flex items-center justify-center gap-1"
                    style={{ background: S.primary, boxShadow: `0 2px 8px ${S.primary}30` }}>
                    <Save size={10} />
                    保存修改
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.97 }}
                    onClick={() => handleDeleteNode(sel!)}
                    className="px-3 py-2 rounded-lg text-[10px] font-bold focus:outline-none flex items-center justify-center gap-1"
                    style={{ background: `${S.error}10`, color: S.error, border: `1px solid ${S.error}20` }}>
                    <Trash2 size={10} />
                    删除节点
                  </motion.button>
                </div>
              </motion.div>
            </>
          );
        })()}
      </AnimatePresence>
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

const UI_COVERAGE = [
  { nodeType: "场景节点 (scene)", needed: ["dialog_box"], has: true, icon: "📖" },
  { nodeType: "选择节点 (choice)", needed: ["choice_button"], has: true, icon: "🔀" },
  { nodeType: "QTE 节点 (qte)", needed: ["qte_prompt"], has: false, icon: "⚡" },
  { nodeType: "结局节点 (ending)", needed: ["menu_panel"], has: false, icon: "🏆" },
  { nodeType: "系统 UI", needed: ["menu_panel", "save_slot", "settings_panel"], has: false, icon: "⚙️" },
];

// ── UI 资产清单（P4-10 主流程化）─────────────────────────────────────────────
function buildUIAssetChecklist(genrePrefix: string) {
  return [
    { type: '对话框', status: 'configured', template: `${genrePrefix}对话框` },
    { type: '选择按钮', status: 'configured', template: `${genrePrefix}选项按钮` },
    { type: 'QTE 控件', status: 'available', template: `${genrePrefix} QTE 面板（未应用）` },
    { type: 'HUD 状态栏', status: 'configured', template: `${genrePrefix} HUD` },
    { type: '系统菜单', status: 'available', template: `${genrePrefix}系统菜单（未应用）` },
    { type: '存档槽位', status: 'missing', template: '未配置' },
    { type: '结局页', status: 'missing', template: '未配置' },
    { type: '标题页', status: 'missing', template: '未配置' },
  ];
}

function UIContent() {
  const uiTemplates = useNarrativeStore(state => state.uiTemplates);
  const gameUISettings = useNarrativeStore(state => state.gameUISettings);
  const updateGameUISettings = useNarrativeStore(state => state.updateGameUISettings);
  const updateUITemplate = useNarrativeStore(state => state.updateUITemplate);
  const addUITemplate = useNarrativeStore(state => state.addUITemplate);
  const projectName = useProjectStore(s => s.currentProject()?.title) || "当前项目";
  const projectGenre = useProjectStore(s => s.currentProject()?.genre) || "互动叙事";
  const characters = useNarrativeStore(state => state.characters);
  const genrePrefix = useMemo(() => {
    // Extract a short style prefix from the project genre (first token before · or space)
    const first = projectGenre.split(/[·\s]/)[0]?.trim();
    return first || "通用";
  }, [projectGenre]);
  const uiAssetChecklist = useMemo(() => buildUIAssetChecklist(genrePrefix), [genrePrefix]);
  const [catFilter, setCatFilter] = useState<UITemplateCategory | "all">("all");
  const [selectedTpl, setSelectedTpl] = useState<UITemplate | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [aiGenOpen, setAiGenOpen] = useState(false);
  const [aiGenLoading, setAiGenLoading] = useState(false);
  const [aiGenStyle, setAiGenStyle] = useState(genrePrefix);
  const [aiGenResult, setAiGenResult] = useState<UITemplate | null>(null);
  const [marketOpen, setMarketOpen] = useState(false);
  const [appliedTemplates, setAppliedTemplates] = useState<string[]>(
    uiTemplates.filter(t => t.isApplied).map(t => t.id)
  );
  const [editingComponent, setEditingComponent] = useState<UIComponentDef | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [coverageOpen, setCoverageOpen] = useState(false);
  const [globalTextSpeed, setGlobalTextSpeed] = useState(gameUISettings.globalTextSpeed);
  const [showSkip, setShowSkip] = useState(gameUISettings.showSkipButton);
  const [showAuto, setShowAuto] = useState(gameUISettings.showAutoPlay);
  const [showSave, setShowSave] = useState(gameUISettings.showSaveLoad);
  const [toast, setToast] = useState<string | null>(null);
  const [themePanelOpen, setThemePanelOpen] = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const filteredTemplates = uiTemplates.filter(t => {
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
    const firstChar = characters[0];
    const previewName = firstChar ? `${firstChar.name} · ${firstChar.role}` : "角色名 · 身份";
    const previewText = "预览文本将在此处显示。选择模板后即可看到实际效果。";
    return (
      <div className="rounded-xl overflow-hidden" style={{ background: bg, border: `2px solid ${border}`, borderRadius: radius }}>
        <div className="p-3">
          <div className="flex items-center gap-1.5 mb-1.5">
            <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: `${border}30` }}>
              <User size={9} style={{ color: border }} />
            </div>
            <span className="text-[10px] font-bold" style={{ color: border }}>{previewName}</span>
          </div>
          <p className="text-xs leading-relaxed" style={{ color: "#e0e0e0" }}>
            {previewText}
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
      {/* UI 生产状态横幅 (P4-10) */}
      <div className="mx-4 mt-3 mb-0">
        <div className="p-3 rounded-xl flex items-center gap-2"
          style={{ background: `${S.warning}08`, border: `1px solid ${S.warning}20` }}>
          <span className="text-sm">🎨</span>
          <div className="flex-1">
            <p className="text-[10px] font-bold" style={{ color: S.text }}>游戏 UI 配置 — 主生产步骤</p>
            <p className="text-[9px]" style={{ color: S.text3 }}>
              对白框、选择框、QTE 控件、HUD、菜单、存档、结局页必须作为正式生产资产纳入管线
            </p>
          </div>
          <span className="text-[8px] px-2 py-0.5 rounded font-bold" style={{ background: `${S.warning}15`, color: S.warning }}>
            进行中
          </span>
        </div>
      </div>

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
          {/* UI 覆盖检查按钮 */}
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => setCoverageOpen(!coverageOpen)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold focus:outline-none"
            style={{ background: `${S.warning}12`, border: `1px solid ${S.warning}25`, color: S.warning }}>
            <Shield size={10} /> 覆盖检查
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

      {/* ── UI 覆盖检查面板 ── */}
      {coverageOpen && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
          className="px-4 py-3 border-b" style={{ borderColor: S.border, background: `${S.warning}04` }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold" style={{ color: S.text }}>UI 模板覆盖检查</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded"
              style={{ background: `${S.warning}15`, color: S.warning }}>
              {UI_COVERAGE.filter(c => c.has).length}/{UI_COVERAGE.length} 已配置
            </span>
          </div>
          <div className="grid grid-cols-5 gap-1.5">
            {UI_COVERAGE.map(item => (
              <div key={item.nodeType} className="p-2 rounded-lg text-center"
                style={{ background: S.card, border: `1px solid ${item.has ? `${S.success}30` : `${S.warning}30`}` }}>
                <div className="text-lg mb-0.5">{item.icon}</div>
                <p className="text-[8px] font-bold mb-0.5" style={{ color: S.text }}>{item.nodeType.split(" ")[0]}</p>
                <p className="text-[7px]" style={{ color: item.has ? S.success : S.warning }}>
                  {item.has ? "✓ 已配置" : "✗ 未配置"}
                </p>
              </div>
            ))}
          </div>
          <p className="text-[8px] mt-2" style={{ color: S.text3 }}>
            💡 未配置的类型可通过 AI 生成或从素材市场导入对应模板
          </p>
        </motion.div>
      )}

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
                      <HudPreview tpl={uiTemplates.find(t => t.id === "tpl-cyber-hud")!} />
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
                      <DialogPreview tpl={uiTemplates.find(t => t.id === "tpl-cyber-dialog")!} />
                    )}
                  </div>
                  {/* 选项按钮 */}
                  <div className="relative z-10 px-3 mt-2 pb-4">
                    {appliedTemplates.includes("tpl-cyber-dialog") && (
                      <ChoicePreview tpl={uiTemplates.find(t => t.id === "tpl-cyber-dialog")!} />
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
                  onChange={e => { const v = Number(e.target.value); setGlobalTextSpeed(v); updateGameUISettings({ globalTextSpeed: v }); }}
                  className="w-full h-1 rounded-full appearance-none cursor-pointer"
                  style={{ accentColor: S.primary, background: S.s2 }} />
              </div>
              {[
                { label: "显示跳过按钮", val: showSkip, set: (v: boolean) => { setShowSkip(v); updateGameUISettings({ showSkipButton: v }); } },
                { label: "显示自动播放", val: showAuto, set: (v: boolean) => { setShowAuto(v); updateGameUISettings({ showAutoPlay: v }); } },
                { label: "显示存档/读档", val: showSave, set: (v: boolean) => { setShowSave(v); updateGameUISettings({ showSaveLoad: v }); } },
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
                {uiTemplates.filter(t => appliedTemplates.includes(t.id)).map(tpl => (
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

          {/* 主题配色 */}
          <div className="px-3 py-3 border-t" style={{ borderColor: S.border }}>
            <motion.button whileTap={{ scale: 0.98 }}
              onClick={() => setThemePanelOpen(!themePanelOpen)}
              className="w-full flex items-center justify-between focus:outline-none mb-2">
              <div className="flex items-center gap-1.5">
                <Palette size={11} style={{ color: S.accent }} />
                <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: S.text3 }}>主题配色</p>
              </div>
              <ChevronDown size={10} style={{
                color: S.text3,
                transform: themePanelOpen ? "rotate(180deg)" : "none",
                transition: "0.2s",
              }} />
            </motion.button>
            <AnimatePresence>
              {themePanelOpen && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                  <ThemeSystem />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ── UI 资产清单面板 (P4-10) ── */}
      <div className="px-4 py-3 shrink-0 overflow-y-auto" style={{ borderTop: `1px solid ${S.border}` }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold" style={{ color: S.text }}>UI 资产清单</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: `${S.primary}12`, color: S.primary }}>
            {uiAssetChecklist.filter(a => a.status === 'configured').length}/{uiAssetChecklist.length} 已配置
          </span>
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {uiAssetChecklist.map(item => {
            const statusColor = item.status === 'configured' ? S.success : item.status === 'available' ? S.warning : S.error;
            const statusLabel = item.status === 'configured' ? '已配置' : item.status === 'available' ? '可用' : '缺失';
            return (
              <div key={item.type} className="p-2 rounded-lg"
                style={{ background: S.card, border: `1px solid ${statusColor}25` }}>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[9px] font-bold" style={{ color: S.text }}>{item.type}</span>
                  <span className="text-[7px] px-1 py-0.5 rounded font-bold"
                    style={{ background: `${statusColor}15`, color: statusColor }}>{statusLabel}</span>
                </div>
                <p className="text-[8px] truncate" style={{ color: S.text3 }}>{item.template}</p>
              </div>
            );
          })}
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
                      AI 将分析「{projectName}」的{projectGenre}题材，自动生成包含对话框、选项按钮、HUD 状态栏、
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
                          description: `基于「${projectName}」剧本自动生成的${aiGenStyle}风格 UI 套件，包含对话框、选项按钮、HUD 和系统菜单。`,
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
                    {uiTemplates.filter(t => t.source === "marketplace").length} 个可用
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
                {uiTemplates.filter(t => t.source === "marketplace").map(tpl => (
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
                {uiTemplates.filter(t => t.source === "marketplace").length === 0 && (
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

// ── 角色线 (Character Timeline) Tab ──────────────────────────────────────────
function CharacterTimelineContent() {
  const characterTimelines = useNarrativeStore(state => state.characterTimelines);
  const crossCharacterEffects = useNarrativeStore(state => state.crossCharacterEffects);
  const [selectedCharId, setSelectedCharId] = useState<string>(characterTimelines[0]?.characterId || '');

  const selectedChar = characterTimelines.find(c => c.characterId === selectedCharId);

  const getCharName = (id: string) => characterTimelines.find(c => c.characterId === id)?.characterName || id;
  const getCharColor = (id: string) => characterTimelines.find(c => c.characterId === id)?.color || S.text3;

  const statusConfig: Record<CharacterStatus, { label: string; color: string; bg: string }> = {
    alive:    { label: '存活', color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
    injured:  { label: '受伤', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
    missing:  { label: '失踪', color: '#F97316', bg: 'rgba(249,115,22,0.12)' },
    captured: { label: '被捕', color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
    betrayed: { label: '背叛', color: '#DC2626', bg: 'rgba(220,38,38,0.12)' },
    dead:     { label: '死亡', color: '#991B1B', bg: 'rgba(153,27,27,0.12)' },
  };

  const effectTypeConfig: Record<CrossCharacterEffect['effectType'], { label: string; color: string; bg: string }> = {
    help:     { label: '帮助', color: '#10B981', bg: 'rgba(16,185,129,0.10)' },
    harm:     { label: '伤害', color: '#EF4444', bg: 'rgba(239,68,68,0.10)' },
    info:     { label: '情报', color: '#3B82F6', bg: 'rgba(59,130,246,0.10)' },
    betrayal: { label: '背叛', color: '#F97316', bg: 'rgba(249,115,22,0.10)' },
    ignore:   { label: '忽略', color: '#6B7280', bg: 'rgba(107,114,128,0.10)' },
  };

  const chapterLabels: Record<string, string> = { ch0: '序章', ch1: '第一章', ch2: '第二章' };

  // Group events by chapter for selected character
  const eventsByChapter: Record<string, CharacterTimeline['events']> = {};
  if (selectedChar) {
    selectedChar.events.forEach(ev => {
      if (!eventsByChapter[ev.chapterId]) eventsByChapter[ev.chapterId] = [];
      eventsByChapter[ev.chapterId].push(ev);
    });
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ background: S.bg }}>
      {/* ── Character Cards ── */}
      <div>
        <h3 className="text-xs font-bold mb-2 flex items-center gap-1.5" style={{ color: S.text }}>
          <Users size={13} style={{ color: S.primary }} />
          角色概览
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {characterTimelines.map(char => {
            const isSelected = selectedCharId === char.characterId;
            const sc = statusConfig[char.status];
            return (
              <motion.button key={char.characterId} whileTap={{ scale: 0.97 }}
                onClick={() => setSelectedCharId(char.characterId)}
                className="p-3 rounded-xl text-left"
                style={{
                  background: S.card,
                  border: `2px solid ${isSelected ? char.color : S.border}`,
                  boxShadow: isSelected ? `0 0 0 2px ${char.color}25` : 'none',
                }}>
                {/* Name + status */}
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: char.color }} />
                  <span className="text-xs font-bold" style={{ color: S.text }}>{char.characterName}</span>
                  <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full ml-auto shrink-0"
                    style={{ background: sc.bg, color: sc.color }}>
                    {sc.label}
                  </span>
                </div>
                {/* Story arc */}
                <p className="text-[9px] mb-2 leading-relaxed" style={{ color: S.text3 }}>{char.storyArc}</p>
                {/* Relationship pills */}
                <div className="flex flex-wrap gap-1">
                  {char.relationships.map((rel, i) => {
                    const targetName = getCharName(rel.targetId);
                    const targetColor = getCharColor(rel.targetId);
                    return (
                      <span key={i} className="text-[7px] px-1.5 py-0.5 rounded-full"
                        style={{ background: `${targetColor}10`, color: targetColor, border: `1px solid ${targetColor}25` }}>
                        {targetName} {rel.type}
                      </span>
                    );
                  })}
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* ── Vertical Timeline for selected character ── */}
      {selectedChar && (
        <motion.div key={selectedChar.characterId} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}>
          <h3 className="text-xs font-bold mb-3 flex items-center gap-1.5" style={{ color: S.text }}>
            <div className="w-2 h-2 rounded-full" style={{ background: selectedChar.color }} />
            {selectedChar.characterName} 时间线
          </h3>
          <div className="relative pl-6">
            {/* Vertical line */}
            <div className="absolute left-2.5 top-0 bottom-0 w-0.5 rounded-full" style={{ background: `${selectedChar.color}30` }} />

            {Object.entries(eventsByChapter).map(([chapterId, events]) => (
              <div key={chapterId} className="mb-4">
                {/* Chapter header */}
                <div className="flex items-center gap-2 mb-2 -ml-6">
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: `${selectedChar.color}15`, color: selectedChar.color }}>
                    {chapterLabels[chapterId] || chapterId}
                  </span>
                </div>

                {/* Event cards */}
                <div className="space-y-2">
                  {events.map((ev, idx) => (
                    <div key={ev.id} className="relative">
                      {/* Circle marker */}
                      <div className="absolute -left-3.5 top-3 w-2.5 h-2.5 rounded-full border-2"
                        style={{ borderColor: selectedChar.color, background: idx === events.length - 1 ? selectedChar.color : S.card, zIndex: 2 }} />
                      {/* Event card */}
                      <div className="p-3 rounded-xl"
                        style={{ background: S.card, border: `1px solid ${S.border}`, borderLeft: `3px solid ${selectedChar.color}` }}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold" style={{ color: S.text }}>{ev.eventTitle}</span>
                          <div className="flex gap-1 ml-auto shrink-0">
                            {ev.nodeIds.map(nid => (
                              <span key={nid} className="text-[7px] font-mono px-1 py-0.5 rounded"
                                style={{ background: S.s2, color: S.text3 }}>{nid}</span>
                            ))}
                          </div>
                        </div>
                        <p className="text-[9px] mb-1.5" style={{ color: S.text2 }}>{ev.description}</p>
                        {ev.choiceMade && (
                          <div className="flex items-center gap-1 mb-1">
                            <span className="text-[8px]" style={{ color: S.text3 }}>选择:</span>
                            <span className="text-[8px] px-1.5 py-0.5 rounded" style={{ background: `${S.primary}10`, color: S.primary }}>
                              {ev.choiceMade}
                            </span>
                          </div>
                        )}
                        {ev.statusChange && (
                          <div className="flex items-center gap-1 mb-1">
                            <span className="text-[8px]" style={{ color: S.text3 }}>状态变化:</span>
                            <span className="text-[8px] px-1 py-0.5 rounded" style={{ background: statusConfig[ev.statusChange.from].bg, color: statusConfig[ev.statusChange.from].color }}>
                              {statusConfig[ev.statusChange.from].label}
                            </span>
                            <span className="text-[8px]" style={{ color: S.text3 }}>&rarr;</span>
                            <span className="text-[8px] px-1 py-0.5 rounded" style={{ background: statusConfig[ev.statusChange.to].bg, color: statusConfig[ev.statusChange.to].color }}>
                              {statusConfig[ev.statusChange.to].label}
                            </span>
                          </div>
                        )}
                        {/* Impact on other characters */}
                        {ev.impactOnOthers && ev.impactOnOthers.length > 0 && (
                          <div className="mt-1.5 pt-1.5" style={{ borderTop: `1px solid ${S.border}` }}>
                            {ev.impactOnOthers.map((impact, i) => {
                              const tName = getCharName(impact.characterId);
                              const tColor = getCharColor(impact.characterId);
                              return (
                                <div key={i} className="flex items-center gap-1 mt-0.5">
                                  <span className="text-[8px]" style={{ color: selectedChar.color }}>&rarr;</span>
                                  <span className="text-[8px] font-bold px-1 py-0.5 rounded"
                                    style={{ background: `${tColor}10`, color: tColor }}>{tName}</span>
                                  <span className="text-[8px]" style={{ color: S.text3 }}>{impact.effect}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── Cross-character effects table ── */}
      <div>
        <h3 className="text-xs font-bold mb-2 flex items-center gap-1.5" style={{ color: S.text }}>
          <GitBranch size={13} style={{ color: S.accent }} />
          跨角色影响矩阵
        </h3>
        <div className="rounded-xl overflow-hidden" style={{ background: S.card, border: `1px solid ${S.border}` }}>
          {/* Header */}
          <div className="grid grid-cols-5 gap-1 px-3 py-2" style={{ background: S.s2, borderBottom: `1px solid ${S.border}` }}>
            <span className="text-[8px] font-bold" style={{ color: S.text3 }}>来源角色</span>
            <span className="text-[8px] font-bold" style={{ color: S.text3 }}>事件</span>
            <span className="text-[8px] font-bold" style={{ color: S.text3 }}>目标角色</span>
            <span className="text-[8px] font-bold" style={{ color: S.text3 }}>效果类型</span>
            <span className="text-[8px] font-bold" style={{ color: S.text3 }}>描述</span>
          </div>
          {/* Rows */}
          {crossCharacterEffects.map((effect, idx) => {
            const srcColor = getCharColor(effect.sourceCharacterId);
            const tgtColor = getCharColor(effect.targetCharacterId);
            const etc = effectTypeConfig[effect.effectType];
            return (
              <div key={effect.id} className="grid grid-cols-5 gap-1 px-3 py-2 items-center"
                style={{ background: idx % 2 === 0 ? S.card : S.s2, borderBottom: `1px solid ${S.border}` }}>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: srcColor }} />
                  <span className="text-[9px] font-bold" style={{ color: srcColor }}>
                    {getCharName(effect.sourceCharacterId)}
                  </span>
                </div>
                <div>
                  <span className="text-[8px]" style={{ color: S.text2 }}>{effect.sourceEvent}</span>
                  <span className="text-[7px] font-mono ml-1" style={{ color: S.text3 }}>{effect.sourceNodeId}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[8px]" style={{ color: S.text3 }}>&rarr;</span>
                  <span className="text-[9px] font-bold" style={{ color: tgtColor }}>
                    {getCharName(effect.targetCharacterId)}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[8px] font-bold px-1.5 py-0.5 rounded"
                    style={{ background: etc.bg, color: etc.color }}>
                    {etc.label}
                  </span>
                  {effect.delayed && (
                    <Clock size={8} style={{ color: S.warning }} />
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[8px]" style={{ color: S.text3 }}>{effect.effectDescription}</span>
                  {effect.delayed && effect.triggerChapter && (
                    <span className="text-[7px] px-1 py-0.5 rounded shrink-0"
                      style={{ background: `${S.warning}10`, color: S.warning }}>
                      {chapterLabels[effect.triggerChapter] || effect.triggerChapter}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 关系网络 ── */}
      <RelationshipMeterSection />

      {/* ── 道德罗盘 ── */}
      <MoralCompassSection />
    </div>
  );
}

// ── Relationship Meter Section (inline for 角色系统) ──────────────────────
function RelationshipMeterSection() {
  const relationshipMeters = useNarrativeStore(s => s.relationshipMeters);
  const characters = useNarrativeStore(s => s.characters);
  const getCharName = (id: string) => characters.find(c => c.id === id)?.name || id;
  const getCharColor = (id: string) => characters.find(c => c.id === id)?.color || S.text3;

  if (relationshipMeters.length === 0) return null;

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: S.card, border: `1px solid ${S.border}` }}>
      <div className="px-5 py-4 flex items-center gap-2" style={{ borderBottom: `1px solid ${S.border}` }}>
        <span className="text-sm">💕</span>
        <h2 className="text-sm font-bold" style={{ color: S.text }}>关系网络</h2>
        <span className="text-[10px] px-2 py-0.5 rounded-md font-medium" style={{ background: S.s2, color: S.text3 }}>
          {relationshipMeters.length} 组关系
        </span>
      </div>
      <div className="p-5 grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
        {relationshipMeters.map(meter => {
          const pct = Math.round(((meter.currentValue - meter.minValue) / (meter.maxValue - meter.minValue)) * 100);
          const currentZone = meter.thresholds?.find(t => meter.currentValue >= t.value - 10 && meter.currentValue <= t.value + 10);
          return (
            <div key={meter.id} className="p-3 rounded-xl" style={{ background: S.s2, border: `1px solid ${S.border}` }}>
              <div className="flex items-center gap-1.5 mb-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: getCharColor(meter.characterAId) }} />
                <span className="text-[10px] font-bold" style={{ color: S.text }}>{getCharName(meter.characterAId)}</span>
                <span className="text-[9px]" style={{ color: S.text3 }}>↔</span>
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: getCharColor(meter.characterBId) }} />
                <span className="text-[10px] font-bold" style={{ color: S.text }}>{getCharName(meter.characterBId)}</span>
              </div>
              <div className="flex items-center gap-2 mb-1">
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "#E2E5F0" }}>
                  <div className="h-full rounded-full transition-all" style={{
                    width: `${pct}%`,
                    background: `linear-gradient(90deg, #EF4444, #F59E0B, #10B981)`,
                  }} />
                </div>
                <span className="text-[10px] font-bold tabular-nums w-8 text-right" style={{ color: S.primary }}>{meter.currentValue}</span>
              </div>
              <div className="flex items-center gap-1.5">
                {meter.relationshipLabel && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: `${S.primary}12`, color: S.primary }}>{meter.relationshipLabel}</span>
                )}
                {currentZone && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: `${S.accent}12`, color: S.accent }}>{currentZone.label}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Moral Compass Section (inline for 角色系统) ───────────────────────────
function MoralCompassSection() {
  const moralAxes = useNarrativeStore(s => s.moralAxes);

  if (moralAxes.length === 0) return null;

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: S.card, border: `1px solid ${S.border}` }}>
      <div className="px-5 py-4 flex items-center gap-2" style={{ borderBottom: `1px solid ${S.border}` }}>
        <span className="text-sm">🧭</span>
        <h2 className="text-sm font-bold" style={{ color: S.text }}>道德罗盘</h2>
        <span className="text-[10px] px-2 py-0.5 rounded-md font-medium" style={{ background: S.s2, color: S.text3 }}>
          {moralAxes.length} 条轴线
        </span>
        {moralAxes.filter(a => Math.abs(a.currentValue) > 70).length > 0 && (
          <span className="text-[10px] px-2 py-0.5 rounded-md font-medium" style={{ background: "rgba(239,68,68,0.08)", color: S.error }}>
            ⚠ {moralAxes.filter(a => Math.abs(a.currentValue) > 70).length} 极端
          </span>
        )}
      </div>
      <div className="p-5 space-y-4">
        {moralAxes.map(axis => {
          const pct = Math.round(((axis.currentValue + 100) / 200) * 100);
          const isExtreme = Math.abs(axis.currentValue) > 70;
          const currentZone = axis.zones?.find(z => axis.currentValue >= z.min && axis.currentValue <= z.max);
          return (
            <div key={axis.id} className="p-3 rounded-xl" style={{ background: S.s2, border: `1px solid ${isExtreme ? "rgba(239,68,68,0.3)" : S.border}` }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold" style={{ color: S.text }}>{axis.name}</span>
                {isExtreme && <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: "rgba(239,68,68,0.1)", color: S.error }}>极端区域</span>}
              </div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[9px] w-12 text-right shrink-0" style={{ color: S.text3 }}>{axis.negativeLabel}</span>
                <div className="flex-1 h-2.5 rounded-full overflow-hidden relative" style={{ background: `linear-gradient(90deg, ${axis.gradientColors[0]}, #F5F5F5, ${axis.gradientColors[1]})` }}>
                  <div className="absolute top-0 bottom-0 w-2.5 rounded-full" style={{
                    left: `${pct}%`,
                    transform: "translateX(-50%)",
                    background: S.text,
                    border: "2px solid white",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
                  }} />
                </div>
                <span className="text-[9px] w-12 shrink-0" style={{ color: S.text3 }}>{axis.positiveLabel}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold tabular-nums" style={{ color: S.primary }}>{axis.currentValue}</span>
                {currentZone && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: `${S.accent}12`, color: S.accent }}>{currentZone.label}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── 变量系统编辑器 Tab ─────────────────────────────────────────────────────
function VariablesContent() {
  const storyNodes = useNarrativeStore(state => state.storyNodes);
  const variables = useNarrativeStore(state => state.variables);
  const narrativeStates = useNarrativeStore(state => state.narrativeStates);
  const [selectedVar, setSelectedVar] = useState<string | null>(null);
  const [stateCategoryFilter, setStateCategoryFilter] = useState<StateCategory | 'all'>('all');

  const getNodeLabel = (id: string) => storyNodes.find(n => n.id === id)?.label || id;

  const totalVars = variables.length;
  const usedVars = variables.filter(v => v.modifiedBy.length > 0 || v.readBy.length > 0).length;

  type VarIssue = { type: string; message: string; varLabel: string; varId: string };
  const issues: VarIssue[] = [];
  variables.forEach(v => {
    if (v.readBy.length === 0 && v.modifiedBy.length > 0) {
      issues.push({ type: '死变量', message: '被修改但从未被读取', varLabel: v.label, varId: v.id });
    }
    if (v.modifiedBy.length === 0 && v.readBy.length > 0) {
      issues.push({ type: '只读变量', message: '被读取但从未被修改', varLabel: v.label, varId: v.id });
    }
    if (v.modifiedBy.length === 0 && v.readBy.length === 0) {
      issues.push({ type: '无变化', message: '变量在所有节点中值不变', varLabel: v.label, varId: v.id });
    }
  });

  const getVarStatus = (v: typeof variables[0]) => {
    if (v.modifiedBy.length > 0 && v.readBy.length > 0) return { label: '正常', color: S.success, icon: '✅' };
    if (v.readBy.length === 0 && v.modifiedBy.length > 0) return { label: '死变量', color: S.warning, icon: '⚠️' };
    if (v.modifiedBy.length === 0 && v.readBy.length > 0) return { label: '只读', color: S.warning, icon: '⚠️' };
    return { label: '无变化', color: S.text3, icon: '⚠️' };
  };

  // Narrative state category config
  const categoryConfig: Record<StateCategory, { color: string; bg: string }> = {
    character:    { color: '#3B82F6', bg: 'rgba(59,130,246,0.10)' },
    relationship: { color: '#8B5CF6', bg: 'rgba(139,92,246,0.10)' },
    world:        { color: '#F59E0B', bg: 'rgba(245,158,11,0.10)' },
    plot:         { color: '#10B981', bg: 'rgba(16,185,129,0.10)' },
  };

  const valueTypeLabels: Record<string, string> = { enum: '枚举', numeric: '数值', boolean: '布尔' };

  const filteredNarrativeStates = narrativeStates.filter(ns =>
    stateCategoryFilter === 'all' || ns.category === stateCategoryFilter
  );

  // Build dependency map for state card display
  const getStateName = (id: string) => narrativeStates.find(ns => ns.id === id)?.name || id;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* 顶部统计栏 */}
      <div className="flex items-center gap-3 px-4 py-3 shrink-0"
        style={{ background: S.card, borderBottom: `1px solid ${S.border}` }}>
        <div className="flex items-center gap-1.5">
          <BarChart3 size={13} style={{ color: S.primary }} />
          <span className="text-xs font-bold" style={{ color: S.text }}>变量系统</span>
        </div>
        <div className="flex items-center gap-3 ml-4">
          <div className="flex items-center gap-1">
            <span className="text-[9px]" style={{ color: S.text3 }}>总数</span>
            <span className="text-[11px] font-bold font-mono" style={{ color: S.text }}>{totalVars}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[9px]" style={{ color: S.text3 }}>已使用</span>
            <span className="text-[11px] font-bold font-mono" style={{ color: S.success }}>{usedVars}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[9px]" style={{ color: S.text3 }}>告警</span>
            <span className="text-[11px] font-bold font-mono" style={{ color: issues.length > 0 ? S.warning : S.success }}>
              {issues.length}
            </span>
          </div>
          <div className="w-px h-3" style={{ background: S.border }} />
          <div className="flex items-center gap-1">
            <span className="text-[9px]" style={{ color: S.text3 }}>叙事状态</span>
            <span className="text-[11px] font-bold font-mono" style={{ color: S.primary }}>{narrativeStates.length}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[9px]" style={{ color: S.text3 }}>影响结局</span>
            <span className="text-[11px] font-bold font-mono" style={{ color: S.accent }}>
              {narrativeStates.filter(ns => ns.affectsEndings && ns.affectsEndings.length > 0).length}
            </span>
          </div>
        </div>
      </div>

      {/* ── 叙事状态机区域 ── */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* 状态分类筛选 */}
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-medium mr-1" style={{ color: S.text3 }}>状态分类:</span>
          {([
            { id: 'all' as StateCategory | 'all', label: '全部' },
            { id: 'character' as StateCategory | 'all', label: '角色状态' },
            { id: 'relationship' as StateCategory | 'all', label: '关系状态' },
            { id: 'world' as StateCategory | 'all', label: '世界状态' },
            { id: 'plot' as StateCategory | 'all', label: '剧情状态' },
          ]).map(cat => (
            <motion.button key={cat.id} whileTap={{ scale: 0.96 }}
              onClick={() => setStateCategoryFilter(cat.id)}
              className="px-2.5 py-1 rounded-full text-[9px] font-medium focus:outline-none"
              style={{
                background: stateCategoryFilter === cat.id ? S.primary : S.s2,
                color: stateCategoryFilter === cat.id ? '#fff' : S.text3,
                border: `1px solid ${stateCategoryFilter === cat.id ? S.primary : S.border}`,
              }}>
              {cat.label}
              {cat.id !== 'all' && (
                <span className="ml-1 text-[8px] opacity-70">
                  ({narrativeStates.filter(ns => ns.category === cat.id).length})
                </span>
              )}
            </motion.button>
          ))}
        </div>

        {/* 叙事状态卡片 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {filteredNarrativeStates.map(ns => {
            const catConf = categoryConfig[ns.category];
            return (
              <motion.div key={ns.id} layout
                className="rounded-xl overflow-hidden"
                style={{ background: S.card, border: `1px solid ${S.border}`, borderLeft: `3px solid ${catConf.color}` }}>
                <div className="p-3">
                  {/* Header: name + category badge + value type */}
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="text-xs font-bold" style={{ color: S.text }}>{ns.name}</span>
                    <span className="text-[7px] font-bold px-1.5 py-0.5 rounded"
                      style={{ background: catConf.bg, color: catConf.color }}>
                      {ns.categoryLabel}
                    </span>
                    <span className="text-[7px] px-1 py-0.5 rounded ml-auto"
                      style={{ background: S.s2, color: S.text3 }}>
                      {valueTypeLabels[ns.valueType]}
                    </span>
                  </div>

                  {/* Value display based on type */}
                  {ns.valueType === 'enum' && ns.enumValues && ns.currentValue && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {ns.enumValues.map(val => {
                        const isCurrent = val === ns.currentValue;
                        return (
                          <span key={val} className="text-[8px] px-1.5 py-0.5 rounded-full font-medium"
                            style={{
                              background: isCurrent ? catConf.color : S.s2,
                              color: isCurrent ? '#fff' : S.text3,
                              border: `1px solid ${isCurrent ? catConf.color : S.border}`,
                            }}>
                            {val}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {ns.valueType === 'numeric' && ns.minValue !== undefined && ns.maxValue !== undefined && ns.numericValue !== undefined && (
                    <div className="mb-2">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[8px] font-mono" style={{ color: S.text3 }}>{ns.minValue}</span>
                        <span className="text-[10px] font-bold font-mono" style={{ color: catConf.color }}>{ns.numericValue}</span>
                        <span className="text-[8px] font-mono" style={{ color: S.text3 }}>{ns.maxValue}</span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ background: S.s2 }}>
                        <motion.div initial={{ width: 0 }}
                          animate={{ width: `${((ns.numericValue - ns.minValue) / (ns.maxValue - ns.minValue)) * 100}%` }}
                          transition={{ duration: 0.6 }}
                          className="h-full rounded-full" style={{ background: catConf.color }} />
                      </div>
                    </div>
                  )}

                  {ns.valueType === 'boolean' && (
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-4 rounded-full relative"
                        style={{ background: ns.boolValue ? catConf.color : S.s2 }}>
                        <div className="w-3 h-3 rounded-full absolute top-0.5 transition-all"
                          style={{ left: ns.boolValue ? 18 : 2, background: '#fff', boxShadow: '0 1px 2px rgba(0,0,0,0.15)' }} />
                      </div>
                      <span className="text-[9px] font-bold" style={{ color: ns.boolValue ? catConf.color : S.text3 }}>
                        {ns.boolValue ? 'True' : 'False'}
                      </span>
                    </div>
                  )}

                  {/* Description */}
                  <p className="text-[9px] mb-2" style={{ color: S.text3 }}>{ns.description}</p>

                  {/* Modified at / Read at */}
                  <div className="grid grid-cols-2 gap-2 mb-1.5">
                    <div>
                      <span className="text-[7px] font-bold block mb-0.5" style={{ color: S.text3 }}>修改于</span>
                      <div className="flex flex-wrap gap-0.5">
                        {ns.modifiedAt.length > 0 ? ns.modifiedAt.map(id => (
                          <span key={id} className="text-[7px] font-mono px-1 py-0.5 rounded"
                            style={{ background: `${S.accent}10`, color: S.accent }}>{getNodeLabel(id)}</span>
                        )) : (
                          <span className="text-[7px]" style={{ color: S.text3 }}>无</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <span className="text-[7px] font-bold block mb-0.5" style={{ color: S.text3 }}>读取于</span>
                      <div className="flex flex-wrap gap-0.5">
                        {ns.readAt.length > 0 ? ns.readAt.map(id => (
                          <span key={id} className="text-[7px] font-mono px-1 py-0.5 rounded"
                            style={{ background: `${S.warning}10`, color: S.warning }}>{getNodeLabel(id)}</span>
                        )) : (
                          <span className="text-[7px]" style={{ color: S.text3 }}>无</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Dependencies */}
                  {ns.dependsOn && ns.dependsOn.length > 0 && (
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-[7px]" style={{ color: S.text3 }}>依赖于:</span>
                      {ns.dependsOn.map(depId => (
                        <span key={depId} className="text-[7px] px-1 py-0.5 rounded"
                          style={{ background: S.s2, color: S.text2, border: `1px dashed ${S.border}` }}>
                          {getStateName(depId)}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Ending influence */}
                  {ns.affectsEndings && ns.affectsEndings.length > 0 && (
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-[7px]" style={{ color: S.text3 }}>影响结局:</span>
                      {ns.affectsEndings.map(ending => (
                        <span key={ending} className="text-[7px] px-1 py-0.5 rounded font-bold"
                          style={{
                            background: ending === 'GOOD' ? `${S.success}10` : `${S.error}10`,
                            color: ending === 'GOOD' ? S.success : S.error,
                          }}>
                          {ending === 'GOOD' ? '好结局' : ending === 'BAD' ? '坏结局' : ending}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* ── 原有变量卡片 (Legacy Variables) ── */}
        <div>
          <h4 className="text-[10px] font-bold mb-2 flex items-center gap-1.5" style={{ color: S.text3 }}>
            <BarChart3 size={11} style={{ color: S.text3 }} />
            游戏变量 (Legacy)
          </h4>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {variables.map(v => {
              const status = getVarStatus(v);
              const isSelected = selectedVar === v.id;
              return (
                <motion.div key={v.id} layout
                  className="rounded-xl overflow-hidden cursor-pointer"
                  style={{
                    background: S.card,
                    border: `1px solid ${isSelected ? S.primary : S.border}`,
                    boxShadow: isSelected ? `0 0 0 1px ${S.primary}20` : 'none',
                  }}
                  onClick={() => setSelectedVar(isSelected ? null : v.id)}>
                  <div className="p-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold" style={{ color: S.text }}>{v.label}</span>
                        <span className="text-[8px] font-mono px-1.5 py-0.5 rounded"
                          style={{ background: `${S.primary}10`, color: S.primary }}>{v.name}</span>
                      </div>
                      <span className="text-[8px] font-bold px-1.5 py-0.5 rounded"
                        style={{ background: `${status.color}15`, color: status.color }}>
                        {status.icon} {status.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="text-[9px]" style={{ color: S.text3 }}>初始值:</span>
                      <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded"
                        style={{ background: S.s2, color: S.text }}>{v.initialValue}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <div>
                        <span className="text-[8px] font-bold block mb-0.5" style={{ color: S.text3 }}>修改节点</span>
                        <div className="flex flex-wrap gap-0.5">
                          {v.modifiedBy.length > 0 ? v.modifiedBy.map(id => (
                            <span key={id} className="text-[8px] font-mono px-1 py-0.5 rounded"
                              style={{ background: `${S.accent}10`, color: S.accent }}>
                              {getNodeLabel(id)}
                            </span>
                          )) : (
                            <span className="text-[8px]" style={{ color: S.text3 }}>无</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <span className="text-[8px] font-bold block mb-0.5" style={{ color: S.text3 }}>读取节点</span>
                        <div className="flex flex-wrap gap-0.5">
                          {v.readBy.length > 0 ? v.readBy.map(id => (
                            <span key={id} className="text-[8px] font-mono px-1 py-0.5 rounded"
                              style={{ background: `${S.warning}10`, color: S.warning }}>
                              {getNodeLabel(id)}
                            </span>
                          )) : (
                            <span className="text-[8px]" style={{ color: S.text3 }}>无</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <p className="text-[9px]" style={{ color: S.text3 }}>{v.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* 底部校验汇总面板 */}
        {issues.length > 0 && (
          <div className="p-3 rounded-xl"
            style={{ background: `${S.warning}04`, border: `1px solid ${S.warning}20` }}>
            <div className="flex items-center gap-1.5 mb-2">
              <AlertTriangle size={12} style={{ color: S.warning }} />
              <span className="text-[10px] font-bold" style={{ color: S.warning }}>校验问题 ({issues.length})</span>
            </div>
            <div className="space-y-1.5">
              {issues.map((issue, i) => (
                <div key={i} className="flex items-center gap-2 p-2 rounded-lg"
                  style={{ background: S.card, border: `1px solid ${S.border}` }}>
                  <span className="text-[8px] font-bold px-1.5 py-0.5 rounded"
                    style={{ background: `${S.warning}15`, color: S.warning }}>{issue.type}</span>
                  <span className="text-[9px]" style={{ color: S.text2 }}>
                    {issue.varLabel} — {issue.message}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── 主编辑器页面 ──────────────────────────────────────────────────────────
export default function NodesScreen() {
  const pathname = usePathname();
  const storyNodes = useNarrativeStore(state => state.storyNodes);
  const narrativeIntents = useNarrativeStore(state => state.narrativeIntents);
  const crossCharacterEffects = useNarrativeStore(state => state.crossCharacterEffects);
  const narrativeStates = useNarrativeStore(state => state.narrativeStates);
  const variables = useNarrativeStore(state => state.variables);
  const characters = useNarrativeStore(state => state.characters);
  const consequenceChains = useNarrativeStore(state => state.consequenceChains);
  const addNode = useNarrativeStore(state => state.addNode);
  const removeNode = useNarrativeStore(state => state.removeNode);
  const updateNode = useNarrativeStore(state => state.updateNode);
  const addEdge = useNarrativeStore(state => state.addEdge);
  const removeEdge = useNarrativeStore(state => state.removeEdge);
  const projectName = useProjectStore(s => s.currentProject()?.title) || "当前项目";
  const [activeTab, setActiveTab] = useState<TabId>("canvas");
  const [sel, setSel] = useState<string|null>(null);
  const [aiModal, setAiModal] = useState<"write"|"node"|"bgm"|"portrait"|null>(null);
  const [aiInput, setAiInput] = useState("");
  const [nodeFilter, setNodeFilter] = useState<string>("all");
  const [diagView, setDiagView] = useState<DiagView>('all');
  const addToast = useUIStore(s => s.addToast);
  const selectedNode = sel ? storyNodes.find(n => n.id === sel) ?? null : null;

  // ── Tension curve for emotion rhythm bar ──
  const tensionCurve = useMemo(() => calculateTensionCurve({
    storyNodes, narrativeIntents, consequenceChains, variables,
  }), [storyNodes, narrativeIntents, consequenceChains, variables]);
  const tensionStats = useMemo(() => getTensionStats(tensionCurve), [tensionCurve]);

  const NODE_FILTERS = [
    { id: "all", label: "全部", icon: Layers },
    { id: "scene", label: "场景", icon: Film },
    { id: "choice", label: "选择", icon: HelpCircle },
    { id: "condition", label: "条件", icon: Zap },
    { id: "qte", label: "QTE", icon: Target },
    { id: "ending", label: "结局", icon: Trophy },
    { id: "error", label: "有问题", icon: AlertTriangle },
  ];

  const filteredSidebarNodes = storyNodes.filter(node => {
    if (nodeFilter === "all") return true;
    if (nodeFilter === "error") return (node as any).hasError;
    if (nodeFilter === "ending") return node.type === "ending_good" || node.type === "ending_bad";
    return node.type === nodeFilter;
  });

  // ── Empty state check ─────────────────────────────────────────────────────
  if (storyNodes.length === 0) {
    return (
      <div className="h-svh flex items-center justify-center" style={{ background: S.bg }}>
        <div className="text-center max-w-md p-8">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: '#F4F6FC' }}>
            <Layers size={28} style={{ color: '#7C6CF5' }} />
          </div>
          <h3 className="text-base font-bold mb-2" style={{ color: '#1a1a2e' }}>还没有节点</h3>
          <p className="text-sm text-gray-500 mb-4">请先完成互动设计，节点图谱将自动生成</p>
          <Link href="/interaction" className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-bold text-white" style={{ background: '#7C6CF5' }}>
            前往互动设计 →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-svh flex flex-col" style={{ background:S.bg }}>
      <UpstreamReadiness currentPath={pathname} />

      {/* ── 5个Tab（保留独特功能：画布/热力图/用户界面/变量/角色线）── */}
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

      {/* ── 筛选 + 诊断视图合并行（仅画布 Tab 显示）── */}
      {activeTab === "canvas" && (
        <div className="flex items-center gap-1 px-4 py-1.5 border-b flex-wrap"
          style={{ background: S.card, borderColor: S.border }}>
          <span className="text-[9px] font-medium mr-1" style={{ color: S.text3 }}>筛选:</span>
          {NODE_FILTERS.map(f => (
            <motion.button key={f.id} whileTap={{ scale: 0.96 }}
              onClick={() => setNodeFilter(f.id)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-medium focus:outline-none"
              style={{
                background: nodeFilter === f.id ? S.primary : "transparent",
                color: nodeFilter === f.id ? "#fff" : S.text3,
                border: `1px solid ${nodeFilter === f.id ? S.primary : S.border}`,
              }}>
              <f.icon size={9} />
              {f.label}
            </motion.button>
          ))}
          <span className="text-[8px] mx-2" style={{ color: S.text3 }}>
            {nodeFilter === "all" ? storyNodes.length : nodeFilter === "error"
              ? storyNodes.filter(n => (n as any).hasError).length
              : storyNodes.filter(n => n.type === nodeFilter || (nodeFilter === "ending" && (n.type === "ending_good" || n.type === "ending_bad"))).length
            } 个节点
          </span>
          {/* Separator */}
          <div className="w-px h-4 mx-1" style={{ background: S.border }} />
          <span className="text-[9px] font-medium mr-1" style={{ color: S.text3 }}>诊断:</span>
          {([
            { id: 'all' as DiagView, label: '全部' },
            { id: 'mainline' as DiagView, label: '主线' },
            { id: 'branch' as DiagView, label: '分支' },
            { id: 'ending' as DiagView, label: '结局' },
            { id: 'problem' as DiagView, label: '问题' },
            { id: 'variable' as DiagView, label: '变量' },
            { id: 'character' as DiagView, label: '角色' },
            { id: 'dependency' as DiagView, label: '依赖' },
          ]).map(v => (
            <motion.button key={v.id} whileTap={{ scale: 0.96 }}
              onClick={() => setDiagView(v.id)}
              className="px-2 py-0.5 rounded text-[9px] font-medium focus:outline-none"
              style={{
                background: diagView === v.id ? S.accent : "transparent",
                color: diagView === v.id ? "#fff" : S.text3,
                border: `1px solid ${diagView === v.id ? S.accent : S.border}`,
              }}>
              {v.label}
            </motion.button>
          ))}
        </div>
      )}

      {/* ── 情绪节奏条 (仅画布 Tab) ── */}
      {activeTab === "canvas" && tensionCurve.length > 0 && (
        <div className="flex items-center gap-2.5 px-4 py-1.5 border-b"
          style={{ background: S.card, borderColor: S.border }}>
          <span className="text-[9px] font-bold shrink-0 flex items-center gap-1" style={{ color: S.text2 }}>
            <Flame size={10} style={{ color: S.primary }} />
            情绪节奏
          </span>
          <div className="flex items-end gap-0.5 flex-1 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            {tensionCurve.map((tp) => (
              <div key={tp.nodeId} className="flex flex-col items-center gap-0.5 shrink-0 group relative">
                <div className="w-5 rounded-sm transition-all"
                  style={{
                    height: Math.max(3, tp.tension * 2.8),
                    background: TENSION_COLORS[tp.category],
                    opacity: 0.85,
                  }} />
                <span className="text-[6px] font-mono" style={{ color: S.text3 }}>{tp.nodeId.replace('N','')}</span>
                {/* Tooltip on hover */}
                <div className="absolute bottom-full mb-1 hidden group-hover:block z-50 pointer-events-none">
                  <div className="px-1.5 py-1 rounded-lg whitespace-nowrap" style={{ background: '#1A1D2E', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
                    <p className="text-[8px] font-bold text-white">{tp.nodeLabel}</p>
                    <p className="text-[7px] text-gray-400">张力 {tp.tension} · {
                      tp.category === 'calm' ? '平缓' : tp.category === 'building' ? '渐进' : tp.category === 'tense' ? '紧张' : tp.category === 'climax' ? '高潮' : '收束'
                    }</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            {[
              { label: '平缓', color: TENSION_COLORS.calm },
              { label: '渐进', color: TENSION_COLORS.building },
              { label: '紧张', color: TENSION_COLORS.tense },
              { label: '高潮', color: TENSION_COLORS.climax },
              { label: '收束', color: TENSION_COLORS.resolution },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-0.5">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: item.color }} />
                <span className="text-[7px]" style={{ color: S.text3 }}>{item.label}</span>
              </div>
            ))}
            <div className="w-px h-3" style={{ background: S.border }} />
            <span className="text-[8px] font-mono" style={{ color: S.text3 }}>
              峰 <span style={{ color: S.error }}>{tensionStats.max}</span>
              <span className="mx-0.5">·</span>
              均 <span style={{ color: S.text2 }}>{tensionStats.avg}</span>
            </span>
          </div>
        </div>
      )}

      {/* ── 主体工作区 ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* 中央主工作区 */}
        <div className="flex-1 overflow-hidden min-w-0">
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity:0 }} animate={{ opacity:1 }}
              exit={{ opacity:0 }} transition={{ duration:0.1 }} className="h-full">
              {activeTab==="canvas"    && <CanvasContent sel={sel} setSel={setSel} nodeFilter={nodeFilter} diagView={diagView} />}
              {activeTab==="heatmap"   && <HeatmapContent />}
              {activeTab==="ui"        && <UIContent />}
              {activeTab==="variables" && <VariablesContent />}
              {activeTab==="timeline"  && <CharacterTimelineContent />}
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

      {/* Contextual Quick Actions — visible when a node is selected on canvas */}
      {activeTab === "canvas" && sel && selectedNode && (
        <ContextualActions
          actions={[
            { icon: Edit2, label: "编辑对白", href: "/interaction" },
            { icon: ImageIcon, label: "生成背景图", onClick: () => addToast({ type: "info", title: "即将上线", message: "AI 生图功能即将上线" }) },
            { icon: Eye, label: "预览此节点", href: "/simulator" },
            { icon: MapPin, label: "查看路径" },
          ]}
        />
      )}

      {/* Next Step Navigation */}
      <div className="shrink-0 bg-white border-t border-gray-200 px-6 py-3 flex items-center justify-between"
        style={{ borderColor: S.border }}>
        <span className="text-xs text-gray-500">下一步：预览演出效果</span>
        <Link href="/simulator" className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white" style={{ background: '#7C6CF5' }}>
          打开演出预览 →
        </Link>
      </div>
    </div>
  );
}
