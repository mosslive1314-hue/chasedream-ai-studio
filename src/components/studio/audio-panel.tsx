"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Music, Volume2, VolumeX, Play, Square, Loader2, AlertCircle } from "lucide-react";
import { getAudioManager } from "@/lib/audio";
import type { VolumeType } from "@/lib/audio";

interface AudioPanelProps {
  onClose: () => void;
}

/** 音量类型配置 */
const VOLUME_TYPES: { id: VolumeType; label: string }[] = [
  { id: "master", label: "主音量" },
  { id: "bgm", label: "BGM" },
  { id: "sfx", label: "音效" },
  { id: "voice", label: "语音" },
];

/** 示例音频 URL（CORS 友好） */
const SAMPLE_URLS = {
  bgm: "https://storage.googleapis.com/media-session/elephants-dream/the-wires.mp3",
  sfx: "https://storage.googleapis.com/media-session/elephants-dream/sweep.ogg",
  voice: "https://storage.googleapis.com/media-session/elephants-dream/introduction.ogg",
};

// 音频预览面板 — 连接真实 AudioManager 单例
export function AudioPanel({ onClose }: AudioPanelProps) {
  const [bgmUrl, setBgmUrl] = useState(SAMPLE_URLS.bgm);
  const [sfxUrl, setSfxUrl] = useState(SAMPLE_URLS.sfx);
  const [voiceUrl, setVoiceUrl] = useState(SAMPLE_URLS.voice);
  const [playing, setPlaying] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [volumes, setVolumes] = useState({ master: 1, bgm: 0.8, sfx: 1, voice: 1 });
  const [currentBgm, setCurrentBgm] = useState<string | null>(null);

  // 初始化：读取当前 AudioManager 状态
  useEffect(() => {
    const mgr = getAudioManager();
    const state = mgr.getState();
    setVolumes({ ...state.volumes });
    setCurrentBgm(state.currentBgm);
    if (state.currentBgm) setPlaying((p) => ({ ...p, bgm: true }));
  }, []);

  /** 播放 BGM */
  const handlePlayBgm = useCallback(async () => {
    if (!bgmUrl.trim()) return;
    setError(null);
    setLoading((p) => ({ ...p, bgm: true }));
    try {
      const mgr = getAudioManager();
      await mgr.playBgm(bgmUrl.trim(), { fadeTime: 0.5 });
      setCurrentBgm(bgmUrl.trim());
      setPlaying((p) => ({ ...p, bgm: true }));
    } catch (err) {
      setError(`BGM 播放失败: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading((p) => ({ ...p, bgm: false }));
    }
  }, [bgmUrl]);

  /** 停止 BGM */
  const handleStopBgm = useCallback(() => {
    const mgr = getAudioManager();
    mgr.stopBgm(0.5);
    setCurrentBgm(null);
    setPlaying((p) => ({ ...p, bgm: false }));
  }, []);

  /** 播放音效 */
  const handlePlaySfx = useCallback(async () => {
    if (!sfxUrl.trim()) return;
    setError(null);
    setLoading((p) => ({ ...p, sfx: true }));
    try {
      const mgr = getAudioManager();
      await mgr.playSfx(sfxUrl.trim());
      setPlaying((p) => ({ ...p, sfx: true }));
      // 音效是一次性的，短暂显示后重置
      setTimeout(() => setPlaying((p) => ({ ...p, sfx: false })), 500);
    } catch (err) {
      setError(`音效播放失败: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading((p) => ({ ...p, sfx: false }));
    }
  }, [sfxUrl]);

  /** 播放语音 */
  const handlePlayVoice = useCallback(async () => {
    if (!voiceUrl.trim()) return;
    setError(null);
    setLoading((p) => ({ ...p, voice: true }));
    try {
      const mgr = getAudioManager();
      await mgr.playVoice(voiceUrl.trim());
      setPlaying((p) => ({ ...p, voice: true }));
      setTimeout(() => setPlaying((p) => ({ ...p, voice: false })), 500);
    } catch (err) {
      setError(`语音播放失败: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading((p) => ({ ...p, voice: false }));
    }
  }, [voiceUrl]);

  /** 停止所有音频 */
  const handleStopAll = useCallback(() => {
    const mgr = getAudioManager();
    mgr.stopAll();
    setCurrentBgm(null);
    setPlaying({});
  }, []);

  /** 调整音量 */
  const handleVolumeChange = useCallback((type: VolumeType, value: number) => {
    const mgr = getAudioManager();
    mgr.setVolume(type, value);
    setVolumes((prev) => ({ ...prev, [type]: value }));
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-950 p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 标题栏 */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-1.5 text-sm font-medium text-zinc-100">
            <Music className="h-4 w-4" /> 音频预览
          </h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300">
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mb-4 text-xs text-zinc-500">
          通过 AudioManager 单例预览 BGM / 音效 / 语音播放，调整分类音量。音频通过 Web Audio API 实时解码播放。
        </p>

        {/* 错误提示 */}
        {error && (
          <div className="mb-3 flex items-start gap-2 rounded-md border border-red-500/30 bg-red-500/10 p-2 text-[10px] text-red-400">
            <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* BGM 播放区 */}
        <div className="mb-3 rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-xs font-semibold text-zinc-200">BGM 背景音乐</span>
            {currentBgm && (
              <span className="flex items-center gap-1 text-[9px] text-emerald-400">
                <Volume2 className="h-2.5 w-2.5" /> 播放中
              </span>
            )}
          </div>
          <input
            type="text"
            value={bgmUrl}
            onChange={(e) => setBgmUrl(e.target.value)}
            placeholder="输入 BGM 音频 URL..."
            className="mb-2 w-full rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-[11px] text-zinc-200 focus:outline-none focus:ring-1 focus:ring-orange-500"
          />
          <div className="flex gap-2">
            <button
              onClick={handlePlayBgm}
              disabled={loading.bgm || !bgmUrl.trim()}
              className="flex items-center gap-1 rounded-md bg-orange-500 px-3 py-1 text-[10px] font-medium text-white transition-colors hover:bg-orange-400 disabled:opacity-40"
            >
              {loading.bgm ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
              {loading.bgm ? "加载中…" : "播放"}
            </button>
            <button
              onClick={handleStopBgm}
              disabled={!playing.bgm}
              className="flex items-center gap-1 rounded-md bg-zinc-700 px-3 py-1 text-[10px] font-medium text-white transition-colors hover:bg-zinc-600 disabled:opacity-40"
            >
              <Square className="h-3 w-3" /> 停止
            </button>
          </div>
        </div>

        {/* 音效播放区 */}
        <div className="mb-3 rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-xs font-semibold text-zinc-200">SFX 音效</span>
            {playing.sfx && (
              <span className="flex items-center gap-1 text-[9px] text-emerald-400">
                <Volume2 className="h-2.5 w-2.5" /> 播放中
              </span>
            )}
          </div>
          <input
            type="text"
            value={sfxUrl}
            onChange={(e) => setSfxUrl(e.target.value)}
            placeholder="输入音效 URL..."
            className="mb-2 w-full rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-[11px] text-zinc-200 focus:outline-none focus:ring-1 focus:ring-orange-500"
          />
          <button
            onClick={handlePlaySfx}
            disabled={loading.sfx || !sfxUrl.trim()}
            className="flex items-center gap-1 rounded-md bg-orange-500 px-3 py-1 text-[10px] font-medium text-white transition-colors hover:bg-orange-400 disabled:opacity-40"
          >
            {loading.sfx ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
            {loading.sfx ? "加载中…" : "播放音效"}
          </button>
        </div>

        {/* 语音播放区 */}
        <div className="mb-3 rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-xs font-semibold text-zinc-200">Voice 语音</span>
            {playing.voice && (
              <span className="flex items-center gap-1 text-[9px] text-emerald-400">
                <Volume2 className="h-2.5 w-2.5" /> 播放中
              </span>
            )}
          </div>
          <input
            type="text"
            value={voiceUrl}
            onChange={(e) => setVoiceUrl(e.target.value)}
            placeholder="输入语音 URL..."
            className="mb-2 w-full rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-[11px] text-zinc-200 focus:outline-none focus:ring-1 focus:ring-orange-500"
          />
          <button
            onClick={handlePlayVoice}
            disabled={loading.voice || !voiceUrl.trim()}
            className="flex items-center gap-1 rounded-md bg-orange-500 px-3 py-1 text-[10px] font-medium text-white transition-colors hover:bg-orange-400 disabled:opacity-40"
          >
            {loading.voice ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
            {loading.voice ? "加载中…" : "播放语音"}
          </button>
        </div>

        {/* 音量控制 */}
        <div className="mb-3 rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
          <div className="mb-2 text-xs font-semibold text-zinc-200">音量控制</div>
          <div className="space-y-2">
            {VOLUME_TYPES.map((vt) => (
              <div key={vt.id} className="flex items-center gap-2">
                <span className="w-12 text-[10px] text-zinc-400">{vt.label}</span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={volumes[vt.id]}
                  onChange={(e) => handleVolumeChange(vt.id, parseFloat(e.target.value))}
                  className="flex-1 accent-orange-500"
                />
                <span className="w-8 text-right text-[10px] text-zinc-500">
                  {Math.round(volumes[vt.id] * 100)}%
                </span>
                {volumes[vt.id] === 0 && <VolumeX className="h-3 w-3 text-zinc-600" />}
              </div>
            ))}
          </div>
        </div>

        {/* 全部停止 */}
        <button
          onClick={handleStopAll}
          className="flex items-center justify-center gap-1.5 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-[11px] font-medium text-red-400 transition-colors hover:bg-red-500/20"
        >
          <VolumeX className="h-3 w-3" /> 停止所有音频
        </button>

        {/* 底部提示 */}
        <div className="mt-3 rounded-md border border-zinc-800 bg-zinc-900/50 p-3">
          <p className="text-[11px] text-zinc-500">
            💡 音频通过 <code className="text-orange-400">AudioManager</code> 单例播放，
            支持 BGM 循环淡入淡出、一次性音效、语音播放。音量设置实时应用到引擎。
            音频 URL 需支持 CORS 跨域访问。
          </p>
        </div>
      </div>
    </div>
  );
}
