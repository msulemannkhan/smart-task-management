"""
Users endpoints for listing users that share projects with current user, and fetching user by id when visible.
"""
from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select, or_, and_
import uuid
from typing import List

from app.core.database import get_session
from app.core.auth import CurrentUser
from app.models.database import User, Project, ProjectMember
from app.schemas.user import PublicUser, UserListResponse

router = APIRouter()


def map_user(u: User) -> PublicUser:
    return PublicUser(
        id=u.id,
        email=u.email,
        username=u.username,
        full_name=u.full_name,
        avatar_url=u.avatar_url,
        is_active=u.is_active,
        created_at=u.created_at,
    )


@router.get("/", response_model=UserListResponse)
async def list_visible_users(
    current_user: User = CurrentUser,
    session: AsyncSession = Depends(get_session)
):
    """
    List all active users in the system.
    This allows project owners to add any user to their projects.
    """
    # Get all active users
    stmt = select(User).where(User.is_active == True)
    result = await session.execute(stmt)
    all_users = result.scalars().all()
    
    users = [map_user(u) for u in all_users]
    return UserListResponse(users=users, total=len(users))


@router.get("/{user_id}", response_model=PublicUser)
async def get_user_if_visible(
    user_id: uuid.UUID,
    current_user: User = CurrentUser,
    session: AsyncSession = Depends(get_session)
):
    """
    Get a user only if they share at least one project with the current user, or is the current user.
    """
    if user_id == current_user.id:
        return map_user(current_user)

    # Check shared projects
    shared_stmt = (
        select(User)
        .where(User.id == user_id)
        .join(Project, or_(Project.owner_id == User.id))
        .outerjoin(ProjectMember, ProjectMember.user_id == User.id)
        .where(
            or_(
                # current_user is owner or member on project where target user participates
                and_(Project.owner_id == current_user.id),
                and_(ProjectMember.user_id == current_user.id),
            )
        )
    )
    res = await session.execute(shared_stmt)
    target = res.scalar_one_or_none()
    if not target:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return map_user(target)


