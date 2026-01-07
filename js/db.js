// ==========================================
// INDEXEDDB HELPERS (Persistencia de Datos)
// Version: 3.6.0
// Last Updated: 2026-01-07
// ==========================================
const DB_NAME = 'TripAssistantDB';
const STORE_NAME = 'app_data';
const DB_VERSION = 1;

// Asignamos a window para hacerlo global
window.dbHelper = {
    init: () => {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME);
                }
            };
            request.onsuccess = (event) => resolve(event.target.result);
            request.onerror = (event) => reject(event.target.error);
        });
    },
    get: async (key) => {
        try {
            const db = await window.dbHelper.init();
            return new Promise((resolve, reject) => {
                const transaction = db.transaction([STORE_NAME], 'readonly');
                const store = transaction.objectStore(STORE_NAME);
                const request = store.get(key);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        } catch (e) {
            console.warn("DB Get Error (posible primer uso):", e);
            return null;
        }
    },
    set: async (key, value) => {
        try {
            const db = await window.dbHelper.init();
            return new Promise((resolve, reject) => {
                const transaction = db.transaction([STORE_NAME], 'readwrite');
                const store = transaction.objectStore(STORE_NAME);
                const request = store.put(value, key);
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        } catch (e) {
            console.error("DB Set Error:", e);
        }
    }
};