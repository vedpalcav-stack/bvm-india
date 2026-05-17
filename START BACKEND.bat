@echo off
title BVM ERP - Backend
cd /d "%~dp0"
echo Starting BVM ERP Backend...
echo.
npm run dev:backend
pause
