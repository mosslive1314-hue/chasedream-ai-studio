"use client";

import { useState, useMemo } from "react";
import { X, Download, FileText, Loader2, Check, AlertCircle, FileCode2 } from "lucide-react";
import { useExportStore } from "@/store";
import { useNarrativeStore } from "@/store";
import { hasAdapter, getImplementedFormats } from "@/lib/export/adapters";
import type { ExportFormatId, ExportFormat, ExportOption } from "@/lib/types/export-engine";

interface ExportPanelProps {
  onClose: () => void;
}

// 已实现的格式（真实适配器）
const IMPLEMENTED: ExportFormatId[] = getImplementedFormats();

// 格式图标
function FormatIcon({ id, className }: { id: ExportFormatId; className?: string }) {
  if (id === "json") return <FileCode2 className={className} />;
  return <FileText className={className} />;
}

// 单个选项渲染
function OptionField({
  option,
  value,
  onChange,
}: {
  option: ExportOption;
  value: string | boolean | number;
  onChange: (v: string | boolean | number) => void;
}) {
  if (option.type === "boolean") {
    return (
      <label className="flex cursor-pointer items-center gap-2 text-xs text-zinc-300">
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
          className="h-3.5 w-3.5 rounded border-zinc-700 bg-zinc-900 accent-orange-500"
        />
        <span>{option.label}</span>
      </label>
    );
  }
  if (option.type === "select" && option.choices) {
    return (
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="text-zinc-400">{option.label}</span>
        <select
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
          className="rounded bg-zinc-900 px-2 py-1 text-xs text-zinc-200 outline-none border border-zinc-800 focus:border-orange-500"
        >
          {option.choices.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
    );
  }
  return null;
}

// 触发浏览器下载
function triggerDownload(fileName: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// 导出面板：连接真实适配器，支持 4 种格式
export function ExportPanel({ onClose }: ExportPanelProps) {
  const formats = useExportStore((s) => s.formats);
  const runExport = useExportStore((s) => s.runExport);
  const recentJobs = useExportStore((s) => s.jobs);
  const storyNodesCount = useNarrativeStore((s) => s.storyNodes.length);
  const variablesCount = useNarrativeStore((s) => s.variables.length);
  const charactersCount = useNarrativeStore((s) => s.characters.length);

  // 仅显示已实现的格式
  const availableFormats = useMemo(
    () => formats.filter((f) => IMPLEMENTED.includes(f.id)),
    [formats]
  );

  const [selectedId, setSelectedId] = useState<ExportFormatId>(IMPLEMENTED[0] ?? "webgal");
  const [options, setOptions] = useState<Record<string, string | boolean | number>>({});
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<{ fileName: string; fileSize: number; stats: any } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedFormat: ExportFormat | undefined = availableFormats.find((f) => f.id === selectedId);

  // 初始化选项默认值
  const getOptionValue = (opt: ExportOption): string | boolean | number => {
    if (Object.prototype.hasOwnProperty.call(options, opt.id)) return options[opt.id];
    return opt.defaultValue;
  };

  const handleSelectFormat = (id: ExportFormatId) => {
    setSelectedId(id);
    setOptions({});
    setResult(null);
    setError(null);
  };

  const handleExport = async () => {
    if (!selectedFormat || !hasAdapter(selectedFormat.id)) {
      setError("该格式暂未实现");
      return;
    }
    if (storyNodesCount === 0) {
      setError("当前没有节点可导出，请先创建故事节点");
      return;
    }

    setRunning(true);
    setResult(null);
    setError(null);

    try {
      // 收集选项
      const finalOptions: Record<string, string | boolean | number> = {};
      for (const opt of selectedFormat.options) {
        finalOptions[opt.id] = getOptionValue(opt);
      }

      const exportResult = await runExport(selectedFormat.id, finalOptions);
      setResult({
        fileName: exportResult.fileName,
        fileSize: exportResult.fileSize,
        stats: exportResult.stats,
      });

      // 延迟下载，让成功消息先渲染
      setTimeout(() => {
        triggerDownload(exportResult.fileName, exportResult.content, selectedFormat.mimeType);
      }, 300);
    } catch (err) {
      setError(err instanceof Error ? err.message : "导出失败");
    } finally {
      setRunning(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="flex shrink-0 items-center justify-between border-b border-zinc-800 p-4">
          <h2 className="flex items-center gap-1.5 text-sm font-medium text-zinc-100">
            <Download className="h-4 w-4" /> 导出项目
          </h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* 主体 */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* 数据概览 */}
          <div className="mb-4 grid grid-cols-3 gap-2 rounded-md border border-zinc-800 bg-zinc-900/50 p-3 text-center">
            <div>
              <p className="text-lg font-semibold text-zinc-100">{storyNodesCount}</p>
              <p className="text-[10px] text-zinc-500">节点</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-zinc-100">{charactersCount}</p>
              <p className="text-[10px] text-zinc-500">角色</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-zinc-100">{variablesCount}</p>
              <p className="text-[10px] text-zinc-500">变量</p>
            </div>
          </div>

          {/* 格式选择 */}
          <p className="mb-2 text-xs font-medium text-zinc-300">选择导出格式</p>
          <div className="mb-4 grid grid-cols-2 gap-2">
            {availableFormats.map((fmt) => (
              <button
                key={fmt.id}
                onClick={() => handleSelectFormat(fmt.id)}
                className={`flex items-start gap-2 rounded-lg border p-3 text-left transition-colors ${
                  selectedId === fmt.id
                    ? "border-orange-500 bg-orange-950/30"
                    : "border-zinc-800 bg-zinc-900/30 hover:border-zinc-700"
                }`}
              >
                <FormatIcon id={fmt.id} className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium text-zinc-200">{fmt.name}</span>
                    <span className="rounded bg-emerald-900/40 px-1 py-0.5 text-[9px] text-emerald-400">
                      可用
                    </span>
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-[10px] text-zinc-500">{fmt.description}</p>
                  <p className="mt-1 font-mono text-[10px] text-zinc-600">{fmt.fileExtension}</p>
                </div>
              </button>
            ))}
          </div>

          {/* 未实现格式提示 */}
          <div className="mb-4 rounded-md border border-zinc-800 bg-zinc-900/30 p-2 text-[11px] text-zinc-500">
            另有 {formats.length - availableFormats.length} 种格式（PDF/Unity/Godot 等）尚未实现，敬请期待。
          </div>

          {/* 选项 */}
          {selectedFormat && selectedFormat.options.length > 0 && (
            <div className="mb-4">
              <p className="mb-2 text-xs font-medium text-zinc-300">导出选项</p>
              <div className="space-y-2 rounded-md border border-zinc-800 bg-zinc-900/30 p-3">
                {selectedFormat.options.map((opt) => (
                  <OptionField
                    key={opt.id}
                    option={opt}
                    value={getOptionValue(opt)}
                    onChange={(v) => setOptions((prev) => ({ ...prev, [opt.id]: v }))}
                  />
                ))}
              </div>
            </div>
          )}

          {/* 错误提示 */}
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-md border border-red-900/50 bg-red-950/30 p-2 text-xs text-red-300">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 结果 */}
          {result && (
            <div className="mb-4 rounded-md border border-emerald-900/50 bg-emerald-950/20 p-3">
              <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-emerald-400">
                <Check className="h-3.5 w-3.5" /> 导出成功
              </div>
              <div className="space-y-1 text-[11px] text-zinc-400">
                <p>文件名：{result.fileName}</p>
                <p>文件大小：{formatFileSize(result.fileSize)}</p>
                <p>导出节点：{result.stats.nodesExported} 个</p>
                <p>导出变量：{result.stats.variablesExported} 个</p>
                <p>耗时：{result.stats.duration} ms</p>
                {result.stats.skippedItems.length > 0 && (
                  <p className="text-amber-400">跳过：{result.stats.skippedItems.join(", ")}</p>
                )}
              </div>
              <p className="mt-2 text-[10px] text-zinc-500">文件已自动下载到浏览器默认下载目录</p>
            </div>
          )}

          {/* 最近任务 */}
          {recentJobs.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium text-zinc-300">最近导出记录</p>
              <div className="space-y-1">
                {recentJobs.slice(-3).reverse().map((job) => (
                  <div
                    key={job.id}
                    className="flex items-center justify-between rounded bg-zinc-900/40 px-2 py-1 text-[10px]"
                  >
                    <span className="text-zinc-400">{job.formatId}</span>
                    <span
                      className={
                        job.status === "completed"
                          ? "text-emerald-400"
                          : job.status === "failed"
                            ? "text-red-400"
                            : "text-zinc-500"
                      }
                    >
                      {job.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 底部按钮 */}
        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-zinc-800 p-4">
          <button
            onClick={onClose}
            className="rounded-md border border-zinc-800 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-900"
          >
            关闭
          </button>
          <button
            onClick={handleExport}
            disabled={running || !selectedFormat || storyNodesCount === 0}
            className="flex items-center gap-1.5 rounded-md bg-orange-500 px-3 py-1.5 text-xs text-white hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {running ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" /> 导出中…
              </>
            ) : (
              <>
                <Download className="h-3 w-3" /> 立即导出
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
