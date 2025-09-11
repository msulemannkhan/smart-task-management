"""
User API schemas.
"""
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import uuid


class PublicUser(BaseModel):
	id: uuid.UUID
	email: str
	username: str
	full_name: Optional[str] = None
	avatar_url: Optional[str] = None
	is_active: bool
	created_at: datetime


class UserListResponse(BaseModel):
	users: List[PublicUser]
	total: int
