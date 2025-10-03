# 🚀 AUTOMATIZACIÓN COMPLETA - MERCADOPAGO + WHATSAPP
# Este script configura TODO para que arranque automáticamente

Write-Host "🚀 Configurando automatización completa..." -ForegroundColor Green

# 1. INSTALAR PM2 (Gestor de procesos para Node.js)
Write-Host "`n📦 Instalando PM2 para gestión automática de procesos..." -ForegroundColor Yellow
npm install -g pm2
npm install -g pm2-windows-startup

# 2. CONFIGURAR PM2 PARA AUTO-INICIO
Write-Host "`n🔄 Configurando PM2 para auto-inicio con Windows..." -ForegroundColor Yellow
pm2-startup install

# 3. CREAR SCRIPT DE INICIO PARA NGROK
$ngrokScript = @"
@echo off
echo 🌐 Iniciando ngrok automaticamente...
cd /d "$PWD"
ngrok http 3000 --authtoken=2mK6Mc5ULnLaHzLCOBGvKwjjEYw_6nGrKhyQLrKFTgcQaEVhh
"@

$ngrokScript | Out-File -FilePath ".\start-ngrok.bat" -Encoding ASCII

# 4. CREAR CONFIGURACIÓN PM2
$pm2Config = @"
{
  "apps": [
    {
      "name": "mercadopago-webhook-server",
      "script": "webhook-server.js",
      "cwd": "$PWD",
      "instances": 1,
      "autorestart": true,
      "watch": false,
      "max_memory_restart": "1G",
      "env": {
        "NODE_ENV": "production",
        "PORT": "3000"
      },
      "error_file": "./logs/err.log",
      "out_file": "./logs/out.log",
      "log_file": "./logs/combined.log",
      "time": true
    }
  ]
}
"@

# Crear directorio de logs
New-Item -ItemType Directory -Force -Path ".\logs"

$pm2Config | Out-File -FilePath ".\ecosystem.config.js" -Encoding UTF8

Write-Host "`n✅ Archivos de configuración creados:" -ForegroundColor Green
Write-Host "  📄 ecosystem.config.js - Configuración PM2"
Write-Host "  📄 start-ngrok.bat - Script de ngrok"
Write-Host "  📁 logs/ - Directorio de logs"

Write-Host "`n🎯 Siguiente paso: Ejecutar configuración automática..." -ForegroundColor Cyan