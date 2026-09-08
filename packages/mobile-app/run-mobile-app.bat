@echo off
title LSK Academy - ANVIMITRA Mobile App Server
echo ============================================================
echo   LSK ACADEMY SMART ERP MOBILE APP (ANVIMITRA-ERP)
echo ============================================================
echo Starting Mobile App Dev Server on http://localhost:5174 ...
cd /d "%~dp0"
call ..\..\node_modules\.bin\vite.cmd --host --port 5174
pause
