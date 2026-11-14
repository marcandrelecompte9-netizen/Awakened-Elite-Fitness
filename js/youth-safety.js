/* ═══════════════════════════════════════════════════════════════════
   SÉCURITÉ JEUNES — adapte l'app pour les profils d'enfants/pré-ados
   ───────────────────────────────────────────────────────────────────
   S'appuie sur l'ÂGE déjà saisi dans le profil (userProfile.age). Pour un
   profil jeune, on affiche des avertissements et on signale les exercices
   à charge lourde, sans bloquer durement (approche éducative + supervision
   adulte recommandée). 100 % local.

   Repères (recommandations générales de prudence, pas un avis médical) :
     • < 13 ans  : privilégier le poids du corps, la coordination, le jeu.
                    Éviter les charges lourdes / la recherche du max.
     • 13-15 ans : introduction progressive des charges légères, encadrée.
     • ≥ 16 ans  : accès normal.
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  // Équipements considérés « charge lourde / externe » à éviter chez l'enfant.
  var HEAVY_EQUIPMENT = ['Barre', 'Machine', 'Kettlebell', 'Sac de sable', 'Barres parallèles'];
  // Équipements OK pour les jeunes (poids du corps, résistance légère…).
  // (tout ce qui n'est pas dans HEAVY_EQUIPMENT est toléré, mais on garde
  //  cette liste pour d'éventuels usages futurs.)

  function _age() {
    try {
      var p = (typeof window.getUserProfile === 'function') ? window.getUserProfile() : null;
      // Priorité à la DATE de naissance : elle vieillit toute seule.
      if (p && p.birthdate) {
        var _reel = _ageFromBirth(p.birthdate);
        if (_reel !== null) return _reel;
      }
      var a = p && p.age ? parseInt(p.age) : null;
      return (a && a > 0 && a < 120) ? a : null;
    } catch (e) { return null; }
  }

  // Âge d'un AUTRE profil (lit profile_<id>_userProfile). null si inconnu.
  function _ageOf(profileId) {
    try {
      if (!profileId) return _age();
      var cur = (typeof window.getCurrentProfileId === 'function') ? window.getCurrentProfileId() : null;
      if (profileId === cur) return _age();
      var raw = localStorage.getItem('profile_' + profileId + '_userProfile');
      if (!raw) return null;
      var p = JSON.parse(raw);
      // Priorité à la DATE de naissance : elle vieillit toute seule.
      if (p && p.birthdate) {
        var _reel = _ageFromBirth(p.birthdate);
        if (_reel !== null) return _reel;
      }
      var a = p && p.age ? parseInt(p.age) : null;
      return (a && a > 0 && a < 120) ? a : null;
    } catch (e) { return null; }
  }

  function _catFromAge(a) {
    if (a === null) return 'unknown';
    if (a < 13) return 'child';
    if (a < 16) return 'teen';
    if (a >= 65) return 'senior';
    return 'adult';
  }


  // 🎂 CHANGEMENT DE CATÉGORIE D'ÂGE
  // Quand un enfant passe 13 ans (ou un ado 16), les règles qui le protégeaient
  // changent d'un coup : charges, défis compétitifs, contenus. Le faire en
  // silence serait déroutant — l'app doit le DIRE et expliquer ce qui change.
  // 🎂 Âge RÉEL calculé depuis la date de naissance.
  // ⚠️ Elle aussi était APPELÉE sans être définie (2 usages) : dès qu'un
  // profil avait une date de naissance, la lecture de son âge levait une
  // ReferenceError et la protection tombait.
  function _ageFromBirth(bd) {
    try {
      var d = new Date(bd);
      if (isNaN(d.getTime())) return null;
      var n = new Date();
      var a = n.getFullYear() - d.getFullYear();
      var m = n.getMonth() - d.getMonth();
      if (m < 0 || (m === 0 && n.getDate() < d.getDate())) a--;
      return (a >= 0 && a < 120) ? a : null;
    } catch (e) { return null; }
  }

  // 🎂 Est-ce l'anniversaire du profil aujourd'hui ?
  // ⚠️ Cette fonction était EXPOSÉE dans l'API sans avoir été définie : le
  // module entier plantait au chargement (ReferenceError), donc AwakYouth
  // n'existait pas et TOUTES les protections enfant étaient inactives.
  function isBirthdayToday(profileId) {
    try {
      var id = profileId || (typeof getCurrentProfileId === 'function' ? getCurrentProfileId() : null);
      if (!id) return false;
      var raw = localStorage.getItem('profile_' + id + '_userProfile');
      if (!raw) return false;
      var p = JSON.parse(raw);
      if (!p || !p.birthdate) return false;
      var d = new Date(p.birthdate), n = new Date();
      if (isNaN(d.getTime())) return false;
      return d.getDate() === n.getDate() && d.getMonth() === n.getMonth();
    } catch (e) { return false; }
  }

  function checkAgeTransition() {
    try {
      var id = (typeof getCurrentProfileId === 'function') ? getCurrentProfileId() : null;
      if (!id) return null;
      var cat = ageCategoryOf(id);
      var cle = 'awakAgeCat_' + id;
      var avant = localStorage.getItem(cle);
      if (avant === cat) return null;
      localStorage.setItem(cle, cat);
      if (!avant) return null;              // première visite : rien à annoncer
      if (avant === 'child' && cat === 'teen') {
        return { de: 'child', vers: 'teen',
          titre: 'Tu passes au niveau supérieur',
          texte: "Maintenant que tu as 13 ans, le Système t'ouvre de nouvelles "
               + "possibilités : des charges adaptées, des défis avec les autres, "
               + "un suivi plus détaillé de ta progression, et le mode jeu "
               + "(Failles et combats) à activer dans les Réglages." };
      }
      if (avant === 'teen' && cat === 'adult') {
        return { de: 'teen', vers: 'adult',
          titre: 'Le Système te reconnaît',
          texte: "Tu as 16 ans. Toutes les fonctions sont désormais accessibles, "
               + "sans restriction d'âge. À toi de choisir ton rythme." };
      }
      return null;
    } catch (e) { return null; }
  }

  // Catégorie d'un profil donné (ou actif si non précisé).
  function ageCategoryOf(profileId) {
    return _catFromAge(_ageOf(profileId));
  }
  function isYoungProfile(profileId) {
    var c = ageCategoryOf(profileId);
    return c === 'child' || c === 'teen';
  }
  function isChildProfile(profileId) {
    return ageCategoryOf(profileId) === 'child';
  }

  // Catégorie d'âge du profil actif.
  function ageCategory() {
    var a = _age();
    if (a === null) return 'unknown';
    if (a < 13) return 'child';       // enfant / pré-ado
    if (a < 16) return 'teen';        // ado, charges légères encadrées
    if (a >= 65) return 'senior';     // programmes adaptés proposés EN PLUS
    return 'adult';                   // accès normal
  }

  function isYoung() {
    var c = ageCategory();
    return c === 'child' || c === 'teen';
  }
  function isChild() { return ageCategory() === 'child'; }
  function isSenior() { return ageCategory() === 'senior'; }
  function isSeniorProfile(profileId) { return ageCategoryOf(profileId) === 'senior'; }

  // v1759 : MOINS DE 13 ANS — liste blanche. Seuls ces exercices (poids du corps,
  // mouvements de base, sauts légers, marches d'animaux, équilibre, gainage court,
  // mobilité douce, yoga sans inversion) peuvent sortir dans ses séances.
  // Sources : position NSCA 2009 (renforcement au poids du corps supervisé),
  // directives canadiennes 24 h (renforcer muscles et os 3 j/sem : sauter, grimper),
  // pliométrie de faible intensité seulement (pas de sauts en contrebas ni sauts
  // groupés), yoga enfant sans poirier, chandelle ni rétention du souffle.
  // Retirés : inversions (pike, handstand, wall walk), dips, Nordic, pistol, leviers,
  // sauts explosifs, pompes avancées, fractionné de course, matériel improvisé
  // (sac, serviette, porte, table, banc), techniques de respiration avec apnée.
  var KIDS_OK = {};
  [
    "Pompes classiques",
    "Pompes",
    "Pompes genoux",
    "Pompes genoux lentes",
    "Pompes au mur",
    "Pompes inclinées",
    "Pompes larges",
    "Superman",
    "Superman dynamique",
    "Superman (extensions dorsales)",
    "Planche",
    "Planche (gainage)",
    "Planche courte",
    "Planche latérale (genoux)",
    "Planche latérale",
    "Dead bug",
    "Dead bug lent",
    "Coléoptère (Dead Bug)",
    "Bird dog",
    "Bird-dog",
    "Glute Bridge",
    "Pont fessier",
    "Pont fessier (Bridge)",
    "Glute bridge léger",
    "Pont doux",
    "Squat classique",
    "Squats",
    "Squats au poids du corps",
    "Squats poids corps légers",
    "Squats légers",
    "Squat sumo",
    "Fentes arrière",
    "Fentes alternées",
    "Fentes avant alternées",
    "Fentes marchées",
    "Fentes marchées dynamiques",
    "Fentes dynamiques",
    "Wall sit",
    "Fire hydrant",
    "Donkey Kicks",
    "Calf Raises debout",
    "Mollets debout",
    "Montées sur pointes",
    "Sauts mollets",
    "Crunch classique",
    "Crunchs",
    "Mountain climbers",
    "Mountain climbers lents",
    "Shoulder taps en planche",
    "Planche épaule-touch",
    "Snow angels inversés",
    "Nageur au sol",
    "Y-T-W au sol",
    "Bear crawl",
    "Bear Crawl (marche de l'ours)",
    "Marche du crabe",
    "Inchworm",
    "Activation fessiers (clamshell)",
    "Abductions de hanche (préhab)",
    "Jumping jacks",
    "Jumping Jacks légers",
    "Jumping jacks d'échauffement",
    "Étoile sautée",
    "High knees",
    "Montées de genoux sur place",
    "Montées de genoux légères",
    "Marche sur place",
    "Marche sur place active",
    "Talons-fesses légers",
    "Pas chassés latéraux",
    "Skipping (pas sautés)",
    "Sautillements sur une jambe",
    "Marelle sur place",
    "Sauts latéraux par-dessus une ligne",
    "Sauts de grenouille",
    "Burpees légers",
    "Broad Jump (saut en longueur)",
    "Navette (Shuttle Run)",
    "Marche rapide (Power Walk)",
    "Déplacements (footwork)",
    "Équilibre sur une jambe",
    "Avion sur une jambe",
    "Marche talon-pointe",
    "Posture de l'arbre",
    "Jab – Cross (1-2)",
    "Shadow Boxing",
    "Sautillements en garde",
    "Garde et pas chassés",
    "Cercles de bras",
    "Cercles bras",
    "Moulinets bras",
    "Rotations épaules",
    "Rotations poignets",
    "Rotations tronc",
    "Rotations hanches",
    "Cercles hanche",
    "Cercles chevilles",
    "Cercles de chevilles",
    "Balancements de jambe",
    "Flexions genoux",
    "Cat-Cow",
    "Chat-vache",
    "Chat-Vache (Cat-Cow)",
    "Chat-dos rond",
    "Rotations thoraciques",
    "Posture enfant",
    "Posture de l'enfant",
    "Cobra",
    "Posture du cobra",
    "Étirement quadriceps debout",
    "Étirement ischio assis",
    "Étirement mollets mur",
    "Étirement complet debout",
    "Étirement latéral debout",
    "Étirement bras croisés",
    "Étirement triceps",
    "Papillon",
    "Torsion allongée",
    "Torsion spinale allongée",
    "Étirement fessier allongé",
    "Respiration profonde",
    "Respiration",
    "Chien tête en bas",
    "Guerrier",
    "Chaise",
    "Savasana",
    "Salutation au soleil",
    "Roulé en boule (Rolling Like a Ball)"
  ].forEach(function (n) { KIDS_OK[n] = true; });
  function kidOk(exercise) {
    if (exercise._kids || exercise.isRest || exercise.isInfo) return true;   // missions enfant, repos
    return !!(KIDS_OK[exercise.name] || (exercise._baseName && KIDS_OK[exercise._baseName]));
  }

  // Un exercice est-il déconseillé pour le profil jeune actif ?
  function isDiscouraged(exercise) {
    if (!isYoung()) return false;
    if (!exercise) return false;
    if (isChild()) return !kidOk(exercise);
    var eq = exercise.equipment || [];
    if (!Array.isArray(eq)) eq = [eq];
    // charge lourde → déconseillé pour un enfant ; pour un ado, seulement la barre/machine lourde
    var heavy = eq.some(function (e) { return HEAVY_EQUIPMENT.indexOf(e) !== -1; });
    // v1336 : moins de 13 ans → POIDS DU CORPS seulement (plus d'haltères ni
    // d'élastiques dans ses séances : il s'entraîne au minuteur, sans charge à noter)
    if (isChild()) return heavy || eq.some(function (e) { return !/^(Poids du corps|Aucun|Tapis de sol)$/i.test(String(e)); });
    // ado : on tolère haltères/kettlebell légers, on déconseille barre + machine
    return eq.some(function (e) { return e === 'Barre' || e === 'Machine'; });
  }

  // 🧒 PROGRAMMES & OBJECTIFS déconseillés avant 13 ans.
  // isDiscouraged() filtre les EXERCICES (par matériel), mais rien ne filtrait
  // les PROGRAMMES ni les OBJECTIFS : un enfant se voyait proposer « Prise de
  // masse 12 semaines », « Hypertrophie+ » ou une périodisation à 90 %
  // d'intensité. Ce sont des cadres d'entraînement pensés pour un corps adulte,
  // pas des exercices isolés — d'où un second filtre.
  var GOALS_ADULT = ['hypertrophy', 'hypertrophy+', 'strength', 'masse', 'powerlifting', 'cut', 'seche'];

  function isGoalDiscouraged(goalId) {
    if (!isChild()) return false;
    if (!goalId) return false;
    var g = String(goalId).toLowerCase();
    return GOALS_ADULT.some(function (x) { return g.indexOf(x) !== -1; });
  }

  // Un programme complet est-il déconseillé ? (nom ou objectif)
  function isProgramDiscouraged(prog) {
    if (!isChild()) return false;
    if (!prog) return false;
    var t = ((prog.name || '') + ' ' + (prog.goal || '') + ' ' + (prog.id || '')).toLowerCase();
    return /hypertroph|prise de masse|force pure|charges lourdes|powerlifting|sèche|seche/.test(t);
  }

  // Message d'avertissement adapté à la catégorie.
  function warningText() {
    var c = ageCategory();
    if (c === 'child') {
      return 'Ce profil est celui d\'un enfant. À cet âge, mieux vaut privilégier '
        + 'les exercices au poids du corps, la coordination et le jeu, et éviter '
        + 'les charges lourdes. Un accompagnement par un adulte est recommandé.';
    }
    if (c === 'teen') {
      return 'Ce profil est celui d\'un adolescent. Les charges peuvent être '
        + 'introduites progressivement et en étant bien encadré, en privilégiant '
        + 'la technique avant le poids.';
    }
    return '';
  }

  window.AwakYouth = {
    ageCategory: ageCategory,
    ageCategoryOf: ageCategoryOf,
    isYoung: isYoung,
    isChild: isChild,
    kidsOk: function () { return Object.keys(KIDS_OK); },
    isBirthdayToday: isBirthdayToday,
    checkAgeTransition: checkAgeTransition,
    isSenior: isSenior,
    isSeniorProfile: isSeniorProfile,
    isYoungProfile: isYoungProfile,
    isChildProfile: isChildProfile,
    isDiscouraged: isDiscouraged,
    isGoalDiscouraged: isGoalDiscouraged,
    isProgramDiscouraged: isProgramDiscouraged,
    warningText: warningText,
    _age: _age,
    _ageOf: _ageOf
  };
})();
