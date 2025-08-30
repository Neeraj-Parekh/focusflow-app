import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { UserPreferences } from '../../types';

interface SettingsState extends UserPreferences {
  isLoading: boolean;
  error: string | null;
}

const initialState: SettingsState = {
  workDuration: 25 * 60, // 25 minutes in seconds
  shortBreakDuration: 5 * 60, // 5 minutes in seconds
  longBreakDuration: 15 * 60, // 15 minutes in seconds
  autoStartBreaks: false,
  autoStartPomodoros: false,
  soundEnabled: true,
  notificationsEnabled: true,
  theme: 'dark',
  focusMusic: 'none',
  isLoading: false,
  error: null,
};

export const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    updateSettings: (state, action: PayloadAction<Partial<UserPreferences>>) => {
      Object.assign(state, action.payload);
    },
    setWorkDuration: (state, action: PayloadAction<number>) => {
      state.workDuration = action.payload;
    },
    setShortBreakDuration: (state, action: PayloadAction<number>) => {
      state.shortBreakDuration = action.payload;
    },
    setLongBreakDuration: (state, action: PayloadAction<number>) => {
      state.longBreakDuration = action.payload;
    },
    toggleAutoStartBreaks: (state) => {
      state.autoStartBreaks = !state.autoStartBreaks;
    },
    toggleAutoStartPomodoros: (state) => {
      state.autoStartPomodoros = !state.autoStartPomodoros;
    },
    toggleSound: (state) => {
      state.soundEnabled = !state.soundEnabled;
    },
    toggleNotifications: (state) => {
      state.notificationsEnabled = !state.notificationsEnabled;
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark' | 'auto'>) => {
      state.theme = action.payload;
    },
    setFocusMusic: (state, action: PayloadAction<string>) => {
      state.focusMusic = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    resetSettings: () => initialState,
  },
});

export const {
  updateSettings,
  setWorkDuration,
  setShortBreakDuration,
  setLongBreakDuration,
  toggleAutoStartBreaks,
  toggleAutoStartPomodoros,
  toggleSound,
  toggleNotifications,
  setTheme,
  setFocusMusic,
  setLoading,
  setError,
  resetSettings,
} = settingsSlice.actions;