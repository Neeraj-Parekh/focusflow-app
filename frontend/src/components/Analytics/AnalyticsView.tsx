import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Timer,
  CheckCircle,
  TrendingUp,
  Whatshot,
} from '@mui/icons-material';
import { LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { motion } from 'framer-motion';
import { useAppSelector } from '../../hooks/useAppSelector';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { setDateRange } from '../../store/slices/analyticsSlice';

const AnalyticsView: React.FC = () => {
  const dispatch = useAppDispatch();
  const analytics = useAppSelector((state) => state.analytics);
  const tasks = useAppSelector((state) => state.tasks.tasks);
  const timeEntries = useAppSelector((state) => state.timeTracking.timeEntries);
  const timer = useAppSelector((state) => state.timer);

  // Mock data for charts - in real app this would come from API
  const focusTimeData = [
    { date: '2024-01-01', focusTime: 120, sessions: 5 },
    { date: '2024-01-02', focusTime: 180, sessions: 7 },
    { date: '2024-01-03', focusTime: 90, sessions: 3 },
    { date: '2024-01-04', focusTime: 210, sessions: 8 },
    { date: '2024-01-05', focusTime: 150, sessions: 6 },
    { date: '2024-01-06', focusTime: 240, sessions: 9 },
    { date: '2024-01-07', focusTime: 195, sessions: 7 },
  ];

  const productivityData = [
    { name: 'Work', value: 45, color: '#e85d75' },
    { name: 'Personal', value: 25, color: '#4fc3f7' },
    { name: 'Learning', value: 20, color: '#66bb6a' },
    { name: 'Break', value: 10, color: '#ffb74d' },
  ];

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const totalTasks = tasks.length;
  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" sx={{ mb: 3 }}>
        Analytics Dashboard
      </Typography>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Timer sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                <Typography variant="h4" fontWeight="bold">
                  {formatTime(timer.totalFocusTime)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Focus Time
                </Typography>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        <Grid xs={12} sm={6} md={3}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <CheckCircle sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
                <Typography variant="h4" fontWeight="bold">
                  {analytics.completedPomodoros}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Completed Sessions
                </Typography>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        <Grid xs={12} sm={6} md={3}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <TrendingUp sx={{ fontSize: 48, color: 'warning.main', mb: 1 }} />
                <Typography variant="h4" fontWeight="bold">
                  {analytics.productivityScore}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Productivity Score
                </Typography>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        <Grid xs={12} sm={6} md={3}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Whatshot sx={{ fontSize: 48, color: 'error.main', mb: 1 }} />
                <Typography variant="h4" fontWeight="bold">
                  {analytics.streakDays}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Day Streak
                </Typography>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3}>
        {/* Focus Time Trend */}
        <Grid item xs={12} lg={8}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Focus Time Trend
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={focusTimeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip
                      formatter={(value, name) => [
                        name === 'focusTime' ? formatTime(value as number) : value,
                        name === 'focusTime' ? 'Focus Time' : 'Sessions'
                      ]}
                    />
                    <Area
                      type="monotone"
                      dataKey="focusTime"
                      stroke="#e85d75"
                      fill="#e85d75"
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Activity Distribution */}
        <Grid item xs={12} lg={4}>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Activity Distribution
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={productivityData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {productivityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value}%`, 'Time']} />
                  </PieChart>
                </ResponsiveContainer>
                <Box sx={{ mt: 2 }}>
                  {productivityData.map((item) => (
                    <Box key={item.name} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          backgroundColor: item.color,
                          borderRadius: '50%',
                          mr: 1,
                        }}
                      />
                      <Typography variant="body2" sx={{ flex: 1 }}>
                        {item.name}
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {item.value}%
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Task Completion */}
        <Grid item xs={12} md={6}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Task Completion Rate
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h4" fontWeight="bold" sx={{ mr: 2 }}>
                    {completionRate.toFixed(1)}%
                  </Typography>
                  <Box sx={{ flex: 1 }}>
                    <LinearProgress
                      variant="determinate"
                      value={completionRate}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {completedTasks} of {totalTasks} tasks completed
                </Typography>
                <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                  <Chip
                    label={`${tasks.filter(t => t.status === 'pending').length} Pending`}
                    size="small"
                    color="warning"
                    variant="outlined"
                  />
                  <Chip
                    label={`${tasks.filter(t => t.status === 'in-progress').length} In Progress`}
                    size="small"
                    color="info"
                    variant="outlined"
                  />
                  <Chip
                    label={`${completedTasks} Completed`}
                    size="small"
                    color="success"
                    variant="outlined"
                  />
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Weekly Overview */}
        <Grid item xs={12} md={6}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Weekly Overview
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Average Session Length</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {formatTime(analytics.averageSessionLength)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Best Productivity Day</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      Monday
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Peak Focus Time</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      10:00 AM - 12:00 PM
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Your most productive hours are in the morning. Consider scheduling important tasks during this time.
                </Typography>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AnalyticsView;