"use client";

import { useState, useCallback, useRef } from "react";
import { X, FileText, Play, AlertCircle, CheckCircle, ChevronRight, Loader2, Upload, FileUp, Code2, Image, Music, Video, Layout } from "lucide-react";
import { compileScript, applyToStore, type CompileResult } from "@/lib/dsl";
import { usePipelineStore } from "@/store";
import { cn } from "@/utils/utils";

interface ImportPanelProps {
  onClose: () => void;
  /** 真正导入成功后触发（用于发送提示消息、同步数据）。普通关闭不触发。 */
  onImported?: () => void;
}

/** 示例 DSL 脚本 */
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

type Mode = "upload" | "dsl";
type ImportType = "script" | "image" | "audio" | "video" | "ui";

// 导入类型配置
const IMPORT_TYPES: { id: ImportType; label: string; icon: typeof FileText; accept: string; desc: string }[] = [
  { id: "script", label: "剧本", icon: FileText, accept: ".txt,.md,.dfstory,text/plain", desc: "上传剧本文件，自动解析为互动节点图" },
  { id: "image", label: "图片", icon: Image, accept: "image/png,image/jpeg,image/webp,image/gif,.png,.jpg,.jpeg,.webp,.gif", desc: "角色立绘、场景背景等图片素材" },
  { id: "audio", label: "音频", icon: Music, accept: "audio/mpeg,audio/wav,audio/ogg,.mp3,.wav,.ogg", desc: "背景音乐、音效、语音配音" },
  { id: "video", label: "视频", icon: Video, accept: "video/mp4,video/webm,.mp4,.webm", desc: "视频素材、过场动画" },
  { id: "ui", label: "UI模板", icon: Layout, accept: ".json,.html,.css,application/json,text/html", desc: "界面模板、样式文件" },
];

// 统一导入面板 — 支持剧本/图片/音频/视频/UI模板
export function ImportPanel({ onClose, onImported }: ImportPanelProps) {
  const [importType, setImportType] = useState<ImportType>("script");
  const [mode, setMode] = useState<Mode>("upload");
  const [source, setSource] = useState(SAMPLE_DSL);
  const [result, setResult] = useState<CompileResult | null>(null);
  const [compiling, setCompiling] = useState(false);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /** 编译 DSL 源码 */
  const handleCompile = useCallback(() => {
    setCompiling(true);
    setApplied(false);
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

  /** 将编译结果写入节点图 store */
  const handleApply = useCallback(() => {
    if (!result || result.errors.length > 0) return;
    setApplying(true);
    try {
      applyToStore(result);
      setApplied(true);
      onImported?.();
      setTimeout(() => onClose(), 800);
    } finally {
      setApplying(false);
    }
  }, [result, onClose, onImported]);

  /** 读取剧本文件内容 */
  const readScriptFile = useCallback(async (file: File) => {
    const text = await file.text();
    setSource(text);
    setFileName(file.name);
    setCompiling(true);
    setApplied(false);
    try {
      const res = compileScript(text);
      setResult(res);
    } catch (err) {
      setResult({
        nodes: [], edges: [], errors: [String(err)], warnings: [], labelMap: new Map(),
      });
    } finally {
      setCompiling(false);
    }
  }, []);

  /** 读取媒体文件 */
  const readMediaFile = useCallback((file: File) => {
    setMediaFile(file);
    setFileName(file.name);
    // 生成预览 URL
    const url = URL.createObjectURL(file);
    setMediaPreview(url);
  }, []);

  /** 文件选择 */
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (importType === "script") {
      readScriptFile(file);
    } else {
      readMediaFile(file);
    }
  }, [importType, readScriptFile, readMediaFile]);

  /** 拖拽放下 */
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (importType === "script") {
      readScriptFile(file);
    } else {
      readMediaFile(file);
    }
  }, [importType, readScriptFile, readMediaFile]);

  /** 导入媒体文件到 pipeline context assetList */
  const handleImportMedia = useCallback(() => {
    if (!mediaFile) return;
    setApplying(true);
    try {
      const pipeline = usePipelineStore.getState();
      const ctx = pipeline.context;
      const existingList = ctx.assetList ?? [];
      // 追加到 assetList
      pipeline.setStageOutput("assetList", [
        ...existingList,
        {
          type: importType,
          name: mediaFile.name,
          prompt: "",
          status: "imported",
          fileUrl: mediaPreview ?? "",
          fileName: mediaFile.name,
          fileSize: mediaFile.size,
        },
      ]);
      setApplied(true);
      onImported?.();
      setTimeout(() => onClose(), 800);
    } finally {
      setApplying(false);
    }
  }, [mediaFile, importType, mediaPreview, onClose, onImported]);

  /** 切换导入类型时重置状态 */
  const switchImportType = (type: ImportType) => {
    setImportType(type);
    setApplied(false);
    setFileName(null);
    setMediaFile(null);
    setMediaPreview(null);
    setResult(null);
  };

  const canApply = importType === "script"
    ? (result && result.errors.length === 0 && result.nodes.length > 0)
    : !!mediaFile;

  const currentTypeConfig = IMPORT_TYPES.find((t) => t.id === importType)!;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-xl border border-zinc-800 bg-zinc-950 p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 标题栏 */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-1.5 text-sm font-medium text-zinc-100">
            <Upload className="h-4 w-4" /> 导入
          </h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* 导入类型选择 tab（统一入口） */}
        <div className="mb-4 flex gap-1 rounded-lg border border-zinc-800 bg-zinc-900 p-1">
          {IMPORT_TYPES.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => switchImportType(t.id)}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition",
                  importType === t.id ? "bg-orange-500 text-white" : "text-zinc-400 hover:text-zinc-200",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* 剧本导入：双模式（上传 / DSL 编辑） */}
        {importType === "script" && (
          <>
            {/* 模式切换 */}
            <div className="mb-4 flex gap-1 rounded-lg border border-zinc-800 bg-zinc-900 p-1">
              <button
                onClick={() => setMode("upload")}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition",
                  mode === "upload" ? "bg-orange-500 text-white" : "text-zinc-400 hover:text-zinc-200",
                )}
              >
                <Upload className="h-3.5 w-3.5" />
                上传剧本
              </button>
              <button
                onClick={() => setMode("dsl")}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition",
                  mode === "dsl" ? "bg-orange-500 text-white" : "text-zinc-400 hover:text-zinc-200",
                )}
              >
                <Code2 className="h-3.5 w-3.5" />
                DSL 专业编辑
              </button>
            </div>

            {/* 上传模式 */}
            {mode === "upload" && (
              <div className="space-y-3">
                <p className="text-xs text-zinc-500">{currentTypeConfig.desc}。支持 .txt、.md、.dfstory 格式。</p>

                <div
                  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed py-10 transition",
                    dragging ? "border-orange-500 bg-orange-500/10" : "border-zinc-700 bg-zinc-900/50 hover:border-zinc-600",
                  )}
                >
                  <FileUp className={cn("h-8 w-8", dragging ? "text-orange-400" : "text-zinc-600")} />
                  <p className="text-sm text-zinc-300">
                    {fileName ? `已选择：${fileName}` : "拖拽文件到此处，或点击选择文件"}
                  </p>
                  <p className="text-[11px] text-zinc-600">支持 .txt / .md / .dfstory</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={currentTypeConfig.accept}
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {result && (
                  <div className="space-y-2 overflow-y-auto">
                    <div className="flex gap-4 rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-[10px] text-zinc-400">
                      <span>节点: <b className="text-zinc-100">{result.nodes.length}</b></span>
                      <span>边: <b className="text-zinc-100">{result.edges.length}</b></span>
                      <span>标签: <b className="text-zinc-100">{result.labelMap.size}</b></span>
                    </div>
                    {result.errors.map((err, i) => (
                      <div key={`err-${i}`} className="flex items-start gap-2 rounded-md border border-red-500/30 bg-red-500/10 p-2 text-[10px] text-red-400">
                        <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
                        <span>{err}</span>
                      </div>
                    ))}
                    {result.errors.length === 0 && result.nodes.length > 0 && (
                      <div className="flex items-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 p-2 text-[10px] text-emerald-400">
                        <CheckCircle className="h-3 w-3" />
                        <span>解析成功！{result.nodes.length} 个节点，{result.edges.length} 条分支。点击下方按钮导入。</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={handleApply}
                    disabled={!canApply || applying || applied}
                    className="flex items-center gap-1.5 rounded-md bg-emerald-600 px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {applying ? <Loader2 className="h-3 w-3 animate-spin" /> : <ChevronRight className="h-3 w-3" />}
                    {applied ? "已导入" : applying ? "导入中…" : "导入到节点图"}
                  </button>
                </div>
              </div>
            )}

            {/* DSL 专业编辑模式 */}
            {mode === "dsl" && (
              <div className="space-y-3">
                <p className="text-xs text-zinc-500">
                  编写或粘贴 DSL 脚本，编译后写入节点图。支持标签、对白、旁白、选项块、条件分支、变量、结局等语法。
                </p>

                <textarea
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  spellCheck={false}
                  className="h-48 w-full resize-y rounded-lg border border-zinc-800 bg-[#1E1E2E] p-3 font-mono text-[11px] leading-relaxed text-[#CDD6F4] focus:outline-none focus:ring-1 focus:ring-orange-500"
                  placeholder="在此编写 DSL 脚本..."
                />

                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={handleCompile}
                    disabled={compiling}
                    className="flex items-center gap-1.5 rounded-md bg-orange-500 px-3 py-1.5 text-[11px] font-medium text-white transition-colors hover:bg-orange-400 disabled:opacity-50"
                  >
                    {compiling ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
                    {compiling ? "编译中…" : "编译"}
                  </button>
                  <button
                    onClick={handleApply}
                    disabled={!canApply || applying || applied}
                    className="flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-[11px] font-medium text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {applying ? <Loader2 className="h-3 w-3 animate-spin" /> : <ChevronRight className="h-3 w-3" />}
                    {applied ? "已写入" : applying ? "写入中…" : "写入节点图"}
                  </button>
                </div>

                {result && (
                  <div className="space-y-2 overflow-y-auto">
                    <div className="flex gap-4 rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-[10px] text-zinc-400">
                      <span>节点: <b className="text-zinc-100">{result.nodes.length}</b></span>
                      <span>边: <b className="text-zinc-100">{result.edges.length}</b></span>
                      <span>标签: <b className="text-zinc-100">{result.labelMap.size}</b></span>
                    </div>
                    {result.errors.map((err, i) => (
                      <div key={`err-${i}`} className="flex items-start gap-2 rounded-md border border-red-500/30 bg-red-500/10 p-2 text-[10px] text-red-400">
                        <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
                        <span>{err}</span>
                      </div>
                    ))}
                    {result.warnings.map((warn, i) => (
                      <div key={`warn-${i}`} className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 p-2 text-[10px] text-amber-400">
                        <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
                        <span>{warn}</span>
                      </div>
                    ))}
                    {result.errors.length === 0 && result.nodes.length > 0 && (
                      <div className="flex items-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 p-2 text-[10px] text-emerald-400">
                        <CheckCircle className="h-3 w-3" />
                        <span>编译成功！{result.nodes.length} 个节点，{result.edges.length} 条边。</span>
                      </div>
                    )}
                    {applied && (
                      <div className="flex items-center gap-2 rounded-md border border-emerald-500/40 bg-emerald-500/15 p-2 text-[10px] text-emerald-300">
                        <CheckCircle className="h-3 w-3" />
                        <span>已写入节点图！切换到"节点图"视图查看。</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="shrink-0 rounded-md border border-zinc-800 bg-zinc-900/50 p-3">
                  <p className="mb-2 text-[10px] font-medium text-zinc-400">DSL 语法速查</p>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1 font-mono text-[10px] text-zinc-500">
                    <div><span className="text-orange-400">#标签名</span> — 场景标签</div>
                    <div><span className="text-orange-400">角色: 对白</span> — 角色对白</div>
                    <div><span className="text-orange-400">: 旁白</span> — 旁白文本</div>
                    <div><span className="text-orange-400">@choice()...@end</span> — 选项块</div>
                    <div><span className="text-orange-400">- "文本" -&gt; #标签</span> — 选项</div>
                    <div><span className="text-orange-400">@if(条件)...@end</span> — 条件分支</div>
                    <div><span className="text-orange-400">@set 变量 += 值</span> — 变量操作</div>
                    <div><span className="text-orange-400">@ending good/bad</span> — 结局</div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* 媒体导入（图片/音频/视频/UI模板） */}
        {importType !== "script" && (
          <div className="space-y-3">
            <p className="text-xs text-zinc-500">{currentTypeConfig.desc}</p>

            {/* 拖拽上传区 */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed py-10 transition",
                dragging ? "border-orange-500 bg-orange-500/10" : "border-zinc-700 bg-zinc-900/50 hover:border-zinc-600",
              )}
            >
              <FileUp className={cn("h-8 w-8", dragging ? "text-orange-400" : "text-zinc-600")} />
              <p className="text-sm text-zinc-300">
                {fileName ? `已选择：${fileName}` : "拖拽文件到此处，或点击选择文件"}
              </p>
              <p className="text-[11px] text-zinc-600">
                {importType === "image" && "支持 PNG / JPG / WebP / GIF"}
                {importType === "audio" && "支持 MP3 / WAV / OGG"}
                {importType === "video" && "支持 MP4 / WebM"}
                {importType === "ui" && "支持 JSON / HTML / CSS"}
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept={currentTypeConfig.accept}
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* 媒体预览 */}
            {mediaPreview && mediaFile && (
              <div className="space-y-2 rounded-md border border-zinc-800 bg-zinc-900/50 p-3">
                <p className="text-[11px] font-medium text-zinc-400">预览</p>
                {importType === "image" && (
                  <img src={mediaPreview} alt={mediaFile.name} className="max-h-40 rounded-md object-contain" />
                )}
                {importType === "audio" && (
                  <audio src={mediaPreview} controls className="w-full" />
                )}
                {importType === "video" && (
                  <video src={mediaPreview} controls className="max-h-40 w-full rounded-md" />
                )}
                {importType === "ui" && (
                  <div className="rounded-md bg-zinc-950 p-2 font-mono text-[10px] text-zinc-400">
                    {mediaFile.name} · {(mediaFile.size / 1024).toFixed(1)} KB
                  </div>
                )}
                <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                  <CheckCircle className="h-3 w-3 text-emerald-400" />
                  <span>文件已就绪，点击下方按钮导入到资产中心。</span>
                </div>
              </div>
            )}

            {/* 操作按钮 */}
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={handleImportMedia}
                disabled={!canApply || applying || applied}
                className="flex items-center gap-1.5 rounded-md bg-emerald-600 px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {applying ? <Loader2 className="h-3 w-3 animate-spin" /> : <ChevronRight className="h-3 w-3" />}
                {applied ? "已导入" : applying ? "导入中…" : "导入到资产中心"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
