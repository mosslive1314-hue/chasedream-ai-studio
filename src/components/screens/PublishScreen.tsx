import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2, AlertTriangle, Copy, ExternalLink,
  ChevronRight, Rocket,
  Download, Upload, Globe, Package, Layers,
} from "lucide-react";
import { useNarrativeStore, useUIStore, getCurrentProject, useExportStore } from "@/store";
import { useLocation } from "@tanstack/react-router";
import { UpstreamReadiness } from "@/components/ui/UpstreamReadiness";
import { EXPORT_CATEGORY_LABELS, getFormatsByIndustry } from "@/lib/seed/export-formats-seed";

// ── 设计系统 ──────────────────────────────────────────────────────────────
const S = {
  bg: "#FAFBFF", card: "#FFFFFF", s2: "#F4F6FC", s3: "#EDF0F8",
  border: "#E2E5F0", border2: "#CBD0E5",
  primary: "#5E50E8", primary10: "rgba(94,80,232,0.10)", primary20: "rgba(94,80,232,0.20)",
  accent: "#00A99D", accent10: "rgba(0,169,157,0.10)",
  text: "#1A1D2E", text2: "#4A5068", text3: "#8892B0",
  success: "#059669", success10: "rgba(5,150,105,0.10)",
  warning: "#D97706", warning10: "rgba(217,119,6,0.10)",
  error: "#DC2626", error10: "rgba(220,38,38,0.10)",
};

// ── 导出格式（来自 ExportStore）──────────────────────────────────────────
const EXPORT_ICON_MAP: Record<string, string> = {
  webgal: '🎮', renpy: '🐍', json: '📋', 'h5-package': '📦',
  ink: '🖊️', 'pdf-script': '📄', openapi: '📐', unity: '🎯',
  godot: '🤖', 'yarn-spinner': '🧶', lua: '🌙', 'h5-guide': '📖',
  'wechat-mini': '💬', scorm: '🎓', 'classroom-demo': '🏫',
  'interactive-short': '🎬', 'iframe-embed': '🖥️', 'social-media': '📱',
};

// ── 行业发布格式（来自 ExportStore）────────────────────────────────────────
const INDUSTRY_TABS = ['游戏', '文旅', '教育', '衍生'];
const INDUSTRY_MAP: Record<string, 'game' | 'tourism' | 'education' | 'derivative'> = {
  '游戏': 'game', '文旅': 'tourism', '教育': 'education', '衍生': 'derivative',
};

// ── 主页面 ────────────────────────────────────────────────────────────────
export default function PublishScreen() {
  const location = useLocation();
  const pathname = location.pathname;
  // ── Store selectors ──
  const projectName = getCurrentProject()?.title || "当前项目";
  const qualityChecks = useNarrativeStore(s => s.qualityChecks);
  const engineExportConfigs = useNarrativeStore(s => s.engineExportConfigs);
  const addToast = useUIStore(s => s.addToast);
  const industry = useUIStore(s => s.industry);
  const setIndustry = useUIStore(s => s.setIndustry);

  // ── Export Store selectors (safe: data only, no functions in state) ──
  const exportFormats = useExportStore(s => s.formats);
  const exportJobs = useExportStore(s => s.jobs);
  const recentJobs = useMemo(
    () => [...exportJobs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10),
    [exportJobs],
  );
  const runExport = useCallback(
    (formatId: string, options?: Record<string, string | boolean | number>) =>
      useExportStore.getState().runExport(formatId as any, options),
    [],
  );

  // 多端导出：只取主要格式（script + interactive + package 类别）
  const mainExportFormats = exportFormats.filter(f =>
    f.category === 'script' || f.category === 'interactive' || f.category === 'package' || f.category === 'document'
  );

  // ── Tab 状态 ──
  const [activeTab, setActiveTab] = useState(0);

  // ── 通用状态 ──
  const [copied, setCopied] = useState(false);
  const url = "https://play.zhuomeng.ai/ghost-protocol-v1";
  const pass = qualityChecks.filter((c) => c.status === 'ok').length;

  // ── 导出状态 ──
  const [exportStates, setExportStates] = useState<Record<string, { status: 'idle' | 'exporting' | 'done' }>>({});
  const [engineExportStates, setEngineExportStates] = useState<Record<string, { status: 'idle' | 'exporting' | 'done' }>>({});
  // 行业导出：按当前选中的行业筛选（使用全局 industry）
  const industryFormats = getFormatsByIndustry(industry);

  // ── Handlers ──
  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = async (formatId: string) => {
    setExportStates((prev) => ({ ...prev, [formatId]: { status: 'exporting' } }));
    try {
      await runExport(formatId as any);
      setExportStates((prev) => ({ ...prev, [formatId]: { status: 'done' } }));
      const fmt = exportFormats.find(f => f.id === formatId);
      addToast({ type: 'success', title: '导出完成', message: `已成功导出 ${fmt?.name ?? formatId} 格式` });
    } catch {
      setExportStates((prev) => ({ ...prev, [formatId]: { status: 'idle' } }));
      addToast({ type: 'error', title: '导出失败', message: `${formatId} 导出过程中出错` });
    }
  };

  const handleEngineExport = (engineId: string) => {
    setEngineExportStates((prev) => ({ ...prev, [engineId]: { status: 'exporting' } }));
    setTimeout(() => {
      setEngineExportStates((prev) => ({ ...prev, [engineId]: { status: 'done' } }));
      addToast({ type: 'success', title: '引擎导出完成', message: `已成功导出 ${engineId} 引擎格式` });
    }, 2500);
  };

  return (
    <div className="min-h-svh overflow-y-auto" style={{ background: S.bg }}>
      <UpstreamReadiness currentPath={pathname} />

      {/* ── Tab Bar ── */}
      <div className="flex items-center gap-2 px-4 pt-3">
        {[
          { label: "发布设置", icon: Rocket },
          { label: "发布检查", icon: CheckCircle2 },
          { label: "导出配置", icon: Package },
        ].map((tab, i) => {
          const TabIcon = tab.icon;
          return (
            <motion.button key={i} whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab(i)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all focus:outline-none"
              style={{
                background: activeTab === i ? S.primary : S.s2,
                color: activeTab === i ? "#fff" : S.text2,
                border: `1px solid ${activeTab === i ? S.primary : S.border}`,
                boxShadow: activeTab === i ? `0 2px 8px ${S.primary}30` : "none",
              }}>
              <TabIcon size={12} />
              <span>{tab.label}</span>
            </motion.button>
          );
        })}
      </div>

      <div className="p-3">

        {/* ════════════════════════════════════════════════════════════════
            TAB 0: 发布设置 (merged: 发布状态 + 发布设置)
           ════════════════════════════════════════════════════════════════ */}
        {activeTab === 0 && (
          <div className="max-w-lg space-y-3">
            {/* ── 发布 URL ── */}
            <div className="rounded-xl p-4" style={{ background: S.card, border: `1px solid ${S.border}` }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: S.primary10 }}>
                    <ExternalLink size={14} style={{ color: S.primary }} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold" style={{ color: S.text }}>发布状态</h3>
                    <p className="text-[9px]" style={{ color: S.text3 }}>在线访问地址与版本信息</p>
                  </div>
                </div>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded"
                  style={{ background: `${S.success}12`, color: S.success }}>
                  已发布
                </span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-lg" style={{ background: S.s2 }}>
                <ExternalLink size={12} style={{ color: S.accent }} />
                <span className="text-[10px] font-mono flex-1 truncate" style={{ color: S.text2 }}>{url}</span>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={handleCopy}
                  className="text-[9px] font-bold px-2 py-1 rounded focus:outline-none"
                  style={{
                    background: copied ? `${S.success}15` : `${S.primary}12`,
                    color: copied ? S.success : S.primary,
                  }}
                >
                  {copied ? "已复制" : <><Copy size={9} className="inline mr-0.5" />复制</>}
                </motion.button>
              </div>
            </div>

            {/* ── 发布设置 ── */}
            <div className="rounded-xl p-4" style={{ background: S.card, border: `1px solid ${S.border}` }}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: S.primary10 }}>
                  <Layers size={14} style={{ color: S.primary }} />
                </div>
                <div>
                  <h3 className="text-xs font-bold" style={{ color: S.text }}>发布设置</h3>
                  <p className="text-[9px]" style={{ color: S.text3 }}>配置作品的发布参数与展示信息</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {([
                  ["作品类型", "互动 H5", "选择作品的发布形态"],
                  ["画幅", "移动端竖屏 9:16", "作品的显示比例"],
                  ["分享标题", projectName, "在社交平台分享时显示的标题"],
                  ["付费模式", "免费试玩", "设置作品的付费与试看策略"],
                ] as const).map(([k, v, desc]) => (
                  <div key={k} className="p-3 rounded-xl" style={{ background: S.s2, border: `1px solid ${S.border}` }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[9px] font-bold" style={{ color: S.text3 }}>{k}</span>
                      <span className="text-[8px] font-bold px-1.5 py-0.5 rounded" style={{ background: `${S.primary}10`, color: S.primary }}>编辑</span>
                    </div>
                    <span className="text-[11px] font-medium block" style={{ color: S.text }}>{v}</span>
                    {desc && <span className="text-[8px] block mt-1" style={{ color: S.text3 }}>{desc}</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* ── 更新发布 ── */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              className="w-full py-2.5 rounded-lg text-xs font-bold text-white focus:outline-none"
              style={{ background: `linear-gradient(135deg,${S.primary},#7B6EF5)` }}
            >
              <Rocket size={12} className="inline mr-1" style={{ verticalAlign: "-1px" }} />
              更新发布
            </motion.button>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════
            TAB 1: 发布检查
           ════════════════════════════════════════════════════════════════ */}
        {activeTab === 1 && (
          <div className="max-w-2xl">
            <div className="rounded-xl p-4" style={{ background: S.card, border: `1px solid ${S.border}` }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: S.primary10 }}>
                    <CheckCircle2 size={14} style={{ color: S.primary }} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold" style={{ color: S.text }}>发布检查清单</h3>
                    <p className="text-[9px]" style={{ color: S.text3 }}>{pass}/{qualityChecks.length} 项通过</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-20 rounded-full overflow-hidden" style={{ background: S.s3 }}>
                    <div className="h-full rounded-full" style={{
                      width: `${Math.round((pass / qualityChecks.length) * 100)}%`,
                      background: pass === qualityChecks.length ? S.success : S.warning,
                    }} />
                  </div>
                  <span className="text-[10px] font-mono font-bold" style={{
                    color: pass === qualityChecks.length ? S.success : S.warning,
                  }}>
                    {Math.round((pass / qualityChecks.length) * 100)}%
                  </span>
                </div>
              </div>
              <div className="space-y-1.5">
                {qualityChecks.map((c) => (
                  <div key={c.id} className="flex items-center gap-2.5 p-2 rounded-lg" style={{ background: S.s2 }}>
                    {c.status === 'ok'
                      ? <CheckCircle2 size={14} color={S.success} className="shrink-0" />
                      : <AlertTriangle size={14} color={S.warning} className="shrink-0" />}
                    <div className="flex-1">
                      <span className="text-[10px] font-bold" style={{ color: c.status === 'ok' ? S.text : S.warning }}>{c.label}</span>
                    </div>
                    <span className="text-[8px] font-bold px-1.5 py-0.5 rounded" style={{
                      background: c.status === 'ok' ? `${S.success}12` : `${S.warning}12`,
                      color: c.status === 'ok' ? S.success : S.warning,
                    }}>
                      {c.status === 'ok' ? '通过' : '待处理'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════
            TAB 2: 导出配置
           ════════════════════════════════════════════════════════════════ */}
        {activeTab === 2 && (
          <div className="space-y-3">

            {/* ── 多端导出 ── */}
            <div className="rounded-xl p-3" style={{ background: S.card, border: `1px solid ${S.border}` }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: S.primary10 }}>
                  <Download size={13} style={{ color: S.primary }} />
                </div>
                <div>
                  <h3 className="text-xs font-bold" style={{ color: S.text }}>多端导出</h3>
                  <p className="text-[9px]" style={{ color: S.text3 }}>{mainExportFormats.length} 种导出格式</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {mainExportFormats.map((fmt) => {
                  const state = exportStates[fmt.id]?.status ?? 'idle';
                  const icon = EXPORT_ICON_MAP[fmt.id] ?? '📄';
                  const statusLabel = fmt.stability === 'stable' ? '就绪' : fmt.stability === 'beta' ? 'Beta' : 'Alpha';
                  const statusColor = fmt.stability === 'stable' ? S.success : fmt.stability === 'beta' ? S.warning : S.error;
                  return (
                    <div key={fmt.id} className="p-2.5 rounded-xl" style={{ background: S.s2, border: `1px solid ${S.border}` }}>
                      <div className="flex items-start justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{icon}</span>
                          <div>
                            <span className="text-[10px] font-bold" style={{ color: S.text }}>{fmt.name}</span>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className="text-[8px] font-bold px-1.5 py-0.5 rounded" style={{
                                background: `${statusColor}12`,
                                color: statusColor,
                              }}>
                                {statusLabel}
                              </span>
                              <span className="text-[8px] font-mono" style={{ color: S.text3 }}>{fmt.fileExtension}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <p className="text-[9px] mb-1.5 leading-relaxed" style={{ color: S.text2 }}>{fmt.description}</p>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {fmt.capabilities.slice(0, 5).map((cap) => (
                          <span key={cap} className="text-[7px] px-1 py-0.5 rounded"
                            style={{ background: `${S.primary}08`, color: S.text3, border: `1px solid ${S.border}` }}>
                            {cap}
                          </span>
                        ))}
                      </div>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => state === 'idle' && handleExport(fmt.id)}
                        disabled={state !== 'idle'}
                        className="w-full py-1.5 rounded-lg text-[10px] font-bold focus:outline-none"
                        style={{
                          background: state === 'done' ? `${S.success}12` : state === 'exporting' ? `${S.primary}08` : `${S.primary}12`,
                          color: state === 'done' ? S.success : state === 'exporting' ? S.text3 : S.primary,
                          cursor: state === 'idle' ? 'pointer' : 'default',
                        }}
                      >
                        {state === 'exporting' && (
                          <>
                            <span className="inline-block animate-spin mr-1" style={{ fontSize: '10px' }}>&#8987;</span>
                            导出中...
                          </>
                        )}
                        {state === 'done' && <>&#x2705; 已导出</>}
                        {state === 'idle' && (
                          <>
                            <Download size={10} className="inline mr-1" style={{ verticalAlign: '-1px' }} />
                            导出
                          </>
                        )}
                      </motion.button>
                      {state === 'done' && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-1.5 p-1.5 rounded-lg text-[8px]"
                          style={{ background: `${S.success}06`, border: `1px solid ${S.success}15` }}
                        >
                          <div className="flex items-center justify-between">
                            <span style={{ color: S.text3 }}>
                              <CheckCircle2 size={8} className="inline mr-1" style={{ color: S.success }} />
                              export-{fmt.id}{fmt.fileExtension}
                            </span>
                          </div>
                          <button className="text-[8px] font-bold mt-1 focus:outline-none" style={{ color: S.primary }}>
                            <Download size={7} className="inline mr-0.5" />
                            下载文件
                          </button>
                        </motion.div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── 行业发布格式 ── */}
            <div className="rounded-xl p-3" style={{ background: S.card, border: `1px solid ${S.border}` }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: S.primary10 }}>
                  <Globe size={13} style={{ color: S.primary }} />
                </div>
                <div>
                  <h3 className="text-xs font-bold" style={{ color: S.text }}>行业发布格式</h3>
                  <p className="text-[9px]" style={{ color: S.text3 }}>按行业定制发布输出</p>
                </div>
              </div>
              {/* Industry sub-tabs */}
              <div className="flex gap-1 mb-2 p-1 rounded-lg" style={{ background: S.s2 }}>
                {INDUSTRY_TABS.map((tab) => {
                  const tabValue = INDUSTRY_MAP[tab];
                  return (
                  <motion.button
                    key={tab}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIndustry(tabValue)}
                    className="flex-1 py-1.5 rounded-md text-[10px] font-bold focus:outline-none"
                    style={{
                      background: industry === tabValue ? S.card : 'transparent',
                      color: industry === tabValue ? S.primary : S.text3,
                      boxShadow: industry === tabValue ? `0 1px 3px ${S.border}` : 'none',
                    }}
                  >
                    {tab}
                  </motion.button>
                  );
                })}
              </div>
              {/* Format cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {industryFormats.map((fmt) => {
                  const fmtState = exportStates[fmt.id]?.status ?? 'idle';
                  const fmtIcon = EXPORT_ICON_MAP[fmt.id] ?? '📄';
                  return (
                    <div key={fmt.id} className="p-2.5 rounded-xl" style={{ background: S.s2, border: `1px solid ${S.border}` }}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{fmtIcon}</span>
                          <span className="text-[10px] font-bold" style={{ color: S.text }}>{fmt.name}</span>
                          <span className="text-[8px] font-bold px-1.5 py-0.5 rounded" style={{
                            background: fmt.stability === 'stable' ? `${S.success}12` : fmt.stability === 'beta' ? `${S.warning}12` : `${S.error}12`,
                            color: fmt.stability === 'stable' ? S.success : fmt.stability === 'beta' ? S.warning : S.error,
                          }}>
                            {fmt.stability === 'stable' ? '就绪' : fmt.stability === 'beta' ? 'Beta' : 'Alpha'}
                          </span>
                        </div>
                        <span className="text-[8px] font-mono" style={{ color: S.text3 }}>{fmt.fileExtension}</span>
                      </div>
                      <p className="text-[9px] mb-1.5" style={{ color: S.text2 }}>{fmt.description}</p>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => fmtState === 'idle' && handleExport(fmt.id)}
                        disabled={fmtState !== 'idle'}
                        className="w-full py-1.5 rounded-lg text-[10px] font-bold focus:outline-none"
                        style={{
                          background: fmtState === 'done' ? `${S.success}12` : fmtState === 'exporting' ? `${S.primary}08` : `${S.primary}12`,
                          color: fmtState === 'done' ? S.success : fmtState === 'exporting' ? S.text3 : S.primary,
                          cursor: fmtState === 'idle' ? 'pointer' : 'default',
                        }}
                      >
                        {fmtState === 'exporting' && (
                          <>
                            <span className="inline-block animate-spin mr-1" style={{ fontSize: '10px' }}>&#8987;</span>
                            发布中...
                          </>
                        )}
                        {fmtState === 'done' && <>&#x2705; 已发布</>}
                        {fmtState === 'idle' && (
                          <>
                            <Upload size={10} className="inline mr-1" style={{ verticalAlign: '-1px' }} />
                            发布
                          </>
                        )}
                      </motion.button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── 引擎导出 (Beta) ── */}
            <div className="rounded-xl p-3" style={{ background: S.card, border: `1px solid ${S.border}` }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: S.primary10 }}>
                  <Rocket size={13} style={{ color: S.primary }} />
                </div>
                <div>
                  <h3 className="text-xs font-bold" style={{ color: S.text }}>引擎导出 (Beta)</h3>
                  <p className="text-[9px]" style={{ color: S.text3 }}>{engineExportConfigs.length} 个引擎目标</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {engineExportConfigs.map((engine) => {
                  const state = engineExportStates[engine.id]?.status ?? 'idle';
                  const statusColor = engine.status === 'stable' ? S.success : engine.status === 'beta' ? S.warning : S.error;
                  const statusLabel = engine.status === 'stable' ? 'Stable' : engine.status === 'beta' ? 'Beta' : 'Alpha';
                  const visibleMappings = engine.fieldMappings.slice(0, 3);
                  const remainingMappings = engine.fieldMappings.length - visibleMappings.length;
                  return (
                    <motion.div
                      key={engine.id}
                      whileHover={{ y: -1, boxShadow: `0 4px 12px ${S.primary}10` }}
                      transition={{ duration: 0.15 }}
                      className="p-2.5 rounded-xl"
                      style={{ background: S.s2, border: `1px solid ${S.border}` }}
                    >
                      <div className="flex items-start justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{engine.icon}</span>
                          <div>
                            <span className="text-[10px] font-bold" style={{ color: S.text }}>{engine.name}</span>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className="text-[8px] font-bold px-1.5 py-0.5 rounded"
                                style={{ background: `${statusColor}12`, color: statusColor }}>
                                {statusLabel}
                              </span>
                              <span className="text-[8px] font-mono" style={{ color: S.text3 }}>{engine.estimatedSize}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <p className="text-[9px] mb-1.5 leading-relaxed" style={{ color: S.text2 }}>{engine.description}</p>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {engine.features.map((feat) => (
                          <span key={feat} className="text-[7px] px-1 py-0.5 rounded"
                            style={{ background: `${S.primary}08`, color: S.text3, border: `1px solid ${S.border}` }}>
                            {feat}
                          </span>
                        ))}
                      </div>
                      {/* 字段映射预览 */}
                      <div className="mb-2">
                        <div className="text-[8px] font-bold mb-1" style={{ color: S.text3 }}>字段映射预览</div>
                        <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${S.border}` }}>
                          {visibleMappings.map((m, mi) => (
                            <div key={mi} className="flex items-center text-[8px] px-2 py-0.5"
                              style={{ background: mi % 2 === 0 ? S.card : S.s2, borderBottom: mi < visibleMappings.length - 1 ? `1px solid ${S.border}` : 'none' }}>
                              <span className="font-mono flex-1 truncate" style={{ color: S.text2 }}>{m.sourceField}</span>
                              <ChevronRight size={8} style={{ color: S.text3 }} className="mx-1 shrink-0" />
                              <span className="font-mono flex-1 truncate" style={{ color: m.mapped ? S.accent : S.warning }}>{m.targetField}</span>
                              {m.mapped && <CheckCircle2 size={8} style={{ color: S.success }} className="shrink-0 ml-1" />}
                            </div>
                          ))}
                          {remainingMappings > 0 && (
                            <div className="text-center py-0.5 text-[8px]" style={{ background: S.s2, color: S.text3, borderTop: `1px solid ${S.border}` }}>
                              +{remainingMappings} 更多映射
                            </div>
                          )}
                        </div>
                      </div>
                      {/* 导出选项 */}
                      {engine.customOptions.length > 0 && (
                        <div className="mb-2 space-y-1">
                          <div className="text-[8px] font-bold mb-0.5" style={{ color: S.text3 }}>导出选项</div>
                          {engine.customOptions.map((opt) => (
                            <div key={opt.key} className="flex items-center justify-between px-2 py-0.5 rounded-lg" style={{ background: S.card }}>
                              <span className="text-[9px]" style={{ color: S.text2 }}>{opt.label}</span>
                              {opt.type === 'boolean' ? (
                                <div className="w-7 h-4 rounded-full relative cursor-pointer" style={{ background: opt.defaultValue ? S.primary : S.s3 }}>
                                  <div className="w-3 h-3 rounded-full absolute top-0.5 transition-all" style={{
                                    background: '#fff', left: opt.defaultValue ? '14px' : '2px',
                                  }} />
                                </div>
                              ) : (
                                <span className="text-[8px] font-mono px-1.5 py-0.5 rounded" style={{ background: S.s2, color: S.text2, border: `1px solid ${S.border}` }}>
                                  {String(opt.defaultValue)}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => state === 'idle' && handleEngineExport(engine.id)}
                        disabled={state !== 'idle'}
                        className="w-full py-1.5 rounded-lg text-[10px] font-bold focus:outline-none"
                        style={{
                          background: state === 'done' ? `${S.success}12` : state === 'exporting' ? `${S.primary}08` : `${S.primary}12`,
                          color: state === 'done' ? S.success : state === 'exporting' ? S.text3 : S.primary,
                          cursor: state === 'idle' ? 'pointer' : 'default',
                        }}
                      >
                        {state === 'exporting' && (
                          <>
                            <span className="inline-block animate-spin mr-1" style={{ fontSize: '10px' }}>&#8987;</span>
                            导出中...
                          </>
                        )}
                        {state === 'done' && <>&#x2705; 已导出 {engine.format}</>}
                        {state === 'idle' && (
                          <>
                            <Download size={10} className="inline mr-1" style={{ verticalAlign: '-1px' }} />
                            导出 {engine.format}
                          </>
                        )}
                      </motion.button>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 底部留白 */}
        <div className="h-3" />
      </div>
    </div>
  );
}
