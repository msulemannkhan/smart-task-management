"""
Task-related request and response schemas.
Handles validation and serialization for task operations.
"""
from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Dict, Any, Union
from datetime import datetime, date
import uuid

from app.models.database import TaskStatus, TaskPriority
from app.exceptions.base import ValidationError


class TaskCreateRequest(BaseModel):
    """Schema for creating a new task"""
    title: str = Field(..., min_length=1, max_length=500, description="Task title")
    description: Optional[str] = Field(None, description="Task description")
    project_id: Optional[uuid.UUID] = Field(None, description="Project ID (optional)")
    category_id: Optional[uuid.UUID] = Field(None, description="Category ID")
    assignee_id: Optional[uuid.UUID] = Field(None, description="Assignee user ID")
    
    status: TaskStatus = Field(default=TaskStatus.TODO, description="Task status")
    priority: TaskPriority = Field(default=TaskPriority.MEDIUM, description="Task priority")
    
    # Dates
    start_date: Optional[Union[datetime, date, str]] = Field(None, description="Task start date")
    due_date: Optional[Union[datetime, date, str]] = Field(None, description="Task due date")
    estimated_hours: Optional[float] = Field(None, ge=0, le=1000, description="Estimated hours")
    
    # Hierarchical
    parent_task_id: Optional[uuid.UUID] = Field(None, description="Parent task ID for subtasks")
    
    # Organization
    position: float = Field(default=0, description="Task position for ordering")
    tags: Optional[List[str]] = Field(None, description="Task tags")

    @field_validator('title')
    @classmethod
    def validate_title(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValidationError("Task title cannot be empty")
        return v.strip()

    @field_validator('tags')
    @classmethod
    def validate_tags(cls, v: Optional[List[str]]) -> Optional[List[str]]:
        if v is not None:
            if len(v) > 10:
                raise ValidationError("Maximum 10 tags allowed")
            # Remove duplicates and empty tags
            cleaned_tags = list(set(tag.strip() for tag in v if tag.strip()))
            return cleaned_tags if cleaned_tags else None
        return v

    @field_validator('start_date', 'due_date')
    @classmethod
    def validate_date_fields(cls, v: Optional[Union[datetime, date, str]]) -> Optional[datetime]:
        if v is None:
            return None
        
        if isinstance(v, str):
            try:
                # Try parsing as date first (YYYY-MM-DD)
                if len(v) == 10 and v.count('-') == 2:
                    # It's a date string, convert to datetime at start of day
                    parsed_date = datetime.strptime(v, '%Y-%m-%d')
                    return parsed_date
                else:
                    # Try parsing as full datetime
                    return datetime.fromisoformat(v.replace('Z', '+00:00'))
            except ValueError:
                raise ValidationError(f"Invalid date format: {v}. Expected YYYY-MM-DD or ISO datetime format")
        elif isinstance(v, date):
            # Convert date to datetime at start of day
            return datetime.combine(v, datetime.min.time())
        elif isinstance(v, datetime):
            return v
        else:
            raise ValidationError(f"Invalid date type: {type(v)}")
    
    @field_validator('due_date')
    @classmethod
    def validate_due_date_logic(cls, v: Optional[datetime], info) -> Optional[datetime]:
        if v and hasattr(info, 'data') and 'start_date' in info.data:
            start_date = info.data['start_date']
            if start_date and v < start_date:
                raise ValidationError("Due date cannot be before start date")
        return v


class TaskUpdateRequest(BaseModel):
    """Schema for updating an existing task"""
    title: Optional[str] = Field(None, min_length=1, max_length=500, description="Task title")
    description: Optional[str] = Field(None, description="Task description")
    category_id: Optional[uuid.UUID] = Field(None, description="Category ID")
    assignee_id: Optional[uuid.UUID] = Field(None, description="Assignee user ID")
    
    status: Optional[TaskStatus] = Field(None, description="Task status")
    priority: Optional[TaskPriority] = Field(None, description="Task priority")
    
    # Progress
    completed: Optional[bool] = Field(None, description="Task completion status")
    completed_percentage: Optional[int] = Field(None, ge=0, le=100, description="Completion percentage")
    
    # Dates
    start_date: Optional[Union[datetime, date, str]] = Field(None, description="Task start date")
    due_date: Optional[Union[datetime, date, str]] = Field(None, description="Task due date")
    estimated_hours: Optional[float] = Field(None, ge=0, le=1000, description="Estimated hours")
    actual_hours: Optional[float] = Field(None, ge=0, le=1000, description="Actual hours spent")
    
    # Organization
    position: Optional[float] = Field(None, description="Task position for ordering")
    tags: Optional[List[str]] = Field(None, description="Task tags")

    @field_validator('title')
    @classmethod
    def validate_title(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            if not v.strip():
                raise ValidationError("Task title cannot be empty")
            return v.strip()
        return v

    @field_validator('tags')
    @classmethod
    def validate_tags(cls, v: Optional[List[str]]) -> Optional[List[str]]:
        if v is not None:
            if len(v) > 10:
                raise ValidationError("Maximum 10 tags allowed")
            # Remove duplicates and empty tags
            cleaned_tags = list(set(tag.strip() for tag in v if tag.strip()))
            return cleaned_tags if cleaned_tags else None
        return v

    @field_validator('start_date', 'due_date')
    @classmethod
    def validate_date_fields(cls, v: Optional[Union[datetime, date, str]]) -> Optional[datetime]:
        if v is None:
            return None
        
        if isinstance(v, str):
            try:
                # Try parsing as date first (YYYY-MM-DD)
                if len(v) == 10 and v.count('-') == 2:
                    # It's a date string, convert to datetime at start of day
                    parsed_date = datetime.strptime(v, '%Y-%m-%d')
                    return parsed_date
                else:
                    # Try parsing as full datetime
                    return datetime.fromisoformat(v.replace('Z', '+00:00'))
            except ValueError:
                raise ValidationError(f"Invalid date format: {v}. Expected YYYY-MM-DD or ISO datetime format")
        elif isinstance(v, date):
            # Convert date to datetime at start of day
            return datetime.combine(v, datetime.min.time())
        elif isinstance(v, datetime):
            return v
        else:
            raise ValidationError(f"Invalid date type: {type(v)}")
    
    @field_validator('due_date')
    @classmethod
    def validate_due_date_logic(cls, v: Optional[datetime], info) -> Optional[datetime]:
        if v and hasattr(info, 'data') and 'start_date' in info.data:
            start_date = info.data['start_date']
            if start_date and v < start_date:
                raise ValidationError("Due date cannot be before start date")
        return v


class TaskResponse(BaseModel):
    """Schema for task response"""
    id: uuid.UUID
    title: str
    description: Optional[str]
    status: TaskStatus
    priority: TaskPriority
    
    # Progress
    completed: bool
    completed_percentage: int
    
    # Dates
    start_date: Optional[datetime]
    due_date: Optional[datetime]
    estimated_hours: Optional[float]
    actual_hours: Optional[float]
    completed_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    
    # Relationships
    project_id: uuid.UUID
    category_id: Optional[uuid.UUID]
    creator_id: uuid.UUID
    assignee_id: Optional[uuid.UUID]
    parent_task_id: Optional[uuid.UUID]
    
    # Organization
    position: float
    tags: List[str]
    
    # Metadata
    version: int
    
    # Computed fields
    is_overdue: bool = Field(default=False, description="Whether task is overdue")
    days_until_due: Optional[int] = Field(default=None, description="Days until due date")

    class Config:
        from_attributes = True

    @classmethod
    def from_task(cls, task, include_computed: bool = True) -> "TaskResponse":
        """Convert Task model to response schema"""
        response_data = {
            "id": task.id,
            "title": task.title,
            "description": task.description,
            "status": task.status,
            "priority": task.priority,
            "completed": task.completed,
            "completed_percentage": task.completed_percentage,
            "start_date": task.start_date,
            "due_date": task.due_date,
            "estimated_hours": task.estimated_hours,
            "actual_hours": task.actual_hours,
            "completed_at": task.completed_at,
            "created_at": task.created_at,
            "updated_at": task.updated_at,
            "project_id": task.project_id,
            "category_id": task.category_id,
            "creator_id": task.creator_id,
            "assignee_id": task.assignee_id,
            "parent_task_id": task.parent_task_id,
            "position": task.position,
            "tags": task.tags if hasattr(task, 'tags') else [],
            "version": task.version,
        }
        
        if include_computed:
            # Add computed fields
            now = datetime.utcnow()
            if task.due_date and not task.completed:
                response_data["is_overdue"] = task.due_date < now
                days_diff = (task.due_date.date() - now.date()).days
                response_data["days_until_due"] = days_diff
            else:
                response_data["is_overdue"] = False
                response_data["days_until_due"] = None
        
        return cls(**response_data)


class TaskListResponse(BaseModel):
    """Schema for paginated task list response"""
    tasks: List[TaskResponse]
    total: int
    limit: int
    offset: int
    has_more: bool
    
    # Metadata
    filters_applied: Dict[str, Any] = Field(default_factory=dict, description="Applied filters")
    sort_by: Optional[str] = Field(None, description="Sort field")
    sort_order: str = Field(default="asc", description="Sort order")


class TaskStatsResponse(BaseModel):
    """Schema for task statistics response"""
    total: int
    completed: int
    in_progress: int
    todo: int
    overdue: int
    
    # By priority
    priority_breakdown: Dict[str, int] = Field(default_factory=dict)
    
    # Completion metrics
    completion_rate: float = Field(default=0.0, ge=0.0, le=1.0)
    average_completion_time: Optional[float] = Field(None, description="Average completion time in hours")
    
    # Time-based stats
    created_today: int = Field(default=0)
    completed_today: int = Field(default=0)
    due_this_week: int = Field(default=0)


class TaskSearchRequest(BaseModel):
    """Schema for task search requests"""
    query: Optional[str] = Field(None, description="Search query")
    project_id: Optional[str] = Field(None, description="Filter by project")
    status: Optional[List[TaskStatus]] = Field(None, description="Filter by status")
    priority: Optional[List[TaskPriority]] = Field(None, description="Filter by priority")
    category_id: Optional[str] = Field(None, description="Filter by category")
    assignee_id: Optional[str] = Field(None, description="Filter by assignee")
    due_date_from: Optional[datetime] = Field(None, description="Due date range start")
    due_date_to: Optional[datetime] = Field(None, description="Due date range end")
    tags: Optional[List[str]] = Field(None, description="Filter by tags")
    
    # Pagination and sorting
    limit: int = Field(default=50, ge=1, le=100, description="Results per page")
    offset: int = Field(default=0, ge=0, description="Results offset")
    sort_by: str = Field(default="created_at", description="Sort field")
    sort_order: str = Field(default="desc", pattern="^(asc|desc)$", description="Sort order")

    @field_validator('tags')
    @classmethod
    def validate_tags(cls, v: Optional[List[str]]) -> Optional[List[str]]:
        if v:
            return [tag.strip() for tag in v if tag.strip()]
        return v