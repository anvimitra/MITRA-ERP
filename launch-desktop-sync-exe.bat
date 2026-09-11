@echo off
title MITRA-ERP Local Storage PC Sync Connector
echo ============================================================
echo   STARTING MITRA-ERP LOCAL STORAGE PC SYNC CONNECTOR
echo ============================================================
echo.
echo [*] Target Directory: %~dp0packages\desktop-sync-agent
cd /d "%~dp0packages\desktop-sync-agent"

if not exist "local-storage" mkdir "local-storage"

if exist "bin\ANVIMITRA-Sync-Agent.exe" (
    echo [*] Starting Standalone Sync Agent (.EXE)...
    start http://localhost:5432
    "bin\ANVIMITRA-Sync-Agent.exe"
) else if exist "bin\LSK-Academy-Sync-Agent.exe" (
    echo [*] Starting Standalone Sync Agent (.EXE)...
    start http://localhost:5432
    "bin\LSK-Academy-Sync-Agent.exe"
) else (
    echo [*] Starting via Node.js runtime...
    start http://localhost:5432
    node src\index.js
)
pause
