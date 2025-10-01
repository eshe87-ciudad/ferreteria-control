// script-ferreteria-firebase.js - Control de Ferretería con Firebase Real-time

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
        this.unsubscribeIngresos = null;
        this.unsubscribeGastos = null;
        this.syncStatus = document.getElementById('sync-status');
        this.connectionStatus = document.getElementById('connection-status');
        this.lastSync = document.getElementById('last-sync');
        
        // Datos locales como backup
        this.ingresos = JSON.parse(localStorage.getItem('ingresos')) || [];
        this.gastos = JSON.parse(localStorage.getItem('gastos')) || [];
        
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
            // Listener para ingresos
            const ingresosQuery = query(
                collection(this.db, 'ingresos'),
                orderBy('timestamp', 'desc')
            );
            
            this.unsubscribeIngresos = onSnapshot(ingresosQuery, (snapshot) => {
                this.ingresos = [];
                snapshot.forEach((doc) => {
                    this.ingresos.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });
                this.updateIngresosTable();
                this.updateTotales();
                this.updateLastSync();
                this.saveToLocalStorage(); // Backup local
            }, (error) => {
                console.error('Error en listener ingresos:', error);
                this.updateSyncStatus('Error sincronización', 'error');
            });

            // Listener para gastos
            const gastosQuery = query(
                collection(this.db, 'gastos'),
                orderBy('timestamp', 'desc')
            );
            
            this.unsubscribeGastos = onSnapshot(gastosQuery, (snapshot) => {
                this.gastos = [];
                snapshot.forEach((doc) => {
                    this.gastos.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });
                this.updateGastosTable();
                this.updateTotales();
                this.updateLastSync();
                this.saveToLocalStorage(); // Backup local
            }, (error) => {
                console.error('Error en listener gastos:', error);
                this.updateSyncStatus('Error sincronización', 'error');
            });

        } catch (error) {
            console.error('Error configurando listeners:', error);
            this.updateSyncStatus('Error de configuración', 'error');
        }
    }

    async agregarIngreso() {
        const concepto = document.getElementById('concepto-ingreso').value.trim();
        const monto = parseFloat(document.getElementById('monto-ingreso').value);

        if (!concepto || !monto || monto <= 0) {
            alert('Por favor, completa todos los campos correctamente');
            return;
        }

        const ingreso = {
            concepto,
            monto,
            fecha: new Date().toLocaleDateString(),
            timestamp: serverTimestamp()
        };

        try {
            // Agregar a Firebase
            await addDoc(collection(this.db, 'ingresos'), ingreso);
            
            // Limpiar formulario
            document.getElementById('concepto-ingreso').value = '';
            document.getElementById('monto-ingreso').value = '';
            
            this.updateSyncStatus('Sincronizado', 'success');
            
        } catch (error) {
            console.error('Error agregando ingreso:', error);
            this.updateSyncStatus('Error al guardar', 'error');
            
            // Fallback: guardar localmente
            ingreso.timestamp = new Date().toISOString();
            ingreso.id = Date.now().toString();
            this.ingresos.unshift(ingreso);
            this.updateIngresosTable();
            this.updateTotales();
            this.saveToLocalStorage();
        }
    }

    async eliminarIngreso(id) {
        if (!confirm('¿Estás seguro de eliminar este ingreso?')) return;

        try {
            await deleteDoc(doc(this.db, 'ingresos', id));
            this.updateSyncStatus('Sincronizado', 'success');
            
        } catch (error) {
            console.error('Error eliminando ingreso:', error);
            this.updateSyncStatus('Error al eliminar', 'error');
            
            // Fallback: eliminar localmente
            this.ingresos = this.ingresos.filter(ingreso => ingreso.id !== id);
            this.updateIngresosTable();
            this.updateTotales();
            this.saveToLocalStorage();
        }
    }

    async agregarGasto() {
        const concepto = document.getElementById('concepto-gasto').value.trim();
        const monto = parseFloat(document.getElementById('monto-gasto').value);

        if (!concepto || !monto || monto <= 0) {
            alert('Por favor, completa todos los campos correctamente');
            return;
        }

        const gasto = {
            concepto,
            monto,
            fecha: new Date().toLocaleDateString(),
            timestamp: serverTimestamp()
        };

        try {
            // Agregar a Firebase
            await addDoc(collection(this.db, 'gastos'), gasto);
            
            // Limpiar formulario
            document.getElementById('concepto-gasto').value = '';
            document.getElementById('monto-gasto').value = '';
            
            this.updateSyncStatus('Sincronizado', 'success');
            
        } catch (error) {
            console.error('Error agregando gasto:', error);
            this.updateSyncStatus('Error al guardar', 'error');
            
            // Fallback: guardar localmente
            gasto.timestamp = new Date().toISOString();
            gasto.id = Date.now().toString();
            this.gastos.unshift(gasto);
            this.updateGastosTable();
            this.updateTotales();
            this.saveToLocalStorage();
        }
    }

    async eliminarGasto(id) {
        if (!confirm('¿Estás seguro de eliminar este gasto?')) return;

        try {
            await deleteDoc(doc(this.db, 'gastos', id));
            this.updateSyncStatus('Sincronizado', 'success');
            
        } catch (error) {
            console.error('Error eliminando gasto:', error);
            this.updateSyncStatus('Error al eliminar', 'error');
            
            // Fallback: eliminar localmente
            this.gastos = this.gastos.filter(gasto => gasto.id !== id);
            this.updateGastosTable();
            this.updateTotales();
            this.saveToLocalStorage();
        }
    }

    updateIngresosTable() {
        const tbody = document.getElementById('tabla-ingresos');
        tbody.innerHTML = '';

        this.ingresos.forEach(ingreso => {
            const row = tbody.insertRow();
            row.innerHTML = `
                <td data-label="Fecha">${ingreso.fecha}</td>
                <td data-label="Concepto">${ingreso.concepto}</td>
                <td data-label="Monto">$${ingreso.monto.toFixed(2)}</td>
                <td data-label="Acciones">
                    <button onclick="control.eliminarIngreso('${ingreso.id}')" class="btn-eliminar">
                        🗑️ Eliminar
                    </button>
                </td>
            `;
        });
    }

    updateGastosTable() {
        const tbody = document.getElementById('tabla-gastos');
        tbody.innerHTML = '';

        this.gastos.forEach(gasto => {
            const row = tbody.insertRow();
            row.innerHTML = `
                <td data-label="Fecha">${gasto.fecha}</td>
                <td data-label="Concepto">${gasto.concepto}</td>
                <td data-label="Monto">$${gasto.monto.toFixed(2)}</td>
                <td data-label="Acciones">
                    <button onclick="control.eliminarGasto('${gasto.id}')" class="btn-eliminar">
                        🗑️ Eliminar
                    </button>
                </td>
            `;
        });
    }

    updateTotales() {
        const totalIngresos = this.ingresos.reduce((sum, item) => sum + item.monto, 0);
        const totalGastos = this.gastos.reduce((sum, item) => sum + item.monto, 0);
        const balance = totalIngresos - totalGastos;

        document.getElementById('total-ingresos').textContent = `$${totalIngresos.toFixed(2)}`;
        document.getElementById('total-gastos').textContent = `$${totalGastos.toFixed(2)}`;
        
        const balanceElement = document.getElementById('balance');
        balanceElement.textContent = `$${balance.toFixed(2)}`;
        balanceElement.className = balance >= 0 ? 'positivo' : 'negativo';
    }

    updateSyncStatus(message, type) {
        if (!this.syncStatus) return;
        
        this.syncStatus.textContent = message;
        this.syncStatus.className = `sync-status ${type}`;
        
        // Actualizar indicador de conexión
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

    // Funciones de backup local
    saveToLocalStorage() {
        try {
            localStorage.setItem('ingresos', JSON.stringify(this.ingresos));
            localStorage.setItem('gastos', JSON.stringify(this.gastos));
            localStorage.setItem('lastBackup', new Date().toISOString());
        } catch (error) {
            console.error('Error guardando en localStorage:', error);
        }
    }

    loadFromLocalStorage() {
        try {
            this.ingresos = JSON.parse(localStorage.getItem('ingresos')) || [];
            this.gastos = JSON.parse(localStorage.getItem('gastos')) || [];
            this.updateIngresosTable();
            this.updateGastosTable();
            this.updateTotales();
            this.updateSyncStatus('Datos locales', 'warning');
        } catch (error) {
            console.error('Error cargando desde localStorage:', error);
            this.ingresos = [];
            this.gastos = [];
        }
    }

    startLocalBackup() {
        // Backup automático cada 5 minutos
        setInterval(() => {
            this.saveToLocalStorage();
        }, 5 * 60 * 1000);
    }

    // Funciones de importar/exportar
    exportarDatos() {
        const datos = {
            ingresos: this.ingresos,
            gastos: this.gastos,
            fechaExportacion: new Date().toISOString(),
            version: '2.0-firebase'
        };

        const dataStr = JSON.stringify(datos, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

        const exportFileDefaultName = `ferreteria-control-${new Date().toISOString().split('T')[0]}.json`;

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    }

    async importarDatos() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';

        input.onchange = async (event) => {
            const file = event.target.files[0];
            if (!file) return;

            try {
                const text = await file.text();
                const datos = JSON.parse(text);

                if (!datos.ingresos || !datos.gastos) {
                    alert('Formato de archivo inválido');
                    return;
                }

                if (confirm('¿Estás seguro? Esto reemplazará todos los datos actuales.')) {
                    // Si Firebase está disponible, subir datos
                    if (this.db && this.user) {
                        await this.uploadDataToFirebase(datos);
                    } else {
                        // Solo local
                        this.ingresos = datos.ingresos;
                        this.gastos = datos.gastos;
                        this.updateIngresosTable();
                        this.updateGastosTable();
                        this.updateTotales();
                        this.saveToLocalStorage();
                    }
                    
                    alert('Datos importados correctamente');
                }
            } catch (error) {
                console.error('Error importando datos:', error);
                alert('Error al importar datos');
            }
        };

        input.click();
    }

    async uploadDataToFirebase(datos) {
        try {
            const batch = writeBatch(this.db);
            
            // Limpiar colecciones actuales (esto se hará a través de los listeners)
            // Agregar nuevos datos
            datos.ingresos.forEach(ingreso => {
                const docRef = doc(collection(this.db, 'ingresos'));
                batch.set(docRef, {
                    ...ingreso,
                    timestamp: serverTimestamp()
                });
            });

            datos.gastos.forEach(gasto => {
                const docRef = doc(collection(this.db, 'gastos'));
                batch.set(docRef, {
                    ...gasto,
                    timestamp: serverTimestamp()
                });
            });

            await batch.commit();
            this.updateSyncStatus('Datos subidos', 'success');
            
        } catch (error) {
            console.error('Error subiendo datos a Firebase:', error);
            this.updateSyncStatus('Error en importación', 'error');
            throw error;
        }
    }

    limpiarTodo() {
        if (confirm('¿Estás COMPLETAMENTE seguro? Esta acción eliminará TODOS los datos y NO se puede deshacer.')) {
            if (confirm('ÚLTIMA CONFIRMACIÓN: ¿Eliminar todos los ingresos y gastos?')) {
                // Limpiar Firebase si está disponible
                if (this.db && this.user) {
                    this.clearFirebaseData();
                }
                
                // Limpiar datos locales
                this.ingresos = [];
                this.gastos = [];
                this.updateIngresosTable();
                this.updateGastosTable();
                this.updateTotales();
                this.saveToLocalStorage();
                
                alert('Todos los datos han sido eliminados');
            }
        }
    }

    async clearFirebaseData() {
        try {
            const batch = writeBatch(this.db);
            
            // Esto es una aproximación - en producción usarías Cloud Functions
            // para eliminar colecciones completas
            this.ingresos.forEach(ingreso => {
                if (ingreso.id) {
                    batch.delete(doc(this.db, 'ingresos', ingreso.id));
                }
            });

            this.gastos.forEach(gasto => {
                if (gasto.id) {
                    batch.delete(doc(this.db, 'gastos', gasto.id));
                }
            });

            await batch.commit();
            this.updateSyncStatus('Datos eliminados', 'success');
            
        } catch (error) {
            console.error('Error eliminando datos de Firebase:', error);
            this.updateSyncStatus('Error al limpiar', 'error');
        }
    }

    setupEventListeners() {
        // Botones principales
        document.getElementById('btn-agregar-ingreso')?.addEventListener('click', () => this.agregarIngreso());
        document.getElementById('btn-agregar-gasto')?.addEventListener('click', () => this.agregarGasto());
        
        // Botones de gestión
        document.getElementById('btn-exportar')?.addEventListener('click', () => this.exportarDatos());
        document.getElementById('btn-importar')?.addEventListener('click', () => this.importarDatos());
        document.getElementById('btn-limpiar')?.addEventListener('click', () => this.limpiarTodo());

        // Enter en formularios
        document.getElementById('monto-ingreso')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.agregarIngreso();
        });
        
        document.getElementById('monto-gasto')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.agregarGasto();
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
        if (this.unsubscribeIngresos) this.unsubscribeIngresos();
        if (this.unsubscribeGastos) this.unsubscribeGastos();
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