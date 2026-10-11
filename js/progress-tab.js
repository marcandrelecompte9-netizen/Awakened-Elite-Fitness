/* ============================================================
   ONGLET PROGRÈS — vue d'ensemble et historique compact (v1225)
   • Haut de page « Ta progression » : semaine, mois, semaines
     actives, 8 dernières semaines, derniers records.
   • Version enfant (< 13 ans) : « Ce que tu as accompli »
     (séances, étoiles, missions, défis) et records en mots simples.
   • Carte de séance compacte (une ligne, détails au toucher),
     regroupée par semaine. Barres de muscles en HTML : aucune
     librairie en ligne, fonctionne hors connexion.
   Palette bleue / violette, icônes SVG (AwakIcon).
   ============================================================ */
(function () {
  'use strict';

  var BLEU = '#60a8f0', CLAIR = '#93c5fd', VIOLET = '#a78bfa', OR = '#fbbf24';
  var COULEURS = {
    'Pectoraux': '#f87171', 'Dos': '#60a5fa', 'Épaules': '#a78bfa', 'Biceps': '#34d399',
    'Triceps': '#fbbf24', 'Quadriceps': '#f97316', 'Fessiers': '#ec4899', 'Abdominaux': '#2dd4bf',
    'Obliques': '#14b8a6', 'Trapèzes': '#8b5cf6', 'Avant-bras': '#fb923c', 'Mollets': '#6366f1',
    'Ischio-jambiers': '#e879f9', 'Cardio': '#94a3b8', 'Corps entier': '#cbd5e1'
  };
  function couleur(m) { return COULEURS[m] || '#94a3b8'; }

  function ico(nom, t, c) {
    try { return (window.AwakIcon && AwakIcon.get(nom, t, c)) || ''; } catch (e) { return ''; }
  }
  function enfant() {
    try { return !!(window.AwakYouth && AwakYouth.isChild && AwakYouth.isChild()); } catch (e) { return false; }
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function historique() {
    try { return (typeof window.getWorkoutHistory === 'function') ? (window.getWorkoutHistory() || []) : []; }
    catch (e) { return []; }
  }

  // ── Semaines (lundi → dimanche) ──
  function lundi(d) {
    var x = new Date(d); x.setHours(0, 0, 0, 0);
    var j = (x.getDay() + 6) % 7; x.setDate(x.getDate() - j);
    return x;
  }
  var MOIS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
  function libelleSemaine(d) {
    var l = lundi(d).getTime(), ici = lundi(new Date()).getTime();
    var diff = Math.round((ici - l) / (7 * 86400000));
    if (diff === 0) return 'Cette semaine';
    if (diff === 1) return 'La semaine dernière';
    var x = new Date(l);
    return 'Semaine du ' + x.getDate() + ' ' + MOIS[x.getMonth()];
  }

  // Nombre d'exercices d'une séance (la valeur enregistrée est un nombre,
  // mais getWorkoutHistory() remplace ce champ par un tableau).
  function nbExos(e) {
    if (typeof e._nbExos === 'number') return e._nbExos;
    if (Array.isArray(e.exercises) && e.exercises.length) return e.exercises.length;
    try {
      var w = e.workoutData && e.workoutData.exercises;
      if (Array.isArray(w)) return w.filter(function (x) { return x && !x.isRest && !x.isInfo; }).length;
    } catch (er) {}
    return 0;
  }
  function volumeMuscles(e) {
    var v = {};
    if (e.musclesWeighted && typeof e.musclesWeighted === 'object' && !Array.isArray(e.musclesWeighted)) {
      Object.keys(e.musclesWeighted).forEach(function (m) { v[m] = (v[m] || 0) + (e.musclesWeighted[m] || 0); });
    } else if (Array.isArray(e.musclesWorked)) {
      e.musclesWorked.forEach(function (m) { v[m] = (v[m] || 0) + 1; });
    } else if (e.musclesWorked && typeof e.musclesWorked === 'object') {
      Object.keys(e.musclesWorked).forEach(function (m) { v[m] = (v[m] || 0) + (e.musclesWorked[m] || 0); });
    }
    return v;
  }

  // ── Poids ──
  function unite() { try { return localStorage.getItem('fitproUseKg') === 'true' ? 'kg' : 'lbs'; } catch (e) { return 'lbs'; } }
  function poids(kg) {
    var v = parseFloat(kg) || 0;
    return unite() === 'kg' ? Math.round(v * 10) / 10 : Math.round(v * 2.20462);
  }

  // ── Records : séries qui ont battu tout ce qui précédait ──
  function records() {
    var perf = {};
    try { perf = (typeof window.getExercisePerformances === 'function') ? (window.getExercisePerformances() || {}) : {}; } catch (e) {}
    var out = [];
    Object.keys(perf).forEach(function (nom) {
      var h = perf[nom];
      if (!Array.isArray(h) || h.length < 2) return;
      var liste = h.filter(function (s) { return s && !s.warmup && s.date; })
        .slice().sort(function (a, b) { return new Date(a.date) - new Date(b.date); });
      var avecPoids = liste.some(function (s) { return parseFloat(s.weight) > 0; });
      var meilleur = null, dernier = null;
      liste.forEach(function (s) {
        var val = avecPoids ? (parseFloat(s.weight) || 0) : (parseInt(s.reps, 10) || 0);
        if (!(val > 0)) return;
        if (meilleur !== null && val > meilleur) dernier = { nom: nom, date: s.date, val: val, avant: meilleur, poids: avecPoids, reps: parseInt(s.reps, 10) || 0 };
        if (meilleur === null || val > meilleur) meilleur = val;
      });
      if (dernier) out.push(dernier);
    });
    out.sort(function (a, b) { return new Date(b.date) - new Date(a.date); });
    return out.slice(0, 3);
  }

  // ── Blocs ──
  function tuile(valeur, label, c) {
    return '<div style="flex:1;min-width:0;text-align:center;padding:11px 4px;border-radius:13px;'
      + 'background:' + c + '12;border:1px solid ' + c + '40;">'
      + '<div style="font-size:1.45em;font-weight:900;color:' + c + ';line-height:1;font-variant-numeric:tabular-nums;">' + valeur + '</div>'
      + '<div style="font-size:0.6em;color:#94a3b8;font-weight:800;margin-top:5px;line-height:1.25;">' + label + '</div></div>';
  }

  function graphe8(hist) {
    var ici = lundi(new Date()).getTime(), sem = [];
    for (var i = 7; i >= 0; i--) sem.push({ t: ici - i * 7 * 86400000, n: 0 });
    hist.forEach(function (e) {
      var l = lundi(e.date).getTime();
      for (var k = 0; k < sem.length; k++) if (sem[k].t === l) { sem[k].n++; break; }
    });
    var max = Math.max(3, Math.max.apply(null, sem.map(function (s) { return s.n; })));
    var barres = sem.map(function (s, k) {
      var courant = k === sem.length - 1;
      var h = s.n ? Math.max(10, Math.round(s.n / max * 100)) : 4;
      var d = new Date(s.t);
      return '<div style="flex:1;min-width:0;display:flex;flex-direction:column;align-items:center;gap:4px;">'
        + '<div style="font-size:0.6em;font-weight:900;color:' + (s.n ? '#e2e8f0' : 'transparent') + ';">' + s.n + '</div>'
        + '<div style="width:100%;height:64px;display:flex;align-items:flex-end;">'
        +   '<div style="width:100%;height:' + h + '%;border-radius:6px 6px 3px 3px;'
        +     'background:' + (s.n ? (courant ? 'linear-gradient(180deg,' + VIOLET + ',' + BLEU + ')' : 'rgba(96,168,240,0.55)') : 'rgba(255,255,255,0.07)') + ';"></div></div>'
        // v1319 : taille fixe en px (le plancher de lisibilité faisait chevaucher les dates)
        + '<div style="font-size:9.5px;color:' + (courant ? CLAIR : '#8a99ad') + ';font-weight:' + (courant ? 900 : 700) + ';white-space:nowrap;max-width:100%;overflow:hidden;">'
        +   (courant ? 'En cours' : d.getDate() + ' ' + MOIS[d.getMonth()].replace('.', '')) + '</div></div>';
    }).join('');
    return '<div style="display:flex;gap:5px;align-items:flex-end;">' + barres + '</div>';
  }

  function semainesActives(hist) {
    var faites = {};
    hist.forEach(function (e) { faites[lundi(e.date).getTime()] = true; });
    var t = lundi(new Date()).getTime(), n = 0;
    if (!faites[t]) t -= 7 * 86400000;      // semaine en cours pas encore commencée : on part de la précédente
    while (faites[t]) { n++; t -= 7 * 86400000; }
    return n;
  }

  function carteBloc(titre, iconeNom, c, corps) {
    return '<div class="card" style="padding:14px 14px 13px;margin-bottom:12px;background:linear-gradient(160deg,rgba(96,168,240,0.06),rgba(167,139,250,0.03)) !important;border:1px solid rgba(96,168,240,0.2);">'
      + '<div style="display:flex;align-items:center;gap:8px;margin-bottom:11px;">' + ico(iconeNom, 16, c)
      + '<span style="font-size:0.78em;font-weight:900;color:' + c + ';letter-spacing:0.3px;">' + titre + '</span></div>'
      + corps + '</div>';
  }

  function blocRecords(kid) {
    var r = records();
    if (!r.length) {
      return '<div style="font-size:0.74em;color:#94a3b8;line-height:1.5;">'
        + (kid ? 'Ton premier record arrive bientôt : fais une répétition de plus que la dernière fois !'
               : 'Tes records apparaîtront ici dès que tu battras une de tes performances.') + '</div>';
    }
    return r.map(function (x) {
      var txt, gain;
      if (kid) {
        txt = 'Ton record ' + (/^[aeiouyéèêh]/i.test(x.nom) ? 'd\'' : 'de ') + esc(x.nom.toLowerCase()) + ' : <b style="color:#fff;">'
          + (x.poids ? poids(x.val) + ' ' + unite() : x.val + ' fois') + '</b>';
        gain = '';
      } else {
        txt = '<b style="color:#e2e8f0;">' + esc(x.nom) + '</b>';
        gain = x.poids
          ? poids(x.val) + ' ' + unite() + ' <span style="color:#86efac;">+' + Math.max(1, poids(x.val) - poids(x.avant)) + '</span>'
          : x.val + ' reps <span style="color:#86efac;">+' + (x.val - x.avant) + '</span>';
      }
      return '<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-top:1px solid rgba(255,255,255,0.05);">'
        + '<span style="flex-shrink:0;width:30px;height:30px;border-radius:9px;display:flex;align-items:center;justify-content:center;background:rgba(251,191,36,0.12);border:1px solid rgba(251,191,36,0.35);">' + ico('trophee', 15, OR) + '</span>'
        + '<span style="flex:1;min-width:0;font-size:0.78em;color:#cbd5e1;line-height:1.35;">' + txt + '</span>'
        + (gain ? '<span style="flex-shrink:0;font-size:0.76em;font-weight:900;color:#fff;white-space:nowrap;">' + gain + '</span>' : '')
        + '</div>';
    }).join('');
  }

  // ⌚ v1232 : pas + sommeil de la montre (si connectée)
  function _ligneMontre() {
    try {
      if (!(window.AwakSante && AwakSante.connecte())) return '';
      var lire = function (k) { try { return JSON.parse(localStorage.getItem(window._cleProfilLecture ? _cleProfilLecture(k) : k) || 'null'); } catch (e) { return null; } };
      var j = lire('awakSanteJour'), n = lire('awakSanteNuit');
      var bouts = [];
      if (j && j.pas != null) bouts.push('<b style="color:#fff;">' + j.pas.toLocaleString('fr-CA') + '</b> pas aujourd\'hui');
      if (n && n.min) bouts.push('<b style="color:#fff;">' + AwakSante.hm(n.min) + '</b> de sommeil');
      if (!bouts.length) return '';
      return '<div style="display:flex;align-items:center;gap:8px;font-size:0.74em;color:#94a3b8;margin:-4px 0 12px;">'
        + ico('sante', 15, CLAIR) + '<span>' + bouts.join(' · ') + '</span></div>';
    } catch (e) { return ''; }
  }

  function rendreHaut() {
    var hote = document.getElementById('awakProgHaut');
    if (!hote) return;
    var hist = historique();
    var kid = enfant();
    var debutSem = lundi(new Date()).getTime();
    var n = new Date(), debutMois = new Date(n.getFullYear(), n.getMonth(), 1).getTime();
    var cetteSem = hist.filter(function (e) { return new Date(e.date).getTime() >= debutSem; }).length;
    var ceMois = hist.filter(function (e) { return new Date(e.date).getTime() >= debutMois; }).length;
    var h = '';

    if (!hist.length) {
      hote.innerHTML = carteBloc(kid ? 'Ce que tu as accompli' : 'Ta progression', 'stats', CLAIR,
        '<div style="font-size:0.8em;color:#cbd5e1;line-height:1.5;">Ta première séance s\'affichera ici. '
        + 'Ensuite, tu verras chaque semaine ce que tu as accompli.</div>');
      return;
    }

    if (kid) {
      var etoiles = 0;
      hist.forEach(function (e) {
        var w = e.workoutData || {};
        etoiles += (typeof w._etoiles === 'number') ? w._etoiles : nbExos(e);
      });
      var missions = 0;
      try {
        var mf = window.AwakKidsPrograms && AwakKidsPrograms.missionsFaites ? AwakKidsPrograms.missionsFaites() : {};
        Object.keys(mf).forEach(function (k) { missions += mf[k].total || 0; });
      } catch (e) {}
      var defis = 0;
      try {
        var dt = (typeof window.awakDefisTermines === 'function') ? window.awakDefisTermines() : {};
        Object.keys(dt).forEach(function (k) { defis += dt[k] || 0; });
      } catch (e) {}
      h += carteBloc('Ce que tu as accompli', 'etoile', OR,
        '<div style="display:flex;gap:7px;margin-bottom:7px;">'
        + tuile(hist.length, 'séances', BLEU) + tuile(etoiles, 'étoiles', OR) + '</div>'
        + '<div style="display:flex;gap:7px;">'
        + tuile(missions, 'missions', VIOLET) + tuile(defis, 'défis terminés', '#f472b6') + '</div>'
        + '<div style="font-size:0.74em;color:' + CLAIR + ';font-weight:700;text-align:center;margin-top:11px;">'
        + (cetteSem ? 'Cette semaine : ' + cetteSem + ' séance' + (cetteSem > 1 ? 's' : '') + '. Bravo !' : 'Pas encore bougé cette semaine : on y va ?')
        + '</div>');
      h += carteBloc('Tes semaines', 'calendrier', CLAIR, graphe8(hist));
      h += carteBloc('Mes records', 'trophee', OR, blocRecords(true));
    } else {
      var sa = semainesActives(hist);
      h += carteBloc('Ta progression', 'stats', CLAIR,
        '<div style="display:flex;gap:7px;margin-bottom:14px;">'
        + tuile(cetteSem, 'cette semaine', BLEU)
        + tuile(ceMois, 'ce mois-ci', VIOLET)
        + tuile(sa, sa > 1 ? 'semaines d\'affilée' : 'semaine active', OR)
        + '</div>'
        + _ligneMontre()
        + '<div style="font-size:0.66em;color:#94a3b8;font-weight:800;margin-bottom:8px;">Séances par semaine</div>'
        + graphe8(hist));
      // v1245 : carte masquée tant qu'il n'y a aucun record (elle ne disait que « bientôt »)
      if (records().length) h += carteBloc('Tes derniers records', 'trophee', OR, blocRecords(false));
    }
    hote.innerHTML = h;
  }

  // ── Carte de séance compacte ──
  function barresMuscles(v, detail) {
    var cles = Object.keys(v).filter(function (m) { return v[m] > 0; })
      .sort(function (a, b) { return v[b] - v[a]; });
    if (!cles.length) return '';
    var tot = cles.reduce(function (s, m) { return s + v[m]; }, 0);
    if (!detail) {
      var seg = cles.map(function (m) {
        return '<span style="display:block;height:100%;width:' + (v[m] / tot * 100).toFixed(1) + '%;background:' + couleur(m) + ';"></span>';
      }).join('');
      var leg = cles.slice(0, 3).map(function (m) {
        return '<span style="display:inline-flex;align-items:center;gap:4px;white-space:nowrap;">'
          + '<span style="width:7px;height:7px;border-radius:50%;background:' + couleur(m) + ';"></span>' + esc(m) + '</span>';
      }).join('') + (cles.length > 3 ? '<span style="color:#64748b;">+' + (cles.length - 3) + '</span>' : '');
      return '<div style="display:flex;height:6px;border-radius:99px;overflow:hidden;margin-top:9px;background:rgba(255,255,255,0.06);">' + seg + '</div>'
        + '<div style="display:flex;flex-wrap:wrap;gap:4px 11px;margin-top:6px;font-size:0.64em;color:#94a3b8;font-weight:700;">' + leg + '</div>';
    }
    var max = v[cles[0]];
    return cles.map(function (m) {
      return '<div style="display:flex;align-items:center;gap:8px;margin-top:5px;">'
        + '<div style="width:92px;font-size:0.68em;color:#cbd5e1;font-weight:700;text-align:right;flex-shrink:0;">' + esc(m) + '</div>'
        + '<div style="flex:1;height:8px;background:rgba(255,255,255,0.07);border-radius:99px;overflow:hidden;">'
        +   '<div style="height:100%;width:' + Math.round(v[m] / max * 100) + '%;background:' + couleur(m) + ';border-radius:99px;"></div></div></div>';
    }).join('');
  }

  function carte(e, fav) {
    var kid = enfant();
    var d = new Date(e.date);
    var jour = d.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', '');
    var v = volumeMuscles(e);
    var nb = nbExos(e);
    var infos = [];
    if (e.duration) infos.push(Math.round(e.duration) + ' min');
    if (e._santeId) { if (e.distance) infos.push((e.distance / 1000).toFixed(2) + ' km'); }
    else if (nb) infos.push(nb + ' exercice' + (nb > 1 ? 's' : ''));
    if (e.fcMoy) infos.push(e.fcMoy + ' bpm');
    if (e.calories && !kid) infos.push(e.calories + ' kcal');
    var id = e.id;
    return '<div class="awk-hist" data-hist="' + id + '" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);'
      + 'border-left:3px solid ' + (fav ? OR : BLEU) + ';border-radius:12px;padding:10px 12px;margin-bottom:7px;">'
      + '<div onclick="AwakProg.basculer(' + id + ')" style="display:flex;align-items:center;gap:11px;cursor:pointer;">'
      +   '<div style="flex-shrink:0;width:40px;text-align:center;line-height:1.05;">'
      +     '<div style="font-size:0.58em;color:#94a3b8;font-weight:800;text-transform:uppercase;">' + jour + '</div>'
      +     '<div style="font-size:1.15em;font-weight:900;color:#fff;">' + d.getDate() + '</div></div>'
      +   '<div style="flex:1;min-width:0;">'
      +     '<div style="font-size:0.88em;font-weight:800;color:#f1f5f9;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'
      +       (fav ? '<span style="display:inline-flex;vertical-align:-2px;margin-right:4px;">' + ico('etoile', 13, OR) + '</span>' : '') + esc(e.name || 'Séance') + '</div>'
      +     '<div style="font-size:0.7em;color:#94a3b8;font-weight:600;margin-top:2px;">' + infos.join(' · ') + '</div>'
      +   '</div>'
      +   '<span class="awk-hist-chev" style="flex-shrink:0;color:#64748b;transition:transform .2s;display:inline-flex;">'
      +     '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M9 6l6 6-6 6"/></svg></span>'
      + '</div>'
      + barresMuscles(v, false)
      + '<div class="awk-hist-det" style="display:none;margin-top:11px;padding-top:10px;border-top:1px solid rgba(255,255,255,0.06);">'
      +   (Object.keys(v).length ? '<div style="font-size:0.64em;color:#94a3b8;font-weight:800;margin-bottom:3px;">Muscles travaillés</div>' + barresMuscles(v, true) : '')
      +   '<div style="display:flex;gap:7px;margin-top:12px;">'
      +     (e.workoutData
              ? bouton('replayWorkout(' + id + ')', 'Rejouer', true)
              + bouton('saveHistoryAsRoutine(' + id + ')', 'Garder en routine', false)
              : '<span style="font-size:0.7em;color:#64748b;">Séance ancienne : impossible à rejouer.</span>')
      +     '<button onclick="toggleFavoriteWorkout(' + id + ')" aria-label="' + (fav ? 'Retirer des favoris' : 'Ajouter aux favoris') + '" '
      +       'style="flex-shrink:0;width:40px;border-radius:10px;cursor:pointer;display:flex;align-items:center;justify-content:center;'
      +       'background:' + (fav ? 'rgba(251,191,36,0.14)' : 'rgba(255,255,255,0.04)') + ';border:1px solid ' + (fav ? 'rgba(251,191,36,0.5)' : 'rgba(255,255,255,0.12)') + ';">'
      +       ico('etoile', 16, fav ? OR : '#94a3b8') + '</button>'
      +   '</div>'
      + '</div>'
      + '</div>';
  }
  function bouton(action, txt, principal) {
    return '<button onclick="' + action + '" style="flex:1;min-width:0;padding:9px 6px;border-radius:10px;cursor:pointer;font-size:0.74em;font-weight:800;white-space:nowrap;'
      + (principal ? 'background:rgba(96,168,240,0.14);border:1px solid rgba(96,168,240,0.45);color:' + CLAIR + ';'
                   : 'background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.12);color:#cbd5e1;')
      + '">' + txt + '</button>';
  }

  function basculer(id) {
    var el = document.querySelector('.awk-hist[data-hist="' + id + '"]');
    if (!el) return;
    var det = el.querySelector('.awk-hist-det'), chev = el.querySelector('.awk-hist-chev');
    var ouvert = det && det.style.display !== 'none';
    if (det) det.style.display = ouvert ? 'none' : 'block';
    if (chev) chev.style.transform = ouvert ? '' : 'rotate(90deg)';
  }

  // Liste complète, regroupée par semaine, avec « Voir plus ».
  var PAS = 6;   // v1245 : 6 séances d'abord (10 faisaient 2 écrans), « Voir plus » pour la suite
  function rendreListe(container, liste, favoris) {
    var max = window._awakHistMax || PAS;
    var h = '', semPrec = null;
    liste.slice(0, max).forEach(function (e) {
      var lib = libelleSemaine(e.date);
      if (lib !== semPrec) {
        var n = liste.filter(function (x) { return libelleSemaine(x.date) === lib; }).length;
        h += '<div style="display:flex;align-items:baseline;justify-content:space-between;margin:' + (semPrec === null ? '2px' : '14px') + ' 2px 7px;">'
          + '<span style="font-size:0.72em;font-weight:900;color:' + CLAIR + ';">' + lib + '</span>'
          + '<span style="font-size:0.64em;color:#64748b;font-weight:700;">' + n + ' séance' + (n > 1 ? 's' : '') + '</span></div>';
        semPrec = lib;
      }
      h += carte(e, favoris.indexOf(e.id) !== -1);
    });
    if (liste.length > max) {
      h += '<button onclick="AwakProg.plus()" style="width:100%;margin-top:6px;padding:11px;border-radius:12px;cursor:pointer;'
        + 'background:rgba(96,168,240,0.08);border:1px solid rgba(96,168,240,0.3);color:' + CLAIR + ';font-weight:800;font-size:0.8em;">'
        + 'Voir plus (' + (liste.length - max) + ' autre' + (liste.length - max > 1 ? 's' : '') + ')</button>';
    }
    container.innerHTML = h;
  }
  function plus() {
    window._awakHistMax = (window._awakHistMax || PAS) + 20;
    try { window.renderWorkoutHistory(window._histFilter || 'all'); } catch (e) {}
  }

  // ── Version enfant : ce qui ne le concerne pas disparaît ──
  function appliquerAge() {
    var kid = enfant();
    Array.prototype.forEach.call(document.querySelectorAll('#historyTab [data-awk-ico]'), function (el) {
      if (!el.firstChild) el.innerHTML = ico(el.getAttribute('data-awk-ico'), 19, el.getAttribute('data-awk-col') || CLAIR);
    });
    var cache = function (id, on) {
      var el = document.getElementById(id); if (!el) return;
      if (el.dataset.awkDisp === undefined) el.dataset.awkDisp = (el.style.display === 'none') ? '' : el.style.display;
      el.style.display = on ? 'none' : el.dataset.awkDisp;
    };
    cache('awakTuileAnalyse', kid);
    cache('awakTuileEquilibre', kid);
    cache('awakCorpsTitre', kid);
    cache('awakCorpsCard', kid);
    cache('awakMesuresCard', kid);
    var hof = document.getElementById('awakTuileHofTitre'), hofSub = document.getElementById('awakTuileHofSous');
    if (hof) hof.textContent = kid ? 'Mes records' : 'Hall of Fame';
    if (hofSub) hofSub.textContent = kid ? 'Ce que tu fais de mieux' : 'Tes records personnels';
  }

  function rendre() {
    try { appliquerAge(); } catch (e) {}
    try { rendreHaut(); } catch (e) {}
  }

  window.AwakProg = {
    rendre: rendre,
    carte: carte,
    rendreListe: rendreListe,
    basculer: basculer,
    plus: plus,
    nbExos: nbExos,
    records: records
  };
})();
