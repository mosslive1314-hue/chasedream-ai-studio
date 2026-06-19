/**
 * DSL 编译面板 — 让用户在剧本编辑器中编写 DSL 并编译到节点图
 */

"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Terminal, Play, AlertCircle, CheckCircle, ChevronRight } from "lucide-react";
import { compileScript, applyToStore, type CompileResult } from "@/lib/dsl";
import { useNavigate } from "@tanstack/react-router";

const S = {
  primary: "#7C6CF5",
  accent: "#00A99D",
  text: "#1A1D2E",
  text2: "#4A5068",
  text3: "#8892B0",
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
  bg: "#F5F6FA",
  card: "#FFFFFF",
  border: "#E8EAF2",
};

const SAMPLE_DSL = `#start
老师: 欢迎来到互动叙事设计课程。
: 今天我们将学习如何设计分支剧情。
@choice()
- "继续听讲" -> #lesson
- "直接提问" -> #question
@end

#lesson
老师: 分支叙事的核心是让玩家的选择有意义。
@set trust += 5
@jump(#ending)

#question
老师: 好问题！分支设计的关键在于后果。
@set trust -= 3
@jump(#ending)

#ending
@if(trust >= 5)
    @ending good
@else
    @ending bad
@end`;

export function DslCompilerPanel() {
  const navigate = useNavigate();
  const [source, setSource] = useState(SAMPLE_DSL);
  const [result, setResult] = useState<CompileResult | null>(null);
  const [compiling, setCompiling] = useState(false);

  const handleCompile = useCallback(() => {
    setCompiling(true);
    try {
      const res = compileScript(source);
      setResult(res);
    } catch (err) {
      setResult({
        nodes: [], edges: [], errors: [String(err)], warnings: [], labelMap: new Map(),
      });
    } finally {
      setCompiling(false);
    }
  }, [source]);

  const handleApply = useCallback(() => {
    if (!result || result.errors.length > 0) return;
    applyToStore(result);
    navigate({ to: "/nodes" });
  }, [result, navigate]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3">
      <div className="max-w-2xl mx-auto">
        {/* 标题栏 */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Terminal size={14} style={{ color: S.primary }} />
            <span className="text-xs font-bold" style={{ color: S.text }}>
              DSL 脚本编译器
            </span>
            <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: `${S.primary}12`, color: S.primary }}>
              .dfstory
            </span>
          </div>
          <div className="flex gap-2">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleCompile}
              disabled={compiling}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold text-white"
              style={{ background: S.primary }}
            >
              <Play size={11} /> 编译
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleApply}
              disabled={!result || result.errors.length > 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold text-white"
              style={{
                background: !result || result.errors.length > 0 ? "#CBD5E1" : S.accent,
              }}
            >
              <ChevronRight size={11} /> 写入节点图
            </motion.button>
          </div>
        </div>

        {/* 编辑器 */}
        <textarea
          value={source}
          onChange={(e) => setSource(e.target.value)}
          spellCheck={false}
          className="w-full h-64 p-3 rounded-lg font-mono text-[11px] leading-relaxed resize-y focus:outline-none"
          style={{
            background: "#1E1E2E",
            color: "#CDD6F4",
            border: `1px solid ${S.border}`,
          }}
          placeholder="在此编写 DSL 脚本..."
        />

        {/* 编译结果 */}
        {result && (
          <div className="mt-3 space-y-2">
            {/* 统计 */}
            <div className="flex gap-3 text-[10px]" style={{ color: S.text2 }}>
              <span>节点: <b style={{ color: S.text }}>{result.nodes.length}</b></span>
              <span>边: <b style={{ color: S.text }}>{result.edges.length}</b></span>
              <span>标签: <b style={{ color: S.text }}>{result.labelMap.size}</b></span>
            </div>

            {/* 错误 */}
            {result.errors.map((err, i) => (
              <div key={`err-${i}`} className="flex items-start gap-2 p-2 rounded-lg text-[10px]"
                style={{ background: `${S.error}08`, border: `1px solid ${S.error}30`, color: S.error }}>
                <AlertCircle size={12} className="mt-0.5 shrink-0" />
                <span>{err}</span>
              </div>
            ))}

            {/* 警告 */}
            {result.warnings.map((warn, i) => (
              <div key={`warn-${i}`} className="flex items-start gap-2 p-2 rounded-lg text-[10px]"
                style={{ background: `${S.warning}08`, border: `1px solid ${S.warning}30`, color: S.warning }}>
                <AlertCircle size={12} className="mt-0.5 shrink-0" />
                <span>{warn}</span>
              </div>
            ))}

            {/* 成功 */}
            {result.errors.length === 0 && result.nodes.length > 0 && (
              <div className="flex items-center gap-2 p-2 rounded-lg text-[10px]"
                style={{ background: `${S.success}08`, border: `1px solid ${S.success}30`, color: S.success }}>
                <CheckCircle size={12} />
                <span>编译成功！{result.nodes.length} 个节点，{result.edges.length} 条边。点击"写入节点图"应用到项目。</span>
              </div>
            )}
          </div>
        )}

        {/* 语法速查 */}
        <details className="mt-3">
          <summary className="text-[10px] cursor-pointer" style={{ color: S.text3 }}>
            DSL 语法速查
          </summary>
          <div className="mt-2 p-3 rounded-lg text-[10px] font-mono space-y-1" style={{ background: S.bg, color: S.text2 }}>
            <div>#标签名 — 定义入口/场景标签</div>
            <div>角色名: 对白文本 — 角色对白</div>
            <div>: 旁白文本 — 旁白</div>
            <div>@choice() ... @end — 选项块</div>
            <div>- "选项文本" -&gt; #标签 — 选项</div>
            <div>@if(条件) ... @elif(条件) ... @else ... @end — 条件分支</div>
            <div>@set 变量 += 值 — 变量操作</div>
            <div>@ending good / @ending bad — 结局</div>
            <div>@jump(#标签) — 跳转</div>
            <div>@bg(资产ID) / @bgm(资产ID) — 背景/音乐</div>
          </div>
        </details>
      </div>
    </div>
  );
}
