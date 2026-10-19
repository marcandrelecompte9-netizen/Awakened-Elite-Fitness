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
  var JOURS_LONG = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
  var ROSE = '#ec4899';

  // v1407 : NOS JOURS EN FAMILLE — réglage commun à l'appareil (tous les profils) :
  // { jours: [0..6] (0 = lundi), heure: 'HH:MM' }. Ces jours deviennent « Bouger
  // ensemble » dans le plan de chaque membre (calendar-tab.js planFor), donc à
  // l'accueil (objectif du jour) et dans l'agenda.
  var CLE_JOURS = 'awakFamJours';
  window.AwakFamJours = {
    get: function () {
      try {
        if (profils().length < 2) return null;
        var o = JSON.parse(localStorage.getItem(CLE_JOURS) || 'null');
        if (!o || !Array.isArray(o.jours) || !o.jours.length) return null;
        return { jours: o.jours.filter(function (j) { return j >= 0 && j <= 6; }), heure: o.heure || '' };
      } catch (e) { return null; }
    },
    lire: function () { try { return JSON.parse(localStorage.getItem(CLE_JOURS) || 'null') || { jours: [], heure: '18:00' }; } catch (e) { return { jours: [], heure: '18:00' }; } },
    ecrire: function (o) { try { localStorage.setItem(CLE_JOURS, JSON.stringify(o)); } catch (e) {} },
    basculer: function (i) {
      var o = this.lire(); o.jours = o.jours || [];
      var k = o.jours.indexOf(i); if (k >= 0) o.jours.splice(k, 1); else o.jours.push(i);
      o.jours.sort(); if (!o.heure) o.heure = '18:00';
      this.ecrire(o); this.rafraichir();
    },
    heure: function (h) { var o = this.lire(); o.heure = h || ''; this.ecrire(o); this.rafraichir(); },
    rafraichir: function () {
      var el = document.getElementById('awakFamJours'); if (el) el.outerHTML = carteJours();
      try { if (typeof window.updateHomeStats === 'function') window.updateHomeStats(); } catch (e) {}
    }
  };
  function fmtHeure(h) { if (!h) return ''; var m = /^(\d{1,2}):(\d{2})$/.exec(h); return m ? (+m[1]) + ' h' + (m[2] !== '00' ? ' ' + m[2] : '') : h; }
  function carteJours() {
    if (profils().length < 2) return '';
    var o = window.AwakFamJours.lire(), J = o.jours || [];
    if (enfantRegarde()) {
      if (!J.length) return '<div id="awakFamJours"></div>';
      return '<div id="awakFamJours" style="background:#12161c;border:1px solid rgba(236,72,153,0.25);border-radius:16px;padding:12px 14px;margin-bottom:12px;font-size:0.8em;color:#f1f5f9;">'
        + '<span style="font-size:0.75em;font-weight:900;letter-spacing:2px;color:' + ROSE + ';display:block;margin-bottom:4px;">NOS JOURS EN FAMILLE</span>'
        + esc(J.map(function (j) { return JOURS_LONG[j]; }).join(', ')) + (o.heure ? ' · ' + esc(fmtHeure(o.heure)) : '') + '</div>';
    }
    var puces = JOURS_LONG.map(function (n, i) {
      var on = J.indexOf(i) >= 0;
      return '<button type="button" onclick="AwakFamJours.basculer(' + i + ')" aria-pressed="' + on + '" style="flex:1;min-width:0;min-height:38px;padding:0;border-radius:10px;cursor:pointer;font-family:inherit;font-weight:900;font-size:0.78em;'
        + (on ? 'background:' + ROSE + ';color:#fff;border:1px solid ' + ROSE + ';' : 'background:rgba(255,255,255,0.04);color:#cbd5e1;border:1px solid rgba(255,255,255,0.12);') + '">' + n.charAt(0).toUpperCase() + n.slice(1, 3) + '</button>';
    }).join('');
    return '<div id="awakFamJours" style="background:#12161c;border:1px solid rgba(236,72,153,0.25);border-radius:16px;padding:12px 14px;margin-bottom:12px;">'
      + '<div style="font-size:0.6em;font-weight:900;letter-spacing:2px;color:' + ROSE + ';margin-bottom:4px;">NOS JOURS EN FAMILLE</div>'
      + '<div style="font-size:0.72em;color:#cbd5e1;margin-bottom:9px;line-height:1.45;">' + (J.length ? '« Bouger ensemble » est prévu ces jours-là pour tout le monde : à l\'accueil et dans l\'agenda de chacun.' : 'Choisis vos jours : « Bouger ensemble » s\'ajoutera au plan de chaque membre.') + '</div>'
      + '<div style="display:flex;gap:5px;">' + puces + '</div>'
      + '<label style="display:flex;align-items:center;gap:9px;margin-top:10px;font-size:0.74em;color:#cbd5e1;font-weight:700;">À quelle heure ?'
      +   '<input type="time" value="' + esc(o.heure || '18:00') + '" onchange="AwakFamJours.heure(this.value)" style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.15);border-radius:9px;color:#fff;padding:6px 9px;font-family:inherit;font-size:1em;"></label>'
      + '</div>';
  }

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

  function _sousTitre() {
    try {
      var w = seanceFamille(), t = 'Au poids du corps, pour toute la famille, au même rythme';
      var n = (w._adaptes || 0) + (w._retires || 0);
      if (n) t = n + ' exercice' + (n > 1 ? 's' : '') + ' adapté' + (n > 1 ? 's' : '') + ' aux limitations de la famille';
      return t;
    } catch (e) { return 'Au poids du corps, pour toute la famille, au même rythme'; }
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
        + '<span style="flex-shrink:0;">' + avatar(p.avatar, 36) + '</span>'
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
      + boutonBouger('8px 0 8px')
      + '</div>'
      + carteJours();
  }
  function boutonBouger(marge) {
    return '<button onclick="AwakFamilyMove()" style="display:flex;align-items:center;gap:10px;width:100%;margin:' + marge + ';padding:11px 13px;border-radius:13px;cursor:pointer;font-family:inherit;text-align:left;'
      +   'background:rgba(236,72,153,0.10);border:1px solid rgba(236,72,153,0.35);color:#fff;">'
      +   '<span style="flex-shrink:0;width:34px;height:34px;border-radius:10px;display:flex;align-items:center;justify-content:center;background:rgba(236,72,153,0.18);">' + (window.AwakIcon ? AwakIcon.get('groupe', 18, '#f9a8d4') : '') + '</span>'
      +   '<span style="flex:1;min-width:0;"><span style="display:block;font-size:0.86em;font-weight:800;">Bouger ensemble · ' + esc(versionDuJour().nom) + ' · 15 min</span>'
      +   '<span style="display:block;font-size:0.66em;color:#f9a8d4;margin-top:2px;">' + esc(_sousTitre()) + '</span></span>'
      +   '<span style="flex-shrink:0;color:#f9a8d4;font-size:1.1em;">›</span>'
      + '</button>';
  }
  // v1346 : version enfant de l'onglet — le bouton seul, sans le tableau (le ciel montre déjà qui a bougé)
  function renderBouger() {
    if (profils().length < 2) return '';
    return '<div id="awakFamBouger" style="margin-bottom:12px;">' + boutonBouger('0') + '</div>' + carteJours();
  }

  // ── « Bouger ensemble · 15 min » ──────────────────────────────────
  // Séance au minuteur, sans matériel, faisable par un enfant comme par un
  // adulte : tout le monde fait le même exercice en même temps. Lancée en mode
  // « séance à plusieurs » avec tous les profils de l'appareil : à la fin,
  // chacun la retrouve dans son historique (voir app.js, _famille).
  // v1305 : 5 versions qui tournent selon le jour (la même toute la journée),
  // et chaque exercice respecte les limitations et douleurs de TOUS les
  // participants : si un seul ne peut pas, il est remplacé pour tout le monde.
  var ECHAUFFEMENT = [{ n: 'Marche sur place', d: 45 }, { n: 'Cercles de bras', d: 45 }, { n: 'Montées de genoux sur place', d: 45 }];
  var VERSIONS = [
    { id: 'corps', nom: 'Tout le corps', circuit: [
      { n: 'Jumping jacks', d: 40 }, { n: 'Squat classique', d: 40 }, { n: 'Pompes genoux lentes', d: 40 },
      { n: 'Fentes arrière', d: 40 }, { n: 'Planche', d: 30 }, { n: 'Superman', d: 40 }] },
    { id: 'animaux', nom: 'Les animaux', circuit: [
      { n: 'Bear crawl', d: 30 }, { n: 'Jump squat', d: 30 }, { n: 'Donkey Kicks', d: 40 },
      { n: 'Inchworm', d: 40 }, { n: 'Fire hydrant', d: 40 }, { n: 'Superman', d: 40 }] },
    { id: 'cardio', nom: 'Cardio en rythme', circuit: [
      { n: 'Jumping jacks', d: 40 }, { n: 'Pas chassés latéraux', d: 40 }, { n: 'High knees', d: 30 },
      { n: 'Talons-fesses légers', d: 40 }, { n: 'Skater jumps', d: 30 }, { n: 'Montées de genoux sur place', d: 40 }] },
    { id: 'heros', nom: 'Super-héros', circuit: [
      { n: 'Squat sumo', d: 40 }, { n: 'Pompes larges', d: 30 }, { n: 'Fentes marchées', d: 40 },
      { n: 'Planche', d: 30 }, { n: 'Glute Bridge', d: 40 }, { n: 'Calf Raises debout', d: 40 }] },
    { id: 'equilibre', nom: 'Équilibre', circuit: [
      { n: 'Calf Raises debout', d: 40 }, { n: 'Calf Raises une jambe', d: 40 }, { n: 'Single Leg Glute Bridge', d: 40 },
      { n: 'Dead bug', d: 40 }, { n: 'Glute Bridge', d: 40 }, { n: 'Planche latérale', d: 30 }] }
  ];
  var ETIREMENTS = [{ n: 'Étirement quadriceps debout', d: 30 }, { n: 'Posture enfant', d: 30 }];
  var EQUILIBRE_APPUI = { name: 'Tenir sur une jambe (appui léger)', muscle: 'Mollets', type: 'exercise', position: 'debout', difficulty: 'Débutant', equipment: ['Poids du corps'],
    instructions: ['Debout près d\'un mur ou d\'une chaise, une main en appui léger', 'Lève un pied de quelques centimètres', 'Tiens en respirant calmement, change de jambe à mi-temps', 'Regarde un point fixe devant toi'] };

  function versionDuJour(d) {
    d = d || new Date();
    var debut = new Date(d.getFullYear(), 0, 1);
    var jour = Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()) - debut) / 864e5);
    return VERSIONS[jour % VERSIONS.length];
  }
  function participants() { return profils().map(function (p) { return p.id; }); }
  function limitationsDe(id) {
    try {
      var ids = JSON.parse(localStorage.getItem('awakLimitations_' + id) || '[]');
      var L = (window.AwakLimitations && AwakLimitations.liste) || [];
      return L.filter(function (l) { return ids.indexOf(l.id) >= 0; });
    } catch (e) { return []; }
  }
  function seniorPresent(ids) {
    try { return ids.some(function (id) { return window.AwakYouth && AwakYouth.isSeniorProfile && AwakYouth.isSeniorProfile(id); }); } catch (e) { return false; }
  }
  function impact(ex) {
    var L = (window.AwakLimitations && AwakLimitations.liste) || [];
    for (var i = 0; i < L.length; i++) if (L[i].id === 'impact') { try { return !!L[i].test(ex); } catch (e) { return false; } }
    return /(saut|jump|jumping|high knees|burpee|mountain|skater)/i.test(ex.name || '');
  }
  // Test commun : un exercice est écarté si UN participant ne peut pas le faire
  function testeur(ids) {
    var lims = [];
    ids.forEach(function (id) { limitationsDe(id).forEach(function (l) { if (lims.indexOf(l) < 0) lims.push(l); }); });
    var sansSauts = seniorPresent(ids);
    return function (ex) {
      for (var i = 0; i < lims.length; i++) { try { if (lims[i].test(ex)) return true; } catch (e) {} }
      try { if (window.AwakPain && AwakPain.exerciseHitsPainFor && AwakPain.exerciseHitsPainFor(ex, ids)) return true; } catch (e) {}
      if (sansSauts && impact(ex)) return true;
      return false;
    };
  }

  function seanceFamille(d, idsChoisis) {
    var db = window.exerciseDatabase || [];
    var v = versionDuJour(d), ids = (idsChoisis && idsChoisis.length) ? idsChoisis : participants(), senior = seniorPresent(ids);
    function ex(p, extra) {
      var e = db.filter(function (x) { return x && x.name === p.n; })[0];
      if (!e) return null;
      return Object.assign({}, e, { _baseName: e.name, mode: 'timer', duration: p.d, sets: 1, plannedSets: 1 }, extra || {});
    }
    var adapt = function (liste) {
      if (typeof window.AwakAdapterExercices !== 'function') return { exercises: liste, adaptes: 0, retires: 0 };
      return window.AwakAdapterExercices(liste, testeur(ids));
    };
    var echauf = ECHAUFFEMENT.map(function (p) { return ex(p, { isWarmup: true, type: 'warmup' }); }).filter(Boolean);
    var circuit = v.circuit.map(function (p) { var e = ex(p); if (e) { e.type = 'exercise'; delete e.isWarmup; } return e; }).filter(Boolean);
    if (senior) circuit.unshift(Object.assign({}, EQUILIBRE_APPUI, { mode: 'timer', duration: 30, sets: 1, plannedSets: 1 }));
    var etir = ETIREMENTS.map(function (p) { return ex(p, { isStretch: true, type: 'stretch' }); }).filter(Boolean);
    var a1 = adapt(echauf), a2 = adapt(circuit), a3 = adapt(etir);
    var L = a1.exercises.slice(), repos = function () { return { name: 'Repos', duration: 20, isRest: true, mode: 'timer' }; };
    for (var tour = 0; tour < 2; tour++) {
      a2.exercises.forEach(function (e) { L.push(Object.assign({}, e)); L.push(repos()); });
    }
    if (L.length && L[L.length - 1].isRest) L.pop();
    a3.exercises.forEach(function (e) { L.push(e); });
    return {
      name: 'Bouger ensemble · ' + v.nom, mode: 'timer', type: 'famille', _famille: true, _versionFamille: v.id,
      _adaptes: a1.adaptes + a2.adaptes + a3.adaptes, _retires: a1.retires + a2.retires + a3.retires, _senior: senior,
      restBetweenSets: 20, exercises: L,
      badgeHTML: 'En famille · ' + v.nom, badgeStyle: 'linear-gradient(135deg,#ec4899,#be185d)'
    };
  }
  // v1407 : « Qui est là ? » — avant, tous les profils de l'appareil étaient crédités,
  // même un absent (le ciel et les défis étaient faussés). Tous cochés par défaut.
  window.AwakFamilyMove = function () {
    var tous = profils(), me = moi();
    if (tous.length < 2) return lancerFamille(participants());
    var vieux = document.getElementById('awakFamQui'); if (vieux) vieux.remove();
    var choisis = {}; tous.forEach(function (p) { choisis[p.id] = true; });
    var ov = document.createElement('div');
    ov.id = 'awakFamQui';
    ov.style.cssText = 'position:fixed;inset:0;z-index:12500;background:rgba(0,0,0,0.75);display:flex;align-items:center;justify-content:center;padding:18px;';
    function dessiner() {
      var n = tous.filter(function (p) { return choisis[p.id]; }).length;
      ov.innerHTML = '<div style="width:100%;max-width:420px;background:#12161c;border:1px solid rgba(236,72,153,0.35);border-radius:18px;padding:18px 16px 14px;box-sizing:border-box;">'
        + '<div style="font-size:0.6em;font-weight:900;letter-spacing:2px;color:' + ROSE + ';">BOUGER ENSEMBLE</div>'
        + '<div style="font-size:1.08em;font-weight:900;color:#fff;margin:4px 0 4px;">Qui est là ?</div>'
        + '<div style="font-size:0.74em;color:#a3b1c2;margin-bottom:12px;">La séance sera enregistrée chez chaque membre coché.</div>'
        + '<div style="display:flex;flex-direction:column;gap:7px;">' + tous.map(function (p) {
            var on = !!choisis[p.id], estMoi = p.id === me;
            return '<button type="button" data-qui="' + esc(p.id) + '" style="display:flex;align-items:center;gap:10px;width:100%;padding:8px 10px;border-radius:12px;cursor:' + (estMoi ? 'default' : 'pointer') + ';font-family:inherit;text-align:left;min-height:auto;'
              + (on ? 'background:rgba(236,72,153,0.12);border:1.5px solid ' + ROSE + ';' : 'background:rgba(255,255,255,0.03);border:1.5px solid rgba(255,255,255,0.1);opacity:0.7;') + '">'
              + avatar(p.avatar, 32) + '<span style="flex:1;font-size:0.88em;font-weight:800;color:#f1f5f9;">' + esc(estMoi ? (p.name || 'Toi') + ' (toi)' : (p.name || 'Membre')) + '</span>'
              + '<span style="width:22px;height:22px;border-radius:7px;display:flex;align-items:center;justify-content:center;' + (on ? 'background:' + ROSE + ';' : 'border:1.5px solid rgba(255,255,255,0.25);') + '">' + (on && window.AwakIcon ? AwakIcon.get('valide', 14, '#fff') : '') + '</span></button>';
          }).join('') + '</div>'
        + '<button type="button" data-go style="width:100%;margin-top:14px;padding:13px;border:none;border-radius:13px;cursor:pointer;font-family:inherit;font-weight:900;font-size:0.92em;color:#fff;background:linear-gradient(135deg,#ec4899,#be185d);">C\'est parti · ' + n + ' membre' + (n > 1 ? 's' : '') + '</button>'
        + '<button type="button" data-annuler style="width:100%;margin-top:8px;padding:10px;border-radius:12px;cursor:pointer;font-family:inherit;font-weight:700;font-size:0.8em;color:#94a3b8;background:transparent;border:1px solid rgba(255,255,255,0.1);min-height:auto;">Annuler</button>'
        + '</div>';
      ov.querySelectorAll('[data-qui]').forEach(function (b) {
        b.onclick = function () { var id = b.getAttribute('data-qui'); if (id === me) return; choisis[id] = !choisis[id]; dessiner(); };
      });
      ov.querySelector('[data-go]').onclick = function () { ov.remove(); lancerFamille(tous.filter(function (p) { return choisis[p.id]; }).map(function (p) { return p.id; })); };
      ov.querySelector('[data-annuler]').onclick = function () { ov.remove(); };
    }
    ov.onclick = function (e) { if (e.target === ov) ov.remove(); };
    dessiner();
    document.body.appendChild(ov);
  };
  function lancerFamille(ids) {
    var w = seanceFamille(null, ids);
    if (!w.exercises.length) return;
    // Les membres présents participent (le profil actif mène la séance)
    try {
      if (window.AwakGroup && typeof AwakGroup.setParticipants === 'function') {
        if (typeof AwakGroup.reset === 'function') AwakGroup.reset();
        var me = moi();
        AwakGroup.setParticipants(profils().filter(function (p) { return p.id !== me && ids.indexOf(p.id) >= 0; }).map(function (p) {
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
  window.AwakFamilyMoveVersions = VERSIONS;

  window.AwakFamilyWeek = { render: render, renderBouger: renderBouger, semaine: semaine };
})();
