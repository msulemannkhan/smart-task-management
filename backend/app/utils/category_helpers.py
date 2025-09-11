"""
Category helper utilities.
Business logic and validation helpers for category operations.
"""
from typing import List, Optional, Dict, Any
import uuid
import logging
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func, distinct, update
from datetime import datetime

from app.models.database import Category, Project, Task, ProjectMember
from app.exceptions.base import ValidationError, NotFoundError, ConflictError, PermissionDeniedError

logger = logging.getLogger(__name__)


class CategoryPermissionChecker:
    """Category permission checking utilities"""
    
    @staticmethod
    async def check_category_access(
        category_id: uuid.UUID, 
        user_id: uuid.UUID, 
        session: AsyncSession,
        require_ownership: bool = False
    ) -> Category:
        """Check if user can access category and return it"""
        stmt = select(Category).join(Project).where(
            and_(
                Category.id == category_id,
                Project.owner_id == user_id,
                Category.project_id == Project.id
            )
        )
        result = await session.execute(stmt)
        category = result.scalar_one_or_none()
        
        if not category:
            raise NotFoundError(f"Category {category_id} not found or access denied")
        
        return category
    
    @staticmethod
    async def check_project_access(
        project_id: uuid.UUID, 
        user_id: uuid.UUID, 
        session: AsyncSession
    ) -> Project:
        """Check if user can access project and return it"""
        # Allow owner or member
        owner_stmt = select(Project).where(
            and_(
                Project.id == project_id,
                Project.owner_id == user_id
            )
        )
        owner_res = await session.execute(owner_stmt)
        project = owner_res.scalar_one_or_none()
        if project:
            return project

        member_stmt = select(Project).join(ProjectMember, ProjectMember.project_id == Project.id).where(
            and_(
                Project.id == project_id,
                ProjectMember.user_id == user_id
            )
        )
        member_res = await session.execute(member_stmt)
        project = member_res.scalar_one_or_none()
        if project:
            return project

        raise NotFoundError(f"Project {project_id} not found or access denied")


class CategoryValidator:
    """Category validation utilities"""
    
    @staticmethod
    async def validate_category_name_unique(
        name: str,
        project_id: uuid.UUID,
        session: AsyncSession,
        exclude_category_id: Optional[uuid.UUID] = None
    ) -> None:
        """Validate that category name is unique within project"""
        stmt = select(Category).where(
            and_(
                Category.project_id == project_id,
                Category.name == name
            )
        )
        
        if exclude_category_id:
            stmt = stmt.where(Category.id != exclude_category_id)
        
        result = await session.execute(stmt)
        existing_category = result.scalar_one_or_none()
        
        if existing_category:
            raise ConflictError(
                f"Category with name '{name}' already exists in this project",
                details={"existing_category_id": str(existing_category.id)}
            )
    
    @staticmethod
    def validate_category_color(color: str) -> str:
        """Validate and normalize category color"""
        import re
        if not re.match(r'^#[0-9A-Fa-f]{6}$', color):
            raise ValidationError("Color must be in hex format (#RRGGBB)")
        return color.upper()
    
    @staticmethod
    async def validate_category_deletion(
        category_id: uuid.UUID,
        session: AsyncSession,
        move_tasks_to_category_id: Optional[uuid.UUID] = None
    ) -> int:
        """Validate category deletion and return task count"""
        # Count tasks in this category
        task_count_stmt = select(func.count(Task.id)).where(
            and_(
                Task.category_id == category_id,
                Task.is_deleted == False
            )
        )
        result = await session.execute(task_count_stmt)
        task_count = result.scalar_one() or 0
        
        # If there are tasks and no target category specified, warn user
        if task_count > 0 and move_tasks_to_category_id is None:
            logger.warning(f"Deleting category {category_id} with {task_count} tasks - tasks will be uncategorized")
        
        return task_count
    
    @staticmethod
    async def validate_move_target_category(
        target_category_id: uuid.UUID,
        source_category: Category,
        user_id: uuid.UUID,
        session: AsyncSession
    ) -> Category:
        """Validate target category for moving tasks"""
        target_category = await CategoryPermissionChecker.check_category_access(
            target_category_id, user_id, session
        )
        
        if target_category.project_id != source_category.project_id:
            raise ValidationError("Target category must be in the same project")
        
        return target_category


class CategoryBusinessLogic:
    """Category business logic operations"""
    
    @staticmethod
    async def create_category(
        name: str,
        description: Optional[str],
        color: str,
        project_id: uuid.UUID,
        position: int,
        user_id: uuid.UUID,
        session: AsyncSession
    ) -> Category:
        """Create a new category with validation"""
        logger.info(f"Creating category '{name}' in project {project_id}")
        
        # Check project access
        await CategoryPermissionChecker.check_project_access(project_id, user_id, session)
        
        # Validate unique name
        await CategoryValidator.validate_category_name_unique(name, project_id, session)
        
        # Validate color
        normalized_color = CategoryValidator.validate_category_color(color)
        
        # Create category
        category = Category(
            name=name,
            description=description,
            color=normalized_color,
            project_id=project_id,
            created_by_id=user_id,
            position=position
        )
        
        session.add(category)
        await session.commit()
        await session.refresh(category)
        
        logger.info(f"Category created successfully: {category.id}")
        return category
    
    @staticmethod
    async def update_category(
        category_id: uuid.UUID,
        update_data: Dict[str, Any],
        user_id: uuid.UUID,
        session: AsyncSession
    ) -> Category:
        """Update category with validation"""
        logger.info(f"Updating category {category_id}")
        
        # Check access
        category = await CategoryPermissionChecker.check_category_access(
            category_id, user_id, session
        )
        
        # Validate name uniqueness if name is being updated
        if 'name' in update_data and update_data['name'] != category.name:
            await CategoryValidator.validate_category_name_unique(
                update_data['name'], category.project_id, session, category_id
            )
        
        # Validate color if being updated
        if 'color' in update_data:
            update_data['color'] = CategoryValidator.validate_category_color(update_data['color'])
        
        # Apply updates
        for field, value in update_data.items():
            setattr(category, field, value)
        
        category.updated_at = datetime.utcnow()
        
        await session.commit()
        await session.refresh(category)
        
        logger.info(f"Category updated successfully: {category_id}")
        return category
    
    @staticmethod
    async def delete_category(
        category_id: uuid.UUID,
        user_id: uuid.UUID,
        session: AsyncSession,
        move_tasks_to_category_id: Optional[uuid.UUID] = None
    ) -> int:
        """Delete category and handle tasks"""
        logger.info(f"Deleting category {category_id}")
        
        # Check access
        category = await CategoryPermissionChecker.check_category_access(
            category_id, user_id, session
        )
        
        # Validate deletion
        task_count = await CategoryValidator.validate_category_deletion(
            category_id, session, move_tasks_to_category_id
        )
        
        # Validate target category if specified
        if move_tasks_to_category_id:
            await CategoryValidator.validate_move_target_category(
                move_tasks_to_category_id, category, user_id, session
            )
        
        # Update tasks
        if task_count > 0:
            task_update_stmt = update(Task).where(
                Task.category_id == category_id
            ).values(category_id=move_tasks_to_category_id)
            
            await session.execute(task_update_stmt)
            logger.info(f"Moved {task_count} tasks to category {move_tasks_to_category_id}")
        
        # Delete category
        await session.delete(category)
        await session.commit()
        
        logger.info(f"Category deleted successfully: {category_id}")
        return task_count


class CategoryQueryHelper:
    """Category query and data retrieval helpers"""
    
    @staticmethod
    async def get_categories_by_project(
        project_id: uuid.UUID,
        user_id: uuid.UUID,
        session: AsyncSession
    ) -> List[Category]:
        """Get all categories for a project"""
        # Verify project access first
        await CategoryPermissionChecker.check_project_access(project_id, user_id, session)
        
        stmt = select(Category).where(
            Category.project_id == project_id
        ).order_by(Category.position, Category.name)
        
        result = await session.execute(stmt)
        return result.scalars().all()
    
    @staticmethod
    async def get_task_count_for_category(
        category_id: uuid.UUID, 
        session: AsyncSession
    ) -> int:
        """Get number of active tasks in a category"""
        stmt = select(func.count(Task.id)).where(
            and_(
                Task.category_id == category_id,
                Task.is_deleted == False
            )
        )
        result = await session.execute(stmt)
        return result.scalar_one() or 0
    
    @staticmethod
    async def get_category_statistics(
        user_id: uuid.UUID, 
        session: AsyncSession
    ) -> Dict[str, Any]:
        """Get comprehensive category statistics for user"""
        # Total categories
        categories_stmt = select(func.count(Category.id)).join(Project).outerjoin(ProjectMember, ProjectMember.project_id == Project.id).where(
            or_(Project.owner_id == user_id, ProjectMember.user_id == user_id)
        )
        categories_result = await session.execute(categories_stmt)
        total_categories = categories_result.scalar_one() or 0
        
        # Total tasks in categories
        tasks_stmt = select(func.count(Task.id)).join(Category).join(Project).outerjoin(ProjectMember, ProjectMember.project_id == Project.id).where(
            and_(
                or_(Project.owner_id == user_id, ProjectMember.user_id == user_id),
                Task.is_deleted == False
            )
        )
        tasks_result = await session.execute(tasks_stmt)
        total_tasks = tasks_result.scalar_one() or 0
        
        # Categories with tasks
        categories_with_tasks_stmt = select(func.count(distinct(Category.id))).join(Task).join(Project).outerjoin(ProjectMember, ProjectMember.project_id == Project.id).where(
            and_(
                or_(Project.owner_id == user_id, ProjectMember.user_id == user_id),
                Task.is_deleted == False
            )
        )
        categories_with_tasks_result = await session.execute(categories_with_tasks_stmt)
        categories_with_tasks = categories_with_tasks_result.scalar_one() or 0
        
        # Average tasks per category
        avg_tasks = total_tasks / total_categories if total_categories > 0 else 0.0
        
        # Most used colors
        colors_stmt = select(Category.color, func.count(Category.id)).join(Project).outerjoin(ProjectMember, ProjectMember.project_id == Project.id).where(
            or_(Project.owner_id == user_id, ProjectMember.user_id == user_id)
        ).group_by(Category.color).order_by(func.count(Category.id).desc()).limit(5)
        colors_result = await session.execute(colors_stmt)
        most_used_colors = [row[0] for row in colors_result.fetchall()]
        
        return {
            "total_categories": total_categories,
            "total_tasks": total_tasks,
            "categories_with_tasks": categories_with_tasks,
            "avg_tasks_per_category": round(avg_tasks, 2),
            "most_used_colors": most_used_colors
        }


class CategoryEventLogger:
    """Category event logging utilities"""
    
    @staticmethod
    def log_category_created(category: Category, user_id: uuid.UUID):
        """Log category creation"""
        logger.info(f"Category created: {category.id} '{category.name}' by user {user_id}")
    
    @staticmethod
    def log_category_updated(category: Category, user_id: uuid.UUID, changed_fields: List[str]):
        """Log category update"""
        logger.info(f"Category updated: {category.id} by user {user_id} - fields: {changed_fields}")
    
    @staticmethod
    def log_category_deleted(category_id: uuid.UUID, user_id: uuid.UUID, task_count: int):
        """Log category deletion"""
        logger.info(f"Category deleted: {category_id} by user {user_id} - affected {task_count} tasks")