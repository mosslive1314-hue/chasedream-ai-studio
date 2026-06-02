import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Project } from '@/lib/studio-data';

// Import seed data - these will be created as part of the studio-data split
import { PROJECTS as SEED_PROJECTS } from '@/lib/seed/project-seed';

interface ProjectState {
  // State
  projects: Project[];
  currentProjectId: string | null;

  // Computed
  currentProject: () => Project | null;

  // Actions
  createProject: (project: Omit<Project, 'id'>) => void;
  deleteProject: (id: string) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  setCurrentProject: (id: string) => void;
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      // --- Initial state from seed ---
      projects: SEED_PROJECTS,
      currentProjectId: SEED_PROJECTS.length > 0 ? SEED_PROJECTS[0].id : null,

      // --- Computed ---
      currentProject: () => {
        const { projects, currentProjectId } = get();
        return projects.find(p => p.id === currentProjectId) ?? null;
      },

      // --- Actions ---
      createProject: (projectData) => {
        const id = Date.now().toString(36);
        const newProject: Project = { ...projectData, id } as Project;
        set(state => ({
          projects: [newProject, ...state.projects],
        }));
      },

      deleteProject: (id) => {
        set(state => ({
          projects: state.projects.filter(p => p.id !== id),
          currentProjectId: state.currentProjectId === id ? null : state.currentProjectId,
        }));
      },

      updateProject: (id, updates) => {
        set(state => ({
          projects: state.projects.map(p =>
            p.id === id ? { ...p, ...updates } : p
          ),
        }));
      },

      setCurrentProject: (id) => {
        set({ currentProjectId: id });
      },
    }),
    {
      name: 'cd-projects',
    }
  )
);
