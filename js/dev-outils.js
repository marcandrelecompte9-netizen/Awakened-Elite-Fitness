// v1398 — Outils du mode développeur (panneau #devModePanel) :
//  1. Avancer le temps : +1 / +7 / +30 jours, retour au présent (js/dev-temps.js
//     applique le décalage au chargement ; la page se recharge).
//  2. Images manquantes : exercices sans image, images d'exercices ou de
//     scènes introuvables sur le serveur ; liste à copier.
//  3. Profil test : 3 mois de séances, mesures et photos factices dans le
//     profil actuel ; « Retirer » remet exactement les données d'avant.
(function () {
  'use strict';

  var J = 86400000;
  function pid() { try { return (window.getCurrentProfileId && window.getCurrentProfileId()) || 'default'; } catch (e) { return 'default'; } }
  function toast(m, t, ms) { try { window.showToast(m, t || 'info', ms || 2500); } catch (e) {} }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function confirmer(msg, ok, titre) {
    if (typeof window.showConfirm === 'function') window.showConfirm(msg, ok, null, { title: titre || 'MODE DÉVELOPPEUR', confirmLabel: 'Continuer' });
    else if (window.confirm(msg)) ok();
  }

  // ── 1. Avancer le temps ───────────────────────────────────────────
  function decalage() { try { return parseInt(localStorage.getItem('awakDevDecalage') || '0', 10) || 0; } catch (e) { return 0; } }
  function avancer(jours) {
    var n = decalage() + jours * J;
    try { localStorage.setItem('awakDevDecalage', String(n)); } catch (e) {}
    toast('Temps simulé : +' + Math.round(n / J) + ' j. Rechargement…', 'info', 1500);
    setTimeout(function () { location.reload(); }, 600);
  }
  function present() {
    if (!decalage()) { toast('Déjà au présent.'); return; }
    confirmer('Revenir au présent ? Ce qui a été enregistré pendant le temps simulé garde sa date « future ».', function () {
      try { localStorage.removeItem('awakDevDecalage'); } catch (e) {}
      setTimeout(function () { location.reload(); }, 200);
    });
  }
  // Bandeau permanent tant que le temps est décalé (pour ne pas l'oublier)
  function bandeau() {
    var d = decalage(), b = document.getElementById('awakDevTempsBandeau');
    if (!d) { if (b) b.remove(); return; }
    if (!b) {
      b = document.createElement('button');
      b.id = 'awakDevTempsBandeau'; b.type = 'button';
      b.onclick = present;
      document.body.appendChild(b);
    }
    var jr = Math.round(d / J);
    b.textContent = 'Temps simulé +' + jr + ' j · ' + new Date().toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' }) + ' · revenir';
  }
  function majTemps() {
    var el = document.getElementById('devTempsEtat');
    var d = decalage();
    if (el) el.textContent = d ? ('Temps simulé : +' + Math.round(d / J) + ' j (' + new Date().toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' }) + ')') : 'Temps réel';
    bandeau();
  }

  // ── 2. Images manquantes ─────────────────────────────────────────
  function existe(url) {
    return fetch(url, { method: 'HEAD', cache: 'no-store' })
      .then(function (r) { return r.ok; })
      .catch(function () { return false; });
  }
  function verifier(liste, surProgres) {
    // 8 requêtes à la fois
    var res = new Array(liste.length), i = 0, fini = 0;
    return new Promise(function (ok) {
      if (!liste.length) return ok(res);
      function suivant() {
        if (i >= liste.length) return;
        var k = i++;
        existe(liste[k]).then(function (v) {
          res[k] = v; fini++;
          if (surProgres) surProgres(fini, liste.length);
          if (fini === liste.length) ok(res); else suivant();
        });
      }
      for (var n = 0; n < 8; n++) suivant();
    });
  }
  function nettoyer(u) { return String(u || '').split('?')[0]; }
  function fenetre(html) {
    var old = document.getElementById('awakDevImages'); if (old) old.remove();
    var f = document.createElement('div');
    f.id = 'awakDevImages';
    f.innerHTML = '<div class="awk-dev-boite">' + html + '</div>';
    f.addEventListener('click', function (e) { if (e.target === f) f.remove(); });
    document.body.appendChild(f);
    return f;
  }
  function images() {
    var f = fenetre('<div class="awk-dev-tete"><b>Images manquantes</b><button type="button" class="awk-dev-x" data-x aria-label="Fermer">×</button></div>'
      + '<div class="awk-dev-corps"><p data-etat>Vérification…</p></div>');
    f.querySelector('[data-x]').onclick = function () { f.remove(); };
    var etat = f.querySelector('[data-etat]');

    var IMG = window.EXERCISE_IMAGES || {};
    var db = [];
    try { db = (typeof exerciseDatabase !== 'undefined' ? exerciseDatabase : (window.exerciseDatabase || [])); } catch (e) {}
    var sansImage = db.filter(function (ex) { return ex && ex.name && !IMG[ex.name]; }).map(function (ex) { return ex.name + (ex.muscle ? ' (' + ex.muscle + ')' : ''); });

    // Fichiers référencés : exercices + scènes de l'histoire
    var urls = {}, ajout = function (u, quoi) { u = nettoyer(u); if (!u || /^data:|^https?:/.test(u)) return; (urls[u] = urls[u] || []).push(quoi); };
    Object.keys(IMG).forEach(function (n) { ajout(IMG[n], 'exo|' + n); });
    (window.STORY_EVENTS || []).forEach(function (e) {
      var c = e && e.content; if (!c) return;
      if (c.image) ajout(c.image, 'scene|' + (c.title || e.id));
      (c.pageImages || []).forEach(function (u) { if (u) ajout(u, 'scene|' + (c.title || e.id)); });
    });
    var ch = window.STORY_CHARS || {};
    Object.keys(ch).forEach(function (k) { if (ch[k] && ch[k].image) ajout(ch[k].image, 'perso|' + (ch[k].name || k)); });
    var liste = Object.keys(urls);

    verifier(liste, function (n, t) { etat.textContent = 'Vérification… ' + n + ' / ' + t; }).then(function (ok) {
      var exo = [], scene = [], perso = [];
      liste.forEach(function (u, k) {
        if (ok[k]) return;
        urls[u].forEach(function (q) {
          var p = q.split('|'), ligne = p[1] + ' → ' + u.replace(/^images\//, '');
          (p[0] === 'exo' ? exo : p[0] === 'scene' ? scene : perso).push(ligne);
        });
      });
      var bloc = function (titre, l) {
        return '<div class="awk-dev-bloc"><div class="awk-dev-bt">' + titre + ' <span>' + l.length + '</span></div>'
          + (l.length ? '<ul>' + l.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' : '<p class="awk-dev-rien">Rien à signaler.</p>') + '</div>';
      };
      var texte = ['Exercices sans image (' + sansImage.length + ')'].concat(sansImage)
        .concat(['', 'Images d\'exercices introuvables (' + exo.length + ')']).concat(exo)
        .concat(['', 'Images de scènes introuvables (' + scene.length + ')']).concat(scene)
        .concat(perso.length ? ['', 'Portraits introuvables (' + perso.length + ')'].concat(perso) : []).join('\n');
      f.querySelector('.awk-dev-corps').innerHTML =
        '<p class="awk-dev-resume">' + liste.length + ' fichiers vérifiés · ' + db.length + ' exercices dans la bibliothèque.</p>'
        + bloc('Exercices sans image', sansImage)
        + bloc('Images d\'exercices introuvables', exo)
        + bloc('Images de scènes introuvables', scene)
        + (perso.length ? bloc('Portraits introuvables', perso) : '')
        + '<button type="button" class="awk-dev-copier" data-copier>Copier la liste</button>';
      f.querySelector('[data-copier]').onclick = function () {
        var fait = function () { toast('Liste copiée.', 'success'); };
        try { navigator.clipboard.writeText(texte).then(fait, function () { secours(texte); fait(); }); } catch (e) { secours(texte); fait(); }
      };
    });
  }
  function secours(t) {
    var a = document.createElement('textarea'); a.value = t; a.style.cssText = 'position:fixed;opacity:0;';
    document.body.appendChild(a); a.select(); try { document.execCommand('copy'); } catch (e) {} a.remove();
  }

  // ── 3. Profil test ───────────────────────────────────────────────
  var CLES = ['workoutHistory', 'bodyMeasurements'];
  function cleSauv() { return 'awakDevSauvegarde_' + pid(); }
  function lire(k) { try { var p = pid(); return p && window.getProfileData ? window.getProfileData(p, k) : localStorage.getItem(k); } catch (e) { return null; } }
  function ecrire(k, v) {
    try {
      var p = pid();
      if (p && window.setProfileData) window.setProfileData(p, k, v); else localStorage.setItem(k, v);
    } catch (e) {}
  }
  function aleat(seed) { return function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }

  var SEANCES = [
    { nom: 'Haut du corps', exos: [['Développé couché haltères', 'Pectoraux', 50, 10], ['Rowing haltère un bras', 'Dos', 45, 10], ['Développé militaire haltères', 'Épaules', 30, 10], ['Élévations latérales', 'Épaules', 12, 12]] },
    { nom: 'Bas du corps', exos: [['Soulevé de terre', 'Dos', 135, 6], ['Fentes arrière', 'Quadriceps', 30, 10], ['Hip thrust', 'Fessiers', 95, 10]] },
    { nom: 'Corps complet', exos: [['Pompes classiques', 'Pectoraux', 0, 15], ['Tractions pronation', 'Dos', 0, 6], ['Goblet Squat', 'Quadriceps', 40, 12], ['Planche', 'Abdominaux', 0, 1]] }
  ];
  function seancesFactices() {
    var r = aleat(7), l = [], maint = Date.now();
    for (var j = 90; j >= 1; j--) {
      var jr = new Date(maint - j * J).getDay();
      if (!(jr === 1 || jr === 3 || jr === 5) || r() < 0.18) continue;   // ~3 / semaine, quelques absences
      var s = SEANCES[l.length % SEANCES.length], prog = (90 - j) / 90;
      var d = new Date(maint - j * J); d.setHours(7 + Math.floor(r() * 12), Math.floor(r() * 60), 0, 0);
      var vol = 0, muscles = {};
      var exos = s.exos.map(function (e) {
        var poids = e[2] ? Math.round(e[2] * (1 + prog * 0.15) / 5) * 5 : 0;
        var series = [1, 2, 3].map(function () { var reps = Math.max(1, e[3] + Math.round(r() * 2 - 1)); vol += poids * reps; return { reps: reps, weight: poids, done: true }; });
        muscles[e[1]] = 1;
        return { name: e[0], muscle: e[1], sets: 3, reps: e[3], weight: poids, completedSets: series };
      });
      var duree = 35 + Math.floor(r() * 25);
      l.unshift({
        id: d.getTime(), date: d.toISOString(), name: s.nom, duration: duree, exercises: exos.length,
        muscles: Object.keys(muscles), musclesWorked: Object.keys(muscles), calories: Math.round(6 * 80 * duree / 60),
        volume: Math.round(vol * 0.453592), _volKg: 1, _devTest: true,
        workoutData: { name: s.nom, exercises: exos }
      });
    }
    return l;
  }
  function mesuresFactices(photoIds) {
    var l = [], maint = Date.now();
    for (var k = 0; k < 7; k++) {
      var j = 90 - k * 14, d = new Date(maint - j * J);
      var m = { id: d.getTime(), date: d.toISOString(), unit: 'lbs', weight: Math.round((186 - k * 1.4) * 10) / 10, height: 69,
        waist: Math.round((36 - k * 0.4) * 2) / 2, hips: 40, biceps: Math.round((14 + k * 0.1) * 2) / 2, thighs: 23, _devTest: true };
      if (photoIds[k]) m.photoId = photoIds[k];
      l.unshift(m);
    }
    return l;
  }
  // Photo factice : silhouette dessinée (aucune vraie image), un peu plus fine à chaque séance
  function photoFactice(pose, k) {
    var c = document.createElement('canvas'); c.width = 300; c.height = 400; var g = c.getContext('2d');
    var gr = g.createLinearGradient(0, 0, 0, 400); gr.addColorStop(0, '#1e293b'); gr.addColorStop(1, '#0f172a');
    g.fillStyle = gr; g.fillRect(0, 0, 300, 400);
    var larg = (pose === 'profil' ? 34 : 58) - k * 3;
    g.fillStyle = '#64748b';
    g.beginPath(); g.arc(150, 70, 26, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.ellipse(150, 190, larg, 95, 0, 0, Math.PI * 2); g.fill();
    g.fillRect(150 - larg * 0.7, 270, 22, 110); g.fillRect(150 + larg * 0.7 - 22, 270, 22, 110);
    g.fillStyle = '#94a3b8'; g.font = 'bold 16px sans-serif'; g.textAlign = 'center';
    g.fillText('TEST · ' + pose.toUpperCase(), 150, 390);
    return c.toDataURL('image/jpeg', 0.7);
  }
  function remplir() {
    if (localStorage.getItem(cleSauv())) { toast('Ce profil contient déjà les données test. Retire-les d\'abord.', 'warning', 3500); return; }
    confirmer('Remplir CE profil avec 3 mois de séances, 7 mesures et 3 séances photo factices ? Tes données actuelles (historique, mesures) sont mises de côté et reviennent avec « Retirer les données test ».', function () {
      var sauv = {}; CLES.forEach(function (k) { sauv[k] = lire(k); });
      try { localStorage.setItem(cleSauv(), JSON.stringify(sauv)); } catch (e) { toast('Stockage plein : impossible.', 'error'); return; }
      var maint = Date.now(), ids = {}, travaux = [];
      if (typeof window.awakPhotoDBPut === 'function' && window._photoPid) {
        [0, 3, 6].forEach(function (k, n) {
          var j = 90 - k * 14, date = new Date(maint - j * J).toISOString(), grp = 'gdev' + k;
          ['face', 'profil', 'dos'].forEach(function (pose, q) {
            var id = maint - j * J + q + 1;
            if (q === 0) ids[k] = id;
            travaux.push(window.awakPhotoDBPut(window._photoPid(), { id: id, date: date, dataUrl: photoFactice(pose, n), note: '', pose: pose, groupe: grp, _devTest: true }));
          });
        });
      }
      ecrire('workoutHistory', JSON.stringify(seancesFactices().concat(JSON.parse(sauv.workoutHistory || '[]')).slice(0, 200)));
      ecrire('bodyMeasurements', JSON.stringify(mesuresFactices(ids).concat(JSON.parse(sauv.bodyMeasurements || '[]'))));
      Promise.all(travaux).catch(function () {}).then(function () {
        return window.awakLoadProgressPhotos ? window.awakLoadProgressPhotos() : null;
      }).then(function () {
        majTest();
        toast('Profil test rempli.', 'success', 2500);
        try { if (window.awakProgVoir) window.awakProgVoir('resume'); else window.switchTab('history'); } catch (e) {}
      });
    });
  }
  function retirer() {
    var raw = localStorage.getItem(cleSauv());
    if (!raw) { toast('Aucune donnée test dans ce profil.'); return; }
    confirmer('Retirer les données test et remettre l\'historique et les mesures d\'avant ? Les séances faites depuis restent.', function () {
      var sauv = {}; try { sauv = JSON.parse(raw) || {}; } catch (e) {}
      CLES.forEach(function (k) {
        // garder ce qui a été ajouté depuis (non test), retirer les entrées test
        var cur = []; try { cur = JSON.parse(lire(k) || '[]') || []; } catch (e) {}
        var garde = cur.filter(function (x) { return x && !x._devTest; });
        ecrire(k, JSON.stringify(garde));
      });
      var fin = function () { try { localStorage.removeItem(cleSauv()); } catch (e) {} majTest(); toast('Données test retirées.', 'success'); try { if (window.renderWorkoutHistory) window.renderWorkoutHistory('all'); if (window.awakRenderCorpsCard) window.awakRenderCorpsCard(); } catch (e) {} };
      var ph = []; try { ph = (window.getProgressPhotos ? window.getProgressPhotos() : []).filter(function (p) { return p && /^gdev/.test(p.groupe || ''); }); } catch (e) {}
      if (!ph.length || typeof window.awakPhotoDBDelete !== 'function') return fin();
      Promise.all(ph.map(function (p) { return window.awakPhotoDBDelete(window._photoPid(), p.id); })).catch(function () {})
        .then(function () { return window.awakLoadProgressPhotos ? window.awakLoadProgressPhotos() : null; }).then(fin);
    });
  }
  function majTest() {
    var on = !!localStorage.getItem(cleSauv());
    var a = document.getElementById('devTestRemplir'), b = document.getElementById('devTestRetirer');
    if (a) a.hidden = on; if (b) b.hidden = !on;
  }

  window.AwakDev = { avancer: avancer, present: present, images: images, remplir: remplir, retirer: retirer, majTemps: majTemps, majTest: majTest };
  function init() { majTemps(); majTest(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
