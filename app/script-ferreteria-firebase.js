// script-ferreteria-firebase.js - Control de Ferretería con Firebase Real-time - 4 Categorías

import { 
    initializeApp 
} from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js';

import { 
    getFirestore, 
    collection, 
    addDoc, 
    deleteDoc, 
    doc, 
    updateDoc, 
    onSnapshot, 
    query, 
    orderBy,
    serverTimestamp,
    writeBatch 
} from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';

import { 
    getAuth, 
    signInAnonymously, 
    onAuthStateChanged 
} from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js';

class ControlFerreteriaFirebase {
    constructor() {
        this.auth = null;
        this.db = null;
        this.user = null;
        
        // Listeners para cada colección
        this.unsubscribeIngresosMP = null;
        this.unsubscribeVentasMostrador = null;
        this.unsubscribePagosProveedores = null;
        this.unsubscribePagosEfectivo = null;
        
        this.syncIndicator = document.getElementById('sync-indicator');
        this.connectionStatus = document.getElementById('connection-status');
        this.lastSync = document.getElementById('last-sync');
        
        // Datos locales como backup para cada categoría
        this.ingresosMP = JSON.parse(localStorage.getItem('ingresosMP')) || [];
        this.ventasMostrador = JSON.parse(localStorage.getItem('ventasMostrador')) || [];
        this.pagosProveedores = JSON.parse(localStorage.getItem('pagosProveedores')) || [];
        this.pagosEfectivo = JSON.parse(localStorage.getItem('pagosEfectivo')) || [];
        this.proveedoresRecurrentes = JSON.parse(localStorage.getItem('proveedoresRecurrentes')) || [];
        
        // Configuración WhatsApp
        this.whatsappConfig = JSON.parse(localStorage.getItem('whatsappConfig')) || {
            enabled: false,
            twilioSid: '',
            twilioToken: '',
            whatsappNumber: '',
            alerts: {
                mp: true,
                mostrador: true,
                proveedores: false,
                efectivo: false
            }
        };
        
        this.initializeFirebase();
        this.setupEventListeners();
        this.startLocalBackup();
    }

    async initializeFirebase() {
        try {
            console.log('Inicializando Firebase...');
            // Firebase ya está inicializado en el HTML
            this.auth = getAuth();
            this.db = getFirestore();
            
            console.log('Auth y DB obtenidos:', this.auth, this.db);
            
            // Configurar observador de autenticación
            onAuthStateChanged(this.auth, (user) => {
                if (user) {
                    console.log('Usuario autenticado:', user.uid);
                    this.user = user;
                    this.updateSyncStatus('Conectado', 'success');
                    this.setupRealtimeListeners();
                } else {
                    console.log('No hay usuario, intentando autenticación anónima...');
                    this.signInAnonymously();
                }
            });
            
        } catch (error) {
            console.error('Error inicializando Firebase:', error);
            this.updateSyncStatus('Error de conexión', 'error');
            this.loadFromLocalStorage();
        }
    }

    async signInAnonymously() {
        try {
            console.log('Intentando autenticación anónima...');
            this.updateSyncStatus('Conectando...', 'warning');
            const result = await signInAnonymously(this.auth);
            console.log('Autenticación exitosa:', result.user.uid);
        } catch (error) {
            console.error('Error en autenticación:', error);
            this.updateSyncStatus('Sin conexión', 'error');
            this.loadFromLocalStorage();
        }
    }

    setupRealtimeListeners() {
        if (!this.db || !this.user) return;

        try {
            // Listener para ingresos Mercado Pago
            const ingresosQuery = query(
                collection(this.db, 'ingresosMP'),
                orderBy('timestamp', 'desc')
            );
            
            this.unsubscribeIngresosMP = onSnapshot(ingresosQuery, (snapshot) => {
                this.ingresosMP = [];
                snapshot.forEach((doc) => {
                    this.ingresosMP.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });
                this.mostrarIngresosMP();
                this.updateDashboard();
                this.updateLastSync();
                this.saveToLocalStorage();
            }, (error) => {
                console.error('Error en listener ingresos MP:', error);
                this.updateSyncStatus('Error sincronización', 'error');
            });

            // Listener para ventas mostrador
            const ventasQuery = query(
                collection(this.db, 'ventasMostrador'),
                orderBy('timestamp', 'desc')
            );
            
            this.unsubscribeVentasMostrador = onSnapshot(ventasQuery, (snapshot) => {
                this.ventasMostrador = [];
                snapshot.forEach((doc) => {
                    this.ventasMostrador.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });
                this.mostrarVentasMostrador();
                this.updateDashboard();
                this.updateLastSync();
                this.saveToLocalStorage();
            });

            // Listener para pagos proveedores
            const pagosProveedoresQuery = query(
                collection(this.db, 'pagosProveedores'),
                orderBy('timestamp', 'desc')
            );
            
            this.unsubscribePagosProveedores = onSnapshot(pagosProveedoresQuery, (snapshot) => {
                this.pagosProveedores = [];
                snapshot.forEach((doc) => {
                    this.pagosProveedores.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });
                this.mostrarPagosProveedores();
                this.updateDashboard();
                this.updateLastSync();
                this.saveToLocalStorage();
            });

            // Listener para pagos efectivo
            const pagosEfectivoQuery = query(
                collection(this.db, 'pagosEfectivo'),
                orderBy('timestamp', 'desc')
            );
            
            this.unsubscribePagosEfectivo = onSnapshot(pagosEfectivoQuery, (snapshot) => {
                this.pagosEfectivo = [];
                snapshot.forEach((doc) => {
                    this.pagosEfectivo.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });
                this.mostrarPagosEfectivo();
                this.updateDashboard();
                this.updateLastSync();
                this.saveToLocalStorage();
            });

        } catch (error) {
            console.error('Error configurando listeners:', error);
            this.updateSyncStatus('Error de configuración', 'error');
        }
    }

    // Agregar Ingreso Mercado Pago
    async agregarIngresoMP() {
        console.log('💳 Agregando ingreso MP...');
        
        const descripcion = document.getElementById('mp-descripcion')?.value.trim();
        const monto = parseFloat(document.getElementById('mp-monto')?.value);
        const comision = parseFloat(document.getElementById('mp-comision')?.value) || 0;

        console.log('Datos obtenidos:', { descripcion, monto, comision });

        if (!descripcion || !monto || monto <= 0) {
            alert('Por favor, completa descripción y monto correctamente');
            return;
        }

        const ingreso = {
            descripcion,
            monto,
            comision,
            montoNeto: monto - comision,
            fecha: new Date().toLocaleDateString(),
            hora: new Date().toLocaleTimeString('es-ES', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: false 
            }),
            fechaHora: new Date().toLocaleString('es-ES', {
                day: '2-digit',
                month: '2-digit', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            }),
            timestamp: serverTimestamp(),
            tipo: 'ingreso-mp'
        };

        try {
            await addDoc(collection(this.db, 'ingresosMP'), ingreso);
            
            // Enviar alerta WhatsApp
            await this.enviarAlertaWhatsApp('ingreso-mp', {
                montoNeto: ingreso.montoNeto,
                descripcion: ingreso.descripcion
            });
            
            // Limpiar formulario
            document.getElementById('mp-descripcion').value = '';
            document.getElementById('mp-monto').value = '';
            document.getElementById('mp-comision').value = '';
            
            console.log('✅ Ingreso MP agregado correctamente');
            this.updateSyncStatus('Sincronizado', 'success');
            
        } catch (error) {
            console.error('Error agregando ingreso MP:', error);
            this.updateSyncStatus('Error al guardar', 'error');
            this.agregarLocalFallback('ingresosMP', ingreso);
        }
    }

    // Agregar Venta Mostrador
    async agregarVentaMostrador() {
        const descripcion = document.getElementById('mostrador-descripcion').value.trim();
        const monto = parseFloat(document.getElementById('mostrador-monto').value);
        const metodoPago = document.getElementById('mostrador-metodo').value;

        if (!descripcion || !monto || monto <= 0) {
            alert('Por favor, completa descripción y monto correctamente');
            return;
        }

        const venta = {
            descripcion,
            monto,
            metodoPago,
            fecha: new Date().toLocaleDateString(),
            hora: new Date().toLocaleTimeString('es-ES', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: false 
            }),
            fechaHora: new Date().toLocaleString('es-ES', {
                day: '2-digit',
                month: '2-digit', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            }),
            timestamp: serverTimestamp(),
            tipo: 'venta-mostrador'
        };

        try {
            await addDoc(collection(this.db, 'ventasMostrador'), venta);
            
            // Enviar alerta WhatsApp
            await this.enviarAlertaWhatsApp('venta-mostrador', {
                monto: venta.monto,
                metodoPago: venta.metodoPago,
                descripcion: venta.descripcion
            });
            
            // Limpiar formulario
            document.getElementById('mostrador-descripcion').value = '';
            document.getElementById('mostrador-monto').value = '';
            document.getElementById('mostrador-metodo').value = 'efectivo';
            
            this.updateSyncStatus('Sincronizado', 'success');
            
        } catch (error) {
            console.error('Error agregando venta mostrador:', error);
            this.updateSyncStatus('Error al guardar', 'error');
            this.agregarLocalFallback('ventasMostrador', venta);
        }
    }

    // Agregar Pago Proveedor
    async agregarPagoProveedor() {
        const proveedor = document.getElementById('proveedor-nombre').value.trim();
        const monto = parseFloat(document.getElementById('proveedor-monto').value);
        const metodoPago = document.getElementById('proveedor-metodo').value;

        if (!proveedor || !monto || monto <= 0) {
            alert('Por favor, completa todos los campos obligatorios');
            return;
        }

        const pago = {
            proveedor,
            monto,
            metodoPago,
            fecha: new Date().toLocaleDateString(),
            hora: new Date().toLocaleTimeString('es-ES', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: false 
            }),
            fechaHora: new Date().toLocaleString('es-ES', {
                day: '2-digit',
                month: '2-digit', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            }),
            timestamp: serverTimestamp(),
            tipo: 'pago-proveedor'
        };

        try {
            await addDoc(collection(this.db, 'pagosProveedores'), pago);
            
            // Enviar alerta WhatsApp
            await this.enviarAlertaWhatsApp('pago-proveedor', {
                proveedor: pago.proveedor,
                monto: pago.monto,
                metodoPago: pago.metodoPago
            });
            
            // Agregar proveedor a lista recurrente
            this.agregarProveedorRecurrente(proveedor);
            
            // Limpiar formulario
            document.getElementById('proveedor-nombre').value = '';
            document.getElementById('proveedor-monto').value = '';
            document.getElementById('proveedor-metodo').value = 'transferencia';
            
            this.updateSyncStatus('Sincronizado', 'success');
            
        } catch (error) {
            console.error('Error agregando pago proveedor:', error);
            this.updateSyncStatus('Error al guardar', 'error');
            this.agregarLocalFallback('pagosProveedores', pago);
        }
    }

    // Agregar Pago Efectivo
    async agregarPagoEfectivo() {
        console.log('💵 Agregando pago efectivo...');
        
        const descripcion = document.getElementById('efectivo-descripcion')?.value.trim();
        const monto = parseFloat(document.getElementById('efectivo-monto')?.value);

        console.log('Datos obtenidos:', { descripcion, monto });

        if (!descripcion || !monto || monto <= 0) {
            alert('Por favor, completa todos los campos obligatorios');
            return;
        }

        const pago = {
            descripcion,
            monto,
            fecha: new Date().toLocaleDateString(),
            hora: new Date().toLocaleTimeString('es-ES', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: false 
            }),
            fechaHora: new Date().toLocaleString('es-ES', {
                day: '2-digit',
                month: '2-digit', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            }),
            timestamp: serverTimestamp(),
            tipo: 'pago-efectivo'
        };

        try {
            await addDoc(collection(this.db, 'pagosEfectivo'), pago);
            
            // Enviar alerta WhatsApp
            await this.enviarAlertaWhatsApp('pago-efectivo', {
                monto: pago.monto,
                descripcion: pago.descripcion
            });
            
            // Limpiar formulario
            document.getElementById('efectivo-descripcion').value = '';
            document.getElementById('efectivo-monto').value = '';
            
            console.log('✅ Pago efectivo agregado correctamente');
            this.updateSyncStatus('Sincronizado', 'success');
            
        } catch (error) {
            console.error('Error agregando pago efectivo:', error);
            this.updateSyncStatus('Error al guardar', 'error');
            this.agregarLocalFallback('pagosEfectivo', pago);
        }
    }

    // Funciones para eliminar registros
    async eliminarRegistro(id, coleccion) {
        if (!confirm('¿Estás seguro de eliminar este registro?')) return;

        try {
            await deleteDoc(doc(this.db, coleccion, id));
            this.updateSyncStatus('Sincronizado', 'success');
            
        } catch (error) {
            console.error(`Error eliminando registro de ${coleccion}:`, error);
            this.updateSyncStatus('Error al eliminar', 'error');
        }
    }

    // Actualizar tablas de datos
    mostrarIngresosMP(limite = 5) {
        const tbody = document.getElementById('tabla-ingresos-mp');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        const ingresos = this.ingresosMP.slice(0, limite);

        ingresos.forEach(ingreso => {
            const row = tbody.insertRow();
            row.innerHTML = `
                <td data-label="Fecha">${ingreso.fecha || 'Sin fecha'}</td>
                <td data-label="Hora">${ingreso.hora || '--:--'}</td>
                <td data-label="Descripción">${ingreso.descripcion}</td>
                <td data-label="Categoría">${ingreso.categoria || 'Sin categoría'}</td>
                <td data-label="Cliente">${ingreso.cliente || 'Cliente general'}</td>
                <td data-label="Monto">$${ingreso.monto.toFixed(2)}</td>
                <td data-label="Comisión">$${(ingreso.comision || 0).toFixed(2)}</td>
                <td data-label="Neto">$${(ingreso.montoNeto || ingreso.monto).toFixed(2)}</td>
                <td data-label="Acciones">
                    <button onclick="control.eliminarRegistro('${ingreso.id}', 'ingresosMP')" class="btn-eliminar">
                        🗑️ Eliminar
                    </button>
                </td>
            `;
        });
    }

    mostrarVentasMostrador(limite = 5) {
        const tbody = document.getElementById('lista-ventas-mostrador');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        const ventas = this.ventasMostrador.slice(0, limite);

        if (ventas.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="sin-datos">No hay ventas registradas</td></tr>';
            return;
        }

        ventas.forEach(venta => {
            // Determinar el badge de método
            const metodoBadge = venta.metodoPago === 'efectivo' 
                ? '<span class="metodo-badge metodo-efectivo">💵 Efectivo</span>'
                : '<span class="metodo-badge metodo-transferencia">💳 Transferencia</span>';
            
            const row = tbody.insertRow();
            row.innerHTML = `
                <td data-label="Fecha">${venta.fecha || 'Sin fecha'}</td>
                <td data-label="Hora">${venta.hora || '--:--'}</td>
                <td data-label="Descripción">${venta.descripcion}</td>
                <td data-label="Monto">$${venta.monto.toFixed(2)}</td>
                <td data-label="Método">${metodoBadge}</td>
                <td data-label="Acciones">
                    <button onclick="control.eliminarRegistro('${venta.id}', 'ventasMostrador')" class="btn-eliminar">
                        🗑️
                    </button>
                </td>
            `;
        });
    }

    mostrarPagosProveedores(limite = 5) {
        const tbody = document.getElementById('lista-pagos-proveedores');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        const pagos = this.pagosProveedores.slice(0, limite);

        if (pagos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="sin-datos">No hay pagos registrados</td></tr>';
            return;
        }

        pagos.forEach(pago => {
            // Determinar el badge de método
            const metodoBadge = pago.metodoPago === 'efectivo' 
                ? '<span class="metodo-badge metodo-efectivo">💵 Efectivo</span>'
                : '<span class="metodo-badge metodo-transferencia">💳 Transferencia</span>';
            
            const row = tbody.insertRow();
            row.innerHTML = `
                <td data-label="Fecha">${pago.fecha || 'Sin fecha'}</td>
                <td data-label="Hora">${pago.hora || '--:--'}</td>
                <td data-label="Proveedor">${pago.proveedor}</td>
                <td data-label="Monto">$${pago.monto.toFixed(2)}</td>
                <td data-label="Método">${metodoBadge}</td>
                <td data-label="Acciones">
                    <button onclick="control.eliminarRegistro('${pago.id}', 'pagosProveedores')" class="btn-eliminar">
                        🗑️
                    </button>
                </td>
            `;
        });
    }

    mostrarPagosEfectivo(limite = 5) {
        const tbody = document.getElementById('tabla-pagos-efectivo');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        const pagos = this.pagosEfectivo.slice(0, limite);

        pagos.forEach(pago => {
            const row = tbody.insertRow();
            row.innerHTML = `
                <td data-label="Fecha">${pago.fecha || 'Sin fecha'}</td>
                <td data-label="Hora">${pago.hora || '--:--'}</td>
                <td data-label="Proveedor">${pago.proveedor}</td>
                <td data-label="Descripción">${pago.descripcion}</td>
                <td data-label="Recibo">${pago.numeroRecibo || 'Sin recibo'}</td>
                <td data-label="Monto">$${pago.monto.toFixed(2)}</td>
                <td data-label="Acciones">
                    <button onclick="control.eliminarRegistro('${pago.id}', 'pagosEfectivo')" class="btn-eliminar">
                        🗑️ Eliminar
                    </button>
                </td>
            `;
        });
    }

    // Actualizar dashboard
    updateDashboard() {
        console.log('📊 Actualizando dashboard...');
        
        // Calcular totales por método de pago
        const ingresosMP = this.ingresosMP.reduce((sum, item) => sum + (item.montoNeto || item.monto), 0);
        
        // Ventas mostrador separadas por método
        const ventasEfectivo = this.ventasMostrador
            .filter(v => v.metodoPago === 'efectivo')
            .reduce((sum, item) => sum + item.monto, 0);
        const ventasTransferencia = this.ventasMostrador
            .filter(v => v.metodoPago === 'transferencia')
            .reduce((sum, item) => sum + item.monto, 0);
        const totalVentasMostrador = ventasEfectivo + ventasTransferencia;
        
        // Pagos proveedores separados por método
        const pagosProveedoresEfectivo = this.pagosProveedores
            .filter(p => p.metodoPago === 'efectivo')
            .reduce((sum, item) => sum + item.monto, 0);
        const pagosProveedoresTransferencia = this.pagosProveedores
            .filter(p => p.metodoPago === 'transferencia')
            .reduce((sum, item) => sum + item.monto, 0);
        const totalPagosProveedores = pagosProveedoresEfectivo + pagosProveedoresTransferencia;
        
        // Pagos efectivo (siempre en efectivo)
        const totalPagosEfectivo = this.pagosEfectivo.reduce((sum, item) => sum + item.monto, 0);
        
        // Balances totales por método
        const balanceEfectivoTotal = (ventasEfectivo) - (pagosProveedoresEfectivo + totalPagosEfectivo);
        const balanceTransferenciasTotal = (ingresosMP + ventasTransferencia) - (pagosProveedoresTransferencia);

        // Función para actualizar elementos de forma segura
        const updateElement = (id, value) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            } else {
                console.warn(`Elemento no encontrado: ${id}`);
            }
        };

        // Actualizar dashboard con IDs correctos
        updateElement('balance-neto-mp', `$${ingresosMP.toFixed(2)}`);
        
        updateElement('balance-neto-mostrador', `$${totalVentasMostrador.toFixed(2)}`);
        updateElement('detalle-mostrador', `💵 Efectivo: $${ventasEfectivo.toFixed(2)} | 💳 Transferencia: $${ventasTransferencia.toFixed(2)}`);
        
        updateElement('total-pagos-proveedores', `$${totalPagosProveedores.toFixed(2)}`);
        updateElement('detalle-pagos-proveedores', `💵 Efectivo: $${pagosProveedoresEfectivo.toFixed(2)} | 💳 Transferencia: $${pagosProveedoresTransferencia.toFixed(2)}`);
        
        updateElement('total-pagos-efectivo', `$${totalPagosEfectivo.toFixed(2)}`);
        
        updateElement('balance-efectivo-total', `$${balanceEfectivoTotal.toFixed(2)}`);
        
        updateElement('balance-transferencias-total', `$${balanceTransferenciasTotal.toFixed(2)}`);
        
        console.log('✅ Dashboard actualizado correctamente');
    }

    // Funciones auxiliares
    agregarProveedorRecurrente(proveedor) {
        if (!this.proveedoresRecurrentes.includes(proveedor)) {
            this.proveedoresRecurrentes.push(proveedor);
            this.llenarProveedoresRecurrentes();
            this.saveToLocalStorage();
        }
    }

    llenarProveedoresRecurrentes() {
        const datalist = document.getElementById('proveedores-lista');
        if (!datalist) return;
        
        datalist.innerHTML = '';
        this.proveedoresRecurrentes.forEach(proveedor => {
            const option = document.createElement('option');
            option.value = proveedor;
            datalist.appendChild(option);
        });
    }

    agregarLocalFallback(tipo, data) {
        data.timestamp = new Date().toISOString();
        data.id = Date.now().toString();
        this[tipo].unshift(data);
        this.updateDashboard();
        this.saveToLocalStorage();
        
        // Actualizar tabla correspondiente
        switch(tipo) {
            case 'ingresosMP': this.mostrarIngresosMP(); break;
            case 'ventasMostrador': this.mostrarVentasMostrador(); break;
            case 'pagosProveedores': this.mostrarPagosProveedores(); break;
            case 'pagosEfectivo': this.mostrarPagosEfectivo(); break;
        }
    }

    updateSyncStatus(message, type) {
        if (!this.syncIndicator) return;
        
        // Mapear iconos según el estado
        const iconMap = {
            'success': '🟢',
            'warning': '🟡', 
            'error': '🔴'
        };
        
        const icon = iconMap[type] || '�';
        this.syncIndicator.textContent = `${icon} ${message}`;
        this.syncIndicator.className = `sync-indicator ${type}`;
    }

    updateLastSync() {
        if (!this.lastSync) return;
        
        const now = new Date();
        const timeString = now.toLocaleTimeString();
        this.lastSync.textContent = timeString;
    }

    // Backup y storage local
    saveToLocalStorage() {
        try {
            localStorage.setItem('ingresosMP', JSON.stringify(this.ingresosMP));
            localStorage.setItem('ventasMostrador', JSON.stringify(this.ventasMostrador));
            localStorage.setItem('pagosProveedores', JSON.stringify(this.pagosProveedores));
            localStorage.setItem('pagosEfectivo', JSON.stringify(this.pagosEfectivo));
            localStorage.setItem('proveedoresRecurrentes', JSON.stringify(this.proveedoresRecurrentes));
            localStorage.setItem('lastBackup', new Date().toISOString());
        } catch (error) {
            console.error('Error guardando en localStorage:', error);
        }
    }

    loadFromLocalStorage() {
        try {
            this.ingresosMP = JSON.parse(localStorage.getItem('ingresosMP')) || [];
            this.ventasMostrador = JSON.parse(localStorage.getItem('ventasMostrador')) || [];
            this.pagosProveedores = JSON.parse(localStorage.getItem('pagosProveedores')) || [];
            this.pagosEfectivo = JSON.parse(localStorage.getItem('pagosEfectivo')) || [];
            this.proveedoresRecurrentes = JSON.parse(localStorage.getItem('proveedoresRecurrentes')) || [];
            
            this.mostrarIngresosMP();
            this.mostrarVentasMostrador();
            this.mostrarPagosProveedores();
            this.mostrarPagosEfectivo();
            this.updateDashboard();
            this.llenarProveedoresRecurrentes();
            this.updateSyncStatus('Datos locales', 'warning');
        } catch (error) {
            console.error('Error cargando desde localStorage:', error);
        }
    }

    startLocalBackup() {
        // Backup automático cada 5 minutos
        setInterval(() => {
            this.saveToLocalStorage();
        }, 5 * 60 * 1000);
    }

    // Exportar datos
    exportarDatos() {
        const datos = {
            ingresosMP: this.ingresosMP,
            ventasMostrador: this.ventasMostrador,
            pagosProveedores: this.pagosProveedores,
            pagosEfectivo: this.pagosEfectivo,
            proveedoresRecurrentes: this.proveedoresRecurrentes,
            fechaExportacion: new Date().toISOString(),
            version: '3.0-firebase-4categorias'
        };

        const dataStr = JSON.stringify(datos, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

        const exportFileDefaultName = `ferreteria-control-completo-${new Date().toISOString().split('T')[0]}.json`;

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    }

    setupEventListeners() {
        console.log('🔗 Configurando event listeners...');
        
        // Event listeners para formularios usando submit
        const formIngresoMP = document.getElementById('form-ingreso-mp');
        console.log('form-ingreso-mp encontrado:', !!formIngresoMP);
        formIngresoMP?.addEventListener('submit', (e) => {
            console.log('📝 Submit form-ingreso-mp');
            e.preventDefault();
            this.agregarIngresoMP();
        });
        
        const formVentaMostrador = document.getElementById('form-venta-mostrador');
        console.log('form-venta-mostrador encontrado:', !!formVentaMostrador);
        formVentaMostrador?.addEventListener('submit', (e) => {
            console.log('📝 Submit form-venta-mostrador');
            e.preventDefault();
            this.agregarVentaMostrador();
        });
        
        const formPagoProveedor = document.getElementById('form-pago-proveedor');
        console.log('form-pago-proveedor encontrado:', !!formPagoProveedor);
        formPagoProveedor?.addEventListener('submit', (e) => {
            console.log('📝 Submit form-pago-proveedor');
            e.preventDefault();
            this.agregarPagoProveedor();
        });
        
        const formPagoEfectivo = document.getElementById('form-pago-efectivo');
        console.log('form-pago-efectivo encontrado:', !!formPagoEfectivo);
        formPagoEfectivo?.addEventListener('submit', (e) => {
            console.log('📝 Submit form-pago-efectivo');
            e.preventDefault();
            this.agregarPagoEfectivo();
        });
        
        // Botones de gestión
        document.getElementById('btn-exportar')?.addEventListener('click', () => this.exportarDatos());

        // Detectar conexión/desconexión
        window.addEventListener('online', () => {
            this.updateSyncStatus('Reconectando...', 'warning');
            if (!this.user) this.signInAnonymously();
        });

        window.addEventListener('offline', () => {
            this.updateSyncStatus('Sin conexión', 'error');
        });
        
        // Event listeners para WhatsApp
        document.getElementById('btn-probar-whatsapp')?.addEventListener('click', () => {
            this.probarWhatsApp();
        });
        
        // Event listeners para configuración WhatsApp
        ['twilio-sid', 'twilio-token', 'whatsapp-numero'].forEach(id => {
            document.getElementById(id)?.addEventListener('input', () => {
                this.guardarConfiguracionWhatsApp();
            });
        });
        
        ['alert-mp', 'alert-mostrador', 'alert-proveedores', 'alert-efectivo'].forEach(id => {
            document.getElementById(id)?.addEventListener('change', () => {
                this.guardarConfiguracionWhatsApp();
            });
        });
        
        // Cargar configuración WhatsApp
        this.cargarConfiguracionWhatsApp();
    }

    // ===== FUNCIONES WHATSAPP =====
    
    cargarConfiguracionWhatsApp() {
        const config = this.whatsappConfig;
        
        document.getElementById('twilio-sid').value = config.twilioSid || '';
        document.getElementById('twilio-token').value = config.twilioToken || '';
        document.getElementById('whatsapp-numero').value = config.whatsappNumber || '';
        
        document.getElementById('alert-mp').checked = config.alerts.mp;
        document.getElementById('alert-mostrador').checked = config.alerts.mostrador;
        document.getElementById('alert-proveedores').checked = config.alerts.proveedores;
        document.getElementById('alert-efectivo').checked = config.alerts.efectivo;
        
        this.actualizarEstadoWhatsApp();
    }

    guardarConfiguracionWhatsApp() {
        this.whatsappConfig = {
            enabled: !!(document.getElementById('twilio-sid').value && 
                       document.getElementById('twilio-token').value && 
                       document.getElementById('whatsapp-numero').value),
            twilioSid: document.getElementById('twilio-sid').value.trim(),
            twilioToken: document.getElementById('twilio-token').value.trim(),
            whatsappNumber: document.getElementById('whatsapp-numero').value.trim(),
            alerts: {
                mp: document.getElementById('alert-mp').checked,
                mostrador: document.getElementById('alert-mostrador').checked,
                proveedores: document.getElementById('alert-proveedores').checked,
                efectivo: document.getElementById('alert-efectivo').checked
            }
        };
        
        localStorage.setItem('whatsappConfig', JSON.stringify(this.whatsappConfig));
        this.actualizarEstadoWhatsApp();
    }

    actualizarEstadoWhatsApp() {
        const indicator = document.getElementById('whatsapp-status-indicator');
        const lastSent = document.getElementById('whatsapp-last-sent');
        
        if (this.whatsappConfig.enabled) {
            indicator.textContent = '🟢 Configurado';
            indicator.style.color = '#25d366';
        } else {
            indicator.textContent = '⚪ No configurado';
            indicator.style.color = '#ccc';
        }
        
        const ultimoEnvio = localStorage.getItem('whatsapp-last-sent');
        lastSent.textContent = ultimoEnvio ? `Último envío: ${ultimoEnvio}` : 'Último envío: --';
    }

    async probarWhatsApp() {
        this.guardarConfiguracionWhatsApp();
        
        if (!this.whatsappConfig.enabled) {
            alert('❌ Completa todos los campos de configuración');
            return;
        }

        const mensaje = `🧪 *PRUEBA FERRETERÍA CONTROL*

¡Hola! Este es un mensaje de prueba.

Si recibes esto, tu integración con WhatsApp está funcionando perfectamente!

✅ Configuración exitosa
📱 ${this.whatsappConfig.whatsappNumber}
⏰ ${new Date().toLocaleTimeString('es-ES')}

🎉 ¡Listo para recibir alertas automáticas!`;

        try {
            const exito = await this.enviarTwilioWhatsApp(mensaje);
            if (exito) {
                alert('🎉 ¡Mensaje de prueba enviado! Revisa tu WhatsApp');
                localStorage.setItem('whatsapp-last-sent', new Date().toLocaleString('es-ES'));
                this.actualizarEstadoWhatsApp();
            } else {
                alert('❌ Error enviando mensaje de prueba');
            }
        } catch (error) {
            console.error('Error en prueba WhatsApp:', error);
            alert('❌ Error: ' + error.message);
        }
    }

    async enviarAlertaWhatsApp(tipo, datos) {
        if (!this.whatsappConfig.enabled) return false;

        let mensaje = '';
        const fecha = new Date().toLocaleString('es-ES');
        
        switch (tipo) {
            case 'ingreso-mp':
                if (!this.whatsappConfig.alerts.mp) return false;
                mensaje = `💳 *INGRESO MERCADO PAGO*

💰 Monto: $${datos.montoNeto.toFixed(2)}
📝 Descripción: ${datos.descripcion}
⏰ ${fecha}

🎉 ¡Nuevo ingreso registrado!`;
                break;
                
            case 'venta-mostrador':
                if (!this.whatsappConfig.alerts.mostrador) return false;
                const metodoIcon = datos.metodoPago === 'efectivo' ? '💵' : '💳';
                mensaje = `🏪 *VENTA MOSTRADOR*

${metodoIcon} Monto: $${datos.monto.toFixed(2)}
💳 Método: ${datos.metodoPago}
📝 Descripción: ${datos.descripcion}
⏰ ${fecha}

✅ Nueva venta registrada!`;
                break;
                
            case 'pago-proveedor':
                if (!this.whatsappConfig.alerts.proveedores) return false;
                const metodoIconProv = datos.metodoPago === 'efectivo' ? '💵' : '💳';
                mensaje = `💸 *PAGO PROVEEDOR*

🏢 Proveedor: ${datos.proveedor}
${metodoIconProv} Monto: $${datos.monto.toFixed(2)}
💳 Método: ${datos.metodoPago}
⏰ ${fecha}

📤 Pago registrado`;
                break;
                
            case 'pago-efectivo':
                if (!this.whatsappConfig.alerts.efectivo) return false;
                mensaje = `💵 *PAGO EFECTIVO*

💰 Monto: $${datos.monto.toFixed(2)}
📝 Descripción: ${datos.descripcion}
⏰ ${fecha}

💸 Gasto en efectivo registrado`;
                break;
        }

        if (mensaje) {
            try {
                const exito = await this.enviarTwilioWhatsApp(mensaje);
                if (exito) {
                    localStorage.setItem('whatsapp-last-sent', fecha);
                    this.actualizarEstadoWhatsApp();
                }
                return exito;
            } catch (error) {
                console.error('Error enviando alerta WhatsApp:', error);
                return false;
            }
        }
        
        return false;
    }

    async enviarTwilioWhatsApp(mensaje) {
        const config = this.whatsappConfig;
        
        if (!config.twilioSid || !config.twilioToken || !config.whatsappNumber) {
            throw new Error('Configuración incompleta');
        }

        const url = `https://api.twilio.com/2010-04-01/Accounts/${config.twilioSid}/Messages.json`;
        
        const formData = new URLSearchParams({
            'From': 'whatsapp:+14155238886', // Twilio Sandbox
            'To': `whatsapp:${config.whatsappNumber}`,
            'Body': mensaje
        });

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': 'Basic ' + btoa(config.twilioSid + ':' + config.twilioToken),
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: formData
            });

            if (response.ok) {
                const result = await response.json();
                console.log('✅ WhatsApp enviado:', result.sid);
                return true;
            } else {
                const error = await response.text();
                console.error('❌ Error Twilio:', error);
                return false;
            }
        } catch (error) {
            console.error('❌ Error de red:', error);
            throw error;
        }
    }

    // Cleanup al cerrar
    destroy() {
        if (this.unsubscribeIngresosMP) this.unsubscribeIngresosMP();
        if (this.unsubscribeVentasMostrador) this.unsubscribeVentasMostrador();
        if (this.unsubscribePagosProveedores) this.unsubscribePagosProveedores();
        if (this.unsubscribePagosEfectivo) this.unsubscribePagosEfectivo();
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    console.log('🔥 Inicializando ControlFerreteriaFirebase...');
    try {
        window.control = new ControlFerreteriaFirebase();
        console.log('✅ Control inicializado correctamente:', window.control);
    } catch (error) {
        console.error('❌ Error inicializando control:', error);
    }
});

// Cleanup al cerrar la página
window.addEventListener('beforeunload', () => {
    if (window.control) {
        window.control.destroy();
    }
});