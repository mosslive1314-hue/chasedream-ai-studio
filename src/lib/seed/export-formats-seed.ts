// ChaseDream Creator Studio — Export Formats Seed Data
// 18 种导出格式的完整定义

import type { ExportFormat } from '@/lib/types/export-engine';

export const EXPORT_FORMATS: ExportFormat[] = [
  // ── 1. WebGAL 脚本 ───────────────────────────────────────────────────
  {
    id: 'webgal',
    name: 'WebGAL 脚本',
    description: '导出为 WebGAL 引擎可执行的脚本格式，支持在 WebGAL 平台上运行',
    category: 'script',
    fileExtension: '.txt',
    mimeType: 'text/plain',
    stability: 'stable',
    supportedIndustries: ['game', 'tourism', 'education'],
    options: [
      { id: 'includeBgm', label: '包含 BGM 指令', type: 'boolean', defaultValue: true },
      { id: 'includeVoice', label: '包含语音指令', type: 'boolean', defaultValue: true },
      { id: 'includeEffect', label: '包含特效指令', type: 'boolean', defaultValue: true },
      { id: 'encoding', label: '编码格式', type: 'select', defaultValue: 'UTF-8', choices: ['UTF-8', 'GBK'] },
    ],
    capabilities: ['场景脚本', '对白系统', '选择分支', '变量条件', 'BGM/音效指令'],
  },
  // ── 2. Ren'Py 脚本 ──────────────────────────────────────────────────
  {
    id: 'renpy',
    name: "Ren'Py 脚本",
    description: "导出为 Ren'Py 引擎的 .rpy 格式，适用于 Python 生态的视觉小说开发",
    category: 'script',
    fileExtension: '.rpy',
    mimeType: 'text/x-python',
    stability: 'stable',
    supportedIndustries: ['game'],
    options: [
      { id: 'pythonVersion', label: 'Python 版本', type: 'select', defaultValue: '3.x', choices: ['2.x', '3.x'] },
      { id: 'includeGUI', label: '生成 GUI 模板', type: 'boolean', defaultValue: true },
      { id: 'transformSyntax', label: '使用 ATL 动画语法', type: 'boolean', defaultValue: false },
    ],
    capabilities: ['Label 结构', 'Menu 选择', '条件跳转', '变量系统', '资源引用'],
  },
  // ── 3. JSON 完整数据 ────────────────────────────────────────────────
  {
    id: 'json',
    name: '自定义 JSON',
    description: '导出为结构化 JSON，包含完整的节点图、变量、资产引用等所有数据',
    category: 'package',
    fileExtension: '.json',
    mimeType: 'application/json',
    stability: 'stable',
    supportedIndustries: ['game', 'tourism', 'education', 'derivative'],
    options: [
      { id: 'pretty', label: '格式化输出', type: 'boolean', defaultValue: true },
      { id: 'includeAssets', label: '内嵌资产引用', type: 'boolean', defaultValue: true },
      { id: 'includeQC', label: '包含质检结果', type: 'boolean', defaultValue: false },
      { id: 'schemaVersion', label: 'Schema 版本', type: 'select', defaultValue: 'v2', choices: ['v1', 'v2'] },
    ],
    capabilities: ['完整节点图', '变量定义', '资产清单', '叙事意图', '质检结果'],
  },
  // ── 4. 互动 H5 包 ──────────────────────────────────────────────────
  {
    id: 'h5-package',
    name: '互动 H5 包',
    description: '打包为独立的 H5 应用，可直接部署到服务器或 CDN',
    category: 'interactive',
    fileExtension: '.zip',
    mimeType: 'application/zip',
    stability: 'stable',
    supportedIndustries: ['game', 'tourism', 'education', 'derivative'],
    options: [
      { id: 'responsive', label: '响应式布局', type: 'boolean', defaultValue: true },
      { id: 'offlineSupport', label: '离线支持 (ServiceWorker)', type: 'boolean', defaultValue: false },
      { id: 'analytics', label: '内置数据埋点', type: 'boolean', defaultValue: true },
      { id: 'orientation', label: '屏幕方向', type: 'select', defaultValue: 'portrait', choices: ['portrait', 'landscape', 'auto'] },
    ],
    capabilities: ['运行时引擎', '场景渲染器', '选择系统', '存档/读档', '资产打包'],
  },
  // ── 5. Inkle Ink 格式 ──────────────────────────────────────────────
  {
    id: 'ink',
    name: 'Inkle Ink 格式',
    description: '导出为 Ink 互动小说格式，适用于 Unity 集成和文本冒险游戏',
    category: 'script',
    fileExtension: '.ink',
    mimeType: 'text/plain',
    stability: 'beta',
    supportedIndustries: ['game'],
    options: [
      { id: 'inkVersion', label: 'Ink 版本', type: 'select', defaultValue: '1.1', choices: ['1.0', '1.1'] },
      { id: 'useKnots', label: '使用 Knot 结构', type: 'boolean', defaultValue: true },
      { id: 'globalVars', label: '全局变量声明', type: 'boolean', defaultValue: true },
    ],
    capabilities: ['Knot 结构', 'Stitch 子场景', '变量', '条件', 'Choice 选择'],
  },
  // ── 6. PDF 剧本 ────────────────────────────────────────────────────
  {
    id: 'pdf-script',
    name: 'PDF 剧本',
    description: '导出为格式化的 PDF 剧本文档，包含所有分支路径和注释',
    category: 'document',
    fileExtension: '.pdf',
    mimeType: 'application/pdf',
    stability: 'stable',
    supportedIndustries: ['game', 'tourism', 'education', 'derivative'],
    options: [
      { id: 'pageSize', label: '纸张大小', type: 'select', defaultValue: 'A4', choices: ['A4', 'Letter', 'B5'] },
      { id: 'includeTOC', label: '包含目录', type: 'boolean', defaultValue: true },
      { id: 'includeNotes', label: '包含导演注释', type: 'boolean', defaultValue: true },
      { id: 'colorScheme', label: '配色方案', type: 'select', defaultValue: '彩色', choices: ['彩色', '黑白'] },
    ],
    capabilities: ['分幕排版', '对白格式', '分支标注', '变量说明', '导演注释'],
  },
  // ── 7. OpenAPI 规范 ────────────────────────────────────────────────
  {
    id: 'openapi',
    name: 'OpenAPI 接口文档',
    description: '导出为 OpenAPI 3.0 规范，便于与其他系统集成',
    category: 'document',
    fileExtension: '.yaml',
    mimeType: 'text/yaml',
    stability: 'beta',
    supportedIndustries: ['game', 'education'],
    options: [
      { id: 'apiVersion', label: 'OpenAPI 版本', type: 'select', defaultValue: '3.0', choices: ['3.0', '3.1'] },
      { id: 'format', label: '输出格式', type: 'select', defaultValue: 'YAML', choices: ['YAML', 'JSON'] },
    ],
    capabilities: ['API 端点', '数据结构', '事件定义', '回调接口'],
  },
  // ── 8. Unity 工程 ──────────────────────────────────────────────────
  {
    id: 'unity',
    name: 'Unity 工程包',
    description: '导出为 Unity 引擎可导入的工程包',
    category: 'engine',
    fileExtension: '.unitypackage',
    mimeType: 'application/octet-stream',
    stability: 'beta',
    supportedIndustries: ['game'],
    options: [
      { id: 'unityVersion', label: 'Unity 版本', type: 'select', defaultValue: '2022 LTS', choices: ['2021 LTS', '2022 LTS', '2023'] },
      { id: 'scriptingBackend', label: '脚本后端', type: 'select', defaultValue: 'IL2CPP', choices: ['Mono', 'IL2CPP'] },
      { id: 'inkIntegration', label: '包含 Ink 集成', type: 'boolean', defaultValue: true },
    ],
    capabilities: ['场景数据', '对话系统', '选择 UI', '变量管理', 'Ink 运行时'],
  },
  // ── 9. Godot 资源 ──────────────────────────────────────────────────
  {
    id: 'godot',
    name: 'Godot 资源包',
    description: '导出为 Godot 引擎的资源格式',
    category: 'engine',
    fileExtension: '.tres',
    mimeType: 'application/octet-stream',
    stability: 'alpha',
    supportedIndustries: ['game'],
    options: [
      { id: 'godotVersion', label: 'Godot 版本', type: 'select', defaultValue: '4.x', choices: ['3.x', '4.x'] },
      { id: 'language', label: '脚本语言', type: 'select', defaultValue: 'GDScript', choices: ['GDScript', 'C#'] },
    ],
    capabilities: ['资源文件', '场景树', 'GDScript', '信号系统'],
  },
  // ── 10. Yarn Spinner ───────────────────────────────────────────────
  {
    id: 'yarn-spinner',
    name: 'Yarn Spinner',
    description: '导出为 Yarn Spinner 对话系统格式，适用于 Unity 集成',
    category: 'script',
    fileExtension: '.yarn',
    mimeType: 'text/plain',
    stability: 'beta',
    supportedIndustries: ['game', 'education'],
    options: [
      { id: 'yarnVersion', label: 'Yarn 版本', type: 'select', defaultValue: '2.x', choices: ['1.x', '2.x'] },
      { id: 'language', label: '脚本语言', type: 'select', defaultValue: 'en', choices: ['en', 'zh'] },
    ],
    capabilities: ['Node 对话', 'Line 对白', 'Command 指令', 'Variable 变量'],
  },
  // ── 11. Lua 脚本 ───────────────────────────────────────────────────
  {
    id: 'lua',
    name: 'Lua 脚本包',
    description: '导出为 Lua 脚本，适用于 Defold/Corona 等引擎',
    category: 'engine',
    fileExtension: '.lua',
    mimeType: 'text/x-lua',
    stability: 'alpha',
    supportedIndustries: ['game'],
    options: [
      { id: 'luaVersion', label: 'Lua 版本', type: 'select', defaultValue: '5.4', choices: ['5.3', '5.4', 'LuaJIT'] },
      { id: 'moduleSystem', label: '模块系统', type: 'select', defaultValue: 'require', choices: ['require', 'global'] },
    ],
    capabilities: ['模块导出', '对话表', '状态机', '事件系统'],
  },
  // ── 12. H5 制作指南 ────────────────────────────────────────────────
  {
    id: 'h5-guide',
    name: 'H5 制作指南',
    description: '生成详细的 H5 互动作品制作指南文档',
    category: 'document',
    fileExtension: '.html',
    mimeType: 'text/html',
    stability: 'stable',
    supportedIndustries: ['tourism', 'education'],
    options: [
      { id: 'interactive', label: '交互式指南', type: 'boolean', defaultValue: true },
      { id: 'screenshots', label: '包含截图占位', type: 'boolean', defaultValue: true },
    ],
    capabilities: ['制作流程', '素材清单', '技术说明', '部署指南'],
  },
  // ── 13. 微信小程序包 ───────────────────────────────────────────────
  {
    id: 'wechat-mini',
    name: '微信小程序包',
    description: '打包为微信小程序项目，支持馆内扫码体验',
    category: 'interactive',
    fileExtension: '.zip',
    mimeType: 'application/zip',
    stability: 'stable',
    supportedIndustries: ['tourism', 'education'],
    options: [
      { id: 'appId', label: 'AppID', type: 'text', defaultValue: '' },
      { id: 'useCloud', label: '使用云开发', type: 'boolean', defaultValue: false },
      { id: 'gpsTrigger', label: 'GPS 定位触发', type: 'boolean', defaultValue: true },
    ],
    capabilities: ['小程序框架', '页面路由', '本地存储', '分享', 'GPS'],
  },
  // ── 14. SCORM 课件 ─────────────────────────────────────────────────
  {
    id: 'scorm',
    name: 'SCORM 课件',
    description: '符合 SCORM 2004 标准，可导入主流 LMS 平台',
    category: 'industry',
    fileExtension: '.zip',
    mimeType: 'application/zip',
    stability: 'stable',
    supportedIndustries: ['education'],
    options: [
      { id: 'scormVersion', label: 'SCORM 版本', type: 'select', defaultValue: '2004', choices: ['1.2', '2004'] },
      { id: 'tracking', label: '学习追踪粒度', type: 'select', defaultValue: '完成度', choices: ['完成度', '分数', '详细'] },
    ],
    capabilities: ['SCO 封装', '追踪数据', '完成条件', '成绩传递'],
  },
  // ── 15. 课堂演示包 ─────────────────────────────────────────────────
  {
    id: 'classroom-demo',
    name: '课堂演示包',
    description: '适配课堂投屏场景，教师控制进度',
    category: 'industry',
    fileExtension: '.zip',
    mimeType: 'application/zip',
    stability: 'stable',
    supportedIndustries: ['education'],
    options: [
      { id: 'teacherControl', label: '教师控制模式', type: 'boolean', defaultValue: true },
      { id: 'studentVote', label: '学生投票功能', type: 'boolean', defaultValue: true },
    ],
    capabilities: ['教师面板', '投票系统', '进度控制', '实时反馈'],
  },
  // ── 16. 互动短剧播放器 ─────────────────────────────────────────────
  {
    id: 'interactive-short',
    name: '互动短剧播放器',
    description: '独立播放器应用，支持多平台分发',
    category: 'interactive',
    fileExtension: '.zip',
    mimeType: 'application/zip',
    stability: 'stable',
    supportedIndustries: ['derivative'],
    options: [
      { id: 'platform', label: '目标平台', type: 'select', defaultValue: 'web', choices: ['web', 'android', 'ios'] },
      { id: 'adsIntegration', label: '广告集成', type: 'boolean', defaultValue: false },
    ],
    capabilities: ['播放器 UI', '章节选择', '分享功能', '观看历史'],
  },
  // ── 17. iframe 嵌入 ────────────────────────────────────────────────
  {
    id: 'iframe-embed',
    name: 'iframe 嵌入代码',
    description: '生成可嵌入的 iframe 代码，适配第三方平台',
    category: 'interactive',
    fileExtension: '.html',
    mimeType: 'text/html',
    stability: 'stable',
    supportedIndustries: ['game', 'tourism', 'education', 'derivative'],
    options: [
      { id: 'width', label: '宽度', type: 'text', defaultValue: '100%' },
      { id: 'height', label: '高度', type: 'text', defaultValue: '600px' },
      { id: 'border', label: '显示边框', type: 'boolean', defaultValue: false },
    ],
    capabilities: ['iframe 代码', '响应式适配', '跨域通信', '事件回调'],
  },
  // ── 18. 社交媒体短版 ───────────────────────────────────────────────
  {
    id: 'social-media',
    name: '社交媒体短版',
    description: '精简为 60 秒互动短片，适配短视频平台',
    category: 'industry',
    fileExtension: '.json',
    mimeType: 'application/json',
    stability: 'beta',
    supportedIndustries: ['derivative'],
    options: [
      { id: 'platform', label: '目标平台', type: 'select', defaultValue: 'douyin', choices: ['douyin', 'kuaishou', 'weibo'] },
      { id: 'duration', label: '最大时长(秒)', type: 'number', defaultValue: 60 },
      { id: 'autoPlay', label: '自动播放', type: 'boolean', defaultValue: true },
    ],
    capabilities: ['精简路径', '快速选择', '竖屏适配', '分享追踪'],
  },
];

// ── 行业格式分组 ────────────────────────────────────────────────────────────

export const EXPORT_CATEGORY_LABELS: Record<string, string> = {
  script: '脚本格式',
  interactive: '互动格式',
  package: '数据打包',
  engine: '引擎格式',
  industry: '行业格式',
  document: '文档格式',
};

export const EXPORT_INDUSTRY_TABS = ['游戏', '文旅', '教育', '衍生'] as const;

/** 按行业筛选导出格式 */
export function getFormatsByIndustry(industry: 'game' | 'tourism' | 'education' | 'derivative'): ExportFormat[] {
  return EXPORT_FORMATS.filter(f => f.supportedIndustries.includes(industry));
}

/** 按类别筛选导出格式 */
export function getFormatsByCategory(category: string): ExportFormat[] {
  return EXPORT_FORMATS.filter(f => f.category === category);
}
