"""
Authentication using Supabase Auth.
Integrates with Supabase's built-in authentication system.
"""
from typing import Optional, Dict, Any
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import create_client, Client
from app.core.config import settings
from app.core.database import get_session
from app.models.database import User
from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession
import logging
import asyncio
from datetime import datetime, timedelta
import hashlib
import json

logger = logging.getLogger(__name__)

# Initialize Supabase client
supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

# Security scheme for FastAPI
security = HTTPBearer()

# Token cache to reduce Supabase API calls
_token_cache: Dict[str, Dict[str, Any]] = {}
_cache_ttl = 300  # 5 minutes

# Circuit breaker for Supabase API
_circuit_breaker_state = {
    "failures": 0,
    "last_failure": None,
    "circuit_open": False
}
_failure_threshold = 3
_circuit_timeout = 30  # 30 seconds


def _get_cache_key(token: str) -> str:
    """Generate cache key from token hash"""
    return hashlib.md5(token.encode()).hexdigest()


def _is_token_cached(token: str) -> Optional[Dict[str, Any]]:
    """Check if token is cached and still valid"""
    cache_key = _get_cache_key(token)
    if cache_key in _token_cache:
        cached_data = _token_cache[cache_key]
        if datetime.now() < cached_data["expires_at"]:
            return cached_data["user_data"]
        else:
            # Remove expired cache entry
            del _token_cache[cache_key]
    return None


def _cache_token(token: str, user_data: Dict[str, Any]) -> None:
    """Cache token verification result"""
    cache_key = _get_cache_key(token)
    _token_cache[cache_key] = {
        "user_data": user_data,
        "expires_at": datetime.now() + timedelta(seconds=_cache_ttl)
    }


def _is_circuit_open() -> bool:
    """Check if circuit breaker is open"""
    if not _circuit_breaker_state["circuit_open"]:
        return False
    
    # Check if timeout has passed
    if _circuit_breaker_state["last_failure"]:
        time_since_failure = (datetime.now() - _circuit_breaker_state["last_failure"]).seconds
        if time_since_failure > _circuit_timeout:
            # Reset circuit breaker
            _circuit_breaker_state["circuit_open"] = False
            _circuit_breaker_state["failures"] = 0
            logger.info("Circuit breaker reset - attempting Supabase connection")
            return False
    
    return True


def _record_failure() -> None:
    """Record a failure for circuit breaker"""
    _circuit_breaker_state["failures"] += 1
    _circuit_breaker_state["last_failure"] = datetime.now()
    
    if _circuit_breaker_state["failures"] >= _failure_threshold:
        _circuit_breaker_state["circuit_open"] = True
        logger.error(f"Circuit breaker opened after {_failure_threshold} failures")


def _record_success() -> None:
    """Record a success - reset failure count"""
    _circuit_breaker_state["failures"] = 0
    _circuit_breaker_state["circuit_open"] = False


class SupabaseAuth:
    """Handle Supabase authentication"""
    
    @staticmethod
    async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
        """
        Verify JWT token from Supabase with caching and circuit breaker.
        Returns the user data from the token.
        """
        token = credentials.credentials
        
        # Check cache first
        cached_result = _is_token_cached(token)
        if cached_result:
            logger.debug("Token verification served from cache")
            return cached_result
        
        # Check circuit breaker
        if _is_circuit_open():
            logger.error("Authentication service unavailable - circuit breaker is open")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Authentication service temporarily unavailable - please try again later",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        try:
            # Verify token with Supabase with aggressive timeout
            import concurrent.futures
            
            def get_user_sync():
                return supabase.auth.get_user(token)
            
            # Use aggressive 2-second timeout for faster failure detection
            with concurrent.futures.ThreadPoolExecutor() as executor:
                future = executor.submit(get_user_sync)
                try:
                    user_response = future.result(timeout=2.0)
                except concurrent.futures.TimeoutError:
                    logger.error("Supabase auth request timed out after 2 seconds")
                    _record_failure()
                    raise HTTPException(
                        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                        detail="Authentication service timeout - service may be slow",
                        headers={"WWW-Authenticate": "Bearer"},
                    )
            
            if not user_response or not user_response.user:
                logger.warning("Invalid token - no user found")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid authentication token",
                    headers={"WWW-Authenticate": "Bearer"},
                )
            
            # Success - record and cache result
            _record_success()
            user_data = {
                "id": user_response.user.id,
                "email": user_response.user.email,
                "metadata": user_response.user.user_metadata
            }
            
            _cache_token(token, user_data)
            logger.debug(f"Token verified successfully for user {user_data['email']}")
            return user_data
            
        except HTTPException:
            # Re-raise HTTP exceptions as-is
            raise
        except Exception as e:
            logger.error(f"Token verification failed: {e}")
            _record_failure()
            
            # Return specific error codes based on error type
            if "timeout" in str(e).lower() or "timed out" in str(e).lower():
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="Authentication service temporarily unavailable",
                    headers={"WWW-Authenticate": "Bearer"},
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Could not validate credentials",
                    headers={"WWW-Authenticate": "Bearer"},
                )
    
    @staticmethod
    async def sign_up(email: str, password: str, full_name: Optional[str] = None) -> Dict[str, Any]:
        """
        Sign up a new user with Supabase Auth.
        """
        try:
            # Sign up with Supabase
            auth_response = supabase.auth.sign_up({
                "email": email,
                "password": password,
                "options": {
                    "data": {
                        "full_name": full_name or ""
                    }
                }
            })
            
            if not auth_response.user:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Failed to create user"
                )
            
            return {
                "user": auth_response.user,
                "session": auth_response.session
            }
            
        except Exception as e:
            logger.error(f"Sign up failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )
    
    @staticmethod
    async def sign_in(email: str, password: str) -> Dict[str, Any]:
        """
        Sign in a user with Supabase Auth.
        """
        try:
            # Sign in with Supabase
            auth_response = supabase.auth.sign_in_with_password({
                "email": email,
                "password": password
            })
            
            if not auth_response.user or not auth_response.session:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid email or password"
                )
            
            return {
                "user": auth_response.user,
                "session": auth_response.session,
                "access_token": auth_response.session.access_token,
                "refresh_token": auth_response.session.refresh_token
            }
            
        except Exception as e:
            logger.error(f"Sign in failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
    
    @staticmethod
    async def sign_out(token: str) -> bool:
        """
        Sign out a user.
        """
        try:
            supabase.auth.sign_out()
            return True
        except Exception as e:
            logger.error(f"Sign out failed: {e}")
            return False
    
    @staticmethod
    async def refresh_token(refresh_token: str) -> Dict[str, Any]:
        """
        Refresh access token using refresh token.
        """
        try:
            auth_response = supabase.auth.refresh_session(refresh_token)
            
            if not auth_response.session:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Failed to refresh token"
                )
            
            return {
                "access_token": auth_response.session.access_token,
                "refresh_token": auth_response.session.refresh_token
            }
            
        except Exception as e:
            logger.error(f"Token refresh failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Failed to refresh token"
            )


async def get_current_user(
    session: AsyncSession = Depends(get_session),
    token_data: Dict[str, Any] = Depends(SupabaseAuth.verify_token)
) -> User:
    """
    Get current user from database.
    Creates user record if it doesn't exist (first login).
    Updates Supabase ID if user exists with email but different ID (seed data scenario).
    """
    supabase_id = token_data["id"]
    email = token_data["email"]
    
    # Check if user exists in our database by Supabase ID
    stmt = select(User).where(User.supabase_id == supabase_id)
    result = await session.execute(stmt)
    user = result.scalar_one_or_none()
    
    if not user:
        # Check if user exists by email (might be seed data with placeholder ID)
        stmt_email = select(User).where(User.email == email)
        result_email = await session.execute(stmt_email)
        user = result_email.scalar_one_or_none()
        
        if user:
            # User exists with email but different Supabase ID - update it
            logger.info(f"Updating Supabase ID for existing user {email}")
            user.supabase_id = supabase_id
            session.add(user)
            await session.commit()
            await session.refresh(user)
        else:
            # Create new user if doesn't exist at all
            user = User(
                supabase_id=supabase_id,
                email=email,
                username=email.split("@")[0],  # Default username from email
                full_name=token_data.get("metadata", {}).get("full_name"),
                is_active=True
            )
            session.add(user)
            await session.commit()
            await session.refresh(user)
            logger.info(f"Created new user record for {email}")
    
    return user


async def get_current_user_websocket(
    token: str,
    session: AsyncSession
) -> Optional[User]:
    """
    Get current user for WebSocket connections.
    Validates JWT token and returns user without raising exceptions.
    Updates Supabase ID if user exists with email but different ID (seed data scenario).
    """
    try:
        # Verify token with Supabase
        user_response = supabase.auth.get_user(token)
        
        if not user_response or not user_response.user:
            return None
        
        supabase_id = user_response.user.id
        email = user_response.user.email
        
        # Check if user exists in our database by Supabase ID
        stmt = select(User).where(User.supabase_id == supabase_id)
        result = await session.execute(stmt)
        user = result.scalar_one_or_none()
        
        if not user:
            # Check if user exists by email (might be seed data with placeholder ID)
            stmt_email = select(User).where(User.email == email)
            result_email = await session.execute(stmt_email)
            user = result_email.scalar_one_or_none()
            
            if user:
                # User exists with email but different Supabase ID - update it
                logger.info(f"Updating Supabase ID for existing WebSocket user {email}")
                user.supabase_id = supabase_id
                session.add(user)
                await session.commit()
                await session.refresh(user)
            else:
                # Create new user if doesn't exist at all
                user = User(
                    supabase_id=supabase_id,
                    email=email,
                    username=email.split("@")[0],  # Default username from email
                    full_name=user_response.user.user_metadata.get("full_name") if user_response.user.user_metadata else None,
                    is_active=True
                )
                session.add(user)
                await session.commit()
                await session.refresh(user)
                logger.info(f"Created new user record for {email} via WebSocket")
        
        return user
        
    except Exception as e:
        logger.error(f"WebSocket token verification failed: {e}")
        return None


async def verify_token_string(token: str) -> Optional[Dict[str, Any]]:
    """
    Verify JWT token string directly (for WebSocket authentication).
    Returns user data or None if invalid.
    """
    try:
        # Verify token with Supabase
        user_response = supabase.auth.get_user(token)
        
        if not user_response or not user_response.user:
            return None
        
        return {
            "id": user_response.user.id,
            "email": user_response.user.email,
            "metadata": user_response.user.user_metadata
        }
        
    except Exception as e:
        logger.error(f"Token string verification failed: {e}")
        return None


# Dependency for protected routes
CurrentUser = Depends(get_current_user)