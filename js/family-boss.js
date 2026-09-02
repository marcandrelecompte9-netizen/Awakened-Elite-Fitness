/* ═══════════════════════════════════════════════════════════════════
   BOSS FAMILIAL — combat coopératif entre les profils du même appareil
   ───────────────────────────────────────────────────────────────────
   Principe : un boss commun à TOUS les profils, stocké dans une clé
   GLOBALE partagée (hors GAME_KEYS, donc jamais isolée par profil).
   Chaque membre l'attaque à son rythme : à la fin d'une séance, le volume
   + l'Xp gagnés se convertissent en dégâts, signés par le profil actif.
   Les dégâts de tous s'additionnent. À la victoire, tout le monde gagne,
   avec un BONUS pour le plus gros contributeur. N'importe quel membre peut
   ensuite invoquer le boss suivant.
   100 % local : aucun serveur, aucune synchro réseau.
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

  // Clé GLOBALE partagée entre profils. Ne JAMAIS l'ajouter à GAME_KEYS,
  // sinon switchProfile l'isolerait et casserait le partage.
  var BOSS_KEY = 'awakFamilyBoss';

  // ── Catalogue de boss familiaux ────────────────────────────────────
  // hp calibré pour ~plusieurs séances de plusieurs membres.
  var FAMILY_BOSSES = [
    { id: 'colosse',   name: 'Colosse de Pierre',   emoji: '🗿', hp: 5000,  color: '#94a3b8',
      desc: 'Un géant de granit réveillé. Seule la constance de toute la famille peut le fissurer.' },
    { id: 'hydre',     name: 'Hydre des Abysses',   emoji: '🐉', hp: 8000,  color: '#06b6d4',
      desc: 'Chaque tête repousse. Il faut frapper vite, ensemble, sans relâche.' },
    { id: 'golem',     name: 'Golem Runique',       emoji: '🌋', hp: 12000, color: '#f59e0b',
      desc: 'Forgé dans la lave. Sa carapace ne cède qu\'à un effort collectif prolongé.' },
    { id: 'leviathan', name: 'Léviathan Éternel',   emoji: '🌌', hp: 20000, color: '#a855f7',
      desc: 'Le boss ultime. Une légende que seule une famille soudée peut terrasser.' }
  ];

  function _bossById(id) {
    for (var i = 0; i < FAMILY_BOSSES.length; i++) if (FAMILY_BOSSES[i].id === id) return FAMILY_BOSSES[i];
    return null;
  }

  // ── Persistance ────────────────────────────────────────────────────
  function loadState() {
    try {
      var raw = localStorage.getItem(BOSS_KEY);
      if (!raw) return null;
      var s = JSON.parse(raw);
      if (!s || typeof s !== 'object') return null;
      if (!s.contributions || typeof s.contributions !== 'object') s.contributions = {};
      return s;
    } catch (e) { return null; }
  }

  function saveState(s) {
    try { localStorage.setItem(BOSS_KEY, JSON.stringify(s)); return true; }
    catch (e) { return false; }
  }

  // Démarre un boss donné (par défaut le premier). Réinitialise les contributions.
  function spawnBoss(bossId) {
    var boss = _bossById(bossId) || FAMILY_BOSSES[0];
    var s = {
      bossId: boss.id,
      hpMax: boss.hp,
      hpLeft: boss.hp,
      startedAt: Date.now(),
      defeatedAt: null,
      contributions: {},   // { profileId: { name, avatar, dmg } }
      claimed: {},         // { profileId: true } — récompenses déjà réclamées
      log: [],             // 10 dernières attaques { pid, name, avatar, dmg, combo, ts }
      lastAttackAt: Date.now(),  // pour la régénération d'inactivité
      regenTotal: 0        // PV régénérés (affichage)
    };
    saveState(s);
    return s;
  }

  // État courant, en créant un premier boss si aucun n'existe.
  // NB : applyRegen est appelé par attack() et renderCard() (défini plus bas,
  // hoisting des déclarations de fonctions → visible ici).
  function getOrInit() {
    var s = loadState();
    if (!s) s = spawnBoss(FAMILY_BOSSES[0].id);
    return s;
  }

  // ── Identité du profil actif ───────────────────────────────────────
  function currentProfile() {
    var id = null, name = 'Joueur', avatar = '🙂';
    try { if (typeof window.getCurrentProfileId === 'function') id = window.getCurrentProfileId(); } catch (e) {}
    if (!id) { try { id = localStorage.getItem('currentProfileId'); } catch (e) {} }
    try {
      if (typeof window.getAllProfiles === 'function') {
        var all = window.getAllProfiles() || [];
        for (var i = 0; i < all.length; i++) {
          if (all[i].id === id) { name = all[i].name || name; avatar = all[i].avatar || avatar; break; }
        }
      }
    } catch (e) {}
    return { id: id || 'solo', name: name, avatar: avatar };
  }

  // Combien de profils existent ? (la fonctionnalité n'a de sens qu'à 2+)
  function profileCount() {
    try {
      if (typeof window.getAllProfiles === 'function') return (window.getAllProfiles() || []).length;
    } catch (e) {}
    return 1;
  }

  // Un profil a-t-il le MODE JEU activé ? (fitproGameMode, isolé par profil).
  // Pour le profil ACTIF on lit la clé directe ; pour les autres, l'espace
  // profile_<id>_fitproGameMode sauvegardé par switchProfile.
  function _gameModeOn(profileId) {
    try {
      var current = null;
      try { if (typeof window.getCurrentProfileId === 'function') current = window.getCurrentProfileId(); } catch (e) {}
      var key = (profileId && profileId === current)
        ? 'fitproGameMode'
        : 'profile_' + profileId + '_fitproGameMode';
      var v = localStorage.getItem(key);
      // Repli : si l'espace par-profil n'existe pas encore mais que c'est le
      // profil actif, on tente la clé directe.
      if (v === null && profileId === current) v = localStorage.getItem('fitproGameMode');
      return v === '1' || v === 'true';
    } catch (e) { return false; }
  }

  // Le profil actif est-il lié à `otherId` dans le réseau familial ?
  function _linkedToMe(otherId) {
    try {
      if (window.AwakFamily && typeof window.AwakFamily.relationOf === 'function') {
        var me = (typeof window.getCurrentProfileId === 'function') ? window.getCurrentProfileId() : null;
        if (!me) return false;
        return !!window.AwakFamily.relationOf(me, otherId);
      }
    } catch (e) {}
    return false;
  }

  // Nombre de profils ÉLIGIBLES au boss familial : le profil actif + les
  // profils qui lui sont LIÉS dans la famille ET qui ont le MODE JEU activé.
  // Le boss n'apparaît qu'à partir de 2 éligibles.
  function eligibleCount() {
    var me = null;
    try { if (typeof window.getCurrentProfileId === 'function') me = window.getCurrentProfileId(); } catch (e) {}
    if (!me) return 0;
    var all = [];
    try { if (typeof window.getAllProfiles === 'function') all = window.getAllProfiles() || []; } catch (e) {}
    // Le profil actif compte s'il a lui-même le mode jeu activé.
    var n = _gameModeOn(me) ? 1 : 0;
    if (!n) return 0;   // si moi-même je ne joue pas, pas de boss pour moi
    all.forEach(function (p) {
      if (p.id === me) return;
      if (_linkedToMe(p.id) && _gameModeOn(p.id)) n++;
    });
    return n;
  }

  // ── Conversion effort → dégâts ─────────────────────────────────────
  // Basé sur le VOLUME de la séance (poids×reps) + l'XP gagnée. Borné pour
  // éviter qu'une séance démesurée règle le boss d'un coup.
  function computeDamage(opts) {
    opts = opts || {};
    var volume = Math.max(0, opts.volume || 0);
    var xp = Math.max(0, opts.xp || 0);
    // 1 dégât par 20 u de volume + 1 dégât par 2 XP. Plancher à 15 pour une
    // séance légère (poids du corps → volume faible), plafond à 600.
    var dmg = Math.round(volume / 20 + xp / 2);
    if (dmg < 15) dmg = 15;
    if (dmg > 600) dmg = 600;
    return dmg;
  }

  // ── Régénération d'inactivité ──────────────────────────────────────
  // Coopération oblige : si PERSONNE n'attaque pendant 48 h, le boss récupère
  // 3 % de ses PV max par jour d'inactivité au-delà. La famille ne peut pas
  // le laisser traîner — la constance collective compte.
  var REGEN_GRACE_MS = 48 * 3600 * 1000;   // 48 h de grâce
  var REGEN_PCT_PER_DAY = 0.03;            // 3 % de hpMax / jour ensuite

  function applyRegen(s) {
    if (!s || s.defeatedAt || !s.lastAttackAt) return s;
    var idle = Date.now() - s.lastAttackAt;
    if (idle <= REGEN_GRACE_MS) return s;
    var days = Math.floor((idle - REGEN_GRACE_MS) / (24 * 3600 * 1000)) + 1;
    var regen = Math.round(s.hpMax * REGEN_PCT_PER_DAY * days);
    // Ne jamais dépasser hpMax, et ne régénérer qu'une fois par période
    // d'inactivité : on avance lastAttackAt pour ne pas recompter les mêmes jours.
    var newHp = Math.min(s.hpMax, s.hpLeft + regen);
    var applied = newHp - s.hpLeft;
    if (applied > 0) {
      s.hpLeft = newHp;
      s.regenTotal = (s.regenTotal || 0) + applied;
      s.lastRegenAmount = applied;              // pour l'affichage « depuis votre absence »
      s.lastAttackAt = Date.now() - REGEN_GRACE_MS; // les jours comptés sont consommés
      saveState(s);
    }
    return s;
  }

  // ── Combo Familial ─────────────────────────────────────────────────
  // Si plusieurs membres DISTINCTS attaquent LE MÊME JOUR, chacun frappe plus
  // fort : ×1 seul, ×1.25 à deux, ×1.5 à trois ou plus. S'entraîner ensemble
  // devient tactiquement avantageux — c'est le cœur de la coopération.
  function _dayKey(ts) {
    var d = new Date(ts);
    return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  }

  function comboToday(s, includeProfileId) {
    var today = _dayKey(Date.now());
    var members = {};
    (s.log || []).forEach(function (e) {
      if (_dayKey(e.ts) === today) members[e.pid] = true;
    });
    if (includeProfileId) members[includeProfileId] = true;
    var n = Object.keys(members).length;
    return n >= 3 ? 1.5 : (n === 2 ? 1.25 : 1);
  }

  // ── Appliquer une attaque (fin de séance) ──────────────────────────
  // Retourne un résumé pour l'affichage, ou null si rien à faire.
  function attack(opts) {
    if (eligibleCount() < 2) return null;   // 2 profils liés + mode jeu minimum
    var s = applyRegen(getOrInit());
    if (s.defeatedAt) return { alreadyDefeated: true, state: s }; // attend l'invocation du suivant

    var who = currentProfile();
    var base = computeDamage(opts);
    var combo = comboToday(s, who.id);
    var dmg = Math.round(base * combo);
    var before = s.hpLeft;

    // ── ☠️ COUP DE GRÂCE COLLECTIF ─────────────────────────────────────
    // Sous 10 % de PV, le boss entre en « Dernier Souffle » : il ne peut être
    // ACHEVÉ que si au moins DEUX membres distincts ont frappé aujourd'hui
    // (l'attaquant courant compte). Un membre seul peut l'amener à 1 PV, mais
    // pas le tuer — le final se joue en famille, jamais en solitaire.
    var lastStandThreshold = Math.ceil(s.hpMax * 0.10);
    var wouldKill = (s.hpLeft - dmg) <= 0;
    var membersToday = (function () {
      var today = _dayKey(Date.now());
      var m = {}; m[who.id] = true;
      (s.log || []).forEach(function (e) { if (_dayKey(e.ts) === today) m[e.pid] = true; });
      return Object.keys(m).length;
    })();
    var finishBlocked = false;
    if (wouldKill && s.hpLeft <= lastStandThreshold && membersToday < 2) {
      // Le boss survit de justesse à 1 PV : les dégâts sont appliqués jusqu'à 1.
      dmg = Math.max(0, s.hpLeft - 1);
      finishBlocked = true;
    }

    s.hpLeft = Math.max(0, s.hpLeft - dmg);

    var c = s.contributions[who.id] || { name: who.name, avatar: who.avatar, dmg: 0 };
    c.name = who.name; c.avatar = who.avatar;   // garder à jour si renommé
    c.dmg += dmg;
    s.contributions[who.id] = c;

    // Journal de combat (10 dernières attaques, la plus récente en premier)
    if (!Array.isArray(s.log)) s.log = [];
    s.log.unshift({ pid: who.id, name: who.name, avatar: who.avatar, dmg: dmg, combo: combo, ts: Date.now() });
    if (s.log.length > 10) s.log.length = 10;
    s.lastAttackAt = Date.now();
    s.lastRegenAmount = 0;   // l'alerte de régénération disparaît dès qu'on ré-attaque

    var justDefeated = false;
    if (s.hpLeft === 0 && !s.defeatedAt) { s.defeatedAt = Date.now(); justDefeated = true; }
    saveState(s);

    return {
      dmg: dmg,
      base: base,
      combo: combo,
      hpLeft: s.hpLeft,
      hpMax: s.hpMax,
      before: before,
      justDefeated: justDefeated,
      finishBlocked: finishBlocked,   // le coup fatal exigeait 2 membres aujourd'hui
      state: s,
      who: who,
      boss: _bossById(s.bossId)
    };
  }

  // ── Classement des contributions (décroissant) ─────────────────────
  function ranking(s) {
    s = s || getOrInit();
    var arr = [];
    for (var pid in s.contributions) {
      if (Object.prototype.hasOwnProperty.call(s.contributions, pid)) {
        var c = s.contributions[pid];
        arr.push({ id: pid, name: c.name, avatar: c.avatar, dmg: c.dmg });
      }
    }
    arr.sort(function (a, b) { return b.dmg - a.dmg; });
    return arr;
  }

  function topContributorId(s) {
    var r = ranking(s);
    return r.length ? r[0].id : null;
  }

  // ── Butin exclusif du boss ─────────────────────────────────────────
  // Les items marqués familyBoss:<id> dans EQUIPMENT_DATABASE ne tombent
  // QUE quand ce boss familial meurt. Chaque participant en reçoit un
  // (aléatoire, en évitant ceux qu'il possède déjà) ; le TOP en reçoit DEUX.
  function _bossLootPool(bossId) {
    try {
      var db = (typeof EQUIPMENT_DATABASE !== 'undefined') ? EQUIPMENT_DATABASE
             : (window.EQUIPMENT_DATABASE || []);
      return db.filter(function (i) { return i.familyBoss === bossId; });
    } catch (e) { return []; }
  }

  function _grantItems(bossId, count) {
    var pool = _bossLootPool(bossId);
    if (!pool.length) return [];
    var inv = [];
    try { inv = JSON.parse(localStorage.getItem('fitpro_inventory') || '[]'); } catch (e) { inv = []; }
    if (!Array.isArray(inv)) inv = [];
    var owned = {};
    inv.forEach(function (e) { if (e && e.itemId) owned[e.itemId] = true; });

    // priorité aux items du boss que le profil ne possède pas encore
    var fresh = pool.filter(function (i) { return !owned[i.id]; });
    var source = fresh.length ? fresh : pool;   // s'il a déjà tout : doublon assumé
    var granted = [];
    for (var k = 0; k < count; k++) {
      if (!source.length) break;
      var idx = Math.floor(Math.random() * source.length);
      var item = source.splice(idx, 1)[0];
      inv.unshift({ itemId: item.id, obtainedAt: new Date().toISOString(), id: Date.now() + k });
      granted.push(item);
      if (!source.length && fresh.length) source = pool.slice(); // repli doublons
    }
    try { localStorage.setItem('fitpro_inventory', JSON.stringify(inv)); } catch (e) {}
    return granted;
  }

  // ── Récompense (à la victoire) ─────────────────────────────────────
  // Tout le monde gagne : XP + UN item exclusif du boss. Le plus gros
  // contributeur reçoit un bonus d'XP et un DEUXIÈME item.
  // Retourne { xp, isTop, items } pour le profil actif, ou null si déjà
  // réclamé / boss non vaincu / profil sans contribution.
  function claimReward() {
    var s = loadState();
    if (!s || !s.defeatedAt) return null;
    var who = currentProfile();
    if (!s.contributions[who.id]) return null;      // n'a pas participé
    if (s.claimed && s.claimed[who.id]) return null; // déjà réclamé

    var isTop = (topContributorId(s) === who.id);
    var baseXP = 200;
    var bonusXP = isTop ? 150 : 0;
    var total = baseXP + bonusXP;

    if (!s.claimed) s.claimed = {};
    s.claimed[who.id] = true;
    saveState(s);

    // Créditer l'XP RPG du profil actif si l'API existe
    try {
      if (typeof window.awakGrantXP === 'function') window.awakGrantXP(total, 'Boss familial');
      else {
        var cur = parseInt(localStorage.getItem('fitproRPGLifetimeXP') || '0', 10) || 0;
        localStorage.setItem('fitproRPGLifetimeXP', String(cur + total));
      }
    } catch (e) {}

    // 🎁 Butin exclusif : 1 item pour tous, 2 pour le top contributeur.
    // fitpro_inventory est ISOLÉE PAR PROFIL (GAME_KEYS) → chacun son butin.
    var items = _grantItems(s.bossId, isTop ? 2 : 1);

    return { xp: total, base: baseXP, bonus: bonusXP, isTop: isTop, items: items, boss: _bossById(s.bossId) };
  }

  // Le profil actif a-t-il déjà réclamé pour le boss vaincu courant ?
  function hasClaimed() {
    var s = loadState();
    if (!s || !s.defeatedAt) return false;
    var who = currentProfile();
    return !!(s.claimed && s.claimed[who.id]);
  }

  // ── API publique ───────────────────────────────────────────────────
  // 🗺️ État du boss pour la CARTE de l'Effacement : elle a besoin de savoir
// s'il y en a un d'actif, son nom et ses PV restants, sans charger la carte
// complète. Renvoie null si aucun boss n'est en cours.
window.AwakFamilyBossState = function () {
  try {
    if (!_gameModeOn()) return null;
    var st = loadState();
    if (!st || !st.bossId) return null;
    var b = _bossById(st.bossId);
    if (!b) return null;
    // ⚠️ Le champ est `hpLeft`, pas `hp` (voir spawnBoss).
    var hpMax = st.hpMax || b.hp || 1;
    var hp = Math.max(0, st.hpLeft != null ? st.hpLeft : hpMax);
    if (hp <= 0) return null;              // vaincu : plus de point sur la carte
    return { id: st.bossId, name: b.name || 'Anomalie familiale',
             hp: hp, hpMax: hpMax, pct: Math.round((hp / hpMax) * 100) };
  } catch (e) { return null; }
};

window.AwakFamilyBoss = {
    BOSSES: FAMILY_BOSSES,
    getState: getOrInit,
    loadRaw: loadState,
    spawn: spawnBoss,
    attack: attack,
    ranking: ranking,
    topContributorId: topContributorId,
    claimReward: claimReward,
    hasClaimed: hasClaimed,
    computeDamage: computeDamage,
    comboToday: comboToday,
    applyRegen: applyRegen,
    profileCount: profileCount,
    eligibleCount: eligibleCount,
    currentProfile: currentProfile,
    bossById: _bossById
  };

  // ═══════════════════════════════════════════════════════════════════
  // INTERFACE — carte affichée dans l'onglet Jeu
  // ═══════════════════════════════════════════════════════════════════
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  // Carte principale. Renvoie '' si moins de 2 profils (fonctionnalité familiale).
  function _timeAgo(ts) {
    var m = Math.floor((Date.now() - ts) / 60000);
    if (m < 1) return 'à l\'instant';
    if (m < 60) return 'il y a ' + m + ' min';
    var h = Math.floor(m / 60);
    if (h < 24) return 'il y a ' + h + ' h';
    var d = Math.floor(h / 24);
    return 'il y a ' + d + ' j';
  }


  function renderCard() {
    if (eligibleCount() < 2) return '';
    var s = applyRegen(getOrInit());
    var boss = _bossById(s.bossId) || FAMILY_BOSSES[0];
    var me = currentProfile();
    var pct = Math.max(0, Math.min(100, Math.round((s.hpLeft / s.hpMax) * 100)));
    var rank = ranking(s);

    // Barres de contribution (relatif au plus gros contributeur)
    var maxDmg = rank.length ? rank[0].dmg : 1;
    var rows = rank.map(function (c, i) {
      var w = Math.max(4, Math.round((c.dmg / maxDmg) * 100));
      var isMe = (c.id === me.id);
      var medal = i === 0 ? '👑' : '';
      return '<div style="display:flex;align-items:center;gap:8px;margin-bottom:7px;">'
        + '<div style="width:26px;text-align:center;font-size:1.1em;">' + _av(c.avatar, 20) + '</div>'
        + '<div style="flex:1;min-width:0;">'
        +   '<div style="display:flex;justify-content:space-between;font-size:0.72em;margin-bottom:2px;">'
        +     '<span style="font-weight:' + (isMe ? '800' : '600') + ';color:' + (isMe ? '#fff' : '#cbd5e1') + ';">' + esc(c.name) + (isMe ? ' (toi)' : '') + ' ' + medal + '</span>'
        +     '<span style="color:#94a3b8;font-weight:700;">' + c.dmg + '</span>'
        +   '</div>'
        +   '<div style="height:7px;background:rgba(255,255,255,0.06);border-radius:99px;overflow:hidden;">'
        +     '<div style="height:100%;width:' + w + '%;background:linear-gradient(90deg,' + boss.color + ',' + boss.color + 'aa);border-radius:99px;"></div>'
        +   '</div>'
        + '</div></div>';
    }).join('');
    if (!rows) rows = '<div style="font-size:0.76em;color:#64748b;text-align:center;padding:8px;">Personne n\'a encore frappé. La première séance ouvre le combat !</div>';

    // Bloc victoire / réclamation
    var actionBlock = '';
    if (s.defeatedAt) {
      var claimed = hasClaimed();
      var iContributed = !!s.contributions[me.id];
      var iAmTop = (topContributorId(s) === me.id);
      if (iContributed && !claimed) {
        actionBlock = '<button onclick="AwakFamilyBossClaim()" style="width:100%;margin-top:12px;padding:13px;border:none;border-radius:12px;cursor:pointer;background:linear-gradient(135deg,#f59e0b,#d97706);color:#fff;font-weight:800;font-size:0.9em;box-shadow:0 4px 20px rgba(245,158,11,0.35);">🎁 Réclamer ta récompense'
          + (iAmTop ? ' (+ bonus 👑)' : '') + '</button>';
      } else if (claimed) {
        actionBlock = '<div style="margin-top:12px;padding:10px;text-align:center;font-size:0.76em;color:#4ade80;background:rgba(34,197,94,0.08);border-radius:10px;">✅ Récompense réclamée</div>';
      }
      // Invocation du prochain boss (n'importe quel membre)
      var RANK_LABEL = { colosse: 'butin rang C', hydre: 'butin rang B', golem: 'butin rang A', leviathan: 'butin rang S' };
      var opts = FAMILY_BOSSES.map(function (b) {
        return '<button onclick="AwakFamilyBossSpawn(\'' + b.id + '\')" style="flex:1;min-width:120px;padding:10px 8px;border:1px solid ' + b.color + '44;border-radius:10px;cursor:pointer;background:' + b.color + '11;color:#e2e8f0;font-size:0.72em;font-weight:700;">'
          + b.emoji + ' ' + esc(b.name) + '<br><span style="font-size:0.85em;color:#94a3b8;">' + b.hp.toLocaleString('fr-FR') + ' PV · ' + (RANK_LABEL[b.id] || '') + '</span></button>';
      }).join('');
      actionBlock += '<div style="margin-top:14px;padding-top:12px;border-top:1px solid rgba(255,255,255,0.06);">'
        + '<div style="font-size:0.74em;color:#94a3b8;font-weight:700;margin-bottom:8px;">⚔️ Invoquer le prochain boss :</div>'
        + '<div style="display:flex;gap:8px;flex-wrap:wrap;">' + opts + '</div></div>';
    }

    var hpBarColor = pct > 50 ? '#22c55e' : (pct > 20 ? '#f59e0b' : '#ef4444');
    var inLastStand = !s.defeatedAt && s.hpLeft <= Math.ceil(s.hpMax * 0.10);
    var defeatedBadge = s.defeatedAt
      ? '<span style="font-size:0.62em;font-weight:800;padding:3px 8px;border-radius:99px;background:rgba(34,197,94,0.15);color:#4ade80;">VAINCU 🎉</span>'
      : (inLastStand
        ? '<span style="font-size:0.62em;font-weight:800;padding:3px 8px;border-radius:99px;background:rgba(239,68,68,0.15);color:#f87171;animation:pulse 1.5s infinite;">☠️ DERNIER SOUFFLE</span>'
        : '');

    return '<div style="background:linear-gradient(160deg,#12101a,#0d0d12);border:1px solid ' + boss.color + '33;border-radius:18px;padding:18px;margin-bottom:14px;box-shadow:0 4px 24px ' + boss.color + '18;">'
      + '<div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;">'
      +   '<div style="width:52px;height:52px;border-radius:14px;flex-shrink:0;background:' + boss.color + '18;border:1.5px solid ' + boss.color + '44;display:flex;align-items:center;justify-content:center;font-size:2em;">' + boss.emoji + '</div>'
      +   '<div style="flex:1;min-width:0;">'
      +     '<div style="display:flex;align-items:center;gap:8px;margin-bottom:2px;"><span style="font-size:0.62em;font-weight:800;letter-spacing:0.5px;color:' + boss.color + ';">BOSS FAMILIAL</span>' + defeatedBadge + '</div>'
      +     '<div style="font-size:1.02em;font-weight:900;color:#fff;">' + esc(boss.name) + '</div>'
      +   '</div>'
      + '</div>'
      + '<p style="font-size:0.76em;color:#94a3b8;margin:0 0 12px;line-height:1.4;">' + esc(boss.desc) + '</p>'
      // 🎁 Aperçu du butin exclusif de CE boss
      + (function () {
          var pool = _bossLootPool(s.bossId);
          if (!pool.length) return '';
          var icons = pool.map(function (i) { return '<span title="' + esc(i.name) + '" style="font-size:1.15em;">' + i.icon + '</span>'; }).join(' ');
          return '<div style="margin-bottom:12px;padding:8px 12px;border-radius:10px;background:' + boss.color + '0d;border:1px solid ' + boss.color + '26;font-size:0.7em;color:#cbd5e1;">'
            + '🎁 <b>Butin exclusif</b> — chaque participant reçoit 1 pièce à la victoire (2 pour le 👑) : '
            + '<span style="letter-spacing:3px;">' + icons + '</span></div>';
        })()
      // Barre de PV
      + '<div style="display:flex;justify-content:space-between;font-size:0.72em;margin-bottom:4px;"><span style="color:#cbd5e1;font-weight:700;">Points de vie</span><span style="color:' + hpBarColor + ';font-weight:800;">' + s.hpLeft.toLocaleString('fr-FR') + ' / ' + s.hpMax.toLocaleString('fr-FR') + '</span></div>'
      + '<div style="height:12px;background:rgba(255,255,255,0.06);border-radius:99px;overflow:hidden;margin-bottom:16px;"><div style="height:100%;width:' + pct + '%;background:linear-gradient(90deg,' + hpBarColor + ',' + hpBarColor + 'cc);border-radius:99px;transition:width 0.5s;"></div></div>'
      // ☠️ Phase Dernier Souffle : le coup de grâce exige 2 membres aujourd'hui
      + (function () {
          if (s.defeatedAt || s.hpLeft > Math.ceil(s.hpMax * 0.10)) return '';
          var today = _dayKey(Date.now());
          var m = {};
          (s.log || []).forEach(function (e) { if (_dayKey(e.ts) === today) m[e.pid] = true; });
          var n = Object.keys(m).length;
          var ready = n >= 2;
          return '<div style="margin-bottom:12px;padding:10px 12px;border-radius:10px;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);font-size:0.72em;color:#fca5a5;">'
            + '☠️ <b>Dernier Souffle</b> — le coup de grâce exige que <b>2 membres</b> frappent le même jour. '
            + (ready ? '✅ Conditions réunies : achevez-le !' : (n === 1 ? 'Un membre a frappé aujourd\'hui — il en faut un second !' : 'Personne n\'a encore frappé aujourd\'hui.'))
            + '</div>';
        })()
      // Alerte régénération (le boss a récupéré pendant l'absence de la famille)
      + (s.lastRegenAmount && !s.defeatedAt
          ? '<div style="margin-bottom:12px;padding:9px 12px;border-radius:10px;background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);font-size:0.72em;color:#fca5a5;">⚠️ Le boss a régénéré <b>' + s.lastRegenAmount.toLocaleString('fr-FR') + ' PV</b> pendant votre absence. Ne le laissez pas récupérer !</div>'
          : '')
      // Combo familial du jour
      + (function () {
          if (s.defeatedAt) return '';
          var combo = comboToday(s, null);
          var today = _dayKey(Date.now());
          var names = {};
          (s.log || []).forEach(function (e) { if (_dayKey(e.ts) === today) names[e.pid] = e.name; });
          var n = Object.keys(names).length;
          if (n >= 2) {
            return '<div style="margin-bottom:12px;padding:9px 12px;border-radius:10px;background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.25);font-size:0.72em;color:#fbbf24;">🔥 <b>Combo Familial ×' + combo + '</b> — ' + n + ' membres ont frappé aujourd\'hui. Vos dégâts sont amplifiés !</div>';
          }
          return '<div style="margin-bottom:12px;padding:9px 12px;border-radius:10px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);font-size:0.7em;color:#94a3b8;">💡 <b>Combo Familial :</b> si plusieurs membres s\'entraînent le même jour, tous frappent plus fort (×1.25 à deux, ×1.5 à trois+).</div>';
        })()
      // Contributions
      + '<div style="font-size:0.74em;color:#e2e8f0;font-weight:800;margin-bottom:9px;">🏆 Contributions de la famille</div>'
      + rows
      // Journal de combat (5 dernières attaques)
      + (function () {
          var log = (s.log || []).slice(0, 5);
          if (!log.length) return '';
          var items = log.map(function (e) {
            return '<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;font-size:0.7em;border-bottom:1px solid rgba(255,255,255,0.04);">'
              + '<span style="color:#cbd5e1;">' + _av(e.avatar, 18) + ' <b>' + esc(e.name) + '</b> — ' + e.dmg + ' dmg'
              + (e.combo > 1 ? ' <span style="color:#fbbf24;">🔥×' + e.combo + '</span>' : '') + '</span>'
              + '<span style="color:#64748b;">' + _timeAgo(e.ts) + '</span>'
              + '</div>';
          }).join('');
          return '<div style="margin-top:12px;padding-top:10px;border-top:1px solid rgba(255,255,255,0.06);">'
            + '<div style="font-size:0.7em;color:#94a3b8;font-weight:700;margin-bottom:5px;">📜 Derniers coups portés</div>'
            + items + '</div>';
        })()
      + actionBlock
      + '<div style="margin-top:12px;font-size:0.68em;color:#64748b;text-align:center;line-height:1.4;">Chaque séance terminée inflige des dégâts. Entraînez-vous ensemble pour le terrasser !</div>'
      + '</div>';
  }

  // Actions branchées sur les boutons de la carte
  window.AwakFamilyBossClaim = function () {
    var r = claimReward();
    if (!r) { if (typeof window.showToast === 'function') window.showToast('Récompense déjà réclamée', 'info', 2500); return; }
    var itemsTxt = (r.items && r.items.length)
      ? ' · ' + r.items.map(function (i) { return i.icon + ' ' + i.name; }).join(' + ')
      : '';
    var msg = '🎁 +' + r.xp + ' XP' + itemsTxt + (r.isTop ? ' — Meilleur combattant ! 👑' : '');
    if (typeof window.showToast === 'function') window.showToast(msg, 'success', 5500);
    if (typeof window.refreshCoopViews === 'function') window.refreshCoopViews(); else if (typeof window.renderAdventureTab === 'function') window.renderAdventureTab();
  };

  window.AwakFamilyBossSpawn = function (bossId) {
    var s = loadState();
    // Sécurité : on n'invoque un nouveau boss que si l'actuel est vaincu
    if (s && !s.defeatedAt) {
      if (typeof window.showToast === 'function') window.showToast('Le boss actuel est encore debout !', 'warning', 2800);
      return;
    }
    spawnBoss(bossId);
    var b = _bossById(bossId);
    if (typeof window.showToast === 'function') window.showToast((b ? b.emoji + ' ' + b.name : 'Nouveau boss') + ' invoqué !', 'success', 3000);
    if (typeof window.refreshCoopViews === 'function') window.refreshCoopViews(); else if (typeof window.renderAdventureTab === 'function') window.renderAdventureTab();
  };

  window.AwakFamilyBoss.renderCard = renderCard;
})();
