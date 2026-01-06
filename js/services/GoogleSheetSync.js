// ==========================================
// SERVICIO DE SINCRONIZACIÓN (Google Sheets)
// ==========================================

window.GoogleSheetSync = {
    /**
     * Envía TODOS los datos locales al script de Google Apps Script
     */
    syncData: async (url, data) => {
        if (!url) throw new Error("URL de configuración no válida.");

        // Empaquetamos TODO el estado de la aplicación
        const payload = {
            trips: data.trips || [],
            expenses: data.expenses || [],
            visits: data.visits || [],
            vehicleOdometers: data.vehicleOdometers || {},
            vehicleConfigs: data.vehicleConfigs || {},
            lastLocation: data.lastLocation || "",
            appVersion: window.APP_VERSION || 'unknown'
        };

        try {
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
            throw error;
        }
    }
};