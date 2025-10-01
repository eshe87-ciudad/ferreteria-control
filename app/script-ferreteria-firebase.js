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
        
        this.syncStatus = document.getElementById('sync-status');
        this.connectionStatus = document.getElementById('connection-status');
        this.lastSync = document.getElementById('last-sync');
        
        // Datos locales como backup para cada categoría
        this.ingresosMP = JSON.parse(localStorage.getItem('ingresosMP')) || [];
        this.ventasMostrador = JSON.parse(localStorage.getItem('ventasMostrador')) || [];
        this.pagosProveedores = JSON.parse(localStorage.getItem('pagosProveedores')) || [];
        this.pagosEfectivo = JSON.parse(localStorage.getItem('pagosEfectivo')) || [];
        this.proveedoresRecurrentes = JSON.parse(localStorage.getItem('proveedoresRecurrentes')) || [];
        
        this.initializeFirebase();
        this.setupEventListeners();
        this.startLocalBackup();
    }

    async initializeFirebase() {
        try {
            // Firebase ya está inicializado en el HTML
            this.auth = getAuth();
            this.db = getFirestore();
            
            // Configurar observador de autenticación
            onAuthStateChanged(this.auth, (user) => {
                if (user) {
                    this.user = user;
                    this.updateSyncStatus('Conectado', 'success');
                    this.setupRealtimeListeners();
                    console.log('Usuario autenticado:', user.uid);
                } else {
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
            this.updateSyncStatus('Conectando...', 'warning');
            await signInAnonymously(this.auth);
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
        const descripcion = document.getElementById('descripcion-ingreso-mp').value.trim();
        const monto = parseFloat(document.getElementById('monto-ingreso-mp').value);
        const comision = parseFloat(document.getElementById('comision-mp').value) || 0;
        const categoria = document.getElementById('categoria-ingreso-mp').value;
        const cliente = document.getElementById('cliente-mp').value.trim();

        if (!descripcion || !monto || monto <= 0) {
            alert('Por favor, completa descripción y monto correctamente');
            return;
        }

        const ingreso = {
            descripcion,
            monto,
            comision,
            montoNeto: monto - comision,
            categoria: categoria || 'Sin categoría',
            cliente: cliente || 'Cliente general',
            fecha: new Date().toLocaleDateString(),
            timestamp: serverTimestamp(),
            tipo: 'ingreso-mp'
        };

        try {
            await addDoc(collection(this.db, 'ingresosMP'), ingreso);
            
            // Limpiar formulario
            document.getElementById('descripcion-ingreso-mp').value = '';
            document.getElementById('monto-ingreso-mp').value = '';
            document.getElementById('comision-mp').value = '';
            document.getElementById('categoria-ingreso-mp').value = '';
            document.getElementById('cliente-mp').value = '';
            
            this.updateSyncStatus('Sincronizado', 'success');
            
        } catch (error) {
            console.error('Error agregando ingreso MP:', error);
            this.updateSyncStatus('Error al guardar', 'error');
            this.agregarLocalFallback('ingresosMP', ingreso);
        }
    }

    // Agregar Venta Mostrador
    async agregarVentaMostrador() {
        const descripcion = document.getElementById('descripcion-venta-mostrador').value.trim();
        const monto = parseFloat(document.getElementById('monto-venta-mostrador').value);
        const categoria = document.getElementById('categoria-venta-mostrador').value;
        const cliente = document.getElementById('cliente-mostrador').value.trim();

        if (!descripcion || !monto || monto <= 0) {
            alert('Por favor, completa descripción y monto correctamente');
            return;
        }

        const venta = {
            descripcion,
            monto,
            categoria: categoria || 'Sin categoría',
            cliente: cliente || 'Cliente general',
            fecha: new Date().toLocaleDateString(),
            timestamp: serverTimestamp(),
            tipo: 'venta-mostrador'
        };

        try {
            await addDoc(collection(this.db, 'ventasMostrador'), venta);
            
            // Limpiar formulario
            document.getElementById('descripcion-venta-mostrador').value = '';
            document.getElementById('monto-venta-mostrador').value = '';
            document.getElementById('categoria-venta-mostrador').value = '';
            document.getElementById('cliente-mostrador').value = '';
            
            this.updateSyncStatus('Sincronizado', 'success');
            
        } catch (error) {
            console.error('Error agregando venta mostrador:', error);
            this.updateSyncStatus('Error al guardar', 'error');
            this.agregarLocalFallback('ventasMostrador', venta);
        }
    }

    // Agregar Pago Proveedor
    async agregarPagoProveedor() {
        const proveedor = document.getElementById('proveedor-transferencia').value.trim();
        const descripcion = document.getElementById('descripcion-pago-proveedor').value.trim();
        const monto = parseFloat(document.getElementById('monto-pago-proveedor').value);
        const factura = document.getElementById('numero-factura').value.trim();
        const estado = document.getElementById('estado-pago-proveedor').value;

        if (!proveedor || !descripcion || !monto || monto <= 0) {
            alert('Por favor, completa todos los campos obligatorios');
            return;
        }

        const pago = {
            proveedor,
            descripcion,
            monto,
            numeroFactura: factura || '',
            estado,
            fecha: new Date().toLocaleDateString(),
            timestamp: serverTimestamp(),
            tipo: 'pago-proveedor'
        };

        try {
            await addDoc(collection(this.db, 'pagosProveedores'), pago);
            
            // Agregar proveedor a lista recurrente
            this.agregarProveedorRecurrente(proveedor);
            
            // Limpiar formulario
            document.getElementById('proveedor-transferencia').value = '';
            document.getElementById('descripcion-pago-proveedor').value = '';
            document.getElementById('monto-pago-proveedor').value = '';
            document.getElementById('numero-factura').value = '';
            document.getElementById('estado-pago-proveedor').value = 'pagado';
            
            this.updateSyncStatus('Sincronizado', 'success');
            
        } catch (error) {
            console.error('Error agregando pago proveedor:', error);
            this.updateSyncStatus('Error al guardar', 'error');
            this.agregarLocalFallback('pagosProveedores', pago);
        }
    }

    // Agregar Pago Efectivo
    async agregarPagoEfectivo() {
        const proveedor = document.getElementById('proveedor-efectivo').value.trim();
        const descripcion = document.getElementById('descripcion-pago-efectivo').value.trim();
        const monto = parseFloat(document.getElementById('monto-pago-efectivo').value);
        const recibo = document.getElementById('recibo-efectivo').value.trim();

        if (!proveedor || !descripcion || !monto || monto <= 0) {
            alert('Por favor, completa todos los campos obligatorios');
            return;
        }

        const pago = {
            proveedor,
            descripcion,
            monto,
            numeroRecibo: recibo || '',
            fecha: new Date().toLocaleDateString(),
            timestamp: serverTimestamp(),
            tipo: 'pago-efectivo'
        };

        try {
            await addDoc(collection(this.db, 'pagosEfectivo'), pago);
            
            // Limpiar formulario
            document.getElementById('proveedor-efectivo').value = '';
            document.getElementById('descripcion-pago-efectivo').value = '';
            document.getElementById('monto-pago-efectivo').value = '';
            document.getElementById('recibo-efectivo').value = '';
            
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
                <td data-label="Fecha">${ingreso.fecha}</td>
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
        const tbody = document.getElementById('tabla-ventas-mostrador');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        const ventas = this.ventasMostrador.slice(0, limite);

        ventas.forEach(venta => {
            const row = tbody.insertRow();
            row.innerHTML = `
                <td data-label="Fecha">${venta.fecha}</td>
                <td data-label="Descripción">${venta.descripcion}</td>
                <td data-label="Categoría">${venta.categoria || 'Sin categoría'}</td>
                <td data-label="Cliente">${venta.cliente || 'Cliente general'}</td>
                <td data-label="Monto">$${venta.monto.toFixed(2)}</td>
                <td data-label="Acciones">
                    <button onclick="control.eliminarRegistro('${venta.id}', 'ventasMostrador')" class="btn-eliminar">
                        🗑️ Eliminar
                    </button>
                </td>
            `;
        });
    }

    mostrarPagosProveedores(limite = 5) {
        const tbody = document.getElementById('tabla-pagos-proveedores');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        const pagos = this.pagosProveedores.slice(0, limite);

        pagos.forEach(pago => {
            const row = tbody.insertRow();
            const estadoClass = pago.estado === 'pendiente' ? 'estado-pendiente' : 'estado-pagado';
            
            row.innerHTML = `
                <td data-label="Fecha">${pago.fecha}</td>
                <td data-label="Proveedor">${pago.proveedor}</td>
                <td data-label="Descripción">${pago.descripcion}</td>
                <td data-label="Factura">${pago.numeroFactura || 'Sin factura'}</td>
                <td data-label="Monto">$${pago.monto.toFixed(2)}</td>
                <td data-label="Estado"><span class="${estadoClass}">${pago.estado}</span></td>
                <td data-label="Acciones">
                    <button onclick="control.eliminarRegistro('${pago.id}', 'pagosProveedores')" class="btn-eliminar">
                        🗑️ Eliminar
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
                <td data-label="Fecha">${pago.fecha}</td>
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
        // Calcular totales
        const totalIngresosMP = this.ingresosMP.reduce((sum, item) => sum + (item.montoNeto || item.monto), 0);
        const totalVentasMostrador = this.ventasMostrador.reduce((sum, item) => sum + item.monto, 0);
        const totalPagosProveedores = this.pagosProveedores.reduce((sum, item) => sum + item.monto, 0);
        const totalPagosEfectivo = this.pagosEfectivo.reduce((sum, item) => sum + item.monto, 0);
        
        const totalIngresos = totalIngresosMP + totalVentasMostrador;
        const totalEgresos = totalPagosProveedores + totalPagosEfectivo;
        const flujoCaja = totalIngresos - totalEgresos;
        
        const pendientes = this.pagosProveedores.filter(p => p.estado === 'pendiente');
        const totalPendientes = pendientes.reduce((sum, item) => sum + item.monto, 0);

        // Actualizar elementos del DOM
        document.getElementById('total-ingresos-mp').textContent = `$${totalIngresosMP.toFixed(2)}`;
        document.getElementById('contador-ingresos-mp').textContent = `${this.ingresosMP.length} transacciones`;
        
        document.getElementById('total-ventas-mostrador').textContent = `$${totalVentasMostrador.toFixed(2)}`;
        document.getElementById('contador-ventas-mostrador').textContent = `${this.ventasMostrador.length} ventas`;
        
        document.getElementById('total-pagos-proveedores').textContent = `$${totalPagosProveedores.toFixed(2)}`;
        document.getElementById('contador-pagos-proveedores').textContent = `${this.pagosProveedores.length} pagos`;
        
        document.getElementById('total-pagos-efectivo').textContent = `$${totalPagosEfectivo.toFixed(2)}`;
        document.getElementById('contador-pagos-efectivo').textContent = `${this.pagosEfectivo.length} pagos`;
        
        document.getElementById('flujo-caja-neto').textContent = `$${flujoCaja.toFixed(2)}`;
        document.getElementById('estado-flujo').textContent = flujoCaja >= 0 ? 'Positivo' : 'Negativo';
        
        document.getElementById('total-pendientes').textContent = `$${totalPendientes.toFixed(2)}`;
        document.getElementById('contador-pendientes').textContent = `${pendientes.length} facturas`;
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
        if (!this.syncStatus) return;
        
        this.syncStatus.textContent = message;
        this.syncStatus.className = `sync-status ${type}`;
        
        if (this.connectionStatus) {
            const icon = type === 'success' ? '🟢' : type === 'warning' ? '🟡' : '🔴';
            this.connectionStatus.textContent = icon;
        }
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
        // Botones principales
        document.getElementById('btn-agregar-ingreso-mp')?.addEventListener('click', () => this.agregarIngresoMP());
        document.getElementById('btn-agregar-venta-mostrador')?.addEventListener('click', () => this.agregarVentaMostrador());
        document.getElementById('btn-agregar-pago-proveedor')?.addEventListener('click', () => this.agregarPagoProveedor());
        document.getElementById('btn-agregar-pago-efectivo')?.addEventListener('click', () => this.agregarPagoEfectivo());
        
        // Botones de gestión
        document.getElementById('btn-exportar')?.addEventListener('click', () => this.exportarDatos());
        
        // Enter en formularios
        document.getElementById('monto-ingreso-mp')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.agregarIngresoMP();
        });
        
        document.getElementById('monto-venta-mostrador')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.agregarVentaMostrador();
        });

        document.getElementById('monto-pago-proveedor')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.agregarPagoProveedor();
        });

        document.getElementById('monto-pago-efectivo')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.agregarPagoEfectivo();
        });

        // Detectar conexión/desconexión
        window.addEventListener('online', () => {
            this.updateSyncStatus('Reconectando...', 'warning');
            if (!this.user) this.signInAnonymously();
        });

        window.addEventListener('offline', () => {
            this.updateSyncStatus('Sin conexión', 'error');
        });
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
    window.control = new ControlFerreteriaFirebase();
});

// Cleanup al cerrar la página
window.addEventListener('beforeunload', () => {
    if (window.control) {
        window.control.destroy();
    }
});