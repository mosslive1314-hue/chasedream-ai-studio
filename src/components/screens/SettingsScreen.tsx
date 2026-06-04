"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings, Cpu, Download, Code2,
  ChevronDown, Save, CloudUpload, RotateCcw,
  Globe, Shield, Bot, Zap, Eye, EyeOff, Key, CheckCircle2,
} from "lucide-react";
import { useSettingsStore } from "@/store";

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

/* ── Tab definitions ──────────────────────────────────────────────────────── */
type TabKey = "project" | "ai" | "agent" | "export" | "dev";

const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: "project", label: "项目设置", icon: Globe },
  { key: "ai", label: "AI配置", icon: Cpu },
  { key: "agent", label: "Agent技能", icon: Bot },
  { key: "export", label: "导出与备份", icon: Download },
  { key: "dev", label: "开发者", icon: Code2 },
];

/* ── 自定义 Toggle 开关 ─────────────────────────────────────────────────── */
function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      onClick={() => onChange(!value)}
      className="relative cursor-pointer"
      style={{
        width: 40,
        height: 22,
        borderRadius: 11,
        background: value ? S.primary : S.s3,
        transition: "background 0.2s",
      }}
    >
      <motion.div
        animate={{ x: value ? 20 : 2 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        style={{
          position: "absolute",
          top: 2,
          width: 18,
          height: 18,
          borderRadius: 9,
          background: "#FFFFFF",
          boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
        }}
      />
    </div>
  );
}

/* ── 卡片标题 ───────────────────────────────────────────────────────────── */
function CardTitle({ icon: Icon, title, subtitle }: {
  icon: React.ElementType; title: string; subtitle?: string;
}) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center"
        style={{ background: S.primary10 }}
      >
        <Icon size={14} style={{ color: S.primary }} />
      </div>
      <div>
        <h3 className="text-xs font-bold" style={{ color: S.text }}>{title}</h3>
        {subtitle && <p className="text-[9px]" style={{ color: S.text3 }}>{subtitle}</p>}
      </div>
    </div>
  );
}

/* ── 设置行 ─────────────────────────────────────────────────────────────── */
function SettingRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      className="flex items-center justify-between py-3"
      style={{ borderBottom: `1px solid ${S.border}` }}
    >
      <span className="text-[11px] font-medium shrink-0" style={{ color: S.text2 }}>
        {label}
      </span>
      <div className="flex items-center">{children}</div>
    </div>
  );
}

/* ── 通用下拉选择 ───────────────────────────────────────────────────────── */
function SelectField<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { label: string; value: T }[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="appearance-none pl-3 pr-7 py-1.5 rounded-lg text-[11px] font-medium focus:outline-none cursor-pointer"
        style={{
          background: S.s2,
          border: `1px solid ${S.border}`,
          color: S.text,
          minWidth: 140,
        }}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={12}
        style={{ color: S.text3, position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
      />
    </div>
  );
}

/* ── 主页面 ──────────────────────────────────────────────────────────────── */
export default function SettingsScreen() {
  const [activeTab, setActiveTab] = useState<TabKey>("project");

  /* 项目设置 */
  const projectName = useSettingsStore(s => s.projectName);
  const setProjectName = useSettingsStore(s => s.setProjectName);
  const workType = useSettingsStore(s => s.workType);
  const setWorkType = useSettingsStore(s => s.setWorkType);
  const aspectRatio = useSettingsStore(s => s.aspectRatio);
  const setAspectRatio = useSettingsStore(s => s.setAspectRatio);
  const payMode = useSettingsStore(s => s.payMode);
  const setPayMode = useSettingsStore(s => s.setPayMode);

  /* AI 配置 */
  const aiModel = useSettingsStore(s => s.aiModel);
  const setAiModel = useSettingsStore(s => s.setAiModel);
  const aiLang = useSettingsStore(s => s.aiLang);
  const setAiLang = useSettingsStore(s => s.setAiLang);
  const aiAutoSave = useSettingsStore(s => s.aiAutoSave);
  const setAiAutoSave = useSettingsStore(s => s.setAiAutoSave);
  const aiFrequency = useSettingsStore(s => s.aiFrequency);
  const setAiFrequency = useSettingsStore(s => s.setAiFrequency);
  const apiKeys = useSettingsStore(s => s.apiKeys);
  const setApiKey = useSettingsStore(s => s.setApiKey);
  const apiBaseUrl = useSettingsStore(s => s.apiBaseUrl);
  const setApiBaseUrl = useSettingsStore(s => s.setApiBaseUrl);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

  /* 导出与备份 */
  const exportFormat = useSettingsStore(s => s.exportFormat);
  const setExportFormat = useSettingsStore(s => s.setExportFormat);
  const autoBackup = useSettingsStore(s => s.autoBackup);
  const setAutoBackup = useSettingsStore(s => s.setAutoBackup);
  const backupInterval = useSettingsStore(s => s.backupInterval);
  const setBackupInterval = useSettingsStore(s => s.setBackupInterval);

  /* 开发者选项 */
  const debugInfo = useSettingsStore(s => s.debugInfo);
  const setDebugInfo = useSettingsStore(s => s.setDebugInfo);
  const experimentalFeatures = useSettingsStore(s => s.experimentalFeatures);
  const setExperimentalFeatures = useSettingsStore(s => s.setExperimentalFeatures);
  const apiEndpoint = useSettingsStore(s => s.apiEndpoint);
  const setApiEndpoint = useSettingsStore(s => s.setApiEndpoint);

  /* ── Tab content renderers ────────────────────────────────────────────── */
  const renderProjectTab = () => (
    <div
      className="rounded-xl p-5"
      style={{ background: S.card, border: `1px solid ${S.border}` }}
    >
      <CardTitle icon={Globe} title="项目设置" subtitle="作品基础信息与发布配置" />

      {/* 项目名称 */}
      <SettingRow label="项目名称">
        <input
          type="text"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          className="px-3 py-1.5 rounded-lg text-[11px] font-medium focus:outline-none"
          style={{
            background: S.s2,
            border: `1px solid ${S.border}`,
            color: S.text,
            width: 200,
          }}
        />
      </SettingRow>

      {/* 作品类型 */}
      <SettingRow label="作品类型">
        <SelectField
          value={workType}
          onChange={setWorkType}
          options={[
            { label: "互动 H5", value: "h5" },
            { label: "互动视频", value: "video" },
            { label: "文字冒险", value: "text" },
          ]}
        />
      </SettingRow>

      {/* 画幅比例 */}
      <SettingRow label="画幅比例">
        <SelectField
          value={aspectRatio}
          onChange={setAspectRatio}
          options={[
            { label: "移动端竖屏 9:16", value: "9:16" },
            { label: "横屏 16:9", value: "16:9" },
            { label: "自适应", value: "auto" },
          ]}
        />
      </SettingRow>

      {/* 付费模式 */}
      <SettingRow label="付费模式">
        <SelectField
          value={payMode}
          onChange={setPayMode}
          options={[
            { label: "免费试玩", value: "free_trial" },
            { label: "付费解锁", value: "paid" },
            { label: "完全免费", value: "free" },
          ]}
        />
      </SettingRow>
    </div>
  );

  const renderAiTab = () => {
    const MODEL_OPTIONS = [
      { label: "GPT-4", value: "gpt4" as const, placeholder: "sk-..." },
      { label: "Claude", value: "claude" as const, placeholder: "sk-ant-..." },
      { label: "通义千问", value: "qwen" as const, placeholder: "sk-..." },
    ];

    return (
      <div className="space-y-4">
        {/* 基础 AI 配置卡片 */}
        <div
          className="rounded-xl p-5"
          style={{ background: S.card, border: `1px solid ${S.border}` }}
        >
          <CardTitle icon={Cpu} title="AI 配置" subtitle="模型选择与 AI 辅助参数" />

          {/* AI 模型选择 */}
          <SettingRow label="AI 模型">
            <SelectField
              value={aiModel}
              onChange={setAiModel}
              options={[
                { label: "GPT-4", value: "gpt4" },
                { label: "Claude", value: "claude" },
                { label: "通义千问", value: "qwen" },
              ]}
            />
          </SettingRow>

          {/* AI 语言 */}
          <SettingRow label="AI 语言">
            <SelectField
              value={aiLang}
              onChange={setAiLang}
              options={[
                { label: "中文", value: "zh" },
                { label: "English", value: "en" },
                { label: "日本語", value: "ja" },
              ]}
            />
          </SettingRow>

          {/* 自动保存 AI 产出 */}
          <SettingRow label="自动保存 AI 产出">
            <Toggle value={aiAutoSave} onChange={setAiAutoSave} />
          </SettingRow>

          {/* AI 建议频率 */}
          <SettingRow label="AI 建议频率">
            <SelectField
              value={aiFrequency}
              onChange={setAiFrequency}
              options={[
                { label: "积极", value: "active" },
                { label: "适中", value: "moderate" },
                { label: "保守", value: "conservative" },
              ]}
            />
          </SettingRow>
        </div>

        {/* API Key 管理卡片 */}
        <div
          className="rounded-xl p-5"
          style={{ background: S.card, border: `1px solid ${S.border}` }}
        >
          <CardTitle icon={Key} title="API Key 管理" subtitle="为各模型配置独立的 API 密钥" />

          <div className="space-y-3">
            {MODEL_OPTIONS.map(({ label, value, placeholder }) => {
              const key = apiKeys[value] || "";
              const isVisible = showKeys[value];
              const isConfigured = key.trim().length > 0;
              return (
                <div key={value} className="p-3 rounded-xl" style={{ background: S.s2, border: `1px solid ${S.border}` }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold" style={{ color: S.text }}>{label}</span>
                      {isConfigured && (
                        <span className="flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded"
                          style={{ background: S.success10, color: S.success }}>
                          <CheckCircle2 size={9} /> 已配置
                        </span>
                      )}
                    </div>
                    {key && (
                      <button
                        onClick={() => setShowKeys(prev => ({ ...prev, [value]: !prev[value] }))}
                        className="p-1 rounded hover:bg-gray-200 transition-colors"
                        title={isVisible ? "隐藏密钥" : "显示密钥"}
                      >
                        {isVisible ? <EyeOff size={12} style={{ color: S.text3 }} /> : <Eye size={12} style={{ color: S.text3 }} />}
                      </button>
                    )}
                  </div>
                  <input
                    type={isVisible ? "text" : "password"}
                    value={key}
                    onChange={(e) => setApiKey(value, e.target.value)}
                    placeholder={placeholder}
                    className="w-full px-3 py-1.5 rounded-lg text-[11px] font-mono focus:outline-none"
                    style={{
                      background: S.card,
                      border: `1px solid ${isConfigured ? S.success : S.border}`,
                      color: S.text,
                    }}
                  />
                </div>
              );
            })}
          </div>

          {/* 自定义 API Base URL */}
          <div className="mt-4 pt-3" style={{ borderTop: `1px solid ${S.border}` }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-bold" style={{ color: S.text }}>自定义 API Base URL</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: S.s2, color: S.text3 }}>可选</span>
            </div>
            <input
              type="text"
              value={apiBaseUrl}
              onChange={(e) => setApiBaseUrl(e.target.value)}
              placeholder="https://api.openai.com/v1"
              className="w-full px-3 py-1.5 rounded-lg text-[11px] font-mono focus:outline-none"
              style={{
                background: S.s2,
                border: `1px solid ${S.border}`,
                color: S.text,
              }}
            />
            <p className="text-[9px] mt-1.5" style={{ color: S.text3 }}>
              留空使用默认端点，支持 OpenAI 兼容 API 格式
            </p>
          </div>
        </div>
      </div>
    );
  };

  const renderAgentTab = () => (
    <div
      className="rounded-xl p-5"
      style={{ background: S.card, border: `1px solid ${S.border}` }}
    >
      <CardTitle icon={Bot} title="Agent 技能配置" subtitle="管理各环节 AI Agent 的技能模板与参数" />

      <div className="space-y-3 mt-4">
        {[
          { icon: "⚙", iconBg: "rgba(94,80,232,0.15)", iconColor: S.primary,
            title: "基础参数配置", desc: "项目整体风格、剧集时长、画面比例等全局参数",
            tags: [{ label: "通用写实", color: S.text2 }, { label: "9:16", color: S.text2 }, { label: "自动", color: S.text2 }],
            exclusive: false },
          { icon: "≡", iconBg: "rgba(59,130,246,0.15)", iconColor: "#3B82F6",
            title: "镜头提示词生成技能", desc: "按时长将剧本扩写为详细镜头提示词，支持景别与运镜描述",
            tags: [{ label: "通用叙事拆解", color: "#3B82F6" }, { label: "Chat 5.2", color: "#3B82F6" }],
            exclusive: false },
          { icon: "▦", iconBg: "rgba(245,158,11,0.15)", iconColor: "#F59E0B",
            title: "视频任务规划技能", desc: "将镜头编排为视频生成任务，自动拆分多宫格与拼接方案",
            tags: [{ label: "按剧情连贯拆分", color: "#F59E0B" }, { label: "多宫格Pro", color: "#F59E0B" }],
            exclusive: false },
          { icon: "✦", iconBg: "rgba(0,169,157,0.15)", iconColor: S.accent,
            title: "互动节点生成技能", desc: "识别关键决策点，生成选择分支与变量系统",
            tags: [{ label: "互动改编", color: S.accent }, { label: "自动识别", color: S.accent }],
            exclusive: true },
          { icon: "≋", iconBg: "rgba(139,92,246,0.15)", iconColor: "#8B5CF6",
            title: "单视频提示词润色技能", desc: "优化提示词表达，保证角色跨场景视觉一致性",
            tags: [{ label: "通用模板", color: "#8B5CF6" }, { label: "Gem 3.0", color: "#8B5CF6" }],
            exclusive: false },
        ].map((skill, i) => (
          <div key={i} className="flex items-center justify-between p-3.5 rounded-xl"
            style={{ background: S.s2, border: `1px solid ${S.border}` }}>
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm shrink-0"
                style={{ background: skill.iconBg }}>
                <span>{skill.icon}</span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold" style={{ color: S.text }}>{skill.title}</span>
                  {skill.exclusive && (
                    <span className="text-[8px] px-1.5 py-0.5 rounded font-bold"
                      style={{ background: "rgba(0,169,157,0.12)", color: S.accent }}>逐梦专属</span>
                  )}
                </div>
                <p className="text-[10px] mt-0.5 truncate" style={{ color: S.text3 }}>{skill.desc}</p>
              </div>
            </div>
            <div className="flex gap-1.5 flex-wrap justify-end ml-3 shrink-0">
              {skill.tags.map((tag, j) => (
                <span key={j} className="text-[9px] px-2 py-0.5 rounded-lg"
                  style={{ background: `${tag.color}08`, color: tag.color, border: `1px solid ${tag.color}15` }}>
                  {tag.label}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mt-4 pt-3" style={{ borderTop: `1px solid ${S.border}` }}>
        <span className="text-[10px]" style={{ color: S.text3 }}>5 个技能 · 1 个逐梦专属</span>
        <motion.button whileTap={{ scale: 0.97 }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold focus:outline-none"
          style={{ background: S.primary10, color: S.primary }}>
          <Zap size={11} /> 技能市场
        </motion.button>
      </div>
    </div>
  );

  const renderExportTab = () => (
    <div
      className="rounded-xl p-5"
      style={{ background: S.card, border: `1px solid ${S.border}` }}
    >
      <CardTitle icon={Download} title="导出与备份" subtitle="数据导出格式与自动备份策略" />

      {/* 导出格式 */}
      <SettingRow label="导出格式">
        <SelectField
          value={exportFormat}
          onChange={setExportFormat}
          options={[
            { label: "JSON", value: "json" },
            { label: "WebGAL", value: "webgal" },
            { label: "自定义", value: "custom" },
          ]}
        />
      </SettingRow>

      {/* 自动备份 */}
      <SettingRow label="自动备份">
        <div className="flex items-center gap-3">
          {autoBackup && (
            <SelectField
              value={backupInterval}
              onChange={setBackupInterval}
              options={[
                { label: "每小时", value: "hourly" },
                { label: "每天", value: "daily" },
                { label: "每周", value: "weekly" },
              ]}
            />
          )}
          <Toggle value={autoBackup} onChange={setAutoBackup} />
        </div>
      </SettingRow>

      {/* 操作按钮 */}
      <div className="grid grid-cols-3 gap-2 mt-4">
        <motion.button
          whileTap={{ scale: 0.96 }}
          className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[11px] font-bold text-white focus:outline-none"
          style={{
            background: `linear-gradient(135deg,${S.primary},#7B6EF5)`,
            boxShadow: `0 2px 8px ${S.primary}25`,
          }}
        >
          <Save size={13} />
          导出项目
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.96 }}
          className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[11px] font-bold focus:outline-none"
          style={{
            background: S.s2,
            border: `1px solid ${S.border}`,
            color: S.text2,
          }}
        >
          <CloudUpload size={13} />
          备份到云端
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.96 }}
          className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[11px] font-bold focus:outline-none"
          style={{
            background: S.s2,
            border: `1px solid ${S.border}`,
            color: S.text2,
          }}
        >
          <RotateCcw size={13} />
          恢复备份
        </motion.button>
      </div>
    </div>
  );

  const renderDevTab = () => (
    <div
      className="rounded-xl p-5"
      style={{ background: S.card, border: `1px solid ${S.border}` }}
    >
      <CardTitle icon={Code2} title="开发者选项" subtitle="调试、实验功能与 API 配置" />

      {/* 显示调试信息 */}
      <SettingRow label="显示调试信息">
        <Toggle value={debugInfo} onChange={setDebugInfo} />
      </SettingRow>

      {/* 启用实验功能 */}
      <SettingRow label="启用实验功能">
        <Toggle value={experimentalFeatures} onChange={setExperimentalFeatures} />
      </SettingRow>

      {/* API 端点 */}
      <SettingRow label="API 端点">
        <input
          type="text"
          value={apiEndpoint}
          onChange={(e) => setApiEndpoint(e.target.value)}
          className="px-3 py-1.5 rounded-lg text-[11px] font-mono font-medium focus:outline-none"
          style={{
            background: S.s2,
            border: `1px solid ${S.border}`,
            color: S.text,
            width: 260,
          }}
        />
      </SettingRow>

      {/* 版本号 */}
      <SettingRow label="版本号">
        <span
          className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg"
          style={{ background: S.s2, color: S.primary }}
        >
          v0.17.1
        </span>
      </SettingRow>
    </div>
  );

  /* ── Tab-to-renderer map ──────────────────────────────────────────────── */
  const tabRenderers: Record<TabKey, () => React.ReactNode> = {
    project: renderProjectTab,
    ai: renderAiTab,
    agent: renderAgentTab,
    export: renderExportTab,
    dev: renderDevTab,
  };

  return (
    <div className="min-h-svh overflow-y-auto" style={{ background: S.bg }}>
      {/* 顶部标题栏 */}
      <div
        className="sticky top-0 z-20 px-5 py-3 flex items-center justify-between"
        style={{
          background: "rgba(250,251,255,0.92)",
          backdropFilter: "blur(12px)",
          borderBottom: `1px solid ${S.border}`,
        }}
      >
        <div className="flex items-center gap-2">
          <Settings size={16} style={{ color: S.primary }} />
          <h2 className="text-sm font-bold" style={{ color: S.text }}>设置</h2>
        </div>
        <span className="text-[9px]" style={{ color: S.text3 }}>
          逐梦 Creator Studio v0.17.1
        </span>
      </div>

      {/* ── 水平 Tab 栏 ── */}
      <div
        className="sticky z-10 px-5"
        style={{
          top: 49,
          background: "rgba(250,251,255,0.92)",
          backdropFilter: "blur(12px)",
          borderBottom: `1px solid ${S.border}`,
        }}
      >
        <div className="max-w-2xl mx-auto flex items-center gap-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="relative flex items-center gap-1.5 px-3 py-2.5 text-[11px] font-bold transition-colors focus:outline-none"
                style={{ color: isActive ? S.primary : S.text3 }}
              >
                <Icon size={13} />
                {tab.label}
                {isActive && (
                  <motion.div
                    layoutId="settings-tab-indicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                    style={{ background: S.primary }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Tab 内容区域 ── */}
      <div className="max-w-2xl mx-auto px-5 py-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.15 }}
          >
            {tabRenderers[activeTab]()}
          </motion.div>
        </AnimatePresence>

        {/* ── 底部信息 ── */}
        <div className="flex items-center justify-center gap-2 py-4">
          <Shield size={11} style={{ color: S.text3 }} />
          <span className="text-[9px]" style={{ color: S.text3 }}>
            逐梦 Creator Studio &copy; 2025 &middot; 数据安全存储于云端
          </span>
        </div>

        <div className="h-4" />
      </div>
    </div>
  );
}
