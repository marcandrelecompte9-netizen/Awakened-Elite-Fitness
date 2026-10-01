/* ============================================================
   CARTE DES FONCTIONNALITÉS — écran-index « Tout explorer »
   Rend découvrables toutes les fonctionnalités de l'app.
   N'affiche que les entrées dont la fonction existe.
   Icônes SVG (AwakIcon), palette bleue/cyan.
   ============================================================ */
(function () {
  "use strict";

  function _rpg() { return typeof rpgEnabled === 'function' && rpgEnabled(); }

  // résout « nom » ou « Objet.methode »
  function _fn(path) {
    var parts = String(path).split('.'), o = window, ctx = window;
    for (var i = 0; i < parts.length; i++) {
      if (o == null) return null;
      ctx = o; o = o[parts[i]];
    }
    return typeof o === 'function' ? { f: o, ctx: ctx } : null;
  }

  // ouvre une fonctionnalité après avoir fermé la carte
  function _go(fn, arg) {
    var ov = document.getElementById('featureMapOverlay'); if (ov) ov.remove();
    setTimeout(function () {
      try {
        var r = _fn(fn); if (!r) return;
        if (arg !== undefined && arg !== null && arg !== '') r.f.call(r.ctx, arg); else r.f.call(r.ctx);
      } catch (e) {}
    }, 120);
  }
  window._featGo = _go;

  function _ico(nom, couleur) {
    var svg = (window.AwakIcon && AwakIcon.get(nom, 20, couleur)) || '';
    return '<span style="display:inline-flex;align-items:center;justify-content:center;width:38px;height:38px;border-radius:11px;'
      + 'background:' + couleur + '1f;border:1px solid ' + couleur + '55;">' + svg + '</span>';
  }

  function _row(nom, couleur, title, desc, fn, arg) {
    if (!_fn(fn)) return '';
    var call = "_featGo('" + fn + "'" + (arg ? ",'" + arg + "'" : '') + ")";
    return uiActionRow(_ico(nom, couleur), title, desc, call);
  }

  function _section(label, rows) {
    var r = rows.join('');
    return r ? uiSectionHeader(label) + r : '';
  }

  function showFeatureMap() {
    try {
      var B = '#60a8f0', C = '#22d3ee', V = '#a78bfa', O = '#f59e0b', R = '#f87171', G = '#94a3b8';
      var html = '';

      html += _section("S'entraîner", [
        _row('eclair', C, "Séance intelligente", "Le Système compose ta séance du jour", 'startIntelligentWorkout'),
        _row('muscle', C, "Choisir mes muscles", "Séance ciblée sur les muscles de ton choix", 'showManualMusclePickerModal'),
        _row('halter', C, "Séance libre", "Compose ou lance une séance maintenant", 'switchTab', 'workouts'),
        _row('liste', B, "Mes routines", "Tes routines enregistrées", 'switchTab', 'routines'),
        _row('grille', B, "Templates", "Routines prêtes à l'emploi", 'showTemplatesModal'),
        _row('calendrier', B, "Plan hebdo", "Assigne une routine à chaque jour", 'openWeeklyPlanEditor'),
        _row('cible', B, "Programmes", "Programmes de plusieurs semaines", 'switchTab', 'program'),
        _row('course', C, "Course GPS", "Course, marche ou vélo avec suivi GPS", 'AwakRun.ouvrir'),
        _row('soleil', O, "Routine matinale", "Ton réveil du corps guidé", 'showMorningRoutineModal'),
        _row('etoile', O, "Défis", "Défis et objectifs à relever", 'switchTab', 'challenges'),
        _row('halter', G, "Exercices", "La bibliothèque complète d'exercices", 'switchTab', 'exercises'),
        (window.AwakYouth && AwakYouth.isChild && AwakYouth.isChild()) ? '' : _row('stats', G, "Calculateurs", "1RM, plaques et rang de force", 'switchTab', 'calculators')
      ]);

      html += _section('Planning', [
        _row('calendrier', B, "Agenda", "Ton calendrier d'entraînement", 'switchTab', 'calendar'),
        _row('boussole', B, "Planning suivi", "Choisis le planning affiché à l'accueil", 'awakChoisirPlanning'),
        _row('gym', B, "Mode salle", "Affichage plein écran pour la salle", 'awakCalKiosk')
      ]);

      html += _section('Ta progression', [
        _row('stats', V, "Analyse & Coach", "Équilibre, déséquilibres et profil d'athlète", 'showSystemAnalysis'),
        _row('bouclier', V, "Équilibre de force", "Proportions entre tes muscles", 'awakOuvrirEquilibre'),
        _row('trophee', O, "Hall of Fame", "Les records de chaque exercice", 'awakHallOpen'),
        _row('arbre', V, "Arbre de l'Éveil", "Ton archétype et ta progression", 'showAwakeningTree'),
        _row('epee', V, "Standards de force", "Situe ta force par rang E à S", 'openStrengthStandards'),
        _row('chrono', G, "Historique", "Toutes tes séances passées", 'switchTab', 'history'),
        _row('valide', G, "Ta semaine", "Le récap de ta semaine en cours", 'showWeeklyRecap', 'current')
      ]);

      html += _section('Corps & bien-être', [
        _row('alerte', R, "Où as-tu mal ?", "Adapte les séances à une douleur", 'AwakPainOpen'),
        _row('sante', R, "Limitations", "Blessures et mouvements à éviter", 'awakOuvrirLimitations'),
        _row('repos', V, "Suivi de cycle", "Adapte l'effort à ton cycle", 'openCycleSetup'),
        _row('flamme', O, "Rituels", "Tes rituels et habitudes", 'showRitualsManager'),
        _row('info', G, "Photo de progression", "Prends une photo pour suivre ton évolution", 'takeProgressPhoto')
      ]);

      html += _section('Ensemble', [
        _row('groupe', V, "Séance à plusieurs", "Entraîne-toi avec d'autres profils", 'AwakGroupOpen'),
        _row('cible', V, "Objectif commun", "Un objectif partagé par la famille", 'AwakFamilyGoalOpen'),
        _row('maison', V, "Famille", "Les profils et leur activité", 'switchTab', 'family')
      ]);

      if (_rpg()) {
        html += _section('Aventure', [
          _row('faille', V, "Failles", "Affronte les Failles et leurs boss", 'switchTab', 'game'),
          _row('porte', O, "Marchand", "Vends les minéraux des Failles", 'awakOpenMerchant'),
          _row('liste', G, "Journal d'histoire", "Revis les chapitres débloqués", 'showStoryJournal')
        ]);
      }

      html += _section('Réglages', [
        _row('immeuble', G, "Mes lieux", "Salles, maison et équipement", 'showLocationPicker'),
        _row('idee', G, "Réglages & sauvegarde", "Préférences, export et import", 'switchTab', 'settings')
      ]);

      var s = uiBottomSheet({
        id: 'featureMapOverlay',
        icon: (window.AwakIcon && AwakIcon.get('boussole', 30, C)) || '',
        title: 'Tout explorer',
        subtitle: 'Toutes les fonctionnalités, au même endroit.',
        accent: C
      });
      s.body.innerHTML = html + uiCloseButton('featureMapOverlay');
      s.mount();
    } catch (e) {}
  }

  window.showFeatureMap = showFeatureMap;
})();
