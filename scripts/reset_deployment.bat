@echo off
echo ==========================================
echo Smart Task Management - Reset Deployment
echo ==========================================
echo.
echo WARNING: This will remove all containers and data!
echo.

set /p confirm="Are you sure you want to reset? (y/n): "
if /i not "%confirm%"=="y" (
    echo Reset cancelled.
    exit /b 0
)

echo.
echo Stopping all containers...
docker-compose down -v

echo.
echo Removing Docker volumes...
docker volume rm smart-task_postgres_data 2>nul

echo.
echo Cleaning up Docker system...
docker system prune -f

echo.
echo ==========================================
echo Reset complete! You can now run deploy.bat for a fresh installation.
echo ==========================================
echo.

pause