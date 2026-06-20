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
    yoga: { id: 'yoga', name: 'Yoga', emoji: '🪷', color: '#d946ef', voie: 'La Voie du Zen', mode: 'timer', role: 'principal', tagline: 'Flows, postures et respiration.' }
  };

  // Ordre d'affichage stable (pour les listes/sélecteurs des briques suivantes)
  var DISCIPLINE_ORDER = ['muscu', 'boxe', 'calisthenie', 'course', 'hiit', 'core', 'yoga', 'mobilite'];

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

  BOXE_SESSIONS.push({ id: 'combos', name: 'Combos avancés', level: 'Intermédiaire', rest: 60, minLevel: 3, exercises: BOXE_COMBOS });
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
    _cl("Tuck planche avancée (tenue)", "Épaules", "Planche groupée, épaules très avancées.", ["Penche fortement les épaules", "Décolle, genoux serrés", "Bassin haut", "Gaine au maximum"], "Prérequis : poignets et gainage costauds. Échauffe bien les poignets ; arrête si douleur.", 30),
    _cl("Tuck front lever (tenue)", "Dos", "Suspension horizontale groupée (barre).", ["Suspends-toi, tire les omoplates", "Remonte le bassin à l'horizontale", "Genoux groupés", "Corps gainé"], "Prérequis : hollow hold solide + tractions, bras tendus, omoplates engagées. Arrête si douleur d'épaule ou de coude.", 30),
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
    _dx('hiit', "Échauffement dynamique", "Cardio", "Montée en température.", ["Talons-fesses, montées de genoux", "Cercles de bras", "Quelques squats", "Respire"], "Prépare le cœur et les jambes.", 60),
    _dx('hiit', "Jumping jacks", "Cardio", "Sauts écart-serré.", ["Saute en écartant bras et jambes", "Reviens serré", "Rythme régulier", "Reste léger"], "Garde un tempo constant.", 40),
    _dx('hiit', "Squats sautés", "Quadriceps", "Squat explosif.", ["Descends en squat", "Saute le plus haut possible", "Atterris en douceur", "Enchaîne"], "Amortis avec les genoux.", 30, "Intermédiaire"),
    _dx('hiit', "Mountain climbers", "Abdominaux", "Genoux à la poitrine en planche.", ["Position planche", "Ramène les genoux en alternance", "Bassin stable", "Rythme rapide"], "Garde le dos plat.", 30),
    _dx('hiit', "Burpees", "Cardio", "Mouvement complet.", ["Squat, planche, pompe", "Saut vertical", "Enchaîne sans pause", "Respire"], "Adapte le rythme à ta forme.", 30, "Intermédiaire"),
    _dx('hiit', "Fentes sautées", "Quadriceps", "Fentes alternées explosives.", ["Fente avant", "Saute et change de jambe en l'air", "Atterris contrôlé", "Garde l'équilibre"], "Buste droit.", 30, "Intermédiaire"),
    _dx('hiit', "Planche jacks", "Abdominaux", "Écart de jambes en planche.", ["Position planche", "Écarte et resserre les pieds en sautant", "Gaine fort", "Bassin stable"], "Ne creuse pas le dos.", 30),
    _dx('hiit', "High knees", "Cardio", "Montées de genoux rapides.", ["Cours sur place", "Monte les genoux haut", "Bras dynamiques", "Cadence maximale"], "Reste sur l'avant des pieds.", 30)
  ];
  var CORE_EXERCISES = [
    _dx('core', "Échauffement gainage", "Abdominaux", "Activation de la sangle.", ["Bascules de bassin", "Gainage léger", "Respiration abdominale", "Mobilité du dos"], "Engage le transverse.", 45),
    _dx('core', "Crunchs", "Abdominaux", "Flexion du buste.", ["Allongé, genoux pliés", "Décolle les épaules", "Souffle en montant", "Contrôle la descente"], "Ne tire pas sur la nuque.", 40),
    _dx('core', "Planche", "Abdominaux", "Gainage isométrique.", ["Avant-bras et orteils", "Corps aligné", "Contracte abdos et fessiers", "Respire"], "Hanches ni hautes ni basses.", 45),
    _dx('core', "Russian twists", "Obliques", "Rotations du buste.", ["Assis, buste incliné", "Tourne d'un côté à l'autre", "Talons au sol ou décollés", "Contrôle"], "Le mouvement vient du tronc.", 40),
    _dx('core', "Relevés de jambes", "Abdominaux", "Bas des abdominaux.", ["Allongé, jambes tendues", "Monte les jambes à la verticale", "Descends sans toucher le sol", "Bas du dos plaqué"], "Plie les genoux si trop dur.", 40),
    _dx('core', "Planche latérale", "Obliques", "Gainage de côté.", ["Sur un avant-bras, corps de côté", "Hanches hautes", "Change de côté à mi-temps", "Gaine"], "Aligne épaule-bassin-pied.", 40),
    _dx('core', "Hollow hold", "Abdominaux", "Gainage creux.", ["Sur le dos, bas du dos plaqué", "Épaules et jambes décollées", "Forme de banane", "Tiens"], "Plie les genoux pour réduire.", 30)
  ];
  var YOGA_EXERCISES = [
    _dx('yoga', "Respiration", "Cardio", "Centrage et souffle.", ["Assis, dos droit", "Inspire 4 s, expire 6 s", "Relâche les épaules", "Calme le mental"], "Allonge l'expiration.", 60),
    _dx('yoga', "Salutation au soleil", "Corps entier", "Enchaînement fluide.", ["Mains au ciel, flexion avant", "Planche puis chien tête en bas", "Reviens debout", "Synchronise au souffle"], "Mouvement lent et continu.", 60),
    _dx('yoga', "Chien tête en bas", "Ischio-jambiers", "Étirement global en V.", ["Mains et pieds au sol, bassin haut", "Pousse les talons vers le sol", "Dos long", "Respire"], "Plie les genoux si besoin.", 45),
    _dx('yoga', "Guerrier", "Quadriceps", "Posture d'ancrage.", ["Grande fente, bras tendus", "Genou avant fléchi", "Regard devant", "Change de côté à mi-temps"], "Ancre le pied arrière.", 60),
    _dx('yoga', "Posture de l'arbre", "Corps entier", "Équilibre sur une jambe.", ["Un pied sur la cheville/cuisse opposée", "Mains jointes", "Fixe un point", "Change de côté"], "Engage la jambe d'appui.", 45),
    _dx('yoga', "Torsion assise", "Obliques", "Rotation de la colonne.", ["Assis, une jambe croisée", "Tourne le buste", "Dos droit", "Change de côté à mi-temps"], "Grandis-toi avant de tourner.", 45),
    _dx('yoga', "Savasana", "Cardio", "Relâchement final.", ["Allongé sur le dos", "Bras le long du corps", "Relâche tout", "Respire naturellement"], "Laisse le corps fondre dans le sol.", 60)
  ];
  var HIIT_SESSIONS = [ { id: 'total', name: 'HIIT total', level: 'Débutant', rest: 25, exercises: HIIT_EXERCISES } ];
  var CORE_SESSIONS = [ { id: 'acier', name: "Sangle d'acier", level: 'Débutant', rest: 15, exercises: CORE_EXERCISES } ];
  var YOGA_SESSIONS = [ { id: 'flow', name: 'Flow Vinyasa doux', level: 'Débutant', rest: 5, exercises: YOGA_EXERCISES } ];

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
    _dx('core', "Hollow rocks", "Abdominaux", "Gainage dynamique.", ["Position hollow", "Balance d'avant en arrière", "Bas du dos plaqué", "Contrôle"], "Garde la banane.", 40, "Intermédiaire"),
    _dx('core', "Planche latérale + rotation", "Obliques", "Gainage latéral dynamique.", ["Planche latérale", "Passe le bras sous le buste", "Reviens ouvert", "Change de côté à mi-temps"], "Hanches hautes.", 40, "Intermédiaire")
  ];
  var CORE_ELITE = [
    _dx('core', "Échauffement complet", "Abdominaux", "Préparation à l'effort dur.", ["Gainage léger", "Mobilité dos/hanches", "Hollow hold court", "Respire"], "Échauffe bien le tronc.", 45),
    _dx('core', "Dragon flag négatif", "Abdominaux", "Descente corps gréé.", ["Allongé, agrippe un appui derrière la tête", "Corps droit à la verticale", "Descends lentement", "Garde le corps gainé"], "Prérequis : hollow hold 30 s, pas de souci lombaire. Commence groupé, descends très lentement. Stoppe si le bas du dos tire.", 30, "Avancé"),
    _dx('core', "L-sit (tenue)", "Abdominaux", "Maintien jambes tendues.", ["Mains au sol, décolle le bassin", "Jambes tendues à l'horizontale", "Épaules basses", "Tiens"], "Groupé si trop dur.", 30, "Avancé"),
    _dx('core', "Planche bras tendus alternés", "Abdominaux", "Planche instable.", ["Planche bras tendus", "Lève un bras puis l'autre", "Bassin immobile", "Gaine"], "Écarte un peu les pieds.", 40, "Avancé"),
    _dx('core', "Hollow hold long", "Abdominaux", "Gainage creux prolongé.", ["Position hollow", "Bas du dos plaqué", "Tiens sans bouger", "Respire"], "Descends les bras pour durcir.", 45, "Avancé"),
    _dx('core', "Planche latérale jambe levée", "Obliques", "Gainage latéral max.", ["Planche latérale", "Lève la jambe du dessus", "Hanches hautes", "Change de côté à mi-temps"], "Reste parfaitement aligné.", 40, "Avancé"),
    _dx('core', "RKC plank", "Abdominaux", "Gainage en contraction totale.", ["Planche avant-bras", "Contracte tout au maximum", "Tire les coudes vers les pieds", "Tiens"], "Intensité maximale, courte.", 30, "Avancé")
  ];
  var YOGA_FLOW = [
    _dx('yoga', "Respiration", "Cardio", "Centrage.", ["Assis, dos droit", "Souffle long", "Relâche les épaules", "Présence"], "Allonge l'expiration.", 45),
    _dx('yoga', "Salutation au soleil B", "Corps entier", "Enchaînement dynamique.", ["Chaise, flexion avant", "Guerrier, planche, chien", "Synchronise au souffle", "Fluide"], "Reste continu.", 60),
    _dx('yoga', "Guerrier 2 + triangle", "Quadriceps", "Force et ouverture.", ["Guerrier 2, bras tendus", "Passe en triangle", "Ouvre la poitrine", "Change de côté"], "Ancre les pieds.", 60),
    _dx('yoga', "Chaise tournée", "Obliques", "Équilibre en torsion.", ["Position chaise", "Tourne le buste, coude au genou", "Mains jointes", "Change de côté"], "Garde les genoux alignés.", 45, "Intermédiaire"),
    _dx('yoga', "Demi-lune", "Corps entier", "Équilibre latéral.", ["Main au sol, jambe arrière levée", "Ouvre le bassin", "Bras au ciel", "Change de côté"], "Fixe un point.", 45, "Intermédiaire"),
    _dx('yoga', "Pince debout", "Ischio-jambiers", "Étirement profond.", ["Debout, flexion avant", "Relâche la nuque", "Genoux souples", "Respire dans l'étirement"], "Lâche prise.", 45),
    _dx('yoga', "Savasana", "Cardio", "Relâchement.", ["Allongé, immobile", "Relâche tout", "Souffle naturel", "Laisse-toi fondre"], "Repos total.", 45)
  ];
  var YOGA_MAITRISE = [
    _dx('yoga', "Respiration profonde", "Cardio", "Préparation mentale.", ["Assis, dos droit", "Respiration longue", "Recentre-toi", "Présence totale"], "Ralentis le souffle.", 45),
    _dx('yoga', "Salutation avancée", "Corps entier", "Flow exigeant.", ["Enchaîne chaturanga, chien, fente", "Transitions contrôlées", "Synchronise au souffle", "Fluide"], "Gaine sur chaque transition.", 60, "Avancé"),
    _dx('yoga', "Posture du corbeau", "Épaules", "Équilibre sur les bras.", ["Accroupi, mains au sol", "Genoux sur les triceps", "Bascule le poids en avant", "Décolle les pieds"], "Débute au-dessus d'un coussin. Prérequis : poignets et gainage. Stoppe si douleur de poignet.", 30, "Avancé"),
    _dx('yoga', "Planche latérale yoga", "Obliques", "Vasisthasana.", ["Planche latérale bras tendu", "Hanches hautes", "Bras au ciel", "Change de côté à mi-temps"], "Empile les pieds.", 40, "Avancé"),
    _dx('yoga', "Posture du danseur", "Quadriceps", "Équilibre et ouverture.", ["Debout, attrape un pied derrière", "Pousse le pied dans la main", "Buste vers l'avant", "Change de côté"], "Fixe un point stable.", 45, "Avancé"),
    _dx('yoga', "Pont / roue", "Dos", "Ouverture du buste.", ["Allongé, pieds près des fessiers", "Pousse le bassin vers le haut", "Ouvre la poitrine", "Respire"], "Échauffe la colonne. Monte progressivement. À éviter en cas de souci lombaire ou d'épaule.", 40, "Intermédiaire"),
    _dx('yoga', "Savasana", "Cardio", "Intégration finale.", ["Allongé, immobile", "Relâche tout", "Souffle naturel", "Repos profond"], "Laisse le calme s'installer.", 60)
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
    _dx('boxe', "Échauffement & garde", "Cardio", "Mise en route et garde.", ["Sautillements légers", "Rotations épaules", "Mains hautes", "Respire"], "Reste léger sur les appuis.", 90),
    _dx('boxe', "Jab – Cross – Jab (1-2-1)", "Épaules", "Premier enchaînement à trois temps.", ["Jab, cross, jab", "Reviens en garde", "Pivote les hanches sur le cross", "Rythme régulier"], "Garde l'équilibre entre chaque coup.", 90, "Intermédiaire"),
    _dx('boxe', "Jab – Crochet (1-3)", "Épaules", "Direct puis crochet avant.", ["Jab", "Enchaîne un crochet du bras avant", "Coude à hauteur d'épaule", "Remets-toi en garde"], "Le crochet part de la hanche.", 90, "Intermédiaire"),
    _dx('boxe', "Esquive + Jab-Cross", "Corps entier", "Défense puis riposte.", ["Esquive latérale", "Riposte jab-cross", "Replace-toi", "Yeux devant"], "Esquive puis frappe sans délai.", 90, "Intermédiaire"),
    _dx('boxe', "Déplacements + combos", "Cardio", "Bouger en frappant.", ["Avance et recule en frappant", "Pas chassés", "Ne croise pas les pieds", "Garde haute"], "Frappe toujours bien campé.", 90, "Intermédiaire"),
    _dx('boxe', "Finisher — Shadow rapide", "Cardio", "Cardio final.", ["Shadow le plus vif possible", "Coups relâchés", "Bouge sans arrêt", "Souffle"], "Vitesse avant puissance.", 60, "Intermédiaire")
  ];
  var BOXE_CONF = [
    _dx('boxe', "Échauffement explosif", "Cardio", "Montée rapide en intensité.", ["Shadow vif", "Accélérations de coups", "Mobilité épaules", "Respire"], "Sois déjà chaud.", 60),
    _dx('boxe', "Combo 1-2-3 rapide", "Corps entier", "Enchaînement rapide.", ["Jab-cross-crochet vif", "Sans temps mort", "Reviens en garde", "Cadence soutenue"], "Garde la précision malgré la vitesse.", 90, "Avancé"),
    _dx('boxe', "Contre après esquive", "Corps entier", "Slip puis riposte 2-3.", ["Esquive", "Riposte cross-crochet", "Replace-toi vite", "Reste compact"], "Riposte instantanément.", 90, "Avancé"),
    _dx('boxe', "Doubles jabs + cross", "Épaules", "Cadence sur les directs.", ["Jab-jab-cross", "Cadence élevée", "Épaules relâchées", "Souffle court"], "Privilégie la vitesse.", 75, "Avancé"),
    _dx('boxe', "Uppercut – crochet en rafale", "Épaules", "Coups rapprochés.", ["Uppercut puis crochet", "Pivote les hanches", "Reste gainé", "Alterne les côtés"], "Compact et explosif.", 75, "Avancé"),
    _dx('boxe', "Finisher — 30 s de coups", "Cardio", "Effort maximal.", ["Coups à fond 30 s", "Garde la technique", "Ne baisse pas la garde", "Tout donner"], "Le round qui pique.", 45, "Avancé")
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
    _dx('calisthenie', "Hollow rocks", "Abdominaux", "Gainage dynamique.", ["Position hollow", "Balance d'avant en arrière", "Bas du dos plaqué", "Contrôle"], "Garde la banane.", 40, "Avancé")
  ];
  var COURSE_INTER = [
    _run("Échauffement — marche rapide", "Mise en route.", ["Marche soutenue", "Relâche les épaules", "Respire", "Accélère peu à peu"], "Ne pars pas à froid.", 180),
    _run("Footing progressif", "Course qui accélère doucement.", ["Démarre très facile", "Augmente l'allure toutes les 3-4 min", "Reste souple", "Termine soutenu mais contrôlé"], "Finis plus vite que tu n'as commencé.", 600),
    _run("Bloc tempo modéré", "Allure un peu inconfortable mais tenable.", ["Allure régulière et soutenue", "Respiration rythmée", "Foulée ample", "Tiens le bloc"], "Tu peux dire quelques mots, pas une phrase.", 300),
    _run("Retour au calme", "Récupération.", ["Réduis jusqu'à la marche", "Respire", "Relâche", "Hydrate-toi"], "Termine en douceur.", 180)
  ];
  var COURSE_CONF = [
    _run("Échauffement — footing", "Préparation au seuil.", ["Footing facile", "Quelques accélérations", "Mobilise les chevilles", "Respire"], "Échauffe-toi bien.", 360),
    _run("Tempo au seuil", "Allure de course soutenue tenue.", ["Allure ferme et régulière", "Respiration contrôlée", "Reste relâché", "Tiens le bloc entier"], "L'allure que tu pourrais tenir ~1h en course.", 600),
    _run("Récupération", "Footing lent.", ["Ralentis franchement", "Respire", "Reste en mouvement", "Prépare le 2e bloc"], "Récupère bien.", 120),
    _run("2e bloc tempo", "Second effort au seuil.", ["Reprends l'allure soutenue", "Garde la même intensité", "Foulée ample", "Tiens"], "Vise la régularité avec le 1er bloc.", 300),
    _run("Retour au calme", "Récupération finale.", ["Footing lent puis marche", "Respiration profonde", "Relâche", "Hydrate-toi"], "Termine toujours en douceur.", 240)
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
    _dx('core', "Hollow hold", "Abdominaux", "Gainage creux.", ["Bas du dos plaqué", "Épaules et jambes décollées", "Forme de banane", "Tiens"], "Plie les genoux pour réduire.", 35, "Intermédiaire"),
    _dx('core', "Relevés de jambes", "Abdominaux", "Bas des abdos.", ["Jambes tendues", "Monte à la verticale", "Descends sans toucher le sol", "Bas du dos plaqué"], "Contrôle la descente.", 40, "Intermédiaire"),
    _dx('core', "Mountain climbers lents", "Abdominaux", "Gainage dynamique contrôlé.", ["Position planche", "Ramène un genou lentement", "Bassin stable", "Alterne"], "Lenteur = intensité.", 40)
  ];
  var YOGA_INTER = [
    _dx('yoga', "Respiration", "Cardio", "Centrage.", ["Assis, dos droit", "Souffle long", "Relâche les épaules", "Présence"], "Allonge l'expiration.", 45),
    _dx('yoga', "Salutation au soleil", "Corps entier", "Enchaînement fluide.", ["Mains au ciel, flexion avant", "Planche, chien tête en bas", "Reviens debout", "Souffle"], "Mouvement continu.", 60),
    _dx('yoga', "Posture de l'arbre", "Corps entier", "Équilibre sur une jambe.", ["Un pied sur la cheville/cuisse opposée", "Mains jointes", "Fixe un point", "Change de côté"], "Engage la jambe d'appui.", 45),
    _dx('yoga', "Chaise", "Quadriceps", "Force des jambes.", ["Genoux fléchis, bras au ciel", "Poids sur les talons", "Dos long", "Respire"], "Descends le bassin.", 45),
    _dx('yoga', "Guerrier 3", "Corps entier", "Équilibre en appui.", ["En appui sur une jambe", "Buste et jambe arrière à l'horizontale", "Bras devant", "Change de côté"], "Garde le bassin droit.", 45, "Intermédiaire"),
    _dx('yoga', "Savasana", "Cardio", "Relâchement.", ["Allongé, immobile", "Relâche tout", "Souffle naturel", "Repos"], "Laisse-toi fondre.", 45)
  ];
  var YOGA_CONF = [
    _dx('yoga', "Respiration profonde", "Cardio", "Préparation.", ["Assis, dos droit", "Respiration longue", "Recentre-toi", "Présence"], "Ralentis le souffle.", 45),
    _dx('yoga', "Salutation dynamique", "Corps entier", "Flow soutenu.", ["Enchaîne fente, planche, chien", "Transitions contrôlées", "Synchronise au souffle", "Fluide"], "Gaine sur les transitions.", 60, "Intermédiaire"),
    _dx('yoga', "Planche → chaturanga", "Pectoraux", "Force et contrôle.", ["Planche bras tendus", "Descends coudes au corps", "Garde le corps droit", "Pousse ou pose les genoux"], "Coudes près du buste.", 40, "Intermédiaire"),
    _dx('yoga', "Guerrier 2 + triangle", "Quadriceps", "Force et ouverture.", ["Guerrier 2, bras tendus", "Passe en triangle", "Ouvre la poitrine", "Change de côté"], "Ancre les pieds.", 60, "Intermédiaire"),
    _dx('yoga', "Demi-lune", "Corps entier", "Équilibre latéral.", ["Main au sol, jambe arrière levée", "Ouvre le bassin", "Bras au ciel", "Change de côté"], "Fixe un point.", 45, "Intermédiaire"),
    _dx('yoga', "Savasana", "Cardio", "Intégration.", ["Allongé, immobile", "Relâche tout", "Souffle naturel", "Repos profond"], "Laisse le calme s'installer.", 45)
  ];

  BOXE_SESSIONS.push({ id: 'enchainements', name: 'Enchaînements', level: 'Intermédiaire', rest: 60, minLevel: 2, exercises: BOXE_INTER });
  BOXE_SESSIONS.push({ id: 'vitesse', name: 'Vitesse & contres', level: 'Confirmé', rest: 60, minLevel: 5, exercises: BOXE_CONF });
  CALIS_SESSIONS.push({ id: 'volume', name: 'Volume', level: 'Intermédiaire', rest: 25, minLevel: 2, exercises: CALIS_INTER });
  CALIS_SESSIONS.push({ id: 'force', name: 'Force & tenues', level: 'Confirmé', rest: 25, minLevel: 5, exercises: CALIS_CONF });
  COURSE_SESSIONS.push({ id: 'progressif', name: 'Endurance progressive', level: 'Intermédiaire', rest: 0, minLevel: 2, exercises: COURSE_INTER });
  COURSE_SESSIONS.push({ id: 'seuil', name: 'Seuil / Tempo', level: 'Confirmé', rest: 0, minLevel: 5, exercises: COURSE_CONF });
  HIIT_SESSIONS.push({ id: 'circuit', name: 'Circuit', level: 'Intermédiaire', rest: 20, minLevel: 2, exercises: HIIT_INTER });
  HIIT_SESSIONS.push({ id: 'emom', name: 'Intervalles 40/20', level: 'Confirmé', rest: 20, minLevel: 5, exercises: HIIT_CONF });
  CORE_SESSIONS.push({ id: 'stabilite', name: 'Stabilité', level: 'Intermédiaire', rest: 15, minLevel: 2, exercises: CORE_INTER });
  CORE_SESSIONS.push({ id: 'antirotation', name: 'Anti-rotation', level: 'Confirmé', rest: 15, minLevel: 5, exercises: CORE_CONF });
  YOGA_SESSIONS.push({ id: 'equilibre', name: 'Flow équilibre', level: 'Intermédiaire', rest: 5, minLevel: 2, exercises: YOGA_INTER });
  YOGA_SESSIONS.push({ id: 'puissance', name: 'Flow puissance', level: 'Confirmé', rest: 5, minLevel: 5, exercises: YOGA_CONF });

  /* ---- Registre générique des séances par discipline ------------------- */
  var DISCIPLINE_SESSIONS = {
    boxe: BOXE_SESSIONS,
    calisthenie: CALIS_SESSIONS,
    course: COURSE_SESSIONS,
    hiit: HIIT_SESSIONS,
    core: CORE_SESSIONS,
    yoga: YOGA_SESSIONS,
    mobilite: MOBILITE_SESSIONS
  };
  function listDisciplineSessions(disciplineId) {
    return DISCIPLINE_SESSIONS[disciplineId] || [];
  }
  function getDisciplineSession(disciplineId, sessionId) {
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
      about: "La calisthénie, c'est la musculation au poids du corps : pompes, squats, dips, et des figures de gymnaste (planche, L-sit) qui se construisent par étapes.",
      howItWorks: "Tu commences par les fondations, puis les paliers Skills et Élite débloquent des tenues et des figures plus exigeantes à mesure que ta Voie du Corps progresse. Les figures avancées demandent des prérequis (gainage solide) — ils sont indiqués dans les conseils.",
      principles: ["Maîtrise une progression avant de passer à la suivante.", "La qualité d'exécution prime sur le nombre de répétitions.", "Échauffe poignets et épaules avant les tenues.", "Respecte les prérequis : ils évitent les blessures."],
      frequency: "3 à 4 fois par semaine, en alternant les groupes (pousser / tirer / gainage)."
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
  global.COURSE_SESSIONS = COURSE_SESSIONS;
  global.MOBILITE_SESSIONS = MOBILITE_SESSIONS;
  global.DISCIPLINE_SESSIONS = DISCIPLINE_SESSIONS;
  global.listDisciplineSessions = listDisciplineSessions;
  global.getDisciplineSession = getDisciplineSession;
  global.DISCIPLINE_GUIDES = DISCIPLINE_GUIDES;
  global.getDisciplineGuide = getDisciplineGuide;

})(typeof window !== 'undefined' ? window : this);
