import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { Task, Project, TimeEntry, User, AIRecommendation, PomodoroSession } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    prepareHeaders: (headers, { getState }) => {
      // Add auth token if available
      const token = localStorage.getItem('focusflow_token');
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Task', 'Project', 'TimeEntry', 'User', 'Analytics', 'AIRecommendation'],
  endpoints: (builder) => ({
    // Auth endpoints
    login: builder.mutation<{ token: string; user: User }, { email: string; password: string }>({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
    }),
    register: builder.mutation<{ token: string; user: User }, { email: string; password: string; name: string }>({
      query: (userData) => ({
        url: '/auth/register',
        method: 'POST',
        body: userData,
      }),
    }),

    // User endpoints
    getUser: builder.query<User, void>({
      query: () => '/user/profile',
      providesTags: ['User'],
    }),
    updateUser: builder.mutation<User, Partial<User>>({
      query: (updates) => ({
        url: '/user/profile',
        method: 'PATCH',
        body: updates,
      }),
      invalidatesTags: ['User'],
    }),

    // Task endpoints
    getTasks: builder.query<Task[], { projectId?: string; status?: string }>({
      query: (params) => ({
        url: '/tasks',
        params,
      }),
      providesTags: ['Task'],
    }),
    createTask: builder.mutation<Task, Omit<Task, 'id' | 'createdAt' | 'updatedAt'>>({
      query: (task) => ({
        url: '/tasks',
        method: 'POST',
        body: task,
      }),
      invalidatesTags: ['Task'],
    }),
    updateTask: builder.mutation<Task, { id: string; updates: Partial<Task> }>({
      query: ({ id, updates }) => ({
        url: `/tasks/${id}`,
        method: 'PATCH',
        body: updates,
      }),
      invalidatesTags: ['Task'],
    }),
    deleteTask: builder.mutation<void, string>({
      query: (id) => ({
        url: `/tasks/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Task'],
    }),

    // Project endpoints
    getProjects: builder.query<Project[], void>({
      query: () => '/projects',
      providesTags: ['Project'],
    }),
    createProject: builder.mutation<Project, Omit<Project, 'id' | 'createdAt'>>({
      query: (project) => ({
        url: '/projects',
        method: 'POST',
        body: project,
      }),
      invalidatesTags: ['Project'],
    }),
    updateProject: builder.mutation<Project, { id: string; updates: Partial<Project> }>({
      query: ({ id, updates }) => ({
        url: `/projects/${id}`,
        method: 'PATCH',
        body: updates,
      }),
      invalidatesTags: ['Project'],
    }),
    deleteProject: builder.mutation<void, string>({
      query: (id) => ({
        url: `/projects/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Project'],
    }),

    // Time tracking endpoints
    getTimeEntries: builder.query<TimeEntry[], { startDate?: string; endDate?: string }>({
      query: (params) => ({
        url: '/time-entries',
        params,
      }),
      providesTags: ['TimeEntry'],
    }),
    createTimeEntry: builder.mutation<TimeEntry, Omit<TimeEntry, 'id'>>({
      query: (entry) => ({
        url: '/time-entries',
        method: 'POST',
        body: entry,
      }),
      invalidatesTags: ['TimeEntry'],
    }),
    updateTimeEntry: builder.mutation<TimeEntry, { id: string; updates: Partial<TimeEntry> }>({
      query: ({ id, updates }) => ({
        url: `/time-entries/${id}`,
        method: 'PATCH',
        body: updates,
      }),
      invalidatesTags: ['TimeEntry'],
    }),
    deleteTimeEntry: builder.mutation<void, string>({
      query: (id) => ({
        url: `/time-entries/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['TimeEntry'],
    }),

    // Pomodoro session endpoints
    createPomodoroSession: builder.mutation<PomodoroSession, Omit<PomodoroSession, 'id'>>({
      query: (session) => ({
        url: '/pomodoro-sessions',
        method: 'POST',
        body: session,
      }),
      invalidatesTags: ['Analytics'],
    }),

    // Analytics endpoints
    getAnalytics: builder.query<any, { startDate: string; endDate: string }>({
      query: (params) => ({
        url: '/analytics',
        params,
      }),
      providesTags: ['Analytics'],
    }),

    // AI endpoints
    getAIRecommendations: builder.query<AIRecommendation[], void>({
      query: () => '/ai/recommendations',
      providesTags: ['AIRecommendation'],
    }),
    generateTaskPrioritySuggestion: builder.mutation<{ priority: string; confidence: number }, { taskId: string }>({
      query: (data) => ({
        url: '/ai/task-priority',
        method: 'POST',
        body: data,
      }),
    }),
    generateProductivityInsights: builder.mutation<any, void>({
      query: () => ({
        url: '/ai/insights',
        method: 'POST',
      }),
      invalidatesTags: ['AIRecommendation'],
    }),

    // Sync endpoints for offline functionality
    syncData: builder.mutation<any, { tasks: Task[]; timeEntries: TimeEntry[]; sessions: PomodoroSession[] }>({
      query: (data) => ({
        url: '/sync',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Task', 'TimeEntry', 'Analytics'],
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useGetUserQuery,
  useUpdateUserMutation,
  useGetTasksQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
  useGetProjectsQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
  useGetTimeEntriesQuery,
  useCreateTimeEntryMutation,
  useUpdateTimeEntryMutation,
  useDeleteTimeEntryMutation,
  useCreatePomodoroSessionMutation,
  useGetAnalyticsQuery,
  useGetAIRecommendationsQuery,
  useGenerateTaskPrioritySuggestionMutation,
  useGenerateProductivityInsightsMutation,
  useSyncDataMutation,
} = api;