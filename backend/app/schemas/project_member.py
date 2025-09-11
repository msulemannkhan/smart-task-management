"""
Project member schemas.
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
import uuid


class ProjectMemberCreate(BaseModel):
    user_id: uuid.UUID = Field(..., description="User to add")
    role: Optional[str] = Field(default="member")


class ProjectMemberUpdate(BaseModel):
    role: str = Field(..., description="New role")


class UserBasicInfo(BaseModel):
    """Basic user information for member responses"""
    id: uuid.UUID
    email: str
    username: Optional[str] = None
    full_name: Optional[str] = None

class ProjectMemberResponse(BaseModel):
    id: uuid.UUID
    project_id: uuid.UUID
    user_id: uuid.UUID
    role: str
    user: Optional[UserBasicInfo] = None


class ProjectMemberListResponse(BaseModel):
    members: List[ProjectMemberResponse]
    total: int


