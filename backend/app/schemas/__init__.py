"""
Schema definitions for API request and response models.
Separates data validation concerns from endpoint logic.
"""
from .task import TaskCreateRequest, TaskUpdateRequest, TaskResponse, TaskListResponse, TaskStatsResponse, TaskSearchRequest
from .auth import SignInRequest, SignUpRequest, AuthResponse, RefreshTokenRequest, UserResponse, MessageResponse, TokenRefreshResponse, HealthResponse
from .category import CategoryCreateRequest, CategoryUpdateRequest, CategoryResponse, CategoryListResponse, CategoryStatsResponse, CategoryReorderRequest, CategoryMoveTasksRequest
from .bulk import BulkTaskIds, BulkUpdateRequest, BulkCompleteRequest, BulkDeleteRequest, BulkOperationResponse, BulkStatusChangeRequest, BulkPriorityChangeRequest, BulkCategoryAssignRequest, BulkOperationSummary
from .websocket import WebSocketMessage, WebSocketResponse, TaskEventData, ConnectionStatsResponse, BroadcastTaskEventRequest, CleanupConnectionsRequest, CleanupConnectionsResponse, WebSocketMetricsResponse

__all__ = [
    # Task schemas
    "TaskCreateRequest",
    "TaskUpdateRequest", 
    "TaskResponse",
    "TaskListResponse",
    "TaskStatsResponse",
    "TaskSearchRequest",
    
    # Auth schemas
    "SignInRequest",
    "SignUpRequest",
    "AuthResponse",
    "RefreshTokenRequest", 
    "UserResponse",
    "MessageResponse",
    "TokenRefreshResponse",
    "HealthResponse",
    
    # Category schemas
    "CategoryCreateRequest",
    "CategoryUpdateRequest",
    "CategoryResponse",
    "CategoryListResponse",
    "CategoryStatsResponse",
    "CategoryReorderRequest",
    "CategoryMoveTasksRequest",
    
    # Bulk operation schemas
    "BulkTaskIds",
    "BulkUpdateRequest",
    "BulkCompleteRequest", 
    "BulkDeleteRequest",
    "BulkOperationResponse",
    "BulkStatusChangeRequest",
    "BulkPriorityChangeRequest",
    "BulkCategoryAssignRequest", 
    "BulkOperationSummary",
    
    # WebSocket schemas
    "WebSocketMessage",
    "WebSocketResponse",
    "TaskEventData",
    "ConnectionStatsResponse",
    "BroadcastTaskEventRequest",
    "CleanupConnectionsRequest",
    "CleanupConnectionsResponse",
    "WebSocketMetricsResponse"
]