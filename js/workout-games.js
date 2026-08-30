/* ═══════════════════════════════════════════════════════════════════
   JEUX D'ENTRAÎNEMENT — moteur commun (10 jeux)
   ───────────────────────────────────────────────────────────────────
   Les dix jeux partagent le même squelette : constituer un pool
   d'exercices, dérouler une partie, enregistrer le résultat. Seule la
   MÉCANIQUE change — d'où le registre MECANIQUES ci-dessous, où chacune
   déclare comment préparer la partie, combien d'étapes elle compte, et
   ce qu'elle affiche à chaque étape.
     tirage     → Jeu de cartes
     des        → Dés
     minute     → Death by…
     emom       → EMOM
     sequence   → 21-15-9, Pyramide
     liste      → Chipper
     alternance → You go I go, Duel      (à deux)
     grille     → Bingo                  (défi hebdomadaire, hors partie)
   Le pool réutilise les filtres de l'app (matériel, douleur, mobilité
   réduite, âge) : tous les jeux en héritent sans code supplémentaire.
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  // ── CATALOGUE ──────────────────────────────────────────────────────
  var GAMES = {
    cartes:  { name: 'Jeu de cartes', emoji: '🃏', mecanique: 'tirage', duo: false,
               desc: 'La couleur donne l\'exercice, la valeur les répétitions.',
               reglage: 'Combien de cartes ?', options: [12, 20, 32], defaut: 20 },
    des:     { name: 'Dés', emoji: '🎲', mecanique: 'des', duo: false,
               desc: 'Un dé choisit l\'exercice, l\'autre l\'effort.',
               reglage: 'Combien de lancers ?', options: [10, 15, 25], defaut: 15 },
    deathby: { name: 'Death by…', emoji: '⏱️', mecanique: 'minute', duo: false,
               desc: '1 rep la 1re minute, 2 la 2e… jusqu\'à lâcher.',
               reglage: 'Minutes maximum', options: [10, 15, 20], defaut: 15 },
    emom:    { name: 'EMOM', emoji: '⏲️', mecanique: 'emom', duo: false,
               desc: 'Une tâche au début de chaque minute, le reste est ta récup.',
               reglage: 'Durée (minutes)', options: [10, 16, 24], defaut: 16 },
    v21159:  { name: '21-15-9', emoji: '🔻', mecanique: 'sequence', duo: false,
               desc: 'Trois tours dégressifs : 21 reps, puis 15, puis 9.',
               reglage: 'Nombre d\'exercices', options: [2, 3], defaut: 2,
               rounds: [21, 15, 9] },
    pyramide:{ name: 'Pyramide', emoji: '🔺', mecanique: 'sequence', duo: false,
               desc: 'Les répétitions montent puis redescendent.',
               reglage: 'Sommet de la pyramide', options: [6, 8, 10], defaut: 8 },
    chipper: { name: 'Chipper', emoji: '📋', mecanique: 'liste', duo: false,
               desc: 'Une longue liste à terminer, dans l\'ordre que tu veux.',
               reglage: 'Nombre d\'exercices', options: [5, 8, 12], defaut: 8 },
    yougo:   { name: 'You go, I go', emoji: '🔄', mecanique: 'alternance', duo: true,
               desc: 'Chacun son tour : l\'un travaille, l\'autre récupère.',
               reglage: 'Nombre de tours', options: [8, 12, 16], defaut: 12 },
    duel:    { name: 'Duel', emoji: '⚔️', mecanique: 'alternance', duo: true, course: true,
               desc: 'Même volume pour les deux — le premier fini gagne.',
               reglage: 'Tours par joueur', options: [5, 8, 12], defaut: 8 },
    egalisateur: { name: 'Égalisateur', emoji: '⚖️', mecanique: 'handicap', duo: true,
               desc: 'Duel équilibré : chacun ses répétitions selon son niveau.',
               reglage: 'Tours par joueur', options: [5, 8, 12], defaut: 8 },
    relais:  { name: 'Relais', emoji: '🤝', mecanique: 'relais', duo: true,
               desc: 'Un volume commun à écouler ensemble, chacun son tour.',
               reglage: 'Répétitions à deux', options: [100, 200, 300], defaut: 200 },
    miroir:  { name: 'Miroir', emoji: '🪞', mecanique: 'miroir', duo: true,
               desc: 'Même exercice, en même temps. On se motive du coin de l\'œil.',
               reglage: 'Nombre de tours', options: [6, 10, 15], defaut: 10 },
    partage: { name: 'Chipper partagé', emoji: '🧩', mecanique: 'partage', duo: true,
               desc: 'Une liste répartie entre vous deux.',
               reglage: 'Nombre d\'exercices', options: [6, 10, 14], defaut: 10 },
    roi:     { name: 'Roi de la colline', emoji: '👑', mecanique: 'roi', duo: true,
               desc: 'Le gagnant du tour choisit l\'exercice suivant.',
               reglage: 'Nombre de tours', options: [5, 8, 12], defaut: 8 },
    planche: { name: 'Duel de gainage', emoji: '🧱', mecanique: 'gainage', duo: true,
               desc: 'L\'un tient la planche pendant que l\'autre enchaîne.',
               reglage: 'Tours par joueur', options: [3, 5, 8], defaut: 5 },
    bingo:   { name: 'Bingo', emoji: '🎯', mecanique: 'grille', duo: false, hebdo: true,
               desc: 'Neuf défis à cocher dans la semaine.', reglage: null }
  };

  // ── POOL D'EXERCICES (hérite de tous les filtres de l'app) ─────────
  // `idsParticipants` : pour un jeu À DEUX, les identifiants des DEUX joueurs.
  // Les protections s'appliquent alors au plus fragile des deux, pas seulement
  // au profil actif.
  function pool(limit, niveauForce, idsParticipants) {
    var base = [];
    try { base = (typeof exerciseDatabase !== 'undefined' && exerciseDatabase) ? exerciseDatabase.slice() : []; }
    catch (e) { base = []; }
    if (!base.length) return [];

    // Seulement de VRAIS exercices : la base contient aussi des échauffements
    // (type warmup), des étirements (stretch) et des entrées d'information
    // (info), qui n'ont pas leur place dans un jeu à répétitions.
    base = base.filter(function (e) { return e && e.name && e.type === 'exercise'; });

    // 🧘 DISCIPLINES EXCLUES — le filtre `type === 'exercise'` ne suffit pas :
    // les exercices de discipline (yoga, pilates, boxe…) portent EUX AUSSI ce
    // type. Résultat : « Chat-vache », « Posture du cobra » ou « Respiration »
    // pouvaient sortir dans un jeu à répétitions, alors que ce sont des postures
    // tenues, pas des mouvements comptables. On pioche donc dans la base
    // MUSCULATION SEULE, comme les générateurs de séance (v807).
    base = base.filter(function (e) { return !e.discipline; });

    // 🚫 Entrées structurelles et postures d'assouplissement mal typées :
    // certains mouvements sont classés `exercise` alors qu'ils relèvent de
    // l'échauffement ou de l'étirement. On les écarte par leur nom.
    var _exclus = /^(cat[- ]?cow|chat[- ]?vache|chat[- ]?dos|cobra|respiration|salutation|posture|étirement|etirement|assouplissement|mobilité|mobilite)/i;
    base = base.filter(function (e) { return !_exclus.test(e.name); });

    try {
      if (typeof window.getSelectedEquipmentNames === 'function') {
        var dispo = window.getSelectedEquipmentNames() || [];
        if (dispo.length) {
          base = base.filter(function (e) {
            if (!Array.isArray(e.equipment) || !e.equipment.length) return true;
            return e.equipment.some(function (q) { return dispo.indexOf(q) !== -1; });
          });
        }
      }
    } catch (e) {}

    // 🌳 EXTÉRIEUR — même règle que le générateur principal (helper partagé
    // awakExerciseBlockedByLocation, défini dans app.js). Écarte les exercices
    // d'extérieur au poids du corps si le lieu actif n'est pas « Extérieur ».
    try {
      if (typeof window.awakExerciseBlockedByLocation === 'function') {
        base = base.filter(function (e) { return !window.awakExerciseBlockedByLocation(e); });
      }
    } catch (e) {}

    // 🩹 DOULEURS — les zones sont désormais propres à chaque profil (v663).
    // Pour un jeu à deux, on écarte les exercices touchant une zone sensible de
    // L'UN OU L'AUTRE : chacun exécute les mêmes mouvements, il faut donc
    // protéger les deux.
    try {
      if (window.AwakPain) {
        if (Array.isArray(idsParticipants) && idsParticipants.length
            && typeof window.AwakPain.exerciseHitsPainFor === 'function') {
          base = base.filter(function (e) {
            return !window.AwakPain.exerciseHitsPainFor(e, idsParticipants);
          });
        } else if (typeof window.AwakPain.exerciseHitsPain === 'function') {
          base = base.filter(function (e) { return !window.AwakPain.exerciseHitsPain(e); });
        }
      }
    } catch (e) {}

    try {
      if (window.AwakAdaptive && typeof window.AwakAdaptive.isReducedMobility === 'function'
          && window.AwakAdaptive.isReducedMobility()
          && typeof window.AwakAdaptive.isUnsuitable === 'function') {
        base = base.filter(function (e) { return !window.AwakAdaptive.isUnsuitable(e); });
      }
    } catch (e) {}

    // Niveau de l'utilisateur : un débutant ne doit pas tomber sur un exercice
    // avancé. Garde-fou : on n'applique le filtre que s'il reste assez de choix.
    try {
      var lvl = niveauForce || (typeof window.getUserProfile === 'function' && (window.getUserProfile() || {}).level) || 'intermediate';
      // À deux : on retient le niveau le PLUS PRUDENT des participants, afin de
      // ne pas imposer au débutant les mouvements avancés de son partenaire.
      if (!niveauForce && Array.isArray(idsParticipants)) {
        var rang = { beginner: 0, intermediate: 1, advanced: 2 };
        var mini = rang[lvl] === undefined ? 1 : rang[lvl];
        idsParticipants.forEach(function (id) {
          if (!id) return;
          try {
            var raw = (typeof window.getProfileData === 'function') ? window.getProfileData(id, 'userProfile') : null;
            var niv = raw ? (JSON.parse(raw) || {}).level : null;
            if (niv && rang[niv] !== undefined && rang[niv] < mini) mini = rang[niv];
          } catch (e) {}
        });
        lvl = Object.keys(rang).filter(function (k) { return rang[k] === mini; })[0] || lvl;
      }
      var permis = lvl === 'beginner' ? ['Débutant']
                 : lvl === 'advanced' ? ['Débutant', 'Intermédiaire', 'Avancé']
                 : ['Débutant', 'Intermédiaire'];
      var parNiveau = base.filter(function (e) { return !e.difficulty || permis.indexOf(e.difficulty) !== -1; });
      if (parNiveau.length >= 8) base = parNiveau;
    } catch (e) {}

    try {
      // ⚠️ SÉCURITÉ ENFANT — la restriction s'applique dès qu'UN des participants
      // a moins de 13 ans, pas seulement le profil actif. Sans ça, un adulte
      // lançant un jeu à deux avec son enfant obtenait des exercices à charges
      // lourdes que l'enfant allait pourtant exécuter.
      var _enfantPresent = false;
      if (window.AwakYouth) {
        if (typeof window.AwakYouth.isChild === 'function' && window.AwakYouth.isChild()) _enfantPresent = true;
        if (!_enfantPresent && Array.isArray(idsParticipants)
            && typeof window.AwakYouth.isChildProfile === 'function') {
          _enfantPresent = idsParticipants.some(function (id) {
            try { return id && window.AwakYouth.isChildProfile(id); } catch (e) { return false; }
          });
        }
      }
      if (_enfantPresent) {
        base = base.filter(function (e) {
          return !Array.isArray(e.equipment) ||
                 e.equipment.every(function (q) { return ['Poids du corps', 'Élastique', 'Tapis'].indexOf(q) !== -1; });
        });
      }

      // ⚠️ SÉCURITÉ SÉNIOR — dès qu'UN des participants a 65 ans et plus, on
      // écarte les mouvements à IMPACT (sauts, pliométrie) : chocs articulaires
      // et risque de chute. Même raisonnement que pour l'enfant — on protège le
      // participant le plus fragile, pas seulement le profil actif.
      var _seniorPresent = false;
      if (window.AwakYouth) {
        if (typeof window.AwakYouth.isSenior === 'function' && window.AwakYouth.isSenior()) _seniorPresent = true;
        if (!_seniorPresent && Array.isArray(idsParticipants)
            && typeof window.AwakYouth.isSeniorProfile === 'function') {
          _seniorPresent = idsParticipants.some(function (id) {
            try { return id && window.AwakYouth.isSeniorProfile(id); } catch (e) { return false; }
          });
        }
      }
      if (_seniorPresent) {
        base = base.filter(function (e) { return !RX_IMPACT.test(e.name || ''); });
      }
    } catch (e) {}

    for (var i = base.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = base[i]; base[i] = base[j]; base[j] = t;
    }
    return limit ? base.slice(0, limit) : base;
  }

  function nomEx(e) { return e && e.name ? e.name : '—'; }

  // ⏱️ Exercices ISOMÉTRIQUES : ils se tiennent en secondes, pas en répétitions.
  // Le champ `duration` de la base ne convient pas comme indice (les pompes en
  // ont un aussi : il désigne une durée de série suggérée). On s'appuie donc
  // sur le nom, en écartant les variantes DYNAMIQUES qui, elles, se comptent.
  // Mouvements à IMPACT (sauts, pliométrie). Liste alignée sur la table de
  // substitution du « mode silencieux » de l'app, élargie aux variantes.
  var RX_IMPACT = /saut|jump|burpee|jumping jack|high knees|montées de genoux|plyo|pliom|explosif|explosive|skater|box jump|bond/i;

  var RX_TENUE = /planche|plank|hollow|superman|wall ?sit|dead ?hang|l-?sit|gainage|chaise murale|posture/i;
  var RX_DYNAMIQUE = /dynamique|rotation|drag|balancement|swing|jump|saut/i;
  function estTenue(ex) {
    var n = (ex && ex.name) ? ex.name : '';
    return RX_TENUE.test(n) && !RX_DYNAMIQUE.test(n);
  }
  // Traduit un nombre de répétitions en effort adapté à l'exercice.
  function effortPour(ex, reps) {
    if (estTenue(ex)) {
      var s = Math.round((reps * 2.5) / 5) * 5;      // ~2,5 s par répétition
      s = Math.max(15, Math.min(90, s));             // borné : ni trop court, ni interminable
      return { valeur: s, unite: 'secondes à tenir' };
    }
    return { valeur: reps, unite: 'reps' };
  }

  // ── REGISTRE DES MÉCANIQUES ────────────────────────────────────────
  var COULEURS = [
    { s: '♠', nom: 'Pique',   c: '#e2e8f0' }, { s: '♥', nom: 'Cœur',    c: '#f87171' },
    { s: '♦', nom: 'Carreau', c: '#fbbf24' }, { s: '♣', nom: 'Trèfle',  c: '#4ade80' }
  ];
  var VALEURS = [
    { v: 'A', n: 14 }, { v: '2', n: 2 }, { v: '3', n: 3 }, { v: '4', n: 4 }, { v: '5', n: 5 },
    { v: '6', n: 6 }, { v: '7', n: 7 }, { v: '8', n: 8 }, { v: '9', n: 9 }, { v: '10', n: 10 },
    { v: 'V', n: 11 }, { v: 'D', n: 12 }, { v: 'R', n: 13 }
  ];
  var FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

  var MECANIQUES = {

    // 🃏 Tirage de cartes : 4 exercices, un par couleur
    tirage: {
      exos: function () { return 4; },
      idx: function (p) { return p.carte ? p.carte.c : -1; },
      prepare: function (p) {
        var paquet = [];
        for (var c = 0; c < 4; c++) for (var v = 0; v < VALEURS.length; v++) paquet.push({ c: c, v: v });
        melange(paquet);
        p.paquet = paquet.slice(0, p.reglage);
        p.carte = null;
      },
      total: function (p) { return p.paquet.length; },
      etape: function (p) {
        if (!p.carte) return null;
        return { nom: nomEx(p.exercices[p.carte.c]), valeur: VALEURS[p.carte.v].n, unite: 'reps' };
      },
      corps: function (p) {
        if (p.carte) {
          var co = COULEURS[p.carte.c], va = VALEURS[p.carte.v];
          var rouge = (p.carte.c === 1 || p.carte.c === 2);
          return '<div class="awak-carte" style="border-radius:16px;padding:14px;margin-bottom:14px;">'
            + '<div style="font-size:3.2em;font-weight:900;line-height:1;color:' + (rouge ? '#dc2626' : '#0f172a') + ';">' + va.v + ' ' + co.s + '</div></div>'
            + gros(p.exercices[p.carte.c], va.n, 'reps')
            + bouton('AwakGamesValider()', 'C\'est fait ✓');
        }
        var corr = COULEURS.map(function (c, i) {
          return '<div style="display:flex;align-items:center;gap:9px;font-size:0.76em;color:#cbd5e1;padding:4px 0;">'
            + '<span style="font-size:1.15em;color:' + c.c + ';width:18px;flex-shrink:0;">' + c.s + '</span>'
            + pastilleImg(p.exercices[i])
            + '<span style="min-width:0;">' + esc(nomEx(p.exercices[i])) + '</span></div>';
        }).join('');
        return encart('CORRESPONDANCES', corr)
          + bouton('AwakGamesTirer()', '🃏 Tirer une carte', true);
      }
    },

    // 🎲 Dés : un dé pour l'exercice, un pour l'effort
    des: {
      exos: function () { return 6; },
      idx: function (p) { return p.lance ? p.lance.a - 1 : -1; },
      prepare: function (p) { p.lance = null; },
      total: function (p) { return p.reglage; },
      etape: function (p) {
        if (!p.lance) return null;
        return { nom: nomEx(p.exercices[p.lance.a - 1]), valeur: p.lance.b * 3, unite: 'reps' };
      },
      corps: function (p) {
        if (p.lance) {
          return '<div style="font-size:3em;letter-spacing:6px;margin-bottom:12px;">' + FACES[p.lance.a - 1] + FACES[p.lance.b - 1] + '</div>'
            + gros(p.exercices[p.lance.a - 1], p.lance.b * 3, 'reps')
            + bouton('AwakGamesValider()', 'C\'est fait ✓');
        }
        var liste = p.exercices.map(function (e, i) {
          return '<div style="display:flex;align-items:center;gap:9px;font-size:0.74em;color:#cbd5e1;padding:3px 0;">'
            + '<span style="font-size:1.1em;width:20px;flex-shrink:0;">' + FACES[i] + '</span>'
            + pastilleImg(e, 28)
            + '<span style="min-width:0;">' + esc(nomEx(e)) + '</span></div>';
        }).join('');
        return encart('DÉ 1 = EXERCICE · DÉ 2 = EFFORT (×3 REPS)', liste)
          + bouton('AwakGamesTirer()', '🎲 Lancer les dés', true);
      }
    },

    // ⏱️ Death by… : les reps montent d'une unité chaque minute
    minute: {
      exos: function () { return 1; },
      chrono: 60,
      idx: function () { return 0; },
      prepare: function () {},
      total: function (p) { return p.reglage; },
      etape: function (p) { return { nom: nomEx(p.exercices[0]), valeur: p.pas + 1, unite: 'reps' }; },
      corps: function (p) {
        return sousTitre('MINUTE ' + (p.pas + 1))
          + blocChrono()
          + gros(p.exercices[0], p.pas + 1, 'répétition' + (p.pas ? 's' : '') + ' dans la minute')
          + bouton('AwakGamesValider()', 'Minute réussie ✓');
      }
    },

    // ⏲️ EMOM : charge constante, les exercices tournent
    emom: {
      exos: function () { return 4; },
      chrono: 60,
      idx: function (p) { return p.pas % p.exercices.length; },
      prepare: function (p) { p.reps = 10; },
      total: function (p) { return p.reglage; },
      etape: function (p) {
        return { nom: nomEx(p.exercices[p.pas % p.exercices.length]), valeur: p.reps, unite: 'reps' };
      },
      corps: function (p) {
        var e = p.exercices[p.pas % p.exercices.length];
        return sousTitre('MINUTE ' + (p.pas + 1) + ' / ' + p.reglage)
          + blocChrono()
          + gros(e, p.reps, 'reps puis récup')
          + bouton('AwakGamesValider()', 'Minute réussie ✓');
      }
    },

    // 🔻🔺 Séquence : suite de tours à volume imposé
    sequence: {
      exos: function (g, reglage) { return g.rounds ? reglage : 2; },
      idx: function (p) { return p.pas % p.exercices.length; },
      prepare: function (p) {
        if (p.jeu.rounds) { p.rounds = p.jeu.rounds.slice(); }
        else {                                   // pyramide : montée puis descente
          var r = [], sommet = p.reglage;
          for (var i = 2; i <= sommet; i += 2) r.push(i);
          for (var j = sommet - 2; j >= 2; j -= 2) r.push(j);
          p.rounds = r;
        }
      },
      total: function (p) { return p.rounds.length * p.exercices.length; },
      etape: function (p) {
        var nbEx = p.exercices.length;
        var tour = Math.floor(p.pas / nbEx), idx = p.pas % nbEx;
        return { nom: nomEx(p.exercices[idx]), valeur: p.rounds[tour], unite: 'reps' };
      },
      corps: function (p) {
        var nbEx = p.exercices.length;
        var tour = Math.floor(p.pas / nbEx), idx = p.pas % nbEx;
        var suite = p.rounds.map(function (r, i) {
          return '<span style="color:' + (i === tour ? '#4ade80' : '#475569') + ';font-weight:' + (i === tour ? '900' : '700') + ';">' + r + '</span>';
        }).join('<span style="color:#334155;"> · </span>');
        return sousTitre('TOUR ' + (tour + 1) + ' / ' + p.rounds.length)
          + '<div style="font-size:0.9em;margin-bottom:12px;">' + suite + '</div>'
          + gros(p.exercices[idx], p.rounds[tour], 'reps')
          + bouton('AwakGamesValider()', 'Terminé ✓');
      }
    },

    // 📋 Chipper : liste à écouler
    liste: {
      exos: function (g, reglage) { return reglage; },
      idx: function (p) { return p.pas; },
      prepare: function () {},
      total: function (p) { return p.exercices.length; },
      etape: function (p) {
        return { nom: nomEx(p.exercices[p.pas]), valeur: 10 + p.pas * 2, unite: 'reps' };
      },
      corps: function (p) {
        return sousTitre('ÉTAPE ' + (p.pas + 1) + ' / ' + p.exercices.length)
          + gros(p.exercices[p.pas], 10 + p.pas * 2, 'reps')
          + bouton('AwakGamesValider()', 'Terminé ✓');
      }
    },

    // ⚖️ ÉGALISATEUR — duel équilibré : chacun ses reps selon son niveau
    handicap: {
      exos: function () { return 3; },
      idx: function (p) { return Math.floor(p.pas / 2) % p.exercices.length; },
      prepare: function (p) { p.duo = duoJoueurs(); p.scores = [0, 0]; p.base = 12; },
      total: function (p) { return p.reglage * 2; },
      etape: function (p) {
        var q = p.pas % 2;
        return { nom: nomEx(p.exercices[Math.floor(p.pas / 2) % p.exercices.length]),
                 valeur: Math.max(3, Math.round(p.base * p.duo[q].coef)), unite: 'reps' };
      },
      corps: function (p) {
        var q = p.pas % 2, e = p.exercices[Math.floor(p.pas / 2) % p.exercices.length];
        var reps = Math.max(3, Math.round(p.base * p.duo[q].coef));
        var tableau = p.duo.map(function (j, i) {
          var actif = i === q;
          return '<div style="flex:1;padding:9px;border-radius:11px;background:' + (actif ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.03)')
            + ';border:1px solid ' + (actif ? 'rgba(34,197,94,0.45)' : 'rgba(255,255,255,0.08)') + ';">'
            + '<div style="font-size:0.74em;font-weight:800;color:' + (actif ? '#4ade80' : '#94a3b8') + ';">' + esc(j.nom) + '</div>'
            + '<div style="font-size:1.2em;font-weight:900;color:#fff;">' + p.scores[i] + '</div>'
            + '<div style="font-size:0.58em;color:#64748b;">' + Math.max(3, Math.round(p.base * j.coef)) + ' reps/tour</div></div>';
        }).join('');
        return '<div style="display:flex;gap:8px;margin-bottom:12px;">' + tableau + '</div>'
          + '<div style="font-size:0.62em;color:#7dd3fc;background:rgba(56,189,248,0.08);border-radius:8px;padding:5px 9px;margin-bottom:12px;">⚖️ Les répétitions sont ajustées au niveau de chacun — la victoire reste ouverte.</div>'
          + sousTitre('AU TOUR DE ' + esc(p.duo[q].nom).toUpperCase())
          + gros(e, reps, 'reps')
          + bouton('AwakGamesValider()', 'Tour terminé ✓');
      },
      apres: function (p) { p.scores[(p.pas - 1) % 2]++; }
    },

    // 🤝 RELAIS — un volume commun à écouler ensemble
    relais: {
      exos: function () { return 2; },
      idx: function (p) { return Math.floor(p.pas / 2) % p.exercices.length; },
      prepare: function (p) { p.duo = duoJoueurs(); p.parTour = 15; p.cumul = 0; },
      total: function (p) { return Math.ceil(p.reglage / p.parTour); },
      etape: function (p) {
        return { nom: nomEx(p.exercices[Math.floor(p.pas / 2) % p.exercices.length]),
                 valeur: p.parTour, unite: 'reps' };
      },
      corps: function (p) {
        var q = p.pas % 2, e = p.exercices[Math.floor(p.pas / 2) % p.exercices.length];
        var pct = Math.min(100, Math.round((p.cumul / p.reglage) * 100));
        return '<div style="background:rgba(255,255,255,0.04);border-radius:12px;padding:11px;margin-bottom:12px;">'
          +   '<div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px;">'
          +     '<span style="font-size:1.3em;font-weight:900;color:#4ade80;">' + p.cumul + '</span>'
          +     '<span style="font-size:0.74em;color:#94a3b8;">/ ' + p.reglage + ' reps ensemble</span></div>'
          +   '<div style="height:8px;background:rgba(255,255,255,0.07);border-radius:5px;overflow:hidden;">'
          +     '<div style="height:100%;width:' + pct + '%;background:linear-gradient(90deg,#3b82f6,#1d5fa8);transition:width 0.3s;"></div></div>'
          + '</div>'
          + sousTitre('AU TOUR DE ' + esc(p.duo[q].nom).toUpperCase())
          + gros(e, p.parTour, 'reps')
          + bouton('AwakGamesValider()', 'Passé au suivant ✓');
      },
      apres: function (p) { p.cumul += p.parTour; }
    },

    // 🪞 MIROIR — même exercice, en même temps
    miroir: {
      exos: function () { return 4; },
      idx: function (p) { return p.pas % p.exercices.length; },
      prepare: function (p) { p.duo = duoJoueurs(); },
      total: function (p) { return p.reglage; },
      etape: function (p) { return { nom: nomEx(p.exercices[p.pas % p.exercices.length]), valeur: 12, unite: 'reps' }; },
      corps: function (p) {
        var e = p.exercices[p.pas % p.exercices.length];
        return '<div style="display:flex;gap:8px;margin-bottom:12px;">'
          + p.duo.map(function (j) {
              return '<div style="flex:1;padding:8px;border-radius:11px;background:rgba(34,197,94,0.12);border:1px solid rgba(34,197,94,0.3);">'
                + '<div style="font-size:0.76em;font-weight:800;color:#4ade80;">' + esc(j.nom) + '</div></div>';
            }).join('')
          + '</div>'
          + sousTitre('TOUR ' + (p.pas + 1) + ' / ' + p.reglage + ' · ENSEMBLE')
          + gros(e, 12, 'reps chacun, en même temps')
          + bouton('AwakGamesValider()', 'Tous les deux terminé ✓');
      }
    },

    // 🧩 CHIPPER PARTAGÉ — la liste répartie entre les deux
    partage: {
      exos: function (g, reglage) { return reglage; },
      idx: function (p) { return p.pas; },
      prepare: function (p) { p.duo = duoJoueurs(); },
      total: function (p) { return p.exercices.length; },
      etape: function (p) { return { nom: nomEx(p.exercices[p.pas]), valeur: 12 + p.pas, unite: 'reps' }; },
      corps: function (p) {
        var q = p.pas % 2, e = p.exercices[p.pas];
        var restants = p.exercices.slice(p.pas + 1, p.pas + 4).map(function (x, i) {
          var pour = p.duo[(p.pas + 1 + i) % 2].nom;
          return '<div style="display:flex;justify-content:space-between;font-size:0.68em;color:#64748b;padding:2px 0;">'
            + '<span>' + esc(nomEx(x)) + '</span><span>' + esc(pour) + '</span></div>';
        }).join('');
        return sousTitre('ÉTAPE ' + (p.pas + 1) + ' / ' + p.exercices.length + ' · POUR ' + esc(p.duo[q].nom).toUpperCase())
          + gros(e, 12 + p.pas, 'reps')
          + (restants ? encart('ENSUITE', restants) : '')
          + bouton('AwakGamesValider()', 'Terminé ✓');
      }
    },

    // 👑 ROI DE LA COLLINE — le gagnant choisit l'exercice suivant
    roi: {
      exos: function () { return 4; },
      idx: function (p) { return p.choix || 0; },
      prepare: function (p) { p.duo = duoJoueurs(); p.scores = [0, 0]; p.choix = 0; p.roi = null; },
      total: function (p) { return p.reglage; },
      etape: function (p) { return { nom: nomEx(p.exercices[p.choix || 0]), valeur: 12, unite: 'reps' }; },
      corps: function (p) {
        var e = p.exercices[p.choix || 0];
        var tableau = p.duo.map(function (j, i) {
          var estRoi = p.roi === i;
          return '<div style="flex:1;padding:9px;border-radius:11px;background:' + (estRoi ? 'rgba(251,191,36,0.15)' : 'rgba(255,255,255,0.03)')
            + ';border:1px solid ' + (estRoi ? 'rgba(251,191,36,0.45)' : 'rgba(255,255,255,0.08)') + ';">'
            + '<div style="font-size:0.74em;font-weight:800;color:' + (estRoi ? '#fbbf24' : '#94a3b8') + ';">' + (estRoi ? '👑 ' : '') + esc(j.nom) + '</div>'
            + '<div style="font-size:1.2em;font-weight:900;color:#fff;">' + p.scores[i] + '</div></div>';
        }).join('');
        // Le critère dépend de la nature de l'exercice : course à la répétition,
        // ou tenue la plus longue s'il s'agit d'un isométrique.
        var tenue = estTenue(e);
        var regle = tenue
          ? '🏁 Départ ensemble — celui qui <b>tient le plus longtemps</b> remporte le tour.'
          : '🏁 Départ ensemble — le <b>premier à boucler ses répétitions</b> remporte le tour.';
        return '<div style="display:flex;gap:8px;margin-bottom:12px;">' + tableau + '</div>'
          + sousTitre('TOUR ' + (p.pas + 1) + ' / ' + p.reglage)
          + '<div style="font-size:0.7em;color:#fbbf24;background:rgba(251,191,36,0.08);border:1px solid rgba(251,191,36,0.22);border-radius:9px;padding:7px 10px;margin-bottom:12px;line-height:1.4;">' + regle + '</div>'
          + gros(e, 12, tenue ? 'reps' : 'reps chacun')
          + '<div style="font-size:0.68em;color:#94a3b8;margin-bottom:8px;">Qui a remporté ce tour ?</div>'
          + '<div style="display:flex;gap:8px;">'
          +   p.duo.map(function (j, i) {
                return '<button onclick="AwakGamesRoiGagnant(' + i + ')" style="flex:1;padding:12px 6px;border:none;border-radius:12px;cursor:pointer;background:linear-gradient(135deg,#fbbf24,#d97706);color:#3b2606;font-weight:900;font-size:0.82em;">' + esc(j.nom) + '</button>';
              }).join('')
          + '</div>';
      }
    },

    // 🧱 DUEL DE GAINAGE — l'un tient, l'autre enchaîne
    gainage: {
      exos: function () { return 2; },
      idx: function (p) { return 1; },
      chrono: 40,
      prepare: function (p) { p.duo = duoJoueurs(); },
      total: function (p) { return p.reglage * 2; },
      etape: function (p) { return { nom: nomEx(p.exercices[1]), valeur: 15, unite: 'reps' }; },
      corps: function (p) {
        var q = p.pas % 2;
        var tient = p.duo[q].nom, bouge = p.duo[1 - q].nom;
        return '<div style="display:flex;gap:8px;margin-bottom:12px;">'
          +   '<div style="flex:1;padding:9px;border-radius:11px;background:rgba(168,85,247,0.14);border:1px solid rgba(168,85,247,0.35);">'
          +     '<div style="font-size:0.58em;color:#c4b5fd;font-weight:800;letter-spacing:1px;">TIENT LA PLANCHE</div>'
          +     '<div style="font-size:0.88em;font-weight:900;color:#fff;">' + esc(tient) + '</div></div>'
          +   '<div style="flex:1;padding:9px;border-radius:11px;background:rgba(34,197,94,0.14);border:1px solid rgba(34,197,94,0.35);">'
          +     '<div style="font-size:0.58em;color:#4ade80;font-weight:800;letter-spacing:1px;">ENCHAÎNE</div>'
          +     '<div style="font-size:0.88em;font-weight:900;color:#fff;">' + esc(bouge) + '</div></div>'
          + '</div>'
          + blocChrono()
          + gros(p.exercices[1], 15, 'reps pendant que l\'autre tient')
          + bouton('AwakGamesValider()', 'Échanger les rôles ✓');
      }
    },

    // 🔄⚔️ Alternance à deux
    alternance: {
      exos: function () { return 3; },
      idx: function (p) { return Math.floor(p.pas / 2) % p.exercices.length; },
      prepare: function (p) {
        p.joueurs = nomsJoueurs();
        p.scores = [0, 0];
      },
      total: function (p) { return p.jeu.course ? p.reglage * 2 : p.reglage; },
      etape: function (p) {
        var e = p.exercices[Math.floor(p.pas / 2) % p.exercices.length];
        return { nom: nomEx(e), valeur: 10, unite: 'reps' };
      },
      corps: function (p) {
        var qui = p.pas % 2;
        var e = p.exercices[Math.floor(p.pas / 2) % p.exercices.length];
        var tableau = p.joueurs.map(function (n, i) {
          var actif = i === qui;
          return '<div style="flex:1;padding:9px;border-radius:11px;background:' + (actif ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.03)')
            + ';border:1px solid ' + (actif ? 'rgba(34,197,94,0.45)' : 'rgba(255,255,255,0.08)') + ';">'
            + '<div style="font-size:0.74em;font-weight:800;color:' + (actif ? '#4ade80' : '#94a3b8') + ';">' + esc(n) + '</div>'
            + '<div style="font-size:1.2em;font-weight:900;color:#fff;">' + p.scores[i] + '</div></div>';
        }).join('');
        return '<div style="display:flex;gap:8px;margin-bottom:14px;">' + tableau + '</div>'
          + sousTitre('AU TOUR DE ' + esc(p.joueurs[qui]).toUpperCase())
          + gros(e, 10, 'reps')
          + bouton('AwakGamesValider()', 'Tour terminé ✓');
      },
      apres: function (p) { p.scores[(p.pas - 1) % 2]++; }
    }
  };

  // ── PETITS ASSEMBLAGES D'AFFICHAGE ─────────────────────────────────
  function melange(a) {
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
  }
  function sousTitre(t) {
    return '<div style="font-size:0.62em;color:#94a3b8;font-weight:800;letter-spacing:1.5px;margin-bottom:5px;">' + t + '</div>';
  }
  // Source de l'image d'un exercice (mapping partagé avec le reste de l'app).
  function srcImage(ex) {
    if (!ex || !window.EXERCISE_IMAGES) return null;
    var M = window.EXERCISE_IMAGES;
    var base = ex._baseName || ex.name;
    return M[base] || M[ex.name] || null;
  }

  // Vignette d'illustration ; renvoie '' si l'exercice n'a pas d'image.
  function visuel(ex, hauteur) {
    var src = srcImage(ex);
    if (!src) return '';
    var h = hauteur || 140;
    // Les images d'exercices sont carrées ou verticales, alors que le cadre est
    // large : un recadrage « cover » n'en montrerait qu'une bande. On affiche
    // donc l'image ENTIÈRE (contain), centrée sur un fond sombre.
    // buildLazyImg applique déjà width/height:100% + object-fit:contain :
    // on ne lui impose rien de plus, sous peine de casser le dimensionnement.
    var img = (typeof window.buildLazyImg === 'function')
      ? window.buildLazyImg(src, ex.name)
      : '<img src="' + esc(src) + '" alt="" loading="lazy" style="width:100%;height:100%;object-fit:contain;display:block;"/>';
    // Hauteur pilotée par CSS (classe .awak-jeu-img) : grande sur un écran
    // normal, réduite sur les petits téléphones pour que le bouton d'action
    // reste visible sans défilement.
    return '<div class="awak-jeu-img" style="width:100%;border-radius:14px;overflow:hidden;margin-bottom:12px;background:#0a0e18;'
      + (hauteur ? 'height:' + hauteur + 'px;' : '') + '">' + img + '</div>';
  }

  // Petite vignette carrée pour les listes de correspondances.
  function pastilleImg(ex, taille) {
    var src = srcImage(ex);
    var t = taille || 30;
    if (!src) return '<div style="width:' + t + 'px;height:' + t + 'px;border-radius:7px;background:rgba(255,255,255,0.06);flex-shrink:0;"></div>';
    return '<div style="width:' + t + 'px;height:' + t + 'px;border-radius:7px;overflow:hidden;flex-shrink:0;background:#0a0e18;">'
      + '<img src="' + esc(src) + '" alt="" loading="lazy" style="width:100%;height:100%;object-fit:cover;display:block;"/></div>';
  }

  function gros(ex, val, unite) {
    var nom = typeof ex === 'string' ? ex : nomEx(ex);
    var img = typeof ex === 'string' ? '' : visuel(ex);
    // Un exercice à tenir s'exprime en secondes : on adapte valeur ET libellé.
    if (typeof ex !== 'string' && estTenue(ex) && /rep/i.test(unite || '')) {
      var ef = effortPour(ex, val);
      val = ef.valeur;
      unite = (unite || '').replace(/^\s*reps?/i, ef.unite).replace(/reps/i, ef.unite);
      if (!/seconde/i.test(unite)) unite = ef.unite;
    }
    return img
      + '<div style="font-size:1.05em;font-weight:900;color:#fff;margin-bottom:3px;">' + esc(nom) + '</div>'
      + '<div style="font-size:2.2em;font-weight:900;color:#4ade80;line-height:1;">' + val + '</div>'
      + '<div style="font-size:0.75em;color:#94a3b8;margin-bottom:16px;">' + esc(unite) + '</div>';
  }
  function bouton(fn, txt, cyan) {
    var fond = cyan ? 'linear-gradient(135deg,#22d3ee,#0891b2);color:#032027' : 'linear-gradient(135deg,#3b82f6,#1d5fa8);color:#fff';
    return '<button onclick="' + fn + '" style="width:100%;padding:15px;border:none;border-radius:12px;cursor:pointer;background:' + fond + ';font-weight:900;font-size:0.95em;">' + txt + '</button>';
  }
  function encart(titre, contenu) {
    return '<div style="background:rgba(255,255,255,0.04);border-radius:14px;padding:13px 15px;margin-bottom:16px;text-align:left;">'
      + '<div style="font-size:0.6em;color:#94a3b8;font-weight:800;letter-spacing:1px;margin-bottom:7px;">' + titre + '</div>' + contenu + '</div>';
  }
  // Le joueur 1 est TOUJOURS le profil actif — jamais le premier du registre.
  // Le joueur 2 vient, par ordre de préférence : des participants choisis pour
  // la séance de groupe, puis d'un proche lié dans l'onglet Famille, puis d'un
  // autre profil de l'appareil.
  function nomsJoueurs() {
    var moi = 'Moi', partenaire = 'Partenaire';
    var monId = null;

    try {
      if (typeof window.getCurrentProfileId === 'function') monId = window.getCurrentProfileId();
      if (typeof window.getCurrentProfile === 'function') {
        var p = window.getCurrentProfile();
        if (p && p.name) moi = p.name;
      }
    } catch (e) {}

    // 1) Participants explicitement choisis pour la séance de groupe
    try {
      if (window.AwakGroup && typeof window.AwakGroup.getParticipants === 'function') {
        var parts = window.AwakGroup.getParticipants() || [];
        var autre = null;
        for (var i = 0; i < parts.length; i++) {
          if (parts[i] && parts[i].id !== monId && parts[i].name) { autre = parts[i].name; break; }
        }
        if (autre) return [moi, autre];
      }
    } catch (e) {}

    // 2) Un proche lié dans l'onglet Famille
    try {
      if (window.AwakFamily && typeof window.AwakFamily.myRelations === 'function') {
        var rels = window.AwakFamily.myRelations() || [];
        for (var j = 0; j < rels.length; j++) {
          var m = rels[j] && rels[j].member;
          if (m && m.id !== monId && m.name) return [moi, m.name];
        }
      }
    } catch (e) {}

    // 3) Un autre profil de l'appareil
    try {
      if (typeof window.getAllProfiles === 'function') {
        var ps = window.getAllProfiles() || [];
        for (var k = 0; k < ps.length; k++) {
          if (ps[k] && ps[k].id !== monId && ps[k].name) return [moi, ps[k].name];
        }
      }
    } catch (e) {}

    return [moi, partenaire];
  }

  // ── COMBIEN D'EXERCICES SELON LE NIVEAU ────────────────────────────
  var NIVEAUX = [
    { id: 'beginner',     nom: 'Débutant' },
    { id: 'intermediate', nom: 'Intermédiaire' },
    { id: 'advanced',     nom: 'Avancé' }
  ];
  function compteParNiveau() {
    var actuel = 'intermediate';
    try { actuel = (typeof window.getUserProfile === 'function' && (window.getUserProfile() || {}).level) || 'intermediate'; }
    catch (e) {}
    var i = 0;
    NIVEAUX.forEach(function (n, k) { if (n.id === actuel) i = k; });
    if (i >= NIVEAUX.length - 1) return null;          // déjà au palier le plus large
    var maintenant = pool(null, NIVEAUX[i].id).length;
    var apres      = pool(null, NIVEAUX[i + 1].id).length;
    if (apres - maintenant < 5) return null;           // gain négligeable : on se tait
    return { nomActuel: NIVEAUX[i].nom, nomSuivant: NIVEAUX[i + 1].nom,
             actuel: maintenant, gain: apres - maintenant };
  }

  // ── RECORDS PERSONNELS ─────────────────────────────────────────────
  function cleRecords() {
    var id = null;
    try { id = (typeof window.getCurrentProfileId === 'function') ? window.getCurrentProfileId() : null; } catch (e) {}
    return id ? ('awakGameRecords_' + id) : 'awakGameRecords';
  }
  function records() {
    try { return JSON.parse(localStorage.getItem(cleRecords()) || '{}') || {}; }
    catch (e) { return {}; }
  }
  function majRecord(gameId, valeur) {
    var r = records();
    var ancien = r[gameId] || 0;
    if (valeur > ancien) {
      r[gameId] = valeur;
      try { localStorage.setItem(cleRecords(), JSON.stringify(r)); } catch (e) {}
      return true;
    }
    return false;
  }

  // ── CHRONOMÈTRE (jeux à la minute) ─────────────────────────────────
  var chrono = null;
  function arreterChrono() {
    if (chrono && chrono.timer) clearInterval(chrono.timer);
    chrono = null;
  }
  function lancerChrono(secondes) {
    arreterChrono();
    chrono = { restant: secondes, timer: null };
    majAffichageChrono();
    chrono.timer = setInterval(function () {
      if (!chrono) return;
      chrono.restant--;
      majAffichageChrono();
      if (chrono.restant <= 0) {
        arreterChrono();
        try { if (navigator.vibrate) navigator.vibrate([120, 60, 120]); } catch (e) {}
        var el = document.getElementById('awakChrono');
        if (el) { el.textContent = 'Temps !'; el.style.color = '#f87171'; }
      }
    }, 1000);
  }
  function majAffichageChrono() {
    var el = document.getElementById('awakChrono');
    if (!el || !chrono) return;
    var m = Math.floor(chrono.restant / 60), s = chrono.restant % 60;
    el.textContent = m + ':' + (s < 10 ? '0' : '') + s;
    el.style.color = chrono.restant <= 10 ? '#fbbf24' : '#4ade80';
  }
  function blocChrono() {
    return '<div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.10);border-radius:12px;padding:9px;margin-bottom:14px;">'
      + '<div style="font-size:0.56em;color:#64748b;font-weight:800;letter-spacing:1.5px;">TEMPS RESTANT</div>'
      + '<div id="awakChrono" style="font-size:1.7em;font-weight:900;color:#4ade80;line-height:1.1;">1:00</div></div>';
  }

  // ── PROFILS DES DEUX JOUEURS (avec coefficient d'effort) ───────────
  // L'Égalisateur adapte les répétitions au niveau de chacun : un débutant de
  // 10 ans et un adulte entraîné peuvent alors réellement se disputer la
  // victoire. Coefficient plus bas = moins de répétitions demandées.
  function coefNiveau(niveau, categorieAge) {
    var c = niveau === 'advanced' ? 1 : niveau === 'intermediate' ? 0.75 : 0.55;
    if (categorieAge === 'enfant' || categorieAge === 'child') c *= 0.6;
    else if (categorieAge === 'senior') c *= 0.7;
    return Math.max(0.35, Math.round(c * 100) / 100);
  }
  function infosJoueur(profileId, nomRepli) {
    var nom = nomRepli || 'Joueur', niveau = 'beginner', age = null;
    try {
      if (profileId && typeof window.getProfileData === 'function') {
        var raw = window.getProfileData(profileId, 'userProfile');
        if (raw) {
          var up = JSON.parse(raw);
          if (up && up.level) niveau = up.level;
          if (up && up.name) nom = up.name;
        }
      }
      if (profileId && window.AwakYouth && typeof window.AwakYouth.ageCategoryOf === 'function') {
        age = window.AwakYouth.ageCategoryOf(profileId);
      }
    } catch (e) {}
    return { id: profileId, nom: nomRepli || nom, coef: coefNiveau(niveau, age) };
  }
  // Renvoie [{id, nom, coef}, {id, nom, coef}] — le profil ACTIF en premier.
  function duoJoueurs() {
    var monId = null;
    try { if (typeof window.getCurrentProfileId === 'function') monId = window.getCurrentProfileId(); } catch (e) {}
    var noms = nomsJoueurs();
    var autreId = null;
    try {
      if (window.AwakGroup && typeof window.AwakGroup.getParticipants === 'function') {
        var parts = window.AwakGroup.getParticipants() || [];
        for (var i = 0; i < parts.length; i++) if (parts[i] && parts[i].id !== monId) { autreId = parts[i].id; break; }
      }
      if (!autreId && typeof window.getAllProfiles === 'function') {
        var ps = window.getAllProfiles() || [];
        for (var k = 0; k < ps.length; k++) if (ps[k] && ps[k].id !== monId) { autreId = ps[k].id; break; }
      }
    } catch (e) {}
    return [infosJoueur(monId, noms[0]), infosJoueur(autreId, noms[1])];
  }

  // ── DÉROULEMENT D'UNE PARTIE ───────────────────────────────────────
  var partie = null;

  function demarrer(gameId, reglage) {
    var g = GAMES[gameId];
    if (!g) return;
    if (g.mecanique === 'grille') return ouvrirBingo();

    var m = MECANIQUES[g.mecanique];
    if (!m) return;
    reglage = reglage || g.defaut;

    var nb = m.exos(g, reglage);
    // Pour un jeu à deux, on identifie les participants AVANT de constituer le
    // pool, afin que les protections (âge, niveau) couvrent les deux joueurs.
    var _ids = null;
    if (g.duo) {
      try { _ids = duoJoueurs().map(function (j) { return j.id; }); } catch (e) { _ids = null; }
    }
    var ex = pool(nb, null, _ids);
    if (!ex.length) {
      if (typeof window.showToast === 'function') window.showToast('Aucun exercice disponible avec tes réglages actuels', 'warning', 3000);
      return;
    }
    partie = { id: gameId, jeu: g, meca: m, reglage: reglage, exercices: ex,
               debut: Date.now(), pas: 0, fini: false, journal: [] };
    m.prepare(partie);
    // Normalisation : les mécaniques à deux stockent leurs joueurs soit dans
    // `joueurs` (noms), soit dans `duo` (objets). L'écran de fin n'en connaît
    // qu'une — on dérive l'autre ici plutôt que dans chaque mécanique.
    if (!partie.joueurs && partie.duo) {
      partie.joueurs = partie.duo.map(function (j) { return j.nom; });
    }
    afficher();
  }

  window.AwakGamesTirer = function () {
    if (!partie) return;
    if (partie.jeu.mecanique === 'tirage') {
      if (partie.pas >= partie.paquet.length) return;
      partie.carte = partie.paquet[partie.pas];
    } else if (partie.jeu.mecanique === 'des') {
      partie.lance = { a: 1 + Math.floor(Math.random() * 6), b: 1 + Math.floor(Math.random() * 6) };
    }
    afficher();
  };

  window.AwakGamesValider = function () {
    if (!partie) return;
    var et = partie.meca.etape(partie);
    if (et) {
      // Le récapitulatif doit refléter l'effort réel : secondes pour une tenue.
      var exCourant = (partie.meca.idx && partie.exercices) ? partie.exercices[partie.meca.idx(partie)] : null;
      var ef = exCourant ? effortPour(exCourant, et.valeur) : { valeur: et.valeur, unite: 'reps' };
      partie.journal.push({ nom: et.nom, reps: ef.valeur, unite: ef.unite });
    }
    partie.carte = null; partie.lance = null;
    partie.pas++;
    if (partie.meca.apres) partie.meca.apres(partie);
    if (partie.pas >= partie.meca.total(partie)) return terminer();
    afficher();
  };

  // Remplace l'exercice courant par un autre du pool (même filtres).
  window.AwakGamesEchanger = function () {
    if (!partie || !partie.meca.idx) return;
    var i = partie.meca.idx(partie);
    if (i < 0) return;
    var dejaLa = partie.exercices.map(function (e) { return e && e.name; });
    var candidats = pool().filter(function (e) { return dejaLa.indexOf(e.name) === -1; });
    if (!candidats.length) return;
    partie.exercices[i] = candidats[0];
    afficher();
    if (typeof window.showToast === 'function') window.showToast('🔀 Exercice remplacé', 'info', 1600);
  };

  // 👑 Roi de la colline : le vainqueur du tour choisit l'exercice suivant.
  window.AwakGamesRoiGagnant = function (i) {
    if (!partie || partie.jeu.mecanique !== 'roi') return;
    partie.scores[i]++;
    partie.roi = i;
    partie.choix = Math.floor(Math.random() * partie.exercices.length);
    window.AwakGamesValider();
  };

  window.AwakGamesAbandonner = function () {
    if (!partie) return;
    if (partie.journal.length) return terminer();
    fermer();
  };

  function terminer() {
    if (!partie || partie.fini) return;
    partie.fini = true;
    arreterChrono();
    // Record = nombre d'étapes tenues (minutes pour les jeux au chrono).
    partie.record = majRecord(partie.id, partie.pas);
    partie.score = partie.pas;

    // 🏅 Badge « À deux c'est mieux » — seuls les jeux marqués duo comptent.
    // On se fie au drapeau du JEU (partie.jeu.duo), pas au nombre de joueurs
    // saisi : c'est la seule donnée fiable ici.
    try {
      if (partie.jeu && partie.jeu.duo && typeof window.AwakFamBadgeInc === 'function') {
        window.AwakFamBadgeInc('seancesDuo', 1);
      }
    } catch (e) {}
    var minutes = Math.max(1, Math.round((Date.now() - partie.debut) / 60000));
    var totalReps = partie.journal.reduce(function (s, x) { return s + (x.reps || 0); }, 0);
    try {
      if (typeof window.saveWorkoutToHistory === 'function') {
        var noms = {};
        partie.journal.forEach(function (x) { noms[x.nom] = true; });
        window.saveWorkoutToHistory({
          name: partie.jeu.emoji + ' ' + partie.jeu.name,
          exercises: Object.keys(noms).map(function (n) { return { name: n }; }),
          muscles: []
        }, minutes);
      }
    } catch (e) {}
    afficherFin(minutes, totalReps);
  }

  function afficherFin(minutes, totalReps) {
    var host = overlay();
    var extra = '';
    if (partie.scores) {
      var j = partie.joueurs, s = partie.scores;
      var gagnant = s[0] === s[1] ? 'Égalité !' : (s[0] > s[1] ? j[0] : j[1]) + ' l\'emporte';
      extra = '<div style="background:rgba(251,191,36,0.1);border:1px solid rgba(251,191,36,0.3);border-radius:12px;padding:11px;margin-bottom:14px;">'
        + '<div style="font-size:0.9em;font-weight:900;color:#fbbf24;">🏆 ' + esc(gagnant) + '</div>'
        + '<div style="font-size:0.76em;color:#cbd5e1;margin-top:3px;">' + esc(j[0]) + ' ' + s[0] + ' — ' + s[1] + ' ' + esc(j[1]) + '</div></div>';
    }
    var lignes = partie.journal.slice(-8).map(function (x) {
      var suffixe = (x.unite && /seconde/i.test(x.unite)) ? 's' : '';
      return '<div style="display:flex;justify-content:space-between;font-size:0.8em;color:#cbd5e1;padding:3px 0;">'
        + '<span>' + esc(x.nom) + '</span><b style="color:#4ade80;">' + x.reps + suffixe + '</b></div>';
    }).join('');
    host.innerHTML = panneau(
      '<div style="font-size:2.6em;margin-bottom:6px;">🏁</div>'
      + '<div style="font-size:1.2em;font-weight:900;color:#fff;margin-bottom:4px;">Partie terminée</div>'
      + '<div style="font-size:0.82em;color:#94a3b8;margin-bottom:14px;">' + esc(partie.jeu.name) + '</div>'
      + (partie.record
          ? '<div style="background:rgba(251,191,36,0.12);border:1px solid rgba(251,191,36,0.35);border-radius:12px;padding:10px;margin-bottom:14px;font-size:0.86em;font-weight:900;color:#fbbf24;">⭐ Nouveau record : ' + partie.score + ' étapes</div>'
          : (records()[partie.id] ? '<div style="font-size:0.74em;color:#64748b;margin-bottom:14px;">Ton record : ' + records()[partie.id] + ' étapes</div>' : ''))
      + extra
      + '<div style="display:flex;gap:10px;margin-bottom:16px;">'
      +   stat(totalReps, 'RÉPÉTITIONS', '#4ade80') + stat(minutes, 'MINUTES', '#fff')
      + '</div>'
      + (lignes ? '<div style="text-align:left;background:rgba(255,255,255,0.03);border-radius:12px;padding:11px 13px;margin-bottom:16px;max-height:160px;overflow-y:auto;">' + lignes + '</div>' : '')
      + bouton('AwakGamesFermer()', 'Terminer 💪'));
  }

  function stat(v, l, c) {
    return '<div style="flex:1;background:rgba(255,255,255,0.04);border-radius:12px;padding:11px;">'
      + '<div style="font-size:1.5em;font-weight:900;color:' + c + ';">' + v + '</div>'
      + '<div style="font-size:0.58em;color:#94a3b8;font-weight:800;letter-spacing:1px;">' + l + '</div></div>';
  }

  window.AwakGamesFermer = function () { fermer(); };
  function fermer() {
    arreterChrono();
    partie = null;
    var el = document.getElementById('awakGameOverlay'); if (el) el.remove();
    try { if (typeof window.updateHomeStats === 'function') window.updateHomeStats(); } catch (e) {}
  }

  function overlay() {
    // 🧹 Un jeu qui démarre ferme les sélecteurs restés ouverts derrière lui.
    // ⚠️ On NE ferme PAS awakGameOverlay lui-même : c'est l'écran du jeu en
    // cours, réutilisé d'un exercice à l'autre.
    try { if (window.AwakFamCloseAll) window.AwakFamCloseAll('awakGameOverlay'); } catch (e) {}
    var host = document.getElementById('awakGameOverlay');
    if (!host) {
      host = document.createElement('div');
      host.id = 'awakGameOverlay';
      host.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.88);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);z-index:100000;display:flex;align-items:center;justify-content:center;padding:20px;';
      document.body.appendChild(host);
    }
    return host;
  }
  function panneau(contenu, large) {
    return '<div style="background:linear-gradient(160deg,#171922,#0d0d12);border:1px solid rgba(255,255,255,0.10);border-radius:22px;padding:24px;max-width:' + (large || 400) + 'px;width:100%;text-align:center;max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,0.6);">' + contenu + '</div>';
  }

  function afficher() {
    var g = partie.jeu, m = partie.meca;
    var total = m.total(partie), pct = total ? Math.round((partie.pas / total) * 100) : 0;
    overlay().innerHTML = panneau(
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">'
      +   '<div style="font-size:0.8em;font-weight:900;color:#fff;">' + g.emoji + ' ' + esc(g.name) + '</div>'
      +   '<div style="font-size:0.72em;color:#94a3b8;">reste ' + Math.max(0, total - partie.pas) + '</div>'
      + '</div>'
      + '<div style="height:6px;background:rgba(255,255,255,0.07);border-radius:4px;overflow:hidden;margin-bottom:18px;">'
      +   '<div style="height:100%;width:' + pct + '%;background:linear-gradient(90deg,#3b82f6,#1d5fa8);transition:width 0.35s;"></div>'
      + '</div>'
      + m.corps(partie)
      + (m.idx && m.idx(partie) >= 0
          ? '<button onclick="AwakGamesEchanger()" style="width:100%;margin-top:8px;padding:10px;border:none;border-radius:11px;cursor:pointer;background:rgba(56,189,248,0.10);border:1px solid rgba(56,189,248,0.28);color:#7dd3fc;font-weight:800;font-size:0.78em;">🔀 Changer d\'exercice</button>'
          : '')
      + '<button onclick="AwakGamesAbandonner()" style="width:100%;margin-top:9px;padding:10px;border:none;border-radius:11px;cursor:pointer;background:rgba(255,255,255,0.05);color:#94a3b8;font-weight:700;font-size:0.78em;">'
      + (partie.journal.length ? 'Arrêter ici' : 'Annuler') + '</button>');

    // Les jeux à la minute relancent un décompte à chaque étape.
    if (m.chrono) lancerChrono(m.chrono); else arreterChrono();
  }

  // ── 🎯 BINGO : grille hebdomadaire (hors partie) ────────────────────
  var BINGO_KEY = 'awakBingoGrille';

  function semaineCourante() {
    var d = new Date();
    var jeudi = new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7) + 3);
    var debut = new Date(jeudi.getFullYear(), 0, 4);
    var sem = 1 + Math.round(((jeudi - debut) / 86400000 - 3 + ((debut.getDay() + 6) % 7)) / 7);
    return jeudi.getFullYear() + '-S' + sem;
  }

  var DEFIS = [
    'Une séance avant 9 h', 'Une séance de plus de 30 min', '100 répétitions au total',
    'Trois jours d\'affilée', 'Un exercice jamais essayé', 'Une séance sans matériel',
    'Un étirement de 5 min', '50 squats dans la journée', 'Une séance à deux',
    'Terminer une séance complète', 'Un jeu d\'entraînement', 'Battre un record personnel'
  ];

  function chargerBingo() {
    var g = null;
    try { g = JSON.parse(localStorage.getItem(BINGO_KEY) || 'null'); } catch (e) {}
    if (!g || g.semaine !== semaineCourante()) {
      var d = DEFIS.slice(); melange(d);
      g = { semaine: semaineCourante(), cases: d.slice(0, 9).map(function (t) { return { t: t, fait: false }; }) };
      try { localStorage.setItem(BINGO_KEY, JSON.stringify(g)); } catch (e) {}
    }
    return g;
  }

  window.AwakGamesBingoCocher = function (i) {
    var g = chargerBingo();
    if (!g.cases[i]) return;
    g.cases[i].fait = !g.cases[i].fait;
    try { localStorage.setItem(BINGO_KEY, JSON.stringify(g)); } catch (e) {}
    ouvrirBingo();
  };

  function ouvrirBingo() {
    var g = chargerBingo();
    var faits = g.cases.filter(function (c) { return c.fait; }).length;
    var cases = g.cases.map(function (c, i) {
      return '<button onclick="AwakGamesBingoCocher(' + i + ')" style="aspect-ratio:1;padding:8px 6px;border-radius:12px;cursor:pointer;'
        + 'border:1px solid ' + (c.fait ? 'rgba(34,197,94,0.5)' : 'rgba(255,255,255,0.10)') + ';'
        + 'background:' + (c.fait ? 'rgba(34,197,94,0.16)' : 'rgba(255,255,255,0.03)') + ';'
        + 'color:' + (c.fait ? '#4ade80' : '#cbd5e1') + ';font-size:0.66em;font-weight:700;line-height:1.3;display:flex;align-items:center;justify-content:center;text-align:center;">'
        + (c.fait ? '✓ ' : '') + esc(c.t) + '</button>';
    }).join('');
    overlay().innerHTML = panneau(
      '<div style="font-size:2.2em;margin-bottom:4px;">🎯</div>'
      + '<div style="font-size:1.15em;font-weight:900;color:#fff;margin-bottom:3px;">Bingo de la semaine</div>'
      + '<div style="font-size:0.78em;color:#94a3b8;margin-bottom:14px;">' + faits + ' / 9 défis validés · la grille se renouvelle chaque lundi</div>'
      + '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-bottom:16px;">' + cases + '</div>'
      + (faits === 9 ? '<div style="background:rgba(251,191,36,0.12);border:1px solid rgba(251,191,36,0.35);border-radius:12px;padding:11px;margin-bottom:14px;font-size:0.86em;font-weight:900;color:#fbbf24;">🏆 Grille complète, bravo !</div>' : '')
      + bouton('AwakGamesFermer()', 'Fermer'), 430);
  }

  // ── ÉCRAN DE RÉGLAGE ───────────────────────────────────────────────
  window.AwakGamesOuvrir = function (gameId) {
    var g = GAMES[gameId];
    if (!g) return;
    if (g.mecanique === 'grille') return ouvrirBingo();
    var opts = g.options.map(function (o) {
      return '<button onclick="AwakGamesDemarrer(\'' + gameId + '\',' + o + ')" style="flex:1;padding:14px 6px;border-radius:12px;cursor:pointer;border:1px solid rgba(34,197,94,0.3);background:rgba(34,197,94,0.08);color:#4ade80;font-weight:900;font-size:0.95em;">' + o + '</button>';
    }).join('');
    overlay().innerHTML = panneau(
      '<div style="font-size:2.4em;margin-bottom:6px;">' + g.emoji + '</div>'
      + '<div style="font-size:1.15em;font-weight:900;color:#fff;margin-bottom:5px;">' + esc(g.name) + '</div>'
      + '<div style="font-size:0.82em;color:#94a3b8;line-height:1.5;margin-bottom:6px;">' + esc(g.desc) + '</div>'
      + (g.duo ? '<div style="display:inline-block;background:rgba(168,85,247,0.14);border:1px solid rgba(168,85,247,0.35);color:#c4b5fd;border-radius:8px;padding:3px 9px;font-size:0.68em;font-weight:800;margin-bottom:14px;">👥 À deux</div>' : '')
      + '<div style="font-size:0.62em;color:#64748b;font-weight:800;letter-spacing:1px;margin:12px 0 8px;">' + esc(g.reglage).toUpperCase() + '</div>'
      + '<div style="display:flex;gap:8px;margin-bottom:16px;">' + opts + '</div>'
      + '<button onclick="AwakGamesFermer()" style="width:100%;padding:11px;border:none;border-radius:11px;cursor:pointer;background:rgba(255,255,255,0.05);color:#94a3b8;font-weight:700;font-size:0.8em;">Annuler</button>');
  };

  window.AwakGamesDemarrer = function (gameId, reglage) { demarrer(gameId, reglage); };

  // ── SECTION DE L'ONGLET ENTRAÎNER ──────────────────────────────────
  // Construit les tuiles de jeux (réutilisé par le pop-up).
  function _gameTiles() {
    var rec = records();
    return Object.keys(GAMES).map(function (id) {
      var g = GAMES[id];
      var pastille = g.duo
        ? '<div style="position:absolute;top:7px;right:7px;background:rgba(168,85,247,0.2);border:1px solid rgba(168,85,247,0.4);color:#c4b5fd;border-radius:6px;padding:1px 5px;font-size:0.56em;font-weight:800;">👥</div>'
        : (g.hebdo ? '<div style="position:absolute;top:7px;right:7px;background:rgba(251,191,36,0.16);border:1px solid rgba(251,191,36,0.35);color:#fbbf24;border-radius:6px;padding:1px 5px;font-size:0.56em;font-weight:800;">7j</div>' : '');
      return '<button onclick="AwakGamesPick(\'' + id + '\')" style="position:relative;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.10);border-radius:14px;padding:15px 11px;cursor:pointer;text-align:center;">'
        + pastille
        + '<div style="font-size:1.7em;margin-bottom:5px;">' + g.emoji + '</div>'
        + '<div style="font-size:0.83em;font-weight:900;color:#fff;margin-bottom:3px;">' + esc(g.name) + '</div>'
        + '<div style="font-size:0.66em;color:#94a3b8;line-height:1.35;">' + esc(g.desc) + '</div>'
        + (rec[id] ? '<div style="margin-top:6px;font-size:0.62em;color:#fbbf24;font-weight:800;">⭐ ' + rec[id] + '</div>' : '')
        + '</button>';
    }).join('');
  }

  // Carte compacte sur la page : un seul bouton qui ouvre le pop-up des jeux.
  function renderSection() {
    var host = document.getElementById('workoutGamesSection');
    if (!host) return;
    var nb = Object.keys(GAMES).length;
    host.innerHTML =
      '<div class="card" style="background:linear-gradient(135deg,rgba(34,197,94,0.06) 0%,rgba(34,197,94,0.02) 100%);border:1px solid rgba(34,197,94,0.22);">'
      + '<div style="display:flex;align-items:center;gap:14px;">'
      +   '<div style="font-size:2em;flex-shrink:0;line-height:1;">🎮</div>'
      +   '<div style="flex:1;min-width:0;">'
      +     '<h2 style="margin:0 0 3px;color:#4ade80;">Jeux d\'entraînement</h2>'
      +     '<p style="margin:0;color:#94a3b8;font-size:0.82em;">' + nb + ' formats ludiques, adaptés à ton matériel et ta forme.</p>'
      +   '</div>'
      + '</div>'
      + '<button onclick="AwakGamesOpenPicker()" style="width:100%;margin-top:14px;padding:14px;background:linear-gradient(135deg,#3b82f6,#1d5fa8);border:none;border-radius:14px;color:#04140a;font-weight:900;font-size:0.95em;cursor:pointer;">Choisir un jeu ▸</button>'
      + '</div>';
  }

  // Pop-up listant tous les jeux.
  function AwakGamesOpenPicker() {
    var old = document.getElementById('awakGamesPicker');
    if (old) old.remove();
    var m = document.createElement('div');
    // 🧹 Fermer toute autre modale famille avant d'ouvrir celle-ci.
    try { if (window.AwakFamCloseAll) window.AwakFamCloseAll(); } catch (e) {}
    m.id = 'awakGamesPicker';
    m.className = 'modal active';
    // ⚠️ position:fixed + align-items:center EXPLICITES : la classe « modal »
    // ne suffisait pas — la fenêtre s'ouvrait collée en haut de l'écran.
    m.style.cssText = 'position:fixed;inset:0;z-index:11500;display:flex;'
      + 'align-items:center;justify-content:center;padding:16px;overflow-y:auto;'
      + 'background:rgba(0,0,0,0.86);backdrop-filter:blur(8px);';
    m.onclick = function (e) { if (e.target === m) m.remove(); };
    m.innerHTML =
      '<div class="modal-content" style="max-width:560px;background:linear-gradient(160deg,#0a0e18,#0F1014);border:1px solid rgba(34,197,94,0.25);">'
      + '<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:6px;">'
      +   '<h2 style="margin:0;color:#4ade80;">🎮 Jeux d\'entraînement</h2>'
      +   '<button onclick="var p=document.getElementById(\'awakGamesPicker\');if(p)p.remove();" aria-label="Fermer" style="flex-shrink:0;background:rgba(255,255,255,0.06);border:none;border-radius:10px;width:40px;height:40px;color:#94a3b8;font-size:1.3em;cursor:pointer;line-height:1;">×</button>'
      + '</div>'
      + '<p style="margin:0 0 16px;color:#94a3b8;font-size:0.84em;">Des formats ludiques pour casser la routine. Ils s\'adaptent à ton matériel et à ta forme.</p>'
      + '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(148px,1fr));gap:10px;">' + _gameTiles() + '</div>'
      + noteNiveau()
      + '</div>';
    document.body.appendChild(m);
  }

  // Sélection depuis le pop-up : fermer le pop-up puis lancer le jeu.
  function AwakGamesPick(id) {
    var p = document.getElementById('awakGamesPicker');
    if (p) p.remove();
    AwakGamesOuvrir(id);
  }
  window.AwakGamesOpenPicker = AwakGamesOpenPicker;
  window.AwakGamesPick = AwakGamesPick;

  // ── CARTE POUR L'ONGLET FAMILLE (jeux à deux) ──────────────────────
  function renderFamilyCard() {
    var duos = Object.keys(GAMES).filter(function (id) { return GAMES[id].duo; });
    if (!duos.length) return '';
    return '<div style="background:linear-gradient(160deg,#16121f,#0d0d12);border:1px solid rgba(168,85,247,0.25);border-radius:18px;padding:20px;margin-bottom:14px;">'
      + '<div style="display:flex;align-items:center;gap:12px;">'
      +   '<div style="font-size:1.8em;flex-shrink:0;line-height:1;">🎮</div>'
      +   '<div style="flex:1;min-width:0;">'
      +     '<div style="font-size:1.05em;font-weight:900;color:#fff;margin-bottom:2px;">S\'entraîner à deux</div>'
      +     '<div style="font-size:0.78em;color:#94a3b8;">' + duos.length + ' formats pour se pousser mutuellement.</div>'
      +   '</div>'
      + '</div>'
      + '<button onclick="AwakGamesOpenFamilyPicker()" style="width:100%;margin-top:14px;padding:13px;background:linear-gradient(135deg,#a855f7,#7c3aed);border:none;border-radius:13px;color:#fff;font-weight:900;font-size:0.92em;cursor:pointer;">Jouer à deux ▸</button>'
      + '</div>';
  }

  // Tuiles des jeux à deux (pour le pop-up).
  function _familyDuoTiles() {
    var duos = Object.keys(GAMES).filter(function (id) { return GAMES[id].duo; });
    var rec = records();
    return duos.map(function (id) {
      var g = GAMES[id];
      return '<button onclick="AwakGamesFamilyPick(\'' + id + '\')" style="background:rgba(255,255,255,0.03);border:1px solid rgba(168,85,247,0.28);border-radius:13px;padding:14px 10px;cursor:pointer;text-align:center;min-width:0;">'
        + '<div style="font-size:1.6em;margin-bottom:4px;">' + g.emoji + '</div>'
        + '<div style="font-size:0.82em;font-weight:900;color:#fff;">' + esc(g.name) + '</div>'
        + '<div style="font-size:0.64em;color:#94a3b8;line-height:1.3;margin-top:2px;">' + esc(g.desc) + '</div>'
        + (rec[id] ? '<div style="margin-top:5px;font-size:0.6em;color:#fbbf24;font-weight:800;">⭐ ' + rec[id] + '</div>' : '')
        + '</button>';
    }).join('');
  }

  // Pop-up des jeux à deux.
  function AwakGamesOpenFamilyPicker() {
    var old = document.getElementById('awakGamesFamilyPicker');
    if (old) old.remove();
    var m = document.createElement('div');
    // 🧹 Fermer toute autre modale famille avant d'ouvrir celle-ci.
    try { if (window.AwakFamCloseAll) window.AwakFamCloseAll(); } catch (e) {}
    m.id = 'awakGamesFamilyPicker';
    m.className = 'modal active';
    // ⚠️ position:fixed + align-items:center EXPLICITES : la classe « modal »
    // ne suffisait pas — la fenêtre s'ouvrait collée en haut de l'écran.
    m.style.cssText = 'position:fixed;inset:0;z-index:11500;display:flex;'
      + 'align-items:center;justify-content:center;padding:16px;overflow-y:auto;'
      + 'background:rgba(0,0,0,0.86);backdrop-filter:blur(8px);';
    m.onclick = function (e) { if (e.target === m) m.remove(); };
    m.innerHTML =
      '<div class="modal-content" style="max-width:560px;background:linear-gradient(160deg,#12101a,#0d0d12);border:1px solid rgba(168,85,247,0.28);">'
      + '<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:6px;">'
      +   '<h2 style="margin:0;color:#c4b5fd;">🎮 S\'entraîner à deux</h2>'
      +   '<button onclick="var p=document.getElementById(\'awakGamesFamilyPicker\');if(p)p.remove();" aria-label="Fermer" style="flex-shrink:0;background:rgba(255,255,255,0.06);border:none;border-radius:10px;width:40px;height:40px;color:#94a3b8;font-size:1.3em;cursor:pointer;line-height:1;">×</button>'
      + '</div>'
      + '<p style="margin:0 0 16px;color:#94a3b8;font-size:0.84em;">Deux formats pensés pour se pousser mutuellement.</p>'
      + '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;">' + _familyDuoTiles() + '</div>'
      + '</div>';
    document.body.appendChild(m);
  }
  function AwakGamesFamilyPick(id) {
    var p = document.getElementById('awakGamesFamilyPicker');
    if (p) p.remove();
    AwakGamesOuvrir(id);
  }
  window.AwakGamesOpenFamilyPicker = AwakGamesOpenFamilyPicker;
  window.AwakGamesFamilyPick = AwakGamesFamilyPick;

  // Explique pourquoi le choix d'exercices est limité, et ce qu'un palier
  // supérieur apporterait — sans culpabiliser ni pousser à forcer.
  function noteNiveau() {
    var c = compteParNiveau();
    if (!c) return '';
    return '<div style="margin-top:14px;padding:12px 14px;border-radius:12px;background:rgba(56,189,248,0.07);border:1px solid rgba(56,189,248,0.22);">'
      + '<div style="font-size:0.76em;color:#7dd3fc;line-height:1.5;">'
      +   '💡 <b>' + c.actuel + ' exercices</b> correspondent à ton niveau (' + esc(c.nomActuel) + '). '
      +   'Les jeux piochent uniquement dedans, pour te proposer des mouvements que tu maîtrises.'
      + '</div>'
      + '<div style="font-size:0.74em;color:#94a3b8;line-height:1.5;margin-top:6px;">'
      +   'En passant à <b style="color:#cbd5e1;">' + esc(c.nomSuivant) + '</b>, tu en débloquerais <b style="color:#4ade80;">' + c.gain + ' de plus</b> — à ne faire que si tu te sens à l\'aise avec les mouvements actuels.'
      + '</div>'
      + '<button onclick="AwakGamesOuvrirNiveau()" style="margin-top:10px;background:rgba(56,189,248,0.12);border:1px solid rgba(56,189,248,0.3);color:#7dd3fc;border-radius:10px;padding:8px 13px;font-size:0.74em;font-weight:800;cursor:pointer;">Changer mon niveau ›</button>'
      + '</div>';
  }

  window.AwakGamesOuvrirNiveau = function () {
    try {
      if (typeof window.showProfileSetup === 'function') { window.showProfileSetup(); return; }
      if (typeof window.switchTab === 'function') window.switchTab('settings');
    } catch (e) {}
  };

  window.AwakGames = {
    compteParNiveau: compteParNiveau,
    renderFamilyCard: renderFamilyCard,
    GAMES: GAMES, MECANIQUES: MECANIQUES,
    pool: pool, renderSection: renderSection, demarrer: demarrer,
    bingo: chargerBingo
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', renderSection);
  else renderSection();
})();
