"""
Bulk operations helper utilities.
Business logic and validation helpers for bulk task operations.
"""
from typing import List, Optional, Dict, Any
import uuid
import logging
import time
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.task_repository import TaskRepository
from app.models.database import TaskStatus, TaskPriority
from app.exceptions.base import ValidationError, BusinessLogicError

logger = logging.getLogger(__name__)


class BulkOperationValidator:
    """Bulk operation validation utilities"""
    
    @staticmethod
    def validate_bulk_operation_limits(task_ids: List[uuid.UUID], operation_type: str) -> None:
        """Validate bulk operation limits and constraints"""
        if not task_ids:
            raise ValidationError("At least one task ID is required for bulk operations")
        
        if len(task_ids) > 1000:
            raise ValidationError(f"Maximum 1000 tasks allowed per bulk operation, got {len(task_ids)}")
        
        # Check for duplicates
        unique_ids = set(task_ids)
        if len(unique_ids) != len(task_ids):
            raise ValidationError("Duplicate task IDs found in bulk operation")
        
        logger.info(f"Bulk {operation_type} operation validated for {len(task_ids)} tasks")
    
    @staticmethod
    def validate_bulk_update_data(update_data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate bulk update data and return cleaned data"""
        if not update_data:
            raise ValidationError("No update fields provided for bulk operation")
        
        # Validate tags if present
        if 'tags' in update_data and update_data['tags'] is not None:
            tags = update_data['tags']
            if len(tags) > 10:
                raise ValidationError("Maximum 10 tags allowed per task")
            
            # Clean tags
            cleaned_tags = [tag.strip() for tag in tags if tag.strip()]
            update_data['tags'] = cleaned_tags if cleaned_tags else None
        
        return update_data
    
    @staticmethod
    async def validate_category_access(
        category_id: Optional[uuid.UUID], 
        user_id: uuid.UUID,
        session: AsyncSession
    ) -> None:
        """Validate user has access to category for bulk assignment"""
        if category_id is not None:
            from app.utils.category_helpers import CategoryPermissionChecker
            try:
                await CategoryPermissionChecker.check_category_access(
                    category_id, user_id, session
                )
            except Exception:
                raise ValidationError(f"Category {category_id} not found or access denied")


class BulkOperationExecutor:
    """Bulk operation execution utilities"""
    
    @staticmethod
    async def execute_bulk_complete(
        task_ids: List[uuid.UUID],
        user_id: uuid.UUID,
        completed: bool,
        session: AsyncSession
    ) -> Dict[str, Any]:
        """Execute bulk complete/uncomplete operation"""
        operation_type = "bulk_complete"
        start_time = time.time()
        
        logger.info(f"Starting {operation_type} for {len(task_ids)} tasks")
        
        # Validate operation
        BulkOperationValidator.validate_bulk_operation_limits(task_ids, operation_type)
        
        # Execute operation
        repo = TaskRepository(session)
        affected_count = await repo.bulk_complete(
            task_ids=task_ids,
            user_id=user_id,
            completed=completed
        )
        
        execution_time = int((time.time() - start_time) * 1000)
        
        # Determine failed IDs
        failed_ids = []
        if affected_count < len(task_ids):
            # For now, we don't have detailed failure info, so we can't specify which ones failed
            logger.warning(f"Bulk complete: {len(task_ids) - affected_count} tasks failed")
        
        result = {
            "operation": operation_type,
            "requested_count": len(task_ids),
            "affected_count": affected_count,
            "success": affected_count == len(task_ids),
            "execution_time_ms": execution_time,
            "failed_ids": failed_ids,
            "warnings": []
        }
        
        if affected_count < len(task_ids):
            result["warnings"].append(f"{len(task_ids) - affected_count} tasks could not be updated (not found or access denied)")
        
        logger.info(f"Bulk complete completed: {affected_count}/{len(task_ids)} tasks affected")
        return result
    
    @staticmethod
    async def execute_bulk_update(
        task_ids: List[uuid.UUID],
        update_data: Dict[str, Any],
        user_id: uuid.UUID,
        session: AsyncSession
    ) -> Dict[str, Any]:
        """Execute bulk update operation"""
        operation_type = "bulk_update"
        start_time = time.time()
        
        logger.info(f"Starting {operation_type} for {len(task_ids)} tasks with data: {update_data}")
        
        # Validate operation
        BulkOperationValidator.validate_bulk_operation_limits(task_ids, operation_type)
        validated_data = BulkOperationValidator.validate_bulk_update_data(update_data)
        
        # Validate category access if category is being updated
        if 'category_id' in validated_data:
            await BulkOperationValidator.validate_category_access(
                validated_data['category_id'], user_id, session
            )
        
        # Execute operation
        repo = TaskRepository(session)
        affected_count = await repo.bulk_update(
            task_ids=task_ids,
            update_data=validated_data,
            user_id=user_id
        )
        
        execution_time = int((time.time() - start_time) * 1000)
        
        result = {
            "operation": operation_type,
            "requested_count": len(task_ids),
            "affected_count": affected_count,
            "success": affected_count == len(task_ids),
            "execution_time_ms": execution_time,
            "failed_ids": [],
            "warnings": []
        }
        
        if affected_count < len(task_ids):
            result["warnings"].append(f"{len(task_ids) - affected_count} tasks could not be updated (not found or access denied)")
        
        logger.info(f"Bulk update completed: {affected_count}/{len(task_ids)} tasks affected")
        return result
    
    @staticmethod
    async def execute_bulk_delete(
        task_ids: List[uuid.UUID],
        user_id: uuid.UUID,
        hard_delete: bool,
        session: AsyncSession
    ) -> Dict[str, Any]:
        """Execute bulk delete operation"""
        operation_type = "bulk_delete"
        start_time = time.time()
        
        logger.info(f"Starting {operation_type} for {len(task_ids)} tasks (hard_delete={hard_delete})")
        
        # Validate operation
        BulkOperationValidator.validate_bulk_operation_limits(task_ids, operation_type)
        
        # Execute operation
        repo = TaskRepository(session)
        affected_count = await repo.bulk_delete(
            task_ids=task_ids,
            user_id=user_id,
            hard_delete=hard_delete
        )
        
        execution_time = int((time.time() - start_time) * 1000)
        
        result = {
            "operation": operation_type,
            "requested_count": len(task_ids),
            "affected_count": affected_count,
            "success": affected_count == len(task_ids),
            "execution_time_ms": execution_time,
            "failed_ids": [],
            "warnings": []
        }
        
        if hard_delete:
            result["warnings"].append("Tasks were permanently deleted and cannot be recovered")
        
        if affected_count < len(task_ids):
            result["warnings"].append(f"{len(task_ids) - affected_count} tasks could not be deleted (not found or access denied)")
        
        logger.info(f"Bulk delete completed: {affected_count}/{len(task_ids)} tasks affected")
        return result
    
    @staticmethod
    async def execute_bulk_status_change(
        task_ids: List[uuid.UUID],
        new_status: TaskStatus,
        user_id: uuid.UUID,
        session: AsyncSession
    ) -> Dict[str, Any]:
        """Execute bulk status change operation"""
        operation_type = "bulk_change_status"
        start_time = time.time()
        
        logger.info(f"Starting {operation_type} for {len(task_ids)} tasks to status {new_status}")
        
        # Validate operation
        BulkOperationValidator.validate_bulk_operation_limits(task_ids, operation_type)
        
        # Execute operation
        repo = TaskRepository(session)
        affected_count = await repo.bulk_change_status(
            task_ids=task_ids,
            user_id=user_id,
            new_status=new_status
        )
        
        execution_time = int((time.time() - start_time) * 1000)
        
        result = {
            "operation": operation_type,
            "requested_count": len(task_ids),
            "affected_count": affected_count,
            "success": affected_count == len(task_ids),
            "execution_time_ms": execution_time,
            "failed_ids": [],
            "warnings": []
        }
        
        if affected_count < len(task_ids):
            result["warnings"].append(f"{len(task_ids) - affected_count} tasks could not be updated (not found or access denied)")
        
        logger.info(f"Bulk status change completed: {affected_count}/{len(task_ids)} tasks affected")
        return result
    
    @staticmethod
    async def execute_bulk_priority_change(
        task_ids: List[uuid.UUID],
        new_priority: TaskPriority,
        user_id: uuid.UUID,
        session: AsyncSession
    ) -> Dict[str, Any]:
        """Execute bulk priority change operation"""
        operation_type = "bulk_change_priority"
        start_time = time.time()
        
        logger.info(f"Starting {operation_type} for {len(task_ids)} tasks to priority {new_priority}")
        
        # Validate operation
        BulkOperationValidator.validate_bulk_operation_limits(task_ids, operation_type)
        
        # Execute operation
        repo = TaskRepository(session)
        affected_count = await repo.bulk_change_priority(
            task_ids=task_ids,
            user_id=user_id,
            new_priority=new_priority
        )
        
        execution_time = int((time.time() - start_time) * 1000)
        
        result = {
            "operation": operation_type,
            "requested_count": len(task_ids),
            "affected_count": affected_count,
            "success": affected_count == len(task_ids),
            "execution_time_ms": execution_time,
            "failed_ids": [],
            "warnings": []
        }
        
        if affected_count < len(task_ids):
            result["warnings"].append(f"{len(task_ids) - affected_count} tasks could not be updated (not found or access denied)")
        
        logger.info(f"Bulk priority change completed: {affected_count}/{len(task_ids)} tasks affected")
        return result
    
    @staticmethod
    async def execute_bulk_category_assign(
        task_ids: List[uuid.UUID],
        category_id: Optional[uuid.UUID],
        user_id: uuid.UUID,
        session: AsyncSession
    ) -> Dict[str, Any]:
        """Execute bulk category assignment operation"""
        operation_type = "bulk_assign_category"
        start_time = time.time()
        
        logger.info(f"Starting {operation_type} for {len(task_ids)} tasks to category {category_id}")
        
        # Validate operation
        BulkOperationValidator.validate_bulk_operation_limits(task_ids, operation_type)
        
        # Validate category access
        await BulkOperationValidator.validate_category_access(category_id, user_id, session)
        
        # Execute operation
        repo = TaskRepository(session)
        affected_count = await repo.bulk_assign_category(
            task_ids=task_ids,
            user_id=user_id,
            category_id=category_id
        )
        
        execution_time = int((time.time() - start_time) * 1000)
        
        result = {
            "operation": operation_type,
            "requested_count": len(task_ids),
            "affected_count": affected_count,
            "success": affected_count == len(task_ids),
            "execution_time_ms": execution_time,
            "failed_ids": [],
            "warnings": []
        }
        
        if category_id is None:
            result["warnings"].append("Tasks were removed from their categories")
        
        if affected_count < len(task_ids):
            result["warnings"].append(f"{len(task_ids) - affected_count} tasks could not be updated (not found or access denied)")
        
        logger.info(f"Bulk category assign completed: {affected_count}/{len(task_ids)} tasks affected")
        return result


class BulkOperationLogger:
    """Bulk operation event logging utilities"""
    
    @staticmethod
    def log_bulk_operation_start(operation_type: str, task_count: int, user_id: uuid.UUID):
        """Log start of bulk operation"""
        logger.info(f"Bulk operation started: {operation_type} for {task_count} tasks by user {user_id}")
    
    @staticmethod
    def log_bulk_operation_complete(
        operation_type: str, 
        requested_count: int,
        affected_count: int,
        execution_time_ms: int,
        user_id: uuid.UUID
    ):
        """Log completion of bulk operation"""
        success_rate = (affected_count / requested_count * 100) if requested_count > 0 else 0
        logger.info(
            f"Bulk operation completed: {operation_type} - "
            f"{affected_count}/{requested_count} tasks ({success_rate:.1f}%) "
            f"in {execution_time_ms}ms by user {user_id}"
        )
    
    @staticmethod
    def log_bulk_operation_validation_error(operation_type: str, error: str, user_id: uuid.UUID):
        """Log bulk operation validation errors"""
        logger.warning(f"Bulk operation validation failed: {operation_type} - {error} - user {user_id}")


class BulkOperationAnalyzer:
    """Bulk operation analysis and optimization utilities"""
    
    @staticmethod
    def analyze_operation_efficiency(
        operation_type: str,
        requested_count: int,
        affected_count: int,
        execution_time_ms: int
    ) -> Dict[str, Any]:
        """Analyze bulk operation efficiency"""
        success_rate = (affected_count / requested_count * 100) if requested_count > 0 else 0
        tasks_per_second = (affected_count / (execution_time_ms / 1000)) if execution_time_ms > 0 else 0
        
        analysis = {
            "operation_type": operation_type,
            "success_rate": success_rate,
            "tasks_per_second": round(tasks_per_second, 2),
            "execution_time_ms": execution_time_ms,
            "efficiency_rating": "excellent" if success_rate >= 95 and tasks_per_second >= 100 else
                                "good" if success_rate >= 85 and tasks_per_second >= 50 else
                                "fair" if success_rate >= 70 else "poor"
        }
        
        return analysis
    
    @staticmethod
    def suggest_optimization(
        operation_type: str,
        requested_count: int,
        execution_time_ms: int
    ) -> List[str]:
        """Suggest optimizations for bulk operations"""
        suggestions = []
        
        if requested_count > 500 and execution_time_ms > 5000:
            suggestions.append("Consider breaking large operations into smaller batches")
        
        if execution_time_ms > 10000:
            suggestions.append("Consider using background processing for large operations")
        
        return suggestions