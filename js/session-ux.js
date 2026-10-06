/* ============================================================
   SÉANCE — confort et récompenses (v1223)
   • Réglages rapides sur l'écran « Prépare-toi » : forme du jour
     et cardio d'échauffement. Remplace les deux fenêtres qui
     s'enchaînaient avant de pouvoir bouger.
   • Petite fête à chaque exercice terminé (étoile + compteur),
     et à chaque série validée une par une.
   Palette bleue. Icônes SVG (AwakIcon), aucun emoji.
   ============================================================ */
(function () {
  'use strict';

  var BLEU = '#60a8f0', CLAIR = '#93c5fd', OR = '#fbbf24';
  var CLE_HUMEUR = 'awakMoodPreWorkoutTs';   // même clé que pre-workout-mood.js

  function enfant() {
    try { return !!(window.AwakYouth && AwakYouth.isChild && AwakYouth.isChild()); } catch (e) { return false; }
  }
  function ico(nom, t, c) {
    try { return (window.AwakIcon && AwakIcon.get(nom, t, c)) || ''; } catch (e) { return ''; }
  }

  // ── Cardio d'échauffement : au CHOIX parmi ce que le matériel permet ──
  // v1298 : avant, une seule activité imposée (la 1re trouvée, souvent la
  // corde à sauter). Maintenant on choisit ; le dernier choix est retenu.
  var CARDIO = [
    { name: 'Tapis roulant',               court: 'Tapis',        equip: 'Tapis roulant' },
    { name: 'Vélo stationnaire',           court: 'Vélo',         equip: 'Vélo stationnaire' },
    { name: 'Rameur',                      court: 'Rameur',       equip: 'Rameur' },
    { name: 'Elliptique',                  court: 'Elliptique',   equip: 'Elliptique' },
    { name: 'Corde à sauter',              court: 'Corde',        equip: 'Corde à sauter' },
    { name: 'Jumping jacks',               court: 'Jumping jacks', equip: null },
    { name: 'Montées de genoux sur place', court: 'Genoux',       equip: null },
    { name: 'Shadow Boxing',               court: 'Boxe dans le vide', equip: null },
    { name: 'Marche sur place',            court: 'Marche',       equip: null }
  ];
  var CLE_CARDIO = 'awakCardioChoix';
  function cleCardio() { try { return typeof window._cleProfil === 'function' ? window._cleProfil(CLE_CARDIO) : CLE_CARDIO; } catch (e) { return CLE_CARDIO; } }
  function activitesDispo() {
    var eq = [];
    try { if (typeof getSelectedEquipmentNames === 'function') eq = getSelectedEquipmentNames() || []; } catch (e) {}
    return CARDIO.filter(function (c) { return !c.equip || eq.indexOf(c.equip) !== -1; });
  }
  function activiteCardio() {
    var dispo = activitesDispo(), voulu = null;
    try { voulu = etat.activite || localStorage.getItem(cleCardio()); } catch (e) {}
    for (var i = 0; i < dispo.length; i++) if (dispo[i].name === voulu) return dispo[i];
    return dispo[0] || CARDIO[CARDIO.length - 1];
  }

  var etat = { humeur: null, cardio: 0 };

  function chip(groupe, val, label, actif, couleur) {
    var c = couleur || BLEU;
    return '<button type="button" onclick="AwakSessUX._choisir(\'' + groupe + '\',' + val + ')" '
      + 'style="flex:1;min-width:0;padding:10px 4px;border-radius:11px;cursor:pointer;font-weight:800;font-size:0.78em;'
      + 'white-space:nowrap;touch-action:manipulation;'
      + (actif
        ? 'background:' + c + '26;border:1.5px solid ' + c + ';color:#fff;'
        : 'background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.1);color:#94a3b8;')
      + '">' + label + '</button>';
  }

  function rendrePrep() {
    var hote = document.getElementById('prepQuick');
    if (!hote) return;
    if (enfant()) { hote.innerHTML = ''; hote.style.display = 'none'; return; }
    hote.style.display = 'block';
    var act = activiteCardio();
    var h = '';
    h += '<div style="background:rgba(96,168,240,0.05);border:1px solid rgba(96,168,240,0.22);border-radius:14px;padding:13px 13px 12px;margin-bottom:16px;">';
    // Forme
    h += '<div style="display:flex;align-items:center;gap:7px;font-size:0.74em;font-weight:800;color:' + CLAIR + ';margin-bottom:8px;">'
      + ico('eclair', 15, CLAIR) + '<span>Comment te sens-tu ?</span>'
      + '<span style="margin-left:auto;font-size:0.85em;color:#64748b;font-weight:700;">facultatif</span></div>';
    h += '<div style="display:flex;gap:6px;margin-bottom:6px;">'
      + chip('humeur', 2, 'Fatigué', etat.humeur === 2, '#f87171')
      + chip('humeur', 5, 'Correct', etat.humeur === 5, OR)
      + chip('humeur', 8, 'En forme', etat.humeur === 8, BLEU)
      + '</div>';
    if (etat.humeur === 2) {
      h += '<div style="font-size:0.72em;color:#cbd5e1;line-height:1.45;margin:6px 2px 4px;">'
        + (etat.nuit ? 'Ta montre indique une nuit courte (' + AwakSante.hm(etat.nuit) + '). ' : '')
        + 'Va à ton rythme : les repos seront un peu plus longs.'
        + (typeof window.startWorkout === 'function'
          ? ' <a href="#" onclick="AwakSessUX._douce();return false;" style="color:' + CLAIR + ';font-weight:800;">Faire plutôt une séance douce</a>'
          : '')
        + '</div>';
    }
    // Cardio
    h += '<div style="display:flex;align-items:center;gap:7px;font-size:0.74em;font-weight:800;color:' + CLAIR + ';margin:12px 0 8px;">'
      + ico('course', 15, CLAIR) + '<span>Cardio pour te réchauffer</span>'
      + '<span style="margin-left:auto;font-size:0.85em;color:#64748b;font-weight:700;">' + (etat.cardio > 0 ? 'choisis l\'activité' : 'facultatif') + '</span></div>';
    h += '<div style="display:flex;gap:6px;">'
      + chip('cardio', 0, 'Non merci', etat.cardio === 0)
      + chip('cardio', 3, '3 min', etat.cardio === 3)
      + chip('cardio', 5, '5 min', etat.cardio === 5)
      + '</div>';
    if (etat.cardio > 0) {
      var dispo = activitesDispo();
      h += '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;">'
        + dispo.map(function (c, i) {
            var on = c.name === act.name;
            return '<button type="button" onclick="AwakSessUX._activite(' + CARDIO.indexOf(c) + ')" '
              + 'style="padding:8px 11px;border-radius:99px;cursor:pointer;font-weight:800;font-size:0.72em;white-space:nowrap;touch-action:manipulation;'
              + (on ? 'background:' + BLEU + '26;border:1.5px solid ' + BLEU + ';color:#fff;'
                    : 'background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.1);color:#94a3b8;')
              + '">' + c.court + '</button>';
          }).join('')
        + '</div>';
    }
    h += '</div>';
    hote.innerHTML = h;
  }

  function prep(workout) {
    etat = { humeur: null, cardio: 0 };
    // ⌚ v1232 : nuit courte mesurée par la montre → « Fatigué » présélectionné
    try {
      var nc = window.AwakSante && AwakSante.nuitCourte && AwakSante.nuitCourte();
      if (nc) { etat.humeur = 2; etat.nuit = nc; }
    } catch (e) {}
    // Une routine ou une séance qui contient déjà son échauffement : pas de cardio proposé
    rendrePrep();
  }

  function choisir(groupe, val) {
    if (groupe === 'humeur') etat.humeur = (etat.humeur === val) ? null : val;
    else etat.cardio = val;
    try { if (window.AwakNative) AwakNative.vibrer(8); } catch (e) {}
    rendrePrep();
  }

  function choisirActivite(i) {
    var c = CARDIO[i]; if (!c) return;
    etat.activite = c.name;
    try { localStorage.setItem(cleCardio(), c.name); } catch (e) {}
    try { if (window.AwakNative) AwakNative.vibrer(8); } catch (e) {}
    rendrePrep();
  }

  function douce() {
    try { localStorage.setItem(CLE_HUMEUR, String(Date.now())); } catch (e) {}
    try { if (typeof window.setFitnessIndex === 'function') window.setFitnessIndex(2); } catch (e) {}
    try { if (typeof window.cancelWorkoutPreparation === 'function') window.cancelWorkoutPreparation(); } catch (e) {}
    setTimeout(function () { try { window.startWorkout('mobility'); } catch (e) {} }, 80);
  }

  // Appelé par startPreparedWorkout() avant de lancer : applique les choix
  // faits sur l'écran et désactive les deux anciennes fenêtres.
  function appliquerPrep(workout) {
    if (!workout || workout._prepApplique) return;
    workout._prepApplique = true;
    workout._cardioAsked = true;   // plus de fenêtre « Cardio d'échauffement ? »
    try { localStorage.setItem(CLE_HUMEUR, String(Date.now())); } catch (e) {}   // plus de fenêtre « Quelle est ta forme ? »
    if (etat.humeur != null) {
      try {
        if (typeof window.setFitnessIndex === 'function') window.setFitnessIndex(etat.humeur);
        else if (typeof window.updateFitnessIndex === 'function') window.updateFitnessIndex(etat.humeur);
      } catch (e) {}
    }
    if (etat.cardio > 0 && Array.isArray(workout.exercises) && !enfant()) {
      var act = activiteCardio();
      workout.exercises.unshift({
        name: act.name, muscle: 'Cardio', mode: 'timer', duration: etat.cardio * 60, sets: 1,
        type: 'warmup', equipment: act.equip ? [act.equip] : ['Poids du corps'],
        instructions: [etat.cardio + ' minutes de ' + act.name.toLowerCase(), 'Commence doucement, puis accélère un peu', 'Tu dois avoir chaud, pas être épuisé'],
        _isCardioWarmup: true
      });
    }
  }

  // ── Fête : bulle qui monte au centre de l'écran ──
  function bulle(html, grand) {
    try {
      var old = document.getElementById('awakSessBulle'); if (old) old.remove();
      if (!document.getElementById('awakSessBulleCss')) {
        var st = document.createElement('style'); st.id = 'awakSessBulleCss';
        st.textContent = '@keyframes awakBulle{0%{opacity:0;transform:translate(-50%,10px) scale(.8)}'
          + '15%{opacity:1;transform:translate(-50%,0) scale(1.05)}25%{transform:translate(-50%,0) scale(1)}'
          + '80%{opacity:1;transform:translate(-50%,-14px)}100%{opacity:0;transform:translate(-50%,-30px)}}'
          + '@keyframes awakEtoileTourne{from{transform:rotate(-30deg) scale(.5)}to{transform:rotate(0) scale(1)}}';
        document.head.appendChild(st);
      }
      var b = document.createElement('div');
      b.id = 'awakSessBulle';
      b.setAttribute('aria-live', 'polite');
      b.style.cssText = 'position:fixed;left:50%;top:' + (grand ? '34%' : '40%') + ';z-index:100500;pointer-events:none;'
        + 'display:flex;align-items:center;gap:11px;padding:' + (grand ? '13px 20px 13px 14px' : '10px 16px') + ';border-radius:99px;'
        + 'background:linear-gradient(135deg,rgba(17,32,64,0.96),rgba(30,27,75,0.96));border:1.5px solid rgba(147,197,253,0.55);'
        + 'box-shadow:0 10px 34px rgba(0,0,0,0.55),0 0 26px rgba(96,168,240,0.35);color:#fff;white-space:nowrap;'
        + 'animation:awakBulle ' + (grand ? '1.9s' : '1.4s') + ' ease forwards;';
      b.innerHTML = html;
      document.body.appendChild(b);
      setTimeout(function () { try { b.remove(); } catch (e) {} }, grand ? 2000 : 1500);
    } catch (e) {}
  }

  // Un exercice vient d'être terminé.
  // info = { cur, total, etoiles }
  function exoFini(info) {
    info = info || {};
    var reste = Math.max(0, (info.total || 0) - (info.cur || 0));
    var sous = reste === 0 ? 'Dernier exercice, bravo !'
      : reste === 1 ? 'Plus qu\'un exercice !'
      : 'Encore ' + reste + ' exercices';
    var html = '<span style="flex-shrink:0;width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;'
      + 'background:radial-gradient(circle,rgba(251,191,36,0.35),rgba(251,191,36,0.08));border:1px solid rgba(251,191,36,0.6);'
      + 'animation:awakEtoileTourne .5s cubic-bezier(.34,1.56,.64,1) both;">' + (enfant() ? ico('etoile', 22, OR) : ico('valide', 22, OR)) + '</span>'
      + '<span style="display:flex;flex-direction:column;line-height:1.2;">'
      + '<span style="font-weight:900;font-size:0.95em;">Exercice terminé' + (info.etoiles && enfant() ? ' · ' + info.etoiles + ' étoile' + (info.etoiles > 1 ? 's' : '') : '') + '</span>'
      + '<span style="font-size:0.75em;color:' + CLAIR + ';font-weight:700;">' + sous + '</span></span>';
    bulle(html, true);
    try { if (typeof vibrate === 'function') vibrate([40, 30, 80]); } catch (e) {}
  }

  // Une série validée une par une (pas la validation groupée de la grille).
  function serieFaite(num, total) {
    if (!(num > 0) || !(total > 0)) return;
    var reste = total - num;
    var txt = reste <= 0 ? 'Toutes les séries faites !'
      : reste === 1 ? 'Série ' + num + ' sur ' + total + ' — encore une !'
      : 'Série ' + num + ' sur ' + total + ' — continue !';
    bulle('<span style="display:inline-flex;">' + ico('valide', 18, CLAIR) + '</span>'
      + '<span style="font-weight:800;font-size:0.85em;">' + txt + '</span>', false);
  }

  // ── Consignes au « tu » ──
  // La base d'exercices vouvoie (« Restez sur l'avant des pieds ») alors que
  // toute l'app tutoie. On convertit À L'AFFICHAGE seulement, dans les
  // consignes de la séance : les données ne changent pas.
  var IRREG = {
    descendez: 'descends', redescendez: 'redescends', tenez: 'tiens', maintenez: 'maintiens',
    revenez: 'reviens', tendez: 'tends', suspendez: 'suspends', apprenez: 'apprends',
    prenez: 'prends', reprenez: 'reprends', allez: 'va', courez: 'cours', partez: 'pars',
    suivez: 'suis', faites: 'fais', mettez: 'mets', remettez: 'remets', attendez: 'attends',
    sentez: 'sens', asseyez: 'assieds', rendez: 'rends', battez: 'bats', permettez: 'permets'
  };
  var PAS_VERBE = { nez: 1, chez: 1, assez: 1, rez: 1 };
  function conjugue(mot) {
    var bas = mot.toLowerCase();
    if (PAS_VERBE[bas]) return mot;
    var r = IRREG[bas];
    if (!r) {
      if (/issez$/.test(bas)) r = bas.replace(/issez$/, 'is');       // saisissez → saisis
      else if (/(en|on)dez$/.test(bas)) r = bas.replace(/ez$/, 's'); // détendez → détends
      else r = bas.replace(/ez$/, 'e');                               // gardez → garde
    }
    return mot.charAt(0) === mot.charAt(0).toUpperCase() ? r.charAt(0).toUpperCase() + r.slice(1) : r;
  }
  function tutoyer(txt) {
    if (!txt || !/ez\b|vous|votre|vos\b/i.test(txt)) return txt;
    var out = txt.replace(/(^|[^A-Za-zÀ-ÿ])([A-Za-zÀ-ÿ]{2,}ez)(?=[^A-Za-zÀ-ÿ]|$)/g, function (m, avant, mot) {
      return avant + conjugue(mot);
    });
    out = out.replace(/-vous\b/g, '-toi')
             .replace(/\bvotre\b/g, 'ton').replace(/\bVotre\b/g, 'Ton')
             .replace(/\bvos\b/g, 'tes').replace(/\bVos\b/g, 'Tes');
    return out;
  }
  function tutoyerNoeud(racine) {
    if (!racine || !document.createTreeWalker) return;
    var tw = document.createTreeWalker(racine, NodeFilter.SHOW_TEXT, null), n, lot = [];
    while ((n = tw.nextNode())) lot.push(n);
    lot.forEach(function (t) {
      var v = t.nodeValue, w = tutoyer(v);
      if (w !== v) t.nodeValue = w;
    });
  }
  function surveillerConsignes() {
    var el = document.getElementById('exerciseInstructions');
    if (!el || el._awakTu || !window.MutationObserver) return;
    el._awakTu = true;
    tutoyerNoeud(el);
    new MutationObserver(function () { tutoyerNoeud(el); })
      .observe(el, { childList: true, subtree: true, characterData: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', surveillerConsignes);
  else surveillerConsignes();

  window.AwakSessUX = {
    tutoyer: tutoyer,
    prep: prep,
    appliquerPrep: appliquerPrep,
    exoFini: exoFini,
    serieFaite: serieFaite,
    enfant: enfant,
    _choisir: choisir,
    _activite: choisirActivite,
    _douce: douce
  };
})();
