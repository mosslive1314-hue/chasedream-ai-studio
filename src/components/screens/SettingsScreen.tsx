"use client";
import { motion } from "framer-motion";
import {
  Settings, Cpu, Download, Code2, History,
  ChevronDown, Save, CloudUpload, RotateCcw,
  Sparkles, Globe, Shield,
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

      <div className="max-w-2xl mx-auto px-5 py-4 space-y-4">
        {/* ── 项目设置 ── */}
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

        {/* ── AI 配置 ── */}
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

        {/* ── 导出与备份 ── */}
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

        {/* ── 开发者选项 ── */}
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

        {/* ── 版本历史（占位） ── */}
        <div
          className="rounded-xl p-5"
          style={{ background: S.card, border: `1px solid ${S.border}` }}
        >
          <CardTitle icon={History} title="版本历史" subtitle="查看项目变更与回滚记录" />
          <div
            className="flex flex-col items-center justify-center py-8 rounded-xl"
            style={{ background: S.s2, border: `1px dashed ${S.border}` }}
          >
            <Sparkles size={20} style={{ color: S.text3, marginBottom: 8 }} />
            <span className="text-[11px] font-bold" style={{ color: S.text3 }}>
              即将上线
            </span>
            <span className="text-[9px] mt-1" style={{ color: S.text3 }}>
              版本历史功能正在开发中，敬请期待
            </span>
          </div>
        </div>

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
