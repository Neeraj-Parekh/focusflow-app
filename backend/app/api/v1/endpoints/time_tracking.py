from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from ...core.database import get_db
from ...models.models import TimeEntry, User
from .auth import get_current_user

router = APIRouter()


class TimeEntryCreate(BaseModel):
    description: str
    task_id: Optional[str] = None
    project_id: Optional[str] = None
    tags: List[str] = []
    billable: bool = False
    hourly_rate: Optional[float] = None


class TimeEntryUpdate(BaseModel):
    description: Optional[str] = None
    end_time: Optional[datetime] = None
    duration: Optional[int] = None
    tags: Optional[List[str]] = None
    billable: Optional[bool] = None
    hourly_rate: Optional[float] = None


class TimeEntryResponse(BaseModel):
    id: str
    description: str
    start_time: datetime
    end_time: Optional[datetime]
    duration: int
    tags: List[str]
    billable: bool
    hourly_rate: Optional[float]
    task_id: Optional[str]
    project_id: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


@router.post("/start", response_model=TimeEntryResponse)
async def start_time_entry(
    entry_data: TimeEntryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Start a new time entry"""

    # Stop any running time entries
    running_entry = (
        db.query(TimeEntry)
        .filter(TimeEntry.user_id == current_user.id, TimeEntry.end_time.is_(None))
        .first()
    )

    if running_entry:
        running_entry.end_time = datetime.utcnow()
        running_entry.duration = int(
            (running_entry.end_time - running_entry.start_time).total_seconds()
        )

    # Create new time entry
    db_entry = TimeEntry(
        **entry_data.dict(), user_id=current_user.id, start_time=datetime.utcnow()
    )

    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)

    return TimeEntryResponse.from_orm(db_entry)


@router.post("/stop/{entry_id}", response_model=TimeEntryResponse)
async def stop_time_entry(
    entry_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Stop a running time entry"""

    entry = (
        db.query(TimeEntry)
        .filter(
            TimeEntry.id == entry_id,
            TimeEntry.user_id == current_user.id,
            TimeEntry.end_time.is_(None),
        )
        .first()
    )

    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Running time entry not found"
        )

    entry.end_time = datetime.utcnow()
    entry.duration = int((entry.end_time - entry.start_time).total_seconds())
    db.commit()
    db.refresh(entry)

    return TimeEntryResponse.from_orm(entry)


@router.get("/", response_model=List[TimeEntryResponse])
async def get_time_entries(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    project_id: Optional[str] = None,
    billable_only: bool = False,
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get time entries with filtering"""

    query = db.query(TimeEntry).filter(TimeEntry.user_id == current_user.id)

    if start_date:
        query = query.filter(TimeEntry.start_time >= start_date)

    if end_date:
        query = query.filter(TimeEntry.start_time <= end_date)

    if project_id:
        query = query.filter(TimeEntry.project_id == project_id)

    if billable_only:
        query = query.filter(TimeEntry.billable == True)

    entries = (
        query.order_by(TimeEntry.start_time.desc()).offset(offset).limit(limit).all()
    )

    return [TimeEntryResponse.from_orm(entry) for entry in entries]


@router.get("/{entry_id}", response_model=TimeEntryResponse)
async def get_time_entry(
    entry_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a specific time entry"""

    entry = (
        db.query(TimeEntry)
        .filter(TimeEntry.id == entry_id, TimeEntry.user_id == current_user.id)
        .first()
    )

    if not entry:
        raise HTTPException(status_code=404, detail="Time entry not found")

    return TimeEntryResponse.from_orm(entry)


@router.put("/{entry_id}", response_model=TimeEntryResponse)
async def update_time_entry(
    entry_id: str,
    entry_data: TimeEntryUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update a time entry"""

    entry = (
        db.query(TimeEntry)
        .filter(TimeEntry.id == entry_id, TimeEntry.user_id == current_user.id)
        .first()
    )

    if not entry:
        raise HTTPException(status_code=404, detail="Time entry not found")

    update_data = entry_data.dict(exclude_unset=True)

    # Recalculate duration if end_time is updated
    if "end_time" in update_data and update_data["end_time"]:
        update_data["duration"] = int(
            (update_data["end_time"] - entry.start_time).total_seconds()
        )

    for field, value in update_data.items():
        setattr(entry, field, value)

    entry.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(entry)

    return TimeEntryResponse.from_orm(entry)


@router.delete("/{entry_id}")
async def delete_time_entry(
    entry_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a time entry"""

    entry = (
        db.query(TimeEntry)
        .filter(TimeEntry.id == entry_id, TimeEntry.user_id == current_user.id)
        .first()
    )

    if not entry:
        raise HTTPException(status_code=404, detail="Time entry not found")

    db.delete(entry)
    db.commit()

    return {"message": "Time entry deleted successfully"}


@router.get("/stats/summary")
async def get_time_tracking_stats(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get time tracking statistics"""

    query = db.query(TimeEntry).filter(TimeEntry.user_id == current_user.id)

    if start_date:
        query = query.filter(TimeEntry.start_time >= start_date)

    if end_date:
        query = query.filter(TimeEntry.start_time <= end_date)

    entries = query.all()

    total_time = sum(entry.duration for entry in entries if entry.duration)
    billable_time = sum(
        entry.duration for entry in entries if entry.billable and entry.duration
    )
    total_revenue = sum(
        (entry.duration / 3600) * (entry.hourly_rate or 0)
        for entry in entries
        if entry.billable and entry.duration and entry.hourly_rate
    )

    return {
        "total_entries": len(entries),
        "total_time_seconds": total_time,
        "total_time_hours": total_time / 3600,
        "billable_time_seconds": billable_time,
        "billable_time_hours": billable_time / 3600,
        "total_revenue": total_revenue,
        "average_session_duration": total_time / len(entries) if entries else 0,
    }


@router.get("/active/current")
async def get_active_time_entry(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """Get currently running time entry"""

    active_entry = (
        db.query(TimeEntry)
        .filter(TimeEntry.user_id == current_user.id, TimeEntry.end_time.is_(None))
        .first()
    )

    if not active_entry:
        return {"active_entry": None}

    # Calculate current duration
    current_duration = int(
        (datetime.utcnow() - active_entry.start_time).total_seconds()
    )

    return {
        "active_entry": TimeEntryResponse.from_orm(active_entry),
        "current_duration": current_duration,
    }
