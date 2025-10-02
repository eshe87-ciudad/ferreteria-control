@echo off
title MercadoPago System - COMPLETE AUTO START
echo.
echo 🚀 ============================================
echo    SISTEMA MERCADOPAGO - INICIO AUTOMATICO
echo ============================================
echo.

cd /d "%~dp0"

echo 📡 1. Iniciando servidor webhook con PM2...
pm2 start ecosystem.config.js
timeout /t 3 /nobreak > nul

echo.
echo 🌐 2. Iniciando tunel ngrok...
start "NgRok Tunnel" /min start-ngrok.bat
timeout /t 2 /nobreak > nul

echo.
echo 📊 3. Estado del sistema:
pm2 status

echo.
echo ✅ ============================================
echo    SISTEMA COMPLETAMENTE INICIADO
echo ============================================
echo.
echo 📱 WhatsApp: ACTIVO
echo 💳 MercadoPago: ACTIVO  
echo 🌐 NgRok: INICIANDO...
echo 📊 Reportes: AUTOMATICOS (23:00 hs)
echo.
echo 💡 Presiona cualquier tecla para abrir monitor...
pause > nul

echo 🌐 Abriendo monitor en navegador...
start http://localhost:3000

echo.
echo 🎯 Sistema funcionando autonomamente
echo ⚡ Las notificaciones llegan solas 24/7
echo 📊 Reportes diarios automaticos a las 23:00 hs
echo.
pause