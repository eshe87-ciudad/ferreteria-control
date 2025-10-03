// Extensión del sistema para incluir gestión de inventario
// Agregar al script-ferreteria.js

class GestorInventario {
    constructor() {
        this.productos = this.cargarDatos('productos') || [];
        this.movimientosStock = this.cargarDatos('movimientosStock') || [];
        this.inicializar();
    }

    inicializar() {
        this.configurarEventosInventario();
        
        // Agregar productos de ejemplo si no hay datos
        if (this.productos.length === 0) {
            this.agregarProductosEjemplo();
        }
        
        this.actualizarInterfazInventario();
    }

    configurarEventosInventario() {
        // Formulario agregar producto
        document.getElementById('form-producto')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.agregarProducto();
        });

        // Formulario movimiento stock
        document.getElementById('form-movimiento-stock')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.registrarMovimiento();
        });
    }

    agregarProducto() {
        const codigo = document.getElementById('prod-codigo').value.trim();
        const nombre = document.getElementById('prod-nombre').value.trim();
        const categoria = document.getElementById('prod-categoria').value;
        const precio = parseFloat(document.getElementById('prod-precio').value);
        const stockMinimo = parseInt(document.getElementById('prod-stock-minimo').value) || 0;
        const stockActual = parseInt(document.getElementById('prod-stock-inicial').value) || 0;

        if (!codigo || !nombre || !categoria || precio <= 0) {
            this.mostrarNotificacion('Por favor, completa todos los campos obligatorios', 'error');
            return;
        }

        // Verificar si el código ya existe
        if (this.productos.find(p => p.codigo === codigo)) {
            this.mostrarNotificacion('Ya existe un producto con ese código', 'error');
            return;
        }

        const nuevoProducto = {
            id: Date.now(),
            codigo,
            nombre,
            categoria,
            precio,
            stockMinimo,
            stockActual,
            fechaCreacion: new Date().toISOString(),
            estado: 'activo'
        };

        this.productos.push(nuevoProducto);
        this.guardarDatos('productos', this.productos);

        // Registrar movimiento inicial de stock
        if (stockActual > 0) {
            this.registrarMovimientoStock(nuevoProducto.id, 'entrada', stockActual, 'Stock inicial', 'Sistema');
        }

        this.actualizarInterfazInventario();
        this.limpiarFormulario('form-producto');
        this.mostrarNotificacion('Producto agregado correctamente', 'success');
    }

    registrarMovimiento() {
        const productoCodigo = document.getElementById('mov-producto').value;
        const tipo = document.getElementById('mov-tipo').value;
        const cantidad = parseInt(document.getElementById('mov-cantidad').value);
        const motivo = document.getElementById('mov-motivo').value.trim();
        const responsable = document.getElementById('mov-responsable').value.trim() || 'Sistema';

        if (!productoCodigo || !tipo || cantidad <= 0 || !motivo) {
            this.mostrarNotificacion('Por favor, completa todos los campos', 'error');
            return;
        }

        const producto = this.productos.find(p => p.codigo === productoCodigo);
        if (!producto) {
            this.mostrarNotificacion('Producto no encontrado', 'error');
            return;
        }

        // Validar stock suficiente para salidas
        if (tipo === 'salida' && producto.stockActual < cantidad) {
            this.mostrarNotificacion(`Stock insuficiente. Disponible: ${producto.stockActual}`, 'error');
            return;
        }

        this.registrarMovimientoStock(producto.id, tipo, cantidad, motivo, responsable);
        this.actualizarInterfazInventario();
        this.limpiarFormulario('form-movimiento-stock');
        this.mostrarNotificacion('Movimiento registrado correctamente', 'success');
    }

    registrarMovimientoStock(productoId, tipo, cantidad, motivo, responsable) {
        const producto = this.productos.find(p => p.id === productoId);
        if (!producto) return;

        const movimiento = {
            id: Date.now(),
            productoId,
            productoCodigo: producto.codigo,
            productoNombre: producto.nombre,
            tipo,
            cantidad,
            stockAnterior: producto.stockActual,
            motivo,
            responsable,
            fecha: new Date().toISOString(),
            hora: new Date().toLocaleTimeString('es-ES', {hour12: false})
        };

        // Actualizar stock del producto
        if (tipo === 'entrada') {
            producto.stockActual += cantidad;
        } else if (tipo === 'salida') {
            producto.stockActual -= cantidad;
        }

        movimiento.stockNuevo = producto.stockActual;

        this.movimientosStock.push(movimiento);
        this.guardarDatos('movimientosStock', this.movimientosStock);
        this.guardarDatos('productos', this.productos);

        return movimiento;
    }

    // Método para descontar automáticamente al registrar venta
    procesarVentaConInventario(ventaData, productosVendidos) {
        const movimientos = [];

        productosVendidos.forEach(item => {
            const producto = this.productos.find(p => p.codigo === item.codigo);
            if (producto) {
                if (producto.stockActual >= item.cantidad) {
                    const movimiento = this.registrarMovimientoStock(
                        producto.id,
                        'salida',
                        item.cantidad,
                        `Venta: ${ventaData.descripcion}`,
                        'Sistema'
                    );
                    movimientos.push(movimiento);
                } else {
                    this.mostrarNotificacion(
                        `Stock insuficiente para ${producto.nombre}. Disponible: ${producto.stockActual}`,
                        'warning'
                    );
                }
            }
        });

        return movimientos;
    }

    obtenerProductosStockBajo() {
        return this.productos.filter(p => p.stockActual <= p.stockMinimo && p.estado === 'activo');
    }

    obtenerMovimientosRecientes(limite = 10) {
        return this.movimientosStock
            .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
            .slice(0, limite);
    }

    actualizarInterfazInventario() {
        this.mostrarProductos();
        this.mostrarMovimientosStock();
        this.mostrarAlertasStock();
        this.actualizarDashboardInventario();
    }

    mostrarProductos() {
        const container = document.getElementById('lista-productos');
        if (!container) return;

        if (this.productos.length === 0) {
            container.innerHTML = '<p class="sin-datos">No hay productos registrados</p>';
            return;
        }

        const html = this.productos.map(producto => `
            <div class="producto-item ${producto.stockActual <= producto.stockMinimo ? 'stock-bajo' : ''}">
                <div class="producto-info">
                    <div class="producto-titulo">${producto.codigo} - ${producto.nombre}</div>
                    <div class="producto-detalles">
                        <span class="detalle-tag">${producto.categoria}</span>
                        <span class="detalle-tag">$${producto.precio.toLocaleString()}</span>
                        <span class="detalle-tag stock ${producto.stockActual <= producto.stockMinimo ? 'stock-bajo' : 'stock-ok'}">
                            Stock: ${producto.stockActual}
                        </span>
                        ${producto.stockActual <= producto.stockMinimo ? '<span class="alerta-stock">⚠️ Stock bajo</span>' : ''}
                    </div>
                </div>
                <div class="producto-acciones">
                    <button class="btn-stock btn-entrada" onclick="gestorInventario.agregarStock('${producto.codigo}')">
                        ➕ Agregar
                    </button>
                    <button class="btn-stock btn-salida" onclick="gestorInventario.quitarStock('${producto.codigo}')">
                        ➖ Quitar
                    </button>
                </div>
            </div>
        `).join('');

        container.innerHTML = html;
    }

    mostrarMovimientosStock(limite = 10) {
        const container = document.getElementById('lista-movimientos-stock');
        if (!container) return;

        const movimientos = this.obtenerMovimientosRecientes(limite);

        if (movimientos.length === 0) {
            container.innerHTML = '<p class="sin-datos">No hay movimientos de stock</p>';
            return;
        }

        const html = movimientos.map(mov => `
            <div class="movimiento-item">
                <div class="movimiento-info">
                    <div class="movimiento-titulo">${mov.productoCodigo} - ${mov.productoNombre}</div>
                    <div class="movimiento-detalles">
                        <span class="detalle-tag tipo-${mov.tipo}">${mov.tipo.toUpperCase()}: ${mov.cantidad}</span>
                        <span class="detalle-tag">Stock: ${mov.stockAnterior} → ${mov.stockNuevo}</span>
                        <span class="detalle-tag">${mov.motivo}</span>
                        <span class="detalle-tag">${mov.responsable}</span>
                        <span class="detalle-tag">${this.formatearFecha(mov.fecha)}</span>
                    </div>
                </div>
            </div>
        `).join('');

        container.innerHTML = html;
    }

    mostrarAlertasStock() {
        const container = document.getElementById('alertas-stock');
        if (!container) return;

        const productosStockBajo = this.obtenerProductosStockBajo();

        if (productosStockBajo.length === 0) {
            container.innerHTML = '<p class="sin-alertas">✅ Todos los productos tienen stock suficiente</p>';
            return;
        }

        const html = productosStockBajo.map(producto => `
            <div class="alerta-item">
                <span class="alerta-icono">⚠️</span>
                <div class="alerta-info">
                    <strong>${producto.codigo} - ${producto.nombre}</strong>
                    <small>Stock actual: ${producto.stockActual} | Mínimo: ${producto.stockMinimo}</small>
                </div>
                <button class="btn-alerta" onclick="gestorInventario.agregarStock('${producto.codigo}')">
                    Reponer
                </button>
            </div>
        `).join('');

        container.innerHTML = html;
    }

    actualizarDashboardInventario() {
        const totalProductos = this.productos.length;
        const productosStockBajo = this.obtenerProductosStockBajo().length;
        const valorInventario = this.productos.reduce((total, p) => total + (p.stockActual * p.precio), 0);

        document.getElementById('total-productos')?.textContent = totalProductos;
        document.getElementById('productos-stock-bajo')?.textContent = productosStockBajo;
        document.getElementById('valor-inventario')?.textContent = this.formatearMoneda(valorInventario);
    }

    // Métodos de utilidad
    agregarStock(codigo) {
        const cantidad = prompt('¿Cuántas unidades deseas agregar?');
        if (cantidad && !isNaN(cantidad) && parseInt(cantidad) > 0) {
            const motivo = prompt('Motivo del ingreso:') || 'Reposición manual';
            const producto = this.productos.find(p => p.codigo === codigo);
            if (producto) {
                this.registrarMovimientoStock(producto.id, 'entrada', parseInt(cantidad), motivo, 'Usuario');
                this.actualizarInterfazInventario();
                this.mostrarNotificacion(`Stock agregado: ${cantidad} unidades`, 'success');
            }
        }
    }

    quitarStock(codigo) {
        const cantidad = prompt('¿Cuántas unidades deseas quitar?');
        if (cantidad && !isNaN(cantidad) && parseInt(cantidad) > 0) {
            const motivo = prompt('Motivo de la salida:') || 'Ajuste manual';
            const producto = this.productos.find(p => p.codigo === codigo);
            if (producto) {
                if (producto.stockActual >= parseInt(cantidad)) {
                    this.registrarMovimientoStock(producto.id, 'salida', parseInt(cantidad), motivo, 'Usuario');
                    this.actualizarInterfazInventario();
                    this.mostrarNotificacion(`Stock retirado: ${cantidad} unidades`, 'success');
                } else {
                    this.mostrarNotificacion(`Stock insuficiente. Disponible: ${producto.stockActual}`, 'error');
                }
            }
        }
    }

    agregarProductosEjemplo() {
        const productosEjemplo = [
            {
                id: Date.now() + 1,
                codigo: 'TORN001',
                nombre: 'Tornillos autorroscantes 4x40mm',
                categoria: 'Herramientas manuales',
                precio: 150,
                stockMinimo: 50,
                stockActual: 100,
                fechaCreacion: new Date().toISOString(),
                estado: 'activo'
            },
            {
                id: Date.now() + 2,
                codigo: 'TALA001',
                nombre: 'Taladro eléctrico 750W',
                categoria: 'Herramientas eléctricas',
                precio: 25000,
                stockMinimo: 2,
                stockActual: 5,
                fechaCreacion: new Date().toISOString(),
                estado: 'activo'
            },
            {
                id: Date.now() + 3,
                codigo: 'CEME001',
                nombre: 'Cemento Portland x50kg',
                categoria: 'Materiales construcción',
                precio: 3500,
                stockMinimo: 10,
                stockActual: 25,
                fechaCreacion: new Date().toISOString(),
                estado: 'activo'
            }
        ];

        this.productos = productosEjemplo;
        this.guardarDatos('productos', this.productos);
    }

    // Métodos de utilidad compartidos
    cargarDatos(clave) {
        try {
            const datos = localStorage.getItem(clave);
            return datos ? JSON.parse(datos) : null;
        } catch (error) {
            console.error(`Error cargando ${clave}:`, error);
            return null;
        }
    }

    guardarDatos(clave, datos) {
        try {
            localStorage.setItem(clave, JSON.stringify(datos));
        } catch (error) {
            console.error(`Error guardando ${clave}:`, error);
        }
    }

    limpiarFormulario(formId) {
        document.getElementById(formId)?.reset();
    }

    mostrarNotificacion(mensaje, tipo = 'info') {
        // Reutilizar el sistema de notificaciones existente
        if (window.controlFerreteria) {
            window.controlFerreteria.mostrarNotificacion(mensaje, tipo);
        } else {
            console.log(`${tipo.toUpperCase()}: ${mensaje}`);
        }
    }

    formatearMoneda(cantidad) {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS'
        }).format(cantidad);
    }

    formatearFecha(fecha) {
        return new Date(fecha).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

// Inicializar el gestor de inventario
let gestorInventario;
document.addEventListener('DOMContentLoaded', function() {
    gestorInventario = new GestorInventario();
});