/* ============================================================
   ARBRE DE L'ÉVEIL — agrégateur visuel de la progression
   Branches = qualités (Force, Endurance, Mental, Équilibre, Agilité, Cardio).
   Se nourrit de l'ACTIVITÉ RÉELLE (workoutHistory), jamais des stats RPG.
   Un nom d'archétype est calculé selon les qualités dominantes.
   ============================================================ */
(function () {
  "use strict";

  // ── Métadonnées des 6 qualités ──
  var Q = [
    { id: 'force',     ic: '⚔️', nm: 'Force',     col: '#ef4444', base: "Le Colosse",   adj: "de Fer",  mat: "de Fer",      angle: 158, anchor: [156, 247], len: 96 },
    { id: 'endurance', ic: '💚', nm: 'Endurance', col: '#22c55e', base: "L'Increvable", adj: "Tenace",  mat: "de Ténacité", angle: 130, anchor: [158, 223], len: 94 },
    { id: 'mental',    ic: '🌀', nm: 'Mental',    col: '#a855f7', base: "Le Moine",     adj: "Serein",  mat: "de Sérénité", angle: 103, anchor: [160, 199], len: 84 },
    { id: 'equilibre', ic: '🪶', nm: 'Équilibre', col: '#06b6d4', base: "Le Funambule", adj: "Stable",  mat: "d'Équilibre", angle: 77,  anchor: [160, 199], len: 84 },
    { id: 'agilite',   ic: '⚡', nm: 'Agilité',   col: '#eab308', base: "Le Félin",     adj: "Vif",     mat: "de Vivacité", angle: 50,  anchor: [162, 223], len: 94 },
    { id: 'cardio',    ic: '🔥', nm: 'Cardio',    col: '#f97316', base: "Le Brasier",   adj: "Ardent",  mat: "de Feu",      angle: 22,  anchor: [164, 247], len: 96 }
  ];
  var LEGENDARY = [
    { keys: ['mental', 'cardio'],    name: "Le Guerrier Serein" },
    { keys: ['mental', 'agilite'],   name: "Le Danseur de l'Ombre" },
    { keys: ['force', 'mental'],     name: "Le Sage de Fer" },
    { keys: ['force', 'endurance'],  name: "Le Titan" },
    { keys: ['agilite', 'cardio'],   name: "Le Fauve" },
    { keys: ['equilibre', 'mental'], name: "Le Maître Zen" },
    { keys: ['force', 'agilite'],    name: "Le Berserker" }
  ];
  var STAGE_NAMES = ['Graine', 'Bourgeon', 'Pousse', 'Jeune', 'Mûr', 'En fleur'];
  var THRESHOLDS = [0, 1, 5, 12, 22, 35];       // ⚙️ AJUSTABLE : cumul (≈ séances-équivalent) → palier
  var RANKS = ['E', 'D', 'C', 'B', 'A', 'S'];
  var RANK_COL = ['#64748b', '#22c55e', '#22d3ee', '#a855f7', '#f97316', '#fbbf24'];

  // ── Mapping ACTIVITÉ → qualités (poids relatifs, normalisés à l'usage) ──
  // ⚙️ AJUSTABLE : profil de qualités par discipline.
  var DISCIPLINE_QUALITIES = {
    yoga:        { mental: 3, equilibre: 2, endurance: 1 },
    serenite:    { mental: 4, equilibre: 1 },
    pilates:     { equilibre: 3, mental: 2, force: 2 },
    barre:       { equilibre: 3, force: 2, endurance: 2 },
    mobilite:    { equilibre: 3, mental: 1, endurance: 2 },
    boxe:        { cardio: 3, agilite: 3, force: 1 },
    course:      { cardio: 4, endurance: 3 },
    hiit:        { cardio: 3, endurance: 2, agilite: 1 },
    core:        { equilibre: 3, force: 2 },
    calisthenie: { force: 3, equilibre: 1, agilite: 1 }
  };
  // ⚙️ AJUSTABLE : profil de qualités par muscle (muscu classique + fallback).
  var MUSCLE_QUALITIES = {
    'Cardio':          { cardio: 3, endurance: 1 },
    'Corps entier':    { force: 2, endurance: 1, cardio: 1 },
    'Pectoraux':       { force: 3 },
    'Dos':             { force: 3 },
    'Épaules':         { force: 3 },
    'Biceps':          { force: 3 },
    'Triceps':         { force: 3 },
    'Avant-bras':      { force: 2, equilibre: 1 },
    'Trapèzes':        { force: 3 },
    'Quadriceps':      { force: 3 },
    'Ischio-jambiers': { force: 3 },
    'Fessiers':        { force: 3 },
    'Mollets':         { force: 2, equilibre: 1 },
    'Adducteurs':      { force: 2, equilibre: 1 },
    'Abdominaux':      { equilibre: 2, force: 1 },
    'Obliques':        { equilibre: 2, force: 1 }
  };

  // ── Lecture de l'historique réel ──
  function _history() {
    try {
      var pid = (typeof getCurrentProfileId === 'function') ? getCurrentProfileId() : null;
      var saved = (pid && typeof getProfileData === 'function') ? getProfileData(pid, 'workoutHistory') : localStorage.getItem('workoutHistory');
      var h = JSON.parse(saved || '[]');
      return Array.isArray(h) ? h : [];
    } catch (e) { return []; }
  }

  function _addProfile(acc, prof, w) {
    var sum = 0, k;
    for (k in prof) sum += prof[k];
    if (sum <= 0) return;
    for (k in prof) acc[k] = (acc[k] || 0) + (prof[k] / sum) * w;
  }

  // ── Cumul des qualités à partir de l'activité réelle ──
  // Chaque séance verse 1.0 point au total, réparti selon ce qu'elle a entraîné.
  function awakComputeQualities() {
    var total = { force: 0, endurance: 0, mental: 0, equilibre: 0, agilite: 0, cardio: 0 };
    var hist = _history();
    hist.forEach(function (entry) {
      if (!entry) return;
      var acc = { force: 0, endurance: 0, mental: 0, equilibre: 0, agilite: 0, cardio: 0 }, n = 0;
      var exs = (entry.workoutData && Array.isArray(entry.workoutData.exercises))
        ? entry.workoutData.exercises.filter(function (e) { return e && !e.isRest && !e.isInfo; }) : [];
      if (exs.length) {
        exs.forEach(function (ex) {
          var prof = (ex.discipline && DISCIPLINE_QUALITIES[ex.discipline]) ? DISCIPLINE_QUALITIES[ex.discipline]
            : (ex.muscle && MUSCLE_QUALITIES[ex.muscle]) ? MUSCLE_QUALITIES[ex.muscle] : null;
          if (prof) { _addProfile(acc, prof, 1); n++; }
        });
      } else if (entry.muscles && entry.muscles.length) {
        entry.muscles.forEach(function (m) { var prof = MUSCLE_QUALITIES[m]; if (prof) { _addProfile(acc, prof, 1); n++; } });
      }
      if (n > 0) { for (var k in acc) total[k] += acc[k] / n; }
    });
    return total;
  }

  function stageOf(c) { var s = 0; for (var i = 0; i < THRESHOLDS.length; i++) { if (c >= THRESHOLDS[i]) s = i; } return s; }
  function nextThreshold(c) { for (var i = 0; i < THRESHOLDS.length; i++) { if (c < THRESHOLDS[i]) return THRESHOLDS[i]; } return null; }

  // ── Moteur d'archétype ──
  function setEq(a, b) { if (a.length !== b.length) return false; var s = a.slice().sort(), t = b.slice().sort(); return s.every(function (x, i) { return x === t[i]; }); }
  function awakArchetype(counts) {
    var total = 0; Q.forEach(function (q) { total += counts[q.id]; });
    if (total < 0.5) return { name: "Éveil en sommeil", sub: "ton arbre attend tes premières séances" };
    var arr = Q.map(function (q) { return { q: q, c: counts[q.id], s: counts[q.id] / total }; })
      .filter(function (x) { return x.c > 0; }).sort(function (a, b) { return b.c - a.c; });
    var p1 = arr[0].s, p2 = arr[1] ? arr[1].s : 0, p3 = arr[2] ? arr[2].s : 0;
    var strong = arr.filter(function (x) { return x.s >= p1 * 0.62; });
    if (strong.length >= 5) return { name: "L'Éveillé", sub: "toutes les voies en équilibre" };
    if (strong.length === 1 || p1 >= 0.5 || (p1 - p2) >= 0.25) return { name: arr[0].q.base, sub: "voie de " + arr[0].q.nm.toLowerCase() };
    var top2 = [arr[0].q.id, arr[1].q.id];
    var leg = LEGENDARY.find(function (L) { return setEq(L.keys, top2); });
    var name = leg ? leg.name : (arr[0].q.base + " " + arr[1].q.adj);
    var sub = arr[0].q.nm + " + " + arr[1].q.nm;
    if (strong.length >= 3) {
      var third = arr[2];
      if (p3 >= p2 * 0.85) { name = leg ? (name + ", marqué " + third.q.mat) : (arr[0].q.base + " " + arr[1].q.adj + " et " + third.q.adj); sub += " + " + third.q.nm; }
      else { name = name + ", teinté " + third.q.mat; sub += " · " + third.q.nm + " en nuance"; }
    }
    return { name: name, sub: sub };
  }

  // ── Dessin SVG (lumière haut-gauche, avec relief) ──
  function shade(hex, amt) { var n = parseInt(hex.slice(1), 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255; if (amt >= 0) { r += (255 - r) * amt; g += (255 - g) * amt; b += (255 - b) * amt; } else { r *= (1 + amt); g *= (1 + amt); b *= (1 + amt); } var h = function (v) { return ('0' + Math.round(v).toString(16)).slice(-2); }; return '#' + h(r) + h(g) + h(b); }
  function bez(p0, cp, p1, t) { var u = 1 - t; return [u * u * p0[0] + 2 * u * t * cp[0] + t * t * p1[0], u * u * p0[1] + 2 * u * t * cp[1] + t * t * p1[1]]; }
  function bezTan(p0, cp, p1, t) { var u = 1 - t, dx = 2 * u * (cp[0] - p0[0]) + 2 * t * (p1[0] - cp[0]), dy = 2 * u * (cp[1] - p0[1]) + 2 * t * (p1[1] - cp[1]), m = Math.hypot(dx, dy) || 1; return [dx / m, dy / m]; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function taperedBranch(p0, cp, p1, w0, w1, fill) { var N = 12, L = [], R = [], i; for (i = 0; i <= N; i++) { var t = i / N, pt = bez(p0, cp, p1, t), tan = bezTan(p0, cp, p1, t), nx = -tan[1], ny = tan[0], w = lerp(w0, w1, t) / 2; L.push([pt[0] + nx * w, pt[1] + ny * w]); R.push([pt[0] - nx * w, pt[1] - ny * w]); } var d = 'M' + L[0][0].toFixed(1) + ' ' + L[0][1].toFixed(1); for (i = 1; i <= N; i++) d += ' L' + L[i][0].toFixed(1) + ' ' + L[i][1].toFixed(1); for (i = N; i >= 0; i--) d += ' L' + R[i][0].toFixed(1) + ' ' + R[i][1].toFixed(1); return '<path d="' + d + ' Z" fill="' + fill + '"/>'; }
  function flower(cx, cy, r) { var s = '', k; for (k = 0; k < 5; k++) { var a = k / 5 * Math.PI * 2 - 0.4, px = cx + Math.cos(a) * r, py = cy + Math.sin(a) * r; s += '<circle cx="' + px.toFixed(1) + '" cy="' + py.toFixed(1) + '" r="' + (r * 0.66).toFixed(1) + '" fill="#fff7e6" opacity="0.95"/>'; } s += '<circle cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) + '" r="' + (r * 0.6).toFixed(1) + '" fill="#fbbf24" filter="url(#awkGlow)"/>'; return s; }
  function foliage(cx, cy, r, col, wf) {
    var d2 = shade(col, -0.62), mid = shade(col, 0.20), light = shade(col, 0.58), s = '';
    s += '<ellipse cx="' + (cx + r * 0.16).toFixed(1) + '" cy="' + (cy + r * 0.30).toFixed(1) + '" rx="' + (r * 0.96).toFixed(1) + '" ry="' + (r * 0.80).toFixed(1) + '" fill="#070a07" opacity="0.30"/>';
    s += '<circle cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) + '" r="' + (r * 1.16).toFixed(1) + '" fill="' + col + '" opacity="0.12" filter="url(#awkGlow)"/>';
    var blobs = [[0, 0, 1.0], [-0.55, 0.12, 0.62], [0.55, 0.16, 0.6], [-0.32, -0.46, 0.6], [0.34, -0.42, 0.58], [0, 0.5, 0.55], [0, -0.56, 0.5], [0.6, -0.2, 0.4], [-0.6, -0.16, 0.4]];
    blobs.forEach(function (b) { s += '<circle cx="' + (cx + b[0] * r + r * 0.05).toFixed(1) + '" cy="' + (cy + b[1] * r + r * 0.16).toFixed(1) + '" r="' + (r * b[2] * 0.95).toFixed(1) + '" fill="' + d2 + '"/>'; });
    blobs.forEach(function (b) { s += '<circle cx="' + (cx + b[0] * r).toFixed(1) + '" cy="' + (cy + b[1] * r).toFixed(1) + '" r="' + (r * b[2] * 0.9).toFixed(1) + '" fill="' + col + '"/>'; });
    [[-0.20, -0.34, 0.55], [0.18, -0.36, 0.48], [-0.04, -0.10, 0.58]].forEach(function (b) { s += '<circle cx="' + (cx + b[0] * r).toFixed(1) + '" cy="' + (cy + b[1] * r).toFixed(1) + '" r="' + (r * b[2]).toFixed(1) + '" fill="' + mid + '" opacity="0.7"/>'; });
    [[-0.30, -0.48, 0.40], [-0.50, -0.20, 0.30], [0.02, -0.52, 0.26]].forEach(function (b) { s += '<circle cx="' + (cx + b[0] * r).toFixed(1) + '" cy="' + (cy + b[1] * r).toFixed(1) + '" r="' + (r * b[2]).toFixed(1) + '" fill="' + light + '" opacity="0.82"/>'; });
    s += '<circle cx="' + (cx - r * 0.34).toFixed(1) + '" cy="' + (cy - r * 0.46).toFixed(1) + '" r="' + (r * 0.13).toFixed(1) + '" fill="#ffffff" opacity="0.55"/>';
    if (wf) { [[-0.32, -0.18], [0.36, 0.02], [0.0, -0.48], [0.22, 0.36]].forEach(function (f) { s += flower(cx + f[0] * r, cy + f[1] * r, 2.5); }); }
    return s;
  }
  function branchSVG(p, stage) {
    if (stage === 0) return '';
    var a = p.angle * Math.PI / 180, grow = 0.34 + 0.66 * (stage / 5), len = p.len * grow;
    var ax = p.anchor[0], ay = p.anchor[1], ex = ax + Math.cos(a) * len, ey = ay - Math.sin(a) * len;
    var mx = (ax + ex) / 2 + Math.cos(a + 0.55) * len * 0.16, my = (ay + ey) / 2 - len * 0.16;
    var p0 = [ax, ay], cp = [mx, my], p1 = [ex, ey], wood = '#473a2c', light = shade(p.col, 0.55);
    var w0 = 2.6 + stage * 1.5, w1 = 1.0 + stage * 0.35, s = taperedBranch(p0, cp, p1, w0, w1, wood);
    if (stage === 1) { s += '<circle cx="' + ex.toFixed(1) + '" cy="' + ey.toFixed(1) + '" r="3.4" fill="' + p.col + '"/>'; s += '<circle cx="' + (ex - 0.8).toFixed(1) + '" cy="' + (ey - 0.9).toFixed(1) + '" r="1.5" fill="' + light + '"/>'; return s; }
    var bl2 = []; if (stage >= 3) bl2.push({ t: 0.58, side: 1, f: 0.42 }); if (stage >= 4) bl2.push({ t: 0.76, side: -1, f: 0.36 }); if (stage >= 5) bl2.push({ t: 0.48, side: -1, f: 0.32 });
    var tips = [{ x: ex, y: ey, r: (stage >= 5 ? 13 : stage >= 4 ? 11 : stage >= 3 ? 9 : 7.5) }];
    bl2.forEach(function (bl) { var bp = bez(p0, cp, p1, bl.t), tan = bezTan(p0, cp, p1, bl.t), nrm = [-tan[1], tan[0]], blen = len * bl.f; var bex = bp[0] + (tan[0] * 0.55 + nrm[0] * bl.side) * blen, bey = bp[1] + (tan[1] * 0.55 + nrm[1] * bl.side) * blen; var bcp = [(bp[0] + bex) / 2 + nrm[0] * bl.side * blen * 0.2, (bp[1] + bey) / 2 - blen * 0.15]; s += taperedBranch(bp, bcp, [bex, bey], w1 + 1.3, 0.8, wood); tips.push({ x: bex, y: bey, r: (stage >= 5 ? 8 : 6.5) }); });
    tips.forEach(function (tp) { s += foliage(tp.x, tp.y, tp.r, p.col, stage >= 5); });
    return s;
  }
  function trunkSVG(gl) {
    var g = gl / 30, cx = 160, baseY = 330, topY = 182, wb = 10 + g * 6, wt = 3.5 + g * 2.2;
    var p0 = [cx, baseY], cp = [cx - (2 + g * 3), (baseY + topY) / 2], p1 = [cx, topY];
    var s = taperedBranch(p0, cp, p1, wb * 2, wt * 2, 'url(#awkBark)');
    s += taperedBranch([cx - wb * 0.55, baseY], [cx - (2 + g * 3) - wb * 0.42, (baseY + topY) / 2], [cx - wt * 0.5, topY], wb * 0.5, wt * 0.5, '#6d5c47');
    s += taperedBranch([cx + wb * 0.62, baseY], [cx - (2 + g * 3) + wb * 0.7, (baseY + topY) / 2], [cx + wt * 0.55, topY], wb * 0.42, wt * 0.4, '#160f09');
    s += '<path d="M' + (cx - wb * 0.9) + ' ' + baseY + ' q-15 3 -28 11" stroke="#3a2f24" stroke-width="4.5" fill="none" stroke-linecap="round"/>';
    s += '<path d="M' + (cx + wb * 0.9) + ' ' + baseY + ' q15 3 28 11" stroke="#241b13" stroke-width="4.5" fill="none" stroke-linecap="round"/>';
    return s;
  }
  function seedSVG() {
    return '<g><ellipse cx="160" cy="326" rx="10" ry="6" fill="#3a2f24"/><circle cx="160" cy="321" r="6" fill="#39FF14" filter="url(#awkGlow)" opacity="0.9"/><circle cx="158.6" cy="319.6" r="2.4" fill="#eafff0"/><text x="160" y="300" text-anchor="middle" fill="#94a3b8" font-size="9">graine d\'éveil</text></g>';
  }
  function treeSVG(counts) {
    var stages = Q.map(function (q) { return stageOf(counts[q.id]); });
    var gl = stages.reduce(function (a, b) { return a + b; }, 0);
    var any = stages.some(function (s) { return s > 0; });
    var defs = '<defs>'
      + '<linearGradient id="awkBark" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#5d4f3e"/><stop offset="42%" stop-color="#3c3024"/><stop offset="100%" stop-color="#1b140d"/></linearGradient>'
      + '<radialGradient id="awkGround" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#050705" stop-opacity="0.85"/><stop offset="70%" stop-color="#050705" stop-opacity="0.55"/><stop offset="100%" stop-color="#050705" stop-opacity="0"/></radialGradient>'
      + '<filter id="awkGlow" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="2.4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>'
      + '</defs>';
    var body = defs + '<ellipse cx="160" cy="335" rx="126" ry="15" fill="url(#awkGround)"/>';
    if (!any) { body += seedSVG(); }
    else { body += trunkSVG(gl); [0, 5, 1, 4, 2, 3].forEach(function (i) { body += branchSVG(Q[i], stages[i]); }); }
    return { svg: '<svg viewBox="0 0 320 360" preserveAspectRatio="xMidYMid meet" style="display:block;width:100%;height:auto;" aria-hidden="true">' + body + '</svg>', stages: stages, gl: gl, any: any };
  }

  // ── Overlay ──
  function showAwakeningTree() {
    try {
      var old = document.getElementById('awakeningTreeOverlay'); if (old) old.remove();
      var counts = awakComputeQualities();
      var t = treeSVG(counts);
      var A = awakArchetype(counts);
      var ri = Math.min(5, Math.floor(t.gl / 5));

      var legend = Q.map(function (p, i) {
        var st = t.stages[i], pct = Math.round(st / 5 * 100);
        return '<div style="display:flex;align-items:center;gap:7px;background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.08);border-radius:11px;padding:7px 9px;">'
          + '<span style="font-size:0.95em;">' + p.ic + '</span>'
          + '<span style="font-size:0.7em;font-weight:700;flex:1;color:#e2e8f0;">' + p.nm + '</span>'
          + '<span style="font-size:0.56em;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;color:' + p.col + ';">' + STAGE_NAMES[st] + '</span>'
          + '</div>';
      }).join('');

      var overlay = document.createElement('div');
      overlay.id = 'awakeningTreeOverlay';
      overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.72);display:flex;align-items:flex-end;justify-content:center;backdrop-filter:blur(3px);';
      overlay.addEventListener('click', function (e) { if (e.target === overlay) overlay.remove(); });

      var sheet = document.createElement('div');
      sheet.style.cssText = 'background:#0D0D0D;border-radius:20px 20px 0 0;padding:20px 16px calc(20px + env(safe-area-inset-bottom));width:100%;max-width:480px;max-height:90vh;overflow-y:auto;-webkit-overflow-scrolling:touch;border-top:2px solid rgba(57,255,20,0.3);';
      sheet.innerHTML =
        '<div style="width:36px;height:4px;background:rgba(255,255,255,0.2);border-radius:99px;margin:0 auto 14px;"></div>'
        + '<div style="text-align:center;font-size:0.6em;letter-spacing:3px;text-transform:uppercase;color:#94a3b8;font-weight:800;">Awakened · Arbre de l\'Éveil</div>'
        + '<div style="text-align:center;margin:6px 0 4px;">'
        + '<div style="font-size:1.6em;line-height:1.1;font-weight:900;background:linear-gradient(180deg,#eafff0,#8fe0ff);-webkit-background-clip:text;background-clip:text;color:transparent;">' + A.name + '</div>'
        + '<div style="font-size:0.62em;color:#94a3b8;margin-top:3px;text-transform:uppercase;letter-spacing:1.5px;font-weight:700;">' + A.sub + '</div>'
        + '</div>'
        + '<div style="display:flex;align-items:center;justify-content:center;gap:10px;margin:8px 0 2px;">'
        + '<div style="width:32px;height:32px;border-radius:10px;display:grid;place-items:center;font-size:1em;font-weight:900;border:1px solid ' + RANK_COL[ri] + '66;background:rgba(255,255,255,0.03);color:' + RANK_COL[ri] + ';box-shadow:0 0 14px ' + RANK_COL[ri] + '33;">' + RANKS[ri] + '</div>'
        + '<div style="width:150px;height:7px;border-radius:6px;background:rgba(255,255,255,0.07);overflow:hidden;"><div style="height:100%;width:' + Math.round(t.gl / 30 * 100) + '%;background:linear-gradient(90deg,#22c55e,#22d3ee,#fbbf24);"></div></div>'
        + '<small style="font-size:0.58em;color:#94a3b8;letter-spacing:1px;text-transform:uppercase;font-weight:700;">Rang ' + RANKS[ri] + '</small>'
        + '</div>'
        + '<div style="margin:4px 0;border-radius:18px;overflow:hidden;background:radial-gradient(80% 55% at 50% 34%,rgba(34,197,94,0.05),transparent 70%);">' + t.svg + '</div>'
        + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin:6px 0 10px;">' + legend + '</div>'
        + '<div style="font-size:0.62em;color:#64748b;text-align:center;line-height:1.5;margin-bottom:12px;">Ton arbre grandit avec tes séances réelles — chaque entraînement nourrit les qualités qu\'il travaille. Aucune branche ne rétrécit jamais.</div>'
        + '<button id="awkCloseBtn" style="width:100%;padding:13px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);border-radius:14px;color:rgba(255,255,255,0.6);font-weight:700;cursor:pointer;">Fermer</button>';
      overlay.appendChild(sheet);
      document.body.appendChild(overlay);
      var btn = document.getElementById('awkCloseBtn');
      if (btn) btn.addEventListener('click', function () { overlay.remove(); });
    } catch (e) {
      if (typeof showNotification === 'function') showNotification("Arbre de l'Éveil indisponible pour le moment.", 'error');
    }
  }

  // Exports
  window.showAwakeningTree = showAwakeningTree;
  window.awakComputeQualities = awakComputeQualities;
  window.awakArchetype = awakArchetype;
})();
