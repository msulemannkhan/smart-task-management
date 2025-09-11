"""
Task-related helper functions and utilities.
Separates business logic from endpoint handlers.
"""
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime
import uuid

from app.models.database import User, Task, Project, ProjectMember
from app.exceptions.base import PermissionDeniedError, NotFoundError, BusinessLogicError, ValidationError
from app.infrastructure.websocket import manager, TaskEvent
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select, and_

logger = logging.getLogger(__name__)


class TaskPermissionChecker:
    """Handles task permission validation"""
    
    @staticmethod
    async def check_task_access(
        task_id: uuid.UUID,
        user_id: uuid.UUID,
        session: AsyncSession,
        require_ownership: bool = False
    ) -> Task:
        """
        Check if user has access to a task.
        
        Args:
            task_id: Task ID to check
            user_id: User ID requesting access
            session: Database session
            require_ownership: If True, user must be the creator
            
        Returns:
            Task object if access is granted
            
        Raises:
            NotFoundError: If task doesn't exist or user has no access
            PermissionDeniedError: If user lacks required permissions
        """
        from app.repositories.task_repository import TaskRepository
        
        repo = TaskRepository(session)
        task = await repo.get_by_id(task_id, user_id)
        
        if not task:
            raise NotFoundError("Task", str(task_id))
        
        if require_ownership and task.creator_id != user_id:
            raise PermissionDeniedError(
                action="modify task",
                resource=f"Task {task_id}",
                reason="Only task creators can perform this action"
            )
        
        return task
    
    @staticmethod
    async def check_project_access(
        project_id: uuid.UUID,
        user_id: uuid.UUID,
        session: AsyncSession
    ) -> Project:
        """
        Check if user has access to a project.
        
        Args:
            project_id: Project ID to check
            user_id: User ID requesting access
            session: Database session
            
        Returns:
            Project object if access is granted
            
        Raises:
            NotFoundError: If project doesn't exist
            PermissionDeniedError: If user lacks access
        """
        # Allow access if user is the owner OR a member of the project
        owner_stmt = select(Project).where(
            and_(
                Project.id == project_id,
                Project.owner_id == user_id
            )
        )
        owner_result = await session.execute(owner_stmt)
        project = owner_result.scalar_one_or_none()

        if project:
            return project

        # If not owner, check membership
        member_stmt = select(Project).join(ProjectMember, ProjectMember.project_id == Project.id).where(
            and_(
                Project.id == project_id,
                ProjectMember.user_id == user_id
            )
        )
        member_result = await session.execute(member_stmt)
        project = member_result.scalar_one_or_none()

        if project:
            return project

        # Check if project exists at all
        exists_stmt = select(Project).where(Project.id == project_id)
        exists_result = await session.execute(exists_stmt)
        if exists_result.scalar_one_or_none():
            raise PermissionDeniedError(
                action="access project",
                resource=f"Project {project_id}",
                reason="You don't have access to this project"
            )
        else:
            raise NotFoundError("Project", str(project_id))


class TaskValidator:
    """Handles task data validation and business rules"""
    
    @staticmethod
    def validate_task_dates(
        start_date: Optional[datetime],
        due_date: Optional[datetime],
        task_id: Optional[uuid.UUID] = None
    ) -> None:
        """
        Validate task date constraints.
        
        Args:
            start_date: Task start date
            due_date: Task due date
            task_id: Task ID for error context (optional)
            
        Raises:
            BusinessLogicError: If date constraints are violated
        """
        if start_date and due_date:
            if due_date < start_date:
                raise BusinessLogicError(
                    "Due date cannot be before start date",
                    rule="date_consistency"
                )
        
        # Don't allow dates too far in the future (10 years)
        max_future_date = datetime.utcnow().replace(year=datetime.utcnow().year + 10)
        
        if start_date and start_date > max_future_date:
            raise ValidationError("Start date is too far in the future", "start_date")
        
        if due_date and due_date > max_future_date:
            raise ValidationError("Due date is too far in the future", "due_date")
    
    @staticmethod
    def validate_task_hierarchy(
        parent_task_id: Optional[uuid.UUID],
        task_id: Optional[uuid.UUID] = None
    ) -> None:
        """
        Validate task hierarchy rules.
        
        Args:
            parent_task_id: Parent task ID
            task_id: Current task ID (for updates)
            
        Raises:
            BusinessLogicError: If hierarchy rules are violated
        """
        if parent_task_id and task_id and parent_task_id == task_id:
            raise BusinessLogicError(
                "Task cannot be its own parent",
                rule="no_self_parent"
            )
    
    @staticmethod
    async def validate_assignee_access(
        assignee_id: uuid.UUID,
        project_id: uuid.UUID,
        session: AsyncSession
    ) -> None:
        """
        Validate that assignee has access to the project.
        
        Args:
            assignee_id: User ID to assign task to
            project_id: Project ID where task belongs
            session: Database session
            
        Raises:
            ValidationError: If assignee doesn't have project access
        """
        # For now, we'll assume any user can be assigned to any project
        # In a real system, you'd check project membership
        
        # Verify assignee exists
        stmt = select(User).where(User.id == assignee_id)
        result = await session.execute(stmt)
        user = result.scalar_one_or_none()
        
        if not user:
            raise ValidationError(f"Assignee user not found", "assignee_id", assignee_id)
        
        if not user.is_active:
            raise ValidationError("Cannot assign task to inactive user", "assignee_id")
    
    @staticmethod
    def validate_task_completion(
        task: Task,
        completed: bool,
        completed_percentage: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Validate task completion logic and return update data.
        
        Args:
            task: Current task
            completed: New completion status
            completed_percentage: New completion percentage
            
        Returns:
            Dictionary with validated completion data
            
        Raises:
            BusinessLogicError: If completion logic is invalid
        """
        update_data = {}
        
        if completed:
            # Completing task
            if task.completed:
                raise BusinessLogicError(
                    "Task is already completed",
                    rule="no_double_completion"
                )
            
            update_data.update({
                "completed": True,
                "completed_at": datetime.utcnow(),
                "completed_percentage": 100,
                "status": "DONE"
            })
        else:
            # Uncompleting task
            if not task.completed:
                raise BusinessLogicError(
                    "Task is not completed",
                    rule="cannot_uncomplete_incomplete"
                )
            
            update_data.update({
                "completed": False,
                "completed_at": None,
                "completed_percentage": completed_percentage or 0,
                "status": "IN_PROGRESS" if completed_percentage and completed_percentage > 0 else "TODO"
            })
        
        return update_data


class TaskEventBroadcaster:
    """Handles real-time event broadcasting for tasks"""
    
    @staticmethod
    async def broadcast_task_event(
        event_type: str,
        task: Task,
        user_id: uuid.UUID,
        additional_data: Optional[Dict[str, Any]] = None
    ) -> None:
        """
        Broadcast a task event to WebSocket connections.
        
        Args:
            event_type: Type of event (task_created, task_updated, etc.)
            task: Task object
            user_id: User who triggered the event
            additional_data: Additional data to include in event
        """
        try:
            task_data = {
                "title": task.title,
                "status": task.status.value if hasattr(task.status, 'value') else str(task.status),
                "priority": task.priority.value if hasattr(task.priority, 'value') else str(task.priority),
                "completed": task.completed,
                "project_id": str(task.project_id)
            }
            
            if additional_data:
                task_data.update(additional_data)
            
            if task.completed_at:
                task_data["completed_at"] = task.completed_at.isoformat()
            
            event = TaskEvent(
                event_type=event_type,
                task_id=str(task.id),
                user_id=str(user_id),
                task_data=task_data,
                timestamp=datetime.utcnow()
            )
            
            await manager.broadcast_task_event(event, str(task.project_id))
            
            logger.info(
                f"Broadcasted {event_type} for task {task.id}",
                extra={
                    "event_type": event_type,
                    "task_id": str(task.id),
                    "user_id": str(user_id),
                    "project_id": str(task.project_id)
                }
            )
            
        except Exception as e:
            logger.error(
                f"Failed to broadcast {event_type} for task {task.id}: {e}",
                extra={
                    "event_type": event_type,
                    "task_id": str(task.id),
                    "user_id": str(user_id),
                    "error": str(e)
                }
            )
            # Don't raise exception - broadcasting failure shouldn't break the API operation


class TaskAnalyzer:
    """Analyzes task data and provides insights"""
    
    @staticmethod
    async def get_user_task_statistics(
        user_id: uuid.UUID,
        project_id: Optional[uuid.UUID],
        session: Any
    ) -> Dict[str, Any]:
        """
        Get comprehensive task statistics for a user with optimized single query.
        
        Args:
            user_id: User ID
            project_id: Optional project ID filter
            session: Database session
            
        Returns:
            Dictionary with task statistics
        """
        from sqlmodel import select, func, and_, or_, case
        from sqlalchemy import cast, Text
        from app.models.database import Task, TaskStatus
        from datetime import datetime
        
        # Build base query for user's tasks
        base_conditions = [
            or_(Task.creator_id == user_id, Task.assignee_id == user_id),
            Task.is_deleted == False
        ]
        
        if project_id:
            base_conditions.append(Task.project_id == project_id)
        
        # Single optimized query to get all statistics at once
        now = datetime.utcnow()
        
        stats_stmt = select(
            # Total count
            func.count(Task.id).label("total_tasks"),
            # Completed count
            func.sum(case((Task.completed == True, 1), else_=0)).label("completed_count"),
            # Status counts using conditional aggregation (explicit text cast)
            func.sum(case((cast(Task.status, Text) == TaskStatus.TODO.value, 1), else_=0)).label("todo_count"),
            func.sum(case((cast(Task.status, Text) == TaskStatus.IN_PROGRESS.value, 1), else_=0)).label("in_progress_count"),
            func.sum(case((cast(Task.status, Text) == TaskStatus.DONE.value, 1), else_=0)).label("done_count"),
            func.sum(case((cast(Task.status, Text) == TaskStatus.BACKLOG.value, 1), else_=0)).label("backlog_count"),
            # Overdue count
            func.sum(case((and_(Task.due_date < now, Task.completed == False), 1), else_=0)).label("overdue_count")
        ).where(and_(*base_conditions))
        
        result = await session.execute(stats_stmt)
        row = result.first()
        
        if not row or row.total_tasks == 0:
            return {
                "total_tasks": 0,
                "completed_count": 0,
                "in_progress_count": 0,
                "todo_count": 0,
                "backlog_count": 0,
                "overdue_count": 0,
                "completion_rate": 0.0,
                "status_breakdown": {},
                "filters_applied": {
                    "project_id": str(project_id) if project_id else None
                }
            }
        
        # Calculate completion rate
        total_count = row.total_tasks or 0
        completed_count = row.completed_count or 0
        completion_rate = (completed_count / total_count * 100) if total_count > 0 else 0
        
        # Build status breakdown
        status_breakdown = {
            "todo": row.todo_count or 0,
            "in_progress": row.in_progress_count or 0,
            "done": row.done_count or 0,
            "backlog": row.backlog_count or 0
        }
        
        return {
            "total_tasks": total_count,
            "completed_count": completed_count,
            "in_progress_count": row.in_progress_count or 0,
            "todo_count": row.todo_count or 0,
            "backlog_count": row.backlog_count or 0,
            "overdue_count": row.overdue_count or 0,
            "completion_rate": completion_rate,
            "status_breakdown": status_breakdown,
            "filters_applied": {
                "project_id": str(project_id) if project_id else None
            }
        }
    
    @staticmethod
    def calculate_task_metrics(tasks: List[Task]) -> Dict[str, Any]:
        """
        Calculate metrics from a list of tasks.
        
        Args:
            tasks: List of task objects
            
        Returns:
            Dictionary with calculated metrics
        """
        total_tasks = len(tasks)
        if total_tasks == 0:
            return {
                "total": 0,
                "completed": 0,
                "completion_rate": 0.0,
                "average_completion_time": None
            }
        
        completed_tasks = [t for t in tasks if t.completed]
        completion_times = []
        
        for task in completed_tasks:
            if task.created_at and task.completed_at:
                completion_time = (task.completed_at - task.created_at).total_seconds() / 3600  # hours
                completion_times.append(completion_time)
        
        return {
            "total": total_tasks,
            "completed": len(completed_tasks),
            "completion_rate": len(completed_tasks) / total_tasks,
            "average_completion_time": sum(completion_times) / len(completion_times) if completion_times else None
        }
    
    @staticmethod
    def identify_overdue_tasks(tasks: List[Task]) -> List[Task]:
        """
        Identify overdue tasks from a list.
        
        Args:
            tasks: List of task objects
            
        Returns:
            List of overdue tasks
        """
        now = datetime.utcnow()
        return [
            task for task in tasks
            if task.due_date and task.due_date < now and not task.completed
        ]