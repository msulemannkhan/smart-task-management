"""
Project endpoints for listing and fetching project details with membership-based access.
"""
from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from sqlmodel import select, or_, and_
import uuid
import logging
from datetime import datetime

from app.core.database import get_session
from app.core.auth import CurrentUser
from app.models.database import Project, ProjectMember, User, Organization, OrganizationUser, UserRole
from app.schemas.project import ProjectResponse, ProjectListResponse, ProjectCreateRequest, ProjectUpdateRequest

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/", response_model=ProjectListResponse)
async def list_projects(
    current_user: User = CurrentUser,
    session: AsyncSession = Depends(get_session)
):
    """
    List projects the user can access (owner or member).
    """
    stmt = (
        select(Project)
        .outerjoin(ProjectMember, ProjectMember.project_id == Project.id)
        .where(or_(Project.owner_id == current_user.id, ProjectMember.user_id == current_user.id))
        .order_by(Project.created_at.desc())
    )
    result = await session.execute(stmt)
    projects = result.scalars().all()

    responses: List[ProjectResponse] = [
        ProjectResponse(
            id=p.id,
            name=p.name,
            slug=p.slug,
            description=p.description,
            status=p.status.value if hasattr(p.status, 'value') else str(p.status),
            color=p.color,
            icon=p.icon,
            created_at=p.created_at,
            updated_at=p.updated_at,
        )
        for p in projects
    ]

    return ProjectListResponse(projects=responses, total=len(responses))


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: uuid.UUID,
    current_user: User = CurrentUser,
    session: AsyncSession = Depends(get_session)
):
    """
    Get a single project if the user has access (owner or member).
    """
    stmt = (
        select(Project)
        .outerjoin(ProjectMember, ProjectMember.project_id == Project.id)
        .where(
            and_(
                Project.id == project_id,
                or_(Project.owner_id == current_user.id, ProjectMember.user_id == current_user.id),
            )
        )
    )
    result = await session.execute(stmt)
    project = result.scalar_one_or_none()
    if not project:
        from fastapi import HTTPException
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    return ProjectResponse(
        id=project.id,
        name=project.name,
        slug=project.slug,
        description=project.description,
        status=project.status.value if hasattr(project.status, 'value') else str(project.status),
        color=project.color,
        icon=project.icon,
        created_at=project.created_at,
        updated_at=project.updated_at,
    )


@router.post("/", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    request: ProjectCreateRequest,
    current_user: User = CurrentUser,
    session: AsyncSession = Depends(get_session)
):
    """
    Create a new project.
    
    - **name**: Project name (1-255 chars, cannot be empty)
    - **description**: Optional project description (max 1000 chars)
    - **status**: Project status (defaults to PLANNING)
    - **color**: Project color in hex format (defaults to #3B82F6)
    - **icon**: Optional project icon
    
    Returns the created project with metadata.
    """
    logger.info(f"Creating project '{request.name}' for user {current_user.id}")
    
    # Get or create a default organization for the user
    # Check if user is owner of any organization via OrganizationUser relationship
    # Use explicit SQL cast to avoid enum type mismatch
    from sqlalchemy import cast, Text
    org_stmt = (
        select(Organization)
        .join(OrganizationUser, OrganizationUser.organization_id == Organization.id)
        .where(
            and_(
                OrganizationUser.user_id == current_user.id,
                cast(OrganizationUser.role, Text) == 'owner'  # Use explicit text cast
            )
        )
        .limit(1)
    )
    org_result = await session.execute(org_stmt)
    organization = org_result.scalar_one_or_none()
    
    if not organization:
        # Create a default organization for the user
        organization = Organization(
            name=f"{current_user.email.split('@')[0]}'s Organization",
            slug=f"{current_user.email.split('@')[0]}-org"
        )
        session.add(organization)
        await session.flush()  # Get the ID
        
        # Create organization membership with owner role
        org_membership = OrganizationUser(
            organization_id=organization.id,
            user_id=current_user.id,
            role=UserRole.OWNER
        )
        session.add(org_membership)
    
    # Generate slug from name
    slug = request.name.lower().replace(' ', '-').replace('_', '-')
    # Ensure slug is unique
    counter = 1
    original_slug = slug
    while True:
        existing = await session.execute(
            select(Project).where(Project.slug == slug)
        )
        if not existing.scalar_one_or_none():
            break
        slug = f"{original_slug}-{counter}"
        counter += 1
    
    # Create project
    project = Project(
        organization_id=organization.id,
        owner_id=current_user.id,
        name=request.name,
        slug=slug,
        description=request.description,
        status=request.status,
        color=request.color,
        icon=request.icon,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    session.add(project)
    await session.flush()  # Get the project ID without committing
    
    # Add the owner as a project member with owner role
    from app.models.database import ProjectMember
    owner_member = ProjectMember(
        project_id=project.id,
        user_id=current_user.id,
        role=UserRole.OWNER
    )
    session.add(owner_member)
    
    await session.commit()
    await session.refresh(project)
    
    logger.info(f"Project created successfully: {project.id} with owner as member")
    return ProjectResponse(
        id=project.id,
        name=project.name,
        slug=project.slug,
        description=project.description,
        status=project.status.value if hasattr(project.status, 'value') else str(project.status),
        color=project.color,
        icon=project.icon,
        created_at=project.created_at,
        updated_at=project.updated_at,
    )


@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: uuid.UUID,
    request: ProjectUpdateRequest,
    current_user: User = CurrentUser,
    session: AsyncSession = Depends(get_session)
):
    """
    Update a project. Only the project owner can update it.
    """
    logger.info(f"Updating project {project_id} for user {current_user.id}")
    
    # Get project and check ownership
    stmt = select(Project).where(Project.id == project_id)
    result = await session.execute(stmt)
    project = result.scalar_one_or_none()
    
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    
    if project.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only project owner can update")
    
    # Update fields
    update_data = request.dict(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No fields to update")
    
    # Handle slug update if name is being updated
    if 'name' in update_data:
        slug = update_data['name'].lower().replace(' ', '-').replace('_', '-')
        # Ensure slug is unique (excluding current project)
        counter = 1
        original_slug = slug
        while True:
            existing = await session.execute(
                select(Project).where(and_(Project.slug == slug, Project.id != project_id))
            )
            if not existing.scalar_one_or_none():
                break
            slug = f"{original_slug}-{counter}"
            counter += 1
        update_data['slug'] = slug
    
    update_data['updated_at'] = datetime.utcnow()
    
    # Apply updates
    for field, value in update_data.items():
        setattr(project, field, value)
    
    await session.commit()
    await session.refresh(project)
    
    logger.info(f"Project updated successfully: {project.id}")
    return ProjectResponse(
        id=project.id,
        name=project.name,
        slug=project.slug,
        description=project.description,
        status=project.status.value if hasattr(project.status, 'value') else str(project.status),
        color=project.color,
        icon=project.icon,
        created_at=project.created_at,
        updated_at=project.updated_at,
    )


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: uuid.UUID,
    current_user: User = CurrentUser,
    session: AsyncSession = Depends(get_session)
):
    """
    Delete a project. Only the project owner can delete it.
    """
    logger.info(f"Deleting project {project_id} for user {current_user.id}")
    
    # Get project and check ownership
    stmt = select(Project).where(Project.id == project_id)
    result = await session.execute(stmt)
    project = result.scalar_one_or_none()
    
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    
    if project.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only project owner can delete")
    
    await session.delete(project)
    await session.commit()
    
    logger.info(f"Project deleted successfully: {project_id}")


