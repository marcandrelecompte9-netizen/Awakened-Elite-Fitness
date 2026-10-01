/* ═══════════════════════════════════════════════════════════════════
   PROGRAMMES ENFANTS — entraînements ludiques au poids du corps
   ───────────────────────────────────────────────────────────────────
   Affichés à la place des programmes adultes quand le profil actif est un
   enfant (< 13 ans, via AwakYouth). Uniquement du poids du corps, orienté
   jeu / motricité / plaisir, sans charge ni recherche de performance.
   Ce sont des suggestions d'activité, pas un programme médical ; une
   supervision adulte est recommandée.
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  // Chaque programme : jours avec des « missions » simples et amusantes.
  var KIDS_PROGRAMS = [
    {
      id: 'kids_superheros',
      name: 'École des super-héros',
      emoji: '🦸',
      color: '#ef4444',
      desc: 'Deviens un vrai super-héros en t\'entraînant comme eux !',
      focus: 'Force & agilité',
      days: 3,
      sessions: [
        { name: 'Entraînement du héros', exercises: ['Sauts de grenouille', 'Course sur place', 'Pompes sur les genoux', 'Saut en étoile (jumping jacks)'] },
        { name: 'Parcours agile', exercises: ['Sauts à cloche-pied', 'Marche de l\'ours (à 4 pattes)', 'Équilibre sur une jambe', 'Course sur place'] },
        { name: 'Mission force', exercises: ['Squats (chaise invisible)', 'Planche (tenir 10 sec)', 'Montées de genoux', 'Saut en étoile'] }
      ]
    },
    {
      id: 'kids_animals',
      name: 'Le zoo en mouvement',
      emoji: '🦁',
      color: '#f59e0b',
      desc: 'Imite les animaux et bouge comme eux !',
      focus: 'Motricité & fun',
      days: 3,
      sessions: [
        { name: 'Safari matinal', exercises: ['Marche de l\'ours', 'Saut de la grenouille', 'Course du guépard (sur place)', 'Démarche du crabe'] },
        { name: 'Jungle en folie', exercises: ['Saut du kangourou', 'Équilibre du flamant rose', 'Ramper comme un serpent', 'Saut en étoile'] },
        { name: 'Grand défi animal', exercises: ['Marche de l\'ours', 'Sauts de grenouille', 'Course sur place', 'Planche (tenir 10 sec)'] }
      ]
    },
    {
      id: 'kids_ninja',
      name: 'Académie ninja',
      emoji: '🥷',
      color: '#8b5cf6',
      desc: 'Entraîne-toi à être rapide, agile et silencieux comme un ninja.',
      focus: 'Agilité & équilibre',
      days: 4,
      sessions: [
        { name: 'Échauffement ninja', exercises: ['Course sur place', 'Saut en étoile', 'Montées de genoux', 'Rotation des bras'] },
        { name: 'Sauts furtifs', exercises: ['Sauts à cloche-pied', 'Saut du kangourou', 'Équilibre sur une jambe', 'Sauts de grenouille'] },
        { name: 'Force du ninja', exercises: ['Squats (chaise invisible)', 'Pompes sur les genoux', 'Planche (tenir 10 sec)', 'Montées de genoux'] },
        { name: 'Épreuve finale', exercises: ['Marche de l\'ours', 'Saut en étoile', 'Course sur place', 'Équilibre sur une jambe'] }
      ]
    }
    ,
    {
      id: 'kids_espace',
      name: 'Mission spatiale',
      emoji: '🚀',
      color: '#3b82f6',
      desc: 'Entraîne-toi comme un astronaute pour partir dans l\'espace !',
      focus: 'Coordination & énergie',
      days: 3,
      sessions: [
        { name: 'Décollage', exercises: ['Saut en étoile (jumping jacks)', 'Montées de genoux', 'Course sur place', 'Sauts à cloche-pied'] },
        { name: 'En apesanteur', exercises: ['Équilibre sur une jambe', 'Marche de l\'ours', 'Planche (tenir 10 sec)', 'Rotation des bras'] },
        { name: 'Retour sur Terre', exercises: ['Squats (chaise invisible)', 'Sauts de grenouille', 'Course sur place', 'Saut en étoile'] }
      ]
    },
    {
      id: 'kids_pirates',
      name: 'L\'équipage des pirates',
      emoji: '🏴‍☠️',
      color: '#0d9488',
      desc: 'Deviens un pirate agile qui grimpe et saute à l\'abordage !',
      focus: 'Agilité & force',
      days: 3,
      sessions: [
        { name: 'À l\'abordage', exercises: ['Sauts de grenouille', 'Marche du crabe', 'Montées de genoux', 'Course sur place'] },
        { name: 'La vigie', exercises: ['Équilibre sur une jambe', 'Saut à cloche-pied', 'Planche (tenir 10 sec)', 'Saut en étoile'] },
        { name: 'La chasse au trésor', exercises: ['Marche de l\'ours', 'Saut du kangourou', 'Squats (chaise invisible)', 'Course sur place'] }
      ]
    },
    {
      id: 'kids_dinosaures',
      name: 'L\'ère des dinosaures',
      emoji: '🦖',
      color: '#65a30d',
      desc: 'Bouge comme les dinosaures, du petit rapide au grand costaud !',
      focus: 'Motricité & fun',
      days: 3,
      sessions: [
        { name: 'Le petit vélociraptor', exercises: ['Course sur place', 'Sauts à cloche-pied', 'Montées de genoux', 'Saut en étoile'] },
        { name: 'Le grand T-Rex', exercises: ['Squats (chaise invisible)', 'Marche de l\'ours', 'Planche (tenir 10 sec)', 'Sauts de grenouille'] },
        { name: 'Le troupeau', exercises: ['Saut du kangourou', 'Démarche du crabe', 'Course sur place', 'Équilibre sur une jambe'] }
      ]
    },
    {
      id: 'kids_danse',
      name: 'Studio de danse',
      emoji: '💃',
      color: '#db2777',
      desc: 'Bouge en rythme et amuse-toi comme dans un vrai spectacle !',
      focus: 'Rythme & souplesse',
      days: 3,
      sessions: [
        { name: 'Échauffement en musique', exercises: ['Rotation des bras', 'Montées de genoux', 'Saut en étoile', 'Course sur place'] },
        { name: 'Chorégraphie', exercises: ['Sauts à cloche-pied', 'Saut du kangourou', 'Équilibre sur une jambe', 'Sauts de grenouille'] },
        { name: 'Grand spectacle', exercises: ['Saut en étoile', 'Squats (chaise invisible)', 'Marche de l\'ours', 'Montées de genoux'] }
      ]
    },
    {
      id: 'kids_explorateur',
      name: 'Le petit explorateur',
      emoji: '🧭',
      color: '#ea580c',
      desc: 'Pars à l\'aventure et franchis tous les obstacles de la jungle !',
      focus: 'Endurance & agilité',
      days: 4,
      sessions: [
        { name: 'Départ de l\'expédition', exercises: ['Course sur place', 'Saut en étoile', 'Montées de genoux', 'Rotation des bras'] },
        { name: 'Traverser la rivière', exercises: ['Sauts à cloche-pied', 'Saut du kangourou', 'Équilibre sur une jambe', 'Sauts de grenouille'] },
        { name: 'Grimper la montagne', exercises: ['Squats (chaise invisible)', 'Marche de l\'ours', 'Planche (tenir 10 sec)', 'Montées de genoux'] },
        { name: 'Le sommet', exercises: ['Saut en étoile', 'Course sur place', 'Démarche du crabe', 'Équilibre sur une jambe'] }
      ]
    },
    {
      id: 'kids_champions',
      name: 'Le mini-champion',
      emoji: '🏅',
      color: '#ca8a04',
      desc: 'Entraîne-toi comme un sportif olympique et gagne ta médaille !',
      focus: 'Force & endurance',
      days: 4,
      sessions: [
        { name: 'Athlétisme', exercises: ['Course sur place', 'Montées de genoux', 'Saut en étoile', 'Sauts à cloche-pied'] },
        { name: 'Gymnastique', exercises: ['Équilibre sur une jambe', 'Planche (tenir 10 sec)', 'Rotation des bras', 'Marche de l\'ours'] },
        { name: 'Sauts', exercises: ['Saut du kangourou', 'Sauts de grenouille', 'Saut en étoile', 'Montées de genoux'] },
        { name: 'Grande finale', exercises: ['Squats (chaise invisible)', 'Pompes sur les genoux', 'Course sur place', 'Planche (tenir 10 sec)'] }
      ]
    }
  ];

  // ── v1219 : icône, fiche de chaque mission, lancement réel, progression ──
  // Avant : l'écran ne montrait que du texte — aucun bouton pour commencer.
  var ICO = { kids_superheros: 'eclair', kids_animals: 'soleil', kids_ninja: 'epee', kids_espace: 'etoile',
              kids_pirates: 'boussole', kids_dinosaures: 'flamme', kids_danse: 'coeur', kids_explorateur: 'arbre', kids_champions: 'trophee' };
  var ACCENT = '#60a8f0';
  function ic(n, t, c) { return (window.AwakIcon && window.AwakIcon.get(n, t || 18, c || 'currentColor')) || ''; }

  // Fiche simple de chaque exercice (durée en secondes, consignes pour enfant)
  var EX = {
    'Sauts de grenouille':        { d: 30, m: 'Quadriceps', t: 'Accroupis, mains au sol, saute en avant comme une grenouille.' },
    'Course sur place':           { d: 30, m: 'Cardio',     t: 'Cours sans avancer, en levant bien les pieds.' },
    'Pompes sur les genoux':      { d: 20, m: 'Pectoraux',  t: 'Genoux au sol, descends doucement la poitrine puis pousse.' },
    'Saut en étoile (jumping jacks)': { d: 30, m: 'Cardio', t: 'Saute en écartant bras et jambes, puis referme.' },
    'Saut en étoile':             { d: 30, m: 'Cardio',     t: 'Saute en écartant bras et jambes, puis referme.' },
    'Sauts à cloche-pied':        { d: 20, m: 'Mollets',    t: 'Saute sur un pied, puis change de pied à la moitié.' },
    'Saut à cloche-pied':         { d: 20, m: 'Mollets',    t: 'Saute sur un pied, puis change de pied à la moitié.' },
    'Marche de l\'ours (à 4 pattes)': { d: 30, m: 'Corps entier', t: 'Mains et pieds au sol, fesses en l\'air, avance comme un ours.' },
    'Marche de l\'ours':          { d: 30, m: 'Corps entier', t: 'Mains et pieds au sol, fesses en l\'air, avance comme un ours.' },
    'Équilibre sur une jambe':    { d: 30, m: 'Mollets',    t: 'Tiens sur un pied, bras écartés. Change de pied à la moitié.' },
    'Squats (chaise invisible)':  { d: 30, m: 'Quadriceps', t: 'Plie les genoux comme pour t\'asseoir sur une chaise, puis remonte.' },
    'Planche (tenir 10 sec)':     { d: 10, m: 'Abdominaux', t: 'Sur les avant-bras et les pieds, le corps bien droit. Tiens 10 secondes.' },
    'Montées de genoux':          { d: 30, m: 'Cardio',     t: 'Monte un genou puis l\'autre, le plus haut possible.' },
    'Rotation des bras':          { d: 20, m: 'Épaules',    t: 'Fais de grands cercles avec les bras, devant puis derrière.' },
    'Démarche du crabe':          { d: 20, m: 'Triceps',    t: 'Assis, mains derrière toi, lève les fesses et avance comme un crabe.' },
    'Marche du crabe':            { d: 20, m: 'Triceps',    t: 'Assis, mains derrière toi, lève les fesses et avance comme un crabe.' },
    'Course du guépard (sur place)': { d: 20, m: 'Cardio',  t: 'Cours sur place le plus vite possible !' },
    'Saut du kangourou':          { d: 20, m: 'Quadriceps', t: 'Pieds joints, fais de petits bonds comme un kangourou.' },
    'Équilibre du flamant rose':  { d: 30, m: 'Mollets',    t: 'Sur un pied, l\'autre replié, comme un flamant rose.' },
    'Ramper comme un serpent':    { d: 20, m: 'Corps entier', t: 'Allongé sur le ventre, avance en rampant.' }
  };

  // Missions faites : lues dans l'historique (la séance porte _kidsProg)
  function missionsFaites() {
    var out = {};
    try {
      var raw = localStorage.getItem('workoutHistory') || '[]';
      (JSON.parse(raw) || []).forEach(function (h) {
        var k = h && h.workoutData && h.workoutData._kidsProg;
        if (!k) return;
        out[k.id] = out[k.id] || { total: 0, jours: {} };
        out[k.id].total++;
        out[k.id].jours[k.idx] = true;
      });
    } catch (e) {}
    return out;
  }

  function lancer(id, idx) {
    var p = byId(id); if (!p) return;
    var se = p.sessions[idx]; if (!se) return;
    var exos = [], tours = 2;
    for (var t = 0; t < tours; t++) {
      se.exercises.forEach(function (nom, i) {
        var f = EX[nom] || { d: 30, m: 'Corps entier', t: 'Fais de ton mieux !' };
        exos.push({ name: nom, muscle: f.m, mode: 'timer', duration: f.d, sets: 1, type: 'exercise',
          equipment: ['Poids du corps'], difficulty: 'Débutant', description: f.t, instructions: [f.t], _kids: true });
        var dernier = (t === tours - 1) && (i === se.exercises.length - 1);
        if (!dernier) exos.push({ name: 'Repos', duration: (i === se.exercises.length - 1) ? 40 : 20, isRest: true, mode: 'timer' });
      });
    }
    var w = { type: 'kids', name: p.name + ' — ' + se.name, exercises: exos, _kidsProg: { id: id, idx: idx }, _cardioAsked: true, // la mission contient déjà son échauffement
      badgeHTML: 'Mission : ' + esc(se.name), badgeStyle: 'linear-gradient(135deg,#3b82f6,#1d5fa8)' };
    // L'écran de préparation vit dans l'onglet Séance : y aller d'abord.
    try { if (typeof window.switchTab === 'function') window.switchTab('workouts'); } catch (e) {}
    setTimeout(function () {
      if (typeof window.showWorkoutPreparation === 'function') window.showWorkoutPreparation(w);
    }, 60);
  }

  function all() { return KIDS_PROGRAMS; }
  function byId(id) {
    for (var i = 0; i < KIDS_PROGRAMS.length; i++) if (KIDS_PROGRAMS[i].id === id) return KIDS_PROGRAMS[i];
    return null;
  }

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  var _ouvert = null;   // programme déplié
  window.AwakKidsToggle = function (id) {
    _ouvert = (_ouvert === id) ? null : id;
    var c = document.getElementById('programTabContent');
    if (c) c.innerHTML = renderTab();
  };

  // Rendu de l'onglet Programme version enfant.
  function renderTab() {
    var faits = missionsFaites();
    var cards = KIDS_PROGRAMS.map(function (p) {
      var f = faits[p.id] || { total: 0, jours: {} };
      var nbFaits = Object.keys(f.jours).length, tot = p.sessions.length;
      var ouvert = _ouvert === p.id;
      var etoiles = '';
      for (var i = 0; i < tot; i++) etoiles += ic('etoile', 13, i < nbFaits ? '#fbbf24' : '#334155');
      var missions = !ouvert ? '' : p.sessions.map(function (s, i) {
        var fait = !!f.jours[i];
        return '<div style="display:flex;align-items:center;gap:10px;margin-top:8px;padding:10px 11px;border-radius:12px;'
          + 'background:' + (fait ? 'rgba(251,191,36,0.07)' : 'rgba(255,255,255,0.03)') + ';border:1px solid ' + (fait ? 'rgba(251,191,36,0.35)' : 'rgba(255,255,255,0.07)') + ';">'
          + '<span style="flex-shrink:0;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;'
          +   'background:' + (fait ? 'rgba(251,191,36,0.2)' : 'rgba(96,168,240,0.14)') + ';font-size:0.75em;font-weight:900;color:' + (fait ? '#fbbf24' : '#93c5fd') + ';">'
          +   (fait ? ic('valide', 15, '#fbbf24') : (i + 1)) + '</span>'
          + '<span style="flex:1;min-width:0;">'
          +   '<span style="display:block;font-size:0.8em;font-weight:800;color:#fff;">' + esc(s.name) + '</span>'
          +   '<span style="display:block;font-size:0.66em;color:#94a3b8;line-height:1.4;margin-top:2px;">' + s.exercises.map(esc).join(' · ') + '</span>'
          + '</span>'
          + '<button onclick="AwakKidsPrograms.lancer(\'' + p.id + '\',' + i + ')" style="flex-shrink:0;padding:9px 12px;border:none;border-radius:10px;cursor:pointer;'
          +   'background:linear-gradient(135deg,#60a8f0,#1d5fa8);color:#fff;font-weight:900;font-size:0.72em;">' + (fait ? 'Refaire' : 'Go !') + '</button>'
          + '</div>';
      }).join('');
      return '<div style="background:linear-gradient(160deg,#121826,#0d0d12);border:1px solid ' + (ouvert ? 'rgba(96,168,240,0.55)' : 'rgba(96,168,240,0.22)') + ';border-radius:18px;padding:14px;margin-bottom:12px;">'
        + '<div onclick="AwakKidsToggle(\'' + p.id + '\')" style="cursor:pointer;display:flex;align-items:center;gap:12px;">'
        +   '<div style="flex-shrink:0;width:50px;height:50px;border-radius:15px;display:flex;align-items:center;justify-content:center;background:rgba(96,168,240,0.14);border:1px solid rgba(96,168,240,0.35);">' + ic(ICO[p.id] || 'etoile', 25, '#93c5fd') + '</div>'
        +   '<div style="flex:1;min-width:0;"><div style="font-size:1em;font-weight:900;color:#fff;">' + esc(p.name) + '</div>'
        +   '<div style="font-size:0.68em;color:#94a3b8;margin-top:2px;">' + esc(p.desc) + '</div>'
        +   '<div style="display:flex;align-items:center;gap:6px;margin-top:5px;"><span style="display:inline-flex;gap:2px;">' + etoiles + '</span>'
        +   '<span style="font-size:0.62em;color:' + (nbFaits === tot ? '#fbbf24' : '#64748b') + ';font-weight:800;">' + (nbFaits === tot ? 'Programme réussi !' : nbFaits + ' / ' + tot + ' missions') + '</span></div></div>'
        +   '<span style="flex-shrink:0;color:#93c5fd;transition:transform .2s;transform:rotate(' + (ouvert ? '90' : '0') + 'deg);">›</span>'
        + '</div>'
        + missions
        + '</div>';
    }).join('');

    return '<div style="margin-bottom:14px;">'
      + '<div style="font-size:0.56em;letter-spacing:2.5px;color:#60a8f0;font-weight:900;">PROGRAMMES POUR TOI</div>'
      + '<h2 style="font-size:1.2em;font-weight:900;color:#fff;margin:2px 0 4px;">Choisis ton aventure</h2>'
      + '<p style="font-size:0.78em;color:#94a3b8;margin:0;line-height:1.45;">Chaque aventure a des missions de 5 minutes environ. Touche une aventure, puis « Go ! » sur une mission. Chaque mission réussie te donne une étoile. Demande à un adulte de rester près de toi.</p>'
      + '</div>'
      + cards;
  }

  window.AwakKidsPrograms = {
    all: all,
    byId: byId,
    renderTab: renderTab,
    lancer: lancer,
    missionsFaites: missionsFaites
  };
})();
