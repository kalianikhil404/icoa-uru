@echo off
setlocal
title Publish the Icoa-Uru website
cd /d "%~dp0"
echo.
echo   PUBLISH THE WEBSITE ON THE INTERNET
echo   ===================================
echo.
echo   This puts the website online with Vercel (free), so anyone can visit it.
echo   Run it again whenever you want the online website to show your latest changes.
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo   Node.js is not installed yet. Double-click "Start Website.bat" first; it explains how.
  pause
  exit /b 1
)
if not exist "node_modules\next\package.json" (
  echo   Downloading the parts the website needs first...
  call npm install --no-audit --no-fund
)

echo   Step 1 of 2: checking that the website builds without errors...
echo.
call npm run build
if errorlevel 1 (
  echo.
  echo   The website has an error, so nothing was published. The red text above says what is wrong.
  pause
  exit /b 1
)

echo.
echo   Step 2 of 2: uploading to Vercel.
echo   The first time, it asks you to log in ^(a browser window opens^) and asks a few questions.
echo   Press Enter to accept each suggested answer.
echo.
call npx --yes vercel@latest --prod
echo.
echo   Done. The line starting with "Production:" above is your website's address.
pause
