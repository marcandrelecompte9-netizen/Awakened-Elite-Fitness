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


  // 📊 Stats hebdo d'un membre : séances, jours actifs, niveau.
  // Trois chiffres suffisent à donner une identité à chacun — sans transformer
  // la carte en tableau de bord ni créer de classement entre membres.
  function memberWeekStats(profileId) {
    var debut = Date.now() - 7 * 24 * 60 * 60 * 1000;
    var seances = 0, jours = {};
    try {
      // ⚠️ Clé réelle : « profile_<id>_workoutHistory » (voir _lastWorkoutTs).
      // Le profil ACTIF stocke, lui, sous « workoutHistory ».
      var raw = localStorage.getItem('profile_' + profileId + '_workoutHistory');
      if (!raw && profileId === currentId()) raw = localStorage.getItem('workoutHistory');
      (JSON.parse(raw || '[]') || []).forEach(function (w) {
        var t = w && w.date ? Date.parse(w.date) : (w && w.id ? w.id : 0);
        if (t >= debut) { seances++; jours[new Date(t).toDateString()] = true; }
      });
    } catch (e) {}
    return { seances: seances, joursActifs: Object.keys(jours).length };
  }


  // ══════════════════════════════════════════════════════════════════



  // ══════════════════════════════════════════════════════════════


  // 📋 BANDEAU « EN COURS » — défis et objectif actifs, au-dessus du pied.
  // ⚠️ Depuis v902 l'onglet n'affiche plus que la Constellation : un défi ou
  // un objectif en cours n'était visible nulle part sans ouvrir une modale.
  // Ce bandeau les rappelle d'un coup d'œil et mène directement au bon écran.
  function _enCoursBandeau() {
    var lignes = [];

    // Objectif commun
    try {
      if (window.AwakFamilyGoal && window.AwakFamilyGoal.isActive
          && window.AwakFamilyGoal.isActive()) {
        var st = window.AwakFamilyGoal.status ? window.AwakFamilyGoal.status() : null;
        if (st) {
          lignes.push({
            emoji: '🎯', col: '#4ade80',
            titre: 'Objectif commun',
            detail: st.total + ' / ' + st.target + ' ' + (st.label || ''),
            pct: st.pct || 0,
            action: 'AwakFamilyGoalOpen()'
          });
        }
      }
    } catch (e) {}

    // Défi d'équipe
    try {
      if (window.AwakFamilyChallenge && window.AwakFamilyChallenge.coopStatus) {
        var co = window.AwakFamilyChallenge.coopStatus();
        if (co) {
          lignes.push({
            emoji: '🤝', col: '#22d3ee',
            titre: 'Défi d\'équipe',
            detail: co.total + ' / ' + co.cible + ' ' + ((co.def && co.def.label) || ''),
            pct: co.pct || 0,
            action: 'AwakCoopOpen()'
          });
        }
      }
    } catch (e) {}

    // Duels en cours (non terminés)
    try {
      if (window.AwakFamilyChallenge && window.AwakFamilyChallenge.myChallenges) {
        var actifs = (window.AwakFamilyChallenge.myChallenges() || [])
          .filter(function (c) { return c && !c.ended; });
        actifs.slice(0, 2).forEach(function (c) {
          lignes.push({
            emoji: '⚔️', col: c.isMeLeading ? '#4ade80' : '#f59e0b',
            titre: 'Duel · ' + ((c.opponent && c.opponent.name) || 'Membre'),
            detail: c.myScore + ' – ' + c.oppScore
                  + (c.daysLeft ? ' · ' + c.daysLeft + ' j restants' : ''),
            pct: null,
            action: 'AwakFamilyChallengeOpen()'
          });
        });
      }
    } catch (e) {}

    if (!lignes.length) return '';

    return '<div style="border-top:1px solid rgba(255,255,255,0.06);padding:9px 12px 4px;">'
      + '<div style="font-size:0.5em;letter-spacing:2px;color:#64748b;font-weight:900;margin-bottom:7px;">'
      +   '◈ EN COURS</div>'
      + lignes.map(function (l) {
          return '<div onclick="' + l.action + '" style="cursor:pointer;display:flex;align-items:center;'
            + 'gap:9px;padding:7px 9px;margin-bottom:5px;border-radius:10px;'
            + 'background:' + l.col + '12;border:1px solid ' + l.col + '2e;">'
            + '<span style="font-size:0.95em;flex-shrink:0;">' + l.emoji + '</span>'
            + '<span style="flex:1;min-width:0;">'
            +   '<span style="display:block;font-size:0.66em;font-weight:800;color:#e2e8f0;'
            +     'white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + esc(l.titre) + '</span>'
            +   '<span style="display:block;font-size:0.58em;color:#94a3b8;margin-top:1px;">'
            +     esc(l.detail) + '</span>'
            + '</span>'
            + (l.pct !== null
                ? ('<span style="flex-shrink:0;font-size:0.68em;font-weight:900;color:' + l.col + ';">'
                   + l.pct + ' %</span>')
                : '<span style="color:' + l.col + ';font-size:0.9em;flex-shrink:0;">›</span>')
            + '</div>';
        }).join('')
      + '</div>';
  }

  // 🧹 FERMETURE GLOBALE DES MODALES FAMILLE
  // ⚠️ Chaque modale ne retirait QUE la sienne (`getElementById(monId).remove()`).
  // Depuis que la Constellation ouvre plusieurs écrans (menu d'étoile → jeux,
  // défis, objectif…), on pouvait en empiler deux : la nouvelle s'affichait
  // SOUS l'ancienne, et il fallait fermer la première à la main.
  // Toute modale famille appelle désormais ceci avant de s'ouvrir.
  var AWAK_FAM_MODALES = [
    'awakFamBadges', 'awakFamilyManage', 'awakFamilyFeed', 'awakConstMenu',
    'awakFamilyModal', 'awakNudgeModal', 'awakInboxModal',
    'awakChallengeModal', 'awakCoopModal', 'awakGoalModal',
    'awakGamesPicker', 'awakGamesFamilyPicker', 'awakLocPicker'
  ];
  window.AwakFamCloseAll = function (sauf) {
    AWAK_FAM_MODALES.forEach(function (id) {
      if (id === sauf) return;
      var e = document.getElementById(id);
      if (e) e.remove();
    });
  };

  // 🏅 BADGES FAMILLE
  // --------------------------------------------------------------
  // Les défis ne laissaient AUCUNE trace une fois terminés : le tableau
  // awakFamilyChallenges ne garde que les défis en cours. On enregistre donc
  // les victoires à part, dans un compteur cumulatif — sans quoi un badge
  // « 5 défis gagnés » serait impossible à calculer.
  // ══════════════════════════════════════════════════════════════
  var FAM_BADGES = [
    { id: 'premier_duel', emoji: '⚔️', nom: 'Premier duel',
      desc: 'Gagner un défi',            seuil: 1,  cle: 'defisGagnes' },
    { id: 'duelliste',    emoji: '🏆', nom: 'Duelliste',
      desc: 'Gagner 5 défis',            seuil: 5,  cle: 'defisGagnes' },
    { id: 'champion',     emoji: '👑', nom: 'Champion de famille',
      desc: 'Gagner 15 défis',           seuil: 15, cle: 'defisGagnes' },
    { id: 'equipe',       emoji: '🤝', nom: 'Esprit d\'équipe',
      desc: 'Terminer 3 défis d\'équipe', seuil: 3,  cle: 'coopsFinis' },
    { id: 'objectif',     emoji: '🎯', nom: 'Cap tenu',
      desc: 'Atteindre un objectif commun', seuil: 1, cle: 'objectifsAtteints' },
    { id: 'soutien',      emoji: '💜', nom: 'Toujours là',
      desc: 'Envoyer 20 encouragements', seuil: 20, cle: 'encouragements' },
    { id: 'constellation', emoji: '✦', nom: 'Constellation',
      desc: 'Lier 3 membres à ta famille', seuil: 3, cle: 'membresLies' },
    { id: 'duo',          emoji: '🎮', nom: 'À deux c\'est mieux',
      desc: 'Faire 10 séances à deux',   seuil: 10, cle: 'seancesDuo' }
  ];

  var FB_KEY = 'awakFamBadgeStats';

  function _famStats() {
    try { return JSON.parse(localStorage.getItem(FB_KEY) || '{}'); }
    catch (e) { return {}; }
  }
  function _famStatsSave(o) {
    try { localStorage.setItem(FB_KEY, JSON.stringify(o || {})); } catch (e) {}
  }

  // Incrémente un compteur et signale les badges NOUVELLEMENT obtenus.
  window.AwakFamBadgeInc = function (cle, n) {
    var st = _famStats();
    var avant = st[cle] || 0;
    st[cle] = avant + (n || 1);
    _famStatsSave(st);
    // Un badge vient-il d'être franchi ?
    FAM_BADGES.forEach(function (b) {
      if (b.cle !== cle) return;
      if (avant < b.seuil && st[cle] >= b.seuil) {
        try {
          if (typeof window.showToast === 'function') {
            window.showToast(b.emoji + ' Badge débloqué : ' + b.nom + ' !', 'success', 4000);
          }
        } catch (e) {}
      }
    });
    return st[cle];
  };

  window.AwakFamBadges = function () {
    var st = _famStats();
    // Membres liés : compté en direct, pas besoin d'un compteur.
    try { st.membresLies = myRelations().length; } catch (e) {}
    return FAM_BADGES.map(function (b) {
      var v = st[b.cle] || 0;
      return { id: b.id, emoji: b.emoji, nom: b.nom, desc: b.desc,
               seuil: b.seuil, valeur: v, obtenu: v >= b.seuil };
    });
  };

  // 🏅 Carte des badges, ouverte depuis l'icône de la Constellation.
  window.AwakFamBadgesOpen = function () {
    try { if (window.AwakFamCloseAll) window.AwakFamCloseAll(); } catch (e) {}
    document.getElementById('awakFamBadges')?.remove();
    var b = window.AwakFamBadges();
    var n = b.filter(function (x) { return x.obtenu; }).length;
    var ov = document.createElement('div');
    ov.id = 'awakFamBadges';
    ov.style.cssText = 'position:fixed;inset:0;z-index:11000;background:rgba(0,0,0,0.88);'
      + 'backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;'
      + 'padding:16px;overflow-y:auto;';
    ov.innerHTML =
      '<div style="width:100%;max-width:440px;margin:auto;background:linear-gradient(160deg,#0f1512,#0a0b0d);'
    +   'border:1.5px solid rgba(74,222,128,0.40);border-radius:22px;padding:18px;'
    +   'box-shadow:0 0 40px rgba(74,222,128,0.16);">'
    +   '<div style="width:36px;height:4px;background:rgba(255,255,255,0.18);border-radius:99px;margin:0 auto 14px;"></div>'
    +   '<div style="display:flex;align-items:baseline;justify-content:space-between;margin-bottom:14px;">'
    +     '<span style="font-size:0.56em;letter-spacing:2.5px;color:#4ade80;font-weight:900;">🏅 BADGES DE FAMILLE</span>'
    +     '<span style="font-size:0.72em;color:#94a3b8;font-weight:700;">' + n + ' / ' + b.length + '</span>'
    +   '</div>'
    +   '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:9px;">'
    +   b.map(function (x) {
          return '<div style="padding:12px 10px;border-radius:13px;text-align:center;'
            + 'background:' + (x.obtenu ? 'rgba(74,222,128,0.10)' : 'rgba(255,255,255,0.03)') + ';'
            + 'border:1px solid ' + (x.obtenu ? 'rgba(74,222,128,0.35)' : 'rgba(255,255,255,0.07)') + ';">'
            + '<div style="font-size:1.7em;line-height:1;margin-bottom:6px;'
            +   (x.obtenu ? '' : 'filter:grayscale(1);opacity:0.35;') + '">' + x.emoji + '</div>'
            + '<div style="font-size:0.66em;font-weight:800;color:'
            +   (x.obtenu ? '#4ade80' : '#64748b') + ';">' + x.nom + '</div>'
            + '<div style="font-size:0.56em;color:#475569;margin-top:3px;line-height:1.3;">' + x.desc + '</div>'
            + '<div style="font-size:0.58em;color:' + (x.obtenu ? '#4ade80' : '#475569')
            +   ';font-weight:800;margin-top:5px;">' + Math.min(x.valeur, x.seuil) + ' / ' + x.seuil + '</div>'
            + '</div>';
        }).join('')
    +   '</div>'
    +   '<button onclick="document.getElementById(\'awakFamBadges\').remove()" '
    +     'style="width:100%;padding:12px;margin-top:14px;border-radius:13px;cursor:pointer;'
    +     'background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.12);'
    +     'color:#94a3b8;font-size:0.75em;font-weight:800;letter-spacing:1px;">FERMER</button>'
    + '</div>';
    ov.onclick = function (e) { if (e.target === ov) ov.remove(); };
    document.body.appendChild(ov);
  };

  // 👨‍👩‍👧 GESTION DE LA FAMILLE — modale unique.
  // La carte « Ma famille » restait sous la constellation uniquement parce
  // qu'elle portait l'ajout de membre et le journal. On la déplace ici pour
  // que la constellation soit le seul point d'entrée de l'onglet.
  window.AwakFamilyManage = function () {
    try { if (window.AwakFamCloseAll) window.AwakFamCloseAll(); } catch (e) {}
    document.getElementById('awakFamilyManage')?.remove();
    var ov = document.createElement('div');
    ov.id = 'awakFamilyManage';
    ov.style.cssText = 'position:fixed;inset:0;z-index:11000;background:rgba(0,0,0,0.88);'
      + 'backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;'
      + 'padding:16px;overflow-y:auto;';
    var contenu = '';
    try {
      contenu = (window.AwakFamily && typeof window.AwakFamily.renderCard === 'function')
        ? window.AwakFamily.renderCard() : '';
    } catch (e) {}
    ov.innerHTML =
      '<div style="width:100%;max-width:460px;margin:auto;">'
    +   '<div style="width:36px;height:4px;background:rgba(255,255,255,0.18);border-radius:99px;margin:0 auto 14px;"></div>'
    +   (contenu || '<div style="color:#64748b;text-align:center;padding:24px;">Aucune famille pour l\'instant.</div>')
    +   '<button onclick="document.getElementById(\'awakFamilyManage\').remove()" '
    +     'style="width:100%;padding:12px;margin-top:4px;border-radius:13px;cursor:pointer;'
    +     'background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.12);'
    +     'color:#94a3b8;font-size:0.75em;font-weight:800;letter-spacing:1px;">FERMER</button>'
    + '</div>';
    ov.onclick = function (e) { if (e.target === ov) ov.remove(); };
    document.body.appendChild(ov);
  };

  // 📖 Journal familial en modale (même raison).
  window.AwakFamilyFeedOpen = function () {
    try { if (window.AwakFamCloseAll) window.AwakFamCloseAll(); } catch (e) {}
    document.getElementById('awakFamilyFeed')?.remove();
    var ov = document.createElement('div');
    ov.id = 'awakFamilyFeed';
    ov.style.cssText = 'position:fixed;inset:0;z-index:11000;background:rgba(0,0,0,0.88);'
      + 'backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;'
      + 'padding:16px;overflow-y:auto;';
    var contenu = '';
    try {
      contenu = (window.AwakFamilyFeed && typeof window.AwakFamilyFeed.render === 'function')
        ? window.AwakFamilyFeed.render() : '';
    } catch (e) {}
    ov.innerHTML =
      '<div style="width:100%;max-width:460px;margin:auto;background:linear-gradient(160deg,#12101a,#0b0b0f);'
    +   'border:1px solid rgba(236,72,153,0.22);border-radius:20px;padding:18px;">'
    +   '<div style="width:36px;height:4px;background:rgba(255,255,255,0.18);border-radius:99px;margin:0 auto 14px;"></div>'
    +   '<div style="font-size:0.56em;letter-spacing:2.5px;color:#ec4899;font-weight:900;margin-bottom:12px;">◈ JOURNAL FAMILIAL</div>'
    +   (contenu || '<div style="color:#64748b;text-align:center;padding:20px;font-size:0.85em;">Rien à raconter pour l\'instant.</div>')
    +   '<button onclick="document.getElementById(\'awakFamilyFeed\').remove()" '
    +     'style="width:100%;padding:12px;margin-top:12px;border-radius:13px;cursor:pointer;'
    +     'background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.12);'
    +     'color:#94a3b8;font-size:0.75em;font-weight:800;letter-spacing:1px;">FERMER</button>'
    + '</div>';
    ov.onclick = function (e) { if (e.target === ov) ov.remove(); };
    document.body.appendChild(ov);
  };

  // ✦ MENU D'UNE ÉTOILE — toucher un membre ouvre ses actions.
  // Avant, toucher envoyait directement un encouragement : c'était la seule
  // interaction possible et elle ne laissait aucun choix. Le menu ouvre les
  // trois actions qui concernent CE membre.
  window.AwakConstMenu = function (memberId) {
    var liens = myRelations();
    var lien = liens.find(function (r) { return r.member.id === memberId; });
    if (!lien) return;
    var st = memberWeekStats(memberId);
    var enf = false;
    try {
      enf = !!(window.AwakYouth && typeof window.AwakYouth.isChild === 'function'
               && window.AwakYouth.isChild());
    } catch (e) {}

    try { if (window.AwakFamCloseAll) window.AwakFamCloseAll(); } catch (e) {}
    document.getElementById('awakConstMenu')?.remove();
    var ov = document.createElement('div');
    ov.id = 'awakConstMenu';
    ov.style.cssText = 'position:fixed;inset:0;z-index:11000;background:rgba(0,0,0,0.88);'
      + 'backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:16px;';

    var act = function (emoji, label, sous, fn, couleur) {
      return '<button onclick="' + fn + '" style="width:100%;display:flex;align-items:center;gap:13px;'
        + 'padding:14px 15px;margin-bottom:9px;border-radius:14px;cursor:pointer;text-align:left;'
        + 'background:rgba(255,255,255,0.04);border:1px solid ' + couleur + '33;">'
        // 🎨 Icône dans un CADRE coloré (maquette) : chaque action se
        // distingue au premier coup d'œil, sans lire le texte.
        + '<div style="flex-shrink:0;width:42px;height:42px;border-radius:12px;'
        +   'background:' + couleur + '1c;border:1px solid ' + couleur + '40;'
        +   'display:flex;align-items:center;justify-content:center;font-size:1.25em;">'
        +   emoji + '</div>'
        + '<div style="flex:1;min-width:0;">'
        +   '<div style="font-size:0.86em;font-weight:800;color:#f1f5f9;">' + label + '</div>'
        +   '<div style="font-size:0.68em;color:#94a3b8;margin-top:2px;">' + sous + '</div>'
        + '</div>'
        + '<div style="color:' + couleur + ';font-size:1.1em;">›</div></button>';
    };

    var etat = st.seances
      ? (enf ? 'A bougé cette semaine' : st.seances + ' séance' + (st.seances > 1 ? 's' : '') + ' cette semaine')
      : 'Pas encore bougé cette semaine';

    ov.innerHTML =
      // ✨ Bordure et halo VERTS (maquette) : la modale se détache du ciel
      // étoilé au lieu de s'y fondre. Coins uniformes — elle flotte au centre
      // depuis v890, elle n'est plus calée en bas d'écran.
      '<div style="width:100%;max-width:440px;background:linear-gradient(160deg,#0f1512,#0a0b0d);'
    +   'border:1.5px solid rgba(74,222,128,0.45);border-radius:22px;padding:18px;'
    +   'box-shadow:0 0 40px rgba(74,222,128,0.18),0 12px 40px rgba(0,0,0,0.6);">'
    +   '<div style="width:36px;height:4px;background:rgba(255,255,255,0.18);border-radius:99px;margin:0 auto 16px;"></div>'
    +   '<div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">'
    // ⚠️ _av() et non esc() : les avatars modernes sont des clés « av:… »
    // qui doivent devenir un SVG. Sans conversion, la clé s'affichait en
    // texte brut (« av:sword ») à la place de l'image.
    +     '<div style="flex-shrink:0;">' + _av(lien.member.avatar, 40) + '</div>'
    +     '<div style="flex:1;min-width:0;">'
    +       '<div style="font-size:1.05em;font-weight:900;color:#fff;">' + esc(lien.member.name || 'Membre') + '</div>'
    +       '<div style="font-size:0.7em;color:#ec4899;font-weight:700;">'
    +         ((lien.relation && lien.relation.emoji) || '') + ' ' + esc((lien.relation && lien.relation.label) || '') + '</div>'
    +       '<div style="font-size:0.68em;color:#94a3b8;margin-top:2px;">' + etat + '</div>'
    +     '</div>'
    +   '</div>'
    +   act('💜', 'Envoyer un encouragement', 'Un mot pour lui donner envie',
          "AwakConstAction('nudge','" + memberId + "')", '#ec4899')
    +   act('🎮', 'Jouer à deux', 'Une séance à faire ensemble',
          "AwakConstAction('games','" + memberId + "')", '#a855f7')
    // ⚔️ Le défi 1 contre 1 est COMPÉTITIF : jamais proposé à un enfant.
    +   (enf ? '' : act('⚔️', 'Lancer un défi', 'Qui en fera le plus cette semaine ?',
          "AwakConstAction('challenge','" + memberId + "')", '#f59e0b'))
    // ✏️ Modifier le lien : c'était impossible depuis la constellation, alors
    // que toucher le nom d'un membre est le geste naturel pour ça.
    +   act('✏️', 'Modifier le lien', 'Changer la relation ou retirer ce membre',
          "AwakConstAction('edit','" + memberId + "')", '#94a3b8')
    +   '<button onclick="document.getElementById(\'awakConstMenu\').remove()" '
    +     'style="width:100%;padding:12px;margin-top:5px;border-radius:13px;cursor:pointer;'
    +     'background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.12);'
    +     'color:#94a3b8;font-size:0.75em;font-weight:800;letter-spacing:1px;">FERMER</button>'
    + '</div>';
    ov.onclick = function (e) { if (e.target === ov) ov.remove(); };
    document.body.appendChild(ov);
  };

  window.AwakConstAction = function (quoi, memberId) {
    try { if (window.AwakFamCloseAll) window.AwakFamCloseAll(); } catch (e) {}
    document.getElementById('awakConstMenu')?.remove();
    try {
      if (quoi === 'nudge' && typeof window.AwakFamilyNudge === 'function') {
    // 🏅 Compter l'encouragement envoyé (badge « Toujours là »).
    try { if (typeof window.AwakFamBadgeInc === 'function') window.AwakFamBadgeInc('encouragements', 1); } catch (e) {}
        window.AwakFamilyNudge(memberId);
      } else if (quoi === 'games' && typeof window.AwakGamesOpen === 'function') {
        window.AwakGamesOpen();
      } else if (quoi === 'challenge') {
        // ⚠️ On ouvre DIRECTEMENT le choix du type pour CE membre.
        // Avant, on appelait AwakFamilyChallengeOpen() sans transmettre
        // l'identifiant : le sélecteur ne savait pas qui était visé, donc
        // le filtre « enfant » ne s'appliquait pas et tous les types de
        // défi restaient proposés.
        if (typeof window.AwakChallengePickMember === 'function') {
          window.AwakChallengePickMember(memberId);
        } else if (typeof window.AwakFamilyChallengeOpen === 'function') {
          window.AwakFamilyChallengeOpen();
        }
      } else if (quoi === 'edit' && typeof window.AwakFamilyEdit === 'function') {
        window.AwakFamilyEdit(memberId);
      }
    } catch (e) {}
  };

  // ✦ LA CONSTELLATION DES ANCRES
  // ------------------------------------------------------------------
  // Équivalent famille de la Carte de l'Effacement : au lieu d'empiler
  // des cartes, on montre le foyer comme un ciel. Le profil actif est
  // l'étoile centrale ; chaque membre lié gravite autour, relié par un
  // fil de lumière. L'éclat d'une étoile dépend de son activité récente :
  // une famille qui bouge brille, une famille à l'arrêt s'éteint.
  // Tout en SVG — aucune image à charger, aucune donnée envoyée.
  // ══════════════════════════════════════════════════════════════════
  function _constEclat(seances) {
    if (seances >= 5) return { c: '#fbbf24', r: 7.5, o: 1 };     // or
    if (seances >= 3) return { c: '#4ade80', r: 6.5, o: 0.95 };  // vert
    if (seances >= 1) return { c: '#38bdf8', r: 5.5, o: 0.85 };  // bleu
    return { c: '#64748b', r: 4.5, o: 0.5 };                     // éteinte
  }

  function renderConstellation() {
    var moi = currentId();
    var liens = myRelations();
    // 🧒 PROFIL ENFANT : on retire toute lecture COMPARATIVE. L'enfant voit
    // que les autres sont là et s'ils ont bougé (couleur de l'étoile), mais
    // pas leur décompte de séances — sinon « papa 5 / moi 0 » devient une
    // comparaison, exactement ce que le reste de l'app évite déjà pour eux.
    var estEnfant = false;
    try {
        estEnfant = !!(window.AwakYouth && typeof window.AwakYouth.isChild === 'function'
                       && window.AwakYouth.isChild());
    } catch (e) {}
    // ⚠️ Un joueur SEUL doit voir sa constellation : son étoile brille déjà,
    // et le ciel vide donne envie d'y ajouter quelqu'un. Renvoyer '' faisait
    // que la refonte semblait n'avoir jamais été appliquée.
    var solo = !liens.length;

    var membres = liens.map(function (r) {
      var st = memberWeekStats(r.member.id);
      return {
        id: r.member.id,
        nom: r.member.name || 'Membre',
        avatar: r.member.avatar || '🙂',
        relation: (r.relation && r.relation.label) || '',
        seances: st.seances,
        jours: st.joursActifs
      };
    });

    // Moi au centre
    var moiSt = memberWeekStats(moi);
    var moiE = _constEclat(moiSt.seances);

    // Étoiles réparties en cercle, la première en haut
    var n = membres.length;
    var rayon = n <= 2 ? 78 : (n <= 4 ? 88 : 96);
    // (si solo, la boucle ci-dessous ne s'exécute pas : pas de division par 0)
    var etoiles = '', fils = '', total = moiSt.seances;

    membres.forEach(function (m, i) {
      var a = (-90 + (360 / n) * i) * Math.PI / 180;
      var x = 150 + Math.cos(a) * rayon;
      var y = 150 + Math.sin(a) * rayon;
      var e = _constEclat(m.seances);
      total += m.seances;

      // fil de lumière vers le centre — plus vif si le membre est actif
      fils += '<line x1="150" y1="150" x2="' + x.toFixed(1) + '" y2="' + y.toFixed(1) + '" '
        + 'stroke="' + e.c + '" stroke-width="' + (m.seances ? 1 : 0.6) + '" '
        + 'opacity="' + (m.seances ? 0.32 : 0.14) + '"/>';

      var dur = (3 + (i % 4) * 0.7).toFixed(1);
      etoiles += '<g style="cursor:pointer;" onclick="AwakConstMenu(\'' + m.id + '\')">'
        + '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="26" fill="transparent"/>'
        + '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + (e.r + 9) + '" fill="' + e.c + '" fill-opacity="0.10"/>'
        + '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + e.r + '" fill="' + e.c + '" '
        +   'opacity="' + e.o + '" filter="url(#constLueur)">'
        +   (m.seances ? '<animate attributeName="opacity" values="' + e.o + ';' + (e.o * 0.6) + ';' + e.o
              + '" dur="' + dur + 's" repeatCount="indefinite"/>' : '')
        + '</circle>'
        // Police agrandie : sur mobile, 8,5 px SVG ne faisait que ~10 px réels.
        + '<text x="' + x.toFixed(1) + '" y="' + (y + e.r + 16).toFixed(1) + '" text-anchor="middle" '
        +   'fill="#f1f5f9" font-size="11" font-weight="800">' + esc(m.nom) + '</text>'
        + '<text x="' + x.toFixed(1) + '" y="' + (y + e.r + 28).toFixed(1) + '" text-anchor="middle" '
        +   'fill="' + e.c + '" font-size="10" font-weight="800">'
        +   (estEnfant
              ? (m.seances ? 'a bougé' : 'en sommeil')
              : (m.seances ? m.seances + ' séance' + (m.seances > 1 ? 's' : '') : 'en sommeil')) + '</text>'
        + '</g>';
    });

    // Objectif commun : anneau de progression autour de la constellation
    var anneau = '';
    try {
      if (window.AwakFamilyGoal && typeof window.AwakFamilyGoal.status === 'function') {
        var g = window.AwakFamilyGoal.status();
        if (g && typeof g.pct === 'number') {
          var C = 2 * Math.PI * 132;
          // 🎯 L'anneau EST l'objectif commun : le toucher l'ouvre.
          anneau = '<g style="cursor:pointer;" onclick="AwakFamilyGoalOpen()">'
            + '<circle cx="150" cy="150" r="132" fill="none" stroke="transparent" stroke-width="22"/>'
            + '<circle cx="150" cy="150" r="132" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="3"/>'
            + '<circle cx="150" cy="150" r="132" fill="none" stroke="#22c55e" stroke-width="3" '
            + 'stroke-linecap="round" stroke-dasharray="' + (C * g.pct / 100).toFixed(1) + ' ' + C.toFixed(1) + '" '
            + 'transform="rotate(-90 150 150)" opacity="0.75"/>'
            + '<text x="150" y="26" text-anchor="middle" fill="#22c55e" font-size="9" font-weight="900">'
            + g.pct + ' %</text></g>';
        }
      }
    } catch (e) {}

    return '<div style="position:relative;border-radius:18px;overflow:hidden;'
      +   'background:#07070b;'
      +   'border:1px solid rgba(236,72,153,0.22);margin-bottom:14px;">'
      +   '<svg viewBox="0 0 300 300" style="width:100%;height:auto;display:block;">'
      +     '<defs><filter id="constLueur"><feGaussianBlur stdDeviation="3" result="b"/>'
      +       '<feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>'
      // 🌌 Nébuleuse de fond : remplace la poussière d'étoiles dessinée.
      +     '<image href="images/constellation_bg.webp?v=989" x="0" y="0" width="300" height="300" '
      +       'preserveAspectRatio="xMidYMid slice" opacity="0.95"/>'
      +     anneau
      +     fils
      +     etoiles
      // étoile centrale : moi
      // ⌖ Mon étoile : ouvre le défi d'équipe (l'action collective).
      +     '<g style="cursor:pointer;" onclick="AwakCoopOpen()">'
      +     '<circle cx="150" cy="150" r="30" fill="transparent"/>'
      +     '<circle cx="150" cy="150" r="' + (moiE.r + 12) + '" fill="' + moiE.c + '" fill-opacity="0.12"/>'
      +     '<circle cx="150" cy="150" r="' + (moiE.r + 2) + '" fill="' + moiE.c + '" filter="url(#constLueur)"/>'
      +     '<circle cx="150" cy="150" r="' + (moiE.r + 11) + '" fill="none" stroke="' + moiE.c + '" stroke-width="1" opacity="0.4">'
      +       '<animate attributeName="r" values="' + (moiE.r + 9) + ';' + (moiE.r + 20) + ';' + (moiE.r + 9)
      +         '" dur="4.2s" repeatCount="indefinite"/>'
      +       '<animate attributeName="opacity" values="0.4;0;0.4" dur="4.2s" repeatCount="indefinite"/>'
      +     '</circle>'
      +     '</g>'
      +   '</svg>'
      +   '<div style="position:absolute;top:0;left:0;right:0;padding:11px 13px 22px;'
      +     'background:linear-gradient(180deg,rgba(8,9,12,0.85),rgba(8,9,12,0));'
      +     'display:flex;align-items:baseline;justify-content:space-between;pointer-events:none;">'
      +     '<div style="font-size:0.56em;letter-spacing:2.5px;color:#ec4899;font-weight:900;">✦ CONSTELLATION DES ANCRES</div>'
      +     '<div style="font-size:0.52em;letter-spacing:1.5px;color:#64748b;font-weight:800;">'
      +       (membres.length + 1) + ' ÉTOILES</div>'

      +   '</div>'
      // ⚠️ EN FLUX, pas en position:absolute — les boutons du pied (v900)
      // passaient sous ce bandeau et le texte se chevauchait.
      +   '<div style="padding:10px 13px 9px;background:rgba(8,9,12,0.55);font-size:0.6em;'
      +     'border-top:1px solid rgba(255,255,255,0.05);">'
      +     (solo
                ? '<span style="color:#64748b;">Ton étoile veille seule. Lie un proche pour agrandir la constellation.</span>'
                : (estEnfant
                    ? (total
                        ? '<span style="color:#4ade80;font-weight:800;">Votre ciel brille</span><span style="color:#475569;"> — touche une étoile pour envoyer un message</span>'
                        : '<span style="color:#64748b;">Le ciel dort. Bouge un peu et il s\'allume.</span>')
                    : (total
                        ? ('<span style="color:#4ade80;font-weight:800;">' + total + ' séance' + (total > 1 ? 's' : '') + ' cette semaine</span><span style="color:#475569;"> — touche une étoile pour encourager</span>')
                        : '<span style="color:#64748b;">Le ciel est calme. Une séance et il s\'allume.</span>')))
      +   '</div>'
      // 👨‍👩‍👧 Deux accès discrets, pour ce que la constellation ne peut pas
      // montrer : ajouter/retirer un membre, et l'historique familial.
      // 💜 Encouragements REÇUS : la constellation permet d'en envoyer (menu
      // d'étoile) mais pas de lire ceux qu'on reçoit. Bandeau affiché
      // uniquement s'il y en a, pour ne pas ajouter une ligne vide.
      +   (function () {
            var n = 0;
            try { n = pendingNudges().length; } catch (e) {}
            if (!n) return '';
            return '<div onclick="AwakFamilyNudgeOpenInbox()" style="cursor:pointer;'
              + 'border-top:1px solid rgba(236,72,153,0.20);background:rgba(236,72,153,0.08);'
              + 'padding:11px 14px;display:flex;align-items:center;gap:9px;">'
              + '<span style="font-size:1.05em;">💜</span>'
              + '<span style="flex:1;min-width:0;font-size:0.7em;color:#f9a8d4;font-weight:800;">'
              +   n + ' encouragement' + (n > 1 ? 's' : '') + ' reçu' + (n > 1 ? 's' : '') + '</span>'
              + '<span style="color:#ec4899;font-size:0.95em;">›</span>'
              + '</div>';
          })()
      // 📋 Rappel des défis et objectifs en cours (rien s'il n'y en a pas).
      +   _enCoursBandeau()
      +   '<div style="display:flex;border-top:1px solid rgba(255,255,255,0.06);">'
      // 🏅 Accès aux badges de famille, dans la barre du pied de carte.
      // 🎯 Accès à l'objectif commun. ⚠️ Avant, il n'existait QUE via l'anneau
      // vert — lequel n'est dessiné que si un objectif est DÉJÀ actif. Sans
      // objectif en cours, il n'y avait donc aucun moyen d'en créer un depuis
      // la Constellation, seul écran de l'onglet depuis v902.
      +     '<button onclick="AwakFamilyGoalOpen()" style="flex:1;padding:11px;background:transparent;'
      +       'border:none;border-right:1px solid rgba(255,255,255,0.06);color:#4ade80;'
      +       'font-size:0.64em;font-weight:800;letter-spacing:1px;cursor:pointer;">🎯 OBJECTIF</button>'
      +     '<button onclick="AwakFamBadgesOpen()" style="flex:1;padding:11px;background:transparent;'
      +       'border:none;border-right:1px solid rgba(255,255,255,0.06);color:#4ade80;'
      +       'font-size:0.64em;font-weight:800;letter-spacing:1px;cursor:pointer;">🏅 BADGES</button>'
      +     '<button onclick="AwakFamilyManage()" style="flex:1;padding:11px;background:transparent;'
      +       'border:none;border-right:1px solid rgba(255,255,255,0.06);color:#94a3b8;'
      +       'font-size:0.64em;font-weight:800;letter-spacing:1px;cursor:pointer;">👨‍👩‍👧 MA FAMILLE</button>'
      +     '<button onclick="AwakFamilyFeedOpen()" style="flex:1;padding:11px;background:transparent;'
      +       'border:none;color:#94a3b8;font-size:0.64em;font-weight:800;letter-spacing:1px;cursor:pointer;">'
      +       '📖 JOURNAL</button>'
      +   '</div>'
      + '</div>';
  }

  // (Poussière d'étoiles dessinée RETIRÉE en v875 : remplacée par la
  // vraie nébuleuse images/constellation_bg.webp)
  // (exposé plus bas, dans l'objet window.AwakFamily unique — l'exposer ici
  //  ne servait à rien : l'affectation `window.AwakFamily = {...}` de la fin
  //  du fichier écrasait l'objet et supprimait cette fonction.)

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
  // 💜 ENCOURAGER, PAS SURVEILLER.
  // Les relances doivent donner envie, jamais culpabiliser : « Tu n'as pas fait
  // de séance depuis 5 jours » et « On en fait une ensemble ? » disent la même
  // chose et produisent l'inverse. Pools élargis pour ne pas répéter le même
  // message, et formulés comme une invitation — pas comme un rappel à l'ordre.
  function nudgeMessage(relationType, memberName) {
    var name = memberName || 'toi';
    var byRel = {
      couple: [
        'On en fait une ensemble, ' + name + ' ? 💞',
        'Je pense à toi ❤️',
        'Qui commence en premier ? 😎',
        'On lâche rien 🔥',
        'Même 10 minutes, ça compte 💪',
        'Ta séance quand tu veux — je suis là 💜'
      ],
      parent: [
        'Fier de toi, ' + name + ' 👏',
        'On bouge ensemble aujourd\'hui ? 💪',
        'Prends ton temps, mais reviens quand tu peux ❤️',
        'Une petite séance à deux, ça te dit ? 😊',
        'Je pense à toi 💜',
        'Chaque pas compte, ' + name + ' 🌱'
      ],
      enfant: [
        'On s\'entraîne ensemble, ' + name + ' ? 😃',
        'Prêt pour une mission ? 🎮',
        'On bouge un peu aujourd\'hui ? 🔥',
        'T\'es capable, je le sais 💪',
        'Qui commence en premier ? 😎',
        'On fait un jeu à deux ? 🎯'
      ],
      sibling: [
        'Qui commence en premier ? 😎',
        'On lâche rien 🔥',
        'Une séance ensemble, ' + name + ' ? 💪',
        'Je pense à toi 👊',
        'On se motive mutuellement ? ⚡',
        'Même petite, une séance reste une séance 💪'
      ],
      autre: [
        'On en fait une ensemble ? 💪',
        'Je pense à toi 💜',
        'Ça te dit de bouger un peu ? 🔥',
        'Quand tu veux — je suis là 😊',
        'Même 10 minutes, ça compte ⚡',
        'On lâche rien 🌟'
      ]
    };
    var pool = byRel[relationType] || byRel.autre;
    return pool[Math.floor(Math.random() * pool.length)];
  }


  window.AwakFamily = {
    renderConstellation: renderConstellation,
    REL_TYPES: REL_TYPES,
    OFFERABLE: OFFERABLE,
    setRelation: setRelation,
    removeRelation: removeRelation,
    relationOf: relationOf,
    myRelations: myRelations,
    memberStatus: memberStatus,
    memberWeekStats: memberWeekStats,
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
        +   (function () {
              // 📊 Trois chiffres pour donner une identité au membre — sans classement.
              var ws = memberWeekStats(r.member.id);
              // 🧒 Profil enfant : pas de décompte des autres — on dit
              // seulement s'ils ont bougé, sans chiffre à comparer.
              var _enf = false;
              try {
                  _enf = !!(window.AwakYouth && typeof window.AwakYouth.isChild === 'function'
                            && window.AwakYouth.isChild());
              } catch (e) {}
              if (!ws.seances) return '<div style="font-size:0.68em;color:#64748b;margin-top:2px;">Pas encore de séance cette semaine</div>';
              if (_enf) return '<div style="font-size:0.68em;color:#4ade80;margin-top:2px;">🏋️ A bougé cette semaine</div>';
              return '<div style="font-size:0.68em;color:#94a3b8;margin-top:2px;">'
                + '🏋️ ' + ws.seances + ' séance' + (ws.seances > 1 ? 's' : '')
                + '<span style="color:#475569;"> · </span>'
                + '🔥 ' + ws.joursActifs + ' jour' + (ws.joursActifs > 1 ? 's' : '')
                + '</div>';
            })()
        + '</div>'
        + '<button onclick="AwakFamilyEdit(\'' + r.member.id + '\')" style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:#94a3b8;border-radius:9px;padding:6px 11px;font-size:0.72em;font-weight:700;cursor:pointer;">Modifier</button>'
        + '</div>';
    }).join('');

    if (!mine.length) {
      rows = '<div style="font-size:0.78em;color:#64748b;text-align:center;padding:14px 0;">Aucun lien pour l\'instant. Ajoute un membre de ta famille ci-dessous.</div>';
    }


    // 📊 RÉCAP HEBDO — vue d'ensemble immédiate de l'état de la famille.
    // Sans ça, on voit la liste des membres mais aucune idée de la dynamique
    // collective : qui bouge, combien de séances, où en est l'objectif.
    var recap = '';
    try {
      var _debut = Date.now() - 7 * 24 * 60 * 60 * 1000;
      var _ids = mine.map(function (r) { return r.member.id; });
      _ids.push(me);
      var _seances = 0, _joursActifs = {};
      _ids.forEach(function (pid) {
        var h = [];
        try {
          var raw = localStorage.getItem('profile_' + pid + '_workoutHistory');
          if (!raw && pid === me) raw = localStorage.getItem('workoutHistory');
          h = raw ? JSON.parse(raw) : [];
        } catch (e) { h = []; }
        (h || []).forEach(function (w) {
          var t = w && w.date ? Date.parse(w.date) : (w && w.id ? w.id : 0);
          if (t >= _debut) {
            _seances++;
            _joursActifs[new Date(t).toDateString()] = true;
          }
        });
      });
      var _pct = null;
      try {
        if (window.AwakFamilyGoal && typeof window.AwakFamilyGoal.status === 'function') {
          var _st = window.AwakFamilyGoal.status();
          if (_st && typeof _st.pct === 'number') _pct = Math.round(_st.pct);
        }
      } catch (e) {}
      var _bits = ['🏋️ ' + _seances + ' séance' + (_seances > 1 ? 's' : ''),
                   '🔥 ' + Object.keys(_joursActifs).length + ' jour' + (Object.keys(_joursActifs).length > 1 ? 's' : '') + ' actif' + (Object.keys(_joursActifs).length > 1 ? 's' : '')];
      if (_pct !== null) _bits.push('🎯 ' + _pct + ' % de l\'objectif');
      recap = '<div style="background:rgba(236,72,153,0.06);border:1px solid rgba(236,72,153,0.16);border-radius:12px;padding:9px 12px;margin-bottom:12px;">'
        + '<div style="font-size:0.6em;color:#ec4899;font-weight:800;letter-spacing:1px;margin-bottom:4px;">CETTE SEMAINE</div>'
        + '<div style="font-size:0.78em;color:#e2e8f0;">' + _bits.join('<span style="color:#475569;"> · </span>') + '</div>'
        + '</div>';
    } catch (e) { recap = ''; }

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
      + recap
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
    // 🧹 Fermer toute autre modale famille avant d'ouvrir celle-ci.
    try { if (window.AwakFamCloseAll) window.AwakFamCloseAll(); } catch (e) {}
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
        +   '<div><div style="font-size:0.9em;font-weight:800;color:#4ade80;">Famille en mouvement 🌟</div>'
        +   '<div style="font-size:0.74em;color:#94a3b8;">Tout le monde a bougé récemment. Beau travail à tous.</div></div>'
        + '</div></div>';
    }

    var rows = list.map(function (x) {
      var st = x.status;
      // 🎨 Pas de ROUGE : un membre qui n'a pas bougé n'est pas en faute. Le rouge
      // est une couleur d'alerte, elle transforme une invitation en reproche.
      var color = st.level === 'inactive' || st.level === 'never' ? '#a78bfa' : '#f59e0b';
      // 📝 Formulations tournées vers l'action à venir, pas vers le manquement passé.
      var when;
      if (st.level === 'never') when = 'Sa première séance l\'attend';
      else if (st.days === 0) when = 'Pas encore bougé aujourd\'hui';
      else if (st.days === 1) when = 'A bougé hier';
      else if (st.days <= 6) when = 'N\'a pas encore bougé cette semaine';
      else when = 'Ça fait un moment — un petit mot ?';
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
      +   '<div><div style="font-size:0.62em;font-weight:800;letter-spacing:0.5px;color:#f59e0b;">ENCOURAGEMENTS</div>'
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
    // 🧹 Fermer toute autre modale famille avant d'ouvrir celle-ci.
    try { if (window.AwakFamCloseAll) window.AwakFamCloseAll(); } catch (e) {}
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
    // 🧹 Fermer toute autre modale famille avant d'ouvrir celle-ci.
    try { if (window.AwakFamCloseAll) window.AwakFamCloseAll(); } catch (e) {}
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
