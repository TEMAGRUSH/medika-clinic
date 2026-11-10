@echo off
setlocal
cd /d "%~dp0"

echo ==================================================
echo   MEDIKA - publish to Cloudflare Pages (free)
echo ==================================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [!] Node.js not found. Install LTS from https://nodejs.org
  echo     then run this file again.
  echo.
  pause
  exit /b 1
)

if not exist "index.html" (
  echo [!] index.html not found. Keep this file next to the site files.
  echo.
  pause
  exit /b 1
)

echo A browser window will open - sign in to Cloudflare and allow access.
echo If asked to create project "medika-clinic" - answer Y.
echo.
call npx --yes wrangler@latest pages deploy . --project-name medika-clinic --branch main

echo.
echo Done. Public URL is printed above (https://medika-clinic.pages.dev).
pause
