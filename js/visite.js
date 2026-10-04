/* ============================================================
   VISITES GUIDÉES — mini tutoriel à la 1re visite de chaque onglet
   L'écran s'assombrit, un projecteur éclaire 2 à 4 vrais éléments
   de l'onglet, une bulle explique ; « Suivant », « Passer ».
   - Une fois par onglet et par profil (_cleProfil('awakVisites')).
   - Jamais pendant une séance, une inscription ou une autre scène
     (file AwakCine) : on attend que l'écran soit libre.
   - Un élément absent ou caché est simplement sauté.
   - Utilisateurs existants (déjà des séances) : rien ne s'affiche.
   Palette cyan/violette, aucune icône emoji.
   ============================================================ */
(function () {
  'use strict';

  var CLE = 'awakVisites';

  // ── Mémoire par profil ───────────────────────────────────────
  function cleEcr() { try { return window._cleProfil ? window._cleProfil(CLE) : CLE; } catch (e) { return CLE; } }
  function cleLec() { try { return window._cleProfilLecture ? window._cleProfilLecture(CLE) : CLE; } catch (e) { return CLE; } }
  function lire() {
    try { var v = localStorage.getItem(cleLec()); return v ? JSON.parse(v) : null; } catch (e) { return null; }
  }
  function ecrire(o) { try { localStorage.setItem(cleEcr(), JSON.stringify(o)); } catch (e) {} }
  function vu(id) { var o = lire(); return !!(o && o[id]); }
  function marquer(id) { var o = lire() || {}; o[id] = 1; ecrire(o); }

  // ── Aides pour trouver les cibles ────────────────────────────
  function $(sel, racine) { try { return (racine || document).querySelector(sel); } catch (e) { return null; } }
  function parTexte(racine, sel, rx) {
    racine = typeof racine === 'string' ? document.getElementById(racine) : racine;
    if (!racine) return null;
    var l = racine.querySelectorAll(sel || 'button');
    for (var i = 0; i < l.length; i++) if (rx.test((l[i].textContent || '').trim()) && visible(l[i])) return l[i];
    return null;
  }
  function parent(el, n) { while (el && n-- > 0) el = el.parentElement; return el; }
  function visible(el) {
    if (!el || !el.isConnected) return false;
    var r = el.getBoundingClientRect();
    if (r.width < 6 || r.height < 6) return false;
    var cs = getComputedStyle(el);
    return cs.display !== 'none' && cs.visibility !== 'hidden' && cs.opacity !== '0';
  }
  // Barre Libre / Routines / Programme / Course / Défis de l'onglet donné
  function barreSeance(tab) { var b = parTexte(tab, 'button', /^Libre$/); return b ? b.parentElement : null; }

  // ── Contenu : 2 à 4 étapes par onglet ────────────────────────
  var VISITES = {
    home: [
      { c: function () { return $('#homeTab .ahp-btn-p'); }, t: 'Démarrer', d: 'Lance une séance adaptée à toi en un seul toucher.' },
      { c: function () { return $('#homeTab .ahp-btn-s'); }, t: 'Ta semaine', d: 'Choisis tes jours d\'entraînement : l\'appli prépare la semaine pour toi.' },
      { c: function () { return $('#ahpRaccourcis'); }, t: 'Raccourcis', d: 'Tes routines, la bibliothèque d\'exercices, les douleurs… et « Tout explorer » pour tout voir.' },
      { c: function () { return $('#mobileNavBar'); }, t: 'Les onglets', d: 'Séance pour t\'entraîner, Progrès pour tes résultats, Agenda pour ta semaine.' }
    ],
    workouts: [
      { c: function () { return barreSeance('workoutsTab'); }, t: 'Ta façon de t\'entraîner', d: 'Séance libre, routines, programme, course ou défis : tout part d\'ici.' },
      { c: function () { var h = $('#awakCorpsHost'); return h ? h.querySelector('button') : null; }, t: 'Lieu et matériel', d: 'Dis où tu es et ce que tu as : les exercices proposés en dépendent.' },
      { c: function () { var h = $('#awakCorpsHost'); return h ? h.querySelector('svg') : null; }, t: 'Choisis tes muscles', d: 'Touche les muscles à travailler. « Voir le dos » pour l\'arrière.' },
      { c: function () { return parTexte('workoutsTab', 'button', /FAIS MA SÉANCE/i); }, t: 'Ou laisse faire', d: 'Le Système compose ta séance du jour selon ce que tu as déjà fait.' }
    ],
    routines: [
      { c: function () { return parTexte('routinesTab', 'button', /^Nouvelle/); }, t: 'Tes routines', d: 'Crée une séance à toi et relance-la quand tu veux.' },
      { c: function () { return parTexte('routinesTab', 'button', /^Modèles/); }, t: 'Modèles', d: 'Ou pars d\'une routine toute prête, à modifier à ton goût.' },
      { c: function () { return parTexte('routinesTab', 'button', /^Plan hebdo/); }, t: 'Plan de la semaine', d: 'Place tes routines sur les jours : elles t\'attendront à l\'accueil.' }
    ],
    program: [
      { c: function () { var b = parTexte('programTab', 'button', /^Mentors$/); return b ? b.parentElement : null; }, t: 'Trois chemins', d: 'Un mentor qui te guide, un sport, ou la salle avec ses machines.' },
      { c: function () { return parTexte('programTab', 'h2', /mentor/i); }, t: 'Un programme suivi', d: 'Plusieurs semaines planifiées selon ton niveau : tu n\'as plus qu\'à suivre.' },
      { c: function () { return parTexte('programTab', 'button', /TOUS LES PROGRAMMES/i); }, t: 'Tout le catalogue', d: 'Force, perte de poids, mobilité… Choisis celui qui te ressemble.' }
    ],
    course: [
      { c: function () { var b = $('#courseTab .awak-run-act'); return b ? b.parentElement : null; }, t: 'Ton activité', d: 'Course, marche ou vélo.' },
      { c: function () { return $('#awakRunCoachChoix'); }, t: 'Le type de sortie', d: 'Libre, avec un objectif, en fractionné, ou contre ta meilleure sortie.' },
      { c: function () { return $('#awakRunGo'); }, t: 'C\'est parti', d: 'Le GPS suit ta distance et ta vitesse ; la voix t\'annonce chaque kilomètre.' },
      { c: function () { return parTexte('courseTab', 'button', /^Sans GPS/); }, t: 'Sans GPS', d: 'Tapis, vélo stationnaire ou piscine ? Passe par ici.' }
    ],
    challenges: [
      { c: function () { return $('#awakDefiEtoiles'); }, t: 'Tes étoiles', d: 'Chaque défi réussi te donne une étoile ; les étoiles font monter ton rang.' },
      { c: function () { var l = $('#challengesList'); return l ? l.querySelector(':scope > button, button') : null; }, t: 'Un défi de 30 jours', d: 'Choisis-en un : l\'appli compte tes jours et te le rappelle.' }
    ],
    history: [
      { c: function () { return $('#awakProgHaut'); }, t: 'Ton résumé', d: 'Tes séances, ton volume et ta régularité, d\'un coup d\'œil.' },
      { c: function () { return $('#awakTuileAnalyse'); }, t: 'Analyse et coach', d: 'Ce que tu devrais travailler ensuite, et pourquoi.' },
      { c: function () { return $('#awakTuileEquilibre'); }, t: 'Équilibre', d: 'Repère le muscle qui prend du retard sur les autres.' },
      { c: function () { return $('#awakCorpsCard'); }, t: 'Ton corps', d: 'Photos et mesures pour voir le changement, semaine après semaine.' }
    ],
    calendar: [
      { c: function () { return $('#calendarTabContent .card'); }, t: 'Ton planning', d: 'Touche un jour pour voir ou planifier une séance.' },
      { c: function () { var b = parTexte('calendarTab', 'button', /^Semaine$/); return b ? b.parentElement : null; }, t: 'Semaine ou mois', d: 'Change de vue selon ce que tu veux voir.' },
      { c: function () { return parTexte('calendarTab', 'button', /Mode salle/); }, t: 'Mode salle', d: 'Ta semaine en grand, lisible de loin : pose le téléphone au gym.' }
    ],
    exercises: [
      { c: function () { return $('#exerciseSearch'); }, t: 'Chercher', d: 'Trouve un exercice par son nom.' },
      { c: function () { return $('#awakFilterBar'); }, t: 'Filtrer', d: 'Par muscle et par matériel. Touche un exercice pour voir sa fiche et sa vidéo.' },
      { c: function () { return $('#awakSegCalculs'); }, t: 'Calculs', d: 'Charge maximale, disques sur la barre, rang de force.' }
    ],
    calculators: [
      { c: function () { return $('#awakCalcSrc_frc'); }, t: 'Ton rang de force', d: 'Compare ta force à celle des gens de ton poids.' },
      { c: function () { return $('#awakCalcSrc_1rm'); }, t: 'Ta charge maximale', d: 'Estime ton maximum sans le tester, à partir d\'une série.' }
    ],
    family: [
      { c: function () { return parTexte('familyTab', 'h2', /famille/i); }, t: 'Ta famille', d: 'Chacun a son profil, ses séances et sa progression.' },
      { c: function () { return parTexte('familyTab', 'button', /Ajouter un membre/); }, t: 'Ajouter quelqu\'un', d: 'Un enfant, un conjoint, un ami : vous vous suivez et vous lancez des défis.' }
    ],
    game: [
      { c: function () { return $('#awakHunterCard'); }, t: 'Ta carte', d: 'Ton rang, ton niveau et ta puissance : tout monte avec tes vraies séances.' },
      { c: function () { var s = $('#awakStatVal_STR'); return s ? parent(s, 2) : null; }, t: 'Tes attributs', d: 'À chaque niveau, tu répartis des points. Ils pèsent dans tes combats.' },
      { c: function () { return $('#awakRowBtns'); }, t: 'Compétences et équipement', d: 'Débloque des compétences, équipe ce que tu trouves dans les Failles.' },
      { c: function () { return $('#adventureContainer'); }, t: 'L\'aventure', d: 'Les Failles et les compagnons : chaque séance y fait des dégâts.' }
    ],
    settings: [
      { c: function () { return $('#settingsTab .accordion-header'); }, t: 'Réglages par thème', d: 'Touche un titre pour l\'ouvrir : jeu, entraînement, montre, audio…' },
      { c: function () { return parTexte('settingsTab', '.accordion-header', /Compte/); }, t: 'Tes données', d: 'Sauvegarde ici : tout reste sur ton téléphone tant que tu ne l\'envoies pas.' }
    ]
  };

  // ── Peut-on afficher maintenant ? ────────────────────────────
  function profilPret() {
    try {
      var k = window._cleProfilLecture ? window._cleProfilLecture('userProfile') : 'userProfile';
      var p = JSON.parse(localStorage.getItem(k) || localStorage.getItem('userProfile') || 'null');
      return !!(p && p.setupComplete);
    } catch (e) { return false; }
  }
  function ecranLibre() {
    if (document.body.classList.contains('in-session')) return false;
    if (document.querySelector('.modal.active')) return false;
    // Une fenêtre plein écran est ouverte (inscription, histoire, fiche…)
    var kids = document.body.children;
    for (var i = 0; i < kids.length; i++) {
      var el = kids[i];
      if (el.id === 'awakVisiteOverlay' || el.tagName === 'SCRIPT') continue;
      var cs = getComputedStyle(el);
      if (cs.position === 'fixed' && (parseInt(cs.zIndex, 10) || 0) >= 9000 && cs.display !== 'none'
          && el.getBoundingClientRect().height > window.innerHeight * 0.5) return false;
    }
    return true;
  }
  function ongletActif() {
    var t = document.querySelector('.tab-content.active');
    return t ? t.id.replace(/Tab$/, '') : null;
  }
  // L'onglet Jeu a déjà sa cinématique et sa fenêtre explicative : on passe après.
  function jeuPret() {
    try { return localStorage.getItem('awakEpicIntroSeen') === 'true' && localStorage.getItem('awakGameGuideSeen') === 'true'; }
    catch (e) { return true; }
  }

  // Utilisateur déjà installé avant cette fonction : on ne lui impose rien.
  function initialiserAnciens() {
    if (lire()) return;
    try {
      var st = JSON.parse(localStorage.getItem('workoutStats') || '{}');
      if ((st.workouts || 0) > 0) {
        var o = { _anciens: 1 }; Object.keys(VISITES).forEach(function (k) { o[k] = 1; }); ecrire(o);
      }
    } catch (e) {}
  }

  // ── Affichage ────────────────────────────────────────────────
  var enCours = null, minuterie = null, essais = 0;

  function planifier(onglet, delai) {
    clearTimeout(minuterie);
    minuterie = setTimeout(function () { tenter(onglet); }, delai == null ? 700 : delai);
  }

  function tenter(onglet) {
    if (window.__AWAK_SANS_VISITE) return;              // tests automatiques
    if (enCours || !onglet || !VISITES[onglet] || vu(onglet)) return;
    if (ongletActif() !== onglet) return;              // l'utilisateur est déjà ailleurs
    if (onglet === 'game' && !jeuPret()) { if (essais++ < 40) planifier(onglet, 2500); return; }
    if (!profilPret() || !ecranLibre()) { if (essais++ < 40) planifier(onglet, 1500); return; }
    if (window.AwakCine && window.AwakCine.defer(function () { planifier(onglet, 400); })) return;
    var etapes = VISITES[onglet].filter(function (e) { var el = null; try { el = e.c(); } catch (x) {} return visible(el); });
    if (!etapes.length) return;                         // rien à montrer : on réessaiera à la prochaine visite
    essais = 0;
    montrer(onglet, etapes);
  }

  function styles() {
    if (document.getElementById('awakVisiteStyles')) return;
    var st = document.createElement('style');
    st.id = 'awakVisiteStyles';
    st.textContent =
      '@keyframes awakVisIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}' +
      '#awakVisiteOverlay{position:fixed;inset:0;z-index:100050;}' +
      '#awakVisiteSpot{position:fixed;border-radius:14px;border:2px solid #22d3ee;pointer-events:none;' +
        'box-shadow:0 0 0 9999px rgba(4,6,12,0.80),0 0 26px rgba(34,211,238,0.55);' +
        'transition:top .35s ease,left .35s ease,width .35s ease,height .35s ease;}' +
      '#awakVisiteBulle{position:fixed;left:16px;right:16px;max-width:420px;margin:0 auto;' +
        'background:linear-gradient(165deg,#0F1014,#161a2c) !important;border:1px solid rgba(34,211,238,0.35);' +
        'border-radius:16px;padding:16px 16px 12px;color:#e2e8f0;box-shadow:0 18px 50px rgba(0,0,0,0.6);' +
        'animation:awakVisIn .3s ease;}' +
      '#awakVisiteBulle button{min-height:auto !important;font-family:inherit;cursor:pointer;}';
    document.head.appendChild(st);
  }

  function montrer(onglet, etapes) {
    styles();
    var i = 0;
    var ov = document.createElement('div');
    ov.id = 'awakVisiteOverlay';
    ov.setAttribute('data-feuille-bas', '');            // pas de recentrage automatique (fenetres.js)
    ov.innerHTML = '<div id="awakVisiteSpot"></div><div id="awakVisiteBulle" role="dialog" aria-live="polite"></div>';
    document.body.appendChild(ov);
    enCours = { onglet: onglet, ov: ov };
    var spot = ov.querySelector('#awakVisiteSpot'), bulle = ov.querySelector('#awakVisiteBulle');

    function fin() {
      marquer(onglet);
      window.removeEventListener('resize', placer);
      window.removeEventListener('scroll', placer, true);
      try { ov.remove(); } catch (e) {}
      enCours = null;
    }
    function cible() { try { return etapes[i].c(); } catch (e) { return null; } }
    function placer() {
      var el = cible(); if (!el) return;
      var r = el.getBoundingClientRect(), m = 6;
      var top = Math.max(4, r.top - m), left = Math.max(4, r.left - m);
      var h = Math.min(r.height + 2 * m, window.innerHeight - top - 4), w = Math.min(r.width + 2 * m, window.innerWidth - left - 4);
      spot.style.top = top + 'px'; spot.style.left = left + 'px';
      spot.style.width = w + 'px'; spot.style.height = h + 'px';
      // Bulle sous la cible si la place le permet, sinon au-dessus
      var hb = bulle.offsetHeight || 150;
      if (top + h + 12 + hb < window.innerHeight - 8) { bulle.style.top = (top + h + 12) + 'px'; bulle.style.bottom = ''; }
      else if (top - 12 - hb > 8) { bulle.style.top = (top - 12 - hb) + 'px'; bulle.style.bottom = ''; }
      else { bulle.style.top = ''; bulle.style.bottom = '16px'; }
    }
    function rendre() {
      var e = etapes[i], dernier = i === etapes.length - 1;
      bulle.innerHTML =
        '<div style="font-size:0.6em;font-weight:900;letter-spacing:2.5px;color:#22d3ee;margin-bottom:4px;">PREMIER PASSAGE · ' + (i + 1) + '/' + etapes.length + '</div>' +
        '<div style="font-size:1.05em;font-weight:800;color:#f1f5f9;margin-bottom:4px;">' + e.t + '</div>' +
        '<div style="font-size:0.88em;line-height:1.5;color:#cbd5e1;margin-bottom:12px;">' + e.d + '</div>' +
        '<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;">' +
          (dernier ? '<span></span>' :
          '<button data-v="passer" style="background:none !important;border:none;color:#64748b;font-size:0.8em;font-weight:800;padding:8px 4px !important;">Passer</button>') +
          '<button data-v="suite" style="background:linear-gradient(135deg,#22d3ee,#0891b2) !important;border:none;border-radius:11px;' +
            'color:#04121f !important;font-weight:900;font-size:0.85em;letter-spacing:0.5px;padding:10px 18px !important;">' +
            (dernier ? 'Compris' : 'Suivant ›') + '</button>' +
        '</div>';
      var el = cible();
      try { el.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch (x) {}
      placer();
      setTimeout(placer, 380);
    }
    bulle.addEventListener('click', function (ev) {
      var b = ev.target.closest('button'); if (!b) return;
      ev.stopPropagation();
      if (b.getAttribute('data-v') === 'passer') return fin();
      // étape suivante encore visible ? (le contenu a pu changer)
      do { i++; } while (i < etapes.length && !visible(cible()));
      if (i >= etapes.length) return fin();
      rendre();
    });
    // Toucher hors de la bulle : rien ne passe à travers (on reste dans la visite)
    ov.addEventListener('click', function (ev) { if (!bulle.contains(ev.target)) ev.stopPropagation(); });
    window.addEventListener('resize', placer);
    window.addEventListener('scroll', placer, true);
    rendre();
  }

  // ── Détection du changement d'onglet ─────────────────────────
  function surveiller() {
    initialiserAnciens();
    var dernier = ongletActif();
    if (dernier) planifier(dernier, 1500);
    var obs = new MutationObserver(function () {
      var a = ongletActif();
      if (a && a !== dernier) { dernier = a; essais = 0; planifier(a); }
    });
    document.querySelectorAll('.tab-content').forEach(function (t) {
      obs.observe(t, { attributes: true, attributeFilter: ['class'] });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(surveiller, 300); });
  else setTimeout(surveiller, 300);

  window.AwakVisite = {
    VISITES: VISITES,
    montrer: function (onglet) { var o = lire() || {}; delete o[onglet]; ecrire(o); essais = 0; tenter(onglet); },
    // Revoir toutes les visites (depuis « Tout explorer »)
    reinitialiser: function () {
      ecrire({});
      if (typeof window.showToast === 'function') window.showToast('Les visites guidées reviendront à ton prochain passage dans chaque onglet.', 'info', 3500);
      var a = ongletActif(); if (a) planifier(a, 900);
    },
    vu: vu
  };
})();
