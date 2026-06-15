// 底部 AI 任务控制台
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronUp, ChevronDown, Loader2, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";

const TASKS = [
  { id: "bgm",    label: "生成 · 警卫逼近 BGM",    status: "running",  progress: 45 },
  { id: "video",  label: "排队 · 暗夜通道视频",      status: "queued",   progress: 0 },
  { id: "img1",   label: "完成 · 序章背景图",        status: "done",     progress: 100 },
  { id: "img2",   label: "完成 · 任务简报背景图",    status: "done",     progress: 100 },
  { id: "voice",  label: "失败 · 身份暴露配音",      status: "error",    progress: 0 },
];

const STATUS_CFG = {
  running: { color: "var(--app-primary)",  bg: "rgba(123,92,240,0.12)", icon: null },
  queued:  { color: "var(--app-text-muted)", bg: "rgba(148,163,184,0.1)", icon: null },
  done:    { color: "var(--app-success)",  bg: "rgba(16,185,129,0.12)", icon: null },
  error:   { color: "var(--app-error)",    bg: "rgba(239,68,68,0.12)",  icon: null },
};

export function TaskConsole() {
  const [expanded, setExpanded] = useState(false);

  const running = TASKS.filter(t => t.status === "running").length;
  const errors  = TASKS.filter(t => t.status === "error").length;

  return (
    <div
      className="flex flex-col"
      style={{
        borderTop: "1px solid var(--app-border)",
        background: "var(--app-surface)",
      }}
    >
      {/* Header bar */}
      <button
        className="flex items-center gap-3 px-3 py-1.5 focus:outline-none"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: "var(--app-text-muted)" }}>
          AI 任务队列
        </span>
        <div className="flex items-center gap-2">
          {running > 0 && (
            <span className="flex items-center gap-1 text-[8px] font-bold px-1.5 py-0.5 rounded-full animate-pulse"
              style={{ background: "rgba(123,92,240,0.15)", color: "var(--app-primary)" }}>
              <Loader2 size={8} className="animate-spin" /> {running} 进行中
            </span>
          )}
          {errors > 0 && (
            <span className="flex items-center gap-1 text-[8px] font-bold px-1.5 py-0.5 rounded-full"
              style={{ background: "rgba(239,68,68,0.15)", color: "var(--app-error)" }}>
              {errors} 失败
            </span>
          )}
        </div>
        <span className="ml-auto" style={{ color: "var(--app-text-muted)" }}>
          {expanded ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
        </span>
      </button>

      {/* Expanded task list */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-2 space-y-1.5 max-h-36 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
              {TASKS.map((task) => {
                const cfg = STATUS_CFG[task.status as keyof typeof STATUS_CFG];
                return (
                  <div key={task.id} className="flex items-center gap-2">
                    {/* Status indicator */}
                    <div className="shrink-0">
                      {task.status === "running" && <Loader2 size={10} className="animate-spin" style={{ color: cfg.color }} />}
                      {task.status === "done"    && <CheckCircle size={10} style={{ color: cfg.color }} />}
                      {task.status === "error"   && <AlertCircle size={10} style={{ color: cfg.color }} />}
                      {task.status === "queued"  && <div className="w-2.5 h-2.5 rounded-full border" style={{ borderColor: cfg.color }} />}
                    </div>

                    {/* Label + progress */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[9px] truncate" style={{ color: cfg.color }}>{task.label}</span>
                        {task.status === "running" && (
                          <span className="text-[8px] ml-1 shrink-0" style={{ color: cfg.color }}>{task.progress}%</span>
                        )}
                      </div>
                      {task.status === "running" && (
                        <div className="w-full h-0.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                          <motion.div
                            className="h-full rounded-full"
                            style={{ width: `${task.progress}%`, background: "var(--app-primary)" }}
                            animate={{ width: `${task.progress}%` }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Retry button for errors */}
                    {task.status === "error" && (
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        className="shrink-0 p-0.5 rounded focus:outline-none"
                        title="重试"
                      >
                        <RefreshCw size={9} style={{ color: "var(--app-error)" }} />
                      </motion.button>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
