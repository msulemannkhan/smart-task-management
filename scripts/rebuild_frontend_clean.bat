@echo off
REM ==========================================
REM Complete Frontend Rebuild with Port 9200
REM This ensures frontend uses the correct backend port
REM ==========================================

echo ==========================================
echo Complete Frontend Rebuild with Port 9200
echo ==========================================
echo.

REM Navigate to project root
cd /d "%~dp0\.."

echo Step 1: Loading port configuration...
echo -------------------------------------
REM Load port configuration from .env.ports if it exists
if exist .env.ports (
    for /f "tokens=1,2 delims==" %%a in (.env.ports) do (
        set %%a=%%b
    )
    echo Loaded configuration from .env.ports
) else (
    echo Using default port configuration
    set FRONTEND_PORT=8086
    set BACKEND_PORT=9200
    set DATABASE_PORT=5433
)

REM Set all environment variables explicitly
set FRONTEND_PORT=8086
set BACKEND_PORT=9200
set DATABASE_PORT=5433
set API_URL=http://localhost:9200
set WS_URL=ws://localhost:9200
set FRONTEND_URL=http://localhost:8086
set BACKEND_CONTAINER_PORT=8000
set FRONTEND_CONTAINER_PORT=80
set DATABASE_CONTAINER_PORT=5432
set CORS_ORIGINS=http://localhost:8086,http://127.0.0.1:8086,http://localhost:5173,http://localhost:5174

echo.
echo Configuration:
echo - Frontend Port: %FRONTEND_PORT%
echo - Backend Port:  %BACKEND_PORT%
echo - API URL:       %API_URL%
echo - WS URL:        %WS_URL%
echo.

echo Step 2: Stopping all containers...
echo -----------------------------------
docker-compose down
if %errorlevel% equ 0 (
    echo [OK] All containers stopped
) else (
    echo [WARNING] Some containers may not have been running
)
echo.

echo Step 3: Removing old frontend image...
echo ---------------------------------------
docker rmi stm-frontend -f >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Old frontend image removed
) else (
    echo [OK] No old image to remove
)
echo.

echo Step 4: Cleaning Docker build cache...
echo ---------------------------------------
docker builder prune -f >nul 2>&1
echo [OK] Build cache cleaned
echo.

echo Step 5: Building frontend with correct API URL...
echo --------------------------------------------------
echo This will take a few minutes...
echo.

REM Build with explicit build arguments
docker-compose build --no-cache --build-arg VITE_API_URL=http://localhost:9200 --build-arg VITE_WS_URL=ws://localhost:9200 frontend

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Frontend build failed!
    echo Please check the error messages above.
    pause
    exit /b 1
)
echo.
echo [OK] Frontend built successfully with API URL: http://localhost:9200
echo.

echo Step 6: Starting all services...
echo ---------------------------------
docker-compose up -d

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Failed to start services!
    pause
    exit /b 1
)
echo [OK] All services started
echo.

echo Step 7: Waiting for services to be ready...
echo --------------------------------------------
echo Please wait 15 seconds for services to initialize...
timeout /t 15 /nobreak >nul
echo.

echo Step 8: Verifying frontend configuration...
echo --------------------------------------------
echo.
echo Checking JavaScript files for API URL:
echo.

REM Check what URLs are in the built JavaScript files
docker-compose exec frontend sh -c "grep -h 'localhost:[0-9]*' /usr/share/nginx/html/assets/*.js 2>/dev/null | grep -o 'localhost:[0-9]*' | sort -u | head -5" 2>nul

echo.
echo The above should ONLY show localhost:9200
echo If you see localhost:8000, the rebuild failed.
echo.

echo Step 9: Testing service endpoints...
echo -------------------------------------
echo.

REM Test Frontend
curl -s -o nul -w "Frontend (http://localhost:%FRONTEND_PORT%): HTTP %%{http_code}\n" http://localhost:%FRONTEND_PORT% 2>nul

REM Test Backend
curl -s -o nul -w "Backend API (http://localhost:%BACKEND_PORT%): HTTP %%{http_code}\n" http://localhost:%BACKEND_PORT% 2>nul

REM Test API Docs
curl -s -o nul -w "API Docs (http://localhost:%BACKEND_PORT%/docs): HTTP %%{http_code}\n" http://localhost:%BACKEND_PORT%/docs 2>nul

echo.
echo ==========================================
echo Rebuild Complete!
echo ==========================================
echo.
echo CRITICAL: You MUST clear your browser cache!
echo ---------------------------------------------
echo.
echo Option 1 - Hard Refresh:
echo   1. Open http://localhost:8086
echo   2. Press Ctrl+Shift+R (hard refresh)
echo.
echo Option 2 - Clear All Site Data:
echo   1. Press F12 to open Developer Tools
echo   2. Go to Application tab
echo   3. Click "Clear Storage" 
echo   4. Click "Clear site data"
echo.
echo Option 3 - Use Incognito/Private Mode:
echo   Open in a new incognito/private window
echo.
echo After clearing cache, access:
echo - Frontend: http://localhost:%FRONTEND_PORT%
echo - Backend:  http://localhost:%BACKEND_PORT%/docs
echo.
echo Login with:
echo - Email: demo@example.com
echo - Password: demo123
echo.

pause