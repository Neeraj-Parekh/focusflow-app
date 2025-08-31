from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from ...core.database import get_db
from ...models.models import Task, User, Project
from ...services.ai_service import AIService

router = APIRouter()
ai_service = AIService()


# Pydantic models
class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    project_id: str
    priority: str = "medium"
    estimated_pomodoros: int = 1
    due_date: Optional[datetime] = None
    tags: List[str] = []


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    project_id: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    estimated_pomodoros: Optional[int] = None
    completed_pomodoros: Optional[int] = None
    due_date: Optional[datetime] = None
    tags: Optional[List[str]] = None


class TaskResponse(BaseModel):
    id: str
    title: str
    description: Optional[str]
    project_id: str
    priority: str
    status: str
    estimated_pomodoros: int
    completed_pomodoros: int
    due_date: Optional[datetime]
    tags: List[str]
    ai_suggested_priority: Optional[str]
    ai_estimated_duration: Optional[int]
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime]

    class Config:
        from_attributes = True


class TaskAISuggestion(BaseModel):
    task_id: str


# Import get_current_user function
from .auth import get_current_user


@router.post("/", response_model=TaskResponse)
async def create_task(
    task_data: TaskCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new task"""

    # Verify project belongs to user
    project = (
        db.query(Project)
        .filter(Project.id == task_data.project_id, Project.user_id == current_user.id)
        .first()
    )

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
        )

    # Create task
    db_task = Task(**task_data.dict(), user_id=current_user.id)

    db.add(db_task)
    db.commit()
    db.refresh(db_task)

    # Get AI suggestions in background
    background_tasks.add_task(
        generate_ai_suggestions_for_task, db_task.id, current_user.id
    )

    return TaskResponse.from_orm(db_task)


@router.get("/", response_model=List[TaskResponse])
async def get_tasks(
    project_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    limit: int = Query(50, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get user's tasks with optional filtering"""

    query = db.query(Task).filter(Task.user_id == current_user.id)

    if project_id:
        query = query.filter(Task.project_id == project_id)

    if status:
        query = query.filter(Task.status == status)

    if priority:
        query = query.filter(Task.priority == priority)

    tasks = query.order_by(Task.created_at.desc()).offset(offset).limit(limit).all()

    return [TaskResponse.from_orm(task) for task in tasks]


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(
    task_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a specific task"""

    task = (
        db.query(Task)
        .filter(Task.id == task_id, Task.user_id == current_user.id)
        .first()
    )

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Task not found"
        )

    return TaskResponse.from_orm(task)


@router.put("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: str,
    task_data: TaskUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update a task"""

    task = (
        db.query(Task)
        .filter(Task.id == task_id, Task.user_id == current_user.id)
        .first()
    )

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Task not found"
        )

    # Update task fields
    update_data = task_data.dict(exclude_unset=True)

    # Handle status change to completed
    if update_data.get("status") == "completed" and task.status != "completed":
        update_data["completed_at"] = datetime.utcnow()
    elif update_data.get("status") != "completed":
        update_data["completed_at"] = None

    for field, value in update_data.items():
        setattr(task, field, value)

    task.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(task)

    return TaskResponse.from_orm(task)


@router.delete("/{task_id}")
async def delete_task(
    task_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a task"""

    task = (
        db.query(Task)
        .filter(Task.id == task_id, Task.user_id == current_user.id)
        .first()
    )

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Task not found"
        )

    db.delete(task)
    db.commit()

    return {"message": "Task deleted successfully"}


@router.post("/{task_id}/ai-suggestions")
async def get_ai_suggestions_for_task(
    task_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get AI suggestions for a specific task"""

    task = (
        db.query(Task)
        .filter(Task.id == task_id, Task.user_id == current_user.id)
        .first()
    )

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Task not found"
        )

    # Prepare task data for AI
    task_data = {
        "title": task.title,
        "description": task.description,
        "project_id": task.project_id,
        "estimated_pomodoros": task.estimated_pomodoros,
        "due_date": task.due_date,
        "tags": task.tags,
    }

    # Get user context
    user_tasks = db.query(Task).filter(Task.user_id == current_user.id).all()
    user_context = {
        "active_tasks": len([t for t in user_tasks if t.status == "in-progress"]),
        "recent_productivity_score": current_user.productivity_score,
        "available_time_hours": 8,  # This could be calculated from user schedule
        "stress_level": 0.5,  # This could be derived from user patterns
    }

    # Get AI suggestions
    try:
        suggestions = await ai_service.suggest_task_priority(task_data, user_context)
        duration_estimate = await ai_service.predict_task_duration(
            task.title + " " + (task.description or ""),
            [],  # Would pass user's task history in real implementation
        )

        # Update task with AI suggestions
        task.ai_suggested_priority = suggestions.get("suggested_priority")
        task.ai_estimated_duration = duration_estimate
        db.commit()

        return {
            "task_id": task_id,
            "priority_suggestion": suggestions,
            "duration_estimate": duration_estimate,
            "recommendations": suggestions.get(
                "reasoning", "No specific recommendations available"
            ),
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate AI suggestions: {str(e)}",
        )


@router.post("/{task_id}/increment-pomodoro")
async def increment_pomodoro(
    task_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Increment completed pomodoros for a task"""

    task = (
        db.query(Task)
        .filter(Task.id == task_id, Task.user_id == current_user.id)
        .first()
    )

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Task not found"
        )

    task.completed_pomodoros += 1

    # Mark as completed if reached estimated pomodoros
    if (
        task.completed_pomodoros >= task.estimated_pomodoros
        and task.status != "completed"
    ):
        task.status = "completed"
        task.completed_at = datetime.utcnow()

    task.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(task)

    return TaskResponse.from_orm(task)


@router.get("/stats/summary")
async def get_task_stats(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """Get task statistics summary"""

    tasks = db.query(Task).filter(Task.user_id == current_user.id).all()

    stats = {
        "total_tasks": len(tasks),
        "completed_tasks": len([t for t in tasks if t.status == "completed"]),
        "in_progress_tasks": len([t for t in tasks if t.status == "in-progress"]),
        "pending_tasks": len([t for t in tasks if t.status == "pending"]),
        "total_pomodoros_completed": sum(t.completed_pomodoros for t in tasks),
        "average_completion_rate": 0,
        "overdue_tasks": 0,
    }

    if stats["total_tasks"] > 0:
        stats["average_completion_rate"] = (
            stats["completed_tasks"] / stats["total_tasks"]
        ) * 100

    # Count overdue tasks
    now = datetime.utcnow()
    stats["overdue_tasks"] = len(
        [
            t
            for t in tasks
            if t.due_date and t.due_date < now and t.status != "completed"
        ]
    )

    return stats


# Background task for AI suggestions
async def generate_ai_suggestions_for_task(task_id: str, user_id: str):
    """Background task to generate AI suggestions for a new task"""
    try:
        # This would run in the background to generate AI suggestions
        # In a real implementation, this would use Celery or similar
        pass
    except Exception as e:
        print(f"Failed to generate AI suggestions for task {task_id}: {e}")
