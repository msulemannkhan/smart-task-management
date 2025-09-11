@echo off
REM ==========================================
REM Fix Frontend Port Configuration
REM Rebuilds frontend with correct API URLs from .env.ports
REM ==========================================

echo ==========================================
echo Fixing Frontend Port Configuration
echo ==========================================
echo.

REM Navigate to project root
cd /d "%~dp0\.."

REM Load port configuration from .env.ports
if exist .env.ports (
    echo Loading port configuration from .env.ports...
    for /f "tokens=1,2 delims==" %%a in (.env.ports) do (
        if "%%a"=="FRONTEND_PORT" set FRONTEND_PORT=%%b
        if "%%a"=="BACKEND_PORT" set BACKEND_PORT=%%b
        if "%%a"=="DATABASE_PORT" set DATABASE_PORT=%%b
    )
) else (
    echo ERROR: .env.ports not found!
    echo Please run scripts\update_ports.bat first
    pause
    exit /b 1
)

echo.
echo Port Configuration:
echo ------------------
echo Frontend will run on: %FRONTEND_PORT%
echo Backend API is on:    %BACKEND_PORT%
echo Database is on:       %DATABASE_PORT%
echo.

REM Check Docker is running
docker version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker is not running!
    echo Please start Docker Desktop and try again.
    pause
    exit /b 1
)

echo Step 1: Verifying frontend/.env has correct values...
echo ------------------------------------------------------
if exist frontend\.env (
    echo Current frontend/.env API configuration:
    type frontend\.env | findstr "VITE_API_URL"
    type frontend\.env | findstr "VITE_WS_URL"
    
    REM Update frontend/.env with correct ports
    powershell -Command "(Get-Content frontend\.env) -replace 'VITE_API_URL=http://localhost:\d+', 'VITE_API_URL=http://localhost:%BACKEND_PORT%' | Set-Content frontend\.env.tmp"
    move /y frontend\.env.tmp frontend\.env >nul
    
    powershell -Command "(Get-Content frontend\.env) -replace 'VITE_WS_URL=ws://localhost:\d+', 'VITE_WS_URL=ws://localhost:%BACKEND_PORT%' | Set-Content frontend\.env.tmp"
    move /y frontend\.env.tmp frontend\.env >nul
    
    echo.
    echo Updated to:
    type frontend\.env | findstr "VITE_API_URL"
    type frontend\.env | findstr "VITE_WS_URL"
) else (
    echo Creating frontend/.env with correct ports...
    (
        echo # API Configuration
        echo VITE_API_URL=http://localhost:%BACKEND_PORT%
        echo VITE_WS_URL=ws://localhost:%BACKEND_PORT%
        echo.
        echo # Supabase Configuration ^(for production auth^)
        echo VITE_SUPABASE_URL=your-supabase-url
        echo VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
    ) > frontend\.env
    echo Created frontend/.env
)
echo.

echo Step 2: Stopping frontend container...
echo --------------------------------------
docker-compose stop frontend >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ Frontend container stopped
) else (
    echo ✓ Frontend container was not running
)
echo.

echo Step 3: Removing old frontend container and image...
echo ----------------------------------------------------
docker-compose rm -f frontend >nul 2>&1
docker rmi stm-frontend -f >nul 2>&1
echo ✓ Old frontend artifacts removed
echo.

echo Step 4: Rebuilding frontend with new API URL (port %BACKEND_PORT%)...
echo ---------------------------------------------------------------------
echo This will take a moment as it needs to rebuild the React app...
echo.

REM Load environment variables for docker-compose
set FRONTEND_PORT=%FRONTEND_PORT%
set BACKEND_PORT=%BACKEND_PORT%
set DATABASE_PORT=%DATABASE_PORT%
set API_URL=http://localhost:%BACKEND_PORT%
set WS_URL=ws://localhost:%BACKEND_PORT%
set FRONTEND_URL=http://localhost:%FRONTEND_PORT%

docker-compose build --no-cache frontend
if %errorlevel% neq 0 (
    echo ERROR: Frontend build failed!
    echo Check the error messages above.
    pause
    exit /b 1
)
echo ✓ Frontend rebuilt successfully
echo.

echo Step 5: Starting new frontend container...
echo ------------------------------------------
docker-compose up -d frontend
if %errorlevel% neq 0 (
    echo ERROR: Failed to start frontend container!
    pause
    exit /b 1
)
echo ✓ Frontend container started
echo.

echo Step 6: Waiting for frontend to be ready...
echo -------------------------------------------
timeout /t 10 /nobreak >nul
echo.

echo Step 7: Testing connections...
echo ------------------------------
echo.

REM Test Frontend
echo Testing Frontend (port %FRONTEND_PORT%):
curl -s -o nul -w "Status: HTTP %%{http_code}\n" http://localhost:%FRONTEND_PORT%
echo.

REM Test Backend
echo Testing Backend API (port %BACKEND_PORT%):
curl -s -o nul -w "Status: HTTP %%{http_code}\n" http://localhost:%BACKEND_PORT%
echo.

REM Test API Docs
echo Testing API Docs:
curl -s -o nul -w "Status: HTTP %%{http_code}\n" http://localhost:%BACKEND_PORT%/docs
echo.

echo Step 8: Verifying frontend is using correct API URL...
echo ------------------------------------------------------
docker-compose exec frontend sh -c "grep -o 'localhost:[0-9]*' /usr/share/nginx/html/assets/*.js | head -5" 2>nul
echo.
echo (Should show localhost:%BACKEND_PORT%, not any other port)
echo.

echo ==========================================
echo Fix complete!
echo ==========================================
echo.
echo IMPORTANT: Clear your browser cache!
echo -------------------------------------
echo 1. Press F12 to open Developer Tools
echo 2. Right-click the Refresh button
echo 3. Select "Empty Cache and Hard Reload"
echo    OR
echo    Press Ctrl+Shift+R for hard refresh
echo.
echo Then access the application at:
echo --------------------------------
echo Frontend: http://localhost:%FRONTEND_PORT%
echo Backend:  http://localhost:%BACKEND_PORT%/docs
echo.
echo If you still see connection errors:
echo 1. Clear browser storage (F12 > Application > Clear Storage)
echo 2. Try incognito/private browsing mode
echo 3. Run scripts\deploy.bat for a full rebuild
echo.

pause