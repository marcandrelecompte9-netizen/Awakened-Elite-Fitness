/* ═══════════════════════════════════════════════════════════════════
   SÉANCE › PROGRAMME › SPORTS — nouvelle mise en page (v1260)
   ─────────────────────────────────────────────────────────────────────
   Avant : séances en « pilules » de tailles différentes qui s'enroulaient
   n'importe comment, séances verrouillées mélangées aux autres, et (yoga)
   quiz + arbre + générateur empilés dans la même carte.
   Maintenant, une seule grille et des listes alignées :
     1. Choix du sport : grille régulière de tuiles (4 par ligne).
     2. Carte du sport : en-tête + niveau, puis
        SÉANCES (liste uniforme : nom, durée, nombre d'exercices, ▶),
        À DÉBLOQUER (repliable, en sourdine),
        SUR MESURE (yoga : trouver ma séance / créer ma séance, repliable),
        PROGRESSION (une ligne vers l'arbre).
   Toute la logique reste dans app.js / disciplines.js : on ne fait que
   présenter (startDisciplineSession, openYogaQuiz, _renderYogaGenerator…).
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  function ic(n, t, c) { try { return window.AwakIcon ? AwakIcon.get(n, t || 16, c) : ''; } catch (e) { return ''; } }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  // Les noms de séances commencent souvent par un emoji (retiré à l'écran) : on l'enlève proprement.
  function propre(n) { return String(n || '').replace(/^[^A-Za-zÀ-ÿ0-9]+/, '').trim(); }
  function mico(d, t, c) { try { return typeof awakMentorIco === 'function' ? awakMentorIco({ nickname: d.name, color: c || d.color }, t) : ''; } catch (e) { return ''; } }
  function niveau(id) {
    try { return typeof getDisciplineLevel === 'function' ? getDisciplineLevel(id) : null; } catch (e) { return null; }
  }
  var _ouvert = {};   // sections repliables : { 'yoga:lock': true, 'yoga:gen': true }
  function basculer(cle) { _ouvert[cle] = !_ouvert[cle]; if (typeof window.renderProgramTab === 'function') window.renderProgramTab(); }

  function minutes(s) {
    var L = s.exercises || [], t = 0;
    L.forEach(function (e) { t += (parseInt(e.duration, 10) || 30) * (parseInt(e.sets, 10) || 1); });
    t += (s.rest != null ? s.rest : 20) * Math.max(0, L.length - 1);
    return Math.max(1, Math.round(t / 60));
  }

  function tuiles(list, selId) {
    return '<div style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;">'
      + list.map(function (d) {
          var on = d.id === selId;
          return '<button onclick="selectDisciplineCard(\'' + d.id + '\')" style="min-width:0;display:flex;flex-direction:column;align-items:center;gap:5px;padding:10px 4px 9px;border-radius:13px;cursor:pointer;font-family:inherit;'
            + (on ? 'background:' + d.color + '24;border:1.5px solid ' + d.color + ';' : 'background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);') + '">'
            + '<span style="width:30px;height:30px;border-radius:9px;display:flex;align-items:center;justify-content:center;background:' + d.color + (on ? '33' : '1a') + ';">' + mico(d, 17) + '</span>'
            + '<span style="font-size:0.64em;font-weight:800;color:' + (on ? '#fff' : '#cbd5e1') + ';line-height:1.2;text-align:center;max-width:100%;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;">' + esc(d.name) + '</span>'
            + '</button>';
        }).join('') + '</div>';
  }

  function titre(t, c, extra) {
    return '<div style="display:flex;align-items:center;justify-content:space-between;margin:16px 0 7px;">'
      + '<span style="font-size:0.58em;font-weight:900;letter-spacing:1.6px;color:' + (c || '#64748b') + ';">' + t + '</span>' + (extra || '') + '</div>';
  }
  function ligne(opts) {
    // opts : { onclick, ico, couleur, nom, meta, droite, sourdine }
    var c = opts.couleur || '#60a8f0';
    return '<button ' + (opts.onclick ? 'onclick="' + opts.onclick + '"' : 'disabled') + ' style="display:flex;align-items:center;gap:11px;width:100%;text-align:left;padding:10px 12px;margin-bottom:6px;border-radius:12px;font-family:inherit;'
      + (opts.onclick ? 'cursor:pointer;' : 'cursor:default;')
      + (opts.sourdine ? 'background:rgba(255,255,255,0.02);border:1px dashed rgba(255,255,255,0.1);opacity:0.75;' : 'background:rgba(255,255,255,0.035);border:1px solid rgba(255,255,255,0.08);') + '">'
      + '<span style="flex-shrink:0;width:32px;height:32px;border-radius:10px;display:flex;align-items:center;justify-content:center;background:' + (opts.sourdine ? 'rgba(255,255,255,0.05)' : c + '1f') + ';">' + ic(opts.ico || 'eclair', 15, opts.sourdine ? '#64748b' : c) + '</span>'
      + '<span style="flex:1;min-width:0;">'
      +   '<span style="display:block;font-size:0.84em;font-weight:800;color:' + (opts.sourdine ? '#94a3b8' : '#f1f5f9') + ';white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + esc(opts.nom) + '</span>'
      +   (opts.meta ? '<span style="display:block;font-size:0.64em;color:#64748b;margin-top:2px;">' + esc(opts.meta) + '</span>' : '')
      + '</span>'
      + (opts.droite || '') + '</button>';
  }
  function jouer(c) {
    return '<span style="flex-shrink:0;width:30px;height:30px;border-radius:99px;display:flex;align-items:center;justify-content:center;background:' + c + ';">'
      + '<svg width="11" height="11" viewBox="0 0 24 24" fill="#fff" aria-hidden="true"><path d="M7 4v16l13-8z"/></svg></span>';
  }
  function chevron(c, ouvert) {
    return '<span style="flex-shrink:0;color:' + c + ';font-size:1.1em;display:inline-block;transform:rotate(' + (ouvert ? '90' : '0') + 'deg);transition:transform .2s;">›</span>';
  }

  function arbre(d) {
    try {
      var P = typeof _progListFor === 'function' ? _progListFor(d.id) : [];
      if (!P || !P.length) return '';
      var prog = typeof awakGetProgress === 'function' ? awakGetProgress() : {};
      var tot = 0, fait = 0, maitrise = 0;
      P.forEach(function (p) { var n = prog[_progKey(d.id, p.skill)] || 0; if (n >= p.steps.length) maitrise++; tot += p.steps.length; fait += Math.min(n, p.steps.length); });
      var pct = tot ? Math.round(fait / tot * 100) : 0;
      return titre('PROGRESSION', d.color)
        + ligne({ onclick: "openProgressionTree('" + d.id + "')", ico: 'arbre', couleur: d.color, nom: 'Mon arbre de progression',
            meta: P.length + ' parcours · ' + maitrise + ' maîtrisé' + (maitrise > 1 ? 's' : '') + ' · ' + pct + ' %', droite: chevron(d.color) });
    } catch (e) { return ''; }
  }

  function carte(d) {
    var sessions = (typeof listDisciplineSessions === 'function' ? listDisciplineSessions(d.id) : []).slice();
    var lv = niveau(d.id) || { level: 1, xp: 0, xpInLevel: 0, xpForLevel: 300, sessions: 0 };
    var pct = Math.round(lv.xpInLevel / (lv.xpForLevel || 300) * 100);
    var c = d.color;
    var dispo = sessions.filter(function (s) { return lv.level >= (s.minLevel || 1); });
    var verrou = sessions.filter(function (s) { return lv.level < (s.minLevel || 1); })
      .sort(function (a, b) { return (a.minLevel || 1) - (b.minLevel || 1); });
    dispo.sort(function (a, b) { if (!!a.goal !== !!b.goal) return a.goal ? -1 : 1; return (a.minLevel || 1) - (b.minLevel || 1); });

    var h = '<div style="display:flex;align-items:center;gap:12px;">'
      + '<span style="flex-shrink:0;width:46px;height:46px;border-radius:14px;display:flex;align-items:center;justify-content:center;background:' + c + '1f;border:1px solid ' + c + '55;">' + mico(d, 24) + '</span>'
      + '<span style="flex:1;min-width:0;">'
      +   '<span style="display:block;font-weight:900;color:#fff;font-size:1.06em;">' + esc(d.name) + '</span>'
      +   (d.voie ? '<span style="display:block;font-size:0.68em;color:' + c + ';font-weight:800;margin-top:1px;">' + esc(d.voie) + '</span>' : '')
      + '</span>'
      + '<span style="flex-shrink:0;text-align:right;"><span style="display:block;font-size:0.56em;color:#64748b;font-weight:800;letter-spacing:1px;">NIVEAU</span><span style="display:block;font-size:1.25em;font-weight:900;color:' + c + ';line-height:1;">' + lv.level + '</span></span>'
      + '</div>'
      + '<div style="height:4px;background:rgba(255,255,255,0.07);border-radius:99px;overflow:hidden;margin:11px 0 6px;"><div style="height:100%;width:' + pct + '%;background:' + c + ';border-radius:99px;"></div></div>'
      + '<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;">'
      +   '<span style="font-size:0.72em;color:#94a3b8;line-height:1.4;">' + esc(d.tagline || '') + '</span>'
      +   '<button onclick="showDisciplineGuide(\'' + d.id + '\')" style="flex-shrink:0;background:none;border:none;color:' + c + ';font-size:0.68em;font-weight:800;cursor:pointer;padding:0;display:flex;align-items:center;gap:4px;">' + ic('info', 13, c) + 'Comment ça marche</button>'
      + '</div>';

    if (!sessions.length) {
      h += '<div style="margin-top:14px;font-size:0.74em;color:#94a3b8;">Séances bientôt disponibles.</div>';
    } else {
      h += titre('SÉANCES', c, '<span style="font-size:0.6em;color:#64748b;">' + dispo.length + ' disponible' + (dispo.length > 1 ? 's' : '') + '</span>');
      h += dispo.map(function (s) {
        var n = (s.exercises || []).length;
        return ligne({ onclick: "startDisciplineSession('" + d.id + "','" + s.id + "')", ico: s.goal ? 'cible' : 'eclair', couleur: c,
          nom: propre(s.name), meta: '~' + minutes(s) + ' min · ' + n + ' exercice' + (n > 1 ? 's' : '') + (s.level ? ' · ' + s.level : ''), droite: jouer(c) });
      }).join('');
      if (verrou.length) {
        var cleL = d.id + ':lock', ouvL = !!_ouvert[cleL];
        h += '<button onclick="AwakSports.basculer(\'' + cleL + '\')" style="display:flex;align-items:center;justify-content:space-between;width:100%;margin:10px 0 6px;padding:8px 2px;background:none;border:none;cursor:pointer;font-family:inherit;">'
          + '<span style="display:flex;align-items:center;gap:6px;font-size:0.6em;font-weight:900;letter-spacing:1.6px;color:#64748b;">' + ic('porte', 12, '#64748b') + 'À DÉBLOQUER (' + verrou.length + ')</span>' + chevron('#64748b', ouvL) + '</button>';
        if (ouvL) h += verrou.map(function (s) {
          var need = s.minLevel || 1, reste = Math.max(1, Math.ceil(((need - 1) * 300 - (lv.xp || 0)) / 100));
          return ligne({ ico: 'porte', nom: propre(s.name), meta: 'Niveau ' + need + ' · encore ~' + reste + ' séance' + (reste > 1 ? 's' : ''), sourdine: true });
        }).join('');
      }
    }

    // Yoga : séance sur mesure (quiz + générateur replié)
    if (d.id === 'yoga') {
      var cleG = 'yoga:gen', ouvG = !!_ouvert[cleG];
      h += titre('SUR MESURE', c)
        + ligne({ onclick: 'openYogaQuiz()', ico: 'boussole', couleur: c, nom: 'Trouver ma séance idéale', meta: '3 questions, une séance pour toi', droite: chevron(c) })
        + ligne({ onclick: "AwakSports.basculer('" + cleG + "')", ico: 'crayon', couleur: c, nom: 'Créer ma séance', meta: 'Durée, objectif et intensité au choix', droite: chevron(c, ouvG) })
        + (ouvG && typeof _renderYogaGenerator === 'function' ? '<div style="margin:2px 0 6px;">' + _renderYogaGenerator() + '</div>' : '');
    }
    h += arbre(d);
    return '<div class="card" style="padding:16px;background:linear-gradient(160deg,' + c + '14,rgba(255,255,255,0.015) 55%) !important;border:1px solid ' + c + '3a;">' + h + '</div>';
  }

  function rendre() {
    var list = (typeof listDisciplinesByRole === 'function')
      ? listDisciplinesByRole('principal').filter(function (d) { return d.id !== 'muscu'; }) : [];
    var selId = null;
    try { selId = localStorage.getItem('awakSelectedDiscipline'); } catch (e) {}
    if (!list.some(function (d) { return d.id === selId; })) selId = list[0] ? list[0].id : null;
    var d = list.filter(function (x) { return x.id === selId; })[0];
    return '<div style="display:grid;gap:12px;">'
      + '<div style="font-size:0.58em;color:#64748b;font-weight:900;letter-spacing:2px;">CHOISIS TON SPORT</div>'
      + tuiles(list, selId)
      + (d ? carte(d) : '<p style="text-align:center;color:#94a3b8;padding:20px;">Aucun sport disponible.</p>')
      + (typeof _renderMyVoies === 'function' ? _renderMyVoies() : '')
      + '</div>';
  }

  window.AwakSports = { rendre: rendre, basculer: basculer };
})();
