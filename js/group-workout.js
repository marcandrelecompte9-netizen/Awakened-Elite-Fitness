/* ═══════════════════════════════════════════════════════════════════
   SÉANCE À PLUSIEURS — plusieurs personnes s'entraînent ensemble
   ───────────────────────────────────────────────────────────────────
   Étape 1 (fondation) : choisir les PARTICIPANTS d'une séance.
   Un participant est soit un PROFIL de l'app (ses stats pourront être
   enregistrées chez lui), soit un INVITÉ non inscrit (juste suivi le temps
   de la séance, aucun stockage).
   La saisie multi-colonnes et la répartition sur les profils viendront à
   l'étape suivante.
   État en mémoire + persistance légère dans la clé de séance active.
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  // Rend un avatar : les avatars modernes sont des clés « av:… » qui doivent
  // passer par renderAvatar() pour devenir un SVG. Sans ça, la clé s'affichait
  // en texte brut (« av:… ») devant le nom. Défini en tête du module pour être
  // visible par TOUTES les fonctions (leçon v623).
  function _av(a, size) {
    size = size || 26;
    try {
      if (typeof window.renderAvatar === 'function') return window.renderAvatar(a, size);
    } catch (e) { _awkE(e); }
    return '<span style="font-size:' + Math.round(size * 0.62) + 'px;">' +
           String(a == null ? '\u{1F464}' : a).replace(/[&<>"]/g, function (c) {
             return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }) + '</span>';
  }

  var STORE_KEY = 'awakGroupParticipants';   // participants de la séance en cours
  var SETS_KEY  = 'awakGroupSets';           // séries saisies par participant

  // ── Séries par participant ─────────────────────────────────────────
  // Structure : { participantId: { exerciseName: [ {set,reps,weight,warmup,ts} ] } }
  // Le MENEUR (self) n'est PAS stocké ici : ses séries suivent le flux normal
  // (_currentSessionSets). Ici on ne garde que les AUTRES participants.
  function loadSets() {
    try {
      var raw = localStorage.getItem(SETS_KEY);
      if (!raw) return {};
      var o = JSON.parse(raw);
      return (o && typeof o === 'object') ? o : {};
    } catch (e) { return {}; }
  }
  function saveSets(o) {
    try { localStorage.setItem(SETS_KEY, JSON.stringify(o || {})); return true; }
    catch (e) { return false; }
  }
  function clearSets() { try { localStorage.removeItem(SETS_KEY); } catch (e) { _awkE(e); } }

  // Enregistrer une série pour un participant sur un exercice.
  function logSet(participantId, exerciseName, setNum, reps, weight, isWarmup) {
    var all = loadSets();
    if (!all[participantId]) all[participantId] = {};
    if (!all[participantId][exerciseName]) all[participantId][exerciseName] = [];
    all[participantId][exerciseName].push({
      set: setNum, reps: reps || 0, weight: weight || 0, warmup: !!isWarmup, ts: Date.now()
    });
    saveSets(all);
  }

  function getParticipantSets(participantId) {
    var all = loadSets();
    return all[participantId] || {};
  }


  // Participant : { kind:'profile'|'guest', id, name, avatar }
  // Pour un profil, id = profileId. Pour un invité, id = 'guest_<n>'.

  function _profiles() {
    try { if (typeof window.getAllProfiles === 'function') return window.getAllProfiles() || []; } catch (e) { _awkE(e); }
    return [];
  }
  function _currentId() {
    try { if (typeof window.getCurrentProfileId === 'function') return window.getCurrentProfileId(); } catch (e) { _awkE(e); }
    try { return localStorage.getItem('currentProfileId'); } catch (e) { _awkE(e); }
    return null;
  }

  function load() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (!raw) return null;
      var s = JSON.parse(raw);
      return (s && Array.isArray(s.participants)) ? s : null;
    } catch (e) { return null; }
  }
  function save(list) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify({ participants: list, startedAt: Date.now() })); return true; }
    catch (e) { return false; }
  }
  function clear() { try { localStorage.removeItem(STORE_KEY); } catch (e) { _awkE(e); } }

  // La liste inclut TOUJOURS le profil actif en premier (le "meneur").
  function getParticipants() {
    var s = load();
    if (s && s.participants.length) {
      // v1606 : profil supprimé → retiré ; nom / avatar à jour (profil renommé)
      var profs = _profiles(), parId = {};
      profs.forEach(function (p) { parId[p.id] = p; });
      return s.participants.filter(function (p) { return p.self || p.kind !== 'profile' || parId[p.id]; }).map(function (p) {
        if (p.self || p.kind !== 'profile') return p;
        var q = parId[p.id];
        return { kind: 'profile', id: p.id, name: q.name || p.name, avatar: q.avatar || p.avatar };
      });
    }
    return [_selfParticipant()];
  }

  function _selfParticipant() {
    var id = _currentId();
    var all = _profiles();
    var me = null;
    for (var i = 0; i < all.length; i++) if (all[i].id === id) { me = all[i]; break; }
    return {
      kind: 'profile',
      id: id || 'self',
      name: me ? (me.name || 'Moi') : 'Moi',
      avatar: me ? (me.avatar || '🙂') : '🙂',
      self: true
    };
  }

  function isActive() {
    // v1604 : en mode duo, « à plusieurs » seulement si le duo tourne (pas « Solo cette fois »)
    try { if (window.AwakDuo && AwakDuo.mode() === 'duo') return AwakDuo.actif(); } catch (e) { _awkE(e); }
    var p = getParticipants();
    return p.length > 1;   // à plusieurs seulement si ≥2 participants
  }

  function count() { return getParticipants().length; }

  // Définir la liste complète (le self est ré-injecté en tête si absent).
  function setParticipants(list) {
    var self = _selfParticipant();
    var others = (list || []).filter(function (p) { return p && p.id !== self.id; });
    var full = [self].concat(others);
    save(full);
    return full;
  }

  // Profils de l'app pas encore participants (hors self).
  function availableProfiles() {
    var chosen = {};
    getParticipants().forEach(function (p) { chosen[p.id] = true; });
    return _profiles().filter(function (p) { return !chosen[p.id]; })
      .map(function (p) { return { kind: 'profile', id: p.id, name: p.name || 'Membre', avatar: p.avatar || '🙂' }; });
  }

  var _guestSeq = 0;
  function addGuest(name) {
    var list = getParticipants().slice();
    _guestSeq++;
    var g = { kind: 'guest', id: 'guest_' + Date.now() + '_' + _guestSeq, name: (name || 'Invité').trim() || 'Invité', avatar: '👤' };
    list.push(g);
    save(list);
    return g;
  }
  function addProfile(profileId) {
    var all = _profiles();
    var prof = null;
    for (var i = 0; i < all.length; i++) if (all[i].id === profileId) { prof = all[i]; break; }
    if (!prof) return null;
    var list = getParticipants().slice();
    if (list.some(function (p) { return p.id === profileId; })) return null;   // déjà là
    var entry = { kind: 'profile', id: prof.id, name: prof.name || 'Membre', avatar: prof.avatar || '🙂' };
    list.push(entry);
    save(list);
    return entry;
  }
  function removeParticipant(id) {
    var self = _selfParticipant();
    if (id === self.id) return false;   // on ne retire pas le meneur
    var list = getParticipants().filter(function (p) { return p.id !== id; });
    save(list);
    return true;
  }

  // v1603 : fin de séance — en duo, on GARDE le partenaire et sa séance (prochaine fois prête)
  function finSeance() {
    try {
      if (window.AwakDuo && AwakDuo.mode() === 'duo' && AwakDuo.lire()) {
        clearSets(); _promptedExercises = {}; AwakDuo.nouvelleSeance(); AwakDuo.setSolo(false); return;
      }
    } catch (e) { _awkE(e); }
    reset();
  }
  function enSeance() { try { return document.body.classList.contains('in-session'); } catch (e) { return false; } }
  function bloqueEnSeance() {
    if (!enSeance()) return false;
    try { if (window.showToast) showToast('Séance en cours : change le duo après la séance', 'info', 2600); } catch (e) { _awkE(e); }
    return true;
  }
  function reset() { clear(); clearSets(); _promptedExercises = {}; try { if (window.AwakDuo) { AwakDuo.oublier(); AwakDuo.setSolo(false); } } catch (e) { _awkE(e); } }
  // v1312 : nouvelle séance → on garde les participants, mais on oublie les séries
  // d'une séance précédente abandonnée (elles se retrouvaient dans la suivante).
  function nouvelleSeance() { clearSets(); _promptedExercises = {}; try { if (window.AwakDuo) AwakDuo.nouvelleSeance(); } catch (e) { _awkE(e); } }
  // v1601 (duo) : annuler la dernière série d'un participant sur un exercice
  function retirerDerniere(pid, exerciseName, warmup) {
    var all = loadSets();
    var l = all[pid] && all[pid][exerciseName];
    if (!l || !l.length) return;
    // v1606 : retirer la dernière série DU BON TYPE (avant : un échauffement fait après
    // S1 était retiré à la place de S1, qui restait enregistrée)
    for (var k = l.length - 1; k >= 0; k--) if (!!l[k].warmup === !!warmup) { l.splice(k, 1); break; }
    if (!l.length) delete all[pid][exerciseName];
    saveSets(all);
  }

  // ── Panneau de saisie « autres participants » ──────────────────────
  // Affiché après que le meneur a validé SA série. Chaque autre participant
  // saisit ses reps/poids pour CETTE série (mêmes exercices pour tous).
  // Garde : on ne montre le panneau qu'UNE fois par exercice (le participant y
  // saisit toutes ses séries d'un coup, indépendamment du nombre de séries du
  // meneur). Réinitialisé à chaque nouvelle séance (reset).
  var _promptedExercises = {};
  function promptOthersForSet(exerciseName, setNum, isWarmup) {
    // v1312 : seuls les PROFILS saisissent leurs séries (celles des invités
    // n'étaient enregistrées nulle part : on leur faisait remplir des cases pour rien)
    var others = getParticipants().filter(function (p) { return !p.self && p.kind === 'profile'; });
    if (!others.length) return;   // solo malgré tout
    try { if (window.AwakDuo && AwakDuo.actif()) return; } catch (e) { _awkE(e); }   // v1601 : en duo, le partenaire a son propre carnet
    // déjà demandé pour cet exercice ? on ne redemande pas.
    if (_promptedExercises[exerciseName]) return;
    if (document.getElementById('awakGroupSetModal')) return;   // déjà ouvert
    _promptedExercises[exerciseName] = true;

    // Chaque participant a un bloc avec 1+ lignes de séries (reps + poids en lb).
    // Un bouton « + série » ajoute une ligne pour ce participant.
    var blocks = others.map(function (p) {
      return '<div style="margin-bottom:12px;padding:11px;border-radius:12px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);">'
        + '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">'
        +   _av(p.avatar, 24)
        +   '<span style="flex:1;min-width:0;font-size:0.84em;font-weight:800;color:#fff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + esc(p.name) + '</span>'
        + '</div>'
        + '<div id="grpRows_' + p.id + '">'
        +   _setRowHtml(p.id, 1)
        + '</div>'
        + '<button onclick="AwakGroupAddRow(\'' + p.id + '\')" style="width:100%;margin-top:4px;padding:7px;border:1px dashed rgba(34,211,238,0.4);border-radius:9px;cursor:pointer;background:rgba(34,211,238,0.05);color:#67e8f9;font-size:0.74em;font-weight:700;">+ série</button>'
        + '</div>';
    }).join('');

    var overlay = document.createElement('div');
    overlay.id = 'awakGroupSetModal';
    // champs : bordure neutre, cyan au focus (pas de vert)
    if (!document.getElementById('awakGroupSetCss')) { var st = document.createElement('style'); st.id = 'awakGroupSetCss';
      st.textContent = '#awakGroupSetModal input{border:1px solid rgba(255,255,255,0.14) !important;box-shadow:none !important;}#awakGroupSetModal input:focus{border-color:#22d3ee !important;outline:none !important;}';
      document.head.appendChild(st); }
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.8);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);z-index:99998;display:flex;align-items:flex-end;justify-content:center;padding:0;';
    overlay.innerHTML = '<div style="background:linear-gradient(160deg,#16121f,#0d0d12);border-top:1px solid rgba(34,211,238,0.35);border-radius:22px 22px 0 0;padding:20px;max-width:460px;width:100%;max-height:85vh;overflow-y:auto;box-shadow:0 -8px 40px rgba(0,0,0,0.6);">'
      + '<div style="display:flex;align-items:center;gap:9px;margin-bottom:5px;">'
      +   '<span style="flex-shrink:0;width:38px;height:38px;border-radius:11px;display:flex;align-items:center;justify-content:center;background:rgba(34,211,238,0.14);border:1px solid rgba(103,232,249,0.35);">' + _ico('groupe', 20, '#a5f3fc') + '</span>'
      +   '<div style="flex:1;"><div style="font-size:0.6em;color:#67e8f9;font-weight:800;letter-spacing:0.5px;">SÉANCE À PLUSIEURS' + (isWarmup ? ' · ÉCHAUFFEMENT' : '') + '</div>'
      +   '<div style="font-size:0.98em;font-weight:900;color:#fff;">' + esc(exerciseName) + '</div></div>'
      + '</div>'
      + '<div style="font-size:0.72em;color:#94a3b8;margin-bottom:14px;">Saisis les séries de chacun (répétitions + poids en ' + ((typeof useKg !== 'undefined' && useKg) ? 'kg' : 'lb') + '). « + série » pour en ajouter. Laisse vide pour passer.</div>'
      + blocks
      + '<button onclick="AwakGroupSaveSet(\'' + encodeURIComponent(exerciseName) + '\',' + setNum + ',' + (isWarmup ? 'true' : 'false') + ')" style="width:100%;margin-top:8px;padding:13px;border:1px solid rgba(103,232,249,0.34);border-radius:12px;cursor:pointer;background:linear-gradient(135deg,#0891b2,#0e7490);color:#fff;font-weight:800;font-size:0.9em;">Valider et continuer</button>'
      + '<button onclick="AwakGroupSkipSet()" style="width:100%;margin-top:8px;padding:10px;border:none;border-radius:10px;cursor:pointer;background:transparent;color:#8391a7;font-size:0.8em;">Passer</button>'
      + '</div>';
    document.body.appendChild(overlay);
    setTimeout(function () {
      var first = document.getElementById('grpReps_' + others[0].id + '_1');
      if (first) first.focus();
    }, 100);
  }

  // Une ligne de saisie (reps + poids en lb) pour un participant, index de ligne.
  function _setRowHtml(pid, rowIdx) {
    return '<div style="display:flex;align-items:center;gap:7px;margin-bottom:6px;" data-grprow="' + pid + '">'
      + '<span style="font-size:0.7em;color:#8391a7;width:38px;flex-shrink:0;">Série ' + rowIdx + '</span>'
      + '<input id="grpReps_' + pid + '_' + rowIdx + '" type="number" inputmode="numeric" placeholder="reps" style="flex:1;min-width:0;padding:8px 6px;border-radius:9px;border:1px solid rgba(255,255,255,0.14);background:rgba(255,255,255,0.05);color:#fff;font-size:0.82em;text-align:center;">'
      + '<input id="grpWeight_' + pid + '_' + rowIdx + '" type="number" inputmode="decimal" placeholder="' + ((typeof useKg !== 'undefined' && useKg) ? 'kg' : 'lb') + '" style="flex:1;min-width:0;padding:8px 6px;border-radius:9px;border:1px solid rgba(255,255,255,0.14);background:rgba(255,255,255,0.05);color:#fff;font-size:0.82em;text-align:center;">'
      + '</div>';
  }

  // Compteur de lignes par participant (pour la session de saisie en cours).
  var _rowCounts = {};
  window.AwakGroupAddRow = function (pid) {
    var container = document.getElementById('grpRows_' + pid);
    if (!container) return;
    var current = container.querySelectorAll('[data-grprow]').length;
    var next = current + 1;
    container.insertAdjacentHTML('beforeend', _setRowHtml(pid, next));
    var el = document.getElementById('grpReps_' + pid + '_' + next);
    if (el) el.focus();
  };

  window.AwakGroupSaveSet = function (exEnc, setNum, isWarmup) {
    var exerciseName = decodeURIComponent(exEnc);
    var others = getParticipants().filter(function (p) { return !p.self; });
    // L'app STOCKE les poids en kg mais les AFFICHE selon le réglage (lb par
    // défaut). On convertit donc la saisie (dans l'unité affichée) vers kg.
    var useKg = false;
    try { useKg = localStorage.getItem('fitproUseKg') === 'true'; } catch (e) { _awkE(e); }
    var toKg = function (v) { return useKg ? v : (v / 2.20462); };

    others.forEach(function (p) {
      var container = document.getElementById('grpRows_' + p.id);
      if (!container) return;
      var rows = container.querySelectorAll('[data-grprow]');
      var localSet = 0;
      rows.forEach(function (row, i) {
        var idx = i + 1;
        var r = document.getElementById('grpReps_' + p.id + '_' + idx);
        var w = document.getElementById('grpWeight_' + p.id + '_' + idx);
        var reps = r ? parseInt(r.value) : 0;
        var wDisp = w ? parseFloat(w.value) : 0;
        if (reps && reps > 0) {
          localSet++;
          var wKg = wDisp ? Math.round(toKg(wDisp) * 100) / 100 : 0;
          logSet(p.id, exerciseName, localSet, reps, wKg, isWarmup);
        }
      });
    });
    var el = document.getElementById('awakGroupSetModal'); if (el) el.remove();
  };
  window.AwakGroupSkipSet = function () {
    var el = document.getElementById('awakGroupSetModal'); if (el) el.remove();
  };

  // ── Finalisation : enregistrer la séance chez chaque participant profilé ─
  // buildWorkoutFor(participant, templateWorkout) → objet workout prêt à
  // enregistrer, ou null si le participant n'a saisi aucune série.
  function buildWorkoutForParticipant(participantId, templateWorkout) {
    // v1601 : en duo, le partenaire suit SA séance → son gabarit
    try { if (window.AwakDuo && AwakDuo.actif() && AwakDuo.pid() === participantId) templateWorkout = AwakDuo.gabarit() || templateWorkout; } catch (e) { _awkE(e); }
    var sets = getParticipantSets(participantId);
    var exNames = Object.keys(sets);
    if (!exNames.length) return null;
    // Reconstruire une liste d'exercices à partir du template, en n'incluant
    // que ceux où le participant a des séries, avec ses reps/poids.
    var exercises = [];
    (templateWorkout && templateWorkout.exercises ? templateWorkout.exercises : []).forEach(function (ex) {
      var base = ex._baseName || ex.name;
      if (sets[base] && sets[base].length) {
        exercises.push({
          name: ex.name,
          _baseName: base,
          muscle: ex.muscle,
          equipment: ex.equipment,
          completedSets: sets[base].map(function (s) {
            return { reps: s.reps, weight: s.weight, warmup: s.warmup, set: s.set };
          })
        });
      }
    });
    if (!exercises.length) return null;
    // v1607 : seulement des échauffements → rien à enregistrer
    if (!exercises.some(function (e) { return e.completedSets.some(function (x) { return !x.warmup; }); })) return null;
    var _sp = (templateWorkout && templateWorkout._salleProg) ? { _salleProg: templateWorkout._salleProg, _salleJour: templateWorkout._salleJour } : {};
    return {
      _salleProg: _sp._salleProg, _salleJour: _sp._salleJour,
      name: (templateWorkout && templateWorkout.name ? templateWorkout.name : 'Séance') + (/\(en duo\)$/.test((templateWorkout && templateWorkout.name) || '') ? '' : ' (en groupe)'),
      exercises: exercises,
      _fromGroup: true
    };
  }

  // Liste des participants PROFILÉS (hors self) ayant saisi des séries.
  function profiledContributors() {
    var all = loadSets();
    return getParticipants().filter(function (p) {
      return !p.self && p.kind === 'profile' && all[p.id] && Object.keys(all[p.id]).length;
    });
  }

  window.AwakGroup = {
    getParticipants: getParticipants,
    setParticipants: setParticipants,
    availableProfiles: availableProfiles,
    addGuest: addGuest,
    addProfile: addProfile,
    removeParticipant: removeParticipant,
    isActive: isActive,
    count: count,
    reset: reset,
    nouvelleSeance: nouvelleSeance,
    logSet: logSet,
    getParticipantSets: getParticipantSets,
    promptOthersForSet: promptOthersForSet,
    buildWorkoutForParticipant: buildWorkoutForParticipant,
    profiledContributors: profiledContributors,
    retirerDerniere: retirerDerniere,
    finSeance: finSeance,
    gabaritPour: function (pid, w) { try { if (window.AwakDuo && AwakDuo.actif() && AwakDuo.pid() === pid) return AwakDuo.gabarit() || w; } catch (e) { _awkE(e); } return w; },
    _self: _selfParticipant
  };

  // ═══════════════════════════════════════════════════════════════════
  // INTERFACE
  // ═══════════════════════════════════════════════════════════════════
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  // Bouton accueil : n'apparaît que s'il existe ≥2 profils OU si une séance
  // de groupe est déjà en préparation (permet aussi d'inviter des non-inscrits).
  function renderHomeButton() {
    var nb = count();
    var label = nb > 1 ? (nb + ' participants') : 'Séance à plusieurs';
    var sub = nb > 1 ? 'Prêt · appuie pour gérer' : 'Ajoute des membres ou des invités';
    try {
      if (window.AwakDuo && AwakDuo.actif()) { var d = AwakDuo.lire(); label = 'Duo avec ' + d.nom; sub = 'Sa séance : ' + d.nomSeance + ' · lance la tienne'; }
      else if (window.AwakDuo && AwakDuo.mode() === 'duo' && nb > 1) { sub = 'Choisis la séance de ton partenaire'; }
    } catch (e) { _awkE(e); }
    return '<button onclick="AwakGroupOpen()" style="'
      + 'width:100%;margin:8px 0 14px;background:linear-gradient(135deg,rgba(34,211,238,0.13) 0%,rgba(8,145,178,0.09) 100%);color:white;border:1px solid rgba(103,232,249,0.34);'
      + 'border-radius:14px;padding:13px 16px;font-size:0.95em;font-weight:800;cursor:pointer;'
      + 'box-shadow:0 4px 18px rgba(34,211,238,0.3);position:relative;overflow:hidden;'
      + 'text-align:left;display:flex;align-items:center;gap:11px;">'
      + '<div style="flex-shrink:0;width:40px;height:40px;border-radius:12px;display:flex;align-items:center;justify-content:center;background:rgba(34,211,238,0.18);">' + _ico('groupe', 22, '#cffafe') + '</div>'
      + '<div style="flex:1;min-width:0;">'
      +   '<div style="font-size:0.6em;letter-spacing:2px;opacity:0.9;font-weight:700;">ENSEMBLE</div>'
      +   '<div style="font-size:0.95em;font-weight:900;line-height:1.2;margin-top:2px;">' + label + '</div>'
      +   '<div style="font-size:0.68em;opacity:0.85;margin-top:2px;">' + sub + '</div>'
      + '</div>'
      + '<div style="flex-shrink:0;color:#a5f3fc;font-size:1.3em;">›</div>'
      + '</button>';
  }


  function _ico(nom, t, c) {
    try { if (window.AwakIcon) return window.AwakIcon.get(nom, t, c); } catch (e) { _awkE(e); }
    return '';
  }
  var _PLUS = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>';
  var _CROIX = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';

  function _modalContent() {
    var parts = getParticipants();
    var avail = availableProfiles();
    var n = count();
    var duo = (window.AwakDuo && AwakDuo.mode() === 'duo');
    var partenaire = parts.filter(function (p) { return !p.self && p.kind === 'profile'; })[0] || null;
    if (duo && partenaire) avail = [];   // v1601 : duo = 2 personnes
    var titreSection = function (t) {
      return '<div style="font-size:0.62em;color:#67e8f9;font-weight:900;letter-spacing:1.4px;margin:16px 0 8px;">' + t + '</div>';
    };

    // ── Participants ──
    var partRows = parts.map(function (p) {
      var badge = p.kind === 'guest' ? 'Invité' : (p.self ? 'Toi' : 'Profil');
      var badgeCoul = p.kind === 'guest' ? '#fbbf24' : (p.self ? '#67e8f9' : '#60a8f0');
      var rm = p.self ? '' :
        '<button onclick="AwakGroupRemove(\'' + p.id + '\')" aria-label="Retirer" style="flex-shrink:0;width:34px;height:34px;min-height:auto;padding:0;display:inline-flex;align-items:center;justify-content:center;background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.25);color:#f87171;border-radius:10px;cursor:pointer;">' + _CROIX + '</button>';
      return '<div style="display:flex;align-items:center;gap:11px;padding:9px 10px;margin-bottom:6px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:12px;">'
        + _av(p.avatar, 34)
        + '<div style="flex:1;min-width:0;"><div style="font-size:0.9em;font-weight:800;color:#fff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + esc(p.name) + '</div>'
        + '<div style="font-size:0.66em;font-weight:800;color:' + badgeCoul + ';letter-spacing:0.4px;">' + badge + '</div></div>'
        + rm + '</div>';
    }).join('');

    // ── Profils à ajouter : grille 2 colonnes ──
    var availBlock = '';
    if (avail.length) {
      var tuiles = avail.map(function (p) {
        return '<button onclick="AwakGroupAddProfile(\'' + p.id + '\')" style="display:flex;align-items:center;gap:8px;width:100%;min-width:0;min-height:auto;padding:8px 10px;border:1px dashed rgba(103,232,249,0.35);border-radius:12px;cursor:pointer;background:rgba(34,211,238,0.05);color:#e2e8f0;font-size:0.8em;font-weight:800;text-align:left;">'
          + _av(p.avatar, 26)
          + '<span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + esc(p.name) + '</span>'
          + '<span style="color:#67e8f9;display:inline-flex;flex-shrink:0;">' + _PLUS + '</span></button>';
      }).join('');
      availBlock = titreSection(duo ? 'CHOISIS TON PARTENAIRE' : 'AJOUTER UN PROFIL')
        + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:7px;">' + tuiles + '</div>';
    } else if (duo && !partenaire) {
      availBlock = '<div style="margin-top:12px;font-size:0.76em;color:#a3b1c2;line-height:1.45;">Il faut un deuxième profil sur ce téléphone pour s\'entraîner en duo.</div>';
    }

    // v1601 : sélecteur de mode + séance du partenaire
    var segMode = function (m, t, sous) {
      var on = (m === 'duo') === duo;
      return '<button onclick="AwakGroupMode(\'' + m + '\')" style="flex:1;min-width:0;min-height:auto;padding:9px 8px;border-radius:11px;cursor:pointer;text-align:center;'
        + (on ? 'background:rgba(34,211,238,0.14);border:1.5px solid rgba(34,211,238,0.6);color:#fff;' : 'background:rgba(255,255,255,0.03);border:1.5px solid rgba(255,255,255,0.08);color:#a3b1c2;') + '">'
        + '<div style="font-size:0.82em;font-weight:900;">' + t + '</div><div style="font-size:0.62em;font-weight:700;opacity:0.8;margin-top:1px;">' + sous + '</div></button>';
    };
    var modeBlock = '<div style="display:flex;gap:7px;margin-top:14px;">' + segMode('meme', 'Même séance', 'tout le monde pareil') + segMode('duo', 'Chacun sa séance', 'à deux, ta séance + la sienne') + '</div>';
    var duoBlock = '';
    if (duo && partenaire) {
      var d = AwakDuo.lire();
      var choisi = d && d.pid === partenaire.id ? d : null;
      var ligne = function (r, source) {
        var on = choisi && String(choisi.routineId) === String(r.id) && choisi.source === source;
        var nb = (r.exercises || []).length;
        var db = window.exerciseDatabase || [];
        var nbBl = (r.exercises || []).filter(function (e) {
          var f = null; for (var k = 0; k < db.length; k++) if (db[k].name === e.name) { f = db[k]; break; }
          try { return AwakDuo.bloque(partenaire.id, f || e); } catch (x) { return false; }
        }).length;
        return '<button onclick="AwakGroupDuoChoisir(\'' + source + '\',decodeURIComponent(\'' + encodeURIComponent(String(r.id)).replace(/'/g, '%27') + '\'))" style="display:flex;align-items:center;gap:9px;width:100%;min-height:auto;padding:10px 11px;margin-bottom:6px;border-radius:11px;cursor:pointer;text-align:left;'
          + (on ? 'background:rgba(34,211,238,0.12);border:1.5px solid rgba(34,211,238,0.6);' : 'background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);') + '">'
          + '<span style="flex:1;min-width:0;"><span style="display:block;font-size:0.84em;font-weight:800;color:#fff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + esc(r.name || 'Routine') + '</span>'
          + '<span style="display:block;font-size:0.66em;color:#8391a7;font-weight:700;">' + (source === 'prog' ? 'Prochaine séance de son programme · ' : source === 'star' ? 'Séance du jour de son mentor · ' : '') + nb + ' exercice' + (nb > 1 ? 's' : '')
          + (nbBl ? ' · <span style="color:#fbbf24;">' + nbBl + ' déconseillé' + (nbBl > 1 ? 's' : '') + ' pour ' + esc(partenaire.name) + '</span>' : '') + '</span></span>'
          + (on ? '<span style="color:#22d3ee;display:inline-flex;"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L19 7"/></svg></span>' : '')
          + '</button>';
      };
      var verrou = enSeance();
      var prog = AwakDuo.progDe(partenaire.id);
      var star = AwakDuo.starDe(partenaire.id);
      var siennes = AwakDuo.routinesDe(partenaire.id).filter(function (r) { return r && r.exercises && r.exercises.length; });
      var miennes = AwakDuo.mesRoutines().filter(function (r) { return r && r.exercises && r.exercises.length; });
      duoBlock = titreSection('SÉANCE DE ' + esc(partenaire.name).toUpperCase())
        + (verrou ? '<div style="font-size:0.72em;color:#fbbf24;margin-bottom:8px;">Séance en cours : la séance de ' + esc(partenaire.name) + ' se change après.</div>' : '')
        + (prog ? ligne({ id: 'prog', name: prog.nom, exercises: prog.exercises }, 'prog') : '')
        + (star && !star.repos ? ligne({ id: 'star', name: star.nom, exercises: star.exercises }, 'star') : '')
        + (star && star.repos ? '<div style="font-size:0.72em;color:#8391a7;margin-bottom:8px;">Son mentor : ' + esc(star.nom) + ' aujourd\'hui.</div>' : '')
        + (siennes.length ? siennes.map(function (r) { return ligne(r, 'lui'); }).join('')
                          : (prog || (star && !star.repos) ? '' : '<div style="font-size:0.74em;color:#8391a7;margin-bottom:8px;">' + esc(partenaire.name) + ' n\'a pas encore de routine.</div>'))
        + (miennes.length ? '<div style="font-size:0.6em;color:#8391a7;font-weight:900;letter-spacing:1.2px;margin:10px 0 6px;">OU UNE DE TES ROUTINES</div>' + miennes.map(function (r) { return ligne(r, 'moi'); }).join('') : '');
    }

    var champ = 'flex:1;min-width:0;box-sizing:border-box;height:44px;padding:0 12px !important;border-radius:11px;border:1px solid rgba(103,232,249,0.28) !important;background:rgba(255,255,255,0.04) !important;color:#fff;font-size:0.88em;';

    return '<div style="display:flex;align-items:center;gap:12px;">'
      +   '<div style="width:42px;height:42px;border-radius:12px;flex-shrink:0;display:flex;align-items:center;justify-content:center;background:rgba(34,211,238,0.14);border:1px solid rgba(103,232,249,0.35);">' + _ico('groupe', 22, '#a5f3fc') + '</div>'
      +   '<div style="flex:1;min-width:0;"><div style="font-size:0.6em;color:#67e8f9;font-weight:900;letter-spacing:1.4px;">SÉANCE À PLUSIEURS</div>'
      +   '<div style="font-size:1.12em;font-weight:900;color:#fff;line-height:1.2;">Qui participe ?</div></div>'
      +   '<button onclick="AwakGroupClose()" aria-label="Fermer" style="flex-shrink:0;width:36px;height:36px;min-height:auto;padding:0;display:inline-flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.12);color:#94a3b8;border-radius:10px;cursor:pointer;">' + _CROIX + '</button>'
      + '</div>'
      + modeBlock
      + titreSection('PARTICIPANTS · ' + n)
      + partRows
      + availBlock
      + duoBlock
      + (duo ? '<div style="font-size:0.68em;color:#8391a7;margin-top:14px;line-height:1.45;">Lance ta séance comme d\'habitude. Un onglet au nom de ton partenaire apparaît en haut : il y suit sa séance, ses séries et son repos. Chacun la retrouve dans son historique.</div>' : '')
      + (duo ? '' : titreSection('INVITER UNE PERSONNE NON INSCRITE')
      + '<div style="display:flex;gap:7px;align-items:center;">'
      +   '<input id="awakGuestName" type="text" placeholder="Prénom de l\'invité" onkeydown="if(event.key===\'Enter\')AwakGroupAddGuest()" style="' + champ + '">'
      +   '<button onclick="AwakGroupAddGuest()" aria-label="Ajouter l\'invité" style="flex-shrink:0;width:44px;height:44px;min-height:auto;padding:0;display:inline-flex;align-items:center;justify-content:center;border:1px solid rgba(103,232,249,0.4);border-radius:11px;cursor:pointer;background:rgba(34,211,238,0.18);color:#cffafe;">' + _PLUS + '</button>'
      + '</div>'
      + '<div style="font-size:0.68em;color:#8391a7;margin-top:14px;line-height:1.45;">Chaque profil saisit ses propres séries et garde la séance dans son historique. Les invités s\'entraînent avec vous : rien n\'est enregistré pour eux.</div>')
      + '<div style="display:flex;gap:8px;margin-top:16px;">'
      +   (n > 1 ? '<button onclick="AwakGroupReset()" style="flex:1;min-height:auto;padding:12px 8px;border:1px solid rgba(255,255,255,0.1);border-radius:12px;cursor:pointer;background:rgba(255,255,255,0.04);color:#94a3b8;font-weight:800;font-size:0.82em;">Repasser en solo</button>' : '')
      +   '<button onclick="AwakGroupClose()" style="flex:2;min-height:auto;padding:12px 8px;border:none;border-radius:12px;cursor:pointer;background:linear-gradient(135deg,#0891b2,#0e7490);color:#fff;font-weight:900;font-size:0.9em;box-shadow:0 4px 16px rgba(34,211,238,0.35);">' + (duo && partenaire ? ((window.AwakDuo && AwakDuo.actif()) ? 'Valider · Duo avec ' + esc(partenaire.name) : 'Fermer') : (n > 1 ? 'Valider · ' + n + ' participants' : 'Fermer')) + '</button>'
      + '</div>';
  }

  function _renderModal() {
    var existing = document.getElementById('awakGroupModal');
    if (existing) { existing.querySelector('.awak-group-card').innerHTML = _modalContent(); return; }
    var overlay = document.createElement('div');
    overlay.id = 'awakGroupModal';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);z-index:99999;display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;';
    overlay.onclick = function (e) { if (e.target === overlay) AwakGroupClose(); };
    overlay.innerHTML = '<div class="awak-group-card" style="background:linear-gradient(160deg,#16121f,#0d0d12);border:1px solid rgba(34,211,238,0.3);border-radius:20px;padding:18px 16px !important;max-width:400px;width:100%;box-sizing:border-box;max-height:88vh;overflow-y:auto;overflow-x:hidden;box-shadow:0 8px 40px rgba(0,0,0,0.6);">'
      + _modalContent() + '</div>';
    document.body.appendChild(overlay);
  }

  window.AwakGroupOpen = function () { _renderModal(); };
  window.AwakGroupClose = function () { var el = document.getElementById('awakGroupModal'); if (el) el.remove();
    if (typeof window.updateHomeGroupButton === 'function') { try { window.updateHomeGroupButton(); } catch (e) { _awkE(e); } }
  };
  window.AwakGroupAddProfile = function (id) { addProfile(id); _renderModal(); };
  window.AwakGroupAddGuest = function () {
    var inp = document.getElementById('awakGuestName');
    var name = inp ? inp.value : '';
    if (!name || !name.trim()) { if (typeof window.showToast === 'function') window.showToast('Entre un prénom pour l\'invité', 'info', 2000); return; }
    addGuest(name); _renderModal();
  };
  window.AwakGroupRemove = function (id) { if (window.AwakDuo && AwakDuo.mode() === 'duo' && bloqueEnSeance()) return; removeParticipant(id); _renderModal(); };
  window.AwakGroupReset = function () { if (window.AwakDuo && AwakDuo.mode() === 'duo' && bloqueEnSeance()) return; reset(); _renderModal(); };
  // v1601 : mode « Même séance » / « Chacun sa séance » (duo = 2 profils, sans invité)
  window.AwakGroupMode = function (m) {
    if (bloqueEnSeance()) return;
    try { localStorage.setItem('awakGroupMode', m === 'duo' ? 'duo' : 'meme'); } catch (e) { _awkE(e); }
    if (m === 'duo') {
      var garde = null;
      var list = getParticipants().filter(function (p) {
        if (p.self) return true;
        if (p.kind !== 'profile' || garde) return false;
        garde = p; return true;
      });
      save(list);
    }
    _renderModal();
  };
  window.AwakGroupDuoChoisir = function (source, id) {
    if (bloqueEnSeance()) return;
    var p = getParticipants().filter(function (x) { return !x.self && x.kind === 'profile'; })[0];
    if (p && window.AwakDuo) AwakDuo.choisir(p.id, id, source);
    _renderModal();
  };

  window.AwakGroup.renderHomeButton = renderHomeButton;
})();
