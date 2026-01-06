const CACHE_NAME = 'trip-assistant-v2.3.0'; // ACTUALIZADO A 2.3.0
const IS_PRODUCTION = true;

// Archivos LOCALES requeridos para que la app funcione offline.
// NOTA: Hemos eliminado las librerías externas (CDN) de esta lista para evitar errores.
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './css/styles.css',
  './js/config.js',
  './js/db.js',
  './js/components/Icons.js',
  './js/components/Modals.js',
  './js/components/App.js',
  './js/main.js'
];

// Instalación: Guardar archivos locales en caché
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching app shell');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting(); // Forzar activación inmediata
});

// Activación: Limpiar cachés viejas
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Intercepción de peticiones
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Si está en caché, devolverlo
      if (response) {
        return response;
      }
      // Si no, ir a la red
      return fetch(event.request).catch(() => {
        // Fallback offline (opcional)
      });
    })
  );
});