/* ═══════════════════════════════════════════════════════════════════════
   🚫  INTERFACE SANS EMOJI — Awakened
   -----------------------------------------------------------------------
   Retire les emojis du TEXTE AFFICHÉ, à l'exécution, sans modifier une
   seule donnée enregistrée.

   POURQUOI UN FILTRE PLUTÔT QUE 4 000 MODIFICATIONS
   L'app contient plus de 4 000 emojis visibles. Beaucoup ne sont pas de la
   décoration mais des DONNÉES : avatars des membres, emoji d'une routine,
   d'un badge, d'un programme. Les supprimer dans le code effacerait
   l'identité visuelle des profils et corromprait des champs enregistrés.
   Un filtre au rendu est réversible, testable, et ne touche à rien.

   CE QUI EST PRÉSERVÉ
   • Tout élément portant `data-emoji-keep` (les avatars en premier lieu).
   • Les champs de saisie : on ne réécrit jamais ce que l'utilisateur tape.
   • Les données en mémoire et en stockage : inchangées.

   ⚠️ Le filtre agit sur les NŒUDS DE TEXTE uniquement. Il ne touche ni aux
      attributs, ni au HTML, donc il ne peut pas casser la mise en page.
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var CLE = 'awakSansEmoji';

  // Plages Unicode des emojis + sélecteurs de variante et modificateurs.
  // ⚠️ La plage 2600-27BF contient aussi des symboles PORTEURS DE SENS :
  //    ✓ ✔ (série validée, objectif atteint) et ✕ ✖ (fermer). Les retirer
  //    supprimerait l'information, pas la décoration. On saute donc
  //    2713-2716 dans la plage.
  var RE_EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{2712}\u{2717}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}\u{20E3}\u{E0020}-\u{E007F}]/gu;

  function cle() {
    try {
      var id = (typeof getCurrentProfileId === 'function') ? getCurrentProfileId() : null;
      return id ? CLE + '_' + id : CLE;
    } catch (e) { return CLE; }
  }

  // ⚠️ ACTIF PAR DÉFAUT.
  // Un testeur a trouvé que l'app « ressemblait à une application faite par
  // une IA », à cause des emojis. C'est le premier jugement porté sur le
  // produit : il doit donc être sobre d'emblée, et non après un réglage que
  // personne ne va chercher. Seul un « 0 » explicite réactive les emojis.
  function actif() {
    try { return localStorage.getItem(cle()) !== '0'; } catch (e) { return true; }
  }

  function definir(on) {
    try { localStorage.setItem(cle(), on ? '1' : '0'); } catch (e) {}
    if (on) { demarrer(); balayer(document.body); }
    else { arreter(); location.reload(); }   // seul moyen fiable de remettre les emojis
  }

  // Un nœud est-il protégé ? (avatar, champ de saisie, script…)
  function protege(noeud) {
    var n = noeud;
    while (n && n !== document.body) {
      if (n.nodeType === 1) {
        var t = n.tagName;
        if (t === 'INPUT' || t === 'TEXTAREA' || t === 'SCRIPT' || t === 'STYLE' || t === 'SVG') return true;
        if (n.hasAttribute && n.hasAttribute('data-emoji-keep')) return true;
      }
      n = n.parentNode;
    }
    return false;
  }

  // Losanges et étoiles décoratifs placés devant les titres de section.
  // ⚠️ Un testeur a identifié ce motif — « ◈ TON PARCOURS », « ✦ ENSEMBLE » —
  //    comme une signature d'interface générée. On les retire avec les emojis.
  //    Les ✓ et les flèches ne sont PAS touchés : ils portent du sens.
  var RE_DECOR = /[◈✦◆❖✧]\s*/g;

  function nettoyerTexte(txt) {
    var out = txt.replace(RE_EMOJI, '').replace(RE_DECOR, '');
    // Espaces doubles et séparateurs orphelins laissés par l'emoji retiré
    out = out.replace(/[ \t]{2,}/g, ' ')
             .replace(/^\s*[·•\-–]\s*/, '')
             // ⚠️ En français, « ! ? : ; » prennent une espace AVANT : on ne
             //    resserre que la virgule et le point, sinon on produit
             //    « Séance terminée! » et « Attention: ».
             .replace(/\s+([,.])/g, '$1');
    return out;
  }

  // Parcourt les nœuds de texte d'un sous-arbre et retire les emojis.
  function balayer(racine) {
    if (!racine || !document.createTreeWalker) return;
    try {
      var tw = document.createTreeWalker(racine, NodeFilter.SHOW_TEXT, null);
      var lot = [], n;
      while ((n = tw.nextNode())) {
        var v = n.nodeValue;
        if (!v) continue;
        var aEmoji = RE_EMOJI.test(v); RE_EMOJI.lastIndex = 0;
        var aDecor = RE_DECOR.test(v); RE_DECOR.lastIndex = 0;
        if (!aEmoji && !aDecor) continue;
        lot.push(n);
      }
      lot.forEach(function (node) {
        if (protege(node.parentNode)) return;
        var propre = nettoyerTexte(node.nodeValue);
        if (propre !== node.nodeValue) node.nodeValue = propre;
      });
    } catch (e) {}
  }

  // L'app redessine en permanence : un observateur garde le filtre appliqué.
  var obs = null;
  function demarrer() {
    if (obs || !window.MutationObserver) return;
    obs = new MutationObserver(function (mutations) {
      for (var i = 0; i < mutations.length; i++) {
        var m = mutations[i];
        for (var j = 0; j < m.addedNodes.length; j++) {
          var n = m.addedNodes[j];
          if (n.nodeType === 3) {
            if (!protege(n.parentNode)) {
              var p = nettoyerTexte(n.nodeValue || '');
              if (p !== n.nodeValue) n.nodeValue = p;
            }
          } else if (n.nodeType === 1) {
            balayer(n);
          }
        }
      }
    });
    obs.observe(document.body, { childList: true, subtree: true });
  }
  function arreter() {
    if (obs) { try { obs.disconnect(); } catch (e) {} obs = null; }
  }

  // ── Réglage ──
  function rendreInterrupteur() {
    var on = actif();
    return '<div onclick="AwakSansEmoji.basculer()" style="cursor:pointer;display:flex;align-items:center;'
      + 'gap:12px;padding:13px 14px;border-radius:13px;background:' + (on ? 'rgba(34,211,238,0.08)' : 'rgba(255,255,255,0.025)')
      + ';border:1px solid ' + (on ? 'rgba(34,211,238,0.35)' : 'rgba(255,255,255,0.08)') + ';">'
      + '<div style="flex:1;min-width:0;">'
      +   '<div style="font-size:0.84em;font-weight:800;color:#e8f0f8;">Interface sans emoji</div>'
      +   '<div style="font-size:0.7em;color:#94a3b8;margin-top:2px;line-height:1.4;">'
      +     'Activé par défaut. Désactive-le si tu préfères les emojis. '
      +     'Les avatars des membres sont toujours conservés.</div>'
      + '</div>'
      + '<span style="flex-shrink:0;width:44px;height:25px;border-radius:99px;position:relative;'
      +   'background:' + (on ? '#22d3ee' : 'rgba(255,255,255,0.12)') + ';transition:background .2s;">'
      +   '<span style="position:absolute;top:3px;left:' + (on ? '22px' : '3px') + ';width:19px;height:19px;'
      +     'border-radius:50%;background:#fff;transition:left .2s;"></span>'
      + '</span>'
      + '</div>';
  }

  window.AwakSansEmoji = {
    actif: actif,
    definir: definir,
    balayer: balayer,
    rendreInterrupteur: rendreInterrupteur,
    basculer: function () {
      var futur = !actif();
      definir(futur);
      if (futur && typeof window.showToast === 'function') {
        window.showToast('Interface sans emoji activée', 'success', 2600);
      }
      // Rafraîchir l'interrupteur lui-même
      var h = document.getElementById('awakSansEmojiHost');
      if (h) h.innerHTML = rendreInterrupteur();
    }
  };

  // Application au démarrage si le réglage est actif
  function init() {
    if (!actif()) return;
    demarrer();
    balayer(document.body);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
