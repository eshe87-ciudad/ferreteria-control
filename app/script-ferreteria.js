// Clase principal para el control de la ferretería
class ControlFerreteria {
    constructor() {
        this.ingresosMP = this.cargarDatos('ingresosMP') || [];
        this.ventasMostrador = this.cargarDatos('ventasMostrador') || [];
        this.pagosProveedores = this.cargarDatos('pagosProveedores') || [];
        this.pagosEfectivo = this.cargarDatos('pagosEfectivo') || [];
        this.proveedoresRecurrentes = this.cargarDatos('proveedoresRecurrentes') || [];
        this.filtroActual = {
            fechaDesde: null,
            fechaHasta: null,
            tipo: 'todas'
        };
        
        this.inicializar();
    }

    inicializar() {
        this.configurarEventos();
        this.configurarFechasIniciales();
        this.configurarBackupAutomatico();
        
        // Intentar recuperar backup si no hay datos
        if (!this.tieneRegistros()) {
            if (!this.recuperarBackupEmergencia()) {
                // Solo agregar datos de ejemplo si no hay backup
                this.agregarDatosEjemplo();
            }
        }
        
        this.actualizarInterfaz();
        this.llenarProveedoresRecurrentes();
        this.actualizarIndicadorGuardado();
    }

    configurarEventos() {
        // Formulario ingresos MP
        document.getElementById('form-ingreso-mp').addEventListener('submit', (e) => {
            e.preventDefault();
            this.registrarIngresoMP();
        });

        // Formulario ventas mostrador
        document.getElementById('form-venta-mostrador').addEventListener('submit', (e) => {
            e.preventDefault();
            this.registrarVentaMostrador();
        });

        // Formulario pagos proveedores
        document.getElementById('form-pago-proveedor').addEventListener('submit', (e) => {
            e.preventDefault();
            this.registrarPagoProveedor();
        });

        // Formulario pagos efectivo
        document.getElementById('form-pago-efectivo').addEventListener('submit', (e) => {
            e.preventDefault();
            this.registrarPagoEfectivo();
        });

        // Estado de pago - mostrar/ocultar fecha vencimiento
        document.getElementById('prov-estado').addEventListener('change', (e) => {
            const fechaGroup = document.getElementById('fecha-vencimiento-group');
            if (e.target.value === 'Pendiente' || e.target.value === 'Vencido') {
                fechaGroup.style.display = 'block';
                document.getElementById('prov-vencimiento').required = true;
            } else {
                fechaGroup.style.display = 'none';
                document.getElementById('prov-vencimiento').required = false;
            }
        });

        // Método de pago mostrador - mostrar/ocultar monto mixto
        document.getElementById('most-metodo-pago').addEventListener('change', (e) => {
            const montoMixtoGroup = document.getElementById('monto-mixto-group');
            if (e.target.value === 'Mixto') {
                montoMixtoGroup.style.display = 'block';
                document.getElementById('most-monto-efectivo').required = true;
            } else {
                montoMixtoGroup.style.display = 'none';
                document.getElementById('most-monto-efectivo').required = false;
            }
        });

        // Filtros de fecha
        document.getElementById('btn-aplicar-filtros').addEventListener('click', () => {
            this.aplicarFiltrosFecha();
        });

        document.getElementById('btn-limpiar-filtros').addEventListener('click', () => {
            this.limpiarFiltros();
        });

        document.getElementById('periodo-rapido').addEventListener('change', (e) => {
            this.aplicarPeriodoRapido(e.target.value);
        });

        // Botones de acción
        document.getElementById('btn-exportar-excel').addEventListener('click', () => {
            this.exportarExcel();
        });

        document.getElementById('btn-backup').addEventListener('click', () => {
            this.realizarBackupCompleto();
        });

        document.getElementById('btn-importar').addEventListener('click', () => {
            this.importarDatos();
        });

        document.getElementById('btn-importar').addEventListener('click', () => {
            document.getElementById('input-importar').click();
        });

        document.getElementById('input-importar').addEventListener('change', (e) => {
            this.importarDatos(e.target.files[0]);
        });

        document.getElementById('btn-limpiar-todo').addEventListener('click', () => {
            this.limpiarTodo();
        });

        // Botones de lista
        document.querySelectorAll('.btn-ver-todos').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.verTodos(e.target.dataset.tipo);
            });
        });

        document.querySelector('.btn-solo-pendientes').addEventListener('click', () => {
            this.verSoloPendientes();
        });
    }

    configurarFechasIniciales() {
        const hoy = new Date();
        const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        
        document.getElementById('fecha-desde').value = this.formatearFechaInput(primerDiaMes);
        document.getElementById('fecha-hasta').value = this.formatearFechaInput(hoy);
    }

    registrarIngresoMP() {
        const descripcion = document.getElementById('mp-descripcion').value.trim();
        const monto = parseFloat(document.getElementById('mp-monto').value);
        const comision = parseFloat(document.getElementById('mp-comision').value) || 0;
        const categoria = document.getElementById('mp-categoria').value;
        const cliente = document.getElementById('mp-cliente').value.trim();

        if (!descripcion || !monto || !categoria) {
            this.mostrarNotificacion('Por favor, completa todos los campos obligatorios', 'error');
            return;
        }

        if (monto <= 0) {
            this.mostrarNotificacion('El monto debe ser mayor a 0', 'error');
            return;
        }

        const nuevoIngreso = {
            id: Date.now(),
            descripcion,
            monto,
            comision,
            montoNeto: monto - comision,
            categoria,
            cliente: cliente || 'Cliente no especificado',
            fecha: new Date().toISOString(),
            tipo: 'ingreso-mp'
        };

        this.ingresosMP.push(nuevoIngreso);
        this.guardarDatos('ingresosMP', this.ingresosMP);
        this.actualizarInterfaz();
        this.limpiarFormulario('form-ingreso-mp');
        
        this.mostrarNotificacion('Ingreso de Mercado Pago registrado correctamente', 'success');
    }

    registrarVentaMostrador() {
        const descripcion = document.getElementById('most-descripcion').value.trim();
        const monto = parseFloat(document.getElementById('most-monto').value);
        const metodoPago = document.getElementById('most-metodo-pago').value;
        const categoria = document.getElementById('most-categoria').value;
        const cliente = document.getElementById('most-cliente').value.trim();
        const montoEfectivo = parseFloat(document.getElementById('most-monto-efectivo').value) || 0;

        if (!descripcion || !monto || !metodoPago || !categoria) {
            this.mostrarNotificacion('Por favor, completa todos los campos obligatorios', 'error');
            return;
        }

        if (monto <= 0) {
            this.mostrarNotificacion('El monto debe ser mayor a 0', 'error');
            return;
        }

        if (metodoPago === 'Mixto' && (montoEfectivo <= 0 || montoEfectivo >= monto)) {
            this.mostrarNotificacion('El monto en efectivo debe ser mayor a 0 y menor al total', 'error');
            return;
        }

        const nuevaVenta = {
            id: Date.now(),
            descripcion,
            monto,
            metodoPago,
            montoEfectivo: metodoPago === 'Mixto' ? montoEfectivo : (metodoPago === 'Efectivo' ? monto : 0),
            montoTarjeta: metodoPago === 'Mixto' ? (monto - montoEfectivo) : (metodoPago !== 'Efectivo' ? monto : 0),
            categoria,
            cliente: cliente || 'Cliente no especificado',
            fecha: new Date().toISOString(),
            tipo: 'venta-mostrador'
        };

        this.ventasMostrador.push(nuevaVenta);
        this.guardarDatos('ventasMostrador', this.ventasMostrador);
        this.actualizarInterfaz();
        this.limpiarFormulario('form-venta-mostrador');
        
        this.mostrarNotificacion('Venta de mostrador registrada correctamente', 'success');
    }

    registrarPagoProveedor() {
        const nombre = document.getElementById('prov-nombre').value.trim();
        const concepto = document.getElementById('prov-concepto').value.trim();
        const monto = parseFloat(document.getElementById('prov-monto').value);
        const metodo = document.getElementById('prov-metodo').value;
        const categoria = document.getElementById('prov-categoria').value;
        const estado = document.getElementById('prov-estado').value;
        const vencimiento = document.getElementById('prov-vencimiento').value;

        if (!nombre || !concepto || !monto || !metodo || !categoria || !estado) {
            this.mostrarNotificacion('Por favor, completa todos los campos obligatorios', 'error');
            return;
        }

        if (monto <= 0) {
            this.mostrarNotificacion('El monto debe ser mayor a 0', 'error');
            return;
        }

        if ((estado === 'Pendiente' || estado === 'Vencido') && !vencimiento) {
            this.mostrarNotificacion('Debe especificar la fecha de vencimiento para pagos pendientes', 'error');
            return;
        }

        const nuevoPago = {
            id: Date.now(),
            proveedor: nombre,
            concepto,
            monto,
            metodo,
            categoria,
            estado,
            fechaVencimiento: vencimiento || null,
            fecha: new Date().toISOString(),
            tipo: 'pago-proveedor'
        };

        this.pagosProveedores.push(nuevoPago);
        
        // Agregar proveedor a la lista de recurrentes si no existe
        if (!this.proveedoresRecurrentes.includes(nombre)) {
            this.proveedoresRecurrentes.push(nombre);
            this.guardarDatos('proveedoresRecurrentes', this.proveedoresRecurrentes);
            this.llenarProveedoresRecurrentes();
        }

        this.guardarDatos('pagosProveedores', this.pagosProveedores);
        this.actualizarInterfaz();
        this.limpiarFormulario('form-pago-proveedor');
        
        this.mostrarNotificacion('Pago a proveedor registrado correctamente', 'success');
    }

    registrarPagoEfectivo() {
        const proveedor = document.getElementById('efec-proveedor').value.trim();
        const concepto = document.getElementById('efec-concepto').value.trim();
        const monto = parseFloat(document.getElementById('efec-monto').value);
        const categoria = document.getElementById('efec-categoria').value;
        const recibidoPor = document.getElementById('efec-recibido-por').value.trim();
        const comprobante = document.getElementById('efec-comprobante').value.trim();
        const notas = document.getElementById('efec-notas').value.trim();

        if (!proveedor || !concepto || !monto || !categoria) {
            this.mostrarNotificacion('Por favor, completa todos los campos obligatorios', 'error');
            return;
        }

        if (monto <= 0) {
            this.mostrarNotificacion('El monto debe ser mayor a 0', 'error');
            return;
        }

        const nuevoPagoEfectivo = {
            id: Date.now(),
            proveedor,
            concepto,
            monto,
            categoria,
            recibidoPor: recibidoPor || 'No especificado',
            comprobante: comprobante || 'Sin comprobante',
            notas: notas || '',
            fecha: new Date().toISOString(),
            tipo: 'pago-efectivo'
        };

        this.pagosEfectivo.push(nuevoPagoEfectivo);
        
        // Agregar proveedor a la lista de recurrentes si no existe
        if (!this.proveedoresRecurrentes.includes(proveedor)) {
            this.proveedoresRecurrentes.push(proveedor);
            this.guardarDatos('proveedoresRecurrentes', this.proveedoresRecurrentes);
            this.llenarProveedoresRecurrentes();
        }

        this.guardarDatos('pagosEfectivo', this.pagosEfectivo);
        this.actualizarInterfaz();
        this.limpiarFormulario('form-pago-efectivo');
        
        this.mostrarNotificacion('Pago en efectivo registrado correctamente', 'success');
    }

    eliminarTransaccion(id, tipo) {
        if (!confirm('¿Estás seguro de que quieres eliminar esta transacción?')) {
            return;
        }

        if (tipo === 'ingreso-mp') {
            this.ingresosMP = this.ingresosMP.filter(item => item.id !== id);
            this.guardarDatos('ingresosMP', this.ingresosMP);
        } else if (tipo === 'venta-mostrador') {
            this.ventasMostrador = this.ventasMostrador.filter(item => item.id !== id);
            this.guardarDatos('ventasMostrador', this.ventasMostrador);
        } else if (tipo === 'pago-proveedor') {
            this.pagosProveedores = this.pagosProveedores.filter(item => item.id !== id);
            this.guardarDatos('pagosProveedores', this.pagosProveedores);
        } else if (tipo === 'pago-efectivo') {
            this.pagosEfectivo = this.pagosEfectivo.filter(item => item.id !== id);
            this.guardarDatos('pagosEfectivo', this.pagosEfectivo);
        }

        this.actualizarInterfaz();
        this.mostrarNotificacion('Transacción eliminada correctamente', 'info');
    }

    aplicarFiltrosFecha() {
        const fechaDesde = document.getElementById('fecha-desde').value;
        const fechaHasta = document.getElementById('fecha-hasta').value;

        if (fechaDesde && fechaHasta && new Date(fechaDesde) > new Date(fechaHasta)) {
            this.mostrarNotificacion('La fecha "desde" no puede ser mayor que la fecha "hasta"', 'error');
            return;
        }

        this.filtroActual.fechaDesde = fechaDesde ? new Date(fechaDesde) : null;
        this.filtroActual.fechaHasta = fechaHasta ? new Date(fechaHasta + 'T23:59:59') : null;

        this.actualizarInterfaz();
        this.mostrarNotificacion('Filtros aplicados correctamente', 'info');
    }

    aplicarPeriodoRapido(periodo) {
        const hoy = new Date();
        let fechaDesde, fechaHasta;

        switch (periodo) {
            case 'hoy':
                fechaDesde = fechaHasta = hoy;
                break;
            case 'ayer':
                const ayer = new Date(hoy);
                ayer.setDate(ayer.getDate() - 1);
                fechaDesde = fechaHasta = ayer;
                break;
            case 'semana':
                const inicioSemana = new Date(hoy);
                inicioSemana.setDate(hoy.getDate() - hoy.getDay());
                fechaDesde = inicioSemana;
                fechaHasta = hoy;
                break;
            case 'mes':
                fechaDesde = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
                fechaHasta = hoy;
                break;
            case 'mes-anterior':
                fechaDesde = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
                fechaHasta = new Date(hoy.getFullYear(), hoy.getMonth(), 0);
                break;
            default:
                return;
        }

        document.getElementById('fecha-desde').value = this.formatearFechaInput(fechaDesde);
        document.getElementById('fecha-hasta').value = this.formatearFechaInput(fechaHasta);
        
        this.aplicarFiltrosFecha();
    }

    limpiarFiltros() {
        document.getElementById('fecha-desde').value = '';
        document.getElementById('fecha-hasta').value = '';
        document.getElementById('periodo-rapido').value = '';
        
        this.filtroActual = {
            fechaDesde: null,
            fechaHasta: null,
            tipo: 'todas'
        };

        this.actualizarInterfaz();
        this.mostrarNotificacion('Filtros limpiados', 'info');
    }

    actualizarInterfaz() {
        this.actualizarDashboard();
        this.mostrarIngresosMP();
        this.mostrarVentasMostrador();
        this.mostrarPagosProveedores();
        this.mostrarPagosEfectivo();
        this.actualizarReportes();
    }

    actualizarDashboard() {
        const ingresosMP = this.obtenerDatosFiltrados(this.ingresosMP);
        const ventasMostrador = this.obtenerDatosFiltrados(this.ventasMostrador);
        const pagosProveedores = this.obtenerDatosFiltrados(this.pagosProveedores);
        const pagosEfectivo = this.obtenerDatosFiltrados(this.pagosEfectivo);

        // Calcular totales
        const totalIngresosMP = ingresosMP.reduce((total, item) => total + item.montoNeto, 0);
        const totalVentasMostrador = ventasMostrador.reduce((total, item) => total + item.monto, 0);
        const totalPagosProveedores = pagosProveedores.reduce((total, item) => total + item.monto, 0);
        const totalPagosEfectivo = pagosEfectivo.reduce((total, item) => total + item.monto, 0);
        const flujoCaja = (totalIngresosMP + totalVentasMostrador) - (totalPagosProveedores + totalPagosEfectivo);

        // Pagos pendientes
        const pagosPendientes = this.pagosProveedores.filter(pago => 
            pago.estado === 'Pendiente' || pago.estado === 'Vencido'
        );
        const totalPendientes = pagosPendientes.reduce((total, pago) => total + pago.monto, 0);

        // Actualizar DOM
        document.getElementById('total-ingresos-mp').textContent = this.formatearMoneda(totalIngresosMP);
        document.getElementById('contador-ingresos-mp').textContent = `${ingresosMP.length} transacciones`;

        document.getElementById('total-ventas-mostrador').textContent = this.formatearMoneda(totalVentasMostrador);
        document.getElementById('contador-ventas-mostrador').textContent = `${ventasMostrador.length} ventas`;

        document.getElementById('total-pagos-proveedores').textContent = this.formatearMoneda(totalPagosProveedores);
        document.getElementById('contador-pagos-proveedores').textContent = `${pagosProveedores.length} pagos`;

        document.getElementById('total-pagos-efectivo').textContent = this.formatearMoneda(totalPagosEfectivo);
        document.getElementById('contador-pagos-efectivo').textContent = `${pagosEfectivo.length} pagos`;

        document.getElementById('flujo-caja-neto').textContent = this.formatearMoneda(flujoCaja);
        document.getElementById('estado-flujo').textContent = flujoCaja >= 0 ? 'Positivo' : 'Negativo';

        document.getElementById('total-pendientes').textContent = this.formatearMoneda(totalPendientes);
        document.getElementById('contador-pendientes').textContent = `${pagosPendientes.length} facturas`;

        // Cambiar colores según el estado
        const flujoCajaElement = document.getElementById('flujo-caja-neto');
        flujoCajaElement.style.color = flujoCaja >= 0 ? '#059669' : '#dc2626';
    }

    mostrarIngresosMP(limite = 5) {
        const container = document.getElementById('lista-ingresos-mp');
        let ingresos = this.obtenerDatosFiltrados(this.ingresosMP);
        
        // Ordenar por fecha (más recientes primero)
        ingresos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
        
        if (limite > 0) {
            ingresos = ingresos.slice(0, limite);
        }

        if (ingresos.length === 0) {
            container.innerHTML = '<p class="sin-datos">No hay ingresos de Mercado Pago para mostrar</p>';
            return;
        }

        const html = ingresos.map(ingreso => `
            <div class="transaccion-item">
                <div class="transaccion-info">
                    <div class="transaccion-titulo">${ingreso.descripcion}</div>
                    <div class="transaccion-subtitulo">${ingreso.cliente}</div>
                    <div class="transaccion-detalles">
                        <span class="detalle-tag">${ingreso.categoria}</span>
                        <span class="detalle-tag">${this.formatearFecha(ingreso.fecha)}</span>
                        ${ingreso.comision > 0 ? `<span class="detalle-tag">Comisión: ${this.formatearMoneda(ingreso.comision)}</span>` : ''}
                    </div>
                </div>
                <div class="transaccion-monto ingreso-mp">
                    +${this.formatearMoneda(ingreso.montoNeto)}
                </div>
                <button class="btn-eliminar" onclick="controlFerreteria.eliminarTransaccion(${ingreso.id}, 'ingreso-mp')">
                    🗑️
                </button>
            </div>
        `).join('');

        container.innerHTML = html;
    }

    mostrarVentasMostrador(limite = 5) {
        const container = document.getElementById('lista-ventas-mostrador');
        let ventas = this.obtenerDatosFiltrados(this.ventasMostrador);
        
        // Ordenar por fecha (más recientes primero)
        ventas.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
        
        if (limite > 0) {
            ventas = ventas.slice(0, limite);
        }

        if (ventas.length === 0) {
            container.innerHTML = '<p class="sin-datos">No hay ventas de mostrador para mostrar</p>';
            return;
        }

        const html = ventas.map(venta => `
            <div class="transaccion-item">
                <div class="transaccion-info">
                    <div class="transaccion-titulo">${venta.descripcion}</div>
                    <div class="transaccion-subtitulo">${venta.cliente}</div>
                    <div class="transaccion-detalles">
                        <span class="detalle-tag">${venta.categoria}</span>
                        <span class="detalle-tag">${venta.metodoPago}</span>
                        <span class="detalle-tag">${this.formatearFecha(venta.fecha)}</span>
                        ${venta.metodoPago === 'Mixto' ? `<span class="detalle-tag">Efectivo: ${this.formatearMoneda(venta.montoEfectivo)}</span>` : ''}
                        ${venta.metodoPago === 'Mixto' ? `<span class="detalle-tag">Tarjeta: ${this.formatearMoneda(venta.montoTarjeta)}</span>` : ''}
                    </div>
                </div>
                <div class="transaccion-monto venta-mostrador">
                    +${this.formatearMoneda(venta.monto)}
                </div>
                <button class="btn-eliminar" onclick="controlFerreteria.eliminarTransaccion(${venta.id}, 'venta-mostrador')">
                    🗑️
                </button>
            </div>
        `).join('');

        container.innerHTML = html;
    }

    mostrarPagosProveedores(limite = 5, soloPendientes = false) {
        const container = document.getElementById('lista-pagos-proveedores');
        let pagos = this.obtenerDatosFiltrados(this.pagosProveedores);
        
        if (soloPendientes) {
            pagos = pagos.filter(pago => pago.estado === 'Pendiente' || pago.estado === 'Vencido');
        }
        
        // Ordenar por fecha (más recientes primero)
        pagos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
        
        if (limite > 0) {
            pagos = pagos.slice(0, limite);
        }

        if (pagos.length === 0) {
            const mensaje = soloPendientes ? 'No hay pagos pendientes' : 'No hay pagos a proveedores para mostrar';
            container.innerHTML = `<p class="sin-datos">${mensaje}</p>`;
            return;
        }

        const html = pagos.map(pago => `
            <div class="transaccion-item">
                <div class="transaccion-info">
                    <div class="transaccion-titulo">${pago.proveedor}</div>
                    <div class="transaccion-subtitulo">${pago.concepto}</div>
                    <div class="transaccion-detalles">
                        <span class="detalle-tag">${pago.categoria}</span>
                        <span class="detalle-tag">${pago.metodo}</span>
                        <span class="detalle-tag estado-${pago.estado.toLowerCase()}">${pago.estado}</span>
                        <span class="detalle-tag">${this.formatearFecha(pago.fecha)}</span>
                        ${pago.fechaVencimiento ? `<span class="detalle-tag">Vence: ${this.formatearFecha(pago.fechaVencimiento)}</span>` : ''}
                    </div>
                </div>
                <div class="transaccion-monto pago-proveedor">
                    -${this.formatearMoneda(pago.monto)}
                </div>
                <button class="btn-eliminar" onclick="controlFerreteria.eliminarTransaccion(${pago.id}, 'pago-proveedor')">
                    🗑️
                </button>
            </div>
        `).join('');

        container.innerHTML = html;
    }

    mostrarPagosEfectivo(limite = 5) {
        const container = document.getElementById('lista-pagos-efectivo');
        let pagos = this.obtenerDatosFiltrados(this.pagosEfectivo);
        
        // Ordenar por fecha (más recientes primero)
        pagos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
        
        if (limite > 0) {
            pagos = pagos.slice(0, limite);
        }

        if (pagos.length === 0) {
            container.innerHTML = '<p class="sin-datos">No hay pagos en efectivo para mostrar</p>';
            return;
        }

        const html = pagos.map(pago => `
            <div class="transaccion-item">
                <div class="transaccion-info">
                    <div class="transaccion-titulo">${pago.proveedor}</div>
                    <div class="transaccion-subtitulo">${pago.concepto}</div>
                    <div class="transaccion-detalles">
                        <span class="detalle-tag">${pago.categoria}</span>
                        <span class="detalle-tag">Recibido: ${pago.recibidoPor}</span>
                        <span class="detalle-tag">${this.formatearFecha(pago.fecha)}</span>
                        ${pago.comprobante !== 'Sin comprobante' ? `<span class="detalle-tag">${pago.comprobante}</span>` : ''}
                        ${pago.notas ? `<span class="detalle-tag">Nota: ${pago.notas.substring(0, 30)}${pago.notas.length > 30 ? '...' : ''}</span>` : ''}
                    </div>
                </div>
                <div class="transaccion-monto pago-efectivo">
                    -${this.formatearMoneda(pago.monto)}
                </div>
                <button class="btn-eliminar" onclick="controlFerreteria.eliminarTransaccion(${pago.id}, 'pago-efectivo')">
                    🗑️
                </button>
            </div>
        `).join('');

        container.innerHTML = html;
    }

    actualizarReportes() {
        this.mostrarTopProveedores();
        this.mostrarCategoriasVendidas();
        this.mostrarRendimientoMensual();
    }

    mostrarTopProveedores() {
        const container = document.getElementById('top-proveedores');
        const pagos = this.obtenerDatosFiltrados(this.pagosProveedores);

        if (pagos.length === 0) {
            container.innerHTML = '<p class="sin-datos">No hay datos suficientes</p>';
            return;
        }

        // Agrupar por proveedor
        const proveedores = {};
        pagos.forEach(pago => {
            if (!proveedores[pago.proveedor]) {
                proveedores[pago.proveedor] = 0;
            }
            proveedores[pago.proveedor] += pago.monto;
        });

        // Ordenar por monto (mayor a menor) y tomar los top 5
        const topProveedores = Object.entries(proveedores)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5);

        const html = topProveedores.map(([proveedor, monto]) => `
            <div class="reporte-linea">
                <span class="reporte-nombre">${proveedor}</span>
                <span class="reporte-valor">${this.formatearMoneda(monto)}</span>
            </div>
        `).join('');

        container.innerHTML = html;
    }

    mostrarCategoriasVendidas() {
        const container = document.getElementById('categorias-vendidas');
        const ingresos = this.obtenerDatosFiltrados(this.ingresosMP);

        if (ingresos.length === 0) {
            container.innerHTML = '<p class="sin-datos">No hay datos suficientes</p>';
            return;
        }

        // Agrupar por categoría
        const categorias = {};
        ingresos.forEach(ingreso => {
            if (!categorias[ingreso.categoria]) {
                categorias[ingreso.categoria] = 0;
            }
            categorias[ingreso.categoria] += ingreso.montoNeto;
        });

        // Ordenar por monto (mayor a menor) y tomar las top 5
        const topCategorias = Object.entries(categorias)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5);

        const html = topCategorias.map(([categoria, monto]) => `
            <div class="reporte-linea">
                <span class="reporte-nombre">${categoria}</span>
                <span class="reporte-valor">${this.formatearMoneda(monto)}</span>
            </div>
        `).join('');

        container.innerHTML = html;
    }

    mostrarRendimientoMensual() {
        const container = document.getElementById('rendimiento-mensual');
        const ingresos = this.obtenerDatosFiltrados(this.ingresosMP);
        const pagos = this.obtenerDatosFiltrados(this.pagosProveedores);

        if (ingresos.length === 0 && pagos.length === 0) {
            container.innerHTML = '<p class="sin-datos">No hay datos suficientes</p>';
            return;
        }

        const totalIngresos = ingresos.reduce((total, item) => total + item.montoNeto, 0);
        const totalPagos = pagos.reduce((total, item) => total + item.monto, 0);
        const rendimiento = totalIngresos - totalPagos;
        const margen = totalIngresos > 0 ? ((rendimiento / totalIngresos) * 100).toFixed(1) : 0;

        const html = `
            <div class="reporte-linea">
                <span class="reporte-nombre">Ingresos Brutos</span>
                <span class="reporte-valor">${this.formatearMoneda(totalIngresos)}</span>
            </div>
            <div class="reporte-linea">
                <span class="reporte-nombre">Gastos Totales</span>
                <span class="reporte-valor">${this.formatearMoneda(totalPagos)}</span>
            </div>
            <div class="reporte-linea">
                <span class="reporte-nombre">Rendimiento Neto</span>
                <span class="reporte-valor" style="color: ${rendimiento >= 0 ? '#059669' : '#dc2626'}">
                    ${this.formatearMoneda(rendimiento)}
                </span>
            </div>
            <div class="reporte-linea">
                <span class="reporte-nombre">Margen (%)</span>
                <span class="reporte-valor" style="color: ${rendimiento >= 0 ? '#059669' : '#dc2626'}">
                    ${margen}%
                </span>
            </div>
        `;

        container.innerHTML = html;
    }

    verTodos(tipo) {
        if (tipo === 'mp') {
            this.mostrarIngresosMP(0);
        } else if (tipo === 'mostrador') {
            this.mostrarVentasMostrador(0);
        } else if (tipo === 'proveedores') {
            this.mostrarPagosProveedores(0, false);
        } else if (tipo === 'efectivo') {
            this.mostrarPagosEfectivo(0);
        }
    }

    verSoloPendientes() {
        this.mostrarPagosProveedores(0, true);
    }

    obtenerDatosFiltrados(datos) {
        return datos.filter(item => {
            const fechaItem = new Date(item.fecha);
            
            if (this.filtroActual.fechaDesde && fechaItem < this.filtroActual.fechaDesde) {
                return false;
            }
            
            if (this.filtroActual.fechaHasta && fechaItem > this.filtroActual.fechaHasta) {
                return false;
            }
            
            return true;
        });
    }

    llenarProveedoresRecurrentes() {
        const datalist = document.getElementById('proveedores-list');
        datalist.innerHTML = this.proveedoresRecurrentes.map(proveedor => 
            `<option value="${proveedor}">`
        ).join('');
    }

    exportarExcel() {
        const datos = {
            fechaExportacion: new Date().toISOString(),
            filtros: this.filtroActual,
            ingresosMP: this.obtenerDatosFiltrados(this.ingresosMP),
            pagosProveedores: this.obtenerDatosFiltrados(this.pagosProveedores),
            resumen: {
                totalIngresosMP: this.obtenerDatosFiltrados(this.ingresosMP).reduce((total, item) => total + item.montoNeto, 0),
                totalPagosProveedores: this.obtenerDatosFiltrados(this.pagosProveedores).reduce((total, item) => total + item.monto, 0)
            }
        };

        const dataStr = JSON.stringify(datos, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `ferreteria-datos-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        this.mostrarNotificacion('Datos exportados correctamente', 'success');
    }

    realizarBackup() {
        const backup = {
            fechaBackup: new Date().toISOString(),
            version: '1.0',
            datos: {
                ingresosMP: this.ingresosMP,
                pagosProveedores: this.pagosProveedores,
                proveedoresRecurrentes: this.proveedoresRecurrentes
            }
        };

        const dataStr = JSON.stringify(backup, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `ferreteria-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        this.mostrarNotificacion('Backup realizado correctamente', 'success');
    }

    importarDatos(archivo) {
        if (!archivo) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const datos = JSON.parse(e.target.result);
                
                if (datos.datos) {
                    // Es un backup completo
                    if (confirm('¿Quieres reemplazar todos los datos actuales con el backup?')) {
                        this.ingresosMP = datos.datos.ingresosMP || [];
                        this.pagosProveedores = datos.datos.pagosProveedores || [];
                        this.proveedoresRecurrentes = datos.datos.proveedoresRecurrentes || [];
                        
                        this.guardarTodos();
                        this.actualizarInterfaz();
                        this.llenarProveedoresRecurrentes();
                        
                        this.mostrarNotificacion('Datos importados correctamente', 'success');
                    }
                } else {
                    this.mostrarNotificacion('Formato de archivo no válido', 'error');
                }
            } catch (error) {
                this.mostrarNotificacion('Error al leer el archivo', 'error');
            }
        };
        reader.readAsText(archivo);
    }

    limpiarTodo() {
        if (confirm('¿Estás seguro de que quieres eliminar TODOS los datos? Esta acción no se puede deshacer.')) {
            if (confirm('Esta acción eliminará permanentemente todos los ingresos, pagos y proveedores. ¿Continuar?')) {
                this.ingresosMP = [];
                this.ventasMostrador = [];
                this.pagosProveedores = [];
                this.pagosEfectivo = [];
                this.proveedoresRecurrentes = [];
                
                this.guardarTodos();
                this.actualizarInterfaz();
                this.llenarProveedoresRecurrentes();
                
                this.mostrarNotificacion('Todos los datos han sido eliminados', 'info');
            }
        }
    }

    agregarDatosEjemplo() {
        const fechaHoy = new Date();
        const fechaAyer = new Date(fechaHoy);
        fechaAyer.setDate(fechaAyer.getDate() - 1);

        // Ingresos de ejemplo
        this.ingresosMP = [
            {
                id: Date.now() - 3000,
                descripcion: 'Venta de herramientas varias',
                monto: 25000,
                comision: 1250,
                montoNeto: 23750,
                categoria: 'Herramientas manuales',
                cliente: 'Juan Pérez',
                fecha: fechaHoy.toISOString(),
                tipo: 'ingreso-mp'
            },
            {
                id: Date.now() - 2000,
                descripcion: 'Materiales de construcción',
                monto: 45000,
                comision: 2250,
                montoNeto: 42750,
                categoria: 'Materiales construcción',
                cliente: 'Constructora ABC',
                fecha: fechaAyer.toISOString(),
                tipo: 'ingreso-mp'
            }
        ];

        // Pagos de ejemplo
        this.pagosProveedores = [
            {
                id: Date.now() - 1000,
                proveedor: 'Distribuidora López',
                concepto: 'Compra de tornillos y herramientas',
                monto: 18000,
                metodo: 'Transferencia',
                categoria: 'Mercadería',
                estado: 'Pagado',
                fechaVencimiento: null,
                fecha: fechaAyer.toISOString(),
                tipo: 'pago-proveedor'
            }
        ];

        // Proveedores recurrentes
        this.proveedoresRecurrentes = ['Distribuidora López', 'Ferretería Central', 'Materiales del Norte'];

        this.guardarTodos();
        this.llenarProveedoresRecurrentes();
    }

    limpiarFormulario(formId) {
        document.getElementById(formId).reset();
        if (formId === 'form-pago-proveedor') {
            document.getElementById('fecha-vencimiento-group').style.display = 'none';
            document.getElementById('prov-vencimiento').required = false;
        } else if (formId === 'form-venta-mostrador') {
            document.getElementById('monto-mixto-group').style.display = 'none';
            document.getElementById('most-monto-efectivo').required = false;
        }
    }

    cargarDatos(clave) {
        try {
            const datos = localStorage.getItem(`ferreteria_${clave}`);
            if (!datos) {
                console.log(`No se encontraron datos para ${clave}, iniciando con lista vacía`);
                return null;
            }
            
            const datosParseados = JSON.parse(datos);
            
            // Validar que los datos sean un array
            if (!Array.isArray(datosParseados)) {
                console.warn(`Datos corruptos detectados para ${clave}, reiniciando...`);
                this.mostrarNotificacion(`Se detectaron datos corruptos en ${clave}. Reiniciando.`, 'error');
                localStorage.removeItem(`ferreteria_${clave}`);
                return null;
            }
            
            console.log(`Cargados ${datosParseados.length} registros de ${clave}`);
            return datosParseados;
        } catch (error) {
            console.error(`Error al cargar datos de ${clave}:`, error);
            this.mostrarNotificacion(`Error al cargar ${clave}. Iniciando con datos vacíos.`, 'error');
            localStorage.removeItem(`ferreteria_${clave}`);
            return null;
        }
    }

    guardarDatos(clave, datos) {
        try {
            const datosParaGuardar = JSON.stringify(datos);
            
            // Verificar si hay espacio suficiente
            if (datosParaGuardar.length > 5000000) { // 5MB límite aproximado
                throw new Error('Los datos son demasiado grandes para localStorage');
            }
            
            localStorage.setItem(`ferreteria_${clave}`, datosParaGuardar);
            
            // Verificar que se guardó correctamente
            const verificacion = localStorage.getItem(`ferreteria_${clave}`);
            if (verificacion !== datosParaGuardar) {
                throw new Error('Error en la verificación de guardado');
            }
            
            console.log(`Datos de ${clave} guardados correctamente: ${datos.length} registros`);
            
        } catch (error) {
            console.error(`Error al guardar datos de ${clave}:`, error);
            this.mostrarNotificacion(`Error al guardar ${clave}. Verifica el espacio del navegador.`, 'error');
            
            // Intentar crear backup de emergencia
            this.crearBackupEmergencia();
        }
    }

    guardarTodos() {
        this.guardarDatos('ingresosMP', this.ingresosMP);
        this.guardarDatos('ventasMostrador', this.ventasMostrador);
        this.guardarDatos('pagosProveedores', this.pagosProveedores);
        this.guardarDatos('pagosEfectivo', this.pagosEfectivo);
        this.guardarDatos('proveedoresRecurrentes', this.proveedoresRecurrentes);
        
        // Actualizar indicador de último guardado
        localStorage.setItem('ferreteria_ultimoGuardado', new Date().toISOString());
        this.actualizarIndicadorGuardado();
    }

    // ====== SISTEMA DE BACKUP Y SINCRONIZACIÓN ======
    
    configurarBackupAutomatico() {
        // Backup automático cada 10 minutos
        setInterval(() => {
            if (this.tieneRegistros()) {
                this.crearBackupEmergencia();
            }
        }, 600000); // 10 minutos
        
        // También crear backup al salir de la página
        window.addEventListener('beforeunload', () => {
            if (this.tieneRegistros()) {
                this.crearBackupEmergencia();
            }
        });
    }

    tieneRegistros() {
        return this.ingresosMP.length > 0 || 
               this.ventasMostrador.length > 0 || 
               this.pagosProveedores.length > 0 || 
               this.pagosEfectivo.length > 0;
    }

    crearBackupEmergencia() {
        try {
            const backup = {
                timestamp: new Date().toISOString(),
                version: '2.0',
                datos: {
                    ingresosMP: this.ingresosMP,
                    ventasMostrador: this.ventasMostrador,
                    pagosProveedores: this.pagosProveedores,
                    pagosEfectivo: this.pagosEfectivo,
                    proveedoresRecurrentes: this.proveedoresRecurrentes
                },
                resumen: this.calcularResumenCompleto()
            };
            localStorage.setItem('ferreteria_backupEmergencia', JSON.stringify(backup));
            console.log('Backup de emergencia creado:', backup.timestamp);
        } catch (error) {
            console.error('Error al crear backup de emergencia:', error);
        }
    }

    recuperarBackupEmergencia() {
        try {
            const backup = localStorage.getItem('ferreteria_backupEmergencia');
            if (backup) {
                const datos = JSON.parse(backup);
                if (confirm(`Se encontró un backup del ${this.formatearFecha(datos.timestamp)} a las ${new Date(datos.timestamp).toLocaleTimeString()}.\\n¿Quieres recuperar estos datos?`)) {
                    
                    this.ingresosMP = datos.datos.ingresosMP || [];
                    this.ventasMostrador = datos.datos.ventasMostrador || [];
                    this.pagosProveedores = datos.datos.pagosProveedores || [];
                    this.pagosEfectivo = datos.datos.pagosEfectivo || [];
                    this.proveedoresRecurrentes = datos.datos.proveedoresRecurrentes || [];
                    
                    this.guardarTodos();
                    this.actualizarInterfaz();
                    this.llenarProveedoresRecurrentes();
                    this.mostrarNotificacion('Datos recuperados desde backup de emergencia', 'success');
                    return true;
                }
            }
        } catch (error) {
            console.error('Error al recuperar backup de emergencia:', error);
        }
        return false;
    }

    realizarBackupCompleto() {
        try {
            const backup = {
                fecha_exportacion: new Date().toISOString(),
                aplicacion: 'Ferretería Control',
                version: '2.0',
                datos: {
                    ingresosMP: this.ingresosMP,
                    ventasMostrador: this.ventasMostrador,
                    pagosProveedores: this.pagosProveedores,
                    pagosEfectivo: this.pagosEfectivo,
                    proveedoresRecurrentes: this.proveedoresRecurrentes
                },
                resumen: this.calcularResumenCompleto(),
                estadisticas: this.calcularEstadisticas()
            };

            const dataStr = JSON.stringify(backup, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `ferreteria-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            this.mostrarNotificacion('Backup completo exportado correctamente', 'success');
            
            // También crear backup en localStorage
            this.crearBackupEmergencia();
            
        } catch (error) {
            console.error('Error al realizar backup:', error);
            this.mostrarNotificacion('Error al crear backup: ' + error.message, 'error');
        }
    }

    importarDatos() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const datos = JSON.parse(e.target.result);
                    
                    // Verificar estructura del archivo
                    if (!datos.datos) {
                        throw new Error('Formato de archivo no reconocido. Debe ser un backup de Ferretería Control.');
                    }
                    
                    // Validar y contar registros
                    const ingresosValidos = this.validarRegistros(datos.datos.ingresosMP || [], 'ingreso-mp');
                    const ventasValidas = this.validarRegistros(datos.datos.ventasMostrador || [], 'venta-mostrador');
                    const pagosProveedoresValidos = this.validarRegistros(datos.datos.pagosProveedores || [], 'pago-proveedor');
                    const pagosEfectivoValidos = this.validarRegistros(datos.datos.pagosEfectivo || [], 'pago-efectivo');
                    
                    const totalRegistros = ingresosValidos.length + ventasValidas.length + 
                                         pagosProveedoresValidos.length + pagosEfectivoValidos.length;
                    
                    if (totalRegistros === 0) {
                        throw new Error('No se encontraron registros válidos en el archivo');
                    }
                    
                    // Preguntar si reemplazar o agregar
                    const reemplazar = confirm(`Se encontraron ${totalRegistros} registros válidos.\\n\\n¿Quieres REEMPLAZAR todos los datos actuales?\\n\\nCancela para AGREGAR a los datos existentes.`);
                    
                    if (reemplazar) {
                        this.ingresosMP = ingresosValidos;
                        this.ventasMostrador = ventasValidas;
                        this.pagosProveedores = pagosProveedoresValidos;
                        this.pagosEfectivo = pagosEfectivoValidos;
                        this.proveedoresRecurrentes = datos.datos.proveedoresRecurrentes || [];
                    } else {
                        this.ingresosMP = [...this.ingresosMP, ...ingresosValidos];
                        this.ventasMostrador = [...this.ventasMostrador, ...ventasValidas];
                        this.pagosProveedores = [...this.pagosProveedores, ...pagosProveedoresValidos];
                        this.pagosEfectivo = [...this.pagosEfectivo, ...pagosEfectivoValidos];
                        
                        // Agregar proveedores sin duplicar
                        const proveedoresNuevos = datos.datos.proveedoresRecurrentes || [];
                        proveedoresNuevos.forEach(prov => {
                            if (!this.proveedoresRecurrentes.includes(prov)) {
                                this.proveedoresRecurrentes.push(prov);
                            }
                        });
                    }
                    
                    this.guardarTodos();
                    this.actualizarInterfaz();
                    this.llenarProveedoresRecurrentes();
                    this.mostrarNotificacion(`Importados ${totalRegistros} registros correctamente`, 'success');
                    
                } catch (error) {
                    console.error('Error al importar datos:', error);
                    this.mostrarNotificacion(`Error al importar: ${error.message}`, 'error');
                }
            };
            reader.readAsText(file);
        });
        input.click();
    }

    validarRegistros(registros, tipoEsperado) {
        if (!Array.isArray(registros)) return [];
        
        return registros.filter(registro => {
            const esValido = registro && 
                           typeof registro.monto === 'number' && 
                           registro.monto > 0 &&
                           typeof registro.descripcion === 'string' &&
                           registro.descripcion.trim() !== '';
            
            // Asignar ID único si no lo tiene
            if (esValido && !registro.id) {
                registro.id = Date.now() + Math.random();
            }
            
            // Asignar fecha si no la tiene
            if (esValido && !registro.fecha) {
                registro.fecha = new Date().toISOString();
            }
            
            return esValido;
        });
    }

    calcularResumenCompleto() {
        const totalIngresosMP = this.ingresosMP.reduce((sum, item) => sum + item.montoNeto, 0);
        const totalVentasMostrador = this.ventasMostrador.reduce((sum, item) => sum + item.monto, 0);
        const totalPagosProveedores = this.pagosProveedores.reduce((sum, item) => sum + item.monto, 0);
        const totalPagosEfectivo = this.pagosEfectivo.reduce((sum, item) => sum + item.monto, 0);
        
        return {
            totalIngresos: totalIngresosMP + totalVentasMostrador,
            totalEgresos: totalPagosProveedores + totalPagosEfectivo,
            balance: (totalIngresosMP + totalVentasMostrador) - (totalPagosProveedores + totalPagosEfectivo),
            cantidadRegistros: this.ingresosMP.length + this.ventasMostrador.length + 
                             this.pagosProveedores.length + this.pagosEfectivo.length
        };
    }

    calcularEstadisticas() {
        const hoy = new Date();
        const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        
        // Filtrar registros del mes actual
        const registrosDelMes = [...this.ingresosMP, ...this.ventasMostrador, 
                               ...this.pagosProveedores, ...this.pagosEfectivo]
            .filter(reg => new Date(reg.fecha) >= inicioMes);
        
        return {
            registrosEsteMes: registrosDelMes.length,
            promedioRegistrosPorDia: registrosDelMes.length / hoy.getDate(),
            fechaUltimoRegistro: registrosDelMes.length > 0 ? 
                Math.max(...registrosDelMes.map(r => new Date(r.fecha).getTime())) : null
        };
    }

    actualizarIndicadorGuardado() {
        const indicador = document.getElementById('indicador-guardado');
        if (indicador) {
            const ultimoGuardado = localStorage.getItem('ferreteria_ultimoGuardado');
            if (ultimoGuardado) {
                const fecha = new Date(ultimoGuardado);
                indicador.textContent = `Último guardado: ${fecha.toLocaleTimeString()}`;
                indicador.style.color = '#48bb78';
                
                // Mostrar indicador de respaldo si existe
                const backup = localStorage.getItem('ferreteria_backupEmergencia');
                if (backup) {
                    const backupData = JSON.parse(backup);
                    const fechaBackup = new Date(backupData.timestamp);
                    indicador.title = `Backup automático: ${fechaBackup.toLocaleString()}`;
                }
            }
        }
    }

    // ====== FIN SISTEMA DE BACKUP ======

    formatearMoneda(cantidad) {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS'
        }).format(cantidad);
    }

    formatearFecha(fechaISO) {
        const fecha = new Date(fechaISO);
        return fecha.toLocaleDateString('es-AR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    formatearFechaInput(fecha) {
        return fecha.toISOString().split('T')[0];
    }

    mostrarNotificacion(texto, tipo = 'info') {
        const notificacion = document.createElement('div');
        notificacion.className = `notificacion ${tipo}`;
        notificacion.textContent = texto;

        document.body.appendChild(notificacion);

        setTimeout(() => {
            notificacion.style.animation = 'slideInRight 0.3s ease-out reverse';
            setTimeout(() => {
                if (notificacion.parentNode) {
                    notificacion.parentNode.removeChild(notificacion);
                }
            }, 300);
        }, 3000);
    }
}

// Inicializar la aplicación
let controlFerreteria;
document.addEventListener('DOMContentLoaded', () => {
    controlFerreteria = new ControlFerreteria();
});