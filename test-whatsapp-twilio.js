const fetch = require('node-fetch');

// 🔧 CONFIGURACIÓN RÁPIDA TWILIO
// Reemplaza con tus credenciales reales de Twilio

const TWILIO_CONFIG = {
    accountSid: 'TU_ACCOUNT_SID_AQUI',           // Empieza con AC...
    authToken: 'TU_AUTH_TOKEN_AQUI',             // 32 caracteres
    phoneNumber: '+14155238886',                  // Número Twilio Sandbox
    myWhatsApp: '+54911XXXXXXXX'                 // Tu número WhatsApp
};

async function enviarMensajePrueba() {
    try {
        console.log('📱 Enviando mensaje de prueba WhatsApp...');
        
        // Verificar configuración
        if (TWILIO_CONFIG.accountSid === 'TU_ACCOUNT_SID_AQUI') {
            console.log('❌ Por favor configura tus credenciales Twilio primero');
            console.log('📝 Edita este archivo y reemplaza:');
            console.log('   - TU_ACCOUNT_SID_AQUI con tu Account SID');
            console.log('   - TU_AUTH_TOKEN_AQUI con tu Auth Token');
            console.log('   - +54911XXXXXXXX con tu número WhatsApp');
            return;
        }
        
        const mensaje = `🎉 ¡PRUEBA EXITOSA!

Tu sistema de alertas MercadoPago está funcionando:

✅ Servidor webhook: ACTIVO
✅ ngrok tunnel: CONECTADO  
✅ MercadoPago IPN: CONFIGURADO
✅ WhatsApp Twilio: FUNCIONANDO

🚀 Tu sistema está listo para notificaciones instantáneas.

Fecha: ${new Date().toLocaleString('es-AR')}`;

        const auth = Buffer.from(`${TWILIO_CONFIG.accountSid}:${TWILIO_CONFIG.authToken}`).toString('base64');
        
        const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_CONFIG.accountSid}/Messages.json`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                From: `whatsapp:${TWILIO_CONFIG.phoneNumber}`,
                To: `whatsapp:${TWILIO_CONFIG.myWhatsApp}`,
                Body: mensaje
            })
        });
        
        const responseText = await response.text();
        
        if (response.ok) {
            const data = JSON.parse(responseText);
            console.log('✅ ¡Mensaje enviado exitosamente!');
            console.log('📱 SID:', data.sid);
            console.log('📞 To:', data.to);
            console.log('📤 Status:', data.status);
            console.log('💰 Price:', data.price || 'FREE');
            console.log('\n🎯 Verifica tu WhatsApp para ver el mensaje!');
        } else {
            console.log('❌ Error enviando mensaje:', response.status);
            console.log('Response:', responseText);
            
            try {
                const errorData = JSON.parse(responseText);
                if (errorData.code === 21211) {
                    console.log('\n📱 SOLUCIÓN: Tu número no está registrado en el Sandbox');
                    console.log('1. Envía un mensaje a +1 415 523 8886');
                    console.log('2. Texto: "join <tu-sandbox-code>"');
                    console.log('3. El código lo encuentras en console.twilio.com');
                }
            } catch {}
        }
        
    } catch (error) {
        console.error('❌ Error de conexión:', error.message);
        console.log('\n🔧 Verifica:');
        console.log('1. Account SID correcto (empieza con AC)');
        console.log('2. Auth Token correcto (32 caracteres)');
        console.log('3. Conexión a internet');
    }
}

async function verificarCredenciales() {
    try {
        console.log('🔍 Verificando credenciales Twilio...');
        
        const auth = Buffer.from(`${TWILIO_CONFIG.accountSid}:${TWILIO_CONFIG.authToken}`).toString('base64');
        
        const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_CONFIG.accountSid}.json`, {
            headers: {
                'Authorization': `Basic ${auth}`
            }
        });
        
        if (response.ok) {
            const account = await response.json();
            console.log('✅ Credenciales válidas');
            console.log('👤 Account:', account.friendly_name);
            console.log('📧 Email:', account.owner_account_sid);
            console.log('🌎 Status:', account.status);
            console.log('💰 Balance:', account.balance || 'N/A');
            return true;
        } else {
            console.log('❌ Credenciales inválidas:', response.status);
            return false;
        }
        
    } catch (error) {
        console.error('❌ Error verificando credenciales:', error.message);
        return false;
    }
}

async function main() {
    console.log('🚀 === PRUEBA SISTEMA WHATSAPP TWILIO ===\n');
    
    const credencialesValidas = await verificarCredenciales();
    
    if (credencialesValidas) {
        console.log('\n' + '='.repeat(50) + '\n');
        await enviarMensajePrueba();
    }
    
    console.log('\n📋 INSTRUCCIONES RÁPIDAS:');
    console.log('1. Edita este archivo con tus credenciales Twilio');
    console.log('2. Activa WhatsApp Sandbox en console.twilio.com');
    console.log('3. Ejecuta: node test-whatsapp-twilio.js');
    console.log('4. ¡Verifica tu WhatsApp!');
}

// Ejecutar si es llamado directamente
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { enviarMensajePrueba, verificarCredenciales, TWILIO_CONFIG };