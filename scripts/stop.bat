@echo off
echo Stopping Smart Task Management containers...
cd /d "%~dp0\.."
docker-compose down
echo Containers stopped.
pause