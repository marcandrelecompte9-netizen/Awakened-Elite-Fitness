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

  // v1740 : chemin d'aventure — 14 pierres, une par séance
  var PIERRES = [[285,915],[369,835],[284,772],[193,732],[220,665],[290,623],[354,570],[410,505],[330,458],[238,380],[312,307],[236,257],[210,183],[287,123]];
  var DEPART = [285,985];
  function cleChemin(ecrire) { try { return (ecrire ? window._cleProfil : window._cleProfilLecture)('awkKidChemin'); } catch (e) { return 'awkKidChemin'; } }
  function chemin() {
    try { var d = JSON.parse(localStorage.getItem(cleChemin(false)) || 'null'); if (d && typeof d.pas === 'number') return d; } catch (e) { _e(e); }
    return { pas: 0, tours: 0, cles: [] };
  }
  function avancer(cle) {
    var d = chemin(); d.cles = d.cles || [];
    cle = String(cle || '');
    if (cle && d.cles.indexOf(cle) >= 0) return null;
    if (cle) { d.cles.push(cle); if (d.cles.length > 20) d.cles.shift(); }
    var avant = d.pas;
    if (d.pas >= PIERRES.length) { d.pas = 0; d.tours = (d.tours || 0) + 1; avant = 0; }
    d.pas++;
    try { localStorage.setItem(cleChemin(true), JSON.stringify(d)); } catch (e) { _e(e); }
    return { avant: avant, apres: d.pas };
  }
  function posPierre(n) { var q = n > 0 ? PIERRES[Math.min(n, PIERRES.length) - 1] : DEPART; return { x: q[0] / 572 * 100, y: q[1] / 1024 * 100 }; }
  var _aAnimer = null;

  function carte(anim) {
    try {
      var v = document.getElementById('awkKidCarte'); if (v) v.remove();
      var d = chemin(), N = PIERRES.length;
      var de = anim ? anim.avant : d.pas, a = d.pas;
      var o = document.createElement('div'); o.id = 'awkKidCarte';
      o.style.cssText = 'position:fixed;inset:0;z-index:12800;background:#0b1220;display:flex;flex-direction:column;align-items:center;padding:calc(10px + env(safe-area-inset-top)) 10px calc(10px + env(safe-area-inset-bottom));box-sizing:border-box;';
      var marques = '';
      for (var i = 1; i <= N; i++) {
        var q = posPierre(i);
        if (i <= a && !(anim && i === a)) marques += '<div style="position:absolute;left:' + q.x + '%;top:' + q.y + '%;transform:translate(-50%,-60%);display:flex;filter:drop-shadow(0 2px 3px rgba(0,0,0,0.5));">' + ico('etoile', 30, '#facc15') + '</div>';
        else if (i === a + 1 || (anim && i === a)) marques += '<div class="awk-ch-suiv" style="position:absolute;left:' + q.x + '%;top:' + q.y + '%;width:16%;aspect-ratio:1.6;transform:translate(-50%,-50%);border-radius:50%;border:3px solid #fff;animation:awkChPulse 1.4s ease-in-out infinite;"></div>';
      }
      var p0 = posPierre(de), fini = a >= N;
      o.innerHTML = '<style>@keyframes awkChPulse{0%,100%{opacity:.9;transform:translate(-50%,-50%) scale(1)}50%{opacity:.3;transform:translate(-50%,-50%) scale(1.15)}}'
        + '#awkKidCarte svg{fill:#facc15;}'
        + '#awkChRenard{transition:left 1.2s ease-in-out,top 1.2s ease-in-out;}</style>'
        + '<div style="display:flex;align-items:center;gap:10px;width:100%;max-width:520px;margin-bottom:8px;">'
        +   '<div style="flex:1;font-size:20px;font-weight:900;color:#fff;">' + (fini ? 'Aventure terminée !' : 'Pierre ' + a + ' sur ' + N) + '</div>'
        +   '<button onclick="AwakKid.fermerCarte()" style="min-height:44px;padding:8px 18px;border:none;border-radius:14px;background:linear-gradient(135deg,#fb923c,#f472b6);color:#fff;font-family:inherit;font-size:16px;font-weight:900;cursor:pointer;">Retour</button>'
        + '</div>'
        + '<div style="position:relative;flex:1;min-height:0;aspect-ratio:572/1024;max-width:100%;">'
        +   '<img src="images/kid/chemin_aventure.webp" alt="" draggable="false" style="position:absolute;inset:0;width:100%;height:100%;border-radius:14px;">'
        +   marques
        +   '<div id="awkChRenard" style="position:absolute;left:' + p0.x + '%;top:' + p0.y + '%;width:22%;transform:translate(-50%,-88%);pointer-events:none;">'
        +     '<img src="images/kid/renard_' + (fini ? 'saut' : 'salut') + '.webp" alt="" style="width:100%;display:block;animation:awkKidFlotte 2s ease-in-out infinite;filter:drop-shadow(0 4px 6px rgba(0,0,0,0.5));"></div>'
        + '</div>'
        + '<div style="font-size:15px;font-weight:800;color:#bae6fd;margin-top:8px;text-align:center;">'
        +   (fini ? 'Bravo ! La prochaine séance commence une nouvelle aventure.' : 'Chaque séance = une pierre de plus') + '</div>';
      document.body.appendChild(o);
      if (anim && anim.apres !== anim.avant) {
        setTimeout(function () {
          var r = document.getElementById('awkChRenard'); if (!r) return;
          var p1 = posPierre(anim.apres); r.style.left = p1.x + '%'; r.style.top = p1.y + '%';
          setTimeout(function () {
            try {
              var q = posPierre(anim.apres), z = document.querySelector('#awkKidCarte .awk-ch-suiv');
              if (z) z.outerHTML = '<div style="position:absolute;left:' + q.x + '%;top:' + q.y + '%;transform:translate(-50%,-60%);display:flex;filter:drop-shadow(0 2px 3px rgba(0,0,0,0.5));">' + ico('etoile', 30, '#facc15') + '</div>';
              if (navigator.vibrate) navigator.vibrate(60);
            } catch (e) { _e(e); }
          }, 1250);
        }, 500);
      }
    } catch (e) { _e(e); }
  }
  function fermerCarte() { var o = document.getElementById('awkKidCarte'); if (o) o.remove(); try { accueil(); } catch (e) { _e(e); } }

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
      + carteAventureHTML()
      + etoiles;
  }
  function carteAventureHTML() {
    var d = chemin(), N = PIERRES.length, pts = '';
    for (var i = 1; i <= N; i++) pts += '<span style="flex:1;height:8px;border-radius:99px;background:' + (i <= d.pas ? 'linear-gradient(90deg,#fb923c,#facc15)' : 'rgba(255,255,255,0.12)') + ';"></span>';
    return '<button onclick="AwakKid.carte()" style="display:flex;align-items:center;gap:12px;width:100%;margin:0 0 14px;padding:12px 14px;min-height:0;border-radius:18px;cursor:pointer;font-family:inherit;text-align:left;'
      + 'background:linear-gradient(135deg,rgba(56,189,248,0.14),rgba(244,114,182,0.1));border:2px solid rgba(56,189,248,0.35);">'
      + '<img src="images/kid/chemin_aventure.webp" alt="" style="width:44px;height:78px;object-fit:cover;border-radius:8px;flex-shrink:0;">'
      + '<span style="flex:1;min-width:0;display:block;">'
      +   '<span style="display:block;font-size:18px;font-weight:900;color:#fff;">Mon aventure</span>'
      +   '<span style="display:block;font-size:14px;font-weight:700;color:#bae6fd;margin:2px 0 7px;">' + (d.pas >= N ? 'Aventure terminée !' : 'Pierre ' + d.pas + ' sur ' + N) + '</span>'
      +   '<span style="display:flex;gap:3px;">' + pts + '</span>'
      + '</span>' + '<span style="font-size:26px;font-weight:900;color:#bae6fd;line-height:1;">›</span>' + '</button>';
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
  function fin(etoiles, minutes, cle) {
    try {
      if (!enfant()) return;
      _aAnimer = avancer(cle || Date.now());
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
        + (_aAnimer ? '<div style="font-size:16px;font-weight:800;color:#fdba74;margin-top:16px;">Le renard avance sur ton chemin !</div>' : '')
        + '<button onclick="AwakKid.finOk()" style="margin-top:26px;width:100%;max-width:320px;min-height:64px;border:none;border-radius:20px;cursor:pointer;font-family:inherit;font-size:1.3em;font-weight:900;color:#fff;'
        +   'background:linear-gradient(135deg,var(--kid-orange,#fb923c),var(--kid-rose,#f472b6));box-shadow:0 8px 26px rgba(251,146,60,0.4);">Super !</button>';
      document.body.appendChild(o);
      try { if (typeof window.speak === 'function') window.speak('Bravo ! Tu as bougé ' + m + ' minutes' + (n ? ', et tu gagnes ' + n + ' étoile' + (n > 1 ? 's' : '') : '') + ' !', { enfant: true }); } catch (e) { _e(e); }
      try { if (navigator.vibrate) navigator.vibrate([80, 60, 120]); } catch (e) { /* rien */ }
    } catch (e) { _e(e); }
  }
  function finOk() {
    var o = document.getElementById('awkKidFin'); if (o) o.remove();
    try { if (typeof window.backToHome === 'function') window.backToHome(); else if (typeof window.switchTab === 'function') window.switchTab('home'); } catch (e) { _e(e); }
    var an = _aAnimer; _aAnimer = null;
    if (an) setTimeout(function () { carte(an); }, 350);
    else setTimeout(function () { try { if (window.AwakEtoiles && AwakEtoiles.annoncer) AwakEtoiles.annoncer(); } catch (e) { _e(e); } }, 400);
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

  window.AwakKid = { maj: maj, bouger: bouger, parent: parent, apresPreparation: apresPreparation, consigne: consigne, enfant: enfant, accueil: accueil, fin: fin, finOk: finOk, carte: function () { carte(null); }, fermerCarte: fermerCarte, _chemin: chemin };
  function init() { injecterCSS(); brancher(); maj(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
