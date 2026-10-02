/* ═══════════════════════════════════════════════════════════════════════
   COUCHE NATIVE — Awakened  (préparation de l'app Play Store / Capacitor)
   -----------------------------------------------------------------------
   Une seule porte d'entrée pour tout ce que le téléphone fait mieux qu'un
   navigateur. Chaque fonction :
     • utilise le module NATIF quand l'app tourne dans Capacitor ;
     • sinon retombe sur l'API web actuelle (PWA sur GitHub Pages).
   La PWA fonctionne donc exactement comme avant ; le jour de l'emballage
   Capacitor, il suffit d'installer les modules listés ci-dessous.

   MODULES CAPACITOR VISÉS (npm) :
     @capacitor/app                              → bouton Retour, quitter
     @capacitor/haptics                          → vibrations
     @capacitor/preferences                      → copie de sécurité des données
     @capacitor/share                            → partage natif
     @capacitor/filesystem                       → export de la sauvegarde
     @capacitor-community/background-geolocation → GPS écran verrouillé
     @capacitor/geolocation                      → GPS (repli sans arrière-plan)
     @capacitor-community/keep-awake             → écran allumé
     @capacitor-community/text-to-speech         → voix (baisse la musique proprement)
     @capgo/capacitor-health                     → Health Connect (Galaxy Watch : pouls,
                                                   pas, sommeil, séances) — js/health-sync.js
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  function cap() { return window.Capacitor || null; }
  function estNatif() {
    try { var c = cap(); return !!(c && (typeof c.isNativePlatform === 'function' ? c.isNativePlatform() : c.isNative)); }
    catch (e) { return false; }
  }
  function plugin(nom) {
    if (!estNatif()) return null;
    try {
      var c = cap();
      if (c.Plugins && c.Plugins[nom]) return c.Plugins[nom];
      if (typeof c.registerPlugin === 'function') return c.registerPlugin(nom);
    } catch (e) {}
    return null;
  }
  function dispo(nom) {
    try { var c = cap(); return estNatif() && (typeof c.isPluginAvailable === 'function' ? c.isPluginAvailable(nom) : !!plugin(nom)); }
    catch (e) { return false; }
  }

  // ═══ GPS ═════════════════════════════════════════════════════════════
  // Même forme de position que l'API web : { coords:{latitude, longitude,
  // accuracy, speed, altitude}, timestamp }. Retourne un identifiant à
  // passer à geo.arreter().
  var geo = {
    arrierePlan: function () { return dispo('BackgroundGeolocation'); },
    suivre: function (surPos, surErr, opts) {
      opts = opts || {};
      // 1) Natif, en ARRIÈRE-PLAN : continue écran verrouillé, avec une
      //    notification permanente (exigée par Android pour ce service).
      if (dispo('BackgroundGeolocation')) {
        var BG = plugin('BackgroundGeolocation');
        var ref = { type: 'bg', id: null, annule: false };
        BG.addWatcher({
          backgroundTitle: opts.titre || 'Awakened',
          backgroundMessage: opts.message || 'Sortie en cours : distance et allure suivies.',
          requestPermissions: true,
          stale: false,
          distanceFilter: 0
        }, function (loc, err) {
          if (err) {
            if (err.code === 'NOT_AUTHORIZED') { surErr && surErr({ code: 1, message: 'refus' }); return; }
            surErr && surErr({ code: 2, message: String(err.message || err) });
            return;
          }
          if (!loc) return;
          surPos({
            coords: { latitude: loc.latitude, longitude: loc.longitude, accuracy: loc.accuracy,
                      speed: loc.speed, altitude: loc.altitude },
            timestamp: loc.time || Date.now()
          });
        }).then(function (id) {
          ref.id = id;
          if (ref.annule) { try { BG.removeWatcher({ id: id }); } catch (e) {} }
        });
        return ref;
      }
      // 2) Natif simple (sans arrière-plan)
      if (dispo('Geolocation')) {
        var G = plugin('Geolocation');
        var r2 = { type: 'cap', id: null, annule: false };
        G.watchPosition({ enableHighAccuracy: true, maximumAge: 0, timeout: 20000 }, function (pos, err) {
          if (err) { surErr && surErr({ code: /denied|permission/i.test(String(err.message)) ? 1 : 2 }); return; }
          if (pos) surPos(pos);
        }).then(function (id) { r2.id = id; if (r2.annule) { try { G.clearWatch({ id: id }); } catch (e) {} } });
        return r2;
      }
      // 3) Web
      if (!('geolocation' in navigator)) { surErr && surErr({ code: 2, message: 'indisponible' }); return null; }
      return { type: 'web', id: navigator.geolocation.watchPosition(surPos, surErr,
        { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 }) };
    },
    arreter: function (ref) {
      if (!ref) return;
      try {
        if (ref.type === 'bg') { if (ref.id) plugin('BackgroundGeolocation').removeWatcher({ id: ref.id }); else ref.annule = true; }
        else if (ref.type === 'cap') { if (ref.id) plugin('Geolocation').clearWatch({ id: ref.id }); else ref.annule = true; }
        else navigator.geolocation.clearWatch(ref.id);
      } catch (e) {}
    },
    disponible: function () { return dispo('BackgroundGeolocation') || dispo('Geolocation') || ('geolocation' in navigator); }
  };

  // ═══ ÉCRAN ALLUMÉ ═══════════════════════════════════════════════════
  var _wake = null;
  var ecran = {
    garder: function () {
      if (dispo('KeepAwake')) { try { plugin('KeepAwake').keepAwake(); } catch (e) {} return; }
      try {
        if ('wakeLock' in navigator && !_wake) {
          navigator.wakeLock.request('screen').then(function (w) {
            _wake = w; w.addEventListener('release', function () { _wake = null; });
          }).catch(function () {});
        }
      } catch (e) {}
    },
    liberer: function () {
      if (dispo('KeepAwake')) { try { plugin('KeepAwake').allowSleep(); } catch (e) {} return; }
      try { if (_wake) _wake.release(); } catch (e) {}
      _wake = null;
    }
  };

  // ═══ VOIX ═══════════════════════════════════════════════════════════
  // Retourne true si le natif a pris la phrase en charge ; sinon l'appelant
  // utilise la voix web habituelle (speak() d'app.js).
  var voix = {
    parler: function (texte) {
      if (!texte || !dispo('TextToSpeech')) return false;
      try {
        // category 'ambient' : la musique de l'utilisateur baisse puis remonte
        plugin('TextToSpeech').speak({ text: texte, lang: 'fr-CA', rate: 1.0, pitch: 1.0, volume: 1.0, category: 'ambient' });
        return true;
      } catch (e) { return false; }
    }
  };

  // ═══ VIBRATIONS ═════════════════════════════════════════════════════
  function vibrer(motif) {
    if (dispo('Haptics')) {
      try {
        var total = Array.isArray(motif) ? motif.reduce(function (s, v, i) { return i % 2 ? s : s + v; }, 0) : (motif || 30);
        plugin('Haptics').vibrate({ duration: Math.min(1000, total) });
      } catch (e) {}
      return;
    }
    try { if (navigator.vibrate) navigator.vibrate(motif); } catch (e) {}
  }

  // ═══ BOUTON RETOUR ══════════════════════════════════════════════════
  // En natif, Android envoie directement l'appui : plus besoin de la
  // « réserve » d'historique de back-button.js.
  var retour = {
    natif: function () { return dispo('App'); },
    ecouter: function (fn) {
      if (!dispo('App')) return false;
      try { plugin('App').addListener('backButton', function () { fn(); }); return true; } catch (e) { return false; }
    },
    quitter: function () {
      if (dispo('App')) { try { plugin('App').exitApp(); return true; } catch (e) {} }
      return false;
    }
  };

  // ═══ PARTAGE ════════════════════════════════════════════════════════
  function partager(d) {
    d = d || {};
    if (dispo('Share')) {
      return plugin('Share').share({ title: d.title, text: d.text, url: d.url, files: d.files, dialogTitle: d.title });
    }
    if (navigator.share) return navigator.share({ title: d.title, text: d.text, url: d.url });
    return Promise.reject(new Error('partage indisponible'));
  }

  // ═══ EXPORTER UN FICHIER (sauvegarde, transfert vers l'app) ═════════
  // Sur téléphone, un « téléchargement » finit souvent perdu dans un dossier.
  // On ouvre plutôt la feuille de partage : Drive, courriel, Messages…
  // Retourne une promesse : true si le partage a été lancé, false sinon
  // (l'appelant fait alors un téléchargement classique).
  function exporterFichier(nom, texte, type) {
    type = type || 'application/json';
    try {
      if (dispo('Filesystem') && dispo('Share')) {
        return plugin('Filesystem').writeFile({ path: nom, data: texte, directory: 'CACHE', encoding: 'utf8' })
          .then(function (r) { return plugin('Share').share({ title: nom, files: [r.uri], dialogTitle: 'Sauvegarde Awakened' }); })
          .then(function () { return true; }, function () { return false; });
      }
      var mobile = /Android|iPhone|iPad/i.test(navigator.userAgent || '');
      if (mobile && navigator.canShare && typeof File === 'function') {
        var f = new File([texte], nom, { type: type });
        if (navigator.canShare({ files: [f] })) {
          // ⚠️ appel IMMÉDIAT (le partage exige le geste de l'utilisateur en cours)
          return navigator.share({ files: [f], title: nom }).then(function () { return true; }, function (e) {
            return !!(e && e.name === 'AbortError');    // annulé par l'utilisateur : ne pas télécharger en plus
          });
        }
      }
    } catch (e) {}
    return Promise.resolve(false);
  }

  // ═══ RACCOURCIS DE L'ICÔNE (appui long sur l'icône de l'app) ═════════
  // manifest.json → shortcuts : ./?go=seance | course | agenda | routines
  function raccourci() {
    var go = null;
    try { go = new URLSearchParams(location.search).get('go'); } catch (e) {}
    if (!go) return;
    try {
      var u = new URL(location.href);
      u.searchParams.delete('go');
      history.replaceState(history.state, '', u.pathname + u.search + u.hash);
    } catch (e) {}
    var essais = 0;
    (function lancer() {
      if (typeof window.switchTab !== 'function') { if (essais++ < 20) setTimeout(lancer, 250); return; }
      try {
        if (go === 'seance') window.switchTab('workouts');
        else if (go === 'routines') window.switchTab('routines');
        else if (go === 'agenda') window.switchTab('calendar');
        else if (go === 'course') { if (window.AwakRun) window.AwakRun.ouvrir(); else window.switchTab('workouts'); }
      } catch (e) {}
    })();
  }
  window.addEventListener('load', function () { setTimeout(raccourci, 900); });

  // ═══ COPIE DE SÉCURITÉ DES DONNÉES ══════════════════════════════════
  // Le stockage d'une WebView peut être vidé par le système dans de rares
  // cas (nettoyage, mise à jour). En natif, on recopie localStorage dans
  // les Préférences de l'app quand elle passe en arrière-plan, et on
  // restaure au démarrage si localStorage est vide. Sans effet en PWA.
  var CLE_SAUVEGARDE = 'awakSauvegardeLocale';
  function sauvegarder() {
    if (!dispo('Preferences')) return;
    try {
      var o = {};
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k) o[k] = localStorage.getItem(k);
      }
      plugin('Preferences').set({ key: CLE_SAUVEGARDE, value: JSON.stringify({ t: Date.now(), d: o }) });
    } catch (e) {}
  }
  function restaurerSiVide() {
    if (!dispo('Preferences')) return;
    try {
      if (localStorage.length > 3) return;      // données présentes : rien à faire
      plugin('Preferences').get({ key: CLE_SAUVEGARDE }).then(function (r) {
        if (!r || !r.value) return;
        var s = JSON.parse(r.value);
        if (!s || !s.d) return;
        Object.keys(s.d).forEach(function (k) { try { localStorage.setItem(k, s.d[k]); } catch (e) {} });
        location.reload();
      });
    } catch (e) {}
  }
  if (estNatif()) {
    restaurerSiVide();
    document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') sauvegarder(); });
    setInterval(sauvegarder, 5 * 60 * 1000);
  }

  window.AwakNative = {
    estNatif: estNatif, dispo: dispo, plugin: plugin,
    geo: geo, ecran: ecran, voix: voix, vibrer: vibrer,
    retour: retour, partager: partager, sauvegarder: sauvegarder, exporterFichier: exporterFichier
  };
})();
