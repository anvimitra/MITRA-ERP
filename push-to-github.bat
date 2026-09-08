@echo off
title Push ANVIMITRA-ERP to GitHub
echo ============================================================
echo          PUSH ANVIMITRA-ERP REPOSITORY TO GITHUB
echo ============================================================
echo.
echo Please create a new empty repository on https://github.com/new
echo Then paste your repository URL below.
echo Example: https://github.com/your-username/anvimitra-erp.git
echo.
set /p REPO_URL="Enter your GitHub Repository URL: "

if "%REPO_URL%"=="" (
    echo [ERROR] No URL entered. Aborting.
    pause
    exit /b
)

echo.
echo [*] Adding remote origin: %REPO_URL%
git remote remove origin 2>nul
git remote add origin %REPO_URL%

echo [*] Setting branch to main...
git branch -M main

echo [*] Pushing all files, mobile app, and GitHub Actions to GitHub...
git push -u origin main

echo.
echo ============================================================
echo   DONE! Repository pushed to GitHub!
echo   • GitHub Actions will automatically start building your
echo     Android APK (.apk) in the 'Actions' tab of your repo!
echo ============================================================
pause
