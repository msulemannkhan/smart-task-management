"""
Bulk operations endpoints using clean architecture.
Efficient bulk task operations with proper separation of concerns and comprehensive validation.
"""
from fastapi import APIRouter, Depends
import logging

from app.schemas.bulk import (
    BulkCompleteRequest,
    BulkUpdateRequest,
    BulkDeleteRequest,
    BulkStatusChangeRequest,
    BulkPriorityChangeRequest,
    BulkCategoryAssignRequest,
    BulkOperationResponse
)
from app.utils.bulk_helpers import (
    BulkOperationExecutor,
    BulkOperationLogger,
    BulkOperationAnalyzer
)
from app.core.auth import CurrentUser
from app.core.database import get_session
from app.models.database import User
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/complete", response_model=BulkOperationResponse)
async def bulk_complete_tasks(
    request: BulkCompleteRequest,
    current_user: User = CurrentUser,
    session: AsyncSession = Depends(get_session)
):
    """
    Mark multiple tasks as complete or incomplete with validation.
    
    - **task_ids**: List of 1-1000 unique task IDs
    - **completed**: Mark as completed (true) or uncompleted (false)
    
    Efficient single-query operation with comprehensive error handling.
    """
    logger.info(f"Bulk complete request for {len(request.task_ids)} tasks by user {current_user.id}")
    
    # Log operation start
    BulkOperationLogger.log_bulk_operation_start(
        "bulk_complete", len(request.task_ids), current_user.id
    )
    
    try:
        # Execute bulk complete using helper
        result = await BulkOperationExecutor.execute_bulk_complete(
            task_ids=request.task_ids,
            user_id=current_user.id,
            completed=request.completed,
            session=session
        )
        
        # Log operation completion
        BulkOperationLogger.log_bulk_operation_complete(
            result["operation"],
            result["requested_count"], 
            result["affected_count"],
            result["execution_time_ms"],
            current_user.id
        )
        
        logger.info(f"Bulk complete completed: {result['affected_count']}/{result['requested_count']} tasks")
        return BulkOperationResponse(**result)
        
    except Exception as e:
        # Log failed bulk complete with both standard logger and event logger
        logger.error(f"Bulk complete operation failed for user {current_user.id}: {str(e)}")
        BulkOperationLogger.log_bulk_operation_validation_error(
            "bulk_complete", str(e), current_user.id
        )
        raise


@router.post("/update", response_model=BulkOperationResponse)
async def bulk_update_tasks(
    request: BulkUpdateRequest,
    current_user: User = CurrentUser,
    session: AsyncSession = Depends(get_session)
):
    """
    Update multiple tasks with same values efficiently.
    
    - **task_ids**: List of 1-1000 unique task IDs
    - **status**: Optional new status
    - **priority**: Optional new priority  
    - **category_id**: Optional new category (null to remove)
    - **assignee_id**: Optional new assignee (null to unassign)
    - **completed**: Optional completion status
    - **tags**: Optional new tags list (max 10 tags)
    
    All update fields are optional for flexible partial updates.
    """
    logger.info(f"Bulk update request for {len(request.task_ids)} tasks by user {current_user.id}")
    
    # Build update data from request
    update_data = {}
    if request.status is not None:
        update_data["status"] = request.status
    if request.priority is not None:
        update_data["priority"] = request.priority
    if request.category_id is not None:
        update_data["category_id"] = request.category_id
    if request.assignee_id is not None:
        update_data["assignee_id"] = request.assignee_id
    if request.completed is not None:
        update_data["completed"] = request.completed
    if request.tags is not None:
        update_data["tags"] = request.tags
    
    # Log operation start
    BulkOperationLogger.log_bulk_operation_start(
        "bulk_update", len(request.task_ids), current_user.id
    )
    
    try:
        # Execute bulk update using helper
        result = await BulkOperationExecutor.execute_bulk_update(
            task_ids=request.task_ids,
            update_data=update_data,
            user_id=current_user.id,
            session=session
        )
        
        # Log operation completion
        BulkOperationLogger.log_bulk_operation_complete(
            result["operation"],
            result["requested_count"],
            result["affected_count"], 
            result["execution_time_ms"],
            current_user.id
        )
        
        logger.info(f"Bulk update completed: {result['affected_count']}/{result['requested_count']} tasks")
        return BulkOperationResponse(**result)
        
    except Exception as e:
        # Log failed bulk update with both standard logger and event logger
        logger.error(f"Bulk update operation failed for user {current_user.id}: {str(e)}")
        BulkOperationLogger.log_bulk_operation_validation_error(
            "bulk_update", str(e), current_user.id
        )
        raise


@router.post("/delete", response_model=BulkOperationResponse)
async def bulk_delete_tasks(
    request: BulkDeleteRequest,
    current_user: User = CurrentUser,
    session: AsyncSession = Depends(get_session)
):
    """
    Delete multiple tasks efficiently with soft/hard delete options.
    
    - **task_ids**: List of 1-1000 unique task IDs
    - **hard_delete**: Permanently delete (true) or soft delete (false)
    
    Soft delete (default) marks tasks as deleted but preserves data.
    Hard delete permanently removes tasks and cannot be undone.
    """
    logger.info(f"Bulk delete request for {len(request.task_ids)} tasks (hard={request.hard_delete}) by user {current_user.id}")
    
    # Log operation start
    BulkOperationLogger.log_bulk_operation_start(
        "bulk_delete", len(request.task_ids), current_user.id
    )
    
    try:
        # Execute bulk delete using helper
        result = await BulkOperationExecutor.execute_bulk_delete(
            task_ids=request.task_ids,
            user_id=current_user.id,
            hard_delete=request.hard_delete,
            session=session
        )
        
        # Log operation completion
        BulkOperationLogger.log_bulk_operation_complete(
            result["operation"],
            result["requested_count"],
            result["affected_count"],
            result["execution_time_ms"], 
            current_user.id
        )
        
        logger.info(f"Bulk delete completed: {result['affected_count']}/{result['requested_count']} tasks")
        return BulkOperationResponse(**result)
        
    except Exception as e:
        # Log failed bulk delete with both standard logger and event logger
        logger.error(f"Bulk delete operation failed for user {current_user.id}: {str(e)}")
        BulkOperationLogger.log_bulk_operation_validation_error(
            "bulk_delete", str(e), current_user.id
        )
        raise


@router.post("/status", response_model=BulkOperationResponse)
async def bulk_change_status(
    request: BulkStatusChangeRequest,
    current_user: User = CurrentUser,
    session: AsyncSession = Depends(get_session)
):
    """
    Change status for multiple tasks efficiently.
    
    - **task_ids**: List of 1-1000 unique task IDs
    - **new_status**: New status for all tasks (TODO, IN_PROGRESS, COMPLETED, etc.)
    
    Updates task status in a single optimized query.
    """
    logger.info(f"Bulk status change request for {len(request.task_ids)} tasks to {request.new_status} by user {current_user.id}")
    
    # Log operation start
    BulkOperationLogger.log_bulk_operation_start(
        "bulk_change_status", len(request.task_ids), current_user.id
    )
    
    try:
        # Execute bulk status change using helper
        result = await BulkOperationExecutor.execute_bulk_status_change(
            task_ids=request.task_ids,
            new_status=request.new_status,
            user_id=current_user.id,
            session=session
        )
        
        # Log operation completion
        BulkOperationLogger.log_bulk_operation_complete(
            result["operation"],
            result["requested_count"],
            result["affected_count"],
            result["execution_time_ms"],
            current_user.id
        )
        
        logger.info(f"Bulk status change completed: {result['affected_count']}/{result['requested_count']} tasks")
        return BulkOperationResponse(**result)
        
    except Exception as e:
        # Log failed bulk status change with both standard logger and event logger  
        logger.error(f"Bulk status change operation failed for user {current_user.id}: {str(e)}")
        BulkOperationLogger.log_bulk_operation_validation_error(
            "bulk_change_status", str(e), current_user.id
        )
        raise


@router.post("/priority", response_model=BulkOperationResponse)
async def bulk_change_priority(
    request: BulkPriorityChangeRequest,
    current_user: User = CurrentUser,
    session: AsyncSession = Depends(get_session)
):
    """
    Change priority for multiple tasks efficiently.
    
    - **task_ids**: List of 1-1000 unique task IDs
    - **new_priority**: New priority for all tasks (LOW, MEDIUM, HIGH, URGENT)
    
    Updates task priority in a single optimized query.
    """
    logger.info(f"Bulk priority change request for {len(request.task_ids)} tasks to {request.new_priority} by user {current_user.id}")
    
    # Log operation start
    BulkOperationLogger.log_bulk_operation_start(
        "bulk_change_priority", len(request.task_ids), current_user.id
    )
    
    try:
        # Execute bulk priority change using helper
        result = await BulkOperationExecutor.execute_bulk_priority_change(
            task_ids=request.task_ids,
            new_priority=request.new_priority,
            user_id=current_user.id,
            session=session
        )
        
        # Log operation completion
        BulkOperationLogger.log_bulk_operation_complete(
            result["operation"],
            result["requested_count"],
            result["affected_count"],
            result["execution_time_ms"],
            current_user.id
        )
        
        logger.info(f"Bulk priority change completed: {result['affected_count']}/{result['requested_count']} tasks")
        return BulkOperationResponse(**result)
        
    except Exception as e:
        # Log failed bulk priority change with both standard logger and event logger
        logger.error(f"Bulk priority change operation failed for user {current_user.id}: {str(e)}")
        BulkOperationLogger.log_bulk_operation_validation_error(
            "bulk_change_priority", str(e), current_user.id
        )
        raise


@router.post("/category", response_model=BulkOperationResponse)
async def bulk_assign_category(
    request: BulkCategoryAssignRequest,
    current_user: User = CurrentUser,
    session: AsyncSession = Depends(get_session)
):
    """
    Assign or remove category for multiple tasks efficiently.
    
    - **task_ids**: List of 1-1000 unique task IDs
    - **category_id**: Category to assign (null to remove category)
    
    Validates category access before assignment.
    Pass null category_id to remove tasks from their categories.
    """
    logger.info(f"Bulk category assign request for {len(request.task_ids)} tasks to category {request.category_id} by user {current_user.id}")
    
    # Log operation start
    BulkOperationLogger.log_bulk_operation_start(
        "bulk_assign_category", len(request.task_ids), current_user.id
    )
    
    try:
        # Execute bulk category assignment using helper
        result = await BulkOperationExecutor.execute_bulk_category_assign(
            task_ids=request.task_ids,
            category_id=request.category_id,
            user_id=current_user.id,
            session=session
        )
        
        # Log operation completion
        BulkOperationLogger.log_bulk_operation_complete(
            result["operation"],
            result["requested_count"],
            result["affected_count"],
            result["execution_time_ms"],
            current_user.id
        )
        
        # Analyze operation efficiency for large operations
        if len(request.task_ids) > 100:
            analysis = BulkOperationAnalyzer.analyze_operation_efficiency(
                result["operation"],
                result["requested_count"],
                result["affected_count"], 
                result["execution_time_ms"]
            )
            logger.info(f"Bulk operation analysis: {analysis}")
        
        logger.info(f"Bulk category assign completed: {result['affected_count']}/{result['requested_count']} tasks")
        return BulkOperationResponse(**result)
        
    except Exception as e:
        # Log failed bulk category assign with both standard logger and event logger
        logger.error(f"Bulk category assign operation failed for user {current_user.id}: {str(e)}")
        BulkOperationLogger.log_bulk_operation_validation_error(
            "bulk_assign_category", str(e), current_user.id
        )
        raise