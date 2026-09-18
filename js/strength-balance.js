/* ═══════════════════════════════════════════════════════════════════════
   ⚖️  ÉQUILIBRE DE FORCE — Awakened
   -----------------------------------------------------------------------
   Compare les charges de la personne entre elles et signale les groupes
   musculaires EN RETARD par rapport aux autres.

   MÉTHODE
   1. Pour chaque mouvement de référence, on estime le 1RM à partir de la
      MEILLEURE série de l'historique (formule d'Epley : 1RM ≈ poids × (1 + reps/30)).
      → On ne compare jamais « 100 kg × 3 » à « 80 kg × 12 » sans les ramener
        à une base commune : ce serait faux.
   2. Chaque 1RM est converti en « équivalent développé couché » via un
      ratio de référence (ex. squat ≈ 1,3 × bench).
   3. La MÉDIANE de ces équivalents donne le niveau réel de la personne.
      On prend la médiane et non la moyenne : un seul mouvement très en
      retard tirerait la moyenne vers le bas et fausserait tout le reste.
   4. Tout mouvement dont l'équivalent est nettement sous la médiane est
      signalé, avec la charge qu'il faudrait atteindre.

   ⚠️ LIMITES ASSUMÉES, affichées à l'utilisateur :
   • Les ratios varient selon la morphologie (bras longs, fémurs longs…).
     Ce sont des repères, pas une vérité.
   • L'analyse exige au moins 3 mouvements différents, sinon la médiane
     n'a aucun sens statistique.
   • Les séries à plus de 12 répétitions estiment mal le 1RM : on les écarte.
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  // Ratio = valeur attendue du mouvement ÷ développé couché.
  // Repères classiques de la préparation physique (Rippetoe, standards ExRx).
  var LIFTS = [
    // ── PECTORAUX ──
    { id:'bench',    nom:'Développé couché',   ratio:1.00, muscle:'Pectoraux',
      // ⚠️ Exclut explicitement incliné / décliné / prise serrée : ces variantes
      //    ont leur propre ratio et étaient captées ici en premier.
      re:/^(?!.*(incline|decline|close.grip|serre)).*(developpe couche|bench press)/ },
    { id:'inclbench',nom:'Développé incliné',  ratio:0.82, muscle:'Pectoraux',
      re:/developpe incline|incline bench/ },
    { id:'ecarte',   nom:'Écarté haltères',    ratio:0.42, muscle:'Pectoraux',
      re:/^ecarte|^ecartes|fly halter|pec deck|butterfly/ },

    // ── DOS ──
    { id:'deadlift', nom:'Soulevé de terre',   ratio:1.50, muscle:'Dos / chaîne postérieure',
      re:/^souleve de terre$|^deadlift$|sumo deadlift|conventional deadlift/ },
    { id:'row',      nom:'Rowing barre',       ratio:0.90, muscle:'Dos',
      re:/rowing barre|rowing penche|barbell row|rowing halter|rowing t-bar|rowing buste/ },
    { id:'latpull',  nom:'Tirage vertical',    ratio:0.80, muscle:'Dos (vertical)',
      re:/tirage vertical|lat pulldown|tirage nuque|tirage poitrine/ },
    { id:'seatedrow',nom:'Tirage horizontal',  ratio:0.85, muscle:'Dos',
      re:/tirage horizontal|seated row|rowing assis|rowing machine/ },

    // ── JAMBES ──
    { id:'squat',    nom:'Squat',              ratio:1.30, muscle:'Quadriceps',
      re:/^squat classique|^squat barre|^squat sumo|^back squat|^squat$|^high bar|^low bar/ },
    { id:'frontsq',  nom:'Squat avant',        ratio:1.05, muscle:'Quadriceps',
      re:/squat avant|front squat/ },
    { id:'lpress',   nom:'Presse à cuisses',   ratio:2.20, muscle:'Quadriceps',
      re:/presse a cuisse|leg press|presse jambe/ },
    { id:'legext',   nom:'Leg extension',      ratio:0.55, muscle:'Quadriceps',
      re:/leg extension|extension jambe|extension quadri/ },
    { id:'rdl',      nom:'Soulevé de terre roumain', ratio:1.20, muscle:'Ischio-jambiers',
      re:/romanian deadlift|souleve de terre roumain|stiff leg deadlift|jambes tendues/ },
    { id:'legcurl',  nom:'Leg curl',           ratio:0.50, muscle:'Ischio-jambiers',
      re:/leg curl|curl ischio|flexion jambe|curl jambe/ },
    { id:'hipthr',   nom:'Hip thrust',         ratio:1.60, muscle:'Fessiers',
      re:/hip thrust|pont fessier lest|glute bridge lest/ },
    { id:'calf',     nom:'Mollets debout',     ratio:1.10, muscle:'Mollets',
      re:/mollet|calf raise|extension mollet/ },

    // ── ÉPAULES ──
    { id:'ohp',      nom:'Développé militaire',ratio:0.65, muscle:'Épaules',
      re:/developpe militaire|overhead press|shoulder press|presse epaule/ },
    { id:'latraise', nom:'Élévations latérales',ratio:0.22, muscle:'Épaules',
      re:/elevations laterales|lateral raise|elevation laterale/ },
    { id:'frontraise',nom:'Élévations frontales',ratio:0.20, muscle:'Épaules',
      re:/elevations frontales|front raise|elevation frontale/ },
    { id:'facepull', nom:'Face pull',          ratio:0.35, muscle:'Épaules (arrière)',
      re:/face pull|oiseau|rear delt|band pull apart/ },

    // ── BRAS ──
    { id:'curl',     nom:'Curl barre',         ratio:0.38, muscle:'Biceps',
      re:/^curl barre|^curl ez|^curl biceps barre|^curl pupitre/ },
    { id:'curlhalt', nom:'Curl haltères',      ratio:0.32, muscle:'Biceps',
      re:/^curl biceps halter|^curl halter|^curl incline|^curl marteau|hammer curl|^curl concentr/ },
    { id:'tricepsext',nom:'Extension triceps', ratio:0.35, muscle:'Triceps',
      re:/extension triceps|triceps corde|pushdown|triceps poulie|barre au front|skull crusher/ },
    { id:'closegrip',nom:'Développé serré',    ratio:0.80, muscle:'Triceps',
      re:/close.grip bench|developpe serre|developpe couche prise serree/ },
    { id:'wrist',    nom:'Flexion poignets',   ratio:0.18, muscle:'Avant-bras',
      re:/poignet|wrist curl|avant.bras|farmer/ },

    // ── TRAPÈZES ──
    { id:'shrug',    nom:'Shrugs',             ratio:1.10, muscle:'Trapèzes',
      re:/shrug|haussement epaule/ }
  ];

  var SEUIL = 0.85;      // sous 85 % de la médiane → signalé
  var MIN_LIFTS = 3;     // en dessous, aucune médiane fiable

  function norm(s) {
    return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  function perfs() {
    try {
      if (typeof window.getExercisePerformances === 'function') return window.getExercisePerformances() || {};
    } catch (e) {}
    // Repli : lecture directe, cloisonnée par profil
    try {
      var id = (typeof getCurrentProfileId === 'function') ? getCurrentProfileId() : null;
      var k = id ? 'profile_' + id + '_exercisePerformance' : 'exercisePerformance';
      var raw = localStorage.getItem(k) || localStorage.getItem('exercisePerformance');
      var o = raw ? JSON.parse(raw) : {};
      return (o && typeof o === 'object') ? o : {};
    } catch (e) { return {}; }
  }

  // 1RM estimé à partir de la meilleure série (Epley).
  function meilleur1RM(series) {
    if (!Array.isArray(series)) return null;
    var best = null;
    series.forEach(function (s) {
      if (!s || s.warmup) return;
      var w = parseFloat(s.weight) || 0;
      var r = parseInt(s.reps, 10) || 0;
      // Au-delà de 12 répétitions, l'estimation devient trop imprécise.
      if (w <= 0 || r <= 0 || r > 12) return;
      var rm = w * (1 + r / 30);
      if (!best || rm > best.rm) best = { rm: rm, poids: w, reps: r, date: s.date || null };
    });
    return best;
  }

  // Analyse complète. Retourne null si les données sont insuffisantes.
  function analyser() {
    var P = perfs();
    var noms = Object.keys(P);
    var trouves = [];

    LIFTS.forEach(function (L) {
      var meilleur = null, nomUtilise = null;
      noms.forEach(function (n) {
        if (!L.re.test(norm(n))) return;
        var b = meilleur1RM(P[n]);
        if (b && (!meilleur || b.rm > meilleur.rm)) { meilleur = b; nomUtilise = n; }
      });
      if (meilleur) {
        trouves.push({
          lift: L,
          rm: meilleur.rm,
          poids: meilleur.poids,
          reps: meilleur.reps,
          exercice: nomUtilise,
          equivalent: meilleur.rm / L.ratio      // ramené en « équivalent bench »
        });
      }
    });

    if (trouves.length < MIN_LIFTS) {
      return { suffisant: false, trouves: trouves, requis: MIN_LIFTS };
    }

    // Médiane des équivalents = niveau de référence de la personne
    var eq = trouves.map(function (t) { return t.equivalent; }).sort(function (a, b) { return a - b; });
    var m = eq.length % 2
      ? eq[(eq.length - 1) / 2]
      : (eq[eq.length / 2 - 1] + eq[eq.length / 2]) / 2;

    var retards = [], forts = [], equilibres = [];
    trouves.forEach(function (t) {
      var ratio = t.equivalent / m;
      var attendu = m * t.lift.ratio;            // charge attendue pour ce mouvement
      var item = {
        nom: t.lift.nom, muscle: t.lift.muscle, exercice: t.exercice,
        actuel: t.rm, attendu: attendu, ecart: attendu - t.rm,
        pourcent: Math.round(ratio * 100)
      };
      if (ratio < SEUIL) retards.push(item);
      else if (ratio > 1.15) forts.push(item);
      else equilibres.push(item);
    });

    retards.sort(function (a, b) { return a.pourcent - b.pourcent; });

    // ── Lecture « PROPORTIONNEL À TON MEILLEUR » ──
    // La médiane dit qui est en retard par rapport à l'ensemble ; elle ne dit
    // pas ce qu'il faudrait pour s'aligner sur le mouvement le plus fort.
    // C'est pourtant la question naturelle : « mon squat est à 300, mon bench
    // devrait être à combien ? »
    var top = trouves.slice().sort(function (a, b) { return b.equivalent - a.equivalent; })[0];
    var cibles = trouves.filter(function (t) { return t !== top; }).map(function (t) {
      var attendu = top.equivalent * t.lift.ratio;
      return {
        nom: t.lift.nom, muscle: t.lift.muscle,
        actuel: t.rm, attendu: attendu, ecart: attendu - t.rm,
        pourcent: Math.round((t.rm / attendu) * 100)
      };
    }).sort(function (a, b) { return a.pourcent - b.pourcent; });

    // Muscles SANS aucune donnée : l'utilisateur doit savoir ce qui manque,
    // sinon il croit que l'analyse couvre tout son corps.
    var couverts = {};
    trouves.forEach(function (t) { couverts[t.lift.muscle] = 1; });
    var absents = [];
    LIFTS.forEach(function (L) {
      if (!couverts[L.muscle] && absents.indexOf(L.muscle) < 0) absents.push(L.muscle);
    });

    return {
      suffisant: true, mediane: m, retards: retards, forts: forts,
      equilibres: equilibres, total: trouves.length,
      reference: { nom: top.lift.nom, rm: top.rm }, cibles: cibles,
      absents: absents
    };
  }

  // ── Affichage ──
  function unite() {
    try { return (typeof useKg !== 'undefined' && useKg) ? 'kg' : 'lbs'; } catch (e) { return 'kg'; }
  }
  function nb(v) { return Math.round(v); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function ouvrir() {
    var a = analyser();
    var u = unite();
    var corps;

    if (!a.suffisant) {
      var manque = a.requis - a.trouves.length;
      corps = '<div style="text-align:center;padding:26px 14px;">'
        + '<div style="font-size:2em;margin-bottom:10px;">⚖️</div>'
        + '<div style="font-size:0.95em;font-weight:800;color:#e8f0f8;margin-bottom:8px;">Pas encore assez de données</div>'
        + '<div style="font-size:0.8em;color:#94a3b8;line-height:1.5;">'
        +   'L\'analyse compare tes mouvements entre eux : il en faut au moins '
        +   a.requis + ' de référence, avec une charge. Il t\'en manque <strong style="color:#67e8f9;">'
        +   manque + '</strong>.<br><br>Mouvements reconnus : développé couché, squat, soulevé de terre, '
        +   'développé militaire, rowing barre, curl barre, hip thrust, presse à cuisses.</div>'
        + '</div>';
    } else {
      corps = '';

      if (a.retards.length) {
        corps += '<div style="font-size:0.58em;letter-spacing:1.8px;color:#fbbf24;font-weight:900;margin-bottom:9px;">'
          + '◈ EN RETARD</div>';
        corps += a.retards.map(function (r) {
          return '<div style="background:rgba(251,191,36,0.07);border:1px solid rgba(251,191,36,0.28);'
            + 'border-left:3px solid #fbbf24;border-radius:13px;padding:13px 14px;margin-bottom:9px;">'
            + '<div style="display:flex;align-items:baseline;justify-content:space-between;gap:8px;margin-bottom:5px;">'
            +   '<span style="font-size:0.92em;font-weight:900;color:#fff;">' + esc(r.nom) + '</span>'
            +   '<span style="font-size:0.76em;font-weight:900;color:#fbbf24;">' + r.pourcent + '%</span>'
            + '</div>'
            + '<div style="font-size:0.78em;color:#cbd5e1;line-height:1.5;">'
            +   esc(r.muscle) + ' · tu es à <strong>' + nb(r.actuel) + ' ' + u + '</strong>, '
            +   'attendu ≈ <strong style="color:#fbbf24;">' + nb(r.attendu) + ' ' + u + '</strong> '
            +   '<span style="color:#94a3b8;">(+' + nb(r.ecart) + ' ' + u + ')</span></div>'
            + '</div>';
        }).join('');
      } else {
        corps += '<div style="background:rgba(34,211,238,0.08);border:1px solid rgba(34,211,238,0.3);'
          + 'border-radius:13px;padding:14px;margin-bottom:12px;font-size:0.84em;color:#67e8f9;'
          + 'font-weight:700;text-align:center;">Aucun déséquilibre marqué. Beau travail.</div>';
      }

      if (a.forts.length) {
        corps += '<div style="font-size:0.58em;letter-spacing:1.8px;color:#4ade80;font-weight:900;margin:14px 0 9px;">'
          + '◈ TES POINTS FORTS</div>';
        corps += a.forts.map(function (f) {
          return '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;'
            + 'padding:9px 12px;margin-bottom:6px;background:rgba(74,222,128,0.06);'
            + 'border:1px solid rgba(74,222,128,0.22);border-radius:11px;">'
            + '<span style="font-size:0.82em;font-weight:700;color:#e8f0f8;">' + esc(f.nom) + '</span>'
            + '<span style="font-size:0.78em;font-weight:900;color:#4ade80;">' + f.pourcent + '%</span>'
            + '</div>';
        }).join('');
      }

      if (a.cibles && a.cibles.length) {
        corps += '<div style="font-size:0.58em;letter-spacing:1.8px;color:#67e8f9;font-weight:900;margin:16px 0 4px;">'
          + '◈ POUR ÊTRE PROPORTIONNEL</div>'
          + '<div style="font-size:0.72em;color:#94a3b8;margin-bottom:9px;line-height:1.45;">'
          + 'Si tu t\'alignes sur ton meilleur mouvement (<strong style="color:#e8f0f8;">'
          + esc(a.reference.nom) + ' ' + nb(a.reference.rm) + ' ' + u + '</strong>) :</div>';
        corps += a.cibles.map(function (c) {
          var manque = c.ecart > 0;
          return '<div style="display:flex;align-items:center;gap:9px;padding:10px 12px;margin-bottom:6px;'
            + 'background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.07);border-radius:11px;">'
            + '<div style="flex:1;min-width:0;">'
            +   '<div style="font-size:0.82em;font-weight:800;color:#e8f0f8;overflow:hidden;'
            +     'text-overflow:ellipsis;white-space:nowrap;">' + esc(c.nom) + '</div>'
            +   '<div style="font-size:0.68em;color:#64748b;margin-top:1px;">' + esc(c.muscle) + '</div>'
            + '</div>'
            + '<div style="text-align:right;flex-shrink:0;">'
            +   '<div style="font-size:0.8em;font-weight:900;color:' + (manque ? '#fbbf24' : '#4ade80') + ';">'
            +     nb(c.actuel) + ' → ' + nb(c.attendu) + ' ' + u + '</div>'
            +   '<div style="font-size:0.66em;color:#94a3b8;margin-top:1px;">'
            +     (manque ? 'il manque ' + nb(c.ecart) + ' ' + u : 'déjà au-delà') + '</div>'
            + '</div>'
            + '</div>';
        }).join('');
      }

      if (a.absents && a.absents.length) {
        corps += '<div style="margin-top:16px;padding:11px 13px;background:rgba(148,163,184,0.06);'
          + 'border:1px solid rgba(148,163,184,0.2);border-radius:11px;">'
          + '<div style="font-size:0.58em;letter-spacing:1.6px;color:#94a3b8;font-weight:900;margin-bottom:5px;">'
          +   'PAS ENCORE ÉVALUÉ</div>'
          + '<div style="font-size:0.74em;color:#94a3b8;line-height:1.5;">'
          +   esc(a.absents.join(' · ')) + '<br>'
          +   '<span style="color:#64748b;">Enregistre une série avec charge sur ces groupes '
          +   'pour les inclure dans l\'analyse.</span></div>'
          + '</div>';
      }

      corps += '<div style="margin-top:14px;padding:11px 13px;background:rgba(255,255,255,0.03);'
        + 'border:1px solid rgba(255,255,255,0.07);border-radius:11px;font-size:0.72em;'
        + 'color:#94a3b8;line-height:1.55;">'
        + 'Basé sur <strong style="color:#cbd5e1;">' + a.total + ' mouvements</strong> de ton historique. '
        + 'Les charges sont ramenées à un 1RM estimé, puis comparées entre elles.<br><br>'
        + '<strong style="color:#cbd5e1;">À prendre comme un repère.</strong> Les ratios varient selon '
        + 'la morphologie : des bras longs désavantagent au développé couché, des fémurs longs au squat. '
        + 'Un écart n\'est pas forcément un défaut.'
        + '</div>';
    }

    var old = document.getElementById('awakBalanceModal');
    if (old) old.remove();
    var ov = document.createElement('div');
    ov.id = 'awakBalanceModal';
    ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.92);backdrop-filter:blur(9px);'
      + 'z-index:10200;display:flex;align-items:center;justify-content:center;padding:16px;';
    ov.addEventListener('click', function (e) { if (e.target === ov) ov.remove(); });
    ov.innerHTML = '<div style="background:#0F1014;border:1px solid rgba(34,211,238,0.3);border-top:2px solid #22d3ee;'
      + 'border-radius:18px;max-width:480px;width:100%;max-height:88vh;display:flex;flex-direction:column;'
      + 'box-shadow:0 24px 60px rgba(0,0,0,0.7);overflow:hidden;">'
      + '<div style="padding:15px 18px 12px;flex-shrink:0;border-bottom:1px solid rgba(255,255,255,0.07);'
      +   'display:flex;align-items:center;gap:10px;">'
      +   '<div style="min-width:0;flex:1;">'
      +     '<div style="font-size:0.56em;letter-spacing:2px;color:#22d3ee;font-weight:900;">ANALYSE</div>'
      +     '<div style="font-size:1em;font-weight:900;color:#fff;">Équilibre de force</div>'
      +   '</div>'
      +   '<button onclick="document.getElementById(\'awakBalanceModal\').remove()" '
      +     'style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.14);color:#94a3b8;'
      +     'border-radius:10px;width:32px;height:32px;min-height:auto;font-size:1.05em;font-weight:800;'
      +     'cursor:pointer;flex-shrink:0;line-height:1;">×</button>'
      + '</div>'
      + '<div style="flex:1;overflow-y:auto;padding:15px 16px 20px;-webkit-overflow-scrolling:touch;">' + corps + '</div>'
      + '</div>';
    document.body.appendChild(ov);
  }

  window.AwakBalance = { analyser: analyser, ouvrir: ouvrir, LIFTS: LIFTS };
  window.awakOuvrirEquilibre = ouvrir;
})();
