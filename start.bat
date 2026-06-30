@echo off
cd /d "%~dp0"
echo Starting Framing ERP System...
echo.

start "ERP Server" cmd /c "cd /d server && node src/index.js"
echo Backend starting on http://localhost:3001 ...
timeout /t 3 /nobreak >nul

start "ERP Client" cmd /c "cd /d client && npx vite --host --port 5173"
echo Frontend starting on http://localhost:5173 ...
echo.
echo Open http://localhost:5173 in your browser
echo Close both windows to stop the system.
pause
