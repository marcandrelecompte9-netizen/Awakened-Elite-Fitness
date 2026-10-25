// v1413 — Fin de séance : un seul moment fort.
// Avant (audit v1412) : coffre(s), scène d'histoire, niveau personnage, points
// d'attribut, Faille spéciale s'ouvraient à la suite par-dessus l'écran de fin,
// avec 5-6 notifications en plus. Maintenant, sur l'écran de fin :
//   · « Butin de la séance » sous la carte d'XP : le coffre (à ouvrir sur place),
//     l'équipement obtenu, le niveau personnage (+ « Distribuer »), les niveaux de
//     muscle et les petites récompenses (exploits, quêtes, mission, Éveil…) en lignes ;
//   · le reste (histoire, rang, Faille spéciale…) attend le retour à l'Accueil,
//     une scène à la fois (AwakCine.anyOpen → AwakFin.bloque()).
//   · les blocs secondaires (calories, hydratation, muscles…) sont repliés sous « Détails »,
//     et un « Prochain objectif » termine l'écran.
(function () {
  'use strict';

  var CAPTURE_MS = 15000;           // fenêtre où les notifications de récompense sont regroupées
  var REC = /XP|Exploit|Quête|Mission|validée|débloqu|Faille|Insigne|[Nn]iveau|Record|Palier|branche|Étape|Coffre|Bonus|PR\b/;
  var etat = null;

  function cv() { return document.getElementById('completionView'); }
  function actif() { var v = cv(); return !!(v && !v.classList.contains('hidden') && getComputedStyle(v).display !== 'none'); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function ico(n, t, c) { try { return (window.AwakIcon && AwakIcon.get(n, t, c)) || ''; } catch (e) { return ''; } }
  function nettoyer(m) {
    return String(m || '').replace(/<[^>]+>/g, '')
      .replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}]/gu, '')
      .replace(/^[\s:·—–-]+/, '').replace(/\s+/g, ' ').trim();
  }
  function neuf() { return { t0: Date.now(), coffres: [], objets: [], niveau: null, lignes: [], clic: 0 }; }

  // ── Interceptions (appelées en tête des fonctions d'affichage) ──
  // v1450 : l'équipement gagné SORT DU COFFRE. Il est rangé dans le coffre de la séance
  // (s'il n'est pas encore ouvert) ; sans coffre, il arrive dans son propre coffre,
  // dont le palier suit la rareté de l'objet.
  var TIER_RARETE = { common: 0, uncommon: 0, rare: 1, superior: 1, epic: 2, legendary: 2, mythic: 2 };
  function tiers() { return (typeof window.awakLootTiers === 'function' && window.awakLootTiers()) || []; }
  function rangTier(t) { var l = tiers(); for (var i = 0; i < l.length; i++) if (l[i].tier === (t && t.tier)) return i; return 0; }
  function ranger() {
    etat.objets.forEach(function (o) {
      if (o.coffre != null) return;
      for (var i = 0; i < etat.coffres.length; i++) if (!etat.coffres[i].ouvert) { o.coffre = i; return; }
    });
  }
  function coffre(loot) {
    if (!actif() || !loot || !loot.tier) return false;
    etat = etat || neuf();
    etat.coffres.push({ loot: loot, ouvert: false });
    ranger(); rendre(); return true;
  }
  function objet(item, rarity, q) {
    if (!actif() || !item) return false;
    etat = etat || neuf();
    var o = { item: item, rarity: rarity || {}, q: q, coffre: null };
    etat.objets.push(o);
    ranger();
    // Le coffre de séance arrive juste après (≈ 0,2 s) : on l'attend un peu avant d'en créer un
    if (o.coffre == null) setTimeout(function () {
      if (!etat || o.coffre != null) return;
      ranger();
      if (o.coffre == null) {
        var l = tiers(), t = l[TIER_RARETE[(rarity || {}).id] || 0] || { tier: 'common', label: 'Commun', color: '#6b7280' };
        etat.coffres.push({ loot: { tier: t, reward: null }, ouvert: false, equipSeul: true });
        o.coffre = etat.coffres.length - 1;
      }
      rendre();
    }, 900);
    rendre(); return true;
  }
  function niveau(n, pts) {
    if (!actif()) return false;
    etat = etat || neuf();
    var avant = etat.niveau ? etat.niveau.pts : 0;
    etat.niveau = { n: Math.max(n || 0, etat.niveau ? etat.niveau.n : 0), pts: avant + (pts || 0) };
    rendre(); return true;
  }
  function muscle(nom, lvl) {
    if (!actif()) return false;
    etat = etat || neuf();
    ajouterLigne(nom + ' passe au niveau ' + lvl);
    rendre(); return true;
  }
  function toast(msg, type) {
    if (!actif() || !etat) return false;
    if (type === 'error' || type === 'warning') return false;
    if (Date.now() - etat.t0 > CAPTURE_MS) return false;
    if (Date.now() - etat.clic < 1500) return false;     // réponse à une touche du joueur : on l'affiche
    var t = nettoyer(msg);
    if (!t || !REC.test(t)) return false;                // conseils, invitations : notification normale
    ajouterLigne(t);
    rendre(); return true;
  }
  function ajouterLigne(t) { if (etat.lignes.indexOf(t) < 0) etat.lignes.push(t); }
  // Scènes en attente tant que l'écran de fin est affiché (sauf victoire finale)
  function bloque() { return actif() && !window._awakFinSansFile; }

  // ── Carte « Butin de la séance » ──
  function placer(c) {
    var x = document.getElementById('awakXpFin');
    if (x && x.parentNode) { if (x.nextSibling !== c) x.parentNode.insertBefore(c, x.nextSibling); return; }
    var hote = document.getElementById('completionPRs') || document.getElementById('completionComparison') || document.getElementById('awakFinDetails');
    if (hote && hote.parentNode && c.nextSibling !== hote) hote.parentNode.insertBefore(c, hote);
  }
  function rendre() {
    if (!etat || !actif()) return;
    var c = document.getElementById('awakButinFin');
    var vide = !etat.coffres.length && !etat.objets.length && !etat.niveau && !etat.lignes.length;
    if (vide) { if (c) c.remove(); return; }
    if (!c) {
      c = document.createElement('div');
      c.id = 'awakButinFin';
      c.style.cssText = 'margin:0 0 14px;padding:13px 15px;border-radius:14px;background:linear-gradient(160deg,rgba(167,139,250,0.12),rgba(167,139,250,0.02));border:1px solid rgba(167,139,250,0.35);text-align:left;';
      c.addEventListener('click', clicCarte);
    }
    var h = '<div style="display:flex;align-items:center;gap:7px;font-size:0.66em;font-weight:800;letter-spacing:1.2px;color:#c4b5fd;text-transform:uppercase;margin-bottom:8px;">' + ico('etoile', 14, '#c4b5fd') + '<span>Butin de la séance</span></div>';
    if (etat.niveau) {
      h += '<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:9px 11px;border-radius:11px;background:rgba(34,211,238,0.08);border:1px solid rgba(34,211,238,0.3);margin-bottom:8px;">'
        + '<div style="min-width:0;"><div style="font-weight:900;color:#f8fafc;font-size:0.92em;">Niveau ' + etat.niveau.n + ' atteint</div>'
        + (etat.niveau.pts ? '<div style="font-size:0.72em;color:#a5f3fc;">+' + etat.niveau.pts + ' point' + (etat.niveau.pts > 1 ? 's' : '') + ' d\'attribut à distribuer</div>' : '') + '</div>'
        + (etat.niveau.pts ? '<button type="button" data-fin-points style="flex-shrink:0;min-height:auto;padding:8px 12px;border-radius:9px;border:none;cursor:pointer;background:linear-gradient(135deg,#22d3ee,#0891b2);color:#04121f;font-weight:900;font-size:0.76em;">Distribuer</button>' : '')
        + '</div>';
    }
    etat.coffres.forEach(function (k, i) {
      // un objet plus rare que le coffre le fait monter de palier (visuel)
      var dedans = etat.objets.filter(function (o) { return o.coffre === i; });
      var tier = k.loot.tier, l = tiers();
      dedans.forEach(function (o) { var j = TIER_RARETE[(o.rarity || {}).id] || 0; if (l[j] && j > rangTier(tier)) tier = l[j]; });
      var col = tier.color || '#a78bfa', r = k.loot.reward || {};
      var svg = typeof window._awakCoffreSvg === 'function' ? window._awakCoffreSvg(col, k.ouvert) : '';
      h += '<button type="button" data-fin-coffre="' + i + '" style="display:flex;align-items:center;gap:11px;width:100%;min-height:auto;padding:8px 10px;margin-bottom:8px;border-radius:11px;cursor:pointer;text-align:left;font-family:inherit;background:rgba(255,255,255,0.03);border:1px solid ' + col + '66;">'
        + '<span style="width:60px;height:60px;flex-shrink:0;display:block;' + (k.ouvert ? '' : 'animation:pulse-warning 0.9s infinite;') + '">' + svg.replace('width="96" height="96"', 'width="60" height="60"') + '</span>'
        + '<span style="min-width:0;"><span style="display:block;font-size:0.7em;font-weight:800;letter-spacing:1px;color:' + col + ';text-transform:uppercase;">Coffre ' + esc(tier.label || '') + '</span>'
        + '<span style="display:block;font-size:0.86em;font-weight:800;color:#f8fafc;margin-top:2px;">' + (k.ouvert ? esc(k.equipSeul ? 'Équipement trouvé' : (nettoyer(r.label) || 'Récompense ajoutée')) : 'Touche pour l\'ouvrir') + '</span>'
        + (!k.ouvert && dedans.length ? '<span style="display:block;font-size:0.7em;color:#94a3b8;">Quelque chose brille à l\'intérieur…</span>' : '')
        + (k.ouvert && r._newBadge ? '<span style="display:block;font-size:0.7em;color:#94a3b8;">Nouvel insigne pour ta collection</span>' : '')
        + (k.ouvert && r.type === 'buff' ? '<span style="display:block;font-size:0.7em;color:#94a3b8;">Bonus actif à ta prochaine séance</span>' : '')
        + '</span></button>';
      // objets sortis du coffre (visibles une fois ouvert)
      if (k.ouvert) dedans.forEach(function (o) { h += ligneObjet(o, etat.objets.indexOf(o), true); });
    });
    etat.objets.forEach(function (o, i) {
      if (o.coffre != null) return;
      h += ligneObjet(o, i, false);
    });
    function ligneObjet(o, i, sorti) {
      var col = o.rarity.color || '#94a3b8', h = '';
      h += '<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 10px;margin-bottom:8px;border-radius:11px;background:rgba(255,255,255,0.03);border:1px solid ' + col + '55;">'
        + '<div style="display:flex;align-items:center;gap:9px;min-width:0;">' + ico('bouclier', 18, col)
        + '<div style="min-width:0;"><div style="font-size:0.66em;font-weight:800;letter-spacing:1px;color:' + col + ';text-transform:uppercase;">Équipement · ' + esc(o.rarity.labelFull || o.rarity.label || '') + '</div>'
        + '<div style="font-size:0.86em;font-weight:800;color:#f8fafc;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + esc(nettoyer(o.item.name)) + '</div></div></div>'
        + '<button type="button" data-fin-objet="' + i + '" style="flex-shrink:0;min-height:auto;padding:6px 11px;border-radius:9px;cursor:pointer;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.14);color:#e2e8f0;font-weight:800;font-size:0.74em;">Voir</button></div>';
      if (sorti) h = h.replace('margin-bottom:8px;border-radius:11px;', 'margin:-4px 0 8px 22px;border-radius:11px;animation:awakFadeIn .5s;');
      return h;
    }
    if (etat.lignes.length) {
      h += '<div style="display:flex;flex-direction:column;gap:4px;">' + etat.lignes.map(function (t) {
        return '<div style="display:flex;align-items:flex-start;gap:7px;font-size:0.76em;color:#e2e8f0;line-height:1.35;">' + ico('valide', 13, '#c4b5fd') + '<span>' + esc(t) + '</span></div>';
      }).join('') + '</div>';
    }
    c.innerHTML = h;
    placer(c);
  }
  function clicCarte(e) {
    var b = e.target.closest('[data-fin-coffre]');
    if (b) { var k = etat.coffres[+b.getAttribute('data-fin-coffre')]; if (k && !k.ouvert) { k.ouvert = true; try { if (navigator.vibrate) navigator.vibrate([40, 30, 80]); } catch (x) {} rendre(); } return; }
    var o = e.target.closest('[data-fin-objet]');
    if (o) { var it = etat.objets[+o.getAttribute('data-fin-objet')]; if (it && typeof window.showDropModal === 'function') { window._awakFinVoir = true; try { window.showDropModal(it.item, it.rarity, it.q); } finally { window._awakFinVoir = false; } } return; }
    if (e.target.closest('[data-fin-points]')) { try { window.awakOpenStatPointsModal(); } catch (x) {} }
  }

  // ── Détails repliés + prochain objectif ──
  var SECONDAIRES = ['completionMuscleChart', 'completionChallengeProgress', 'completionAwakTree', 'completionVolume', 'completionHabits', 'completionMuscles', 'completionCelebStats', 'completionVerdict', 'completionStreak'];
  function monterDetails() {
    if (document.getElementById('awakFinDetails')) return;
    var premier = document.getElementById('completionMuscleChart');
    if (!premier || !premier.parentNode) return;
    var d = document.createElement('details');
    d.id = 'awakFinDetails';
    d.style.cssText = 'margin:0 0 14px;border-radius:12px;border:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.02);';
    d.innerHTML = '<summary style="cursor:pointer;list-style:none;padding:12px 14px;font-size:0.8em;font-weight:800;color:#cbd5e1;display:flex;align-items:center;justify-content:space-between;">'
      + '<span>Détails de la séance</span><span style="font-size:0.85em;color:#64748b;">muscles, volume, calories…</span></summary><div data-fin-corps style="padding:4px 12px 2px;"></div>';
    premier.parentNode.insertBefore(d, premier);
    var corps = d.querySelector('[data-fin-corps]');
    SECONDAIRES.forEach(function (id) { var el = document.getElementById(id); if (el) corps.appendChild(el); });
    // Records (PR) et comparaison restent visibles, au-dessus des détails
    ['completionPRs', 'completionComparison'].forEach(function (id) { var el = document.getElementById(id); if (el) d.parentNode.insertBefore(el, d); });
  }
  function prochainObjectif() {
    var vieux = document.getElementById('awakFinProchain'); if (vieux) vieux.remove();
    var txt = '';
    try {
      var m = window.AwakMission && AwakMission.etat ? AwakMission.etat() : null;
      var s = window.AwakHomePro && AwakHomePro.semaine ? AwakHomePro.semaine() : null;
      var pr = window.AwakHomePro && AwakHomePro.prochaineTexte ? AwakHomePro.prochaineTexte() : '';
      if (s && s.visee && s.fait < s.visee) {
        var r = s.visee - s.fait;
        txt = (r === 1 ? 'Encore 1 séance' : 'Encore ' + r + ' séances') + ' cette semaine pour ton objectif'
          + (m && !m.finie && window.rpgEnabled && rpgEnabled() ? ' et la mission « ' + m.titre + ' »' : '') + '.';
      } else if (s && s.visee) {
        txt = 'Objectif de la semaine atteint (' + s.fait + ' / ' + s.visee + ').';
      }
      if (pr) txt += (txt ? ' ' : '') + 'Prochaine séance ' + pr + '.';
    } catch (e) {}
    if (!txt) return;
    var c = document.createElement('div');
    c.id = 'awakFinProchain';
    c.style.cssText = 'margin:0 0 14px;padding:12px 14px;border-radius:12px;background:rgba(96,168,240,0.06);border:1px solid rgba(96,168,240,0.28);text-align:left;';
    c.innerHTML = '<div style="display:flex;align-items:center;gap:7px;font-size:0.66em;font-weight:800;letter-spacing:1.2px;color:#93c5fd;text-transform:uppercase;margin-bottom:4px;">' + ico('cible', 14, '#93c5fd') + '<span>Prochain objectif</span></div>'
      + '<div style="font-size:0.82em;color:#e2e8f0;line-height:1.45;">' + esc(txt) + '</div>';
    var d = document.getElementById('awakFinDetails');
    if (d && d.parentNode) d.parentNode.insertBefore(c, d);
  }

  function brancher() {
    var v = cv(); if (!v) return;
    monterDetails();
    var cache = v.classList.contains('hidden');
    new MutationObserver(function () {
      var h = v.classList.contains('hidden');
      if (cache && !h) {
        etat = neuf();
        var vieux = document.getElementById('awakButinFin'); if (vieux) vieux.remove();
        var d = document.getElementById('awakFinDetails'); if (d) d.open = false;
        setTimeout(prochainObjectif, 1000); setTimeout(prochainObjectif, 2600);
        setTimeout(rendre, 950); setTimeout(rendre, 2600);   // se replace sous la carte d'XP
      }
      if (!cache && h) { etat = null; window._awakFinSansFile = false; }
      cache = h;
    }).observe(v, { attributes: true, attributeFilter: ['class'] });
    document.addEventListener('click', function (e) { if (etat && v.contains(e.target)) etat.clic = Date.now(); }, true);
  }

  window.AwakFin = { actif: actif, bloque: bloque, coffre: coffre, objet: objet, niveau: niveau, muscle: muscle, toast: toast, _etat: function () { return etat; } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', brancher); else brancher();
})();
