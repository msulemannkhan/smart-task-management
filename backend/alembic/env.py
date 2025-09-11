"""
Alembic environment configuration for Supabase PostgreSQL.
Uses DIRECT_URL for migrations to bypass connection pooling.
"""
from logging.config import fileConfig
from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config
from alembic import context
import asyncio
import os
import sys
from pathlib import Path

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))

from app.core.config import settings
from app.models.database import SQLModel
from urllib.parse import urlparse, quote_plus

# this is the Alembic Config object
config = context.config

# Interpret the config file for Python logging
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Set target metadata from SQLModel
target_metadata = SQLModel.metadata


def build_migration_database_url(database_url: str) -> str:
    """
    Parse database URL and rebuild with proper encoding for special characters.
    Converts postgresql:// to postgresql+asyncpg:// for async migrations.
    """
    parsed = urlparse(database_url)
    
    # Extract components
    username = parsed.username
    password = parsed.password
    hostname = parsed.hostname
    port = parsed.port
    database = parsed.path.lstrip('/')
    query = parsed.query
    
    # URL encode the password to handle special characters
    encoded_password = quote_plus(password) if password else ""
    
    # Rebuild URL with asyncpg driver
    if encoded_password:
        credentials = f"{username}:{encoded_password}"
    else:
        credentials = username or ""
    
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


# Set the database URL from environment
# Use DIRECT_URL for migrations (not pooled connection)
migration_url = build_migration_database_url(settings.DIRECT_URL)
# Don't set it here due to ConfigParser interpolation issues
# config.set_main_option("sqlalchemy.url", migration_url)


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
        compare_server_default=True,
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    """Run migrations with connection"""
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        compare_type=True,
        compare_server_default=True,
    )

    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    """Run migrations in 'online' mode with async engine."""
    configuration = config.get_section(config.config_ini_section)
    # Use our properly parsed migration URL
    configuration["sqlalchemy.url"] = migration_url
    
    connectable = async_engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()