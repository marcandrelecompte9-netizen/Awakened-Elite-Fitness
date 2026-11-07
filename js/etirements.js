/* ═══════════════════════════════════════════════════════════════════
   ÉTIREMENTS — v1670
   1. Exercices d'étirement / relâchement AVEC ACCESSOIRES (rouleau, balle,
      sangle, bloc, bâton) ajoutés à la base (type « stretch »).
   2. Onglet Séance › Étirements : la personne choisit POURQUOI (après
      l'entraînement / douleur ou blessure), les MUSCLES et ses ACCESSOIRES ;
      le Système propose une suite adaptée et la lance.
   Les questions « échauffement ? » (début) et « étirements ? » (fin) des
   séances de musculation vivent dans app.js (awakEchauffGate / awakEtirGate).
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  // ── 1. Accessoires et nouveaux exercices ─────────────────────────────
  var ACCESSOIRES = [
    { id: 'rouleau', nom: 'Rouleau', eq: 'Rouleau de massage' },
    { id: 'balle', nom: 'Balle', eq: 'Balle de massage' },
    { id: 'sangle', nom: 'Sangle ou élastique', eq: 'Sangle / élastique' },
    { id: 'bloc', nom: 'Bloc de yoga', eq: 'Bloc de yoga' },
    { id: 'baton', nom: 'Bâton', eq: 'Bâton' }
  ];
  // r = relâchement (rouleau, balle : on roule, on presse) ; e = étirement tenu
  function X(nom, muscle, acc, genre, duree, instr, conseil) {
    return { name: nom, muscle: muscle, difficulty: 'Débutant', type: 'stretch', equipment: [acc],
      description: genre === 'r' ? 'Relâchement musculaire avec ' + acc.toLowerCase() + '.' : 'Étirement guidé avec ' + acc.toLowerCase() + '.',
      instructions: instr, tips: conseil, duration: duree, _accessoireEtir: true, _genre: genre };
  }
  var R = 'Rouleau de massage', B = 'Balle de massage', S = 'Sangle / élastique', K = 'Bloc de yoga', T = 'Bâton';
  var NOUVEAUX = [
    X('Rouleau quadriceps', 'Quadriceps', R, 'r', 60, ['Sur le ventre, rouleau sous les cuisses', 'Appui sur les avant-bras', 'Roule lentement de la hanche au-dessus du genou', 'Arrête 10 s sur un point sensible'], 'Jamais directement sur le genou.'),
    X('Rouleau ischio-jambiers', 'Ischio-jambiers', R, 'r', 60, ['Assis, rouleau sous l\'arrière des cuisses', 'Mains au sol derrière toi', 'Roule du pli de la fesse au-dessus du genou', 'Croise une jambe sur l\'autre pour appuyer plus'], 'Garde le bas du dos neutre.'),
    X('Rouleau mollets', 'Mollets', R, 'r', 60, ['Assis, rouleau sous les mollets', 'Soulève les fesses', 'Roule de la cheville au genou', 'Tourne le pied à gauche et à droite'], 'Évite le tendon d\'Achille.'),
    X('Rouleau fessiers', 'Fessiers', R, 'r', 60, ['Assis sur le rouleau', 'Croise une cheville sur le genou opposé', 'Penche-toi du côté de la jambe croisée', 'Roule doucement la fesse'], 'Respire lentement pendant la pression.'),
    X('Rouleau haut du dos', 'Dos', R, 'r', 60, ['Allongé, rouleau sous les omoplates', 'Mains derrière la tête, coudes ouverts', 'Soulève les fesses et roule jusqu\'au milieu du dos', 'Arrête-toi avant le bas du dos'], 'Pas de rouleau sur le bas du dos ni la nuque.'),
    X('Rouleau grand dorsal', 'Dos', R, 'r', 60, ['Couché sur le côté, rouleau sous l\'aisselle', 'Bras tendu au-dessus de la tête', 'Roule de l\'aisselle jusqu\'au bas des côtes', 'Change de côté'], 'Bon après les tirages et tractions.'),
    X('Rouleau adducteurs', 'Adducteurs', R, 'r', 60, ['Sur le ventre, une jambe pliée sur le côté', 'Rouleau sous l\'intérieur de la cuisse', 'Roule du genou vers l\'aine', 'Change de jambe'], 'Mouvements courts et lents.'),
    X('Rouleau extérieur de cuisse', 'Quadriceps', R, 'r', 45, ['Couché sur le côté, rouleau sous l\'extérieur de la cuisse', 'Jambe du dessus devant, pied au sol', 'Roule de la hanche au-dessus du genou'], 'Zone souvent sensible : dose avec le pied au sol.'),
    X('Ouverture thoracique sur rouleau', 'Pectoraux', R, 'e', 60, ['Allongé sur le rouleau dans la longueur', 'Tête et bassin sur le rouleau', 'Bras ouverts en croix, paumes vers le haut', 'Laisse la poitrine s\'ouvrir'], 'Idéal après le développé couché.'),
    X('Balle sous le pied', 'Mollets', B, 'r', 60, ['Debout, balle sous la voûte plantaire', 'Roule du talon aux orteils', 'Presse plus fort sur les points tendus', 'Change de pied'], 'Soulage aussi les mollets.'),
    X('Balle fessier (piriforme)', 'Fessiers', B, 'r', 60, ['Assis, balle sous une fesse', 'Croise la cheville sur le genou opposé', 'Roule en petits cercles', 'Arrête 20 s sur un point sensible'], 'Pas de pression sur le nerf si ça picote : déplace la balle.'),
    X('Balle arrière d\'épaule au mur', 'Épaules', B, 'r', 60, ['Dos au mur, balle derrière l\'épaule', 'Plie légèrement les genoux pour la rouler', 'Bouge le bras devant toi', 'Change de côté'], 'Évite la colonne et la nuque.'),
    X('Balle pectoraux au mur', 'Pectoraux', B, 'r', 45, ['Face au mur, balle sous la clavicule, côté épaule', 'Penche-toi dessus', 'Petits cercles', 'Change de côté'], 'Pression modérée.'),
    X('Balle haut du dos au mur', 'Trapèzes', B, 'r', 60, ['Dos au mur, balle entre l\'omoplate et la colonne', 'Roule de haut en bas', 'Croise les bras pour ouvrir l\'omoplate'], 'Jamais sur la colonne.'),
    X('Balle avant-bras', 'Avant-bras', B, 'r', 45, ['Avant-bras sur une table, balle dessous', 'Presse avec l\'autre main', 'Roule du poignet au coude', 'Change de bras'], 'Utile après les tractions et la prise.'),
    X('Balle mollet', 'Mollets', B, 'r', 45, ['Assis, balle sous le mollet', 'Croise l\'autre jambe dessus', 'Roule lentement'], 'Pas sur l\'arrière du genou.'),
    X('Ischio-jambiers à la sangle', 'Ischio-jambiers', S, 'e', 40, ['Allongé sur le dos', 'Sangle autour du pied, jambe tendue vers le haut', 'Tire doucement jusqu\'à la tension', 'L\'autre jambe reste au sol'], 'Garde le bas du dos au sol.'),
    X('Quadriceps couché à la sangle', 'Quadriceps', S, 'e', 40, ['Couché sur le côté', 'Sangle autour du pied du dessus', 'Tire le talon vers la fesse', 'Genoux alignés'], 'Bassin en avant, pas cambré.'),
    X('Mollet assis à la sangle', 'Mollets', S, 'e', 40, ['Assis jambes tendues', 'Sangle sous l\'avant du pied', 'Tire les orteils vers toi', 'Dos droit'], 'Genou bien tendu.'),
    X('Adducteurs à la sangle', 'Adducteurs', S, 'e', 40, ['Allongé, sangle autour du pied', 'Jambe tendue, ouvre-la sur le côté', 'Laisse-la descendre doucement'], 'Bassin à plat au sol.'),
    X('Passage d\'épaules à la sangle', 'Épaules', S, 'e', 45, ['Debout, sangle tenue large devant toi', 'Bras tendus, passe au-dessus de la tête', 'Va jusque derrière si c\'est confortable', 'Reviens lentement'], 'Écarte les mains si ça accroche.'),
    X('Triceps à la sangle', 'Triceps', S, 'e', 35, ['Une main derrière la tête tient la sangle', 'L\'autre main la tient dans le dos', 'Tire doucement vers le bas', 'Change de côté'], 'Coude vers le plafond.'),
    X('Pigeon sur bloc', 'Fessiers', K, 'e', 50, ['Jambe avant pliée devant toi', 'Bloc sous la fesse de la jambe avant', 'Jambe arrière tendue', 'Penche le buste doucement'], 'Le bloc enlève la pression sur le genou.'),
    X('Fente basse avec blocs', 'Quadriceps', K, 'e', 45, ['Genou arrière au sol', 'Mains sur deux blocs', 'Avance le bassin', 'Change de côté'], 'Coussin sous le genou si besoin.'),
    X('Pince avant sur blocs', 'Ischio-jambiers', K, 'e', 45, ['Debout, pieds largeur de hanches', 'Penche-toi, mains sur les blocs', 'Genoux souples', 'Laisse pendre la tête'], 'Monte les blocs si tu ne les atteins pas.'),
    X('Pont soutenu sur bloc', 'Dos', K, 'e', 60, ['Allongé, genoux pliés', 'Soulève le bassin, glisse le bloc sous le sacrum', 'Repose-toi dessus, bras au sol'], 'Très doux pour le bas du dos.'),
    X('Ouverture de poitrine sur bloc', 'Pectoraux', K, 'e', 60, ['Allongé, bloc sous les omoplates', 'Un 2ᵉ bloc sous la tête', 'Bras ouverts en croix'], 'Laisse la gravité travailler.'),
    X('Papillon sur blocs', 'Adducteurs', K, 'e', 50, ['Assis, plantes des pieds ensemble', 'Un bloc sous chaque genou', 'Relâche les cuisses'], 'Les blocs évitent de forcer.'),
    X('Passage d\'épaules au bâton', 'Épaules', T, 'e', 45, ['Bâton tenu large, bras tendus', 'Passe-le au-dessus de la tête', 'Puis derrière si c\'est confortable', 'Reviens lentement'], 'Mains plus écartées = plus facile.'),
    X('Rotation du tronc au bâton', 'Obliques', T, 'e', 40, ['Debout, bâton sur les épaules', 'Bassin fixe', 'Tourne le buste à gauche puis à droite', 'Lentement'], 'Pas d\'élan.'),
    X('Inclinaison latérale au bâton', 'Obliques', T, 'e', 40, ['Bâton tenu bras tendus au-dessus de la tête', 'Penche-toi d\'un côté', 'Tiens, puis change de côté'], 'Reste dans le plan, pas vers l\'avant.')
  ];
  try {
    if (typeof exerciseDatabase !== 'undefined' && Array.isArray(exerciseDatabase)) {
      var noms = {}; exerciseDatabase.forEach(function (e) { if (e && e.name) noms[e.name] = 1; });
      NOUVEAUX.forEach(function (e) { if (!noms[e.name]) exerciseDatabase.push(e); });
    }
  } catch (e) { if (window._awkE) _awkE(e); }

  // ── 2. Onglet Étirements ──────────────────────────────────────────────
  var MUSCLES = ['Pectoraux', 'Dos', 'Épaules', 'Trapèzes', 'Biceps', 'Triceps', 'Avant-bras', 'Abdominaux', 'Obliques', 'Fessiers', 'Quadriceps', 'Ischio-jambiers', 'Adducteurs', 'Mollets'];
  var ORDRE = ['Ischio-jambiers', 'Quadriceps', 'Fessiers', 'Adducteurs', 'Dos', 'Pectoraux', 'Épaules', 'Trapèzes', 'Abdominaux', 'Obliques', 'Triceps', 'Biceps', 'Mollets', 'Avant-bras'];
  var etat = { but: 'apres', muscles: [], acc: [], vue: 'face' };
  try { var _s = JSON.parse(localStorage.getItem(cle()) || 'null'); if (_s && _s.acc) etat.acc = _s.acc; } catch (e) { /* rien */ }
  function cle() { try { return typeof window._cleProfilLecture === 'function' ? window._cleProfilLecture('awakEtirAcc') : 'awakEtirAcc'; } catch (e) { return 'awakEtirAcc'; } }
  function memoriser() { try { localStorage.setItem(typeof window._cleProfil === 'function' ? window._cleProfil('awakEtirAcc') : 'awakEtirAcc', JSON.stringify({ acc: etat.acc })); } catch (e) { /* rien */ } }
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function db() { return (typeof exerciseDatabase !== 'undefined' && Array.isArray(exerciseDatabase)) ? exerciseDatabase : []; }
  function hasard(l) { return l.length ? l[Math.floor(Math.random() * l.length)] : null; }
  function cote(ex) {   // un côté à la fois ?
    var t = ((ex.name || '') + ' ' + (ex.instructions || []).join(' ')).toLowerCase();
    if (/change de (côté|jambe|bras|pied)|chaque côté|chaque jambe|chaque bras/.test(t)) return true;
    if (ex._genre === 'r') return false;   // rouleau / balle : les deux côtés ensemble sauf si dit autrement
    return /^(Biceps|Triceps|Épaules|Quadriceps|Ischio-jambiers|Mollets|Fessiers|Avant-bras|Adducteurs|Obliques)$/.test(ex.muscle || '')
      && !/passage d'épaules|deux|papillon|pince|pont|ouverture|respiration|cobra|enfant/i.test(ex.name || '');
  }
  // Muscles de la dernière séance (raccourci)
  function musclesDerniere() {
    try {
      var h = (typeof window.getWorkoutHistory === 'function') ? window.getWorkoutHistory() : JSON.parse(localStorage.getItem('workoutHistory') || '[]');
      var d = (h || []).slice().reverse().find(function (w) { return w && Array.isArray(w.exercises) && w.exercises.length; });
      if (!d) return [];
      var s = {}; d.exercises.forEach(function (e) { var m = e && (e.muscle || e.muscleGroup); if (m && MUSCLES.indexOf(m) >= 0) s[m] = 1; });
      return Object.keys(s);
    } catch (e) { return []; }
  }

  // Construit la suite d'exercices selon le but, les muscles et les accessoires
  function construire() {
    var blessure = etat.but === 'blessure';
    var eqs = etat.acc.map(function (id) { var a = ACCESSOIRES.filter(function (x) { return x.id === id; })[0]; return a && a.eq; }).filter(Boolean);
    var avecAcc = function (e) { return (e.equipment || []).some(function (q) { return eqs.indexOf(q) >= 0; }); };
    var sansAcc = function (e) { return !e._accessoireEtir && (e.equipment || []).every(function (q) { return /Poids du corps|Aucun/.test(q); }); };
    var tous = db().filter(function (e) { return e && e.type === 'stretch'; });
    var out = [];
    out.push({ name: blessure ? 'Respiration et détente' : 'Retour au calme', isInfo: true, duration: 0, type: 'stretch',
      instructions: blessure
        ? ['Respire lentement : 4 s par le nez, 6 s par la bouche', 'Tout se fait dans une amplitude SANS douleur (3/10 au maximum)', 'Travaille AUTOUR de la zone douloureuse, jamais dessus', 'Douleur vive, gonflement ou engourdissement : arrête et consulte']
        : ['Respire profondément', 'Tiens chaque étirement sans à-coups', 'Tension agréable, jamais de douleur'] });
    var ordre = ORDRE.filter(function (m) { return etat.muscles.indexOf(m) >= 0; });
    ordre.forEach(function (m) {
      var duMuscle = tous.filter(function (e) { return e.muscle === m; });
      // a) relâchement (rouleau / balle) si l'accessoire est là
      var rel = hasard(duMuscle.filter(function (e) { return e._genre === 'r' && avecAcc(e); }));
      if (rel) out.push(rel);
      // b) étirement : avec accessoire de préférence, sinon au poids du corps
      var et = hasard(duMuscle.filter(function (e) { return e._genre !== 'r' && avecAcc(e); }))
            || hasard(duMuscle.filter(sansAcc));
      if (et && out.indexOf(et) < 0) out.push(et);
    });
    return out.map(function (e) {
      var o = {};
      for (var k in e) o[k] = e[k];
      if (o.isInfo) return o;
      var relache = o._genre === 'r';
      var d = relache ? (blessure ? 60 : 45) : (blessure ? 25 : Math.max(30, o.duration || 30));
      o.mode = 'timer'; o.duration = d; o.type = 'stretch'; o.sets = 1;
      o.bilateral = cote(o);
      var base = (o.instructions || []).slice();
      if (blessure) base.push(relache ? 'Pression légère, autour de la zone sensible' : 'Amplitude douce : arrête AVANT la douleur', 'Respire lentement');
      else base.push(relache ? 'Roule lentement, pause sur les points tendus' : 'Respire et relâche un peu plus à chaque expiration');
      if (o.bilateral) base.push('À faire des deux côtés · ' + d + ' s par côté');
      o.instructions = base;
      return o;
    });
  }
  function minutes(l) {
    var s = 0; l.forEach(function (e) { if (!e.isInfo) s += (e.duration || 30) * (e.bilateral ? 2 : 1) + 10; });
    return Math.max(1, Math.round(s / 60));
  }

  function pastille(on, label, clic, extra) {
    return '<button onclick="' + clic + '" style="min-height:auto;flex-shrink:0;padding:8px 13px;border-radius:99px;cursor:pointer;font-family:inherit;font-size:0.78em;font-weight:700;'
      + (on ? 'background:#22d3ee;color:#04121f;border:1px solid #22d3ee;' : 'background:#1a1e26;color:#cbd5e1;border:1px solid #1a1e26;')
      + (extra || '') + '">' + label + '</button>';
  }
  // v1674 : choix des muscles sur le personnage (même silhouette que l'onglet Séance)
  var ADDUCT = '<path d="M95.5,157 C96.6,159 96.4,162 95,166 L90,178 C88.6,181 86.6,182 85.4,180 C85.6,175 87.4,169 89.8,164 C91.6,160 93.6,157.5 95.5,157 Z"/><path d="M104.5,157 C103.4,159 103.6,162 105,166 L110,178 C111.4,181 113.4,182 114.6,180 C114.4,175 112.6,169 110.2,164 C108.4,160 106.4,157.5 104.5,157 Z"/>';
  function zonesCorps(face) {
    try { if (typeof window._awakZonesCorps !== 'function' && typeof window.awakRenderCorps === 'function') window.awakRenderCorps(); } catch (e) { /* rien */ }
    if (typeof window._awakZonesCorps !== 'function') return [];
    var f = window._awakZonesCorps(true), d = window._awakZonesCorps(false);
    var trouve = function (l, m) { return (l.filter(function (z) { return z[1] === m; })[0] || [])[2] || ''; };
    if (face) return f.concat([['Adducteurs', 'Adducteurs', ADDUCT]]);
    // de dos : on reprend les contours symétriques (épaules, avant-bras, mollets)
    return d.concat([['Épaules', 'Épaules', trouve(f, 'Épaules')], ['Avant-bras', 'Avant-bras', trouve(f, 'Avant-bras')], ['Mollets', 'Mollets', trouve(f, 'Mollets')]]);
  }
  function corpsHTML() {
    var face = etat.vue === 'face';
    var img = face ? 'images/body/body_face.webp' : 'images/body/body_dos.webp';
    var masque = (typeof window._awakMasqueCorps === 'function') ? window._awakMasqueCorps(img) : { defs: '', id: '' };
    var g = zonesCorps(face).map(function (z) {
      var on = etat.muscles.indexOf(z[1]) >= 0;
      return '<g role="button" tabindex="0" aria-label="' + esc(z[1]) + (on ? ' (choisi)' : '') + '" onclick="AwakEtir.muscle(\'' + z[1].replace(/'/g, "\\'") + '\')" style="cursor:pointer;'
        + (on ? 'fill:#22d3ee;fill-opacity:0.62;stroke:#67e8f9;stroke-width:1.1;' : 'fill:#cbd5e1;fill-opacity:0.2;stroke:#94a3b8;stroke-width:0.8;') + 'stroke-linejoin:round;">' + z[2] + '</g>';
    }).join('');
    var choisis = MUSCLES.filter(function (m) { return etat.muscles.indexOf(m) >= 0; });
    return '<div style="display:flex;gap:12px;align-items:flex-start;">'
      + '<div style="flex:0 0 52%;max-width:200px;">'
      +   '<svg viewBox="0 0 200 298" style="width:100%;height:auto;display:block;touch-action:pan-y;">'
      +     '<defs>' + masque.defs + '</defs>'
      +     '<image href="' + img + '" x="0" y="0" width="200" height="298" preserveAspectRatio="none" opacity="0.8"/>'
      +     (masque.id ? '<g mask="url(#' + masque.id + ')">' + g + '</g>' : g)
      +   '</svg>'
      +   '<button onclick="AwakEtir.vue()" style="display:flex;align-items:center;justify-content:center;gap:6px;width:100%;margin-top:6px;min-height:auto;padding:8px;border-radius:11px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.12);color:#cbd5e1;font-size:0.74em;font-weight:700;cursor:pointer;font-family:inherit;">'
      +     '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12a8 8 0 0 1-14.3 4.9M4 12A8 8 0 0 1 18.3 7.1"/><path d="M18.5 3v4.3h-4.3M5.5 21v-4.3h4.3"/></svg>'
      +     (face ? 'Voir le dos' : 'Voir de face') + '</button>'
      + '</div>'
      + '<div style="flex:1;min-width:0;">'
      +   '<div style="font-size:0.74em;color:#8b95a5;line-height:1.4;margin-bottom:8px;">Touche un muscle pour le choisir, retouche pour l\'enlever.</div>'
      +   (choisis.length
            ? '<div style="display:flex;flex-direction:column;gap:5px;">' + choisis.map(function (m) {
                return '<button onclick="AwakEtir.muscle(\'' + m + '\')" style="display:flex;align-items:center;justify-content:space-between;gap:6px;min-height:auto;padding:6px 10px;border-radius:9px;background:rgba(34,211,238,0.1);border:1px solid rgba(34,211,238,0.4);color:#a5f3fc;font-size:0.74em;font-weight:700;cursor:pointer;font-family:inherit;text-align:left;">'
                  + '<span>' + esc(m) + '</span><span aria-hidden="true" style="color:#67e8f9;">×</span></button>';
              }).join('') + '</div>'
            : '<div style="font-size:0.74em;color:#64748b;font-style:italic;">Aucun muscle choisi</div>')
      + '</div></div>';
  }
  function titre(t) { return '<div style="font-size:0.78em;color:#8b95a5;font-weight:700;margin:18px 0 8px;">' + t + '</div>'; }

  function rendre() {
    var h = document.getElementById('awakEtirContenu'); if (!h) return;
    var blessure = etat.but === 'blessure';
    var carte = function (id, t, s) {
      var on = etat.but === id;
      return '<button onclick="AwakEtir.but(\'' + id + '\')" style="flex:1;min-width:0;text-align:left;padding:13px 13px;border-radius:14px;cursor:pointer;font-family:inherit;'
        + (on ? 'background:rgba(34,211,238,0.12);border:1.5px solid #22d3ee;' : 'background:#141821;border:1.5px solid #1f2430;') + '">'
        + '<div style="color:#fff;font-weight:800;font-size:0.9em;">' + t + '</div>'
        + '<div style="color:#8b95a5;font-size:0.74em;margin-top:3px;line-height:1.35;">' + s + '</div></button>';
    };
    var derniere = musclesDerniere();
    var html = '<div class="card" style="background:#0d0f13 !important;border:1px solid rgba(255,255,255,0.06);padding:18px 16px;">'
      + '<div style="font-size:0.78em;color:#8b95a5;font-weight:700;margin-bottom:8px;">Pourquoi t\'étirer ?</div>'
      + '<div style="display:flex;gap:8px;">'
      +   carte('apres', 'Après l\'entraînement', 'Récupérer, garder ta souplesse')
      +   carte('blessure', 'Douleur ou blessure', 'Doux, sans forcer, autour de la zone')
      + '</div>'
      + (blessure ? '<div style="margin-top:12px;padding:11px 12px;border-radius:12px;background:rgba(251,191,36,0.08);border:1px solid rgba(251,191,36,0.3);color:#fde68a;font-size:0.76em;line-height:1.5;">'
          + 'Reste dans une amplitude sans douleur (3/10 au maximum) et travaille autour de la zone, pas dessus. Douleur vive, gonflement ou engourdissement : arrête et consulte un professionnel de la santé.</div>' : '')
      + titre('Muscles à étirer')
      + '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px;">'
      +   (derniere.length ? pastille(false, 'Ma dernière séance', 'AwakEtir.derniere()', 'border-style:dashed;border-color:#22d3ee;color:#67e8f9;background:transparent;') : '')
      +   pastille(etat.muscles.length === MUSCLES.length, 'Tout le corps', 'AwakEtir.tout()')
      +   (etat.muscles.length ? pastille(false, 'Effacer', 'AwakEtir.effacer()', 'background:transparent;border-color:rgba(255,255,255,0.14);') : '')
      + '</div>'
      + corpsHTML()
      + titre('Tes accessoires <span style="font-weight:500;">(facultatif)</span>')
      + '<div style="display:flex;gap:6px;flex-wrap:wrap;">'
      +   ACCESSOIRES.map(function (a) { return pastille(etat.acc.indexOf(a.id) >= 0, esc(a.nom), 'AwakEtir.acc(\'' + a.id + '\')'); }).join('')
      + '</div>';
    if (etat.muscles.length) {
      var l = construire(); window._awkEtirListe = l;
      var ex = l.filter(function (e) { return !e.isInfo; });
      html += titre('Ta séance proposée · ' + ex.length + ' exercice' + (ex.length > 1 ? 's' : '') + ' · ≈ ' + minutes(l) + ' min')
        + '<div style="border-top:1px solid rgba(255,255,255,0.07);">'
        + ex.map(function (e) {
            var acc = (e.equipment || []).filter(function (q) { return !/Poids du corps|Aucun/.test(q); })[0];
            return '<div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.07);">'
              + '<div style="flex:1;min-width:0;"><div style="color:#f1f5f9;font-size:0.88em;font-weight:600;">' + esc(e.name) + '</div>'
              + '<div style="font-size:0.72em;color:#8b95a5;margin-top:2px;">' + esc(e.muscle) + (acc ? ' · ' + esc(acc) : '') + (e._genre === 'r' ? ' · relâchement' : '') + '</div></div>'
              + '<div style="flex-shrink:0;font-size:0.78em;color:#cbd5e1;font-variant-numeric:tabular-nums;">' + e.duration + ' s' + (e.bilateral ? ' × 2' : '') + '</div></div>';
          }).join('')
        + '</div>'
        + '<div style="display:flex;gap:8px;margin-top:16px;">'
        +   '<button onclick="AwakEtir.renouveler()" style="flex-shrink:0;padding:14px 14px;border-radius:14px;background:transparent;border:1px solid rgba(255,255,255,0.12);color:#cbd5e1;font-weight:700;font-size:0.85em;cursor:pointer;">Autres</button>'
        +   '<button onclick="AwakEtir.libre()" style="flex:1;padding:14px;border-radius:14px;background:#22d3ee;border:none;color:#062a33;font-weight:800;font-size:0.95em;cursor:pointer;">Commencer</button>'
        + '</div>';
    } else {
      html += '<div style="margin-top:16px;padding:14px;border-radius:12px;background:#141821;color:#8b95a5;font-size:0.8em;text-align:center;">Choisis au moins un muscle pour voir ta séance.</div>';
    }
    html += '</div>';
    h.innerHTML = html;
  }

  // ── 3. « Seulement m'étirer » : lecteur guidé, hors séance ─────────────
  var L = null;   // { liste, i, reste, cote, pause, timer }
  function etapes() { return (window._awkEtirListe || construire()).filter(function (e) { return !e.isInfo; }); }
  function imageDe(e) {
    var src = (window.EXERCISE_IMAGES || {})[e.name] || '';
    if (!src) return '';
    var u = encodeURI(src).replace(/'/g, '%27');
    return '<div style="width:100%;max-width:320px;aspect-ratio:1/1;margin:0 auto 14px;border-radius:16px;background:#141821 url(\'' + u + '\') center/contain no-repeat;"></div>';
  }
  function dessinerLecteur() {
    var o = document.getElementById('awakEtirLibre'); if (!o || !L) return;
    var e = L.liste[L.i];
    if (!e) {
      o.querySelector('.awk-el-corps').innerHTML = '<div style="text-align:center;padding:40px 10px;">'
        + '<div style="font-size:1.4em;font-weight:800;color:#fff;margin-bottom:6px;">Terminé</div>'
        + '<div style="color:#8b95a5;font-size:0.9em;margin-bottom:22px;">Bien joué. Prends un verre d\'eau.</div>'
        + '<button onclick="AwakEtir.fermerLibre()" style="padding:14px 28px;border-radius:14px;background:#22d3ee;border:none;color:#062a33;font-weight:800;cursor:pointer;">Fermer</button></div>';
      return;
    }
    var mm = Math.floor(L.reste / 60), ss = L.reste % 60;
    o.querySelector('.awk-el-corps').innerHTML =
        '<div style="font-size:0.76em;color:#8b95a5;font-weight:700;text-align:center;margin-bottom:4px;">' + (L.i + 1) + ' / ' + L.liste.length + (e.bilateral ? ' · ' + (L.cote === 1 ? 'côté droit' : 'côté gauche') : '') + '</div>'
      + '<div style="font-size:1.25em;font-weight:800;color:#fff;text-align:center;margin-bottom:12px;">' + esc(e.name) + '</div>'
      + imageDe(e)
      + '<div style="font-size:2.6em;font-weight:800;color:' + (L.pause ? '#64748b' : '#22d3ee') + ';text-align:center;font-variant-numeric:tabular-nums;">' + mm + ':' + (ss < 10 ? '0' : '') + ss + '</div>'
      + '<ul style="margin:12px 0 0;padding-left:18px;color:#cbd5e1;font-size:0.84em;line-height:1.55;">' + (e.instructions || []).slice(0, 6).map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>';
    var bp = o.querySelector('.awk-el-pause'); if (bp) bp.textContent = L.pause ? 'Reprendre' : 'Pause';
  }
  function etapeSuivante() {
    var e = L.liste[L.i];
    if (e && e.bilateral && L.cote === 1) { L.cote = 2; L.reste = e.duration || 30; bip(); dessinerLecteur(); return; }
    L.i++; L.cote = 1;
    var n = L.liste[L.i]; L.reste = n ? (n.duration || 30) : 0; bip(); dessinerLecteur();
    if (!n) { clearInterval(L.timer); L.timer = null; }
  }
  function bip() { try { if (navigator.vibrate) navigator.vibrate(60); } catch (e) { /* rien */ } }
  var API = {
    rendreOnglet: rendre,
    but: function (b) { etat.but = b; rendre(); },
    muscle: function (m) { var i = etat.muscles.indexOf(m); if (i >= 0) etat.muscles.splice(i, 1); else etat.muscles.push(m); rendre(); },
    tout: function () { etat.muscles = etat.muscles.length === MUSCLES.length ? [] : MUSCLES.slice(); rendre(); },
    derniere: function () { etat.muscles = musclesDerniere(); rendre(); },
    effacer: function () { etat.muscles = []; rendre(); },
    vue: function () { etat.vue = etat.vue === 'face' ? 'dos' : 'face'; rendre(); },
    acc: function (id) { var i = etat.acc.indexOf(id); if (i >= 0) etat.acc.splice(i, 1); else etat.acc.push(id); memoriser(); rendre(); },
    renouveler: rendre,
    lancer: function () {
      var l = window._awkEtirListe || construire();
      if (!l.filter(function (e) { return !e.isInfo; }).length) return;
      var w = { name: etat.but === 'blessure' ? 'Étirements · récupération douce' : 'Étirements · après l\'entraînement',
        exercises: l, _etirementsSeul: true, type: 'stretch' };
      if (typeof window.showWorkoutPreparation === 'function') window.showWorkoutPreparation(w);
      else if (typeof window.setPendingWorkout === 'function' && typeof window.startPreparedWorkout === 'function') { window.setPendingWorkout(w); window.startPreparedWorkout(); }
    },
    construire: construire,
    accessoires: ACCESSOIRES,
    libre: function () {
      var l = etapes(); if (!l.length) return;
      L = { liste: l, i: 0, reste: l[0].duration || 30, cote: 1, pause: false, timer: null };
      document.getElementById('awakEtirLibre') && document.getElementById('awakEtirLibre').remove();
      var o = document.createElement('div'); o.id = 'awakEtirLibre';
      o.style.cssText = 'position:fixed;inset:0;z-index:10500;background:#0b0d12;display:flex;flex-direction:column;';
      o.innerHTML = '<div style="display:flex;align-items:center;justify-content:space-between;padding:calc(12px + env(safe-area-inset-top)) 16px 8px;">'
        + '<div style="color:#8b95a5;font-size:0.8em;font-weight:700;">Étirements libres</div>'
        + '<button onclick="AwakEtir.fermerLibre()" style="min-height:auto;padding:8px 14px;border-radius:99px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);color:#e2e8f0;font-weight:700;cursor:pointer;">Fermer</button></div>'
        + '<div class="awk-el-corps" style="flex:1;overflow-y:auto;padding:6px 18px 10px;"></div>'
        + '<div style="display:flex;gap:8px;padding:10px 16px calc(14px + env(safe-area-inset-bottom));">'
        + '<button onclick="AwakEtir.precLibre()" style="flex:1;padding:14px;border-radius:14px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:#cbd5e1;font-weight:700;cursor:pointer;">Préc.</button>'
        + '<button class="awk-el-pause" onclick="AwakEtir.pauseLibre()" style="flex:1;padding:14px;border-radius:14px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:#cbd5e1;font-weight:700;cursor:pointer;">Pause</button>'
        + '<button onclick="AwakEtir.suivLibre()" style="flex:1;padding:14px;border-radius:14px;background:#22d3ee;border:none;color:#062a33;font-weight:800;cursor:pointer;">Suivant</button></div>';
      document.body.appendChild(o);
      dessinerLecteur();
      L.timer = setInterval(function () {
        if (!document.getElementById('awakEtirLibre')) { clearInterval(L.timer); return; }
        if (L.pause || !L.liste[L.i]) return;
        L.reste--;
        if (L.reste <= 0) etapeSuivante(); else dessinerLecteur();
      }, 1000);
    },
    suivLibre: function () { if (L && L.liste[L.i]) etapeSuivante(); },
    precLibre: function () { if (!L) return; if (L.i > 0) L.i--; L.cote = 1; var e = L.liste[L.i]; L.reste = e ? (e.duration || 30) : 0; if (!L.timer) API.libre(); else dessinerLecteur(); },
    pauseLibre: function () { if (!L) return; L.pause = !L.pause; dessinerLecteur(); },
    fermerLibre: function () { if (L && L.timer) clearInterval(L.timer); L = null; var o = document.getElementById('awakEtirLibre'); if (o) o.remove(); }
  };
  window.AwakEtir = API;
})();
