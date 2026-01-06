# **🚗 Asistente de Viaje V2(Trip Assistant)**

Una aplicación web progresiva (PWA) de **archivo único** diseñada para llevar una bitácora detallada de viajes, control de odómetro, gestión de gastos y visitas a clientes.

## **✨ Características Principales**

* **⚡ Arquitectura Single-File:** Toda la aplicación vive en un solo archivo HTML. No requiere instalación, servidores backend ni compilación.  
* **💾 Persistencia de Datos:** Utiliza **IndexedDB** para guardar automáticamente todo tu historial, configuraciones y estado del viaje. Los datos no se pierden al cerrar el navegador.  
* **📱 Diseño Responsivo:** Interfaz optimizada para móviles con botones grandes y navegación ágil.  
* **🛣️ Flujo de Viaje:**  
  * Control automático de **Odómetro** (se actualiza con las cargas de combustible).  
  * Cronómetro de tiempo en ruta.  
  * Detección de "Visitas" (Ciclo: Origen \-\> Cliente \-\> Destino).  
* **💰 Gestión de Gastos:**  
  * Registro de Peajes, Combustible (Nafta/Eléctrico), Comida y Alojamiento.  
  * Manejo de tarifas diferenciadas para vehículos eléctricos (Carga AC/DC).  
  * Precios configurables (Valores oficiales de UTE/ANCAP Uruguay).

## **🚀 Cómo usar**

### **Opción 1: Online (GitHub Pages)**

https://fernandomontesdeoca-beep.github.io/Gemini_Asistente_de_Viaje_V2/

### **Opción 2: Local (PC o Android)**

1. Descarga el archivo index.html de este repositorio.  
2. Ábrelo en cualquier navegador moderno (Chrome, Edge, Safari).  
3. **En Android:** Abre el menú del navegador y selecciona "Agregar a la pantalla de inicio" para usarla como una App nativa.

## **🛠️ Tecnologías**

* **React 18** (vía CDN)  
* **Tailwind CSS** (vía CDN)  
* **Lucide Icons** (Sistema integrado SVG para rendimiento offline)  
* **Babel Standalone**

## **⚙️ Configuración**

Al iniciar la aplicación, puedes ir al ícono de engranaje ⚙️ para configurar:

* Precios de Peaje.  
* Precio de Combustible (o kWh para eléctricos).  
* Valor del KM recorrido.

## **🤝 Contribuir**

Las contribuciones son bienvenidas. Si tienes una idea para mejorar el asistente:

1. Haz un Fork del repositorio.  
2. Crea una rama con tu feature (git checkout \-b feature/NuevaFuncionalidad).  
3. Haz Commit (git commit \-m 'Agregado nueva funcionalidad').  
4. Haz Push (git push origin feature/NuevaFuncionalidad).  
5. Abre un Pull Request.

## **📄 Licencia**

Este proyecto está bajo la Licencia MIT. Ver el archivo LICENSE para más detalles.

