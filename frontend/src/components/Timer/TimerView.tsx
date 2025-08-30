import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  LinearProgress,
  Chip,
  Grid,
  Alert,
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  Stop,
  Settings as SettingsIcon,
  Timer as TimerIcon,
  Coffee,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppSelector } from '../../hooks/useAppSelector';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import {
  startTimer,
  pauseTimer,
  resetTimer,
  tick,
  setMode,
  setCurrentTask,
  completeSession,
} from '../../store/slices/timerSlice';
import { incrementPomodoro, addFocusTime } from '../../store/slices/analyticsSlice';
import { addRecommendation } from '../../store/slices/aiSlice';

const TimerView: React.FC = () => {
  const dispatch = useAppDispatch();
  const timer = useAppSelector((state) => state.timer);
  const settings = useAppSelector((state) => state.settings);
  const tasks = useAppSelector((state) => state.tasks.tasks);
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (timer.isRunning && timer.timeLeft > 0) {
      interval = setInterval(() => {
        dispatch(tick());
      }, 1000);
    } else if (timer.isRunning && timer.timeLeft === 0) {
      // Timer completed
      dispatch(completeSession());
      if (timer.currentMode === 'work') {
        dispatch(incrementPomodoro());
        dispatch(addFocusTime(settings.workDuration));
        // Add AI recommendation for break
        dispatch(addRecommendation({
          type: 'break-timing',
          title: 'Great work! Time for a break',
          description: 'You\'ve completed a focused work session. Taking a short break will help maintain your productivity.',
          confidence: 0.9,
          actionable: true,
        }));
      }
    }

    return () => clearInterval(interval);
  }, [timer.isRunning, timer.timeLeft, timer.currentMode, dispatch, settings.workDuration]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    dispatch(startTimer());
  };

  const handlePause = () => {
    dispatch(pauseTimer());
  };

  const handleReset = () => {
    dispatch(resetTimer());
  };

  const handleModeChange = (mode: 'work' | 'short-break' | 'long-break') => {
    dispatch(setMode(mode));
  };

  const handleTaskChange = (taskId: string) => {
    setSelectedTaskId(taskId);
    const task = tasks.find(t => t.id === taskId);
    dispatch(setCurrentTask(task));
  };

  const getProgressPercentage = (): number => {
    const totalTime = timer.currentMode === 'work' ? settings.workDuration :
                     timer.currentMode === 'short-break' ? settings.shortBreakDuration :
                     settings.longBreakDuration;
    return ((totalTime - timer.timeLeft) / totalTime) * 100;
  };

  const getModeColor = (): string => {
    switch (timer.currentMode) {
      case 'work': return '#e85d75';
      case 'short-break': return '#4fc3f7';
      case 'long-break': return '#66bb6a';
      default: return '#e85d75';
    }
  };

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Main Timer Card */}
        <Grid item xs={12} md={8}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card sx={{ p: 3, textAlign: 'center' }}>
              <CardContent>
                {/* Mode Selection */}
                <Box sx={{ mb: 3 }}>
                  <Button
                    variant={timer.currentMode === 'work' ? 'contained' : 'outlined'}
                    onClick={() => handleModeChange('work')}
                    sx={{ mx: 1, mb: 1 }}
                    startIcon={<TimerIcon />}
                  >
                    Focus
                  </Button>
                  <Button
                    variant={timer.currentMode === 'short-break' ? 'contained' : 'outlined'}
                    onClick={() => handleModeChange('short-break')}
                    sx={{ mx: 1, mb: 1 }}
                    startIcon={<Coffee />}
                  >
                    Short Break
                  </Button>
                  <Button
                    variant={timer.currentMode === 'long-break' ? 'contained' : 'outlined'}
                    onClick={() => handleModeChange('long-break')}
                    sx={{ mx: 1, mb: 1 }}
                    startIcon={<Coffee />}
                  >
                    Long Break
                  </Button>
                </Box>

                {/* Task Selection */}
                {timer.currentMode === 'work' && (
                  <FormControl fullWidth sx={{ mb: 3 }}>
                    <InputLabel>Working on</InputLabel>
                    <Select
                      value={selectedTaskId}
                      label="Working on"
                      onChange={(e) => handleTaskChange(e.target.value)}
                    >
                      <MenuItem value="">No specific task</MenuItem>
                      {tasks.filter(t => t.status !== 'completed').map((task) => (
                        <MenuItem key={task.id} value={task.id}>
                          {task.title}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}

                {/* Timer Display */}
                <motion.div
                  key={timer.timeLeft}
                  initial={{ scale: 1 }}
                  animate={{ scale: timer.isRunning ? [1, 1.02, 1] : 1 }}
                  transition={{ duration: 1, repeat: timer.isRunning ? Infinity : 0 }}
                >
                  <Typography
                    variant="h1"
                    sx={{
                      fontSize: { xs: '4rem', md: '6rem' },
                      fontWeight: 'bold',
                      color: getModeColor(),
                      mb: 2,
                    }}
                  >
                    {formatTime(timer.timeLeft)}
                  </Typography>
                </motion.div>

                {/* Progress Bar */}
                <LinearProgress
                  variant="determinate"
                  value={getProgressPercentage()}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    mb: 3,
                    backgroundColor: 'rgba(0,0,0,0.1)',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: getModeColor(),
                    },
                  }}
                />

                {/* Control Buttons */}
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={timer.isRunning ? handlePause : handleStart}
                    startIcon={timer.isRunning ? <Pause /> : <PlayArrow />}
                    sx={{
                      backgroundColor: getModeColor(),
                      '&:hover': { backgroundColor: getModeColor() },
                      px: 4,
                      py: 1.5,
                    }}
                  >
                    {timer.isRunning ? 'Pause' : 'Start'}
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    onClick={handleReset}
                    startIcon={<Stop />}
                    sx={{ px: 4, py: 1.5 }}
                  >
                    Reset
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Stats and Info */}
        <Grid item xs={12} md={4}>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Today's Progress
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Sessions:</Typography>
                  <Chip label={timer.sessionCount} size="small" color="primary" />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Focus Time:</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {formatTime(timer.totalFocusTime)}
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            {timer.currentTask && (
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Current Task
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {timer.currentTask.title}
                  </Typography>
                  {timer.currentTask.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      {timer.currentTask.description}
                    </Typography>
                  )}
                  <Box sx={{ mt: 2 }}>
                    <LinearProgress
                      variant="determinate"
                      value={(timer.currentTask.completedPomodoros / timer.currentTask.estimatedPomodoros) * 100}
                      sx={{ height: 6, borderRadius: 3 }}
                    />
                    <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                      {timer.currentTask.completedPomodoros} / {timer.currentTask.estimatedPomodoros} pomodoros
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TimerView;