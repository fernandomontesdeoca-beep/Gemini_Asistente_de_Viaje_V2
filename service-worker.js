const CACHE_NAME = 'trip-assistant-v2.0.0';
const IS_PRODUCTION = true; // Cambiar a false si estás editando localmente para ver cambios al instante

// Archivos requeridos para que la app funcione offline
const ASSETS_TO_CACHE = [
  './',                      // La raíz del sitio
  './index.html',            // El archivo principal (si lo renombras en GitHub Pages)
  './manifest.json',         // El manifiesto
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/react@18/umd/react.production.min.js',
  'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js',
  'https://unpkg.com/@babel/standalone/babel.min.js'
  // Nota: Los iconos están integrados en el HTML, no necesitan caché externa
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
        // Fallback para cuando no hay internet y no está en caché (opcional)
        // Podrías retornar una página de "Offline" aquí si quisieras
      });
    })
  );
});