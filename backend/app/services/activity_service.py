"""Service for logging user activities"""
from typing import Optional, Dict, Any
from uuid import UUID
from app.models.database import ActivityActionType
from app.repositories.activity_repository import ActivityRepository
import logging

logger = logging.getLogger(__name__)


class ActivityService:
    """Service for managing activity logging"""
    
    def __init__(self, activity_repo: ActivityRepository):
        self.activity_repo = activity_repo
    
    async def log_task_created(
        self,
        user_id: UUID,
        task_id: UUID,
        task_title: str,
        project_id: Optional[UUID] = None,
        project_name: Optional[str] = None,
        user_name: Optional[str] = None
    ):
        """Log task creation activity"""
        description = f"Created a new task: \"{task_title}\""
        if project_name:
            description = f"Added \"{task_title}\" to {project_name}"
        
        await self.activity_repo.create(
            user_id=user_id,
            action_type=ActivityActionType.TASK_CREATED,
            entity_type="task",
            entity_id=task_id,
            entity_name=task_title,
            description=description,
            project_id=project_id
        )
    
    async def log_task_completed(
        self,
        user_id: UUID,
        task_id: UUID,
        task_title: str,
        project_id: Optional[UUID] = None,
        user_name: Optional[str] = None
    ):
        """Log task completion activity"""
        await self.activity_repo.create(
            user_id=user_id,
            action_type=ActivityActionType.TASK_COMPLETED,
            entity_type="task",
            entity_id=task_id,
            entity_name=task_title,
            description=f"{user_name or 'User'} completed task '{task_title}'",
            project_id=project_id
        )
    
    async def log_task_updated(
        self,
        user_id: UUID,
        task_id: UUID,
        task_title: str,
        update_type: str,
        project_id: Optional[UUID] = None,
        user_name: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ):
        """Log task update activity"""
        await self.activity_repo.create(
            user_id=user_id,
            action_type=ActivityActionType.TASK_UPDATED,
            entity_type="task",
            entity_id=task_id,
            entity_name=task_title,
            description=f"{user_name or 'User'} updated {update_type} for task '{task_title}'",
            project_id=project_id,
            metadata=metadata
        )
    
    async def log_project_member_added(
        self,
        user_id: UUID,
        project_id: UUID,
        project_name: str,
        target_user_id: UUID,
        target_user_name: str,
        added_by_name: Optional[str] = None
    ):
        """Log adding member to project"""
        await self.activity_repo.create(
            user_id=user_id,
            action_type=ActivityActionType.PROJECT_MEMBER_ADDED,
            entity_type="project",
            entity_id=project_id,
            entity_name=project_name,
            description=f"Added {target_user_name} to the project '{project_name}'",
            target_user_id=target_user_id,
            project_id=project_id
        )
    
    async def log_project_member_removed(
        self,
        user_id: UUID,
        project_id: UUID,
        project_name: str,
        target_user_id: UUID,
        target_user_name: str,
        removed_by_name: Optional[str] = None
    ):
        """Log removing member from project"""
        await self.activity_repo.create(
            user_id=user_id,
            action_type=ActivityActionType.PROJECT_MEMBER_REMOVED,
            entity_type="project",
            entity_id=project_id,
            entity_name=project_name,
            description=f"Removed {target_user_name} from the project '{project_name}'",
            target_user_id=target_user_id,
            project_id=project_id
        )
    
    async def log_task_assigned(
        self,
        user_id: UUID,
        task_id: UUID,
        task_title: str,
        assignee_id: UUID,
        assignee_name: str,
        project_id: Optional[UUID] = None,
        user_name: Optional[str] = None
    ):
        """Log task assignment"""
        await self.activity_repo.create(
            user_id=user_id,
            action_type=ActivityActionType.TASK_ASSIGNED,
            entity_type="task",
            entity_id=task_id,
            entity_name=task_title,
            description=f"Assigned the task '{task_title}' to {assignee_name}",
            target_user_id=assignee_id,
            project_id=project_id
        )
    
    async def log_status_changed(
        self,
        user_id: UUID,
        task_id: UUID,
        task_title: str,
        old_status: str,
        new_status: str,
        project_id: Optional[UUID] = None,
        user_name: Optional[str] = None
    ):
        """Log task status change"""
        await self.activity_repo.create(
            user_id=user_id,
            action_type=ActivityActionType.STATUS_CHANGED,
            entity_type="task",
            entity_id=task_id,
            entity_name=task_title,
            description=f"Changed the status of '{task_title}' from '{old_status}' to '{new_status}'",
            project_id=project_id,
            metadata={"old_status": old_status, "new_status": new_status}
        )
    
    async def log_priority_changed(
        self,
        user_id: UUID,
        task_id: UUID,
        task_title: str,
        old_priority: str,
        new_priority: str,
        project_id: Optional[UUID] = None,
        user_name: Optional[str] = None
    ):
        """Log task priority change"""
        await self.activity_repo.create(
            user_id=user_id,
            action_type=ActivityActionType.PRIORITY_CHANGED,
            entity_type="task",
            entity_id=task_id,
            entity_name=task_title,
            description=f"Changed the priority of '{task_title}' from '{old_priority}' to '{new_priority}'",
            project_id=project_id,
            metadata={"old_priority": old_priority, "new_priority": new_priority}
        )
    
    async def log_due_date_changed(
        self,
        user_id: UUID,
        task_id: UUID,
        task_title: str,
        old_date: Optional[str],
        new_date: Optional[str],
        project_id: Optional[UUID] = None,
        user_name: Optional[str] = None
    ):
        """Log task due date change"""
        if old_date and new_date:
            description = f"Changed the due date of '{task_title}' from {old_date} to {new_date}"
        elif new_date:
            description = f"Set the due date of '{task_title}' to {new_date}"
        else:
            description = f"Removed the due date from '{task_title}'"
        
        await self.activity_repo.create(
            user_id=user_id,
            action_type=ActivityActionType.DUE_DATE_CHANGED,
            entity_type="task",
            entity_id=task_id,
            entity_name=task_title,
            description=description,
            project_id=project_id,
            metadata={"old_date": old_date, "new_date": new_date}
        )
    
    async def log_comment_added(
        self,
        user_id: UUID,
        task_id: UUID,
        task_title: str,
        comment_text: str,
        project_id: Optional[UUID] = None,
        user_name: Optional[str] = None
    ):
        """Log comment addition"""
        await self.activity_repo.create(
            user_id=user_id,
            action_type=ActivityActionType.COMMENT_ADDED,
            entity_type="task",
            entity_id=task_id,
            entity_name=task_title,
            description=f"Commented on the task '{task_title}'",
            project_id=project_id,
            metadata={"comment_preview": comment_text[:100] if comment_text else None}
        )
    
    async def log_project_created(
        self,
        user_id: UUID,
        project_id: UUID,
        project_name: str,
        user_name: Optional[str] = None
    ):
        """Log project creation"""
        await self.activity_repo.create(
            user_id=user_id,
            action_type=ActivityActionType.PROJECT_CREATED,
            entity_type="project",
            entity_id=project_id,
            entity_name=project_name,
            description=f"Created the project '{project_name}'",
            project_id=project_id
        )
    
    async def log_project_updated(
        self,
        user_id: UUID,
        project_id: UUID,
        project_name: str,
        update_type: str,
        user_name: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ):
        """Log project update"""
        await self.activity_repo.create(
            user_id=user_id,
            action_type=ActivityActionType.PROJECT_UPDATED,
            entity_type="project",
            entity_id=project_id,
            entity_name=project_name,
            description=f"Updated the {update_type} for the project '{project_name}'",
            project_id=project_id,
            metadata=metadata
        )
    
    async def log_task_deleted(
        self,
        user_id: UUID,
        task_id: UUID,
        task_title: str,
        project_id: Optional[UUID] = None,
        user_name: Optional[str] = None
    ):
        """Log task deletion"""
        await self.activity_repo.create(
            user_id=user_id,
            action_type=ActivityActionType.TASK_DELETED,
            entity_type="task",
            entity_id=task_id,
            entity_name=task_title,
            description=f"Deleted the task '{task_title}'",
            project_id=project_id
        )