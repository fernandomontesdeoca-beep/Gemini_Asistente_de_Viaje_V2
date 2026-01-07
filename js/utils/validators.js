// ==========================================
// VALIDADORES Y UTILIDADES
// Version: 3.6.0
// ==========================================

window.validators = {
    /**
     * Valida que un número sea positivo
     */
    isPositiveNumber: (value) => {
        const num = parseFloat(value);
        return !isNaN(num) && num > 0;
    },

    /**
     * Valida odómetro
     */
    isValidOdometer: (value, minValue = 0) => {
        const num = parseInt(value);
        return !isNaN(num) && num >= minValue;
    },

    /**
     * Valida URL de Google Script
     */
    isValidGoogleScriptUrl: (url) => {
        if (!url) return false;
        return url.startsWith('https://script.google.com/');
    },

    /**
     * Valida que un string no esté vacío
     */
    isNotEmpty: (value) => {
        return typeof value === 'string' && value.trim().length > 0;
    },

    /**
     * Valida distancia de viaje
     */
    isValidDistance: (startOdo, endOdo) => {
        const start = parseInt(startOdo);
        const end = parseInt(endOdo);
        return !isNaN(start) && !isNaN(end) && end > start;
    },

    /**
     * Sanitiza input de texto
     */
    sanitizeText: (text) => {
        if (typeof text !== 'string') return '';
        return text.trim().replace(/[<>]/g, '');
    }
};

window.formatters = {
    /**
     * Formatea dinero con 2 decimales
     */
    money: (amount) => {
        return Number(amount || 0).toFixed(2);
    },

    /**
     * Formatea tiempo en formato mm:ss
     */
    time: (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    },

    /**
     * Formatea fecha a formato local
     */
    date: (date) => {
        if (!date) return '';
        return new Date(date).toLocaleDateString();
    },

    /**
     * Formatea hora a formato local
     */
    timeOfDay: (date) => {
        if (!date) return '';
        return new Date(date).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
    }
};

window.errorHandler = {
    /**
     * Maneja errores de sincronización
     */
    handleSyncError: (error, silent = false) => {
        console.error('Sync Error:', error);
        if (!silent) {
            const message = error.message || 'Error de sincronización';
            alert(`⚠️ ${message}`);
        }
        return { success: false, error: message };
    },

    /**
     * Maneja errores de base de datos
     */
    handleDbError: (error, operation = 'operación') => {
        console.error(`DB Error (${operation}):`, error);
        return null;
    },

    /**
     * Maneja errores de red
     */
    handleNetworkError: (error) => {
        console.error('Network Error:', error);
        if (!navigator.onLine) {
            return { success: false, error: 'Sin conexión a internet' };
        }
        return { success: false, error: 'Error de red' };
    }
};
