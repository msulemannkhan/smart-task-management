"""
Task repository with efficient bulk operations.
All bulk operations use single SQL queries for maximum performance.
"""
from sqlmodel import select, update, delete, and_, func
from sqlalchemy import or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import bindparam
from typing import List, Dict, Any, Optional
from datetime import datetime
import uuid
import time

from app.models.database import Task, TaskHistory, BulkOperationLog, TaskStatus, TaskPriority, Project, ProjectMember


class TaskRepository:
    """Repository for task operations with bulk support"""
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    # ==================== SINGLE OPERATIONS ====================
    
    async def create(self, task: Task) -> Task:
        """Create a single task"""
        self.session.add(task)
        await self.session.commit()
        await self.session.refresh(task)
        
        # Add history entry
        history = TaskHistory(
            task_id=task.id,
            user_id=task.creator_id,
            action="created",
            changes_json=f'{{"title": "{task.title}"}}'
        )
        self.session.add(history)
        await self.session.commit()
        
        return task
    
    async def get_by_id(self, task_id: uuid.UUID, user_id: uuid.UUID) -> Optional[Task]:
        """Get a single task by ID with access rules

        Access is granted if:
        - User is the creator or assignee, OR
        - Task belongs to a project where user is owner or member
        """
        # First try by direct ownership/assignment for efficiency
        own_stmt = select(Task).where(
            and_(
                Task.id == task_id,
                or_(Task.creator_id == user_id, Task.assignee_id == user_id),
                Task.is_deleted == False
            )
        )
        own_result = await self.session.execute(own_stmt)
        task = own_result.scalar_one_or_none()
        if task:
            return task

        # Fallback: check project membership access
        project_stmt = (
            select(Task)
            .join(Project, Project.id == Task.project_id)
            .outerjoin(ProjectMember, ProjectMember.project_id == Project.id)
            .where(
                and_(
                    Task.id == task_id,
                    Task.is_deleted == False,
                    or_(
                        Project.owner_id == user_id,
                        ProjectMember.user_id == user_id
                    )
                )
            )
        )
        project_result = await self.session.execute(project_stmt)
        return project_result.scalar_one_or_none()
    
    async def get_user_tasks(
        self,
        user_id: uuid.UUID,
        limit: int = 100,
        offset: int = 0,
        status: Optional[TaskStatus] = None,
        priority: Optional[TaskPriority] = None,
        category_id: Optional[uuid.UUID] = None
    ) -> List[Task]:
        """Get user tasks with filtering"""
        stmt = select(Task).where(
            and_(
                or_(Task.creator_id == user_id, Task.assignee_id == user_id),
                Task.is_deleted == False
            )
        )
        
        if status:
            stmt = stmt.where(Task.status == status)
        if priority:
            stmt = stmt.where(Task.priority == priority)
        if category_id:
            stmt = stmt.where(Task.category_id == category_id)
        
        stmt = stmt.order_by(Task.created_at.desc()).limit(limit).offset(offset)
        
        result = await self.session.execute(stmt)
        return result.scalars().all()
    
    async def update(self, task_id: uuid.UUID, update_data: Dict[str, Any], user_id: uuid.UUID) -> Task:
        """Update a single task"""
        # Handle tags conversion
        tags_data = update_data.pop("tags", None)
        if tags_data is not None:
            import json
            update_data["tags_json"] = json.dumps(tags_data) if tags_data else None

        # Add updated_at timestamp
        update_data["updated_at"] = datetime.utcnow()

        # Build and execute update statement with access control
        stmt = (
            update(Task)
            .where(
                and_(
                    Task.id == task_id,
                    or_(Task.creator_id == user_id, Task.assignee_id == user_id),
                    Task.is_deleted == False
                )
            )
            .values(**update_data)
        )
        
        result = await self.session.execute(stmt)
        if result.rowcount == 0:
            raise ValueError(f"Task {task_id} not found or access denied")
        
        # Add history entry
        import json
        history = TaskHistory(
            task_id=task_id,
            user_id=user_id,
            action="updated",
            changes_json=json.dumps(update_data, default=str)
        )
        self.session.add(history)
        
        await self.session.commit()
        
        # Get and return updated task
        updated_task = await self.get_by_id(task_id, user_id)
        return updated_task
    
    async def delete(self, task_id: uuid.UUID, user_id: uuid.UUID, hard_delete: bool = False) -> None:
        """Delete a single task"""
        if hard_delete:
            # Permanent deletion
            stmt = (
                delete(Task)
                .where(
                    and_(
                        Task.id == task_id,
                        or_(Task.creator_id == user_id, Task.assignee_id == user_id)
                    )
                )
            )
            result = await self.session.execute(stmt)
            if result.rowcount == 0:
                raise ValueError(f"Task {task_id} not found or access denied")
        else:
            # Soft delete
            update_data = {
                "is_deleted": True,
                "deleted_at": datetime.utcnow()
            }
            await self.update(task_id, update_data, user_id)
        
        # Add history entry
        import json
        history = TaskHistory(
            task_id=task_id,
            user_id=user_id,
            action="deleted",
            changes_json=json.dumps({"hard_delete": hard_delete})
        )
        self.session.add(history)
        
        await self.session.commit()
    
    # ==================== BULK OPERATIONS ====================
    
    async def bulk_create(self, tasks: List[Task]) -> List[Task]:
        """
        Create multiple tasks efficiently.
        Uses add_all for batch insert.
        """
        start_time = time.time()
        
        # Add all tasks in one operation
        self.session.add_all(tasks)
        await self.session.commit()
        
        # Refresh all tasks to get generated IDs
        for task in tasks:
            await self.session.refresh(task)
        
        # Create history entries
        history_entries = [
            TaskHistory(
                task_id=task.id,
                user_id=task.creator_id,
                action="created",
                changes_json=f'{{"title": "{task.title}"}}'
            )
            for task in tasks
        ]
        self.session.add_all(history_entries)
        
        # Log bulk operation
        execution_time = int((time.time() - start_time) * 1000)
        log_entry = BulkOperationLog(
            user_id=tasks[0].creator_id if tasks else None,
            operation_type="bulk_create",
            requested_count=len(tasks),
            affected_count=len(tasks),
            success_count=len(tasks),
            error_count=0,
            task_ids_json=f'[{",".join([str(task.id) for task in tasks])}]',
            execution_time_ms=execution_time,
            database_queries=1,
            success=True
        )
        self.session.add(log_entry)
        
        await self.session.commit()
        return tasks
    
    async def bulk_update(
        self,
        task_ids: List[uuid.UUID],
        update_data: Dict[str, Any],
        user_id: uuid.UUID
    ) -> int:
        """
        Efficiently update multiple tasks with a single query.
        Returns the number of rows updated.
        """
        start_time = time.time()

        # Handle tags conversion
        tags_data = update_data.pop("tags", None)
        if tags_data is not None:
            import json
            update_data["tags_json"] = json.dumps(tags_data) if tags_data else None

        # Add updated_at timestamp
        update_data["updated_at"] = datetime.utcnow()
        
        # Build and execute update statement
        stmt = (
            update(Task)
            .where(
                and_(
                    or_(Task.creator_id == user_id, Task.assignee_id == user_id),
                    Task.id.in_(task_ids),
                    Task.is_deleted == False
                )
            )
            .values(**update_data)
        )
        
        result = await self.session.execute(stmt)
        affected_count = result.rowcount
        
        # Add bulk history entry
        if affected_count > 0:
            import json
            history = TaskHistory(
                task_id=task_ids[0],  # Reference first task
                user_id=user_id,
                action="bulk_update",
                changes_json=json.dumps({
                    "update_data": update_data,
                    "affected_ids": [str(id) for id in task_ids],
                    "affected_count": affected_count
                }, default=str)
            )
            self.session.add(history)
        
        # Log bulk operation
        execution_time = int((time.time() - start_time) * 1000)
        log_entry = BulkOperationLog(
            user_id=user_id,
            operation_type="bulk_update",
            requested_count=len(task_ids),
            affected_count=affected_count,
            success_count=affected_count,
            error_count=len(task_ids) - affected_count,
            task_ids_json=f'[{",".join([str(id) for id in task_ids])}]',
            execution_time_ms=execution_time,
            database_queries=1,
            success=True
        )
        self.session.add(log_entry)
        
        await self.session.commit()
        return affected_count
    
    async def bulk_complete(
        self,
        task_ids: List[uuid.UUID],
        user_id: uuid.UUID,
        completed: bool = True
    ) -> int:
        """
        Mark multiple tasks as complete/incomplete efficiently.
        """
        now = datetime.utcnow()
        values = {
            "completed": completed,
            "status": TaskStatus.DONE if completed else TaskStatus.TODO,
            "updated_at": now,
        }
        
        if completed:
            values["completed_at"] = now
        else:
            values["completed_at"] = None
        
        return await self.bulk_update(task_ids, values, user_id)
    
    async def bulk_delete(
        self,
        task_ids: List[uuid.UUID],
        user_id: uuid.UUID,
        hard_delete: bool = False
    ) -> int:
        """
        Delete multiple tasks efficiently.
        Supports both soft and hard delete.
        """
        start_time = time.time()
        
        if hard_delete:
            # Permanent deletion
            stmt = (
                delete(Task)
                .where(
                    and_(
                        or_(Task.creator_id == user_id, Task.assignee_id == user_id),
                        Task.id.in_(task_ids)
                    )
                )
            )
            result = await self.session.execute(stmt)
            affected_count = result.rowcount
        else:
            # Soft delete
            affected_count = await self.bulk_update(
                task_ids,
                {
                    "is_deleted": True,
                    "deleted_at": datetime.utcnow()
                },
                user_id
            )
        
        # Log bulk operation
        execution_time = int((time.time() - start_time) * 1000)
        log_entry = BulkOperationLog(
            user_id=user_id,
            operation_type="bulk_delete",
            requested_count=len(task_ids),
            affected_count=affected_count,
            success_count=affected_count,
            error_count=len(task_ids) - affected_count,
            task_ids_json=f'[{",".join([str(id) for id in task_ids])}]',
            execution_time_ms=execution_time,
            database_queries=1,
            success=True
        )
        self.session.add(log_entry)
        
        await self.session.commit()
        return affected_count
    
    async def bulk_change_status(
        self,
        task_ids: List[uuid.UUID],
        user_id: uuid.UUID,
        new_status: TaskStatus
    ) -> int:
        """Change status for multiple tasks"""
        return await self.bulk_update(
            task_ids,
            {"status": new_status},
            user_id
        )
    
    async def bulk_change_priority(
        self,
        task_ids: List[uuid.UUID],
        user_id: uuid.UUID,
        new_priority: TaskPriority
    ) -> int:
        """Change priority for multiple tasks"""
        return await self.bulk_update(
            task_ids,
            {"priority": new_priority},
            user_id
        )
    
    async def bulk_assign_category(
        self,
        task_ids: List[uuid.UUID],
        user_id: uuid.UUID,
        category_id: Optional[uuid.UUID]
    ) -> int:
        """Assign category to multiple tasks"""
        return await self.bulk_update(
            task_ids,
            {"category_id": category_id},
            user_id
        )
    
    # ==================== ANALYTICS ====================
    
    async def get_task_stats(self, user_id: uuid.UUID) -> Dict[str, Any]:
        """Get task statistics for a user"""
        from sqlalchemy import Integer
        
        stmt = select(
            func.count(Task.id).label("total"),
            func.sum(func.cast(Task.completed, Integer)).label("completed"),
            func.sum(func.cast(Task.status == TaskStatus.IN_PROGRESS, Integer)).label("in_progress"),
        ).where(
            and_(
                or_(Task.creator_id == user_id, Task.assignee_id == user_id),
                Task.is_deleted == False
            )
        )
        
        result = await self.session.execute(stmt)
        stats = result.first()
        
        return {
            "total": stats.total or 0,
            "completed": stats.completed or 0,
            "in_progress": stats.in_progress or 0,
            "todo": (stats.total or 0) - (stats.completed or 0) - (stats.in_progress or 0)
        }
    
    async def list_with_filters(
        self,
        user_id: uuid.UUID,
        project_id: Optional[uuid.UUID] = None,
        filters: Optional[Dict[str, Any]] = None
    ) -> tuple[List[Task], int]:
        """List tasks with filters and pagination - matches API endpoint expectation"""
        if filters is None:
            filters = {}
        
        # Build base query depending on project scope
        if project_id:
            # User can view all tasks in project if owner or member
            # Use group_by to ensure unique tasks when user has multiple relationships
            stmt = (
                select(Task)
                .join(Project, Project.id == Task.project_id)
                .outerjoin(ProjectMember, ProjectMember.project_id == Project.id)
                .where(
                    and_(
                        Task.project_id == project_id,
                        Task.is_deleted == False,
                        or_(
                            Project.owner_id == user_id,
                            ProjectMember.user_id == user_id
                        )
                    )
                )
                .group_by(Task.id)
            )
        else:
            # No project filter: show tasks from all projects where user is a member, or tasks they created/assigned
            # Use group_by to ensure unique tasks when user has multiple relationships
            stmt = (
                select(Task)
                .outerjoin(Project, Project.id == Task.project_id)
                .outerjoin(ProjectMember, ProjectMember.project_id == Project.id)
                .where(
                    and_(
                        Task.is_deleted == False,
                        or_(
                            Task.creator_id == user_id,
                            Task.assignee_id == user_id,
                            Project.owner_id == user_id,
                            ProjectMember.user_id == user_id
                        )
                    )
                )
                .group_by(Task.id)
            )
        
        # Apply filters
        if filters.get('status'):
            if isinstance(filters['status'], list):
                stmt = stmt.where(Task.status.in_(filters['status']))
            else:
                stmt = stmt.where(Task.status == filters['status'])
        
        if filters.get('priority'):
            if isinstance(filters['priority'], list):
                stmt = stmt.where(Task.priority.in_(filters['priority']))
            else:
                stmt = stmt.where(Task.priority == filters['priority'])
        
        if filters.get('category_id'):
            stmt = stmt.where(Task.category_id == filters['category_id'])
        
        if filters.get('assignee_id'):
            stmt = stmt.where(Task.assignee_id == filters['assignee_id'])
        
        # Count total before pagination
        count_stmt = select(func.count()).select_from(stmt.subquery())
        count_result = await self.session.execute(count_stmt)
        total = count_result.scalar() or 0
        
        # Apply pagination
        limit = filters.get('limit', 50)
        offset = filters.get('offset', 0)
        stmt = stmt.limit(limit).offset(offset)
        
        # Apply ordering
        stmt = stmt.order_by(Task.created_at.desc())
        
        # Execute query
        result = await self.session.execute(stmt)
        tasks = result.scalars().all()
        
        return list(tasks), total
    
    async def search(
        self,
        user_id: uuid.UUID,
        search_params: Dict[str, Any]
    ) -> tuple[List[Task], int]:
        """Advanced search for tasks with multiple criteria"""
        # For now, delegate to list_with_filters since search functionality overlaps
        return await self.list_with_filters(
            user_id=user_id,
            project_id=search_params.get('project_id'),
            filters=search_params
        )