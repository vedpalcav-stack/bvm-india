@echo off
title BVM ERP - First Time Setup
cd /d "%~dp0"
echo ================================================
echo   BVM ERP - First Time Installation
echo ================================================
echo.
echo Installing all dependencies...
echo This will take 2-3 minutes, please wait...
echo.
npm run install:all
echo.
echo ================================================
echo   Installation Complete!
echo ================================================
echo.
echo Now follow these steps every day to use the ERP:
echo.
echo 1. Double-click "START BACKEND.bat"
echo 2. Double-click "START FRONTEND.bat"
echo 3. Open browser and go to: http://localhost:3000
echo.
pause
