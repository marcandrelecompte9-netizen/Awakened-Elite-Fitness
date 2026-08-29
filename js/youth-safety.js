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
               + "et un suivi plus détaillé de ta progression." };
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

  // Un exercice est-il déconseillé pour le profil jeune actif ?
  function isDiscouraged(exercise) {
    if (!isYoung()) return false;
    if (!exercise) return false;
    var eq = exercise.equipment || [];
    if (!Array.isArray(eq)) eq = [eq];
    // charge lourde → déconseillé pour un enfant ; pour un ado, seulement la barre/machine lourde
    var heavy = eq.some(function (e) { return HEAVY_EQUIPMENT.indexOf(e) !== -1; });
    if (isChild()) return heavy;
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
