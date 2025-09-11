"""
Test SQLModel relationships after enabling them.
"""
import asyncio
import sys
import os
sys.path.append(os.path.dirname(__file__))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlmodel import SQLModel, select
from app.models.database import User, Organization, Project, Task, Category, TaskStatus, TaskPriority
from app.repositories.task_repository import TaskRepository
import uuid

async def test_relationships():
    """Test that relationships work properly"""
    
    # Use in-memory SQLite for quick test
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    
    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
    
    # Create session
    async_session_maker = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session_maker() as session:
        # Create test data
        user = User(
            email="relations@example.com",
            username="relationtest",
            full_name="Relation Test User",
            supabase_id="relation_test_123"
        )
        session.add(user)
        
        org = Organization(
            name="Test Org Relations",
            slug="test-org-relations",
            description="Test organization for relationships"
        )
        session.add(org)
        await session.commit()
        await session.refresh(user)
        await session.refresh(org)
        
        project = Project(
            name="Relation Test Project",
            slug="relation-test-project",
            description="Test project for relationships",
            organization_id=org.id,
            owner_id=user.id
        )
        session.add(project)
        await session.commit()
        await session.refresh(project)
        
        # Test Organization -> Projects relationship
        await session.refresh(org, ["projects"])
        print(f"✅ Organization has {len(org.projects)} projects")
        assert len(org.projects) == 1
        assert org.projects[0].name == "Relation Test Project"
        
        # Test Project -> Organization relationship  
        await session.refresh(project, ["organization"])
        print(f"✅ Project belongs to org: {project.organization.name}")
        assert project.organization.name == "Test Org Relations"
        
        category = Category(
            name="Test Category Relations",
            color="#FF5733",
            project_id=project.id,
            created_by_id=user.id
        )
        session.add(category)
        await session.commit()
        await session.refresh(category)
        
        # Test Project -> Categories relationship
        await session.refresh(project, ["categories"])
        print(f"✅ Project has {len(project.categories)} categories")
        assert len(project.categories) == 1
        
        # Test Category -> Project relationship
        await session.refresh(category, ["project"])
        print(f"✅ Category belongs to project: {category.project.name}")
        assert category.project.name == "Relation Test Project"
        
        # Create a task
        repo = TaskRepository(session)
        task = Task(
            title="Relationship Test Task",
            description="Testing relationships",
            project_id=project.id,
            category_id=category.id,
            creator_id=user.id,
            status=TaskStatus.TODO,
            priority=TaskPriority.MEDIUM
        )
        
        created_task = await repo.create(task)
        print(f"✅ Task created with relationships: {created_task.id}")
        
        # Test Task relationships
        await session.refresh(created_task, ["creator", "project", "category"])
        print(f"✅ Task creator: {created_task.creator.full_name}")
        print(f"✅ Task project: {created_task.project.name}")
        print(f"✅ Task category: {created_task.category.name}")
        
        # Test reverse relationships
        await session.refresh(user, ["created_tasks"])
        print(f"✅ User created {len(user.created_tasks)} tasks")
        assert len(user.created_tasks) == 1
        
        await session.refresh(project, ["tasks"]) 
        print(f"✅ Project has {len(project.tasks)} tasks")
        assert len(project.tasks) == 1
        
        await session.refresh(category, ["tasks"])
        print(f"✅ Category has {len(category.tasks)} tasks")
        assert len(category.tasks) == 1
        
        # Test assignee relationship
        assignee_user = User(
            email="assignee-rel@example.com",
            username="assigneerel",
            full_name="Assignee Relationship User",
            supabase_id="assignee_rel_123"
        )
        session.add(assignee_user)
        await session.commit()
        await session.refresh(assignee_user)
        
        # Assign task
        result = await repo.bulk_update([created_task.id], {"assignee_id": assignee_user.id}, user.id)
        assert result > 0
        
        # Test assignee relationship
        await session.refresh(created_task, ["assignee"])
        await session.refresh(assignee_user, ["assigned_tasks"])
        print(f"✅ Task assigned to: {created_task.assignee.full_name}")
        print(f"✅ Assignee has {len(assignee_user.assigned_tasks)} assigned tasks")
        
        print("🎉 All relationship tests passed! SQLModel relationships are working!")

if __name__ == "__main__":
    asyncio.run(test_relationships())