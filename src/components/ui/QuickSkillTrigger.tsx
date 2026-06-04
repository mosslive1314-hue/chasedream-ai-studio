"use client";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ChevronRight, Zap, BookOpen } from "lucide-react";
import { usePathname } from "next/navigation";
import { SKILLS } from "@/lib/seed/skill-seed";
import { useUIStore } from "@/store";
import type { Skill } from "@/lib/types/skill";

const S = {
  card: "#FFFFFF", s2: "#F4F6FC",
  border: "#E8EAF2", primary: "#7C6CF5", accent: "#00A99D",
  text: "#1A1D2E", text2: "#4A5068", text3: "#8892B0",
  success: "#10B981", warning: "#F59E0B",
};

// 页面路由 → 推荐的 skill domain
const PAGE_SKILL_MAP: Record<string, string[]> = {
  "/script": ["narrative-structure", "dialogue-writing", "plot-development"],
  "/nodes": ["branch-design", "variable-system", "narrative-structure"],
  "/interaction": ["branch-design", "variable-system", "game-mechanics"],
  "/parse": ["text-analysis", "character-extraction"],
  "/story-overview": ["project-planning", "narrative-structure"],
  "/assets": ["visual-design", "asset-management"],
  "/cinematic-editor": ["cinematography", "scene-direction"],
};

interface QuickSkillTriggerProps {
  /** 最大显示数量 */
  maxItems?: number;
  /** 紧凑模式 */
  compact?: boolean;
}

/**
 * 上下文感知技能触发器
 * 根据当前页面路由推荐相关的 AI 技能，支持一键调用
 */
export function QuickSkillTrigger({ maxItems = 3, compact = false }: QuickSkillTriggerProps) {
  const pathname = usePathname();
  const addToast = useUIStore(s => s.addToast);
  const [expandedSkill, setExpandedSkill] = useState<string | null>(null);
  const [runningSkill, setRunningSkill] = useState<string | null>(null);

  // 根据当前页面获取推荐技能
  const recommendedSkills = useMemo(() => {
    const domains = PAGE_SKILL_MAP[pathname] || [];
    if (domains.length === 0) return [];

    return SKILLS.filter(skill => {
      return domains.some(domain =>
        skill.id.includes(domain) ||
        skill.tags?.some(t => domain.includes(t)) ||
        skill.name.toLowerCase().includes(domain.replace("-", " "))
      );
    }).slice(0, maxItems);

    // Fallback: show first few skills if no domain match
  }, [pathname, maxItems]);

  // 如果当前页面没有推荐技能，不显示
  if (recommendedSkills.length === 0) return null;

  const handleRunSkill = async (skill: Skill) => {
    setRunningSkill(skill.id);

    // 模拟技能执行
    await new Promise(resolve => setTimeout(resolve, 2000));

    setRunningSkill(null);
    setExpandedSkill(null);
    addToast({
      type: "success",
      title: "技能执行完成",
      message: `${skill.name} 已执行，结果已生成`,
    });
  };

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        {recommendedSkills.slice(0, 2).map(skill => (
          <motion.button key={skill.id} whileTap={{ scale: 0.95 }}
            onClick={() => handleRunSkill(skill)}
            disabled={runningSkill === skill.id}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[8px] font-bold focus:outline-none"
            style={{
              background: `${S.accent}08`,
              color: S.accent,
              border: `1px solid ${S.accent}20`,
              opacity: runningSkill === skill.id ? 0.5 : 1,
            }}>
            <Sparkles size={8} />
            {skill.name.split("·")[0]?.trim() || skill.name}
          </motion.button>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-md flex items-center justify-center"
          style={{ background: `${S.accent}12` }}>
          <Zap size={11} style={{ color: S.accent }} />
        </div>
        <span className="text-[10px] font-bold" style={{ color: S.text }}>AI 技能推荐</span>
        <span className="text-[8px] px-1.5 py-0.5 rounded"
          style={{ background: `${S.accent}10`, color: S.accent }}>
          {recommendedSkills.length} 个可用
        </span>
      </div>

      {/* Skill cards */}
      <div className="space-y-1.5">
        {recommendedSkills.map(skill => {
          const isExpanded = expandedSkill === skill.id;
          const isRunning = runningSkill === skill.id;

          return (
            <div key={skill.id} className="rounded-xl overflow-hidden"
              style={{ background: S.card, border: `1px solid ${isExpanded ? S.accent : S.border}` }}>
              {/* Skill header */}
              <motion.button whileTap={{ scale: 0.99 }}
                onClick={() => setExpandedSkill(isExpanded ? null : skill.id)}
                className="w-full flex items-center gap-2 px-3 py-2 focus:outline-none text-left">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: `${S.accent}12` }}>
                  <BookOpen size={11} style={{ color: S.accent }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold truncate" style={{ color: S.text }}>{skill.name}</p>
                  <p className="text-[8px] truncate" style={{ color: S.text3 }}>{skill.description}</p>
                </div>
                <ChevronRight size={10} style={{
                  color: S.text3,
                  transform: isExpanded ? "rotate(90deg)" : "none",
                  transition: "0.15s",
                }} />
              </motion.button>

              {/* Expanded detail */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden">
                    <div className="px-3 pb-3 space-y-2" style={{ borderTop: `1px solid ${S.border}` }}>
                      {/* Skill metadata */}
                      <div className="flex items-center gap-1.5 pt-2">
                        {skill.tags?.slice(0, 3).map(tag => (
                          <span key={tag} className="text-[7px] px-1.5 py-0.5 rounded font-bold"
                            style={{ background: `${S.primary}08`, color: S.primary }}>
                            {tag}
                          </span>
                        ))}
                        <span className="text-[7px]" style={{ color: S.text3 }}>
                          · {skill.workflow?.length ? `${skill.workflow.length} 步工作流` : "快速执行"}
                        </span>
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-2">
                        <motion.button whileTap={{ scale: 0.95 }}
                          onClick={() => handleRunSkill(skill)}
                          disabled={isRunning}
                          className="flex-1 py-2 rounded-lg text-[10px] font-bold text-white focus:outline-none flex items-center justify-center gap-1"
                          style={{
                            background: isRunning ? S.text3 : S.accent,
                            boxShadow: `0 2px 8px ${S.accent}30`,
                          }}>
                          {isRunning ? (
                            <>
                              <motion.div animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                                <Sparkles size={10} />
                              </motion.div>
                              执行中...
                            </>
                          ) : (
                            <>
                              <Zap size={10} /> 一键执行
                            </>
                          )}
                        </motion.button>
                        <motion.button whileTap={{ scale: 0.95 }}
                          onClick={() => setExpandedSkill(null)}
                          className="px-3 py-2 rounded-lg text-[10px] font-medium focus:outline-none"
                          style={{ background: S.s2, color: S.text3, border: `1px solid ${S.border}` }}>
                          取消
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Footer link to full library */}
      <p className="text-[8px] text-center" style={{ color: S.text3 }}>
        按 <kbd className="px-1 py-0.5 rounded font-mono" style={{ background: S.s2, border: `1px solid ${S.border}` }}>⌘⇧K</kbd> 打开完整技能库
      </p>
    </div>
  );
}
