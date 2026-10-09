/* ═══════════════════════════════════════════════════════════════════
   ANALYSE & COACH (v1247) — fenêtre « Analyse du Système »
   ─────────────────────────────────────────────────────────────────────
   Deux onglets, sans doublon avec le reste de l'app :
   • Système = AUJOURD'HUI : un conseil + un bouton pour lancer la séance
     correspondante, les muscles à reprendre (négligés / en déclin) et un
     résumé de l'Équilibre de force (source unique : AwakBalance).
   • Coach = LONG TERME : type d'athlète, assiduité, progression des
     charges, plateaux, records récents, habitudes.
   Les graphiques de fréquence vivent dans Progrès, pas ici.
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var DAY = 86400000;
  var MUSCLES = ['Pectoraux', 'Dos', 'Épaules', 'Biceps', 'Triceps', 'Abdominaux', 'Quadriceps',
                 'Ischio-jambiers', 'Fessiers', 'Mollets', 'Trapèzes', 'Obliques', 'Avant-bras'];
  // Petits muscles : jamais mis en avant comme « négligés » s'ils n'ont jamais été faits
  var ACCESSOIRES = { 'Obliques': 1, 'Avant-bras': 1, 'Trapèzes': 1, 'Mollets': 1 };
  var C = { bleu: '#60a8f0', cyan: '#22d3ee', violet: '#a855f7', ambre: '#f59e0b', rouge: '#f87171', gris: '#94a3b8' };

  function ic(n, t, c) { try { return window.AwakIcon ? window.AwakIcon.get(n, t || 14, c) : ''; } catch (e) { return ''; } }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function nom(n) { try { return typeof window.awakNom === 'function' ? window.awakNom(n) : n; } catch (e) { return n; } }
  function hist() { try { return (typeof getWorkoutHistory === 'function') ? (getWorkoutHistory() || []) : []; } catch (e) { return []; } }
  function tsH(h) { return Date.parse(h && (h.date || h.completedAt || h.timestamp) || ''); }
  function unite() { try { return localStorage.getItem('fitproUseKg') === 'true' ? 'kg' : 'lb'; } catch (e) { return 'lb'; } }
  function virg(x) { return String(x).replace('.', ','); }

  // ── Niveau (XP de jeu) et jours depuis le dernier entraînement ──────
  function etatMuscles() {
    var out = {}, now = Date.now();
    var data = {};
    try { data = (typeof rpgLoad === 'function') ? (rpgLoad() || {}) : {}; } catch (e) {}
    var m = data.muscles || {};
    var rec = {};
    try { rec = (typeof getAllMusclesRecoveryStatus === 'function') ? getAllMusclesRecoveryStatus() : {}; } catch (e) {}
    MUSCLES.forEach(function (k) {
      var i = m[k] || {};
      var lvl = 0;
      if (i.xp) { try { lvl = (typeof rpgLevelFromXP === 'function') ? rpgLevelFromXP(i.xp) : Math.floor(i.xp / 100); } catch (e) { lvl = 0; } }
      var t = i.lastTrained ? Date.parse(i.lastTrained) : NaN;
      out[k] = {
        lvl: lvl,
        jours: isNaN(t) ? null : Math.floor((now - t) / DAY),
        pret: !rec[k] || rec[k].status === 'ready' || rec[k].status === 'almost'
      };
    });
    return out;
  }

  // ── Équilibre de force (source unique) ──────────────────────────────
  function equilibre() {
    try { return (window.AwakBalance && typeof window.AwakBalance.analyser === 'function') ? window.AwakBalance.analyser() : null; } catch (e) { return null; }
  }

  // ── Analyse du jour ─────────────────────────────────────────────────
  function analyser() {
    var H = hist(), now = Date.now();
    var dates = H.map(tsH).filter(function (d) { return !isNaN(d); });
    var sem = dates.filter(function (d) { return now - d <= 7 * DAY; }).length;
    var mois = dates.filter(function (d) { return now - d <= 30 * DAY; }).length;
    var der = dates.length ? Math.max.apply(null, dates) : 0;
    var M = etatMuscles();
    var eq = equilibre();

    // Muscles à reprendre : en déclin (5-9 j) puis négligés (10 j+, ou jamais pour les gros)
    var reprendre = [];
    MUSCLES.forEach(function (k) {
      var s = M[k];
      if (s.jours !== null && s.jours >= 10) reprendre.push({ muscle: k, jours: s.jours, niveau: 'neglige', pret: s.pret });
      else if (s.jours !== null && s.jours >= 5 && s.lvl > 0) reprendre.push({ muscle: k, jours: s.jours, niveau: 'declin', pret: s.pret });
      else if (s.jours === null && s.lvl === 0 && !ACCESSOIRES[k] && H.length) reprendre.push({ muscle: k, jours: null, niveau: 'jamais', pret: s.pret });
    });
    reprendre.sort(function (a, b) { return (b.jours === null ? 999 : b.jours) - (a.jours === null ? 999 : a.jours); });

    function prets(liste) { return liste.filter(function (k) { return M[k] && M[k].pret; }).slice(0, 3); }

    // Conseil prioritaire + muscles à cibler
    var c;
    var retards = (eq && eq.suffisant) ? eq.retards : [];
    if (!H.length) {
      c = { type: 'start', texte: 'Fais ta première séance : je pourrai ensuite suivre tes muscles et ta progression.', bouton: 'Commencer', muscles: null };
    } else if (sem === 0) {
      var jr = der ? Math.floor((now - der) / DAY) : null;
      var cib0 = prets(reprendre.map(function (r) { return r.muscle; }));
      c = { type: 'inactive', texte: (jr !== null ? 'Dernière séance il y a ' + jr + ' jour' + (jr > 1 ? 's' : '') + '. ' : '') + 'Une séance courte suffit pour relancer.', bouton: 'Séance de reprise', muscles: cib0.length ? cib0 : null };
    } else if (retards.length && prets(retards.map(function (g) { return g.muscle; })).length) {
      var g = retards[0];
      c = { type: 'force', texte: esc(g.muscle) + ' est en retard de force : ' + g.pct + ' % de ta moyenne. Une séance ciblée aide à rattraper.', bouton: 'Séance ciblée', muscles: prets(retards.map(function (x) { return x.muscle; })) };
    } else if (reprendre.length && prets(reprendre.map(function (r) { return r.muscle; })).length) {
      var cib = prets(reprendre.map(function (r) { return r.muscle; }));
      var r0 = reprendre.filter(function (r) { return r.muscle === cib[0]; })[0];
      c = { type: 'reprendre', texte: r0.jours === null ? esc(r0.muscle) + ' n\'a jamais été travaillé. Ajoute-le à ta prochaine séance.' : esc(r0.muscle) + ' n\'a pas été travaillé depuis ' + r0.jours + ' jours. C\'est le moment.', bouton: 'Séance ' + cib.join(' · '), muscles: cib };
    } else if (sem < 2) {
      c = { type: 'frequence', texte: sem + ' séance cette semaine. Vise 3 pour progresser plus vite.', bouton: 'Séance du jour', muscles: null };
    } else {
      c = { type: 'bien', texte: 'Belle régularité (' + sem + ' séances cette semaine) et rien en retard. Continue ainsi.', bouton: 'Séance du jour', muscles: null };
    }
    return { sem: sem, mois: mois, moy: Math.round(mois / 4.3 * 10) / 10, muscles: M, reprendre: reprendre, eq: eq, conseil: c, aHist: H.length > 0 };
  }

  // ── Lancer la séance proposée ───────────────────────────────────────
  function lancer() {
    try {
      var a = analyser(), m = a.conseil && a.conseil.muscles;
      var ov = document.getElementById('systemAnalysisOverlay'); if (ov) ov.remove();
      var p = (typeof getUserProfile === 'function') ? getUserProfile() : {};
      if (p && !p.setupComplete) { if (typeof showProfileSetup === 'function') showProfileSetup(); return; }
      window._overrideSessionMuscles = (m && m.length) ? m.slice() : null;
      if (typeof openWorkoutModeModal === 'function') openWorkoutModeModal();
    } catch (e) {}
  }
  function voirEquilibre() {
    var ov = document.getElementById('systemAnalysisOverlay'); if (ov) ov.remove();
    if (typeof window.awakOuvrirEquilibre === 'function') window.awakOuvrirEquilibre();
  }

  // ── Rendu : onglet Système ──────────────────────────────────────────
  function titre(t, coul, icone) {
    return '<div style="display:flex;align-items:center;gap:6px;font-size:0.62em;color:' + coul + ';font-weight:900;letter-spacing:1.5px;margin-bottom:8px;text-transform:uppercase;">' + ic(icone, 13, coul) + t + '</div>';
  }
  var CARTE = 'background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:13px 14px;margin-bottom:14px;';
  var BTN = 'border:none;border-radius:11px;padding:11px 12px;font-weight:800;font-size:0.8em;cursor:pointer;';

  function systemeHTML() {
    var a = analyser(), c = a.conseil;
    var col = { start: C.cyan, inactive: C.ambre, force: C.ambre, reprendre: C.ambre, frequence: C.cyan, bien: C.bleu }[c.type] || C.cyan;
    var h = '';

    // 1. Conseil + action
    h += '<div style="background:linear-gradient(135deg,' + col + '1f,' + col + '08);border:1px solid ' + col + '55;border-left:3px solid ' + col + ';border-radius:14px;padding:14px 16px;margin-bottom:12px;">'
      + '<div style="display:flex;align-items:center;gap:6px;font-size:0.56em;color:' + col + ';font-weight:900;letter-spacing:2px;margin-bottom:6px;">' + ic('cible', 12, col) + 'CONSEIL DU JOUR</div>'
      + '<div style="font-size:0.88em;color:#e2e8f0;line-height:1.5;">' + c.texte + '</div>'
      + '<button id="awakAnaLancer" onclick="AwakAnalyse.lancer()" style="' + BTN + 'margin-top:11px;width:100%;background:linear-gradient(135deg,#22d3ee,#0891b2);color:#04121f;display:flex;align-items:center;justify-content:center;gap:7px;">' + ic('eclair', 15, '#fff') + esc(c.bouton) + '</button>'
      + '</div>';

    // 2. Fréquence : une seule ligne (le détail est dans Progrès)
    if (a.aHist) {
      h += '<div style="font-size:0.74em;color:' + C.gris + ';text-align:center;margin-bottom:16px;">'
        + '<b style="color:#e2e8f0;">' + a.sem + '</b> séance' + (a.sem > 1 ? 's' : '') + ' cette semaine · moy. <b style="color:#e2e8f0;">' + virg(a.moy) + '</b>/sem</div>';
    }

    // 3. À reprendre (déclin + négligés fusionnés)
    if (a.reprendre.length) {
      var puces = a.reprendre.slice(0, 8).map(function (r) {
        var k = r.niveau === 'declin' ? C.ambre : C.rouge;
        var txt = r.jours === null ? 'jamais' : r.jours + ' j';
        return '<span style="background:' + k + '1a;border:1px solid ' + k + '55;color:' + k + ';padding:4px 10px;border-radius:99px;font-size:0.72em;font-weight:700;' + (r.pret ? '' : 'opacity:0.55;') + '">' + esc(r.muscle) + ' · ' + txt + '</span>';
      }).join('');
      h += '<div style="margin-bottom:16px;">' + titre('À reprendre', C.ambre, 'chrono')
        + '<div style="display:flex;flex-wrap:wrap;gap:6px;">' + puces + '</div>'
        + '<div style="font-size:0.64em;color:#64748b;margin-top:6px;line-height:1.4;">Orange : en déclin (5 à 9 jours). Rouge : négligé (10 jours et plus). Grisé : encore en récupération.</div></div>';
    }

    // 4. Équilibre de force (résumé — AwakBalance est la seule source)
    var eq = a.eq;
    h += '<div style="margin-bottom:16px;">' + titre('Équilibre de force', C.violet, 'stats');
    if (eq && eq.suffisant) {
      var ik = eq.indice >= 85 ? C.bleu : (eq.indice >= 70 ? C.ambre : C.rouge);
      var ret = eq.retards.slice(0, 2).map(function (g) { return esc(g.muscle) + ' ' + g.pct + ' %'; }).join(' · ');
      h += '<div style="' + CARTE + 'display:flex;align-items:center;gap:12px;margin-bottom:0;">'
        + '<div style="text-align:center;min-width:56px;"><div style="font-size:1.5em;font-weight:900;color:' + ik + ';line-height:1;">' + eq.indice + '</div><div style="font-size:0.56em;color:' + C.gris + ';margin-top:2px;">/100</div></div>'
        + '<div style="flex:1;min-width:0;font-size:0.74em;color:#cbd5e1;line-height:1.4;">' + (ret ? 'En retard : ' + ret : 'Aucun muscle en retard.') + '</div>'
        + '<button onclick="AwakAnalyse.voirEquilibre()" style="' + BTN + 'padding:8px 10px;background:rgba(168,85,247,0.15);color:#c084fc;border:1px solid rgba(168,85,247,0.35);">Voir</button></div>';
    } else {
      var n = eq && eq.trouves ? eq.trouves.length : 0, req = eq && eq.requis ? eq.requis : 3;
      h += '<div style="' + CARTE + 'display:flex;align-items:center;gap:12px;margin-bottom:0;">'
        + '<div style="flex:1;min-width:0;font-size:0.74em;color:#cbd5e1;line-height:1.4;">Note tes charges sur ' + req + ' mouvements de base (' + n + '/' + req + ') pour comparer la force de tes muscles.</div>'
        + '<button onclick="AwakAnalyse.voirEquilibre()" style="' + BTN + 'padding:8px 10px;background:rgba(168,85,247,0.15);color:#c084fc;border:1px solid rgba(168,85,247,0.35);">Voir</button></div>';
    }
    h += '</div>';

    // 5. Volume travaillé (XP de jeu) — présenté comme du volume, pas de l'équilibre
    var vol = MUSCLES.filter(function (k) { return a.muscles[k].lvl > 0; })
      .sort(function (x, y) { return a.muscles[y].lvl - a.muscles[x].lvl; });
    if (vol.length) {
      var max = a.muscles[vol[0]].lvl || 1;
      var lignes = vol.slice(0, 5).map(function (k) {
        var l = a.muscles[k].lvl;
        return '<div style="display:flex;align-items:center;gap:8px;margin-bottom:5px;">'
          + '<span style="width:92px;flex-shrink:0;font-size:0.7em;color:#cbd5e1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + esc(k) + '</span>'
          + '<span style="flex:1;height:7px;background:rgba(255,255,255,0.06);border-radius:4px;overflow:hidden;"><span style="display:block;height:100%;width:' + Math.max(6, Math.round(l / max * 100)) + '%;background:' + C.bleu + ';border-radius:4px;"></span></span>'
          + '<span style="width:42px;text-align:right;font-size:0.66em;color:' + C.gris + ';font-weight:700;">niv ' + l + '</span></div>';
      }).join('');
      h += '<div style="margin-bottom:8px;">' + titre('Volume travaillé', C.bleu, 'halter')
        + '<div style="' + CARTE + '">' + lignes
        + '<div style="font-size:0.62em;color:#64748b;margin-top:6px;line-height:1.4;">Niveau gagné par les séries faites. Mesure le travail, pas la force.</div></div></div>';
    }
    return h;
  }

  // ── Coach : progression des charges ─────────────────────────────────
  // Score d'une série : 1RM estimé (Epley) si chargée, sinon répétitions.
  function scoreSerie(s, charge) {
    var w = parseFloat(s.weight) || 0, r = parseInt(s.reps, 10) || 0;
    if (r <= 0) return 0;
    if (charge) return (w > 0 && r <= 15) ? w * (1 + r / 30) : 0;
    return r;
  }
  function tendances() {
    var P = {};
    try { P = (typeof getExercisePerformances === 'function') ? (getExercisePerformances() || {}) : {}; } catch (e) {}
    var now = Date.now(), out = [];
    Object.keys(P).forEach(function (n) {
      var S = (P[n] || []).filter(function (s) { return s && !s.warmup && !isNaN(Date.parse(s.date || '')); });
      if (S.length < 3) return;
      var charge = S.some(function (s) { return (parseFloat(s.weight) || 0) > 0; });
      // Meilleur score par jour
      var jours = {};
      S.forEach(function (s) {
        var j = String(s.date).slice(0, 10), v = scoreSerie(s, charge);
        if (v > 0 && (!jours[j] || v > jours[j].v)) jours[j] = { v: v, t: Date.parse(s.date), w: parseFloat(s.weight) || 0, r: parseInt(s.reps, 10) || 0 };
      });
      var L = Object.keys(jours).map(function (k) { return jours[k]; }).sort(function (a, b) { return a.t - b.t; });
      if (L.length < 2) return;
      var rec = L.filter(function (x) { return now - x.t < 28 * DAY; });
      var avant = L.filter(function (x) { return now - x.t >= 28 * DAY && now - x.t < 56 * DAY; });
      var best = function (arr) { return arr.reduce(function (m, x) { return x.v > m.v ? x : m; }, { v: 0 }); };
      var bR = best(rec), bA = best(avant), bTout = best(L.filter(function (x) { return now - x.t >= 30 * DAY; }));
      var bMois = best(L.filter(function (x) { return now - x.t < 30 * DAY; }));
      // Plateau : 4 séances+ sur 5 semaines sans dépasser le meilleur des 3 semaines d'avant
      var cinq = L.filter(function (x) { return now - x.t < 35 * DAY; });
      var r21 = best(L.filter(function (x) { return now - x.t < 21 * DAY; }));
      var p21 = best(L.filter(function (x) { return now - x.t >= 21 * DAY && now - x.t < 42 * DAY; }));
      out.push({
        nom: n, charge: charge, seances: rec.length,
        pct: (bR.v && bA.v) ? Math.round((bR.v - bA.v) / bA.v * 100) : null,
        record: (bMois.v && bTout.v && bMois.v > bTout.v * 1.005) ? { w: bMois.w, r: bMois.r, pct: Math.round((bMois.v - bTout.v) / bTout.v * 100), t: bMois.t } : null,
        plateau: cinq.length >= 4 && p21.v > 0 && r21.v > 0 && r21.v <= p21.v * 1.01
      });
    });
    out.sort(function (a, b) { return b.seances - a.seances; });
    return out;
  }

  // ── Coach : habitudes ───────────────────────────────────────────────
  function habitudes() {
    var H = hist(), now = Date.now();
    var R = H.filter(function (h) { var t = tsH(h); return !isNaN(t) && now - t < 90 * DAY; });
    if (R.length < 3) return null;
    var JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
    var j = [0, 0, 0, 0, 0, 0, 0], mom = { matin: 0, 'après-midi': 0, soir: 0 }, dur = 0, nd = 0;
    R.forEach(function (h) {
      var d = new Date(tsH(h)); j[d.getDay()]++;
      var hr = d.getHours(); mom[hr < 12 ? 'matin' : (hr < 17 ? 'après-midi' : 'soir')]++;
      var m = parseFloat(h.duration); if (m > 0 && m < 300) { dur += m; nd++; }
    });
    var jm = j.indexOf(Math.max.apply(null, j));
    var mm = Object.keys(mom).sort(function (a, b) { return mom[b] - mom[a]; })[0];
    return { jour: JOURS[jm], moment: mm, duree: nd ? Math.round(dur / nd) : null, partMoment: Math.round(mom[mm] / R.length * 100) };
  }

  // ── Rendu : onglet Coach ────────────────────────────────────────────
  function coachHTML() {
    var h = '';
    try {
      var b = (typeof awakAnalyzeBehavior === 'function') ? awakAnalyzeBehavior() : null;
      var cons = (typeof awakConsistencyInfo === 'function') ? awakConsistencyInfo() : { score: 0, label: '—' };
      var ck = cons.score >= 60 ? C.bleu : (cons.score >= 40 ? C.ambre : C.rouge);
      var TYPE_IC = { finisher: 'trophee', sprinter: 'eclair', explorer: 'boussole', regular: 'bouclier', builder: 'halter' };

      // 1. Profil + assiduité (compact)
      if (b && b.type) {
        h += '<div style="' + CARTE + '">'
          + '<div style="display:flex;align-items:center;gap:12px;margin-bottom:11px;">'
          + '<span style="width:42px;height:42px;flex-shrink:0;border-radius:12px;display:flex;align-items:center;justify-content:center;background:rgba(168,85,247,0.12);border:1px solid rgba(168,85,247,0.3);">' + ic(TYPE_IC[b.type.key] || 'personne', 22, '#c084fc') + '</span>'
          + '<div style="min-width:0;"><div style="font-weight:900;color:#fff;font-size:0.98em;">' + esc(b.type.label) + '</div><div style="font-size:0.7em;color:' + C.gris + ';margin-top:1px;">' + esc(b.type.desc) + '</div></div></div>'
          + '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;"><span style="font-size:0.66em;color:' + C.gris + ';font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Assiduité</span><span style="font-weight:900;color:' + ck + ';font-size:0.84em;">' + cons.score + '/100 · ' + esc(cons.label) + '</span></div>'
          + '<div style="height:7px;background:rgba(255,255,255,0.07);border-radius:5px;overflow:hidden;"><div style="height:100%;width:' + cons.score + '%;background:' + ck + ';border-radius:5px;"></div></div>'
          + '</div>';
      }

      // 2. Progression des charges (4 dernières semaines vs 4 précédentes)
      var T = tendances();
      var suivis = T.filter(function (t) { return t.pct !== null; }).slice(0, 5);
      h += '<div style="margin-bottom:14px;">' + titre('Progression · 4 semaines', C.cyan, 'stats');
      if (suivis.length) {
        h += '<div style="' + CARTE + 'margin-bottom:0;">' + suivis.map(function (t) {
          var k = t.pct >= 2 ? C.cyan : (t.pct <= -3 ? C.rouge : C.gris);
          var f = t.pct >= 2 ? '▲ +' + t.pct + ' %' : (t.pct <= -3 ? '▼ ' + t.pct + ' %' : '= stable');
          return '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding:5px 0;border-bottom:1px solid rgba(255,255,255,0.05);">'
            + '<span style="font-size:0.76em;color:#e2e8f0;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + esc(nom(t.nom)) + '</span>'
            + '<span style="font-size:0.72em;font-weight:800;color:' + k + ';white-space:nowrap;">' + f + '</span></div>';
        }).join('')
          + '<div style="font-size:0.62em;color:#64748b;margin-top:7px;line-height:1.4;">Meilleure série estimée (charge × répétitions), ou répétitions au poids du corps.</div></div>';
      } else {
        h += '<div style="' + CARTE + 'margin-bottom:0;font-size:0.74em;color:' + C.gris + ';line-height:1.45;">Refais les mêmes exercices sur quelques semaines : je te montrerai lesquels progressent.</div>';
      }
      h += '</div>';

      // 3. Plateaux
      var pl = T.filter(function (t) { return t.plateau; }).slice(0, 3);
      if (pl.length) {
        h += '<div style="margin-bottom:14px;">' + titre('Plateaux', C.ambre, 'alerte')
          + pl.map(function (t) {
            var conseil = t.charge ? 'Essaie 5 séries de 5 un peu plus lourd, ou une autre variante pendant 3 semaines.' : 'Ajoute une charge, ralentis la descente (3 s) ou passe à une variante plus dure.';
            return '<div style="background:rgba(245,158,11,0.06);border:1px solid rgba(245,158,11,0.25);border-radius:11px;padding:10px 12px;margin-bottom:6px;">'
              + '<div style="font-size:0.78em;color:#e2e8f0;font-weight:700;">' + esc(nom(t.nom)) + ' stagne depuis 3 semaines</div>'
              + '<div style="font-size:0.68em;color:#fcd34d;margin-top:3px;line-height:1.4;">' + conseil + '</div></div>';
          }).join('') + '</div>';
      }

      // 4. Records du mois
      var rc = T.filter(function (t) { return t.record; }).sort(function (a, b) { return b.record.t - a.record.t; }).slice(0, 3);
      if (rc.length) {
        var u = unite();
        h += '<div style="margin-bottom:14px;">' + titre('Records du mois', C.violet, 'trophee')
          + '<div style="' + CARTE + 'margin-bottom:0;">' + rc.map(function (t) {
            var _wAff = u === 'kg' ? t.record.w : t.record.w * 2.20462;   // v1311 : record en kg → unité choisie
            var perf = t.charge ? (virg(Math.round(_wAff * 10) / 10) + ' ' + u + ' × ' + t.record.r) : (t.record.r + ' répétitions');
            return '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding:5px 0;">'
              + '<span style="font-size:0.76em;color:#e2e8f0;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + esc(nom(t.nom)) + '</span>'
              + '<span style="font-size:0.72em;font-weight:800;color:#c084fc;white-space:nowrap;">' + perf + ' · +' + t.record.pct + ' %</span></div>';
          }).join('') + '</div></div>';
      }

      // 5. Habitudes + volume
      var hb = habitudes();
      var vt = b && typeof b.volTrend === 'number' ? Math.round(b.volTrend * 100) : null;
      if (hb || vt !== null) {
        var cell = function (lab, val) { return '<div style="flex:1;min-width:0;text-align:center;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:10px 4px;"><div style="font-size:0.86em;font-weight:900;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + val + '</div><div style="font-size:0.54em;color:' + C.gris + ';text-transform:uppercase;letter-spacing:0.5px;margin-top:3px;line-height:1.2;">' + lab + '</div></div>'; };
        h += '<div style="margin-bottom:14px;">' + titre('Tes habitudes', C.bleu, 'calendrier') + '<div style="display:flex;gap:8px;">'
          + (hb ? cell('Jour favori', hb.jour) + cell('Moment', hb.moment) + (hb.duree ? cell('Durée moy.', hb.duree + ' min') : '') : '')
          + (vt !== null ? cell('Volume 2 sem.', (vt > 0 ? '+' : '') + vt + ' %') : '')
          + '</div></div>';
      }

      // 6. Comportement (défis / programmes / remplacements)
      if (b) {
        var ccr = (b.challengeCompletionRate === null) ? '—' : Math.round(b.challengeCompletionRate * 100) + ' %';
        var st = function (lab, val) { return '<span style="flex:1;text-align:center;font-size:0.68em;color:' + C.gris + ';"><b style="display:block;font-size:1.2em;color:#e2e8f0;">' + val + '</b>' + lab + '</span>'; };
        h += '<div style="display:flex;gap:6px;margin-bottom:12px;">' + st('défis finis', ccr) + st('programmes', b.progStart) + st('remplacements', b.totalSwaps) + '</div>';
      }
      h += '<div style="font-size:0.62em;color:#64748b;line-height:1.5;">Basé sur tes 90 derniers jours, calculé sur ton appareil.</div>';
      return h;
    } catch (e) {
      return '<div style="text-align:center;padding:20px;color:' + C.gris + ';font-size:0.82em;line-height:1.5;">Analyse indisponible pour le moment. Fais quelques séances et reviens.</div>';
    }
  }

  // ── Fenêtre ─────────────────────────────────────────────────────────
  function ouvrir(onglet) {
    var vieux = document.getElementById('systemAnalysisOverlay'); if (vieux) vieux.remove();
    var tab0 = onglet === 'coach' ? 'coach' : 'systeme';
    var ov = document.createElement('div');
    ov.id = 'systemAnalysisOverlay';
    ov.style.cssText = 'position:fixed;inset:0;z-index:10700;background:rgba(0,0,0,0.85);backdrop-filter:blur(10px);display:flex;align-items:flex-end;justify-content:center;';
    ov.onclick = function (e) { if (e.target === ov) ov.remove(); };
    var sh = document.createElement('div');
    sh.style.cssText = 'background:#0D0D0D;border-radius:20px 20px 0 0;padding:22px 16px calc(20px + env(safe-area-inset-bottom));width:100%;max-width:480px;height:88vh;box-sizing:border-box;overflow-y:auto;-webkit-overflow-scrolling:touch;';
    var bt = 'flex:1;border:none;border-radius:9px;padding:9px 6px;font-weight:800;font-size:0.78em;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;';
    sh.innerHTML = '<div style="width:36px;height:4px;background:rgba(255,255,255,0.2);border-radius:99px;margin:0 auto 16px;"></div>'
      + '<h2 style="margin:0 0 4px;text-align:center;color:#fff;font-size:1.12em;font-weight:900;">Analyse &amp; coach</h2>'
      + '<p style="margin:0 0 14px;text-align:center;color:rgba(255,255,255,0.4);font-size:0.74em;">Quoi faire aujourd\'hui, et comment tu évolues.</p>'
      + '<div style="display:flex;gap:6px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:4px;margin-bottom:16px;">'
      + '<button id="awakTabSysteme" style="' + bt + '">' + ic('cible', 14) + 'Aujourd\'hui</button>'
      + '<button id="awakTabCoach" style="' + bt + '">' + ic('stats', 14) + 'Tendances</button></div>'
      + '<div id="awakPanelSysteme">' + systemeHTML() + '</div>'
      + '<div id="awakPanelCoach" style="display:none;">' + coachHTML() + '</div>'
      + '<button onclick="document.getElementById(\'systemAnalysisOverlay\').remove()" style="margin-top:8px;width:100%;padding:13px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);border-radius:14px;color:rgba(255,255,255,0.6);font-weight:700;cursor:pointer;">Fermer</button>';
    ov.appendChild(sh);
    document.body.appendChild(ov);
    var bS = document.getElementById('awakTabSysteme'), bC = document.getElementById('awakTabCoach');
    var pS = document.getElementById('awakPanelSysteme'), pC = document.getElementById('awakPanelCoach');
    function bascule(t) {
      var s = t !== 'coach';
      pS.style.display = s ? '' : 'none'; pC.style.display = s ? 'none' : '';
      bS.style.background = s ? 'linear-gradient(135deg,#22d3ee,#0891b2)' : 'transparent'; bS.style.color = s ? '#fff' : C.gris;
      bC.style.background = !s ? 'linear-gradient(135deg,#22d3ee,#0891b2)' : 'transparent'; bC.style.color = !s ? '#fff' : C.gris;
      try { sh.scrollTop = 0; } catch (e) {}
    }
    bS.addEventListener('click', function () { bascule('systeme'); });
    bC.addEventListener('click', function () { bascule('coach'); });
    bascule(tab0);
  }

  window.AwakAnalyse = { analyser: analyser, tendances: tendances, habitudes: habitudes, systemeHTML: systemeHTML, coachHTML: coachHTML, lancer: lancer, voirEquilibre: voirEquilibre, ouvrir: ouvrir };
  window.showSystemAnalysis = ouvrir;
})();
