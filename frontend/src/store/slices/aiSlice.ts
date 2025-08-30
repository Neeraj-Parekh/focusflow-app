import { createSlice, PayloadAction, nanoid } from '@reduxjs/toolkit';
import { AIRecommendation } from '../../types';

interface AIState {
  recommendations: AIRecommendation[];
  isAnalyzing: boolean;
  insights: {
    optimalWorkTime: string[];
    burnoutRisk: 'low' | 'medium' | 'high';
    productivityTrends: string[];
    taskPriorityInsights: string[];
  };
  isLoading: boolean;
  error: string | null;
}

const initialState: AIState = {
  recommendations: [],
  isAnalyzing: false,
  insights: {
    optimalWorkTime: [],
    burnoutRisk: 'low',
    productivityTrends: [],
    taskPriorityInsights: [],
  },
  isLoading: false,
  error: null,
};

export const aiSlice = createSlice({
  name: 'ai',
  initialState,
  reducers: {
    addRecommendation: {
      reducer: (state, action: PayloadAction<AIRecommendation>) => {
        state.recommendations.unshift(action.payload);
        // Keep only the latest 50 recommendations
        if (state.recommendations.length > 50) {
          state.recommendations = state.recommendations.slice(0, 50);
        }
      },
      prepare: (recommendationData: Omit<AIRecommendation, 'id' | 'createdAt'>) => {
        return {
          payload: {
            ...recommendationData,
            id: nanoid(),
            createdAt: new Date(),
          },
        };
      },
    },
    removeRecommendation: (state, action: PayloadAction<string>) => {
      state.recommendations = state.recommendations.filter((rec) => rec.id !== action.payload);
    },
    setAnalyzing: (state, action: PayloadAction<boolean>) => {
      state.isAnalyzing = action.payload;
    },
    updateInsights: (state, action: PayloadAction<Partial<AIState['insights']>>) => {
      state.insights = { ...state.insights, ...action.payload };
    },
    setBurnoutRisk: (state, action: PayloadAction<'low' | 'medium' | 'high'>) => {
      state.insights.burnoutRisk = action.payload;
    },
    addProductivityTrend: (state, action: PayloadAction<string>) => {
      state.insights.productivityTrends.push(action.payload);
      // Keep only the latest 10 trends
      if (state.insights.productivityTrends.length > 10) {
        state.insights.productivityTrends = state.insights.productivityTrends.slice(-10);
      }
    },
    setOptimalWorkTimes: (state, action: PayloadAction<string[]>) => {
      state.insights.optimalWorkTime = action.payload;
    },
    addTaskPriorityInsight: (state, action: PayloadAction<string>) => {
      state.insights.taskPriorityInsights.push(action.payload);
      // Keep only the latest 5 insights
      if (state.insights.taskPriorityInsights.length > 5) {
        state.insights.taskPriorityInsights = state.insights.taskPriorityInsights.slice(-5);
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearRecommendations: (state) => {
      state.recommendations = [];
    },
  },
});

export const {
  addRecommendation,
  removeRecommendation,
  setAnalyzing,
  updateInsights,
  setBurnoutRisk,
  addProductivityTrend,
  setOptimalWorkTimes,
  addTaskPriorityInsight,
  setLoading,
  setError,
  clearRecommendations,
} = aiSlice.actions;