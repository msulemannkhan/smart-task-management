@echo off
REM ==========================================
REM Port Configuration Validation Script
REM Checks if all configuration files have correct ports
REM ==========================================

echo ==========================================
echo Validating Port Configuration
echo ==========================================
echo.

REM Navigate to project root
cd /d "%~dp0\.."

REM Load port configuration from .env.ports
if exist .env.ports (
    for /f "tokens=1,2 delims==" %%a in (.env.ports) do (
        if "%%a"=="FRONTEND_PORT" set FRONTEND_PORT=%%b
        if "%%a"=="BACKEND_PORT" set BACKEND_PORT=%%b
        if "%%a"=="DATABASE_PORT" set DATABASE_PORT=%%b
    )
) else (
    echo WARNING: .env.ports not found! Using defaults...
    set FRONTEND_PORT=8086
    set BACKEND_PORT=9200
    set DATABASE_PORT=5433
)

echo Expected Ports:
echo --------------
echo Frontend: %FRONTEND_PORT%
echo Backend:  %BACKEND_PORT%
echo Database: %DATABASE_PORT%
echo.

echo ==========================================
echo Checking Configuration Files
echo ==========================================
echo.

echo 1. Master Configuration (.env.ports):
echo -------------------------------------
if exist .env.ports (
    type .env.ports | findstr "PORT="
    echo.
) else (
    echo ✗ File not found
    echo.
)

echo 2. Frontend Configuration (frontend/.env):
echo ------------------------------------------
if exist frontend\.env (
    echo VITE_API_URL:
    type frontend\.env | findstr "VITE_API_URL"
    echo VITE_WS_URL:
    type frontend\.env | findstr "VITE_WS_URL"
    echo.
) else (
    echo ✗ File not found
    echo.
)

echo 3. Backend Configuration (backend/.env):
echo ----------------------------------------
if exist backend\.env (
    echo DATABASE_URL:
    type backend\.env | findstr "DATABASE_URL" | findstr -v "#"
    echo CORS_ORIGINS:
    type backend\.env | findstr "BACKEND_CORS_ORIGINS"
    echo.
) else (
    echo ✗ File not found
    echo.
)

echo 4. Root Configuration (.env):
echo -----------------------------
if exist .env (
    echo DATABASE_URL:
    type .env | findstr "DATABASE_URL" | findstr -v "#"
    echo CORS_ORIGINS:
    type .env | findstr "BACKEND_CORS_ORIGINS"
    echo.
) else (
    echo ✗ File not found
    echo.
)

echo 5. Docker Compose Configuration:
echo --------------------------------
if exist docker-compose.yml (
    echo Port mappings in docker-compose.yml:
    type docker-compose.yml | findstr "ports:" -A 1
    echo.
) else (
    echo ✗ File not found
    echo.
)

echo ==========================================
echo Checking Running Services
echo ==========================================
echo.

REM Check if Docker is running
docker version >nul 2>&1
if %errorlevel% equ 0 (
    echo Docker Container Status:
    docker-compose ps
    echo.
    
    echo Testing Service Endpoints:
    echo -------------------------
    
    REM Test Frontend
    curl -s -o nul -w "Frontend (port %FRONTEND_PORT%): HTTP %%{http_code}\n" http://localhost:%FRONTEND_PORT% 2>nul
    
    REM Test Backend
    curl -s -o nul -w "Backend API (port %BACKEND_PORT%): HTTP %%{http_code}\n" http://localhost:%BACKEND_PORT% 2>nul
    
    REM Test API Docs
    curl -s -o nul -w "API Docs (port %BACKEND_PORT%): HTTP %%{http_code}\n" http://localhost:%BACKEND_PORT%/docs 2>nul
    
    echo.
    echo Note: HTTP 200 = Success, HTTP 307 = Redirect (OK), Connection Failed = Service not running
) else (
    echo Docker is not running. Start Docker Desktop to test services.
)

echo.
echo ==========================================
echo Validation Complete
echo ==========================================
echo.
echo If ports are incorrect, run:
echo   scripts\update_ports.bat - to sync all configs with .env.ports
echo   scripts\deploy.bat - to rebuild and restart with new ports
echo.

pause