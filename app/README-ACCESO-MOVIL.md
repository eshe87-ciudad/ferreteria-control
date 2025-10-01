# 📱 Guía de Acceso Móvil - Ferretería Control

## 🚀 Cómo acceder desde cualquier dispositivo

### Opción 1: Servidor Local en Red (Recomendado)

1. **En tu PC principal** (donde está la aplicación):
   ```bash
   # Abrir PowerShell en la carpeta ferreteria-control
   cd "C:\Users\ezequiel_centeno\Desktop\NOTEPAD\ferreteria-control"
   
   # Iniciar servidor en red local
   python -m http.server 8080 --bind 0.0.0.0
   ```

2. **Encontrar tu IP local**:
   ```bash
   ipconfig
   # Buscar "Dirección IPv4" (ej: 192.168.1.100)
   ```

3. **Desde cualquier dispositivo en la misma red WiFi**:
   - Abrir navegador
   - Ir a: `http://TU_IP:8080`
   - Ejemplo: `http://192.168.1.100:8080`

### Opción 2: GitHub Pages (Público)

1. **Subir archivos a GitHub**:
   - Crear repositorio público
   - Subir todos los archivos HTML, CSS y JS
   - Activar GitHub Pages en configuración

2. **Acceso desde cualquier lugar**:
   - URL será: `https://tu-usuario.github.io/nombre-repo`

### Opción 3: Servicios de Hosting Gratuito

**Netlify** (Recomendado):
1. Ir a [netlify.com](https://netlify.com)
2. Arrastrar carpeta completa del proyecto
3. Obtener URL única para acceso mundial

**Vercel**:
1. Ir a [vercel.com](https://vercel.com)
2. Conectar con GitHub o subir archivos
3. Deploy automático

## 💾 Sistema de Backup Mejorado

### Funcionalidades Nuevas:

✅ **Backup Automático**:
- Se ejecuta cada 10 minutos automáticamente
- Backup al cerrar la aplicación
- Recuperación automática si no hay datos

✅ **Exportación Completa**:
- Archivo JSON con todos los datos
- Incluye estadísticas y resumen
- Compatible con importación

✅ **Importación de Datos**:
- Botón "📥 Importar Datos"
- Opción de reemplazar o agregar datos
- Validación automática de archivos

✅ **Indicador de Estado**:
- Muestra última vez que se guardaron datos
- Información de backup automático
- Feedback visual de todas las operaciones

### Cómo Usar el Backup:

1. **Exportar datos**:
   - Clic en "💾 Respaldar Datos"
   - Se descarga archivo JSON automáticamente
   - Guarda el archivo en lugar seguro

2. **Importar datos**:
   - Clic en "📥 Importar Datos"
   - Seleccionar archivo JSON de backup
   - Elegir si reemplazar o agregar datos

3. **Sincronizar entre dispositivos**:
   - Exportar desde dispositivo A
   - Importar en dispositivo B
   - Los datos quedan sincronizados

## 📱 Optimizaciones Móviles

### Mejoras Implementadas:

- **Diseño 100% responsive** para móviles y tablets
- **Botones más grandes** para touch
- **Menús adaptados** a pantallas pequeñas
- **Formularios optimizados** para móvil
- **Notificaciones mejoradas** para pantallas pequeñas

### Navegadores Recomendados:

- **Android**: Chrome, Firefox
- **iOS**: Safari, Chrome
- **Escritorio**: Chrome, Firefox, Edge

## 🔄 Flujo de Trabajo Recomendado

1. **Configuración inicial**:
   - Configurar servidor local o hosting
   - Probar acceso desde móvil
   - Hacer backup inicial

2. **Uso diario**:
   - Los datos se guardan automáticamente
   - Backup automático cada 10 minutos
   - Exportar manualmente al final del día

3. **Sincronización**:
   - Exportar desde dispositivo principal
   - Importar en otros dispositivos cuando sea necesario
   - Siempre mantener un backup externo

## 🛡️ Seguridad y Respaldo

- **Datos locales**: Se guardan en localStorage del navegador
- **Backup automático**: Copia de seguridad cada 10 minutos
- **Exportación manual**: Control total sobre tus datos
- **Sin conexión**: Funciona completamente offline
- **Privacidad**: Tus datos nunca salen de tus dispositivos

## 📞 Soporte

Si tienes problemas:
1. Verificar que todos los dispositivos estén en la misma red WiFi
2. Comprobar que el firewall permita conexiones en puerto 8080
3. Usar la opción de hosting externo para acceso desde cualquier lugar
4. Mantener backups regulares de tus datos

---
*Aplicación Ferretería Control v2.0 - Sistema de Backup y Acceso Móvil Mejorado*