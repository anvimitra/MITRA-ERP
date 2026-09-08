@echo off
title LSK Academy Secondary DB Sync Agent (.EXE)
echo ============================================================
echo   STARTING LSK ACADEMY SECONDARY DATABASE SYNC AGENT (.EXE)
echo ============================================================
cd /d "%~dp0packages\desktop-sync-agent\bin"
if exist LSK-Academy-Sync-Agent.exe (
    LSK-Academy-Sync-Agent.exe
) else (
    echo [ERROR] LSK-Academy-Sync-Agent.exe not found!
)
pause
