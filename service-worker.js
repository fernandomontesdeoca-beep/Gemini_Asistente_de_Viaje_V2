const CACHE_NAME = 'trip-assistant-v2.2.0'; // ACTUALIZADO A 2.2.0
const IS_PRODUCTION = true; 

// Archivos LOCALES requeridos para que la app funcione offline.
// Nota: No incluimos librerías externas (CDN) aquí para evitar errores CORS.
// El navegador las cacheará por su cuenta en la caché HTTP normal.
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
  // Estrategia: Cache First, falling back to Network
  // Intentamos servir desde caché. Si no está (ej. librerías externas la primera vez), vamos a la red.
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }
      return fetch(event.request).catch(() => {
        // Fallback offline (opcional, por si no hay red y no está en caché)
        // Podríamos retornar una página de "Sin conexión" genérica aquí
      });
    })
  );
});