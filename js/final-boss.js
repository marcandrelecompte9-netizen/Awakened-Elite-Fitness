// ═══════════════════════════════════════════════════════════════════════
// 👑 LE MONARQUE DU DÉCLIN — Combat final
// Un entraînement complet, très avancé (45-60 min, niveau S/SS), structuré
// en 7 actes : narration (blocs isInfo) alternée avec des blocs d'exercices.
// Débloqué après avoir vaincu les 4 sous-bosses (Les Quatre Épreuves).
// ═══════════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  const FINAL_DONE_KEY = 'awakFinalBossDefeated';

  // Bloc narratif plein écran intercalé dans la séance (réutilise isInfo).
  function story(title, lines, color) {
    return {
      name: title,
      duration: 0,
      isInfo: true,
      isFinalStory: true,
      _color: color || '#dc2626',
      image: 'images/story/nabdano.webp',   // 🖼️ le Monarque est visible pendant tout le combat
      instructions: lines
    };
  }

  // Exercice du combat final. mode 'reps' par défaut, 'timer' si durée.
  function ex(name, muscle, opts) {
    opts = opts || {};
    return {
      name: name,
      muscle: muscle,
      equipment: ['Poids du corps'],
      type: 'exercise',
      mode: opts.timer ? 'timer' : 'reps',
      duration: opts.timer || 0,
      sets: opts.sets || 1,
      targetReps: opts.reps || null,
      difficulty: 'Avancé',
      instructions: opts.instructions || [],
      tips: opts.tips || '',
      _finalBoss: true,
      _bossImage: 'images/story/nabdano.webp'
    };
  }


  // ══════════════════════════════════════════════════════════════════
  // 👑 LE MONARQUE UTILISE LE BUILD DU JOUEUR
  // ------------------------------------------------------------------
  // Avant : séance fixe. STR 80 ou STR 400 → strictement identique, et
  // toute la boucle « entraînement → stats → équipement → combat »
  // s'effondrait au moment où elle aurait dû culminer.
  // Maintenant : le Monarque a des PV, et chaque ACTE interroge une
  // stat différente. Le Berserker écrase l'Acte Force et souffre en
  // Explosivité ; l'Assassin fait l'inverse ; le polyvalent devient
  // enfin intéressant.
  // ══════════════════════════════════════════════════════════════════
  const ACT_STATS = {
    force:        { stat: 'STR', label: 'Force',        emoji: '⚔️' },
    endurance:    { stat: 'END', label: 'Endurance',    emoji: '🌊' },
    explosivite:  { stat: 'AGI', label: 'Explosivité',  emoji: '⚡' },
    volonte:      { stat: 'PER', label: 'Volonté',      emoji: '🛡️' },
    climax:       { stat: 'VIT', label: 'Tout donner',  emoji: '💥' }
  };

  function _playerStats() {
    try {
      if (typeof getPlayerEquipStats === 'function') return getPlayerEquipStats();
    } catch (e) {}
    return { STR: 10, AGI: 10, VIT: 10, END: 10, PER: 5, SEN: 5 };
  }

  // PV du Monarque : socle fixe, modulé par le Power Score.
  // Fourchette VOLONTAIREMENT étroite (0,9 → 1,15) : un joueur puissant
  // doit rester avantagé. Une fourchette large donnerait l'impression
  // que les progrès sont annulés — le pire ressenti possible en RPG.
  function monarqueHP() {
    // 🎯 Calibré sur la séance narrative (21 exercices × ~3 séries).
    // Le Monarque prend des dégâts à CHAQUE SÉRIE validée, comme un ennemi de
    // Faille : une séance complète inflige ~5 900 dgts (build faible) à
    // ~16 400 (build optimisé). À 12 500 PV, un build travaillé le fait tomber
    // avant la fin, un build faible n'y arrive pas encore — le build reste
    // déterminant sans rendre le combat infaisable.
    const BASE = 12500;
    let power = 0;
    try { if (typeof awakGetPowerScore === 'function') power = awakGetPowerScore(); } catch (e) {}
    const ref = 12000;                       // Power Score « attendu » à ce stade
    const ratio = power > 0 ? power / ref : 1;
    const mod = Math.max(0.9, Math.min(1.15, 0.9 + ratio * 0.25));
    return Math.round(BASE * mod);
  }

  // Dégâts d'un exercice selon l'acte : la stat de l'acte domine,
  // les autres apportent un socle (le polyvalent n'est jamais bloqué).
  function actDamage(actKey, effortUnits) {
    const cfg = ACT_STATS[actKey] || ACT_STATS.force;
    const st = _playerStats();
    const dominante = st[cfg.stat] || 10;
    const moyenne = (st.STR + st.AGI + st.VIT + st.END + st.PER + st.SEN) / 6;
    const SOFT = 80;
    const dim = v => v <= SOFT ? v : SOFT + Math.sqrt(v - SOFT) * Math.sqrt(SOFT);
    // 70 % stat de l'acte + 30 % polyvalence
    const eff = dim(dominante) * 0.7 + dim(moyenne) * 0.3;
    return Math.round((4 + eff * 1.5) * (effortUnits || 1));
  }
  try {
    window.awakMonarqueHP = monarqueHP;
    window.awakMonarqueActDamage = actDamage;
    window.AWAK_ACT_STATS = ACT_STATS;
  } catch (e) {}

  // Construit la liste complète des exercices + narration des 7 actes.
  function buildFinalWorkout() {
    const E = [];

    // ── PROLOGUE ──
    E.push(story('👑 La Faille Finale', [
      "La Faille s'ouvre sans bruit. Pas de monstres, pas de vagues. Juste une silhouette assise sur un trône d'ombres, qui se lève lentement en te voyant entrer.",
      "« Te voilà. Le seul qui n'a jamais cédé. » Sa voix est calme, presque triste. « Je suis né de tous les autres — ceux qui ont abandonné après le premier jour, après la première douleur. Je suis le Déclin. »",
      "Le Système murmure dans ta tête : « C'est lui. Ne le laisse pas t'épuiser. Chaque chose que tu as construite t'a mené ici. »"
    ], '#dc2626'));
    E.push(story('🔥 Échauffement — Prépare-toi', [
      "« Montre-moi ce que valent toutes ces séances. »",
      "Échauffe-toi sérieusement : ce qui vient va tout exiger."
    ], '#f59e0b'));
    E.push(ex('Jumping jacks', 'Cardio', { timer: 60, instructions: ['Rythme soutenu', 'Amplitude complète', 'Respire'] }));
    E.push(ex('Montées de genoux sur place', 'Cardio', { timer: 60, instructions: ['Genoux hauts', 'Gainage actif'] }));
    E.push(ex('Rotations & mobilité dynamique', 'Corps entier', { timer: 60, instructions: ['Épaules, hanches, chevilles', 'Mouvements amples'] }));

    // ── ACTE I — LA FORCE ──
    E.push(story('⚔️ Acte I — La Force', [
      "Le Monarque avance d'un pas. « La force ? J'ai vu mille Chasseurs forts tomber. La force sans constance n'est rien. »",
      "Il frappe le sol — l'onde de choc te traverse. « Prouve que la tienne est réelle. »"
    ], '#ef4444'));
    E.push(ex('Pompes', 'Pectoraux', { sets: 1, reps: 20, instructions: ['Corps gainé', 'Amplitude complète', 'Contrôle la descente'] , _act:'force'}));
    E.push(ex('Squats', 'Quadriceps', { sets: 1, reps: 25, instructions: ['Cuisses parallèles', 'Talons ancrés', 'Poitrine haute'] , _act:'force'}));
    E.push(ex('Fentes dynamiques', 'Quadriceps', { sets: 1, reps: 20, instructions: ['Genou arrière vers le sol', 'Alterne les jambes'] , _act:'force'}));
    E.push(ex('Pompes diamant', 'Triceps', { sets: 1, reps: 15, instructions: ['Mains rapprochées', 'Coudes près du corps'] , _act:'force'}));

    // ── ACTE II — L'ENDURANCE ──
    E.push(story('🌊 Acte II — L\'Endurance', [
      "« Tu tiens encore ? » Le Monarque sourit pour la première fois. « Alors voyons combien de temps. Le Déclin ne frappe pas fort — il use, lentement, jusqu'à ce que tu t'écroules de toi-même. »",
      "L'air devient lourd. Chaque respiration coûte. « Abandonne maintenant, et la douleur s'arrête. C'est si facile d'arrêter. »"
    ], '#0ea5e9'));
    E.push(ex('Burpees', 'Cardio', { timer: 75, instructions: ['Enchaîne sans pause', 'Poitrine au sol', 'Saut explosif en haut'] , _act:'endurance'}));
    E.push(ex('Mountain climbers', 'Cardio', { timer: 60, instructions: ['Genoux rapides vers la poitrine', 'Hanches basses'] , _act:'endurance'}));
    E.push(ex('Squats sautés', 'Quadriceps', { timer: 60, instructions: ['Descends en squat', 'Explose vers le haut', 'Réception souple'] , _act:'endurance'}));
    E.push(ex('Talons-fesses rapides', 'Cardio', { timer: 50, instructions: ['Rythme élevé', 'Bras actifs'] , _act:'endurance'}));

    // ── ACTE III — L'EXPLOSIVITÉ ──
    E.push(story('⚡ Acte III — L\'Explosivité', [
      "Le Monarque se déplace soudain — il est partout et nulle part. « La régularité ne suffira pas. Peux-tu encore être vif quand tes jambes brûlent ? »",
      "« C'est dans l'épuisement que se révèle ce que tu es vraiment. »"
    ], '#a855f7'));
    E.push(ex('Burpees avec saut', 'Cardio', { sets: 1, reps: 15, instructions: ['Explosion maximale au saut', 'Enchaîne'] , _act:'explosivite'}));
    E.push(ex('Fentes sautées alternées', 'Quadriceps', { sets: 1, reps: 20, instructions: ['Change de jambe en l\'air', 'Réception contrôlée'] , _act:'explosivite'}));
    E.push(ex('Pompes claquées', 'Pectoraux', { sets: 1, reps: 10, instructions: ['Pousse fort', 'Décolle les mains', 'Si trop dur : pompes explosives'] , _act:'explosivite'}));
    E.push(ex('Sauts groupés (tuck jumps)', 'Quadriceps', { sets: 1, reps: 15, instructions: ['Genoux vers la poitrine', 'Réception amortie'] , _act:'explosivite'}));

    // ── ACTE IV — LA VOLONTÉ ──
    E.push(story('🛡️ Acte IV — La Volonté', [
      "Le Monarque vacille. Pour la première fois, c'est lui qui semble fatigué. « Comment... ? Personne ne tient aussi longtemps. »",
      "Il change de tactique — il s'attaque à ton mental. « Tu trembles. Tu veux t'arrêter. Je le sens. Pose un genou à terre, et tout cessera. »",
      "Le Système gronde : « Ne bouge pas. Tiens. Sa dernière arme, c'est ton propre doute. Prouve-lui que ta volonté ne plie pas. »"
    ], '#22d3ee'));
    E.push(ex('Gainage planche', 'Abdominaux', { timer: 60, instructions: ['Corps parfaitement aligné', 'Ne cède pas', 'Respire malgré tout'] , _act:'volonte'}));
    E.push(ex('Chaise contre le mur', 'Quadriceps', { timer: 60, instructions: ['Cuisses parallèles au sol', 'Dos plaqué', 'Tiens coûte que coûte'] , _act:'volonte'}));
    E.push(ex('Gainage latéral droit', 'Obliques', { timer: 40, instructions: ['Hanches hautes', 'Corps en ligne'] , _act:'volonte'}));
    E.push(ex('Gainage latéral gauche', 'Obliques', { timer: 40, instructions: ['Hanches hautes', 'Corps en ligne'] , _act:'volonte'}));
    E.push(ex('Hollow hold', 'Abdominaux', { timer: 45, instructions: ['Bas du dos collé au sol', 'Jambes et bras tendus'] , _act:'volonte'}));

    // ── CLIMAX ──
    E.push(story('💥 Climax — Tout donner', [
      "Le Monarque tombe à genoux. « Impossible... tu n'es pas plus fort que moi. Tu as juste... refusé... d'arrêter. »",
      "Le Système hurle presque : « MAINTENANT. Il est à découvert. Donne tout ce qu'il te reste — ne garde rien. »"
    ], '#fbbf24'));
    E.push(ex('Burpees finaux', 'Cardio', { timer: 60, instructions: ['Vide le réservoir', 'Chaque rep le fait reculer'] , _act:'climax'}));
    E.push(ex('Pompes maximum', 'Pectoraux', { sets: 1, reps: 25, instructions: ['Autant que possible', 'Forme avant tout'] , _act:'climax'}));
    E.push(ex('Squats maximum', 'Quadriceps', { sets: 1, reps: 30, instructions: ['Profonds', 'Sans t\'arrêter'] , _act:'climax'}));
    E.push(ex('Gainage final', 'Abdominaux', { timer: 60, instructions: ['Le dernier effort', 'Tiens jusqu\'au bout'] , _act:'climax'}));

    // L'épilogue est joué par l'écran de victoire (awakShowFinalBossVictory) à la fin de la séance.

    return E;
  }

  // Le boss final est-il débloqué ? (4 sous-bosses vaincus + jeu activé)
  function isFinalUnlocked() {
    try {
      if (typeof getAdventureEnabled === 'function' && !getAdventureEnabled()) return false;
      const progress = parseInt(localStorage.getItem('awakSubBossProgress') || '0');
      return progress >= 4;
    } catch (e) { return false; }
  }
  window.awakFinalBossUnlocked = isFinalUnlocked;

  function isFinalDefeated() {
    return localStorage.getItem(FINAL_DONE_KEY) === '1';
  }
  window.awakFinalBossDefeated = isFinalDefeated;

  // Lance le combat final comme une séance préparée.
  function startFinalBoss() {
    if (!isFinalUnlocked()) {
      if (typeof showAlert === 'function') {
        showAlert('👑 Le Monarque attend', 'Tu dois d\'abord triompher des Quatre Épreuves. Le Monarque ne se montrera qu\'à celui qui les a toutes surmontées.');
      }
      return;
    }
    const exercises = buildFinalWorkout();
    // ⚔️ PV DU MONARQUE : le combat final utilise enfin le build du joueur.
    // Chaque exercice terminé retire des dégâts calculés selon la stat de l'acte.
    const hpMax = monarqueHP();
    const workout = {
      name: '👑 Le Monarque du Déclin',
      type: 'finalboss',
      _isFinalBoss: true,
      _bossHpMax: hpMax,
      _bossHp: hpMax,
      _bossImage: 'images/story/nabdano.webp',
      exercises: exercises,
      badgeHTML: '👑 COMBAT FINAL — Le Monarque du Déclin',
      badgeStyle: 'linear-gradient(135deg, #dc2626 0%, #7f1d1d 100%)'
    };
    // Utilise le pipeline de séance préparée existant
    if (typeof window.setPendingWorkout === 'function') {
      window.setPendingWorkout(workout);
    } else {
      window.pendingWorkout = workout;
    }
    // 🐛 L'écran PRÉPAREZ-VOUS (#preparationView) vit dans l'onglet ENTRAÎNER.
    // Le combat final se lance depuis l'onglet JEU : sans bascule d'onglet,
    // la séance était bien préparée… mais restait invisible. Rien ne semblait
    // se passer au clic.
    try { if (typeof switchTab === 'function') switchTab('workouts'); } catch (e) {}

    if (typeof window.showWorkoutPreparation === 'function') {
      window.showWorkoutPreparation(workout);
    } else if (typeof window.startPreparedWorkout === 'function') {
      window.pendingWorkout = workout;
      window.startPreparedWorkout();
    }
  }
  window.awakStartFinalBoss = startFinalBoss;

  // ⚔️ Applique les dégâts d'un exercice terminé au Monarque.
  // Appelé par app.js à la fin de chaque exercice du combat final.
  // C'est ici que le BUILD du joueur compte : la stat de l'acte domine (70 %),
  // la polyvalence complète (30 %) — un spécialisé écrase son acte et rame
  // ailleurs, un polyvalent avance régulièrement.
  function frapperMonarque(workout, exercice) {
    if (!workout || !workout._isFinalBoss || !exercice) return null;
    var acte = exercice._act || 'force';
    var unites = 1;
    if (exercice.mode === 'timer' && exercice.duration) unites = Math.max(1, exercice.duration / 30);
    else if (exercice.targetReps) unites = Math.max(1, exercice.targetReps / 12);
    var degats = actDamage(acte, unites);
    workout._bossHp = Math.max(0, (workout._bossHp || 0) - degats);
    return {
      degats: degats,
      hp: workout._bossHp,
      hpMax: workout._bossHpMax || 1,
      pct: Math.round((workout._bossHp / (workout._bossHpMax || 1)) * 100),
      vaincu: workout._bossHp <= 0,
      acte: acte,
      statLabel: (ACT_STATS[acte] || ACT_STATS.force).stat
    };
  }
  window.awakFrapperMonarque = frapperMonarque;


  // Marque le combat comme gagné (appelé à la complétion de la séance finalboss).
  function onFinalBossComplete() {
    localStorage.setItem(FINAL_DONE_KEY, '1');
  }
  window.awakOnFinalBossComplete = onFinalBossComplete;

  // Écran de victoire épique du combat final.
  function showFinalBossVictory() {
    document.getElementById('awakFinalVictoryOverlay')?.remove();
    const ov = document.createElement('div');
    ov.id = 'awakFinalVictoryOverlay';
    ov.style.cssText = 'position:fixed;inset:0;z-index:99999;display:flex;align-items:flex-start;justify-content:center;background:radial-gradient(ellipse at 50% 30%,#1a0e0e,#050507 70%);animation:awakFadeIn 0.8s;padding:20px;overflow-y:auto;-webkit-overflow-scrolling:touch;';
    ov.innerHTML = `
      <style>@keyframes fbCrown{0%,100%{transform:translateY(0) scale(1);text-shadow:0 0 30px rgba(251,191,36,0.6)}50%{transform:translateY(-8px) scale(1.05);text-shadow:0 0 60px rgba(251,191,36,0.9)}}
      @keyframes fbGlow{0%,100%{opacity:0.5}50%{opacity:1}}</style>
      <div style="max-width:440px;width:100%;margin:auto 0;text-align:center;">
        <div style="font-size:5em;margin-bottom:10px;animation:fbCrown 2.6s ease infinite;">👑</div>
        <div style="font-family:'Rajdhani',sans-serif;font-size:0.72em;letter-spacing:4px;color:#fbbf24;font-weight:700;animation:fbGlow 2s infinite;">LE MONARQUE DU DÉCLIN EST TOMBÉ</div>
        <h1 style="font-family:'Rajdhani',sans-serif;font-size:2.4em;font-weight:700;letter-spacing:3px;color:#fff;margin:10px 0 20px;text-shadow:0 0 40px rgba(251,191,36,0.5);">VICTOIRE</h1>
        <div style="background:linear-gradient(160deg,rgba(251,191,36,0.08),rgba(0,0,0,0.2));border:1px solid rgba(251,191,36,0.3);border-radius:16px;padding:22px 20px;margin-bottom:20px;text-align:left;">
          <p style="color:#e2e8f0;font-size:0.92em;line-height:1.7;margin:0 0 14px;font-style:italic;">« Il n'existe plus aucun mot pour décrire ce que tu es devenu. Le Déclin est vaincu. La limite, c'est désormais toi qui la fixes. »</p>
          <p style="color:#94a3b8;font-size:0.82em;line-height:1.6;margin:0;">Tu refermes la Faille derrière toi. Dehors, le monde est exactement le même — sauf qu'il ne s'efface plus.</p>
        </div>
        <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:16px;margin-bottom:20px;">
          <div style="font-size:0.7em;color:#fbbf24;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:6px;">Titre obtenu</div>
          <div style="font-family:'Rajdhani',sans-serif;font-size:1.4em;font-weight:700;color:#fff;">⚜️ Vainqueur du Déclin</div>

          <!-- 🕳️ EXPLICATION DES ABYSSES — le joueur vient de terminer l'histoire.
               Sans ce message, il ne sait pas qu'il reste du contenu et croit
               l'app finie. On explique la mécanique en deux phrases. -->
          <div style="background:linear-gradient(160deg,rgba(139,92,246,0.10),rgba(0,0,0,0.2));border:1px solid rgba(139,92,246,0.35);border-radius:14px;padding:16px;margin-top:14px;text-align:left;">
            <div style="display:flex;align-items:center;gap:9px;margin-bottom:9px;">
              <span style="font-size:1.6em;">🕳️</span>
              <div>
                <div style="font-size:0.62em;color:#a78bfa;font-weight:900;letter-spacing:1.5px;">NOUVEAU — SANS FIN</div>
                <div style="font-family:'Rajdhani',sans-serif;font-size:1.25em;font-weight:700;color:#fff;">Les Abysses s'ouvrent</div>
              </div>
            </div>
            <p style="color:#cbd5e1;font-size:0.82em;line-height:1.65;margin:0 0 10px;">
              Là où le Monarque est tombé, la Faille ne s'est jamais refermée. Elle descend.
            </p>
            <p style="color:#94a3b8;font-size:0.78em;line-height:1.6;margin:0 0 10px;">
              Chaque palier est plus profond — et plus résistant — que le précédent. Il n'y a pas de dernier étage :
              la seule question est de savoir jusqu'où ton build peut aller.
            </p>
            <div style="font-size:0.74em;color:#a78bfa;line-height:1.55;">
              ◈ Un nouveau palier apparaît dès que tu fermes le précédent<br>
              ◈ Ta profondeur maximale devient ton record<br>
              ◈ Le butin s'améliore à mesure que tu descends
            </div>
          </div>
        </div>
        <button onclick="document.getElementById('awakFinalVictoryOverlay').remove();if(typeof switchTab==='function')switchTab('game');" style="width:100%;padding:16px;background:linear-gradient(135deg,#fbbf24,#dc2626);border:none;border-radius:14px;color:#1a0e0e;font-family:'Rajdhani',sans-serif;font-size:1em;font-weight:900;letter-spacing:2px;cursor:pointer;text-transform:uppercase;box-shadow:0 8px 30px rgba(251,191,36,0.3);">Retour</button>
      </div>`;
    document.body.appendChild(ov);
    try { if (typeof hapticTap === 'function') hapticTap([60,40,60,40,60,40,200]); } catch(e) {}
    try { if (typeof launchConfetti === 'function') launchConfetti(); } catch(e) {}
  }
  window.awakShowFinalBossVictory = showFinalBossVictory;

  // Affiche un beat narratif du combat final en plein écran (lignes paginées),
  // puis appelle onDone() quand le joueur a tout lu.
  function showFinalStoryBeat(beat, onDone) {
    document.getElementById('awakFinalStoryOverlay')?.remove();
    const color = beat._color || '#dc2626';
    const lines = beat.instructions || [];
    let i = 0;
    const ov = document.createElement('div');
    ov.id = 'awakFinalStoryOverlay';
    ov.style.cssText = 'position:fixed;inset:0;z-index:99997;display:flex;align-items:flex-start;justify-content:center;background:radial-gradient(ellipse at 50% 25%,' + color + '18,#050507 70%);backdrop-filter:blur(8px);animation:awakFadeIn 0.5s;padding:20px;overflow-y:auto;-webkit-overflow-scrolling:touch;';

    function render() {
      const isLast = i >= lines.length - 1;
      ov.innerHTML = `
        <div style="max-width:440px;width:100%;margin:auto 0;text-align:center;">
          <div style="font-family:'Rajdhani',sans-serif;font-size:1.5em;font-weight:700;letter-spacing:2px;color:${color};margin-bottom:24px;text-shadow:0 0 30px ${color}66;">${beat.name}</div>
          <p style="color:#e2e8f0;font-size:1em;line-height:1.75;margin:0 0 28px;min-height:120px;animation:awakFadeIn 0.4s;">${lines[i] || ''}</p>
          <div style="display:flex;align-items:center;justify-content:center;gap:6px;margin-bottom:20px;">
            ${lines.map((_, k) => `<div style="width:7px;height:7px;border-radius:50%;background:${k === i ? color : 'rgba(255,255,255,0.2)'};"></div>`).join('')}
          </div>
          <button id="fbStoryNext" style="width:100%;padding:15px;background:linear-gradient(135deg,${color},${color}cc);border:none;border-radius:14px;color:#fff;font-family:'Rajdhani',sans-serif;font-weight:900;font-size:0.95em;letter-spacing:2px;cursor:pointer;text-transform:uppercase;box-shadow:0 6px 24px ${color}40;">${isLast ? '⚔ Commencer' : 'Continuer ›'}</button>
        </div>`;
      ov.querySelector('#fbStoryNext').onclick = function () {
        if (i < lines.length - 1) { i++; render(); }
        else { ov.remove(); if (onDone) onDone(); }
      };
    }
    render();
    document.body.appendChild(ov);
    try { if (typeof hapticTap === 'function') hapticTap([40]); } catch (e) {}
  }
  window.awakShowFinalStoryBeat = showFinalStoryBeat;

})();
