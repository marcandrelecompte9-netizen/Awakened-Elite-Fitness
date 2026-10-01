/* ═══════════════════════════════════════════════════════════════════════
   ◀  BOUTON RETOUR DU TÉLÉPHONE — Awakened
   -----------------------------------------------------------------------
   Une PWA n'a qu'une seule page : sans historique, « Retour » sur Android
   quittait l'application d'un coup, même depuis une fenêtre ouverte.

   On garde en permanence une entrée « garde » dans l'historique. Chaque
   Retour la consomme ; on décide alors quoi faire, puis on la remet :
     1. une fenêtre est ouverte        → on la ferme
     2. une séance est en cours        → on la met en pause (jamais quitter)
     3. on est sur un autre onglet     → retour à l'Accueil
     4. on est sur l'Accueil           → « Appuie encore pour quitter »
                                          (2ᵉ Retour dans les 2 s = sortie)
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var dernierRetour = 0;
  var sortie = false;
  var ignorer = 0;          // popstate provoqués par nous-mêmes (history.go)

  // ⚠️ POURQUOI UNE RÉSERVE D'ENTRÉES : Chrome (Android) SAUTE les entrées
  // d'historique ajoutées sans geste de l'utilisateur. L'ancienne « garde »
  // remise dans le popstate était donc ignorée : deux Retour rapprochés
  // traversaient tout et fermaient l'app, même hors de l'Accueil.
  // On garde maintenant une RÉSERVE de plusieurs entrées, (re)créées pendant
  // un vrai toucher / clic / touche — donc jamais sautées. Chaque Retour en
  // consomme une. Chaque entrée porte sa profondeur (awakGarde: n).
  var RESERVE = 8;
  function profondeur() {
    try { var st = history.state; return (st && st.awakGarde) ? st.awakGarde : 0; } catch (e) { return 0; }
  }
  function remplir() {
    if (sortie) return;
    try {
      var d = profondeur();
      while (d < RESERVE) { d++; history.pushState({ awakGarde: d }, ''); }
    } catch (e) {}
  }
  // Après un Retour traité : si la réserve est vide, on remet au moins une
  // entrée (elle peut être sautée par Chrome, mais le prochain toucher
  // reconstituera la réserve complète).
  function garde() {
    if (MODE_NATIF) return;
    try { if (profondeur() === 0) history.pushState({ awakGarde: 1 }, ''); } catch (e) {}
  }

  function toast(msg) {
    try { if (typeof window.showToast === 'function') window.showToast(msg, 'info', 2000); } catch (e) {}
  }

  // Éléments plein écran à ne JAMAIS fermer par Retour : ils font partie
  // du déroulement de la séance ou de l'interface permanente.
  var JAMAIS = ['toastContainer', 'mobileNavBar', 'globalRestBanner', 'awakPauseOverlay',
                'exerciseView', 'appHeader'];

  function visible(el) {
    var st = getComputedStyle(el);
    if (st.display === 'none' || st.visibility === 'hidden' || parseFloat(st.opacity) === 0) return false;
    var r = el.getBoundingClientRect();
    return r.width * r.height > window.innerWidth * window.innerHeight * 0.35;
  }

  // Écrans qu'on ne ferme pas : premier lancement, création de profil,
  // compte à rebours, check-in de forme… (les fermer bloquerait le parcours)
  var PROTEGES = /onboard|setup|mood|countdown|ceremon|intro|firstcontact|premium/i;

  // Fenêtre ouverte la plus haute (position fixe, grand z-index, grande surface)
  function fenetreOuverte() {
    // Fenêtres statiques de la page (.modal.active), où qu'elles soient
    var mods = document.querySelectorAll('.modal.active');
    for (var m = mods.length - 1; m >= 0; m--) {
      if (!PROTEGES.test(mods[m].id || '') && visible(mods[m])) return mods[m];
    }
    var best = null, zBest = -1;
    var els = document.body.children;
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (!el || el.nodeType !== 1 || JAMAIS.indexOf(el.id) >= 0 || PROTEGES.test(el.id || '')) continue;
      var tag = el.tagName.toLowerCase();
      if (tag === 'script' || tag === 'style' || tag === 'link') continue;
      var st = getComputedStyle(el);
      if (st.position !== 'fixed') continue;
      var z = parseInt(st.zIndex, 10) || 0;
      if (z < 900 || !visible(el)) continue;
      if (z >= zBest) { zBest = z; best = el; }
    }
    return best;
  }

  // Fenêtres qui ont leur propre « fermer » (enregistrement compris)
  var SPECIAUX = {
    routineEditorModal: '_saveRoutineEdit'
  };

  function fermer(el) {
    var sp = SPECIAUX[el.id];
    if (sp && typeof window[sp] === 'function') {
      try { window[sp](); } catch (e) {}
      if (!document.body.contains(el) || !visible(el)) return true;
    }
    // a) un bouton de fermeture explicite dans la fenêtre
    // Fenêtre statique : le clic sur le fond est prévu pour la fermer
    if (el.classList.contains('modal')) {
      try { el.dispatchEvent(new MouseEvent('click', { bubbles: true })); } catch (e) {}
      if (el.classList.contains('active') && visible(el)) el.classList.remove('active');
      return true;
    }
    var cands = el.querySelectorAll('button,[role="button"]');
    for (var i = 0; i < cands.length; i++) {
      var b = cands[i];
      var t = (b.textContent || '').trim();
      var lbl = (b.getAttribute('aria-label') || '') + ' ' + (b.getAttribute('title') || '');
      var oc = b.getAttribute('onclick') || '';
      // Uniquement des boutons de FERMETURE sans ambiguïté. ⚠️ Un « ✕ » seul
      // ne suffit pas : dans l'éditeur de routine, « ✕ » SUPPRIME un exercice.
      // On exige donc un libellé explicite, ou une action de fermeture.
      // « .remove() » compte seulement s'il vise CETTE fenêtre (par son id) :
      // ailleurs, il peut retirer une ligne de liste.
      var vise = el.id && oc.indexOf(el.id) >= 0 && /\.remove\(\)/.test(oc);
      var action = (/close|fermer/i.test(oc) || vise) && !/_remove|supprim|delete|retir/i.test(oc);
      if (/^(Fermer|Annuler|↩ Annuler)$/.test(t) || /fermer|close/i.test(lbl) ||
          (action && /^(×|✕|✖|x|X)?$/.test(t))) {
        try { b.click(); } catch (e) {}
        if (!document.body.contains(el) || !visible(el)) return true;
      }
    }
    // b) un clic sur le fond (beaucoup de fenêtres se ferment ainsi)
    try { el.dispatchEvent(new MouseEvent('click', { bubbles: true })); } catch (e) {}
    if (!document.body.contains(el) || !visible(el)) return true;
    // d) fenêtre créée à la volée : retirée — mais jamais pendant une séance,
    //    où elle peut porter la suite du déroulement (on met en pause à la place)
    if (enSeance()) return false;
    el.remove();
    return true;
  }

  // Exposé pour les gestes (glisser une fenêtre vers le bas pour la fermer)
  window.awakFermerFenetre = function (el) { try { return fermer(el); } catch (e) { return false; } };

  function enSeance() {
    return document.body.classList.contains('in-session');
  }
  function surAccueil() {
    var h = document.getElementById('homeTab');
    return !!(h && h.classList.contains('active'));
  }

  var MODE_NATIF = false;   // app Capacitor : Android envoie l'appui directement
  function surRetour() {
    if (!MODE_NATIF && ignorer > 0) { ignorer--; return; }
    if (sortie) return;

    // 0. Course GPS en cours : Retour ne doit JAMAIS l'arrêter
    if (window.AwakRun && window.AwakRun.actif && window.AwakRun.actif() && document.getElementById('awakRunScreen')) {
      toast('Course en cours · touche « Terminer » pour l\'arrêter');
      garde();
      return;
    }

    // 1. Fenêtre ouverte
    var f = fenetreOuverte();
    if (f && fermer(f)) { garde(); return; }

    // 2. Séance en cours : pause, jamais de sortie accidentelle
    if (enSeance()) {
      var pb = document.getElementById('pauseBtn');
      var enPause = !!document.getElementById('awakPauseOverlay') || !!(pb && (pb.textContent || '').trim() === '▶');
      if (!enPause && typeof window.togglePause === 'function') {
        try { window.togglePause(); } catch (e) {}
        toast('Séance en pause');
      } else {
        toast('Séance en pause · utilise « Quitter » pour sortir');
      }
      garde();
      return;
    }

    // 3. Autre onglet → Accueil
    if (!surAccueil()) {
      try { if (typeof window.switchTab === 'function') window.switchTab('home'); } catch (e) {}
      try { window.scrollTo(0, 0); } catch (e) {}
      garde();
      return;
    }

    // 4. Accueil : double appui pour quitter
    var t = Date.now();
    if (MODE_NATIF) {
      if (t - dernierRetour < 2000) { if (window.AwakNative) window.AwakNative.retour.quitter(); return; }
      dernierRetour = t;
      toast('Appuie encore sur Retour pour quitter');
      return;
    }
    if (t - dernierRetour < 2000) {
      // 2ᵉ appui : on est déjà sur l'entrée de base (voir plus bas) — ce Retour
      // a quitté l'app nativement. Rien à faire.
      sortie = true;
      return;
    }
    dernierRetour = t;
    toast('Appuie encore sur Retour pour quitter');
    // On redescend sur l'entrée de base : le PROCHAIN Retour du téléphone
    // quittera l'application. Tout toucher entre-temps reconstitue la réserve
    // (on ne quitte alors plus au prochain Retour : un nouvel appui double
    // sera demandé).
    var d = profondeur();
    if (d > 0) { ignorer++; try { history.go(-d); } catch (e) { ignorer--; } }
    setTimeout(function () { dernierRetour = 0; if (!sortie) garde(); }, 2000);
  }

  function init() {
    // 📱 App Play Store (Capacitor) : on écoute le vrai bouton Retour
    try {
      if (window.AwakNative && window.AwakNative.retour.natif()
          && window.AwakNative.retour.ecouter(function () { surRetour(); })) {
        MODE_NATIF = true;
        return;
      }
    } catch (e) {}
    try {
      if (!history.state || (!history.state.awakBase && !history.state.awakGarde)) history.replaceState({ awakBase: 1 }, '');
      garde();
      window.addEventListener('popstate', surRetour);
      // Chaque vrai geste reconstitue la réserve (entrées non « sautables »)
      ['pointerup', 'click', 'keydown', 'touchend'].forEach(function (ev) {
        window.addEventListener(ev, function () { if (!sortie) remplir(); }, true);
      });
    } catch (e) {}
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
