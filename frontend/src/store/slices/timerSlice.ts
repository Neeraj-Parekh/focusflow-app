import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { TimerState, Task } from '../../types';

const initialState: TimerState = {
  isRunning: false,
  timeLeft: 25 * 60, // 25 minutes in seconds
  currentMode: 'work',
  currentTask: undefined,
  sessionCount: 0,
  totalFocusTime: 0,
};

export const timerSlice = createSlice({
  name: 'timer',
  initialState,
  reducers: {
    startTimer: (state) => {
      state.isRunning = true;
    },
    pauseTimer: (state) => {
      state.isRunning = false;
    },
    resetTimer: (state) => {
      state.isRunning = false;
      state.timeLeft = state.currentMode === 'work' ? 25 * 60 : 
                      state.currentMode === 'short-break' ? 5 * 60 : 15 * 60;
    },
    tick: (state) => {
      if (state.isRunning && state.timeLeft > 0) {
        state.timeLeft -= 1;
        if (state.currentMode === 'work') {
          state.totalFocusTime += 1;
        }
      }
    },
    completeSession: (state) => {
      state.isRunning = false;
      state.sessionCount += 1;
      state.timeLeft = 0;
    },
    setMode: (state, action: PayloadAction<'work' | 'short-break' | 'long-break' | 'custom'>) => {
      state.currentMode = action.payload;
      state.isRunning = false;
      
      switch (action.payload) {
        case 'work':
          state.timeLeft = 25 * 60;
          break;
        case 'short-break':
          state.timeLeft = 5 * 60;
          break;
        case 'long-break':
          state.timeLeft = 15 * 60;
          break;
        case 'custom':
          state.timeLeft = 25 * 60; // Default custom time
          break;
      }
    },
    setCurrentTask: (state, action: PayloadAction<Task | undefined>) => {
      state.currentTask = action.payload;
    },
    setTimeLeft: (state, action: PayloadAction<number>) => {
      state.timeLeft = action.payload;
    },
  },
});

export const {
  startTimer,
  pauseTimer,
  resetTimer,
  tick,
  completeSession,
  setMode,
  setCurrentTask,
  setTimeLeft,
} = timerSlice.actions;