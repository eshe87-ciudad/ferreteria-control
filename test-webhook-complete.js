const fetch = require('node-fetch');

// Tu access token de MercadoPago
const ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;

// URL del webhook ngrok
const WEBHOOK_URL = 'https://unbrooding-transpirable-minerva.ngrok-free.dev/webhook/mercadopago';

async function obtenerInformacionCuenta() {
    try {
        console.log('🔍 Obteniendo información de la cuenta...');
        
        // Primer endpoint para account info
        const response1 = await fetch('https://api.mercadopago.com/users/me', {
            headers: {
                'Authorization': `Bearer ${ACCESS_TOKEN}`
            }
        });
        
        if (response1.ok) {
            const data = await response1.json();
            console.log('✅ Usuario info:', {
                id: data.id,
                email: data.email,
                country_id: data.country_id,
                site_id: data.site_id
            });
            return data;
        } else {
            console.log('❌ Error usuario info:', response1.status);
            console.log(await response1.text());
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

async function registrarWebhookCorrect() {
    try {
        console.log('\n🚀 Intentando registrar webhook...');
        
        // Método 1: v1/webhooks directo
        console.log('📝 Método 1: /v1/webhooks');
        const webhookData = {
            url: WEBHOOK_URL,
            events: ['payment', 'plan', 'subscription', 'invoice']
        };
        
        const response = await fetch('https://api.mercadopago.com/v1/webhooks', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(webhookData)
        });
        
        console.log('Status:', response.status);
        const responseText = await response.text();
        console.log('Response:', responseText);
        
        if (!response.ok) {
            console.log('\n📝 Método 2: /v1/applications/webhook');
            
            // Método 2: applications endpoint
            const response2 = await fetch('https://api.mercadopago.com/v1/applications/webhook', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${ACCESS_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(webhookData)
            });
            
            console.log('Status método 2:', response2.status);
            console.log('Response método 2:', await response2.text());
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

async function listarWebhooksExistentes() {
    try {
        console.log('\n📋 Listando webhooks existentes...');
        
        const response = await fetch('https://api.mercadopago.com/v1/webhooks', {
            headers: {
                'Authorization': `Bearer ${ACCESS_TOKEN}`
            }
        });
        
        console.log('Status:', response.status);
        const responseText = await response.text();
        console.log('Response:', responseText);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

async function probarWebhookLocal() {
    try {
        console.log('\n🌐 Probando webhook local...');
        
        const response = await fetch(WEBHOOK_URL, {
            method: 'GET',
            headers: {
                'User-Agent': 'MercadoPago-Test',
                'ngrok-skip-browser-warning': 'true'
            }
        });
        
        console.log('Status:', response.status);
        console.log('Response:', await response.text());
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

async function main() {
    console.log('🔧 === DIAGNÓSTICO COMPLETO WEBHOOK ===\n');
    
    await obtenerInformacionCuenta();
    await probarWebhookLocal();
    await listarWebhooksExistentes();
    await registrarWebhookCorrect();
}

main().catch(console.error);