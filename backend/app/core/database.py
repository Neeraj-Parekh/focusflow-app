from sqlalchemy import create_engine, MetaData
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool
import redis
from typing import Generator
import asyncio

from .config import settings

# Database setup
engine = create_engine(
    settings.DATABASE_URL,
    poolclass=StaticPool if "sqlite" in settings.DATABASE_URL else None,
    connect_args=(
        {"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {}
    ),
    echo=settings.DEBUG,  # Log SQL queries in debug mode
    pool_pre_ping=True,  # Verify connections before use
    pool_recycle=3600,  # Recycle connections every hour
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Redis setup
redis_client = redis.Redis.from_url(settings.REDIS_URL, decode_responses=True)


def get_db() -> Generator[Session, None, None]:
    """Get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_redis() -> redis.Redis:
    """Get Redis client"""
    return redis_client


async def init_db():
    """Initialize database tables"""
    from ..models.models import Base

    # Create all tables
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully")


async def init_redis():
    """Initialize Redis connection and test connectivity"""
    try:
        await redis_client.ping()
        print("Redis connection established successfully")
    except Exception as e:
        print(f"Redis connection failed: {e}")


def create_test_db():
    """Create test database for testing"""
    from ..models.models import Base

    Base.metadata.create_all(bind=engine)


async def close_db_connections():
    """Close database connections gracefully"""
    engine.dispose()
    redis_client.close()
    print("Database connections closed")
