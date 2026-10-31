// v1533 : ICÔNES « SYSTÈME » DU MENU — pictogrammes plats au trait (SVG),
// angles coupés, trait épais. Inactif : contour seul. Actif : remplissage
// léger + halo de la couleur de l'onglet (pas de violet). Remplace les SVG d'origine de la barre du bas et de la
// feuille « Plus ». (v1532 utilisait des images : retirées, illisibles à 24 px.)
(function () {
  'use strict';
  // class="f" = partie remplie quand l'onglet est actif
  var P = {
    home: '<path class="f" d="M3 11 12 3.5 21 11v9.5h-6.5v-6h-5v6H3z"/>',
    workouts: '<path d="M8.5 12h7"/><path class="f" d="M5.5 7.5h3v9h-3zM15.5 7.5h3v9h-3z"/><path d="M2.5 10h3v4h-3zM18.5 10h3v4h-3z"/>',
    routines: '<path d="M4 12V8l3-3h11"/><path d="M15 2l3 3-3 3"/><path d="M20 12v4l-3 3H6"/><path d="M9 22l-3-3 3-3"/><path class="f" d="M12 9.5l2.5 2.5-2.5 2.5-2.5-2.5z"/>',
    program: '<path class="f" d="M3 21v-4h5v-4h5V9h5v12z"/><path d="M18 9V3l3.5 1.5L18 6"/>',
    history: '<path d="M3 19l6-6 4 3 8-9"/><path d="M15 7h6v6"/><path d="M3 22h18"/>',
    calendar: '<path d="M4 6h16v15H4zM4 10.5h16M8.5 3v5M15.5 3v5"/><path class="f" d="M13 14h4v4h-4z"/>',
    exercises: '<path class="f" d="M12 6.5 3 4.5v14.5l9 2 9-2V4.5z"/><path d="M12 6.5V21"/><path d="M6 9l3 .7M6 12.5l3 .7M15 9.7l3-.7M15 13.2l3-.7"/>',
    calculators: '<path class="f" d="M6 2.5h12L19.5 4v16.5L18 22H6l-1.5-1.5V4z"/><path d="M8 6h8v4H8z"/><path d="M8 13.5h1.5v1.5H8zM11.25 13.5h1.5v1.5h-1.5zM14.5 13.5H16v1.5h-1.5zM8 17.5h1.5V19H8zM11.25 17.5h1.5V19h-1.5zM14.5 17.5H16V19h-1.5z" stroke-width="1.4"/>',
    challenges: '<path d="M12 2l10 10-10 10L2 12z"/><path class="f" d="M12 7l5 5-5 5-5-5z"/><path d="M12 11l1 1-1 1-1-1z"/>',
    settings: '<path class="f" d="M9.9 5.3 10.2 2.4 13.8 2.4 14.1 5.3 15.3 5.8 17.6 3.9 20.1 6.4 18.2 8.7 18.7 9.9 21.6 10.2 21.6 13.8 18.7 14.1 18.2 15.3 20.1 17.6 17.6 20.1 15.3 18.2 14.1 18.7 13.8 21.6 10.2 21.6 9.9 18.7 8.7 18.2 6.4 20.1 3.9 17.6 5.8 15.3 5.3 14.1 2.4 13.8 2.4 10.2 5.3 9.9 5.8 8.7 3.9 6.4 6.4 3.9 8.7 5.8z"/><path d="M12 9l3 3-3 3-3-3z"/>',
    family: '<path class="f" d="M12 3l2.5 2.5L12 8 9.5 5.5z"/><path d="M7 21v-5l5-4 5 4v5"/><path d="M5 9l2 2-2 2-2-2zM19 9l2 2-2 2-2-2z"/><path d="M2 21v-3l3-2.5M22 21v-3l-3-2.5"/>',
    game: '<path d="M3 3l12.5 12.5M13 18l5-5M16.5 16.5 21 21"/><path d="M21 3 8.5 15.5M6 13l5 5M7.5 16.5 3 21"/><path class="f" d="M3 3h3.5L3 6.5z M21 3h-3.5L21 6.5z"/>',
    plus: '<path class="f" d="M5 10l2 2-2 2-2-2zM12 10l2 2-2 2-2-2zM19 10l2 2-2 2-2-2z"/>'
  };
  var ATTR = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="square" stroke-linejoin="miter" stroke-miterlimit="10"';

  // Pour d'autres écrans (feuille « Plus ») : la même icône, colorée
  window.awkNavIco = function (tab, taille, repli, couleur) {
    if (!P[tab]) return repli || '';
    return '<svg ' + ATTR + ' width="' + taille + '" height="' + taille + '" class="awk-sys-ico on" style="color:' + (couleur || 'currentColor') + ';display:block;">' + P[tab] + '</svg>';
  };

  function css() {
    if (document.getElementById('awkNavIcoCss')) return;
    var st = document.createElement('style');
    st.id = 'awkNavIcoCss';
    st.textContent = '.awk-sys-ico .f{fill:currentColor;fill-opacity:0;transition:fill-opacity .2s;}'
      + '.awk-sys-ico.on .f,.nav-tab.active .awk-sys-ico .f{fill-opacity:.28;}'
      + '.nav-tab.active svg.awk-sys-ico{filter:drop-shadow(0 0 5px currentColor) !important;}';
    document.head.appendChild(st);
  }

  function poser() {
    css();
    var tabs = document.querySelectorAll('#mobileNavBar .nav-tab');
    for (var i = 0; i < tabs.length; i++) {
      var b = tabs[i];
      var m = /switchTab\('([a-z]+)'\)/.exec(b.getAttribute('onclick') || '');
      var tab = b.id === 'moreNavTab' ? 'plus' : (m && m[1]);
      var svg = b.querySelector('svg');
      if (!svg || !P[tab] || svg.classList.contains('awk-sys-ico')) continue;
      svg.setAttribute('stroke-width', '2.1');
      svg.setAttribute('stroke-linecap', 'square');
      svg.setAttribute('stroke-linejoin', 'miter');
      svg.setAttribute('stroke-miterlimit', '10');
      svg.classList.add('awk-sys-ico');
      svg.innerHTML = P[tab];
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', poser);
  else poser();
})();
