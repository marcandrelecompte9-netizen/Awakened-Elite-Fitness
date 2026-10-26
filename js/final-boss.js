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
    var pvToi = _pvPour(coups);
    var pvMin = _pvPour(_coups(workout, statsReference(niv)));
    var pv = Math.max(pvToi, pvMin);
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

  // ⚔️ Applique les dégâts d'un exercice terminé à l’Effaceur.
  // Appelé par app.js à la fin de chaque exercice du combat final.
  // C'est ici que le BUILD du joueur compte : la stat de l'acte domine (70 %),
  // la polyvalence complète (30 %) — un spécialisé écrase son acte et rame
  // ailleurs, un polyvalent avance régulièrement.
  function frapperMonarque(workout, exercice, repsFaites) {
    if (!workout || !workout._isFinalBoss || !exercice) return null;
    calibrer(workout);
    var acte = exercice._act || 'force';
    var unites = 1;
    if (exercice.mode === 'timer' && exercice.duration) unites = Math.max(1, exercice.duration / 30);
    else if (exercice.targetReps || exercice.reps) unites = Math.max(1, (exercice.targetReps || exercice.reps) / 12);
    // v1480 : l'EFFORT compte — reps faites / objectif (×0,5 à ×1,5)
    var effort = 1, obj = exercice.targetReps || exercice.reps;
    if (exercice.mode !== 'timer' && obj && repsFaites > 0) effort = Math.max(0.5, Math.min(1.5, repsFaites / obj));
    var degats = Math.round(actDamage(acte, unites) * effort);
    // v1479 : PHASES de l'Effaceur. Sous 50 % il durcit (×0,9) jusqu'à la fin ;
    // sous 25 % ce sont ses ripostes qui montent (×1,45).
    var max = workout._bossHpMax || 1;
    var avant = (workout._bossHp || 0) / max * 100;
    var ph = workout._phase || 0;
    if (ph >= 2) degats = Math.round(degats * 0.9);   // v1491 : plus de bonus +30 % en dernière phase
    workout._bossHp = Math.max(0, (workout._bossHp || 0) - degats);
    var apres = workout._bossHp / max * 100;
    var palier = null;
    [[75, 1], [50, 2], [25, 3]].forEach(function (s) {
      if (avant > s[0] && apres <= s[0] && workout._bossHp > 0 && (workout._phase || 0) < s[1]) { workout._phase = s[1]; palier = s[1]; }
    });
    workout._dernierCoup = { dmg: degats, t: Date.now() };
    if (workout._bossHp <= 0) workout._bossVaincu = true;   // v1487 : seule preuve de victoire
    var riposte = workout._bossHp > 0 ? riposteEffaceur(workout) : null;
    return {
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
    // Sur tout le combat, le chasseur de référence encaisse ≈ 1,6 × ses PV (avant
    // blocage, esquive et régénération) : il finit à la limite, un chasseur équipé tient.
    workout._riposteBase = Math.max(4, Math.round(1.6 * refPV / (n * 1.2)));
    return workout._riposteBase;
  }
  function riposteEffaceur(workout) {
    joueurInit(workout);
    if (workout._joueurMort) return null;
    var b = {};
    try { b = typeof window.awakComputeStatBonuses === 'function' ? window.awakComputeStatBonuses() : {}; } catch (e) {}
    var res = { dmg: 0, esquive: false, bloque: 0, soin: 0, releve: false, mort: false };
    // Régénération END après ta série (avant le coup)
    var regen = Math.round((b.hpRegen || 0) * (b.hpRegenMult || 1));
    if (regen > 0 && workout._joueurPV < workout._joueurPVMax) {
      var av = workout._joueurPV;
      workout._joueurPV = Math.min(workout._joueurPVMax, workout._joueurPV + regen);
      res.soin = workout._joueurPV - av;
    }
    try { if (typeof window.awakIsInvincible === 'function' && window.awakIsInvincible()) return res; } catch (e) {}
    if (Math.random() < (b.dodgeChance || 0)) { res.esquive = true; workout._derniereRiposte = { esquive: true, t: Date.now() }; return res; }
    var ph = workout._phase || 0;
    var mult = [1, 1.1, 1.25, 1.45][ph] || 1;
    var brut = _coupRiposte(workout) * mult * (0.85 + Math.random() * 0.3);
    var vit = 0;
    try { vit = (window.awakGetTotalStats ? window.awakGetTotalStats() : {}).VIT || 0; } catch (e) {}
    var red = Math.min(0.40, vit / (vit + 300));
    var dmg = Math.max(1, Math.round(brut * (1 - red)));
    res.bloque = Math.max(0, Math.round(brut) - dmg);
    res.dmg = dmg;
    workout._joueurPV = Math.max(0, workout._joueurPV - dmg);
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
    // L'épilogue (scène « L'Ancre ») se joue AVANT l'écran de victoire.
    // (v1482 : pas pendant un essai du mode développeur — la scène resterait « vue »)
    if (!window._awakFinEssai) try {
      var fin = (window.STORY_EVENTS || []).find(function (e) { return e.id === 'evt_fin_ancre'; });
      if (fin && typeof window.storyEventSeen === 'function' && !window.storyEventSeen('evt_fin_ancre')
          && typeof window.storyShowEvent === 'function') {
        localStorage.setItem('awakStoryEvt_evt_fin_ancre', '1');
        window.storyShowEvent(fin);
        if (window.AwakCine && window.AwakCine.defer(showFinalBossVictory)) return;
      }
    } catch (e) {}
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
          <p style="color:#e2e8f0;font-size:0.92em;line-height:1.7;margin:0 0 14px;font-style:italic;">« Tu peux te reposer, maintenant, » affiche le Système. « Ce n'est plus la même chose qu'abandonner. Tu le sais. »</p>
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
    window._awakFinEssai = false;
    try { if (typeof hapticTap === 'function') hapticTap([60,40,60,40,60,40,200]); } catch(e) {}
    try { if (typeof launchConfetti === 'function') launchConfetti(); } catch(e) {}
  }
  window.awakShowFinalBossVictory = showFinalBossVictory;

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
    ov.style.cssText = 'position:fixed;inset:0;z-index:99997;display:flex;align-items:flex-start;justify-content:center;background:radial-gradient(ellipse at 50% 25%,' + color + '18,#050507 70%);backdrop-filter:blur(8px);animation:awakFadeIn 0.5s;padding:20px;overflow-y:auto;-webkit-overflow-scrolling:touch;';

    function render() {
      const isLast = i >= lines.length - 1;
      ov.innerHTML = `
        <div style="max-width:440px;width:100%;margin:auto 0;text-align:center;">
          <div style="font-family:'Rajdhani',sans-serif;font-size:1.5em;font-weight:700;letter-spacing:2px;color:${color};margin-bottom:24px;text-shadow:0 0 30px ${color}66;">${beat.name}</div>
          <p style="color:#e2e8f0;font-size:1em;line-height:1.75;margin:0 0 28px;min-height:120px;animation:awakFadeIn 0.4s;">${lines[i] || ''}</p>
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
