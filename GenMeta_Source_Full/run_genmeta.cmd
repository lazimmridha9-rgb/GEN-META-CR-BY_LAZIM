@echo off
:: =============================================================================
:: GenMeta - Development Launcher (Source Directory)
:: =============================================================================
:: This script starts the GenMeta Electron application from source.
:: It should be run from within the GenMeta_Source_Full directory.
:: =============================================================================

:: Set the console window title
title GenMeta - Running from Source

:: Change to the directory where this script is located
cd /d "%~dp0"

:: Display startup message
echo Starting GenMeta v6.5.10 from source...
echo.

:: Launch the Electron application
npx electron .

:: Pause to show any output or errors before the window closes
pause
