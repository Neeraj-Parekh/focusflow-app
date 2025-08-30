from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Dict, Any
from datetime import datetime, timedelta

from ...core.database import get_db
from ...models.models import User, Task, PomodoroSession
from ...services.ai_service import AIService
from .auth import get_current_user

router = APIRouter()
ai_service = AIService()

class AnalyticsResponse(BaseModel):
    total_focus_time: int
    completed_pomodoros: int
    average_session_length: float
    productivity_score: float
    streak_days: int
    focus_patterns: List[Dict[str, Any]]
    task_completion_rate: float
    peak_productivity_hours: List[str]

@router.get("/dashboard", response_model=AnalyticsResponse)
async def get_analytics_dashboard(
    days: int = 30,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get analytics dashboard data"""
    
    # Calculate date range
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)
    
    # Get pomodoro sessions
    sessions = db.query(PomodoroSession).filter(
        PomodoroSession.user_id == current_user.id,
        PomodoroSession.completed_at >= start_date
    ).all()
    
    # Get tasks
    tasks = db.query(Task).filter(
        Task.user_id == current_user.id,
        Task.created_at >= start_date
    ).all()
    
    # Calculate metrics
    total_focus_time = sum(s.actual_duration for s in sessions if s.session_type == 'work')
    completed_pomodoros = len([s for s in sessions if s.session_type == 'work'])
    
    avg_session_length = (
        sum(s.actual_duration for s in sessions) / len(sessions) 
        if sessions else 0
    )
    
    # Task completion rate
    completed_tasks = len([t for t in tasks if t.status == 'completed'])
    task_completion_rate = (completed_tasks / len(tasks) * 100) if tasks else 0
    
    # Productivity score (simplified calculation)
    productivity_score = min(100, (completed_pomodoros / (days * 8)) * 100) if days > 0 else 0
    
    # Focus patterns (simplified)
    focus_patterns = []
    for session in sessions[-10:]:  # Last 10 sessions
        focus_patterns.append({
            "time_of_day": session.time_of_day or "unknown",
            "focus_score": session.focus_score,
            "duration": session.actual_duration
        })
    
    # Peak hours (simplified)
    peak_hours = ["09:00-11:00", "14:00-16:00"]  # Default
    
    return AnalyticsResponse(
        total_focus_time=total_focus_time,
        completed_pomodoros=completed_pomodoros,
        average_session_length=avg_session_length,
        productivity_score=productivity_score,
        streak_days=current_user.streak_days,
        focus_patterns=focus_patterns,
        task_completion_rate=task_completion_rate,
        peak_productivity_hours=peak_hours
    )

@router.get("/insights")
async def get_productivity_insights(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get AI-generated productivity insights"""
    
    # Prepare analytics data
    analytics_data = {
        "total_focus_time": current_user.total_focus_time,
        "completed_pomodoros": current_user.completed_pomodoros,
        "productivity_score": current_user.productivity_score,
        "streak_days": current_user.streak_days,
        "average_session_length": 25,  # Default
        "recent_productivity_scores": [75, 80, 85, 82, 88],  # Mock data
        "peak_hours": "09:00-11:00",
        "low_hours": "15:00-16:00",
        "break_frequency": 0.7
    }
    
    try:
        insights = await ai_service.generate_productivity_insights(
            current_user.id, 
            analytics_data
        )
        return insights
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate insights: {str(e)}"
        )

@router.get("/export")
async def export_analytics_data(
    format: str = "json",
    days: int = 30,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Export analytics data"""
    
    # This would generate CSV/PDF reports in a real implementation
    return {
        "message": f"Analytics export in {format} format for {days} days",
        "download_url": "/api/v1/analytics/download/123456",
        "expires_at": datetime.utcnow() + timedelta(hours=1)
    }