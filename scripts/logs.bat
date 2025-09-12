@echo off
echo Viewing Smart Task Management logs...
echo Press Ctrl+C to stop viewing logs
echo.
cd /d "%~dp0\.."
docker-compose logs -f