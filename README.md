# 🚗 Asistente de Viaje V2 (Trip Assistant)

Una Aplicación Web Progresiva (PWA) robusta y *offline-first* diseñada para la gestión integral de bitácoras de viaje, control de flotas, seguimiento de gastos y sincronización de datos en tiempo real.

Esta herramienta permite a los usuarios registrar viajes, visitas a clientes y gastos operativos sin necesidad de conexión constante a internet. La aplicación guarda todo localmente y sincroniza la información automáticamente con una Hoja de Cálculo de Google cuando recupera la conexión.

---

## 🚀 Acceso Inmediato

### **Opción 1: Usar Online (Recomendado)**
Accede a la última versión desplegada aquí:
👉 **[https://fernandomontesdeoca-beep.github.io/Gemini_Asistente_de_Viaje_V2/](https://fernandomontesdeoca-beep.github.io/Gemini_Asistente_de_Viaje_V2/)**

### **Opción 2: Instalación (Android/PC)**
1. Abre el enlace anterior en Chrome o Edge.
2. **En Android:** Abre el menú del navegador y selecciona "Agregar a la pantalla de inicio" o "Instalar Aplicación".
3. **En PC:** Haz clic en el ícono de instalación (⊕) en la barra de direcciones.

---

## ✨ Características Principales

### 🛣️ Gestión de Viajes
* **Ciclo de Vida Completo:** Flujo intuitivo de estados: *Inicio* -> *En Ruta* -> *Llegada* -> *Cierre*.
* **Cronómetro en Tiempo Real:** Visualización del tiempo transcurrido durante el viaje activo.
* **Odómetro Inteligente:** Control y actualización automática del kilometraje por vehículo.
* **Validaciones:** Alertas de discrepancia de kilometraje y validación de consistencia al cerrar viajes.

### 💰 Control de Gastos
* **Categorización:** Registro detallado de gastos como:
    * ⛽ Combustible (Nafta/Eléctrico con soporte para tarifas AC/DC).
    * 🅿️ Estacionamiento.
    * 🚧 Peajes.
    * 🍽️ Alimentación y 🏨 Alojamiento.
* **Múltiples Monedas:** Soporte para gastos en diferentes divisas (UYU, U$D, etc.).
* **Métodos de Pago:** Clasificación por Efectivo, Débito, Crédito o Transferencia.

### 🔄 Sincronización Inteligente (Bidireccional)
* **Cloud Sync:** Conexión directa con Google Sheets mediante Google Apps Script.
* **Smart Merge (Client-Side):** Algoritmo de fusión inteligente que evita que la nube sobrescriba datos locales recientes.
* **Algoritmo "Last Write Wins":** Resolución de conflictos basada en marcas de tiempo (`updatedAt`).
* **Soft Delete:** Sistema de borrado lógico (`_deleted: true`) para garantizar que las eliminaciones se propaguen correctamente y evitar "datos fantasma".
* **Resiliencia:** Capacidad de retomar viajes iniciados en un dispositivo y finalizarlos en otro (ej. iniciar en móvil, cerrar en PC).

### ⚙️ Configuración y Personalización
* **Multi-Vehículo:** Gestión de flotas con configuraciones independientes de rendimiento y tipo de combustible.
* **Tarifas Configurables:** Ajuste de precios de combustible, peajes y valor del KM recorrido.
* **Modo Offline:** Persistencia local completa usando **IndexedDB**.
* **Gestión de Datos:** Opciones para exportar copias de seguridad locales (JSON) y realizar un "Reset de Fábrica" remoto.

---

## 🛠️ Tecnologías Utilizadas

La aplicación está construida con una arquitectura moderna y ligera, sin dependencias de compilación complejas (No-Build), ideal para despliegue rápido.

* **Frontend:**
    * **React 18:** Implementado vía CDN para la interfaz de usuario reactiva.
    * **Tailwind CSS:** Para el diseño y estilos utilitarios (vía CDN).
    * **Babel Standalone:** Para la transpilación de JSX en el navegador.
* **Almacenamiento Local:**
    * **IndexedDB:** Base de datos transaccional en el navegador para almacenamiento masivo offline.
    * **Service Workers:** Para la capacidad de instalación (PWA) y caché de recursos estáticos.
* **Backend & Nube:**
    * **Google Apps Script:** Actúa como API Serverless para recibir y enviar datos.
    * **Google Sheets:** Actúa como base de datos relacional en la nube.

---

## ☁️ Configuración del Backend (Google Apps Script)

Para que la sincronización funcione, debes desplegar el script en tu cuenta de Google.

1.  **Crear la Hoja de Cálculo:**
    * Abre [Google Sheets](https://sheets.google.com) y crea una hoja nueva llamada `Bitacora_Viajes_DB`.

2.  **Abrir el Editor de Secuencias de Comandos:**
    * En la hoja, ve al menú `Extensiones` > `Apps Script`.

3.  **Implementar el Código:**
    * Borra cualquier código que aparezca en el editor.
    * Copia y pega íntegramente el contenido del archivo **`Code.gs`** de este repositorio.
    * El script gestionará automáticamente las pestañas: `Trips`, `Expenses`, `Visits`, `Odometers`, `Configs` y `AppState`.

4.  **Desplegar como Aplicación Web:**
    * Haz clic en el botón azul **"Implementar"** > **"Nueva implementación"**.
    * **Tipo:** Aplicación web.
    * **Descripción:** `v3.5.0` (o la actual).
    * **Ejecutar como:** `Yo` (tu cuenta de Google).
    * **Quién tiene acceso:** `Cualquier persona` (Necesario para el funcionamiento sin login).
    * Haz clic en **"Implementar"**.

5.  **Conectar con la App:**
    * Copia la **URL de la aplicación web** generada (empieza por `https://script.google.com/...`).
    * Abre la App, ve a **Configuración** ⚙️ y pégala en el campo correspondiente.

---

## 📂 Estructura del Proyecto

* **`index.html`**: Punto de entrada, carga de librerías y contenedor raíz.
* **`js/main.js`**: Inicialización de React y montaje de la App.
* **`js/config.js`**: Constantes globales (Versión, Tipos de vehículos, Categorías).
* **`js/db.js`**: Capa de abstracción para IndexedDB.
* **`js/services/GoogleSheetSync.js`**: Servicio encargado de la comunicación HTTP con Google.
* **`js/components/App.js`**: Lógica central, manejo de estado, sincronización y enrutamiento.
* **`js/components/views/`**: Pantallas principales (`Home`, `ActiveTrip`, `Settings`, etc.).
* **`js/components/modals/`**: Componentes UI emergentes.
* **`Code.gs`**: Lógica del servidor para Google Apps Script.

---

## 🤝 Contribución

Repositorio oficial:
[https://github.com/fernandomontesdeoca-beep/Gemini_Asistente_de_Viaje_V2.git](https://github.com/fernandomontesdeoca-beep/Gemini_Asistente_de_Viaje_V2.git)

Si deseas mejorar este proyecto:
1.  Haz un Fork del repositorio.
2.  Crea una rama (`git checkout -b feature/Mejora`).
3.  Haz tus cambios y commit (`git commit -m 'Agregada mejora'`).
4.  Haz push a la rama (`git push origin feature/Mejora`).
5.  Abre un Pull Request.

---

**Licencia:** MIT License.