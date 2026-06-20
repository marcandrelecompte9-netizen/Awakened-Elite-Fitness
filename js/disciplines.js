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
    }
  };

  // Ordre d'affichage stable (pour les listes/sélecteurs des briques suivantes)
  var DISCIPLINE_ORDER = ['muscu', 'boxe', 'calisthenie', 'course', 'mobilite'];

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
      tips: "La garde haute protège le menton dès le départ.", duration: 90
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
      rest: 30,                 // repos entre rounds (s)
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
    _run("Échauffement — marche rapide", "Mise en route progressive.", ["Marche soutenue", "Relâche les épaules", "Respire par le ventre", "Augmente l'allure peu à peu"], "Ne pars jamais à froid.", 180),
    _run("Footing endurance", "Course à allure facile et conversationnelle.", ["Foulée souple et régulière", "Tu dois pouvoir parler", "Pose le pied sous le centre de gravité", "Garde un rythme constant"], "Si tu es essoufflé, ralentis.", 900),
    _run("Retour au calme", "Décélération et récupération.", ["Réduis jusqu'à la marche", "Respire profondément", "Laisse le cœur redescendre", "Hydrate-toi"], "Étire-toi ensuite.", 180)
  ];
  // Fractionné 30/30 : échauffement + 8 cycles effort/récup + retour au calme.
  var COURSE_FRACTIONNE = [ _run("Échauffement — footing lent", "Préparation au fractionné.", ["Footing très facile", "Quelques accélérations courtes", "Mobilise les chevilles", "Respire amplement"], "Échauffe-toi bien avant l'intensité.", 360) ];
  for (var _i = 1; _i <= 8; _i++) {
    COURSE_FRACTIONNE.push(_run("Effort " + _i + "/8 (rapide)", "Course rapide soutenue.", ["Allure vive mais contrôlée", "Bras dynamiques", "Foulée ample", "Reste relâché"], "Vise une intensité régulière sur les 8.", 30));
    COURSE_FRACTIONNE.push(_run("Récupération " + _i + "/8", "Footing lent ou marche.", ["Ralentis franchement", "Respire et récupère", "Reste en mouvement", "Prépare l'effort suivant"], "La récup conditionne l'effort suivant.", 30));
  }
  COURSE_FRACTIONNE.push(_run("Retour au calme", "Récupération finale.", ["Footing très lent puis marche", "Respiration profonde", "Relâche tout le corps", "Hydrate-toi"], "Termine toujours en douceur.", 300));
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
    _bx("Échauffement & garde", "Mise en route et garde.", ["Sautillements légers", "Rotations épaules", "Mains hautes", "Respire"], "Reste léger.", 60),
    _bx("Combo 1-2-3-2", "Jab, cross, crochet, cross.", ["Enchaîne sans temps mort", "Pivote les hanches", "Reviens en garde", "Rythme régulier"], "La vitesse vient de la détente.", 90),
    _bx("Crochet – Uppercut – Crochet", "Enchaînement rapproché.", ["Crochet avant", "Uppercut arrière", "Crochet avant", "Compact et explosif"], "Reste gainé.", 90),
    _bx("Esquive + contre", "Slip puis riposte 1-2.", ["Esquive latérale", "Enchaîne jab-cross", "Replace-toi", "Garde les yeux devant"], "Esquive puis frappe sans délai.", 90),
    _bx("Doubles directs rapides", "Cadence sur les directs.", ["Jab-jab-cross", "Cadence élevée", "Épaules relâchées", "Souffle court"], "Privilégie la vitesse.", 60),
    _bx("Finisher — Burpee + combo", "Conditionnement final.", ["Burpee complet", "Remonte sur un 1-2-3", "Rythme soutenu", "Garde la technique"], "Dernier round, tout donner.", 60)
  ];
  function _cl(name, mus, desc, instr, tip, dur) {
    return { name: name, muscle: mus, difficulty: "Avancé", type: "exercise",
      equipment: ["Poids du corps"], mode: "timer", discipline: "calisthenie",
      description: desc, instructions: instr, tips: tip, duration: dur };
  }
  var CALIS_SKILLS = [
    _cl("Échauffement poignets & épaules", "Cardio", "Préparation spécifique aux tenues.", ["Cercles de poignets", "Pompes lentes", "Mobilité épaules", "Gainage léger"], "Échauffe bien les poignets.", 60),
    _cl("Tuck planche (tenue)", "Épaules", "Initiation à la planche, genoux groupés.", ["Mains au sol, penche-toi en avant", "Décolle les pieds, genoux groupés", "Épaules devant les mains", "Gaine fort"], "Avance les épaules pour charger.", 30),
    _cl("L-sit groupé (tenue)", "Abdominaux", "Base du L-sit.", ["Mains au sol, pousse pour décoller le bassin", "Genoux remontés vers la poitrine", "Épaules basses", "Tiens"], "Verrouille les coudes.", 30),
    _cl("Hollow rocks", "Abdominaux", "Gainage dynamique.", ["Position hollow", "Balance-toi d'avant en arrière", "Bas du dos plaqué", "Contrôle"], "Garde la banane.", 40),
    _cl("Pseudo-planche pompes", "Pectoraux", "Pompes mains avancées.", ["Mains à hauteur de taille, doigts vers l'arrière", "Penche le corps en avant", "Descends contrôlé", "Pousse"], "Plus tu penches, plus c'est dur.", 40),
    _cl("Handstand au mur (tenue)", "Épaules", "Équilibre assisté.", ["Pieds contre le mur, mains au sol", "Gaine le corps", "Pousse dans le sol", "Regarde entre tes mains"], "Garde les bras tendus.", 40)
  ];
  var COURSE_LONGUE = [
    _run("Échauffement — marche rapide", "Mise en route.", ["Marche soutenue", "Relâche les épaules", "Respire", "Accélère peu à peu"], "Ne pars pas à froid.", 180),
    _run("Sortie longue — endurance", "Course longue à allure facile.", ["Foulée souple", "Allure conversationnelle", "Rythme constant", "Bois si besoin"], "L'objectif c'est la durée, pas la vitesse.", 1200),
    _run("Accélérations en fin de sortie", "Quelques relances dynamiques.", ["Augmente l'allure 20-30 s", "Reste relâché", "Récupère entre chaque", "Foulée ample"], "Travaille la fin de course.", 120),
    _run("Retour au calme", "Récupération.", ["Footing très lent puis marche", "Respiration profonde", "Relâche", "Hydrate-toi"], "Termine en douceur.", 180)
  ];

  BOXE_SESSIONS.push({ id: 'combos', name: 'Combos avancés', level: 'Intermédiaire', rest: 30, minLevel: 3, exercises: BOXE_COMBOS });
  CALIS_SESSIONS.push({ id: 'skills', name: 'Skills — Tenues', level: 'Avancé', rest: 30, minLevel: 3, exercises: CALIS_SKILLS });
  COURSE_SESSIONS.push({ id: 'longue', name: 'Sortie longue', level: 'Intermédiaire', rest: 0, minLevel: 3, exercises: COURSE_LONGUE });

  /* ---- Séances ÉLITE (débloquées au niveau 6) -------------------------- */
  var BOXE_ELITE = [
    _bx("Échauffement explosif", "Montée en intensité rapide.", ["Sautillements + shadow rapide", "Quelques accélérations de coups", "Mobilité épaules", "Respire"], "Sois déjà chaud avant le 1er round.", 60),
    _bx("Combo 1-2-5-2", "Jab, cross, uppercut, cross.", ["Enchaîne sans rupture", "Charge l'uppercut avec les jambes", "Reviens en garde", "Cadence vive"], "L'uppercut part du sol.", 90),
    _bx("Triple crochet alterné", "Crochets en rafale.", ["Crochet avant / arrière / avant", "Pivote bien les hanches", "Reste compact", "Souffle sur l'impact"], "Ne télégraphie aucun coup.", 90),
    _bx("Double esquive + contre", "Slip-slip puis 1-2.", ["Deux esquives latérales", "Riposte jab-cross", "Replace-toi vite", "Yeux devant"], "Esquive puis frappe instantanément.", 90),
    _bx("Sprint de coups", "Cadence maximale.", ["Directs le plus vite possible", "Garde la technique", "Souffle court et régulier", "Reste relâché"], "Vitesse avant puissance.", 45),
    _bx("Finisher — Burpee + 30 s de feu", "Conditionnement maximal.", ["Burpee", "Puis 30 s de coups à fond", "Ne baisse jamais la garde", "Tout donner"], "Le dernier round décide tout.", 60)
  ];
  var CALIS_ELITE = [
    _cl("Échauffement complet", "Cardio", "Préparation articulaire et tendineuse.", ["Mobilité poignets/épaules", "Pompes lentes", "Gainage léger", "Squats"], "Échauffe sérieusement avant les skills.", 60),
    _cl("Tuck planche avancée (tenue)", "Épaules", "Planche groupée, épaules très avancées.", ["Penche fortement les épaules", "Décolle, genoux serrés", "Bassin haut", "Gaine au maximum"], "Plus les épaules avancent, plus c'est dur.", 30),
    _cl("Tuck front lever (tenue)", "Dos", "Suspension horizontale groupée (barre).", ["Suspends-toi, tire les omoplates", "Remonte le bassin à l'horizontale", "Genoux groupés", "Corps gainé"], "Garde les bras tendus.", 30),
    _cl("Archer push-ups", "Pectoraux", "Pompes asymétriques.", ["Pompe en chargeant un bras", "L'autre reste tendu", "Alterne les côtés", "Descente contrôlée"], "Reste gainé tout du long.", 40),
    _cl("Pistol squat négatif", "Quadriceps", "Descente lente sur une jambe.", ["Une jambe tendue devant", "Descends lentement sur l'autre", "Contrôle jusqu'en bas", "Remonte avec aide si besoin"], "La lenteur fait la force.", 40),
    _cl("Handstand mains rapprochées (tenue)", "Épaules", "Équilibre au mur, base resserrée.", ["Mains au sol près du mur", "Monte les pieds au mur", "Gaine, pousse dans le sol", "Tiens l'alignement"], "Bras tendus, regard entre les mains.", 40)
  ];
  var COURSE_ELITE = [ _run("Échauffement — footing + gammes", "Préparation à l'intensité.", ["Footing facile", "Talons-fesses, montées de genoux", "2-3 accélérations", "Mobilise les chevilles"], "Échauffe-toi à fond avant la VMA.", 360) ];
  for (var _j = 1; _j <= 10; _j++) {
    COURSE_ELITE.push(_run("VMA " + _j + "/10 (rapide)", "Effort proche du maximum.", ["Allure très soutenue", "Bras dynamiques", "Foulée ample et fréquente", "Reste relâché"], "Garde la même allure sur les 10.", 40));
    COURSE_ELITE.push(_run("Récupération " + _j + "/10", "Footing lent.", ["Ralentis bien", "Respire profondément", "Reste en mouvement", "Prépare l'effort suivant"], "Récupère activement.", 20));
  }
  COURSE_ELITE.push(_run("Retour au calme", "Récupération finale.", ["Footing très lent puis marche", "Respiration profonde", "Relâche tout le corps", "Hydrate-toi"], "Termine toujours en douceur.", 300));

  BOXE_SESSIONS.push({ id: 'elite', name: 'Élite — Rounds de feu', level: 'Élite', rest: 25, minLevel: 6, exercises: BOXE_ELITE });
  CALIS_SESSIONS.push({ id: 'elite', name: 'Élite — Force gymnique', level: 'Élite', rest: 30, minLevel: 6, exercises: CALIS_ELITE });
  COURSE_SESSIONS.push({ id: 'elite', name: 'Élite — VMA courte', level: 'Élite', rest: 0, minLevel: 6, exercises: COURSE_ELITE });

  /* ---- Registre générique des séances par discipline ------------------- */
  var DISCIPLINE_SESSIONS = {
    boxe: BOXE_SESSIONS,
    calisthenie: CALIS_SESSIONS,
    course: COURSE_SESSIONS,
    mobilite: MOBILITE_SESSIONS
  };
  function listDisciplineSessions(disciplineId) {
    return DISCIPLINE_SESSIONS[disciplineId] || [];
  }
  function getDisciplineSession(disciplineId, sessionId) {
    const list = DISCIPLINE_SESSIONS[disciplineId] || [];
    return list.filter(function (s) { return s.id === sessionId; })[0] || list[0] || null;
  }

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
  global.COURSE_SESSIONS = COURSE_SESSIONS;
  global.MOBILITE_SESSIONS = MOBILITE_SESSIONS;
  global.DISCIPLINE_SESSIONS = DISCIPLINE_SESSIONS;
  global.listDisciplineSessions = listDisciplineSessions;
  global.getDisciplineSession = getDisciplineSession;

})(typeof window !== 'undefined' ? window : this);
