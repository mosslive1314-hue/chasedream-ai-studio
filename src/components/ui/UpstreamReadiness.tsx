"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { useNarrativeStore } from "@/store";

const S = {
  primary: "#5E50E8",
  success: "#059669",
  text: "#1A1D2E",
  text2: "#4A5068",
  text3: "#8892B0",
  border: "#E2E5F0",
};

/** Map base route path -> pipeline stage index (0-based) */
const PAGE_STAGE_MAP: Record<string, number> = {
  "/settings": 0,
  "/parse": 1,
  "/story-overview": 0,
  "/script": 2,
  "/interaction": 6,
  "/cinematic": 7,
  "/nodes": 8,
  "/assets": 9,
  "/simulator": 10,
  "/overview": 10,
  "/publish": 11,
};

export function UpstreamReadiness({ currentPath }: { currentPath: string }) {
  const stages = useNarrativeStore((s) => s.pipelineStages);

  const basePath = currentPath.split("?")[0];
  const currentIdx = PAGE_STAGE_MAP[basePath] ?? -1;

  if (currentIdx < 0 || !stages.length) return null;

  const current = stages[currentIdx];
  const prev = currentIdx > 0 ? stages[currentIdx - 1] : null;
  const next = currentIdx < stages.length - 1 ? stages[currentIdx + 1] : null;
  const completedCount = stages.filter((s) => s.status === "completed").length;
  const total = stages.length;

  return (
    <div
      className="flex items-center px-4 py-2"
      style={{
        height: 36,
        background: "rgba(250,251,255,0.92)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: `1px solid ${S.border}`,
      }}
    >
      {/* Previous stage */}
      {prev && prev.linkedPage && (
        <Link
          href={prev.linkedPage}
          className="flex items-center gap-1 shrink-0 hover:opacity-70 transition-opacity"
        >
          <span style={{ fontSize: 10, color: S.text3 }}>{"\u2190"}</span>
          <span
            style={{ fontSize: 9, color: S.text3 }}
            className="whitespace-nowrap"
          >
            {prev.name}
          </span>
        </Link>
      )}

      {/* Separator gap */}
      {prev && <div className="w-3 shrink-0" />}

      {/* Current stage (focal point) */}
      <div className="flex items-center gap-1.5 shrink-0">
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            backgroundColor: S.primary,
          }}
        />
        <span
          style={{ fontSize: 10, fontWeight: 700, color: S.primary }}
          className="whitespace-nowrap"
        >
          {current.name}
        </span>
        <span
          style={{ fontSize: 9, color: S.primary, opacity: 0.7 }}
          className="whitespace-nowrap"
        >
          {current.progress}%
        </span>
      </div>

      {/* Separator gap */}
      {next && <div className="w-3 shrink-0" />}

      {/* Next stage */}
      {next && next.linkedPage && (
        <Link
          href={next.linkedPage}
          className="flex items-center gap-1 shrink-0 hover:opacity-70 transition-opacity"
        >
          <span
            style={{ fontSize: 9, color: S.text3 }}
            className="whitespace-nowrap"
          >
            {next.name}
          </span>
          <span style={{ fontSize: 10, color: S.text3 }}>{"\u2192"}</span>
        </Link>
      )}

      {/* Spacer pushes dots + counter to the right */}
      <div className="flex-1 min-w-4" />

      {/* Overview dots */}
      <div className="flex items-center gap-1 shrink-0">
        {stages.map((stage, i) => {
          const isCompleted = stage.status === "completed";
          const isCurrent = i === currentIdx;

          if (isCurrent) {
            return (
              <Link
                key={stage.id}
                href={stage.linkedPage || "#"}
                className="block"
              >
                <motion.div
                  animate={{ scale: [1, 1.4, 1] }}
                  transition={{
                    repeat: Infinity,
                    duration: 2,
                    ease: "easeInOut",
                  }}
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    backgroundColor: S.primary,
                  }}
                />
              </Link>
            );
          }

          return (
            <Link
              key={stage.id}
              href={stage.linkedPage || "#"}
              className="block"
            >
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  backgroundColor: isCompleted ? S.success : "transparent",
                  border: isCompleted
                    ? "none"
                    : `1px solid ${S.text3}`,
                  opacity: isCompleted ? 1 : 0.4,
                }}
              />
            </Link>
          );
        })}
      </div>

      {/* Counter */}
      <span
        className="shrink-0 ml-2 whitespace-nowrap"
        style={{ fontSize: 9, color: S.text3 }}
      >
        {completedCount}/{total}
      </span>
    </div>
  );
}
