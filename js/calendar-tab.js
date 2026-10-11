/* ═══════════════════════════════════════════════════════════════════════
   📅  ONGLET CALENDRIER — Awakened
   -----------------------------------------------------------------------
   Sort le calendrier de l'onglet Progression et en fait un onglet à part
   entière. Affiche, sur une grille mensuelle, le planning hebdomadaire
   (manualWeeklyPlan) de la personne. Chaque MEMBRE de la famille = un
   PROFIL : on superpose les plannings des autres membres d'un seul clic.
   Pensé pour rester affiché en permanence sur une tablette dans la salle.

   ⚠️ CE MODULE NE FAIT QUE LIRE. Il n'écrit jamais dans localStorage ni
      dans les données de profil. Sources lues :
        • getAllProfiles()                       → [{id,name,avatar}]
        • getCurrentProfileId()                  → id du profil actif
        • localStorage['manualWeeklyPlan_'+id]   → {lun:{muscles,label}, …}
        • getProfileData(id,'workoutHistory')    → séances réellement faites
        • window.renderAvatar(avatar, size)      → rendu d'avatar (emoji/av:)

   Point d'entrée : window.renderCalendarTab()  (appelé par switchTab).
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var JOURS       = ['lun', 'mar', 'mer', 'jeu', 'ven', 'sam', 'dim'];
  var JOURS_LONG  = { lun: 'Lundi', mar: 'Mardi', mer: 'Mercredi', jeu: 'Jeudi', ven: 'Vendredi', sam: 'Samedi', dim: 'Dimanche' };
  var JOURS_ENT   = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  var MOIS_COURT  = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
  var MOIS        = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

  // Palette d'accents attribuée par ordre dans getAllProfiles(). Couleurs
  // distinctes et lisibles sur fond sombre — pas d'arc-en-ciel criard.
  var PALETTE = [
    { base: '#22d3ee', soft: 'rgba(34,211,238,0.15)',  line: 'rgba(34,211,238,0.50)' },  // cyan
    { base: '#a855f7', soft: 'rgba(168,85,247,0.15)',  line: 'rgba(168,85,247,0.50)' },  // violet
    { base: '#60a8f0', soft: 'rgba(96,168,240,0.15)',  line: 'rgba(96,168,240,0.50)' },  // bleu
    { base: '#fbbf24', soft: 'rgba(251,191,36,0.15)',  line: 'rgba(251,191,36,0.50)' },  // ambre
    { base: '#f472b6', soft: 'rgba(244,114,182,0.15)', line: 'rgba(244,114,182,0.50)' }, // rose
    { base: '#fb923c', soft: 'rgba(251,146,60,0.15)',  line: 'rgba(251,146,60,0.50)' },  // orange
    { base: '#e879f9', soft: 'rgba(232,121,249,0.15)', line: 'rgba(232,121,249,0.50)' }, // fuchsia
    { base: '#38bdf8', soft: 'rgba(56,189,248,0.15)',  line: 'rgba(56,189,248,0.50)' }   // ciel
  ];

  var now0 = new Date();
  var cal = {
    month: now0.getMonth(),
    year:  now0.getFullYear(),
    vue: 'semaine',   // 'semaine' (lisible de loin) ou 'mois' (vue d'ensemble)
    lundi: null,      // lundi de la semaine affichée (vue semaine)
    selected: null    // Set d'ids ; initialisé au 1er rendu
  };

  // Lundi de la semaine contenant `d`
  function lundiDe(d) {
    var x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
    return x;
  }
  cal.lundi = lundiDe(now0);

  function memeJour(a, b) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function profiles() {
    try { return (typeof getAllProfiles === 'function') ? (getAllProfiles() || []) : []; }
    catch (e) { return []; }
  }
  function currentId() {
    try { return (typeof getCurrentProfileId === 'function') ? getCurrentProfileId() : null; }
    catch (e) { return null; }
  }
  function colorFor(i) { return PALETTE[i % PALETTE.length]; }

  // ═══ RÉSOLUTION DU PLANNING ═══════════════════════════════════════
  // L'app a TROIS sources de planning, stockées séparément :
  //   ① weeklyPlan_<id>            → routine assignée à un jour (le + explicite)
  //   ② manualWeeklyPlan_<id>      → plan manuel par muscles (+ heure)
  //   ③ profile_<id>_weeklyPlan    → plan actif : IA, Programme Star, Découverte
  //                                  (ces trois-là s'écrasent entre eux)
  // ⚠️ weeklyPlan_<id> et profile_<id>_weeklyPlan sont DEUX clés différentes
  //    aux noms presque identiques — ne pas les confondre.
  // Le calendrier applique une priorité JOUR PAR JOUR : ① puis ② puis ③.
  // Chaque séance porte sa provenance (`source`) pour l'afficher.

  function readJSON(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return fallback;
      var o = JSON.parse(raw);
      return (o && typeof o === 'object') ? o : fallback;
    } catch (e) { return fallback; }
  }

  // ② plan manuel par muscles
  function manualPlanFor(id) { return readJSON('manualWeeklyPlan_' + id, {}); }

  // ① routines assignées aux jours (+ catalogue de routines du membre)
  function dayRoutinesFor(id) { return readJSON('weeklyPlan_' + id, {}); }
  function routinesFor(id) {
    var r = readJSON('routines_' + id, []);
    return Array.isArray(r) ? r : [];
  }

  // ③ plan actif (IA / Star / Découverte) — tableau de 7 jours, lundi en premier
  function activePlanFor(id) {
    var o = readJSON('profile_' + id + '_weeklyPlan', null);
    if (!o || !Array.isArray(o.plan)) return null;
    return o.plan;
  }

  // ── Programme actif (onglet Programme) : semaine en cours ──
  var JOURS_NOMS = { lundi: 'lun', mardi: 'mar', mercredi: 'mer', jeudi: 'jeu', vendredi: 'ven', samedi: 'sam', dimanche: 'dim' };
  function programmeFor(id) {
    var o = readJSON('activePlan_' + id, null);
    if (!o || !Array.isArray(o.weeks) || !o.weeks.length) return null;
    var no = parseInt(o.currentWeek, 10) || 1;
    var sem = o.weeks[Math.min(o.weeks.length, Math.max(1, no)) - 1];
    if (!sem || !Array.isArray(sem.sessions)) return null;
    var db = window.exerciseDatabase || [];
    var out = {};
    sem.sessions.forEach(function (se, idx) {
      var cle = JOURS_NOMS[String(se.day || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')];
      if (!cle || out[cle]) return;
      var mus = [];
      (se.exercises || []).forEach(function (n) {
        var ex = null;
        for (var k = 0; k < db.length; k++) { if (db[k] && db[k].name === n) { ex = db[k]; break; } }
        if (ex && ex.muscle && mus.indexOf(ex.muscle) < 0) mus.push(ex.muscle);
      });
      out[cle] = { muscles: mus.length ? mus : ['Séance'], label: se.name || o.name || 'Programme',
                   source: 'programme', planWeek: no, planIdx: idx, programme: o.name || '' };
    });
    return out;
  }

  // ── Planning à suivre (choix du membre) ──
  //   auto      → priorité jour par jour : routine, manuel, plan (comportement historique)
  //   routine   → uniquement les routines assignées aux jours
  //   ia        → uniquement le plan de la semaine (manuel + intelligent / Star)
  //   programme → uniquement la semaine en cours du programme actif
  var SOURCE_KEYS = ['auto', 'routine', 'ia', 'programme'];
  function sourcePref(id) {
    try { var v = localStorage.getItem('awakPlanSource_' + id); return SOURCE_KEYS.indexOf(v) >= 0 ? v : 'auto'; }
    catch (e) { return 'auto'; }
  }
  function setSourcePref(id, v) {
    try {
      if (v === 'auto' || SOURCE_KEYS.indexOf(v) < 0) localStorage.removeItem('awakPlanSource_' + id);
      else localStorage.setItem('awakPlanSource_' + id, v);
    } catch (e) {}
  }
  // Quelles sources ont réellement du contenu (pour griser les choix vides)
  function sourcesDispo(id) {
    var assign = dayRoutinesFor(id), a = false;
    Object.keys(assign || {}).forEach(function (k) { if (assign[k]) a = true; });
    var man = manualPlanFor(id), m = false;
    Object.keys(man || {}).forEach(function (k) { if (man[k] && man[k].muscles && man[k].muscles.length) m = true; });
    var act = activePlanFor(id), i = false;
    (act || []).forEach(function (j) { if (j && j.intensity !== 'rest' && j.muscles && j.muscles.length) i = true; });
    var prog = readJSON('activePlan_' + id, null);
    return { routine: a, ia: m || i, programme: !!(prog && prog.weeks), nomProgramme: prog ? (prog.name || '') : '' };
  }

  // Planning résolu d'un membre : { lun: {muscles,label,heure,source}, … }
  function planFor(id) {
    var out = {};
    var pref = sourcePref(id);
    var manual = manualPlanFor(id);
    if (pref === 'programme') {
      var pg = programmeFor(id) || {};
      Object.keys(pg).forEach(function (d) { pg[d].heure = (manual[d] && manual[d].heure) || null; });
      return pg;
    }
    var assign = pref === 'ia' ? {} : dayRoutinesFor(id);
    var routines = routinesFor(id);
    var actif = pref === 'routine' ? null : activePlanFor(id);

    JOURS.forEach(function (d, i) {
      // ① routine assignée à ce jour
      var rid = assign && assign[d];
      if (rid) {
        var r = routines.filter(function (x) { return x && x.id === rid; })[0];
        if (r) {
          var mus = (r.muscles && r.muscles.length)
            ? r.muscles.slice()
            : (r.exercises || []).map(function (e) { return e && e.muscle; })
                .filter(function (m, k, arr) { return m && arr.indexOf(m) === k; });
          out[d] = {
            muscles: mus.length ? mus : ['Séance'],
            label: r.name || 'Routine',
            heure: (manual[d] && manual[d].heure) || null,
            source: 'routine',
            routineId: rid,
            couleur: r.color || null
          };
          return;
        }
      }
      // ② plan manuel par muscles
      if (pref !== 'routine' && manual[d] && manual[d].muscles && manual[d].muscles.length) {
        out[d] = {
          muscles: manual[d].muscles.slice(),
          label: manual[d].label || '',
          heure: manual[d].heure || null,
          source: 'manuel'
        };
        return;
      }
      // ③ plan actif (IA / Star / Découverte)
      if (actif && actif[i]) {
        var j = actif[i];
        var estRepos = (j.intensity === 'rest') || !j.muscles || !j.muscles.length;
        if (!estRepos) {
          out[d] = {
            muscles: j.muscles.slice(),
            label: j.focus || '',
            heure: (manual[d] && manual[d].heure) || null,
            source: 'plan'
          };
        }
      }
    });
    return out;
  }

  // Libellé et couleur de la pastille de provenance
  var SOURCES = {
    routine: { txt: 'ROUTINE', col: '#22d3ee' },
    manuel:  { txt: 'MANUEL',  col: '#60a8f0' },
    plan:    { txt: 'PLAN',    col: '#c084fc' },
    programme: { txt: 'PROGRAMME', col: '#fbbf24' }
  };
  function sourceChip(src) {
    var m = SOURCES[src];
    if (!m) return '';
    return '<span style="border:1px solid ' + m.col + '55;color:' + m.col + ';background:' + m.col + '14;' +
      'padding:1px 7px;border-radius:99px;font-size:0.58em;font-weight:900;letter-spacing:0.5px;">' + m.txt + '</span>';
  }
  function planHasTraining(plan) {
    try {
      var k = Object.keys(plan || {});
      for (var i = 0; i < k.length; i++) {
        var d = plan[k[i]];
        if (d && d.muscles && d.muscles.length) return true;
      }
    } catch (e) {}
    return false;
  }

  // Séances réellement faites d'un profil → map 'AAAA-M-J' => true
  function doneDates(id) {
    var set = {};
    try {
      var raw = (typeof getProfileData === 'function')
        ? getProfileData(id, 'workoutHistory')
        : localStorage.getItem('profile_' + id + '_workoutHistory');
      if (!raw) return set;
      var arr = JSON.parse(raw);
      if (!Array.isArray(arr)) return set;
      arr.forEach(function (w) {
        var d = new Date(w && (w.date || w.completedAt || w.timestamp) || 0);
        // v1319 : on garde le NOM de la séance (toujours « vrai ») pour l'afficher
        // les jours où elle a été faite hors planning
        var k = d.getFullYear() + '-' + d.getMonth() + '-' + d.getDate();
        if (!isNaN(d.getTime())) set[k] = set[k] || String((w && w.name) || 'Séance').replace(/^[^A-Za-zÀ-ÿ0-9]+/, '') || 'Séance';
      });
    } catch (e) {}
    return set;
  }

  // Index lundi=0 … dimanche=6
  function wIdx(date) { return (date.getDay() + 6) % 7; }

  function av(a, size) {
    try { if (typeof window.renderAvatar === 'function') return window.renderAvatar(a, size); } catch (e) {}
    return '<span style="font-size:' + Math.round(size * 0.6) + 'px;line-height:1;">' + (a || '👤') + '</span>';
  }

  // ═══ HEURES ════════════════════════════════════════════════════════
  // Deux niveaux, l'exception l'emporte toujours sur la récurrence :
  //   1. RÉCURRENTE : plan[jour].heure        → « tous les lundis à 18h »
  //   2. EXCEPTION  : awakCalTimeEx_<profil>  → « ce 15 seulement, 19h »
  //      { '2026-9-15': '19:00' }  ·  '' = séance annulée exceptionnellement
  var EX_KEY = 'awakCalTimeEx_';

  function exFor(id) {
    try {
      var raw = localStorage.getItem(EX_KEY + id);
      if (!raw) return {};
      var o = JSON.parse(raw);
      return (o && typeof o === 'object') ? o : {};
    } catch (e) { return {}; }
  }
  function saveEx(id, obj) {
    try { localStorage.setItem(EX_KEY + id, JSON.stringify(obj || {})); } catch (e) {}
  }

  // Heure effective d'un membre pour une date donnée (null si aucune).
  function timeFor(id, ymd, dayKey, plan) {
    var ex = exFor(id);
    if (Object.prototype.hasOwnProperty.call(ex, ymd)) return ex[ymd] || null;
    var s = (plan || {})[dayKey];
    return (s && s.heure) ? s.heure : null;
  }
  function hasEx(id, ymd) {
    return Object.prototype.hasOwnProperty.call(exFor(id), ymd);
  }

  // '18:30' → '18h30'   ·   '18:00' → '18h'
  function fmtTime(t) {
    if (!t) return '';
    var p = String(t).split(':');
    if (p.length < 2) return String(t);
    var h = parseInt(p[0], 10), mi = p[1];
    if (isNaN(h)) return String(t);
    return h + 'h' + (mi === '00' ? '' : mi);
  }
  function toMin(t) {
    if (!t) return null;
    var p = String(t).split(':');
    var h = parseInt(p[0], 10), mi = parseInt(p[1], 10);
    if (isNaN(h) || isNaN(mi)) return null;
    return h * 60 + mi;
  }
  // Tri : les séances avec heure d'abord (chronologique), puis les sans-heure.
  function byTime(a, b) {
    var x = toMin(a.heure), y = toMin(b.heure);
    if (x === null && y === null) return 0;
    if (x === null) return 1;
    if (y === null) return -1;
    return x - y;
  }
  // Chevauchement = deux séances à moins de 60 min d'écart (pas de durée stockée).
  function overlaps(entries) {
    var withT = entries.filter(function (e) { return toMin(e.heure) !== null; })
                       .sort(function (a, b) { return toMin(a.heure) - toMin(b.heure); });
    var out = [];
    for (var i = 1; i < withT.length; i++) {
      if (Math.abs(toMin(withT[i].heure) - toMin(withT[i - 1].heure)) < 60) {
        out.push([withT[i - 1], withT[i]]);
      }
    }
    return out;
  }

  // Séances d'une date, tous membres sélectionnés confondus.
  function entriesFor(list, plans, dones, y, m, d) {
    var dayKey = JOURS[wIdx(new Date(y, m, d))];
    var ymd = y + '-' + m + '-' + d;
    var out = [];
    list.forEach(function (p) {
      if (!cal.selected.has(p.id)) return;
      var s = (plans[p.id] || {})[dayKey];
      if (!s || !s.muscles || !s.muscles.length) {
        // v1319 : séance faite sans être prévue → elle apparaît quand même (au lieu de « Repos »)
        var nm = dones[p.id] && dones[p.id][ymd];
        if (nm) out.push({ profil: p, seance: { label: typeof nm === 'string' ? nm : 'Séance', muscles: [], source: 'faite' },
                           heure: null, exception: false, faite: true, horsPlan: true });
        return;
      }
      out.push({
        profil: p,
        seance: s,
        heure: timeFor(p.id, ymd, dayKey, plans[p.id]),
        exception: hasEx(p.id, ymd),
        faite: !!(dones[p.id] && dones[p.id][ymd])
      });
    });
    return out.sort(byTime);
  }

  // Sélection initiale : le profil actif seul (ou le premier profil).
  function ensureSelected(list) {
    if (cal.selected instanceof Set) {
      // Purge des ids de profils supprimés depuis le dernier rendu
      var ids = {}; list.forEach(function (p) { ids[p.id] = true; });
      var keep = [];
      cal.selected.forEach(function (id) { if (ids[id]) keep.push(id); });
      cal.selected = new Set(keep);
      if (cal.selected.size === 0 && list[0]) cal.selected.add((currentId() && ids[currentId()]) ? currentId() : list[0].id);
      return;
    }
    cal.selected = new Set();
    var cur = currentId();
    if (cur && list.some(function (p) { return p.id === cur; })) cal.selected.add(cur);
    else if (list[0]) cal.selected.add(list[0].id);
  }

  // ── En-tête (allégé) ──
  // Une ligne : titre + bouton Mode salle. La bannière reste en fond, très
  // voilée. Plus de coins « console », de halo ni de phrase d'explication.
  function headerHTML(nbMembres) {
    return '' +
      '<div class="card" style="position:relative;overflow:hidden;padding:14px 16px!important;' +
        // ⚠️ !important obligatoire (voir carte-du-code : .card en dark-mode)
        'background-color:#0b1016!important;' +
        "background-image:linear-gradient(90deg,rgba(11,16,22,0.96) 0%,rgba(11,16,22,0.86) 55%,rgba(11,16,22,0.70) 100%),url('images/calendar_banner.webp')!important;" +
        'background-size:cover,cover!important;background-position:center,center!important;' +
        'background-repeat:no-repeat,no-repeat!important;border:1px solid rgba(255,255,255,0.06);">' +
        '<div style="display:flex;align-items:center;gap:10px;">' +
          '<h2 style="margin:0;flex:1;font-family:var(--font-display);font-size:1.3em;font-weight:800;' +
            'color:#e8f0f8;line-height:1.1;">Calendrier</h2>' +
          '<button onclick="awakCalKiosk()" style="flex-shrink:0;background:none;border:1px solid rgba(255,255,255,0.14);' +
            'color:#cbd5e1;border-radius:99px;padding:6px 12px;font-size:0.7em;font-weight:700;cursor:pointer;font-family:inherit;">' +
            'Mode salle</button>' +
        '</div>' +
      '</div>';
  }

  // ── Sélecteur de membres ──
  // Affiché seulement s'il y a plusieurs profils : avec un seul, il ne
  // servait à rien et prenait une carte entière.
  function membersHTML(list, colorById) {
    if (list.length <= 1) return '';
    var chips = list.map(function (p) {
      var c = colorById[p.id];
      var sel = cal.selected.has(p.id);
      return '<button onclick="awakCalToggleMember(\'' + esc(p.id) + '\')" ' +
        'style="display:inline-flex;align-items:center;gap:7px;padding:5px 11px 5px 6px;border-radius:99px;cursor:pointer;' +
          'background:' + (sel ? 'rgba(255,255,255,0.06)' : 'transparent') + ';' +
          'border:1px solid ' + (sel ? c.line : 'rgba(255,255,255,0.08)') + ';opacity:' + (sel ? '1' : '0.55') + ';">' +
        '<span style="flex-shrink:0;display:inline-flex;">' + av(p.avatar, 22) + '</span>' +
        '<span style="font-size:0.76em;font-weight:700;color:#e2e8f0;white-space:nowrap;max-width:110px;overflow:hidden;text-overflow:ellipsis;">' + esc(p.name || 'Membre') + '</span>' +
        '<span style="flex-shrink:0;width:7px;height:7px;border-radius:50%;background:' + (sel ? c.base : 'transparent') + ';' +
          'border:1px solid ' + c.base + ';"></span>' +
      '</button>';
    }).join('');
    return '<div style="display:flex;flex-wrap:wrap;gap:6px;margin:0 2px 12px;">' + chips + '</div>';
  }

  // ── Carte AUJOURD'HUI + progression de la semaine (fusionnées) ──
  function todayHTML(list, colorById, plans, dones) {
    var today = new Date();
    var dayKey = JOURS[wIdx(today)];
    var dateLbl = JOURS_LONG[dayKey] + ' ' + today.getDate() + ' ' + MOIS[today.getMonth()].toLowerCase();

    var entries = entriesFor(list, plans, dones, today.getFullYear(), today.getMonth(), today.getDate());
    var selList = list.filter(function (p) { return cal.selected.has(p.id); });
    var multi = selList.length > 1;

    var actifs = {};
    entries.forEach(function (e) { actifs[e.profil.id] = true; });
    var repos = selList.filter(function (p) { return !actifs[p.id]; });

    var rows = entries.map(function (e) {
      var c = colorById[e.profil.id];
      var s = e.seance;
      var label = s.label || s.muscles.slice(0, 3).join(' · ');
      var sous = (s.label ? s.muscles.slice(0, 4).join(' · ') : '');
      return '<div style="display:flex;align-items:center;gap:10px;margin-top:10px;">' +
          '<span style="flex-shrink:0;width:3px;align-self:stretch;min-height:28px;border-radius:99px;background:' + c.base + ';"></span>' +
          (multi ? '<span style="flex-shrink:0;display:inline-flex;">' + av(e.profil.avatar, 26) + '</span>' : '') +
          '<div style="min-width:0;flex:1;">' +
            '<div style="font-size:0.92em;font-weight:800;color:#f1f5f9;">' + esc(label) +
              (e.faite ? ' <span style="color:' + c.base + ';font-size:0.8em;">✓</span>' : '') + '</div>' +
            (sous ? '<div style="font-size:0.72em;color:#94a3b8;margin-top:1px;">' + esc(sous) + '</div>' : '') +
          '</div>' +
          (e.heure ? '<span style="flex-shrink:0;font-family:var(--font-display);font-size:0.86em;font-weight:800;color:' + c.base + ';">' +
              esc(fmtTime(e.heure)) + '</span>' : '') +
        '</div>';
    }).join('');

    if (repos.length) {
      rows += '<div style="margin-top:' + (entries.length ? '10px' : '6px') + ';font-size:' + (entries.length ? '0.74em' : '0.9em') +
          ';color:#64748b;font-weight:600;">Repos' +
          (multi || entries.length ? ' : ' + repos.map(function (p) { return esc(p.name || 'Membre'); }).join(', ') : '') +
        '</div>';
    }
    if (!rows) {
      rows = '<div style="margin-top:6px;color:#64748b;font-size:0.82em;">Aucun membre sélectionné.</div>';
    }

    var conflits = overlaps(entries);
    var alerte = '';
    if (conflits.length) {
      var txt = conflits.map(function (pair) {
        return esc(pair[0].profil.name || 'Membre') + ' (' + esc(fmtTime(pair[0].heure)) + ') et ' +
               esc(pair[1].profil.name || 'Membre') + ' (' + esc(fmtTime(pair[1].heure)) + ')';
      }).join(' · ');
      alerte = '<div style="margin-top:10px;font-size:0.72em;color:#fbbf24;line-height:1.4;">' +
          'Horaires rapprochés : <span style="color:#cbd5e1;">' + txt + '</span></div>';
    }

    return '' +
      '<div class="card" style="padding:14px 16px!important;">' +
        '<div style="display:flex;align-items:center;gap:12px;">' +
          '<div style="flex:1;min-width:0;">' +
            '<div style="font-size:0.7em;color:#94a3b8;font-weight:600;">Aujourd\'hui · ' + esc(dateLbl) + '</div>' +
          '</div>' +
          anneauxSemaine(selList, colorById, plans, dones) +
        '</div>' +
        rows +
        prochaineHTML(entries) +
        alerte +
      '</div>';
  }

  // ── Point de couleur d'un membre dans une case ──
  // Plein = séance faite (✓), anneau = séance prévue.
  function dot(c, done) {
    if (done) {
      return '<span title="Séance faite" style="width:9px;height:9px;border-radius:50%;flex-shrink:0;' +
        'background:' + c.base + ';box-shadow:0 0 6px ' + c.line + ';"></span>';
    }
    return '<span title="Séance prévue" style="width:9px;height:9px;border-radius:50%;flex-shrink:0;' +
      'background:transparent;border:2px solid ' + c.base + ';"></span>';
  }

  // ── Résumé de la semaine : anneaux de progression par membre ──
  // Donne du relief et une raison de revenir : on voit l'anneau se fermer.
  function anneau(pct, couleur, taille) {
    var r = (taille - 7) / 2, c = 2 * Math.PI * r, off = c * (1 - Math.max(0, Math.min(1, pct)));
    return '<svg viewBox="0 0 ' + taille + ' ' + taille + '" width="' + taille + '" height="' + taille + '" style="display:block;">' +
        '<circle cx="' + taille / 2 + '" cy="' + taille / 2 + '" r="' + r.toFixed(1) + '" fill="none" ' +
          'stroke="rgba(255,255,255,0.08)" stroke-width="5"/>' +
        '<circle cx="' + taille / 2 + '" cy="' + taille / 2 + '" r="' + r.toFixed(1) + '" fill="none" ' +
          'stroke="' + couleur + '" stroke-width="5" stroke-linecap="round" ' +
          'stroke-dasharray="' + c.toFixed(1) + '" stroke-dashoffset="' + off.toFixed(1) + '" ' +
          'transform="rotate(-90 ' + taille / 2 + ' ' + taille / 2 + ')" ' +
          'style="transition:stroke-dashoffset .7s cubic-bezier(.22,.9,.3,1);"/>' +
      '</svg>';
  }

  // Progression de la semaine : un petit anneau par membre, intégré à la
  // carte « Aujourd'hui » (la carte « Ta semaine » séparée a été retirée).
  function statsSemaine(p, plans, dones) {
    var debut = lundiDe(new Date());
    var prevues = 0, faites = 0;
    for (var i = 0; i < 7; i++) {
      var d = new Date(debut.getFullYear(), debut.getMonth(), debut.getDate() + i);
      var ymd = d.getFullYear() + '-' + d.getMonth() + '-' + d.getDate();
      var sc = (plans[p.id] || {})[JOURS[wIdx(d)]];
      if (sc && sc.muscles && sc.muscles.length) {
        prevues++;
        if (dones[p.id] && dones[p.id][ymd]) faites++;
      }
    }
    return { prevues: prevues, faites: faites };
  }
  function anneauxSemaine(selList, colorById, plans, dones) {
    if (!selList.length) return '';
    var html = selList.slice(0, 4).map(function (p) {
      var st = statsSemaine(p, plans, dones);
      if (!st.prevues) return '';
      var c = colorById[p.id];
      return '<div title="' + esc(p.name || 'Membre') + ' : ' + st.faites + ' sur ' + st.prevues + ' cette semaine" ' +
          'style="position:relative;flex-shrink:0;">' +
          anneau(st.faites / st.prevues, c.base, 34) +
          '<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;' +
            'font-size:0.56em;font-weight:800;color:#cbd5e1;font-family:var(--font-display);">' +
            st.faites + '/' + st.prevues + '</div>' +
        '</div>';
    }).join('');
    if (!html) return '';
    return '<div style="display:flex;align-items:center;gap:6px;flex-shrink:0;">' +
        '<span style="font-size:0.62em;color:#64748b;font-weight:600;">Semaine</span>' + html + '</div>';
  }
  function resumeHTML() { return ''; }

  // ⏳ Temps restant avant la prochaine séance du jour (profil actif inclus).
  function prochaineHTML(entries) {
    var maintenant = new Date();
    var minsNow = maintenant.getHours() * 60 + maintenant.getMinutes();
    var suivante = null;
    entries.forEach(function (e) {
      var m = toMin(e.heure);
      if (m === null || e.faite) return;
      if (m >= minsNow && (suivante === null || m < toMin(suivante.heure))) suivante = e;
    });
    if (!suivante) return '';
    var delta = toMin(suivante.heure) - minsNow;
    var txt = delta < 5 ? "c'est maintenant"
            : delta < 60 ? 'dans ' + delta + ' min'
            : 'dans ' + Math.floor(delta / 60) + ' h' + (delta % 60 ? String(delta % 60).padStart(2, '0') : '');
    return '<div style="margin-top:10px;display:flex;align-items:center;gap:7px;">' +
        '<span style="flex-shrink:0;display:inline-flex;">' + (window.AwakIcon ? window.AwakIcon.get('chrono', 15, '#67e8f9') : '⏳') + '</span>' +
        '<span style="font-size:0.76em;color:#e8f0f8;font-weight:700;min-width:0;">' +
          esc(suivante.seance.label || 'Séance') + ' · <span style="color:#67e8f9;font-weight:900;">' + txt + '</span></span>' +
      '</div>';
  }

  // ── Bascule Semaine / Mois (discrète) ──
  function toggleHTML() {
    function b(v, txt) {
      var on = (cal.vue === v);
      return '<button onclick="awakCalVue(\'' + v + '\')" style="padding:5px 12px;border:none;cursor:pointer;border-radius:99px;' +
        'font-family:inherit;font-size:0.72em;font-weight:700;' +
        'background:' + (on ? 'rgba(255,255,255,0.09)' : 'transparent') + ';' +
        'color:' + (on ? '#e8f0f8' : '#64748b') + ';">' + txt + '</button>';
    }
    return '<div style="display:inline-flex;gap:2px;padding:2px;border-radius:99px;background:rgba(255,255,255,0.03);">' +
      b('semaine', 'Semaine') + b('mois', 'Mois') + '</div>';
  }

  // Barre de navigation commune : bascule à gauche, période au centre-droit.
  function navBarHTML(titre, sousTitre, prevLbl, nextLbl) {
    var fl = 'flex-shrink:0;width:32px;height:32px;border-radius:50%;cursor:pointer;font-family:inherit;' +
      'background:none;border:none;color:#94a3b8;font-size:1.25em;font-weight:700;line-height:1;';
    return '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px;">' +
        toggleHTML() +
        '<div style="display:flex;align-items:center;gap:2px;min-width:0;">' +
          '<button onclick="awakCalPrevMonth()" aria-label="' + prevLbl + '" style="' + fl + '">‹</button>' +
          '<div style="min-width:0;text-align:center;">' +
            '<div style="font-size:0.8em;font-weight:800;color:#e2e8f0;white-space:nowrap;">' + esc(titre) + '</div>' +
            (sousTitre || '') +
          '</div>' +
          '<button onclick="awakCalNextMonth()" aria-label="' + nextLbl + '" style="' + fl + '">›</button>' +
        '</div>' +
      '</div>';
  }

  // ── Vue SEMAINE (allégée) ──
  // Une liste simple séparée par de fins traits : plus de cadre par jour,
  // de pastilles de muscles ni de pointillés. Les jours de repos tiennent
  // sur une ligne ; seuls les jours d'entraînement portent une couleur.
  function weekHTML(list, colorById, plans, dones) {
    var today = new Date();
    var debut = new Date(cal.lundi.getFullYear(), cal.lundi.getMonth(), cal.lundi.getDate());
    var fin = new Date(debut); fin.setDate(fin.getDate() + 6);

    var titre = (debut.getMonth() === fin.getMonth())
      ? debut.getDate() + '–' + fin.getDate() + ' ' + MOIS[fin.getMonth()].toLowerCase()
      : debut.getDate() + ' ' + MOIS_COURT[debut.getMonth()] + ' – ' + fin.getDate() + ' ' + MOIS_COURT[fin.getMonth()];
    var estSemaineCourante = memeJour(debut, lundiDe(today));
    var sous = estSemaineCourante ? '' :
      '<button onclick="awakCalToday()" style="background:none;border:none;color:#22d3ee;padding:0;' +
        'font-size:0.64em;font-weight:700;cursor:pointer;font-family:inherit;">Cette semaine</button>';
    var nav = navBarHTML(titre, sous, 'Semaine précédente', 'Semaine suivante');

    var lignes = '';
    for (var i = 0; i < 7; i++) {
      var d = new Date(debut.getFullYear(), debut.getMonth(), debut.getDate() + i);
      var estAujourdhui = memeJour(d, today);
      var estPasse = d < new Date(today.getFullYear(), today.getMonth(), today.getDate());
      var entries = entriesFor(list, plans, dones, d.getFullYear(), d.getMonth(), d.getDate());

      var corps;
      if (entries.length) {
        corps = entries.map(function (e) {
          var c = colorById[e.profil.id];
          var lbl = e.seance.label || e.seance.muscles.slice(0, 3).join(' · ');
          var mus = e.seance.label ? e.seance.muscles.slice(0, 4).join(' · ') : '';
          return '<div style="display:flex;align-items:center;gap:9px;padding:2px 0;">' +
              '<span style="flex-shrink:0;width:3px;align-self:stretch;min-height:' + (mus ? '30' : '18') + 'px;border-radius:99px;background:' + c.base + ';"></span>' +
              '<div style="min-width:0;flex:1;">' +
                '<div style="font-size:0.86em;font-weight:700;color:#f1f5f9;">' + esc(lbl) +
                  (e.faite ? ' <span style="color:' + c.base + ';font-size:0.8em;">✓</span>' : '') + '</div>' +
                (mus ? '<div style="font-size:0.7em;color:#64748b;margin-top:1px;">' + esc(mus) + '</div>' : '') +
              '</div>' +
              (e.heure ? '<span style="flex-shrink:0;font-size:0.76em;font-weight:700;color:#94a3b8;">' + esc(fmtTime(e.heure)) + '</span>' : '') +
            '</div>';
        }).join('');
      } else {
        corps = '<div style="font-size:0.78em;color:#475569;">Repos</div>';
      }

      var jourCol = estAujourdhui ? '#22d3ee' : '#94a3b8';
      lignes += '<div onclick="awakCalOpenDay(' + d.getFullYear() + ',' + d.getMonth() + ',' + d.getDate() + ')" ' +
          'style="display:flex;align-items:' + (entries.length ? 'flex-start' : 'center') + ';gap:12px;cursor:pointer;' +
          'padding:' + (entries.length ? '11px' : '8px') + ' 8px;margin:0 -8px;border-radius:10px;' +
          (i ? 'border-top:1px solid rgba(255,255,255,0.045);' : '') +
          (estAujourdhui ? 'background:rgba(34,211,238,0.06);border-top-color:transparent;' : '') +
          (estPasse && !estAujourdhui ? 'opacity:0.5;' : '') + '">' +
          '<div style="flex-shrink:0;width:34px;text-align:center;line-height:1.1;">' +
            '<div style="font-size:0.6em;font-weight:700;color:' + jourCol + ';">' + JOURS_ENT[i] + '</div>' +
            '<div style="font-family:var(--font-display);font-size:1.02em;font-weight:800;color:' + (estAujourdhui ? '#22d3ee' : '#e2e8f0') + ';">' + d.getDate() + '</div>' +
          '</div>' +
          '<div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:6px;">' + corps + '</div>' +
        '</div>';
    }

    return '<div class="card" style="padding:12px 16px 10px!important;">' + nav + lignes + '</div>';
  }

  // ── Grille mensuelle ──
  function gridHTML(list, colorById, plans, dones) {
    var selList = list.filter(function (p) { return cal.selected.has(p.id); });
    var today = new Date();
    var isCurMonth = (today.getFullYear() === cal.year && today.getMonth() === cal.month);
    var todayNum = today.getDate();

    var firstDow = wIdx(new Date(cal.year, cal.month, 1));           // lundi=0
    var daysInMonth = new Date(cal.year, cal.month + 1, 0).getDate();

    // En-têtes de jours
    var head = JOURS_ENT.map(function (j, i) {
      var we = (i >= 5);
      return '<div style="text-align:center;font-size:0.58em;font-weight:900;letter-spacing:0.5px;padding:5px 0;' +
        'min-width:0;overflow:hidden;color:' + (we ? '#64748b' : '#94a3b8') + ';">' + j + '</div>';
    }).join('');

    var cells = '';
    // Cases vides du début
    for (var b = 0; b < firstDow; b++) {
      cells += '<div style="min-height:46px;min-width:0;"></div>';
    }
    // Jours du mois
    for (var day = 1; day <= daysInMonth; day++) {
      var date = new Date(cal.year, cal.month, day);
      var dayKey = JOURS[wIdx(date)];
      var isToday = isCurMonth && day === todayNum;
      var ymd = cal.year + '-' + cal.month + '-' + day;

      // Un point par membre ayant une séance ce jour-là (+ heure la plus tôt)
      var dayEntries = entriesFor(list, plans, dones, cal.year, cal.month, day);
      var dots = '';
      var nb = dayEntries.length;
      dayEntries.forEach(function (e) {
        dots += dot(colorById[e.profil.id], e.faite);
      });
      var premiere = null;
      for (var q = 0; q < dayEntries.length; q++) {
        if (dayEntries[q].heure) { premiere = dayEntries[q].heure; break; }
      }
      var heureTxt = premiere
        ? '<div style="font-size:0.56em;font-weight:800;color:#7dd3fc;line-height:1;' +
            'white-space:nowrap;overflow:hidden;max-width:100%;">' + esc(fmtTime(premiere)) +
            (dayEntries.length > 1 ? '<span style="color:#475569;">+</span>' : '') + '</div>'
        : '';

      var numStyle = isToday
        ? 'display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;' +
          'border-radius:50%;background:#22d3ee;color:#04121f;font-weight:900;font-size:0.8em;' +
          'font-family:var(--font-display);'
        : 'color:#cbd5e1;font-weight:800;font-size:0.8em;font-family:var(--font-display);padding-left:1px;';

      // Jours passés atténués : l'œil va d'abord à aujourd'hui et à la suite.
      var _auj = new Date();
      var _passe = new Date(cal.year, cal.month, day) < new Date(_auj.getFullYear(), _auj.getMonth(), _auj.getDate());
      cells += '<div onclick="awakCalOpenDay(' + cal.year + ',' + cal.month + ',' + day + ')" ' +
          'role="button" tabindex="0" aria-label="' + day + ' ' + esc(MOIS[cal.month]) + (nb ? ', ' + nb + ' séance(s)' : '') + '" ' +
          'style="border-radius:9px;padding:4px 2px 3px;min-height:46px;min-width:0;overflow:hidden;cursor:pointer;' +
          ((_passe && !isToday) ? 'opacity:0.4;' : '') +
          'display:flex;flex-direction:column;align-items:center;gap:3px;">' +
          '<div style="' + numStyle + '">' + day + '</div>' +
          (dots ? '<div style="display:flex;flex-wrap:wrap;gap:3px;justify-content:center;align-items:center;">' + dots + '</div>' : '') +
          heureTxt +
        '</div>';
    }

    // Navigation du mois
    var nav = navBarHTML(MOIS[cal.month] + ' ' + cal.year,
      isCurMonth ? '' : '<button onclick="awakCalToday()" style="background:none;border:none;color:#22d3ee;padding:0;' +
        'font-size:0.64em;font-weight:700;cursor:pointer;font-family:inherit;">Aujourd\'hui</button>',
      'Mois précédent', 'Mois suivant');

    // Légende (mapping couleur ↔ membre) + signification des points
    var legend = '';
    if (selList.length) {
      var membres = (selList.length > 1) ? selList.map(function (p) {
        var c = colorById[p.id];
        return '<div style="display:inline-flex;align-items:center;gap:6px;">' +
          '<span style="width:11px;height:11px;border-radius:50%;background:' + c.base + ';flex-shrink:0;"></span>' +
          '<span style="font-size:0.72em;color:#94a3b8;font-weight:700;">' + esc(p.name || 'Membre') + '</span>' +
        '</div>';
      }).join('') : '';

      legend = '<div style="margin-top:10px;">' +
          (membres ? '<div style="display:flex;flex-wrap:wrap;gap:10px;margin-bottom:9px;">' + membres + '</div>' : '') +
          '<div style="display:flex;flex-wrap:wrap;gap:13px;align-items:center;">' +
            '<span style="display:inline-flex;align-items:center;gap:5px;font-size:0.68em;color:#64748b;font-weight:700;">' +
              '<span style="width:9px;height:9px;border-radius:50%;border:2px solid #94a3b8;flex-shrink:0;"></span>prévue</span>' +
            '<span style="display:inline-flex;align-items:center;gap:5px;font-size:0.68em;color:#64748b;font-weight:700;">' +
              '<span style="width:9px;height:9px;border-radius:50%;background:#94a3b8;flex-shrink:0;"></span>faite</span>' +
          '</div>' +
        '</div>';
    }

    return '<div class="card" style="padding:12px 10px 12px!important;overflow:hidden;">' +
        '<div style="padding:0 6px 6px;">' + nav + '</div>' +
        '<div style="display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:3px;margin-bottom:4px;">' + head + '</div>' +
        '<div style="display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:3px;">' + cells + '</div>' +
        '<div style="padding:0 5px;">' + legend + '</div>' +
      '</div>';
  }

  // ── Bannière « pas encore de planning » (profil actif) ──
  function ctaHTML() {
    // 🖼️ Illustration d'état vide (fond transparent). onerror la retire si
    // le fichier n'est pas encore en ligne — le texte suffit alors.
    return '<div class="card" onclick="if(typeof openManualPlanEditor===\'function\')openManualPlanEditor()" ' +
      'style="cursor:pointer;padding:0;overflow:hidden;background:linear-gradient(160deg,#0a1420 0%,#0d0a1f 100%);' +
      'border:1.5px dashed rgba(34,211,238,0.35);">' +
      '<img src="images/calendar_empty.webp" alt="" onerror="this.remove()" ' +
        'style="display:block;width:100%;max-width:330px;margin:6px auto -4px;height:auto;' +
        'filter:drop-shadow(0 0 26px rgba(34,211,238,0.22));">' +
      '<div style="padding:4px 16px 16px;text-align:center;">' +
        '<div style="font-size:0.58em;letter-spacing:2px;color:#22d3ee;font-weight:900;margin-bottom:4px;">◈ PLANNING</div>' +
        '<div style="font-size:0.9em;color:#e8f0f8;font-weight:800;margin-bottom:3px;">Aucune séance planifiée</div>' +
        '<div style="font-size:0.75em;color:#94a3b8;line-height:1.4;">Touche ici pour organiser ta semaine</div>' +
      '</div>' +
    '</div>';
  }

  // ═══ MODE SALLE ═══════════════════════════════════════════════════
  // Affichage permanent pour une tablette posée dans la salle :
  // gros caractères lisibles à distance, semaine seule, horloge,
  // et l'écran qui ne s'éteint pas (Wake Lock).
  var kiosk = { timer: null, lock: null };

  // Styles du mode salle : colonnes horizontales, aujourd'hui agrandi.
  // (Media queries impossibles en style inline.)
  function kioskStyles() {
    if (document.getElementById('awakKioskStyles')) return;
    var st = document.createElement('style');
    st.id = 'awakKioskStyles';
    st.textContent =
      '.awak-k-week{display:flex;gap:12px;align-items:stretch;}' +
      '.awak-k-day{flex:1 1 0;min-width:0;display:flex;flex-direction:column;position:relative;' +
        'border-radius:18px;padding:16px 11px;border:1px solid rgba(255,255,255,0.06);' +
        'background:linear-gradient(168deg,rgba(255,255,255,0.045) 0%,rgba(255,255,255,0.012) 100%);' +
        'backdrop-filter:blur(6px);box-shadow:inset 0 1px 0 rgba(255,255,255,0.05);' +
        'transition:flex .35s cubic-bezier(.22,.9,.3,1);overflow:hidden;}' +
      '.awak-k-day.past{opacity:0.26;}' +
      '.awak-k-day.today{flex:3.4 1 0;padding:22px 18px;' +
        'border:1px solid rgba(34,211,238,0.45);' +
        'background:linear-gradient(168deg,rgba(34,211,238,0.13) 0%,rgba(168,85,247,0.07) 55%,rgba(10,14,20,0.4) 100%);' +
        'box-shadow:0 0 0 1px rgba(34,211,238,0.12),0 18px 60px rgba(34,211,238,0.16),' +
          'inset 0 1px 0 rgba(255,255,255,0.10);}' +
      // liseré lumineux en haut de la colonne du jour
      '.awak-k-day.today::before{content:"";position:absolute;top:0;left:12%;right:12%;height:2px;' +
        'background:linear-gradient(90deg,transparent,#22d3ee,#a855f7,transparent);' +
        'box-shadow:0 0 14px rgba(34,211,238,0.8);}' +
      // 📐 PAYSAGE / grand écran : les colonnes descendent jusqu'en bas.
      // Sans ça elles s'arrêtaient à la hauteur du contenu et laissaient les
      // trois quarts de l'écran vides sur une tablette couchée.
      '@media(min-width:761px){.awak-k-week{min-height:calc(100vh - 170px);}' +
        '.awak-k-day{justify-content:flex-start;}' +
        // le contenu d'un jour occupe la hauteur : repos centré, séances en haut
        '.awak-k-corps{flex:1;display:flex;flex-direction:column;}' +
        '.awak-k-vide{flex:1;display:flex;align-items:center;justify-content:center;}}' +
      // 📱 TÉLÉPHONE : l'en-tête se réorganise. Le titre en 2.1em ne tenait pas
      // à côté de l'horloge et se faisait couper (« CETTE SEMAIN »).
      // v1261 : en colonne (téléphone debout), seule la VEILLE reste au-dessus
      // d'aujourd'hui — sinon le samedi, il fallait défiler 5 jours passés.
      '@media(max-width:760px){.awak-k-day.loin{display:none;}}' +
      // v1269 : en colonne, les jours de la semaine SUIVANTE s'ajoutent sous
      // aujourd'hui (le dimanche, il n'y avait plus rien en dessous).
      // En paysage, la grille reste lundi → dimanche.
      '.awak-k-day.suite,.awak-k-sep{display:none;}' +
      '@media(max-width:760px){.awak-k-day.suite{display:flex;}.awak-k-sep{display:block;}}' +
      '@media(max-width:760px){.awak-k-week{flex-direction:column;}' +
        '.awak-k-day,.awak-k-day.today{flex:none;}' +
        '.awak-k-day{padding:12px 12px;}.awak-k-day.today{padding:14px 14px;}' +
        // Le titre occupe TOUTE la ligne ; l'horloge et le × passent dessous.
        // Avec l'horloge à côté, « CETTE SEMAINE » se faisait couper.
        // ⚠️ !important : le style EN LIGNE (flex:1 ; align-items:flex-end)
        // l'emportait sur ces règles — l'en-tête ne passait jamais à la ligne
        // et « CETTE SEMAINE » restait coupé à côté de l'horloge.
        '.awak-k-head{flex-wrap:wrap!important;align-items:center!important;gap:8px 10px!important;margin-bottom:14px!important;}' +
        '.awak-k-head > div:first-child{flex:1 1 100%!important;}' +
        '.awak-k-head > div:nth-child(2){flex:1 1 auto!important;text-align:left!important;}' +
        '.awak-k-title{font-size:1.5em!important;white-space:nowrap;}' +
        '.awak-k-clock{font-size:2.1em!important;}' +
        '.awak-k-date{font-size:0.68em!important;letter-spacing:0.4px!important;}}' +
      '@media(max-width:380px){.awak-k-title{font-size:1.2em!important;}' +
        '.awak-k-clock{font-size:1.8em!important;}}';
    document.head.appendChild(st);
  }

  function kioskWeekHTML(list, colorById, plans, dones) {
    kioskStyles();
    var today = new Date();
    var debut = lundiDe(today);
    var cols = '';
    // Toujours au moins 5 jours à venir sous aujourd'hui (téléphone debout)
    var restants = 6 - Math.round((new Date(today.getFullYear(), today.getMonth(), today.getDate()) - debut) / 864e5);
    var extra = Math.max(0, 5 - restants);

    for (var i = 0; i < 7 + extra; i++) {
      var d = new Date(debut.getFullYear(), debut.getMonth(), debut.getDate() + i);
      var suite = i >= 7;
      if (i === 7) cols += '<div class="awak-k-sep" style="font-size:0.62em;font-weight:900;letter-spacing:3px;color:#64748b;' +
        'text-align:center;padding:4px 0 0;">SEMAINE PROCHAINE</div>';
      var auj = memeJour(d, today);
      var passe = d < new Date(today.getFullYear(), today.getMonth(), today.getDate());
      // Jour passé AVANT la veille : masqué quand les jours s'empilent (téléphone)
      var loin = d < new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
      var entries = entriesFor(list, plans, dones, d.getFullYear(), d.getMonth(), d.getDate());

      // ── En-tête de colonne ──
      var tete =
        '<div style="text-align:center;padding-bottom:' + (auj ? '13px' : '10px') + ';margin-bottom:' + (auj ? '13px' : '10px') + ';' +
          'border-bottom:1px solid ' + (auj ? 'rgba(34,211,238,0.28)' : 'rgba(255,255,255,0.06)') + ';">' +
          '<div style="font-size:' + (auj ? '0.8em' : '0.66em') + ';font-weight:900;letter-spacing:3px;' +
            'color:' + (auj ? '#67e8f9' : '#64748b') + ';">' + JOURS_ENT[i % 7].toUpperCase() + '</div>' +
          '<div style="font-family:var(--font-display);font-weight:800;line-height:0.95;margin-top:' + (auj ? '6px' : '4px') + ';' +
            'font-size:' + (auj ? '3em' : '1.6em') + ';letter-spacing:-1px;' +
            (auj
              ? 'background:linear-gradient(160deg,#e8f4ff,#67e8f9 60%,#c4b5fd);-webkit-background-clip:text;' +
                'background-clip:text;color:transparent;filter:drop-shadow(0 0 22px rgba(34,211,238,0.45));'
              : 'color:#8a9bb0;') + '">' + d.getDate() + '</div>' +
          (auj && entries.length
            ? '<div style="font-size:0.6em;color:#64748b;font-weight:700;letter-spacing:1px;margin-top:5px;">'
              + entries.length + ' SÉANCE' + (entries.length > 1 ? 'S' : '') + '</div>'
            : '') +
        '</div>';

      // ── Séances ──
      var corps;
      if (entries.length) {
        corps = entries.map(function (e) {
          var c = colorById[e.profil.id];
          var lbl = e.seance.label || e.seance.muscles.slice(0, 2).join(' · ');

          if (auj) {
            // Colonne du jour : détail lisible de loin
            var mus = e.seance.muscles.slice(0, 4).map(function (m) {
              return '<span style="background:' + c.soft + ';color:' + c.base + ';border:1px solid ' + c.line +
                ';padding:2px 8px;border-radius:99px;font-size:0.62em;font-weight:700;">' + esc(m) + '</span>';
            }).join('');
            return '<div style="background:rgba(0,0,0,0.25);border-left:4px solid ' + c.base + ';' +
                'border-radius:11px;padding:11px 13px;margin-bottom:9px;">' +
                '<div style="display:flex;align-items:center;gap:9px;flex-wrap:wrap;margin-bottom:6px;">' +
                  (e.heure ? '<span style="background:' + c.base + ';color:#04121f;padding:3px 11px;border-radius:8px;' +
                      'font-size:1em;font-weight:900;font-family:var(--font-display);">' + esc(fmtTime(e.heure)) + '</span>' : '') +
                  '<span style="font-size:1.05em;font-weight:800;color:#e8f0f8;">' + esc(lbl) + '</span>' +
                  (e.faite ? '<span style="color:' + c.base + ';font-size:1.1em;font-weight:900;">✓</span>' : '') +
                '</div>' +
                '<div style="display:flex;align-items:center;gap:7px;flex-wrap:wrap;">' +
                  '<span style="font-size:0.78em;color:#94a3b8;font-weight:700;">' + esc(e.profil.name || '') + '</span>' +
                  mus +
                '</div>' +
              '</div>';
          }

          // Autres jours : compact
          return '<div style="display:flex;align-items:center;gap:6px;margin-bottom:7px;">' +
              '<span style="flex-shrink:0;width:4px;height:26px;border-radius:99px;background:' + c.base + ';"></span>' +
              '<div style="min-width:0;flex:1;">' +
                (e.heure ? '<div style="font-size:0.72em;font-weight:900;color:' + c.base + ';' +
                    'font-family:var(--font-display);line-height:1.1;">' + esc(fmtTime(e.heure)) + '</div>' : '') +
                '<div style="font-size:0.72em;font-weight:800;color:#cbd5e1;line-height:1.2;' +
                  'overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + esc(lbl) +
                  (e.faite ? ' <span style="color:' + c.base + ';">✓</span>' : '') + '</div>' +
              '</div>' +
            '</div>';
        }).join('');
      } else {
        corps = '<div class="awak-k-vide" style="text-align:center;color:#475569;font-weight:600;' +
          'font-size:' + (auj ? '0.95em' : '0.68em') + ';">Repos</div>';
      }

      cols += '<div class="awak-k-day' + (auj ? ' today' : '') + (passe && !auj ? ' past' : '') + (loin ? ' loin' : '') + (suite ? ' suite' : '') + '">' +
          tete +
          '<div class="awak-k-corps" style="flex:1;min-width:0;">' + corps + '</div>' +
        '</div>';
    }

    return '<div class="awak-k-week">' + cols + '</div>';
  }

  function kioskRender() {
    var host = document.getElementById('awakKioskBody');
    if (!host) return;
    var list = profiles();
    if (!list.length) { host.innerHTML = ''; return; }
    ensureSelected(list);
    var colorById = {};
    list.forEach(function (p, i) { colorById[p.id] = colorFor(i); });
    var plans = {}, dones = {};
    list.forEach(function (p) {
      if (cal.selected.has(p.id)) { plans[p.id] = planFor(p.id); dones[p.id] = doneDates(p.id); }
    });
    host.innerHTML = kioskWeekHTML(list, colorById, plans, dones);

    var n = new Date();
    var h = document.getElementById('awakKioskClock');
    if (h) h.textContent = n.getHours() + 'h' + ('0' + n.getMinutes()).slice(-2);
    var dt = document.getElementById('awakKioskDate');
    if (dt) {
      var l = lundiDe(n), f = new Date(l.getFullYear(), l.getMonth(), l.getDate() + 6);
      // ⚠️ « samedi 12 SEPTEMBRE · 7–13 SEPTEMBRE » répétait le mois.
      // On ne le nomme qu'une fois quand la semaine ne change pas de mois.
      var memeMois = (l.getMonth() === f.getMonth());
      var semaine = memeMois
        ? l.getDate() + '–' + f.getDate() + ' ' + MOIS[f.getMonth()].toLowerCase()
        : l.getDate() + ' ' + MOIS[l.getMonth()].toLowerCase() + '–' + f.getDate() + ' ' + MOIS[f.getMonth()].toLowerCase();
      var jour = JOURS_LONG[JOURS[wIdx(n)]] + ' ' + n.getDate()
        + (memeMois && n.getMonth() === f.getMonth() ? '' : ' ' + MOIS[n.getMonth()].toLowerCase());
      dt.textContent = jour + '  ·  semaine du ' + semaine;
    }
  }

  window.awakCalKiosk = function () {
    var old = document.getElementById('awakKioskOverlay');
    if (old) old.remove();

    var ov = document.createElement('div');
    ov.id = 'awakKioskOverlay';
    // 🖼️ Fond photo plein écran. Si le fichier manque, seule la couleur
    // de base s'affiche : rien ne casse, aucun repli à prévoir.
    ov.style.cssText = 'position:fixed;inset:0;z-index:10300;overflow-y:auto;' +
      '-webkit-overflow-scrolling:touch;padding:18px 16px 28px;' +
      'background-color:#06090d;' +
      // Deux fonds : le navigateur affiche le 1er, et retombe sur le 2e si
      // le fichier n'est pas en ligne. Aucun script de repli nécessaire.
      "background-image:url('images/kiosk_bg.webp'),url('images/calendar_banner.webp');" +
      'background-size:cover;background-position:center;background-repeat:no-repeat;' +
      'background-attachment:fixed;';
    ov.innerHTML =
      // Voile : assombrit et désature la photo pour garder l'horloge et les
      // séances lisibles de loin. La bannière d'en-tête devient inutile,
      // la même image servant désormais de fond plein écran.
      '<div style="position:fixed;inset:0;pointer-events:none;backdrop-filter:saturate(0.92);' +
        'background:linear-gradient(180deg,rgba(6,9,13,0.30) 0%,rgba(6,9,13,0.18) 34%,' +
        'rgba(6,9,13,0.52) 70%,rgba(6,9,13,0.78) 100%);"></div>' +
      '<div style="position:relative;z-index:1;max-width:1500px;margin:0 auto;">' +
        '<div class="awak-k-head" style="display:flex;align-items:flex-end;gap:16px;margin-bottom:18px;padding-bottom:14px;' +
          'border-bottom:1px solid rgba(34,211,238,0.16);">' +
          '<div style="min-width:0;flex:1;">' +
            '<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">' +
              '<span style="width:22px;height:2px;background:linear-gradient(90deg,#22d3ee,transparent);"></span>' +
              '<span style="font-size:0.62em;color:#22d3ee;font-weight:900;letter-spacing:4px;">MODE SALLE</span>' +
            '</div>' +
            '<div class="awak-k-title" style="font-family:var(--font-display);font-size:2.1em;font-weight:800;line-height:1.05;' +
              'letter-spacing:0.02em;background:linear-gradient(100deg,#e8f4ff 0%,#67e8f9 45%,#c4b5fd 100%);' +
              '-webkit-background-clip:text;background-clip:text;color:transparent;">CETTE SEMAINE</div>' +
            '<div id="awakKioskDate" class="awak-k-date" style="font-size:0.76em;color:#64748b;font-weight:700;' +
              'letter-spacing:1px;margin-top:5px;text-transform:uppercase;">—</div>' +
          '</div>' +
          '<div style="text-align:right;flex-shrink:0;">' +
            '<div id="awakKioskClock" class="awak-k-clock" style="font-family:var(--font-display);font-size:3.2em;font-weight:900;' +
              'line-height:0.9;color:#e8f4ff;letter-spacing:-1px;text-shadow:0 0 34px rgba(34,211,238,0.5);">--</div>' +
            '<div id="awakKioskLock" style="font-size:0.64em;color:#475569;margin-top:6px;font-weight:600;"></div>' +
          '</div>' +
          '<button onclick="awakCalKioskExit()" style="flex-shrink:0;background:rgba(255,255,255,0.05);' +
            'border:1px solid rgba(255,255,255,0.12);color:#94a3b8;border-radius:13px;width:46px;height:46px;' +
            'min-height:auto;font-size:1.3em;font-weight:800;cursor:pointer;line-height:1;font-family:inherit;">×</button>' +
        '</div>' +
        '<div id="awakKioskBody"></div>' +
      '</div>';
    document.body.appendChild(ov);

    kioskRender();
    kiosk.timer = setInterval(kioskRender, 30000);   // horloge + séances à jour

    // Empêche la mise en veille tant que le mode est ouvert.
    try {
      if (navigator.wakeLock && navigator.wakeLock.request) {
        navigator.wakeLock.request('screen').then(function (l) {
          kiosk.lock = l;
          var n = document.getElementById('awakKioskLock');
          if (n) n.textContent = '🔆 L\'écran restera allumé';
        }).catch(function () {
          var n = document.getElementById('awakKioskLock');
          if (n) n.textContent = 'Pense à régler la mise en veille de la tablette';
        });
      } else {
        var n0 = document.getElementById('awakKioskLock');
        if (n0) n0.textContent = 'Pense à régler la mise en veille de la tablette';
      }
    } catch (e) {}
  };

  window.awakCalKioskExit = function () {
    if (kiosk.timer) { clearInterval(kiosk.timer); kiosk.timer = null; }
    if (kiosk.lock) { try { kiosk.lock.release(); } catch (e) {} kiosk.lock = null; }
    var ov = document.getElementById('awakKioskOverlay');
    if (ov) ov.remove();
  };

  // ── Rendu principal ──
  function render() {
    var host = document.getElementById('calendarTabContent');
    if (!host) return;

    var list = profiles();
    if (!list.length) {
      host.innerHTML = headerHTML(0) +
        '<div class="card" style="padding:20px;text-align:center;color:#94a3b8;font-size:0.86em;">' +
          'Aucun profil pour le moment.</div>';
      return;
    }
    ensureSelected(list);

    // Pré-calculs (une seule lecture par membre sélectionné)
    var colorById = {};
    list.forEach(function (p, i) { colorById[p.id] = colorFor(i); });
    var plans = {}, dones = {};
    list.forEach(function (p) {
      if (cal.selected.has(p.id)) { plans[p.id] = planFor(p.id); dones[p.id] = doneDates(p.id); }
    });

    // Bannière CTA si le profil actif n'a pas de planning
    var cur = currentId();
    var showCTA = cur && cal.selected.has(cur) && !planHasTraining(plans[cur] || {});

    host.innerHTML =
      headerHTML(list.length) +
      membersHTML(list, colorById) +
      (showCTA ? ctaHTML() : '') +
      todayHTML(list, colorById, plans, dones) +
      resumeHTML(list, colorById, plans, dones) +
      (cal.vue === 'semaine' ? weekHTML(list, colorById, plans, dones) : gridHTML(list, colorById, plans, dones));
  }

  // ── Fenêtre de détail d'une journée ──
  // Ouverte au clic sur une case : heure, nom de séance et muscles, par membre.
  // Permet aussi de régler l'heure : pour cette date seulement (exception)
  // ou pour tous les <jour> à venir (récurrente).
  function openDay(y, m, d) {
    var list = profiles();
    if (!list.length) return;
    ensureSelected(list);

    var colorById = {};
    list.forEach(function (p, i) { colorById[p.id] = colorFor(i); });

    var dayKey = JOURS[wIdx(new Date(y, m, d))];
    var ymd = y + '-' + m + '-' + d;
    var t = new Date();
    var isToday = (t.getFullYear() === y && t.getMonth() === m && t.getDate() === d);

    var selList = list.filter(function (p) { return cal.selected.has(p.id); });
    var plans = {}, dones = {};
    selList.forEach(function (p) { plans[p.id] = planFor(p.id); dones[p.id] = doneDates(p.id); });

    var entries = entriesFor(list, plans, dones, y, m, d);

    // Contexte partagé avec les boutons de la fenêtre (indices stables)
    window.__awakCalDay = { y: y, m: m, d: d, dayKey: dayKey, ids: entries.map(function (e) { return e.profil.id; }) };

    var rows = entries.map(function (e, i) {
      var c = colorById[e.profil.id];
      var s = e.seance;
      var label = s.label || s.muscles.slice(0, 3).join(' · ');
      if (e.horsPlan) {
        return '<div style="background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.07);' +
            'border-left:3px solid ' + c.base + ';border-radius:12px;padding:13px 14px;margin-bottom:9px;">' +
            '<div style="display:flex;align-items:center;gap:9px;">' +
              '<span style="display:inline-flex;flex-shrink:0;">' + av(e.profil.avatar, 30) + '</span>' +
              '<span style="flex:1;min-width:0;"><span style="display:block;font-size:0.9em;font-weight:800;color:#e8f0f8;">' + esc(label) + '</span>' +
              '<span style="display:block;font-size:0.72em;color:#94a3b8;margin-top:2px;">' + esc(e.profil.name || 'Membre') + ' · faite sans être prévue</span></span>' +
              '<span style="background:' + c.base + ';color:#04121f;padding:2px 9px;border-radius:99px;font-size:0.62em;font-weight:900;">FAITE</span>' +
            '</div></div>';
      }
      var chips = s.muscles.map(function (mu) {
        return '<span style="background:' + c.soft + ';color:' + c.base + ';border:1px solid ' + c.line +
          ';padding:3px 9px;border-radius:99px;font-size:0.72em;font-weight:700;">' + esc(mu) + '</span>';
      }).join('');

      var badgeHeure = e.heure
        ? '<span style="background:' + c.base + ';color:#04121f;padding:2px 9px;border-radius:7px;' +
            'font-size:0.76em;font-weight:900;font-family:var(--font-display);">' + esc(fmtTime(e.heure)) + '</span>'
        : '<span style="color:#64748b;font-size:0.7em;font-weight:700;">heure non définie</span>';

      var badgeEx = e.exception
        ? '<span style="background:rgba(251,191,36,0.15);border:1px solid rgba(251,191,36,0.4);color:#fbbf24;' +
            'padding:2px 8px;border-radius:99px;font-size:0.62em;font-weight:900;">EXCEPTION</span>'
        : '';

      var etat = e.faite
        ? '<span style="background:' + c.base + ';color:#04121f;padding:2px 9px;border-radius:99px;font-size:0.62em;font-weight:900;">✓ FAITE</span>'
        : '<span style="border:1px solid ' + c.line + ';color:' + c.base + ';padding:2px 9px;border-radius:99px;font-size:0.62em;font-weight:800;">PRÉVUE</span>';

      // Réglage de l'heure
      var editeur =
        '<div style="margin-top:11px;padding-top:10px;border-top:1px dashed rgba(255,255,255,0.09);">' +
          '<div style="font-size:0.58em;letter-spacing:1.5px;color:#64748b;font-weight:900;margin-bottom:7px;">RÉGLER L\'HEURE</div>' +
          '<div style="display:flex;align-items:center;gap:7px;flex-wrap:wrap;">' +
            '<input type="time" id="awakCalT' + i + '" value="' + esc(e.heure || '') + '" ' +
              'style="background:rgba(34,211,238,0.08);border:1px solid rgba(34,211,238,0.3);color:#67e8f9;' +
              'border-radius:8px;padding:7px 9px;font-size:0.82em;font-weight:800;font-family:inherit;cursor:pointer;">' +
            '<button onclick="awakCalSetTime(' + i + ',\'once\')" ' +
              'style="background:rgba(251,191,36,0.12);border:1px solid rgba(251,191,36,0.35);color:#fbbf24;' +
              'border-radius:8px;padding:7px 10px;font-size:0.7em;font-weight:800;cursor:pointer;">Cette date</button>' +
            '<button onclick="awakCalSetTime(' + i + ',\'always\')" ' +
              'style="background:rgba(34,211,238,0.12);border:1px solid rgba(34,211,238,0.35);color:#22d3ee;' +
              'border-radius:8px;padding:7px 10px;font-size:0.7em;font-weight:800;cursor:pointer;">Tous les ' + esc(JOURS_LONG[dayKey].toLowerCase()) + 's</button>' +
          '</div>' +
          (e.exception
            ? '<button onclick="awakCalClearEx(' + i + ')" style="margin-top:7px;background:none;border:none;' +
                'color:#94a3b8;font-size:0.68em;font-weight:700;cursor:pointer;text-decoration:underline;">' +
                '↺ Revenir à l\'heure habituelle</button>'
            : '') +
        '</div>';

      return '<div style="background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.07);' +
          'border-left:3px solid ' + c.base + ';border-radius:12px;padding:13px 14px;margin-bottom:9px;">' +
          '<div style="display:flex;align-items:center;gap:9px;margin-bottom:10px;">' +
            '<span style="display:inline-flex;flex-shrink:0;">' + av(e.profil.avatar, 30) + '</span>' +
            '<span style="font-size:0.9em;font-weight:800;color:#e8f0f8;min-width:0;overflow:hidden;' +
              'text-overflow:ellipsis;white-space:nowrap;flex:1;">' + esc(e.profil.name || 'Membre') + '</span>' +
            etat +
          '</div>' +
          '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:9px;">' +
            badgeHeure + badgeEx +
            '<span style="font-size:0.95em;font-weight:800;color:#e8f0f8;">' + esc(label) + '</span>' +
            sourceChip(s.source) +
          '</div>' +
          '<div style="font-size:0.58em;letter-spacing:1.5px;color:#64748b;font-weight:900;margin-bottom:6px;">MUSCLES TRAVAILLÉS</div>' +
          '<div style="display:flex;flex-wrap:wrap;gap:5px;">' + chips + '</div>' +
          editeur +
        '</div>';
    }).join('');

    // Membres au repos ce jour-là
    var actifs = {};
    entries.forEach(function (e) { actifs[e.profil.id] = true; });
    var repos = selList.filter(function (p) { return !actifs[p.id]; });
    if (repos.length) {
      rows += '<div style="background:rgba(255,255,255,0.015);border:1px solid rgba(255,255,255,0.05);' +
          'border-radius:12px;padding:12px 14px;color:#64748b;font-size:0.82em;font-weight:600;">' +
          (window.AwakIcon ? window.AwakIcon.get('repos', 13, '#64748b') : '🛌') + ' Repos : ' + repos.map(function (p) { return esc(p.name || 'Membre'); }).join(', ') + '</div>';
    }

    if (!rows) {
      rows = '<div style="padding:18px 0;text-align:center;color:#64748b;font-size:0.86em;">Aucun membre sélectionné.</div>';
    }

    // ⚠️ Chevauchement d'horaires
    var conflits = overlaps(entries);
    var alerte = '';
    if (conflits.length) {
      var txt = conflits.map(function (pair) {
        return esc(pair[0].profil.name || 'Membre') + ' (' + esc(fmtTime(pair[0].heure)) + ') et ' +
               esc(pair[1].profil.name || 'Membre') + ' (' + esc(fmtTime(pair[1].heure)) + ')';
      }).join(' · ');
      alerte = '<div style="background:rgba(251,191,36,0.10);border:1px solid rgba(251,191,36,0.35);' +
          'border-radius:11px;padding:10px 12px;margin-bottom:11px;display:flex;gap:8px;align-items:flex-start;">' +
          '<span style="flex-shrink:0;">⚠️</span>' +
          '<div style="min-width:0;">' +
            '<div style="font-size:0.7em;color:#fbbf24;font-weight:900;letter-spacing:0.5px;margin-bottom:2px;">HORAIRES RAPPROCHÉS</div>' +
            '<div style="font-size:0.76em;color:#cbd5e1;line-height:1.4;">' + txt + '</div>' +
          '</div>' +
        '</div>';
    }

    var titre = JOURS_LONG[dayKey] + ' ' + d + ' ' + MOIS[m].toLowerCase() + ' ' + y;

    var old = document.getElementById('awakCalDayModal');
    if (old) old.remove();

    var modal = document.createElement('div');
    modal.id = 'awakCalDayModal';
    // 🎯 Fenêtre CENTRÉE (et non collée en bas). Le padding garde une marge
    // sur les bords, et align-items:center la place au milieu de l'écran.
    modal.style.cssText = 'position:fixed;inset:0;z-index:10150;background:rgba(0,0,0,0.94);' +
      'backdrop-filter:blur(10px);display:flex;align-items:center;justify-content:center;padding:18px 14px;';
    modal.addEventListener('click', function (e) { if (e.target === modal) modal.remove(); });

    modal.innerHTML =
      '<div style="width:100%;max-width:520px;background:#0F1014;border-radius:18px;max-height:82vh;' +
        'display:flex;flex-direction:column;border:1px solid rgba(34,211,238,0.3);' +
        'border-top:2px solid rgba(34,211,238,0.55);box-shadow:0 24px 60px rgba(0,0,0,0.7);overflow:hidden;">' +
        '<div style="padding:14px 18px 11px;flex-shrink:0;border-bottom:1px solid rgba(34,211,238,0.15);' +
          'display:flex;align-items:center;justify-content:space-between;gap:10px;">' +
          '<div style="min-width:0;">' +
            '<div style="font-size:0.58em;color:#22d3ee;font-weight:900;letter-spacing:2px;margin-bottom:2px;">' +
              (isToday ? "AUJOURD'HUI" : 'JOURNÉE') + '</div>' +
            '<h2 style="margin:0;color:#fff;font-size:1em;font-weight:900;overflow:hidden;' +
              'text-overflow:ellipsis;white-space:nowrap;">' + esc(titre) + '</h2>' +
          '</div>' +
          '<button onclick="document.getElementById(\'awakCalDayModal\').remove()" ' +
            'style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.14);color:#94a3b8;' +
            'border-radius:10px;width:34px;height:34px;min-height:auto;font-size:1.1em;font-weight:800;' +
            'cursor:pointer;flex-shrink:0;line-height:1;">×</button>' +
        '</div>' +
        '<div style="flex:1;overflow-y:auto;padding:13px 16px 22px;-webkit-overflow-scrolling:touch;">' + alerte + rows + '</div>' +
      '</div>';

    document.body.appendChild(modal);
  }

  // ── API publique (appelée depuis switchTab et les onclick) ──
  window.renderCalendarTab = render;
  window.awakCalOpenDay = openDay;

  // 🕐 Réglage de l'heure depuis la fenêtre de détail.
  // mode 'once'   → exception pour cette date seulement
  // mode 'always' → heure récurrente dans le plan hebdo du membre
  window.awakCalSetTime = function (i, mode) {
    var ctx = window.__awakCalDay;
    if (!ctx || !ctx.ids || !ctx.ids[i]) return;
    var id = ctx.ids[i];
    var input = document.getElementById('awakCalT' + i);
    var val = input ? (input.value || '') : '';
    var ymd = ctx.y + '-' + ctx.m + '-' + ctx.d;

    if (mode === 'once') {
      var ex = exFor(id);
      if (val) ex[ymd] = val;
      else delete ex[ymd];          // heure vide = retour à l'heure habituelle
      saveEx(id, ex);
    } else {
      // Récurrente : écrit dans le plan hebdo du membre, et retire
      // l'exception de cette date pour que le changement soit visible ici.
      try {
        var key = 'manualWeeklyPlan_' + id;
        var plan = JSON.parse(localStorage.getItem(key) || '{}');
        if (!plan || typeof plan !== 'object') plan = {};
        // Le jour peut venir d'une routine ou du plan actif : on crée alors une
        // entrée PORTEUSE D'HEURE (sans muscles), qui ne prend pas la priorité.
        if (!plan[ctx.dayKey]) plan[ctx.dayKey] = {};
        if (val) plan[ctx.dayKey].heure = val;
        else delete plan[ctx.dayKey].heure;
        localStorage.setItem(key, JSON.stringify(plan));
      } catch (e) {}
      var ex2 = exFor(id);
      delete ex2[ymd];
      saveEx(id, ex2);
    }

    if (typeof window.showToast === 'function') {
      window.showToast(
        mode === 'once'
          ? (val ? '🕐 Heure réglée pour cette date' : '↺ Heure habituelle rétablie')
          : (val ? '🔁 Heure appliquée à tous les ' + JOURS_LONG[ctx.dayKey].toLowerCase() + 's' : '🔁 Heure retirée du planning'),
        'success', 2500);
    }
    render();
    openDay(ctx.y, ctx.m, ctx.d);   // rouvre la fenêtre à jour
  };

  // ↺ Supprime l'exception de cette date (retour à l'heure récurrente)
  window.awakCalClearEx = function (i) {
    var ctx = window.__awakCalDay;
    if (!ctx || !ctx.ids || !ctx.ids[i]) return;
    var ex = exFor(ctx.ids[i]);
    delete ex[ctx.y + '-' + ctx.m + '-' + ctx.d];
    saveEx(ctx.ids[i], ex);
    if (typeof window.showToast === 'function') window.showToast('↺ Heure habituelle rétablie', 'success', 2200);
    render();
    openDay(ctx.y, ctx.m, ctx.d);
  };

  window.awakCalToggleMember = function (id) {
    if (!(cal.selected instanceof Set)) cal.selected = new Set();
    if (cal.selected.has(id)) cal.selected.delete(id);
    else cal.selected.add(id);
    render();
  };
  // ◀ ▶ : recule/avance d'une SEMAINE ou d'un MOIS selon la vue active.
  window.awakCalPrevMonth = function () {
    if (cal.vue === 'semaine') { cal.lundi.setDate(cal.lundi.getDate() - 7); }
    else { cal.month--; if (cal.month < 0) { cal.month = 11; cal.year--; } }
    render();
  };
  window.awakCalNextMonth = function () {
    if (cal.vue === 'semaine') { cal.lundi.setDate(cal.lundi.getDate() + 7); }
    else { cal.month++; if (cal.month > 11) { cal.month = 0; cal.year++; } }
    render();
  };
  window.awakCalToday = function () {
    var d = new Date();
    cal.month = d.getMonth(); cal.year = d.getFullYear(); cal.lundi = lundiDe(d);
    render();
  };
  // Accès en lecture pour l'accueil : même résolution du planning que
  // l'agenda, pour que les deux écrans affichent les mêmes chiffres.
  window.AwakCalPlan = {
    planFor: planFor, doneDates: doneDates, timeFor: timeFor, fmtTime: fmtTime,
    sourcePref: sourcePref, setSourcePref: setSourcePref, sourcesDispo: sourcesDispo,
    lundiDe: lundiDe, JOURS: JOURS, wIdx: wIdx
  };

  window.awakCalVue = function (v) {
    cal.vue = (v === 'mois') ? 'mois' : 'semaine';
    render();
  };
})();
