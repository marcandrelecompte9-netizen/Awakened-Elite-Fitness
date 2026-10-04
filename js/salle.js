/* ═══════════════════════════════════════════════════════════════════
   SÉANCE › PROGRAMME › SALLE (v1255)
   ─────────────────────────────────────────────────────────────────────
   A. Aperçu de chaque séance (exercices, machine, séries × reps) et liste
      du matériel nécessaire par programme.
   B. Plus de programmes : Machines seulement, Fessiers & jambes, Circuit
      machines 30 min, Force 5×5 ; Haut / Bas complété (jours B).
   C. Prescription selon l'exercice : gros mouvements à la barre lourds et
      longs repos, isolation sur machine plus de reps et repos courts.
   D. Adapté à la salle : une machine absente du lieu est remplacée par un
      équivalent (même muscle) ; bandeau si le lieu actif est « Maison ».
   E. Suivi : « Prochaine séance » d'après l'historique.
   gymPrograms (app.js, const globale) reste la source des séances : on le
   complète ici, et startGymDay / _renderSallePrograms nous délèguent.
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  function ic(n, t, c) { try { return window.AwakIcon ? AwakIcon.get(n, t || 16, c) : ''; } catch (e) { return ''; } }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function nom(n) { try { return typeof window.awakNom === 'function' ? window.awakNom(n) : n; } catch (e) { return n; } }
  function db(n) { var L = window.exerciseDatabase || []; for (var i = 0; i < L.length; i++) if (L[i] && L[i].name === n) return L[i]; return null; }
  function GP() { try { return (typeof gymPrograms !== 'undefined') ? gymPrograms : null; } catch (e) { return null; } }

  // ── B. Programmes ajoutés ────────────────────────────────────────────
  var AJOUTS = {
    upper_lower: {
      upper_b: { name: 'Haut du corps B — Volume', exercises: ['Développé incliné barre', 'Seated Row machine', 'Shoulder Press machine', 'Lat Pulldown prise large', 'Cable Fly bas vers haut', 'Face Pull câble', 'Cable Hammer Curl', 'Tricep Pushdown corde'] },
      lower_b: { name: 'Bas du corps B — Ischios & fessiers', exercises: ['Romanian Deadlift barre', 'Hip Thrust Smith machine', 'Leg Curl assis', 'Lunges Smith machine', 'Leg Extension', 'Calf raise machine assise'] }
    },
    machines: {
      a: { name: 'Machines A', exercises: ['Leg Press 45°', 'Chest Press machine', 'Seated Row machine', 'Shoulder Press machine', 'Leg Curl assis', 'Cable Crunch à genoux'] },
      b: { name: 'Machines B', exercises: ['Squat Smith machine', 'Lat Pulldown prise large', 'Pec Deck (Butterfly)', 'Leg Extension', 'Rear Delt machine', 'Bicep Curl machine', 'Tricep Pushdown câble'] }
    },
    fessiers: {
      a: { name: 'Fessiers & jambes A', exercises: ['Hip Thrust Smith machine', 'Squat Smith machine', 'Hip Abduction machine', 'Leg Curl couché', 'Glute Kickback machine', 'Calf raise machine assise'] },
      b: { name: 'Fessiers & jambes B', exercises: ['Romanian Deadlift barre', 'Leg Press 45°', 'Lunges Smith machine', 'Cable Pull Through', 'Hip Adduction machine', 'Mollets debout machine'] }
    },
    circuit: {
      tour: { name: 'Circuit machines', exercises: ['Leg Press 45°', 'Chest Press machine', 'Lat Pulldown prise large', 'Shoulder Press machine', 'Leg Curl assis', 'Seated Row machine', 'Cable Crunch à genoux'] }
    },
    force: {
      a: { name: 'Force A — Squat · Développé couché · Rowing', exercises: ['Squat barre haut', 'Développé couché barre', 'Barbell Row'] },
      b: { name: 'Force B — Squat · Développé militaire · Soulevé', exercises: ['Squat barre haut', 'Overhead Press barre', 'Soulevé de terre'] }
    }
  };
  function completer() {
    var g = GP(); if (!g) return;
    Object.keys(AJOUTS).forEach(function (p) {
      g[p] = g[p] || {};
      Object.keys(AJOUTS[p]).forEach(function (j) { if (!g[p][j]) g[p][j] = AJOUTS[p][j]; });
    });
  }

  // Ordre d'affichage + description
  var PROGS = [
    { id: 'machines',      name: 'Machines seulement',       en: 'Machines only',      schema: '2 à 3 jours / semaine · ~40 min', niveau: 'Débutant',      accent: '#60a8f0', reco: true,
      intro: 'Tout sur machines guidées : on apprend les mouvements sans barre libre.' },
    { id: 'full_body_gym', name: 'Corps entier',             en: 'Full Body',          schema: '3 jours / semaine · ~45 min',     niveau: 'Débutant',      accent: '#fbbf24' },
    { id: 'upper_lower',   name: 'Haut / Bas du corps',      en: 'Upper / Lower',      schema: '4 jours / semaine · ~50 min',     niveau: 'Intermédiaire', accent: '#22d3ee',
      intro: 'Alterne Haut A, Bas A, Haut B, Bas B.' },
    { id: 'fessiers',      name: 'Fessiers & jambes',        en: 'Glutes & Legs',      schema: '2 jours / semaine · ~45 min',     niveau: 'Tous niveaux',  accent: '#f472b6' },
    { id: 'circuit',       name: 'Circuit machines 30 min',  en: 'Machine circuit',    schema: '2 à 3 jours / semaine · 30 min',  niveau: 'Tous niveaux',  accent: '#34d399',
      intro: 'Peu de repos, le cœur monte : idéal quand tu manques de temps.' },
    { id: 'force',         name: 'Force 5×5',                en: 'Strength 5×5',       schema: '3 jours / semaine · ~50 min',     niveau: 'Intermédiaire', accent: '#f59e0b',
      intro: 'Trois gros mouvements, 5 séries de 5, charge qui monte chaque semaine. Alterne A et B.' },
    { id: 'ppl',           name: 'Pousser / Tirer / Jambes', en: 'Push / Pull / Legs', schema: '6 jours / semaine · ~55 min',     niveau: 'Avancé',        accent: '#a78bfa' }
  ];
  function jourFr(n) {
    return String(n || '').replace(/^[^A-Za-zÀ-ÿ]+/, '')
      .replace(/^Push Day/i, 'Pousser').replace(/^Pull Day/i, 'Tirer').replace(/^Leg Day/i, 'Jambes')
      .replace(/^Upper A/i, 'Haut du corps A').replace(/^Lower A/i, 'Bas du corps A')
      .replace(/Quad Focus/i, 'cuisses').replace(/Force$/i, 'Force').replace(/^Full Body Gym/i, 'Corps entier');
  }

  // ── C. Prescription ──────────────────────────────────────────────────
  var RX_LOURD = /squat|développé|bench|press|row|deadlift|soulevé|hip thrust|rack pull|clean/i;
  function prescription(ex, progId) {
    var eq = ex.equipment || [], n = ex.name || '', m = ex.muscle || '';
    var barre = eq.indexOf('Barre') >= 0, machine = eq.indexOf('Machine') >= 0;
    if (progId === 'force' && barre) return { sets: 5, reps: 5, repos: 180, txt: '5 × 5', type: 'Force' };
    if (progId === 'circuit') return { sets: 3, reps: 12, repos: 30, txt: '3 × 12', type: 'Circuit', entre: 30 };
    if (/Mollets|Abdominaux|Obliques|Avant-bras/.test(m)) return { sets: 3, reps: 15, repos: 60, txt: '3 × 12-15', type: 'Finition' };
    if (barre && RX_LOURD.test(n)) return { sets: 4, reps: 8, repos: 150, txt: '4 × 6-8', type: 'Lourd' };
    if (machine && /press|presse|row|tirage|pulldown|squat|lunges|hack|thrust/i.test(n)) return { sets: 3, reps: 10, repos: 105, txt: '3 × 8-10', type: 'Composé' };
    return { sets: 3, reps: 12, repos: 75, txt: '3 × 10-12', type: 'Isolation' };
  }

  // ── D. Disponibilité et remplacement ─────────────────────────────────
  function equipDispo() { try { return typeof getSelectedEquipmentNames === 'function' ? getSelectedEquipmentNames() : []; } catch (e) { return []; } }
  function machinesDispo() { try { return (typeof selectedMachines !== 'undefined' && Array.isArray(selectedMachines)) ? selectedMachines : null; } catch (e) { return null; } }
  function typeMachine(n) {
    try {
      if (typeof machineTypes === 'undefined') return null;
      for (var i = 0; i < machineTypes.length; i++) if ((machineTypes[i].exercises || []).indexOf(n) >= 0) return machineTypes[i];
    } catch (e) {}
    return null;
  }
  function salleBondeeBloque(ex) {
    try {
      if (typeof busyGymMode === 'undefined' || !busyGymMode || !busyGymEquipment || !busyGymEquipment.length) return false;
      return !(ex.equipment || []).some(function (e) {
        var q = (typeof availableEquipment !== 'undefined') ? availableEquipment.filter(function (a) { return a.dbName === e; })[0] : null;
        return q && busyGymEquipment.indexOf(q.id) >= 0;
      });
    } catch (e) { return false; }
  }
  function dispo(ex, eq) {
    if (!ex) return false;
    eq = eq || equipDispo();
    var ok = (typeof window.awakEquipmentOk === 'function') ? window.awakEquipmentOk(ex, eq)
      : (ex.equipment || []).every(function (q) { return q === 'Poids du corps' || eq.indexOf(q) >= 0; });
    if (!ok) return false;
    if ((ex.equipment || []).indexOf('Machine') >= 0) {
      var t = typeMachine(ex.name), M = machinesDispo();
      if (t && M && M.indexOf(t.id) < 0) return false;
    }
    if (salleBondeeBloque(ex)) return false;
    return true;
  }
  function remplacant(ex, deja, eq) {
    var L = (window.exerciseDatabase || []).filter(function (e) {
      return e && e.type === 'exercise' && !e.discipline && e.muscle === ex.muscle && deja.indexOf(e.name) < 0 && dispo(e, eq);
    });
    try { if (window.AwakPain && typeof AwakPain.filterExercises === 'function') L = AwakPain.filterExercises(L); } catch (e) {}
    if (!L.length) return null;
    var rang = function (e) {
      var q = e.equipment || [], s = 0;
      if (q.indexOf('Machine') >= 0) s += 3; else if (q.indexOf('Barre') >= 0 || q.indexOf('Haltères') >= 0) s += 2; else s += 1;
      if (e.difficulty === ex.difficulty) s += 1;
      if (e.difficulty === 'Avancé' && ex.difficulty !== 'Avancé') s -= 2;
      return s;
    };
    L.sort(function (a, b) { return rang(b) - rang(a); });
    return L[0];
  }
  // Liste finale d'une séance : [{ ex, rx, remplace }]
  function composer(progId, dayKey) {
    var g = GP(), day = g && g[progId] && g[progId][dayKey];
    if (!day) return [];
    var eq = equipDispo(), deja = [], out = [];
    (day.exercises || []).forEach(function (n) {
      var e = db(n); if (!e) return;
      var r = null;
      if (!dispo(e, eq)) { r = e; e = remplacant(e, deja.concat(day.exercises), eq); }
      if (!e) { out.push({ ex: db(n), rx: prescription(db(n), progId), manque: true }); return; }
      deja.push(e.name);
      out.push({ ex: e, rx: prescription(e, progId), remplace: r });
    });
    return out;
  }

  function lieuActif() { try { return typeof getActiveLocation === 'function' ? getActiveLocation() : null; } catch (e) { return null; } }
  function lieuGym() {
    try { var L = typeof getLocationProfiles === 'function' ? getLocationProfiles() : []; return L.filter(function (l) { return l.mode === 'gym'; })[0] || null; } catch (e) { return null; }
  }

  // ── Lancer une séance ────────────────────────────────────────────────
  function lancer(progId, dayKey) {
    completer();
    var g = GP(), day = g && g[progId] && g[progId][dayKey];
    if (!day) return;
    var L = composer(progId, dayKey).filter(function (x) { return !x.manque; });
    if (!L.length) {
      if (typeof window.showToast === 'function') window.showToast('Aucun exercice possible avec le matériel de ce lieu', 'warning', 3500);
      return;
    }
    var exercices = [], entre = 90;
    L.forEach(function (x, i) {
      exercices.push(Object.assign({}, x.ex, {
        _baseName: x.ex.name, mode: 'reps', sets: x.rx.sets, plannedSets: x.rx.sets, reps: x.rx.reps,
        repos: x.rx.repos, recoRest: x.rx.repos, duration: 60, _rx: x.rx.txt,
        _remplace: x.remplace ? x.remplace.name : undefined
      }));
      if (i < L.length - 1) exercices.push({ name: 'Repos', duration: x.rx.entre || entre, isRest: true, mode: 'timer' });
    });
    var w = {
      name: jourFr(day.name), mode: 'reps', isGym: true, type: 'salle',
      restBetweenSets: (progId === 'circuit') ? 30 : 90,
      exercises: exercices, _salleProg: progId, _salleJour: dayKey,
      badgeHTML: 'Salle', badgeStyle: 'linear-gradient(135deg,#22d3ee,#0891b2)'
    };
    var rp = L.filter(function (x) { return x.remplace; });
    if (rp.length && typeof window.showToast === 'function') {
      setTimeout(function () { window.showToast(rp.length + ' machine' + (rp.length > 1 ? 's' : '') + ' absente' + (rp.length > 1 ? 's' : '') + ' de ton lieu : remplacée' + (rp.length > 1 ? 's' : '') + ' par un équivalent', 'info', 4000); }, 700);
    }
    if (typeof window.showWorkoutPreparation === 'function') window.showWorkoutPreparation(w);
  }

  // ── E. Prochaine séance ──────────────────────────────────────────────
  function derniereSalle() {
    try {
      var H = typeof getWorkoutHistory === 'function' ? getWorkoutHistory() : [];
      for (var i = 0; i < H.length; i++) {
        var w = H[i] && H[i].workoutData;
        if (w && w._salleProg && w._salleJour) return { prog: w._salleProg, jour: w._salleJour, date: H[i].date };
      }
    } catch (e) {}
    return null;
  }
  function prochaine() {
    var d = derniereSalle(), g = GP();
    if (!d || !g || !g[d.prog]) return null;
    var cles = Object.keys(g[d.prog]), i = cles.indexOf(d.jour);
    var j = cles[(i + 1) % cles.length];
    return { prog: d.prog, jour: j, date: d.date };
  }

  // ── A. Rendu ─────────────────────────────────────────────────────────
  var _ouvert = null;     // jour dont l'aperçu est déplié : 'prog/jour'
  // v1275 : les programmes sont repliés (nom, niveau, fréquence) ; on en déplie UN à la fois.
  // Avant : 7 programmes et 17 séances dépliés d'un coup, 2,5 écrans à faire défiler.
  var _progOuvert = null;
  function redessiner() { if (typeof window.renderProgramTab === 'function') window.renderProgramTab(); }
  function basculer(cle) {
    _ouvert = (_ouvert === cle) ? null : cle;
    if (_ouvert) _progOuvert = _ouvert.split('/')[0];
    redessiner();
  }
  function ouvrirProg(id) { _progOuvert = (_progOuvert === id) ? null : id; _ouvert = null; redessiner(); }

  function materiel(progId) {
    var g = GP(), p = g && g[progId]; if (!p) return '';
    var types = {}, barre = false, banc = false, autres = 0;
    Object.keys(p).forEach(function (k) {
      (p[k].exercises || []).forEach(function (n) {
        var e = db(n); if (!e) return; var q = e.equipment || [];
        if (q.indexOf('Barre') >= 0) barre = true;
        if (q.indexOf('Banc') >= 0 || /couché|incliné|bench/i.test(n)) banc = true;
        if (q.indexOf('Machine') >= 0) { var t = typeMachine(n); if (t) types[t.name] = 1; else autres++; }
      });
    });
    var L = [];
    if (barre) L.push('Barre');
    if (banc) L.push('Banc');
    Object.keys(types).forEach(function (t) { L.push(t); });
    if (autres) L.push('Smith / machines guidées');
    return L.join(' · ');
  }

  function apercu(progId, dayKey, a) {
    var L = composer(progId, dayKey);
    var lignes = L.map(function (x) {
      var e = x.ex, q = e.equipment || [];
      var tag = q.indexOf('Machine') >= 0 ? ((typeMachine(e.name) || {}).name || 'Machine') : (q.indexOf('Barre') >= 0 ? 'Barre' : (q.indexOf('Haltères') >= 0 ? 'Haltères' : 'Poids du corps'));
      return '<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.05);' + (x.manque ? 'opacity:0.45;' : '') + '">'
        + '<span style="flex:1;min-width:0;">'
        +   '<span style="display:block;font-size:0.76em;color:#e2e8f0;font-weight:700;">' + esc(nom(e.name)) + '</span>'
        +   '<span style="display:block;font-size:0.62em;color:#94a3b8;">' + esc(tag)
        +     (x.remplace ? ' · <span style="color:#fbbf24;">remplace ' + esc(nom(x.remplace.name)) + '</span>' : '')
        +     (x.manque ? ' · <span style="color:#f87171;">pas disponible ici</span>' : '') + '</span>'
        + '</span>'
        + '<span style="flex-shrink:0;font-size:0.72em;font-weight:800;color:' + a + ';">' + x.rx.txt + '</span>'
        + '<span style="flex-shrink:0;font-size:0.6em;color:#64748b;width:44px;text-align:right;">' + Math.round(x.rx.repos / 15) * 15 + ' s</span>'
        + '</div>';
    }).join('');
    return '<div style="margin:2px 0 8px;padding:6px 12px 10px;border-radius:12px;background:rgba(255,255,255,0.025);border:1px solid ' + a + '33;">'
      + '<div style="display:flex;justify-content:space-between;font-size:0.56em;color:#64748b;font-weight:800;letter-spacing:1px;padding:4px 0;"><span>EXERCICE</span><span>SÉRIES · REPOS</span></div>'
      + lignes
      + '<button onclick="startGymDay(\'' + progId + '\',\'' + dayKey + '\')" style="margin-top:10px;width:100%;padding:11px;border:none;border-radius:11px;cursor:pointer;font-weight:900;font-size:0.84em;background:' + a + ';color:#0b1220;display:flex;align-items:center;justify-content:center;gap:7px;">' + ic('eclair', 15, '#0b1220') + 'Lancer cette séance</button>'
      + '</div>';
  }

  function rendre() {
    completer();
    var g = GP() || {};
    var y = window.AwakYouth, ado = !!(y && y.isYoung && y.isYoung() && !(y.isChild && y.isChild()));
    var lieu = lieuActif(), gym = lieuGym();
    var bandeauLieu = (lieu && lieu.mode !== 'gym')
      ? '<div style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:12px;background:rgba(251,191,36,0.08);border:1px solid rgba(251,191,36,0.3);">'
        + ic('alerte', 18, '#fbbf24')
        + '<div style="flex:1;min-width:0;font-size:0.72em;color:#fde68a;line-height:1.4;">Tu es en mode <b>' + esc(lieu.name) + '</b> : les machines seront remplacées par ce que tu as.</div>'
        + (gym ? '<button onclick="switchLocation(\'' + gym.id + '\'); renderProgramTab();" style="flex-shrink:0;padding:8px 10px;border-radius:10px;border:none;cursor:pointer;background:#fbbf24;color:#1f1300;font-weight:900;font-size:0.72em;">Passer à ' + esc(gym.name) + '</button>' : '')
        + '</div>'
      : '';
    var nx = prochaine(), prochHTML = '';
    if (nx && g[nx.prog] && g[nx.prog][nx.jour]) {
      var P = PROGS.filter(function (p) { return p.id === nx.prog; })[0] || { name: nx.prog, accent: '#60a8f0' };
      prochHTML = '<div style="padding:12px 14px;border-radius:14px;background:linear-gradient(135deg,' + P.accent + '22,' + P.accent + '08);border:1px solid ' + P.accent + '55;">'
        + '<div style="font-size:0.58em;color:' + P.accent + ';font-weight:900;letter-spacing:1.5px;margin-bottom:4px;">PROCHAINE SÉANCE</div>'
        + '<div style="display:flex;align-items:center;gap:10px;">'
        +   '<div style="flex:1;min-width:0;"><div style="font-weight:900;color:#fff;font-size:0.95em;">' + esc(jourFr(g[nx.prog][nx.jour].name)) + '</div>'
        +   '<div style="font-size:0.66em;color:#94a3b8;margin-top:1px;">' + esc(P.name) + ' · suite de ta dernière séance</div></div>'
        +   '<button onclick="startGymDay(\'' + nx.prog + '\',\'' + nx.jour + '\')" style="flex-shrink:0;padding:10px 14px;border:none;border-radius:11px;cursor:pointer;background:' + P.accent + ';color:#0b1220;font-weight:900;font-size:0.78em;">Lancer</button>'
        + '</div></div>';
    }
    var cartes = PROGS.map(function (p) {
      var prog = g[p.id]; if (!prog) return '';
      var a = p.accent, cles = Object.keys(prog);
      var enCours = nx && nx.prog === p.id;
      var jours = cles.map(function (k) {
        var day = prog[k], cle = p.id + '/' + k, ouvert = _ouvert === cle;
        var L = composer(p.id, k);
        var nM = L.filter(function (x) { return (x.ex.equipment || []).indexOf('Machine') >= 0; }).length;
        var nR = L.filter(function (x) { return x.remplace; }).length;
        return '<button onclick="AwakSalle.basculer(\'' + cle + '\')" style="display:flex;align-items:center;gap:10px;width:100%;text-align:left;margin-top:8px;padding:10px 12px;border-radius:12px;cursor:pointer;font-family:inherit;'
          + 'background:' + (ouvert ? a + '14' : 'rgba(255,255,255,0.04)') + ';border:1px solid ' + (ouvert ? a + '66' : 'rgba(255,255,255,0.08)') + ';">'
          + '<span style="flex:1;min-width:0;">'
          +   '<span style="display:block;font-size:0.82em;font-weight:800;color:#e2e8f0;">' + esc(jourFr(day.name)) + (enCours && nx.jour === k ? ' <span style="font-size:0.75em;color:' + a + ';">· prochaine</span>' : '') + '</span>'
          +   '<span style="display:block;font-size:0.64em;color:#94a3b8;margin-top:2px;">' + L.length + ' exercices' + (nM ? ' · ' + nM + ' sur machine' : '') + (nR ? ' · <span style="color:#fbbf24;">' + nR + ' remplacé' + (nR > 1 ? 's' : '') + '</span>' : '') + '</span>'
          + '</span>'
          + '<span style="flex-shrink:0;color:' + a + ';font-size:1.1em;transform:rotate(' + (ouvert ? '90' : '0') + 'deg);transition:transform .2s;">›</span>'
          + '</button>'
          + (ouvert ? apercu(p.id, k, a) : '');
      }).join('');
      var mat = materiel(p.id), deplie = _progOuvert === p.id;
      return '<div class="card" style="background:rgba(255,255,255,0.025);border:1px solid ' + (deplie ? a + '55' : 'rgba(255,255,255,0.08)') + ';border-left:3px solid ' + a + ';border-radius:16px;padding:12px 14px;margin-bottom:0;">'
        + '<button onclick="AwakSalle.ouvrirProg(\'' + p.id + '\')" aria-expanded="' + deplie + '" style="display:flex;align-items:center;gap:11px;width:100%;text-align:left;background:none !important;border:none;padding:0 !important;min-height:auto !important;cursor:pointer;font-family:inherit;">'
        +   '<span style="flex-shrink:0;width:38px;height:38px;border-radius:11px;background:' + a + '1a;border:1px solid ' + a + '44;display:grid;place-items:center;">' + ic('halter', 20, a) + '</span>'
        +   '<span style="flex:1;min-width:0;">'
        +     '<span style="display:block;font-weight:900;color:#fff;font-size:0.98em;">' + esc(p.name)
        +       (p.reco ? ' <span style="font-size:0.6em;font-weight:800;color:#0b1220;background:' + a + ';border-radius:99px;padding:2px 8px;vertical-align:2px;">Idéal pour commencer</span>' : '') + '</span>'
        +     '<span style="display:block;font-size:0.72em;color:' + a + ';font-weight:700;margin-top:3px;">' + esc(p.niveau) + ' · ' + esc(p.schema) + '</span>'
        +   '</span>'
        +   '<span style="flex-shrink:0;color:#94a3b8;font-size:1.2em;transform:rotate(' + (deplie ? '90' : '0') + 'deg);transition:transform .2s;">›</span>'
        + '</button>'
        + (deplie
          ? (p.intro ? '<div style="font-size:0.76em;color:#b4c0cf;margin-top:10px;line-height:1.45;">' + esc(p.intro) + '</div>' : '')
            + (mat ? '<div style="display:flex;gap:6px;align-items:flex-start;font-size:0.7em;color:#cbd5e1;margin-top:8px;line-height:1.4;">' + ic('gym', 13, '#94a3b8') + '<span><b style="color:#a3b1c2;">Matériel :</b> ' + esc(mat) + '</span></div>' : '')
            + jours
          : '')
        + '</div>';
    }).join('');
    return '<div style="display:grid;gap:10px;">'
      + '<div style="font-size:0.6em;color:#64748b;font-weight:900;letter-spacing:2px;margin-bottom:2px;">PROGRAMMES EN SALLE</div>'
      + '<div style="font-size:0.76em;color:#b4c0cf;margin:-4px 0 4px;line-height:1.4;">Touche un programme pour voir ses séances.</div>'
      + (ado ? '<div style="font-size:0.76em;color:#fcd34d;background:rgba(251,191,36,0.08);border:1px solid rgba(251,191,36,0.3);border-radius:11px;padding:10px 12px;line-height:1.45;">Ces séances utilisent des charges : fais-les avec un adulte qui connaît les mouvements.</div>' : '')
      + bandeauLieu + prochHTML + cartes + '</div>';
  }

  completer();
  window.AwakSalle = { rendre: rendre, lancer: lancer, basculer: basculer, ouvrirProg: ouvrirProg, composer: composer, prescription: prescription, prochaine: prochaine, PROGS: PROGS };
})();
