@echo off
:: =============================================================================
:: GenMeta - Development Launcher (Parent Directory)
:: =============================================================================
:: This script starts the GenMeta Electron application from source.
:: It is located in the parent directory and navigates into GenMeta_Source_Full.
:: =============================================================================

:: Set the console window title
title GenMeta - Running from Source

:: Change to the GenMeta source directory (sibling to this script)
cd /d "%~dp0GenMeta_Source_Full"

:: Display startup message
echo Starting GenMeta v6.5.10 from source...
echo.

:: Launch the Electron application
npx electron .

:: Pause to show any output or errors before the window closes
pause
