"""
Bulk operations request and response schemas.
Handles validation and serialization for bulk task operations.
"""
from pydantic import BaseModel, Field, field_validator
from typing import List, Optional
import uuid

from app.models.database import TaskStatus, TaskPriority
from app.exceptions.base import ValidationError


class BulkTaskIds(BaseModel):
    """Base model for bulk operations with task IDs"""
    task_ids: List[uuid.UUID] = Field(
        ..., 
        min_items=1, 
        max_items=1000, 
        description="List of task IDs (1-1000 tasks)"
    )

    @field_validator('task_ids')
    @classmethod
    def validate_task_ids(cls, v: List[uuid.UUID]) -> List[uuid.UUID]:
        if not v:
            raise ValidationError("At least one task ID is required")
        
        # Remove duplicates while preserving order
        seen = set()
        unique_ids = []
        for task_id in v:
            if task_id not in seen:
                seen.add(task_id)
                unique_ids.append(task_id)
        
        if len(unique_ids) != len(v):
            raise ValidationError("Duplicate task IDs found")
        
        if len(unique_ids) > 1000:
            raise ValidationError("Maximum 1000 tasks allowed per bulk operation")
        
        return unique_ids


class BulkUpdateRequest(BulkTaskIds):
    """Schema for bulk update operations"""
    status: Optional[TaskStatus] = Field(None, description="New task status")
    priority: Optional[TaskPriority] = Field(None, description="New task priority")
    category_id: Optional[uuid.UUID] = Field(None, description="New category ID (null to remove)")
    assignee_id: Optional[uuid.UUID] = Field(None, description="New assignee ID (null to unassign)")
    completed: Optional[bool] = Field(None, description="Completion status")
    tags: Optional[List[str]] = Field(None, description="New tags list")

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


class BulkCompleteRequest(BulkTaskIds):
    """Schema for bulk complete/uncomplete operations"""
    completed: bool = Field(True, description="Mark tasks as completed (true) or uncompleted (false)")


class BulkDeleteRequest(BulkTaskIds):
    """Schema for bulk delete operations"""
    hard_delete: bool = Field(
        False, 
        description="Permanently delete tasks (true) or soft delete (false)"
    )


class BulkStatusChangeRequest(BaseModel):
    """Schema for bulk status change operations"""
    task_ids: List[uuid.UUID] = Field(..., min_items=1, max_items=1000)
    new_status: TaskStatus = Field(..., description="New status for all tasks")

    @field_validator('task_ids')
    @classmethod
    def validate_task_ids(cls, v: List[uuid.UUID]) -> List[uuid.UUID]:
        if not v:
            raise ValidationError("At least one task ID is required")
        return list(set(v))  # Remove duplicates


class BulkPriorityChangeRequest(BaseModel):
    """Schema for bulk priority change operations"""
    task_ids: List[uuid.UUID] = Field(..., min_items=1, max_items=1000)
    new_priority: TaskPriority = Field(..., description="New priority for all tasks")

    @field_validator('task_ids')
    @classmethod
    def validate_task_ids(cls, v: List[uuid.UUID]) -> List[uuid.UUID]:
        if not v:
            raise ValidationError("At least one task ID is required")
        return list(set(v))  # Remove duplicates


class BulkCategoryAssignRequest(BaseModel):
    """Schema for bulk category assignment operations"""
    task_ids: List[uuid.UUID] = Field(..., min_items=1, max_items=1000)
    category_id: Optional[uuid.UUID] = Field(None, description="Category ID (null to remove category)")

    @field_validator('task_ids')
    @classmethod
    def validate_task_ids(cls, v: List[uuid.UUID]) -> List[uuid.UUID]:
        if not v:
            raise ValidationError("At least one task ID is required")
        return list(set(v))  # Remove duplicates


class BulkOperationResponse(BaseModel):
    """Schema for bulk operation responses"""
    operation: str = Field(..., description="Type of bulk operation performed")
    requested_count: int = Field(..., description="Number of tasks requested for operation")
    affected_count: int = Field(..., description="Number of tasks actually affected")
    success: bool = Field(..., description="Whether operation was fully successful")
    execution_time_ms: Optional[int] = Field(None, description="Execution time in milliseconds")
    failed_ids: List[uuid.UUID] = Field(default_factory=list, description="IDs of tasks that failed")
    warnings: List[str] = Field(default_factory=list, description="Non-critical warnings")
    
    @property
    def partial_success(self) -> bool:
        """Whether operation had partial success"""
        return 0 < self.affected_count < self.requested_count
    
    @property
    def failure_rate(self) -> float:
        """Calculate failure rate as percentage"""
        if self.requested_count == 0:
            return 0.0
        failed_count = self.requested_count - self.affected_count
        return (failed_count / self.requested_count) * 100.0


class BulkOperationSummary(BaseModel):
    """Schema for bulk operation summary/statistics"""
    total_operations: int = Field(default=0, description="Total bulk operations performed")
    total_tasks_affected: int = Field(default=0, description="Total tasks affected across all operations")
    success_rate: float = Field(default=0.0, description="Overall success rate")
    most_common_operation: Optional[str] = Field(None, description="Most frequently used operation")
    avg_execution_time_ms: Optional[float] = Field(None, description="Average execution time")