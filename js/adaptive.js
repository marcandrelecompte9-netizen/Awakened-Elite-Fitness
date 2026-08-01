/* ═══════════════════════════════════════════════════════════════════
   ACCESSIBILITÉ — mobilité réduite
   ───────────────────────────────────────────────────────────────────
   Activé par profil (flag reducedMobility, choisi à la création). Propose :
     • des PROGRAMMES assis / adaptés (curés à la main, donc fiables) ;
     • un FILTRE conservateur qui signale/écarte les exercices clairement
       non réalisables assis (courir, sauter, s'allonger au sol, se
       suspendre…), détectés via des mots-clés dans le nom/les instructions.
   Un mélange équilibré : haut du corps, renforcement doux, mobilité.
   Ce sont des suggestions ; en cas de condition médicale, demander l'avis
   d'un professionnel de santé.
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  // Le profil actif a-t-il le mode mobilité réduite ?
  function isReducedMobility() {
    try {
      var p = (typeof window.getCurrentProfile === 'function') ? window.getCurrentProfile() : null;
      return !!(p && p.reducedMobility);
    } catch (e) { return false; }
  }
  function isReducedMobilityProfile(profileId) {
    try {
      var all = (typeof window.getAllProfiles === 'function') ? window.getAllProfiles() : [];
      for (var i = 0; i < all.length; i++) if (all[i].id === profileId) return !!all[i].reducedMobility;
      return false;
    } catch (e) { return false; }
  }

  // Mots-clés indiquant un exercice NON adapté (position debout dynamique,
  // au sol, suspension, sauts, course…). Détection conservatrice.
  var UNSUITABLE = [
    'saut', 'sauté', 'sautée', 'jump', 'course', 'courez', 'courir', 'sprint',
    'burpee', 'squat', 'fente', 'soulevé de terre', 'deadlift',
    'suspend', 'traction', 'pull-up', 'pompe', 'planche', 'gainage',
    'au sol', 'allongé', 'allongez', 'couché', 'à genoux', 'sur le dos',
    'sur le ventre', 'debout', 'mollets debout', 'montée de genoux',
    'cloche-pied', 'corde', 'step', 'box', 'grimp'
  ];

  function _txt(ex) {
    if (!ex) return '';
    var parts = [ex.name || ''];
    if (Array.isArray(ex.instructions)) parts = parts.concat(ex.instructions);
    if (ex.description) parts.push(ex.description);
    return parts.join(' ').toLowerCase();
  }

  // Positions réalisables en mobilité réduite. « assis » est idéal ; « debout »
  // reste souvent possible avec un appui (barre, mur, dossier) — on le tolère
  // mais en second choix. « allongé », « suspendu », « quadrupédie » sont
  // écartés (nécessitent de se mettre au sol / se suspendre).
  var SEATED_OK = ['assis'];
  var STANDING_OK = ['assis', 'debout'];

  // Un exercice est-il difficilement réalisable en mobilité réduite ?
  // On s'appuie D'ABORD sur le champ position (fiable) ; à défaut, repli sur
  // l'ancienne détection par mots-clés.
  function isUnsuitable(ex) {
    if (!ex) return false;
    if (ex.position) {
      // écarté si la position n'est ni assis ni debout
      return STANDING_OK.indexOf(ex.position) === -1;
    }
    return _keywordUnsuitable(ex);
  }

  // Version stricte : uniquement les exercices réalisables ASSIS.
  function isSeatedOnly(ex) {
    if (!ex) return false;
    if (ex.position) return SEATED_OK.indexOf(ex.position) !== -1;
    return !_keywordUnsuitable(ex);
  }

  // Ancienne détection par mots-clés (repli si pas de champ position).
  function _keywordUnsuitable(ex) {
    var t = _txt(ex);
    for (var i = 0; i < UNSUITABLE.length; i++) {
      if (t.indexOf(UNSUITABLE[i]) !== -1) return true;
    }
    return false;
  }

  // Programmes assis / adaptés — mélange haut du corps, renforcement, mobilité.
  var ADAPTIVE_PROGRAMS = [
    {
      id: 'adapt_assis_complet',
      name: 'Séance assise complète',
      emoji: '🪑',
      color: '#0ea5e9',
      desc: 'Un entraînement complet réalisable entièrement assis, sans se lever.',
      focus: 'Corps entier · assis',
      days: 3,
      sessions: [
        { name: 'Haut du corps', exercises: ['Élévations des bras (assis)', 'Rotation des épaules', 'Serrage des omoplates', 'Extensions des bras'] },
        { name: 'Tronc & posture', exercises: ['Rotation du buste (assis)', 'Inclinaisons latérales', 'Contraction des abdos (assis)', 'Redressement de posture'] },
        { name: 'Mobilité & jambes', exercises: ['Extension de jambe (assis)', 'Montées de genoux (assis)', 'Rotation des chevilles', 'Flexion des pieds'] }
      ]
    },
    {
      id: 'adapt_force_douce',
      name: 'Renforcement adapté',
      emoji: '💪',
      color: '#f59e0b',
      desc: 'Renforce le haut du corps en douceur, avec ou sans petits poids/élastiques.',
      focus: 'Force · haut du corps',
      days: 3,
      sessions: [
        { name: 'Bras & épaules', exercises: ['Élévations latérales (assis)', 'Curl des bras (assis)', 'Extensions au-dessus de la tête', 'Rotation des épaules'] },
        { name: 'Dos & poitrine', exercises: ['Serrage des omoplates', 'Tirage élastique (assis)', 'Ouverture de poitrine', 'Rétraction des épaules'] },
        { name: 'Gainage assis', exercises: ['Contraction des abdos (assis)', 'Rotation du buste (assis)', 'Inclinaisons latérales', 'Maintien du dos droit'] }
      ]
    },
    {
      id: 'adapt_mobilite',
      name: 'Mobilité & souplesse',
      emoji: '🌿',
      color: '#22c55e',
      desc: 'Garde tes articulations souples et détends-toi, en position assise.',
      focus: 'Mobilité · détente',
      days: 4,
      sessions: [
        { name: 'Réveil articulaire', exercises: ['Rotation des épaules', 'Rotation des poignets', 'Rotation des chevilles', 'Inclinaisons du cou'] },
        { name: 'Haut du corps', exercises: ['Étirement des bras', 'Ouverture de poitrine', 'Rotation du buste (assis)', 'Étirement de la nuque'] },
        { name: 'Bas du corps', exercises: ['Extension de jambe (assis)', 'Flexion des pieds', 'Rotation des chevilles', 'Étirement des cuisses (assis)'] },
        { name: 'Détente', exercises: ['Respirations profondes', 'Étirement des bras', 'Inclinaisons latérales', 'Relâchement des épaules'] }
      ]
    }
  ];

  function allPrograms() { return ADAPTIVE_PROGRAMS; }
  function programById(id) {
    for (var i = 0; i < ADAPTIVE_PROGRAMS.length; i++) if (ADAPTIVE_PROGRAMS[i].id === id) return ADAPTIVE_PROGRAMS[i];
    return null;
  }

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  // Section à insérer EN PLUS, au-dessus des programmes normaux.
  function renderSection() {
    var cards = ADAPTIVE_PROGRAMS.map(function (p) {
      var sessionList = p.sessions.map(function (s, i) {
        return '<div style="margin-top:8px;padding:10px 12px;background:rgba(255,255,255,0.03);border-radius:10px;">'
          + '<div style="font-size:0.8em;font-weight:800;color:#fff;margin-bottom:5px;">Séance ' + (i + 1) + ' · ' + esc(s.name) + '</div>'
          + '<div style="font-size:0.74em;color:#cbd5e1;line-height:1.5;">' + s.exercises.map(esc).join(' · ') + '</div>'
          + '</div>';
      }).join('');
      return '<div style="background:linear-gradient(160deg,' + p.color + '18,#0d0d12);border:1px solid ' + p.color + '55;border-radius:18px;padding:18px;margin-bottom:14px;">'
        + '<div style="display:flex;align-items:center;gap:12px;margin-bottom:6px;">'
        +   '<div style="font-size:2.4em;line-height:1;">' + p.emoji + '</div>'
        +   '<div><div style="font-size:1.05em;font-weight:900;color:#fff;">' + esc(p.name) + '</div>'
        +   '<div style="font-size:0.72em;color:' + p.color + ';font-weight:700;">' + esc(p.focus) + ' · ' + p.days + ' séances/sem</div></div>'
        + '</div>'
        + '<p style="font-size:0.82em;color:#94a3b8;line-height:1.45;margin:0 0 8px;">' + esc(p.desc) + '</p>'
        + sessionList
        + '</div>';
    }).join('');

    return '<div style="margin-bottom:14px;">'
      + '<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">'
      +   '<span style="font-size:1.2em;">♿</span>'
      +   '<h2 style="font-size:1.15em;font-weight:900;color:#fff;margin:0;">Programmes adaptés</h2>'
      + '</div>'
      + '<p style="font-size:0.78em;color:#94a3b8;margin:0 0 12px;line-height:1.4;">Des séances réalisables assis, axées haut du corps, renforcement doux et mobilité. En cas de condition médicale, demandez conseil à un professionnel de santé.</p>'
      + '</div>'
      + cards
      + '<div style="height:1px;background:rgba(255,255,255,0.08);margin:6px 0 18px;"></div>';
  }

  window.AwakAdaptive = {
    isReducedMobility: isReducedMobility,
    isReducedMobilityProfile: isReducedMobilityProfile,
    isUnsuitable: isUnsuitable,
    isSeatedOnly: isSeatedOnly,
    allPrograms: allPrograms,
    programById: programById,
    renderSection: renderSection
  };
})();
