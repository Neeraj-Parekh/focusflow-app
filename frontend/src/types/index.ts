export interface Task {
  id: string;
  title: string;
  description?: string;
  projectId: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  estimatedPomodoros: number;
  completedPomodoros: number;
  dueDate?: Date;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  aiSuggestedPriority?: 'low' | 'medium' | 'high' | 'critical';
  aiEstimatedDuration?: number;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  createdAt: Date;
  isArchived: boolean;
}

export interface PomodoroSession {
  id: string;
  taskId?: string;
  type: 'work' | 'short-break' | 'long-break';
  duration: number;
  completedAt: Date;
  interrupted: boolean;
  focusScore: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  preferences: UserPreferences;
  analytics: UserAnalytics;
}

export interface UserPreferences {
  workDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  autoStartBreaks: boolean;
  autoStartPomodoros: boolean;
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  theme: 'light' | 'dark' | 'auto';
  focusMusic: string;
}

export interface UserAnalytics {
  totalFocusTime: number;
  completedPomodoros: number;
  averageSessionLength: number;
  productivityScore: number;
  streakDays: number;
  focusPatterns: FocusPattern[];
}

export interface FocusPattern {
  id: string;
  timeOfDay: string;
  duration: number;
  productivityScore: number;
  dayOfWeek: number;
}

export interface AIRecommendation {
  id: string;
  type: 'task-priority' | 'break-timing' | 'focus-pattern' | 'productivity-tip';
  title: string;
  description: string;
  confidence: number;
  actionable: boolean;
  createdAt: Date;
}

export interface TimeEntry {
  id: string;
  taskId?: string;
  projectId?: string;
  description: string;
  startTime: Date;
  endTime?: Date;
  duration: number;
  tags: string[];
  billable: boolean;
}

export interface TimerState {
  isRunning: boolean;
  timeLeft: number;
  currentMode: 'work' | 'short-break' | 'long-break' | 'custom';
  currentTask?: Task;
  sessionCount: number;
  totalFocusTime: number;
}

export interface AppState {
  timer: TimerState;
  tasks: Task[];
  projects: Project[];
  timeEntries: TimeEntry[];
  user: User | null;
  aiRecommendations: AIRecommendation[];
  isLoading: boolean;
  error: string | null;
}