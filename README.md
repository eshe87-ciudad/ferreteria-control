# 🚀 Sistema MercadoPago + WhatsApp - Notificaciones en Tiempo Real

Sistema completo de notificaciones instantáneas para pagos de MercadoPago con alertas por WhatsApp usando Twilio API.

## 🎯 Características

- ⚡ **Notificaciones instantáneas** por WhatsApp al recibir pagos
- 📊 **Reportes diarios automáticos** a las 23:00 hs
- 📈 **Reportes semanales** los domingos a las 20:00 hs
- 🔄 **Auto-reinicio** con PM2 para máxima disponibilidad
- 🌐 **Webhooks** con túnel ngrok para recepción de eventos
- 📱 **Dashboard en tiempo real** para monitoreo

## 🛠️ Tecnologías

- **Node.js** + Express.js
- **MercadoPago API v1**
- **Twilio WhatsApp API**
- **PM2** para gestión de procesos
- **ngrok** para túneles seguros
- **node-cron** para tareas programadas

## 📋 Prerrequisitos

- Node.js 16+ 
- Cuenta MercadoPago con Access Token
- Cuenta Twilio con WhatsApp habilitado
- ngrok instalado y configurado

## 🚀 Instalación Rápida

### 1. Clonar el repositorio
```bash
git clone https://github.com/eshe87-ciudad/ferreteria-control.git
cd ferreteria-control
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
Crea un archivo `.env` basado en `.env.example`:

```env
# MercadoPago
MP_ACCESS_TOKEN=tu_access_token_aqui

# Twilio WhatsApp
TWILIO_ACCOUNT_SID=tu_account_sid
TWILIO_AUTH_TOKEN=tu_auth_token
TWILIO_PHONE_NUMBER=+14155238886
MY_WHATSAPP_NUMBER=+5491131177334

# Servidor
PORT=3000
NODE_ENV=production
```

### 4. Iniciar el sistema
```bash
# Opción 1: Inicio manual
npm start

# Opción 2: Inicio completo con PM2 y ngrok
.\inicio-completo.bat
```

## 📁 Estructura del Proyecto

```
ferreteria-control/
├── webhook-server.js           # Servidor principal
├── reporte-diario.js          # Sistema de reportes automáticos
├── ecosystem.config.js        # Configuración PM2
├── package.json               # Dependencias
├── .env.example              # Variables de entorno ejemplo
├── inicio-completo.bat       # Script de inicio automático
├── start-ngrok.bat           # Script ngrok
├── logs/                     # Logs automáticos
└── README.md                 # Esta documentación
```

## 🎛️ Comandos Disponibles

### Gestión del servidor
```bash
npm start                    # Inicio básico
npm run dev                 # Desarrollo con nodemon
npm run pm2:start          # Iniciar con PM2
npm run pm2:stop           # Detener PM2
npm run pm2:restart        # Reiniciar PM2
npm run pm2:logs           # Ver logs
```

### Control PM2
```bash
pm2 status                 # Estado de procesos
pm2 monit                  # Monitor en tiempo real
pm2 restart all           # Reiniciar todos los procesos
pm2 stop all              # Detener todos los procesos
```

## 📱 Endpoints de la API

### Webhook principal
- `POST /webhook/mercadopago` - Recibe notificaciones de MercadoPago
- `GET /webhook/mercadopago` - Validación del webhook

### Estado y monitoreo
- `GET /` - Información del servidor
- `GET /health` - Health check
- `GET /webhook/status` - Estadísticas de webhooks

### Reportes
- `GET /test/reporte` - Enviar reporte de prueba
- `GET /reporte/manual` - Generar reporte manual

### Testing
- `GET /test/webhook` - Simular webhook de prueba
- `GET /test/twilio` - Probar conexión Twilio

## 🔧 Configuración de Producción

### 1. Instalar PM2 globalmente
```bash
npm install -g pm2
npm install -g pm2-windows-startup
```

### 2. Configurar auto-inicio
```bash
pm2-startup install
pm2 start ecosystem.config.js
pm2 save
```

### 3. Configurar ngrok (opcional para desarrollo)
```bash
ngrok authtoken tu_token_aqui
ngrok http 3000
```

## 🌐 Deploy en Servidor

### Variables de entorno requeridas:
```env
MP_ACCESS_TOKEN=APP_USR-xxxx
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=xxxxx
TWILIO_PHONE_NUMBER=+14155238886
MY_WHATSAPP_NUMBER=+5491xxxxxxx
PORT=3000
NODE_ENV=production
```

### Servicios recomendados:
- **VPS/Cloud:** AWS EC2, DigitalOcean, Heroku
- **Reverse Proxy:** nginx, Cloudflare
- **Monitoring:** PM2 Plus, New Relic

## 📊 Características del Sistema

### Notificaciones Instantáneas
- Tiempo de respuesta: < 1 segundo
- Formato: WhatsApp con emojis y detalles completos
- Información incluida: monto, cliente, método de pago, estado

### Reportes Automáticos
- **Diarios:** 23:00 hs con resumen completo del día
- **Semanales:** Domingos 20:00 hs con estadísticas
- **Manuales:** Disponibles via endpoint

### Auto-recuperación
- Reinicio automático en caso de errores
- Logs detallados para debugging
- Monitoreo de memoria y CPU
- Health checks cada 30 segundos

## 🔍 Troubleshooting

### El servidor no arranca
```bash
# Verificar puerto ocupado
netstat -ano | findstr :3000

# Matar procesos Node.js
taskkill /F /IM node.exe

# Reiniciar con PM2
pm2 restart all
```

### WhatsApp no llega
```bash
# Probar conexión Twilio
curl http://localhost:3000/test/twilio

# Verificar variables de entorno
echo $TWILIO_ACCOUNT_SID
```

### Webhooks no funcionan
```bash
# Verificar ngrok está corriendo
curl http://localhost:4040/api/tunnels

# Probar webhook local
curl -X POST http://localhost:3000/webhook/mercadopago
```

## 📞 Soporte

- **Issues:** [GitHub Issues](https://github.com/eshe87-ciudad/ferreteria-control/issues)
- **Documentación:** Este README
- **Logs:** Ver `logs/` directory

## 📄 Licencia

MIT License - Ver archivo LICENSE para más detalles.

---

⚡ **Sistema desarrollado para notificaciones en tiempo real de MercadoPago con WhatsApp**