# **🚗 Asistente de Viaje V2 (Trip Assistant)**

Una aplicación web progresiva (PWA) diseñada para llevar una bitácora detallada de viajes, control de odómetro, gestión de gastos y visitas a clientes.

## **✨ Características Principales**

* **🧩 Arquitectura Modular:** El código ha sido refactorizado en componentes separados (JS/CSS) para facilitar su mantenimiento y escalabilidad, manteniendo su ligereza.
* **💾 Persistencia de Datos:** Utiliza **IndexedDB** para guardar automáticamente todo tu historial, configuraciones y estado del viaje. Los datos no se pierden al cerrar el navegador y funcionan sin internet.
* **📱 Diseño Responsivo:** Interfaz optimizada para móviles con botones grandes y navegación ágil.
* **🛣️ Flujo de Viaje:** * Control automático de **Odómetro** (se actualiza con las cargas de combustible).  
  * Cronómetro de tiempo en ruta.  
  * Detección de "Visitas" (Ciclo: Origen \-\> Cliente \-\> Destino).  
* **💰 Gestión de Gastos:** * Registro de Peajes, Combustible (Nafta/Eléctrico), Comida y Alojamiento.  
  * Manejo de tarifas diferenciadas para vehículos eléctricos (Carga AC/DC).  
  * Precios configurables (Valores oficiales de UTE/ANCAP Uruguay).

## **🚀 Cómo usar**

### **Opción 1: Online (GitHub Pages)**

https://fernandomontesdeoca-beep.github.io/Gemini_Asistente_de_Viaje_V2/

### **Opción 2: Instalación (Android/PC)**

1. Abre el enlace anterior en Chrome o Edge.
2. **En Android:** Abre el menú del navegador y selecciona "Agregar a la pantalla de inicio" o "Instalar Aplicación".
3. **En PC:** Haz clic en el ícono de instalación (+) en la barra de direcciones.

## **🛠️ Tecnologías**

* **React 18** (vía CDN)  
* **Tailwind CSS** (vía CDN)  
* **Lucide Icons** (Sistema integrado SVG para rendimiento offline)  
* **Babel Standalone**
* **IndexedDB** (Almacenamiento local)

## **⚙️ Configuración**

Al iniciar la aplicación, puedes ir al ícono de engranaje ⚙️ para configurar:

* Precios de Peaje.  
* Precio de Combustible (o kWh para eléctricos).  
* Valor del KM recorrido.

## **📂 Estructura del Proyecto**

* `index.html`: Punto de entrada y estructura base.
* `css/`: Estilos personalizados.
* `js/`: Lógica de la aplicación dividida en módulos:
    * `components/`: Componentes de React (App, Modals, Icons).
    * `db.js`: Manejo de base de datos local.
    * `config.js`: Constantes y configuraciones.
    * `main.js`: Inicialización de React.

## **🤝 Contribuir**

Las contribuciones son bienvenidas. Si tienes una idea para mejorar el asistente:

1. Haz un Fork del repositorio.  
2. Crea una rama con tu feature (`git checkout -b feature/NuevaFuncionalidad`).  
3. Haz Commit (`git commit -m 'Agregado nueva funcionalidad'`).  
4. Haz Push (`git push origin feature/NuevaFuncionalidad`).  
5. Abre un Pull Request.

## **📄 Licencia**

Este proyecto está bajo la Licencia MIT. Ver el archivo LICENSE para más detalles.