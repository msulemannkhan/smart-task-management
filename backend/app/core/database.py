"""
Database configuration using SQLModel with Supabase PostgreSQL.
Supports both async operations and connection pooling.
"""
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlmodel import SQLModel
from app.core.config import settings
import logging
from urllib.parse import urlparse, quote_plus

logger = logging.getLogger(__name__)

# Configure SQLAlchemy logging to reduce verbosity
logging.getLogger('sqlalchemy.engine').setLevel(logging.WARNING)
logging.getLogger('sqlalchemy.pool').setLevel(logging.WARNING)
logging.getLogger('sqlalchemy.dialects').setLevel(logging.WARNING)


def build_async_database_url(database_url: str) -> str:
    """
    Parse database URL and rebuild for async support.
    Converts postgresql:// to postgresql+asyncpg:// and filters incompatible parameters.
    Assumes password is already properly URL-encoded in the input URL.
    """
    # Handle URLs with pre-encoded passwords
    if '://' not in database_url:
        raise ValueError("Invalid database URL format")
    
    # Split scheme and rest
    scheme, rest = database_url.split('://', 1)
    
    # Find the @ that separates credentials from host
    if '@' not in rest:
        raise ValueError("No credentials found in database URL")
    
    # Split credentials and host part
    credentials_part, host_part = rest.rsplit('@', 1)
    
    # Use credentials as-is (already encoded in .env)
    credentials = credentials_part
    
    # Parse host part (host:port/database?query)
    host_info = host_part
    
    # Extract query parameters
    query = ""
    if '?' in host_info:
        host_info, query = host_info.split('?', 1)
    
    # Extract database
    database = ""
    if '/' in host_info:
        host_port, database = host_info.split('/', 1)
    else:
        host_port = host_info
    
    # Parse host and port
    if ':' in host_port and not host_port.startswith('['):  # Not IPv6
        hostname, port_str = host_port.rsplit(':', 1)
        try:
            port = int(port_str)
        except ValueError:
            # Port is not a number, treat as part of hostname
            hostname = host_port
            port = None
    else:
        hostname = host_port
        port = None
    
    # Build the URL
    url_parts = ["postgresql+asyncpg://"]
    if credentials:
        url_parts.append(f"{credentials}@")
    
    url_parts.append(hostname)
    if port:
        url_parts.append(f":{port}")
    
    if database:
        url_parts.append(f"/{database}")
    
    # Filter out pgbouncer and other incompatible parameters for asyncpg
    if query:
        from urllib.parse import parse_qs, urlencode
        query_params = parse_qs(query)
        
        # Remove parameters that asyncpg doesn't support
        filtered_params = {
            k: v for k, v in query_params.items() 
            if k not in ['pgbouncer']
        }
        
        if filtered_params:
            # Rebuild query string
            new_query = urlencode(filtered_params, doseq=True)
            url_parts.append(f"?{new_query}")
    
    return "".join(url_parts)


# Create async engine with connection pooling
# Using the properly encoded database URL
async_database_url = build_async_database_url(settings.DATABASE_URL)
logger.info(f"Connecting to database with host: {urlparse(settings.DATABASE_URL).hostname}")

# Add statement cache size 0 for pgbouncer compatibility
connect_args = {}
if ('pooler.supabase.com' in settings.DATABASE_URL) or ('pgbouncer=true' in settings.DATABASE_URL):
    # This is a pooled connection (pgbouncer), disable statement cache
    connect_args['statement_cache_size'] = 0
    logger.info("Applied PGBouncer compatibility: statement_cache_size = 0")

engine = create_async_engine(
    async_database_url,
    echo=False,  # Disable SQL statement logging
    future=True,
    pool_size=5,  # Reduced for local PostgreSQL
    max_overflow=10,  # Reduced for local PostgreSQL
    pool_pre_ping=True,  # Verify connections before using
    pool_recycle=3600,  # Recycle connections after 1 hour
    pool_timeout=30,  # Timeout for getting connection from pool
    connect_args=connect_args,
    # Add these to prevent bulk operation issues
    isolation_level="READ_COMMITTED",
    query_cache_size=1200
)

# Create async session factory
async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def get_session() -> AsyncSession:
    """
    Dependency to get database session.
    Used in FastAPI endpoints.
    """
    async with async_session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db():
    """
    Initialize database tables.
    In production, we'll use Alembic migrations instead.
    """
    async with engine.begin() as conn:
        # Create all tables
        await conn.run_sync(SQLModel.metadata.create_all)
        logger.info("Database tables created successfully")


async def close_db():
    """Close database connections"""
    await engine.dispose()
    logger.info("Database connections closed")