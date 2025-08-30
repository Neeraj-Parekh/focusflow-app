import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Slider,
  Divider,
  Button,
  Alert,
} from '@mui/material';
import {
  Save,
  Restore,
  VolumeUp,
  Notifications,
  Palette,
  Timer,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAppSelector } from '../../hooks/useAppSelector';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import {
  setWorkDuration,
  setShortBreakDuration,
  setLongBreakDuration,
  toggleAutoStartBreaks,
  toggleAutoStartPomodoros,
  toggleSound,
  toggleNotifications,
  setTheme,
  setFocusMusic,
  resetSettings,
} from '../../store/slices/settingsSlice';

const SettingsView: React.FC = () => {
  const dispatch = useAppDispatch();
  const settings = useAppSelector((state) => state.settings);

  const handleSaveSettings = () => {
    // In a real app, this would sync with backend
    console.log('Settings saved:', settings);
  };

  const handleResetSettings = () => {
    if (window.confirm('Are you sure you want to reset all settings to default?')) {
      dispatch(resetSettings());
    }
  };

  const formatTime = (minutes: number): string => {
    return `${minutes} minutes`;
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" sx={{ mb: 3 }}>
        Settings
      </Typography>

      <Grid container spacing={3}>
        {/* Timer Settings */}
        <Grid item xs={12} lg={6}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Timer sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="h6">Timer Settings</Typography>
                </Box>

                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    Work Duration: {formatTime(settings.workDuration / 60)}
                  </Typography>
                  <Slider
                    value={settings.workDuration / 60}
                    onChange={(_, value) => dispatch(setWorkDuration((value as number) * 60))}
                    min={15}
                    max={60}
                    step={5}
                    marks
                    valueLabelDisplay="auto"
                    valueLabelFormat={(value) => `${value}m`}
                  />
                </Box>

                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    Short Break: {formatTime(settings.shortBreakDuration / 60)}
                  </Typography>
                  <Slider
                    value={settings.shortBreakDuration / 60}
                    onChange={(_, value) => dispatch(setShortBreakDuration((value as number) * 60))}
                    min={3}
                    max={15}
                    step={1}
                    marks
                    valueLabelDisplay="auto"
                    valueLabelFormat={(value) => `${value}m`}
                  />
                </Box>

                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    Long Break: {formatTime(settings.longBreakDuration / 60)}
                  </Typography>
                  <Slider
                    value={settings.longBreakDuration / 60}
                    onChange={(_, value) => dispatch(setLongBreakDuration((value as number) * 60))}
                    min={10}
                    max={30}
                    step={5}
                    marks
                    valueLabelDisplay="auto"
                    valueLabelFormat={(value) => `${value}m`}
                  />
                </Box>

                <Divider sx={{ my: 2 }} />

                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.autoStartBreaks}
                      onChange={() => dispatch(toggleAutoStartBreaks())}
                    />
                  }
                  label="Auto-start breaks"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.autoStartPomodoros}
                      onChange={() => dispatch(toggleAutoStartPomodoros())}
                    />
                  }
                  label="Auto-start next pomodoro"
                />
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Audio & Notifications */}
        <Grid item xs={12} lg={6}>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <VolumeUp sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="h6">Audio & Notifications</Typography>
                </Box>

                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.soundEnabled}
                      onChange={() => dispatch(toggleSound())}
                    />
                  }
                  label="Enable sounds"
                  sx={{ mb: 2 }}
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.notificationsEnabled}
                      onChange={() => dispatch(toggleNotifications())}
                    />
                  }
                  label="Enable notifications"
                  sx={{ mb: 3 }}
                />

                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Focus Music</InputLabel>
                  <Select
                    value={settings.focusMusic}
                    label="Focus Music"
                    onChange={(e) => dispatch(setFocusMusic(e.target.value))}
                  >
                    <MenuItem value="none">None</MenuItem>
                    <MenuItem value="rain">Rain Sounds</MenuItem>
                    <MenuItem value="forest">Forest Ambience</MenuItem>
                    <MenuItem value="coffee">Coffee Shop</MenuItem>
                    <MenuItem value="white-noise">White Noise</MenuItem>
                    <MenuItem value="lofi">Lo-Fi Hip Hop</MenuItem>
                  </Select>
                </FormControl>

                {settings.notificationsEnabled && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    Browser notifications are enabled. Make sure your browser allows notifications for the best experience.
                  </Alert>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Appearance */}
        <Grid item xs={12} lg={6}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Palette sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="h6">Appearance</Typography>
                </Box>

                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Theme</InputLabel>
                  <Select
                    value={settings.theme}
                    label="Theme"
                    onChange={(e) => dispatch(setTheme(e.target.value as any))}
                  >
                    <MenuItem value="light">Light</MenuItem>
                    <MenuItem value="dark">Dark</MenuItem>
                    <MenuItem value="auto">Auto (System)</MenuItem>
                  </Select>
                </FormControl>

                <Typography variant="body2" color="text.secondary">
                  The auto theme will follow your system's appearance settings.
                </Typography>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* AI & Productivity */}
        <Grid item xs={12} lg={6}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6">AI & Productivity</Typography>
                </Box>

                <FormControlLabel
                  control={<Switch defaultChecked />}
                  label="Enable AI recommendations"
                  sx={{ mb: 2 }}
                />

                <FormControlLabel
                  control={<Switch defaultChecked />}
                  label="Smart task prioritization"
                  sx={{ mb: 2 }}
                />

                <FormControlLabel
                  control={<Switch defaultChecked />}
                  label="Productivity insights"
                  sx={{ mb: 2 }}
                />

                <FormControlLabel
                  control={<Switch />}
                  label="Share anonymous usage data"
                  sx={{ mb: 2 }}
                />

                <Typography variant="body2" color="text.secondary">
                  AI features help optimize your productivity by learning from your patterns and providing personalized recommendations.
                </Typography>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Actions */}
        <Grid item xs={12}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 3 }}>
                  Actions
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Button
                    variant="contained"
                    startIcon={<Save />}
                    onClick={handleSaveSettings}
                  >
                    Save Settings
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Restore />}
                    onClick={handleResetSettings}
                    color="warning"
                  >
                    Reset to Defaults
                  </Button>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  Settings are automatically saved to your browser's local storage. Sign in to sync settings across devices.
                </Typography>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SettingsView;