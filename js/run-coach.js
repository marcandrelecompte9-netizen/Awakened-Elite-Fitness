/* ═══════════════════════════════════════════════════════════════════════
   COACH DE COURSE — Awakened (v1238)
   -----------------------------------------------------------------------
   Branché sur js/run-gps.js (AwakRun). Pour le coureur qui veut progresser :

   A. OBJECTIF DE SORTIE — distance (avec temps visé optionnel) ou durée.
      Barre de progression, arrivée prévue, et la voix guide l'allure
      (« un peu lent », « trop rapide ») toutes les 60 s au plus.
   B. FRACTIONNÉ GUIDÉ — échauffement, efforts, récupérations, retour au
      calme. Phases à la distance ou au temps, annonces vocales, temps de
      chaque effort et allure visée tirée de la VMA estimée.
   C. CONTRE MOI — rejoue une sortie passée : écart en direct (« 12 s
      d'avance ») et annonce à chaque kilomètre.
   D. PLAN PROGRESSIF — 5 km, 10 km ou demi-marathon en 6 à 12 semaines,
      3 ou 4 sorties par semaine (facile, qualité, longue), semaine
      allégée toutes les 4 semaines, affûtage puis Jour J.
   F. TA FORME — prédictions (formule de Riegel), VMA estimée et allures
      d'entraînement, volume des 8 dernières semaines (alerte au-delà de
      +10 % d'une semaine à l'autre), tendance de l'allure.

   Stockage par profil : awakRunPlan (plan). Les sorties restent dans
   awakRuns (run-gps.js) avec un champ `coach` (bilan) et `prof`
   (temps tous les 100 m, pour le mode « Contre moi »).
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var ACC = '#22d3ee', OR = '#fbbf24', VIO = '#a78bfa', ROSE = '#f472b6', ROUGE = '#f87171';
  var JOUR = 864e5;

  // ── outils ─────────────────────────────────────────────────────────
  function hms(s) {
    s = Math.max(0, Math.round(s));
    var h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60;
    return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(x).padStart(2, '0');
  }
  function allure(spk) { return (!spk || !isFinite(spk) || spk > 3600) ? '–:––' : hms(spk); }
  function kmTxt(m) { var v = m / 1000; return (v % 1 === 0 ? v.toFixed(0) : v.toFixed(v * 10 % 1 === 0 ? 1 : 2)).replace('.', ','); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function N() { return window.AwakNative || null; }
  function parler(t) {
    try { if (N() && N().voix.parler(t)) return; } catch (e) {}
    try { if (typeof speak === 'function') speak(t, { interrupt: true }); } catch (e) {}
  }
  function vibrer(m) {
    try { if (N()) { N().vibrer(m); return; } } catch (e) {}
    try { navigator.vibrate && navigator.vibrate(m); } catch (e) {}
  }
  // Durée lisible à voix haute : « 4 minutes 32 »
  function voixT(s) {
    s = Math.round(s);
    var h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60;
    var out = [];
    if (h) out.push(h + ' heure' + (h > 1 ? 's' : ''));
    if (m) out.push(m + ' minute' + (m > 1 ? 's' : ''));
    if (x || !out.length) out.push(x + (out.length ? '' : ' seconde' + (x > 1 ? 's' : '')));
    return out.join(' ');
  }
  function voixKm(m) {
    if (m < 995) return (Math.round(m / 10) * 10) + ' mètres';
    var v = Math.round(m / 100) / 10;
    return String(v % 1 ? v.toFixed(1) : v).replace('.', ' virgule ') + ' kilomètre' + (v >= 2 ? 's' : '');
  }
  function ico(n, t, c) { return window.AwakIcon ? AwakIcon.get(n, t || 18, c || ACC) : ''; }
  function cle(k) { try { return window._cleProfil ? window._cleProfil(k) : k; } catch (e) { return k; } }
  function cleL(k) { try { return window._cleProfilLecture ? window._cleProfilLecture(k) : k; } catch (e) { return k; } }
  function lire(k, def) { try { var v = JSON.parse(localStorage.getItem(cleL(k)) || 'null'); return v == null ? def : v; } catch (e) { return def; } }
  function ecrire(k, v) { try { localStorage.setItem(cle(k), JSON.stringify(v)); } catch (e) {} }
  function sorties() { var a = lire('awakRuns', []); return Array.isArray(a) ? a : []; }
  function courses() { return sorties().filter(function (s) { return s && s.type === 'course' && s.distance > 0 && s.duree > 0; }); }
  function lundi(ts) { var d = new Date(ts); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d.getTime(); }
  function titre(t, c) { return '<div style="font-size:0.6em;letter-spacing:1.6px;color:' + (c || '#94a3b8') + ';font-weight:900;margin:16px 0 8px;">' + t + '</div>'; }
  function carte(inner, bord) {
    return '<div style="background:rgba(255,255,255,0.03);border:1px solid ' + (bord || 'rgba(255,255,255,0.08)') + ';border-radius:14px;padding:12px;">' + inner + '</div>';
  }
  function bouton(onclick, txt, principal, coul) {
    coul = coul || ACC;
    return '<button onclick="' + onclick + '" style="min-height:auto;padding:11px 12px;border-radius:12px;cursor:pointer;font-family:inherit;font-weight:900;font-size:0.8em;'
      + (principal ? 'background:linear-gradient(135deg,' + coul + ',' + (coul === OR ? '#d97706' : '#0891b2') + ');border:none;color:#04121f;'
                   : 'background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.12);color:#cbd5e1;') + '">' + txt + '</button>';
  }

  // ═══ F. TA FORME ════════════════════════════════════════════════════
  // Meilleurs efforts connus : sorties entières de 3 km et plus, et
  // passages 5 / 10 / 21,1 / 42,2 km.
  function efforts(liste) {
    var out = [];
    liste.forEach(function (s) {
      var dt = new Date(s.date).getTime();
      if (s.distance >= 3000) out.push({ d: s.distance, t: s.duree, date: dt });
      [[5000, 't5'], [10000, 't10'], [21097, 't21'], [42195, 't42']].forEach(function (x) {
        if (s[x[1]]) out.push({ d: x[0], t: s[x[1]], date: dt });
      });
    });
    return out;
  }
  function riegel(t1, d1, d2) { return t1 * Math.pow(d2 / d1, 1.06); }
  // Prédictions sur 90 jours (repli : tout l'historique)
  function predictions() {
    var c = courses();
    if (!c.length) return null;
    var limite = Date.now() - 90 * JOUR;
    var ef = efforts(c.filter(function (s) { return new Date(s.date).getTime() >= limite; }));
    if (!ef.length) ef = efforts(c);
    if (!ef.length) return null;
    var p = {};
    [[5000, 'p5'], [10000, 'p10'], [21097, 'p21'], [42195, 'p42']].forEach(function (x) {
      p[x[1]] = Math.min.apply(null, ef.map(function (e) { return riegel(e.t, e.d, x[0]); }));
    });
    p.longue = Math.max.apply(null, c.map(function (s) { return s.distance; }));
    return p;
  }
  // VMA ≈ vitesse sur 5 km / 0,93 (un 5 km se court vers 92-95 % de la VMA)
  function vma() { var p = predictions(); return p ? (5 / (p.p5 / 3600)) / 0.93 : 0; }
  function allureVMA(pct) { var v = vma(); return v ? 3600 / (v * pct) : 0; }

  function semaines(n) {
    var debut = lundi(Date.now()) - (n - 1) * 7 * JOUR, w = [];
    for (var i = 0; i < n; i++) w.push({ debut: debut + i * 7 * JOUR, km: 0, nb: 0 });
    sorties().forEach(function (s) {
      if (!s || s.type !== 'course') return;
      var i = Math.floor((new Date(s.date).getTime() - debut) / (7 * JOUR));
      if (i >= 0 && i < n) { w[i].km += s.distance / 1000; w[i].nb++; }
    });
    return w;
  }

  function rendreForme() {
    var c = courses();
    if (!c.length) return '';
    var p = predictions();
    var html = '<div style="height:10px;"></div>' + rendreFraicheur();
    if (p) {
      var cell = function (t, v, note) {
        return '<div style="flex:1;min-width:0;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:11px;padding:9px 4px;text-align:center;">'
          + '<div style="font-size:0.88em;font-weight:900;color:' + (note ? '#475569' : '#e2e8f0') + ';font-variant-numeric:tabular-nums;">' + v + '</div>'
          + '<div style="font-size:0.58em;color:#64748b;font-weight:800;margin-top:2px;">' + t + '</div></div>';
      };
      html += '<div style="font-size:0.7em;color:#94a3b8;margin-bottom:7px;">Temps réalistes aujourd\'hui, d\'après tes sorties récentes</div>'
        + '<div style="display:flex;gap:6px;">'
        + cell('5 KM', hms(p.p5)) + cell('10 KM', hms(p.p10))
        + (p.longue >= 10000 ? cell('DEMI', hms(p.p21)) : cell('DEMI', '—', true))
        + (p.longue >= 18000 ? cell('MARATHON', hms(p.p42)) : cell('MARATHON', '—', true))
        + '</div>';
      if (p.longue < 18000) {
        html += '<div style="font-size:0.64em;color:#64748b;margin-top:5px;">'
          + (p.longue < 10000 ? 'Le demi s\'estime après une sortie de 10 km, le marathon après 18 km.' : 'Le marathon s\'estime après une sortie de 18 km.') + '</div>';
      }
      var v = vma();
      html += '<div style="display:flex;align-items:center;gap:10px;margin-top:10px;padding:10px 12px;border-radius:12px;background:rgba(34,211,238,0.06);border:1px solid rgba(34,211,238,0.22);">'
        + '<div style="flex-shrink:0;text-align:center;"><div style="font-size:1.2em;font-weight:900;color:' + ACC + ';">' + v.toFixed(1).replace('.', ',') + '</div>'
        + '<div style="font-size:0.56em;color:#64748b;font-weight:800;">km/h</div></div>'
        + '<div style="flex:1;min-width:0;font-size:0.7em;color:#cbd5e1;line-height:1.55;">'
        + '<b style="color:#fff;">Vitesse max (VMA)</b> <span onclick="var e=this.parentNode.querySelector(\'.awk-vma-aide\');e.style.display=e.style.display===\'none\'?\'block\':\'none\'" style="cursor:pointer;color:' + ACC + ';font-weight:900;">(?)</span><br>'
        + '<b style="color:#fff;">Facile</b> ' + allure(allureVMA(0.7)) + ' · <b style="color:#fff;">Soutenue</b> ' + allure(allureVMA(0.85))
        + ' · <b style="color:#fff;">Rapide</b> ' + allure(allureVMA(1.0)) + ' <span style="color:#64748b;">/km</span>'
        + '<div class="awk-vma-aide" style="display:none;margin-top:6px;color:#94a3b8;">La vitesse la plus élevée que tu peux tenir environ 6 minutes. Elle sert à calculer tes allures : <b>facile</b> pour l\'endurance (tu peux parler), <b>soutenue</b> pour les séances au seuil, <b>rapide</b> pour le fractionné court.</div></div></div>';
    }
    // Volume hebdo (8 semaines)
    var w = semaines(8), max = Math.max.apply(null, w.map(function (x) { return x.km; })) || 1;
    html += '<div style="display:flex;align-items:flex-end;gap:5px;height:74px;margin-top:12px;">'
      + w.map(function (x, i) {
          var h = Math.max(3, Math.round(x.km / max * 56));
          var cour = i === w.length - 1;
          return '<div style="flex:1;min-width:0;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:3px;">'
            + '<span style="font-size:0.55em;color:' + (cour ? '#e2e8f0' : '#64748b') + ';font-weight:800;">' + (x.km ? Math.round(x.km) : '') + '</span>'
            + '<span style="width:100%;height:' + h + 'px;border-radius:4px;background:' + (cour ? ACC : 'rgba(34,211,238,0.35)') + ';"></span></div>';
        }).join('') + '</div>'
      + '<div style="display:flex;justify-content:space-between;font-size:0.56em;color:#475569;font-weight:800;margin-top:3px;"><span>il y a 8 sem.</span><span>km par semaine</span><span>cette sem.</span></div>';
    var cur = w[7].km, prec = w[6].km;
    if (prec >= 5 && cur > prec * 1.1) {
      html += '<div style="margin-top:8px;padding:9px 11px;border-radius:11px;background:rgba(251,191,36,0.08);border:1px solid rgba(251,191,36,0.35);font-size:0.7em;color:#fde68a;line-height:1.45;">'
        + '<b>+' + Math.round((cur / prec - 1) * 100) + ' % cette semaine.</b> Augmenter de plus de 10 % par semaine fait grimper le risque de blessure : garde les prochaines sorties faciles.</div>';
    }
    // Tendance d'allure (28 j vs 28 j précédents)
    var t0 = Date.now() - 28 * JOUR, t1 = t0 - 28 * JOUR;
    var moy = function (a, b) {
      var l = c.filter(function (s) { var d = new Date(s.date).getTime(); return d >= a && d < b && s.distance >= 2000; });
      var dd = l.reduce(function (x, s) { return x + s.distance; }, 0), tt = l.reduce(function (x, s) { return x + s.duree; }, 0);
      return dd ? tt / (dd / 1000) : 0;
    };
    var a1 = moy(t0, Date.now() + 1), a0 = moy(t1, t0);
    if (a1 && a0) {
      var mieux = a1 < a0 - 2, pire = a1 > a0 + 2;
      html += '<div style="font-size:0.7em;color:#94a3b8;margin-top:8px;">Allure moyenne sur 4 semaines : '
        + '<b style="color:#e2e8f0;">' + allure(a0) + ' → ' + allure(a1) + '</b> '
        + (mieux ? '<span style="color:' + ACC + ';font-weight:800;">tu progresses</span>' : (pire ? '<span style="color:#94a3b8;">un peu plus lente (fatigue ? sorties plus longues ?)</span>' : '<span>stable</span>')) + '</div>';
    }
    return html;
  }

  // ═══ B. SÉANCES DE FRACTIONNÉ ═══════════════════════════════════════
  // pct = part de la VMA visée pendant l'effort
  var TPL = {
    minute:   { nom: '10 × 1 min',      desc: '1 min vite, 1 min en trottinant. Idéal pour débuter le fractionné.', pct: 0.95, reps: 10, eff: ['t', 60],  rec: ['t', 60] },
    court400: { nom: '8 × 400 m',       desc: 'Vitesse. Récupération 1 min 30 en trottinant.',                     pct: 1.0,  reps: 8,  eff: ['d', 400], rec: ['t', 90] },
    pyramide: { nom: 'Pyramide',        desc: '200 · 400 · 600 · 800 · 600 · 400 · 200 m. Récupération 1 min 30.',  pct: 1.0,  liste: [200, 400, 600, 800, 600, 400, 200], rec: ['t', 90] },
    k800:     { nom: '6 × 800 m',       desc: 'VMA longue. Récupération 2 min.',                                    pct: 0.97, reps: 6,  eff: ['d', 800], rec: ['t', 120] },
    k1000:    { nom: '5 × 1000 m',      desc: 'VMA longue. Récupération 2 min.',                                    pct: 0.95, reps: 5,  eff: ['d', 1000], rec: ['t', 120] },
    seuil:    { nom: '3 × 8 min seuil', desc: 'Confortablement difficile. Récupération 2 min.',                     pct: 0.85, reps: 3,  eff: ['t', 480], rec: ['t', 120] },
    seuil2:   { nom: '2 × 12 min seuil', desc: 'Allure seuil tenue longtemps. Récupération 3 min.',                 pct: 0.85, reps: 2,  eff: ['t', 720], rec: ['t', 180] },
    tempo:    { nom: 'Tempo 20 min',    desc: 'Allure soutenue en continu, sans pause.',                            pct: 0.82, reps: 1,  eff: ['t', 1200], rec: null },
    tempo30:  { nom: 'Tempo 30 min',    desc: 'Allure semi-marathon en continu.',                                   pct: 0.8,  reps: 1,  eff: ['t', 1800], rec: null }
  };
  var ORDRE_TPL = ['minute', 'court400', 'pyramide', 'k800', 'k1000', 'seuil', 'seuil2', 'tempo', 'tempo30'];

  function phasesDe(tplId, echauf) {
    var T = TPL[tplId] || TPL.minute, ph = [];
    if (echauf !== false) ph.push({ type: 'echauf', m: 't', v: 600, nom: 'Échauffement' });
    var effs = T.liste ? T.liste.map(function (d) { return ['d', d]; }) : Array.apply(null, Array(T.reps)).map(function () { return T.eff; });
    effs.forEach(function (e, i) {
      ph.push({ type: 'effort', m: e[0], v: e[1], n: i + 1, sur: effs.length, nom: 'Effort ' + (i + 1) + ' / ' + effs.length });
      if (T.rec && i < effs.length - 1) ph.push({ type: 'recup', m: T.rec[0], v: T.rec[1], nom: 'Récupère' });
    });
    if (echauf !== false) ph.push({ type: 'calme', m: 't', v: 300, nom: 'Retour au calme' });
    return ph;
  }
  function mesureVoix(m, v) { return m === 'd' ? (v >= 1000 ? voixKm(v) : v + ' mètres') : voixT(v); }

  // ═══ CHOIX AVANT LE DÉPART ══════════════════════════════════════════
  var sel = { mode: 'libre', kind: 'distance', km: 5, min: 0, dur: 30, tpl: 'minute', echauf: true, fantome: null, plan: null };
  var activiteCourante = 'course';

  function modesPour(act) { return act === 'course' ? ['libre', 'objectif', 'fractionne', 'fantome'] : ['libre', 'objectif']; }
  var NOMS = { libre: 'Libre', objectif: 'Objectif', fractionne: 'Fractionné', fantome: 'Contre moi' };

  function resumePrefs() {
    var P = prefs(), f = FREQS.filter(function (x) { return x[0] === P.freq; })[0];
    return (P.freq === 'off' ? 'silence' : 'tous les ' + (f ? f[1] : '1 km')) + (P.autoPause ? ' · pause auto' : '');
  }
  function rendreChoix(hote, act) {
    if (typeof hote === 'string') hote = document.getElementById(hote);
    if (!hote) return;
    activiteCourante = act || activiteCourante;
    var modes = modesPour(activiteCourante);
    if (modes.indexOf(sel.mode) < 0) sel.mode = 'libre';
    sel.plan = null;
    hote.innerHTML = '<div style="font-size:0.6em;letter-spacing:1.6px;color:#94a3b8;font-weight:900;margin:14px 0 7px;">TYPE DE SORTIE</div>'
      + '<div style="display:flex;gap:6px;">' + modes.map(function (m) {
          var on = sel.mode === m;
          return '<button data-mode="' + m + '" style="flex:1;min-width:0;min-height:auto;padding:9px 4px;border-radius:11px;cursor:pointer;font-family:inherit;font-weight:800;font-size:0.74em;'
            + (on ? 'background:rgba(34,211,238,0.14);border:1.5px solid ' + ACC + ';color:#fff;' : 'background:rgba(255,255,255,0.03);border:1.5px solid rgba(255,255,255,0.1);color:#94a3b8;') + '">' + NOMS[m] + '</button>';
        }).join('') + '</div>'
      + '<div id="awkCoachCfg" style="margin-top:10px;"></div>'
      + '<button onclick="AwakCoachRun.reglagesUI()" style="display:flex;align-items:center;gap:7px;margin-top:10px;min-height:auto;padding:6px 0;border:none;background:transparent;cursor:pointer;font-family:inherit;font-size:0.72em;font-weight:800;color:#94a3b8;">'
      +   ico('message', 15, '#94a3b8') + 'Voix et pause auto : ' + resumePrefs() + '</button>';
    hote.querySelectorAll('[data-mode]').forEach(function (b) {
      b.onclick = function () { sel.mode = b.getAttribute('data-mode'); rendreChoix(hote); };
    });
    rendreCfg();
  }

  function rendreCfg() {
    var h = document.getElementById('awkCoachCfg');
    if (!h) return;
    var R = window.AwakRegle;
    if (sel.mode === 'libre') {
      h.innerHTML = '<div style="font-size:0.7em;color:#64748b;line-height:1.5;">Cours comme tu veux : temps, distance et allure, annonce à chaque kilomètre.</div>';
    } else if (sel.mode === 'objectif') {
      var seg = function (k, t) {
        var on = sel.kind === k;
        return '<button data-kind="' + k + '" style="flex:1;min-height:auto;padding:7px;border-radius:8px;border:none;cursor:pointer;font-family:inherit;font-weight:900;font-size:0.74em;'
          + (on ? 'background:linear-gradient(135deg,#22d3ee,#0891b2);color:#04121f;' : 'background:transparent;color:#94a3b8;') + '">' + t + '</button>';
      };
      var html = '<div style="display:flex;gap:3px;padding:3px;border-radius:11px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);margin-bottom:12px;">'
        + seg('distance', 'Distance') + seg('duree', 'Durée') + '</div>';
      if (sel.kind === 'distance') {
        html += R.html('awkObjKm', { min: 1, max: 42, pas: 0.5, val: sel.km, unite: 'km' })
          + '<div style="display:flex;align-items:center;justify-content:space-between;margin:14px 0 8px;">'
          +   '<span style="font-size:0.72em;color:#94a3b8;font-weight:800;">Temps visé</span>'
          +   '<button id="awkObjTempsBtn" style="min-height:auto;padding:5px 11px;border-radius:9px;cursor:pointer;font-family:inherit;font-size:0.7em;font-weight:800;'
          +     (sel.min ? 'background:rgba(34,211,238,0.14);border:1px solid ' + ACC + ';color:#fff;">Activé' : 'background:transparent;border:1px solid rgba(255,255,255,0.15);color:#94a3b8;">Sans temps') + '</button></div>'
          + (sel.min ? R.html('awkObjMin', { min: 5, max: 300, pas: 1, val: sel.min, unite: 'min' }) + '<div id="awkObjAllure" style="text-align:center;font-size:0.74em;color:' + ACC + ';font-weight:800;margin-top:6px;"></div>' : '');
      } else {
        html += R.html('awkObjDur', { min: 10, max: 180, pas: 5, val: sel.dur, unite: 'min' });
      }
      h.innerHTML = html;
      h.querySelectorAll('[data-kind]').forEach(function (b) { b.onclick = function () { sel.kind = b.getAttribute('data-kind'); rendreCfg(); }; });
      var majAllure = function () {
        var el = document.getElementById('awkObjAllure');
        if (el && sel.min) el.textContent = 'soit ' + allure(sel.min * 60 / sel.km) + ' /km';
      };
      // Temps visé proposé selon la forme ; il suit la distance tant qu'on
      // ne l'a pas réglé soi-même.
      var tempsAuto = function (km) { var p = predictions(); return Math.max(5, Math.min(300, p ? Math.round(riegel(p.p5, 5000, km * 1000) / 60) : Math.round(km * 6))); };
      if (sel.kind === 'distance') {
        R.init('awkObjKm', function (v) {
          sel.km = v;
          if (sel.min && !sel.minManuel) { sel.min = tempsAuto(v); R.fixer('awkObjMin', sel.min); }
          majAllure();
        });
        var tb = document.getElementById('awkObjTempsBtn');
        if (tb) tb.onclick = function () {
          if (sel.min) sel.min = 0;
          else { sel.min = tempsAuto(sel.km); sel.minManuel = false; }
          rendreCfg();
        };
        if (sel.min) { R.init('awkObjMin', function (v) { sel.min = v; sel.minManuel = true; majAllure(); }); majAllure(); }
      } else {
        R.init('awkObjDur', function (v) { sel.dur = v; });
      }
    } else if (sel.mode === 'fractionne') {
      var v = vma();
      h.innerHTML = ORDRE_TPL.map(function (id) {
        var T = TPL[id], on = sel.tpl === id;
        return '<button data-tpl="' + id + '" style="display:block;width:100%;text-align:left;min-height:auto;padding:10px 12px;margin-bottom:6px;border-radius:12px;cursor:pointer;font-family:inherit;'
          + 'background:' + (on ? 'rgba(251,191,36,0.1)' : 'rgba(255,255,255,0.03)') + ';border:1.5px solid ' + (on ? OR : 'rgba(255,255,255,0.08)') + ';color:#e2e8f0;">'
          + '<span style="display:flex;align-items:baseline;gap:8px;"><b style="font-size:0.86em;flex:1;">' + T.nom + '</b>'
          + (v ? '<span style="font-size:0.66em;color:' + OR + ';font-weight:800;">' + allure(allureVMA(T.pct)) + ' /km</span>' : '') + '</span>'
          + '<span style="display:block;font-size:0.68em;color:#94a3b8;margin-top:2px;line-height:1.4;">' + T.desc + '</span></button>';
      }).join('')
        + '<label style="display:flex;align-items:center;gap:9px;font-size:0.74em;color:#cbd5e1;margin-top:6px;cursor:pointer;">'
        + '<input type="checkbox" id="awkEchauf" ' + (sel.echauf ? 'checked' : '') + ' style="width:18px;height:18px;accent-color:#22d3ee;"> Échauffement 10 min et retour au calme 5 min</label>'
        + (v ? '' : '<div style="font-size:0.66em;color:#64748b;margin-top:8px;">Fais une sortie de 3 km ou plus : l\'app calculera ta VMA et tes allures cibles.</div>');
      h.querySelectorAll('[data-tpl]').forEach(function (b) { b.onclick = function () { sel.tpl = b.getAttribute('data-tpl'); rendreCfg(); }; });
      var ec = document.getElementById('awkEchauf'); if (ec) ec.onchange = function () { sel.echauf = ec.checked; };
    } else if (sel.mode === 'fantome') {
      var l = courses().filter(function (s) { return s.distance >= 1000; }).slice(0, 8);
      if (!l.length) { h.innerHTML = '<div style="font-size:0.72em;color:#94a3b8;line-height:1.5;">Fais d\'abord une sortie de course d\'au moins 1 km : tu pourras ensuite courir contre elle.</div>'; sel.fantome = null; return; }
      if (!sel.fantome || !l.some(function (s) { return s.id === sel.fantome; })) sel.fantome = l[0].id;
      h.innerHTML = '<div style="font-size:0.7em;color:#94a3b8;margin-bottom:8px;">Choisis la sortie à battre. Idéal sur le même parcours.</div>'
        + l.map(function (s) {
            var on = sel.fantome === s.id;
            return '<button data-fant="' + s.id + '" style="display:flex;align-items:center;gap:10px;width:100%;text-align:left;min-height:auto;padding:10px 12px;margin-bottom:6px;border-radius:12px;cursor:pointer;font-family:inherit;'
              + 'background:' + (on ? 'rgba(167,139,250,0.12)' : 'rgba(255,255,255,0.03)') + ';border:1.5px solid ' + (on ? VIO : 'rgba(255,255,255,0.08)') + ';color:#e2e8f0;">'
              + '<span style="flex:1;min-width:0;"><b style="font-size:0.86em;">' + kmTxt(s.distance) + ' km en ' + hms(s.duree) + '</b>'
              + '<span style="display:block;font-size:0.68em;color:#94a3b8;">' + new Date(s.date).toLocaleDateString('fr-CA', { weekday: 'short', day: 'numeric', month: 'short' }) + ' · ' + allure(s.duree / (s.distance / 1000)) + ' /km</span></span></button>';
          }).join('');
      h.querySelectorAll('[data-fant]').forEach(function (b) { b.onclick = function () { sel.fantome = +b.getAttribute('data-fant'); rendreCfg(); }; });
    }
  }

  // Configuration choisie (null = sortie libre)
  function config() {
    if (sel.plan) return sel.plan;
    if (sel.mode === 'objectif') {
      return sel.kind === 'distance'
        ? { mode: 'objectif', kind: 'distance', m: Math.round(sel.km * 1000), t: sel.min ? sel.min * 60 : 0 }
        : { mode: 'objectif', kind: 'duree', s: sel.dur * 60 };
    }
    if (sel.mode === 'fractionne') return { mode: 'fractionne', tpl: sel.tpl, echauf: sel.echauf };
    if (sel.mode === 'fantome' && sel.fantome) return { mode: 'fantome', id: sel.fantome };
    return null;
  }

  // ═══ MOTEUR PENDANT LA SORTIE ═══════════════════════════════════════
  function profilFantome(s) {
    if (s.prof && s.prof.length > 1) return [[0, 0]].concat(s.prof);
    var p = [[0, 0]], cum = 0;
    (s.splits || []).forEach(function (x, i) { cum += x; p.push([(i + 1) * 1000, cum]); });
    if (s.distance > p[p.length - 1][0]) p.push([s.distance, s.duree]);
    return p;
  }
  function tempsA(prof, d) {
    for (var i = 1; i < prof.length; i++) {
      if (prof[i][0] >= d) {
        var a = prof[i - 1], b = prof[i];
        return a[1] + (b[1] - a[1]) * ((d - a[0]) / Math.max(1, b[0] - a[0]));
      }
    }
    return null;
  }

  function creer(cfg) {
    if (!cfg) return null;
    var C = { cfg: cfg, dernierConseil: 0, fini: false };
    if (cfg.mode === 'fractionne') {
      C.ph = phasesDe(cfg.tpl, cfg.echauf); C.i = -1; C.res = [];
      C.allureCible = allureVMA((TPL[cfg.tpl] || TPL.minute).pct);
    }
    if (cfg.mode === 'fantome') {
      var s = sorties().filter(function (x) { return x.id === cfg.id; })[0];
      if (s) { C.fant = s; C.prof = profilFantome(s); C.kmAnn = 0; }
      else C.cfg = { mode: 'libre' };
    }
    return C;
  }

  function debutPhase(C, x) {
    C.i++;
    if (C.i >= C.ph.length) {
      C.fini = true;
      parler('Séance terminée. Bravo ! Tu peux arrêter, ou trottiner encore un peu.');
      vibrer([120, 80, 120, 80, 200]);
      return;
    }
    var P = C.ph[C.i];
    C.d0 = x.d; C.t0 = x.t; C.ann = false;
    var txt;
    if (P.type === 'effort') txt = (P.n === 1 ? 'C\'est parti. ' : '') + 'Effort ' + P.n + ' sur ' + P.sur + ' : ' + mesureVoix(P.m, P.v) + '. Accélère !';
    else if (P.type === 'recup') txt = 'Récupère. ' + mesureVoix(P.m, P.v) + ' en trottinant.';
    else if (P.type === 'echauf') txt = 'Échauffement : ' + mesureVoix(P.m, P.v) + ' en footing facile.';
    else txt = 'Retour au calme : ' + mesureVoix(P.m, P.v) + ' tout doucement.';
    parler(txt);
    vibrer(P.type === 'effort' ? [200, 80, 200] : 120);
  }
  function finPhase(C, x) {
    var P = C.ph[C.i];
    if (P && P.type === 'effort') {
      var r = { d: Math.round(x.d - C.d0), t: Math.round(x.t - C.t0) };
      C.res.push(r);
      var a = r.d > 30 ? r.t / (r.d / 1000) : 0;
      if (P.m === 'd') parler('Effort ' + P.n + ' : ' + voixT(r.t) + '.');
      else if (a) parler('Effort ' + P.n + ' : allure ' + voixT(a) + ' au kilomètre.');
    }
    debutPhase(C, x);
  }

  // x = { t: durée active, d: distance (m), a: allure actuelle (s/km), run: bool }
  function tick(R, x) {
    var C = R && R.coach; if (!C) return;
    var cfg = C.cfg;
    if (x.run && !C.fini) {
      if (cfg.mode === 'objectif') {
        if (cfg.kind === 'distance') {
          if (x.d >= cfg.m) {
            C.fini = true;
            parler('Objectif atteint ! ' + voixKm(cfg.m) + ' en ' + voixT(x.t) + (cfg.t ? (x.t <= cfg.t ? '. Temps visé battu !' : '.') : '.'));
            vibrer([150, 80, 150, 80, 300]);
          } else if (cfg.t && x.d > 400 && x.a && x.t - C.dernierConseil > 45) {
            // Guide d'allure : parle quand l'état CHANGE, puis espace les
            // rappels (2, 3, 4 min…) au lieu de répéter toutes les minutes.
            var cible = cfg.t / (cfg.m / 1000);
            var prevu = x.t + (cfg.m - x.d) * (x.t / x.d), ecart = Math.round(prevu - cfg.t);
            var etat = x.a > cible * 1.06 ? 'lent' : (x.a < cible * 0.92 ? 'vite' : 'ok');
            var change = etat !== (C.etatAllure || 'ok');
            if (change || (etat !== 'ok' && x.t - C.dernierConseil > 120 + 60 * (C.rappels || 0))) {
              if (etat === 'lent') parler('Un peu lent' + (ecart > 5 ? ', ' + voixT(ecart) + ' de retard sur ton objectif' : '') + '. Allure visée : ' + voixT(cible) + ' au kilomètre.');
              else if (etat === 'vite') parler('Trop rapide, garde des forces pour la fin.');
              else parler('C\'est bon, tu es dans l\'allure.');
              C.rappels = change ? 0 : (C.rappels || 0) + 1;
              C.dernierConseil = x.t; C.etatAllure = etat;
            }
          }
        } else {
          if (!C.mi && x.t >= cfg.s / 2) { C.mi = true; parler('Mi-parcours. Encore ' + voixT(cfg.s - x.t) + '.'); }
          if (x.t >= cfg.s) { C.fini = true; parler('Objectif atteint : ' + voixT(cfg.s) + ' de course, ' + voixKm(x.d) + '.'); vibrer([150, 80, 150, 80, 300]); }
        }
      } else if (cfg.mode === 'fractionne') {
        if (C.i < 0) debutPhase(C, x);
        var P = C.ph[C.i];
        if (P) {
          var fait = P.m === 'd' ? x.d - C.d0 : x.t - C.t0, reste = P.v - fait;
          if (!C.ann) {
            if (P.m === 't' && P.v >= 30 && reste <= 10) { C.ann = true; parler('10 secondes'); }
            else if (P.m === 'd' && P.v >= 300 && reste <= 100) { C.ann = true; parler('Encore 100 mètres'); }
          }
          if (reste <= 0) finPhase(C, x);
        }
      } else if (cfg.mode === 'fantome' && C.prof) {
        var kmFait = Math.floor(x.d / 1000);
        var lim = C.fant.distance;
        if (kmFait > C.kmAnn && kmFait * 1000 < lim) {
          C.kmAnn = kmFait;
          var g = tempsA(C.prof, kmFait * 1000);
          if (g != null) {
            var e = Math.round(g - x.t);
            parler(Math.abs(e) < 3 ? 'Tu es à égalité avec ta sortie de référence.' : (e > 0 ? 'Tu as ' + voixT(e) + ' d\'avance.' : 'Tu as ' + voixT(-e) + ' de retard.'));
          }
        }
        if (x.d >= lim) {
          C.fini = true;
          var ecart = Math.round(C.fant.duree - x.t);
          C.ecartFinal = ecart;
          parler(ecart > 0 ? 'Sortie battue de ' + voixT(ecart) + ' ! Bravo.' : (ecart === 0 ? 'Égalité parfaite.' : 'Il te manquait ' + voixT(-ecart) + '. La prochaine fois !'));
          vibrer([150, 80, 150, 80, 300]);
        }
      }
    }
    afficher(R, x);
  }

  function barre(pct, c) {
    return '<div style="height:8px;border-radius:99px;background:rgba(255,255,255,0.07);overflow:hidden;margin:8px 0 6px;">'
      + '<div style="height:100%;width:' + Math.max(0, Math.min(100, pct)).toFixed(1) + '%;background:' + c + ';border-radius:99px;transition:width .8s linear;"></div></div>';
  }

  function afficher(R, x) {
    var h = document.getElementById('awakRunCoach');
    var C = R.coach;
    if (!h || !C) return;
    var cfg = C.cfg, html = '';
    if (cfg.mode === 'objectif' && cfg.kind === 'distance') {
      var pct = x.d / cfg.m * 100, info = '';
      if (C.fini) info = '<span style="color:' + OR + ';font-weight:900;">Objectif atteint</span>';
      else if (x.d > 200 && x.t > 30) {
        var prevu = x.t + (cfg.m - x.d) * (x.t / x.d);
        info = 'Arrivée prévue <b style="color:#fff;">' + hms(prevu) + '</b>';
        if (cfg.t) {
          var e = Math.round(cfg.t - prevu);
          info += ' · <b style="color:' + (e >= 0 ? ACC : ROUGE) + ';">' + (e >= 0 ? hms(e) + ' d\'avance' : hms(-e) + ' de retard') + '</b>';
        }
      } else if (cfg.t) info = 'Allure visée <b style="color:#fff;">' + allure(cfg.t / (cfg.m / 1000)) + ' /km</b>';
      html = '<div style="display:flex;justify-content:space-between;font-size:0.68em;font-weight:900;letter-spacing:1px;"><span style="color:' + ACC + ';">OBJECTIF ' + kmTxt(cfg.m) + ' KM' + (cfg.t ? ' EN ' + hms(cfg.t) : '') + '</span>'
        + '<span style="color:#94a3b8;">' + (C.fini ? '' : kmTxt(Math.max(0, cfg.m - x.d)) + ' km restants') + '</span></div>'
        + barre(pct, C.fini ? OR : ACC) + '<div style="font-size:0.74em;color:#94a3b8;">' + info + '</div>';
    } else if (cfg.mode === 'objectif') {
      html = '<div style="display:flex;justify-content:space-between;font-size:0.68em;font-weight:900;letter-spacing:1px;"><span style="color:' + ACC + ';">OBJECTIF ' + Math.round(cfg.s / 60) + ' MIN</span>'
        + '<span style="color:#94a3b8;">' + (C.fini ? '' : hms(Math.max(0, cfg.s - x.t)) + ' restantes') + '</span></div>'
        + barre(x.t / cfg.s * 100, C.fini ? OR : ACC)
        + (C.fini ? '<div style="font-size:0.74em;color:' + OR + ';font-weight:900;">Objectif atteint</div>' : '');
    } else if (cfg.mode === 'fractionne') {
      var P = C.ph[C.i];
      if (C.i < 0) {
        html = '<div style="font-size:0.62em;color:#64748b;font-weight:900;letter-spacing:1.4px;">' + (TPL[cfg.tpl] || {}).nom + '</div>'
          + '<div style="font-size:0.95em;font-weight:900;color:' + VIO + ';margin-top:2px;">' + C.ph[0].nom + ' : départ dès que le GPS est prêt</div>';
      } else if (C.fini || !P) {
        html = '<div style="font-size:0.9em;font-weight:900;color:' + OR + ';">Séance terminée</div>';
      } else {
        var col = P.type === 'effort' ? ROSE : (P.type === 'recup' ? ACC : VIO);
        var fait = P.m === 'd' ? x.d - C.d0 : x.t - C.t0, reste = Math.max(0, P.v - fait);
        html = '<div style="display:flex;align-items:center;gap:10px;">'
          + '<div style="flex:1;min-width:0;"><div style="font-size:0.62em;color:#64748b;font-weight:900;letter-spacing:1.4px;">' + (TPL[cfg.tpl] || {}).nom + '</div>'
          + '<div style="font-size:1.25em;font-weight:900;color:' + col + ';">' + P.nom + '</div></div>'
          + '<div style="text-align:right;"><div style="font-family:var(--font-display);font-size:1.7em;font-weight:900;color:#fff;font-variant-numeric:tabular-nums;line-height:1;">'
          + (P.m === 'd' ? Math.round(reste) + '<span style="font-size:0.5em;color:#94a3b8;"> m</span>' : hms(reste)) + '</div>'
          + '<div style="font-size:0.56em;color:#64748b;font-weight:800;">RESTANT</div></div></div>'
          + barre(fait / P.v * 100, col)
          + (P.type === 'effort' && C.allureCible ? '<div style="font-size:0.72em;color:#94a3b8;">Allure visée <b style="color:' + OR + ';">' + allure(C.allureCible) + ' /km</b> · actuelle <b style="color:#fff;">' + allure(x.a) + '</b></div>' : '')
          + '<button onclick="AwakCoachRun.passer()" style="margin-top:8px;min-height:auto;padding:6px 12px;border-radius:9px;cursor:pointer;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.12);color:#94a3b8;font-size:0.7em;font-weight:800;">Passer cette étape</button>';
      }
      if (C.res.length) {
        html += '<div style="display:flex;flex-wrap:wrap;gap:5px;margin-top:8px;">' + C.res.map(function (r, i) {
          return '<span style="font-size:0.66em;padding:3px 7px;border-radius:7px;background:rgba(244,114,182,0.1);color:#fbcfe8;font-weight:800;">' + (i + 1) + ' · ' + hms(r.t) + '</span>';
        }).join('') + '</div>';
      }
    } else if (cfg.mode === 'fantome' && C.prof) {
      var g = tempsA(C.prof, Math.min(x.d, C.fant.distance));
      var e2 = (g != null && x.d > 50) ? Math.round(g - x.t) : null;
      var dGhost = 0;
      for (var i = 1; i < C.prof.length; i++) {
        if (C.prof[i][1] >= x.t) { var a = C.prof[i - 1], b = C.prof[i]; dGhost = a[0] + (b[0] - a[0]) * ((x.t - a[1]) / Math.max(1, b[1] - a[1])); break; }
        dGhost = C.prof[i][0];
      }
      html = '<div style="display:flex;justify-content:space-between;font-size:0.68em;font-weight:900;letter-spacing:1px;"><span style="color:' + VIO + ';">CONTRE TA SORTIE DU ' + new Date(C.fant.date).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' }).toUpperCase() + '</span>'
        + '<span style="color:#94a3b8;">' + kmTxt(C.fant.distance) + ' km en ' + hms(C.fant.duree) + '</span></div>'
        + (function () {
            var piste = function (lib, pct, coul) {
              return '<div style="display:flex;align-items:center;gap:8px;margin-top:7px;">'
                + '<span style="width:66px;flex-shrink:0;font-size:0.6em;color:' + coul + ';font-weight:900;letter-spacing:1px;">' + lib + '</span>'
                + '<span style="flex:1;position:relative;height:6px;border-radius:99px;background:rgba(255,255,255,0.07);">'
                + '<span style="position:absolute;left:0;top:0;bottom:0;width:' + Math.min(100, pct).toFixed(1) + '%;border-radius:99px;background:' + coul + ';opacity:0.45;"></span>'
                + '<span style="position:absolute;top:-4px;left:calc(' + Math.min(100, pct).toFixed(1) + '% - 7px);width:14px;height:14px;border-radius:50%;background:' + coul + ';border:2px solid #0d1117;"></span></span></div>';
            };
            return '<div style="margin:6px 0 4px;">' + piste('TOI', x.d / C.fant.distance * 100, ACC) + piste('RÉFÉRENCE', dGhost / C.fant.distance * 100, VIO) + '</div>';
          })()
        + (C.fini
            ? '<div style="font-size:0.95em;font-weight:900;margin-top:6px;color:' + (C.ecartFinal > 0 ? OR : '#cbd5e1') + ';">' + (C.ecartFinal > 0 ? 'Battue de ' + hms(C.ecartFinal) : (C.ecartFinal === 0 ? 'Égalité' : 'Il manquait ' + hms(-C.ecartFinal))) + '</div>'
            : (e2 == null ? '' : '<div style="font-size:1.15em;font-weight:900;margin-top:6px;color:' + (e2 >= 0 ? ACC : ROUGE) + ';">' + (e2 >= 0 ? hms(e2) + ' d\'avance' : hms(-e2) + ' de retard') + '</div>'));
    }
    if (C.planTxt) html = '<div style="font-size:0.6em;color:' + OR + ';font-weight:900;letter-spacing:1.4px;margin-bottom:6px;">' + esc(C.planTxt) + '</div>' + html;
    h.innerHTML = '<div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:11px 13px;margin-bottom:10px;">' + html + '</div>';
  }

  // Bilan enregistré avec la sortie
  function bilan(R) {
    var C = R && R.coach; if (!C) return null;
    var cfg = C.cfg, b = { mode: cfg.mode, fini: !!C.fini };
    if (cfg.mode === 'objectif') {
      b.titre = cfg.kind === 'distance' ? 'Objectif ' + kmTxt(cfg.m) + ' km' + (cfg.t ? ' en ' + hms(cfg.t) : '') : 'Objectif ' + Math.round(cfg.s / 60) + ' min';
    } else if (cfg.mode === 'fractionne') {
      b.titre = 'Fractionné · ' + (TPL[cfg.tpl] || {}).nom;
      b.efforts = C.res.slice(); b.cible = C.allureCible || 0;
    } else if (cfg.mode === 'fantome' && C.fant) {
      b.titre = 'Contre ma sortie du ' + new Date(C.fant.date).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' });
      b.ecart = C.fini ? C.ecartFinal : null;
    }
    if (cfg.plan) { b.plan = cfg.plan; b.titre = (C.planTxt ? C.planTxt + ' · ' : '') + (b.titre || ''); }
    return b;
  }

  function rendreBilan(s) {
    var b = s && s.coach; if (!b) return '';
    var html = '<div style="font-size:0.6em;letter-spacing:1.6px;color:' + OR + ';font-weight:900;margin:12px 0 6px;">' + esc((b.titre || '').toUpperCase()) + '</div>';
    if (b.mode === 'objectif') {
      html += '<div style="font-size:0.8em;color:' + (b.fini ? OR : '#94a3b8') + ';font-weight:800;">' + (b.fini ? 'Objectif atteint' : 'Objectif non terminé') + '</div>';
    } else if (b.mode === 'fantome') {
      html += '<div style="font-size:0.8em;font-weight:800;color:' + (b.ecart > 0 ? OR : '#94a3b8') + ';">'
        + (b.ecart == null ? 'Distance de référence non atteinte' : (b.ecart > 0 ? 'Référence battue de ' + hms(b.ecart) : (b.ecart === 0 ? 'Égalité' : 'Il manquait ' + hms(-b.ecart)))) + '</div>';
    } else if (b.mode === 'fractionne' && b.efforts && b.efforts.length) {
      var meil = Math.min.apply(null, b.efforts.map(function (r) { return r.d > 30 ? r.t / (r.d / 1000) : 9999; }));
      html += b.efforts.map(function (r, i) {
        var a = r.d > 30 ? r.t / (r.d / 1000) : 0;
        return '<div style="display:flex;gap:8px;font-size:0.74em;padding:5px 0;border-top:1px solid rgba(255,255,255,0.05);">'
          + '<span style="width:56px;color:#64748b;font-weight:800;">Effort ' + (i + 1) + '</span>'
          + '<span style="flex:1;color:#cbd5e1;">' + (r.d >= 1000 ? kmTxt(r.d) + ' km' : r.d + ' m') + ' en ' + hms(r.t) + '</span>'
          + '<span style="font-weight:900;color:' + (a && Math.abs(a - meil) < 0.5 ? OR : '#e2e8f0') + ';">' + allure(a) + '</span></div>';
      }).join('')
        + (b.cible ? '<div style="font-size:0.66em;color:#64748b;margin-top:4px;">Allure visée : ' + allure(b.cible) + ' /km</div>' : '');
      if (b.efforts.length >= 3) {
        var p1 = b.efforts[0], pn = b.efforts[b.efforts.length - 1];
        var a1 = p1.d > 30 ? p1.t / (p1.d / 1000) : 0, an = pn.d > 30 ? pn.t / (pn.d / 1000) : 0;
        if (a1 && an) html += '<div style="font-size:0.7em;color:#94a3b8;margin-top:6px;line-height:1.45;">'
          + (an > a1 * 1.06 ? 'Tu as ralenti sur la fin : pars un peu moins vite au premier effort la prochaine fois.' : 'Efforts réguliers du début à la fin : bien géré.') + '</div>';
      }
    }
    return html;
  }

  // ═══ D. PLAN PROGRESSIF ═════════════════════════════════════════════
  var OBJ = {
    '5':  { nom: '5 km',          d: 5000,  longue: [4, 8],   facile: [25, 35], qual: ['minute', 'court400', 'seuil', 'k800', 'pyramide', 'k1000'], sem: [6, 8, 10] },
    '10': { nom: '10 km',         d: 10000, longue: [6, 14],  facile: [30, 45], qual: ['court400', 'seuil', 'k1000', 'tempo', 'k800', 'seuil2', 'pyramide'], sem: [8, 10, 12] },
    '21': { nom: 'Demi-marathon', d: 21097, longue: [10, 19], facile: [35, 50], qual: ['seuil', 'k1000', 'tempo', 'seuil2', 'k800', 'tempo30'], sem: [10, 12] }
  };

  function arr5(x) { return Math.round(x / 5) * 5; }
  function arrDemi(x) { return Math.round(x * 2) / 2; }

  function creerPlan(objId, S, parSem) {
    var O = OBJ[objId]; if (!O) return null;
    var p = predictions();
    var L = p ? p.longue / 1000 : 0;
    var lg0 = Math.max(O.longue[0], Math.min(arrDemi(L * 0.9), O.longue[1] - 3));
    var sem = [];
    for (var w = 1; w <= S; w++) {
      // Pic de volume 2 semaines avant la course, puis affûtage (−15 %) et Jour J.
      var f = S > 3 ? Math.min(1, (w - 1) / (S - 3)) : 1;
      var allege = (w % 4 === 0 && w <= S - 3);
      var k = allege ? 0.8 : (w === S - 1 ? 0.85 : 1);
      var longue = arrDemi((lg0 + (O.longue[1] - lg0) * f) * k);
      var facile = arr5((O.facile[0] + (O.facile[1] - O.facile[0]) * f) * k);
      var tpl = O.qual[(w - 1) % O.qual.length];
      var l;
      if (w === S) {
        // Semaine de course : affûtage puis Jour J
        var cible = p ? Math.round(riegel(p.p5, 5000, O.d) / 60) * 60 : 0;
        l = [
          { type: 'facile', cfg: { mode: 'objectif', kind: 'duree', s: arr5(O.facile[0] * 0.8) * 60 } },
          { type: 'qualite', cfg: { mode: 'fractionne', tpl: 'minute', echauf: true } },
          { type: 'jourj', cfg: { mode: 'objectif', kind: 'distance', m: O.d, t: cible } }
        ];
      } else {
        l = [
          { type: 'facile', cfg: { mode: 'objectif', kind: 'duree', s: facile * 60 } },
          { type: 'qualite', cfg: { mode: 'fractionne', tpl: tpl, echauf: true } }
        ];
        if (parSem >= 4) l.push({ type: 'facile', cfg: { mode: 'objectif', kind: 'duree', s: arr5(facile * 0.8) * 60 } });
        l.push({ type: 'longue', cfg: { mode: 'objectif', kind: 'distance', m: Math.round(longue * 1000), t: 0 } });
      }
      sem.push({ allege: allege, seances: l });
    }
    return { obj: objId, S: S, parSem: parSem, debut: lundi(Date.now()), sem: sem, faites: {} };
  }

  function lePlan() { var p = lire('awakRunPlan', null); return (p && p.sem) ? p : null; }
  function semaineCourante(P) { return Math.max(0, Math.min(P.S - 1, Math.floor((Date.now() - P.debut) / (7 * JOUR)))); }
  function planFini(P) { return Date.now() - P.debut >= P.S * 7 * JOUR; }

  function descSeance(x) {
    var c = x.cfg;
    if (x.type === 'facile') return { t: 'Footing facile ' + Math.round(c.s / 60) + ' min', d: 'Tu dois pouvoir parler en courant.' + (vma() ? ' Vers ' + allure(allureVMA(0.7)) + ' /km.' : ''), c: ACC };
    if (x.type === 'qualite') { var T = TPL[c.tpl] || TPL.minute; return { t: 'Fractionné · ' + T.nom, d: T.desc, c: ROSE }; }
    if (x.type === 'longue') return { t: 'Sortie longue ' + kmTxt(c.m) + ' km', d: 'À allure facile : c\'est l\'endurance qui se construit.', c: VIO };
    return { t: 'Jour J · ' + kmTxt(c.m) + ' km', d: c.t ? 'Objectif réaliste : ' + hms(c.t) + ' (' + allure(c.t / (c.m / 1000)) + ' /km).' : 'Ta course objectif !', c: OR };
  }

  function prochaine(P) {
    var w = semaineCourante(P);
    for (var i = 0; i < P.sem[w].seances.length; i++) if (!P.faites[w + '-' + i]) return { w: w, i: i };
    return null;
  }

  function rendrePlan() {
    var P = lePlan();
    if (!P) {
      // v1241 : version compacte (une ligne + bouton)
      return '<div style="display:flex;align-items:center;gap:10px;margin-top:14px;padding:11px 12px;border-radius:13px;background:rgba(251,191,36,0.05);border:1px solid rgba(251,191,36,0.25);">'
        + '<span style="flex-shrink:0;">' + ico('calendrier', 20, OR) + '</span>'
        + '<span style="flex:1;min-width:0;"><span style="display:block;font-size:0.82em;font-weight:900;color:#fff;">Plan d\'entraînement</span>'
        + '<span style="display:block;font-size:0.68em;color:#94a3b8;line-height:1.35;">Prépare un 5 km, un 10 km ou un demi, semaine après semaine.</span></span>'
        + '<button onclick="AwakCoachRun.creerPlanUI()" style="flex-shrink:0;min-height:auto;padding:9px 12px;border-radius:10px;border:none;cursor:pointer;font-family:inherit;font-weight:900;font-size:0.74em;background:linear-gradient(135deg,#fbbf24,#d97706);color:#1a1205;">Créer</button></div>';
    }
    var O = OBJ[P.obj], w = semaineCourante(P), fini = planFini(P);
    var faitesSem = P.sem[w].seances.filter(function (x, i) { return P.faites[w + '-' + i]; }).length;
    var nx = fini ? null : prochaine(P);
    var points = P.sem[w].seances.map(function (x, i) {
      var f = !!P.faites[w + '-' + i];
      return '<span style="flex:1;height:6px;border-radius:99px;background:' + (f ? OR : 'rgba(255,255,255,0.1)') + ';"></span>';
    }).join('');
    var corps = '<div style="display:flex;align-items:center;gap:8px;">'
      + '<div style="flex:1;min-width:0;"><div style="font-size:0.95em;font-weight:900;color:#fff;">Plan ' + O.nom + '</div>'
      + '<div style="font-size:0.7em;color:#94a3b8;">' + (fini ? 'Plan terminé' : 'Semaine ' + (w + 1) + ' / ' + P.S + (P.sem[w].allege ? ' · semaine allégée' : '') + ' · ' + faitesSem + ' / ' + P.sem[w].seances.length + ' sorties') + '</div></div>'
      + '<button onclick="AwakCoachRun.voirPlan()" style="min-height:auto;padding:6px 10px;border-radius:9px;cursor:pointer;background:transparent;border:1px solid rgba(255,255,255,0.15);color:#cbd5e1;font-size:0.7em;font-weight:800;">Voir</button></div>'
      + '<div style="display:flex;gap:4px;margin:10px 0;">' + points + '</div>';
    if (fini) {
      corps += '<div style="font-size:0.78em;color:#cbd5e1;margin-bottom:10px;">Bravo, tu as mené le plan jusqu\'au bout. Lance un nouveau plan pour continuer à progresser.</div>'
        + bouton('AwakCoachRun.arreterPlan(true)', 'Nouveau plan', true, OR);
    } else if (nx) {
      var D = descSeance(P.sem[nx.w].seances[nx.i]);
      var fr = fraicheur();
      if (fr && fr.r > 1.3 && P.sem[nx.w].seances[nx.i].type === 'qualite') D.d += ' <b style="color:' + OR + ';">Tu es fatigué : décale-la d\'un jour ou fais-la plus doucement.</b>';
      corps += '<div style="border-left:3px solid ' + D.c + ';padding:2px 0 2px 10px;margin-bottom:10px;">'
        + '<div style="font-size:0.6em;color:#64748b;font-weight:900;letter-spacing:1.4px;">PROCHAINE SORTIE</div>'
        + '<div style="font-size:0.88em;font-weight:900;color:#fff;">' + D.t + '</div>'
        + '<div style="font-size:0.7em;color:#94a3b8;line-height:1.45;">' + D.d + '</div></div>'
        + '<div style="display:flex;gap:6px;">' + bouton('AwakCoachRun.lancerPlan(' + nx.w + ',' + nx.i + ')', 'Lancer cette sortie', true, OR)
        + bouton('AwakCoachRun.marquerFait(' + nx.w + ',' + nx.i + ')', 'Déjà faite', false) + '</div>';
    } else {
      corps += '<div style="font-size:0.78em;color:' + OR + ';font-weight:800;">Semaine complète. Repos ou footing libre jusqu\'à lundi.</div>';
    }
    return titre('PLAN D\'ENTRAÎNEMENT', OR) + carte(corps, 'rgba(251,191,36,0.3)');
  }

  // ═══ v1241 · A. CARTE « AUJOURD'HUI » (sortie du plan) ═════════════
  function rendreAujourdhui() {
    var P = lePlan();
    if (!P || planFini(P)) return '';
    var nx = prochaine(P);
    if (!nx) return '';
    var O = OBJ[P.obj], w = nx.w, x = P.sem[w].seances[nx.i], D = descSeance(x);
    var fr = fraicheur();
    if (fr && fr.r > 1.3 && x.type === 'qualite') D.d += ' <b style="color:' + OR + ';">Tu es fatigué : décale-la d\'un jour ou fais-la plus doucement.</b>';
    var points = P.sem[w].seances.map(function (y, i) {
      return '<span style="flex:1;height:5px;border-radius:99px;background:' + (P.faites[w + '-' + i] ? OR : (i === nx.i ? 'rgba(251,191,36,0.4)' : 'rgba(255,255,255,0.1)')) + ';"></span>';
    }).join('');
    var lien = function (on, t, id) { return '<button ' + (id ? 'id="' + id + '" ' : '') + 'onclick="' + on + '" style="min-height:auto;padding:6px 2px;border:none;background:transparent;cursor:pointer;font-family:inherit;font-size:0.74em;font-weight:800;color:#94a3b8;">' + t + '</button>'; };
    return '<div style="padding:14px;border-radius:16px;background:linear-gradient(160deg,rgba(251,191,36,0.1),rgba(251,191,36,0.02));border:1px solid rgba(251,191,36,0.4);">'
      + '<div style="display:flex;align-items:center;gap:8px;"><span style="font-size:0.6em;color:' + OR + ';font-weight:900;letter-spacing:1.4px;flex:1;">AUJOURD\'HUI · PLAN ' + O.nom.toUpperCase() + ' · SEMAINE ' + (w + 1) + ' / ' + P.S + '</span></div>'
      + '<div style="display:flex;gap:4px;margin:8px 0 10px;">' + points + '</div>'
      + '<div style="border-left:3px solid ' + D.c + ';padding-left:10px;">'
      +   '<div style="font-size:1.1em;font-weight:900;color:#fff;">' + D.t + '</div>'
      +   '<div style="font-size:0.74em;color:#cbd5e1;line-height:1.45;margin-top:2px;">' + D.d + '</div></div>'
      + '<button onclick="AwakCoachRun.lancerPlan(' + nx.w + ',' + nx.i + ')" style="width:100%;margin-top:12px;min-height:auto;padding:15px;border:none;border-radius:13px;cursor:pointer;font-family:inherit;font-weight:900;font-size:0.98em;letter-spacing:0.5px;background:linear-gradient(135deg,#fbbf24,#d97706);color:#1a1205;">LANCER CETTE SORTIE</button>'
      + '<div style="display:flex;justify-content:space-between;gap:6px;margin-top:6px;">'
      +   lien('AwakCoachRun.marquerFait(' + nx.w + ',' + nx.i + ')', 'Déjà faite') + lien('AwakCoachRun.voirPlan()', 'Voir le plan') + lien('AwakRun.autre()', 'Autre sortie', 'awakRunAutreLien')
      + '</div></div>';
  }
  // ═══ v1241 · E. FORME CONDENSÉE ═══════════════════════════════════
  function rendreFormeCompacte() {
    if (!courses().length) return '';
    var fr = fraicheur(), p = predictions(), w = semaines(1)[0];
    var cell = function (v, t, c) {
      return '<div style="flex:1;min-width:0;text-align:center;"><div style="font-size:1.05em;font-weight:900;color:' + (c || '#e2e8f0') + ';font-variant-numeric:tabular-nums;">' + v + '</div>'
        + '<div style="font-size:0.56em;color:#64748b;font-weight:800;letter-spacing:0.5px;margin-top:2px;">' + t + '</div></div>';
    };
    return '<div style="font-size:0.6em;letter-spacing:1.6px;color:' + ACC + ';font-weight:900;margin:16px 0 8px;">MA FORME</div>'
      + '<button onclick="AwakRun.formeDetail()" style="display:block;width:100%;text-align:left;min-height:auto;padding:12px;border-radius:14px;cursor:pointer;font-family:inherit;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);color:inherit;">'
      + '<div style="display:flex;gap:6px;align-items:center;">'
      +   cell(fr ? fr.n : '—', 'FRAÎCHEUR', fr ? fr.c : '#64748b')
      +   '<span style="width:1px;align-self:stretch;background:rgba(255,255,255,0.08);"></span>'
      +   cell(p ? hms(p.p10) : '—', '10 KM PRÉDIT')
      +   '<span style="width:1px;align-self:stretch;background:rgba(255,255,255,0.08);"></span>'
      +   cell(Math.round(w.km * 10) / 10 + ' km', 'CETTE SEMAINE') + '</div>'
      + (fr ? '<div style="font-size:0.7em;color:#94a3b8;line-height:1.45;margin-top:9px;">' + fr.t + '</div>' : '')
      + '<div style="font-size:0.72em;color:' + ACC + ';font-weight:800;margin-top:8px;">Prédictions, allures, volume et records ›</div>'
      + '</button>';
  }

  function feuille(id, inner) {
    var old = document.getElementById(id); if (old) old.remove();
    var ov = document.createElement('div');
    ov.id = id;
    ov.style.cssText = 'position:fixed;inset:0;z-index:11700;background:rgba(0,0,0,0.78);display:flex;align-items:flex-end;justify-content:center;';
    ov.onclick = function (e) { if (e.target === ov) ov.remove(); };
    ov.innerHTML = '<div style="width:100%;max-width:480px;max-height:90vh;overflow-y:auto;box-sizing:border-box;background:#0d1117;border:1px solid rgba(251,191,36,0.25);border-radius:20px 20px 0 0;padding:12px 16px calc(18px + env(safe-area-inset-bottom));">'
      + '<div style="width:40px;height:4px;background:rgba(255,255,255,0.15);border-radius:99px;margin:0 auto 12px;"></div>' + inner + '</div>';
    document.body.appendChild(ov);
    return ov;
  }

  var cp = { obj: '10', S: 10, par: 3 };
  function creerPlanUI() {
    var O = OBJ[cp.obj];
    if (O.sem.indexOf(cp.S) < 0) cp.S = O.sem[Math.min(1, O.sem.length - 1)];
    var chip = function (attr, val, txt, on) {
      return '<button data-' + attr + '="' + val + '" style="flex:1;min-width:0;min-height:auto;padding:10px 4px;border-radius:11px;cursor:pointer;font-family:inherit;font-weight:800;font-size:0.78em;'
        + (on ? 'background:rgba(251,191,36,0.14);border:1.5px solid ' + OR + ';color:#fff;' : 'background:rgba(255,255,255,0.03);border:1.5px solid rgba(255,255,255,0.1);color:#94a3b8;') + '">' + txt + '</button>';
    };
    var p = predictions();
    var ov = feuille('awkPlanCreer',
      '<div style="font-size:1.1em;font-weight:900;color:#fff;margin-bottom:4px;">Créer mon plan</div>'
      + '<div style="font-size:0.72em;color:#94a3b8;margin-bottom:6px;">' + (p ? 'Le plan part de ton niveau actuel (plus longue sortie : ' + kmTxt(p.longue) + ' km).' : 'Le plan démarre doucement. Il s\'ajustera dès tes premières sorties.') + '</div>'
      + titre('OBJECTIF') + '<div style="display:flex;gap:6px;">' + Object.keys(OBJ).map(function (k) { return chip('o', k, OBJ[k].nom, cp.obj === k); }).join('') + '</div>'
      + titre('DURÉE') + '<div style="display:flex;gap:6px;">' + O.sem.map(function (s) { return chip('s', s, s + ' semaines', cp.S === s); }).join('') + '</div>'
      + titre('SORTIES PAR SEMAINE') + '<div style="display:flex;gap:6px;">' + chip('p', 3, '3 sorties', cp.par === 3) + chip('p', 4, '4 sorties', cp.par === 4) + '</div>'
      + '<div style="font-size:0.68em;color:#64748b;line-height:1.5;margin:12px 0;">Chaque semaine : un footing facile, une séance de qualité (fractionné ou seuil) et une sortie longue' + (cp.par === 4 ? ', plus un 2e footing' : '') + '. Une semaine sur 4 est allégée pour assimiler.</div>'
      + '<div style="display:flex;gap:8px;">' + bouton("document.getElementById('awkPlanCreer').remove()", 'Annuler', false) + '<span style="flex:1;display:flex;"><button id="awkPlanGo" style="flex:1;min-height:auto;padding:12px;border-radius:12px;border:none;cursor:pointer;font-family:inherit;font-weight:900;font-size:0.85em;background:linear-gradient(135deg,#fbbf24,#d97706);color:#1a1205;">Créer le plan</button></span></div>');
    ov.querySelectorAll('[data-o]').forEach(function (b) { b.onclick = function () { cp.obj = b.getAttribute('data-o'); creerPlanUI(); }; });
    ov.querySelectorAll('[data-s]').forEach(function (b) { b.onclick = function () { cp.S = +b.getAttribute('data-s'); creerPlanUI(); }; });
    ov.querySelectorAll('[data-p]').forEach(function (b) { b.onclick = function () { cp.par = +b.getAttribute('data-p'); creerPlanUI(); }; });
    document.getElementById('awkPlanGo').onclick = function () {
      ecrire('awakRunPlan', creerPlan(cp.obj, cp.S, cp.par));
      ov.remove();
      try { if (typeof showToast === 'function') showToast('Plan ' + OBJ[cp.obj].nom + ' créé : ' + cp.S + ' semaines', 'success', 2600); } catch (e) {}
      rafraichirAccueil();
    };
  }

  function voirPlan() {
    var P = lePlan(); if (!P) return;
    var w0 = semaineCourante(P);
    var html = '<div style="font-size:1.1em;font-weight:900;color:#fff;margin-bottom:2px;">Plan ' + OBJ[P.obj].nom + '</div>'
      + '<div style="font-size:0.72em;color:#94a3b8;margin-bottom:8px;">' + P.S + ' semaines · ' + P.parSem + ' sorties par semaine</div>'
      + P.sem.map(function (S, w) {
          var cur = w === w0;
          return '<div style="margin-top:10px;padding:10px 12px;border-radius:12px;background:' + (cur ? 'rgba(251,191,36,0.06)' : 'rgba(255,255,255,0.02)') + ';border:1px solid ' + (cur ? 'rgba(251,191,36,0.35)' : 'rgba(255,255,255,0.06)') + ';">'
            + '<div style="font-size:0.66em;font-weight:900;letter-spacing:1.2px;color:' + (cur ? OR : '#64748b') + ';margin-bottom:5px;">SEMAINE ' + (w + 1) + (S.allege ? ' · ALLÉGÉE' : '') + (w === P.S - 1 ? ' · COURSE' : '') + (cur ? ' · EN COURS' : '') + '</div>'
            + S.seances.map(function (x, i) {
                var D = descSeance(x), f = !!P.faites[w + '-' + i];
                return '<div style="display:flex;align-items:center;gap:8px;padding:4px 0;font-size:0.76em;">'
                  + '<span style="flex-shrink:0;width:16px;height:16px;border-radius:5px;display:flex;align-items:center;justify-content:center;' + (f ? 'background:' + OR + ';' : 'border:1.5px solid rgba(255,255,255,0.2);') + '">'
                  + (f ? '<svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="#1a1205" stroke-width="3.5" stroke-linecap="round"><path d="M5 12l5 5 9-10"/></svg>' : '') + '</span>'
                  + '<span style="width:3px;height:14px;border-radius:2px;background:' + D.c + ';flex-shrink:0;"></span>'
                  + '<span style="flex:1;color:' + (f ? '#64748b' : '#e2e8f0') + ';">' + D.t + '</span></div>';
              }).join('') + '</div>';
        }).join('')
      + '<button onclick="AwakCoachRun.arreterPlan()" style="width:100%;margin-top:14px;min-height:auto;padding:11px;border-radius:12px;cursor:pointer;background:rgba(239,68,68,0.07);border:1px solid rgba(239,68,68,0.3);color:#fca5a5;font-weight:800;font-size:0.8em;">Arrêter le plan</button>';
    feuille('awkPlanVoir', html);
  }

  function arreterPlan(direct) {
    var go = function () {
      try { localStorage.removeItem(cle('awakRunPlan')); } catch (e) {}
      var v = document.getElementById('awkPlanVoir'); if (v) v.remove();
      rafraichirAccueil();
      if (direct) creerPlanUI();
    };
    if (direct) { go(); return; }
    if (typeof showConfirm === 'function') showConfirm('Ton plan et la progression cochée seront effacés. Tes sorties restent dans l\'historique.', go, null, { title: 'Arrêter le plan ?', confirmLabel: 'Arrêter', cancelLabel: 'Garder' });
    else go();
  }

  function marquerFait(w, i) {
    var P = lePlan(); if (!P) return;
    P.faites[w + '-' + i] = true; ecrire('awakRunPlan', P);
    rafraichirAccueil();
  }

  function lancerPlan(w, i) {
    var P = lePlan(); if (!P || !P.sem[w] || !P.sem[w].seances[i]) return;
    var x = P.sem[w].seances[i];
    var cfg = JSON.parse(JSON.stringify(x.cfg));
    cfg.plan = { w: w, i: i };
    sel.plan = cfg;
    if (window.AwakRun && AwakRun.lancer) AwakRun.lancer('course', cfg);
    sel.plan = null;
  }

  function rafraichirAccueil() {
    // v1241 : la carte « Aujourd'hui » dépend du plan → on redessine tout l'onglet
    if (document.getElementById('awakRunOnglet') && window.AwakRun && AwakRun.rendreOnglet) { try { AwakRun.rendreOnglet(); return; } catch (e) {} }
    var h = document.getElementById('awakRunPlanHote');
    if (h) h.innerHTML = rendrePlan();
  }

  // Après l'enregistrement d'une sortie : cocher la séance du plan
  function apresSortie(s) {
    try {
      var b = s && s.coach;
      if (!b || !b.plan) return;
      var P = lePlan(); if (!P) return;
      P.faites[b.plan.w + '-' + b.plan.i] = s.id;
      ecrire('awakRunPlan', P);
    } catch (e) {}
  }

  // Coach créé au départ : libellé du plan si la sortie vient du plan
  function creerAvecPlan(cfg) {
    var C = creer(cfg);
    if (C && cfg && cfg.plan) {
      var P = lePlan();
      if (P && P.sem[cfg.plan.w]) C.planTxt = 'PLAN ' + OBJ[P.obj].nom.toUpperCase() + ' · SEMAINE ' + (cfg.plan.w + 1);
    }
    return C;
  }

  function passer() {
    var R = window.AwakRun && AwakRun._test && AwakRun._test.etat ? AwakRun._test.etat() : null;
    var C = R && R.coach;
    if (!C || C.cfg.mode !== 'fractionne' || C.fini) return;
    var x = { t: AwakRun._duree ? AwakRun._duree() : 0, d: R.distance };
    var P = C.ph[C.i];
    if (P && P.type === 'effort') C.res.push({ d: Math.round(x.d - C.d0), t: Math.round(x.t - C.t0), passe: true });
    debutPhase(C, x);
  }

  // ═══ I. ANNONCES VOCALES ET PAUSE AUTO (préférences) ═══════════════
  var PREFS_DEF = { freq: '1000', c: { seg: true, moy: true, temps: false, reste: true }, autoPause: true };
  function prefs() {
    var p = lire('awakRunPrefs', null) || {};
    return { freq: p.freq || PREFS_DEF.freq, c: Object.assign({}, PREFS_DEF.c, p.c || {}), autoPause: p.autoPause !== false };
  }
  var FREQS = [['500', '500 m'], ['1000', '1 km'], ['2000', '2 km'], ['t300', '5 min'], ['t600', '10 min'], ['off', 'Silence']];
  function pasAnnonce(P) { return /^\d+$/.test(P.freq) ? { d: +P.freq } : (P.freq.charAt(0) === 't' ? { t: +P.freq.slice(1) } : {}); }

  function reglagesUI() {
    var P = prefs();
    var chip = function (attr, val, txt, on) {
      return '<button data-' + attr + '="' + val + '" style="min-height:auto;padding:9px 4px;border-radius:11px;cursor:pointer;font-family:inherit;font-weight:800;font-size:0.76em;'
        + (on ? 'background:rgba(34,211,238,0.14);border:1.5px solid ' + ACC + ';color:#fff;' : 'background:rgba(255,255,255,0.03);border:1.5px solid rgba(255,255,255,0.1);color:#94a3b8;') + '">' + txt + '</button>';
    };
    var bascule = function (id, txt, on, aide) {
      return '<label style="display:flex;align-items:center;gap:10px;padding:9px 0;border-top:1px solid rgba(255,255,255,0.05);cursor:pointer;">'
        + '<span style="flex:1;min-width:0;"><span style="display:block;font-size:0.8em;color:#e2e8f0;font-weight:700;">' + txt + '</span>'
        + (aide ? '<span style="display:block;font-size:0.66em;color:#64748b;margin-top:1px;">' + aide + '</span>' : '') + '</span>'
        + '<input type="checkbox" data-c="' + id + '" ' + (on ? 'checked' : '') + ' style="width:20px;height:20px;accent-color:#22d3ee;"></label>';
    };
    var ov = feuille('awkRunPrefs',
      '<div style="font-size:1.1em;font-weight:900;color:#fff;margin-bottom:2px;">Voix et pause auto</div>'
      + '<div style="font-size:0.72em;color:#94a3b8;">Les alertes du coach (objectif, fractionné, contre moi) parlent toujours.</div>'
      + titre('ANNONCE TOUS LES')
      + '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;">' + FREQS.map(function (f) { return chip('f', f[0], f[1], P.freq === f[0]); }).join('') + '</div>'
      + titre('CE QUE LA VOIX DIT')
      + bascule('seg', 'Allure du dernier segment', P.c.seg, 'ex. « dernier kilomètre en 5:02 »')
      + bascule('moy', 'Allure moyenne', P.c.moy)
      + bascule('temps', 'Temps total', P.c.temps)
      + bascule('reste', 'Distance restante', P.c.reste, 'quand un objectif de distance est fixé')
      + titre('PAUSE AUTOMATIQUE')
      + bascule('autoPause', 'Arrêter le chrono quand je m\'arrête', P.autoPause, 'Feu rouge, lacet : le chrono reprend tout seul quand tu repars.')
      + '<button id="awkPrefsOk" style="width:100%;margin-top:14px;min-height:auto;padding:13px;border-radius:12px;border:none;cursor:pointer;font-family:inherit;font-weight:900;font-size:0.88em;background:linear-gradient(135deg,#22d3ee,#0891b2);color:#04121f;">OK</button>');
    ov.querySelectorAll('[data-f]').forEach(function (b) {
      b.onclick = function () { var x = prefs(); x.freq = b.getAttribute('data-f'); ecrire('awakRunPrefs', x); reglagesUI(); };
    });
    ov.querySelectorAll('[data-c]').forEach(function (i) {
      i.onchange = function () {
        var x = prefs(), k = i.getAttribute('data-c');
        if (k === 'autoPause') x.autoPause = i.checked; else x.c[k] = i.checked;
        ecrire('awakRunPrefs', x);
      };
    });
    document.getElementById('awkPrefsOk').onclick = function () {
      ov.remove();
      if (document.getElementById('awakRunCoachChoix')) rendreChoix('awakRunCoachChoix');
    };
  }

  // Texte de l'annonce périodique. info = { d, t, segD, segT, parTemps }
  function texteAnnonce(R, info) {
    var P = R.prefs || prefs(), out = [];
    out.push(info.parTemps ? voixT(info.t) : (info.d % 1000 === 0 ? 'Kilomètre ' + (info.d / 1000) : voixKm(info.d)));
    if (info.parTemps) out.push(voixKm(info.d));
    if (P.c.seg && info.segD > 50) {
      var segA = info.segT / (info.segD / 1000);
      out.push(info.segD >= 990 && info.segD <= 1010 && !info.parTemps ? 'Dernier kilomètre en ' + voixT(info.segT) : 'Allure du segment : ' + voixT(segA) + ' au kilomètre');
    }
    if (P.c.moy && info.d > 50) out.push('Moyenne ' + voixT(info.t / (info.d / 1000)));
    if (P.c.temps && !info.parTemps) out.push('Temps ' + voixT(info.t));
    var C = R.coach;
    if (P.c.reste && C && C.cfg.mode === 'objectif' && C.cfg.kind === 'distance' && !C.fini && C.cfg.m > info.d) out.push('Encore ' + voixKm(C.cfg.m - info.d));
    return out.join('. ') + '.';
  }

  // ═══ O. FRAÎCHEUR / FATIGUE (charge 7 j vs 28 j) ═══════════════════
  // Charge d'une sortie ≈ heures × intensité² × 100 (intensité = vitesse / vitesse seuil).
  function charge(s, vSeuil) {
    if (!s || !s.duree || !s.distance) return 0;
    var h = s.duree / 3600, v = (s.distance / 1000) / h;
    var f = s.type === 'course' ? 1 : (s.type === 'velo' ? 0.45 : 0.5);
    var IF = s.type !== 'course' ? 0.65 : (vSeuil ? Math.min(1.25, v / vSeuil) : 0.8);
    return h * IF * IF * 100 * f;
  }
  function fraicheur() {
    var l = sorties(), v = vma(), vS = v ? v * 0.85 : 0, now = Date.now();
    var a7 = 0, c28 = 0, n28 = 0, jours = {};
    l.forEach(function (s) {
      var t = new Date(s.date).getTime(), age = now - t;
      if (age < 0 || age > 28 * JOUR) return;
      var c = charge(s, vS);
      c28 += c; n28++;
      if (age <= 7 * JOUR) a7 += c;
      jours[new Date(t).toDateString()] = 1;
    });
    if (n28 < 3 || c28 < 40) return null;
    var chronique = c28 / 4, r = chronique ? a7 / chronique : 0;
    var suite = 0;
    for (var i = 0; i < 7; i++) { if (jours[new Date(now - i * JOUR).toDateString()]) suite++; else if (i > 0) break; }
    var e;
    if (r > 1.5) e = { n: 'Risque', c: ROUGE, t: 'Tu en fais beaucoup plus que d\'habitude. Prends un jour de repos ou un footing très léger.' };
    else if (r > 1.3) e = { n: 'Fatigué', c: OR, t: 'Charge en hausse : garde tes prochaines sorties faciles.' };
    else if (r >= 0.8) e = { n: 'En forme', c: ACC, t: 'Charge bien dosée : c\'est la zone où l\'on progresse.' };
    else e = { n: 'Frais', c: VIO, t: 'Tu es reposé : bon moment pour une séance de qualité ou un test.' };
    if (suite >= 4 && r >= 0.8) e.t += ' ' + suite + ' jours de course d\'affilée : un jour de repos te fera du bien.';
    e.r = r; e.a7 = a7; e.ch = chronique;
    return e;
  }
  function rendreFraicheur() {
    var e = fraicheur();
    if (!e) return '';
    var pos = Math.max(0, Math.min(100, (e.r - 0.5) / 1.3 * 100));
    return '<div style="margin-bottom:10px;padding:11px 12px;border-radius:12px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);">'
      + '<div style="display:flex;align-items:baseline;gap:8px;"><span style="font-size:0.6em;color:#64748b;font-weight:900;letter-spacing:1.4px;flex:1;">FRAÎCHEUR</span>'
      + '<span style="font-size:0.95em;font-weight:900;color:' + e.c + ';">' + e.n + '</span></div>'
      + '<div style="position:relative;height:6px;margin:8px 0 7px;">'
      + '<span style="position:absolute;inset:0;border-radius:99px;background:linear-gradient(90deg,' + VIO + ' 0%,' + ACC + ' 23%,' + ACC + ' 62%,' + OR + ' 62%,' + OR + ' 77%,' + ROUGE + ' 77%);opacity:0.7;"></span>'
      + '<span style="position:absolute;top:-5px;left:calc(' + pos.toFixed(0) + '% - 8px);width:16px;height:16px;border-radius:50%;background:' + e.c + ';border:3px solid #f8fafc;box-sizing:border-box;"></span></div>'
      + '<div style="font-size:0.7em;color:#cbd5e1;line-height:1.45;">' + e.t + '</div></div>';
  }

  // ═══ G. RÉSUMÉ ENRICHI ═════════════════════════════════════════════
  function allureMoy(s) { return s && s.distance > 50 ? s.duree / (s.distance / 1000) : 0; }
  function courbe(s) {
    var p = s.prof;
    if (!p || p.length < 5) return '';
    var pts = [[0, 0]].concat(p), seg = [];
    for (var i = 1; i < pts.length; i++) {
      var dd = pts[i][0] - pts[i - 1][0], dt = pts[i][1] - pts[i - 1][1];
      if (dd > 0 && dt > 0) seg.push({ d: pts[i][0], a: dt / (dd / 1000) });
    }
    if (seg.length < 4) return '';
    // lissage : médiane sur 5 points (écarte les à-coups du GPS et des reprises)
    var lis = seg.map(function (x, i) {
      var a = seg.slice(Math.max(0, i - 2), i + 3).map(function (y) { return y.a; }).sort(function (u, v) { return u - v; });
      return { d: x.d, a: a[Math.floor(a.length / 2)] };
    });
    var as = lis.map(function (x) { return x.a; }).sort(function (a, b) { return a - b; });
    var lo = as[Math.floor(as.length * 0.05)], hi = as[Math.floor(as.length * 0.95)];
    if (hi - lo < 20) { var m = (hi + lo) / 2; lo = m - 10; hi = m + 10; }
    var W = 340, H = 120, D = lis[lis.length - 1].d;
    var y = function (a) { return 8 + (Math.min(hi, Math.max(lo, a)) - lo) / (hi - lo) * (H - 22); };   // plus rapide = en haut
    var x = function (d) { return 4 + d / D * (W - 8); };
    var path = lis.map(function (q, i) { return (i ? 'L' : 'M') + x(q.d).toFixed(1) + ' ' + y(q.a).toFixed(1); }).join(' ');
    var moy = allureMoy(s);
    return titre('ALLURE PENDANT LA SORTIE')
      + '<svg viewBox="0 0 ' + W + ' ' + H + '" style="width:100%;height:' + H + 'px;display:block;">'
      + '<path d="' + path + ' L' + x(D).toFixed(1) + ' ' + (H - 14) + ' L4 ' + (H - 14) + ' Z" fill="rgba(34,211,238,0.12)"/>'
      + '<path d="' + path + '" fill="none" stroke="' + ACC + '" stroke-width="2.2" stroke-linejoin="round"/>'
      + (moy ? '<line x1="4" x2="' + (W - 4) + '" y1="' + y(moy).toFixed(1) + '" y2="' + y(moy).toFixed(1) + '" stroke="' + OR + '" stroke-width="1" stroke-dasharray="4 4"/>'
             + '<text x="' + (W - 6) + '" y="' + (y(moy) - 4).toFixed(1) + '" fill="' + OR + '" font-size="10" text-anchor="end" font-weight="800">moy. ' + allure(moy) + '</text>' : '')
      + '<text x="4" y="' + (H - 2) + '" fill="#64748b" font-size="10" font-weight="800">0</text>'
      + '<text x="' + (W - 4) + '" y="' + (H - 2) + '" fill="#64748b" font-size="10" text-anchor="end" font-weight="800">' + kmTxt(D) + ' km</text>'
      + '<text x="6" y="16" fill="#64748b" font-size="9" font-weight="800">plus rapide</text>'
      + '</svg>';
  }
  function comparaisons(s, liste) {
    var out = [];
    var avant = liste.filter(function (x) { return x.type === s.type && x.id !== s.id && new Date(x.date) < new Date(s.date) && x.distance >= 1000; }).slice(0, 4);
    var a = allureMoy(s);
    if (avant.length >= 2 && a) {
      var dd = avant.reduce(function (m, x) { return m + x.distance; }, 0), tt = avant.reduce(function (m, x) { return m + x.duree; }, 0);
      var ref = tt / (dd / 1000), e = Math.round(ref - a);
      out.push(Math.abs(e) < 3 ? 'Allure dans ta moyenne récente (' + allure(ref) + ' /km).'
        : '<b style="color:' + (e > 0 ? ACC : '#cbd5e1') + ';">' + Math.abs(e) + ' s/km ' + (e > 0 ? 'plus rapide' : 'plus lent') + '</b> que tes ' + avant.length + ' dernières sorties (' + allure(ref) + ' /km).');
    }
    // Split négatif : 2e moitié plus rapide que la 1re
    var p = s.prof;
    if (p && p.length >= 10 && s.distance >= 2000) {
      var prof = [[0, 0]].concat(p), mi = tempsA(prof, s.distance / 2), fin = tempsA(prof, Math.min(s.distance, p[p.length - 1][0]));
      if (mi != null && fin != null) {
        var d2 = p[p.length - 1][0] - s.distance / 2, t1 = mi, t2 = fin - mi;
        var a1 = t1 / (s.distance / 2000), a2 = d2 > 0 ? t2 / (d2 / 1000) : 0;
        if (a2 && a2 < a1 * 0.99) out.push('<b style="color:' + OR + ';">Split négatif</b> : 2e moitié plus rapide (' + allure(a2) + ' contre ' + allure(a1) + ' /km). C\'est la marque d\'une course bien gérée.');
        else if (a2 && a2 > a1 * 1.06) out.push('Tu as ralenti en 2e moitié (' + allure(a1) + ' puis ' + allure(a2) + ' /km) : pars un peu plus doucement la prochaine fois.');
      }
    }
    return out;
  }

  // ═══ L. PARCOURS RECONNUS ══════════════════════════════════════════
  function pt(p) { return p ? { lat: p[0], lon: p[1] } : null; }
  function distM(a, b) {
    var r = function (d) { return d * Math.PI / 180; };
    var dLat = r(b.lat - a.lat), dLon = r(b.lon - a.lon);
    var h = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return 6371000 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  }
  function memeParcours(a, b) {
    if (!a || !b || a.type !== b.type || !(a.points || []).length || !(b.points || []).length) return false;
    if (Math.abs(a.distance - b.distance) > Math.max(250, a.distance * 0.08)) return false;
    var pa = a.points, pb = b.points;
    var p = [[pt(pa[0]), pt(pb[0])], [pt(pa[pa.length - 1]), pt(pb[pb.length - 1])],
             [pt(pa[Math.floor(pa.length / 2)]), pt(pb[Math.floor(pb.length / 2)])],
             [pt(pa[Math.floor(pa.length / 4)]), pt(pb[Math.floor(pb.length / 4)])]];
    return p.every(function (x, i) { return x[0] && x[1] && distM(x[0], x[1]) < (i < 2 ? 150 : 250); });
  }
  function parcours(s) {
    var l = sorties().filter(function (x) { return memeParcours(s, x); });
    if (l.length < 2) return null;
    l.sort(function (a, b) { return a.duree - b.duree; });
    var rang = l.findIndex(function (x) { return x.id === s.id; }) + 1;
    return { n: l.length, record: l[0], rang: rang };
  }
  function rendreParcours(s) {
    var P = parcours(s);
    if (!P) return '';
    var estRecord = P.record.id === s.id;
    return '<div style="margin-top:10px;padding:11px 12px;border-radius:12px;background:rgba(167,139,250,0.07);border:1px solid rgba(167,139,250,0.3);">'
      + '<div style="font-size:0.6em;color:' + VIO + ';font-weight:900;letter-spacing:1.4px;">PARCOURS RECONNU · ' + P.n + (P.n > 1 ? 'E' : 'RE') + ' FOIS</div>'
      + '<div style="font-size:0.82em;color:#e2e8f0;font-weight:800;margin-top:3px;">'
      + (estRecord ? 'Nouveau record sur ce parcours !' : P.rang + (P.rang === 1 ? 'er' : 'e') + ' meilleur temps sur ' + P.n + ' · record ' + hms(P.record.duree)) + '</div>'
      + (estRecord ? '' : '<button onclick="AwakCoachRun.contre(' + P.record.id + ')" style="margin-top:8px;min-height:auto;padding:8px 12px;border-radius:10px;cursor:pointer;font-family:inherit;font-weight:800;font-size:0.74em;background:rgba(167,139,250,0.14);border:1px solid ' + VIO + ';color:#ede9fe;">Courir contre mon record ici</button>')
      + '</div>';
  }
  function contre(id) {
    ['awakRunDetail', 'awakRunHome'].forEach(function (k) { var e = document.getElementById(k); if (e) e.remove(); });
    if (window.AwakRun && AwakRun.lancer) AwakRun.lancer('course', { mode: 'fantome', id: id });
  }

  // ═══ K. POULS DE LA MONTRE ════════════════════════════════════════
  function fcMaxTheo() {
    try { var a = +(getUserProfile() || {}).age; if (a > 10 && a < 100) return Math.round(208 - 0.7 * a); } catch (e) {}
    return 0;
  }
  var ZONES = [['Z1', 'Récup.', 0.6, '#64748b'], ['Z2', 'Endurance', 0.7, ACC], ['Z3', 'Tempo', 0.8, VIO], ['Z4', 'Seuil', 0.9, OR], ['Z5', 'VMA', 9, ROSE]];
  function analyserPouls(ech, fcMax) {
    if (!ech || ech.length < 5) return null;
    ech.sort(function (a, b) { return a.t - b.t; });
    var z = [0, 0, 0, 0, 0], som = 0, n = 0, max = 0;
    for (var i = 0; i < ech.length; i++) {
      var v = ech[i].v, dt = i < ech.length - 1 ? Math.min(30, (ech[i + 1].t - ech[i].t) / 1000) : 5;
      som += v; n++; if (v > max) max = v;
      var k = 0; while (k < 4 && v >= fcMax * ZONES[k][2]) k++;
      z[k] += Math.max(0, dt);
    }
    return { moy: Math.round(som / n), max: max, zones: z.map(Math.round), fcMax: fcMax };
  }
  function poulsApres(s) {
    var S = window.AwakSante;
    if (!s || !S || !S.connecte || !S.connecte() || !S.pouls) return;
    var debut = new Date(s.date).getTime(), fin = debut + (s.dureeTotale || s.duree) * 1000 + 60000;
    var essai = function (n) {
      S.pouls(debut, fin).then(function (ech) {
        var l = sorties(), i = l.findIndex(function (x) { return x.id === s.id; });
        if (i < 0) return;
        var fm = Math.max(fcMaxTheo() || 0, Math.max.apply(null, l.map(function (x) { return x.fc ? x.fc.max : 0; }).concat([0])));
        var r = analyserPouls(ech, fm || 190);
        if (!r) { if (n < 3) setTimeout(function () { essai(n + 1); }, 45000); return; }
        if (r.max > r.fcMax) r.fcMax = r.max;
        l[i].fc = r;
        try { localStorage.setItem(cle('awakRuns'), JSON.stringify(l.slice(0, 100))); } catch (e) {}
        var h = document.getElementById('awakRunPouls');
        if (h) h.outerHTML = rendrePouls(l[i]);
      });
    };
    essai(0);
  }
  function rendrePouls(s) {
    var S = window.AwakSante;
    if (!s.fc) {
      return (S && S.connecte && S.connecte())
        ? '<div id="awakRunPouls" style="font-size:0.7em;color:#64748b;margin-top:10px;">Pouls de la montre : en attente de synchronisation…</div>'
        : '<div id="awakRunPouls"></div>';
    }
    var f = s.fc, tot = f.zones.reduce(function (a, b) { return a + b; }, 0) || 1;
    return '<div id="awakRunPouls">' + titre('POULS (MONTRE)', ROSE)
      + '<div style="display:flex;gap:6px;margin-bottom:9px;">'
      + '<div style="flex:1;text-align:center;padding:8px;border-radius:11px;background:rgba(244,114,182,0.07);border:1px solid rgba(244,114,182,0.25);"><div style="font-size:1.1em;font-weight:900;color:#fbcfe8;">' + f.moy + '</div><div style="font-size:0.56em;color:#64748b;font-weight:800;">MOYEN</div></div>'
      + '<div style="flex:1;text-align:center;padding:8px;border-radius:11px;background:rgba(244,114,182,0.07);border:1px solid rgba(244,114,182,0.25);"><div style="font-size:1.1em;font-weight:900;color:#fbcfe8;">' + f.max + '</div><div style="font-size:0.56em;color:#64748b;font-weight:800;">MAX</div></div></div>'
      + ZONES.map(function (Z, i) {
          var pc = f.zones[i] / tot * 100;
          return '<div style="display:flex;align-items:center;gap:8px;font-size:0.7em;margin-bottom:4px;">'
            + '<span style="width:92px;color:#94a3b8;font-weight:800;">' + Z[0] + ' · ' + Z[1] + '</span>'
            + '<span style="flex:1;height:10px;border-radius:5px;background:rgba(255,255,255,0.05);overflow:hidden;"><span style="display:block;height:100%;width:' + pc.toFixed(1) + '%;background:' + Z[3] + ';"></span></span>'
            + '<span style="width:40px;text-align:right;color:#e2e8f0;font-weight:800;">' + (f.zones[i] >= 60 ? Math.round(f.zones[i] / 60) + ' min' : f.zones[i] + ' s') + '</span></div>';
        }).join('')
      + '<div style="font-size:0.62em;color:#475569;margin-top:4px;">Zones calculées sur un pouls max de ' + f.fcMax + '.</div></div>';
  }

  // Tout ce qui s'ajoute au résumé d'une sortie (après le bilan du coach)
  function rendreAnalyse(s) {
    var l = sorties();
    var comp = comparaisons(s, l);
    return rendreParcours(s)
      + (comp.length ? '<div style="margin-top:10px;font-size:0.74em;color:#cbd5e1;line-height:1.55;">' + comp.map(function (x) { return '<div style="margin-bottom:4px;">' + x + '</div>'; }).join('') + '</div>' : '')
      + courbe(s)
      + rendrePouls(s);
  }

  window.AwakCoachRun = {
    rendreChoix: rendreChoix, config: config, creer: creerAvecPlan, tick: tick, bilan: bilan, rendreBilan: rendreBilan,
    rendreForme: rendreForme, rendrePlan: rendrePlan, apresSortie: apresSortie,
    creerPlanUI: creerPlanUI, voirPlan: voirPlan, arreterPlan: arreterPlan, marquerFait: marquerFait, lancerPlan: lancerPlan,
    passer: passer, predictions: predictions, vma: vma,
    prefs: prefs, pasAnnonce: pasAnnonce, texteAnnonce: texteAnnonce, reglagesUI: reglagesUI,
    rendreAnalyse: rendreAnalyse, poulsApres: poulsApres, contre: contre, fraicheur: fraicheur,
    rendreAujourdhui: rendreAujourdhui, rendreFormeCompacte: rendreFormeCompacte, feuille: feuille,
    _test: { creerPlan: creerPlan, phasesDe: phasesDe, riegel: riegel, profilFantome: profilFantome, tempsA: tempsA, sel: sel }
  };
})();
