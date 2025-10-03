// Sistema de Backup y Reset para Control Ferretería
// Agregar al final de script-ferreteria.js

class SistemaBackupReset {
    constructor() {
        this.claves = [
            'ingresosMP',
            'ventasMostrador', 
            'pagosProveedores',
            'pagosEfectivo',
            'proveedoresRecurrentes',
            'productos',
            'movimientosStock'
        ];
    }

    // Crear backup completo
    crearBackup() {
        try {
            const backup = {
                fecha: new Date().toISOString(),
                timestamp: Date.now(),
                version: '1.0',
                datos: {}
            };

            // Recopilar todos los datos
            this.claves.forEach(clave => {
                const datos = localStorage.getItem(clave);
                backup.datos[clave] = datos ? JSON.parse(datos) : null;
            });

            // Calcular estadísticas del backup
            backup.estadisticas = this.calcularEstadisticas(backup.datos);

            // Guardar backup con timestamp
            const nombreBackup = `backup_${backup.timestamp}`;
            localStorage.setItem(nombreBackup, JSON.stringify(backup));

            // Mantener lista de backups
            this.actualizarListaBackups(nombreBackup);

            return {
                success: true,
                backup,
                nombre: nombreBackup
            };

        } catch (error) {
            console.error('Error creando backup:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Calcular estadísticas de los datos
    calcularEstadisticas(datos) {
        const stats = {
            ingresosMP: datos.ingresosMP?.length || 0,
            ventasMostrador: datos.ventasMostrador?.length || 0,
            pagosProveedores: datos.pagosProveedores?.length || 0,
            pagosEfectivo: datos.pagosEfectivo?.length || 0,
            productos: datos.productos?.length || 0,
            movimientosStock: datos.movimientosStock?.length || 0,
            totalRegistros: 0,
            totalIngresos: 0,
            totalEgresos: 0
        };

        // Calcular totales
        stats.totalRegistros = stats.ingresosMP + stats.ventasMostrador + 
                              stats.pagosProveedores + stats.pagosEfectivo + 
                              stats.movimientosStock;

        // Calcular montos
        if (datos.ingresosMP) {
            stats.totalIngresos += datos.ingresosMP.reduce((sum, item) => sum + (item.montoNeto || 0), 0);
        }
        if (datos.ventasMostrador) {
            stats.totalIngresos += datos.ventasMostrador.reduce((sum, item) => sum + (item.monto || 0), 0);
        }
        if (datos.pagosProveedores) {
            stats.totalEgresos += datos.pagosProveedores.reduce((sum, item) => sum + (item.monto || 0), 0);
        }
        if (datos.pagosEfectivo) {
            stats.totalEgresos += datos.pagosEfectivo.reduce((sum, item) => sum + (item.monto || 0), 0);
        }

        stats.balanceNeto = stats.totalIngresos - stats.totalEgresos;

        return stats;
    }

    // Actualizar lista de backups disponibles
    actualizarListaBackups(nuevoBackup) {
        let backups = JSON.parse(localStorage.getItem('lista_backups') || '[]');
        backups.push(nuevoBackup);
        
        // Mantener solo los últimos 10 backups
        backups = backups.slice(-10);
        
        localStorage.setItem('lista_backups', JSON.stringify(backups));
    }

    // Reset completo del sistema
    resetCompleto() {
        try {
            // Crear backup automático antes del reset
            const backupResult = this.crearBackup();
            
            if (!backupResult.success) {
                throw new Error('No se pudo crear backup antes del reset');
            }

            // Borrar todos los datos principales
            this.claves.forEach(clave => {
                localStorage.removeItem(clave);
            });

            // Reinicializar arrays vacíos
            this.claves.forEach(clave => {
                localStorage.setItem(clave, JSON.stringify([]));
            });

            return {
                success: true,
                backupCreado: backupResult.nombre,
                mensaje: 'Sistema reseteado completamente. Backup creado automáticamente.'
            };

        } catch (error) {
            console.error('Error en reset completo:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Exportar backup como archivo JSON
    exportarBackup(nombreBackup = null) {
        try {
            let backup;
            
            if (nombreBackup) {
                // Exportar backup específico
                const backupData = localStorage.getItem(nombreBackup);
                if (!backupData) {
                    throw new Error('Backup no encontrado');
                }
                backup = JSON.parse(backupData);
            } else {
                // Crear y exportar backup actual
                const result = this.crearBackup();
                if (!result.success) {
                    throw new Error(result.error);
                }
                backup = result.backup;
            }

            // Crear archivo para descarga
            const contenido = JSON.stringify(backup, null, 2);
            const blob = new Blob([contenido], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            // Crear enlace de descarga
            const fecha = new Date(backup.fecha).toISOString().slice(0, 10);
            const nombreArchivo = `ferreteria_backup_${fecha}.json`;
            
            const enlace = document.createElement('a');
            enlace.href = url;
            enlace.download = nombreArchivo;
            enlace.click();
            
            URL.revokeObjectURL(url);

            return {
                success: true,
                archivo: nombreArchivo
            };

        } catch (error) {
            console.error('Error exportando backup:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Importar backup desde archivo
    importarBackup(archivo) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const backup = JSON.parse(e.target.result);
                    
                    // Validar estructura del backup
                    if (!backup.datos || !backup.fecha) {
                        throw new Error('Archivo de backup inválido');
                    }

                    // Crear backup del estado actual antes de importar
                    this.crearBackup();

                    // Restaurar datos
                    this.claves.forEach(clave => {
                        if (backup.datos[clave]) {
                            localStorage.setItem(clave, JSON.stringify(backup.datos[clave]));
                        }
                    });

                    resolve({
                        success: true,
                        mensaje: 'Backup importado correctamente',
                        estadisticas: backup.estadisticas
                    });

                } catch (error) {
                    reject({
                        success: false,
                        error: error.message
                    });
                }
            };

            reader.onerror = () => {
                reject({
                    success: false,
                    error: 'Error leyendo el archivo'
                });
            };

            reader.readAsText(archivo);
        });
    }

    // Listar backups disponibles
    listarBackups() {
        const lista = JSON.parse(localStorage.getItem('lista_backups') || '[]');
        
        return lista.map(nombre => {
            const backup = JSON.parse(localStorage.getItem(nombre) || '{}');
            return {
                nombre,
                fecha: backup.fecha,
                estadisticas: backup.estadisticas,
                tamaño: this.calcularTamañoBackup(backup)
            };
        }).sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    }

    // Calcular tamaño del backup
    calcularTamañoBackup(backup) {
        const json = JSON.stringify(backup);
        const bytes = new Blob([json]).size;
        
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1048576) return Math.round(bytes / 1024) + ' KB';
        return Math.round(bytes / 1048576) + ' MB';
    }

    // Eliminar backup específico
    eliminarBackup(nombreBackup) {
        try {
            localStorage.removeItem(nombreBackup);
            
            // Actualizar lista
            let lista = JSON.parse(localStorage.getItem('lista_backups') || '[]');
            lista = lista.filter(nombre => nombre !== nombreBackup);
            localStorage.setItem('lista_backups', JSON.stringify(lista));

            return {
                success: true,
                mensaje: 'Backup eliminado correctamente'
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Restaurar desde backup específico
    restaurarBackup(nombreBackup) {
        try {
            const backupData = localStorage.getItem(nombreBackup);
            if (!backupData) {
                throw new Error('Backup no encontrado');
            }

            const backup = JSON.parse(backupData);

            // Crear backup del estado actual
            this.crearBackup();

            // Restaurar datos
            this.claves.forEach(clave => {
                if (backup.datos[clave]) {
                    localStorage.setItem(clave, JSON.stringify(backup.datos[clave]));
                } else {
                    localStorage.setItem(clave, JSON.stringify([]));
                }
            });

            return {
                success: true,
                mensaje: 'Sistema restaurado correctamente',
                estadisticas: backup.estadisticas
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Limpiar backups antiguos (mantener solo los últimos N)
    limpiarBackupsAntiguos(mantener = 5) {
        try {
            const backups = this.listarBackups();
            
            if (backups.length <= mantener) {
                return {
                    success: true,
                    mensaje: 'No hay backups antiguos para eliminar'
                };
            }

            const paraEliminar = backups.slice(mantener);
            let eliminados = 0;

            paraEliminar.forEach(backup => {
                const result = this.eliminarBackup(backup.nombre);
                if (result.success) eliminados++;
            });

            return {
                success: true,
                mensaje: `${eliminados} backups antiguos eliminados`
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
}

// Funciones de utilidad para la interfaz
function confirmarReset() {
    const confirmacion = confirm(
        '⚠️ ATENCIÓN: Esta acción eliminará TODOS los datos del sistema.\n\n' +
        'Se creará un backup automático antes del reset.\n\n' +
        '¿Estás seguro de que quieres continuar?'
    );

    if (confirmacion) {
        const segundaConfirmacion = confirm(
            '🔴 ÚLTIMA CONFIRMACIÓN\n\n' +
            'Esta acción es IRREVERSIBLE.\n' +
            'Todos los ingresos, ventas, pagos y datos se borrarán.\n\n' +
            '¿Confirmas el RESET COMPLETO?'
        );

        if (segundaConfirmacion) {
            ejecutarReset();
        }
    }
}

function ejecutarReset() {
    const sistema = new SistemaBackupReset();
    const resultado = sistema.resetCompleto();

    if (resultado.success) {
        alert('✅ Sistema reseteado correctamente.\n\n' + 
              `Backup creado: ${resultado.backupCreado}\n\n` +
              'La página se recargará automáticamente.');
        
        // Recargar la página para mostrar el sistema limpio
        setTimeout(() => {
            window.location.reload();
        }, 1000);
    } else {
        alert('❌ Error en el reset: ' + resultado.error);
    }
}

function crearBackupManual() {
    const sistema = new SistemaBackupReset();
    const resultado = sistema.crearBackup();

    if (resultado.success) {
        const stats = resultado.backup.estadisticas;
        alert('✅ Backup creado correctamente.\n\n' +
              `Nombre: ${resultado.nombre}\n` +
              `Total registros: ${stats.totalRegistros}\n` +
              `Balance neto: $${stats.balanceNeto.toLocaleString()}`);
    } else {
        alert('❌ Error creando backup: ' + resultado.error);
    }
}

function exportarBackupActual() {
    const sistema = new SistemaBackupReset();
    const resultado = sistema.exportarBackup();

    if (resultado.success) {
        alert('✅ Backup exportado correctamente.\n\n' +
              `Archivo: ${resultado.archivo}`);
    } else {
        alert('❌ Error exportando backup: ' + resultado.error);
    }
}

function mostrarBackups() {
    const sistema = new SistemaBackupReset();
    const backups = sistema.listarBackups();

    if (backups.length === 0) {
        alert('No hay backups disponibles.');
        return;
    }

    let mensaje = '📦 BACKUPS DISPONIBLES:\n\n';
    backups.forEach((backup, index) => {
        const fecha = new Date(backup.fecha).toLocaleString('es-ES');
        mensaje += `${index + 1}. ${fecha}\n`;
        mensaje += `   Registros: ${backup.estadisticas.totalRegistros}\n`;
        mensaje += `   Tamaño: ${backup.tamaño}\n\n`;
    });

    alert(mensaje);
}

// Inicializar sistema al cargar la página
let sistemaBackup;
document.addEventListener('DOMContentLoaded', function() {
    sistemaBackup = new SistemaBackupReset();
});