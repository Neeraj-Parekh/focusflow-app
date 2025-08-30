import React from 'react';
import { Box, AppBar, Toolbar, Typography, IconButton, Tabs, Tab, Container } from '@mui/material';
import { Settings, DarkMode, LightMode } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../../hooks/useAppSelector';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { setTheme } from '../../store/slices/settingsSlice';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const theme = useAppSelector((state) => state.settings.theme);

  const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
    navigate(newValue);
  };

  const toggleTheme = () => {
    dispatch(setTheme(theme === 'dark' ? 'light' : 'dark'));
  };

  const currentTab = location.pathname === '/' ? '/timer' : location.pathname;

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh' }}>
      <AppBar position="static" elevation={0} sx={{ backgroundColor: 'background.paper' }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, color: 'primary.main', fontWeight: 'bold' }}>
            FocusFlow
          </Typography>
          <IconButton onClick={toggleTheme} color="inherit">
            {theme === 'dark' ? <LightMode /> : <DarkMode />}
          </IconButton>
          <IconButton onClick={() => navigate('/settings')} color="inherit">
            <Settings />
          </IconButton>
        </Toolbar>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          centered
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Timer" value="/timer" />
          <Tab label="Tasks" value="/tasks" />
          <Tab label="Analytics" value="/analytics" />
        </Tabs>
      </AppBar>
      <Container maxWidth="lg" sx={{ mt: 3, mb: 3 }}>
        {children}
      </Container>
    </Box>
  );
};

export default MainLayout;