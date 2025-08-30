import { createSlice, PayloadAction, nanoid } from '@reduxjs/toolkit';
import { TimeEntry } from '../../types';

interface TimeTrackingState {
  timeEntries: TimeEntry[];
  activeEntry: TimeEntry | null;
  isTracking: boolean;
  totalTime: number;
  isLoading: boolean;
  error: string | null;
}

const initialState: TimeTrackingState = {
  timeEntries: [],
  activeEntry: null,
  isTracking: false,
  totalTime: 0,
  isLoading: false,
  error: null,
};

export const timeTrackingSlice = createSlice({
  name: 'timeTracking',
  initialState,
  reducers: {
    startTimeEntry: {
      reducer: (state, action: PayloadAction<TimeEntry>) => {
        state.activeEntry = action.payload;
        state.isTracking = true;
      },
      prepare: (entryData: Omit<TimeEntry, 'id' | 'startTime' | 'duration'>) => {
        return {
          payload: {
            ...entryData,
            id: nanoid(),
            startTime: new Date(),
            duration: 0,
          },
        };
      },
    },
    stopTimeEntry: (state) => {
      if (state.activeEntry) {
        const duration = Math.floor((Date.now() - state.activeEntry.startTime.getTime()) / 1000);
        const completedEntry: TimeEntry = {
          ...state.activeEntry,
          endTime: new Date(),
          duration,
        };
        state.timeEntries.push(completedEntry);
        state.totalTime += duration;
        state.activeEntry = null;
        state.isTracking = false;
      }
    },
    updateActiveEntry: (state, action: PayloadAction<{ duration: number }>) => {
      if (state.activeEntry) {
        state.activeEntry.duration = action.payload.duration;
      }
    },
    addTimeEntry: {
      reducer: (state, action: PayloadAction<TimeEntry>) => {
        state.timeEntries.push(action.payload);
        state.totalTime += action.payload.duration;
      },
      prepare: (entryData: Omit<TimeEntry, 'id'>) => {
        return {
          payload: {
            ...entryData,
            id: nanoid(),
          },
        };
      },
    },
    updateTimeEntry: (state, action: PayloadAction<{ id: string; updates: Partial<TimeEntry> }>) => {
      const { id, updates } = action.payload;
      const entryIndex = state.timeEntries.findIndex((entry) => entry.id === id);
      if (entryIndex !== -1) {
        const oldDuration = state.timeEntries[entryIndex].duration;
        state.timeEntries[entryIndex] = {
          ...state.timeEntries[entryIndex],
          ...updates,
        };
        if (updates.duration !== undefined) {
          state.totalTime = state.totalTime - oldDuration + updates.duration;
        }
      }
    },
    deleteTimeEntry: (state, action: PayloadAction<string>) => {
      const entry = state.timeEntries.find((e) => e.id === action.payload);
      if (entry) {
        state.totalTime -= entry.duration;
        state.timeEntries = state.timeEntries.filter((e) => e.id !== action.payload);
      }
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
  startTimeEntry,
  stopTimeEntry,
  updateActiveEntry,
  addTimeEntry,
  updateTimeEntry,
  deleteTimeEntry,
  setLoading,
  setError,
} = timeTrackingSlice.actions;