from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

from ...core.database import get_db
from ...models.models import User, AIRecommendation
from ...services.ai_service import AIService
from .auth import get_current_user

router = APIRouter()
ai_service = AIService()

class AIRecommendationResponse(BaseModel):
    id: str
    recommendation_type: str
    title: str
    description: str
    confidence: float
    actionable: bool
    data: Dict[str, Any]
    created_at: str
    
    class Config:
        from_attributes = True

class TaskPriorityRequest(BaseModel):
    task_id: str

class ProductivityOptimizationRequest(BaseModel):
    focus_duration_minutes: Optional[int] = None
    break_frequency: Optional[float] = None
    work_schedule: Optional[List[str]] = None

@router.get("/recommendations", response_model=List[AIRecommendationResponse])
async def get_ai_recommendations(
    recommendation_type: Optional[str] = None,
    limit: int = 10,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get AI recommendations for the user"""
    
    query = db.query(AIRecommendation).filter(
        AIRecommendation.user_id == current_user.id,
        AIRecommendation.dismissed == False
    )
    
    if recommendation_type:
        query = query.filter(AIRecommendation.recommendation_type == recommendation_type)
    
    recommendations = query.order_by(
        AIRecommendation.created_at.desc()
    ).limit(limit).all()
    
    return [AIRecommendationResponse.from_orm(rec) for rec in recommendations]

@router.post("/task-priority")
async def get_task_priority_suggestion(
    request: TaskPriorityRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get AI-powered task priority suggestion"""
    
    from ...models.models import Task
    
    task = db.query(Task).filter(
        Task.id == request.task_id,
        Task.user_id == current_user.id
    ).first()
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    # Prepare task data for AI
    task_data = {
        "title": task.title,
        "description": task.description,
        "project_id": task.project_id,
        "estimated_pomodoros": task.estimated_pomodoros,
        "due_date": task.due_date,
        "tags": task.tags,
        "current_priority": task.priority
    }
    
    # Get user context
    user_context = {
        "active_tasks": db.query(Task).filter(
            Task.user_id == current_user.id,
            Task.status == "in-progress"
        ).count(),
        "recent_productivity_score": current_user.productivity_score,
        "available_time_hours": 8,
        "stress_level": 0.5
    }
    
    try:
        suggestion = await ai_service.suggest_task_priority(task_data, user_context)
        return suggestion
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate priority suggestion: {str(e)}"
        )

@router.post("/insights")
async def generate_productivity_insights(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate personalized productivity insights"""
    
    # Collect user data for analysis
    analytics_data = {
        "total_focus_time": current_user.total_focus_time,
        "completed_pomodoros": current_user.completed_pomodoros,
        "average_session_length": 25 * 60,  # 25 minutes in seconds
        "productivity_score": current_user.productivity_score,
        "streak_days": current_user.streak_days,
        "recent_productivity_scores": [75, 80, 85, 82, 88],  # Mock data
        "peak_hours": "09:00-11:00",
        "low_hours": "15:00-16:00",
        "break_frequency": 0.7,
        "daily_average_focus_minutes": current_user.total_focus_time / 60,
        "weekend_work_percentage": 20,
        "recent_completion_rate": 0.8
    }
    
    try:
        insights = await ai_service.generate_productivity_insights(
            current_user.id,
            analytics_data
        )
        
        # Store insights as recommendations in database
        if insights.get("recommendations"):
            for rec_text in insights["recommendations"][:3]:  # Top 3 recommendations
                recommendation = AIRecommendation(
                    user_id=current_user.id,
                    recommendation_type="productivity-tip",
                    title="Productivity Optimization",
                    description=rec_text,
                    confidence=0.8,
                    actionable=True,
                    data={"source": "ai_insights", "category": "productivity"}
                )
                db.add(recommendation)
        
        db.commit()
        
        return insights
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate insights: {str(e)}"
        )

@router.post("/optimize-schedule")
async def optimize_work_schedule(
    request: ProductivityOptimizationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get AI recommendations for optimizing work schedule"""
    
    # Mock historical data - in real implementation, get from database
    historical_data = [
        {
            "start_time": "2024-01-01T09:00:00",
            "actual_duration": 1500,
            "planned_duration": 1500,
            "focus_score": 0.85,
            "productivity_score": 80
        },
        {
            "start_time": "2024-01-01T14:00:00",
            "actual_duration": 1200,
            "planned_duration": 1500,
            "focus_score": 0.65,
            "productivity_score": 65
        }
    ]
    
    try:
        optimal_times = await ai_service.predict_optimal_work_time(
            current_user.id,
            historical_data
        )
        
        return {
            "optimal_work_times": optimal_times,
            "recommended_session_length": request.focus_duration_minutes or 25,
            "recommended_break_frequency": request.break_frequency or 0.8,
            "schedule_optimization_tips": [
                "Focus on high-priority tasks during your peak hours",
                "Take regular breaks to maintain concentration",
                "Avoid scheduling complex tasks during low-energy periods"
            ]
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to optimize schedule: {str(e)}"
        )

@router.post("/detect-burnout")
async def detect_burnout_risk(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Detect burnout risk using AI analysis"""
    
    user_data = {
        "recent_productivity_scores": [75, 70, 65, 60, 55],  # Declining trend
        "daily_average_focus_minutes": current_user.total_focus_time / 60,
        "break_frequency": 0.3,  # Low break frequency
        "weekend_work_percentage": 80,  # High weekend work
        "stress_indicators": ["long_hours", "declining_performance"]
    }
    
    try:
        burnout_analysis = await ai_service.detect_burnout_risk(user_data)
        
        # Create recommendation if high risk
        if burnout_analysis.get("risk_level") == "high":
            recommendation = AIRecommendation(
                user_id=current_user.id,
                recommendation_type="productivity-tip",
                title="Burnout Risk Detected",
                description="Your work patterns suggest you may be at risk of burnout. Consider taking more breaks and reducing work hours.",
                confidence=burnout_analysis.get("risk_score", 0.7),
                actionable=True,
                data=burnout_analysis
            )
            db.add(recommendation)
            db.commit()
        
        return burnout_analysis
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to detect burnout risk: {str(e)}"
        )

@router.post("/train-models")
async def train_ai_models(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Trigger AI model training (admin only in production)"""
    
    # In production, this would be restricted to admin users
    try:
        result = await ai_service.train_models(db, current_user.id)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to train models: {str(e)}"
        )

@router.post("/recommendations/{recommendation_id}/dismiss")
async def dismiss_recommendation(
    recommendation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Dismiss an AI recommendation"""
    
    recommendation = db.query(AIRecommendation).filter(
        AIRecommendation.id == recommendation_id,
        AIRecommendation.user_id == current_user.id
    ).first()
    
    if not recommendation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recommendation not found"
        )
    
    recommendation.dismissed = True
    db.commit()
    
    return {"message": "Recommendation dismissed"}

@router.post("/recommendations/{recommendation_id}/implement")
async def implement_recommendation(
    recommendation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark recommendation as implemented"""
    
    recommendation = db.query(AIRecommendation).filter(
        AIRecommendation.id == recommendation_id,
        AIRecommendation.user_id == current_user.id
    ).first()
    
    if not recommendation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recommendation not found"
        )
    
    recommendation.implemented = True
    db.commit()
    
    return {"message": "Recommendation marked as implemented"}