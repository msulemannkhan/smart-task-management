"""
Authentication-related request and response schemas.
Handles validation and serialization for authentication operations.
"""
from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, Dict, Any
from datetime import datetime
import uuid
import re

from app.exceptions.base import ValidationError


class SignUpRequest(BaseModel):
    """Schema for user registration"""
    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., min_length=8, max_length=128, description="User password (min 8 characters)")
    full_name: Optional[str] = Field(None, max_length=100, description="User's full name")

    @field_validator('password')
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValidationError("Password must be at least 8 characters long")
        
        # Check for at least one digit and one letter
        if not re.search(r'[A-Za-z]', v) or not re.search(r'\d', v):
            raise ValidationError("Password must contain both letters and numbers")
        
        return v

    @field_validator('full_name')
    @classmethod
    def validate_full_name(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip()
            if not v:
                return None
            if len(v) < 2:
                raise ValidationError("Full name must be at least 2 characters long")
        return v


class SignInRequest(BaseModel):
    """Schema for user login"""
    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., description="User password")


class RefreshTokenRequest(BaseModel):
    """Schema for token refresh"""
    refresh_token: str = Field(..., description="Refresh token")


class AuthResponse(BaseModel):
    """Schema for authentication response with tokens"""
    access_token: str = Field(..., description="JWT access token")
    refresh_token: str = Field(..., description="JWT refresh token")
    token_type: str = Field(default="bearer", description="Token type")
    user: Dict[str, Any] = Field(..., description="User data")
    expires_in: Optional[int] = Field(None, description="Token expiration time in seconds")


class UserResponse(BaseModel):
    """Schema for current user response"""
    id: str = Field(..., description="User ID")
    email: str = Field(..., description="User email")
    username: str = Field(..., description="Username")
    full_name: Optional[str] = Field(None, description="Full name")
    avatar_url: Optional[str] = Field(None, description="Avatar URL")
    bio: Optional[str] = Field(None, description="User bio")
    is_active: bool = Field(..., description="Is user active")
    created_at: str = Field(..., description="Account creation date")


class MessageResponse(BaseModel):
    """Schema for simple message responses"""
    message: str = Field(..., description="Response message")
    success: bool = Field(default=True, description="Operation success status")


class TokenRefreshResponse(BaseModel):
    """Schema for token refresh response"""
    access_token: str = Field(..., description="New JWT access token")
    refresh_token: str = Field(..., description="New JWT refresh token")
    token_type: str = Field(default="bearer", description="Token type")
    expires_in: Optional[int] = Field(None, description="Token expiration time in seconds")


class HealthResponse(BaseModel):
    """Schema for health check response"""
    status: str = Field(..., description="Service status")
    service: str = Field(..., description="Service name")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Response timestamp")