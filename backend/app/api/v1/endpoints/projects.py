from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from ...core.database import get_db
from ...models.models import Project, User
from .auth import get_current_user

router = APIRouter()

class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None
    color: str = "#2196f3"
    icon: str = "📁"

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = None
    icon: Optional[str] = None
    is_archived: Optional[bool] = None

class ProjectResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    color: str
    icon: str
    is_archived: bool
    created_at: datetime
    updated_at: datetime
    task_count: int = 0
    
    class Config:
        from_attributes = True

@router.post("/", response_model=ProjectResponse)
async def create_project(
    project_data: ProjectCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new project"""
    db_project = Project(**project_data.dict(), user_id=current_user.id)
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return ProjectResponse.from_orm(db_project)

@router.get("/", response_model=List[ProjectResponse])
async def get_projects(
    include_archived: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's projects"""
    query = db.query(Project).filter(Project.user_id == current_user.id)
    if not include_archived:
        query = query.filter(Project.is_archived == False)
    
    projects = query.order_by(Project.created_at.desc()).all()
    return [ProjectResponse.from_orm(project) for project in projects]

@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific project"""
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    return ProjectResponse.from_orm(project)

@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: str,
    project_data: ProjectUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a project"""
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    update_data = project_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(project, field, value)
    
    project.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(project)
    return ProjectResponse.from_orm(project)

@router.delete("/{project_id}")
async def delete_project(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a project"""
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    db.delete(project)
    db.commit()
    return {"message": "Project deleted successfully"}