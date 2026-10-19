/* ═══════════════════════════════════════════════════════════════════════
   ♿  LIMITATIONS PHYSIQUES — Awakened
   -----------------------------------------------------------------------
   Permet à chaque membre de déclarer ce que son corps ne peut pas faire :
   épaule qui interdit de lever les bras, genou, dos, impossibilité de
   descendre au sol, pas de saut… Les exercices concernés disparaissent
   alors des séances générées, des suggestions et du catalogue.

   PRINCIPES
   • PAR PROFIL : la grand-mère et l'ado n'ont pas les mêmes contraintes.
   • JAMAIS SILENCIEUX : l'app dit combien d'exercices ont été écartés.
   • FILET DE SÉCURITÉ : si un filtre vide complètement le catalogue, il
     est ignoré plutôt que de produire une séance vide. Mieux vaut une
     séance imparfaite qu'aucune séance — l'utilisateur est prévenu.

   ⚠️ CE N'EST PAS UN AVIS MÉDICAL. L'app écarte des mouvements sur
      déclaration de la personne ; elle ne diagnostique rien.

   Les motifs (`test`) s'appuient sur les NOMS RÉELS de la base
   (js/exercises.js) et sur les champs `position` et `muscle`.
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var CLE = 'awakLimitations';

  function norm(s) {
    return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  // ── Catalogue des limitations ──
  // test(ex) → true si l'exercice doit être ÉCARTÉ.
  var LIMITATIONS = [
    {
      id: 'overhead',
      emoji: '🙆',
      titre: 'Pas de charge au-dessus de la tête',
      detail: 'Écarte les développés épaules, arrachés, thrusters et tout mouvement qui pousse une charge au-dessus des épaules.',
      test: function (ex) {
        var n = norm(ex.name);
        // Inclut les formulations FRANÇAISES simples : les exercices créés par
        // l'utilisateur ne suivent pas la nomenclature du catalogue officiel.
        // v1408 : + nuque, shoulder press, push press, clean & press, devil press, wall ball,
        // slams, tirage nuque, pullover, pompes pique, marche au mur (15 exercices passaient).
        if (/^etirement/.test(n)) return false;   // étirements sans charge (trapèzes nuque…)
        return /(militaire|overhead|thruster|snatch|arrach|epaule[- ]?jete|jerk|handstand|pike push|pompes? pique|marche au mur|wall walk|au[- ]?dessus de la tete|au[- ]?dessus tete|bras tendus en haut)/.test(n)
            || /(developpe|presse|press|shoulder press)/.test(n) && /(epaule|militaire|arnold|shoulder)/.test(n)
            || /(nuque|push press|clean (and|&) press|devil press|wall ball|slam|pullover|halo)/.test(n)
            || /^(developpe arnold|halo kb)$/.test(n);
      }
    },
    {
      id: 'epaule',
      emoji: '💠',
      titre: 'Épaule fragile',
      detail: 'Écarte tout ce qui sollicite fortement l\'épaule : développés, élévations, tractions, dips.',
      test: function (ex) {
        var n = norm(ex.name);
        if (ex.muscle === 'Épaules') return true;
        return /(traction|dips|pompes|developpe couche|pull[- ]?up|muscle[- ]?up|suspendu)/.test(n)
            || ex.position === 'suspendu';
      }
    },
    {
      id: 'genou',
      emoji: '🦵',
      titre: 'Genou fragile',
      detail: 'Écarte squats, fentes, sauts et presses à cuisses — tout ce qui plie le genou sous charge.',
      test: function (ex) {
        var n = norm(ex.name);
        return /(squat|fente|lunge|presse a cuisse|leg press|step[- ]?up|jump|saut|burpee|pistol|box)/.test(n);
      }
    },
    {
      id: 'dos',
      emoji: '🩹',
      titre: 'Dos fragile',
      detail: 'Écarte soulevés de terre, good mornings, rowings penchés et hyperextensions.',
      test: function (ex) {
        var n = norm(ex.name);
        // ⚠️ « epaule » nu attrapait tous les exercices d'ÉPAULES : on ne vise
        //    que l'épaulé-jeté (clean), via « clean » et « epaule jete ».
        return /(souleve de terre|deadlift|good morning|hyperextension|rowing penche|bent over|clean|epaule[- ]?jete)/.test(n)
            || (ex.muscle === 'Lombaires');
      }
    },
    {
      // v1408 : « se pencher » n'existait pas (Dos fragile en ratait 27 : rowings un bras,
      // swings, burpees, salutation au soleil, chien tête en bas, pinces, étirement ischio debout…)
      id: 'penche',
      emoji: '🙇',
      titre: 'Ne peut pas se pencher',
      detail: 'Écarte les flexions du tronc vers l\'avant : rowings penchés et à un bras, soulevés de terre, swings, burpees, salutation au soleil, pinces, étirements des ischios debout.',
      test: function (ex) {
        var n = norm(ex.name);
        return /(pench|bent[- ]?over|good morning|souleve|deadlift|rdl|rack pull|swing|burpee|orteils|toe touch|inchworm|chenille|wood ?chop|bucheron|windmill|high pull|salutation au soleil|chien tete en bas|downward dog|\bpince\b|forward fold|flexion avant|jefferson|ischio debout|ischios? debout|renegade)/.test(n)
            || /rowing.*(un bras|haltere|kb|sac a dos|t-bar)/.test(n);
      }
    },
    {
      id: 'impact',
      emoji: '🚫',
      titre: 'Pas d\'impact / de saut',
      detail: 'Écarte sauts, course, corde à sauter, burpees et pliométrie. Utile pour les articulations sensibles.',
      test: function (ex) {
        var n = norm(ex.name);
        // ⚠️ « run » nu matchait « cRUNch » : on borne les mots courts.
        return /(saut|jump|burpee|corde a sauter|course|sprint|plyo|mountain climber|jumping|skater|\bbox\b|\brun\b|high knees|talons[- ]fesses|butt kick|skipping|bondiss|bounding|marelle|explosi|\bhops?\b)/.test(n);   // v1302 : high knees = course sur place
      }
    },
    {
      id: 'sol',
      emoji: '🧍',
      titre: 'Ne peut pas descendre au sol',
      detail: 'Ne garde que les exercices debout ou assis. Écarte tout ce qui se fait allongé, à quatre pattes ou en planche.',
      test: function (ex) {
        return ex.position === 'allongé' || ex.position === 'quadrupédie' || ex.position === 'planche';
      }
    },
    {
      id: 'prehension',
      emoji: '✋',
      titre: 'Préhension limitée',
      detail: 'Écarte ce qui demande de tenir fermement une barre ou de se suspendre (arthrite, main blessée).',
      test: function (ex) {
        var n = norm(ex.name);
        return ex.position === 'suspendu'
            || /(traction|pull[- ]?up|suspendu|hang|farmer|deadlift|souleve de terre)/.test(n);
      }
    },
    {
      id: 'poignet',
      emoji: '🤲',
      titre: 'Poignet fragile',
      detail: 'Écarte les appuis sur les mains : pompes, planche, dips, quadrupédie.',
      test: function (ex) {
        var n = norm(ex.name);
        return /(pompe|push[- ]?up|planche|plank|dips|burpee|handstand)/.test(n)
            || ex.position === 'quadrupédie' || ex.position === 'planche';
      }
    },
    {
      id: 'assis',
      emoji: '♿',
      titre: 'Position assise uniquement',
      detail: 'Ne garde que les exercices réalisables assis. Filtre très restrictif : à utiliser seul.',
      test: function (ex) {
        if (ex.position === 'assis') return false;
        // v1408 : exercices qui se font très bien ASSIS sur une chaise, même s'ils sont
        // classés « debout » (curls, élévations, élastiques…). Avant : à la maison, il ne
        // restait qu'1 exercice et les séances n'en contenaient qu'un seul.
        var n = norm(ex.name);
        if (/(debout|marche|walk|course|saut|squat|fente|pompe|planche|traction|souleve|swing|burpee|step|jump|kickback fessier|fessiers?.*elastique|quadrup)/.test(n)) return true;
        return !/(\bcurl|elevations? (laterales|frontales|des bras)|pull[- ]?apart|ecartes?.*elastique|elastique|band |tirage.*(elastique|serviette)|rotations? (externe|interne)|serrage|omoplates|extension (de )?(la )?jambe|leg extension|mollets assis|seated|assise?\b|\(assis\)|poignet|wrist|shrug|haussement|face pull|torsion|rotation du buste|respiration|cou\b|nuque)/.test(n);
      }
    }
  ];

  function cle() {
    try {
      var id = (typeof getCurrentProfileId === 'function') ? getCurrentProfileId() : null;
      return id ? CLE + '_' + id : CLE;
    } catch (e) { return CLE; }
  }

  function get() {
    try {
      var v = JSON.parse(localStorage.getItem(cle()) || '[]');
      return Array.isArray(v) ? v : [];
    } catch (e) { return []; }
  }

  function set(ids) {
    try { localStorage.setItem(cle(), JSON.stringify(ids || [])); } catch (e) {}
    // v1408 : date de début de chaque limitation (« depuis »), et date de dernière revue
    try {
      var d = dates(); var auj = new Date().toISOString().slice(0, 10);
      (ids || []).forEach(function (id) { if (!d[id]) d[id] = auj; });
      Object.keys(d).forEach(function (id) { if ((ids || []).indexOf(id) < 0) delete d[id]; });
      localStorage.setItem(cle() + '_dates', JSON.stringify(d));
      localStorage.setItem(cle() + '_revue', String(Date.now()));
    } catch (e) {}
  }
  function dates() { try { return JSON.parse(localStorage.getItem(cle() + '_dates') || '{}') || {}; } catch (e) { return {}; } }
  // v1408 : mode « garder mes capacités » (condition qui évolue) : pas de charge plus lourde suggérée
  function maintien() { try { return localStorage.getItem(cle() + '_maintien') === '1'; } catch (e) { return false; } }
  function setMaintien(v) { try { localStorage.setItem(cle() + '_maintien', v ? '1' : '0'); } catch (e) {} }
  function moisFr(iso) {
    try { var M = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']; var d = new Date(iso + 'T12:00:00'); return M[d.getMonth()] + ' ' + d.getFullYear(); } catch (e) { return ''; }
  }

  function actives() {
    var ids = get();
    return LIMITATIONS.filter(function (l) { return ids.indexOf(l.id) >= 0; });
  }

  // Un exercice est-il écarté ? (et par quelle limitation)
  function bloque(ex) {
    if (!ex || !ex.name) return null;
    var act = actives();
    for (var i = 0; i < act.length; i++) {
      try { if (act[i].test(ex)) return act[i]; } catch (e) {}
    }
    return null;
  }

  // Filtre une liste. Retourne { gardes, ecartes, ignore }
  // `ignore` = true si le filtre a été abandonné pour ne pas tout vider.
  function filtrer(liste, minimum) {
    var mini = minimum || 4;
    if (!Array.isArray(liste) || !actives().length) {
      return { gardes: liste || [], ecartes: [], ignore: false };
    }
    var gardes = [], ecartes = [];
    liste.forEach(function (ex) {
      if (bloque(ex)) ecartes.push(ex); else gardes.push(ex);
    });
    // 🛟 Filet : ne jamais rendre une séance impossible.
    var reels = gardes.filter(function (e) { return e && !e.isRest && !e.isInfo; });
    // v1408 : on n'ignore JAMAIS une limitation (avant : moins de « mini » exercices
    // permis → on rendait la liste complète, interdits compris). La séance sera
    // plus courte ; « manque » permet de le dire.
    return { gardes: gardes, ecartes: ecartes, ignore: false, manque: reels.length < mini ? reels.length : 0 };
  }

  // ── Interface de réglage ──
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function ouvrir() {
    var ids = get();
    var old = document.getElementById('awakLimitModal');
    if (old) old.remove();

    var ICO = { overhead: 'halter', epaule: 'bouclier', genou: 'course', dos: 'sante', penche: 'personne', impact: 'eclair', sol: 'repos', prehension: 'lien', poignet: 'bouclier', assis: 'personne' };
    var ic = function (n, c) { return window.AwakIcon ? window.AwakIcon.get(n, 20, c || '#67e8f9') : ''; };
    var D = dates();
    var lignes = LIMITATIONS.map(function (l) {
      var on = ids.indexOf(l.id) >= 0;
      return '<div onclick="AwakLimitations.toggle(\'' + l.id + '\')" ' +
          'style="cursor:pointer;display:flex;align-items:flex-start;gap:11px;padding:12px 13px;margin-bottom:8px;' +
          'background:' + (on ? 'rgba(34,211,238,0.10)' : 'rgba(255,255,255,0.025)') + ';' +
          'border:1.5px solid ' + (on ? 'rgba(34,211,238,0.45)' : 'rgba(255,255,255,0.07)') + ';border-radius:13px;">' +
          '<span style="flex-shrink:0;line-height:1;margin-top:1px;">' + ic(ICO[l.id] || 'sante', on ? '#22d3ee' : '#94a3b8') + '</span>' +
          '<div style="flex:1;min-width:0;">' +
            '<div style="font-size:0.84em;font-weight:800;color:#e8f0f8;margin-bottom:3px;">' + esc(l.titre) +
              (on && D[l.id] ? ' <span style="font-size:0.82em;font-weight:700;color:#67e8f9;">· depuis ' + esc(moisFr(D[l.id])) + '</span>' : '') + '</div>' +
            '<div style="font-size:0.7em;color:#94a3b8;line-height:1.45;">' + esc(l.detail) + '</div>' +
          '</div>' +
          '<span style="flex-shrink:0;width:22px;height:22px;border-radius:50%;display:inline-flex;' +
            'align-items:center;justify-content:center;font-size:0.7em;font-weight:900;' +
            (on ? 'background:#22d3ee;color:#04121f;">' + (window.AwakIcon ? window.AwakIcon.get('valide', 13, '#04121f') : '') : 'border:1.5px dashed rgba(148,163,184,0.5);color:#64748b;">+') +
          '</span>' +
        '</div>';
    }).join('');

    var modal = document.createElement('div');
    modal.id = 'awakLimitModal';
    modal.style.cssText = 'position:fixed;inset:0;z-index:10200;background:rgba(0,0,0,0.94);' +
      'backdrop-filter:blur(10px);display:flex;align-items:center;justify-content:center;padding:18px 14px;';
    modal.addEventListener('click', function (e) { if (e.target === modal) modal.remove(); });

    modal.innerHTML =
      '<div style="width:100%;max-width:520px;background:#0F1014;border-radius:18px;max-height:86vh;' +
        'display:flex;flex-direction:column;border:1px solid rgba(34,211,238,0.3);' +
        'border-top:2px solid #22d3ee;box-shadow:0 24px 60px rgba(0,0,0,0.7);overflow:hidden;">' +
        '<div style="padding:15px 18px 12px;flex-shrink:0;border-bottom:1px solid rgba(255,255,255,0.07);' +
          'display:flex;align-items:center;gap:11px;">' +
          '<span style="flex-shrink:0;">' + ic('sante', '#22d3ee') + '</span>' +
          '<div style="min-width:0;flex:1;">' +
            '<div style="font-size:0.56em;letter-spacing:2px;color:#22d3ee;font-weight:900;">ADAPTATION</div>' +
            '<div style="font-size:1em;font-weight:900;color:#fff;">Mes limitations</div>' +
          '</div>' +
          '<button onclick="document.getElementById(\'awakLimitModal\').remove()" ' +
            'style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.14);color:#94a3b8;' +
            'border-radius:10px;width:34px;height:34px;min-height:auto;font-size:1.1em;font-weight:800;' +
            'cursor:pointer;flex-shrink:0;line-height:1;">×</button>' +
        '</div>' +
        '<div style="flex:1;overflow-y:auto;padding:15px 18px 20px;-webkit-overflow-scrolling:touch;">' +
          '<div style="font-size:0.76em;color:#94a3b8;line-height:1.5;margin-bottom:14px;">' +
            'Indique ce que ton corps ne peut pas faire. Les exercices concernés ne te seront plus proposés, ' +
            'ni dans les séances générées ni dans les suggestions.' +
          '</div>' +
          '<div id="awakLimitList">' + lignes + '</div>' +
          // v1408 : mode « garder mes capacités » — pour une condition qui évolue
          '<div onclick="AwakLimitations.basculerMaintien()" style="cursor:pointer;display:flex;align-items:flex-start;gap:11px;padding:12px 13px;margin:6px 0 8px;' +
            'background:' + (maintien() ? 'rgba(167,139,250,0.12)' : 'rgba(255,255,255,0.025)') + ';border:1.5px solid ' + (maintien() ? 'rgba(167,139,250,0.5)' : 'rgba(255,255,255,0.07)') + ';border-radius:13px;">' +
            '<span style="flex-shrink:0;margin-top:1px;">' + ic('coeur', maintien() ? '#c4b5fd' : '#94a3b8') + '</span>' +
            '<div style="flex:1;min-width:0;"><div style="font-size:0.84em;font-weight:800;color:#e8f0f8;margin-bottom:3px;">Garder mes capacités</div>' +
            '<div style="font-size:0.7em;color:#94a3b8;line-height:1.45;">Pour une condition qui évolue : l\'app ne propose plus de charge plus lourde. Tenir sa charge, c\'est réussir.</div></div>' +
            '<span style="flex-shrink:0;width:22px;height:22px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:0.7em;font-weight:900;' +
              (maintien() ? 'background:#a78bfa;color:#04121f;">' + (window.AwakIcon ? window.AwakIcon.get('valide', 13, '#04121f') : '') : 'border:1.5px dashed rgba(148,163,184,0.5);color:#64748b;">+') + '</span>' +
          '</div>' +
          '<div id="awakLimitImpact" style="margin-top:6px;"></div>' +
          '<div style="margin-top:14px;background:rgba(251,191,36,0.08);border:1px solid rgba(251,191,36,0.25);' +
            'border-radius:11px;padding:10px 12px;font-size:0.72em;color:#fcd34d;line-height:1.5;">' +
            (window.AwakIcon ? window.AwakIcon.get('alerte', 13, '#fcd34d') + ' ' : '') +
            'Ces réglages ne remplacent pas un avis médical. En cas de blessure ou de douleur, ' +
            'demande l\'avis d\'un professionnel de santé.' +
          '</div>' +
        '</div>' +
      '</div>';

    document.body.appendChild(modal);
    majImpact();
    majResume();
  }

  // Combien d'exercices restent réellement disponibles ?
  function majImpact() {
    var hote = document.getElementById('awakLimitImpact');
    if (!hote) return;
    var db = [];
    try { if (typeof exerciseDatabase !== 'undefined') db = exerciseDatabase; } catch (e) {}
    if (!db.length) { hote.innerHTML = ''; return; }

    var reels = db.filter(function (e) { return e && e.type !== 'warmup' && e.type !== 'stretch'; });
    var restants = reels.filter(function (e) { return !bloque(e); }).length;
    var ecartes = reels.length - restants;
    if (!ecartes) { hote.innerHTML = ''; return; }

    var critique = restants < 30;
    hote.innerHTML =
      '<div style="background:' + (critique ? 'rgba(239,68,68,0.10)' : 'rgba(34,211,238,0.07)') + ';' +
        'border:1px solid ' + (critique ? 'rgba(239,68,68,0.35)' : 'rgba(34,211,238,0.25)') + ';' +
        'border-radius:11px;padding:10px 12px;font-size:0.75em;line-height:1.5;' +
        'color:' + (critique ? '#fca5a5' : '#94a3b8') + ';">' +
        ecartes + ' exercice' + (ecartes > 1 ? 's' : '') + ' écarté' + (ecartes > 1 ? 's' : '') +
        ' · <strong style="color:#e8f0f8;">' + restants + ' restant' + (restants > 1 ? 's' : '') + '</strong>' +
        (critique ? '<br>Le choix devient très restreint : les séances risquent d\'être courtes et répétitives.' : '') +
      '</div>';
  }

  // Met à jour le résumé affiché dans le formulaire de création de profil
  // (et partout où un élément #profileLimitResume existe).
  function majResume() {
    var el = document.getElementById('profileLimitResume');
    if (!el) return;
    var act = actives();
    if (!act.length) {
      el.innerHTML = 'Épaule, genou, dos, impossibilité de descendre au sol… Touche pour adapter tes séances.';
      el.style.color = '#94a3b8';
      return;
    }
    el.innerHTML = '<strong style="color:#67e8f9;">' + act.length + ' limitation' + (act.length > 1 ? 's' : '') +
      '</strong> : ' + act.map(function (l) { return esc(l.titre); }).join(' · ');
    el.style.color = '#cbd5e1';
  }

  // ♿ Proposition automatique après création d'un profil.
  // Le marqueur est posé à la création (app.js) ; switchProfile recharge la
  // page, donc c'est ici, au démarrage suivant, qu'on pose la question.
  function proposerSiNouveau() {
    try {
      var id = (typeof getCurrentProfileId === 'function') ? getCurrentProfileId() : null;
      if (!id) return;
      var k = 'profile_' + id + '_awakLimitAsk';
      if (localStorage.getItem(k) !== '1') return;
      localStorage.removeItem(k);          // une seule fois
      // On laisse l'app finir de démarrer, et on n'écrase aucune autre fenêtre.
      // v1233 : on attend que la fenêtre soit VRAIMENT libre (inscription
      // terminée, histoire/tutoriel fermés). Les overlays fixes ont un
      // offsetParent nul : on teste leur rectangle à l'écran.
      var essais = 0;
      var tenter = function () {
        try {
          var occupe = false;
          try { var up = (typeof getUserProfile === 'function') ? getUserProfile() : null; if (up && !up.setupComplete) occupe = true; } catch (e) {}
          // v1234 : jamais pour un enfant (< 13 ans) — c'est à l'adulte de le
          // régler au besoin (Réglages › Mes limitations), pas une question à
          // poser à un enfant à la fin de son inscription.
          // v1235 : l'offre du Parcours de l'Éveil passe avant
          try { if (window._cleProfil && localStorage.getItem(window._cleProfil('awakEveilPlusTard')) === '1') occupe = true; } catch (e) {}
          if (!occupe) { try { if (window.AwakYouth && AwakYouth.isChild && AwakYouth.isChild()) return; } catch (e) {} }
          var cand = document.querySelectorAll('[id$="Modal"], [id$="Overlay"], [id*="Onb"], [id*="onb"], [id*="story"], [id*="Story"], [id*="tuto"], [id*="Tuto"], [id*="Welcome"]');
          for (var j = 0; j < cand.length && !occupe; j++) {
            var c = cand[j], cs = getComputedStyle(c), r = c.getBoundingClientRect();
            if (cs.display !== 'none' && cs.visibility !== 'hidden' && +cs.opacity > 0 && r.width > 100 && r.height > 100) occupe = true;
          }
          if (occupe) { if (++essais < 40) setTimeout(tenter, 3000); return; }
          ouvrir();
        } catch (e) {}
      };
      setTimeout(tenter, 1500);
    } catch (e) {}
  }

  // v1408 : « Tes limitations ont-elles changé ? » — tous les 3 mois quand il y en a.
  // Une condition qui évolue (maladie dégénérative, âge) change avec le temps ; avant,
  // rien ne le rappelait. Attend que l'écran soit libre ; « Plus tard » repousse d'un mois.
  var TROIS_MOIS = 91 * 86400000, UN_MOIS = 30 * 86400000;
  function revoir(force) {
    try {
      if (!get().length) return false;
      var r = parseInt(localStorage.getItem(cle() + '_revue') || '0', 10);
      if (!r) { localStorage.setItem(cle() + '_revue', String(Date.now())); if (!force) return false; }
      if (!force && Date.now() - r < TROIS_MOIS) return false;
      if (typeof window.showConfirm !== 'function') return false;
      var act = actives().map(function (l) { return l.titre; }).join(', ');
      window.showConfirm('Tes limitations actuelles : ' + act + '. Quelque chose a changé ? Mets-les à jour pour que tes séances restent sûres.', function () {
        try { localStorage.setItem(cle() + '_revue', String(Date.now())); } catch (e) {}
        ouvrir();
      }, function () {
        try { localStorage.setItem(cle() + '_revue', String(Date.now() - TROIS_MOIS + UN_MOIS)); } catch (e) {}
      }, { title: 'Tes limitations ont-elles changé ?', subtitle: '◈ TOUS LES 3 MOIS ◈', confirmLabel: 'Revoir mes limitations', cancelLabel: 'Plus tard' });
      return true;
    } catch (e) { return false; }
  }
  function revoirQuandLibre() {
    var essais = 0;
    (function tenter() {
      try {
        var up = (typeof getUserProfile === 'function') ? getUserProfile() : null;
        var occupe = !up || !up.setupComplete || document.body.classList.contains('in-session') || !!document.querySelector('.modal.active')
          || [].some.call(document.body.children, function (el) { var cs = getComputedStyle(el); return cs.position === 'fixed' && (parseInt(cs.zIndex, 10) || 0) >= 9000 && cs.display !== 'none' && el.getBoundingClientRect().height > window.innerHeight * 0.5; });
        if (occupe) { if (++essais < 60) setTimeout(tenter, 3000); return; }
        revoir(false);
      } catch (e) {}
    })();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', proposerSiNouveau);
    document.addEventListener('DOMContentLoaded', function () { setTimeout(revoirQuandLibre, 6000); });
  } else {
    proposerSiNouveau();
    setTimeout(revoirQuandLibre, 6000);
  }

  window.AwakLimitations = {
    liste: LIMITATIONS,
    get: get,
    actives: actives,
    bloque: bloque,
    filtrer: filtrer,
    ouvrir: ouvrir,
    dates: dates,
    maintien: maintien,
    basculerMaintien: function () {
      setMaintien(!maintien());
      var modal = document.getElementById('awakLimitModal');
      if (modal) { modal.remove(); ouvrir(); }
    },
    revoir: revoir,
    toggle: function (id) {
      var ids = get();
      var i = ids.indexOf(id);
      if (i >= 0) ids.splice(i, 1); else ids.push(id);
      set(ids);
      // Re-rendu de la liste + de l'impact, sans refermer la fenêtre
      var modal = document.getElementById('awakLimitModal');
      if (modal) { modal.remove(); ouvrir(); }
      majResume();
    }
  };
  window.AwakLimitations.majResume = majResume;
  window.awakOuvrirLimitations = ouvrir;
})();
