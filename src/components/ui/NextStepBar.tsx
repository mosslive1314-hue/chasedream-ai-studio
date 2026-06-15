
import { Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, Circle } from "lucide-react";
import { useNarrativeStore } from "@/store";

export interface NextStepDef {
  label: string;
  href: string;
  description: string;
  checkKey: keyof Pick<
    ReturnType<typeof useNarrativeStore.getState>,
    | "characters"
    | "scriptBlocks"
    | "interactionPoints"
    | "storyNodes"
    | "assetCards"
    | "cinematicDirections"
    | "pathTestResults"
    | "qualityChecks"
  >;
}

/** 页面主题色 — 与各 screen-theme 保持一致的色值键 */
export interface NextStepBarTheme {
  card: string;
  s2: string;
  border: string;
  primary: string;
  text: string;
  text2: string;
  text3: string;
  error: string;
}

const NEXT_STEP_MAP: Record<string, NextStepDef> = {
  "/parse": {
    label: "编辑剧本",
    href: "/script",
    description: "角色和场景已导入，开始编辑剧本块和对白",
    checkKey: "characters",
  },
  "/script": {
    label: "设计互动",
    href: "/interaction",
    description: "剧本就绪，设计互动选择点和后果链",
    checkKey: "scriptBlocks",
  },
  "/interaction": {
    label: "构建图谱",
    href: "/nodes",
    description: "互动点已定义，构建节点图谱和路径",
    checkKey: "interactionPoints",
  },
  "/nodes": {
    label: "演出设计",
    href: "/cinematic",
    description: "节点图完成，设计镜头、演出和音频",
    checkKey: "storyNodes",
  },
  "/cinematic": {
    label: "演出预览",
    href: "/simulator",
    description: "演出设计完成，试玩验证流程",
    checkKey: "cinematicDirections",
  },
  "/simulator": {
    label: "查看质检",
    href: "/overview",
    description: "试玩完成，查看质检报告",
    checkKey: "pathTestResults",
  },
  "/overview": {
    label: "准备发布",
    href: "/publish",
    description: "质检通过，准备导出和发布",
    checkKey: "qualityChecks",
  },
};

// 所有可能用到的 checkKey，保证 hook 调用顺序稳定
const ALL_CHECK_KEYS: NextStepDef["checkKey"][] = [
  "characters",
  "scriptBlocks",
  "interactionPoints",
  "storyNodes",
  "assetCards",
  "cinematicDirections",
  "pathTestResults",
  "qualityChecks",
];

export function NextStepBar({
  currentPath,
  theme,
}: {
  currentPath: string;
  theme?: NextStepBarTheme;
}) {
  const cleanPath = currentPath.split("?")[0];
  const nextStep = NEXT_STEP_MAP[cleanPath];

  // ✅ 所有 hooks 必须在条件返回之前调用 — 遵守 React Rules of Hooks
  const characters = useNarrativeStore((s) => s.characters);
  const scriptBlocks = useNarrativeStore((s) => s.scriptBlocks);
  const interactionPoints = useNarrativeStore((s) => s.interactionPoints);
  const storyNodes = useNarrativeStore((s) => s.storyNodes);
  const assetCards = useNarrativeStore((s) => s.assetCards);
  const cinematicDirections = useNarrativeStore((s) => s.cinematicDirections);
  const pathTestResults = useNarrativeStore((s) => s.pathTestResults);
  const qualityChecks = useNarrativeStore((s) => s.qualityChecks);

  if (!nextStep) return null;

  // 根据 checkKey 获取对应数据
  const dataMap: Record<NextStepDef["checkKey"], unknown> = {
    characters,
    scriptBlocks,
    interactionPoints,
    storyNodes,
    assetCards,
    cinematicDirections,
    pathTestResults,
    qualityChecks,
  };
  const data = dataMap[nextStep.checkKey];
  const hasData = Array.isArray(data) && data.length > 0;

  // 使用传入主题或全局 CSS 变量回退
  const t = theme ?? {
    card: "var(--surface, #fff)",
    s2: "var(--surface-2, #f4f6fc)",
    border: "var(--border, #e2e5f0)",
    primary: "var(--primary, #5e50e8)",
    text: "var(--text, #1a1d2e)",
    text2: "var(--text-2, #4a5068)",
    text3: "var(--text-3, #8892b0)",
    error: "var(--error, #dc2626)",
  };

  return (
    <div
      className="flex items-center gap-3 border-t px-4 py-2.5"
      style={{
        background: t.card,
        borderColor: t.border,
      }}
    >
      <div className="flex items-center gap-2 text-xs" style={{ color: t.text3 }}>
        {hasData ? (
          <CheckCircle2 size={14} style={{ color: "#059669" }} />
        ) : (
          <Circle size={14} />
        )}
        <span>{hasData ? "当前步骤有数据" : "当前步骤尚无数据"}</span>
      </div>

      <div className="mx-2 h-4 w-px" style={{ background: t.border }} />

      <span className="text-xs" style={{ color: t.text2 }}>下一步:</span>

      <Link
        to={nextStep.href}
        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors hover:opacity-90"
        style={{
          background: t.s2,
          border: `1px solid ${t.border}`,
          color: t.text,
        }}
      >
        {nextStep.label}
        <ArrowRight size={12} />
      </Link>

      <span className="text-xs" style={{ color: t.text3 }}>
        {nextStep.description}
      </span>
    </div>
  );
}
