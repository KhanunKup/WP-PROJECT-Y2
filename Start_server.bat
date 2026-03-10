@echo off
title EASYMANAGE
echo ====================================================
echo Starting EASYMANAGE Warehouse Management System...
echo ====================================================

echo Installing dependencies (if missing)...
call npm install

echo Opening Web Browser...
start http://localhost:3000

echo Starting Node.js Server...
npm run dev

pause