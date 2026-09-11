/* ═══════════════════════════════════════════════════════════════════════
   🏗️  CONSTRUCTEUR DE ROUTINE — Awakened
   -----------------------------------------------------------------------
   Remplace l'ancien flux « ouvrir un sélecteur → choisir → revenir » par
   un atelier où l'on voit sa routine se construire pendant qu'on cherche.

   MISE EN PAGE ADAPTATIVE (via une <style> injectée, car les media queries
   n'existent pas en style inline) :
     • ≥ 700px (tablette) : 2 colonnes — routine à gauche, catalogue à droite
     • < 700px (téléphone) : 1 colonne — catalogue sous la routine

   AJOUT D'UN EXERCICE :
     • TAP sur « + » — marche partout, c'est le chemin principal
     • GLISSER la carte vers la zone routine — sur écran large
   ⚠️ Le drag & drop HTML natif est ignoré par les navigateurs tactiles :
      le glissement est donc réimplémenté aux événements POINTEUR, avec un
      seuil de déplacement pour ne pas confondre avec un défilement.

   RECHERCHE : par nom, par muscle, par équipement, + onglets Favoris/Récents.
   Les favoris réutilisent la clé existante `favorites_<profil>`.

   Le rendu de la colonne de gauche est délégué à AwakRoutineEditor
   (js/routine-blocks.js) : séries/reps/durée, ordre, supersets.
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var ETAT = { q: '', muscle: '', equip: '', onglet: 'tous' };
  var MAX_LISTE = 60;   // au-delà, on demande d'affiner : listes trop longues = illisibles

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function attr(s) { return esc(s).replace(/\n/g, ' '); }

  function db() {
    try { if (typeof exerciseDatabase !== 'undefined' && Array.isArray(exerciseDatabase)) return exerciseDatabase; } catch (e) {}
    try { if (Array.isArray(window.exerciseDatabase)) return window.exerciseDatabase; } catch (e) {}
    return [];
  }
  function pid() {
    try { return (typeof getCurrentProfileId === 'function') ? getCurrentProfileId() : null; } catch (e) { return null; }
  }
  function lire(key, repli) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return repli;
      var o = JSON.parse(raw);
      return o || repli;
    } catch (e) { return repli; }
  }
  function favoris() {
    var id = pid();
    var f = lire(id ? 'favorites_' + id : 'favoriteExercises', []);
    return Array.isArray(f) ? f : [];
  }
  function recents() {
    var id = pid();
    var r = lire(id ? 'recentExercises_' + id : 'recentExercises', []);
    return Array.isArray(r) ? r : [];
  }
  function noteRecent(nom) {
    try {
      var id = pid();
      var k = id ? 'recentExercises_' + id : 'recentExercises';
      var r = recents().filter(function (x) { return x !== nom; });
      r.unshift(nom);
      localStorage.setItem(k, JSON.stringify(r.slice(0, 12)));
    } catch (e) {}
  }

  // Routine en cours d'édition
  function ctx() {
    try {
      var idx = (typeof window._getEditingRoutineIdx === 'function') ? window._getEditingRoutineIdx() : null;
      if (idx === null || idx === undefined) return null;
      var rs = window.getRoutines ? window.getRoutines() : [];
      return { routines: rs, r: rs[idx] };
    } catch (e) { return null; }
  }

  // Listes de filtres, déduites de la base
  function muscles() {
    var s = {};
    db().forEach(function (e) { if (e && e.muscle) s[e.muscle] = 1; });
    return Object.keys(s).sort();
  }
  function equipements() {
    var s = {};
    db().forEach(function (e) {
      (e && e.equipment ? e.equipment : []).forEach(function (q) { if (q) s[q] = 1; });
    });
    return Object.keys(s).sort();
  }

  function norm(s) {
    return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  function filtrer() {
    var q = norm(ETAT.q);
    var liste = db().filter(function (e) { return e && e.name && e.type !== 'rest' && e.type !== 'info'; });

    if (ETAT.onglet === 'favoris') {
      var f = favoris();
      liste = liste.filter(function (e) { return f.indexOf(e.name) >= 0; });
    } else if (ETAT.onglet === 'recents') {
      var r = recents();
      liste = liste.filter(function (e) { return r.indexOf(e.name) >= 0; })
                   .sort(function (a, b) { return r.indexOf(a.name) - r.indexOf(b.name); });
    }
    if (ETAT.muscle) liste = liste.filter(function (e) { return e.muscle === ETAT.muscle; });
    if (ETAT.equip) liste = liste.filter(function (e) { return (e.equipment || []).indexOf(ETAT.equip) >= 0; });
    if (q) liste = liste.filter(function (e) { return norm(e.name).indexOf(q) >= 0 || norm(e.muscle).indexOf(q) >= 0; });
    return liste;
  }

  // ── Styles (media queries impossibles en inline) ──
  function injecterStyles() {
    if (document.getElementById('awakBuilderStyles')) return;
    var st = document.createElement('style');
    st.id = 'awakBuilderStyles';
    st.textContent =
      '.awak-bld{display:grid;grid-template-columns:1fr;gap:14px;}' +
      '@media(min-width:700px){.awak-bld{grid-template-columns:1fr 1fr;align-items:start;}' +
      ' .awak-bld-cat{position:sticky;top:0;max-height:70vh;overflow-y:auto;}}' +
      '.awak-cat-row{transition:background .12s ease,border-color .12s ease;}' +
      '.awak-cat-row:active{background:rgba(34,211,238,0.12);}' +
      '.awak-drop-on{border-color:rgba(34,211,238,0.7)!important;background:rgba(34,211,238,0.07)!important;}' +
      '.awak-ghost{position:fixed;z-index:10500;pointer-events:none;opacity:0.92;' +
        'background:#111827;border:1.5px solid rgba(34,211,238,0.6);border-radius:10px;' +
        'padding:8px 12px;font-size:0.8em;font-weight:800;color:#e8f0f8;box-shadow:0 12px 30px rgba(0,0,0,0.6);}';
    document.head.appendChild(st);
  }

  // ── Colonne gauche : la routine ──
  function panneauRoutine(routine) {
    var n = (routine.exercises || []).length;
    var corps = (window.AwakRoutineEditor && window.AwakRoutineEditor.renderExercises)
      ? window.AwakRoutineEditor.renderExercises(routine)
      : '';
    return '<div>' +
        '<div style="display:flex;align-items:center;gap:8px;margin-bottom:9px;">' +
          '<span style="font-size:0.6em;letter-spacing:2px;color:#4ade80;font-weight:900;">◈ MA SÉANCE</span>' +
          '<span style="font-size:0.68em;color:#64748b;font-weight:700;">' + n + ' exercice' + (n > 1 ? 's' : '') + '</span>' +
          '<span style="flex:1;height:1px;background:linear-gradient(90deg,rgba(74,222,128,0.25),transparent);"></span>' +
        '</div>' +
        '<div id="awakBldDrop" style="border:1.5px dashed rgba(255,255,255,0.10);border-radius:14px;padding:10px;min-height:90px;">' +
          corps +
          '<div style="text-align:center;font-size:0.66em;color:#475569;padding:6px 4px 2px;">' +
            (n ? 'Glisse un exercice ici, ou touche +' : 'Glisse un exercice ici, ou touche + dans le catalogue') +
          '</div>' +
        '</div>' +
      '</div>';
  }

  // ── Colonne droite : le catalogue ──
  function panneauCatalogue() {
    var liste = filtrer();
    var total = liste.length;
    var tronque = total > MAX_LISTE;
    var vue = tronque ? liste.slice(0, MAX_LISTE) : liste;
    var fav = favoris();

    function ong(id, txt) {
      var on = (ETAT.onglet === id);
      return '<button onclick="AwakBuilder.setOnglet(\'' + id + '\')" style="flex:1;padding:7px 6px;border:none;' +
        'cursor:pointer;font-family:inherit;font-size:0.7em;font-weight:900;letter-spacing:0.3px;' +
        'background:' + (on ? 'rgba(34,211,238,0.18)' : 'transparent') + ';' +
        'color:' + (on ? '#67e8f9' : '#64748b') + ';">' + txt + '</button>';
    }

    function selMuscle() {
      var opts = ['<option value="">Tous les muscles</option>'].concat(muscles().map(function (m) {
        return '<option value="' + attr(m) + '"' + (ETAT.muscle === m ? ' selected' : '') + '>' + esc(m) + '</option>';
      })).join('');
      return '<select onchange="AwakBuilder.setMuscle(this.value)" style="flex:1;min-width:0;background:rgba(255,255,255,0.04);' +
        'border:1px solid rgba(255,255,255,0.12);color:#cbd5e1;border-radius:8px;padding:7px 8px;' +
        'font-size:0.74em;font-weight:700;font-family:inherit;">' + opts + '</select>';
    }
    function selEquip() {
      var opts = ['<option value="">Tout équipement</option>'].concat(equipements().map(function (q) {
        return '<option value="' + attr(q) + '"' + (ETAT.equip === q ? ' selected' : '') + '>' + esc(q) + '</option>';
      })).join('');
      return '<select onchange="AwakBuilder.setEquip(this.value)" style="flex:1;min-width:0;background:rgba(255,255,255,0.04);' +
        'border:1px solid rgba(255,255,255,0.12);color:#cbd5e1;border-radius:8px;padding:7px 8px;' +
        'font-size:0.74em;font-weight:700;font-family:inherit;">' + opts + '</select>';
    }

    var lignes = vue.map(function (e) {
      var estFav = fav.indexOf(e.name) >= 0;
      var eq = (e.equipment || []).slice(0, 2).join(' · ');
      return '<div class="awak-cat-row" data-ex="' + attr(e.name) + '" ' +
          'style="display:flex;align-items:center;gap:9px;padding:9px 10px;margin-bottom:5px;' +
          'background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.06);border-radius:10px;' +
          'touch-action:pan-y;cursor:grab;">' +
          '<div style="flex:1;min-width:0;">' +
            '<div style="font-size:0.8em;font-weight:800;color:#e8f0f8;overflow:hidden;' +
              'text-overflow:ellipsis;white-space:nowrap;">' + (estFav ? '⭐ ' : '') + esc(e.name) + '</div>' +
            '<div style="font-size:0.64em;color:#64748b;margin-top:2px;overflow:hidden;' +
              'text-overflow:ellipsis;white-space:nowrap;">' + esc(e.muscle || '') + (eq ? ' · ' + esc(eq) : '') + '</div>' +
          '</div>' +
          '<button onclick="AwakBuilder.add(\'' + attr(e.name).replace(/'/g, "\\'") + '\')" ' +
            'style="flex-shrink:0;width:32px;height:32px;min-height:auto;border-radius:9px;cursor:pointer;' +
            'background:rgba(74,222,128,0.14);border:1px solid rgba(74,222,128,0.4);color:#4ade80;' +
            'font-size:1em;font-weight:900;font-family:inherit;line-height:1;">+</button>' +
        '</div>';
    }).join('');

    if (!lignes) {
      lignes = '<div style="text-align:center;padding:22px 10px;color:#64748b;font-size:0.78em;">' +
        (ETAT.onglet === 'favoris' ? 'Aucun favori pour l\'instant.'
          : ETAT.onglet === 'recents' ? 'Aucun exercice récent.'
          : 'Aucun exercice ne correspond.') + '</div>';
    }

    return '<div class="awak-bld-cat">' +
        '<div style="display:flex;align-items:center;gap:8px;margin-bottom:9px;">' +
          '<span style="font-size:0.6em;letter-spacing:2px;color:#22d3ee;font-weight:900;">◈ CATALOGUE</span>' +
          '<span style="font-size:0.68em;color:#64748b;font-weight:700;">' + total + '</span>' +
          '<span style="flex:1;height:1px;background:linear-gradient(90deg,rgba(34,211,238,0.25),transparent);"></span>' +
        '</div>' +
        '<div style="display:flex;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);' +
          'border-radius:9px;overflow:hidden;margin-bottom:8px;">' +
          ong('tous', 'TOUS') + ong('favoris', '⭐ FAVORIS') + ong('recents', '🕐 RÉCENTS') +
        '</div>' +
        '<input type="text" id="awakBldSearch" value="' + attr(ETAT.q) + '" placeholder="Rechercher un exercice…" ' +
          'oninput="AwakBuilder.setQ(this.value)" autocomplete="off" ' +
          'style="width:100%;background:rgba(255,255,255,0.04);border:1px solid rgba(34,211,238,0.25);' +
          'color:#e8f0f8;border-radius:9px;padding:9px 11px;font-size:0.82em;font-weight:600;' +
          'font-family:inherit;box-sizing:border-box;margin-bottom:7px;">' +
        '<div style="display:flex;gap:6px;margin-bottom:9px;">' + selMuscle() + selEquip() + '</div>' +
        '<div id="awakBldList">' + lignes + '</div>' +
        (tronque ? '<div style="text-align:center;font-size:0.68em;color:#64748b;padding:8px 4px;">' +
          'Affiche les ' + MAX_LISTE + ' premiers sur ' + total + ' — affine la recherche.</div>' : '') +
      '</div>';
  }

  var API = {};

  API.renderBody = function (routine) {
    injecterStyles();
    setTimeout(brancherGlisser, 0);
    return '<div class="awak-bld">' + panneauRoutine(routine) + panneauCatalogue() + '</div>';
  };

  // Re-rendu complet du corps de l'éditeur
  function refresh(gardeFocus) {
    var c = ctx();
    if (!c || !c.r) return;
    var host = document.getElementById('routineEditorExercises');
    if (!host) return;
    var sel = gardeFocus ? document.getElementById('awakBldSearch') : null;
    var pos = sel ? sel.selectionStart : null;
    host.innerHTML = API.renderBody(c.r);
    if (gardeFocus) {
      var n = document.getElementById('awakBldSearch');
      if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch (e) {} }
    }
  }
  API.refresh = refresh;

  API.setQ = function (v) { ETAT.q = v || ''; refresh(true); };
  API.setMuscle = function (v) { ETAT.muscle = v || ''; refresh(false); };
  API.setEquip = function (v) { ETAT.equip = v || ''; refresh(false); };
  API.setOnglet = function (v) { ETAT.onglet = v; refresh(false); };

  API.add = function (nom) {
    var c = ctx();
    if (!c || !c.r) return;
    var ex = db().filter(function (e) { return e && e.name === nom; })[0];
    if (!ex) return;
    if (!Array.isArray(c.r.exercises)) c.r.exercises = [];
    c.r.exercises.push({
      name: ex.name,
      muscle: ex.muscle || '',
      sets: 3,
      reps: 10,
      mode: 'reps'
    });
    if (window.saveRoutines) window.saveRoutines(c.routines);
    noteRecent(ex.name);
    refresh(false);
    if (typeof window.showToast === 'function') window.showToast('➕ ' + ex.name, 'success', 1400);
    try { if (navigator.vibrate) navigator.vibrate(25); } catch (e) {}
  };

  // ── Glisser-déposer aux événements POINTEUR (le DnD natif ne marche pas au tactile) ──
  var drag = null;

  function brancherGlisser() {
    var host = document.getElementById('routineEditorExercises');
    if (!host || host._awakDnd) return;
    host._awakDnd = true;
    host.addEventListener('pointerdown', onDown);
  }

  function onDown(ev) {
    var row = ev.target && ev.target.closest ? ev.target.closest('.awak-cat-row') : null;
    if (!row) return;
    if (ev.target.tagName === 'BUTTON') return;   // le « + » garde son rôle
    drag = { nom: row.getAttribute('data-ex'), x0: ev.clientX, y0: ev.clientY, actif: false, id: ev.pointerId };
    document.addEventListener('pointermove', onMove, { passive: false });
    document.addEventListener('pointerup', onUp);
    document.addEventListener('pointercancel', onUp);
  }

  function onMove(ev) {
    if (!drag) return;
    var dx = ev.clientX - drag.x0, dy = ev.clientY - drag.y0;
    // Seuil : en deçà, c'est un défilement, pas un glissement.
    if (!drag.actif) {
      if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
      // Geste franchement vertical = défilement de la liste : on n'intercepte pas.
      if (Math.abs(dy) > Math.abs(dx) * 1.6) { nettoyer(); return; }
      drag.actif = true;
      var g = document.createElement('div');
      g.className = 'awak-ghost';
      g.textContent = drag.nom;
      document.body.appendChild(g);
      drag.ghost = g;
    }
    ev.preventDefault();
    if (drag.ghost) {
      drag.ghost.style.left = (ev.clientX + 12) + 'px';
      drag.ghost.style.top = (ev.clientY - 18) + 'px';
    }
    var zone = document.getElementById('awakBldDrop');
    if (zone) {
      var r = zone.getBoundingClientRect();
      var dedans = ev.clientX >= r.left && ev.clientX <= r.right && ev.clientY >= r.top && ev.clientY <= r.bottom;
      zone.classList.toggle('awak-drop-on', dedans);
    }
  }

  function onUp(ev) {
    if (!drag) return;
    var depose = false;
    if (drag.actif) {
      var zone = document.getElementById('awakBldDrop');
      if (zone) {
        var r = zone.getBoundingClientRect();
        depose = ev.clientX >= r.left && ev.clientX <= r.right && ev.clientY >= r.top && ev.clientY <= r.bottom;
      }
    }
    var nom = drag.nom;
    nettoyer();
    if (depose && nom) API.add(nom);
  }

  function nettoyer() {
    if (drag && drag.ghost) { try { drag.ghost.remove(); } catch (e) {} }
    var zone = document.getElementById('awakBldDrop');
    if (zone) zone.classList.remove('awak-drop-on');
    drag = null;
    document.removeEventListener('pointermove', onMove);
    document.removeEventListener('pointerup', onUp);
    document.removeEventListener('pointercancel', onUp);
  }

  window.AwakBuilder = API;
})();
