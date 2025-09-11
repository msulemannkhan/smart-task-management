"""
Category-related request and response schemas.
Handles validation and serialization for category operations.
"""
from pydantic import BaseModel, Field, field_validator
from typing import List, Optional
import uuid
from datetime import datetime
import re

from app.exceptions.base import ValidationError


class CategoryCreateRequest(BaseModel):
    """Schema for creating a new category"""
    name: str = Field(..., min_length=1, max_length=100, description="Category name")
    description: Optional[str] = Field(None, max_length=500, description="Category description")
    color: str = Field(..., pattern=r'^#[0-9A-Fa-f]{6}$', description="Category color (hex format)")
    project_id: uuid.UUID = Field(..., description="Project ID")
    position: int = Field(default=0, ge=0, description="Category position for ordering")

    @field_validator('name')
    @classmethod
    def validate_name(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValidationError("Category name cannot be empty")
        v = v.strip()
        if len(v) < 2:
            raise ValidationError("Category name must be at least 2 characters long")
        # Allow most printable characters except potentially dangerous ones
        if not re.match(r'^[a-zA-Z0-9\s\-_&().,!@#$%^*+=<>?/:;\'\"]+$', v):
            raise ValidationError("Category name contains invalid characters")
        return v

    @field_validator('color')
    @classmethod
    def validate_color(cls, v: str) -> str:
        if not re.match(r'^#[0-9A-Fa-f]{6}$', v):
            raise ValidationError("Color must be in hex format (#RRGGBB)")
        return v.upper()

    @field_validator('description')
    @classmethod
    def validate_description(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip()
            if not v:
                return None
            if len(v) > 500:
                raise ValidationError("Description cannot exceed 500 characters")
        return v


class CategoryUpdateRequest(BaseModel):
    """Schema for updating an existing category"""
    name: Optional[str] = Field(None, min_length=1, max_length=100, description="Category name")
    description: Optional[str] = Field(None, max_length=500, description="Category description") 
    color: Optional[str] = Field(None, pattern=r'^#[0-9A-Fa-f]{6}$', description="Category color (hex format)")
    position: Optional[int] = Field(None, ge=0, description="Category position for ordering")

    @field_validator('name')
    @classmethod
    def validate_name(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            if not v.strip():
                raise ValidationError("Category name cannot be empty")
            v = v.strip()
            if len(v) < 2:
                raise ValidationError("Category name must be at least 2 characters long")
            # Allow most printable characters except potentially dangerous ones
            if not re.match(r'^[a-zA-Z0-9\s\-_&().,!@#$%^*+=<>?/:;\'\"]+$', v):
                raise ValidationError("Category name contains invalid characters")
        return v

    @field_validator('color')
    @classmethod
    def validate_color(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            if not re.match(r'^#[0-9A-Fa-f]{6}$', v):
                raise ValidationError("Color must be in hex format (#RRGGBB)")
            return v.upper()
        return v

    @field_validator('description')
    @classmethod
    def validate_description(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip() if v else None
            if v and len(v) > 500:
                raise ValidationError("Description cannot exceed 500 characters")
        return v


class CategoryResponse(BaseModel):
    """Schema for category response"""
    id: uuid.UUID
    name: str
    description: Optional[str]
    color: str
    project_id: uuid.UUID
    created_by_id: uuid.UUID
    position: int
    task_count: int = Field(default=0, description="Number of tasks in this category")
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

    @classmethod
    def from_category(cls, category, task_count: int = 0) -> "CategoryResponse":
        """Convert Category model to response schema"""
        return cls(
            id=category.id,
            name=category.name,
            description=category.description,
            color=category.color,
            project_id=category.project_id,
            created_by_id=category.created_by_id,
            position=category.position,
            task_count=task_count,
            created_at=category.created_at,
            updated_at=category.updated_at
        )


class CategoryListResponse(BaseModel):
    """Schema for paginated category list response"""
    categories: List[CategoryResponse]
    total: int
    has_tasks: int = Field(default=0, description="Categories that have tasks")


class CategoryStatsResponse(BaseModel):
    """Schema for category statistics response"""
    total_categories: int
    total_tasks: int
    categories_with_tasks: int
    avg_tasks_per_category: float = Field(default=0.0, description="Average tasks per category")
    most_used_colors: List[str] = Field(default_factory=list, description="Most frequently used colors")


class CategoryReorderRequest(BaseModel):
    """Schema for category reordering request"""
    new_position: int = Field(..., ge=0, description="New position for ordering")


class CategoryMoveTasksRequest(BaseModel):
    """Schema for moving tasks when deleting category"""
    move_tasks_to_category_id: Optional[uuid.UUID] = Field(None, description="Target category ID to move tasks to")