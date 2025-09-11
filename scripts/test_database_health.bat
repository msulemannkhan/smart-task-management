@echo off
echo ==========================================
echo Testing Database Health Check
echo ==========================================
echo.

echo Checking if database container is running...
docker ps | findstr stm-database >nul
if %errorlevel% equ 0 (
    echo ✓ Database container is running
) else (
    echo ✗ Database container is not running
    exit /b 1
)

echo.
echo Testing database connection with correct service name...
docker-compose exec database pg_isready -U postgres
if %errorlevel% equ 0 (
    echo ✓ Database is accepting connections!
) else (
    echo ✗ Database is not ready
)

echo.
echo Testing database query...
docker-compose exec database psql -U postgres -d smart_task_management -c "SELECT 'Database is working!' as status;"
if %errorlevel% equ 0 (
    echo ✓ Database queries work!
) else (
    echo ✗ Database queries failed
)

echo.
echo ==========================================
echo Database health check complete!
echo ==========================================

pause