@echo off
echo ==========================================
echo Rebuilding Frontend Container
echo ==========================================
echo.
echo This will rebuild the frontend with your latest code changes.
echo.

echo Step 1: Stopping frontend container...
docker-compose stop frontend

echo.
echo Step 2: Removing old frontend container...
docker-compose rm -f frontend

echo.
echo Step 3: Rebuilding frontend image with latest code...
docker-compose build frontend

echo.
echo Step 4: Starting new frontend container...
docker-compose up -d frontend

echo.
echo Waiting for frontend to be ready...
timeout /t 10 /nobreak >nul

echo.
echo Testing frontend accessibility...
curl -s http://localhost:8086 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ Frontend is accessible at http://localhost:8086
) else (
    echo ✗ Frontend is not accessible yet. Please wait a moment and try again.
)

echo.
echo ==========================================
echo Frontend rebuild complete!
echo ==========================================
echo.
echo IMPORTANT: After this completes, please:
echo 1. Clear your browser cache (Ctrl+Shift+Delete)
echo 2. Or do a hard refresh (Ctrl+Shift+R)
echo 3. Then navigate to http://localhost:8086/calendar
echo.

pause