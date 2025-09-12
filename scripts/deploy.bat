@echo off
echo ==========================================
echo Smart Task Management - Docker Deployment
echo ==========================================
echo.

REM Check Docker
docker --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not installed or not in PATH
    pause
    exit /b 1
)

REM Navigate to project root
cd /d "%~dp0\.."

REM Build and start containers
echo Building Docker images...
docker-compose build
if errorlevel 1 (
    echo [ERROR] Docker build failed
    echo Try running: docker system prune -a
    pause
    exit /b 1
)

echo.
echo Starting containers...
docker-compose up -d
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
echo Deployment successful!
echo ==========================================
echo Frontend: http://localhost:8086
echo Backend:  http://localhost:9200/docs
echo Database: localhost:5433
echo.
echo Default credentials:
echo   Email: suleman@gmail.com
echo   Password: Suleman123
echo ==========================================
echo.
pause