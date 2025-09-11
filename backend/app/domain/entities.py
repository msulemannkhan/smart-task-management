"""
Domain entities for business logic.
These represent the core business concepts.
"""
from dataclasses import dataclass
from datetime import datetime
from typing import Optional, List
from enum import Enum
import uuid

class TaskStatus(str, Enum):
    """Task status enumeration"""
    BACKLOG = "backlog"
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    IN_REVIEW = "in_review"
    BLOCKED = "blocked"
    DONE = "done"
    CANCELLED = "cancelled"

class TaskPriority(str, Enum):
    """Task priority levels"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"
    CRITICAL = "critical"

@dataclass
class TaskEntity:
    """Domain entity for Task business logic"""
    id: uuid.UUID
    title: str
    description: Optional[str]
    status: TaskStatus
    priority: TaskPriority
    creator_id: uuid.UUID
    assignee_id: Optional[uuid.UUID]
    project_id: uuid.UUID
    category_id: Optional[uuid.UUID]
    parent_task_id: Optional[uuid.UUID]
    due_date: Optional[datetime]
    completed: bool
    completed_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    
    def can_be_completed(self) -> bool:
        """Check if task can be marked as completed"""
        return self.status in [TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.IN_REVIEW]
    
    def complete(self) -> None:
        """Mark task as completed"""
        if not self.can_be_completed():
            raise ValueError(f"Cannot complete task with status: {self.status}")
        
        self.completed = True
        self.completed_at = datetime.utcnow()
        self.status = TaskStatus.DONE
        self.updated_at = datetime.utcnow()
    
    def uncomplete(self) -> None:
        """Mark task as incomplete"""
        if not self.completed:
            return  # Already incomplete
        
        self.completed = False
        self.completed_at = None
        self.status = TaskStatus.TODO
        self.updated_at = datetime.utcnow()
    
    def assign_to(self, assignee_id: uuid.UUID) -> None:
        """Assign task to a user"""
        self.assignee_id = assignee_id
        self.updated_at = datetime.utcnow()
    
    def change_priority(self, new_priority: TaskPriority) -> None:
        """Change task priority"""
        self.priority = new_priority
        self.updated_at = datetime.utcnow()
    
    def change_status(self, new_status: TaskStatus) -> None:
        """Change task status with business rules"""
        # Business rule: Can't go directly from TODO to DONE
        if self.status == TaskStatus.TODO and new_status == TaskStatus.DONE:
            # Automatically set to IN_PROGRESS first
            self.status = TaskStatus.IN_PROGRESS
        else:
            self.status = new_status
        
        # Update completion status based on new status
        if new_status == TaskStatus.DONE and not self.completed:
            self.complete()
        elif new_status != TaskStatus.DONE and self.completed:
            self.uncomplete()
        
        self.updated_at = datetime.utcnow()
    
    def is_overdue(self) -> bool:
        """Check if task is overdue"""
        if not self.due_date or self.completed:
            return False
        
        return datetime.utcnow() > self.due_date
    
    def days_until_due(self) -> Optional[int]:
        """Calculate days until due date"""
        if not self.due_date:
            return None
        
        delta = self.due_date - datetime.utcnow()
        return delta.days

@dataclass
class UserEntity:
    """Domain entity for User business logic"""
    id: uuid.UUID
    email: str
    username: str
    full_name: Optional[str]
    is_active: bool
    created_at: datetime
    
    def can_manage_task(self, task: TaskEntity) -> bool:
        """Check if user can manage a specific task"""
        return task.creator_id == self.id or task.assignee_id == self.id
    
    def can_reassign_task(self, task: TaskEntity) -> bool:
        """Check if user can reassign a task"""
        return task.creator_id == self.id  # Only creator can reassign

@dataclass
class ProjectEntity:
    """Domain entity for Project business logic"""
    id: uuid.UUID
    name: str
    description: Optional[str]
    organization_id: uuid.UUID
    owner_id: uuid.UUID
    created_at: datetime
    
    def is_owned_by(self, user_id: uuid.UUID) -> bool:
        """Check if project is owned by user"""
        return self.owner_id == user_id