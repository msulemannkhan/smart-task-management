"""
Activity API schemas for tracking user actions and system events.
"""
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
from uuid import UUID
from app.models.database import ActivityActionType


class ActivityResponse(BaseModel):
    """Response schema for activity"""
    id: UUID
    user_id: UUID
    user_name: Optional[str] = None
    action_type: ActivityActionType
    entity_type: str
    entity_id: Optional[UUID]
    entity_name: Optional[str]
    description: str
    target_user_id: Optional[UUID]
    target_user_name: Optional[str] = None
    project_id: Optional[UUID]
    project_name: Optional[str] = None
    metadata: Optional[Dict[str, Any]]
    created_at: datetime
    
    class Config:
        from_attributes = True


class ActivityListResponse(BaseModel):
    """Response for list of activities"""
    activities: List[ActivityResponse]
    total: int
    limit: int
    offset: int
