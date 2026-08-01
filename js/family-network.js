/* ═══════════════════════════════════════════════════════════════════
   RÉSEAU FAMILIAL — relations typées entre les profils d'un appareil
   ───────────────────────────────────────────────────────────────────
   Remplace l'ancien « duo » (une seule paire) par un vrai réseau : chaque
   profil peut être lié à plusieurs autres, avec un TYPE de relation
   (couple, parent, enfant, frère/sœur, autre).
   Les liens parent/enfant sont DIRECTIONNELS (A parent de B ⇔ B enfant de A) ;
   couple / frère-sœur / autre sont symétriques.
   100 % local, clé GLOBALE partagée (hors GAME_KEYS).
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

  var LINKS_KEY = 'awakFamilyLinks';   // GLOBALE : partagée entre tous les profils.
  var NUDGE_KEY = 'awakFamilyNudges';  // GLOBALE : boîte de réception des encouragements.

  // Types de relation. « directed:true » = le sens compte (parent→enfant).
  var REL_TYPES = {
    couple:  { label: 'En couple',    emoji: '💞', directed: false, inverse: 'couple'  },
    parent:  { label: 'Parent de',    emoji: '👪', directed: true,  inverse: 'enfant'  },
    enfant:  { label: 'Enfant de',    emoji: '🧒', directed: true,  inverse: 'parent'  },
    sibling: { label: 'Frère / Sœur', emoji: '🧑‍🤝‍🧑', directed: false, inverse: 'sibling' },
    autre:   { label: 'Autre',        emoji: '🔗', directed: false, inverse: 'autre'   }
  };

  // Types proposés à l'utilisateur au moment de créer un lien (enfant est
  // l'inverse de parent, on ne le propose donc pas séparément).
  var OFFERABLE = ['couple', 'parent', 'enfant', 'sibling', 'autre'];

  // ── Persistance ────────────────────────────────────────────────────
  function loadLinks() {
    try {
      var raw = localStorage.getItem(LINKS_KEY);
      if (!raw) return [];
      var arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch (e) { return []; }
  }
  function saveLinks(arr) {
    try { localStorage.setItem(LINKS_KEY, JSON.stringify(arr || [])); return true; }
    catch (e) { return false; }
  }

  // ── Profils ────────────────────────────────────────────────────────
  function allProfiles() {
    try { if (typeof window.getAllProfiles === 'function') return window.getAllProfiles() || []; } catch (e) {}
    return [];
  }
  function currentId() {
    try { if (typeof window.getCurrentProfileId === 'function') return window.getCurrentProfileId(); } catch (e) {}
    try { return localStorage.getItem('currentProfileId'); } catch (e) {}
    return null;
  }
  function meta(id) {
    var all = allProfiles();
    for (var i = 0; i < all.length; i++) if (all[i].id === id) {
      return { id: id, name: all[i].name || 'Membre', avatar: all[i].avatar || '🙂' };
    }
    return { id: id, name: 'Membre', avatar: '🙂' };
  }

  // Un lien est stocké sous forme normalisée { from, to, type } où `type` est
  // TOUJOURS du point de vue de `from` → `to`. On stocke le sens canonique :
  // pour parent/enfant on enregistre en 'parent' (from = le parent).
  function _normalize(fromId, toId, type) {
    if (type === 'enfant') return { from: toId, to: fromId, type: 'parent' };
    return { from: fromId, to: toId, type: type };
  }

  // Existe-t-il déjà un lien (quel qu'en soit le sens) entre a et b ?
  function _findLinkIndex(links, a, b) {
    for (var i = 0; i < links.length; i++) {
      var l = links[i];
      if ((l.from === a && l.to === b) || (l.from === b && l.to === a)) return i;
    }
    return -1;
  }

  // ── API relations ──────────────────────────────────────────────────

  // Crée / met à jour un lien entre le profil ACTIF et `otherId`.
  function setRelation(otherId, type) {
    var me = currentId();
    if (!me || !otherId || me === otherId) return false;
    if (!REL_TYPES[type]) return false;
    var links = loadLinks();
    var norm = _normalize(me, otherId, type);
    var idx = _findLinkIndex(links, me, otherId);
    if (idx >= 0) links[idx] = norm;      // remplace le lien existant
    else links.push(norm);
    return saveLinks(links);
  }

  function removeRelation(otherId) {
    var me = currentId();
    if (!me || !otherId) return false;
    var links = loadLinks();
    var idx = _findLinkIndex(links, me, otherId);
    if (idx < 0) return false;
    links.splice(idx, 1);
    return saveLinks(links);
  }

  // Quelle relation le profil `viewerId` a-t-il avec `otherId` ?
  // Renvoie { type, label, emoji } DU POINT DE VUE de viewer, ou null.
  function relationOf(viewerId, otherId) {
    var links = loadLinks();
    for (var i = 0; i < links.length; i++) {
      var l = links[i];
      if (l.from === viewerId && l.to === otherId) {
        var t = REL_TYPES[l.type] || REL_TYPES.autre;
        return { type: l.type, label: t.label, emoji: t.emoji };
      }
      if (l.to === viewerId && l.from === otherId) {
        // sens inverse : traduire (parent → enfant, etc.)
        var base = REL_TYPES[l.type] || REL_TYPES.autre;
        var invKey = base.inverse;
        var inv = REL_TYPES[invKey] || base;
        return { type: invKey, label: inv.label, emoji: inv.emoji };
      }
    }
    return null;
  }

  // Tous les membres liés au profil actif, avec la relation traduite pour lui.
  function myRelations() {
    var me = currentId();
    if (!me) return [];
    var links = loadLinks();
    var out = [];
    links.forEach(function (l) {
      var other = null;
      if (l.from === me) other = l.to;
      else if (l.to === me) other = l.from;
      if (!other) return;
      var rel = relationOf(me, other);
      if (rel) out.push({ member: meta(other), relation: rel });
    });
    return out;
  }

  // Profils encore liables au profil actif (pas soi, pas déjà lié).
  function linkableProfiles() {
    var me = currentId();
    var links = loadLinks();
    return allProfiles().filter(function (p) {
      if (p.id === me) return false;
      return _findLinkIndex(links, me, p.id) < 0;
    });
  }

  // Nettoyage : retirer les liens vers des profils supprimés.
  function pruneOrphans() {
    var ids = {};
    allProfiles().forEach(function (p) { ids[p.id] = true; });
    var links = loadLinks();
    var kept = links.filter(function (l) { return ids[l.from] && ids[l.to]; });
    if (kept.length !== links.length) saveLinks(kept);
    return kept;
  }

  // ── Rappels d'inactivité ───────────────────────────────────────────
  // Pour chaque membre lié, depuis combien de jours ne s'est-il pas entraîné ?
  // On lit son historique (profile_<id>_workoutHistory) — accessible car les
  // données de profil vivent toutes dans le même localStorage.
  function _lastWorkoutTs(profileId) {
    try {
      var raw = localStorage.getItem('profile_' + profileId + '_workoutHistory');
      if (!raw) {
        var cur = currentId();
        if (profileId === cur) raw = localStorage.getItem('workoutHistory');
      }
      if (!raw) return null;
      var hist = JSON.parse(raw);
      if (!Array.isArray(hist) || !hist.length) return null;
      var newest = 0;
      hist.forEach(function (e) {
        var t = e && e.date ? Date.parse(e.date) : (e && e.id ? e.id : 0);
        if (t && t > newest) newest = t;
      });
      return newest || null;
    } catch (e) { return null; }
  }

  function _daysSince(ts) {
    if (!ts) return null;
    return Math.floor((Date.now() - ts) / (24 * 3600 * 1000));
  }

  // Statut d'un membre : { level:'active'|'slipping'|'inactive'|'never', days }
  function memberStatus(profileId) {
    var ts = _lastWorkoutTs(profileId);
    if (!ts) return { level: 'never', days: null };
    var d = _daysSince(ts);
    if (d <= 3) return { level: 'active', days: d };
    if (d <= 6) return { level: 'slipping', days: d };
    return { level: 'inactive', days: d };
  }

  // Membres liés qui « traînent », triés du plus inactif au moins.
  function membersNeedingNudge() {
    var out = [];
    myRelations().forEach(function (r) {
      var st = memberStatus(r.member.id);
      if (st.level === 'active') return;
      out.push({ member: r.member, relation: r.relation, status: st });
    });
    out.sort(function (a, b) {
      var rank = { never: 3, inactive: 2, slipping: 1 };
      var ra = rank[a.status.level] || 0, rb = rank[b.status.level] || 0;
      if (ra !== rb) return rb - ra;
      return (b.status.days || 0) - (a.status.days || 0);
    });
    return out;
  }

  // Message d'encouragement adapté à la relation (local, pas d'envoi réseau).
  function nudgeMessage(relationType, memberName) {
    var name = memberName || 'toi';
    var byRel = {
      couple:  ['Allez, on bouge ensemble ? 💞', 'Ta séance t\'attend, ' + name + ' ! On se motive ? 💪'],
      parent:  ['Fier de toi quand tu t\'entraînes, ' + name + ' ! On y va ? 👏', 'Montre l\'exemple, ' + name + ' — une petite séance ? 💪'],
      enfant:  ['On compte sur toi pour bouger, ' + name + ' ! 🔥', 'On s\'entraîne en famille, ' + name + ' ? 😃'],
      sibling: ['Hé ' + name + ', on ne va pas se laisser distancer ! 😎', 'Défi : qui bouge en premier ? 💪'],
      autre:   ['Hé ' + name + ', ça fait un moment ! On reprend ? 💪', 'Un petit entraînement, ' + name + ' ? 🔥']
    };
    var pool = byRel[relationType] || byRel.autre;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  window.AwakFamily = {
    REL_TYPES: REL_TYPES,
    OFFERABLE: OFFERABLE,
    setRelation: setRelation,
    removeRelation: removeRelation,
    relationOf: relationOf,
    myRelations: myRelations,
    memberStatus: memberStatus,
    membersNeedingNudge: membersNeedingNudge,
    nudgeMessage: nudgeMessage,
    linkableProfiles: linkableProfiles,
    pruneOrphans: pruneOrphans,
    loadLinks: loadLinks,
    _meta: meta,
    currentId: currentId,
    profileCount: function () { return allProfiles().length; }
  };

  // ═══════════════════════════════════════════════════════════════════
  // INTERFACE — carte « Ma famille » dans l'onglet Famille
  // ═══════════════════════════════════════════════════════════════════
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function renderCard() {
    if (allProfiles().length < 2) return '';
    pruneOrphans();
    var me = currentId();
    var mine = myRelations();
    var linkable = linkableProfiles();

    // Liste des membres liés
    var rows = mine.map(function (r) {
      return '<div style="display:flex;align-items:center;gap:11px;padding:11px 0;border-bottom:1px solid rgba(255,255,255,0.05);">'
        + '<div style="flex-shrink:0;">' + _av(r.member.avatar, 32) + '</div>'
        + '<div style="flex:1;min-width:0;">'
        +   '<div style="font-size:0.92em;font-weight:800;color:#fff;">' + esc(r.member.name) + '</div>'
        +   '<div style="font-size:0.74em;color:#ec4899;font-weight:600;">' + r.relation.emoji + ' ' + esc(r.relation.label) + '</div>'
        + '</div>'
        + '<button onclick="AwakFamilyEdit(\'' + r.member.id + '\')" style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:#94a3b8;border-radius:9px;padding:6px 11px;font-size:0.72em;font-weight:700;cursor:pointer;">Modifier</button>'
        + '</div>';
    }).join('');

    if (!mine.length) {
      rows = '<div style="font-size:0.78em;color:#64748b;text-align:center;padding:14px 0;">Aucun lien pour l\'instant. Ajoute un membre de ta famille ci-dessous.</div>';
    }


    // Boutons d'ajout pour les profils encore liables
    var addBlock = '';
    if (linkable.length) {
      var chips = linkable.map(function (p) {
        return '<button onclick="AwakFamilyEdit(\'' + p.id + '\')" style="display:flex;align-items:center;gap:7px;padding:9px 13px;border:1px dashed rgba(236,72,153,0.4);border-radius:10px;cursor:pointer;background:rgba(236,72,153,0.06);color:#e2e8f0;font-size:0.78em;font-weight:700;">'
          + _av(p.avatar, 22) + ' ' + esc(p.name) + ' <span style="color:#ec4899;">+</span></button>';
      }).join('');
      addBlock = '<div style="margin-top:14px;padding-top:12px;border-top:1px solid rgba(255,255,255,0.06);">'
        + '<div style="font-size:0.72em;color:#94a3b8;font-weight:700;margin-bottom:9px;">➕ Lier un membre :</div>'
        + '<div style="display:flex;gap:8px;flex-wrap:wrap;">' + chips + '</div></div>';
    }

    return '<div style="background:linear-gradient(160deg,#1a1018,#0d0d12);border:1px solid rgba(236,72,153,0.25);border-radius:18px;padding:18px;margin-bottom:14px;box-shadow:0 4px 24px rgba(236,72,153,0.08);">'
      + '<div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">'
      +   '<span style="font-size:1.5em;">👨‍👩‍👧‍👦</span>'
      +   '<div><div style="font-size:0.62em;font-weight:800;letter-spacing:0.5px;color:#ec4899;">MA FAMILLE</div>'
      +   '<div style="font-size:1.02em;font-weight:900;color:#fff;">Membres liés</div></div>'
      + '</div>'
      + rows
      + addBlock
      + '</div>';
  }

  // ── Modale de choix de relation ────────────────────────────────────
  window.AwakFamilyEdit = function (otherId) {
    var m = meta(otherId);
    var existing = relationOf(currentId(), otherId);
    var buttons = OFFERABLE.map(function (key) {
      var t = REL_TYPES[key];
      var isCurrent = existing && existing.type === key;
      return '<button onclick="AwakFamilyPick(\'' + otherId + '\',\'' + key + '\')" style="'
        + 'display:flex;align-items:center;gap:10px;width:100%;padding:13px;margin-bottom:8px;border-radius:12px;cursor:pointer;'
        + 'border:1.5px solid ' + (isCurrent ? '#ec4899' : 'rgba(255,255,255,0.1)') + ';'
        + 'background:' + (isCurrent ? 'rgba(236,72,153,0.12)' : 'rgba(255,255,255,0.03)') + ';color:#fff;font-size:0.9em;font-weight:700;text-align:left;">'
        + '<span style="font-size:1.3em;">' + t.emoji + '</span> ' + t.label
        + (isCurrent ? ' <span style="margin-left:auto;color:#ec4899;">✓</span>' : '')
        + '</button>';
    }).join('');

    var removeBtn = existing
      ? '<button onclick="AwakFamilyRemove(\'' + otherId + '\')" style="width:100%;margin-top:6px;padding:11px;border:none;border-radius:10px;cursor:pointer;background:rgba(239,68,68,0.1);color:#f87171;font-size:0.8em;font-weight:700;">✕ Retirer ce lien</button>'
      : '';

    var overlay = document.createElement('div');
    overlay.id = 'awakFamilyModal';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px;';
    overlay.onclick = function (e) { if (e.target === overlay) overlay.remove(); };
    overlay.innerHTML = '<div style="background:linear-gradient(160deg,#1a1018,#0d0d12);border:1px solid rgba(236,72,153,0.3);border-radius:20px;padding:22px;max-width:360px;width:100%;box-shadow:0 8px 40px rgba(0,0,0,0.6);">'
      + '<div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">'
      +   _av(m.avatar, 36)
      +   '<div><div style="font-size:0.62em;color:#ec4899;font-weight:800;letter-spacing:0.5px;">QUELLE RELATION ?</div>'
      +   '<div style="font-size:1.1em;font-weight:900;color:#fff;">' + esc(m.name) + '</div></div>'
      + '</div>'
      + buttons
      + removeBtn
      + '<button onclick="document.getElementById(\'awakFamilyModal\').remove()" style="width:100%;margin-top:6px;padding:10px;border:none;border-radius:10px;cursor:pointer;background:transparent;color:#64748b;font-size:0.8em;">Annuler</button>'
      + '</div>';
    document.body.appendChild(overlay);
  };

  window.AwakFamilyPick = function (otherId, type) {
    setRelation(otherId, type);
    var el = document.getElementById('awakFamilyModal'); if (el) el.remove();
    var m = meta(otherId);
    var t = REL_TYPES[type];
    if (typeof window.showToast === 'function') window.showToast(t.emoji + ' Lien défini : ' + m.name + ' — ' + t.label, 'success', 3000);
    if (typeof window.renderFamilyTab === 'function') window.renderFamilyTab();
  };

  window.AwakFamilyRemove = function (otherId) {
    removeRelation(otherId);
    var el = document.getElementById('awakFamilyModal'); if (el) el.remove();
    if (typeof window.showToast === 'function') window.showToast('Lien retiré.', 'info', 2000);
    if (typeof window.renderFamilyTab === 'function') window.renderFamilyTab();
  };

  // Carte des rappels : membres liés qui traînent + bouton Encourager.
  function renderNudgeCard() {
    if (allProfiles().length < 2) return '';
    var list = membersNeedingNudge();
    if (!list.length) {
      // Tout le monde est actif : petit encart positif (uniquement s'il y a des liens)
      if (!myRelations().length) return '';
      return '<div style="background:linear-gradient(160deg,#0f1a12,#0d0d12);border:1px solid rgba(34,197,94,0.25);border-radius:18px;padding:16px;margin-bottom:14px;">'
        + '<div style="display:flex;align-items:center;gap:9px;">'
        +   '<span style="font-size:1.5em;">🌟</span>'
        +   '<div><div style="font-size:0.9em;font-weight:800;color:#4ade80;">Toute la famille est active !</div>'
        +   '<div style="font-size:0.74em;color:#94a3b8;">Chacun s\'est entraîné récemment. Continuez comme ça !</div></div>'
        + '</div></div>';
    }

    var rows = list.map(function (x) {
      var st = x.status;
      var color = st.level === 'inactive' || st.level === 'never' ? '#ef4444' : '#f59e0b';
      var when;
      if (st.level === 'never') when = 'Aucune séance enregistrée';
      else if (st.days === 0) when = 'Pas encore aujourd\'hui';
      else when = 'Dernière séance il y a ' + st.days + ' j';
      return '<div style="display:flex;align-items:center;gap:11px;padding:11px 0;border-bottom:1px solid rgba(255,255,255,0.05);">'
        + '<div style="flex-shrink:0;position:relative;">' + _av(x.member.avatar, 32)
        +   '<span style="position:absolute;bottom:-2px;right:-2px;width:11px;height:11px;border-radius:50%;background:' + color + ';border:2px solid #0d0d12;"></span>'
        + '</div>'
        + '<div style="flex:1;min-width:0;">'
        +   '<div style="font-size:0.9em;font-weight:800;color:#fff;">' + esc(x.member.name) + ' <span style="font-size:0.8em;color:#94a3b8;font-weight:600;">' + x.relation.emoji + '</span></div>'
        +   '<div style="font-size:0.72em;color:' + color + ';">' + when + '</div>'
        + '</div>'
        + '<button onclick="AwakFamilyNudge(\'' + x.member.id + '\')" style="background:linear-gradient(135deg,#8b5cf6,#6d28d9);border:none;color:#fff;border-radius:9px;padding:7px 13px;font-size:0.74em;font-weight:800;cursor:pointer;flex-shrink:0;">👏 Encourager</button>'
        + '</div>';
    }).join('');

    return '<div style="background:linear-gradient(160deg,#1a1018,#0d0d12);border:1px solid rgba(245,158,11,0.25);border-radius:18px;padding:18px;margin-bottom:14px;">'
      + '<div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">'
      +   '<span style="font-size:1.4em;">🔔</span>'
      +   '<div><div style="font-size:0.62em;font-weight:800;letter-spacing:0.5px;color:#f59e0b;">RAPPELS</div>'
      +   '<div style="font-size:1em;font-weight:900;color:#fff;">Ils ont besoin d\'un coup de pouce</div></div>'
      + '</div>'
      + rows
      + '</div>';
  }

  window.AwakFamilyNudge = function (memberId) {
    var rel = relationOf(currentId(), memberId);
    var m = meta(memberId);
    var msg = nudgeMessage(rel ? rel.type : 'autre', m.name);
    var me = meta(currentId());

    // 📬 Déposer l'encouragement dans la boîte du destinataire : les profils
    // partagent le même appareil, il le verra en prenant la main.
    var delivered = sendNudge(memberId, msg);

    var overlay = document.createElement('div');
    overlay.id = 'awakNudgeModal';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px;';
    overlay.onclick = function (e) { if (e.target === overlay) overlay.remove(); };
    overlay.innerHTML = '<div style="background:linear-gradient(160deg,#16121f,#0d0d12);border:1px solid rgba(139,92,246,0.3);border-radius:20px;padding:24px;max-width:340px;width:100%;text-align:center;box-shadow:0 8px 40px rgba(0,0,0,0.6);">'
      + '<div style="font-size:2.6em;margin-bottom:8px;">' + _av(m.avatar, 44) + '</div>'
      + '<div style="font-size:0.62em;color:#a78bfa;font-weight:800;letter-spacing:0.5px;margin-bottom:4px;">MESSAGE POUR ' + esc(m.name).toUpperCase() + '</div>'
      + '<div style="font-size:1.05em;font-weight:700;color:#fff;line-height:1.5;margin-bottom:14px;">« ' + esc(msg) + ' »</div>'
      + (delivered
          ? '<div style="font-size:0.74em;color:#4ade80;background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.25);border-radius:9px;padding:8px 10px;margin-bottom:16px;line-height:1.4;">📬 Envoyé ! ' + esc(m.name) + ' le verra en ouvrant son profil.</div>'
          : '<div style="font-size:0.72em;color:#64748b;margin-bottom:16px;">Transmets-lui ce message.</div>')
      + '<button onclick="document.getElementById(\'awakNudgeModal\').remove()" style="width:100%;padding:12px;border:none;border-radius:12px;cursor:pointer;background:linear-gradient(135deg,#8b5cf6,#6d28d9);color:#fff;font-weight:800;font-size:0.9em;">Compris 💪</button>'
      + '</div>';
    document.body.appendChild(overlay);
  };

  /* ═══════════════════════════════════════════════════════════════════
     BOÎTE DE RÉCEPTION DES ENCOURAGEMENTS (v623)
     Les profils partagent l'appareil : un encouragement est déposé dans une
     clé globale et s'affiche au destinataire quand il prend la main.
     ═══════════════════════════════════════════════════════════════════ */
  function _loadNudges() {
    try { var a = JSON.parse(localStorage.getItem(NUDGE_KEY) || '[]'); return Array.isArray(a) ? a : []; }
    catch (e) { return []; }
  }
  function _saveNudges(arr) {
    try { localStorage.setItem(NUDGE_KEY, JSON.stringify((arr || []).slice(-60))); } catch (e) {}
  }

  // Dépose un encouragement pour `toId`. Retourne false si impossible.
  function sendNudge(toId, msg) {
    var from = currentId();
    if (!from || !toId || from === toId) return false;
    var me = meta(from);
    var all = _loadNudges();
    all.push({
      to: toId, from: from,
      fromName: (me && me.name) || 'Un proche',
      fromAvatar: (me && me.avatar) || '\u{1F464}',
      msg: msg || '', ts: Date.now(), seen: false
    });
    _saveNudges(all);
    return true;
  }

  // Encouragements non lus destinés au profil actif.
  function pendingNudges() {
    var me = currentId();
    if (!me) return [];
    return _loadNudges().filter(function (n) { return n && n.to === me && !n.seen; });
  }

  function markNudgesSeen() {
    var me = currentId();
    if (!me) return;
    var all = _loadNudges();
    all.forEach(function (n) { if (n && n.to === me) n.seen = true; });
    _saveNudges(all);
  }

  // Bandeau d'accueil : « X t'encourage ! »
  function renderInboxBanner() {
    var list = pendingNudges();
    if (!list.length) return '';
    var last = list[list.length - 1];
    var extra = list.length > 1 ? ' <span style="color:#a78bfa;">(+' + (list.length - 1) + ' autre' + (list.length > 2 ? 's' : '') + ')</span>' : '';
    return '<div onclick="AwakFamilyNudgeOpenInbox()" style="margin-bottom:14px;padding:14px 16px;border-radius:16px;cursor:pointer;background:linear-gradient(135deg,rgba(139,92,246,0.14),rgba(109,40,217,0.06));border:1px solid rgba(139,92,246,0.4);">'
      + '<div style="display:flex;align-items:center;gap:12px;">'
      +   '<div style="flex-shrink:0;">' + _av(last.fromAvatar, 36) + '</div>'
      +   '<div style="flex:1;min-width:0;">'
      +     '<div style="font-size:0.6em;color:#a78bfa;font-weight:900;letter-spacing:1.5px;">📬 ENCOURAGEMENT REÇU</div>'
      +     '<div style="font-size:0.88em;font-weight:800;color:#fff;margin-top:2px;">' + esc(last.fromName) + ' t\'encourage !' + extra + '</div>'
      +   '</div>'
      +   '<div style="font-size:1.1em;color:#8b5cf6;">›</div>'
      + '</div></div>';
  }

  function updateInboxBanner() {
    var host = document.getElementById('familyNudgeInbox');
    if (host) host.innerHTML = renderInboxBanner();
  }

  // Ouvre les messages reçus, puis les marque comme lus.
  window.AwakFamilyNudgeOpenInbox = function () {
    var list = pendingNudges();
    if (!list.length) return;
    var items = list.slice().reverse().map(function (n) {
      return '<div style="background:rgba(255,255,255,0.04);border-radius:12px;padding:12px;margin-bottom:8px;text-align:left;">'
        + '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">'
        +   _av(n.fromAvatar, 26)
        +   '<span style="font-size:0.8em;font-weight:800;color:#c4b5fd;">' + esc(n.fromName) + '</span>'
        + '</div>'
        + '<div style="font-size:0.9em;color:#fff;line-height:1.5;">« ' + esc(n.msg) + ' »</div>'
        + '</div>';
    }).join('');

    var overlay = document.createElement('div');
    overlay.id = 'awakInboxModal';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px;';
    overlay.onclick = function (e) { if (e.target === overlay) _closeInbox(); };
    overlay.innerHTML = '<div style="background:linear-gradient(160deg,#16121f,#0d0d12);border:1px solid rgba(139,92,246,0.3);border-radius:20px;padding:22px;max-width:380px;width:100%;max-height:85vh;overflow-y:auto;box-shadow:0 8px 40px rgba(0,0,0,0.6);">'
      + '<div style="text-align:center;font-size:2em;margin-bottom:4px;">📬</div>'
      + '<div style="text-align:center;font-size:1.05em;font-weight:900;color:#fff;margin-bottom:16px;">Ta famille t\'encourage</div>'
      + items
      + '<button onclick="AwakFamilyNudgeCloseInbox()" style="width:100%;margin-top:8px;padding:12px;border:none;border-radius:12px;cursor:pointer;background:linear-gradient(135deg,#8b5cf6,#6d28d9);color:#fff;font-weight:800;font-size:0.9em;">Merci ! 💪</button>'
      + '</div>';
    document.body.appendChild(overlay);
  };

  function _closeInbox() {
    markNudgesSeen();
    var el = document.getElementById('awakInboxModal');
    if (el) el.remove();
    updateInboxBanner();
  }
  window.AwakFamilyNudgeCloseInbox = _closeInbox;

  window.AwakFamily.sendNudge = sendNudge;
  window.AwakFamily.pendingNudges = pendingNudges;
  window.AwakFamily.renderInboxBanner = renderInboxBanner;
  window.AwakFamily.updateInboxBanner = updateInboxBanner;

  window.AwakFamily.renderNudgeCard = renderNudgeCard;
  window.AwakFamily.renderCard = renderCard;
})();
