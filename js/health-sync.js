/* ═══════════════════════════════════════════════════════════════════════
   MONTRE & SANTÉ — Health Connect (Android)            v1232
   -----------------------------------------------------------------------
   Galaxy Watch → Samsung Health → Health Connect → Awakened.
   Ne fonctionne QUE dans l'app native (Capacitor). Dans la PWA, tout ce
   module reste inactif et la carte de Réglages l'explique.

   MODULE CAPACITOR VISÉ : @capgo/capacitor-health  (nom natif « Health »)
     isAvailable() · requestAuthorization({read, write})
     readSamples({dataType, startDate, endDate, limit})
     queryAggregated({dataType, startDate, endDate, bucket, aggregation})
     queryWorkouts({startDate, endDate, limit})
   Toute la lecture passe par _p() : changer de module = changer ce fichier.

   CE QUI EST LU
   • pouls moyen / max et calories d'une séance Awakened (écran de fin) ;
   • pas et calories du jour ;
   • sommeil de la nuit (séance allégée si la nuit a été courte) ;
   • séances enregistrées avec la montre → importées dans l'historique.
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var LIRE = ['heartRate', 'restingHeartRate', 'steps', 'calories', 'totalCalories', 'sleep', 'workouts', 'distance'];

  function _p() {
    try {
      var N = window.AwakNative;
      if (!N || !N.estNatif || !N.estNatif()) return null;
      return (N.plugin && (N.plugin('Health') || N.plugin('CapacitorHealth'))) || null;
    } catch (e) { return null; }
  }
  function cle(k) {
    try { return window._cleProfil ? window._cleProfil(k) : k; } catch (e) { return k; }
  }
  function cleL(k) {
    try { return window._cleProfilLecture ? window._cleProfilLecture(k) : k; } catch (e) { return k; }
  }
  function lire(k, d) { try { var v = localStorage.getItem(cleL(k)); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }
  function ecrire(k, v) { try { localStorage.setItem(cle(k), JSON.stringify(v)); } catch (e) {} }
  function iso(t) { return new Date(t).toISOString(); }
  function arr(r, champ) {
    if (!r) return [];
    if (Array.isArray(r)) return r;
    return r[champ] || r.samples || r.workouts || r.data || [];
  }

  // ── état ──
  function natif() { return !!_p(); }
  function connecte() { return natif() && !!lire('awakSanteOn', false); }

  function disponible() {
    var p = _p(); if (!p) return Promise.resolve(false);
    try {
      return Promise.resolve(p.isAvailable ? p.isAvailable() : true)
        .then(function (r) { return !!(r === true || (r && (r.available || r.isAvailable || r.value))); })
        .catch(function () { return false; });
    } catch (e) { return Promise.resolve(false); }
  }

  function connecter() {
    var p = _p();
    if (!p) return Promise.resolve(false);
    return disponible().then(function (ok) {
      if (!ok) {
        try { if (p.openHealthConnectSettings) p.openHealthConnectSettings(); } catch (e) {}
        throw new Error('indisponible');
      }
      return p.requestAuthorization({ read: LIRE, write: [], requestHistoryAccess: false });
    }).then(function () {
      ecrire('awakSanteOn', true);
      return true;
    }).catch(function () { return false; });
  }
  function deconnecter() { ecrire('awakSanteOn', false); }

  // ── lectures ──
  function echantillons(type, debut, fin, limite) {
    var p = _p(); if (!p) return Promise.resolve([]);
    try {
      return p.readSamples({ dataType: type, startDate: iso(debut), endDate: iso(fin), limit: limite || 1000, ascending: true })
        .then(function (r) { return arr(r, 'samples'); }).catch(function () { return []; });
    } catch (e) { return Promise.resolve([]); }
  }
  function somme(type, debut, fin) {
    var p = _p(); if (!p) return Promise.resolve(null);
    try {
      return p.queryAggregated({ dataType: type, startDate: iso(debut), endDate: iso(fin), bucket: 'day', aggregation: 'sum' })
        .then(function (r) {
          var s = arr(r, 'samples'), tot = 0, vu = false;
          s.forEach(function (x) { var v = (x.values && x.values.sum != null) ? x.values.sum : x.value; if (isFinite(v)) { tot += +v; vu = true; } });
          return vu ? tot : null;
        })
        .catch(function () {
          // Repli : somme des échantillons bruts
          return echantillons(type, debut, fin, 5000).then(function (s) {
            if (!s.length) return null;
            return s.reduce(function (a, x) { return a + (+x.value || 0); }, 0);
          });
        });
    } catch (e) { return Promise.resolve(null); }
  }

  // Pouls + calories d'une plage horaire (une séance Awakened)
  function seance(debut, fin) {
    if (!connecte()) return Promise.resolve(null);
    return Promise.all([
      echantillons('heartRate', debut, fin, 3000),
      somme('calories', debut, fin)
    ]).then(function (r) {
      var fc = r[0].map(function (x) { return +x.value; }).filter(function (v) { return v > 30 && v < 230; });
      if (!fc.length && r[1] == null) return null;
      return {
        fcMoy: fc.length ? Math.round(fc.reduce(function (a, b) { return a + b; }, 0) / fc.length) : null,
        fcMax: fc.length ? Math.max.apply(null, fc) : null,
        kcal: r[1] != null ? Math.round(r[1]) : null
      };
    });
  }

  // v1239 : échantillons de pouls bruts [{t, v}] (zones cardiaques d'une sortie)
  function pouls(debut, fin) {
    if (!connecte()) return Promise.resolve([]);
    return echantillons('heartRate', debut, fin, 5000).then(function (l) {
      return l.map(function (x) {
        return { t: new Date(x.startDate || x.timestamp || x.date || x.endDate).getTime(), v: +x.value };
      }).filter(function (x) { return isFinite(x.t) && x.v > 30 && x.v < 230; });
    });
  }

  function minuit(d) { var x = new Date(d || Date.now()); x.setHours(0, 0, 0, 0); return x.getTime(); }

  // Pas et calories d'aujourd'hui
  function journee() {
    if (!connecte()) return Promise.resolve(null);
    var d = minuit(), f = Date.now();
    return Promise.all([somme('steps', d, f), somme('calories', d, f)]).then(function (r) {
      var o = { pas: r[0] != null ? Math.round(r[0]) : null, kcal: r[1] != null ? Math.round(r[1]) : null, t: Date.now() };
      ecrire('awakSanteJour', o);
      return o;
    });
  }

  // Sommeil de la dernière nuit (18 h la veille → maintenant), en minutes
  function sommeil() {
    if (!connecte()) return Promise.resolve(null);
    var fin = Date.now(), debut = minuit() - 6 * 3600 * 1000;
    return echantillons('sleep', debut, fin, 500).then(function (s) {
      var min = 0;
      s.forEach(function (x) {
        var etat = String(x.sleepState || '').toLowerCase();
        if (etat === 'awake' || etat === 'inbed' || etat === 'in_bed') return;
        if (x.stages && x.stages.length) {
          x.stages.forEach(function (g) {
            var st = String(g.stage || g.sleepState || '').toLowerCase();
            if (st.indexOf('awake') >= 0 || st.indexOf('bed') >= 0) return;
            min += (new Date(g.endDate) - new Date(g.startDate)) / 60000;
          });
        } else {
          min += (new Date(x.endDate) - new Date(x.startDate)) / 60000;
        }
      });
      if (!(min > 0)) return null;
      var o = { min: Math.round(min), t: Date.now() };
      ecrire('awakSanteNuit', o);
      return o;
    });
  }

  // ── import des séances faites avec la montre ──
  var TYPES = {
    running: 'Course', walking: 'Marche', biking: 'Vélo', cycling: 'Vélo', swimming: 'Natation',
    hiking: 'Randonnée', yoga: 'Yoga', strengthtraining: 'Musculation', traditionalstrengthtraining: 'Musculation',
    functionalstrengthtraining: 'Musculation', hiit: 'HIIT', highintensityintervaltraining: 'HIIT',
    elliptical: 'Elliptique', rowing: 'Rameur', pilates: 'Pilates', dance: 'Danse', boxing: 'Boxe',
    stairclimbing: 'Escaliers', other: 'Activité'
  };
  function nomType(t) {
    var k = String(t || 'other').toLowerCase().replace(/[^a-z]/g, '');
    return TYPES[k] || 'Activité';
  }
  function historique() {
    try { return (typeof window.getWorkoutHistory === 'function') ? window.getWorkoutHistory() : []; } catch (e) { return []; }
  }
  function sauverHistorique(h) {
    try {
      var id = (typeof window.getCurrentProfileId === 'function') ? window.getCurrentProfileId() : null;
      // Le nombre d'exercices est stocké en NOMBRE (getWorkoutHistory renvoie un tableau)
      var brut = h.map(function (e) { var c = Object.assign({}, e); if (typeof c._nbExos === 'number') c.exercises = c._nbExos; delete c._nbExos; return c; });
      if (id && typeof window.setProfileData === 'function') window.setProfileData(id, 'workoutHistory', JSON.stringify(brut));
      else localStorage.setItem('workoutHistory', JSON.stringify(brut));
    } catch (e) {}
  }

  function importer(jours) {
    var p = _p();
    if (!connecte() || !p || !p.queryWorkouts) return Promise.resolve(0);
    var fin = Date.now(), debut = fin - (jours || 14) * 86400000;
    return p.queryWorkouts({ startDate: iso(debut), endDate: iso(fin), limit: 100 })
      .then(function (r) {
        var liste = arr(r, 'workouts');
        var h = historique();
        var connus = {};
        h.forEach(function (e) { if (e._santeId) connus[e._santeId] = 1; });
        // Séances Awakened déjà présentes : on n'importe pas un doublon qui chevauche
        var plages = h.filter(function (e) { return !e._santeId; }).map(function (e) {
          var t = new Date(e.date).getTime(); return [t - (e.duration || 0) * 60000 - 600000, t + 600000];
        });
        var ajout = 0, xp = 0;
        liste.forEach(function (w) {
          var id = w.platformId || (w.startDate + '|' + w.workoutType);
          if (connus[id]) return;
          if (/awakened/i.test(w.sourceName || '')) return;
          var t0 = new Date(w.startDate).getTime(), t1 = new Date(w.endDate).getTime();
          if (!(t1 > t0)) return;
          if (plages.some(function (pl) { return t0 < pl[1] && t1 > pl[0]; })) return;
          var min = Math.max(1, Math.round((t1 - t0) / 60000));
          var nom = nomType(w.workoutType);
          h.push({
            id: t0, date: new Date(t1).toISOString(), name: nom + ' (montre)', duration: min,
            exercises: 1, muscles: [], musclesWorked: {}, musclesWeighted: {},
            calories: w.totalEnergyBurned ? Math.round(w.totalEnergyBurned) : 0, volume: 0,
            distance: w.totalDistance ? Math.round(w.totalDistance) : 0,
            _santeId: id, _source: w.sourceName || 'Montre'
          });
          connus[id] = 1; ajout++; xp += Math.min(300, min * 4);
        });
        if (ajout) {
          h.sort(function (a, b) { return new Date(b.date) - new Date(a.date); });
          if (h.length > 200) h = h.slice(0, 200);
          sauverHistorique(h);
          try { if (typeof window.rpgEnabled === 'function' && window.rpgEnabled() && typeof window.awakGrantLifetimeXP === 'function' && xp) window.awakGrantLifetimeXP(xp); } catch (e) {}
        }
        ecrire('awakSanteImport', Date.now());
        return ajout;
      }).catch(function () { return 0; });
  }

  // ── écran de fin de séance : pouls réel + calories de la montre ──
  function completerFinSeance(debut, fin) {
    if (!connecte()) return;
    // La montre synchronise avec un délai : on réessaie après 45 s
    var essai = function (n) {
      seance(debut, fin).then(function (r) {
        if (!r || (r.fcMoy == null && r.kcal == null)) { if (n < 2) setTimeout(function () { essai(n + 1); }, 45000); return; }
        var cv = document.getElementById('completionView');
        if (!cv || cv.classList.contains('hidden')) return;
        var bloc = document.getElementById('awakSanteFin');
        if (!bloc) {
          bloc = document.createElement('div');
          bloc.id = 'awakSanteFin';
          var ancre = document.getElementById('completionMuscleChart');
          if (ancre && ancre.parentNode) ancre.parentNode.insertBefore(bloc, ancre); else return;
        }
        var ico = function (n, c) { return (window.AwakIcon && AwakIcon.get(n, 16, c)) || ''; };
        bloc.innerHTML = '<div style="display:flex;gap:8px;margin-bottom:14px;">'
          + (r.fcMoy ? tuile(ico('coeur', '#f87171') + ' ' + r.fcMoy, 'POULS MOYEN', '#f87171') : '')
          + (r.fcMax ? tuile(r.fcMax, 'POULS MAX', '#fb7185') : '')
          + (r.kcal ? tuile(r.kcal, 'KCAL (MONTRE)', '#fbbf24') : '')
          + '</div>';
        // Enregistrer dans l'entrée d'historique la plus récente
        try {
          var h = historique();
          if (h[0] && Math.abs(new Date(h[0].date).getTime() - fin) < 15 * 60000) {
            if (r.fcMoy) h[0].fcMoy = r.fcMoy;
            if (r.fcMax) h[0].fcMax = r.fcMax;
            if (r.kcal) { h[0].calories = r.kcal; h[0]._kcalMontre = true; }
            sauverHistorique(h);
          }
        } catch (e) {}
      });
    };
    essai(0);
  }
  function tuile(v, l, c) {
    return '<div style="flex:1;min-width:0;text-align:center;padding:11px 4px;border-radius:12px;background:' + c + '12;border:1px solid ' + c + '44;">'
      + '<div style="font-size:1.3em;font-weight:900;color:' + c + ';display:flex;align-items:center;justify-content:center;gap:4px;">' + v + '</div>'
      + '<div style="font-size:0.52em;color:#94a3b8;font-weight:900;letter-spacing:1px;margin-top:3px;">' + l + '</div></div>';
  }

  // ── nuit courte → séance allégée (lu par l'écran « Prépare-toi ») ──
  function nuitCourte() {
    var n = lire('awakSanteNuit', null);
    if (!n || !n.min || Date.now() - n.t > 20 * 3600 * 1000) return null;
    return n.min < 6 * 60 ? n.min : null;
  }
  function hm(min) { var h = Math.floor(min / 60), m = min % 60; return h + ' h ' + (m < 10 ? '0' : '') + m; }

  // ── carte des Réglages ──
  function rendreReglages() {
    var hote = document.getElementById('awakSanteCarte');
    if (!hote) return;
    var bleu = '#60a8f0';
    if (!natif()) {
      hote.innerHTML = '<div style="font-size:0.8em;color:#cbd5e1;line-height:1.5;">'
        + 'Connecte ta <b>Galaxy Watch</b> (ou toute montre qui synchronise avec Samsung Health ou Google Fit) pour récupérer '
        + 'ton pouls, tes calories, tes pas, ton sommeil et les séances faites avec la montre.</div>'
        + '<div style="font-size:0.74em;color:#93c5fd;background:rgba(96,168,240,0.08);border:1px solid rgba(96,168,240,0.25);border-radius:10px;padding:9px 11px;margin-top:10px;line-height:1.45;">'
        + 'Disponible dans l\'application Android (Play Store). La version web ne peut pas lire Health Connect.</div>';
      return;
    }
    var on = connecte();
    var jour = lire('awakSanteJour', null), nuit = lire('awakSanteNuit', null), imp = lire('awakSanteImport', 0);
    var ligne = function (l, v) { return '<div style="display:flex;justify-content:space-between;font-size:0.78em;padding:5px 0;border-top:1px solid rgba(255,255,255,0.05);"><span style="color:#94a3b8;">' + l + '</span><b style="color:#fff;">' + v + '</b></div>'; };
    var btn = function (on2, txt, c) { return '<button onclick="' + on2 + '" style="flex:1;min-width:0;padding:11px 6px;border-radius:11px;cursor:pointer;font-weight:800;font-size:0.78em;background:' + c + '1a;border:1px solid ' + c + '66;color:' + c + ';">' + txt + '</button>'; };
    hote.innerHTML = on
      ? '<div style="display:flex;align-items:center;gap:8px;font-size:0.8em;font-weight:800;color:#86efac;margin-bottom:8px;">'
        + '<span style="width:8px;height:8px;border-radius:50%;background:#4ade80;"></span>Montre connectée (Health Connect)</div>'
        + ligne('Pas aujourd\'hui', jour && jour.pas != null ? jour.pas.toLocaleString('fr-CA') : '—')
        + ligne('Calories aujourd\'hui', jour && jour.kcal != null ? jour.kcal + ' kcal' : '—')
        + ligne('Sommeil cette nuit', nuit && nuit.min ? hm(nuit.min) : '—')
        + ligne('Dernier import', imp ? new Date(imp).toLocaleString('fr-CA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'jamais')
        + '<div style="display:flex;gap:7px;margin-top:11px;">'
        + btn('AwakSante.synchroniser(true)', 'Synchroniser', bleu)
        + btn('AwakSante.deconnecter();AwakSante.rendreReglages()', 'Déconnecter', '#94a3b8')
        + '</div>'
      : '<div style="font-size:0.8em;color:#cbd5e1;line-height:1.5;margin-bottom:10px;">'
        + 'Connecte ta <b>Galaxy Watch</b> via Health Connect. Dans Samsung Health, active d\'abord : '
        + '<i>Réglages › Health Connect › autoriser le partage</i>.</div>'
        + '<div style="display:flex;gap:7px;">' + btn('AwakSante.connecterUI()', 'Connecter ma montre', bleu) + '</div>';
  }

  function connecterUI() {
    connecter().then(function (ok) {
      try { if (typeof showToast === 'function') showToast(ok ? 'Montre connectée' : 'Connexion impossible : vérifie Health Connect', ok ? 'success' : 'warning', 3000); } catch (e) {}
      if (ok) synchroniser(true); else rendreReglages();
    });
  }

  // Synchronisation : jour + nuit + import (au démarrage, au retour dans l'app)
  var _enCours = false;
  function synchroniser(manuel) {
    if (!connecte() || _enCours) { rendreReglages(); return Promise.resolve(); }
    _enCours = true;
    return Promise.all([journee(), sommeil(), importer(14)]).then(function (r) {
      _enCours = false;
      rendreReglages();
      var n = r[2] || 0;
      try {
        if (n && typeof showToast === 'function') showToast(n + ' séance' + (n > 1 ? 's' : '') + ' de la montre importée' + (n > 1 ? 's' : ''), 'success', 3000);
        else if (manuel && typeof showToast === 'function') showToast('Montre synchronisée', 'success', 2000);
        if (n && typeof window.renderWorkoutHistory === 'function') window.renderWorkoutHistory(window._histFilter || 'all');
      } catch (e) {}
    }).catch(function () { _enCours = false; });
  }

  function auDemarrage() {
    if (!connecte()) return;
    var dernier = lire('awakSanteImport', 0);
    if (Date.now() - dernier > 30 * 60000) synchroniser(false);
  }
  if (document.readyState === 'complete') setTimeout(auDemarrage, 4000);
  else window.addEventListener('load', function () { setTimeout(auDemarrage, 4000); });
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') auDemarrage(); });

  window.AwakSante = {
    natif: natif, connecte: connecte, connecter: connecter, connecterUI: connecterUI, deconnecter: deconnecter,
    seance: seance, journee: journee, sommeil: sommeil, importer: importer, synchroniser: synchroniser,
    completerFinSeance: completerFinSeance, nuitCourte: nuitCourte, rendreReglages: rendreReglages, hm: hm, pouls: pouls
  };
})();
