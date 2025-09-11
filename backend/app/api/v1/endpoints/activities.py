"""
Activity endpoints for tracking and retrieving user activities.
"""
from fastapi import APIRouter, Depends, Query, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from sqlmodel import select, and_, or_, desc
import uuid
import logging

from app.core.database import get_session
from app.core.auth import CurrentUser
from app.models.database import UserActivity, Task, Project, Category, User, ActivityActionType
from app.repositories.activity_repository import ActivityRepository
from app.schemas.activity import ActivityResponse, ActivityListResponse

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/", response_model=ActivityListResponse)
async def get_activities(
    project_id: Optional[uuid.UUID] = Query(None, description="Filter by project"),
    limit: int = Query(20, ge=1, le=100, description="Number of activities to return"),
    offset: int = Query(0, ge=0, description="Number of activities to skip"),
    current_user: User = CurrentUser,
    session: AsyncSession = Depends(get_session)
):
    """
    Get recent activities for the current user.
    
    - **project_id**: Filter activities by project
    - **limit**: Number of activities to return (1-100)
    - **offset**: Number of activities to skip
    """
    try:
        logger.info(f"Fetching activities for user {current_user.id}")
        
        activity_repo = ActivityRepository(session)
        
        # Get activities visible to current user
        activities = await activity_repo.get_recent(
            project_id=project_id,
            limit=limit,
            offset=offset
        )
        
        # Transform activities to include user names
        activity_responses = []
        for activity in activities:
            response = ActivityResponse(
                id=activity.id,
                user_id=activity.user_id,
                user_name=activity.user.full_name or activity.user.username if activity.user else None,
                action_type=activity.action_type,
                entity_type=activity.entity_type,
                entity_id=activity.entity_id,
                entity_name=activity.entity_name,
                description=activity.description,
                target_user_id=activity.target_user_id,
                target_user_name=activity.target_user.full_name or activity.target_user.username if activity.target_user else None,
                project_id=activity.project_id,
                project_name=activity.project.name if activity.project else None,
                metadata=activity.activity_metadata,
                created_at=activity.created_at
            )
            activity_responses.append(response)
        
        logger.info(f"Found {len(activity_responses)} activities for user {current_user.id}")
        
        return ActivityListResponse(
            activities=activity_responses,
            total=len(activity_responses),
            limit=limit,
            offset=offset
        )
        
    except Exception as e:
        logger.error(f"Failed to get activities: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve activities")


@router.delete("/", status_code=status.HTTP_200_OK)
async def clear_activities(
    current_user: User = CurrentUser,
    session: AsyncSession = Depends(get_session)
):
    """
    Clear all activities for the current user.
    """
    try:
        logger.info(f"Clearing activities for user {current_user.id}")
        
        activity_repo = ActivityRepository(session)
        
        # Only allow users to clear their own activities
        count = await activity_repo.clear_all(user_id=current_user.id)
        
        logger.info(f"Cleared {count} activities for user {current_user.id}")
        
        return {
            "message": f"Successfully cleared {count} activities",
            "count": count
        }
        
    except Exception as e:
        logger.error(f"Failed to clear activities: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to clear activities")
