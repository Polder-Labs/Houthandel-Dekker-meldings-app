/* ============================================
   HoutVeilig - Service Worker
   Voor offline functionaliteit (PWA)
   ============================================ */

const CACHE_NAME = 'houtveilig-v2';
const ASSETS = [
    './',
    './index.html',
    './css/style.css',
    './js/auth.js',
    './js/app.js',
    './manifest.json',
    './icons/icon-192.png',
    './icons/icon-512.png'
];

// Installatie - Cache alle bestanden
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Cache geopend, bestanden worden gecached...');
                return cache.addAll(ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

// Activatie - Verwijder oude caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames
                    .filter(name => name !== CACHE_NAME)
                    .map(name => caches.delete(name))
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch - Network first, fallback to cache
self.addEventListener('fetch', (event) => {
    event.respondWith(
        fetch(event.request)
            .then(response => {
                // Kopieer en cache het antwoord
                const responseClone = response.clone();
                caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, responseClone);
                });
                return response;
            })
            .catch(() => {
                // Fallback naar cache bij geen netwerk
                return caches.match(event.request);
            })
    );
});
