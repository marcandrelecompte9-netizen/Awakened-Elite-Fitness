/* ============================================================
   VISITES GUIDÉES — mini tutoriel à la 1re visite de chaque onglet
   L'écran s'assombrit, un projecteur éclaire 2 à 4 vrais éléments
   de l'onglet, une bulle explique ; « Suivant », « Passer ».
   - Une fois par onglet et par profil (_cleProfil('awakVisites')).
   - Jamais pendant une séance, une inscription ou une autre scène
     (file AwakCine) : on attend que l'écran soit libre.
   - Un élément absent ou caché est simplement sauté.
   - Utilisateurs existants (déjà des séances) : rien ne s'affiche.
   Palette cyan/violette, aucune icône emoji.
   ============================================================ */
(function () {
  'use strict';

  var CLE = 'awakVisites';

  // ── Mémoire par profil ───────────────────────────────────────
  function cleEcr() { try { return window._cleProfil ? window._cleProfil(CLE) : CLE; } catch (e) { return CLE; } }
  function cleLec() { try { return window._cleProfilLecture ? window._cleProfilLecture(CLE) : CLE; } catch (e) { return CLE; } }
  function lire() {
    try { var v = localStorage.getItem(cleLec()); return v ? JSON.parse(v) : null; } catch (e) { return null; }
  }
  function ecrire(o) { try { localStorage.setItem(cleEcr(), JSON.stringify(o)); } catch (e) {} }
  function vu(id) { var o = lire(); return !!(o && o[id]); }
  function marquer(id) { var o = lire() || {}; o[id] = 1; ecrire(o); }

  // ── Aides pour trouver les cibles ────────────────────────────
  function $(sel, racine) { try { return (racine || document).querySelector(sel); } catch (e) { return null; } }
  function parTexte(racine, sel, rx) {
    racine = typeof racine === 'string' ? document.getElementById(racine) : racine;
    if (!racine) return null;
    var l = racine.querySelectorAll(sel || 'button');
    for (var i = 0; i < l.length; i++) if (rx.test((l[i].textContent || '').trim()) && visible(l[i])) return l[i];
    return null;
  }
  function parent(el, n) { while (el && n-- > 0) el = el.parentElement; return el; }
  function visible(el) {
    if (!el || !el.isConnected) return false;
    var r = el.getBoundingClientRect();
    if (r.width < 6 || r.height < 6) return false;
    var cs = getComputedStyle(el);
    return cs.display !== 'none' && cs.visibility !== 'hidden' && cs.opacity !== '0';
  }
  // Barre Libre / Routines / Programme / Course / Défis de l'onglet donné
  function barreSeance(tab) { var b = parTexte(tab, 'button', /^Libre$/); return b ? b.parentElement : null; }

  // ── Contenu : 2 à 4 étapes par onglet ────────────────────────
  // v1275 : visites revues — chaque fonction importante de l'onglet est montrée
  // (les jeux de Séance, le ciel de la famille, la carte du Jeu…). Les étapes
  // dont l'élément n'existe pas chez cet utilisateur sont sautées : on prévoit
  // donc les deux cas (ex. Famille seule / Famille à plusieurs).
  function ligneAccueil(rx) { return parTexte('homeTab', 'button.ahp-row', rx); }
  function enteteReglage(rx) { return parTexte('settingsTab', '.accordion-header', rx); }
  // v1287 : bouton de profil de l'Accueil (changer de profil / modifier le sien)
  function boutonProfil() { return $('#ahpEntete button[onclick*="showProfileSelectionModal"]') || $('#profileSwitchBtn'); }
  function cielFamille() { var sv = $('#familyContainer svg[viewBox="0 0 300 300"]'); return sv ? sv.parentElement : null; }
  var VISITES = {
    home: [
      { c: function () { return $('#ahpEntete .ahp-cta') || $('#homeTab .ahp-btn-p'); }, t: 'Ton objectif du jour', d: 'La séance prévue aujourd\'hui, sa durée et ses exercices : lance-la en un seul toucher. « Ou choisir une autre activité » ouvre les autres options.' },
      { c: function () { return $('#eveilJourneyCard'); }, t: 'Ton Parcours de l\'Éveil', d: 'Tes 4 semaines guidées : la séance du jour à lancer d\'un toucher, ton ressenti du jour (la séance s\'adapte si tu es fatigué) et tes petites habitudes de sommeil et de repas. Tu peux l\'arrêter avec la croix, ou le relancer dans Réglages.' },
      { c: boutonProfil, t: 'Ton profil', d: 'Touche ton avatar pour passer au profil d\'un autre membre de la famille, en créer un, ou modifier le tien avec le crayon : nom, âge, poids, objectif.' },
      { c: function () { var t = document.querySelectorAll('#ahpAujourdhui .ahp-tile'); return t[1] || $('#homeTab .ahp-btn-s'); }, t: 'Ta semaine', d: 'Tes séances de la semaine et ton objectif. Touche pour ouvrir l\'agenda et choisir tes jours d\'entraînement.' },
      { c: function () { return $('#groupWorkoutBtnContainer button'); }, t: 'Séance à plusieurs', d: 'Entraînez-vous ensemble sur le même téléphone : choisis les membres de la famille ou ajoute des invités. Chacun note ses séries, et les membres de la famille retrouvent la séance dans leur propre historique.' },
      { c: function () { return ligneAccueil(/Où as-tu mal/); }, t: 'Une douleur ?', d: 'Indique où tu as mal : les séances évitent cette zone jusqu\'à ce que ça aille mieux.' },
      { c: function () { return ligneAccueil(/Tout explorer/); }, t: 'Tout explorer', d: 'Toutes les fonctions de l\'appli au même endroit, si tu cherches quelque chose.' },
      { c: function () { return $('#mobileNavBar'); }, t: 'Les onglets', d: 'Séance pour t\'entraîner, Progrès pour tes résultats, Famille pour vous suivre ensemble. « Plus » ouvre l\'Agenda, les Exercices, le Jeu et les Réglages.' }
    ],
    workouts: [
      { c: function () { return barreSeance('workoutsTab'); }, t: 'Ta façon de t\'entraîner', d: 'Séance libre, routines, programme sur plusieurs semaines, course ou défis : tout part d\'ici.' },
      { c: function () { var h = $('#awakCorpsHost'); return h ? h.querySelector('button') : null; }, t: 'Lieu et matériel', d: 'Dis où tu es et ce que tu as : les exercices proposés en dépendent.' },
      { c: function () { var h = $('#awakCorpsHost'); return h ? h.querySelector('svg') : null; }, t: 'Choisis tes muscles', d: 'Touche les muscles à travailler. Vert : prêt, orange : récupère, rouge : à reposer.' },
      { c: function () { return parTexte('workoutsTab', 'button', /FAIS MA SÉANCE/i); }, t: 'Ou laisse faire', d: 'Le Système compose ta séance du jour selon ce que tu as déjà fait.' },
      { c: function () { return $('#awakAutresToggle'); }, t: 'Cardio et jeux', d: 'Tabata, superset, circuit, AMRAP et 16 jeux d\'entraînement (dés, cartes, duel…) : touche pour les ouvrir.' }
    ],
    routines: [
      { c: function () { return parTexte('routinesTab', 'button', /^Nouvelle/); }, t: 'Tes routines', d: 'Crée une séance à toi et relance-la quand tu veux.' },
      { c: function () { return parTexte('routinesTab', 'button', /^Modèles/); }, t: 'Modèles', d: 'Ou pars d\'une routine toute prête, à modifier à ton goût.' },
      { c: function () { return parTexte('routinesTab', 'button', /^Plan hebdo/); }, t: 'Plan de la semaine', d: 'Place tes routines sur les jours : elles t\'attendront à l\'accueil.' }
    ],
    program: [
      { c: function () { var b = parTexte('programTab', 'button', /^Mentors$/); return b ? b.parentElement : null; }, t: 'Trois chemins', d: 'Mentors : un plan complet selon ton niveau. Sports : boxe, yoga, calisthénie… Salle : des programmes sur machines.' },
      { c: function () { return parTexte('programTab', 'h2', /mentor/i); }, t: 'Un programme suivi', d: 'Plusieurs semaines planifiées, séance par séance : tu n\'as plus qu\'à suivre.' },
      { c: function () { return parTexte('programTab', 'button', /TOUS LES PROGRAMMES/i); }, t: 'Tout le catalogue', d: 'Force, perte de poids, mobilité… Choisis celui qui te ressemble.' }
    ],
    // v1282 : Programme › Sports et Programme › Salle ont chacun leur visite
    program_sports: [
      { c: function () { var b = $('#programTab button[onclick^="selectDisciplineCard"]'); return b ? b.parentElement : null; }, t: 'Choisis ton sport', d: 'Boxe, calisthénie, yoga, HIIT… Chaque sport a ses propres séances, sans matériel pour la plupart.' },
      { c: function () { var n = parTexte('programTab', 'span', /^NIVEAU/); return n ? parent(n, 2) : null; }, t: 'Ton niveau dans ce sport', d: 'Chaque séance faite te donne de l\'expérience dans ce sport. « Comment ça marche » explique la discipline.' },
      { c: function () { return $('#programTab button[onclick^="startDisciplineSession"]'); }, t: 'Une séance', d: 'Touche-la pour la lancer. La durée, le nombre d\'exercices et le niveau sont indiqués.' },
      { c: function () { return parTexte('programTab', 'button', /À DÉBLOQUER/); }, t: 'À débloquer', d: 'Les séances plus dures s\'ouvrent quand tu montes de niveau dans ce sport.' },
      { c: function () { return parTexte('programTab', 'button', /Mon arbre de progression/); }, t: 'Ton arbre', d: 'Les mouvements à maîtriser étape par étape, et où tu en es.' }
    ],
    program_salle: [
      { c: function () { var b = parTexte('programTab', 'button', /^(Passer à|Mes machines)/); return b ? b.parentElement : null; }, t: 'Ton lieu', d: 'Au gym, passe en mode salle : sinon les machines sont remplacées par le matériel que tu as.' },
      { c: function () { var t = parTexte('programTab', 'div', /^PROCHAINE SÉANCE$/); return t ? t.parentElement : null; }, t: 'Ta prochaine séance', d: 'L\'appli retient où tu en es et te propose la suite.' },
      { c: function () { var b = $('#programTab button[onclick^="AwakSalle.ouvrirProg"]'); return b ? b.closest('.card') : null; }, t: 'Un programme', d: 'Touche-le pour voir ses séances (A, B…). Chacune indique les séries, les répétitions et le repos.' },
      { c: function () { return parTexte('programTab', 'span', /^(Débutant|Intermédiaire|Avancé|Tous niveaux) · /); }, t: 'Selon ton niveau', d: 'Débutant, intermédiaire ou avancé, et le nombre de jours par semaine : prends celui qui te va. « Machines seulement » est idéal pour commencer.' }
    ],
    course: [
      { c: function () { var b = $('#courseTab .awak-run-act'); return b ? b.parentElement : null; }, t: 'Ton activité', d: 'Course, marche ou vélo.' },
      { c: function () { return $('#awakRunCoachChoix'); }, t: 'Le type de sortie', d: 'Libre, avec un objectif, en fractionné, ou contre ta meilleure sortie.' },
      { c: function () { return parTexte('courseTab', 'button', /^Voix/); }, t: 'La voix', d: 'Choisis tous les combien la voix t\'annonce ta distance, et si la sortie se met en pause seule quand tu t\'arrêtes.' },
      { c: function () { return $('#awakRunGo'); }, t: 'C\'est parti', d: 'Le GPS suit ta distance et ta vitesse. Garde l\'écran allumé : le GPS d\'une appli web s\'arrête quand l\'écran s\'éteint. Ta musique peut jouer en même temps.' },
      { c: function () { return $('#awakRunPlanHote'); }, t: 'Un plan', d: 'Prépare un 5 km, un 10 km ou un demi-marathon, semaine après semaine.' },
      { c: function () { return parTexte('courseTab', 'button', /^Sans GPS/); }, t: 'Sans GPS', d: 'Tapis, vélo stationnaire ou piscine ? Passe par ici.' }
    ],
    challenges: [
      { c: function () { return $('#awakDefiEtoiles'); }, t: 'Tes étoiles', d: 'Chaque défi réussi te donne une étoile ; les jeux et le Bingo aussi. Les étoiles font monter ton rang.' },
      { c: function () { var l = $('#challengesList'); return l ? l.querySelector('button') : null; }, t: 'Un défi de 30 jours', d: 'Choisis-en un : coche ta case chaque jour, l\'appli compte et te le rappelle.' }
    ],
    history: [
      { c: function () { return $('#awakProgHaut'); }, t: 'Ton résumé', d: 'Tes séances, ton volume et ta régularité de la semaine.' },
      { c: function () { return parTexte('historyTab', 'button', /Arbre de l.Éveil/); }, t: 'Arbre de l\'Éveil', d: 'Ce que tes séances développent : force, endurance, mobilité…' },
      { c: function () { return $('#awakTuileAnalyse'); }, t: 'Analyse et coach', d: 'Ce que tu devrais travailler ensuite, et pourquoi.' },
      { c: function () { return $('#awakTuileEquilibre'); }, t: 'Équilibre', d: 'Repère le muscle qui prend du retard sur les autres.' },
      { c: function () { var t = $('#awakTuileHofTitre'); return t ? t.closest('button') : null; }, t: 'Hall of Fame', d: 'Tes records sur chaque exercice.' },
      { c: function () { return parTexte('historyTab', '.accordion-header', /Tes séances/); }, t: 'Tes séances', d: 'Toutes tes séances : touche-en une pour la revoir ou la refaire.' },
      { c: function () { return $('#awakCorpsCard'); }, t: 'Ton corps', d: 'Photos et mesures pour voir le changement. Elles restent sur ton téléphone.' }
    ],
    calendar: [
      { c: function () { return $('#calendarTabContent .card'); }, t: 'Ton planning', d: 'Touche un jour pour voir ou planifier une séance. Les séances faites sont cochées.' },
      { c: function () { var b = parTexte('calendarTab', 'button', /^Semaine$/); return b ? b.parentElement : null; }, t: 'Semaine ou mois', d: 'Change de vue selon ce que tu veux voir.' },
      { c: function () { return parTexte('calendarTab', 'button', /Mode salle/); }, t: 'Mode salle', d: 'Ta semaine en grand, lisible de loin : pose le téléphone au gym.' }
    ],
    exercises: [
      { c: function () { return $('#exerciseSearch'); }, t: 'Chercher', d: 'Trouve un exercice par son nom, un muscle ou un matériel.' },
      { c: function () { return $('#awakFilterBar'); }, t: 'Filtrer', d: 'Par muscle et par matériel. Touche un exercice pour voir sa fiche, son image et sa vidéo.' },
      { c: function () { return parTexte('exercisesTab', 'button', /^Mes favoris$/); }, t: 'Favoris', d: 'Touche l\'étoile d\'un exercice pour le retrouver ici.' },
      { c: function () { return $('#awakSegCalculs'); }, t: 'Calculs', d: 'Charge maximale, disques sur la barre, rang de force.' }
    ],
    calculators: [
      { c: function () { return $('#awakCalcSrc_frc'); }, t: 'Ton rang de force', d: 'Compare ta force à celle des gens de ton poids.' },
      { c: function () { return $('#awakCalcSrc_1rm'); }, t: 'Ta charge maximale', d: 'Estime ton maximum sans le tester, à partir d\'une série.' },
      { c: function () { return $('#awakCalcSrc_plaques'); }, t: 'Les disques', d: 'Quels disques mettre de chaque côté de la barre pour une charge donnée.' }
    ],
    family: [
      // Famille à plusieurs
      { c: function () { return $('#awakFamSemaine'); }, t: 'Notre semaine', d: 'Qui a bougé chaque jour. Touche un membre pour l\'encourager, ou lancez « Bouger ensemble » : 15 minutes pour toute la famille, au même rythme.' },
      { c: cielFamille, t: 'Votre ciel', d: 'Chaque étoile est un membre de ta famille. Elle s\'allume et grossit quand il s\'entraîne. Toi, tu es au centre.' },
      { c: function () { var c = cielFamille(); return c ? c.querySelector('svg') : null; }, t: 'Touche une étoile', d: 'Pour encourager, jouer ou lancer un défi à ce membre. Ton étoile au centre lance un défi d\'équipe.' },
      { c: function () { var b = parTexte('familyContainer', 'button', /^Défis$/); return b ? b.parentElement : null; }, t: 'Ensemble', d: 'Défis et objectif commun, badges de famille, ajouter un membre, et le journal de ce que chacun a fait.' },
      // Famille encore seule
      { c: function () { var b = parTexte('familyContainer', 'button', /Ajouter un membre/); return b ? b.parentElement : null; }, t: 'La famille', d: 'Chaque membre a son profil, ses séances et sa progression. Ensemble, vous vous encouragez et vous vous lancez des défis.' },
      { c: function () { return parTexte('familyContainer', 'button', /Ajouter un membre/); }, t: 'Ajouter quelqu\'un', d: 'Un enfant, un conjoint, un ami : crée son profil ici.' }
    ],
    game: [
      { c: function () { var f = $('#gameTab') && $('#gameTab').firstElementChild; return (f && f.id !== 'awakHunterCard') ? f : null; }, t: 'La carte', d: 'Ta ville. Les Failles y apparaissent après tes vraies séances : touche-en une pour combattre.' },
      { c: function () { return $('#awakHunterCard'); }, t: 'Ta carte', d: 'Ton rang, ton niveau et ta puissance : tout monte avec tes vraies séances.' },
      { c: function () { var s = $('#awakStatVal_STR'); return s ? parent(s, 2) : null; }, t: 'Tes attributs', d: 'À chaque niveau, tu répartis des points. Ils pèsent dans tes combats. « Aide » explique chacun.' },
      { c: function () { return $('#awakRowBtns'); }, t: 'Compétences et équipement', d: 'Débloque des compétences, équipe ce que tu trouves dans les Failles.' },
      { c: function () { return $('#awakRowBtns2'); }, t: 'Journal et malus', d: 'Le journal garde ton histoire ; les malus montrent ce qui te pénalise en ce moment.' },
      { c: function () { return $('#adventureContainer'); }, t: 'L\'aventure', d: 'Les Failles et les compagnons : chaque séance y fait des dégâts.' }
    ],
    settings: [
      { c: function () { return $('#settingsTab .accordion-header'); }, t: 'Réglages par thème', d: 'Touche un titre pour l\'ouvrir. Ici : le mode jeu et l\'onglet Famille.' },
      { c: function () { return enteteReglage(/^\s*>?\s*Entraînement/); }, t: 'Entraînement', d: 'Tes lieux et ton matériel, le temps de repos, l\'échauffement, kg ou livres.' },
      { c: function () { return enteteReglage(/Parcours de l.Éveil/); }, t: 'Parcours de l\'Éveil', d: '4 semaines guidées pour débuter : séances, sommeil, repas.' },
      { c: function () { return enteteReglage(/Montre/); }, t: 'Montre et santé', d: 'Relie ta montre pour le pouls, les pas et le sommeil.' },
      { c: function () { return enteteReglage(/limitations/); }, t: 'Mes limitations', d: 'Une blessure ou une contrainte ? Les séances s\'adaptent.' },
      { c: function () { return enteteReglage(/Compte/); }, t: 'Tes données', d: 'Sauvegarde ici : tout reste sur ton téléphone tant que tu ne l\'envoies pas.' }
    ]
  };

  // v1286 : version ENFANT (moins de 13 ans) — phrases courtes, mots simples,
  // pas d'étapes réservées au parent (montre, sauvegarde, ajout de membre,
  // calculs de charge). Un onglet absent ici n'a pas de visite pour l'enfant
  // (l'onglet Jeu, lui, n'existe pas avant 13 ans). 13 à 15 ans : version adulte.
  var VISITES_ENFANT = {
    home: [
      { c: function () { return $('#homeTab .ahp-btn-p'); }, t: 'C\'est parti !', d: 'Touche ici pour bouger : l\'appli choisit des exercices faits pour toi.' },
      { c: boutonProfil, t: 'Ton profil', d: 'Touche ton image pour passer au profil de quelqu\'un d\'autre. Vérifie que c\'est bien toi avant de bouger ! Pour changer ton nom ou ton âge, demande à un adulte.' },
      { c: function () { return $('#youthSafetyBanner'); }, t: 'Avec un adulte', d: 'Fais tes exercices avec un adulte pas loin. Si quelque chose fait mal, tu arrêtes et tu le dis.' },
      { c: function () { return $('#groupWorkoutBtnContainer button'); }, t: 'À plusieurs', d: 'Bouge en même temps que ta famille ou tes amis, sur le même téléphone : chacun a ses séries.' },
      { c: function () { return ligneAccueil(/Où as-tu mal/); }, t: 'Un bobo ?', d: 'Dis-le ici : l\'appli évitera cette partie du corps.' },
      { c: function () { return $('#mobileNavBar'); }, t: 'Les onglets', d: 'Séance pour bouger, Progrès pour voir tout ce que tu as fait, Famille pour bouger avec les tiens.' }
    ],
    workouts: [
      { c: function () { return barreSeance('workoutsTab'); }, t: 'Plein de façons de bouger', d: 'Séance libre, routines, aventures, course ou défis : choisis ce qui te tente.' },
      { c: function () { return parTexte('workoutsTab', 'button', /FAIS MA SÉANCE/i); }, t: 'Le plus simple', d: 'Touche ici : l\'appli prépare ta séance toute seule.' },
      { c: function () { var h = $('#awakCorpsHost'); return h ? h.querySelector('svg') : null; }, t: 'Ton corps', d: 'Touche une partie du corps pour la faire travailler.' },
      { c: function () { return $('#awakAutresToggle'); }, t: 'Des jeux', d: 'Ouvre ici les jeux : dés, cartes, duel… On bouge en s\'amusant.' }
    ],
    routines: [
      { c: function () { return parTexte('routinesTab', 'button', /^Nouvelle/); }, t: 'Ta séance à toi', d: 'Choisis tes exercices préférés et garde-les pour la prochaine fois.' },
      { c: function () { return parTexte('routinesTab', 'button', /^Modèles/); }, t: 'Des séances toutes prêtes', d: 'Prends-en une et essaie-la.' }
    ],
    program: [
      { c: function () { return parTexte('programTab', 'h2', /aventure/i); }, t: 'Choisis une aventure', d: 'Super-héros, ninja, pirates, dinosaures… Chaque aventure a ses missions.' },
      { c: function () { return parTexte('programTab', 'div', /^(École des super-héros|Le zoo en mouvement|Académie ninja)/); }, t: 'Une aventure', d: 'Touche-la pour voir ses missions. Chaque mission réussie te rapproche de la fin !' }
    ],
    course: [
      { c: function () { var b = $('#courseTab .awak-run-act'); return b ? b.parentElement : null; }, t: 'Dehors', d: 'Marche, course ou vélo : choisis ce que tu fais.' },
      { c: function () { return $('#awakRunGo'); }, t: 'C\'est parti', d: 'Le téléphone compte la distance. Va dehors seulement avec un adulte.' }
    ],
    challenges: [
      { c: function () { return $('#awakDefiEtoiles'); }, t: 'Tes étoiles', d: 'Chaque défi réussi te donne une étoile. Combien vas-tu en gagner ?' },
      { c: function () { var l = $('#challengesList'); return l ? l.querySelector('button') : null; }, t: 'Un défi', d: 'Choisis un défi, fais-le un peu chaque jour et coche ta case.' }
    ],
    history: [
      { c: function () { return $('#awakProgHaut'); }, t: 'Ce que tu as fait', d: 'Toutes tes séances s\'affichent ici.' },
      { c: function () { return parTexte('historyTab', 'button', /Arbre de l.Éveil/); }, t: 'Ton arbre', d: 'Il pousse à chaque séance : force, souplesse, endurance…' },
      { c: function () { var t = $('#awakTuileHofTitre'); return t ? t.closest('button') : null; }, t: 'Tes records', d: 'Ce que tu as fait de mieux. Essaie de battre ton record !' }
    ],
    calendar: [
      { c: function () { return $('#calendarTabContent .card'); }, t: 'Ton calendrier', d: 'Les jours où tu as bougé sont cochés.' },
      { c: function () { var b = parTexte('calendarTab', 'button', /^Semaine$/); return b ? b.parentElement : null; }, t: 'Semaine ou mois', d: 'Change la vue pour voir plus loin.' }
    ],
    exercises: [
      { c: function () { return $('#exerciseSearch'); }, t: 'Chercher', d: 'Écris le nom d\'un exercice pour le trouver.' },
      { c: function () { return $('#awakFilterBar'); }, t: 'Les fiches', d: 'Touche un exercice pour voir comment le faire, avec une image.' }
    ],
    family: [
      { c: function () { return $('#awakFamSemaine'); }, t: 'Ta famille cette semaine', d: 'Les jours où chacun a bougé. « Bouger ensemble » : 15 minutes tous ensemble !' },
      { c: function () { var c = cielFamille(); return c ? c.querySelector('svg') : null; }, t: 'Le ciel de la famille', d: 'Chaque étoile, c\'est quelqu\'un de ta famille. Touche une étoile pour l\'encourager ou lui lancer un défi.' },
      { c: function () { var b = parTexte('familyContainer', 'button', /^Défis$/); return b ? b.parentElement : null; }, t: 'Ensemble', d: 'Des défis à faire en famille et un but à atteindre tous ensemble.' },
      // Encore seul dans la famille
      { c: function () { var b = parTexte('familyContainer', 'button', /Ajouter un membre/); return b ? b.parentElement : null; }, t: 'Ta famille', d: 'Ici, toute ta famille bouge ensemble. Demande à un adulte d\'ajouter les autres.' }
    ],
    settings: [
      { c: function () { return enteteReglage(/^\s*>?\s*Entraînement/); }, t: 'Les réglages', d: 'Ici, on règle le temps de repos et l\'échauffement. Demande à un adulte avant de changer quelque chose.' },
      { c: function () { return enteteReglage(/Audio/); }, t: 'Les sons', d: 'La voix du coach et les sons de l\'appli.' }
    ]
  };
  function enfant() { try { return !!(window.AwakYouth && AwakYouth.isChild && AwakYouth.isChild()); } catch (e) { return false; } }
  function jeuVisites() { return enfant() ? VISITES_ENFANT : VISITES; }

  // ── Peut-on afficher maintenant ? ────────────────────────────
  function profilPret() {
    try {
      var k = window._cleProfilLecture ? window._cleProfilLecture('userProfile') : 'userProfile';
      var p = JSON.parse(localStorage.getItem(k) || localStorage.getItem('userProfile') || 'null');
      return !!(p && p.setupComplete);
    } catch (e) { return false; }
  }
  function ecranLibre() {
    if (document.body.classList.contains('in-session')) return false;
    // v1300 : le Parcours de l'Éveil va être proposé (fin d'inscription) : on attend
    // qu'il soit proposé, accepté ou refusé, puis on montre l'accueil tel qu'il est.
    try { if (localStorage.getItem(window._cleProfil ? window._cleProfil('awakEveilPlusTard') : 'awakEveilPlusTard') === '1') return false; } catch (e) {}
    if (document.querySelector('.modal.active')) return false;
    // Une fenêtre plein écran est ouverte (inscription, histoire, fiche…)
    var kids = document.body.children;
    for (var i = 0; i < kids.length; i++) {
      var el = kids[i];
      if (el.id === 'awakVisiteOverlay' || el.tagName === 'SCRIPT') continue;
      var cs = getComputedStyle(el);
      if (cs.position === 'fixed' && (parseInt(cs.zIndex, 10) || 0) >= 9000 && cs.display !== 'none'
          && el.getBoundingClientRect().height > window.innerHeight * 0.5) return false;
    }
    return true;
  }
  function ongletActif() {
    var t = document.querySelector('.tab-content.active');
    return t ? t.id.replace(/Tab$/, '') : null;
  }
  // L'onglet Jeu a déjà sa cinématique et sa fenêtre explicative : on passe après.
  function jeuPret() {
    try { return localStorage.getItem('awakEpicIntroSeen') === 'true' && localStorage.getItem('awakGameGuideSeen') === 'true'; }
    catch (e) { return true; }
  }

  // Utilisateur déjà installé avant cette fonction : on ne lui impose rien.
  function initialiserAnciens() {
    if (lire()) return;
    try {
      var st = JSON.parse(localStorage.getItem('workoutStats') || '{}');
      if ((st.workouts || 0) > 0) {
        var o = { _anciens: 1 }; Object.keys(VISITES).forEach(function (k) { o[k] = 1; }); ecrire(o);
      }
    } catch (e) {}
  }

  // ── Affichage ────────────────────────────────────────────────
  var enCours = null, minuterie = null, essais = 0;

  function planifier(onglet, delai) {
    clearTimeout(minuterie);
    minuterie = setTimeout(function () { tenter(onglet); }, delai == null ? 700 : delai);
  }

  function cleVisite(onglet) {
    if (onglet !== 'program' || enfant()) return onglet;   // l'enfant a une seule vue : ses aventures
    var v = ''; try { v = typeof window.getProgramTabView === 'function' ? window.getProgramTabView() : ''; } catch (e) {}
    return v === 'discipline' ? 'program_sports' : (v === 'salle' ? 'program_salle' : 'program');
  }
  function tenter(onglet) {
    if (window.__AWAK_SANS_VISITE) return;              // tests automatiques
    if (ongletActif() !== onglet) return;              // l'utilisateur est déjà ailleurs
    var cle = cleVisite(onglet);
    var V = jeuVisites();
    if (enCours || !onglet || !V[cle] || vu(cle)) return;
    if (onglet === 'game' && !jeuPret()) { if (essais++ < 40) planifier(onglet, 2500); return; }
    // v1300 : avant, abandon après 60 s d'écran occupé (questionnaire de l'Éveil,
    // limitations…) : la visite sautait, puis revenait au changement d'onglet.
    if (!profilPret() || !ecranLibre()) { if (essais++ < 600) planifier(onglet, 1500); return; }
    if (window.AwakCine && window.AwakCine.defer(function () { planifier(onglet, 400); })) return;
    var etapes = V[cle].filter(function (e) { var el = null; try { el = e.c(); } catch (x) {} return visible(el); });
    if (!etapes.length) return;                         // rien à montrer : on réessaiera à la prochaine visite
    essais = 0;
    montrer(cle, etapes);
  }

  function styles() {
    if (document.getElementById('awakVisiteStyles')) return;
    var st = document.createElement('style');
    st.id = 'awakVisiteStyles';
    st.textContent =
      '@keyframes awakVisIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}' +
      '#awakVisiteOverlay{position:fixed;inset:0;z-index:100050;}' +
      '#awakVisiteSpot{position:fixed;border-radius:14px;border:2px solid #22d3ee;pointer-events:none;' +
        'box-shadow:0 0 0 9999px rgba(4,6,12,0.80),0 0 26px rgba(34,211,238,0.55);' +
        'transition:top .35s ease,left .35s ease,width .35s ease,height .35s ease;}' +
      '#awakVisiteBulle{position:fixed;left:16px;right:16px;max-width:420px;margin:0 auto;' +
        'background:linear-gradient(165deg,#0F1014,#161a2c) !important;border:1px solid rgba(34,211,238,0.35);' +
        'border-radius:16px;padding:16px 16px 12px;color:#e2e8f0;box-shadow:0 18px 50px rgba(0,0,0,0.6);' +
        'animation:awakVisIn .3s ease;}' +
      '#awakVisiteBulle button{min-height:auto !important;font-family:inherit;cursor:pointer;}';
    document.head.appendChild(st);
  }

  function montrer(onglet, etapes) {
    styles();
    var i = 0;
    var ov = document.createElement('div');
    ov.id = 'awakVisiteOverlay';
    ov.setAttribute('data-feuille-bas', '');            // pas de recentrage automatique (fenetres.js)
    ov.innerHTML = '<div id="awakVisiteSpot"></div><div id="awakVisiteBulle" role="dialog" aria-live="polite"></div>';
    document.body.appendChild(ov);
    enCours = { onglet: onglet, ov: ov };
    var spot = ov.querySelector('#awakVisiteSpot'), bulle = ov.querySelector('#awakVisiteBulle');

    function fin() {
      marquer(onglet);
      window.removeEventListener('resize', placer);
      window.removeEventListener('scroll', placer, true);
      try { ov.remove(); } catch (e) {}
      enCours = null;
    }
    function cible() { try { return etapes[i].c(); } catch (e) { return null; } }
    function placer() {
      var el = cible(); if (!el) return;
      var r = el.getBoundingClientRect(), m = 6;
      var top = Math.max(4, r.top - m), left = Math.max(4, r.left - m);
      var h = Math.min(r.height + 2 * m, window.innerHeight - top - 4), w = Math.min(r.width + 2 * m, window.innerWidth - left - 4);
      spot.style.top = top + 'px'; spot.style.left = left + 'px';
      spot.style.width = w + 'px'; spot.style.height = h + 'px';
      // Bulle sous la cible si la place le permet, sinon au-dessus
      var hb = bulle.offsetHeight || 150;
      if (top + h + 12 + hb < window.innerHeight - 8) { bulle.style.top = (top + h + 12) + 'px'; bulle.style.bottom = ''; }
      else if (top - 12 - hb > 8) { bulle.style.top = (top - 12 - hb) + 'px'; bulle.style.bottom = ''; }
      else { bulle.style.top = ''; bulle.style.bottom = '16px'; }
    }
    function rendre() {
      var e = etapes[i], dernier = i === etapes.length - 1;
      bulle.innerHTML =
        '<div style="font-size:0.6em;font-weight:900;letter-spacing:2.5px;color:#22d3ee;margin-bottom:4px;">PREMIER PASSAGE · ' + (i + 1) + '/' + etapes.length + '</div>' +
        '<div style="font-size:1.05em;font-weight:800;color:#f1f5f9;margin-bottom:4px;">' + e.t + '</div>' +
        '<div style="font-size:0.88em;line-height:1.5;color:#cbd5e1;margin-bottom:12px;">' + e.d + '</div>' +
        '<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;">' +
          (dernier ? '<span></span>' :
          '<button data-v="passer" style="background:none !important;border:none;color:#64748b;font-size:0.8em;font-weight:800;padding:8px 4px !important;">Passer</button>') +
          '<button data-v="suite" style="background:linear-gradient(135deg,#22d3ee,#0891b2) !important;border:none;border-radius:11px;' +
            'color:#04121f !important;font-weight:900;font-size:0.85em;letter-spacing:0.5px;padding:10px 18px !important;">' +
            (dernier ? 'Compris' : 'Suivant ›') + '</button>' +
        '</div>';
      var el = cible();
      try { el.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch (x) {}
      placer();
      setTimeout(placer, 380);
    }
    bulle.addEventListener('click', function (ev) {
      var b = ev.target.closest('button'); if (!b) return;
      ev.stopPropagation();
      if (b.getAttribute('data-v') === 'passer') return fin();
      // étape suivante encore visible ? (le contenu a pu changer)
      do { i++; } while (i < etapes.length && !visible(cible()));
      if (i >= etapes.length) return fin();
      rendre();
    });
    // Toucher hors de la bulle : rien ne passe à travers (on reste dans la visite)
    ov.addEventListener('click', function (ev) { if (!bulle.contains(ev.target)) ev.stopPropagation(); });
    window.addEventListener('resize', placer);
    window.addEventListener('scroll', placer, true);
    rendre();
  }

  // ── Détection du changement d'onglet ─────────────────────────
  function surveiller() {
    initialiserAnciens();
    var dernier = ongletActif();
    if (dernier) planifier(dernier, 1500);
    var obs = new MutationObserver(function () {
      var a = ongletActif();
      if (a && a !== dernier) { dernier = a; essais = 0; planifier(a); }
    });
    document.querySelectorAll('.tab-content').forEach(function (t) {
      obs.observe(t, { attributes: true, attributeFilter: ['class'] });
    });
    var spv = window.setProgramTabView;
    if (typeof spv === 'function' && !spv._visite) {
      window.setProgramTabView = function (v) { var r = spv.apply(this, arguments); essais = 0; planifier('program', 700); return r; };
      window.setProgramTabView._visite = true;
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(surveiller, 300); });
  else setTimeout(surveiller, 300);

  window.AwakVisite = {
    VISITES: VISITES,
    montrer: function (onglet) { var o = lire() || {}; delete o[cleVisite(onglet)]; ecrire(o); essais = 0; tenter(onglet); },
    // Revoir toutes les visites (depuis « Tout explorer »)
    reinitialiser: function () {
      ecrire({});
      if (typeof window.showToast === 'function') window.showToast('Les visites guidées reviendront à ton prochain passage dans chaque onglet.', 'info', 3500);
      var a = ongletActif(); if (a) planifier(a, 900);
    },
    vu: vu
  };
})();
