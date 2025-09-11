@echo off
echo ==========================================
echo Restarting Backend Container
echo ==========================================
echo.

echo Stopping backend container...
docker-compose restart backend

echo.
echo Waiting for backend to be ready...
timeout /t 5 /nobreak >nul

echo.
echo Testing backend health...
curl -s http://localhost:9200/docs >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ Backend API is accessible!
) else (
    echo ✗ Backend API is not accessible yet. Please wait a moment and try again.
)

echo.
echo Checking backend logs for errors...
docker-compose logs --tail=20 backend

echo.
echo ==========================================
echo Backend restart complete!
echo ==========================================
echo.
echo You can now refresh your browser to test the calendar.
echo.

pause