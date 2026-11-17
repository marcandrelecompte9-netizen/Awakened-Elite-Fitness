/* ═══════════════════════════════════════════════════════════════════
   ONGLET FAMILLE — page unique de l'adulte (v1781)
   Avant : 3 volets (Ensemble · Enfants · Défis) rangés par thème.
   Maintenant : une page rangée par PERSONNE et par ACTION.
     1. les membres en grandes cartes → fiche du membre (tout au même endroit)
     2. « À faire ensemble » : séance ensemble + jeux
     3. « Plus » : défis, badges, journal, ciel, étoiles, membres
   Le rendu est appelé par renderFamilyTab (adventure.js). La version enfant
   de l'onglet (enfant-simple.js) n'est pas touchée.
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  function _e(e) { try { if (typeof window._awkE === 'function') window._awkE(e); } catch (x) { /* rien */ } }
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function ic(n, t, c) { return window.AwakIcon ? window.AwakIcon.get(n, t, c) : ''; }
  function profils() { try { return (typeof window.getAllProfiles === 'function' ? window.getAllProfiles() : []) || []; } catch (e) { return []; } }
  function moi() { try { return window.getCurrentProfileId(); } catch (e) { return null; } }
  function estEnfant(pid) { try { return !!(window.AwakYouth && AwakYouth.isChildProfile && AwakYouth.isChildProfile(pid)); } catch (e) { return false; } }
  function avatar(a, t) { try { return typeof window.renderAvatar === 'function' ? window.renderAvatar(a, t) : ''; } catch (e) { return ''; } }
  function semaine(pid) {
    try { if (window.AwakFamilyWeek && AwakFamilyWeek.semaine) return AwakFamilyWeek.semaine(pid, pid === moi()); } catch (e) { _e(e); }
    return { jours: [false, false, false, false, false, false, false], seances: 0 };
  }
  function etoiles(pid) { try { return (window.AwakEtoiles && AwakEtoiles.infos) ? AwakEtoiles.infos(pid) : null; } catch (e) { return null; } }

  var BLEU = '#60a8f0', AMBRE = '#fbbf24', ORANGE = '#fb923c';
  var JOURS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
  function iAuj() { return (new Date().getDay() + 6) % 7; }
  function points(jours, taille) {
    var a = iAuj();
    return '<span style="display:flex;gap:' + (taille > 16 ? 5 : 3) + 'px;">' + jours.map(function (on, i) {
      return '<span style="width:' + taille + 'px;height:' + taille + 'px;border-radius:50%;box-sizing:border-box;display:flex;align-items:center;justify-content:center;font-size:' + Math.round(taille * 0.5) + 'px;font-weight:900;'
        + (on ? 'background:' + BLEU + ';color:#06121f;' : 'color:' + (i === a ? '#cbd5e1' : '#5b6779') + ';border:1px solid ' + (i === a ? 'rgba(96,168,240,0.7)' : 'rgba(255,255,255,0.12)') + ';')
        + (i > a ? 'opacity:0.45;' : '') + '">' + JOURS[i] + '</span>';
    }).join('') + '</span>';
  }
  function titre(t, droite) {
    return '<div style="display:flex;align-items:baseline;justify-content:space-between;gap:10px;margin:0 2px 9px;">'
      + '<span style="font-size:0.66em;font-weight:900;letter-spacing:2px;color:' + BLEU + ';">' + t + '</span>'
      + (droite ? '<span style="font-size:0.72em;color:#94a3b8;font-weight:700;">' + droite + '</span>' : '') + '</div>';
  }

  // ── 1. Les membres ──
  function carteMembre(p) {
    var m = moi(), soi = p.id === m, s = semaine(p.id), kid = estEnfant(p.id), et = kid ? etoiles(p.id) : null;
    var sous = s.seances ? s.seances + ' séance' + (s.seances > 1 ? 's' : '') : 'Pas encore bougé';
    return '<button type="button" data-fam-membre="' + esc(p.id) + '" onclick="AwakFamPage.membre(\'' + esc(p.id) + '\')" aria-label="' + esc(soi ? 'Toi' : (p.name || 'Membre')) + ', ' + sous + ' cette semaine" style="position:relative;display:flex;flex-direction:column;align-items:center;gap:7px;min-width:0;min-height:0;padding:14px 8px 12px;border-radius:16px;cursor:pointer;font-family:inherit;text-align:center;'
      + 'background:#12161c;border:1px solid ' + (soi ? 'rgba(96,168,240,0.45)' : 'rgba(255,255,255,0.08)') + ';">'
      + (et && et.attente ? '<span style="position:absolute;top:8px;right:8px;min-width:20px;height:20px;padding:0 5px;box-sizing:border-box;border-radius:99px;background:' + AMBRE + ';color:#1c1607;font-size:11px;font-weight:900;display:flex;align-items:center;justify-content:center;">' + et.attente + '</span>' : '')
      + '<span style="display:block;width:60px;height:60px;border-radius:50%;overflow:hidden;flex-shrink:0;">' + avatar(p.avatar, 60) + '</span>'
      + '<span style="display:block;max-width:100%;font-size:0.98em;font-weight:900;color:#f8fafc;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + esc(soi ? 'Toi' : (p.name || 'Membre')) + '</span>'
      + points(s.jours, 16)
      + '<span style="display:flex;align-items:center;justify-content:center;gap:8px;font-size:0.72em;font-weight:700;color:' + (s.seances ? '#cbd5e1' : '#7c8aa0') + ';">' + sous
      + (et ? '<span style="display:inline-flex;align-items:center;gap:3px;color:' + AMBRE + ';font-weight:900;">' + et.solde + ic('etoile', 12, AMBRE) + '</span>' : '') + '</span>'
      + '</button>';
  }
  function blocMembres(liste, nbMax) {
    var m = moi(), total = 0, actifs = 0;
    var ordre = liste.slice().sort(function (a, b) { return (a.id === m ? -1 : 0) - (b.id === m ? -1 : 0); });
    ordre.forEach(function (p) { var s = semaine(p.id); total += s.seances; if (s.seances) actifs++; });
    var h = '<div id="awakFamMembres" style="margin-bottom:16px;">'
      + titre('CETTE SEMAINE', ordre.length > 1 ? actifs + ' sur ' + ordre.length + ' ont bougé' : '')
      + '<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;">' + ordre.map(carteMembre).join('');
    if (ordre.length < nbMax) {
      h += '<button type="button" onclick="if(typeof showCreateProfileModal===\'function\')showCreateProfileModal();else showProfileSelectionModal()" style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;min-width:0;min-height:' + (ordre.length % 2 ? '0' : '84px') + ';padding:14px 8px;border-radius:16px;cursor:pointer;font-family:inherit;background:transparent;border:1.5px dashed rgba(96,168,240,0.4);color:#bfdbfe;' + (ordre.length % 2 ? '' : 'grid-column:1/-1;') + '">'
        + '<span style="width:44px;height:44px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:rgba(96,168,240,0.12);font-size:26px;font-weight:700;line-height:1;">+</span>'
        + '<span style="font-size:0.84em;font-weight:800;">Ajouter un membre</span>'
        + '<span style="font-size:0.66em;color:#7c8aa0;font-weight:700;">' + ordre.length + ' sur ' + nbMax + '</span></button>';
    }
    return h + '</div></div>';
  }

  // ── 2. À faire ensemble ──
  function grosBouton(fn, icone, t, d, plein) {
    return '<button type="button" onclick="' + fn + '" style="display:flex;' + (plein ? 'align-items:center;gap:12px;text-align:left;' : 'flex-direction:column;align-items:flex-start;gap:9px;text-align:left;') + 'min-width:0;min-height:0;padding:14px;border-radius:16px;cursor:pointer;font-family:inherit;'
      + 'background:linear-gradient(160deg,rgba(96,168,240,0.16),rgba(96,168,240,0.05));border:1px solid rgba(96,168,240,0.4);color:#fff;">'
      + '<span style="flex-shrink:0;width:42px;height:42px;border-radius:12px;display:flex;align-items:center;justify-content:center;background:rgba(96,168,240,0.2);">' + ic(icone, 22, '#bfdbfe') + '</span>'
      + '<span style="min-width:0;"><span style="display:block;font-size:0.95em;font-weight:900;">' + t + '</span>'
      + '<span style="display:block;font-size:0.7em;color:#a9bdd6;margin-top:2px;line-height:1.35;">' + d + '</span></span></button>';
  }
  function blocEnsemble(aEnfant) {
    var a = typeof window.AwakFamilyMove === 'function', j = aEnfant && typeof window.AwakKidsOpen === 'function';
    if (!a && !j) return '';
    var deux = a && j;
    return '<div id="awakFamEnsemble" style="margin-bottom:16px;">' + titre('À FAIRE ENSEMBLE')
      + '<div style="display:grid;grid-template-columns:' + (deux ? 'repeat(2,minmax(0,1fr))' : '1fr') + ';gap:9px;">'
      + (a ? grosBouton('AwakFamilyMove()', 'groupe', 'Séance ensemble', '15 min, tout le monde au même rythme', !deux) : '')
      + (j ? grosBouton('AwakKidsOpen()', 'manette', 'Jeux ensemble', 'Tag, statue, marche des animaux', !deux) : '')
      + '</div></div>';
  }

  // ── 3. Plus ──
  function ligne(fn, icone, t, d, c) {
    return '<button type="button" onclick="' + fn + '" style="display:flex;align-items:center;gap:12px;width:100%;min-height:0;padding:13px 14px;cursor:pointer;font-family:inherit;text-align:left;background:none;border:none;border-top:1px solid rgba(255,255,255,0.06);color:#fff;border-radius:0;">'
      + '<span style="flex-shrink:0;display:inline-flex;">' + ic(icone, 20, c || BLEU) + '</span>'
      + '<span style="flex:1;min-width:0;"><span style="display:block;font-size:0.9em;font-weight:800;color:#f1f5f9;">' + t + '</span>'
      + '<span style="display:block;font-size:0.7em;color:#94a3b8;margin-top:1px;">' + d + '</span></span>'
      + '<span style="flex-shrink:0;color:#5b6779;font-size:1.2em;">›</span></button>';
  }
  function blocPlus(plusieurs, aEnfant, apres) {
    var l = '';
    if (aEnfant && window.AwakEtoiles) l += ligne('AwakEtoiles.ouvrirParent()', 'etoile', 'Étoiles et récompenses', 'Demandes, semaine des enfants, règles', AMBRE);
    if (plusieurs && typeof window.AwakEnsembleOpen === 'function') l += ligne('AwakEnsembleOpen()', 'trophee', 'Défis', 'Objectif commun, duels');
    if (plusieurs && typeof window.AwakFamBadgesOpen === 'function') l += ligne('AwakFamBadgesOpen()', 'couronne', 'Badges', 'Ceux de la famille');
    if (plusieurs && typeof window.AwakFamilyFeedOpen === 'function') l += ligne('AwakFamilyFeedOpen()', 'liste', 'Journal', 'Qui a fait quoi');
    if (plusieurs) l += ligne('AwakFamPage.ciel()', 'constel', 'Notre ciel', 'Chaque membre est une étoile');
    if (plusieurs && typeof window.AwakFamilyManage === 'function') l += ligne('AwakFamilyManage()', 'groupe', 'Liens de famille', 'Qui est qui pour toi');
    if (!l && !apres) return '';
    return '<div id="awakFamPlus" style="margin-bottom:14px;">' + titre('PLUS')
      + (apres ? '<div style="margin-bottom:9px;">' + apres + '</div>' : '')
      + (l ? '<div style="background:#12161c;border:1px solid rgba(255,255,255,0.07);border-radius:16px;overflow:hidden;margin-top:-1px;"><div style="margin-top:-1px;">' + l + '</div></div>' : '')
      + '</div>';
  }

  function render(ctx) {
    ctx = ctx || {};
    var liste = profils(), m = moi(), nbMax = window.AWAK_MAX_PROFILS || 8;
    var plusieurs = liste.length > 1;
    var aEnfant = liste.some(function (p) { return p.id !== m && estEnfant(p.id); });
    var h = '';
    try { if (ctx.sky) h += ctx.sky.avant(); } catch (e) { _e(e); }
    try { if (window.AwakEtoiles && AwakEtoiles.bandeauParent) h += AwakEtoiles.bandeauParent(); } catch (e) { _e(e); }
    h += blocMembres(liste, nbMax);
    if (plusieurs) h += blocEnsemble(aEnfant);
    var apres = '';
    try { if (plusieurs && ctx.sky) apres = ctx.sky.apres(); } catch (e) { _e(e); }
    h += blocPlus(plusieurs, aEnfant, apres);
    if (!plusieurs) h += '<div style="padding:4px 6px 14px;font-size:0.8em;color:#94a3b8;line-height:1.5;text-align:center;">Ajoute un enfant, un conjoint ou un ami : chacun a son profil, et vous bougez ensemble.</div>';
    return h;
  }

  // ── Fenêtres ──
  function feuille(id, html) {
    var v = document.getElementById(id); if (v) v.remove();
    var o = document.createElement('div');
    o.id = id; o.setAttribute('role', 'dialog'); o.setAttribute('aria-modal', 'true');
    o.style.cssText = 'position:fixed;inset:0;z-index:10900;background:rgba(0,0,0,0.82);display:flex;align-items:flex-end;justify-content:center;';
    o.innerHTML = '<div style="width:100%;max-width:520px;background:#0d1016;border-top:1px solid rgba(96,168,240,0.4);border-radius:22px 22px 0 0;padding:16px 16px calc(18px + env(safe-area-inset-bottom));max-height:92vh;overflow-y:auto;box-sizing:border-box;">'
      + '<div style="width:36px;height:4px;background:rgba(255,255,255,0.18);border-radius:99px;margin:0 auto 14px;"></div>' + html + '</div>';
    o.addEventListener('click', function (ev) { if (ev.target === o) o.remove(); });
    document.body.appendChild(o);
    return o;
  }
  function fermer(id) { var o = document.getElementById(id || 'awakFamFiche'); if (o) o.remove(); }
  function action(fn, icone, t, d, c) {
    c = c || BLEU;
    return '<button type="button" onclick="' + fn + '" style="display:flex;align-items:center;gap:12px;width:100%;min-height:0;margin-bottom:8px;padding:13px 14px;border-radius:14px;cursor:pointer;font-family:inherit;text-align:left;background:rgba(255,255,255,0.04);border:1px solid ' + c + '40;color:#fff;">'
      + '<span style="flex-shrink:0;width:40px;height:40px;border-radius:12px;display:flex;align-items:center;justify-content:center;background:' + c + '1f;">' + ic(icone, 20, c) + '</span>'
      + '<span style="flex:1;min-width:0;"><span style="display:block;font-size:0.92em;font-weight:800;">' + t + '</span>'
      + '<span style="display:block;font-size:0.7em;color:#94a3b8;margin-top:2px;">' + d + '</span></span>'
      + '<span style="flex-shrink:0;color:' + c + ';font-size:1.15em;">›</span></button>';
  }

  // Fiche d'un membre : tout ce qui le concerne au même endroit
  function membre(pid) {
    var p = profils().filter(function (x) { return x && x.id === pid; })[0]; if (!p) return;
    var soi = pid === moi(), kid = estEnfant(pid), s = semaine(pid), et = kid && !soi ? etoiles(pid) : null;
    var q = String(pid).replace(/'/g, '');
    var age = 0; try { if (typeof window.awakAgeDe === 'function') age = window.awakAgeDe(pid); } catch (e) { age = 0; }
    var h = '<div style="display:flex;align-items:center;gap:14px;margin-bottom:14px;">'
      + '<span style="display:block;width:72px;height:72px;border-radius:50%;overflow:hidden;flex-shrink:0;">' + avatar(p.avatar, 72) + '</span>'
      + '<div style="flex:1;min-width:0;"><div style="font-size:1.3em;font-weight:900;color:#fff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + esc(soi ? (p.name || 'Toi') : (p.name || 'Membre')) + '</div>'
      + '<div style="font-size:0.76em;color:#94a3b8;font-weight:700;margin:2px 0 8px;">' + (soi ? 'Ton profil' : (kid ? 'Enfant' + (age ? ' · ' + age + ' ans' : '') : 'Membre de la famille')) + ' · ' + (s.seances ? s.seances + ' séance' + (s.seances > 1 ? 's' : '') + ' cette semaine' : 'pas encore bougé cette semaine') + '</div>'
      + points(s.jours, 24) + '</div></div>';
    if (et) {
      var pr = et.prochaine;
      h += '<div style="padding:12px 14px;border-radius:14px;background:linear-gradient(160deg,#1c1607,#11131a);border:1px solid rgba(251,191,36,0.3);margin-bottom:10px;">'
        + '<div style="display:flex;align-items:center;gap:10px;">'
        +   '<span style="display:inline-flex;align-items:center;gap:5px;font-size:1.5em;font-weight:900;color:#fff;">' + et.solde + ic('etoile', 22, AMBRE) + '</span>'
        +   '<span style="flex:1;min-width:0;font-size:0.74em;color:#cbd5e1;line-height:1.35;">' + (pr ? 'Prochaine : ' + esc(pr.nom) + ' (' + Math.max(0, et.dispo) + ' / ' + pr.cout + ')' : 'à dépenser') + '</span>'
        +   '<button type="button" onclick="AwakFamPage.fermer();AwakEtoiles.ajouter(\'' + q + '\')" style="flex-shrink:0;min-height:0;padding:9px 13px;border-radius:11px;cursor:pointer;font-family:inherit;font-size:0.82em;font-weight:900;background:rgba(251,191,36,0.16);color:#fde68a;border:1px solid rgba(251,191,36,0.5);">+ Étoiles</button>'
        + '</div>'
        + '<div style="display:flex;gap:8px;margin-top:10px;">'
        +   '<button type="button" onclick="AwakFamPage.fermer();AwakEtoiles.ouvrirParent(\'semaine\',\'' + q + '\')" style="flex:1;min-height:0;padding:9px;border-radius:11px;cursor:pointer;font-family:inherit;font-size:0.78em;font-weight:800;background:rgba(255,255,255,0.05);color:#e2e8f0;border:1px solid rgba(255,255,255,0.12);">Sa semaine</button>'
        +   '<button type="button" onclick="AwakFamPage.fermer();AwakEtoiles.ouvrirParent(\'' + (et.attente ? 'demandes' : 'historique') + '\',\'' + q + '\')" style="flex:1;min-height:0;padding:9px;border-radius:11px;cursor:pointer;font-family:inherit;font-size:0.78em;font-weight:800;background:' + (et.attente ? 'rgba(251,191,36,0.16)' : 'rgba(255,255,255,0.05)') + ';color:' + (et.attente ? '#fde68a' : '#e2e8f0') + ';border:1px solid ' + (et.attente ? 'rgba(251,191,36,0.5)' : 'rgba(255,255,255,0.12)') + ';">' + (et.attente ? et.attente + ' demande' + (et.attente > 1 ? 's' : '') : 'Historique') + '</button>'
        + '</div></div>';
    }
    if (soi) {
      h += action('AwakFamPage.fermer();showProfileSelectionModal()', 'groupe', 'Changer de profil', 'Passer à un autre membre');
      if (typeof window.AwakEnsembleOpen === 'function' && profils().length > 1) h += action('AwakFamPage.fermer();AwakEnsembleOpen()', 'trophee', 'Défi d\'équipe', 'Un objectif commun pour la famille');
    } else {
      h += action('AwakFamPage.fermer();AwakConstAction(\'nudge\',\'' + q + '\')', 'coeur', 'Encourager', 'Un petit mot pour lui donner envie', ORANGE)
        + action('AwakFamPage.fermer();AwakConstAction(\'games\',\'' + q + '\')', 'manette', 'Jouer à deux', 'Un jeu ou une séance ensemble')
        + action('AwakFamPage.fermer();AwakConstAction(\'challenge\',\'' + q + '\')', 'epee', kid ? 'Lancer un défi' : 'Lancer un duel', kid ? 'Qui bougera le plus de jours cette semaine ?' : 'Qui en fera le plus cette semaine ?')
        + action('AwakFamPage.fermer();switchProfile(\'' + q + '\')', 'personne', 'Passer à son profil', 'Ouvrir l\'app comme ' + esc(p.name || 'ce membre'));
    }
    h += '<button type="button" onclick="AwakFamPage.fermer()" style="width:100%;min-height:0;margin-top:4px;padding:13px;border-radius:14px;cursor:pointer;font-family:inherit;font-size:0.9em;font-weight:800;background:transparent;color:#cbd5e1;border:1px solid rgba(255,255,255,0.14);">Fermer</button>';
    if (kid && !soi && typeof window.awakSupprimerProfilEnfant === 'function') {
      h += '<button type="button" onclick="AwakFamPage.fermer();awakSupprimerProfilEnfant(\'' + q + '\')" style="display:block;margin:14px auto 0;min-height:0;padding:6px 10px;background:none;border:none;cursor:pointer;font-family:inherit;font-size:0.74em;font-weight:700;color:#8391a7;text-decoration:underline;">Supprimer ce profil</button>';
    }
    feuille('awakFamFiche', h);
  }

  // « Notre ciel » : la constellation, sortie de la page (elle prenait presque tout l'écran)
  function ciel() {
    var c = '';
    try { window._awkFamSansBarre = true; c = (window.AwakFamily && AwakFamily.renderConstellation) ? AwakFamily.renderConstellation() : ''; } catch (e) { _e(e); }
    window._awkFamSansBarre = false;
    if (!c) return;
    feuille('awakFamCiel', '<div style="margin:0 -4px;">' + c + '</div>'
      + '<button type="button" onclick="AwakFamPage.fermer(\'awakFamCiel\')" style="width:100%;min-height:0;margin-top:6px;padding:13px;border-radius:14px;cursor:pointer;font-family:inherit;font-size:0.9em;font-weight:800;background:transparent;color:#cbd5e1;border:1px solid rgba(255,255,255,0.14);">Fermer</button>');
  }

  window.AwakFamPage = { render: render, membre: membre, ciel: ciel, fermer: fermer };
})();
