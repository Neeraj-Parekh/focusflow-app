import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query/react';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

import { timerSlice } from './slices/timerSlice';
import { tasksSlice } from './slices/tasksSlice';
import { projectsSlice } from './slices/projectsSlice';
import { timeTrackingSlice } from './slices/timeTrackingSlice';
import { analyticsSlice } from './slices/analyticsSlice';
import { settingsSlice } from './slices/settingsSlice';
import { aiSlice } from './slices/aiSlice';
import { api } from './api';

const persistConfig = {
  key: 'focusflow',
  storage,
  whitelist: ['timer', 'tasks', 'projects', 'timeTracking', 'analytics', 'settings'],
};

const rootReducer = combineReducers({
  timer: timerSlice.reducer,
  tasks: tasksSlice.reducer,
  projects: projectsSlice.reducer,
  timeTracking: timeTrackingSlice.reducer,
  analytics: analyticsSlice.reducer,
  settings: settingsSlice.reducer,
  ai: aiSlice.reducer,
  [api.reducerPath]: api.reducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }).concat(api.middleware),
  devTools: process.env.NODE_ENV !== 'production',
});

export const persistor = persistStore(store);

// Setup listeners for refetchOnFocus/refetchOnReconnect
setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;