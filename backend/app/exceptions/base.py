"""
Base exceptions for the Smart Task Management system.
Provides structured error handling with proper HTTP status codes and detailed error information.
"""
from typing import Optional, Dict, Any
from fastapi import HTTPException, status


class SmartTaskException(Exception):
    """Base exception for all Smart Task Management errors"""
    
    def __init__(
        self, 
        message: str, 
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        details: Optional[Dict[str, Any]] = None,
        error_code: Optional[str] = None
    ):
        self.message = message
        self.status_code = status_code
        self.details = details or {}
        self.error_code = error_code or self.__class__.__name__
        super().__init__(self.message)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert exception to dictionary for API response"""
        result = {
            "error": True,
            "error_code": self.error_code,
            "message": self.message,
            "status_code": self.status_code
        }
        
        if self.details:
            result["details"] = self.details
            
        return result
    
    def to_http_exception(self) -> HTTPException:
        """Convert to FastAPI HTTPException"""
        return HTTPException(
            status_code=self.status_code,
            detail=self.to_dict()
        )


class ValidationError(SmartTaskException):
    """Raised when request validation fails"""
    
    def __init__(self, message: str, field: Optional[str] = None, value: Any = None):
        details = {}
        if field:
            details["field"] = field
        if value is not None:
            details["invalid_value"] = str(value)
            
        super().__init__(
            message=message,
            status_code=status.HTTP_400_BAD_REQUEST,
            details=details,
            error_code="VALIDATION_ERROR"
        )


class NotFoundError(SmartTaskException):
    """Raised when a requested resource is not found"""
    
    def __init__(self, resource_type: str, resource_id: Optional[str] = None):
        message = f"{resource_type} not found"
        details = {"resource_type": resource_type}
        
        if resource_id:
            message += f" (ID: {resource_id})"
            details["resource_id"] = resource_id
            
        super().__init__(
            message=message,
            status_code=status.HTTP_404_NOT_FOUND,
            details=details,
            error_code="NOT_FOUND"
        )


class PermissionDeniedError(SmartTaskException):
    """Raised when user lacks permission for an action"""
    
    def __init__(self, action: str, resource: Optional[str] = None, reason: Optional[str] = None):
        message = f"Permission denied for action: {action}"
        details = {"action": action}
        
        if resource:
            message += f" on {resource}"
            details["resource"] = resource
            
        if reason:
            message += f" - {reason}"
            details["reason"] = reason
            
        super().__init__(
            message=message,
            status_code=status.HTTP_403_FORBIDDEN,
            details=details,
            error_code="PERMISSION_DENIED"
        )


class ConflictError(SmartTaskException):
    """Raised when an operation conflicts with current state"""
    
    def __init__(self, message: str, conflicting_resource: Optional[str] = None):
        details = {}
        if conflicting_resource:
            details["conflicting_resource"] = conflicting_resource
            
        super().__init__(
            message=message,
            status_code=status.HTTP_409_CONFLICT,
            details=details,
            error_code="CONFLICT"
        )


class BusinessLogicError(SmartTaskException):
    """Raised when business logic validation fails"""
    
    def __init__(self, message: str, rule: Optional[str] = None):
        details = {}
        if rule:
            details["violated_rule"] = rule
            
        super().__init__(
            message=message,
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            details=details,
            error_code="BUSINESS_LOGIC_ERROR"
        )


class ExternalServiceError(SmartTaskException):
    """Raised when external service (like Supabase) fails"""
    
    def __init__(self, service: str, message: str, original_error: Optional[Exception] = None):
        details = {"service": service}
        if original_error:
            details["original_error"] = str(original_error)
            
        super().__init__(
            message=f"External service error ({service}): {message}",
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            details=details,
            error_code="EXTERNAL_SERVICE_ERROR"
        )


class RateLimitError(SmartTaskException):
    """Raised when rate limit is exceeded"""
    
    def __init__(self, limit: int, window: str, retry_after: Optional[int] = None):
        message = f"Rate limit exceeded: {limit} requests per {window}"
        details = {
            "limit": limit,
            "window": window
        }
        
        if retry_after:
            message += f". Try again in {retry_after} seconds."
            details["retry_after"] = retry_after
            
        super().__init__(
            message=message,
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            details=details,
            error_code="RATE_LIMIT_EXCEEDED"
        )


class WebSocketError(SmartTaskException):
    """Raised when WebSocket operations fail"""
    
    def __init__(self, message: str, connection_id: Optional[str] = None, user_id: Optional[str] = None):
        details = {}
        if connection_id:
            details["connection_id"] = connection_id
        if user_id:
            details["user_id"] = user_id
            
        super().__init__(
            message=f"WebSocket error: {message}",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            details=details,
            error_code="WEBSOCKET_ERROR"
        )