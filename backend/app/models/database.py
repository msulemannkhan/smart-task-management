"""
Database models using SQLModel.
Production-ready models with user roles, projects, subtasks, comments, and maximum tracking.
Designed for efficient bulk operations from the start.
"""
from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import Column
from sqlalchemy.dialects.postgresql import ENUM, JSON
from datetime import datetime
from typing import Optional, List, Dict, Any
from enum import Enum
import uuid


# ==================== ENUMS ====================

class UserRole(str, Enum):
    """User roles for permission management"""
    OWNER = "owner"
    ADMIN = "admin"
    MANAGER = "manager"
    MEMBER = "member"
    GUEST = "guest"


class ProjectStatus(str, Enum):
    """Project status"""
    PLANNING = "planning"
    ACTIVE = "active"
    ON_HOLD = "on_hold"
    COMPLETED = "completed"
    ARCHIVED = "archived"


class TaskStatus(str, Enum):
    """Enhanced task status workflow - values match PostgreSQL enum exactly"""
    BACKLOG = "backlog"
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    IN_REVIEW = "in_review"
    BLOCKED = "blocked"
    DONE = "done"
    CANCELLED = "cancelled"


class TaskPriority(str, Enum):
    """Task priority levels - values match PostgreSQL enum exactly"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"
    CRITICAL = "critical"


class ActivityActionType(str, Enum):
    """Types of actions that can be logged"""
    # Task actions
    TASK_CREATED = "task_created"
    TASK_UPDATED = "task_updated"
    TASK_COMPLETED = "task_completed"
    TASK_DELETED = "task_deleted"
    TASK_ASSIGNED = "task_assigned"
    STATUS_CHANGED = "status_changed"
    PRIORITY_CHANGED = "priority_changed"
    DUE_DATE_CHANGED = "due_date_changed"
    FILE_ATTACHED = "file_attached"
    FILE_REMOVED = "file_removed"
    
    # Project actions
    PROJECT_CREATED = "project_created"
    PROJECT_UPDATED = "project_updated"
    PROJECT_DELETED = "project_deleted"
    PROJECT_MEMBER_ADDED = "project_member_added"
    PROJECT_MEMBER_REMOVED = "project_member_removed"
    
    # Category actions
    CATEGORY_CREATED = "category_created"
    CATEGORY_UPDATED = "category_updated"
    CATEGORY_DELETED = "category_deleted"
    
    # User actions
    USER_SIGNED_IN = "user_signed_in"
    USER_SIGNED_OUT = "user_signed_out"
    USER_REGISTERED = "user_registered"
    USER_PROFILE_UPDATED = "user_profile_updated"
    USER_AVATAR_UPDATED = "user_avatar_updated"
    
    # Other actions
    COMMENT_ADDED = "comment_added"


# PostgreSQL ENUM types that reference existing database enums
task_status_enum = ENUM(
    'backlog', 'todo', 'in_progress', 'in_review', 'blocked', 'done', 'cancelled',
    name='task_status'
)
task_priority_enum = ENUM(
    'low', 'medium', 'high', 'urgent', 'critical',
    name='task_priority'
)
user_role_enum = ENUM(
    'owner', 'admin', 'manager', 'member', 'guest',
    name='user_role'
)
project_status_enum = ENUM(
    'planning', 'active', 'on_hold', 'completed', 'archived',
    name='project_status'
)




# Activity type enum uses LOWERCASE values in the database to match existing data
activity_type_enum = ENUM(
    'comment',
    'status_change',
    'priority_change',
    'assignment',
    'due_date_change',
    'description_change',
    'attachment_added',
    'subtask_added',
    'bulk_operation',
    'mention',
    name='activity_type'
)

class ActivityType(str, Enum):
    """Activity types for comprehensive tracking"""
    COMMENT = "comment"
    STATUS_CHANGE = "status_change"
    PRIORITY_CHANGE = "priority_change"
    ASSIGNMENT = "assignment"
    DUE_DATE_CHANGE = "due_date_change"
    DESCRIPTION_CHANGE = "description_change"
    ATTACHMENT_ADDED = "attachment_added"
    SUBTASK_ADDED = "subtask_added"
    BULK_OPERATION = "bulk_operation"
    MENTION = "mention"


# ==================== ORGANIZATIONS & USERS ====================

class Organization(SQLModel, table=True):
    """Organization/Company model"""
    __tablename__ = "organizations"
    
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str = Field(index=True, max_length=255)
    slug: str = Field(unique=True, index=True, max_length=100)
    description: Optional[str] = None
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    projects: List["Project"] = Relationship(back_populates="organization")
    # memberships: List["OrganizationUser"] # = Relationship(back_populates="organization")


class UserBase(SQLModel):
    """Base User model"""
    email: str = Field(unique=True, index=True)
    username: str = Field(unique=True, index=True)
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    timezone: str = "UTC"
    is_active: bool = True
    is_verified: bool = False
    is_superuser: bool = False
    
    # JSON fields for user preferences
    notification_preferences: Optional[str] = Field(default="{}")  # JSON string
    ui_preferences: Optional[str] = Field(default="{}")  # JSON string


class User(UserBase, table=True):
    """Enhanced User database model"""
    __tablename__ = "users"
    
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    supabase_id: str = Field(unique=True, index=True)  # Link to Supabase auth
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    last_login_at: Optional[datetime] = None
    last_activity_at: Optional[datetime] = None
    
    # Relationships
    # memberships: List["OrganizationUser"] = Relationship(back_populates="user")
    assigned_tasks: List["Task"] = Relationship(back_populates="assignee", sa_relationship_kwargs={"foreign_keys": "[Task.assignee_id]"})
    created_tasks: List["Task"] = Relationship(back_populates="creator", sa_relationship_kwargs={"foreign_keys": "[Task.creator_id]"})
    # comments: List["TaskComment"] = Relationship(back_populates="user")
    activities: List["UserActivity"] = Relationship(
        back_populates="user",
        sa_relationship_kwargs={"foreign_keys": "[UserActivity.user_id]"}
    )


class OrganizationUser(SQLModel, table=True):
    """Organization membership with roles"""
    __tablename__ = "organization_users"
    
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    organization_id: uuid.UUID = Field(foreign_key="organizations.id", index=True)
    user_id: uuid.UUID = Field(foreign_key="users.id", index=True)
    role: UserRole = Field(default=UserRole.MEMBER, sa_column=Column(user_role_enum))
    invited_by_id: Optional[uuid.UUID] = Field(foreign_key="users.id")
    joined_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True
    
    # Relationships
    # organization: Organization = Relationship(back_populates="memberships")
    # user: User = Relationship(back_populates="memberships")


# ==================== PROJECTS ====================

class Project(SQLModel, table=True):
    """Project model for organizing tasks"""
    __tablename__ = "projects"
    
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    organization_id: uuid.UUID = Field(foreign_key="organizations.id", index=True)
    owner_id: uuid.UUID = Field(foreign_key="users.id", index=True)
    
    name: str = Field(index=True, max_length=255)
    slug: str = Field(index=True, max_length=100)
    description: Optional[str] = None
    status: ProjectStatus = Field(default=ProjectStatus.PLANNING, sa_column=Column(project_status_enum))
    color: str = "#3B82F6"
    icon: Optional[str] = None
    
    # Dates
    start_date: Optional[datetime] = None
    due_date: Optional[datetime] = None
    
    # Settings
    is_public: bool = False
    is_archived: bool = False
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    organization: Organization = Relationship(back_populates="projects")
    tasks: List["Task"] = Relationship(back_populates="project")
    categories: List["Category"] = Relationship(back_populates="project")
    # members: List["ProjectMember"] = Relationship(back_populates="project")
    activities: List["UserActivity"] = Relationship(back_populates="project")


class ProjectMember(SQLModel, table=True):
    """Project team members"""
    __tablename__ = "project_members"
    
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    project_id: uuid.UUID = Field(foreign_key="projects.id", index=True)
    user_id: uuid.UUID = Field(foreign_key="users.id", index=True)
    role: UserRole = Field(default=UserRole.MEMBER, sa_column=Column(user_role_enum))
    added_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    # project: Project = Relationship(back_populates="members")


# ==================== CATEGORIES ====================

class CategoryBase(SQLModel):
    """Base Category model"""
    name: str = Field(index=True)
    color: str = "#3B82F6"
    icon: Optional[str] = None
    description: Optional[str] = None


class Category(CategoryBase, table=True):
    """Category database model"""
    __tablename__ = "categories"
    
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    project_id: uuid.UUID = Field(foreign_key="projects.id", index=True)
    created_by_id: uuid.UUID = Field(foreign_key="users.id")
    position: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    project: Project = Relationship(back_populates="categories")
    tasks: List["Task"] = Relationship(back_populates="category")


# ==================== TASKS ====================

class TaskBase(SQLModel):
    """Enhanced Task base model"""
    title: str = Field(index=True, max_length=500)
    description: Optional[str] = None
    status: TaskStatus = Field(default=TaskStatus.TODO, sa_column=Column(task_status_enum))
    priority: TaskPriority = Field(default=TaskPriority.MEDIUM, sa_column=Column(task_priority_enum))
    
    # Dates and time
    start_date: Optional[datetime] = None
    due_date: Optional[datetime] = None
    estimated_hours: Optional[float] = Field(ge=0)
    actual_hours: Optional[float] = Field(default=0, ge=0)
    
    # Progress
    completed: bool = False
    completed_percentage: int = Field(default=0, ge=0, le=100)
    
    # Organization
    position: float = 0  # For ordering
    tags_json: Optional[str] = None  # JSON string for tags


class Task(TaskBase, table=True):
    """
    Enhanced Task model with hierarchical structure, comprehensive tracking,
    and optimization for bulk operations.
    """
    __tablename__ = "tasks"
    
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    
    # Organization relationships
    project_id: Optional[uuid.UUID] = Field(default=None, foreign_key="projects.id", index=True)
    category_id: Optional[uuid.UUID] = Field(foreign_key="categories.id", index=True)
    
    # User relationships
    creator_id: uuid.UUID = Field(foreign_key="users.id", index=True)
    assignee_id: Optional[uuid.UUID] = Field(foreign_key="users.id", index=True)
    
    # Hierarchical tasks (subtasks)
    parent_task_id: Optional[uuid.UUID] = Field(foreign_key="tasks.id", index=True)
    
    # Detailed timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None
    started_at: Optional[datetime] = None
    first_assigned_at: Optional[datetime] = None
    last_activity_at: datetime = Field(default_factory=datetime.utcnow, index=True)
    
    # Soft delete support
    is_deleted: bool = Field(default=False, index=True)
    deleted_at: Optional[datetime] = None
    deleted_by_id: Optional[uuid.UUID] = Field(foreign_key="users.id")
    
    # Performance counters (cached values)
    subtask_count: int = Field(default=0)
    completed_subtasks: int = Field(default=0)
    comment_count: int = Field(default=0)
    attachment_count: int = Field(default=0)
    watcher_count: int = Field(default=0)
    view_count: int = Field(default=0)
    
    # Versioning for optimistic locking
    version: int = Field(default=1)
    
    # Relationships
    project: Project = Relationship(back_populates="tasks")
    category: Optional[Category] = Relationship(back_populates="tasks")
    creator: User = Relationship(back_populates="created_tasks", sa_relationship_kwargs={"foreign_keys": "[Task.creator_id]"})
    assignee: Optional[User] = Relationship(back_populates="assigned_tasks", sa_relationship_kwargs={"foreign_keys": "[Task.assignee_id]"})
    
    # Hierarchical relationships
    parent_task: Optional["Task"] = Relationship(back_populates="subtasks", sa_relationship_kwargs={"remote_side": "[Task.id]"})
    subtasks: List["Task"] = Relationship(back_populates="parent_task", sa_relationship_kwargs={"foreign_keys": "[Task.parent_task_id]"})
    
    # Activity and engagement (disabled temporarily)
    # comments: List["TaskComment"] # = Relationship(back_populates="task")
    # attachments: List["TaskAttachment"] # = Relationship(back_populates="task")
    # watchers: List["TaskWatcher"] # = Relationship(back_populates="task")
    # time_entries: List["TimeEntry"] # = Relationship(back_populates="task")
    
    def get_tags(self) -> List[str]:
        """Convert tags JSON string to list"""
        if not self.tags_json:
            return []
        try:
            import json
            return json.loads(self.tags_json)
        except:
            return []

    def set_tags(self, value: List[str]):
        """Convert tags list to JSON string"""
        import json
        self.tags_json = json.dumps(value) if value else None


# ==================== COMMENTS & ACTIVITY ====================

class TaskComment(SQLModel, table=True):
    """Task comments and activity feed"""
    __tablename__ = "task_comments"
    
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    task_id: uuid.UUID = Field(foreign_key="tasks.id", index=True)
    user_id: uuid.UUID = Field(foreign_key="users.id", index=True)
    
    # Activity details
    # Map to Postgres enum with lowercase values to avoid lookup mismatches
    activity_type: ActivityType = Field(
        default=ActivityType.COMMENT,
        sa_column=Column(activity_type_enum)
    )
    content: Optional[str] = None
    
    # Change tracking (for field changes)
    field_name: Optional[str] = None
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    
    # Threading (for comments)
    parent_comment_id: Optional[uuid.UUID] = Field(foreign_key="task_comments.id")
    
    # Bulk operation tracking
    bulk_operation_id: Optional[uuid.UUID] = None
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)
    updated_at: Optional[datetime] = None
    
    # Soft delete
    is_deleted: bool = False
    deleted_at: Optional[datetime] = None
    
    # Relationships
    # task: Task = Relationship(back_populates="comments")
    # user: User = Relationship(back_populates="comments")


# ==================== USER ACTIVITY ====================

class UserActivity(SQLModel, table=True):
    """User activity log for tracking all system actions"""
    __tablename__ = "user_activities"
    
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="users.id", index=True)
    
    # Action details
    action_type: ActivityActionType = Field(
        sa_column=Column(
            ENUM(
                *[e.value for e in ActivityActionType],
                name='activity_action_type'
            )
        )
    )
    
    # Entity information
    entity_type: str = Field(max_length=50)  # "task", "project", "user", etc.
    entity_id: Optional[uuid.UUID] = None
    entity_name: Optional[str] = Field(max_length=255)
    
    # Human-readable description
    description: str = Field(max_length=500)
    
    # Additional metadata (JSON)
    activity_metadata: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    
    # Target user (for actions like "added John to project")
    target_user_id: Optional[uuid.UUID] = Field(foreign_key="users.id", default=None)
    
    # Related project (for context)
    project_id: Optional[uuid.UUID] = Field(foreign_key="projects.id", default=None)
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)
    
    # Relationships
    user: Optional["User"] = Relationship(
        back_populates="activities",
        sa_relationship_kwargs={"foreign_keys": "[UserActivity.user_id]"}
    )
    target_user: Optional["User"] = Relationship(
        sa_relationship_kwargs={"foreign_keys": "[UserActivity.target_user_id]"}
    )
    project: Optional["Project"] = Relationship(back_populates="activities")


# ==================== ATTACHMENTS ====================

class TaskAttachment(SQLModel, table=True):
    """File attachments with comprehensive metadata"""
    __tablename__ = "task_attachments"
    
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    task_id: uuid.UUID = Field(foreign_key="tasks.id", index=True)
    uploaded_by_id: uuid.UUID = Field(foreign_key="users.id")
    
    # File information
    filename: str = Field(max_length=255)
    original_filename: str = Field(max_length=255)
    file_size: int = Field(ge=0)
    file_type: str = Field(max_length=100)
    file_extension: str = Field(max_length=10)
    
    # Storage information
    storage_path: str
    storage_bucket: str = Field(default="task-attachments", max_length=100)
    download_url: Optional[str] = None
    
    # Image metadata
    is_image: bool = False
    image_width: Optional[int] = None
    image_height: Optional[int] = None
    
    # Tracking
    download_count: int = Field(default=0)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Soft delete
    is_deleted: bool = False
    deleted_at: Optional[datetime] = None
    
    # Relationships
    # task: Task = Relationship(back_populates="attachments")


# ==================== WATCHERS & TIME TRACKING ====================

class TaskWatcher(SQLModel, table=True):
    """Users watching/following tasks"""
    __tablename__ = "task_watchers"
    
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    task_id: uuid.UUID = Field(foreign_key="tasks.id", index=True)
    user_id: uuid.UUID = Field(foreign_key="users.id", index=True)
    added_by_id: Optional[uuid.UUID] = Field(foreign_key="users.id")
    
    # Notification preferences
    notify_on_comments: bool = True
    notify_on_status_change: bool = True
    notify_on_assignment: bool = True
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    # task: Task = Relationship(back_populates="watchers")


class TimeEntry(SQLModel, table=True):
    """Time tracking entries for tasks"""
    __tablename__ = "time_entries"
    
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    task_id: uuid.UUID = Field(foreign_key="tasks.id", index=True)
    user_id: uuid.UUID = Field(foreign_key="users.id", index=True)
    
    # Time information
    start_time: datetime
    end_time: Optional[datetime] = None
    duration_minutes: Optional[int] = Field(ge=0)
    description: Optional[str] = None
    
    # Billing
    is_billable: bool = False
    hourly_rate: Optional[float] = Field(ge=0)
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    # task: Task = Relationship(back_populates="time_entries")


# ==================== AUDIT & HISTORY ====================

class TaskHistory(SQLModel, table=True):
    """Enhanced task history for complete audit trail"""
    __tablename__ = "task_history"
    
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    task_id: uuid.UUID = Field(foreign_key="tasks.id", index=True)
    user_id: uuid.UUID = Field(foreign_key="users.id", index=True)
    
    action: str = Field(index=True)  # 'created', 'updated', 'deleted', etc.
    field_name: Optional[str] = None
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    changes_json: Optional[str] = None  # JSON string for complex changes
    
    # Bulk operation tracking
    bulk_operation_id: Optional[uuid.UUID] = None
    
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)


class BulkOperationLog(SQLModel, table=True):
    """Comprehensive logging for all bulk operations"""
    __tablename__ = "bulk_operation_logs"
    
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="users.id", index=True)
    organization_id: Optional[uuid.UUID] = Field(foreign_key="organizations.id", index=True)
    project_id: Optional[uuid.UUID] = Field(foreign_key="projects.id", index=True)
    
    # Operation details
    operation_type: str = Field(index=True)
    endpoint: Optional[str] = Field(max_length=255)
    
    # Counts
    requested_count: int = Field(ge=0)
    affected_count: int = Field(ge=0)
    success_count: int = Field(ge=0)
    error_count: int = Field(ge=0)
    
    # Data (as JSON strings to avoid type issues)
    task_ids_json: str  # JSON array of task IDs
    parameters_json: Optional[str] = None
    errors_json: Optional[str] = None
    
    # Performance metrics
    execution_time_ms: int = Field(ge=0)
    database_queries: int = Field(default=1)
    
    # Result
    success: bool = True
    error_message: Optional[str] = None
    
    # Request tracking
    request_ip: Optional[str] = Field(max_length=45)
    user_agent: Optional[str] = Field(max_length=500)
    
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)