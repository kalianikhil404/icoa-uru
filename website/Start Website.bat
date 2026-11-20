@echo off
setlocal
title Icoa-Uru website (keep this window open)
cd /d "%~dp0"
color 0F
echo.
echo   ICOA-URU WEBSITE
echo   ================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo   Node.js is not installed on this computer yet. It's free and only needed once.
  echo.
  echo   1. The Node.js download page is opening now.
  echo   2. Download the "LTS" version for Windows and install it ^(click Next until it finishes^).
  echo   3. Then double-click "Start Website.bat" again.
  echo.
  start "" "https://nodejs.org/en/download"
  pause
  exit /b 1
)

if not exist "node_modules\next\package.json" (
  echo   First start: downloading the parts the website needs.
  echo   This takes a few minutes and only happens once. Please wait...
  echo.
  call npm install --no-audit --no-fund
  if errorlevel 1 (
    echo.
    echo   Something went wrong while downloading. Check the internet connection and try again.
    pause
    exit /b 1
  )
)

node scripts\start.mjs
echo.
echo   The website has stopped.
pause
