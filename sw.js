// Awakened — Service Worker
// Enables full offline support and PWA installation

const CACHE_NAME = 'awakened-v6';
const ASSETS = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/exercises.js',
  '/js/exercise-visuals.js',
  '/js/app.js',
  '/js/adventure.js',
  '/js/challenges.js',
  '/data/items.js',
  '/manifest.json',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js',
  'https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap',
  'https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.19.0/tabler-icons.min.css'
];

// Install — cache all core assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

// Activate — clean up old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch — cache-first strategy with auto-cache for images
self.addEventListener('fetch', e => {
  // Ignorer les requêtes non-GET (POST, PUT...)
  if (e.request.method !== 'GET') return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) {
        // Pour les images d'exercices : refresh en arrière-plan
        if (e.request.url.includes('/images/exercises/')) {
          fetch(e.request).then(response => {
            if (response && response.status === 200) {
              caches.open(CACHE_NAME).then(c => c.put(e.request, response));
            }
          }).catch(() => {});
        }
        return cached;
      }
      return fetch(e.request).then(response => {
        if (!response || response.status !== 200 || response.type === 'opaque') return response;
        const clone = response.clone();
        // Cache automatique pour : images, fonts, JS, CSS
        const url = e.request.url;
        if (url.includes('/images/') || url.includes('.webp') || url.includes('.png') ||
            url.includes('.woff') || url.includes('.js') || url.includes('.css')) {
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        }
        return response;
      }).catch(() => {
        // Offline fallback
        if (e.request.mode === 'navigate') return caches.match('/index.html');
        return new Response('', { status: 503, statusText: 'Offline' });
      });
    })
  );
});

// Messages depuis l'app (pour forcer la mise à jour)
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});
