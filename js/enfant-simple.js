// v1736 — MODE ENFANT TRÈS SIMPLE (moins de 13 ans)
// Un écran = une action, presque pas de texte à lire :
//  · Accueil : un gros bouton « Bouger ! », le pot d'étoiles, un petit cadenas « Parent »
//  · Barre du bas : Bouger · Étoiles · Famille (Séance et Plus cachés)
//  · Séance : lancée directement (pas d'écran « Prépare-toi »), image en grand,
//    une seule consigne, gros bouton « J'ai fini ! », voix qui lit l'exercice
//  · Couleurs d'enfant (ciel, orange, rose, jaune), boutons plus gros
//  · Sortir du profil enfant ou ouvrir les menus adultes demande le code parent
(function () {
  'use strict';
  function _e(x) { try { if (typeof window._awkE === 'function') window._awkE(x); } catch (z) { /* rien */ } }
  function enfant() { try { return !!(window.AwakYouth && AwakYouth.isChild && AwakYouth.isChild()); } catch (e) { return false; } }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function ico(n, t, c) { try { return window.AwakIcon ? AwakIcon.get(n, t, c) : ''; } catch (e) { return ''; } }

  var CSS = ''
    + 'body.awk-enfant{--kid-ciel:#38bdf8;--kid-orange:#fb923c;--kid-rose:#f472b6;--kid-jaune:#facc15;}'
    // Barre du bas : 3 onglets, plus gros
    + 'body.awk-enfant #mobileNavBar .nav-tab[onclick="switchTab(\'workouts\')"],body.awk-enfant #mobileNavBar #moreNavTab,body.awk-enfant #mobileNavBar .nav-tab[onclick*="awakNavPlus"]{display:none!important;}'
    + 'body.awk-enfant #mobileNavBar .nav-tab{font-size:0.8em!important;}'
    + 'body.awk-enfant #mobileNavBar .nav-tab svg{width:26px!important;height:26px!important;}'
    + 'body.awk-enfant #mobileNavBar .nav-tab.active{color:var(--kid-orange)!important;border-color:rgba(251,146,60,0.5)!important;background:rgba(251,146,60,0.12)!important;}'
    // Accueil : seulement l'accueil enfant (la bannière adulte et les cartes sont cachées)
    + 'body.awk-enfant.awk-kid-accueil #appHeader{display:none!important;}'
    + 'body.awk-enfant #homeTab > :not(#awakKidHome){display:none!important;}'
    + '#awakKidHome{display:none;}body.awk-enfant #awakKidHome{display:block;}'
    + '@keyframes awkKidPulse{0%,100%{transform:scale(1);box-shadow:0 10px 40px rgba(251,146,60,0.45),0 0 0 0 rgba(251,146,60,0.45);}50%{transform:scale(1.04);box-shadow:0 14px 50px rgba(244,114,182,0.5),0 0 0 18px rgba(251,146,60,0);}}'
    + '@keyframes awkKidFlotte{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}'
    // Séance : une seule action
    + 'body.awk-enfant.in-session #prevBtn,body.awk-enfant.in-session #swapBtn,body.awk-enfant.in-session #exerciseDescriptionBox,'
    + 'body.awk-enfant.in-session #sessionMenuBtn,body.awk-enfant.in-session #workoutTopBar button[onclick="toggleFullscreenMode()"],'
    + 'body.awk-enfant.in-session #liveVolumeChip{display:none!important;}'
    + 'body.awk-enfant.in-session #awakBarreActions{display:block!important;}'
    + 'body.awk-enfant.in-session #awakBarreActions #awakSuivantBtn{width:100%!important;min-height:64px!important;border-radius:20px!important;font-size:1.25em!important;'
    +   'background:linear-gradient(135deg,var(--kid-orange),var(--kid-rose))!important;box-shadow:0 8px 26px rgba(251,146,60,0.4)!important;border:none!important;text-transform:none!important;letter-spacing:0!important;}'
    + 'body.awk-enfant.in-session #awakSuivantBtn > span{display:none!important;}'
    + 'body.awk-enfant.in-session #awakBarreActions #awakSuivantBtn::before{content:"J\'ai fini !";font-weight:900;color:#fff;}'
    + 'body.awk-enfant.in-session #exerciseView #exerciseName{font-size:28px!important;color:#fff!important;}'
    + 'body.awk-enfant.in-session #awkKidConsigne{display:block;}'
    + '#awkKidConsigne{display:none;margin:10px 0 4px;padding:12px 14px;border-radius:16px;background:rgba(56,189,248,0.1);border:2px solid rgba(56,189,248,0.35);color:#e0f2fe;font-size:17px;font-weight:800;line-height:1.35;text-align:center;}';

  function injecterCSS() {
    if (document.getElementById('awkKidCSS')) return;
    var st = document.createElement('style'); st.id = 'awkKidCSS'; st.textContent = CSS; document.head.appendChild(st);
  }

  function prenom() {
    try {
      var id = window.getCurrentProfileId && getCurrentProfileId();
      var p = (window.getAllProfiles && getAllProfiles() || []).find(function (x) { return x && x.id === id; });
      return (p && p.name) ? String(p.name).split(' ')[0] : '';
    } catch (e) { return ''; }
  }
  function aBougeAujourdhui() {
    try {
      var h = (typeof window.getWorkoutHistory === 'function') ? getWorkoutHistory() : [];
      var j = new Date().toDateString();
      return (h || []).some(function (s) { return s && s.date && new Date(s.date).toDateString() === j; });
    } catch (e) { return false; }
  }

  function accueil() {
    var tab = document.getElementById('homeTab'); if (!tab) return;
    var el = document.getElementById('awakKidHome');
    if (!el) { el = document.createElement('div'); el.id = 'awakKidHome'; tab.insertBefore(el, tab.firstChild); }
    if (!enfant()) { el.innerHTML = ''; return; }
    var fait = aBougeAujourdhui(), nom = prenom();
    var etoiles = '';
    try { if (window.AwakEtoiles && AwakEtoiles.carteEnfant) etoiles = AwakEtoiles.carteEnfant(); } catch (e) { _e(e); }
    el.innerHTML = ''
      + '<div style="display:flex;align-items:center;gap:10px;margin:6px 2px 18px;">'
      +   '<div style="flex:1;min-width:0;">'
      +     '<div style="font-size:28px;font-weight:900;color:#fff;line-height:1.1;">Salut' + (nom ? ' ' + esc(nom) : '') + ' !</div>'
      +     '<div style="font-size:16px;font-weight:700;color:#bae6fd;margin-top:4px;">' + (fait ? 'Bravo, tu as bougé aujourd\'hui !' : 'On bouge ensemble ?') + '</div>'
      +   '</div>'
      +   '<button onclick="AwakKid.parent()" aria-label="Espace parent" style="flex-shrink:0;display:flex;flex-direction:column;align-items:center;gap:2px;padding:8px 10px;min-height:0;border-radius:14px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.12);color:#94a3b8;font-family:inherit;font-size:11px;font-weight:800;cursor:pointer;">'
      +     ico('personne', 18, '#94a3b8') + '<span>Parent</span></button>'
      + '</div>'
      + '<div style="display:flex;justify-content:center;margin:8px 0 26px;">'
      +   '<button onclick="AwakKid.bouger()" aria-label="Bouger" style="width:220px;height:220px;border-radius:50%;border:none;cursor:pointer;font-family:inherit;color:#fff;'
      +     'background:radial-gradient(circle at 35% 30%,#fdba74,#fb923c 45%,#f472b6);animation:awkKidPulse 2.4s ease-in-out infinite;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;">'
      +     '<span style="display:inline-flex;animation:awkKidFlotte 2.4s ease-in-out infinite;">' + ico('eclair', 54, '#fff') + '</span>'
      +     '<span style="font-size:34px;font-weight:900;letter-spacing:0.5px;line-height:1;">' + (fait ? 'Encore !' : 'Bouger !') + '</span>'
      +     '<span style="font-size:14px;font-weight:800;opacity:0.92;">15 minutes de jeux</span>'
      +   '</button>'
      + '</div>'
      + etoiles;
  }

  function bouger() {
    try {
      window._awkKidDirect = true;
      if (typeof window.awakLancerSeanceSysteme === 'function') window.awakLancerSeanceSysteme();
      else if (typeof window.startRandomWorkout === 'function') window.startRandomWorkout();
    } catch (e) { _e(e); window._awkKidDirect = false; }
  }

  // Après la préparation (générée en arrière-plan), la séance démarre seule.
  function apresPreparation() {
    if (!window._awkKidDirect || !enfant()) return false;
    window._awkKidDirect = false;
    setTimeout(function () { try { if (typeof window.startPreparedWorkout === 'function') window.startPreparedWorkout(); } catch (e) { _e(e); } }, 60);
    return true;
  }

  // Une seule consigne, en gros, sous le nom de l'exercice
  function consigne(ex) {
    try {
      var nomEl = document.getElementById('exerciseName'); if (!nomEl) return;
      var c = document.getElementById('awkKidConsigne');
      if (!c) { c = document.createElement('div'); c.id = 'awkKidConsigne'; nomEl.parentNode.insertBefore(c, nomEl.nextSibling); }
      var t = (ex && ex.instructions && ex.instructions[0]) || '';
      c.textContent = t;
      c.style.visibility = t ? '' : 'hidden';
    } catch (e) { _e(e); }
  }

  function parent() {
    var ouvrir = function () {
      try {
        if (typeof window.showProfileSelectionModal === 'function') window.showProfileSelectionModal();
        else if (typeof window.awakNavPlus === 'function') window.awakNavPlus();
      } catch (e) { _e(e); }
    };
    try { if (window.AwakEtoiles && AwakEtoiles.garde) return AwakEtoiles.garde(ouvrir)(); } catch (e) { _e(e); }
    ouvrir();
  }

  function maj(onglet) {
    try {
      injecterCSS();
      var k = enfant();
      var t = onglet || (document.querySelector('.tab-content.active') || {}).id || '';
      document.body.classList.toggle('awk-kid-accueil', k && (t === 'home' || t === 'homeTab'));
      if (k && (t === 'home' || t === 'homeTab')) accueil();
      // Onglets cachés pour un enfant → retour à l'accueil enfant
      if (k && (t === 'more' || t === 'settings')) { /* Plus : passe par le code parent */ }
    } catch (e) { _e(e); }
  }

  // switchTab : met à jour l'accueil enfant à chaque changement d'onglet
  function brancher() {
    if (typeof window.switchTab !== 'function' || window.switchTab._awkKid) return;
    var o = window.switchTab;
    var w = function (t) { var r = o.apply(this, arguments); try { window.AwakKid.maj(t); } catch (e) { _e(e); } return r; };
    w._awkKid = true;
    window.switchTab = w;
  }

  window.AwakKid = { maj: maj, bouger: bouger, parent: parent, apresPreparation: apresPreparation, consigne: consigne, enfant: enfant, accueil: accueil };
  function init() { injecterCSS(); brancher(); maj(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
