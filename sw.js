// Service Worker — Serfuplagas PWA
// Offline básico: cachea la app shell para que funcione sin internet

const CACHE_NAME = 'serfuplagas-v2';
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap',
];

// Instalar: cachear app shell
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(APP_SHELL).catch(() => {});
    })
  );
  self.skipWaiting();
});

// Activar: limpiar caches viejos
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: network first, fallback a cache
self.addEventListener('fetch', e => {
  // No interceptar Firebase ni Google Maps (necesitan red)
  if (e.request.url.includes('firebaseio.com') ||
      e.request.url.includes('googleapis.com') ||
      e.request.url.includes('gstatic.com') ||
      e.request.url.includes('maps.google')) {
    return;
  }

  e.respondWith(
    fetch(e.request)
      .then(response => {
        // Guardar en cache si es exitoso
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return response;
      })
      .catch(() => {
        // Sin red: servir desde cache
        return caches.match(e.request).then(cached => {
          if (cached) return cached;
          // Fallback: página principal
          return caches.match('/index.html');
        });
      })
  );
});
