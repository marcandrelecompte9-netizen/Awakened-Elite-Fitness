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
  // Le réglage a été retiré : le filtre est toujours actif. Un ancien « 0 »
  // enregistré est ignoré.
  function actif() { return true; }

  function definir(on) {
    try { localStorage.setItem(cle(), on ? '1' : '0'); } catch (e) {}
    if (on) { injecterStyles(); demarrer(); balayer(document.body); }
    else { arreter(); location.reload(); }   // seul moyen fiable de remettre les emojis
  }

  // Un nœud est-il protégé ? (avatar, champ de saisie, script…)
  function protege(noeud) {
    var n = noeud;
    while (n && n !== document.body) {
      if (n.nodeType === 1) {
        var t = n.tagName;
        // ⚠️ PIÈGE DOM : tagName est en MAJUSCULES pour les éléments HTML, mais
        //    un <svg> inséré via innerHTML garde sa casse d'origine — son
        //    tagName vaut 'svg', jamais 'SVG'. Le test ci-dessous ne se
        //    déclenchait donc JAMAIS : le filtre parcourait l'intérieur des
        //    icônes SVG d'équipement (textes « kg », structure) et cassait
        //    leur rendu. On compare en minuscules pour couvrir les deux cas.
        var tb = t ? t.toLowerCase() : '';
        if (tb === 'input' || tb === 'textarea' || tb === 'script' || tb === 'style' || tb === 'svg') return true;
        // Toute balise DANS un <svg> (path, circle, text, rect…) doit aussi
        // être protégée — pas seulement la racine.
        if (n.ownerSVGElement || (n.namespaceURI && n.namespaceURI.indexOf('svg') >= 0)) return true;
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

  // Sigles à NE PAS remettre en casse normale : ce sont des termes, pas des cris.
  var SIGLES = ['AMRAP', 'EMOM', 'HIIT', 'RPE', 'IMC', 'TRX', 'PPL', 'RM', 'XP', 'PR', 'KG', 'LB', 'LBS'];

  // « SÉANCE TERMINÉE » → « Séance terminée ».
  // ⚠️ On raisonne sur le TITRE ENTIER, pas mot par mot : traiter chaque mot
  //    séparément laissait les mots courts en capitales (« TON Parcours »,
  //    « MES Routines »), pire que de ne rien faire.
  //    On ne convertit que si TOUT le texte est en capitales et contient au
  //    moins un mot de 4 lettres — sinon « XP », « 1RM » ou « RPE » seraient
  //    transformés à tort.
  function casseNormale(txt) {
    var t = txt.trim();
    if (!t) return txt;
    if (/[a-zà-ÿ]/.test(t)) return txt;              // contient déjà des minuscules
    if (!/[A-ZÀ-Ý]{4,}/.test(t)) return txt;         // pas de vrai mot : sigle isolé
    if (SIGLES.indexOf(t) >= 0) return txt;

    var bas = t.toLowerCase();
    // Restaure les sigles connus à l'intérieur de la phrase
    SIGLES.forEach(function (sig) {
      bas = bas.replace(new RegExp('\\b' + sig.toLowerCase() + '\\b', 'g'), sig);
    });
    var res = bas.charAt(0).toUpperCase() + bas.slice(1);
    // Conserve les espaces d'origine autour du texte
    return txt.replace(t, res);
  }

  // ── EMOJIS NÉCESSAIRES ─────────────────────────────────────────────
  // Certains emojis ne décorent pas : ils SONT le contenu d'un contrôle.
  // Les retirer laissait des boutons vides (sélecteurs d'icône, réactions,
  // bouton « ⭐ » seul…) ou des échelles illisibles (😊 → 😰 de la difficulté).
  // On les conserve dans deux cas :
  //   1. le contrôle cliquable n'aurait plus AUCUN contenu visible sans eux ;
  //   2. l'emoji est seul dans son propre élément, affiché en grand, à
  //      l'intérieur d'un contrôle cliquable (carte de choix, échelle).
  var SEL_CTRL = 'button,a,label,option,[onclick],[role="button"],[role="tab"],[role="radio"]';

  function tailleGrande(el) {
    try {
      var fs = el.style && el.style.fontSize;
      if (!fs) return false;
      var v = parseFloat(fs);
      if (/em|rem/.test(fs)) return v >= 1.4;
      if (/px/.test(fs)) return v >= 22;
    } catch (e) {}
    return false;
  }

  function necessaire(noeudTexte) {
    try {
      var parent = noeudTexte.parentNode;
      if (!parent || !parent.closest) return false;
      var ctrl = parent.closest(SEL_CTRL);
      if (!ctrl) return false;
      // Cas 1 : sans emoji, le contrôle serait vide (pas de texte, pas d'icône)
      var reste = (ctrl.textContent || '').replace(RE_EMOJI, '').replace(RE_DECOR, '').trim();
      if (!reste && !ctrl.querySelector('svg,img')) return true;
      // Cas 2 : emoji seul dans son élément, en grand, dans un contrôle
      var propre = (parent.textContent || '').replace(RE_EMOJI, '').trim();
      if (!propre && parent !== ctrl && tailleGrande(parent)) return true;
    } catch (e) {}
    return false;
  }

  function nettoyerTexte(txt) {
    var out = txt.replace(RE_EMOJI, '').replace(RE_DECOR, '');

    // Ton : on retire les points d'exclamation. « Séance terminée ! » devient
    // « Séance terminée ». Une app d'entraînement sérieuse constate, elle
    // n'acclame pas.
    // ⚠️ Supprimer le « ! » sec collait les phrases : « Séance terminée Bravo ».
    //    En milieu de texte il devient un point ; en fin, il disparaît.
    out = out.replace(/\s*!+(\s+)(?=[A-ZÀ-Ý0-9])/g, '.$1');
    out = out.replace(/\s*!+/g, '');

    out = casseNormale(out);
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
        if (necessaire(node)) return;
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
            if (!protege(n.parentNode) && !necessaire(n)) {
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

  // Les majuscules viennent AUSSI du CSS (223 règles text-transform:uppercase,
  // souvent en style inline). Une feuille avec !important les neutralise sans
  // qu'il faille éditer chaque endroit.
  function injecterStyles() {
    if (document.getElementById('awakSobreStyles')) return;
    var st = document.createElement('style');
    st.id = 'awakSobreStyles';
    st.textContent =
      '[style*="uppercase"],[style*="UPPERCASE"]{text-transform:none!important;}' +
      '[style*="letter-spacing:2"],[style*="letter-spacing: 2"],' +
      '[style*="letter-spacing:3"],[style*="letter-spacing: 3"]{letter-spacing:0.06em!important;}';
    document.head.appendChild(st);
  }

  // Application au démarrage si le réglage est actif
  function init() {
    if (!actif()) return;
    injecterStyles();
    demarrer();
    balayer(document.body);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
