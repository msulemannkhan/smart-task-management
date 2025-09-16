#!/usr/bin/env python3
"""
Smart Task Management System - Deployment Script
This script handles the complete setup and deployment of the application:
1. Builds Docker images for both backend and frontend
2. Starts containers using docker-compose
3. Runs database migrations
4. Creates sample data for testing
"""

import os
import sys
import time
import subprocess
import argparse
from pathlib import Path
from typing import Optional, List, Dict, Any
import json
from dotenv import load_dotenv

# ANSI color codes for terminal output
class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'

def print_colored(message: str, color: str = Colors.ENDC, bold: bool = False) -> None:
    """Print colored message to terminal."""
    prefix = Colors.BOLD if bold else ""
    print(f"{prefix}{color}{message}{Colors.ENDC}")

def print_step(step: str, description: str) -> None:
    """Print a formatted step header."""
    print("\n" + "="*60)
    print_colored(f"[{step}]", Colors.CYAN, bold=True)
    print_colored(description, Colors.BLUE)
    print("="*60)

def run_command(command: List[str], cwd: Optional[Path] = None, capture: bool = False) -> Optional[str]:
    """Run a shell command and handle errors."""
    try:
        print_colored(f"Running: {' '.join(command)}", Colors.CYAN)
        
        if capture:
            result = subprocess.run(
                command,
                cwd=cwd,
                capture_output=True,
                text=True,
                check=True
            )
            return result.stdout
        else:
            subprocess.run(command, cwd=cwd, check=True)
            return None
            
    except subprocess.CalledProcessError as e:
        print_colored(f"Error running command: {e}", Colors.FAIL)
        if capture and e.stderr:
            print_colored(f"Error output: {e.stderr}", Colors.FAIL)
        sys.exit(1)

class DeploymentManager:
    """Manages the deployment process for Smart Task Management System."""
    
    def __init__(self, project_root: Path):
        self.project_root = project_root
        self.backend_dir = project_root / "backend"
        self.frontend_dir = project_root / "frontend"
        self.docker_compose_file = project_root / "docker-compose.yml"
        
        # Load port configuration from .env.ports
        env_ports_file = project_root / ".env.ports"
        if env_ports_file.exists():
            load_dotenv(env_ports_file)
        
        # Get port configuration with defaults
        self.frontend_port = os.getenv('FRONTEND_PORT', '8086')
        self.backend_port = os.getenv('BACKEND_PORT', '9200')
        self.database_port = os.getenv('DATABASE_PORT', '5433')
        
    def check_prerequisites(self) -> bool:
        """Check if all required tools are installed."""
        print_step("STEP 1", "Checking Prerequisites")
        
        required_tools = {
            "docker": ["docker", "--version"],
            "docker-compose": ["docker-compose", "--version"],
            "python": ["python", "--version"],
        }
        
        all_installed = True
        for tool, command in required_tools.items():
            try:
                output = run_command(command, capture=True)
                print_colored(f"[OK] {tool}: {output.strip()}", Colors.GREEN)
            except:
                print_colored(f"[X] {tool} is not installed", Colors.FAIL)
                all_installed = False
                
        return all_installed
    
    def create_docker_compose(self) -> None:
        """Create docker-compose.yml if it doesn't exist."""
        if not self.docker_compose_file.exists():
            print_colored("Creating docker-compose.yml...", Colors.WARNING)
            
            compose_content = f"""services:
  database:
    image: postgres:15-alpine
    container_name: smart-task-db
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: localdev123
      POSTGRES_DB: smart_task_management
    ports:
      - "{self.database_port}:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: smart-task-backend
    environment:
      DATABASE_URL: postgresql://postgres:localdev123@database:5432/smart_task_management
      SUPABASE_URL: ${SUPABASE_URL}
      SUPABASE_ANON_KEY: ${SUPABASE_ANON_KEY}
      CORS_ORIGINS: http://localhost:{self.frontend_port},http://localhost:5173,http://frontend:80
      JWT_SECRET: your-secret-key-change-in-production
    ports:
      - "{self.backend_port}:8000"
    depends_on:
      database:
        condition: service_healthy
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
    volumes:
      - ./backend:/app
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/docs"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: smart-task-frontend
    environment:
      VITE_API_URL: http://localhost:{self.backend_port}
    ports:
      - "{self.frontend_port}:80"
    depends_on:
      - backend
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:80"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  postgres_data:
"""
            self.docker_compose_file.write_text(compose_content)
            print_colored("✓ docker-compose.yml created", Colors.GREEN)
    
    def check_env_files(self) -> bool:
        """Check if required .env files exist."""
        print_step("STEP 2", "Checking Environment Files")
        
        backend_env = self.backend_dir / ".env"
        frontend_env = self.frontend_dir / ".env"
        
        # Check backend .env
        if not backend_env.exists():
            print_colored("Creating backend/.env file...", Colors.WARNING)
            backend_env_content = f"""# Database Configuration
DATABASE_URL=postgresql://postgres:localdev123@localhost:{self.database_port}/smart_task_management

# Supabase Configuration (for production auth)
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key

# JWT Configuration
JWT_SECRET=your-secret-key-change-in-production
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24

# CORS Configuration
CORS_ORIGINS=http://localhost:{self.frontend_port},http://localhost:5173

# Server Configuration
HOST=0.0.0.0
PORT=8000
RELOAD=true
"""
            backend_env.write_text(backend_env_content)
            print_colored("✓ backend/.env created (please update with your Supabase credentials)", Colors.GREEN)
        else:
            print_colored("✓ backend/.env exists", Colors.GREEN)
        
        # Check frontend .env
        if not frontend_env.exists():
            print_colored("Creating frontend/.env file...", Colors.WARNING)
            frontend_env_content = f"""# API Configuration
VITE_API_URL=http://localhost:{self.backend_port}
VITE_WS_URL=ws://localhost:{self.backend_port}

# Supabase Configuration (for production auth)
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
"""
            frontend_env.write_text(frontend_env_content)
            print_colored("✓ frontend/.env created (please update with your Supabase credentials)", Colors.GREEN)
        else:
            print_colored("✓ frontend/.env exists", Colors.GREEN)
        
        return True
    
    def build_docker_images(self, rebuild: bool = False) -> None:
        """Build Docker images for backend and frontend."""
        print_step("STEP 3", "Building Docker Images")
        
        # Create docker-compose.yml if needed
        self.create_docker_compose()
        
        build_args = ["docker-compose", "build"]
        if rebuild:
            build_args.append("--no-cache")
            
        run_command(build_args, cwd=self.project_root)
        print_colored("✓ Docker images built successfully", Colors.GREEN)
    
    def start_containers(self) -> None:
        """Start Docker containers using docker-compose."""
        print_step("STEP 4", "Starting Docker Containers")
        
        # Stop any existing containers first
        print_colored("Stopping any existing containers...", Colors.WARNING)
        run_command(["docker-compose", "down"], cwd=self.project_root)
        
        # Start containers
        print_colored("Starting containers...", Colors.CYAN)
        run_command(["docker-compose", "up", "-d"], cwd=self.project_root)
        
        # Wait for services to be ready
        print_colored("Waiting for services to be ready...", Colors.CYAN)
        time.sleep(10)  # Give services time to start
        
        # Check container status
        output = run_command(["docker-compose", "ps"], cwd=self.project_root, capture=True)
        print(output)
        
        print_colored("✓ Containers started successfully", Colors.GREEN)
    
    def run_migrations(self) -> None:
        """Run database migrations using Alembic."""
        print_step("STEP 5", "Running Database Migrations")
        
        # Check if alembic is configured
        alembic_ini = self.backend_dir / "alembic.ini"
        if not alembic_ini.exists():
            print_colored("Initializing Alembic...", Colors.WARNING)
            run_command(["docker-compose", "exec", "backend", "alembic", "init", "alembic"], cwd=self.project_root)
        
        # First, check current migration status
        print_colored("Checking current migration status...", Colors.CYAN)
        try:
            output = run_command(
                ["docker-compose", "exec", "backend", "alembic", "current"],
                cwd=self.project_root,
                capture=True
            )
            print_colored(f"Current migration: {output.strip()}", Colors.CYAN)
        except:
            print_colored("No migration history found", Colors.WARNING)
        
        # Run migrations with better error handling
        print_colored("Running database migrations...", Colors.CYAN)
        try:
            run_command(
                ["docker-compose", "exec", "backend", "alembic", "upgrade", "head"],
                cwd=self.project_root
            )
            print_colored("✓ Database migrations completed", Colors.GREEN)
        except subprocess.CalledProcessError as e:
            # Check if it's just because tables already exist
            if "already exists" in str(e):
                print_colored("⚠ Some database objects already exist, attempting to stamp current version...", Colors.WARNING)
                try:
                    # Stamp the database with the current migration version
                    run_command(
                        ["docker-compose", "exec", "backend", "alembic", "stamp", "head"],
                        cwd=self.project_root
                    )
                    print_colored("✓ Database stamped with current migration version", Colors.GREEN)
                except:
                    print_colored("⚠ Migration issues detected but continuing...", Colors.WARNING)
            else:
                print_colored(f"⚠ Migration error: {str(e)}", Colors.WARNING)
                print_colored("Continuing with deployment...", Colors.CYAN)
    
    def create_sample_data(self) -> None:
        """Create sample data using the seed script."""
        print_step("STEP 6", "Creating Sample Data")
        
        seed_script = self.backend_dir / "app" / "scripts" / "seed_sample_data.py"
        
        if not seed_script.exists():
            print_colored("Creating seed_sample_data.py script...", Colors.WARNING)
            self.create_seed_script(seed_script)
        
        # Run seed script inside container
        print_colored("Creating sample data...", Colors.CYAN)
        run_command(
            ["docker-compose", "exec", "backend", "python", "-m", "app.scripts.seed_sample_data"],
            cwd=self.project_root
        )
        
        print_colored("✓ Sample data created successfully", Colors.GREEN)
    
    def create_seed_script(self, seed_script_path: Path) -> None:
        """Create the seed_sample_data.py script if it doesn't exist."""
        seed_script_path.parent.mkdir(parents=True, exist_ok=True)
        
        seed_content = '''"""
Seed sample data for Smart Task Management System
"""

import asyncio
import os
import sys
from datetime import datetime, timedelta
from pathlib import Path

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent.parent))

from sqlmodel import select
from app.core.database import get_session, init_db
from app.core.config import settings
from app.domain.entities import User, Project, Task, Category, ProjectMember
from app.services.auth import AuthService
from app.schemas.task import TaskStatus, TaskPriority
import random

async def create_sample_data():
    """Create sample data for testing."""
    
    async with get_session() as session:
        print("Creating sample users...")
        
        # Create test users
        auth_service = AuthService()
        
        users_data = [
            ("suleman@gmail.com", "Suleman123", "Suleman"),
            ("demo@example.com", "demo123", "Demo User"),
            ("john@example.com", "john123", "John Doe"),
            ("jane@example.com", "jane123", "Jane Smith"),
        ]
        
        users = []
        for email, password, name in users_data:
            # Check if user exists
            result = await session.exec(select(User).where(User.email == email))
            user = result.first()
            
            if not user:
                user_data = await auth_service.register(email, password, name)
                result = await session.exec(select(User).where(User.email == email))
                user = result.first()
                print(f"Created user: {email}")
            else:
                print(f"User already exists: {email}")
            
            if user:
                users.append(user)
        
        if not users:
            print("No users created or found. Exiting.")
            return
        
        demo_user = users[0]
        
        print("\\nCreating sample projects...")
        
        # Create projects
        projects_data = [
            ("Personal Tasks", "Personal productivity and daily tasks", "#3B82F6"),
            ("Work Projects", "Professional work assignments", "#10B981"),
            ("Learning Goals", "Educational courses and skills development", "#F59E0B"),
        ]
        
        projects = []
        for name, description, color in projects_data:
            # Check if project exists
            result = await session.exec(
                select(Project).where(
                    Project.name == name,
                    Project.owner_id == demo_user.id
                )
            )
            project = result.first()
            
            if not project:
                project = Project(
                    name=name,
                    description=description,
                    color=color,
                    owner_id=demo_user.id
                )
                session.add(project)
                await session.commit()
                await session.refresh(project)
                print(f"Created project: {name}")
            else:
                print(f"Project already exists: {name}")
            
            projects.append(project)
        
        print("\\nCreating sample categories...")
        
        # Create categories
        categories_data = [
            ("Bug Fix", "#EF4444"),
            ("Feature", "#10B981"),
            ("Documentation", "#3B82F6"),
            ("Testing", "#F59E0B"),
            ("Refactoring", "#8B5CF6"),
        ]
        
        categories = []
        for name, color in categories_data:
            # Check if category exists
            result = await session.exec(
                select(Category).where(
                    Category.name == name,
                    Category.user_id == demo_user.id
                )
            )
            category = result.first()
            
            if not category:
                category = Category(
                    name=name,
                    color=color,
                    user_id=demo_user.id,
                    project_id=projects[0].id  # Assign to first project
                )
                session.add(category)
                await session.commit()
                await session.refresh(category)
                print(f"Created category: {name}")
            else:
                print(f"Category already exists: {name}")
            
            categories.append(category)
        
        print("\\nCreating sample tasks...")
        
        # Sample tasks data
        tasks_data = [
            # Personal Tasks
            ("Review weekly goals", "Check progress on weekly objectives", TaskStatus.IN_PROGRESS, TaskPriority.HIGH, projects[0], categories[0]),
            ("Grocery shopping", "Buy items for the week", TaskStatus.TODO, TaskPriority.MEDIUM, projects[0], categories[0]),
            ("Exercise routine", "Complete daily workout", TaskStatus.DONE, TaskPriority.MEDIUM, projects[0], categories[0]),
            ("Read book chapter", "Continue reading current book", TaskStatus.TODO, TaskPriority.LOW, projects[0], categories[0]),
            
            # Work Projects
            ("Fix login bug", "Users unable to login with special characters", TaskStatus.IN_PROGRESS, TaskPriority.CRITICAL, projects[1], categories[0]),
            ("Implement dark mode", "Add dark theme support", TaskStatus.TODO, TaskPriority.MEDIUM, projects[1], categories[1]),
            ("Write API documentation", "Document REST API endpoints", TaskStatus.TODO, TaskPriority.HIGH, projects[1], categories[2]),
            ("Unit test coverage", "Increase test coverage to 80%", TaskStatus.IN_REVIEW, TaskPriority.HIGH, projects[1], categories[3]),
            ("Database optimization", "Optimize slow queries", TaskStatus.BACKLOG, TaskPriority.MEDIUM, projects[1], categories[4]),
            
            # Learning Goals
            ("Complete Python course", "Finish advanced Python module", TaskStatus.IN_PROGRESS, TaskPriority.HIGH, projects[2], categories[1]),
            ("Practice algorithms", "Solve 5 LeetCode problems", TaskStatus.TODO, TaskPriority.MEDIUM, projects[2], categories[1]),
            ("Watch tech talks", "View conference presentations", TaskStatus.TODO, TaskPriority.LOW, projects[2], categories[1]),
        ]
        
        created_tasks = 0
        for title, description, status, priority, project, category in tasks_data:
            # Check if task exists
            result = await session.exec(
                select(Task).where(
                    Task.title == title,
                    Task.creator_id == demo_user.id
                )
            )
            existing_task = result.first()
            
            if not existing_task:
                # Random due dates
                due_date = None
                if random.random() > 0.5:
                    due_date = datetime.now() + timedelta(days=random.randint(1, 30))
                
                task = Task(
                    title=title,
                    description=description,
                    status=status,
                    priority=priority,
                    project_id=project.id,
                    category_id=category.id,
                    creator_id=demo_user.id,
                    assignee_id=random.choice(users).id,
                    due_date=due_date,
                    completed=status == TaskStatus.DONE,
                    completion_date=datetime.now() if status == TaskStatus.DONE else None
                )
                session.add(task)
                created_tasks += 1
            else:
                print(f"Task already exists: {title}")
        
        await session.commit()
        print(f"Created {created_tasks} new tasks")
        
        print("\\n" + "="*50)
        print("Sample data creation completed!")
        print("="*50)
        print("\\nYou can now login with:")
        print("  Email: suleman@gmail.com")
        print("  Password: Suleman123")
        print("  Email: demo@example.com")
        print("  Password: demo123")

async def main():
    """Main entry point."""
    print("Initializing database...")
    await init_db()
    
    print("Creating sample data...")
    await create_sample_data()

if __name__ == "__main__":
    asyncio.run(main())
'''
        seed_script_path.write_text(seed_content)
        print_colored(f"✓ Created {seed_script_path}", Colors.GREEN)
    
    def check_health(self) -> bool:
        """Check if all services are healthy."""
        print_step("STEP 7", "Health Check")
        
        services = [
            ("Backend API", f"http://localhost:{self.backend_port}/docs"),
            ("Frontend", f"http://localhost:{self.frontend_port}"),
            ("Database", None),  # Will check via docker
        ]
        
        all_healthy = True
        
        for service_name, url in services:
            if url:
                try:
                    import requests
                    response = requests.get(url, timeout=5)
                    if response.status_code == 200:
                        print_colored(f"[OK] {service_name}: Healthy", Colors.GREEN)
                    else:
                        print_colored(f"[X] {service_name}: Unhealthy (Status: {response.status_code})", Colors.FAIL)
                        all_healthy = False
                except Exception as e:
                    print_colored(f"[X] {service_name}: Unreachable ({str(e)})", Colors.FAIL)
                    all_healthy = False
            else:
                # Check database via docker
                try:
                    output = run_command(
                        ["docker-compose", "exec", "database", "pg_isready", "-U", "postgres"],
                        cwd=self.project_root,
                        capture=True
                    )
                    if "accepting connections" in output:
                        print_colored(f"[OK] {service_name}: Healthy", Colors.GREEN)
                    else:
                        print_colored(f"[X] {service_name}: Unhealthy", Colors.FAIL)
                        all_healthy = False
                except:
                    print_colored(f"[X] {service_name}: Unreachable", Colors.FAIL)
                    all_healthy = False
        
        return all_healthy
    
    def show_summary(self) -> None:
        """Show deployment summary."""
        print_step("DEPLOYMENT COMPLETE", "Summary")
        
        print_colored("\nServices are running at:", Colors.GREEN, bold=True)
        print(f"  - Frontend:    http://localhost:{self.frontend_port}")
        print(f"  - Backend API: http://localhost:{self.backend_port}")
        print(f"  - API Docs:    http://localhost:{self.backend_port}/docs")
        print(f"  - Database:    localhost:{self.database_port}")
        
        print_colored("\nDefault credentials:", Colors.CYAN, bold=True)
        print(f"  - Email:    suleman@gmail.com")
        print(f"  - Password: Suleman123")
        print(f"  - Email:    demo@example.com")
        print(f"  - Password: demo123")
        
        print_colored("\nUseful commands:", Colors.BLUE, bold=True)
        print(f"  • View logs:       docker-compose logs -f")
        print(f"  • Stop services:   docker-compose down")
        print(f"  • Restart service: docker-compose restart [service]")
        print(f"  • Enter container: docker-compose exec [service] bash")
        
        print_colored("\n✨ Smart Task Management System is ready! ✨", Colors.GREEN, bold=True)

def main():
    """Main entry point for the deployment script."""
    parser = argparse.ArgumentParser(description="Deploy Smart Task Management System")
    parser.add_argument("--rebuild", action="store_true", help="Rebuild Docker images from scratch")
    parser.add_argument("--skip-seed", action="store_true", help="Skip creating sample data")
    parser.add_argument("--project-root", type=Path, default=Path.cwd().parent, help="Project root directory")
    
    args = parser.parse_args()
    
    # Ensure we're in the correct directory
    if not args.project_root.exists():
        print_colored(f"Project root not found: {args.project_root}", Colors.FAIL)
        sys.exit(1)
    
    print_colored("\n>>> Smart Task Management System Deployment Script <<<", Colors.HEADER, bold=True)
    print_colored("="*60, Colors.HEADER)
    
    deployer = DeploymentManager(args.project_root)
    
    try:
        # Check prerequisites
        if not deployer.check_prerequisites():
            print_colored("\n❌ Prerequisites check failed. Please install missing tools.", Colors.FAIL)
            sys.exit(1)
        
        # Check environment files
        deployer.check_env_files()
        
        # Build Docker images
        deployer.build_docker_images(rebuild=args.rebuild)
        
        # Start containers
        deployer.start_containers()
        
        # Run migrations
        deployer.run_migrations()
        
        # Create sample data
        if not args.skip_seed:
            deployer.create_sample_data()
        
        # Health check
        if deployer.check_health():
            deployer.show_summary()
        else:
            print_colored("\n⚠️  Some services are not healthy. Check logs for details.", Colors.WARNING)
            
    except KeyboardInterrupt:
        print_colored("\n\n🛑 Deployment interrupted by user", Colors.WARNING)
        sys.exit(1)
    except Exception as e:
        print_colored(f"\n❌ Deployment failed: {str(e)}", Colors.FAIL)
        sys.exit(1)

if __name__ == "__main__":
    main()