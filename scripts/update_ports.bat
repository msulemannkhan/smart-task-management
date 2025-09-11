@echo off
REM ==========================================
REM Port Configuration Update Helper
REM Updates all port references from .env.ports
REM ==========================================

echo ==========================================
echo Port Configuration Update Script
echo ==========================================
echo.

REM Navigate to project root
cd /d "%~dp0\.."

REM Check if .env.ports exists
if not exist .env.ports (
    echo ERROR: .env.ports file not found!
    echo Creating default .env.ports file...
    (
        echo # Master Port Configuration
        echo # Change these values to update all services across the application
        echo # After changing, run: scripts\deploy.bat
        echo.
        echo # Service Ports ^(exposed to host^)
        echo FRONTEND_PORT=8086
        echo BACKEND_PORT=9200
        echo DATABASE_PORT=5433
        echo.
        echo # Container Internal Ports ^(rarely need to change^)
        echo BACKEND_CONTAINER_PORT=8000
        echo FRONTEND_CONTAINER_PORT=80
        echo DATABASE_CONTAINER_PORT=5432
        echo.
        echo # Constructed URLs ^(automatically built from ports above^)
        echo FRONTEND_URL=http://localhost:8086
        echo API_URL=http://localhost:9200
        echo WS_URL=ws://localhost:9200
        echo.
        echo # CORS Origins ^(for backend to accept frontend requests^)
        echo CORS_ORIGINS=http://localhost:8086,http://127.0.0.1:8086,http://localhost:5173,http://localhost:5174
    ) > .env.ports
    echo Created default .env.ports file
)

echo.
echo Loading port configuration from .env.ports...
echo.

REM Read and display current configuration
for /f "tokens=1,2 delims==" %%a in (.env.ports) do (
    if "%%a"=="FRONTEND_PORT" set FRONTEND_PORT=%%b
    if "%%a"=="BACKEND_PORT" set BACKEND_PORT=%%b
    if "%%a"=="DATABASE_PORT" set DATABASE_PORT=%%b
)

echo Current Port Configuration:
echo ---------------------------
echo Frontend Port: %FRONTEND_PORT%
echo Backend Port:  %BACKEND_PORT%
echo Database Port: %DATABASE_PORT%
echo.

REM Update frontend/.env
echo Updating frontend/.env...
if exist frontend\.env (
    powershell -Command "(Get-Content frontend\.env) -replace 'VITE_API_URL=http://localhost:\d+', 'VITE_API_URL=http://localhost:%BACKEND_PORT%' | Set-Content frontend\.env.tmp"
    move /y frontend\.env.tmp frontend\.env >nul
    
    powershell -Command "(Get-Content frontend\.env) -replace 'VITE_WS_URL=ws://localhost:\d+', 'VITE_WS_URL=ws://localhost:%BACKEND_PORT%' | Set-Content frontend\.env.tmp"
    move /y frontend\.env.tmp frontend\.env >nul
    echo ✓ Updated frontend/.env
) else (
    echo ✗ frontend/.env not found
)

REM Update backend/.env
echo Updating backend/.env...
if exist backend\.env (
    powershell -Command "(Get-Content backend\.env) -replace 'localhost:\d+/smart_task_management', 'localhost:%DATABASE_PORT%/smart_task_management' | Set-Content backend\.env.tmp"
    move /y backend\.env.tmp backend\.env >nul
    
    powershell -Command "(Get-Content backend\.env) -replace 'BACKEND_CORS_ORIGINS=http://localhost:\d+', 'BACKEND_CORS_ORIGINS=http://localhost:%FRONTEND_PORT%' | Set-Content backend\.env.tmp"
    move /y backend\.env.tmp backend\.env >nul
    
    powershell -Command "(Get-Content backend\.env) -replace 'http://127.0.0.1:\d+', 'http://127.0.0.1:%FRONTEND_PORT%' | Set-Content backend\.env.tmp"
    move /y backend\.env.tmp backend\.env >nul
    echo ✓ Updated backend/.env
) else (
    echo ✗ backend/.env not found
)

REM Update root .env
echo Updating root .env...
if exist .env (
    powershell -Command "(Get-Content .env) -replace 'localhost:\d+/smart_task_management', 'localhost:%DATABASE_PORT%/smart_task_management' | Set-Content .env.tmp"
    move /y .env.tmp .env >nul
    
    powershell -Command "(Get-Content .env) -replace 'BACKEND_CORS_ORIGINS=http://localhost:\d+', 'BACKEND_CORS_ORIGINS=http://localhost:%FRONTEND_PORT%' | Set-Content .env.tmp"
    move /y .env.tmp .env >nul
    
    powershell -Command "(Get-Content .env) -replace 'http://127.0.0.1:\d+', 'http://127.0.0.1:%FRONTEND_PORT%' | Set-Content .env.tmp"
    move /y .env.tmp .env >nul
    echo ✓ Updated root .env
) else (
    echo ✗ root .env not found
)

echo.
echo ==========================================
echo Port configuration updated successfully!
echo ==========================================
echo.
echo Next steps:
echo 1. Run: scripts\deploy.bat
echo 2. Clear browser cache (Ctrl+Shift+R)
echo 3. Access frontend at: http://localhost:%FRONTEND_PORT%
echo 4. Access backend at:  http://localhost:%BACKEND_PORT%/docs
echo.

pause