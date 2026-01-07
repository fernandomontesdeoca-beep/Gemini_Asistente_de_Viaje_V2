// ==========================================
// SERVICIO DE SINCRONIZACIÓN (Google Sheets)
// Version: 3.6.0
// Last Updated: 2026-01-07
// ==========================================

window.GoogleSheetSync = {
    /**
     * Sincroniza datos locales con la nube (Bidireccional)
     */
    syncData: async (url, data) => {
        if (!url) throw new Error("URL de configuración no válida.");

        // Empaquetamos datos con metadatos extra
        const payload = {
            ...data,
            syncDate: new Date().toISOString(),
            appVersion: window.APP_VERSION || 'unknown'
        };

        return await sendRequest(url, payload);
    },

    /**
     * Envía comando para borrar TODA la base de datos en la nube
     */
    resetCloudData: async (url) => {
        if (!url) throw new Error("URL de configuración no válida.");
        return await sendRequest(url, { command: "RESET_ALL" });
    }
};

// Función auxiliar privada para peticiones
async function sendRequest(url, payload) {
    try {
        // Usamos 'text/plain' para evitar Preflight OPTIONS de CORS que Google no soporta bien
        const response = await fetch(url, {
            method: "POST",
            body: JSON.stringify(payload),
            headers: {
                "Content-Type": "text/plain;charset=utf-8",
            },
        });

        if (!response.ok) {
            throw new Error(`Error de red: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.status !== 'success') {
            throw new Error(result.message || "Error desconocido en el script de Google");
        }
        
        return result;

    } catch (error) {
        console.error("Error en servicio de sincronización:", error);
        throw error;
    }
}