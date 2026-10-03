/* ═══════════════════════════════════════════════════════════════════
   FENÊTRES CENTRÉES (v1252)
   ─────────────────────────────────────────────────────────────────────
   Une cinquantaine de fenêtres étaient des « feuilles du bas » : collées au
   bas de l'écran (align-items:flex-end), loin du pouce qui vient de toucher
   en haut, et souvent coupées sous la barre du téléphone.
   Plutôt que de retoucher chaque fenêtre une par une, on les repère à leur
   création (calque plein écran, position fixe, flex aligné en bas) et on
   leur ajoute la classe .awak-centre : la fenêtre se centre, garde ses 4
   coins arrondis, et le calque défile si elle est plus haute que l'écran.
   ⚠️ On n'utilise PAS align-items:center : un contenu plus haut que l'écran
   déborderait vers le haut, hors d'atteinte (limite connue de flexbox).
   On aligne en haut et on centre avec margin:auto, qui laisse défiler.
   data-feuille-bas sur le calque = garder l'ancien comportement.
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  function couvre(s) {
    return s.inset === '0px' || s.inset === '0'
      || ((s.top === '0px' || s.top === '0') && (s.bottom === '0px' || s.bottom === '0'))
      || s.height === '100%' || s.height === '100vh';
  }
  function verifier(el) {
    if (!el || el.nodeType !== 1 || !el.style) return;
    var s = el.style;
    if (s.position !== 'fixed' || s.alignItems !== 'flex-end') return;
    if (s.display && s.display !== 'flex') return;
    if (!couvre(s) || el.hasAttribute('data-feuille-bas')) return;
    el.classList.add('awak-centre');
  }
  function scanner(racine) {
    verifier(racine);
    if (racine && racine.querySelectorAll) {
      var l = racine.querySelectorAll('[style*="flex-end"]');
      for (var i = 0; i < l.length; i++) verifier(l[i]);
    }
  }
  function demarrer() {
    scanner(document.body);
    new MutationObserver(function (muts) {
      for (var i = 0; i < muts.length; i++) {
        var m = muts[i];
        if (m.type === 'attributes') { verifier(m.target); continue; }
        for (var j = 0; j < m.addedNodes.length; j++) scanner(m.addedNodes[j]);
      }
    }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['style'] });
  }
  window.AwakFenetres = { verifier: verifier };
  if (document.body) demarrer(); else document.addEventListener('DOMContentLoaded', demarrer);
})();
