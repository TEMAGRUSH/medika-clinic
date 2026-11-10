@echo off
setlocal
cd /d "%~dp0"

echo ==================================================
echo   MEDIKA - publish to Netlify
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

echo A browser window will open - sign in to Netlify and confirm access.
echo NOTE: the account must have deploy credits left.
echo.
call npx --yes netlify-cli@latest deploy --dir=. --prod

echo.
echo Done. Public URL is printed above.
pause
