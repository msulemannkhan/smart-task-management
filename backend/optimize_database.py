#!/usr/bin/env python3
"""
Database Performance Optimization Script
Adds composite indexes to improve query performance for the Smart Task Management System.
"""
import asyncio
import sys
import os

# Add the app directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
import logging
from app.core.database import async_database_url

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

async def create_indexes():
    """Create composite indexes to optimize query performance"""
    
    engine = create_async_engine(
        async_database_url,
        echo=False,  # Set to True to see SQL
        future=True,
        connect_args={'statement_cache_size': 0}  # For PGBouncer compatibility
    )
    
    indexes_to_create = [
        # Index for task stats query: (creator_id OR assignee_id) AND is_deleted
        """
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_user_access_deleted 
        ON tasks (creator_id, is_deleted) 
        WHERE is_deleted = false
        """,
        
        """
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_assignee_deleted 
        ON tasks (assignee_id, is_deleted) 
        WHERE is_deleted = false AND assignee_id IS NOT NULL
        """,
        
        # Index for task listing with filters
        """
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_creator_status_priority 
        ON tasks (creator_id, status, priority, is_deleted, created_at DESC) 
        WHERE is_deleted = false
        """,
        
        """
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_assignee_status_priority 
        ON tasks (assignee_id, status, priority, is_deleted, created_at DESC) 
        WHERE is_deleted = false AND assignee_id IS NOT NULL
        """,
        
        # Index for project-based queries
        """
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_project_deleted_created 
        ON tasks (project_id, is_deleted, created_at DESC) 
        WHERE is_deleted = false
        """,
        
        # Index for completed tasks analysis
        """
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_completed_status_user 
        ON tasks (completed, status, creator_id, is_deleted) 
        WHERE is_deleted = false
        """,
        
        """
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_completed_status_assignee 
        ON tasks (completed, status, assignee_id, is_deleted) 
        WHERE is_deleted = false AND assignee_id IS NOT NULL
        """,
        
        # Index for project members table
        """
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_project_members_project_user 
        ON project_members (project_id, user_id)
        """,
        
        # Index for projects owner lookup
        """
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_owner_active 
        ON projects (owner_id, is_active) 
        WHERE is_active = true
        """,
        
        # Covering index for task stats with all needed columns
        """
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_stats_covering 
        ON tasks (creator_id, assignee_id, is_deleted) 
        INCLUDE (completed, status)
        WHERE is_deleted = false
        """,
    ]
    
    logger.info(f"Creating {len(indexes_to_create)} performance indexes...")
    
    try:
        # Create indexes without CONCURRENT to avoid transaction issues
        async with engine.connect() as conn:
            for i, index_sql in enumerate(indexes_to_create, 1):
                try:
                    # Remove CONCURRENTLY for transaction compatibility
                    clean_sql = index_sql.replace("CONCURRENTLY ", "")
                    
                    logger.info(f"Creating index {i}/{len(indexes_to_create)}...")
                    logger.info(f"SQL: {clean_sql.strip()}")
                    
                    await conn.execute(text(clean_sql))
                    await conn.commit()
                    logger.info(f"✅ Index {i} created successfully")
                    
                except Exception as e:
                    if "already exists" in str(e).lower():
                        logger.info(f"⚠️  Index {i} already exists, skipping")
                    else:
                        logger.error(f"❌ Failed to create index {i}: {e}")
                        # Don't fail completely, continue with other indexes
            
            logger.info("🎉 Database optimization completed!")
            
    except Exception as e:
        logger.error(f"❌ Database optimization failed: {e}")
        raise
    finally:
        await engine.dispose()

async def analyze_tables():
    """Run ANALYZE on tables to update query planner statistics"""
    
    engine = create_async_engine(
        async_database_url,
        echo=False,
        future=True,
        connect_args={'statement_cache_size': 0}
    )
    
    tables_to_analyze = [
        'tasks', 
        'projects', 
        'project_members', 
        'users', 
        'categories'
    ]
    
    logger.info(f"Running ANALYZE on {len(tables_to_analyze)} tables...")
    
    try:
        async with engine.connect() as conn:
            for table in tables_to_analyze:
                try:
                    await conn.execute(text(f"ANALYZE {table}"))
                    await conn.commit()
                    logger.info(f"✅ Analyzed table: {table}")
                except Exception as e:
                    logger.error(f"❌ Failed to analyze table {table}: {e}")
        
        logger.info("🎉 Table analysis completed!")
        
    except Exception as e:
        logger.error(f"❌ Table analysis failed: {e}")
        raise
    finally:
        await engine.dispose()

async def show_index_usage():
    """Show information about existing indexes"""
    
    engine = create_async_engine(
        async_database_url,
        echo=False,
        future=True,
        connect_args={'statement_cache_size': 0}
    )
    
    try:
        async with engine.connect() as conn:
            # Show existing indexes on tasks table
            result = await conn.execute(text("""
                SELECT 
                    schemaname, 
                    tablename, 
                    indexname, 
                    indexdef
                FROM pg_indexes 
                WHERE tablename = 'tasks' 
                ORDER BY indexname
            """))
            
            logger.info("📊 Existing indexes on tasks table:")
            for row in result:
                logger.info(f"  - {row.indexname}: {row.indexdef}")
        
    except Exception as e:
        logger.error(f"❌ Failed to show index information: {e}")
    finally:
        await engine.dispose()

async def main():
    """Main optimization function"""
    try:
        logger.info("🚀 Starting database performance optimization...")
        
        # Show current indexes
        await show_index_usage()
        
        # Create performance indexes
        await create_indexes()
        
        # Update table statistics
        await analyze_tables()
        
        logger.info("✅ Database optimization completed successfully!")
        logger.info("📈 Query performance should be significantly improved!")
        
    except Exception as e:
        logger.error(f"❌ Optimization failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())