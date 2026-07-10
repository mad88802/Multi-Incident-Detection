@echo off
setlocal enabledelayedexpansion
echo.
echo  ==================================================
echo   VisionAI - Build Frontend + Start Backend
echo  ==================================================
echo.

:: ── Check Prerequisites ──────────────────────────────────────────────────────
echo [*] Checking prerequisites...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [!] ERROR: Node.js is not installed or not in your PATH.
    echo Please install Node.js v18 or newer from https://nodejs.org/
    pause
    exit /b 1
)

where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [!] ERROR: Python is not installed or not in your PATH.
    echo Please install Python v3.9 or newer and check Add Python to PATH.
    pause
    exit /b 1
)

:: ── Step 1: Build the React frontend ──────────────────────────────────────────
echo.
echo [1/3] Navigating to frontend and building...
cd /d "%~dp0frontend"

if not exist "node_modules" (
    echo [*] node_modules not found. Installing npm dependencies...
    call npm install
) else (
    echo [*] npm dependencies already installed.
)

echo [*] Building React static files...
call npm run build
if %errorlevel% neq 0 (
    echo.
    echo [!] ERROR: Frontend build failed. See the messages above.
    pause
    exit /b 1
)
echo [*] Frontend built successfully.

:: ── Step 2: Start Flask backend ───────────────────────────────────────────────
echo.
echo [2/3] Setting up Python virtual environment...
cd /d "%~dp0backend"

if not exist ".venv" (
    echo [*] Creating virtual environment...
    python -m venv .venv
    if %errorlevel% neq 0 (
        echo [!] ERROR: Failed to create virtual environment.
        pause
        exit /b 1
    )
)

echo [*] Activating virtual environment...
call .venv\Scripts\activate.bat

echo [*] Verifying/Installing Python dependencies...
echo Note: First time installation of torch and ultralytics can take 1 to 2 minutes. Please wait...
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo.
    echo [!] ERROR: Failed to install Python dependencies.
    pause
    exit /b 1
)

:: ── Step 3: Start Server ──────────────────────────────────────────────────────
echo.
echo [3/3] Starting Flask server...
echo App will be available at http://localhost:5001
echo Press Ctrl+C to stop.
echo.

python app.py
if %errorlevel% neq 0 (
    echo.
    echo [!] ERROR: Backend server crashed or failed to start.
    pause
    exit /b 1
)

pause
