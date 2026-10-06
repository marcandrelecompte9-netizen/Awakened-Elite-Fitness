/* ═══════════════════════════════════════════════════════════════════
   NOTRE SEMAINE (v1295) — qui a bougé cette semaine, d'un coup d'œil
   ─────────────────────────────────────────────────────────────────────
   En haut de l'onglet Famille : une ligne par membre de l'appareil, les
   7 jours du lundi au dimanche, un point allumé les jours où il s'est
   entraîné. Toucher un autre membre ouvre son menu (encourager, jouer,
   défier). Lecture seule : rien n'est enregistré.
   Profil ENFANT qui regarde : comme ailleurs dans l'appli, pas de lecture
   comparative — ses propres jours, et pour les autres seulement « a bougé
   cette semaine » ou pas.
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var JOURS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
  var ROSE = '#ec4899';

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function moi() { try { return typeof window.getCurrentProfileId === 'function' ? window.getCurrentProfileId() : null; } catch (e) { return null; } }
  function profils() { try { return typeof window.getAllProfiles === 'function' ? (window.getAllProfiles() || []) : []; } catch (e) { return []; } }
  function avatar(a, t) {
    try { if (typeof window.renderAvatar === 'function') return window.renderAvatar(a || '', t); } catch (e) {}
    return '<span style="display:inline-block;width:' + t + 'px;height:' + t + 'px;border-radius:50%;background:rgba(255,255,255,0.08);"></span>';
  }
  function enfantRegarde() { try { return !!(window.AwakYouth && AwakYouth.isChild && AwakYouth.isChild()); } catch (e) { return false; } }

  // Lundi 00:00 de la semaine en cours (heure locale)
  function lundi() {
    var d = new Date(); d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return d;
  }
  function historique(pid, estMoi) {
    try {
      var raw = localStorage.getItem('profile_' + pid + '_workoutHistory');
      if (!raw && estMoi) raw = localStorage.getItem('workoutHistory');
      var h = raw ? JSON.parse(raw) : [];
      return Array.isArray(h) ? h : [];
    } catch (e) { return []; }
  }
  // { jours: [bool×7], seances: n }
  function semaine(pid, estMoi) {
    var l0 = lundi().getTime(), jours = [false, false, false, false, false, false, false], n = 0;
    historique(pid, estMoi).forEach(function (w) {
      var t = w && w.date ? Date.parse(w.date) : (w && w.id ? +w.id : 0);
      if (!t || isNaN(t) || t < l0) return;
      var d = new Date(t); d.setHours(0, 0, 0, 0);
      var i = Math.round((d.getTime() - l0) / 864e5);
      if (i >= 0 && i < 7) { jours[i] = true; n++; }
    });
    return { jours: jours, seances: n };
  }

  function points(jours, iAuj) {
    return '<span style="display:flex;gap:5px;flex-shrink:0;">' + jours.map(function (on, i) {
      var auj = i === iAuj, futur = i > iAuj;
      return '<span style="display:flex;flex-direction:column;align-items:center;gap:3px;">'
        + '<span style="font-size:0.5em;font-weight:800;color:' + (auj ? '#f9a8d4' : '#64748b') + ';">' + JOURS[i] + '</span>'
        + '<span style="width:15px;height:15px;border-radius:50%;box-sizing:border-box;'
        +   (on ? 'background:' + ROSE + ';' : 'background:' + (futur ? 'transparent' : 'rgba(255,255,255,0.06)') + ';')
        +   'border:1.5px solid ' + (on ? ROSE : (auj ? '#f9a8d4' : 'rgba(255,255,255,0.10)')) + ';"></span>'
        + '</span>';
    }).join('') + '</span>';
  }

  function render() {
    var tous = profils();
    if (tous.length < 2) return '';
    var me = moi(), enf = enfantRegarde();
    var iAuj = (new Date().getDay() + 6) % 7;
    // moi d'abord, puis les autres dans l'ordre des profils
    var ordre = tous.filter(function (p) { return p.id === me; }).concat(tous.filter(function (p) { return p.id !== me; }));
    var total = 0, actifs = 0;
    var lignes = ordre.map(function (p) {
      var estMoi = p.id === me, s = semaine(p.id, estMoi);
      total += s.seances; if (s.seances) actifs++;
      var nom = estMoi ? 'Toi' : (p.name || 'Membre');
      var droite;
      if (enf && !estMoi) {
        droite = '<span style="font-size:0.66em;font-weight:700;color:' + (s.seances ? '#f9a8d4' : '#64748b') + ';white-space:nowrap;">' + (s.seances ? 'A bougé' : 'Pas encore') + '</span>';
      } else {
        droite = points(s.jours, iAuj);
      }
      var clic = estMoi ? '' : ' onclick="if(window.AwakConstMenu)AwakConstMenu(\'' + String(p.id).replace(/'/g, '') + '\')"';
      return '<div' + clic + ' style="display:flex;align-items:center;gap:10px;padding:8px 0;border-top:1px solid rgba(255,255,255,0.05);' + (estMoi ? '' : 'cursor:pointer;') + '">'
        + '<span style="flex-shrink:0;">' + avatar(p.avatar, 28) + '</span>'
        + '<span style="flex:1;min-width:0;font-size:0.84em;font-weight:800;color:#f1f5f9;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + esc(nom) + '</span>'
        + droite
        + '</div>';
    }).join('');
    var resume = enf
      ? (actifs > 1 ? 'Toute la famille bouge cette semaine !' : 'Bouge avec ta famille cette semaine.')
      : (total + ' séance' + (total > 1 ? 's' : '') + ' · ' + actifs + ' sur ' + ordre.length + ' ont bougé');
    return '<div id="awakFamSemaine" style="background:#12161c;border:1px solid rgba(255,255,255,0.06);border-radius:16px;padding:12px 14px 6px;margin-bottom:12px;">'
      + '<div style="display:flex;align-items:baseline;justify-content:space-between;gap:10px;margin-bottom:6px;">'
      +   '<span style="font-size:0.6em;font-weight:900;letter-spacing:2px;color:' + ROSE + ';">NOTRE SEMAINE</span>'
      +   '<span style="font-size:0.66em;color:#94a3b8;">' + esc(resume) + '</span>'
      + '</div>'
      + lignes
      + (enf ? '' : '<div style="font-size:0.62em;color:#64748b;padding:6px 0 2px;">Touche un membre pour l\'encourager ou lui lancer un défi.</div>')
      + '<button onclick="AwakFamilyMove()" style="display:flex;align-items:center;gap:10px;width:100%;margin:8px 0 8px;padding:11px 13px;border-radius:13px;cursor:pointer;font-family:inherit;text-align:left;'
      +   'background:rgba(236,72,153,0.10);border:1px solid rgba(236,72,153,0.35);color:#fff;">'
      +   '<span style="flex-shrink:0;width:34px;height:34px;border-radius:10px;display:flex;align-items:center;justify-content:center;background:rgba(236,72,153,0.18);">' + (window.AwakIcon ? AwakIcon.get('groupe', 18, '#f9a8d4') : '') + '</span>'
      +   '<span style="flex:1;min-width:0;"><span style="display:block;font-size:0.86em;font-weight:800;">Bouger ensemble · 15 min</span>'
      +   '<span style="display:block;font-size:0.66em;color:#f9a8d4;margin-top:2px;">Une séance au poids du corps pour toute la famille, au même rythme</span></span>'
      +   '<span style="flex-shrink:0;color:#f9a8d4;font-size:1.1em;">›</span>'
      + '</button>'
      + '</div>';
  }

  // ── « Bouger ensemble · 15 min » ──────────────────────────────────
  // Séance au minuteur, sans matériel, faisable par un enfant comme par un
  // adulte : tout le monde fait le même exercice en même temps. Lancée en mode
  // « séance à plusieurs » avec tous les profils de l'appareil : à la fin,
  // chacun la retrouve dans son historique (voir app.js, _famille).
  var PLAN = [
    { n: 'Marche sur place', d: 45, echauffement: true },
    { n: 'Cercles de bras', d: 45, echauffement: true },
    { n: 'Montées de genoux sur place', d: 45, echauffement: true },
    { n: 'Jumping jacks', d: 40 }, { n: 'Squat classique', d: 40 }, { n: 'Pompes genoux lentes', d: 40 },
    { n: 'Fentes arrière', d: 40 }, { n: 'Planche', d: 30 }, { n: 'Superman', d: 40 }
  ];
  var ETIREMENTS = [{ n: 'Étirement quadriceps debout', d: 30 }, { n: 'Posture enfant', d: 30 }];
  function seanceFamille() {
    var db = window.exerciseDatabase || [];
    function ex(p, extra) {
      var e = db.filter(function (x) { return x && x.name === p.n; })[0];
      if (!e) return null;
      return Object.assign({}, e, { _baseName: e.name, mode: 'timer', duration: p.d, sets: 1, plannedSets: 1 }, extra || {});
    }
    var L = [], repos = function () { return { name: 'Repos', duration: 20, isRest: true, mode: 'timer' }; };
    PLAN.filter(function (p) { return p.echauffement; }).forEach(function (p) { var e = ex(p, { isWarmup: true }); if (e) L.push(e); });
    var circuit = PLAN.filter(function (p) { return !p.echauffement; });
    for (var tour = 0; tour < 2; tour++) {
      circuit.forEach(function (p) { var e = ex(p); if (e) { L.push(e); L.push(repos()); } });
    }
    if (L.length && L[L.length - 1].isRest) L.pop();
    ETIREMENTS.forEach(function (p) { var e = ex(p, { isStretch: true }); if (e) L.push(e); });
    return {
      name: 'Bouger ensemble', mode: 'timer', type: 'famille', _famille: true,
      restBetweenSets: 20, exercises: L,
      badgeHTML: 'En famille', badgeStyle: 'linear-gradient(135deg,#ec4899,#be185d)'
    };
  }
  window.AwakFamilyMove = function () {
    var w = seanceFamille();
    if (!w.exercises.length) return;
    // Toute la famille de l'appareil participe (le profil actif mène la séance)
    try {
      if (window.AwakGroup && typeof AwakGroup.setParticipants === 'function') {
        if (typeof AwakGroup.reset === 'function') AwakGroup.reset();
        var me = moi();
        AwakGroup.setParticipants(profils().filter(function (p) { return p.id !== me; }).map(function (p) {
          return { kind: 'profile', id: p.id, name: p.name || 'Membre', avatar: p.avatar || '' };
        }));
      }
    } catch (e) {}
    if (typeof window.switchTab === 'function') window.switchTab('workouts');
    setTimeout(function () {
      if (typeof window.showWorkoutPreparation === 'function') window.showWorkoutPreparation(w);
    }, 120);
  };
  window.AwakFamilyMoveWorkout = seanceFamille;

  window.AwakFamilyWeek = { render: render, semaine: semaine };
})();
