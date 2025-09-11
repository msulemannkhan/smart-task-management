"""
Test the fixed TaskRepository to verify it works with the updated models.
"""
import asyncio
import sys
import os
sys.path.append(os.path.dirname(__file__))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlmodel import SQLModel
from app.models.database import User, Organization, Project, Task, Category, TaskStatus, TaskPriority
from app.repositories.task_repository import TaskRepository
import uuid
from datetime import datetime

async def test_repository_fixed():
    """Test that the repository works with creator_id/assignee_id"""
    
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
            email="repo-test@example.com",
            username="repotest",
            full_name="Repository Test User",
            supabase_id="repo_test_123"
        )
        session.add(user)
        
        org = Organization(
            name="Test Org",
            slug="test-org-repo",
            description="Test organization for repository testing"
        )
        session.add(org)
        await session.commit()
        await session.refresh(user)
        await session.refresh(org)
        
        project = Project(
            name="Test Project",
            slug="test-project-repo", 
            description="Test project for repository",
            organization_id=org.id,
            owner_id=user.id
        )
        session.add(project)
        await session.commit()
        await session.refresh(project)
        
        category = Category(
            name="Test Category",
            color="#FF5733",
            project_id=project.id,
            created_by_id=user.id
        )
        session.add(category)
        await session.commit()
        await session.refresh(category)
        
        # Test TaskRepository
        repo = TaskRepository(session)
        
        # Create a task
        task = Task(
            title="Repository Test Task",
            description="Testing repository functionality",
            project_id=project.id,
            category_id=category.id,
            creator_id=user.id,  # Using creator_id
            status=TaskStatus.TODO,
            priority=TaskPriority.MEDIUM
        )
        
        created_task = await repo.create(task)
        print(f"✅ Task created: {created_task.id} - {created_task.title}")
        
        # Test get_by_id with creator access
        retrieved_task = await repo.get_by_id(created_task.id, user.id)
        assert retrieved_task is not None
        assert retrieved_task.title == "Repository Test Task"
        print(f"✅ Task retrieved by creator: {retrieved_task.title}")
        
        # Test assigning task to another user
        assignee_user = User(
            email="assignee@example.com",
            username="assignee",
            full_name="Assignee User", 
            supabase_id="assignee_123"
        )
        session.add(assignee_user)
        await session.commit()
        await session.refresh(assignee_user)
        
        # Update task to assign it
        task_update = {"assignee_id": assignee_user.id}
        result = await repo.bulk_update([created_task.id], task_update, user.id)
        assert result > 0
        print(f"✅ Task assigned successfully: {result} tasks affected")
        
        # Test that assignee can access the task
        assignee_task = await repo.get_by_id(created_task.id, assignee_user.id)
        assert assignee_task is not None
        print(f"✅ Task accessible by assignee: {assignee_task.title}")
        
        # Test get_user_tasks for both users
        creator_tasks = await repo.get_user_tasks(user.id)
        assignee_tasks = await repo.get_user_tasks(assignee_user.id)
        assert len(creator_tasks) == 1
        assert len(assignee_tasks) == 1
        print(f"✅ User tasks query works: Creator={len(creator_tasks)}, Assignee={len(assignee_tasks)}")
        
        # Test bulk complete
        complete_result = await repo.bulk_complete([created_task.id], user.id)
        assert complete_result > 0
        print(f"✅ Bulk complete works: {complete_result} tasks completed")
        
        # Test task stats
        stats = await repo.get_task_stats(user.id)
        print(f"✅ Task stats: {stats}")
        
        print("🎉 All repository tests passed! Repository-Model mismatch FIXED!")

if __name__ == "__main__":
    asyncio.run(test_repository_fixed())