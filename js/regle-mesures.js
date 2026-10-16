// v1379 — Mensurations : règle à glisser au lieu du clavier.
// Toucher un champ de mesure ouvre un panneau du bas avec la règle glissante
// d'AwakRegle (js/regle.js, déjà utilisée pour l'âge et le poids à
// l'inscription) : on glisse la règle, ou − / + (appui long = rapide).
// « Clavier » rend le champ normal si on préfère taper la valeur.
// Les champs restent de vrais <input> : saveMeasurement() ne change pas.
(function () {
  'use strict';

  var CHAMPS = {
    measureWeight: { nom: 'Poids', min: 66, max: 440, pas: 0.1, def: 165 },
    measureHeight: { nom: 'Taille', min: 36, max: 90, pas: 0.5, def: 68, unite: 'po' },
    measureWaist: { nom: 'Tour de taille', min: 18, max: 70, pas: 0.5, def: 32, unite: 'po' },
    measureHips: { nom: 'Tour de hanches', min: 20, max: 75, pas: 0.5, def: 38, unite: 'po' },
    measureBiceps: { nom: 'Biceps', min: 6, max: 30, pas: 0.5, def: 14, unite: 'po' },
    measureThighs: { nom: 'Cuisses', min: 10, max: 45, pas: 0.5, def: 22, unite: 'po' }
  };
  var CLES = { measureWeight: 'weight', measureHeight: 'height', measureWaist: 'waist', measureHips: 'hips', measureBiceps: 'biceps', measureThighs: 'thighs' };
  var RID = 'awakRegleMesR';

  function conf(id) {
    var c = Object.assign({}, CHAMPS[id]);
    if (id === 'measureWeight') {
      var s = document.querySelector('#measurementForm [data-weight-unit]');
      if (s && /kg/i.test(s.textContent)) { c.min = 30; c.max = 200; c.def = 75; c.unite = 'kg'; } else c.unite = 'lbs';
    }
    return c;
  }
  function borner(v, c) {
    v = Math.round(v / c.pas) * c.pas;
    return +Math.min(c.max, Math.max(c.min, v)).toFixed(2);
  }
  function depart(id, c) {
    var inp = document.getElementById(id);
    var v = inp && parseFloat(inp.value);
    if (v > 0) return borner(v, c);
    try {
      var hist = typeof window.getBodyMeasurements === 'function' ? window.getBodyMeasurements() : [];
      for (var i = 0; i < hist.length; i++) {
        var h = hist[i], x = h && parseFloat(h[CLES[id]]);
        if (!(x > 0)) continue;
        if (id === 'measureWeight' && typeof window.awakMesurePoids === 'function') x = window.awakMesurePoids(h) || x;
        return borner(x, c);
      }
    } catch (e) {}
    return borner(c.def, c);
  }

  var ouvert = null;

  function ouvrir(id) {
    if (!window.AwakRegle) return;
    fermer();
    var c = conf(id);
    var fond = document.createElement('div');
    fond.id = 'awakRegleMes';
    fond.innerHTML =
      '<div class="awk-rg-feuille" role="dialog" aria-label="' + c.nom + '">' +
        '<div class="awk-rg-poignee"></div>' +
        '<div class="awk-rg-tete"><div class="awk-rg-nom">' + c.nom + '</div>' +
          '<button type="button" class="awk-rg-clavier" data-clavier>Clavier</button></div>' +
        window.AwakRegle.html(RID, { min: c.min, max: c.max, pas: c.pas, val: depart(id, c), unite: c.unite, aide: 'Glisse la règle ou touche − / +' }) +
        '<div class="awk-rg-pied">' +
          '<button type="button" class="awk-btn-2" data-annuler>Annuler</button>' +
          '<button type="button" class="awk-btn" data-ok>Valider</button></div>' +
      '</div>';
    document.body.appendChild(fond);
    window.AwakRegle.init(RID);
    ouvert = { id: id, fond: fond };
    try { if (typeof window.awakMesureFocus === 'function') window.awakMesureFocus(id, true); } catch (e) {}

    fond.querySelector('[data-ok]').onclick = valider;
    fond.querySelector('[data-annuler]').onclick = fermer;
    fond.querySelector('[data-clavier]').onclick = function () { clavier(id); };
    fond.addEventListener('click', function (e) { if (e.target === fond) fermer(); });
  }

  function valider() {
    if (!ouvert) return;
    var inp = document.getElementById(ouvert.id);
    var v = window.AwakRegle.valeur(RID);
    if (inp && v != null) {
      inp.value = String(v);
      inp.dispatchEvent(new Event('input', { bubbles: true }));
      inp.dispatchEvent(new Event('change', { bubbles: true }));
    }
    fermer();
  }

  function fermer() {
    if (!ouvert) return;
    var o = ouvert; ouvert = null;
    try { if (typeof window.awakMesureFocus === 'function') window.awakMesureFocus(o.id, false); } catch (e) {}
    try { if (typeof window.awakRenderSilhouetteMesures === 'function') window.awakRenderSilhouetteMesures(); } catch (e) {}
    o.fond.remove();
  }

  // « Clavier » : champ normal le temps d'une saisie, puis retour à la règle
  function clavier(id) {
    var inp = document.getElementById(id);
    fermer();
    if (!inp) return;
    inp.removeAttribute('readonly');
    inp.setAttribute('inputmode', 'decimal');
    inp.dataset.rgClavier = '1';
    inp.focus();
    var remettre = function () { inp.removeEventListener('blur', remettre); setTimeout(function () { verrouiller(inp); }, 0); };
    inp.addEventListener('blur', remettre);
  }

  function verrouiller(inp) {
    inp.setAttribute('readonly', 'readonly');
    inp.setAttribute('inputmode', 'none');
    delete inp.dataset.rgClavier;
    inp.classList.add('awk-rg-champ');
  }

  function brancher() {
    Object.keys(CHAMPS).forEach(function (id) {
      var inp = document.getElementById(id);
      if (!inp || inp.dataset.rgBranche) return;
      inp.dataset.rgBranche = '1';
      verrouiller(inp);
      inp.addEventListener('click', function () { if (!inp.dataset.rgClavier) ouvrir(id); });
      inp.addEventListener('keydown', function (e) {
        if (!inp.dataset.rgClavier && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); ouvrir(id); }
      });
    });
  }

  window.AwakRegleMesures = { ouvrir: ouvrir, valider: valider, fermer: fermer, ouvert: function () { return ouvert && ouvert.id; }, RID: RID };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', brancher); else brancher();
})();
