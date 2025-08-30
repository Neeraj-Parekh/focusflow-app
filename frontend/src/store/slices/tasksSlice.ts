import { createSlice, PayloadAction, nanoid } from '@reduxjs/toolkit';
import { Task } from '../../types';

interface TasksState {
  tasks: Task[];
  filter: {
    status: 'all' | 'pending' | 'in-progress' | 'completed' | 'cancelled';
    priority: 'all' | 'low' | 'medium' | 'high' | 'critical';
    projectId: string | null;
  };
  isLoading: boolean;
  error: string | null;
}

const initialState: TasksState = {
  tasks: [],
  filter: {
    status: 'all',
    priority: 'all',
    projectId: null,
  },
  isLoading: false,
  error: null,
};

export const tasksSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    addTask: {
      reducer: (state, action: PayloadAction<Task>) => {
        state.tasks.push(action.payload);
      },
      prepare: (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
        return {
          payload: {
            ...taskData,
            id: nanoid(),
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        };
      },
    },
    updateTask: (state, action: PayloadAction<{ id: string; updates: Partial<Task> }>) => {
      const { id, updates } = action.payload;
      const taskIndex = state.tasks.findIndex((task) => task.id === id);
      if (taskIndex !== -1) {
        state.tasks[taskIndex] = {
          ...state.tasks[taskIndex],
          ...updates,
          updatedAt: new Date(),
        };
      }
    },
    deleteTask: (state, action: PayloadAction<string>) => {
      state.tasks = state.tasks.filter((task) => task.id !== action.payload);
    },
    toggleTaskStatus: (state, action: PayloadAction<string>) => {
      const task = state.tasks.find((t) => t.id === action.payload);
      if (task) {
        task.status = task.status === 'completed' ? 'pending' : 'completed';
        task.updatedAt = new Date();
      }
    },
    incrementPomodoro: (state, action: PayloadAction<string>) => {
      const task = state.tasks.find((t) => t.id === action.payload);
      if (task) {
        task.completedPomodoros += 1;
        task.updatedAt = new Date();
        if (task.completedPomodoros >= task.estimatedPomodoros) {
          task.status = 'completed';
        }
      }
    },
    setFilter: (state, action: PayloadAction<Partial<TasksState['filter']>>) => {
      state.filter = { ...state.filter, ...action.payload };
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    reorderTasks: (state, action: PayloadAction<{ startIndex: number; endIndex: number }>) => {
      const { startIndex, endIndex } = action.payload;
      const result = Array.from(state.tasks);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      state.tasks = result;
    },
  },
});

export const {
  addTask,
  updateTask,
  deleteTask,
  toggleTaskStatus,
  incrementPomodoro,
  setFilter,
  setLoading,
  setError,
  reorderTasks,
} = tasksSlice.actions;