"use client";

import { useState } from "react";
import { X, Key, Cpu, Globe, Save, BookOpen, ImageIcon, Video, Music, Mic, ChevronDown, ChevronRight, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { useSettingsStore, PROVIDER_PRESETS, MEDIA_PROVIDER_PRESETS, type AiProvider, type MediaModelType } from "@/store";
import type { Genre } from "@/lib/types/project-genre";

interface SettingsPanelProps {
  onClose: () => void;
}

// 题材模式标签
const GENRE_LABELS: Record<Genre, string> = {
  suspense: "悬疑推理",
  romance: "恋爱养成",
  horror: "恐怖惊悚",
  scifi: "科幻未来",
  fantasy: "奇幻冒险",
  daily: "日常治愈",
  custom: "自定义",
};

// 连通性测试结果
interface TestResult {
  status: "idle" | "testing" | "success" | "failed";
  message: string;
  latency?: number;
}

// ─── 连通性测试函数 ─────────────────────────────────────────

/** 测试 LLM API 连通性 */
async function testLLMConnectivity(apiKey: string, baseUrl: string, modelName: string): Promise<TestResult> {
  if (!apiKey?.trim()) return { status: "failed", message: "未配置 API Key" };
  if (!modelName?.trim()) return { status: "failed", message: "未配置模型名" };

  const start = Date.now();
  try {
    const url = `${baseUrl.replace(/\/$/, "")}/chat/completions`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: modelName, messages: [{ role: "user", content: "Hi" }], max_tokens: 5 }),
    });
    const latency = Date.now() - start;

    if (response.ok) {
      return { status: "success", message: `连接成功`, latency };
    }
    const errorText = await response.text().catch(() => "");
    let errorMsg = `HTTP ${response.status}`;
    try {
      const errorJson = JSON.parse(errorText);
      errorMsg = errorJson.error?.message || errorMsg;
    } catch {
      if (errorText) errorMsg = errorText.slice(0, 120);
    }
    return { status: "failed", message: errorMsg };
  } catch (err) {
    return { status: "failed", message: `网络错误: ${err instanceof Error ? err.message : String(err)}` };
  }
}

/** 测试媒体生成 API 连通性（图像/TTS 做真实最小请求，视频/音频只验证配置） */
async function testMediaConnectivity(type: MediaModelType, apiKey: string, baseUrl: string, modelName: string): Promise<TestResult> {
  if (!apiKey?.trim()) return { status: "failed", message: "未配置 API Key" };

  const start = Date.now();
  try {
    if (type === "image") {
      // 图像：发送最小生成请求
      const url = `${baseUrl.replace(/\/$/, "")}/images/generations`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ model: modelName || "dall-e-3", prompt: "test", n: 1, size: "256x256" }),
      });
      const latency = Date.now() - start;
      if (response.ok) return { status: "success", message: `图像 API 连接成功`, latency };
      const errorText = await response.text().catch(() => "");
      let errorMsg = `HTTP ${response.status}`;
      try { const e = JSON.parse(errorText); errorMsg = e.error?.message || errorMsg; } catch { if (errorText) errorMsg = errorText.slice(0, 120); }
      return { status: "failed", message: errorMsg };
    } else if (type === "tts") {
      // TTS：发送最小合成请求
      const url = `${baseUrl.replace(/\/$/, "")}/audio/speech`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ model: modelName || "tts-1", input: "test", voice: "alloy" }),
      });
      const latency = Date.now() - start;
      if (response.ok) return { status: "success", message: `TTS API 连接成功`, latency };
      const errorText = await response.text().catch(() => "");
      let errorMsg = `HTTP ${response.status}`;
      try { const e = JSON.parse(errorText); errorMsg = e.error?.message || errorMsg; } catch { if (errorText) errorMsg = errorText.slice(0, 120); }
      return { status: "failed", message: errorMsg };
    } else {
      // 视频/音频：只验证 API Key 已配置（真实调用成本高）
      return { status: "success", message: `API Key 已配置（${type === "video" ? "视频" : "音频"}生成将在实际使用时验证）` };
    }
  } catch (err) {
    return { status: "failed", message: `网络错误: ${err instanceof Error ? err.message : String(err)}` };
  }
}

// ─── 媒体模型配置区 ─────────────────────────────────────────

const MEDIA_ICONS: Record<MediaModelType, typeof ImageIcon> = {
  image: ImageIcon,
  video: Video,
  audio: Music,
  tts: Mic,
};

function MediaModelSection({ type }: { type: MediaModelType }) {
  const config = useSettingsStore((s) => s.mediaModels[type]);
  const setMediaModel = useSettingsStore((s) => s.setMediaModel);
  const [expanded, setExpanded] = useState(false);
  const [testResult, setTestResult] = useState<TestResult>({ status: "idle", message: "" });

  const presets = MEDIA_PROVIDER_PRESETS[type];
  const Icon = MEDIA_ICONS[type];
  const currentPreset = presets.providers.find((p) => p.id === config.provider);

  const handleProviderChange = (providerId: string) => {
    const preset = presets.providers.find((p) => p.id === providerId);
    setMediaModel(type, {
      provider: providerId,
      modelName: preset?.defaultModel || "",
      baseUrl: preset?.defaultBaseUrl || "",
    });
  };

  const handleTest = async () => {
    setTestResult({ status: "testing", message: "测试中..." });
    const result = await testMediaConnectivity(type, config.apiKey, config.baseUrl, config.modelName);
    setTestResult(result);
  };

  return (
    <div className="rounded-md border border-zinc-800 bg-zinc-900/50">
      {/* 折叠头部 */}
      <button
        onClick={() => {
          // 点击头部：若未启用则自动启用并展开；若已启用则切换展开状态
          if (!config.enabled) {
            setMediaModel(type, { enabled: true });
            setExpanded(true);
          } else {
            setExpanded(!expanded);
          }
        }}
        className="flex w-full items-center justify-between p-3"
      >
        <div className="flex items-center gap-2">
          {expanded ? <ChevronDown className="h-3 w-3 text-zinc-500" /> : <ChevronRight className="h-3 w-3 text-zinc-500" />}
          <Icon className="h-3.5 w-3.5 text-zinc-400" />
          <span className="text-xs font-medium text-zinc-200">{presets.label}</span>
          {config.enabled && config.apiKey?.trim() && (
            <span className="rounded bg-emerald-950 px-1.5 py-0.5 text-[11px] text-emerald-400">已配置</span>
          )}
        </div>
        <label
          className="relative inline-flex cursor-pointer items-center"
          onClick={(e) => { e.stopPropagation(); setMediaModel(type, { enabled: !config.enabled }); }}
        >
          <input type="checkbox" checked={config.enabled} readOnly className="peer sr-only" />
          <div className="h-4 w-7 rounded-full bg-zinc-700 peer-checked:bg-orange-500 after:absolute after:left-0.5 after:top-0.5 after:h-3 after:w-3 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-3" />
        </label>
      </button>

      {/* 展开内容 */}
      {expanded && (
        <div className="space-y-3 border-t border-zinc-800 p-3">
          {/* 提供商选择 */}
          <div>
            <label className="mb-1 block text-[11px] text-zinc-500">提供商</label>
            <select
              value={config.provider}
              onChange={(e) => handleProviderChange(e.target.value)}
              className="w-full rounded-md bg-zinc-900 px-3 py-2 text-xs text-zinc-200 outline-none border border-zinc-800 focus:border-orange-500"
            >
              {presets.providers.map((p) => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
          </div>

          {/* 模型名 */}
          <div>
            <label className="mb-1 block text-[11px] text-zinc-500">模型名</label>
            <input
              value={config.modelName}
              onChange={(e) => setMediaModel(type, { modelName: e.target.value })}
              placeholder={currentPreset?.defaultModel || "输入模型名"}
              className="w-full rounded-md bg-zinc-900 px-3 py-2 text-xs text-zinc-200 outline-none border border-zinc-800 focus:border-orange-500"
            />
          </div>

          {/* API Key */}
          <div>
            <label className="mb-1 block text-[11px] text-zinc-500">{currentPreset?.keyLabel || "API Key"}</label>
            <input
              type="password"
              value={config.apiKey}
              onChange={(e) => setMediaModel(type, { apiKey: e.target.value })}
              placeholder={`输入${currentPreset?.label || ""} API Key...`}
              className="w-full rounded-md bg-zinc-900 px-3 py-2 text-xs text-zinc-200 outline-none border border-zinc-800 focus:border-orange-500"
            />
          </div>

          {/* Base URL */}
          <div>
            <label className="mb-1 block text-[11px] text-zinc-500">API Base URL</label>
            <input
              value={config.baseUrl}
              onChange={(e) => setMediaModel(type, { baseUrl: e.target.value })}
              placeholder={currentPreset?.defaultBaseUrl || "https://api.example.com/v1"}
              className="w-full rounded-md bg-zinc-900 px-3 py-2 text-xs text-zinc-200 outline-none border border-zinc-800 focus:border-orange-500"
            />
          </div>

          {/* 连通性测试 */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleTest}
              disabled={testResult.status === "testing"}
              className="flex items-center gap-1.5 rounded-md bg-zinc-800 px-3 py-1.5 text-xs text-zinc-200 hover:bg-zinc-700 disabled:opacity-50"
            >
              {testResult.status === "testing" ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : testResult.status === "success" ? (
                <CheckCircle2 className="h-3 w-3 text-emerald-400" />
              ) : testResult.status === "failed" ? (
                <XCircle className="h-3 w-3 text-red-400" />
              ) : (
                <Key className="h-3 w-3" />
              )}
              测试连接
            </button>
            {testResult.status !== "idle" && testResult.status !== "testing" && (
              <span className={`text-[11px] ${testResult.status === "success" ? "text-emerald-400" : "text-red-400"}`}>
                {testResult.message}
                {testResult.latency ? ` (${testResult.latency}ms)` : ""}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── 设置面板主组件 ─────────────────────────────────────────

export function SettingsPanel({ onClose }: SettingsPanelProps) {
  const settings = useSettingsStore();
  const setAiProvider = useSettingsStore((s) => s.setAiProvider);
  const setAiModelName = useSettingsStore((s) => s.setAiModelName);
  const setApiKey = useSettingsStore((s) => s.setApiKey);
  const setApiBaseUrl = useSettingsStore((s) => s.setApiBaseUrl);
  const setAiLang = useSettingsStore((s) => s.setAiLang);
  const setGenre = useSettingsStore((s) => s.setGenre);
  const setGenreCustom = useSettingsStore((s) => s.setGenreCustom);

  const [showMediaConfig, setShowMediaConfig] = useState(false);
  const [llmTestResult, setLlmTestResult] = useState<TestResult>({ status: "idle", message: "" });

  const hasApiKey =
    Object.keys(settings.apiKeys).length > 0 &&
    Object.values(settings.apiKeys).some((k) => k && k.trim() !== "");

  const preset = PROVIDER_PRESETS[settings.aiProvider];

  // 切换提供商时自动填充默认 baseUrl 和模型名
  const handleProviderChange = (provider: AiProvider) => {
    setAiProvider(provider);
    const p = PROVIDER_PRESETS[provider];
    if (p.defaultModel && !settings.aiModelName) {
      setAiModelName(p.defaultModel);
    }
    if (p.defaultBaseUrl && !settings.apiBaseUrl) {
      setApiBaseUrl(p.defaultBaseUrl);
    }
  };

  // LLM 连通性测试
  const handleLLMTest = async () => {
    setLlmTestResult({ status: "testing", message: "测试中..." });
    const apiKey = settings.apiKeys[settings.aiProvider] || "";
    const baseUrl = settings.apiBaseUrl || preset.defaultBaseUrl;
    const result = await testLLMConnectivity(apiKey, baseUrl, settings.aiModelName);
    setLlmTestResult(result);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-950 p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-medium text-zinc-100">设置</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* AI 模式状态 */}
        <div className="mb-4 rounded-md border border-zinc-800 bg-zinc-900/50 p-3">
          <p className="text-xs text-zinc-400">
            当前模式：
            <span className={hasApiKey ? "text-emerald-400" : "text-amber-400"}>
              {hasApiKey ? " ✅ 真实 AI（已配置 API Key）" : " ⚠️ 演示模式（未配置 API Key）"}
            </span>
          </p>
          <p className="mt-1 text-[11px] text-zinc-600">
            {hasApiKey
              ? `Agent 将调用 ${settings.aiModelName || "配置的模型"} 执行操作`
              : "演示模式下工具调用仍走真实逻辑，仅文本生成降级为演示响应"}
          </p>
        </div>

        {/* 题材/行业模式 */}
        <div className="mb-4">
          <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-300">
            <BookOpen className="h-3 w-3" /> 题材模式（影响 AI 创作倾向）
          </label>
          <select
            value={settings.genre}
            onChange={(e) => setGenre(e.target.value as Genre)}
            className="w-full rounded-md bg-zinc-900 px-3 py-2 text-xs text-zinc-200 outline-none border border-zinc-800 focus:border-orange-500"
          >
            {Object.entries(GENRE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          {settings.genre === "custom" && (
            <input
              value={settings.genreCustom ?? ""}
              onChange={(e) => setGenreCustom(e.target.value)}
              placeholder="描述你的自定义题材风格..."
              className="mt-2 w-full rounded-md bg-zinc-900 px-3 py-2 text-xs text-zinc-200 outline-none border border-zinc-800 focus:border-orange-500"
            />
          )}
        </div>

        {/* ── LLM 配置 ── */}
        <div className="mb-2 rounded-md border border-zinc-800 bg-zinc-900/30 p-3">
          <p className="mb-3 text-xs font-semibold text-zinc-300">大语言模型（LLM）</p>

          {/* AI 提供商 */}
          <div className="mb-3">
            <label className="mb-1 flex items-center gap-1.5 text-[11px] text-zinc-500">
              <Cpu className="h-3 w-3" /> 提供商
            </label>
            <select
              value={settings.aiProvider}
              onChange={(e) => handleProviderChange(e.target.value as AiProvider)}
              className="w-full rounded-md bg-zinc-900 px-3 py-2 text-xs text-zinc-200 outline-none border border-zinc-800 focus:border-orange-500"
            >
              {Object.entries(PROVIDER_PRESETS).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>

          {/* 模型名 */}
          <div className="mb-3">
            <label className="mb-1 flex items-center gap-1.5 text-[11px] text-zinc-500">
              <Cpu className="h-3 w-3" /> 模型名称
            </label>
            <input
              value={settings.aiModelName}
              onChange={(e) => setAiModelName(e.target.value)}
              placeholder={preset.defaultModel || "gpt-4o / qwen-max / deepseek-chat"}
              className="w-full rounded-md bg-zinc-900 px-3 py-2 text-xs text-zinc-200 outline-none border border-zinc-800 focus:border-orange-500"
            />
          </div>

          {/* API Key */}
          <div className="mb-3">
            <label className="mb-1 flex items-center gap-1.5 text-[11px] text-zinc-500">
              <Key className="h-3 w-3" /> {preset.keyLabel}
            </label>
            <input
              type="password"
              value={settings.apiKeys[settings.aiProvider] || ""}
              onChange={(e) => setApiKey(settings.aiProvider, e.target.value)}
              placeholder={`输入${preset.label} API Key...`}
              className="w-full rounded-md bg-zinc-900 px-3 py-2 text-xs text-zinc-200 outline-none border border-zinc-800 focus:border-orange-500"
            />
          </div>

          {/* API Base URL */}
          <div className="mb-3">
            <label className="mb-1 flex items-center gap-1.5 text-[11px] text-zinc-500">
              <Globe className="h-3 w-3" /> API Base URL
            </label>
            <input
              value={settings.apiBaseUrl}
              onChange={(e) => setApiBaseUrl(e.target.value)}
              placeholder={preset.defaultBaseUrl || "https://api.example.com/v1"}
              className="w-full rounded-md bg-zinc-900 px-3 py-2 text-xs text-zinc-200 outline-none border border-zinc-800 focus:border-orange-500"
            />
          </div>

          {/* 连通性测试 */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleLLMTest}
              disabled={llmTestResult.status === "testing"}
              className="flex items-center gap-1.5 rounded-md bg-zinc-800 px-3 py-1.5 text-xs text-zinc-200 hover:bg-zinc-700 disabled:opacity-50"
            >
              {llmTestResult.status === "testing" ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : llmTestResult.status === "success" ? (
                <CheckCircle2 className="h-3 w-3 text-emerald-400" />
              ) : llmTestResult.status === "failed" ? (
                <XCircle className="h-3 w-3 text-red-400" />
              ) : (
                <Key className="h-3 w-3" />
              )}
              测试连接
            </button>
            {llmTestResult.status !== "idle" && llmTestResult.status !== "testing" && (
              <span className={`text-[11px] ${llmTestResult.status === "success" ? "text-emerald-400" : "text-red-400"}`}>
                {llmTestResult.message}
                {llmTestResult.latency ? ` (${llmTestResult.latency}ms)` : ""}
              </span>
            )}
          </div>
        </div>

        {/* ── 媒体生成配置 ── */}
        <div className="mb-4">
          <button
            onClick={() => setShowMediaConfig(!showMediaConfig)}
            className="mb-2 flex w-full items-center gap-1.5 text-xs font-semibold text-zinc-300"
          >
            {showMediaConfig ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            媒体生成配置（图像 / 视频 / 音频 / TTS）
          </button>
          {showMediaConfig && (
            <div className="space-y-2">
              <p className="text-[11px] text-zinc-600">
                为每种媒体类型配置独立的 API Key 和模型。未配置的类型将在使用时返回明确错误。
              </p>
              {(["image", "video", "audio", "tts"] as MediaModelType[]).map((type) => (
                <MediaModelSection key={type} type={type} />
              ))}
            </div>
          )}
        </div>

        {/* AI 响应语言 */}
        <div className="mb-4">
          <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-300">
            <Globe className="h-3 w-3" /> AI 响应语言
          </label>
          <select
            value={settings.aiLang}
            onChange={(e) => setAiLang(e.target.value as "zh" | "en" | "ja")}
            className="w-full rounded-md bg-zinc-900 px-3 py-2 text-xs text-zinc-200 outline-none border border-zinc-800 focus:border-orange-500"
          >
            <option value="zh">中文</option>
            <option value="en">English</option>
            <option value="ja">日本語</option>
          </select>
        </div>

        <button
          onClick={onClose}
          className="flex w-full items-center justify-center gap-1.5 rounded-md bg-orange-500 px-3 py-2 text-xs text-white hover:bg-orange-400"
        >
          <Save className="h-3 w-3" /> 保存并关闭
        </button>
      </div>
    </div>
  );
}
