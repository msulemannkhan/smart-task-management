@echo off
REM Smart Task Management System - Windows Deployment Script
REM This batch file runs the Python deployment script

echo ==========================================
echo Smart Task Management System Deployment
echo ==========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.8+ from https://www.python.org/downloads/
    pause
    exit /b 1
)

REM Check if Docker is running
docker version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker is not running or not installed
    echo Please install Docker Desktop from https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

REM Navigate to script directory
cd /d "%~dp0"

REM Load port configuration from .env.ports
cd ..
if exist .env.ports (
    for /f "tokens=1,2 delims==" %%a in (.env.ports) do (
        if "%%a"=="FRONTEND_PORT" set FRONTEND_PORT=%%b
        if "%%a"=="BACKEND_PORT" set BACKEND_PORT=%%b
        if "%%a"=="DATABASE_PORT" set DATABASE_PORT=%%b
    )
) else (
    REM Use defaults if .env.ports doesn't exist
    set FRONTEND_PORT=8086
    set BACKEND_PORT=9200
    set DATABASE_PORT=5433
)
cd scripts

REM Run the deployment script
echo Starting deployment...
python deploy.py %*

REM Check if deployment was successful
if %errorlevel% equ 0 (
    echo.
    echo ==========================================
    echo Deployment completed successfully!
    echo ==========================================
    echo.
    echo You can access the application at:
    echo   - Frontend: http://localhost:%FRONTEND_PORT%
    echo   - Backend:  http://localhost:%BACKEND_PORT%
    echo   - API Docs: http://localhost:%BACKEND_PORT%/docs
    echo.
    echo Default login credentials:
    echo   Email:    suleman@gmail.com
    echo   Password: Suleman123
    echo   Email:    demo@example.com
    echo   Password: demo123
    echo.
) else (
    echo.
    echo ==========================================
    echo Deployment failed! Check the error messages above.
    echo ==========================================
)

pause