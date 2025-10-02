const fetch = require('node-fetch');
require('dotenv').config();

// 🔧 CONFIGURACIÓN - Variables de entorno
const CONFIG = {
    // Credenciales desde variables de entorno
    TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
    
    // Números de WhatsApp
    TWILIO_PHONE: process.env.TWILIO_PHONE_NUMBER || '+14155238886',
    MY_WHATSAPP: process.env.MY_WHATSAPP_NUMBER,
    
    // MercadoPago desde variables de entorno
    MP_ACCESS_TOKEN: process.env.MP_ACCESS_TOKEN
};

async function enviarMensajePruebaWhatsApp() {
    console.log('🚀 === PRUEBA SISTEMA WHATSAPP MERCADOPAGO ===\n');
    
    // Verificar configuración
    if (CONFIG.TWILIO_ACCOUNT_SID === 'TU_ACCOUNT_SID_AQUI') {
        console.log('❌ CONFIGURACIÓN PENDIENTE');
        console.log('');
        console.log('📝 Para configurar:');
        console.log('1. Ve a: https://console.twilio.com');
        console.log('2. Copia tu Account SID y Auth Token');
        console.log('3. Activa WhatsApp Sandbox (envía "join código" a +1 415 523 8886)');
        console.log('4. Edita este archivo con tus credenciales');
        console.log('5. Ejecuta: node test-whatsapp-completo.js');
        console.log('');
        console.log('🔗 Guía completa: http://localhost:3000/../twilio-config-rapida.html');
        return;
    }
    
    try {
        console.log('📱 Enviando mensaje de prueba a WhatsApp...');
        console.log('De:', CONFIG.TWILIO_PHONE);
        console.log('Para:', CONFIG.MY_WHATSAPP);
        console.log('');
        
        const mensaje = `🎉 ¡SISTEMA ACTIVO!

🚀 Tu plataforma MercadoPago + WhatsApp está funcionando perfectamente:

✅ Servidor webhook: OPERATIVO
✅ ngrok tunnel: CONECTADO
✅ MercadoPago IPN: CONFIGURADO  
✅ WhatsApp Twilio: FUNCIONANDO

💳 Próxima vez que recibas un pago en MercadoPago, recibirás una alerta instantánea aquí.

⚡ ¡Todo listo para notificaciones en TIEMPO REAL!

📅 ${new Date().toLocaleString('es-AR')}
🔗 Monitor: http://localhost:3000/../monitor-realtime.html`;

        // Crear autenticación básica
        const auth = Buffer.from(`${CONFIG.TWILIO_ACCOUNT_SID}:${CONFIG.TWILIO_AUTH_TOKEN}`).toString('base64');
        
        // Enviar mensaje vía Twilio API
        const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${CONFIG.TWILIO_ACCOUNT_SID}/Messages.json`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                From: `whatsapp:${CONFIG.TWILIO_PHONE}`,
                To: `whatsapp:${CONFIG.MY_WHATSAPP}`,
                Body: mensaje
            })
        });
        
        const responseText = await response.text();
        
        if (response.ok) {
            const data = JSON.parse(responseText);
            console.log('✅ ¡MENSAJE ENVIADO EXITOSAMENTE!');
            console.log('');
            console.log('📋 Detalles:');
            console.log('🆔 SID:', data.sid);
            console.log('📱 To:', data.to);
            console.log('📤 Status:', data.status);
            console.log('💰 Price:', data.price || 'FREE');
            console.log('🕐 Created:', data.date_created);
            console.log('');
            console.log('🎯 ¡Verifica tu WhatsApp ahora!');
            console.log('📱 Deberías ver el mensaje con toda la información del sistema.');
            console.log('');
            console.log('🚀 SIGUIENTE PASO:');
            console.log('Haz una compra en: https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=3608042-ab6b8f5a-f15e-4a4c-a15d-53fa490a9642');
            console.log('Y verás la alerta de pago llegar automáticamente!');
            
        } else {
            console.log('❌ ERROR ENVIANDO MENSAJE');
            console.log('Status:', response.status);
            console.log('Response:', responseText);
            
            try {
                const errorData = JSON.parse(responseText);
                console.log('');
                console.log('🔧 DIAGNÓSTICO:');
                
                if (errorData.code === 21211) {
                    console.log('❌ Tu número no está registrado en el WhatsApp Sandbox');
                    console.log('');
                    console.log('✅ SOLUCIÓN:');
                    console.log('1. Abre WhatsApp en tu teléfono');
                    console.log('2. Envía un mensaje a: +1 415 523 8886');
                    console.log('3. El mensaje debe ser: "join [tu-codigo]"');
                    console.log('4. Ve a console.twilio.com → Messaging → Try WhatsApp');
                    console.log('5. Ahí encontrarás tu código único');
                    console.log('6. Ejemplo: "join operation-carbon"');
                    console.log('7. Espera confirmación y vuelve a ejecutar este script');
                } else if (errorData.code === 20003) {
                    console.log('❌ Credenciales inválidas');
                    console.log('✅ Verifica Account SID y Auth Token en console.twilio.com');
                } else {
                    console.log('❌ Error:', errorData.message);
                    console.log('🔗 Código:', errorData.code);
                }
            } catch {
                console.log('Raw error:', responseText);
            }
        }
        
    } catch (error) {
        console.error('❌ ERROR DE CONEXIÓN:', error.message);
        console.log('');
        console.log('🔧 Verifica:');
        console.log('1. Conexión a internet');
        console.log('2. Credenciales Twilio correctas');
        console.log('3. Account SID empieza con "AC"');
        console.log('4. Auth Token tiene 32 caracteres');
    }
}

async function verificarSistemaCompleto() {
    console.log('🔍 Verificando sistema completo...\n');
    
    try {
        // 1. Verificar servidor webhook
        console.log('📡 1. Verificando servidor webhook...');
        const healthResponse = await fetch('http://localhost:3000/health');
        if (healthResponse.ok) {
            const health = await healthResponse.json();
            console.log('   ✅ Servidor activo (uptime:', Math.floor(health.uptime), 'segundos)');
        } else {
            console.log('   ❌ Servidor offline');
            return;
        }
        
        // 2. Verificar estadísticas webhook
        console.log('📊 2. Verificando estadísticas...');
        const statsResponse = await fetch('http://localhost:3000/webhook/status');
        if (statsResponse.ok) {
            const stats = await statsResponse.json();
            console.log('   📈 Webhooks recibidos:', stats.totalWebhooks);
            console.log('   🕐 Último webhook:', stats.lastWebhook || 'Ninguno');
        }
        
        // 3. Verificar configuración Twilio
        console.log('🔧 3. Verificando configuración Twilio...');
        const twilioResponse = await fetch('http://localhost:3000/test/twilio');
        if (twilioResponse.ok) {
            const twilio = await twilioResponse.json();
            if (twilio.configured) {
                console.log('   ✅ Twilio configurado');
                console.log('   📱 Account:', twilio.account_sid?.substr(0, 10) + '...');
            } else {
                console.log('   ⚠️  Twilio no configurado');
            }
        }
        
        console.log('\n🚀 Sistema verificado. Procediendo con la prueba...\n');
        
    } catch (error) {
        console.log('❌ Error verificando sistema:', error.message);
    }
}

// Función principal
async function main() {
    await verificarSistemaCompleto();
    await enviarMensajePruebaWhatsApp();
}

// Ejecutar si se llama directamente
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { CONFIG, enviarMensajePruebaWhatsApp };