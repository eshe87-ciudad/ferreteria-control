const fetch = require('node-fetch');

// Tu access token de MercadoPago
const ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;

// URL del webhook ngrok
const WEBHOOK_URL = 'https://unbrooding-transpirable-minerva.ngrok-free.dev/webhook/mercadopago';

async function crearPreferenciaConIPN() {
    try {
        console.log('🚀 Creando preferencia de pago con IPN...');
        
        const preferenceData = {
            items: [{
                title: 'Test de Webhook MercadoPago',
                quantity: 1,
                unit_price: 100, // $100 ARS
                currency_id: 'ARS'
            }],
            notification_url: WEBHOOK_URL,
            back_urls: {
                success: 'https://tu-sitio.com/success',
                failure: 'https://tu-sitio.com/failure',
                pending: 'https://tu-sitio.com/pending'
            },
            auto_return: 'approved',
            external_reference: 'test-webhook-' + Date.now()
        };
        
        console.log('📤 Datos de preferencia:', JSON.stringify(preferenceData, null, 2));
        
        const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(preferenceData)
        });
        
        console.log('📥 Status:', response.status);
        const responseText = await response.text();
        
        if (response.ok) {
            const data = JSON.parse(responseText);
            console.log('✅ ¡Preferencia creada exitosamente!');
            console.log('\n📋 INFORMACIÓN IMPORTANTE:');
            console.log('🆔 Preference ID:', data.id);
            console.log('🔗 Checkout URL:', data.init_point);
            console.log('📡 Notification URL:', data.notification_url);
            console.log('📝 External Reference:', data.external_reference);
            
            console.log('\n🎯 INSTRUCCIONES:');
            console.log('1. Abre esta URL en tu navegador:');
            console.log('   ' + data.init_point);
            console.log('2. Completa una compra de prueba');
            console.log('3. Tu webhook recibirá notificaciones automáticamente');
            console.log('4. Verifica los logs en tu servidor Node.js');
            
            return data;
        } else {
            console.log('❌ Error:', response.status);
            console.log('Response:', responseText);
            
            try {
                const errorData = JSON.parse(responseText);
                console.log('Error details:', JSON.stringify(errorData, null, 2));
            } catch {}
        }
        
    } catch (error) {
        console.error('❌ Error de conexión:', error.message);
    }
}

async function obtenerMétodosPago() {
    try {
        console.log('\n💳 Obteniendo métodos de pago disponibles...');
        
        const response = await fetch('https://api.mercadopago.com/v1/payment_methods', {
            headers: {
                'Authorization': `Bearer ${ACCESS_TOKEN}`
            }
        });
        
        if (response.ok) {
            const methods = await response.json();
            console.log('✅ Métodos disponibles:');
            methods.slice(0, 5).forEach(method => {
                console.log(`  - ${method.id}: ${method.name}`);
            });
        }
        
    } catch (error) {
        console.error('❌ Error obteniendo métodos:', error.message);
    }
}

async function verificarWebhookURL() {
    try {
        console.log('\n🌐 Verificando accesibilidad del webhook...');
        
        const response = await fetch(WEBHOOK_URL, {
            method: 'GET',
            headers: {
                'User-Agent': 'MercadoPago-Verification'
            }
        });
        
        if (response.ok) {
            console.log('✅ Webhook accesible desde internet');
            console.log('Response:', await response.text());
        } else {
            console.log('❌ Webhook no accesible:', response.status);
        }
        
    } catch (error) {
        console.error('❌ Error verificando webhook:', error.message);
    }
}

async function main() {
    console.log('🔧 === CONFIGURACIÓN COMPLETA WEBHOOK MERCADOPAGO ===\n');
    
    await verificarWebhookURL();
    await obtenerMétodosPago();
    await crearPreferenciaConIPN();
    
    console.log('\n🚀 ¡Configuración completada!');
    console.log('📊 Monitor tu servidor en: http://localhost:3000/health');
    console.log('🔍 Logs del webhook aparecerán en la consola del servidor');
}

main().catch(console.error);