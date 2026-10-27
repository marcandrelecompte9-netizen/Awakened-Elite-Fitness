// ═══════════════════════════════════════════════════════════════════════
// 👑 LE MONARQUE DU DÉCLIN — Combat final
// Un entraînement complet, très avancé (45-60 min, niveau S/SS), structuré
// en 7 actes : narration (blocs isInfo) alternée avec des blocs d'exercices.
// Débloqué après avoir vaincu les 4 sous-bosses (Les Quatre Épreuves).
// ═══════════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  const FINAL_DONE_KEY = 'awakFinalBossDefeated';

  // Bloc narratif plein écran intercalé dans la séance (réutilise isInfo).
  function story(title, lines, color, acte) {
    return {
      _acte: acte || null,   // v1479 : carte d'acte plein écran avant le texte
      name: title,
      duration: 0,
      isInfo: true,
      isFinalStory: true,
      _color: color || '#dc2626',
      image: 'images/story/nabdano.webp',   // 🖼️ l’Effaceur est visible pendant tout le combat
      // v1500 : décor derrière la conversation (repli : nabdano.webp)
      _fond: 'images/story/' + ({ 'ACTE I': 'fb_acte1', 'ACTE II': 'fb_acte2', 'ACTE III': 'fb_acte3', 'ACTE IV': 'fb_acte4', 'CLIMAX': 'fb_climax' }[acte && acte.num] || 'fb_prologue') + '.webp',
      instructions: lines
    };
  }

  // Exercice du combat final. mode 'reps' par défaut, 'timer' si durée.
  function ex(name, muscle, opts) {
    opts = opts || {};
    return {
      name: name,
      muscle: muscle,
      equipment: ['Poids du corps'],
      type: 'exercise',
      mode: opts.timer ? 'timer' : 'reps',
      duration: opts.timer || 0,
      sets: opts.sets || 1,
      targetReps: opts.reps || null,
      difficulty: 'Avancé',
      instructions: opts.instructions || [],
      tips: opts.tips || '',
      _finalBoss: true,
      _act: opts._act || null,   // v1481 : l'acte n'était jamais recopié → tout comptait comme « Force »
      _bossImage: 'images/story/nabdano.webp'
    };
  }


  // ══════════════════════════════════════════════════════════════════
  // 👑 LE MONARQUE UTILISE LE BUILD DU JOUEUR
  // ------------------------------------------------------------------
  // Avant : séance fixe. STR 80 ou STR 400 → strictement identique, et
  // toute la boucle « entraînement → stats → équipement → combat »
  // s'effondrait au moment où elle aurait dû culminer.
  // Maintenant : l’Effaceur a des PV, et chaque ACTE interroge une
  // stat différente. Le Berserker écrase l'Acte Force et souffre en
  // Explosivité ; l'Assassin fait l'inverse ; le polyvalent devient
  // enfin intéressant.
  // ══════════════════════════════════════════════════════════════════
  const ACT_STATS = {
    force:        { stat: 'STR', label: 'Force',        emoji: '⚔️' },
    endurance:    { stat: 'END', label: 'Endurance',    emoji: '🌊' },
    explosivite:  { stat: 'AGI', label: 'Explosivité',  emoji: '⚡' },
    volonte:      { stat: 'PER', label: 'Volonté',      emoji: '🛡️' },
    climax:       { stat: 'VIT', label: 'Tout donner',  emoji: '💥' }
  };

  function _playerStats() {
    // v1481 : stats TOTALES (base + séances + points + équipement + compagnons).
    // Avant : équipement seul → un joueur sans équipement frappait presque à vide.
    try { if (typeof window.awakGetTotalStats === 'function') return window.awakGetTotalStats(); } catch (e) {}
    try {
      if (typeof getPlayerEquipStats === 'function') return getPlayerEquipStats();
    } catch (e) {}
    return { STR: 10, AGI: 10, VIT: 10, END: 10, PER: 5, SEN: 5 };
  }

  // PV de l’Effaceur : socle fixe, modulé par le Power Score.
  // Fourchette VOLONTAIREMENT étroite (0,9 → 1,15) : un joueur puissant
  // doit rester avantagé. Une fourchette large donnerait l'impression
  // que les progrès sont annulés — le pire ressenti possible en RPG.
  function monarqueHP() {
    // 🎯 Calibré sur la séance narrative (21 exercices × ~3 séries).
    // L’Effaceur prend des dégâts à CHAQUE SÉRIE validée, comme un ennemi de
    // Faille : une séance complète inflige ~5 900 dgts (build faible) à
    // ~16 400 (build optimisé). À 12 500 PV, un build travaillé le fait tomber
    // avant la fin, un build faible n'y arrive pas encore — le build reste
    // déterminant sans rendre le combat infaisable.
    const BASE = 12500;
    let power = 0;
    try { if (typeof awakGetPowerScore === 'function') power = awakGetPowerScore(); } catch (e) {}
    const ref = 12000;                       // Power Score « attendu » à ce stade
    const ratio = power > 0 ? power / ref : 1;
    const mod = Math.max(0.9, Math.min(1.15, 0.9 + ratio * 0.25));
    return Math.round(BASE * mod);
  }

  // Dégâts d'un exercice selon l'acte : la stat de l'acte domine,
  // les autres apportent un socle (le polyvalent n'est jamais bloqué).
  function actDamage(actKey, effortUnits, stats) {
    const cfg = ACT_STATS[actKey] || ACT_STATS.force;
    const st = stats || _playerStats();
    const dominante = st[cfg.stat] || 10;
    const moyenne = (st.STR + st.AGI + st.VIT + st.END + st.PER + st.SEN) / 6;
    const SOFT = 80;
    const dim = v => v <= SOFT ? v : SOFT + Math.sqrt(v - SOFT) * Math.sqrt(SOFT);
    // 70 % stat de l'acte + 30 % polyvalence
    const eff = dim(dominante) * 0.7 + dim(moyenne) * 0.3;
    return Math.round((4 + eff * 1.5) * (effortUnits || 1));
  }
  // v1480 : l'Effaceur suit TA puissance. Ses PV sont calés sur les dégâts que ton
  // build inflige réellement sur CETTE séance (exercices et séries une fois la séance
  // préparée) : il faut environ 90 % des coups pour le faire tomber, quel que soit
  // ton niveau. Les phases (×0,9 sous 50 %) sont simulées.
  function _unites(e) {
    if (e.mode === 'timer' && e.duration) return Math.max(1, e.duration / 30);
    var r = e.targetReps || e.reps;
    if (r) return Math.max(1, r / 12);
    return 1;
  }
  function _coups(workout, stats) {
    var l = [];
    (workout.exercises || []).forEach(function (e) {
      if (!e || e.isInfo || e.isRest) return;
      var n = e.mode === 'timer' ? 1 : Math.max(1, parseInt(e.sets, 10) || 1);
      var d = actDamage(e._act || 'force', _unites(e), stats);
      for (var i = 0; i < n; i++) l.push(d);
    });
    return l;
  }
  function _coupsPourTomber(coups, hp) {
    var pv = hp, ph = 0;
    for (var i = 0; i < coups.length; i++) {
      var d = coups[i]; if (ph >= 2) d = Math.round(d * 0.9);
      pv -= d; var pct = pv / hp * 100;
      if (pct <= 25) ph = 3; else if (pct <= 50) ph = Math.max(ph, 2); else if (pct <= 75) ph = Math.max(ph, 1);
      if (pv <= 0) return i + 1;
    }
    return Infinity;
  }
  function _pvPour(coups) {
    var cible = Math.ceil(coups.length * 0.9), lo = 100, hi = coups.reduce(function (a, b) { return a + b; }, 0) * 2;
    for (var k = 0; k < 40; k++) { var mid = Math.round((lo + hi) / 2); if (_coupsPourTomber(coups, mid) <= cible) lo = mid; else hi = mid; }
    return lo;
  }
  // v1481 : MINIMUM — un chasseur « normal » de ton niveau. Le boss suit ta puissance,
  // mais ne descend jamais sous ce plancher : rester faible exprès ne paie pas.
  // Par stat : 10 de base + les points de niveau répartis (4 par niveau) + un peu
  // d'équipement et de séances. Un joueur qui investit le dépasse largement.
  function statsReference(niv) {
    var v = Math.round(10 + 0.55 * Math.max(0, niv - 1) + 10);
    return { STR: v, AGI: v, VIT: v, END: v, PER: v, SEN: v };
  }
  function calibrer(workout) {
    if (!workout || !workout._isFinalBoss || workout._hpCalibre) return;
    var coups = _coups(workout);
    if (coups.length < 4) return;
    var niv = niveauJoueur();
    // v1501 : DURETÉ — il faut dépasser ses objectifs (≈ +12 % en moyenne) pour le tomber
    var DURETE = 1.25;
    var pvToi = Math.round(_pvPour(coups) * DURETE);
    var pvMin = Math.round(_pvPour(_coups(workout, statsReference(niv))) * DURETE);
    var pv = Math.round(Math.max(pvToi, pvMin) * facteurPVEquipe(workout));   // v1511 : l'équipe aide → il encaisse plus
    workout._bossHpMax = pv;
    workout._bossHp = pv;
    workout._hpCalibre = true;
    workout._bossPlancher = pvMin > pvToi;   // le joueur est sous le niveau attendu
    workout._bossNiveau = niv + 5;
  }
  window.awakFinalStatsReference = statsReference;
  function niveauJoueur() {
    try { return (typeof window.rpgLevelFromXP === 'function' && typeof window.awakXPTotale === 'function') ? window.rpgLevelFromXP(window.awakXPTotale()) : 1; } catch (e) { return 1; }
  }
  window.awakFinalCalibrer = calibrer;

  try {
    window.awakMonarqueHP = monarqueHP;
    window.awakMonarqueActDamage = actDamage;
    window.AWAK_ACT_STATS = ACT_STATS;
  } catch (e) {}

  // 🧭 Le combat final parle du parcours RÉEL du joueur (séances, série, compagnons).
  function parcours() {
    var st = {}, noms = [];
    try { st = JSON.parse(localStorage.getItem('workoutStats') || '{}') || {}; } catch (e) {}
    try {
      var COURTS = { marcus: 'Marcus', kira: 'Kira', elise: 'Élise', yuna: 'Yuna', chen: 'Chen' };
      var d = (typeof awakCompanionsLoad === 'function') ? awakCompanionsLoad() : null;
      (d && Array.isArray(d.unlocked) ? d.unlocked : []).forEach(function (id) { if (COURTS[id]) noms.push(COURTS[id]); });
    } catch (e) {}
    return { seances: st.workouts || 0, serie: Math.max(st.bestStreak || 0, st.streak || 0), noms: noms };
  }
  function partenaire() {
    try { return (localStorage.getItem('fitproAvatarGender') || 'homme') === 'femme' ? 'Esen' : 'Nyra'; } catch (e) { return 'Nyra'; }
  }
  function listeNoms(noms) {
    // Le joueur incarne Esen (avatar homme) ou Nyra (avatar femme) : c'est l'AUTRE qui arrive.
    var l = [partenaire()].concat(noms);
    if (l.length === 1) return l[0];
    return l.slice(0, -1).join(', ') + ' et ' + l[l.length - 1];
  }

  // Construit la liste complète des exercices + narration des 7 actes.
  function buildFinalWorkout() {
    const P = parcours();
    const E = [];

    // ── PROLOGUE ──
    E.push(story('👑 La Faille Finale', [
      "Pas de monstres, pas de vagues. Au bout de la route, une silhouette assise au milieu du blanc. Il ne se lève pas en te voyant arriver.",
      "« Te voilà. » Sa voix est calme, presque douce. « Tu as répondu à mes quatre questions. Il m'en reste une seule : combien de temps encore ? »",
      "« " + P.seances + " séances. " + (P.serie > 1 ? "Ta plus longue série : " + P.serie + " jours. " : "") + "» Il connaît tes chiffres par cœur. « Moi aussi, je comptais. Au début. Puis j'ai arrêté de compter. Puis j'ai arrêté tout court. »",
      "Le blanc s'épaissit autour de toi. Il ne t'attaque pas. Il te prête sa fatigue — quarante et un ans de fatigue. Chaque mouvement va peser le double.",
      "Le Système, d'une voix à peine audible : « Je suis faible, ici. Mais je suis là. Ne t'assois pas. Chaque séance que tu as faite t'a mené jusqu'à lui. »"
    ], '#dc2626'));
    // v1479 : plus d'échauffement — le combat commence directement à l'Acte I.
    // v1486 : exercices à répétitions en plusieurs séries (3 à l'acte Force, 2 ailleurs) :
    // chaque série est un coup ; une série ratée pèse moins sur l'issue du combat.

    // ── ACTE I — LA FORCE ──
    E.push(story('⚔️ Acte I — La Force', [
      "Nabdano ne bouge pas. « J'étais plus fort que toi. J'ai porté le monde à bout de bras. La force, ça s'use. »",
      "Le poids du blanc s'abat sur tes épaules. « Prouve-moi que la tienne ne s'use pas. »"
    ], '#ef4444', { num: 'ACTE I', titre: 'La Force', ligne: '« La force, ça s\'use. Prouve-moi que la tienne ne s\'use pas. »' }));
    E.push(ex('Pompes', 'Pectoraux', { sets: 3, reps: 20, instructions: ['Corps gainé', 'Amplitude complète', 'Contrôle la descente'] , _act:'force'}));
    E.push(ex('Squats', 'Quadriceps', { sets: 3, reps: 25, instructions: ['Cuisses parallèles', 'Talons ancrés', 'Poitrine haute'] , _act:'force'}));
    E.push(ex('Fentes dynamiques', 'Quadriceps', { sets: 3, reps: 20, instructions: ['Genou arrière vers le sol', 'Alterne les jambes'] , _act:'force'}));
    E.push(ex('Pompes diamant', 'Triceps', { sets: 3, reps: 15, instructions: ['Mains rapprochées', 'Coudes près du corps'] , _act:'force'}));

    // ── ACTE II — L'ENDURANCE ──
    E.push(story('🌊 Acte II — L\'Endurance', [
      "« Tu tiens encore ? » Pour la première fois, il lève la tête. « Moi aussi, je tenais. Un jour, puis un autre. Ce n'est pas la douleur qui m'a vaincu. C'est la durée. »",
      "L'air devient lourd. Chaque respiration coûte. « Assieds-toi, et tout s'arrête. C'est si simple, d'arrêter. »"
    ], '#0ea5e9', { num: 'ACTE II', titre: 'L\'Endurance', ligne: '« Ce n\'est pas la douleur qui m\'a vaincu. C\'est la durée. »' }));
    E.push(ex('Burpees', 'Cardio', { timer: 75, instructions: ['Enchaîne sans pause', 'Poitrine au sol', 'Saut explosif en haut'] , _act:'endurance'}));
    E.push(ex('Mountain climbers', 'Cardio', { timer: 60, instructions: ['Genoux rapides vers la poitrine', 'Hanches basses'] , _act:'endurance'}));
    E.push(ex('Squats sautés', 'Quadriceps', { timer: 60, instructions: ['Descends en squat', 'Explose vers le haut', 'Réception souple'] , _act:'endurance'}));
    E.push(ex('Talons-fesses rapides', 'Cardio', { timer: 50, instructions: ['Rythme élevé', 'Bras actifs'] , _act:'endurance'}));

    // ── ACTE III — L'EXPLOSIVITÉ ──
    E.push(story('⚡ Acte III — L\'Explosivité', [
      "Autour de toi, les rues effacées défilent, de plus en plus vite. « Moi aussi, j'étais régulier. Peux-tu encore être vif quand tout en toi veut ralentir ? »",
      "« C'est dans l'épuisement que se révèle ce que tu es vraiment. »"
    ], '#a855f7', { num: 'ACTE III', titre: 'L\'Explosivité', ligne: '« Peux-tu encore être vif quand tout en toi veut ralentir ? »' }));
    E.push(ex('Burpees avec saut', 'Cardio', { sets: 2, reps: 15, instructions: ['Explosion maximale au saut', 'Enchaîne'] , _act:'explosivite'}));
    E.push(ex('Fentes sautées alternées', 'Quadriceps', { sets: 2, reps: 20, instructions: ['Change de jambe en l\'air', 'Réception contrôlée'] , _act:'explosivite'}));
    E.push(ex('Pompes claquées', 'Pectoraux', { sets: 2, reps: 10, instructions: ['Pousse fort', 'Décolle les mains', 'Si trop dur : pompes explosives'] , _act:'explosivite'}));
    E.push(ex('Sauts groupés (tuck jumps)', 'Quadriceps', { sets: 2, reps: 15, instructions: ['Genoux vers la poitrine', 'Réception amortie'] , _act:'explosivite'}));

    // ── ACTE IV — LA VOLONTÉ ──
    E.push(story('🛡️ Acte IV — La Volonté', [
      "Nabdano vacille. Ses mains tremblent. « Comment... ? Personne n'a tenu aussi longtemps. Pas même moi. »",
      "Sa voix se fait tendre. « Tu trembles. Pose un genou à terre. Personne ne te le reprochera. Moi, je ne te le reprocherai jamais. »",
      "Le Système rassemble ce qui lui reste : « Tiens. Sa dernière arme, c'est ton propre doute. Et souviens-toi : tu n'es pas venu seul. »"
    ], '#c084fc', { num: 'ACTE IV', titre: 'La Volonté', ligne: '« Pose un genou à terre. Personne ne te le reprochera. »' }));
    E.push(ex('Gainage planche', 'Abdominaux', { timer: 60, instructions: ['Corps parfaitement aligné', 'Ne cède pas', 'Respire malgré tout'] , _act:'volonte'}));
    E.push(ex('Chaise contre le mur', 'Quadriceps', { timer: 60, instructions: ['Cuisses parallèles au sol', 'Dos plaqué', 'Tiens coûte que coûte'] , _act:'volonte'}));
    E.push(ex('Gainage latéral droit', 'Obliques', { timer: 40, instructions: ['Hanches hautes', 'Corps en ligne'] , _act:'volonte'}));
    E.push(ex('Gainage latéral gauche', 'Obliques', { timer: 40, instructions: ['Hanches hautes', 'Corps en ligne'] , _act:'volonte'}));
    E.push(ex('Hollow hold', 'Abdominaux', { timer: 45, instructions: ['Bas du dos collé au sol', 'Jambes et bras tendus'] , _act:'volonte'}));

    // ── CLIMAX ──
    E.push(story('💥 Climax — Tout donner', [
      "Le blanc se fissure. Derrière toi, des pas : " + listeNoms(P.noms) + ". « Tu n'es pas plus fort que moi, » murmure Nabdano. « Tu as juste... refusé d'être seul. »",
      "Le Système, presque un cri : « MAINTENANT. Donne tout ce qu'il te reste — pour toi, et pour lui aussi. »"
    ], '#fbbf24', { num: 'CLIMAX', titre: 'Tout donner', ligne: '« Tu as juste... refusé d\'être seul. »', climax: true }));
    E.push(ex('Burpees finaux', 'Cardio', { timer: 60, instructions: ['Vide le réservoir', 'Chaque rep le fait reculer'] , _act:'climax'}));
    E.push(ex('Pompes maximum', 'Pectoraux', { sets: 2, reps: 25, instructions: ['Autant que possible', 'Forme avant tout'] , _act:'climax'}));
    E.push(ex('Squats maximum', 'Quadriceps', { sets: 2, reps: 30, instructions: ['Profonds', 'Sans t\'arrêter'] , _act:'climax'}));
    E.push(ex('Gainage final', 'Abdominaux', { timer: 60, instructions: ['Le dernier effort', 'Tiens jusqu\'au bout'] , _act:'climax'}));

    // L'épilogue est joué par l'écran de victoire (awakShowFinalBossVictory) à la fin de la séance.

    return E;
  }

  // Le boss final est-il débloqué ? (4 sous-bosses vaincus + jeu activé)
  function isFinalUnlocked() {
    try {
      if (typeof getAdventureEnabled === 'function' && !getAdventureEnabled()) return false;
      const progress = parseInt(localStorage.getItem('awakSubBossProgress') || '0');
      return progress >= 4;
    } catch (e) { return false; }
  }
  window.awakFinalBossUnlocked = isFinalUnlocked;

  function isFinalDefeated() {
    return localStorage.getItem(FINAL_DONE_KEY) === '1';
  }
  window.awakFinalBossDefeated = isFinalDefeated;

  // Lance le combat final comme une séance préparée.
  function startFinalBoss(opts) {
    // v1482 : opts.essai (mode développeur) — combat lancé sans les 4 sous-boss ;
    // une victoire d'essai ne compte pas (histoire et Abysses inchangées).
    var essai = !!(opts && opts.essai);
    if (!essai && !isFinalUnlocked()) {
      if (typeof showAlert === 'function') {
        showAlert('L’Effaceur attend', 'Quatre gardiens se dressent encore entre toi et lui. Il ne te parlera qu\'une fois leurs quatre questions résolues.');
      }
      return;
    }
    const exercises = buildFinalWorkout();
    imagesCombat(true);   // v1506 : images du champ de bataille dès le 1er exercice
    try { document.body.classList.add('awk-fb'); } catch (e) {}
    // ⚔️ PV DU MONARQUE : le combat final utilise enfin le build du joueur.
    // Chaque exercice terminé retire des dégâts calculés selon la stat de l'acte.
    const hpMax = monarqueHP();
    const workout = {
      name: '👑 L’Effaceur',
      type: 'finalboss',
      _isFinalBoss: true,
      _bossHpMax: hpMax,
      _bossHp: hpMax,
      _bossImage: 'images/story/nabdano.webp',
      exercises: exercises,
      _essaiDev: essai || undefined,
      _cardioAsked: true,   // v1485 : pas de proposition de cardio d'échauffement
      badgeHTML: '👑 COMBAT FINAL — L’Effaceur' + (essai ? ' (essai)' : ''),
      badgeStyle: 'linear-gradient(135deg, #dc2626 0%, #7f1d1d 100%)'
    };
    // v1468 : L'Effaceur se présente avant le combat
    // (v1485 : au-dessus du prologue — la séance démarre derrière, sans écran « Prépare-toi »)
    try { if (window.AwakRiftVis && AwakRiftVis.bossIntro) AwakRiftVis.bossIntro({ nom: 'L’Effaceur', monstreNom: 'L’Effaceur assis', couleur: '#dc2626', sousTitre: 'COMBAT FINAL', zIndex: 99998 }); } catch (e) {}
    // Utilise le pipeline de séance préparée existant
    if (typeof window.setPendingWorkout === 'function') {
      window.setPendingWorkout(workout);
    } else {
      window.pendingWorkout = workout;
    }
    // 🐛 L'écran PRÉPAREZ-VOUS (#preparationView) vit dans l'onglet ENTRAÎNER.
    // Le combat final se lance depuis l'onglet JEU : sans bascule d'onglet,
    // la séance était bien préparée… mais restait invisible. Rien ne semblait
    // se passer au clic.
    try { if (typeof switchTab === 'function') switchTab('workouts'); } catch (e) {}

    if (typeof window.showWorkoutPreparation === 'function') {
      // v1485 : pas d'écran « Prépare-toi » pour le combat final. La préparation
      // applique ses règles (corps, équipement) puis la séance démarre aussitôt.
      // Si une autre séance est en cours, la préparation s'arrête sur sa question :
      // on ne démarre alors rien.
      window._fbHasPrep = false;
      window.showWorkoutPreparation(workout);
      if (window._fbHasPrep && typeof window.startPreparedWorkout === 'function') window.startPreparedWorkout();
    } else if (typeof window.startPreparedWorkout === 'function') {
      window.pendingWorkout = workout;
      window.startPreparedWorkout();
    }
  }
  window.awakStartFinalBoss = startFinalBoss;

  // v1506 : IMAGES D'EXERCICES DU COMBAT FINAL (champ de bataille, Nabdano).
  // Pendant ce combat seulement, elles remplacent les images normales (mêmes clés
  // de EXERCISE_IMAGES, modifiées puis rétablies). N'ajouter ici que les fichiers livrés.
  var FB_IMAGES = {
    'Pompes': 'FB_Pompes', 'Pompes maximum': 'FB_Pompes'
  };
  var _imgSauve = null;
  function imagesCombat(actif) {
    var T = window.EXERCISE_IMAGES; if (!T) return;
    if (actif && !_imgSauve) {
      _imgSauve = {};
      Object.keys(FB_IMAGES).forEach(function (k) { _imgSauve[k] = T.hasOwnProperty(k) ? T[k] : undefined; T[k] = 'images/exercises/' + FB_IMAGES[k] + '.webp'; });
    } else if (!actif && _imgSauve) {
      Object.keys(_imgSauve).forEach(function (k) { if (_imgSauve[k] === undefined) delete T[k]; else T[k] = _imgSauve[k]; });
      _imgSauve = null;
    }
  }
  window.awakFinalImages = imagesCombat;
  setInterval(function () {
    try {
      var fb = typeof window.awakSeanceContexte === 'function' && window.awakSeanceContexte() === 'final';
      imagesCombat(fb);
      // v1508 : pas de « Préc. » ni de « Remplacer » pendant le combat final
      document.body.classList.toggle('awk-fb', !!fb);
      if (!document.getElementById('awkFbCss')) {
        var st = document.createElement('style'); st.id = 'awkFbCss';
        st.textContent = 'body.awk-fb #prevBtn,body.awk-fb #swapBtn{display:none!important}body.awk-fb #awakBarreActions #awakSuivantBtn{grid-column:1/-1}';
        document.head.appendChild(st);
      }
    } catch (e) {}
  }, 1000);

  // ⚔️ Applique les dégâts d'un exercice terminé à l’Effaceur.
  // Appelé par app.js à la fin de chaque exercice du combat final.
  // C'est ici que le BUILD du joueur compte : la stat de l'acte domine (70 %),
  // la polyvalence complète (30 %) — un spécialisé écrase son acte et rame
  // ailleurs, un polyvalent avance régulièrement.
  function frapperMonarque(workout, exercice, repsFaites, part) {
    if (!workout || !workout._isFinalBoss || !exercice) return null;
    calibrer(workout);
    var acte = exercice._act || 'force';
    var unites = 1;
    if (exercice.mode === 'timer' && exercice.duration) unites = Math.max(1, exercice.duration / 30);
    else if (exercice.targetReps || exercice.reps) unites = Math.max(1, (exercice.targetReps || exercice.reps) / 12);
    // v1480 : l'EFFORT compte — reps faites / objectif (×0,5 à ×1,35)
    var effort = 1, obj = exercice.targetReps || exercice.reps;
    if (exercice.mode !== 'timer' && obj && repsFaites > 0) effort = Math.max(0.5, Math.min(1.35, repsFaites / obj));   // v1501 : plafond ×1,35
    // v1503 : part = fraction du coup (tranches de 15 s des exercices au temps)
    var f = (typeof part === 'number' && part > 0) ? Math.min(1, part) : 1;
    var degats = Math.max(1, Math.round(actDamage(acte, unites) * effort * f));
    // v1479 : PHASES de l'Effaceur. Sous 50 % il durcit (×0,9) jusqu'à la fin ;
    // sous 25 % ce sont ses ripostes qui montent (×1,45).
    var max = workout._bossHpMax || 1;
    var avant = (workout._bossHp || 0) / max * 100;
    var ph = workout._phase || 0;
    if (ph >= 2) degats = Math.round(degats * 0.9);   // v1491 : plus de bonus +30 % en dernière phase
    var aides = aidesCoup(workout, degats);            // v1511 : les alliés frappent aussi
    workout._bossHp = Math.max(0, (workout._bossHp || 0) - degats - aides.extra);
    var apres = workout._bossHp / max * 100;
    var palier = null;
    [[75, 1], [50, 2], [25, 3]].forEach(function (s) {
      if (avant > s[0] && apres <= s[0] && workout._bossHp > 0 && (workout._phase || 0) < s[1]) { workout._phase = s[1]; palier = s[1]; }
    });
    // v1511 : Yuna — le Noyau répond à chaque changement de phase
    if (palier && aUn(workout, 'Yuna') && workout._bossHp > 0) {
      var dy = Math.max(1, Math.round(max * 0.03));
      workout._bossHp = Math.max(1, workout._bossHp - dy);
      aides.liste.push({ nom: 'Yuna', dmg: dy, txt: 'le Noyau répond : −' + dy + ' PV' });
    }
    if (palier) workout._chenBloc = 1;   // Chen relit son geste à chaque phase
    workout._dernierCoup = { dmg: degats + aides.extra, t: Date.now() };
    if (workout._bossHp <= 0) workout._bossVaincu = true;   // v1487 : seule preuve de victoire
    var riposte = workout._bossHp > 0 ? riposteEffaceur(workout, f) : null;
    return {
      aides: aides.liste,
      riposte: riposte,
      palier: palier,
      degats: degats,
      hp: workout._bossHp,
      hpMax: workout._bossHpMax || 1,
      pct: Math.round((workout._bossHp / (workout._bossHpMax || 1)) * 100),
      vaincu: workout._bossHp <= 0,
      acte: acte,
      statLabel: (ACT_STATS[acte] || ACT_STATS.force).stat
    };
  }
  window.awakFrapperMonarque = frapperMonarque;

  // v1511 : LES ALLIÉS AGISSENT, chacun selon sa Loi (ses statistiques) :
  //  · partenaire (Esen/Nyra) : frappe avec toi, 1 coup sur 6 (+30 % de ce coup)
  //  · Marcus (Force)        : 1 coup sur 4, il frappe aussi (+40 % de ce coup)
  //  · Kira (Agilité)        : 1 coup sur 5, frappe le point faible (+50 %)
  //  · Yuna (Noyau)          : à chaque changement de phase, −3 % de ses PV max
  //  · Chen (Perception)     : lit son geste — annule 1 riposte par phase
  //  · Élise (Récupération)  : sous 40 % de tes PV, te soigne de 15 % (1 fois par phase)
  // En échange, l'Effaceur est plus solide (PV et ripostes calibrés sur l'équipe).
  function equipe(workout) {
    if (workout._equipe) return workout._equipe;
    var P = parcours();
    workout._equipe = { part: partenaire(), noms: P.noms.slice() };
    return workout._equipe;
  }
  function aUn(workout, nom) { return equipe(workout).noms.indexOf(nom) >= 0; }
  function facteurPVEquipe(workout) {
    var s = 0.05 + (aUn(workout, 'Marcus') ? 0.10 : 0) + (aUn(workout, 'Kira') ? 0.10 : 0);
    var y = aUn(workout, 'Yuna') ? 0.09 : 0;
    return 1.05 * (1 + s) / (1 - y);   // +5 % de base (« légèrement plus fort »)
  }
  function facteurRiposteEquipe(workout) {
    return 1.05 + (aUn(workout, 'Élise') ? 0.08 : 0) + (aUn(workout, 'Chen') ? 0.08 : 0);
  }
  function aidesCoup(workout, degats) {
    var A = [], n = workout._nCoup = (workout._nCoup || 0) + 1, E = equipe(workout);
    function frappe(nom, part, txt) { var d = Math.max(1, Math.round(degats * part)); A.push({ nom: nom, dmg: d, txt: txt.replace('{d}', d) }); return d; }
    var extra = 0;
    if (n % 6 === 0) extra += frappe(E.part, 0.30, 'frappe avec toi : −{d} PV');
    if (aUn(workout, 'Marcus') && n % 4 === 0) extra += frappe('Marcus', 0.40, 'cogne de toute sa force : −{d} PV');
    if (aUn(workout, 'Kira') && n % 5 === 0) extra += frappe('Kira', 0.50, 'frappe le point faible : −{d} PV');
    return { liste: A, extra: extra };
  }

  // v1507 : NABDANO NARGUE le joueur pendant le combat (bulle dans le bandeau,
  // copiée dans le journal). Il ne crie pas : il est las, calme, il invite à s'asseoir.
  var NARGUES = {
    general: [
      "Tu crois être le premier à essayer ?",
      "Encore une série. Et après ? Encore une. Ça ne finit jamais.",
      "Moi aussi, je comptais mes séries. Au début.",
      "Tes bras tremblent déjà. Je le vois d'ici.",
      "Pourquoi tu te donnes tout ce mal ? Personne ne s'en souviendra.",
      "Le monde s'efface quand même. Tu ralentis juste la chute."
    ],
    faible: [
      "Moins que prévu. C'est comme ça que ça commence.",
      "Tu vois ? Tu ralentis déjà.",
      "Personne ne te regarde. Tu peux arrêter, tu sais.",
      "La prochaine, tu en feras encore moins."
    ],
    fort: [
      "…Plus que prévu. Pour combien de temps ?",
      "Garde-en un peu. Tu en auras besoin.",
      "J'étais comme toi. Regarde où ça m'a mené."
    ],
    blesse: [
      "Assieds-toi. Ça ne fait plus mal, assis.",
      "Tu tiens à peine debout.",
      "Un genou à terre. Juste un. Ce n'est pas abandonner.",
      "Écoute ton corps. Il te supplie d'arrêter."
    ],
    esquive: [
      "Tu esquives. Moi aussi, j'esquivais. Au début.",
      "Rapide. Mais la fatigue, on ne l'esquive pas."
    ],
    chrono: [
      "Les secondes sont plus longues, ici. Tu l'as remarqué ?",
      "Compte avec moi. Il en reste trop.",
      "Le temps, c'est moi. Et j'ai tout mon temps."
    ],
    releve: [
      "Le Système te relève. Il me relevait, moi aussi. Jusqu'au jour où il n'a plus pu.",
      "Debout, encore. Combien de fois, avant de comprendre ?"
    ],
    phase1: ["Ça faisait quarante et un ans que je n'avais pas eu à me lever."],
    phase2: ["Assez joué. Sens le poids du blanc."],
    phase3: ["Regarde ce que quarante et un ans de fatigue peuvent faire."]
  };
  function nargue(workout, ctx, force) {
    if (!workout || !workout._isFinalBoss || workout._joueurMort || workout._bossHp <= 0) return null;
    var now = Date.now(), der = workout._nargueT || 0;
    if (!force && (now - der < 22000 || Math.random() > 0.6)) return null;
    var L = NARGUES[ctx] || NARGUES.general, vus = workout._nargueVus || (workout._nargueVus = []);
    var dispo = L.filter(function (x) { return vus.indexOf(x) < 0; });
    if (!dispo.length) { dispo = L.slice(); workout._nargueVus = vus = vus.filter(function (x) { return L.indexOf(x) < 0; }); }
    var txt = dispo[Math.floor(Math.random() * dispo.length)];
    vus.push(txt);
    workout._nargueT = now;
    workout._nargue = { txt: txt, t: now };
    try { var J = workout._journal || (workout._journal = []); J.push({ t: now, ton: 'nab', txt: 'Nabdano : « ' + txt + ' »' }); } catch (e) {}
    return txt;
  }
  window.awakNabdanoNargue = nargue;

  // v1509 : LES ALLIÉS ENCOURAGENT (partenaire + compagnons débloqués). Ils répondent
  // souvent aux piques de Nabdano, et réagissent quand tu te dépasses ou que tu flanches.
  var ALLIES = {
    Esen: { couleur: '#86efac', l: {
      general: ["Respire. Une à la fois.", "Je suis là.", "On ne s'assoit pas. Pas aujourd'hui."],
      replique: ["Ne l'écoute pas.", "Il parle. Toi, tu bouges.", "Il ment. Continue."],
      fort: ["…Bien.", "Comme ça. Exactement comme ça."],
      blesse: ["Lève-toi. Je ne te laisse pas.", "Encore un peu. Je tiens avec toi."],
      phase: ["Il se lève parce qu'il a peur.", "Il plie. Ne lâche rien."] } },
    Nyra: { couleur: '#f0abfc', l: {
      general: ["Hé ! Tu vas pas me laisser gagner toute seule ?", "Allez, montre-lui ce que t'as dans le ventre !", "T'es plus têtu{e} que lui. Ça se voit."],
      replique: ["Blablabla. Il parle beaucoup pour quelqu'un qui est resté assis quarante ans.", "Il essaie de te faire douter. Raté.", "Ignore-le, je fais assez de bruit pour deux !"],
      fort: ["Ouh là ! T'as vu ça ?!", "C'est ça ! Encore !"],
      blesse: ["Non non non, tu restes debout, compris ?", "Appuie-toi sur moi. Une de plus."],
      phase: ["Il commence à transpirer, le grand.", "On l'a fait lever. On l'a fait LEVER !"] } },
    Marcus: { couleur: '#f87171', l: {
      general: ["Cogne, champion. Cogne encore.", "La douleur, c'est l'entraînement qui entre."],
      replique: ["Il cause trop. Frappe-le dans le silence.", "J'ai entendu pire sur un ring. Avance."],
      fort: ["ÇA, c'est une série !", "Costaud. Presque autant que moi."],
      blesse: ["Garde haute ! Tu tombes pas tant que je regarde."] } },
    Kira: { couleur: '#c4b5fd', l: {
      general: ["Je ne marche qu'avec ceux qui ne ratent pas. Ne rate pas.", "Reste précis{e}. Le reste suit."],
      replique: ["Ses mots, c'est une feinte. Ne mords pas.", "Il cherche une ouverture. Ne lui en donne pas."],
      fort: ["Propre.", "Là. Tu l'as vu vaciller."] } },
    'Élise': { couleur: '#7dd3fc', l: {
      general: ["Ton souffle d'abord. Le reste ensuite.", "Je surveille tes PV. Toi, surveille ta forme."],
      replique: ["Il veut que tu t'arrêtes. Ton corps peut encore.", "Ce n'est pas de la sagesse, c'est de la fatigue. Ne confonds pas."],
      blesse: ["Je suis là. Encore une, je te rattrape.", "Tu saignes de fatigue, pas de faiblesse. Tiens."] } },
    Yuna: { couleur: '#d8b4fe', l: {
      general: ["Le Noyau t'écoute. Il bat plus fort quand tu bouges.", "Je vois la fin. Tu y es, debout."],
      replique: ["Il a déjà perdu. Il ne le sait pas encore.", "Sa voix est vide. La tienne, non."] } },
    Chen: { couleur: '#fcd34d', l: {
      general: ["Le corps cède quand l'esprit le lui permet.", "Une respiration. Un mouvement. Rien d'autre."],
      replique: ["Les mots d'un homme fatigué ne sont pas des vérités.", "Il te tend sa fatigue. Refuse le cadeau."],
      fort: ["Bien. Tu as cessé de penser."] } }
  };
  function _alliesDispo() {
    var P = parcours(), liste = [partenaire()].concat(P.noms);
    return liste.filter(function (n) { return ALLIES[n]; });
  }
  function encourage(workout, ctx, force) {
    if (!workout || !workout._isFinalBoss || workout._joueurMort || workout._bossHp <= 0) return null;
    var now = Date.now();
    if (!force && (now - (workout._encT || 0) < 18000)) return null;
    var noms = _alliesDispo().filter(function (n) { return ALLIES[n].l[ctx]; });
    if (!noms.length) { if (ctx === 'general') return null; noms = _alliesDispo().filter(function (n) { return ALLIES[n].l.general; }); ctx = 'general'; }
    if (!noms.length) return null;
    // pas deux fois de suite le même allié si possible
    var autres = noms.filter(function (n) { return n !== workout._encDernier; });
    var nom = (autres.length ? autres : noms)[Math.floor(Math.random() * (autres.length || noms.length))];
    var L = ALLIES[nom].l[ctx], vus = workout._encVus || (workout._encVus = []);
    var dispo = L.filter(function (x) { return vus.indexOf(nom + x) < 0; }); if (!dispo.length) dispo = L;
    var txt = dispo[Math.floor(Math.random() * dispo.length)];
    var fem = false; try { fem = (localStorage.getItem('fitproAvatarGender') || 'homme') === 'femme'; } catch (e) {}
    txt = txt.replace(/\{e\}/g, fem ? 'e' : '');
    vus.push(nom + txt);
    workout._encT = now; workout._encDernier = nom;
    workout._encourage = { nom: nom, couleur: ALLIES[nom].couleur, txt: txt, t: now };
    try { (workout._journal || (workout._journal = [])).push({ t: now, ton: 'allie', txt: nom + ' : « ' + txt + ' »' }); } catch (e) {}
    return workout._encourage;
  }
  window.awakAllieEncourage = encourage;

  // v1487 : PV DU JOUEUR. L'Effaceur riposte après chaque coup. Sa force suit ton
  // NIVEAU (le chasseur de référence), pas ta défense : c'est ton END (PV), ta VIT
  // (blocage), ta PER (esquive) et ta régénération qui décident si tu tiens.
  // À 0 PV : le Système te relève UNE fois à 30 % (deux avec une Larme du Système).
  // Deuxième chute → défaite, tout est à refaire.
  function _pvMaxJoueur() {
    try { return typeof window.awakGetPlayerMaxHP === 'function' ? window.awakGetPlayerMaxHP() : 100; } catch (e) { return 100; }
  }
  function joueurInit(workout) {
    if (!workout || !workout._isFinalBoss) return;
    if (typeof workout._joueurPV === 'number' && typeof workout._joueurPVMax === 'number') return;
    workout._joueurPVMax = _pvMaxJoueur();
    workout._joueurPV = workout._joueurPVMax;
    var larme = false;
    try { larme = !workout._essaiDev && typeof window.awakConsumablesGetActiveEffects === 'function' && !!window.awakConsumablesGetActiveEffects().revive; } catch (e) {}
    workout._releves = larme ? 2 : 1;
    workout._larme = larme;
  }
  window.awakFinalJoueurInit = joueurInit;
  function _coupRiposte(workout) {
    if (workout._riposteBase) return workout._riposteBase;
    var niv = niveauJoueur();
    var refPV = 100 + statsReference(niv).END * 5;
    var n = Math.max(8, _coups(workout).length || 0);
    // Sur tout le combat, le chasseur de référence encaisse ≈ 2 × ses PV (avant
    // blocage, esquive et régénération) : il finit à la limite, un chasseur équipé tient.
    workout._riposteBase = Math.max(4, Math.round(2.0 * refPV / (n * 1.2) * facteurRiposteEquipe(workout)));   // v1501 : 1,6 → 2,0
    return workout._riposteBase;
  }
  function riposteEffaceur(workout, part) {
    var f = (typeof part === 'number' && part > 0) ? Math.min(1, part) : 1;
    joueurInit(workout);
    if (workout._joueurMort) return null;
    var b = {};
    try { b = typeof window.awakComputeStatBonuses === 'function' ? window.awakComputeStatBonuses() : {}; } catch (e) {}
    var res = { dmg: 0, esquive: false, bloque: 0, soin: 0, releve: false, mort: false };
    // Régénération END après ta série (avant le coup)
    var regen = Math.round((b.hpRegen || 0) * (b.hpRegenMult || 1) * f);
    if (regen > 0 && workout._joueurPV < workout._joueurPVMax) {
      var av = workout._joueurPV;
      workout._joueurPV = Math.min(workout._joueurPVMax, workout._joueurPV + regen);
      res.soin = workout._joueurPV - av;
    }
    try { if (typeof window.awakIsInvincible === 'function' && window.awakIsInvincible()) return res; } catch (e) {}
    if (Math.random() < (b.dodgeChance || 0)) { res.esquive = true; workout._derniereRiposte = { esquive: true, t: Date.now() }; return res; }
    // v1511 : Chen a lu son geste → riposte annulée (1 par phase ; la 1re dès le début)
    if (aUn(workout, 'Chen')) {
      if (workout._chenBloc == null) workout._chenBloc = 1;
      if (workout._chenBloc > 0 && (workout._joueurPV / (workout._joueurPVMax || 1)) < 0.75) {
        workout._chenBloc = 0; res.chen = true; workout._derniereRiposte = { esquive: true, t: Date.now() }; return res;
      }
    }
    var ph = workout._phase || 0;
    var mult = [1, 1.1, 1.25, 1.45][ph] || 1;
    var brut = _coupRiposte(workout) * mult * f * (0.85 + Math.random() * 0.3);
    var vit = 0;
    try { vit = (window.awakGetTotalStats ? window.awakGetTotalStats() : {}).VIT || 0; } catch (e) {}
    var red = Math.min(0.40, vit / (vit + 300));
    var dmg = Math.max(1, Math.round(brut * (1 - red)));
    res.bloque = Math.max(0, Math.round(brut) - dmg);
    res.dmg = dmg;
    workout._joueurPV = Math.max(0, workout._joueurPV - dmg);
    // v1511 : Élise soigne de 15 % sous 40 % de PV (1 fois par phase)
    if (workout._joueurPV > 0 && aUn(workout, 'Élise') && workout._joueurPV / (workout._joueurPVMax || 1) < 0.4) {
      var fe = workout._eliseFaite || (workout._eliseFaite = {});
      if (!fe[ph]) { fe[ph] = 1; var se = Math.round(workout._joueurPVMax * 0.15); workout._joueurPV = Math.min(workout._joueurPVMax, workout._joueurPV + se); res.elise = se; }
    }
    if (workout._joueurPV <= 0) {
      if ((workout._releves || 0) > 0) {
        workout._releves--;
        workout._joueurPV = Math.max(1, Math.round(workout._joueurPVMax * 0.3));
        res.releve = true;
      } else {
        workout._joueurMort = true;
        res.mort = true;
      }
    }
    workout._derniereRiposte = { dmg: dmg, t: Date.now() };
    return res;
  }
  window.awakFinalRiposte = riposteEffaceur;

  // « Le Système te relève » : courte carte plein écran
  function releveFinale(restants, apres) {
    var vieux = document.getElementById('awakFinalReleve'); if (vieux) vieux.remove();
    var ov = document.createElement('div');
    ov.id = 'awakFinalReleve';
    ov.setAttribute('data-emoji-keep', '');
    ov.style.cssText = 'position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;padding:24px;background:radial-gradient(ellipse at 50% 40%,rgba(30,27,75,.96),#050507 72%);animation:awakFadeIn .4s;';
    ov.innerHTML = '<div style="max-width:400px;width:100%;text-align:center;">'
      + '<div style="font-family:var(--font-display),sans-serif;font-size:12px;letter-spacing:6px;color:#a5b4fc;font-weight:700;">[ SYSTÈME ]</div>'
      + '<h2 style="font-family:var(--font-display),sans-serif;font-size:2em;color:#fff !important;margin:8px 0 12px;">Relève-toi</h2>'
      + '<p style="color:#cbd5e1;font-size:.95em;line-height:1.65;margin:0 0 8px;">Tes PV sont tombés à zéro. Le Système te relève à 30 %.</p>'
      + '<p style="color:#fca5a5;font-size:.85em;font-weight:700;line-height:1.5;margin:0 0 20px;">' + (restants > 0 ? 'Il te reste encore une chance.' : 'C\'est ta dernière chance. Si tu tombes encore, tout est à refaire.') + '</p>'
      + '<button style="width:100%;padding:14px;border:none;border-radius:14px;background:linear-gradient(135deg,#3730a3,#6366f1);color:#fff;font-family:var(--font-display),sans-serif;font-weight:700;font-size:1em;letter-spacing:1px;cursor:pointer;">Continuer le combat</button>'
      + '</div>';
    var fini = false;
    function fermer() { if (fini) return; fini = true; ov.remove(); if (typeof apres === 'function') apres(); }
    ov.querySelector('button').onclick = fermer;
    document.body.appendChild(ov);
    try { if (navigator.vibrate) navigator.vibrate([80, 60, 160]); } catch (e) {}
  }
  window.awakFinalReleve = releveFinale;


  // v1480 : séance finie, l'Effaceur n'est pas tombé → défaite, tout est à refaire
  function defaiteFinale(pct, plancher, mort) {
    document.getElementById('awakFinalDefaite')?.remove();
    var ov = document.createElement('div');
    ov.id = 'awakFinalDefaite';
    ov.setAttribute('data-emoji-keep', '');
    ov.style.cssText = 'position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;padding:24px;background:radial-gradient(ellipse at 50% 35%,#1a0d10,#050507 70%);animation:awakFadeIn .6s;';
    var img = (window.AwakRiftVis && AwakRiftVis.monstre) ? AwakRiftVis.monstre('L’Effaceur assis', '#94a3b8', 170, false) : '';
    ov.innerHTML = '<div style="max-width:420px;width:100%;text-align:center;">'
      + '<div style="display:flex;justify-content:center;opacity:.85;filter:grayscale(.4);">' + img + '</div>'
      + '<div style="font-family:var(--font-display),sans-serif;font-size:13px;letter-spacing:6px;color:#f87171;font-weight:700;margin-top:10px;">' + (mort ? 'TU ES TOMBÉ' : 'IL TIENT ENCORE') + '</div>'
      + '<h2 style="font-family:var(--font-display),sans-serif;font-size:2em;color:#fff !important;margin:6px 0 14px;">Il se rassoit</h2>'
      + '<p style="color:#cbd5e1;font-size:.95em;line-height:1.65;margin:0 0 10px;font-style:italic;">« Tu vois ? Même toi. » ' + (mort ? 'Tu es tombé deux fois. ' : '') + 'Il lui restait ' + pct + ' % de ses forces. Le blanc se referme doucement.</p>'
      + '<p style="color:#94a3b8;font-size:.85em;line-height:1.6;margin:0 0 20px;">' + (mort ? 'Le Système : « Tes PV n\'ont pas tenu. Monte ton END et ta VIT, équipe-toi, prends une Larme du Système, puis reviens. Il t\'attendra — entier. »' : plancher ? 'Le Système : « Tu es arrivé trop faible pour lui. Répartis tes points, équipe-toi, entraîne-toi, puis reviens. Il t\'attendra — entier. »' : 'Le Système : « Ce n\'est pas fini. Chaque série au bout, chaque rep comptée : c\'est comme ça qu\'il tombe. Il t\'attendra — entier. »') + '</p>'
      + '<button style="width:100%;padding:15px;border:none;border-radius:14px;background:linear-gradient(135deg,#7f1d1d,#dc2626);color:#fff;font-family:var(--font-display),sans-serif;font-weight:700;font-size:1.05em;letter-spacing:1px;cursor:pointer;">Revenir plus fort</button>'
      + '</div>';
    ov.querySelector('button').onclick = function () { ov.remove(); try { if (typeof switchTab === 'function') switchTab('game'); } catch (e) {} };
    document.body.appendChild(ov);
  }
  window.awakFinalDefaite = defaiteFinale;

  // Marque le combat comme gagné (appelé à la complétion de la séance finalboss).
  function onFinalBossComplete() {
    localStorage.setItem(FINAL_DONE_KEY, '1');
  }
  window.awakOnFinalBossComplete = onFinalBossComplete;

  // Écran de victoire épique du combat final.
  function showFinalBossVictory() {
    // v1479 : d'abord la CHUTE de l'Effaceur, puis l'épilogue, puis la victoire
    if (!window._awakChuteFaite) { window._awakChuteFaite = true; chuteEffaceur(showFinalBossVictory); return; }
    // v1504 : LA FIN se joue en cinématique (7 scènes + ton parcours) AVANT l'écran de
    // victoire. La scène « L'Ancre » est marquée vue (journal), sans être réaffichée.
    if (!window._awakFinaleFaite) {
      window._awakFinaleFaite = true;
      if (!window._awakFinEssai) { try { localStorage.setItem('awakStoryEvt_evt_fin_ancre', '1'); } catch (e) {} }
      finaleCinematique(showFinalBossVictory);
      return;
    }
    document.getElementById('awakFinalVictoryOverlay')?.remove();
    const ov = document.createElement('div');
    ov.id = 'awakFinalVictoryOverlay';
    ov.style.cssText = 'position:fixed;inset:0;z-index:99999;display:flex;align-items:flex-start;justify-content:center;background:radial-gradient(ellipse at 50% 30%,#1a0e0e,#050507 70%);animation:awakFadeIn 0.8s;padding:20px;overflow-y:auto;-webkit-overflow-scrolling:touch;';
    ov.innerHTML = `
      <style>@keyframes fbCrown{0%,100%{transform:translateY(0) scale(1);text-shadow:0 0 30px rgba(251,191,36,0.6)}50%{transform:translateY(-8px) scale(1.05);text-shadow:0 0 60px rgba(251,191,36,0.9)}}
      @keyframes fbGlow{0%,100%{opacity:0.5}50%{opacity:1}}</style>
      <div style="max-width:440px;width:100%;margin:auto 0;text-align:center;">
        <div style="display:flex;justify-content:center;margin-bottom:10px;animation:fbCrown 2.6s ease infinite;" data-emoji-keep>${window.AwakIcon ? AwakIcon.get('couronne', 64, '#fbbf24') : ''}</div>
        <div style="font-family:'Rajdhani',sans-serif;font-size:0.72em;letter-spacing:4px;color:#fbbf24;font-weight:700;animation:fbGlow 2s infinite;">L'EFFACEUR S'EST ÉTEINT</div>
        <h1 style="font-family:'Rajdhani',sans-serif;font-size:2.4em;font-weight:700;letter-spacing:3px;color:#fff;margin:10px 0 20px;text-shadow:0 0 40px rgba(251,191,36,0.5);">VICTOIRE</h1>
        <div style="background:linear-gradient(160deg,rgba(251,191,36,0.08),rgba(0,0,0,0.2));border:1px solid rgba(251,191,36,0.3);border-radius:16px;padding:22px 20px;margin-bottom:20px;text-align:left;">
          <p style="color:#94a3b8;font-size:0.82em;line-height:1.6;margin:0;">Tu reprends la route avec ${partenaire()}. Dehors, le monde est exactement le même — sauf qu'il ne s'efface plus.</p>
        </div>
        <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:16px;margin-bottom:20px;">
          <div style="font-size:0.7em;color:#fbbf24;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:6px;">Titre obtenu</div>
          <div style="font-family:'Rajdhani',sans-serif;font-size:1.4em;font-weight:700;color:#fff;">⚜️ Vainqueur du Déclin</div>

          <!-- 🕳️ EXPLICATION DES ABYSSES — le joueur vient de terminer l'histoire.
               Sans ce message, il ne sait pas qu'il reste du contenu et croit
               l'app finie. On explique la mécanique en deux phrases. -->
          <div style="background:linear-gradient(160deg,rgba(139,92,246,0.10),rgba(0,0,0,0.2));border:1px solid rgba(139,92,246,0.35);border-radius:14px;padding:16px;margin-top:14px;text-align:left;">
            <div style="display:flex;align-items:center;gap:9px;margin-bottom:9px;">
              <span style="font-size:1.6em;">🕳️</span>
              <div>
                <div style="font-size:0.62em;color:#a78bfa;font-weight:900;letter-spacing:1.5px;">NOUVEAU — SANS FIN</div>
                <div style="font-family:'Rajdhani',sans-serif;font-size:1.25em;font-weight:700;color:#fff;">Les Abysses s'ouvrent</div>
              </div>
            </div>
            <p style="color:#cbd5e1;font-size:0.82em;line-height:1.65;margin:0 0 10px;">
              Là où il s'est assis pendant quarante et un ans, la Faille ne s'est jamais refermée. Elle descend.
            </p>
            <p style="color:#94a3b8;font-size:0.78em;line-height:1.6;margin:0 0 10px;">
              Chaque palier est plus profond — et plus résistant — que le précédent. Il n'y a pas de dernier étage :
              la seule question est de savoir jusqu'où ton build peut aller.
            </p>
            <div style="font-size:0.74em;color:#a78bfa;line-height:1.55;">
              ◈ Un nouveau palier apparaît dès que tu fermes le précédent<br>
              ◈ Ta profondeur maximale devient ton record<br>
              ◈ Le butin s'améliore à mesure que tu descends
            </div>
          </div>
        </div>
        <button onclick="document.getElementById('awakFinalVictoryOverlay').remove();if(typeof switchTab==='function')switchTab('game');" style="width:100%;padding:16px;background:linear-gradient(135deg,#fbbf24,#dc2626);border:none;border-radius:14px;color:#1a0e0e;font-family:'Rajdhani',sans-serif;font-size:1em;font-weight:900;letter-spacing:2px;cursor:pointer;text-transform:uppercase;box-shadow:0 8px 30px rgba(251,191,36,0.3);">Retour</button>
      </div>`;
    document.body.appendChild(ov);
    window._awakChuteFaite = false;   // prochaine victoire : la chute rejouera
    window._awakFinaleFaite = false;
    window._awakFinEssai = false;
    try { if (typeof hapticTap === 'function') hapticTap([60,40,60,40,60,40,200]); } catch(e) {}
    try { if (typeof launchConfetti === 'function') launchConfetti(); } catch(e) {}
  }
  window.awakShowFinalBossVictory = showFinalBossVictory;

  // ═══════════════════════════════════════════════════════════════
  // v1504 : LA FIN — cinématique en 7 scènes (image plein écran + texte),
  // puis « Ton parcours » avec les vrais chiffres du joueur. Remplace
  // l'affichage de la scène « L'Ancre » (toujours marquée vue pour le journal).
  // ═══════════════════════════════════════════════════════════════
  function _scenesFin() {
    var P = parcours(), part = partenaire();
    var avec = P.noms.length
      ? "Derrière toi, des pas. " + listeNoms(P.noms) + ". Tous ceux qui ont marché avec toi jusqu'ici."
      : "Derrière toi, des pas. " + part + ". Personne ne lui a demandé de venir.";
    return [
      { img: 'fin_chute', titre: 'Il tombe', couleur: '#fbbf24', lignes: [
        "Le tourbillon d'or se tait d'un coup. Pour la première fois depuis quarante et un ans, Nabdano pose un genou à terre.",
        "Sa vraie forme se défait en flocons de lumière. Ce qui reste, c'est un homme. Seulement un homme, très fatigué."] },
      { img: 'fin_assis', titre: 'Il se rassoit', couleur: '#cbd5e1', lignes: [
        "Il se rassoit au milieu du blanc, là où il t'attendait. « Tu as gagné. » Ce n'est pas de la résignation. C'est un constat.",
        "Autour de lui, des visages apparaissent et s'effacent. Des rues. Une boulangerie. Une chanson que personne ne connaît plus.",
        "« Regarde tout ce que j'ai perdu en tenant. Combien de temps avant que toi aussi tu sois fatigué ? Assieds-toi. »"] },
      { img: 'fin_main', titre: 'La main', couleur: '#a5b4fc', lignes: [
        "Pour la première fois, le Système n'affiche aucune commande. Aucune attaque. Rien.",
        "Tu tends la main. Il la regarde sans comprendre. « Qu'est-ce que tu fais. »",
        "« Tu n'avais pas tort d'être fatigué. Tu avais tort de croire que tu devais porter le monde seul. »"] },
      { img: 'fin_compagnons', titre: 'Ceux qui sont venus', couleur: '#c084fc', lignes: [
        avec,
        "Nabdano les regarde. Longtemps. Ses mains tremblent. « …Voilà ce que je n'avais pas. »"] },
      { img: 'fin_depart', titre: 'Parti', couleur: '#e2e8f0', lignes: [
        "Il ne sourit pas. Il ne demande pas pardon. Quelque chose se défait, simplement. « Alors… vous pouvez continuer sans moi. »",
        "Il s'efface. Pas comme le monde s'efface : plus doucement. Comme quelqu'un qu'on laisse enfin dormir.",
        "« Il est parti, » affiche le Système. « Pas effacé. Parti. Ce n'est pas la même chose. »"] },
      { img: 'fin_monde', titre: 'Le monde revient', couleur: '#fbbf24', lignes: [
        "Le blanc recule. Les couleurs reviennent sur les façades, rue après rue. Les noms reviennent sur les plaques.",
        "Une boulangerie rallume sa lumière. Quelque part, quelqu'un fredonne une chanson qu'on croyait perdue."] },
      { img: 'fin_aube', titre: 'L’aube', couleur: '#fdba74', lignes: [
        "Sur un toit, au lever du jour, vous regardez la ville respirer. " + part + " te donne un coup d'épaule. « On a réussi. »",
        "« Tu peux te reposer, maintenant, » affiche le Système. « Ce n'est plus la même chose qu'abandonner. Tu le sais. »"] }
    ];
  }
  function _chiffresFin() {
    var P = parcours(), jours = 0, niv = niveauJoueur(), failles = 0;
    try {
      var h = typeof window.getWorkoutHistory === 'function' ? (window.getWorkoutHistory() || []) : [];
      var t = h.map(function (s) { return s && s.date ? new Date(s.date).getTime() : NaN; }).filter(function (x) { return !isNaN(x); });
      if (t.length) jours = Math.max(1, Math.round((Date.now() - Math.min.apply(null, t)) / 86400000) + 1);
    } catch (e) {}
    try { failles = typeof window.awakGetRiftsCompletedTotal === 'function' ? (window.awakGetRiftsCompletedTotal() || 0) : 0; } catch (e) {}
    var l = [];
    if (P.seances) l.push([P.seances, 'séances']);
    if (jours) l.push([jours, 'jours depuis le premier']);
    if (P.serie > 1) l.push([P.serie, 'jours de suite, au mieux']);
    if (failles) l.push([failles, 'Failles fermées']);
    l.push([niv, 'niveau atteint']);
    l.push([P.noms.length, 'compagnon' + (P.noms.length > 1 ? 's' : '') + ' à tes côtés']);
    return l;
  }
  function finaleCinematique(apres) {
    var scenes = _scenesFin(), si = 0, li = 0;
    var dejaVue = false;
    try { dejaVue = localStorage.getItem('awakFinaleVue') === '1'; } catch (e) {}
    if (!document.getElementById('awakFinaleCss')) {
      var st = document.createElement('style'); st.id = 'awakFinaleCss';
      st.textContent = '@keyframes afKen{0%{transform:scale(1)}100%{transform:scale(1.09)}}'
        + '@keyframes afTxt{0%{opacity:0;transform:translateY(8px)}100%{opacity:1;transform:none}}'
        + '@keyframes afTitre{0%{opacity:0;letter-spacing:.5em}100%{opacity:1;letter-spacing:.18em}}'
        + '#awakFinale .af-img{position:absolute;inset:0;background-size:cover;background-position:center top;transition:opacity 1.1s ease;animation:afKen 14s ease-out forwards;}'
        + '@media(prefers-reduced-motion:reduce){#awakFinale *{animation:none!important;transition:none!important}}';
      document.head.appendChild(st);
    }
    var ov = document.createElement('div');
    ov.id = 'awakFinale';
    ov.setAttribute('data-emoji-keep', '');
    ov.style.cssText = 'position:fixed;inset:0;z-index:100000;background:#030306;overflow:hidden;color:#f1f5f9;';
    ov.innerHTML = '<div class="af-fond" style="position:absolute;inset:0;"></div>'
      + '<div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(3,3,6,0.1) 0%,rgba(3,3,6,0.35) 40%,rgba(3,3,6,0.88) 64%,#030306 100%);pointer-events:none;"></div>'
      + (dejaVue ? '<button class="af-passer" style="position:absolute;top:calc(14px + env(safe-area-inset-top));right:14px;z-index:3;min-height:0;padding:7px 13px;border-radius:99px;border:1px solid rgba(255,255,255,0.25);background:rgba(0,0,0,0.45);color:#e2e8f0;font-size:12px;font-weight:700;cursor:pointer;">Passer</button>' : '')
      + '<div class="af-bas" style="position:absolute;left:0;right:0;bottom:0;z-index:2;padding:20px 22px calc(26px + env(safe-area-inset-bottom));display:flex;justify-content:center;"></div>';
    document.body.appendChild(ov);
    var fond = ov.querySelector('.af-fond'), bas = ov.querySelector('.af-bas');
    function poserImage(nom) {
      var d = document.createElement('div'); d.className = 'af-img'; d.style.opacity = '0';
      d.style.backgroundImage = 'url(images/story/' + nom + '.webp),url(images/story/fin_ancre.webp)';
      fond.appendChild(d);
      requestAnimationFrame(function () { requestAnimationFrame(function () { d.style.opacity = '1'; }); });
      var vieux = fond.querySelectorAll('.af-img');
      if (vieux.length > 1) setTimeout(function () { for (var k = 0; k < vieux.length - 1; k++) vieux[k].remove(); }, 1200);
    }
    function rendreTexte() {
      var s = scenes[si], dern = li >= s.lignes.length - 1, fin = dern && si >= scenes.length - 1;
      bas.innerHTML = '<div style="max-width:440px;width:100%;text-align:center;">'
        + (li === 0 ? '<div style="font-family:var(--font-display),sans-serif;font-size:12px;font-weight:700;color:' + s.couleur + ';text-transform:uppercase;margin-bottom:10px;text-shadow:0 2px 8px #000;animation:afTitre 1.2s ease-out both;">' + s.titre + '</div>' : '<div style="height:24px;"></div>')
        + '<p style="font-size:1.02em;line-height:1.75;margin:0 0 22px;min-height:110px;text-shadow:0 1px 6px rgba(0,0,0,0.95);animation:afTxt .6s ease-out both;">' + s.lignes[li] + '</p>'
        + '<div style="display:flex;justify-content:center;gap:5px;margin-bottom:16px;">' + scenes.map(function (_, k) { return '<span style="width:' + (k === si ? 18 : 6) + 'px;height:6px;border-radius:99px;background:' + (k <= si ? s.couleur : 'rgba(255,255,255,0.2)') + ';transition:width .3s;"></span>'; }).join('') + '</div>'
        + '<button class="af-suivant" style="width:100%;padding:15px;border:none;border-radius:14px;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.22);color:#fff;font-family:var(--font-display),sans-serif;font-weight:700;font-size:1em;letter-spacing:1px;cursor:pointer;">' + (fin ? 'Ton parcours' : 'Continuer') + '</button>'
        + '</div>';
      bas.querySelector('.af-suivant').onclick = avancer;
    }
    function avancer() {
      var s = scenes[si];
      if (li < s.lignes.length - 1) { li++; rendreTexte(); return; }
      if (si < scenes.length - 1) { si++; li = 0; poserImage(scenes[si].img); rendreTexte(); return; }
      parcoursFinal();
    }
    function parcoursFinal() {
      var ch = _chiffresFin();
      fond.innerHTML = ''; poserImage('fin_aube'); fond.style.transition = 'opacity 1s'; fond.style.opacity = '0.4';
      bas.parentNode.querySelector('.af-passer') && bas.parentNode.querySelector('.af-passer').remove();
      bas.style.top = '0'; bas.style.alignItems = 'center'; bas.style.overflowY = 'auto';
      bas.innerHTML = '<div style="max-width:420px;width:100%;text-align:center;margin:auto 0;">'
        + '<div style="font-family:var(--font-display),sans-serif;font-size:12px;font-weight:700;color:#fbbf24;animation:afTitre 1.4s ease-out both;">FIN</div>'
        + '<h1 style="font-family:var(--font-display),sans-serif;font-size:clamp(34px,10vw,52px);color:#fff !important;margin:6px 0 4px;letter-spacing:4px;text-shadow:0 0 30px rgba(251,191,36,0.55);animation:afTxt 1s .3s ease-out both;">AWAKENED</h1>'
        + '<p style="color:#e2e8f0;font-size:.95em;margin:0 0 20px;font-style:italic;animation:afTxt 1s .6s ease-out both;">Tu as tenu. Chaque séance a compté.</p>'
        + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:20px;">'
        + ch.map(function (c, k) { return '<div style="padding:12px 8px;border-radius:12px;background:rgba(3,3,6,0.6);border:1px solid rgba(251,191,36,0.28);animation:afTxt .6s ' + (0.9 + k * 0.15).toFixed(2) + 's ease-out both;">'
          + '<div style="font-family:var(--font-display),sans-serif;font-size:1.6em;font-weight:700;color:#fbbf24;font-variant-numeric:tabular-nums;">' + Number(c[0]).toLocaleString('fr-FR') + '</div>'
          + '<div style="font-size:.72em;color:#cbd5e1;font-weight:700;">' + c[1] + '</div></div>'; }).join('')
        + '</div>'
        + '<p style="color:#94a3b8;font-size:.82em;line-height:1.6;margin:0 0 20px;">Le monde ne s\'efface plus. Ce n\'est pas un pouvoir qui l\'a sauvé : c\'est toi, une séance à la fois.</p>'
        + '<button class="af-fin" style="width:100%;padding:16px;border:none;border-radius:14px;background:linear-gradient(135deg,#fbbf24,#dc2626);color:#1a0e0e;font-family:var(--font-display),sans-serif;font-weight:700;font-size:1.05em;letter-spacing:1px;cursor:pointer;">Continuer</button>'
        + '</div>';
      bas.querySelector('.af-fin').onclick = terminer;
      try { if (typeof launchConfetti === 'function') launchConfetti(); } catch (e) {}
    }
    var fini = false;
    function terminer() {
      if (fini) return; fini = true;
      try { if (!window._awakFinEssai) localStorage.setItem('awakFinaleVue', '1'); } catch (e) {}
      ov.style.transition = 'opacity .7s'; ov.style.opacity = '0';
      setTimeout(function () { ov.remove(); if (typeof apres === 'function') apres(); }, 700);
    }
    var bp = ov.querySelector('.af-passer'); if (bp) bp.onclick = function () { parcoursFinal(); };
    poserImage(scenes[0].img);
    rendreTexte();
    try { if (navigator.vibrate) navigator.vibrate(40); } catch (e) {}
  }
  window.awakFinaleCinematique = finaleCinematique;

  // Affiche un beat narratif du combat final en plein écran (lignes paginées),
  // puis appelle onDone() quand le joueur a tout lu.
  function showFinalStoryBeat(beat, onDone) {
    // v1479 : carte d'acte plein écran (nom de l'acte + l'Effaceur + sa phrase), puis le texte
    if (beat && beat._acte && !beat._carteVue && window.AwakRiftVis && AwakRiftVis.bossIntro) {
      beat._carteVue = true;
      try { if (beat._acte.climax && window.AwakMusique && AwakMusique.intensifier) AwakMusique.intensifier(); } catch (e) {}
      AwakRiftVis.bossIntro({ nom: beat._acte.titre, sousTitre: beat._acte.num, couleur: beat._color || '#dc2626', ligne: beat._acte.ligne,
        monstreNom: 'L’Effaceur', duree: 3800, apres: function () { showFinalStoryBeat(beat, onDone); } });
      return;
    }
    document.getElementById('awakFinalStoryOverlay')?.remove();
    const color = beat._color || '#dc2626';
    const lines = beat.instructions || [];
    let i = 0;
    const ov = document.createElement('div');
    ov.id = 'awakFinalStoryOverlay';
    ov.style.cssText = 'position:fixed;inset:0;z-index:99997;display:flex;align-items:flex-start;justify-content:center;background-color:#050507;'
      + 'background-image:linear-gradient(180deg,rgba(5,5,7,0.15) 0%,rgba(5,5,7,0.45) 38%,rgba(5,5,7,0.9) 62%,#050507 100%),radial-gradient(ellipse at 50% 25%,' + color + '22,transparent 70%),'
      + 'url(' + (beat._fond || 'images/story/nabdano.webp') + '),url(images/story/nabdano.webp);'
      + 'background-size:cover,cover,cover,cover;background-position:center top,center,center top,center top;background-repeat:no-repeat;'
      + 'animation:awakFadeIn 0.5s;padding:20px 20px calc(24px + env(safe-area-inset-bottom));overflow-y:auto;-webkit-overflow-scrolling:touch;';

    function render() {
      const isLast = i >= lines.length - 1;
      ov.innerHTML = `
        <div style="max-width:440px;width:100%;margin:auto 0 0;text-align:center;">
          <div style="font-family:'Rajdhani',sans-serif;font-size:1.5em;font-weight:700;letter-spacing:2px;color:${color};margin-bottom:18px;text-shadow:0 0 30px ${color}66,0 2px 8px #000;">${beat.name}</div>
          <p style="color:#f1f5f9;font-size:1em;line-height:1.75;margin:0 0 24px;min-height:120px;animation:awakFadeIn 0.4s;text-shadow:0 1px 6px rgba(0,0,0,0.9);">${lines[i] || ''}</p>
          <div style="display:flex;align-items:center;justify-content:center;gap:6px;margin-bottom:20px;">
            ${lines.map((_, k) => `<div style="width:7px;height:7px;border-radius:50%;background:${k === i ? color : 'rgba(255,255,255,0.2)'};"></div>`).join('')}
          </div>
          <button id="fbStoryNext" style="width:100%;padding:15px;background:linear-gradient(135deg,${color},${color}cc);border:none;border-radius:14px;color:#fff;font-family:'Rajdhani',sans-serif;font-weight:900;font-size:0.95em;letter-spacing:2px;cursor:pointer;text-transform:uppercase;box-shadow:0 6px 24px ${color}40;">${isLast ? '⚔ Commencer' : 'Continuer ›'}</button>
        </div>`;
      ov.querySelector('#fbStoryNext').onclick = function () {
        if (i < lines.length - 1) { i++; render(); }
        else { ov.remove(); if (onDone) onDone(); }
      };
    }
    render();
    document.body.appendChild(ov);
    try { if (typeof hapticTap === 'function') hapticTap([40]); } catch (e) {}
  }
  window.awakShowFinalStoryBeat = showFinalStoryBeat;

  // v1479 : changement de PHASE (75 / 50 / 25 %) — fenêtre d'événement
  var PALIERS = {
    1: { sous: 'PHASE 2', nom: 'Il se lève', ligne: 'Pour la première fois depuis quarante et un ans, Nabdano se lève.', couleur: '#a855f7' },
    2: { sous: 'PHASE 3', nom: 'Le blanc s\'épaissit', ligne: 'Son aura vire au rouge. Il durcit : tes coups portent un peu moins.', couleur: '#dc2626' },
    3: { sous: 'DERNIÈRE PHASE', nom: 'Sa vraie forme', ligne: 'Il libère tout ce qu\'il retenait depuis quarante et un ans. Ses ripostes n\'ont jamais été aussi fortes. Tiens bon.', couleur: '#fbbf24' }
  };
  function palierFinal(n) {
    var P = PALIERS[n]; if (!P || !window.AwakRiftVis || !AwakRiftVis.bossIntro) return;
    try { if (n === 3 && window.AwakMusique && AwakMusique.intensifier) AwakMusique.intensifier(); } catch (e) {}
    AwakRiftVis.bossIntro({ nom: P.nom, sousTitre: P.sous, couleur: P.couleur, ligne: P.ligne, monstreNom: ['', 'L’Effaceur', 'L’Effaceur rouge', 'L’Effaceur ultime'][n] || 'L’Effaceur', duree: 3200 });
  }
  window.awakFinalPalier = palierFinal;
  window.awakFinalPhaseCouleur = function (ph) { return ['#e2e8f0', '#a855f7', '#dc2626', '#fbbf24'][ph || 0] || '#dc2626'; };

  // v1479 : CHUTE de l'Effaceur — éclair blanc, il se désagrège en fragments
  function chuteEffaceur(apres) {
    var calme = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var ov = document.createElement('div');
    ov.id = 'awakFinalChute';
    ov.setAttribute('data-emoji-keep', '');
    if (!document.getElementById('awakFinalChuteCss')) {
      var st = document.createElement('style'); st.id = 'awakFinalChuteCss';
      st.textContent = '@keyframes fcFlash{0%{opacity:1}100%{opacity:0}}'
        + '@keyframes fcTremble{0%,100%{transform:translate(0,0)}10%{transform:translate(-8px,4px)}20%{transform:translate(7px,-5px)}30%{transform:translate(-6px,-2px)}40%{transform:translate(5px,5px)}50%{transform:translate(-3px,2px)}60%{transform:translate(2px,-2px)}}'
        + '@keyframes fcEfface{0%{opacity:1;filter:brightness(1) blur(0);transform:scale(1)}35%{filter:brightness(2.6) blur(0)}100%{opacity:0;filter:brightness(3) blur(14px);transform:scale(1.12) translateY(-20px)}}'
        + '@keyframes fcFrag{0%{opacity:1;transform:translate(0,0) rotate(0)}100%{opacity:0;transform:translate(var(--dx),var(--dy)) rotate(var(--r))}}'
        + '@keyframes fcTitre{0%{opacity:0;letter-spacing:.6em;filter:blur(8px)}100%{opacity:1;letter-spacing:.12em;filter:none}}'
        + '@media(prefers-reduced-motion:reduce){#awakFinalChute *{animation:none!important}}';
      document.head.appendChild(st);
    }
    var frags = '';
    for (var i = 0; i < (calme ? 0 : 34); i++) {
      var a = Math.random() * Math.PI * 2, d = 120 + Math.random() * 260;
      frags += '<span style="position:absolute;left:50%;top:44%;width:' + (4 + Math.random() * 9).toFixed(0) + 'px;height:' + (3 + Math.random() * 6).toFixed(0) + 'px;background:#f8fafc;box-shadow:0 0 10px #fff;'
        + '--dx:' + Math.round(Math.cos(a) * d) + 'px;--dy:' + Math.round(Math.sin(a) * d - 60) + 'px;--r:' + Math.round(Math.random() * 720 - 360) + 'deg;'
        + 'animation:fcFrag ' + (1.6 + Math.random() * 1.4).toFixed(2) + 's ' + (1.1 + Math.random() * 0.8).toFixed(2) + 's ease-out both;"></span>';
    }
    var img = (window.AwakRiftVis && AwakRiftVis.monstre) ? AwakRiftVis.monstre('L’Effaceur ultime', '#f8fafc', Math.min(300, Math.round(window.innerWidth * 0.7)), false) : '';
    ov.style.cssText = 'position:fixed;inset:0;z-index:100001;overflow:hidden;background:#030306;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;text-align:center;padding:24px;';
    ov.innerHTML = '<div style="position:relative;animation:fcTremble .9s ease-in-out .2s both;">'
      +   '<div style="animation:fcEfface 2.4s 1s ease-in both;">' + img + '</div></div>'
      + frags
      + '<div style="font-family:var(--font-display),sans-serif;font-size:13px;letter-spacing:8px;color:#fbbf24;font-weight:700;opacity:0;animation:fcTitre 1s 2.6s ease-out forwards;">LE BLANC SE DÉCHIRE</div>'
      + '<div style="font-family:var(--font-display),sans-serif;font-size:clamp(30px,9vw,46px);color:#fff !important;font-weight:700;line-height:1.1;text-shadow:0 0 30px #fbbf24;opacity:0;animation:fcTitre 1.1s 3s ease-out forwards;">L\'Effaceur est tombé</div>'
      + '<div style="position:absolute;inset:0;background:#fff;pointer-events:none;animation:fcFlash .9s ease-out both;"></div>';
    var fini = false;
    function fin() { if (fini) return; fini = true; ov.style.transition = 'opacity .6s'; ov.style.opacity = '0'; setTimeout(function () { ov.remove(); if (apres) apres(); }, 600); }
    ov.addEventListener('click', function () { if (Date.now() - t0 > 2500) fin(); });
    var t0 = Date.now();
    document.body.appendChild(ov);
    try { if (navigator.vibrate) navigator.vibrate([120, 60, 120, 60, 400]); } catch (e) {}
    setTimeout(fin, calme ? 3200 : 6200);
  }
  window.awakFinalChute = chuteEffaceur;

})();
