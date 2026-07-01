/* ============================================================
   CARTE DES FONCTIONNALITÉS — écran-index « Explorer »
   Rend découvrables les fonctionnalités éparpillées (Arbre,
   Analyse, Coach, Standards, cycle, rituels, aventure…).
   N'appelle que des fonctions vérifiées, sans argument risqué.
   Construit avec les helpers ui-kit.js (composants standards).
   ============================================================ */
(function () {
  "use strict";

  function _rpg() { return typeof rpgEnabled === 'function' && rpgEnabled(); }

  // ouvre une fonctionnalité après avoir fermé la carte
  function _go(fn, arg) {
    var ov = document.getElementById('featureMapOverlay'); if (ov) ov.remove();
    setTimeout(function () {
      try { if (typeof window[fn] === 'function') window[fn](arg); } catch (e) {}
    }, 120);
  }
  window._featGo = _go;

  function _row(icon, title, desc, fn, arg) {
    var call = "_featGo('" + fn + "'" + (arg ? ",'" + arg + "'" : '') + ")";
    return uiActionRow(icon, title, desc, call);
  }

  function showFeatureMap() {
    try {
      var html = '';

      html += uiSectionHeader('Ta progression');
      html += _row('🌳', "Arbre de l'Éveil", "Ton archétype et ta progression réelle", 'showAwakeningTree');
      html += _row('⚙️', "Analyse du Système", "Équilibre musculaire, déséquilibres, conseils", 'showSystemAnalysis');
      html += _row('🧠', "Coach", "Ton profil d'athlète et ton assiduité", 'showSystemAnalysis', 'coach');
      html += _row('🏆', "Standards de force", "Situe ta force par rang E → S", 'openStrengthStandards');
      html += _row('📖', "Historique", "Toutes tes séances passées", 'switchTab', 'history');

      html += uiSectionHeader("T'entraîner");
      html += _row('🏋️', "Séance libre", "Compose ou lance une séance maintenant", 'switchTab', 'workouts');
      html += _row('☀️', "Routine matinale", "Ton réveil du corps guidé", 'showMorningRoutineModal');
      html += _row('📚', "Exercices", "La bibliothèque complète d'exercices", 'switchTab', 'exercises');
      html += _row('🎯', "Défis", "Défis et objectifs à relever", 'switchTab', 'challenges');
      html += _row('🧮', "Calculs", "1RM, calories et autres outils", 'switchTab', 'calculators');

      html += uiSectionHeader('Bien-être');
      html += _row('🌙', "Suivi de cycle", "Adapte l'effort à ton cycle", 'openCycleSetup');
      html += _row('🧘', "Rituels", "Tes rituels et routines de bien-être", 'showRitualsManager');

      if (_rpg()) {
        html += uiSectionHeader('Aventure');
        html += _row('🌌', "Failles", "Affronte les Failles et leurs boss", 'switchTab', 'game');
        html += _row('📜', "Journal d'histoire", "Revis les chapitres débloqués", 'showStoryJournal');
      }

      var s = uiBottomSheet({
        id: 'featureMapOverlay',
        icon: '✨',
        title: 'Explorer Awakened',
        subtitle: 'Toutes tes fonctionnalités, au même endroit.',
        accent: '#60a5fa'
      });
      s.body.innerHTML = html + uiCloseButton('featureMapOverlay');
      s.mount();
    } catch (e) {}
  }

  window.showFeatureMap = showFeatureMap;
})();
