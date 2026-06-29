/* ============================================================================
 *  AWAKENED — Registre des disciplines d'entraînement
 *  Brique 1 : MÉTADONNÉES UNIQUEMENT (aucune logique, aucun comportement modifié)
 *
 *  Modèle « programme principal + compléments » :
 *    - role: 'principal'  -> peut occuper le slot de programme actif (squelette de semaine)
 *    - role: 'complement' -> séance récurrente posée sur des jours précis (rituel)
 *    (un id peut servir aux deux ; `role` n'est qu'un défaut suggéré pour l'UI)
 *
 *  Champ `discipline` sur les exercices : OPTIONNEL et rétro-compatible.
 *  Un exercice sans `discipline` est implicitement 'muscu'. Voir getExerciseDiscipline().
 *
 *  Modes d'exécution :
 *    'reps'     -> séries × répétitions (modèle muscu classique)
 *    'timer'    -> tenue/durée (isométrie, mobilité)
 *    'round'    -> intervalles travail/repos en rounds (boxe, HIIT)
 *    'distance' -> distance / allure / temps (course, natation)
 *    'mixed'    -> combinaison (calisthénie : reps + tenues)
 * ========================================================================== */

(function (global) {
  'use strict';

  var DISCIPLINES = {
    muscu: {
      id: 'muscu',
      name: 'Musculation',
      emoji: '🏋️',
      color: '#22c55e',
      voie: null,                 // discipline par défaut, pas de « Voie » thématique
      mode: 'reps',
      role: 'principal',
      tagline: 'Force et hypertrophie, groupe par groupe.'
    },
    boxe: {
      id: 'boxe',
      name: 'Boxe',
      emoji: '🥊',
      color: '#ef4444',
      voie: "La Voie de l'Arène",
      mode: 'round',
      role: 'principal',
      tagline: 'Combos, footwork et conditionnement en rounds.'
    },
    calisthenie: {
      id: 'calisthenie',
      name: 'Calisthénie',
      emoji: '🤸',
      color: '#a855f7',
      voie: 'La Voie du Corps',
      mode: 'mixed',
      role: 'principal',
      tagline: 'Maîtrise du poids du corps et skills à débloquer.'
    },
    course: {
      id: 'course',
      name: 'Course / Marathon',
      emoji: '🏃',
      color: '#3b82f6',
      voie: 'La Longue Marche',
      mode: 'distance',
      role: 'principal',
      tagline: 'Plans périodisés du 5 km au marathon.'
    },
    mobilite: {
      id: 'mobilite',
      name: 'Mobilité',
      emoji: '🧘',
      color: '#14b8a6',
      voie: 'La Voie du Souffle',
      mode: 'timer',
      role: 'complement',
      tagline: 'Flows de souplesse et récupération active.'
    },
    hiit: { id: 'hiit', name: 'HIIT', emoji: '🔥', color: '#f97316', voie: 'La Voie de la Fournaise', mode: 'round', role: 'principal', tagline: 'Circuits métaboliques haute intensité.' },
    core: { id: 'core', name: 'Gainage', emoji: '🧱', color: '#eab308', voie: 'La Voie du Roc', mode: 'timer', role: 'principal', tagline: 'Sangle abdominale et stabilité.' },
    yoga: { id: 'yoga', name: 'Yoga', emoji: '🪷', color: '#a78bfa', voie: 'La Voie du Zen', mode: 'timer', role: 'principal', tagline: 'Flows, postures et respiration.' },
    pilates: { id: 'pilates', name: 'Pilates', emoji: '🌸', color: '#f472b6', voie: 'La Voie du Centre', mode: 'timer', role: 'principal', tagline: 'Renforcement profond, posture et contrôle.' },
    barre: { id: 'barre', name: 'Barre', emoji: '🩰', color: '#fb7185', voie: 'La Voie de la Grâce', mode: 'timer', role: 'principal', tagline: 'Petits mouvements pulsés inspirés du ballet.' },
    serenite: { id: 'serenite', name: 'Sérénité', emoji: '🌬️', color: '#5eead4', voie: 'La Voie du Souffle', mode: 'timer', role: 'principal', tagline: 'Respiration guidée et méditation anti-stress.' }
  };

  // Ordre d'affichage stable (pour les listes/sélecteurs des briques suivantes)
  var DISCIPLINE_ORDER = ['muscu', 'boxe', 'calisthenie', 'course', 'hiit', 'core', 'yoga', 'pilates', 'barre', 'serenite', 'mobilite'];

  /* ---- Accesseurs purs (additifs, sans effet de bord) ------------------- */

  // Retourne la fiche d'une discipline, ou null si inconnue.
  function getDiscipline(id) {
    return (id && DISCIPLINES[id]) ? DISCIPLINES[id] : null;
  }

  // Liste ordonnée de toutes les disciplines.
  function listDisciplines() {
    return DISCIPLINE_ORDER.map(function (id) { return DISCIPLINES[id]; });
  }

  // Liste filtrée par rôle suggéré ('principal' | 'complement').
  function listDisciplinesByRole(role) {
    return listDisciplines().filter(function (d) { return d.role === role; });
  }

  // Discipline d'un exercice — rétro-compatible : défaut 'muscu'.
  function getExerciseDiscipline(ex) {
    return (ex && ex.discipline) ? ex.discipline : 'muscu';
  }

  /* ========================================================================
   *  CONTENU — BOXE (brique 5)
   *  Dataset SÉPARÉ de exerciseDatabase : ces exercices ne passent jamais par
   *  le générateur de séance muscu. Tous en poids du corps (shadow) → la séance
   *  survit au filtre d'équipement de l'écran de préparation.
   *  mode:'timer' + duration => autonomes dans le lecteur de séance.
   * ====================================================================== */

  var BOXE_EXERCISES = [
    {
      name: "Échauffement & garde", muscle: "Cardio", difficulty: "Débutant",
      type: "exercise", equipment: ["Poids du corps"], mode: "timer", discipline: "boxe",
      description: "Mise en route articulaire et mise en garde.",
      instructions: ["Rotations épaules et poignets", "Pieds largeur d'épaules, pied avant en avant", "Mains hautes, coudes serrés, menton rentré", "Petits sautillements pour rester léger"],
      tips: "La garde haute protège le menton dès le départ.", duration: 180
    },
    {
      name: "Shadow Boxing", muscle: "Cardio", difficulty: "Débutant",
      type: "exercise", equipment: ["Poids du corps"], mode: "timer", discipline: "boxe",
      description: "Boxe à vide : coups, déplacements et respiration.",
      instructions: ["Enchaîne jabs et directs souples", "Bouge en permanence sur les appuis", "Reviens toujours en garde après chaque coup", "Respire en expirant sur le coup"],
      tips: "Vise la fluidité, pas la puissance.", duration: 180
    },
    {
      name: "Jab – Cross (1-2)", muscle: "Épaules", difficulty: "Débutant",
      type: "exercise", equipment: ["Poids du corps"], mode: "timer", discipline: "boxe",
      description: "Le combo fondamental : direct bras avant puis arrière.",
      instructions: ["Jab du bras avant, épaule qui protège le menton", "Cross du bras arrière en pivotant la hanche", "Pivote le pied arrière sur le cross", "Reviens en garde immédiatement"],
      tips: "La puissance vient de la rotation des hanches.", duration: 120
    },
    {
      name: "Jab – Cross – Crochet (1-2-3)", muscle: "Corps entier", difficulty: "Intermédiaire",
      type: "exercise", equipment: ["Poids du corps"], mode: "timer", discipline: "boxe",
      description: "Combo en trois temps, direct-direct-crochet.",
      instructions: ["Jab, puis cross", "Enchaîne un crochet du bras avant", "Coude à 90°, rotation du buste sur le crochet", "Garde haute entre chaque enchaînement"],
      tips: "Garde le rythme : 1-2-3 puis remise en garde.", duration: 120
    },
    {
      name: "Crochets gauche-droite", muscle: "Épaules", difficulty: "Intermédiaire",
      type: "exercise", equipment: ["Poids du corps"], mode: "timer", discipline: "boxe",
      description: "Alternance de crochets en pivotant le buste.",
      instructions: ["Crochet bras avant, coude à hauteur d'épaule", "Crochet bras arrière en pivotant la hanche", "Reste compact, ne télégraphie pas le coup", "Souffle sur chaque impact"],
      tips: "Le mouvement part des jambes et des hanches.", duration: 90
    },
    {
      name: "Uppercuts", muscle: "Épaules", difficulty: "Intermédiaire",
      type: "exercise", equipment: ["Poids du corps"], mode: "timer", discipline: "boxe",
      description: "Coups remontants, alternés.",
      instructions: ["Fléchis légèrement les genoux", "Remonte le poing du bas vers le haut", "Pousse sur la jambe du même côté", "Garde l'autre main en protection"],
      tips: "Ne baisse jamais la garde opposée.", duration: 90
    },
    {
      name: "Esquives (slips)", muscle: "Obliques", difficulty: "Intermédiaire",
      type: "exercise", equipment: ["Poids du corps"], mode: "timer", discipline: "boxe",
      description: "Esquives latérales de la tête, gainage.",
      instructions: ["Fléchis les jambes, bascule le buste à gauche", "Puis à droite, comme pour esquiver un direct", "Garde toujours les mains hautes", "Garde les yeux vers l'avant"],
      tips: "Bouge la tête de la ligne, pas juste les épaules.", duration: 90
    },
    {
      name: "Déplacements (footwork)", muscle: "Cardio", difficulty: "Débutant",
      type: "exercise", equipment: ["Poids du corps"], mode: "timer", discipline: "boxe",
      description: "Travail d'appuis : avant, arrière, latéral.",
      instructions: ["Pas chassés : le pied directeur mène", "Avance, recule, gauche, droite", "Ne croise jamais les pieds", "Reste léger sur l'avant des pieds"],
      tips: "Des appuis solides = des coups puissants.", duration: 90
    },
    {
      name: "Finisher — Burpees boxe", muscle: "Cardio", difficulty: "Intermédiaire",
      type: "exercise", equipment: ["Poids du corps"], mode: "timer", discipline: "boxe",
      description: "Conditionnement final explosif.",
      instructions: ["Burpee complet", "À la remontée, enchaîne un combo 1-2", "Rythme soutenu mais contrôlé", "Respire, garde la technique malgré la fatigue"],
      tips: "Dernier round : tout donner sans casser la garde.", duration: 60
    }
  ];

  // Séances boxe curées (v1 : une séance shadow sans matériel).
  var BOXE_SESSIONS = [
    {
      id: 'shadow',
      name: 'Shadow — Sans matériel',
      level: 'Débutant',
      rest: 60,                 // repos entre rounds (1 min, standard boxe)
      exercises: BOXE_EXERCISES
    }
  ];

  function getBoxeSession(id) {
    return BOXE_SESSIONS.filter(function (s) { return s.id === id; })[0] || BOXE_SESSIONS[0] || null;
  }

  /* ========================================================================
   *  CONTENU — CALISTHÉNIE (brique « autres disciplines »)
   *  Circuit chronométré au poids du corps (mode timer pour la robustesse v1).
   * ====================================================================== */
  var CALIS_EXERCISES = [
    { name: "Échauffement articulaire", muscle: "Cardio", difficulty: "Débutant", type: "exercise", equipment: ["Poids du corps"], mode: "timer", discipline: "calisthenie",
      description: "Réveil des articulations avant l'effort.", instructions: ["Cercles d'épaules et de poignets", "Rotations de hanches et de chevilles", "Quelques montées de genoux", "Respire amplement"], tips: "Monte progressivement en intensité.", duration: 60 },
    { name: "Pompes", muscle: "Pectoraux", difficulty: "Débutant", type: "exercise", equipment: ["Poids du corps"], mode: "timer", discipline: "calisthenie",
      description: "Poussée horizontale fondamentale.", instructions: ["Mains largeur d'épaules", "Corps gainé et aligné", "Descends la poitrine près du sol", "Pousse en gardant les coudes ~45°"], tips: "Sur les genoux si besoin, sans casser l'alignement.", duration: 40 },
    { name: "Squats au poids du corps", muscle: "Quadriceps", difficulty: "Débutant", type: "exercise", equipment: ["Poids du corps"], mode: "timer", discipline: "calisthenie",
      description: "Flexion de jambes complète.", instructions: ["Pieds largeur d'épaules", "Descends hanches sous les genoux", "Dos droit, talons au sol", "Pousse dans les talons pour remonter"], tips: "Garde les genoux dans l'axe des pieds.", duration: 45 },
    { name: "Dips entre deux appuis", muscle: "Triceps", difficulty: "Intermédiaire", type: "exercise", equipment: ["Poids du corps"], mode: "timer", discipline: "calisthenie",
      description: "Poussée verticale pour triceps (appui chaise/banc).", instructions: ["Mains sur un appui stable derrière toi", "Descends en pliant les coudes", "Coudes vers l'arrière, pas écartés", "Remonte en poussant"], tips: "Jambes pliées pour faciliter, tendues pour durcir.", duration: 40 },
    { name: "Superman (extensions dorsales)", muscle: "Dos", difficulty: "Débutant", type: "exercise", equipment: ["Poids du corps"], mode: "timer", discipline: "calisthenie",
      description: "Renforcement de la chaîne postérieure.", instructions: ["Allongé sur le ventre", "Lève bras et jambes simultanément", "Serre les fessiers", "Tiens 1-2 s puis relâche"], tips: "Regarde le sol pour protéger la nuque.", duration: 40 },
    { name: "Pike push-up", muscle: "Épaules", difficulty: "Intermédiaire", type: "exercise", equipment: ["Poids du corps"], mode: "timer", discipline: "calisthenie",
      description: "Pompe en V pour les épaules.", instructions: ["Position en V inversé, hanches hautes", "Descends le sommet du crâne vers le sol", "Coudes contrôlés", "Pousse vers le haut"], tips: "Plus les pieds sont proches des mains, plus c'est dur.", duration: 30 },
    { name: "Hollow hold", muscle: "Abdominaux", difficulty: "Intermédiaire", type: "exercise", equipment: ["Poids du corps"], mode: "timer", discipline: "calisthenie",
      description: "Gainage ventral creux, base du gymnaste.", instructions: ["Allongé sur le dos", "Bas du dos plaqué au sol", "Épaules et jambes décollées", "Corps en forme de banane"], tips: "Plie les genoux pour réduire la difficulté.", duration: 30 },
    { name: "Planche (gainage)", muscle: "Abdominaux", difficulty: "Débutant", type: "exercise", equipment: ["Poids du corps"], mode: "timer", discipline: "calisthenie",
      description: "Gainage isométrique de la sangle abdominale.", instructions: ["Avant-bras et orteils au sol", "Corps parfaitement aligné", "Contracte abdos et fessiers", "Ne laisse pas les hanches tomber"], tips: "Respire normalement, ne bloque pas.", duration: 45 }
  ];
  var CALIS_SESSIONS = [
    { id: 'fondations', name: 'Fondations — Sans matériel', level: 'Débutant', rest: 25, exercises: CALIS_EXERCISES }
  ];

  /* ========================================================================
   *  CONTENU — COURSE / MARATHON
   *  Séances guidées au chrono (footing + fractionné). Phases = "exercices".
   * ====================================================================== */
  function _run(name, desc, instr, tip, dur) {
    return { name: name, muscle: "Cardio", difficulty: "Débutant", type: "exercise",
      equipment: ["Poids du corps"], mode: "timer", discipline: "course",
      description: desc, instructions: instr, tips: tip, duration: dur };
  }
  // Footing facile : échauffement, endurance, retour au calme.
  var COURSE_FOOTING = [
    _run("Échauffement — marche rapide", "3 min pour préparer le corps avant de courir.", ["Marche d'un bon pas, puis trottine légèrement sur la fin", "Relâche les épaules et les bras", "Respire amplement par le ventre", "But : monter le cœur en douceur, sans se fatiguer"], "Ne pars jamais courir à froid : ça évite les blessures.", 180),
    _run("Footing endurance", "Cours en continu, à allure lente, pendant toute la durée.", ["Cours sans t'arrêter pendant tout le temps affiché", "Allure LENTE : tu dois pouvoir tenir une conversation", "But : construire ton endurance de base, pas la vitesse", "Foulée souple, pose le pied sous toi, respiration régulière", "Si tu es essoufflé, ralentis ou marche un peu"], "L'erreur n°1 est d'aller trop vite : si tu ne peux pas parler, ralentis.", 900),
    _run("Retour au calme", "Ralentis progressivement pour faire redescendre le cœur.", ["Réduis l'allure jusqu'à la marche", "Continue de bouger 2-3 min, ne t'arrête pas net", "Respire profondément et relâche tout le corps", "Hydrate-toi"], "Étire-toi légèrement une fois bien calmé.", 180)
  ];
  // Fractionné 30/30 : échauffement + 8 cycles effort/récup + retour au calme.
  var COURSE_FRACTIONNE = [ _run("Échauffement — footing lent", "6 min de footing très facile pour préparer les efforts.", ["Cours très lentement, sans jamais forcer", "Ajoute 3-4 accélérations courtes (15-20 s) sur la fin", "Mobilise chevilles et hanches", "Respire amplement"], "Bien s'échauffer rend les efforts plus efficaces et plus sûrs.", 360) ];
  for (var _i = 1; _i <= 8; _i++) {
    COURSE_FRACTIONNE.push(_run("Effort " + _i + "/8 (rapide)", "30 s de course rapide. C'est la phase d'effort.", ["Cours VITE, mais sans sprinter à fond", "Choisis une allure tenable sur les 8 efforts", "Bras dynamiques, foulée ample", "Reste relâché (épaules, mâchoire)"], "Même intensité sur les 8 : ne pars pas trop fort au début.", 30));
    COURSE_FRACTIONNE.push(_run("Récupération " + _i + "/8", "30 s de footing très lent ou de marche entre deux efforts.", ["Ralentis franchement : footing très lent ou marche", "Respire et laisse le cœur redescendre un peu", "Reste en mouvement, ne t'arrête pas net", "Prépare-toi pour l'effort suivant"], "La récup sert à repartir frais : ne la saute pas.", 30));
  }
  COURSE_FRACTIONNE.push(_run("Retour au calme", "Ralentis jusqu'à la marche pour récupérer.", ["Footing très lent puis marche", "Continue de bouger quelques minutes", "Respiration profonde, relâche tout le corps", "Hydrate-toi"], "Termine toujours en douceur, jamais à l'arrêt net.", 300));
  var COURSE_SESSIONS = [
    { id: 'footing', name: 'Footing facile', level: 'Débutant', rest: 0, exercises: COURSE_FOOTING },
    { id: 'fractionne', name: 'Fractionné 30/30', level: 'Intermédiaire', rest: 0, exercises: COURSE_FRACTIONNE }
  ];

  /* ========================================================================
   *  CONTENU — MOBILITÉ (discipline complémentaire / rituel)
   * ====================================================================== */
  var MOBILITE_EXERCISES = [
    { name: "Respiration & centrage", muscle: "Cardio", difficulty: "Débutant", type: "exercise", equipment: ["Poids du corps"], mode: "timer", discipline: "mobilite",
      description: "Recentrage par la respiration.", instructions: ["Assis ou debout, dos droit", "Inspire 4 s par le nez", "Expire 6 s par la bouche", "Relâche les épaules"], tips: "Ralentis le souffle pour calmer le système nerveux.", duration: 60 },
    { name: "Chat-vache (mobilité dos)", muscle: "Dos", difficulty: "Débutant", type: "exercise", equipment: ["Poids du corps"], mode: "timer", discipline: "mobilite",
      description: "Mobilisation douce de la colonne.", instructions: ["À quatre pattes", "Inspire en creusant le dos", "Expire en arrondissant", "Mouvement lent et fluide"], tips: "Synchronise avec ta respiration.", duration: 45 },
    { name: "Fente basse (ouverture hanches)", muscle: "Quadriceps", difficulty: "Débutant", type: "exercise", equipment: ["Poids du corps"], mode: "timer", discipline: "mobilite",
      description: "Étirement des fléchisseurs de hanche.", instructions: ["Grande fente avant", "Genou arrière au sol", "Pousse le bassin vers l'avant", "Change de côté à mi-temps"], tips: "Garde le buste droit.", duration: 60 },
    { name: "Étirement ischio-jambiers", muscle: "Ischio-jambiers", difficulty: "Débutant", type: "exercise", equipment: ["Poids du corps"], mode: "timer", discipline: "mobilite",
      description: "Allongement de l'arrière des cuisses.", instructions: ["Une jambe tendue devant", "Penche le buste vers l'avant", "Dos droit, pas arrondi", "Change de côté à mi-temps"], tips: "Cherche la tension, jamais la douleur.", duration: 45 },
    { name: "Rotation thoracique", muscle: "Obliques", difficulty: "Débutant", type: "exercise", equipment: ["Poids du corps"], mode: "timer", discipline: "mobilite",
      description: "Mobilité en rotation du haut du dos.", instructions: ["À genoux, une main derrière la tête", "Ouvre le coude vers le plafond", "Suis le coude du regard", "Alterne les côtés"], tips: "Le bassin reste stable.", duration: 45 },
    { name: "Étirement épaules / pectoraux", muscle: "Pectoraux", difficulty: "Débutant", type: "exercise", equipment: ["Poids du corps"], mode: "timer", discipline: "mobilite",
      description: "Ouverture de la poitrine.", instructions: ["Bras le long d'un mur ou mains croisées dans le dos", "Ouvre la poitrine", "Épaules basses", "Respire dans l'étirement"], tips: "Idéal après une journée assise.", duration: 45 },
    { name: "Posture de l'enfant", muscle: "Dos", difficulty: "Débutant", type: "exercise", equipment: ["Poids du corps"], mode: "timer", discipline: "mobilite",
      description: "Relâchement global du dos.", instructions: ["Assis sur les talons", "Buste vers l'avant, bras tendus", "Front vers le sol", "Respire lentement"], tips: "Laisse tout le corps se relâcher.", duration: 60 }
  ];
  var MOBILITE_SESSIONS = [
    { id: 'flow', name: 'Flow Mobilité', level: 'Débutant', rest: 10, exercises: MOBILITE_EXERCISES }
  ];

  /* ---- Séances avancées (débloquées par niveau de Voie) ---------------- */
  // Chaque séance porte un minLevel : verrouillée tant que la Voie n'a pas atteint ce niveau.
  function _bx(name, desc, instr, tip, dur) {
    return { name: name, muscle: "Corps entier", difficulty: "Intermédiaire", type: "exercise",
      equipment: ["Poids du corps"], mode: "timer", discipline: "boxe",
      description: desc, instructions: instr, tips: tip, duration: dur };
  }
  var BOXE_COMBOS = [
    _bx("Échauffement & garde", "Mets-toi en garde et bouge pour t'échauffer.", ["Pieds largeur d'épaules, pied avant devant", "Poings près du menton, coudes serrés (la garde)", "Sautille légèrement pour rester mobile", "Rotations d'épaules, respire"], "Reste léger sur les appuis, mains toujours hautes.", 60),
    _bx("Combo 1-2-3-2", "Enchaîne : jab, cross, crochet avant, cross.", ["1 = jab (direct bras avant), 2 = cross (direct bras arrière)", "3 = crochet avant, puis 2 = cross à nouveau", "Pivote les hanches sur chaque coup arrière", "Reviens en garde après le combo"], "La vitesse vient du relâchement, pas de la force.", 90),
    _bx("Crochet – Uppercut – Crochet", "Trois coups rapprochés, en corps-à-corps.", ["Crochet avant (coude à hauteur d'épaule)", "Uppercut arrière (remonte du bas vers le menton)", "À nouveau crochet avant", "Reste compact et gainé"], "Garde toujours l'autre main en protection.", 90),
    _bx("Esquive + contre", "Esquive un coup, puis riposte jab-cross (1-2).", ["Slip = incline le buste sur le côté pour éviter le coup", "Aussitôt, riposte jab (1) puis cross (2)", "Replace-toi en garde", "Garde les yeux devant"], "Esquive puis frappe sans aucun délai.", 90),
    _bx("Doubles directs rapides", "Deux jabs puis un cross (jab-jab-cross).", ["Jab (1), encore jab (1), puis cross (2)", "Cadence élevée", "Épaules relâchées", "Souffle court sur chaque coup"], "Privilégie la vitesse à la puissance.", 60),
    _bx("Finisher — Burpee + combo", "Un burpee puis un combo, pour finir au cardio.", ["Fais un burpee complet", "En te relevant, enchaîne un 1-2-3 (jab-cross-crochet)", "Rythme soutenu", "Garde la technique malgré la fatigue"], "Dernier round : tout donner sans casser la garde.", 60)
  ];
  function _cl(name, mus, desc, instr, tip, dur) {
    return { name: name, muscle: mus, difficulty: "Avancé", type: "exercise",
      equipment: ["Poids du corps"], mode: "timer", discipline: "calisthenie",
      description: desc, instructions: instr, tips: tip, duration: dur };
  }
  var CALIS_SKILLS = [
    _cl("Échauffement poignets & épaules", "Cardio", "Prépare poignets et épaules avant les tenues.", ["Cercles de poignets dans les deux sens", "Quelques pompes lentes", "Mobilité des épaules", "Gainage léger"], "Bien échauffer les poignets évite les douleurs sur les tenues au sol.", 60),
    _cl("Tuck planche (tenue)", "Épaules", "Première étape de la planche : tenir le corps à l'horizontale, genoux groupés.", ["Mains au sol, penche les épaules vers l'avant", "Décolle les pieds, genoux ramenés sur la poitrine", "Épaules devant les mains, bassin haut", "Gaine fort et tiens"], "Avance les épaules pour 'charger' le mouvement.", 30),
    _cl("L-sit groupé (tenue)", "Abdominaux", "Assis mains au sol, tu décolles le corps, genoux remontés.", ["Mains posées au sol de chaque côté des hanches", "Pousse sur les mains pour décoller le bassin", "Remonte les genoux vers la poitrine", "Épaules basses, tiens la position"], "Verrouille bien les coudes (bras tendus).", 30),
    _cl("Hollow rocks", "Abdominaux", "En position 'banane' (hollow), tu te balances d'avant en arrière.", ["Hollow = sur le dos, bas du dos PLAQUÉ au sol, épaules et jambes décollées", "Le corps forme une banane creuse", "Balance-toi doucement d'avant en arrière", "Garde le bas du dos collé tout du long"], "Si le bas du dos décolle, plie un peu les genoux.", 40),
    _cl("Pseudo-planche pompes", "Pectoraux", "Pompes mains reculées vers la taille, corps penché en avant.", ["Mains à hauteur de la taille, doigts pointés vers l'arrière", "Penche tout le corps vers l'avant", "Descends de façon contrôlée", "Pousse pour remonter"], "Plus tu penches le corps en avant, plus c'est dur.", 40),
    _cl("Handstand au mur (tenue)", "Épaules", "Équilibre sur les mains, pieds appuyés au mur.", ["Pieds contre le mur, mains au sol", "Gaine tout le corps en ligne", "Pousse dans le sol avec les épaules", "Regarde entre tes mains"], "Garde les bras bien tendus.", 40)
  ];
  var COURSE_LONGUE = [
    _run("Échauffement — marche rapide", "3 min pour démarrer en douceur.", ["Marche d'un bon pas, puis trottine sur la fin", "Relâche les épaules", "Respire amplement", "Accélère progressivement"], "Ne pars pas à froid : le corps doit monter en température.", 180),
    _run("Sortie longue — endurance", "Course longue et continue, à allure facile.", ["Cours en continu, allure lente et conversationnelle", "But : tenir la durée affichée, pas aller vite", "Garde un rythme constant du début à la fin", "Bois quelques gorgées si tu en ressens le besoin"], "Si tu fatigues, ralentis plutôt que de t'arrêter.", 1200),
    _run("Accélérations en fin de sortie", "Quelques relances rapides pour finir en forme.", ["Accélère 20-30 s à allure rapide", "Reviens au footing lent entre chaque relance", "Répète 3-4 fois sur la durée", "Reste relâché, foulée ample"], "Apprend à ton corps à accélérer même fatigué.", 120),
    _run("Retour au calme", "Ralentis jusqu'à la marche pour récupérer.", ["Footing très lent puis marche", "Continue de bouger 2-3 min", "Respiration profonde, relâche", "Hydrate-toi"], "Termine en douceur, jamais à l'arrêt net.", 180)
  ];

  BOXE_SESSIONS.push({ id: 'combos', name: 'Combos avancés', level: 'Intermédiaire', rest: 60, minLevel: 3, exercises: BOXE_COMBOS });
  CALIS_SESSIONS.push({ id: 'skills', name: 'Skills — Tenues', level: 'Avancé', rest: 30, minLevel: 3, exercises: CALIS_SKILLS });
  COURSE_SESSIONS.push({ id: 'longue', name: 'Sortie longue', level: 'Intermédiaire', rest: 0, minLevel: 3, exercises: COURSE_LONGUE });

  /* ---- Séances ÉLITE (débloquées au niveau 6) -------------------------- */
  var BOXE_ELITE = [
    _bx("Échauffement explosif", "Shadow rapide pour être chaud avant les rounds durs.", ["Sautillements + shadow boxing vif", "Quelques accélérations de coups", "Mobilise les épaules", "Respire"], "Sois déjà bien chaud avant le 1er round.", 60),
    _bx("Combo 1-2-5-2", "Jab, cross, uppercut avant, cross.", ["1 = jab, 2 = cross", "5 = uppercut avant (remonte vers le menton)", "Puis 2 = cross à nouveau", "Charge l'uppercut avec les jambes, reviens en garde"], "L'uppercut part du sol, via les jambes.", 90),
    _bx("Triple crochet alterné", "Trois crochets en rafale : avant, arrière, avant.", ["Crochet avant, crochet arrière, crochet avant", "Pivote bien les hanches à chaque coup", "Reste compact", "Souffle sur chaque impact"], "Ne télégraphie aucun coup (pas de geste annonciateur).", 90),
    _bx("Double esquive + contre", "Deux esquives, puis riposte jab-cross.", ["Slip à gauche, slip à droite (incline le buste)", "Aussitôt, riposte jab (1) - cross (2)", "Replace-toi vite en garde", "Yeux devant"], "Esquive puis frappe instantanément.", 90),
    _bx("Sprint de coups", "Directs le plus vite possible pendant 45 s.", ["Jabs et cross en cadence maximale", "Garde la technique malgré la vitesse", "Souffle court et régulier", "Reste relâché"], "Vitesse avant puissance.", 45),
    _bx("Finisher — Burpee + 30 s de feu", "Un burpee puis 30 s de coups à fond.", ["Un burpee complet", "Puis 30 s de coups à intensité maximale", "Ne baisse jamais la garde", "Tout donner"], "Le dernier round décide tout.", 60)
  ];
  var CALIS_ELITE = [
    _cl("Échauffement complet", "Cardio", "Préparation articulaire et tendineuse.", ["Mobilité poignets/épaules", "Pompes lentes", "Gainage léger", "Squats"], "Échauffe sérieusement avant les skills.", 60),
    _cl("Tuck planche avancée (tenue)", "Épaules", "Planche groupée, épaules très avancées.", ["Penche fortement les épaules", "Décolle, genoux serrés", "Bassin haut", "Gaine au maximum"], "Prérequis : poignets et gainage costauds. Échauffe bien les poignets ; arrête si douleur.", 30),
    _cl("Tuck front lever (tenue)", "Dos", "Suspension horizontale groupée (barre).", ["Suspends-toi, tire les omoplates", "Remonte le bassin à l'horizontale", "Genoux groupés", "Corps gainé"], "Prérequis : hollow hold solide + tractions, bras tendus, omoplates engagées. Arrête si douleur d'épaule ou de coude.", 30),
    _cl("Archer push-ups", "Pectoraux", "Pompes asymétriques.", ["Pompe en chargeant un bras", "L'autre reste tendu", "Alterne les côtés", "Descente contrôlée"], "Reste gainé tout du long.", 40),
    _cl("Pistol squat négatif", "Quadriceps", "Descente lente sur une jambe.", ["Une jambe tendue devant", "Descends lentement sur l'autre", "Contrôle jusqu'en bas", "Remonte avec aide si besoin"], "La lenteur fait la force.", 40),
    _cl("Handstand mains rapprochées (tenue)", "Épaules", "Équilibre au mur, base resserrée.", ["Mains au sol près du mur", "Monte les pieds au mur", "Gaine, pousse dans le sol", "Tiens l'alignement"], "Bras tendus, regard entre les mains.", 40)
  ];
  var COURSE_ELITE = [ _run("Échauffement — footing + gammes", "Échauffement complet, obligatoire avant les efforts intenses.", ["Footing facile 3-4 min", "Gammes : talons-fesses, montées de genoux", "2-3 accélérations progressives", "Mobilise chevilles et hanches"], "Avant la VMA, échauffe-toi à fond pour éviter la blessure.", 360) ];
  for (var _j = 1; _j <= 10; _j++) {
    COURSE_ELITE.push(_run("VMA " + _j + "/10 (rapide)", "40 s d'effort proche du maximum. Travaille la vitesse.", ["Cours très vite, proche de ton maximum tenable", "Foulée ample et fréquence de pas élevée", "Bras dynamiques, regard devant", "Garde la MÊME allure sur les 10 efforts"], "La VMA développe ta vitesse max : intense mais maîtrisé.", 40));
    COURSE_ELITE.push(_run("Récupération " + _j + "/10", "20 s de footing très lent entre deux efforts.", ["Ralentis bien : footing très lent", "Respire profondément", "Reste en mouvement", "Prépare le prochain effort"], "Récup courte : reste actif, ne t'arrête pas.", 20));
  }
  COURSE_ELITE.push(_run("Retour au calme", "Ralentis jusqu'à la marche pour récupérer.", ["Footing très lent puis marche", "Continue de bouger quelques minutes", "Respiration profonde, relâche tout le corps", "Hydrate-toi"], "Ne coupe jamais net après des efforts intenses.", 300));

  BOXE_SESSIONS.push({ id: 'elite', name: 'Élite — Rounds de feu', level: 'Élite', rest: 60, minLevel: 6, exercises: BOXE_ELITE });
  CALIS_SESSIONS.push({ id: 'elite', name: 'Élite — Force gymnique', level: 'Élite', rest: 30, minLevel: 6, exercises: CALIS_ELITE });
  COURSE_SESSIONS.push({ id: 'elite', name: 'Élite — VMA courte', level: 'Élite', rest: 0, minLevel: 6, exercises: COURSE_ELITE });

  /* ---- Nouvelles disciplines (poids du corps, timer) ------------------- */
  function _dx(disc, name, mus, desc, instr, tip, dur, diff) {
    return { name: name, muscle: mus, difficulty: diff || "Débutant", type: "exercise",
      equipment: ["Poids du corps"], mode: "timer", discipline: disc,
      description: desc, instructions: instr, tips: tip, duration: dur };
  }
  var HIIT_EXERCISES = [
    _dx('hiit', "Échauffement dynamique", "Cardio", "Monte en température avant l'effort intense.", ["Talons-fesses, montées de genoux", "Cercles de bras", "Quelques squats", "Respire"], "Prépare le cœur et les jambes.", 60),
    _dx('hiit', "Jumping jacks", "Cardio", "Sauts en écartant puis resserrant bras et jambes.", ["Saute en écartant bras et jambes", "Reviens pieds serrés, bras le long du corps", "Rythme régulier", "Reste léger sur les appuis"], "Garde un tempo constant.", 40),
    _dx('hiit', "Squats sautés", "Quadriceps", "Un squat suivi d'un saut explosif vers le haut.", ["Descends en squat", "Saute le plus haut possible", "Atterris en douceur (genoux fléchis)", "Enchaîne directement"], "Amortis bien chaque réception avec les genoux.", 30, "Intermédiaire"),
    _dx('hiit', "Mountain climbers", "Abdominaux", "En position planche, tu ramènes les genoux vers la poitrine en alternance, rapidement.", ["Position planche, mains sous les épaules", "Ramène un genou puis l'autre, en alternance rapide", "Garde le bassin stable (ne le remonte pas)", "Rythme rapide"], "Garde le dos plat.", 30),
    _dx('hiit', "Burpees", "Cardio", "Le mouvement complet : squat, planche, pompe, puis saut.", ["Accroupis-toi, mains au sol", "Recule les pieds en planche, fais une pompe", "Ramène les pieds, puis saute en l'air", "Enchaîne sans pause"], "Adapte le rythme à ta forme : enlève la pompe ou le saut si besoin.", 30, "Intermédiaire"),
    _dx('hiit', "Fentes sautées", "Quadriceps", "Fentes alternées avec un saut pour changer de jambe.", ["Pars en fente avant", "Saute et change de jambe en l'air", "Atterris contrôlé en fente", "Garde l'équilibre"], "Garde le buste droit.", 30, "Intermédiaire"),
    _dx('hiit', "Planche jacks", "Abdominaux", "En position planche, tu écartes et resserres les pieds en sautant.", ["Position planche sur les avant-bras", "Écarte et resserre les pieds en sautillant", "Gaine fort le ventre", "Bassin stable"], "Ne creuse pas le dos.", 30),
    _dx('hiit', "High knees", "Cardio", "Course sur place, genoux montés très haut.", ["Cours sur place", "Monte les genoux haut (hauteur des hanches)", "Bras dynamiques", "Cadence maximale"], "Reste sur l'avant des pieds.", 30)
  ];
  var CORE_EXERCISES = [
    _dx('core', "Échauffement gainage", "Abdominaux", "Réveille la sangle abdominale avant l'effort.", ["Bascules de bassin", "Gainage léger", "Respiration abdominale", "Mobilité du dos"], "Engage le transverse (rentre le nombril).", 45),
    _dx('core', "Crunchs", "Abdominaux", "Allongé genoux pliés, tu décolles les épaules du sol.", ["Allongé, genoux pliés, pieds au sol", "Décolle les épaules (pas tout le dos)", "Souffle en montant", "Contrôle la descente"], "Ne tire pas sur la nuque avec les mains.", 40),
    _dx('core', "Planche", "Abdominaux", "Gainage immobile en appui sur les avant-bras et les orteils.", ["Appui sur les avant-bras et les orteils", "Corps parfaitement aligné", "Contracte abdos et fessiers", "Respire normalement"], "Hanches ni trop hautes ni trop basses.", 45),
    _dx('core', "Russian twists", "Obliques", "Assis buste incliné, tu tournes le tronc d'un côté à l'autre.", ["Assis, buste incliné en arrière", "Tourne le buste de gauche à droite", "Talons au sol (ou décollés pour durcir)", "Mouvement contrôlé"], "La rotation vient du tronc, pas des bras.", 40),
    _dx('core', "Relevés de jambes", "Abdominaux", "Allongé, tu montes et descends les jambes tendues (bas des abdos).", ["Allongé, jambes tendues", "Monte les jambes à la verticale", "Descends lentement sans toucher le sol", "Bas du dos plaqué au sol"], "Plie les genoux si c'est trop dur.", 40),
    _dx('core', "Planche latérale", "Obliques", "Gainage sur un avant-bras, corps tourné sur le côté.", ["Sur un avant-bras, corps de côté", "Hanches hautes, corps en ligne", "Change de côté à mi-temps", "Gaine"], "Aligne épaule, bassin et pied.", 40),
    _dx('core', "Hollow hold", "Abdominaux", "Sur le dos, corps en 'banane' creuse, épaules et jambes décollées.", ["Sur le dos, bas du dos PLAQUÉ au sol", "Décolle légèrement épaules et jambes", "Le corps forme une banane creuse", "Tiens la position"], "Plie les genoux pour réduire la difficulté.", 30)
  ];
  var YOGA_EXERCISES = [
    _dx('yoga', "Respiration", "Cardio", "Assieds-toi et respire profondément pour te centrer.", ["Assis, dos droit, épaules relâchées", "Inspire 4 s par le nez, expire 6 s", "Sens le ventre se gonfler puis se vider", "Calme le mental"], "Une expiration plus longue que l'inspiration apaise le système nerveux.", 60),
    _dx('yoga', "Salutation au soleil", "Corps entier", "Enchaînement fluide lié au souffle : du debout au sol, puis retour.", ["Bras au ciel, puis flexion avant (mains vers le sol)", "Recule en planche, puis chien tête en bas", "Reviens vers l'avant et remonte debout", "Un mouvement = une inspiration ou une expiration"], "Bouge lentement et en continu, sans à-coups.", 60),
    _dx('yoga', "Chien tête en bas", "Ischio-jambiers", "En appui mains et pieds, bassin poussé haut : le corps forme un V renversé.", ["Mains et pieds au sol, écartés largeur d'épaules/bassin", "Pousse les hanches vers le haut et l'arrière", "Cherche à poser les talons, dos long", "Respire calmement"], "Plie les genoux si l'arrière des jambes tire trop.", 45),
    _dx('yoga', "Guerrier", "Quadriceps", "Grande fente, genou avant plié, bras tendus à l'horizontale.", ["Grand pas en avant, genou avant fléchi au-dessus de la cheville", "Jambe arrière tendue, pied bien ancré au sol", "Bras tendus, regard devant", "Change de côté à mi-temps"], "Ancre fermement le pied arrière pour la stabilité.", 60),
    _dx('yoga', "Posture de l'arbre", "Corps entier", "Debout sur une jambe, l'autre pied posé contre la cheville ou la cuisse.", ["En appui sur une jambe, pose l'autre pied sur la cheville/cuisse opposée (jamais sur le genou)", "Mains jointes devant la poitrine ou au ciel", "Fixe un point immobile pour l'équilibre", "Change de côté"], "Engage la jambe d'appui et fixe ton regard.", 45),
    _dx('yoga', "Torsion assise", "Obliques", "Assis, tu tournes le buste d'un côté, colonne bien droite.", ["Assis, une jambe croisée par-dessus l'autre", "Grandis-toi puis tourne le buste vers la jambe croisée", "Garde le dos droit (ne t'affaisse pas)", "Change de côté à mi-temps"], "Grandis-toi AVANT de tourner pour protéger le dos.", 45),
    _dx('yoga', "Savasana", "Cardio", "Allongé sur le dos, totalement relâché : la posture de repos finale.", ["Allongé sur le dos, bras le long du corps, paumes vers le haut", "Relâche chaque partie du corps", "Respire naturellement, sans rien forcer", "Reste immobile et présent"], "Laisse le corps fondre dans le sol, c'est un vrai temps de récupération.", 60)
  ];
  var HIIT_SESSIONS = [ { id: 'total', name: 'HIIT total', level: 'Débutant', rest: 25, exercises: HIIT_EXERCISES } ];
  var CORE_SESSIONS = [ { id: 'acier', name: "Sangle d'acier", level: 'Débutant', rest: 15, exercises: CORE_EXERCISES } ];
  var YOGA_SESSIONS = [ { id: 'flow', name: 'Flow Vinyasa doux', level: 'Débutant', rest: 5, exercises: YOGA_EXERCISES } ];

  /* ---- PILATES : renforcement profond, posture, contrôle ---- */
  var PILATES_EXERCISES = [
    _dx('pilates', "Respiration & centrage", "Abdominaux", "Réveille le centre (transverse) avant de commencer.", ["Allongée, genoux pliés, pieds au sol", "Inspire par le nez, expire en rentrant le nombril", "Sens le bas-ventre s'engager", "Garde les épaules relâchées"], "Le 'centre' (powerhouse) s'engage à chaque expiration.", 50),
    _dx('pilates', "Le Cent", "Abdominaux", "Le 'Hundred' : battements de bras rythmés, abdos engagés.", ["Allongée, jambes en table (ou tendues), épaules décollées", "Bras tendus le long du corps, battements amples vers le sol", "Inspire sur 5 battements, expire sur 5", "Ventre rentré tout du long"], "Garde le bas du dos plaqué au sol.", 50),
    _dx('pilates', "Roll-up", "Abdominaux", "Déroulé lent et contrôlé du dos, vertèbre par vertèbre.", ["Allongée, bras au-dessus de la tête", "Déroule lentement jusqu'à toucher les orteils", "Reviens vertèbre par vertèbre", "Mouvement lent et fluide"], "Évite l'élan : c'est le contrôle qui compte.", 45),
    _dx('pilates', "Pont fessier (Bridge)", "Fessiers", "Pont contrôlé en déroulant la colonne.", ["Allongée, genoux pliés, pieds écartés largeur de hanches", "Déroule le bassin vers le haut vertèbre par vertèbre", "Serre les fessiers en haut", "Redescends lentement"], "Pousse dans les talons, gaine le ventre.", 50),
    _dx('pilates', "Single Leg Stretch", "Abdominaux", "Une jambe ramenée, l'autre tendue, en alternance.", ["Épaules décollées, mains sur le genou plié", "Tends l'autre jambe vers l'avant", "Alterne en gardant le buste stable", "Souffle à chaque changement"], "Plus la jambe tendue est basse, plus c'est dur.", 45),
    _dx('pilates', "Cercles de jambe", "Fessiers", "Petits cercles contrôlés avec une jambe tendue.", ["Allongée, une jambe tendue vers le plafond", "Dessine de petits cercles contrôlés", "Bassin parfaitement stable", "Change de sens puis de jambe"], "Le mouvement vient de la hanche, le tronc ne bouge pas.", 45),
    _dx('pilates', "La Scie (Saw)", "Obliques", "Assise, rotation du buste et étirement vers le pied opposé.", ["Assise, jambes écartées, bras en croix", "Tourne le buste et viens 'scier' le petit orteil opposé", "Reviens au centre, change de côté", "Grandis-toi à chaque rotation"], "La rotation part de la taille, pas des bras.", 45),
    _dx('pilates', "Swimming", "Lombaires", "Sur le ventre, battements alternés bras/jambes opposés.", ["Sur le ventre, bras tendus devant", "Lève bras droit + jambe gauche, puis alterne", "Battements amples et contrôlés", "Regard vers le sol, nuque longue"], "Allonge-toi au maximum à chaque battement.", 40),
    _dx('pilates', "Side Kick", "Fessiers", "Sur le côté, la jambe du dessus balance avant/arrière.", ["Allongée sur le côté, appuyée sur l'avant-bras", "Jambe du dessus à hauteur de hanche", "Balance-la vers l'avant puis l'arrière, contrôlé", "Tronc stable, change de côté à mi-temps"], "Garde le bassin immobile, gaine fort.", 45),
    _dx('pilates', "Teaser", "Abdominaux", "Le 'V' contrôlé : buste et jambes décollés en équilibre.", ["Allongée, monte buste et jambes en 'V'", "Bras tendus vers les pieds", "Tiens l'équilibre, puis redescends lentement", "Tout en contrôle"], "Plie les genoux pour une version plus accessible.", 40, "Intermédiaire"),
    _dx('pilates', "Étirement de la colonne", "Dos", "Assise, déroulé du buste vers l'avant pour étirer le dos.", ["Assise, jambes tendues écartées", "Déroule le buste vers l'avant en arrondissant", "Vertèbre par vertèbre, puis remonte", "Souffle en descendant"], "Cherche la longueur, pas la profondeur.", 45)
  ];
  var PILATES_SESSIONS = [ { id: 'centre', name: 'Pilates Fondations', level: 'Débutant', rest: 10, exercises: PILATES_EXERCISES } ];

  /* ---- BARRE : petits mouvements pulsés inspirés du ballet ---- */
  var BARRE_EXERCISES = [
    _dx('barre', "Échauffement & posture", "Corps entier", "Réveille les jambes et trouve ta posture de danseuse.", ["Debout, talons joints, pointes ouvertes (1re position)", "Grandis-toi, épaules basses, ventre engagé", "Roule les épaules, monte/descends sur les pointes", "Respire"], "Imagine un fil qui te tire vers le plafond.", 45),
    _dx('barre', "Pliés pulsés", "Quadriceps", "Demi-flexions pulsées, talons joints, dos droit.", ["Talons joints, pointes ouvertes", "Descends en plié (genoux vers l'extérieur)", "Petites pulsations vers le bas", "Dos bien droit, abdos engagés"], "Garde les talons collés et les genoux ouverts.", 50),
    _dx('barre', "Relevés (pointes)", "Mollets", "Montées sur la pointe des pieds, contrôlées.", ["Debout, appuie-toi à un support léger si besoin", "Monte lentement sur les pointes", "Tiens une seconde en haut, redescends contrôlé", "Gaine le ventre pour l'équilibre"], "Monte le plus haut possible à chaque relevé.", 40),
    _dx('barre', "Chaise pulsée", "Quadriceps", "Position chaise dos au mur (ou libre), petites pulsations.", ["Descends en position chaise (cuisses vers l'horizontale)", "Petites pulsations vers le bas", "Dos droit, genoux au-dessus des chevilles", "Respire malgré la brûlure"], "Plus tu descends, plus ça chauffe.", 45),
    _dx('barre', "Arabesque (leg lift)", "Fessiers", "Jambe tendue levée vers l'arrière, pulsée.", ["En appui sur une jambe, l'autre tendue derrière", "Lève-la vers l'arrière par petites pulsations", "Serre le fessier en haut", "Buste stable, change de jambe à mi-temps"], "Garde le bassin droit, ne te penche pas trop.", 45),
    _dx('barre', "Cuisses internes (adducteurs)", "Adducteurs", "Pulsations qui ciblent l'intérieur des cuisses.", ["Talons joints en plié large, mains sur les hanches", "Serre l'intérieur des cuisses par petites pulsations", "Reste en bas, genoux ouverts", "Gaine le centre"], "Imagine serrer un coussin entre les cuisses.", 45),
    _dx('barre', "Fente curtsy pulsée", "Fessiers", "Fente croisée 'révérence' avec pulsations.", ["Une jambe croisée derrière l'autre en révérence", "Descends et pulse vers le bas", "Genou avant au-dessus de la cheville", "Change de côté à mi-temps"], "Garde les hanches face à l'avant.", 45),
    _dx('barre', "Pretzel (fessier)", "Fessiers", "Assise au sol, on cible le fessier par petits relevés.", ["Assise, une jambe devant pliée, l'autre derrière", "Lève le genou arrière par petites pulsations", "Serre le fessier à chaque relevé", "Buste droit, change de côté"], "Le mouvement est petit : la brûlure vient de la précision.", 40),
    _dx('barre', "Bras de danseuse", "Épaules", "Petits cercles de bras pour sculpter les épaules.", ["Bras tendus à l'horizontale (en croix)", "Petits cercles vers l'avant, puis l'arrière", "Épaules basses, paumes actives", "Garde les bras à hauteur d'épaules"], "Les bras restent tendus et gracieux tout du long.", 40),
    _dx('barre', "Planche & tucks", "Abdominaux", "Gainage avec petites rentrées du bassin.", ["Position planche, corps gainé", "Rentre légèrement le bassin (tuck) puis reviens", "Petites pulsations contrôlées", "Épaules au-dessus des poignets"], "Garde le dos plat, ne creuse pas.", 40)
  ];
  var BARRE_SESSIONS = [ { id: 'grace', name: 'Barre Sculpt', level: 'Débutant', rest: 12, exercises: BARRE_EXERCISES } ];

  /* ---- SÉRÉNITÉ : respiration guidée & méditation anti-stress ---- */
  var SERENITE_EXERCISES = [
    _dx('serenite', "Installation", "Cardio", "Trouve une position confortable et pose ton attention.", ["Assise ou allongée, confortablement installée", "Ferme les yeux ou pose le regard au sol", "Relâche les épaules, la mâchoire, le front", "Observe simplement ta respiration naturelle"], "Rien à réussir : il s'agit juste d'être présente.", 45),
    _dx('serenite', "Cohérence cardiaque", "Cardio", "Respiration régulière 5 s / 5 s pour équilibrer le système nerveux.", ["Inspire doucement par le nez pendant 5 secondes", "Expire par la bouche pendant 5 secondes", "Garde un rythme fluide et régulier", "Environ 6 respirations par minute"], "C'est le rythme qui apaise le mieux le stress.", 90),
    _dx('serenite', "Respiration 4-7-8", "Cardio", "Une expiration longue pour relâcher les tensions.", ["Inspire par le nez en comptant 4", "Retiens ton souffle en comptant 7", "Expire lentement par la bouche en comptant 8", "Répète tranquillement"], "L'expiration longue active la détente. Ralentis si tu as la tête qui tourne.", 80),
    _dx('serenite', "Respiration carrée", "Cardio", "Box breathing : 4 temps égaux, comme un carré.", ["Inspire sur 4 temps", "Poumons pleins, retiens 4 temps", "Expire sur 4 temps", "Poumons vides, retiens 4 temps"], "Visualise les 4 côtés d'un carré que tu dessines.", 80),
    _dx('serenite', "Scan corporel", "Cardio", "Promène ton attention dans le corps, des pieds à la tête.", ["Porte ton attention sur tes pieds, puis remonte lentement", "À chaque zone, relâche les tensions", "Jambes, bassin, ventre, dos, épaules, visage", "Respire dans chaque partie"], "Si l'esprit s'évade, ramène-le doucement, sans te juger.", 110),
    _dx('serenite', "Ancrage 5 sens", "Cardio", "Reviens au présent en passant par tes sens.", ["Remarque 5 choses que tu pourrais voir", "4 sons que tu entends", "3 sensations de contact (pieds, mains...)", "2 odeurs, puis 1 respiration consciente"], "Un exercice express anti-anxiété, utilisable partout.", 90),
    _dx('serenite', "Relâchement progressif", "Cardio", "Contracte puis relâche chaque groupe musculaire.", ["Contracte les pieds 5 s, puis relâche complètement", "Remonte : mollets, cuisses, ventre, mains, épaules, visage", "Ressens la différence entre tension et détente", "Termine par tout le corps relâché"], "Le relâchement après contraction est plus profond.", 100),
    _dx('serenite', "Retour au calme", "Cardio", "Reviens doucement, en gardant le calme avec toi.", ["Respire naturellement, sans rien forcer", "Remarque comment tu te sens maintenant", "Bouge doucement les doigts, les orteils", "Ouvre les yeux quand tu es prête"], "Emporte ce calme avec toi dans ta journée.", 50)
  ];
  var SERENITE_SESSIONS = [
    { id: 'pause', name: 'Pause Sérénité', level: 'Débutant', rest: 0, exercises: [SERENITE_EXERCISES[0], SERENITE_EXERCISES[1], SERENITE_EXERCISES[4], SERENITE_EXERCISES[7]] },
    { id: 'souffle', name: 'Respiration anti-stress', level: 'Débutant', rest: 0, exercises: [SERENITE_EXERCISES[0], SERENITE_EXERCISES[2], SERENITE_EXERCISES[3], SERENITE_EXERCISES[1], SERENITE_EXERCISES[7]] }
  ];

  /* ---- Paliers avancé (Niv. 3) et élite (Niv. 6) des nouvelles voies ---- */
  // Vrai protocole Tabata (Izumi Tabata, 1996) : 20 s effort / 10 s repos × 8,
  // à intensité quasi-maximale, avec échauffement 5 min + retour au calme.
  // 2 blocs (2 mouvements) avec 1 min de repos entre les blocs. Repos de séance = 0
  // car les phases de repos sont explicites.
  var HIIT_TABATA = [ _dx('hiit', "Échauffement (5 min)", "Cardio", "Préparation indispensable avant l'intensité maximale.", ["Cardio léger progressif", "Mobilité des articulations", "2-3 accélérations courtes", "Le cœur doit déjà être élevé"], "Échauffe-toi vraiment : le Tabata est quasi-maximal.", 300) ];
  for (var _t1 = 1; _t1 <= 8; _t1++) {
    HIIT_TABATA.push(_dx('hiit', "Tabata Burpees — round " + _t1 + "/8", "Cardio", "20 s d'effort quasi-maximal.", ["Burpees aussi vite que possible en sécurité", "Garde une forme correcte malgré la fatigue", "Donne tout sur les 20 s", "Souffle"], "Effort all-out, pas un rythme de croisière.", 20, "Avancé"));
    if (_t1 < 8) HIIT_TABATA.push(_dx('hiit', "Repos 10 s", "Cardio", "Récupération incomplète.", ["Respire", "Reste debout, bouge un peu", "Prépare le round suivant"], "10 s c'est court : reste prêt.", 10));
  }
  HIIT_TABATA.push(_dx('hiit', "Repos entre blocs (1 min)", "Cardio", "Récupération entre les deux blocs.", ["Marche, respire", "Bois une gorgée d'eau", "Récupère activement"], "Le 2e bloc arrive.", 60));
  for (var _t2 = 1; _t2 <= 8; _t2++) {
    HIIT_TABATA.push(_dx('hiit', "Tabata Squats sautés — round " + _t2 + "/8", "Quadriceps", "20 s d'effort quasi-maximal.", ["Squats sautés explosifs", "Atterris en douceur", "Donne tout sur les 20 s", "Garde le dos droit"], "Amortis chaque réception.", 20, "Avancé"));
    if (_t2 < 8) HIIT_TABATA.push(_dx('hiit', "Repos 10 s", "Cardio", "Récupération incomplète.", ["Respire", "Reste mobile", "Prépare le round suivant"], "Reste prêt.", 10));
  }
  HIIT_TABATA.push(_dx('hiit', "Retour au calme (3 min)", "Cardio", "Récupération et étirements légers.", ["Marche lente", "Respiration profonde", "Étirements doux", "Fais redescendre le cœur"], "Ne coupe jamais net après du Tabata.", 180));
  var HIIT_ENFER = [
    _dx('hiit', "Échauffement", "Cardio", "Préparation à l'intensité max.", ["Mobilité + cardio léger", "2-3 accélérations", "Respire", "Reste léger"], "Chauffe bien.", 45),
    _dx('hiit', "Burpees + tuck jump", "Cardio", "Burpee avec saut groupé.", ["Burpee", "Saut genoux à la poitrine", "Réception souple", "Enchaîne"], "Explosif et contrôlé.", 30, "Avancé"),
    _dx('hiit', "Pompes claquées", "Pectoraux", "Pompe avec claquement.", ["Descends", "Pousse fort, claque les mains", "Réceptionne gainé", "Enchaîne"], "Prérequis : pompes strictes solides. Réceptionne coudes souples. À éviter si souci d'épaule ou de poignet.", 25, "Avancé"),
    _dx('hiit', "Squats sautés + maintien", "Quadriceps", "Saut puis tenue basse.", ["Squat sauté", "Tiens 1 s en bas", "Ré-explose", "Garde le dos droit"], "Cherche la hauteur.", 35, "Avancé"),
    _dx('hiit', "Planche dynamique", "Abdominaux", "Jacks + saut en planche.", ["Planche", "Écarte/resserre les pieds", "Saut groupé", "Gaine"], "Ne creuse pas le dos.", 30, "Intermédiaire"),
    _dx('hiit', "Tuck jumps", "Quadriceps", "Sauts groupés répétés.", ["Saute genoux à la poitrine", "Réception souple", "Enchaîne", "Reste explosif"], "Amortis les réceptions.", 25, "Avancé"),
    _dx('hiit', "Finisher — Enfer", "Cardio", "Tout ce qui reste.", ["Burpees max", "Aucune pause", "Garde la technique", "Vide le réservoir"], "Le round qui forge.", 40, "Avancé")
  ];
  var CORE_AVANCE = [
    _dx('core', "Échauffement gainage", "Abdominaux", "Activation profonde.", ["Bascules de bassin", "Gainage léger", "Respiration abdo", "Mobilité dos"], "Engage le transverse.", 45),
    _dx('core', "Planche longue", "Abdominaux", "Gainage isométrique tenu.", ["Avant-bras et orteils", "Corps aligné", "Respire sans bouger", "Tiens"], "Qualité avant durée.", 60),
    _dx('core', "Planche épaule-touch", "Abdominaux", "Planche dynamique stable.", ["En planche bras tendus", "Touche l'épaule opposée", "Bassin immobile", "Alterne"], "Ne balance pas les hanches.", 40, "Intermédiaire"),
    _dx('core', "Relevés de jambes lents", "Abdominaux", "Bas des abdos contrôlé.", ["Jambes tendues", "Monte et descends lentement", "Bas du dos plaqué", "Souffle"], "Lenteur = intensité.", 40, "Intermédiaire"),
    _dx('core', "Hollow rocks", "Abdominaux", "En position 'banane' (hollow), balance-toi d'avant en arrière.", ["Hollow = sur le dos, bas du dos plaqué, épaules et jambes décollées", "Balance d'avant en arrière", "Garde le bas du dos collé", "Mouvement contrôlé"], "Plie un peu les genoux si le bas du dos décolle.", 40, "Intermédiaire"),
    _dx('core', "Planche latérale + rotation", "Obliques", "Gainage latéral dynamique.", ["Planche latérale", "Passe le bras sous le buste", "Reviens ouvert", "Change de côté à mi-temps"], "Hanches hautes.", 40, "Intermédiaire")
  ];
  var CORE_ELITE = [
    _dx('core', "Échauffement complet", "Abdominaux", "Préparation à l'effort dur.", ["Gainage léger", "Mobilité dos/hanches", "Hollow hold court", "Respire"], "Échauffe bien le tronc.", 45),
    _dx('core', "Dragon flag négatif", "Abdominaux", "Allongé, tu descends lentement le corps tendu et gainé depuis la verticale.", ["Allongé, agrippe un appui solide derrière la tête", "Monte le corps droit, à la verticale (appui sur les épaules)", "Descends le corps TRÈS lentement, bien gainé", "Le corps reste droit, ne casse pas au bassin"], "Prérequis : hollow hold 30 s, pas de souci lombaire. Commence groupé. Stoppe si le bas du dos tire.", 30, "Avancé"),
    _dx('core', "L-sit (tenue)", "Abdominaux", "Assis mains au sol, tu décolles le corps, jambes tendues à l'horizontale.", ["Mains au sol, pousse pour décoller le bassin", "Jambes tendues à l'horizontale", "Épaules basses, coudes verrouillés", "Tiens"], "Genoux groupés si c'est trop dur.", 30, "Avancé"),
    _dx('core', "Planche bras tendus alternés", "Abdominaux", "En planche bras tendus, tu lèves un bras puis l'autre sans bouger le bassin.", ["Planche bras tendus", "Lève un bras devant toi, puis l'autre", "Bassin parfaitement immobile", "Gaine fort"], "Écarte un peu les pieds pour plus de stabilité.", 40, "Avancé"),
    _dx('core', "Hollow hold long", "Abdominaux", "Tenue prolongée en position 'banane' creuse (hollow).", ["Hollow = sur le dos, bas du dos plaqué, épaules et jambes décollées", "Tiens sans bouger", "Respire calmement", "Garde le bas du dos collé"], "Descends les bras au-dessus de la tête pour durcir.", 45, "Avancé"),
    _dx('core', "Planche latérale jambe levée", "Obliques", "Planche latérale en levant la jambe du dessus.", ["Pars en planche latérale", "Lève la jambe du dessus", "Hanches hautes, corps aligné", "Change de côté à mi-temps"], "Reste parfaitement aligné.", 40, "Avancé"),
    _dx('core', "RKC plank", "Abdominaux", "Planche où tu contractes TOUT le corps au maximum (la version la plus dure).", ["Planche sur les avant-bras", "Contracte tout au maximum (abdos, fessiers, cuisses)", "Tire mentalement les coudes vers les pieds", "Tiens, c'est très court"], "Intensité maximale, sur une courte durée.", 30, "Avancé")
  ];
  var YOGA_FLOW = [
    _dx('yoga', "Respiration", "Cardio", "Assieds-toi et respire pour te centrer avant le flow.", ["Assis, dos droit", "Souffle long et profond", "Relâche les épaules", "Sois présent à l'instant"], "Allonge l'expiration pour te calmer.", 45),
    _dx('yoga', "Salutation au soleil B", "Corps entier", "Variante dynamique : la chaise et le guerrier s'ajoutent à l'enchaînement.", ["Depuis debout : chaise, puis flexion avant", "Recule en guerrier, planche, chien tête en bas", "Reviens debout, le tout lié au souffle", "Reste fluide d'une posture à l'autre"], "Garde le mouvement continu, sans t'arrêter.", 60),
    _dx('yoga', "Guerrier 2 + triangle", "Quadriceps", "Grande fente bras tendus (guerrier 2), puis bascule en triangle.", ["Guerrier 2 : fente latérale, bras tendus à l'horizontale", "Tends la jambe avant et bascule en triangle (main vers le pied)", "Ouvre la poitrine vers le haut", "Change de côté"], "Ancre bien les deux pieds au sol.", 60),
    _dx('yoga', "Chaise tournée", "Obliques", "Position chaise (accroupi bras levés), puis torsion coude contre genou opposé.", ["Pars en chaise : genoux fléchis, bras au ciel", "Mains jointes, tourne le buste, pose un coude sur le genou opposé", "Garde les genoux alignés l'un avec l'autre", "Change de côté"], "Grandis le dos avant de tourner.", 45, "Intermédiaire"),
    _dx('yoga', "Demi-lune", "Corps entier", "En équilibre sur une main et une jambe, l'autre jambe levée à l'horizontale.", ["Une main au sol (ou sur un bloc), jambe arrière levée à l'horizontale", "Ouvre le bassin vers le côté", "Bras du dessus tendu vers le ciel", "Change de côté"], "Fixe un point au sol pour l'équilibre.", 45, "Intermédiaire"),
    _dx('yoga', "Pince debout", "Ischio-jambiers", "Debout, plie le buste vers l'avant pour étirer l'arrière des jambes.", ["Debout, penche le buste vers l'avant depuis les hanches", "Relâche la nuque et la tête vers le bas", "Garde les genoux souples (légèrement pliés)", "Respire dans l'étirement"], "Ne force pas : laisse le poids du buste faire le travail.", 45),
    _dx('yoga', "Savasana", "Cardio", "Allongé et immobile, relâchement total final.", ["Allongé sur le dos, immobile", "Relâche tout le corps", "Souffle naturel", "Laisse-toi fondre"], "Repos total : ne saute jamais cette posture.", 45)
  ];
  var YOGA_MAITRISE = [
    _dx('yoga', "Respiration profonde", "Cardio", "Respiration lente pour préparer le mental avant un flow exigeant.", ["Assis, dos droit", "Respiration longue et profonde", "Recentre-toi", "Présence totale"], "Ralentis le souffle au maximum.", 45),
    _dx('yoga', "Salutation avancée", "Corps entier", "Flow exigeant enchaînant chaturanga, chien et fentes.", ["Enchaîne chaturanga (pompe yoga), chien tête en bas, fentes", "Transitions lentes et contrôlées", "Synchronise chaque mouvement au souffle", "Reste fluide"], "Gaine le ventre sur chaque transition.", 60, "Avancé"),
    _dx('yoga', "Posture du corbeau", "Épaules", "Équilibre sur les mains, genoux posés sur l'arrière des bras.", ["Accroupi, mains au sol largeur d'épaules", "Pose les genoux sur l'arrière des bras (triceps)", "Bascule doucement le poids vers l'avant", "Décolle les pieds quand l'équilibre vient"], "Place un coussin devant toi. Prérequis : poignets et gainage solides. Stoppe si douleur de poignet.", 30, "Avancé"),
    _dx('yoga', "Planche latérale yoga", "Obliques", "Planche sur un seul bras tendu, corps de côté, bras libre vers le ciel (Vasisthasana).", ["Depuis la planche, bascule sur un bras tendu", "Empile les pieds, corps en ligne de côté", "Hanches hautes, bras libre vers le ciel", "Change de côté à mi-temps"], "Pose le genou du dessous au sol pour une version plus facile.", 40, "Avancé"),
    _dx('yoga', "Posture du danseur", "Quadriceps", "Debout sur une jambe, tu attrapes le pied arrière et pousses pour ouvrir le buste.", ["Debout sur une jambe, attrape l'autre pied derrière toi", "Pousse le pied dans ta main pour lever la jambe", "Penche le buste vers l'avant en équilibre", "Change de côté"], "Fixe un point stable devant toi.", 45, "Avancé"),
    _dx('yoga', "Pont / roue", "Dos", "Allongé, pieds près des fessiers, pousse le bassin vers le haut pour ouvrir la poitrine.", ["Allongé, pieds à plat près des fessiers", "Pousse le bassin vers le haut", "Ouvre la poitrine, serre les fessiers", "Respire"], "Échauffe bien la colonne et monte progressivement. À éviter en cas de souci lombaire ou d'épaule.", 40, "Intermédiaire"),
    _dx('yoga', "Savasana", "Cardio", "Allongé et immobile, intégration finale de la séance.", ["Allongé sur le dos, immobile", "Relâche tout le corps", "Souffle naturel", "Repos profond"], "Laisse le calme s'installer.", 60)
  ];

  HIIT_SESSIONS.push({ id: 'tabata', name: 'Tabata — Forge', level: 'Avancé', rest: 0, minLevel: 3, exercises: HIIT_TABATA });
  HIIT_SESSIONS.push({ id: 'elite', name: 'Élite — Enfer', level: 'Élite', rest: 10, minLevel: 6, exercises: HIIT_ENFER });
  CORE_SESSIONS.push({ id: 'avance', name: 'Gainage avancé', level: 'Avancé', rest: 15, minLevel: 3, exercises: CORE_AVANCE });
  CORE_SESSIONS.push({ id: 'elite', name: "Élite — Noyau d'acier", level: 'Élite', rest: 15, minLevel: 6, exercises: CORE_ELITE });
  YOGA_SESSIONS.push({ id: 'dynamique', name: 'Flow dynamique', level: 'Avancé', rest: 5, minLevel: 3, exercises: YOGA_FLOW });
  YOGA_SESSIONS.push({ id: 'maitrise', name: 'Maîtrise', level: 'Élite', rest: 5, minLevel: 6, exercises: YOGA_MAITRISE });

  /* ---- Paliers intermédiaires (Niv. 2 « Intermédiaire » et Niv. 5 « Confirmé ») ---- */
  // Lissent la progression entre débutant (1), avancé (3) et élite (6).
  var BOXE_INTER = [
    _dx('boxe', "Échauffement & garde", "Cardio", "Mets-toi en garde et bouge pour t'échauffer.", ["Pieds largeur d'épaules, pied avant devant", "Poings près du menton (la garde)", "Sautille légèrement, reste mobile", "Rotations d'épaules, respire"], "Reste léger sur les appuis.", 90),
    _dx('boxe', "Jab – Cross – Jab (1-2-1)", "Épaules", "Trois directs : jab, cross, jab.", ["1 = jab (bras avant), 2 = cross (bras arrière), 1 = jab", "Pivote les hanches sur le cross", "Reviens en garde", "Rythme régulier"], "Garde l'équilibre entre chaque coup.", 90, "Intermédiaire"),
    _dx('boxe', "Jab – Crochet (1-3)", "Épaules", "Un direct avant puis un crochet avant.", ["1 = jab (direct bras avant)", "3 = crochet avant (coude à hauteur d'épaule)", "Pivote le buste sur le crochet", "Remets-toi en garde"], "Le crochet part de la hanche.", 90, "Intermédiaire"),
    _dx('boxe', "Esquive + Jab-Cross", "Corps entier", "Esquive un coup, puis riposte jab-cross.", ["Slip = incline le buste pour éviter le coup", "Riposte jab (1) - cross (2)", "Replace-toi en garde", "Yeux devant"], "Esquive puis frappe sans délai.", 90, "Intermédiaire"),
    _dx('boxe', "Déplacements + combos", "Cardio", "Bouge dans tous les sens en frappant.", ["Avance et recule en lançant des 1-2", "Pas chassés (ne croise pas les pieds)", "Frappe toujours bien campé sur tes appuis", "Garde haute"], "Des appuis solides = des coups puissants.", 90, "Intermédiaire"),
    _dx('boxe', "Finisher — Shadow rapide", "Cardio", "Boxe à vide le plus vite possible.", ["Shadow boxing très vif", "Coups relâchés et rapides", "Bouge sans arrêt", "Souffle"], "Vitesse avant puissance.", 60, "Intermédiaire")
  ];
  var BOXE_CONF = [
    _dx('boxe', "Échauffement explosif", "Cardio", "Shadow vif pour être chaud rapidement.", ["Shadow boxing vif", "Accélérations de coups", "Mobilité épaules", "Respire"], "Sois déjà chaud.", 60),
    _dx('boxe', "Combo 1-2-3 rapide", "Corps entier", "Jab, cross, crochet avant, en vitesse.", ["1 = jab, 2 = cross, 3 = crochet avant", "Sans temps mort entre les coups", "Reviens en garde", "Cadence soutenue"], "Garde la précision malgré la vitesse.", 90, "Avancé"),
    _dx('boxe', "Contre après esquive", "Corps entier", "Esquive puis riposte cross-crochet (2-3).", ["Slip = esquive en inclinant le buste", "Riposte 2 = cross, puis 3 = crochet avant", "Replace-toi vite", "Reste compact"], "Riposte instantanément après l'esquive.", 90, "Avancé"),
    _dx('boxe', "Doubles jabs + cross", "Épaules", "Deux jabs puis un cross (jab-jab-cross).", ["1 = jab, 1 = jab, 2 = cross", "Cadence élevée", "Épaules relâchées", "Souffle court"], "Privilégie la vitesse.", 75, "Avancé"),
    _dx('boxe', "Uppercut – crochet en rafale", "Épaules", "Uppercut puis crochet, des deux côtés.", ["Uppercut (remonte vers le menton) puis crochet", "Pivote les hanches", "Reste gainé", "Alterne les côtés"], "Compact et explosif.", 75, "Avancé"),
    _dx('boxe', "Finisher — 30 s de coups", "Cardio", "30 s de coups à intensité maximale.", ["Coups à fond pendant 30 s", "Garde la technique", "Ne baisse pas la garde", "Tout donner"], "Le round qui pique.", 45, "Avancé")
  ];
  var CALIS_INTER = [
    _dx('calisthenie', "Échauffement", "Cardio", "Réveil articulaire.", ["Mobilité épaules/poignets", "Quelques squats", "Pompes lentes", "Respire"], "Monte en intensité progressivement.", 60),
    _dx('calisthenie', "Pompes diamant", "Triceps", "Pompes mains rapprochées.", ["Mains en losange sous la poitrine", "Descends contrôlé", "Coudes près du corps", "Pousse"], "Sur les genoux si besoin.", 40, "Intermédiaire"),
    _dx('calisthenie', "Fentes bulgares", "Quadriceps", "Fente pied arrière surélevé.", ["Pied arrière sur un appui", "Descends la jambe avant", "Genou dans l'axe", "Change de côté à mi-temps"], "Garde le buste droit.", 45, "Intermédiaire"),
    _dx('calisthenie', "Pike push-up", "Épaules", "Pompe en V.", ["Hanches hautes", "Descends le crâne vers le sol", "Coudes contrôlés", "Pousse"], "Rapproche les pieds pour durcir.", 35, "Intermédiaire"),
    _dx('calisthenie', "Rowing inversé groupé", "Dos", "Tirage horizontal sous une table solide.", ["Allongé sous un appui, agrippe-le", "Tire la poitrine vers l'appui", "Genoux pliés pour faciliter", "Contrôle la descente"], "Garde le corps gainé.", 40, "Intermédiaire"),
    _dx('calisthenie', "Planche (gainage)", "Abdominaux", "Gainage isométrique.", ["Avant-bras et orteils", "Corps aligné", "Contracte abdos/fessiers", "Respire"], "Hanches ni hautes ni basses.", 45)
  ];
  var CALIS_CONF = [
    _dx('calisthenie', "Échauffement poignets & épaules", "Cardio", "Préparation aux tenues.", ["Cercles de poignets", "Pompes lentes", "Mobilité épaules", "Gainage léger"], "Échauffe bien les poignets.", 60),
    _dx('calisthenie', "Pompes archer (assistées)", "Pectoraux", "Transition vers la pompe à un bras.", ["Pompe en chargeant un bras", "L'autre reste tendu en appui", "Alterne", "Descente contrôlée"], "Reste gainé.", 40, "Avancé"),
    _dx('calisthenie', "Tuck planche (tenue)", "Épaules", "Initiation à la planche, genoux groupés.", ["Penche les épaules en avant", "Décolle les pieds, genoux groupés", "Bassin haut", "Gaine"], "Prérequis : hollow hold 30 s.", 30, "Avancé"),
    _dx('calisthenie', "Pistol squat assisté", "Quadriceps", "Squat une jambe avec appui léger.", ["Une jambe tendue devant", "Descends sur l'autre en te tenant", "Contrôle", "Change de côté à mi-temps"], "L'appui ne fait qu'équilibrer.", 40, "Avancé"),
    _dx('calisthenie', "L-sit groupé (tenue)", "Abdominaux", "Maintien genoux groupés.", ["Mains au sol, décolle le bassin", "Genoux vers la poitrine", "Épaules basses", "Tiens"], "Verrouille les coudes.", 30, "Avancé"),
    _dx('calisthenie', "Hollow rocks", "Abdominaux", "En position 'banane' (hollow), balance-toi d'avant en arrière.", ["Hollow = sur le dos, bas du dos plaqué, épaules et jambes décollées", "Balance d'avant en arrière", "Garde le bas du dos collé", "Contrôle le mouvement"], "Plie un peu les genoux si le bas du dos décolle.", 40, "Avancé")
  ];

  /* ===== CALISTHÉNIE — EXPANSION : pools thématiques (pousser / tirer / jambes / gainage / skills) ===== */
  // Échauffement réutilisable.
  var CALIS_WU = _dx('calisthenie', "Échauffement articulaire & activation", "Cardio", "Réveil complet avant l'effort.", ["Cercles d'épaules, poignets, hanches, chevilles", "Mobilité du haut du dos (rotations)", "Quelques squats et pompes lentes", "Gainage léger 15 s"], "Échauffe bien poignets et épaules avant les tenues.", 75);

  // POUSSER — pectoraux / épaules / triceps
  var CALIS_PUSH = [
    CALIS_WU,
    _dx('calisthenie', "Pompes inclinées", "Pectoraux", "Pompes mains surélevées (plus faciles).", ["Mains sur un banc/rebord stable", "Corps gainé en planche", "Descends la poitrine vers l'appui", "Pousse"], "Plus l'appui est haut, plus c'est facile.", 40),
    _dx('calisthenie', "Pompes", "Pectoraux", "La poussée horizontale de référence.", ["Mains largeur d'épaules", "Corps aligné, gainé", "Descends la poitrine près du sol", "Coudes ~45°, pousse"], "Sur les genoux si besoin, sans casser l'alignement.", 40),
    _dx('calisthenie', "Pompes diamant", "Triceps", "Mains rapprochées en losange.", ["Index et pouces en losange sous la poitrine", "Descends contrôlé", "Coudes près du corps", "Pousse"], "Cible les triceps et l'intérieur des pectoraux.", 35, "Intermédiaire"),
    _dx('calisthenie', "Pompes déclinées", "Pectoraux", "Pieds surélevés : plus de charge sur le haut des pectoraux et les épaules.", ["Pieds sur un banc", "Mains au sol largeur d'épaules", "Descends la poitrine", "Garde le corps gainé"], "Plus les pieds sont hauts, plus c'est dur.", 35, "Intermédiaire"),
    _dx('calisthenie', "Pseudo-planche push-up", "Épaules", "Pompe mains reculées vers la taille, buste penché en avant — prépare la planche.", ["Mains au niveau de la taille, doigts vers l'arrière (si possible)", "Penche les épaules devant les mains", "Descends en gardant le corps droit", "Pousse"], "Excellent transfert vers la planche.", 30, "Avancé"),
    _dx('calisthenie', "Pike push-up", "Épaules", "Pompe en V inversé.", ["Hanches hautes, corps en V", "Descends le sommet du crâne vers le sol", "Coudes contrôlés", "Pousse vers le haut"], "Rapproche les pieds des mains pour durcir.", 35, "Intermédiaire"),
    _dx('calisthenie', "Pike push-up surélevée", "Épaules", "Pieds surélevés : se rapproche de la pompe en équilibre.", ["Pieds sur un banc, hanches très hautes", "Crâne vers le sol entre les mains", "Coudes vers l'arrière", "Pousse"], "Étape vers le handstand push-up.", 30, "Avancé"),
    _dx('calisthenie', "Dips sur appuis", "Triceps", "Poussée verticale sur deux appuis (chaises/barres).", ["Mains sur appuis stables, corps suspendu", "Descends en pliant les coudes", "Coudes vers l'arrière", "Remonte en poussant"], "Jambes pliées pour faciliter, tendues pour durcir.", 40, "Intermédiaire"),
    _dx('calisthenie', "Finisher — pompes lentes", "Pectoraux", "Tempo lent jusqu'à l'échec technique.", ["Descente en 3-4 secondes", "Pause en bas", "Pousse de façon contrôlée", "Garde la forme jusqu'au bout"], "La lenteur augmente le temps sous tension.", 40)
  ];

  // TIRER — dos / biceps (barre de traction ou appuis bas)
  var CALIS_PULL = [
    CALIS_WU,
    _dx('calisthenie', "Rétractions scapulaires", "Dos", "Suspendu à la barre, rapproche les omoplates sans plier les bras.", ["Suspendu bras tendus", "Tire les épaules vers le bas/arrière", "Sans plier les coudes", "Contrôle"], "La base de toute traction : active le dos.", 30, "Intermédiaire"),
    _dx('calisthenie', "Rowing inversé (table)", "Dos", "Tirage horizontal sous une table/barre basse solide.", ["Allongé sous l'appui, agrippe-le", "Corps gainé", "Tire la poitrine vers l'appui", "Contrôle la descente"], "Plus le corps est horizontal, plus c'est dur.", 40),
    _dx('calisthenie', "Rowing archer (table)", "Dos", "Tirage horizontal en chargeant un bras.", ["Sous l'appui, tire vers une main", "L'autre bras reste tendu", "Alterne", "Reste gainé"], "Transition vers le tirage à un bras.", 35, "Avancé"),
    _dx('calisthenie', "Tractions négatives", "Dos", "Seulement la descente, la plus lente possible.", ["Monte en sautant, menton au-dessus de la barre", "Descends en 4-5 secondes", "Garde les épaules engagées", "Recommence"], "Meilleur exercice pour débloquer la 1re traction.", 40, "Intermédiaire"),
    _dx('calisthenie', "Tractions assistées", "Dos", "Tractions avec élastique ou pieds en appui.", ["Élastique au pied ou genou", "Tire le menton au-dessus de la barre", "Descends contrôlé", "Garde le gainage"], "Réduis l'assistance au fil des semaines.", 40, "Intermédiaire"),
    _dx('calisthenie', "Tractions pronation", "Dos", "Traction paumes vers l'avant — le grand dorsal.", ["Prise pronation, largeur d'épaules", "Tire le menton au-dessus de la barre", "Épaules basses", "Descends complètement"], "Évite de te balancer (pas de kipping).", 40, "Avancé"),
    _dx('calisthenie', "Tractions supination (chin-ups)", "Biceps", "Traction paumes vers toi — plus de biceps.", ["Prise supination", "Tire le menton au-dessus de la barre", "Coudes près du corps", "Descente contrôlée"], "Souvent plus facile que la pronation.", 40, "Avancé"),
    _dx('calisthenie', "Finisher — suspension active", "Dos", "Tenue suspendue, omoplates engagées.", ["Suspendu à la barre", "Épaules tirées vers le bas", "Gaine le corps", "Tiens le plus longtemps possible"], "Renforce la prise et stabilise les épaules.", 40)
  ];

  // JAMBES — quadriceps / ischios / fessiers / mollets
  var CALIS_LEGS = [
    CALIS_WU,
    _dx('calisthenie', "Squats au poids du corps", "Quadriceps", "Flexion complète des jambes.", ["Pieds largeur d'épaules", "Descends les hanches sous les genoux", "Dos droit, talons au sol", "Pousse dans les talons"], "Genoux dans l'axe des pieds.", 45),
    _dx('calisthenie', "Fentes avant alternées", "Quadriceps", "Grandes fentes en alternance.", ["Grand pas en avant", "Descends le genou arrière vers le sol", "Genou avant dans l'axe", "Alterne les jambes"], "Buste droit, contrôle la descente.", 45),
    _dx('calisthenie', "Fentes bulgares", "Quadriceps", "Fente pied arrière surélevé (très efficace).", ["Pied arrière sur un appui", "Descends la jambe avant", "Genou dans l'axe", "Change de côté à mi-temps"], "Garde le buste droit, poids sur la jambe avant.", 45, "Intermédiaire"),
    _dx('calisthenie', "Squats sautés", "Quadriceps", "Squat explosif avec saut.", ["Descends en squat", "Explose vers le haut", "Atterris en douceur, genoux fléchis", "Enchaîne"], "Amortis bien les réceptions.", 40, "Intermédiaire"),
    _dx('calisthenie', "Montées sur banc (step-up)", "Fessiers", "Monte sur un appui en poussant sur une jambe.", ["Pose un pied sur un banc stable", "Monte en poussant dans le talon", "Contrôle la descente", "Change de côté à mi-temps"], "Évite de pousser sur la jambe du bas.", 45),
    _dx('calisthenie', "Pistol squat assisté", "Quadriceps", "Squat sur une jambe avec appui léger.", ["Une jambe tendue devant", "Descends sur l'autre en te tenant", "Contrôle toute la descente", "Change de côté à mi-temps"], "L'appui ne fait qu'équilibrer.", 40, "Avancé"),
    _dx('calisthenie', "Curl nordique négatif", "Ischio-jambiers", "Descente lente, chevilles bloquées — ischios en excentrique.", ["À genoux, chevilles bloquées (sous un meuble)", "Descends le buste le plus lentement possible", "Garde les hanches tendues", "Pousse avec les mains pour remonter"], "Exercice exigeant : amplitude réduite au début.", 35, "Avancé"),
    _dx('calisthenie', "Mollets debout", "Mollets", "Extensions sur la pointe des pieds.", ["Debout, monte sur la pointe des pieds", "Pause en haut", "Descends lentement", "Sur une marche pour plus d'amplitude"], "Sur une jambe pour durcir.", 40),
    _dx('calisthenie', "Finisher — chaise au mur", "Quadriceps", "Tenue isométrique cuisses à l'horizontale.", ["Dos au mur, glisse en position assise", "Cuisses parallèles au sol", "Genoux au-dessus des chevilles", "Tiens"], "Respire malgré la brûlure.", 45)
  ];

  // GAINAGE — sangle abdominale / obliques / compressions
  var CALIS_CORE_POOL = [
    CALIS_WU,
    _dx('calisthenie', "Planche (gainage)", "Abdominaux", "Gainage isométrique de référence.", ["Avant-bras et orteils", "Corps parfaitement aligné", "Contracte abdos et fessiers", "Respire"], "Hanches ni hautes ni basses.", 45),
    _dx('calisthenie', "Planche latérale", "Obliques", "Gainage latéral.", ["Sur un avant-bras, corps de profil", "Hanches hautes, corps aligné", "Gaine les obliques", "Change de côté à mi-temps"], "Sur les genoux pour faciliter.", 40),
    _dx('calisthenie', "Hollow hold", "Abdominaux", "Gainage creux du gymnaste.", ["Sur le dos, bas du dos plaqué", "Épaules et jambes décollées", "Corps en banane creuse", "Tiens"], "Plie les genoux pour réduire la difficulté.", 35, "Intermédiaire"),
    _dx('calisthenie', "Hollow rocks", "Abdominaux", "Balancement en position hollow.", ["En hollow, balance d'avant en arrière", "Garde le bas du dos collé", "Mouvement contrôlé", "Gaine"], "Plie un peu les genoux si le dos décolle.", 40, "Intermédiaire"),
    _dx('calisthenie', "Relevés de jambes", "Abdominaux", "Bas des abdominaux, au sol.", ["Allongé, jambes tendues", "Monte à la verticale", "Descends sans toucher le sol", "Bas du dos plaqué"], "Plie les genoux pour faciliter.", 40, "Intermédiaire"),
    _dx('calisthenie', "Relevés de genoux suspendus", "Abdominaux", "Suspendu à la barre, monte les genoux.", ["Suspendu, épaules engagées", "Monte les genoux vers la poitrine", "Sans te balancer", "Descends contrôlé"], "Tendre les jambes pour durcir.", 35, "Avancé"),
    _dx('calisthenie', "Gainage rotatif (Russian twist)", "Obliques", "Rotation du buste, pieds décollés.", ["Assis, buste incliné, pieds décollés", "Tourne le buste d'un côté à l'autre", "Contrôle, ne te précipite pas", "Gaine"], "Pose les talons pour faciliter.", 40),
    _dx('calisthenie', "Finisher — planche maximale", "Abdominaux", "Tenue de gainage jusqu'à l'échec technique.", ["Position planche parfaite", "Gaine tout le corps", "Respire", "Tiens jusqu'à perdre l'alignement"], "Arrête dès que les hanches tombent.", 45)
  ];

  // SKILLS — figures du gymnaste (prérequis : gainage solide)
  var CALIS_SKILL = [
    _dx('calisthenie', "Échauffement poignets & épaules", "Cardio", "Préparation spécifique aux tenues.", ["Cercles et étirements des poignets", "Pompes lentes, mobilité épaules", "Gainage hollow 20 s", "Échauffe à fond"], "Ne saute jamais l'échauffement des poignets.", 75),
    _dx('calisthenie', "Crow pose (corbeau)", "Épaules", "Premier équilibre sur les mains, genoux sur les coudes.", ["Mains au sol, écarte les doigts", "Pose les genoux sur l'arrière des bras", "Bascule le poids vers l'avant", "Décolle les pieds, regarde devant"], "Mets un coussin devant toi pour oser.", 30, "Intermédiaire"),
    _dx('calisthenie', "Équilibre contre le mur", "Épaules", "Handstand dos au mur, pour la tenue et la confiance.", ["Mains près du mur, monte en équilibre dos au mur", "Gaine le ventre, pousse dans le sol", "Corps aligné, regard entre les mains", "Tiens"], "Talons posés au mur, corps droit.", 30, "Avancé"),
    _dx('calisthenie', "Pompes équilibre (mur)", "Épaules", "Handstand push-up contre le mur.", ["En équilibre au mur", "Descends le crâne vers le sol", "Coudes contrôlés", "Pousse pour remonter"], "Amplitude réduite au début.", 25, "Avancé"),
    _dx('calisthenie', "Tuck planche (tenue)", "Épaules", "Initiation à la planche, genoux groupés.", ["Mains au sol, penche les épaules devant", "Décolle les pieds, genoux groupés", "Bassin haut, bras tendus", "Gaine"], "Prérequis : hollow hold 30 s + pseudo-planche.", 25, "Avancé"),
    _dx('calisthenie', "L-sit groupé → tendu", "Abdominaux", "Maintien jambes à l'équerre.", ["Mains au sol (ou supports), décolle le bassin", "Genoux groupés, puis tends progressivement", "Épaules basses, coudes verrouillés", "Tiens"], "Sur deux livres/parallettes pour plus de marge.", 25, "Avancé"),
    _dx('calisthenie', "Back lever groupé", "Dos", "Suspendu, corps à l'horizontale face au sol, groupé.", ["Suspendu, passe en position renversée groupée", "Descends jusqu'à l'horizontale, dos au sol", "Genoux groupés, gaine fort", "Tiens brièvement"], "Progression lente : épaules très sollicitées.", 20, "Avancé"),
    _dx('calisthenie', "Front lever groupé", "Dos", "Suspendu, corps horizontal face au ciel, groupé.", ["Suspendu, tire les omoplates", "Remonte le corps à l'horizontale, dos vers le sol", "Genoux groupés, gaine", "Tiens brièvement"], "Le tuck front lever est la 1re étape.", 20, "Avancé"),
    _dx('calisthenie', "Drapeau — appui vertical", "Obliques", "Première étape du drapeau humain, corps vertical.", ["Agrippe un poteau, bras tendu haut + bras bas", "Décolle les pieds, corps vertical le long du poteau", "Gaine fort les obliques", "Tiens"], "Maîtrise la verticale avant d'ouvrir les jambes.", 20, "Avancé")
  ];

  // FULL BODY — séance complète équilibrée sans matériel
  var CALIS_FULL = [
    CALIS_WU,
    _dx('calisthenie', "Pompes", "Pectoraux", "Poussée horizontale.", ["Mains largeur d'épaules", "Corps gainé", "Descends la poitrine", "Pousse, coudes ~45°"], "Sur les genoux si besoin.", 40),
    _dx('calisthenie', "Squats", "Quadriceps", "Flexion de jambes complète.", ["Pieds largeur d'épaules", "Hanches sous les genoux", "Talons au sol", "Pousse"], "Genoux dans l'axe.", 45),
    _dx('calisthenie', "Rowing inversé (table)", "Dos", "Tirage horizontal sous un appui.", ["Allongé sous une table solide", "Tire la poitrine vers l'appui", "Corps gainé", "Descente contrôlée"], "Genoux pliés pour faciliter.", 40),
    _dx('calisthenie', "Fentes alternées", "Quadriceps", "Travail unilatéral des jambes.", ["Grand pas en avant", "Descends le genou arrière", "Alterne", "Buste droit"], "Contrôle la descente.", 45),
    _dx('calisthenie', "Pike push-up", "Épaules", "Pompe en V pour les épaules.", ["Hanches hautes", "Crâne vers le sol", "Coudes contrôlés", "Pousse"], "Rapproche les pieds pour durcir.", 35),
    _dx('calisthenie', "Superman", "Dos", "Chaîne postérieure.", ["Sur le ventre", "Lève bras et jambes", "Serre les fessiers", "Tiens 1-2 s"], "Regarde le sol.", 40),
    _dx('calisthenie', "Hollow hold", "Abdominaux", "Gainage creux.", ["Bas du dos plaqué", "Épaules et jambes décollées", "Banane creuse", "Tiens"], "Genoux pliés pour faciliter.", 35),
    _dx('calisthenie', "Finisher — planche", "Abdominaux", "Gainage final.", ["Position planche", "Corps aligné", "Gaine tout", "Tiens"], "Qualité avant durée.", 45)
  ];

  // CONDITIONING — circuit métabolique au poids du corps
  var CALIS_COND = [
    CALIS_WU,
    _dx('calisthenie', "Burpees", "Cardio", "Mouvement complet explosif.", ["Squat, mains au sol", "Planche puis pompe (option)", "Ramène les pieds", "Saut vertical"], "Trouve un rythme tenable.", 40),
    _dx('calisthenie', "Mountain climbers", "Abdominaux", "Cardio + gainage.", ["Position planche", "Genoux à la poitrine en alternance rapide", "Bassin stable", "Souffle"], "Garde le dos plat.", 40),
    _dx('calisthenie', "Squats sautés", "Quadriceps", "Explosivité des jambes.", ["Squat puis saut", "Réception douce", "Ré-explose", "Dos droit"], "Amortis les réceptions.", 40),
    _dx('calisthenie', "Pompes", "Pectoraux", "Haut du corps.", ["Corps gainé", "Descends contrôlé", "Pousse fort", "Rythme"], "Forme avant vitesse.", 40),
    _dx('calisthenie', "High knees", "Cardio", "Course sur place genoux hauts.", ["Genoux hauts", "Bras dynamiques", "Cadence soutenue", "Avant des pieds"], "Reste léger et explosif.", 40),
    _dx('calisthenie', "Finisher — gainage actif", "Abdominaux", "Planche avec touches d'épaules.", ["Planche bras tendus", "Touche une épaule puis l'autre", "Bassin immobile", "Gaine"], "Écarte les pieds pour stabiliser.", 40)
  ];

  // PROGRESSIONS vers les figures (skill trees) — affichées dans l'app.
  var CALIS_PROGRESSIONS = [
    { skill: 'Traction (pull-up)', emoji: '🆙', muscle: 'Dos', steps: ['Rétractions scapulaires', 'Rowing inversé (horizontal)', 'Tractions négatives (descente lente)', 'Tractions assistées (élastique)', 'Traction complète', 'Tractions lestées'] },
    { skill: 'Dips', emoji: '💪', muscle: 'Triceps', steps: ['Dips sur banc, pieds au sol', 'Dips négatifs (descente lente)', 'Dips complets sur appuis', 'Dips lestés'] },
    { skill: 'Pistol squat', emoji: '🦵', muscle: 'Quadriceps', steps: ['Squats profonds contrôlés', 'Squats sur une jambe assistés', 'Pistol en boîte (sur un banc)', 'Pistol squat complet'] },
    { skill: 'Handstand (équilibre)', emoji: '🤸', muscle: 'Épaules', steps: ['Renforcement épaules (pike push-up)', 'Équilibre contre le mur', 'Montée en équilibre', 'Tenir en s\'éloignant du mur', 'Équilibre libre'] },
    { skill: 'L-sit', emoji: '📐', muscle: 'Abdominaux', steps: ['Gainage sol & compressions', 'L-sit pieds au sol (assisté)', 'L-sit genoux groupés', 'L-sit jambes tendues'] },
    { skill: 'Muscle-up', emoji: '⚡', muscle: 'Dos', steps: ['Tractions strictes solides', 'Tractions explosives (poitrine à la barre)', 'Travail de la transition (négatives)', 'Muscle-up complet'] },
    { skill: 'Planche', emoji: '🛩️', muscle: 'Épaules', steps: ['Pseudo-planche push-up', 'Planche lean (penché)', 'Tuck planche', 'Advanced tuck planche', 'Straddle planche', 'Full planche'] },
    { skill: 'Front lever', emoji: '➖', muscle: 'Dos', steps: ['Tractions & gainage solides', 'Tuck front lever', 'Advanced tuck', 'Une jambe tendue', 'Straddle', 'Full front lever'] },
    { skill: 'Drapeau humain', emoji: '🚩', muscle: 'Obliques', steps: ['Renforcement obliques/épaules', 'Appui vertical (support hold)', 'Drapeau jambes groupées', 'Descente lente', 'Drapeau complet'] }
  ];

  var COURSE_INTER = [
    _run("Échauffement — marche rapide", "3 min pour démarrer en douceur.", ["Marche d'un bon pas, puis trottine sur la fin", "Relâche les épaules", "Respire amplement", "Accélère progressivement"], "Ne pars pas à froid.", 180),
    _run("Footing progressif", "Une course qui accélère doucement du début à la fin.", ["Démarre TRÈS facile, comme un footing lent", "Augmente un peu l'allure toutes les 3-4 min", "Termine soutenu mais contrôlé (jamais à fond)", "Reste souple tout du long"], "Le but : finir plus vite que tu n'as commencé.", 600),
    _run("Bloc tempo modéré", "Allure soutenue mais tenable, dite « tempo ».", ["Allure « confortablement dure » et régulière", "Tu peux dire quelques mots, pas une phrase entière", "Respiration rythmée, foulée ample", "Tiens le bloc entier sans accélérer"], "C'est l'allure entre le footing et la course rapide.", 300),
    _run("Retour au calme", "Ralentis jusqu'à la marche pour récupérer.", ["Réduis l'allure jusqu'à la marche", "Continue de bouger 2-3 min", "Respire et relâche", "Hydrate-toi"], "Termine en douceur, jamais à l'arrêt net.", 180)
  ];
  var COURSE_CONF = [
    _run("Échauffement — footing", "Footing facile pour préparer l'effort au seuil.", ["Footing facile 4-5 min", "Quelques accélérations courtes", "Mobilise chevilles et hanches", "Respire amplement"], "Bien s'échauffer rend le bloc seuil plus efficace.", 360),
    _run("Tempo au seuil", "Bloc soutenu et régulier à l'allure « seuil ».", ["Allure ferme que tu pourrais tenir ~1h en course", "Reste régulier : ne pars surtout pas trop vite", "Respiration contrôlée, reste relâché", "Tiens le bloc entier"], "Si tu es à bout après 3 min, c'est que tu vas trop vite.", 600),
    _run("Récupération", "2 min de footing très lent entre les deux blocs.", ["Ralentis franchement", "Respire et récupère", "Reste en mouvement", "Prépare le 2e bloc"], "Juste de quoi repartir frais sur le bloc suivant.", 120),
    _run("2e bloc tempo", "Second effort au seuil, à la même allure que le 1er.", ["Reprends l'allure soutenue du 1er bloc", "Garde exactement la même intensité", "Foulée ample, respiration contrôlée", "Tiens jusqu'au bout"], "Vise la régularité : même allure que le bloc 1.", 300),
    _run("Retour au calme", "Ralentis jusqu'à la marche pour récupérer.", ["Footing lent puis marche", "Continue de bouger quelques minutes", "Respiration profonde, relâche", "Hydrate-toi"], "Termine toujours en douceur.", 240)
  ];
  var HIIT_INTER = [
    _dx('hiit', "Échauffement dynamique", "Cardio", "Montée en température.", ["Talons-fesses, montées de genoux", "Cercles de bras", "Quelques squats", "Respire"], "Prépare le cœur.", 60),
    _dx('hiit', "Squats", "Quadriceps", "Effort jambes.", ["Descends sous la parallèle", "Talons au sol", "Pousse fort", "Rythme régulier"], "Genoux dans l'axe.", 40),
    _dx('hiit', "Pompes", "Pectoraux", "Effort haut du corps.", ["Corps gainé", "Descends la poitrine", "Coudes ~45°", "Pousse"], "Sur les genoux si besoin.", 40),
    _dx('hiit', "Mountain climbers", "Abdominaux", "Cardio + gainage.", ["Position planche", "Genoux à la poitrine en alternance", "Bassin stable", "Rythme soutenu"], "Garde le dos plat.", 40),
    _dx('hiit', "Fentes alternées", "Quadriceps", "Jambes.", ["Fente avant", "Alterne les jambes", "Genou dans l'axe", "Buste droit"], "Contrôle la descente.", 40),
    _dx('hiit', "Jumping jacks", "Cardio", "Cardio.", ["Saut écart-serré", "Rythme régulier", "Reste léger", "Souffle"], "Tempo constant.", 40)
  ];
  var HIIT_CONF = [
    _dx('hiit', "Échauffement", "Cardio", "Préparation à l'intensité.", ["Cardio léger", "2-3 accélérations", "Mobilité", "Respire"], "Sois prêt à pousser.", 60),
    _dx('hiit', "Burpees", "Cardio", "Effort complet 40 s.", ["Burpee complet", "Saut vertical", "Enchaîne", "Souffle"], "Tiens la cadence.", 40, "Intermédiaire"),
    _dx('hiit', "Squats sautés", "Quadriceps", "Explosivité 40 s.", ["Squat puis saut", "Atterris en douceur", "Ré-explose", "Dos droit"], "Amortis les réceptions.", 40, "Intermédiaire"),
    _dx('hiit', "Pompes", "Pectoraux", "Haut du corps 40 s.", ["Corps gainé", "Descends contrôlé", "Pousse fort", "Rythme"], "Forme avant vitesse.", 40),
    _dx('hiit', "Mountain climbers rapides", "Abdominaux", "Cardio 40 s.", ["Planche", "Genoux très vite", "Bassin stable", "Souffle"], "Dos plat.", 40),
    _dx('hiit', "High knees", "Cardio", "Sprint sur place 40 s.", ["Genoux hauts", "Bras dynamiques", "Cadence max", "Avant des pieds"], "Reste explosif.", 40)
  ];
  var CORE_INTER = [
    _dx('core', "Échauffement gainage", "Abdominaux", "Activation.", ["Bascules de bassin", "Gainage léger", "Respiration abdo", "Mobilité dos"], "Engage le transverse.", 45),
    _dx('core', "Bird-dog", "Dos", "Stabilité en quadrupédie.", ["À quatre pattes", "Tends bras et jambe opposés", "Bassin immobile", "Alterne"], "Ne creuse pas le dos.", 40),
    _dx('core', "Dead bug", "Abdominaux", "Contrôle anti-cambrure.", ["Sur le dos, bras et jambes en l'air", "Descends bras et jambe opposés", "Bas du dos plaqué", "Alterne"], "Garde le dos au sol.", 40),
    _dx('core', "Pont fessier", "Ischio-jambiers", "Chaîne postérieure.", ["Sur le dos, pieds au sol", "Monte le bassin", "Serre les fessiers", "Descends contrôlé"], "Ne cambre pas en haut.", 40),
    _dx('core', "Planche", "Abdominaux", "Gainage isométrique.", ["Avant-bras et orteils", "Corps aligné", "Contracte tout", "Respire"], "Qualité avant durée.", 40),
    _dx('core', "Planche latérale (genoux)", "Obliques", "Gainage latéral accessible.", ["Sur l'avant-bras, genoux pliés", "Hanches hautes", "Aligne le corps", "Change de côté à mi-temps"], "Monte sur les pieds pour durcir.", 40)
  ];
  var CORE_CONF = [
    _dx('core', "Échauffement", "Abdominaux", "Activation profonde.", ["Gainage léger", "Mobilité dos/hanches", "Hollow court", "Respire"], "Réveille la sangle.", 45),
    _dx('core', "Planche + lever de bras", "Abdominaux", "Anti-rotation.", ["Planche bras tendus", "Lève un bras puis l'autre", "Bassin immobile", "Gaine"], "Écarte les pieds pour stabiliser.", 40, "Intermédiaire"),
    _dx('core', "Planche latérale dynamique", "Obliques", "Gainage latéral actif.", ["Planche latérale", "Monte/descends les hanches", "Reste aligné", "Change de côté à mi-temps"], "Hanches hautes.", 40, "Intermédiaire"),
    _dx('core', "Hollow hold", "Abdominaux", "Sur le dos, corps en 'banane' creuse, épaules et jambes décollées.", ["Sur le dos, bas du dos plaqué au sol", "Décolle légèrement épaules et jambes", "Le corps forme une banane creuse", "Tiens la position"], "Plie les genoux pour réduire la difficulté.", 35, "Intermédiaire"),
    _dx('core', "Relevés de jambes", "Abdominaux", "Bas des abdos.", ["Jambes tendues", "Monte à la verticale", "Descends sans toucher le sol", "Bas du dos plaqué"], "Contrôle la descente.", 40, "Intermédiaire"),
    _dx('core', "Mountain climbers lents", "Abdominaux", "Gainage dynamique contrôlé.", ["Position planche", "Ramène un genou lentement", "Bassin stable", "Alterne"], "Lenteur = intensité.", 40)
  ];
  var YOGA_INTER = [
    _dx('yoga', "Respiration", "Cardio", "Assieds-toi et respire pour te centrer.", ["Assis, dos droit", "Souffle long et profond", "Relâche les épaules", "Sois présent"], "Allonge l'expiration.", 45),
    _dx('yoga', "Salutation au soleil", "Corps entier", "Enchaînement fluide lié au souffle, du debout au sol et retour.", ["Bras au ciel, puis flexion avant", "Planche, puis chien tête en bas", "Reviens debout", "Synchronise au souffle"], "Mouvement lent et continu.", 60),
    _dx('yoga', "Posture de l'arbre", "Corps entier", "Debout sur une jambe, l'autre pied contre la cheville ou la cuisse.", ["Pose un pied sur la cheville/cuisse opposée (jamais le genou)", "Mains jointes devant la poitrine", "Fixe un point immobile", "Change de côté"], "Engage la jambe d'appui.", 45),
    _dx('yoga', "Chaise", "Quadriceps", "Comme assis sur une chaise invisible : genoux fléchis, bras levés.", ["Genoux fléchis comme pour t'asseoir", "Bras tendus vers le ciel", "Poids sur les talons, dos long", "Respire"], "Descends le bassin sans cambrer le dos.", 45),
    _dx('yoga', "Guerrier 3", "Corps entier", "En équilibre sur une jambe, buste et jambe arrière à l'horizontale (forme de T).", ["En appui sur une jambe, penche le buste vers l'avant", "Lève la jambe arrière jusqu'à l'horizontale", "Bras tendus devant ou le long du corps", "Change de côté"], "Garde le bassin droit (pas de bascule sur le côté).", 45, "Intermédiaire"),
    _dx('yoga', "Savasana", "Cardio", "Allongé et immobile, relâchement total.", ["Allongé sur le dos, immobile", "Relâche tout", "Souffle naturel", "Repos"], "Laisse-toi fondre.", 45)
  ];
  var YOGA_CONF = [
    _dx('yoga', "Respiration profonde", "Cardio", "Respiration lente pour te préparer.", ["Assis, dos droit", "Respiration longue", "Recentre-toi", "Présence"], "Ralentis le souffle.", 45),
    _dx('yoga', "Salutation dynamique", "Corps entier", "Flow soutenu enchaînant fente, planche et chien.", ["Enchaîne fente, planche, chien tête en bas", "Transitions contrôlées", "Synchronise au souffle", "Reste fluide"], "Gaine le ventre sur les transitions.", 60, "Intermédiaire"),
    _dx('yoga', "Planche → chaturanga", "Pectoraux", "Depuis la planche, descends coudes au corps en restant droit (la pompe du yoga).", ["Pars en planche bras tendus", "Descends en gardant les coudes près du corps", "Garde le corps parfaitement droit", "Pousse pour remonter, ou pose les genoux"], "Coudes près du buste, pas écartés.", 40, "Intermédiaire"),
    _dx('yoga', "Guerrier 2 + triangle", "Quadriceps", "Grande fente bras tendus (guerrier 2), puis bascule en triangle.", ["Guerrier 2 : fente latérale, bras tendus à l'horizontale", "Tends la jambe avant et bascule en triangle (main vers le pied)", "Ouvre la poitrine", "Change de côté"], "Ancre bien les pieds.", 60, "Intermédiaire"),
    _dx('yoga', "Demi-lune", "Corps entier", "Équilibre sur une main et une jambe, l'autre jambe levée à l'horizontale.", ["Une main au sol, jambe arrière levée à l'horizontale", "Ouvre le bassin sur le côté", "Bras du dessus vers le ciel", "Change de côté"], "Fixe un point au sol.", 45, "Intermédiaire"),
    _dx('yoga', "Savasana", "Cardio", "Allongé et immobile, intégration finale.", ["Allongé, immobile", "Relâche tout", "Souffle naturel", "Repos profond"], "Laisse le calme s'installer.", 45)
  ];

  BOXE_SESSIONS.push({ id: 'enchainements', name: 'Enchaînements', level: 'Intermédiaire', rest: 60, minLevel: 2, exercises: BOXE_INTER });
  BOXE_SESSIONS.push({ id: 'vitesse', name: 'Vitesse & contres', level: 'Confirmé', rest: 60, minLevel: 5, exercises: BOXE_CONF });
  CALIS_SESSIONS.push({ id: 'volume', name: 'Volume', level: 'Intermédiaire', rest: 25, minLevel: 2, exercises: CALIS_INTER });
  CALIS_SESSIONS.push({ id: 'force', name: 'Force & tenues', level: 'Confirmé', rest: 25, minLevel: 5, exercises: CALIS_CONF });
  CALIS_SESSIONS.push({ id: 'push', name: 'Pousser — pecto/épaules/triceps', level: 'Tous niveaux', rest: 30, exercises: CALIS_PUSH });
  CALIS_SESSIONS.push({ id: 'pull', name: 'Tirer — dos/biceps (barre)', level: 'Intermédiaire', rest: 35, minLevel: 2, exercises: CALIS_PULL });
  CALIS_SESSIONS.push({ id: 'legs', name: 'Jambes d\'acier', level: 'Tous niveaux', rest: 30, exercises: CALIS_LEGS });
  CALIS_SESSIONS.push({ id: 'gainage', name: 'Gainage du gymnaste', level: 'Tous niveaux', rest: 25, exercises: CALIS_CORE_POOL });
  CALIS_SESSIONS.push({ id: 'fullbody', name: 'Full body sans matériel', level: 'Tous niveaux', rest: 30, exercises: CALIS_FULL });
  CALIS_SESSIONS.push({ id: 'conditioning', name: 'Conditioning — circuit', level: 'Intermédiaire', rest: 20, minLevel: 3, exercises: CALIS_COND });
  CALIS_SESSIONS.push({ id: 'skills', name: 'Skills & figures', level: 'Avancé', rest: 60, minLevel: 5, exercises: CALIS_SKILL });
  COURSE_SESSIONS.push({ id: 'progressif', name: 'Endurance progressive', level: 'Intermédiaire', rest: 0, minLevel: 2, exercises: COURSE_INTER });
  COURSE_SESSIONS.push({ id: 'seuil', name: 'Seuil / Tempo', level: 'Confirmé', rest: 0, minLevel: 5, exercises: COURSE_CONF });
  HIIT_SESSIONS.push({ id: 'circuit', name: 'Circuit', level: 'Intermédiaire', rest: 20, minLevel: 2, exercises: HIIT_INTER });
  HIIT_SESSIONS.push({ id: 'emom', name: 'Intervalles 40/20', level: 'Confirmé', rest: 20, minLevel: 5, exercises: HIIT_CONF });
  CORE_SESSIONS.push({ id: 'stabilite', name: 'Stabilité', level: 'Intermédiaire', rest: 15, minLevel: 2, exercises: CORE_INTER });
  CORE_SESSIONS.push({ id: 'antirotation', name: 'Anti-rotation', level: 'Confirmé', rest: 15, minLevel: 5, exercises: CORE_CONF });
  YOGA_SESSIONS.push({ id: 'equilibre', name: 'Flow équilibre', level: 'Intermédiaire', rest: 5, minLevel: 2, exercises: YOGA_INTER });
  YOGA_SESSIONS.push({ id: 'puissance', name: 'Flow puissance', level: 'Confirmé', rest: 5, minLevel: 5, exercises: YOGA_CONF });

  /* ---- Yoga par objectif (intention plutôt que difficulté) ------------- */
  // Postures sous forme de fabriques : chaque appel renvoie un nouvel objet (pas de partage d'état).
  function pResp(d) { return _dx('yoga', "Respiration", "Cardio", "Assieds-toi et respire profondément pour te centrer.", ["Assis, dos droit, épaules relâchées", "Inspire 4 s par le nez, expire 6 s", "Sens le ventre se gonfler puis se vider", "Pose ton attention sur le souffle"], "Une expiration plus longue que l'inspiration apaise le système nerveux.", d || 45); }
  function pRespP(d) { return _dx('yoga', "Respiration profonde", "Cardio", "Respiration lente et longue pour calmer le mental.", ["Assis ou allongé, dos droit", "Inspire lentement par le nez", "Expire encore plus lentement", "Laisse les pensées passer sans t'y accrocher"], "Ralentis le souffle au maximum, sans forcer.", d || 60); }
  function pChatVache(d) { return _dx('yoga', "Chat-vache", "Dos", "À quatre pattes, alterne dos creux et dos rond au rythme du souffle.", ["À quatre pattes, mains sous les épaules", "Inspire en creusant le dos (regard vers le haut)", "Expire en arrondissant le dos (menton vers la poitrine)", "Mouvement lent et fluide"], "Synchronise chaque mouvement avec ta respiration.", d || 45); }
  function pEnfant(d) { return _dx('yoga', "Posture de l'enfant", "Dos", "Assis sur les talons, buste relâché vers l'avant, front au sol.", ["Assis sur les talons, genoux légèrement écartés", "Penche le buste vers l'avant, bras tendus devant", "Pose le front au sol", "Respire lentement dans le dos"], "Posture de repos : reviens-y dès que tu en as besoin.", d || 60); }
  function pTorsionAllongee(d) { var o = _dx('yoga', "Torsion allongée", "Obliques", "Allongé sur le dos, les genoux tombent d'un côté, bras en croix.", ["Allongé sur le dos, bras en croix", "Ramène les genoux vers la poitrine", "Laisse-les tomber doucement d'un côté", "Tourne la tête à l'opposé (l'app te dira de changer)"], "Garde les deux épaules au sol.", d || 40); o.bilateral = true; return o; }
  function pJambesMur(d) { return _dx('yoga', "Jambes contre le mur", "Cardio", "Allongé, fessiers près du mur, jambes tendues à la verticale contre le mur.", ["Approche les fessiers près d'un mur", "Monte les jambes tendues contre le mur", "Bras relâchés, paumes vers le haut", "Respire calmement et reste immobile"], "Posture très reposante : idéale en fin de journée.", d || 90); }
  function pCobra(d) { return _dx('yoga', "Posture du cobra", "Dos", "Allongé sur le ventre, mains sous les épaules, tu redresses doucement le buste.", ["Allongé sur le ventre, mains sous les épaules", "Pousse doucement pour soulever la poitrine", "Garde les coudes près du corps, épaules basses", "Ne force jamais : monte juste ce qui est confortable"], "Étire le ventre, ouvre la poitrine. Léger, sans à-coups.", d || 40); }
  function pPapillon(d) { return _dx('yoga', "Papillon", "Quadriceps", "Assis, plantes de pieds jointes, genoux qui s'ouvrent vers le sol.", ["Assis, joins les plantes des pieds", "Laisse les genoux s'ouvrir vers le sol", "Dos droit, attrape tes pieds", "Penche-toi doucement vers l'avant si confortable"], "Ouvre les hanches : ne pousse jamais sur les genoux.", d || 60); }
  function pPinceAssise(d) { return _dx('yoga', "Pince assise", "Ischio-jambiers", "Assis jambes tendues, tu plies le buste vers l'avant.", ["Assis, jambes tendues devant toi", "Penche le buste vers l'avant depuis les hanches", "Dos long, pas arrondi", "Attrape tes tibias, chevilles ou pieds"], "Plie un peu les genoux si l'arrière des jambes tire trop.", d || 60); }
  function pFenteHanches(d) { var o = _dx('yoga', "Fente des hanches", "Quadriceps", "Grande fente, genou arrière au sol, le bassin descend pour ouvrir la hanche.", ["Grand pas en avant, genou arrière au sol", "Laisse le bassin descendre vers l'avant", "Buste droit, mains sur le genou avant ou au sol", "Tiens ce côté (l'app te dira de changer)"], "Étire l'avant de la hanche arrière. Garde le buste droit.", d || 45); o.bilateral = true; return o; }
  function pCouEpaules(d) { var o = _dx('yoga', "Étirement cou & épaules", "Cardio", "Assis, tu inclines doucement la tête et relâches les épaules.", ["Assis, dos droit", "Incline doucement la tête vers une épaule", "Relâche les épaules vers le bas", "Respire (l'app te dira de changer)"], "Parfait pour dénouer les tensions d'une journée assise.", d || 25); o.bilateral = true; return o; }
  function pPontDoux(d) { return _dx('yoga', "Pont doux", "Ischio-jambiers", "Allongé, pieds au sol, tu soulèves doucement le bassin.", ["Allongé, pieds à plat près des fessiers", "Soulève doucement le bassin", "Serre légèrement les fessiers", "Descends lentement, vertèbre par vertèbre"], "Mouvement doux : ne cambre pas le bas du dos.", d || 40); }
  function pSalut(d) { return _dx('yoga', "Salutation au soleil", "Corps entier", "Enchaînement fluide lié au souffle : du debout au sol, puis retour.", ["Bras au ciel, puis flexion avant (mains vers le sol)", "Recule en planche, puis chien tête en bas", "Reviens vers l'avant et remonte debout", "Un mouvement = une inspiration ou une expiration"], "Bouge lentement et en continu, sans à-coups.", d || 60); }
  function pChien(d) { return _dx('yoga', "Chien tête en bas", "Ischio-jambiers", "En appui mains et pieds, bassin poussé haut : le corps forme un V renversé.", ["Mains et pieds au sol, écartés largeur d'épaules/bassin", "Pousse les hanches vers le haut et l'arrière", "Cherche à poser les talons, dos long", "Respire calmement"], "Plie les genoux si l'arrière des jambes tire trop.", d || 45); }
  function pGuerrier(d) { var o = _dx('yoga', "Guerrier", "Quadriceps", "Grande fente, genou avant plié, bras tendus à l'horizontale.", ["Grand pas en avant, genou avant fléchi", "Jambe arrière tendue, pied ancré au sol", "Bras tendus, regard devant", "Tiens ce côté (l'app te dira de changer)"], "Ancre fermement le pied arrière.", d || 30); o.bilateral = true; return o; }
  function pArbre(d) { var o = _dx('yoga', "Posture de l'arbre", "Corps entier", "Debout sur une jambe, l'autre pied posé contre la cheville ou la cuisse.", ["En appui sur une jambe, pose l'autre pied sur la cheville/cuisse (jamais le genou)", "Mains jointes devant la poitrine", "Fixe un point immobile", "Tiens (l'app te dira de changer)"], "Engage la jambe d'appui et fixe ton regard.", d || 25); o.bilateral = true; return o; }
  function pTorsionAssise(d) { var o = _dx('yoga', "Torsion assise", "Obliques", "Assis, tu tournes le buste d'un côté, colonne bien droite.", ["Assis, une jambe croisée par-dessus l'autre", "Grandis-toi puis tourne le buste", "Garde le dos droit", "Tiens (l'app te dira de changer)"], "Grandis-toi AVANT de tourner pour protéger le dos.", d || 25); o.bilateral = true; return o; }
  function pPinceDebout(d) { return _dx('yoga', "Pince debout", "Ischio-jambiers", "Debout, tu plies le buste vers l'avant pour étirer l'arrière des jambes.", ["Debout, penche le buste vers l'avant depuis les hanches", "Relâche la nuque et la tête", "Genoux souples", "Respire dans l'étirement"], "Laisse le poids du buste faire le travail.", d || 45); }
  function pSavasana(d) { return _dx('yoga', "Savasana", "Cardio", "Allongé sur le dos, totalement relâché : la posture de repos finale.", ["Allongé sur le dos, bras le long du corps, paumes vers le haut", "Relâche chaque partie du corps", "Respire naturellement", "Reste immobile et présent"], "Ne saute jamais cette posture : c'est un vrai temps de récupération.", d || 60); }

  var YOGA_MATIN = [pResp(45), pChatVache(45), pSalut(60), pChien(45), pGuerrier(), pArbre(), pSavasana(40)];
  var YOGA_SOIR = [pRespP(60), pChatVache(45), pEnfant(60), pTorsionAllongee(), pPinceAssise(45), pJambesMur(120), pSavasana(90)];
  var YOGA_STRESS = [pRespP(90), pEnfant(60), pChatVache(45), pCouEpaules(), pTorsionAssise(), pPinceDebout(45), pSavasana(90)];
  var YOGA_DOS = [pResp(45), pChatVache(60), pCobra(40), pEnfant(45), pTorsionAllongee(), pCouEpaules(), pPontDoux(40), pSavasana(60)];
  var YOGA_SOUPLESSE = [pResp(45), pChatVache(45), pChien(45), pFenteHanches(), pPapillon(60), pPinceAssise(60), pTorsionAssise(), pSavasana(60)];
  var YOGA_RECUP = [pResp(45), pChien(45), pFenteHanches(), pPinceDebout(45), pPapillon(45), pTorsionAllongee(), pEnfant(60), pSavasana(60)];

  // Séances par objectif : accessibles à tous (minLevel 1), groupées en tête de catalogue.
  YOGA_SESSIONS.push({ id: 'matin', name: '🌅 Réveil énergisant', level: 'Tous niveaux', rest: 5, minLevel: 1, goal: true, exercises: YOGA_MATIN });
  YOGA_SESSIONS.push({ id: 'soir', name: '🌙 Détente du soir', level: 'Tous niveaux', rest: 5, minLevel: 1, goal: true, exercises: YOGA_SOIR });
  YOGA_SESSIONS.push({ id: 'stress', name: '🧠 Anti-stress', level: 'Tous niveaux', rest: 5, minLevel: 1, goal: true, exercises: YOGA_STRESS });
  YOGA_SESSIONS.push({ id: 'dos', name: '🪑 Dos & posture', level: 'Tous niveaux', rest: 5, minLevel: 1, goal: true, exercises: YOGA_DOS });
  YOGA_SESSIONS.push({ id: 'souplesse', name: '🤸 Souplesse & hanches', level: 'Tous niveaux', rest: 5, minLevel: 1, goal: true, exercises: YOGA_SOUPLESSE });
  YOGA_SESSIONS.push({ id: 'recup', name: '💪 Récup post-séance', level: 'Tous niveaux', rest: 5, minLevel: 1, goal: true, exercises: YOGA_RECUP });

  // Postures par côté des paliers : prompt auto « Changez de côté » (moteur bilatéral déjà présent).
  (function () {
    var _perSide = ["Guerrier", "Guerrier 2 + triangle", "Guerrier 3", "Posture de l'arbre",
      "Torsion assise", "Chaise tournée", "Demi-lune", "Planche latérale yoga", "Posture du danseur"];
    YOGA_SESSIONS.forEach(function (s) {
      (s.exercises || []).forEach(function (e) {
        if (!e.bilateral && _perSide.indexOf(e.name) !== -1) {
          e.bilateral = true;
          e.duration = Math.max(20, Math.round((e.duration || 45) * 0.6));
        }
      });
    });
  })();

  /* ---- Générateur de séance yoga (à la Down Dog) ----------------------- */
  var YOGA_CUSTOM = null;
  function _yPick(pool, used, allPoses) {
    var avail = pool.filter(function (f) { return used.indexOf(f) < 0; });
    if (!avail.length && allPoses && allPoses.length) {
      // Pool du rôle épuisé → piocher n'importe quelle pose encore inutilisée
      // (évite les doublons dans la séance plutôt que de retomber sur le pool).
      avail = allPoses.filter(function (f) { return used.indexOf(f) < 0; });
    }
    var arr = avail.length ? avail : pool;
    var f = arr[Math.floor(Math.random() * arr.length)];
    used.push(f);
    return f;
  }
  function generateYogaSession(opts) {
    opts = opts || {};
    var durationMin = Math.max(3, Math.min(30, opts.durationMin || 10));
    var focus = opts.focus || 'complet';
    var intensity = opts.intensity || 'normal';

    var POOL = {
      center: [pResp, pRespP],
      warm: [pChatVache, pCouEpaules, pEnfant],
      sun: [pSalut, pChien],
      stand: [pGuerrier, pArbre, pChien, pPinceDebout],
      hips: [pFenteHanches, pPapillon, pPinceAssise, pChien],
      back: [pChatVache, pCobra, pPontDoux, pTorsionAllongee],
      twist: [pTorsionAssise, pTorsionAllongee],
      calm: [pEnfant, pJambesMur, pPinceAssise, pPapillon],
      final: [pSavasana]
    };
    var RECIPE = {
      reveil: ['sun', 'stand', 'stand', 'twist'],
      detente: ['back', 'calm', 'calm'],
      antistress: ['warm', 'twist', 'calm'],
      dos: ['back', 'back', 'twist'],
      hanches: ['hips', 'hips', 'twist'],
      souplesse: ['hips', 'stand', 'twist'],
      equilibre: ['sun', 'stand', 'stand'],
      complet: ['sun', 'stand', 'hips', 'twist']
    };
    var recipe = RECIPE[focus] || RECIPE.complet;

    var mainCount = Math.max(2, Math.min(14, Math.round(durationMin / 1.8)));
    var roles = ['center', 'warm'];
    for (var i = 0; i < mainCount; i++) { roles.push(recipe[i % recipe.length]); }
    if (durationMin >= 8) { roles.push('calm'); }
    roles.push('final');

    var used = [];
    // Réserve globale de poses (hors respiration/savasana) pour éviter tout doublon.
    var ALL_POSES = [];
    Object.keys(POOL).forEach(function (role) {
      if (role === 'center' || role === 'final') { return; }
      POOL[role].forEach(function (f) { if (ALL_POSES.indexOf(f) < 0) { ALL_POSES.push(f); } });
    });
    var poses = roles.map(function (role) {
      if (role === 'final') { return pSavasana(); }
      return _yPick(POOL[role], used, ALL_POSES)();
    });

    var BASE = {
      doux:      { center: 60, warm: 45, sun: 70, stand: 40, hips: 70, back: 50, twist: 55, calm: 95,  final: 120 },
      normal:    { center: 45, warm: 40, sun: 60, stand: 35, hips: 58, back: 42, twist: 48, calm: 78,  final: 95  },
      dynamique: { center: 30, warm: 30, sun: 55, stand: 30, hips: 45, back: 35, twist: 38, calm: 58,  final: 75  }
    };
    var baseMap = BASE[intensity] || BASE.normal;
    poses.forEach(function (p, idx) { p.duration = baseMap[roles[idx]] || 40; });

    // Ajuste pour viser la durée cible (le bilatéral compte ×2)
    var totalSec = poses.reduce(function (t, p) { return t + p.duration * (p.bilateral ? 2 : 1); }, 0);
    var factor = (durationMin * 60) / totalSec;
    // Plafonds par type de pose (selon les experts) : poses actives/de force bornées (≤60s),
    // poses restauratives plus longues. Le temps en plus va au repos, pas à un guerrier de 2 min.
    var ROLE_MAX = { center: 90, warm: 60, sun: 75, stand: 60, hips: 150, back: 60, twist: 75, calm: 180, final: 180 };
    poses.forEach(function (p, idx) {
      var cap = ROLE_MAX[roles[idx]] || 120;
      p.duration = Math.max(15, Math.min(cap, Math.round(p.duration * factor / 5) * 5));
    });
    // Le plafonnement peut laisser la séance sous la cible → on rallonge les poses qui
    // supportent des maintiens longs (hanches, torsions, calme, savasana) jusqu'à combler.
    var ABSORB = { hips: 90, twist: 70, calm: 120, final: 180 };
    var targetSec = durationMin * 60;
    for (var pass = 0; pass < 5; pass++) {
      var cur = poses.reduce(function (t, p) { return t + p.duration * (p.bilateral ? 2 : 1); }, 0);
      var deficit = targetSec - cur;
      if (deficit <= 10) { break; }
      var idxs = [];
      poses.forEach(function (p, idx) { var cap = ABSORB[roles[idx]]; if (cap && p.duration < cap) { idxs.push(idx); } });
      if (!idxs.length) { break; }
      var weight = idxs.reduce(function (n, idx) { return n + (poses[idx].bilateral ? 2 : 1); }, 0);
      var addPer = Math.max(5, Math.round((deficit / weight) / 5) * 5);
      idxs.forEach(function (idx) { var cap = ABSORB[roles[idx]]; poses[idx].duration = Math.min(cap, poses[idx].duration + addPer); });
    }

    var labels = { reveil: 'Réveil', detente: 'Détente', antistress: 'Anti-stress', dos: 'Dos & posture', hanches: 'Hanches', souplesse: 'Souplesse', equilibre: 'Équilibre', complet: 'Complète' };
    YOGA_CUSTOM = {
      id: 'custom', name: '✨ Ma séance · ' + (labels[focus] || 'Complète') + ' · ' + durationMin + ' min',
      level: 'Sur mesure', rest: 5, goal: true, generated: true, exercises: poses
    };
    return YOGA_CUSTOM;
  }

  /* ---- Registre générique des séances par discipline ------------------- */
  var DISCIPLINE_SESSIONS = {
    boxe: BOXE_SESSIONS,
    calisthenie: CALIS_SESSIONS,
    course: COURSE_SESSIONS,
    hiit: HIIT_SESSIONS,
    core: CORE_SESSIONS,
    yoga: YOGA_SESSIONS,
    pilates: PILATES_SESSIONS,
    barre: BARRE_SESSIONS,
    serenite: SERENITE_SESSIONS,
    mobilite: MOBILITE_SESSIONS
  };
  function listDisciplineSessions(disciplineId) {
    return DISCIPLINE_SESSIONS[disciplineId] || [];
  }
  function getDisciplineSession(disciplineId, sessionId) {
    if (sessionId === 'custom' && disciplineId === 'yoga' && YOGA_CUSTOM) { return YOGA_CUSTOM; }
    const list = DISCIPLINE_SESSIONS[disciplineId] || [];
    return list.filter(function (s) { return s.id === sessionId; })[0] || list[0] || null;
  }

  /* ---- Fiches explicatives par discipline ------------------------------ */
  var DISCIPLINE_GUIDES = {
    boxe: {
      about: "La boxe développe le cardio, la coordination et la puissance, sans aucun matériel : tu frappes dans le vide (shadow boxing) en soignant la technique.",
      howItWorks: "Les séances s'enchaînent en rounds chronométrés, sur le modèle de la boxe : des phases d'effort entrecoupées d'environ une minute de récupération. Plus ta Voie de l'Arène monte en niveau, plus des séances avancées (combos, élite) se débloquent.",
      principles: ["Garde toujours les mains hautes et le menton rentré.", "La puissance vient des hanches et des appuis, pas des bras.", "Privilégie une technique nette plutôt que la vitesse au début.", "Reviens en garde après chaque coup."],
      frequency: "2 à 3 fois par semaine, en laissant des jours plus légers entre les séances intenses."
    },
    calisthenie: {
      about: "La calisthénie, c'est la musculation au poids du corps : pousser, tirer, gainer, et des figures de gymnaste (équilibre, L-sit, planche, drapeau) qui se construisent par étapes.",
      howItWorks: "Tu disposes de séances par schéma de mouvement (Pousser, Tirer, Jambes, Gainage), d'un Full body, d'un circuit Conditioning, et de séances Skills pour les figures. Les paliers de ta Voie du Corps débloquent les contenus avancés. Surtout, des arbres de progression (plus bas) t'amènent étape par étape vers chaque figure — passe à l'étape suivante quand tu maîtrises la précédente.",
      principles: ["Maîtrise une progression avant de passer à la suivante.", "La qualité d'exécution prime sur le nombre de répétitions.", "Échauffe poignets et épaules avant les tenues.", "Respecte les prérequis (gainage solide) : ils évitent les blessures.", "Pour le Tirer et certaines figures, une barre de traction aide beaucoup."],
      frequency: "3 à 4 fois par semaine, en alternant les schémas (pousser / tirer / jambes / gainage)."
    },
    course: {
      about: "La course développe l'endurance cardiovasculaire. L'app te guide aussi bien sur du footing facile que sur du fractionné, au chrono.",
      howItWorks: "Chaque séance enchaîne des phases chronométrées : échauffement, effort, récupération, retour au calme. Le footing se court à allure conversationnelle ; le fractionné alterne efforts rapides et récupérations.",
      principles: ["Échauffe-toi toujours avant d'accélérer.", "Sur le footing, tu dois pouvoir tenir une conversation.", "Sur le fractionné, garde la même allure sur tous les efforts.", "Termine toujours par un retour au calme."],
      frequency: "2 à 4 fois par semaine, en mélangeant endurance et fractionné."
    },
    hiit: {
      about: "Le HIIT (entraînement fractionné à haute intensité) alterne efforts intenses et récupérations courtes pour un maximum d'effet en peu de temps.",
      howItWorks: "Les séances enchaînent des intervalles chronométrés. Le palier avancé est un vrai Tabata : 8 rounds de 20 s d'effort quasi-maximal / 10 s de repos, encadrés d'un échauffement et d'un retour au calme.",
      principles: ["L'intensité fait tout : donne-toi à fond sur les efforts.", "Garde une forme correcte même fatigué.", "Choisis des mouvements sûrs à exécuter à pleine vitesse.", "Le vrai Tabata est exigeant : limite-le à 1-3 fois par semaine."],
      frequency: "1 à 3 fois par semaine, avec des jours de récupération entre les séances dures."
    },
    core: {
      about: "Le gainage renforce la sangle abdominale et la stabilité du tronc — la base de tous les autres mouvements.",
      howItWorks: "Les séances enchaînent du gainage statique (planche) et dynamique (relevés, rotations). Les paliers avancés ajoutent des tenues exigeantes (dragon flag, L-sit) avec leurs prérequis.",
      principles: ["Garde le corps aligné : hanches ni trop hautes ni trop basses.", "Contracte abdos et fessiers, respire sans bloquer.", "La qualité de la tenue prime sur la durée.", "Respecte les prérequis des tenues avancées."],
      frequency: "3 à 5 fois par semaine — la sangle abdominale récupère vite."
    },
    yoga: {
      about: "Le yoga associe postures, équilibre et respiration pour gagner en souplesse, en force et en calme mental.",
      howItWorks: "Les séances enchaînent des postures tenues au chrono et des flows fluides. Les paliers avancés introduisent des postures d'équilibre et d'ouverture plus exigeantes.",
      principles: ["Synchronise chaque mouvement avec ta respiration.", "Va jusqu'à une tension légère, jamais la douleur.", "La régularité compte plus que la performance.", "Termine par un temps de relâchement (savasana)."],
      frequency: "De 2 fois par semaine à tous les jours, selon l'intensité."
    },
    pilates: {
      about: "Le Pilates renforce les muscles profonds (le 'centre' : abdos, plancher pelvien, dos) pour une meilleure posture, un ventre gainé et un corps stable et contrôlé.",
      howItWorks: "Les séances enchaînent des exercices tenus ou répétés au chrono, tout en contrôle et en respiration. L'accent est mis sur la qualité du mouvement plutôt que sur la vitesse ou la charge.",
      principles: ["Engage le centre (rentre le nombril) à chaque expiration.", "Privilégie le contrôle et la lenteur, jamais l'élan.", "Garde le bas du dos protégé et la nuque longue.", "La précision prime sur le nombre de répétitions."],
      frequency: "3 à 4 fois par semaine — excellent en complément de la musculation."
    },
    barre: {
      about: "La Barre s'inspire du ballet : de tout petits mouvements pulsés qui font travailler les muscles en profondeur (cuisses, fessiers, posture) jusqu'à la brûlure, sans impact.",
      howItWorks: "Des séries de pulsations contrôlées au chrono, sur de faibles amplitudes. La sensation de brûlure est normale : elle traduit le travail d'endurance musculaire ciblé.",
      principles: ["Garde la posture droite et grandie (épaules basses).", "Les mouvements sont petits et précis, jamais relâchés.", "Engage le centre pour stabiliser l'équilibre.", "La brûlure musculaire est le but : tiens jusqu'au bout."],
      frequency: "2 à 4 fois par semaine, sans impact — idéal en alternance."
    },
    serenite: {
      about: "La Sérénité regroupe la respiration guidée et la méditation : des outils simples et fondés pour faire baisser le stress, calmer le mental et mieux récupérer.",
      howItWorks: "Des séances courtes au chrono enchaînent des techniques de respiration (cohérence cardiaque, 4-7-8, respiration carrée) et de pleine conscience (scan corporel, ancrage). Rien à performer : il s'agit d'être présente.",
      principles: ["Une expiration plus longue que l'inspiration apaise le système nerveux.", "Si l'esprit s'évade, ramène-le doucement, sans te juger.", "La régularité (même 5 min) compte plus que la durée.", "Arrête-toi si tu ressens un vertige et reprends ta respiration normale."],
      frequency: "Quand tu veux — parfait le matin, le soir, ou après une séance intense."
    },
    mobilite: {
      about: "La mobilité entretient la souplesse et la récupération active : des étirements et mouvements doux pour garder un corps fluide.",
      howItWorks: "Un flow d'étirements tenus au chrono. Idéal en rituel complémentaire, les jours de repos ou après une grosse séance.",
      principles: ["Étire jusqu'à une tension légère, jamais la douleur.", "Respire profondément dans chaque posture.", "Mieux vaut souvent et doux que rare et forcé.", "Parfait pour récupérer entre les séances intenses."],
      frequency: "Quand tu veux — idéalement les jours de repos ou en fin de séance."
    }
  };
  function getDisciplineGuide(id) { return DISCIPLINE_GUIDES[id] || null; }

  /* ---- Exposition globale ---------------------------------------------- */
  global.DISCIPLINES = DISCIPLINES;
  global.DISCIPLINE_ORDER = DISCIPLINE_ORDER;
  global.getDiscipline = getDiscipline;
  global.listDisciplines = listDisciplines;
  global.listDisciplinesByRole = listDisciplinesByRole;
  global.getExerciseDiscipline = getExerciseDiscipline;
  global.BOXE_EXERCISES = BOXE_EXERCISES;
  global.BOXE_SESSIONS = BOXE_SESSIONS;
  global.getBoxeSession = getBoxeSession;
  global.CALIS_SESSIONS = CALIS_SESSIONS;
  global.CALIS_PROGRESSIONS = CALIS_PROGRESSIONS;

  /* ===== ARBRES DE PROGRESSION — autres disciplines ===== */
  var COURSE_PROGRESSIONS = [
    { skill: 'La Distance', emoji: '🏃', steps: ['Marcher 30 min sans pause', 'Alterner 1 min course / 2 min marche', 'Courir 10 min sans arrêt', 'Courir 30 min sans arrêt', 'Boucler 5 km', 'Boucler 10 km', 'Boucler un semi-marathon (21 km)', 'Boucler un marathon (42 km)'] },
    { skill: 'Le Fractionné', emoji: '⚡', steps: ['Tenir 8× (30s rapide / 30s lent)', 'Tenir 6× 1 min rapide', 'Répétitions de 400 m', 'Répétitions de 1 km au seuil', 'Pyramide 200-400-800-400-200'] }
  ];
  var CORE_PROGRESSIONS = [
    { skill: 'Le Gainage', emoji: '🧱', steps: ['Planche sur les genoux 30s', 'Planche complète 30s', 'Planche 60s', 'Planche pieds surélevés', 'Planche dynamique (touches d\'épaules)'] },
    { skill: 'Le Hollow & L-sit', emoji: '📐', steps: ['Dead bug contrôlé', 'Hollow genoux pliés', 'Hollow hold jambes tendues', 'Hollow rocks', 'L-sit groupé', 'L-sit jambes tendues'] },
    { skill: 'Le Dragon Flag', emoji: '🐉', steps: ['Relevés de jambes au sol', 'Relevés lents et contrôlés', 'Dragon flag négatif (descente lente)', 'Dragon flag groupé', 'Dragon flag complet'] }
  ];
  var YOGA_PROGRESSIONS = [
    { skill: 'L\'Équilibre', emoji: '🌳', steps: ['Posture de l\'arbre 30s', 'Guerrier 3', 'Demi-lune', 'Équilibre orteil-main'] },
    { skill: 'Les Flexions arrière', emoji: '🌙', steps: ['Cobra', 'Chien tête en haut', 'Pont (bassin haut)', 'Roue (chakrasana)'] },
    { skill: 'Les Inversions', emoji: '🙃', steps: ['Chien tête en bas solide', 'Pieds au mur (préparation)', 'Équilibre avant-bras au mur', 'Poirier sur la tête (sirsasana)', 'Poirier sur les mains (libre)'] },
    { skill: 'Équilibres sur les bras', emoji: '🤸', steps: ['Planche solide', 'Corbeau (bakasana)', 'Corbeau latéral', 'La Grue (bras tendus)'] }
  ];
  var MOBILITE_PROGRESSIONS = [
    { skill: 'Grand écart facial', emoji: '🤸', steps: ['Toucher ses orteils', 'Mains à plat au sol', 'Fente basse profonde', 'Demi-grand écart', 'Grand écart facial complet'] },
    { skill: 'Grand écart latéral', emoji: '🦋', steps: ['Papillon (ouvrir les hanches)', 'Squat profond tenu (malasana)', 'Écart latéral partiel', 'Grand écart latéral complet'] },
    { skill: 'Le Pont (souplesse dos)', emoji: '🌉', steps: ['Sphinx', 'Cobra complet', 'Pont sur les épaules', 'Pont complet (mains et pieds au sol)', 'Pont mains-pieds rapprochés'] },
    { skill: 'Épaules & dos', emoji: '💪', steps: ['Mains jointes dans le dos', 'Rotation au bâton (prise large)', 'Passe-bâton progressivement serré'] }
  ];
  var BOXE_PROGRESSIONS = [
    { skill: 'Les Fondamentaux', emoji: '🥊', steps: ['Garde & déplacements', 'Le jab (1)', 'Jab-cross (1-2)', 'Combo 1-2-3'] },
    { skill: 'La Défense', emoji: '🛡️', steps: ['Garde haute solide', 'Esquive (slip)', 'Esquive + contre', 'Esquives roulées (bobbing)'] },
    { skill: 'Le Jeu de jambes', emoji: '👟', steps: ['Pas chassés (sans croiser)', 'Pivots', 'Création d\'angles', 'Sortie latérale après combo'] },
    { skill: 'Combos avancés', emoji: '⚡', steps: ['Enchaînement 1-2-3-2', 'Intégrer les uppercuts', 'Doubles (jab-jab...)', 'Rafales en mouvement'] }
  ];
  var DISCIPLINE_PROGRESSIONS = {
    calisthenie: CALIS_PROGRESSIONS,
    course: COURSE_PROGRESSIONS,
    core: CORE_PROGRESSIONS,
    yoga: YOGA_PROGRESSIONS,
    mobilite: MOBILITE_PROGRESSIONS,
    boxe: BOXE_PROGRESSIONS
  };
  global.DISCIPLINE_PROGRESSIONS = DISCIPLINE_PROGRESSIONS;
  global.COURSE_SESSIONS = COURSE_SESSIONS;
  global.MOBILITE_SESSIONS = MOBILITE_SESSIONS;
  global.PILATES_SESSIONS = PILATES_SESSIONS;
  global.BARRE_SESSIONS = BARRE_SESSIONS;
  global.SERENITE_SESSIONS = SERENITE_SESSIONS;
  global.DISCIPLINE_SESSIONS = DISCIPLINE_SESSIONS;
  global.listDisciplineSessions = listDisciplineSessions;
  // Énumère tous les exercices d'une discipline (dédupliqués par nom),
  // normalisés pour être affichables dans la bibliothèque (equipment, tips…).
  function getDisciplineExercises(disciplineId) {
    var seen = {};
    var out = [];
    (DISCIPLINE_SESSIONS[disciplineId] || []).forEach(function (s) {
      (s.exercises || []).forEach(function (e) {
        if (!e || !e.name || seen[e.name]) { return; }
        seen[e.name] = true;
        var c = Object.assign({}, e);
        if (!Array.isArray(c.equipment)) { c.equipment = ['Poids du corps']; }
        if (!Array.isArray(c.instructions)) { c.instructions = c.instructions ? [c.instructions] : []; }
        if (!c.difficulty) { c.difficulty = 'Débutant'; }
        if (!c.muscle) { c.muscle = 'Corps entier'; }
        if (!c.description) { c.description = c.desc || ''; }
        if (!c.tips) { c.tips = c.tip || ''; }
        c._discipline = disciplineId;
        out.push(c);
      });
    });
    return out;
  }

  global.getDisciplineSession = getDisciplineSession;
  global.getDisciplineExercises = getDisciplineExercises;
  global.generateYogaSession = generateYogaSession;
  global.DISCIPLINE_GUIDES = DISCIPLINE_GUIDES;
  global.getDisciplineGuide = getDisciplineGuide;

})(typeof window !== 'undefined' ? window : this);
