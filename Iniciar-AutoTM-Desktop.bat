@echo off
chcp 65001 >nul
title Auto-T&M Karsten — Inicializador Desktop
cd /d "%~dp0"
echo ========================================================
echo   Iniciando Auto-T&M Karsten (Versao Desktop Electron)
echo ========================================================
call npm run desktop
