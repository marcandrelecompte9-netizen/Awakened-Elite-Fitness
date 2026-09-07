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

  // ── Carte AUJOURD'HUI ──
  function todayHTML(list, colorById, plans) {
    var today = new Date();
    var dayKey = JOURS[wIdx(today)];
    var dateLbl = JOURS_LONG[dayKey] + ' ' + today.getDate() + ' ' + MOIS[today.getMonth()].toLowerCase();

    var selList = list.filter(function (p) { return cal.selected.has(p.id); });
    var rows = selList.map(function (p) {
      var c = colorById[p.id];
      var s = (plans[p.id] || {})[dayKey];
      var trained = s && s.muscles && s.muscles.length;
      var right;
      if (trained) {
        var label = s.label || s.muscles.slice(0, 3).join(' · ');
        var mus = s.muscles.map(function (m) {
          return '<span style="background:' + c.soft + ';color:' + c.base + ';border:1px solid ' + c.line +
            ';padding:1px 7px;border-radius:99px;font-size:0.66em;font-weight:700;">' + esc(m) + '</span>';
        }).join('');
        right = '<div style="min-width:0;flex:1;">' +
            '<div style="font-size:0.9em;font-weight:800;color:#e8f0f8;margin-bottom:5px;">' + esc(label) + '</div>' +
            '<div style="display:flex;flex-wrap:wrap;gap:4px;">' + mus + '</div>' +
          '</div>';
      } else {
        right = '<div style="flex:1;font-size:0.82em;color:#64748b;font-weight:600;padding-top:2px;">Repos</div>';
      }
      return '<div style="display:flex;align-items:flex-start;gap:11px;padding:11px 0;border-top:1px solid rgba(255,255,255,0.05);">' +
          '<div style="flex-shrink:0;display:flex;flex-direction:column;align-items:center;gap:5px;width:44px;">' +
            '<span style="display:inline-flex;">' + av(p.avatar, 34) + '</span>' +
            '<span style="width:16px;height:3px;border-radius:99px;background:' + c.base + ';"></span>' +
          '</div>' +
          right +
        '</div>';
    }).join('');

    if (!rows) {
      rows = '<div style="padding:14px 0 4px;text-align:center;color:#64748b;font-size:0.82em;">Aucun membre sélectionné.</div>';
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
        '</div>' +
      '</div>';
  }

  // ── Pastille de séance dans une case ──
  function pill(c, text, done) {
    if (done) {
      return '<div style="background:' + c.base + ';color:#04121f;border:1px solid ' + c.base + ';border-radius:6px;' +
        'padding:2px 5px;font-size:0.62em;font-weight:800;line-height:1.15;white-space:nowrap;overflow:hidden;' +
        'text-overflow:ellipsis;max-width:100%;">✓ ' + esc(text) + '</div>';
    }
    return '<div style="background:' + c.soft + ';color:' + c.base + ';border:1px solid ' + c.line + ';border-radius:6px;' +
      'padding:2px 5px;font-size:0.62em;font-weight:700;line-height:1.15;white-space:nowrap;overflow:hidden;' +
      'text-overflow:ellipsis;max-width:100%;">' + esc(text) + '</div>';
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
      return '<div style="text-align:center;font-size:0.6em;font-weight:900;letter-spacing:1px;padding:6px 0;' +
        'color:' + (we ? '#64748b' : '#94a3b8') + ';">' + j + '</div>';
    }).join('');

    var cells = '';
    // Cases vides du début
    for (var b = 0; b < firstDow; b++) {
      cells += '<div style="border-radius:10px;background:rgba(255,255,255,0.012);border:1px solid rgba(255,255,255,0.03);min-height:74px;"></div>';
    }
    // Jours du mois
    for (var day = 1; day <= daysInMonth; day++) {
      var date = new Date(cal.year, cal.month, day);
      var dayKey = JOURS[wIdx(date)];
      var isToday = isCurMonth && day === todayNum;
      var ymd = cal.year + '-' + cal.month + '-' + day;

      var pills = '';
      selList.forEach(function (p) {
        var s = (plans[p.id] || {})[dayKey];
        if (s && s.muscles && s.muscles.length) {
          var label = s.label || s.muscles.slice(0, 2).join('·');
          var done = !!(dones[p.id] && dones[p.id][ymd]);
          pills += pill(colorById[p.id], label, done);
        }
      });

      var numStyle = isToday
        ? 'display:inline-flex;align-items:center;justify-content:center;min-width:22px;height:22px;padding:0 5px;' +
          'border-radius:7px;background:#4ade80;color:#04121f;font-weight:900;font-size:0.82em;' +
          'font-family:var(--font-display);box-shadow:0 0 12px rgba(74,222,128,0.5);'
        : 'color:#cbd5e1;font-weight:800;font-size:0.82em;font-family:var(--font-display);padding-left:2px;';

      cells += '<div style="border-radius:10px;padding:6px 5px 5px;min-height:74px;display:flex;flex-direction:column;gap:4px;' +
          'background:' + (isToday ? 'rgba(74,222,128,0.07)' : 'rgba(255,255,255,0.022)') + ';' +
          'border:1px solid ' + (isToday ? 'rgba(74,222,128,0.5)' : 'rgba(255,255,255,0.055)') + ';">' +
          '<div style="' + numStyle + '">' + day + '</div>' +
          (pills ? '<div style="display:flex;flex-direction:column;gap:3px;">' + pills + '</div>' : '') +
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

    // Légende (mapping couleur ↔ membre) — uniquement si plus d'un membre visible
    var legend = '';
    if (selList.length > 1) {
      legend = '<div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:14px;padding-top:12px;border-top:1px solid rgba(255,255,255,0.06);">' +
        selList.map(function (p) {
          var c = colorById[p.id];
          return '<div style="display:inline-flex;align-items:center;gap:6px;">' +
            '<span style="width:11px;height:11px;border-radius:3px;background:' + c.base + ';flex-shrink:0;"></span>' +
            '<span style="font-size:0.72em;color:#94a3b8;font-weight:700;">' + esc(p.name || 'Membre') + '</span>' +
          '</div>';
        }).join('') +
      '</div>';
    }

    return '<div class="card" style="padding:15px 15px 16px;">' +
        nav +
        '<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:5px;margin-bottom:5px;">' + head + '</div>' +
        '<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:5px;">' + cells + '</div>' +
        legend +
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
      todayHTML(list, colorById, plans) +
      gridHTML(list, colorById, plans, dones);
  }

  // ── API publique (appelée depuis switchTab et les onclick) ──
  window.renderCalendarTab = render;

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
