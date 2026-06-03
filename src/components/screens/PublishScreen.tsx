"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2, AlertTriangle, Copy, ExternalLink,
  ChevronRight, Rocket,
  Download, Upload, Globe, Package, Layers,
} from "lucide-react";
import { useNarrativeStore, useUIStore, useProjectStore } from "@/store";
import { usePathname } from "next/navigation";
import { UpstreamReadiness } from "@/components/ui/UpstreamReadiness";

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

// ── 多端导出格式 ─────────────────────────────────────────────────────────
const EXPORT_FORMATS = [
  {
    id: 'webgal',
    name: 'WebGAL 脚本',
    icon: '\u{1F3AE}',
    description: '导出为 WebGAL 引擎可执行的脚本格式，支持在 WebGAL 平台上运行。',
    status: 'ready',
    estimatedSize: '2.4 MB',
    features: ['场景脚本', '对白系统', '选择分支', '变量条件', 'BGM/音效指令'],
  },
  {
    id: 'renpy',
    name: "Ren'Py 脚本",
    icon: '\u{1F40D}',
    description: "导出为 Ren'Py 引擎的 .rpy 格式，适用于 Python 生态的视觉小说开发。",
    status: 'ready',
    estimatedSize: '1.8 MB',
    features: ['Label 结构', 'Menu 选择', '条件跳转', '变量系统', '资源引用'],
  },
  {
    id: 'json',
    name: '自定义 JSON',
    icon: '\u{1F4CB}',
    description: '导出为结构化 JSON，包含完整的节点图、变量、资产引用等所有数据。',
    status: 'ready',
    estimatedSize: '856 KB',
    features: ['完整节点图', '变量定义', '资产清单', '叙事意图', '质检结果'],
  },
  {
    id: 'h5-package',
    name: '互动 H5 包',
    icon: '\u{1F4E6}',
    description: '打包为独立的 H5 应用，可直接部署到服务器或 CDN，玩家通过链接访问。',
    status: 'ready',
    estimatedSize: '12.6 MB',
    features: ['运行时引擎', '场景渲染器', '选择系统', '存档/读档', '资产打包'],
  },
  {
    id: 'ink',
    name: 'Inkle Ink 格式',
    icon: '\u{1F58A}\uFE0F',
    description: '导出为 Ink 互动小说格式，适用于 Unity 集成和文本冒险游戏。',
    status: 'beta',
    estimatedSize: '420 KB',
    features: ['Knot 结构', 'Stitch 子场景', '变量', '条件', 'Choice 选择'],
  },
  {
    id: 'pdf-script',
    name: 'PDF 剧本',
    icon: '\u{1F4C4}',
    description: '导出为格式化的 PDF 剧本文档，包含所有分支路径和注释，适合团队审阅。',
    status: 'ready',
    estimatedSize: '3.2 MB',
    features: ['分幕排版', '对白格式', '分支标注', '变量说明', '导演注释'],
  },
];

// ── 行业发布格式 ─────────────────────────────────────────────────────────
const INDUSTRY_TABS = ['游戏', '文旅', '教育', '衍生'];
const INDUSTRY_FORMATS: Record<string, { id: string; name: string; description: string; status: string; estimatedSize: string }[]> = {
  '游戏': [
    { id: 'game-webgal', name: 'WebGAL', description: '导出为 WebGAL 引擎脚本，支持 Web 平台运行', status: 'ready', estimatedSize: '2.4 MB' },
    { id: 'game-h5', name: 'H5 包', description: '打包为独立 H5 应用，可通过链接直接访问', status: 'ready', estimatedSize: '12.6 MB' },
    { id: 'game-json', name: 'JSON', description: '导出完整结构化 JSON 数据，便于二次开发', status: 'ready', estimatedSize: '856 KB' },
    { id: 'game-engine', name: '引擎导出', description: '导出至 Unity/Godot 等游戏引擎', status: 'beta', estimatedSize: '18.5 MB' },
  ],
  '文旅': [
    { id: 'tour-h5', name: 'H5 导览版', description: '适配移动端导览场景，支持 GPS 定位触发', status: 'ready', estimatedSize: '8.2 MB' },
    { id: 'tour-wechat', name: '微信小程序包', description: '打包为微信小程序，支持馆内扫码体验', status: 'ready', estimatedSize: '6.5 MB' },
    { id: 'tour-screen', name: '馆内屏幕版', description: '适配大屏触控交互，用于展厅固定设备', status: 'beta', estimatedSize: '15.3 MB' },
    { id: 'tour-ar', name: 'AR 标记版', description: '基于 AR 标记触发的增强现实互动体验', status: 'alpha', estimatedSize: '22.1 MB' },
    { id: 'tour-offline', name: '离线导览版', description: '支持离线运行的导览包，适用于无网络环境', status: 'ready', estimatedSize: '35.8 MB' },
  ],
  '教育': [
    { id: 'edu-classroom', name: '课堂演示包', description: '适配课堂投屏场景，教师控制进度', status: 'ready', estimatedSize: '5.4 MB' },
    { id: 'edu-scorm', name: 'SCORM 课件', description: '符合 SCORM 2004 标准，可导入主流 LMS', status: 'ready', estimatedSize: '7.8 MB' },
    { id: 'edu-lti', name: 'LTI 集成', description: '支持 LTI 1.3 协议，无缝对接学习平台', status: 'beta', estimatedSize: '1.2 MB' },
    { id: 'edu-report', name: '学习报告模板', description: '导出学习进度报告模板，支持数据分析', status: 'ready', estimatedSize: '320 KB' },
    { id: 'edu-selfstudy', name: '自学链接', description: '生成独立学习链接，学生自主完成互动课程', status: 'ready', estimatedSize: '4.6 MB' },
  ],
  '衍生': [
    { id: 'spin-player', name: '互动短剧播放器', description: '独立播放器应用，支持多平台分发', status: 'ready', estimatedSize: '9.8 MB' },
    { id: 'spin-h5', name: 'H5 互动播放', description: '轻量级 H5 互动播放页面，适合社交传播', status: 'ready', estimatedSize: '6.2 MB' },
    { id: 'spin-iframe', name: '平台嵌入 iframe', description: '生成可嵌入的 iframe 代码，适配第三方平台', status: 'ready', estimatedSize: '0.8 MB' },
    { id: 'spin-social', name: '社交媒体短版', description: '精简为 60 秒互动短片，适配短视频平台', status: 'beta', estimatedSize: '3.5 MB' },
    { id: 'spin-live', name: '互动直播版', description: '支持直播间互动投票和分支选择', status: 'alpha', estimatedSize: '11.2 MB' },
  ],
};

// ── 主页面 ────────────────────────────────────────────────────────────────
export default function PublishScreen() {
  const pathname = usePathname();
  // ── Store selectors ──
  const projectName = useProjectStore(s => s.currentProject()?.title) || "当前项目";
  const qualityChecks = useNarrativeStore(s => s.qualityChecks);
  const engineExportConfigs = useNarrativeStore(s => s.engineExportConfigs);
  const addToast = useUIStore(s => s.addToast);

  // ── Tab 状态 ──
  const [activeTab, setActiveTab] = useState(0);

  // ── 通用状态 ──
  const [copied, setCopied] = useState(false);
  const url = "https://play.zhuomeng.ai/ghost-protocol-v1";
  const pass = qualityChecks.filter((c) => c.status === 'ok').length;

  // ── 导出状态 ──
  const [exportStates, setExportStates] = useState<Record<string, { status: 'idle' | 'exporting' | 'done' }>>({});
  const [engineExportStates, setEngineExportStates] = useState<Record<string, { status: 'idle' | 'exporting' | 'done' }>>({});
  const [industryTab, setIndustryTab] = useState(0);

  // ── Handlers ──
  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = (formatId: string) => {
    setExportStates((prev) => ({ ...prev, [formatId]: { status: 'exporting' } }));
    setTimeout(() => {
      setExportStates((prev) => ({ ...prev, [formatId]: { status: 'done' } }));
      addToast({ type: 'success', title: '导出完成', message: `已成功导出 ${formatId} 格式` });
    }, 2000);
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
                  <p className="text-[9px]" style={{ color: S.text3 }}>{EXPORT_FORMATS.length} 种导出格式</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {EXPORT_FORMATS.map((fmt) => {
                  const state = exportStates[fmt.id]?.status ?? 'idle';
                  return (
                    <div key={fmt.id} className="p-2.5 rounded-xl" style={{ background: S.s2, border: `1px solid ${S.border}` }}>
                      <div className="flex items-start justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{fmt.icon}</span>
                          <div>
                            <span className="text-[10px] font-bold" style={{ color: S.text }}>{fmt.name}</span>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className="text-[8px] font-bold px-1.5 py-0.5 rounded" style={{
                                background: fmt.status === 'ready' ? `${S.success}12` : `${S.warning}12`,
                                color: fmt.status === 'ready' ? S.success : S.warning,
                              }}>
                                {fmt.status === 'ready' ? '就绪' : 'Beta'}
                              </span>
                              <span className="text-[8px] font-mono" style={{ color: S.text3 }}>{fmt.estimatedSize}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <p className="text-[9px] mb-1.5 leading-relaxed" style={{ color: S.text2 }}>{fmt.description}</p>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {fmt.features.map((feat) => (
                          <span key={feat} className="text-[7px] px-1 py-0.5 rounded"
                            style={{ background: `${S.primary}08`, color: S.text3, border: `1px solid ${S.border}` }}>
                            {feat}
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
                              ghost-protocol_{fmt.id}.{
                                fmt.id === 'json' ? 'json' :
                                fmt.id === 'webgal' ? 'txt' :
                                fmt.id === 'renpy' ? 'rpy' :
                                fmt.id === 'ink' ? 'ink' :
                                fmt.id === 'h5-package' ? 'zip' : 'pdf'
                              }
                            </span>
                            <span className="font-mono" style={{ color: S.text3 }}>{fmt.estimatedSize}</span>
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
                {INDUSTRY_TABS.map((tab, idx) => (
                  <motion.button
                    key={tab}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIndustryTab(idx)}
                    className="flex-1 py-1.5 rounded-md text-[10px] font-bold focus:outline-none"
                    style={{
                      background: industryTab === idx ? S.card : 'transparent',
                      color: industryTab === idx ? S.primary : S.text3,
                      boxShadow: industryTab === idx ? `0 1px 3px ${S.border}` : 'none',
                    }}
                  >
                    {tab}
                  </motion.button>
                ))}
              </div>
              {/* Format cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {(INDUSTRY_FORMATS[INDUSTRY_TABS[industryTab]] ?? []).map((fmt) => {
                  const fmtState = exportStates[fmt.id]?.status ?? 'idle';
                  return (
                    <div key={fmt.id} className="p-2.5 rounded-xl" style={{ background: S.s2, border: `1px solid ${S.border}` }}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold" style={{ color: S.text }}>{fmt.name}</span>
                          <span className="text-[8px] font-bold px-1.5 py-0.5 rounded" style={{
                            background: fmt.status === 'ready' ? `${S.success}12` : fmt.status === 'beta' ? `${S.warning}12` : `${S.error}12`,
                            color: fmt.status === 'ready' ? S.success : fmt.status === 'beta' ? S.warning : S.error,
                          }}>
                            {fmt.status === 'ready' ? '就绪' : fmt.status === 'beta' ? 'Beta' : 'Alpha'}
                          </span>
                        </div>
                        <span className="text-[8px] font-mono" style={{ color: S.text3 }}>{fmt.estimatedSize}</span>
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
