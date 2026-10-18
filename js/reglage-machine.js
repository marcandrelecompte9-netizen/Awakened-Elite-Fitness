// v1400 — Réglage de la machine : une note par exercice sur machine ou poulie
// (« Siège 4 · dossier 2 · prise large »), affichée au-dessus des séries à
// chaque séance. Touche la note pour la modifier. Rangée par profil
// (_cleProfil('awakReglages')) : { « nom de l'exercice » : « note » }.
(function () {
  'use strict';

  function cle() { return window._cleProfil ? window._cleProfil('awakReglages') : 'awakReglages'; }
  function lire() { try { return JSON.parse(localStorage.getItem(cle()) || '{}') || {}; } catch (e) { return {}; } }
  function ecrire(o) { try { localStorage.setItem(cle(), JSON.stringify(o)); } catch (e) {} }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function exoCourant() {
    try {
      var B = window.AwakSSBridge; var w = B && B.getWorkout(); if (!w || !w.exercises) return null;
      return w.exercises[B.getExIdx()] || null;
    } catch (e) { return null; }
  }
  function surMachine(ex) {
    if (!ex || ex.isRest || ex.isInfo) return false;
    var eq = ex.equipment;
    try { if (!eq && window.exerciseDatabase) { var d = window.exerciseDatabase.find(function (e) { return e.name === (ex._baseName || ex.name); }); eq = d && d.equipment; } } catch (e) {}
    var t = (Array.isArray(eq) ? eq.join(' ') : String(eq || '')) + ' ' + (ex.name || '');
    return /machine|poulie|c[aâ]ble|smith|presse|cable/i.test(t);
  }
  function nomDe(ex) { return ex._baseName || ex.name; }

  function rendre() {
    var panel = document.getElementById('setsGridPanel');
    var vieux = document.getElementById('awakReglage');
    var ex = exoCourant();
    if (!panel || panel.style.display === 'none' || !surMachine(ex)) { if (vieux) vieux.remove(); return; }
    var n = nomDe(ex), note = lire()[n] || '';
    var h = '<span class="awk-rgm-lbl">Réglage</span>'
      + (note ? '<span class="awk-rgm-note">' + esc(note) + '</span>' : '<span class="awk-rgm-vide">Siège, dossier, prise… note-le ici</span>')
      + '<span class="awk-rgm-mod">' + (note ? 'modifier' : 'ajouter') + '</span>';
    var el = vieux;
    if (!el) {
      el = document.createElement('button');
      el.type = 'button'; el.id = 'awakReglage';
      el.onclick = editer;
      panel.parentNode.insertBefore(el, panel);
    }
    if (el.dataset.nom !== n || el.dataset.note !== note) { el.innerHTML = h; el.dataset.nom = n; el.dataset.note = note; }
  }
  function editer() {
    var el = document.getElementById('awakReglage'); if (!el) return;
    var n = el.dataset.nom, note = lire()[n] || '';
    var f = document.createElement('div');
    f.id = 'awakReglageEdit';
    f.innerHTML = '<input type="text" maxlength="80" placeholder="Ex. : siège 4 · dossier 2 · prise large" value="' + esc(note) + '">'
      + '<button type="button" data-ok>OK</button>';
    el.replaceWith(f);
    var inp = f.querySelector('input');
    var fini = false;
    var garder = function () {
      if (fini) return; fini = true;
      var o = lire(), v = inp.value.trim();
      if (v) o[n] = v; else delete o[n];
      ecrire(o);
      f.remove(); rendre();
    };
    f.querySelector('[data-ok]').onmousedown = function (e) { e.preventDefault(); garder(); };
    inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') garder(); });
    inp.addEventListener('blur', garder);
    inp.focus();
  }

  function brancher() {
    var panel = document.getElementById('setsGridPanel');
    if (!panel) return;
    new MutationObserver(function () { if (!document.getElementById('awakReglageEdit')) rendre(); })
      .observe(panel, { childList: true, attributes: true, attributeFilter: ['style'] });
  }

  window.AwakReglage = { rendre: rendre, lire: lire };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', brancher); else brancher();
})();
