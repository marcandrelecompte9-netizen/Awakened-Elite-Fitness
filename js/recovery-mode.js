/* ═══════════════════════════════════════════════════════════════════
   MODE RÉCUPÉRATION — convalescence sans perte de progression
   ───────────────────────────────────────────────────────────────────
   Quand l'utilisateur est blessé ou doit s'arrêter, ce mode GÈLE sa
   progression RPG au lieu de la stopper :
     • le decay (perte d'XP par inactivité) est mis en pause ;
     • le jeu reste accessible (personnage, arbre, rang visibles) ;
     • à la reprise, les dates d'entraînement sont « rembobinées » de la
       durée de la pause, pour que la convalescence ne soit JAMAIS comptée
       rétroactivement comme de l'inactivité.
   Thème : le chasseur blessé se régénère avant de repartir au combat.
   Ce n'est pas un avis médical : suis les conseils de ton professionnel
   de santé pour la reprise.
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var KEY = 'awakRecoveryMode';   // { active:true, since:ISO } ou absent

  function _load() {
    try { return JSON.parse(localStorage.getItem(KEY) || 'null'); }
    catch (e) { return null; }
  }
  function _save(obj) {
    try {
      if (obj) localStorage.setItem(KEY, JSON.stringify(obj));
      else localStorage.removeItem(KEY);
    } catch (e) {}
  }

  function isActive() {
    var s = _load();
    return !!(s && s.active);
  }

  function since() {
    var s = _load();
    return (s && s.since) ? new Date(s.since) : null;
  }

  // Nombre de jours écoulés depuis l'activation.
  function daysActive() {
    var d = since();
    if (!d) return 0;
    return Math.max(0, (Date.now() - d.getTime()) / 86400000);
  }

  // Active le mode récupération (gèle la progression).
  function activate() {
    _save({ active: true, since: new Date().toISOString() });
  }

  // Désactive le mode et REMBOBINE les dates d'entraînement de la durée de la
  // pause, pour que le decay ne se déclenche pas rétroactivement.
  function deactivate() {
    var s = _load();
    if (!s || !s.since) { _save(null); return; }

    var pauseMs = Date.now() - new Date(s.since).getTime();
    if (pauseMs < 0) pauseMs = 0;

    // Avance une date d'entraînement de la durée de pause, SANS jamais dépasser
    // "maintenant" (sinon on créerait une date future = decay négatif/aberrant).
    var nowMs = Date.now();
    function _shift(iso) {
      var t = new Date(iso).getTime() + pauseMs;
      if (t > nowMs) t = nowMs;   // plafond : au plus "aujourd'hui"
      return new Date(t).toISOString();
    }

    try {
      if (typeof window.rpgLoad === 'function' && typeof window.rpgSave === 'function') {
        var data = window.rpgLoad();
        if (data && data.muscles) {
          Object.keys(data.muscles).forEach(function (m) {
            var info = data.muscles[m];
            if (info && info.lastTrained) info.lastTrained = _shift(info.lastTrained);
          });
        }
        if (data && data.profile && data.profile.lastActivity) {
          data.profile.lastActivity = _shift(data.profile.lastActivity);
        }
        window.rpgSave(data);
      }
    } catch (e) {}

    _save(null);
  }

  window.AwakRecovery = {
    isActive: isActive,
    since: since,
    daysActive: daysActive,
    activate: activate,
    deactivate: deactivate
  };

  // ═══════════════════════════════════════════════════════════════════
  // INTERFACE
  // ═══════════════════════════════════════════════════════════════════
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  // Bandeau d'état à afficher sur l'accueil quand le mode est actif.
  function renderBanner() {
    if (!isActive()) return '';
    var d = Math.floor(daysActive());
    var dur = d === 0 ? "depuis aujourd'hui" : (d === 1 ? 'depuis 1 jour' : 'depuis ' + d + ' jours');
    return '<div style="margin-bottom:14px;padding:14px 16px;border-radius:16px;background:linear-gradient(135deg,rgba(56,189,248,0.12),rgba(14,165,233,0.06));border:1px solid rgba(56,189,248,0.4);">'
      + '<div style="display:flex;align-items:center;gap:12px;">'
      +   '<span style="font-size:1.6em;">🛡️</span>'
      +   '<div style="flex:1;min-width:0;">'
      +     '<div style="font-weight:800;color:#7dd3fc;font-size:0.92em;">Mode récupération actif</div>'
      +     '<div style="font-size:0.78em;color:#94a3b8;line-height:1.35;margin-top:2px;">Ta progression est gelée et protégée ' + dur + '. Prends soin de toi.</div>'
      +   '</div>'
      + '</div>'
      + '<button onclick="AwakRecoveryEnd()" style="width:100%;margin-top:12px;padding:11px;border:none;border-radius:11px;cursor:pointer;background:linear-gradient(135deg,#22c55e,#16a34a);color:#fff;font-weight:800;font-size:0.86em;">Je suis prêt à reprendre 💪</button>'
      + '</div>';
  }

  function updateBanner() {
    var host = document.getElementById('recoveryBannerContainer');
    if (host) host.innerHTML = renderBanner();
  }
  window.AwakRecovery.renderBanner = renderBanner;
  window.AwakRecovery.updateBanner = updateBanner;

  // Proposition d'activation (modale de confirmation).
  window.AwakRecoveryOffer = function () {
    var overlay = document.createElement('div');
    overlay.id = 'awakRecoveryModal';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px;';
    overlay.onclick = function (e) { if (e.target === overlay) overlay.remove(); };
    overlay.innerHTML = '<div style="background:linear-gradient(160deg,#0e1a24,#0d0d12);border:1px solid rgba(56,189,248,0.35);border-radius:22px;padding:24px;max-width:400px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,0.6);">'
      + '<div style="text-align:center;font-size:2.6em;margin-bottom:6px;">🛡️</div>'
      + '<div style="text-align:center;font-size:1.2em;font-weight:900;color:#fff;margin-bottom:10px;">Activer le mode récupération ?</div>'
      + '<div style="font-size:0.85em;color:#cbd5e1;line-height:1.5;margin-bottom:8px;">Pensé pour les blessures ou les pauses forcées. Pendant ce mode :</div>'
      + '<div style="font-size:0.82em;color:#94a3b8;line-height:1.7;margin-bottom:16px;">'
      +   '✅ Ta progression est <b style="color:#7dd3fc;">gelée</b> — aucune perte d\'XP ni de niveau.<br>'
      +   '✅ Ton personnage, ton arbre et ton rang restent visibles.<br>'
      +   '✅ Tu reprends quand tu veux, exactement où tu t\'étais arrêté.'
      + '</div>'
      + '<div style="font-size:0.72em;color:#64748b;line-height:1.4;margin-bottom:16px;">Suis les conseils de ton professionnel de santé pour la reprise. Une reprise en douceur (mode mobilité réduite) peut aider.</div>'
      + '<button onclick="AwakRecoveryConfirm()" style="width:100%;padding:13px;border:none;border-radius:12px;cursor:pointer;background:linear-gradient(135deg,#38bdf8,#0ea5e9);color:#fff;font-weight:800;font-size:0.9em;margin-bottom:8px;">Activer le mode récupération</button>'
      + '<button onclick="document.getElementById(\'awakRecoveryModal\').remove()" style="width:100%;padding:11px;border:none;border-radius:11px;cursor:pointer;background:rgba(255,255,255,0.05);color:#94a3b8;font-weight:700;font-size:0.82em;">Annuler</button>'
      + '</div>';
    document.body.appendChild(overlay);
  };

  window.AwakRecoveryConfirm = function () {
    activate();
    var el = document.getElementById('awakRecoveryModal'); if (el) el.remove();
    updateBanner();
    if (typeof window.showToast === 'function') window.showToast('🛡️ Mode récupération activé — ta progression est protégée', 'success', 3500);
  };

  window.AwakRecoveryEnd = function () {
    deactivate();
    updateBanner();
    if (typeof window.showToast === 'function') window.showToast('💪 Bon retour ! Ta progression t\'attendait.', 'success', 3500);
    if (typeof window.updateHomeStats === 'function') { try { window.updateHomeStats(); } catch (e) {} }
  };
})();
