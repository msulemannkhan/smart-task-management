"""
Exception handlers for the Smart Task Management API.
Provides consistent error responses and logging.
"""
import logging
from typing import Union
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import IntegrityError, NoResultFound
from pydantic import ValidationError as PydanticValidationError

from .base import SmartTaskException, ValidationError, NotFoundError, ConflictError, ExternalServiceError

logger = logging.getLogger(__name__)


async def smart_task_exception_handler(request: Request, exc: SmartTaskException) -> JSONResponse:
    """Handle custom SmartTaskException"""
    logger.error(
        f"SmartTaskException: {exc.error_code} - {exc.message}",
        extra={
            "error_code": exc.error_code,
            "status_code": exc.status_code,
            "details": exc.details,
            "path": request.url.path,
            "method": request.method
        }
    )
    
    return JSONResponse(
        status_code=exc.status_code,
        content=exc.to_dict()
    )


async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """Handle FastAPI request validation errors"""
    errors = []
    for error in exc.errors():
        field_path = " -> ".join(str(x) for x in error["loc"][1:])  # Skip 'body'
        errors.append({
            "field": field_path,
            "message": error["msg"],
            "type": error["type"],
            "input": error.get("input")
        })
    
    logger.warning(
        f"Validation error on {request.method} {request.url.path}",
        extra={
            "validation_errors": errors,
            "path": request.url.path,
            "method": request.method
        }
    )
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": True,
            "error_code": "VALIDATION_ERROR",
            "message": "Request validation failed",
            "status_code": status.HTTP_422_UNPROCESSABLE_ENTITY,
            "details": {
                "validation_errors": errors
            }
        }
    )


async def pydantic_validation_exception_handler(request: Request, exc: PydanticValidationError) -> JSONResponse:
    """Handle Pydantic validation errors"""
    errors = []
    for error in exc.errors():
        field_path = " -> ".join(str(x) for x in error["loc"])
        errors.append({
            "field": field_path,
            "message": error["msg"],
            "type": error["type"]
        })
    
    logger.warning(
        f"Pydantic validation error on {request.method} {request.url.path}",
        extra={
            "validation_errors": errors,
            "path": request.url.path,
            "method": request.method
        }
    )
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": True,
            "error_code": "VALIDATION_ERROR",
            "message": "Data validation failed",
            "status_code": status.HTTP_422_UNPROCESSABLE_ENTITY,
            "details": {
                "validation_errors": errors
            }
        }
    )


async def integrity_error_handler(request: Request, exc: IntegrityError) -> JSONResponse:
    """Handle database integrity constraint violations"""
    # Parse common constraint violations
    error_message = str(exc.orig) if exc.orig else str(exc)
    
    if "duplicate key" in error_message.lower():
        conflict_error = ConflictError("Resource already exists", "duplicate_key")
    elif "foreign key" in error_message.lower():
        conflict_error = ConflictError("Referenced resource does not exist", "foreign_key")
    elif "not null" in error_message.lower():
        conflict_error = ValidationError("Required field is missing", "null_constraint")
    else:
        conflict_error = ConflictError("Database constraint violation", "integrity_constraint")
    
    logger.error(
        f"Database integrity error: {error_message}",
        extra={
            "original_error": error_message,
            "path": request.url.path,
            "method": request.method
        }
    )
    
    return JSONResponse(
        status_code=conflict_error.status_code,
        content=conflict_error.to_dict()
    )


async def not_found_error_handler(request: Request, exc: NoResultFound) -> JSONResponse:
    """Handle SQLAlchemy NoResultFound errors"""
    not_found_error = NotFoundError("Resource", "unknown")
    
    logger.warning(
        f"Resource not found: {str(exc)}",
        extra={
            "path": request.url.path,
            "method": request.method
        }
    )
    
    return JSONResponse(
        status_code=not_found_error.status_code,
        content=not_found_error.to_dict()
    )


async def general_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handle unexpected exceptions"""
    logger.error(
        f"Unexpected error: {type(exc).__name__}: {str(exc)}",
        extra={
            "exception_type": type(exc).__name__,
            "path": request.url.path,
            "method": request.method
        },
        exc_info=True
    )
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": True,
            "error_code": "INTERNAL_SERVER_ERROR",
            "message": "An unexpected error occurred",
            "status_code": status.HTTP_500_INTERNAL_SERVER_ERROR,
            "details": {
                "exception_type": type(exc).__name__
            }
        }
    )


def setup_exception_handlers(app: FastAPI) -> None:
    """Setup all exception handlers for the FastAPI app"""
    
    # Custom exception handlers
    app.add_exception_handler(SmartTaskException, smart_task_exception_handler)
    
    # FastAPI validation errors
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(PydanticValidationError, pydantic_validation_exception_handler)
    
    # Database errors  
    app.add_exception_handler(IntegrityError, integrity_error_handler)
    app.add_exception_handler(NoResultFound, not_found_error_handler)
    
    # Catch-all for unexpected errors
    app.add_exception_handler(Exception, general_exception_handler)
    
    logger.info("Exception handlers configured successfully")