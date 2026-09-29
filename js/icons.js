/* ═══════════════════════════════════════════════════════════════════════
   ◈  ICÔNES SVG — Awakened
   -----------------------------------------------------------------------
   Remplace les emojis de l'interface par des pictogrammes vectoriels.

   POURQUOI : un emoji change de dessin selon l'appareil (Samsung, Apple,
   Android), sa taille optique varie, et il jure avec une interface au
   trait. Un SVG est identique partout, net à toute taille, et hérite de
   la couleur demandée.

   USAGE :  AwakIcon.get('muscle', 14, '#94a3b8')
   Les tracés sont au format 24×24, en TRAIT (fill:none), ce qui permet
   d'ajuster l'épaisseur sans redessiner.
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var P = {
    // — Entraînement —
    muscle:    '<path d="M5 17v-4a4 4 0 0 1 4-4h4l3-3 3.5 3.5L16 13v2a4 4 0 0 1-4 4H7"/><path d="M10 13h3"/>',
    halter:    '<path d="M6.5 7v10M17.5 7v10M3.5 9.5v5M20.5 9.5v5M6.5 12h11"/>',
    flamme:    '<path d="M12 3s5 4.5 5 9a5 5 0 0 1-10 0c0-1.8 1-3.3 2-4.3 0 1.5.8 2.3 1.6 2.3.9 0 1.4-.8 1.4-2 0-2-1-4-1-5z"/>',
    eclair:    '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
    cible:     '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1"/>',
    repos:     '<path d="M3 18v-5a2 2 0 0 1 2-2h10a4 4 0 0 1 4 4v3"/><path d="M3 18h18"/><circle cx="7.5" cy="8.5" r="2"/>',
    chrono:    '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M9 2h6"/>',
    calendrier:'<rect x="3" y="4.5" width="18" height="17" rx="2"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/>',

    // — États —
    valide:    '<path d="M4 12.5l5.5 5.5L20 7"/>',
    alerte:    '<path d="M12 3.5 1.8 20.5h20.4z"/><path d="M12 10v4.5M12 17.6v.01"/>',
    info:      '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8v.01"/>',
    idee:      '<path d="M9.2 17h5.6M10 20.5h4"/><path d="M12 3a6 6 0 0 1 3.5 10.9c-.5.4-.8 1-.8 1.6H9.3c0-.6-.3-1.2-.8-1.6A6 6 0 0 1 12 3z"/>',
    stats:     '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',

    // — Jeu —
    faille:    '<path d="M12 2c2 4-2 6 0 10s-2 6 0 10"/><path d="M7 6c-2 3-2 9 0 12M17 6c2 3 2 9 0 12"/>',
    epee:      '<path d="M20 3.5 9.5 14M4 20l3-3M6.5 17.5 3 21M9 12l3 3"/><path d="M20 3.5V8l-4.5-.5z"/>',
    bouclier:  '<path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z"/>',
    trophee:   '<path d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3M10 20h4M12 14v6"/>',

    // — Lieux d'entraînement (choix d'icône pour un lieu) —
    maison:    '<path d="M4 11.5 12 4l8 7.5"/><path d="M6 10v9h12v-9"/><path d="M10 19v-5h4v5"/>',
    gym:       '<path d="M6.5 7v10M17.5 7v10M3.5 9.5v5M20.5 9.5v5M6.5 12h11"/>',
    immeuble:  '<rect x="5" y="3" width="14" height="18" rx="1"/><path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2M10 21v-4h4v4"/>',
    hotel:     '<path d="M4 21V6a1 1 0 0 1 1-1h6v16"/><path d="M11 21V9h8a1 1 0 0 1 1 1v11"/><path d="M7 8h.01M7 11h.01M7 14h.01M14 13h.01M14 16h.01M17 13h.01M17 16h.01"/>',
    ecole:     '<path d="M12 4 3 8l9 4 9-4z"/><path d="M6 10v6c0 1.5 2.7 3 6 3s6-1.5 6-3v-6"/><path d="M21 8v6"/>',
    arbre:     '<path d="M12 3c2 4-2 6 0 10s-2 6 0 10"/><path d="M7 6c-2 3-2 9 0 12M17 6c2 3 2 9 0 12"/>',
    porte:     '<rect x="5" y="3" width="14" height="18" rx="1"/><path d="M15 12h.01"/>',
    etoile:    '<path d="m12 3 2.6 5.9 6.4.6-4.8 4.3 1.4 6.3L12 16.9 6.4 20.1l1.4-6.3-4.8-4.3 6.4-.6z"/>',
    soleil:    '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2.5 12h2M19.5 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/>',
    liste:     '<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/>',
    grille:    '<rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/>',
    sante:     '<path d="M9 3.5h6v5.5h5.5v6H15v5.5H9V15H3.5V9H9z"/>',
    boussole:  '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/>',
    groupe:    '<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><path d="M16 5.2a3 3 0 0 1 0 5.6M18 14.5c1.9.8 3 2.7 3 5"/>',
    course:    '<circle cx="14" cy="4.5" r="2"/><path d="M13 8l-3 4 3 3v5M13 8l4 2 2 3M10 12l-4 1"/>'
  };

  function get(nom, taille, couleur, epaisseur) {
    var d = P[nom];
    if (!d) return '';
    var px = taille || 16;
    return '<svg viewBox="0 0 24 24" width="' + px + '" height="' + px + '" fill="none" ' +
      'stroke="' + (couleur || 'currentColor') + '" stroke-width="' + (epaisseur || 1.9) + '" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ' +
      'style="flex-shrink:0;vertical-align:-0.15em;display:inline-block;">' + d + '</svg>';
  }

  window.AwakIcon = { get: get, liste: Object.keys(P) };
})();
