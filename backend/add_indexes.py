#!/usr/bin/env python3
"""
Simple script to add critical database indexes for performance.
"""
import asyncio
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import asyncpg
from urllib.parse import urlparse
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

async def create_indexes():
    """Create critical indexes for performance"""
    
    # Parse database URL from environment
    from app.core.config import settings
    parsed = urlparse(settings.DATABASE_URL)
    
    # Connect directly with asyncpg
    conn = await asyncpg.connect(
        host=parsed.hostname,
        port=parsed.port or 5432,
        user=parsed.username,
        password=parsed.password.replace('%24', '$').replace('%40', '@') if parsed.password else None,
        database=parsed.path[1:] if parsed.path else None,
        ssl='require'
    )
    
    try:
        logger.info("🚀 Creating performance indexes...")
        
        indexes = [
            # Critical covering index for task stats
            """
            CREATE INDEX IF NOT EXISTS idx_tasks_stats_covering 
            ON tasks (creator_id, assignee_id, is_deleted) 
            INCLUDE (completed, status)
            WHERE is_deleted = false
            """,
            
            # Index for user access patterns
            """
            CREATE INDEX IF NOT EXISTS idx_tasks_user_access 
            ON tasks (creator_id, is_deleted) 
            WHERE is_deleted = false
            """,
            
            """
            CREATE INDEX IF NOT EXISTS idx_tasks_assignee_access 
            ON tasks (assignee_id, is_deleted) 
            WHERE is_deleted = false AND assignee_id IS NOT NULL
            """,
            
            # Composite index for common queries
            """
            CREATE INDEX IF NOT EXISTS idx_tasks_creator_composite 
            ON tasks (creator_id, status, is_deleted, created_at DESC) 
            WHERE is_deleted = false
            """,
            
            # Project members index for JOINs
            """
            CREATE INDEX IF NOT EXISTS idx_project_members_lookup 
            ON project_members (project_id, user_id)
            """,
        ]
        
        for i, sql in enumerate(indexes, 1):
            try:
                logger.info(f"Creating index {i}/{len(indexes)}...")
                await conn.execute(sql)
                logger.info(f"✅ Index {i} created successfully")
            except Exception as e:
                if "already exists" in str(e):
                    logger.info(f"⚠️  Index {i} already exists")
                else:
                    logger.error(f"❌ Failed to create index {i}: {e}")
        
        # Update statistics
        logger.info("📊 Updating table statistics...")
        tables = ['tasks', 'projects', 'project_members', 'users']
        for table in tables:
            try:
                await conn.execute(f"ANALYZE {table}")
                logger.info(f"✅ Analyzed {table}")
            except Exception as e:
                logger.error(f"❌ Failed to analyze {table}: {e}")
        
        logger.info("🎉 Database optimization completed!")
        
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(create_indexes())