// 右侧 Inspector + AI 节点助手面板
import { useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Sparkles, ChevronDown, ChevronUp } from "lucide-react";

export function InspectorPanel() {
  const [aiOpen, setAiOpen] = useState(true);

  return (
    <div className="flex flex-col h-full overflow-y-auto" style={{ scrollbarWidth: "none" }}>
      {/* Node identity */}
      <div className="px-3 pt-3 pb-2" style={{ borderBottom: "1px solid var(--app-border)" }}>
        <div className="flex items-center gap-2 mb-1">
          <span
            className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
            style={{ background: "rgba(245,158,11,0.15)", color: "var(--app-warning)" }}
          >
            条件节点
          </span>
          <span className="text-[9px]" style={{ color: "var(--app-text-muted)" }}>N07</span>
        </div>
        <h3 className="text-[13px] font-bold" style={{ color: "var(--app-text)" }}>潜行判定</h3>
        <p className="text-[9px] mt-0.5" style={{ color: "var(--app-text-muted)" }}>第一章 · 渗透行动</p>
      </div>

      {/* Error warning */}
      <div className="mx-3 mt-2 px-2.5 py-2 rounded-lg flex items-start gap-2"
        style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)" }}>
        <AlertTriangle size={11} style={{ color: "var(--app-error)", marginTop: 1, flexShrink: 0 }} />
        <span className="text-[9px] leading-snug" style={{ color: "var(--app-error)" }}>
          缺少失败反馈文案：判定失败时玩家没有明确剧情反馈
        </span>
      </div>

      {/* Condition config */}
      <div className="px-3 pt-3 pb-2" style={{ borderBottom: "1px solid var(--app-border)" }}>
        <p className="text-[9px] font-bold uppercase tracking-wider mb-2" style={{ color: "var(--app-text-muted)" }}>
          条件配置
        </p>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[9px]" style={{ color: "var(--app-text-secondary)" }}>检查变量</span>
            <span className="text-[9px] font-bold font-mono" style={{ color: "var(--app-accent)" }}>stealth_score</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[9px]" style={{ color: "var(--app-text-secondary)" }}>运算符</span>
            <span className="text-[9px] font-bold" style={{ color: "var(--app-text)" }}>≥</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[9px]" style={{ color: "var(--app-text-secondary)" }}>比较值</span>
            <span className="text-[9px] font-bold" style={{ color: "var(--app-text)" }}>60</span>
          </div>
        </div>
        <div className="mt-2 space-y-1">
          <div className="flex items-center gap-2 px-2 py-1 rounded"
            style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}>
            <span className="text-[8px] font-bold" style={{ color: "var(--app-success)" }}>真</span>
            <span className="text-[9px]" style={{ color: "var(--app-text-secondary)" }}>→ 数据到手 (N08)</span>
          </div>
          <div className="flex items-center gap-2 px-2 py-1 rounded"
            style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
            <span className="text-[8px] font-bold" style={{ color: "var(--app-error)" }}>假</span>
            <span className="text-[9px]" style={{ color: "var(--app-text-secondary)" }}>→ 身份暴露 (N09)</span>
          </div>
        </div>
      </div>

      {/* Script excerpt */}
      <div className="px-3 pt-2 pb-2" style={{ borderBottom: "1px solid var(--app-border)" }}>
        <p className="text-[9px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--app-text-muted)" }}>
          剧情文本
        </p>
        <p className="text-[10px] leading-relaxed" style={{ color: "var(--app-text-secondary)" }}>
          你没能完全压制动静——警卫察觉了异常……
        </p>
        <motion.button
          whileTap={{ scale: 0.97 }}
          className="mt-1.5 text-[9px] font-medium"
          style={{ color: "var(--app-primary)" }}
        >
          编辑文本
        </motion.button>
      </div>

      {/* Assets status */}
      <div className="px-3 pt-2 pb-2" style={{ borderBottom: "1px solid var(--app-border)" }}>
        <p className="text-[9px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--app-text-muted)" }}>
          素材状态
        </p>
        <div className="space-y-1">
          {[
            { label: "背景图", done: true },
            { label: "BGM", done: false },
            { label: "配音", done: false },
            { label: "视频", done: false },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between">
              <span className="text-[9px]" style={{ color: "var(--app-text-secondary)" }}>{item.label}</span>
              <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded`}
                style={{
                  background: item.done ? "rgba(16,185,129,0.1)" : "rgba(245,158,11,0.1)",
                  color: item.done ? "var(--app-success)" : "var(--app-warning)",
                }}>
                {item.done ? "已生成" : "待补"}
              </span>
            </div>
          ))}
        </div>
        <motion.button
          whileTap={{ scale: 0.97 }}
          className="mt-2 w-full py-1.5 rounded text-[9px] font-medium text-center"
          style={{ background: "rgba(0,212,200,0.08)", border: "1px solid rgba(0,212,200,0.25)", color: "var(--app-accent)" }}
        >
          进入资产库生成
        </motion.button>
      </div>

      {/* AI assistant */}
      <div className="px-3 pt-2 pb-3">
        <button
          className="w-full flex items-center gap-1.5 mb-2 focus:outline-none"
          onClick={() => setAiOpen(!aiOpen)}
        >
          <Sparkles size={10} style={{ color: "var(--app-primary)" }} />
          <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: "var(--app-primary)" }}>
            AI 节点助手
          </span>
          <span className="ml-auto">{aiOpen ? <ChevronUp size={10} style={{ color: "var(--app-text-muted)" }} /> : <ChevronDown size={10} style={{ color: "var(--app-text-muted)" }} />}</span>
        </button>
        {aiOpen && (
          <div className="space-y-1.5">
            {[
              "增加补救分支",
              "生成失败反馈文案",
              "解释变量来源",
              "优化紧张感",
              "检查下游路径",
            ].map((action) => (
              <motion.button
                key={action}
                whileTap={{ scale: 0.97 }}
                className="w-full text-left px-2.5 py-1.5 rounded text-[9px] font-medium focus:outline-none"
                style={{ background: "rgba(123,92,240,0.08)", border: "1px solid rgba(123,92,240,0.18)", color: "var(--app-primary)" }}
              >
                {action}
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
