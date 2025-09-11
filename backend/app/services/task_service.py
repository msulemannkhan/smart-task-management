"""
Task service layer for business logic.
Handles task operations and enforces business rules.
"""
from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.task_repository import TaskRepository
from app.models.database import Task, User, TaskStatus, TaskPriority
import uuid
from datetime import datetime

class TaskService:
    """Service layer for task business logic"""
    
    def __init__(self, session: AsyncSession):
        self.session = session
        self.repository = TaskRepository(session)
    
    async def create_task(
        self,
        title: str,
        user_id: uuid.UUID,
        project_id: uuid.UUID,
        description: Optional[str] = None,
        category_id: Optional[uuid.UUID] = None,
        assignee_id: Optional[uuid.UUID] = None,
        priority: TaskPriority = TaskPriority.MEDIUM,
        due_date: Optional[datetime] = None
    ) -> Task:
        """Create a new task with business logic validation"""
        
        # Business rule: If no assignee specified, assign to creator
        if not assignee_id:
            assignee_id = user_id
        
        # Create task entity
        task = Task(
            title=title.strip(),
            description=description,
            project_id=project_id,
            category_id=category_id,
            creator_id=user_id,
            assignee_id=assignee_id,
            status=TaskStatus.TODO,
            priority=priority,
            due_date=due_date,
            completed=False
        )
        
        return await self.repository.create(task)
    
    async def get_user_tasks(
        self,
        user_id: uuid.UUID,
        filters: Optional[Dict[str, Any]] = None
    ) -> List[Task]:
        """Get tasks for a user with optional filtering"""
        
        if not filters:
            filters = {}
        
        return await self.repository.get_user_tasks(
            user_id=user_id,
            limit=filters.get('limit', 50),
            offset=filters.get('offset', 0),
            status=filters.get('status'),
            priority=filters.get('priority'),
            category_id=filters.get('category_id')
        )
    
    async def complete_task(
        self,
        task_id: uuid.UUID,
        user_id: uuid.UUID
    ) -> bool:
        """Complete a single task with business logic"""
        
        # Verify user has access to the task
        task = await self.repository.get_by_id(task_id, user_id)
        if not task:
            return False
        
        # Business rule: Can only complete TODO or IN_PROGRESS tasks
        if task.status == TaskStatus.DONE:
            return False  # Already completed
        
        result = await self.repository.bulk_complete([task_id], user_id, True)
        return result > 0
    
    async def bulk_complete_tasks(
        self,
        task_ids: List[uuid.UUID],
        user_id: uuid.UUID,
        completed: bool = True
    ) -> Dict[str, Any]:
        """Bulk complete/uncomplete tasks with business validation"""
        
        # Validate all tasks exist and user has access
        accessible_tasks = []
        for task_id in task_ids:
            task = await self.repository.get_by_id(task_id, user_id)
            if task:
                accessible_tasks.append(task_id)
        
        if not accessible_tasks:
            return {
                "requested_count": len(task_ids),
                "affected_count": 0,
                "success": False,
                "message": "No accessible tasks found"
            }
        
        affected_count = await self.repository.bulk_complete(
            accessible_tasks, user_id, completed
        )
        
        return {
            "requested_count": len(task_ids),
            "affected_count": affected_count,
            "success": affected_count > 0,
            "message": f"{'Completed' if completed else 'Uncompleted'} {affected_count} tasks"
        }
    
    async def bulk_update_tasks(
        self,
        task_ids: List[uuid.UUID],
        user_id: uuid.UUID,
        update_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Bulk update tasks with business validation"""
        
        # Validate update data
        allowed_fields = {
            'title', 'description', 'status', 'priority', 
            'category_id', 'assignee_id', 'due_date'
        }
        
        filtered_data = {
            k: v for k, v in update_data.items() 
            if k in allowed_fields
        }
        
        if not filtered_data:
            return {
                "requested_count": len(task_ids),
                "affected_count": 0,
                "success": False,
                "message": "No valid fields to update"
            }
        
        affected_count = await self.repository.bulk_update(
            task_ids, filtered_data, user_id
        )
        
        return {
            "requested_count": len(task_ids),
            "affected_count": affected_count,
            "success": affected_count > 0,
            "message": f"Updated {affected_count} tasks"
        }
    
    async def get_task_statistics(self, user_id: uuid.UUID) -> Dict[str, Any]:
        """Get comprehensive task statistics"""
        
        stats = await self.repository.get_task_stats(user_id)
        
        # Add calculated fields
        total = stats.get('total', 0)
        completed = stats.get('completed', 0)
        
        completion_rate = (completed / total * 100) if total > 0 else 0
        
        return {
            **stats,
            "completion_rate": round(completion_rate, 1),
            "remaining": total - completed
        }
    
    async def assign_task(
        self,
        task_id: uuid.UUID,
        assignee_id: uuid.UUID,
        user_id: uuid.UUID
    ) -> bool:
        """Assign a task to a different user"""
        
        # Business rule: Only task creator can reassign tasks
        task = await self.repository.get_by_id(task_id, user_id)
        if not task or task.creator_id != user_id:
            return False
        
        result = await self.repository.bulk_update(
            [task_id],
            {"assignee_id": assignee_id},
            user_id
        )
        
        return result > 0