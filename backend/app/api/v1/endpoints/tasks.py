"""
Task management endpoints using clean architecture.
CRUD operations for individual tasks with proper separation of concerns.
"""
from fastapi import APIRouter, status, Depends, Query
from typing import Optional, List
import uuid
import logging
from datetime import datetime

from app.schemas.task import (
    TaskCreateRequest,
    TaskUpdateRequest, 
    TaskResponse,
    TaskListResponse,
    TaskStatsResponse,
    TaskSearchRequest
)
from app.utils.task_helpers import (
    TaskPermissionChecker,
    TaskValidator,
    TaskEventBroadcaster,
    TaskAnalyzer
)
from app.core.auth import CurrentUser
from app.core.database import get_session
from app.repositories.task_repository import TaskRepository
from app.models.database import User, TaskStatus, TaskPriority, TaskComment, ActivityType
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from pydantic import BaseModel

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    request: TaskCreateRequest,
    current_user: User = CurrentUser,
    session: AsyncSession = Depends(get_session)
):
    """
    Create a new task with comprehensive validation.
    
    - **title**: Task title (1-500 chars, cannot be empty)
    - **description**: Optional task description
    - **project_id**: Valid project ID that user owns
    - **category_id**: Optional category ID
    - **assignee_id**: Optional assignee user ID
    - **status**: Task status (defaults to TODO)
    - **priority**: Task priority (defaults to MEDIUM)
    - **dates**: Optional start and due dates with validation
    - **tags**: Optional tags (max 10, duplicates removed)
    
    Returns the created task with metadata.
    """
    logger.info(f"Creating task for user {current_user.id}: {request.title}")
    
    # Use helper for permission checking only if project_id is provided
    if request.project_id:
        await TaskPermissionChecker.check_project_access(
            request.project_id, current_user.id, session
        )
    
    # Use validator for business rules
    TaskValidator.validate_task_dates(request.start_date, request.due_date)
    
    # Create task through repository
    repo = TaskRepository(session)
    task_data = request.dict()
    task_data["creator_id"] = current_user.id
    
    # Create Task model instance from data
    from app.models.database import Task
    task = Task(**task_data)
    
    created_task = await repo.create(task)
    
    # Use broadcaster for events
    await TaskEventBroadcaster.broadcast_task_event(
        "task_created", created_task, current_user.id
    )
    
    logger.info(f"Task created successfully: {created_task.id}")
    return TaskResponse.from_task(created_task)


@router.get("/", response_model=TaskListResponse)
async def list_tasks(
    project_id: Optional[str] = Query(None, description="Filter by project"),
    status: Optional[TaskStatus] = Query(None, description="Filter by status"),
    priority: Optional[TaskPriority] = Query(None, description="Filter by priority"),
    assignee_id: Optional[str] = Query(None, description="Filter by assignee"),
    category_id: Optional[str] = Query(None, description="Filter by category"),
    limit: int = Query(50, ge=1, le=100, description="Results per page"),
    per_page: Optional[int] = Query(None, ge=1, le=100, description="Results per page (alias for limit)"),
    offset: int = Query(0, ge=0, description="Results offset"),
    current_user: User = CurrentUser,
    session: AsyncSession = Depends(get_session)
):
    """
    List tasks with comprehensive filtering and pagination.
    
    Returns paginated task list with filtering options.
    """
    logger.info(f"Listing tasks for user {current_user.id}")
    
    # Safely convert string UUIDs to UUID objects, handle empty strings
    def safe_uuid_convert(value: Optional[str]) -> Optional[uuid.UUID]:
        if not value or value.strip() == "":
            return None
        try:
            return uuid.UUID(value.strip())
        except ValueError:
            return None
    
    project_uuid = safe_uuid_convert(project_id)
    assignee_uuid = safe_uuid_convert(assignee_id)
    category_uuid = safe_uuid_convert(category_id)
    
    # Build search request - prioritize per_page over limit
    effective_limit = per_page if per_page is not None else limit
    search_request = TaskSearchRequest(
        project_id=str(project_uuid) if project_uuid else None,
        status=[status] if status else None,
        priority=[priority] if priority else None,
        assignee_id=str(assignee_uuid) if assignee_uuid else None,
        category_id=str(category_uuid) if category_uuid else None,
        limit=effective_limit,
        offset=offset
    )
    
    # Get tasks through repository
    repo = TaskRepository(session)
    tasks, total = await repo.list_with_filters(
        user_id=current_user.id,
        project_id=project_uuid,
        filters=search_request.dict(exclude_unset=True)
    )
    
    # Build response
    task_responses = [TaskResponse.from_task(task) for task in tasks]
    
    logger.info(f"Listed {len(task_responses)}/{total} tasks for user {current_user.id}")
    return TaskListResponse(
        tasks=task_responses,
        total=total,
        limit=effective_limit,
        offset=offset,
        has_more=offset + len(task_responses) < total
    )


@router.get("/search", response_model=TaskListResponse)
async def search_tasks(
    request: TaskSearchRequest = Depends(),
    current_user: User = CurrentUser,
    session: AsyncSession = Depends(get_session)
):
    """
    Advanced task search with multiple criteria.
    
    Supports full-text search, status/priority filtering, date ranges, and more.
    """
    logger.info(f"Searching tasks for user {current_user.id} with query: {request.query}")
    
    # Use repository for advanced search
    repo = TaskRepository(session)
    tasks, total = await repo.search(
        user_id=current_user.id,
        search_params=request.dict(exclude_unset=True)
    )
    
    # Build response
    task_responses = [TaskResponse.from_task(task) for task in tasks]
    
    logger.info(f"Found {len(task_responses)}/{total} tasks for search query")
    return TaskListResponse(
        tasks=task_responses,
        total=total,
        limit=request.limit,
        offset=request.offset,
        has_more=request.offset + len(task_responses) < total,
        filters_applied=request.dict(exclude_unset=True),
        sort_by=request.sort_by,
        sort_order=request.sort_order
    )


@router.get("/stats", response_model=TaskStatsResponse)
async def get_task_stats(
    project_id: Optional[uuid.UUID] = Query(None, description="Stats for specific project"),
    current_user: User = CurrentUser,
    session: AsyncSession = Depends(get_session)
):
    """
    Get comprehensive task statistics.
    
    Returns task counts, completion metrics, and analytics.
    """
    logger.info(f"Getting task stats for user {current_user.id}")
    
    # Use analyzer for statistics
    raw_stats = await TaskAnalyzer.get_user_task_statistics(
        user_id=current_user.id,
        project_id=project_id,
        session=session
    )

    # Map analyzer keys to response schema to avoid 422 validation errors
    mapped = {
        "total": raw_stats.get("total_tasks", 0),
        "completed": raw_stats.get("completed_count", 0),
        "in_progress": raw_stats.get("in_progress_count", 0),
        "todo": raw_stats.get("todo_count", 0),
        "overdue": raw_stats.get("overdue_count", 0),
        "priority_breakdown": {},
        # Backend analyzer returns percentage (0-100). Response expects 0-1.
        "completion_rate": (raw_stats.get("completion_rate", 0.0) / 100.0) if raw_stats.get("completion_rate") else 0.0,
        "average_completion_time": None,
        "created_today": 0,
        "completed_today": 0,
        "due_this_week": 0,
    }
    
    logger.info(f"Task stats retrieved for user {current_user.id}")
    return TaskStatsResponse(**mapped)


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(
    task_id: uuid.UUID,
    current_user: User = CurrentUser,
    session: AsyncSession = Depends(get_session)
):
    """
    Get a specific task by ID.
    
    Returns task details if user has access.
    """
    logger.info(f"Retrieving task {task_id}")
    
    # Check access and get task
    task = await TaskPermissionChecker.check_task_access(
        task_id=task_id,
        user_id=current_user.id,
        session=session
    )
    
    logger.info(f"Task retrieved successfully: {task_id}")
    return TaskResponse.from_task(task)


@router.put("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: uuid.UUID,
    request: TaskUpdateRequest,
    current_user: User = CurrentUser,
    session: AsyncSession = Depends(get_session)
):
    """
    Update a specific task with validation.
    
    All fields are optional for partial updates.
    Includes business rule validation and permission checking.
    """
    logger.info(f"Updating task {task_id}")
    
    # Check access
    await TaskPermissionChecker.check_task_access(
        task_id=task_id,
        user_id=current_user.id,
        session=session,
        require_ownership=True
    )
    
    # Get update data
    update_data = request.dict(exclude_unset=True)
    
    if not update_data:
        logger.warning(f"No update fields provided for task {task_id}")
        # Still return current task
        repo = TaskRepository(session)
        task = await repo.get_by_id(task_id, current_user.id)
        return TaskResponse.from_task(task)
    
    # Validate dates if being updated
    if 'start_date' in update_data or 'due_date' in update_data:
        TaskValidator.validate_task_dates(
            update_data.get('start_date'),
            update_data.get('due_date')
        )
    
    # Validate completion if being updated
    if 'completed' in update_data:
        TaskValidator.validate_task_completion(None, update_data['completed'])
    
    # Update task
    repo = TaskRepository(session)
    updated_task = await repo.update(task_id, update_data, current_user.id)
    
    # Broadcast update event
    await TaskEventBroadcaster.broadcast_task_event(
        "task_updated", updated_task, current_user.id
    )
    
    logger.info(f"Task updated successfully: {task_id}")
    return TaskResponse.from_task(updated_task)


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: uuid.UUID,
    hard_delete: bool = Query(False, description="Permanently delete (true) or soft delete (false)"),
    current_user: User = CurrentUser,
    session: AsyncSession = Depends(get_session)
):
    """
    Delete a task (soft delete by default).
    
    - **hard_delete**: Permanently delete (true) or soft delete (false)
    
    Soft delete preserves task data, hard delete removes it permanently.
    """
    logger.info(f"Deleting task {task_id} (hard={hard_delete})")
    
    # Check access
    task = await TaskPermissionChecker.check_task_access(
        task_id=task_id,
        user_id=current_user.id,
        session=session,
        require_ownership=True
    )
    
    # Delete task
    repo = TaskRepository(session)
    await repo.delete(task_id, current_user.id, hard_delete=hard_delete)
    
    # Broadcast delete event
    await TaskEventBroadcaster.broadcast_task_event(
        "task_deleted", task, current_user.id
    )
    
    logger.info(f"Task deleted successfully: {task_id}")


@router.post("/{task_id}/complete", response_model=TaskResponse)
async def complete_task(
    task_id: uuid.UUID,
    completed: bool = Query(True, description="Mark as completed (true) or uncompleted (false)"),
    current_user: User = CurrentUser,
    session: AsyncSession = Depends(get_session)
):
    """
    Mark a task as completed or uncompleted.
    
    Updates completion status and timestamp.
    """
    logger.info(f"Setting task {task_id} completion to {completed}")
    
    # Check access
    await TaskPermissionChecker.check_task_access(
        task_id=task_id,
        user_id=current_user.id,
        session=session,
        require_ownership=True
    )
    
    # Update completion status
    repo = TaskRepository(session)
    update_data = {
        "completed": completed,
        "completed_at": datetime.utcnow() if completed else None,
        "status": TaskStatus.COMPLETED if completed else TaskStatus.TODO
    }
    
    updated_task = await repo.update(task_id, update_data, current_user.id)
    
    # Broadcast completion event
    event_type = "task_completed" if completed else "task_uncompleted"
    await TaskEventBroadcaster.broadcast_task_event(
        event_type, updated_task, current_user.id
    )
    
    logger.info(f"Task completion updated successfully: {task_id}")
    return TaskResponse.from_task(updated_task)


# Comment Models
class CommentCreateRequest(BaseModel):
    content: str

class CommentResponse(BaseModel):
    id: str
    content: str
    user_id: str
    user_name: str
    created_at: datetime
    
    @classmethod
    def from_comment(cls, comment: TaskComment, user: User):
        return cls(
            id=str(comment.id),
            content=comment.content or "",
            user_id=str(comment.user_id),
            user_name=user.full_name or user.username,
            created_at=comment.created_at
        )


@router.get("/{task_id}/comments", response_model=List[CommentResponse])
async def get_task_comments(
    task_id: uuid.UUID,
    current_user: User = CurrentUser,
    session: AsyncSession = Depends(get_session)
):
    """
    Get all comments for a specific task.
    """
    logger.info(f"Getting comments for task {task_id}")
    
    # Check task access
    await TaskPermissionChecker.check_task_access(
        task_id=task_id,
        user_id=current_user.id,
        session=session,
        require_ownership=False  # Allow read access to any task user can see
    )
    
    # Get comments
    stmt = (
        select(TaskComment, User)
        .join(User, TaskComment.user_id == User.id)
        .where(
            TaskComment.task_id == task_id,
            TaskComment.activity_type == ActivityType.COMMENT,
            TaskComment.is_deleted == False
        )
        .order_by(TaskComment.created_at.asc())
    )
    
    result = await session.execute(stmt)
    comment_user_pairs = result.all()
    
    comments = [
        CommentResponse.from_comment(comment, user) 
        for comment, user in comment_user_pairs
    ]
    
    logger.info(f"Found {len(comments)} comments for task {task_id}")
    return comments


@router.post("/{task_id}/comments", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
async def add_task_comment(
    task_id: uuid.UUID,
    request: CommentCreateRequest,
    current_user: User = CurrentUser,
    session: AsyncSession = Depends(get_session)
):
    """
    Add a new comment to a task.
    """
    logger.info(f"Adding comment to task {task_id}")
    
    # Check task access
    await TaskPermissionChecker.check_task_access(
        task_id=task_id,
        user_id=current_user.id,
        session=session,
        require_ownership=False  # Allow any user with access to comment
    )
    
    # Create comment
    comment = TaskComment(
        task_id=task_id,
        user_id=current_user.id,
        activity_type=ActivityType.COMMENT,
        content=request.content,
        created_at=datetime.utcnow()
    )
    
    session.add(comment)
    await session.commit()
    await session.refresh(comment)
    
    logger.info(f"Comment added successfully to task {task_id}")
    return CommentResponse.from_comment(comment, current_user)