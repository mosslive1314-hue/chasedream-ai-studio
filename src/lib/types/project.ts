// ChaseDream Creator Studio — Project Types

export type ProjectStatus = 'published' | 'in_progress' | 'idle' | 'draft';

export interface Project {
  id: string;
  title: string;
  genre: string;
  cover: string;
  status: ProjectStatus;
  healthScore: number;
  healthLabel: string;
  healthType: 'success' | 'warning' | 'error';
  progress: number; // 0-100
  stage1: number; // structure extraction %
  stage2: number; // node graph %
  stage3: number; // assets %
  chapters: number;
  nodes: number;
  branches: number;
  endings: number;
  lastEdited: string;
  errors?: number;
}

// AI Factory task steps
export interface FactoryTask {
  id: string;
  label: string;
  sublabel?: string;
  status: 'done' | 'running' | 'pending' | 'failed';
  result?: string;
}
