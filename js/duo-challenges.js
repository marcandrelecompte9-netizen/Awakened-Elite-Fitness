/* ═══════════════════════════════════════════════════════════════════
   DÉFIS DE DUO — deux profils se lient et progressent ensemble
   ───────────────────────────────────────────────────────────────────
   Deux profils du même appareil forment un DUO (couple, parent-enfant,
   binôme d'entraînement…). Chaque semaine, un défi commun. Réussi → +1
   niveau de duo, avec des titres. Le niveau donne un bonus permanent de
   dégâts au Boss Familial : les deux systèmes coopératifs se renforcent.
   100 % local, clé GLOBALE partagée (hors GAME_KEYS).
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var DUO_KEY = 'awakDuo';   // GLOBALE : partagée entre les 2 profils liés.

  // ── Paliers / titres de duo ────────────────────────────────────────
  var DUO_TITLES = [
    { min: 0,  title: 'Nouveau Duo',        emoji: '🤝' },
    { min: 3,  title: 'Duo Soudé',          emoji: '💪' },
    { min: 6,  title: 'Duo Aguerri',        emoji: '🔥' },
    { min: 10, title: 'Duo d\'Élite',        emoji: '⭐' },
    { min: 15, title: 'Duo Légendaire',     emoji: '👑' },
    { min: 25, title: 'Duo Éternel',        emoji: '🌌' }
  ];

  function titleFor(level) {
    var t = DUO_TITLES[0];
    for (var i = 0; i < DUO_TITLES.length; i++) if (level >= DUO_TITLES[i].min) t = DUO_TITLES[i];
    return t;
  }

  // ── Catalogue de défis hebdomadaires ───────────────────────────────
  // check(stats) reçoit { a:{days,sessions}, b:{days,sessions}, sameDays }
  // où sameDays = nb de jours où LES DEUX se sont entraînés.
  var DUO_CHALLENGES = [
    { id: 'same_day_2',  emoji: '📅', title: 'Synchronisés',
      desc: 'Entraînez-vous tous les deux le même jour, 2 fois cette semaine.',
      goal: function (s) { return s.sameDays; }, target: 2 },
    { id: 'each_3',      emoji: '💯', title: 'Chacun sa part',
      desc: 'Chacun réalise 3 séances cette semaine.',
      goal: function (s) { return Math.min(s.a.sessions, s.b.sessions); }, target: 3 },
    { id: 'combined_8',  emoji: '🔗', title: 'Effort commun',
      desc: 'Cumulez 8 séances à vous deux cette semaine.',
      goal: function (s) { return s.a.sessions + s.b.sessions; }, target: 8 },
    { id: 'same_day_3',  emoji: '🔥', title: 'Toujours ensemble',
      desc: 'Entraînez-vous le même jour, 3 fois cette semaine.',
      goal: function (s) { return s.sameDays; }, target: 3 },
    { id: 'each_4',      emoji: '⚡', title: 'Rythme soutenu',
      desc: 'Chacun réalise 4 séances cette semaine.',
      goal: function (s) { return Math.min(s.a.sessions, s.b.sessions); }, target: 4 }
  ];

  function challengeById(id) {
    for (var i = 0; i < DUO_CHALLENGES.length; i++) if (DUO_CHALLENGES[i].id === id) return DUO_CHALLENGES[i];
    return DUO_CHALLENGES[0];
  }

  // ── Persistance ────────────────────────────────────────────────────
  function load() {
    try {
      var raw = localStorage.getItem(DUO_KEY);
      if (!raw) return null;
      var s = JSON.parse(raw);
      return (s && typeof s === 'object') ? s : null;
    } catch (e) { return null; }
  }
  function save(s) { try { localStorage.setItem(DUO_KEY, JSON.stringify(s)); return true; } catch (e) { return false; } }

  // ── Utilitaires profils ────────────────────────────────────────────
  function allProfiles() {
    try { if (typeof window.getAllProfiles === 'function') return window.getAllProfiles() || []; } catch (e) {}
    return [];
  }
  function currentId() {
    try { if (typeof window.getCurrentProfileId === 'function') return window.getCurrentProfileId(); } catch (e) {}
    try { return localStorage.getItem('currentProfileId'); } catch (e) {}
    return null;
  }
  function profileMeta(id) {
    var all = allProfiles();
    for (var i = 0; i < all.length; i++) if (all[i].id === id) return { id: id, name: all[i].name || 'Membre', avatar: all[i].avatar || '🙂' };
    return { id: id, name: 'Membre', avatar: '🙂' };
  }

  // ── ISO week key (année-semaine) ───────────────────────────────────
  function weekKey(ts) {
    var d = new Date(ts || Date.now());
    d.setHours(0, 0, 0, 0);
    // jeudi de la semaine courante décide de l'année ISO
    d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
    var week1 = new Date(d.getFullYear(), 0, 4);
    var wk = 1 + Math.round(((d - week1) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
    return d.getFullYear() + '-W' + (wk < 10 ? '0' + wk : wk);
  }
  function dayKey(ts) {
    var d = new Date(ts);
    return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  }

  // ── Lier / délier ──────────────────────────────────────────────────
  function isLinked() { var s = load(); return !!(s && s.a && s.b); }

  function partnerOf(profileId) {
    var s = load();
    if (!s || !s.a || !s.b) return null;
    if (s.a === profileId) return s.b;
    if (s.b === profileId) return s.a;
    return null;   // ce profil n'est pas dans le duo
  }

  // Le profil actif fait-il partie du duo ?
  function currentInDuo() {
    var me = currentId();
    return !!(me && partnerOf(me));
  }

  function link(partnerId) {
    var me = currentId();
    if (!me || !partnerId || me === partnerId) return false;
    var s = {
      a: me, b: partnerId,
      level: 0,
      createdAt: Date.now(),
      week: weekKey(),
      challengeId: _pickChallenge(0),
      // journées d'entraînement de la semaine par profil : { profileId: { 'YYYY-M-D': true } }
      trainDays: {},
      lastResolvedWeek: null,
      history: []   // { week, challengeId, success }
    };
    save(s);
    return true;
  }

  function unlink() { try { localStorage.removeItem(DUO_KEY); } catch (e) {} }

  // Choisir un défi selon le niveau (défis plus durs quand le duo progresse)
  function _pickChallenge(level) {
    var pool = level >= 6
      ? DUO_CHALLENGES
      : DUO_CHALLENGES.filter(function (c) { return c.id !== 'same_day_3' && c.id !== 'each_4'; });
    return pool[Math.floor(Math.random() * pool.length)].id;
  }

  // ── Enregistrer une séance (appelé en fin de séance) ───────────────
  function recordSession() {
    var s = load();
    if (!s || !s.a || !s.b) return null;
    var me = currentId();
    if (me !== s.a && me !== s.b) return null;   // profil hors duo

    _rolloverIfNeeded(s);

    if (!s.trainDays[me]) s.trainDays[me] = {};
    s.trainDays[me][dayKey(Date.now())] = true;
    save(s);
    return progress(s);
  }

  // Nouvelle semaine ? On résout le défi précédent puis on en tire un nouveau.
  function _rolloverIfNeeded(s) {
    var wk = weekKey();
    if (s.week === wk) return;
    // Résoudre la semaine écoulée
    var res = _evaluate(s);
    var success = res.current >= res.target;
    s.history = s.history || [];
    s.history.unshift({ week: s.week, challengeId: s.challengeId, success: success });
    if (s.history.length > 12) s.history.length = 12;
    if (success) s.level = (s.level || 0) + 1;
    s.lastOutcome = { week: s.week, success: success, newLevel: s.level };
    // Nouvelle semaine
    s.week = wk;
    s.challengeId = _pickChallenge(s.level || 0);
    s.trainDays = {};
    save(s);
  }

  // Statistiques de la semaine courante
  function _stats(s) {
    var a = s.a, b = s.b;
    var da = s.trainDays[a] || {}, db = s.trainDays[b] || {};
    var daysA = Object.keys(da), daysB = Object.keys(db);
    var same = daysA.filter(function (d) { return db[d]; }).length;
    return {
      a: { days: daysA.length, sessions: daysA.length },
      b: { days: daysB.length, sessions: daysB.length },
      sameDays: same
    };
  }

  function _evaluate(s) {
    var ch = challengeById(s.challengeId);
    var st = _stats(s);
    var current = Math.max(0, ch.goal(st));
    return { current: current, target: ch.target, challenge: ch, stats: st };
  }

  function progress(s) {
    s = s || load();
    if (!s) return null;
    _rolloverIfNeeded(s);
    var ev = _evaluate(s);
    return {
      level: s.level || 0,
      title: titleFor(s.level || 0),
      challenge: ev.challenge,
      current: Math.min(ev.current, ev.target),
      rawCurrent: ev.current,
      target: ev.target,
      done: ev.current >= ev.target,
      stats: ev.stats,
      a: profileMeta(s.a),
      b: profileMeta(s.b),
      week: s.week,
      lastOutcome: s.lastOutcome || null
    };
  }

  // ── Bonus de dégâts pour le Boss Familial ──────────────────────────
  // +1 % par niveau de duo, plafonné à +10 %. Ne s'applique que si le
  // profil actif fait partie d'un duo.
  function damageBonus() {
    var me = currentId();
    if (!me || !partnerOf(me)) return 1;
    var s = load();
    var lvl = (s && s.level) || 0;
    return 1 + Math.min(0.10, lvl * 0.01);
  }

  // ── Candidats à lier (les autres profils) ──────────────────────────
  function linkCandidates() {
    var me = currentId();
    return allProfiles().filter(function (p) { return p.id !== me; });
  }

  window.AwakDuo = {
    TITLES: DUO_TITLES,
    CHALLENGES: DUO_CHALLENGES,
    isLinked: isLinked,
    currentInDuo: currentInDuo,
    partnerOf: partnerOf,
    link: link,
    unlink: unlink,
    recordSession: recordSession,
    progress: progress,
    damageBonus: damageBonus,
    linkCandidates: linkCandidates,
    titleFor: titleFor,
    _load: load
  };

  // ═══════════════════════════════════════════════════════════════════
  // INTERFACE — carte affichée dans l'onglet Jeu
  // ═══════════════════════════════════════════════════════════════════
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function renderCard() {
    // Nécessite au moins 2 profils
    if (allProfiles().length < 2) return '';
    var me = currentId();

    // ── Cas 1 : le profil actif n'est pas encore en duo ──
    if (!me || !partnerOf(me)) {
      // Si un duo existe mais SANS ce profil, on n'affiche rien (duo d'autres membres)
      if (isLinked()) return '';
      var cands = linkCandidates();
      if (!cands.length) return '';
      var opts = cands.map(function (p) {
        return '<button onclick="AwakDuoLink(\'' + p.id + '\')" style="flex:1;min-width:110px;padding:11px 8px;border:1px solid rgba(236,72,153,0.3);border-radius:10px;cursor:pointer;background:rgba(236,72,153,0.08);color:#e2e8f0;font-size:0.78em;font-weight:700;">'
          + (p.avatar || '🙂') + ' ' + esc(p.name) + '</button>';
      }).join('');
      return '<div style="background:linear-gradient(160deg,#1a1018,#0d0d12);border:1px solid rgba(236,72,153,0.25);border-radius:18px;padding:18px;margin-bottom:14px;">'
        + '<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;"><span style="font-size:1.6em;">💞</span><div><div style="font-size:0.62em;font-weight:800;letter-spacing:0.5px;color:#ec4899;">DÉFIS DE DUO</div><div style="font-size:1em;font-weight:900;color:#fff;">Formez un duo</div></div></div>'
        + '<p style="font-size:0.76em;color:#94a3b8;margin:0 0 12px;line-height:1.4;">Liez-vous à un autre membre pour relever des défis hebdomadaires ensemble, gagner des niveaux de duo, et frapper plus fort le Boss Familial.</p>'
        + '<div style="font-size:0.72em;color:#cbd5e1;font-weight:700;margin-bottom:8px;">Avec qui former un duo ?</div>'
        + '<div style="display:flex;gap:8px;flex-wrap:wrap;">' + opts + '</div></div>';
    }

    // ── Cas 2 : profil en duo — afficher défi + niveau ──
    var p = progress();
    if (!p) return '';
    var pct = Math.round((p.current / p.target) * 100);
    var barColor = p.done ? '#22c55e' : '#ec4899';
    var bonus = Math.min(10, (p.level || 0));   // % de bonus boss (=niveau, plafond 10)

    // Bandeau de résultat de la semaine précédente (une fois)
    var outcomeBanner = '';
    if (p.lastOutcome) {
      if (p.lastOutcome.success) {
        outcomeBanner = '<div style="margin-bottom:12px;padding:9px 12px;border-radius:10px;background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.25);font-size:0.72em;color:#4ade80;">🎉 Défi de la semaine dernière <b>réussi</b> ! Duo niveau <b>' + p.level + '</b>.</div>';
      } else {
        outcomeBanner = '<div style="margin-bottom:12px;padding:9px 12px;border-radius:10px;background:rgba(148,163,184,0.08);border:1px solid rgba(148,163,184,0.2);font-size:0.72em;color:#94a3b8;">La semaine dernière, le défi n\'a pas été relevé. Nouvelle chance cette semaine !</div>';
      }
    }

    return '<div style="background:linear-gradient(160deg,#1a1018,#0d0d12);border:1px solid rgba(236,72,153,0.28);border-radius:18px;padding:18px;margin-bottom:14px;box-shadow:0 4px 24px rgba(236,72,153,0.1);">'
      // En-tête duo
      + '<div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;">'
      +   '<div style="display:flex;align-items:center;font-size:1.5em;">' + (p.a.avatar || '🙂') + '<span style="font-size:0.7em;margin:0 2px;color:#ec4899;">💞</span>' + (p.b.avatar || '🙂') + '</div>'
      +   '<div style="flex:1;min-width:0;">'
      +     '<div style="font-size:0.62em;font-weight:800;letter-spacing:0.5px;color:#ec4899;">DUO ' + esc(p.a.name) + ' & ' + esc(p.b.name) + '</div>'
      +     '<div style="font-size:0.98em;font-weight:900;color:#fff;">' + p.title.emoji + ' ' + esc(p.title.title) + ' <span style="font-size:0.75em;color:#94a3b8;">· niv. ' + p.level + '</span></div>'
      +   '</div>'
      + '</div>'
      + outcomeBanner
      // Défi de la semaine
      + '<div style="background:rgba(255,255,255,0.03);border-radius:12px;padding:13px;margin-bottom:10px;">'
      +   '<div style="font-size:0.7em;color:#ec4899;font-weight:800;margin-bottom:3px;">DÉFI DE LA SEMAINE</div>'
      +   '<div style="font-size:0.9em;font-weight:800;color:#fff;margin-bottom:2px;">' + p.challenge.emoji + ' ' + esc(p.challenge.title) + '</div>'
      +   '<div style="font-size:0.74em;color:#94a3b8;margin-bottom:10px;line-height:1.4;">' + esc(p.challenge.desc) + '</div>'
      +   '<div style="display:flex;justify-content:space-between;font-size:0.72em;margin-bottom:4px;"><span style="color:#cbd5e1;font-weight:700;">Progression</span><span style="color:' + barColor + ';font-weight:800;">' + p.current + ' / ' + p.target + (p.done ? ' ✅' : '') + '</span></div>'
      +   '<div style="height:10px;background:rgba(255,255,255,0.06);border-radius:99px;overflow:hidden;"><div style="height:100%;width:' + pct + '%;background:linear-gradient(90deg,' + barColor + ',' + barColor + 'cc);border-radius:99px;transition:width 0.5s;"></div></div>'
      + '</div>'
      // Détail des contributions
      + '<div style="display:flex;gap:8px;margin-bottom:12px;">'
      +   '<div style="flex:1;text-align:center;padding:8px;background:rgba(255,255,255,0.03);border-radius:10px;"><div style="font-size:0.7em;color:#94a3b8;">' + (p.a.avatar || '🙂') + ' ' + esc(p.a.name) + '</div><div style="font-size:0.85em;font-weight:800;color:#fff;">' + p.stats.a.sessions + ' séance' + (p.stats.a.sessions > 1 ? 's' : '') + '</div></div>'
      +   '<div style="flex:1;text-align:center;padding:8px;background:rgba(255,255,255,0.03);border-radius:10px;"><div style="font-size:0.7em;color:#94a3b8;">' + (p.b.avatar || '🙂') + ' ' + esc(p.b.name) + '</div><div style="font-size:0.85em;font-weight:800;color:#fff;">' + p.stats.b.sessions + ' séance' + (p.stats.b.sessions > 1 ? 's' : '') + '</div></div>'
      + '</div>'
      // Bonus boss + délier
      + '<div style="display:flex;justify-content:space-between;align-items:center;font-size:0.7em;color:#64748b;">'
      +   '<span>⚔️ Bonus Boss Familial : <b style="color:#ec4899;">+' + bonus + '%</b> de dégâts</span>'
      +   '<button onclick="AwakDuoUnlink()" style="background:none;border:none;color:#64748b;font-size:0.9em;cursor:pointer;text-decoration:underline;">Délier</button>'
      + '</div>'
      + '</div>';
  }

  // ── Actions ────────────────────────────────────────────────────────
  window.AwakDuoLink = function (partnerId) {
    if (link(partnerId)) {
      var pm = profileMeta(partnerId);
      if (typeof window.showToast === 'function') window.showToast('💞 Duo formé avec ' + pm.name + ' !', 'success', 3500);
      if (typeof window.refreshCoopViews === 'function') window.refreshCoopViews(); else if (typeof window.renderAdventureTab === 'function') window.renderAdventureTab();
    }
  };
  window.AwakDuoUnlink = function () {
    var doIt = function () {
      unlink();
      if (typeof window.showToast === 'function') window.showToast('Duo dissous.', 'info', 2500);
      if (typeof window.refreshCoopViews === 'function') window.refreshCoopViews(); else if (typeof window.renderAdventureTab === 'function') window.renderAdventureTab();
    };
    if (typeof window.showConfirm === 'function') {
      window.showConfirm('Dissoudre le duo ? Le niveau et la progression seront perdus.', doIt);
    } else if (typeof confirm === 'function') {
      if (confirm('Dissoudre le duo ? Le niveau et la progression seront perdus.')) doIt();
    } else { doIt(); }
  };

  window.AwakDuo.renderCard = renderCard;
})();
