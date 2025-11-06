// Service Worker - Portfolio Tracker
// Permette il funzionamento offline e il caching

const CACHE_NAME = 'portfolio-tracker-v1';
const urlsToCache = [
  './',
  './index.html',
  './app.js',
  './style.css',
  './manifest.json'
];

// Installazione
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache aperto');
        return cache.addAll(urlsToCache);
      })
      .catch(err => console.log('Errore nel cache:', err))
  );
  self.skipWaiting();
});

// Attivazione
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Eliminazione cache vecchio:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch
self.addEventListener('fetch', event => {
  // Solo richieste GET
  if (event.request.method !== 'GET') {
    return;
  }

  // Strategie diverse per API vs risorse locali
  if (event.request.url.includes('rapidapi') || event.request.url.includes('yahoo')) {
    // Per le API esterne: prova la rete, fallback al cache
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (!response || response.status !== 200) {
            return caches.match(event.request);
          }
          // Cache i dati API per offline
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => caches.match(event.request))
    );
  } else {
    // Per le risorse locali: cache first, poi network
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          if (response) {
            return response;
          }
          return fetch(event.request).then(response => {
            if (!response || response.status !== 200) {
              return response;
            }
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
            });
            return response;
          });
        })
        .catch(() => {
          // Fallback per offline
          return new Response('Offline - Contenuto non disponibile', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({ 'Content-Type': 'text/plain' })
          });
        })
    );
  }
});

// Sincronizzazione in background
self.addEventListener('sync', event => {
  if (event.tag === 'sync-prices') {
    event.waitUntil(
      // Qui potremmo aggiungere logica per sincronizzare dati
      Promise.resolve()
    );
  }
});
