const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();

// 📊 IMPORTAR SISTEMA DE REPORTES DIARIOS
const ReporteDiario = require('./reporte-diario');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path}`);
    next();
});

// Variables de configuración
const {
    MP_ACCESS_TOKEN,
    TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN,
    TWILIO_PHONE_NUMBER,
    MY_WHATSAPP_NUMBER
} = process.env;

// Verificar configuración al inicio
function verificarConfiguracion() {
    const required = {
        MP_ACCESS_TOKEN,
        TWILIO_ACCOUNT_SID,
        TWILIO_AUTH_TOKEN,
        MY_WHATSAPP_NUMBER
    };

    const missing = Object.entries(required)
        .filter(([key, value]) => !value)
        .map(([key]) => key);

    if (missing.length > 0) {
        console.warn('⚠️  Configuración faltante:', missing.join(', '));
        console.warn('📋 Copia .env.example a .env y completa las credenciales');
        return false;
    }

    console.log('✅ Configuración completa');
    return true;
}

// 📊 INICIALIZAR SISTEMA DE REPORTES
const reporteSystem = new ReporteDiario();

// Ruta principal - estado del servidor
app.get('/', (req, res) => {
    res.json({
        status: 'Servidor webhook activo',
        timestamp: new Date().toISOString(),
        endpoints: {
            webhook: '/webhook/mercadopago',
            health: '/health',
            test: '/test'
        },
        configuracion: {
            mercadopago: !!MP_ACCESS_TOKEN,
            twilio: !!(TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN),
            whatsapp: !!MY_WHATSAPP_NUMBER
        }
    });
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// 📊 ENDPOINT DE ESTADO WEBHOOK
let webhookStats = {
    totalWebhooks: 0,
    lastWebhook: null,
    lastAction: null
};

app.get('/webhook/status', (req, res) => {
    res.json(webhookStats);
});

// 🧪 ENDPOINT DE PRUEBA TWILIO
app.get('/test/twilio', (req, res) => {
    const configured = !!(TWILIO_ACCOUNT_SID && 
                         TWILIO_AUTH_TOKEN &&
                         TWILIO_ACCOUNT_SID !== 'DEMO_SID');
    
    res.json({
        configured,
        account_sid: configured ? TWILIO_ACCOUNT_SID : null,
        phone_number: TWILIO_PHONE_NUMBER,
        my_whatsapp: MY_WHATSAPP_NUMBER
    });
});

// 🚀 WEBHOOK PRINCIPAL - MercadoPago
app.post('/webhook/mercadopago', async (req, res) => {
    try {
        const { body } = req;
        const timestamp = new Date().toISOString();

        console.log('⚡ WEBHOOK RECIBIDO:', {
            action: body.action,
            type: body.type,
            data_id: body.data?.id,
            timestamp
        });

        // Actualizar estadísticas
        webhookStats.totalWebhooks++;
        webhookStats.lastWebhook = timestamp;
        webhookStats.lastAction = body.action;

        // 📊 REGISTRAR PARA REPORTE DIARIO
        reporteSystem.registrarTransaccion(body);

        // Responder inmediatamente a MercadoPago
        res.status(200).send('OK');

        // Procesar webhook de forma asíncrona
        procesarWebhookAsync(body, timestamp);

    } catch (error) {
        console.error('❌ Error en webhook:', error);
        res.status(500).send('Error');
    }
});

// Webhook para validación inicial (GET request)
app.get('/webhook/mercadopago', (req, res) => {
    console.log('🔍 Validación webhook GET recibida');
    res.status(200).send('Webhook endpoint active');
});

// Procesamiento asíncrono del webhook
async function procesarWebhookAsync(webhookData, timestamp) {
    try {
        const { action, type, data } = webhookData;

        // Solo procesar eventos de pagos
        if (type === 'payment') {
            console.log(`💰 Procesando pago: ${data.id}`);
            
            // Obtener detalles completos del pago
            const pago = await obtenerDetallePago(data.id);
            
            if (pago) {
                // Enviar notificación WhatsApp inmediata
                await enviarAlertaWhatsAppInstantanea(pago, action);
                
                // Notificar a la aplicación frontend (opcional)
                await notificarFrontend(pago);
                
                console.log(`✅ Pago procesado completamente: ${pago.id}`);
            }
        } else {
            console.log(`ℹ️  Webhook ignorado (tipo: ${type})`);
        }

    } catch (error) {
        console.error('❌ Error procesando webhook:', error);
    }
}

// Obtener detalles del pago desde MercadoPago
async function obtenerDetallePago(paymentId) {
    try {
        const response = await fetch(
            `https://api.mercadopago.com/v1/payments/${paymentId}`,
            {
                headers: {
                    'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (response.ok) {
            const pago = await response.json();
            console.log(`📊 Pago obtenido: $${pago.transaction_amount} (${pago.status})`);
            return pago;
        } else {
            console.error(`❌ Error obteniendo pago ${paymentId}:`, response.status);
            return null;
        }
    } catch (error) {
        console.error('❌ Error en API MercadoPago:', error);
        return null;
    }
}

// Enviar alerta WhatsApp instantánea
async function enviarAlertaWhatsAppInstantanea(pago, action) {
    try {
        const mensaje = generarMensajeWhatsApp(pago, action);
        const exito = await enviarTwilioWhatsApp(mensaje, MY_WHATSAPP_NUMBER);
        
        if (exito) {
            console.log('📱 WhatsApp enviado exitosamente');
        } else {
            console.error('❌ Error enviando WhatsApp');
        }
        
        return exito;
    } catch (error) {
        console.error('❌ Error en alerta WhatsApp:', error);
        return false;
    }
}

// Enviar mensaje vía Twilio
async function enviarTwilioWhatsApp(mensaje, numeroDestino) {
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
        console.warn('⚠️  Twilio no configurado');
        return false;
    }

    try {
        const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
        
        const formData = new URLSearchParams({
            'From': `whatsapp:${TWILIO_PHONE_NUMBER || '+14155238886'}`,
            'To': `whatsapp:${numeroDestino}`,
            'Body': mensaje
        });

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': 'Basic ' + Buffer.from(TWILIO_ACCOUNT_SID + ':' + TWILIO_AUTH_TOKEN).toString('base64'),
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: formData
        });

        if (response.ok) {
            const result = await response.json();
            console.log('✅ Twilio WhatsApp enviado:', result.sid);
            return true;
        } else {
            const error = await response.json();
            console.error('❌ Error Twilio:', error);
            return false;
        }
    } catch (error) {
        console.error('❌ Error en Twilio:', error);
        return false;
    }
}

// Generar mensaje WhatsApp según el pago
function generarMensajeWhatsApp(pago, action) {
    const fecha = new Date().toLocaleTimeString('es-ES', { hour12: false });
    const fechaCompleta = new Date().toLocaleDateString('es-ES');
    
    // Determinar emoji y mensaje según estado
    let emoji = '💰';
    let estado = 'RECIBIDO';
    
    switch (pago.status) {
        case 'approved':
            emoji = '✅';
            estado = 'APROBADO';
            break;
        case 'pending':
            emoji = '⏳';
            estado = 'PENDIENTE';
            break;
        case 'rejected':
            emoji = '❌';
            estado = 'RECHAZADO';
            break;
        case 'cancelled':
            emoji = '🚫';
            estado = 'CANCELADO';
            break;
    }

    // Obtener método de pago legible
    const metodoPago = obtenerMetodoPagoLegible(pago.payment_method_id);
    
    // Construir mensaje
    let mensaje = `🏪 *FERRETERÍA CONTROL*\n\n`;
    mensaje += `${emoji} *PAGO ${estado}*\n`;
    mensaje += `💰 Monto: $${pago.transaction_amount.toLocaleString('es-AR')}\n`;
    mensaje += `💳 Método: ${metodoPago}\n`;
    mensaje += `🕐 Hora: ${fecha}\n`;
    mensaje += `📅 Fecha: ${fechaCompleta}\n`;
    
    // Información del cliente (si está disponible)
    if (pago.payer?.first_name) {
        mensaje += `👤 Cliente: ${pago.payer.first_name}`;
        if (pago.payer.last_name) {
            mensaje += ` ${pago.payer.last_name.charAt(0)}.**`;
        }
        mensaje += '\n';
    }
    
    // ID de transacción
    mensaje += `🔢 ID: ${pago.id}\n`;
    
    // Información adicional según estado
    if (pago.status === 'approved') {
        mensaje += `\n💳 *¡Dinero disponible en tu cuenta!*`;
    } else if (pago.status === 'rejected') {
        mensaje += `\n⚠️ Motivo: ${pago.status_detail || 'No especificado'}`;
    }
    
    mensaje += `\n\n📊 Notificación instantánea vía Webhook`;
    
    return mensaje;
}

// Convertir método de pago a texto legible
function obtenerMetodoPagoLegible(methodId) {
    const metodos = {
        'credit_card': 'Tarjeta de Crédito',
        'debit_card': 'Tarjeta de Débito',
        'bank_transfer': 'Transferencia Bancaria',
        'cash': 'Efectivo',
        'ticket': 'Cupón de Pago',
        'atm': 'Cajero Automático',
        'digital_wallet': 'Billetera Digital',
        'digital_currency': 'Moneda Digital'
    };
    
    return metodos[methodId] || methodId || 'No especificado';
}

// Notificar a la aplicación frontend (opcional)
async function notificarFrontend(pago) {
    try {
        // Aquí podrías notificar a tu aplicación web
        // Por ejemplo, usando WebSockets, Server-Sent Events, etc.
        console.log(`🌐 Frontend notificado: ${pago.id}`);
        return true;
    } catch (error) {
        console.error('❌ Error notificando frontend:', error);
        return false;
    }
}

// Endpoint de prueba
app.post('/test/webhook', async (req, res) => {
    console.log('🧪 Test webhook ejecutado');
    
    const webhookPrueba = {
        action: 'payment.created',
        type: 'payment',
        data: { id: '12345678901' },
        date_created: new Date().toISOString()
    };
    
    // Simular pago de prueba
    const pagoPrueba = {
        id: 12345678901,
        transaction_amount: 45750,
        status: 'approved',
        status_detail: 'accredited',
        payment_method_id: 'credit_card',
        payer: {
            first_name: 'Juan',
            last_name: 'Pérez'
        }
    };
    
    await enviarAlertaWhatsAppInstantanea(pagoPrueba, 'payment.created');
    
    res.json({
        success: true,
        message: 'Webhook de prueba ejecutado',
        data: pagoPrueba
    });
});

// Manejo de errores globales
app.use((err, req, res, next) => {
    console.error('❌ Error no manejado:', err);
    res.status(500).json({
        error: 'Error interno del servidor',
        timestamp: new Date().toISOString()
    });
});

// 🧪 RUTA PARA ENVIAR REPORTE DE PRUEBA
app.get('/test/reporte', async (req, res) => {
    try {
        console.log('🧪 Enviando reporte de prueba...');
        await reporteSystem.enviarReportePrueba();
        res.json({
            success: true,
            message: 'Reporte de prueba enviado',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Error enviando reporte de prueba:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 📊 RUTA PARA GENERAR REPORTE MANUAL
app.get('/reporte/manual', async (req, res) => {
    try {
        console.log('📊 Generando reporte manual...');
        await reporteSystem.generarReporteDiario();
        res.json({
            success: true,
            message: 'Reporte manual generado y enviado',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Error generando reporte manual:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Ruta 404
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Ruta no encontrada',
        path: req.originalUrl,
        timestamp: new Date().toISOString()
    });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log('\n🚀 =================================');
    console.log('   SERVIDOR WEBHOOK INICIADO');
    console.log('=================================');
    console.log(`📡 Puerto: ${PORT}`);
    console.log(`🌐 Local: http://localhost:${PORT}`);
    console.log(`⚡ Webhook: http://localhost:${PORT}/webhook/mercadopago`);
    console.log(`🧪 Test: http://localhost:${PORT}/test/webhook`);
    console.log('=================================\n');
    
    // Verificar configuración
    const configOK = verificarConfiguracion();
    
    if (configOK) {
        console.log('✅ Servidor listo para recibir webhooks');
        console.log('📱 Configuración WhatsApp: OK');
        console.log('💳 Configuración MercadoPago: OK');
        console.log('📊 Sistema de reportes diarios: ACTIVO');
        console.log('⏰ Reporte automático: 23:00 hs');
        console.log('🧪 Test reporte: http://localhost:3000/test/reporte');
        console.log('📊 Reporte manual: http://localhost:3000/reporte/manual\n');
    } else {
        console.log('⚠️  Completa la configuración en .env para funcionalidad completa\n');
    }
    
    console.log('📋 Próximos pasos:');
    console.log('1. Instalar ngrok: https://ngrok.com/download');
    console.log('2. Ejecutar: ngrok http 3000');
    console.log('3. Configurar webhook URL en MercadoPago');
    console.log('4. ¡Listo para recibir notificaciones instantáneas!\n');
});

// Manejo graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 Cerrando servidor...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('\n🛑 Servidor detenido por usuario');
    process.exit(0);
});