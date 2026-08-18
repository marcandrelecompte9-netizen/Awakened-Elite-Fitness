/* ============================================================================
 *  AWAKENED — 🌅 PARCOURS DE L'ÉVEIL
 *  Accompagnement A→Z d'un débutant complet sur 4 semaines :
 *  entraînement + sommeil + repas + rythme de vie, personnalisé par un
 *  questionnaire à l'inscription, fondé sur des principes documentés :
 *    • Habitudes : commencer PETIT et une à la place à la fois
 *      (formation d'habitude ≈ 66 jours en moyenne, Lally et al. 2010 ;
 *      approche « tiny habits », BJ Fogg).
 *    • Sommeil : 7-9 h recommandées (National Sleep Foundation) ; la
 *      RÉGULARITÉ des horaires compte autant que la durée ; décaler le
 *      coucher progressivement (~30 min) plutôt que brutalement.
 *    • Activité : la marche quotidienne (NEAT) est le levier n°1 des
 *      débutants ; 2-3 séances courtes full-body suffisent pour progresser
 *      (surcharge progressive douce).
 *    • Repas : viser une source de protéines à chaque repas (~1,6 g/kg/j
 *      pour la recomposition, Morton et al. 2018) et des légumes à 2 repas,
 *      plutôt que compter les calories (adhérence > précision).
 *
 *  🧒 PROFILS ENFANTS (< 13 ans) : les leçons hebdomadaires sont remplacées
 *  par LESSONS_CHILD. Le parcours adulte enseigne la surcharge progressive et
 *  un objectif protéique chiffré — deux notions à ne PAS transmettre à un
 *  enfant. La version enfant garde les mêmes 4 semaines et les mêmes séances
 *  (déjà au poids du corps), mais parle de variété, de sommeil et d'écoute de
 *  la faim plutôt que de charge et de grammes.
 *
 *  AUCUNE imposition : le parcours est proposé à l'inscription, activable
 *  et abandonnable à tout moment. Stockage : localStorage 'awakEveilJourney'.
 * ========================================================================== */
(function (global) {
  'use strict';

  var LS_KEY = 'awakEveilJourney';
  var DAY = 24 * 60 * 60 * 1000;

  function _get() {
    try { return JSON.parse(localStorage.getItem(LS_KEY) || 'null'); } catch (e) { return null; }
  }
  function _save(j) { try { localStorage.setItem(LS_KEY, JSON.stringify(j)); } catch (e) {} }
  function _todayKey() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function _toast(m, t, d) { if (typeof global.showToast === 'function') global.showToast(m, t || 'info', d || 3000); }

  // ── QUESTIONNAIRE ──────────────────────────────────────────────────────
  var QUESTIONS = [
    { id: 'exp',    q: 'As-tu déjà fait du sport régulièrement ?', opts: [['jamais', '🌱 Jamais vraiment'], ['longtemps', '⏳ Il y a longtemps'], ['recent', '💪 Un peu récemment']] },
    { id: 'days',   q: 'Combien de jours par semaine peux-tu bouger ?', opts: [['2', '2 jours'], ['3', '3 jours'], ['4', '4 jours']] },
    { id: 'moment', q: 'Quel moment de la journée te convient le mieux ?', opts: [['matin', '🌅 Le matin'], ['midi', '☀️ Le midi'], ['soir', '🌆 Le soir']] },
    { id: 'work',   q: 'Tes horaires de travail / d\'occupation ?', opts: [['jour', '🏢 De jour'], ['soir', '🌃 De soir'], ['nuit', '🌙 De nuit'], ['variable', '🔀 Variables']] },
    { id: 'kids',   q: 'Des enfants à la maison ?', opts: [['non', 'Non'], ['bebe', '👶 Oui, en bas âge (0-3 ans)'], ['enfants', '🧒 Oui, jeunes (4-12 ans)'], ['ados', '🧑 Oui, des ados']] },
    { id: 'dodo',   q: 'Tu te couches habituellement vers…', opts: [['avant22', 'Avant 22 h'], ['22-23', '22 h – 23 h'], ['23-24', '23 h – minuit'], ['apres24', 'Après minuit']] },
    { id: 'reveil', q: 'Au réveil, tu te sens généralement…', opts: [['repose', '😊 Reposé(e)'], ['moyen', '😐 Moyen'], ['fatigue', '🥱 Fatigué(e)']] },
    { id: 'gout',   q: 'Qu\'est-ce qui t\'attire le plus ?', opts: [['cardio', '🏃 Bouger, cardio'], ['renfo', '💪 Me renforcer'], ['deux', '⚡ Les deux'], ['sais-pas', '🤷 Je ne sais pas encore']] },
    { id: 'repas',  q: 'Côté repas, ton plus gros défi ?', opts: [['saute', '⏭️ Je saute des repas'], ['grignote', '🍪 Je grignote beaucoup'], ['peu', '🥦 Peu de légumes / protéines'], ['ok', '👍 Ça va plutôt bien']] },
    // Intention d'implémentation (Gollwitzer 1999) : lier l'action à un déclencheur
    // concret du quotidien double environ le taux de passage à l'acte.
    { id: 'anchor', q: 'Dernière chose. Ta séance viendra juste après…', opts: [['reveil', '⏰ Mon réveil'], ['cafe', '☕ Mon café du matin'], ['lunch', '🍽️ Le dîner'], ['travail', '🏢 La fin du travail'], ['souper', '🌆 Le souper']] }
  ];
  var ANCHOR_LABELS = { reveil: 'ton réveil', cafe: 'ton café du matin', lunch: 'le dîner', travail: 'la fin du travail', souper: 'le souper', 'dodo-enfants': 'le coucher des enfants' };

  // ── SÉANCES (noms EXACTEMENT canoniques — vérifiés contre exercises.js) ─
  // Progression douce : durées et exigence qui montent semaine par semaine.
  var SESSIONS = {
    1: { title: 'Fondations', items: [
      ['Marche sur place', 90], ['Squats poids corps légers', 35], ['Pompes genoux lentes', 30],
      ['Glute bridge léger', 35], ['Planche courte', 20], ['Dead bug lent', 35]] },
    2: { title: 'Prise de rythme', items: [
      ['Marche sur place', 90], ['Squat classique', 40], ['Pompes genoux lentes', 35],
      ['Glute Bridge', 40], ['Planche', 25], ['Superman', 35]] },
    3: { title: 'Montée en puissance', items: [
      ['Jumping jacks', 45], ['Squat classique', 45], ['Pompes classiques', 35],
      ['Fentes arrière', 45], ['Planche', 30], ['Dead bug', 40], ['Superman', 40]] },
    4: { title: 'Nouveau départ', items: [
      ['High knees', 45], ['Squat classique', 50], ['Pompes classiques', 40],
      ['Fentes arrière', 50], ['Mountain climbers', 35], ['Planche', 35], ['Glute Bridge', 45], ['Superman', 40]] }
  };
  // Variante selon le goût : cardio → un item dynamique de plus en ouverture.
  var CARDIO_OPENERS = { 1: ['Montées de genoux sur place', 30], 2: ['Jumping jacks', 35], 3: ['High knees', 40], 4: ['Jumping jacks', 45] };

  // ── QUÊTES D'HABITUDES (introduites progressivement : 2 en S1 → 4 en S4,
  //    car changer UNE chose à la fois tient mieux que tout changer d'un coup) ─
  function _buildQuests(a) {
    var q = [];
    // 1. Sommeil — toujours en premier : c'est le multiplicateur de tout le reste.
    var lateOrTired = (a.dodo === 'apres24' || a.dodo === '23-24' || a.reveil === 'fatigue');
    if (a.kids === 'bebe') {
      // 👶 Sommeil fragmenté : « couche-toi plus tôt » est inapplicable.
      // La science du sommeil parental : maximiser la FENÊTRE totale, siestes incluses.
      q.push({ id: 'sleep', emoji: '👶', label: 'Récupérer dès que possible (sieste comptée !)', week: 1 });
    } else if (a.work === 'nuit') {
      q.push({ id: 'sleep', emoji: '🌙', label: 'Dormir dans le noir complet (rideaux/masque)', week: 1 });
    } else if (lateOrTired) {
      q.push({ id: 'sleep', emoji: '🛏️', label: 'Me coucher 30 min plus tôt que d\'habitude', week: 1 });
    } else {
      q.push({ id: 'sleep', emoji: '🛏️', label: 'Garder la même heure de coucher (±30 min)', week: 1 });
    }
    // 2. Repas — ciblé sur LE défi déclaré.
    var mealMap = {
      saute:   { emoji: '🍽️', label: 'Prendre 3 vrais repas aujourd\'hui' },
      grignote:{ emoji: '🍎', label: 'Prévoir 1 collation saine (fruit, yogourt, noix)' },
      peu:     { emoji: '🥦', label: 'Protéines + légumes à 2 repas' },
      ok:      { emoji: '💧', label: 'Boire 1,5 à 2 L d\'eau' }
    };
    var m = mealMap[a.repas] || mealMap.ok;
    q.push({ id: 'meal', emoji: m.emoji, label: m.label, week: 1 });
    // 3. Marche (semaine 2+) — avec les enfants si présents : l'activité
    // parent-enfant est un des meilleurs prédicteurs d'adhérence des deux.
    if (a.kids === 'bebe') {
      q.push({ id: 'walk', emoji: '👶', label: 'Marcher 20 min (la poussette compte !)', week: 2 });
    } else if (a.kids === 'enfants') {
      q.push({ id: 'walk', emoji: '🚶', label: 'Sortir 20 min avec les enfants (marche, parc, jeu)', week: 2 });
    } else {
      q.push({ id: 'walk', emoji: '🚶', label: 'Marcher 20 min (dehors si possible)', week: 2 });
    }
    // 4. Semaine 3+ — la 4e habitude selon le profil.
    if (a.dodo === 'apres24' || a.reveil === 'fatigue') {
      q.push({ id: 'screen', emoji: '📵', label: 'Écrans éteints 30 min avant le coucher', week: 3 });
    } else if (a.kids === 'enfants' || a.kids === 'ados') {
      q.push({ id: 'family', emoji: '🤸', label: '10 min de jeu actif en famille', week: 3 });
    } else if (a.repas !== 'ok') {
      q.push({ id: 'water', emoji: '💧', label: 'Boire 1,5 à 2 L d\'eau', week: 3 });
    } else {
      q.push({ id: 'veg', emoji: '🥗', label: 'Des légumes à 2 repas', week: 3 });
    }
    return q;
  }

  // ── MINI-LEÇONS HEBDO (le « pourquoi » scientifique, en 4 phrases) ──────
  // ══════════════════════════════════════════════════════════════════
  // 🧒 LEÇONS ENFANT (< 13 ans)
  // ------------------------------------------------------------------
  // Le parcours adulte enseigne la SURCHARGE PROGRESSIVE et un objectif
  // protéique chiffré (1,6 g/kg). Deux notions calibrées pour un adulte
  // qui cherche l'hypertrophie — et deux mauvaises idées à transmettre à
  // un enfant : on ne l'oriente pas vers l'augmentation de charge, et on
  // ne lui donne pas d'objectif alimentaire quantifié.
  // Mêmes 4 semaines, même mécanique : seul le CONTENU change.
  // ══════════════════════════════════════════════════════════════════
  var LESSONS_CHILD = {
    1: { t: '🌱 Un peu, tous les jours',
         b: 'Le secret, ce n\'est pas de faire beaucoup d\'un coup : c\'est de revenir souvent. Même 10 minutes comptent. Ton corps aime les habitudes régulières bien plus que les grosses journées suivies de rien.' },
    2: { t: '😴 Tu grandis pendant que tu dors',
         b: 'C\'est la nuit que ton corps répare et construit. Le sommeil est ton meilleur allié — encore plus à ton âge qu\'à celui des adultes. Vise des nuits complètes et régulières.' },
    3: { t: '🍎 Mange de tout, à ta faim',
         b: 'Pas de calcul, pas de régime : ton corps grandit et il a besoin d\'un peu de tout. Des fruits, des légumes, des féculents, des protéines. Écoute ta faim — elle sait ce qu\'elle fait.' },
    4: { t: '🤸 Varier vaut mieux que forcer',
         b: 'Tu progresses en essayant des mouvements NOUVEAUX, pas en soulevant plus lourd. Cours, saute, grimpe, joue. Plus tu varies, plus tu deviens agile, rapide et solide.' }
  };

  var LESSONS = {
    1: { t: '🌱 Petit mais tous les jours', b: 'Une habitude met en moyenne environ 66 jours à devenir automatique (étude de Lally, 2010). C\'est pour ça qu\'on commence volontairement petit : des séances courtes et 2 habitudes seulement. Rater un jour ne casse rien — c\'est la répétition sur la durée qui compte. Ton seul objectif cette semaine : te présenter.' },
    2: { t: '😴 Le muscle se construit la nuit', b: 'Pendant le sommeil profond, ton corps sécrète l\'hormone de croissance qui répare muscles et tissus. Vise 7 à 9 heures, mais surtout des horaires RÉGULIERS : se coucher à heure fixe compte autant que la durée. Un coucher décalé de 30 min à la fois est bien plus tenable qu\'un changement brutal. Bien dormir, c\'est déjà s\'entraîner.' },
    3: { t: '🥩 Les protéines, tes briques', b: 'Pour construire ou garder du muscle, la recherche converge vers ~1,6 g de protéines par kilo de poids par jour (méta-analyse de Morton, 2018). Le plus simple : une source de protéines à CHAQUE repas — œufs, poulet, poisson, tofu, légumineuses, yogourt grec. Les protéines rassasient aussi plus longtemps, ce qui calme les fringales. Pas besoin de compter les calories : compose des assiettes équilibrées.' },
    4: { t: '📈 La surcharge progressive', b: 'Ton corps s\'adapte à ce qu\'on lui demande : pour continuer à progresser, il faut augmenter PETIT à petit — une répétition, quelques secondes, un peu plus de contrôle. C\'est le principe de surcharge progressive, la base de tout entraînement efficace. Ces 4 semaines t\'ont lancé — mais souviens-toi : une habitude s\'ancre vers ~66 jours. Tu as posé les fondations, et la suite se construit dans le plan hebdomadaire qui prend le relais avec ce principe intégré. Tu n\'es plus un débutant : tu es en chemin.' }
  };

  // ── ÉTAT & CYCLE DE VIE ────────────────────────────────────────────────
  // 🧒 Renvoie le jeu de leçons adapté à l'âge du profil actif.
  function _lessons() {
    try {
      if (window.AwakYouth && typeof window.AwakYouth.isChild === 'function' && window.AwakYouth.isChild()) {
        return LESSONS_CHILD;
      }
    } catch (e) {}
    return LESSONS;
  }

  function eveilActive() { var j = _get(); return !!(j && j.active); }
  function eveilDayNum(j) { return Math.floor((Date.now() - j.start) / DAY) + 1; }        // 1-28+
  function eveilWeek(j) { return Math.min(4, Math.floor((eveilDayNum(j) - 1) / 7) + 1); } // 1-4
  function eveilDone(j) { return eveilDayNum(j) > 28; }

  function eveilStart(answers) {
    var days = { '2': [1, 4], '3': [1, 3, 5], '4': [1, 3, 5, 6] }[answers.days] || [1, 3, 5]; // jours ISO (lun=1)
    _save({
      active: true, start: Date.now(), answers: answers,
      workDays: days, quests: _buildQuests(answers), checks: {}, sessionsDone: {}
    });
    _toast('🌅 Parcours de l\'Éveil commencé — 4 semaines, on avance ensemble', 'success', 4500);
    if (typeof global.updateHomeStats === 'function') global.updateHomeStats();
  }
  function eveilStop() {
    var j = _get(); if (j) { j.active = false; _save(j); }
    _toast('Parcours de l\'Éveil arrêté. Tu peux le relancer en recréant un profil.', 'info', 3500);
    if (typeof global.updateHomeStats === 'function') global.updateHomeStats();
  }

  // Prolonger en douceur : la personne ne se sent pas encore prête à passer
  // au plan hebdomadaire. On recule le départ de 2 semaines → elle repasse
  // en semaine 3 (séances qui progressent, mais toujours accompagnées).
  function eveilExtend() {
    var j = _get(); if (!j) return;
    j.start = (j.start || Date.now()) + 14 * DAY;   // recule → retour en semaine 3
    j.extended = (j.extended || 0) + 1;
    _save(j);
    _toast('🌱 2 semaines de plus, à ton rythme. Rien ne presse — on continue ensemble.', 'success', 4000);
    if (typeof global.updateHomeStats === 'function') global.updateHomeStats();
  }

  // ── OFFRE À L'INSCRIPTION ──────────────────────────────────────────────
  function eveilMaybeOffer() {
    if (eveilActive()) return;
    if (localStorage.getItem('awakEveilOffered') === '1') return;
    localStorage.setItem('awakEveilOffered', '1');
    var ov = document.createElement('div');
    ov.id = 'eveilOfferModal';
    ov.style.cssText = 'position:fixed;inset:0;background:rgba(4,6,12,0.88);backdrop-filter:blur(6px);z-index:10050;display:flex;align-items:center;justify-content:center;padding:20px;';
    ov.innerHTML = '<div style="max-width:400px;width:100%;background:linear-gradient(165deg,#0F1014,#141826);border:1px solid rgba(168,85,247,0.35);border-radius:20px;padding:26px 22px;text-align:center;">'
      + '<div style="font-size:2.6em;">🌅</div>'
      + '<h3 style="margin:10px 0 8px;color:#fff;font-size:1.15em;">Le Parcours de l\'Éveil</h3>'
      + '<p style="margin:0 0 6px;color:#cbd5e1;font-size:0.85em;line-height:1.5;">Nouveau dans l\'entraînement ? Pendant <strong>4 semaines</strong>, je t\'accompagne de A à Z : séances toutes simples qui progressent, sommeil, repas, rythme de vie.</p>'
      + '<p style="margin:0 0 18px;color:#94a3b8;font-size:0.75em;line-height:1.45;">Quelques questions sur ton quotidien, et tout est construit pour TOI. Fondé sur des principes documentés, jamais imposé.</p>'
      + '<button onclick="awakEveilStartQuestionnaire()" style="width:100%;background:linear-gradient(135deg,#a855f7,#7c3aed);border:none;color:#fff;border-radius:12px;padding:13px;font-size:0.92em;font-weight:800;cursor:pointer;margin-bottom:9px;">✨ Je commence l\'Éveil</button>'
      + '<button onclick="document.getElementById(\'eveilOfferModal\').remove()" style="width:100%;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.13);color:#94a3b8;border-radius:12px;padding:11px;font-size:0.82em;font-weight:700;cursor:pointer;">Je connais déjà, non merci</button>'
      + '</div>';
    document.body.appendChild(ov);
  }

  // ── QUESTIONNAIRE (assistant plein écran, une question à la fois) ──────
  function eveilStartQuestionnaire() {
    var old = document.getElementById('eveilOfferModal'); if (old) old.remove();
    var oldQ = document.getElementById('eveilQuizModal'); if (oldQ) oldQ.remove();
    var answers = {}; var idx = 0;
    var ov = document.createElement('div');
    ov.id = 'eveilQuizModal';
    ov.style.cssText = 'position:fixed;inset:0;background:rgba(4,6,12,0.92);backdrop-filter:blur(6px);z-index:10050;display:flex;align-items:center;justify-content:center;padding:20px;';
    document.body.appendChild(ov);

    function render() {
      var Q = QUESTIONS[idx];
      var opts = Q.opts.slice();
      // 👨‍👧 Parents de jeunes enfants : le coucher des enfants est souvent
      // LE créneau réaliste — on l'ajoute comme ancre possible.
      if (Q.id === 'anchor' && (answers.kids === 'bebe' || answers.kids === 'enfants')) {
        opts.push(['dodo-enfants', '🌙 Le coucher des enfants']);
      }
      var pct = Math.round(idx / QUESTIONS.length * 100);
      ov.innerHTML = '<div style="max-width:400px;width:100%;background:linear-gradient(165deg,#0F1014,#141826);border:1px solid rgba(168,85,247,0.3);border-radius:20px;padding:24px 22px;">'
        + '<div style="height:5px;background:rgba(255,255,255,0.07);border-radius:4px;overflow:hidden;margin-bottom:18px;"><div style="height:100%;width:' + pct + '%;background:linear-gradient(90deg,#a855f7,#7c3aed);border-radius:4px;transition:width 0.3s;"></div></div>'
        + '<div style="font-size:0.68em;color:#a855f7;font-weight:800;letter-spacing:1px;margin-bottom:6px;">QUESTION ' + (idx + 1) + ' / ' + QUESTIONS.length + '</div>'
        + '<h3 style="margin:0 0 16px;color:#fff;font-size:1.02em;line-height:1.35;">' + Q.q + '</h3>'
        + '<div style="display:grid;gap:9px;">'
        + opts.map(function (o) {
            return '<button data-val="' + o[0] + '" style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.13);color:#e2e8f0;border-radius:12px;padding:13px 14px;font-size:0.88em;font-weight:700;cursor:pointer;text-align:left;transition:border-color 0.2s;">' + o[1] + '</button>';
          }).join('')
        + '</div>'
        + (idx > 0 ? '<button id="eveilQuizBack" style="margin-top:14px;background:none;border:none;color:#64748b;font-size:0.78em;cursor:pointer;">← Retour</button>' : '')
        + '</div>';
      ov.querySelectorAll('button[data-val]').forEach(function (b) {
        b.onclick = function () {
          answers[Q.id] = b.getAttribute('data-val');
          idx++;
          if (idx >= QUESTIONS.length) { ov.remove(); eveilStart(answers); }
          else render();
        };
      });
      var back = document.getElementById('eveilQuizBack');
      if (back) back.onclick = function () { idx--; render(); };
    }
    render();
  }

  // ── SÉANCE DU JOUR ─────────────────────────────────────────────────────
  function _isWorkDay(j) {
    var iso = new Date().getDay(); iso = iso === 0 ? 7 : iso; // dim=7
    return j.workDays.indexOf(iso) >= 0;
  }
  // ── CHECK-IN QUOTIDIEN (1 tap) — intervention adaptative « au bon moment » :
  //    le ressenti du jour module gentiment la séance au lieu de l'imposer.
  function eveilSetMood(m) {
    var j = _get(); if (!j) return;
    j.mood = j.mood || {};
    j.mood[_todayKey()] = m;
    _save(j);
    var msgs = { good: '💪 Belle énergie — profites-en !', mid: '👍 Noté. On fait simple et bien.', tired: '🌿 Noté — la séance du jour sera adoucie. Même 10 minutes comptent.' };
    _toast(msgs[m] || 'Noté !', 'info', 2800);
    var el = document.getElementById('eveilJourneyCard');
    if (el) el.innerHTML = eveilRenderHomeCard();
  }
  function _todayMood(j) { return (j.mood || {})[_todayKey()] || null; }

  // ── MODE SILENCIEUX 🤫 ─────────────────────────────────────────────────
  // Quand la séance se fait après le coucher des enfants (ancre
  // « dodo-enfants ») ou qu'un bébé dort à toute heure dans le logement,
  // les exercices à IMPACTS (sauts, course sur place) sont remplacés par
  // des équivalents au sol, sans bruit — même stimulus, zéro réveil.
  var QUIET_SWAPS = {
    'Jumping jacks': 'Marche sur place',
    'High knees': 'Mountain climbers',
    'Montées de genoux sur place': 'Dead bug'
  };
  // Détection automatique (contexte enfants)…
  function _quietAuto(j) {
    return j.answers.anchor === 'dodo-enfants' || j.answers.kids === 'bebe';
  }
  // …mais l'utilisateur garde le dernier mot (pièce insonorisée, sous-sol,
  // maison de plain-pied…) : quietOff=true désactive les remplacements.
  function _quietMode(j) {
    return _quietAuto(j) && j.quietOff !== true;
  }
  function eveilToggleQuiet() {
    var j = _get(); if (!j) return;
    j.quietOff = !j.quietOff;
    _save(j);
    _toast(j.quietOff ? '🔊 Sauts autorisés — séances complètes rétablies' : '🤫 Mode silencieux réactivé', 'info', 2800);
    var el = document.getElementById('eveilJourneyCard');
    if (el) el.innerHTML = eveilRenderHomeCard();
  }
  function _applyQuiet(items, j) {
    if (!_quietMode(j)) return items;
    var seen = {};
    var out = [];
    items.forEach(function (it) {
      var name = QUIET_SWAPS[it[0]] || it[0];
      if (seen[name]) return; // dédupliquer si le remplacement crée un doublon
      seen[name] = 1;
      out.push([name, it[1]]);
    });
    return out;
  }

  function _buildTodayWorkout(j) {
    var wk = eveilWeek(j);
    var spec = SESSIONS[wk];
    var db = global.exerciseDatabase || [];
    var items = spec.items.slice();
    if (j.answers.gout === 'cardio') items.splice(1, 0, CARDIO_OPENERS[wk]);
    items = _applyQuiet(items, j);
    // 🎚️ Expérience : module l'intensité de départ (±15 % sur les durées).
    // « jamais » = plus doux, « un peu récemment » = un cran au-dessus.
    var expMult = { jamais: 0.85, longtemps: 1.0, recent: 1.15 }[j.answers.exp] || 1.0;
    // 🥱 Fatigué aujourd'hui → séance adoucie de 15 % (adhérence > perfection)
    if (_todayMood(j) === 'tired') expMult *= 0.85;
    var exercises = [];
    items.forEach(function (it) {
      var base = db.find(function (e) { return e.name === it[0]; });
      var ex = base ? JSON.parse(JSON.stringify(base)) : { name: it[0], muscle: 'Corps entier', type: 'exercise', instructions: [], equipment: ['Poids du corps'] };
      ex.duration = Math.round(it[1] * expMult / 5) * 5;
      exercises.push(ex);
    });
    return {
      name: '🌅 Éveil S' + wk + ' · ' + spec.title + (_quietMode(j) ? ' 🤫' : ''),
      exercises: exercises,
      mode: 'timer', restBetweenSets: wk <= 2 ? 40 : 30,
      type: 'eveil', _eveil: true,
      badgeHTML: '🌅 Éveil — Semaine ' + wk, badgeColor: '#a855f7',
      badgeStyle: 'linear-gradient(135deg,#a855f7,#7c3aed)'
    };
  }
  // ── SÉANCE EN FAMILLE (bonus jour de repos — ne valide PAS le jour) ────
  // Format « qui tient le plus longtemps ? » : les mêmes mouvements simples,
  // mais présentés comme un jeu. L'activité parent-enfant partagée est un
  // des meilleurs prédicteurs d'activité durable pour les deux.
  var FAMILY_ITEMS = [['Jumping jacks', 30], ['Squat classique', 30], ['High knees', 30], ['Mountain climbers', 25], ['Planche', 20], ['Superman', 25]];
  function eveilLaunchFamily() {
    var j = _get(); if (!j || !j.active) return;
    var db = global.exerciseDatabase || [];
    var exercises = FAMILY_ITEMS.map(function (it) {
      var base = db.find(function (e) { return e.name === it[0]; });
      var ex = base ? JSON.parse(JSON.stringify(base)) : { name: it[0], muscle: 'Corps entier', type: 'exercise', instructions: [], equipment: ['Poids du corps'] };
      ex.duration = it[1];
      return ex;
    });
    var w = {
      name: '🤸 Séance en famille · Qui tient le plus longtemps ?',
      exercises: exercises, mode: 'timer', restBetweenSets: 20,
      type: 'eveil-family',
      badgeHTML: '👨‍👧 En famille', badgeColor: '#f59e0b',
      badgeStyle: 'linear-gradient(135deg,#f59e0b,#d97706)'
    };
    if (typeof global.switchTab === 'function') global.switchTab('workouts');
    setTimeout(function () {
      if (typeof global.showWorkoutPreparation === 'function') global.showWorkoutPreparation(w);
    }, 120);
  }

  function eveilLaunchToday() {
    var j = _get(); if (!j || !j.active) return;
    var w = _buildTodayWorkout(j);
    global._awakEveilPending = _todayKey();
    if (typeof global.switchTab === 'function') global.switchTab('workouts');
    setTimeout(function () {
      if (typeof global.showWorkoutPreparation === 'function') global.showWorkoutPreparation(w);
      else if (typeof global.startCustomWorkoutObject === 'function') global.startCustomWorkoutObject(w);
    }, 120);
  }
  // Appelé par app.js à la fin d'une séance _eveil (validation du jour).
  function eveilOnWorkoutComplete() {
    var j = _get(); if (!j || !j.active) return;
    var k = global._awakEveilPending || _todayKey();
    global._awakEveilPending = null;
    j.sessionsDone[k] = true; _save(j);
    setTimeout(function () { _toast('🌅 Séance de l\'Éveil validée — jour ' + eveilDayNum(j) + ' / 28', 'success', 4000); }, 1800);
  }

  // ── QUÊTES DU JOUR ─────────────────────────────────────────────────────
  function eveilToggleQuest(qid) {
    var j = _get(); if (!j) return;
    var k = _todayKey();
    j.checks[k] = j.checks[k] || {};
    j.checks[k][qid] = !j.checks[k][qid];
    _save(j);
    var el = document.getElementById('eveilJourneyCard');
    if (el) el.innerHTML = eveilRenderHomeCard();
  }
  function _isoWeekKey(d) {
    // Clé année-semaine ISO simple (suffisante pour distinguer des semaines voisines)
    var t = new Date(d); t.setHours(0, 0, 0, 0);
    t.setDate(t.getDate() + 3 - ((t.getDay() + 6) % 7)); // jeudi de la semaine
    var y = t.getFullYear();
    var w = Math.ceil(((t - new Date(y, 0, 1)) / DAY + 1) / 7);
    return y + '-' + w;
  }
  // 🧊 GEL DE SÉRIE : rater UN jour par semaine ne casse pas la flamme
  // (aversion à la perte sans le piège du « tout perdu » — leçon Duolingo).
  // Calcul rétroactif et sans état : déterministe à chaque rendu.
  function _questStreak(j, qid) {
    var s = 0; var frozen = false;
    var freezeUsedWeeks = {};
    for (var i = 0; i < 60; i++) {
      var d = new Date(Date.now() - i * DAY);
      var k = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      if (j.checks[k] && j.checks[k][qid]) { s++; continue; }
      if (i === 0) continue;               // aujourd'hui pas encore coché ne casse rien
      var wk = _isoWeekKey(d);
      if (!freezeUsedWeeks[wk]) {          // 1 joker par semaine calendaire
        freezeUsedWeeks[wk] = true;
        frozen = true;
        continue;                          // jour gelé : ne compte pas, ne casse pas
      }
      break;                               // 2e jour raté la même semaine → fin de série
    }
    return { n: s, frozen: frozen };
  }

  // ── CARTE HOME ─────────────────────────────────────────────────────────
  function eveilRenderHomeCard() {
    var j = _get();
    if (!j || !j.active) return '';
    var day = eveilDayNum(j), wk = eveilWeek(j);
    // Parcours terminé → carte de fin + passage de relais
    if (eveilDone(j)) {
      return '<div style="background:linear-gradient(135deg,rgba(168,85,247,0.16),rgba(124,58,237,0.05));border:1px solid rgba(168,85,247,0.45);border-radius:16px;padding:18px;margin-bottom:15px;text-align:center;">'
        + '<div style="font-size:2.2em;">🎓</div>'
        + '<div style="font-weight:900;color:#fff;margin:6px 0 4px;">Le lancement est réussi</div>'
        + '<div style="font-size:0.78em;color:#cbd5e1;line-height:1.5;margin-bottom:14px;">4 semaines de constance — le plus dur est derrière toi. Une habitude s\'ancre vraiment vers ~66 jours : tu es à mi-chemin, et l\'app continue de t\'accompagner. Le plan hebdomadaire prend le relais avec la surcharge progressive.</div>'
        + '<div style="font-size:0.72em;color:#a855f7;font-weight:700;margin-bottom:10px;">Tu te sens prêt·e à voler de tes propres ailes ?</div>'
        + '<button onclick="awakEveilStop()" style="background:linear-gradient(135deg,#a855f7,#7c3aed);border:none;color:#fff;border-radius:11px;padding:11px 18px;font-size:0.85em;font-weight:800;cursor:pointer;width:100%;margin-bottom:8px;">✨ Je suis prêt·e — passer au plan hebdo</button>'
        + '<button onclick="awakEveilExtend()" style="background:rgba(255,255,255,0.04);border:1px solid rgba(168,85,247,0.4);color:#e2e8f0;border-radius:11px;padding:10px 18px;font-size:0.8em;font-weight:700;cursor:pointer;width:100%;">🌱 Pas encore — 2 semaines de plus, à mon rythme</button>'
        + '<div style="font-size:0.66em;color:#64748b;line-height:1.45;margin-top:9px;">Aucune pression : prolonger est tout aussi valable. Certains ont besoin de plus de temps, et c\'est parfaitement normal.</div>'
        + '</div>';
    }
    var isWork = _isWorkDay(j);
    var doneToday = !!j.sessionsDone[_todayKey()];
    var quests = j.quests.filter(function (q) { return q.week <= wk; });
    var checks = j.checks[_todayKey()] || {};
    var lesson = _lessons()[wk];   // 🧒 jeu de leçons adapté à l'âge
    var lessonSeen = j['lessonSeen' + wk];

    var questHTML = quests.map(function (q) {
      var on = !!checks[q.id];
      var st = _questStreak(j, q.id);
      var flame = st.n >= 2 ? '<span style="font-size:0.68em;color:#f59e0b;font-weight:800;flex-shrink:0;">🔥' + st.n + (st.frozen ? '🧊' : '') + '</span>' : '';
      return '<div onclick="awakEveilToggleQuest(\'' + q.id + '\')" style="display:flex;align-items:center;gap:10px;padding:9px 11px;background:rgba(255,255,255,' + (on ? '0.02' : '0.045') + ');border:1px solid ' + (on ? 'rgba(168,85,247,0.4)' : 'rgba(255,255,255,0.09)') + ';border-radius:11px;cursor:pointer;margin-bottom:7px;">'
        + '<div style="width:22px;height:22px;border-radius:7px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:0.75em;font-weight:900;' + (on ? 'background:#a855f7;color:#fff;' : 'background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.18);color:transparent;') + '">✓</div>'
        + '<div style="flex:1;min-width:0;font-size:0.78em;color:' + (on ? '#94a3b8' : '#e2e8f0') + ';' + (on ? 'text-decoration:line-through;' : '') + 'font-weight:600;">' + q.emoji + ' ' + q.label + '</div>'
        + flame
        + '</div>';
    }).join('');

    var sessionHTML;
    // 🕐 Moment préféré : rappel contextuel (le matin, la carte pousse le matin, etc.)
    var momentTxt = { matin: 'idéale ce matin', midi: 'idéale ce midi', soir: 'idéale ce soir' }[j.answers.moment] || '';
    var mood = _todayMood(j);
    // 📌 Intention d'implémentation : rappel du plan « après X, je fais ma séance »
    var anchorTxt = ANCHOR_LABELS[j.answers.anchor] || '';
    if (doneToday) {
      sessionHTML = '<div style="padding:11px;background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.3);border-radius:11px;text-align:center;font-size:0.8em;color:#4ade80;font-weight:700;">✅ Séance du jour accomplie — bravo !</div>';
    } else if (isWork) {
      var btnLabel = mood === 'tired'
        ? '▶ Séance douce du jour · ' + SESSIONS[wk].title + ' (version allégée)'
        : '▶ Séance du jour · ' + SESSIONS[wk].title + ' (~' + (12 + wk * 3) + ' min)';
      sessionHTML = '<button onclick="awakEveilLaunchToday()" style="width:100%;background:linear-gradient(135deg,#a855f7,#7c3aed);border:none;color:#fff;border-radius:12px;padding:12px;font-size:0.88em;font-weight:800;cursor:pointer;">' + btnLabel + '</button>'
        + (_quietAuto(j)
            ? (_quietMode(j)
                ? '<div style="text-align:center;font-size:0.66em;color:#94a3b8;margin-top:5px;">🤫 Séance silencieuse — sans sauts ni impacts · <span onclick="awakEveilToggleQuiet()" style="color:#a855f7;font-weight:800;cursor:pointer;text-decoration:underline;">pas besoin ?</span></div>'
                : '<div style="text-align:center;font-size:0.66em;color:#94a3b8;margin-top:5px;">🔊 Sauts autorisés (pièce isolée) · <span onclick="awakEveilToggleQuiet()" style="color:#a855f7;font-weight:800;cursor:pointer;text-decoration:underline;">réactiver 🤫</span></div>')
            : '')
        + (anchorTxt ? '<div style="text-align:center;font-size:0.68em;color:#c4b5fd;margin-top:6px;font-weight:700;">📌 Ton plan : juste après ' + anchorTxt + '</div>' : '')
        + (momentTxt && !anchorTxt ? '<div style="text-align:center;font-size:0.66em;color:#94a3b8;margin-top:5px;">💡 ' + momentTxt.charAt(0).toUpperCase() + momentTxt.slice(1) + ', comme tu le préfères</div>' : '');
    } else {
      var kidsRest = '';
      if (j.answers.kids === 'enfants' || j.answers.kids === 'ados') {
        kidsRest = '<button onclick="awakEveilLaunchFamily()" style="width:100%;margin-top:8px;background:linear-gradient(135deg,#f59e0b,#d97706);border:none;color:#fff;border-radius:11px;padding:10px;font-size:0.8em;font-weight:800;cursor:pointer;">🤸 Mini-séance en famille (10 min, tout le monde joue)</button>';
      } else if (j.answers.kids === 'bebe') {
        kidsRest = '<div style="margin-top:8px;font-size:0.7em;color:#94a3b8;text-align:center;">👶 Une marche en poussette, c\'est de l\'activité qui compte.</div>';
      }
      sessionHTML = '<div style="padding:11px;background:rgba(6,182,212,0.07);border:1px solid rgba(6,182,212,0.25);border-radius:11px;text-align:center;font-size:0.78em;color:#67e8f9;font-weight:600;">🌿 Jour de récupération — la marche et tes habitudes suffisent aujourd\'hui.</div>' + kidsRest;
    }

    return '<div id="eveilCardInner" style="background:linear-gradient(160deg,rgba(168,85,247,0.1),rgba(15,16,20,0.4));border:1px solid rgba(168,85,247,0.35);border-radius:16px;padding:16px;margin-bottom:15px;">'
      + '<div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">'
      + '<span style="font-size:1.7em;">🌅</span>'
      + '<div style="flex:1;min-width:0;"><div style="font-weight:900;color:#fff;font-size:0.95em;">Parcours de l\'Éveil</div>'
      + '<div style="font-size:0.7em;color:#c4b5fd;">Semaine ' + wk + ' / 4 · Jour ' + Math.min(day, 28) + ' / 28</div></div>'
      + '<button onclick="if(confirm(\'Arrêter le Parcours de l\\\'Éveil ?\')) awakEveilStop()" style="background:none;border:none;color:#475569;font-size:0.9em;cursor:pointer;padding:4px;">✕</button></div>'
      + '<div style="height:6px;background:rgba(255,255,255,0.07);border-radius:5px;overflow:hidden;margin-bottom:13px;"><div style="height:100%;width:' + Math.round(Math.min(day, 28) / 28 * 100) + '%;background:linear-gradient(90deg,#a855f7,#7c3aed);border-radius:5px;"></div></div>'
      + (!mood
          ? '<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;padding:9px 11px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.09);border-radius:11px;">'
            + '<span style="flex:1;font-size:0.76em;color:#cbd5e1;font-weight:700;">Comment tu te sens aujourd\'hui ?</span>'
            + '<button onclick="awakEveilSetMood(\'good\')" style="background:none;border:1px solid rgba(255,255,255,0.14);border-radius:9px;font-size:1.15em;padding:4px 8px;cursor:pointer;">😊</button>'
            + '<button onclick="awakEveilSetMood(\'mid\')" style="background:none;border:1px solid rgba(255,255,255,0.14);border-radius:9px;font-size:1.15em;padding:4px 8px;cursor:pointer;">😐</button>'
            + '<button onclick="awakEveilSetMood(\'tired\')" style="background:none;border:1px solid rgba(255,255,255,0.14);border-radius:9px;font-size:1.15em;padding:4px 8px;cursor:pointer;">🥱</button>'
            + '</div>'
          : '')
      + sessionHTML
      + '<div style="font-size:0.66em;color:#94a3b8;font-weight:800;letter-spacing:1px;margin:13px 0 8px;">📋 MES HABITUDES DU JOUR</div>'
      + questHTML
      + '<div onclick="awakEveilToggleLesson()" style="margin-top:11px;padding:10px 12px;background:rgba(251,191,36,0.05);border:1px solid rgba(251,191,36,0.22);border-radius:11px;cursor:pointer;">'
      + '<div style="display:flex;align-items:center;gap:8px;"><span style="font-size:0.85em;font-weight:800;color:#fbbf24;flex:1;">' + lesson.t + '</span><span style="color:#fbbf24;font-size:0.75em;">' + (lessonSeen ? '▾' : '• nouveau ▾') + '</span></div>'
      + '<div id="eveilLessonBody" style="display:none;font-size:0.75em;color:#cbd5e1;line-height:1.55;margin-top:8px;">' + lesson.b + '</div>'
      + '</div>'
      + (j.answers.kids && j.answers.kids !== 'non'
          ? (function () {
              var adv = _timingAdvice(j.answers);
              return '<div onclick="awakEveilToggleTiming()" style="margin-top:9px;padding:10px 12px;background:rgba(6,182,212,0.05);border:1px solid rgba(6,182,212,0.22);border-radius:11px;cursor:pointer;">'
                + '<div style="display:flex;align-items:center;gap:8px;"><span style="font-size:0.85em;font-weight:800;color:#67e8f9;flex:1;">🕐 Matin ou soir avec des enfants ?</span><span style="color:#67e8f9;font-size:0.75em;">▾</span></div>'
                + '<div id="eveilTimingBody" style="display:none;font-size:0.75em;color:#cbd5e1;line-height:1.55;margin-top:8px;">'
                + '<div style="font-weight:700;color:#e2e8f0;margin-bottom:7px;">' + adv.verdict + '</div>'
                + adv.points.map(function (p) { return '<div style="margin-bottom:6px;">' + p + '</div>'; }).join('')
                + '</div></div>';
            })()
          : '')
      + '</div>';
  }
  // ── 🕐 MATIN OU SOIR ? Conseil personnalisé pour parents ───────────────
  // Synthèse de la littérature (recherchée et sourcée) :
  //  • La CONSTANCE de l'horaire prédit mieux l'assiduité que l'heure
  //    elle-même (National Weight Control Registry ; études de « temporal
  //    consistency », 2019-2023).
  //  • Les routines du MATIN favorisent la formation d'habitude
  //    (méta-analyse habitudes santé, 2024) et la séance est faite avant
  //    les imprévus — précieux avec des enfants.
  //  • Fin d'après-midi/soir : pic de température corporelle (16-18 h)
  //    ≈ +5 % de force (chronobiologie, Inserm) — meilleures performances.
  //  • Le soir tard : l'exercice MODÉRÉ ~1 h avant le coucher n'altère que
  //    légèrement le sommeil (étude Univ. de Caen/Inserm) ; c'est
  //    l'INTENSIF tardif qui retarde l'endormissement.
  function _timingAdvice(a) {
    var verdict, points = [];
    if (a.kids === 'bebe') {
      verdict = 'Avec un bébé, oublie l\'heure « idéale » : vise le créneau le plus PROTÉGÉ de ta journée — souvent la sieste du matin ou juste après son coucher.';
      points.push('🛡️ Un créneau protégé et répétable bat un horaire « optimal » impossible à tenir : la constance de l\'horaire prédit mieux l\'assiduité que l\'heure elle-même.');
      points.push('😴 Si la nuit a été hachée : ne sacrifie JAMAIS du sommeil pour une séance — dormir répare plus que s\'entraîner épuisé.');
      points.push('🤫 Le soir après son coucher : reste en intensité modérée si c\'est à moins d\'une heure de TON coucher — l\'exercice doux ne nuit presque pas au sommeil, l\'intensif si.');
    } else if (a.anchor === 'dodo-enfants') {
      verdict = 'Ton créneau après le coucher des enfants est un excellent choix — c\'est un moment protégé et prévisible, exactement ce qui fait tenir une routine.';
      points.push('💪 Bonus : en soirée, la température corporelle est encore élevée — tu es souvent un peu plus fort qu\'au saut du lit.');
      points.push('🌙 Garde l\'intensité modérée si la séance finit à moins d\'une heure de ton propre coucher : l\'exercice doux tardif n\'altère que légèrement le sommeil, l\'intensif le retarde.');
      points.push('📅 Le vrai secret : la MÊME heure chaque fois. La régularité de l\'horaire prédit mieux l\'assiduité que le choix matin/soir.');
    } else if (a.moment === 'matin') {
      verdict = 'Le matin avant le réveil des enfants est souvent le créneau le plus fiable d\'un parent : la séance est faite avant que la journée décide pour toi.';
      points.push('🧠 Les routines du matin facilitent la formation d\'habitude — et le cortisol matinal booste vigilance et énergie pour la suite.');
      points.push('🔥 Corps plus froid au réveil : garde 3-5 min d\'échauffement en plus, tes muscles te diront merci.');
      points.push('😴 Règle d\'or : ne coupe pas dans ton sommeil pour t\'entraîner. Si la nuit a été courte, décale plutôt la séance.');
    } else {
      verdict = 'Matin ou soir ? Les deux marchent — ce qui compte le PLUS, c\'est de garder le même horaire d\'une fois à l\'autre.';
      points.push('🌅 Le matin : séance faite avant les imprévus des enfants, et les routines matinales aident l\'habitude à s\'installer.');
      points.push('💪 Fin de journée : pic de température corporelle ≈ un peu plus de force et de souplesse — bonnes performances.');
      points.push('🌙 Si tu t\'entraînes tard : intensité modérée à moins d\'une heure du coucher — le doux ne nuit presque pas au sommeil, l\'intensif le retarde.');
    }
    return { verdict: verdict, points: points };
  }
  function eveilToggleTiming() {
    var b = document.getElementById('eveilTimingBody');
    if (!b) return;
    b.style.display = b.style.display === 'none' ? 'block' : 'none';
  }

  function eveilToggleLesson() {
    var b = document.getElementById('eveilLessonBody');
    if (!b) return;
    var open = b.style.display !== 'none';
    b.style.display = open ? 'none' : 'block';
    if (!open) { var j = _get(); if (j) { j['lessonSeen' + eveilWeek(j)] = true; _save(j); } }
  }

  // ── EXPORTS ────────────────────────────────────────────────────────────
  global.awakEveilActive = eveilActive;
  global.awakEveilMaybeOffer = eveilMaybeOffer;
  global.awakEveilStartQuestionnaire = eveilStartQuestionnaire;
  global.awakEveilLaunchToday = eveilLaunchToday;
  global.awakEveilLaunchFamily = eveilLaunchFamily;
  global.awakEveilOnWorkoutComplete = eveilOnWorkoutComplete;
  global.awakEveilToggleQuest = eveilToggleQuest;
  global.awakEveilSetMood = eveilSetMood;
  global.awakEveilToggleQuiet = eveilToggleQuiet;
  global.awakEveilToggleTiming = eveilToggleTiming;
  global.awakEveilToggleLesson = eveilToggleLesson;
  global.awakEveilRenderHomeCard = eveilRenderHomeCard;
  global.awakEveilStop = eveilStop;
  global.awakEveilExtend = eveilExtend;
})(typeof window !== 'undefined' ? window : this);
