/* ═══════════════════════════════════════════════════════════════════
   ESSAI GRATUIT 7 JOURS PUIS ACHAT UNIQUE — Awakened (v1283)
   ─────────────────────────────────────────────────────────────────────
   • Tout est ouvert pendant 7 jours à partir du 1er lancement.
   • Ensuite, l'appli est bloquée par un écran d'achat tant que
     « Awakened complet » (achat unique Google Play) n'est pas acheté.
     Les données ne sont jamais effacées : l'achat rouvre tout.
   • Actif SEULEMENT dans l'app Android (Capacitor) : aucun paiement n'est
     possible dans la PWA GitHub Pages, qui reste donc ouverte.
     Test dans le navigateur : ?essai=1 (essai normal), ?essai=fini
     (essai terminé), ?essai=0 (désactive) — faux magasin intégré.
   • Pour tout l'appareil (pas par profil) : un achat couvre la famille.
   • Une séance en cours n'est jamais coupée : le blocage attend la fin.
   • Horloge reculée : on retient la date la plus avancée déjà vue.

   MODULE D'ACHAT VISÉ : cordova-plugin-purchase (v13, objet CdvPurchase),
   compatible Capacitor. Produit Play Console : PRODUIT_ID ci-dessous,
   type « produit intégré » (non consommable).
   ⚠️ Écrit d'après la doc du module, pas testé sur un vrai téléphone :
   toute la partie magasin est dans magasinNatif() — seul endroit à
   adapter si le module change.
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var PRODUIT_ID = 'awakened_complet';
  var JOURS = 7;
  var PRIX_DEFAUT = '9,99 $';
  var K_DEBUT = 'awakEssaiDebut', K_VU = 'awakEssaiVu', K_ACHAT = 'awakEssaiAchat',
      K_RAPPEL = 'awakEssaiRappel', K_TEST = 'awakEssaiTest';
  var JOUR_MS = 864e5;

  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function lsDel(k) { try { localStorage.removeItem(k); } catch (e) {} }

  function estNatif() {
    try { var c = window.Capacitor; return !!(c && (typeof c.isNativePlatform === 'function' ? c.isNativePlatform() : c.isNative)); }
    catch (e) { return false; }
  }
  // Mode test navigateur : ?essai=1 / ?essai=fini / ?essai=0
  (function () {
    try {
      var m = /[?&]essai=([^&#]+)/.exec(location.search || '');
      if (!m) return;
      if (m[1] === '0') { lsDel(K_TEST); return; }
      lsSet(K_TEST, '1');
      if (m[1] === 'fini') { lsSet(K_DEBUT, String(Date.now() - (JOURS + 1) * JOUR_MS)); lsDel(K_ACHAT); }
    } catch (e) {}
  })();
  function enTest() { return lsGet(K_TEST) === '1'; }
  function actif() { return !window.__AWAK_SANS_ESSAI && (estNatif() || enTest()); }

  // ── Dates de l'essai ───────────────────────────────────────────
  function maintenant() {
    var n = Date.now(), vu = parseInt(lsGet(K_VU), 10) || 0;
    if (n > vu) { lsSet(K_VU, String(n)); return n; }
    return vu;                                     // horloge reculée : on garde la plus avancée
  }
  function debut() {
    var d = parseInt(lsGet(K_DEBUT), 10);
    if (!d || isNaN(d)) { d = Date.now(); lsSet(K_DEBUT, String(d)); }
    return d;
  }
  function joursRestants() {
    var reste = debut() + JOURS * JOUR_MS - maintenant();
    return Math.max(0, Math.ceil(reste / JOUR_MS));
  }
  function achete() { return lsGet(K_ACHAT) === '1'; }
  function termine() { return actif() && !achete() && joursRestants() <= 0; }

  // ── Magasin ────────────────────────────────────────────────────
  var M = null;
  function magasinNatif() {
    var C = window.CdvPurchase; if (!C || !C.store) return null;
    var store = C.store, prix = null, attente = null;
    function possede() { try { var p = store.get(PRODUIT_ID); return !!(p && p.owned); } catch (e) { return false; } }
    function maj() {
      try { var p = store.get(PRODUIT_ID); if (p && p.pricing && p.pricing.price) prix = p.pricing.price; } catch (e) {}
      if (possede()) debloquer();
    }
    try {
      store.register([{ id: PRODUIT_ID, type: C.ProductType.NON_CONSUMABLE, platform: C.Platform.GOOGLE_PLAY }]);
      store.when()
        .productUpdated(maj)
        .approved(function (t) { try { t.finish(); } catch (e) {} })   // accuse réception (obligatoire chez Google)
        .finished(function () { debloquer(); if (attente) { attente(true); attente = null; } })
        .receiptUpdated(maj);
      store.error(function (e) { if (attente) { attente(false, e && e.message); attente = null; } });
      store.initialize([C.Platform.GOOGLE_PLAY]).then(maj).catch(function () {});
    } catch (e) { return null; }
    return {
      prix: function () { return prix || PRIX_DEFAUT; },
      acheter: function (cb) {
        try {
          var p = store.get(PRODUIT_ID), o = p && p.getOffer && p.getOffer();
          if (!o) return cb(false, 'Le Play Store ne répond pas. Vérifie ta connexion.');
          attente = cb;
          o.order().then(function (err) { if (err && attente) { attente(false, err.message); attente = null; } });
        } catch (e) { cb(false, 'Achat impossible pour le moment.'); }
      },
      restaurer: function (cb) {
        try { store.restorePurchases().then(function () { maj(); cb(possede()); }).catch(function () { cb(false); }); }
        catch (e) { cb(false); }
      }
    };
  }
  function fauxMagasin() {
    return {
      prix: function () { return PRIX_DEFAUT; },
      acheter: function (cb) { setTimeout(function () { debloquer(); cb(true); }, 400); },
      restaurer: function (cb) { setTimeout(function () { cb(achete()); }, 300); }
    };
  }
  function magasin() {
    if (M) return M;
    M = estNatif() ? magasinNatif() : (enTest() ? fauxMagasin() : null);
    return M;
  }

  // ── Écran de fin d'essai ───────────────────────────────────────
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function resume() {
    try {
      var st = JSON.parse(lsGet('workoutStats') || '{}'), n = st.workouts || 0;
      var rpg = JSON.parse(lsGet('fitproRPG') || 'null'), niv = rpg && (rpg.level || rpg.niveau);
      var bouts = [];
      if (n) bouts.push(n + ' séance' + (n > 1 ? 's' : ''));
      if (niv) bouts.push('niveau ' + niv);
      return bouts.length ? 'Tes ' + bouts.join(' · ') + ' sont gardés.' : 'Tout ce que tu as fait est gardé.';
    } catch (e) { return 'Tout ce que tu as fait est gardé.'; }
  }
  function enSeance() { return document.body && document.body.classList.contains('in-session'); }

  function montrerBlocage() {
    if (document.getElementById('awakPremiumMur')) return;
    var mg = magasin();
    var ov = document.createElement('div');
    ov.id = 'awakPremiumMur';
    ov.setAttribute('data-emoji-keep', '');
    ov.setAttribute('data-feuille-bas', '');
    ov.style.cssText = 'position:fixed;inset:0;z-index:2147483000;background:radial-gradient(120% 80% at 50% 0%,#12233a 0%,#07090f 60%) !important;'
      + 'display:flex;align-items:center;justify-content:center;padding:24px 18px;overflow-y:auto;';
    ov.innerHTML =
      '<div style="width:100%;max-width:400px;text-align:center;color:#e2e8f0;font-family:inherit;">'
      + '<div style="width:64px;height:64px;margin:0 auto 18px;border-radius:18px;display:grid;place-items:center;background:rgba(34,211,238,0.12);border:1px solid rgba(34,211,238,0.45);">'
      +   '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>'
      + '</div>'
      + '<div style="font-size:0.66em;font-weight:900;letter-spacing:3px;color:#22d3ee;margin-bottom:8px;">ESSAI TERMINÉ</div>'
      + '<div style="font-size:1.45em;font-weight:900;color:#fff;line-height:1.25;margin-bottom:10px;">Ta semaine d\'essai est finie</div>'
      + '<div style="font-size:0.92em;color:#cbd5e1;line-height:1.55;margin-bottom:6px;">Débloque Awakened pour continuer : séances, histoire, Failles, course et profils de toute la famille.</div>'
      + '<div style="font-size:0.84em;color:#94a3b8;line-height:1.5;margin-bottom:22px;">' + esc(resume()) + '</div>'
      + '<div style="display:flex;flex-direction:column;gap:6px;margin-bottom:20px;text-align:left;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:12px 14px;font-size:0.84em;color:#cbd5e1;">'
      +   ['Un seul paiement, pas d\'abonnement', 'Pour tous les profils de l\'appareil', 'Toutes les mises à jour à venir'].map(function (t) {
            return '<div style="display:flex;align-items:center;gap:9px;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5L20 7"/></svg>' + t + '</div>';
          }).join('')
      + '</div>'
      + '<button id="awakEssaiAcheter" style="width:100%;padding:16px !important;border:none;border-radius:14px;cursor:pointer;font-family:inherit;font-weight:900;font-size:1.02em;'
      +   'background:linear-gradient(135deg,#22d3ee,#0891b2) !important;color:#04121f !important;box-shadow:0 8px 24px rgba(34,211,238,0.3);">Débloquer Awakened · <span id="awakEssaiPrix">' + esc(mg ? mg.prix() : PRIX_DEFAUT) + '</span></button>'
      + '<button id="awakEssaiRestaurer" style="width:100%;margin-top:10px;padding:12px !important;border:1px solid rgba(255,255,255,0.14);border-radius:12px;cursor:pointer;font-family:inherit;font-weight:800;font-size:0.86em;background:rgba(255,255,255,0.04) !important;color:#cbd5e1 !important;">Restaurer mon achat</button>'
      + '<div id="awakEssaiMsg" style="min-height:1.4em;margin-top:12px;font-size:0.8em;color:#fbbf24;"></div>'
      + '</div>';
    document.body.appendChild(ov);
    try { document.body.style.overflow = 'hidden'; } catch (e) {}
    var msg = ov.querySelector('#awakEssaiMsg');
    function occupe(on) { ['awakEssaiAcheter', 'awakEssaiRestaurer'].forEach(function (id) { var b = ov.querySelector('#' + id); if (b) { b.disabled = on; b.style.opacity = on ? '0.6' : '1'; } }); }
    ov.querySelector('#awakEssaiAcheter').onclick = function () {
      var m = magasin(); if (!m) { msg.textContent = 'Le Play Store n\'est pas disponible. Réessaie dans un instant.'; return; }
      occupe(true); msg.textContent = '';
      m.acheter(function (ok, err) { occupe(false); if (!ok) msg.textContent = err || 'Achat annulé.'; });
    };
    ov.querySelector('#awakEssaiRestaurer').onclick = function () {
      var m = magasin(); if (!m) { msg.textContent = 'Le Play Store n\'est pas disponible. Réessaie dans un instant.'; return; }
      occupe(true); msg.textContent = 'Recherche de ton achat…';
      m.restaurer(function (ok) { occupe(false); if (ok) debloquer(); else msg.textContent = 'Aucun achat trouvé sur ce compte Google.'; });
    };
    // Le prix réel arrive du Play Store après coup
    var t = setInterval(function () {
      var p = ov.isConnected && ov.querySelector('#awakEssaiPrix'); if (!p) return clearInterval(t);
      var m = magasin(); if (m) p.textContent = m.prix();
    }, 1500);
  }

  function debloquer() {
    lsSet(K_ACHAT, '1');
    var ov = document.getElementById('awakPremiumMur');
    if (ov) {
      ov.remove();
      try { document.body.style.overflow = ''; } catch (e) {}
      if (typeof window.showToast === 'function') window.showToast('Merci ! Awakened est débloqué pour de bon.', 'success', 3500);
    }
  }

  // ── Rappels doux pendant l'essai (dernier 3 jours, une fois par jour) ──
  function rappel() {
    var r = joursRestants(); if (r > 3 || r <= 0) return;
    var j = new Date(maintenant()).toDateString();
    if (lsGet(K_RAPPEL) === j) return;
    lsSet(K_RAPPEL, j);
    if (typeof window.showToast === 'function')
      window.showToast(r === 1 ? 'Dernier jour de ton essai gratuit.' : 'Plus que ' + r + ' jours d\'essai gratuit.', 'info', 4000);
  }

  // ── Vérification : au lancement, au retour dans l'app, et après une séance ──
  var attenteSeance = null;
  function verifier() {
    if (!actif()) return;
    debut(); magasin();
    if (achete()) return;
    if (!termine()) { setTimeout(rappel, 4000); return; }
    if (enSeance()) {                              // ne jamais couper une séance
      if (!attenteSeance) attenteSeance = setInterval(function () {
        if (!enSeance()) { clearInterval(attenteSeance); attenteSeance = null; verifier(); }
      }, 3000);
      return;
    }
    montrerBlocage();
  }
  function demarrer() {
    verifier();
    // Si une fenêtre (bouton Retour, geste, autre script) retire l'écran d'achat : on le remet.
    try {
      new MutationObserver(function () {
        if (!document.getElementById('awakPremiumMur') && termine() && !enSeance()) montrerBlocage();
      }).observe(document.body, { childList: true });
    } catch (e) {}
    document.addEventListener('visibilitychange', function () { if (!document.hidden) verifier(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(demarrer, 600); });
  else setTimeout(demarrer, 600);

  window.AwakEssai = {
    actif: actif, achete: achete, termine: termine, joursRestants: joursRestants, verifier: verifier,
    acheter: function (cb) { var m = magasin(); if (m) m.acheter(cb || function () {}); },
    restaurer: function (cb) { var m = magasin(); if (m) m.restaurer(cb || function () {}); },
    PRODUIT_ID: PRODUIT_ID, JOURS: JOURS
  };
})();
