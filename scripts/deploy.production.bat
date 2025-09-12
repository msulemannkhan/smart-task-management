@echo off
echo ==========================================
echo Smart Task Management - PRODUCTION Deployment
echo ==========================================
echo.
echo WARNING: This will deploy to PRODUCTION!
echo Make sure you have configured:
echo - .env file with ENVIRONMENT=production
echo - Production database credentials
echo - BACKEND_CORS_ORIGINS=https://taskmanager.sulemankhan.me
echo.
pause

REM Check Docker
docker --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not installed or not in PATH
    pause
    exit /b 1
)

REM Navigate to project root
cd /d "%~dp0\.."

REM Build and start containers with production override
echo Building Docker images for PRODUCTION...
docker-compose -f docker-compose.yml -f docker-compose.production.yml build
if errorlevel 1 (
    echo [ERROR] Docker build failed
    echo Try running: docker system prune -a
    pause
    exit /b 1
)

echo.
echo Starting PRODUCTION containers...
docker-compose -f docker-compose.yml -f docker-compose.production.yml up -d
if errorlevel 1 (
    echo [ERROR] Failed to start containers
    pause
    exit /b 1
)

echo.
echo Waiting for services to be ready...
timeout /t 10 /nobreak >nul

echo.
echo ==========================================
echo PRODUCTION Deployment successful!
echo ==========================================
echo Production URL: https://taskmanager.sulemankhan.me
echo ==========================================
echo.
pause