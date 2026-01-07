// ==========================================
// CONSTANTES DE LA APLICACIÓN
// Version: 3.6.0
// ==========================================

window.APP_CONSTANTS = {
    // Estados de la aplicación
    APP_STATES: {
        IDLE: 'IDLE',
        STARTING: 'STARTING',
        ACTIVE: 'ACTIVE',
        ENDING: 'ENDING',
        SETTINGS: 'SETTINGS',
        HISTORY: 'HISTORY'
    },

    // Estados de viaje
    TRIP_STATUS: {
        ACTIVE: 'ACTIVE',
        CLOSED: 'CLOSED'
    },

    // Estados de visita
    VISIT_STATUS: {
        OPEN: 'OPEN',
        COMPLETED: 'COMPLETED'
    },

    // Tabs de historial
    HISTORY_TABS: {
        TRIPS: 'TRIPS',
        VISITS: 'VISITS',
        EXPENSES: 'EXPENSES'
    },

    // Modos de selector de ubicación
    LOCATION_MODES: {
        ORIGIN: 'ORIGIN',
        DESTINATION: 'DESTINATION'
    },

    // Tipos de carga eléctrica
    CHARGE_TYPES: {
        AC: 'AC',
        DC: 'DC'
    },

    // Mensajes de error
    ERROR_MESSAGES: {
        NO_URL: 'Falta URL de Google Script',
        SYNC_FAILED: 'Error al sincronizar con la nube',
        INVALID_ODOMETER: 'Odómetro inválido',
        INVALID_DISTANCE: 'La distancia debe ser positiva',
        NO_DESTINATION: 'Debes seleccionar un destino'
    },

    // Mensajes de éxito
    SUCCESS_MESSAGES: {
        SYNC_COMPLETE: '✅ Sincronización completada',
        TRIP_SAVED: '✅ Viaje guardado correctamente',
        CONFIG_SAVED: '✅ Configuración guardada',
        DATA_EXPORTED: '✅ Datos exportados'
    },

    // Configuración de UI
    UI_CONFIG: {
        ANIMATION_DURATION: 300,
        DEBOUNCE_DELAY: 500,
        AUTO_SAVE_DELAY: 1000
    }
};
