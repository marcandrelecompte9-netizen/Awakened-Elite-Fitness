/* ═══════════════════════════════════════════════════════════════════
   PROGRAMMES SÉNIORS — entraînements adaptés à partir de 65 ans
   ───────────────────────────────────────────────────────────────────
   PROPOSÉS EN PLUS des programmes normaux (rien n'est masqué) quand le
   profil actif a 65 ans et plus (via AwakYouth.isSenior). L'accent est mis
   sur l'équilibre (prévention des chutes), la mobilité, le renforcement en
   douceur et le maintien de l'autonomie, plutôt que sur la performance.
   Ce sont des suggestions d'activité, pas un avis médical ; en cas de
   problème de santé, demander conseil à un médecin avant de commencer.
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var SENIOR_PROGRAMS = [
    {
      id: 'senior_equilibre',
      name: 'Équilibre & stabilité',
      emoji: '⚖️',
      color: '#0ea5e9',
      desc: 'Renforce ton équilibre pour te déplacer en confiance et prévenir les chutes.',
      focus: 'Équilibre & prévention des chutes',
      days: 3,
      sessions: [
        { name: 'Bases de l\'équilibre', exercises: ['Tenir sur une jambe (appui léger)', 'Marche talon-pointe', 'Transferts de poids debout', 'Montées sur la pointe des pieds'] },
        { name: 'Stabilité en mouvement', exercises: ['Marche latérale', 'Petits pas contrôlés', 'Rotation du buste assis', 'Lever de genoux debout (appui)'] },
        { name: 'Confiance debout', exercises: ['Tenir sur une jambe (appui léger)', 'Assis-debout sur chaise', 'Marche talon-pointe', 'Étirements doux des mollets'] }
      ]
    },
    {
      id: 'senior_mobilite',
      name: 'Mobilité articulaire',
      emoji: '🤸',
      color: '#22c55e',
      desc: 'Garde tes articulations souples et mobiles pour les gestes du quotidien.',
      focus: 'Souplesse & mobilité',
      days: 3,
      sessions: [
        { name: 'Réveil des articulations', exercises: ['Rotation des épaules', 'Rotation des chevilles', 'Rotation des poignets', 'Inclinaisons douces du cou'] },
        { name: 'Souplesse du haut du corps', exercises: ['Étirement des bras', 'Rotation du buste assis', 'Ouverture de poitrine', 'Rotation des épaules'] },
        { name: 'Souplesse du bas du corps', exercises: ['Étirements doux des mollets', 'Flexion douce des genoux', 'Rotation des chevilles', 'Étirement des cuisses (appui)'] }
      ]
    },
    {
      id: 'senior_force_douce',
      name: 'Renforcement en douceur',
      emoji: '💪',
      color: '#f59e0b',
      desc: 'Entretiens ta masse musculaire avec des exercices doux et progressifs.',
      focus: 'Force & autonomie',
      days: 3,
      sessions: [
        { name: 'Jambes solides', exercises: ['Assis-debout sur chaise', 'Montées sur la pointe des pieds', 'Lever de genoux debout (appui)', 'Extension de jambe assis'] },
        { name: 'Haut du corps', exercises: ['Poussée contre le mur (pompes au mur)', 'Élévations latérales des bras', 'Rotation des épaules', 'Serrage des omoplates'] },
        { name: 'Corps complet', exercises: ['Assis-debout sur chaise', 'Poussée contre le mur', 'Marche sur place', 'Étirements doux'] }
      ]
    },
    {
      id: 'senior_forme',
      name: 'En forme au quotidien',
      emoji: '🌿',
      color: '#14b8a6',
      desc: 'Une routine complète et douce pour rester actif, mobile et énergique.',
      focus: 'Endurance douce & bien-être',
      days: 4,
      sessions: [
        { name: 'Mise en route', exercises: ['Marche sur place', 'Rotation des épaules', 'Rotation des chevilles', 'Respirations profondes'] },
        { name: 'Cœur en douceur', exercises: ['Marche sur place', 'Marche latérale', 'Lever de genoux debout (appui)', 'Balancements de bras'] },
        { name: 'Tonus musculaire', exercises: ['Assis-debout sur chaise', 'Poussée contre le mur', 'Montées sur la pointe des pieds', 'Élévations latérales des bras'] },
        { name: 'Retour au calme', exercises: ['Étirements doux des mollets', 'Rotation du buste assis', 'Étirement des bras', 'Respirations profondes'] }
      ]
    }
  ];

  function all() { return SENIOR_PROGRAMS; }
  function byId(id) {
    for (var i = 0; i < SENIOR_PROGRAMS.length; i++) if (SENIOR_PROGRAMS[i].id === id) return SENIOR_PROGRAMS[i];
    return null;
  }

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  // Bloc à insérer EN PLUS, au-dessus des programmes adultes normaux.
  function renderSection() {
    var cards = SENIOR_PROGRAMS.map(function (p) {
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
      +   '<span style="font-size:1.2em;">🌱</span>'
      +   '<h2 style="font-size:1.15em;font-weight:900;color:#fff;margin:0;">Programmes adaptés</h2>'
      + '</div>'
      + '<p style="font-size:0.78em;color:#94a3b8;margin:0 0 12px;line-height:1.4;">Des routines douces axées équilibre, mobilité et renforcement, pour rester actif en confiance. En cas de souci de santé, demandez l\'avis de votre médecin.</p>'
      + '</div>'
      + cards
      + '<div style="height:1px;background:rgba(255,255,255,0.08);margin:6px 0 18px;"></div>';
  }

  window.AwakSeniorPrograms = {
    all: all,
    byId: byId,
    renderSection: renderSection
  };
})();
