"""
Seed comprehensive sample data for development and testing.
Creates organizations, projects, categories, tasks with subtasks, comments, and activities.
"""
import asyncio
import uuid
from datetime import datetime, timedelta
import random
from typing import List, Optional

from sqlmodel import select

from app.core.database import get_session
from app.models.database import (
    Organization,
    Project,
    ProjectMember,
    User,
    Category,
    Task,
    TaskStatus,
    TaskPriority,
    UserRole,
    ProjectStatus,
    TaskComment,
    TaskHistory,
    ActivityType,
)


# Sample data definitions
SAMPLE_CATEGORIES = [
    {"name": "Backend Development", "color": "#4CAF50", "position": 1},
    {"name": "Frontend Development", "color": "#2196F3", "position": 2},
    {"name": "Database", "color": "#FF9800", "position": 3},
    {"name": "Testing & QA", "color": "#9C27B0", "position": 4},
    {"name": "Documentation", "color": "#795548", "position": 5},
    {"name": "Bug Fixes", "color": "#F44336", "position": 6},
    {"name": "Features", "color": "#00BCD4", "position": 7},
    {"name": "DevOps", "color": "#607D8B", "position": 8},
]

SAMPLE_PROJECTS = [
    {
        "name": "Smart Task Management System",
        "slug": "smart-task-mgmt",
        "description": "Main task management application with real-time collaboration",
        "status": ProjectStatus.ACTIVE,
    },
    {
        "name": "Mobile App Development",
        "slug": "mobile-app",
        "description": "React Native mobile application for iOS and Android",
        "status": ProjectStatus.PLANNING,
    },
    {
        "name": "API Integration Suite",
        "slug": "api-integration",
        "description": "Third-party API integrations and webhook management",
        "status": ProjectStatus.ACTIVE,
    },
]

SAMPLE_TASKS = [
    # Smart Task Management System tasks
    {
        "title": "Implement JWT refresh token rotation",
        "description": "Add secure token rotation mechanism for JWT refresh tokens to enhance security",
        "status": TaskStatus.IN_PROGRESS,
        "priority": TaskPriority.HIGH,
        "category_idx": 0,  # Backend
        "project_idx": 0,
        "estimated_hours": 8,
        "actual_hours": 5,
        "progress": 65,
        "due_days": 2,
    },
    {
        "title": "Add real-time WebSocket notifications",
        "description": "Implement WebSocket server for real-time task updates across all connected clients",
        "status": TaskStatus.TODO,
        "priority": TaskPriority.HIGH,
        "category_idx": 0,  # Backend
        "project_idx": 0,
        "estimated_hours": 16,
        "due_days": 7,
    },
    {
        "title": "Create responsive dashboard layout",
        "description": "Design and implement a responsive dashboard with task statistics and charts",
        "status": TaskStatus.IN_REVIEW,
        "priority": TaskPriority.MEDIUM,
        "category_idx": 1,  # Frontend
        "project_idx": 0,
        "estimated_hours": 12,
        "actual_hours": 14,
        "progress": 90,
        "due_days": 1,
    },
    {
        "title": "Implement drag-and-drop for task boards",
        "description": "Add drag-and-drop functionality to move tasks between columns in Kanban view",
        "status": TaskStatus.TODO,
        "priority": TaskPriority.MEDIUM,
        "category_idx": 1,  # Frontend
        "project_idx": 0,
        "estimated_hours": 10,
        "due_days": 10,
    },
    {
        "title": "Optimize database queries for task listing",
        "description": "Add proper indexes and optimize N+1 queries in task list endpoints",
        "status": TaskStatus.DONE,
        "priority": TaskPriority.HIGH,
        "category_idx": 2,  # Database
        "project_idx": 0,
        "estimated_hours": 6,
        "actual_hours": 8,
        "progress": 100,
        "completed_days_ago": 3,
    },
    {
        "title": "Add database migration for activity logs",
        "description": "Create Alembic migration for task activity and audit log tables",
        "status": TaskStatus.DONE,
        "priority": TaskPriority.MEDIUM,
        "category_idx": 2,  # Database
        "project_idx": 0,
        "estimated_hours": 3,
        "actual_hours": 2,
        "progress": 100,
        "completed_days_ago": 5,
    },
    {
        "title": "Write unit tests for task repository",
        "description": "Add comprehensive unit tests for all task repository methods with mocking",
        "status": TaskStatus.IN_PROGRESS,
        "priority": TaskPriority.MEDIUM,
        "category_idx": 3,  # Testing
        "project_idx": 0,
        "estimated_hours": 8,
        "actual_hours": 3,
        "progress": 40,
        "due_days": 4,
    },
    {
        "title": "Setup E2E testing with Playwright",
        "description": "Configure Playwright for end-to-end testing of critical user flows",
        "status": TaskStatus.BACKLOG,
        "priority": TaskPriority.LOW,
        "category_idx": 3,  # Testing
        "project_idx": 0,
        "estimated_hours": 12,
        "due_days": 14,
    },
    {
        "title": "Fix task completion not updating parent status",
        "description": "Parent tasks should auto-update status when all subtasks are completed",
        "status": TaskStatus.IN_PROGRESS,
        "priority": TaskPriority.URGENT,
        "category_idx": 5,  # Bug Fixes
        "project_idx": 0,
        "estimated_hours": 4,
        "actual_hours": 2,
        "progress": 50,
        "due_days": 1,
    },
    {
        "title": "Fix WebSocket connection dropping on idle",
        "description": "Implement heartbeat mechanism to keep WebSocket connections alive",
        "status": TaskStatus.TODO,
        "priority": TaskPriority.HIGH,
        "category_idx": 5,  # Bug Fixes
        "project_idx": 0,
        "estimated_hours": 6,
        "due_days": 3,
    },
    {
        "title": "Add task templates feature",
        "description": "Allow users to create and reuse task templates for common workflows",
        "status": TaskStatus.BACKLOG,
        "priority": TaskPriority.LOW,
        "category_idx": 6,  # Features
        "project_idx": 0,
        "estimated_hours": 20,
        "due_days": 30,
    },
    {
        "title": "Implement task dependencies",
        "description": "Add ability to set task dependencies and visualize critical path",
        "status": TaskStatus.BACKLOG,
        "priority": TaskPriority.MEDIUM,
        "category_idx": 6,  # Features
        "project_idx": 0,
        "estimated_hours": 24,
        "due_days": 21,
    },
    {
        "title": "Setup CI/CD pipeline with GitHub Actions",
        "description": "Configure automated testing and deployment pipeline for main branch",
        "status": TaskStatus.DONE,
        "priority": TaskPriority.HIGH,
        "category_idx": 7,  # DevOps
        "project_idx": 0,
        "estimated_hours": 8,
        "actual_hours": 10,
        "progress": 100,
        "completed_days_ago": 7,
    },
    {
        "title": "Configure Docker multi-stage builds",
        "description": "Optimize Docker images with multi-stage builds for smaller production images",
        "status": TaskStatus.IN_REVIEW,
        "priority": TaskPriority.MEDIUM,
        "category_idx": 7,  # DevOps
        "project_idx": 0,
        "estimated_hours": 4,
        "actual_hours": 3,
        "progress": 85,
        "due_days": 2,
    },
    
    # Mobile App Development tasks
    {
        "title": "Setup React Native project structure",
        "description": "Initialize React Native project with TypeScript and configure development environment",
        "status": TaskStatus.IN_PROGRESS,
        "priority": TaskPriority.CRITICAL,
        "category_idx": 1,  # Frontend
        "project_idx": 1,
        "estimated_hours": 8,
        "actual_hours": 4,
        "progress": 50,
        "due_days": 2,
    },
    {
        "title": "Design mobile UI mockups",
        "description": "Create Figma mockups for all mobile app screens following Material Design",
        "status": TaskStatus.TODO,
        "priority": TaskPriority.HIGH,
        "category_idx": 4,  # Documentation
        "project_idx": 1,
        "estimated_hours": 16,
        "due_days": 5,
    },
    {
        "title": "Implement mobile authentication flow",
        "description": "Add login, registration, and biometric authentication for mobile app",
        "status": TaskStatus.BLOCKED,
        "priority": TaskPriority.HIGH,
        "category_idx": 1,  # Frontend
        "project_idx": 1,
        "estimated_hours": 12,
        "due_days": 8,
        "blocked_reason": "Waiting for API authentication endpoints to be finalized",
    },
    
    # API Integration Suite tasks
    {
        "title": "Integrate Slack notifications",
        "description": "Add Slack webhook integration for task assignments and mentions",
        "status": TaskStatus.IN_PROGRESS,
        "priority": TaskPriority.MEDIUM,
        "category_idx": 0,  # Backend
        "project_idx": 2,
        "estimated_hours": 8,
        "actual_hours": 5,
        "progress": 70,
        "due_days": 3,
    },
    {
        "title": "Add GitHub issue sync",
        "description": "Implement two-way sync between GitHub issues and tasks",
        "status": TaskStatus.TODO,
        "priority": TaskPriority.LOW,
        "category_idx": 0,  # Backend
        "project_idx": 2,
        "estimated_hours": 16,
        "due_days": 14,
    },
    {
        "title": "Create webhook management UI",
        "description": "Build interface for users to manage webhook configurations and logs",
        "status": TaskStatus.BACKLOG,
        "priority": TaskPriority.LOW,
        "category_idx": 1,  # Frontend
        "project_idx": 2,
        "estimated_hours": 12,
        "due_days": 21,
    },
]

# Parent-child task relationships
SUBTASK_GROUPS = [
    {
        "parent": {
            "title": "Implement complete authentication system",
            "description": "Full authentication system with JWT, refresh tokens, and 2FA",
            "status": TaskStatus.IN_PROGRESS,
            "priority": TaskPriority.CRITICAL,
            "category_idx": 0,  # Backend
            "project_idx": 0,
            "estimated_hours": 40,
            "actual_hours": 20,
            "progress": 50,
            "due_days": 10,
        },
        "children": [
            {
                "title": "Setup JWT token generation",
                "description": "Implement JWT token generation with proper claims",
                "status": TaskStatus.DONE,
                "priority": TaskPriority.HIGH,
                "estimated_hours": 4,
                "actual_hours": 4,
                "progress": 100,
            },
            {
                "title": "Add refresh token mechanism",
                "description": "Implement secure refresh token storage and rotation",
                "status": TaskStatus.DONE,
                "priority": TaskPriority.HIGH,
                "estimated_hours": 6,
                "actual_hours": 7,
                "progress": 100,
            },
            {
                "title": "Implement 2FA with TOTP",
                "description": "Add two-factor authentication using TOTP (Google Authenticator)",
                "status": TaskStatus.IN_PROGRESS,
                "priority": TaskPriority.MEDIUM,
                "estimated_hours": 8,
                "actual_hours": 3,
                "progress": 40,
            },
            {
                "title": "Add password reset flow",
                "description": "Implement secure password reset with email verification",
                "status": TaskStatus.TODO,
                "priority": TaskPriority.MEDIUM,
                "estimated_hours": 6,
            },
        ],
    },
    {
        "parent": {
            "title": "Performance optimization sprint",
            "description": "Optimize application performance across frontend and backend",
            "status": TaskStatus.TODO,
            "priority": TaskPriority.HIGH,
            "category_idx": 7,  # DevOps
            "project_idx": 0,
            "estimated_hours": 32,
            "due_days": 14,
        },
        "children": [
            {
                "title": "Add Redis caching layer",
                "description": "Implement Redis for caching frequently accessed data",
                "status": TaskStatus.TODO,
                "priority": TaskPriority.HIGH,
                "estimated_hours": 8,
            },
            {
                "title": "Optimize frontend bundle size",
                "description": "Code splitting and lazy loading for React components",
                "status": TaskStatus.TODO,
                "priority": TaskPriority.MEDIUM,
                "estimated_hours": 6,
            },
            {
                "title": "Add database connection pooling",
                "description": "Configure optimal connection pool settings for PostgreSQL",
                "status": TaskStatus.TODO,
                "priority": TaskPriority.HIGH,
                "estimated_hours": 4,
            },
        ],
    },
]

SAMPLE_COMMENTS = [
    "Great progress on this task! The implementation looks solid.",
    "We need to discuss the approach for this. Can we schedule a quick call?",
    "I've reviewed the PR and left some comments. Minor changes needed.",
    "This is blocked by the authentication API. Waiting for backend team.",
    "Updated the description with more detailed requirements.",
    "Testing completed successfully. Ready for deployment.",
    "@team Please review this when you get a chance.",
    "Found a bug in the implementation. Working on a fix.",
    "Customer reported this issue. Increasing priority to urgent.",
    "Documentation has been updated. Closing this task.",
]


async def create_organization(session, name: str, slug: str, description: str) -> Organization:
    """Create or get organization"""
    org = (await session.execute(
        select(Organization).where(Organization.slug == slug)
    )).scalar_one_or_none()
    
    if not org:
        org = Organization(
            id=uuid.uuid4(),
            name=name,
            slug=slug,
            description=description,
            settings={"theme": "light", "notifications": True},
        )
        session.add(org)
        await session.commit()
        await session.refresh(org)
        print(f"✓ Created organization: {org.name}")
    else:
        print(f"→ Found existing organization: {org.name}")
    
    return org


async def create_projects(session, org: Organization, user: User) -> List[Project]:
    """Create sample projects"""
    projects = []
    
    for proj_data in SAMPLE_PROJECTS:
        project = (await session.execute(
            select(Project).where(Project.slug == proj_data["slug"])
        )).scalar_one_or_none()
        
        if not project:
            project = Project(
                id=uuid.uuid4(),
                organization_id=org.id,
                owner_id=user.id,
                name=proj_data["name"],
                slug=proj_data["slug"],
                description=proj_data["description"],
                status=proj_data["status"],
                settings={"notifications": True, "auto_assign": False},
            )
            session.add(project)
            await session.commit()
            await session.refresh(project)
            
            # Add user as project member
            membership = ProjectMember(
                project_id=project.id,
                user_id=user.id,
                role=UserRole.OWNER,
            )
            session.add(membership)
            await session.commit()
            
            print(f"✓ Created project: {project.name}")
        else:
            print(f"→ Found existing project: {project.name}")
        
        projects.append(project)
    
    return projects


async def create_categories(session, projects: List[Project], user: User) -> dict:
    """Create categories for each project"""
    category_map = {}
    
    for project in projects:
        project_categories = []
        
        for cat_data in SAMPLE_CATEGORIES:
            category = (await session.execute(
                select(Category).where(
                    (Category.project_id == project.id) & 
                    (Category.name == cat_data["name"])
                )
            )).scalar_one_or_none()
            
            if not category:
                category = Category(
                    name=cat_data["name"],
                    color=cat_data.get("color"),
                    project_id=project.id,
                    created_by_id=user.id,
                    position=cat_data["position"],
                )
                session.add(category)
            
            project_categories.append(category)
        
        await session.commit()
        
        # Refresh all categories
        for cat in project_categories:
            await session.refresh(cat)
        
        category_map[project.id] = project_categories
        print(f"✓ Created {len(project_categories)} categories for project: {project.name}")
    
    return category_map


async def create_tasks(session, projects: List[Project], category_map: dict, user: User) -> List[Task]:
    """Create sample tasks"""
    tasks = []
    now = datetime.utcnow()
    
    # Check if we already have tasks
    existing_count = (await session.execute(
        select(Task).where(Task.creator_id == user.id).limit(1)
    )).scalar_one_or_none()
    
    if existing_count:
        print("→ Tasks already exist, skipping task creation")
        return []
    
    for task_data in SAMPLE_TASKS:
        project = projects[task_data["project_idx"]]
        categories = category_map[project.id]
        category = categories[task_data["category_idx"]]
        
        # Calculate dates
        due_date = None
        completed_at = None
        
        if "due_days" in task_data:
            due_date = now + timedelta(days=task_data["due_days"])
        
        if "completed_days_ago" in task_data:
            completed_at = now - timedelta(days=task_data["completed_days_ago"])
            due_date = completed_at - timedelta(days=2)  # Due date was before completion
        
        task = Task(
            title=task_data["title"],
            description=task_data["description"],
            project_id=project.id,
            category_id=category.id,
            creator_id=user.id,
            assignee_id=user.id,
            status=task_data["status"],
            priority=task_data["priority"],
            due_date=due_date,
            estimated_hours=task_data.get("estimated_hours"),
            actual_hours=task_data.get("actual_hours"),
            progress=task_data.get("progress", 0),
            completed_at=completed_at,
            tags=["sample-data"],
        )
        
        # Add blocked reason if task is blocked
        if task_data["status"] == TaskStatus.BLOCKED and "blocked_reason" in task_data:
            task.description += f"\n\n**Blocked:** {task_data['blocked_reason']}"
        
        session.add(task)
        tasks.append(task)
    
    await session.commit()
    
    # Refresh all tasks
    for task in tasks:
        await session.refresh(task)
    
    print(f"✓ Created {len(tasks)} individual tasks")
    return tasks


async def create_subtasks(session, projects: List[Project], category_map: dict, user: User) -> List[Task]:
    """Create tasks with parent-child relationships"""
    all_tasks = []
    
    for group in SUBTASK_GROUPS:
        parent_data = group["parent"]
        project = projects[parent_data["project_idx"]]
        categories = category_map[project.id]
        category = categories[parent_data["category_idx"]]
        
        # Check if parent already exists
        existing_parent = (await session.execute(
            select(Task).where(
                (Task.title == parent_data["title"]) & 
                (Task.project_id == project.id)
            )
        )).scalar_one_or_none()
        
        if existing_parent:
            continue
        
        # Create parent task
        now = datetime.utcnow()
        due_date = now + timedelta(days=parent_data["due_days"]) if "due_days" in parent_data else None
        
        parent_task = Task(
            title=parent_data["title"],
            description=parent_data["description"],
            project_id=project.id,
            category_id=category.id,
            creator_id=user.id,
            assignee_id=user.id,
            status=parent_data["status"],
            priority=parent_data["priority"],
            due_date=due_date,
            estimated_hours=parent_data.get("estimated_hours"),
            actual_hours=parent_data.get("actual_hours"),
            progress=parent_data.get("progress", 0),
            tags=["sample-data", "parent-task"],
        )
        session.add(parent_task)
        await session.commit()
        await session.refresh(parent_task)
        all_tasks.append(parent_task)
        
        # Create child tasks
        for idx, child_data in enumerate(group["children"]):
            child_task = Task(
                title=child_data["title"],
                description=child_data["description"],
                project_id=project.id,
                category_id=category.id,
                creator_id=user.id,
                assignee_id=user.id,
                status=child_data.get("status", TaskStatus.TODO),
                priority=child_data.get("priority", TaskPriority.MEDIUM),
                parent_task_id=parent_task.id,
                due_date=due_date - timedelta(days=2) if due_date else None,
                estimated_hours=child_data.get("estimated_hours"),
                actual_hours=child_data.get("actual_hours"),
                progress=child_data.get("progress", 0),
                position=idx + 1,
                tags=["sample-data", "subtask"],
            )
            
            if child_data.get("status") == TaskStatus.DONE:
                child_task.completed_at = now - timedelta(days=random.randint(1, 5))
            
            session.add(child_task)
            all_tasks.append(child_task)
        
        await session.commit()
    
    if all_tasks:
        print(f"✓ Created {len(all_tasks)} tasks with parent-child relationships")
    
    return all_tasks


async def create_comments_and_activities(session, tasks: List[Task], user: User):
    """Create sample comments and activities for tasks"""
    if not tasks:
        return
    
    # Check if we already have comments
    existing_comment = (await session.execute(
        select(TaskComment).limit(1)
    )).scalar_one_or_none()
    
    if existing_comment:
        print("→ Comments already exist, skipping")
        return
    
    now = datetime.utcnow()
    comments_created = 0
    history_created = 0
    
    # Add comments and activities to some tasks
    for task in random.sample(tasks, min(10, len(tasks))):
        # Add 1-3 regular comments per task
        num_comments = random.randint(1, 3)
        for i in range(num_comments):
            comment = TaskComment(
                content=random.choice(SAMPLE_COMMENTS),
                task_id=task.id,
                user_id=user.id,
                activity_type=ActivityType.COMMENT,
                created_at=now - timedelta(hours=random.randint(1, 72)),
            )
            session.add(comment)
            comments_created += 1
        
        # Add activity entries using TaskComment with different activity types
        # Status change activity
        if task.status != TaskStatus.TODO:
            status_activity = TaskComment(
                task_id=task.id,
                user_id=user.id,
                activity_type=ActivityType.STATUS_CHANGE,
                field_name="status",
                old_value="todo",
                new_value=task.status,  # task.status is already a string
                created_at=now - timedelta(hours=random.randint(1, 48)),
            )
            session.add(status_activity)
            comments_created += 1
        
        # Priority change for high/urgent tasks
        if task.priority in [TaskPriority.HIGH, TaskPriority.URGENT, TaskPriority.CRITICAL]:
            priority_activity = TaskComment(
                task_id=task.id,
                user_id=user.id,
                activity_type=ActivityType.PRIORITY_CHANGE,
                field_name="priority",
                old_value="medium",
                new_value=task.priority,  # task.priority is already a string
                created_at=now - timedelta(hours=random.randint(12, 36)),
            )
            session.add(priority_activity)
            comments_created += 1
        
        # Add task history entries for audit trail
        history_entries = []
        
        # Created history
        history_entries.append(TaskHistory(
            task_id=task.id,
            user_id=user.id,
            action="created",
            created_at=now - timedelta(hours=random.randint(48, 96)),
        ))
        
        # Updated history
        if task.status != TaskStatus.TODO:
            history_entries.append(TaskHistory(
                task_id=task.id,
                user_id=user.id,
                action="updated",
                field_name="status",
                old_value="todo",
                new_value=task.status,  # task.status is already a string
                created_at=now - timedelta(hours=random.randint(1, 48)),
            ))
        
        for history in history_entries:
            session.add(history)
            history_created += 1
    
    await session.commit()
    print(f"✓ Created {comments_created} comments/activities and {history_created} history entries")


async def seed() -> None:
    """Main seeding function"""
    print("\n" + "="*60)
    print("🌱 STARTING SAMPLE DATA SEEDING")
    print("="*60 + "\n")
    
    try:
        session_gen = get_session()
        session = await session_gen.__anext__()
        
        try:
            # Look for specific user 'suleman@gmail.com' or any existing user
            target_email = "suleman@gmail.com"
            res = await session.execute(select(User).where(User.email == target_email))
            user = res.scalar_one_or_none()
            
            if not user:
                # Try to get any existing user
                res = await session.execute(select(User).limit(1))
                user = res.scalar_one_or_none()
                
                if not user:
                    print(f"📧 No users found in database.")
                    print("   ⚠️  IMPORTANT: A user must be created through normal login first!")
                    print()
                    print("   Steps to setup:")
                    print("   1. Login with suleman@gmail.com / Suleman123 through the app")
                    print("      (or any other valid Supabase user)")
                    print("   2. This will create the user with the correct Supabase ID")
                    print("   3. Then re-run this seed script to add sample data")
                    print()
                    return
                else:
                    print(f"📧 User {target_email} not found, using existing user: {user.email}")
            
            print(f"👤 Using user: {user.email}")
            print()
            
            # Create organization
            org = await create_organization(
                session,
                name="TechCorp Solutions",
                slug="techcorp",
                description="Leading software development company specializing in enterprise solutions"
            )
            
            # Create projects
            projects = await create_projects(session, org, user)
            
            # Create categories for each project
            category_map = await create_categories(session, projects, user)
            
            # Create individual tasks
            tasks = await create_tasks(session, projects, category_map, user)
            
            # Create tasks with subtasks
            subtask_groups = await create_subtasks(session, projects, category_map, user)
            
            # Combine all tasks
            all_tasks = tasks + subtask_groups
            
            # Create comments and activities
            await create_comments_and_activities(session, all_tasks, user)
            
            # Print summary
            print("\n" + "="*60)
            print("✅ SEEDING COMPLETED SUCCESSFULLY!")
            print("="*60)
            print(f"\nSummary:")
            print(f"  • Organization: 1")
            print(f"  • Projects: {len(projects)}")
            print(f"  • Categories: {sum(len(cats) for cats in category_map.values())}")
            print(f"  • Tasks: {len(all_tasks)}")
            print(f"  • Comments & Activities: Added to various tasks")
            print(f"\n🚀 Your database is now populated with sample data!")
            print(f"   You can log in with: {user.email}")
            print()
            
        finally:
            await session.close()
            
    except Exception as e:
        print(f"\n❌ Error during seeding: {e}")
        import traceback
        traceback.print_exc()


# Helper function to run from Docker
async def seed_from_docker():
    """Wrapper function for running from Docker container"""
    import os
    import sys
    
    # Check if we're running in Docker
    if os.path.exists("/.dockerenv") or os.environ.get("DOCKER_CONTAINER"):
        print("🐳 Running in Docker container")
    
    # Ensure we can import app modules
    sys.path.insert(0, "/app")
    
    await seed()


if __name__ == "__main__":
    # Run the seeder
    asyncio.run(seed())