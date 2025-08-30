from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey, Float, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    is_premium = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Preferences stored as JSON
    preferences = Column(JSON, default={
        "work_duration": 1500,  # 25 minutes in seconds
        "short_break_duration": 300,  # 5 minutes
        "long_break_duration": 900,  # 15 minutes
        "auto_start_breaks": False,
        "auto_start_pomodoros": False,
        "sound_enabled": True,
        "notifications_enabled": True,
        "theme": "dark",
        "focus_music": "none"
    })
    
    # Analytics data
    total_focus_time = Column(Integer, default=0)
    completed_pomodoros = Column(Integer, default=0)
    productivity_score = Column(Float, default=0.0)
    streak_days = Column(Integer, default=0)
    
    # Relationships
    projects = relationship("Project", back_populates="user", cascade="all, delete-orphan")
    tasks = relationship("Task", back_populates="user", cascade="all, delete-orphan")
    time_entries = relationship("TimeEntry", back_populates="user", cascade="all, delete-orphan")
    pomodoro_sessions = relationship("PomodoroSession", back_populates="user", cascade="all, delete-orphan")

class Project(Base):
    __tablename__ = "projects"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    description = Column(Text)
    color = Column(String, default="#2196f3")
    icon = Column(String, default="📁")
    is_archived = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Foreign keys
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="projects")
    tasks = relationship("Task", back_populates="project", cascade="all, delete-orphan")

class Task(Base):
    __tablename__ = "tasks"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String, nullable=False)
    description = Column(Text)
    status = Column(String, default="pending")  # pending, in-progress, completed, cancelled
    priority = Column(String, default="medium")  # low, medium, high, critical
    estimated_pomodoros = Column(Integer, default=1)
    completed_pomodoros = Column(Integer, default=0)
    due_date = Column(DateTime(timezone=True))
    tags = Column(JSON, default=[])
    
    # AI-generated fields
    ai_suggested_priority = Column(String)
    ai_estimated_duration = Column(Integer)  # in minutes
    ai_optimal_time_slots = Column(JSON, default=[])
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    completed_at = Column(DateTime(timezone=True))
    
    # Foreign keys
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="tasks")
    project = relationship("Project", back_populates="tasks")
    time_entries = relationship("TimeEntry", back_populates="task")
    pomodoro_sessions = relationship("PomodoroSession", back_populates="task")

class TimeEntry(Base):
    __tablename__ = "time_entries"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    description = Column(String, nullable=False)
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True))
    duration = Column(Integer, default=0)  # in seconds
    tags = Column(JSON, default=[])
    billable = Column(Boolean, default=False)
    hourly_rate = Column(Float)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Foreign keys
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    task_id = Column(String, ForeignKey("tasks.id"))
    project_id = Column(String, ForeignKey("projects.id"))
    
    # Relationships
    user = relationship("User", back_populates="time_entries")
    task = relationship("Task", back_populates="time_entries")

class PomodoroSession(Base):
    __tablename__ = "pomodoro_sessions"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    session_type = Column(String, nullable=False)  # work, short-break, long-break
    planned_duration = Column(Integer, nullable=False)  # in seconds
    actual_duration = Column(Integer, nullable=False)  # in seconds
    completed_at = Column(DateTime(timezone=True), nullable=False)
    interrupted = Column(Boolean, default=False)
    focus_score = Column(Float, default=1.0)  # 0.0 to 1.0
    
    # Context data for AI analysis
    time_of_day = Column(String)  # morning, afternoon, evening, night
    day_of_week = Column(Integer)  # 0-6
    environment_data = Column(JSON, default={})  # noise level, lighting, etc.
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Foreign keys
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    task_id = Column(String, ForeignKey("tasks.id"))
    
    # Relationships
    user = relationship("User", back_populates="pomodoro_sessions")
    task = relationship("Task", back_populates="pomodoro_sessions")

class AIRecommendation(Base):
    __tablename__ = "ai_recommendations"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    recommendation_type = Column(String, nullable=False)  # task-priority, break-timing, focus-pattern, productivity-tip
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    confidence = Column(Float, nullable=False)  # 0.0 to 1.0
    actionable = Column(Boolean, default=True)
    
    # Recommendation data
    data = Column(JSON, default={})
    
    # User interaction
    viewed = Column(Boolean, default=False)
    dismissed = Column(Boolean, default=False)
    implemented = Column(Boolean, default=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True))
    
    # Foreign keys
    user_id = Column(String, ForeignKey("users.id"), nullable=False)

class FocusPattern(Base):
    __tablename__ = "focus_patterns"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    pattern_type = Column(String, nullable=False)  # daily, weekly, monthly
    time_slot = Column(String, nullable=False)  # e.g., "09:00-11:00"
    productivity_score = Column(Float, nullable=False)
    session_count = Column(Integer, default=1)
    average_focus_duration = Column(Integer, default=0)  # in seconds
    
    # Pattern metadata
    day_of_week = Column(Integer)  # 0-6 for weekly patterns
    week_of_month = Column(Integer)  # 1-4 for monthly patterns
    environmental_factors = Column(JSON, default={})
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Foreign keys
    user_id = Column(String, ForeignKey("users.id"), nullable=False)

class IoTDevice(Base):
    __tablename__ = "iot_devices"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    device_name = Column(String, nullable=False)
    device_type = Column(String, nullable=False)  # light, speaker, air-quality, etc.
    mac_address = Column(String, unique=True)
    ip_address = Column(String)
    capabilities = Column(JSON, default=[])  # list of supported actions
    
    # Device state
    is_online = Column(Boolean, default=False)
    last_seen = Column(DateTime(timezone=True))
    firmware_version = Column(String)
    
    # Configuration
    automation_rules = Column(JSON, default=[])
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Foreign keys
    user_id = Column(String, ForeignKey("users.id"), nullable=False)