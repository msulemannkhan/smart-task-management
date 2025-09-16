"""
Test the enhanced database models.
Verify relationships, constraints, and data integrity.
"""
import pytest
from datetime import datetime
from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database import *
from typing import List
import uuid


class TestUserModel:
    """Test User model functionality."""
    
    async def test_create_user(self, test_session: AsyncSession):
        """Test creating a user with all fields."""
        import json
        user = User(
            email="newuser@example.com",
            username="newuser", 
            full_name="New User",
            supabase_id="supabase_123",
            bio="I'm a test user",
            timezone="America/New_York",
            notification_preferences=json.dumps({"email": True, "push": False}),
            ui_preferences=json.dumps({"theme": "dark", "sidebar_collapsed": True})
        )
        
        test_session.add(user)
        await test_session.commit()
        await test_session.refresh(user)
        
        assert user.id is not None
        assert user.email == "newuser@example.com"
        
        # Parse JSON fields for testing
        notification_prefs = json.loads(user.notification_preferences)
        ui_prefs = json.loads(user.ui_preferences)
        assert notification_prefs["email"] is True
        assert ui_prefs["theme"] == "dark"
        assert user.is_active is True
        assert user.created_at is not None
    
    async def test_user_unique_constraints(self, test_session: AsyncSession, sample_user: User):
        """Test that email and username must be unique."""
        # Try to create user with same email
        duplicate_email_user = User(
            email=sample_user.email,  # Same email
            username="different_username",
            supabase_id="different_supabase_id"
        )
        
        test_session.add(duplicate_email_user)
        
        # This should raise an integrity error
        with pytest.raises(Exception):  # SQLAlchemy IntegrityError
            await test_session.commit()


class TestOrganizationModel:
    """Test Organization and membership functionality."""
    
    async def test_create_organization(self, test_session: AsyncSession):
        """Test creating an organization."""
        org = Organization(
            name="New Org",
            slug="new-org",
            description="A brand new organization",
            plan="enterprise",
            max_users=500,
            max_projects=100
        )
        
        test_session.add(org)
        await test_session.commit()
        await test_session.refresh(org)
        
        assert org.id is not None
        assert org.slug == "new-org"
        assert org.plan == "enterprise"
        assert org.max_users == 500
    
    async def test_organization_membership(
        self, 
        test_session: AsyncSession, 
        sample_organization: Organization, 
        sample_user: User
    ):
        """Test creating organization membership."""
        membership = OrganizationUser(
            organization_id=sample_organization.id,
            user_id=sample_user.id,
            role=UserRole.ADMIN,
            joined_at=datetime.utcnow()
        )
        
        test_session.add(membership)
        await test_session.commit()
        await test_session.refresh(membership)
        
        assert membership.id is not None
        assert membership.role == UserRole.ADMIN
        assert membership.is_active is True


class TestProjectModel:
    """Test Project model and relationships."""
    
    async def test_create_project(
        self, 
        test_session: AsyncSession, 
        sample_organization: Organization, 
        sample_user: User
    ):
        """Test creating a project with all fields."""
        project = Project(
            name="Advanced Project",
            slug="advanced-project",
            description="A comprehensive project with all features",
            organization_id=sample_organization.id,
            owner_id=sample_user.id,
            status=ProjectStatus.ACTIVE,
            is_public=True,
            color="#FF6B6B",
            icon="🚀",
            progress_percentage=25,
            settings={"auto_assign": True, "notifications_enabled": False}
        )
        
        test_session.add(project)
        await test_session.commit()
        await test_session.refresh(project)
        
        assert project.id is not None
        assert project.slug == "advanced-project"
        assert project.status == ProjectStatus.ACTIVE
        assert project.settings["auto_assign"] is True
        assert project.progress_percentage == 25
    
    async def test_project_member(
        self, 
        test_session: AsyncSession, 
        sample_project: Project, 
        sample_user: User
    ):
        """Test adding members to a project."""
        member = ProjectMember(
            project_id=sample_project.id,
            user_id=sample_user.id,
            role=UserRole.MANAGER,
            added_by_id=sample_user.id
        )
        
        test_session.add(member)
        await test_session.commit()
        await test_session.refresh(member)
        
        assert member.role == UserRole.MANAGER
        assert member.is_active is True


class TestTaskModel:
    """Test enhanced Task model with all features."""
    
    async def test_create_comprehensive_task(
        self, 
        test_session: AsyncSession, 
        sample_project: Project, 
        sample_user: User, 
        sample_category: Category
    ):
        """Test creating a task with all possible fields."""
        due_date = datetime.utcnow()
        
        task = Task(
            title="Comprehensive Task",
            description="This task has all possible fields filled",
            project_id=sample_project.id,
            category_id=sample_category.id,
            creator_id=sample_user.id,
            assignee_id=sample_user.id,
            status=TaskStatus.IN_PROGRESS,
            priority=TaskPriority.HIGH,
            due_date=due_date,
            estimated_hours=8.5,
            actual_hours=2.0,
            completed_percentage=25,
            position=1.5,
            custom_fields={
                "client": "ACME Corp",
                "budget": 5000,
                "complexity": "high"
            }
        )
        # Set tags using the new method
        task.set_tags(["urgent", "feature", "frontend"])
        
        test_session.add(task)
        await test_session.commit()
        await test_session.refresh(task)
        
        assert task.id is not None
        assert task.status == TaskStatus.IN_PROGRESS
        assert task.priority == TaskPriority.HIGH
        assert task.estimated_hours == 8.5
        assert task.completed_percentage == 25
        assert "urgent" in task.get_tags()
        assert task.custom_fields["client"] == "ACME Corp"
        assert task.position == 1.5
    
    async def test_subtask_relationship(
        self, 
        test_session: AsyncSession, 
        sample_task: Task,
        sample_project: Project,
        sample_user: User
    ):
        """Test parent-child task relationships."""
        # Create a subtask
        subtask = Task(
            title="Subtask 1",
            description="A subtask of the main task",
            project_id=sample_project.id,
            creator_id=sample_user.id,
            parent_task_id=sample_task.id,  # This makes it a subtask
            status=TaskStatus.TODO
        )
        
        test_session.add(subtask)
        await test_session.commit()
        await test_session.refresh(subtask)
        
        # Update parent task counts (normally done by repository)
        sample_task.subtask_count = 1
        await test_session.commit()
        
        assert subtask.parent_task_id == sample_task.id
        assert sample_task.subtask_count == 1
    
    async def test_task_soft_delete(self, test_session: AsyncSession, sample_task: Task, sample_user: User):
        """Test soft delete functionality."""
        # Soft delete the task
        sample_task.is_deleted = True
        sample_task.deleted_at = datetime.utcnow()
        sample_task.deleted_by_id = sample_user.id
        
        await test_session.commit()
        
        assert sample_task.is_deleted is True
        assert sample_task.deleted_at is not None
        assert sample_task.deleted_by_id == sample_user.id


class TestTaskActivityModel:
    """Test comprehensive activity tracking."""
    
    async def test_create_comment_activity(
        self, 
        test_session: AsyncSession, 
        sample_task: Task, 
        sample_user: User
    ):
        """Test creating a comment activity."""
        activity = TaskActivity(
            task_id=sample_task.id,
            user_id=sample_user.id,
            activity_type=ActivityType.COMMENT,
            content="This is a test comment on the task.",
            metadata={"mentions": ["@johndoe"], "edited": False}
        )
        
        test_session.add(activity)
        await test_session.commit()
        await test_session.refresh(activity)
        
        assert activity.id is not None
        assert activity.activity_type == ActivityType.COMMENT
        assert "This is a test comment" in activity.content
        assert activity.metadata["edited"] is False
    
    async def test_status_change_activity(
        self, 
        test_session: AsyncSession, 
        sample_task: Task, 
        sample_user: User
    ):
        """Test tracking status changes."""
        activity = TaskActivity(
            task_id=sample_task.id,
            user_id=sample_user.id,
            activity_type=ActivityType.STATUS_CHANGE,
            content="Changed status from TODO to IN_PROGRESS",
            field_name="status",
            old_value="todo",
            new_value="in_progress",
            metadata={"automated": False}
        )
        
        test_session.add(activity)
        await test_session.commit()
        await test_session.refresh(activity)
        
        assert activity.activity_type == ActivityType.STATUS_CHANGE
        assert activity.field_name == "status"
        assert activity.old_value == "todo"
        assert activity.new_value == "in_progress"
    
    async def test_bulk_operation_activity(
        self, 
        test_session: AsyncSession, 
        sample_task: Task, 
        sample_user: User
    ):
        """Test tracking bulk operations."""
        import uuid
        bulk_id = uuid.uuid4()
        
        activity = TaskActivity(
            task_id=sample_task.id,
            user_id=sample_user.id,
            activity_type=ActivityType.BULK_OPERATION,
            content="Task updated as part of bulk operation",
            bulk_operation_id=bulk_id,
            metadata={
                "operation": "bulk_complete",
                "affected_tasks": 10,
                "execution_time_ms": 150
            }
        )
        
        test_session.add(activity)
        await test_session.commit()
        await test_session.refresh(activity)
        
        assert activity.bulk_operation_id == bulk_id
        assert activity.metadata["operation"] == "bulk_complete"
        assert activity.metadata["affected_tasks"] == 10


class TestAttachmentModel:
    """Test file attachment functionality."""
    
    async def test_create_attachment(
        self, 
        test_session: AsyncSession, 
        sample_task: Task, 
        sample_user: User
    ):
        """Test creating a file attachment."""
        attachment = TaskAttachment(
            task_id=sample_task.id,
            uploaded_by_id=sample_user.id,
            filename="document_uuid_123.pdf",
            original_filename="Important Document.pdf",
            file_size=2048000,  # 2MB
            file_type="application/pdf",
            file_extension="pdf",
            storage_path="/task-attachments/2024/01/document_uuid_123.pdf",
            storage_bucket="task-attachments",
            is_image=False
        )
        
        test_session.add(attachment)
        await test_session.commit()
        await test_session.refresh(attachment)
        
        assert attachment.id is not None
        assert attachment.file_size == 2048000
        assert attachment.file_type == "application/pdf"
        assert attachment.original_filename == "Important Document.pdf"
        assert attachment.is_image is False
    
    async def test_image_attachment(
        self, 
        test_session: AsyncSession, 
        sample_task: Task, 
        sample_user: User
    ):
        """Test creating an image attachment with dimensions."""
        attachment = TaskAttachment(
            task_id=sample_task.id,
            uploaded_by_id=sample_user.id,
            filename="screenshot_uuid_456.png",
            original_filename="Screenshot.png",
            file_size=512000,  # 512KB
            file_type="image/png",
            file_extension="png",
            storage_path="/task-attachments/2024/01/screenshot_uuid_456.png",
            is_image=True,
            image_width=1920,
            image_height=1080,
            download_count=5
        )
        
        test_session.add(attachment)
        await test_session.commit()
        await test_session.refresh(attachment)
        
        assert attachment.is_image is True
        assert attachment.image_width == 1920
        assert attachment.image_height == 1080
        assert attachment.download_count == 5


class TestTimeTrackingModel:
    """Test time tracking functionality."""
    
    async def test_create_time_entry(
        self, 
        test_session: AsyncSession, 
        sample_task: Task, 
        sample_user: User
    ):
        """Test creating a time tracking entry."""
        start_time = datetime.utcnow()
        
        time_entry = TimeEntry(
            task_id=sample_task.id,
            user_id=sample_user.id,
            start_time=start_time,
            duration_minutes=120,  # 2 hours
            description="Working on the main functionality",
            is_billable=True,
            hourly_rate=75.00
        )
        
        test_session.add(time_entry)
        await test_session.commit()
        await test_session.refresh(time_entry)
        
        assert time_entry.id is not None
        assert time_entry.duration_minutes == 120
        assert time_entry.is_billable is True
        assert time_entry.hourly_rate == 75.00
    
    async def test_active_time_entry(
        self, 
        test_session: AsyncSession, 
        sample_task: Task, 
        sample_user: User
    ):
        """Test creating an active (running) time entry."""
        start_time = datetime.utcnow()
        
        time_entry = TimeEntry(
            task_id=sample_task.id,
            user_id=sample_user.id,
            start_time=start_time,
            end_time=None,  # Still running
            duration_minutes=None,  # Will be calculated when stopped
            description="Currently working on this task"
        )
        
        test_session.add(time_entry)
        await test_session.commit()
        await test_session.refresh(time_entry)
        
        assert time_entry.end_time is None
        assert time_entry.duration_minutes is None