/* ═══════════════════════════════════════════════════════════════════
   MON DÉFI (v1310) — un objectif chiffré, un programme sur mesure
   ─────────────────────────────────────────────────────────────────────
   Onglet Progrès, sous « Ta progression ». Un seul défi actif par profil.
   • Charge : « 150 lb au développé couché ». Point de départ = charge
     maximale estimée (Epley) d'après l'historique, ou une série saisie.
     Séances en rotation A (lourd 5×3 à 85 %), B (volume 4×6 à 75 %),
     C (technique 3×8 à 70 %), semaine légère 1 semaine sur 4 (3×5 à 65 %),
     + 2 exercices d'appoint pour les muscles qui aident le mouvement
     (filtrés par le matériel, les limitations et les douleurs).
     Barre de progression et date d'arrivée estimée, recalculées à chaque
     séance (gain observé, sinon rythme typique selon le niveau).
   • Course : distance + temps visé → plan de l'onglet Course (run-coach.js)
     avec ce temps pour le Jour J. Comparé au temps prédit par les sorties.
   Objectif très loin du niveau actuel → un palier intermédiaire est proposé.
   Profil enfant : pas de défi chiffré (pas de charges ni de chrono visés).
   Stockage : _cleProfil('awakMonDefi'). Aucun emoji (AwakIcon).
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var CLE = 'awakMonDefi';
  var BLEU = '#60a8f0', CLAIR = '#93c5fd', OR = '#fbbf24', ACC = '#22d3ee';
  var JOUR = 864e5, SEM = 7 * JOUR;

  var LEVEES = [
    { cle: 'bench', nom: 'Développé couché', exos: ['Développé couché barre', 'Développé couché haltères'], appui: ['Triceps', 'Épaules', 'Pectoraux'] },
    { cle: 'squat', nom: 'Squat', exos: ['Squat barre haut'], appui: ['Fessiers', 'Ischio-jambiers', 'Abdominaux'] },
    { cle: 'deadlift', nom: 'Soulevé de terre', exos: ['Soulevé de terre'], appui: ['Dos', 'Ischio-jambiers', 'Fessiers'] },
    { cle: 'ohp', nom: 'Développé militaire', exos: ['Overhead Press barre', 'Développé militaire haltères'], appui: ['Triceps', 'Épaules', 'Trapèzes'] }
  ];
  var SCHEMAS = [
    { id: 'A', nom: 'Lourd', series: 5, reps: 3, pct: 0.85, repos: 180 },
    { id: 'B', nom: 'Volume', series: 4, reps: 6, pct: 0.75, repos: 150 },
    { id: 'C', nom: 'Technique', series: 3, reps: 8, pct: 0.70, repos: 120 }
  ];
  var LEGER = { id: 'L', nom: 'Semaine légère', series: 3, reps: 5, pct: 0.65, repos: 120 };
  var COURSES = [
    { id: '5', nom: '5 km', d: 5000 }, { id: '10', nom: '10 km', d: 10000 },
    { id: '21', nom: 'Demi-marathon', d: 21097 }, { id: '42', nom: 'Marathon', d: 42195 }
  ];

  // ── utilitaires ──
  function ico(n, t, c) { try { return window.AwakIcon ? AwakIcon.get(n, t || 18, c || CLAIR) : ''; } catch (e) { return ''; } }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function toast(m, t) { try { if (typeof showToast === 'function') showToast(m, t || 'info', 3000); } catch (e) {} }
  function enfant() { try { return !!(window.AwakYouth && AwakYouth.isChild && AwakYouth.isChild()); } catch (e) { return false; } }
  function cleE() { try { return window._cleProfil ? window._cleProfil(CLE) : CLE; } catch (e) { return CLE; } }
  function cleL() { try { return window._cleProfilLecture ? window._cleProfilLecture(CLE) : CLE; } catch (e) { return CLE; } }
  function lire() { try { var v = JSON.parse(localStorage.getItem(cleL()) || 'null'); return v && v.type ? v : null; } catch (e) { return null; } }
  function ecrire(d) { try { if (d) localStorage.setItem(cleE(), JSON.stringify(d)); else localStorage.removeItem(cleE()); } catch (e) {} }
  function kg() { try { return localStorage.getItem('fitproUseKg') === 'true'; } catch (e) { return false; } }
  function unite() { return kg() ? 'kg' : 'lb'; }
  function versAff(k) { return kg() ? k : k * 2.20462; }          // kg → unité affichée
  function versKg(v) { return kg() ? v : v / 2.20462; }
  function arrAff(v) { var pas = kg() ? 2.5 : 5; return Math.round(v / pas) * pas; }
  function txtCharge(k) { return Math.round(versAff(k)) + ' ' + unite(); }
  function dateTxt(t) { return new Date(t).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' }); }
  function hms(s) {
    s = Math.max(0, Math.round(s));
    var h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60;
    return (h ? h + ' h ' + String(m).padStart(2, '0') : m + ' min') + (x ? ' ' + String(x).padStart(2, '0') + ' s' : '');
  }
  function profil() { try { return typeof getUserProfile === 'function' ? (getUserProfile() || {}) : {}; } catch (e) { return {}; } }
  function db() { return window.exerciseDatabase || (typeof exerciseDatabase !== 'undefined' ? exerciseDatabase : []); }
  function levee(cleLevee) { return LEVEES.filter(function (l) { return l.cle === cleLevee; })[0] || null; }

  // Meilleure charge maximale estimée (Epley) sur un exercice, en kg
  function e1rm(nom, depuis) {
    var best = 0;
    try {
      var perfs = typeof getExercisePerformances === 'function' ? getExercisePerformances() : {};
      (perfs[nom] || []).forEach(function (s) {
        if (!s || s.warmup) return;
        if (depuis && s.date && Date.parse(s.date) < depuis) return;
        var w = parseFloat(s.weight) || 0, r = Math.min(parseInt(s.reps, 10) || 0, 12);
        if (w > 0 && r > 0) best = Math.max(best, w * (1 + r / 30));
      });
    } catch (e) {}
    return best;
  }
  function actuelKg(d) {
    var a = e1rm(d.exo, Date.now() - 60 * JOUR);
    return Math.max(a, d.departKg || 0);
  }

  // ═══ DÉFI DE CHARGE : estimation d'arrivée ═══
  function rythmeTypique() {
    var n = profil().level;
    return n === 'advanced' ? 0.005 : (n === 'intermediate' ? 0.01 : 0.025);   // gain / semaine
  }
  function estimation(d) {
    var act = actuelKg(d);
    if (act >= d.cibleKg) return { atteint: true, act: act };
    var sem = Math.max(1, (Date.now() - d.debut) / SEM);
    var observe = (act - d.departKg) / sem;
    var parSem = (sem >= 3 && observe > 0) ? observe : act * rythmeTypique();
    var semaines = Math.ceil((d.cibleKg - act) / Math.max(0.1, parSem));
    return { atteint: false, act: act, semaines: semaines, arrivee: Date.now() + semaines * SEM, observe: sem >= 3 && observe > 0 };
  }

  // ═══ DÉFI DE CHARGE : séance du jour ═══
  function seancesFaites(d) {
    try {
      var h = typeof getWorkoutHistory === 'function' ? getWorkoutHistory() : [];
      return h.filter(function (w) { return w && w._defi && Date.parse(w.date) >= d.debut; }).length
        || h.filter(function (w) { return w && /^Mon défi/.test(w.name || '') && Date.parse(w.date) >= d.debut; }).length;
    } catch (e) { return 0; }
  }
  function schemaDuJour(d) {
    var w = Math.floor((Date.now() - d.debut) / SEM);
    if (w > 0 && (w + 1) % 4 === 0) return LEGER;
    return SCHEMAS[seancesFaites(d) % SCHEMAS.length];
  }
  function ecarte(ex) {
    try { if (window.AwakLimitations && AwakLimitations.bloque(ex)) return true; } catch (e) {}
    try { if (window.AwakPain && AwakPain.exerciseHitsPain && AwakPain.exerciseHitsPain(ex)) return true; } catch (e) {}
    return false;
  }
  function materielOk(ex) {
    try {
      if (typeof awakEquipmentOk === 'function' && typeof getSelectedEquipmentNames === 'function') return awakEquipmentOk(ex, getSelectedEquipmentNames());
    } catch (e) {}
    return true;
  }
  function appoints(d, n) {
    var L = levee(d.levee); if (!L) return [];
    var deja = {}; deja[d.exo] = 1;
    var tour = seancesFaites(d), out = [];
    L.appui.forEach(function (m, i) {
      if (out.length >= n) return;
      var c = db().filter(function (e) {
        return e && e.type === 'exercise' && !e.discipline && e.muscle === m && !deja[e.name] && materielOk(e) && !ecarte(e);
      }).sort(function (a, b) { return a.name < b.name ? -1 : 1; });
      if (!c.length) return;
      var e = c[(tour + i) % c.length];
      deja[e.name] = 1; out.push(e);
    });
    return out;
  }
  function seanceDuJour(d) {
    var S = schemaDuJour(d), base = db().filter(function (e) { return e.name === d.exo; })[0];
    if (!base) return null;
    var tm = actuelKg(d);
    var charge = arrAff(versAff(tm * S.pct));
    var principal = Object.assign(JSON.parse(JSON.stringify(base)), {
      _baseName: base.name, sets: S.series, reps: S.reps, mode: 'reps', recoRest: S.repos,
      recoSets: S.series, recoReps: String(S.reps), _chargeAffichee: charge, _defiPrincipal: true, type: 'exercise'
    });
    var L = [principal];
    appoints(d, 2).forEach(function (e) {
      L.push(Object.assign(JSON.parse(JSON.stringify(e)), { _baseName: e.name, sets: 3, reps: 10, mode: 'reps', recoRest: 75, recoSets: 3, recoReps: '10' }));
    });
    return {
      name: 'Mon défi · ' + (levee(d.levee) || {}).nom + ' · ' + S.nom, mode: 'reps', type: 'defi', _defi: true,
      restBetweenSets: S.repos, exercises: L, _schema: S, _charge: charge,
      badgeHTML: 'Mon défi · ' + S.nom, badgeStyle: 'linear-gradient(135deg,#60a8f0,#2563eb)'
    };
  }
  function lancer() {
    var d = lire(); if (!d || d.type !== 'charge') return;
    var w = seanceDuJour(d);
    if (!w) { toast('Cet exercice n\'existe plus dans la liste : change de défi.', 'warning'); return; }
    if (typeof switchTab === 'function') switchTab('workouts');
    setTimeout(function () { if (typeof showWorkoutPreparation === 'function') showWorkoutPreparation(w); }, 120);
  }

  // ═══ RENDU (onglet Progrès) ═══
  function carte(corps, c) {
    return '<div class="card" style="padding:14px 14px 13px;margin-bottom:12px;background:linear-gradient(160deg,' + (c || BLEU) + '12,rgba(167,139,250,0.03)) !important;border:1px solid ' + (c || BLEU) + '40;">'
      + '<div style="display:flex;align-items:center;gap:8px;margin-bottom:11px;">' + ico('cible', 16, c || BLEU)
      + '<span style="font-size:0.78em;font-weight:900;color:' + (c || BLEU) + ';letter-spacing:0.3px;flex:1;">Mon défi</span>'
      + (lire() ? '<button onclick="AwakMonDefi.changer()" style="min-height:auto;padding:5px 9px;border-radius:9px;background:transparent;border:1px solid rgba(255,255,255,0.14);color:#94a3b8;font-size:0.66em;font-weight:800;cursor:pointer;font-family:inherit;">Changer</button>' : '')
      + '</div>' + corps + '</div>';
  }
  function bouton(on, txt, principal, c) {
    return '<button onclick="' + on + '" style="flex:1;min-height:auto;padding:12px;border-radius:12px;cursor:pointer;font-family:inherit;font-weight:900;font-size:0.82em;'
      + (principal ? 'background:' + (c || ACC) + ';border:none;color:#04121f;' : 'background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.13);color:#cbd5e1;') + '">' + txt + '</button>';
  }
  function barre(pct, c) {
    pct = Math.max(0, Math.min(100, pct));
    return '<div style="height:10px;border-radius:99px;background:rgba(255,255,255,0.07);overflow:hidden;margin:9px 0 5px;">'
      + '<div style="height:100%;width:' + pct.toFixed(0) + '%;background:linear-gradient(90deg,' + c + 'aa,' + c + ');border-radius:99px;transition:width .5s;"></div></div>';
  }

  function rendreCharge(d) {
    var L = levee(d.levee) || { nom: d.exo };
    var E = estimation(d), act = E.act;
    var pct = d.cibleKg > d.departKg ? (act - d.departKg) / (d.cibleKg - d.departKg) * 100 : 100;
    var h = '<div style="font-size:1.02em;font-weight:900;color:#fff;">' + esc(txtCharge(d.cibleKg)) + ' au ' + esc(L.nom.toLowerCase()) + '</div>'
      + '<div style="font-size:0.68em;color:#94a3b8;margin-top:2px;">' + esc(d.exo) + ' · charge maximale estimée</div>'
      + barre(pct, BLEU)
      + '<div style="display:flex;justify-content:space-between;font-size:0.66em;font-weight:800;color:#94a3b8;">'
      + '<span>Départ ' + esc(txtCharge(d.departKg)) + '</span><span style="color:#fff;">Aujourd\'hui ' + esc(txtCharge(act)) + '</span><span>But ' + esc(txtCharge(d.cibleKg)) + '</span></div>';
    if (E.atteint) {
      h += '<div style="margin-top:12px;padding:11px 12px;border-radius:12px;background:rgba(251,191,36,0.1);border:1px solid rgba(251,191,36,0.4);">'
        + '<div style="font-size:0.6em;font-weight:900;letter-spacing:1.5px;color:' + OR + ';">DÉFI RÉUSSI</div>'
        + '<div style="font-size:0.84em;font-weight:800;color:#fff;margin-top:2px;">Tu as atteint ' + esc(txtCharge(d.cibleKg)) + '. Fixe-toi le prochain palier !</div></div>'
        + '<div style="display:flex;gap:8px;margin-top:10px;">' + bouton('AwakMonDefi.palierSuivant()', 'Défi suivant (+5 %)', true, OR) + '</div>';
      return carte(h, OR);
    }
    var S = schemaDuJour(d), w = seanceDuJour(d);
    h += '<div style="font-size:0.72em;color:#cbd5e1;line-height:1.5;margin-top:10px;">'
      + 'Arrivée estimée : <b style="color:#fff;">' + dateTxt(E.arrivee) + '</b> (environ ' + E.semaines + ' semaine' + (E.semaines > 1 ? 's' : '') + ')'
      + (E.observe ? ', d\'après tes progrès réels.' : ', au rythme habituel pour ton niveau. L\'estimation se précisera avec tes séances.')
      + (d.date ? '<br>Ta date visée : <b style="color:#fff;">' + dateTxt(d.date) + '</b> · ' + (E.arrivee <= d.date ? '<span style="color:#67e8f9;">dans les temps</span>' : '<span style="color:' + OR + ';">un peu juste : garde le rythme de 3 séances par semaine</span>') : '')
      + '</div>';
    if (w) {
      var app = w.exercises.slice(1).map(function (e) { return e.name; });
      h += '<div style="border-left:3px solid ' + BLEU + ';padding:2px 0 2px 10px;margin:12px 0 10px;">'
        + '<div style="font-size:0.6em;color:#64748b;font-weight:900;letter-spacing:1.4px;">PROCHAINE SÉANCE · ' + esc(S.nom.toUpperCase()) + '</div>'
        + '<div style="font-size:0.86em;font-weight:900;color:#fff;">' + esc(d.exo) + ' : ' + S.series + ' × ' + S.reps + ' à ' + w._charge + ' ' + unite() + '</div>'
        + (app.length ? '<div style="font-size:0.7em;color:#94a3b8;line-height:1.45;">Puis ' + esc(app.join(', ')) + ' (3 × 10)</div>' : '')
        + '</div>'
        + '<div style="display:flex;gap:8px;">' + bouton('AwakMonDefi.lancer()', 'Lancer la séance', true) + '</div>'
        + '<div style="font-size:0.62em;color:#64748b;line-height:1.45;margin-top:8px;">Vise 3 séances par semaine. Une semaine sur 4 est plus légère pour récupérer.</div>';
    }
    return carte(h, BLEU);
  }

  function rendreCourse(d) {
    var C = window.AwakCoachRun, O = (COURSES.filter(function (x) { return x.id === d.obj; })[0]) || COURSES[1];
    var P = C && C.lePlan ? C.lePlan() : null;
    var pred = null; try { var p = C && C.predictions ? C.predictions() : null; pred = p ? p['p' + d.obj] : null; } catch (e) {}
    var h = '<div style="font-size:1.02em;font-weight:900;color:#fff;">' + esc(O.nom) + ' en ' + esc(hms(d.cible)) + '</div>'
      + '<div style="font-size:0.68em;color:#94a3b8;margin-top:2px;">Allure visée : ' + esc(C && C.allure ? C.allure(d.cible / (O.d / 1000)) : '') + ' /km</div>';
    if (pred) {
      var ecart = pred - d.cible;
      var pct = ecart <= 0 ? 100 : Math.max(0, 100 - ecart / d.cible * 400);
      h += barre(pct, OR)
        + '<div style="font-size:0.7em;color:#cbd5e1;line-height:1.5;">Tes sorties récentes prédisent <b style="color:#fff;">' + esc(hms(pred)) + '</b>'
        + (ecart <= 0 ? ' : <span style="color:#67e8f9;">ton objectif est à ta portée</span>.' : ' : encore ' + esc(hms(ecart)) + ' à gagner.') + '</div>';
    } else {
      h += '<div style="font-size:0.7em;color:#94a3b8;line-height:1.5;margin-top:8px;">Fais une sortie de 3 km ou plus : l\'app pourra comparer ton niveau à ton objectif.</div>';
    }
    if (P && P.obj === d.obj) {
      var w = C.semaineCourante ? C.semaineCourante(P) : 0;
      h += '<div style="font-size:0.72em;color:#cbd5e1;margin-top:10px;">Plan ' + esc(O.nom) + ' : semaine <b style="color:#fff;">' + (w + 1) + ' / ' + P.S + '</b> · course le ' + dateTxt(P.debut + (P.S - 1) * SEM + 6 * JOUR) + '</div>'
        + '<div style="display:flex;gap:8px;margin-top:10px;">' + bouton('AwakMonDefi.voirCourse()', 'Voir mon plan', true, OR) + '</div>';
    } else {
      h += '<div style="font-size:0.72em;color:' + OR + ';margin-top:10px;">Le plan de ce défi a été arrêté.</div>'
        + '<div style="display:flex;gap:8px;margin-top:10px;">' + bouton('AwakMonDefi.relancerPlan()', 'Relancer le plan', true, OR) + '</div>';
    }
    return carte(h, OR);
  }

  function rendre() {
    var hote = document.getElementById('awakMonDefi');
    if (!hote) return;
    if (enfant()) { hote.innerHTML = ''; return; }
    var d = lire();
    if (!d) {
      hote.innerHTML = carte('<div style="font-size:0.78em;color:#cbd5e1;line-height:1.5;margin-bottom:11px;">Fixe-toi un objectif chiffré : une charge à soulever ou un temps de course. L\'app te prépare un programme sur mesure et te montre quand tu y seras.</div>'
        + '<div style="display:flex;gap:8px;">' + bouton('AwakMonDefi.creer(\'charge\')', ico('halter', 16, '#04121f') + ' Une charge', true) + bouton('AwakMonDefi.creer(\'course\')', ico('course', 16, '#cbd5e1') + ' Une course', false) + '</div>');
      return;
    }
    try { hote.innerHTML = d.type === 'course' ? rendreCourse(d) : rendreCharge(d); } catch (e) { hote.innerHTML = ''; }
  }

  // ═══ CRÉATION ═══
  function feuille(id, html) {
    var old = document.getElementById(id); if (old) old.remove();
    var ov = document.createElement('div');
    ov.id = id;
    ov.style.cssText = 'position:fixed;inset:0;z-index:10050;background:rgba(0,0,0,0.75);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);display:flex;align-items:flex-end;justify-content:center;';
    ov.onclick = function (e) { if (e.target === ov) ov.remove(); };
    ov.innerHTML = '<style>#' + id + ' input,#' + id + ' select{width:100%;box-sizing:border-box;padding:12px;background:#0b0e13 !important;border:1px solid rgba(255,255,255,0.10) !important;border-radius:12px;color:#fff !important;font-size:0.95em;font-family:inherit;}#' + id + ' input:focus,#' + id + ' select:focus{border-color:#22d3ee !important;outline:none;box-shadow:none !important;}</style>'
      + '<div style="width:100%;max-width:480px;max-height:90vh;overflow-y:auto;-webkit-overflow-scrolling:touch;background:#12161c;border:1px solid rgba(255,255,255,0.07);border-radius:20px 20px 0 0;padding:18px 18px calc(env(safe-area-inset-bottom,0px) + 18px);box-sizing:border-box;">' + html + '</div>';
    document.body.appendChild(ov);
    return ov;
  }
  var LBL = 'display:block;font-size:0.68em;color:#94a3b8;font-weight:800;letter-spacing:0.5px;margin:12px 0 6px;';
  function entete(t, s) {
    return '<div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;"><div style="flex:1;min-width:0;"><div style="font-weight:800;color:#fff;font-size:1em;">' + t + '</div>'
      + '<div style="font-size:0.7em;color:#94a3b8;margin-top:2px;">' + s + '</div></div>'
      + '<button aria-label="Fermer" onclick="this.closest(\'[id^=awakDefi]\').remove()" style="flex-shrink:0;width:34px;height:34px;min-height:auto;border-radius:10px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);color:#94a3b8;font-size:1.2em;cursor:pointer;line-height:1;">×</button></div>';
  }

  function creer(type) {
    if (type === 'course') return creerCourse();
    var dispo = LEVEES.map(function (L) {
      var ex = L.exos.filter(function (n) { return db().some(function (e) { return e.name === n; }); });
      return { L: L, ex: ex };
    }).filter(function (x) { return x.ex.length; });
    var options = '';
    dispo.forEach(function (x) { x.ex.forEach(function (n) {
      var a = e1rm(n, Date.now() - 120 * JOUR);
      options += '<option value="' + x.L.cle + '|' + esc(n) + '">' + esc(n) + (a ? ' · actuel ≈ ' + Math.round(versAff(a)) + ' ' + unite() : '') + '</option>';
    }); });
    var ov = feuille('awakDefiCharge', entete('Défi de charge', 'Une charge à soulever une fois, proprement')
      + '<label style="' + LBL + '">EXERCICE</label><select id="awakDefiExo">' + options + '</select>'
      + '<div id="awakDefiDepart"></div>'
      + '<label style="' + LBL + '">CHARGE VISÉE (' + unite().toUpperCase() + ')</label><input id="awakDefiCible" type="number" inputmode="decimal" min="1" placeholder="Par exemple ' + (kg() ? '70' : '150') + '">'
      + '<label style="' + LBL + '">POUR QUAND ? (FACULTATIF)</label><input id="awakDefiDate" type="date">'
      + '<div id="awakDefiAvis" style="margin-top:10px;"></div>'
      + '<button id="awakDefiGo" style="width:100%;margin-top:14px;padding:14px;border:none;border-radius:13px;background:#22d3ee;color:#04121f;font-weight:900;font-size:0.92em;cursor:pointer;font-family:inherit;">Créer mon défi</button>');
    var sel = ov.querySelector('#awakDefiExo');
    var majDepart = function () {
      var n = sel.value.split('|')[1], a = e1rm(n, Date.now() - 120 * JOUR);
      ov.querySelector('#awakDefiDepart').innerHTML = a
        ? '<div style="font-size:0.72em;color:#cbd5e1;margin-top:8px;">D\'après tes séances, ta charge maximale estimée est <b style="color:#fff;">' + txtCharge(a) + '</b>.</div>'
        : '<label style="' + LBL + '">TA MEILLEURE SÉRIE RÉCENTE</label><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">'
          + '<input id="awakDefiSerieW" type="number" inputmode="decimal" min="1" placeholder="Charge (' + unite() + ')"><input id="awakDefiSerieR" type="number" inputmode="numeric" min="1" max="15" placeholder="Répétitions"></div>'
          + '<div style="font-size:0.64em;color:#64748b;margin-top:5px;">Aucune série trouvée sur cet exercice : on part de celle-ci.</div>';
    };
    sel.onchange = majDepart; majDepart();
    ov.querySelector('#awakDefiGo').onclick = function () {
      var p = sel.value.split('|'), n = p[1], cle = p[0];
      var depart = e1rm(n, Date.now() - 120 * JOUR);
      if (!depart) {
        var w = parseFloat((ov.querySelector('#awakDefiSerieW') || {}).value) || 0, r = Math.min(15, parseInt((ov.querySelector('#awakDefiSerieR') || {}).value, 10) || 0);
        if (!w || !r) { toast('Indique ta meilleure série récente (charge et répétitions).', 'warning'); return; }
        depart = versKg(w) * (1 + r / 30);
      }
      var cAff = parseFloat(ov.querySelector('#awakDefiCible').value) || 0;
      if (!cAff) { toast('Indique la charge visée.', 'warning'); return; }
      var cible = versKg(cAff);
      if (cible <= depart) { toast('Tu es déjà à ' + txtCharge(depart) + ' : vise plus haut !', 'info'); return; }
      var dv = ov.querySelector('#awakDefiDate').value;
      var d = { type: 'charge', levee: cle, exo: n, cibleKg: cible, departKg: depart, debut: Date.now(), date: dv ? new Date(dv + 'T12:00').getTime() : 0 };
      // Objectif très lointain : un palier intermédiaire est proposé
      var E = estimation(d);
      if (!E.atteint && E.semaines > 40 && !ov.getAttribute('data-palier')) {
        var pal = versKg(arrAff(versAff(depart * 1.12)));
        ov.setAttribute('data-palier', '1');
        ov.querySelector('#awakDefiAvis').innerHTML = '<div style="padding:10px 12px;border-radius:12px;background:rgba(251,191,36,0.08);border:1px solid rgba(251,191,36,0.35);font-size:0.74em;color:#fde68a;line-height:1.5;">'
          + 'Objectif ambitieux : environ ' + E.semaines + ' semaines au rythme habituel. Commence par un palier à <b>' + txtCharge(pal) + '</b> : il sera atteint plus vite, et tu enchaîneras ensuite.'
          + '<div style="display:flex;gap:8px;margin-top:9px;">'
          + '<button id="awakDefiPal" style="flex:1;min-height:auto;padding:10px;border-radius:10px;border:none;background:' + OR + ';color:#1a1205;font-weight:900;cursor:pointer;font-family:inherit;">Palier ' + txtCharge(pal) + '</button>'
          + '<button id="awakDefiGarde" style="flex:1;min-height:auto;padding:10px;border-radius:10px;background:transparent;border:1px solid rgba(255,255,255,0.2);color:#e2e8f0;font-weight:800;cursor:pointer;font-family:inherit;">Garder ' + txtCharge(cible) + '</button></div></div>';
        ov.querySelector('#awakDefiPal').onclick = function () { d.cibleKg = pal; d.butFinalKg = cible; enregistrer(d, ov); };
        ov.querySelector('#awakDefiGarde').onclick = function () { enregistrer(d, ov); };
        return;
      }
      enregistrer(d, ov);
    };
  }
  function enregistrer(d, ov) {
    ecrire(d); if (ov) ov.remove(); rendre();
    toast(d.type === 'course' ? 'Défi créé : ton plan de course est prêt dans l\'onglet Course.' : 'Défi créé : ta première séance est prête.', 'success');
  }

  function creerCourse() {
    var C = window.AwakCoachRun;
    if (!C || !C.creerPlanCible) { toast('Le module de course n\'est pas disponible.', 'error'); return; }
    var etat = { obj: '10', par: 3 };
    var html = function () {
      var O = C.OBJ[etat.obj], S = O.sem[Math.min(1, O.sem.length - 1)];
      etat.S = etat.S && O.sem.indexOf(etat.S) >= 0 ? etat.S : S;
      var chip = function (attr, val, txt, on) {
        return '<button data-' + attr + '="' + val + '" style="flex:1;min-width:0;min-height:auto;padding:10px 4px;border-radius:11px;cursor:pointer;font-family:inherit;font-weight:800;font-size:0.76em;'
          + (on ? 'background:rgba(251,191,36,0.14);border:1.5px solid ' + OR + ';color:#fff;' : 'background:rgba(255,255,255,0.03);border:1.5px solid rgba(255,255,255,0.1);color:#94a3b8;') + '">' + txt + '</button>';
      };
      var pred = null; try { var p = C.predictions(); pred = p ? p['p' + etat.obj] : null; } catch (e) {}
      return entete('Défi de course', 'Une distance et le temps que tu vises')
        + '<label style="' + LBL + '">DISTANCE</label><div style="display:flex;gap:6px;">' + COURSES.map(function (x) { return chip('o', x.id, x.nom, etat.obj === x.id); }).join('') + '</div>'
        + '<label style="' + LBL + '">TEMPS VISÉ</label><div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;">'
        + '<input id="awakDefiH" type="number" inputmode="numeric" min="0" max="9" placeholder="Heures" value="' + (etat.h != null ? etat.h : '') + '">'
        + '<input id="awakDefiM" type="number" inputmode="numeric" min="0" max="59" placeholder="Minutes" value="' + (etat.m != null ? etat.m : '') + '">'
        + '<input id="awakDefiS" type="number" inputmode="numeric" min="0" max="59" placeholder="Secondes" value="' + (etat.s != null ? etat.s : '') + '"></div>'
        + (pred ? '<div style="font-size:0.7em;color:#94a3b8;margin-top:7px;">Tes sorties récentes prédisent ' + hms(pred) + ' sur ' + O.nom.toLowerCase() + '.</div>' : '')
        + '<label style="' + LBL + '">DURÉE DU PLAN</label><div style="display:flex;gap:6px;">' + O.sem.map(function (s) { return chip('s', s, s + ' sem.', etat.S === s); }).join('') + '</div>'
        + '<label style="' + LBL + '">SORTIES PAR SEMAINE</label><div style="display:flex;gap:6px;">' + chip('p', 3, '3 sorties', etat.par === 3) + chip('p', 4, '4 sorties', etat.par === 4) + '</div>'
        + '<div id="awakDefiAvis" style="margin-top:10px;"></div>'
        + '<button id="awakDefiGo" style="width:100%;margin-top:14px;padding:14px;border:none;border-radius:13px;background:' + OR + ';color:#1a1205;font-weight:900;font-size:0.92em;cursor:pointer;font-family:inherit;">Créer mon défi et mon plan</button>';
    };
    var lireTemps = function (ov) {
      etat.h = ov.querySelector('#awakDefiH').value; etat.m = ov.querySelector('#awakDefiM').value; etat.s = ov.querySelector('#awakDefiS').value;
      return (parseInt(etat.h, 10) || 0) * 3600 + (parseInt(etat.m, 10) || 0) * 60 + (parseInt(etat.s, 10) || 0);
    };
    var monter = function () {
      var ov = feuille('awakDefiCourse', html());
      ov.querySelectorAll('[data-o]').forEach(function (b) { b.onclick = function () { lireTemps(ov); etat.obj = b.getAttribute('data-o'); etat.S = null; monter(); }; });
      ov.querySelectorAll('[data-s]').forEach(function (b) { b.onclick = function () { lireTemps(ov); etat.S = +b.getAttribute('data-s'); monter(); }; });
      ov.querySelectorAll('[data-p]').forEach(function (b) { b.onclick = function () { lireTemps(ov); etat.par = +b.getAttribute('data-p'); monter(); }; });
      ov.querySelector('#awakDefiGo').onclick = function () {
        var cible = lireTemps(ov), O = C.OBJ[etat.obj];
        if (cible < 300) { toast('Indique le temps que tu vises.', 'warning'); return; }
        var pred = null; try { var p = C.predictions(); pred = p ? p['p' + etat.obj] : null; } catch (e) {}
        // Repères : record du monde arrondi (marathon ≈ 2 h 01) → au-delà, c'est irréaliste
        var record = { '5': 750, '10': 1570, '21': 3440, '42': 7240 }[etat.obj];
        var palier = 0, msg = '';
        if (cible < record) { palier = pred ? Math.round(pred * 0.97 / 60) * 60 : 0; msg = 'Ce temps est plus rapide que le record du monde (environ ' + hms(record) + ').'; }
        else if (pred && cible < pred * 0.88) { palier = Math.round(pred * 0.96 / 60) * 60; msg = 'Objectif très ambitieux : tes sorties récentes prédisent ' + hms(pred) + '.'; }
        if (msg && !ov.getAttribute('data-palier')) {
          ov.setAttribute('data-palier', '1');
          ov.querySelector('#awakDefiAvis').innerHTML = '<div style="padding:10px 12px;border-radius:12px;background:rgba(251,191,36,0.08);border:1px solid rgba(251,191,36,0.35);font-size:0.74em;color:#fde68a;line-height:1.5;">' + msg
            + (palier ? ' Un premier palier à <b>' + hms(palier) + '</b> serait plus sûr.' : ' Fais quelques sorties pour que l\'app propose un palier adapté à ton niveau.')
            + '<div style="display:flex;gap:8px;margin-top:9px;">'
            + (palier ? '<button id="awakDefiPal" style="flex:1;min-height:auto;padding:10px;border-radius:10px;border:none;background:' + OR + ';color:#1a1205;font-weight:900;cursor:pointer;font-family:inherit;">Palier ' + hms(palier) + '</button>' : '')
            + (cible >= record ? '<button id="awakDefiGarde" style="flex:1;min-height:auto;padding:10px;border-radius:10px;background:transparent;border:1px solid rgba(255,255,255,0.2);color:#e2e8f0;font-weight:800;cursor:pointer;font-family:inherit;">Garder ' + hms(cible) + '</button>' : '')
            + '</div></div>';
          var go = function (t) { C.creerPlanCible(etat.obj, etat.S, etat.par, t); enregistrer({ type: 'course', obj: etat.obj, cible: t, debut: Date.now() }, ov); };
          var bp = ov.querySelector('#awakDefiPal'); if (bp) bp.onclick = function () { go(palier); };
          var bg = ov.querySelector('#awakDefiGarde'); if (bg) bg.onclick = function () { go(cible); };
          return;
        }
        if (cible < record) return;
        C.creerPlanCible(etat.obj, etat.S, etat.par, cible);
        enregistrer({ type: 'course', obj: etat.obj, cible: cible, debut: Date.now() }, ov);
      };
    };
    monter();
  }

  function changer() {
    var go = function () { ecrire(null); rendre(); };
    if (typeof showConfirm === 'function') showConfirm('Ton défi actuel sera retiré (tes séances et sorties restent dans ton historique). Le plan de course, s\'il y en a un, reste dans l\'onglet Course.', go, null, { title: 'Changer de défi ?', confirmLabel: 'Changer', cancelLabel: 'Garder' });
    else go();
  }
  function palierSuivant() {
    var d = lire(); if (!d || d.type !== 'charge') return;
    var act = actuelKg(d), but = d.butFinalKg && d.butFinalKg > act ? d.butFinalKg : act * 1.05;
    ecrire({ type: 'charge', levee: d.levee, exo: d.exo, cibleKg: versKg(arrAff(versAff(but))), departKg: act, debut: Date.now(), date: 0 });
    rendre();
  }
  function voirCourse() { try { if (window.AwakRun && AwakRun.ouvrir) AwakRun.ouvrir(); else if (typeof switchTab === 'function') switchTab('course'); } catch (e) {} }
  function relancerPlan() {
    var d = lire(), C = window.AwakCoachRun; if (!d || !C) return;
    var O = C.OBJ[d.obj]; C.creerPlanCible(d.obj, O.sem[Math.min(1, O.sem.length - 1)], 3, d.cible); rendre();
    toast('Plan relancé dans l\'onglet Course.', 'success');
  }

  // Rendu avec le reste de l'onglet Progrès
  function brancher() {
    if (window.AwakProg && AwakProg.rendre && !AwakProg.rendre._defi) {
      var o = AwakProg.rendre;
      AwakProg.rendre = function () { var r = o.apply(this, arguments); try { rendre(); } catch (e) {} return r; };
      AwakProg.rendre._defi = true;
    }
    rendre();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(brancher, 200); });
  else setTimeout(brancher, 200);

  window.AwakMonDefi = { rendre: rendre, creer: creer, lancer: lancer, changer: changer, palierSuivant: palierSuivant,
    voirCourse: voirCourse, relancerPlan: relancerPlan, seanceDuJour: seanceDuJour, estimation: estimation, lire: lire, e1rm: e1rm };
})();
