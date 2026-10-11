/* ═══════════════════════════════════════════════════════════════════════
   🏠  ACCUEIL « PRO » — Awakened
   -----------------------------------------------------------------------
   Remplace l'empilement de cartes de l'accueil par 4 blocs, dans un seul
   style (cartes neutres, un accent cyan, aucun halo ni coin lumineux) :
     1. Carte héros : date, « Prêt pour aujourd'hui ? », portrait (changer de
                     profil), objectif du jour (durée, exercices) + UN bouton
     2. Deux tuiles : progression (XP en mode jeu, sinon le mois) · semaine
     3. Une carte   : quête du jour (mode jeu) ou muscles à prévoir
     4. Raccourcis  : liste uniforme (Routines, Exercices, Réveil, Douleur…)

   COMMENT
   • Les anciennes cartes ne sont PAS supprimées : d'autres fonctions y
     écrivent par id (#homeStatStreak, #userName…). On les masque par CSS.
   • Les conteneurs conditionnels utiles (reprise de séance, mode récup,
     encouragements famille, profil jeune, Éveil, programme actif…) sont
     DÉPLACÉS dans la nouvelle page : ils gardent leur id, donc leurs
     fonctions de rendu continuent de fonctionner.
   • Le planning vient de window.AwakCalPlan (calendar-tab.js) : l'accueil
     et l'agenda affichent exactement les mêmes chiffres.
   • Rendu appelé depuis updateHomeStats() (app.js), à chaque affichage.
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var ACCENT = '#22d3ee';
  var JOURS_LONG = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
  var LETTRES = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
  var MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  var MUSCLES_CLES = ['Pectoraux', 'Dos', 'Épaules', 'Quadriceps', 'Fessiers', 'Ischio-jambiers', 'Abdominaux', 'Biceps', 'Triceps'];

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function ico(nom, taille, couleur) {
    try { return window.AwakIcon ? window.AwakIcon.get(nom, taille || 18, couleur || '#94a3b8') : ''; } catch (e) { return ''; }
  }
  function wIdx(d) { return (d.getDay() + 6) % 7; }
  function lundiDe(d) { var x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() - wIdx(x)); return x; }
  function ymd(d) { return d.getFullYear() + '-' + d.getMonth() + '-' + d.getDate(); }

  function profilActif() {
    try {
      var id = (typeof getCurrentProfileId === 'function') ? getCurrentProfileId() : null;
      var list = (typeof getAllProfiles === 'function') ? (getAllProfiles() || []) : [];
      var p = list.filter(function (x) { return x && x.id === id; })[0];
      return { id: id, profil: p || null, nb: list.length };
    } catch (e) { return { id: null, profil: null, nb: 0 }; }
  }

  function historique(id) {
    try {
      var cle = id ? ('profile_' + id + '_workoutHistory') : 'workoutHistory';
      var h = JSON.parse(localStorage.getItem(cle) || '[]');
      return Array.isArray(h) ? h : [];
    } catch (e) { return []; }
  }
  function dateSeance(w) { return new Date(w && (w.date || w.completedAt || w.timestamp) || 0); }

  // Série : jours consécutifs avec au moins une séance (aujourd'hui ou hier inclus)
  function serie(hist) {
    var jours = {};
    hist.forEach(function (w) { var d = dateSeance(w); if (!isNaN(d)) jours[d.toDateString()] = true; });
    var n = 0, c = new Date();
    if (!jours[c.toDateString()]) c.setDate(c.getDate() - 1);
    while (jours[c.toDateString()]) { n++; c.setDate(c.getDate() - 1); }
    return n;
  }

  // ── Planning (même source que l'agenda) ──
  function planning(id) {
    var P = window.AwakCalPlan;
    if (!P || !id) return { plan: {}, faits: {}, P: null };
    var plan = {}, faits = {};
    try { plan = P.planFor(id) || {}; } catch (e) {}
    try { faits = P.doneDates(id) || {}; } catch (e) {}
    return { plan: plan, faits: faits, P: P };
  }
  function seanceDu(pl, id, d) {
    var cle = ['lun', 'mar', 'mer', 'jeu', 'ven', 'sam', 'dim'][wIdx(d)];
    var s = pl.plan[cle];
    if (!s || !s.muscles || !s.muscles.length) return null;
    var heure = null;
    try { heure = pl.P ? pl.P.timeFor(id, ymd(d), cle, pl.plan) : s.heure; } catch (e) { heure = s.heure || null; }
    return { s: s, heure: heure, faite: !!pl.faits[ymd(d)] };
  }
  function fmtH(t) {
    try { return (window.AwakCalPlan && t) ? window.AwakCalPlan.fmtTime(t) : (t || ''); } catch (e) { return t || ''; }
  }

  // ═══ STYLES ════════════════════════════════════════════════════════
  function styles() {
    if (document.getElementById('awakHomeProCSS')) return;
    var st = document.createElement('style');
    st.id = 'awakHomeProCSS';
    st.textContent =
      // Anciennes cartes remplacées : masquées, pas supprimées
      '#homeTab #profileCard,#homeTab #homeWeekCalendar,#homeTab #homeWeekStrip,#homeTab #homeCoachCard,' +
      '#homeTab #weeklySuggestionCard,#homeTab #painCheckCard,#homeTab #homeMoreCardsHint{display:none!important;}' +
      // Affiche AWAKENED : image COMPLÈTE, sans rognage ni zoom
      '#appHeader{height:auto!important;padding:0!important;margin-bottom:12px!important;border:1px solid rgba(255,255,255,0.06)!important;box-shadow:none!important;}' +
      '#appHeader picture{display:block!important;height:auto!important;}' +
      '#appHeader img{width:100%!important;height:auto!important;object-fit:contain!important;transform:none!important;display:block!important;}' +
      '#appHeader > div{display:none!important;}' +
      // Composants
      '.ahp-card{background:#12161c;border:1px solid rgba(255,255,255,0.06);border-radius:16px;padding:16px;margin-bottom:12px;}' +
      '.ahp-lbl{font-size:0.7em;color:#94a3b8;font-weight:600;}' +
      '.ahp-btn{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;border:none;border-radius:12px;' +
        'padding:13px 14px;font-family:inherit;font-size:0.9em;font-weight:800;cursor:pointer;}' +
      '.ahp-btn-p{background:' + ACCENT + ';color:#04121f;}' +
      '.ahp-btn-s{background:rgba(255,255,255,0.05);color:#e2e8f0;border:1px solid rgba(255,255,255,0.08);}' +
      '.ahp-row{display:flex;align-items:center;gap:12px;width:100%;padding:12px 2px;background:none;border:none;' +
        'border-top:1px solid rgba(255,255,255,0.05);cursor:pointer;font-family:inherit;text-align:left;color:#e2e8f0;}' +
      '.ahp-row:first-child{border-top:none;}' +
      '.ahp-ic{flex-shrink:0;width:34px;height:34px;border-radius:10px;background:rgba(255,255,255,0.04);' +
        'display:flex;align-items:center;justify-content:center;}' +
      // Conteneurs conditionnels déplacés : vides → aucune marge
      '[data-ahp-extras] > :empty{display:none!important;}' +
      '[data-ahp-extras] > *{margin-bottom:12px;}' +
      // v1318 : accueil « objectif du jour »
      '.ahp-kick{font-size:0.7em;color:#94a3b8;font-weight:800;letter-spacing:0.6px;text-transform:uppercase;}' +
      '.ahp-meta{display:flex;flex-wrap:wrap;align-items:center;gap:6px 14px;margin-top:8px;font-size:0.8em;color:#e2e8f0;}' +
      '.ahp-m{display:inline-flex;align-items:center;gap:6px;}' +
      '.ahp-cta{display:block;width:100%;min-height:auto;border:none;border-radius:12px;padding:15px 14px;font-family:inherit;' +
        'font-size:0.92em;font-weight:900;letter-spacing:0.6px;cursor:pointer;background:' + ACCENT + ';color:#04121f;}' +
      '.ahp-cta-s{background:rgba(255,255,255,0.06);color:#e2e8f0;border:1px solid rgba(255,255,255,0.1);}' +
      '.ahp-tile{display:block;width:100%;min-width:0;min-height:auto;text-align:left;cursor:pointer;font-family:inherit;color:inherit;' +
        'background:#12161c;border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:13px 13px 12px;box-sizing:border-box;}' +
      '.ahp-quest{display:block;width:100%;text-align:left;cursor:pointer;font-family:inherit;color:inherit;box-sizing:border-box;}';
    document.head.appendChild(st);
  }

  // ═══ 2. AUJOURD'HUI ════════════════════════════════════════════════
  function prochaine(pl, id) {
    var d = new Date();
    for (var k = 1; k <= 7; k++) {
      var x = new Date(d.getFullYear(), d.getMonth(), d.getDate() + k);
      var s = seanceDu(pl, id, x);
      if (s) return { d: x, k: k, e: s };
    }
    return null;
  }



  // ── Choix du planning suivi (routine / plan / programme / auto) ──
  var SRC_LIB = {
    auto:      { t: 'Automatique',       d: 'Routines d\'abord, puis ton plan de la semaine' , ic: 'grille' },
    routine:   { t: 'Mes routines',      d: 'Les routines assignées aux jours',                ic: 'liste' },
    ia:        { t: 'Plan de la semaine', d: 'Plan intelligent, manuel ou programme star',     ic: 'eclair' },
    programme: { t: 'Programme',         d: 'La semaine en cours de ton programme',           ic: 'trophee' }
  };
  window.awakChoisirPlanning = function () {
    var P = window.AwakCalPlan;
    if (!P || !P.sourcePref) return;
    var id = null;
    try { id = (typeof getCurrentProfileId === 'function') ? getCurrentProfileId() : null; } catch (e) {}
    if (!id) return;
    var v = P.sourcePref(id), dispo = {};
    try { dispo = P.sourcesDispo(id) || {}; } catch (e) {}
    document.getElementById('awakPlanSrcModal') && document.getElementById('awakPlanSrcModal').remove();
    var ov = document.createElement('div');
    ov.id = 'awakPlanSrcModal';
    ov.style.cssText = 'position:fixed;inset:0;z-index:12000;background:rgba(0,0,0,0.75);display:flex;align-items:flex-end;justify-content:center;';
    ov.onclick = function (e) { if (e.target === ov) ov.remove(); };
    var lignes = ['auto', 'routine', 'ia', 'programme'].map(function (k) {
      var L = SRC_LIB[k], sel = k === v;
      var vide = k !== 'auto' && !dispo[k];
      var desc = L.d;
      if (k === 'programme' && dispo.nomProgramme) desc = dispo.nomProgramme + ' · semaine en cours';
      if (vide) desc = k === 'routine' ? 'Aucune routine assignée à un jour' : (k === 'ia' ? 'Aucun plan de la semaine créé' : 'Aucun programme démarré');
      return '<button ' + (vide ? 'disabled ' : '') + 'onclick="awakPlanSrcSet(\'' + k + '\')" style="display:flex;align-items:center;gap:12px;width:100%;min-height:auto;' +
          'padding:12px;margin-bottom:7px;border-radius:12px;cursor:' + (vide ? 'default' : 'pointer') + ';font-family:inherit;text-align:left;' +
          'opacity:' + (vide ? '0.45' : '1') + ';' +
          'background:' + (sel ? 'rgba(34,211,238,0.10)' : 'rgba(255,255,255,0.03)') + ';border:1px solid ' + (sel ? 'rgba(34,211,238,0.55)' : 'rgba(255,255,255,0.08)') + ';">' +
          '<span style="width:36px;height:36px;border-radius:10px;flex-shrink:0;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.04);">' + ico(L.ic, 18, sel ? ACCENT : '#94a3b8') + '</span>' +
          '<span style="flex:1;min-width:0;"><span style="display:block;font-size:0.88em;font-weight:800;color:#f1f5f9;">' + L.t + '</span>' +
          '<span style="display:block;font-size:0.72em;color:#94a3b8;margin-top:2px;">' + esc(desc) + '</span></span>' +
          (sel ? ico('valide', 18, ACCENT) : '') +
        '</button>';
    }).join('');
    ov.innerHTML = '<div style="width:100%;max-width:480px;background:#12161c;border:1px solid rgba(255,255,255,0.08);border-radius:18px 18px 0 0;padding:16px 14px 22px;box-sizing:border-box;">' +
        '<div style="width:40px;height:4px;background:rgba(255,255,255,0.12);border-radius:99px;margin:0 auto 12px;"></div>' +
        '<div style="font-size:1.02em;font-weight:800;color:#f1f5f9;">Quel planning suivre ?</div>' +
        '<div style="font-size:0.74em;color:#94a3b8;margin:4px 0 14px;line-height:1.45;">L\'accueil et l\'agenda afficheront seulement ce planning.</div>' +
        lignes + '</div>';
    document.body.appendChild(ov);
  };
  window.awakPlanSrcSet = function (k) {
    var P = window.AwakCalPlan, id = null;
    try { id = getCurrentProfileId(); } catch (e) {}
    if (P && P.setSourcePref && id) P.setSourcePref(id, k);
    var m = document.getElementById('awakPlanSrcModal'); if (m) m.remove();
    render();
    try { if (typeof window.renderCalendarTab === 'function' && document.getElementById('calendarTab') && document.getElementById('calendarTab').classList.contains('active')) window.renderCalendarTab(); } catch (e) {}
  };

  // ═══ 4. RACCOURCIS ═════════════════════════════════════════════════
  function raccourcisHTML() {
    var zones = 0;
    try { zones = (window.AwakPain && window.AwakPain.activeZones) ? window.AwakPain.activeZones().length : 0; } catch (e) {}
    var faille = document.getElementById('quickFailleBtn');
    var jeu = faille && faille.style.display !== 'none';

    function ligne(icone, couleur, titre, detail, action) {
      return '<button class="ahp-row" onclick="' + action + '">' +
          '<span class="ahp-ic">' + ico(icone, 18, couleur) + '</span>' +
          '<span style="flex:1;min-width:0;">' +
            '<span style="display:block;font-size:0.88em;font-weight:700;color:#e2e8f0;">' + titre + '</span>' +
            '<span style="display:block;font-size:0.76em;color:#a3b1c2;margin-top:2px;">' + detail + '</span>' +
          '</span>' +
          '<span style="flex-shrink:0;color:#475569;font-size:1.2em;">›</span>' +
        '</button>';
    }

    return '<div class="ahp-card" style="padding:4px 14px;">' +
        ligne('liste', '#93c5fd', 'Mes routines', 'Tes séances enregistrées', 'switchTab(\'routines\')') +
        ligne('grille', '#93c5fd', 'Exercices', 'Bibliothèque et fiches', 'switchTab(\'exercises\')') +
        ligne('soleil', '#fbbf24', 'Réveil du corps', 'Mobilité douce, sans matériel', 'if(typeof showMorningRoutineModal===\'function\')showMorningRoutineModal()') +
        ligne('sante', zones ? '#f87171' : '#94a3b8', 'Où as-tu mal ?',
          zones ? zones + ' zone' + (zones > 1 ? 's' : '') + ' signalée' + (zones > 1 ? 's' : '') + ' — exercices évités' : 'Adapter tes séances à une douleur',
          'if(window.AwakPainOpen)AwakPainOpen()') +
        (jeu ? ligne('faille', '#c4b5fd', 'Failles', 'Le mode aventure', 'switchTab(\'game\')') : '') +
        ligne('boussole', '#94a3b8', 'Tout explorer', 'Toutes les fonctionnalités', 'if(typeof showFeatureMap===\'function\')showFeatureMap()') +
      '</div>';
  }

  // ═══ v1318 : ACCUEIL « OBJECTIF DU JOUR » ══════════════════════════
  //   Carte héros (en-tête + objectif du jour + UN bouton) · 2 tuiles
  //   (progression, semaine) · 1 carte quête (mode jeu) ou muscles à prévoir.
  function jeuActif() { try { return typeof window.rpgEnabled === 'function' && window.rpgEnabled(); } catch (e) { return false; } }
  function niveauJeu() {
    try {
      if (!jeuActif() || typeof window.rpgLoad !== 'function') return null;
      var xp = Math.max(0, Math.floor(((window.rpgLoad() || {}).profile || {}).xp || 0));
      var n = window.rpgLevelFromXP(xp), a = window.rpgXPForLevel(n), b = window.rpgXPForLevel(n + 1);
      return { n: n, dans: xp - a, pas: Math.max(1, b - a) };
    } catch (e) { return null; }
  }
  function objectifHebdo() {
    try { var up = (typeof getUserProfile === 'function') ? (getUserProfile() || {}) : {}; return Math.max(1, parseInt(up.weeklyGoal, 10) || 3); } catch (e) { return 3; }
  }
  function lireJSON(cle, def) { try { var v = JSON.parse(localStorage.getItem(cle) || 'null'); return v == null ? def : v; } catch (e) { return def; } }
  function fourchette(min) {
    var r5 = function (x) { return Math.max(5, Math.round(x / 5) * 5); };
    var lo = r5(min * 0.85), hi = r5(min * 1.15);
    if (hi <= lo) hi = lo + 5;
    return lo + '–' + hi + ' min';
  }
  // Durée et nombre d'exercices d'une séance prévue (quand on peut le savoir)
  function metaSeance(id, s) {
    var exos = null;
    try {
      if (s.routineId) {
        var r = (lireJSON('routines_' + id, []) || []).filter(function (x) { return x && x.id === s.routineId; })[0];
        if (r) exos = (r.exercises || []).filter(function (e) { return e && !e.isRest; });
      } else if (s.source === 'programme') {
        var o = lireJSON('activePlan_' + id, null), sem = o && o.weeks && o.weeks[(+s.planWeek || 1) - 1];
        var se = sem && sem.sessions && sem.sessions[+s.planIdx || 0];
        if (se && se.exercises) exos = se.exercises.map(function (n) { return typeof n === 'string' ? { name: n } : n; });
      }
    } catch (e) {}
    if (!exos || !exos.length) return { exos: 0, duree: '' };
    var repos = parseInt(localStorage.getItem('fitproGlobalRest') || '90', 10) || 90, sec = 0;
    exos.forEach(function (e) {
      var series = parseInt(e.sets, 10) || 3;
      var effort = e.mode === 'timer' ? (parseInt(e.duration, 10) || 40) : 40;
      sec += series * (effort + repos);
    });
    return { exos: exos.length, duree: fourchette(sec / 60) };
  }

  function lienAutre() {
    var P = window.AwakCalPlan, plan = '';
    try {
      if (P && P.sourcePref) {
        var id = getCurrentProfileId(), v = P.sourcePref(id), nom = (SRC_LIB[v] || SRC_LIB.auto).t;
        if (v === 'programme') { var dp = P.sourcesDispo(id); if (dp.nomProgramme) nom = dp.nomProgramme; }
        plan = '<button onclick="awakChoisirPlanning()" style="min-height:auto;padding:4px 0;background:none;border:none;cursor:pointer;font-family:inherit;' +
          'font-size:0.74em;color:#94a3b8;display:inline-flex;align-items:center;gap:5px;max-width:52%;">' +
          '<span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">Planning : <b style="color:#e2e8f0;">' + esc(nom) + '</b></span><span style="color:' + ACCENT + ';">›</span></button>';
      }
    } catch (e) {}
    return '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:9px;">' +
        '<button onclick="awakAutreActivite()" style="min-height:auto;padding:4px 0;background:none;border:none;cursor:pointer;font-family:inherit;' +
          'font-size:0.76em;color:#cbd5e1;text-decoration:underline;text-underline-offset:3px;text-decoration-color:rgba(203,213,225,0.35);">Ou choisir une autre activité</button>' +
        plan +
      '</div>';
  }

  function heroHTML(info, pl, hist) {
    var p = info.profil || {}, id = info.id;
    var nom = p.name || (document.getElementById('userName') || {}).textContent || '';
    if (/^\s*(Mon profil|Athlète)\s*$/i.test(nom)) nom = '';
    var d = new Date();
    var date = JOURS_LONG[wIdx(d)] + ' ' + d.getDate() + ' ' + MOIS[d.getMonth()];
    var faiteAuj = hist.some(function (w) { return ymd(dateSeance(w)) === ymd(d); });
    var niv = niveauJeu();
    var but = ((document.getElementById('userGoal') || {}).textContent || '').trim();
    var sousTitre = [nom, niv ? 'Niveau ' + niv.n : (but && but !== '-' ? but : '')].filter(Boolean).join(' · ');

    // Portrait : le chasseur en mode jeu, sinon l'avatar du profil
    var portrait = '';
    try { portrait = (typeof renderAvatar === 'function') ? renderAvatar(p.avatar, 50) : ''; } catch (e) {}
    if (niv) {
      var g = localStorage.getItem('fitproAvatarGender') === 'femme' ? 'femme' : 'homme';
      // Image absente : on revient à l'avatar du profil
      portrait = '<img src="images/avatars/avatar_' + g + '.png" alt="" data-fb="' + esc(portrait) + '" style="width:100%;height:100%;object-fit:cover;object-position:50% 12%;display:block;" ' +
        'onerror="this.parentNode.innerHTML=this.getAttribute(\'data-fb\')">';
    }

    // Objectif du jour
    var auj = seanceDu(pl, id, d), aPlan = Object.keys(pl.plan || {}).length > 0;
    var etiq = 'TON OBJECTIF DU JOUR', titre, meta = '', bouton;
    var go = 'switchTab(\'workouts\');window.scrollTo(0,0)';
    if (auj) {
      var s = auj.s;
      titre = s.label || s.muscles.slice(0, 3).join(' · ');
      var M = metaSeance(id, s), bits = [];
      if (M.duree) bits.push('<span class="ahp-m">' + ico('chrono', 15, '#cbd5e1') + '<span>' + M.duree + '</span></span>');
      if (M.exos) bits.push('<span class="ahp-m">' + ico('halter', 15, '#cbd5e1') + '<span>' + M.exos + ' exercice' + (M.exos > 1 ? 's' : '') + '</span></span>');
      else if (s.label) bits.push('<span class="ahp-m">' + ico('muscle', 15, '#cbd5e1') + '<span>' + esc(s.muscles.slice(0, 3).join(' · ')) + '</span></span>');
      if (auj.heure) bits.push('<span class="ahp-m">' + ico('calendrier', 15, '#cbd5e1') + '<span>' + esc(fmtH(auj.heure)) + '</span></span>');
      meta = bits.join('');
      if (s.routineId) go = 'if(typeof startRoutineById===\'function\')startRoutineById(\'' + esc(s.routineId) + '\')';
      else if (s.source === 'programme' && s.planWeek) go = 'if(typeof startPlanSession===\'function\')startPlanSession(' + (+s.planWeek) + ',' + (+s.planIdx) + ')';
      if (auj.faite) etiq = 'TON OBJECTIF DU JOUR · ACCOMPLI';
      bouton = auj.faite
        ? '<button class="ahp-cta ahp-cta-s" onclick="switchTab(\'history\')">VOIR MA PROGRESSION</button>'
        : '<button class="ahp-cta" onclick="' + go + '">COMMENCER MA SÉANCE</button>';
    } else if (aPlan) {
      titre = 'Jour de repos';
      var pr = prochaine(pl, id);
      meta = '<span>' + (pr
        ? 'Prochaine séance ' + (pr.k === 1 ? 'demain' : JOURS_LONG[wIdx(pr.d)].toLowerCase()) + ' : ' + esc(pr.e.s.label || pr.e.s.muscles.slice(0, 2).join(' · '))
        : 'La récupération fait partie de l\'entraînement.') + '</span>';
      bouton = '<button class="ahp-cta" onclick="if(typeof showMorningRoutineModal===\'function\')showMorningRoutineModal()">MOBILITÉ DOUCE</button>';
    } else if (faiteAuj) {
      etiq = 'TON OBJECTIF DU JOUR · ACCOMPLI';
      titre = 'Séance faite';
      meta = '<span>Bien joué. Le repos fait partie du progrès.</span>';
      bouton = '<button class="ahp-cta ahp-cta-s" onclick="switchTab(\'history\')">VOIR MA PROGRESSION</button>';
    } else {
      titre = 'Séance du Système';
      meta = '<span class="ahp-m">' + ico('eclair', 15, '#cbd5e1') + '<span>Choisie selon ta récupération</span></span>';
      bouton = '<button class="ahp-cta" onclick="' + go + '">COMMENCER MA SÉANCE</button>';
    }

    return '<div class="ahp-card" style="padding:16px 16px 12px;">' +
        '<div style="display:flex;align-items:flex-start;gap:12px;">' +
          '<div style="flex:1;min-width:0;padding-top:2px;">' +
            '<div class="ahp-kick">' + esc(date) + '</div>' +
            '<div style="font-family:var(--font-display);font-size:1.38em;font-weight:800;color:#f8fafc;line-height:1.15;margin-top:5px;">' +
              (faiteAuj ? 'Bien joué aujourd\'hui' : 'Prêt pour aujourd\'hui ?') + '</div>' +
            (sousTitre ? '<div style="font-size:0.8em;color:#cbd5e1;margin-top:5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + esc(sousTitre) + '</div>' : '') +
          '</div>' +
          '<button onclick="if(typeof showProfileSelectionModal===\'function\')showProfileSelectionModal()" aria-label="Changer de profil" data-emoji-keep="1" ' +
            'style="flex-shrink:0;width:74px;height:74px;min-height:auto;padding:0;border-radius:16px;overflow:hidden;cursor:pointer;' +
            'background:#0b0e13;border:1px solid rgba(255,255,255,0.12);display:flex;align-items:center;justify-content:center;">' + portrait + '</button>' +
        '</div>' +
        '<div style="height:1px;background:rgba(255,255,255,0.06);margin:14px -16px 14px;"></div>' +
        '<div class="ahp-kick" style="color:' + (auj && !auj.faite ? ACCENT : '#94a3b8') + ';">' + etiq + '</div>' +
        '<div style="font-family:var(--font-display);font-size:1.18em;font-weight:800;color:#f8fafc;margin-top:6px;line-height:1.2;">' + esc(titre) + '</div>' +
        (meta ? '<div class="ahp-meta">' + meta + '</div>' : '') +
        '<div style="margin-top:14px;">' + bouton + '</div>' +
        lienAutre() +
      '</div>';
  }

  // ── Tuiles : progression + semaine ──
  function tuilesHTML(info, pl, hist) {
    var id = info.id, today = new Date(), debut = lundiDe(today);
    var niv = niveauJeu();
    var t1;
    if (niv) {
      t1 = tuile('eclair', ACCENT, 'PROGRESSION', niv.dans + ' / ' + niv.pas + ' XP', barreHTML(niv.dans / niv.pas), 'Niveau ' + niv.n, 'switchTab(\'game\')');
    } else {
      var d1 = new Date(today.getFullYear(), today.getMonth(), 1), mois = 0;
      hist.forEach(function (w) { if (dateSeance(w) >= d1) mois++; });
      var visee = objectifHebdo() * 4, sr = serie(hist);
      t1 = tuile('stats', ACCENT, 'CE MOIS-CI', mois + ' séance' + (mois > 1 ? 's' : ''), barreHTML(mois / visee),
        sr > 0 ? sr + ' jour' + (sr > 1 ? 's' : '') + ' de suite' : 'Objectif : ' + visee + ' ce mois', 'switchTab(\'history\')');
    }
    // Semaine : séances faites / objectif (séances prévues, sinon objectif du profil)
    var prevues = 0, prevuesFaites = 0, faites = {}, total = 0, points = '';
    hist.forEach(function (w) { var d = dateSeance(w); if (!isNaN(d) && d >= debut) { total++; faites[ymd(d)] = true; } });
    for (var i = 0; i < 7; i++) {
      var d = new Date(debut.getFullYear(), debut.getMonth(), debut.getDate() + i);
      var e = seanceDu(pl, id, d), f = !!faites[ymd(d)], estAuj = ymd(d) === ymd(today);
      if (e) { prevues++; if (f) prevuesFaites++; }
      points += '<span title="' + LETTRES[i] + '" style="width:9px;height:9px;border-radius:50%;box-sizing:border-box;' +
        (f ? 'background:' + ACCENT + ';' : 'border:1.5px solid ' + (estAuj ? ACCENT : (e ? 'rgba(167,139,250,0.8)' : 'rgba(255,255,255,0.14)')) + ';') + '"></span>';
    }
    // Avec un planning : séances prévues faites / prévues. Sans : séances faites / objectif du profil.
    var visee2 = prevues || objectifHebdo(), fait2 = prevues ? prevuesFaites : total, reste = visee2 - fait2;
    var sous = reste <= 0 ? 'Objectif atteint' : (reste === 1 ? 'Plus qu\'une pour l\'objectif' : 'Encore ' + reste + ' pour l\'objectif');
    var t2 = tuile('calendrier', '#a78bfa', 'CETTE SEMAINE', Math.min(fait2, 99) + ' / ' + visee2 + ' séance' + (visee2 > 1 ? 's' : ''),
      '<div style="display:flex;justify-content:space-between;margin:9px 0 2px;">' + points + '</div>', sous, 'switchTab(\'calendar\')');
    return '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;">' + t1 + t2 + '</div>';
  }
  function barreHTML(r) {
    var pct = Math.max(0, Math.min(100, Math.round((r || 0) * 100)));
    return '<div style="height:6px;border-radius:99px;background:rgba(255,255,255,0.08);overflow:hidden;margin:9px 0 2px;">' +
      '<div style="height:100%;width:' + pct + '%;background:' + ACCENT + ';border-radius:99px;"></div></div>';
  }
  function tuile(icone, couleur, lbl, valeur, milieu, sous, action) {
    return '<button class="ahp-tile" onclick="' + action + '">' +
        '<span style="display:flex;">' + ico(icone, 18, couleur) + '</span>' +
        '<span class="ahp-kick" style="display:block;margin-top:9px;">' + lbl + '</span>' +
        '<span style="display:block;font-family:var(--font-display);font-size:1.02em;font-weight:800;color:#f8fafc;margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + valeur + '</span>' +
        milieu +
        '<span style="display:block;font-size:0.7em;color:#a3b1c2;margin-top:5px;">' + esc(sous) + '</span>' +
      '</button>';
  }

  // ── Carte quête (mode jeu) ou muscles à prévoir ──
  function queteHTML(info, hist) {
    if (jeuActif() && typeof window.rpgGetDailyQuests === 'function') {
      var q = [];
      try { q = window.rpgGetDailyQuests() || []; } catch (e) {}
      if (q.length) {
        var a = q.filter(function (x) { return !x.done; })[0];
        var reste = q._timeLeft || '';
        var texte = a
          ? esc(a.name) + ' <span style="color:#94a3b8;">(' + (a.progress || 0) + ' / ' + a.target + ')</span>'
          : 'Les quêtes du jour sont accomplies. De nouvelles arrivent demain.';
        var detail = a ? '+' + (a.xpReward || 0) + ' XP' + (reste ? ' · ' + esc(reste) : '') : (q.length + ' / ' + q.length + ' terminées');
        return '<button class="ahp-card ahp-quest" onclick="switchTab(\'game\')">' +
            '<span style="display:flex;align-items:center;gap:9px;">' + ico('bouclier', 19, '#a78bfa') +
              '<span style="font-size:0.95em;font-weight:800;color:#f8fafc;">' + (a ? 'Une quête à accomplir' : 'Quêtes du jour accomplies') + '</span></span>' +
            '<span style="display:block;font-size:0.82em;color:#e2e8f0;margin-top:8px;line-height:1.45;">' + texte + '</span>' +
            '<span style="display:block;font-size:0.72em;color:#94a3b8;margin-top:5px;">' + detail + '</span>' +
          '</button>';
      }
    }
    // Hors jeu : les grands muscles pas encore travaillés depuis lundi
    var debut = lundiDe(new Date()), compte = {};
    hist.forEach(function (w) {
      if (dateSeance(w) < debut) return;
      try {
        if (typeof accumulateWeightedMuscles === 'function') accumulateWeightedMuscles(w, compte);
        else (w.musclesWorked || w.muscles || []).forEach(function (m) { compte[m] = (compte[m] || 0) + 1; });
      } catch (e) {}
    });
    var aPrevoir = MUSCLES_CLES.filter(function (m) { return !compte[m]; });
    if (!aPrevoir.length || aPrevoir.length === MUSCLES_CLES.length) return '';
    return '<div class="ahp-card ahp-quest" style="cursor:default;">' +
        '<span style="display:flex;align-items:center;gap:9px;">' + ico('cible', 19, '#a78bfa') +
          '<span style="font-size:0.95em;font-weight:800;color:#f8fafc;">À prévoir cette semaine</span></span>' +
        '<span style="display:block;font-size:0.82em;color:#e2e8f0;margin-top:8px;line-height:1.45;">Pas encore travaillés : ' +
          esc(aPrevoir.slice(0, 5).join(', ')) + (aPrevoir.length > 5 ? '…' : '') + '</span>' +
      '</div>';
  }

  // ── « Ou choisir une autre activité » ──
  window.awakAutreActivite = function () {
    var vieux = document.getElementById('awakAutreModal'); if (vieux) vieux.remove();
    var ov = document.createElement('div');
    ov.id = 'awakAutreModal';
    ov.style.cssText = 'position:fixed;inset:0;z-index:12000;background:rgba(0,0,0,0.75);display:flex;align-items:flex-end;justify-content:center;';
    ov.onclick = function (e) { if (e.target === ov) ov.remove(); };
    var f = 'document.getElementById(\'awakAutreModal\').remove();';
    var L = [
      ['halter', ACCENT, 'Séance libre', 'Compose-la, ou laisse le Système choisir', f + 'switchTab(\'workouts\');window.scrollTo(0,0)'],
      ['liste', '#93c5fd', 'Mes routines', 'Tes séances enregistrées', f + 'switchTab(\'routines\')'],
      ['course', '#93c5fd', 'Course, marche ou vélo', 'Sortie au GPS ou sur tapis', f + 'switchTab(\'course\')'],
      ['soleil', '#fbbf24', 'Réveil du corps', 'Mobilité douce, sans matériel', f + 'if(typeof showMorningRoutineModal===\'function\')showMorningRoutineModal()'],
      ['calendrier', '#a78bfa', 'Planifier ma semaine', 'Choisir quoi faire chaque jour', f + 'if(typeof openManualPlanEditor===\'function\')openManualPlanEditor();else switchTab(\'calendar\')']
    ].map(function (x) {
      return '<button class="ahp-row" onclick="' + x[4] + '">' +
          '<span class="ahp-ic">' + ico(x[0], 18, x[1]) + '</span>' +
          '<span style="flex:1;min-width:0;"><span style="display:block;font-size:0.9em;font-weight:700;color:#f1f5f9;">' + x[2] + '</span>' +
          '<span style="display:block;font-size:0.76em;color:#a3b1c2;margin-top:2px;">' + x[3] + '</span></span>' +
          '<span style="color:#475569;font-size:1.2em;">›</span></button>';
    }).join('');
    ov.innerHTML = '<div style="width:100%;max-width:480px;background:#12161c;border:1px solid rgba(255,255,255,0.08);border-radius:18px 18px 0 0;padding:16px 16px calc(env(safe-area-inset-bottom,0px) + 18px);box-sizing:border-box;">' +
        '<div style="width:40px;height:4px;background:rgba(255,255,255,0.12);border-radius:99px;margin:0 auto 12px;"></div>' +
        '<div style="font-size:1.02em;font-weight:800;color:#f1f5f9;margin-bottom:6px;">Une autre activité</div>' + L + '</div>';
    document.body.appendChild(ov);
  };

  // ═══ MONTAGE ═══════════════════════════════════════════════════════
  // Conteneurs conditionnels conservés (déplacés dans la nouvelle page).
  var AVANT = ['resumeSessionCard', 'recoveryBannerContainer', 'familyNudgeInbox', 'youthSafetyBanner'];
  var APRES = ['eveilJourneyCard', 'badgesEnfantCard', 'activeCelebBanner', 'activePlanContainer',
               'groupWorkoutBtnContainer', 'homeRpgCard', 'fatigueAlertCard'];

  function monter() {
    var tab = document.getElementById('homeTab');
    if (!tab) return null;
    var root = document.getElementById('ahpRoot');
    if (root) return root;
    root = document.createElement('div');
    root.id = 'ahpRoot';
    root.innerHTML =
      '<div id="ahpEntete"></div>' +
      '<div id="ahpAvant"></div>' +
      '<div id="ahpAujourdhui"></div>' +
      '<div id="ahpSemaine"></div>' +
      '<div id="ahpApres"></div>' +
      '<div id="ahpRaccourcis"></div>';
    tab.insertBefore(root, tab.firstChild);
    function deplacer(ids, hoteId) {
      var hote = document.getElementById(hoteId);
      ids.forEach(function (i) {
        var el = document.getElementById(i);
        if (el && hote) { el.style.marginTop = '0'; hote.appendChild(el); }
      });
    }
    deplacer(AVANT, 'ahpAvant');
    deplacer(APRES, 'ahpApres');
    // Les deux zones partagent la règle « vide = invisible »
    ['ahpAvant', 'ahpApres'].forEach(function (i) { document.getElementById(i).setAttribute('data-ahp-extras', '1'); });
    return root;
  }

  function render() {
    try {
      styles();
      var root = monter();
      if (!root) return;
      var info = profilActif();
      var pl = planning(info.id);
      var hist = historique(info.id);
      // v1318 : carte héros · tuiles · quête
      document.getElementById('ahpEntete').innerHTML = heroHTML(info, pl, hist);
      document.getElementById('ahpAujourdhui').innerHTML = tuilesHTML(info, pl, hist);
      document.getElementById('ahpSemaine').innerHTML = queteHTML(info, hist);
      document.getElementById('ahpRaccourcis').innerHTML = raccourcisHTML();
    } catch (e) { try { console.warn('AwakHomePro', e); } catch (x) {} }
  }

  window.AwakHomePro = { render: render };

  function init() { render(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else setTimeout(init, 0);
})();
