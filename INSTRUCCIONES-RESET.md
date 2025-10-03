# 🔄 Sistema de Backup y Reset - Control Ferretería

## 📋 Resumen

He implementado un sistema completo de backup y reset que te permite:

1. **Crear backups automáticos** de todos tus datos
2. **Resetear el sistema completamente** (dejarlo en 0)
3. **Exportar e importar backups** como archivos JSON
4. **Gestionar múltiples backups** con fechas y estadísticas

## 🚀 Cómo Usar

### Opción 1: Desde la Página Principal (index.html)

En el footer de la página principal ahora tienes estos botones:

- **💾 Crear Backup**: Crea un backup manual de todos los datos
- **📤 Exportar Backup**: Descarga un archivo JSON con el backup
- **📦 Ver Backups**: Muestra la lista de backups disponibles
- **📥 Importar Datos**: Importa datos desde un archivo JSON
- **🔄 RESET COMPLETO**: Borra TODOS los datos (con backup automático)

### Opción 2: Página Especializada de Reset

Abre el archivo `reset-sistema.html` para una interfaz completa con:

- **Estadísticas actuales** del sistema
- **Gestión avanzada de backups**
- **Reset seguro** con múltiples confirmaciones
- **Verificación de integridad** de los datos

## ⚠️ IMPORTANTE - Reset Completo

Cuando hagas el reset completo:

1. **Se crea un backup automático** antes de borrar nada
2. **Se borran TODOS los datos**:
   - Ingresos de MercadoPago
   - Ventas de mostrador
   - Pagos a proveedores
   - Pagos en efectivo
   - Proveedores recurrentes
   - Productos (si los hay)
   - Movimientos de stock

3. **El sistema queda en estado inicial** (como recién instalado)
4. **Todos los contadores vuelven a 0**

## 🔐 Seguridad

El sistema tiene múltiples capas de seguridad:

- **Doble confirmación** para el reset
- **Backup automático** antes del reset
- **Mantenimiento de hasta 10 backups** automáticamente
- **Validación de integridad** de los datos

## 📁 Archivos Nuevos Creados

1. **`sistema-backup-reset.js`** - Sistema completo de backup y reset
2. **`reset-sistema.html`** - Página especializada para gestión avanzada
3. **Modificaciones en `index.html`** - Botones actualizados en el footer

## 🎯 Pasos para Resetear Ahora

### Método Rápido:
1. Abre `index.html`
2. Haz clic en **"🔄 RESET COMPLETO"** en el footer
3. Confirma dos veces
4. ¡Listo! Sistema en 0

### Método Seguro (Recomendado):
1. Abre `reset-sistema.html`
2. Revisa las estadísticas actuales
3. Crea un backup manual (opcional, pero recomendado)
4. Haz clic en **"🔄 INICIAR RESET COMPLETO"**
5. Confirma dos veces
6. El sistema se resetea y te redirige al inicio

## 💾 Gestión de Backups

Los backups se guardan con esta información:
- **Fecha y hora** de creación
- **Número total de registros**
- **Balance neto** del sistema
- **Tamaño del backup**
- **Todos los datos** en formato JSON

Puedes:
- **Exportar** cualquier backup como archivo
- **Importar** backups desde archivos
- **Ver estadísticas** de cada backup
- **Eliminar** backups antiguos

## 🔧 Restaurar desde Backup

Si necesitas restaurar el sistema desde un backup:

1. Ve a la página `reset-sistema.html`
2. Usa las herramientas de gestión de backups
3. O importa un archivo JSON que hayas exportado previamente

## 📊 ¿Qué Datos se Incluyen?

El sistema hace backup de:
- ✅ Ingresos de MercadoPago
- ✅ Ventas de mostrador
- ✅ Pagos a proveedores (transferencia)
- ✅ Pagos en efectivo
- ✅ Lista de proveedores recurrentes
- ✅ Productos del inventario (si existen)
- ✅ Movimientos de stock (si existen)

## 🎉 ¡Ya Está Listo!

El sistema está completamente funcional. Puedes:

1. **Probar creando un backup** para ver cómo funciona
2. **Hacer el reset cuando estés listo**
3. **Comenzar desde cero** con un sistema limpio

¿Quieres que proceda con el reset ahora o prefieres probarlo primero?