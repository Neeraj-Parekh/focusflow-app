import { createSlice, PayloadAction, nanoid } from '@reduxjs/toolkit';
import { Project } from '../../types';

interface ProjectsState {
  projects: Project[];
  activeProject: string | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: ProjectsState = {
  projects: [
    {
      id: 'default',
      name: 'Personal',
      description: 'Personal tasks and projects',
      color: '#2196f3',
      icon: '👤',
      createdAt: new Date(),
      isArchived: false,
    },
    {
      id: 'work',
      name: 'Work',
      description: 'Work-related tasks',
      color: '#4caf50',
      icon: '💼',
      createdAt: new Date(),
      isArchived: false,
    },
  ],
  activeProject: null,
  isLoading: false,
  error: null,
};

export const projectsSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    addProject: {
      reducer: (state, action: PayloadAction<Project>) => {
        state.projects.push(action.payload);
      },
      prepare: (projectData: Omit<Project, 'id' | 'createdAt'>) => {
        return {
          payload: {
            ...projectData,
            id: nanoid(),
            createdAt: new Date(),
          },
        };
      },
    },
    updateProject: (state, action: PayloadAction<{ id: string; updates: Partial<Project> }>) => {
      const { id, updates } = action.payload;
      const projectIndex = state.projects.findIndex((project) => project.id === id);
      if (projectIndex !== -1) {
        state.projects[projectIndex] = {
          ...state.projects[projectIndex],
          ...updates,
        };
      }
    },
    deleteProject: (state, action: PayloadAction<string>) => {
      state.projects = state.projects.filter((project) => project.id !== action.payload);
      if (state.activeProject === action.payload) {
        state.activeProject = null;
      }
    },
    archiveProject: (state, action: PayloadAction<string>) => {
      const project = state.projects.find((p) => p.id === action.payload);
      if (project) {
        project.isArchived = true;
      }
    },
    setActiveProject: (state, action: PayloadAction<string | null>) => {
      state.activeProject = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  addProject,
  updateProject,
  deleteProject,
  archiveProject,
  setActiveProject,
  setLoading,
  setError,
} = projectsSlice.actions;