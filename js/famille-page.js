/* ═══════════════════════════════════════════════════════════════════
   ONGLET FAMILLE — page unique de l'adulte (v1781)
   Avant : 3 volets (Ensemble · Enfants · Défis) rangés par thème.
   Maintenant : une page rangée par PERSONNE et par ACTION.
     1. les membres en grandes cartes → fiche du membre (tout au même endroit)
     2. « À faire ensemble » : séance ensemble + jeux
     3. « Plus » : jours en famille, étoiles, défis, badges, journal, liens
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

  // ── 1. Les membres : ronds avec l'anneau de la semaine + anneau de la famille (v1783) ──
  var CIBLE = 3;   // jours actifs visés par membre et par semaine, pour l'anneau commun
  function styles() {
    if (document.getElementById('awkFamPageStyles')) return;
    var st = document.createElement('style'); st.id = 'awkFamPageStyles';
    st.textContent = '@keyframes awkFamTrace{from{stroke-dashoffset:var(--c)}to{stroke-dashoffset:var(--o)}}'
      + '@keyframes awkFamSeg{from{opacity:0;transform:scale(0.6)}to{opacity:1;transform:scale(1)}}'
      + '@keyframes awkFamPouls{0%,100%{box-shadow:0 0 0 0 rgba(96,168,240,0.55)}50%{box-shadow:0 0 0 7px rgba(96,168,240,0)}}'
      + '@keyframes awkFamEntre{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}'
      + '#awakFamRonds{display:flex;gap:14px;overflow-x:auto;padding:6px 2px 10px;margin:0 -2px;scrollbar-width:none;-webkit-overflow-scrolling:touch;}#awakFamRonds::-webkit-scrollbar{display:none;}'
      + '.awk-fam-moment{animation:awkFamEntre .4s ease-out both;}'
      + '@media(prefers-reduced-motion:reduce){#familyContainer *{animation:none!important;}}';
    document.head.appendChild(st);
  }
  // Anneau à 7 segments (lundi → dimanche) autour d'une photo
  function anneau(jours, taille, epais) {
    var r = (taille - epais) / 2, c = 2 * Math.PI * r, seg = c / 7, trou = Math.max(3, epais * 0.9), a = iAuj(), h = '';
    for (var i = 0; i < 7; i++) {
      var on = jours[i], coul = on ? BLEU : (i === a ? 'rgba(96,168,240,0.38)' : 'rgba(255,255,255,' + (i > a ? '0.07' : '0.14') + ')');
      h += '<circle cx="' + taille / 2 + '" cy="' + taille / 2 + '" r="' + r + '" fill="none" stroke="' + coul + '" stroke-width="' + epais + '" stroke-linecap="round" stroke-dasharray="' + (seg - trou).toFixed(2) + ' ' + (c - seg + trou).toFixed(2) + '" stroke-dashoffset="' + (-(i * seg + trou / 2)).toFixed(2) + '"'
        + (on ? ' style="transform-origin:50% 50%;animation:awkFamSeg .45s ease-out ' + (0.08 * i).toFixed(2) + 's both;"' : '') + '/>';
    }
    return '<svg width="' + taille + '" height="' + taille + '" viewBox="0 0 ' + taille + ' ' + taille + '" style="position:absolute;inset:0;transform:rotate(-90deg);" aria-hidden="true">' + h + '</svg>';
  }
  function rond(p) {
    var m = moi(), soi = p.id === m, s = semaine(p.id), kid = estEnfant(p.id), et = kid ? etoiles(p.id) : null, auj = !!s.jours[iAuj()];
    var nb = s.jours.filter(Boolean).length;
    return '<button type="button" data-fam-membre="' + esc(p.id) + '" onclick="AwakFamPage.membre(\'' + esc(p.id) + '\')" aria-label="' + esc(soi ? 'Toi' : (p.name || 'Membre')) + ', ' + nb + ' jour' + (nb > 1 ? 's' : '') + ' sur 7' + (auj ? ', a bougé aujourd\'hui' : '') + '" style="flex-shrink:0;display:flex;flex-direction:column;align-items:center;gap:6px;width:78px;min-height:0;padding:0;background:none;border:none;cursor:pointer;font-family:inherit;">'
      + '<span style="position:relative;display:block;width:78px;height:78px;">' + anneau(s.jours, 78, 5)
      +   '<span style="position:absolute;left:9px;top:9px;width:60px;height:60px;border-radius:50%;overflow:hidden;' + (auj ? 'animation:awkFamPouls 2.2s ease-out infinite;' : 'filter:saturate(0.55) brightness(0.8);') + '">' + avatar(p.avatar, 60) + '</span>'
      +   (et && et.attente ? '<span style="position:absolute;top:-2px;right:-2px;min-width:22px;height:22px;padding:0 5px;box-sizing:border-box;border-radius:99px;background:' + AMBRE + ';color:#1c1607;font-size:12px;font-weight:900;display:flex;align-items:center;justify-content:center;border:2px solid #0d1016;">' + et.attente + '</span>' : '')
      +   (et ? '<span style="position:absolute;bottom:-4px;left:50%;transform:translateX(-50%);display:inline-flex;align-items:center;gap:2px;padding:1px 7px;border-radius:99px;background:#1c1607;border:1px solid rgba(251,191,36,0.5);color:#fde68a;font-size:11px;font-weight:900;white-space:nowrap;">' + et.solde + ic('etoile', 10, AMBRE) + '</span>' : '')
      + '</span>'
      + '<span style="max-width:78px;font-size:0.8em;font-weight:900;color:' + (auj ? '#fff' : '#cbd5e1') + ';overflow:hidden;text-overflow:ellipsis;white-space:nowrap;' + (et ? 'margin-top:3px;' : '') + '">' + esc(soi ? 'Toi' : (p.name || 'Membre')) + '</span>'
      + '</button>';
  }
  function heros(ordre) {
    var m = moi(), fait = 0, but = CIBLE * ordre.length, sansAuj = [], sansSem = [];
    ordre.forEach(function (p) {
      var s = semaine(p.id), nb = s.jours.filter(Boolean).length;
      fait += Math.min(CIBLE, nb);
      if (!s.jours[iAuj()]) sansAuj.push(p);
      if (!nb) sansSem.push(p);
    });
    var T = 132, E = 12, r = (T - E) / 2, c = 2 * Math.PI * r, part = but ? Math.min(1, fait / but) : 0, fini = part >= 1;
    var nom = function (p) { return p.id === m ? 'toi' : (p.name || 'un membre'); };
    var liste = function (l) { var n = l.map(nom); return n.length > 1 ? n.slice(0, -1).join(', ') + ' et ' + n[n.length - 1] : n[0]; };
    var phrase, cible = null;
    if (fini) phrase = 'Objectif de la semaine atteint. Toute la famille a bougé ' + CIBLE + ' jours ou plus.';
    else if (!sansAuj.length) phrase = 'Tout le monde a bougé aujourd\'hui !';
    else if (sansSem.length && sansSem.length < ordre.length) { phrase = 'Il manque ' + liste(sansSem) + ' cette semaine.'; cible = sansSem.filter(function (p) { return p.id !== m; })[0]; }
    else if (sansAuj.length < ordre.length) { phrase = 'Pas encore bougé aujourd\'hui : ' + liste(sansAuj) + '.'; cible = sansAuj.filter(function (p) { return p.id !== m; })[0]; }
    else phrase = 'Personne n\'a encore bougé aujourd\'hui. Qui commence ?';
    // v1784 : bandeau illustré (images/famille/bandeau.webp) — l'anneau sur la moitié sombre, la famille à droite
    return '<div id="awakFamHeros" style="border-radius:20px;margin-bottom:16px;overflow:hidden;background:#141d33;border:1px solid rgba(96,168,240,0.3);">'
      + '<div style="position:relative;height:168px;background:#1b2a4a url(images/famille/bandeau.webp) 100% 50%/cover no-repeat;">'
      +   '<div style="position:absolute;inset:0;background:linear-gradient(90deg,rgba(13,19,34,0.55) 0%,rgba(13,19,34,0.15) 48%,rgba(13,19,34,0) 60%),linear-gradient(180deg,rgba(20,29,51,0) 62%,#141d33 100%);"></div>'
      +   '<div style="position:absolute;left:5.5%;top:18px;width:' + T + 'px;height:' + T + 'px;">'
      +   '<svg width="' + T + '" height="' + T + '" viewBox="0 0 ' + T + ' ' + T + '" style="transform:rotate(-90deg);" aria-hidden="true">'
      +     '<defs><linearGradient id="awkFamDeg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#22d3ee"/><stop offset="1" stop-color="#60a8f0"/></linearGradient></defs>'
      +     '<circle cx="' + T / 2 + '" cy="' + T / 2 + '" r="' + r + '" fill="rgba(10,15,28,0.55)" stroke="rgba(255,255,255,0.12)" stroke-width="' + E + '"/>'
      +     '<circle cx="' + T / 2 + '" cy="' + T / 2 + '" r="' + r + '" fill="none" stroke="url(#awkFamDeg)" stroke-width="' + E + '" stroke-linecap="round" stroke-dasharray="' + c.toFixed(1) + '" stroke-dashoffset="' + (c * (1 - part)).toFixed(1) + '" style="--c:' + c.toFixed(1) + ';--o:' + (c * (1 - part)).toFixed(1) + ';animation:awkFamTrace 1.1s cubic-bezier(.3,.8,.3,1) both;' + (part ? 'filter:drop-shadow(0 0 6px rgba(96,168,240,0.7));' : 'opacity:0;') + '"/>'
      +   '</svg>'
      +   '<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;">'
      +     '<div style="font-size:2em;font-weight:900;color:#fff;line-height:1;">' + fait + '<span style="font-size:0.5em;color:#9fb0c8;font-weight:800;"> / ' + but + '</span></div>'
      +     '<div style="font-size:0.62em;font-weight:900;letter-spacing:1.5px;color:#93c5fd;margin-top:4px;">JOURS</div>'
      +   '</div></div></div>'
      + '<div style="padding:2px 16px 16px;">'
      +   '<div style="font-size:0.66em;font-weight:900;letter-spacing:2px;color:' + BLEU + ';">LA SEMAINE DE LA FAMILLE</div>'
      +   '<div style="display:flex;align-items:center;gap:12px;margin-top:6px;">'
      +     '<div style="flex:1;min-width:0;"><div style="font-size:1em;font-weight:800;color:#f1f5f9;line-height:1.35;">' + esc(phrase.charAt(0).toUpperCase() + phrase.slice(1)) + '</div>'
      +     '<div style="font-size:0.72em;color:#8fa0b8;font-weight:700;line-height:1.35;margin-top:3px;">Objectif : ' + CIBLE + ' jours actifs chacun.</div></div>'
      +     (cible ? '<button type="button" onclick="AwakConstAction(\'nudge\',\'' + String(cible.id).replace(/'/g, '') + '\')" style="flex-shrink:0;min-height:0;padding:10px 13px;border-radius:12px;cursor:pointer;font-family:inherit;font-size:0.8em;font-weight:900;display:inline-flex;align-items:center;gap:7px;background:rgba(251,146,60,0.14);color:#fdba74;border:1px solid rgba(251,146,60,0.5);max-width:46%;">' + ic('coeur', 15, ORANGE) + '<span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">Encourager ' + esc(cible.name || '') + '</span></button>' : '')
      +   '</div></div></div>';
  }
  function blocMembres(liste, nbMax) {
    styles();
    var m = moi();
    var ordre = liste.slice().sort(function (a, b) { return (a.id === m ? -1 : 0) - (b.id === m ? -1 : 0); });
    var h = '<div id="awakFamMembres" style="margin-bottom:10px;"><div id="awakFamRonds">' + ordre.map(rond).join('');
    if (ordre.length < nbMax) {
      h += '<button type="button" onclick="if(typeof showCreateProfileModal===\'function\')showCreateProfileModal();else showProfileSelectionModal()" aria-label="Ajouter un membre" style="flex-shrink:0;display:flex;flex-direction:column;align-items:center;gap:6px;width:78px;min-height:0;padding:0;background:none;border:none;cursor:pointer;font-family:inherit;">'
        + '<span style="display:flex;align-items:center;justify-content:center;width:78px;height:78px;box-sizing:border-box;border-radius:50%;border:2px dashed rgba(96,168,240,0.45);color:#bfdbfe;font-size:30px;font-weight:700;line-height:1;">+</span>'
        + '<span style="font-size:0.8em;font-weight:800;color:#93c5fd;">Ajouter</span></button>';
    }
    h += '</div></div>';
    if (ordre.length > 1) h += heros(ordre);
    return h;
  }

  // ── Le mur : les derniers moments de la famille, avec réactions (v1783) ──
  var REAC = [['👏', 'valide', 'Bravo'], ['💪', 'muscle', 'Fort'], ['🔥', 'flamme', 'En feu'], ['❤️', 'coeur', 'J\'aime']];
  function ilYA(ts) {
    var mn = Math.floor((Date.now() - ts) / 60000);
    if (mn < 1) return 'à l\'instant'; if (mn < 60) return 'il y a ' + mn + ' min';
    var h = Math.floor(mn / 60); if (h < 24) return 'il y a ' + h + ' h';
    var d = Math.floor(h / 24); return d === 1 ? 'hier' : 'il y a ' + d + ' jours';
  }
  function moments() {
    var l = [];
    try {
      ((window.AwakFamilyFeed && AwakFamilyFeed.buildFeed) ? AwakFamilyFeed.buildFeed() : []).forEach(function (it) {
        var d = []; if (it.duration) d.push(it.duration + ' min'); var nx = Array.isArray(it.exercises) ? it.exercises.length : parseInt(it.exercises, 10); if (nx > 0) d.push(nx + ' exercice' + (nx > 1 ? 's' : ''));
        l.push({ id: it.feedId, pid: it.profileId, nom: it.name, avatar: it.avatar, ts: it.ts, icone: 'halter', c: BLEU, texte: 'a terminé <b style="color:#fff;">' + esc(it.workoutName) + '</b>', detail: d.join(' · ') });
      });
    } catch (e) { _e(e); }
    try {
      var lim = Date.now() - 14 * 86400000;
      profils().forEach(function (p) {
        if (!estEnfant(p.id) || !window.AwakEtoiles || !AwakEtoiles.journal) return;
        (AwakEtoiles.journal(p.id) || []).forEach(function (x) {
          if (!x || x.t < lim) return;
          if (x.k === 'recompense') l.push({ id: p.id + ':r' + x.t, pid: p.id, nom: p.name, avatar: p.avatar, ts: x.t, icone: 'trophee', c: AMBRE, texte: 'a obtenu <b style="color:#fde68a;">' + esc(String(x.r || '').replace(/^Récompense : /, '')) + '</b>', detail: Math.abs(x.n || 0) + ' étoiles' });
          else if (x.k === 'parent' && x.n > 0) l.push({ id: p.id + ':p' + x.t, pid: p.id, nom: p.name, avatar: p.avatar, ts: x.t, icone: 'etoile', c: AMBRE, texte: 'a reçu <b style="color:#fde68a;">' + x.n + ' étoile' + (x.n > 1 ? 's' : '') + '</b>', detail: String(x.r || '') });
        });
      });
    } catch (e) { _e(e); }
    l.sort(function (a, b) { return b.ts - a.ts; });
    return l;
  }
  function blocMur() {
    var tous = moments(); if (!tous.length) return '';
    var m = moi(), vus = tous.slice(0, 6);
    var h = vus.map(function (it, i) {
      var r = {}; try { r = AwakFamilyFeed.reactionsFor(it.id) || {}; } catch (e) { r = {}; }
      var soi = it.pid === m;
      var btns = REAC.map(function (q) {
        var qui = r[q[0]] || [], n = qui.length, mien = qui.indexOf(m) >= 0;
        if (soi && !n) return '';
        return '<button type="button" ' + (soi ? 'disabled ' : 'onclick="AwakFamPage.reagir(\'' + String(it.id).replace(/'/g, '') + '\',' + REAC.indexOf(q) + ')" ') + 'aria-label="' + q[2] + (n ? ', ' + n : '') + '" aria-pressed="' + (mien ? 'true' : 'false') + '" style="display:inline-flex;align-items:center;gap:4px;min-height:0;padding:6px 10px;border-radius:99px;cursor:' + (soi ? 'default' : 'pointer') + ';font-family:inherit;font-size:0.76em;font-weight:900;'
          + (mien ? 'background:rgba(96,168,240,0.2);border:1px solid rgba(96,168,240,0.7);color:#dbeafe;' : 'background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);color:#94a3b8;') + '">'
          + ic(q[1], 15, mien ? '#93c5fd' : (n ? '#cbd5e1' : '#7c8aa0')) + (n ? '<span>' + n + '</span>' : '') + '</button>';
      }).join('');
      return '<div class="awk-fam-moment" style="animation-delay:' + (0.05 * i).toFixed(2) + 's;display:flex;gap:11px;padding:13px 14px;border-radius:16px;background:#12161c;border:1px solid rgba(255,255,255,0.07);margin-bottom:8px;">'
        + '<span style="position:relative;flex-shrink:0;display:block;width:44px;height:44px;">'
        +   '<span style="display:block;width:44px;height:44px;border-radius:50%;overflow:hidden;">' + avatar(it.avatar, 44) + '</span>'
        +   '<span style="position:absolute;right:-4px;bottom:-4px;width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:#0d1016;border:1px solid ' + it.c + '80;">' + ic(it.icone, 12, it.c) + '</span></span>'
        + '<div style="flex:1;min-width:0;">'
        +   '<div style="font-size:0.9em;color:#cbd5e1;line-height:1.35;"><b style="color:#fff;">' + esc(soi ? 'Toi' : (it.nom || 'Membre')) + '</b> ' + (soi ? it.texte.replace(/^a /, 'as ') : it.texte) + '</div>'
        +   '<div style="font-size:0.72em;color:#7c8aa0;font-weight:700;margin-top:2px;">' + (it.detail ? esc(it.detail) + ' · ' : '') + ilYA(it.ts) + '</div>'
        +   (btns ? '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:9px;">' + btns + '</div>' : '')
        + '</div></div>';
    }).join('');
    return '<div id="awakFamMur" style="margin-bottom:16px;">' + titre('LES DERNIERS MOMENTS', tous.length > vus.length && typeof window.AwakFamilyFeedOpen === 'function' ? '<button type="button" onclick="AwakFamilyFeedOpen()" style="min-height:0;padding:0;background:none;border:none;cursor:pointer;font-family:inherit;font-size:1em;font-weight:800;color:#93c5fd;">Tout voir ›</button>' : '')
      + h + '</div>';
  }
  function reagir(id, i) {
    var q = REAC[i]; if (!q) return;
    try { AwakFamilyFeed.toggleReaction(id, q[0]); } catch (e) { _e(e); }
    try { if (navigator.vibrate) navigator.vibrate(12); } catch (e) { /* rien */ }
    var mur = document.getElementById('awakFamMur');
    if (mur) { var t = document.createElement('div'); t.innerHTML = blocMur(); var n = t.firstChild; if (n) { n.querySelectorAll('.awk-fam-moment').forEach(function (x) { x.style.animation = 'none'; }); mur.replaceWith(n); } }
  }

  // ── 2. À faire ensemble ──
  // v1784 : cartes illustrées (images/famille/seance.webp, jeux.webp) ; le titre se lit sur le bas sombre
  function grosBouton(fn, icone, t, d, plein, image) {
    return '<button type="button" onclick="' + fn + '" style="position:relative;display:block;min-width:0;min-height:0;padding:0 !important;overflow:hidden;border-radius:18px;cursor:pointer;font-family:inherit;text-align:left;'
      + 'background:#16233f;border:1px solid rgba(96,168,240,0.4);color:#fff;">'
      + '<img src="images/famille/' + image + '.webp" alt="" loading="lazy" style="display:block;width:100%;' + (plein ? 'height:150px;' : 'aspect-ratio:1200/800;') + 'object-fit:cover;object-position:50% 12%;" onerror="this.style.display=\'none\'">'
      + '<span style="display:block;position:relative;margin-top:-30px;padding:30px 12px 13px;background:linear-gradient(180deg,rgba(22,35,63,0) 0,#16233f 30px);">'
      +   '<span style="display:flex;align-items:center;gap:7px;font-size:0.98em;font-weight:900;">' + ic(icone, 17, '#bfdbfe') + t + '</span>'
      +   '<span style="display:block;font-size:0.7em;color:#b6c4d8;margin-top:3px;line-height:1.35;">' + d + '</span></span></button>';
  }
  function blocEnsemble(aEnfant) {
    var a = typeof window.AwakFamilyMove === 'function', j = aEnfant && typeof window.AwakKidsOpen === 'function';
    if (!a && !j) return '';
    var deux = a && j;
    return '<div id="awakFamEnsemble" style="margin-bottom:16px;">' + titre('À FAIRE ENSEMBLE')
      + '<div style="display:grid;grid-template-columns:' + (deux ? 'repeat(2,minmax(0,1fr))' : '1fr') + ';gap:9px;">'
      + (a ? grosBouton('AwakFamilyMove()', 'groupe', 'Séance ensemble', '15 min, tout le monde au même rythme', !deux, 'seance') : '')
      + (j ? grosBouton('AwakKidsOpen()', 'manette', 'Jeux ensemble', 'Tag, statue, marche des animaux', !deux, 'jeux') : '')
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
    // v1782 : « Notre ciel » et la constellation de la semaine sont retirés de l'onglet
    if (plusieurs && window.AwakFamJours && AwakFamJours.ouvrir) { var jr = ''; try { jr = AwakFamJours.resume ? AwakFamJours.resume() : ''; } catch (e) { jr = ''; } l += ligne('AwakFamJours.ouvrir()', 'calendrier', 'Nos jours en famille', esc(jr || 'Vos jours et votre heure')); }
    if (aEnfant && window.AwakEtoiles) l += ligne('AwakEtoiles.ouvrirParent()', 'etoile', 'Étoiles et récompenses', 'Demandes, semaine des enfants, règles', AMBRE);
    if (plusieurs && typeof window.AwakEnsembleOpen === 'function') l += ligne('AwakEnsembleOpen()', 'trophee', 'Défis', 'Objectif commun, duels');
    if (plusieurs && typeof window.AwakFamBadgesOpen === 'function') l += ligne('AwakFamBadgesOpen()', 'couronne', 'Badges', 'Ceux de la famille');
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
    if (plusieurs) { try { h += blocMur(); } catch (e) { _e(e); } }
    var apres = '';
    try { if (plusieurs && ctx.sky && ctx.sky.enCours) apres = ctx.sky.enCours(); } catch (e) { _e(e); }
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

  window.AwakFamPage = { render: render, membre: membre, fermer: fermer, reagir: reagir };
})();
