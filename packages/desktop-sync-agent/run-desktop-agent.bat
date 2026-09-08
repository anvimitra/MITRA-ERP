@echo off
title ANVIMITRA-ERP Secondary Database Windows PC Sync Agent
echo ===================================================================
echo   ANVIMITRA-ERP Secondary Database On-Prem PC Sync Agent (.EXE)
echo ===================================================================
echo.
echo [*] Initializing Local Secondary SQLite Database Storage...
echo [*] Checking connection with Cloudflare ERP...
echo.

if not exist "%~dp0local-storage" mkdir "%~dp0local-storage"

start http://localhost:5432
node "%~dp0src\index.js"

pause
