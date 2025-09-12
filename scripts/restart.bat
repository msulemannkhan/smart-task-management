@echo off
echo Restarting Smart Task Management containers...
cd /d "%~dp0\.."
docker-compose restart
echo Containers restarted.
pause