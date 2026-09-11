/* ═══════════════════════════════════════════════════════════════════════
   🏗️  ROUTINES EN BLOCS — Awakened
   -----------------------------------------------------------------------
   Permet de composer une routine comme une vraie séance :
     « 5 min de vélo, puis du bench, puis un superset de 2 exercices »

   1. ÉDITEUR ENRICHI (AwakRoutineEditor)
      Chaque exercice devient réglable directement dans l'éditeur :
        • mode REPS  → séries × répétitions
        • mode DURÉE → séries × minutes:secondes  (cardio, gainage)
        • ordre : monter / descendre
        • superset : lier un exercice au suivant (groupe A/B/C…)

   2. MOTEUR DE SUPERSET (AwakSS)
      Vrai alternage : A série 1 → B série 1 → repos → A série 2 → …
      ⚠️ Le lecteur de séance remet `currentSetNumber` à 1 à chaque
         changement d'exercice (initSetsTracker). Le module garde donc le
         numéro de TOUR de son côté et le réinjecte après chaque bascule.

   MODÈLE DE DONNÉES — le tableau `exercises` reste PLAT (aucune imbrication,
   donc aucune routine existante ne casse). On ajoute un champ optionnel :
        ss : '<id de groupe>'   → exercices ADJACENTS partageant le même id
                                   sont enchaînés en superset.
   Un exercice sans `ss` se comporte exactement comme avant.
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function isTimed(ex) { return ex && (ex.mode === 'timer' || ex.mode === 'duration'); }

  // 45 → '0:45'  ·  300 → '5:00'
  function fmtDur(sec) {
    var s = Math.max(0, parseInt(sec, 10) || 0);
    return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2);
  }
  // Libellé court pour les listes : '5 min' / '45 s'
  function shortDur(sec) {
    var s = Math.max(0, parseInt(sec, 10) || 0);
    if (s >= 60 && s % 60 === 0) return (s / 60) + ' min';
    if (s >= 60) return Math.floor(s / 60) + ' min ' + (s % 60) + ' s';
    return s + ' s';
  }

  // Lettres de superset : A, B, C…
  var LETTRES = ['A', 'B', 'C', 'D', 'E', 'F'];

  // Membres du groupe superset auquel appartient l'index i (adjacents uniquement)
  function groupMembers(exs, i) {
    var g = exs[i] && exs[i].ss;
    if (!g) return [i];
    var out = [i], k;
    for (k = i - 1; k >= 0 && exs[k] && exs[k].ss === g; k--) out.unshift(k);
    for (k = i + 1; k < exs.length && exs[k] && exs[k].ss === g; k++) out.push(k);
    return out;
  }

  // ═══════════════════════════════════════════════════════════════════
  // 1. ÉDITEUR
  // ═══════════════════════════════════════════════════════════════════
  var Editor = {};

  function currentRoutine() {
    try {
      var idx = (typeof window._getEditingRoutineIdx === 'function') ? window._getEditingRoutineIdx() : null;
      if (idx === null || idx === undefined) return null;
      var rs = window.getRoutines ? window.getRoutines() : [];
      return { routines: rs, r: rs[idx] };
    } catch (e) { return null; }
  }

  function commit(ctx, rerender) {
    if (!ctx || !ctx.r) return;
    if (window.saveRoutines) window.saveRoutines(ctx.routines);
    if (rerender !== false) {
      var cont = document.getElementById('routineEditorExercises');
      if (cont) cont.innerHTML = Editor.renderExercises(ctx.r);
    }
  }

  // Rendu d'une ligne d'exercice
  function rowHTML(ex, i, exs) {
    var timed = isTimed(ex);
    var g = ex.ss;
    var members = g ? groupMembers(exs, i) : null;
    var pos = members ? members.indexOf(i) : -1;
    var lettre = (pos >= 0) ? (LETTRES[pos] || '•') : '';
    var estGroupe = !!(members && members.length > 1);

    // Bandeau de groupe (affiché sur le premier membre seulement)
    var enTete = '';
    if (estGroupe && pos === 0) {
      enTete = '<div style="display:flex;align-items:center;gap:7px;margin:2px 0 5px;">' +
          '<span style="background:rgba(251,146,60,0.15);border:1px solid rgba(251,146,60,0.45);color:#fb923c;' +
            'padding:2px 9px;border-radius:99px;font-size:0.6em;font-weight:900;letter-spacing:1px;">⚡ SUPERSET</span>' +
          '<span style="font-size:0.62em;color:#64748b;font-weight:700;">' + members.length + ' exercices enchaînés sans repos</span>' +
        '</div>';
    }

    var bordure = estGroupe ? 'border-left:3px solid #fb923c;' : 'border-left:3px solid rgba(255,255,255,0.06);';

    // Réglages : séries + (reps | durée)
    var reglages =
      '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-top:8px;">' +
        '<span style="font-size:0.6em;color:#64748b;font-weight:900;letter-spacing:1px;">SÉRIES</span>' +
        '<input type="number" min="1" max="20" value="' + (parseInt(ex.sets, 10) || 3) + '" ' +
          'onchange="AwakRoutineEditor.setField(' + i + ',\'sets\',this.value)" ' +
          'style="width:52px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.12);color:#e8f0f8;' +
          'border-radius:7px;padding:5px 6px;font-size:0.8em;font-weight:800;text-align:center;font-family:inherit;">' +
        '<span style="color:#475569;font-weight:900;">×</span>' +
        (timed
          ? '<input type="number" min="5" max="3600" step="5" value="' + (parseInt(ex.duration, 10) || 45) + '" ' +
              'onchange="AwakRoutineEditor.setField(' + i + ',\'duration\',this.value)" ' +
              'style="width:68px;background:rgba(34,211,238,0.08);border:1px solid rgba(34,211,238,0.3);color:#67e8f9;' +
              'border-radius:7px;padding:5px 6px;font-size:0.8em;font-weight:800;text-align:center;font-family:inherit;">' +
            '<span style="font-size:0.66em;color:#67e8f9;font-weight:800;">sec (' + esc(shortDur(ex.duration || 45)) + ')</span>'
          : '<input type="number" min="1" max="100" value="' + (parseInt(ex.reps, 10) || 10) + '" ' +
              'onchange="AwakRoutineEditor.setField(' + i + ',\'reps\',this.value)" ' +
              'style="width:58px;background:rgba(74,222,128,0.08);border:1px solid rgba(74,222,128,0.3);color:#86efac;' +
              'border-radius:7px;padding:5px 6px;font-size:0.8em;font-weight:800;text-align:center;font-family:inherit;">' +
            '<span style="font-size:0.66em;color:#86efac;font-weight:800;">reps</span>') +
      '</div>';

    // Bascule reps / durée
    var bascule =
      '<div style="display:inline-flex;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);' +
        'border-radius:8px;overflow:hidden;margin-top:8px;">' +
        '<button onclick="AwakRoutineEditor.setMode(' + i + ',\'reps\')" ' +
          'style="border:none;cursor:pointer;padding:5px 11px;font-size:0.68em;font-weight:800;font-family:inherit;' +
          'background:' + (timed ? 'transparent' : 'rgba(74,222,128,0.2)') + ';color:' + (timed ? '#64748b' : '#86efac') + ';">Reps</button>' +
        '<button onclick="AwakRoutineEditor.setMode(' + i + ',\'timer\')" ' +
          'style="border:none;cursor:pointer;padding:5px 11px;font-size:0.68em;font-weight:800;font-family:inherit;' +
          'background:' + (timed ? 'rgba(34,211,238,0.2)' : 'transparent') + ';color:' + (timed ? '#67e8f9' : '#64748b') + ';">⏱ Durée</button>' +
      '</div>';

    // Actions : ordre, superset, suppression
    var btn = 'background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.12);color:#94a3b8;' +
      'border-radius:7px;padding:5px 9px;font-size:0.7em;font-weight:800;cursor:pointer;font-family:inherit;';
    var btnOff = 'background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.05);color:#475569;' +
      'border-radius:7px;padding:5px 9px;font-size:0.7em;font-weight:800;cursor:not-allowed;font-family:inherit;';

    var peutLier = (i < exs.length - 1);
    var lie = peutLier && exs[i + 1] && ex.ss && exs[i + 1].ss === ex.ss;

    var actions =
      '<div style="display:flex;align-items:center;gap:5px;flex-wrap:wrap;margin-top:9px;padding-top:9px;' +
        'border-top:1px dashed rgba(255,255,255,0.07);">' +
        '<button onclick="AwakRoutineEditor.move(' + i + ',-1)" ' + (i > 0 ? 'style="' + btn + '"' : 'disabled style="' + btnOff + '"') + ' title="Monter">▲</button>' +
        '<button onclick="AwakRoutineEditor.move(' + i + ',1)" ' + (i < exs.length - 1 ? 'style="' + btn + '"' : 'disabled style="' + btnOff + '"') + ' title="Descendre">▼</button>' +
        (peutLier
          ? '<button onclick="AwakRoutineEditor.toggleSS(' + i + ')" style="' +
              (lie
                ? 'background:rgba(251,146,60,0.18);border:1px solid rgba(251,146,60,0.5);color:#fb923c;'
                : 'background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.12);color:#94a3b8;') +
              'border-radius:7px;padding:5px 10px;font-size:0.7em;font-weight:800;cursor:pointer;font-family:inherit;">' +
              (lie ? '⚡ Délier du suivant' : '⚡ Lier au suivant') + '</button>'
          : '') +
        '<span style="flex:1;"></span>' +
        '<button onclick="_removeExerciseFromEditing(' + i + ')" ' +
          'style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.25);color:#f87171;' +
          'border-radius:7px;padding:5px 10px;font-size:0.7em;font-weight:800;cursor:pointer;font-family:inherit;">✕</button>' +
      '</div>';

    return enTete +
      '<div style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.05);' + bordure +
        'border-radius:10px;padding:11px 12px;margin-bottom:' + (estGroupe && pos < members.length - 1 ? '4px' : '9px') + ';">' +
        '<div style="display:flex;align-items:center;gap:8px;">' +
          (estGroupe
            ? '<span style="flex-shrink:0;width:21px;height:21px;border-radius:6px;background:#fb923c;color:#1a0f04;' +
              'font-size:0.68em;font-weight:900;display:inline-flex;align-items:center;justify-content:center;">' + lettre + '</span>'
            : '<span style="flex-shrink:0;color:#475569;font-size:0.72em;font-weight:900;min-width:16px;">' + (i + 1) + '</span>') +
          '<div style="flex:1;min-width:0;">' +
            '<div style="font-weight:800;color:#e8f0f8;font-size:0.86em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + esc(ex.name) + '</div>' +
            '<div style="font-size:0.64em;color:#64748b;margin-top:1px;">' + esc(ex.muscle || 'Corps') + '</div>' +
          '</div>' +
        '</div>' +
        reglages +
        bascule +
        actions +
      '</div>';
  }

  Editor.renderExercises = function (routine) {
    var exs = (routine && routine.exercises) || [];
    if (!exs.length) {
      return '<div style="text-align:center;padding:30px 18px;color:#475569;font-size:0.82em;font-style:italic;">' +
        'Aucun exercice. Ajoute-en !</div>';
    }
    var aide = '<div style="font-size:0.64em;color:#64748b;line-height:1.5;margin-bottom:10px;padding:9px 11px;' +
      'background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.05);border-radius:9px;">' +
      '💡 Règle chaque exercice en <strong style="color:#86efac;">reps</strong> ou en ' +
      '<strong style="color:#67e8f9;">durée</strong> (ex. 5 min de vélo). ' +
      '<strong style="color:#fb923c;">⚡ Lier au suivant</strong> crée un superset : ' +
      'les exercices s\'enchaînent sans repos.</div>';
    return aide + exs.map(function (ex, i) { return rowHTML(ex, i, exs); }).join('');
  };

  Editor.setField = function (i, champ, val) {
    var ctx = currentRoutine();
    if (!ctx || !ctx.r || !ctx.r.exercises || !ctx.r.exercises[i]) return;
    var n = parseInt(val, 10);
    if (isNaN(n) || n < 1) n = 1;
    ctx.r.exercises[i][champ] = n;
    // Pas de re-render : cela ferait perdre le focus du champ en cours de saisie.
    commit(ctx, champ === 'duration' ? true : false);
  };

  Editor.setMode = function (i, mode) {
    var ctx = currentRoutine();
    if (!ctx || !ctx.r || !ctx.r.exercises || !ctx.r.exercises[i]) return;
    var ex = ctx.r.exercises[i];
    ex.mode = (mode === 'timer') ? 'timer' : 'reps';
    if (ex.mode === 'timer' && !ex.duration) ex.duration = 45;
    if (ex.mode === 'reps' && !ex.reps) ex.reps = 10;
    commit(ctx);
  };

  Editor.move = function (i, delta) {
    var ctx = currentRoutine();
    if (!ctx || !ctx.r || !ctx.r.exercises) return;
    var exs = ctx.r.exercises;
    var j = i + delta;
    if (j < 0 || j >= exs.length) return;
    var tmp = exs[i]; exs[i] = exs[j]; exs[j] = tmp;
    commit(ctx);
  };

  // Lie / délie l'exercice i avec le suivant (superset)
  Editor.toggleSS = function (i) {
    var ctx = currentRoutine();
    if (!ctx || !ctx.r || !ctx.r.exercises) return;
    var exs = ctx.r.exercises;
    if (i >= exs.length - 1) return;
    var a = exs[i], b = exs[i + 1];

    if (a.ss && b.ss === a.ss) {
      // Délier : b (et la suite du groupe) quitte le groupe de a
      var g = a.ss;
      for (var k = i + 1; k < exs.length && exs[k].ss === g; k++) delete exs[k].ss;
    } else {
      // Lier : b rejoint le groupe de a (ou on en crée un)
      if (!a.ss) a.ss = 'ss' + Date.now() + Math.floor(Math.random() * 100);
      b.ss = a.ss;
    }
    // Un groupe partage le même nombre de séries (un tour = un passage sur tous)
    var mem = groupMembers(exs, i);
    if (mem.length > 1) {
      var s = parseInt(exs[mem[0]].sets, 10) || 3;
      mem.forEach(function (m) { exs[m].sets = s; });
    }
    commit(ctx);
    if (typeof window.showToast === 'function') {
      window.showToast(a.ss && b.ss === a.ss ? '⚡ Superset créé' : 'Superset défait', 'success', 1600);
    }
  };

  window.AwakRoutineEditor = Editor;

  // ═══════════════════════════════════════════════════════════════════
  // 2. MOTEUR DE SUPERSET (alternage réel A → B → repos → A → B …)
  // ═══════════════════════════════════════════════════════════════════
  var SS = { st: null };

  // Accès aux variables internes du lecteur de séance (voir AwakSSBridge dans app.js)
  function B() { return window.AwakSSBridge || null; }

  // Appelé au démarrage d'un exercice : arme le groupe si besoin.
  SS.sync = function () {
    try {
      var b = B();
      if (!b) { SS.st = null; return; }
      var w = b.getWorkout();
      if (!w || !w.exercises) { SS.st = null; return; }
      var i = b.getExIdx();
      var ex = w.exercises[i];
      if (!ex || !ex.ss) { SS.st = null; return; }

      var mem = groupMembers(w.exercises, i);
      if (mem.length < 2) { SS.st = null; return; }

      // Nouveau groupe (ou groupe différent) → on repart au tour 1
      if (!SS.st || SS.st.g !== ex.ss) {
        SS.st = { g: ex.ss, members: mem, round: 1, total: parseInt(ex.sets, 10) || 3 };
      } else {
        SS.st.members = mem;
      }
      // Réinjecte le numéro de tour (initSetsTracker vient de le remettre à 1)
      if (SS.st.round > 1) {
        b.setSetNum(SS.st.round);
        b.updateSetIndicator();
      }
      SS.banner();
    } catch (e) { SS.st = null; }
  };

  SS.isActive = function () {
    var b = B();
    if (!b || !SS.st) return false;
    var w = b.getWorkout();
    if (!w || !w.exercises) return false;
    var ex = w.exercises[b.getExIdx()];
    return !!(ex && ex.ss === SS.st.g);
  };

  // Bandeau « SUPERSET A/B » au-dessus de l'exercice
  SS.banner = function () {
    try {
      var host = document.getElementById('exerciseName');
      if (!host || !SS.st) return;
      var old = document.getElementById('awakSSBanner');
      if (old) old.remove();
      var b = B(); if (!b) return;
      var pos = SS.st.members.indexOf(b.getExIdx());
      if (pos < 0) return;
      var suivant = SS.st.members[pos + 1];
      var w = b.getWorkout();
      var nomSuivant = (suivant !== undefined && w.exercises[suivant]) ? w.exercises[suivant].name : null;

      var el = document.createElement('div');
      el.id = 'awakSSBanner';
      el.style.cssText = 'background:rgba(251,146,60,0.12);border:1px solid rgba(251,146,60,0.4);' +
        'border-radius:10px;padding:7px 11px;margin-bottom:8px;text-align:center;';
      el.innerHTML =
        '<div style="font-size:0.62em;color:#fb923c;font-weight:900;letter-spacing:1.5px;">' +
          '⚡ SUPERSET · ' + (LETTRES[pos] || '•') + ' sur ' + SS.st.members.length +
          ' · TOUR ' + SS.st.round + '/' + SS.st.total + '</div>' +
        (nomSuivant
          ? '<div style="font-size:0.66em;color:#94a3b8;margin-top:2px;">enchaîne sans repos → ' + esc(nomSuivant) + '</div>'
          : '<div style="font-size:0.66em;color:#94a3b8;margin-top:2px;">dernier du tour — repos après</div>');
      host.parentNode.insertBefore(el, host);
    } catch (e) {}
  };

  SS.clearBanner = function () {
    var el = document.getElementById('awakSSBanner');
    if (el) el.remove();
  };

  // Bascule vers un autre membre du groupe en conservant le tour.
  function goTo(idx, round) {
    var b = B(); if (!b) return;
    SS.st.round = round;
    b.setExIdx(idx);
    b.startExercise();
    // startExercise → initSetsTracker a remis le compteur à 1 : on rétablit le tour
    b.setSetNum(round);
    b.updateSetIndicator();
    SS.sync();
  }

  // Appelé par completeCurrentSet APRÈS l'incrément de currentSetNumber.
  // Retourne true si le module a pris la main sur la suite.
  SS.afterSet = function () {
    if (!SS.isActive()) return false;
    var b = B(); if (!b) return false;
    var st = SS.st;
    var pos = st.members.indexOf(b.getExIdx());
    if (pos < 0) return false;

    // Encore un exercice dans le tour → on enchaîne SANS repos
    if (pos < st.members.length - 1) {
      var suivant = st.members[pos + 1];
      if (typeof window.showToast === 'function') {
        window.showToast('⚡ Enchaîne — pas de repos !', 'info', 1600);
      }
      b.vibrate([40, 30, 40]);
      setTimeout(function () { goTo(suivant, st.round); }, 350);
      return true;
    }

    // Fin du tour
    var prochain = st.round + 1;
    if (prochain > st.total) {
      // Superset terminé → on sort par la voie normale (exercice suivant)
      SS.st = null;
      SS.clearBanner();
      if (typeof window.showToast === 'function') {
        window.showToast('✅ Superset terminé !', 'success', 2000);
      }
      b.setExIdx(st.members[st.members.length - 1]);
      setTimeout(function () { b.skipExercise(); }, 700);
      return true;
    }

    // Tour suivant : retour au premier exercice, AVEC repos
    var premier = st.members[0];
    var repos = 60;
    try {
      var w = b.getWorkout();
      var exA = w.exercises[premier];
      repos = (exA && exA.rest) || w.restBetweenSets || b.globalRest() || 60;
    } catch (e) { repos = 60; }

    setTimeout(function () {
      goTo(premier, prochain);
      b.startSetRest(repos);
    }, 350);
    return true;
  };

  window.AwakSS = SS;
})();
