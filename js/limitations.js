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
        return /(militaire|overhead|thruster|snatch|arrach|epaule[- ]?jete|jerk|handstand|pike push)/.test(n)
            || /(developpe|presse|press|shoulder press)/.test(n) && /(epaule|militaire|arnold)/.test(n)
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
      id: 'impact',
      emoji: '🚫',
      titre: 'Pas d\'impact / de saut',
      detail: 'Écarte sauts, course, corde à sauter, burpees et pliométrie. Utile pour les articulations sensibles.',
      test: function (ex) {
        var n = norm(ex.name);
        // ⚠️ « run » nu matchait « cRUNch » : on borne les mots courts.
        return /(saut|jump|burpee|corde a sauter|course|sprint|plyo|mountain climber|jumping|skater|\bbox\b|\brun\b)/.test(n);
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
        return ex.position !== 'assis';
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
    if (reels.length < mini) {
      return { gardes: liste, ecartes: [], ignore: true, manque: reels.length };
    }
    return { gardes: gardes, ecartes: ecartes, ignore: false };
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

    var lignes = LIMITATIONS.map(function (l) {
      var on = ids.indexOf(l.id) >= 0;
      return '<div onclick="AwakLimitations.toggle(\'' + l.id + '\')" ' +
          'style="cursor:pointer;display:flex;align-items:flex-start;gap:11px;padding:12px 13px;margin-bottom:8px;' +
          'background:' + (on ? 'rgba(34,211,238,0.10)' : 'rgba(255,255,255,0.025)') + ';' +
          'border:1.5px solid ' + (on ? 'rgba(34,211,238,0.45)' : 'rgba(255,255,255,0.07)') + ';border-radius:13px;">' +
          '<span style="font-size:1.2em;flex-shrink:0;line-height:1.2;">' + l.emoji + '</span>' +
          '<div style="flex:1;min-width:0;">' +
            '<div style="font-size:0.84em;font-weight:800;color:#e8f0f8;margin-bottom:3px;">' + esc(l.titre) + '</div>' +
            '<div style="font-size:0.7em;color:#94a3b8;line-height:1.45;">' + esc(l.detail) + '</div>' +
          '</div>' +
          '<span style="flex-shrink:0;width:22px;height:22px;border-radius:50%;display:inline-flex;' +
            'align-items:center;justify-content:center;font-size:0.7em;font-weight:900;' +
            (on ? 'background:#22d3ee;color:#04121f;">✓' : 'border:1.5px dashed rgba(148,163,184,0.5);color:#64748b;">+') +
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
          '<span style="font-size:1.5em;flex-shrink:0;">♿</span>' +
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
          '<div id="awakLimitImpact" style="margin-top:6px;"></div>' +
          '<div style="margin-top:14px;background:rgba(251,191,36,0.08);border:1px solid rgba(251,191,36,0.25);' +
            'border-radius:11px;padding:10px 12px;font-size:0.72em;color:#fcd34d;line-height:1.5;">' +
            '⚠️ Ces réglages ne remplacent pas un avis médical. En cas de blessure ou de douleur, ' +
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
        (critique ? '⚠️ ' : '📊 ') + ecartes + ' exercice' + (ecartes > 1 ? 's' : '') + ' écarté' + (ecartes > 1 ? 's' : '') +
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

  window.AwakLimitations = {
    liste: LIMITATIONS,
    get: get,
    actives: actives,
    bloque: bloque,
    filtrer: filtrer,
    ouvrir: ouvrir,
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
