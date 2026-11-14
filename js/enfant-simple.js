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

  // v1739 : le compagnon renard (4 poses)
  function renard(pose, taille, style) {
    return '<img src="images/kid/renard_' + pose + '.webp" alt="" draggable="false" style="width:' + taille + 'px;height:' + taille + 'px;object-fit:contain;flex-shrink:0;pointer-events:none;' + (style || '') + '">';
  }

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
    + '#awkKidConsigne{display:none;margin:10px 0 4px;padding:12px 14px;border-radius:16px;background:rgba(56,189,248,0.1);border:2px solid rgba(56,189,248,0.35);color:#e0f2fe;font-size:17px;font-weight:800;line-height:1.35;text-align:center;}'
    + '#awkKidConsigne.avec-renard{display:none;align-items:center;gap:10px;text-align:left;}body.awk-enfant.in-session #awkKidConsigne.avec-renard{display:flex;}'
    + '@keyframes awkRenardSaut{0%,100%{transform:translateY(0) rotate(0)}30%{transform:translateY(-22px) rotate(-4deg)}60%{transform:translateY(0) rotate(3deg)}}'
    + '@keyframes awkRenardEntre{from{transform:scale(0.4) translateY(40px);opacity:0}to{transform:scale(1) translateY(0);opacity:1}}'
    + 'body:has(#awkKidFin) .toast-container{display:none!important;}'
    + '@keyframes awkBulle{from{transform:scale(0.6);opacity:0}to{transform:scale(1);opacity:1}}';

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
      + '<div style="display:flex;align-items:center;gap:6px;margin:6px 2px 10px;">'
      +   renard(fait ? 'saut' : 'salut', 104, 'animation:awkKidFlotte 3s ease-in-out infinite;')
      +   '<div style="flex:1;min-width:0;">'
      +     '<div style="font-size:26px;font-weight:900;color:#fff;line-height:1.1;">Salut' + (nom ? ' ' + esc(nom) : '') + ' !</div>'
      +     '<div style="display:inline-block;margin-top:6px;padding:7px 12px;border-radius:14px 14px 14px 4px;background:#fff;color:#0c4a6e;font-size:15px;font-weight:800;line-height:1.3;animation:awkBulle .35s ease-out both;">' + (fait ? 'Bravo, tu as bougé aujourd\'hui !' : 'On bouge ensemble ?') + '</div>'
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
      c.className = 'avec-renard';
      c.innerHTML = renard('pouce', 52) + '<span style="flex:1;min-width:0;">' + esc(t) + '</span>';
      c.style.visibility = t ? '' : 'hidden';
    } catch (e) { _e(e); }
  }

  // Fin de séance : grand « Bravo ! » avec le renard, puis retour à l'accueil
  function fin(etoiles, minutes) {
    try {
      if (!enfant()) return;
      var v = document.getElementById('awkKidFin'); if (v) v.remove();
      var n = Math.max(0, Math.round(Number(etoiles) || 0)), m = Math.max(1, Math.round(Number(minutes) || 0));
      var o = document.createElement('div'); o.id = 'awkKidFin';
      o.style.cssText = 'position:fixed;inset:0;z-index:13000;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px 20px calc(24px + env(safe-area-inset-bottom));text-align:center;'
        + 'background:radial-gradient(circle at 50% 35%,#1e3a5f 0%,#0b1220 70%);';
      var ets = ''; for (var i = 0; i < Math.min(n, 5); i++) ets += '<span style="display:inline-flex;animation:awkKidFlotte 1.6s ease-in-out ' + (i * 0.15).toFixed(2) + 's infinite;">' + ico('etoile', i === 2 ? 40 : 30, '#facc15') + '</span>';
      o.innerHTML = ''
        + '<div style="animation:awkRenardEntre .5s cubic-bezier(.2,1.4,.4,1) both;">'
        +   '<div style="animation:awkRenardSaut 1.4s ease-in-out .5s infinite;">' + renard('bravo', 200) + '</div></div>'
        + '<div style="font-size:40px;font-weight:900;color:#fff;line-height:1.05;margin-top:6px;">Bravo' + (prenom() ? ' ' + esc(prenom()) : '') + ' !</div>'
        + '<div style="font-size:18px;font-weight:800;color:#bae6fd;margin-top:8px;">Tu as bougé ' + m + ' minute' + (m > 1 ? 's' : '') + '</div>'
        + (n ? '<div style="display:flex;align-items:flex-end;justify-content:center;gap:6px;margin-top:18px;">' + ets + '</div>'
             + '<div style="font-size:20px;font-weight:900;color:#fde68a;margin-top:6px;">+' + n + ' étoile' + (n > 1 ? 's' : '') + '</div>' : '')
        + '<button onclick="AwakKid.finOk()" style="margin-top:30px;width:100%;max-width:320px;min-height:64px;border:none;border-radius:20px;cursor:pointer;font-family:inherit;font-size:1.3em;font-weight:900;color:#fff;'
        +   'background:linear-gradient(135deg,var(--kid-orange,#fb923c),var(--kid-rose,#f472b6));box-shadow:0 8px 26px rgba(251,146,60,0.4);">Super !</button>';
      document.body.appendChild(o);
      try { if (typeof window.speak === 'function') window.speak('Bravo ! Tu as bougé ' + m + ' minutes' + (n ? ', et tu gagnes ' + n + ' étoile' + (n > 1 ? 's' : '') : '') + ' !', { enfant: true }); } catch (e) { _e(e); }
      try { if (navigator.vibrate) navigator.vibrate([80, 60, 120]); } catch (e) { /* rien */ }
    } catch (e) { _e(e); }
  }
  function finOk() {
    var o = document.getElementById('awkKidFin'); if (o) o.remove();
    try { if (typeof window.backToHome === 'function') window.backToHome(); else if (typeof window.switchTab === 'function') window.switchTab('home'); } catch (e) { _e(e); }
    setTimeout(function () { try { if (window.AwakEtoiles && AwakEtoiles.annoncer) AwakEtoiles.annoncer(); } catch (e) { _e(e); } }, 400);
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

  window.AwakKid = { maj: maj, bouger: bouger, parent: parent, apresPreparation: apresPreparation, consigne: consigne, enfant: enfant, accueil: accueil, fin: fin, finOk: finOk };
  function init() { injecterCSS(); brancher(); maj(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
