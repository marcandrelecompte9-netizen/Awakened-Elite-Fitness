/* ═══════════════════════════════════════════════════════════════════
   DÉFIS FAMILIAUX — défier un membre lié (pour le fun)
   ───────────────────────────────────────────────────────────────────
   Le profil actif défie un membre lié sur 7 jours. La progression des deux
   se calcule à partir des séances DÉJÀ enregistrées (profile_<id>_workoutHistory)
   — aucun geste spécial requis. 100 % local, même appareil.
   Clé GLOBALE partagée « awakFamilyChallenges » (hors GAME_KEYS).
   Le gagnant remporte un simple titre (pour le fun, pas de récompense).
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

  var CH_KEY = 'awakFamilyChallenges';
  var DURATION_DAYS = 7;

  // Types de défis. metric(entry) extrait la valeur d'une séance ; on cumule
  // sur la fenêtre de 7 jours. « higher wins ».
  var CH_TYPES = {
    sessions: {
      label: 'Le plus de séances',
      emoji: '🔥',
      desc: 'Qui enchaîne le plus de séances en 7 jours ?',
      unit: 'séances',
      metric: function () { return 1; }
    },
    volume: {
      label: 'Le plus gros volume',
      emoji: '🏋️',
      desc: 'Qui soulève le plus de poids au total en 7 jours ?',
      unit: 'kg',
      metric: function (e) { return Math.max(0, e.volume || 0); }
    },
    duration: {
      label: 'Le plus de temps',
      emoji: '⏱️',
      desc: 'Qui passe le plus de temps à s\'entraîner en 7 jours ?',
      unit: 'min',
      metric: function (e) { return Math.max(0, e.duration || 0); }
    },
    exercises: {
      label: 'Le plus d\'exercices',
      emoji: '🎯',
      desc: 'Qui réalise le plus d\'exercices au total en 7 jours ?',
      unit: 'exos',
      metric: function (e) {
        var n = e.exercises;
        if (typeof n === 'number') return Math.max(0, n);
        if (Array.isArray(n)) return n.length;
        return 0;
      }
    },
    calories: {
      label: 'Le plus de calories',
      emoji: '⚡',
      desc: 'Qui brûle le plus de calories au total en 7 jours ?',
      unit: 'cal',
      metric: function (e) { return Math.max(0, e.calories || 0); }
    },
    regular: {
      label: 'Le plus régulier',
      emoji: '📅',
      desc: 'Qui s\'entraîne le plus de jours différents en 7 jours ?',
      unit: 'jours',
      aggregate: function (entries) {
        var days = {};
        entries.forEach(function (e) {
          var t = e.date ? Date.parse(e.date) : (e.id || 0);
          if (!t) return;
          var d = new Date(t);
          days[d.getFullYear() + '-' + d.getMonth() + '-' + d.getDate()] = true;
        });
        return Object.keys(days).length;
      }
    },
    streak: {
      label: 'La plus longue série',
      emoji: '📈',
      desc: 'Qui enchaîne le plus de jours consécutifs en 7 jours ?',
      unit: 'j d\'affilée',
      aggregate: function (entries) {
        var daySet = {};
        entries.forEach(function (e) {
          var t = e.date ? Date.parse(e.date) : (e.id || 0);
          if (!t) return;
          var d = new Date(t); d.setHours(0, 0, 0, 0);
          daySet[d.getTime()] = true;
        });
        var days = Object.keys(daySet).map(Number).sort(function (a, b) { return a - b; });
        if (!days.length) return 0;
        var best = 1, cur = 1, DAY = 86400000;
        for (var i = 1; i < days.length; i++) {
          if (days[i] - days[i - 1] === DAY) { cur++; if (cur > best) best = cur; }
          else cur = 1;
        }
        return best;
      }
    }
  };
  var OFFERABLE = ['sessions', 'volume', 'duration', 'exercises', 'calories', 'regular', 'streak'];

  // ── Persistance ────────────────────────────────────────────────────
  function load() {
    try {
      var raw = localStorage.getItem(CH_KEY);
      if (!raw) return [];
      var a = JSON.parse(raw);
      return Array.isArray(a) ? a : [];
    } catch (e) { return []; }
  }
  function save(a) { try { localStorage.setItem(CH_KEY, JSON.stringify(a || [])); return true; } catch (e) { return false; } }

  function _currentId() {
    try { if (typeof window.getCurrentProfileId === 'function') return window.getCurrentProfileId(); } catch (e) {}
    try { return localStorage.getItem('currentProfileId'); } catch (e) {}
    return null;
  }
  function _meta(id) {
    try {
      if (window.AwakFamily && typeof window.AwakFamily._meta === 'function') return window.AwakFamily._meta(id);
    } catch (e) {}
    return { id: id, name: 'Membre', avatar: '🙂' };
  }

  // Historique d'un profil (repli clé non préfixée pour le profil actif).
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

  // Score d'un profil pour un défi (cumul de la métrique sur la fenêtre).
  function _score(profileId, type, startTs, endTs) {
    var def = CH_TYPES[type] || CH_TYPES.sessions;
    // Séances du profil dans la fenêtre du défi
    var inWindow = _history(profileId).filter(function (e) {
      var ts = _entryTs(e);
      return ts >= startTs && ts <= endTs;
    });
    // Type à métrique GLOBALE (régularité, série de jours…) : on passe toutes
    // les séances de la fenêtre d'un coup.
    if (typeof def.aggregate === 'function') {
      return Math.round(def.aggregate(inWindow) || 0);
    }
    // Type CUMULATIF : on additionne la métrique de chaque séance.
    var total = 0;
    inWindow.forEach(function (e) { total += def.metric(e) || 0; });
    return Math.round(total);
  }

  // ── API défis ──────────────────────────────────────────────────────

  // Créer un défi entre le profil actif et opponentId.
  function create(opponentId, type) {
    var me = _currentId();
    if (!me || !opponentId || me === opponentId) return false;
    if (!CH_TYPES[type]) return false;
    // 🧒 Sécurité : jamais de défi « volume » (poids soulevé) si un enfant est
    // impliqué (cible ou profil actif). On bascule en refus plutôt qu'inciter.
    if (type === 'volume') {
      try {
        if (window.AwakYouth) {
          if (typeof window.AwakYouth.isChildProfile === 'function' && window.AwakYouth.isChildProfile(opponentId)) return false;
          if (typeof window.AwakYouth.isChild === 'function' && window.AwakYouth.isChild()) return false;
        }
      } catch (e) {}
    }
    var list = load();
    // Un seul défi actif à la fois entre deux mêmes profils
    var now = Date.now();
    list = list.filter(function (c) {
      var pair = (c.a === me && c.b === opponentId) || (c.a === opponentId && c.b === me);
      return !(pair && c.endsAt > now);   // retirer un défi actif existant entre eux
    });
    list.push({
      id: 'ch_' + now,
      a: me, b: opponentId,
      type: type,
      startsAt: now,
      endsAt: now + DURATION_DAYS * 86400000
    });
    save(list);
    return true;
  }

  function cancel(challengeId) {
    var list = load().filter(function (c) { return c.id !== challengeId; });
    save(list);
  }

  // Nettoyer les défis vers des profils supprimés.
  function pruneOrphans() {
    var ids = {};
    try { (window.getAllProfiles ? window.getAllProfiles() : []).forEach(function (p) { ids[p.id] = true; }); } catch (e) {}
    var list = load();
    var kept = list.filter(function (c) { return ids[c.a] && ids[c.b]; });
    if (kept.length !== list.length) save(kept);
    return kept;
  }

  // Défis impliquant le profil actif, avec scores calculés.
  function myChallenges() {
    var me = _currentId();
    if (!me) return [];
    pruneOrphans();
    var now = Date.now();
    return load().filter(function (c) { return c.a === me || c.b === me; })
      .map(function (c) {
        var opp = (c.a === me) ? c.b : c.a;
        var def = CH_TYPES[c.type] || CH_TYPES.sessions;
        var myScore = _score(me, c.type, c.startsAt, c.endsAt);
        var oppScore = _score(opp, c.type, c.startsAt, c.endsAt);
        var ended = now > c.endsAt;
        var daysLeft = Math.max(0, Math.ceil((c.endsAt - now) / 86400000));
        var leader = myScore === oppScore ? null : (myScore > oppScore ? me : opp);
        return {
          id: c.id, type: c.type, def: def,
          me: _meta(me), opponent: _meta(opp),
          myScore: myScore, oppScore: oppScore,
          ended: ended, daysLeft: daysLeft,
          leader: leader, isMeLeading: leader === me,
          startsAt: c.startsAt, endsAt: c.endsAt
        };
      })
      .sort(function (a, b) { return a.ended - b.ended || a.endsAt - b.endsAt; });
  }

  // Membres liés qu'on peut défier (pas déjà un défi actif en cours).
  function challengeableMembers() {
    var me = _currentId();
    var now = Date.now();
    var active = {};
    load().forEach(function (c) {
      if (c.endsAt > now) {
        if (c.a === me) active[c.b] = true;
        if (c.b === me) active[c.a] = true;
      }
    });
    var rels = [];
    try { if (window.AwakFamily && typeof window.AwakFamily.myRelations === 'function') rels = window.AwakFamily.myRelations(); } catch (e) {}
    return rels.filter(function (r) { return !active[r.member.id]; })
      .map(function (r) { return { member: r.member, relation: r.relation }; });
  }

  window.AwakFamilyChallenge = {
    CH_TYPES: CH_TYPES,
    OFFERABLE: OFFERABLE,
    DURATION_DAYS: DURATION_DAYS,
    create: create,
    cancel: cancel,
    myChallenges: myChallenges,
    challengeableMembers: challengeableMembers,
    pruneOrphans: pruneOrphans
  };

  // ═══════════════════════════════════════════════════════════════════
  // INTERFACE
  // ═══════════════════════════════════════════════════════════════════
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function _fmtScore(v, unit) {
    if (unit === 'kg' && v >= 1000) return (v / 1000).toFixed(1).replace('.0', '') + ' t';
    return v.toLocaleString('fr-FR') + (unit ? ' ' + unit : '');
  }


  function renderCard() {
    if (!(window.AwakFamily && typeof window.AwakFamily.profileCount === 'function' && window.AwakFamily.profileCount() >= 2)) return '';
    var challenges = myChallenges();
    var canChallenge = challengeableMembers().length > 0;

    var html = '<div style="background:linear-gradient(160deg,#161020,#0d0d12);border:1px solid rgba(139,92,246,0.25);border-radius:18px;padding:18px;margin-bottom:14px;">'
      + '<div style="display:flex;align-items:center;gap:10px;margin-bottom:' + (challenges.length ? '14px' : '10px') + ';">'
      +   '<span style="font-size:1.4em;">⚔️</span>'
      +   '<div style="flex:1;"><div style="font-size:0.62em;font-weight:800;letter-spacing:0.5px;color:#a78bfa;">DÉFIS</div>'
      +   '<div style="font-size:1em;font-weight:900;color:#fff;">Défie ta famille</div></div>'
      + '</div>';

    // Défis en cours / terminés
    challenges.forEach(function (c) {
      var total = c.myScore + c.oppScore;
      var myPct = total > 0 ? Math.round((c.myScore / total) * 100) : 50;
      var statusLine, statusColor;
      if (c.ended) {
        if (!c.leader) { statusLine = 'Égalité !'; statusColor = '#94a3b8'; }
        else if (c.isMeLeading) { statusLine = '🏆 Tu as gagné !'; statusColor = '#4ade80'; }
        else { statusLine = c.opponent.name + ' a gagné'; statusColor = '#f87171'; }
      } else {
        statusLine = c.daysLeft + ' j restant' + (c.daysLeft > 1 ? 's' : '');
        statusColor = '#a78bfa';
      }

      html += '<div style="background:rgba(255,255,255,0.03);border-radius:13px;padding:13px;margin-bottom:10px;">'
        + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:9px;">'
        +   '<div style="font-size:0.82em;font-weight:800;color:#fff;">' + c.def.emoji + ' ' + esc(c.def.label) + '</div>'
        +   '<div style="font-size:0.68em;font-weight:700;color:' + statusColor + ';">' + statusLine + '</div>'
        + '</div>'
        // Barre comparative
        + '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">'
        +   '<span style="font-size:1.2em;">' + _av(c.me.avatar, 22) + '</span>'
        +   '<div style="flex:1;height:14px;background:rgba(255,255,255,0.06);border-radius:99px;overflow:hidden;display:flex;">'
        +     '<div style="width:' + myPct + '%;background:linear-gradient(90deg,#8b5cf6,#6d28d9);height:100%;"></div>'
        +   '</div>'
        +   '<span style="font-size:1.2em;">' + _av(c.opponent.avatar, 22) + '</span>'
        + '</div>'
        + '<div style="display:flex;justify-content:space-between;font-size:0.72em;">'
        +   '<span style="color:' + (c.isMeLeading && c.myScore !== c.oppScore ? '#c4b5fd' : '#94a3b8') + ';font-weight:700;">' + _fmtScore(c.myScore, c.def.unit) + '</span>'
        +   '<span style="color:' + (!c.isMeLeading && c.myScore !== c.oppScore ? '#c4b5fd' : '#94a3b8') + ';font-weight:700;">' + _fmtScore(c.oppScore, c.def.unit) + '</span>'
        + '</div>'
        + (c.ended
            ? '<button onclick="AwakChallengeCancel(\'' + c.id + '\')" style="width:100%;margin-top:9px;padding:8px;border:none;border-radius:9px;cursor:pointer;background:rgba(255,255,255,0.05);color:#94a3b8;font-size:0.74em;font-weight:700;">Terminer</button>'
            : '<button onclick="AwakChallengeCancel(\'' + c.id + '\')" style="width:100%;margin-top:9px;padding:6px;border:none;border-radius:8px;cursor:pointer;background:transparent;color:#64748b;font-size:0.7em;">Abandonner</button>')
        + '</div>';
    });

    // Bouton créer
    if (canChallenge) {
      html += '<button onclick="AwakChallengeNew()" style="width:100%;padding:12px;border:none;border-radius:12px;cursor:pointer;background:linear-gradient(135deg,#8b5cf6,#6d28d9);color:#fff;font-weight:800;font-size:0.88em;">⚔️ Défier un membre</button>';
    } else if (!challenges.length) {
      html += '<div style="font-size:0.76em;color:#64748b;text-align:center;padding:6px 0;">Lie d\'abord un membre de ta famille pour le défier.</div>';
    }

    html += '</div>';
    return html;
  }

  // ── Modale : choisir un membre puis un type de défi ────────────────
  window.AwakChallengeNew = function () {
    var members = challengeableMembers();
    if (!members.length) return;
    var memberBtns = members.map(function (m) {
      return '<button onclick="AwakChallengePickMember(\'' + m.member.id + '\')" style="display:flex;align-items:center;gap:9px;width:100%;padding:12px;margin-bottom:8px;border:1.5px solid rgba(255,255,255,0.1);border-radius:12px;cursor:pointer;background:rgba(255,255,255,0.03);color:#fff;font-size:0.9em;font-weight:700;text-align:left;">'
        + '<span style="font-size:1.4em;">' + _av(m.member.avatar, 25) + '</span> ' + esc(m.member.name)
        + ' <span style="margin-left:auto;font-size:0.85em;color:#94a3b8;">' + m.relation.emoji + '</span></button>';
    }).join('');
    _showModal('Qui veux-tu défier ?', '⚔️', memberBtns);
  };

  window.AwakChallengePickMember = function (memberId) {
    // 🧒 Sécurité jeunes : on ne propose PAS le défi « volume » (poids soulevé)
    // si la cible OU le profil actif est un enfant — pour ne pas inciter un
    // enfant à soulever lourd. Les autres défis (séances, régularité, temps…)
    // restent disponibles et sont sans danger.
    var offered = OFFERABLE.slice();
    try {
      var childInvolved = false;
      if (window.AwakYouth) {
        if (typeof window.AwakYouth.isChildProfile === 'function' && window.AwakYouth.isChildProfile(memberId)) childInvolved = true;
        if (typeof window.AwakYouth.isChild === 'function' && window.AwakYouth.isChild()) childInvolved = true;
      }
      if (childInvolved) offered = offered.filter(function (k) { return k !== 'volume'; });
    } catch (e) {}

    var typeBtns = offered.map(function (key) {
      var t = CH_TYPES[key];
      return '<button onclick="AwakChallengeStart(\'' + memberId + '\',\'' + key + '\')" style="display:flex;align-items:flex-start;gap:10px;width:100%;padding:13px;margin-bottom:8px;border:1.5px solid rgba(139,92,246,0.25);border-radius:12px;cursor:pointer;background:rgba(139,92,246,0.06);color:#fff;text-align:left;">'
        + '<span style="font-size:1.4em;flex-shrink:0;">' + t.emoji + '</span>'
        + '<span style="flex:1;"><span style="font-size:0.9em;font-weight:800;display:block;">' + t.label + '</span>'
        + '<span style="font-size:0.72em;color:#94a3b8;">' + t.desc + '</span></span></button>';
    }).join('');
    _showModal('Type de défi', '🎯', typeBtns + '<div style="font-size:0.72em;color:#64748b;text-align:center;margin-top:4px;">Durée : ' + DURATION_DAYS + ' jours · pour le fun 😄</div>');
  };

  window.AwakChallengeStart = function (memberId, type) {
    create(memberId, type);
    _closeModal();
    var m = _meta(memberId);
    var t = CH_TYPES[type] || CH_TYPES.sessions;
    if (typeof window.showToast === 'function') window.showToast('⚔️ Défi lancé contre ' + m.name + ' : ' + t.label + ' !', 'success', 3500);
    if (typeof window.renderFamilyTab === 'function') window.renderFamilyTab();
  };

  window.AwakChallengeCancel = function (id) {
    cancel(id);
    if (typeof window.renderFamilyTab === 'function') window.renderFamilyTab();
  };

  function _showModal(title, emoji, bodyHtml) {
    _closeModal();
    var overlay = document.createElement('div');
    overlay.id = 'awakChallengeModal';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px;';
    overlay.onclick = function (e) { if (e.target === overlay) _closeModal(); };
    overlay.innerHTML = '<div style="background:linear-gradient(160deg,#161020,#0d0d12);border:1px solid rgba(139,92,246,0.3);border-radius:20px;padding:22px;max-width:360px;width:100%;max-height:85vh;overflow-y:auto;box-shadow:0 8px 40px rgba(0,0,0,0.6);">'
      + '<div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">'
      +   '<span style="font-size:1.7em;">' + emoji + '</span>'
      +   '<div style="font-size:1.1em;font-weight:900;color:#fff;">' + esc(title) + '</div>'
      + '</div>'
      + bodyHtml
      + '<button onclick="AwakChallengeCloseModal()" style="width:100%;margin-top:6px;padding:10px;border:none;border-radius:10px;cursor:pointer;background:transparent;color:#64748b;font-size:0.8em;">Annuler</button>'
      + '</div>';
    document.body.appendChild(overlay);
  }
  function _closeModal() { var el = document.getElementById('awakChallengeModal'); if (el) el.remove(); }
  window.AwakChallengeCloseModal = _closeModal;

  window.AwakFamilyChallenge.renderCard = renderCard;
})();
