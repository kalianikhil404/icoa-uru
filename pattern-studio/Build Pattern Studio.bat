@echo off
title Building Icoa-Uru Pattern Studio
cd /d "%~dp0"
where npm >nul 2>nul
if errorlevel 1 (
  echo Node.js isn't installed. Get it from https://nodejs.org and run this again.
  pause
  exit /b 1
)
echo Getting the build tools (only slow the first time)...
call npm install --no-audit --no-fund
if errorlevel 1 goto failed
echo Building the app...
call npm run dist
if errorlevel 1 goto failed
echo.
echo Done. The new .exe files are in the dist folder.
start "" "%~dp0dist"
pause
exit /b 0
:failed
echo.
echo Something went wrong. Scroll up to see what happened.
pause
exit /b 1
