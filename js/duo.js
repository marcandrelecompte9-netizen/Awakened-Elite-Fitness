/* ═══════════════════════════════════════════════════════════════════
   DUO — « Chacun sa séance » (v1601)
   ───────────────────────────────────────────────────────────────────
   Deux profils s'entraînent ensemble sur le même téléphone, chacun avec
   SA séance. Le meneur (profil actif) suit le moteur de séance normal ;
   le partenaire suit un carnet léger : exercice en cours, séries à valider,
   son propre repos (qui continue pendant que le meneur travaille).
   Les séries du partenaire passent par AwakGroup.logSet : à la fin, la
   séance est enregistrée dans SON profil (historique, records, XP) par le
   flux « Séance à plusieurs » existant.
   État : localStorage 'awakDuo' (survit à Quitter / Reprendre).
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var KEY = 'awakDuo';
  var C = '#22d3ee';

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function ico(n, t, c) { try { return window.AwakIcon ? window.AwakIcon.get(n, t, c) : ''; } catch (e) { return ''; } }
  function av(a, s) { try { if (typeof window.renderAvatar === 'function') return window.renderAvatar(a, s); } catch (e) { _awkE(e); } return ''; }
  // v1615 : respecte « Vibreur coupé » (et le vibreur natif de l'app Play Store)
  function vib(p) { try { if (typeof vibrate === 'function') vibrate(p); else if (localStorage.getItem('fitproVibOff') !== 'true' && navigator.vibrate) navigator.vibrate(p); } catch (e) { _awkE(e); } }
  function useKg() { try { return localStorage.getItem('fitproUseKg') === 'true'; } catch (e) { return false; } }
  function unite() { return useKg() ? 'kg' : 'lb'; }
  function versKg(v) { return useKg() ? v : v / 2.20462; }
  function depuisKg(v) { return useKg() ? v : v * 2.20462; }
  function arrondi(v) { return Math.round(v * 2) / 2; }

  function lire() { try { var s = JSON.parse(localStorage.getItem(KEY) || 'null'); return (s && s.pid) ? s : null; } catch (e) { return null; } }
  function ecrire(s) { try { if (s) localStorage.setItem(KEY, JSON.stringify(s)); else localStorage.removeItem(KEY); } catch (e) { _awkE(e); } }

  function mode() { try { return localStorage.getItem('awakGroupMode') === 'duo' ? 'duo' : 'meme'; } catch (e) { return 'meme'; } }
  function partenaireGroupe() {
    try {
      var p = (window.AwakGroup && AwakGroup.getParticipants()) || [];
      return p.filter(function (x) { return !x.self && x.kind === 'profile'; })[0] || null;
    } catch (e) { return null; }
  }
  // Duo actif = mode « Chacun sa séance » + partenaire présent + séance choisie pour lui
  function solo() { try { return localStorage.getItem('awakDuoSolo') === '1'; } catch (e) { return false; } }
  function setSolo(v) { try { if (v) localStorage.setItem('awakDuoSolo', '1'); else localStorage.removeItem('awakDuoSolo'); } catch (e) { _awkE(e); } }
  function seanceSpeciale() {
    try { var w = window.AwakSSBridge && AwakSSBridge.getWorkout(); return !!(w && (w._isRift || w._isHunt || w._famille)); } catch (e) { return false; }
  }
  function actif() {
    if (mode() !== 'duo') return false;
    if (seanceSpeciale()) return false;   // v1603 : rien n'y serait enregistré pour le partenaire
    if (solo()) return false;             // v1604 : « Solo cette fois »
    var s = lire(), p = partenaireGroupe();
    return !!(s && p && p.id === s.pid && s.exercises && s.exercises.length);
  }

  // ── Séances proposées pour le partenaire ────────────────────────────
  function routinesDe(pid) {
    try { var r = JSON.parse(localStorage.getItem('routines_' + pid) || '[]'); return Array.isArray(r) ? r : []; } catch (e) { return []; }
  }
  function mesRoutines() {
    try { return (typeof window.getRoutines === 'function' ? window.getRoutines() : []) || []; } catch (e) { return []; }
  }
  // v1605 : exercice de la base, sinon un exercice PERSO du partenaire (customExercises_<id>)
  function exDe(pid, nom) {
    var db = window.exerciseDatabase || [];
    for (var i = 0; i < db.length; i++) if (db[i].name === nom && !(db[i].custom && pid)) return db[i];
    try {
      var L = JSON.parse(localStorage.getItem('customExercises_' + pid) || '[]') || [];
      for (var k = 0; k < L.length; k++) if (L[k] && L[k].name === nom) {
        var c = L[k];
        return { name: c.name, muscle: c.muscle || '', mode: c.mesure === 'duree' ? 'timer' : undefined, equipment: c.equipment && c.equipment.length ? c.equipment : ['Poids du corps'],
          description: c.description || '', instructions: Array.isArray(c.instructions) ? c.instructions : (c.instructions ? String(c.instructions).split('\n') : []), custom: true, duration: 45 };
      }
    } catch (e) { _awkE(e); }
    for (var j = 0; j < db.length; j++) if (db[j].name === nom) return db[j];
    return null;
  }
  function depuisRoutine(r, pid) {
    return (r.exercises || []).map(function (ex) {
      var f = exDe(pid, ex.name);
      var m = ex.mode || (f && f.mode) || 'reps';
      if (m === 'duration') m = 'timer';
      return {
        name: ex.name, _baseName: ex.name, muscle: ex.muscle || (f && f.muscle) || '', perso: !!(f && f.custom),
        consigne: (f && f.custom) ? ((f.instructions && f.instructions.join(' · ')) || f.description || '') : '',
        sets: parseInt(ex.sets, 10) || 3, reps: ex.reps || (f && f.reps) || 10,
        mode: m, duration: parseInt(ex.duration, 10) || (f && parseInt(f.duration, 10)) || 45,
        rest: parseInt(ex.repos || ex.rest, 10) || 90,
        ss: ex.ss || null
      };
    }).filter(function (e) { return e.name; });
  }
  // v1603 : prochain jour de SON programme salle (d'après son historique)
  function progDe(pid) {
    try {
      var g = (typeof gymPrograms !== 'undefined') ? gymPrograms : null; if (!g) return null;
      var h = JSON.parse(localStorage.getItem('profile_' + pid + '_workoutHistory') || '[]');
      var d = null;
      for (var i = 0; i < h.length; i++) { var w = h[i] && h[i].workoutData; if (w && w._salleProg && w._salleJour) { d = w; break; } }
      if (!d || !g[d._salleProg]) return null;
      var cles = Object.keys(g[d._salleProg]), j = cles[(cles.indexOf(d._salleJour) + 1) % cles.length];
      var jour = g[d._salleProg][j]; if (!jour) return null;
      var db = window.exerciseDatabase || [];
      var rx = function (e) { try { return window.AwakSalle ? AwakSalle.prescription(e, d._salleProg) : null; } catch (x) { return null; } };
      var ex = (jour.exercises || []).map(function (n) {
        var f = null; for (var k = 0; k < db.length; k++) if (db[k].name === n) { f = db[k]; break; }
        if (!f) return null;
        var p = rx(f) || { sets: 3, reps: 10, repos: 90 };
        return { name: f.name, _baseName: f.name, muscle: f.muscle || '', sets: p.sets || 3, reps: p.reps || 10, mode: 'reps', duration: 45, rest: p.repos || 90 };
      }).filter(Boolean);
      if (!ex.length) return null;
      var nom = String(jour.name || 'Programme').replace(/^\s*\S+\s*·\s*/, '');
      return { nom: nom, exercises: ex, prog: d._salleProg, jour: j };
    } catch (e) { return null; }
  }
  // v1604 : séance du jour de SON mentor (programme de star)
  var _starCache = {};
  function starDe(pid) {
    var cleC = pid + '|' + new Date().toDateString();
    if (_starCache[cleC] !== undefined) return _starCache[cleC];
    return (_starCache[cleC] = starCalc(pid));
  }
  function starCalc(pid) {
    try {
      if (typeof CELEBRITY_PROGRAMS === 'undefined' || typeof CELEBRITY_ACTIVE_KEY === 'undefined') return null;
      var id = localStorage.getItem(CELEBRITY_ACTIVE_KEY + '_' + pid); if (!id) return null;
      var c = null; for (var i = 0; i < CELEBRITY_PROGRAMS.length; i++) if (CELEBRITY_PROGRAMS[i].id === id) { c = CELEBRITY_PROGRAMS[i]; break; }
      if (!c) return null;
      var jour = c.splits && c.splits[(new Date().getDay() + 6) % 7];
      if (!jour) return null;
      var propre = String(jour.name).replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, '').trim();
      if (/repos/i.test(jour.name)) return { repos: true, nom: (c.nickname || c.name) + ' · ' + propre };
      var muscles = (typeof _splitNameToMuscles === 'function') ? (_splitNameToMuscles(jour.name) || []) : [];
      if (!muscles.length) return { repos: true, nom: (c.nickname || c.name) + ' · ' + propre + ' (pas de séance de force)' };
      var db = window.exerciseDatabase || [];
      var ex = (c.exercises || []).map(function (e) {
        var f = null; for (var k = 0; k < db.length; k++) if (db[k].name === e.name) { f = db[k]; break; }
        if (!f || muscles.indexOf(f.muscle) < 0) return null;
        var m = (e.mode || f.mode) === 'timer' || (e.mode || f.mode) === 'duration' ? 'timer' : 'reps';
        return { name: f.name, _baseName: f.name, muscle: f.muscle, sets: parseInt(e.sets, 10) || 3, reps: e.reps || f.reps || 10, mode: m,
          duration: parseInt(e.duration || f.duration, 10) || 45, rest: parseInt(e.rest, 10) || 60 };
      }).filter(Boolean).filter(function (e) { return !bloque({ pid: pid }, e); });
      // v1605 : comme pour le meneur, compléter jusqu'à 4 exercices des muscles du jour
      if (ex.length < 4 && typeof generateExercisesForMuscles === 'function') {
        try {
          var pris = ex.map(function (e) { return e.name; });
          var eq = []; try { eq = (typeof getSelectedEquipmentNames === 'function' ? getSelectedEquipmentNames() : []) || []; } catch (x) { _awkE(x); }
          (generateExercisesForMuscles(muscles, { count: 10, level: c.level || 'Intermédiaire' }) || []).forEach(function (g) {
            if (ex.length >= 5 || !g || pris.indexOf(g.name) >= 0) return;
            var f = null; for (var k = 0; k < db.length; k++) if (db[k].name === g.name) { f = db[k]; break; }
            if (!f || bloque({ pid: pid }, f)) return;
            if (eq.length && !(f.equipment || ['Poids du corps']).every(function (m) { return m === 'Poids du corps' || m === 'Aucun' || eq.indexOf(m) >= 0; })) return;
            pris.push(f.name);
            ex.push({ name: f.name, _baseName: f.name, muscle: f.muscle, sets: 3, reps: f.reps || 10, mode: (f.mode === 'timer' || f.mode === 'duration') ? 'timer' : 'reps', duration: parseInt(f.duration, 10) || 45, rest: 60 });
          });
        } catch (x) { _awkE(x); }
      }
      ex = ex.slice(0, 8);
      if (!ex.length) return null;
      return { nom: (c.nickname || c.name) + ' · ' + propre, exercises: ex, mentor: c.id };
    } catch (e) { return null; }
  }
  function source(pid, routineId, src) {
    if (src === 'star') { var st = starDe(pid); return (st && !st.repos) ? { id: 'star', name: st.nom, exercises: st.exercises, mentor: st.mentor } : null; }
    if (src === 'prog') { var pg = progDe(pid); return pg ? { id: 'prog', name: pg.nom, exercises: pg.exercises, prog: pg.prog, jour: pg.jour } : null; }
    var liste = src === 'moi' ? mesRoutines() : routinesDe(pid);
    for (var i = 0; i < liste.length; i++) if (String(liste[i].id) === String(routineId)) return { id: liste[i].id, name: liste[i].name, exercises: depuisRoutine(liste[i], src === 'moi' ? null : pid) };
    return null;
  }
  function choisir(pid, routineId, src) {
    var p = partenaireGroupe(); if (!p || p.id !== pid) return false;
    var r = source(pid, routineId, src);
    if (!r || !r.exercises.length) return false;
    ecrire({ pid: pid, nom: p.name, avatar: p.avatar, routineId: r.id, source: src,
      nomSeance: r.name || 'Séance', exercises: r.exercises, prog: r.prog || null, jour: r.jour || null, mentor: r.mentor || null,
      idx: 0, faits: {}, ajout: {}, reposFin: null, alerte: false, fini: false });
    return true;
  }
  // Nouvelle séance du meneur : on garde le choix, on repart de zéro
  function nouvelleSeance() {
    var s = lire(); if (!s) return;
    var r = source(s.pid, s.routineId, s.source);
    if (r && r.exercises.length) { s.exercises = r.exercises; s.nomSeance = r.name || s.nomSeance; s.prog = r.prog || null; s.jour = r.jour || null; s.mentor = r.mentor || null; }
    s.idx = 0; s.faits = {}; s.ajout = {}; s.echs = {}; s.modeEchauf = false; s.debut = null; s.derniere = null;
    s.reposFin = null; s.alerte = false; s.fini = false; s.effortFin = null;
    _attente = null;   // v1608 : une ancienne attente de fin ne doit pas suivre dans la séance suivante
    ecrire(s);
  }
  function oublier() { ecrire(null); _attente = null; fermerFeuille(); retirerBarre(); }

  // Gabarit pour l'enregistrement (AwakGroup.buildWorkoutForParticipant)
  function gabarit() {
    var s = lire(); if (!s) return null;
    var g = { name: s.nomSeance + ' (en duo)', exercises: s.exercises };
    if (s.prog) { g._salleProg = s.prog; g._salleJour = s.jour; }
    return g;
  }

  // ── Progression du partenaire ───────────────────────────────────────
  function nbSeries(s, i) { var e = s.exercises[i]; return (e ? e.sets : 0) + ((s.ajout && s.ajout[i]) || 0); }
  function faitsDe(s, i) { return (s.faits && s.faits[i]) || []; }
  function restants(s) {
    var n = 0;
    for (var i = s.idx; i < s.exercises.length; i++) if (faitsDe(s, i).length < nbSeries(s, i)) n++;
    return n;
  }
  // v1603 : ses dernières séries (exercisePerformances_<id>, rempli aussi en solo)
  function perfsDe(s, i) {
    try {
      var p = JSON.parse(localStorage.getItem('exercisePerformances_' + s.pid) || '{}') || {};
      var l = p[s.exercises[i]._baseName || s.exercises[i].name] || [];
      if (!l.length) return null;
      var der = l[l.length - 1], jour = String(der.date || '').slice(0, 10);
      var meme = l.filter(function (x) { return String(x.date || '').slice(0, 10) === jour; });
      return meme.length ? meme : [der];
    } catch (e) { return null; }
  }
  function suggestion(s, i) {
    var l = perfsDe(s, i); if (!l) return null;
    var avecPoids = l.filter(function (x) { return parseFloat(x.weight) > 0; });
    if (!avecPoids.length) return null;
    var kg = Math.max.apply(null, avecPoids.map(function (x) { return parseFloat(x.weight); }));
    var der = avecPoids[avecPoids.length - 1];
    var cibleTxt = String(s.exercises[i].reps || ''), m = cibleTxt.match(/(\d+)\s*[-–à]\s*(\d+)/);
    var cible = m ? parseInt(m[2], 10) : (parseInt(cibleTxt, 10) || 0);
    var monte = cible > 0 && avecPoids.every(function (x) { return (parseInt(x.reps, 10) || 0) >= cible; });
    var dispo = arrondi(depuisKg(kg));
    return { poids: monte ? dispo + (useKg() ? 2.5 : 5) : dispo, monte: monte, avant: dispo, reps: parseInt(der.reps, 10) || 0 };
  }
  function dernierPoids(s, i) {
    var f = faitsDe(s, i);
    for (var k = f.length - 1; k >= 0; k--) if (f[k].kg) return arrondi(depuisKg(f[k].kg));
    var sg = suggestion(s, i); if (sg) return sg.poids;
    // Sinon : sa dernière séance où il a fait cet exercice
    try {
      var nom = s.exercises[i].name;
      var h = JSON.parse(localStorage.getItem('profile_' + s.pid + '_workoutHistory') || '[]');
      for (var a = 0; a < h.length && a < 60; a++) {
        var ex = (h[a] && h[a].workoutData && h[a].workoutData.exercises) || [];
        for (var b = 0; b < ex.length; b++) {
          if (!ex[b] || (ex[b]._baseName || ex[b].name) !== nom || !ex[b].completedSets) continue;
          var cs = ex[b].completedSets.filter(function (x) { return !x.warmup && parseFloat(x.weight) > 0; });
          if (cs.length) return arrondi(depuisKg(parseFloat(cs[cs.length - 1].weight)));
        }
      }
    } catch (e) { _awkE(e); }
    return '';
  }

  var _tVal = 0;
  function valider(i) {
    var t = Date.now(); if (t - _tVal < 500) return; _tVal = t;   // v1604 : double touche = 1 série
    var s = lire(); if (!s || s.fini) return;
    var ex = s.exercises[i]; if (!ex) return;
    var f = faitsDe(s, i);
    if (f.length >= nbSeries(s, i)) return;
    var reps = 0, kg = 0;
    var echauf = !!s.modeEchauf && ex.mode !== 'timer';
    if (ex.mode !== 'timer') {
      var r = document.getElementById('awakDuoReps'), w = document.getElementById('awakDuoPoids');
      reps = r ? parseInt(r.value, 10) : 0;
      if (!(reps > 0)) { try { showToast('Entre le nombre de répétitions', 'info', 1800); } catch (e) { _awkE(e); } return; }
      var wd = w ? parseFloat(String(w.value).replace(',', '.')) : 0;
      kg = wd > 0 ? Math.round(versKg(wd) * 100) / 100 : 0;
    }
    if (echauf) {
      // v1605 : série d'échauffement — notée (non comptée dans records / volume / XP), petit repos
      if (!s.echs) s.echs = {};
      (s.echs[i] = s.echs[i] || []).push({ reps: reps, kg: kg });
      s.modeEchauf = false;
      if (!s.debut) s.debut = Date.now();
      s.derniere = Date.now();
      try { if (window.AwakGroup) AwakGroup.logSet(s.pid, ex._baseName || ex.name, s.echs[i].length, reps, kg, true); } catch (e) { _awkE(e); }
      s.reposFin = Date.now() + 45000; s.alerte = false;
      ecrire(s); rendre(); return;
    }
    f.push({ reps: reps, kg: kg });
    if (!s.debut) s.debut = Date.now();
    s.derniere = Date.now();
    s.effortFin = null; s.effortIdx = null;   // v1602
    if (!s.faits) s.faits = {};
    s.faits[i] = f;
    try { if (window.AwakGroup) AwakGroup.logSet(s.pid, ex._baseName || ex.name, f.length, reps, kg, false); } catch (e) { _awkE(e); }
    vib(30);
    var exoFini = f.length >= nbSeries(s, i);
    if (exoFini && i === s.exercises.length - 1) {
      s.fini = true; s.reposFin = null; s.alerte = false;
      ecrire(s);
      try { showToast('Séance terminée pour ' + s.nom, 'success', 2600); } catch (e) { _awkE(e); }
      if (_attente) { var cb = _attente; _attente = null; fermerFeuille(); setTimeout(cb, 300); return; }
    } else {
      var g = groupe(s, i), suivant = null, repos = true;
      if (g.length > 1) {
        // v1604 : superset — A → B sans repos, repos à la fin du tour, puis retour à A
        var pos = g.indexOf(i);
        for (var d = 1; d <= g.length; d++) {
          var j = g[(pos + d) % g.length];
          if (faitsDe(s, j).length < nbSeries(s, j)) { suivant = j; repos = (pos + d) >= g.length; break; }
        }
        if (suivant == null) suivant = g[g.length - 1] + 1;
        if (suivant === i) repos = true;
        s.idx = Math.min(suivant, s.exercises.length - 1);
      } else if (exoFini && i === s.idx) s.idx = i + 1;
      if (!repos) { s.reposFin = null; s.alerte = false; ecrire(s); rendre(); return; }
      s.reposFin = Date.now() + (ex.rest || 90) * 1000;
      s.alerte = false;
      ecrire(s);
    }
    rendre();
  }
  // Indices du superset (même marqueur ss, consécutifs) qui contient i
  function groupe(s, i) {
    var ss = s.exercises[i] && s.exercises[i].ss; if (!ss) return [i];
    var a = i, b = i;
    while (a > 0 && s.exercises[a - 1].ss === ss) a--;
    while (b < s.exercises.length - 1 && s.exercises[b + 1].ss === ss) b++;
    var g = []; for (var k = a; k <= b; k++) g.push(k); return g;
  }
  function annuler(i) {
    var s = lire(); if (!s) return;
    var f = faitsDe(s, i); if (!f.length) return;
    f.pop(); s.faits[i] = f; s.fini = false;
    ecrire(s);
    try { if (window.AwakGroup && AwakGroup.retirerDerniere) AwakGroup.retirerDerniere(s.pid, s.exercises[i]._baseName || s.exercises[i].name, false); } catch (e) { _awkE(e); }
    rendre();
  }
  function annulerEchauf(i) {
    var s = lire(); if (!s || !s.echs || !s.echs[i] || !s.echs[i].length) return;
    s.echs[i].pop(); ecrire(s);
    try { if (window.AwakGroup && AwakGroup.retirerDerniere) AwakGroup.retirerDerniere(s.pid, s.exercises[i]._baseName || s.exercises[i].name, true); } catch (e) { _awkE(e); }
    rendre();
  }
  function aller(d) {
    var s = lire(); if (!s) return;
    s.effortFin = null; s.effortIdx = null; s.modeEchauf = false;   // v1607 : le chrono ne valide plus l'ancien exercice
    s.idx = Math.max(0, Math.min(s.exercises.length - 1, s.idx + d));
    ecrire(s); rendre();
  }
  function ajouterSerie() {
    var s = lire(); if (!s) return;
    if (!s.ajout) s.ajout = {};
    s.ajout[s.idx] = (s.ajout[s.idx] || 0) + 1;
    s.fini = false;
    ecrire(s); rendre();
  }
  // v1602 : chrono d'un exercice tenu (gainage…) — fin = série validée toute seule
  function lancer(i) {
    var s = lire(); if (!s || s.fini) return;
    var ex = s.exercises[i]; if (!ex) return;
    s.reposFin = null; s.alerte = false;
    s.effortFin = Date.now() + (parseInt(ex.duration, 10) || 30) * 1000; s.effortIdx = i;
    ecrire(s); rendre();
  }
  function arreter() { var s = lire(); if (!s) return; s.effortFin = null; s.effortIdx = null; ecrire(s); rendre(); }
  function ajusterRepos(d) {
    var s = lire(); if (!s || !s.reposFin) return;
    s.reposFin = Math.max(Date.now() + 5000, s.reposFin + d * 1000); ecrire(s);
    var c = document.getElementById('awakDuoChrono'); if (c) c.textContent = mmss((s.reposFin - Date.now()) / 1000);
    majBarre();
  }
  // Remplacer l'exercice en cours (machine occupée) — seulement s'il n'a encore aucune série
  var _remp = false;
  function remplacer() { _remp = !_remp; rendre(); }
  function choisirRemplacant(nom) {
    var s = lire(); if (!s) return;
    var i = s.idx, ex = s.exercises[i]; if (!ex || faitsDe(s, i).length) return;
    var db = window.exerciseDatabase || [], f = null;
    for (var k = 0; k < db.length; k++) if (db[k].name === nom) { f = db[k]; break; }
    if (!f) return;
    var m = f.mode === 'timer' || f.mode === 'duration' ? 'timer' : 'reps';
    s.effortFin = null; s.effortIdx = null;
    // v1609 : les échauffements faits sur l'ancien exercice sont retirés (ils restaient
    // affichés mais enregistrés sous l'ancien nom, puis perdus)
    var vieux = ex._baseName || ex.name;
    ((s.echs && s.echs[i]) || []).forEach(function () { try { AwakGroup.retirerDerniere(s.pid, vieux, true); } catch (x) { _awkE(x); } });
    if (s.echs) s.echs[i] = [];
    s.exercises[i] = { ss: ex.ss || null, name: f.name, _baseName: f.name, muscle: f.muscle || ex.muscle, sets: ex.sets, reps: m === 'timer' ? ex.reps : (ex.mode === 'timer' ? (f.reps || 10) : ex.reps),
      mode: m, duration: parseInt(f.duration, 10) || ex.duration || 45, rest: ex.rest };
    ecrire(s); _remp = false; rendre();
    try { showToast('Remplacé par ' + f.name, 'info', 1800); } catch (e) { _awkE(e); }
  }
  function remplacants(s, ex) {
    var db = window.exerciseDatabase || [];
    var q = String((document.getElementById('awakDuoCherche') || {}).value || '').toLowerCase();
    var deja = s.exercises.map(function (e) { return e.name; });
    return db.filter(function (e) {
      if (!e || e.type !== 'exercise' || deja.indexOf(e.name) >= 0) return false;
      try { if (window.awakEstDoublon && awakEstDoublon(e.name)) return false; } catch (x) { _awkE(x); }
      if (q) return e.name.toLowerCase().indexOf(q) >= 0;
      if (!(e.muscle && e.muscle === ex.muscle)) return false;
      // même lieu que le meneur : seulement le matériel disponible ici
      var eq = []; try { eq = (typeof getSelectedEquipmentNames === 'function' ? getSelectedEquipmentNames() : []) || []; } catch (x) { _awkE(x); }
      return !eq.length || (e.equipment || ['Poids du corps']).some(function (m) { return m === 'Poids du corps' || eq.indexOf(m) >= 0; });
    }).filter(function (e) { return !bloque(s, e); }).slice(0, 14);
  }
  // v1607 : mêmes règles que pour le meneur, mais pour SON profil : limitations, zones
  // douloureuses, mobilité réduite, âge (enfant : poids du corps ; ado : ni barre ni machine)
  function bloque(s, e) {
    if (!s || !e) return null;
    var pid = s.pid, db = window.exerciseDatabase || [], t = e;
    if (!t.equipment || !t.muscle) { for (var k = 0; k < db.length; k++) if (db[k].name === e.name) { t = Object.assign({}, db[k], e); break; } }
    try { var l = window.AwakLimitations && AwakLimitations.bloquePour && AwakLimitations.bloquePour(pid, t); if (l) return l; } catch (x) { _awkE(x); }
    try { if (window.AwakPain && AwakPain.exerciseHitsPainFor && AwakPain.exerciseHitsPainFor(t, [pid])) return { titre: 'zone douloureuse' }; } catch (x) { _awkE(x); }
    try { if (window.AwakAdaptive && AwakAdaptive.isReducedMobilityProfile && AwakAdaptive.isReducedMobilityProfile(pid) && AwakAdaptive.isUnsuitable(t)) return { titre: 'mobilité réduite' }; } catch (x) { _awkE(x); }
    try {
      var cat = window.AwakYouth && AwakYouth.ageCategoryOf ? AwakYouth.ageCategoryOf(pid) : null;
      var eq = t.equipment || ['Poids du corps'];
      if (cat === 'child' && eq.some(function (m) { return !/^(Poids du corps|Aucun|Tapis de sol)$/i.test(String(m)); })) return { titre: 'âge (poids du corps seulement)' };
      if (cat === 'teen' && eq.some(function (m) { return m === 'Barre' || m === 'Machine'; })) return { titre: 'âge (ni barre ni machine)' };
    } catch (x) { _awkE(x); }
    return null;
  }
  // v1608 : matériel de l'exercice absent du lieu actuel (même lieu que le meneur)
  function materielManquant(ex) {
    try {
      var eq = (typeof getSelectedEquipmentNames === 'function' ? getSelectedEquipmentNames() : []) || [];
      if (!eq.length) return null;
      var db = window.exerciseDatabase || [], f = null;
      for (var k = 0; k < db.length; k++) if (db[k].name === ex.name) { f = db[k]; break; }
      var req = (f && f.equipment) || [];
      for (var i = 0; i < req.length; i++) if (!/^(Poids du corps|Aucun|Tapis|Tapis de sol)$/i.test(req[i]) && eq.indexOf(req[i]) < 0) return String(req[i]).toLowerCase();
    } catch (e) { _awkE(e); }
    return null;
  }
  function versMoi() { fermerFeuille(); majBarre(); }   // en attente de fin : ne termine PAS la séance
  function basculerEchauf() { var s = lire(); if (!s) return; s.modeEchauf = !s.modeEchauf; ecrire(s); rendre(); }
  function passerRepos() { var s = lire(); if (!s) return; s.reposFin = null; s.alerte = false; ecrire(s); rendre(); }

  // ── Horloge : repos du partenaire, même quand sa feuille est fermée ──
  var _tick = null;
  function demarrerHorloge() {
    if (_tick) return;
    _tick = setInterval(function () {
      var vue = document.getElementById('exerciseView');
      if (!actif() || !vue || vue.classList.contains('hidden')) {
        clearInterval(_tick); _tick = null; retirerBarre(); fermerFeuille(); return;
      }
      var s = lire();
      if (s && s.effortFin && Date.now() >= s.effortFin) {
        var ie = s.effortIdx;
        vib([120, 80, 120]);
        try { showToast(s.nom + ' : temps terminé', 'success', 2200); } catch (e) { _awkE(e); }
        valider(ie); s = lire();
      }
      var ef = document.getElementById('awakDuoEffort');
      if (ef && s && s.effortFin) ef.textContent = mmss((s.effortFin - Date.now()) / 1000);
      if (s && s.reposFin && Date.now() >= s.reposFin) {
        s.reposFin = null; s.alerte = !document.getElementById('awakDuoSheet'); ecrire(s);
        vib([200, 100, 200]);
        try { showToast(s.nom + ' : repos terminé, à toi !', 'info', 3500); } catch (e) { _awkE(e); }
        try { if (typeof window.awakParler === 'function') window.awakParler(s.nom + ', à toi'); } catch (e) { _awkE(e); }
      }
      majBarre();
      var c = document.getElementById('awakDuoChrono');
      if (c && s && s.reposFin) c.textContent = mmss((s.reposFin - Date.now()) / 1000);
      else if (c) rendre();
    }, 1000);
  }
  function mmss(sec) { sec = Math.max(0, Math.ceil(sec)); return Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0'); }

  // ── Barre des onglets (sous la barre du haut de la séance) ──────────
  function etatPartenaire(s) {
    if (s.fini) return { t: 'Terminé', c: '#8391a7' };
    if (s.effortFin) return { t: 'Effort ' + mmss((s.effortFin - Date.now()) / 1000), c: C };
    if (s.reposFin) return { t: 'Repos ' + mmss((s.reposFin - Date.now()) / 1000), c: '#fbbf24' };
    if (s.alerte) return { t: 'À toi !', c: C };
    var e = s.exercises[s.idx];
    return { t: 'Ex. ' + (s.idx + 1) + '/' + s.exercises.length + ' · S' + Math.min(faitsDe(s, s.idx).length + 1, nbSeries(s, s.idx)), c: '#a3b1c2' };
  }
  function moi() { try { return AwakGroup._self(); } catch (e) { return { name: 'Toi', avatar: '' }; } }
  function barreHTML(cote) {
    var s = lire(); if (!s) return '';
    var m = moi(), ep = etatPartenaire(s);
    var seg = function (on, nom, avatar, sous, sousC, clic, classe) {
      return '<button onclick="' + clic + '" aria-pressed="' + (on ? 'true' : 'false') + '" style="flex:1;min-width:0;min-height:48px;display:flex;align-items:center;gap:8px;padding:6px 10px;border-radius:12px;cursor:pointer;text-align:left;font-family:inherit;'
        + (on ? 'background:rgba(34,211,238,0.14);border:1.5px solid rgba(34,211,238,0.6);' : 'background:rgba(255,255,255,0.03);border:1.5px solid rgba(255,255,255,0.08);') + '">'
        + '<span style="flex-shrink:0;display:inline-flex;">' + av(avatar, 26) + '</span>'
        + '<span style="min-width:0;flex:1;"><span style="display:block;font-size:0.8em;font-weight:900;color:' + (on ? '#fff' : '#cbd5e1') + ';overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + esc(nom) + '</span>'
        + '<span' + (classe ? ' class="' + classe + '"' : '') + ' style="display:block;font-size:0.66em;font-weight:800;color:' + sousC + ';white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + esc(sous) + '</span></span></button>';
    };
    var sousMoi = _attente ? 'Terminée' : 'Ta séance';
    return '<div style="display:flex;gap:6px;">'
      + seg(cote === 'moi', m.name || 'Toi', m.avatar, sousMoi, '#8391a7', 'AwakDuo.versMoi()')
      + seg(cote === 'lui', s.nom, s.avatar, ep.t, ep.c, 'AwakDuo.ouvrir()', 'awkDuoEtat')
      + '</div>';
  }
  function majTexte(hote, cote) {
    var s = lire(); if (!s || !hote) return;
    var cle = s.pid + '|' + (_attente ? 1 : 0) + '|' + cote;
    if (hote.getAttribute('data-cle') !== cle) { hote.innerHTML = barreHTML(cote); hote.setAttribute('data-cle', cle); return; }
    var ep = etatPartenaire(s);
    var x = hote.querySelector('.awkDuoEtat');
    if (x && x.textContent !== ep.t) { x.textContent = ep.t; x.style.color = ep.c; }
  }
  function majBarre() {
    var b = document.getElementById('awakDuoBar');
    if (!b) {
      var top = document.getElementById('workoutTopBar'); if (!top || !top.parentNode) return;
      b = document.createElement('div');
      b.id = 'awakDuoBar';
      b.style.cssText = 'padding:8px 12px;background:#020510;border-bottom:1px solid rgba(34,211,238,0.15);';
      top.parentNode.insertBefore(b, top.nextSibling);
    }
    majTexte(b, 'moi');
    majTexte(document.getElementById('awakDuoSheetBar'), 'lui');
  }
  function retirerBarre() { var b = document.getElementById('awakDuoBar'); if (b) b.remove(); }
  function monter() {
    if (!actif()) { retirerBarre(); return; }
    majBarre(); demarrerHorloge();
  }

  // ── Feuille du partenaire ───────────────────────────────────────────
  function fermerFeuille() { var f = document.getElementById('awakDuoSheet'); if (f) f.remove(); }
  function ouvrir() {
    if (!actif()) return;
    var s = lire(); if (s && s.alerte) { s.alerte = false; ecrire(s); }
    var f = document.getElementById('awakDuoSheet');
    if (!f) {
      f = document.createElement('div');
      f.id = 'awakDuoSheet';
      f.style.cssText = 'position:fixed;inset:0;z-index:99990;background:#05070d;overflow-y:auto;-webkit-overflow-scrolling:touch;';
      document.body.appendChild(f);
    }
    rendre();
  }
  function rendre() {
    majBarre();
    var f = document.getElementById('awakDuoSheet'); if (!f) return;
    var s = lire(); if (!s) { fermerFeuille(); return; }
    // v1606 : garder ce qui est en train d'être tapé (avant : la fin du repos effaçait reps / poids)
    var cleSaisie = s.idx + ':' + faitsDe(s, s.idx).length + ':' + (s.modeEchauf ? 1 : 0);
    var gardeR = document.getElementById('awakDuoReps'), gardeP = document.getElementById('awakDuoPoids');
    var garde = (f.getAttribute('data-saisie') === cleSaisie && gardeR) ? { r: gardeR.value, p: gardeP ? gardeP.value : '', foc: document.activeElement && document.activeElement.id } : null;
    var i = s.idx, ex = s.exercises[i], f2 = faitsDe(s, i), n = nbSeries(s, i);
    var tenue = ex.mode === 'timer';
    var cible = tenue ? (ex.duration + ' s') : (ex.reps + ' reps');
    var h = '<div style="max-width:520px;margin:0 auto;padding:calc(env(safe-area-inset-top,0px) + 12px) 14px calc(env(safe-area-inset-bottom,0px) + 24px);">';
    h += '<div id="awakDuoSheetBar">' + barreHTML('lui') + '</div>';
    if (_attente) h += '<div style="margin-top:12px;padding:11px 13px;border-radius:12px;background:rgba(34,211,238,0.08);border:1px solid rgba(34,211,238,0.35);color:#a5f3fc;font-size:0.8em;font-weight:700;line-height:1.45;">Ta séance est finie. Termine celle de ' + esc(s.nom) + ' : tout sera enregistré à la fin.</div>';
    h += '<div style="margin-top:16px;font-size:0.6em;letter-spacing:2px;color:#67e8f9;font-weight:900;text-transform:uppercase;">Séance de ' + esc(s.nom) + ' · ' + esc(s.nomSeance) + '</div>';

    if (s.fini) {
      h += '<div style="margin-top:22px;text-align:center;padding:26px 16px;border-radius:16px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);">'
        + '<div style="display:inline-flex;width:56px;height:56px;border-radius:50%;align-items:center;justify-content:center;background:rgba(34,211,238,0.12);border:1.5px solid ' + C + ';color:' + C + ';"><svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L19 7"/></svg></div>'
        + '<div style="margin-top:10px;font-size:1.1em;font-weight:900;color:#fff;">Séance terminée pour ' + esc(s.nom) + '</div>'
        + '<div style="margin-top:4px;font-size:0.8em;color:#a3b1c2;">Elle sera enregistrée dans son profil à la fin de ta séance.</div>'
        + '<button onclick="AwakDuo.annuler(' + (s.exercises.length - 1) + ')" style="margin-top:14px;min-height:40px;padding:8px 14px;border-radius:10px;background:transparent;border:1px solid rgba(255,255,255,0.14);color:#cbd5e1;font-size:0.8em;font-weight:700;cursor:pointer;">Annuler la dernière série</button>'
        + '</div>';
    } else {
      h += '<div style="margin-top:4px;font-size:0.7em;color:#8391a7;font-weight:800;">Exercice ' + (i + 1) + ' sur ' + s.exercises.length + '</div>';
      var gS = groupe(s, i);
      if (gS.length > 1) h += '<div style="margin-top:4px;display:inline-block;font-size:0.62em;font-weight:900;letter-spacing:1.2px;color:#67e8f9;padding:2px 8px;border-radius:6px;background:rgba(34,211,238,0.1);border:1px solid rgba(34,211,238,0.3);">SUPERSET · ' + 'ABCDEF'.charAt(gS.indexOf(i)) + '</div>';
      h += '<button onclick="AwakDuo.fiche()" style="display:flex;align-items:center;gap:8px;width:100%;min-height:0;margin-top:4px;padding:0;background:transparent;border:none;text-align:left;cursor:pointer;color:#fff;font-family:inherit;">'
        + '<span style="flex:1;min-width:0;font-size:1.35em;font-weight:900;line-height:1.2;">' + esc(ex.name) + '</span>'
        + (ex.perso ? '' : '<span style="flex-shrink:0;font-size:0.68em;font-weight:800;color:#67e8f9;padding:4px 9px;border-radius:99px;border:1px solid rgba(34,211,238,0.35);">Fiche</span>') + '</button>';
      if (ex.perso && ex.consigne) h += '<div style="margin-top:4px;font-size:0.74em;color:#a3b1c2;line-height:1.45;">' + esc(ex.consigne) + '</div>';
      h += '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;">'
        + (ex.muscle ? '<span style="font-size:0.7em;font-weight:800;color:#a3b1c2;padding:3px 9px;border-radius:99px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);">' + esc(ex.muscle) + '</span>' : '')
        + '<span style="font-size:0.7em;font-weight:800;color:#67e8f9;padding:3px 9px;border-radius:99px;background:rgba(34,211,238,0.1);border:1px solid rgba(34,211,238,0.3);">' + n + ' × ' + esc(cible) + '</span>'
        + (!f2.length ? '<button onclick="AwakDuo.remplacer()" style="min-height:0;font-size:0.7em;font-weight:800;color:#cbd5e1;padding:3px 10px;border-radius:99px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.14);cursor:pointer;">' + (_remp ? 'Annuler' : 'Remplacer') + '</button>' : '')
        + '</div>';
      var manque = materielManquant(ex);
      if (manque && !bloque(s, ex)) h += '<div style="margin-top:8px;padding:8px 11px;border-radius:10px;background:rgba(96,168,240,0.08);border:1px solid rgba(96,168,240,0.35);font-size:0.74em;color:#93c5fd;font-weight:700;line-height:1.4;">Pas de ' + esc(manque) + ' à ce lieu. Touche Remplacer.</div>';
      var bl = bloque(s, ex);
      if (bl) h += '<div style="margin-top:8px;padding:8px 11px;border-radius:10px;background:rgba(251,191,36,0.08);border:1px solid rgba(251,191,36,0.35);font-size:0.74em;color:#fcd34d;font-weight:700;line-height:1.4;">Déconseillé pour ' + esc(s.nom) + ' : ' + esc(bl.titre || 'limitation') + '. Touche Remplacer.</div>';
      if (_remp && !f2.length) {
        var L = remplacants(s, ex);
        h += '<div style="margin-top:10px;padding:10px;border-radius:12px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);">'
          + '<input id="awakDuoCherche" type="text" placeholder="Chercher un exercice" oninput="AwakDuo._filtrer()" style="width:100%;box-sizing:border-box;height:40px;padding:0 10px !important;border-radius:10px;border:1px solid rgba(34,211,238,0.3) !important;background:rgba(255,255,255,0.04) !important;color:#fff;font-size:0.85em;margin-bottom:8px;">'
          + '<div id="awakDuoRempl">' + listeRempl(L) + '</div></div>';
      }
      var sg = !f2.length && !tenue ? suggestion(s, i) : null;
      if (sg) h += '<div style="margin-top:8px;font-size:0.74em;font-weight:700;color:' + (sg.monte ? '#67e8f9' : '#a3b1c2') + ';">'
        + (sg.monte ? 'Prêt à monter : ' + sg.poids + ' ' + unite() + ' (dernière fois ' + sg.avant + ' × ' + sg.reps + ')' : 'Dernière fois : ' + sg.avant + ' ' + unite() + ' × ' + sg.reps) + '</div>';

      if (s.reposFin) {
        h += '<div style="margin-top:14px;display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:14px;background:rgba(251,191,36,0.08);border:1px solid rgba(251,191,36,0.35);">'
          + '<div style="flex:1;"><div style="font-size:0.62em;letter-spacing:1.5px;color:#fbbf24;font-weight:900;">REPOS</div>'
          + '<div id="awakDuoChrono" style="font-size:1.8em;font-weight:900;color:#fff;font-variant-numeric:tabular-nums;line-height:1.1;">' + mmss((s.reposFin - Date.now()) / 1000) + '</div></div>'
          + '<button onclick="AwakDuo.ajusterRepos(-15)" style="min-height:42px;padding:8px 9px;border-radius:11px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.12);color:#cbd5e1;font-weight:800;font-size:0.78em;cursor:pointer;">−15 s</button>'
          + '<button onclick="AwakDuo.ajusterRepos(15)" style="min-height:42px;padding:8px 9px;border-radius:11px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.12);color:#cbd5e1;font-weight:800;font-size:0.78em;cursor:pointer;">+15 s</button>'
          + '<button onclick="AwakDuo.passerRepos()" style="min-height:42px;padding:8px 12px;border-radius:11px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.14);color:#e2e8f0;font-weight:800;font-size:0.82em;cursor:pointer;">Passer</button></div>';
      }

      h += '<div style="margin-top:14px;">';
      var lesE = (s.echs && s.echs[i]) || [];
      lesE.forEach(function (e, q) {
        h += '<div style="display:flex;align-items:center;gap:8px;padding:7px 10px;margin-bottom:6px;border-radius:11px;background:rgba(251,191,36,0.05);border:1px dashed rgba(251,191,36,0.35);">'
          + '<span style="width:28px;font-size:0.68em;font-weight:900;color:#fbbf24;">É' + (q + 1) + '</span>'
          + '<span style="flex:1;font-size:0.8em;font-weight:700;color:#cbd5e1;">' + e.reps + ' reps' + (e.kg ? ' × ' + arrondi(depuisKg(e.kg)) + ' ' + unite() : '') + ' · échauffement</span>'
          + (q === lesE.length - 1 ? '<button onclick="AwakDuo.annulerEchauf(' + i + ')" aria-label="Annuler cet échauffement" style="min-height:0;width:28px;height:28px;padding:0;border-radius:8px;background:transparent;border:1px solid rgba(255,255,255,0.12);color:#8391a7;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;"><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button>' : '')
          + '</div>';
      });
      for (var k = 0; k < n; k++) {
        var fait = f2[k];
        var base = 'display:flex;align-items:center;gap:8px;padding:9px 10px;margin-bottom:7px;border-radius:12px;';
        if (fait) {
          var txt = tenue ? (ex.duration + ' s') : (fait.reps + ' reps' + (fait.kg ? ' × ' + arrondi(depuisKg(fait.kg)) + ' ' + unite() : ''));
          var dern = k === f2.length - 1;
          h += '<div style="' + base + 'background:rgba(34,211,238,0.06);border:1px solid rgba(34,211,238,0.25);">'
            + '<span style="width:28px;font-size:0.72em;font-weight:900;color:#67e8f9;">S' + (k + 1) + '</span>'
            + '<span style="flex:1;font-size:0.86em;font-weight:800;color:#e2e8f0;">' + esc(txt) + '</span>'
            + '<span style="color:' + C + ';display:inline-flex;"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L19 7"/></svg></span>'
            + (dern ? '<button onclick="AwakDuo.annuler(' + i + ')" aria-label="Annuler cette série" style="min-height:0;width:30px;height:30px;padding:0;border-radius:8px;background:transparent;border:1px solid rgba(255,255,255,0.12);color:#8391a7;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button>' : '')
            + '</div>';
        } else if (k === f2.length) {
          var champ = 'width:100%;box-sizing:border-box;height:44px;padding:0 8px !important;border-radius:10px;border:1px solid rgba(34,211,238,0.35) !important;background:rgba(255,255,255,0.05) !important;color:#fff;font-size:1em;font-weight:800;text-align:center;';
          var repsDef = (f2.length ? f2[f2.length - 1].reps : parseInt(ex.reps, 10)) || '';
          var eM = !!s.modeEchauf && !tenue;
          h += '<div style="' + base + (eM ? 'background:rgba(251,191,36,0.06);border:1.5px dashed rgba(251,191,36,0.6);">' : 'background:rgba(255,255,255,0.04);border:1.5px solid rgba(34,211,238,0.5);">')
            + '<span style="width:28px;font-size:0.72em;font-weight:900;color:' + (eM ? '#fbbf24' : '#fff') + ';">' + (eM ? 'É' + (((s.echs && s.echs[i]) || []).length + 1) : 'S' + (k + 1)) + '</span>'
            + (tenue
              ? (s.effortFin && s.effortIdx === i
                  ? '<span style="flex:1;display:flex;align-items:center;gap:10px;"><span id="awakDuoEffort" style="font-size:1.6em;font-weight:900;color:#fff;font-variant-numeric:tabular-nums;">' + mmss((s.effortFin - Date.now()) / 1000) + '</span>'
                    + '<button onclick="AwakDuo.arreter()" style="min-height:36px;padding:6px 10px;border-radius:9px;background:transparent;border:1px solid rgba(255,255,255,0.14);color:#a3b1c2;font-size:0.72em;font-weight:800;cursor:pointer;">Arrêter</button></span>'
                  : '<span style="flex:1;display:flex;align-items:center;gap:10px;"><span style="font-size:0.9em;font-weight:800;color:#e2e8f0;">' + ex.duration + ' s</span>'
                    + '<button onclick="AwakDuo.lancer(' + i + ')" style="min-height:40px;display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border-radius:10px;background:rgba(34,211,238,0.12);border:1px solid rgba(34,211,238,0.5);color:#a5f3fc;font-size:0.78em;font-weight:900;cursor:pointer;"><svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="M7 5l12 7-12 7z"/></svg>Lancer</button></span>')
              : '<label style="flex:1;min-width:0;"><span style="display:block;font-size:0.58em;color:#8391a7;font-weight:800;margin-bottom:2px;">REPS</span><input id="awakDuoReps" type="number" inputmode="numeric" value="' + repsDef + '" style="' + champ + '"></label>'
              + '<label style="flex:1;min-width:0;"><span style="display:block;font-size:0.58em;color:#8391a7;font-weight:800;margin-bottom:2px;">' + unite().toUpperCase() + '</span><input id="awakDuoPoids" type="number" inputmode="decimal" step="0.5" value="' + dernierPoids(s, i) + '" placeholder="—" style="' + champ + '"></label>')
            + '<button onclick="AwakDuo.valider(' + i + ')" aria-label="Valider la série" style="flex-shrink:0;min-height:0;width:52px;height:52px;padding:0;border-radius:12px;border:none;background:linear-gradient(135deg,#22d3ee,#0891b2);color:#fff;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;box-shadow:0 4px 14px rgba(34,211,238,0.3);"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L19 7"/></svg></button>'
            + '</div>';
        } else {
          h += '<div style="' + base + 'background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);">'
            + '<span style="width:28px;font-size:0.72em;font-weight:900;color:#5f6c80;">S' + (k + 1) + '</span>'
            + '<span style="flex:1;font-size:0.84em;font-weight:700;color:#7c8aa0;">' + esc(cible) + '</span></div>';
        }
      }
      h += '<div style="display:flex;gap:6px;">'
        + '<button onclick="AwakDuo.ajouterSerie()" style="flex:1;min-height:38px;padding:7px;border-radius:10px;border:1px dashed rgba(34,211,238,0.4);background:rgba(34,211,238,0.04);color:#67e8f9;font-size:0.76em;font-weight:800;cursor:pointer;">+ série</button>'
        + (!tenue && f2.length < n ? '<button onclick="AwakDuo.basculerEchauf()" style="flex:1;min-height:38px;padding:7px;border-radius:10px;border:1px dashed rgba(251,191,36,0.45);background:' + (s.modeEchauf ? 'rgba(251,191,36,0.14)' : 'rgba(251,191,36,0.04)') + ';color:#fcd34d;font-size:0.76em;font-weight:800;cursor:pointer;">' + (s.modeEchauf ? 'Annuler l\'échauffement' : '+ échauffement') + '</button>' : '')
        + '</div>';
      h += '</div>';

      var suiv = s.exercises[i + 1];
      if (suiv) h += '<div style="margin-top:12px;font-size:0.74em;color:#8391a7;"><span style="color:#67e8f9;font-weight:900;letter-spacing:1px;">ENSUITE</span> ' + esc(suiv.name) + '</div>';
      h += '<div style="display:flex;gap:8px;margin-top:14px;">'
        + '<button onclick="AwakDuo.aller(-1)" ' + (i === 0 ? 'disabled ' : '') + 'style="flex:1;min-height:46px;border-radius:12px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.12);color:' + (i === 0 ? '#4b5563' : '#e2e8f0') + ';font-weight:800;font-size:0.85em;cursor:pointer;">Préc.</button>'
        + (suiv ? '<button onclick="AwakDuo.aller(1)" style="flex:1.4;min-height:46px;border-radius:12px;background:rgba(34,211,238,0.1);border:1px solid rgba(34,211,238,0.45);color:#a5f3fc;font-weight:900;font-size:0.85em;cursor:pointer;">Exercice suivant</button>' : '')
        + '</div>';
    }
    h += '<button onclick="AwakDuo.fermer()" style="width:100%;margin-top:16px;min-height:46px;border-radius:12px;background:transparent;border:1px solid rgba(255,255,255,0.12);color:#cbd5e1;font-weight:800;font-size:0.85em;cursor:pointer;">' + (_attente ? 'Tout terminer maintenant' : 'Retour à ma séance') + '</button>';
    h += '</div>';
    f.innerHTML = h;
    f.setAttribute('data-saisie', cleSaisie);
    if (garde) {
      var r2 = document.getElementById('awakDuoReps'), p2 = document.getElementById('awakDuoPoids');
      if (r2) r2.value = garde.r; if (p2) p2.value = garde.p;
      if (garde.foc === 'awakDuoReps' && r2) r2.focus(); else if (garde.foc === 'awakDuoPoids' && p2) p2.focus();
    }
  }
  function listeRempl(L) {
    if (!L.length) return '<div style="font-size:0.76em;color:#8391a7;padding:6px 2px;">Aucun exercice trouvé.</div>';
    return L.map(function (e) {
      return '<button onclick="AwakDuo.choisirRemplacant(decodeURIComponent(\'' + encodeURIComponent(e.name).replace(/'/g, '%27') + '\'))" style="display:block;width:100%;min-height:40px;margin-bottom:5px;padding:8px 10px;border-radius:9px;text-align:left;cursor:pointer;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);color:#e2e8f0;font-size:0.8em;font-weight:700;">'
        + esc(e.name) + '<span style="color:#8391a7;font-weight:600;"> · ' + esc((e.equipment && e.equipment[0]) || e.muscle || '') + '</span></button>';
    }).join('');
  }
  function filtrer() {
    var s = lire(); if (!s) return;
    var d = document.getElementById('awakDuoRempl'); if (d) d.innerHTML = listeRempl(remplacants(s, s.exercises[s.idx]));
  }

  // ── Bilan du partenaire sur l'écran de fin ─────────────────────────
  var _bilan = null;
  function bilan(b) {
    _bilan = b;
    [1200, 2800].forEach(function (t) { setTimeout(poserBilan, t); });
  }
  function poserBilan() {
    if (!_bilan) return;
    var v = document.getElementById('completionView');
    if (!v || v.classList.contains('hidden') || document.getElementById('awakDuoBilan')) return;
    var b = _bilan;
    var c = document.createElement('div');
    c.id = 'awakDuoBilan';
    c.style.cssText = 'margin:0 0 14px;padding:12px 14px;border-radius:12px;background:rgba(34,211,238,0.06);border:1px solid rgba(34,211,238,0.3);text-align:left;';
    c.innerHTML = '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">' + av(b.avatar, 24)
      + '<div style="flex:1;min-width:0;"><div style="font-size:0.62em;font-weight:900;letter-spacing:1.4px;color:#67e8f9;text-transform:uppercase;">Séance de ' + esc(b.nom) + '</div>'
      + '<div style="font-size:0.88em;font-weight:900;color:#fff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + esc(b.seance) + '</div></div>'
      + (b.xp ? '<span style="font-size:0.78em;font-weight:900;color:#22d3ee;">+' + b.xp + ' XP</span>' : '') + '</div>'
      + '<div style="display:flex;gap:6px;flex-wrap:wrap;">'
      + ['' + b.exos + ' exercice' + (b.exos > 1 ? 's' : ''), b.series + ' série' + (b.series > 1 ? 's' : ''), b.volume ? arrondi(depuisKg(b.volume)) + ' ' + unite() + ' soulevées' : '']
        .filter(Boolean).map(function (t) { return '<span style="font-size:0.7em;font-weight:800;color:#cbd5e1;padding:3px 9px;border-radius:99px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);">' + esc(t) + '</span>'; }).join('')
      + '</div>'
      + (b.restants ? '<div style="margin-top:6px;font-size:0.72em;color:#a3b1c2;">' + b.restants + ' exercice' + (b.restants > 1 ? 's' : '') + ' non fait' + (b.restants > 1 ? 's' : '') + '.</div>' : '')
      + '<div style="margin-top:6px;font-size:0.7em;color:#8391a7;">Enregistrée dans son profil.</div>';
    var x = document.getElementById('awakXpFin');
    var hote = document.getElementById('awakFinProchain') || document.getElementById('awakFinDetails');
    if (x && x.parentNode) x.parentNode.insertBefore(c, x.nextSibling);
    else if (hote && hote.parentNode) hote.parentNode.insertBefore(c, hote);
    else return;
    _bilan = null;
  }
  function resumePourBilan() {
    var s = lire(); if (!s) return null;
    var series = 0, vol = 0, exos = 0;
    Object.keys(s.faits || {}).forEach(function (k) {
      var f = s.faits[k] || []; if (f.length) exos++;
      f.forEach(function (x) { series++; vol += (x.kg || 0) * (x.reps || 0); });
    });
    var sans = s.exercises.filter(function (e, k) { return !faitsDe(s, k).length; }).length;   // v1604 : tous, même sautés
    return { nom: s.nom, avatar: s.avatar, seance: s.nomSeance, series: series, exos: exos, volume: Math.round(vol), restants: sans };
  }

  function fiche() {
    var s = lire(); if (!s) return;
    var n = s.exercises[s.idx] && !s.exercises[s.idx].perso && s.exercises[s.idx].name;
    try { if (n && typeof window.awakShowExercisePreview === 'function') window.awakShowExercisePreview(n); } catch (e) { _awkE(e); }
    var m = document.getElementById('exercisePreviewModal'); if (m) m.style.zIndex = '99995';   // au-dessus de sa feuille
  }
  // ── « Prépare-toi » : rappel du duo + « Solo cette fois » ──────────
  function notePrep() {
    var el = document.getElementById('prepDuoNote');
    var s = lire();
    var pret = s && mode() === 'duo' && partenaireGroupe() && partenaireGroupe().id === s.pid;
    if (!pret) { if (el) el.remove(); return; }
    if (!el) {
      var nomEl = document.getElementById('prepWorkoutName');
      var hote = nomEl && nomEl.parentNode; if (!hote) return;
      el = document.createElement('div'); el.id = 'prepDuoNote';
      hote.appendChild(el);
    }
    var so = solo();
    el.style.cssText = 'margin-top:12px;display:flex;align-items:center;gap:9px;padding:9px 11px;border-radius:12px;text-align:left;'
      + (so ? 'background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.1);' : 'background:rgba(34,211,238,0.07);border:1px solid rgba(34,211,238,0.35);');
    el.innerHTML = '<span style="flex-shrink:0;display:inline-flex;">' + av(s.avatar, 26) + '</span>'
      + '<span style="flex:1;min-width:0;"><span style="display:block;font-size:0.78em;font-weight:900;color:#fff;">' + (so ? 'Solo cette fois' : 'En duo avec ' + esc(s.nom)) + '</span>'
      + '<span style="display:block;font-size:0.66em;color:#a3b1c2;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + (so ? esc(s.nom) + ' ne s\'entraîne pas avec toi' : 'Sa séance : ' + esc(s.nomSeance)) + '</span></span>'
      + '<button onclick="AwakDuo.basculerSolo()" style="flex-shrink:0;min-height:36px;padding:6px 11px;border-radius:10px;cursor:pointer;font-size:0.72em;font-weight:900;'
      + (so ? 'background:rgba(34,211,238,0.12);border:1px solid rgba(34,211,238,0.5);color:#a5f3fc;">Remettre en duo' : 'background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.14);color:#e2e8f0;">Solo cette fois') + '</button>';
  }
  function basculerSolo() { setSolo(!solo()); notePrep(); }

  // ── Abandon : enregistrer quand même la séance du partenaire ? ─────
  function sauverPartenaire() {
    var s = lire(); if (!s) return false;
    try {
      var w = window.AwakGroup && AwakGroup.buildWorkoutForParticipant(s.pid, gabarit());
      if (!w) return false;
      if (s.debut) w._durationSec = Math.max(60, Math.round(((s.derniere || Date.now()) - s.debut) / 1000));
      if (typeof saveGroupWorkoutForProfile === 'function') saveGroupWorkoutForProfile(s.pid, w);
      if (typeof awakXPParticipant === 'function') awakXPParticipant(s.pid, w, gabarit());
      compterMentor();
      return true;
    } catch (e) { return false; }
  }
  // v1605 : séance de mentor faite en duo → son compteur avance (clé de jeu du profil)
  function compterMentor() {
    var s = lire(); if (!s || !s.mentor) return;
    try {
      var k = 'profile_' + s.pid + '_fitproCelebSessions';
      var o = JSON.parse(localStorage.getItem(k) || '{}') || {};
      o[s.mentor] = (o[s.mentor] || 0) + 1;
      localStorage.setItem(k, JSON.stringify(o));
    } catch (e) { _awkE(e); }
  }
  function aDesSeries() { var s = lire(); if (!s) return false; return Object.keys(s.faits || {}).some(function (k) { return (s.faits[k] || []).length; }); }

  function fermer() {
    if (_attente) { var cb = _attente; _attente = null; fermerFeuille(); majBarre(); setTimeout(cb, 200); return; }
    fermerFeuille(); majBarre();
  }

  // ── Fin de la séance du meneur alors que le partenaire n'a pas fini ──
  var _attente = null;
  function retenirFin(cb) {
    if (!actif() || typeof cb !== 'function') return false;
    var s = lire(); if (!s || s.fini || !restants(s)) return false;
    var reste = restants(s);
    var go = function (continuer) {
      if (continuer) { _attente = cb; ouvrir(); } else cb();
    };
    try {
      if (typeof window.showConfirm === 'function') {
        window.showConfirm(s.nom + ' a encore ' + reste + ' exercice' + (reste > 1 ? 's' : '') + '. Tu peux continuer sa séance ici : tout sera enregistré à la fin.',
          function () { go(true); }, function () { go(false); },
          { title: 'Ta séance est terminée', confirmLabel: 'Continuer avec ' + s.nom, cancelLabel: 'Tout terminer' });
        return true;
      }
    } catch (e) { _awkE(e); }
    go(true);
    return true;
  }

  window.AwakDuo = {
    actif: actif, mode: mode, lire: lire, choisir: choisir, nouvelleSeance: nouvelleSeance, oublier: oublier,
    gabarit: gabarit, pid: function () { var s = lire(); return s ? s.pid : null; },
    routinesDe: routinesDe, mesRoutines: mesRoutines,
    monter: monter, ouvrir: ouvrir, fermer: fermer, rendre: rendre,
    valider: valider, annuler: annuler, annulerEchauf: annulerEchauf, lancer: lancer, arreter: arreter, basculerEchauf: basculerEchauf, compterMentor: compterMentor,
    ajusterRepos: ajusterRepos, remplacer: remplacer, choisirRemplacant: choisirRemplacant, _filtrer: filtrer, versMoi: versMoi,
    bilan: bilan, resumePourBilan: resumePourBilan, fiche: fiche, notePrep: notePrep, basculerSolo: basculerSolo, solo: solo, setSolo: setSolo,
    sauverPartenaire: sauverPartenaire, aDesSeries: aDesSeries, starDe: starDe, progDe: progDe, bloque: function (pid, e) { return bloque({ pid: pid }, e); }, seanceSpeciale: seanceSpeciale, aller: aller, ajouterSerie: ajouterSerie, passerRepos: passerRepos,
    retenirFin: retenirFin
  };
})();
