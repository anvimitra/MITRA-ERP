@echo off
title ANVIMITRA-ERP Master Launcher
echo ============================================================
echo      ANVIMITRA-ERP ALL-IN-ONE SYSTEM LAUNCHER
echo      (Cloud Core Backend + Web ERP + Mobile App)
echo ============================================================
echo.
echo [1/3] Starting Backend API (Port 4000)...
start "ANVIMITRA Backend API (Port 4000)" cmd /k "cd packages\backend && ..\..\node_modules\.bin\tsx.cmd src/index.ts"

timeout /t 3 /nobreak >nul

echo [2/3] Starting Web ERP Portal (Port 5173)...
start "ANVIMITRA Web ERP (Port 5173)" cmd /k "cd packages\frontend && ..\..\node_modules\.bin\vite.cmd --port 5173"

timeout /t 2 /nobreak >nul

echo [3/3] Starting LSK Academy Mobile App (Port 5174)...
start "LSK Academy Mobile App (Port 5174)" cmd /k "cd packages\mobile-app && ..\..\node_modules\.bin\vite.cmd --host --port 5174"

echo.
echo ============================================================
echo  ALL SERVICES STARTED SUCCESSFULLY!
echo  • Web ERP Portal : http://localhost:5173
echo  • LSK Mobile App : http://localhost:5174
echo  • Cloud Core API : http://localhost:4000
echo ============================================================
pause
