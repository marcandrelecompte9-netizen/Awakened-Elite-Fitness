// Awakened — Service Worker
// Enables full offline support and PWA installation
// Strategy: network-first for code files (HTML/JS/CSS), cache-first for assets (images/fonts)

const CACHE_NAME = 'awakened-v1724';
// v1586 : images d'exercices dans un cache DURABLE, jamais vidé à une mise à jour
// (avant : chaque déploiement les effaçait → retéléchargées, absentes hors ligne)
const IMG_CACHE = 'awakened-images';
const ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './js/native.js',
  './js/essai.js',
  './js/exercises.js',
  './js/disciplines.js',
  './js/eveil.js',
  './js/exercise-visuals.js',
  './js/strength-standards.js',
  './js/system-cards.js',
  './js/story-events.js',
  './js/share-card.js',
  './js/app.js',
  './js/failles.js',
  './js/calendar-tab.js',
  './js/routine-blocks.js',
  './js/routine-builder.js',
  './js/etirements.js',
  './js/etoiles-enfants.js',
  './js/recompenses-adultes.js',
  './js/icons.js',
  './js/no-emoji.js',
  './js/stat-noms.js',
  './js/fenetres.js',
  './js/seuil.js',
  './js/qrcode.js',
  './js/partage-seance.js',
  './js/salle.js',
  './js/sports.js',
  './js/strength-balance.js',
  './js/analyse.js',
  './js/limitations.js',
  './js/custom-exercises.js',
  './images/calendar_banner.webp',
  './images/kiosk_bg.webp',
  './images/tree_bg.webp',
  './images/calendar_empty.webp',
  './js/awakening-tree.js',
  './js/ui-kit.js',
  './js/feature-map.js',
  './js/visite.js',
  './js/weekly-recap.js',
  './js/final-boss.js',
  './js/adventure.js',
  './js/economy.js',
  './js/challenges.js',
  './js/family-boss.js',
  './js/family-network.js',
  './js/family-challenge.js',
  './js/family-goal.js',
  './js/family-feed.js',
  './js/pre-workout-mood.js',
  './js/workout-games.js',
  './js/kids-games.js',
  './js/bilan-4sem.js',
  './js/home-pro.js',
  './js/echelle.js',
  './js/seance-ecran.js',
  './js/regle-mesures.js',
  './js/photos-mesures.js',
  './js/back-button.js',
  './js/gestures.js',
  './js/rift-visuals.js',
  './js/musique.js',
  './js/family-sky.js',
  './js/family-week.js',
  './js/session-ux.js',
  './js/progress-tab.js',
  './js/progres-onglets.js',
  './js/dev-outils.js',
  './js/ressenti.js',
  './js/mission-semaine.js',
  './js/xp-fin.js',
  './js/fin-seance.js',
  './js/import-csv.js',
  './js/reglage-machine.js',
  './js/dev-temps.js',
  './js/mon-defi.js',
  './js/health-sync.js',
  './js/regle.js',
  './js/run-gps.js',
  './js/run-coach.js',
  './js/backup.js',
  './js/routine-print.js',
  './js/item-icons.js',
  './js/skill-tree.js',
  './js/nav-icons.js',
  './js/exercise-names.js',
  './js/group-workout.js',
  './js/duo.js',
  './js/youth-safety.js',
  './js/kids-programs.js',
  './js/senior-programs.js',
  './js/adaptive.js',
  './js/pain-mode.js',
  './js/recovery-mode.js',
  './data/items.js',
  './manifest.json?v=1724',
  './icons/icon-192.png?v=1724',
  './icons/icon-512.png?v=1724',
  './icons/icon-192-maskable.png?v=1724',
  './icons/icon-512-maskable.png?v=1724',
  // icon-1024.png : asset de soumission aux stores, volontairement hors du
  // précache (487 Ko). Reste dans manifest.json, récupérable à la demande.
  './images/banner_v3.webp',
  './images/banner_v3_mobile.webp',
  './images/avatars/avatar_homme.png',
  './images/avatars/avatar_femme.png',
  './js/vendor/chart.umd.min.js',
  './js/vendor/leaflet.js',
  './css/leaflet.css',
  './fonts/outfit-latin-400-normal.woff2',
  './fonts/outfit-latin-500-normal.woff2',
  './fonts/outfit-latin-600-normal.woff2',
  './fonts/outfit-latin-700-normal.woff2',
  './fonts/outfit-latin-800-normal.woff2',
  './fonts/outfit-latin-900-normal.woff2',
  './fonts/rajdhani-latin-600-normal.woff2',
  './fonts/rajdhani-latin-700-normal.woff2',
];

// v1623 : images d'interface (fonds, silhouettes, coffres, avatars, compagnons, ~3,5 Mo)
// mises en cache durable en arrière-plan à l'activation : disponibles hors ligne
// même si on ne les a jamais vues en ligne. (Les images d'exercices de la
// semaine sont préchargées par la page : awakPrechargerImages, exercise-visuals.js.)
const UI_IMAGES = [
  './images/Coffres/coffre_commun.webp',
  './images/Coffres/coffre_commun_ouvert.webp',
  './images/Coffres/coffre_epique.webp',
  './images/Coffres/coffre_epique_ouvert.webp',
  './images/Coffres/coffre_rare.webp',
  './images/Coffres/coffre_rare_ouvert.webp',
  './images/avatars/avatar_femme.png',
  './images/avatars/avatar_homme.png',
  './images/avatars/portrait_01.webp',
  './images/avatars/portrait_02.webp',
  './images/avatars/portrait_03.webp',
  './images/avatars/portrait_04.webp',
  './images/avatars/portrait_05.webp',
  './images/avatars/portrait_06.webp',
  './images/avatars/portrait_07.webp',
  './images/avatars/portrait_08.webp',
  './images/avatars/portrait_09.webp',
  './images/avatars/portrait_10.webp',
  './images/avatars/portrait_11.webp',
  './images/avatars/portrait_12.webp',
  './images/banner_v3.webp',
  './images/banner_v3_mobile.webp',
  './images/body/body_dos.webp',
  './images/body/body_face.webp',
  './images/calendar_banner.webp',
  './images/calendar_empty.webp',
  './images/card_bg_femme_v2.webp',
  './images/card_bg_homme_v2.webp',
  './images/carte_ville.webp',
  './images/combat_bg_v1.webp',
  './images/companions/chen.webp',
  './images/companions/elise.webp',
  './images/companions/kira.webp',
  './images/companions/marcus.webp',
  './images/companions/yuna.webp',
  './images/constellation_bg.webp',
  './images/faille_fermee_bg.webp',
  './images/faille_ouverte.webp',
  './images/journal_bg.webp',
  './images/kiosk_bg.webp',
  './images/miroir_vide.webp',
  './images/salle_bg_v5.webp',
  './images/seuil_fond.webp',
  './images/tree_bg.webp',
];
// Clé de cache d'une image : sans « ?v=NNNN ». Avant, chaque build changeait l'URL
// (salle_bg_v5.webp?v=1621 → ?v=1724) et ajoutait une copie de plus dans le cache
// durable, sans jamais la retirer.
function cleImage(url) { return url.split('?')[0]; }
// v1654 : images REMPLACÉES sous le même nom → retirées une fois du cache durable,
// sinon le téléphone garde l'ancienne (ex. silhouette « Ton corps » décalée de ses zones).
// Ajouter ici tout fichier remplacé, et monter « rev ».
const IMAGES_REMPLACEES = { rev: 1654, fichiers: ['./images/body/body_face.webp', './images/body/body_dos.webp'] };
function purgerRemplacees() {
  return caches.open(IMG_CACHE).then(cache => {
    const marque = new URL('./__purge_' + IMAGES_REMPLACEES.rev, self.registration.scope).href;
    return cache.match(marque).then(fait => fait ? null : Promise.all(IMAGES_REMPLACEES.fichiers.map(f =>
      cache.delete(new URL(f, self.registration.scope).href, { ignoreSearch: true })))
      .then(() => cache.put(marque, new Response('1'))));
  }).catch(() => {});
}
function estImage(url) { return /\/images\/|\.(webp|png|jpe?g|svg|gif)(\?|$)/i.test(url); }

// Identifie les fichiers critiques (code) → network-first pour avoir les MAJ immédiates
function isCodeFile(url) {
  // 🐛 `url.endsWith('./')` ne matchait JAMAIS : une URL réelle ne se termine
  // pas par « ./ ». La page racine du site (.../fitpro/) n'était donc pas
  // traitée comme du code → servie en CACHE-FIRST, donc figée sur une
  // ancienne version d'index.html même après déploiement.
  // 📱 manifest.json est TRAITÉ COMME DU CODE (network-first).
  // ⚠️ Servi depuis le cache, Android reconstruisait l'app installée avec
  //    l'ANCIEN manifest — donc toujours verrouillée en portrait, même après
  //    une réinstallation. Il doit toujours venir du réseau quand c'est possible.
  return /\.(html|js|css|webmanifest)(\?|$)/.test(url)
      || /manifest\.json(\?|$)/.test(url)
      || /\/(\?|$)/.test(url);
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
      // v1586 : seulement les ANCIENS caches d'Awakened (sur GitHub Pages, l'origine est
      // partagée avec les autres projets du compte : on ne touche pas à leurs caches)
      Promise.all(keys.filter(k => k !== CACHE_NAME && k !== IMG_CACHE && /^(awakened-v|fitpro)/.test(k)).map(k => caches.delete(k)))
    ).then(() => migrerImages())
     .then(() => purgerRemplacees())
     .then(() => self.clients.claim())
     .then(() => { prechargerUI(); })   // v1623 : sans attendre (arrière-plan)
  );
});

// v1623 : ramène les copies « ?v=NNNN » du cache d'images à une seule entrée sans requête
function migrerImages() {
  return caches.open(IMG_CACHE).then(cache => cache.keys().then(reqs => Promise.all(reqs.map(req => {
    if (req.url.indexOf('?') < 0) return null;
    const cle = cleImage(req.url);
    return cache.match(cle).then(deja => deja ? null : cache.match(req).then(r => r && cache.put(cle, r)))
      .then(() => cache.delete(req));
  })))).catch(() => {});
}
function prechargerUI() {
  return caches.open(IMG_CACHE).then(cache => Promise.all(UI_IMAGES.map(u => {
    const abs = new URL(u, self.registration.scope).href;
    return cache.match(abs).then(deja => deja ? null : fetch(abs).then(r => { if (r && r.status === 200) return cache.put(abs, r); }).catch(() => {}));
  }))).catch(() => {});
}

// Fetch — network-first for code (HTML/JS/CSS), cache-first for assets
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  const url = e.request.url;

  // 🎵 v1471 : l'audio n'est PAS intercepté (requêtes « Range » : Safari refuse de
  // lire une musique servie d'un bloc par le service worker).
  if (/\.(mp3|m4a|aac|ogg|wav)(\?|$)/i.test(url) || e.request.headers.has('range')) return;

  // 🌐 NETWORK-FIRST pour les fichiers de code (HTML, JS, CSS)
  // → les modifications de code apparaissent immédiatement
  // Toute NAVIGATION (ouverture de l'app) est traitée comme du code : on veut
  // toujours la dernière page, avec repli sur le cache si hors ligne.
  if (isCodeFile(url) || e.request.mode === 'navigate') {
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
          // Offline : retourner du cache. v1586 : repli SANS le ?v=NNNN (le précache
          // garde « js/app.js » alors que la page demande « js/app.js?v=NNNN »)
          return caches.match(e.request).then(cached => cached || caches.match(e.request, { ignoreSearch: true })).then(cached => {
            if (cached) return cached;
            if (e.request.mode === 'navigate') return caches.match('./index.html');
            return new Response('', { status: 503, statusText: 'Offline' });
          });
        })
    );
    return;
  }

  // 🖼️ v1623 : IMAGES — cache durable sans « ?v= », servies du cache puis rafraîchies
  // en arrière-plan (une image remplacée apparaît à la vue suivante).
  if (estImage(url)) {
    const cle = cleImage(url);
    e.respondWith(
      caches.open(IMG_CACHE).then(cache => cache.match(cle)
        .then(cached => cached || caches.match(e.request) || null)
        .then(cached => {
          const reseau = () => fetch(e.request).then(r => {
            if (r && r.status === 200 && r.type !== 'opaque') cache.put(cle, r.clone());
            return r;
          });
          if (cached) {
            // rafraîchir au plus une fois par jour (v1654 : 3 jours → 1 jour)
            const d = Date.parse(cached.headers.get('date') || '');
            if (!d || Date.now() - d > 86400000) reseau().catch(() => {});
            return cached;
          }
          return reseau().catch(() => caches.match(e.request, { ignoreSearch: true })
            .then(c2 => c2 || new Response('', { status: 503, statusText: 'Offline' })));
        }))
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
              caches.open(IMG_CACHE).then(c => c.put(e.request, response));
            }
          }).catch(() => {});
        }
        return cached;
      }
      return fetch(e.request).then(response => {
        if (!response || response.status !== 200 || response.type === 'opaque') return response;
        const clone = response.clone();
        if (url.includes('/images/') || url.includes('.webp') || url.includes('.png') ||
            url.includes('.jpg') || url.includes('.woff') || url.includes('.svg')) {
          // images → cache durable ; le reste (polices…) → cache de la version
          caches.open(/\/images\/|\.(webp|png|jpe?g|svg)(\?|$)/.test(url) ? IMG_CACHE : CACHE_NAME).then(c => c.put(e.request, clone));
        }
        return response;
      }).catch(() => {
        if (e.request.mode === 'navigate') return caches.match('./index.html');
        return new Response('', { status: 503, statusText: 'Offline' });
      });
    })
  );
});

// Messages depuis l'app (pour forcer la mise à jour)
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});
