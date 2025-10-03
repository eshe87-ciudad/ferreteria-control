@echo off
title MercadoPago NgRok Tunnel - AUTO START
echo.
echo 🌐 ========================================
echo    INICIANDO TUNEL NGROK AUTOMATICO
echo ========================================
echo.
echo 📡 Conectando con ngrok...
echo ⚡ Puerto: 3000
echo 🔗 Generando URL publica...
echo.

cd /d "%~dp0"
ngrok http 3000 --authtoken=2mK6Mc5ULnLaHzLCOBGvKwjjEYw_6nGrKhyQLrKFTgcQaEVhh

pause