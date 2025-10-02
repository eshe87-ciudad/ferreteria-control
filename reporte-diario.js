const cron = require('node-cron');
const fetch = require('node-fetch');

// 📊 SISTEMA DE REPORTES DIARIOS AUTOMATICOS
class ReporteDiario {
    constructor() {
        this.transaccionesDia = [];
        this.iniciarReporteAutomatico();
    }

    // 📝 Registrar transacción del día
    registrarTransaccion(webhook) {
        const transaccion = {
            id: webhook.data.id,
            timestamp: new Date().toISOString(),
            action: webhook.action,
            type: webhook.type,
            procesado: new Date().toLocaleString('es-AR')
        };
        
        this.transaccionesDia.push(transaccion);
        console.log('📝 Transacción registrada para reporte diario:', transaccion.id);
    }

    // 📊 Generar reporte completo del día
    async generarReporteDiario() {
        try {
            console.log('📊 Generando reporte diario...');
            
            const hoy = new Date().toLocaleDateString('es-AR');
            const totalTransacciones = this.transaccionesDia.length;
            
            // Obtener detalles de MercadoPago para cada transacción
            const detallesCompletos = await this.obtenerDetallesCompletos();
            
            const reporte = this.crearMensajeReporte(hoy, totalTransacciones, detallesCompletos);
            
            // Enviar por WhatsApp
            await this.enviarReporteWhatsApp(reporte);
            
            // Limpiar transacciones del día
            this.transaccionesDia = [];
            
            console.log('✅ Reporte diario enviado exitosamente');
            
        } catch (error) {
            console.error('❌ Error generando reporte diario:', error);
        }
    }

    // 🔍 Obtener detalles completos de MercadoPago
    async obtenerDetallesCompletos() {
        const detalles = [];
        
        for (const transaccion of this.transaccionesDia) {
            try {
                const response = await fetch(`https://api.mercadopago.com/v1/payments/${transaccion.id}`, {
                    headers: {
                        'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`
                    }
                });
                
                if (response.ok) {
                    const pago = await response.json();
                    detalles.push({
                        ...transaccion,
                        monto: pago.transaction_amount,
                        estado: pago.status,
                        cliente: pago.payer?.first_name || 'Cliente',
                        email: pago.payer?.email,
                        metodo: pago.payment_method_id,
                        descripcion: pago.description || 'Venta'
                    });
                }
            } catch (error) {
                console.error('Error obteniendo detalles:', error);
                detalles.push({
                    ...transaccion,
                    monto: 0,
                    estado: 'Error',
                    cliente: 'N/A'
                });
            }
        }
        
        return detalles;
    }

    // 📝 Crear mensaje de reporte detallado
    crearMensajeReporte(fecha, total, detalles) {
        const montoTotal = detalles.reduce((sum, det) => sum + (det.monto || 0), 0);
        const aprobados = detalles.filter(d => d.estado === 'approved').length;
        const pendientes = detalles.filter(d => d.estado === 'pending').length;
        const rechazados = detalles.filter(d => d.estado === 'rejected').length;

        let reporte = `📊 REPORTE DIARIO MERCADOPAGO
📅 Fecha: ${fecha}

💰 RESUMEN FINANCIERO:
• Total recaudado: $${montoTotal.toLocaleString('es-AR')} ARS
• Transacciones: ${total}
• Aprobadas: ${aprobados} ✅
• Pendientes: ${pendientes} ⏳
• Rechazadas: ${rechazados} ❌

📋 DETALLE DE TRANSACCIONES:`;

        detalles.forEach((det, index) => {
            const emoji = det.estado === 'approved' ? '✅' : 
                         det.estado === 'pending' ? '⏳' : 
                         det.estado === 'rejected' ? '❌' : '❓';
            
            reporte += `

${index + 1}. ${emoji} $${(det.monto || 0).toLocaleString('es-AR')}
   👤 ${det.cliente}
   📧 ${det.email || 'N/A'}
   🕐 ${det.procesado}
   🆔 ${det.id}
   💳 ${det.metodo || 'N/A'}`;
        });

        reporte += `

🎯 ESTADÍSTICAS:
• Ticket promedio: $${(montoTotal / (aprobados || 1)).toLocaleString('es-AR')}
• Tasa de aprobación: ${((aprobados / total) * 100).toFixed(1)}%

📱 Monitor: http://localhost:3000
⚡ Sistema activo las 24hs

---
🤖 Reporte automático generado el ${new Date().toLocaleString('es-AR')}`;

        return reporte;
    }

    // 📱 Enviar reporte por WhatsApp
    async enviarReporteWhatsApp(mensaje) {
        try {
            const auth = Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64');
            
            const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`, {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${auth}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    From: `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`,
                    To: `whatsapp:${process.env.MY_WHATSAPP_NUMBER}`,
                    Body: mensaje
                })
            });

            if (response.ok) {
                console.log('✅ Reporte diario enviado por WhatsApp');
            } else {
                console.error('❌ Error enviando reporte WhatsApp:', await response.text());
            }
        } catch (error) {
            console.error('❌ Error enviando WhatsApp:', error);
        }
    }

    // ⏰ Configurar envío automático de reportes
    iniciarReporteAutomatico() {
        // Enviar reporte todos los días a las 23:00
        cron.schedule('0 23 * * *', () => {
            console.log('⏰ Ejecutando reporte diario automático...');
            this.generarReporteDiario();
        }, {
            timezone: "America/Argentina/Buenos_Aires"
        });

        // También enviar reporte manual los domingos a las 20:00
        cron.schedule('0 20 * * 0', () => {
            console.log('📊 Enviando reporte semanal...');
            this.generarReporteSemanal();
        }, {
            timezone: "America/Argentina/Buenos_Aires"
        });

        console.log('⏰ Reportes automáticos configurados:');
        console.log('   📊 Diario: 23:00 hs');
        console.log('   📈 Semanal: Domingos 20:00 hs');
    }

    // 📈 Generar reporte semanal (opcional)
    async generarReporteSemanal() {
        // Implementar lógica de reporte semanal si es necesario
        console.log('📈 Generando reporte semanal...');
    }

    // 🧪 Método para probar reporte inmediato
    async enviarReportePrueba() {
        console.log('🧪 Enviando reporte de prueba...');
        
        const reportePrueba = `📊 REPORTE DE PRUEBA MERCADOPAGO
📅 Fecha: ${new Date().toLocaleDateString('es-AR')}

🧪 Este es un ejemplo del reporte diario que recibirás automáticamente cada día a las 23:00 hs.

💰 RESUMEN DEL DÍA:
• Total recaudado: $2,850.00 ARS
• Transacciones: 8
• Aprobadas: 7 ✅
• Pendientes: 1 ⏳
• Rechazadas: 0 ❌

📋 ÚLTIMAS TRANSACCIONES:
1. ✅ $450.00 - Juan Pérez - 16:30
2. ✅ $1,200.00 - María García - 15:45
3. ✅ $300.00 - Carlos López - 14:20
4. ⏳ $900.00 - Ana Rodríguez - 13:15

🎯 ESTADÍSTICAS:
• Ticket promedio: $407.14
• Tasa de aprobación: 87.5%

📱 Tu sistema está funcionando perfectamente
⚡ Notificaciones instantáneas activas 24hs

---
🤖 Reporte automático - ${new Date().toLocaleString('es-AR')}`;

        await this.enviarReporteWhatsApp(reportePrueba);
    }
}

module.exports = ReporteDiario;