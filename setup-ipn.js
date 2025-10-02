const fetch = require('node-fetch');

// Tu access token de MercadoPago
const ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;

// URL del webhook ngrok
const WEBHOOK_URL = 'https://unbrooding-transpirable-minerva.ngrok-free.dev/webhook/mercadopago';

async function registrarIPN() {
    try {
        console.log('🚀 Configurando IPN (Instant Payment Notification)...');
        console.log('URL:', WEBHOOK_URL);
        
        // Configurar IPN a través del endpoint correcto
        const ipnData = {
            notification_url: WEBHOOK_URL
        };
        
        console.log('📤 Configurando IPN con datos:', JSON.stringify(ipnData, null, 2));
        
        // Intentar con el endpoint de preferencias
        const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                items: [{
                    title: 'Test Item for IPN Setup',
                    quantity: 1,
                    unit_price: 0.01
                }],
                notification_url: WEBHOOK_URL,
                auto_return: 'approved'
            })
        });
        
        console.log('📥 Respuesta HTTP:', response.status);
        const responseText = await response.text();
        console.log('📥 Response:', responseText);
        
        if (response.ok) {
            const data = JSON.parse(responseText);
            console.log('✅ IPN configurado exitosamente!');
            console.log('Preference ID:', data.id);
            console.log('Notification URL:', data.notification_url);
            console.log('Checkout URL:', data.init_point);
            
            return data;
        } else {
            console.log('❌ Error configurando IPN');
            try {
                const errorData = JSON.parse(responseText);
                console.log('Error details:', errorData);
            } catch {
                console.log('Raw error:', responseText);
            }
        }
        
    } catch (error) {
        console.error('❌ Error de conexión:', error.message);
    }
}

async function configurarWebhookApp() {
    try {
        console.log('\n🔧 Intentando configurar webhook a nivel de aplicación...');
        
        const user_id = '3608042'; // De la respuesta anterior
        
        // Endpoint correcto para aplicaciones
        const response = await fetch(`https://api.mercadopago.com/v1/applications/${user_id}/notification_url`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                notification_url: WEBHOOK_URL
            })
        });
        
        console.log('Status:', response.status);
        console.log('Response:', await response.text());
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

async function crearPagoTest() {
    try {
        console.log('\n💳 Creando pago de prueba para activar webhooks...');
        
        const paymentData = {
            transaction_amount: 0.01,
            description: 'Test payment for webhook',
            payment_method_id: 'account_money',
            payer: {
                email: 'test@example.com'
            },
            notification_url: WEBHOOK_URL
        };
        
        const response = await fetch('https://api.mercadopago.com/v1/payments', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(paymentData)
        });
        
        console.log('Status:', response.status);
        const responseText = await response.text();
        console.log('Response:', responseText);
        
        if (response.ok) {
            const data = JSON.parse(responseText);
            console.log('✅ Pago creado, webhook debería recibir notificación');
            console.log('Payment ID:', data.id);
            console.log('Status:', data.status);
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

async function main() {
    console.log('🔧 === CONFIGURACIÓN IPN MERCADOPAGO ===\n');
    
    await registrarIPN();
    await configurarWebhookApp();
    await crearPagoTest();
    
    console.log('\n✅ Proceso completado. Verifica tu servidor para notificaciones entrantes.');
    console.log(`📡 Monitor: http://localhost:3000/health`);
    console.log(`🌐 Webhook: ${WEBHOOK_URL}`);
}

main().catch(console.error);