/* ═══════════════════════════════════════════════════════════════════════
   COURSE GPS — Awakened  (remplace le « Timer Simple » de Cardio & intensité)
   -----------------------------------------------------------------------
   Course · Marche · Vélo avec le GPS du téléphone :
   • en direct : temps, distance, allure actuelle et moyenne, signal GPS ;
   • annonce vocale à chaque kilomètre ;
   • carte du parcours (OpenStreetMap via Leaflet, chargés à la demande) ;
     sans réseau, repli automatique sur le tracé SVG (marche hors ligne) ;
   • enregistrement : historique des sorties, records, séance dans
     l'historique général, XP en mode jeu.

   ⚠️ LIMITE D'UNE APPLICATION WEB : le GPS s'arrête quand l'écran s'éteint
   ou qu'on change d'application. On garde donc l'écran allumé (Wake Lock),
   on affiche un écran sombre, et on SIGNALE les coupures au lieu de compter
   une distance inventée.

   FILTRAGE GPS (sinon la distance gonfle toute seule à l'arrêt) :
   • points de précision > 35 m ignorés ;
   • déplacement < max(3 m, précision × 0,4) ignoré (bruit) ;
   • vitesse impossible pour l'activité ignorée (saut de signal) ;
   • après une pause ou une coupure > 20 s, le point suivant repart à neuf.
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var ACTIVITES = {
    course: { nom: 'Course', vmax: 9,  exo: 'Course longue (Endurance Run)', ico: '<path d="M13 4a2 2 0 1 0 0-.01M7 21l3-6 3 2v4M10 15l2-6 4 3 3-1M9 9l3-1"/>' },
    marche: { nom: 'Marche', vmax: 3.5, exo: 'Marche rapide (Power Walk)',   ico: '<path d="M13 4a2 2 0 1 0 0-.01M10 21l2-7 3 3v4M9 11l3-3 3 3 2 1"/>' },
    velo:   { nom: 'Vélo',   vmax: 22, exo: 'Vélo stationnaire',             ico: '<circle cx="6" cy="17" r="3.5"/><circle cx="18" cy="17" r="3.5"/><path d="M6 17l4-8h5l3 8M10 9l2 8"/>' }
  };
  var PRECISION_MAX = 35, COUPURE_S = 20;
  var ACCENT = '#22d3ee';

  var R = null;          // course en cours
  var wake = null;

  // ── 🗺️ CARTE (v1231) ──────────────────────────────────────────────
  // Leaflet + tuiles OpenStreetMap, chargés SEULEMENT à l'ouverture d'une
  // course (pas dans le cache de l'app). Tuiles assombries par filtre CSS.
  // Sans réseau (ou si le chargement échoue en 8 s), on garde le tracé SVG.
  var LEAFLET_JS = 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js';
  var LEAFLET_CSS = 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css';
  var _lfEtat = 0, _lfAttente = [];   // 0 = pas chargé, 1 = en cours, 2 = prêt, -1 = échec
  function chargerCarte(cb) {
    if (window.L && window.L.map) { _lfEtat = 2; cb(true); return; }
    if (_lfEtat === -1 || !navigator.onLine) { cb(false); return; }
    _lfAttente.push(cb);
    if (_lfEtat === 1) return;
    _lfEtat = 1;
    var fini = function (ok) {
      if (_lfEtat !== 1) return;
      _lfEtat = ok ? 2 : -1;
      var l = _lfAttente; _lfAttente = [];
      l.forEach(function (f) { try { f(ok); } catch (e) {} });
    };
    try {
      if (!document.getElementById('awkLeafletCss')) {
        var c = document.createElement('link'); c.id = 'awkLeafletCss'; c.rel = 'stylesheet'; c.href = LEAFLET_CSS;
        document.head.appendChild(c);
        var st = document.createElement('style');
        st.textContent = '.awk-tuile{filter:invert(1) hue-rotate(180deg) brightness(0.85) contrast(0.9) saturate(0.6);}'
          + '.awk-carte{background:#0b0f16 !important;border-radius:14px;}'
          + '.awk-carte .leaflet-control-attribution{background:rgba(5,7,11,0.7) !important;color:#64748b !important;font-size:9px !important;}'
          + '.awk-carte .leaflet-control-attribution a{color:#94a3b8 !important;}'
          + '@keyframes awkPouls{0%{transform:scale(1);opacity:.7}100%{transform:scale(2.6);opacity:0}}'
          + '.awk-moi-wrap{background:none !important;border:none !important;}'
          + '.awk-moi{position:relative;width:16px;height:16px;border-radius:50%;background:#22d3ee;border:3px solid #fff;box-shadow:0 0 10px rgba(34,211,238,.8);box-sizing:border-box;}'
          + '.awk-moi::after{content:"";position:absolute;inset:-3px;border-radius:50%;background:#22d3ee;animation:awkPouls 1.6s ease-out infinite;}';
        document.head.appendChild(st);
      }
      var sc = document.createElement('script'); sc.src = LEAFLET_JS; sc.async = true;
      sc.onload = function () { fini(!!(window.L && window.L.map)); };
      sc.onerror = function () { fini(false); };
      document.head.appendChild(sc);
      setTimeout(function () { fini(!!(window.L && window.L.map)); }, 8000);
    } catch (e) { fini(false); }
  }
  // Crée une carte dans `hote`. Retourne { map, ligne, moi } ou null.
  function creerCarte(hote, hauteur) {
    if (!hote || !window.L) return null;
    hote.innerHTML = '';
    var div = document.createElement('div');
    div.className = 'awk-carte';
    div.style.cssText = 'height:' + hauteur + 'px;width:100%;';
    hote.appendChild(div);
    var map = L.map(div, { zoomControl: false, attributionControl: true });
    try { map.attributionControl.setPrefix('<a href="https://leafletjs.com" target="_blank" rel="noopener">Leaflet</a>'); } catch (e) {}
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19, className: 'awk-tuile',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>'
    }).addTo(map);
    var ligne = L.polyline([], { color: ACCENT, weight: 5, opacity: 0.95, lineCap: 'round', lineJoin: 'round' }).addTo(map);
    var moi = L.marker([0, 0], { icon: L.divIcon({ className: 'awk-moi-wrap', html: '<div class="awk-moi"></div>', iconSize: [16, 16], iconAnchor: [8, 8] }), interactive: false });
    return { map: map, ligne: ligne, moi: moi };
  }
  // Points [lat, lon, rupture] → segments Leaflet (une rupture = nouveau segment)
  function segments(points) {
    var segs = [], cur = [];
    (points || []).forEach(function (p) {
      if (!p || !isFinite(p[0])) return;
      if (p[2] && cur.length) { segs.push(cur); cur = []; }
      cur.push([p[0], p[1]]);
    });
    if (cur.length) segs.push(cur);
    return segs;
  }
  function majCarte() {
    if (!R || !R._carte) return;
    var c = R._carte;
    try {
      if (R._nbCarte !== R.points.length) { R._nbCarte = R.points.length; c.ligne.setLatLngs(segments(R.points)); }
      if (R.pos) {
        var ll = [R.pos.lat, R.pos.lon];
        c.moi.setLatLng(ll);
        if (!c.map.hasLayer(c.moi)) c.moi.addTo(c.map);
        if (!R._centre) { c.map.setView(ll, 17); R._centre = true; }
        else if (!c.map.getBounds().pad(-0.2).contains(ll)) c.map.panTo(ll, { animate: true });
      }
    } catch (e) {}
  }
  function retirerCarte() {
    try { if (R && R._carte) { R._carte.map.remove(); R._carte = null; } } catch (e) {}
  }

  // ── outils ──
  function rad(d) { return d * Math.PI / 180; }
  function dist(a, b) {
    var dLat = rad(b.lat - a.lat), dLon = rad(b.lon - a.lon);
    var h = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return 6371000 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  }
  function hms(s) {
    s = Math.max(0, Math.round(s));
    var h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60;
    return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(x).padStart(2, '0');
  }
  function allure(secParKm) {
    if (!secParKm || !isFinite(secParKm) || secParKm > 3600) return '–:––';
    return hms(secParKm);
  }
  function km(m) { return (m / 1000).toFixed(2); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  var N = function () { return window.AwakNative || null; };
  function parler(t) {
    try { if (N() && N().voix.parler(t)) return; } catch (e) {}
    try { if (typeof speak === 'function') speak(t, { interrupt: true }); } catch (e) {}
  }
  function vibrer(m) {
    try { if (N()) { N().vibrer(m); return; } } catch (e) {}
    try { navigator.vibrate && navigator.vibrate(m); } catch (e) {}
  }
  function toast(m, t) { try { if (typeof showToast === 'function') showToast(m, t || 'info', 2600); } catch (e) {} }
  function ico(d, t, c) {
    return '<svg viewBox="0 0 24 24" width="' + (t || 20) + '" height="' + (t || 20) + '" fill="none" stroke="' + (c || 'currentColor') + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + d + '</svg>';
  }
  function cle() {
    try { return (typeof window._cleProfil === 'function') ? window._cleProfil('awakRuns') : 'awakRuns'; } catch (e) { return 'awakRuns'; }
  }
  function cleLecture() {
    try { return (typeof window._cleProfilLecture === 'function') ? window._cleProfilLecture('awakRuns') : 'awakRuns'; } catch (e) { return 'awakRuns'; }
  }
  function lesSorties() {
    try { var a = JSON.parse(localStorage.getItem(cleLecture()) || '[]'); return Array.isArray(a) ? a : []; } catch (e) { return []; }
  }
  function sauver(a) { try { localStorage.setItem(cle(), JSON.stringify(a.slice(0, 100))); } catch (e) {} }

  // Durée active (pauses exclues)
  function duree() {
    if (!R) return 0;
    var t = R.cumul;
    if (R.etat === 'run') t += (Date.now() - R.repriseTs) / 1000;
    return t;
  }

  // ── Wake Lock : écran allumé pendant la course ──
  function garderEcran() {
    if (N()) { N().ecran.garder(); return; }
    try {
      if ('wakeLock' in navigator && !wake) {
        navigator.wakeLock.request('screen').then(function (w) {
          wake = w; w.addEventListener('release', function () { wake = null; });
        }).catch(function () {});
      }
    } catch (e) {}
  }
  function libererEcran() {
    if (N()) { N().ecran.liberer(); return; }
    try { if (wake) wake.release(); } catch (e) {} wake = null;
  }
  document.addEventListener('visibilitychange', function () {
    if (!R) return;
    if (document.visibilityState === 'visible') {
      garderEcran();
      // En natif avec GPS d'arrière-plan, l'écran éteint ne coupe rien
      var bg = N() && N().geo.arrierePlan();
      if (!bg && R.etat === 'run' && R.dernierFix && (Date.now() - R.dernierFix) / 1000 > COUPURE_S) {
        R.coupures++; R.dernier = null;
        toast('GPS interrompu pendant que l\'écran était éteint', 'warning');
      }
    }
  });

  // ═══ ÉCRAN D'ACCUEIL (choix de l'activité) ═════════════════════════
  function ouvrir() {
    if (R) { afficherCourse(); return; }
    fermerEcran();
    var hist = lesSorties();
    var rec = records(hist);
    var choix = Object.keys(ACTIVITES).map(function (k, i) {
      var a = ACTIVITES[k];
      return '<button data-act="' + k + '" class="awak-run-act" style="flex:1;min-width:0;min-height:auto;padding:12px 6px;border-radius:13px;cursor:pointer;'
        + 'display:flex;flex-direction:column;align-items:center;gap:6px;font-family:inherit;font-weight:800;font-size:0.8em;'
        + (i === 0 ? 'background:rgba(34,211,238,0.14);border:1.5px solid ' + ACCENT + ';color:#fff;' : 'background:rgba(255,255,255,0.03);border:1.5px solid rgba(255,255,255,0.1);color:#94a3b8;')
        + '">' + ico(a.ico, 26) + a.nom + '</button>';
    }).join('');
    var dernieres = hist.slice(0, 5).map(function (s, i) {
      var d = new Date(s.date);
      return '<button onclick="AwakRun.detail(' + i + ')" style="display:flex;align-items:center;gap:10px;width:100%;min-height:auto;padding:10px 4px;border:none;'
        + 'border-top:1px solid rgba(255,255,255,0.06);background:transparent;color:#e2e8f0;font-family:inherit;text-align:left;cursor:pointer;">'
        + '<span style="color:' + ACCENT + ';flex-shrink:0;">' + ico((ACTIVITES[s.type] || ACTIVITES.course).ico, 18) + '</span>'
        + '<span style="flex:1;min-width:0;"><span style="display:block;font-size:0.84em;font-weight:800;">' + km(s.distance) + ' km · ' + hms(s.duree) + '</span>'
        + '<span style="display:block;font-size:0.68em;color:#64748b;">' + d.toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' }) + ' · ' + allure(s.distance > 50 ? s.duree / (s.distance / 1000) : 0) + ' /km</span></span>'
        + '<span style="color:#475569;">›</span></button>';
    }).join('');
    var recHTML = '';
    if (rec.longue) {
      var cell = function (t, v) {
        return '<div style="flex:1;min-width:0;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:11px;padding:9px 6px;text-align:center;">'
          + '<div style="font-size:0.9em;font-weight:900;color:#fbbf24;">' + v + '</div><div style="font-size:0.6em;color:#64748b;font-weight:800;margin-top:2px;">' + t + '</div></div>';
      };
      recHTML = '<div style="font-size:0.6em;letter-spacing:1.6px;color:#fbbf24;font-weight:900;margin:16px 0 8px;">RECORDS · COURSE</div>'
        + '<div style="display:flex;gap:6px;">'
        + cell('MEILLEUR KM', rec.km1 ? hms(rec.km1) : '—')
        + cell('5 KM', rec.km5 ? hms(rec.km5) : '—')
        + cell('10 KM', rec.km10 ? hms(rec.km10) : '—')
        + cell('PLUS LONGUE', km(rec.longue) + ' km') + '</div>';
    }
    var ov = document.createElement('div');
    ov.id = 'awakRunHome';
    ov.style.cssText = 'position:fixed;inset:0;z-index:11500;background:rgba(0,0,0,0.75);display:flex;align-items:flex-end;justify-content:center;';
    ov.onclick = function (e) { if (e.target === ov) ov.remove(); };
    ov.innerHTML = '<div style="width:100%;max-width:480px;max-height:92vh;overflow-y:auto;box-sizing:border-box;background:#0d1117;border:1px solid rgba(34,211,238,0.25);border-radius:20px 20px 0 0;padding:12px 16px calc(18px + env(safe-area-inset-bottom));">'
      + '<div style="width:40px;height:4px;background:rgba(255,255,255,0.15);border-radius:99px;margin:0 auto 12px;"></div>'
      + '<div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">'
      +   '<div style="flex:1;"><div style="font-size:0.6em;letter-spacing:2px;color:' + ACCENT + ';font-weight:900;">GPS</div>'
      +   '<div style="font-size:1.15em;font-weight:900;color:#fff;">Course</div></div>'
      +   '<button onclick="document.getElementById(\'awakRunHome\').remove()" aria-label="Fermer" style="width:36px;height:36px;min-height:auto;padding:0;border-radius:10px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.12);color:#94a3b8;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;">' + ico('<path d="M6 6l12 12M18 6L6 18"/>', 16) + '</button>'
      + '</div>'
      + '<div style="display:flex;gap:8px;">' + choix + '</div>'
      + '<button id="awakRunGo" style="width:100%;margin-top:14px;min-height:auto;padding:16px;border:none;border-radius:14px;cursor:pointer;'
      +   'background:linear-gradient(135deg,#22d3ee,#0891b2);color:#04121f;font-weight:900;font-size:1em;letter-spacing:1px;">DÉMARRER</button>'
      + '<div style="font-size:0.68em;color:#64748b;line-height:1.5;margin-top:10px;">'
      +   ((N() && N().geo.arrierePlan())
            ? 'Le GPS continue écran verrouillé : tu peux ranger ton téléphone et utiliser ta musique.'
            : 'L\'écran reste allumé pendant la sortie : le GPS d\'une application web s\'arrête quand l\'écran s\'éteint. Garde le téléphone en main ou au bras. Ta musique peut jouer en même temps.')
      + '</div>'
      + '<button onclick="document.getElementById(\'awakRunHome\').remove();if(typeof startCardioTimer===\'function\')startCardioTimer()" '
      +   'style="width:100%;margin-top:10px;min-height:auto;padding:11px;border-radius:12px;cursor:pointer;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.1);color:#cbd5e1;font-weight:800;font-size:0.8em;">'
      +   'Sans GPS : tapis, vélo stationnaire, natation…</button>'
      + recHTML
      + (dernieres ? '<div style="font-size:0.6em;letter-spacing:1.6px;color:#94a3b8;font-weight:900;margin:16px 0 4px;">DERNIÈRES SORTIES</div>' + dernieres : '')
      + '</div>';
    document.body.appendChild(ov);
    var choisi = 'course';
    ov.querySelectorAll('.awak-run-act').forEach(function (b) {
      b.onclick = function () {
        choisi = b.getAttribute('data-act');
        ov.querySelectorAll('.awak-run-act').forEach(function (x) {
          var on = x === b;
          x.style.background = on ? 'rgba(34,211,238,0.14)' : 'rgba(255,255,255,0.03)';
          x.style.borderColor = on ? ACCENT : 'rgba(255,255,255,0.1)';
          x.style.color = on ? '#fff' : '#94a3b8';
        });
      };
    });
    document.getElementById('awakRunGo').onclick = function () { ov.remove(); demarrer(choisi); };
  }

  // ═══ COURSE EN DIRECT ═══════════════════════════════════════════════
  function demarrer(type) {
    var dispoGPS = N() ? N().geo.disponible() : ('geolocation' in navigator);
    if (!dispoGPS) { toast('Ce téléphone ne donne pas accès au GPS', 'error'); return; }
    R = {
      type: type, a: ACTIVITES[type] || ACTIVITES.course, debut: Date.now(), etat: 'attente',
      cumul: 0, repriseTs: 0, distance: 0, points: [], dernier: null, dernierFix: 0, precision: null,
      splits: [], prochainKm: 1000, tKmPrec: 0, coupures: 0, recent: [], t5: 0, t10: 0
    };
    garderEcran();
    afficherCourse();
    R.watch = N()
      ? N().geo.suivre(surPosition, surErreur, { titre: 'Awakened · ' + R.a.nom, message: 'Sortie en cours : distance et allure suivies.' })
      : navigator.geolocation.watchPosition(surPosition, surErreur, { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 });
    R.tick = setInterval(maj, 1000);
  }

  function surErreur(err) {
    if (!R) return;
    if (err && err.code === 1) {
      arreterGPS();
      afficherMessage('Accès à la position refusé', 'Autorise la localisation pour Awakened dans les réglages du navigateur, puis réessaie. Tu peux aussi utiliser le chronomètre sans GPS.');
      R = null; libererEcran();
    } else {
      R.precision = null; maj();
    }
  }

  function surPosition(pos) {
    if (!R) return;
    var c = pos.coords, now = pos.timestamp || Date.now();
    R.precision = c.accuracy;
    if (c.accuracy <= 100) R.pos = { lat: c.latitude, lon: c.longitude };   // position affichée sur la carte
    R.dernierFix = Date.now();
    if (R.etat === 'attente' && c.accuracy <= PRECISION_MAX) {
      // Premier point fiable : départ réel du chrono
      R.etat = 'run'; R.repriseTs = Date.now();
      parler('C\'est parti');
      vibrer(60);
    }
    if (R.etat !== 'run' || c.accuracy > PRECISION_MAX) { maj(); return; }

    var p = { lat: c.latitude, lon: c.longitude, t: now };
    if (!R.dernier) { R.dernier = p; R.points.push([+p.lat.toFixed(6), +p.lon.toFixed(6), 1]); maj(); return; }
    var d = dist(R.dernier, p), dt = Math.max(0.5, (now - R.dernier.t) / 1000);
    if (dt > COUPURE_S) {
      // Longue coupure : on accepte si la vitesse est plausible, sinon on repart à neuf
      if (d / dt > R.a.vmax) { R.coupures++; R.dernier = p; R.points.push([+p.lat.toFixed(6), +p.lon.toFixed(6), 1]); maj(); return; }
    }
    if (d < Math.max(3, c.accuracy * 0.4)) { maj(); return; }       // bruit à l'arrêt
    if (d / dt > R.a.vmax * 1.3) { maj(); return; }                  // saut impossible
    var avant = R.distance;
    R.distance += d;
    R.dernier = p;
    R.points.push([+p.lat.toFixed(6), +p.lon.toFixed(6), 0]);
    R.recent.push({ d: R.distance, t: duree() });
    while (R.recent.length > 2 && R.recent[R.recent.length - 1].t - R.recent[0].t > 40) R.recent.shift();

    // Passage des kilomètres (interpolation du temps exact)
    var tNow = duree();
    while (R.distance >= R.prochainKm) {
      var frac = (R.prochainKm - avant) / Math.max(0.01, R.distance - avant);
      var tPrec = R.recent.length > 1 ? R.recent[R.recent.length - 2].t : tNow;
      var tKm = tPrec + (tNow - tPrec) * Math.min(1, Math.max(0, frac));
      var split = tKm - R.tKmPrec;
      R.splits.push(Math.round(split));
      R.tKmPrec = tKm;
      var n = R.prochainKm / 1000;
      if (n === 5) R.t5 = Math.round(tKm);
      if (n === 10) R.t10 = Math.round(tKm);
      annoncerKm(n, split, tKm);
      R.prochainKm += 1000;
    }
    maj();
  }

  function annoncerKm(n, split, total) {
    var mm = function (s) { var m = Math.floor(s / 60), x = Math.round(s % 60); return m + ' minute' + (m > 1 ? 's' : '') + (x ? ' ' + x : ''); };
    parler('Kilomètre ' + n + '. En ' + mm(split) + '. Allure moyenne ' + mm(total / n) + ' par kilomètre.');
    vibrer([80, 60, 80]);
  }

  function allureActuelle() {
    if (!R || R.recent.length < 2) return 0;
    var a = R.recent[0], b = R.recent[R.recent.length - 1];
    var dd = b.d - a.d, tt = b.t - a.t;
    if (dd < 15 || tt < 5) return 0;
    return tt / (dd / 1000);
  }

  function signal() {
    if (!R || R.precision == null) return { t: 'Recherche du GPS…', c: '#fbbf24', n: 0 };
    if (R.dernierFix && (Date.now() - R.dernierFix) / 1000 > COUPURE_S) return { t: 'Signal perdu', c: '#f87171', n: 0 };
    var a = R.precision;
    if (a <= 10) return { t: 'GPS excellent', c: '#22d3ee', n: 3 };
    if (a <= 20) return { t: 'GPS bon', c: '#22d3ee', n: 2 };
    if (a <= PRECISION_MAX) return { t: 'GPS moyen', c: '#fbbf24', n: 1 };
    return { t: 'GPS imprécis (' + Math.round(a) + ' m)', c: '#f87171', n: 0 };
  }

  function trace(points, w, h, couleur) {
    var pts = (points || []).filter(function (p) { return p && isFinite(p[0]); });
    if (pts.length < 2) return '<div style="height:' + h + 'px;display:flex;align-items:center;justify-content:center;color:#334155;font-size:0.7em;">Le tracé apparaîtra ici</div>';
    var la = pts.map(function (p) { return p[0]; }), lo = pts.map(function (p) { return p[1]; });
    var minLa = Math.min.apply(null, la), maxLa = Math.max.apply(null, la), minLo = Math.min.apply(null, lo), maxLo = Math.max.apply(null, lo);
    var kx = Math.cos(rad((minLa + maxLa) / 2));
    // v1231 : étendue minimale ≈ 60 m — sinon un tremblement GPS d'un mètre
    // était agrandi jusqu'aux coins du cadre.
    var MIN = 0.00055;
    var sx = (maxLo - minLo) * kx, sy = (maxLa - minLa);
    if (sx < MIN) { var cx = (minLo + maxLo) / 2; minLo = cx - MIN / kx / 2; maxLo = cx + MIN / kx / 2; sx = MIN; }
    if (sy < MIN) { var cy = (minLa + maxLa) / 2; minLa = cy - MIN / 2; maxLa = cy + MIN / 2; sy = MIN; }
    var e = Math.min((w - 20) / sx, (h - 20) / sy);
    var ox = (w - sx * e) / 2, oy = (h - sy * e) / 2;
    var segs = [], cur = [];
    pts.forEach(function (p) {
      var x = ox + (p[1] - minLo) * kx * e, y = h - (oy + (p[0] - minLa) * e);
      if (p[2] && cur.length) { segs.push(cur); cur = []; }
      cur.push(x.toFixed(1) + ',' + y.toFixed(1));
    });
    if (cur.length) segs.push(cur);
    var d0 = segs[0][0].split(','), dn = cur[cur.length - 1].split(',');
    return '<svg viewBox="0 0 ' + w + ' ' + h + '" style="width:100%;height:' + h + 'px;display:block;">'
      + segs.map(function (s) { return '<polyline points="' + s.join(' ') + '" fill="none" stroke="' + couleur + '" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.95"/>'; }).join('')
      + '<circle cx="' + d0[0] + '" cy="' + d0[1] + '" r="5" fill="#4ade80" stroke="#0d1117" stroke-width="2"/>'
      + '<circle cx="' + dn[0] + '" cy="' + dn[1] + '" r="6" fill="' + couleur + '" stroke="#fff" stroke-width="2"/></svg>';
  }

  function afficherCourse() {
    if (!R) return;
    var ov = document.getElementById('awakRunScreen');
    if (!ov) {
      ov = document.createElement('div');
      ov.id = 'awakRunScreen';
      ov.style.cssText = 'position:fixed;inset:0;z-index:11600;background:#05070b;color:#e8f0f8;display:flex;flex-direction:column;'
        + 'padding:calc(14px + env(safe-area-inset-top)) 16px calc(16px + env(safe-area-inset-bottom));box-sizing:border-box;overflow-y:auto;';
      document.body.appendChild(ov);
    }
    ov.innerHTML = '<div style="display:flex;align-items:center;gap:8px;">'
      + '<span style="color:' + ACCENT + ';">' + ico(R.a.ico, 22) + '</span>'
      + '<span style="font-weight:900;font-size:0.95em;flex:1;">' + R.a.nom + '</span>'
      + '<span id="awakRunSig" style="font-size:0.7em;font-weight:800;"></span></div>'
      + '<div style="text-align:center;margin:18px 0 6px;">'
      +   '<div id="awakRunDist" style="font-family:var(--font-display);font-size:4.4em;font-weight:900;line-height:1;letter-spacing:-1px;">0.00</div>'
      +   '<div style="font-size:0.72em;color:#64748b;font-weight:800;letter-spacing:2px;">KILOMÈTRES</div></div>'
      + '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:14px 0;">'
      +   bloc('awakRunTemps', 'TEMPS') + bloc('awakRunAllure', 'ALLURE /KM') + bloc('awakRunMoy', 'MOYENNE /KM')
      + '</div>'
      + '<div id="awakRunTrace" style="background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.06);border-radius:14px;margin-bottom:10px;"></div>'
      + '<div id="awakRunSplits" style="font-size:0.74em;color:#94a3b8;min-height:20px;"></div>'
      + '<div style="flex:1;"></div>'
      + '<div style="display:flex;gap:10px;margin-top:12px;">'
      +   '<button id="awakRunPause" style="flex:1;min-height:auto;padding:18px 8px;border-radius:16px;cursor:pointer;font-weight:900;font-size:0.95em;'
      +     'background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.14);color:#fff;"></button>'
      +   '<button id="awakRunStop" style="flex:1;min-height:auto;padding:18px 8px;border-radius:16px;cursor:pointer;font-weight:900;font-size:0.95em;'
      +     'background:rgba(239,68,68,0.12);border:1px solid rgba(239,68,68,0.4);color:#fca5a5;">TERMINER</button>'
      + '</div>';
    document.getElementById('awakRunPause').onclick = basculerPause;
    document.getElementById('awakRunStop').onclick = demanderFin;
    R._carte = null; R._nbTrace = 0; R._nbCarte = -1; R._centre = false;
    var tr0 = document.getElementById('awakRunTrace');
    if (tr0) tr0.innerHTML = '<div style="height:240px;display:flex;align-items:center;justify-content:center;color:#475569;font-size:0.72em;">Chargement de la carte…</div>';
    chargerCarte(function (ok) {
      if (!R) return;
      var hote = document.getElementById('awakRunTrace');
      R._lfPret = !!(ok && hote);
      if (R._lfPret && !R.pos && hote) hote.innerHTML = '<div style="height:240px;display:flex;align-items:center;justify-content:center;color:#475569;font-size:0.72em;">Recherche de ta position…</div>';
      R._nbTrace = 0;
      maj();
    });
    maj();
  }
  function bloc(id, t) {
    return '<div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:13px;padding:11px 4px;text-align:center;">'
      + '<div id="' + id + '" style="font-family:var(--font-display);font-size:1.45em;font-weight:900;font-variant-numeric:tabular-nums;">–</div>'
      + '<div style="font-size:0.56em;color:#64748b;font-weight:800;letter-spacing:1px;margin-top:2px;">' + t + '</div></div>';
  }

  function maj() {
    if (!R || !document.getElementById('awakRunScreen')) return;
    var t = duree();
    var set = function (id, v) { var el = document.getElementById(id); if (el) el.textContent = v; };
    set('awakRunDist', km(R.distance));
    set('awakRunTemps', hms(t));
    set('awakRunAllure', R.etat === 'run' ? allure(allureActuelle()) : '–:––');
    set('awakRunMoy', R.distance > 50 ? allure(t / (R.distance / 1000)) : '–:––');
    var s = signal(), sig = document.getElementById('awakRunSig');
    if (sig) {
      var barres = [1, 2, 3].map(function (i) {
        return '<span style="display:inline-block;width:4px;height:' + (4 + i * 3) + 'px;margin-left:2px;border-radius:1px;background:' + (i <= s.n ? s.c : '#334155') + ';"></span>';
      }).join('');
      sig.innerHTML = '<span style="color:' + s.c + ';">' + s.t + '</span> <span style="display:inline-flex;align-items:flex-end;">' + barres + '</span>';
    }
    var pb = document.getElementById('awakRunPause');
    if (pb) pb.textContent = R.etat === 'pause' ? 'REPRENDRE' : (R.etat === 'attente' ? 'EN ATTENTE DU GPS…' : 'PAUSE');
    var tr = document.getElementById('awakRunTrace');
    // La carte n'est créée qu'une fois la 1re position connue (sinon fond vide)
    if (!R._carte && R._lfPret && R.pos && tr) {
      R._carte = creerCarte(tr, 240);
      setTimeout(function () { try { R && R._carte && R._carte.map.invalidateSize(); } catch (e) {} }, 200);
    }
    if (R._carte) majCarte();
    else if (tr && _lfEtat !== 1 && !R._lfPret && (!R._nbTrace || R._nbTrace !== R.points.length)) { R._nbTrace = R.points.length; tr.innerHTML = trace(R.points, 340, 240, ACCENT); }
    var sp = document.getElementById('awakRunSplits');
    if (sp) sp.innerHTML = R.splits.length ? R.splits.slice(-6).map(function (x, i, arr) {
      var n = R.splits.length - arr.length + i + 1;
      return '<span style="display:inline-block;margin:0 10px 4px 0;"><b style="color:#cbd5e1;">km ' + n + '</b> ' + hms(x) + '</span>';
    }).join('') : (R.coupures ? '<span style="color:#fbbf24;">Signal GPS interrompu ' + R.coupures + ' fois</span>' : '');
  }

  function basculerPause() {
    if (!R || R.etat === 'attente') return;
    if (R.etat === 'run') { R.cumul += (Date.now() - R.repriseTs) / 1000; R.etat = 'pause'; parler('Pause'); }
    else { R.etat = 'run'; R.repriseTs = Date.now(); R.dernier = null; parler('On repart'); }
    maj();
  }

  function demanderFin() {
    if (!R) return;
    var fin = function () { terminer(); };
    if (R.distance < 50) {
      if (typeof showConfirm === 'function') showConfirm('Moins de 50 m parcourus : la sortie ne sera pas enregistrée. Arrêter ?', function () { annuler(); });
      else annuler();
      return;
    }
    if (typeof showConfirm === 'function') showConfirm('Terminer et enregistrer la sortie ?', fin);
    else fin();
  }

  function arreterGPS() {
    try {
      if (R && R.watch != null) { if (N()) N().geo.arreter(R.watch); else navigator.geolocation.clearWatch(R.watch); }
    } catch (e) {}
    try { if (R && R.tick) clearInterval(R.tick); } catch (e) {}
  }
  function fermerEcran() { var el = document.getElementById('awakRunScreen'); if (el) el.remove(); }
  function annuler() { arreterGPS(); retirerCarte(); R = null; libererEcran(); fermerEcran(); }

  function terminer() {
    if (!R) return;
    if (R.etat === 'run') { R.cumul += (Date.now() - R.repriseTs) / 1000; R.etat = 'fin'; }
    arreterGPS(); libererEcran();
    var s = {
      id: Date.now(), date: new Date(R.debut).toISOString(), type: R.type,
      distance: Math.round(R.distance), duree: Math.round(R.cumul),
      splits: R.splits, t5: R.t5, t10: R.t10, coupures: R.coupures,
      points: simplifier(R.points, 600)
    };
    var hist = lesSorties();
    var avant = records(hist.filter(function (x) { return x.type === 'course'; }));
    hist.unshift(s); sauver(hist);
    var nouveaux = [];
    if (s.type === 'course') {
      var km1 = s.splits.length ? Math.min.apply(null, s.splits) : 0;
      if (km1 && (!avant.km1 || km1 < avant.km1)) nouveaux.push('Meilleur kilomètre');
      if (s.t5 && (!avant.km5 || s.t5 < avant.km5)) nouveaux.push('5 km');
      if (s.t10 && (!avant.km10 || s.t10 < avant.km10)) nouveaux.push('10 km');
      if (!avant.longue || s.distance > avant.longue) nouveaux.push('Plus longue sortie');
    }
    enregistrerSeance(s);
    retirerCarte();
    R = null;
    fermerEcran();
    detail(0, nouveaux);
    parler('Sortie terminée. ' + (s.distance / 1000).toFixed(2).replace('.', ' virgule ') + ' kilomètres.');
  }

  // Garde au plus n points (un sur k), en conservant les ruptures
  function simplifier(pts, n) {
    if (pts.length <= n) return pts;
    var k = Math.ceil(pts.length / n), out = [];
    pts.forEach(function (p, i) { if (p[2] || i % k === 0 || i === pts.length - 1) out.push(p); });
    return out;
  }

  // Séance dans l'historique général + XP (mode jeu)
  function enregistrerSeance(s) {
    var a = ACTIVITES[s.type] || ACTIVITES.course;
    try {
      if (typeof saveWorkoutToHistory === 'function') {
        saveWorkoutToHistory({ name: a.nom + ' ' + km(s.distance) + ' km (cardio)', exercises: [{ name: a.exo, muscle: 'Cardio', duration: s.duree }] }, s.duree);
        // Compléter l'entrée : distance et calories réalistes (≈ 1 kcal / kg / km en course)
        var pid = (typeof getCurrentProfileId === 'function') ? getCurrentProfileId() : null;
        var hist = (typeof getWorkoutHistory === 'function') ? getWorkoutHistory() : [];
        if (hist[0]) {
          var prof = (typeof getUserProfile === 'function') ? getUserProfile() : {};
          var kg = (prof && prof.weight) ? prof.weight : 75;
          var f = s.type === 'course' ? 1.0 : (s.type === 'marche' ? 0.55 : 0.3);
          hist[0].distanceKm = +(s.distance / 1000).toFixed(2);
          hist[0].calories = Math.round(kg * (s.distance / 1000) * f);
          hist[0].gpsRunId = s.id;
          var json = JSON.stringify(hist);
          if (pid && typeof setProfileData === 'function') setProfileData(pid, 'workoutHistory', json);
          else localStorage.setItem('workoutHistory', json);
        }
      }
    } catch (e) {}
    // XP : environ 5 min d'effort par kilomètre (plafonds habituels du jeu)
    try {
      if (typeof rpgGainXP === 'function') {
        var n = Math.max(1, Math.floor(s.distance / 1000));
        var parKm = Math.max(60, Math.round(s.duree / Math.max(1, s.distance / 1000)));
        for (var i = 0; i < n; i++) rpgGainXP(a.exo, 0, 0, parKm);
      }
    } catch (e) {}
    try { if (typeof updateHomeStats === 'function') updateHomeStats(); } catch (e) {}
  }

  function records(hist) {
    var r = { km1: 0, km5: 0, km10: 0, longue: 0 };
    (hist || []).forEach(function (s) {
      if (!s || s.type !== 'course') return;
      if (s.splits && s.splits.length) { var m = Math.min.apply(null, s.splits); if (!r.km1 || m < r.km1) r.km1 = m; }
      if (s.t5 && (!r.km5 || s.t5 < r.km5)) r.km5 = s.t5;
      if (s.t10 && (!r.km10 || s.t10 < r.km10)) r.km10 = s.t10;
      if (s.distance > r.longue) r.longue = s.distance;
    });
    return r;
  }

  // ═══ RÉSUMÉ D'UNE SORTIE ════════════════════════════════════════════
  function detail(i, nouveaux) {
    var s = lesSorties()[i]; if (!s) return;
    var old = document.getElementById('awakRunHome'); if (old) old.remove();
    var a = ACTIVITES[s.type] || ACTIVITES.course;
    var moy = s.distance > 50 ? s.duree / (s.distance / 1000) : 0;
    var maxS = s.splits && s.splits.length ? Math.max.apply(null, s.splits) : 0;
    var minS = s.splits && s.splits.length ? Math.min.apply(null, s.splits) : 0;
    var splits = (s.splits || []).map(function (x, k) {
      var w = maxS ? Math.max(18, Math.round(x / maxS * 100)) : 50;
      return '<div style="display:flex;align-items:center;gap:8px;margin-bottom:5px;font-size:0.74em;">'
        + '<span style="width:38px;color:#64748b;font-weight:800;">km ' + (k + 1) + '</span>'
        + '<span style="flex:1;height:14px;background:rgba(255,255,255,0.04);border-radius:5px;overflow:hidden;">'
        +   '<span style="display:block;height:100%;width:' + w + '%;background:' + (x === minS ? '#fbbf24' : ACCENT) + ';opacity:0.85;border-radius:5px;"></span></span>'
        + '<span style="width:48px;text-align:right;color:#e2e8f0;font-weight:800;font-variant-numeric:tabular-nums;">' + hms(x) + '</span></div>';
    }).join('');
    var ov = document.createElement('div');
    ov.id = 'awakRunDetail';
    ov.style.cssText = 'position:fixed;inset:0;z-index:11550;background:rgba(0,0,0,0.8);display:flex;align-items:flex-end;justify-content:center;';
    ov.onclick = function (e) { if (e.target === ov) ov.remove(); };
    var st = function (v, t) {
      return '<div style="flex:1;min-width:0;text-align:center;"><div style="font-family:var(--font-display);font-size:1.3em;font-weight:900;">' + v + '</div>'
        + '<div style="font-size:0.58em;color:#64748b;font-weight:800;letter-spacing:1px;">' + t + '</div></div>';
    };
    ov.innerHTML = '<div style="width:100%;max-width:480px;max-height:92vh;overflow-y:auto;box-sizing:border-box;background:#0d1117;border:1px solid rgba(34,211,238,0.25);border-radius:20px 20px 0 0;padding:12px 16px calc(18px + env(safe-area-inset-bottom));">'
      + '<div style="width:40px;height:4px;background:rgba(255,255,255,0.15);border-radius:99px;margin:0 auto 12px;"></div>'
      + '<div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">'
      +   '<span style="color:' + ACCENT + ';">' + ico(a.ico, 24) + '</span>'
      +   '<div style="flex:1;min-width:0;"><div style="font-size:1.05em;font-weight:900;color:#fff;">' + a.nom + ' · ' + km(s.distance) + ' km</div>'
      +   '<div style="font-size:0.7em;color:#64748b;">' + new Date(s.date).toLocaleString('fr-CA', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }) + '</div></div>'
      +   '<button onclick="document.getElementById(\'awakRunDetail\').remove()" aria-label="Fermer" style="width:36px;height:36px;min-height:auto;padding:0;border-radius:10px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.12);color:#94a3b8;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;">' + ico('<path d="M6 6l12 12M18 6L6 18"/>', 16) + '</button>'
      + '</div>'
      + (nouveaux && nouveaux.length
          ? '<div style="background:rgba(251,191,36,0.1);border:1px solid rgba(251,191,36,0.4);border-radius:12px;padding:10px 12px;margin-bottom:12px;">'
            + '<div style="font-size:0.6em;letter-spacing:1.6px;color:#fbbf24;font-weight:900;">NOUVEAU RECORD</div>'
            + '<div style="font-size:0.84em;font-weight:800;color:#fde68a;margin-top:2px;">' + esc(nouveaux.join(' · ')) + '</div></div>' : '')
      + '<div style="display:flex;gap:6px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:13px;padding:12px 6px;">'
      +   st(hms(s.duree), 'TEMPS') + st(allure(moy), 'ALLURE /KM') + st(moy ? (3600 / moy).toFixed(1) : '–', 'KM/H') + '</div>'
      + '<div id="awakRunDetailCarte" style="background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.06);border-radius:14px;margin:10px 0;overflow:hidden;">' + trace(s.points, 340, 200, ACCENT) + '</div>'
      + (splits ? '<div style="font-size:0.6em;letter-spacing:1.6px;color:#94a3b8;font-weight:900;margin:12px 0 8px;">TEMPS PAR KILOMÈTRE</div>' + splits : '')
      + (s.coupures ? '<div style="font-size:0.7em;color:#fbbf24;margin-top:8px;">Signal GPS interrompu ' + s.coupures + ' fois : la distance peut être légèrement sous-estimée.</div>' : '')
      + '<div style="display:flex;gap:8px;margin-top:14px;">'
      +   '<button onclick="AwakRun.supprimer(' + i + ')" style="flex:1;min-height:auto;padding:12px;border-radius:12px;cursor:pointer;background:rgba(239,68,68,0.07);border:1px solid rgba(239,68,68,0.3);color:#fca5a5;font-weight:800;font-size:0.8em;">Supprimer</button>'
      +   '<button onclick="document.getElementById(\'awakRunDetail\').remove();AwakRun.ouvrir()" style="flex:2;min-height:auto;padding:12px;border-radius:12px;cursor:pointer;background:rgba(34,211,238,0.12);border:1px solid rgba(34,211,238,0.4);color:#a5f3fc;font-weight:800;font-size:0.8em;">Mes sorties</button>'
      + '</div></div>';
    document.body.appendChild(ov);
    // 🗺️ v1231 : la carte remplace le tracé dès qu'elle est disponible
    if ((s.points || []).length >= 2) chargerCarte(function (ok) {
      var hote = document.getElementById('awakRunDetailCarte');
      if (!ok || !hote) return;
      var c = creerCarte(hote, 220); if (!c) return;
      var segs = segments(s.points);
      c.ligne.setLatLngs(segs);
      try {
        var tous = [].concat.apply([], segs);
        L.circleMarker(tous[0], { radius: 6, color: '#0d1117', weight: 2, fillColor: '#4ade80', fillOpacity: 1 }).addTo(c.map);
        L.circleMarker(tous[tous.length - 1], { radius: 7, color: '#fff', weight: 2, fillColor: ACCENT, fillOpacity: 1 }).addTo(c.map);
        setTimeout(function () { c.map.invalidateSize(); c.map.fitBounds(c.ligne.getBounds(), { padding: [20, 20], maxZoom: 17 }); }, 150);
      } catch (e) {}
    });
  }

  function supprimer(i) {
    var go = function () {
      var h = lesSorties(); h.splice(i, 1); sauver(h);
      var d = document.getElementById('awakRunDetail'); if (d) d.remove();
      ouvrir();
    };
    if (typeof showConfirm === 'function') showConfirm('Supprimer cette sortie ?', go); else go();
  }

  function afficherMessage(titre, texte) {
    fermerEcran();
    if (typeof showAlert === 'function') showAlert(texte, 'warning', titre);
    else alert(titre + '\n' + texte);
  }

  window.AwakRun = {
    ouvrir: ouvrir, detail: detail, supprimer: supprimer,
    actif: function () { return !!R; },
    _test: { surPosition: surPosition, demarrer: demarrer, terminer: terminer, etat: function () { return R; } }
  };
})();
