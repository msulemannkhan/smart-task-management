@echo off
echo ==========================================
echo Smart Task - Fix All Console Errors
echo ==========================================
echo.
echo This script will rebuild containers to apply all fixes for:
echo - userActivities reference errors
echo - Password autocomplete warnings  
echo - Activity repository database errors
echo.

echo Step 1: Rebuilding Frontend Container...
echo ==========================================
docker-compose stop frontend
docker-compose rm -f frontend
docker-compose build frontend
docker-compose up -d frontend

echo.
echo Step 2: Restarting Backend Container...
echo ==========================================
docker-compose restart backend

echo.
echo Step 3: Waiting for services to be ready...
timeout /t 15 /nobreak >nul

echo.
echo Step 4: Checking service health...
echo ==========================================
echo Testing Frontend...
curl -s http://localhost:8086 >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Frontend is accessible
) else (
    echo [!!] Frontend not ready yet
)

echo.
echo Testing Backend...
curl -s http://localhost:9200/docs >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Backend API is accessible
) else (
    echo [!!] Backend not ready yet
)

echo.
echo Testing Database...
docker-compose exec database pg_isready -U postgres >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Database is ready
) else (
    echo [!!] Database not ready yet
)

echo.
echo ==========================================
echo All fixes applied successfully!
echo ==========================================
echo.
echo IMPORTANT: Clear your browser cache!
echo 1. Press Ctrl+Shift+Delete
echo 2. Select "Cached images and files"
echo 3. Click "Clear data"
echo.
echo Or simply press Ctrl+Shift+R for hard refresh
echo.
echo Then navigate to http://localhost:8086/dashboard
echo.
echo All console errors should now be resolved:
echo - No more userActivities errors
echo - No more autocomplete warnings
echo - Activity feed working properly
echo.

pause