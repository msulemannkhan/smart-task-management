"""Repository for user activity logging and retrieval"""
from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime, timedelta
from sqlmodel import select, delete, desc
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.database import UserActivity, ActivityActionType, User, Project
import logging

logger = logging.getLogger(__name__)


class ActivityRepository:
    """Repository for managing user activities"""
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def create(
        self,
        user_id: UUID,
        action_type: ActivityActionType,
        entity_type: str,
        description: str,
        entity_id: Optional[UUID] = None,
        entity_name: Optional[str] = None,
        target_user_id: Optional[UUID] = None,
        project_id: Optional[UUID] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> UserActivity:
        """Create a new activity log entry"""
        try:
            activity = UserActivity(
                user_id=user_id,
                action_type=action_type,
                entity_type=entity_type,
                entity_id=entity_id,
                entity_name=entity_name,
                description=description,
                target_user_id=target_user_id,
                project_id=project_id,
                activity_metadata=metadata
            )
            
            self.session.add(activity)
            await self.session.commit()
            await self.session.refresh(activity)
            
            logger.info(f"Activity logged: {description}")
            return activity
            
        except Exception as e:
            logger.error(f"Failed to create activity: {str(e)}")
            await self.session.rollback()
            raise
    
    async def get_recent(
        self,
        user_id: Optional[UUID] = None,
        project_id: Optional[UUID] = None,
        limit: int = 20,
        offset: int = 0
    ) -> List[UserActivity]:
        """Get recent activities with optional filtering"""
        try:
            query = select(UserActivity).order_by(desc(UserActivity.created_at))
            
            if user_id:
                query = query.where(UserActivity.user_id == user_id)
            
            if project_id:
                query = query.where(UserActivity.project_id == project_id)
            
            query = query.offset(offset).limit(limit)
            
            result = await self.session.execute(query)
            activities = result.scalars().all()
            
            # Load relationships
            for activity in activities:
                if activity.user_id:
                    user_query = select(User).where(User.id == activity.user_id)
                    user_result = await self.session.execute(user_query)
                    activity.user = user_result.scalars().first()
                
                if activity.target_user_id:
                    target_query = select(User).where(User.id == activity.target_user_id)
                    target_result = await self.session.execute(target_query)
                    activity.target_user = target_result.scalars().first()
                
                if activity.project_id:
                    project_query = select(Project).where(Project.id == activity.project_id)
                    project_result = await self.session.execute(project_query)
                    activity.project = project_result.scalars().first()
            
            return activities
            
        except Exception as e:
            logger.error(f"Failed to get recent activities: {str(e)}")
            raise
    
    async def clear_all(self, user_id: Optional[UUID] = None) -> int:
        """Clear all activities or for specific user"""
        try:
            if user_id:
                query = delete(UserActivity).where(UserActivity.user_id == user_id)
            else:
                query = delete(UserActivity)
            
            result = await self.session.execute(query)
            await self.session.commit()
            
            count = result.rowcount
            logger.info(f"Cleared {count} activities")
            return count
            
        except Exception as e:
            logger.error(f"Failed to clear activities: {str(e)}")
            await self.session.rollback()
            raise
    
    async def cleanup_old(self, days: int = 30) -> int:
        """Remove activities older than specified days"""
        try:
            cutoff_date = datetime.utcnow() - timedelta(days=days)
            query = delete(UserActivity).where(UserActivity.created_at < cutoff_date)
            
            result = await self.session.execute(query)
            await self.session.commit()
            
            count = result.rowcount
            logger.info(f"Cleaned up {count} old activities")
            return count
            
        except Exception as e:
            logger.error(f"Failed to cleanup old activities: {str(e)}")
            await self.session.rollback()
            raise