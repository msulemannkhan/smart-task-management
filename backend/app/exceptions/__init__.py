"""
Custom exceptions and error handling for the Smart Task Management API.
"""
from .base import (
    SmartTaskException,
    ValidationError, 
    NotFoundError,
    PermissionDeniedError,
    ConflictError,
    BusinessLogicError
)
from .handlers import setup_exception_handlers

__all__ = [
    "SmartTaskException",
    "ValidationError",
    "NotFoundError", 
    "PermissionDeniedError",
    "ConflictError",
    "BusinessLogicError",
    "setup_exception_handlers"
]