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

})(typeof window !== 'undefined' ? window : this);
