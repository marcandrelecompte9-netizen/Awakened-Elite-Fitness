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
  function _estEnfant() {
    try {
      return !!(global.AwakYouth && typeof global.AwakYouth.isChild === 'function'
                && global.AwakYouth.isChild());
    } catch (e) { return false; }
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
    try { dernier = localStorage.getItem('awakKidsDernier'); } catch (e) {}
    var choix = cles.filter(function (k) { return k !== dernier; });
    if (!choix.length) choix = cles;
    var k = choix[Math.floor(Math.random() * choix.length)];
    try { localStorage.setItem('awakKidsDernier', k); } catch (e) {}
    global.AwakKidsDetail(k);
  };

  // ── Liste des jeux ────────────────────────────────────────────────
  global.AwakKidsOpen = function () {
    try { if (global.AwakFamCloseAll) global.AwakFamCloseAll(); } catch (e) {}
    document.getElementById('awakKidsModal')?.remove();

    var cartes = Object.keys(JEUX).map(function (k) {
      var j = JEUX[k];
      return '<button onclick="AwakKidsDetail(\'' + k + '\')" '
        + 'style="width:100%;text-align:left;display:flex;align-items:center;gap:12px;'
        + 'padding:13px;margin-bottom:9px;border-radius:14px;cursor:pointer;'
        + 'background:rgba(96,168,240,0.07);border:1px solid rgba(96,168,240,0.24);">'
        + '<span style="font-size:1.7em;flex-shrink:0;">' + j.emoji + '</span>'
        + '<span style="flex:1;min-width:0;">'
        +   '<span style="display:block;font-size:0.86em;font-weight:800;color:#f1f5f9;">'
        +     esc(j.nom) + '</span>'
        +   '<span style="display:block;font-size:0.7em;color:#94a3b8;margin-top:2px;">'
        +     esc(j.pitch) + '</span>'
        +   '<span style="display:block;font-size:0.62em;color:#60a8f0;margin-top:3px;font-weight:700;">'
        +     (j.duree * j.manches) + ' min · ' + j.manches + ' manches</span>'
        + '</span>'
        + '<span style="color:#60a8f0;font-size:1em;flex-shrink:0;">›</span>'
        + '</button>';
    }).join('');

    var ov = document.createElement('div');
    ov.id = 'awakKidsModal';
    ov.style.cssText = 'position:fixed;inset:0;z-index:11000;background:rgba(0,0,0,0.88);'
      + 'backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;'
      + 'padding:16px;overflow-y:auto;';
    ov.innerHTML =
      '<div style="width:100%;max-width:430px;margin:auto;padding:18px;border-radius:20px;'
    +   'background:linear-gradient(160deg,#101822,#0a0d13);'
    +   'border:1.5px solid rgba(96,168,240,0.35);box-shadow:0 0 40px rgba(96,168,240,0.14);">'
    +   '<div style="width:36px;height:4px;background:rgba(255,255,255,0.18);'
    +     'border-radius:99px;margin:0 auto 14px;"></div>'
    +   '<div style="font-size:0.54em;letter-spacing:2.5px;color:#60a8f0;font-weight:900;">◈ À DEUX</div>'
    +   '<div style="font-family:var(--font-display),sans-serif;font-size:1.15em;font-weight:800;'
    +     'color:#fff;margin:2px 0 4px;">Jeux à faire ensemble</div>'
    +   '<div style="font-size:0.72em;color:#94a3b8;line-height:1.5;margin-bottom:15px;">'
    +     'Pas d\'exercices à compter. On joue, et le corps travaille tout seul.</div>'
    +   '<button onclick="AwakKidsAleatoire()" '
    +     'style="width:100%;padding:13px;margin-bottom:12px;border-radius:14px;'
    +     'border:1px dashed rgba(96,168,240,0.45);cursor:pointer;'
    +     'background:rgba(96,168,240,0.05);color:#60a8f0;'
    +     'font-size:0.8em;font-weight:800;letter-spacing:0.5px;">'
    +     '🎲 Surprends-moi</button>'
    +   cartes
    +   '<button onclick="document.getElementById(\'awakKidsModal\').remove()" '
    +     'style="width:100%;padding:12px;margin-top:6px;border-radius:13px;cursor:pointer;'
    +     'background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.12);'
    +     'color:#94a3b8;font-size:0.75em;font-weight:800;letter-spacing:1px;">FERMER</button>'
    + '</div>';
    ov.onclick = function (e) { if (e.target === ov) ov.remove(); };
    document.body.appendChild(ov);
  };

  // ── Règles d'un jeu ───────────────────────────────────────────────
  global.AwakKidsDetail = function (cle) {
    var j = JEUX[cle];
    if (!j) return;
    document.getElementById('awakKidsModal')?.remove();
    document.getElementById('awakKidsDetail')?.remove();

    var regles = j.regles.map(function (r, i) {
      return '<div style="display:flex;gap:9px;margin-bottom:8px;">'
        + '<span style="flex-shrink:0;width:20px;height:20px;border-radius:99px;'
        +   'background:rgba(96,168,240,0.15);border:1px solid rgba(96,168,240,0.35);'
        +   'color:#60a8f0;font-size:0.62em;font-weight:900;display:flex;'
        +   'align-items:center;justify-content:center;">' + (i + 1) + '</span>'
        + '<span style="flex:1;font-size:0.76em;color:#cbd5e1;line-height:1.45;">'
        +   esc(r) + '</span></div>';
    }).join('');

    var ov = document.createElement('div');
    ov.id = 'awakKidsDetail';
    ov.style.cssText = 'position:fixed;inset:0;z-index:11000;background:rgba(0,0,0,0.90);'
      + 'backdrop-filter:blur(9px);display:flex;align-items:center;justify-content:center;'
      + 'padding:16px;overflow-y:auto;';
    ov.innerHTML =
      '<div style="width:100%;max-width:430px;margin:auto;padding:20px;border-radius:20px;'
    +   'background:linear-gradient(160deg,#101822,#0a0d13);'
    +   'border:1.5px solid rgba(96,168,240,0.35);">'
    +   '<div style="text-align:center;margin-bottom:14px;">'
    +     '<div style="font-size:2.6em;line-height:1;">' + j.emoji + '</div>'
    +     '<div style="font-family:var(--font-display),sans-serif;font-size:1.15em;'
    +       'font-weight:800;color:#fff;margin-top:5px;">' + esc(j.nom) + '</div>'
    +     '<div style="font-size:0.72em;color:#94a3b8;margin-top:3px;">' + esc(j.pitch) + '</div>'
    +   '</div>'
    +   '<div style="font-size:0.52em;letter-spacing:2px;color:#60a8f0;font-weight:900;'
    +     'margin-bottom:9px;">◈ COMMENT ON JOUE</div>'
    +   regles
    +   '<div style="background:rgba(255,255,255,0.03);border-radius:11px;padding:10px 12px;'
    +     'margin:12px 0;font-size:0.7em;color:#94a3b8;line-height:1.45;">'
    +     '<strong style="color:#cbd5e1;">Ça travaille :</strong> ' + esc(j.qualite)
    +     '<br><strong style="color:#cbd5e1;">Variante :</strong> ' + esc(j.variante) + '</div>'
    +   '<button onclick="AwakKidsStart(\'' + cle + '\')" '
    +     'style="width:100%;padding:15px;border-radius:14px;border:none;cursor:pointer;'
    +     'background:linear-gradient(160deg,#93c5fd,#60a8f0 45%,#164e8a);'
    +     'color:#04162b;font-weight:900;font-size:0.86em;letter-spacing:1px;'
    +     'box-shadow:0 0 24px rgba(96,168,240,0.3);">'
    +     'COMMENCER · ' + (j.duree * j.manches) + ' MIN</button>'
    +   '<div style="display:flex;gap:8px;margin-top:8px;">'
    +   '<button onclick="AwakKidsOpen()" '
    +     'style="flex:1;padding:11px;border-radius:13px;cursor:pointer;'
    +     'background:transparent;border:1px solid rgba(255,255,255,0.12);'
    +     'color:#94a3b8;font-size:0.72em;font-weight:800;">← AUTRE JEU</button>'
    +   '<button onclick="document.getElementById(\'awakKidsDetail\')?.remove()" '
    +     'style="flex:1;padding:11px;border-radius:13px;cursor:pointer;'
    +     'background:transparent;border:1px solid rgba(255,255,255,0.12);'
    +     'color:#94a3b8;font-size:0.72em;font-weight:800;">FERMER</button>'
    +   '</div>'
    + '</div>';
    ov.onclick = function (e) { if (e.target === ov) ov.remove(); };
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
    tic = setInterval(_tick, 1000);
  };

  function _tick() {
    if (!partie || partie.pause) return;
    partie.reste--;
    if (partie.reste <= 0) {
      // Manche terminée : on enchaîne, ou on conclut.
      try { if (typeof vibrate === 'function') vibrate([80, 60, 80]); } catch (e) {}
      if (partie.manche >= partie.jeu.manches) { _fin(); return; }
      partie.manche++;
      partie.reste = partie.jeu.duree * 60;
      try {
        if (typeof showToast === 'function') {
          showToast('🔄 Manche ' + partie.manche + ' — changez de rôle !', 'info', 3000);
        }
      } catch (e) {}
    }
    _maj();
  }

  function _maj() {
    var t = document.getElementById('awakKidsChrono');
    if (t) t.textContent = _fmt(Math.max(0, partie.reste));
    var m = document.getElementById('awakKidsManche');
    if (m) m.textContent = 'Manche ' + partie.manche + ' / ' + partie.jeu.manches;
  }

  function _ecran() {
    document.getElementById('awakKidsPlay')?.remove();
    var ov = document.createElement('div');
    ov.id = 'awakKidsPlay';
    ov.style.cssText = 'position:fixed;inset:0;z-index:11500;background:#080d16;'
      + 'display:flex;align-items:center;justify-content:center;padding:20px;';
    ov.innerHTML =
      '<div style="width:100%;max-width:400px;text-align:center;">'
    +   '<div style="font-size:3.4em;line-height:1;margin-bottom:6px;">' + partie.jeu.emoji + '</div>'
    +   '<div style="font-family:var(--font-display),sans-serif;font-size:1.1em;'
    +     'font-weight:800;color:#fff;">' + partie.jeu.nom + '</div>'
    +   '<div id="awakKidsManche" style="font-size:0.68em;color:#60a8f0;font-weight:800;'
    +     'letter-spacing:1.5px;margin-top:4px;">Manche 1 / ' + partie.jeu.manches + '</div>'
    +   '<div id="awakKidsChrono" style="font-family:var(--font-display),sans-serif;'
    +     'font-size:4.2em;font-weight:900;color:#60a8f0;line-height:1.1;margin:14px 0;'
    +     'text-shadow:0 0 26px rgba(96,168,240,0.45);">' + _fmt(partie.reste) + '</div>'
    +   '<div style="font-size:0.74em;color:#94a3b8;line-height:1.5;margin-bottom:20px;">'
    +     partie.jeu.pitch + '</div>'
    +   '<button onclick="AwakKidsPause()" id="awakKidsPauseBtn" '
    +     'style="width:100%;padding:14px;border-radius:14px;cursor:pointer;margin-bottom:8px;'
    +     'background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.14);'
    +     'color:#cbd5e1;font-weight:800;font-size:0.8em;">PAUSE</button>'
    +   '<button onclick="AwakKidsQuitter()" '
    +     'style="width:100%;padding:12px;border-radius:14px;cursor:pointer;margin-bottom:8px;'
    +     'background:transparent;border:1px solid rgba(255,255,255,0.12);'
    +     'color:#94a3b8;font-weight:800;font-size:0.74em;">QUITTER SANS ENREGISTRER</button>'
    +   '<button onclick="AwakKidsFinir()" '
    +     'style="width:100%;padding:14px;border-radius:14px;border:none;cursor:pointer;'
    +     'background:linear-gradient(160deg,#93c5fd,#60a8f0 45%,#164e8a);'
    +     'color:#04162b;font-weight:900;font-size:0.82em;letter-spacing:1px;">'
    +     'TERMINER MAINTENANT</button>'
    + '</div>';
    document.body.appendChild(ov);
  }

  global.AwakKidsPause = function () {
    if (!partie) return;
    partie.pause = !partie.pause;
    var b = document.getElementById('awakKidsPauseBtn');
    if (b) b.textContent = partie.pause ? 'REPRENDRE' : 'PAUSE';
  };

  global.AwakKidsFinir = function () { _fin(); };

  // 🚪 Quitter sans enregistrer : l'écran de jeu n'offrait que
  // « TERMINER MAINTENANT », qui clôt la partie ET l'enregistre.
  global.AwakKidsQuitter = function () {
    if (tic) { clearInterval(tic); tic = null; }
    partie = null;
    document.getElementById('awakKidsPlay')?.remove();
  };

  function _fin() {
    if (tic) { clearInterval(tic); tic = null; }
    if (!partie) return;
    var minutes = Math.max(1, Math.round((Date.now() - partie.debut) / 60000));
    var jeu = partie.jeu;
    document.getElementById('awakKidsPlay')?.remove();

    // 📝 Enregistrement — ⚠️ crédit ASYMÉTRIQUE : un adulte qui court après
    // un enfant ne fait pas une séance. On note l'activité pour la régularité
    // (badges, jours actifs), sans gonfler les statistiques de progression.
    var enfant = false;
    try {
      enfant = !!(global.AwakYouth && typeof global.AwakYouth.isChild === 'function'
                  && global.AwakYouth.isChild());
    } catch (e) {}
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
    } catch (e) {}
    try {
      if (typeof global.AwakFamBadgeInc === 'function') global.AwakFamBadgeInc('seancesDuo', 1);
    } catch (e) {}

    var ov = document.createElement('div');
    ov.id = 'awakKidsFin';
    ov.style.cssText = 'position:fixed;inset:0;z-index:11500;background:rgba(0,0,0,0.92);'
      + 'backdrop-filter:blur(10px);display:flex;align-items:center;justify-content:center;padding:20px;';
    ov.innerHTML =
      '<div style="width:100%;max-width:390px;text-align:center;padding:26px 20px;'
    +   'border-radius:20px;background:linear-gradient(160deg,#101822,#0a0d13);'
    +   'border:1.5px solid rgba(96,168,240,0.4);box-shadow:0 0 40px rgba(96,168,240,0.18);">'
    +   '<div style="font-size:3em;line-height:1;margin-bottom:8px;">🎉</div>'
    +   '<div style="font-family:var(--font-display),sans-serif;font-size:1.2em;'
    +     'font-weight:800;color:#fff;">Bien joué !</div>'
    +   '<div style="font-size:0.8em;color:#cbd5e1;line-height:1.5;margin:8px 0 16px;">'
    +     '<strong style="color:#60a8f0;">' + minutes + ' minutes</strong> de jeu ensemble.<br>'
    +     'Ça compte comme une vraie séance.</div>'
    +   '<button onclick="document.getElementById(\'awakKidsFin\').remove();'
    +     'if(window.updateHomeStats)updateHomeStats();" '
    +     'style="width:100%;padding:14px;border-radius:14px;border:none;cursor:pointer;'
    +     'background:linear-gradient(160deg,#93c5fd,#60a8f0 45%,#164e8a);'
    +     'color:#04162b;font-weight:900;font-size:0.84em;letter-spacing:1px;">TERMINÉ</button>'
    + '</div>';
    document.body.appendChild(ov);
    partie = null;
  }
})(window);
