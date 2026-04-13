@echo off
echo Starting JSON Server on port 3000...
echo.

:: Try npx first (cmd.exe doesn't have the PowerShell restriction)
where npx >nul 2>&1
if %errorlevel% == 0 (
    npx json-server --watch db.json --port 3000
    goto :end
)

:: Fallback: install json-server globally then run
echo npx not found. Installing json-server globally...
npm install -g json-server
json-server --watch db.json --port 3000

:end
