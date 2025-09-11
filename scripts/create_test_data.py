import uuid
import asyncio
from datetime import datetime
import sys
import os
sys.path.append('/app')
os.environ['DATABASE_URL'] = os.environ.get('DATABASE_URL', '')

from app.core.database import get_session
from app.models.database import Organization, Project, User, Task, TaskStatus, TaskPriority
from sqlmodel import select

async def create_sample_data():
    session_gen = get_session()
    session = await session_gen.__anext__()
    
    try:
        # Check if user exists
        user_stmt = select(User).where(User.email == 'user@example.com')
        result = await session.exec(user_stmt)
        user = result.first()
        
        if not user:
            print('User not found')
            return None
            
        print(f'Found user: {user.id}')
        
        # Check if organization exists
        org_stmt = select(Organization).where(Organization.slug == 'sample-org')
        result = await session.exec(org_stmt)
        org = result.first()
        
        if not org:
            # Create organization
            org = Organization(
                id=uuid.uuid4(),
                name='Sample Organization',
                slug='sample-org',
                description='Default organization for testing'
            )
            session.add(org)
            await session.commit()
            print(f'Created organization: {org.id}')
        else:
            print(f'Found existing organization: {org.id}')
        
        # Check if project exists
        proj_stmt = select(Project).where(Project.slug == 'sample-project')
        result = await session.exec(proj_stmt)
        project = result.first()
        
        if not project:
            # Create project
            project = Project(
                id=uuid.uuid4(),
                organization_id=org.id,
                owner_id=user.id,
                name='Sample Project',
                slug='sample-project',
                description='Default project for testing'
            )
            session.add(project)
            await session.commit()
            print(f'Created project: {project.id}')
        else:
            print(f'Found existing project: {project.id}')
            
        return str(project.id)
        
    finally:
        await session.close()

if __name__ == '__main__':
    project_id = asyncio.run(create_sample_data())
    if project_id:
        print(f'PROJECT_ID={project_id}')