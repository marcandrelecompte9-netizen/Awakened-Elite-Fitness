/* ═══════════════════════════════════════════════════════════════════════
   ⚔  ICÔNES D'ÉQUIPEMENT (SVG) — Awakened
   -----------------------------------------------------------------------
   Remplace les emojis des objets du jeu par des icônes SVG :
     • une forme par EMPLACEMENT, avec des variantes par type d'objet
       (épée, dague, hache, faux, anneau, amulette…) déduites du NOM ;
     • colorée selon la RARETÉ (E gris → S or → SS mythique rouge) ;
     • halo à partir de B, plus marqué pour S et SS.

   Pourquoi : les emojis changeaient de dessin selon le téléphone, ne
   prenaient pas la couleur de rareté, et le filtre « sans emoji » pouvait
   les effacer (case vide dans l'inventaire).

   Fonctionnement : chargé JUSTE APRÈS data/items.js, il réécrit `icon` de
   chaque objet d'EQUIPMENT_DATABASE (l'emoji d'origine reste dans
   `iconEmoji`). Le SVG fait 1em × 1em : il prend la taille de police que
   chaque écran donnait déjà à l'emoji — aucun écran à modifier.
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var COULEUR = {
    common: '#94a3b8', uncommon: '#22c55e', rare: '#3b82f6', superior: '#06b6d4',
    epic: '#a855f7', legendary: '#f59e0b', mythic: '#f43f5e'
  };
  var HALO = { superior: 2, epic: 3, legendary: 4, mythic: 6 };

  // Tracés 24 × 24. `F` = partie pleine (remplissage translucide), `T` = trait.
  var P = {
    casque:   { F: 'M4 16v-3a8 8 0 0 1 16 0v3z', T: 'M4 16v-3a8 8 0 0 1 16 0v3M3 16h18v2.5H3zM8 12.5h8M12 5v4' },
    couronne: { F: 'M3.5 17l1.5-9.5 4.5 4 2.5-6 2.5 6 4.5-4 1.5 9.5z', T: 'M3.5 17l1.5-9.5 4.5 4 2.5-6 2.5 6 4.5-4 1.5 9.5zM3.5 20h17' },
    capuche:  { F: 'M12 3c-4.5 0-7.5 4-7.5 9v8h15v-8c0-5-3-9-7.5-9z', T: 'M12 3c-4.5 0-7.5 4-7.5 9v8h15v-8c0-5-3-9-7.5-9zM8.5 20v-5a3.5 3.5 0 0 1 7 0v5' },
    bandeau:  { F: 'M4 10.5c2.3-1.5 5-2.3 8-2.3s5.7.8 8 2.3v3.2c-2.3-1.5-5-2.3-8-2.3s-5.7.8-8 2.3z', T: 'M4 10.5c2.3-1.5 5-2.3 8-2.3s5.7.8 8 2.3v3.2c-2.3-1.5-5-2.3-8-2.3s-5.7.8-8 2.3zM18.5 13l2.5 5M17 13.5l1 4.5' },
    masque:   { F: 'M2.5 12S6 6 12 6s9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6z', T: 'M2.5 12S6 6 12 6s9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z' },
    cuirasse: { F: 'M7 3.5L3 6.5l2 5 2-1V20h10v-9.5l2 1 2-5-4-3-2 2h-6z', T: 'M7 3.5L3 6.5l2 5 2-1V20h10v-9.5l2 1 2-5-4-3-2 2h-6zM12 8v12M9 13h6' },
    manteau:  { F: 'M12 3.5L9 5.5 4 20h16L15 5.5z', T: 'M12 3.5L9 5.5 4 20h16L15 5.5zM9 5.5l3 3 3-3M8.5 20l1.5-9M15.5 20L14 11' },
    gantelet: { F: 'M7 20.5v-5l-2-4V6.5a1.5 1.5 0 0 1 3 0V10 4.5a1.5 1.5 0 0 1 3 0V10 4a1.5 1.5 0 0 1 3 0v6-4.5a1.5 1.5 0 0 1 3 0V14l-2 3v3.5z', T: 'M7 20.5v-5l-2-4V6.5a1.5 1.5 0 0 1 3 0V10 4.5a1.5 1.5 0 0 1 3 0V10 4a1.5 1.5 0 0 1 3 0v6-4.5a1.5 1.5 0 0 1 3 0V14l-2 3v3.5zM7 17.5h10' },
    poing:    { F: 'M5.5 10a2 2 0 0 1 2-2h9a2.5 2.5 0 0 1 2.5 2.5v4a6 6 0 0 1-6 6h-2.5a5 5 0 0 1-5-5z', T: 'M5.5 10a2 2 0 0 1 2-2h9a2.5 2.5 0 0 1 2.5 2.5v4a6 6 0 0 1-6 6h-2.5a5 5 0 0 1-5-5zM9 8v4M12 8v4M15.5 8v4M5.5 13.5h5.5' },
    jambiere: { F: 'M8 3h8v6l-1 5v7H9v-7L8 9z', T: 'M8 3h8v6l-1 5v7H9v-7L8 9zM8 9h8M10 14h4M9 18h6' },
    botte:    { F: 'M7 3h6v9l6 3.5c1 .6 1.5 1.5 1.5 2.5v2H4.5v-3L7 15z', T: 'M7 3h6v9l6 3.5c1 .6 1.5 1.5 1.5 2.5v2H4.5v-3L7 15zM7 7.5h6M4.5 17.5h16' },
    chaussure:{ F: 'M3 17c0-2 1-3 3-3.5L9 9l3 2 3.5 3.5 4 1.5c1 .4 1.5 1.2 1.5 2.2V19H3z', T: 'M3 17c0-2 1-3 3-3.5L9 9l3 2 3.5 3.5 4 1.5c1 .4 1.5 1.2 1.5 2.2V19H3zM3 17h18.5M10.5 11.5l1.5-1M12.5 13.5l1.5-1' },
    epee:     { F: 'M20.5 3.5l-.7 3.4L9.5 17.2l-2.7-2.7L17.1 4.2z', T: 'M20.5 3.5l-.7 3.4L9.5 17.2l-2.7-2.7L17.1 4.2zM5 13.5l5.5 5.5M7 18l-3 3' },
    dague:    { F: 'M18.5 5.5l-.5 2.5-6 6-2-2 6-6z', T: 'M18.5 5.5l-.5 2.5-6 6-2-2 6-6zM8 10.5l5.5 5.5M9.5 14.5L5 19' },
    hache:    { F: 'M13.5 3.5c3.5 0 7 3.5 7 7l-4 1.5-4.5-4.5z', T: 'M5 21L16.5 9.5M13.5 3.5c3.5 0 7 3.5 7 7l-4 1.5-4.5-4.5z' },
    faux:     { F: 'M15.5 3C11.5 3 7 4.5 4.5 8.5c3-1.2 6.8-1.2 9.6.4z', T: 'M8 21l8-18M15.5 3C11.5 3 7 4.5 4.5 8.5c3-1.2 6.8-1.2 9.6.4z' },
    lance:    { F: 'M15.5 5.5L21 3l-2.5 5.5-2.5.5z', T: 'M4 20L16 8M15.5 5.5L21 3l-2.5 5.5-2.5.5zM3.5 17.5l3 3' },
    arc:      { F: '', T: 'M18.5 3C10 4.5 5 9.5 3.5 18.5M18.5 3L3.5 18.5M8 13.5L19 5M16.5 4.5l2.5.5.5 2.5' },
    baton:    { F: 'M17.5 3a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z', T: 'M5 21L15.7 7.3M17.5 3a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z' },
    masse:    { F: 'M16 3.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9z', T: 'M4.5 20.5l7.5-7.5M16 3.5a4.5 4.5 0 1 1-.01 0zM16 1.5v2M22 8h-2M20.3 3.7l-1.5 1.5' },
    cristal:  { F: 'M12 2.5l5 6-5 13-5-13z', T: 'M12 2.5l5 6-5 13-5-13zM7 8.5h10M12 2.5l-2 6 2 13 2-13z' },
    bouclier: { F: 'M12 3l7 3v5c0 5-3 8.5-7 10-4-1.5-7-5-7-10V6z', T: 'M12 3l7 3v5c0 5-3 8.5-7 10-4-1.5-7-5-7-10V6zM12 7v10M8.5 11h7' },
    anneau:   { F: 'M9.5 6.5l2.5-3 2.5 3-2.5 2z', T: 'M12 8.5a6 6 0 1 0 0 12 6 6 0 0 0 0-12zM9.5 6.5l2.5-3 2.5 3-2.5 2z' },
    amulette: { F: 'M12 11l3.5 4-3.5 5.5-3.5-5.5z', T: 'M6 3c0 5 2.5 8 6 8s6-3 6-8M12 11l3.5 4-3.5 5.5-3.5-5.5z' },
    orbe:     { F: 'M12 4a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13z', T: 'M12 4a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM7.5 21h9M9 17.5l-1.5 3.5M15 17.5l1.5 3.5M9 8.5a3.5 3.5 0 0 1 3-1.8' },
    parchemin:{ F: 'M6 5.5h11v13a2 2 0 0 1-2 2H5.5a2 2 0 0 0 2-2z', T: 'M6 5.5h11v13a2 2 0 0 1-2 2H5.5a2 2 0 0 0 2-2V5.5a2 2 0 1 0-4 0V7h2.5M9.5 10h5M9.5 13.5h5' },
    medaille: { F: 'M12 9a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11z', T: 'M8 3l2.5 6.2M16 3l-2.5 6.2M12 9a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11zM12 11.8l1 2 2.2.3-1.6 1.5.4 2.2-2-1-2 1 .4-2.2-1.6-1.5 2.2-.3z' },
    fiole:    { F: 'M7.5 14.5h9l2 3.5a2 2 0 0 1-1.8 3H7.3a2 2 0 0 1-1.8-3z', T: 'M9.5 3h5M10.5 3v5L5.5 18a2 2 0 0 0 1.8 3h9.4a2 2 0 0 0 1.8-3l-5-10V3M7.5 14.5h9' },
    boussole: { F: 'M15.5 8.5l-2 5-5 2 2-5z', T: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM15.5 8.5l-2 5-5 2 2-5z' },
    chaine:   { F: '', T: 'M9.5 14.5l5-5M8 11l-2 2a3.5 3.5 0 0 0 5 5l2-2M16 13l2-2a3.5 3.5 0 0 0-5-5l-2 2' }
  };

  function norm(s) {
    return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  }

  // Type d'objet : d'abord le NOM (le plus fiable), puis l'emplacement.
  function typeDe(it) {
    var n = norm(it.name) + ' ' + norm(it.id);
    var s = it.slot;
    function a(re) { return re.test(n); }
    if (s === 'consumable') return 'parchemin';
    if (s === 'weapon') {
      if (a(/dague|coutelas|esquille|poignard/)) return 'dague';
      if (a(/hache|axe/)) return 'hache';
      if (a(/faux|scythe/)) return 'faux';
      if (a(/lance|spear/)) return 'lance';
      if (a(/\barc\b|bow/)) return 'arc';
      if (a(/baton|balai|trique|gourdin|oracle|staff/)) return 'baton';
      if (a(/masse|marteau|hammer|mace/)) return 'masse';
      if (a(/poing|fist/)) return 'poing';
      if (a(/cristal|eclat|noyau|coeur|essence|genese/)) return 'cristal';
      if (a(/breloque|insigne|sceau/)) return 'medaille';
      if (a(/plaque|garde de l.effaceur/)) return 'bouclier';
      return 'epee';
    }
    if (s === 'head') {
      if (a(/couronne|diademe|crown|tiare/)) return 'couronne';
      if (a(/capuche|cagoule|hood|voile/)) return 'capuche';
      if (a(/bandeau|headband|casquette|bandana/)) return 'bandeau';
      if (a(/masque|mask|oeil|regard|visiere|lunette/)) return 'masque';
      return 'casque';
    }
    if (s === 'chest') {
      if (a(/manteau|cape|mantle|mantel|robe|kimono|veste|cloak/)) return 'manteau';
      return 'cuirasse';
    }
    if (s === 'hands') {
      if (a(/poing|bandage|bande|mitaine|knuckle|phalange/)) return 'poing';
      return 'gantelet';
    }
    if (s === 'legs') return 'jambiere';
    if (s === 'feet') {
      if (a(/chaussure|basket|sandale|espadrille|sneaker|chausson|soulier/)) return 'chaussure';
      return 'botte';
    }
    // accessoires
    if (a(/anneau|bague|ring|chevaliere/)) return 'anneau';
    if (a(/orbe|sphere|cristal|prisme|globe/)) return 'orbe';
    if (a(/parchemin|tome|grimoire|carte|manuscrit|codex/)) return 'parchemin';
    if (a(/medaille|insigne|embleme|decoration|badge/)) return 'medaille';
    if (a(/fiole|elixir|potion|flacon/)) return 'fiole';
    if (a(/boussole|compas/)) return 'boussole';
    if (a(/chaine|maillon/)) return 'chaine';
    return 'amulette';
  }

  function svg(it, taille) {
    var t = P[typeDe(it)] || P.amulette;
    var c = COULEUR[it.rarity] || COULEUR.common;
    var h = HALO[it.rarity] || 0;
    var dim = taille ? (taille + 'px') : '1em';
    var halo = h ? 'filter:drop-shadow(0 0 ' + h + 'px ' + c + ');' : '';
    return '<svg viewBox="0 0 24 24" width="' + dim + '" height="' + dim + '" fill="none" stroke="' + c + '" ' +
      'stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ' +
      'style="display:inline-block;vertical-align:middle;' + halo + '">' +
      (t.F ? '<path d="' + t.F + '" fill="' + c + '" fill-opacity="0.22" stroke="none"/>' : '') +
      '<path d="' + t.T + '"/>' +
      (it.rarity === 'mythic' ? '<path d="M12 .8v1.6M1.8 12h1.6M22.2 12h-1.6" stroke-width="1.2" opacity="0.8"/>' : '') +
      '</svg>';
  }

  try {
    if (typeof EQUIPMENT_DATABASE !== 'undefined' && Array.isArray(EQUIPMENT_DATABASE)) {
      EQUIPMENT_DATABASE.forEach(function (it) {
        if (!it || it._svgIcon) return;
        it.iconEmoji = it.icon;
        it.icon = svg(it);
        it._svgIcon = true;
      });
    }
  } catch (e) {}

  window.AwakItemIcon = { svg: svg, type: typeDe, types: Object.keys(P) };
})();
