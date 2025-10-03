const fetch = require('node-fetch');
require('dotenv').config();

// Tu access token de MercadoPago desde variables de entorno
const ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;

// URL del webhook ngrok
const WEBHOOK_URL = 'https://unbrooding-transpirable-minerva.ngrok-free.dev/webhook/mercadopago';

async function registrarWebhook() {
    try {
        console.log('🚀 Registrando webhook en MercadoPago...');
        console.log('URL:', WEBHOOK_URL);
        
        const webhookData = {
            url: WEBHOOK_URL,
            events: [
                'payment',
                'plan',
                'subscription',
                'invoice'
            ]
        };
        
        console.log('📤 Enviando datos:', JSON.stringify(webhookData, null, 2));
        
        const response = await fetch('https://api.mercadopago.com/v1/webhooks', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(webhookData)
        });
        
        const responseText = await response.text();
        console.log('📥 Respuesta HTTP:', response.status);
        console.log('📥 Headers:', Object.fromEntries(response.headers.entries()));
        console.log('📥 Body raw:', responseText);
        
        if (response.ok) {
            const data = JSON.parse(responseText);
            console.log('✅ ¡Webhook registrado exitosamente!');
            console.log('ID:', data.id);
            console.log('URL:', data.url);
            console.log('Events:', data.events);
            console.log('Status:', data.status);
        } else {
            console.log('❌ Error registrando webhook');
            try {
                const errorData = JSON.parse(responseText);
                console.log('Error details:', errorData);
            } catch {
                console.log('Raw error:', responseText);
            }
        }
        
    } catch (error) {
        console.error('❌ Error de conexión:', error.message);
        console.error('Stack:', error.stack);
    }
}

// También probar la conectividad básica
async function probarConectividad() {
    try {
        console.log('🌐 Probando conectividad a MercadoPago...');
        
        const response = await fetch('https://api.mercadopago.com/v1/account/settings', {
            headers: {
                'Authorization': `Bearer ${ACCESS_TOKEN}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Token válido');
            console.log('País:', data.country_id);
            console.log('Sitio:', data.site_id);
        } else {
            console.log('❌ Token inválido');
            console.log('Status:', response.status);
            console.log('Response:', await response.text());
        }
    } catch (error) {
        console.error('❌ Error probando conectividad:', error.message);
    }
}

async function probarWebhookURL() {
    try {
        console.log('🌐 Probando webhook URL...');
        
        const response = await fetch(WEBHOOK_URL, {
            method: 'GET',
            headers: {
                'User-Agent': 'MercadoPago-Webhook-Test'
            }
        });
        
        console.log('Status:', response.status);
        console.log('Response:', await response.text());
        
    } catch (error) {
        console.error('❌ Error probando webhook URL:', error.message);
    }
}

// Ejecutar todas las pruebas
async function main() {
    console.log('🔧 === DIAGNÓSTICO WEBHOOK MERCADOPAGO ===');
    
    await probarConectividad();
    console.log('\n' + '='.repeat(50) + '\n');
    
    await probarWebhookURL();
    console.log('\n' + '='.repeat(50) + '\n');
    
    await registrarWebhook();
}

main().catch(console.error);
require('dotenv').config();
