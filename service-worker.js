const CACHE_NAME = 'trip-assistant-v2.1.7'; // ACTUALIZADO A 2.1.7
const IS_PRODUCTION = true; 

// Archivos requeridos para que la app funcione offline
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  // Nuevos archivos CSS y JS locales
  './css/styles.css',
  './js/config.js',
  './js/db.js',
  './js/components/Icons.js',
  './js/components/Modals.js',
  './js/components/App.js',
  './js/main.js',
  // Librerías externas
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/react@18/umd/react.production.min.js',
  'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js',
  'https://unpkg.com/@babel/standalone/babel.min.js'
];

// Instalación: Guardar archivos en caché
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

// Intercepción de peticiones: Servir desde caché primero, luego red
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