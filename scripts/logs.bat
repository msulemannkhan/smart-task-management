@echo off
cd /d "%~dp0\.."

if "[%1]" == "[file]" (
    echo Writing logs to docker.log...
    echo Press Ctrl+C to stop logging.
    docker-compose logs -f > docker.log
) else (
    echo Viewing Smart Task Management logs...
    echo Press Ctrl+C to stop viewing logs.
    docker-compose logs -f
)