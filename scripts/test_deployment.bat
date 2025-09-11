@echo off
echo ==========================================
echo Testing Smart Task Deployment
echo ==========================================
echo.

REM Test if Docker is running
docker version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker is not running
    exit /b 1
)

echo 1. Docker is running... OK
echo.

REM Check if containers are running
echo 2. Checking container status...
docker-compose ps
echo.

REM Test database connection
echo 3. Testing database connection...
docker-compose exec database pg_isready -U postgres
if %errorlevel% equ 0 (
    echo Database is ready!
) else (
    echo Database is not ready
)
echo.

REM Test backend API
echo 4. Testing backend API...
curl -s http://localhost:9200/docs >nul 2>&1
if %errorlevel% equ 0 (
    echo Backend API is accessible!
) else (
    echo Backend API is not accessible
)
echo.

REM Test frontend
echo 5. Testing frontend...
curl -s http://localhost:8086 >nul 2>&1
if %errorlevel% equ 0 (
    echo Frontend is accessible!
) else (
    echo Frontend is not accessible
)
echo.

echo ==========================================
echo Test complete!
echo ==========================================

pause