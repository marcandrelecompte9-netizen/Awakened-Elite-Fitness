// v1399 — Changer d'appli : importer l'historique de Strong ou Hevy (CSV) et
// exporter ses séances en CSV. Réglages › Sauvegarde (#awakCsvCarte).
//
// IMPORT
//  - Strong : Date, Workout Name, Duration, Exercise Name, Set Order, Weight,
//    Reps, Distance, Seconds, Notes, Workout Notes, RPE (poids dans l'unité de
//    l'appli Strong, sans étiquette → on demande kg / lbs).
//  - Hevy : title, start_time, end_time, exercise_title, set_index, set_type,
//    weight_kg | weight_lbs, reps, distance_km, duration_seconds, rpe.
//  Séparateur , ou ; ; guillemets gérés. Une séance = même date + même nom.
//  Chaque séance devient une entrée d'historique (workoutData avec ses séries)
//  et ses séries alimentent les performances (surcharge progressive, records),
//  en kg comme le reste de l'appli. Les noms anglais sont rapprochés de la
//  bibliothèque (awakExCherche), sinon gardés tels quels. Une séance déjà
//  importée (même date et nom) n'est pas doublée.
// EXPORT : une ligne par série — Date, Séance, Durée (min), Exercice, Série,
//  Poids (unité de l'appli), Reps.
(function () {
  'use strict';

  var LB = 0.45359237;
  function toast(m, t, d) { try { window.showToast(m, t || 'info', d || 3000); } catch (e) {} }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim(); }
  function unite() { try { return window.weightUnit ? window.weightUnit() : 'kg'; } catch (e) { return 'kg'; } }

  // ── CSV ───────────────────────────────────────────────────────────
  function lireCSV(txt) {
    txt = String(txt || '').replace(/^﻿/, '');
    var prem = txt.split(/\r?\n/)[0] || '';
    var sep = (prem.split(';').length > prem.split(',').length) ? ';' : ',';
    var lignes = [], ligne = [], champ = '', q = false;
    for (var i = 0; i < txt.length; i++) {
      var c = txt[i];
      if (q) {
        if (c === '"') { if (txt[i + 1] === '"') { champ += '"'; i++; } else q = false; }
        else champ += c;
      } else if (c === '"') q = true;
      else if (c === sep) { ligne.push(champ); champ = ''; }
      else if (c === '\n' || c === '\r') {
        if (c === '\r' && txt[i + 1] === '\n') i++;
        ligne.push(champ); champ = '';
        if (ligne.length > 1 || ligne[0] !== '') lignes.push(ligne);
        ligne = [];
      } else champ += c;
    }
    if (champ !== '' || ligne.length) { ligne.push(champ); lignes.push(ligne); }
    if (!lignes.length) return { tete: [], rangs: [] };
    var tete = lignes[0].map(function (h) { return norm(h); });
    return { tete: tete, rangs: lignes.slice(1).map(function (l) {
      var o = {}; tete.forEach(function (h, k) { o[h] = (l[k] == null ? '' : String(l[k]).trim()); }); return o;
    }) };
  }
  function nombre(v) { var n = parseFloat(String(v || '').replace(',', '.').replace(/[^\d.\-]/g, '')); return isFinite(n) ? n : 0; }
  var MOIS = { jan: 0, feb: 1, fev: 1, mar: 2, apr: 3, avr: 3, may: 4, mai: 4, jun: 5, juin: 5, jul: 6, juil: 6, aug: 7, aou: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
  function date(v) {
    v = String(v || '').trim();
    var m = v.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{1,2}):(\d{2})(?::(\d{2}))?/);
    if (m) return new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +(m[6] || 0));
    m = v.match(/^(\d{1,2}) ([A-Za-zéû]+)\.? (\d{4}),? (\d{1,2}):(\d{2})/);   // Hevy : « 1 Jan 2024, 18:00 »
    if (m) { var mo = MOIS[norm(m[2]).slice(0, 4)]; if (mo == null) mo = MOIS[norm(m[2]).slice(0, 3)]; if (mo != null) return new Date(+m[3], mo, +m[1], +m[4], +m[5]); }
    var d = new Date(v); return isNaN(d) ? null : d;
  }
  function dureeMin(v) {   // Strong : « 1h 5m », « 45m », « 3600 »
    v = String(v || '');
    var h = v.match(/(\d+)\s*h/), mi = v.match(/(\d+)\s*m(?!s)/), s = v.match(/(\d+)\s*s/);
    if (h || mi || s) return (h ? +h[1] * 60 : 0) + (mi ? +mi[1] : 0) + (s ? Math.round(+s[1] / 60) : 0);
    var n = nombre(v); return n > 600 ? Math.round(n / 60) : Math.round(n);
  }

  // ── Rapprochement des noms ───────────────────────────────────────
  var _index = null;
  // Forme simple : sans accents, ponctuation ni pluriel (« Pull-Ups » = « pull up »)
  function sim(x) { return norm(x).replace(/[-_()\[\],.\/]/g, ' ').replace(/\s+/g, ' ').trim().split(' ').map(function (w) { return w.length > 3 ? w.replace(/s$/, '') : w; }).join(' '); }
  function nomAppli(n) {
    var db = []; try { db = window.exerciseDatabase || (typeof exerciseDatabase !== 'undefined' ? exerciseDatabase : []); } catch (e) {}
    if (!_index) {
      _index = {};
      var N = window.AWAK_NOMS_EX || {};
      db.forEach(function (e) {
        if (!e || !e.name || (window.awakEstDoublon && window.awakEstDoublon(e.name))) return;
        var t = N[e.name] || {};
        [e.name, t.fr, t.en].forEach(function (a) { if (a && !_index[sim(a)]) _index[sim(a)] = e; });
      });
    }
    var s0 = sim(n), sansPar = sim(String(n).replace(/\s*\(.*\)\s*$/, ''));
    var m = String(n).match(/^(.*)\((.*)\)\s*$/), inverse = m ? sim(m[2] + ' ' + m[1]) : null;   // « Squat (Barbell) » = « barbell squat »
    return _index[s0] || (inverse && _index[inverse]) || _index[sansPar] || null;
  }

  // ── Analyse ──────────────────────────────────────────────────────
  function analyser(txt, uniteStrong) {
    var c = lireCSV(txt), t = c.tete, rangs = c.rangs;
    var has = function (h) { return t.indexOf(h) >= 0; };
    var fmt = has('exercise name') && has('workout name') ? 'strong' : (has('exercise_title') && has('start_time') ? 'hevy' : null);
    if (!fmt) return { erreur: 'Fichier non reconnu. Exporte en CSV depuis Strong (Réglages › Exporter les données) ou Hevy (Profil › Réglages › Exporter les séances).' };
    var seances = {}, ordre = [], reconnus = {}, inconnus = {};
    rangs.forEach(function (r) {
      var d, nomS, exo, reps, poidsKg, duree = 0;
      if (fmt === 'strong') {
        d = date(r['date']); nomS = r['workout name'] || 'Séance'; exo = r['exercise name'];
        reps = Math.round(nombre(r['reps'])); var w = nombre(r['weight']);
        poidsKg = uniteStrong === 'lbs' ? w * LB : w; duree = dureeMin(r['duration']);
        if (/^rest timer$/i.test(r['set order'] || '')) return;
      } else {
        d = date(r['start_time']); nomS = r['title'] || 'Séance'; exo = r['exercise_title'];
        reps = Math.round(nombre(r['reps']));
        poidsKg = has('weight_kg') ? nombre(r['weight_kg']) : nombre(r['weight_lbs']) * LB;
        var fin = date(r['end_time']); if (d && fin) duree = Math.max(1, Math.round((fin - d) / 60000));
        if (/warmup/i.test(r['set_type'] || '')) return;
      }
      if (!d || !exo) return;
      var cle = d.toISOString().slice(0, 16) + '|' + nomS;
      var s = seances[cle];
      if (!s) { s = seances[cle] = { date: d, nom: nomS, duree: duree, exos: {}, ordreEx: [] }; ordre.push(cle); }
      if (duree > s.duree) s.duree = duree;
      var e = nomAppli(exo), nom = e ? e.name : exo;
      (e ? reconnus : inconnus)[exo] = 1;
      if (!s.exos[nom]) { s.exos[nom] = { name: nom, muscle: e ? e.muscle : undefined, completedSets: [] }; s.ordreEx.push(nom); }
      if (reps > 0 || poidsKg > 0) s.exos[nom].completedSets.push({ reps: reps, weight: Math.round(poidsKg * 10) / 10 });
    });
    var l = ordre.map(function (k) { return seances[k]; }).filter(function (s) { return s.ordreEx.length; });
    l.sort(function (a, b) { return a.date - b.date; });
    return { format: fmt, seances: l, reconnus: Object.keys(reconnus).length, inconnus: Object.keys(inconnus) };
  }

  // ── Enregistrement ───────────────────────────────────────────────
  function importer(res) {
    var pid = window.getCurrentProfileId ? window.getCurrentProfileId() : null;
    var hist = []; try { hist = JSON.parse((pid && window.getProfileData ? window.getProfileData(pid, 'workoutHistory') : localStorage.getItem('workoutHistory')) || '[]') || []; } catch (e) {}
    var deja = {}; hist.forEach(function (h) { if (h && h.date) deja[String(h.date).slice(0, 16) + '|' + h.name] = 1; });
    var perfs = {}; try { perfs = window.getExercisePerformances ? window.getExercisePerformances() : {}; } catch (e) {}
    var n = 0, idBase = Date.now();
    res.seances.forEach(function (s, k) {
      var iso = s.date.toISOString();
      if (deja[iso.slice(0, 16) + '|' + s.nom]) return;
      var exos = s.ordreEx.map(function (x) { return s.exos[x]; });
      var vol = 0, muscles = {};
      exos.forEach(function (e) {
        if (e.muscle) muscles[e.muscle] = 1;
        e.sets = e.completedSets.length;
        e.completedSets.forEach(function (st) {
          vol += (st.weight || 0) * (st.reps || 0);
          if (st.reps > 0) (perfs[e.name] = perfs[e.name] || []).push({ date: iso, reps: st.reps, weight: st.weight || null });
        });
        // Les séries de l'historique sont dans l'unité affichée (comme les séances
        // faites dans l'appli) ; les performances restent en kg.
        var versU = unite() === 'kg' ? 1 : 1 / LB;
        e.completedSets = e.completedSets.map(function (st) { return { reps: st.reps, weight: st.weight ? Math.round(st.weight * versU * 10) / 10 : 0 }; });
      });
      hist.push({ id: idBase + k, date: iso, name: s.nom, duration: s.duree || 0, exercises: exos.length,
        muscles: Object.keys(muscles), musclesWorked: Object.keys(muscles), volume: Math.round(vol), _volKg: 1,
        _import: res.format, workoutData: { name: s.nom, exercises: exos } });
      n++;
    });
    hist.sort(function (a, b) { return new Date(b.date) - new Date(a.date); });
    // L'historique de l'appli garde 200 séances ; les performances, 50 séries par exercice
    if (hist.length > 200) hist = hist.slice(0, 200);
    Object.keys(perfs).forEach(function (k) { perfs[k].sort(function (a, b) { return new Date(a.date) - new Date(b.date); }); if (perfs[k].length > 50) perfs[k] = perfs[k].slice(-50); });
    try {
      if (pid && window.setProfileData) window.setProfileData(pid, 'workoutHistory', JSON.stringify(hist));
      else localStorage.setItem('workoutHistory', JSON.stringify(hist));
      if (window.saveExercisePerformances) window.saveExercisePerformances(perfs);
    } catch (e) { toast('Stockage plein : import impossible.', 'error', 4000); return 0; }
    try { if (window.renderWorkoutHistory) window.renderWorkoutHistory('all'); } catch (e) {}
    try { if (window.updateHomeStats) window.updateHomeStats(); } catch (e) {}
    return n;
  }

  // ── Fenêtre d'import ─────────────────────────────────────────────
  function fenetre(html) {
    var old = document.getElementById('awakCsvFen'); if (old) old.remove();
    var f = document.createElement('div');
    f.id = 'awakCsvFen';
    f.innerHTML = '<div class="awk-csv-boite" role="dialog" aria-label="Importer">' + html + '</div>';
    f.addEventListener('click', function (e) { if (e.target === f) f.remove(); });
    document.body.appendChild(f);
    var x = f.querySelector('[data-x]'); if (x) x.onclick = function () { f.remove(); };
    return f;
  }
  function ouvrirImport() {
    var u = unite();
    var f = fenetre('<div class="awk-csv-tete"><b>Importer depuis une autre appli</b><button type="button" class="awk-csv-x" data-x aria-label="Fermer">×</button></div>'
      + '<div class="awk-csv-corps">'
      +   '<p>Choisis le fichier CSV exporté depuis <b>Strong</b> ou <b>Hevy</b>. Tes séances, tes séries et tes charges arrivent dans ton historique.</p>'
      +   '<div class="awk-csv-lbl">Unité des poids dans Strong</div>'
      +   '<div class="awk-csv-choix"><button type="button" data-u="kg" class="' + (u === 'kg' ? 'on' : '') + '">kg</button><button type="button" data-u="lbs" class="' + (u !== 'kg' ? 'on' : '') + '">lbs</button></div>'
      +   '<p class="awk-csv-note">Hevy indique son unité dans le fichier : rien à choisir.</p>'
      +   '<label class="awk-csv-fichier">Choisir le fichier CSV<input type="file" accept=".csv,text/csv,text/plain" data-fichier hidden></label>'
      +   '<div data-apercu></div>'
      + '</div>');
    f.querySelectorAll('[data-u]').forEach(function (b) {
      b.onclick = function () { u = b.dataset.u; f.querySelectorAll('[data-u]').forEach(function (x) { x.classList.toggle('on', x === b); }); };
    });
    f.querySelector('[data-fichier]').onchange = function () {
      var fi = this.files && this.files[0]; if (!fi) return;
      var rd = new FileReader();
      rd.onload = function () { apercu(f, String(rd.result || ''), u); };
      rd.readAsText(fi);
    };
  }
  function apercu(f, txt, u) {
    var res = analyser(txt, u), zone = f.querySelector('[data-apercu]');
    if (res.erreur) { zone.innerHTML = '<p class="awk-csv-err">' + esc(res.erreur) + '</p>'; return; }
    if (!res.seances.length) { zone.innerHTML = '<p class="awk-csv-err">Aucune séance trouvée dans ce fichier.</p>'; return; }
    var d1 = res.seances[0].date, d2 = res.seances[res.seances.length - 1].date;
    var fd = function (d) { return d.toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' }); };
    var inc = res.inconnus.length;
    zone.innerHTML = '<div class="awk-csv-res"><b>' + res.seances.length + ' séance' + (res.seances.length > 1 ? 's' : '') + '</b> (' + (res.format === 'strong' ? 'Strong' : 'Hevy') + ') du ' + fd(d1) + ' au ' + fd(d2) + '.<br>'
      + res.reconnus + ' exercice' + (res.reconnus > 1 ? 's' : '') + ' reconnu' + (res.reconnus > 1 ? 's' : '')
      + (inc ? ', ' + inc + ' gardé' + (inc > 1 ? 's' : '') + ' sous leur nom d\'origine' : '') + '.</div>'
      + (inc ? '<details class="awk-csv-inc"><summary>Voir les noms gardés</summary>' + res.inconnus.slice(0, 40).map(esc).join(', ') + (inc > 40 ? '…' : '') + '</details>' : '')
      + (res.seances.length > 200 ? '<p class="awk-csv-note">L\'historique garde les 200 séances les plus récentes.</p>' : '')
      + '<button type="button" class="awk-csv-go" data-go>Importer</button>';
    zone.querySelector('[data-go]').onclick = function () {
      var n = importer(res);
      f.remove();
      toast(n ? n + ' séance' + (n > 1 ? 's' : '') + ' importée' + (n > 1 ? 's' : '') + '.' : 'Ces séances sont déjà dans ton historique.', n ? 'success' : 'info', 3500);
    };
  }

  // ── Export CSV ───────────────────────────────────────────────────
  function cellule(v) { v = String(v == null ? '' : v); return /[",;\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }
  function exporter() {
    var h = []; try { h = window.getWorkoutHistory ? window.getWorkoutHistory() : []; } catch (e) {}
    if (!h.length) { toast('Aucune séance à exporter pour le moment.'); return; }
    var u = unite();
    var L = [['Date', 'Séance', 'Durée (min)', 'Exercice', 'Série', 'Poids (' + u + ')', 'Reps'].join(',')];
    h.slice().reverse().forEach(function (w) {
      var d = new Date(w.date), ds = isNaN(d) ? '' : d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0') + ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
      var exos = (w.workoutData && w.workoutData.exercises) || [];
      var nom = window.awakNom ? function (n) { return window.awakNom(n); } : function (n) { return n; };
      var ecrit = false;
      exos.forEach(function (e) {
        if (!e || e.isRest || e.isInfo) return;
        var sets = e.completedSets || [];
        sets.forEach(function (st, i) {
          var p = st.weight ? Math.round(st.weight * 10) / 10 : '';
          L.push([ds, w.name, w.duration || '', nom(e.name || ''), i + 1, p, st.reps || ''].map(cellule).join(','));
          ecrit = true;
        });
      });
      if (!ecrit) L.push([ds, w.name, w.duration || '', '', '', '', ''].map(cellule).join(','));
    });
    var blob = new Blob(['﻿' + L.join('\n')], { type: 'text/csv;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'awakened-seances-' + new Date().toISOString().slice(0, 10) + '.csv';
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    toast('Export CSV prêt : ' + h.length + ' séance' + (h.length > 1 ? 's' : '') + '.', 'success');
  }

  window.AwakCSV = { lire: lireCSV, analyser: analyser, importer: importer, ouvrirImport: ouvrirImport, exporter: exporter };
})();
