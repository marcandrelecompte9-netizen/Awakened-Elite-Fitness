// v1393 — Onglet Progrès en 3 sous-onglets : Résumé · Séances · Corps.
// Avant : une seule longue page (graphique, défi, tuiles, historique,
// photos, mesures) où le corps finissait tout en bas.
// Rien n'est déplacé dans le DOM : chaque enfant direct de #historyTab
// reçoit data-pg (resume / seances / corps) selon sa position, et le CSS
// cache ceux qui ne sont pas du sous-onglet actif. Les fonctions qui
// remplissent ces blocs (historique, carte Ton corps, mesures) ne changent pas.
(function () {
  'use strict';

  var ONGLETS = [
    { id: 'resume', nom: 'Résumé' },
    { id: 'seances', nom: 'Séances' },
    { id: 'corps', nom: 'Corps' }
  ];
  var actif = null;

  function tab() { return document.getElementById('historyTab'); }
  function pid() { try { return (window.getCurrentProfileId && window.getCurrentProfileId()) || 'default'; } catch (e) { return 'default'; } }
  function cle() { return 'awakProgOnglet_' + pid(); }
  function enfant() {
    // Les enfants n'ont pas « Ton corps » (progress-tab.js le cache)
    var t = document.getElementById('awakCorpsCard');
    return !!(t && t.style.display === 'none');
  }

  // Range chaque enfant direct dans son groupe, d'après sa position :
  // tout ce qui précède l'historique = Résumé ; l'historique = Séances ;
  // à partir du titre « Ton corps » = Corps.
  function classer() {
    var t = tab(); if (!t) return;
    var g = 'resume';
    Array.prototype.forEach.call(t.children, function (el) {
      if (el.id === 'awakPgBarre' || el.dataset.pgFixe) return;
      if (el.id === 'awakHistSection') g = 'seances';
      else if (el.id === 'awakCorpsTitre') g = 'corps';
      if (el.dataset.pg !== g) el.dataset.pg = g;
    });
  }

  function barre() {
    var t = tab(); if (!t) return null;
    var b = document.getElementById('awakPgBarre');
    if (b) return b;
    b = document.createElement('div');
    b.id = 'awakPgBarre';
    b.setAttribute('role', 'tablist');
    b.innerHTML = ONGLETS.map(function (o) {
      return '<button type="button" role="tab" data-pg-btn="' + o.id + '">' + o.nom + '</button>';
    }).join('');
    // Juste sous l'en-tête « Ton parcours / Progression »
    var tete = t.querySelector('[data-pg-fixe]') || t.firstElementChild;
    if (tete && tete.nextSibling) t.insertBefore(b, tete.nextSibling); else t.insertBefore(b, t.firstChild);
    b.addEventListener('click', function (e) {
      var x = e.target.closest('[data-pg-btn]'); if (!x) return;
      aller(x.getAttribute('data-pg-btn'), true);
    });
    return b;
  }

  // Ouvre d'office les accordéons du sous-onglet (plus rien à déplier)
  function ouvrirAccordeons(g) {
    var t = tab(); if (!t) return;
    Array.prototype.forEach.call(t.querySelectorAll(':scope > [data-pg="' + g + '"].accordion-section'), function (s) {
      if (s.style.display === 'none' || s.dataset.pgOuvert) return;
      s.dataset.pgOuvert = '1';
      var h = s.querySelector(':scope > .accordion-header'), c = s.querySelector(':scope > .accordion-body');
      if (h) h.classList.add('active');
      if (c) c.classList.add('open');
    });
  }

  function aller(g, haut) {
    var t = tab(); if (!t) return;
    classer();
    var b = barre();
    var kid = enfant();
    if (b) {
      var bc = b.querySelector('[data-pg-btn="corps"]');
      if (bc) bc.hidden = kid;
    }
    if (!ONGLETS.some(function (o) { return o.id === g; })) g = 'resume';
    if (g === 'corps' && kid) g = 'resume';
    actif = g;
    t.setAttribute('data-pg-actif', g);
    if (b) Array.prototype.forEach.call(b.querySelectorAll('[data-pg-btn]'), function (x) {
      var on = x.getAttribute('data-pg-btn') === g;
      x.classList.toggle('actif', on);
      x.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    ouvrirAccordeons(g);
    try { localStorage.setItem(cle(), g); } catch (e) {}
    if (haut) {
      try {
        var r = b.getBoundingClientRect();
        if (r.top < 0 || window.scrollY > t.offsetTop + 40) window.scrollTo({ top: Math.max(0, t.offsetTop - 8), behavior: 'auto' });
      } catch (e) {}
    }
    if (g === 'corps') {
      try { if (typeof window.awakRenderCorpsCard === 'function') window.awakRenderCorpsCard(); } catch (e) {}
    }
  }

  function memorise() {
    try { return localStorage.getItem(cle()) || 'resume'; } catch (e) { return 'resume'; }
  }

  // À chaque ouverture de l'onglet : on reprend le dernier sous-onglet
  function rafraichir() { aller(actif || memorise(), false); }

  // Ouvrir l'onglet Progrès directement sur un sous-onglet
  function voir(g) {
    if (typeof window.switchTab === 'function') window.switchTab('history');
    setTimeout(function () { aller(g, true); }, 0);
  }

  function brancher() {
    var t = tab(); if (!t) return;
    classer(); barre();
    t.setAttribute('data-pg-actif', memorise());
    // Blocs ajoutés plus tard (accordéons créés par le JS) : on les range
    new MutationObserver(function (m) {
      for (var i = 0; i < m.length; i++) if (m[i].addedNodes.length) { classer(); if (actif) ouvrirAccordeons(actif); return; }
    }).observe(t, { childList: true });
    // Changement de profil : on reprend le sous-onglet de ce profil
    new MutationObserver(function () {
      if (t.classList.contains('active')) { if (!t._pgVu) { t._pgVu = 1; actif = memorise(); } rafraichir(); }
      else t._pgVu = 0;
    }).observe(t, { attributes: true, attributeFilter: ['class'] });
    aller(memorise(), false);
  }

  window.AwakProgOnglets = { aller: aller, voir: voir, actif: function () { return actif; }, classer: classer };
  window.awakProgVoir = voir;
  window.awakProgSeances = function () { voir('seances'); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', brancher); else brancher();
})();
