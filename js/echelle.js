// v1358 — Échelle visuelle (lot 2)
// Les tailles de texte et les arrondis sont écrits en dur à des centaines
// d'endroits (13 à 16 tailles par écran, dont plusieurs sous 11 px). Plutôt
// que de toucher chaque ligne, ce module aligne ce qui est affiché dans les
// écrans principaux sur l'échelle du système visuel (css/style.css, --awk-fs-*
// et --awk-r-*) :
//   texte   : 11 · 12,5 · 14 · 16 · 19 · 23 px (rien sous 11 px)
//   arrondi : 8 · 12 · 16 px (les pilules et les cercles restent)
// Laissés tels quels : chiffres géants (> 26 px), tailles fluides (clamp/vw),
// SVG, champs de saisie, et tout élément marqué data-echelle-garder.
(function () {
  'use strict';
  // Séance : seulement l'écran de choix (#workoutSelection) — le lecteur de
  // séance a une barre du haut calibrée au pixel près pour les petits écrans.
  var ECRANS = ['homeTab', 'workoutSelection', 'historyTab', 'familyTab',
    // v1359 : les autres onglets
    'routinesTab', 'programTab', 'courseTab', 'challengesTab', 'calendarTab',
    'gameTab', 'exercisesTab', 'settingsTab', 'calculatorsTab'];
  var TAILLES = [11, 12.5, 14, 16, 19, 23];

  function taille(px) {
    if (px > 26) return null;
    if (px <= 11) return 11;
    var best = TAILLES[0];
    for (var i = 0; i < TAILLES.length; i++) {
      // à égalité, la plus petite (évite les débordements)
      if (Math.abs(TAILLES[i] - px) < Math.abs(best - px) - 0.01) best = TAILLES[i];
    }
    return best;
  }
  function arrondi(px) {
    if (px < 4 || px >= 40) return null;  // presque carré, ou pilule
    if (px <= 9) return 8;
    if (px <= 14) return 12;
    return 16;
  }

  function garder(el) {
    if (el.closest('svg,[data-echelle-garder],input,select,textarea,canvas,#exerciseView,.modal')) return true;
    var st = el.getAttribute('style') || '';
    return /clamp\(|vw\b|vmin|vmax/.test(st);
  }

  function traiter(racine) {
    if (!racine) return;
    var els = racine.querySelectorAll('*');
    var aFaire = [];
    // 1) on mesure tout AVANT de changer quoi que ce soit (les tailles en em
    //    dépendent du parent : changer d'abord fausserait les enfants)
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (el.dataset.echOk === '1' || garder(el)) continue;
      var cs = getComputedStyle(el);
      var t = null, r = null;
      var aTexte = false;
      for (var n = el.firstChild; n; n = n.nextSibling) { if (n.nodeType === 3 && n.nodeValue.trim()) { aTexte = true; break; } }
      if (aTexte) {
        var px = parseFloat(cs.fontSize);
        var v = taille(px);
        if (v != null && Math.abs(v - px) > 0.2) t = v;
      }
      var rad = cs.borderTopLeftRadius;
      if (rad && rad.indexOf('%') === -1 && rad === cs.borderTopRightRadius && rad === cs.borderBottomLeftRadius && rad === cs.borderBottomRightRadius) {
        var rp = parseFloat(rad);
        var ra = arrondi(rp);
        if (ra != null && ra !== rp) r = ra;
      }
      aFaire.push([el, t, r]);
    }
    // 2) on applique
    for (var j = 0; j < aFaire.length; j++) {
      var a = aFaire[j];
      if (a[1] != null) a[0].style.setProperty('font-size', a[1] + 'px', 'important');
      if (a[2] != null) a[0].style.setProperty('border-radius', a[2] + 'px', 'important');
      a[0].dataset.echOk = '1';
    }
  }

  var minuteries = {};
  function planifier(id) {
    clearTimeout(minuteries[id]);
    minuteries[id] = setTimeout(function () {
      var el = document.getElementById(id);
      if (el && el.getClientRects().length) { try { traiter(el); } catch (e) {} }
    }, 120);
  }

  function brancher() {
    ECRANS.forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      new MutationObserver(function () { planifier(id); }).observe(el, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
      planifier(id);
    });
    // #workoutSelection devient visible quand son onglet parent s'active
    var ws = document.getElementById('workoutsTab');
    if (ws) new MutationObserver(function () { planifier('workoutSelection'); }).observe(ws, { attributes: true, attributeFilter: ['class'] });
  }

  window.AwakEchelle = { traiter: traiter, taille: taille, arrondi: arrondi };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', brancher); else brancher();
})();
