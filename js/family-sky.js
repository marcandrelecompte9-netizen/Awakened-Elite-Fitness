/* ═══════════════════════════════════════════════════════════════════
   CIEL DE FAMILLE (v1219) — ce qui rend l'onglet Famille vivant
   ───────────────────────────────────────────────────────────────────
   • Constellation de la semaine : chaque séance de N'IMPORTE QUEL membre
     allume une étoile d'une figure (Épée, Loup, Aigle, Couronne — une par
     semaine). Figure complète → badge de famille.
   • « Vient de bouger » : à l'ouverture de l'onglet, une bannière annonce
     les séances faites par les autres depuis ta dernière visite.
   • Section « En cours » sous le ciel : objectif commun, défi d'équipe,
     duels — ou un gros bouton pour en lancer un.
   • Mon étoile : résumé de MA semaine (avant : ouvrait le défi d'équipe,
     impossible à deviner).
   100 % local. Aucun emoji (icônes AwakIcon).
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var ROSE = '#ec4899', VIOLET = '#a78bfa', OR = '#fbbf24', BLEU = '#60a8f0';
  function ic(n, t, c) { return (window.AwakIcon && AwakIcon.get(n, t || 16, c || 'currentColor')) || ''; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function moi() { try { return window.getCurrentProfileId ? getCurrentProfileId() : localStorage.getItem('currentProfileId'); } catch (e) { return null; } }
  function enfant() { try { return !!(window.AwakYouth && AwakYouth.isChild && AwakYouth.isChild()); } catch (e) { return false; } }
  function liens() { try { return (window.AwakFamily && AwakFamily.myRelations) ? AwakFamily.myRelations() : []; } catch (e) { return []; } }

  // Séances d'un profil (dates en ms)
  function seances(pid) {
    try {
      var raw = localStorage.getItem('profile_' + pid + '_workoutHistory');
      if (!raw && pid === moi()) raw = localStorage.getItem('workoutHistory');
      return (JSON.parse(raw || '[]') || []).map(function (w) {
        return w && w.date ? Date.parse(w.date) : (w && w.id ? +w.id : 0);
      }).filter(function (t) { return t > 0; });
    } catch (e) { return []; }
  }
  function debutSemaine() {
    var d = new Date(); d.setHours(0, 0, 0, 0);
    var j = (d.getDay() + 6) % 7;            // lundi = 0
    d.setDate(d.getDate() - j);
    return d.getTime();
  }
  function idSemaine() { return Math.floor((debutSemaine() + 4 * 86400000) / (7 * 86400000)); }

  // ── Figures (12 étoiles, repère 0-100) ──
  var FIGURES = [
    { nom: "L'Épée", pts: [[50,6],[50,19],[50,32],[50,45],[30,57],[40,57],[50,57],[60,57],[70,57],[50,69],[50,81],[50,93]],
      liens: [[0,1],[1,2],[2,3],[3,6],[4,5],[5,6],[6,7],[7,8],[6,9],[9,10],[10,11]] },
    { nom: 'Le Loup', pts: [[22,8],[34,30],[50,36],[66,30],[78,8],[76,46],[64,64],[50,82],[36,64],[24,46],[41,50],[59,50]],
      liens: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,9],[9,0],[10,11]] },
    { nom: "L'Aigle", pts: [[6,30],[20,38],[34,43],[44,47],[50,30],[56,47],[66,43],[80,38],[94,30],[50,63],[38,84],[62,84]],
      liens: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[3,9],[5,9],[9,10],[9,11]] },
    { nom: 'La Couronne', pts: [[12,76],[30,76],[50,76],[70,76],[88,76],[12,40],[30,60],[50,24],[70,60],[88,40],[50,48],[50,8]],
      liens: [[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[8,9],[9,4],[7,10],[7,11]] }
  ];

  // État de la semaine : séances de la famille depuis lundi
  function etatSemaine() {
    var d0 = debutSemaine(), me = moi();
    var membres = [{ id: me, nom: 'Toi', moi: true }].concat(liens().map(function (r) {
      return { id: r.member.id, nom: r.member.name || 'Membre' };
    }));
    var total = 0;
    membres.forEach(function (m) {
      m.n = seances(m.id).filter(function (t) { return t >= d0; }).length;
      total += m.n;
    });
    var cible = Math.max(6, Math.min(18, 3 * membres.length));
    var fig = FIGURES[idSemaine() % FIGURES.length];
    var allumees = Math.min(12, Math.floor(total / cible * 12));
    return { membres: membres, total: total, cible: cible, fig: fig, allumees: allumees, complete: total >= cible };
  }

  // Badge « ciel complet » : une seule fois par semaine
  function verifierCompletion(e) {
    if (!e.complete) return;
    var cle = 'awakFamSkyDone', fait = [];
    try { fait = JSON.parse(localStorage.getItem(cle) || '[]'); } catch (x) {}
    var w = idSemaine();
    if (fait.indexOf(w) >= 0) return;
    fait.push(w); try { localStorage.setItem(cle, JSON.stringify(fait.slice(-60))); } catch (x) {}
    try { if (window.AwakFamBadgeInc) AwakFamBadgeInc('cielsComplets', 1); } catch (x) {}
    try { if (window.showToast) showToast('Constellation complétée : ' + e.fig.nom + ' ! Bravo la famille', 'success', 4500); } catch (x) {}
  }

  function figureSVG(e, taille) {
    var f = e.fig, s = '';
    f.liens.forEach(function (l) {
      var a = f.pts[l[0]], b = f.pts[l[1]], on = l[0] < e.allumees && l[1] < e.allumees;
      s += '<line x1="' + a[0] + '" y1="' + a[1] + '" x2="' + b[0] + '" y2="' + b[1] + '" stroke="' + (on ? OR : '#475569') + '" '
        + 'stroke-width="' + (on ? 1.4 : 0.7) + '" ' + (on ? 'opacity="0.85"' : 'stroke-dasharray="2 3" opacity="0.5"') + '/>';
    });
    f.pts.forEach(function (p, i) {
      var on = i < e.allumees, der = on && i === e.allumees - 1;
      s += (on ? '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="5" fill="' + OR + '" opacity="0.18"/>' : '')
        + '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + (on ? 2.6 : 1.8) + '" fill="' + (on ? '#fde68a' : '#334155') + '"'
        + (on ? ' filter="url(#famSkyLueur)"' : '') + '>'
        + (der ? '<animate attributeName="r" values="2.6;4;2.6" dur="1.6s" repeatCount="indefinite"/>' : '')
        + '</circle>';
    });
    return '<svg viewBox="-6 -6 112 112" width="' + taille + '" height="' + taille + '" aria-hidden="true" style="display:block;flex-shrink:0;">'
      + '<defs><filter id="famSkyLueur" x="-200%" y="-200%" width="500%" height="500%"><feGaussianBlur stdDeviation="1.6" result="b"/>'
      + '<feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>' + s + '</svg>';
  }

  function carteSemaine() {
    var e = etatSemaine();
    verifierCompletion(e);
    var enf = enfant();
    var restant = Math.max(0, e.cible - e.total);
    var contrib = enf ? '' : e.membres.filter(function (m) { return m.n > 0; }).map(function (m) {
      return '<span style="display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:99px;'
        + 'background:rgba(251,191,36,0.10);border:1px solid rgba(251,191,36,0.3);font-size:0.62em;font-weight:800;color:#fde68a;">'
        + esc(m.nom) + ' · ' + m.n + '</span>';
    }).join(' ');
    return '<div style="background:linear-gradient(160deg,#14101f,#0b0b10);border:1px solid rgba(251,191,36,0.28);border-radius:18px;'
      + 'padding:14px;margin-bottom:12px;display:flex;gap:12px;align-items:center;">'
      + figureSVG(e, 108)
      + '<div style="flex:1;min-width:0;">'
      +   '<div style="font-size:0.56em;letter-spacing:2px;color:' + OR + ';font-weight:900;">CONSTELLATION DE LA SEMAINE</div>'
      +   '<div style="font-size:1.02em;font-weight:900;color:#fff;margin:2px 0 4px;">' + e.fig.nom + '</div>'
      +   '<div style="font-size:0.7em;color:#cbd5e1;line-height:1.4;">'
      +     (e.complete
              ? '<b style="color:' + OR + ';">Complétée !</b> Toute la famille a brillé cette semaine.'
              : 'Chaque séance de la famille allume une étoile. Encore <b style="color:' + OR + ';">' + restant + '</b> séance' + (restant > 1 ? 's' : '') + ' pour la compléter.')
      +   '</div>'
      +   '<div style="height:7px;background:rgba(255,255,255,0.07);border-radius:99px;overflow:hidden;margin:8px 0 6px;">'
      +     '<div style="height:100%;width:' + Math.min(100, Math.round(e.total / e.cible * 100)) + '%;background:linear-gradient(90deg,#f59e0b,' + OR + ');border-radius:99px;"></div></div>'
      +   '<div style="font-size:0.6em;color:#94a3b8;margin-bottom:' + (contrib ? '6px' : '0') + ';">' + e.allumees + ' / 12 étoiles · ' + e.total + ' / ' + e.cible + ' séances</div>'
      +   (contrib ? '<div style="display:flex;flex-wrap:wrap;gap:4px;">' + contrib + '</div>' : '')
      + '</div></div>';
  }

  // ── « Vient de bouger » ──
  function nouveautes() {
    var me = moi(); if (!me) return [];
    var cle = 'awakFamVu_' + me, vu = {};
    try { vu = JSON.parse(localStorage.getItem(cle) || '{}'); } catch (e) {}
    var out = [], maj = {};
    liens().forEach(function (r) {
      var id = r.member.id, ts = seances(id), dernier = ts.length ? Math.max.apply(null, ts) : 0;
      maj[id] = dernier;
      if (vu[id] === undefined) return;               // première visite : on mémorise sans annoncer
      if (dernier > vu[id] && Date.now() - dernier < 7 * 86400000) {
        out.push({ nom: r.member.name || 'Un membre', n: ts.filter(function (t) { return t > vu[id]; }).length });
      }
    });
    try { localStorage.setItem(cle, JSON.stringify(maj)); } catch (e) {}
    // L'onglet se redessine souvent (défis, compagnons…) : l'annonce est
    // MÉMORISÉE 30 min, sinon le rendu suivant l'effaçait aussitôt.
    var ak = 'awakFamAnnonce_' + me;
    try {
      if (out.length) localStorage.setItem(ak, JSON.stringify({ list: out, t: Date.now() }));
      else {
        var sv = JSON.parse(localStorage.getItem(ak) || 'null');
        if (sv && Date.now() - sv.t < 30 * 60000) out = sv.list || [];
      }
    } catch (e) {}
    return out;
  }
  window.AwakFamAnnonceVue = function (btn) {
    try { localStorage.removeItem('awakFamAnnonce_' + moi()); } catch (e) {}
    try { btn.parentNode.remove(); } catch (e) {}
  };
  function banniereNouveautes(list) {
    if (!list.length) return '';
    var txt = list.length === 1
      ? '<b>' + esc(list[0].nom) + '</b> vient d\'allumer ' + (list[0].n > 1 ? list[0].n + ' étoiles' : 'une étoile') + ' !'
      : list.map(function (x) { return '<b>' + esc(x.nom) + '</b>'; }).join(', ') + ' se sont entraînés !';
    return '<div class="awk-fam-nouveau" style="display:flex;align-items:center;gap:11px;padding:12px 14px;margin-bottom:12px;border-radius:15px;'
      + 'background:linear-gradient(135deg,rgba(251,191,36,0.16),rgba(236,72,153,0.10));border:1px solid rgba(251,191,36,0.45);">'
      + '<span style="flex-shrink:0;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;'
      +   'background:rgba(251,191,36,0.18);" class="awk-fam-pulse">' + ic('etoile', 20, OR) + '</span>'
      + '<span style="flex:1;min-width:0;font-size:0.8em;color:#fef3c7;line-height:1.4;">' + txt
      +   '<span style="display:block;font-size:0.84em;color:#cbd5e1;margin-top:1px;">Touche son étoile pour l\'encourager.</span></span>'
      + '<button onclick="AwakFamAnnonceVue(this)" aria-label="Fermer" style="flex-shrink:0;background:none;border:none;color:#94a3b8;cursor:pointer;padding:4px;min-height:auto;">'
      +   '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg></button>'
      + '</div>';
  }

  // ── Encouragements reçus : carte bien visible avec le message ──
  function carteEncouragements() {
    var list = [];
    try { list = (window.AwakFamily && AwakFamily.pendingNudges) ? AwakFamily.pendingNudges() : []; } catch (e) {}
    if (!list.length) return '';
    var d = list[list.length - 1];
    var av = (typeof window.renderAvatar === 'function') ? renderAvatar(d.fromAvatar, 40) : '';
    return '<div onclick="AwakFamilyNudgeOpenInbox()" style="cursor:pointer;display:flex;align-items:center;gap:12px;padding:13px 14px;margin-bottom:12px;'
      + 'border-radius:16px;background:linear-gradient(135deg,rgba(167,139,250,0.18),rgba(236,72,153,0.10));border:1px solid rgba(167,139,250,0.5);">'
      + '<span style="flex-shrink:0;">' + av + '</span>'
      + '<span style="flex:1;min-width:0;">'
      +   '<span style="display:flex;align-items:center;gap:5px;font-size:0.58em;letter-spacing:1.5px;color:' + VIOLET + ';font-weight:900;">'
      +     ic('message', 12, VIOLET) + (list.length > 1 ? list.length + ' MESSAGES POUR TOI' : 'MESSAGE POUR TOI') + '</span>'
      +   '<span style="display:block;font-size:0.86em;font-weight:800;color:#fff;margin-top:3px;line-height:1.35;">« ' + esc(d.msg) + ' »</span>'
      +   '<span style="display:block;font-size:0.66em;color:#c4b5fd;margin-top:2px;">— ' + esc(d.fromName) + '</span>'
      + '</span>'
      + '<span style="flex-shrink:0;color:' + VIOLET + ';">' + ic('coeur', 20, VIOLET) + '</span></div>';
  }

  // ── En cours : objectif, défi d'équipe, duels — sinon gros bouton ──
  function barre(p, c) {
    return '<div style="height:7px;background:rgba(255,255,255,0.07);border-radius:99px;overflow:hidden;margin-top:6px;">'
      + '<div style="height:100%;width:' + Math.max(0, Math.min(100, p || 0)) + '%;background:' + c + ';border-radius:99px;"></div></div>';
  }
  function ligne(icone, c, titre, detail, pct, action) {
    return '<div onclick="' + action + '" style="cursor:pointer;display:flex;align-items:center;gap:11px;padding:11px 12px;margin-bottom:8px;border-radius:14px;'
      + 'background:rgba(255,255,255,0.03);border:1px solid ' + c + '40;">'
      + '<span style="flex-shrink:0;width:38px;height:38px;border-radius:11px;display:flex;align-items:center;justify-content:center;background:' + c + '1c;border:1px solid ' + c + '45;">' + ic(icone, 19, c) + '</span>'
      + '<span style="flex:1;min-width:0;">'
      +   '<span style="display:block;font-size:0.8em;font-weight:800;color:#f1f5f9;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + titre + '</span>'
      +   '<span style="display:block;font-size:0.66em;color:#94a3b8;margin-top:1px;">' + detail + '</span>'
      +   (pct !== null ? barre(pct, c) : '')
      + '</span>'
      + '<span style="flex-shrink:0;color:' + c + ';font-size:1.1em;">›</span></div>';
  }
  function sectionEnCours() {
    var L = [];
    try {
      var g = window.AwakFamilyGoal && AwakFamilyGoal.status ? AwakFamilyGoal.status() : null;
      if (g && g.def) L.push(ligne('cible', ROSE, 'Objectif commun : ' + esc(g.def.label || 'en cours'), (g.total || 0) + ' / ' + (g.target || '?') + ' · ' + (g.pct || 0) + ' %', g.pct || 0, 'AwakFamilyGoalOpen()'));
    } catch (e) {}
    try {
      var c = window.AwakFamilyChallenge && AwakFamilyChallenge.coopStatus ? AwakFamilyChallenge.coopStatus() : null;
      if (c) L.push(ligne('groupe', BLEU, 'Défi d\'équipe : ' + esc((c.def && c.def.label) || 'en cours'), c.total + ' / ' + c.cible + ' · vous contre l\'objectif', c.pct || 0, 'AwakCoopOpen()'));
    } catch (e) {}
    try {
      var d = window.AwakFamilyChallenge && AwakFamilyChallenge.myChallenges ? (AwakFamilyChallenge.myChallenges() || []) : [];
      d.filter(function (x) { return x && !x.ended; }).slice(0, 2).forEach(function (x) {
        L.push(ligne('epee', VIOLET, 'Duel contre ' + esc((x.opponent && x.opponent.name) || 'un membre'),
          'Toi ' + x.myScore + ' – ' + x.oppScore + (x.daysLeft ? ' · ' + x.daysLeft + ' j restants' : ''), null, 'AwakFamilyChallengeOpen()'));
      });
    } catch (e) {}
    var titre = '<div style="font-size:0.56em;letter-spacing:2px;color:#94a3b8;font-weight:900;margin:2px 2px 8px;">EN COURS</div>';
    if (L.length) return titre + L.join('');
    return '<button onclick="AwakEnsembleOpen()" style="width:100%;display:flex;align-items:center;gap:13px;padding:16px;margin-bottom:12px;border-radius:16px;cursor:pointer;text-align:left;'
      + 'background:linear-gradient(135deg,rgba(236,72,153,0.20),rgba(167,139,250,0.14));border:1px solid rgba(236,72,153,0.5);">'
      + '<span style="flex-shrink:0;width:46px;height:46px;border-radius:13px;display:flex;align-items:center;justify-content:center;background:rgba(236,72,153,0.2);">' + ic('trophee', 24, '#f9a8d4') + '</span>'
      + '<span style="flex:1;min-width:0;"><span style="display:block;font-size:0.95em;font-weight:900;color:#fff;">Lancer un défi en famille</span>'
      + '<span style="display:block;font-size:0.7em;color:#f9a8d4;margin-top:2px;">Un objectif à atteindre ensemble, ou un duel amical</span></span>'
      + '<span style="flex-shrink:0;color:#f9a8d4;font-size:1.2em;">›</span></button>';
  }

  // ── Mon étoile : résumé de ma semaine ──
  window.AwakConstMoi = function () {
    try { if (window.AwakFamCloseAll) AwakFamCloseAll(); } catch (e) {}
    document.getElementById('awakConstMoi')?.remove();
    var e = etatSemaine(), me = e.membres[0];
    var d7 = Date.now() - 7 * 86400000, n7 = seances(moi()).filter(function (t) { return t >= d7; }).length;
    var ov = document.createElement('div');
    ov.id = 'awakConstMoi';
    ov.style.cssText = 'position:fixed;inset:0;z-index:11000;background:rgba(0,0,0,0.88);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:16px;';
    ov.onclick = function (x) { if (x.target === ov) ov.remove(); };
    ov.innerHTML = '<div style="width:100%;max-width:420px;background:linear-gradient(160deg,#16101f,#0b0b10);border:1.5px solid rgba(236,72,153,0.4);border-radius:22px;padding:20px;text-align:center;">'
      + '<div style="width:56px;height:56px;margin:0 auto 10px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:rgba(251,191,36,0.15);border:1px solid rgba(251,191,36,0.45);">' + ic('etoile', 28, OR) + '</div>'
      + '<div style="font-size:0.58em;letter-spacing:2px;color:' + ROSE + ';font-weight:900;">TON ÉTOILE</div>'
      + '<div style="font-size:1.15em;font-weight:900;color:#fff;margin:3px 0 12px;">' + (n7 ? n7 + ' séance' + (n7 > 1 ? 's' : '') + ' en 7 jours' : 'Pas encore de séance cette semaine') + '</div>'
      + '<div style="font-size:0.78em;color:#cbd5e1;line-height:1.5;margin-bottom:14px;">'
      +   (me.n ? 'Tu as allumé <b style="color:' + OR + ';">' + me.n + '</b> étoile' + (me.n > 1 ? 's' : '') + ' de ' + e.fig.nom + ' depuis lundi.' : 'Fais une séance : elle allumera une étoile de ' + e.fig.nom + ' pour toute la famille.')
      +   '<br><span style="color:#94a3b8;">Plus ton étoile brille, plus elle change de couleur : gris, bleu, vert, puis or.</span></div>'
      + '<button onclick="document.getElementById(\'awakConstMoi\').remove();AwakEnsembleOpen()" style="width:100%;padding:13px;border:none;border-radius:13px;cursor:pointer;background:linear-gradient(135deg,' + ROSE + ',#be185d);color:#fff;font-weight:900;font-size:0.88em;margin-bottom:8px;">Défis & objectifs</button>'
      + '<button onclick="document.getElementById(\'awakConstMoi\').remove()" style="width:100%;padding:11px;border-radius:13px;cursor:pointer;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.12);color:#94a3b8;font-size:0.75em;font-weight:800;letter-spacing:1px;">FERMER</button>'
      + '</div>';
    document.body.appendChild(ov);
  };

  function styles() {
    if (document.getElementById('awkFamSkyStyles')) return;
    var st = document.createElement('style');
    st.id = 'awkFamSkyStyles';
    st.textContent = '@keyframes awkFamPulse{0%,100%{box-shadow:0 0 0 0 rgba(251,191,36,0.45);}50%{box-shadow:0 0 0 8px rgba(251,191,36,0);}}'
      + '@keyframes awkFamEntree{from{opacity:0;transform:translateY(-6px);}to{opacity:1;transform:none;}}'
      + '.awk-fam-pulse{animation:awkFamPulse 1.8s ease-out infinite;}'
      + '.awk-fam-nouveau{animation:awkFamEntree .5s ease-out;}'
      + '@media(prefers-reduced-motion:reduce){.awk-fam-pulse,.awk-fam-nouveau{animation:none!important;}}';
    document.head.appendChild(st);
  }

  // Avant le ciel : nouveautés + encouragements ; après : semaine + en cours
  window.AwakFamilySky = {
    avant: function () { styles(); return banniereNouveautes(nouveautes()) + carteEncouragements(); },
    apres: function () { styles(); return carteSemaine() + sectionEnCours(); },
    etatSemaine: etatSemaine,
    seances: seances
  };
})();
