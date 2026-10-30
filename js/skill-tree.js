// v1526 : ARBRE DE COMPÉTENCES À CHOIX — v1528 : RANGS + REFONTE
// Points de compétence gagnés par niveau (1 au niv. 3, puis +1 tous les 5 niv.).
// 3 branches universelles + 1 branche de classe ; Discipline et Classe se
// séparent en deux voies. On ne peut pas tout prendre.
// RANGS : les compétences en % ou en stats montent jusqu'au rang 3
// (rang 2 = effet ×1,5 pour 1 point, rang 3 = ×2 pour 2 points). Les effets
// « oui / non » (Second Souffle, streak, points d'attribut…) restent à 1 rang.
// Stockage : 'fitproRPGSkills' (liste, inchangé) + 'awakSkillRangs' {id: rang}.
// Les effets sont multipliés UNE fois, dans rpgGetActiveEffects (via facteur()).
(function () {
  'use strict';

  // [id, parent, coût, voie]  — voie 'A' / 'B' = colonnes après la racine
  var BRANCHES = [
    { id: 'croissance', nom: 'Croissance', sous: 'Gagner plus d\'XP', couleur: '#fbbf24', icone: 'etoile',
      noeuds: [['iron_will', null, 1], ['compound_pro', 'iron_will', 1], ['xp_surge', 'compound_pro', 1], ['transcendence', 'xp_surge', 3]] },
    { id: 'combat', nom: 'Combat', sous: 'Survivre et frapper dans les Failles', couleur: '#f87171', icone: 'epee',
      noeuds: [['prospector', null, 1], ['second_wind', 'prospector', 3], ['vital_drain', 'second_wind', 3], ['apex_predator', 'vital_drain', 3]] },
    { id: 'discipline', nom: 'Discipline', sous: 'Récompenser ta façon de t\'entraîner', couleur: '#a78bfa', icone: 'flamme',
      voies: ['Constance', 'Effort'],
      noeuds: [['streak_lord', null, 1],
               ['no_decay', 'streak_lord', 1, 'A'], ['limit_break', 'no_decay', 3, 'A'],
               ['full_sets', 'streak_lord', 1, 'B'], ['record_breaker', 'full_sets', 1, 'B'], ['long_breath', 'record_breaker', 2, 'B']] }
  ];
  // Branche de classe : 0 = racine ; voie A = 1 → 3 → 5 ; voie B = 2 → 4 → 6.
  var CLASSE_PARENT = [null, 0, 0, 1, 2, 3, 4];
  var CLASSE_COUT = [1, 1, 1, 1, 1, 2, 3];
  // Effets qui ne montent pas en rang (oui/non, ou déjà plafonnés)
  var SANS_RANG = ['secondWind', 'immuneMuscleDecay', 'decayReduction', 'streakStart', 'extraStatPoint', 'penaltyReduction', 'graceExtend'];
  var RANG_MAX = 3;
  var VERSION_REFONTE = '1528';

  function arbre() { try { return typeof rpgGetSkillTree === 'function' ? rpgGetSkillTree() : []; } catch (e) { return []; } }
  function trouve(id) { var t = arbre(); for (var i = 0; i < t.length; i++) if (t[i].id === id) return t[i]; return null; }
  function debloques() { try { return JSON.parse(localStorage.getItem('fitproRPGSkills') || '[]'); } catch (e) { return []; } }
  function rangs() { try { return JSON.parse(localStorage.getItem('awakSkillRangs') || '{}') || {}; } catch (e) { return {}; } }
  function niveau() {
    try {
      var d = rpgLoad();
      var xp = Object.values(d.muscles || {}).reduce(function (s, m) { return s + (m.xp || 0); }, 0);
      return rpgLevelFromXP(xp + parseInt(localStorage.getItem('fitproRPGLifetimeXP') || '0', 10));
    } catch (e) { return 1; }
  }

  function rangMax(sk) {
    if (!sk || !sk.effect) return 1;
    for (var k in sk.effect) if (SANS_RANG.indexOf(k) >= 0) return 1;
    return RANG_MAX;
  }
  function rang(id, unl, rg) {
    unl = unl || debloques();
    if (unl.indexOf(id) < 0) return 0;
    var r = (rg || rangs())[id] || 1;
    return Math.max(1, Math.min(rangMax(trouve(id)), r));
  }
  // Multiplicateur d'effet selon le rang : 1 / 1,5 / 2
  function facteur(id) { var r = rang(id); return r <= 1 ? 1 : 1 + 0.5 * (r - 1); }
  function coutRang(r) { return r === 2 ? 1 : 2; }   // passer au rang r
  // Description au rang r : les chiffres de l'effet sont multipliés (seulement pour les compétences à rangs)
  function descRang(sk, r) {
    if (!sk || r <= 1 || rangMax(sk) <= 1) return sk ? sk.desc : '';
    var k = 1 + 0.5 * (r - 1);
    return String(sk.desc).replace(/(\d+(?:[.,]\d+)?)(\s*%)?/g, function (t, n, pc) {
      var v = parseFloat(n.replace(',', '.')) * k;
      // les % gardent une décimale ; les stats sont arrondies comme dans rpgGetActiveEffects
      return (pc ? String(Math.round(v * 10) / 10).replace('.', ',') : String(Math.round(v))) + (pc || '');
    });
  }

  // Carte id → { parent, cout, branche, voie }
  function carte() {
    var m = {}, t = arbre();
    BRANCHES.forEach(function (b) { b.noeuds.forEach(function (n) { m[n[0]] = { parent: n[1], cout: n[2], branche: b.id, voie: n[3] || null }; }); });
    var cl = t.filter(function (s) { return s.type === 'class'; });
    cl.forEach(function (s, i) {
      var p = CLASSE_PARENT[i];
      m[s.id] = { parent: (p === null || p === undefined || !cl[p]) ? null : cl[p].id, cout: CLASSE_COUT[i] || 1, branche: 'classe', voie: i === 0 ? null : (i % 2 ? 'A' : 'B') };
    });
    t.forEach(function (s) { if (!m[s.id]) m[s.id] = { parent: null, cout: 1, branche: s.type === 'class' ? 'classe' : 'croissance', voie: null }; });
    return m;
  }

  function gagnes(lv) { return lv >= 3 ? 1 + Math.floor(lv / 5) : 0; }
  function depenses(unl, rg) {
    unl = unl || debloques(); rg = rg || rangs();
    var m = carte(), s = 0;
    arbre().forEach(function (sk) {
      if (unl.indexOf(sk.id) < 0 || !m[sk.id]) return;
      s += m[sk.id].cout;
      var r = rang(sk.id, unl, rg);
      for (var i = 2; i <= r; i++) s += coutRang(i);
    });
    return s;
  }
  function points(lv, unl) { lv = lv || niveau(); return Math.max(0, gagnes(lv) - depenses(unl)); }

  // 'actif' | 'ameliorable' | 'dispo' | 'niveau' | 'prerequis' | 'points'
  function etat(id, lv, unl) {
    lv = lv || niveau(); unl = unl || debloques();
    var sk = trouve(id), n = carte()[id];
    if (!sk || !n) return 'prerequis';
    if (unl.indexOf(id) >= 0) {
      var r = rang(id, unl);
      return (r < rangMax(sk) && points(lv, unl) >= coutRang(r + 1)) ? 'ameliorable' : 'actif';
    }
    if (n.parent && unl.indexOf(n.parent) < 0) return 'prerequis';
    if (lv < ((sk.req && sk.req.level) || 1)) return 'niveau';
    if (points(lv, unl) < n.cout) return 'points';
    return 'dispo';
  }
  function dispo(lv, unl) {
    migrer();
    return arbre().filter(function (s) { var e = etat(s.id, lv, unl); return e === 'dispo' || e === 'ameliorable'; }).length;
  }

  // ── v1528 : refonte des valeurs → points rendus une fois, sans délai ──
  function migrer() {
    try {
      if (localStorage.getItem('awakSkillRefonte') === VERSION_REFONTE) return;
      var unl = debloques();
      localStorage.setItem('awakSkillRefonte', VERSION_REFONTE);
      if (!unl.length) return;
      localStorage.setItem('fitproRPGSkills', '[]');
      localStorage.removeItem('awakSkillRangs');
      localStorage.removeItem('awakSkillRespec');
      setTimeout(function () {
        try { showToast('Refonte de l\'arbre de compétences : tes points te sont rendus. Redistribue-les dans Compétences.', 'info', 6000); } catch (e) {}
      }, 1200);
    } catch (e) {}
  }

  // ── Réinitialisation (1× / 7 jours) ──
  var SEPT_J = 7 * 86400000;
  function prochaineReinit() {
    var t = parseInt(localStorage.getItem('awakSkillRespec') || '0', 10) || 0;
    return t ? t + SEPT_J : 0;
  }
  function reinitialiser() {
    var unl = debloques();
    var ids = {}; arbre().forEach(function (s) { ids[s.id] = 1; });
    var actifs = unl.filter(function (id) { return ids[id]; });
    if (!actifs.length) { try { showToast('Aucune compétence à réinitialiser.', 'info', 2500); } catch (e) {} return; }
    var p = prochaineReinit();
    if (p > Date.now()) {
      var j = Math.ceil((p - Date.now()) / 86400000);
      try { showToast('Prochaine réinitialisation dans ' + j + ' jour' + (j > 1 ? 's' : '') + '.', 'info', 3000); } catch (e) {}
      return;
    }
    var faire = function () {
      // Les compétences d'une autre classe (inertes) sont gardées : elles reviennent avec cette classe.
      localStorage.setItem('fitproRPGSkills', JSON.stringify(unl.filter(function (id) { return !ids[id]; })));
      var rg = rangs(); Object.keys(rg).forEach(function (k) { if (ids[k]) delete rg[k]; });
      localStorage.setItem('awakSkillRangs', JSON.stringify(rg));
      localStorage.setItem('awakSkillRespec', String(Date.now()));
      try { showToast('Points rendus : ' + gagnes(niveau()) + ' à redistribuer.', 'success', 3000); } catch (e) {}
      rafraichir();
    };
    var msg = 'Tous tes points de compétence te seront rendus. Tu pourras les redistribuer tout de suite, mais la prochaine réinitialisation sera possible dans 7 jours.';
    if (typeof showConfirm === 'function') showConfirm(msg, faire, null, { title: 'Réinitialiser l\'arbre ?', confirmLabel: 'Réinitialiser', cancelLabel: 'Annuler' });
    else faire();
  }

  function rafraichir() {
    try { if (typeof renderGameTab === 'function') renderGameTab(); } catch (e) {}
    try { if (typeof rpgRafraichirPanneauDetails === 'function') rpgRafraichirPanneauDetails(); } catch (e) {}
  }

  function ameliorer(id) {
    var lv = niveau(), unl = debloques();
    var sk = trouve(id); if (!sk || unl.indexOf(id) < 0) return;
    var r = rang(id, unl), max = rangMax(sk);
    var t = function (m) { try { showToast(m, 'info', 2800); } catch (x) {} };
    if (max <= 1) return t('« ' + sk.name + ' » n\'a qu\'un rang.');
    if (r >= max) return t('« ' + sk.name + ' » est au rang maximum.');
    var c = coutRang(r + 1), pts = points(lv, unl);
    if (pts < c) return t('Rang ' + (r + 1) + ' : il te faut ' + c + ' point' + (c > 1 ? 's' : '') + ' (tu en as ' + pts + ').');
    var go = function () {
      var rg = rangs(); rg[id] = r + 1; localStorage.setItem('awakSkillRangs', JSON.stringify(rg));
      try { showToast(sk.name + ' passe au rang ' + (r + 1) + ' !', 'success', 3000); } catch (e) {}
      rafraichir();
    };
    var msg = 'Rang ' + (r + 1) + ' sur ' + max + ' : ' + descRang(sk, r + 1) + '. Coût : ' + c + ' point' + (c > 1 ? 's' : '') + ' (il t\'en reste ' + pts + ').';
    if (typeof showConfirm === 'function') showConfirm(msg, go, null, { title: sk.name, confirmLabel: 'Améliorer', cancelLabel: 'Annuler' });
    else go();
  }

  // Touche sur un nœud : confirmation, puis rpgUnlockSkill (ou amélioration)
  function choisir(id) {
    var lv = niveau(), e = etat(id, lv);
    var sk = trouve(id), n = carte()[id];
    if (!sk || !n) return;
    if (e === 'actif' || e === 'ameliorable') return ameliorer(id);
    var t = function (m) { try { showToast(m, 'info', 2800); } catch (x) {} };
    if (e === 'prerequis') {
      var par = trouve(n.parent);
      return t('Débloque d\'abord « ' + (par ? par.name : 'la compétence précédente') + ' ».');
    }
    if (e === 'niveau') return t('Niveau ' + sk.req.level + ' requis.');
    if (e === 'points') return t('Il te faut ' + n.cout + ' point' + (n.cout > 1 ? 's' : '') + ' (tu en as ' + points(lv) + ').');
    var go = function () { if (typeof rpgUnlockSkill === 'function') rpgUnlockSkill(id); };
    var msg = sk.desc + '. Coût : ' + n.cout + ' point' + (n.cout > 1 ? 's' : '') + ' (il t\'en reste ' + points(lv) + ').'
      + (rangMax(sk) > 1 ? ' Améliorable jusqu\'au rang ' + rangMax(sk) + '.' : '');
    if (typeof showConfirm === 'function') showConfirm(msg, go, null, { title: sk.name, confirmLabel: 'Débloquer', cancelLabel: 'Annuler' });
    else go();
  }

  // ── Rendu v1529 : vue « constellation » par branche ──
  // Onglets de branches (balayage gauche/droite), nœuds ronds reliés par des
  // traits lumineux, fiche détaillée collée en bas. Re-rendu sur place de tous
  // les [data-awk-arbre] (l'onglet ET la copie du panneau).
  function ic(n, t, c) { try { return (window.AwakIcon && AwakIcon.get(n, t, c)) || ''; } catch (e) { return ''; } }
  var CADENAS = function (c, s) { return '<svg viewBox="0 0 24 24" width="' + (s || 15) + '" height="' + (s || 15) + '" fill="none" stroke="' + c + '" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>'; };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function pt(n) { return n + ' pt' + (n > 1 ? 's' : ''); }

  // Emblèmes illustrés (images/Objets/skill_<id>.webp) : n'ajouter ici que les images livrées
  var SKILL_IMG = {};
  // Icône SVG selon le premier effet de la compétence
  var ICONE_EFFET = { xpAll: 'etoile', xpCompound: 'halter', xpIsolation: 'cible', streakStart: 'flamme', mineralBonus: 'boussole',
    graceExtend: 'bouclier', secondWind: 'sante', riftLifesteal: 'coeur', critChance: 'eclair', critDmg: 'cible', doubleDropChance: 'trophee',
    epicDropBonus: 'trophee', legendaryDropBonus: 'couronne', epicToLegendary: 'couronne', statBonus: 'muscle', penaltyDodge: 'course',
    penaltyReduction: 'bouclier', decayReduction: 'bouclier', equipPenaltyReduction: 'bouclier', rampageChance: 'flamme', doubleXPChance: 'de',
    extraStatPoint: 'pyramide', fullSets: 'valide', recordXP: 'trophee', timerDmg: 'chrono', riftDmg: 'epee', bossDmg: 'epee' };
  function iconeDe(sk) {
    var k = sk && sk.effect ? Object.keys(sk.effect)[0] : null;
    if (sk && sk.effect && sk.effect.xpAll && Object.keys(sk.effect).length > 1 && sk.effect.extraStatPoint) k = 'extraStatPoint';
    return ICONE_EFFET[k] || 'etoile';
  }
  function embleme(sk, taille, c, eteint) {
    if (SKILL_IMG[sk.id]) return '<img src="images/Objets/skill_' + sk.id + '.webp" alt="" draggable="false" style="width:' + taille + 'px;height:' + taille + 'px;object-fit:contain;' + (eteint ? 'filter:grayscale(1) brightness(0.55);' : '') + '">';
    return ic(iconeDe(sk), Math.round(taille * 0.5), eteint ? '#64748b' : c);
  }

  var VUE = { onglet: null, sel: null, classe: null, x0: null };

  function onglets() {
    var cl = arbre().filter(function (s) { return s.type === 'class'; });
    var L = BRANCHES.map(function (b) {
      var tronc = b.noeuds.filter(function (n) { return !n[3]; }).map(function (n) { return n[0]; });
      return { id: b.id, nom: b.nom, sous: b.sous, c: b.couleur, icone: b.icone, voies: b.voies || null,
        tronc: tronc,
        A: b.noeuds.filter(function (n) { return n[3] === 'A'; }).map(function (n) { return n[0]; }),
        B: b.noeuds.filter(function (n) { return n[3] === 'B'; }).map(function (n) { return n[0]; }) };
    });
    var ci = VUE.classe;
    if (cl.length) L.push({ id: 'classe', nom: (ci && ci.name) || 'Classe', sous: 'Voie du ' + ((ci && ci.name) || 'Chasseur') + ' — deux chemins après la racine',
      c: (ci && ci.color) || '#a78bfa', icone: 'couronne', voies: null, tronc: [cl[0].id],
      A: [1, 3, 5].map(function (i) { return cl[i] && cl[i].id; }).filter(Boolean),
      B: [2, 4, 6].map(function (i) { return cl[i] && cl[i].id; }).filter(Boolean) });
    else L.push({ id: 'classe', nom: 'Classe', sous: 'Choisis ta classe au rang D pour l\'ouvrir.', c: '#a78bfa', icone: 'couronne', vide: true, tronc: [], A: [], B: [] });
    return L;
  }
  function idsDe(o) { return o.tronc.concat(o.A, o.B); }
  function aFaire(o, lv, unl) { return idsDe(o).some(function (id) { var e = etat(id, lv, unl); return e === 'dispo' || e === 'ameliorable'; }); }

  // Positions : x en %, y en px. Chaîne simple = léger zigzag ; deux voies = colonnes 27 % / 73 %.
  var PAS = 116, HAUT = 62;
  function positions(o) {
    var P = {}, fourche = o.A.length || o.B.length;
    o.tronc.forEach(function (id, i) { P[id] = { x: fourche ? 50 : (i % 2 ? 66 : 34), y: HAUT + i * PAS }; });
    var y0 = HAUT + o.tronc.length * PAS;
    o.A.forEach(function (id, i) { P[id] = { x: 27, y: y0 + i * PAS }; });
    o.B.forEach(function (id, i) { P[id] = { x: 73, y: y0 + i * PAS }; });
    if (!fourche && o.tronc.length === 1) P[o.tronc[0]].x = 50;
    return P;
  }

  function scene(o, lv, unl) {
    var P = positions(o), m = carte(), c = o.c;
    var rangees = o.tronc.length + Math.max(o.A.length, o.B.length);
    var H = HAUT * 2 + Math.max(0, rangees - 1) * PAS + 18;
    var traits = '';
    idsDe(o).forEach(function (id) {
      var n = m[id], p = P[id], q = n && n.parent ? P[n.parent] : null;
      if (!q) return;
      var on = unl.indexOf(n.parent) >= 0, fin = unl.indexOf(id) >= 0, e = etat(id, lv, unl);
      var ym = (q.y + p.y) / 2;
      var d = 'M' + q.x + ' ' + q.y + ' C' + q.x + ' ' + ym + ' ' + p.x + ' ' + ym + ' ' + p.x + ' ' + p.y;
      if (on && fin) traits += '<path d="' + d + '" stroke="' + c + '" stroke-width="9" opacity="0.18" fill="none" vector-effect="non-scaling-stroke"/>'
        + '<path d="' + d + '" stroke="' + c + '" stroke-width="3" fill="none" vector-effect="non-scaling-stroke"/>';
      else if (on && (e === 'dispo' || e === 'points' || e === 'niveau')) traits += '<path d="' + d + '" stroke="' + c + '" stroke-width="2.5" stroke-dasharray="6 6" opacity="0.75" fill="none" vector-effect="non-scaling-stroke" style="animation:awkTrait 1.2s linear infinite;"/>';
      else traits += '<path d="' + d + '" stroke="rgba(255,255,255,0.13)" stroke-width="2" stroke-dasharray="2 6" fill="none" vector-effect="non-scaling-stroke"/>';
    });
    var h = '<div ontouchstart="AwakArbre._t0(event)" ontouchend="AwakArbre._t1(event)" style="position:relative;height:' + H + 'px;margin:0 -2px;border-radius:18px;overflow:hidden;'
      + 'background:radial-gradient(ellipse at 50% 0%,' + c + '26,transparent 60%),radial-gradient(circle at 15% 70%,' + c + '12,transparent 40%),radial-gradient(circle at 85% 40%,' + c + '10,transparent 35%),#090b10;border:1px solid ' + c + '33;">'
      + '<div style="position:absolute;inset:0;opacity:0.5;background-image:radial-gradient(1px 1px at 12% 18%,#fff8,transparent),radial-gradient(1px 1px at 78% 12%,#fff6,transparent),radial-gradient(1.5px 1.5px at 64% 58%,#fff5,transparent),radial-gradient(1px 1px at 30% 82%,#fff6,transparent),radial-gradient(1px 1px at 90% 76%,#fff5,transparent),radial-gradient(1px 1px at 45% 35%,#fff4,transparent);"></div>';
    if (o.voies) h += '<div style="position:absolute;left:0;right:0;top:' + (HAUT + o.tronc.length * PAS - 52) + 'px;display:flex;pointer-events:none;">'
      + o.voies.map(function (v) { return '<div style="flex:1;text-align:center;font-size:10px;font-weight:900;letter-spacing:1.6px;text-transform:uppercase;color:' + c + 'aa;">' + esc(v) + '</div>'; }).join('') + '</div>';
    h += '<svg viewBox="0 0 100 ' + H + '" preserveAspectRatio="none" style="position:absolute;inset:0;width:100%;height:100%;overflow:visible;">' + traits + '</svg>';
    idsDe(o).forEach(function (id) { var sk = trouve(id); if (sk) h += bulle(sk, P[id], c, lv, unl); });
    return h + '</div>';
  }

  function pips(r, max, c) {
    if (max <= 1) return '';
    var h = '<div style="display:flex;justify-content:center;gap:3px;margin-top:3px;">';
    for (var i = 1; i <= max; i++) h += '<span style="width:6px;height:6px;border-radius:50%;' + (i <= r ? 'background:' + c + ';box-shadow:0 0 5px ' + c + ';' : 'border:1.3px solid ' + c + '66;') + '"></span>';
    return h + '</div>';
  }

  function bulle(sk, p, c, lv, unl) {
    var e = etat(sk.id, lv, unl), r = rang(sk.id, unl), max = rangMax(sk);
    var actif = e === 'actif' || e === 'ameliorable', ok = e === 'dispo' || e === 'ameliorable', sel = VUE.sel === sk.id;
    var D = 58;
    var fond = actif ? 'radial-gradient(circle at 35% 30%,' + c + '55,' + c + '18 60%,#0b0d12),#0b0d12' : ok ? 'radial-gradient(circle at 35% 30%,' + c + '22,#0b0d12 70%),#0b0d12' : '#0d1016';
    var bord = actif ? c : ok ? c : 'rgba(255,255,255,0.14)';
    var ombre = actif ? '0 0 18px ' + c + '88,inset 0 0 12px ' + c + '44' : ok ? '0 0 14px ' + c + '55' : 'none';
    var badge = '';
    if (!actif && !ok) badge = '<span style="position:absolute;right:-3px;bottom:-3px;width:22px;height:22px;border-radius:50%;background:#0b0d12;border:1.5px solid rgba(255,255,255,0.16);display:flex;align-items:center;justify-content:center;">' + CADENAS(e === 'points' ? c : '#8d9cb1', 12) + '</span>';
    else if (ok) badge = '<span style="position:absolute;right:-4px;top:-4px;min-width:22px;height:22px;padding:0 5px;border-radius:99px;background:' + c + ';color:#0b0d12;font-size:11px;font-weight:900;display:flex;align-items:center;justify-content:center;box-shadow:0 0 10px ' + c + ';">+</span>';
    var niv = e === 'niveau' ? '<div style="font-size:10px;color:#8d9cb1;margin-top:1px;">Niv. ' + sk.req.level + '</div>' : '';
    return '<div onclick="AwakArbre.voir(\'' + sk.id + '\')" role="button" aria-label="' + esc(sk.name) + '" style="position:absolute;left:' + p.x + '%;top:' + p.y + 'px;transform:translate(-50%,-29px);width:124px;text-align:center;cursor:pointer;z-index:2;">'
      + '<div style="position:relative;width:' + D + 'px;height:' + D + 'px;margin:0 auto;border-radius:50%;background:' + fond + ';border:2px solid ' + bord + ';box-shadow:' + ombre + ';display:flex;align-items:center;justify-content:center;'
      + (ok ? 'animation:awkPulse 1.8s ease-in-out infinite;--awk-c:' + c + '66;' : '') + (sel ? 'outline:2px solid #fff;outline-offset:3px;' : '') + '">'
      + embleme(sk, 40, c, !actif && !ok) + badge + '</div>'
      + '<div style="display:inline-block;max-width:122px;font-size:11.5px;font-weight:800;line-height:1.15;margin-top:5px;padding:2px 6px;border-radius:7px;background:rgba(9,11,16,0.88);color:' + (actif || ok ? '#f1f5f9' : '#8d9cb1') + ';">' + esc(sk.name) + '</div>'
      + (actif ? pips(r, max, c) : niv) + '</div>';
  }

  function fiche(o, lv, unl) {
    var sk = trouve(VUE.sel);
    if (!sk || idsDe(o).indexOf(sk.id) < 0) return '';
    var c = o.c, e = etat(sk.id, lv, unl), n = carte()[sk.id], r = rang(sk.id, unl), max = rangMax(sk);
    var actif = e === 'actif' || e === 'ameliorable';
    var ligne, bouton = '';
    if (e === 'dispo') {
      ligne = 'Coût : ' + pt(n.cout) + (max > 1 ? ' · améliorable jusqu\'au rang ' + max : '');
      bouton = 'Débloquer · ' + pt(n.cout);
    } else if (e === 'ameliorable') {
      ligne = 'Rang ' + (r + 1) + ' : ' + descRang(sk, r + 1);
      bouton = 'Monter au rang ' + (r + 1) + ' · ' + pt(coutRang(r + 1));
    } else if (e === 'actif') {
      ligne = max > 1 ? (r >= max ? 'Rang maximum atteint.' : 'Rang ' + (r + 1) + ' : ' + pt(coutRang(r + 1)) + ' requis (tu en as ' + points(lv, unl) + ').') : 'Active.';
    } else if (e === 'prerequis') { var par = trouve(n.parent); ligne = 'Débloque d\'abord « ' + (par ? par.name : 'la compétence précédente') + ' ».'; }
    else if (e === 'niveau') ligne = 'Niveau ' + sk.req.level + ' requis · ' + pt(n.cout) + '.';
    else ligne = 'Il te faut ' + pt(n.cout) + ' (tu en as ' + points(lv, unl) + ').';
    return '<div style="position:sticky;bottom:0;z-index:5;margin-top:12px;padding:12px 14px;border-radius:16px;background:linear-gradient(160deg,#151a24,#0d1016);border:1.5px solid ' + c + '66;box-shadow:0 -6px 24px rgba(0,0,0,0.55);">'
      + '<div style="display:flex;align-items:center;gap:12px;">'
      + '<div style="width:46px;height:46px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;background:' + c + '1f;border:1.5px solid ' + c + ';">' + embleme(sk, 32, c, false) + '</div>'
      + '<div style="flex:1;min-width:0;"><div style="font-size:15px;font-weight:900;color:#f1f5f9;">' + esc(sk.name)
      + (actif && max > 1 ? ' <span style="font-size:11px;color:' + c + ';font-weight:800;">Rang ' + r + '/' + max + '</span>' : '') + '</div>'
      + '<div style="font-size:12.5px;color:#cbd5e1;line-height:1.35;margin-top:2px;">' + esc(descRang(sk, Math.max(1, r))) + '</div></div></div>'
      + '<div style="font-size:12px;color:#a3b1c2;margin-top:8px;line-height:1.4;">' + esc(ligne) + '</div>'
      + (bouton ? '<button onclick="AwakArbre.agir(\'' + sk.id + '\')" style="width:100%;min-height:44px;margin-top:10px;border:none;border-radius:12px;font-family:inherit;font-size:14.5px;font-weight:900;cursor:pointer;color:#0b0d12;background:linear-gradient(135deg,' + c + ',' + c + 'cc);box-shadow:0 6px 18px ' + c + '44;">' + bouton + '</button>' : '')
      + '</div>';
  }

  function interieur() {
    migrer();
    var lv = niveau(), unl = debloques(), L = onglets();
    if (!VUE.onglet || !L.some(function (o) { return o.id === VUE.onglet; })) {
      var f = L.filter(function (o) { return !o.vide && aFaire(o, lv, unl); })[0];
      VUE.onglet = (f || L[0]).id;
    }
    var o = L.filter(function (x) { return x.id === VUE.onglet; })[0];
    if (!VUE.sel || idsDe(o).indexOf(VUE.sel) < 0) {
      var ids = idsDe(o);
      VUE.sel = ids.filter(function (id) { var e = etat(id, lv, unl); return e === 'dispo' || e === 'ameliorable'; })[0] || ids[0] || null;
    }
    var pts = points(lv, unl), g = gagnes(lv), prochain = lv < 3 ? 3 : (Math.floor(lv / 5) + 1) * 5;
    var p = prochaineReinit(), reinitOk = !p || p <= Date.now();
    var h = '<style>@keyframes awkPulse{0%,100%{box-shadow:0 0 0 0 var(--awk-c)}50%{box-shadow:0 0 0 9px transparent}}@keyframes awkTrait{to{stroke-dashoffset:-24}}</style>';
    h += '<div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">'
      + '<div style="width:54px;height:54px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;background:radial-gradient(circle,#fbbf2433,#0b0d12 70%);border:2px solid #fbbf24;box-shadow:0 0 16px #fbbf2455;font-size:24px;font-weight:900;color:#fbbf24;">' + pts + '</div>'
      + '<div style="flex:1;min-width:0;"><div style="font-size:14px;font-weight:900;color:#f1f5f9;">Point' + (pts > 1 ? 's' : '') + ' à dépenser</div>'
      + '<div style="font-size:11.5px;color:#a3b1c2;line-height:1.35;">' + g + ' gagné' + (g > 1 ? 's' : '') + ' · prochain au niv. ' + prochain + '</div></div>'
      + '<button onclick="AwakArbre.reinitialiser()" style="min-height:0;padding:6px 10px;border-radius:10px;font-family:inherit;font-size:11.5px;font-weight:700;cursor:pointer;background:transparent;border:1px solid rgba(255,255,255,0.14);color:' + (reinitOk ? '#cbd5e1' : '#8d9cb1') + ';white-space:nowrap;">'
      + (reinitOk ? 'Réinitialiser' : 'Réinit. ' + Math.ceil((p - Date.now()) / 86400000) + ' j') + '</button></div>';
    // Onglets
    h += '<div style="display:grid;grid-template-columns:repeat(' + L.length + ',1fr);gap:6px;margin-bottom:10px;">';
    L.forEach(function (x) {
      var on = x.id === VUE.onglet, ids = idsDe(x), nb = ids.filter(function (id) { return unl.indexOf(id) >= 0; }).length;
      var pastille = !x.vide && aFaire(x, lv, unl) ? '<span style="position:absolute;top:-3px;right:-3px;width:10px;height:10px;border-radius:50%;background:' + x.c + ';box-shadow:0 0 8px ' + x.c + ';"></span>' : '';
      h += '<button onclick="AwakArbre.onglet(\'' + x.id + '\')" style="position:relative;min-height:0;padding:8px 2px 7px;border-radius:12px;font-family:inherit;cursor:pointer;text-align:center;'
        + 'background:' + (on ? x.c + '26' : 'rgba(255,255,255,0.03)') + ';border:1.5px solid ' + (on ? x.c : 'rgba(255,255,255,0.08)') + ';color:' + (on ? '#f1f5f9' : '#a3b1c2') + ';">'
        + '<div style="display:flex;justify-content:center;">' + (x.vide ? CADENAS('#8d9cb1', 16) : ic(x.icone, 17, on ? x.c : '#8d9cb1')) + '</div>'
        + '<div style="font-size:10.5px;font-weight:800;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + esc(x.nom) + '</div>'
        + (x.vide ? '' : '<div style="font-size:10px;color:' + (on ? x.c : '#8d9cb1') + ';font-weight:800;">' + nb + '/' + ids.length + '</div>') + pastille + '</button>';
    });
    h += '</div>';
    h += '<div style="font-size:12px;color:#8d9cb1;margin:0 2px 10px;text-align:center;">' + esc(o.sous) + '</div>';
    if (o.vide) {
      h += '<div style="height:220px;border-radius:18px;border:1px dashed rgba(167,139,250,0.35);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;background:radial-gradient(ellipse at 50% 30%,#a78bfa18,transparent 60%),#090b10;">'
        + CADENAS('#a78bfa', 28) + '<div style="font-size:14px;font-weight:800;color:#e2e8f0;">Branche de classe</div><div style="font-size:12.5px;color:#a3b1c2;">Choisis ta classe au rang D pour l\'ouvrir.</div></div>';
      return h;
    }
    h += scene(o, lv, unl) + fiche(o, lv, unl);
    return h;
  }

  function rendre() {
    var els = document.querySelectorAll('[data-awk-arbre]');
    for (var i = 0; i < els.length; i++) els[i].innerHTML = interieur();
  }

  function html(o) {
    o = o || {};
    if (o.classe) VUE.classe = o.classe;
    return '<div data-awk-arbre>' + interieur() + '</div>';
  }

  // Action directe depuis la fiche (la fiche sert de confirmation)
  function agir(id) {
    var e = etat(id);
    if (e === 'dispo') { if (typeof rpgUnlockSkill === 'function') rpgUnlockSkill(id); }
    else if (e === 'ameliorable') {
      var r = rang(id), rg = rangs(); rg[id] = r + 1; localStorage.setItem('awakSkillRangs', JSON.stringify(rg));
      var sk = trouve(id); try { showToast((sk ? sk.name : 'Compétence') + ' passe au rang ' + (r + 1) + ' !', 'success', 2600); } catch (x) {}
      rafraichir();
    }
    setTimeout(rendre, 0);
  }

  try { migrer(); } catch (e) {}

  window.AwakArbre = {
    html: html, etat: etat, dispo: dispo, points: points, gagnes: gagnes, rang: rang, rangMax: function (id) { return rangMax(trouve(id)); },
    facteur: facteur, choisir: choisir, ameliorer: ameliorer, reinitialiser: reinitialiser, migrer: migrer,
    peut: function (id) { return etat(id) === 'dispo'; },
    // v1529 : navigation de la vue
    voir: function (id) { VUE.sel = id; rendre(); },
    agir: agir,
    onglet: function (id) { VUE.onglet = id; VUE.sel = null; rendre(); },
    _t0: function (ev) { try { VUE.x0 = ev.touches[0].clientX; VUE.y0 = ev.touches[0].clientY; } catch (e) { VUE.x0 = null; } },
    _t1: function (ev) {
      try {
        if (VUE.x0 == null) return;
        var dx = ev.changedTouches[0].clientX - VUE.x0, dy = ev.changedTouches[0].clientY - VUE.y0; VUE.x0 = null;
        if (Math.abs(dx) < 60 || Math.abs(dy) > Math.abs(dx)) return;
        var L = onglets().map(function (o) { return o.id; }), i = L.indexOf(VUE.onglet);
        i = Math.max(0, Math.min(L.length - 1, i + (dx < 0 ? 1 : -1)));
        if (L[i] !== VUE.onglet) { VUE.onglet = L[i]; VUE.sel = null; rendre(); }
      } catch (e) {}
    }
  };
})();
