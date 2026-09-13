@echo off
title MITRA-ERP Mobile App Server
echo ============================================================
echo   MITRA-ERP SMART MOBILE APP
echo ============================================================
echo Starting Mobile App Dev Server on http://localhost:5174 ...
cd /d "%~dp0"
call ..\..\node_modules\.bin\vite.cmd --host --port 5174
pause
