"""
Cache infrastructure for performance optimization.
Provides caching utilities for database queries and API responses.
"""
from typing import Optional, Any, Dict
import json
import logging
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

class InMemoryCache:
    """Simple in-memory cache for development/testing"""
    
    def __init__(self):
        self._cache: Dict[str, Dict[str, Any]] = {}
    
    async def get(self, key: str) -> Optional[Any]:
        """Get value from cache"""
        if key not in self._cache:
            return None
        
        entry = self._cache[key]
        
        # Check expiration
        if entry['expires_at'] and datetime.utcnow() > entry['expires_at']:
            del self._cache[key]
            return None
        
        return entry['value']
    
    async def set(self, key: str, value: Any, ttl_seconds: Optional[int] = None) -> None:
        """Set value in cache with optional TTL"""
        expires_at = None
        if ttl_seconds:
            expires_at = datetime.utcnow() + timedelta(seconds=ttl_seconds)
        
        self._cache[key] = {
            'value': value,
            'expires_at': expires_at,
            'created_at': datetime.utcnow()
        }
    
    async def delete(self, key: str) -> bool:
        """Delete value from cache"""
        if key in self._cache:
            del self._cache[key]
            return True
        return False
    
    async def clear(self) -> None:
        """Clear all cached values"""
        self._cache.clear()
    
    def stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        now = datetime.utcnow()
        total_keys = len(self._cache)
        expired_keys = sum(
            1 for entry in self._cache.values()
            if entry['expires_at'] and now > entry['expires_at']
        )
        
        return {
            'total_keys': total_keys,
            'expired_keys': expired_keys,
            'active_keys': total_keys - expired_keys
        }

class CacheManager:
    """Cache manager with key pattern utilities"""
    
    def __init__(self, cache_impl: Optional[InMemoryCache] = None):
        self.cache = cache_impl or InMemoryCache()
    
    def _user_tasks_key(self, user_id: str, page: int = 1, **filters) -> str:
        """Generate cache key for user tasks"""
        filter_str = "&".join(f"{k}={v}" for k, v in sorted(filters.items()) if v is not None)
        return f"user:{user_id}:tasks:page:{page}:{filter_str}"
    
    def _task_stats_key(self, user_id: str) -> str:
        """Generate cache key for task statistics"""
        return f"user:{user_id}:stats"
    
    def _task_key(self, task_id: str) -> str:
        """Generate cache key for individual task"""
        return f"task:{task_id}"
    
    async def get_user_tasks(self, user_id: str, page: int = 1, **filters) -> Optional[Any]:
        """Get cached user tasks"""
        key = self._user_tasks_key(user_id, page, **filters)
        return await self.cache.get(key)
    
    async def set_user_tasks(self, user_id: str, data: Any, page: int = 1, ttl: int = 300, **filters) -> None:
        """Cache user tasks"""
        key = self._user_tasks_key(user_id, page, **filters)
        await self.cache.set(key, data, ttl)
    
    async def get_task_stats(self, user_id: str) -> Optional[Any]:
        """Get cached task statistics"""
        key = self._task_stats_key(user_id)
        return await self.cache.get(key)
    
    async def set_task_stats(self, user_id: str, stats: Any, ttl: int = 300) -> None:
        """Cache task statistics"""
        key = self._task_stats_key(user_id)
        await self.cache.set(key, stats, ttl)
    
    async def invalidate_user_cache(self, user_id: str) -> None:
        """Invalidate all cache entries for a user"""
        # In a real implementation with Redis, we'd use pattern matching
        # For now, we'll clear specific known keys
        await self.cache.delete(self._task_stats_key(user_id))
        
        # In production, you'd implement pattern-based deletion
        logger.info(f"Cache invalidated for user: {user_id}")
    
    async def get_cache_stats(self) -> Dict[str, Any]:
        """Get overall cache statistics"""
        return self.cache.stats()

# Global cache manager instance
cache_manager = CacheManager()