/* ============================================================
   CARTE DES FONCTIONNALITÉS — écran-index « Explorer »
   Rend découvrables les fonctionnalités éparpillées (Arbre,
   Analyse, Coach, Standards, cycle, rituels, aventure…).
   N'appelle que des fonctions vérifiées, sans argument risqué.
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

  function _card(icon, title, desc, fn, arg) {
    var call = "_featGo('" + fn + "'" + (arg ? ",'" + arg + "'" : '') + ")";
    return '<button onclick="' + call + '" style="display:flex;align-items:center;gap:12px;width:100%;text-align:left;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:13px;padding:12px 13px;cursor:pointer;margin-bottom:7px;">'
      + '<span style="font-size:1.4em;flex-shrink:0;line-height:1;">' + icon + '</span>'
      + '<span style="flex:1;min-width:0;">'
      + '<span style="display:block;font-size:0.86em;font-weight:800;color:#e2e8f0;">' + title + '</span>'
      + '<span style="display:block;font-size:0.68em;color:#94a3b8;margin-top:1px;line-height:1.3;">' + desc + '</span>'
      + '</span><span style="color:#64748b;flex-shrink:0;font-size:1.1em;">›</span></button>';
  }

  function _section(label) {
    return '<div style="font-size:0.62em;letter-spacing:2px;text-transform:uppercase;color:#94a3b8;font-weight:800;margin:16px 0 8px;">' + label + '</div>';
  }

  function showFeatureMap() {
    try {
      var old = document.getElementById('featureMapOverlay'); if (old) old.remove();

      var html = '';

      // ── Ta progression ──
      html += _section('Ta progression');
      html += _card('🌳', "Arbre de l'Éveil", "Ton archétype et ta progression réelle", 'showAwakeningTree');
      html += _card('⚙️', "Analyse du Système", "Équilibre musculaire, déséquilibres, conseils", 'showSystemAnalysis');
      html += _card('🧠', "Coach", "Ton profil d'athlète et ton assiduité", 'showSystemAnalysis', 'coach');
      html += _card('🏆', "Standards de force", "Situe ta force par rang E → S", 'openStrengthStandards');
      html += _card('📖', "Historique", "Toutes tes séances passées", 'switchTab', 'history');

      // ── T'entraîner ──
      html += _section("T'entraîner");
      html += _card('🏋️', "Séance libre", "Compose ou lance une séance maintenant", 'switchTab', 'workouts');
      html += _card('☀️', "Routine matinale", "Ton réveil du corps guidé", 'showMorningRoutineModal');
      html += _card('📚', "Exercices", "La bibliothèque complète d'exercices", 'switchTab', 'exercises');
      html += _card('🎯', "Défis", "Défis et objectifs à relever", 'switchTab', 'challenges');
      html += _card('🧮', "Calculs", "1RM, calories et autres outils", 'switchTab', 'calculators');

      // ── Bien-être ──
      html += _section('Bien-être');
      html += _card('🌙', "Suivi de cycle", "Adapte l'effort à ton cycle", 'openCycleSetup');
      html += _card('🧘', "Rituels", "Tes rituels et routines de bien-être", 'showRitualsManager');

      // ── Aventure (mode jeu seulement) ──
      if (_rpg()) {
        html += _section('Aventure');
        html += _card('🌌', "Failles", "Affronte les Failles et leurs boss", 'switchTab', 'game');
        html += _card('📜', "Journal d'histoire", "Revis les chapitres débloqués", 'showStoryJournal');
      }

      var overlay = document.createElement('div');
      overlay.id = 'featureMapOverlay';
      overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.72);display:flex;align-items:flex-end;justify-content:center;backdrop-filter:blur(3px);';
      overlay.addEventListener('click', function (e) { if (e.target === overlay) overlay.remove(); });

      var sheet = document.createElement('div');
      sheet.style.cssText = 'background:#0D0D0D;border-radius:20px 20px 0 0;padding:20px 16px calc(20px + env(safe-area-inset-bottom));width:100%;max-width:480px;max-height:90vh;overflow-y:auto;-webkit-overflow-scrolling:touch;border-top:2px solid rgba(96,165,250,0.35);';
      sheet.innerHTML =
        '<div style="width:36px;height:4px;background:rgba(255,255,255,0.2);border-radius:99px;margin:0 auto 14px;"></div>'
        + '<div style="text-align:center;margin-bottom:4px;">'
        + '<div style="font-size:1.5em;">✨</div>'
        + '<h2 style="margin:4px 0 2px;color:white;font-size:1.15em;font-weight:900;">Explorer Awakened</h2>'
        + '<p style="margin:0;color:#94a3b8;font-size:0.72em;">Toutes tes fonctionnalités, au même endroit.</p>'
        + '</div>'
        + html
        + '<button id="featMapClose" style="margin-top:14px;width:100%;padding:13px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);border-radius:14px;color:rgba(255,255,255,0.6);font-weight:700;cursor:pointer;">Fermer</button>';
      overlay.appendChild(sheet);
      document.body.appendChild(overlay);
      var btn = document.getElementById('featMapClose');
      if (btn) btn.addEventListener('click', function () { overlay.remove(); });
    } catch (e) {}
  }

  window.showFeatureMap = showFeatureMap;
})();
