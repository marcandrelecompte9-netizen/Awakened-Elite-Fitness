// v1532 : ICÔNES ILLUSTRÉES DU MENU (images/Menu/menu_<nom>.webp)
// Le SVG d'origine reste affiché tant que l'image n'est pas chargée (et en cas
// d'échec). L'onglet actif est plein et lumineux, les autres un peu atténués.
(function () {
  'use strict';
  var MAP = { home: 'accueil', workouts: 'entrainer', routines: 'routines', program: 'programme', history: 'progression',
    calendar: 'calendrier', exercises: 'decouvrir', calculators: 'calculs', challenges: 'defis', settings: 'reglages',
    family: 'famille', game: 'jeu', plus: 'plus' };
  var V = '1';
  function src(tab) { return MAP[tab] ? 'images/Menu/menu_' + MAP[tab] + '.webp?v=' + V : null; }

  // Pour d'autres écrans (feuille « Plus ») : image, sinon le HTML de repli
  window.awkNavIco = function (tab, taille, repli) {
    var s = src(tab); if (!s) return repli || '';
    var id = 'awkni' + Math.random().toString(36).slice(2, 8);
    return '<img src="' + s + '" alt="" draggable="false" style="width:' + taille + 'px;height:' + taille + 'px;object-fit:contain;" '
      + 'onerror="var r=document.getElementById(\'' + id + '\');if(r)r.style.display=\'\';this.remove();">'
      + '<span id="' + id + '" style="display:none;">' + (repli || '') + '</span>';
  };

  function css() {
    if (document.getElementById('awkNavIcoCss')) return;
    var st = document.createElement('style');
    st.id = 'awkNavIcoCss';
    st.textContent = '.nav-tab img.awk-nav-ico{width:26px;height:26px;object-fit:contain;flex-shrink:0;opacity:.8;filter:saturate(.85);transition:opacity .2s,filter .2s,transform .2s;}'
      + '.nav-tab.active img.awk-nav-ico{opacity:1;filter:drop-shadow(0 0 6px rgba(139,124,246,.75));transform:scale(1.08);}'
      + '@media (max-width:480px){.nav-tab img.awk-nav-ico{width:24px;height:24px;}}';
    document.head.appendChild(st);
  }

  function poser() {
    css();
    var tabs = document.querySelectorAll('#mobileNavBar .nav-tab');
    for (var i = 0; i < tabs.length; i++) (function (b) {
      if (b.querySelector('img.awk-nav-ico')) return;
      var m = /switchTab\('([a-z]+)'\)/.exec(b.getAttribute('onclick') || '');
      var tab = b.id === 'moreNavTab' ? 'plus' : (m && m[1]);
      var s = src(tab), svg = b.querySelector('svg');
      if (!s || !svg) return;
      var img = new Image();
      img.className = 'awk-nav-ico'; img.alt = ''; img.draggable = false;
      img.onload = function () { svg.style.display = 'none'; img.style.display = ''; };
      img.onerror = function () { img.remove(); };
      img.style.display = 'none';
      img.src = s;
      b.insertBefore(img, svg);
    })(tabs[i]);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', poser);
  else poser();
})();
