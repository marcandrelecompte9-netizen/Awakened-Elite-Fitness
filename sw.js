// Awakened — Service Worker
// Enables full offline support and PWA installation
// Strategy: network-first for code files (HTML/JS/CSS), cache-first for assets (images/fonts)

const CACHE_NAME = 'awakened-v418';
const ASSETS = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/exercises.js',
  '/js/disciplines.js',
  '/js/exercise-visuals.js',
  '/js/strength-standards.js',
  '/js/system-cards.js',
  '/js/share-card.js',
  '/js/app.js',
  '/js/final-boss.js',
  '/js/adventure.js',
  '/js/economy.js',
  '/js/challenges.js',
  '/data/items.js',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/images/banner.png',
  '/images/avatars/avatar_homme.png',
  '/images/avatars/avatar_femme.png',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js',
  'https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap',
];

// Identifie les fichiers critiques (code) → network-first pour avoir les MAJ immédiates
function isCodeFile(url) {
  return /\.(html|js|css)(\?|$)/.test(url) || url.endsWith('/');
}

// Install — cache all core assets (résilient : un fichier manquant ne casse pas tout)
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // Cache chaque asset individuellement pour qu'un 404 ne fasse pas échouer toute l'install
      return Promise.allSettled(
        ASSETS.map(url => cache.add(url).catch(err => {
          console.warn('[SW] Asset non mis en cache:', url, err);
        }))
      );
    }).then(() => self.skipWaiting())
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

// Fetch — network-first for code (HTML/JS/CSS), cache-first for assets
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  const url = e.request.url;

  // 🌐 NETWORK-FIRST pour les fichiers de code (HTML, JS, CSS)
  // → les modifications de code apparaissent immédiatement
  if (isCodeFile(url)) {
    e.respondWith(
      fetch(e.request)
        .then(response => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
          }
          return response;
        })
        .catch(() => {
          // Offline : retourner du cache
          return caches.match(e.request).then(cached => {
            if (cached) return cached;
            if (e.request.mode === 'navigate') return caches.match('/index.html');
            return new Response('', { status: 503, statusText: 'Offline' });
          });
        })
    );
    return;
  }

  // 💾 CACHE-FIRST pour les assets (images, fonts, etc.)
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) {
        // Refresh en arrière-plan pour les images d'exercices
        if (url.includes('/images/exercises/')) {
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
        if (url.includes('/images/') || url.includes('.webp') || url.includes('.png') ||
            url.includes('.woff') || url.includes('.svg')) {
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        }
        return response;
      }).catch(() => {
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
