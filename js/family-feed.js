/* ═══════════════════════════════════════════════════════════════════
   FIL D'ACTIVITÉ FAMILIAL — voir les séances des proches et réagir
   ───────────────────────────────────────────────────────────────────
   Agrège les séances récentes de TOUS les profils de l'appareil en un fil
   chronologique (« Papa a terminé Séance jambes 💪 »). Chaque membre peut
   réagir avec un emoji (👏 💪 🔥 ❤️) pour s'encourager. Social léger,
   coopératif : on célèbre les efforts des autres.
   Réactions stockées globalement (clé awakFamilyReactions, hors GAME_KEYS)
   → visibles par tous les profils.
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

  var REACT_KEY = 'awakFamilyReactions';   // { "<entryId>": { "👏":[pid,...], ... } }
  var REACTIONS = ['👏', '💪', '🔥', '❤️'];
  var MAX_ITEMS = 15;          // entrées affichées dans le fil
  var WINDOW_DAYS = 14;        // fenêtre de fraîcheur

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

  function _loadReactions() {
    try { return JSON.parse(localStorage.getItem(REACT_KEY) || '{}') || {}; }
    catch (e) { return {}; }
  }
  function _saveReactions(obj) {
    try { localStorage.setItem(REACT_KEY, JSON.stringify(obj || {})); } catch (e) {}
  }

  // Identifiant stable d'une entrée (pour rattacher les réactions).
  function _feedId(profileId, entry) {
    return profileId + ':' + (entry.id != null ? entry.id : _entryTs(entry));
  }

  // Construit le fil : séances récentes de tous les profils, triées récent→ancien.
  function buildFeed() {
    var cutoff = Date.now() - WINDOW_DAYS * 86400000;
    var items = [];
    _allProfiles().forEach(function (p) {
      _history(p.id).forEach(function (e) {
        var ts = _entryTs(e);
        if (ts < cutoff) return;
        items.push({
          feedId: _feedId(p.id, e),
          profileId: p.id,
          name: p.name || 'Membre',
          avatar: p.avatar || '🙂',
          workoutName: e.name || 'Séance',
          duration: e.duration || 0,
          exercises: e.exercises || 0,
          muscles: Array.isArray(e.muscles) ? e.muscles : [],
          ts: ts
        });
      });
    });
    items.sort(function (a, b) { return b.ts - a.ts; });
    return items.slice(0, MAX_ITEMS);
  }

  // Bascule une réaction du profil actif sur une entrée.
  function toggleReaction(feedId, emoji) {
    var me = _currentId();
    if (!me || REACTIONS.indexOf(emoji) === -1) return;
    var all = _loadReactions();
    if (!all[feedId]) all[feedId] = {};
    if (!all[feedId][emoji]) all[feedId][emoji] = [];
    var arr = all[feedId][emoji];
    var i = arr.indexOf(me);
    if (i === -1) arr.push(me); else arr.splice(i, 1);
    if (arr.length === 0) delete all[feedId][emoji];
    if (Object.keys(all[feedId]).length === 0) delete all[feedId];
    _saveReactions(all);
  }

  function reactionsFor(feedId) {
    var all = _loadReactions();
    return all[feedId] || {};
  }

  window.AwakFamilyFeed = {
    REACTIONS: REACTIONS,
    buildFeed: buildFeed,
    toggleReaction: toggleReaction,
    reactionsFor: reactionsFor
  };

  // ── INTERFACE ──────────────────────────────────────────────────────
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function _timeAgo(ts) {
    var diff = Date.now() - ts;
    var mins = Math.floor(diff / 60000);
    if (mins < 1) return "à l'instant";
    if (mins < 60) return 'il y a ' + mins + ' min';
    var h = Math.floor(mins / 60);
    if (h < 24) return 'il y a ' + h + ' h';
    var d = Math.floor(h / 24);
    if (d === 1) return 'hier';
    return 'il y a ' + d + ' jours';
  }


  function renderCard() {
    var feed = buildFeed();
    if (!feed.length) return '';   // pas d'activité récente → carte masquée

    var me = _currentId();
    var rows = feed.map(function (it) {
      // détails séance
      var bits = [];
      if (it.exercises) bits.push(it.exercises + ' exercice' + (it.exercises > 1 ? 's' : ''));
      if (it.duration) bits.push(it.duration + ' min');
      var detail = bits.join(' · ');

      // réactions existantes
      var reacts = reactionsFor(it.feedId);
      var reactBtns = REACTIONS.map(function (emo) {
        var list = reacts[emo] || [];
        var count = list.length;
        var mine = me && list.indexOf(me) !== -1;
        return '<button onclick="AwakFeedReact(\'' + it.feedId + '\',\'' + emo + '\')" style="display:inline-flex;align-items:center;gap:3px;padding:4px 8px;border-radius:20px;cursor:pointer;font-size:0.8em;border:1px solid ' + (mine ? 'rgba(34,197,94,0.5)' : 'rgba(255,255,255,0.1)') + ';background:' + (mine ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.03)') + ';color:#fff;">'
          + emo + (count > 0 ? '<span style="font-size:0.85em;color:#94a3b8;">' + count + '</span>' : '')
          + '</button>';
      }).join('');

      return '<div style="padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.06);">'
        + '<div style="display:flex;align-items:flex-start;gap:10px;">'
        +   _av(it.avatar, 30)
        +   '<div style="flex:1;min-width:0;">'
        +     '<div style="font-size:0.86em;color:#e5e7eb;line-height:1.4;"><b style="color:#fff;">' + esc(it.name) + '</b> a terminé <b style="color:#4ade80;">' + esc(it.workoutName) + '</b></div>'
        +     (detail ? '<div style="font-size:0.74em;color:#94a3b8;margin-top:1px;">' + esc(detail) + '</div>' : '')
        +     '<div style="font-size:0.68em;color:#64748b;margin-top:1px;">' + _timeAgo(it.ts) + '</div>'
        +     '<div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap;">' + reactBtns + '</div>'
        +   '</div>'
        + '</div>'
        + '</div>';
    }).join('');

    return '<div style="background:linear-gradient(160deg,#12101a,#0d0d12);border:1px solid rgba(168,85,247,0.25);border-radius:18px;padding:20px;margin-bottom:14px;">'
      + '<div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;">'
      +   '<span style="font-size:1.5em;">📣</span>'
      +   '<div style="font-size:1.05em;font-weight:900;color:#fff;">Activité de la famille</div>'
      + '</div>'
      + '<p style="font-size:0.76em;color:#94a3b8;margin:0 0 8px;line-height:1.4;">Les séances récentes de chacun. Encouragez-vous d\'une réaction !</p>'
      + rows
      + '</div>';
  }
  window.AwakFamilyFeed.renderCard = renderCard;

  window.AwakFeedReact = function (feedId, emoji) {
    toggleReaction(feedId, emoji);
    try { if (typeof window.renderFamilyTab === 'function') window.renderFamilyTab(); } catch (e) {}
  };
})();
