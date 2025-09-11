"""
Comprehensive test suite for the Smart Task Management system.
Tests all layers: models, repositories, and API endpoints.
"""
import asyncio
import sys
import os
sys.path.append(os.path.dirname(__file__))

import pytest
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlmodel import SQLModel
from fastapi.testclient import TestClient
from app.main import app
from app.models.database import User, Organization, Project, Task, Category, TaskStatus, TaskPriority
from app.repositories.task_repository import TaskRepository
from app.core.auth import SupabaseAuth
import uuid
from datetime import datetime
from typing import Dict, Any

# Test configuration
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

class TestSetup:
    """Test setup and utilities"""
    
    def __init__(self):
        self.engine = None
        self.async_session_maker = None
        
    async def setup_db(self):
        """Setup test database"""
        self.engine = create_async_engine(TEST_DATABASE_URL, echo=False)
        
        # Create tables
        async with self.engine.begin() as conn:
            await conn.run_sync(SQLModel.metadata.create_all)
        
        # Create session maker
        self.async_session_maker = async_sessionmaker(
            self.engine, 
            class_=AsyncSession, 
            expire_on_commit=False
        )
    
    async def create_test_data(self, session: AsyncSession, suffix: str = "") -> Dict[str, Any]:
        """Create comprehensive test data"""
        
        # Create user
        user = User(
            email=f"test{suffix}@example.com",
            username=f"testuser{suffix}",
            full_name=f"Test User{suffix}",
            supabase_id=f"test_user_123{suffix}"
        )
        session.add(user)
        
        # Create organization
        org = Organization(
            name=f"Test Organization{suffix}",
            slug=f"test-org{suffix}",
            description=f"Test organization for comprehensive testing{suffix}"
        )
        session.add(org)
        
        await session.commit()
        await session.refresh(user)
        await session.refresh(org)
        
        # Create project
        project = Project(
            name=f"Test Project{suffix}",
            slug=f"test-project{suffix}",
            description=f"Test project for comprehensive testing{suffix}",
            organization_id=org.id,
            owner_id=user.id
        )
        session.add(project)
        
        await session.commit()
        await session.refresh(project)
        
        # Create categories
        category1 = Category(
            name="Backend",
            color="#3498db",
            project_id=project.id,
            created_by_id=user.id,
            position=1
        )
        
        category2 = Category(
            name="Frontend", 
            color="#e74c3c",
            project_id=project.id,
            created_by_id=user.id,
            position=2
        )
        
        session.add_all([category1, category2])
        await session.commit()
        await session.refresh(category1)
        await session.refresh(category2)
        
        # Create assignee user
        assignee = User(
            email=f"assignee{suffix}@example.com",
            username=f"assignee{suffix}",
            full_name=f"Assignee User{suffix}",
            supabase_id=f"assignee_123{suffix}"
        )
        session.add(assignee)
        await session.commit()
        await session.refresh(assignee)
        
        return {
            "user": user,
            "assignee": assignee,
            "org": org,
            "project": project,
            "category1": category1,
            "category2": category2
        }
    
    async def cleanup(self):
        """Cleanup test database"""
        if self.engine:
            await self.engine.dispose()

# Global test setup
test_setup = TestSetup()

async def test_models():
    """Test 1: Database models and relationships"""
    print("\n🧪 Testing Database Models...")
    
    await test_setup.setup_db()
    
    async with test_setup.async_session_maker() as session:
        test_data = await test_setup.create_test_data(session, "_models")
        
        # Test User model
        user = test_data["user"]
        assert user.email == "test_models@example.com"
        assert user.username == "testuser_models"
        assert user.is_active is True
        
        # Test Organization -> Project relationship
        org = test_data["org"]
        await session.refresh(org, ["projects"])
        assert len(org.projects) == 1
        assert org.projects[0].name == "Test Project_models"
        
        # Test Project -> Category relationship
        project = test_data["project"]
        await session.refresh(project, ["categories", "organization"])
        assert len(project.categories) == 2
        assert project.organization.name == "Test Organization_models"
        
        # Test Category -> Project relationship
        category1 = test_data["category1"]
        await session.refresh(category1, ["project"])
        assert category1.project.name == "Test Project_models"
        
        print("✅ Database models and relationships working correctly")

async def test_repository_layer():
    """Test 2: Repository layer with comprehensive operations"""
    print("\n🧪 Testing Repository Layer...")
    
    async with test_setup.async_session_maker() as session:
        test_data = await test_setup.create_test_data(session, "_repo")
        repo = TaskRepository(session)
        
        user = test_data["user"]
        assignee = test_data["assignee"]
        project = test_data["project"]
        category1 = test_data["category1"]
        
        # Test single task creation
        task1 = Task(
            title="Repository Test Task 1",
            description="Testing repository functionality",
            project_id=project.id,
            category_id=category1.id,
            creator_id=user.id,
            status=TaskStatus.TODO,
            priority=TaskPriority.HIGH
        )
        
        created_task1 = await repo.create(task1)
        assert created_task1.title == "Repository Test Task 1"
        assert created_task1.creator_id == user.id
        
        # Test task retrieval by ID
        retrieved_task = await repo.get_by_id(created_task1.id, user.id)
        assert retrieved_task is not None
        assert retrieved_task.title == "Repository Test Task 1"
        
        # Test access control - assignee should not access initially
        assignee_access = await repo.get_by_id(created_task1.id, assignee.id)
        assert assignee_access is None  # Assignee is not assigned yet
        
        # Test task assignment
        result = await repo.bulk_update([created_task1.id], {"assignee_id": assignee.id}, user.id)
        assert result == 1
        
        # Now assignee should have access
        assignee_access = await repo.get_by_id(created_task1.id, assignee.id)
        assert assignee_access is not None
        
        # Test bulk operations
        tasks_to_create = []
        for i in range(5):
            task = Task(
                title=f"Bulk Task {i+1}",
                description=f"Bulk testing task {i+1}",
                project_id=project.id,
                category_id=category1.id,
                creator_id=user.id,
                status=TaskStatus.TODO,
                priority=TaskPriority.MEDIUM
            )
            tasks_to_create.append(task)
        
        # Test bulk creation
        created_tasks = await repo.bulk_create(tasks_to_create)
        assert len(created_tasks) == 5
        
        task_ids = [task.id for task in created_tasks]
        
        # Test bulk status change
        affected = await repo.bulk_change_status(task_ids, user.id, TaskStatus.IN_PROGRESS)
        assert affected == 5
        
        # Test bulk priority change
        affected = await repo.bulk_change_priority(task_ids, user.id, TaskPriority.URGENT)
        assert affected == 5
        
        # Test bulk completion
        affected = await repo.bulk_complete(task_ids[:3], user.id, True)
        assert affected == 3
        
        # Test user tasks retrieval
        user_tasks = await repo.get_user_tasks(user.id)
        assert len(user_tasks) >= 6  # 1 initial + 5 bulk created
        
        # Test filtered retrieval
        completed_tasks = await repo.get_user_tasks(user.id, status=TaskStatus.DONE)
        assert len(completed_tasks) >= 3
        
        # Test task statistics
        stats = await repo.get_task_stats(user.id)
        assert stats["total"] >= 6
        assert stats["completed"] >= 3
        
        # Test bulk deletion
        affected = await repo.bulk_delete(task_ids[3:], user.id, hard_delete=False)
        assert affected == 2  # Soft delete
        
        print("✅ Repository layer operations working correctly")

def test_api_endpoints():
    """Test 3: API endpoints functionality"""
    print("\n🧪 Testing API Endpoints...")
    
    with TestClient(app) as client:
        
        # Test health endpoints
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"
        
        # Test API documentation
        response = client.get("/docs")
        assert response.status_code == 200
        
        # Test OpenAPI specification
        response = client.get("/api/v1/openapi.json")
        assert response.status_code == 200
        spec = response.json()
        
        # Verify all major endpoint groups exist
        paths = spec.get("paths", {})
        
        # Auth endpoints
        assert "/api/v1/auth/signup" in paths
        assert "/api/v1/auth/signin" in paths
        assert "/api/v1/auth/me" in paths
        
        # Task endpoints
        assert "/api/v1/tasks/" in paths
        assert "/api/v1/tasks/stats" in paths
        assert "/api/v1/tasks/{task_id}" in paths
        
        # Category endpoints  
        assert "/api/v1/categories/" in paths
        assert "/api/v1/categories/stats" in paths
        
        # Bulk operations
        assert "/api/v1/bulk/complete" in paths
        assert "/api/v1/bulk/update" in paths
        assert "/api/v1/bulk/delete" in paths
        
        # Test authentication requirement
        protected_endpoints = [
            ("/api/v1/auth/me", "get"),
            ("/api/v1/tasks/", "get"), 
            ("/api/v1/categories/stats", "get")
        ]
        
        for endpoint, method in protected_endpoints:
            if method == "get":
                response = client.get(endpoint)
            elif method == "post":
                response = client.post(endpoint, json={})
            
            # Should require authentication
            assert response.status_code in [401, 403, 422]
        
        print("✅ API endpoints properly configured and secured")

async def test_integration():
    """Test 4: Full integration test"""
    print("\n🧪 Testing Full Integration...")
    
    async with test_setup.async_session_maker() as session:
        test_data = await test_setup.create_test_data(session, "_integration")
        repo = TaskRepository(session)
        
        user = test_data["user"]
        project = test_data["project"]
        category1 = test_data["category1"]
        
        # Create a complex task hierarchy
        parent_task = Task(
            title="Parent Task",
            description="Main task with subtasks",
            project_id=project.id,
            category_id=category1.id,
            creator_id=user.id,
            status=TaskStatus.IN_PROGRESS,
            priority=TaskPriority.HIGH
        )
        
        created_parent = await repo.create(parent_task)
        
        # Create subtasks
        subtasks = []
        for i in range(3):
            subtask = Task(
                title=f"Subtask {i+1}",
                description=f"Child task {i+1}",
                project_id=project.id,
                category_id=category1.id,
                creator_id=user.id,
                parent_task_id=created_parent.id,
                status=TaskStatus.TODO,
                priority=TaskPriority.MEDIUM
            )
            subtasks.append(subtask)
        
        created_subtasks = await repo.bulk_create(subtasks)
        assert len(created_subtasks) == 3
        
        # Test hierarchical relationships
        await session.refresh(created_parent, ["subtasks"])
        assert len(created_parent.subtasks) == 3
        
        for subtask in created_subtasks:
            await session.refresh(subtask, ["parent_task"])
            assert subtask.parent_task.id == created_parent.id
        
        # Complete subtasks and check parent
        subtask_ids = [st.id for st in created_subtasks]
        await repo.bulk_complete(subtask_ids, user.id, True)
        
        # Test complex statistics
        stats = await repo.get_task_stats(user.id)
        assert stats["total"] >= 4  # Parent + 3 subtasks
        assert stats["completed"] >= 3  # 3 subtasks completed
        
        print("✅ Full integration test passed")

async def run_comprehensive_tests():
    """Run all comprehensive tests"""
    print("🚀 Starting Comprehensive Test Suite for Smart Task Management")
    print("=" * 70)
    
    try:
        await test_models()
        await test_repository_layer()
        test_api_endpoints()
        await test_integration()
        
        print("\n" + "=" * 70)
        print("🎉 ALL COMPREHENSIVE TESTS PASSED!")
        print("✅ Database models and relationships: WORKING")
        print("✅ Repository layer operations: WORKING") 
        print("✅ API endpoints configuration: WORKING")
        print("✅ Full system integration: WORKING")
        print("\n🚀 Smart Task Management system is fully functional!")
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        raise
    finally:
        await test_setup.cleanup()

if __name__ == "__main__":
    asyncio.run(run_comprehensive_tests())