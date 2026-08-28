/* ═══════════════════════════════════════════════════════════════════
   OBJECTIF FAMILIAL COMMUN — progresser ENSEMBLE vers un but partagé
   ───────────────────────────────────────────────────────────────────
   Toute la famille vise un objectif unique (ex : 50 séances ce mois-ci).
   Chaque membre y contribue avec ses propres séances ; une jauge se
   remplit avec la somme des contributions. Coopératif, pas compétitif :
   personne n'est classé, tout le monde pousse dans le même sens.
   Clé GLOBALE partagée « awakFamilyGoal » (hors GAME_KEYS, comme les
   défis et le boss familial) → visible par tous les profils de l'appareil.
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
    } catch (e) {}
    return '<span style="font-size:' + Math.round(size * 0.62) + 'px;">' +
           String(a == null ? '\u{1F464}' : a).replace(/[&<>"]/g, function (c) {
             return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }) + '</span>';
  }

  var GOAL_KEY = 'awakFamilyGoal';

  // Types d'objectif : métrique cumulée sur la fenêtre, tous membres confondus.
  var GOAL_TYPES = {
    sessions: {
      label: 'séances', emoji: '🔥', unit: '',
      metric: function (e) { return 1; },
      presets: [20, 40, 60]
    },
    volume: {
      label: 'kg soulevés', emoji: '🏋️', unit: ' kg',
      metric: function (e) { return (e && e.totalVolume) ? e.totalVolume : 0; },
      presets: [50000, 120000, 250000]
    },
    duration: {
      label: 'minutes', emoji: '⏱️', unit: ' min',
      metric: function (e) { return (e && e.duration) ? Math.round(e.duration / 60) : 0; },
      presets: [300, 600, 1200]
    },
    exercises: {
      label: 'exercices', emoji: '🎯', unit: '',
      metric: function (e) { return (e && Array.isArray(e.exercises)) ? e.exercises.length : 0; },
      presets: [100, 250, 500]
    }
  };

  function _load() {
    try { return JSON.parse(localStorage.getItem(GOAL_KEY) || 'null'); }
    catch (e) { return null; }
  }
  function _save(obj) {
    try {
      if (obj) localStorage.setItem(GOAL_KEY, JSON.stringify(obj));
      else localStorage.removeItem(GOAL_KEY);
    } catch (e) {}
  }

  function _currentId() {
    try { return (typeof window.getCurrentProfileId === 'function') ? window.getCurrentProfileId() : null; }
    catch (e) { return null; }
  }

  function _allProfiles() {
    try { return (typeof window.getAllProfiles === 'function') ? (window.getAllProfiles() || []) : []; }
    catch (e) { return []; }
  }

  function _history(profileId) {
    try {
      var raw = localStorage.getItem('profile_' + profileId + '_workoutHistory');
      if (!raw && profileId === _currentId()) raw = localStorage.getItem('workoutHistory');
      if (!raw) return [];
      var h = JSON.parse(raw);
      return Array.isArray(h) ? h : [];
    } catch (e) { return []; }
  }

  function _entryTs(e) {
    if (!e) return 0;
    if (e.date) { var t = Date.parse(e.date); if (t) return t; }
    return e.id || 0;
  }

  // Contribution d'un profil (métrique cumulée dans la fenêtre de l'objectif).
  function _contribution(profileId, type, startTs, endTs) {
    var def = GOAL_TYPES[type] || GOAL_TYPES.sessions;
    var total = 0;
    _history(profileId).forEach(function (e) {
      var ts = _entryTs(e);
      if (ts >= startTs && ts <= endTs) total += def.metric(e) || 0;
    });
    return Math.round(total);
  }

  // ── API ────────────────────────────────────────────────────────────

  function active() { return _load(); }
  function isActive() { var g = _load(); return !!(g && g.target > 0); }

  // Créer un objectif commun. duration en jours (défaut 30).
  function create(type, target, days) {
    if (!GOAL_TYPES[type] || !(target > 0)) return false;
    var now = Date.now();
    var span = (days && days > 0 ? days : 30) * 86400000;
    _save({
      type: type,
      target: target,
      startsAt: now,
      endsAt: now + span,
      createdBy: _currentId() || null,
      celebrated: false
    });
    return true;
  }

  function cancel() { _save(null); }


  // ══════════════════════════════════════════════════════════════════
  // 🏅 TITRES FAMILIAUX — la raison d'aller au bout
  // ------------------------------------------------------------------
  // Un objectif atteint ne laissait aucune trace : rien ne distinguait la
  // famille qui en a terminé 10 de celle qui n'en a jamais fini un.
  // On compte les objectifs accomplis (à vie) et on débloque des titres.
  // UN SEUL type de récompense volontairement : un titre, affiché sur la
  // carte. Pas de badges/cadres/monnaie parallèle tant qu'on ne sait pas
  // si les familles vont réellement au bout.
  // ══════════════════════════════════════════════════════════════════
  var DONE_KEY = 'awakFamilyGoalsDone';
  var TITRES = [
    { seuil: 1,  nom: 'Premier Élan',      emoji: '🌱' },
    { seuil: 3,  nom: 'Famille Éveillée',  emoji: '✨' },
    { seuil: 10, nom: 'Ancrage Commun',    emoji: '⚓' },
    { seuil: 25, nom: 'Force Collective',  emoji: '🔥' },
    { seuil: 50, nom: 'Lignée Inébranlable', emoji: '👑' }
  ];
  function goalsDone() {
    try { return parseInt(localStorage.getItem(DONE_KEY) || '0', 10) || 0; }
    catch (e) { return 0; }
  }
  function incrementGoalsDone() {
    var n = goalsDone() + 1;
    try { localStorage.setItem(DONE_KEY, String(n)); } catch (e) {}
    // 🏅 Badge « Cap tenu » — on réutilise CE compteur plutôt que d'en créer
    // un second : deux sources pour la même donnée finiraient par diverger.
    try {
      if (typeof window.AwakFamBadgeInc === 'function') {
        window.AwakFamBadgeInc('objectifsAtteints', 1);
      }
    } catch (e) {}
    return n;
  }
  // Titre actuel (le plus haut atteint) et le prochain à viser.
  function familyTitle() {
    var n = goalsDone();
    var actuel = null, suivant = null;
    TITRES.forEach(function (t) {
      if (n >= t.seuil) actuel = t;
      else if (!suivant) suivant = t;
    });
    return { done: n, actuel: actuel, suivant: suivant };
  }

  // État complet de l'objectif : total, par membre, %, jours restants.
  function status() {
    var g = _load();
    if (!g) return null;
    var def = GOAL_TYPES[g.type] || GOAL_TYPES.sessions;

    var perMember = [];
    var total = 0;
    _allProfiles().forEach(function (p) {
      var c = _contribution(p.id, g.type, g.startsAt, g.endsAt);
      if (c > 0) {
        perMember.push({ id: p.id, name: p.name || 'Membre', avatar: p.avatar || '🙂', value: c });
        total += c;
      }
    });
    perMember.sort(function (a, b) { return b.value - a.value; });

    var pct = Math.min(100, Math.round((total / g.target) * 100));
    var daysLeft = Math.max(0, Math.ceil((g.endsAt - Date.now()) / 86400000));
    var reached = total >= g.target;

    // Marquer l'atteinte (pour célébration ponctuelle)
    if (reached && !g.celebrated) {
      g.celebrated = true; _save(g);
      incrementGoalsDone();   // compte à vie → titres familiaux
    }

    return {
      type: g.type, def: def, target: g.target,
      total: total, pct: pct, reached: reached,
      daysLeft: daysLeft, perMember: perMember,
      titre: familyTitle(),
      expired: Date.now() > g.endsAt
    };
  }

  window.AwakFamilyGoal = {
    GOAL_TYPES: GOAL_TYPES,
    active: active,
    isActive: isActive,
    create: create,
    cancel: cancel,
    status: status
  };

  // ── INTERFACE ──────────────────────────────────────────────────────
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function _fmt(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }

  // 🏋️ Unité : le volume (poids soulevé) est stocké en KG (comme tout le reste).
  // On l'AFFICHE dans l'unité de l'utilisateur (kg ou lbs) sans changer le stockage.
  function _volIsLbs() { try { return typeof weightUnit === 'function' && weightUnit() === 'lbs'; } catch (e) { return false; } }
  function _dispVal(type, kgVal) {
    if (type === 'volume' && _volIsLbs()) {
      try { return (typeof fmtWeightVal === 'function') ? fmtWeightVal(kgVal) : kgVal; } catch (e) { return kgVal; }
    }
    return kgVal;
  }
  function _dispUnit(type, def) {
    if (type === 'volume') return _volIsLbs() ? ' lbs' : ' kg';
    return def.unit;
  }
  function _dispLabel(type, def) {
    if (type === 'volume') return _volIsLbs() ? 'lbs soulevés' : 'kg soulevés';
    return def.label;
  }

  // 👥 Paliers RONDS par unité + nombre de membres recommandé (le volume total à
  // atteindre dépend de la taille de la famille : à 2, 500 000 lb est irréaliste).
  var _PRESET_MEMBERS  = [2, 4, 6];
  var _VOL_PRESETS_KG  = [50000, 120000, 250000];   // kg (ronds)
  var _VOL_PRESETS_LBS = [100000, 250000, 500000];  // lbs (ronds)
  function _lbsToKg(v) { return Math.round(v * 0.453592); }
  // Renvoie [{ disp (valeur affichée dans l'unité), store (valeur stockée en kg
  // pour le volume, brute sinon), m (membres recommandés) }]
  function _presetList(type, def) {
    if (type === 'volume') {
      if (_volIsLbs()) return _VOL_PRESETS_LBS.map(function (v, i) { return { disp: v, store: _lbsToKg(v), m: _PRESET_MEMBERS[i] }; });
      return _VOL_PRESETS_KG.map(function (v, i) { return { disp: v, store: v, m: _PRESET_MEMBERS[i] }; });
    }
    return (def.presets || []).map(function (v, i) { return { disp: v, store: v, m: _PRESET_MEMBERS[i] || 2 }; });
  }

  // Carte de l'objectif commun (ou invitation à en créer un).
  function renderCard() {
    var st = status();

    // Pas d'objectif → carte d'invitation
    if (!st) {
      return '<div style="background:linear-gradient(160deg,#0f1a14,#0d0d12);border:1px solid rgba(34,197,94,0.25);border-radius:18px;padding:20px;margin-bottom:14px;">'
        + '<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">'
        +   '<span style="font-size:1.6em;">🎯</span>'
        +   '<div style="font-size:1.05em;font-weight:900;color:#fff;">Objectif commun</div>'
      +   (function () {
            // 🏅 Titre familial : la trace laissée par les objectifs accomplis.
            var t = familyTitle();
            if (!t.actuel && !t.done) return '';
            if (!t.actuel) return '';
            return '<div style="font-size:0.68em;color:#fbbf24;font-weight:800;margin-top:2px;">'
              + t.actuel.emoji + ' ' + t.actuel.nom + '</div>';
          })()
        + '</div>'
        + '<p style="font-size:0.82em;color:#94a3b8;line-height:1.5;margin:0 0 14px;">Fixez un but à atteindre <b style="color:#4ade80;">ensemble</b> — chaque séance de chacun fait avancer toute la famille.</p>'
        + '<button onclick="AwakFamilyGoalOpen()" style="width:100%;padding:12px;border:none;border-radius:12px;cursor:pointer;background:linear-gradient(135deg,#22c55e,#16a34a);color:#fff;font-weight:800;font-size:0.9em;">🎯 Créer un objectif commun</button>'
        + '</div>';
    }


    var def = st.def;
    var barColor = st.reached ? '#fbbf24' : '#22c55e';
    var members = st.perMember.map(function (m) {
      var share = st.total > 0 ? Math.round((m.value / st.total) * 100) : 0;
      return '<div style="display:flex;align-items:center;gap:8px;padding:6px 0;">'
        + _av(m.avatar, 22)
        + '<span style="flex:1;font-size:0.82em;color:#e5e7eb;font-weight:600;">' + esc(m.name) + '</span>'
        + '<span style="font-size:0.82em;color:#94a3b8;">' + _fmt(_dispVal(st.type, m.value)) + _dispUnit(st.type, def) + ' · ' + share + '%</span>'
        + '</div>';
    }).join('') || '<div style="font-size:0.78em;color:#64748b;padding:6px 0;">Aucune contribution pour l\'instant — lancez-vous !</div>';

    // 🏅 Prochain titre : donne une raison d'aller au bout, au-delà de la barre.
    var titreBloc = '';
    try {
      var _t = familyTitle();
      if (_t.suivant) {
        var reste = _t.suivant.seuil - _t.done;
        titreBloc = '<div style="margin-top:10px;padding-top:9px;border-top:1px solid rgba(255,255,255,0.06);font-size:0.7em;color:#94a3b8;">'
          + '<span style="color:#fbbf24;">' + _t.suivant.emoji + ' ' + esc(_t.suivant.nom) + '</span>'
          + ' — encore ' + reste + ' objectif' + (reste > 1 ? 's' : '') + ' accompli' + (reste > 1 ? 's' : '')
          + '</div>';
      } else if (_t.actuel) {
        titreBloc = '<div style="margin-top:10px;padding-top:9px;border-top:1px solid rgba(255,255,255,0.06);font-size:0.7em;color:#fbbf24;">'
          + _t.actuel.emoji + ' ' + esc(_t.actuel.nom) + ' — titre le plus haut atteint</div>';
      }
    } catch (e) {}

    var head = st.reached
      ? '<div style="text-align:center;padding:6px 0 12px;"><div style="font-size:2em;">🎉</div><div style="font-size:0.95em;font-weight:900;color:#fbbf24;">Objectif atteint, bravo à toute la famille !</div></div>'
      : '';

    return '<div style="background:linear-gradient(160deg,#0f1a14,#0d0d12);border:1px solid ' + (st.reached ? 'rgba(251,191,36,0.4)' : 'rgba(34,197,94,0.3)') + ';border-radius:18px;padding:20px;margin-bottom:14px;">'
      + '<div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">'
      +   '<span style="font-size:1.6em;">' + def.emoji + '</span>'
      +   '<div style="flex:1;"><div style="font-size:1.05em;font-weight:900;color:#fff;">Objectif commun</div>'
      +   '<div style="font-size:0.74em;color:#94a3b8;">' + (st.expired ? 'Terminé' : st.daysLeft + ' jour' + (st.daysLeft > 1 ? 's' : '') + ' restant' + (st.daysLeft > 1 ? 's' : '')) + '</div></div>'
      +   '<button onclick="AwakFamilyGoalCancel()" style="background:none;border:none;color:#64748b;font-size:1.1em;cursor:pointer;padding:4px;">✕</button>'
      + '</div>'
      + head
      + '<div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px;">'
      +   '<span style="font-size:1.4em;font-weight:900;color:' + barColor + ';">' + _fmt(_dispVal(st.type, st.total)) + '</span>'
      +   '<span style="font-size:0.82em;color:#94a3b8;">/ ' + _fmt(_dispVal(st.type, st.target)) + _dispUnit(st.type, def) + ' ' + esc(_dispLabel(st.type, def)) + '</span>'
      + '</div>'
      + '<div style="height:14px;background:rgba(255,255,255,0.06);border-radius:8px;overflow:hidden;margin-bottom:4px;">'
      +   '<div style="height:100%;width:' + st.pct + '%;background:linear-gradient(90deg,' + barColor + ',' + (st.reached ? '#f59e0b' : '#16a34a') + ');border-radius:8px;transition:width 0.4s;"></div>'
      + '</div>'
      + '<div style="text-align:right;font-size:0.78em;font-weight:800;color:' + barColor + ';margin-bottom:14px;">' + st.pct + '%</div>'
      + '<div style="font-size:0.72em;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Contributions</div>'
      + members
      + titreBloc
      + '</div>';
  }
  window.AwakFamilyGoal.renderCard = renderCard;

  // Modale de création
  window.AwakFamilyGoalOpen = function () {
    var typeButtons = Object.keys(GOAL_TYPES).filter(function (k) {
      // Ne pas proposer « poids soulevé » si un enfant est dans la famille.
      return !(k === 'volume' && _familleAvecEnfant());
    }).map(function (k) {
      var d = GOAL_TYPES[k];
      return '<button onclick="AwakFamilyGoalPick(\'' + k + '\')" data-goaltype="' + k + '" style="display:flex;flex-direction:column;align-items:center;gap:4px;padding:12px 6px;border-radius:12px;cursor:pointer;border:2px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.03);color:#fff;">'
        + '<span style="font-size:1.5em;">' + d.emoji + '</span>'
        + '<span style="font-size:0.74em;font-weight:700;">' + esc(_dispLabel(k, d)) + '</span></button>';
    }).join('');

    var overlay = document.createElement('div');
    overlay.id = 'awakGoalModal';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);z-index:99999;display:flex;align-items:center;justify-content:center;';
    overlay.onclick = function (e) { if (e.target === overlay) overlay.remove(); };
    overlay.innerHTML = '<div style="background:linear-gradient(160deg,#0f1a14,#0d0d12);border-top:1px solid rgba(34,197,94,0.35);border-radius:22px 22px 0 0;padding:22px;max-width:460px;width:100%;max-height:88vh;overflow-y:auto;">'
      + '<div style="font-size:1.15em;font-weight:900;color:#fff;margin-bottom:4px;">🎯 Objectif commun</div>'
      + '<div style="font-size:0.78em;color:#94a3b8;margin-bottom:16px;">Choisissez ce que vous voulez accomplir ensemble.</div>'
      + '<div style="font-size:0.72em;color:#64748b;font-weight:700;margin-bottom:6px;">TYPE</div>'
      + '<div id="goalTypeGrid" style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:16px;">' + typeButtons + '</div>'
      + '<div id="goalTargetZone"></div>'
      + '<button onclick="document.getElementById(\'awakGoalModal\').remove()" style="width:100%;padding:11px;border:none;border-radius:11px;cursor:pointer;background:rgba(255,255,255,0.05);color:#94a3b8;font-weight:700;font-size:0.82em;margin-top:8px;">Annuler</button>'
      + '</div>';
    document.body.appendChild(overlay);
  };

  // 🧒 SÉCURITÉ ENFANT — cohérente avec les défis (family-challenge.js) :
  // aucun objectif de « poids soulevé » si un enfant fait partie de la famille.
  // On n'incite pas un enfant à soulever lourd, ni ses proches à le pousser à
  // contribuer en volume. Les autres objectifs (séances, minutes, exercices)
  // restent disponibles pour tout le monde.
  function _familleAvecEnfant() {
    try {
      if (!window.AwakYouth) return false;
      if (typeof window.AwakYouth.isChild === 'function' && window.AwakYouth.isChild()) return true;
      if (typeof window.AwakYouth.isChildProfile === 'function') {
        return _allProfiles().some(function (p) { return window.AwakYouth.isChildProfile(p.id); });
      }
    } catch (e) {}
    return false;
  }

  window.AwakFamilyGoalPick = function (type) {
    var d = GOAL_TYPES[type];
    if (!d) return;
    if (type === 'volume' && _familleAvecEnfant()) {
      try {
        if (typeof showToast === 'function') {
          showToast('Objectif indisponible : un enfant fait partie de la famille. Choisis plutôt les séances, les minutes ou les exercices.', 'info', 5000);
        }
      } catch (e) {}
      return;
    }
    // surligner le type choisi
    var grid = document.getElementById('goalTypeGrid');
    if (grid) Array.prototype.forEach.call(grid.children, function (b) {
      var on = b.getAttribute('data-goaltype') === type;
      b.style.borderColor = on ? '#22c55e' : 'rgba(255,255,255,0.1)';
      b.style.background = on ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.03)';
    });
    var zone = document.getElementById('goalTargetZone');
    if (!zone) return;
    var presetBtns = _presetList(type, d).map(function (pr) {
      return '<button onclick="AwakFamilyGoalCreate(\'' + type + '\',' + pr.store + ')" style="flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;padding:11px 6px;border-radius:11px;cursor:pointer;border:1px solid rgba(34,197,94,0.3);background:rgba(34,197,94,0.08);color:#4ade80;font-weight:800;font-size:0.82em;">'
        + '<span>' + _fmt(pr.disp) + _dispUnit(type, d) + '</span>'
        + '<span style="font-size:0.66em;color:#94a3b8;font-weight:700;">👥 ~' + pr.m + ' membres</span>'
        + '</button>';
    }).join('');
    zone.innerHTML = '<div style="font-size:0.72em;color:#64748b;font-weight:700;margin-bottom:6px;">OBJECTIF (' + esc(_dispLabel(type, d)) + ' en 30 jours)</div>'
      + '<div style="display:flex;gap:8px;">' + presetBtns + '</div>'
      + '<div style="font-size:0.66em;color:#64748b;margin-top:8px;line-height:1.4;">👥 Le nombre de membres indiqué est une estimation pour atteindre l\'objectif en 30 jours. Choisis selon la taille de ta famille.</div>';
  };

  window.AwakFamilyGoalCreate = function (type, target) {
    create(type, target, 30);
    var el = document.getElementById('awakGoalModal'); if (el) el.remove();
    _refresh();
    if (typeof window.showToast === 'function') window.showToast('🎯 Objectif commun lancé — au boulot en famille !', 'success', 3000);
  };

  window.AwakFamilyGoalCancel = function () {
    if (typeof window.showConfirm === 'function') {
      window.showConfirm('Abandonner l\'objectif commun en cours ?', function () { cancel(); _refresh(); },
        null, { title: 'Abandonner ?', icon: '🎯', confirmLabel: 'Abandonner' });
    } else { cancel(); _refresh(); }
  };

  function _refresh() {
    try { if (typeof window.renderFamilyTab === 'function') window.renderFamilyTab(); } catch (e) {}
  }
})();
