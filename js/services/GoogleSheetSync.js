// ==========================================
// SERVICIO DE SINCRONIZACIÓN (Google Sheets)
// ==========================================

window.GoogleSheetSync = {
    /**
     * Envía los datos locales al script de Google Apps Script
     * @param {string} url - La URL de la Web App de Google Script
     * @param {object} data - Objeto con trips, expenses y visits
     */
    syncData: async (url, data) => {
        if (!url) throw new Error("URL de configuración no válida.");

        // Preparamos el paquete de datos
        const payload = {
            trips: data.trips || [],
            expenses: data.expenses || [],
            visits: data.visits || [],
            syncDate: new Date().toISOString(),
            appVersion: window.APP_VERSION || 'unknown'
        };

        try {
            // Usamos 'text/plain' para evitar problemas de CORS (Preflight OPTIONS)
            // Google Apps Script maneja esto perfectamente
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
            console.error("Error en sincronización:", error);
            throw error; // Re-lanzamos para manejarlo en la UI
        }
    }
};