@echo off
cd /d "%~dp0"

:: Kill any existing process on port 3005
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3005 ^| findstr LISTENING') do (
    taskkill /PID %%a /F >nul 2>&1
)

:: Remove Next.js dev lock if it exists
if exist ".next\dev\lock" del /f ".next\dev\lock"

:: Install dependencies if needed
if not exist "node_modules" (
    echo Installation des dependances...
    call npm install
)

echo Demarrage de Lean Planning...
npx next dev -p 3005
pause
