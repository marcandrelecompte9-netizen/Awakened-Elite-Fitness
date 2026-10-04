/* ============================================================
   NOMS DES ATTRIBUTS EN FRANÇAIS (affichage seulement)
   Les clés internes restent STR / AGI / VIT / END / PER / SEN
   (sauvegardes, équipement, calculs) : on ne traduit que le texte
   visible. « STR 36 » → « Force 36 », « +20 STR · +15 AGI » →
   « +20 Force · +15 Agilité ».
   « STR — Force » (fenêtre d'aide) devient simplement « Force ».
   Protégé : champs de saisie, scripts, SVG, data-stat-keep.
   ============================================================ */
(function () {
  'use strict';

  var NOMS = { STR: 'Force', AGI: 'Agilité', VIT: 'Vitalité', END: 'Endurance', PER: 'Perception', SEN: 'Sens' };
  // Mots entiers en capitales uniquement (« ESEN », « VITE » ne sont pas touchés)
  var RX = /(^|[^A-Za-zÀ-ÿ0-9_])(STR|AGI|VIT|END|PER|SEN)(?![A-Za-zÀ-ÿ0-9_])/g;
  var RX_TEST = /(^|[^A-Za-zÀ-ÿ0-9_])(STR|AGI|VIT|END|PER|SEN)(?![A-Za-zÀ-ÿ0-9_])/;
  var LISTE = 'Force|Agilité|Vitalité|Endurance|Perception|Sens';
  var RX_DOUBLE = new RegExp('(' + LISTE + ')\\s*(?:[—–\\-:]\\s*|\\()\\1\\)?', 'g');

  function traduire(t) {
    if (!t || !RX_TEST.test(t)) return t;
    var r = t.replace(RX, function (m, avant, k) { return avant + NOMS[k]; });
    return r.replace(RX_DOUBLE, '$1');
  }
  window.awakStatNom = function (k) { return NOMS[k] || k; };
  window.awakTraduireStats = traduire;

  function protege(n) {
    while (n && n !== document.body) {
      if (n.nodeType === 1) {
        var t = (n.tagName || '').toLowerCase();
        if (t === 'input' || t === 'textarea' || t === 'script' || t === 'style' || t === 'svg') return true;
        if (n.ownerSVGElement) return true;
        if (n.hasAttribute && n.hasAttribute('data-stat-keep')) return true;
      }
      n = n.parentNode;
    }
    return false;
  }
  function noeud(n) {
    var v = n.nodeValue;
    if (!v || !RX_TEST.test(v) || protege(n.parentNode)) return;
    var r = traduire(v);
    if (r !== v) n.nodeValue = r;
  }
  function balayer(racine) {
    if (!racine) return;
    if (racine.nodeType === 3) return noeud(racine);
    if (!document.createTreeWalker) return;
    var tw = document.createTreeWalker(racine, NodeFilter.SHOW_TEXT, null), n, lot = [];
    while ((n = tw.nextNode())) if (n.nodeValue && RX_TEST.test(n.nodeValue)) lot.push(n);
    lot.forEach(noeud);
  }
  function demarrer() {
    balayer(document.body);
    if (!window.MutationObserver) return;
    new MutationObserver(function (ms) {
      for (var i = 0; i < ms.length; i++) {
        var m = ms[i];
        if (m.type === 'characterData') { noeud(m.target); continue; }
        for (var j = 0; j < m.addedNodes.length; j++) balayer(m.addedNodes[j]);
      }
    }).observe(document.body, { childList: true, subtree: true, characterData: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', demarrer);
  else demarrer();
})();
