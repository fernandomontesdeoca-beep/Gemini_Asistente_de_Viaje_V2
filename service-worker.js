const CACHE_NAME = 'trip-assistant-v3.0.0'; // ACTUALIZADO A 3.0.0
const IS_PRODUCTION = true;

// Archivos LOCALES requeridos para que la app funcione offline.
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './css/styles.css',
  './js/config.js',
  './js/db.js',
  './js/services/GoogleSheetSync.js',
  './js/components/Icons.js',
  
  // Modales
  './js/components/modals/SystemModals.js',
  './js/components/modals/TransactionModals.js',
  './js/components/modals/TripModals.js',
  
  // Vistas
  './js/components/views/HomeView.js',
  './js/components/views/StartingView.js',
  './js/components/views/ActiveTripView.js',
  './js/components/views/EndingTripView.js',
  './js/components/views/SettingsView.js',
  './js/components/views/HistoryView.js',

  // Core
  './js/components/App.js',
  './js/main.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching app shell');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

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

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) return response;
      return fetch(event.request).catch(() => {});
    })
  );
});