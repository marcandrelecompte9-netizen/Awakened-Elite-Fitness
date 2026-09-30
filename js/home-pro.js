/* ═══════════════════════════════════════════════════════════════════════
   🏠  ACCUEIL « PRO » — Awakened
   -----------------------------------------------------------------------
   Remplace l'empilement de cartes de l'accueil par 4 blocs, dans un seul
   style (cartes neutres, un accent cyan, aucun halo ni coin lumineux) :
     1. En-tête    : salutation, nom, date, avatar (changer de profil)
     2. Aujourd'hui: la séance prévue + UN bouton principal
     3. Ta semaine : une seule bande de 7 jours + série + muscles à prévoir
     4. Raccourcis : liste uniforme (Routines, Exercices, Réveil, Douleur…)

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
      '[data-ahp-extras] > *{margin-bottom:12px;}';
    document.head.appendChild(st);
  }

  // ═══ 1. EN-TÊTE ════════════════════════════════════════════════════
  function enteteHTML(info) {
    var p = info.profil || {};
    var nom = p.name || (document.getElementById('userName') || {}).textContent || '';
    if (/^\s*(Mon profil|Athlète)\s*$/i.test(nom)) nom = '';
    var h = new Date().getHours();
    var salut = h < 5 ? 'Bonne nuit' : h < 12 ? 'Bonjour' : h < 18 ? 'Bon après-midi' : 'Bonsoir';
    var d = new Date();
    var date = JOURS_LONG[wIdx(d)] + ' ' + d.getDate() + ' ' + MOIS[d.getMonth()];
    var avatar = '';
    try { avatar = (typeof renderAvatar === 'function') ? renderAvatar(p.avatar, 40) : ''; } catch (e) {}
    if (!avatar) avatar = ico('groupe', 20, '#94a3b8');

    return '<div style="display:flex;align-items:center;gap:12px;margin:2px 2px 14px;">' +
        '<div style="flex:1;min-width:0;">' +
          '<div class="ahp-lbl">' + esc(date) + '</div>' +
          '<div style="font-family:var(--font-display);font-size:1.45em;font-weight:800;color:#f1f5f9;line-height:1.15;margin-top:2px;' +
            'white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + esc(salut) + (nom ? ', ' + esc(nom) : '') + '</div>' +
        '</div>' +
        '<button onclick="if(typeof showProfileSelectionModal===\'function\')showProfileSelectionModal()" aria-label="Changer de profil" ' +
          'data-emoji-keep="1" style="flex-shrink:0;width:44px;height:44px;border-radius:50%;cursor:pointer;padding:0;' +
          'background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);display:flex;align-items:center;justify-content:center;overflow:hidden;">' +
          avatar + '</button>' +
      '</div>';
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

  function conseilDuJour() {
    try {
      var dec = (typeof makeIntelligentDecisions === 'function') ? makeIntelligentDecisions() : null;
      var r = dec && dec.reasoning && dec.reasoning[0];
      if (!r) return '';
      return String(r).replace(/<[^>]*>/g, '').trim();
    } catch (e) { return ''; }
  }

  function aujourdhuiHTML(info, pl) {
    var id = info.id;
    var auj = seanceDu(pl, id, new Date());
    var aPlan = Object.keys(pl.plan || {}).length > 0;
    var titre, sous = '', boutons = '', etiquette;

    if (auj) {
      var s = auj.s;
      etiquette = auj.faite ? 'Séance du jour · faite' : 'Séance du jour';
      titre = s.label || s.muscles.slice(0, 3).join(' · ');
      var bits = [];
      if (s.label) bits.push(s.muscles.slice(0, 4).join(' · '));
      if (auj.heure) bits.push(fmtH(auj.heure));
      sous = bits.join('  ·  ');
      // Le conseil vient du moteur intelligent : hors-sujet si on suit une routine ou un programme
      var conseil = (s.source === 'routine' || s.source === 'programme') ? '' : conseilDuJour();
      // Pas de redite : « Plan du jour : Tirage » sous le titre « Tirage »
      if (conseil && (conseil.indexOf(titre) >= 0 || /^plan du jour/i.test(conseil))) conseil = '';
      var go = s.routineId
        ? 'if(typeof startRoutineById===\'function\')startRoutineById(\'' + esc(s.routineId) + '\')'
        : (s.source === 'programme' && s.planWeek
          ? 'if(typeof startPlanSession===\'function\')startPlanSession(' + (+s.planWeek) + ',' + (+s.planIdx) + ')'
          : 'switchTab(\'workouts\');window.scrollTo(0,0)');
      boutons = auj.faite
        ? '<button class="ahp-btn ahp-btn-s" onclick="switchTab(\'history\')">Voir ma progression</button>'
        : '<button class="ahp-btn ahp-btn-p" onclick="' + go + '">' + ico('halter', 18, '#04121f') + 'Démarrer la séance</button>';
      if (conseil && !auj.faite) {
        sous += '<div style="margin-top:8px;font-size:0.92em;color:#64748b;">' + esc(conseil) + '</div>';
      }
    } else if (aPlan) {
      etiquette = 'Aujourd\'hui';
      titre = 'Jour de repos';
      var pr = prochaine(pl, id);
      if (pr) {
        var quand = pr.k === 1 ? 'demain' : JOURS_LONG[wIdx(pr.d)].toLowerCase();
        sous = 'Prochaine séance ' + quand + ' : ' + esc(pr.e.s.label || pr.e.s.muscles.slice(0, 2).join(' · ')) +
          (pr.e.heure ? ' à ' + esc(fmtH(pr.e.heure)) : '');
      } else {
        sous = 'La récupération fait partie de l\'entraînement.';
      }
      boutons =
        '<div style="display:flex;gap:8px;">' +
          '<button class="ahp-btn ahp-btn-s" style="flex:1;" onclick="if(typeof showMorningRoutineModal===\'function\')showMorningRoutineModal()">' +
            ico('soleil', 17, '#fbbf24') + 'Mobilité douce</button>' +
          '<button class="ahp-btn ahp-btn-s" style="flex:1;" onclick="switchTab(\'workouts\');window.scrollTo(0,0)">Séance libre</button>' +
        '</div>';
    } else {
      etiquette = 'Aujourd\'hui';
      titre = 'Aucune séance planifiée';
      sous = 'Lance une séance maintenant, ou organise ta semaine.';
      boutons =
        '<button class="ahp-btn ahp-btn-p" onclick="switchTab(\'workouts\');window.scrollTo(0,0)">' + ico('halter', 18, '#04121f') + 'Démarrer une séance</button>' +
        '<button class="ahp-btn ahp-btn-s" style="margin-top:8px;" onclick="if(typeof openManualPlanEditor===\'function\')openManualPlanEditor();else switchTab(\'calendar\')">' +
          ico('calendrier', 17, '#94a3b8') + 'Planifier ma semaine</button>';
    }

    return '<div class="ahp-card">' +
        '<div class="ahp-lbl" style="color:' + (auj && !auj.faite ? ACCENT : '#94a3b8') + ';">' + esc(etiquette) + '</div>' +
        '<div style="font-family:var(--font-display);font-size:1.3em;font-weight:800;color:#f1f5f9;margin-top:4px;line-height:1.2;">' + esc(titre) + '</div>' +
        (sous ? '<div style="font-size:0.8em;color:#94a3b8;margin-top:5px;line-height:1.45;">' + sous + '</div>' : '') +
        '<div style="margin-top:14px;">' + boutons + '</div>' +
      '</div>';
  }

  // ═══ 3. TA SEMAINE ═════════════════════════════════════════════════
  function semaineHTML(info, pl, hist) {
    var id = info.id;
    var today = new Date();
    var debut = lundiDe(today);
    var prevues = 0, faites = 0, cases = '';
    var faitesDates = {};
    hist.forEach(function (w) { var d = dateSeance(w); if (!isNaN(d)) faitesDates[ymd(d)] = true; });

    for (var i = 0; i < 7; i++) {
      var d = new Date(debut.getFullYear(), debut.getMonth(), debut.getDate() + i);
      var e = seanceDu(pl, id, d);
      var fait = !!faitesDates[ymd(d)];
      var estAuj = ymd(d) === ymd(today);
      var passe = d < new Date(today.getFullYear(), today.getMonth(), today.getDate());
      if (e) { prevues++; if (fait) faites++; }

      // État de la pastille : faite (plein) · prévue (contour) · repos (discret)
      var bg = 'transparent', bord = 'rgba(255,255,255,0.06)', col = '#475569', contenu = String(d.getDate());
      if (fait) { bg = ACCENT; bord = ACCENT; col = '#04121f'; contenu = ico('valide', 15, '#04121f') || '✓'; }
      else if (e) { bord = passe ? 'rgba(248,113,113,0.45)' : 'rgba(34,211,238,0.55)'; col = '#e2e8f0'; }
      if (estAuj && !fait) { bord = ACCENT; col = ACCENT; }

      cases += '<div style="flex:1;min-width:0;display:flex;flex-direction:column;align-items:center;gap:6px;">' +
          '<span style="font-size:0.62em;font-weight:700;color:' + (estAuj ? ACCENT : '#64748b') + ';">' + LETTRES[i] + '</span>' +
          '<span style="width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;' +
            'background:' + bg + ';border:1.5px solid ' + bord + ';color:' + col + ';font-size:0.8em;font-weight:800;' +
            'font-family:var(--font-display);">' + contenu + '</span>' +
        '</div>';
    }

    // Séances faites cette semaine (même hors planning)
    var total = 0;
    hist.forEach(function (w) { var d = dateSeance(w); if (!isNaN(d) && d >= debut) total++; });
    var sr = serie(hist);

    // Muscles pas encore travaillés depuis lundi
    var compte = {};
    hist.forEach(function (w) {
      if (dateSeance(w) < debut) return;
      try {
        if (typeof accumulateWeightedMuscles === 'function') accumulateWeightedMuscles(w, compte);
        else (w.musclesWorked || w.muscles || []).forEach(function (m) { compte[m] = (compte[m] || 0) + 1; });
      } catch (e) {}
    });
    var aPrevoir = MUSCLES_CLES.filter(function (m) { return !compte[m]; });

    var chiffres = [];
    chiffres.push('<b style="color:#f1f5f9;">' + (prevues ? faites + '/' + prevues : total) + '</b> ' + (prevues ? 'séances prévues' : 'séance' + (total > 1 ? 's' : '')));
    if (sr > 0) chiffres.push('<b style="color:#f1f5f9;">' + sr + '</b> jour' + (sr > 1 ? 's' : '') + ' de suite');

    return '<div class="ahp-card" onclick="switchTab(\'calendar\')" style="cursor:pointer;">' +
        '<div style="display:flex;align-items:baseline;justify-content:space-between;gap:8px;margin-bottom:12px;">' +
          '<span style="font-size:0.95em;font-weight:800;color:#f1f5f9;">Ta semaine</span>' +
          '<span style="font-size:0.72em;color:#94a3b8;">' + chiffres.join('  ·  ') + '</span>' +
        '</div>' +
        sourceChipHTML(id) +
        '<div style="display:flex;gap:2px;">' + cases + '</div>' +
        (aPrevoir.length && aPrevoir.length < MUSCLES_CLES.length
          ? '<div style="margin-top:12px;font-size:0.72em;color:#64748b;line-height:1.45;">Pas encore travaillés : ' +
              '<span style="color:#94a3b8;">' + esc(aPrevoir.slice(0, 5).join(', ')) + (aPrevoir.length > 5 ? '…' : '') + '</span></div>'
          : '') +
      '</div>';
  }

  // ── Choix du planning suivi (routine / plan / programme / auto) ──
  var SRC_LIB = {
    auto:      { t: 'Automatique',       d: 'Routines d\'abord, puis ton plan de la semaine' , ic: 'grille' },
    routine:   { t: 'Mes routines',      d: 'Les routines assignées aux jours',                ic: 'liste' },
    ia:        { t: 'Plan de la semaine', d: 'Plan intelligent, manuel ou programme star',     ic: 'eclair' },
    programme: { t: 'Programme',         d: 'La semaine en cours de ton programme',           ic: 'trophee' }
  };
  function sourceChipHTML(id) {
    var P = window.AwakCalPlan;
    if (!P || !P.sourcePref) return '';
    var v = P.sourcePref(id), L = SRC_LIB[v] || SRC_LIB.auto;
    var nom = L.t;
    if (v === 'programme') { try { var dp = P.sourcesDispo(id); if (dp.nomProgramme) nom = dp.nomProgramme; } catch (e) {} }
    return '<button onclick="event.stopPropagation();awakChoisirPlanning()" style="display:flex;align-items:center;gap:7px;width:100%;min-height:auto;' +
        'margin:0 0 12px;padding:7px 10px;border-radius:10px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);' +
        'color:#cbd5e1;font-family:inherit;font-size:0.74em;font-weight:700;cursor:pointer;text-align:left;">' +
        ico(L.ic, 15, ACCENT) +
        '<span style="color:#64748b;">Planning suivi :</span>' +
        '<span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#f1f5f9;">' + esc(nom) + '</span>' +
        '<span style="color:' + ACCENT + ';">Changer</span></button>';
  }

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
            '<span style="display:block;font-size:0.7em;color:#64748b;margin-top:1px;">' + detail + '</span>' +
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
      document.getElementById('ahpEntete').innerHTML = enteteHTML(info);
      document.getElementById('ahpAujourdhui').innerHTML = aujourdhuiHTML(info, pl);
      document.getElementById('ahpSemaine').innerHTML = semaineHTML(info, pl, hist);
      document.getElementById('ahpRaccourcis').innerHTML = raccourcisHTML();
    } catch (e) { try { console.warn('AwakHomePro', e); } catch (x) {} }
  }

  window.AwakHomePro = { render: render };

  function init() { render(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else setTimeout(init, 0);
})();
