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

  // ── v1769 : BRUITAGES enfant (synthétisés, sans fichier) — respectent le mode muet ──
  var _ac = null;
  function muet() { try { return localStorage.getItem('fitproMuted') === 'true'; } catch (e) { return false; } }
  function ctx() {
    try { if (!_ac) _ac = new (window.AudioContext || window.webkitAudioContext)(); if (_ac.state === 'suspended') _ac.resume(); return _ac; } catch (e) { return null; }
  }
  function note(c, type, f0, f1, t0, dur, vol) {
    var o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t0); if (f1) o.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(c.destination); o.start(t0); o.stop(t0 + dur + 0.02);
  }
  function bruit(c, t0, dur, vol, f0, f1) {
    var n = Math.floor(c.sampleRate * dur), b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    var src = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain();
    src.buffer = b; fl.type = 'bandpass'; fl.Q.value = 1.2; fl.frequency.setValueAtTime(f0, t0); fl.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
    g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(fl); fl.connect(g); g.connect(c.destination); src.start(t0);
  }
  function sfx(nom, delai) {
    if (muet() || !enfant()) return;
    var c = ctx(); if (!c) return;
    var t = c.currentTime + (delai || 0);
    try {
      if (nom === 'boing') { note(c, 'sine', 520, 160, t, 0.32, 0.28); note(c, 'triangle', 780, 240, t, 0.25, 0.12); }
      else if (nom === 'ding') { note(c, 'sine', 1318, 0, t, 0.35, 0.18); note(c, 'sine', 1976, 0, t + 0.06, 0.4, 0.12); }
      else if (nom === 'pop') { bruit(c, t, 0.06, 0.3, 2500, 900); note(c, 'sine', 400, 1200, t, 0.12, 0.25); }
      else if (nom === 'pas') { note(c, 'triangle', 260, 180, t, 0.08, 0.18); }
      else if (nom === 'tic') { note(c, 'square', 1100, 0, t, 0.05, 0.08); }
      else if (nom === 'go') { [523, 659, 784, 1047].forEach(function (f, i) { note(c, 'triangle', f, 0, t + i * 0.07, 0.22, 0.16); }); }
      else if (nom === 'whoosh') { bruit(c, t, 0.35, 0.18, 400, 2400); }
    } catch (e) { _e(e); }
  }

  // ── Voix : annonces dites après le 3-2-1, petites phrases pendant la séance ──
  var _aDire = null, _annonceT = null;
  function dire(t) { try { if (typeof window.speak === 'function') window.speak(t, { interrupt: true, enfant: true }); } catch (e) { _e(e); } }
  function annoncer(texte) {
    var pre = _prefixe; _prefixe = '';
    _aDire = (pre ? pre + ' ' : '') + texte;
    clearTimeout(_annonceT);
    // pas de 3-2-1 (yoga, enchaînements) → on parle tout de suite
    _annonceT = setTimeout(function () {
      var c = document.getElementById('countdownOverlay');
      if (_aDire && !(c && c.classList.contains('active'))) { var x = _aDire; _aDire = null; dire(x); }
    }, 350);
  }
  var _prefixe = '';
  function brancherSons() {
    var c = document.getElementById('countdownOverlay'), n = document.getElementById('countdownNumber');
    if (c && !c._awkSon) {
      c._awkSon = true;
      var actif = false;
      new MutationObserver(function () {
        var a = c.classList.contains('active');
        if (a && !actif) sfx('tic');
        if (!a && actif && enfant()) {
          sfx('go');
          var x = _aDire; _aDire = null;
          dire('Go ! ' + (x || ''));
        }
        actif = a;
      }).observe(c, { attributes: true, attributeFilter: ['class'] });
      if (n) new MutationObserver(function () { if (actif) sfx('tic'); }).observe(n, { childList: true, characterData: true, subtree: true });
    }
    var r = document.getElementById('restOverlay');
    if (r && !r._awkSon) {
      r._awkSon = true;
      var ra = false;
      new MutationObserver(function () {
        var a = r.classList.contains('active');
        if (a && !ra && enfant()) setTimeout(function () {
          var nx = (document.getElementById('restNextName') || {}).textContent || '';
          nx = nx.replace(/^[—\-\s]+$/, '');
          dire('Petite pause ! ' + (nx ? 'Ensuite : ' + nx + '.' : 'Bois un peu d\'eau.'));
        }, 350);
        ra = a;
      }).observe(r, { attributes: true, attributeFilter: ['class'] });
    }
  }

  // v1739 : le compagnon renard (4 poses)
  function renard(pose, taille, style) {
    return '<img src="images/kid/renard_' + pose + '.webp" alt="" draggable="false" style="width:' + taille + 'px;height:' + taille + 'px;object-fit:contain;flex-shrink:0;pointer-events:none;' + (style || '') + '">';
  }

  // v1740 : chemin d'aventure — 14 pierres, une par séance
  var PIERRES = [[285,915],[369,835],[284,772],[193,732],[220,665],[290,623],[354,570],[410,505],[330,458],[238,380],[312,307],[236,257],[210,183],[287,123]];
  var DEPART = [285,985];
  var BONUS_MONDE = 5;
  // v1743 : plusieurs mondes — après la dernière pierre, le monde suivant
  var MONDES = [
    { img: 'chemin_aventure', nom: 'La jungle et l\'espace', pierres: PIERRES },
    { img: 'chemin_montagnes', nom: 'Les montagnes', pierres: PIERRES },
    { img: 'chemin_chateau', nom: 'Le château de bonbons', pierres: PIERRES.slice(0, 11).concat([[300,235]]) }
  ];
  function mondeDe(d) { return MONDES[(d && d.monde || 0) % MONDES.length]; }
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
    var avant = d.pas, nouveau = false;
    if (d.pas >= mondeDe(d).pierres.length) { d.pas = 0; d.tours = (d.tours || 0) + 1; d.monde = ((d.monde || 0) + 1) % MONDES.length; avant = 0; nouveau = true; }
    d.pas++;
    try { localStorage.setItem(cleChemin(true), JSON.stringify(d)); } catch (e) { _e(e); }
    // v1763 : dernière pierre d'un monde → 5 étoiles en cadeau (une fois par monde fini)
    var bonus = 0;
    if (d.pas === mondeDe(d).pierres.length) { try { bonus = window.AwakEtoiles && AwakEtoiles.cadeau ? AwakEtoiles.cadeau(BONUS_MONDE, 'Monde terminé : ' + mondeDe(d).nom) : 0; } catch (e) { _e(e); } }
    return { avant: avant, apres: d.pas, nouveau: nouveau, bonus: bonus };
  }
  function posPierre(n, m) { var P = (m || MONDES[0]).pierres; var q = n > 0 ? P[Math.min(n, P.length) - 1] : DEPART; return { x: q[0] / 572 * 100, y: q[1] / 1024 * 100 }; }
  var _aAnimer = null;

  // v1742 : album d'autocollants — un nouvel autocollant par séance (9 à collectionner)
  // v1743 : plusieurs pages — la page suivante s'ouvre quand la page est pleine
  var PAGES = [
    [['basket','Basket'],['etoile','Étoile'],['medaille','Médaille'],['grenouille','Grenouille'],['fusee','Fusée'],['coeur','Cœur'],['soleil','Soleil'],['velo','Vélo'],['trophee','Trophée']],
    [['ballon','Ballon'],['dino','Dino'],['cerfvolant','Cerf-volant'],['planche','Planche'],['arcenciel','Arc-en-ciel'],['corde','Corde à sauter'],['pingouin','Pingouin'],['eclair','Éclair'],['couronne','Couronne']]
  ];
  function pageCourante(d) { for (var i = 0; i < PAGES.length; i++) { if (PAGES[i].some(function (a) { return d.ont.indexOf(a[0]) < 0; })) return i; } return PAGES.length - 1; }
  function pageDe(id) { for (var i = 0; i < PAGES.length; i++) { if (PAGES[i].some(function (a) { return a[0] === id; })) return i; } return 0; }
  function pleine(d, i) { return PAGES[i].every(function (a) { return d.ont.indexOf(a[0]) >= 0; }); }
  function cleAlbum(ecrire) { try { return (ecrire ? window._cleProfil : window._cleProfilLecture)('awkKidAlbum'); } catch (e) { return 'awkKidAlbum'; } }
  function album() {
    try { var d = JSON.parse(localStorage.getItem(cleAlbum(false)) || 'null'); if (d && Array.isArray(d.ont)) return d; } catch (e) { _e(e); }
    return { ont: [], cles: [] };
  }
  function gagnerAuto(cle) {
    var d = album(); d.cles = d.cles || [];
    cle = String(cle || '');
    if (cle && d.cles.indexOf(cle) >= 0) return null;
    var pc = pageCourante(d);
    var manque = PAGES[pc].filter(function (a) { return d.ont.indexOf(a[0]) < 0; });
    if (!manque.length) return null;
    var a = manque[Math.floor(Math.random() * manque.length)].slice();
    a[2] = pc > 0 && manque.length === PAGES[pc].length;   // 1er autocollant d'une nouvelle page
    d.ont.push(a[0]);
    if (cle) { d.cles.push(cle); if (d.cles.length > 20) d.cles.shift(); }
    try { localStorage.setItem(cleAlbum(true), JSON.stringify(d)); } catch (e) { _e(e); }
    return a;
  }
  function imgAuto(id, taille, style) {
    return '<img src="images/kid/auto_' + id + '.webp" alt="" draggable="false" style="width:' + taille + ';aspect-ratio:1;object-fit:contain;display:block;' + (style || '') + '">';
  }
  var _albPage = 0, _albNeuf = null;
  function ouvrirAlbum(nouveau, page) {
    try {
      var v = document.getElementById('awkKidAlbum'); if (v) v.remove();
      var d = album();
      if (nouveau !== undefined) _albNeuf = nouveau;
      var pg = (typeof page === 'number') ? page : (nouveau ? pageDe(nouveau) : pageCourante(d));
      pg = Math.max(0, Math.min(PAGES.length - 1, pg)); _albPage = pg;
      var AUTOS = PAGES[pg], N = AUTOS.length;
      var n = AUTOS.filter(function (a) { return d.ont.indexOf(a[0]) >= 0; }).length;
      var tout = PAGES.every(function (x, i) { return pleine(d, i); });
      var ouverte = function (i) { return i === 0 || pleine(d, i - 1); };
      var fl = function (i, t) { var ok = i >= 0 && i < PAGES.length && ouverte(i); return '<button ' + (ok ? 'onclick="AwakKid._albPage(' + i + ')"' : 'disabled') + ' style="width:48px;height:48px;min-height:0;padding:0;border-radius:50%;border:2px solid rgba(255,255,255,' + (ok ? '0.3' : '0.08') + ');background:rgba(255,255,255,0.06);color:' + (ok ? '#fff' : 'rgba(255,255,255,0.2)') + ';font-size:26px;font-weight:900;line-height:1;cursor:pointer;font-family:inherit;">' + t + '</button>'; };
      var cases = AUTOS.map(function (a) {
        var a1 = d.ont.indexOf(a[0]) >= 0, neuf = _albNeuf === a[0];
        return '<div style="display:flex;flex-direction:column;align-items:center;gap:4px;padding:10px 6px;border-radius:18px;'
          + (a1 ? 'background:rgba(255,255,255,0.08);border:2px solid rgba(253,186,116,' + (neuf ? '0.9' : '0.3') + ');' : 'background:rgba(255,255,255,0.03);border:2px dashed rgba(255,255,255,0.15);') + '">'
          + (a1 ? imgAuto(a[0], '78%', neuf ? 'animation:awkAutoPop .7s cubic-bezier(.2,1.6,.4,1) both;' : '')
                : '<div style="width:78%;aspect-ratio:1;display:flex;align-items:center;justify-content:center;font-size:34px;font-weight:900;color:rgba(255,255,255,0.18);">?</div>')
          + '<div style="font-size:13px;font-weight:800;color:' + (a1 ? '#fff' : 'rgba(255,255,255,0.3)') + ';">' + (a1 ? a[1] : '…') + '</div></div>';
      }).join('');
      sfx(_albNeuf ? 'pop' : 'whoosh', _albNeuf ? 0.15 : 0);
      var o = document.createElement('div'); o.id = 'awkKidAlbum';
      o.style.cssText = 'position:fixed;inset:0;z-index:12800;background:radial-gradient(circle at 50% 20%,#1e3a5f,#0b1220 70%);overflow-y:auto;padding:calc(12px + env(safe-area-inset-top)) 14px calc(20px + env(safe-area-inset-bottom));box-sizing:border-box;';
      o.innerHTML = '<style>@keyframes awkAutoPop{0%{transform:scale(0) rotate(-20deg)}100%{transform:scale(1) rotate(0)}}</style>'
        + '<div style="max-width:480px;margin:0 auto;">'
        + '<div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">'
        +   '<div style="flex:1;"><div style="font-size:24px;font-weight:900;color:#fff;">Mon album</div>'
        +   '<div style="font-size:15px;font-weight:800;color:#bae6fd;margin-top:2px;">' + (PAGES.length > 1 ? 'Page ' + (pg + 1) + ' · ' : '') + (n >= N ? 'Page complète !' : n + ' sur ' + N) + '</div></div>'
        +   '<button onclick="AwakKid.fermerAlbum()" style="min-height:44px;padding:8px 18px;border:none;border-radius:14px;background:linear-gradient(135deg,#fb923c,#f472b6);color:#fff;font-family:inherit;font-size:16px;font-weight:900;cursor:pointer;">Retour</button>'
        + '</div>'
        + '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;">' + cases + '</div>'
        + (PAGES.length > 1 ? '<div style="display:flex;align-items:center;justify-content:center;gap:18px;margin-top:16px;">' + fl(pg - 1, '‹')
            + '<span style="font-size:16px;font-weight:900;color:#fff;">Page ' + (pg + 1) + ' sur ' + PAGES.length + '</span>' + fl(pg + 1, '›') + '</div>' : '')
        + '<div style="text-align:center;font-size:15px;font-weight:800;color:#fdba74;margin-top:14px;">'
        +   (tout ? 'Album complet ! Tu les as tous trouvés !' : n >= N ? 'Bravo ! La page suivante est ouverte.' : 'Chaque séance = un nouvel autocollant') + '</div>'
        + '</div>';
      document.body.appendChild(o);
    } catch (e) { _e(e); }
  }
  function fermerAlbum() { var o = document.getElementById('awkKidAlbum'); if (o) o.remove(); _albNeuf = null; try { accueil(); } catch (e) { _e(e); } }
  var _autoNeuf = null;

  function carte(anim) {
    try {
      var v = document.getElementById('awkKidCarte'); if (v) v.remove();
      var d = chemin(), M = mondeDe(d), N = M.pierres.length;
      var de = anim ? anim.avant : d.pas, a = d.pas, suivant = MONDES[((d.monde || 0) + 1) % MONDES.length];
      var o = document.createElement('div'); o.id = 'awkKidCarte';
      o.style.cssText = 'position:fixed;inset:0;z-index:12800;background:#0b1220;display:flex;flex-direction:column;align-items:center;padding:calc(10px + env(safe-area-inset-top)) 10px calc(10px + env(safe-area-inset-bottom));box-sizing:border-box;';
      var marques = '';
      for (var i = 1; i <= N; i++) {
        var q = posPierre(i, M);
        if (i <= a && !(anim && i === a)) marques += '<div style="position:absolute;left:' + q.x + '%;top:' + q.y + '%;transform:translate(-50%,-60%);display:flex;filter:drop-shadow(0 2px 3px rgba(0,0,0,0.5));">' + ico('etoile', 30, '#facc15') + '</div>';
        else if (i === a + 1 || (anim && i === a)) marques += '<div class="awk-ch-suiv" style="position:absolute;left:' + q.x + '%;top:' + q.y + '%;width:16%;aspect-ratio:1.6;transform:translate(-50%,-50%);border-radius:50%;border:3px solid #fff;animation:awkChPulse 1.4s ease-in-out infinite;"></div>';
      }
      var p0 = posPierre(de, M), fini = a >= N;
      o.innerHTML = '<style>@keyframes awkChPulse{0%,100%{opacity:.9;transform:translate(-50%,-50%) scale(1)}50%{opacity:.3;transform:translate(-50%,-50%) scale(1.15)}}'
        + '#awkKidCarte svg{fill:#facc15;}'
        + '#awkChRenard{transition:left 1.2s ease-in-out,top 1.2s ease-in-out;}</style>'
        + '<div style="display:flex;align-items:center;gap:10px;width:100%;max-width:520px;margin-bottom:8px;">'
        +   '<div style="flex:1;min-width:0;"><div style="font-size:20px;font-weight:900;color:#fff;">' + (anim && anim.nouveau ? 'Nouveau monde !' : fini ? 'Monde terminé !' : 'Pierre ' + a + ' sur ' + N) + '</div>'
        +   '<div style="font-size:13px;font-weight:800;color:#fdba74;">Monde ' + ((d.monde || 0) + 1) + ' · ' + esc(M.nom) + '</div></div>'
        +   '<button onclick="AwakKid.fermerCarte()" style="min-height:44px;padding:8px 18px;border:none;border-radius:14px;background:linear-gradient(135deg,#fb923c,#f472b6);color:#fff;font-family:inherit;font-size:16px;font-weight:900;cursor:pointer;">Retour</button>'
        + '</div>'
        + '<div style="position:relative;flex:1;min-height:0;aspect-ratio:572/1024;max-width:100%;">'
        +   '<img src="images/kid/' + M.img + '.webp" alt="" draggable="false" style="position:absolute;inset:0;width:100%;height:100%;border-radius:14px;">'
        +   marques
        +   '<div id="awkChRenard" style="position:absolute;left:' + p0.x + '%;top:' + p0.y + '%;width:22%;transform:translate(-50%,-88%);pointer-events:none;">'
        +     '<img src="images/kid/renard_' + (fini ? 'saut' : 'salut') + '.webp" alt="" style="width:100%;display:block;animation:awkKidFlotte 2s ease-in-out infinite;filter:drop-shadow(0 4px 6px rgba(0,0,0,0.5));"></div>'
        + '</div>'
        + '<div style="font-size:15px;font-weight:800;color:#bae6fd;margin-top:8px;text-align:center;">'
        +   (fini ? 'Bravo ! +' + BONUS_MONDE + ' étoiles gagnées. Prochaine séance : ' + esc(suivant.nom) + ' !' : (d.tours ? 'Mondes terminés : ' + d.tours + ' · ' : '') + 'Chaque séance = une pierre de plus') + '</div>';
      document.body.appendChild(o);
      sfx('whoosh');
      if (anim && anim.apres !== anim.avant) {
        sfx('pas', 0.55); sfx('pas', 0.9); sfx('pas', 1.25); sfx('pas', 1.6); sfx('ding', 1.8);
        setTimeout(function () {
          var r = document.getElementById('awkChRenard'); if (!r) return;
          var p1 = posPierre(anim.apres, M); r.style.left = p1.x + '%'; r.style.top = p1.y + '%';
          setTimeout(function () {
            try {
              var q = posPierre(anim.apres, M), z = document.querySelector('#awkKidCarte .awk-ch-suiv');
              if (z) z.outerHTML = '<div style="position:absolute;left:' + q.x + '%;top:' + q.y + '%;transform:translate(-50%,-60%);display:flex;filter:drop-shadow(0 2px 3px rgba(0,0,0,0.5));">' + ico('etoile', 30, '#facc15') + '</div>';
              if (navigator.vibrate) navigator.vibrate(60);
            } catch (e) { _e(e); }
            if (anim.bonus) setTimeout(function () { bonusMonde(anim.bonus, M); }, 700);
          }, 1250);
        }, 500);
      }
    } catch (e) { _e(e); }
  }
  var _autoMontrer = null;
  function bonusMonde(n, M) {
    var c = document.getElementById('awkKidCarte'); if (!c) return;
    var ets = ''; for (var i = 0; i < n; i++) ets += '<span style="display:inline-flex;animation:awkAutoPop .6s cubic-bezier(.2,1.6,.4,1) ' + (0.25 + i * 0.18).toFixed(2) + 's both;">' + ico('etoile', i === 2 ? 46 : 36, '#facc15') + '</span>';
    var o = document.createElement('div'); o.id = 'awkKidBonusMonde';
    o.style.cssText = 'position:fixed;inset:0;z-index:12900;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:24px 20px;background:rgba(11,18,32,0.9);';
    o.innerHTML = '<style>@keyframes awkAutoPop{0%{transform:scale(0) rotate(-20deg)}100%{transform:scale(1) rotate(0)}}#awkKidBonusMonde svg{fill:#facc15;}</style>'
      + '<div style="width:100%;max-width:380px;">'
      + '<div style="display:flex;justify-content:center;"><div style="animation:awkRenardSaut 1.3s ease-in-out infinite;">' + renard('bravo', 160) + '</div></div>'
      + '<div style="font-size:32px;font-weight:900;color:#fff;line-height:1.15;margin-top:6px;">Monde terminé !</div>'
      + '<div style="font-size:17px;font-weight:800;color:#bae6fd;margin-top:6px;">' + esc(M.nom) + '</div>'
      + '<div style="display:flex;align-items:flex-end;justify-content:center;gap:6px;margin:18px 0 6px;">' + ets + '</div>'
      + '<div style="font-size:21px;font-weight:900;color:#fde68a;">+' + n + ' étoiles pour toi !</div>'
      + '<button onclick="this.closest(\'#awkKidBonusMonde\').remove()" style="width:100%;min-height:64px;margin-top:24px;border:none;border-radius:20px;cursor:pointer;font-family:inherit;font-size:21px;font-weight:900;color:#fff;background:linear-gradient(135deg,#fb923c,#f472b6);box-shadow:0 8px 26px rgba(251,146,60,0.4);">Youpi !</button>'
      + '</div>';
    document.body.appendChild(o);
    for (var bi = 0; bi < n; bi++) sfx('ding', 0.25 + bi * 0.18);
    try { if (typeof window.speak === 'function') window.speak('Monde terminé ! Tu gagnes ' + n + ' étoiles !', { enfant: true }); } catch (e) { _e(e); }
    try { if (navigator.vibrate) navigator.vibrate([80, 60, 120]); } catch (e) { /* rien */ }
    try { victoire(); } catch (e) { _e(e); }
  }
  function fermerCarte() {
    var bm = document.getElementById('awkKidBonusMonde'); if (bm) bm.remove();
    var o = document.getElementById('awkKidCarte'); if (o) o.remove();
    try { accueil(); } catch (e) { _e(e); }
    if (_autoMontrer) { var a = _autoMontrer; _autoMontrer = null; ouvrirAlbum(a); }
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
    // v1756 : fond bleu des écrans enfant (Accueil, Famille)
    + 'body.awk-enfant:not(.in-session){background:radial-gradient(circle at 50% 0%,#1e3a5f 0%,#0b1220 75%) fixed!important;}'
    // v1757 : séance encore plus enfant
    + 'body.awk-enfant.in-session{background:radial-gradient(circle at 50% 0%,#1e3a5f 0%,#0b1220 75%) fixed!important;}'
    + 'body.awk-enfant.in-session #exerciseView{background:radial-gradient(circle at 50% 0%,#1e3a5f 0%,#0b1220 75%)!important;}'
    + 'body.awk-enfant.in-session #exerciseView .workout-main-card{background:transparent!important;border:none!important;box-shadow:none!important;}'
    + 'body.awk-enfant.in-session #exerciseView .workout-main-card::before,body.awk-enfant.in-session #exerciseView .workout-main-card::after{display:none!important;}'
    + 'body.awk-enfant.in-session #exerciseView .timer.awk-exo-entree{background:transparent!important;border:none!important;box-shadow:none!important;}'
    + 'body.awk-enfant.in-session #exerciseNumber,body.awk-enfant.in-session #sessionTimerChip{display:none!important;}'
    + 'body.awk-enfant.in-session #workoutTopBar{background:#16294a!important;border:none!important;}'
    + 'body.awk-enfant.in-session #quitBtn{border-radius:14px!important;font-size:14px!important;color:#e0f2fe!important;background:rgba(255,255,255,0.08)!important;border:1px solid rgba(255,255,255,0.18)!important;}'
    + 'body.awk-enfant.in-session #awakMusBar{background:rgba(255,255,255,0.06)!important;border:1px solid rgba(255,255,255,0.12)!important;box-shadow:none!important;border-radius:18px!important;}'
    + 'body.awk-enfant.in-session #exerciseVisualFrame{border:3px solid rgba(56,189,248,0.45)!important;border-radius:24px!important;box-shadow:0 8px 30px rgba(0,0,0,0.35)!important;}'
    // v1761 : chrono plus petit, dans le coin (il cachait trop l'image)
    + 'body.awk-enfant.in-session #exerciseVisualFrame #timerDisplay,body.awk-enfant.in-session #timerDisplay{background:linear-gradient(135deg,#fb923c,#f472b6)!important;color:#fff!important;border:none!important;border-radius:12px!important;font-size:19px!important;padding:4px 10px!important;top:8px!important;left:8px!important;letter-spacing:0!important;box-shadow:0 3px 10px rgba(0,0,0,0.35)!important;text-shadow:none!important;}'
    + 'body.awk-enfant.in-session #awakEnsuite{font-size:15px!important;}'
    + 'body.awk-enfant.in-session #awakEnsuite .awk-ens-lbl{color:#fdba74!important;letter-spacing:0!important;text-transform:none!important;font-size:15px!important;}'
    + 'body.awk-enfant.in-session #awakBarreActions{background:linear-gradient(180deg,rgba(11,18,32,0),#0b1220 45%)!important;box-shadow:none!important;border:none!important;backdrop-filter:none!important;}'
    + '#awkKidProgres{display:none;}body.awk-enfant.in-session #awkKidProgres{display:flex;}'
    + '@keyframes awkProgPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.18)}}'
    + '@keyframes awkEncour{0%{transform:scale(.6);opacity:0}15%{transform:scale(1.05);opacity:1}25%,85%{transform:scale(1);opacity:1}100%{transform:scale(.9);opacity:0}}'
    + '.awk-kid-tuiles{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:14px;}'
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
    // v1748 : le libellé est écrit dans le bouton (le ::before ne s'affichait pas sur certains téléphones)
    + 'body.awk-enfant.in-session #awakBarreActions #awakSuivantBtn{color:#fff!important;}'
    + 'body.awk-enfant.in-session #awakSuivantBtn > span + span{display:none!important;}'
    + 'body.awk-enfant.in-session #awakSuivantBtn > span:first-child{font-size:20px!important;font-weight:900!important;color:#fff!important;letter-spacing:0!important;text-transform:none!important;}'
    + 'body.awk-enfant.in-session #exerciseView #exerciseName{font-size:28px!important;color:#fff!important;}'
    + 'body.awk-enfant.in-session #awkKidConsigne{display:block;}'
    + '#awkKidConsigne{display:none;margin:10px 0 4px;padding:12px 14px;border-radius:16px;background:rgba(56,189,248,0.1);border:2px solid rgba(56,189,248,0.35);color:#e0f2fe;font-size:17px;font-weight:800;line-height:1.35;text-align:center;}'
    + '#awkKidConsigne.avec-renard{display:none;align-items:center;gap:10px;text-align:left;}body.awk-enfant.in-session #awkKidConsigne.avec-renard{display:flex;}'
    + '@keyframes awkRenardSaut{0%,100%{transform:translateY(0) rotate(0)}30%{transform:translateY(-22px) rotate(-4deg)}60%{transform:translateY(0) rotate(3deg)}}'
    + '@keyframes awkRenardEntre{from{transform:scale(0.4) translateY(40px);opacity:0}to{transform:scale(1) translateY(0);opacity:1}}'
    + 'body:has(#awkKidFin) .toast-container{display:none!important;}'
    // v1746 : onglet Famille version enfant
    + 'body.awk-enfant #familyTab > :not(#awakKidFamille){display:none!important;}'
    + '#awakKidFamille{display:none;}body.awk-enfant #awakKidFamille{display:block;}'
    // v1741 : repos entre deux séries — il couvrait « J'ai fini ! » ; version enfant
    + 'body.awk-enfant #globalRestBanner .awk-repos-pas{visibility:hidden!important;}'
    + 'body.awk-enfant #globalRestBanner .awk-repos-lbl{font-size:18px!important;font-weight:900!important;color:#fdba74!important;letter-spacing:0!important;text-transform:none!important;}'
    + 'body.awk-enfant #globalRestBanner .awk-repos-passer{font-size:20px!important;font-weight:900!important;color:#fff!important;min-height:64px!important;border-radius:20px!important;border:none!important;'
    +   'background:linear-gradient(135deg,var(--kid-orange),var(--kid-rose))!important;box-shadow:0 8px 26px rgba(251,146,60,0.4)!important;}'
    + 'body.awk-enfant #globalRestBanner #globalRestFill{background:linear-gradient(90deg,var(--kid-orange),var(--kid-jaune))!important;}'
    // v1744 : départ et repos version enfant
    + 'body.awk-enfant #smartAnalysisOverlay{display:none!important;}'
    + 'body.awk-enfant.in-session .toast-container{display:none!important;}'
    + '@keyframes awkDepPoint{0%,80%,100%{transform:scale(.6);opacity:.4}40%{transform:scale(1);opacity:1}}'
    + '@keyframes awkDepSort{to{opacity:0;transform:scale(1.06)}}'
    + '#awkKidDepart.sort{animation:awkDepSort .35s ease-in forwards;}'
    // Décompte 3-2-1 : renard + gros chiffres orange
    + 'body.awk-enfant #countdownOverlay.active{display:flex!important;}'
    + 'body.awk-enfant #countdownOverlay{background:radial-gradient(circle at 50% 35%,#1e3a5f 0%,#0b1220 72%)!important;}'
    + 'body.awk-enfant #countdownOverlay::before{content:"";position:relative;inset:auto;width:150px;height:150px;flex-shrink:0;margin-bottom:-6px;background:url(images/kid/renard_pouce.webp) center/contain no-repeat;animation:awkKidFlotte 1.8s ease-in-out infinite;}'
    + 'body.awk-enfant #countdownNumber{font-size:11rem!important;letter-spacing:-4px!important;color:#fb923c!important;text-shadow:0 0 50px rgba(251,146,60,0.6)!important;}'
    + 'body.awk-enfant #countdownExerciseName{color:#fff!important;text-transform:none!important;letter-spacing:0!important;font-size:1.6em!important;text-shadow:none!important;padding:0 16px;}'
    + 'body.awk-enfant #countdownLabel{font-size:17px!important;letter-spacing:0!important;text-transform:none!important;color:#bae6fd!important;}'
    // Repos entre deux exercices
    + 'body.awk-enfant #restOverlay{background:radial-gradient(circle at 50% 30%,#1e3a5f 0%,#0b1220 72%)!important;justify-content:center!important;}'
    + 'body.awk-enfant #restLabelTop{font-size:26px!important;font-weight:900!important;color:#fdba74!important;text-transform:none!important;letter-spacing:0!important;}'
    + 'body.awk-enfant #restLabelTop::after{content:"";display:block;width:120px;height:120px;margin:0 auto -4px;background:url(images/kid/renard_salut.webp) center/contain no-repeat;animation:awkKidFlotte 2.4s ease-in-out infinite;}'
    + 'body.awk-enfant #restLabelTop{display:flex;flex-direction:column-reverse;align-items:center;}'
    + 'body.awk-enfant #restRingWrap{transform:scale(.78);margin:-18px 0!important;}'
    + 'body.awk-enfant #restRingArc{stroke:#fb923c!important;}'
    + 'body.awk-enfant #restLabelBottom,body.awk-enfant #restMotivationMsg,body.awk-enfant #restActiveBtn,body.awk-enfant #restActiveExercise,'
    +   'body.awk-enfant #restBtns .rest-btn-adj,body.awk-enfant #restNextMuscle,body.awk-enfant #restNextBar,body.awk-enfant #restNextEmoji{display:none!important;}'
    + 'body.awk-enfant #restNextCard{background:rgba(56,189,248,0.1)!important;border:2px solid rgba(56,189,248,0.35)!important;border-radius:18px!important;box-shadow:none!important;padding:12px 14px!important;}'
    + 'body.awk-enfant #restNextCard::before,body.awk-enfant #restNextCard::after{display:none!important;}'
    + 'body.awk-enfant #restNextLabel{font-size:14px!important;font-weight:800!important;color:#bae6fd!important;letter-spacing:0!important;text-transform:none!important;}'
    + 'body.awk-enfant #restNextName{font-size:22px!important;font-weight:900!important;text-transform:none!important;letter-spacing:0!important;color:#fff!important;}'
    + 'body.awk-enfant #restBtns{width:100%;max-width:340px;}'
    + 'body.awk-enfant #restSkipBtn{flex:1!important;width:100%!important;min-height:64px!important;border-radius:20px!important;border:none!important;font-size:21px!important;color:#fff!important;letter-spacing:0!important;text-transform:none!important;'
    +   'background:linear-gradient(135deg,var(--kid-orange),var(--kid-rose))!important;box-shadow:0 8px 26px rgba(251,146,60,0.4)!important;}'
    + 'body.awk-enfant #restSkipBtn::before{display:none!important;}'
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
      + bullesEnfants()
      + '<div style="display:flex;justify-content:center;margin:4px 0 20px;">'
      +   '<button onclick="AwakKid.bouger()" aria-label="Bouger" style="width:220px;height:220px;border-radius:50%;border:none;cursor:pointer;font-family:inherit;color:#fff;'
      +     'background:radial-gradient(circle at 35% 30%,#fdba74,#fb923c 45%,#f472b6);animation:awkKidPulse 2.4s ease-in-out infinite;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;">'
      +     '<span style="display:inline-flex;animation:awkKidFlotte 2.4s ease-in-out infinite;">' + ico('eclair', 54, '#fff') + '</span>'
      +     '<span style="font-size:34px;font-weight:900;letter-spacing:0.5px;line-height:1;">' + (fait ? 'Encore !' : 'Bouger !') + '</span>'
      +     '<span style="font-size:14px;font-weight:800;opacity:0.92;">15 minutes de jeux</span>'
      +   '</button>'
      + '</div>'
      + '<div class="awk-kid-tuiles">' + tuileMissions() + tuileAventure() + tuileAlbum() + tuileEtoiles() + '</div>';
  }
  // v1756 : les 4 cartes de l'accueil en tuiles, deux par rangée
  function tuile(onclick, coul, visuel, titre, sous, bas) {
    return '<button onclick="' + onclick + '" style="display:flex;flex-direction:column;align-items:center;text-align:center;gap:6px;min-height:0;padding:14px 10px 12px;border-radius:20px;cursor:pointer;font-family:inherit;'
      + 'background:linear-gradient(160deg,' + coul + '26,' + coul + '0d);border:2px solid ' + coul + '66;">'
      + '<span style="height:64px;display:flex;align-items:center;justify-content:center;">' + visuel + '</span>'
      + '<span style="font-size:17px;font-weight:900;color:#fff;line-height:1.15;">' + titre + '</span>'
      + '<span style="font-size:13px;font-weight:800;color:' + coul + ';line-height:1.25;">' + sous + '</span>'
      + (bas || '') + '</button>';
  }
  function barreT(a, b) {
    var pc = Math.max(0, Math.min(100, Math.round(a / Math.max(1, b) * 100)));
    return '<span style="display:block;width:100%;height:8px;margin-top:2px;background:rgba(255,255,255,0.12);border-radius:99px;overflow:hidden;"><span style="display:block;height:100%;width:' + pc + '%;background:linear-gradient(90deg,#fb923c,#facc15);border-radius:99px;"></span></span>';
  }
  function tuileMissions() {
    var P = progs(); if (!P.length) return '';
    var f = faitsProg(), faits = 0;
    P.forEach(function (p) { faits += Object.keys((f[p.id] || {}).jours || {}).length; });
    var vis = '<span style="display:grid;grid-template-columns:repeat(2,28px);gap:4px;">' + P.slice(0, 4).map(function (p, i) { return pastilleProg(p, i, 28); }).join('') + '</span>';
    return tuile('AwakKid.missions()', '#f472b6', vis, 'Mes missions', faits ? faits + ' réussie' + (faits > 1 ? 's' : '') : P.length + ' aventures');
  }
  function tuileAventure() {
    var d = chemin(), M = mondeDe(d), N = M.pierres.length;
    var vis = '<img src="images/kid/' + M.img + '.webp" alt="" style="width:40px;height:64px;object-fit:cover;border-radius:8px;">';
    return tuile('AwakKid.carte()', '#38bdf8', vis, 'Mon aventure', d.pas >= N ? 'Monde terminé !' : 'Pierre ' + d.pas + ' sur ' + N, barreT(d.pas, N));
  }
  function tuileAlbum() {
    var d = album(), pc = pageCourante(d), A = PAGES[pc], n = 0;
    A.forEach(function (a) { if (d.ont.indexOf(a[0]) >= 0) n++; });
    var der = d.ont.length ? d.ont[d.ont.length - 1] : 'etoile';
    return tuile('AwakKid.album()', '#fb923c', imgAuto(der, '60px', d.ont.length ? '' : 'filter:grayscale(1);opacity:.4;'), 'Mon album',
      (PAGES.length > 1 ? 'Page ' + (pc + 1) + ' · ' : '') + n + ' sur ' + A.length, barreT(n, A.length));
  }
  function tuileEtoiles() {
    var r = null; try { r = window.AwakEtoiles && AwakEtoiles.resume ? AwakEtoiles.resume() : null; } catch (e) { _e(e); }
    if (!r) return '';
    var vis = '<span style="position:relative;display:flex;align-items:center;justify-content:center;width:64px;height:64px;">' + ico('etoile', 58, '#facc15')
      + '<span style="position:absolute;font-size:20px;font-weight:900;color:#fde68a;">' + '</span></span>';
    var sous = r.peut ? 'Choisis un cadeau !' : r.prochaine ? 'Encore ' + (r.prochaine.cout - r.dispo) : 'Bouge pour en gagner';
    return tuile('AwakEtoiles.ouvrirEnfant()', '#facc15', '<span style="display:flex;align-items:center;gap:6px;">' + ico('etoile', 40, '#facc15') + '<span style="font-size:36px;font-weight:900;color:#fde68a;">' + r.dispo + '</span></span>',
      'Mes étoiles', sous, r.prochaine && !r.peut ? barreT(r.dispo, r.prochaine.cout) : '');
  }
  // v1749 : les programmes enfant (cachés avec l'onglet Séance) reviennent ici
  var COULS = ['#fb923c', '#38bdf8', '#f472b6', '#facc15'];
  function progs() { try { return window.AwakKidsPrograms ? AwakKidsPrograms.all() : []; } catch (e) { return []; } }
  function faitsProg() { try { return window.AwakKidsPrograms ? AwakKidsPrograms.missionsFaites() : {}; } catch (e) { return {}; } }
  function pastilleProg(p, i, taille) {
    var c = COULS[i % COULS.length], n = 'etoile';
    try { n = AwakKidsPrograms.icone(p.id); } catch (e) { _e(e); }
    return '<span style="width:' + taille + 'px;height:' + taille + 'px;border-radius:' + Math.round(taille * 0.3) + 'px;flex-shrink:0;display:flex;align-items:center;justify-content:center;background:' + c + '33;border:2px solid ' + c + '88;">' + ico(n, Math.round(taille * 0.5), c) + '</span>';
  }
  function carteMissionsHTML() {
    var P = progs(); if (!P.length) return '';
    var f = faitsProg(), faits = 0;
    P.forEach(function (p) { faits += Object.keys((f[p.id] || {}).jours || {}).length; });
    var mini = P.slice(0, 5).map(function (p, i) { return pastilleProg(p, i, 30); }).join('');
    return '<button onclick="AwakKid.missions()" style="display:flex;align-items:center;gap:12px;width:100%;margin:0 0 14px;padding:12px 14px;min-height:0;border-radius:18px;cursor:pointer;font-family:inherit;text-align:left;'
      + 'background:linear-gradient(135deg,rgba(244,114,182,0.16),rgba(251,146,60,0.1));border:2px solid rgba(244,114,182,0.4);">'
      + '<span style="flex:1;min-width:0;display:block;">'
      +   '<span style="display:block;font-size:18px;font-weight:900;color:#fff;">Mes missions</span>'
      +   '<span style="display:block;font-size:14px;font-weight:700;color:#fbcfe8;margin:2px 0 7px;">Super-héros, ninja, pirates…' + (faits ? ' · ' + faits + ' réussie' + (faits > 1 ? 's' : '') : '') + '</span>'
      +   '<span style="display:flex;gap:4px;">' + mini + '</span>'
      + '</span><span style="font-size:26px;font-weight:900;color:#fbcfe8;line-height:1;">›</span></button>';
  }
  var FOND = 'position:fixed;inset:0;z-index:12800;overflow-y:auto;background:radial-gradient(circle at 50% 12%,#1e3a5f,#0b1220 70%);padding:calc(12px + env(safe-area-inset-top)) 14px calc(24px + env(safe-area-inset-bottom));box-sizing:border-box;';
  var RET = 'min-height:44px;padding:8px 18px;flex-shrink:0;border:none;border-radius:14px;background:linear-gradient(135deg,#fb923c,#f472b6);color:#fff;font-family:inherit;font-size:16px;font-weight:900;cursor:pointer;';
  function missions() {
    var v = document.getElementById('awkKidMissions'); if (v) v.remove();
    var P = progs(), f = faitsProg();
    var cartes = P.map(function (p, i) {
      var n = Object.keys((f[p.id] || {}).jours || {}).length, tot = p.sessions.length, pts = '';
      for (var k = 0; k < tot; k++) pts += '<span style="width:10px;height:10px;border-radius:50%;display:inline-block;background:' + (k < n ? '#facc15' : 'rgba(255,255,255,0.15)') + ';"></span>';
      return '<button onclick="AwakKid.mission(\'' + p.id + '\')" style="display:flex;flex-direction:column;align-items:center;gap:8px;text-align:center;padding:14px 8px 12px;min-height:0;border-radius:20px;cursor:pointer;font-family:inherit;'
        + 'background:rgba(255,255,255,0.05);border:2px solid ' + COULS[i % COULS.length] + '55;">'
        + pastilleProg(p, i, 56)
        + '<span style="font-size:15px;font-weight:900;color:#fff;line-height:1.2;">' + esc(p.name) + '</span>'
        + '<span style="display:flex;gap:4px;">' + pts + '</span></button>';
    }).join('');
    sfx('whoosh');
    var o = document.createElement('div'); o.id = 'awkKidMissions'; o.style.cssText = FOND;
    o.innerHTML = '<div style="max-width:480px;margin:0 auto;">'
      + '<div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;">' + renard('pouce', 76)
      +   '<div style="flex:1;min-width:0;"><div style="font-size:24px;font-weight:900;color:#fff;line-height:1.1;">Mes missions</div>'
      +   '<div style="font-size:14px;font-weight:800;color:#bae6fd;margin-top:4px;">Choisis ton aventure !</div></div>'
      +   '<button onclick="document.getElementById(\'awkKidMissions\').remove()" style="' + RET + '">Retour</button></div>'
      + '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;">' + cartes + '</div></div>';
    document.body.appendChild(o);
  }
  function mission(id) {
    var P = progs(), i = 0, p = null;
    P.forEach(function (x, k) { if (x.id === id) { p = x; i = k; } });
    if (!p) return;
    var v = document.getElementById('awkKidMission'); if (v) v.remove();
    var f = (faitsProg()[id] || {}).jours || {}, c = COULS[i % COULS.length];
    var prochaine = 0; while (prochaine < p.sessions.length && f[prochaine]) prochaine++;
    var lignes = p.sessions.map(function (se, k) {
      var fait = !!f[k], ici = k === prochaine;
      return '<div style="padding:14px;border-radius:20px;margin-bottom:10px;' + (ici ? 'background:linear-gradient(135deg,rgba(251,146,60,0.18),rgba(244,114,182,0.12));border:2px solid rgba(251,146,60,0.6);' : 'background:rgba(255,255,255,0.05);border:2px solid rgba(255,255,255,0.08);') + '">'
        + '<div style="display:flex;align-items:center;gap:12px;">'
        +   '<span style="width:40px;height:40px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:900;'
        +     (fait ? 'background:#facc15;">' + ico('etoile', 22, '#0b1220') : 'background:' + c + ';color:#0b1220;">' + (k + 1)) + '</span>'
        +   '<div style="flex:1;min-width:0;"><div style="font-size:17px;font-weight:900;color:#fff;">' + esc(se.name) + '</div>'
        +   '<div style="font-size:13px;font-weight:700;color:#94a3b8;margin-top:2px;line-height:1.35;">' + se.exercises.map(esc).join(' · ') + '</div></div>'
        + '</div>'
        + '<button onclick="AwakKid.lancerMission(\'' + id + '\',' + k + ')" style="width:100%;min-height:' + (ici ? 56 : 46) + 'px;margin-top:12px;border-radius:16px;cursor:pointer;font-family:inherit;font-weight:900;color:#fff;font-size:' + (ici ? 19 : 16) + 'px;'
        +   (ici ? 'border:none;background:linear-gradient(135deg,#fb923c,#f472b6);box-shadow:0 6px 18px rgba(251,146,60,0.35);' : 'background:rgba(255,255,255,0.06);border:2px solid rgba(255,255,255,0.15);') + '">'
        +   (fait ? 'Rejouer' : 'C\'est parti !') + '</button></div>';
    }).join('');
    var o = document.createElement('div'); o.id = 'awkKidMission'; o.style.cssText = FOND.replace('z-index:12800', 'z-index:12850');
    o.innerHTML = '<div style="max-width:480px;margin:0 auto;">'
      + '<div style="display:flex;justify-content:flex-end;margin-bottom:6px;"><button onclick="document.getElementById(\'awkKidMission\').remove()" style="' + RET + '">Retour</button></div>'
      + '<div style="text-align:center;margin-bottom:16px;"><div style="display:flex;justify-content:center;">' + pastilleProg(p, i, 88) + '</div>'
      +   '<div style="font-size:26px;font-weight:900;color:#fff;margin-top:10px;line-height:1.15;">' + esc(p.name) + '</div>'
      +   '<div style="font-size:16px;font-weight:800;color:#bae6fd;margin-top:6px;line-height:1.4;">' + esc(p.desc || '') + '</div></div>'
      + lignes + '</div>';
    document.body.appendChild(o);
  }
  function lancerMission(id, k) {
    ['awkKidMission', 'awkKidMissions'].forEach(function (x) { var v = document.getElementById(x); if (v) v.remove(); });
    try { depart(); window._awkKidDirect = true; AwakKidsPrograms.lancer(id, k); } catch (e) { _e(e); window._awkKidDirect = false; finDepart(); }
  }

  // v1770 : changer vite d'enfant (frère, sœur) — bulles à l'accueil, sans code ; un adulte demande le code parent
  function autresEnfants() {
    var moi = ''; try { moi = getCurrentProfileId(); } catch (e) { _e(e); }
    var tous = []; try { tous = window.getAllProfiles ? getAllProfiles() : JSON.parse(localStorage.getItem('allProfiles') || '[]'); } catch (e) { _e(e); }
    return tous.filter(function (p) {
      if (!p || p.id === moi) return false;
      try { var u = JSON.parse(localStorage.getItem('profile_' + p.id + '_userProfile') || 'null'); var a = u ? parseInt(u.age, 10) : 0; return a >= 3 && a < 13; } catch (e) { return false; }
    });
  }
  function bullesEnfants() {
    var l = autresEnfants(); if (!l.length) return '';
    return '<div style="display:flex;align-items:center;gap:10px;margin:0 2px 6px;padding:8px 12px;border-radius:18px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);">'
      + '<span style="font-size:13px;font-weight:800;color:#bae6fd;flex-shrink:0;">C\'est à qui ?</span>'
      + '<div style="display:flex;gap:10px;overflow-x:auto;flex:1;">' + l.map(function (p) {
        return '<button onclick="AwakKid.changerEnfant(\'' + esc(p.id) + '\')" aria-label="Passer à ' + esc(p.name || '') + '" style="flex-shrink:0;display:flex;flex-direction:column;align-items:center;gap:3px;padding:0;min-height:0;background:none;border:none;cursor:pointer;font-family:inherit;">'
          + '<span style="display:block;border-radius:50%;border:3px solid #38bdf8;">' + visage(p, 40) + '</span>'
          + '<span style="font-size:12px;font-weight:900;color:#fff;max-width:64px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + esc(p.name || '') + '</span></button>';
      }).join('') + '</div></div>';
  }
  function changerEnfant(id) {
    if (!autresEnfants().some(function (p) { return p.id === id; })) return;   // seulement un autre enfant
    try { if (document.body.classList.contains('in-session')) return; } catch (e) { _e(e); }
    sfx('whoosh');
    try { document.documentElement.classList.add('awk-kid-charge'); } catch (e) { _e(e); }
    setTimeout(function () { try { window.switchProfile(id); } catch (e) { _e(e); document.documentElement.classList.remove('awk-kid-charge'); } }, 120);
  }

  function carteAlbumHTML() {
    var d = album(), pc = pageCourante(d), AUTOS = PAGES[pc], N = AUTOS.length, mini = '', n = 0;
    AUTOS.forEach(function (a) { if (d.ont.indexOf(a[0]) >= 0) { n++; mini += imgAuto(a[0], '26px'); } });
    var tout = PAGES.every(function (x, i) { return pleine(d, i); });
    return '<button onclick="AwakKid.album()" style="display:flex;align-items:center;gap:12px;width:100%;margin:0 0 14px;padding:12px 14px;min-height:0;border-radius:18px;cursor:pointer;font-family:inherit;text-align:left;'
      + 'background:linear-gradient(135deg,rgba(251,146,60,0.14),rgba(250,204,21,0.08));border:2px solid rgba(251,146,60,0.35);">'
      + imgAuto(d.ont.length ? d.ont[d.ont.length - 1] : 'etoile', '48px', d.ont.length ? '' : 'filter:grayscale(1);opacity:.4;')
      + '<span style="flex:1;min-width:0;display:block;">'
      +   '<span style="display:block;font-size:18px;font-weight:900;color:#fff;">Mon album</span>'
      +   '<span style="display:block;font-size:14px;font-weight:700;color:#fed7aa;margin:2px 0 4px;">' + (tout ? 'Album complet !' : (PAGES.length > 1 ? 'Page ' + (pc + 1) + ' · ' : '') + n + ' sur ' + N + ' autocollants') + '</span>'
      +   '<span style="display:flex;gap:2px;flex-wrap:wrap;">' + mini + '</span>'
      + '</span><span style="font-size:26px;font-weight:900;color:#fed7aa;line-height:1;">›</span></button>';
  }
  function carteAventureHTML() {
    var d = chemin(), M = mondeDe(d), N = M.pierres.length, pts = '';
    for (var i = 1; i <= N; i++) pts += '<span style="flex:1;height:8px;border-radius:99px;background:' + (i <= d.pas ? 'linear-gradient(90deg,#fb923c,#facc15)' : 'rgba(255,255,255,0.12)') + ';"></span>';
    return '<button onclick="AwakKid.carte()" style="display:flex;align-items:center;gap:12px;width:100%;margin:0 0 14px;padding:12px 14px;min-height:0;border-radius:18px;cursor:pointer;font-family:inherit;text-align:left;'
      + 'background:linear-gradient(135deg,rgba(56,189,248,0.14),rgba(244,114,182,0.1));border:2px solid rgba(56,189,248,0.35);">'
      + '<img src="images/kid/' + M.img + '.webp" alt="" style="width:44px;height:78px;object-fit:cover;border-radius:8px;flex-shrink:0;">'
      + '<span style="flex:1;min-width:0;display:block;">'
      +   '<span style="display:block;font-size:18px;font-weight:900;color:#fff;">Mon aventure</span>'
      +   '<span style="display:block;font-size:14px;font-weight:700;color:#bae6fd;margin:2px 0 7px;">' + 'Monde ' + ((d.monde || 0) + 1) + ' · ' + (d.pas >= N ? 'Terminé !' : 'Pierre ' + d.pas + ' sur ' + N) + '</span>'
      +   '<span style="display:flex;gap:3px;">' + pts + '</span>'
      + '</span>' + '<span style="font-size:26px;font-weight:900;color:#bae6fd;line-height:1;">›</span>' + '</button>';
  }

  function depart() {
    var v = document.getElementById('awkKidDepart'); if (v) v.remove();
    sfx('go');
    var o = document.createElement('div'); o.id = 'awkKidDepart';
    o.style.cssText = 'position:fixed;inset:0;z-index:100001;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:24px;background:radial-gradient(circle at 50% 35%,#1e3a5f 0%,#0b1220 72%);';
    var pts = ''; for (var i = 0; i < 3; i++) pts += '<span style="width:12px;height:12px;border-radius:50%;background:#fb923c;display:inline-block;animation:awkDepPoint 1.1s ease-in-out ' + (i * 0.18).toFixed(2) + 's infinite;"></span>';
    o.innerHTML = '<div style="animation:awkRenardEntre .5s cubic-bezier(.2,1.4,.4,1) both;"><div style="animation:awkRenardSaut 1.2s ease-in-out .5s infinite;">' + renard('saut', 190) + '</div></div>'
      + '<div style="font-size:36px;font-weight:900;color:#fff;line-height:1.1;margin-top:8px;">C\'est parti' + (prenom() ? ', ' + esc(prenom()) : '') + ' !</div>'
      + '<div style="font-size:17px;font-weight:800;color:#bae6fd;margin-top:10px;">Je prépare tes jeux</div>'
      + '<div style="display:flex;gap:8px;margin-top:16px;">' + pts + '</div>';
    document.body.appendChild(o);
    try { if (typeof window.speak === 'function') window.speak('C\'est parti' + (prenom() ? ' ' + prenom() : '') + ' !', { enfant: true }); } catch (e) { _e(e); }
    setTimeout(finDepart, 12000);   // filet
  }
  function finDepart() {
    var o = document.getElementById('awkKidDepart'); if (!o || o.classList.contains('sort')) return;
    o.classList.add('sort'); setTimeout(function () { if (o.parentNode) o.remove(); }, 380);
  }

  // ── Famille version enfant ──
  var MSGS = ['Bravo !', 'On bouge ensemble ?', 'Je t\'aime !', 'Tu es super fort !'];
  function aBougeAujourdhuiId(id) {
    try {
      var t0 = new Date(); t0.setHours(0, 0, 0, 0);
      var l = (window.AwakFamilySky && AwakFamilySky.seances) ? AwakFamilySky.seances(id) : [];
      return (l || []).some(function (t) { return t >= +t0; });
    } catch (e) { return false; }
  }
  function visage(m, taille) {
    var src = ''; try { src = window.awakPortraitSrc ? window.awakPortraitSrc(m.avatar) : ''; } catch (e) { _e(e); }
    if (src) return '<img src="' + src + '" alt="" style="width:' + taille + 'px;height:' + taille + 'px;border-radius:50%;object-fit:cover;display:block;">';
    var l = String(m.name || '?').trim().charAt(0).toUpperCase();
    return '<div style="width:' + taille + 'px;height:' + taille + 'px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#38bdf8,#f472b6);color:#fff;font-size:' + Math.round(taille * 0.45) + 'px;font-weight:900;">' + esc(l) + '</div>';
  }
  function famille() {
    var tab = document.getElementById('familyTab'); if (!tab) return;
    var el = document.getElementById('awakKidFamille');
    if (!el) { el = document.createElement('div'); el.id = 'awakKidFamille'; tab.insertBefore(el, tab.firstChild); }
    if (!enfant()) { el.innerHTML = ''; return; }
    var moi = ''; try { moi = getCurrentProfileId(); } catch (e) { _e(e); }
    var mbs = []; try { mbs = (window.AwakFamily ? AwakFamily.familleMembres() : []).filter(function (p) { return p.id !== moi; }); } catch (e) { _e(e); }
    var msgs = []; try { msgs = window.AwakFamily && AwakFamily.pendingNudges ? AwakFamily.pendingNudges() : []; } catch (e) { _e(e); }
    var sem = null; try { sem = window.AwakFamilySky ? AwakFamilySky.etatSemaine() : null; } catch (e) { _e(e); }
    var h = '<div style="display:flex;align-items:center;gap:6px;margin:6px 2px 14px;">'
      + renard('salut', 90, 'animation:awkKidFlotte 3s ease-in-out infinite;')
      + '<div style="flex:1;min-width:0;"><div style="font-size:26px;font-weight:900;color:#fff;line-height:1.1;">Ma famille</div>'
      + '<div style="display:inline-block;margin-top:6px;padding:7px 12px;border-radius:14px 14px 14px 4px;background:#fff;color:#0c4a6e;font-size:15px;font-weight:800;">Envoie un bravo !</div></div></div>';
    if (msgs.length) {
      var der = msgs[msgs.length - 1];
      h += '<button onclick="AwakKid.lireMessages()" style="display:flex;align-items:center;gap:12px;width:100%;margin:0 0 14px;padding:14px;min-height:0;border-radius:18px;cursor:pointer;font-family:inherit;text-align:left;'
        + 'background:linear-gradient(135deg,rgba(244,114,182,0.2),rgba(251,146,60,0.14));border:2px solid rgba(244,114,182,0.55);animation:awkBulle .4s ease-out both;">'
        + '<div style="width:50px;height:50px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;background:rgba(244,114,182,0.25);">' + ico('message', 26, '#fbcfe8') + '</div>'
        + '<span style="flex:1;min-width:0;"><span style="display:block;font-size:18px;font-weight:900;color:#fff;">' + esc(der.fromName || 'Ta famille') + ' t\'a écrit !</span>'
        + '<span style="display:block;font-size:14px;font-weight:800;color:#fbcfe8;margin-top:2px;">Touche pour lire' + (msgs.length > 1 ? ' (' + msgs.length + ' messages)' : '') + '</span></span>'
        + '<span style="font-size:26px;font-weight:900;color:#fbcfe8;line-height:1;">›</span></button>';
    }
    if (mbs.length) {
      h += '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:14px;">' + mbs.map(function (m) {
        var ok = aBougeAujourdhuiId(m.id);
        return '<div style="padding:14px 10px 12px;border-radius:20px;text-align:center;background:rgba(255,255,255,0.05);border:2px solid ' + (ok ? 'rgba(251,146,60,0.55)' : 'rgba(255,255,255,0.1)') + ';">'
          + '<div style="position:relative;width:72px;margin:0 auto;">' + visage(m, 72)
          +   (ok ? '<span style="position:absolute;right:-6px;bottom:-4px;width:30px;height:30px;border-radius:50%;background:#fb923c;display:flex;align-items:center;justify-content:center;border:3px solid #0b1220;">' + ico('etoile', 16, '#fff') + '</span>' : '') + '</div>'
          + '<div style="font-size:18px;font-weight:900;color:#fff;margin-top:8px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + esc(m.name || 'Famille') + '</div>'
          + '<div style="font-size:13px;font-weight:800;color:' + (ok ? '#fdba74' : '#94a3b8') + ';margin-top:2px;">' + (ok ? 'A bougé aujourd\'hui !' : 'Pas encore bougé') + '</div>'
          + '<button onclick="AwakKid.bravo(\'' + esc(m.id) + '\')" style="width:100%;min-height:46px;margin-top:10px;border:none;border-radius:14px;cursor:pointer;font-family:inherit;font-size:16px;font-weight:900;color:#fff;'
          +   'background:linear-gradient(135deg,var(--kid-orange,#fb923c),var(--kid-rose,#f472b6));display:flex;align-items:center;justify-content:center;gap:6px;">' + ico('coeur', 18, '#fff') + 'Bravo</button>'
          + '</div>';
      }).join('') + '</div>';
    }
    h += '<button onclick="if(window.AwakKidsOpen)AwakKidsOpen()" style="display:flex;align-items:center;gap:12px;width:100%;margin:0 0 14px;padding:14px;min-height:0;border-radius:18px;cursor:pointer;font-family:inherit;text-align:left;'
      + 'background:linear-gradient(135deg,rgba(56,189,248,0.16),rgba(244,114,182,0.1));border:2px solid rgba(56,189,248,0.4);">'
      + '<div style="width:52px;height:52px;border-radius:16px;flex-shrink:0;display:flex;align-items:center;justify-content:center;background:rgba(56,189,248,0.22);">' + ico('manette', 28, '#bae6fd') + '</div>'
      + '<span style="flex:1;min-width:0;"><span style="display:block;font-size:18px;font-weight:900;color:#fff;">Jouer ensemble</span>'
      + '<span style="display:block;font-size:14px;font-weight:800;color:#bae6fd;margin-top:2px;">Tag, statue, marche des animaux</span></span>'
      + '<span style="font-size:26px;font-weight:900;color:#bae6fd;line-height:1;">›</span></button>';
    if (sem) {
      var reste = Math.max(0, sem.cible - sem.total), pc = Math.min(100, Math.round(sem.total / Math.max(1, sem.cible) * 100));
      h += '<div style="padding:14px;border-radius:18px;margin-bottom:14px;background:linear-gradient(135deg,rgba(250,204,21,0.12),rgba(251,146,60,0.08));border:2px solid rgba(250,204,21,0.35);">'
        + '<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">' + ico('trophee', 30, '#fde68a')
        + '<div style="flex:1;min-width:0;"><div style="font-size:18px;font-weight:900;color:#fff;">Le défi de la famille</div>'
        + '<div style="font-size:14px;font-weight:800;color:#fed7aa;margin-top:2px;">' + (sem.complete ? 'Réussi ! Bravo la famille !' : 'Encore ' + reste + ' séance' + (reste > 1 ? 's' : '') + ' cette semaine') + '</div></div>'
        + '<div style="font-size:20px;font-weight:900;color:#fde68a;">' + Math.min(sem.total, sem.cible) + '/' + sem.cible + '</div></div>'
        + '<div style="height:14px;background:rgba(255,255,255,0.1);border-radius:99px;overflow:hidden;"><div style="height:100%;width:' + pc + '%;background:linear-gradient(90deg,#fb923c,#facc15);border-radius:99px;"></div></div>'
        + '</div>';
    }
    el.innerHTML = h;
  }
  function feuilleKid(id, html) {
    var v = document.getElementById(id); if (v) v.remove();
    var o = document.createElement('div'); o.id = id;
    o.style.cssText = 'position:fixed;inset:0;z-index:12600;background:rgba(5,10,20,0.88);display:flex;align-items:flex-end;justify-content:center;';
    o.innerHTML = '<div style="width:100%;max-width:520px;background:radial-gradient(circle at 50% 0%,#1e3a5f,#0b1220 75%);border-top:2px solid rgba(251,146,60,0.5);border-radius:24px 24px 0 0;padding:18px 16px calc(22px + env(safe-area-inset-bottom));box-sizing:border-box;max-height:90vh;overflow-y:auto;">' + html + '</div>';
    o.addEventListener('click', function (ev) { if (ev.target === o) o.remove(); });
    document.body.appendChild(o); return o;
  }
  function bravo(id) {
    var m = null; try { m = (AwakFamily.familleMembres() || []).filter(function (p) { return p.id === id; })[0]; } catch (e) { _e(e); }
    if (!m) return;
    feuilleKid('awkKidBravo', '<div style="text-align:center;"><div style="display:flex;justify-content:center;">' + visage(m, 64) + '</div>'
      + '<div style="font-size:22px;font-weight:900;color:#fff;margin:8px 0 14px;">Pour ' + esc(m.name || '') + '</div>'
      + MSGS.map(function (t, i) { return '<button onclick="AwakKid.envoyer(\'' + esc(id) + '\',' + i + ')" style="display:block;width:100%;min-height:58px;margin-bottom:10px;border-radius:18px;cursor:pointer;font-family:inherit;font-size:19px;font-weight:900;color:#fff;'
        + 'background:rgba(255,255,255,0.07);border:2px solid rgba(251,146,60,0.45);">' + esc(t) + '</button>'; }).join('')
      + '<button onclick="document.getElementById(\'awkKidBravo\').remove()" style="margin-top:4px;min-height:44px;padding:8px 20px;border:none;background:none;color:#94a3b8;font-family:inherit;font-size:15px;font-weight:800;cursor:pointer;">Fermer</button></div>');
  }
  function envoyer(id, i) {
    var ok = false; try { ok = AwakFamily.sendNudge(id, MSGS[i] || MSGS[0]); } catch (e) { _e(e); }
    var v = document.getElementById('awkKidBravo'); if (v) v.remove();
    var nom = ''; try { nom = (AwakFamily.familleMembres() || []).filter(function (p) { return p.id === id; })[0].name; } catch (e) { _e(e); }
    var o = feuilleKid('awkKidEnvoye', '<div style="text-align:center;padding:6px 0;">' + renard('bravo', 130, 'display:block;margin:0 auto;animation:awkRenardSaut 1.2s ease-in-out infinite;')
      + '<div style="font-size:24px;font-weight:900;color:#fff;margin-top:8px;">' + (ok ? 'Envoyé' + (nom ? ' à ' + esc(nom) : '') + ' !' : 'Oups, ça n\'a pas marché') + '</div>'
      + '<div style="font-size:16px;font-weight:800;color:#fdba74;margin-top:4px;">' + (ok ? 'Ton message va lui faire plaisir.' : 'Réessaie plus tard.') + '</div></div>');
    try { if (navigator.vibrate) navigator.vibrate(60); } catch (e) { /* rien */ }
    setTimeout(function () { if (o.parentNode) o.remove(); }, 2200);
  }
  function lireMessages() {
    var l = []; try { l = AwakFamily.pendingNudges(); } catch (e) { _e(e); }
    if (!l.length) return;
    feuilleKid('awkKidMessages', '<div style="text-align:center;">' + renard('saut', 110, 'display:block;margin:0 auto;')
      + '<div style="font-size:24px;font-weight:900;color:#fff;margin:6px 0 14px;">Tes messages</div>'
      + l.slice().reverse().map(function (n) { return '<div style="padding:14px;border-radius:18px;margin-bottom:10px;background:rgba(255,255,255,0.07);border:2px solid rgba(244,114,182,0.4);text-align:left;">'
        + '<div style="font-size:14px;font-weight:900;color:#fbcfe8;">' + esc(n.fromName || 'Ta famille') + '</div>'
        + '<div style="font-size:19px;font-weight:900;color:#fff;margin-top:4px;line-height:1.35;">' + esc(n.msg) + '</div></div>'; }).join('')
      + '<button onclick="document.getElementById(\'awkKidMessages\').remove();AwakKid.famille()" style="width:100%;min-height:56px;margin-top:6px;border:none;border-radius:18px;cursor:pointer;font-family:inherit;font-size:18px;font-weight:900;color:#fff;background:linear-gradient(135deg,#fb923c,#f472b6);">Merci !</button></div>');
    try { AwakFamily.markNudgesSeen(); } catch (e) { _e(e); }
    try { if (typeof window.speak === 'function') window.speak(l[l.length - 1].fromName + ' te dit : ' + l[l.length - 1].msg, { enfant: true }); } catch (e) { _e(e); }
  }

  // Une séance est déjà commencée : continuer ou en commencer une nouvelle
  function dejaEnCours(nom, minutes) {
    finDepart();
    var v = document.getElementById('awakDejaEnCoursModal'); if (v) v.remove();
    var o = document.createElement('div'); o.id = 'awakDejaEnCoursModal';
    o.style.cssText = 'position:fixed;inset:0;z-index:100050;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:24px 20px calc(24px + env(safe-area-inset-bottom));background:radial-gradient(circle at 50% 30%,#1e3a5f 0%,#0b1220 72%);';
    o.innerHTML = '<div style="width:100%;max-width:380px;">'
      + '<div style="animation:awkRenardEntre .45s cubic-bezier(.2,1.4,.4,1) both;display:flex;justify-content:center;">' + renard('pouce', 150, 'animation:awkKidFlotte 2.4s ease-in-out infinite;') + '</div>'
      + '<div style="font-size:30px;font-weight:900;color:#fff;line-height:1.15;margin-top:6px;">Tu as déjà commencé !</div>'
      + '<div style="display:inline-block;margin-top:12px;padding:8px 14px;border-radius:14px;background:rgba(56,189,248,0.12);border:2px solid rgba(56,189,248,0.35);font-size:17px;font-weight:900;color:#e0f2fe;">'
      +   esc(String(nom || 'Ta séance').replace(/\s*[\u26A1\u2600-\u27BF]+\s*$/, '')) + (minutes ? '<span style="display:block;font-size:14px;font-weight:800;color:#bae6fd;margin-top:2px;">Tu as bougé ' + minutes + ' minute' + (minutes > 1 ? 's' : '') + '</span>' : '') + '</div>'
      + '<div style="font-size:17px;font-weight:800;color:#fdba74;margin:16px 0 18px;">On la termine ensemble ?</div>'
      + '<button onclick="AwakKid.continuer()" style="width:100%;min-height:66px;border:none;border-radius:20px;cursor:pointer;font-family:inherit;font-size:22px;font-weight:900;color:#fff;background:linear-gradient(135deg,#fb923c,#f472b6);box-shadow:0 8px 26px rgba(251,146,60,0.4);margin-bottom:12px;">Je continue !</button>'
      + '<button onclick="AwakKid.recommencer()" style="width:100%;min-height:54px;border-radius:18px;cursor:pointer;font-family:inherit;font-size:17px;font-weight:900;color:#fff;background:rgba(255,255,255,0.07);border:2px solid rgba(255,255,255,0.2);margin-bottom:8px;">Une nouvelle séance</button>'
      + '<button onclick="AwakKid.plusTard()" style="min-height:44px;padding:8px 20px;border:none;background:none;cursor:pointer;font-family:inherit;font-size:15px;font-weight:800;color:#94a3b8;">Plus tard</button>'
      + '</div>';
    document.body.appendChild(o);
    try { if (typeof window.speak === 'function') window.speak('Tu as déjà commencé ! On la termine ensemble ?', { enfant: true }); } catch (e) { _e(e); }
  }
  function continuer() { window._awkKidDirect = false; try { window.awakDejaEnCoursReprendre(); } catch (e) { _e(e); } }
  function recommencer() { depart(); window._awkKidDirect = true; try { window.awakDejaEnCoursRemplacer(); } catch (e) { _e(e); finDepart(); } }
  function plusTard() {
    var v = document.getElementById('awakDejaEnCoursModal'); if (v) v.remove();
    window._awkKidDirect = false; window._awakSeanceEnAttente = null; finDepart();
    try { if (typeof window.switchTab === 'function') window.switchTab('home'); } catch (e) { _e(e); }
  }

  // Fin de séance : « On s'étire un peu ? » (liste déjà filtrée pour les enfants)
  function etirements(liste, sec) {
    var v = document.getElementById('awakEtirSheet'); if (v) v.remove();
    var min = Math.max(1, Math.round((sec || 60) / 60));
    var o = document.createElement('div'); o.id = 'awakEtirSheet';
    o.style.cssText = 'position:fixed;inset:0;z-index:10700;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:24px 20px calc(24px + env(safe-area-inset-bottom));background:radial-gradient(circle at 50% 30%,#1e3a5f 0%,#0b1220 72%);';
    o.innerHTML = '<div style="width:100%;max-width:380px;">'
      + '<div style="display:flex;justify-content:center;animation:awkRenardEntre .45s cubic-bezier(.2,1.4,.4,1) both;">' + renard('salut', 140, 'animation:awkKidFlotte 2.4s ease-in-out infinite;') + '</div>'
      + '<div style="font-size:30px;font-weight:900;color:#fff;line-height:1.15;margin-top:6px;">On s\'étire un peu ?</div>'
      + '<div style="font-size:17px;font-weight:800;color:#bae6fd;margin:8px 0 14px;">' + liste.length + ' étirement' + (liste.length > 1 ? 's' : '') + ' tout doux · ' + min + ' minute' + (min > 1 ? 's' : '') + '</div>'
      + '<div style="display:flex;flex-wrap:wrap;justify-content:center;gap:8px;margin-bottom:20px;">'
      +   liste.map(function (e) { return '<span style="padding:8px 12px;border-radius:14px;background:rgba(56,189,248,0.12);border:2px solid rgba(56,189,248,0.35);font-size:15px;font-weight:800;color:#e0f2fe;">' + esc(e.name) + '</span>'; }).join('')
      + '</div>'
      + '<button onclick="awakEtirOui()" style="width:100%;min-height:66px;border:none;border-radius:20px;cursor:pointer;font-family:inherit;font-size:22px;font-weight:900;color:#fff;background:linear-gradient(135deg,#fb923c,#f472b6);box-shadow:0 8px 26px rgba(251,146,60,0.4);margin-bottom:12px;">Oui, on s\'étire !</button>'
      + '<button onclick="awakEtirNon()" style="width:100%;min-height:54px;border-radius:18px;cursor:pointer;font-family:inherit;font-size:17px;font-weight:900;color:#fff;background:rgba(255,255,255,0.07);border:2px solid rgba(255,255,255,0.2);">Non merci, j\'ai fini</button>'
      + '</div>';
    document.body.appendChild(o);
    try { if (typeof window.speak === 'function') window.speak('Bravo ! On s\'étire un peu ?', { enfant: true }); } catch (e) { _e(e); }
  }

  // ── Tutoriel enfant (création du profil) : le renard fait visiter, puis 5 étoiles ──
  var TUTO = [
    { sel: '#awakKidHome button[onclick="AwakKid.bouger()"]', pose: 'pouce', t: 'Touche « Bouger ! » pour faire une séance. Je choisis des jeux pour toi !' },
    { sel: '.awk-kid-tuiles button[onclick="AwakKid.missions()"]', pose: 'salut', t: 'Mes missions : super-héros, ninja, pirates… et le yoga des animaux !' },
    { sel: '.awk-kid-tuiles button[onclick="AwakKid.carte()"]', pose: 'saut', t: 'À chaque séance, j\'avance d\'une pierre sur la carte de l\'aventure.' },
    { sel: '.awk-kid-tuiles button[onclick="AwakKid.album()"]', pose: 'bravo', t: 'Après chaque séance, tu gagnes un autocollant pour ton album !' },
    { sel: '.awk-kid-tuiles button[onclick="AwakEtoiles.ouvrirEnfant()"]', pose: 'pouce', t: 'En bougeant, tu gagnes des étoiles. Échange-les contre des récompenses !' },
    { sel: '#familyNavTab', pose: 'salut', t: 'Ici, envoie des bravos à ta famille et jouez ensemble.' },
    { sel: '#awakKidHome button[onclick="AwakKid.parent()"]', pose: 'pouce', t: 'Ce petit bouton, c\'est pour tes parents.' }
  ];
  var _tuto = null;
  function cleTuto() { try { return window._cleProfil('awkKidTutoFait'); } catch (e) { return 'awkKidTutoFait'; } }
  function tutoriel(nom, auDebut) {
    try {
      var v = document.getElementById('awkKidTuto'); if (v) v.remove();
      var o = document.createElement('div'); o.id = 'awkKidTuto';
      o.style.cssText = 'position:fixed;inset:0;z-index:100500;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:24px 20px calc(24px + env(safe-area-inset-bottom));background:radial-gradient(circle at 50% 30%,#1e3a5f 0%,#0b1220 72%);';
      o.innerHTML = '<div style="width:100%;max-width:380px;">'
        + '<div style="display:flex;justify-content:center;animation:awkRenardEntre .5s cubic-bezier(.2,1.4,.4,1) both;"><div style="animation:awkRenardSaut 1.4s ease-in-out .5s infinite;">' + renard('saut', 190) + '</div></div>'
        + '<div style="font-size:36px;font-weight:900;color:#fff;line-height:1.1;margin-top:6px;">Salut' + (nom ? ' ' + esc(nom) : '') + ' !</div>'
        + '<div style="font-size:19px;font-weight:800;color:#bae6fd;margin:12px 0 26px;line-height:1.4;">Moi, c\'est ton ami le renard.<br>Je vais te montrer ton appli !</div>'
        + '<button id="awkTutoGo" style="width:100%;min-height:66px;border:none;border-radius:20px;cursor:pointer;font-family:inherit;font-size:22px;font-weight:900;color:#fff;background:linear-gradient(135deg,#fb923c,#f472b6);box-shadow:0 8px 26px rgba(251,146,60,0.4);">On y va !</button>'
        + '</div>';
      document.body.appendChild(o);
      document.documentElement.classList.remove('awk-kid-neuf');   // v1765 : l'écran principal peut réapparaître derrière
      try { if (typeof window.speak === 'function') window.speak('Salut' + (nom ? ' ' + nom : '') + ' ! Moi, c\'est ton ami le renard. Je vais te montrer ton appli !', { enfant: true }); } catch (e) { _e(e); }
      o.querySelector('#awkTutoGo').onclick = function () {
        try { if (auDebut) auDebut(); } catch (e) { _e(e); }
        try { if (typeof window.switchTab === 'function') window.switchTab('home'); accueil(); } catch (e) { _e(e); }
        o.style.background = 'transparent'; o.innerHTML = '';
        _tuto = { i: 0 };
        setTimeout(etapeTuto, 700);
      };
    } catch (e) { _e(e); }
  }
  function etapeTuto() {
    var o = document.getElementById('awkKidTuto'); if (!o || !_tuto) return;
    // étape suivante dont la cible existe
    while (_tuto.i < TUTO.length && !document.querySelector(TUTO[_tuto.i].sel)) _tuto.i++;
    if (_tuto.i >= TUTO.length) return finTuto();
    var st = TUTO[_tuto.i], el = document.querySelector(st.sel);
    try { el.scrollIntoView({ block: 'center' }); } catch (e) { _e(e); }
    setTimeout(function () {
      var r = el.getBoundingClientRect(), pad = 8, H = window.innerHeight;
      var bas = r.top + r.height / 2 < H / 2;   // cible en haut → bulle dessous
      var pts = ''; for (var k = 0; k < TUTO.length; k++) pts += '<span style="width:' + (k === _tuto.i ? 18 : 8) + 'px;height:8px;border-radius:99px;background:' + (k <= _tuto.i ? '#fb923c' : 'rgba(255,255,255,0.25)') + ';"></span>';
      o.innerHTML = '<div style="position:fixed;left:' + (r.left - pad) + 'px;top:' + (r.top - pad) + 'px;width:' + (r.width + pad * 2) + 'px;height:' + (r.height + pad * 2) + 'px;border-radius:24px;border:3px solid #fb923c;'
        + 'box-shadow:0 0 0 9999px rgba(5,10,20,0.82),0 0 24px rgba(251,146,60,0.6);pointer-events:none;animation:awkProgPulse 1.6s ease-in-out infinite;"></div>'
        + '<div style="position:fixed;left:14px;right:14px;' + (bas ? 'top:' + Math.min(H - 230, r.bottom + 18) : 'bottom:' + Math.min(H - 230, H - r.top + 18)) + 'px;max-width:440px;margin:0 auto;padding:14px;border-radius:22px;'
        + 'background:linear-gradient(160deg,#1e3a5f,#0b1220);border:2px solid rgba(251,146,60,0.6);box-shadow:0 12px 40px rgba(0,0,0,0.5);animation:awkBulle .3s ease-out both;">'
        +   '<div style="display:flex;align-items:center;gap:10px;">' + renard(st.pose, 70) + '<div style="flex:1;font-size:18px;font-weight:900;color:#fff;line-height:1.35;text-align:left;">' + esc(st.t) + '</div></div>'
        +   '<div style="display:flex;align-items:center;gap:10px;margin-top:12px;"><div style="flex:1;display:flex;gap:5px;">' + pts + '</div>'
        +   '<button onclick="AwakKid._tutoSuite()" style="min-height:52px;padding:10px 26px;border:none;border-radius:16px;cursor:pointer;font-family:inherit;font-size:18px;font-weight:900;color:#fff;background:linear-gradient(135deg,#fb923c,#f472b6);">' + (_tuto.i === TUTO.length - 1 ? 'Fini !' : 'Suivant') + '</button></div>'
        + '</div>';
      o.style.background = 'transparent';
      try { if (typeof window.speak === 'function') window.speak(st.t, { enfant: true }); } catch (e) { _e(e); }
    }, 350);
  }
  function tutoSuite() { if (!_tuto) return; _tuto.i++; etapeTuto(); }
  function finTuto() {
    _tuto = null;
    var o = document.getElementById('awkKidTuto'); if (!o) return;
    var deja = false; try { deja = localStorage.getItem(cleTuto()) === '1'; } catch (e) { _e(e); }
    var n = 0;
    if (!deja) { try { n = window.AwakEtoiles && AwakEtoiles.cadeau ? AwakEtoiles.cadeau(5, 'Visite de l\'appli') : 0; localStorage.setItem(cleTuto(), '1'); } catch (e) { _e(e); } }
    var ets = ''; for (var i = 0; i < n; i++) ets += '<span style="display:inline-flex;animation:awkAutoPop .6s cubic-bezier(.2,1.6,.4,1) ' + (0.3 + i * 0.18).toFixed(2) + 's both;">' + ico('etoile', i === 2 ? 46 : 36, '#facc15') + '</span>';
    o.style.cssText = 'position:fixed;inset:0;z-index:100500;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:24px 20px calc(24px + env(safe-area-inset-bottom));background:radial-gradient(circle at 50% 30%,#1e3a5f 0%,#0b1220 72%);';
    o.innerHTML = '<style>@keyframes awkAutoPop{0%{transform:scale(0) rotate(-20deg)}100%{transform:scale(1) rotate(0)}}#awkKidTuto svg{fill:#facc15;}</style>'
      + '<div style="width:100%;max-width:380px;">'
      + '<div style="display:flex;justify-content:center;"><div style="animation:awkRenardSaut 1.4s ease-in-out infinite;">' + renard('bravo', 170) + '</div></div>'
      + '<div style="font-size:32px;font-weight:900;color:#fff;line-height:1.15;margin-top:6px;">Bravo, tu connais tout !</div>'
      + (n ? '<div style="display:flex;align-items:flex-end;justify-content:center;gap:6px;margin:18px 0 6px;">' + ets + '</div>'
           + '<div style="font-size:20px;font-weight:900;color:#fde68a;">Voici ' + n + ' étoiles pour commencer !</div>' : '')
      + '<button onclick="AwakKid._tutoFermer()" style="width:100%;min-height:66px;margin-top:26px;border:none;border-radius:20px;cursor:pointer;font-family:inherit;font-size:22px;font-weight:900;color:#fff;background:linear-gradient(135deg,#fb923c,#f472b6);box-shadow:0 8px 26px rgba(251,146,60,0.4);">Merci !</button>'
      + '</div>';
    for (var ti = 0; ti < n; ti++) sfx('ding', 0.3 + ti * 0.18);
    try { if (typeof window.speak === 'function') window.speak('Bravo, tu connais tout !' + (n ? ' Voici ' + n + ' étoiles pour commencer !' : ''), { enfant: true }); } catch (e) { _e(e); }
    try { if (navigator.vibrate) navigator.vibrate([80, 60, 120]); } catch (e) { /* rien */ }
    try { victoire(); } catch (e) { _e(e); }
  }
  function tutoFermer() { var o = document.getElementById('awkKidTuto'); if (o) o.remove(); try { accueil(); } catch (e) { _e(e); } }

  // ── v1767 : séance « Bouger ! » propre aux enfants — corps entier, ~15 min ──
  // Mélange à chaque séance : sauts, déplacements d'animaux, équilibre et renforcement
  // (haut, bas, tronc), en alternant effort et calme. Tout vient de la liste enfant validée.
  var MIX = {
    echauff: ['Marche sur place active', 'Cercles de bras', 'Rotations hanches', 'Jumping Jacks légers', 'Montées de genoux légères'],
    saut: ['Jumping jacks', 'Étoile sautée', 'Sauts de grenouille', 'Marelle sur place', 'Sauts latéraux par-dessus une ligne', 'Skipping (pas sautés)', 'Sautillements sur une jambe', 'High knees', 'Montées de genoux sur place', 'Talons-fesses légers', 'Pas chassés latéraux', 'Burpees légers', 'Broad Jump (saut en longueur)'],
    animal: ['Bear crawl', 'Marche du crabe', 'Inchworm', 'Mountain climbers lents'],
    equilibre: ['Équilibre sur une jambe', 'Avion sur une jambe', 'Marche talon-pointe', 'Bird dog'],
    haut: ['Pompes genoux', 'Pompes au mur', 'Pompes inclinées', 'Pompes classiques', 'Superman', 'Snow angels inversés', 'Shoulder taps en planche', 'Y-T-W au sol', 'Nageur au sol'],
    bas: ['Squats au poids du corps', 'Squat sumo', 'Fentes arrière', 'Fentes alternées', 'Pont fessier', 'Wall sit', 'Montées sur pointes', 'Fire hydrant', 'Donkey Kicks'],
    tronc: ['Planche courte', 'Planche (gainage)', 'Dead bug', 'Planche latérale (genoux)', 'Crunch classique']
  };
  var ORDRE = ['saut', 'bas', 'animal', 'haut', 'equilibre', 'tronc', 'saut', 'bas', 'animal', 'haut', 'equilibre', 'saut'];
  var DUREE = { saut: 35, animal: 35, equilibre: 30, haut: 35, bas: 35, tronc: 25, echauff: 30 };
  function genererSeance() {
    try {
      if (typeof exerciseDatabase === 'undefined') return null;
      var db = exerciseDatabase;
      var avant = [];
      try { ((window.getWorkoutHistory && getWorkoutHistory()) || []).slice(0, 2).forEach(function (w) { (w.exercises || []).forEach(function (e) { avant.push(typeof e === 'string' ? e : e.name); }); }); } catch (e) { _e(e); }
      var pris = {};
      var trouver = function (cat) {
        var tous = MIX[cat].map(function (n) { return db.filter(function (e) { return e.name === n; })[0]; })
          .filter(function (e) { return e && !pris[e.name] && !(window.AwakYouth && AwakYouth.isDiscouraged(e)); });
        var frais = tous.filter(function (e) { return avant.indexOf(e.name) < 0; });
        var pool = frais.length ? frais : tous;
        if (!pool.length) return null;
        var e = pool[Math.floor(Math.random() * pool.length)]; pris[e.name] = 1; return e;
      };
      var item = function (e, cat) {
        return Object.assign({}, e, { mode: 'timer', duration: DUREE[cat], sets: 1, exerciseType: 'hybrid', type: cat === 'echauff' ? (e.type || 'warmup') : 'exercise', _kidMix: cat });
      };
      var ex = [];
      // Échauffement : 2 mouvements doux, enchaînés
      for (var k = 0; k < 2; k++) { var w = trouver('echauff'); if (w) ex.push(item(w, 'echauff')); }
      ex.push({ name: 'Repos', duration: 15, isRest: true, mode: 'timer' });
      var corps = ORDRE.map(function (c) { var e = trouver(c); return e ? item(e, c) : null; }).filter(Boolean);
      corps.forEach(function (e, i) { ex.push(e); if (i < corps.length - 1) ex.push({ name: 'Repos', duration: 20, isRest: true, mode: 'timer' }); });
      if (corps.length < 4) return null;
      return { name: 'Séance de jeux', type: 'kids', exercises: ex, _kidsMix: true, targetMuscles: ['Corps entier'], duration: 15 };
    } catch (e) { _e(e); return null; }
  }

  function bouger() {
    try {
      depart();
      window._awkKidDirect = true;
      if (typeof window.awakLancerSeanceSysteme === 'function') window.awakLancerSeanceSysteme();
      else if (typeof window.startRandomWorkout === 'function') window.startRandomWorkout();
    } catch (e) { _e(e); window._awkKidDirect = false; finDepart(); }
  }

  // Après la préparation (générée en arrière-plan), la séance démarre seule.
  function apresPreparation() {
    if (!window._awkKidDirect || !enfant()) return false;
    window._awkKidDirect = false;
    setTimeout(function () { try { if (typeof window.startPreparedWorkout === 'function') window.startPreparedWorkout(); } catch (e) { _e(e); } }, 60);
    return true;
  }

  // Une seule consigne, en gros, sous le nom de l'exercice
  // Libellés écrits en vrai texte (version enfant ↔ version adulte)
  var TEXTES = [
    ['#awakSuivantBtn > span', 'J\'ai fini !', 'Suivant'],
    ['#restSkipBtn', 'Je suis prêt !', 'Passer →'],
    ['#restLabelTop', 'Petite pause !', 'REPOS'],
    ['#restNextLabel', 'Ensuite', 'PROCHAIN EXERCICE'],
    ['#countdownLabel', 'Prépare-toi !', 'Prochain exercice'],
    ['#globalRestBanner .awk-repos-lbl', 'Petite pause !', 'Repos'],
    ['#globalRestBanner .awk-repos-passer', 'Je suis prêt !', 'Passer le repos']
  ];
  function libelle() {
    var k = enfant();
    TEXTES.forEach(function (t) {
      try { var el = document.querySelector(t[0]); if (el) { var v = k ? t[1] : t[2]; if (el.textContent !== v) el.textContent = v; } } catch (e) { _e(e); }
    });
  }
  // Progression en étoiles (remplace « EXERCICE 2 SUR 5 »)
  function progres() {
    try {
      var nomEl = document.getElementById('exerciseName'); if (!nomEl) return;
      var b = window.AwakSSBridge, w = b && b.getWorkout(), idx = b ? b.getExIdx() : 0;
      if (!w || !w.exercises) return;
      var vrais = [], ici = 0;
      w.exercises.forEach(function (e, i) { if (e && !e.isRest && !e.isInfo) { vrais.push(i); if (i <= idx) ici = vrais.length; } });
      if (!vrais.length) return;
      var el = document.getElementById('awkKidProgres');
      if (!el) { el = document.createElement('div'); el.id = 'awkKidProgres'; nomEl.parentNode.insertBefore(el, nomEl); }
      el.style.cssText = 'flex-direction:column;align-items:center;gap:6px;margin:0 0 8px;';
      var pts = '';
      for (var k = 1; k <= vrais.length; k++) {
        pts += k < ici ? '<span style="display:flex;">' + ico('etoile', 22, '#facc15') + '</span>'
          : k === ici ? '<span style="width:24px;height:24px;border-radius:50%;background:#fb923c;border:3px solid #fff;box-sizing:border-box;animation:awkProgPulse 1.4s ease-in-out infinite;"></span>'
          : '<span style="width:14px;height:14px;border-radius:50%;background:rgba(255,255,255,0.2);"></span>';
      }
      if (_dejaAnnonce !== idx + ':' + w.name) {
        _dejaAnnonce = idx + ':' + w.name;
        if (ici === vrais.length && vrais.length > 2) _prefixe = 'Dernier défi !';
        else if (vrais.length >= 6 && ici === Math.ceil(vrais.length / 2) + 1) _prefixe = 'Bravo, tu as fait la moitié !';
      }
      el.innerHTML = '<div style="display:flex;align-items:center;gap:8px;">' + pts + '</div>'
        + '<div style="font-size:15px;font-weight:900;color:#bae6fd;">' + (ici === vrais.length ? 'Dernier défi !' : 'Défi ' + ici + ' sur ' + vrais.length) + '</div>';
      var svg = el.querySelectorAll('svg'); for (var q = 0; q < svg.length; q++) svg[q].setAttribute('fill', '#facc15');
    } catch (e) { _e(e); }
  }
  var _dejaAnnonce = '';
  // Le renard encourage à la moitié de l'exercice
  var _encT = null;
  var ENCOUR = ['Tu es super fort !', 'Continue, tu y es presque !', 'Wow, quelle énergie !', 'Bravo, encore un peu !', 'Tu bouges comme un champion !'];
  function encourager(ex) {
    clearTimeout(_encT);
    try {
      if (!ex || ex.mode === 'reps' || !(ex.duration >= 16)) return;
      var b = window.AwakSSBridge, idx = b ? b.getExIdx() : -1;
      _encT = setTimeout(function () {
        try {
          if (!document.body.classList.contains('in-session') || !enfant() || (b && b.getExIdx() !== idx)) return;
          var c = document.getElementById('awkKidConsigne'); if (!c) return;
          var t = ENCOUR[Math.floor(Math.random() * ENCOUR.length)];
          var bul = document.createElement('div'); bul.id = 'awkKidEncour';
          bul.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;gap:10px;padding:8px 14px;border-radius:14px;background:linear-gradient(135deg,#fb923c,#f472b6);color:#fff;font-size:19px;font-weight:900;animation:awkEncour 3.2s ease forwards;z-index:2;';
          bul.innerHTML = renard('bravo', 52) + '<span>' + esc(t) + '</span>';
          c.style.position = 'relative'; var v = document.getElementById('awkKidEncour'); if (v) v.remove();
          c.appendChild(bul); setTimeout(function () { if (bul.parentNode) bul.remove(); }, 3300);
          try { if (typeof window.speak === 'function') window.speak(t, { enfant: true }); } catch (e) { _e(e); }
        } catch (e) { _e(e); }
      }, Math.round(ex.duration * 500));
    } catch (e) { _e(e); }
  }
  function consigne(ex) {
    try {
      finDepart();
      libelle();
      progres();
      encourager(ex);
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
      // v1755 : anti-triche — pas d'étoile = pas de pierre ni d'autocollant
      var gagne = (Number(etoiles) || 0) > 0;
      _aAnimer = gagne ? avancer(cle || Date.now()) : null;
      _autoNeuf = gagne ? gagnerAuto(cle || Date.now()) : null;
      var refus = gagne ? null : (window.AwakEtoiles && AwakEtoiles.refus ? AwakEtoiles.refus() : null);
      var regl = window.AwakEtoiles && AwakEtoiles.regles ? AwakEtoiles.regles() : { minMinutes: 5 };
      var v = document.getElementById('awkKidFin'); if (v) v.remove();
      var n = Math.max(0, Math.round(Number(etoiles) || 0)), m = Math.max(1, Math.round(Number(minutes) || 0));
      var o = document.createElement('div'); o.id = 'awkKidFin';
      o.style.cssText = 'position:fixed;inset:0;z-index:13000;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px 20px calc(24px + env(safe-area-inset-bottom));text-align:center;'
        + 'background:radial-gradient(circle at 50% 35%,#1e3a5f 0%,#0b1220 70%);';
      var ets = ''; for (var i = 0; i < Math.min(n, 5); i++) ets += '<span style="display:inline-flex;animation:awkKidFlotte 1.6s ease-in-out ' + (i * 0.15).toFixed(2) + 's infinite;">' + ico('etoile', i === 2 ? 40 : 30, '#facc15') + '</span>';
      o.innerHTML = '<style>@keyframes awkAutoPop{0%{transform:scale(0) rotate(-20deg)}100%{transform:scale(1) rotate(0)}}</style>'
        + '<div style="animation:awkRenardEntre .5s cubic-bezier(.2,1.4,.4,1) both;">'
        +   '<div style="animation:awkRenardSaut 1.4s ease-in-out .5s infinite;">' + renard('bravo', _autoNeuf ? 170 : 200) + '</div></div>'
        + '<div style="font-size:40px;font-weight:900;color:#fff;line-height:1.05;margin-top:6px;">Bravo' + (prenom() ? ' ' + esc(prenom()) : '') + ' !</div>'
        + '<div style="font-size:18px;font-weight:800;color:#bae6fd;margin-top:8px;">Tu as bougé ' + m + ' minute' + (m > 1 ? 's' : '') + '</div>'
        + (n ? '<div style="display:flex;align-items:flex-end;justify-content:center;gap:6px;margin-top:18px;">' + ets + '</div>'
             + '<div style="font-size:20px;font-weight:900;color:#fde68a;margin-top:6px;">+' + n + ' étoile' + (n > 1 ? 's' : '') + '</div>' : '')
        + (_autoNeuf ? '<div style="display:flex;align-items:center;justify-content:center;gap:10px;margin-top:16px;">'
             + imgAuto(_autoNeuf[0], '64px', 'animation:awkAutoPop .7s cubic-bezier(.2,1.6,.4,1) .6s both;')
             + '<div style="text-align:left;font-size:16px;font-weight:900;color:#fff;">' + (_autoNeuf[2] ? 'Nouvelle page d\'album !' : 'Nouvel autocollant !') + '<div style="font-size:14px;font-weight:800;color:#fed7aa;">' + _autoNeuf[1] + '</div></div></div>' : '')
        + (_aAnimer ? '<div style="font-size:16px;font-weight:800;color:#fdba74;margin-top:12px;">Le renard avance sur ton chemin !</div>' : '')
        + (refus ? '<div style="margin-top:16px;padding:12px 14px;border-radius:16px;background:rgba(56,189,248,0.1);border:2px solid rgba(56,189,248,0.35);font-size:16px;font-weight:800;color:#e0f2fe;line-height:1.4;">'
             + (refus === 'court' ? 'Tu es allé trop vite : pas d\'étoile cette fois. Pour en gagner, bouge au moins ' + regl.minMinutes + ' minutes !' : 'Tu as gagné toutes tes étoiles aujourd\'hui. Reviens demain !') + '</div>' : '')
        + '<button onclick="AwakKid.finOk()" style="margin-top:26px;width:100%;max-width:320px;min-height:64px;border:none;border-radius:20px;cursor:pointer;font-family:inherit;font-size:1.3em;font-weight:900;color:#fff;'
        +   'background:linear-gradient(135deg,var(--kid-orange,#fb923c),var(--kid-rose,#f472b6));box-shadow:0 8px 26px rgba(251,146,60,0.4);">Super !</button>';
      document.body.appendChild(o);
      for (var si = 0; si < Math.min(n, 5); si++) sfx('ding', 0.5 + si * 0.18);
      if (_autoNeuf) sfx('pop', 0.7);
      try { if (typeof window.speak === 'function') window.speak(refus === 'court' ? 'Tu es allé trop vite, pas d\'étoile cette fois. Bouge au moins ' + regl.minMinutes + ' minutes pour en gagner !' : 'Bravo ! Tu as bougé ' + m + ' minutes' + (n ? ', et tu gagnes ' + n + ' étoile' + (n > 1 ? 's' : '') : '') + ' !', { enfant: true }); } catch (e) { _e(e); }
      try { if (navigator.vibrate) navigator.vibrate([80, 60, 120]); } catch (e) { /* rien */ }
      victoire();
    } catch (e) { _e(e); }
  }
  // v1750 : petit air de victoire (musique en séance activée seulement)
  function victoire() {
    try {
      var r = window.AwakMusique && AwakMusique.reglages ? AwakMusique.reglages() : { auto: true };
      if (r.externe || r.entrainement === false) return;
      var a = new Audio('audio/victoire.mp3'); a.volume = Math.min(1, (r.volume || 0.6) + 0.2);
      setTimeout(function () { try { var p = a.play(); if (p && p.catch) p.catch(function () {}); } catch (e) { _e(e); } }, 500);
    } catch (e) { _e(e); }
  }
  function finOk() {
    var o = document.getElementById('awkKidFin');
    var an = _aAnimer; _aAnimer = null;
    _autoMontrer = _autoNeuf ? _autoNeuf[0] : null; _autoNeuf = null;
    // v1766 : la carte s'ouvre AVANT de retirer le Bravo (avant : l'accueil passait 0,35 s entre les deux)
    if (an) carte(an);
    try { if (typeof window.backToHome === 'function') window.backToHome(); else if (typeof window.switchTab === 'function') window.switchTab('home'); } catch (e) { _e(e); }
    if (o) o.remove();
    if (an) { /* carte déjà ouverte */ }
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
      libelle();
      if (k && (t === 'home' || t === 'homeTab')) accueil();
      if (k && (t === 'family' || t === 'familyTab')) famille();
      // v1766 : l'écran enfant est prêt → on le montre (caché pendant le chargement)
      if (document.documentElement.classList.contains('awk-kid-charge') && (!k || document.body.classList.contains('awk-enfant'))) {
        requestAnimationFrame(function () { document.documentElement.classList.remove('awk-kid-charge'); });
      }
      // Onglets cachés pour un enfant → retour à l'accueil enfant
      if (k && (t === 'more' || t === 'settings')) { /* Plus : passe par le code parent */ }
    } catch (e) { _e(e); }
  }

  // switchTab : met à jour l'accueil enfant à chaque changement d'onglet
  function brancher() {
    try {
      if (typeof window.awkSuivantTouche === 'function' && !window.awkSuivantTouche._awkKid) {
        var s0 = window.awkSuivantTouche;
        var s1 = function () { try { if (enfant() && document.body.classList.contains('in-session')) sfx('boing'); } catch (e) { _e(e); } return s0.apply(this, arguments); };
        s1._awkKid = true; window.awkSuivantTouche = s1;
      }
      brancherSons();
    } catch (e) { _e(e); }
    if (typeof window.switchTab !== 'function' || window.switchTab._awkKid) return;
    var o = window.switchTab;
    var w = function (t) { var r = o.apply(this, arguments); try { window.AwakKid.maj(t); } catch (e) { _e(e); } return r; };
    w._awkKid = true;
    window.switchTab = w;
  }

  window.AwakKid = { maj: maj, bouger: bouger, parent: parent, apresPreparation: apresPreparation, consigne: consigne, enfant: enfant, accueil: accueil, fin: fin, finOk: finOk, carte: function () { carte(null); }, fermerCarte: fermerCarte, _chemin: chemin, album: function () { ouvrirAlbum(null); }, _albPage: function (i) { ouvrirAlbum(undefined, i); }, fermerAlbum: fermerAlbum, _album: album, famille: famille, changerEnfant: changerEnfant, etirements: etirements, annoncer: annoncer, sfx: sfx, genererSeance: genererSeance, tutoriel: tutoriel, _tutoSuite: tutoSuite, _tutoFermer: tutoFermer,
    revoirTutoriel: function () { tutoriel(prenom(), null); }, dejaEnCours: dejaEnCours, continuer: continuer, recommencer: recommencer, plusTard: plusTard, missions: missions, mission: mission, lancerMission: lancerMission, bravo: bravo, envoyer: envoyer, lireMessages: lireMessages };
  function init() { injecterCSS(); brancher(); maj(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
