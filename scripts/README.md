# Scripts Directory

Essential operational scripts for managing the Smart Task Management application.

## Core Scripts

### Service Management

- **`deploy.bat`** - Build and deploy all containers (Development)
  ```bash
  .\scripts\deploy.bat
  ```

- **`deploy.production.bat`** - Build and deploy for production
  ```bash
  .\scripts\deploy.production.bat
  ```

- **`restart.bat`** - Restart all containers  
  ```bash
  .\scripts\restart.bat
  ```

- **`stop.bat`** - Stop all running containers
  ```bash
  .\scripts\stop.bat
  ```

- **`logs.bat`** - View container logs (Ctrl+C to exit)
  ```bash
  .\scripts\logs.bat
  ```

### Database Management

- **`backup-db.sh`** - Create PostgreSQL database backup
  ```bash
  ./backup-db.sh
  ```

- **`restore-db.sh`** - Restore PostgreSQL database from backup
  ```bash
  ./restore-db.sh [backup-file]
  ```

### Deployment Automation

- **`deploy.py`** - Python script for automated deployment
  - Used internally by `deploy.bat`
  - Handles environment configuration and service orchestration

## Environment Configuration

The application supports environment-based configuration:

### Development (Default)
- Uses `.env` file with `ENVIRONMENT=development`
- CORS allows localhost origins
- Debug mode enabled

### Production
- Copy `.env.production.example` to `.env`
- Set `ENVIRONMENT=production`
- CORS restricted to `https://taskmanager.sulemankhan.me`
- Debug mode disabled

### Configuration Files
- **`.env`** - Main application configuration
- **`.env.ports`** - Port configuration
- **`.env.production.example`** - Production configuration template
- **`frontend/.env`** - Frontend-specific configuration

## Quick Start

### Local Development
```bash
# Start all services
.\scripts\restart.bat

# Monitor logs
.\scripts\logs.bat
```

### Production Deployment
```bash
# Configure production environment
copy .env.production.example .env
# Edit .env with production values

# Deploy application for production
.\scripts\deploy.production.bat
```

### Maintenance
```bash
# Stop services
.\scripts\stop.bat

# Backup database
./backup-db.sh

# Restart services
.\scripts\restart.bat
```

## Notes

- Scripts are optimized for Windows environments
- Database scripts (`.sh`) require bash/WSL on Windows
- Ensure proper environment variables are set before running scripts
- For production, always use HTTPS and configure CORS appropriately