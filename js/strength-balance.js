/* ═══════════════════════════════════════════════════════════════════════
   ÉQUILIBRE DE FORCE — Awakened  (v2 · par muscle)
   -----------------------------------------------------------------------
   Compare les charges de la personne entre elles, MUSCLE PAR MUSCLE, et
   signale les groupes en retard.

   MÉTHODE
   1. Chaque exercice de l'historique est rattaché à un MOUVEMENT de
      référence (couché, rowing, squat…) et à un OUTIL détecté :
        barre · haltères (charge PAR HALTÈRE) · machine/poulie · poids du corps.
      Chaque outil a son propre ratio : 30 kg par haltère au couché ne se
      compare pas à 30 kg à la barre. Un outil sans ratio = non comparable
      (ex. farmer walk), l'exercice est ignoré.
   2. 1RM estimé (Epley) sur la meilleure série des 90 DERNIERS JOURS
      (repli sur tout l'historique si trop peu de données).
      Poids du corps (tractions, dips) : charge = poids du corps + lest.
   3. Chaque 1RM → « équivalent développé couché » (1RM ÷ ratio).
   4. Score d'un MUSCLE = moyenne pondérée de ses mouvements
      (polyarticulaires ×1, isolation ×0,5).
   5. Référence = MÉDIANE des muscles (un muscle avec 6 exercices ne pèse
      pas plus qu'un muscle avec 1).
   6. Paires antagonistes, niveau selon le poids du corps, suivi mensuel,
      et mode « Corriger mes retards » branché sur la séance intelligente.

   ⚠️ LIMITES ASSUMÉES, affichées : ratios = repères (morphologie), les
      machines varient d'une marque à l'autre, > 12 reps = écarté.
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  // Ratios = 1RM attendu ÷ 1RM développé couché barre.
  // b = barre · h = PAR haltère · m = machine/poulie · p = poids du corps (charge totale)
  // poly = polyarticulaire (poids ×1 dans la moyenne du muscle, sinon ×0,5)
  var LIFTS = [
    // ── PECTORAUX ──
    { id: 'bench', nom: 'Développé couché', muscle: 'Pectoraux', poly: 1,
      r: { b: 1.00, h: 0.40, m: 1.00 },
      re: /^(?!.*(incline|decline|close.?grip|serre|triceps)).*(developpe couche|bench press|chest press|developpe pectoraux)/ },
    { id: 'decline', nom: 'Développé décliné', muscle: 'Pectoraux', poly: 1,
      r: { b: 1.05, h: 0.42, m: 1.05 },
      re: /developpe decline|decline (bench|chest)/ },
    { id: 'incline', nom: 'Développé incliné', muscle: 'Pectoraux', poly: 1,
      r: { b: 0.82, h: 0.34, m: 0.85 },
      re: /developpe incline|incline (bench|chest)|chest press incline/ },
    { id: 'dipspec', nom: 'Dips (pectoraux)', muscle: 'Pectoraux', poly: 1,
      r: { p: 1.35 },
      re: /^dips (pectoraux|sur barres)|parallel.?bar.?dip/ },
    { id: 'fly', nom: 'Écarté', muscle: 'Pectoraux', poly: 0,
      r: { h: 0.16, m: 0.45 },
      re: /ecarte|(^|[^a-z])fly|pec deck|butterfly|crossover/ },

    // ── DOS ──
    { id: 'deadlift', nom: 'Soulevé de terre', muscle: 'Dos', poly: 1,
      r: { b: 1.50 },
      re: /^souleve de terre$|^deadlift$|sumo deadlift|conventional deadlift|souleve de terre (barre|sumo)/ },
    { id: 'row', nom: 'Rowing', muscle: 'Dos', poly: 1,
      r: { b: 0.90, h: 0.45, m: 0.85 },
      re: /^(?!.*rameur)(rowing(?! australien| elastique| kb| renegade)|barbell row|bent.?over row|t.?bar row|row machine|seated row|low cable row|tirage (horizontal|poulie basse))/ },
    { id: 'vertical', nom: 'Tirage vertical', muscle: 'Dos', poly: 1,
      r: { m: 0.80 },
      re: /tirage vertical|pulldown(?!.*straight)|tirage (nuque|poitrine|dos poulie haute|unilateral)/ },
    { id: 'pullup', nom: 'Tractions', muscle: 'Dos', poly: 1,
      r: { p: 1.05 },
      re: /^(tractions?|pull.?up|chin.?up)(?!.*(negative|scapula|commando|australien|towel|assist))/ },

    // ── ÉPAULES ──
    { id: 'ohp', nom: 'Développé militaire', muscle: 'Épaules', poly: 1, zone: 'avant',
      r: { b: 0.65, h: 0.27, m: 0.70 },
      re: /developpe (militaire|epaules|arnold)|overhead press(?! elastique)|shoulder press|presse epaules?/ },
    { id: 'latraise', nom: 'Élévations latérales', muscle: 'Épaules', poly: 0,
      r: { h: 0.11, m: 0.10 },
      re: /elevations? laterales?|lateral raise/ },
    { id: 'frontraise', nom: 'Élévations frontales', muscle: 'Épaules', poly: 0, zone: 'avant',
      r: { h: 0.11, m: 0.12 },
      re: /elevations? frontales?|front raise/ },
    { id: 'reardelt', nom: 'Oiseau / face pull', muscle: 'Épaules', poly: 0, zone: 'arriere',
      r: { h: 0.09, m: 0.33 },
      re: /oiseau|rear delt|face pull(?!.*trapeze)|reverse fly/ },
    { id: 'upright', nom: 'Tirage menton', muscle: 'Épaules', poly: 1,
      r: { b: 0.45, h: 0.18, m: 0.40 },
      re: /tirage menton|upright row/ },

    // ── BICEPS ──
    { id: 'curl', nom: 'Curl biceps', muscle: 'Biceps', poly: 0,
      r: { b: 0.38, h: 0.17, m: 0.34 },
      re: /^(?!.*(ischio|jambe|leg|poignet|wrist|reverse|nordic|hamstring)).*curl/ },

    // ── TRICEPS ──
    { id: 'closegrip', nom: 'Développé prise serrée', muscle: 'Triceps', poly: 1,
      r: { b: 0.85 },
      re: /close.?grip bench|developpe (couche )?(prise )?serree?/ },
    { id: 'dipstri', nom: 'Dips (triceps)', muscle: 'Triceps', poly: 1,
      r: { p: 1.35, m: 1.00 },
      re: /^dips triceps|tricep machine dips/ },
    { id: 'triext', nom: 'Extension triceps', muscle: 'Triceps', poly: 0,
      r: { b: 0.40, h: 0.18, m: 0.40 },
      re: /^(?!.*straight).*(extensions? (triceps|nuque|couche|poulie)|triceps? (extension|corde|poulie|pushdown)|overhead (extension|tricep)|skull|barre au front|pushdown|kickback (triceps|haltere))/ },

    // ── QUADRICEPS ──
    { id: 'squat', nom: 'Squat', muscle: 'Quadriceps', poly: 1,
      r: { b: 1.30, h: 0.45, m: 1.25 },
      re: /^(back squat|squat (barre|classique barre|smith)|high bar|low bar|goblet squat)|^squat$/ },
    { id: 'frontsq', nom: 'Squat avant', muscle: 'Quadriceps', poly: 1,
      r: { b: 1.05 },
      re: /squat avant|front squat/ },
    { id: 'hack', nom: 'Hack squat', muscle: 'Quadriceps', poly: 1,
      r: { b: 1.40, m: 1.40 },
      re: /hack squat/ },
    { id: 'legpress', nom: 'Presse à cuisses', muscle: 'Quadriceps', poly: 1,
      r: { m: 2.20 },
      re: /^(?!.*mollet).*(presse a (cuisses?|jambes)|leg press|presse jambes?)/ },
    { id: 'lunge', nom: 'Fentes / squat bulgare', muscle: 'Quadriceps', poly: 1,
      r: { b: 0.70, h: 0.30, m: 0.70 },
      re: /fentes?(?! arriere$)|lunges?|squat bulgare|split squat/ },
    { id: 'legext', nom: 'Leg extension', muscle: 'Quadriceps', poly: 0,
      r: { m: 0.55 },
      re: /leg extension|extension (jambes?|quadri)/ },

    // ── ISCHIO-JAMBIERS ──
    { id: 'rdl', nom: 'Soulevé de terre roumain', muscle: 'Ischio-jambiers', poly: 1,
      r: { b: 1.20, h: 0.50 },
      re: /romanian deadlift|souleve de terre roumain|stiff leg deadlift|jambes tendues/ },
    { id: 'sldl', nom: 'Soulevé une jambe', muscle: 'Ischio-jambiers', poly: 1,
      r: { h: 0.35 },
      re: /^single leg deadlift$/ },
    { id: 'legcurl', nom: 'Leg curl', muscle: 'Ischio-jambiers', poly: 0,
      r: { m: 0.50 },
      re: /leg curl|curl ischio|flexion jambes?|curl jambes?/ },

    // ── FESSIERS ──
    { id: 'hipthrust', nom: 'Hip thrust', muscle: 'Fessiers', poly: 1,
      r: { b: 1.60, m: 1.50 },
      re: /hip thrust|glute bridge lest|pont fessier lest/ },

    // ── MOLLETS ──
    { id: 'calfpress', nom: 'Mollets à la presse', muscle: 'Mollets', poly: 0,
      r: { m: 1.60 },
      re: /mollets? (a la )?presse/ },
    { id: 'calfseat', nom: 'Mollets assis', muscle: 'Mollets', poly: 0,
      r: { h: 0.40, m: 0.80 },
      re: /seated calf|calf raise.*assise?|mollets? assis/ },
    { id: 'calf', nom: 'Mollets debout', muscle: 'Mollets', poly: 0,
      r: { b: 1.10, h: 0.45, m: 1.10 },
      re: /mollets? debout|calf raise|standing calf/ },

    // ── TRAPÈZES ──
    { id: 'shrug', nom: 'Shrugs', muscle: 'Trapèzes', poly: 0,
      r: { b: 1.10, h: 0.45, m: 1.00 },
      re: /^(?!.*(elastique|en appui|en marche|atlas)).*(shrug|haussement)/ },

    // ── AVANT-BRAS ──
    { id: 'wrist', nom: 'Flexion des poignets', muscle: 'Avant-bras', poly: 0,
      r: { b: 0.20, h: 0.08, m: 0.18 },
      re: /^(?!.*reverse).*(wrist curl|flexion (des )?poignets?)/ },
    { id: 'revcurl', nom: 'Curl inversé', muscle: 'Avant-bras', poly: 0,
      r: { b: 0.28, h: 0.12, m: 0.26 },
      re: /reverse curl|curl inverse/ }
  ];

  var GROUPES = ['Pectoraux', 'Dos', 'Épaules', 'Biceps', 'Triceps', 'Quadriceps',
                 'Ischio-jambiers', 'Fessiers', 'Mollets', 'Trapèzes', 'Avant-bras'];
  // Muscles « prioritaires » : proposés d'abord quand il manque des données
  var CLES = ['Pectoraux', 'Dos', 'Quadriceps', 'Épaules', 'Ischio-jambiers', 'Fessiers', 'Biceps', 'Triceps'];
  // Mouvement suggéré par muscle (données manquantes, rattrapage)
  var SUGG = { 'Pectoraux': 'bench', 'Dos': 'row', 'Épaules': 'ohp', 'Biceps': 'curl', 'Triceps': 'triext',
               'Quadriceps': 'squat', 'Ischio-jambiers': 'rdl', 'Fessiers': 'hipthrust', 'Mollets': 'calf',
               'Trapèzes': 'shrug', 'Avant-bras': 'wrist' };

  var SEUIL_BAS = 0.85, SEUIL_HAUT = 1.15;
  var MIN_LIFTS = 3, FENETRE_J = 90;
  var OUTILS = { b: 'barre', h: 'haltères', m: 'machine', p: 'poids du corps' };

  function norm(s) {
    return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  // v1311 : tous les calculs sont en KG (séries et poids du corps) ; conversion à l'affichage seulement
  function nb(v) { return Math.round(unite() === 'kg' ? v : v * 2.20462); }
  function unite() {
    try { return (typeof useKg !== 'undefined' && useKg) ? 'kg' : 'lbs'; } catch (e) { return 'kg'; }
  }
  function pid() {
    try { return (typeof getCurrentProfileId === 'function') ? (getCurrentProfileId() || 'x') : 'x'; } catch (e) { return 'x'; }
  }
  function nomEx(n) {
    try { return typeof window.awakNom === 'function' ? window.awakNom(n) : n; } catch (e) { return n; }
  }
  function lift(id) { for (var i = 0; i < LIFTS.length; i++) if (LIFTS[i].id === id) return LIFTS[i]; return null; }

  function perfs() {
    try {
      if (typeof window.getExercisePerformances === 'function') return window.getExercisePerformances() || {};
      if (typeof getExercisePerformances === 'function') return getExercisePerformances() || {};
    } catch (e) {}
    return {};
  }

  // Poids du corps en KG (comme les séries enregistrées). v1311 : il était
  // converti en lb ici, puis additionné à des charges en kg (tractions, dips).
  function poidsCorps() {
    try {
      var p = (typeof getUserProfile === 'function') ? getUserProfile() : null;
      var kg = p ? parseFloat(p.weight) : 0;
      if (!(kg > 0)) return 0;
      return kg;
    } catch (e) { return 0; }
  }
  function sexe() {
    try { return (typeof awakUserSex === 'function' && awakUserSex() === 'femme') ? 'femme' : 'homme'; } catch (e) { return 'homme'; }
  }

  // ── Outil d'un exercice : machine · haltères · barre · poids du corps ──
  var _db = null;
  function dbEx(n) {
    if (!_db) { _db = {}; (window.exerciseDatabase || []).forEach(function (e) { if (e && e.name) _db[e.name] = e; }); }
    return _db[n] || null;
  }
  function outil(n) {
    var t = norm(n);
    // Élastique, TRX, ballon… : charge non mesurable
    if (/elastique|(^|[^a-z])band(e|ed)?([^a-z]|$)|trx/.test(t)) return 'x';
    if (/smith|machine|poulie|cable|pec deck|butterfly|leg press|presse|pulldown|tirage (vertical|nuque|poitrine|dos|unilateral|horizontal)|leg curl|leg extension|hammer strength|seated row|low cable|crossover/.test(t)) return 'm';
    if (/halter|dumbbell|(^|[^a-z])kb([^a-z]|$)|kettlebell|goblet/.test(t)) return 'h';
    var ex = dbEx(n), eq = ex ? norm((ex.equipment || []).join(' ')) : '';
    if (eq) {
      if (/elastique|trx|swiss|medicine|sac de sable|pneu|traineau|piscine|rameur|corde/.test(eq) && !/barre|halter|machine/.test(eq)) return 'x';
      if (/machine/.test(eq)) return 'm';
      if (/barre(?!s? parall)/.test(eq)) return 'b';
      if (/halter|kettle/.test(eq)) return 'h';
      if (/poids du corps|parallele/.test(eq)) return 'p';
    }
    if (/^(tractions?|dips|pull.?up|chin.?up)/.test(t)) return 'p';
    return 'b';
  }
  // Mouvement de référence d'un exercice (premier motif qui correspond)
  function liftDe(n) {
    var t = norm(n);
    for (var i = 0; i < LIFTS.length; i++) if (LIFTS[i].re.test(t)) return LIFTS[i];
    return null;
  }
  // Un exercice est « mesurable » s'il a un mouvement ET un ratio pour son outil
  function mesurable(n) {
    var L = liftDe(n);
    return !!(L && L.r[outil(n)]);
  }

  // Meilleure série (Epley) — fenêtre en jours (0 = tout l'historique)
  function meilleur1RM(series, o, bw, jours) {
    if (!Array.isArray(series)) return null;
    var lim = jours ? Date.now() - jours * 86400000 : 0;
    var best = null;
    series.forEach(function (s) {
      if (!s || s.warmup) return;
      if (lim) { var d = Date.parse(s.date || ''); if (!isNaN(d) && d < lim) return; }
      var w = parseFloat(s.weight) || 0;
      var r = parseInt(s.reps, 10) || 0;
      if (r <= 0 || r > 12) return;
      var charge = (o === 'p') ? (bw > 0 ? bw + w : 0) : w;
      if (charge <= 0) return;
      var rm = charge * (1 + r / 30);
      if (!best || rm > best.rm) best = { rm: rm, poids: w, reps: r, date: s.date || null };
    });
    return best;
  }

  function mediane(arr) {
    var a = arr.slice().sort(function (x, y) { return x - y; });
    if (!a.length) return 0;
    return a.length % 2 ? a[(a.length - 1) / 2] : (a[a.length / 2 - 1] + a[a.length / 2]) / 2;
  }

  // ═══ ANALYSE ════════════════════════════════════════════════════════
  function collecter(P, bw, jours) {
    var parLift = {};   // clé lift+outil → meilleur résultat
    var rejetes = [];
    Object.keys(P).forEach(function (n) {
      var L = liftDe(n); if (!L) return;
      var o = outil(n), ratio = L.r[o];
      if (!ratio) return;                        // outil non comparable
      var b = meilleur1RM(P[n], o, bw, jours);
      if (!b) { if (!jours && rejetes.indexOf(n) < 0) rejetes.push(n); return; }
      var k = L.id + ':' + o;
      if (!parLift[k] || b.rm / ratio > parLift[k].equivalent) {
        parLift[k] = { lift: L, outil: o, ratio: ratio, rm: b.rm, poids: b.poids, reps: b.reps,
                       exercice: n, equivalent: b.rm / ratio };
      }
    });
    return { trouves: Object.keys(parLift).map(function (k) { return parLift[k]; }), rejetes: rejetes };
  }

  function analyser() {
    var P = perfs(), bw = poidsCorps();
    var c = collecter(P, bw, FENETRE_J), ancien = false;
    var tout = collecter(P, bw, 0);
    if (c.trouves.length < MIN_LIFTS) { c = tout; ancien = true; }
    var trouves = c.trouves, rejetes = tout.rejetes;

    if (trouves.length < MIN_LIFTS) {
      return { suffisant: false, trouves: trouves, requis: MIN_LIFTS, rejetes: rejetes, bw: bw };
    }

    // ── Score par muscle : moyenne pondérée (poly ×1, isolation ×0,5) ──
    var parMuscle = {};
    trouves.forEach(function (t) {
      var m = t.lift.muscle, w = t.lift.poly ? 1 : 0.5;
      var g = parMuscle[m] = parMuscle[m] || { muscle: m, somme: 0, poids: 0, lifts: [] };
      g.somme += t.equivalent * w; g.poids += w; g.lifts.push(t);
    });
    var groupes = Object.keys(parMuscle).map(function (m) {
      var g = parMuscle[m];
      g.eq = g.somme / g.poids;
      g.lifts.sort(function (a, b) { return (b.lift.poly - a.lift.poly) || (a.equivalent - b.equivalent); });
      return g;
    });
    // Un seul muscle évalué : pas de comparaison possible
    var ref = mediane(groupes.map(function (g) { return g.eq; }));
    groupes.forEach(function (g) {
      g.pct = Math.round(g.eq / ref * 100);
      g.statut = g.pct < SEUIL_BAS * 100 ? 'retard' : (g.pct > SEUIL_HAUT * 100 ? 'fort' : 'ok');
      // Objectif concret sur le mouvement principal du muscle
      var t = g.lifts[0];
      var att = ref * t.ratio;
      g.objectif = { lift: t.lift, outil: t.outil, exercice: t.exercice, actuel: t.rm, attendu: att };
    });
    groupes.sort(function (a, b) { return a.pct - b.pct; });

    // ── Paires antagonistes ──
    function moy(filtre) {
      var s = 0, p = 0;
      trouves.forEach(function (t) { if (filtre(t)) { var w = t.lift.poly ? 1 : 0.5; s += t.equivalent * w; p += w; } });
      return p ? s / p : 0;
    }
    function grp(m) { return parMuscle[m] ? parMuscle[m].eq : 0; }
    var paires = [
      { a: 'Pousser', b: 'Tirer', va: moy(function (t) { return /^(bench|decline|incline|dipspec|ohp)$/.test(t.lift.id); }),
        vb: moy(function (t) { return /^(row|vertical|pullup)$/.test(t.lift.id); }),
        conseil: 'Plus de rowing et de tirages' , conseilA: 'Plus de développés' },
      { a: 'Quadriceps', b: 'Ischio-jambiers', va: grp('Quadriceps'), vb: grp('Ischio-jambiers'),
        conseil: 'Plus de soulevé roumain et de leg curl', conseilA: 'Plus de squats et de presse' },
      { a: 'Avant d\'épaule', b: 'Arrière d\'épaule', va: moy(function (t) { return t.lift.zone === 'avant'; }),
        vb: moy(function (t) { return t.lift.zone === 'arriere'; }),
        conseil: 'Plus d\'oiseau et de face pull', conseilA: 'Plus de développé militaire' },
      { a: 'Biceps', b: 'Triceps', va: grp('Biceps'), vb: grp('Triceps'),
        conseil: 'Plus d\'extensions triceps', conseilA: 'Plus de curls' }
    ].filter(function (p) { return p.va > 0 && p.vb > 0; }).map(function (p) {
      p.ratio = p.va / p.vb;
      p.statut = p.ratio > SEUIL_HAUT ? 'b-faible' : (p.ratio < SEUIL_BAS ? 'a-faible' : 'ok');
      return p;
    });

    // ── Indice d'équilibre : 100 − écart moyen à la référence ──
    var ecart = 0;
    groupes.forEach(function (g) { ecart += Math.abs(g.pct - 100); });
    var indice = groupes.length > 1 ? Math.max(0, Math.min(100, Math.round(100 - ecart / groupes.length))) : 100;

    var couverts = {};
    groupes.forEach(function (g) { couverts[g.muscle] = 1; });
    var absents = GROUPES.filter(function (m) { return !couverts[m]; });

    return {
      suffisant: true, ref: ref, groupes: groupes, paires: paires, indice: indice,
      trouves: trouves, absents: absents, ancien: ancien, bw: bw,
      retards: groupes.filter(function (g) { return g.statut === 'retard'; }),
      forts: groupes.filter(function (g) { return g.statut === 'fort'; }),
      niveaux: niveaux(trouves, bw)
    };
  }

  // ═══ NIVEAU SELON LE POIDS DU CORPS ═════════════════════════════════
  // 1RM ÷ poids du corps pour [Novice, Intermédiaire, Avancé, Élite]
  var STD = {
    homme: { bench: [0.75, 1.0, 1.25, 1.5], squat: [1.0, 1.25, 1.5, 2.0], deadlift: [1.25, 1.5, 2.0, 2.5],
             ohp: [0.45, 0.6, 0.8, 1.0], row: [0.6, 0.8, 1.0, 1.25], pullup: [1.0, 1.25, 1.5, 1.75] },
    femme: { bench: [0.5, 0.65, 0.85, 1.0], squat: [0.75, 1.0, 1.25, 1.5], deadlift: [1.0, 1.25, 1.5, 2.0],
             ohp: [0.3, 0.42, 0.55, 0.7], row: [0.4, 0.55, 0.7, 0.9], pullup: [0.8, 1.0, 1.2, 1.4] }
  };
  var NIV = ['Débutant', 'Novice', 'Intermédiaire', 'Avancé', 'Élite'];
  var NIV_COUL = ['#94a3b8', '#60a8f0', '#22d3ee', '#a78bfa', '#fbbf24'];
  function niveaux(trouves, bw) {
    if (!(bw > 0)) return [];
    var tab = STD[sexe()], out = [];
    ['bench', 'squat', 'deadlift', 'ohp', 'row', 'pullup'].forEach(function (id) {
      var o = id === 'pullup' ? 'p' : 'b';
      var t = trouves.filter(function (x) { return x.lift.id === id && x.outil === o; })[0];
      if (!t) return;
      var r = t.rm / bw, s = tab[id], n = 0;
      for (var i = 0; i < s.length; i++) if (r >= s[i]) n = i + 1;
      out.push({ lift: t.lift, ratio: r, niveau: n, prochain: n < s.length ? s[n] * bw : null, rm: t.rm,
                 pdc: o === 'p' });
    });
    return out;
  }

  // ═══ SUIVI MENSUEL ══════════════════════════════════════════════════
  function histKey() { return 'awakBalanceHist_' + pid(); }
  function lireHist() {
    try { var a = JSON.parse(localStorage.getItem(histKey()) || '[]'); return Array.isArray(a) ? a : []; } catch (e) { return []; }
  }
  function memoriser(a) {
    try {
      var d = new Date(), mois = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
      var h = lireHist().filter(function (x) { return x && x.m !== mois; });
      var g = {}; a.groupes.forEach(function (x) { g[x.muscle] = x.pct; });
      h.push({ m: mois, indice: a.indice, g: g });
      h.sort(function (x, y) { return x.m < y.m ? -1 : 1; });
      localStorage.setItem(histKey(), JSON.stringify(h.slice(-12)));
      return h;
    } catch (e) { return lireHist(); }
  }

  // ═══ RATTRAPAGE (branché sur la séance intelligente) ════════════════
  function focusKey() { return 'awakBalanceFocus_' + pid(); }
  function focus() {
    try {
      var f = JSON.parse(localStorage.getItem(focusKey()) || 'null');
      if (!f || !Array.isArray(f.muscles) || !f.muscles.length) return null;
      if (f.jusqu && Date.parse(f.jusqu) < Date.now()) { localStorage.removeItem(focusKey()); return null; }
      return f;
    } catch (e) { return null; }
  }
  function activerFocus(muscles) {
    try {
      var fin = new Date(Date.now() + 28 * 86400000);
      localStorage.setItem(focusKey(), JSON.stringify({ muscles: muscles.slice(0, 3), le: new Date().toISOString(), jusqu: fin.toISOString() }));
    } catch (e) {}
  }
  function arreterFocus() { try { localStorage.removeItem(focusKey()); } catch (e) {} }

  // Remet les muscles en retard en tête d'une liste de muscles prêts
  function prioriserMuscles(liste) {
    var f = focus();
    if (!f || !Array.isArray(liste)) return liste;
    var avant = liste.filter(function (m) { return f.muscles.indexOf(m) >= 0; });
    var reste = liste.filter(function (m) { return f.muscles.indexOf(m) < 0; });
    return avant.concat(reste);
  }

  // Ajoute 1 exercice mesurable (poly d'abord) pour au plus 2 muscles en
  // retard présents dans la séance. Ne force JAMAIS un muscle non prévu :
  // la récupération et le plan du jour restent prioritaires.
  function appliquerFocus(selection, dispo, cibles) {
    var f = focus();
    if (!f || !Array.isArray(selection) || !Array.isArray(dispo)) return { liste: selection, ajoutes: [] };
    var ajoutes = [];
    f.muscles.filter(function (m) { return (cibles || []).indexOf(m) >= 0; }).slice(0, 2).forEach(function (m) {
      var cands = dispo.filter(function (e) {
        return e && e.muscle === m && mesurable(e.name) && !selection.some(function (s) { return s.name === e.name; });
      });
      if (!cands.length) return;
      var poly = cands.filter(function (e) { var L = liftDe(e.name); return L && L.poly; });
      var pool = poly.length ? poly : cands;
      var pick = pool[Math.floor(Math.random() * Math.min(3, pool.length))];
      selection.push(Object.assign({}, pick, { _equilibre: true }));
      ajoutes.push(m);
    });
    return { liste: selection, ajoutes: ajoutes };
  }

  // ═══ SILHOUETTE COLORÉE ═════════════════════════════════════════════
  var COUL = { retard: '#fbbf24', ok: '#22d3ee', fort: '#a78bfa', vide: '#475569' };
  function silhouette(a) {
    var st = {};
    a.groupes.forEach(function (g) { st[g.muscle] = g.statut; });
    function zone(nom, d) {
      var c = COUL[st[nom] || 'vide'];
      return '<g style="fill:' + c + (st[nom] ? '88' : '22') + ';stroke:' + c + ';stroke-width:0.9;">' + d + '</g>';
    }
    var face = zone('Trapèzes', '<path d="M87,49 L100,43 L113,49 L110,58 L100,53 L90,58 Z"/>')
      + zone('Épaules', '<ellipse cx="70" cy="70" rx="9.5" ry="9.5"/><ellipse cx="130" cy="70" rx="9.5" ry="9.5"/>')
      + zone('Pectoraux', '<path d="M82,64 C89,61 97,63 99,70 L99,90 C89,92 82,86 81,76 Z"/><path d="M118,64 C111,61 103,63 101,70 L101,90 C111,92 118,86 119,76 Z"/>')
      + zone('Biceps', '<path d="M49,97 L62,97 L45,116 L33,116 Z"/><path d="M151,97 L138,97 L155,116 L167,116 Z"/>')
      + zone('Avant-bras', '<path d="M27,124 L36,124 L25,140 L18,140 Z"/><path d="M173,124 L164,124 L175,140 L182,140 Z"/>')
      + zone('Quadriceps', '<ellipse cx="80" cy="177" rx="10" ry="21"/><ellipse cx="120" cy="177" rx="10" ry="21"/>')
      + zone('Mollets', '<ellipse cx="67" cy="231" rx="7" ry="16"/><ellipse cx="133" cy="231" rx="7" ry="16"/>');
    var dos = zone('Trapèzes', '<path d="M86,47 L100,41 L114,47 L111,70 L100,64 L89,70 Z"/>')
      + zone('Épaules', '<ellipse cx="70" cy="68" rx="9.5" ry="9.5"/><ellipse cx="130" cy="68" rx="9.5" ry="9.5"/>')
      + zone('Dos', '<path d="M83,75 L98,81 L98,120 L87,110 Z"/><path d="M117,75 L102,81 L102,120 L113,110 Z"/>')
      + zone('Triceps', '<path d="M51,93 L64,93 L46,113 L34,113 Z"/><path d="M149,93 L136,93 L154,113 L166,113 Z"/>')
      + zone('Avant-bras', '<path d="M29,124 L38,124 L24,140 L17,140 Z"/><path d="M171,124 L162,124 L176,140 L183,140 Z"/>')
      + zone('Fessiers', '<path d="M82,131 C82,123 99,123 99,131 L99,149 C99,157 82,157 82,149 Z"/><path d="M118,131 C118,123 101,123 101,131 L101,149 C101,157 118,157 118,149 Z"/>')
      + zone('Ischio-jambiers', '<ellipse cx="81" cy="180" rx="10" ry="20"/><ellipse cx="119" cy="180" rx="10" ry="20"/>')
      + zone('Mollets', '<ellipse cx="70" cy="233" rx="7" ry="16"/><ellipse cx="130" cy="233" rx="7" ry="16"/>');
    function svg(img, zones, titre) {
      return '<div style="flex:1;min-width:0;text-align:center;">'
        + '<svg viewBox="0 0 200 298" style="width:100%;max-width:150px;height:auto;display:block;margin:0 auto;">'
        + '<image href="images/body/' + img + '?v=858" x="0" y="0" width="200" height="298" preserveAspectRatio="none" opacity="0.7"/>'
        + zones + '</svg>'
        + '<div style="font-size:0.62em;color:#64748b;font-weight:800;letter-spacing:1px;margin-top:2px;">' + titre + '</div></div>';
    }
    var leg = function (c, t) {
      return '<span style="display:inline-flex;align-items:center;gap:5px;"><span style="width:9px;height:9px;border-radius:3px;background:' + c + ';"></span>' + t + '</span>';
    };
    return '<div style="display:flex;gap:6px;align-items:flex-start;">' + svg('body_face.webp', face, 'FACE') + svg('body_dos.webp', dos, 'DOS') + '</div>'
      + '<div style="display:flex;flex-wrap:wrap;justify-content:center;gap:12px;margin-top:8px;font-size:0.68em;color:#94a3b8;font-weight:700;">'
      + leg(COUL.retard, 'En retard') + leg(COUL.ok, 'Équilibré') + leg(COUL.fort, 'Point fort') + leg(COUL.vide, 'Pas évalué') + '</div>';
  }

  // ═══ AFFICHAGE ══════════════════════════════════════════════════════
  function titre(t, c) {
    return '<div style="font-size:0.6em;letter-spacing:1.8px;color:' + (c || '#94a3b8') + ';font-weight:900;margin:18px 0 9px;">' + t + '</div>';
  }
  function carte(contenu, extra) {
    return '<div style="background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:11px 12px;margin-bottom:7px;' + (extra || '') + '">' + contenu + '</div>';
  }
  function charge(o, v, u) {
    return nb(v) + ' ' + u + (o === 'h' ? ' / haltère' : '');
  }

  function vueInsuffisante(a) {
    var manque = a.requis - a.trouves.length;
    var puce = function (txt, coul) {
      return '<div style="display:flex;gap:8px;align-items:flex-start;padding:6px 0;border-top:1px solid rgba(148,163,184,0.10);">'
        + '<span style="width:6px;height:6px;border-radius:50%;background:' + coul + ';margin-top:6px;flex-shrink:0;"></span>'
        + '<span style="flex:1;">' + txt + '</span></div>';
    };
    var liste = '';
    if (a.trouves.length) {
      liste += titre('DÉJÀ COMPTÉS (' + a.trouves.length + '/' + a.requis + ')', '#22d3ee');
      a.trouves.forEach(function (t) {
        liste += puce('<strong style="color:#e8f0f8;">' + esc(nomEx(t.exercice)) + '</strong> <span style="color:#64748b;">· ' + esc(t.lift.muscle) + '</span>', '#22d3ee');
      });
    }
    if (a.rejetes && a.rejetes.length) {
      liste += titre('FAITS, MAIS PAS ENCORE COMPTÉS', '#fbbf24');
      a.rejetes.forEach(function (n) {
        var pdc = outil(n) === 'p';
        liste += puce('<strong style="color:#e8f0f8;">' + esc(nomEx(n)) + '</strong><br><span style="color:#94a3b8;font-size:0.92em;">'
          + (pdc && !(a.bw > 0) ? 'Ajoute ton poids dans ton profil pour compter les exercices au poids du corps.'
                                : 'Aucune série de 12 répétitions ou moins' + (pdc ? '.' : ' avec une charge.')) + '</span>', '#fbbf24');
      });
    }
    var pris = {};
    a.trouves.forEach(function (t) { pris[t.lift.muscle] = 1; });
    var sugg = CLES.filter(function (m) { return !pris[m]; }).slice(0, 6);
    liste += titre('À FAIRE : ' + manque + ' PARMI CEUX-CI', '#67e8f9');
    sugg.forEach(function (m) {
      var L = lift(SUGG[m]);
      liste += puce('<strong style="color:#e8f0f8;">' + esc(L ? L.nom : m) + '</strong> <span style="color:#64748b;">· ' + esc(m) + '</span>', '#67e8f9');
    });
    return '<div style="padding:10px 4px 4px;">'
      + '<div style="text-align:center;font-size:0.95em;font-weight:800;color:#e8f0f8;margin-bottom:8px;">Pas encore assez de données</div>'
      + '<div style="text-align:center;font-size:0.8em;color:#94a3b8;line-height:1.5;">L\'analyse compare tes muscles entre eux : il faut au moins '
      + a.requis + ' mouvements de référence avec une charge. Il t\'en manque <strong style="color:#67e8f9;">' + manque + '</strong>.</div>'
      + '<div style="font-size:0.8em;color:#cbd5e1;line-height:1.45;">' + liste + '</div>'
      + '<div style="font-size:0.72em;color:#64748b;margin-top:12px;line-height:1.45;">Une série compte si elle a 12 répétitions ou moins. Les haltères se notent par haltère.</div>'
      + '</div>';
  }

  function vueComplete(a) {
    var u = unite(), h = memoriser(a), c = '';
    var prec = h.length > 1 ? h[h.length - 2] : null;

    // 1. Indice
    var ic = a.indice >= 85 ? '#22d3ee' : (a.indice >= 70 ? '#fbbf24' : '#f87171');
    var delta = prec ? a.indice - prec.indice : null;
    c += '<div style="display:flex;align-items:center;gap:14px;background:linear-gradient(135deg,' + ic + '14,transparent);border:1px solid ' + ic + '44;border-radius:14px;padding:13px 14px;">'
      + '<div style="width:62px;height:62px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;'
      +   'background:conic-gradient(' + ic + ' ' + (a.indice * 3.6) + 'deg,rgba(255,255,255,0.06) 0);">'
      +   '<div style="width:50px;height:50px;border-radius:50%;background:#0F1014;display:flex;align-items:center;justify-content:center;font-size:1.15em;font-weight:900;color:#fff;">' + a.indice + '</div></div>'
      + '<div style="flex:1;min-width:0;"><div style="font-size:0.9em;font-weight:900;color:#fff;">Indice d\'équilibre</div>'
      +   '<div style="font-size:0.72em;color:#94a3b8;margin-top:3px;line-height:1.4;">' + a.groupes.length + ' muscles comparés · '
      +   (a.ancien ? 'tout l\'historique' : '90 derniers jours') + '</div>'
      +   (delta !== null ? '<div style="font-size:0.72em;font-weight:800;margin-top:3px;color:' + (delta >= 0 ? '#22d3ee' : '#fbbf24') + ';">'
      +     (delta >= 0 ? '+' : '') + delta + ' depuis ' + moisLib(prec.m) + '</div>' : '')
      + '</div></div>';

    // 2. Silhouette
    c += '<div style="margin-top:14px;">' + silhouette(a) + '</div>';

    // 3. Rattrapage
    var f = focus();
    if (f) {
      c += '<div style="margin-top:14px;background:rgba(34,211,238,0.07);border:1px solid rgba(34,211,238,0.35);border-radius:12px;padding:12px;">'
        + '<div style="font-size:0.82em;font-weight:900;color:#e8f0f8;">Rattrapage actif</div>'
        + '<div style="font-size:0.72em;color:#94a3b8;margin:3px 0 9px;line-height:1.45;">' + esc(f.muscles.join(', '))
        + ' · jusqu\'au ' + new Date(f.jusqu).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long' })
        + '. Tes séances intelligentes ajoutent un exercice ciblé quand ces muscles sont au programme.</div>'
        + '<button onclick="AwakBalance.arreter()" style="width:100%;min-height:auto;padding:9px;border-radius:10px;cursor:pointer;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.12);color:#cbd5e1;font-weight:800;font-size:0.78em;">Arrêter le rattrapage</button></div>';
    } else if (a.retards.length) {
      c += '<button onclick="AwakBalance.corriger()" style="width:100%;margin-top:14px;min-height:auto;padding:13px;border-radius:12px;cursor:pointer;border:none;'
        + 'background:linear-gradient(135deg,#22d3ee,#0891b2);color:#04121f;font-weight:900;font-size:0.86em;">Corriger mes retards</button>'
        + '<div style="font-size:0.68em;color:#64748b;text-align:center;margin-top:6px;line-height:1.4;">Pendant 4 semaines, la séance intelligente donne la priorité à '
        + esc(a.retards.slice(0, 3).map(function (g) { return g.muscle; }).join(', ')) + '.</div>';
    }

    // 4. Par muscle
    c += titre('PAR MUSCLE', '#67e8f9');
    a.groupes.forEach(function (g) {
      var col = COUL[g.statut];
      var w = Math.max(4, Math.min(100, g.pct / 1.5));
      var avant = prec && prec.g && prec.g[g.muscle] != null ? g.pct - prec.g[g.muscle] : null;
      var o = g.objectif;
      var detail = '';
      if (g.statut === 'retard') {
        detail = '<div style="font-size:0.7em;color:#cbd5e1;margin-top:6px;line-height:1.45;">Objectif : <strong>' + esc(o.lift.nom) + '</strong> ('
          + OUTILS[o.outil] + ') '
          + (o.outil === 'p' && a.bw > 0
              ? 'lest ' + nb(Math.max(0, o.actuel - a.bw)) + ' → <strong style="color:#fbbf24;">' + nb(Math.max(0, o.attendu - a.bw)) + ' ' + u + '</strong>'
              : charge(o.outil, o.actuel, u) + ' → <strong style="color:#fbbf24;">' + charge(o.outil, o.attendu, u) + '</strong>')
          + ' <span style="color:#64748b;">(1RM estimé)</span></div>';
      }
      c += carte('<div style="display:flex;align-items:center;gap:8px;">'
        + '<span style="flex:1;min-width:0;font-size:0.84em;font-weight:800;color:#e8f0f8;">' + esc(g.muscle) + '</span>'
        + (avant ? '<span style="font-size:0.66em;font-weight:800;color:' + (avant > 0 ? '#22d3ee' : '#fbbf24') + ';">' + (avant > 0 ? '▲ +' : '▼ ') + avant + '</span>' : '')
        + '<span style="font-size:0.8em;font-weight:900;color:' + col + ';min-width:44px;text-align:right;">' + g.pct + '%</span></div>'
        + '<div style="position:relative;height:6px;background:rgba(255,255,255,0.06);border-radius:4px;margin-top:7px;">'
        +   '<div style="position:absolute;left:0;top:0;bottom:0;width:' + w + '%;background:' + col + ';border-radius:4px;"></div>'
        +   '<div style="position:absolute;left:66.6%;top:-3px;bottom:-3px;width:2px;background:rgba(255,255,255,0.35);"></div></div>'
        + '<div style="font-size:0.64em;color:#64748b;margin-top:5px;">' + esc(g.lifts.map(function (t) { return t.lift.nom; })
            .filter(function (x, i, arr) { return arr.indexOf(x) === i; }).join(' · ')) + '</div>'
        + detail, g.statut === 'retard' ? 'border-color:rgba(251,191,36,0.3);' : '');
    });
    c += '<div style="font-size:0.66em;color:#64748b;line-height:1.45;">100 % = ton niveau moyen (trait blanc). Sous 85 % : en retard. Au-dessus de 115 % : point fort.</div>';

    // 5. Paires
    if (a.paires.length) {
      c += titre('PAIRES OPPOSÉES', '#a78bfa');
      a.paires.forEach(function (p) {
        var ok = p.statut === 'ok';
        var faible = p.statut === 'b-faible' ? p.b : (p.statut === 'a-faible' ? p.a : '');
        var pa = Math.round(p.va / (p.va + p.vb) * 100);
        c += carte('<div style="display:flex;justify-content:space-between;font-size:0.78em;font-weight:800;color:#e8f0f8;">'
          + '<span>' + esc(p.a) + '</span><span>' + esc(p.b) + '</span></div>'
          + '<div style="display:flex;height:8px;border-radius:5px;overflow:hidden;margin:7px 0 6px;background:rgba(255,255,255,0.05);">'
          +   '<div style="width:' + pa + '%;background:' + (p.statut === 'a-faible' ? COUL.retard : COUL.ok) + ';"></div>'
          +   '<div style="width:2px;background:#0F1014;"></div>'
          +   '<div style="flex:1;background:' + (p.statut === 'b-faible' ? COUL.retard : COUL.fort) + ';"></div></div>'
          + '<div style="font-size:0.7em;color:' + (ok ? '#22d3ee' : '#fbbf24') + ';font-weight:700;">'
          + (ok ? 'Équilibré' : esc(faible) + ' en retard · ' + esc(p.statut === 'b-faible' ? p.conseil : p.conseilA)) + '</div>');
      });
    }

    // 6. Niveau selon le poids du corps
    c += titre('TON NIVEAU (POIDS DU CORPS)', '#fbbf24');
    if (!(a.bw > 0)) {
      c += carte('<div style="font-size:0.74em;color:#94a3b8;line-height:1.45;">Ajoute ton poids dans ton profil pour voir ton niveau sur les grands mouvements et compter les tractions et les dips.</div>');
    } else if (!a.niveaux.length) {
      c += carte('<div style="font-size:0.74em;color:#94a3b8;line-height:1.45;">Fais un développé couché, un squat, un soulevé de terre, un développé militaire ou un rowing à la barre (ou des tractions) pour situer ton niveau.</div>');
    } else {
      a.niveaux.forEach(function (n) {
        var col = NIV_COUL[n.niveau];
        c += carte('<div style="display:flex;align-items:center;gap:8px;">'
          + '<span style="flex:1;min-width:0;font-size:0.82em;font-weight:800;color:#e8f0f8;">' + esc(n.lift.nom) + '</span>'
          + '<span style="font-size:0.68em;font-weight:900;color:' + col + ';background:' + col + '1a;border:1px solid ' + col + '55;border-radius:99px;padding:2px 9px;">' + NIV[n.niveau] + '</span></div>'
          + '<div style="font-size:0.68em;color:#94a3b8;margin-top:4px;">' + n.ratio.toFixed(2) + ' × ton poids'
          + (n.prochain ? ' · ' + NIV[n.niveau + 1] + ' à ' + (n.pdc ? 'lest ' + nb(Math.max(0, n.prochain - a.bw)) : nb(n.prochain)) + ' ' + u : '') + '</div>');
      });
    }

    // 7. Pas encore évalués
    if (a.absents.length) {
      c += titre('PAS ENCORE ÉVALUÉS');
      c += carte('<div style="font-size:0.74em;color:#94a3b8;line-height:1.5;">' + a.absents.map(function (m) {
        var L = lift(SUGG[m]);
        return '<strong style="color:#cbd5e1;">' + esc(m) + '</strong>' + (L ? ' <span style="color:#64748b;">(' + esc(L.nom) + ')</span>' : '');
      }).join('<br>') + '</div>');
    }

    // 8. Évolution
    if (h.length > 1) {
      c += titre('ÉVOLUTION', '#22d3ee');
      var pts = h.slice(-6);
      c += carte('<div style="display:flex;align-items:flex-end;gap:6px;height:70px;">' + pts.map(function (x) {
        return '<div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%;gap:3px;">'
          + '<span style="font-size:0.6em;color:#cbd5e1;font-weight:800;">' + x.indice + '</span>'
          + '<div style="width:100%;max-width:26px;height:' + Math.max(4, x.indice * 0.45) + 'px;background:#22d3ee;border-radius:4px 4px 0 0;opacity:' + (x === pts[pts.length - 1] ? 1 : 0.5) + ';"></div>'
          + '<span style="font-size:0.56em;color:#64748b;">' + moisLib(x.m, true) + '</span></div>';
      }).join('') + '</div>');
    }

    // 9. Limites
    c += '<div style="margin-top:14px;padding:11px 13px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:11px;font-size:0.7em;color:#94a3b8;line-height:1.55;">'
      + 'Basé sur <strong style="color:#cbd5e1;">' + a.trouves.length + ' mouvements</strong>. Chaque charge est ramenée à un 1RM estimé selon l\'outil '
      + '(barre, haltères notés par haltère, machine, poids du corps + lest).<br><br>'
      + '<strong style="color:#cbd5e1;">À prendre comme un repère.</strong> Les ratios varient selon la morphologie, et les machines d\'une marque à l\'autre. Un écart n\'est pas forcément un défaut.</div>';
    return c;
  }

  function moisLib(m, court) {
    var M = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
    var i = parseInt(String(m).split('-')[1], 10) - 1;
    var t = M[i] || m;
    return court ? t.slice(0, 3) + '.' : t;
  }

  function ouvrir() {
    var a = analyser();
    var corps = a.suffisant ? vueComplete(a) : vueInsuffisante(a);
    var old = document.getElementById('awakBalanceModal');
    var scroll = 0;
    if (old) { try { scroll = old.querySelector('.awak-bal-corps').scrollTop; } catch (e) {} old.remove(); }
    var ov = document.createElement('div');
    ov.id = 'awakBalanceModal';
    // Les noms affichés sont déjà traduits (awakNom) : pas de 2ᵉ passage
    ov.setAttribute('data-nom-keep', '1');
    ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.92);backdrop-filter:blur(9px);'
      + 'z-index:10200;display:flex;align-items:center;justify-content:center;padding:16px;';
    ov.addEventListener('click', function (e) { if (e.target === ov) ov.remove(); });
    ov.innerHTML = '<div style="background:#0F1014;border:1px solid rgba(34,211,238,0.3);border-top:2px solid #22d3ee;'
      + 'border-radius:18px;max-width:480px;width:100%;max-height:90vh;display:flex;flex-direction:column;'
      + 'box-shadow:0 24px 60px rgba(0,0,0,0.7);overflow:hidden;">'
      + '<div style="padding:15px 18px 12px;flex-shrink:0;border-bottom:1px solid rgba(255,255,255,0.07);display:flex;align-items:center;gap:10px;">'
      +   '<div style="min-width:0;flex:1;"><div style="font-size:0.56em;letter-spacing:2px;color:#22d3ee;font-weight:900;">ANALYSE</div>'
      +   '<div style="font-size:1em;font-weight:900;color:#fff;">Équilibre de force</div></div>'
      +   '<button onclick="document.getElementById(\'awakBalanceModal\').remove()" aria-label="Fermer" '
      +     'style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.14);color:#94a3b8;'
      +     'border-radius:10px;width:34px;height:34px;min-height:auto;padding:0;font-size:1.05em;font-weight:800;cursor:pointer;flex-shrink:0;line-height:1;">×</button>'
      + '</div>'
      + '<div class="awak-bal-corps" style="flex:1;overflow-y:auto;padding:15px 16px 20px;-webkit-overflow-scrolling:touch;">' + corps + '</div>'
      + '</div>';
    document.body.appendChild(ov);
    if (scroll) { try { ov.querySelector('.awak-bal-corps').scrollTop = scroll; } catch (e) {} }
  }

  window.AwakBalance = {
    analyser: analyser, ouvrir: ouvrir, LIFTS: LIFTS,
    liftDe: liftDe, outil: outil, mesurable: mesurable,
    focus: focus, prioriserMuscles: prioriserMuscles, appliquerFocus: appliquerFocus,
    corriger: function () {
      var a = analyser();
      if (!a.suffisant || !a.retards.length) return;
      activerFocus(a.retards.map(function (g) { return g.muscle; }));
      try { if (typeof window.showToast === 'function') window.showToast('Rattrapage activé pour 4 semaines', 'success', 2600); } catch (e) {}
      ouvrir();
    },
    arreter: function () { arreterFocus(); ouvrir(); }
  };
  window.awakOuvrirEquilibre = ouvrir;
})();
