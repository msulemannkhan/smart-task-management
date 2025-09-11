"""
Test configuration and fixtures.
We'll start with basic fixtures, then add Testcontainers later.
"""
import pytest
import asyncio
from typing import AsyncGenerator, List
from httpx import AsyncClient
from sqlmodel import SQLModel
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
import uuid
from datetime import datetime

# Import our models
from app.models.database import *
from app.core.config import settings
from app.main import app
from app.core.database import get_session


# Test database URL (you'll need to set this up)
TEST_DATABASE_URL = "sqlite+aiosqlite:///./test.db"


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="function")
async def test_engine():
    """Create a test database engine."""
    engine = create_async_engine(
        TEST_DATABASE_URL,
        echo=True,
        future=True,
    )
    
    # Drop and create all tables for clean state
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.drop_all)
        await conn.run_sync(SQLModel.metadata.create_all)
    
    yield engine
    
    # Clean up
    await engine.dispose()


@pytest.fixture(scope="function")
async def test_session(test_engine) -> AsyncGenerator[AsyncSession, None]:
    """Create a test database session."""
    async_session_maker = async_sessionmaker(
        test_engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autocommit=False,
        autoflush=False,
    )
    
    async with async_session_maker() as session:
        yield session


@pytest.fixture(scope="function")
async def client(test_session) -> AsyncGenerator[AsyncClient, None]:
    """Create a test client with database override."""
    
    def get_test_session():
        return test_session
    
    app.dependency_overrides[get_session] = get_test_session
    
    async with AsyncClient(app=app, base_url="http://test") as test_client:
        yield test_client
    
    app.dependency_overrides.clear()


# ==================== FACTORY FIXTURES ====================

@pytest.fixture
async def sample_organization(test_session: AsyncSession) -> Organization:
    """Create a sample organization for testing."""
    org = Organization(
        name="Test Organization",
        slug="test-org",
        description="A test organization",
        plan="pro",
        max_users=100
    )
    test_session.add(org)
    await test_session.commit()
    await test_session.refresh(org)
    return org


@pytest.fixture
async def sample_user(test_session: AsyncSession) -> User:
    """Create a sample user for testing."""
    user = User(
        email="test@example.com",
        username="testuser",
        full_name="Test User",
        supabase_id="test_supabase_id_123",
        is_verified=True
    )
    test_session.add(user)
    await test_session.commit()
    await test_session.refresh(user)
    return user


@pytest.fixture
async def sample_project(test_session: AsyncSession, sample_organization: Organization, sample_user: User) -> Project:
    """Create a sample project for testing."""
    project = Project(
        name="Test Project",
        slug="test-project",
        description="A test project",
        organization_id=sample_organization.id,
        owner_id=sample_user.id,
        status=ProjectStatus.ACTIVE
    )
    test_session.add(project)
    await test_session.commit()
    await test_session.refresh(project)
    return project


@pytest.fixture
async def sample_category(test_session: AsyncSession, sample_project: Project, sample_user: User) -> Category:
    """Create a sample category for testing."""
    category = Category(
        name="Test Category",
        color="#FF5733",
        project_id=sample_project.id,
        created_by_id=sample_user.id
    )
    test_session.add(category)
    await test_session.commit()
    await test_session.refresh(category)
    return category


@pytest.fixture
async def sample_task(
    test_session: AsyncSession, 
    sample_project: Project, 
    sample_user: User, 
    sample_category: Category
) -> Task:
    """Create a sample task for testing."""
    task = Task(
        title="Test Task",
        description="A test task for unit testing",
        project_id=sample_project.id,
        category_id=sample_category.id,
        creator_id=sample_user.id,
        assignee_id=sample_user.id,  # ✅ Task assignment
        status=TaskStatus.TODO,
        priority=TaskPriority.MEDIUM,
        first_assigned_at=datetime.utcnow()  # ✅ Track when assigned
    )
    # Set tags using the property
    task.tags = ["test", "sample"]
    
    test_session.add(task)
    await test_session.commit()
    await test_session.refresh(task)
    return task


@pytest.fixture
async def multiple_tasks(
    test_session: AsyncSession, 
    sample_project: Project, 
    sample_user: User, 
    sample_category: Category
) -> List[Task]:
    """Create multiple tasks for bulk operation testing."""
    tasks = []
    for i in range(10):
        task = Task(
            title=f"Test Task {i+1}",
            description=f"Test task number {i+1}",
            project_id=sample_project.id,
            category_id=sample_category.id,
            creator_id=sample_user.id,
            assignee_id=sample_user.id,
            status=TaskStatus.TODO,
            priority=TaskPriority.MEDIUM,
            tags=[f"test-{i}", "bulk-test"]
        )
        tasks.append(task)
    
    test_session.add_all(tasks)
    await test_session.commit()
    
    for task in tasks:
        await test_session.refresh(task)
    
    return tasks