"""
Authentication helper utilities.
Business logic and validation helpers for authentication operations.
"""
from typing import Dict, Any, Optional
import logging
from datetime import datetime

from app.exceptions.base import ValidationError, NotFoundError, BusinessLogicError
from app.core.auth import SupabaseAuth

logger = logging.getLogger(__name__)


class AuthValidator:
    """Authentication validation utilities"""
    
    @staticmethod
    def validate_user_registration_data(email: str, password: str, full_name: Optional[str] = None):
        """Validate user registration data"""
        # Email domain validation (optional business rule)
        if email.endswith('@tempmail.com') or email.endswith('@10minutemail.com'):
            raise ValidationError("Temporary email addresses are not allowed")
        
        # Full name validation
        if full_name and len(full_name.strip()) < 2:
            raise ValidationError("Full name must be at least 2 characters long")
    
    @staticmethod
    def validate_sign_in_attempt(email: str) -> None:
        """Validate sign-in attempt (could include rate limiting checks)"""
        # Could implement rate limiting logic here
        pass


class AuthResponseFormatter:
    """Authentication response formatting utilities"""
    
    @staticmethod
    def format_auth_response(auth_result: Dict[str, Any]) -> Dict[str, Any]:
        """Format authentication response consistently"""
        if not auth_result.get("session"):
            raise BusinessLogicError("Authentication succeeded but no session created")
        
        session = auth_result["session"]
        user = auth_result.get("user", {})
        
        return {
            "access_token": session.access_token,
            "refresh_token": session.refresh_token,
            "token_type": "bearer",
            "user": user.__dict__ if hasattr(user, '__dict__') else user,
            "expires_in": getattr(session, 'expires_in', None)
        }
    
    @staticmethod
    def format_user_response(user: Any) -> Dict[str, Any]:
        """Format user data for response"""
        return {
            "id": str(user.id),
            "email": user.email,
            "username": user.username,
            "full_name": user.full_name,
            "avatar_url": getattr(user, 'avatar_url', None),
            "is_active": user.is_active,
            "created_at": user.created_at.isoformat()
        }


class AuthBusinessLogic:
    """Authentication business logic"""
    
    @staticmethod
    async def handle_user_registration(email: str, password: str, full_name: Optional[str] = None) -> Dict[str, Any]:
        """Handle user registration with business logic"""
        logger.info(f"Attempting user registration for email: {email}")
        
        # Validate registration data
        AuthValidator.validate_user_registration_data(email, password, full_name)
        
        try:
            # Attempt registration with Supabase
            auth_result = await SupabaseAuth.sign_up(
                email=email,
                password=password,
                full_name=full_name
            )
            
            if not auth_result.get("session"):
                logger.warning(f"Registration successful but email verification required: {email}")
                raise BusinessLogicError(
                    "Registration successful, but please check your email for verification.",
                    details={"requires_verification": True, "email": email}
                )
            
            logger.info(f"User registration successful: {email}")
            return AuthResponseFormatter.format_auth_response(auth_result)
            
        except Exception as e:
            logger.error(f"User registration failed for {email}: {str(e)}")
            if "User already registered" in str(e):
                raise ValidationError("An account with this email already exists")
            raise BusinessLogicError(f"Registration failed: {str(e)}")
    
    @staticmethod
    async def handle_user_sign_in(email: str, password: str) -> Dict[str, Any]:
        """Handle user sign in with business logic"""
        logger.info(f"Attempting user sign in for email: {email}")
        
        # Validate sign-in attempt
        AuthValidator.validate_sign_in_attempt(email)
        
        try:
            # Attempt sign in with Supabase
            auth_result = await SupabaseAuth.sign_in(email=email, password=password)
            
            logger.info(f"User sign in successful: {email}")
            return {
                "access_token": auth_result["access_token"],
                "refresh_token": auth_result["refresh_token"],
                "token_type": "bearer",
                "user": auth_result["user"].__dict__ if hasattr(auth_result["user"], '__dict__') else auth_result["user"],
                "expires_in": auth_result.get("expires_in")
            }
            
        except Exception as e:
            logger.error(f"User sign in failed for {email}: {str(e)}")
            if "Invalid credentials" in str(e):
                raise ValidationError("Invalid email or password")
            raise BusinessLogicError(f"Sign in failed: {str(e)}")
    
    @staticmethod
    async def handle_token_refresh(refresh_token: str) -> Dict[str, Any]:
        """Handle token refresh with validation"""
        logger.info("Attempting token refresh")
        
        if not refresh_token or not refresh_token.strip():
            raise ValidationError("Refresh token is required")
        
        try:
            token_result = await SupabaseAuth.refresh_token(refresh_token)
            logger.info("Token refresh successful")
            return token_result
            
        except Exception as e:
            logger.error(f"Token refresh failed: {str(e)}")
            if "Invalid refresh token" in str(e):
                raise ValidationError("Invalid or expired refresh token")
            raise BusinessLogicError(f"Token refresh failed: {str(e)}")
    
    @staticmethod
    async def handle_user_sign_out(token: str = "") -> bool:
        """Handle user sign out"""
        logger.info("Attempting user sign out")
        
        try:
            success = await SupabaseAuth.sign_out(token)
            if success:
                logger.info("User sign out successful")
                return True
            else:
                logger.warning("Sign out returned false")
                raise BusinessLogicError("Sign out failed")
                
        except Exception as e:
            logger.error(f"User sign out failed: {str(e)}")
            raise BusinessLogicError(f"Sign out failed: {str(e)}")


class AuthEventLogger:
    """Authentication event logging utilities"""
    
    @staticmethod
    def log_registration_attempt(email: str, success: bool, error: Optional[str] = None):
        """Log registration attempt"""
        if success:
            logger.info(f"Registration successful: {email}")
        else:
            logger.warning(f"Registration failed: {email} - {error}")
    
    @staticmethod
    def log_sign_in_attempt(email: str, success: bool, error: Optional[str] = None):
        """Log sign in attempt"""
        if success:
            logger.info(f"Sign in successful: {email}")
        else:
            logger.warning(f"Sign in failed: {email} - {error}")
    
    @staticmethod
    def log_token_refresh_attempt(success: bool, error: Optional[str] = None):
        """Log token refresh attempt"""
        if success:
            logger.info("Token refresh successful")
        else:
            logger.warning(f"Token refresh failed: {error}")