/**
 * Agent Orchestrator — Expert 路由与 Skill 加载编排器
 *
 * 负责：
 * 1. 根据当前页面路由自动激活对应 Expert
 * 2. 为活跃 Expert 加载相关 Skill
 * 3. 评估 Expert 主动建议规则
 * 4. 管理 Expert 间协作 (handoff)
 */

import type { Expert, ProactiveRule } from "@/lib/types/expert";
import type { Skill } from "@/lib/types/skill";
import { EXPERTS } from "@/lib/seed/expert-seed";
import { SKILLS, SKILL_PIPELINE_MAPPINGS } from "@/lib/seed/skill-seed";

// ── 页面 → 管线阶段映射（复用 UpstreamReadiness 的 PAGE_STAGE_MAP）─────────

const PAGE_STAGE_MAP: Record<string, number> = {
  "/my-works": 0,
  "/parse": 1,
  "/story-overview": 2,
  "/script": 4,
  "/interaction": 5,
  "/nodes": 7,
  "/assets": 8,
  "/simulator": 9,
  "/overview": 10,
  "/publish": 11,
  "/studio": 2,  // Studio 是统一工作台，默认映射到剧本总览阶段（可被 Expert 选择器覆盖）
};

// ── Expert 路由 ──────────────────────────────────────────────────────────

export type RoutingStrategy = "auto" | "manual" | "pipeline-driven";

/**
 * 根据当前页面路径获取对应的管线阶段
 */
export function getPageStage(pathname: string): number {
  const basePath = pathname.replace(/\/$/, "") || "/";
  return PAGE_STAGE_MAP[basePath] ?? -1;
}

/**
 * 根据管线阶段自动选择 Expert
 * 返回所有负责该阶段的 Expert（可能有多个）
 */
export function getExpertsForStage(stageIndex: number): Expert[] {
  if (stageIndex < 0) return [];
  return EXPERTS.filter(e => e.pipelineStages.includes(stageIndex));
}

/**
 * 获取当前页面的推荐 Expert（取第一个匹配的）
 */
export function getRecommendedExpert(pathname: string): Expert | null {
  const stage = getPageStage(pathname);
  const experts = getExpertsForStage(stage);
  return experts.length > 0 ? experts[0] : null;
}

/**
 * 根据关键词匹配 Expert
 */
export function matchExpertByKeywords(text: string): Expert | null {
  const lowerText = text.toLowerCase();
  let bestMatch: Expert | null = null;
  let bestScore = 0;

  for (const expert of EXPERTS) {
    let score = 0;
    for (const trigger of expert.activationTriggers) {
      if (lowerText.includes(trigger.toLowerCase())) {
        score += 1;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = expert;
    }
  }

  return bestScore > 0 ? bestMatch : null;
}

// ── Skill 加载 ────────────────────────────────────────────────────────────

/**
 * 获取指定管线阶段的自动加载 Skill
 */
export function getAutoLoadSkills(stageIndex: number): Skill[] {
  const mapping = SKILL_PIPELINE_MAPPINGS.find(m => m.stageIndex === stageIndex);
  if (!mapping || !mapping.autoLoad) return [];
  return mapping.recommendedSkillIds
    .map(id => SKILLS.find(s => s.id === id))
    .filter((s): s is Skill => s !== undefined);
}

/**
 * 获取 Expert 关联的所有 Skill
 */
export function getExpertSkills(expert: Expert): Skill[] {
  return expert.domainSkills
    .map(id => SKILLS.find(s => s.id === id))
    .filter((s): s is Skill => s !== undefined);
}

/**
 * 为指定 Expert 和阶段加载所有相关 Skill（Expert 自身 + 阶段自动加载）
 */
export function loadSkillsForContext(expert: Expert, stageIndex: number): Skill[] {
  const expertSkills = getExpertSkills(expert);
  const stageSkills = getAutoLoadSkills(stageIndex);

  // 合并去重
  const seen = new Set<string>();
  const merged: Skill[] = [];
  for (const skill of [...expertSkills, ...stageSkills]) {
    if (!seen.has(skill.id)) {
      seen.add(skill.id);
      merged.push(skill);
    }
  }
  return merged;
}

// ── 主动建议评估 ──────────────────────────────────────────────────────────

export interface ProactiveEvaluation {
  expert: Expert;
  rule: ProactiveRule;
  message: string;
  priority: "high" | "medium" | "low";
}

/**
 * 冷却记录：ruleId → 上次触发的时间戳
 */
const cooldownMap = new Map<string, number>();

/**
 * 评估所有 Expert 的主动建议规则
 *
 * @param experts 当前活跃的 Expert 列表
 * @param context 创作上下文数据（各 store 的数据片段）
 * @returns 触发的建议列表
 */
export function evaluateProactiveRules(
  experts: Expert[],
  context: Record<string, unknown>,
): ProactiveEvaluation[] {
  const now = Date.now();
  const results: ProactiveEvaluation[] = [];

  for (const expert of experts) {
    for (const rule of expert.proactiveRules) {
      // 检查冷却
      const lastTriggered = cooldownMap.get(rule.id) ?? 0;
      if (now - lastTriggered < rule.cooldownSeconds * 1000) continue;

      // 评估条件
      try {
        const triggered = evaluateCondition(rule.condition, context);
        if (triggered) {
          const message = interpolateMessage(rule.messageTemplate, context);
          results.push({
            expert,
            rule,
            message,
            priority: rule.priority,
          });
          cooldownMap.set(rule.id, now);
        }
      } catch {
        // 条件评估失败，跳过
      }
    }
  }

  // 按优先级排序：high > medium > low
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  results.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return results;
}

/**
 * 简单条件评估器
 * 支持 basic JS expression against context object
 */
function evaluateCondition(condition: string, context: Record<string, unknown>): boolean {
  // Build a simple evaluator using context properties
  // We evaluate conditions like "scriptBlocks.length > 20 && interactionPoints.length < 3"
  try {
    const keys = Object.keys(context);
    const values = Object.values(context);
     
    const fn = new Function(...keys, `return (${condition});`);
    return fn(...values);
  } catch {
    return false;
  }
}

/**
 * 简单消息模版插值
 * 替换 {propertyName} 为 context 中对应的值
 */
function interpolateMessage(template: string, context: Record<string, unknown>): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    const value = context[key];
    if (value === undefined || value === null) return match;
    if (Array.isArray(value)) return String(value.length);
    return String(value);
  });
}

// ── Expert Context Builder（构建发送给 Expert 的上下文摘要）───────────────

export interface ExpertContext {
  /** 当前 Expert */
  expert: Expert;
  /** 当前页面路径 */
  pathname: string;
  /** 管线阶段 */
  stageIndex: number;
  /** 已加载的 Skill */
  loadedSkills: Skill[];
  /** 上下文数据摘要 */
  dataSummary: Record<string, number | string>;
}

/**
 * 从多个 Zustand store 中提取数据摘要，构建 Expert 上下文
 */
export function buildExpertContext(
  expert: Expert,
  pathname: string,
  storeSnapshot: Record<string, unknown>,
): ExpertContext {
  const stageIndex = getPageStage(pathname);
  const loadedSkills = loadSkillsForContext(expert, stageIndex);

  // 提取数据摘要
  const dataSummary: Record<string, number | string> = {};
  for (const [key, value] of Object.entries(storeSnapshot)) {
    if (Array.isArray(value)) {
      dataSummary[key] = value.length;
    } else if (typeof value === "number" || typeof value === "string") {
      dataSummary[key] = value;
    }
  }

  return {
    expert,
    pathname,
    stageIndex,
    loadedSkills,
    dataSummary,
  };
}

// ── 常量导出 ──────────────────────────────────────────────────────────────

/** 所有可用 Expert */
export const ALL_EXPERTS = EXPERTS;

/** 所有可用 Skill */
export const ALL_SKILLS = SKILLS;
