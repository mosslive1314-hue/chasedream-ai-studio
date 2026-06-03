"use client";
import { motion } from "framer-motion";
import { CheckCircle2, Circle } from "lucide-react";
import Link from "next/link";
import { useNarrativeStore } from "@/store";

const S = {
  primary: "#5E50E8",
  success: "#059669",
  warning: "#D97706",
  text: "#1A1D2E",
  text2: "#4A5068",
  text3: "#8892B0",
  border: "#E2E5F0",
  s2: "#F4F6FC",
};

// 10-step creation journey
const STEPS = [
  { id: "project",    name: "项目创建",  href: "/settings" },
  { id: "import",     name: "素材导入",  href: "/parse" },
  { id: "parse",      name: "剧本解构",  href: "/parse" },
  { id: "script",     name: "剧本编辑",  href: "/script" },
  { id: "interaction",name: "互动设计",  href: "/interaction" },
  { id: "cinematic",  name: "演出设计",  href: "/cinematic" },
  { id: "nodes",      name: "节点编排",  href: "/nodes" },
  { id: "assets",     name: "资产生产",  href: "/assets?tab=image" },
  { id: "qc",         name: "质量验证",  href: "/overview" },
  { id: "publish",    name: "发布交付",  href: "/publish" },
];

// Page route -> which step is "current"
const PAGE_STEP_MAP: Record<string, number> = {
  "/settings": 0,
  "/parse": 2,
  "/script": 3,
  "/interaction": 4,
  "/cinematic": 5,
  "/nodes": 6,
  "/assets": 7,
  "/simulator": 8,
  "/overview": 8,
  "/publish": 9,
};

export function UpstreamReadiness({ currentPath }: { currentPath: string }) {
  const pipelineStages = useNarrativeStore(s => s.pipelineStages);

  // Determine current step index from path
  const basePath = currentPath.split("?")[0];
  const currentStepIdx = PAGE_STEP_MAP[basePath] ?? -1;

  if (currentStepIdx < 0) return null; // Don't show on home/collab/version pages

  // Determine step statuses based on pipeline stages
  const getStepStatus = (idx: number): "done" | "current" | "upcoming" | "blocked" => {
    if (idx < currentStepIdx) {
      // Check if the pipeline stage for this step is completed
      const stage = pipelineStages[idx];
      if (stage && stage.status === "completed") return "done";
      if (stage && stage.progress >= 80) return "done"; // Close enough
      return "done"; // Assume prior steps are done if we're past them
    }
    if (idx === currentStepIdx) return "current";
    return "upcoming";
  };

  // Only show relevant steps (compact: skip if all done or too far)
  const startIdx = Math.max(0, currentStepIdx - 2);
  const endIdx = Math.min(STEPS.length, currentStepIdx + 3);
  const visibleSteps = STEPS.slice(startIdx, endIdx);

  return (
    <div className="flex items-center gap-1 px-4 py-1.5 overflow-x-auto" style={{ borderBottom: `1px solid ${S.border}` }}>
      {startIdx > 0 && (
        <span className="text-[9px] shrink-0" style={{ color: S.text3 }}>...</span>
      )}
      {visibleSteps.map((step, i) => {
        const actualIdx = startIdx + i;
        const status = getStepStatus(actualIdx);
        const StepIcon = status === "done" ? CheckCircle2 : Circle;
        const iconColor = status === "done" ? S.success : status === "current" ? S.primary : S.text3;

        return (
          <div key={step.id} className="flex items-center gap-1 shrink-0">
            {i > 0 && (
              <span className="text-[9px] mx-0.5" style={{ color: S.text3 }}>{"\u2192"}</span>
            )}
            <Link href={step.href} className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full transition-colors hover:opacity-80">
              {status === "current" ? (
                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 2 }}>
                  <Circle size={10} style={{ color: iconColor }} fill={S.primary} />
                </motion.div>
              ) : (
                <StepIcon size={10} style={{ color: iconColor }} fill={status === "done" ? S.success : "none"} />
              )}
              <span className="text-[9px] font-medium whitespace-nowrap"
                style={{ color: status === "current" ? S.primary : status === "done" ? S.text2 : S.text3 }}>
                {step.name}
              </span>
            </Link>
          </div>
        );
      })}
      {endIdx < STEPS.length && (
        <span className="text-[9px] shrink-0" style={{ color: S.text3 }}>...</span>
      )}
    </div>
  );
}
