#!/usr/bin/env python3
"""
Simple script to create sample data for the user suleman@gmail.com
"""
import asyncio
import uuid
from datetime import datetime
import sys
import os

# Add the backend directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from app.core.database import get_session
from app.models.database import Project, Category, Organization, OrganizationUser, User, UserRole, ProjectMember, ProjectStatus

async def create_sample_data():
    """Create sample projects and categories for suleman@gmail.com"""
    print("Creating sample data for suleman@gmail.com...")
    
    session_gen = get_session()
    session = await session_gen.__anext__()
    
    try:
        # Get the user
        from sqlmodel import select
        user_result = await session.execute(
            select(User).where(User.email == "suleman@gmail.com")
        )
        user = user_result.scalar_one_or_none()
        
        if not user:
            print("User suleman@gmail.com not found!")
            return
        
        print(f"Found user: {user.email} (ID: {user.id})")
        
        # Create or get organization
        org_result = await session.execute(
            select(Organization).where(Organization.slug == "suleman-org")
        )
        organization = org_result.scalar_one_or_none()
        
        if not organization:
            organization = Organization(
                id=uuid.uuid4(),
                name="Suleman's Organization",
                slug="suleman-org",
                description="Personal organization for Suleman"
            )
            session.add(organization)
            await session.commit()
            await session.refresh(organization)
            print(f"Created organization: {organization.name}")
            
            # Add user to organization
            org_membership = OrganizationUser(
                organization_id=organization.id,
                user_id=user.id,
                role=UserRole.OWNER
            )
            session.add(org_membership)
            await session.commit()
        else:
            print(f"Found existing organization: {organization.name}")
        
        # Create sample projects
        projects_data = [
            {
                "name": "My First Project",
                "slug": "my-first-project",
                "description": "A sample project to get started",
                "status": ProjectStatus.ACTIVE,
                "color": "#3B82F6"
            },
            {
                "name": "Web Development",
                "slug": "web-development",
                "description": "Frontend and backend web development tasks",
                "status": ProjectStatus.ACTIVE,
                "color": "#10B981"
            },
            {
                "name": "Mobile App",
                "slug": "mobile-app",
                "description": "React Native mobile application",
                "status": ProjectStatus.PLANNING,
                "color": "#F59E0B"
            }
        ]
        
        created_projects = []
        for proj_data in projects_data:
            # Check if project already exists
            existing_project = await session.execute(
                select(Project).where(Project.slug == proj_data["slug"])
            )
            project = existing_project.scalar_one_or_none()
            
            if not project:
                project = Project(
                    id=uuid.uuid4(),
                    organization_id=organization.id,
                    owner_id=user.id,
                    name=proj_data["name"],
                    slug=proj_data["slug"],
                    description=proj_data["description"],
                    status=proj_data["status"],
                    color=proj_data["color"],
                    icon="folder",
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                )
                session.add(project)
                await session.commit()
                await session.refresh(project)
                print(f"Created project: {project.name}")
                
                # Add user as project member
                membership = ProjectMember(
                    project_id=project.id,
                    user_id=user.id,
                    role=UserRole.OWNER
                )
                session.add(membership)
                await session.commit()
            else:
                print(f"Found existing project: {project.name}")
            
            created_projects.append(project)
        
        # Create sample categories for each project
        categories_data = [
            {"name": "Backend Development", "color": "#4CAF50", "position": 1},
            {"name": "Frontend Development", "color": "#2196F3", "position": 2},
            {"name": "Database", "color": "#FF9800", "position": 3},
            {"name": "Testing", "color": "#9C27B0", "position": 4},
            {"name": "Documentation", "color": "#795548", "position": 5}
        ]
        
        for project in created_projects:
            for cat_data in categories_data:
                # Check if category already exists
                existing_category = await session.execute(
                    select(Category).where(
                        (Category.project_id == project.id) & 
                        (Category.name == cat_data["name"])
                    )
                )
                category = existing_category.scalar_one_or_none()
                
                if not category:
                    category = Category(
                        id=uuid.uuid4(),
                        name=cat_data["name"],
                        color=cat_data["color"],
                        project_id=project.id,
                        created_by_id=user.id,
                        position=cat_data["position"],
                        created_at=datetime.utcnow(),
                        updated_at=datetime.utcnow()
                    )
                    session.add(category)
                    print(f"Created category: {category.name} for project {project.name}")
            
            await session.commit()
        
        print("\n✅ Sample data created successfully!")
        print(f"Created {len(created_projects)} projects with categories")
        
    except Exception as e:
        print(f"Error creating sample data: {e}")
        import traceback
        traceback.print_exc()
    finally:
        await session.close()

if __name__ == "__main__":
    asyncio.run(create_sample_data())
