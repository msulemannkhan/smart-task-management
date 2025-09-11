"""
Endpoints to manage project members: list, add, update role, remove.
Only project owners can mutate. Members can list.
"""
from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select, and_, or_
import uuid

from app.core.database import get_session
from app.core.auth import CurrentUser
from app.models.database import User, Project, ProjectMember
from app.schemas.project_member import (
    ProjectMemberCreate,
    ProjectMemberUpdate,
    ProjectMemberResponse,
    ProjectMemberListResponse,
    UserBasicInfo,
)
from app.utils.task_helpers import TaskPermissionChecker

router = APIRouter()


def ensure_owner(project: Project, user_id: uuid.UUID):
    if project.owner_id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only project owner can perform this action")


def map_member(pm: ProjectMember, user: User = None) -> ProjectMemberResponse:
    user_info = None
    if user:
        user_info = UserBasicInfo(
            id=user.id,
            email=user.email,
            username=user.username,
            full_name=user.full_name
        )
    return ProjectMemberResponse(
        id=pm.id, 
        project_id=pm.project_id, 
        user_id=pm.user_id, 
        role=str(pm.role),
        user=user_info
    )


@router.get("/{project_id}/members", response_model=ProjectMemberListResponse)
async def list_members(
    project_id: uuid.UUID,
    current_user: User = CurrentUser,
    session: AsyncSession = Depends(get_session)
):
    # Access check (owner or member)
    await TaskPermissionChecker.check_project_access(project_id, current_user.id, session)
    
    # Fetch members with user details using join
    from sqlmodel import select
    stmt = (
        select(ProjectMember, User)
        .join(User, User.id == ProjectMember.user_id)
        .where(ProjectMember.project_id == project_id)
    )
    res = await session.execute(stmt)
    members_with_users = res.all()
    
    # Map members with user details
    member_responses = []
    for pm, user in members_with_users:
        member_responses.append(map_member(pm, user))
    
    return ProjectMemberListResponse(members=member_responses, total=len(member_responses))


@router.post("/{project_id}/members", response_model=ProjectMemberResponse, status_code=status.HTTP_201_CREATED)
async def add_member(
    project_id: uuid.UUID,
    payload: ProjectMemberCreate,
    current_user: User = CurrentUser,
    session: AsyncSession = Depends(get_session)
):
    # Owner-only
    project = await TaskPermissionChecker.check_project_access(project_id, current_user.id, session)
    ensure_owner(project, current_user.id)

    # Prevent duplicates
    exists = (
        await session.execute(
            select(ProjectMember).where(and_(ProjectMember.project_id == project_id, ProjectMember.user_id == payload.user_id))
        )
    ).scalar_one_or_none()
    if exists:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="User already a member")

    # Get the user details for the response
    user_res = await session.execute(select(User).where(User.id == payload.user_id))
    user = user_res.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    pm = ProjectMember(project_id=project_id, user_id=payload.user_id, role=payload.role)
    session.add(pm)
    await session.commit()
    await session.refresh(pm)
    return map_member(pm, user)


@router.put("/{project_id}/members/{member_id}", response_model=ProjectMemberResponse)
async def update_member_role(
    project_id: uuid.UUID,
    member_id: uuid.UUID,
    payload: ProjectMemberUpdate,
    current_user: User = CurrentUser,
    session: AsyncSession = Depends(get_session)
):
    project = await TaskPermissionChecker.check_project_access(project_id, current_user.id, session)
    ensure_owner(project, current_user.id)
    pm = (
        await session.execute(select(ProjectMember).where(and_(ProjectMember.id == member_id, ProjectMember.project_id == project_id)))
    ).scalar_one_or_none()
    if not pm:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")
    pm.role = payload.role
    await session.commit()
    await session.refresh(pm)
    return map_member(pm)


@router.delete("/{project_id}/members/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_member(
    project_id: uuid.UUID,
    member_id: uuid.UUID,
    current_user: User = CurrentUser,
    session: AsyncSession = Depends(get_session)
):
    project = await TaskPermissionChecker.check_project_access(project_id, current_user.id, session)
    ensure_owner(project, current_user.id)
    pm = (
        await session.execute(select(ProjectMember).where(and_(ProjectMember.id == member_id, ProjectMember.project_id == project_id)))
    ).scalar_one_or_none()
    if not pm:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")
    await session.delete(pm)
    await session.commit()
    return


