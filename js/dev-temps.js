// v1398 — Mode développeur : « Avancer le temps ».
// Chargé AVANT tous les autres scripts. Si un décalage est enregistré
// (awakDevDecalage, en ms, posé seulement par le panneau développeur),
// Date.now() et new Date() sans argument renvoient « maintenant + décalage ».
// Les dates explicites (new Date(iso), new Date(2026, 0, 1)) ne changent pas.
// Sans décalage, ce fichier ne fait rien.
(function () {
  'use strict';
  var d = 0;
  try { d = parseInt(localStorage.getItem('awakDevDecalage') || '0', 10) || 0; } catch (e) {}
  if (!d) return;
  var R = Date;
  function D(a, b, c, e, f, g, h) {
    if (!(this instanceof D)) return new R(R.now() + d).toString();
    switch (arguments.length) {
      case 0: return new R(R.now() + d);
      case 1: return new R(a);
      case 2: return new R(a, b);
      case 3: return new R(a, b, c);
      case 4: return new R(a, b, c, e);
      case 5: return new R(a, b, c, e, f);
      case 6: return new R(a, b, c, e, f, g);
      default: return new R(a, b, c, e, f, g, h);
    }
  }
  D.prototype = R.prototype;
  D.now = function () { return R.now() + d; };
  D.parse = R.parse;
  D.UTC = R.UTC;
  D._reel = R;
  window.Date = D;
  window._awakDevDecalage = d;
})();
