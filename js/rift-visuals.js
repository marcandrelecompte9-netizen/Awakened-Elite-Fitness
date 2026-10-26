/* ============================================================
   VISUELS DE COMBAT — Failles
   - monstre(nom, couleur, taille, boss) : silhouette SVG animée
     (squelette, bête, ombre, golem) choisie selon le nom.
   - hud(data) : bandeau de combat en haut de l'écran de séance
     (monstre, PV ennemi, PV joueur, vagues, dégâts flottants).
     hud(null) le retire.
   Aucune image, aucun emoji.
   ============================================================ */
(function () {
  "use strict";

  var _uid = 0;

  function _styles() {
    if (document.getElementById('awkRiftVisStyles')) return;
    var st = document.createElement('style');
    st.id = 'awkRiftVisStyles';
    st.textContent =
      '@keyframes awkMonSouffle{0%,100%{transform:translateY(0) scale(1);}50%{transform:translateY(-2px) scale(1.025);}}'
    + '@keyframes awkMonYeux{0%,86%,100%{opacity:1;}90%{opacity:0.15;}}'
    + '@keyframes awkMonAura{0%,100%{opacity:0.55;transform:scale(1);}50%{opacity:0.9;transform:scale(1.06);}}'
    + '@keyframes awkMonTourne{to{transform:rotate(360deg);}}'
    + '@keyframes awkMonCoup{0%{transform:translateX(0);filter:none;}15%{transform:translateX(-5px);filter:brightness(2.6) saturate(0.4);}'
    +   '35%{transform:translateX(4px);}55%{transform:translateX(-2px);filter:brightness(1.4);}100%{transform:translateX(0);filter:none;}}'
    + '@keyframes awkDgtMonte{0%{opacity:0;transform:translate(-50%,6px) scale(0.7);}15%{opacity:1;transform:translate(-50%,0) scale(1.15);}'
    +   '70%{opacity:1;}100%{opacity:0;transform:translate(-50%,-30px) scale(1);}}'
    + '.awk-mon-corps{animation:awkMonSouffle 3.2s ease-in-out infinite;transform-origin:50% 90%;transform-box:fill-box;}'
    + '.awk-mon-yeux{animation:awkMonYeux 4.5s ease-in-out infinite;}'
    + '.awk-mon-aura{animation:awkMonAura 3.2s ease-in-out infinite;transform-origin:50% 50%;transform-box:fill-box;}'
    + '.awk-mon-anneau{animation:awkMonTourne 14s linear infinite;transform-origin:50% 50%;transform-box:fill-box;}'
    + '.awk-mon-touche{animation:awkMonCoup .55s ease-out;}'
    + '.awk-dgt{position:absolute;left:50%;top:4px;font-weight:900;pointer-events:none;white-space:nowrap;'
    +   'animation:awkDgtMonte 1.3s ease-out forwards;text-shadow:0 0 8px rgba(0,0,0,0.9),0 0 2px #000;}'
    + '@media(prefers-reduced-motion:reduce){.awk-mon-corps,.awk-mon-yeux,.awk-mon-aura,.awk-mon-anneau,.awk-mon-touche{animation:none!important;}}';
    document.head.appendChild(st);
  }

  function _hash(s) { var h = 0, i; s = String(s || ''); for (i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); }

  function _type(nom) {
    var n = String(nom || '').toLowerCase();
    // ⚠️ Ordre important : du plus spécifique au plus général.
    if (/squelet|liche|crâne|crane|(^|\s)os(\s|$)|carcasse|calcin|cendr|noyé|noye|cadavre|patient|infirmi|chirurg|zombie|goule|momie|déchu|dechu|submerg/.test(n)) return 'squelette';
    if (/loup|bête|bete|aigle|anguille|méduse|meduse|kraken|léviathan|leviathan|(^|\s)ver(\s|$)|scarab|mante|lierre|orchid|fleur|ronce|dragon|serpent|phénix|phenix|chien|ours|griffe|croc|fauve|araign|(^|\s)rat(\s|$)|hydre|wyvern/.test(n)) return 'bete';
    if (/golem|titan|colosse|géant|geant|statue|sentinelle|gardien|automate|rouage|mécani|mecani|drone|machine|locomotive|marteau|enclume|forgeron|vitrail|cristal|verre|cloche|exécuteur|executeur|cybern|(^|\s)ia(\s|$)|murs|livre|page|chevalier|armure|pierre/.test(n)) return 'golem';
    if (/ombre|spectr|fantôme|fantome|reflet|écho|echo|double|anti-soi|vrai toi|songe|rêve|reve|cauchemar|dormeur|sorci|prêtre|pretre|horloger|voyageur|néant|neant|vide|follet|esprit|élémentaire|elementaire|étincelle|etincelle|flamme|tempête|tempete|démon|demon|mage|chaman/.test(n)) return 'ombre';
    return ['squelette', 'bete', 'golem', 'ombre'][_hash(nom) % 4];
  }

  // ── Dessins (viewBox 0 0 100 100) ─────────────────────────────────────
  // Chaque famille (= point faible) a plusieurs silhouettes ; le NOM choisit
  // la silhouette (mots-clés), sinon un hash stable : un même monstre garde
  // toujours le même dessin, mais deux monstres d'une famille diffèrent.
  // Jetons : __G dégradé du corps · __F lueur · __C couleur du thème.
  function _trait(d, w) {   // membre en trait : liseré couleur + cœur sombre
    return '<path d="' + d + '" fill="none" stroke="__C" stroke-opacity="0.7" stroke-width="' + (w + 2.6) + '" stroke-linecap="round" stroke-linejoin="round"/>'
         + '<path d="' + d + '" fill="none" stroke="#120e18" stroke-width="' + w + '" stroke-linecap="round" stroke-linejoin="round"/>';
  }
  var OEIL = 'fill="__C" filter="url(#__F)"';
  var DESSINS = {
    // ── SQUELETTES ──
    crane: {
      corps: 'M50 12C28 12 16 28 16 46c0 12 6 20 14 24v12h40V70c8-4 14-12 14-24C84 28 72 12 50 12z',
      yeux: '<ellipse cx="36" cy="47" rx="9" ry="10" fill="#020203"/><ellipse cx="64" cy="47" rx="9" ry="10" fill="#020203"/>'
          + '<circle cx="36" cy="48" r="3.4" ' + OEIL + '/><circle cx="64" cy="48" r="3.4" ' + OEIL + '/>',
      deco: '<path d="M50 56l-5 10h10z" fill="#020203"/><path d="M38 72v10M44 72v10M50 72v10M56 72v10M62 72v10" stroke="#020203" stroke-width="1.6"/>'
    },
    guerrier: {   // squelette casqué, épaulières
      arriere: '<path d="M12 96c2-16 12-28 26-30h24c14 2 24 14 26 30z" fill="url(#__G)" stroke="__C" stroke-opacity="0.6" stroke-width="1.2"/>'
             + '<path d="M40 74h20M38 80h24M40 86h20" stroke="#020203" stroke-width="2" opacity="0.7"/>',
      corps: 'M28 44Q28 14 50 12Q72 14 72 44v6c0 10-8 18-22 20-14-2-22-10-22-20z',
      yeux: '<rect x="33" y="32" width="34" height="5" rx="1" fill="#020203"/><circle cx="41" cy="34.5" r="2.2" ' + OEIL + '/><circle cx="59" cy="34.5" r="2.2" ' + OEIL + '/>',
      deco: '<path d="M48 37h4v16h-4z" fill="#020203"/><path d="M50 4l5 10h-10z" fill="__C" opacity="0.8"/>'
          + '<path d="M40 58v8M45 59v8M50 59v8M55 59v8M60 58v8" stroke="#020203" stroke-width="1.5"/>'
    },
    liche: {      // crâne couronné dans une robe
      arriere: '<path d="M18 96l8-34c4-8 12-12 24-12s20 4 24 12l8 34z" fill="url(#__G)" stroke="__C" stroke-opacity="0.55" stroke-width="1.2"/>',
      corps: 'M50 22c-14 0-22 10-22 22 0 8 4 13 9 16v8h26v-8c5-3 9-8 9-16 0-12-8-22-22-22z',
      yeux: '<ellipse cx="41" cy="44" rx="6" ry="7" fill="#020203"/><ellipse cx="59" cy="44" rx="6" ry="7" fill="#020203"/>'
          + '<circle cx="41" cy="45" r="2.6" ' + OEIL + '/><circle cx="59" cy="45" r="2.6" ' + OEIL + '/>',
      deco: '<path d="M30 24l4-16 8 11 8-15 8 15 8-11 4 16z" fill="__C" opacity="0.85" filter="url(#__F)"/>'
          + '<path d="M50 50l-3 6h6z" fill="#020203"/><path d="M44 62v6M50 62v6M56 62v6" stroke="#020203" stroke-width="1.4"/>'
    },
    // ── BÊTES ──
    loup: {
      corps: 'M50 22L30 6l4 24C22 36 16 48 18 60c2 14 16 28 32 32 16-4 30-18 32-32 2-12-4-24-16-30L70 6z',
      yeux: '<path d="M28 50l15 4-12 5z" ' + OEIL + '/><path d="M72 50l-15 4 12 5z" ' + OEIL + '/>',
      deco: '<path d="M41 73l4 11 3-11zM52 73l3 11 4-11z" fill="#e5e7eb" opacity="0.9"/><path d="M40 70q10 6 20 0" stroke="#020203" stroke-width="2" fill="none"/>'
    },
    insecte: {    // araignée / scarabée / mante
      arriere: _trait('M38 50L18 38 8 52M36 60L14 62 6 78M40 70L24 84 22 96M62 50l20-12 10 14M64 60l22 2 8 16M60 70l16 14 2 12', 3.4),
      corps: 'M50 34c-12 0-18 12-18 26s6 30 18 34c12-4 18-20 18-34s-6-26-18-26z',
      yeux: '<circle cx="50" cy="26" r="11" fill="url(#__G)" stroke="__C" stroke-opacity="0.75" stroke-width="1.2"/>'
          + '<circle cx="45" cy="25" r="2.3" ' + OEIL + '/><circle cx="55" cy="25" r="2.3" ' + OEIL + '/><circle cx="47" cy="19.5" r="1.4" ' + OEIL + '/><circle cx="53" cy="19.5" r="1.4" ' + OEIL + '/>',
      deco: '<path d="M44 34l-4 8M56 34l4 8" stroke="#e5e7eb" stroke-width="2" stroke-linecap="round" opacity="0.85"/>'
          + '<path d="M50 40v50M38 58q12 6 24 0M38 72q12 6 24 0" stroke="#020203" stroke-width="1.3" fill="none" opacity="0.6"/>'
    },
    serpent: {    // serpent / ver / anguille / léviathan
      arriere: _trait('M50 34C82 40 82 62 50 64S18 86 52 92', 11),
      corps: 'M50 6L68 22 60 36H40L32 22z',
      yeux: '<path d="M38 20l8 3-6 4z" ' + OEIL + '/><path d="M62 20l-8 3 6 4z" ' + OEIL + '/>',
      deco: '<path d="M44 34l2 9 2-9zM52 34l2 9 2-9z" fill="#e5e7eb" opacity="0.9"/><path d="M48 36l2 10 2-10" stroke="#ef4444" stroke-width="1" fill="none" opacity="0.7"/>'
          + '<path d="M58 46l6 4M60 56l6 2M40 72l-6 3M42 82l-6 1" stroke="__C" stroke-width="1.2" opacity="0.6"/>'
    },
    tentacules: { // kraken / méduse
      arriere: _trait('M30 44c-4 14 6 20 0 34s4 16 0 18M42 48c-2 14 6 22 2 34M58 48c2 14-6 22-2 34M70 44c4 14-6 20 0 34s-4 16 0 18', 4),
      corps: 'M18 48Q18 10 50 10T82 48c-6 4-12 0-16 4-6-4-10 0-16 0s-10-4-16 0c-4-4-10 0-16-4z',
      yeux: '<ellipse cx="40" cy="34" rx="6" ry="8" fill="#020203"/><ellipse cx="60" cy="34" rx="6" ry="8" fill="#020203"/>'
          + '<ellipse cx="40" cy="35" rx="2" ry="4.5" ' + OEIL + '/><ellipse cx="60" cy="35" rx="2" ry="4.5" ' + OEIL + '/>',
      deco: '<path d="M30 22q20-10 40 0" stroke="__C" stroke-width="1.2" fill="none" opacity="0.5"/>'
    },
    oiseau: {     // aigle / phénix
      corps: 'M50 26L22 14 4 34l18 6-14 16 26-4 6 14 10 22 10-22 6-14 26 4-14-16 18-6-18-20z',
      yeux: '<path d="M44 34l5 2-4 3z" ' + OEIL + '/><path d="M56 34l-5 2 4 3z" ' + OEIL + '/>',
      deco: '<path d="M47 40l3 9 3-9z" fill="#fbbf24" opacity="0.9"/><path d="M22 24l14 12M78 24L64 36M16 46l18-2M84 46l-18-2" stroke="#020203" stroke-width="1.3" opacity="0.6"/>'
    },
    plante: {     // fleur carnivore / lierre / ronce
      arriere: _trait('M50 92C46 80 54 74 50 62', 6) + _trait('M50 82c-10-2-18 2-24-6M50 76c10-2 16 2 22-6', 3),
      corps: 'M50 12l9 13 15-5-2 15 14 7-12 9 6 14-15-2-5 14-10-10-10 10-5-14-15 2 6-14-12-9 14-7-2-15 15 5z',
      yeux: '<circle cx="50" cy="40" r="13" fill="#020203"/><circle cx="50" cy="38" r="3.6" ' + OEIL + '/>',
      deco: '<path d="M39 44l4 6 3-6 4 7 4-7 3 6 4-6" stroke="#e5e7eb" stroke-width="1.4" fill="none" opacity="0.9"/>'
    },
    // ── GOLEMS ──
    golem: {
      corps: 'M40 12h20a4 4 0 0 1 4 4v14h6l8 10 4 30-10 4-2 18H56l-2-14h-8l-2 14H30l-2-18-10-4 4-30 8-10h6V16a4 4 0 0 1 4-4z',
      yeux: '<rect x="42" y="19" width="16" height="3.6" rx="1.8" ' + OEIL + '/>',
      deco: '<path d="M44 42l6 9-3 8 5 7" stroke="__C" stroke-width="1.4" fill="none" opacity="0.85" filter="url(#__F)"/><path d="M28 46l4 12M72 46l-4 12" stroke="#020203" stroke-width="1.4" opacity="0.6"/>'
    },
    automate: {   // drone / IA / rouages / mécanique
      arriere: '<path d="M50 14l5 0 2 6 6 2 5-4 4 4-4 5 2 6 6 2v6l-6 2-2 6 4 5-4 4-5-4-6 2-2 6h-6l-2-6-6-2-5 4-4-4 4-5-2-6-6-2v-6l6-2 2-6-4-5 4-4 5 4 6-2 2-6z" transform="translate(0 2)" fill="#0c0a12" stroke="__C" stroke-opacity="0.5" stroke-width="1"/>',
      corps: 'M50 22a18 18 0 1 1 0 36 18 18 0 1 1 0-36zM34 62h32l6 30H28z',
      yeux: '<circle cx="50" cy="40" r="9" fill="#020203"/><circle cx="50" cy="40" r="5" ' + OEIL + '/><circle cx="50" cy="40" r="1.8" fill="#020203"/>',
      deco: '<path d="M50 22V8" stroke="__C" stroke-width="1.6"/><circle cx="50" cy="7" r="2.4" ' + OEIL + '/>'
          + '<path d="M38 70h24M38 78h24M38 86h24" stroke="#020203" stroke-width="1.6" opacity="0.7"/><circle cx="44" cy="70" r="1.4" fill="__C"/><circle cx="56" cy="78" r="1.4" fill="__C"/>'
    },
    cristal: {    // statue / vitrail / verre / cristal / cloche
      arriere: '<path d="M26 92l-8-34 14-12 6 46zM74 92l8-34-14-12-6 46z" fill="url(#__G)" stroke="__C" stroke-opacity="0.6" stroke-width="1.1"/>',
      corps: 'M50 4l16 26-4 62H38l-4-62z',
      yeux: '<path d="M42 38l6 2-6 2z" ' + OEIL + '/><path d="M58 38l-6 2 6 2z" ' + OEIL + '/>',
      deco: '<path d="M50 4v88M34 30h32M44 52l6 8 6-8M40 70l10 6 10-6" stroke="__C" stroke-width="0.9" fill="none" opacity="0.55"/>'
          + '<path d="M44 14l6-6 4 10" fill="#fff" opacity="0.18"/>'
    },
    // ── OMBRES ──
    capuche: {
      corps: 'M50 8C30 8 20 26 20 46L14 92l12-8 8 10 8-10 8 10 8-10 8 10 8-10 12 8-6-46C80 26 70 8 50 8z',
      yeux: '<ellipse cx="50" cy="44" rx="17" ry="19" fill="#020203"/><circle cx="43" cy="45" r="2.8" ' + OEIL + '/><circle cx="57" cy="45" r="2.8" ' + OEIL + '/>',
      deco: '<path d="M50 64v22M38 66l-4 18M62 66l4 18" stroke="#020203" stroke-width="1.2" opacity="0.5"/>'
    },
    oeil: {       // néant / vide / rêves / cauchemars
      arriere: _trait('M28 70c-6 8-2 14-8 22M40 76c-2 8 2 12-2 20M60 76c2 8-2 12 2 20M72 70c6 8 2 14 8 22', 3),
      corps: 'M50 14a32 32 0 1 1 0 64 32 32 0 1 1 0-64z',
      yeux: '<path d="M24 46q26-22 52 0-26 22-52 0z" fill="#e5e7eb" opacity="0.92"/><circle cx="50" cy="46" r="10" ' + OEIL + '/><ellipse cx="50" cy="46" rx="2.6" ry="8" fill="#020203"/>',
      deco: '<path d="M50 4v8M22 20l6 6M78 20l-6 6M10 46h8M82 46h8" stroke="__C" stroke-width="2" stroke-linecap="round" opacity="0.7"/>'
    },
    flamme: {     // feu follet / esprit / élémentaire / tempête
      corps: 'M50 4c8 16 26 24 24 50-2 22-12 38-24 38S28 76 26 54c-2-18 12-24 14-40 6 10 8 14 10 22 2-12-2-20 0-32z',
      yeux: '<path d="M38 52l9 3-8 4z" ' + OEIL + '/><path d="M62 52l-9 3 8 4z" ' + OEIL + '/>',
      deco: '<path d="M42 70q8 6 16 0" stroke="#020203" stroke-width="2" fill="none"/><path d="M50 20c4 12 12 18 10 34" stroke="__C" stroke-width="1.2" fill="none" opacity="0.6"/>'
    },
    masque: {     // reflets / doubles / sans visage
      arriere: '<path d="M16 96c4-18 16-26 34-26s30 8 34 26z" fill="url(#__G)" stroke="__C" stroke-opacity="0.55" stroke-width="1.2"/>',
      corps: 'M50 8c16 0 26 12 26 30 0 20-12 34-26 36-14-2-26-16-26-36 0-18 10-30 26-30z',
      yeux: '<path d="M34 36q7-5 13 1-7 3-13-1z" fill="#020203"/><path d="M66 36q-7-5-13 1 7 3 13-1z" fill="#020203"/>'
          + '<circle cx="40" cy="36" r="1.8" ' + OEIL + '/><circle cx="60" cy="36" r="1.8" ' + OEIL + '/>',
      deco: '<path d="M50 8l-3 14 5 8-4 12 3 10-2 22" stroke="__C" stroke-width="1.3" fill="none" opacity="0.8" filter="url(#__F)"/>'
          + '<path d="M42 56q8 4 16 0" stroke="#020203" stroke-width="1.6" fill="none"/>'
    }
  };
  var PAR_FAMILLE = {
    squelette: ['crane', 'guerrier', 'liche'],
    bete: ['loup', 'insecte', 'serpent', 'tentacules', 'oiseau', 'plante'],
    golem: ['golem', 'automate', 'cristal'],
    ombre: ['capuche', 'oeil', 'flamme', 'masque']
  };
  function _dessin(nom, famille) {
    var n = String(nom || '').toLowerCase();
    var regles = [
      ['guerrier', /gladiateur|garde|champion|chevalier|soldat|exécuteur(?!.*cyber)/],
      ['liche', /liche|roi|reine|seigneur|prêtre|pretre|chirurg|infirmi/],
      ['crane', /crâne|crane|os |carcasse|cendr|calcin|noyé|noye|patient/],
      ['insecte', /scarab|mante|araign|insecte|chitin/],
      ['serpent', /serpent|(^|\s)ver(\s|$)|anguille|léviathan|leviathan|hydre/],
      ['tentacules', /kraken|méduse|meduse|pieuvre/],
      ['oiseau', /aigle|phénix|phenix|corbeau|oiseau|wyvern/],
      ['plante', /lierre|orchid|fleur|ronce|racine/],
      ['loup', /loup|bête|bete|chien|fauve|croc|ours/],
      ['automate', /drone|(^|\s)ia(\s|$)|rouage|automate|mécani|mecani|cybern|locomotive|horloger/],
      ['cristal', /cristal|vitrail|verre|statue|cloche|choriste|glace|givre|frimas/],
      ['golem', /golem|titan|colosse|géant|geant|sentinelle|marteau|enclume|forgeron|murs/],
      ['oeil', /néant|neant|vide|songe|rêve|reve|cauchemar|dormeur|étoile|etoile|tisseur/],
      ['flamme', /flamme|follet|étincelle|etincelle|élémentaire|elementaire|esprit|tempête|tempete|feu|solaire/],
      ['masque', /reflet|double|écho|echo|anti-soi|vrai toi|visage|translucide|inversé|inverse/],
      ['capuche', /ombre|spectr|fantôme|fantome|sorci|conducteur|contrôleur|controleur|hacker/]
    ];
    var liste = PAR_FAMILLE[famille] || PAR_FAMILLE.ombre;
    for (var i = 0; i < regles.length; i++) {
      // la silhouette doit appartenir à la famille (le point faible reste lisible)
      if (regles[i][1].test(n) && liste.indexOf(regles[i][0]) >= 0) return regles[i][0];
    }
    return liste[_hash(nom) % liste.length];
  }
  function _forme(nom, col) {
    return DESSINS[_dessin(nom, _type(nom))];
  }

  // v1459 : image illustrée par silhouette (images/Monstres/monstre_<dessin>.webp),
  // le dessin SVG reste en repli si l'image ne charge pas.
  var _repli = {};
  // Monstres nommés qui ont leur propre image (sous-boss ; les boss viendront ici).
  var IMG_NOM = {
    'le cavalier des cendres': 'sousboss_cavalier', 'le colosse de fer': 'sousboss_colosse',
    'l\u2019ombre dansante': 'sousboss_ombre', "l'ombre dansante": 'sousboss_ombre', 'le siphon affamé': 'sousboss_siphon',
    // monstres échappés des Failles (chasses)
    'gobelin rebelle': 'echappe_gobelin', "loup d'ombre": 'echappe_loup', 'loup d\u2019ombre': 'echappe_loup', 'chevalier brisé': 'echappe_chevalier',
    'spectre médical': 'echappe_spectre', 'parasite croissant': 'echappe_parasite', 'ombre fragmentée': 'echappe_ombre',
    // boss des Failles (v1466-1467) + boss final
    "reine de l'aurore": 'boss_frozen_aurora', 'reine de l\u2019aurore': 'boss_frozen_aurora', 'le dormeur éternel': 'boss_dream_engine', 'le vide lumineux': 'boss_hollow_sun',
    "l'effaceur": 'boss_final', 'l\u2019effaceur': 'boss_final',
    // v1495 : boss familiaux
    'colosse de pierre': 'famille_colosse', 'hydre des abysses': 'famille_hydre', 'golem runique': 'famille_golem', 'léviathan éternel': 'famille_leviathan',
    // v1489 : ses formes selon la phase du combat final (repli : boss_final)
    'l\u2019effaceur assis': 'boss_final_assis', 'l\u2019effaceur rouge': 'boss_final_rouge', 'l\u2019effaceur ultime': 'boss_final_ultime',
    "sentinelle figée": 'boss_frozen_city', "léviathan organique": 'boss_organic_desert', "léviathan des abysses": 'boss_underground_ocean', "anti-soi": 'boss_inverted_reality', "cœur battant des murs": 'boss_living_hospital', "locomotive vivante": 'boss_dimensional_train', "le livre interdit": 'boss_infinite_library', "enclume stellaire": 'boss_celestial_forge', "fleur-mère carnivore": 'boss_carnivore_garden', "cloche du jugement": 'boss_glass_cathedral', "phénix éteint": 'boss_ash_wasteland', "grande mécanique": 'boss_clockwork_void', "roi des profondeurs": 'boss_drowned_palace', "le vrai toi": 'boss_mirror_labyrinth', "titan ressuscité": 'boss_titan_graveyard', "seigneur de la tempête": 'boss_storm_peak', "cœur du marais": 'boss_whisper_marsh', "ia souveraine": 'boss_neon_megacity', "colosse de l'arène": 'boss_bone_colosseum', "colosse de l\u2019arène": 'boss_bone_colosseum'
  };
  function _fichier(nom) {
    var k = String(nom || '').toLowerCase().replace(/\s*\((boss|élite|elite|alpha)\)\s*$/i, '').replace(/^[^a-zàâäéèêëîïôöùûüç0-9]+/i, '').trim();
    return IMG_NOM[k] || ('monstre_' + _dessin(nom, _type(nom)));
  }
  window.__awkMonRepli = function (id) { var s = _repli[id] || ''; delete _repli[id]; return s; };
  window.__awkMonErr = function (img, id) {
    var r = img.getAttribute('data-r2');
    if (r) { img.removeAttribute('data-r2'); img.src = r; return; }
    img.parentNode.outerHTML = window.__awkMonRepli(id);
  };
  function monstre(nom, col, taille, boss) {
    _styles();
    col = col || '#a855f7';
    var px = taille || 96, fic = _fichier(nom), id = 'awkMi' + (++_uid);
    _repli[id] = _monstreSvg(nom, col, taille, boss);
    return '<div class="awk-mon-img" data-emoji-keep style="position:relative;width:' + px + 'px;height:' + px + 'px;display:block;">'
      + '<div class="awk-mon-aura" style="position:absolute;inset:' + (boss ? '-6%' : '4%') + ';border-radius:50%;background:radial-gradient(circle,' + col + '55 0%,' + col + '00 68%);"></div>'
      + (boss ? '<div class="awk-mon-anneau" style="position:absolute;inset:-4%;border-radius:50%;border:1px dashed ' + col + '88;"></div>' : '')
      + '<img class="awk-mon-corps" src="images/Monstres/' + fic + '.webp" alt="" draggable="false" width="' + px + '" height="' + px + '"'
      +   ' style="position:relative;width:100%;height:100%;object-fit:contain;display:block;filter:drop-shadow(0 4px 10px rgba(0,0,0,0.7)) drop-shadow(0 0 6px ' + col + '66);"'
      +   (fic.indexOf('boss_final_') === 0 ? ' data-r2="images/Monstres/boss_final.webp"' : '')
      +   ' onerror="window.__awkMonErr(this,\'' + id + '\')">'
      + '</div>';
  }
  function _monstreSvg(nom, col, taille, boss) {
    col = col || '#a855f7';
    var id = 'awkM' + (++_uid), f = _forme(nom, col), px = taille || 96;
    function _jetons(t) { return t.replace(/__F/g, id + 'f').replace(/__G/g, id + 'g').replace(/__C/g, col); }
    var defs = '<defs>'
      + '<radialGradient id="' + id + 'g" cx="50%" cy="35%" r="70%"><stop offset="0%" stop-color="' + col + '" stop-opacity="0.55"/>'
      +   '<stop offset="55%" stop-color="#14101c"/><stop offset="100%" stop-color="#050508"/></radialGradient>'
      + '<radialGradient id="' + id + 'a" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="' + col + '" stop-opacity="0.45"/>'
      +   '<stop offset="100%" stop-color="' + col + '" stop-opacity="0"/></radialGradient>'
      + '<filter id="' + id + 'f" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="1.6" result="b"/>'
      +   '<feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>'
      + '</defs>';
    var s = '<svg viewBox="-10 -10 120 120" width="' + px + '" height="' + px + '" aria-hidden="true" data-emoji-keep style="display:block;overflow:visible;">'
      + defs
      + '<circle class="awk-mon-aura" cx="50" cy="52" r="' + (boss ? 56 : 48) + '" fill="url(#' + id + 'a)"/>'
      + (boss ? '<circle class="awk-mon-anneau" cx="50" cy="52" r="54" fill="none" stroke="' + col + '" stroke-opacity="0.55" stroke-width="1" stroke-dasharray="3 6"/>' : '')
      + '<ellipse cx="50" cy="97" rx="30" ry="4" fill="#000" opacity="0.45"/>'
      + '<g class="awk-mon-corps">'
      +   (boss ? '<path d="M30 20l4-16 6 13M70 20l-4-16-6 13" fill="none" stroke="' + col + '" stroke-width="2.4" stroke-linecap="round" filter="url(#' + id + 'f)"/>' : '')
      +   _jetons(f.arriere || '')
      +   '<path d="' + f.corps + '" fill="url(#' + id + 'g)" stroke="' + col + '" stroke-opacity="0.75" stroke-width="1.3" stroke-linejoin="round"/>'
      +   _jetons(f.deco)
      +   '<g class="awk-mon-yeux">' + _jetons(f.yeux) + '</g>'
      + '</g></svg>';
    return s;
  }

  // ── Bandeau de combat pendant la séance ──
  function _barre(label, val, pct, col) {
    return '<div style="flex:1;min-width:0;">'
      + '<div style="display:flex;justify-content:space-between;align-items:baseline;font-size:0.54em;letter-spacing:1.2px;font-weight:900;color:#94a3b8;margin-bottom:3px;">'
      +   '<span>' + label + '</span><span style="color:' + col + ';font-variant-numeric:tabular-nums;">' + val + '</span></div>'
      + '<div style="position:relative;height:9px;border-radius:99px;overflow:hidden;background:#07090e;border:1px solid ' + col + '33;box-shadow:inset 0 2px 4px rgba(0,0,0,0.8);">'
      +   '<div class="awk-hud-jauge" style="position:absolute;inset:0;width:' + pct + '%;background:linear-gradient(90deg,' + col + 'bb,' + col + ');box-shadow:0 0 10px ' + col + '88;transition:width .5s cubic-bezier(.16,1,.3,1);border-radius:99px;"></div>'
      + '</div></div>';
  }

  function hud(d) {
    var view = document.getElementById('exerciseView');
    var el = document.getElementById('awakRiftHud');
    if (!d || !view) { if (el) el.remove(); return; }
    _styles();
    var col = d.couleur || '#a855f7';
    if (!el) {
      el = document.createElement('div');
      el.id = 'awakRiftHud';
      var bar = document.getElementById('workoutTopBar');
      if (bar && bar.parentNode === view) view.insertBefore(el, bar.nextSibling); else view.insertBefore(el, view.firstChild);
    }
    var cle = d.nom + '|' + d.vague;

    var pPct = d.joueurMax > 0 ? Math.max(0, Math.min(100, Math.round(d.joueur / d.joueurMax * 100))) : 0;
    var pCol = pPct <= 25 ? '#f87171' : pPct <= 50 ? '#fbbf24' : '#60a8f0';
    var mPct = d.pvMax > 0 ? Math.max(0, Math.min(100, Math.round(d.pv / d.pvMax * 100))) : 0;
    var pips = '';
    for (var i = 0; d.vagues > 1 && i < d.vagues; i++) {
      var fait = i < d.vague - 1, ici = i === d.vague - 1, boss = i === d.vagues - 1;
      pips += '<span style="display:inline-block;width:' + (boss ? 9 : 7) + 'px;height:' + (boss ? 9 : 7) + 'px;transform:rotate(45deg);'
        + 'border:1px solid ' + (fait || ici ? col : 'rgba(148,163,184,0.4)') + ';'
        + 'background:' + (fait ? col : ici ? col + '55' : 'transparent') + ';' + (ici ? 'box-shadow:0 0 8px ' + col + ';' : '') + '"></span>';
    }

    el.style.cssText = 'margin:8px 12px 4px;padding:9px 12px;border-radius:14px;position:relative;overflow:hidden;'
      + 'background-color:#0a0b12;background-image:linear-gradient(120deg,' + col + '26,rgba(10,11,18,0.92) 55%),url(images/faille_ouverte.webp);'
      + 'background-size:cover;background-position:center;border:1px solid ' + col + '55;box-shadow:0 0 18px ' + col + '22;';
    // Structure persistante : le monstre n'est redessiné que si la cible change,
    // sinon les re-rendus successifs couperaient l'animation de coup.
    if (!el.querySelector('.awk-hud-c')) {
      el.innerHTML = '<div style="display:flex;align-items:center;gap:10px;">'
        + '<div class="awk-hud-mon" style="position:relative;flex-shrink:0;width:62px;height:62px;"></div>'
        + '<div class="awk-hud-c" style="flex:1;min-width:0;"></div></div>'
        // Journal de combat intégré : résumé cliquable + liste dépliable
        + '<div class="awk-hud-pied" style="display:none;align-items:center;justify-content:space-between;gap:8px;margin-top:8px;padding-top:7px;border-top:1px solid rgba(255,255,255,0.08);font-size:0.66em;font-weight:800;color:#cbd5e1;cursor:pointer;"></div>'
        + '<div class="awk-hud-j" style="display:none;max-height:170px;overflow-y:auto;-webkit-overflow-scrolling:touch;margin-top:4px;"></div>';
      el.addEventListener('click', function (e) {
        if (!el.querySelector('.awk-hud-pied') || el.querySelector('.awk-hud-pied').style.display === 'none') return;
        if (e.target.closest && e.target.closest('.awk-hud-j')) return;   // défiler la liste ne la ferme pas
        el.setAttribute('data-ouvert', el.getAttribute('data-ouvert') === '1' ? '0' : '1');
        _majJournal(el);
      });
    }
    var mon = el.querySelector('.awk-hud-mon');
    if (el.getAttribute('data-cle') !== cle) {
      mon.innerHTML = monstre(d.nom, col, 62, d.boss);
      el.setAttribute('data-cle', cle);
    }
    var cache = !!d.cache;
    el.querySelector('.awk-hud-c').innerHTML =
        '<div style="display:flex;align-items:center;gap:6px;margin-bottom:5px;">'
      +   '<span style="font-size:0.78em;font-weight:900;color:#fff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0;">' + d.nom + '</span>'
      +   (d.boss ? '<span style="flex-shrink:0;font-size:0.5em;font-weight:900;letter-spacing:1.5px;color:' + col + ';border:1px solid ' + col + '77;border-radius:5px;padding:1px 5px;">BOSS</span>' : '')
      +   (faiblesse(d.nom) ? puceFaiblesse(faiblesse(d.nom), col, true) : '')
      +   '<span style="margin-left:auto;display:flex;gap:4px;align-items:center;flex-shrink:0;">' + pips + '</span>'
      + '</div>'
      + '<div style="display:flex;flex-direction:column;gap:5px;">'
      +   _barre('ENNEMI', cache ? '???' : d.pv + ' / ' + d.pvMax, cache ? 100 : mPct, cache ? '#64748b' : '#f87171')
      +   (d.joueurMax != null ? _barre('TOI', Math.round(d.joueur) + ' / ' + Math.round(d.joueurMax), pPct, pCol) : '')   // v1304 : Chasse = pas de PV joueur
      + '</div>'
      + (d.ouverture ? '<div style="margin-top:6px;padding:4px 7px;border-radius:7px;background:rgba(251,191,36,0.12);border:1px solid rgba(251,191,36,0.5);'
          + 'font-size:0.6em;font-weight:900;color:#fbbf24;letter-spacing:0.4px;line-height:1.3;">LE BOSS SE DÉCOUVRE — ' + d.ouverture + ' reps ou plus = dégâts ×2,5</div>' : '')
      + (d.mecanique ? '<div style="margin-top:5px;font-size:0.58em;font-weight:800;color:#e2e8f0;letter-spacing:0.3px;line-height:1.3;opacity:0.9;">' + d.mecanique + '</div>' : '');

    // Coup reçu : tremblement + dégâts flottants (une seule fois par coup)
    var c = d.coup;
    if (c && c.t && String(c.t) !== el.getAttribute('data-coup') && Date.now() - c.t < 3000 && c.dmg > 0) {
      el.setAttribute('data-coup', String(c.t));
      var svg = mon.querySelector('.awk-mon-img') || mon.querySelector('svg');
      if (svg) { svg.classList.remove('awk-mon-touche'); void svg.getBoundingClientRect(); svg.classList.add('awk-mon-touche'); }
      var dg = document.createElement('span');
      dg.className = 'awk-dgt';
      dg.style.cssText = 'font-size:' + (c.crit ? '1.05em' : '0.9em') + ';color:' + (c.crit ? '#fbbf24' : '#fff') + ';';
      dg.textContent = (c.crit ? 'CRIT ' : '') + '-' + c.dmg;
      mon.appendChild(dg);
      setTimeout(function () { try { dg.remove(); } catch (e) {} }, 1400);
    }
  }

  function _majJournal(el) {
    var pied = el.querySelector('.awk-hud-pied'), liste = el.querySelector('.awk-hud-j');
    if (!pied || !liste) return;
    var ouvert = el.getAttribute('data-ouvert') === '1';
    liste.style.display = (ouvert && pied.style.display !== 'none') ? 'block' : 'none';
    var chev = pied.querySelector('.awk-hud-chev');
    if (chev) chev.style.transform = ouvert ? 'rotate(180deg)' : 'none';
  }

  // d = { resume: html, lignes: html } ou null (aucun coup encore)
  function journal(d) {
    var el = document.getElementById('awakRiftHud');
    if (!el) return false;
    var pied = el.querySelector('.awk-hud-pied'), liste = el.querySelector('.awk-hud-j');
    if (!pied || !liste) return false;
    if (!d) { pied.style.display = 'none'; liste.style.display = 'none'; liste.innerHTML = ''; return true; }
    pied.style.display = 'flex';
    pied.innerHTML = '<span style="display:inline-flex;align-items:center;gap:6px;">'
      + (window.AwakIcon ? AwakIcon.get('liste', 13, '#94a3b8') : '') + 'Journal de combat</span>'
      + '<span style="display:inline-flex;align-items:center;gap:6px;">' + d.resume
      + '<svg class="awk-hud-chev" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="#94a3b8" stroke-width="2.4" stroke-linecap="round" style="transition:transform .2s;"><path d="m6 9 6 6 6-6"/></svg></span>';
    liste.innerHTML = d.lignes;
    _majJournal(el);
    return true;
  }

  // ── Points faibles : chaque famille de monstre craint un type d'effort ──
  // Pousse le joueur vers des exercices qu'il ne choisirait pas d'habitude.
  var FAIBLESSES = { squelette: 'explosif', bete: 'cardio', golem: 'force', ombre: 'abdos' };
  var EFFORTS = {
    explosif: { nom: 'Explosif',  icone: 'eclair',   raison: 'Ses os éclatent sous les impacts : sauts, burpees, mouvements explosifs.' },
    cardio:   { nom: 'Cardio',    icone: 'course',   raison: 'Elle s\'épuise si tu tiens le rythme : cardio et endurance.' },
    force:    { nom: 'Force',     icone: 'halter',   raison: 'Seule la charge le fissure : squats, développés, tirages.' },
    abdos:    { nom: 'Abdos',     icone: 'bouclier', raison: 'Reste ancré face à l\'ombre : abdos et tronc.' }
  };
  var BONUS_FAIBLESSE = 1.5;
  function faiblesse(nom) { return FAIBLESSES[_type(nom)] || null; }
  function effortInfo(id) { return EFFORTS[id] || null; }
  function puceFaiblesse(id, col, petit) {
    var e = EFFORTS[id]; if (!e) return '';
    return '<span style="display:inline-flex;align-items:center;gap:4px;flex-shrink:0;font-size:' + (petit ? '0.5em' : '0.62em') + ';font-weight:900;letter-spacing:0.8px;'
      + 'color:#fbbf24;border:1px solid rgba(251,191,36,0.5);background:rgba(251,191,36,0.1);border-radius:6px;padding:' + (petit ? '1px 5px' : '3px 8px') + ';">'
      + (window.AwakIcon ? AwakIcon.get(e.icone, petit ? 10 : 12, '#fbbf24') : '') + (petit ? '' : 'POINT FAIBLE : ') + e.nom.toUpperCase() + '</span>';
  }

  // ── v1469 : présentation du boss, version « cinéma » (~3,6 s, se ferme seule) ──
  // Bandes noires, éclair, rayons tournants, onde de choc, nom qui s'écrase,
  // braises, bandeaux « AVERTISSEMENT » qui défilent, vibration du téléphone.
  function bossIntro(o) {
    o = o || {};
    _styles();
    var vieux = document.getElementById('awkBossIntro'); if (vieux) vieux.remove();
    var col = o.couleur || '#a855f7';
    var calme = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var duree = o.duree || 3600;
    if (!document.getElementById('awkBossIntroCss2')) {
      var st = document.createElement('style'); st.id = 'awkBossIntroCss2';
      st.textContent =
          '#awkBossIntro{position:fixed;inset:0;z-index:30500;overflow:hidden;cursor:pointer;background:#030306;display:flex;align-items:center;justify-content:center;}'
        + '#awkBossIntro .bi-scene{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;padding:24px;text-align:center;animation:biSecousse .5s .55s both;}'
        + '#awkBossIntro .bi-flash{position:absolute;inset:0;background:#fff;opacity:0;animation:biFlash .5s ease-out;pointer-events:none;z-index:5;}'
        + '#awkBossIntro .bi-rayons{position:absolute;left:50%;top:44%;width:180vmax;height:180vmax;margin:-90vmax 0 0 -90vmax;opacity:.55;animation:biTourne 9s linear infinite,biApparait .8s ease-out both;}'
        + '#awkBossIntro .bi-halo{position:absolute;left:50%;top:44%;width:min(110vw,560px);height:min(110vw,560px);transform:translate(-50%,-50%);border-radius:50%;animation:biPulse 1.6s ease-in-out infinite;}'
        + '#awkBossIntro .bi-onde{position:absolute;left:50%;top:44%;width:60px;height:60px;margin:-30px 0 0 -30px;border-radius:50%;opacity:0;animation:biOnde .9s .55s ease-out;}'
        + '#awkBossIntro .bi-bande{position:absolute;left:0;right:0;height:13vh;max-height:120px;background:#000;z-index:4;display:flex;align-items:center;overflow:hidden;}'
        + '#awkBossIntro .bi-bande.h{top:0;animation:biBandeH .45s cubic-bezier(.2,.9,.2,1) both;}'
        + '#awkBossIntro .bi-bande.b{bottom:0;animation:biBandeB .45s cubic-bezier(.2,.9,.2,1) both;}'
        + '#awkBossIntro .bi-defile{white-space:nowrap;font-family:var(--font-display),sans-serif;font-weight:700;font-size:13px;letter-spacing:5px;opacity:.9;animation:biDefile 6s linear infinite;}'
        + '#awkBossIntro .bi-bande.b .bi-defile{animation-direction:reverse;}'
        + '#awkBossIntro .bi-ligne{position:absolute;left:0;right:0;height:2px;z-index:4;}'
        + '#awkBossIntro .bi-sous{font-family:var(--font-display),sans-serif;font-size:14px;font-weight:700;letter-spacing:9px;padding-left:9px;animation:biSous .6s .2s both;}'
        + '#awkBossIntro .bi-mon{position:relative;z-index:2;animation:biChute .6s cubic-bezier(.3,1.5,.5,1) both;}'
        + '#awkBossIntro .bi-nom{position:relative;z-index:3;font-family:var(--font-display),sans-serif;font-weight:700;line-height:1.05;color:#fff !important;max-width:92vw;text-wrap:balance;animation:biEcrase .45s .75s cubic-bezier(.2,1.6,.4,1) both;}'
        + '#awkBossIntro .bi-braise{position:absolute;bottom:-10px;width:4px;height:4px;border-radius:50%;opacity:0;animation:biBraise linear infinite;}'
        + '#awkBossIntro .bi-temps{width:140px;height:3px;border-radius:99px;background:rgba(255,255,255,0.1);overflow:hidden;margin-top:14px;z-index:3;}'
        + '#awkBossIntro.sort{animation:biSort .45s ease-in forwards;}'
        + '@keyframes biFlash{0%{opacity:.95}100%{opacity:0}}'
        + '@keyframes biTourne{to{transform:rotate(360deg)}}'
        + '@keyframes biApparait{from{opacity:0}}'
        + '@keyframes biPulse{0%,100%{opacity:.75;transform:translate(-50%,-50%) scale(1)}50%{opacity:1;transform:translate(-50%,-50%) scale(1.07)}}'
        + '@keyframes biOnde{0%{opacity:.9;transform:scale(1)}100%{opacity:0;transform:scale(14)}}'
        + '@keyframes biBandeH{from{transform:translateY(-100%)}}'
        + '@keyframes biBandeB{from{transform:translateY(100%)}}'
        + '@keyframes biDefile{from{transform:translateX(0)}to{transform:translateX(-50%)}}'
        + '@keyframes biSous{0%{opacity:0;letter-spacing:22px}100%{opacity:1}}'
        + '@keyframes biChute{0%{opacity:0;transform:translateY(-60px) scale(1.5);filter:brightness(0) blur(6px)}60%{opacity:1;filter:brightness(2.2)}100%{transform:none;filter:none}}'
        + '@keyframes biEcrase{0%{opacity:0;transform:scale(2.6);filter:blur(8px)}100%{opacity:1;transform:none;filter:none}}'
        + '@keyframes biSecousse{0%,100%{transform:none}15%{transform:translate(-9px,5px)}30%{transform:translate(8px,-6px)}45%{transform:translate(-6px,-3px)}60%{transform:translate(5px,4px)}80%{transform:translate(-2px,1px)}}'
        + '@keyframes biBraise{0%{opacity:0;transform:translateY(0)}15%{opacity:1}100%{opacity:0;transform:translateY(-105vh)}}'
        + '@keyframes biBarre{from{transform:scaleX(1)}to{transform:scaleX(0)}}'
        + '@keyframes biSort{to{opacity:0;transform:scale(1.12);filter:blur(4px)}}'
        + '@media(prefers-reduced-motion:reduce){#awkBossIntro *,#awkBossIntro{animation:none!important}#awkBossIntro .bi-rayons{opacity:.35}}';
      document.head.appendChild(st);
    }
    var el = document.createElement('div');
    el.id = 'awkBossIntro';
    el.setAttribute('data-emoji-keep', '');
    if (o.zIndex) el.style.zIndex = String(o.zIndex);
    el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Boss : ' + (o.nom || ''));
    // couleur via variable : le thème sombre remplace certains « color:#… » exacts
    el.style.setProperty('--bic', col);
    var nom = String(o.nom || '').replace(/\s*\(boss\)\s*$/i, '');
    var sous = o.sousTitre || 'BOSS';
    var px = Math.min(300, Math.round(Math.min(window.innerWidth, window.innerHeight * 0.6) * 0.72));
    var texteBande = ('AVERTISSEMENT · ' + sous + ' · ').repeat(8);
    var braises = '';
    for (var i = 0; i < (calme ? 0 : 22); i++) {
      braises += '<span class="bi-braise" style="left:' + (Math.random() * 100).toFixed(1) + '%;background:' + col + ';box-shadow:0 0 8px ' + col + ';'
        + 'animation-duration:' + (2.2 + Math.random() * 2.2).toFixed(2) + 's;animation-delay:' + (Math.random() * 1.6).toFixed(2) + 's;'
        + 'transform:scale(' + (0.6 + Math.random() * 1.2).toFixed(2) + ');"></span>';
    }
    el.innerHTML =
        '<div class="bi-rayons" style="background:repeating-conic-gradient(from 0deg,' + col + '26 0deg 7deg,transparent 7deg 22deg);'
      +   '-webkit-mask:radial-gradient(circle,#000 0%,transparent 55%);mask:radial-gradient(circle,#000 0%,transparent 55%);"></div>'
      + '<div class="bi-halo" style="background:radial-gradient(circle,' + col + '55 0%,' + col + '14 40%,transparent 68%);"></div>'
      + '<div class="bi-onde" style="border:3px solid ' + col + ';box-shadow:0 0 30px ' + col + ';"></div>'
      + braises
      + '<div class="bi-scene">'
      +   '<div class="bi-sous" style="color:var(--bic);text-shadow:0 0 14px ' + col + ';">' + sous + '</div>'
      +   '<div class="bi-mon" style="filter:drop-shadow(0 0 28px ' + col + 'aa);">' + monstre(o.monstreNom || o.nom, col, px, false) + '</div>'
      +   '<div class="bi-nom" style="font-size:clamp(30px,9.5vw,46px);text-shadow:0 0 28px ' + col + ',3px 0 0 ' + col + 'aa,-3px 0 0 rgba(255,255,255,0.25);">' + nom + '</div>'
      +   (o.ligne ? '<div style="font-size:14px;color:#cbd5e1;font-style:italic;max-width:320px;margin-top:6px;z-index:3;">' + o.ligne + '</div>' : '')
      +   '<div class="bi-temps"><div style="height:100%;background:' + col + ';box-shadow:0 0 8px ' + col + ';transform-origin:left;animation:biBarre ' + duree + 'ms linear forwards;"></div></div>'
      + '</div>'
      + '<div class="bi-bande h"><div class="bi-defile" style="color:var(--bic);">' + texteBande + texteBande + '</div></div>'
      + '<div class="bi-bande b"><div class="bi-defile" style="color:var(--bic);">' + texteBande + texteBande + '</div></div>'
      + '<div class="bi-ligne" style="top:min(13vh,120px);background:linear-gradient(90deg,transparent,' + col + ',transparent);"></div>'
      + '<div class="bi-ligne" style="bottom:min(13vh,120px);background:linear-gradient(90deg,transparent,' + col + ',transparent);"></div>'
      + (calme ? '' : '<div class="bi-flash"></div>');
    var fini = false;
    function fermer() {
      if (fini) return; fini = true;
      el.classList.add('sort');
      setTimeout(function () { el.remove(); try { if (typeof o.apres === 'function') o.apres(); } catch (e) {} }, 450);
    }
    el.addEventListener('click', fermer);
    document.body.appendChild(el);
    try { if (!calme && navigator.vibrate) setTimeout(function () { navigator.vibrate([70, 50, 140]); }, 550); } catch (e) {}
    setTimeout(fermer, duree);
    return el;
  }

  window.AwakRiftVis = { bossIntro: bossIntro, monstre: monstre, hud: hud, journal: journal, type: _type, dessin: function (n) { return _dessin(n, _type(n)); },
    faiblesse: faiblesse, effortInfo: effortInfo, puceFaiblesse: puceFaiblesse, BONUS_FAIBLESSE: BONUS_FAIBLESSE };
})();
