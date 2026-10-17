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
    centrer(el);
  }
  // v1383 : fenêtres stylées par une FEUILLE CSS (pas en ligne) — ex. #swapModal,
  // ou les nouvelles fenêtres à id : on lit le style calculé, seulement pour
  // les éléments ajoutés directement dans <body> (peu coûteux).
  function verifierCalcule(el) {
    if (!el || el.nodeType !== 1 || el.parentNode !== document.body || el.classList.contains('awak-centre')) return;
    if (el.hasAttribute('data-feuille-bas') || /^(SCRIPT|STYLE|LINK)$/.test(el.tagName)) return;
    var c = getComputedStyle(el);
    if (c.position !== 'fixed' || c.display !== 'flex' || c.alignItems !== 'flex-end') return;
    var r = el.getBoundingClientRect();
    if (r.top > 1 || r.height < window.innerHeight - 2 || r.width < window.innerWidth - 2) return;
    centrer(el);
  }
  // v1383 : centrer ET effacer l'allure « tiroir du bas » : poignée du haut,
  // bord du bas absent, ombre vers le haut, marge intérieure forcée à 0.
  function centrer(el) {
    if (el.classList.contains('awak-centre')) return;   // déjà fait (évite une boucle avec l'observateur)
    el.classList.add('awak-centre');
    if (/!important/.test(el.getAttribute('style') || '') && el.style.getPropertyPriority('padding-top') === 'important') {
      el.style.setProperty('padding', 'calc(14px + env(safe-area-inset-top, 0px)) 12px calc(14px + env(safe-area-inset-bottom, 0px))', 'important');
    }
    requestAnimationFrame(function () { try { finir(el); } catch (e) {} });
  }
  function finir(el) {
    var carte = el.firstElementChild;
    while (carte && /^(STYLE|SCRIPT)$/.test(carte.tagName)) carte = carte.nextElementSibling;
    if (!carte) return;
    var c = getComputedStyle(carte);
    if (c.borderBottomStyle === 'none' && c.borderTopStyle !== 'none' && parseFloat(c.borderTopWidth) > 0) {
      carte.style.borderBottom = c.borderTopWidth + ' ' + c.borderTopStyle + ' ' + c.borderTopColor;
    }
    if (/^0px -/.test(c.boxShadow.replace(/^rgba?\([^)]*\)\s*/, ''))) carte.style.boxShadow = '0 20px 50px rgba(0,0,0,0.55)';
    // poignée : petite barre (≤ 60 × 6 px) tout en haut de la carte
    var haut = carte.getBoundingClientRect().top;
    var l = carte.querySelectorAll('div');
    for (var i = 0; i < l.length && i < 12; i++) {
      var r = l[i].getBoundingClientRect();
      if (r.top - haut > 40) break;
      if (r.width >= 24 && r.width <= 60 && r.height >= 2 && r.height <= 6 && !l[i].children.length && !l[i].textContent.trim()) {
        l[i].style.display = 'none';
        break;
      }
    }
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
        if (m.type === 'attributes') { verifier(m.target); if (m.target.parentNode === document.body) verifierCalcule(m.target); continue; }
        for (var j = 0; j < m.addedNodes.length; j++) { scanner(m.addedNodes[j]); verifierCalcule(m.addedNodes[j]); }
      }
    }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class'] });
  }
  window.AwakFenetres = { verifier: verifier };
  if (document.body) demarrer(); else document.addEventListener('DOMContentLoaded', demarrer);
})();
