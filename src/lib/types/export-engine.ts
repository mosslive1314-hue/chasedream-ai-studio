// ChaseDream Creator Studio — Export Engine & Platform Adapter Types
// 导出引擎：统一的导出格式定义、平台适配器和导出任务管理

// ── 导出格式分类 ──────────────────────────────────────────────────────────

export type ExportCategory = 'script' | 'interactive' | 'package' | 'engine' | 'industry' | 'document';

export type ExportFormatId =
  | 'webgal' | 'renpy' | 'json' | 'h5-package'
  | 'ink' | 'pdf-script' | 'openapi'
  | 'unity' | 'godot' | 'yarn-spinner' | 'lua'
  | 'h5-guide' | 'wechat-mini' | 'scorm' | 'classroom-demo'
  | 'interactive-short' | 'iframe-embed' | 'social-media';

// ── 导出格式定义 ──────────────────────────────────────────────────────────

export interface ExportFormat {
  id: ExportFormatId;
  name: string;
  description: string;
  category: ExportCategory;
  /** 文件扩展名 */
  fileExtension: string;
  /** MIME 类型 */
  mimeType: string;
  /** 格式稳定性 */
  stability: 'stable' | 'beta' | 'alpha';
  /** 支持的行业 */
  supportedIndustries: ('game' | 'tourism' | 'education' | 'derivative')[];
  /** 导出选项 */
  options: ExportOption[];
  /** 格式能力标签 */
  capabilities: string[];
}

export interface ExportOption {
  id: string;
  label: string;
  type: 'boolean' | 'select' | 'text' | 'number';
  defaultValue: string | boolean | number;
  description?: string;
  /** select 类型的选项列表 */
  choices?: string[];
}

// ── 平台适配器 ────────────────────────────────────────────────────────────

export type AdapterStatus = 'available' | 'processing' | 'error' | 'unavailable';

export interface PlatformAdapter {
  /** 适配器对应的导出格式 ID */
  formatId: ExportFormatId;
  /** 适配器名称 */
  name: string;
  /** 适配器状态 */
  status: AdapterStatus;
  /** 支持的字段映射 */
  fieldMappings: FieldMapping[];
  /** 适配器特有的转换函数名 */
  transformerId: string;
}

export interface FieldMapping {
  /** 源字段路径（narrative store 中的属性） */
  sourceField: string;
  /** 目标字段路径（导出格式中的属性） */
  targetField: string;
  /** 是否已映射 */
  mapped: boolean;
  /** 转换说明 */
  transformNote?: string;
}

// ── 导出任务 ──────────────────────────────────────────────────────────────

export type ExportJobStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface ExportJob {
  id: string;
  /** 导出格式 */
  formatId: ExportFormatId;
  /** 任务状态 */
  status: ExportJobStatus;
  /** 进度百分比 0-100 */
  progress: number;
  /** 使用的选项 */
  options: Record<string, string | boolean | number>;
  /** 创建时间 */
  createdAt: string;
  /** 完成时间 */
  completedAt?: string;
  /** 导出结果 */
  result?: ExportResult;
  /** 错误信息 */
  errorMessage?: string;
}

export interface ExportResult {
  /** 导出的文件名 */
  fileName: string;
  /** 文件内容（文本格式）或 Blob URL */
  content: string;
  /** 文件大小（字节） */
  fileSize: number;
  /** 导出统计 */
  stats: ExportStats;
}

export interface ExportStats {
  /** 导出的节点数 */
  nodesExported: number;
  /** 导出的变量数 */
  variablesExported: number;
  /** 导出的资产引用数 */
  assetRefsExported: number;
  /** 跳过的项 */
  skippedItems: string[];
  /** 耗时（毫秒） */
  duration: number;
}

// ── 发布配置 ──────────────────────────────────────────────────────────────

export type DeployEnvironment = 'staging' | 'production' | 'preview';

export interface PublishConfig {
  /** 项目唯一标识 */
  projectId: string;
  /** 发布标题 */
  title: string;
  /** 发布描述 */
  description: string;
  /** 目标环境 */
  environment: DeployEnvironment;
  /** 发布 URL */
  publishUrl?: string;
  /** 自定义域名 */
  customDomain?: string;
  /** 访问控制 */
  access: PublishAccess;
  /** 付费模式 */
  payMode: 'free' | 'free_trial' | 'paid';
  /** 封面图 URL */
  coverImage?: string;
  /** SEO 标签 */
  tags: string[];
}

export interface PublishAccess {
  /** 是否公开 */
  isPublic: boolean;
  /** 是否需要密码 */
  passwordProtected: boolean;
  /** 允许的域名白名单 */
  allowedDomains: string[];
  /** 嵌入许可 */
  embedAllowed: boolean;
}

export interface DeployRecord {
  id: string;
  projectId: string;
  environment: DeployEnvironment;
  version: string;
  status: 'deploying' | 'live' | 'rolled_back' | 'failed';
  deployedAt: string;
  deployUrl: string;
  fileSize: number;
  /** 部署耗时（秒） */
  duration: number;
}
