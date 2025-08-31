import os
from typing import Optional
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Application settings
    APP_NAME: str = "FocusFlow API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # Database settings
    DATABASE_URL: str = (
        "postgresql://focusflow_user:focusflow_password@localhost:5432/focusflow"
    )

    # Redis settings
    REDIS_URL: str = "redis://localhost:6379"

    # Security settings
    SECRET_KEY: str = "your-secret-key-change-this-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    ENCRYPTION_KEY: str = "your-encryption-key-32-chars-long"

    # API Keys
    OPENAI_API_KEY: Optional[str] = None

    # CORS settings
    ALLOWED_ORIGINS: list = ["http://localhost:3000", "http://localhost:8080"]

    # Email settings (for notifications)
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None

    # Celery settings
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/0"

    # File upload settings
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    UPLOAD_DIR: str = "uploads"

    # AI/ML settings
    ML_MODELS_DIR: str = "ml_models"
    ENABLE_AI_FEATURES: bool = True
    AI_CONFIDENCE_THRESHOLD: float = 0.7

    # IoT settings
    IOT_DEVICE_DISCOVERY_TIMEOUT: int = 30
    ENABLE_IOT_FEATURES: bool = True

    # Monitoring settings
    ENABLE_METRICS: bool = True
    METRICS_PORT: int = 8001

    # Rate limiting
    RATE_LIMIT_PER_MINUTE: int = 100

    class Config:
        env_file = ".env"
        case_sensitive = True


# Create global settings instance
settings = Settings()

# Create directories if they don't exist
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.ML_MODELS_DIR, exist_ok=True)
