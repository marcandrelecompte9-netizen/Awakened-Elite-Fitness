/* ═══════════════════════════════════════════════════════════════════════
   GESTES TACTILES — Awakened
   -----------------------------------------------------------------------
   1. Fenêtres du bas : tirer vers le bas pour fermer (poignée ou contenu
      déjà en haut). La fermeture passe par back-button.js (même logique
      que le bouton Retour : jamais un « ✕ » de suppression).
   2. Séance : glisser l'image d'exercice → suivant (gauche) / précédent (droite).
   3. Agenda : glisser → semaine / mois suivant ou précédent.
   4. Sous-onglets (Séance libre · Mes routines · Programme · Course · Défis,
      Exercices · Calculateurs) : glisser le contenu pour changer.
   5. Routines : glisser une carte vers la gauche → actions (dupliquer,
      imprimer, supprimer…). Aussi via le bouton « ⋯ ».
   6. Éditeur de routine : appui long sur un exercice puis glisser pour
      le déplacer.
   7. (v1233) Inscription : glisser à gauche = suivant, à droite = retour.
   8. Séance : appui long sur − / + = défilement rapide ; double-toucher
      l'image d'exercice = valider la série.
   9. Repos : glisser vers le HAUT = passer le repos ; toucher l'anneau = pause.
  10. Historique : glisser une séance vers la gauche → Rejouer / Favori / Supprimer.
  11. Onglets principaux : glisser entre Accueil · Progression · Agenda · Famille
      (l'Agenda garde son glisser de mois sur le calendrier lui-même).

   Garde-fous :
   • un glissement doit être nettement HORIZONTAL (|dx| > 1,6 × |dy|) ;
   • on ignore les départs à moins de 22 px des bords (geste Retour d'Android) ;
   • on ignore les champs, curseurs, silhouettes qui pivotent
     ([data-awak-flip]) et tout ce qui défile déjà horizontalement ;
   • un simple toucher reste un toucher.
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var BORD = 22;
  var GROUPES = [
    ['workouts', 'routines', 'program', 'course', 'challenges'],
    ['exercises', 'calculators']
  ];
  var PRINCIPAUX = ['home', 'history', 'calendar', 'family'];
  function ongletVisible(id) {
    var b = document.querySelector('#mobileNavBar [onclick="switchTab(\'' + id + '\')"]');
    return !b || (b.style.display !== 'none' && getComputedStyle(b).display !== 'none');
  }
  var JAMAIS = ['toastContainer', 'mobileNavBar', 'globalRestBanner', 'awakPauseOverlay', 'exerciseView', 'appHeader'];

  function enSeance() { return document.body.classList.contains('in-session'); }
  function vibrer(ms) { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) {} }
  function exclu(t) {
    return !!(t && t.closest && t.closest('input, textarea, select, [contenteditable="true"], [data-awak-flip], [data-no-swipe]'));
  }
  // Un ancêtre défile-t-il déjà horizontalement ? (carrousels, tableaux…)
  function dansDefilementH(t, limite) {
    var el = t;
    while (el && el !== limite && el !== document.body) {
      if (el.nodeType === 1 && el.scrollWidth > el.clientWidth + 4) {
        var ox = getComputedStyle(el).overflowX;
        if (ox === 'auto' || ox === 'scroll') return true;
      }
      el = el.parentElement;
    }
    return false;
  }
  // Fenêtre plein écran (enfant direct du body, position fixe) contenant t
  function fenetreDe(t) {
    var el = t;
    while (el && el.parentElement && el.parentElement !== document.body) el = el.parentElement;
    if (!el || el.parentElement !== document.body || JAMAIS.indexOf(el.id) >= 0) return null;
    var st = getComputedStyle(el);
    if (st.position !== 'fixed' || (parseInt(st.zIndex, 10) || 0) < 900) return null;
    return el;
  }
  function ongletActif() {
    var a = document.querySelector('.tab-content.active');
    return a ? a.id.replace(/Tab$/, '') : null;
  }
  function glisserEntree(el, sens) {
    try {
      el.animate([{ transform: 'translateX(' + (sens * 28) + 'px)', opacity: 0.35 },
                  { transform: 'translateX(0)', opacity: 1 }], { duration: 220, easing: 'ease-out' });
    } catch (e) {}
  }

  // ═══ 5. ACTIONS D'UNE ROUTINE (feuille du bas) ══════════════════════
  window.awakRoutineActions = function (idx) {
    var r = null;
    try { r = (typeof getRoutines === 'function') ? getRoutines()[idx] : null; } catch (e) {}
    if (!r) return;
    var old = document.getElementById('awakRoutineActions'); if (old) old.remove();
    var ico = function (d) {
      return '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + d + '</svg>';
    };
    var ligne = function (action, icone, texte, coul) {
      return '<button data-act="' + action + '" style="display:flex;align-items:center;gap:13px;width:100%;min-height:auto;padding:14px 12px;'
        + 'border:none;border-radius:12px;background:transparent;color:' + (coul || '#e2e8f0') + ';font-family:inherit;'
        + 'font-size:0.92em;font-weight:800;text-align:left;cursor:pointer;">' + ico(icone) + texte + '</button>';
    };
    var nom = String(r.name || 'Routine').replace(/[<>&"]/g, '');
    var ov = document.createElement('div');
    ov.id = 'awakRoutineActions';
    ov.style.cssText = 'position:fixed;inset:0;z-index:12000;background:rgba(0,0,0,0.7);display:flex;align-items:flex-end;justify-content:center;';
    ov.onclick = function (e) { if (e.target === ov) ov.remove(); };
    ov.innerHTML = '<div style="width:100%;max-width:480px;background:#12161c;border:1px solid rgba(255,255,255,0.08);border-radius:18px 18px 0 0;'
      + 'padding:10px 10px calc(16px + env(safe-area-inset-bottom));box-sizing:border-box;">'
      + '<div style="width:40px;height:4px;background:rgba(255,255,255,0.18);border-radius:99px;margin:2px auto 10px;"></div>'
      + '<div style="font-size:0.95em;font-weight:900;color:#fff;padding:0 12px 8px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + nom + '</div>'
      + ((r.exercises || []).length ? ligne('start', '<path d="M7 4v16l13-8z"/>', 'Démarrer', '#67e8f9') : '')
      + ligne('edit', '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>', 'Modifier')
      + ligne('dup', '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>', 'Dupliquer')
      + ligne('print', '<path d="M6 9V3h12v6"/><rect x="4" y="9" width="16" height="8" rx="2"/><path d="M7 14h10v7H7z"/>', 'Imprimer')
      + '<div style="height:1px;background:rgba(255,255,255,0.06);margin:4px 8px;"></div>'
      + ligne('del', '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>', 'Supprimer', '#f87171')
      + '</div>';
    ov.querySelectorAll('[data-act]').forEach(function (b) {
      b.onclick = function () {
        var a = b.getAttribute('data-act');
        ov.remove();
        try {
          if (a === 'start' && typeof startRoutine === 'function') startRoutine(idx);
          else if (a === 'edit' && typeof editRoutine === 'function') editRoutine(idx);
          else if (a === 'dup' && typeof duplicateRoutine === 'function') duplicateRoutine(idx);
          else if (a === 'print' && window.AwakRoutinePrint) window.AwakRoutinePrint.ouvrir(idx);
          else if (a === 'del' && typeof deleteRoutine === 'function') deleteRoutine(idx);
        } catch (e) {}
      };
    });
    document.body.appendChild(ov);
  };

  // ═══ MOTEUR ═════════════════════════════════════════════════════════
  var g = null;        // geste en cours
  var appui = null;    // appui long (éditeur de routine)

  document.addEventListener('touchstart', function (e) {
    if (e.touches.length !== 1) { g = null; return; }
    var t = e.touches[0], cible = e.target;
    g = { x: t.clientX, y: t.clientY, t0: Date.now(), cible: cible, mode: null, fen: fenetreDe(cible) };

    // ── 6. appui long dans l'éditeur de routine ──
    var carte = cible.closest && cible.closest('[data-awak-ex]');
    if (carte && !cible.closest('input, select, textarea, button')) {
      appui = { carte: carte, x: t.clientX, y: t.clientY, actif: false };
      appui.timer = setTimeout(function () { demarrerDeplacement(); }, 450);
    }

    // ── 1. fenêtre du bas : préparer un éventuel glisser vers le bas ──
    if (g.fen && !exclu(cible)) {
      var feuille = null;
      for (var i = 0; i < g.fen.children.length; i++) {
        if (g.fen.children[i].contains(cible)) { feuille = g.fen.children[i]; break; }
      }
      if (feuille) {
        var r = feuille.getBoundingClientRect();
        if (r.bottom >= window.innerHeight - 6 && r.top > 30) {
          // Contenu déjà en haut ? (sinon le geste fait défiler, normalement)
          var enHaut = true, el = cible;
          while (el && el !== g.fen) { if (el.scrollTop > 0) { enHaut = false; break; } el = el.parentElement; }
          var poignee = (t.clientY - r.top) < 64;
          if (poignee || enHaut) g.feuille = { el: feuille, top: r.top };
        }
      }
    }
  }, { passive: true });

  document.addEventListener('touchmove', function (e) {
    if (!g) return;
    var t = e.touches[0], dx = t.clientX - g.x, dy = t.clientY - g.y;

    // Appui long : un mouvement avant le délai l'annule (c'est un défilement)
    if (appui && !appui.actif && (Math.abs(t.clientX - appui.x) > 10 || Math.abs(t.clientY - appui.y) > 10)) {
      clearTimeout(appui.timer); appui = null;
    }
    if (appui && appui.actif) {
      e.preventDefault();
      deplacer(t.clientY - appui.y);
      return;
    }

    // Glisser une fenêtre vers le bas
    if (g.feuille && g.mode !== 'h') {
      if (!g.mode && dy > 8 && dy > Math.abs(dx) * 1.2) g.mode = 'sheet';
      if (!g.mode && (dy < -6 || Math.abs(dx) > 10)) g.feuille = null;
      if (g.mode === 'sheet') {
        e.preventDefault();
        var d = Math.max(0, dy);
        g.feuille.el.style.transition = 'none';
        g.feuille.el.style.transform = 'translateY(' + d + 'px)';
        return;
      }
    }
    if (!g.mode && Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy) * 1.6) g.mode = 'h';
  }, { passive: false });

  document.addEventListener('touchend', function (e) {
    if (appui) {
      clearTimeout(appui.timer);
      if (appui.actif) { finirDeplacement(); g = null; return; }
      appui = null;
    }
    if (!g) return;
    var geste = g; g = null;
    var t = e.changedTouches[0], dx = t.clientX - geste.x, dy = t.clientY - geste.y;
    var dt = Math.max(1, Date.now() - geste.t0);

    // ── 1. fermeture d'une fenêtre ──
    if (geste.mode === 'sheet') {
      var f = geste.feuille.el;
      if (dy > 110 || (dy > 55 && dy / dt > 0.55)) {
        f.style.transition = 'transform 0.18s ease-in';
        f.style.transform = 'translateY(100%)';
        setTimeout(function () {
          var ferme = false;
          try { if (window.awakFermerFenetre) ferme = window.awakFermerFenetre(geste.fen); } catch (er) {}
          if (!ferme || document.body.contains(f)) {
            // pas fermée : on la remet en place
            if (document.body.contains(f)) { f.style.transition = 'transform 0.2s ease-out'; f.style.transform = ''; }
          }
        }, 170);
      } else {
        f.style.transition = 'transform 0.2s ease-out';
        f.style.transform = '';
      }
      return;
    }

    // ── 9. repos : glisser vers le haut = passer ──
    if (dy < -90 && Math.abs(dy) > Math.abs(dx) * 1.5 && dt < 900) {
      var repos = geste.cible.closest && geste.cible.closest('#restOverlay');
      if (repos && !geste.cible.closest('button')) {
        try {
          repos.animate([{ transform: 'translateY(0)', opacity: 1 }, { transform: 'translateY(-60px)', opacity: 0.4 }], { duration: 180, easing: 'ease-in' });
        } catch (er) {}
        vibrer(12);
        setTimeout(function () { try { if (typeof skipRestOverlay === 'function') skipRestOverlay(); } catch (er) {} }, 150);
        return;
      }
    }

    // ── gestes horizontaux ──
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.6 || dt > 900) return;
    if (geste.x < BORD || geste.x > window.innerWidth - BORD) return;
    var c = geste.cible;
    if (exclu(c)) return;
    var sens = dx < 0 ? 1 : -1;        // 1 = vers la gauche = « suivant »

    // 2. Séance : image d'exercice
    var cadre = c.closest && c.closest('#exerciseVisualFrame');
    if (cadre && enSeance()) {
      if (c.closest('button')) return;
      glisserEntree(cadre, sens);
      try {
        if (sens > 0) { if (typeof skipExercise === 'function') skipExercise(); }
        else if (typeof goToPreviousExercise === 'function') goToPreviousExercise();
      } catch (er) {}
      vibrer(12);
      return;
    }
    // 7. Inscription
    var onb = c.closest && c.closest('#_premOnbOverlay');
    if (onb) {
      if (dansDefilementH(c, onb)) return;
      try {
        if (sens > 0) { if (onb.querySelector('[onclick="window._premOnbNext()"]') && window._premOnbNext) window._premOnbNext(); }
        else if (window._premOnbPrev) window._premOnbPrev();
      } catch (er) {}
      return;
    }
    if (geste.fen) return;   // dans une fenêtre : seul le glisser vers le bas compte
    if (dansDefilementH(c, document.body)) return;

    // 5. Carte de routine → actions
    var carteR = c.closest && c.closest('[data-awak-routine]');
    if (carteR && sens > 0) {
      try {
        carteR.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-18px)' }, { transform: 'translateX(0)' }],
          { duration: 220, easing: 'ease-out' });
      } catch (er) {}
      window.awakRoutineActions(parseInt(carteR.getAttribute('data-awak-routine'), 10));
      return;
    }

    // 10. Séance de l'historique → actions
    var carteH = c.closest && c.closest('.awk-hist[data-hist]');
    if (carteH && sens > 0) {
      try {
        carteH.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-18px)' }, { transform: 'translateX(0)' }],
          { duration: 220, easing: 'ease-out' });
      } catch (er) {}
      window.awakHistActions(carteH.getAttribute('data-hist'));
      return;
    }

    // 3. Agenda
    var agenda = c.closest && c.closest('#calendarTabContent');
    if (agenda) {
      try {
        if (sens > 0 && window.awakCalNextMonth) window.awakCalNextMonth();
        else if (sens < 0 && window.awakCalPrevMonth) window.awakCalPrevMonth();
      } catch (er) {}
      glisserEntree(agenda, sens);
      return;
    }

    // 4. Sous-onglets
    if (enSeance()) return;
    var actif = ongletActif();
    for (var k = 0; k < GROUPES.length; k++) {
      var gr = GROUPES[k], pos = gr.indexOf(actif);
      if (pos < 0) continue;
      var suiv = gr[pos + sens];
      if (!suiv) return;
      try { if (typeof switchTab === 'function') switchTab(suiv); } catch (er) {}
      var el = document.getElementById(suiv + 'Tab');
      if (el) glisserEntree(el, sens);
      return;
    }
    // 11. Onglets principaux
    var pp = PRINCIPAUX.indexOf(actif);
    if (pp >= 0) {
      var j = pp + sens;
      while (PRINCIPAUX[j] && !ongletVisible(PRINCIPAUX[j])) j += sens;
      var dest = PRINCIPAUX[j];
      if (!dest) return;
      try { if (typeof switchTab === 'function') switchTab(dest); } catch (er) {}
      var elp = document.getElementById(dest + 'Tab');
      if (elp) glisserEntree(elp, sens);
    }
  }, { passive: true });

  document.addEventListener('touchcancel', function () {
    if (appui) { clearTimeout(appui.timer); if (appui.actif) finirDeplacement(true); appui = null; }
    if (g && g.mode === 'sheet' && g.feuille) { g.feuille.el.style.transform = ''; }
    g = null;
  }, { passive: true });

  // ═══ 6. DÉPLACER UN EXERCICE (éditeur de routine) ═══════════════════
  function demarrerDeplacement() {
    if (!appui) return;
    var carte = appui.carte;
    var parent = carte.parentElement;
    var cartes = Array.prototype.slice.call(parent.querySelectorAll('[data-awak-ex]'));
    appui.actif = true;
    appui.depart = parseInt(carte.getAttribute('data-awak-ex'), 10);
    appui.milieux = cartes.map(function (c) {
      var r = c.getBoundingClientRect();
      return { i: parseInt(c.getAttribute('data-awak-ex'), 10), m: r.top + r.height / 2 };
    });
    appui.milieu = carte.getBoundingClientRect();
    appui.milieu = appui.milieu.top + appui.milieu.height / 2;
    carte.style.position = 'relative';
    carte.style.zIndex = '20';
    carte.style.transition = 'box-shadow 0.15s, transform 0s';
    carte.style.boxShadow = '0 10px 30px rgba(0,0,0,0.6), 0 0 0 2px #60a8f0';
    carte.style.background = '#151b24';
    vibrer(18);
  }
  function deplacer(dy) {
    if (!appui) return;
    appui.dy = dy;
    appui.carte.style.transform = 'translateY(' + dy + 'px) scale(1.02)';
  }
  function finirDeplacement(annule) {
    var a = appui; appui = null;
    if (!a) return;
    a.carte.style.transform = ''; a.carte.style.boxShadow = ''; a.carte.style.zIndex = '';
    a.carte.style.background = '';
    if (annule || !a.dy) return;
    var y = a.milieu + a.dy, cible = a.depart;
    // nouvelle position = nombre de cartes (hors celle-ci) dont le milieu est au-dessus
    var avant = a.milieux.filter(function (m) { return m.i !== a.depart && m.m < y; }).length;
    cible = avant;
    if (cible === a.depart) return;
    var E = window.AwakRoutineEditor;
    if (!E || typeof E.move !== 'function') return;
    try {
      if (cible > a.depart) { for (var k = a.depart; k < cible; k++) E.move(k, 1); }
      else { for (var k2 = a.depart; k2 > cible; k2--) E.move(k2, -1); }
    } catch (e) {}
    vibrer(10);
  }


  // ═══ 10. ACTIONS D'UNE SÉANCE DE L'HISTORIQUE (feuille du bas) ═══════
  window.awakHistActions = function (idTxt) {
    var e = null;
    try { e = getWorkoutHistory().find(function (w) { return String(w.id) === String(idTxt); }); } catch (er) {}
    if (!e) return;
    var id = e.id;
    var fav = false;
    try { fav = getFavoriteWorkouts().indexOf(id) > -1; } catch (er) {}
    var old = document.getElementById('awakHistActions'); if (old) old.remove();
    var ico = function (d) {
      return '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + d + '</svg>';
    };
    var ligne = function (action, icone, texte, coul) {
      return '<button data-act="' + action + '" style="display:flex;align-items:center;gap:13px;width:100%;min-height:auto;padding:14px 12px;'
        + 'border:none;border-radius:12px;background:transparent;color:' + (coul || '#e2e8f0') + ';font-family:inherit;'
        + 'font-size:0.92em;font-weight:800;text-align:left;cursor:pointer;">' + ico(icone) + texte + '</button>';
    };
    var nom = String(e.name || 'Séance').replace(/[<>&"]/g, '');
    var ov = document.createElement('div');
    ov.id = 'awakHistActions';
    ov.style.cssText = 'position:fixed;inset:0;z-index:12000;background:rgba(0,0,0,0.7);display:flex;align-items:flex-end;justify-content:center;';
    ov.onclick = function (ev) { if (ev.target === ov) ov.remove(); };
    ov.innerHTML = '<div style="width:100%;max-width:480px;background:#12161c;border:1px solid rgba(255,255,255,0.08);border-radius:18px 18px 0 0;'
      + 'padding:10px 10px calc(16px + env(safe-area-inset-bottom));box-sizing:border-box;">'
      + '<div style="width:40px;height:4px;background:rgba(255,255,255,0.18);border-radius:99px;margin:2px auto 10px;"></div>'
      + '<div style="font-size:0.95em;font-weight:900;color:#fff;padding:0 12px 8px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + nom + '</div>'
      + (e.workoutData ? ligne('replay', '<path d="M7 4v16l13-8z"/>', 'Rejouer', '#67e8f9') : '')
      + ligne('fav', '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>', fav ? 'Retirer des favoris' : 'Ajouter aux favoris', '#fbbf24')
      + '<div style="height:1px;background:rgba(255,255,255,0.06);margin:4px 8px;"></div>'
      + ligne('del', '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>', 'Supprimer', '#f87171')
      + '</div>';
    ov.querySelectorAll('[data-act]').forEach(function (b) {
      b.onclick = function () {
        var a = b.getAttribute('data-act');
        ov.remove();
        try {
          if (a === 'replay' && window.replayWorkout) window.replayWorkout(id);
          else if (a === 'fav' && window.toggleFavoriteWorkout) window.toggleFavoriteWorkout(id);
          else if (a === 'del' && window.deleteHistoryWorkout) window.deleteHistoryWorkout(id);
        } catch (er) {}
      };
    });
    document.body.appendChild(ov);
  };

  // ═══ 8. SÉANCE : appui long sur − / + ═════════════════════════════════
  function estPas(b) {
    if (!b || b.classList.contains('awk-regle-btn')) return false;
    var oc = b.getAttribute('onclick') || '';
    if (/_gridStep\(|stepUp\(|stepDown\(/.test(oc)) return true;
    var lab = b.getAttribute('aria-label') || '';
    return (lab === 'Moins' || lab === 'Plus') && !!b.closest('#exerciseView');
  }
  var rep = null;
  function stopRep() { if (rep) { clearTimeout(rep.t1); clearInterval(rep.t2); } }
  document.addEventListener('pointerdown', function (e) {
    var b = e.target.closest && e.target.closest('button');
    if (!estPas(b)) return;
    stopRep();
    rep = { b: b, n: 0, long: false };
    rep.t1 = setTimeout(function () {
      rep.long = true;
      var un = function () { try { b.click(); } catch (er) {} rep.n++; if (rep.n % 5 === 0) vibrer(5); };
      un();
      rep.t2 = setInterval(function () {
        un();
        if (rep.n === 10) { clearInterval(rep.t2); rep.t2 = setInterval(un, 45); }
      }, 110);
    }, 420);
  }, true);
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (ev) {
    document.addEventListener(ev, function () { stopRep(); }, true);
  });
  // Le « click » qui suit un appui long ne doit pas ajouter un pas de plus
  document.addEventListener('click', function (e) {
    if (rep && rep.long && e.isTrusted && e.target.closest && e.target.closest('button') === rep.b) {
      e.stopPropagation(); e.preventDefault(); rep = null;
    }
  }, true);
  document.addEventListener('contextmenu', function (e) {
    var b = e.target.closest && e.target.closest('button');
    if (estPas(b)) e.preventDefault();
  }, true);

  // ═══ 8b. double-toucher l'image = valider la série ═══════════════════
  var dernierTap = 0;
  document.addEventListener('touchend', function (e) {
    var cadre = e.target.closest && e.target.closest('#exerciseVisualFrame');
    if (!cadre || !enSeance() || e.target.closest('button') || e.changedTouches.length !== 1) { return; }
    var now = Date.now();
    if (now - dernierTap < 320) {
      dernierTap = 0;
      var v = document.querySelector('#exerciseView [onclick="completeCurrentSet()"]');
      if (v && v.offsetParent !== null && !v.disabled) {
        e.preventDefault();
        try { cadre.animate([{ transform: 'scale(1)' }, { transform: 'scale(0.97)' }, { transform: 'scale(1)' }], { duration: 200 }); } catch (er) {}
        vibrer(20);
        v.click();
      }
    } else dernierTap = now;
  }, { passive: false });

  // ═══ 9b. repos : toucher l'anneau = pause / reprise ═══════════════════
  document.addEventListener('click', function (e) {
    if (e.target.closest && e.target.closest('#restRingWrap')) {
      try { if (typeof toggleRestPause === 'function') { toggleRestPause(); vibrer(10); } } catch (er) {}
    }
  });
})();
