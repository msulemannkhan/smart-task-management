"""
Core configuration for the application.
Uses Supabase for both database and authentication.
"""
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import computed_field, field_validator
from typing import Optional, Union
import os
from pathlib import Path

# Get the project root directory
PROJECT_ROOT = Path(__file__).parent.parent.parent.parent
ENV_FILE = PROJECT_ROOT / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(ENV_FILE),
        env_ignore_empty=True,
        extra="ignore",
    )
    
    # Project Info
    PROJECT_NAME: str = "Smart Task Management API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Supabase Configuration
    DATABASE_URL: str  # Connection pooling URL from Supabase
    DIRECT_URL: str  # Direct connection for migrations
    SUPABASE_URL: str
    SUPABASE_KEY: str  # Service role key for backend operations
    
    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    
    # Redis Configuration (optional for caching)
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0
    REDIS_PASSWORD: Optional[str] = None
    
    @computed_field
    @property
    def REDIS_URL(self) -> str:
        if self.REDIS_PASSWORD:
            return f"redis://:{self.REDIS_PASSWORD}@{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB}"
        return f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB}"
    
    # Development
    DEBUG: bool = True
    
    # Environment
    ENVIRONMENT: str = "development"
    
    # CORS - Can be set via env or defaults based on environment
    BACKEND_CORS_ORIGINS: Optional[Union[list[str], str]] = None
    
    @field_validator('BACKEND_CORS_ORIGINS', mode='before')
    @classmethod
    def parse_cors_origins(cls, v, values):
        # If CORS origins are explicitly set in env, use them
        if v:
            if isinstance(v, str):
                return [x.strip() for x in v.split(',')]
            return v
        
        # Otherwise, set defaults based on environment
        # Note: Environment is not available in values during validation,
        # so we'll handle this in a computed field instead
        return v
    
    @computed_field
    @property
    def CORS_ORIGINS(self) -> list[str]:
        """Get CORS origins based on environment"""
        if self.BACKEND_CORS_ORIGINS:
            # Use explicitly set origins
            if isinstance(self.BACKEND_CORS_ORIGINS, str):
                return [x.strip() for x in self.BACKEND_CORS_ORIGINS.split(',')]
            return self.BACKEND_CORS_ORIGINS
        
        # Default based on environment
        if self.ENVIRONMENT == "production":
            return ["https://taskmanager.sulemankhan.me"]
        else:
            # Development defaults
            return [
                "http://localhost:8086",
                "http://localhost:3000", 
                "http://localhost:5173",
                "http://localhost:5174",
                "http://127.0.0.1:8086",
                "http://127.0.0.1:3000",
                "http://127.0.0.1:5173",
                "http://127.0.0.1:5174",
                "https://taskmanager.sulemankhan.me",  # Allow production URL in dev for testing
            ]


settings = Settings()