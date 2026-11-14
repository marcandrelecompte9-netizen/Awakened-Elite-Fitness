/* ══════════════════════════════════════════════════════════════════════
   🧒 JEUX PARENT-ENFANT — Awakened
   ----------------------------------------------------------------------
   Pour les enfants qui ne voient pas l'intérêt de « s'entraîner » mais
   qui veulent JOUER. On ne leur demande pas de compter des répétitions :
   on leur donne un jeu, et le mouvement vient tout seul.

   ⚠️ CHOIX DE CONCEPTION — pourquoi le CHRONO et non les répétitions.
   Tout le reste de l'app mesure des séries validées. Une partie de tag,
   c'est du mouvement libre : impossible de compter les sprints ni de
   créditer un muscle précis. On reprend donc la solution des Failles
   d'Assaut (v880) : la DURÉE est la mesure, validée par un bouton.

   ⚠️ CRÉDIT ASYMÉTRIQUE. Un adulte qui court après un enfant de 8 ans ne
   fait pas une séance. Le jeu crédite donc l'ENFANT normalement, et le
   parent en « activité légère » — visible dans son historique, mais sans
   fausser ses statistiques de progression.
   ══════════════════════════════════════════════════════════════════════ */
(function (global) {
  'use strict';

  var JEUX = {
    chasseur: {
      nom: 'Le Chasseur et l\'Ombre', emoji: '🏃',
      pitch: 'L\'un poursuit, l\'autre s\'échappe.',
      duree: 3, manches: 3,
      regles: [
        'Délimitez un espace : une pièce, la cour, le parc.',
        'Le Chasseur compte jusqu\'à 5, puis part à la poursuite.',
        'L\'Ombre est attrapée quand on lui touche les jambes.',
        'On échange les rôles à chaque manche.'
      ],
      qualite: 'Vitesse et changements de direction',
      variante: 'Trop facile ? L\'Ombre doit toucher trois murs avant d\'être libre.'
    },
    statue: {
      nom: 'Statue', emoji: '🗿',
      pitch: 'Avancer sans se faire voir.',
      duree: 4, manches: 3,
      regles: [
        'Le Gardien se tourne vers le mur et compte à voix haute.',
        'Les autres avancent vers lui pendant ce temps.',
        'Quand le Gardien se retourne, plus personne ne bouge.',
        'Celui qui bouge repart du départ. Toucher le Gardien fait gagner.'
      ],
      qualite: 'Contrôle du corps et équilibre',
      variante: 'Avance en position de crabe pour corser les choses.'
    },
    animaux: {
      nom: 'La Marche des Animaux', emoji: '🐾',
      pitch: 'Traverser la pièce comme un animal.',
      duree: 4, manches: 4,
      regles: [
        'Choisissez un animal : ours, crabe, grenouille, serpent.',
        'Traversez la pièce dans cette position, aller-retour.',
        'À chaque manche, l\'autre choisit l\'animal.',
        'Interdit de se relever en cours de route.'
      ],
      qualite: 'Locomotion, gainage, mobilité des hanches',
      variante: 'L\'un imite, l\'autre devine quel animal c\'est.'
    },
    miroir: {
      nom: 'Le Miroir', emoji: '🪞',
      pitch: 'Reproduire les gestes de l\'autre, en même temps.',
      duree: 3, manches: 4,
      regles: [
        'Placez-vous face à face, à deux pas l\'un de l\'autre.',
        'Le Meneur fait un mouvement lent : squat, rotation, fente.',
        'Le Miroir le reproduit en même temps, sans retard.',
        'On échange les rôles à chaque manche.'
      ],
      qualite: 'Coordination et conscience du corps',
      variante: 'Les yeux du Miroir suivent seulement les mains du Meneur.'
    },
    tresor: {
      nom: 'Le Gardien du Trésor', emoji: '💎',
      pitch: 'Voler l\'objet sans se faire toucher.',
      duree: 3, manches: 4,
      regles: [
        'Posez un objet derrière le Gardien : le trésor.',
        'Le Gardien ne peut pas bouger les pieds, seulement les bras.',
        'Le Voleur approche et tente de prendre le trésor.',
        'Touché, il repart du départ. On échange à chaque manche.'
      ],
      qualite: 'Esquive, appuis, réflexes',
      variante: 'Deux trésors à voler, un seul Gardien.'
    },
    volcan: {
      nom: 'Le Sol est en Lave', emoji: '🌋',
      pitch: 'Traverser la pièce sans toucher le sol.',
      duree: 4, manches: 3,
      regles: [
        'Posez des coussins ou des feuilles au sol : ce sont les îles.',
        'Traversez la pièce en passant d\'île en île.',
        'Un pied par terre, on recommence.',
        'À chaque manche, on retire une île.'
      ],
      qualite: 'Équilibre, saut, planification',
      variante: 'Traversez en portant un objet sans le faire tomber.'
    },
    ombres: {
      nom: 'La Chasse aux Ombres', emoji: '🌓',
      pitch: 'Marcher sur l\'ombre de l\'autre.',
      duree: 3, manches: 3,
      regles: [
        'À jouer dehors au soleil, ou à l\'intérieur près d\'une lampe.',
        'Le Chasseur doit poser un pied sur l\'ombre de l\'autre.',
        'L\'Ombre s\'échappe en courant, en tournant, en se cachant.',
        'Un point par ombre touchée. On échange à chaque manche.'
      ],
      qualite: 'Course, changements d\'appui, perception',
      variante: 'Interdit de courir — tout le monde marche vite.'
    },
    compte: {
      nom: 'Le Compte à Rebours', emoji: '🔟',
      pitch: 'Dix mouvements, puis neuf, puis huit…',
      duree: 4, manches: 2,
      regles: [
        'Choisissez ensemble 5 mouvements : sauts, squats, pompes…',
        'Faites-en 10 de chaque, à tour de rôle.',
        'Puis 9, puis 8… jusqu\'à 1.',
        'Celui qui ne suit plus le rythme donne un gage rigolo.'
      ],
      qualite: 'Endurance et régularité de l\'effort',
      variante: 'Le perdant choisit le mouvement du tour suivant.'
    },
    cirque: {
      nom: 'Le Numéro de Cirque', emoji: '🎪',
      pitch: 'Inventer une figure que l\'autre doit tenir.',
      duree: 3, manches: 4,
      regles: [
        'L\'un invente une posture : sur un pied, en pont, en équilibre.',
        'L\'autre doit la tenir 10 secondes sans bouger.',
        'Réussi ? Il invente la suivante, plus difficile.',
        'Raté ? L\'inventeur doit la tenir lui-même.'
      ],
      qualite: 'Équilibre, gainage, créativité',
      variante: 'Une figure à deux, en se tenant l\'un à l\'autre.'
    }
  };

  function _id() {
    try { return (typeof getCurrentProfileId === 'function') ? getCurrentProfileId() : null; }
    catch (e) { return null; }
  }
  function esc(t) {
    return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }


  // 🎲 TIRAGE ALÉATOIRE — pour ceux qui ne veulent pas choisir.
  // ⚠️ On évite de retomber sur le DERNIER jeu joué : sur 9 jeux, un tirage
  // vraiment aléatoire redonne le même une fois sur neuf, ce qui donne
  // l'impression que le bouton ne marche pas.
  global.AwakKidsAleatoire = function () {
    var cles = Object.keys(JEUX);
    var dernier = null;
    try { dernier = localStorage.getItem('awakKidsDernier'); } catch (e) { _awkE(e); }
    var choix = cles.filter(function (k) { return k !== dernier; });
    if (!choix.length) choix = cles;
    var k = choix[Math.floor(Math.random() * choix.length)];
    try { localStorage.setItem('awakKidsDernier', k); } catch (e) { _awkE(e); }
    global.AwakKidsDetail(k);
  };

  // v1747 : interface refaite façon enfant — grosses cartes colorées, icônes, renard
  var LOOK = {
    chasseur: ['course', '#fb923c'], statue: ['pyramide', '#38bdf8'], animaux: ['arbre', '#f472b6'],
    miroir: ['groupe', '#38bdf8'], tresor: ['couronne', '#facc15'], volcan: ['flamme', '#fb923c'],
    ombres: ['soleil', '#facc15'], compte: ['chrono', '#38bdf8'], cirque: ['etoile', '#f472b6']
  };
  function ic(n, t, c) { try { return global.AwakIcon ? global.AwakIcon.get(n, t, c) : ''; } catch (e) { return ''; } }
  function pastille(cle, taille) {
    var l = LOOK[cle] || ['etoile', '#fb923c'];
    return '<span style="width:' + taille + 'px;height:' + taille + 'px;border-radius:' + Math.round(taille * 0.32) + 'px;flex-shrink:0;display:flex;align-items:center;justify-content:center;'
      + 'background:' + l[1] + '33;border:2px solid ' + l[1] + '88;">' + ic(l[0], Math.round(taille * 0.52), l[1]) + '</span>';
  }
  var FOND = 'position:fixed;inset:0;z-index:11000;overflow-y:auto;background:radial-gradient(circle at 50% 12%,#1e3a5f,#0b1220 70%);'
    + 'padding:calc(12px + env(safe-area-inset-top)) 14px calc(24px + env(safe-area-inset-bottom));box-sizing:border-box;';
  var GROS = 'border:none;border-radius:18px;cursor:pointer;font-family:inherit;font-weight:900;color:#fff;background:linear-gradient(135deg,#fb923c,#f472b6);box-shadow:0 8px 24px rgba(251,146,60,0.35);';
  var RETOUR = 'min-height:44px;padding:8px 18px;flex-shrink:0;' + GROS + 'font-size:16px;box-shadow:none;';
  global._awkKidsLook = { pastille: pastille, FOND: FOND, GROS: GROS, ic: ic, LOOK: LOOK };

  global.AwakKidsOpen = function () {
    try { if (global.AwakFamCloseAll) global.AwakFamCloseAll(); } catch (e) { _awkE(e); }
    document.getElementById('awakKidsModal')?.remove();

    var cartes = Object.keys(JEUX).map(function (k) {
      var j = JEUX[k];
      return '<button onclick="AwakKidsDetail(\'' + k + '\')" style="display:flex;flex-direction:column;align-items:center;gap:8px;text-align:center;padding:14px 8px 12px;min-height:0;border-radius:20px;cursor:pointer;font-family:inherit;'
        + 'background:rgba(255,255,255,0.05);border:2px solid ' + (LOOK[k] ? LOOK[k][1] : '#fb923c') + '55;">'
        + pastille(k, 56)
        + '<span style="font-size:15px;font-weight:900;color:#fff;line-height:1.2;">' + esc(j.nom) + '</span>'
        + '<span style="font-size:12px;font-weight:800;color:#94a3b8;">' + (j.duree * j.manches) + ' min</span>'
        + '</button>';
    }).join('');

    var ov = document.createElement('div');
    ov.id = 'awakKidsModal';
    ov.style.cssText = FOND;
    ov.innerHTML = '<div style="max-width:480px;margin:0 auto;">'
      + '<div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;">'
      +   '<img src="images/kid/renard_bravo.webp" alt="" style="width:76px;height:76px;object-fit:contain;flex-shrink:0;">'
      +   '<div style="flex:1;min-width:0;"><div style="font-size:24px;font-weight:900;color:#fff;line-height:1.1;">Jouer ensemble</div>'
      +   '<div style="font-size:14px;font-weight:800;color:#bae6fd;margin-top:4px;">Un jeu, et on bouge sans compter !</div></div>'
      +   '<button onclick="document.getElementById(\'awakKidsModal\').remove()" style="' + RETOUR + '">Retour</button>'
      + '</div>'
      + '<button onclick="AwakKidsAleatoire()" style="width:100%;min-height:60px;margin-bottom:14px;font-size:19px;display:flex;align-items:center;justify-content:center;gap:10px;' + GROS + '">'
      +   ic('etoile', 22, '#fff') + 'Choisis pour moi !</button>'
      + '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;">' + cartes + '</div>'
      + '</div>';
    document.body.appendChild(ov);
  };

  // ── Règles d'un jeu ───────────────────────────────────────────────
  global.AwakKidsDetail = function (cle) {
    var j = JEUX[cle];
    if (!j) return;
    document.getElementById('awakKidsModal')?.remove();
    document.getElementById('awakKidsDetail')?.remove();
    var coul = LOOK[cle] ? LOOK[cle][1] : '#fb923c';

    var regles = j.regles.map(function (r, i) {
      return '<div style="display:flex;gap:12px;align-items:flex-start;padding:12px;border-radius:16px;margin-bottom:8px;background:rgba(255,255,255,0.05);">'
        + '<span style="flex-shrink:0;width:32px;height:32px;border-radius:50%;background:' + coul + ';color:#0b1220;font-size:17px;font-weight:900;display:flex;align-items:center;justify-content:center;">' + (i + 1) + '</span>'
        + '<span style="flex:1;font-size:16px;font-weight:700;color:#f1f5f9;line-height:1.4;">' + esc(r) + '</span></div>';
    }).join('');

    var ov = document.createElement('div');
    ov.id = 'awakKidsDetail';
    ov.style.cssText = FOND;
    ov.innerHTML = '<div style="max-width:480px;margin:0 auto;">'
      + '<div style="display:flex;justify-content:flex-end;gap:8px;margin-bottom:6px;">'
      +   '<button onclick="AwakKidsOpen()" style="min-height:44px;padding:8px 14px;border-radius:14px;cursor:pointer;font-family:inherit;font-size:15px;font-weight:800;color:#cbd5e1;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.15);">Autre jeu</button>'
      +   '<button onclick="document.getElementById(\'awakKidsDetail\')?.remove()" style="' + RETOUR + '">Retour</button>'
      + '</div>'
      + '<div style="text-align:center;margin-bottom:16px;">'
      +   '<div style="display:flex;justify-content:center;">' + pastille(cle, 92) + '</div>'
      +   '<div style="font-size:26px;font-weight:900;color:#fff;margin-top:10px;line-height:1.15;">' + esc(j.nom) + '</div>'
      +   '<div style="font-size:16px;font-weight:800;color:#bae6fd;margin-top:6px;">' + esc(j.pitch) + '</div>'
      +   '<div style="display:inline-flex;gap:8px;margin-top:10px;">'
      +     '<span style="padding:5px 12px;border-radius:99px;background:rgba(255,255,255,0.08);font-size:14px;font-weight:800;color:#fff;">' + (j.duree * j.manches) + ' min</span>'
      +     '<span style="padding:5px 12px;border-radius:99px;background:rgba(255,255,255,0.08);font-size:14px;font-weight:800;color:#fff;">' + j.manches + ' manches</span></div>'
      + '</div>'
      + '<div style="font-size:18px;font-weight:900;color:#fdba74;margin:0 2px 10px;">Comment on joue</div>'
      + regles
      + '<div style="padding:12px 14px;border-radius:16px;margin:12px 0 16px;background:rgba(56,189,248,0.1);border:2px solid rgba(56,189,248,0.3);">'
      +   '<div style="font-size:14px;font-weight:900;color:#bae6fd;">Trop facile ?</div>'
      +   '<div style="font-size:15px;font-weight:700;color:#e0f2fe;margin-top:3px;line-height:1.4;">' + esc(j.variante) + '</div></div>'
      + '<button onclick="AwakKidsStart(\'' + cle + '\')" style="width:100%;min-height:64px;font-size:21px;' + GROS + '">On joue !</button>'
      + '<div style="text-align:center;font-size:13px;font-weight:700;color:#94a3b8;margin-top:10px;">Ça fait travailler : ' + esc(j.qualite.toLowerCase()) + '</div>'
      + '</div>';
    document.body.appendChild(ov);
  };

  global.AwakKidsGames = JEUX;
})(window);

/* ══════════════════════════════════════════════════════════════════════
   ⏱️ PARTIE EN COURS — chrono par manches
   ══════════════════════════════════════════════════════════════════════ */
(function (global) {
  'use strict';
  var partie = null, tic = null;

  function _fmt(s) {
    var m = Math.floor(s / 60), r = s % 60;
    return m + ':' + (r < 10 ? '0' : '') + r;
  }

  global.AwakKidsStart = function (cle) {
    var j = global.AwakKidsGames[cle];
    if (!j) return;
    document.getElementById('awakKidsDetail')?.remove();
    partie = { cle: cle, jeu: j, manche: 1, reste: j.duree * 60, debut: Date.now(), pause: false };
    _ecran();
    _annonce('C\'est parti !', 'Manche 1 sur ' + j.manches);
    tic = setInterval(_tick, 1000);
  };

  function _tick() {
    if (!partie || partie.pause) return;
    partie.actif = (partie.actif || 0) + 1;   // v1755 : temps de jeu réel (pauses exclues)
    partie.reste--;
    if (partie.reste <= 0) {
      // Manche terminée : on enchaîne, ou on conclut.
      try { if (typeof vibrate === 'function') vibrate([80, 60, 80]); } catch (e) { _awkE(e); }
      if (partie.manche >= partie.jeu.manches) { _fin(); return; }
      partie.manche++;
      partie.reste = partie.jeu.duree * 60;
      _annonce('Manche ' + partie.manche + ' !', 'Changez de rôle !');
    }
    _maj();
  }

  // Grande annonce au début de chaque manche (avant : petite bulle facile à manquer)
  function _annonce(titre, sous) {
    try {
      var v = document.getElementById('awakKidsAnnonce'); if (v) v.remove();
      var o = document.createElement('div'); o.id = 'awakKidsAnnonce';
      o.style.cssText = 'position:fixed;inset:0;z-index:11600;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:24px;background:rgba(11,18,32,0.92);animation:awakFadeIn .25s ease;';
      o.innerHTML = '<img src="images/kid/renard_saut.webp" alt="" style="width:150px;height:150px;object-fit:contain;">'
        + '<div style="font-size:40px;font-weight:900;color:#fff;margin-top:6px;">' + esc(titre) + '</div>'
        + '<div style="font-size:20px;font-weight:900;color:#fdba74;margin-top:6px;">' + esc(sous) + '</div>';
      o.onclick = function () { o.remove(); };
      document.body.appendChild(o);
      try { if (typeof global.speak === 'function') global.speak(titre + ' ' + sous, { enfant: true }); } catch (e) { _awkE(e); }
      setTimeout(function () { if (o.parentNode) o.remove(); }, 2400);
    } catch (e) { _awkE(e); }
  }

  function _maj() {
    var t = document.getElementById('awakKidsChrono');
    if (t) t.textContent = _fmt(Math.max(0, partie.reste));
    var arc = document.getElementById('awakKidsArc');
    if (arc) arc.style.strokeDashoffset = ((1 - Math.max(0, partie.reste) / (partie.jeu.duree * 60)) * 597).toFixed(1);
    var m = document.getElementById('awakKidsManche');
    if (m) m.innerHTML = _points();
  }
  function _points() {
    var h = '';
    for (var i = 1; i <= partie.jeu.manches; i++) {
      h += '<span style="width:' + (i === partie.manche ? 30 : 14) + 'px;height:14px;border-radius:99px;display:inline-block;transition:width .3s;background:'
        + (i < partie.manche ? '#facc15' : i === partie.manche ? '#fb923c' : 'rgba(255,255,255,0.15)') + ';"></span>';
    }
    return h;
  }

  function _ecran() {
    document.getElementById('awakKidsPlay')?.remove();
    var L = global._awkKidsLook || {};
    var ov = document.createElement('div');
    ov.id = 'awakKidsPlay';
    ov.style.cssText = (L.FOND || 'position:fixed;inset:0;background:#0b1220;').replace('z-index:11000', 'z-index:11500') + 'display:flex;align-items:center;justify-content:center;';
    ov.innerHTML = '<div style="width:100%;max-width:400px;text-align:center;">'
      + (L.pastille ? '<div style="display:flex;justify-content:center;">' + L.pastille(partie.cle, 64) + '</div>' : '')
      + '<div style="font-size:24px;font-weight:900;color:#fff;margin-top:8px;line-height:1.15;">' + esc(partie.jeu.nom) + '</div>'
      + '<div id="awakKidsManche" style="display:flex;justify-content:center;gap:6px;margin-top:10px;">' + _points() + '</div>'
      + '<div style="position:relative;width:220px;height:220px;margin:16px auto;">'
      +   '<svg viewBox="0 0 220 220" width="220" height="220" style="display:block;transform:rotate(-90deg);">'
      +     '<circle cx="110" cy="110" r="95" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="14"/>'
      +     '<circle id="awakKidsArc" cx="110" cy="110" r="95" fill="none" stroke="#fb923c" stroke-width="14" stroke-linecap="round" stroke-dasharray="597" stroke-dashoffset="0" style="transition:stroke-dashoffset 1s linear;"/></svg>'
      +   '<div id="awakKidsChrono" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:56px;font-weight:900;color:#fff;">' + _fmt(partie.reste) + '</div>'
      + '</div>'
      + '<div style="font-size:17px;font-weight:800;color:#bae6fd;line-height:1.4;margin-bottom:18px;">' + esc(partie.jeu.pitch) + '</div>'
      + '<button onclick="AwakKidsFinir()" style="width:100%;min-height:62px;font-size:20px;margin-bottom:10px;' + (L.GROS || '') + '">On a fini !</button>'
      + '<div style="display:flex;gap:8px;">'
      +   '<button onclick="AwakKidsPause()" id="awakKidsPauseBtn" style="flex:1;min-height:50px;border-radius:16px;cursor:pointer;font-family:inherit;font-size:16px;font-weight:900;color:#fff;background:rgba(255,255,255,0.08);border:2px solid rgba(255,255,255,0.18);">Pause</button>'
      +   '<button onclick="AwakKidsQuitter()" style="flex:1;min-height:50px;border-radius:16px;cursor:pointer;font-family:inherit;font-size:14px;font-weight:800;color:#94a3b8;background:transparent;border:1px solid rgba(255,255,255,0.12);">Quitter</button>'
      + '</div></div>';
    document.body.appendChild(ov);
  }

  global.AwakKidsPause = function () {
    if (!partie) return;
    partie.pause = !partie.pause;
    var b = document.getElementById('awakKidsPauseBtn');
    if (b) b.textContent = partie.pause ? 'Reprendre' : 'Pause';
  };

  global.AwakKidsFinir = function () { _fin(); };

  // 🚪 Quitter sans enregistrer : l'écran de jeu n'offrait que
  // « TERMINER MAINTENANT », qui clôt la partie ET l'enregistre.
  global.AwakKidsQuitter = function () {
    if (tic) { clearInterval(tic); tic = null; }
    partie = null;
    document.getElementById('awakKidsPlay')?.remove();
  };

  // v1686 : jeu lancé depuis le profil d'un PARENT → « Qui a joué ? » pour donner leurs étoiles aux enfants
  var _jeuFini = null;
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function quiAJoue(enfant, minutes, debut, nom) {
    try {
      if (enfant || !global.AwakEtoiles || !AwakEtoiles.enfants) return '';
      var ens = AwakEtoiles.enfants(); if (!ens.length) return '';
      _jeuFini = { minutes: minutes, debut: debut, nom: nom };
      var n = AwakEtoiles.pourMinutes(minutes);
      return '<div style="text-align:left;margin:0 0 14px;padding:12px;border-radius:14px;background:rgba(251,191,36,0.08);border:1px solid rgba(251,191,36,0.35);">'
        + '<div style="font-size:0.78em;color:#fde68a;font-weight:800;margin-bottom:8px;">Qui a joué ? +' + n + ' étoile' + (n > 1 ? 's' : '') + ' chacun</div>'
        + '<div style="display:flex;gap:6px;flex-wrap:wrap;">' + ens.map(function (e) {
            return '<button data-pid="' + esc(e.id) + '" onclick="AwakKidsEtoile(this)" style="min-height:auto;padding:8px 13px;border-radius:99px;cursor:pointer;font-family:inherit;font-weight:800;font-size:0.8em;background:#1a1e26;color:#e2e8f0;border:1px solid rgba(251,191,36,0.45);">' + esc(e.name || 'Enfant') + '</button>';
          }).join('') + '</div></div>';
    } catch (e) { _awkE(e); return ''; }
  }
  global.AwakKidsEtoile = function (btn) {
    if (!_jeuFini || !btn || btn.dataset.fait) return;
    var pid = btn.dataset.pid, j = _jeuFini;
    AwakEtoiles.garde(function () {
      var n = AwakEtoiles.gagnerPour(pid, j.minutes, String(j.debut) + ':' + pid, j.nom);
      btn.dataset.fait = '1';
      btn.textContent = btn.textContent + (n ? ' +' + n : ' déjà compté');
      btn.style.background = '#fbbf24'; btn.style.color = '#1a1204';
    })();
  };
  function _fin() {
    if (tic) { clearInterval(tic); tic = null; }
    if (!partie) return;
    var minActifs = (partie.actif || 0) / 60;   // v1755 : anti-triche — les pauses ne comptent pas
    var minutes = Math.max(1, Math.round(minActifs));
    var jeu = partie.jeu;
    document.getElementById('awakKidsPlay')?.remove();

    // 📝 Enregistrement — ⚠️ crédit ASYMÉTRIQUE : un adulte qui court après
    // un enfant ne fait pas une séance. On note l'activité pour la régularité
    // (badges, jours actifs), sans gonfler les statistiques de progression.
    var enfant = false;
    try {
      enfant = !!(global.AwakYouth && typeof global.AwakYouth.isChild === 'function'
                  && global.AwakYouth.isChild());
    } catch (e) { _awkE(e); }
    try {
      if (typeof global.saveWorkoutToHistory === 'function') {
        global.saveWorkoutToHistory({
          name: jeu.emoji + ' ' + jeu.nom,
          exercises: [{ name: jeu.nom }],
          _kidsGame: true,
          _duo: true,                    // compte pour le badge « À deux c'est mieux »
          _legere: !enfant               // parent : activité légère
        }, minutes);
      }
    } catch (e) { _awkE(e); }
    try {
      if (typeof global.AwakFamBadgeInc === 'function') global.AwakFamBadgeInc('seancesDuo', 1);
    } catch (e) { _awkE(e); }
    // v1685 : un jeu joué par un enfant rapporte ses étoiles, comme une séance
    var etoilesJeu = 0;
    try { if (enfant && global.AwakEtoiles) etoilesJeu = global.AwakEtoiles.gagnerSeance(minActifs, partie.debut, jeu.nom); } catch (e) { _awkE(e); }

    // v1747 : un enfant a la même grande fête qu'après une séance (renard, chemin, autocollant)
    if (enfant && global.AwakKid && global.AwakKid.fin) {
      var deb = partie.debut; partie = null;
      try { global.AwakKid.fin(etoilesJeu, minutes, 'jeu:' + deb); return; } catch (e) { _awkE(e); }
      partie = { debut: deb };
    }
    var L = global._awkKidsLook || {};
    var ov = document.createElement('div');
    ov.id = 'awakKidsFin';
    ov.style.cssText = 'position:fixed;inset:0;z-index:11500;background:rgba(0,0,0,0.92);'
      + 'backdrop-filter:blur(10px);display:flex;align-items:center;justify-content:center;padding:20px;';
    ov.style.cssText = (L.FOND || 'position:fixed;inset:0;background:#0b1220;').replace('z-index:11000', 'z-index:11500') + 'display:flex;align-items:center;justify-content:center;';
    ov.innerHTML = '<div style="width:100%;max-width:390px;text-align:center;">'
      + '<img src="images/kid/renard_bravo.webp" alt="" style="width:170px;height:170px;object-fit:contain;">'
      + '<div style="font-size:34px;font-weight:900;color:#fff;margin-top:4px;">Bien joué !</div>'
      + '<div style="font-size:18px;font-weight:800;color:#bae6fd;margin:8px 0 16px;line-height:1.4;">' + minutes + ' minute' + (minutes > 1 ? 's' : '') + ' de jeu ensemble.<br>Ça compte comme une vraie séance.</div>'
      + quiAJoue(enfant, minutes, partie.debut, jeu.nom)
      + '<button onclick="document.getElementById(\'awakKidsFin\').remove();if(window.updateHomeStats)updateHomeStats();" style="width:100%;min-height:60px;font-size:20px;' + (L.GROS || '') + '">Super !</button>'
      + '</div>';
    document.body.appendChild(ov);
    partie = null;
  }
})(window);
