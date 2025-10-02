# 🚀 Servidor Webhook MercadoPago + WhatsApp

Servidor Node.js para recibir webhooks de MercadoPago y enviar alertas instantáneas a WhatsApp vía Twilio.

## ⚡ Características

- ✅ **Webhooks instantáneos** de MercadoPago
- 📱 **Alertas WhatsApp** automáticas vía Twilio
- 🌐 **Exposición con ngrok** para desarrollo
- 🔒 **Variables de entorno** para seguridad
- 📊 **Logs detallados** de todas las transacciones
- 🧪 **Endpoint de prueba** incluido

## 🛠️ Instalación Rápida (5 minutos)

### 1️⃣ Instalar dependencias
```bash
npm install
```

### 2️⃣ Configurar variables de entorno
```bash
# Copiar archivo de ejemplo
copy .env.example .env

# Editar .env con tus credenciales:
# - MP_ACCESS_TOKEN (tu token de MercadoPago)
# - TWILIO_ACCOUNT_SID (de tu cuenta Twilio)
# - TWILIO_AUTH_TOKEN (de tu cuenta Twilio) 
# - MY_WHATSAPP_NUMBER (tu número, ej: +5491123456789)
```

### 3️⃣ Instalar ngrok
```bash
# Descargar desde: https://ngrok.com/download
# O con Chocolatey (Windows):
choco install ngrok

# O con Homebrew (macOS):
brew install ngrok
```

### 4️⃣ Ejecutar servidor
```bash
# Terminal 1: Iniciar servidor webhook
npm start

# Terminal 2: Exponer con ngrok
ngrok http 3000
```

### 5️⃣ Configurar webhook en MercadoPago
Usa la URL que te da ngrok (ej: `https://abc123.ngrok.io/webhook/mercadopago`)

## 📋 Uso

### Iniciar servidor
```bash
npm start
```

### Modo desarrollo (con auto-reload)
```bash
npm run dev
```

### Probar webhook
```bash
# GET para verificar estado
curl http://localhost:3000/

# POST para probar webhook
curl -X POST http://localhost:3000/test/webhook
```

## 🌐 Endpoints

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/` | GET | Estado del servidor |
| `/health` | GET | Health check |
| `/webhook/mercadopago` | POST | **Webhook principal** |
| `/test/webhook` | POST | Prueba de webhook |

## ⚡ Flujo de Webhook

1. **MercadoPago** → Envía webhook a tu servidor
2. **Servidor** → Procesa inmediatamente
3. **MercadoPago API** → Obtiene detalles del pago
4. **Twilio** → Envía WhatsApp instantáneo
5. **Tu teléfono** → ¡Recibes la alerta!

**Tiempo total: < 2 segundos** ⚡

## 📱 Ejemplo de WhatsApp

```
🏪 FERRETERÍA CONTROL

✅ PAGO APROBADO
💰 Monto: $45,750
💳 Método: Tarjeta de Crédito
🕐 Hora: 14:23:45
📅 Fecha: 02/10/2025
👤 Cliente: Juan P.**
🔢 ID: 12345678901

💳 ¡Dinero disponible en tu cuenta!

📊 Notificación instantánea vía Webhook
```

## 🔧 Configuración

### Variables de entorno (.env)
```bash
# MercadoPago
MP_ACCESS_TOKEN=APP_USR-1234567890...

# Twilio
TWILIO_ACCOUNT_SID=ACxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxx
TWILIO_PHONE_NUMBER=+14155238886

# WhatsApp destino
MY_WHATSAPP_NUMBER=+5491123456789

# Servidor
PORT=3000
NODE_ENV=development
```

### ngrok
```bash
# Exponer puerto 3000
ngrok http 3000

# Tu webhook URL será:
https://abc123.ngrok.io/webhook/mercadopago
```

## 🧪 Testing

### Probar webhook local
```bash
curl -X POST http://localhost:3000/test/webhook
```

### Verificar estado
```bash
curl http://localhost:3000/health
```

### Logs en tiempo real
El servidor muestra logs detallados de todos los webhooks:

```
⚡ WEBHOOK RECIBIDO: { action: 'payment.created', type: 'payment', data_id: '12345' }
💰 Procesando pago: 12345
📊 Pago obtenido: $45750 (approved)
✅ Twilio WhatsApp enviado: SMxxxxxxxx
📱 WhatsApp enviado exitosamente
✅ Pago procesado completamente: 12345
```

## 🚨 Troubleshooting

### Error: "Configuración faltante"
- Verifica que `.env` existe y tiene todas las variables
- Revisa que los tokens de MercadoPago y Twilio sean correctos

### Error: "Twilio no configurado"
- Verifica `TWILIO_ACCOUNT_SID` y `TWILIO_AUTH_TOKEN`
- Asegúrate de haber verificado tu número en Twilio Sandbox

### Error: "ngrok no conecta"
- Verifica que el servidor esté corriendo en puerto 3000
- Revisa que ngrok esté instalado correctamente

### No llegan webhooks
- Verifica que la URL en MercadoPago sea la de ngrok (HTTPS)
- Revisa que el servidor esté corriendo y accesible

## 📈 Monitoreo

El servidor incluye:
- ✅ **Health checks** automáticos
- 📊 **Logs estructurados** con timestamps
- 🔍 **Tracking de errores** detallado
- ⚡ **Métricas de rendimiento** en tiempo real

## 🔒 Seguridad

- ✅ Variables de entorno para credenciales
- ✅ Validación de webhooks
- ✅ CORS configurado
- ✅ Manejo de errores robusto
- ✅ Logs sin datos sensibles

## 🚀 Producción

Para producción, considera:
- Usar un servidor cloud (Heroku, Railway, etc.)
- Configurar dominio propio
- Implementar autenticación de webhooks
- Añadir rate limiting
- Configurar monitoring avanzado

## 📞 Soporte

Si necesitas ayuda:
1. Revisa los logs del servidor
2. Verifica la configuración en `.env`
3. Prueba el endpoint `/test/webhook`
4. Consulta la documentación de MercadoPago y Twilio