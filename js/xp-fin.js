// v1404 — XP gagnée affichée en fin de séance (mode Aventure).
// Avant : l'écran de fin ne montrait l'XP que lors d'un passage de niveau ;
// un joueur qui venait pour le jeu ne voyait pas ce que sa séance lui rapportait.
// On mémorise l'XP au début de la séance (body.in-session), puis à l'écran
// « Séance terminée » : « +102 XP · encore 18 XP pour le niveau 2 » + barre.
(function () {
  'use strict';

  function actif() { try { return typeof window.rpgEnabled === 'function' && window.rpgEnabled(); } catch (e) { return false; } }
  function xpProfil() {
    try { return Math.max(0, Math.floor(((window.rpgLoad() || {}).profile || {}).xp || 0)); } catch (e) { return null; }
  }
  var depart = null;

  function carte() {
    var v = document.getElementById('completionView');
    if (!v || v.classList.contains('hidden') || !actif()) return;
    var vieux = document.getElementById('awakXpFin'); if (vieux) vieux.remove();
    var xp = xpProfil(); if (xp === null || depart === null) return;
    var gain = xp - depart;
    if (gain <= 0) return;
    var n = window.rpgLevelFromXP(xp), a = window.rpgXPForLevel(n), b = window.rpgXPForLevel(n + 1);
    var pas = Math.max(1, b - a), dans = xp - a, reste = Math.max(0, b - xp);
    var pc = Math.max(3, Math.min(100, Math.round(dans / pas * 100)));
    var c = document.createElement('div');
    c.id = 'awakXpFin';
    c.style.cssText = 'margin:0 0 14px;padding:13px 15px;border-radius:14px;background:linear-gradient(160deg,rgba(34,211,238,0.10),rgba(34,211,238,0.02));border:1px solid rgba(34,211,238,0.35);text-align:left;';
    c.innerHTML = '<div style="display:flex;align-items:baseline;justify-content:space-between;gap:10px;">'
      + '<span style="font-size:1.35em;font-weight:900;color:#67e8f9;">+' + gain + ' XP</span>'
      + '<span style="font-size:0.74em;font-weight:800;color:#cbd5e1;">Niveau ' + n + '</span></div>'
      + '<div style="height:7px;border-radius:99px;background:rgba(255,255,255,0.08);margin:8px 0 6px;overflow:hidden;"><div style="height:100%;width:' + pc + '%;background:linear-gradient(90deg,#22d3ee,#0891b2);border-radius:99px;"></div></div>'
      + '<div style="font-size:0.74em;color:#a3b1c2;">Encore ' + reste + ' XP pour le niveau ' + (n + 1) + '</div>';
    var hote = document.getElementById('completionMuscleChart') || document.getElementById('completionAwakTree') || document.getElementById('completionVolume');
    if (hote && hote.parentNode) hote.parentNode.insertBefore(c, hote);
  }

  function brancher() {
    var enSeance = document.body.classList.contains('in-session');
    if (enSeance) depart = xpProfil();
    new MutationObserver(function () {
      var e = document.body.classList.contains('in-session');
      if (e && !enSeance) depart = xpProfil();
      enSeance = e;
    }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
    var v = document.getElementById('completionView');
    if (!v) return;
    var cache = v.classList.contains('hidden');
    new MutationObserver(function () {
      var h = v.classList.contains('hidden');
      // l'XP de fin de séance est versée juste après l'affichage : on attend un peu
      if (cache && !h) { setTimeout(carte, 900); setTimeout(carte, 2500); }
      cache = h;
    }).observe(v, { attributes: true, attributeFilter: ['class'] });
  }

  window.AwakXpFin = { carte: carte, _depart: function (x) { depart = x; } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', brancher); else brancher();
})();
