// ChaseDream Creator Studio — Industry Types

// ── 项目规格模板数据（P4-12）─────────────────────────────────────────────

export type ProjectType = 'novel_adaptation' | 'original_creation' | 'script_adaptation' | 'interactive_import';
export type TargetFormat = 'interactive_h5' | 'visual_novel' | 'interactive_drama' | 'narrative_game' | 'webgal' | 'mobile_h5';

export interface ProjectSpecTemplate {
  projectType: ProjectType;
  typeLabel: string;
  typeIcon: string;
  typeDescription: string;
  suggestedGenres: string[];
  suggestedDurations: { label: string; value: string }[];
  suggestedChapters: number[];
  suggestedInteractionDensity: { label: string; value: string }[];
  suggestedEndings: number[];
}

// ── 行业通用化数据（P6-1）─────────────────────────────────────────────

export type IndustryType = 'game' | 'tourism' | 'education' | 'derivative';

export interface IndustryLabelMap {
  [key: string]: {
    game: string;
    tourism: string;
    education: string;
    derivative: string;
  };
}

// ── 行业模板（P6-1）─────────────────────────────────────────────

export interface IndustryTemplate {
  industryType: IndustryType;
  label: string;
  icon: string;
  description: string;
  targetUsers: string;
  defaultObjects: string[];       // What objects this industry works with
  defaultInteractions: string[];  // What interaction types are common
  defaultPublishFormats: string[]; // How projects are published
  workflow: { step: string; description: string }[]; // Industry-specific workflow steps
}

// ── 行业质检规则（P6-1）─────────────────────────────────────────────

export interface IndustryQCRule {
  id: string;
  industryType: IndustryType;
  category: string;
  label: string;
  description: string;
  severity: 'block' | 'warn' | 'info';
}

// ── 行业资产类型（P6-1）─────────────────────────────────────────────

export interface IndustryAssetType {
  industryType: IndustryType;
  assetTypes: { key: string; label: string; icon: string }[];
}
