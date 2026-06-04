"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { GitBranch, ChevronRight, ChevronDown, X, Check, Edit2, BookOpen, Layout, Sparkles, MessageCircle, Columns, Bold, Italic, Underline as UnderlineIcon, Highlighter, Heading1, Heading2, Heading3, List, ListOrdered, Quote, Plus, Shield, Loader2, MessageSquare, Layers, Share2 } from "lucide-react";
import Link from "next/link";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Highlight from "@tiptap/extension-highlight";
import Underline from "@tiptap/extension-underline";
import { type ScriptBlock, type ChapterPlan } from "@/lib/studio-data";
import { useNarrativeStore, getCurrentProject, useCanvasAgentStore, useSettingsStore, useUIStore } from "@/store";
import { AIService } from "@/lib/ai";
import type { ConsistencyIssue, DialogueOption } from "@/lib/ai";
import { UpstreamReadiness } from "@/components/ui/UpstreamReadiness";
import { DataFlowBar } from "@/components/ui/DataFlowBar";
import { pushTransfer } from "@/lib/data-flow-bridge";
import ContextualActions from "@/components/ui/ContextualActions";

const S = {
  bg:"#F5F6FA", card:"#FFFFFF", s2:"#F4F6FC",
  border:"#E8EAF2", primary:"#7C6CF5", accent:"#00A99D",
  text:"#1A1D2E", text2:"#4A5068", text3:"#8892B0",
  success:"#10B981", warning:"#F59E0B", error:"#EF4444",
};

type LayerId = "chapter" | "original" | "linear" | "interactive" | "playable";
const LAYERS: { id: LayerId; label: string; desc: string }[] = [
  { id: "chapter", label: "章节规划", desc: "主题·情绪弧·分支点" },
  { id: "original", label: "原始文本", desc: "小说/原始剧本" },
  { id: "linear", label: "线性剧本", desc: "结构化分场剧本" },
  { id: "interactive", label: "互动剧本", desc: "含分支和变量的互动叙事" },
  { id: "playable", label: "可运行脚本", desc: "可在模拟器中游玩" },
];

// ── 叙事模板数据 ──
type NarrativeTemplateAct = {
  act: string;
  purpose: string;
  suggestedChapters: number;
  suggestedEvents: number;
  tensionRange: string;
};

type NarrativeTemplate = {
  id: string;
  name: string;
  icon: string;
  description: string;
  structure: NarrativeTemplateAct[];
  bestFor: string[];
  examples: string;
};

const NARRATIVE_TEMPLATES: NarrativeTemplate[] = [
  {
    id: 'three-act',
    name: '三幕式结构',
    icon: '🎭',
    description: '经典的三幕叙事：建立→对抗→解决。适用于大多数故事类型。',
    structure: [
      { act: '第一幕：建立', purpose: '介绍世界观、角色、核心冲突', suggestedChapters: 2, suggestedEvents: 4, tensionRange: '2-4' },
      { act: '第二幕：对抗', purpose: '冲突升级、试炼、中点反转', suggestedChapters: 3, suggestedEvents: 8, tensionRange: '5-8' },
      { act: '第三幕：解决', purpose: '高潮、解决、新常态', suggestedChapters: 2, suggestedEvents: 4, tensionRange: '7-10' },
    ],
    bestFor: ['冒险', '悬疑', '爱情', '成长'],
    examples: '《__PROJECT_NAME__》当前结构接近三幕式',
  },
  {
    id: 'hero-journey',
    name: '英雄之旅',
    icon: '⚔️',
    description: 'Joseph Campbell 的单一神话模型，12 个阶段的英雄成长弧线。',
    structure: [
      { act: '普通世界', purpose: '英雄的日常状态', suggestedChapters: 1, suggestedEvents: 2, tensionRange: '1-3' },
      { act: '冒险召唤', purpose: '打破日常的事件', suggestedChapters: 1, suggestedEvents: 2, tensionRange: '3-5' },
      { act: '试炼之路', purpose: '盟友、敌人、考验', suggestedChapters: 2, suggestedEvents: 6, tensionRange: '4-7' },
      { act: '深渊考验', purpose: '最大危机，面对死亡或最大恐惧', suggestedChapters: 1, suggestedEvents: 3, tensionRange: '8-10' },
      { act: '归来转变', purpose: '带着获得的"宝物"回归', suggestedChapters: 1, suggestedEvents: 2, tensionRange: '5-7' },
    ],
    bestFor: ['奇幻', '冒险', '成长'],
    examples: '《指环王》《星球大战》《黑客帝国》',
  },
  {
    id: 'multi-thread',
    name: '多线并进',
    icon: '🕸️',
    description: '多条叙事线交织，最终汇聚。适合群像剧和复杂悬疑。',
    structure: [
      { act: '线索铺设', purpose: '分别介绍多条叙事线和角色', suggestedChapters: 3, suggestedEvents: 6, tensionRange: '2-4' },
      { act: '线索交织', purpose: '各线开始产生关联和冲突', suggestedChapters: 3, suggestedEvents: 8, tensionRange: '4-7' },
      { act: '真相汇聚', purpose: '所有线索指向同一个核心', suggestedChapters: 2, suggestedEvents: 4, tensionRange: '7-9' },
      { act: '多线收束', purpose: '各线分别收束或产生最终交叉', suggestedChapters: 2, suggestedEvents: 4, tensionRange: '8-10' },
    ],
    bestFor: ['悬疑', '群像', '政治', '谍战'],
    examples: '《低俗小说》《通天塔》《权力的游戏》',
  },
  {
    id: 'time-loop',
    name: '时间循环',
    icon: '🔄',
    description: '主角陷入时间循环，每次循环获得新信息。适合解谜和探索。',
    structure: [
      { act: '首次循环', purpose: '建立日常和循环触发事件', suggestedChapters: 1, suggestedEvents: 3, tensionRange: '3-5' },
      { act: '发现规律', purpose: '主角开始理解循环机制', suggestedChapters: 2, suggestedEvents: 5, tensionRange: '4-6' },
      { act: '尝试突破', purpose: '利用已知信息尝试打破循环', suggestedChapters: 2, suggestedEvents: 6, tensionRange: '6-8' },
      { act: '最终循环', purpose: '关键抉择决定是否打破循环', suggestedChapters: 1, suggestedEvents: 3, tensionRange: '8-10' },
    ],
    bestFor: ['科幻', '悬疑', '解谜'],
    examples: '《土拨鼠日》《忌日快乐》《开端》',
  },
  {
    id: 'rashomon',
    name: '罗生门',
    icon: '👁️',
    description: '同一事件从不同角色视角叙述，揭示真相的多面性。',
    structure: [
      { act: '事件发生', purpose: '从全知视角展示核心事件', suggestedChapters: 1, suggestedEvents: 2, tensionRange: '5-7' },
      { act: '视角 A', purpose: '第一个角色的叙述版本', suggestedChapters: 2, suggestedEvents: 4, tensionRange: '4-6' },
      { act: '视角 B', purpose: '第二个角色的矛盾叙述', suggestedChapters: 2, suggestedEvents: 4, tensionRange: '5-7' },
      { act: '视角 C', purpose: '第三个角色揭示隐藏真相', suggestedChapters: 2, suggestedEvents: 4, tensionRange: '7-9' },
      { act: '真相拼图', purpose: '综合所有视角，拼出完整真相', suggestedChapters: 1, suggestedEvents: 2, tensionRange: '8-10' },
    ],
    bestFor: ['悬疑', '心理', '法庭'],
    examples: '《罗生门》《消失的爱人》《利刃出鞘》',
  },
];

// ── 章节规划内容组件（P3-2）──
function ChapterPlanContent() {
  const projectName = getCurrentProject()?.title || "当前项目";
  const chapterPlans = useNarrativeStore(state => state.chapterPlans);
  const [expandedChapter, setExpandedChapter] = useState<string | null>(chapterPlans[0]?.id ?? null);
  const [showTemplatePanel, setShowTemplatePanel] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [confirmingTemplate, setConfirmingTemplate] = useState<string | null>(null);
  const [appliedTemplate, setAppliedTemplate] = useState<NarrativeTemplate | null>(null);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ background: S.bg }}>
      {/* 顶部说明 */}
      <div className="p-3 rounded-xl flex items-center gap-2" style={{ background: `${S.primary}08`, border: `1px solid ${S.primary}20` }}>
        <BookOpen size={14} style={{ color: S.primary }} />
        <p className="text-[10px]" style={{ color: S.text2 }}>
          章节规划是线性剧本和互动设计之间的桥梁。每章定义主题、情绪弧、事件列表和分支点。
        </p>
      </div>

      {/* ── 叙事模板入口 ── */}
      <div>
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            setShowTemplatePanel(v => !v);
            if (showTemplatePanel) {
              setSelectedTemplate(null);
              setConfirmingTemplate(null);
            }
          }}
          className="w-full flex items-center gap-2.5 p-3 rounded-xl focus:outline-none"
          style={{
            background: showTemplatePanel ? `${S.primary}12` : S.card,
            border: `1px solid ${showTemplatePanel ? `${S.primary}30` : S.border}`,
          }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: `${S.accent}12` }}
          >
            <Layout size={14} style={{ color: S.accent }} />
          </div>
          <div className="flex-1 text-left">
            <p className="text-xs font-bold" style={{ color: S.text }}>应用叙事模板</p>
            <p className="text-[9px] mt-0.5" style={{ color: S.text3 }}>
              选择经典叙事结构，快速生成章纲骨架
            </p>
          </div>
          <motion.span animate={{ rotate: showTemplatePanel ? 180 : 0 }}>
            <ChevronDown size={14} style={{ color: S.text3 }} />
          </motion.span>
        </motion.button>

        <AnimatePresence>
          {showTemplatePanel && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="mt-3 space-y-3">
                {/* ── 已应用模板结果展示 ── */}
                {appliedTemplate && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl overflow-hidden"
                    style={{ background: S.card, border: `1.5px solid ${S.accent}40` }}
                  >
                    <div
                      className="px-4 py-3 flex items-center justify-between"
                      style={{ background: `linear-gradient(135deg, ${S.accent}10, ${S.primary}08)` }}
                    >
                      <div className="flex items-center gap-2">
                        <Sparkles size={14} style={{ color: S.accent }} />
                        <span className="text-xs font-bold" style={{ color: S.text }}>
                          已应用：{appliedTemplate.icon} {appliedTemplate.name}
                        </span>
                      </div>
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setAppliedTemplate(null)}
                        className="p-1 rounded focus:outline-none"
                      >
                        <X size={12} style={{ color: S.text3 }} />
                      </motion.button>
                    </div>
                    <div className="p-4 space-y-3">
                      <p className="text-[10px]" style={{ color: S.text2 }}>
                        基于「{appliedTemplate.name}」生成了章纲骨架：
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <span
                          className="text-[9px] px-2 py-1 rounded-lg font-bold"
                          style={{ background: `${S.primary}10`, color: S.primary }}
                        >
                          {appliedTemplate.structure.length} 幕
                        </span>
                        <span
                          className="text-[9px] px-2 py-1 rounded-lg font-bold"
                          style={{ background: `${S.accent}10`, color: S.accent }}
                        >
                          {appliedTemplate.structure.reduce((a, s) => a + s.suggestedChapters, 0)} 章节
                        </span>
                        <span
                          className="text-[9px] px-2 py-1 rounded-lg font-bold"
                          style={{ background: `${S.warning}10`, color: S.warning }}
                        >
                          {appliedTemplate.structure.reduce((a, s) => a + s.suggestedEvents, 0)} 事件
                        </span>
                      </div>
                      {/* 预览生成的章节骨架 */}
                      <div className="space-y-1.5">
                        {appliedTemplate.structure.map((act, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 p-2.5 rounded-lg"
                            style={{ background: S.s2 }}
                          >
                            <div
                              className="w-6 h-6 rounded flex items-center justify-center shrink-0"
                              style={{ background: `${S.primary}15` }}
                            >
                              <span className="text-[9px] font-black" style={{ color: S.primary }}>
                                {idx + 1}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] font-bold truncate" style={{ color: S.text }}>
                                {act.act}
                              </p>
                              <p className="text-[8px]" style={{ color: S.text3 }}>
                                {act.suggestedChapters} 章 · {act.suggestedEvents} 事件 · 张力 {act.tensionRange}
                              </p>
                            </div>
                            <div
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{
                                background:
                                  parseInt(act.tensionRange.split('-')[1]) >= 8
                                    ? '#EF4444'
                                    : parseInt(act.tensionRange.split('-')[1]) >= 5
                                    ? '#F59E0B'
                                    : '#10B981',
                              }}
                            />
                          </div>
                        ))}
                      </div>
                      <p className="text-[9px] italic" style={{ color: S.text3 }}>
                        以上为模板生成的骨架结构，可在此基础上继续编辑和完善。
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* ── 模板详情视图 ── */}
                {selectedTemplate ? (
                  (() => {
                    const tpl = NARRATIVE_TEMPLATES.find(t => t.id === selectedTemplate)!;
                    return (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-xl overflow-hidden"
                        style={{ background: S.card, border: `1px solid ${S.primary}30` }}
                      >
                        {/* 详情头部 */}
                        <div
                          className="px-4 py-3 flex items-center justify-between"
                          style={{
                            background: `linear-gradient(135deg, ${S.primary}08, ${S.accent}06)`,
                            borderBottom: `1px solid ${S.border}`,
                          }}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="text-lg">{tpl.icon}</span>
                            <div>
                              <p className="text-xs font-bold" style={{ color: S.text }}>
                                {tpl.name}
                              </p>
                              <p className="text-[9px]" style={{ color: S.text3 }}>
                                {tpl.description}
                              </p>
                            </div>
                          </div>
                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setSelectedTemplate(null)}
                            className="p-1.5 rounded-lg focus:outline-none"
                            style={{ background: `${S.text3}15` }}
                          >
                            <X size={12} style={{ color: S.text3 }} />
                          </motion.button>
                        </div>

                        <div className="p-4 space-y-4">
                          {/* 结构图示 */}
                          <div>
                            <p
                              className="text-[9px] font-bold uppercase tracking-wider mb-2"
                              style={{ color: S.text3 }}
                            >
                              结构图示
                            </p>
                            <div className="flex rounded-lg overflow-hidden" style={{ gap: '2px' }}>
                              {tpl.structure.map((act, idx) => {
                                const maxTension = parseInt(act.tensionRange.split('-')[1]);
                                const barColor =
                                  maxTension >= 8
                                    ? '#EF4444'
                                    : maxTension >= 5
                                    ? '#F59E0B'
                                    : '#10B981';
                                return (
                                  <div
                                    key={idx}
                                    className="flex-1 p-2 rounded-lg"
                                    style={{
                                      background: `${barColor}12`,
                                      borderLeft:
                                        idx === 0 ? 'none' : `1px solid ${S.border}`,
                                    }}
                                  >
                                    <p
                                      className="text-[8px] font-bold mb-0.5 truncate"
                                      style={{ color: S.text }}
                                    >
                                      {act.act}
                                    </p>
                                    <p
                                      className="text-[7px] leading-tight mb-1"
                                      style={{ color: S.text3 }}
                                    >
                                      {act.purpose}
                                    </p>
                                    <div className="space-y-0.5">
                                      <p className="text-[7px]" style={{ color: S.text2 }}>
                                        {act.suggestedChapters} 章 · {act.suggestedEvents} 事件
                                      </p>
                                      <p className="text-[7px] font-mono" style={{ color: barColor }}>
                                        张力 {act.tensionRange}
                                      </p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* 张力曲线可视化 */}
                          <div>
                            <p
                              className="text-[9px] font-bold uppercase tracking-wider mb-2"
                              style={{ color: S.text3 }}
                            >
                              张力曲线
                            </p>
                            <div
                              className="flex items-end gap-0.5 h-12 p-2 rounded-lg"
                              style={{ background: S.s2 }}
                            >
                              {tpl.structure.flatMap((act, ai) => {
                                const [low, high] = act.tensionRange.split('-').map(Number);
                                const steps = Math.max(2, act.suggestedChapters);
                                return Array.from({ length: steps }, (_, si) => {
                                  const t = steps > 1 ? si / (steps - 1) : 0.5;
                                  const tension = low + (high - low) * t;
                                  const pct = (tension / 10) * 100;
                                  const color =
                                    tension >= 8
                                      ? '#EF4444'
                                      : tension >= 5
                                      ? '#F59E0B'
                                      : tension >= 3
                                      ? '#10B981'
                                      : '#6EE7B7';
                                  return (
                                    <div
                                      key={`${ai}-${si}`}
                                      className="flex-1 rounded-t transition-all"
                                      style={{
                                        height: `${pct}%`,
                                        background: color,
                                        minHeight: '4px',
                                        opacity: 0.85,
                                      }}
                                    />
                                  );
                                });
                              })}
                            </div>
                          </div>

                          {/* 经典案例 */}
                          <div>
                            <p
                              className="text-[9px] font-bold uppercase tracking-wider mb-1"
                              style={{ color: S.text3 }}
                            >
                              经典案例
                            </p>
                            <p className="text-[10px]" style={{ color: S.text2 }}>
                              {tpl.examples.replace('__PROJECT_NAME__', projectName)}
                            </p>
                          </div>

                          {/* 适用题材 */}
                          <div>
                            <p
                              className="text-[9px] font-bold uppercase tracking-wider mb-1.5"
                              style={{ color: S.text3 }}
                            >
                              适用题材
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {tpl.bestFor.map((genre, i) => (
                                <span
                                  key={i}
                                  className="text-[9px] px-2 py-0.5 rounded-full font-medium"
                                  style={{ background: `${S.primary}10`, color: S.primary }}
                                >
                                  {genre}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* 应用按钮 / 确认状态 */}
                          {confirmingTemplate === tpl.id ? (
                            <motion.div
                              initial={{ opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="p-3 rounded-xl space-y-2.5"
                              style={{ background: `${S.warning}08`, border: `1px solid ${S.warning}25` }}
                            >
                              <p className="text-[10px]" style={{ color: S.text2 }}>
                                将基于此模板生成章纲骨架，当前章节规划将被覆盖。
                              </p>
                              <div className="flex gap-2">
                                <motion.button
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => {
                                    setAppliedTemplate(tpl);
                                    setConfirmingTemplate(null);
                                    setSelectedTemplate(null);
                                  }}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold text-white focus:outline-none"
                                  style={{ background: S.primary }}
                                >
                                  <Check size={10} /> 确认应用
                                </motion.button>
                                <motion.button
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => setConfirmingTemplate(null)}
                                  className="px-3 py-1.5 rounded-lg text-[10px] font-medium focus:outline-none"
                                  style={{ background: S.s2, color: S.text3 }}
                                >
                                  取消
                                </motion.button>
                              </div>
                            </motion.div>
                          ) : (
                            <motion.button
                              whileTap={{ scale: 0.97 }}
                              onClick={() => setConfirmingTemplate(tpl.id)}
                              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white focus:outline-none"
                              style={{ background: S.primary }}
                            >
                              <Sparkles size={12} /> 应用此模板
                            </motion.button>
                          )}
                        </div>
                      </motion.div>
                    );
                  })()
                ) : (
                  /* ── 模板卡片网格 ── */
                  <div className="grid grid-cols-2 gap-2">
                    {NARRATIVE_TEMPLATES.map(tpl => (
                      <motion.button
                        key={tpl.id}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setSelectedTemplate(tpl.id)}
                        className="p-3 rounded-xl text-left focus:outline-none"
                        style={{ background: S.card, border: `1px solid ${S.border}` }}
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-base">{tpl.icon}</span>
                          <span className="text-[10px] font-bold" style={{ color: S.text }}>
                            {tpl.name}
                          </span>
                        </div>
                        <p
                          className="text-[8px] leading-relaxed mb-2"
                          style={{ color: S.text3 }}
                        >
                          {tpl.description}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {tpl.bestFor.slice(0, 3).map((genre, i) => (
                            <span
                              key={i}
                              className="text-[7px] px-1.5 py-0.5 rounded"
                              style={{ background: `${S.primary}08`, color: S.primary }}
                            >
                              {genre}
                            </span>
                          ))}
                        </div>
                      </motion.button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 章节卡片列表 */}
      {chapterPlans.map(chapter => {
        const isExpanded = expandedChapter === chapter.id;
        return (
          <motion.div key={chapter.id} layout
            className="rounded-xl overflow-hidden" style={{ background: S.card, border: `1px solid ${S.border}` }}>
            {/* 章节头 */}
            <motion.button whileTap={{ scale: 0.98 }}
              onClick={() => setExpandedChapter(isExpanded ? null : chapter.id)}
              className="w-full flex items-center gap-3 p-3 text-left focus:outline-none">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: `${S.primary}12` }}>
                <span className="text-xs font-black" style={{ color: S.primary }}>Ch{chapter.chapterNumber}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold truncate" style={{ color: S.text }}>{chapter.title}</p>
                <p className="text-[9px] mt-0.5" style={{ color: S.text3 }}>{chapter.themeQuestion}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[8px] px-1.5 py-0.5 rounded" style={{ background: S.s2, color: S.text3 }}>
                  {chapter.events.length} 事件
                </span>
                <span className="text-[8px] px-1.5 py-0.5 rounded" style={{
                  background: chapter.events.some(e => e.isBranchPoint) ? `${S.warning}12` : S.s2,
                  color: chapter.events.some(e => e.isBranchPoint) ? S.warning : S.text3
                }}>
                  {chapter.events.filter(e => e.isBranchPoint).length} 分支
                </span>
                <motion.span animate={{ rotate: isExpanded ? 180 : 0 }}>
                  <ChevronDown size={12} style={{ color: S.text3 }} />
                </motion.span>
              </div>
            </motion.button>

            {/* 变体路线指示器 */}
            {chapter.variants && chapter.variants.length > 0 && (
              <div className="mx-3 mb-2 px-3 py-2 rounded-lg" style={{ background: "rgba(94,80,232,0.05)", border: "1px solid rgba(94,80,232,0.15)" }}>
                <div className="flex items-center gap-2 mb-1.5">
                  <GitBranch size={12} style={{ color: "#5E50E8" }} />
                  <span className="text-xs font-semibold" style={{ color: "#5E50E8" }}>
                    {chapter.variants.length} 个变体路线
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {chapter.variants.map(v => (
                    <span
                      key={v.id}
                      className="text-xs px-2 py-0.5 rounded-full cursor-default"
                      style={{ background: "rgba(94,80,232,0.10)", color: "#5E50E8" }}
                      title={v.activationDescription}
                    >
                      {v.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 展开详情 */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden">
                  <div className="px-3 pb-3 space-y-3">
                    {/* 情绪弧 + 时长 */}
                    <div className="flex gap-2">
                      <div className="flex-1 p-2 rounded-lg" style={{ background: S.s2 }}>
                        <p className="text-[8px] font-bold mb-0.5" style={{ color: S.text3 }}>情绪弧</p>
                        <p className="text-[10px]" style={{ color: S.text2 }}>{chapter.emotionArc}</p>
                      </div>
                      <div className="w-20 p-2 rounded-lg" style={{ background: S.s2 }}>
                        <p className="text-[8px] font-bold mb-0.5" style={{ color: S.text3 }}>预估时长</p>
                        <p className="text-[10px]" style={{ color: S.text2 }}>{chapter.estimatedDuration}</p>
                      </div>
                    </div>

                    {/* 事件列表 */}
                    <div>
                      <p className="text-[9px] font-bold mb-1.5" style={{ color: S.text3 }}>事件列表</p>
                      <div className="space-y-1.5">
                        {chapter.events.map((event, idx) => (
                          <div key={event.id} className="p-2 rounded-lg" style={{
                            background: event.isBranchPoint ? `${S.warning}06` : S.s2,
                            border: event.isBranchPoint ? `1px solid ${S.warning}20` : 'none'
                          }}>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[8px] font-mono w-4" style={{ color: S.text3 }}>{idx + 1}</span>
                              <span className="text-[10px] font-bold" style={{ color: S.text }}>{event.title}</span>
                              {event.isBranchPoint && (
                                <span className="text-[8px] px-1 py-0.5 rounded font-bold" style={{ background: `${S.warning}15`, color: S.warning }}>分支点</span>
                              )}
                            </div>
                            <p className="text-[9px] ml-6" style={{ color: S.text2 }}>{event.description}</p>
                            {event.branchOptions && (
                              <div className="ml-6 mt-1.5 space-y-1">
                                {event.branchOptions.map((opt, oi) => (
                                  <div key={oi} className="flex items-start gap-1.5">
                                    <span className="text-[8px] shrink-0 mt-0.5 font-bold" style={{ color: S.accent }}>→</span>
                                    <div>
                                      <span className="text-[9px] font-medium" style={{ color: S.text }}>{opt.label}</span>
                                      <span className="text-[8px] ml-1" style={{ color: S.text3 }}>· {opt.consequence}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                            {event.variableHints && event.variableHints.length > 0 && (
                              <div className="ml-6 mt-1 flex items-center gap-1">
                                <span className="text-[8px]" style={{ color: S.text3 }}>变量：</span>
                                {event.variableHints.map((v, vi) => (
                                  <span key={vi} className="text-[8px] px-1 py-0.5 rounded font-mono" style={{ background: `${S.primary}10`, color: S.primary }}>{v}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 补充信息 */}
                    {(chapter.keyDialogue || chapter.characterStates || chapter.suspenseHook || chapter.chapterEndHook) && (
                      <div className="grid grid-cols-2 gap-2">
                        {chapter.keyDialogue && (
                          <div className="p-2 rounded-lg" style={{ background: S.s2 }}>
                            <p className="text-[8px] font-bold mb-0.5" style={{ color: S.text3 }}>关键对白</p>
                            <p className="text-[9px] italic" style={{ color: S.accent }}>{chapter.keyDialogue}</p>
                          </div>
                        )}
                        {chapter.characterStates && (
                          <div className="p-2 rounded-lg" style={{ background: S.s2 }}>
                            <p className="text-[8px] font-bold mb-0.5" style={{ color: S.text3 }}>角色状态</p>
                            <p className="text-[9px]" style={{ color: S.text2 }}>{chapter.characterStates}</p>
                          </div>
                        )}
                        {chapter.suspenseHook && (
                          <div className="p-2 rounded-lg" style={{ background: S.s2 }}>
                            <p className="text-[8px] font-bold mb-0.5" style={{ color: S.text3 }}>悬念钩子</p>
                            <p className="text-[9px]" style={{ color: S.warning }}>{chapter.suspenseHook}</p>
                          </div>
                        )}
                        {chapter.chapterEndHook && (
                          <div className="p-2 rounded-lg" style={{ background: S.s2 }}>
                            <p className="text-[8px] font-bold mb-0.5" style={{ color: S.text3 }}>章末钩子</p>
                            <p className="text-[9px]" style={{ color: S.error }}>{chapter.chapterEndHook}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}

// ── Tiptap 富文本编辑器面板 ──────────────────────────────────────────────────
function TiptapEditorPanel({
  block,
  onUpdate,
}: {
  block: ScriptBlock;
  onUpdate: (html: string) => void;
}) {
  const [isSaved, setIsSaved] = useState(true);
  const [wordCount, setWordCount] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  // ── AI Assist: store subscriptions ──
  const apiKeys = useSettingsStore(s => s.apiKeys);
  const aiModel = useSettingsStore(s => s.aiModel);
  const apiBaseUrl = useSettingsStore(s => s.apiBaseUrl);
  const characters = useNarrativeStore(s => s.characters);
  const worldRules = useNarrativeStore(s => s.worldRules);
  const storyNodes = useNarrativeStore(s => s.storyNodes);
  const projectName = getCurrentProject()?.title || "当前项目";
  const addToast = useUIStore(s => s.addToast);

  // ── AI Assist: state ──
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<{
    type: 'continuation' | 'dialogue' | 'consistency';
    content: string;
    items?: any[];
  } | null>(null);
  const [dialogueCharId, setDialogueCharId] = useState<string | null>(null);
  const [showCharPicker, setShowCharPicker] = useState(false);

  const hasApiKey = !!(apiKeys[aiModel] || apiKeys['openai'] || apiKeys['gpt4'] || apiKeys['claude'] || apiKeys['qwen']);

  // ── Tiptap editor (must be before handlers that reference it) ──
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      Highlight.configure({ multicolor: false }),
      Placeholder.configure({ placeholder: "在此编写剧本内容..." }),
    ],
    content: block.content,
    onUpdate: ({ editor: ed }) => {
      setWordCount(ed.state.doc.content.size - 1);
      setIsSaved(false);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        onUpdateRef.current(ed.getHTML());
        setIsSaved(true);
      }, 300);
    },
  });

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (editor) {
      setWordCount(editor.state.doc.content.size - 1);
    }
  }, [editor]);

  // ── AI Assist: handlers ──
  const handleAiContinue = useCallback(async () => {
    if (!editor || aiLoading) return;
    setAiLoading(true);
    setAiResult(null);
    try {
      const ai = AIService.fromSettings({ apiKeys, aiModel, apiBaseUrl });
      const res = await ai.continueScript({
        projectName,
        genre: "互动叙事",
        existingContent: editor.getText(),
        characters: characters.map(c => ({ name: c.name, role: c.role, description: c.description })),
        worldRules: worldRules.map(wr => wr.description || wr.title),
        continuationType: 'continue',
      });
      if (res.success && res.data) {
        setAiResult({ type: 'continuation', content: res.data });
      } else {
        addToast({ type: 'error', title: 'AI 续写失败', message: res.error || '未知错误' });
      }
    } catch (err: any) {
      addToast({ type: 'error', title: 'AI 续写异常', message: err.message || String(err) });
    } finally {
      setAiLoading(false);
    }
  }, [editor, aiLoading, apiKeys, aiModel, apiBaseUrl, projectName, characters, worldRules, addToast]);

  const handleAiDialogue = useCallback(async (charId: string) => {
    if (!editor || aiLoading) return;
    const char = characters.find(c => c.id === charId);
    if (!char) return;
    setAiLoading(true);
    setAiResult(null);
    setShowCharPicker(false);
    try {
      const ai = AIService.fromSettings({ apiKeys, aiModel, apiBaseUrl });
      const res = await ai.generateDialogue({
        characterName: char.name,
        characterRole: char.role,
        characterDescription: char.description,
        situation: editor.getText().slice(-500) || "当前场景",
        otherCharacters: characters.filter(c => c.id !== charId).map(c => ({ name: c.name, role: c.role })),
        dialogueCount: 3,
      });
      if (res.success && res.data) {
        setAiResult({
          type: 'dialogue',
          content: `${char.name}的对话选项`,
          items: res.data,
        });
      } else {
        addToast({ type: 'error', title: 'AI 对白生成失败', message: res.error || '未知错误' });
      }
    } catch (err: any) {
      addToast({ type: 'error', title: 'AI 对白生成异常', message: err.message || String(err) });
    } finally {
      setAiLoading(false);
    }
  }, [editor, aiLoading, apiKeys, aiModel, apiBaseUrl, characters, addToast]);

  const handleAiCheck = useCallback(async () => {
    if (!editor || aiLoading) return;
    setAiLoading(true);
    setAiResult(null);
    try {
      const ai = AIService.fromSettings({ apiKeys, aiModel, apiBaseUrl });
      const res = await ai.checkConsistency({
        projectName,
        worldRules: worldRules.map(wr => wr.description || wr.title),
        newContent: editor.getText(),
        characters: characters.map(c => ({ name: c.name, role: c.role, description: c.description })),
        existingNodes: storyNodes.map(n => n.label || n.id),
      });
      if (res.success && res.data) {
        setAiResult({
          type: 'consistency',
          content: `发现 ${res.data.length} 个一致性问题`,
          items: res.data,
        });
      } else {
        addToast({ type: 'error', title: 'AI 检查失败', message: res.error || '未知错误' });
      }
    } catch (err: any) {
      addToast({ type: 'error', title: 'AI 检查异常', message: err.message || String(err) });
    } finally {
      setAiLoading(false);
    }
  }, [editor, aiLoading, apiKeys, aiModel, apiBaseUrl, projectName, worldRules, characters, storyNodes, addToast]);

  // ── AI Assist: apply/insert helpers ──
  const applyContinuation = useCallback(() => {
    if (!editor || !aiResult) return;
    editor.chain().focus().insertContent(`<p>${aiResult.content.replace(/\n/g, '</p><p>')}</p>`).run();
    setAiResult(null);
  }, [editor, aiResult]);

  const insertDialogue = useCallback((text: string) => {
    if (!editor) return;
    editor.chain().focus().insertContent(`<p>${text}</p>`).run();
  }, [editor]);

  if (!editor) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ background: S.bg }}>
        <p className="text-xs" style={{ color: S.text3 }}>加载编辑器中...</p>
      </div>
    );
  }

  type ToolbarItem = {
    icon: React.ReactNode;
    label: string;
    action: () => void;
    isActive: () => boolean;
  };

  const toolbar: ToolbarItem[] = [
    { icon: <Bold size={14} />, label: "粗体", action: () => editor.chain().focus().toggleBold().run(), isActive: () => editor.isActive("bold") },
    { icon: <Italic size={14} />, label: "斜体", action: () => editor.chain().focus().toggleItalic().run(), isActive: () => editor.isActive("italic") },
    { icon: <UnderlineIcon size={14} />, label: "下划线", action: () => editor.chain().focus().toggleUnderline().run(), isActive: () => editor.isActive("underline") },
    { icon: <Highlighter size={14} />, label: "高亮", action: () => editor.chain().focus().toggleHighlight().run(), isActive: () => editor.isActive("highlight") },
    { icon: null, label: "sep", action: () => {}, isActive: () => false },
    { icon: <Heading1 size={14} />, label: "标题1", action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(), isActive: () => editor.isActive("heading", { level: 1 }) },
    { icon: <Heading2 size={14} />, label: "标题2", action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), isActive: () => editor.isActive("heading", { level: 2 }) },
    { icon: <Heading3 size={14} />, label: "标题3", action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(), isActive: () => editor.isActive("heading", { level: 3 }) },
    { icon: null, label: "sep", action: () => {}, isActive: () => false },
    { icon: <List size={14} />, label: "无序列表", action: () => editor.chain().focus().toggleBulletList().run(), isActive: () => editor.isActive("bulletList") },
    { icon: <ListOrdered size={14} />, label: "有序列表", action: () => editor.chain().focus().toggleOrderedList().run(), isActive: () => editor.isActive("orderedList") },
    { icon: <Quote size={14} />, label: "引用", action: () => editor.chain().focus().toggleBlockquote().run(), isActive: () => editor.isActive("blockquote") },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ background: S.bg }}>
      <style>{`
        .tiptap-script-editor .ProseMirror {
          outline: none;
          min-height: 300px;
          padding: 20px 24px;
          font-size: 14px;
          line-height: 1.8;
          color: ${S.text};
        }
        .tiptap-script-editor .ProseMirror p.is-editor-empty:first-child::before {
          color: ${S.text3};
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }
        .tiptap-script-editor .ProseMirror h1 { font-size: 24px; font-weight: 700; margin: 16px 0 8px; }
        .tiptap-script-editor .ProseMirror h2 { font-size: 20px; font-weight: 700; margin: 14px 0 6px; }
        .tiptap-script-editor .ProseMirror h3 { font-size: 16px; font-weight: 700; margin: 12px 0 4px; }
        .tiptap-script-editor .ProseMirror ul,
        .tiptap-script-editor .ProseMirror ol { padding-left: 24px; margin: 8px 0; }
        .tiptap-script-editor .ProseMirror blockquote {
          border-left: 3px solid ${S.primary};
          padding-left: 16px;
          margin: 8px 0;
          color: ${S.text2};
        }
        .tiptap-script-editor .ProseMirror mark {
          background-color: #FFF3BF;
          border-radius: 2px;
          padding: 0 2px;
        }
        .tiptap-script-editor .ProseMirror p { margin: 4px 0; }
      `}</style>

      {/* Toolbar */}
      <div
        className="flex items-center gap-0.5 px-3 py-2 shrink-0 flex-wrap"
        style={{ background: S.card, borderBottom: `1px solid ${S.border}` }}
      >
        {toolbar.map((item, i) => {
          if (!item.icon) {
            return (
              <div
                key={i}
                className="w-px h-5 mx-1"
                style={{ background: S.border }}
              />
            );
          }
          const active = item.isActive();
          return (
            <motion.button
              key={i}
              whileTap={{ scale: 0.9 }}
              onClick={item.action}
              title={item.label}
              className="p-1.5 rounded-lg focus:outline-none transition-colors"
              style={{
                background: active ? `${S.primary}15` : "transparent",
                color: active ? S.primary : S.text3,
              }}
            >
              {item.icon}
            </motion.button>
          );
        })}
      </div>

      {/* ── AI Assist Toolbar ── */}
      <div
        className="flex items-center gap-1.5 px-3 py-1.5 shrink-0"
        style={{ background: `${S.primary}04`, borderBottom: `1px solid ${S.border}` }}
      >
        <span className="text-[9px] font-bold mr-1" style={{ color: S.text3 }}>AI</span>

        {/* AI 续写 */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleAiContinue}
          disabled={!hasApiKey || aiLoading}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold focus:outline-none transition-opacity"
          style={{
            background: `${S.primary}10`,
            color: !hasApiKey || aiLoading ? S.text3 : S.primary,
            border: `1px solid ${!hasApiKey || aiLoading ? S.border : `${S.primary}25`}`,
            opacity: !hasApiKey || aiLoading ? 0.5 : 1,
            cursor: !hasApiKey || aiLoading ? 'not-allowed' : 'pointer',
          }}
          title={!hasApiKey ? '请先在设置中配置 API Key' : 'AI 续写当前内容'}
        >
          {aiLoading ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
          AI 续写
        </motion.button>

        {/* AI 对白 */}
        <div className="relative">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              if (!hasApiKey || aiLoading) return;
              if (dialogueCharId) {
                handleAiDialogue(dialogueCharId);
              } else {
                setShowCharPicker(v => !v);
              }
            }}
            disabled={!hasApiKey || aiLoading}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold focus:outline-none transition-opacity"
            style={{
              background: `${S.accent}10`,
              color: !hasApiKey || aiLoading ? S.text3 : S.accent,
              border: `1px solid ${!hasApiKey || aiLoading ? S.border : `${S.accent}25`}`,
              opacity: !hasApiKey || aiLoading ? 0.5 : 1,
              cursor: !hasApiKey || aiLoading ? 'not-allowed' : 'pointer',
            }}
            title={!hasApiKey ? '请先在设置中配置 API Key' : '为角色生成对话选项'}
          >
            {aiLoading ? <Loader2 size={11} className="animate-spin" /> : <MessageSquare size={11} />}
            AI 对白
            {dialogueCharId && (
              <span className="text-[8px] ml-0.5 px-1 py-0.5 rounded" style={{ background: `${S.accent}15`, color: S.accent }}>
                {characters.find(c => c.id === dialogueCharId)?.name || ''}
              </span>
            )}
          </motion.button>

          {/* Character picker dropdown */}
          <AnimatePresence>
            {showCharPicker && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="absolute top-full left-0 mt-1 z-50 rounded-xl overflow-hidden shadow-lg"
                style={{ background: S.card, border: `1px solid ${S.border}`, minWidth: 180, maxHeight: 200 }}
              >
                <div className="px-3 py-2 flex items-center justify-between" style={{ borderBottom: `1px solid ${S.border}` }}>
                  <span className="text-[9px] font-bold" style={{ color: S.text3 }}>选择角色</span>
                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowCharPicker(false)} className="p-0.5 focus:outline-none">
                    <X size={10} style={{ color: S.text3 }} />
                  </motion.button>
                </div>
                <div className="overflow-y-auto" style={{ maxHeight: 160 }}>
                  {characters.map(char => (
                    <motion.button
                      key={char.id}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setDialogueCharId(char.id);
                        setShowCharPicker(false);
                        handleAiDialogue(char.id);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left focus:outline-none transition-colors hover:bg-gray-50"
                    >
                      <span className="text-sm">{char.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold truncate" style={{ color: S.text }}>{char.name}</p>
                        <p className="text-[8px] truncate" style={{ color: S.text3 }}>{char.role}</p>
                      </div>
                    </motion.button>
                  ))}
                  {characters.length === 0 && (
                    <div className="px-3 py-4 text-center">
                      <p className="text-[9px]" style={{ color: S.text3 }}>暂无角色，请先添加角色</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* AI 检查 */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleAiCheck}
          disabled={!hasApiKey || aiLoading}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold focus:outline-none transition-opacity"
          style={{
            background: `${S.warning}10`,
            color: !hasApiKey || aiLoading ? S.text3 : S.warning,
            border: `1px solid ${!hasApiKey || aiLoading ? S.border : `${S.warning}25`}`,
            opacity: !hasApiKey || aiLoading ? 0.5 : 1,
            cursor: !hasApiKey || aiLoading ? 'not-allowed' : 'pointer',
          }}
          title={!hasApiKey ? '请先在设置中配置 API Key' : '检查内容一致性'}
        >
          {aiLoading ? <Loader2 size={11} className="animate-spin" /> : <Shield size={11} />}
          AI 检查
        </motion.button>

        {/* Clear result / dismiss */}
        {aiResult && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setAiResult(null)}
            className="ml-auto flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-medium focus:outline-none"
            style={{ background: `${S.text3}10`, color: S.text3 }}
          >
            <X size={10} /> 关闭
          </motion.button>
        )}
      </div>

      {/* ── AI Suggestions Panel ── */}
      <AnimatePresence>
        {aiResult && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden shrink-0"
            style={{ borderBottom: `1px solid ${S.border}` }}
          >
            {/* Continuation result */}
            {aiResult.type === 'continuation' && (
              <div className="px-4 py-3" style={{ background: `${S.primary}04` }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Sparkles size={12} style={{ color: S.primary }} />
                    <span className="text-[10px] font-bold" style={{ color: S.primary }}>AI 续写结果</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={applyContinuation}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold text-white focus:outline-none"
                      style={{ background: S.primary }}
                    >
                      <Check size={10} /> 应用
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setAiResult(null)}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-medium focus:outline-none"
                      style={{ background: S.s2, color: S.text3 }}
                    >
                      丢弃
                    </motion.button>
                  </div>
                </div>
                <div
                  className="p-3 rounded-lg text-[11px] leading-relaxed whitespace-pre-wrap"
                  style={{ background: S.card, border: `1px solid ${S.primary}20`, color: S.text, maxHeight: 180, overflowY: 'auto' }}
                >
                  {aiResult.content}
                </div>
              </div>
            )}

            {/* Dialogue result */}
            {aiResult.type === 'dialogue' && aiResult.items && (
              <div className="px-4 py-3" style={{ background: `${S.accent}04` }}>
                <div className="flex items-center gap-1.5 mb-2">
                  <MessageSquare size={12} style={{ color: S.accent }} />
                  <span className="text-[10px] font-bold" style={{ color: S.accent }}>{aiResult.content}</span>
                </div>
                <div className="space-y-2">
                  {(aiResult.items as DialogueOption[]).map((opt, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2 p-2.5 rounded-lg"
                      style={{ background: S.card, border: `1px solid ${S.accent}15` }}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] leading-relaxed" style={{ color: S.text }}>{opt.text}</p>
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <span
                            className="text-[8px] px-1.5 py-0.5 rounded-full font-bold"
                            style={{ background: `${S.accent}12`, color: S.accent }}
                          >
                            {opt.emotion}
                          </span>
                          {opt.suggestedVariable && (
                            <span
                              className="text-[8px] px-1.5 py-0.5 rounded-full font-mono"
                              style={{ background: `${S.primary}10`, color: S.primary }}
                            >
                              {opt.suggestedVariable.name} {opt.suggestedVariable.change > 0 ? '+' : ''}{opt.suggestedVariable.change}
                            </span>
                          )}
                        </div>
                      </div>
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => insertDialogue(opt.text)}
                        className="shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-bold text-white focus:outline-none"
                        style={{ background: S.accent }}
                      >
                        <Plus size={9} /> 插入
                      </motion.button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Consistency result */}
            {aiResult.type === 'consistency' && aiResult.items && (
              <div className="px-4 py-3" style={{ background: `${S.warning}04` }}>
                <div className="flex items-center gap-1.5 mb-2">
                  <Shield size={12} style={{ color: (aiResult.items as ConsistencyIssue[]).length > 0 ? S.warning : S.success }} />
                  <span className="text-[10px] font-bold" style={{ color: (aiResult.items as ConsistencyIssue[]).length > 0 ? S.warning : S.success }}>
                    {aiResult.content}
                  </span>
                </div>
                {(aiResult.items as ConsistencyIssue[]).length === 0 ? (
                  <div className="p-3 rounded-lg text-center" style={{ background: `${S.success}08` }}>
                    <p className="text-[11px]" style={{ color: S.success }}>未发现一致性问题，内容检查通过。</p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {(aiResult.items as ConsistencyIssue[]).map((issue, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2 p-2.5 rounded-lg"
                        style={{ background: S.card, border: `1px solid ${
                          issue.severity === 'high' ? `${S.error}25` :
                          issue.severity === 'medium' ? `${S.warning}25` : `${S.border}`
                        }` }}
                      >
                        <span
                          className="shrink-0 text-[8px] px-1.5 py-0.5 rounded-full font-bold mt-0.5"
                          style={{
                            background: issue.severity === 'high' ? `${S.error}15` :
                              issue.severity === 'medium' ? `${S.warning}15` : `${S.text3}15`,
                            color: issue.severity === 'high' ? S.error :
                              issue.severity === 'medium' ? S.warning : S.text3,
                          }}
                        >
                          {issue.severity === 'high' ? '严重' : issue.severity === 'medium' ? '警告' : '提示'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-medium" style={{ color: S.text }}>{issue.description}</p>
                          <p className="text-[9px] mt-1" style={{ color: S.text3 }}>
                            建议：{issue.suggestion}
                          </p>
                          {issue.affectedElements.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {issue.affectedElements.map((el, ei) => (
                                <span
                                  key={ei}
                                  className="text-[8px] px-1.5 py-0.5 rounded font-mono"
                                  style={{ background: `${S.primary}08`, color: S.primary }}
                                >
                                  {el}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Editor content area */}
      <div className="flex-1 overflow-y-auto">
        <div className="tiptap-script-editor" style={{ background: S.card, minHeight: "100%" }}>
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* Bottom status bar */}
      <div
        className="flex items-center justify-between px-4 py-1.5 shrink-0"
        style={{ background: S.card, borderTop: `1px solid ${S.border}` }}
      >
        <span className="text-[10px]" style={{ color: S.text3 }}>
          {wordCount} 字
        </span>
        <div className="flex items-center gap-1.5">
          <div
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: isSaved ? S.success : S.warning }}
          />
          <span className="text-[10px]" style={{ color: isSaved ? S.success : S.warning }}>
            {isSaved ? "已同步" : "编辑中..."}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function ScriptScreen() {
  const pathname = usePathname();
  const projectName = getCurrentProject()?.title || "当前项目";
  const narrativeTemplates = NARRATIVE_TEMPLATES.map(t =>
    t.id === 'three-act' ? { ...t, examples: `《${projectName}》当前结构接近三幕式` } : t
  );
  const scriptBlocks = useNarrativeStore(state => state.scriptBlocks);
  const aiSuggestions = useNarrativeStore(state => state.aiSuggestions);
  const updateScriptBlock = useNarrativeStore(state => state.updateScriptBlock);
  const addScriptBlock = useNarrativeStore(state => state.addScriptBlock);
  const [blocks, setBlocks] = useState<ScriptBlock[]>(scriptBlocks);
  const [editId, setEditId] = useState<string|null>(null);
  const [editVal, setEditVal] = useState("");
  const [activeLayer, setActiveLayer] = useState<LayerId>("linear");
  const dialogueTrees = useNarrativeStore(s => s.dialogueTrees);
  const chapterPlans = useNarrativeStore(s => s.chapterPlans);
  const [splitPreview, setSplitPreview] = useState(false);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const currentChapter = chapterPlans[0] ?? null;

  // AI 润色：打开全局 Agent 面板并发送消息
  const sendAi = (msg: string) => {
    const { setPanelOpen, addMessage } = useCanvasAgentStore.getState();
    setPanelOpen(true);
    addMessage({ role: "user", content: msg });
  };

  // 开始内联编辑
  const startEdit = (block: ScriptBlock) => {
    setEditId(block.id);
    setEditVal(block.content);
  };

  // 保存内联编辑 — 同时写入 store
  const saveEdit = (id: string) => {
    setBlocks(bs => bs.map(b => b.id === id ? { ...b, content: editVal } : b));
    updateScriptBlock(id, { content: editVal });
    setEditId(null);
  };

  // ── PlayablePreview (P0-2) ──
  const PlayablePreview = () => {
    const playableGraph = useNarrativeStore(state => state.playableGraph);
    const initVariables = useNarrativeStore(state => state.initVariables);
    const [pNode, setPNode] = useState("N01");
    const [pVars, setPVars] = useState({...initVariables});
    const [pPath, setPPath] = useState(["N01"]);
    const cur = playableGraph[pNode];

    const pChoose = (c: {label:string;next:string;effect:string}) => {
      const nv = {...pVars};
      const m = c.effect.match(/([+-])(\w+)\s+(\d+)/);
      if (m) { const k = m[2]; if (k in nv) (nv as any)[k] = (nv as any)[k] + (m[1]==="+"?1:-1)*parseInt(m[3]); }
      setPVars(nv); setPNode(c.next); setPPath(p => [...p, c.next]);
    };

    const pReset = () => { setPNode("N01"); setPVars({...initVariables}); setPPath(["N01"]); };

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

  // Currently selected block for the Tiptap editor
  const activeBlock = blocks.find(b => b.id === activeBlockId) || null;

  return (
    <div className="h-svh flex flex-col overflow-hidden" style={{ background:S.bg }}>
      <UpstreamReadiness currentPath={pathname} />
      <DataFlowBar page="script" onPushForward={() => {
        pushTransfer('script', 'interaction', 'script→interaction', {
          selectedBlockIds: blocks.map(b => b.id),
          blockTexts: blocks.slice(0, 5).map(b => b.content.slice(0, 100)),
          suggestedNodeTypes: ['choice', 'branch'],
        }, `剧本段落（${blocks.length} 块）→ 互动节点`);
      }} />
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
            {/* ── 左侧边栏：剧本块导航 ── */}
            <div className="shrink-0 flex flex-col overflow-hidden" style={{ width: 220, background: S.card, borderRight: `1px solid ${S.border}` }}>
              <div className="flex items-center justify-between px-3 py-2 shrink-0" style={{ borderBottom: `1px solid ${S.border}` }}>
                <span className="text-[10px] font-bold" style={{ color: S.text }}>剧本段落</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: S.s2, color: S.text3 }}>
                  {blocks.length} 段
                </span>
              </div>
              <div className="flex-1 overflow-y-auto py-1.5 px-2 space-y-0.5">
                {blocks.map(block => (
                  <motion.button
                    key={block.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveBlockId(block.id)}
                    className="w-full text-left px-2.5 py-2 rounded-lg focus:outline-none transition-colors"
                    style={{
                      background: activeBlockId === block.id ? `${S.primary}12` : "transparent",
                      borderLeft: activeBlockId === block.id ? `2.5px solid ${S.primary}` : "2.5px solid transparent",
                    }}
                  >
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span
                        className="text-[8px] font-bold uppercase px-1 py-0.5 rounded"
                        style={{ background: `${block.color}15`, color: block.color }}
                      >
                        {block.label}
                      </span>
                      {block.char && (
                        <span className="text-[9px] font-bold" style={{ color: S.primary }}>{block.char}</span>
                      )}
                    </div>
                    <p
                      className="text-[10px] leading-snug truncate"
                      style={{ color: activeBlockId === block.id ? S.text : S.text3 }}
                    >
                      {block.content.replace(/<[^>]+>/g, "").substring(0, 50) || "空内容"}
                    </p>
                  </motion.button>
                ))}
              </div>
              {/* 添加新块按钮 */}
              <div className="shrink-0 px-2 pb-2">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    const nb: ScriptBlock = {
                      id: `b${Date.now()}`,
                      type: "narr",
                      label: "旁白",
                      color: S.text3,
                      content: "",
                    };
                    setBlocks(bs => [...bs, nb]);
                    addScriptBlock(nb);
                    setActiveBlockId(nb.id);
                  }}
                  className="w-full flex items-center justify-center gap-1 py-2 rounded-lg text-[10px] font-medium border-dashed focus:outline-none"
                  style={{ border: `1.5px dashed ${S.border}`, color: S.text3 }}
                >
                  <Plus size={12} /> 添加内容块
                </motion.button>
              </div>
            </div>

            {/* ── 右侧：编辑器区域 ── */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* 工具栏 */}
              <div className="flex items-center justify-between px-4 py-2 shrink-0"
                style={{ background: S.card, borderBottom: `1px solid ${S.border}` }}>
                <div className="flex items-center gap-2">
                  <h2 className="text-xs font-bold" style={{ color: S.text }}>{chapterPlans[0]?.title || "第一章"}</h2>
                  <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: S.s2, color: S.text3 }}>
                    {blocks.length} 段 · 约 {blocks.reduce((a, b) => a + b.content.replace(/<[^>]+>/g, "").length, 0)} 字
                  </span>
                  {activeLayer === "linear" ? (
                    <span className="text-[9px] px-1.5 py-0.5 rounded font-bold"
                      style={{ background: `${S.primary}10`, color: S.primary }}>
                      <BookOpen size={9} className="inline mr-0.5" style={{ verticalAlign: "-1px" }} />线性阅读
                    </span>
                  ) : (
                    <span className="text-[9px] px-1.5 py-0.5 rounded font-bold"
                      style={{ background: `${S.accent}10`, color: S.accent }}>
                      <GitBranch size={9} className="inline mr-0.5" style={{ verticalAlign: "-1px" }} />互动分支
                      {blocks.filter(b => b.options && b.options.length > 0).length > 0 && (
                        <span className="ml-1 font-mono">
                          {blocks.filter(b => b.options && b.options.length > 0).length} 分支点
                        </span>
                      )}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <motion.button whileTap={{ scale: 0.97 }}
                    onClick={() => sendAi("帮我润色本章全部内容，优化语言表达和情绪节奏")}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold focus:outline-none"
                    style={{ background: `${S.primary}12`, border: `1px solid ${S.primary}25`, color: S.primary }}>
                    ✨ AI润色本章
                  </motion.button>
                  {activeLayer === "interactive" && (
                    <Link href="/nodes">
                      <motion.button whileTap={{ scale: 0.97 }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold focus:outline-none"
                        style={{ background: `${S.accent}12`, border: `1px solid ${S.accent}25`, color: S.accent }}>
                        <GitBranch size={11} /> 转为节点图
                      </motion.button>
                    </Link>
                  )}
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSplitPreview(!splitPreview)}
                    className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg border transition-colors"
                    style={{
                      color: splitPreview ? S.primary : S.text3,
                      borderColor: splitPreview ? S.primary : S.border,
                      background: splitPreview ? `${S.primary}10` : "transparent",
                    }}
                  >
                    <Columns size={12} />
                    分屏预览
                  </motion.button>
                </div>
              </div>

              {/* Split preview wrapper */}
              <div className="flex flex-1 overflow-hidden">
                {/* 主编辑区 - Tiptap 编辑器或空状态 */}
                <div style={{ flex: splitPreview ? '0 0 60%' : '1 1 100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  {activeBlock ? (
                    <TiptapEditorPanel
                      key={activeBlock.id}
                      block={activeBlock}
                      onUpdate={(html) => {
                        setBlocks(bs => bs.map(b => b.id === activeBlock.id ? { ...b, content: html } : b));
                        updateScriptBlock(activeBlock.id, { content: html });
                      }}
                    />
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center" style={{ background: S.bg }}>
                      <Edit2 size={32} style={{ color: S.text3, opacity: 0.3 }} />
                      <p className="text-xs mt-3" style={{ color: S.text3 }}>
                        从左侧选择一个剧本段落开始编辑
                      </p>
                      <p className="text-[10px] mt-1" style={{ color: S.text3, opacity: 0.6 }}>
                        或点击下方按钮创建新的内容块
                      </p>
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={() => {
                          const nb: ScriptBlock = {
                            id: `b${Date.now()}`,
                            type: "narr",
                            label: "旁白",
                            color: S.text3,
                            content: "",
                          };
                          setBlocks(bs => [...bs, nb]);
                          addScriptBlock(nb);
                          setActiveBlockId(nb.id);
                        }}
                        className="mt-4 flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold focus:outline-none"
                        style={{ background: `${S.primary}12`, border: `1px solid ${S.primary}25`, color: S.primary }}
                      >
                        <Plus size={14} /> 创建新内容块
                      </motion.button>
                    </div>
                  )}
                </div>

                {/* 分屏预览 */}
                {splitPreview && (
                  <div className="flex-1 rounded-xl border p-4 overflow-y-auto m-2" style={{ borderColor: S.border, background: S.card }}>
                    <h3 className="text-sm font-semibold mb-3" style={{ color: S.text }}>场景预览</h3>
                    {currentChapter && (
                      <div className="space-y-3">
                        {currentChapter.keyDialogue && (
                          <div><span className="text-xs font-medium" style={{ color: S.text2 }}>关键对白</span><p className="text-xs mt-1" style={{ color: S.text3 }}>{currentChapter.keyDialogue}</p></div>
                        )}
                        {currentChapter.characterStates && (
                          <div><span className="text-xs font-medium" style={{ color: S.text2 }}>角色状态</span><p className="text-xs mt-1" style={{ color: S.text3 }}>{currentChapter.characterStates}</p></div>
                        )}
                        {currentChapter.suspenseHook && (
                          <div><span className="text-xs font-medium" style={{ color: S.text2 }}>悬念钩子</span><p className="text-xs mt-1 p-2 rounded" style={{ color: S.warning, background: "rgba(245,158,11,0.08)" }}>{currentChapter.suspenseHook}</p></div>
                        )}
                        {currentChapter.chapterEndHook && (
                          <div><span className="text-xs font-medium" style={{ color: S.text2 }}>章末钩子</span><p className="text-xs mt-1 p-2 rounded" style={{ color: S.accent, background: "rgba(249,115,22,0.08)" }}>{currentChapter.chapterEndHook}</p></div>
                        )}
                      </div>
                    )}
                  </div>
                )}
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
                {scriptBlocks.length > 0
                  ? scriptBlocks.map(b => b.content).join('\n\n')
                  : "选择剧本块查看原文"}
              </div>
              <p className="text-[9px] text-center mt-3" style={{ color: S.text3 }}>
                原始文本为 AI 从原著中提取的线性叙事，不含互动元素
              </p>
            </div>
          </div>
        )}

        {activeLayer === "playable" && <PlayablePreview />}

        {activeLayer === "chapter" && <ChapterPlanContent />}
      </div>

      {/* Contextual Quick Actions — always visible */}
      <ContextualActions
        actions={[
          { icon: Layers, label: "解构剧本", href: "/parse" },
          { icon: GitBranch, label: "互动设计", href: "/interaction" },
          { icon: Share2, label: "节点视图", href: "/nodes" },
        ]}
      />

      {/* Next Step Navigation */}
      <div className="shrink-0 bg-white border-t border-gray-200 px-6 py-3 flex items-center justify-between"
        style={{ borderColor: S.border }}>
        <span className="text-xs text-gray-500">下一步：设计互动选择</span>
        <Link href="/interaction" className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white" style={{ background: '#7C6CF5' }}>
          进入互动设计 →
        </Link>
      </div>
    </div>
  );
}
