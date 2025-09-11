@echo off
REM Fix all hardcoded localhost:8000 references in frontend source

echo Fixing all localhost:8000 references to localhost:9200...
echo.

cd /d "%~dp0\..\frontend\src"

echo Updating AuthContext.tsx...
powershell -Command "(Get-Content context\AuthContext.tsx) -replace 'http://localhost:8000', 'http://localhost:9200' | Set-Content context\AuthContext.tsx"

echo Updating useWebSocket.ts...
powershell -Command "(Get-Content hooks\useWebSocket.ts) -replace 'http://localhost:8000', 'http://localhost:9200' | Set-Content hooks\useWebSocket.ts"

echo Updating ForgotPassword.tsx...
powershell -Command "(Get-Content pages\ForgotPassword.tsx) -replace 'http://localhost:8000', 'http://localhost:9200' | Set-Content pages\ForgotPassword.tsx"

echo Updating Profile.tsx...
powershell -Command "(Get-Content pages\Profile.tsx) -replace 'http://localhost:8000', 'http://localhost:9200' | Set-Content pages\Profile.tsx"

echo Updating ResetPassword.tsx...
powershell -Command "(Get-Content pages\ResetPassword.tsx) -replace 'http://localhost:8000', 'http://localhost:9200' | Set-Content pages\ResetPassword.tsx"

echo Updating api.ts...
powershell -Command "(Get-Content services\api.ts) -replace 'http://localhost:8000', 'http://localhost:9200' | Set-Content services\api.ts"

echo.
echo All files updated! Now rebuild the frontend container.
pause