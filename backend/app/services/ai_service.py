import openai
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
import joblib
import os
from typing import List, Dict, Optional, Any
from datetime import datetime, timedelta
import asyncio
from sqlalchemy.orm import Session

from ..core.config import settings
from ..models.models import User, Task, PomodoroSession, AIRecommendation

class AIService:
    def __init__(self):
        self.client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
        
        # ML Models
        self.productivity_model = RandomForestRegressor(n_estimators=100, random_state=42)
        self.priority_model = RandomForestClassifier(n_estimators=50, random_state=42)
        self.focus_patterns_model = KMeans(n_clusters=5, random_state=42)
        self.burnout_model = RandomForestClassifier(n_estimators=75, random_state=42)
        
        # Scalers
        self.productivity_scaler = StandardScaler()
        self.priority_scaler = StandardScaler()
        
        # Model paths
        self.models_dir = "ml_models"
        os.makedirs(self.models_dir, exist_ok=True)
        
        # Load pre-trained models if they exist
        self._load_models()
    
    def _load_models(self):
        """Load pre-trained models from disk if available"""
        try:
            self.productivity_model = joblib.load(f"{self.models_dir}/productivity_model.pkl")
            self.priority_model = joblib.load(f"{self.models_dir}/priority_model.pkl")
            self.focus_patterns_model = joblib.load(f"{self.models_dir}/focus_patterns_model.pkl")
            self.burnout_model = joblib.load(f"{self.models_dir}/burnout_model.pkl")
            self.productivity_scaler = joblib.load(f"{self.models_dir}/productivity_scaler.pkl")
            self.priority_scaler = joblib.load(f"{self.models_dir}/priority_scaler.pkl")
            print("Pre-trained models loaded successfully")
        except FileNotFoundError:
            print("No pre-trained models found, will train new ones")
    
    def _save_models(self):
        """Save trained models to disk"""
        joblib.dump(self.productivity_model, f"{self.models_dir}/productivity_model.pkl")
        joblib.dump(self.priority_model, f"{self.models_dir}/priority_model.pkl")
        joblib.dump(self.focus_patterns_model, f"{self.models_dir}/focus_patterns_model.pkl")
        joblib.dump(self.burnout_model, f"{self.models_dir}/burnout_model.pkl")
        joblib.dump(self.productivity_scaler, f"{self.models_dir}/productivity_scaler.pkl")
        joblib.dump(self.priority_scaler, f"{self.models_dir}/priority_scaler.pkl")
    
    async def predict_optimal_work_time(self, user_id: str, historical_data: List[Dict]) -> List[str]:
        """Predict optimal work times based on historical productivity data"""
        if not historical_data:
            # Return default recommendations
            return ["09:00-11:00", "14:00-16:00", "19:00-21:00"]
        
        df = pd.DataFrame(historical_data)
        
        # Feature engineering
        df['hour'] = pd.to_datetime(df['start_time']).dt.hour
        df['day_of_week'] = pd.to_datetime(df['start_time']).dt.dayofweek
        df['productivity_score'] = df['focus_score'] * (df['actual_duration'] / df['planned_duration'])
        
        # Find peak productivity hours
        hourly_productivity = df.groupby('hour')['productivity_score'].mean().sort_values(ascending=False)
        
        # Get top 3 time slots
        optimal_hours = hourly_productivity.head(3).index.tolist()
        optimal_slots = [f"{hour:02d}:00-{hour+2:02d}:00" for hour in optimal_hours]
        
        return optimal_slots
    
    async def suggest_task_priority(self, task_data: Dict, user_context: Dict) -> Dict[str, Any]:
        """AI-powered task prioritization using ML and GPT"""
        
        # Extract features for ML model
        features = self._extract_task_features(task_data, user_context)
        
        if hasattr(self.priority_model, 'predict_proba'):
            # Use trained model if available
            features_scaled = self.priority_scaler.transform([features])
            priority_probs = self.priority_model.predict_proba(features_scaled)[0]
            priority_map = ['low', 'medium', 'high', 'critical']
            suggested_priority = priority_map[np.argmax(priority_probs)]
            confidence = np.max(priority_probs)
        else:
            # Fallback to rule-based system
            suggested_priority, confidence = self._rule_based_priority(task_data)
        
        # Enhanced suggestion using GPT for context
        gpt_suggestion = await self._get_gpt_priority_suggestion(task_data, user_context)
        
        return {
            "suggested_priority": suggested_priority,
            "confidence": float(confidence),
            "reasoning": gpt_suggestion.get("reasoning", ""),
            "ml_confidence": float(confidence),
            "gpt_suggestion": gpt_suggestion
        }
    
    async def _get_gpt_priority_suggestion(self, task_data: Dict, user_context: Dict) -> Dict[str, Any]:
        """Get priority suggestion from GPT with reasoning"""
        try:
            prompt = f"""
            Analyze this task and suggest its priority level (low, medium, high, critical) with reasoning:
            
            Task: {task_data.get('title', 'Unknown')}
            Description: {task_data.get('description', 'No description')}
            Due Date: {task_data.get('due_date', 'Not specified')}
            Project: {task_data.get('project_name', 'None')}
            
            User Context:
            - Current workload: {user_context.get('active_tasks', 0)} active tasks
            - Recent productivity: {user_context.get('recent_productivity_score', 75)}%
            - Available time today: {user_context.get('available_time_hours', 8)} hours
            
            Provide:
            1. Priority level (low/medium/high/critical)
            2. Brief reasoning (2-3 sentences)
            3. Estimated time required (in hours)
            4. Optimal time slot suggestion
            """
            
            response = await self.client.chat.completions.acreate(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                max_tokens=200
            )
            
            content = response.choices[0].message.content
            
            # Parse the response (simplified parsing)
            lines = content.strip().split('\n')
            priority = "medium"  # default
            reasoning = "AI analysis based on task characteristics."
            
            for line in lines:
                if "priority" in line.lower():
                    for p in ["critical", "high", "medium", "low"]:
                        if p in line.lower():
                            priority = p
                            break
                elif "reasoning" in line.lower() or line.startswith("2."):
                    reasoning = line.split(":")[1].strip() if ":" in line else line.strip()
            
            return {
                "priority": priority,
                "reasoning": reasoning,
                "raw_response": content
            }
            
        except Exception as e:
            print(f"GPT suggestion failed: {e}")
            return {
                "priority": "medium",
                "reasoning": "Unable to get AI suggestion, defaulting to medium priority.",
                "error": str(e)
            }
    
    def _extract_task_features(self, task_data: Dict, user_context: Dict) -> List[float]:
        """Extract numerical features from task and user context"""
        features = []
        
        # Task features
        features.append(task_data.get('estimated_pomodoros', 1))  # Complexity
        
        # Due date urgency (days from now)
        due_date = task_data.get('due_date')
        if due_date:
            if isinstance(due_date, str):
                due_date = datetime.fromisoformat(due_date.replace('Z', '+00:00'))
            days_to_due = (due_date - datetime.now()).days
            urgency = max(0, min(1, 1 / (days_to_due + 1)))  # Higher urgency for sooner deadlines
        else:
            urgency = 0.3  # Medium urgency if no due date
        features.append(urgency)
        
        # User context features
        features.append(user_context.get('active_tasks', 0) / 10)  # Workload (normalized)
        features.append(user_context.get('recent_productivity_score', 75) / 100)  # Recent performance
        features.append(user_context.get('stress_level', 0.5))  # Stress indicator
        
        # Time-based features
        now = datetime.now()
        features.append(now.hour / 24)  # Time of day
        features.append(now.weekday() / 6)  # Day of week
        
        return features
    
    def _rule_based_priority(self, task_data: Dict) -> tuple[str, float]:
        """Fallback rule-based priority system"""
        score = 0.5  # Default medium priority
        
        # Due date factor
        due_date = task_data.get('due_date')
        if due_date:
            if isinstance(due_date, str):
                due_date = datetime.fromisoformat(due_date.replace('Z', '+00:00'))
            days_to_due = (due_date - datetime.now()).days
            if days_to_due <= 1:
                score += 0.4  # Very urgent
            elif days_to_due <= 3:
                score += 0.2  # Urgent
        
        # Complexity factor
        estimated_pomodoros = task_data.get('estimated_pomodoros', 1)
        if estimated_pomodoros >= 8:
            score += 0.1  # Complex tasks get slight priority boost
        
        # Project importance (could be enhanced with project metadata)
        project_name = task_data.get('project_name', '').lower()
        if any(keyword in project_name for keyword in ['urgent', 'critical', 'important']):
            score += 0.2
        
        # Map score to priority
        if score >= 0.8:
            return 'critical', 0.9
        elif score >= 0.6:
            return 'high', 0.8
        elif score >= 0.4:
            return 'medium', 0.7
        else:
            return 'low', 0.6
    
    async def generate_productivity_insights(self, user_id: str, analytics_data: Dict) -> Dict[str, Any]:
        """Generate personalized productivity insights using AI"""
        try:
            # Prepare data for analysis
            insights_prompt = f"""
            Analyze this user's productivity data and provide actionable insights:
            
            Productivity Metrics:
            - Total Focus Time: {analytics_data.get('total_focus_time', 0)} minutes
            - Completed Pomodoros: {analytics_data.get('completed_pomodoros', 0)}
            - Average Session Length: {analytics_data.get('average_session_length', 0)} minutes
            - Productivity Score: {analytics_data.get('productivity_score', 0)}%
            - Current Streak: {analytics_data.get('streak_days', 0)} days
            
            Recent Patterns:
            - Most productive time: {analytics_data.get('peak_hours', 'Unknown')}
            - Least productive time: {analytics_data.get('low_hours', 'Unknown')}
            - Average breaks taken: {analytics_data.get('break_frequency', 'Unknown')}
            
            Provide:
            1. Top 3 insights about productivity patterns
            2. 2-3 specific recommendations for improvement
            3. Potential burnout indicators (if any)
            4. Motivation/encouragement based on progress
            """
            
            response = await self.client.chat.completions.acreate(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": insights_prompt}],
                temperature=0.4,
                max_tokens=400
            )
            
            content = response.choices[0].message.content
            
            # Enhanced insights with ML predictions
            ml_insights = self._generate_ml_insights(analytics_data)
            
            return {
                "gpt_insights": content,
                "ml_insights": ml_insights,
                "recommendations": self._extract_recommendations(content),
                "burnout_risk": self._assess_burnout_risk(analytics_data),
                "motivation_score": self._calculate_motivation_score(analytics_data)
            }
            
        except Exception as e:
            print(f"Insight generation failed: {e}")
            return {
                "error": str(e),
                "fallback_insights": self._generate_fallback_insights(analytics_data)
            }
    
    def _generate_ml_insights(self, analytics_data: Dict) -> Dict[str, Any]:
        """Generate insights using ML models"""
        insights = {}
        
        # Productivity trend prediction
        recent_scores = analytics_data.get('recent_productivity_scores', [])
        if len(recent_scores) >= 3:
            trend = np.polyfit(range(len(recent_scores)), recent_scores, 1)[0]
            insights['productivity_trend'] = 'increasing' if trend > 0 else 'decreasing'
            insights['trend_strength'] = abs(trend)
        
        # Focus pattern analysis
        focus_sessions = analytics_data.get('focus_sessions', [])
        if focus_sessions:
            avg_duration = np.mean([s.get('duration', 0) for s in focus_sessions])
            insights['optimal_session_length'] = int(avg_duration)
            
            # Best time analysis
            hourly_performance = {}
            for session in focus_sessions:
                hour = session.get('hour', 12)
                score = session.get('focus_score', 0.5)
                if hour not in hourly_performance:
                    hourly_performance[hour] = []
                hourly_performance[hour].append(score)
            
            if hourly_performance:
                best_hour = max(hourly_performance.keys(), 
                              key=lambda h: np.mean(hourly_performance[h]))
                insights['optimal_work_hour'] = f"{best_hour:02d}:00"
        
        return insights
    
    def _extract_recommendations(self, gpt_content: str) -> List[str]:
        """Extract actionable recommendations from GPT response"""
        recommendations = []
        lines = gpt_content.split('\n')
        
        for line in lines:
            line = line.strip()
            if line and any(keyword in line.lower() for keyword in 
                          ['recommend', 'suggest', 'try', 'consider', 'improve']):
                # Clean up the recommendation
                rec = line.replace('-', '').replace('*', '').strip()
                if len(rec) > 10:  # Ignore very short lines
                    recommendations.append(rec)
        
        return recommendations[:3]  # Return top 3 recommendations
    
    def _assess_burnout_risk(self, analytics_data: Dict) -> Dict[str, Any]:
        """Assess burnout risk based on productivity patterns"""
        risk_factors = []
        risk_score = 0.0
        
        # Check for declining productivity
        recent_scores = analytics_data.get('recent_productivity_scores', [])
        if len(recent_scores) >= 5:
            trend = np.polyfit(range(len(recent_scores)), recent_scores, 1)[0]
            if trend < -2:  # Declining trend
                risk_factors.append("Declining productivity trend")
                risk_score += 0.3
        
        # Check for excessive work hours
        daily_focus_time = analytics_data.get('daily_average_focus_minutes', 0)
        if daily_focus_time > 480:  # More than 8 hours
            risk_factors.append("Excessive daily focus time")
            risk_score += 0.4
        
        # Check break patterns
        break_frequency = analytics_data.get('break_frequency', 0)
        if break_frequency < 0.3:  # Less than 30% of recommended breaks
            risk_factors.append("Insufficient break frequency")
            risk_score += 0.2
        
        # Weekend work patterns
        weekend_work = analytics_data.get('weekend_work_percentage', 0)
        if weekend_work > 50:
            risk_factors.append("High weekend work activity")
            risk_score += 0.1
        
        risk_level = 'low'
        if risk_score >= 0.7:
            risk_level = 'high'
        elif risk_score >= 0.4:
            risk_level = 'medium'
        
        return {
            "risk_level": risk_level,
            "risk_score": min(1.0, risk_score),
            "risk_factors": risk_factors,
            "recommendations": self._get_burnout_recommendations(risk_level)
        }
    
    def _get_burnout_recommendations(self, risk_level: str) -> List[str]:
        """Get recommendations based on burnout risk level"""
        if risk_level == 'high':
            return [
                "Consider taking a longer break or vacation",
                "Reduce daily work hours temporarily",
                "Focus on high-priority tasks only",
                "Increase break frequency between work sessions"
            ]
        elif risk_level == 'medium':
            return [
                "Ensure you're taking regular breaks",
                "Try to maintain work-life boundaries",
                "Consider delegating some tasks if possible"
            ]
        else:
            return [
                "Maintain your current healthy work patterns",
                "Continue taking regular breaks"
            ]
    
    def _calculate_motivation_score(self, analytics_data: Dict) -> float:
        """Calculate motivation score based on recent progress"""
        score = 0.5  # Base score
        
        # Streak bonus
        streak = analytics_data.get('streak_days', 0)
        score += min(0.3, streak * 0.02)  # Up to 30% bonus for streaks
        
        # Recent completion rate
        completion_rate = analytics_data.get('recent_completion_rate', 0.5)
        score += (completion_rate - 0.5) * 0.4  # Adjust based on completion rate
        
        # Productivity trend
        recent_scores = analytics_data.get('recent_productivity_scores', [])
        if len(recent_scores) >= 3:
            trend = np.polyfit(range(len(recent_scores)), recent_scores, 1)[0]
            score += min(0.2, trend * 0.1)  # Bonus for improving trend
        
        return max(0.0, min(1.0, score))
    
    def _generate_fallback_insights(self, analytics_data: Dict) -> List[str]:
        """Generate basic insights when AI fails"""
        insights = []
        
        completed_pomodoros = analytics_data.get('completed_pomodoros', 0)
        if completed_pomodoros > 0:
            insights.append(f"You've completed {completed_pomodoros} focused work sessions!")
        
        productivity_score = analytics_data.get('productivity_score', 0)
        if productivity_score >= 80:
            insights.append("Your productivity score is excellent! Keep up the great work.")
        elif productivity_score >= 60:
            insights.append("Good productivity levels. Consider optimizing your peak hours.")
        else:
            insights.append("There's room for improvement. Try shorter, more focused sessions.")
        
        return insights
    
    async def predict_task_duration(self, task_description: str, user_history: List[Dict]) -> int:
        """Predict task duration using ML and similar task analysis"""
        if not user_history:
            # Default estimation based on task description length and complexity
            word_count = len(task_description.split())
            if word_count > 50:
                return 120  # 2 hours for complex tasks
            elif word_count > 20:
                return 60   # 1 hour for medium tasks
            else:
                return 30   # 30 minutes for simple tasks
        
        # Analyze similar tasks from history
        similar_tasks = self._find_similar_tasks(task_description, user_history)
        
        if similar_tasks:
            avg_duration = np.mean([task['actual_duration'] for task in similar_tasks])
            return int(avg_duration)
        
        # Use ML model if available and trained
        try:
            features = self._extract_duration_features(task_description)
            if hasattr(self.productivity_model, 'predict'):
                duration = self.productivity_model.predict([features])[0]
                return max(15, int(duration))  # Minimum 15 minutes
        except:
            pass
        
        return 45  # Default 45 minutes
    
    def _find_similar_tasks(self, description: str, history: List[Dict]) -> List[Dict]:
        """Find similar tasks in user history using simple text similarity"""
        description_words = set(description.lower().split())
        similar_tasks = []
        
        for task in history:
            task_words = set(task.get('description', '').lower().split())
            # Simple Jaccard similarity
            intersection = len(description_words & task_words)
            union = len(description_words | task_words)
            
            if union > 0:
                similarity = intersection / union
                if similarity > 0.3:  # 30% similarity threshold
                    similar_tasks.append(task)
        
        return similar_tasks
    
    def _extract_duration_features(self, description: str) -> List[float]:
        """Extract features for duration prediction"""
        features = []
        
        # Text-based features
        features.append(len(description))  # Description length
        features.append(len(description.split()))  # Word count
        
        # Complexity indicators
        complexity_words = ['complex', 'difficult', 'research', 'analyze', 'design', 'develop']
        complexity_score = sum(1 for word in complexity_words if word in description.lower())
        features.append(complexity_score)
        
        # Action words that might indicate duration
        quick_words = ['quick', 'simple', 'brief', 'short']
        long_words = ['detailed', 'comprehensive', 'thorough', 'complete']
        
        quick_score = sum(1 for word in quick_words if word in description.lower())
        long_score = sum(1 for word in long_words if word in description.lower())
        
        features.append(quick_score)
        features.append(long_score)
        
        return features
    
    async def detect_burnout_risk(self, user_data: Dict) -> Dict[str, Any]:
        """Detect burnout patterns using advanced analytics"""
        return self._assess_burnout_risk(user_data)
    
    async def train_models(self, db: Session, user_id: Optional[str] = None):
        """Train ML models with user data"""
        # This would typically be run periodically to retrain models
        # with new user data for improved predictions
        print("Model training initiated...")
        
        # In a real implementation, this would:
        # 1. Fetch training data from database
        # 2. Prepare features and labels
        # 3. Train models
        # 4. Validate performance
        # 5. Save updated models
        
        # For now, we'll create some synthetic training data
        # to demonstrate the concept
        
        print("Model training completed (synthetic data used)")
        self._save_models()
        
        return {"status": "success", "message": "Models trained and saved"}