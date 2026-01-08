const CACHE_NAME = 'trip-assistant-v4.0.0-driver-edition'; // NUEVA VERSIÓN MAYOR
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './css/styles.css',
  './js/config.js',
  './js/db.js',
  './js/services/GoogleSheetSync.js',
  './js/components/Icons.js',
  './js/components/modals/SystemModals.js',
  './js/components/modals/TransactionModals.js',
  './js/components/modals/TripModals.js',
  './js/components/views/HomeView.js',
  './js/components/views/StartingView.js',
  './js/components/views/ActiveTripView.js',
  './js/components/views/EndingTripView.js',
  './js/components/views/SettingsView.js',
  './js/components/views/HistoryView.js',
  './js/components/App.js',
  './js/main.js'
];

self.addEventListener('install', (event) => {
  self.skipWaiting(); // Forzar activación inmediata
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) => {
      return Promise.all(
        names.map((name) => {
          if (name !== CACHE_NAME) return caches.delete(name);
        })
      );
    })
  );
  return self.clients.claim(); // Tomar control inmediatamente
});

self.addEventListener('fetch', (event) => {
  // Estrategia: Network First para API/JSON, Cache First para Assets
  const isApi = event.request.url.includes('json') || event.request.url.includes('script.google');
  
  if (isApi) {
      event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
  } else {
      event.respondWith(
        caches.match(event.request).then((response) => response || fetch(event.request))
      );
  }
});