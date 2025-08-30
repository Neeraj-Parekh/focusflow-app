import React from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, CircularProgress, Box } from '@mui/material';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import { store, persistor } from './store/store';
import MainLayout from './components/Layout/MainLayout';
import TimerView from './components/Timer/TimerView';
import TasksView from './components/Tasks/TasksView';
import AnalyticsView from './components/Analytics/AnalyticsView';
import SettingsView from './components/Settings/SettingsView';
import { useAppSelector } from './hooks/useAppSelector';

const queryClient = new QueryClient();

const ThemeWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const themeMode = useAppSelector((state) => state.settings.theme);
  
  const theme = createTheme({
    palette: {
      mode: themeMode === 'auto' ? 
        (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : 
        themeMode,
      primary: {
        main: '#e85d75',
      },
      secondary: {
        main: '#4fc3f7',
      },
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
          },
        },
      },
    },
  });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
};

const AppRoutes: React.FC = () => {
  return (
    <Router>
      <MainLayout>
        <Routes>
          <Route path="/" element={<TimerView />} />
          <Route path="/timer" element={<TimerView />} />
          <Route path="/tasks" element={<TasksView />} />
          <Route path="/analytics" element={<AnalyticsView />} />
          <Route path="/settings" element={<SettingsView />} />
        </Routes>
      </MainLayout>
    </Router>
  );
};

const LoadingFallback: React.FC = () => (
  <Box
    display="flex"
    justifyContent="center"
    alignItems="center"
    minHeight="100vh"
    flexDirection="column"
    gap={2}
  >
    <CircularProgress size={60} />
    <div>Loading FocusFlow...</div>
  </Box>
);

function App() {
  return (
    <Provider store={store}>
      <PersistGate loading={<LoadingFallback />} persistor={persistor}>
        <QueryClientProvider client={queryClient}>
          <ThemeWrapper>
            <AppRoutes />
          </ThemeWrapper>
        </QueryClientProvider>
      </PersistGate>
    </Provider>
  );
}

export default App;
