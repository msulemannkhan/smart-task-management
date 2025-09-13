"""
Authentication endpoints using clean architecture.
Handles user registration, login, token refresh, and logout with proper separation of concerns.
"""
from fastapi import APIRouter, Depends
import logging

from app.schemas.auth import (
    SignUpRequest, 
    SignInRequest, 
    RefreshTokenRequest,
    AuthResponse,
    UserResponse, 
    MessageResponse,
    TokenRefreshResponse,
    HealthResponse
)
from app.utils.auth_helpers import AuthBusinessLogic, AuthResponseFormatter, AuthEventLogger
from app.core.auth import CurrentUser, get_current_user
from app.core.database import get_session
from app.models.database import User, ActivityActionType
from app.repositories.activity_repository import ActivityRepository
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
import uuid

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/signup", response_model=AuthResponse)
async def sign_up(
    request: SignUpRequest,
    session: AsyncSession = Depends(get_session)
):
    """
    Register a new user with comprehensive validation.
    
    - **email**: Valid email address (no temporary email providers)
    - **password**: Minimum 8 characters with letters and numbers
    - **full_name**: Optional, minimum 2 characters if provided
    
    Returns access and refresh tokens on success.
    """
    logger.info(f"Registration request for email: {request.email}")
    
    try:
        # Use business logic helper for registration
        auth_data = await AuthBusinessLogic.handle_user_registration(
            email=request.email,
            password=request.password,
            full_name=request.full_name
        )
        
        # Log successful registration
        AuthEventLogger.log_registration_attempt(request.email, success=True)
        
        # Log activity to database (only if user exists in local DB)
        if auth_data.get("user") and auth_data["user"].get("id"):
            try:
                user_id = auth_data["user"]["id"]
                if isinstance(user_id, str):
                    user_id = uuid.UUID(user_id)
                
                # First check if user exists in local database
                from sqlmodel import select
                from app.models.database import User
                stmt = select(User).where(User.id == user_id)
                result = await session.execute(stmt)
                local_user = result.scalar_one_or_none()
                
                # Only log activity if user exists in local database
                if local_user:
                    activity_repo = ActivityRepository(session)
                    await activity_repo.create(
                        user_id=user_id,
                        action_type=ActivityActionType.USER_REGISTERED,
                        entity_type="user",
                        entity_id=user_id,
                        entity_name=request.full_name or request.email,
                        description="Welcome! Your account has been created"
                    )
            except Exception as e:
                # Log the error but don't fail the registration
                logger.warning(f"Could not log registration activity: {str(e)}")
        
        logger.info(f"User registration completed successfully: {request.email}")
        return AuthResponse(**auth_data)
        
    except Exception as e:
        # Log failed registration with both standard logger and event logger
        logger.error(f"User registration failed for {request.email}: {str(e)}")
        AuthEventLogger.log_registration_attempt(request.email, success=False, error=str(e))
        raise


@router.post("/signin", response_model=AuthResponse)
async def sign_in(
    request: SignInRequest,
    session: AsyncSession = Depends(get_session)
):
    """
    Sign in an existing user with email and password.
    
    - **email**: Valid email address
    - **password**: User's password
    
    Returns access and refresh tokens on successful authentication.
    """
    logger.info(f"Sign in request for email: {request.email}")
    
    try:
        # Use business logic helper for sign in
        auth_data = await AuthBusinessLogic.handle_user_sign_in(
            email=request.email,
            password=request.password
        )
        
        # Log successful sign in
        AuthEventLogger.log_sign_in_attempt(request.email, success=True)
        
        # Log activity to database (only if user exists in local DB)
        if auth_data.get("user") and auth_data["user"].get("id"):
            try:
                user_id = auth_data["user"]["id"]
                if isinstance(user_id, str):
                    user_id = uuid.UUID(user_id)
                
                # First check if user exists in local database
                from sqlmodel import select
                from app.models.database import User
                stmt = select(User).where(User.id == user_id)
                result = await session.execute(stmt)
                local_user = result.scalar_one_or_none()
                
                # Only log activity if user exists in local database
                if local_user:
                    activity_repo = ActivityRepository(session)
                    await activity_repo.create(
                        user_id=user_id,
                        action_type=ActivityActionType.USER_SIGNED_IN,
                        entity_type="user",
                        entity_id=user_id,
                        entity_name=request.email,
                        description="Successfully logged in"
                    )
            except Exception as e:
                # Log the error but don't fail the sign in
                logger.warning(f"Could not log sign in activity: {str(e)}")
        
        logger.info(f"User sign in completed successfully: {request.email}")
        return AuthResponse(**auth_data)
        
    except Exception as e:
        # Log failed sign in with both standard logger and event logger
        logger.error(f"User sign in failed for {request.email}: {str(e)}")
        AuthEventLogger.log_sign_in_attempt(request.email, success=False, error=str(e))
        raise


@router.post("/refresh", response_model=TokenRefreshResponse)
async def refresh_token(request: RefreshTokenRequest):
    """
    Refresh access token using refresh token.
    
    - **refresh_token**: Valid refresh token
    
    Returns new access and refresh tokens.
    """
    logger.info("Token refresh request received")
    
    try:
        # Use business logic helper for token refresh
        token_data = await AuthBusinessLogic.handle_token_refresh(request.refresh_token)
        
        # Log successful token refresh
        AuthEventLogger.log_token_refresh_attempt(success=True)
        
        logger.info("Token refresh completed successfully")
        return TokenRefreshResponse(**token_data)
        
    except Exception as e:
        # Log failed token refresh with both standard logger and event logger
        logger.error(f"Token refresh failed: {str(e)}")
        AuthEventLogger.log_token_refresh_attempt(success=False, error=str(e))
        raise


@router.post("/signout", response_model=MessageResponse)
async def sign_out(
    current_user: User = CurrentUser,
    session: AsyncSession = Depends(get_session)
):
    """
    Sign out the current authenticated user.
    
    Invalidates the current session and tokens.
    """
    logger.info(f"Sign out request for user: {current_user.email}")
    
    try:
        # Use business logic helper for sign out
        success = await AuthBusinessLogic.handle_user_sign_out("")
        
        if success:
            # Log activity to database
            activity_repo = ActivityRepository(session)
            await activity_repo.create(
                user_id=current_user.id,
                action_type=ActivityActionType.USER_SIGNED_OUT,
                entity_type="user",
                entity_id=current_user.id,
                entity_name=current_user.full_name or current_user.email,
                description="Successfully logged out"
            )
            
            logger.info(f"User signed out successfully: {current_user.email}")
            return MessageResponse(
                message=f"Successfully signed out user {current_user.email}",
                success=True
            )
        else:
            logger.warning(f"Sign out failed for user: {current_user.email}")
            return MessageResponse(
                message="Sign out failed",
                success=False
            )
            
    except Exception as e:
        logger.error(f"Sign out error for user {current_user.email}: {str(e)}")
        raise


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = CurrentUser):
    """
    Get current authenticated user information.
    
    Returns the authenticated user's profile data.
    """
    logger.info(f"User info request for user: {current_user.email}")
    
    # Use response formatter for consistent user data
    user_data = AuthResponseFormatter.format_user_response(current_user)
    
    logger.info(f"User info retrieved successfully: {current_user.email}")
    return UserResponse(**user_data)


@router.get("/health", response_model=HealthResponse)
async def auth_health():
    """
    Authentication service health check.
    
    Returns service status and timestamp.
    """
    return HealthResponse(
        status="healthy",
        service="authentication"
    )