"""
Category management endpoints using clean architecture.
CRUD operations for task categories with proper separation of concerns.
"""
from fastapi import APIRouter, status, Depends, Query
from typing import Optional
import uuid
import logging

from app.schemas.category import (
    CategoryCreateRequest,
    CategoryUpdateRequest,
    CategoryResponse,
    CategoryListResponse,
    CategoryStatsResponse,
    CategoryReorderRequest
)
from app.utils.category_helpers import (
    CategoryBusinessLogic,
    CategoryQueryHelper,
    CategoryEventLogger,
    CategoryPermissionChecker
)
from app.core.auth import CurrentUser
from app.core.database import get_session
from app.models.database import User
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/", response_model=CategoryListResponse)
async def list_categories(
    current_user: User = CurrentUser,
    session: AsyncSession = Depends(get_session)
):
    """
    Get all categories from all projects the user has access to.
    
    Returns categories from projects where user is owner or member.
    """
    logger.info(f"Retrieving all categories for user {current_user.id}")
    
    # Get categories from all user's projects
    from app.models.database import Category, Project, ProjectMember
    from sqlmodel import select, or_
    
    stmt = (
        select(Category).distinct()
        .join(Project, Project.id == Category.project_id)
        .outerjoin(ProjectMember, ProjectMember.project_id == Project.id)
        .where(
            or_(
                Project.owner_id == current_user.id,
                ProjectMember.user_id == current_user.id
            )
        )
        .order_by(Category.position, Category.name)
    )
    
    result = await session.execute(stmt)
    categories = result.scalars().all()
    
    # Build response with task counts
    category_responses = []
    for category in categories:
        task_count = await CategoryQueryHelper.get_task_count_for_category(category.id, session)
        category_responses.append(CategoryResponse.from_category(category, task_count))
    
    logger.info(f"Found {len(category_responses)} categories for user {current_user.id}")
    return CategoryListResponse(
        categories=category_responses,
        total=len(category_responses),
        has_tasks=len([c for c in category_responses if c.task_count > 0])
    )


@router.post("/", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(
    request: CategoryCreateRequest,
    current_user: User = CurrentUser,
    session: AsyncSession = Depends(get_session)
):
    """
    Create a new category with comprehensive validation.
    
    - **name**: Unique category name within project (2-100 chars)
    - **description**: Optional description (max 500 chars)
    - **color**: Hex color code (#RRGGBB format)
    - **project_id**: Valid project ID that user owns
    - **position**: Position for ordering (defaults to 0)
    
    Returns the created category with metadata.
    """
    logger.info(f"Creating category '{request.name}' for user {current_user.id}")
    
    # Use business logic helper for category creation
    category = await CategoryBusinessLogic.create_category(
        name=request.name,
        description=request.description,
        color=request.color,
        project_id=request.project_id,
        position=request.position,
        user_id=current_user.id,
        session=session
    )
    
    # Log the creation event
    CategoryEventLogger.log_category_created(category, current_user.id)
    
    # Get task count (will be 0 for new category)
    task_count = await CategoryQueryHelper.get_task_count_for_category(category.id, session)
    
    logger.info(f"Category created successfully: {category.id}")
    return CategoryResponse.from_category(category, task_count)


@router.get("/project/{project_id}", response_model=CategoryListResponse)
async def get_project_categories(
    project_id: uuid.UUID,
    current_user: User = CurrentUser,
    session: AsyncSession = Depends(get_session)
):
    """
    Get all categories for a project with task counts.
    
    Returns categories ordered by position and name.
    Only accessible by project owners.
    """
    logger.info(f"Retrieving categories for project {project_id}")
    
    # Use query helper to get categories
    categories = await CategoryQueryHelper.get_categories_by_project(
        project_id=project_id,
        user_id=current_user.id,
        session=session
    )
    
    # Build response with task counts
    category_responses = []
    categories_with_tasks = 0
    
    for category in categories:
        task_count = await CategoryQueryHelper.get_task_count_for_category(category.id, session)
        category_responses.append(CategoryResponse.from_category(category, task_count))
        if task_count > 0:
            categories_with_tasks += 1
    
    logger.info(f"Retrieved {len(category_responses)} categories for project {project_id}")
    return CategoryListResponse(
        categories=category_responses,
        total=len(category_responses),
        has_tasks=categories_with_tasks
    )


@router.get("/stats", response_model=CategoryStatsResponse)
async def get_category_stats(
    current_user: User = CurrentUser,
    session: AsyncSession = Depends(get_session)
):
    """
    Get comprehensive category statistics for user's projects.
    
    Returns metrics including:
    - Total categories and tasks
    - Categories with tasks
    - Average tasks per category
    - Most used colors
    """
    logger.info(f"Retrieving category statistics for user {current_user.id}")
    
    # Use query helper for statistics
    stats = await CategoryQueryHelper.get_category_statistics(
        user_id=current_user.id,
        session=session
    )
    
    logger.info(f"Category stats retrieved for user {current_user.id}")
    return CategoryStatsResponse(**stats)


@router.get("/{category_id}", response_model=CategoryResponse)
async def get_category(
    category_id: uuid.UUID,
    current_user: User = CurrentUser,
    session: AsyncSession = Depends(get_session)
):
    """
    Get a specific category by ID with task count.
    
    Returns the category if user owns the project.
    """
    logger.info(f"Retrieving category {category_id}")
    
    # Check access and get category
    category = await CategoryPermissionChecker.check_category_access(
        category_id=category_id,
        user_id=current_user.id,
        session=session
    )
    
    # Get task count
    task_count = await CategoryQueryHelper.get_task_count_for_category(category.id, session)
    
    logger.info(f"Category retrieved successfully: {category_id}")
    return CategoryResponse.from_category(category, task_count)


@router.put("/{category_id}", response_model=CategoryResponse)
async def update_category(
    category_id: uuid.UUID,
    request: CategoryUpdateRequest,
    current_user: User = CurrentUser,
    session: AsyncSession = Depends(get_session)
):
    """
    Update a specific category with validation.
    
    Only project owners can update categories.
    All fields are optional for partial updates.
    """
    logger.info(f"Updating category {category_id}")
    
    # Get update data (exclude unset fields)
    update_data = request.dict(exclude_unset=True)
    
    if not update_data:
        logger.warning(f"No update fields provided for category {category_id}")
        # Still return current category info
        category = await CategoryPermissionChecker.check_category_access(
            category_id, current_user.id, session
        )
        task_count = await CategoryQueryHelper.get_task_count_for_category(category.id, session)
        return CategoryResponse.from_category(category, task_count)
    
    # Use business logic helper for update
    category = await CategoryBusinessLogic.update_category(
        category_id=category_id,
        update_data=update_data,
        user_id=current_user.id,
        session=session
    )
    
    # Log the update event
    CategoryEventLogger.log_category_updated(category, current_user.id, list(update_data.keys()))
    
    # Get updated task count
    task_count = await CategoryQueryHelper.get_task_count_for_category(category.id, session)
    
    logger.info(f"Category updated successfully: {category_id}")
    return CategoryResponse.from_category(category, task_count)


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    category_id: uuid.UUID,
    move_tasks_to_category_id: Optional[uuid.UUID] = Query(
        None, 
        description="Move tasks to this category before deletion"
    ),
    current_user: User = CurrentUser,
    session: AsyncSession = Depends(get_session)
):
    """
    Delete a specific category with optional task migration.
    
    - Optionally move all tasks to another category before deletion
    - If no target category specified, tasks become uncategorized
    - Only project owners can delete categories
    """
    logger.info(f"Deleting category {category_id}")
    
    # Use business logic helper for deletion
    task_count = await CategoryBusinessLogic.delete_category(
        category_id=category_id,
        user_id=current_user.id,
        session=session,
        move_tasks_to_category_id=move_tasks_to_category_id
    )
    
    # Log the deletion event
    CategoryEventLogger.log_category_deleted(category_id, current_user.id, task_count)
    
    logger.info(f"Category deleted successfully: {category_id}")


@router.post("/{category_id}/reorder", response_model=CategoryResponse)
async def reorder_category(
    category_id: uuid.UUID,
    request: CategoryReorderRequest,
    current_user: User = CurrentUser,
    session: AsyncSession = Depends(get_session)
):
    """
    Change the position of a category for ordering.
    
    Updates the category's position within its project.
    Lower position values appear first.
    """
    logger.info(f"Reordering category {category_id} to position {request.new_position}")
    
    # Use business logic helper for reordering
    category = await CategoryBusinessLogic.update_category(
        category_id=category_id,
        update_data={"position": request.new_position},
        user_id=current_user.id,
        session=session
    )
    
    # Log the reorder event
    CategoryEventLogger.log_category_updated(
        category, current_user.id, ["position"]
    )
    
    # Get task count
    task_count = await CategoryQueryHelper.get_task_count_for_category(category.id, session)
    
    logger.info(f"Category reordered successfully: {category_id}")
    return CategoryResponse.from_category(category, task_count)