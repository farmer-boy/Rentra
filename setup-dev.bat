@echo off
REM Rentra Web Development Setup Script

echo.
echo ╔═══════════════════════════════════════════════════════════╗
echo ║         Rentra Project - Web Development Setup            ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.

REM Check if pnpm is installed
WHERE pnpm >nul 2>nul
IF %ERRORLEVEL% NEQU 0 (
    echo ✗ pnpm is not installed. Please install it first:
    echo   npm install -g pnpm
    pause
    exit /b 1
)

echo ✓ pnpm found

REM Navigate to project root
cd /d "%~dp0"

REM Remove old node_modules if exists
if exist node_modules (
    echo.
    echo Cleaning up old dependencies...
    rmdir /s /q node_modules
)

REM Clear pnpm store if needed
echo.
echo Configuring pnpm store...

REM Install all dependencies
echo.
echo Installing dependencies (this may take a few minutes)...
call pnpm install

if %ERRORLEVEL% NEQ 0 (
    echo ✗ Installation failed!
    pause
    exit /b 1
)

echo ✓ Dependencies installed successfully

REM Start development server
echo.
echo ╔═══════════════════════════════════════════════════════════╗
echo ║        Starting development server...                      ║
echo ║        Open: http://localhost:5173                         ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.

cd apps\web
call pnpm run dev

pause
