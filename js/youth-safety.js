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
    isSenior: isSenior,
    isSeniorProfile: isSeniorProfile,
    isYoungProfile: isYoungProfile,
    isChildProfile: isChildProfile,
    isDiscouraged: isDiscouraged,
    warningText: warningText,
    _age: _age,
    _ageOf: _ageOf
  };
})();
