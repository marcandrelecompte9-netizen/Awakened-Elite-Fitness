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
  var MOIS        = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

  // Palette d'accents attribuée par ordre dans getAllProfiles(). Couleurs
  // distinctes et lisibles sur fond sombre — pas d'arc-en-ciel criard.
  var PALETTE = [
    { base: '#4ade80', soft: 'rgba(74,222,128,0.15)',  line: 'rgba(74,222,128,0.50)' },  // vert
    { base: '#60a8f0', soft: 'rgba(96,168,240,0.15)',  line: 'rgba(96,168,240,0.50)' },  // bleu
    { base: '#c084fc', soft: 'rgba(192,132,252,0.15)', line: 'rgba(192,132,252,0.50)' }, // violet
    { base: '#fbbf24', soft: 'rgba(251,191,36,0.15)',  line: 'rgba(251,191,36,0.50)' },  // ambre
    { base: '#f472b6', soft: 'rgba(244,114,182,0.15)', line: 'rgba(244,114,182,0.50)' }, // rose
    { base: '#22d3ee', soft: 'rgba(34,211,238,0.15)',  line: 'rgba(34,211,238,0.50)' },  // cyan
    { base: '#fb923c', soft: 'rgba(251,146,60,0.15)',  line: 'rgba(251,146,60,0.50)' },  // orange
    { base: '#a3e635', soft: 'rgba(163,230,53,0.15)',  line: 'rgba(163,230,53,0.50)' }   // lime
  ];

  var now0 = new Date();
  var cal = {
    month: now0.getMonth(),
    year:  now0.getFullYear(),
    selected: null   // Set d'ids ; initialisé au 1er rendu
  };

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

  // Planning hebdomadaire manuel d'un profil (même clé que getManualWeeklyPlan)
  function planFor(id) {
    try {
      var raw = localStorage.getItem('manualWeeklyPlan_' + id);
      if (!raw) return {};
      var p = JSON.parse(raw);
      return (p && typeof p === 'object') ? p : {};
    } catch (e) { return {}; }
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
        if (!isNaN(d.getTime())) set[d.getFullYear() + '-' + d.getMonth() + '-' + d.getDate()] = true;
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
      if (!s || !s.muscles || !s.muscles.length) return;
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

  // ── Coin d'accent (esthétique console) ──
  function corner(pos, col) {
    var base = 'position:absolute;width:13px;height:13px;pointer-events:none;opacity:0.85;';
    var m = {
      tl: 'top:9px;left:9px;border-top:2px solid ' + col + ';border-left:2px solid ' + col + ';border-radius:3px 0 0 0;',
      tr: 'top:9px;right:9px;border-top:2px solid ' + col + ';border-right:2px solid ' + col + ';border-radius:0 3px 0 0;',
      bl: 'bottom:9px;left:9px;border-bottom:2px solid ' + col + ';border-left:2px solid ' + col + ';border-radius:0 0 0 3px;',
      br: 'bottom:9px;right:9px;border-bottom:2px solid ' + col + ';border-right:2px solid ' + col + ';border-radius:0 0 3px 0;'
    };
    return '<div style="' + base + m[pos] + '"></div>';
  }

  // ── En-tête ──
  function headerHTML() {
    return '' +
      '<div class="card" style="position:relative;overflow:hidden;padding:18px 20px;' +
        'background:linear-gradient(150deg,#0a0f14 0%,#0c1620 55%,#0a1a12 100%);' +
        'border:1px solid rgba(74,222,128,0.16);">' +
        corner('tl', '#22d3ee') + corner('tr', '#22d3ee') + corner('bl', '#22d3ee') + corner('br', '#22d3ee') +
        '<div style="position:absolute;top:-40px;right:-30px;width:150px;height:150px;' +
          'background:radial-gradient(circle,rgba(34,211,238,0.16) 0%,transparent 68%);pointer-events:none;"></div>' +
        '<div style="position:relative;z-index:1;">' +
          '<div style="font-size:0.6em;color:#22d3ee;font-weight:900;letter-spacing:3px;margin-bottom:5px;">◈ PLANNING FAMILIAL</div>' +
          '<h2 style="margin:0;font-family:var(--font-display);font-size:1.85em;font-weight:800;' +
            'letter-spacing:0.04em;color:#e8f4ff;line-height:1.02;text-shadow:0 0 22px rgba(34,211,238,0.25);">CALENDRIER</h2>' +
          '<div style="font-size:0.76em;color:#94a3b8;margin-top:6px;line-height:1.4;">' +
            'Les séances de chacun, en un coup d\'œil. Touche un membre pour superposer son planning.</div>' +
        '</div>' +
      '</div>';
  }

  // ── Sélecteur de membres (le « ajout en un clic ») ──
  function membersHTML(list, colorById) {
    var chips = list.map(function (p) {
      var c = colorById[p.id];
      var sel = cal.selected.has(p.id);
      var bg   = sel ? c.soft : 'rgba(255,255,255,0.03)';
      var bord = sel ? c.line : 'rgba(255,255,255,0.09)';
      var nameCol = sel ? '#e8f0f8' : '#94a3b8';
      var mark = sel
        ? '<span style="flex-shrink:0;width:15px;height:15px;border-radius:50%;background:' + c.base +
            ';color:#04121f;font-size:0.6em;font-weight:900;display:inline-flex;align-items:center;justify-content:center;">✓</span>'
        : '<span style="flex-shrink:0;width:15px;height:15px;border-radius:50%;border:1.5px dashed rgba(148,163,184,0.5);' +
            'color:#64748b;font-size:0.72em;font-weight:900;display:inline-flex;align-items:center;justify-content:center;">+</span>';
      return '<button onclick="awakCalToggleMember(\'' + esc(p.id) + '\')" ' +
        'style="display:inline-flex;align-items:center;gap:8px;padding:7px 11px 7px 8px;border-radius:12px;' +
          'cursor:pointer;background:' + bg + ';border:1.5px solid ' + bord + ';' +
          'transition:background .15s ease,border-color .15s ease;">' +
        '<span style="flex-shrink:0;display:inline-flex;">' + av(p.avatar, 26) + '</span>' +
        '<span style="font-size:0.82em;font-weight:800;color:' + nameCol + ';white-space:nowrap;max-width:120px;overflow:hidden;text-overflow:ellipsis;">' + esc(p.name || 'Membre') + '</span>' +
        mark +
      '</button>';
    }).join('');

    var hint = (list.length <= 1)
      ? '<div style="font-size:0.72em;color:#64748b;margin-top:10px;line-height:1.4;">' +
          'Crée d\'autres profils dans l\'onglet <strong style="color:#94a3b8;">Famille</strong> pour superposer leurs plannings ici.</div>'
      : '';

    return '' +
      '<div class="card" style="padding:14px 16px;">' +
        '<div style="font-size:0.56em;letter-spacing:2px;color:#64748b;font-weight:900;margin-bottom:11px;">◈ MEMBRES</div>' +
        '<div style="display:flex;flex-wrap:wrap;gap:8px;">' + chips + '</div>' +
        hint +
      '</div>';
  }

  // ── Carte AUJOURD'HUI (triée par heure + alerte de chevauchement) ──
  function todayHTML(list, colorById, plans, dones) {
    var today = new Date();
    var dayKey = JOURS[wIdx(today)];
    var dateLbl = JOURS_LONG[dayKey] + ' ' + today.getDate() + ' ' + MOIS[today.getMonth()].toLowerCase();

    var entries = entriesFor(list, plans, dones, today.getFullYear(), today.getMonth(), today.getDate());
    var selList = list.filter(function (p) { return cal.selected.has(p.id); });

    // Membres au repos aujourd'hui
    var actifs = {};
    entries.forEach(function (e) { actifs[e.profil.id] = true; });
    var repos = selList.filter(function (p) { return !actifs[p.id]; });

    var rows = entries.map(function (e) {
      var c = colorById[e.profil.id];
      var s = e.seance;
      var label = s.label || s.muscles.slice(0, 3).join(' · ');
      var mus = s.muscles.map(function (m) {
        return '<span style="background:' + c.soft + ';color:' + c.base + ';border:1px solid ' + c.line +
          ';padding:1px 7px;border-radius:99px;font-size:0.66em;font-weight:700;">' + esc(m) + '</span>';
      }).join('');
      var heure = e.heure
        ? '<span style="background:' + c.base + ';color:#04121f;padding:2px 8px;border-radius:7px;' +
            'font-size:0.72em;font-weight:900;font-family:var(--font-display);flex-shrink:0;">' + esc(fmtTime(e.heure)) + '</span>'
        : '<span style="color:#64748b;font-size:0.66em;font-weight:700;flex-shrink:0;">—</span>';

      return '<div style="display:flex;align-items:flex-start;gap:11px;padding:11px 0;border-top:1px solid rgba(255,255,255,0.05);">' +
          '<div style="flex-shrink:0;display:flex;flex-direction:column;align-items:center;gap:5px;width:44px;">' +
            '<span style="display:inline-flex;">' + av(e.profil.avatar, 34) + '</span>' +
            '<span style="width:16px;height:3px;border-radius:99px;background:' + c.base + ';"></span>' +
          '</div>' +
          '<div style="min-width:0;flex:1;">' +
            '<div style="display:flex;align-items:center;gap:8px;margin-bottom:5px;flex-wrap:wrap;">' +
              heure +
              '<span style="font-size:0.9em;font-weight:800;color:#e8f0f8;">' + esc(label) + '</span>' +
              (e.faite ? '<span style="color:' + c.base + ';font-size:0.72em;font-weight:900;">✓</span>' : '') +
            '</div>' +
            '<div style="display:flex;flex-wrap:wrap;gap:4px;">' + mus + '</div>' +
          '</div>' +
        '</div>';
    }).join('');

    // Ligne compacte pour ceux qui se reposent
    if (repos.length) {
      rows += '<div style="padding:9px 0 2px;border-top:1px solid rgba(255,255,255,0.05);' +
          'font-size:0.74em;color:#64748b;font-weight:600;">🛌 Repos : ' +
          repos.map(function (p) { return esc(p.name || 'Membre'); }).join(', ') +
        '</div>';
    }

    if (!rows) {
      rows = '<div style="padding:14px 0 4px;text-align:center;color:#64748b;font-size:0.82em;">Aucun membre sélectionné.</div>';
    }

    // ⚠️ Alerte : deux membres à moins d'une heure d'écart
    var conflits = overlaps(entries);
    var alerte = '';
    if (conflits.length) {
      var txt = conflits.map(function (pair) {
        return esc(pair[0].profil.name || 'Membre') + ' (' + esc(fmtTime(pair[0].heure)) + ') et ' +
               esc(pair[1].profil.name || 'Membre') + ' (' + esc(fmtTime(pair[1].heure)) + ')';
      }).join(' · ');
      alerte = '<div style="margin-top:11px;background:rgba(251,191,36,0.10);border:1px solid rgba(251,191,36,0.35);' +
          'border-radius:10px;padding:9px 11px;display:flex;gap:8px;align-items:flex-start;">' +
          '<span style="flex-shrink:0;font-size:0.95em;">⚠️</span>' +
          '<div style="min-width:0;">' +
            '<div style="font-size:0.72em;color:#fbbf24;font-weight:900;letter-spacing:0.5px;margin-bottom:2px;">HORAIRES RAPPROCHÉS</div>' +
            '<div style="font-size:0.75em;color:#cbd5e1;line-height:1.4;">' + txt + '</div>' +
          '</div>' +
        '</div>';
    }

    return '' +
      '<div class="card" style="position:relative;overflow:hidden;padding:15px 17px;' +
        'background:linear-gradient(135deg,#0a1628 0%,#0d1f18 100%);border:1.5px solid rgba(74,222,128,0.3);">' +
        '<div style="position:absolute;top:-30px;left:-25px;width:120px;height:120px;' +
          'background:radial-gradient(circle,rgba(74,222,128,0.14) 0%,transparent 70%);pointer-events:none;"></div>' +
        '<div style="position:relative;z-index:1;">' +
          '<div style="display:flex;align-items:baseline;justify-content:space-between;gap:8px;margin-bottom:2px;">' +
            '<span style="font-size:0.56em;letter-spacing:2px;color:#4ade80;font-weight:900;">◈ AUJOURD\'HUI</span>' +
            '<span style="font-size:0.7em;color:#94a3b8;font-weight:700;">' + esc(dateLbl) + '</span>' +
          '</div>' +
          rows +
          alerte +
        '</div>' +
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
      cells += '<div style="border-radius:9px;background:rgba(255,255,255,0.012);border:1px solid rgba(255,255,255,0.03);min-height:52px;min-width:0;"></div>';
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
        ? 'display:inline-flex;align-items:center;justify-content:center;min-width:21px;height:21px;padding:0 4px;' +
          'border-radius:6px;background:#4ade80;color:#04121f;font-weight:900;font-size:0.8em;' +
          'font-family:var(--font-display);box-shadow:0 0 10px rgba(74,222,128,0.5);'
        : 'color:#cbd5e1;font-weight:800;font-size:0.8em;font-family:var(--font-display);padding-left:1px;';

      cells += '<div onclick="awakCalOpenDay(' + cal.year + ',' + cal.month + ',' + day + ')" ' +
          'role="button" tabindex="0" aria-label="' + day + ' ' + esc(MOIS[cal.month]) + (nb ? ', ' + nb + ' séance(s)' : '') + '" ' +
          'style="border-radius:9px;padding:5px 3px 4px;min-height:52px;min-width:0;overflow:hidden;cursor:pointer;' +
          'display:flex;flex-direction:column;align-items:center;gap:4px;' +
          'background:' + (isToday ? 'rgba(74,222,128,0.07)' : 'rgba(255,255,255,0.022)') + ';' +
          'border:1px solid ' + (isToday ? 'rgba(74,222,128,0.5)' : 'rgba(255,255,255,0.055)') + ';">' +
          '<div style="' + numStyle + '">' + day + '</div>' +
          (dots ? '<div style="display:flex;flex-wrap:wrap;gap:3px;justify-content:center;align-items:center;">' + dots + '</div>' : '') +
          heureTxt +
        '</div>';
    }

    // Navigation du mois
    var navBtn = 'flex-shrink:0;width:40px;height:40px;border-radius:10px;cursor:pointer;' +
      'background:rgba(96,168,240,0.08);border:1px solid rgba(96,168,240,0.28);color:#93c5fd;font-size:0.95em;font-weight:900;';
    var nav = '<div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">' +
        '<button onclick="awakCalPrevMonth()" aria-label="Mois précédent" style="' + navBtn + '">◀</button>' +
        '<div style="flex:1;min-width:0;text-align:center;">' +
          '<div style="font-family:var(--font-display);font-size:1.05em;font-weight:800;letter-spacing:0.04em;' +
            'color:#e8f0f8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' +
            esc(MOIS[cal.month]) + ' ' + cal.year + '</div>' +
          (isCurMonth ? '' :
            '<button onclick="awakCalToday()" style="margin-top:3px;background:none;border:none;color:#22d3ee;' +
              'font-size:0.66em;font-weight:800;cursor:pointer;letter-spacing:0.5px;">↺ Revenir à aujourd\'hui</button>') +
        '</div>' +
        '<button onclick="awakCalNextMonth()" aria-label="Mois suivant" style="' + navBtn + '">▶</button>' +
      '</div>';

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

      legend = '<div style="margin-top:13px;padding-top:11px;border-top:1px solid rgba(255,255,255,0.06);">' +
          (membres ? '<div style="display:flex;flex-wrap:wrap;gap:10px;margin-bottom:9px;">' + membres + '</div>' : '') +
          '<div style="display:flex;flex-wrap:wrap;gap:13px;align-items:center;">' +
            '<span style="display:inline-flex;align-items:center;gap:5px;font-size:0.68em;color:#64748b;font-weight:700;">' +
              '<span style="width:9px;height:9px;border-radius:50%;border:2px solid #94a3b8;flex-shrink:0;"></span>prévue</span>' +
            '<span style="display:inline-flex;align-items:center;gap:5px;font-size:0.68em;color:#64748b;font-weight:700;">' +
              '<span style="width:9px;height:9px;border-radius:50%;background:#94a3b8;flex-shrink:0;"></span>faite</span>' +
            '<span style="font-size:0.68em;color:#475569;font-weight:600;">· touche un jour pour le détail</span>' +
          '</div>' +
        '</div>';
    }

    return '<div class="card" style="padding:15px 8px 16px!important;overflow:hidden;">' +
        '<div style="padding:0 5px;">' + nav + '</div>' +
        '<div style="display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:3px;margin-bottom:4px;">' + head + '</div>' +
        '<div style="display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:3px;">' + cells + '</div>' +
        '<div style="padding:0 5px;">' + legend + '</div>' +
      '</div>';
  }

  // ── Bannière « pas encore de planning » (profil actif) ──
  function ctaHTML() {
    return '<div class="card" onclick="if(typeof openManualPlanEditor===\'function\')openManualPlanEditor()" ' +
      'style="cursor:pointer;padding:14px 16px;background:linear-gradient(135deg,#1a0533 0%,#0d0221 100%);' +
      'border:1.5px dashed rgba(168,85,247,0.4);display:flex;align-items:center;gap:12px;">' +
      '<span style="flex-shrink:0;width:34px;height:34px;border-radius:9px;background:rgba(168,85,247,0.15);' +
        'border:1px solid rgba(168,85,247,0.4);display:inline-flex;align-items:center;justify-content:center;' +
        'color:#c084fc;font-weight:900;">+</span>' +
      '<div style="flex:1;min-width:0;">' +
        '<div style="font-size:0.56em;letter-spacing:1.5px;color:#c084fc;font-weight:900;margin-bottom:2px;">PLANNING</div>' +
        '<div style="font-size:0.82em;color:#e8f0f8;font-weight:700;">Tu n\'as pas encore de planning — touche pour l\'organiser</div>' +
      '</div>' +
      '<span style="color:#64748b;flex-shrink:0;">›</span>' +
    '</div>';
  }

  // ── Rendu principal ──
  function render() {
    var host = document.getElementById('calendarTabContent');
    if (!host) return;

    var list = profiles();
    if (!list.length) {
      host.innerHTML = headerHTML() +
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
      headerHTML() +
      membersHTML(list, colorById) +
      (showCTA ? ctaHTML() : '') +
      todayHTML(list, colorById, plans, dones) +
      gridHTML(list, colorById, plans, dones);
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
              'style="background:rgba(74,222,128,0.12);border:1px solid rgba(74,222,128,0.35);color:#4ade80;' +
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
          '🛌 Repos : ' + repos.map(function (p) { return esc(p.name || 'Membre'); }).join(', ') + '</div>';
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
    modal.style.cssText = 'position:fixed;inset:0;z-index:10150;background:rgba(0,0,0,0.94);' +
      'backdrop-filter:blur(10px);display:flex;align-items:flex-end;justify-content:center;padding:0;';
    modal.addEventListener('click', function (e) { if (e.target === modal) modal.remove(); });

    modal.innerHTML =
      '<div style="width:100%;max-width:520px;background:#0F1014;border-radius:20px 20px 0 0;max-height:88vh;' +
        'display:flex;flex-direction:column;border-top:2px solid rgba(34,211,238,0.45);">' +
        '<div style="width:36px;height:3px;background:#334155;border-radius:99px;margin:10px auto 0;flex-shrink:0;"></div>' +
        '<div style="padding:12px 18px 11px;flex-shrink:0;border-bottom:1px solid rgba(34,211,238,0.15);' +
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
        if (plan && plan[ctx.dayKey]) {
          if (val) plan[ctx.dayKey].heure = val;
          else delete plan[ctx.dayKey].heure;
          localStorage.setItem(key, JSON.stringify(plan));
        }
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
  window.awakCalPrevMonth = function () {
    cal.month--; if (cal.month < 0) { cal.month = 11; cal.year--; }
    render();
  };
  window.awakCalNextMonth = function () {
    cal.month++; if (cal.month > 11) { cal.month = 0; cal.year++; }
    render();
  };
  window.awakCalToday = function () {
    var d = new Date(); cal.month = d.getMonth(); cal.year = d.getFullYear();
    render();
  };
})();
