import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { UserAnalytics, FocusPattern } from '../../types';

interface AnalyticsState extends UserAnalytics {
  isLoading: boolean;
  error: string | null;
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
}

const initialState: AnalyticsState = {
  totalFocusTime: 0,
  completedPomodoros: 0,
  averageSessionLength: 0,
  productivityScore: 0,
  streakDays: 0,
  focusPatterns: [],
  isLoading: false,
  error: null,
  dateRange: {
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    endDate: new Date(),
  },
};

export const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {
    updateAnalytics: (state, action: PayloadAction<Partial<UserAnalytics>>) => {
      Object.assign(state, action.payload);
    },
    addFocusPattern: (state, action: PayloadAction<FocusPattern>) => {
      state.focusPatterns.push(action.payload);
    },
    setDateRange: (state, action: PayloadAction<{ startDate: Date; endDate: Date }>) => {
      state.dateRange = action.payload;
    },
    incrementPomodoro: (state) => {
      state.completedPomodoros += 1;
    },
    addFocusTime: (state, action: PayloadAction<number>) => {
      state.totalFocusTime += action.payload;
      // Recalculate average session length
      if (state.completedPomodoros > 0) {
        state.averageSessionLength = state.totalFocusTime / state.completedPomodoros;
      }
    },
    updateProductivityScore: (state, action: PayloadAction<number>) => {
      state.productivityScore = action.payload;
    },
    updateStreak: (state, action: PayloadAction<number>) => {
      state.streakDays = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    resetAnalytics: (state) => {
      state.totalFocusTime = 0;
      state.completedPomodoros = 0;
      state.averageSessionLength = 0;
      state.productivityScore = 0;
      state.streakDays = 0;
      state.focusPatterns = [];
    },
  },
});

export const {
  updateAnalytics,
  addFocusPattern,
  setDateRange,
  incrementPomodoro,
  addFocusTime,
  updateProductivityScore,
  updateStreak,
  setLoading,
  setError,
  resetAnalytics,
} = analyticsSlice.actions;