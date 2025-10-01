# 🔧 Control de Ferretería - Firebase Real-time

Sistema completo de control de ingresos y gastos para ferreterías con **sincronización en tiempo real** entre dispositivos.

## 🌟 Características Principales

- **💰 Control de Ingresos y Gastos**: Registro detallado con fechas y conceptos
- **🔄 Sincronización en Tiempo Real**: Los cambios aparecen instantáneamente en todos los dispositivos
- **📱 Multi-dispositivo**: Funciona en PC, móvil y tablet
- **☁️ Backup Automático**: Los datos se guardan en la nube automáticamente
- **🔒 Seguridad**: Autenticación y base de datos protegida
- **📊 Dashboard Visual**: Totales y balance en tiempo real
- **💾 Backup Local**: Funciona sin conexión a internet
- **📥 Importar/Exportar**: Funcionalidad completa de respaldo

## 🚀 Acceso Directo

### **🔥 Versión Firebase (TIEMPO REAL)**

- **URL Principal**: [https://eshe87-ciudad.github.io/ferreteria-control/app/index-firebase.html](https://eshe87-ciudad.github.io/ferreteria-control/app/index-firebase.html)
- **Características**: Sincronización instantánea entre dispositivos

### **💾 Versión Local (BACKUP)**

- **URL Backup**: [https://eshe87-ciudad.github.io/ferreteria-control/app/index.html](https://eshe87-ciudad.github.io/ferreteria-control/app/index.html)
- **Características**: Solo almacenamiento local, sin sincronización

### **🏠 Página Principal**

- **Landing Page**: [https://eshe87-ciudad.github.io/ferreteria-control/](https://eshe87-ciudad.github.io/ferreteria-control/)

## 🔥 CONFIGURACIÓN FIREBASE

### **PASO 1: Crear Proyecto Firebase**

1. Ve a [https://console.firebase.google.com](https://console.firebase.google.com)
2. Clic en "Crear un proyecto"
3. Nombre: `ferreteria-control-[tu-nombre]`
4. Desactivar Google Analytics
5. Crear proyecto

### **PASO 2: Configurar Firestore Database**

1. En el menú → "Firestore Database"
2. "Crear base de datos" → Modo de producción
3. Ubicación: `southamerica-east1 (São Paulo)`

### **PASO 3: Configurar Reglas de Seguridad**

En Firestore → Reglas, pegar:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /ingresos/{document} {
      allow read, write: if request.auth != null;
    }
    match /gastos/{document} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### **PASO 4: Habilitar Authentication**

1. Menu → "Authentication" → "Comenzar"
2. "Sign-in method" → Habilitar "Anónimo"

### **PASO 5: Obtener Configuración**

1. Configuración proyecto → ⚙️ → "Configuración del proyecto"
2. "Tus apps" → "</>" (Web)
3. Alias: `ferreteria-control-web`
4. Copiar la configuración

### **PASO 6: Actualizar Código**

En `app/index-firebase.html`, reemplazar:

```javascript
const firebaseConfig = {
    apiKey: "TEMP_API_KEY",
    // ... con tu configuración real
};
```

## 📂 Estructura del Proyecto

```
ferreteria-github/
├── index.html                     # Landing page
├── README.md                      # Este archivo
└── app/
    ├── index.html                 # Versión local
    ├── index-firebase.html        # Versión Firebase
    ├── script-ferreteria.js       # Lógica local
    ├── script-ferreteria-firebase.js  # Lógica Firebase
    └── styles-ferreteria.css      # Estilos
```

## 💻 Uso del Sistema

### **Agregar Ingresos**

1. Escribir concepto (ej: "Venta de tornillos")
2. Ingresar monto
3. Clic en "Agregar Ingreso"
4. ✨ **Se sincroniza automáticamente en todos los dispositivos**

### **Agregar Gastos**

1. Escribir concepto (ej: "Compra de materiales")
2. Ingresar monto
3. Clic en "Agregar Gasto"
4. ✨ **Se sincroniza automáticamente en todos los dispositivos**

### **Ver en Tiempo Real**

- Abre la aplicación en tu PC
- Abre la misma URL en tu móvil
- Agrega una transacción en uno
- ⚡ **Aparece inmediatamente en el otro**

## 🛠️ Funcionalidades Técnicas

### **Firebase Real-time**

- **Firestore Database**: Base de datos NoSQL en tiempo real
- **Authentication**: Autenticación anónima segura
- **Offline Support**: Funciona sin conexión
- **Multi-device Sync**: Sincronización instantánea

### **Backup y Seguridad**

- **Backup Local**: Cada 5 minutos en localStorage
- **Exportar Datos**: Descarga JSON completo
- **Importar Datos**: Restaurar desde archivo
- **Validación**: Verificación de datos automática

### **Responsive Design**

- **Mobile First**: Optimizado para móviles
- **Touch Friendly**: Botones grandes para pantallas táctiles
- **Adaptable**: Se ajusta a cualquier tamaño de pantalla

## 🔧 Desarrollo Local

### **Clonar Repositorio**

```bash
git clone https://github.com/eshe87-ciudad/ferreteria-control.git
cd ferreteria-control
```

### **Servidor Local**

```bash
# Opción 1: Python
python -m http.server 8000

# Opción 2: Node.js
npx http-server

# Opción 3: PHP
php -S localhost:8000
```

### **Acceder**

- Abrir: `http://localhost:8000`

## 📊 Costos Firebase (GRATIS)

### **Plan Spark (Gratuito)**

- ✅ 1 GB almacenamiento
- ✅ 50,000 lecturas/día
- ✅ 20,000 escrituras/día
- ✅ **Perfecto para una ferretería**

## 🚨 Solución de Problemas

### **Error de Configuración Firebase**

- Verificar que `firebaseConfig` tenga datos reales
- Comprobar que Firestore esté habilitado
- Verificar reglas de seguridad

### **No se Sincroniza**

- Verificar conexión a internet
- Comprobar autenticación anónima habilitada
- Revisar consola del navegador (F12)

### **Datos Perdidos**

- Los datos se guardan localmente cada 5 minutos
- Usar "Exportar Datos" regularmente
- Firebase mantiene backup automático

## 🤝 Contribuir

1. Fork del repositorio
2. Crear rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 👨‍💻 Autor

**Ezequiel Centeno**
- GitHub: [@eshe87-ciudad](https://github.com/eshe87-ciudad)
- Proyecto: [ferreteria-control](https://github.com/eshe87-ciudad/ferreteria-control)

---

## 🔥 ¡EMPEZAR AHORA!

1. **🚀 [ABRIR APLICACIÓN](https://eshe87-ciudad.github.io/ferreteria-control/app/index-firebase.html)**
2. **⚙️ [CONFIGURAR FIREBASE](https://console.firebase.google.com)**
3. **📱 ¡Usar desde cualquier dispositivo!**

---

*✨ Sistema de control de ferretería moderno con sincronización en tiempo real*
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /ingresos/{document} {
      allow read, write: if request.auth != null;
    }
    match /gastos/{document} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### **PASO 4: Habilitar Authentication**

1. Menu → "Authentication" → "Comenzar"
2. "Sign-in method" → Habilitar "Anónimo"

### **PASO 5: Obtener Configuración**

1. Configuración proyecto → ⚙️ → "Configuración del proyecto"
2. "Tus apps" → "</>" (Web)
3. Alias: `ferreteria-control-web`
4. Copiar la configuración

### **PASO 6: Actualizar Código**

En `app/index-firebase.html`, reemplazar:

```javascript
const firebaseConfig = {
    apiKey: "TEMP_API_KEY",
    // ... con tu configuración real
};
```

## 📂 Estructura del Proyecto

```
ferreteria-github/
├── index.html                     # Landing page
├── README.md                      # Este archivo
└── app/
    ├── index.html                 # Versión local
    ├── index-firebase.html        # Versión Firebase
    ├── script-ferreteria.js       # Lógica local
    ├── script-ferreteria-firebase.js  # Lógica Firebase
    └── styles-ferreteria.css      # Estilos
```

## 💻 Uso del Sistema

### **Agregar Ingresos**
1. Escribir concepto (ej: "Venta de tornillos")
2. Ingresar monto
3. Clic en "Agregar Ingreso"
4. ✨ **Se sincroniza automáticamente en todos los dispositivos**

### **Agregar Gastos**
1. Escribir concepto (ej: "Compra de materiales")
2. Ingresar monto
3. Clic en "Agregar Gasto"
4. ✨ **Se sincroniza automáticamente en todos los dispositivos**

### **Ver en Tiempo Real**
- Abre la aplicación en tu PC
- Abre la misma URL en tu móvil
- Agrega una transacción en uno
- ⚡ **Aparece inmediatamente en el otro**

## 🛠️ Funcionalidades Técnicas

### **Firebase Real-time**
- **Firestore Database**: Base de datos NoSQL en tiempo real
- **Authentication**: Autenticación anónima segura
- **Offline Support**: Funciona sin conexión
- **Multi-device Sync**: Sincronización instantánea

### **Backup y Seguridad**
- **Backup Local**: Cada 5 minutos en localStorage
- **Exportar Datos**: Descarga JSON completo
- **Importar Datos**: Restaurar desde archivo
- **Validación**: Verificación de datos automática

### **Responsive Design**
- **Mobile First**: Optimizado para móviles
- **Touch Friendly**: Botones grandes para pantallas táctiles
- **Adaptable**: Se ajusta a cualquier tamaño de pantalla

## 🔧 Desarrollo Local

### **Clonar Repositorio**
```bash
git clone https://github.com/eshe87-ciudad/ferreteria-control.git
cd ferreteria-control
```

### **Servidor Local**
```bash
# Opción 1: Python
python -m http.server 8000

# Opción 2: Node.js
npx http-server

# Opción 3: PHP
php -S localhost:8000
```

### **Acceder**
- Abrir: `http://localhost:8000`

## 📊 Costos Firebase (GRATIS)

### **Plan Spark (Gratuito)**
- ✅ 1 GB almacenamiento
- ✅ 50,000 lecturas/día
- ✅ 20,000 escrituras/día
- ✅ **Perfecto para una ferretería**

## 🚨 Solución de Problemas

### **Error de Configuración Firebase**
- Verificar que `firebaseConfig` tenga datos reales
- Comprobar que Firestore esté habilitado
- Verificar reglas de seguridad

### **No se Sincroniza**
- Verificar conexión a internet
- Comprobar autenticación anónima habilitada
- Revisar consola del navegador (F12)

### **Datos Perdidos**
- Los datos se guardan localmente cada 5 minutos
- Usar "Exportar Datos" regularmente
- Firebase mantiene backup automático

## 🤝 Contribuir

1. Fork del repositorio
2. Crear rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 👨‍💻 Autor

**Ezequiel Centeno**
- GitHub: [@eshe87-ciudad](https://github.com/eshe87-ciudad)
- Proyecto: [ferreteria-control](https://github.com/eshe87-ciudad/ferreteria-control)

---

## 🔥 ¡EMPEZAR AHORA!

1. **🚀 [ABRIR APLICACIÓN](https://eshe87-ciudad.github.io/ferreteria-control/app/index-firebase.html)**
2. **⚙️ [CONFIGURAR FIREBASE](https://console.firebase.google.com)**
3. **📱 ¡Usar desde cualquier dispositivo!**

---

*✨ Sistema de control de ferretería moderno con sincronización en tiempo real*
=======
# 🔧 Control Ferretería - Sistema de Gestión

## 🚀 Sistema Completo para Ferreterías

Aplicación web completa para la gestión integral de ferreterías, incluyendo control de ingresos, ventas, proveedores y reportes.

## ✨ Características Principales

- **💳 Ingresos Mercado Pago** - Control de transacciones con comisiones
- **🛒 Ventas de Mostrador** - Efectivo, tarjeta y pagos mixtos
- **🏪 Gestión de Proveedores** - Pagos y control de vencimientos
- **💵 Control de Efectivo** - Registro de pagos en efectivo
- **📊 Reportes y Estadísticas** - Análisis detallado del negocio
- **💾 Backup Automático** - Respaldo cada 10 minutos
- **📱 100% Responsive** - Funciona en móviles y tablets
- **🔒 Datos Seguros** - Almacenamiento local con exportación/importación

## 🌐 Acceso

- **Aplicación**: [https://eshe87-ciudad.github.io/ferreteria-control/](https://eshe87-ciudad.github.io/ferreteria-control/)
- **Aplicación directa**: [https://eshe87-ciudad.github.io/ferreteria-control/app/](https://eshe87-ciudad.github.io/ferreteria-control/app/)

## 📱 Uso

1. **Acceder a la aplicación** desde cualquier navegador
2. **Registrar transacciones** de diferentes tipos
3. **Consultar reportes** y estadísticas
4. **Exportar/Importar datos** para backup
5. **Usar desde móvil** - totalmente responsive

## 💾 Backup y Sincronización

- **Backup automático** cada 10 minutos
- **Exportar datos** en formato JSON
- **Importar datos** desde archivos de backup
- **Sincronizar entre dispositivos** mediante exportación/importación

## 🛡️ Seguridad

- Todos los datos se almacenan localmente en tu navegador
- No se envían datos a servidores externos
- Backup automático para prevenir pérdida de información
- Exportación manual disponible en cualquier momento

## 🔧 Tecnologías

- HTML5, CSS3, JavaScript ES6+
- LocalStorage para persistencia
- Diseño responsive con CSS Grid/Flexbox
- Sin dependencias externas

## 📞 Soporte

Para soporte técnico o consultas, revisar la documentación incluida en la aplicación.

---

**Sistema desarrollado para optimizar la gestión de ferreterías** 🚀
>>>>>>> 5954cd6b418ba8529291609c6299e558c5c3f079
